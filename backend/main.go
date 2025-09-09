package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os/exec"
	"sort"
	"strings"
	"time"

	"github.com/gorilla/websocket"
	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
	"github.com/shirou/gopsutil/v3/load"
	psutil_net "github.com/shirou/gopsutil/v3/net"
	"github.com/shirou/gopsutil/v3/process"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all connections
	},
}

func main() {
	// Setup CORS
	corsHandler := func(h http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			h.ServeHTTP(w, r)
		})
	}

	http.HandleFunc("/api/system/static", staticSystemInfoHandler)
	http.HandleFunc("/api/system/dynamic", dynamicSystemInfoHandler)
	http.HandleFunc("/ws/network", networkWebsocketHandler)

	fmt.Println("Server starting on :8000")
	log.Fatal(http.ListenAndServe(":8000", corsHandler(http.DefaultServeMux)))
}

type staticSystemInfo struct {
	OSVersion       string    `json:"os_version"`
	CPUInfo         string    `json:"cpu_info"`
	CPUCores        int       `json:"cpu_cores"`
	CPULogicalCores int       `json:"cpu_logical_cores"`
	TotalMemory     uint64    `json:"total_memory"`
	TotalDisk       uint64    `json:"total_disk"`
	LocalIP         string    `json:"local_ip"`
	BootTime        time.Time `json:"boot_time"`
	UptimeSeconds   float64   `json:"uptime_seconds"`
}

type dynamicSystemInfo struct {
	CPUPercent    float64     `json:"cpu_percent"`
	MemoryPercent float64     `json:"memory_percent"`
	MemoryUsed    uint64      `json:"memory_used"`
	DiskPercent   float64     `json:"disk_percent"`
	DiskUsed      uint64      `json:"disk_used"`
	LoadAverage   *load.AvgStat `json:"load_average"`
	Processes     []procInfo  `json:"processes"`
}

type procInfo struct {
	Pid        int32   `json:"pid"`
	Name       string  `json:"name"`
	CPUPercent float64 `json:"cpu_percent"`
	MemoryRss  uint64  `json:"memory_rss"`
}

type networkInfo struct {
	BytesSent uint64 `json:"bytes_sent"`
	BytesRecv uint64 `json:"bytes_recv"`
}

func getMacOSVersion() string {
	productName, err := exec.Command("sw_vers", "-productName").Output()
	if err != nil {
		return "N/A"
	}
	productVersion, err := exec.Command("sw_vers", "-productVersion").Output()
	if err != nil {
		return "N/A"
	}
	return fmt.Sprintf("%s %s", strings.TrimSpace(string(productName)), strings.TrimSpace(string(productVersion)))
}

func getLocalIP() string {
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		return "N/A"
	}
	defer conn.Close()
	localAddr := conn.LocalAddr().(*net.UDPAddr)
	return localAddr.IP.String()
}

func staticSystemInfoHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	cpuInfo, _ := cpu.Info()
	memInfo, _ := mem.VirtualMemory()
	diskInfo, _ := disk.Usage("/")
	hostInfo, _ := host.Info()
	bootTime := time.Unix(int64(hostInfo.BootTime), 0)
	uptime := time.Since(bootTime).Seconds()

	physicalCores, _ := cpu.Counts(false)
	logicalCores, _ := cpu.Counts(true)

	info := staticSystemInfo{
		OSVersion:       getMacOSVersion(),
		CPUInfo:         cpuInfo[0].ModelName,
		CPUCores:        physicalCores,
		CPULogicalCores: logicalCores,
		TotalMemory:     memInfo.Total,
		TotalDisk:       diskInfo.Total,
		LocalIP:         getLocalIP(),
		BootTime:        bootTime,
		UptimeSeconds:   uptime,
	}

	json.NewEncoder(w).Encode(info)
}

func dynamicSystemInfoHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	cpuPercent, err := cpu.Percent(0, false)
	if err != nil || len(cpuPercent) == 0 {
		log.Printf("Could not fetch CPU percentage: %v", err)
		// Handle error appropriately, maybe return a JSON error response
		return
	}
	memInfo, _ := mem.VirtualMemory()
	diskInfo, _ := disk.Usage("/")
	loadAvg, _ := load.Avg()

	procs, _ := process.Processes()
	processes := make([]procInfo, 0)
	for _, p := range procs {
		name, err := p.Name()
		if err != nil {
			continue
		}
		procCpuPercent, err := p.CPUPercent()
		if err != nil {
			continue
		}
		procMemInfo, err := p.MemoryInfo()
		if err != nil {
			continue
		}
		processes = append(processes, procInfo{
			Pid:        p.Pid,
			Name:       name,
			CPUPercent: procCpuPercent,
			MemoryRss:  procMemInfo.RSS,
		})
	}

	sort.Slice(processes, func(i, j int) bool {
		return processes[i].CPUPercent > processes[j].CPUPercent
	})

	topProcesses := processes
	if len(processes) > 5 {
		topProcesses = processes[:5]
	}

	info := dynamicSystemInfo{
		CPUPercent:    cpuPercent[0],
		MemoryPercent: memInfo.UsedPercent,
		MemoryUsed:    memInfo.Used,
		DiskPercent:   diskInfo.UsedPercent,
		DiskUsed:      diskInfo.Used,
		LoadAverage:   loadAvg,
		Processes:     topProcesses,
	}

	json.NewEncoder(w).Encode(info)
}

func networkWebsocketHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	defer conn.Close()

	for {
		netIO, _ := psutil_net.IOCounters(false)
		info := networkInfo{
			BytesSent: netIO[0].BytesSent,
			BytesRecv: netIO[0].BytesRecv,
		}
		err := conn.WriteJSON(info)
		if err != nil {
			log.Println("Client disconnected from network socket")
			break
		}
		time.Sleep(1 * time.Second)
	}
}
