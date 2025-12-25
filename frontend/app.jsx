import React, { useState, useEffect } from 'react';

const App = () => {
  const [time, setTime] = useState(new Date());
  const [cpuUsage, setCpuUsage] = useState(0); // Initialize with 0
  const [memoryUsage, setMemoryUsage] = useState(0); // Initialize with 0
  const [storageUsage, setStorageUsage] = useState(0); // Initialize with 0
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState(0);

  const [osVersion, setOsVersion] = useState('');
  const [localIp, setLocalIp] = useState('');
  const [uptime, setUptime] = useState(''); // This will be a formatted string

  // New state variables for static info
  const [cpuInfo, setCpuInfo] = useState('');
  const [totalMemory, setTotalMemory] = useState(0); // Bytes
  const [totalDisk, setTotalDisk] = useState(0); // Bytes
  const [bootTime, setBootTime] = useState(null); // Date object for boot time

  // State variables for dynamic data that were previously hardcoded
  const [weekData, setWeekData] = useState([]);
  const [topProcesses, setTopProcesses] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [sinceBootStats, setSinceBootStats] = useState({ up_bytes: 0, down_bytes: 0 });

  useEffect(() => {
    // Fetch static data once
    fetch('http://localhost:8000/api/system/static')
      .then(response => response.json())
      .then(data => {
        setOsVersion(data.os_version);
        setLocalIp(data.local_ip);
        setCpuInfo(data.cpu_info);
        setTotalMemory(data.total_memory);
        setTotalDisk(data.total_disk);
        setBootTime(new Date(data.boot_time));
        setUptime(formatUptime(data.uptime_seconds));
      })
      .catch(error => console.error('Error fetching static data:', error));

    // Daily network traffic
    fetch('http://localhost:8000/api/network/daily')
      .then(response => response.json())
      .then(data => {
        // Map daily_7d to weekData
        const newWeekData = data.daily_7d.map(daily => ({
          day: new Date(daily.date).toLocaleDateString('en-US', { weekday: 'short' }), // e.g., "Mon"
          upload: Math.round(daily.up_bytes / (1024 * 1024 * 1024)), // Convert to GB
          download: Math.round(daily.down_bytes / (1024 * 1024* 1024)) // Convert to GB
        })).reverse(); // Reverse to have Mon as first and Sun as last if needed, or based on API order.
        // The API returns most recent first, so reverse to have oldest first for chart.
        setWeekData(newWeekData);
        if (data.since_boot) {
          setSinceBootStats(data.since_boot);
        }
      })
      .catch(error => console.error('Error fetching daily network data:', error));
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    const fetchData = () => {
      // Dynamic data
      fetch('http://localhost:8000/api/system/dynamic')
        .then(response => response.json())
        .then(data => {
          setCpuUsage(data.cpu_percent);
          setMemoryUsage(data.memory_percent);
          setStorageUsage(data.disk_percent);

          // Update top processes
          const mappedProcesses = data.processes.map(proc => ({
            name: proc.name.replace(/\s*\(.*\)/g, ''),
            cpu: proc.cpu_percent,
            // Convert memory_rss (bytes) to percentage of total memory
            // Ensure totalMemory is available, otherwise default to 0
            mem: totalMemory ? (proc.memory_rss / totalMemory) * 100 : 0
          }));
          setTopProcesses(mappedProcesses);
        })
        .catch(error => console.error('Error fetching dynamic data:', error));

      // Hourly network rate
      fetch('http://localhost:8000/api/network/hourly')
        .then(response => response.json())
        .then(data => {
          const newHourlyData = data.points.map(point => ({
            time: new Date(new Date().getTime() - point.offset_min * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
            download: (point.down_bps || 0),
            upload: (point.up_bps || 0) 
          }));
          // The API provides data from most recent (offset_min: 59) to oldest (offset_min: 0).
          // For display, it's usually oldest to newest.
          setHourlyData(newHourlyData.reverse());
        })
        .catch(error => console.error('Error fetching hourly network data:', error));
    };

    const timer = setInterval(() => {
      setTime(new Date());
      fetchData();
      // Calculate and set uptime string
      if (bootTime) {
        const now = new Date();
        const diffSeconds = Math.floor((now.getTime() - bootTime.getTime()) / 1000);
        setUptime(formatUptime(diffSeconds));
      }
    }, 1000);

    fetchData(); // Initial fetch

    return () => {
      clearInterval(timer);
    };
  }, [bootTime, totalMemory]);

  useEffect(() => {
    // WebSocket for real-time network speed
    const ws = new WebSocket('ws://localhost:8000/ws/network/realtime');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setUploadSpeed((data.up_bps || 0)); 
      setDownloadSpeed((data.down_bps || 0));
    };
    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };
    ws.onclose = () => {
      console.log('WebSocket Closed');
    };

    return () => {
      ws.close();
    };
  }, []);



  const formatUptime = (seconds) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);

    let uptimeString = '';
    if (d > 0) uptimeString += `${d}d `;
    if (h > 0 || d > 0) uptimeString += `${h}h `; // Show hours if days exist or hours > 0
    if (m > 0 || h > 0 || d > 0) uptimeString += `${m}m `; // Show minutes if hours exist or minutes > 0
    return uptimeString.trim();
  };

  const formatBytes = (bytes, decimals = 1) => {
    if (bytes === 0) return '0 B'; // Handle 0 bytes case
    if (bytes < 1024 * 1024) { // Less than 1 MB
      return (bytes / 1024).toFixed(decimals) + ' KB';
    } else if (bytes < 1024 * 1024 * 1024) { // Less than 1 GB
      return (bytes / (1024 * 1024)).toFixed(decimals) + ' MB';
    } else {
      return (bytes / (1024 * 1024 * 1024)).toFixed(decimals) + ' GB';
    }
  };

  const CircularMeter = ({ value, label, size = 'small' }) => {

    const radius = size === 'large' ? 55 : 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;
    const centerSize = size === 'large' ? 140 : 100;

    return (
      <div className={`relative ${size === 'large' ? 'w-[140px] h-[140px]' : 'w-[100px] h-[100px]'}`}>
        <svg className="transform -rotate-90" width={centerSize} height={centerSize}>
          {/* 多层装饰圆环 */}
          <circle cx={centerSize/2} cy={centerSize/2} r={radius + 17} stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none" />
          <circle cx={centerSize/2} cy={centerSize/2} r={radius + 15} stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none" />
          <circle cx={centerSize/2} cy={centerSize/2} r={radius + 10} stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="none" strokeDasharray="8 8" />
          
          {/* 背景圆环 */}
          <circle cx={centerSize/2} cy={centerSize/2} r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
          
          {/* 进度圆环 */}
          <circle
            cx={centerSize/2} cy={centerSize/2} r={radius}
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
          
          {/* 刻度标记 */}
          {[...Array(size === 'large' ? 12 : 8)].map((_, i) => {
            const angle = (i / (size === 'large' ? 12 : 8)) * 360;
            const rad = (angle * Math.PI) / 180;
            const x1 = centerSize/2 + (radius + 8) * Math.cos(rad);
            const y1 = centerSize/2 + (radius + 8) * Math.sin(rad);
            const x2 = centerSize/2 + (radius + 10) * Math.cos(rad);
            const y2 = centerSize/2 + (radius + 10) * Math.sin(rad);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />;
          })}
             
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`${size === 'large' ? 'text-4xl' : 'text-2xl'} font-bold text-white/60 tracking-tight`}>
            {Math.round(value)}%
          </div>
        </div>
        
        <div className={`absolute ${size === 'large' ? 'bottom-8' : 'bottom-5'} left-0 right-0 text-center`}>
          <div className="font-bold text-white/30 text-xs uppercase tracking-widest font-semibold">{label}</div>
        </div>
      </div>
    );
  };

const GlassPanel = ({ children, className = '' }) => (
  <div className={`relative rounded-lg overflow-hidden ${className}`}>
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{
        // 这个 mask 决定了背景、网格和光束在垂直方向上的可见度（上下渐隐）
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)',
        maskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)'
      }}
    >
      {/* 磨砂玻璃背景 */}
      <div className="absolute inset-0 backdrop-blur-md bg-white/5" />
      {/* 网格线 */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:3px_3px]" />
      {/* 左侧光束 */}
      <div className="absolute left-0 inset-y-0 w-[2px] bg-gradient-to-r from-white/20 to-transparent shadow-[0_0_15px_rgba(255,255,255,0.2)]"></div>
      {/* 右侧光束 */}
      <div className="absolute right-0 inset-y-0 w-[2px] bg-gradient-to-l from-white/20 to-transparent shadow-[0_0_15px_rgba(255,255,255,0.2)]"></div>
    </div>

    <div className="relative z-10 p-4 h-full flex flex-col">
      {children}
    </div>
  </div>
);

  const GlassPanelNoBG = ({ children, className = '' }) => (
    <div className={`relative bg-white/0 ${className}`}>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 font-mono relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white/30 tracking-widest mb-2" >
            MAC MINI M2
          </h1>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Left Panel - 7 Day Traffic */}
          <GlassPanel className="col-span-3 p-4">
            <div className="pt-10">
              <div className="text text-white/15 uppercase tracking-wider mb-4 flex items-center gap-2">
                Daily Traffic
              </div>
              <div className="text-xs text-white/15 uppercase tracking-wider mb-4 flex items-center gap-2">
                Upload(GB)
              </div>
              <div className="flex justify-between items-end h-28 px-1">
                {weekData.map((item, idx) => {
                  const maxUpload = Math.max(...weekData.map(d => d.upload));
                  const height = (item.upload / maxUpload) * 100;
                  return (
                    <div key={idx} className="flex flex-col items-center w-6 text-center">
                      {item.upload !== 0 && (
                        <div className="text-white/60 text-[10px]">
                          {item.upload}
                        </div>
                      )}
                      <div className="w-2 h-20 rounded-full flex items-end mt-1">
                        <div 
                          className="w-full bg-gradient-to-b from-sky-800 to-sky-950 rounded-full transition-all duration-500"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <div className="text-white/50 text-xs mt-1">{item.day}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-8">
              <div className="text-xs text-white/15 uppercase tracking-wider mb-4 flex items-center gap-2">
                Download(GB)
              </div>
              <div className="flex justify-between items-end h-28 px-1">
                {weekData.map((item, idx) => {
                  const maxDownload = Math.max(...weekData.map(d => d.download));
                  const height = (item.download / maxDownload) * 100;
                  return (
                    <div key={idx} className="flex flex-col items-center w-6 text-center">
                      {item.upload !== 0 && (
                        <div className="text-white/60 text-[10px]">{item.download}</div>
                      )}
                      <div className="w-2 h-20 rounded-full flex items-end mt-1">
                        <div 
                          className="w-full bg-gradient-to-b from-emerald-800 to-emerald-950 rounded-full transition-all duration-500"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <div className="text-white/50 text-xs mt-1">{item.day}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-auto">
              <div className="grid grid-cols-3 gap-1 text-center">
                <div className="p-1 bg-white/0 rounded">
                  <div className="text-xs font-bold text-white/10 uppercase">Since boot</div>
                </div>
                <div className="p-1 bg-white/0 rounded">
                  <div className="text-xs font-bold text-white/10 uppercase">Upload</div>
                  <div className="text-xs text-white/20"> {formatBytes(sinceBootStats.up_bytes, 0)} </div>
                </div>
                <div className="p-1 rounded">
                  <div className="text-xs font-bold text-white/10 uppercase">Download</div>
                  <div className="text-xs text-white/20"> {formatBytes(sinceBootStats.down_bytes, 0)} </div>
                </div>
              </div>
            </div>
            
          </GlassPanel>

          {/* Center Panels */}
          <div className="col-span-6 space-y-1">
            {/* Core Meters Row */}
            <div className="grid grid-cols-2">
              <GlassPanelNoBG className="p-6 flex justify-center items-center">
                <CircularMeter value={memoryUsage} label="内存"/>
              </GlassPanelNoBG>
              <GlassPanelNoBG className="p-6 flex justify-center items-center">
                <CircularMeter value={cpuUsage} label="CPU"/>
              </GlassPanelNoBG>
            </div>

            {/* Main Storage */}
            <GlassPanelNoBG className="p-6 flex justify-center items-center">
              <CircularMeter value={storageUsage} label="硬盘" size= 'large' />
            </GlassPanelNoBG>

            {/* Network Activity */}
            <GlassPanelNoBG className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="flex items-center justify-end gap-3">
                  <div className="text-right">
                    <div className="text-sm font-bold text-white/20 uppercase">Download</div>
                    <div className="text-xs text-white/40">{formatBytes(downloadSpeed)}/s</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-sm font-bold text-white/20 uppercase">Upload</div>
                    <div className="text-xs text-white/40">{formatBytes(uploadSpeed)}/s</div>
                  </div>
                </div>
              </div>
              
              {/* Wave Scan */}
              <div className="h-32 relative bg-white/0 rounded overflow-hidden">
                <svg className="w-full h-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="waveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ffffffff" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#ffffffff" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>

                  {hourlyData.length > 1 && (() => {
                    const maxDownload = Math.max(...hourlyData.map(d => d.download), 0.01);
                    const maxUpload = Math.max(...hourlyData.map(d => d.upload), 0.01);
                    const len = hourlyData.length - 1;

                    const uploadPoints = hourlyData.map((d, i) => {
                      const x = (i / len) * 100;
                      const y = 100 - (d.upload / maxUpload) * 60;
                      return `${x.toFixed(2)},${y.toFixed(2)}`;
                    }).join(' ');

                    const downloadPoints = hourlyData.map((d, i) => {
                      const x = (i / len) * 100;
                      const y = 100 - (d.download / maxDownload) * 80;
                      return `${x.toFixed(2)},${y.toFixed(2)}`;
                    }).join(' ');

                    return (
                      <>
                        <svg x="51%" y="0" width="40%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <polyline
                            points={uploadPoints}
                            fill="none"
                            stroke="url(#waveGrad)"
                            strokeWidth="1"
                            vectorEffect="non-scaling-stroke"
                          />
                        </svg>

                        <svg x="9%" y="0" width="40%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                           <g transform="scale(-1, 1) translate(-100, 0)">
                              <polyline
                                points={downloadPoints}
                                fill="none"
                                stroke="url(#waveGrad)"
                                strokeWidth="1"
                                vectorEffect="non-scaling-stroke"
                              />
                            </g>
                        </svg>
                        <text x="100%" y="5%" dominant-baseline="middle" text-anchor="end" fill="rgba(255,255,255,0.3)" font-size="8">
                          1h max
                        </text>
                        <text x="100%" y="15%" dominant-baseline="middle" text-anchor="end" fill="rgba(255,255,255,0.25)" font-size="8">
                          {formatBytes(maxUpload / 8)}/s ↑
                        </text>
                        <text x="100%" y="25%" dominant-baseline="middle" text-anchor="end" fill="rgba(255,255,255,0.2)" font-size="8">
                          {formatBytes(maxDownload / 8)}/s ↓
                        </text>
                      </>
                    );
                  })()}
                </svg>
              </div>
            </GlassPanelNoBG>
          </div>

          {/* Right Panel - Top Processes */}
          <GlassPanel className="col-span-3 p-4 ">
            <div className="pt-10 text text-white/15 uppercase tracking-wider mb-8 flex items-center gap-2">
              Top Processes
            </div>
            <div className="space-y-2">
              {topProcesses.map((proc, idx) => (
                <div key={idx} className="py-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-sm text-white/40 truncate">{proc.name}</span>
                      <span className="text-sm font-medium text-white/20 tabular-nums">{proc.cpu.toFixed(0)}%</span>
                    </div>
                    <div className="h-0.5 bg-white/10 rounded-full overflow-hidden mt-2">
                      <div 
                        className="h-full bg-gradient-to-r from-white/20 to-white/50 rounded-full"
                        style={{ width: `${proc.cpu}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* System Status */}
            <div className="grid grid-cols-3 text-center mt-auto">
              <div className="p-1 rounded">
                <div className="text-xs font-bold text-white/10 uppercase">OS Version</div>
                <div className="text-xs text-white/20">{osVersion}</div>
              </div>
              <div className="p-1 bg-white/0 rounded">
                <div className="text-xs font-bold text-white/10 uppercase">uptime</div>
                <div className="text-xs text-white/20">{uptime}</div>
              </div>
              <div className="p-1 rounded">
                <div className="text-xs font-bold text-white/10 uppercase">local Ip</div>
                <div className="text-xs text-white/20">{localIp}</div>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
};

export default App;