package network

import (
	"fmt"
	"log"
	"sync"
	"time"

	psutil_net "github.com/shirou/gopsutil/v3/net"
)

const (
	wifiInterface        = "en1"
	sampleInterval       = 1 * time.Second
	persistenceInterval  = 1 * time.Minute
	maxSleepInterval     = 10 * time.Second
	movingAverageWindow  = 3
	hourlyPoints         = 60 // 60 minutes / 5 minutes
	hourlyInterval       = 1 * time.Minute
)

// IOStats holds the raw byte counters for an interface at a specific time.
type IOStats struct {
	Time      time.Time
	BytesSent uint64
	BytesRecv uint64
}

// Monitor handles all network monitoring, calculation, and aggregation.
type Monitor struct {
	db             *DBManager
	realtimeRate      RealtimeRate
	hourlyStats       HourlyStats
	trafficSinceStart SinceBootTraffic

	// Internal state
	mu                 sync.RWMutex
	initialSample      IOStats
	lastSample         IOStats
	downRateMA         *movingAverage
	upRateMA           *movingAverage
	hourlyRingBuffer   *ringBuffer
	
	// WebSocket hub
	hub *Hub
}

// NewMonitor creates and initializes a new Monitor.
func NewMonitor() (*Monitor, error) {
	db, err := NewDBManager()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize database manager: %w", err)
	}

	m := &Monitor{
		db:           db,
		downRateMA:   newMovingAverage(movingAverageWindow),
		upRateMA:     newMovingAverage(movingAverageWindow),
		hourlyRingBuffer: newRingBuffer(hourlyPoints),
		hub:          NewHub(),
	}

	// Initialize stats structures
	m.hourlyStats.IntervalMin = int(hourlyInterval.Minutes())
	m.hourlyStats.Points = make([]HourlyPoint, 0, hourlyPoints)

	// Fetch initial stats to establish a baseline
	initialStats, err := getInterfaceStats(wifiInterface)
	if err != nil {
		log.Printf("Warning: could not get initial stats for '%s': %v. Will retry.", wifiInterface, err)
		// Let it start anyway, the loop will handle recovery
	}
	m.lastSample = initialStats
	m.initialSample = initialStats
	m.trafficSinceStart.DownBytes = 0
	m.trafficSinceStart.UpBytes = 0


	return m, nil
}

// Start begins the monitoring goroutines.
func (m *Monitor) Start() {
	go m.hub.run()
	go m.sampleLoop()
	go m.persistenceLoop()
}

// Close cleans up resources.
func (m *Monitor) Close() {
	m.db.Close()
}

// GetRealtimeRate returns the latest calculated real-time rate.
func (m *Monitor) GetRealtimeRate() RealtimeRate {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.realtimeRate
}

// GetHourlyStats returns the aggregated stats for the last hour.
func (m *Monitor) GetHourlyStats() HourlyStats {
	m.mu.RLock()
	defer m.mu.RUnlock()
	// Build the points from the ring buffer on demand
	m.hourlyStats.Points = m.hourlyRingBuffer.getPoints()
	return m.hourlyStats
}

// GetStats returns the 7-day and since-boot statistics.
func (m *Monitor) GetStats() (Stats, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	
	daily7d, err := m.db.GetDailyTrafficForLast7Days()
	if err != nil {
		return Stats{}, err
	}

	return Stats{
		Daily7d:   daily7d,
		SinceBoot: m.trafficSinceStart,
	}, nil
}

// Hub returns the WebSocket hub.
func (m *Monitor) Hub() *Hub {
	return m.hub
}

// --- Internal loops and helpers ---

func (m *Monitor) sampleLoop() {
	ticker := time.NewTicker(sampleInterval)
	defer ticker.Stop()

	for range ticker.C {
		m.performSample()
	}
}

func (m *Monitor) persistenceLoop() {
	ticker := time.NewTicker(persistenceInterval)
	defer ticker.Stop()
	
	// Run once at the start
	m.persistSample()

	for range ticker.C {
		m.persistSample()
	}
}

func (m *Monitor) performSample() {
	currentStats, err := getInterfaceStats(wifiInterface)
	if err != nil {
		log.Printf("Error sampling interface: %v", err)
		// Pauses sampling as per requirements if interface is not available
		return
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	// Update total since start stats
	m.trafficSinceStart.UpBytes = currentStats.BytesSent - m.initialSample.BytesSent
	m.trafficSinceStart.DownBytes = currentStats.BytesRecv - m.initialSample.BytesRecv
	
	// Check for sleep/wake or initial sample
	deltaT := currentStats.Time.Sub(m.lastSample.Time).Seconds()
	if m.lastSample.Time.IsZero() || deltaT <= 0 || deltaT > maxSleepInterval.Seconds() {
		log.Printf("Interval too long (%.2fs) or invalid. Skipping rate calculation for this sample.", deltaT)
		m.lastSample = currentStats
		// Reset moving average to avoid a spike on the next valid sample
		m.downRateMA.reset()
		m.upRateMA.reset()
		return
	}

	// Calculate raw BPS, checking for counter resets
	var downBPS, upBPS float64
	if currentStats.BytesRecv >= m.lastSample.BytesRecv {
		downBPS = float64(currentStats.BytesRecv-m.lastSample.BytesRecv) / deltaT
	}
	if currentStats.BytesSent >= m.lastSample.BytesSent {
		upBPS = float64(currentStats.BytesSent-m.lastSample.BytesSent) / deltaT
	}

	// Update moving average
	smoothDownBPS := m.downRateMA.add(downBPS)
	smoothUpBPS := m.upRateMA.add(upBPS)
	
	// Update realtime rate for APIs
	m.realtimeRate = RealtimeRate{
		Timestamp: time.Now().Unix(),
		DownBPS:   smoothDownBPS,
		UpBPS:     smoothUpBPS,
	}

	// Update hourly ring buffer
	m.hourlyRingBuffer.add(downBPS, upBPS)

	// Update last sample
	m.lastSample = currentStats
	
	// Broadcast to WebSocket clients
	m.hub.broadcast <- m.realtimeRate
}

func (m *Monitor) persistSample() {
	m.mu.RLock()
	// Use the most recent sample for persistence
	sampleToPersist := m.lastSample
	m.mu.RUnlock()

	if sampleToPersist.Time.IsZero() {
		return // Don't persist if we have no valid sample
	}

	if err := m.db.UpdateSample(sampleToPersist); err != nil {
		log.Printf("Error persisting sample: %v", err)
	}
}


func getInterfaceStats(name string) (IOStats, error) {
	stats, err := psutil_net.IOCounters(true)
	if err != nil {
		return IOStats{}, fmt.Errorf("failed to get IOCounters: %w", err)
	}

	for _, s := range stats {
		if s.Name == name {
			return IOStats{
				Time:      time.Now(),
				BytesSent: s.BytesSent,
				BytesRecv: s.BytesRecv,
			}, nil
		}
	}

	return IOStats{}, fmt.Errorf("interface '%s' not found", name)
}

// --- Moving Average Helper ---

type movingAverage struct {
	window int
	values []float64
	index  int
	count  int
}

func newMovingAverage(window int) *movingAverage {
	return &movingAverage{
		window: window,
		values: make([]float64, window),
	}
}

func (ma *movingAverage) add(value float64) float64 {
	ma.values[ma.index] = value
	ma.index = (ma.index + 1) % ma.window
	if ma.count < ma.window {
		ma.count++
	}
	return ma.average()
}

func (ma *movingAverage) average() float64 {
	if ma.count == 0 {
		return 0
	}
	var sum float64
	for i := 0; i < ma.count; i++ {
		sum += ma.values[i]
	}
	return sum / float64(ma.count)
}

func (ma *movingAverage) reset() {
	ma.count = 0
	ma.index = 0
}


// --- Ring Buffer Helper for Hourly Stats ---

type hourlyBucket struct {
	downBPSSum float64
	upBPSSum   float64
	count      int
}

type ringBuffer struct {
	buckets    []hourlyBucket
	size       int
	cursor     int
	lastUpdate time.Time
}

func newRingBuffer(size int) *ringBuffer {
	return &ringBuffer{
		buckets:    make([]hourlyBucket, size),
		size:       size,
		lastUpdate: time.Now(),
	}
}

func (rb *ringBuffer) advance() {
	now := time.Now()
	// Loop to catch up for multiple missed intervals (e.g. after sleep)
	for now.Sub(rb.lastUpdate) > hourlyInterval {
		rb.cursor = (rb.cursor + 1) % rb.size
		rb.buckets[rb.cursor] = hourlyBucket{} // Reset the new bucket
		rb.lastUpdate = rb.lastUpdate.Add(hourlyInterval)
	}
}

func (rb *ringBuffer) add(downBPS, upBPS float64) {
	rb.advance()
	bucket := &rb.buckets[rb.cursor]
	bucket.downBPSSum += downBPS
	bucket.upBPSSum += upBPS
	bucket.count++
}

func (rb *ringBuffer) getPoints() []HourlyPoint {
	points := make([]HourlyPoint, 0, rb.size)
	for i := 0; i < rb.size; i++ {
		// Start from the oldest bucket and go to the newest
		idx := (rb.cursor + 1 + i) % rb.size
		bucket := rb.buckets[idx]

		var downAvg, upAvg float64
		if bucket.count > 0 {
			downAvg = bucket.downBPSSum / float64(bucket.count)
			upAvg = bucket.upBPSSum / float64(bucket.count)
		}

		// The last point is offset -5, the first is -60
		offset := (i - (rb.size - 1)) * int(hourlyInterval.Minutes())

		points = append(points, HourlyPoint{
			OffsetMin: offset,
			DownBPS:   downAvg,
			UpBPS:     upAvg,
		})
	}
	return points
}
