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
    { day: 'Mon', upload: 1247, download: 2847 },
    { day: 'Tue', upload: 1501, download: 3201 },
    { day: 'Wed', upload: 1156, download: 2956 },
    { day: 'Thu', upload: 1887, download: 3487 },
    { day: 'Fri', upload: 2221, download: 3821 },
    { day: 'Sat', upload: 934, download: 2634 },
    { day: 'Sun', upload: 1112, download: 2912 }
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
          
          <defs>
            <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`${size === 'large' ? 'text-4xl' : 'text-2xl'} font-bold text-white tracking-tight`}>
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
    <div className={`relative backdrop-blur-md bg-white/5 rounded-lg ${className}`}
         style={{ boxShadow: '0 0 30px rgba(255, 255, 255, 0.1), inset 0 0 30px rgba(255, 255, 255, 0.03)' }}>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:20px_20px] rounded-lg pointer-events-none" />
      {children}
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
            <div>
              <div className="text text-white/15 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Upload size={14} /> 7-Day Upload
              </div>
              <div className="flex justify-between items-end h-28 px-1">
                {weekData.map((item, idx) => {
                  const maxUpload = Math.max(...weekData.map(d => d.upload));
                  const height = (item.upload / maxUpload) * 100;
                  return (
                    <div key={idx} className="flex flex-col items-center w-6 text-center">
                      <div className="text-white/70 text-[10px]">{item.upload}</div>
                      <div className="w-3 h-20 bg-white/10 rounded-full flex items-end mt-1">
                        <div 
                          className="w-full bg-gradient-to-b from-sky-400 to-sky-600 rounded-full transition-all duration-500"
                          style={{ height: `${height}%`, boxShadow: '0 0 8px rgba(56, 189, 248, 0.4)' }}
                        />
                      </div>
                      <div className="text-white/50 text-xs mt-1">{item.day}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-8">
              <div className="text text-white/15 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Download size={14} /> 7-Day Download
              </div>
              <div className="flex justify-between items-end h-28 px-1">
                {weekData.map((item, idx) => {
                  const maxDownload = Math.max(...weekData.map(d => d.download));
                  const height = (item.download / maxDownload) * 100;
                  return (
                    <div key={idx} className="flex flex-col items-center w-6 text-center">
                      <div className="text-white/70 text-[10px]">{item.download}</div>
                      <div className="w-3 h-20 bg-white/10 rounded-full flex items-end mt-1">
                        <div 
                          className="w-full bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                          style={{ height: `${height}%`, boxShadow: '0 0 8px rgba(52, 211, 153, 0.4)' }}
                        />
                      </div>
                      <div className="text-white/50 text-xs mt-1">{item.day}</div>
                    </div>
                  );
                })}
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
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-xs text-white/40 uppercase">Upload</div>
                    <div className="text-lg font-bold text-white/60">{uploadSpeed.toFixed(1)} MB/s</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-xs text-white/40 uppercase">Download</div>
                    <div className="text-lg font-bold text-white/60">{downloadSpeed.toFixed(1)} MB/s</div>
                  </div>
                </div>
              </div>
              
              {/* Wave Scan */}
              <div className="h-24 relative bg-white/0 rounded overflow-hidden">
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
            </GlassPanelNoBG>
          </div>

          {/* Right Panel - Top Processes */}
          <GlassPanel className="col-span-3 p-4">
            <div className="text text-white/15 uppercase tracking-wider mb-4 flex items-center gap-2">
              Top Processes
            </div>
            <div className="space-y-3">
              {topProcesses.map((proc, idx) => (
                <div key={idx} className="p-3 bg-white/5 rounded">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">{proc.name}</span>
                      <span className="text-white/70">{proc.cpu}% {proc.mem}</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-white/10 to-white/40 rounded-full"
                        style={{ width: `${proc.cpu}%` }}
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