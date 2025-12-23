import React, { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, Upload, Download, Zap } from 'lucide-react';

const App = () => {
  const [time, setTime] = useState(new Date());
  const [cpuUsage, setCpuUsage] = useState(67);
  const [memoryUsage, setMemoryUsage] = useState(58);
  const [storageUsage, setStorageUsage] = useState(73);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [scanAnimation, setScanAnimation] = useState(0);

  const [osVersion, setOsVersion] = useState('');
  const [localIp, setLocalIp] = useState('');
  const [uptime, setUptime] = useState('');

  useEffect(() => {
    const fetchData = () => {
      fetch('http://localhost:3001/api/stats')
        .then(response => response.json())
        .then(data => {
          setCpuUsage(data.cpuUsage);
          setMemoryUsage(data.memoryUsage);
          setStorageUsage(data.storageUsage);
          setUploadSpeed(data.uploadSpeed);
          setDownloadSpeed(data.downloadSpeed);
          setOsVersion(data.os_version);
          setLocalIp(data.local_ip);
          setUptime(data.uptime);
        })
        .catch(error => console.error('Error fetching data:', error));
    };

    const timer = setInterval(() => {
      setTime(new Date());
      fetchData();
      setScanAnimation(prev => (prev + 2) % 360);
    }, 1000);

    fetchData(); // Initial fetch

    return () => clearInterval(timer);
  }, []);

  const weekData = [
    { day: 'Mon', traffic: 2847 },
    { day: 'Tue', traffic: 3201 },
    { day: 'Wed', traffic: 2956 },
    { day: 'Thu', traffic: 3487 },
    { day: 'Fri', traffic: 3821 },
    { day: 'Sat', traffic: 2634 },
    { day: 'Sun', traffic: 2912 }
  ];

  const topProcesses = [
    { name: 'nav.sys', cpu: 34, mem: 28 },
    { name: 'shield.core', cpu: 28, mem: 42 },
    { name: 'life.support', cpu: 23, mem: 31 },
    { name: 'quantum.engine', cpu: 19, mem: 25 },
    { name: 'comm.array', cpu: 15, mem: 18 }
  ];

  const hourlyData = Array.from({ length: 12 }, (_, i) => ({
    time: `${String(time.getHours() - 11 + i).padStart(2, '0')}:00`,
    value: 30 + Math.random() * 70
  }));

  const CircularMeter = ({ value, label, size = 'small' }) => {

    const radius = size === 'large' ? 110 : 75;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;
    const centerSize = size === 'large' ? 280 : 190;

    return (
      <div className={`relative ${size === 'large' ? 'w-[280px] h-[280px]' : 'w-[190px] h-[190px]'}`}>
        <svg className="transform -rotate-90" width={centerSize} height={centerSize}>
          {/* 多层装饰圆环 */}
          <circle cx={centerSize/2} cy={centerSize/2} r={radius + 35} stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none" />
          <circle cx={centerSize/2} cy={centerSize/2} r={radius + 30} stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none" />
          <circle cx={centerSize/2} cy={centerSize/2} r={radius + 20} stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="none" strokeDasharray="8 8" />
          
          {/* 背景圆环 */}
          <circle cx={centerSize/2} cy={centerSize/2} r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth="12" fill="none" />
          
          {/* 进度圆环 */}
          <circle
            cx={centerSize/2} cy={centerSize/2} r={radius}
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="12"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
          
          {/* 刻度标记 */}
          {[...Array(size === 'large' ? 24 : 16)].map((_, i) => {
            const angle = (i / (size === 'large' ? 24 : 16)) * 360;
            const rad = (angle * Math.PI) / 180;
            const x1 = centerSize/2 + (radius + 15) * Math.cos(rad);
            const y1 = centerSize/2 + (radius + 15) * Math.sin(rad);
            const x2 = centerSize/2 + (radius + 20) * Math.cos(rad);
            const y2 = centerSize/2 + (radius + 20) * Math.sin(rad);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />;
          })}
          
          <defs>
            <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`${size === 'large' ? 'text-7xl' : 'text-5xl'} font-bold text-white tracking-tight`}>
            {Math.round(value)}%
          </div>
        </div>
        
        <div className="absolute bottom-10 left-0 right-0 text-center">
          <div className="text-gray-300 text-xs uppercase tracking-widest font-semibold">{label}</div>
        </div>
      </div>
    );
  };

  const GlassPanel = ({ children, className = '' }) => (
    <div className={`relative backdrop-blur-md bg-white/5 rounded-lg ${className}`}
         style={{ boxShadow: '0 0 30px rgba(255, 255, 255, 0.1), inset 0 0 30px rgba(255, 255, 255, 0.03)' }}>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:20px_20px] rounded-lg pointer-events-none" />
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 font-mono relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white/90 tracking-widest mb-2" style={{ textShadow: '0 0 20px rgba(255, 255, 255, 0.3)' }}>
            MAC MINI M2
          </h1>
          <div className="text-white/40 text-sm tracking-wider">
            「os_version」 | 「local_ip」| 「uptime」
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Left Panel - 7 Day Traffic */}
          <GlassPanel className="col-span-3 p-4">
            <div className="text text-white/15 uppercase tracking-wider mb-4 flex items-center gap-2">
              7-Day Traffic Log
            </div>
            <div className="space-y-3">
              {weekData.map((item, idx) => {
                const maxTraffic = Math.max(...weekData.map(d => d.traffic));
                const width = (item.traffic / maxTraffic) * 100;
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/50">{item.day}</span>
                      <span className="text-white/70">{item.traffic}</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-white/40 to-white/60 rounded-full transition-all duration-500"
                        style={{ width: `${width}%`, boxShadow: '0 0 10px rgba(255, 255, 255, 0.3)' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassPanel>

          {/* Center Panels */}
          <div className="col-span-6 space-y-4">
            {/* Core Meters Row */}
            <div className="grid grid-cols-2 gap-4">
              <GlassPanel className="p-6 flex justify-center items-center">
                <CircularMeter value={memoryUsage} label="Memory"/>
              </GlassPanel>
              <GlassPanel className="p-6 flex justify-center items-center">
                <CircularMeter value={cpuUsage} label="CPU"/>
              </GlassPanel>
            </div>

            {/* Main Storage */}
            <GlassPanel className="p-6 flex justify-center items-center">
              <CircularMeter value={storageUsage} label="Storage" icon={HardDrive} size= 'large' />
            </GlassPanel>

            {/* Network Activity */}
            <GlassPanel className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <Upload className="w-5 h-5 text-white/60" />
                  <div>
                    <div className="text-xs text-white/40 uppercase">Upload</div>
                    <div className="text-lg font-bold text-white/80">{uploadSpeed.toFixed(1)} MB/s</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-white/60" />
                  <div>
                    <div className="text-xs text-white/40 uppercase">Download</div>
                    <div className="text-lg font-bold text-white/80">{downloadSpeed.toFixed(1)} MB/s</div>
                  </div>
                </div>
              </div>
              
              {/* Wave Scan */}
              <div className="h-24 relative bg-white/5 rounded overflow-hidden">
                <svg className="w-full h-full">
                  <defs>
                    <linearGradient id="waveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                  {hourlyData.map((d, i) => {
                    const x = (i / (hourlyData.length - 1)) * 100;
                    const y = 100 - (d.value * 0.8);
                    return (
                      <circle
                        key={i}
                        cx={`${x}%`}
                        cy={`${y}%`}
                        r="2"
                        fill="#ffffff"
                        opacity="0.5"
                      />
                    );
                  })}
                  <polyline
                    points={hourlyData.map((d, i) => {
                      const x = (i / (hourlyData.length - 1)) * 100;
                      const y = 100 - (d.value * 0.8);
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="url(#waveGrad)"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-white/60 via-white/80 to-transparent"
                  style={{ 
                    left: `${(scanAnimation / 360) * 100}%`,
                    boxShadow: '0 0 10px rgba(255, 255, 255, 0.6)'
                  }}
                />
              </div>
            </GlassPanel>

            {/* System Status */}
            <GlassPanel className="p-4">
              <div className="text-xs text-white/60 uppercase tracking-wider mb-3">System Status</div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 bg-white/5 rounded">
                  <div className="text-xl font-bold text-white/80">OPTIMAL</div>
                  <div className="text-xs text-white/40">Navigation</div>
                </div>
                <div className="p-2 bg-white/5 rounded">
                  <div className="text-xl font-bold text-white/80">ACTIVE</div>
                  <div className="text-xs text-white/40">Shields</div>
                </div>
                <div className="p-2 bg-white/5 rounded">
                  <div className="text-xl font-bold text-white/80">STABLE</div>
                  <div className="text-xs text-white/40">Life Support</div>
                </div>
              </div>
            </GlassPanel>
          </div>

          {/* Right Panel - Top Processes */}
          <GlassPanel className="col-span-3 p-4">
            <div className="text text-white/15 uppercase tracking-wider mb-4 flex items-center gap-2">
              Top Processes
            </div>
            <div className="space-y-3">
              {topProcesses.map((proc, idx) => (
                <div key={idx} className="p-3 bg-white/5 rounded">
                  <div className="text-sm text-white/80 mb-2 font-semibold">{proc.name}</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">CPU</span>
                      <span className="text-white/70">{proc.cpu}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-white/40 to-white/60"
                        style={{ width: `${proc.cpu}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">MEM</span>
                      <span className="text-white/70">{proc.mem}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-white/40 to-white/60"
                        style={{ width: `${proc.mem}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
};

export default App;