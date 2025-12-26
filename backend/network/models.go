package network

// RealtimeRate represents the real-time upload and download speed.
type RealtimeRate struct {
	Timestamp int64   `json:"timestamp"`
	DownBPS   float64 `json:"down_bps"`
	UpBPS     float64 `json:"up_bps"`
}

// HourlyPoint represents a single data point in the hourly statistics.
type HourlyPoint struct {
	OffsetMin int     `json:"offset_min"`
	DownBPS   float64 `json:"down_bps"`
	UpBPS     float64 `json:"up_bps"`
}

// HourlyStats represents the network speed over the last hour.
type HourlyStats struct {
	IntervalMin int           `json:"interval_min"`
	Points      []HourlyPoint `json:"points"`
}

// DailyTraffic represents the total traffic for a single day.
type DailyTraffic struct {
	Date      string `json:"date"`
	DownBytes int64 `json:"down_bytes"`
	UpBytes   int64 `json:"up_bytes"`
}

// SinceBootTraffic represents the total traffic since the system booted up.
type SinceBootTraffic struct {
	DownBytes int64 `json:"down_bytes"`
	UpBytes   int64 `json:"up_bytes"`
}

// Stats represents the consolidated traffic statistics.
type Stats struct {
	Daily7d   []DailyTraffic   `json:"daily_7d"`
	SinceBoot SinceBootTraffic `json:"since_boot"`
}
