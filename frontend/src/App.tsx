import React, { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useResponsive } from './hooks/useResponsive';
import MobileDashboardStack from './components/MobileDashboardStack';
import MobileSystemInfoCard from './components/MobileSystemInfoCard';

// --- Type Definitions ---
interface StaticInfo { 
  os_version: string; 
  cpu_info: string; 
  cpu_cores: number; 
  cpu_logical_cores: number; 
  total_memory: number; 
  total_disk: number; 
  local_ip: string;
  boot_time: string; 
}

interface Process { 
  pid: number; 
  name: string; 
  cpu_percent: number; 
  memory_rss: number; 
}

interface DynamicMetrics { 
  cpu_percent: number; 
  memory_percent: number; 
  memory_used: number; 
  disk_percent: number; 
  disk_used: number; 
  processes: Process[]; 
  load_average: { 
    load1: number; 
    load5: number; 
    load15: number; 
  }; 
}

// --- Helper Functions ---
const formatBytes = (bytes: number, decimals = 1) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const formatUptime = (totalSeconds: number) => {
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
};

// --- Animated Background Component ---
const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-cyan-900/20"></div>
      <div className="floating-orbs">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`floating-orb orb-${i + 1}`}
            style={{
              animationDelay: `${i * 2}s`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          ></div>
        ))}
      </div>
      <div className="grid-overlay"></div>
    </div>
  );
};

// --- Glowing Gauge Component ---
const GlowingGauge: React.FC<{ percent: number; label: string; color: string; animationDelay?: string }> = ({ percent, label, color, animationDelay }) => {
  const circumference = 2 * Math.PI * 45;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <div className="relative">
        <svg width="120" height="120" className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r="45"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress circle with glow */}
          <circle
            cx="60"
            cy="60"
            r="45"
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="gauge-progress"
            style={{
              filter: `drop-shadow(0 0 8px ${color}40)`,
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
          {/* Animated pulse ring */}
          <circle
            cx="60"
            cy="60"
            r="45"
            stroke={color}
            strokeWidth="2"
            fill="none"
            opacity="0.6"
            className="pulse-ring"
            style={{ animationDelay }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>{percent.toFixed(1)}%</span>
          <span className="text-xs text-gray-400 mt-1">{label}</span>
        </div>
      </div>
    </div>
  );
};

// --- Holographic Card Component ---
const HoloCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div
      ref={cardRef}
      className={`holo-card ${className || ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos({ x: 50, y: 50 })}
      style={{
        '--mouse-x': `${mousePos.x}%`,
        '--mouse-y': `${mousePos.y}%`,
      } as React.CSSProperties}
    >
      <div className="holo-card-content">
        {children}
      </div>
    </div>
  );
};

// --- Water Ball Animation Component ---
const WaterBall: React.FC<{ percent: number; label: string }> = ({ percent, label }) => {
  const [animationKey, setAnimationKey] = useState(0);
  
  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [percent]);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="relative">
        <svg width="140" height="140" className="water-ball">
          <defs>
            <clipPath id={`water-clip-${animationKey}`}>
              <circle cx="70" cy="70" r="60" />
            </clipPath>
            <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8"/>
              <stop offset="50%" stopColor="#0891b2" stopOpacity="0.9"/>
              <stop offset="100%" stopColor="#0e7490" stopOpacity="1"/>
            </linearGradient>
            <filter id="waterGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Outer ring */}
          <circle
            cx="70"
            cy="70"
            r="60"
            stroke="rgba(6, 182, 212, 0.3)"
            strokeWidth="2"
            fill="none"
            className="pulse-ring"
          />
          
          {/* Water container */}
          <g clipPath={`url(#water-clip-${animationKey})`}>
            {/* Water waves */}
            <path
              className="water-wave wave-1"
              d={`M 10 ${140 - (percent / 100) * 120} Q 45 ${140 - (percent / 100) * 120 - 8} 80 ${140 - (percent / 100) * 120} T 150 ${140 - (percent / 100) * 120} L 150 150 L 10 150 Z`}
              fill="url(#waterGradient)"
              filter="url(#waterGlow)"
              style={{ animationDelay: '0s' }}
            />
            <path
              className="water-wave wave-2"
              d={`M 10 ${140 - (percent / 100) * 120 + 4} Q 45 ${140 - (percent / 100) * 120 - 4} 80 ${140 - (percent / 100) * 120 + 4} T 150 ${140 - (percent / 100) * 120 + 4} L 150 150 L 10 150 Z`}
              fill="rgba(6, 182, 212, 0.6)"
              style={{ animationDelay: '0.5s' }}
            />
            <path
              className="water-wave wave-3"
              d={`M 10 ${140 - (percent / 100) * 120 + 8} Q 45 ${140 - (percent / 100) * 120 + 12} 80 ${140 - (percent / 100) * 120 + 8} T 150 ${140 - (percent / 100) * 120 + 8} L 150 150 L 10 150 Z`}
              fill="rgba(6, 182, 212, 0.4)"
              style={{ animationDelay: '1s' }}
            />
          </g>
          
          {/* Glass effect */}
          <circle
            cx="70"
            cy="70"
            r="60"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="1"
            fill="none"
          />
          
          {/* Highlight */}
          <ellipse
            cx="55"
            cy="45"
            rx="15"
            ry="8"
            fill="rgba(255, 255, 255, 0.3)"
            className="glass-highlight"
          />
        </svg>
        
        {/* Percentage text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-cyan-400 glow-text">
            {percent.toFixed(1)}%
          </span>
          <span className="text-xs text-gray-600 mt-1">{label}</span>
        </div>
      </div>
    </div>
  );
};

// --- Dial Gauge Component ---
const DialGauge: React.FC<{
  value: number;
  maxValue: number;
  label: string;
}> = ({ value, maxValue, label }) => {
  const radius = 45;
  const strokeWidth = 8;
  const svgSize = 120;
  const centerPos = svgSize / 2;

  // 仪表盘从-135度到135度，总共270度
  const startAngle = -135;
  const endAngle = 135;
  const totalAngle = endAngle - startAngle;

  const percent = Math.min((value / maxValue) * 100, 100);
  const currentAngle = startAngle + (percent / 100) * totalAngle;

  // 计算弧形路径
  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const arcPath = (startA: number, endA: number, r: number) => {
    const start = polarToCartesian(centerPos, centerPos, r, endA);
    const end = polarToCartesian(centerPos, centerPos, r, startA);
    const largeArcFlag = endA - startA <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };
  
  // 指针长度
  const needleLength = radius - 8;

  // 根据数值决定颜色
  const getNeedleColor = () => {
    const ratio = value / (maxValue / 2); // Color ratio based on ncpu (maxValue/2)
    if (ratio < 0.7) return '#10b981'; // Green
    if (ratio < 1.0) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };
  const needleColor = getNeedleColor();

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <div className="relative">
        <svg width={svgSize} height={svgSize} style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id={`dialGradient-bg-large`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b98190" />
                <stop offset="50%" stopColor="#f59f0b90" />
                <stop offset="100%" stopColor="#ef444490" />
            </linearGradient>
          </defs>

          {/* Background arc */}
          <path
            d={arcPath(startAngle, endAngle, radius)}
            stroke={`url(#dialGradient-bg-large)`}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="square"
          />
          
          {/* Needle */}
          <line
            x1={centerPos}
            y1={centerPos}
            // 初始时让指针指向上方
            x2={centerPos}
            y2={centerPos - needleLength}
            stroke="gray"
            strokeWidth="2"
            strokeLinecap="round"
            style={{
              // 对 transform 属性应用动画
              transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              // 通过 rotate 实现旋转
              transform: `rotate(${currentAngle}deg)`,
              // 设置旋转中心
              transformOrigin: `${centerPos}px ${centerPos}px`,
            }}
          />

          {/* Center dot */}
          <circle
            cx={centerPos}
            cy={centerPos}
            r="4"
            fill={needleColor} // 中心点颜色也随数值变化
          />


          {/* Tick marks */}
          {[0, 0.25, 0.5, 0.75, 1].map(tickPercent => {
            const tickAngle = startAngle + tickPercent * totalAngle;
            const tickStart = polarToCartesian(centerPos, centerPos, radius + 3, tickAngle);
            const tickEnd = polarToCartesian(centerPos, centerPos, radius - 5, tickAngle);
            return (
              <line
                key={tickPercent}
                x1={tickStart.x}
                y1={tickStart.y}
                x2={tickEnd.x}
                y2={tickEnd.y}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1"
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
             style={{ marginTop: '60px'}}>
          <span
            className={`font-bold text-xl`}
            style={{ color: needleColor }}
          >
            {value.toFixed(2)}
          </span>
          <span className={`text-gray-400 mt-1 text-xs`}>
            {label}
          </span>
        </div>
      </div>
    </div>
  );
};


// --- Load Average Component with Dial Gauges ---
const LoadAverage: React.FC<{
  load: { load1: number; load5: number; load15: number } | undefined;
  cpuCores: number;
}> = ({ load, cpuCores }) => {
  if (!load) {
    return null;
  }

  // The gauge's maximum value is 2x the number of CPU cores.
  const maxValue = cpuCores * 2;

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="flex items-center justify-between">
        {/* 1 minute gauge */}
        <div className="flex-1 flex justify-center">
          <DialGauge
            value={load.load1}
            maxValue={maxValue}
            label="系统负载"
          />
        </div>

        {/* 5min and 15min gauges */}
        <div className="flex flex-col gap-2">
          <div style={{ zoom: 0.5 }}>
            <DialGauge
              value={load.load5}
              maxValue={maxValue}
              label="5 min"
            />
          </div>
          <div style={{ zoom: 0.5 }}>
            <DialGauge
              value={load.load15}
              maxValue={maxValue}
              label="15 min"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Animated Process List ---
const ProcessList: React.FC<{ processes: Process[] }> = ({ processes }) => {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4 text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text">
        活跃进程
      </h3>
      <div className="space-y-2">
        {processes.length > 0 ? processes.slice(0, 5).map((process, index) => (
          <div
            key={process.pid}
            className="process-item"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium truncate flex-1 mr-4">{process.name}</span>
              <div className="flex gap-4 text-xs">
                <span className="text-cyan-400">{process.cpu_percent.toFixed(1)}%</span>
                <span className="text-purple-400">{formatBytes(process.memory_rss)}</span>
              </div>
            </div>
            <div className="mt-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(process.cpu_percent, 100)}%` }}
              ></div>
            </div>
          </div>
        )) : (
          <div className="text-gray-400 text-center py-8">加载中...</div>
        )}
      </div>
    </div>
  );
};

// --- Network Activity Chart ---
const NetworkChart: React.FC<{ data: any[], isMobile: boolean }> = ({ data, isMobile }) => {

  const currentDownload = data[data.length - 1]?.download || 0;
  const currentUpload = data[data.length - 1]?.upload || 0;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 flex-shrink-0 chart-header">
        <h3 className="text-lg font-semibold text-transparent bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text">
          网络活动
        </h3>
        <div className="network-stats">
          <div className="network-stat-item">
            <div className="stat-indicator download-indicator"></div>
            <span className="stat-value stat-value-fixed">↓ {formatBytes(Math.abs(currentDownload))}/s</span>
          </div>
          <div className="network-stat-item">
            <div className="stat-indicator upload-indicator"></div>
            <span className="stat-value stat-value-fixed">↑ {formatBytes(currentUpload)}/s</span>
          </div>
        </div>
      </div>
      <div className="relative w-full flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            {!isMobile && (
              <defs>
                <linearGradient id="downloadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="uploadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
            )}
            <Area
              type="monotone"
              dataKey="download"
              stroke="#0ea5e9"
              strokeWidth={isMobile ? 2 : 3}
              fillOpacity={1}
              fill={isMobile ? 'none' : 'url(#downloadGradient)'}
              dot={false}
              activeDot={false}
              style={!isMobile ? { filter: 'drop-shadow(0 0 8px #0ea5e940)' } : {}}
            />
            <Area
              type="monotone"
              dataKey="upload"
              stroke="#10b981"
              strokeWidth={isMobile ? 2 : 3}
              fillOpacity={1}
              fill={isMobile ? 'none' : 'url(#uploadGradient)'}
              dot={false}
              activeDot={false}
              style={!isMobile ? { filter: 'drop-shadow(0 0 8px #10b98140)' } : {}}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// --- System Info Header ---
const SystemInfoHeader: React.FC<{ info: StaticInfo | null, uptime: string }> = ({ info, uptime }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!info) return null;

  return (
    <div className="system-header">
      <div className="system-time">
        <div className="system-clock">
          {currentTime.toLocaleTimeString('zh-CN', { hour12: false })}
        </div>
        <div className="system-date">
          {currentTime.toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>
      <div className="system-details">
        <div className="detail-item">
            <div className="detail-icon">🌐</div>
            <div className="detail-text">
            <span className="detail-label">本机IP</span>
            <span className="detail-value">{info.local_ip}</span>
            </div>
        </div>
        <div className="detail-item">
            <div className="detail-text">
            <span className="detail-label">内存</span>
            <span className="detail-value">{formatBytes(info.total_memory)}</span>
            </div>
        </div>
        <div className="detail-item">
            <div className="detail-text">
            <span className="detail-label">存储</span>
            <span className="detail-value">{formatBytes(info.total_disk, 0)}</span>
            </div>
        </div>
        <div className="detail-item">
            <div className="detail-text">
            <span className="detail-label">CPU</span>
            <span className="detail-value">{info.cpu_cores} 核</span>
            </div>
        </div>
        <div className="detail-item">
            <div className="detail-icon">🟢</div>
            <div className="detail-text">
            <span className="detail-label">运行时间</span>
            <span className="detail-value">{uptime}</span>
            </div>
        </div>
        <div className="system-badge">
            <div className="badge-glow"></div>
            <div className="badge-content">
              <span className="badge-text">{info.os_version}</span>
              <span className="badge-subtext">{info.cpu_info}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---
const API_BASE_URL = '172.20.10.2:8000';

function App() {
  const { isMobile } = useResponsive();
  const [staticInfo, setStaticInfo] = useState<StaticInfo | null>(null);
  const [dynamicMetrics, setDynamicMetrics] = useState<DynamicMetrics | null>(null);
  const [networkData, setNetworkData] = useState(() => 
    Array.from({ length: 30 }, (_, i) => ({
      time: i,
      download: 0,
      upload: 0,
    }))
  );
  const [uptime, setUptime] = useState('');
  const lastNetworkData = useRef<{ time: number; sent: number; recv: number } | null>(null);

  // Fetch static system info & calculate uptime
  useEffect(() => {
    fetch(`http://${API_BASE_URL}/api/system/static`)
      .then(res => res.json())
      .then(data => {
        setStaticInfo(data);
        if (data && data.boot_time) {
          const bootTime = new Date(data.boot_time).getTime();
          const updateUptime = () => {
            const now = new Date();
            setUptime(formatUptime(Math.floor((now.getTime() - bootTime) / 1000)));
          };
          updateUptime();
          const interval = setInterval(updateUptime, 1000);
          return () => clearInterval(interval);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch dynamic metrics every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`http://${API_BASE_URL}/api/system/dynamic`)
        .then(res => res.json())
        .then(setDynamicMetrics)
        .catch(console.error);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket for real-time network data
  useEffect(() => {
    const ws = new WebSocket(`ws://${API_BASE_URL}/ws/network`);
    ws.onmessage = (event) => {
      const netData = JSON.parse(event.data);
      const now = Date.now();
      let downSpeed = 0, upSpeed = 0;
      
      if (lastNetworkData.current) {
        const timeDiff = (now - lastNetworkData.current.time) / 1000;
        if (timeDiff > 0) {
          downSpeed = Math.max(0, (netData.bytes_recv - lastNetworkData.current.recv) / timeDiff);
          upSpeed = Math.max(0, (netData.bytes_sent - lastNetworkData.current.sent) / timeDiff);
        }
      }
      
      lastNetworkData.current = { time: now, sent: netData.bytes_sent, recv: netData.bytes_recv };
      
      setNetworkData(prev => {
        const newData = [...prev.slice(1)];
        newData.push({
          time: prev[prev.length - 1].time + 1,
          download: -downSpeed,
          upload: upSpeed,
        });
        return newData;
      });
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return () => ws.close();
  }, []);

  const getGaugeColor = (percent: number) => {
    if (percent < 50) return '#06b6d4'; // Cyan
    if (percent < 80) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  const renderDesktopView = () => (
    <>
      <SystemInfoHeader info={staticInfo} uptime={uptime} />
      <div className="pt-32 pb-8 px-8 relative z-10">
        <div className="metrics-grid">
          <HoloCard>
            <div className="gauge-container">
              <GlowingGauge
                percent={dynamicMetrics?.cpu_percent ?? 0}
                label="CPU 使用率"
                color={getGaugeColor(dynamicMetrics?.cpu_percent ?? 0)}
                animationDelay="0s"
              />
            </div>
          </HoloCard>
          <HoloCard>
            <div className="gauge-container">
              <GlowingGauge
                percent={dynamicMetrics?.memory_percent ?? 0}
                label="内存使用率"
                color={getGaugeColor(dynamicMetrics?.memory_percent ?? 0)}
                animationDelay="0.5s"
              />
            </div>
          </HoloCard>
          <HoloCard>
            <div className="absolute text-xs text-gray-400" style={{ top: '2rem', right: '2rem', textAlign: 'left', zIndex: 2 }}>
              <div>{staticInfo && dynamicMetrics ? formatBytes(staticInfo.total_disk - dynamicMetrics.disk_used, 0) : '...'} 可用</div>
            </div>
            <div className="gauge-container">
              <WaterBall 
                percent={dynamicMetrics?.disk_percent ?? 0}
                label="磁盘使用"
              />
            </div>
          </HoloCard>
          <HoloCard>
            <div className="gauge-container">
              <LoadAverage
                load={dynamicMetrics?.load_average}
                cpuCores={staticInfo?.cpu_logical_cores ?? 1}
              />
            </div>
          </HoloCard>
          <HoloCard className="network-card no-select">
            <NetworkChart data={networkData} isMobile={isMobile} />
          </HoloCard>
          <HoloCard className="processes-card">
            <ProcessList processes={dynamicMetrics?.processes ?? []} />
          </HoloCard>
        </div>
      </div>
    </>
  );

  const renderMobileView = () => (
    <div className="mobile-main-container">
      <HoloCard className="mobile-card">
        <MobileDashboardStack 
          cpuPercent={dynamicMetrics?.cpu_percent ?? 0}
          memPercent={dynamicMetrics?.memory_percent ?? 0}
          diskPercent={dynamicMetrics?.disk_percent ?? 0}
          load1={dynamicMetrics?.load_average?.load1 ?? 0}
          cpuCores={staticInfo?.cpu_logical_cores ?? 1}
          getGaugeColor={getGaugeColor}
        />
      </HoloCard>
      <HoloCard className="mobile-card network-mobile-card no-select">
        <NetworkChart data={networkData} isMobile={isMobile} />
      </HoloCard>
      <HoloCard className="mobile-card">
        <ProcessList processes={dynamicMetrics?.processes ?? []} />
      </HoloCard>
      <HoloCard className="mobile-card">
        <MobileSystemInfoCard 
          osVersion={staticInfo?.os_version ?? ''}
          uptime={uptime}
        />
      </HoloCard>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* CSS Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        body {
          background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
          overflow-x: hidden;
          color: #f3f4f6;
        }

        .floating-orbs {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .floating-orb {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
          animation: float 20s infinite ease-in-out;
        }

        .orb-1 { width: 300px; height: 300px; }
        .orb-2 { width: 200px; height: 200px; background: radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%); }
        .orb-3 { width: 150px; height: 150px; background: radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%); }
        .orb-4 { width: 250px; height: 250px; background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%); }
        .orb-5 { width: 180px; height: 180px; background: radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%); }
        .orb-6 { width: 120px; height: 120px; background: radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%); }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(100px, -100px) rotate(90deg); }
          50% { transform: translate(-50px, -200px) rotate(180deg); }
          75% { transform: translate(-150px, -50px) rotate(270deg); }
        }

        .grid-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: grid-move 20s linear infinite;
        }

        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }

        .holo-card {
          position: relative;
          background: rgba(15, 15, 35, 0.4);
          backdrop-filter: blur(20px) saturate(180%);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          cursor: pointer;
        }

        .holo-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(
            circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
            rgba(59, 130, 246, 0.15) 0%,
            transparent 50%
          );
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .holo-card:hover {
          transform: translateY(-2px) scale(1.02);
          border-color: rgba(59, 130, 246, 0.3);
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(59, 130, 246, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .holo-card:hover::before {
          opacity: 1;
        }

        .holo-card-content {
          position: relative;
          z-index: 1;
          padding: 2rem;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .system-header {
          position: fixed;
          top: 2rem;
          left: 2rem;
          right: 2rem;
          z-index: 100;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          background: rgba(15, 15, 35, 0.8);
          backdrop-filter: blur(30px) saturate(150%);
          border-radius: 24px;
          padding: 1.5rem 2rem;
          border: 1px solid rgba(59, 130, 246, 0.2);
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          animation: slide-down 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: visible;
          min-height: 60px;
        }

        @keyframes slide-down {
          from {
            transform: translateY(-100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .system-time {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.5rem;
          flex-shrink: 0;
          white-space: nowrap;
          min-width: fit-content;
        }

        .system-clock {
          font-size: 2rem;
          font-weight: 600;
          background: linear-gradient(135deg, #06b6d4, #3b82f6, #8b5cf6);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow: 0 0 30px rgba(59, 130, 246, 0.3);
          animation: pulse-glow 2s ease-in-out infinite alternate;
        }

        @keyframes pulse-glow {
          from { filter: brightness(1); }
          to { filter: brightness(1.2); }
        }

        .system-date {
          font-size: 0.9rem;
          color: #9ca3af;
          font-weight: 400;
        }

        .system-details {
            display: flex;
            gap: 1rem;
            align-items: center;
            flex-wrap: wrap;
            flex-shrink: 0;
            max-width: calc(100vw - 20rem);
            overflow: visible;
        }

        .system-details::-webkit-scrollbar {
          display: none;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.3s ease;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .detail-item:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(59, 130, 246, 0.3);
        }

        .detail-icon {
          font-size: 1.2rem;
          opacity: 0.8;
        }

        .detail-text {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .detail-label {
          font-size: 0.7rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 500;
        }

        .detail-value {
          font-size: 0.85rem;
          font-weight: 600;
          color: #f3f4f6;
        }

        .system-badge {
          position: relative;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 12px;
          padding: 0.75rem 1.5rem;
          overflow: hidden;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .badge-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .badge-subtext {
          font-size: 0.7rem;
          color: #9ca3af;
          font-weight: 400;
          opacity: 0.8;
        }

        .badge-glow {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(139, 92, 246, 0.05));
          animation: badge-pulse 2s ease-in-out infinite alternate;
        }

        @keyframes badge-pulse {
          from { opacity: 0.5; }
          to { opacity: 1; }
        }

        .badge-text {
          position: relative;
          z-index: 1;
          font-size: 0.9rem;
          font-weight: 600;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .no-select {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }

        .no-select * {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          outline: none !important;
        }

        .no-select:focus,
        .no-select *:focus {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }

        .network-stats {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap; /* Allow wrapping on small screens */
        }

        .network-stat-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
          min-width: 100px;
        }

        .stat-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: stat-pulse 1.5s ease-in-out infinite;
        }

        .download-indicator {
          background: #0ea5e9;
          box-shadow: 0 0 10px rgba(14, 165, 233, 0.5);
        }

        .upload-indicator {
          background: #10b981;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
        }

        @keyframes stat-pulse {
          0%, 100% { 
            transform: scale(1);
            opacity: 1;
          }
          50% { 
            transform: scale(1.2);
            opacity: 0.8;
          }
        }

        .stat-value {
          font-size: 0.6rem;
          font-weight: 600;
          color: #f3f4f6;
        }

        .stat-value-fixed {
            width: 80px;
            text-align: left;
            display: inline-block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .pulse-ring {
          animation: pulse-ring 2s infinite;
        }

        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 0.3; }
          100% { transform: scale(1); opacity: 0.6; }
        }

        .process-item {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
          animation: slide-up 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
        }

        @keyframes slide-up {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .process-item:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateX(8px);
          border-color: rgba(59, 130, 246, 0.3);
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
          animation: fade-in 1s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both;
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .gauge-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 80%;
        }

        .network-card {
          grid-column: span 2;
          min-height: 200px;
        }

        .processes-card {
          grid-column: span 2;
          min-height: 200px;
        }

        .water-ball {
        filter: drop-shadow(0 0 20px rgba(6, 182, 212, 0.3));
        }

        .water-wave {
        animation: wave-motion 3s ease-in-out infinite;
        transform-origin: center;
        }

        .wave-1 {
        animation-duration: 3s;
        }

        .wave-2 {
        animation-duration: 2.5s;
        animation-direction: reverse;
        }

        .wave-3 {
        animation-duration: 3.5s;
        }

        @keyframes wave-motion {
        0%, 100% { 
            transform: translateX(0) scaleY(1);
        }
        25% { 
            transform: translateX(-2px) scaleY(0.95);
        }
        50% { 
            transform: translateX(0) scaleY(1.05);
        }
        75% { 
            transform: translateX(2px) scaleY(0.98);
        }
        }

        .glass-highlight {
        animation: highlight-pulse 2s ease-in-out infinite;
        }

        @keyframes highlight-pulse {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 0.6; }
        }

        .mt-4 {
        margin-top: 1rem;
        }

        .dial-progress {
          filter: drop-shadow(0 0 8px currentColor);
        }

        .text-xl {
          font-size: 1.25rem; /* 20px */
          line-height: 1.75rem; /* 28px */
        }


        .text-gray-600 {
            color: #4b5563;
        }

        
        .w-full {
          width: 100%;
        }

        .space-y-2 > * + * {
          margin-top: 0.5rem;
        }

        .text-lg {
          font-size: 1.125rem; /* 18px */
          line-height: 1.75rem; /* 28px */
        }

        .font-semibold {
          font-weight: 600;
        }

        .mb-4 {
          margin-bottom: 1rem;
        }

        .py-8 {
          padding-top: 2rem;
          padding-bottom: 2rem;
        }

        .text-center {
        text-align: center;
        }

        .glow-text {
          text-shadow: 0 0 20px currentColor;
        }

        .text-transparent {
          color: transparent;
        }

        .bg-clip-text {
          -webkit-background-clip: text;
          background-clip: text;
        }

        .bg-gradient-to-r {
          background-image: linear-gradient(to right, var(--tw-gradient-stops));
        }

        .from-cyan-400 {
          --tw-gradient-from: #22d3ee;
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(34, 211, 238, 0));
        }

        .to-purple-400 {
          --tw-gradient-to: #a78bfa;
        }

        .from-green-400 {
            --tw-gradient-from: #4ade80;
            --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(74, 222, 128, 0));
        }

        .to-blue-400 {
            --tw-gradient-to: #60a5fa;
        }

        .bg-white\/10 {
            background-color: rgba(255, 255, 255, 0.1);
        }

        .text-cyan-400 {
            color: #22d3ee;
        }

        .text-purple-400 {
            color: #a78bfa;
        }

        .h-1 {
          height: 0.25rem;
        }

        .h-full {
          height: 100%;
        }

        .mt-1 {
          margin-top: 0.25rem;
        }

        .rounded-full {
          border-radius: 9999px;
        }

        .overflow-hidden {
          overflow: hidden;
        }

        .transition-all {
            transition-property: all;
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
            transition-duration: 150ms;
        }

        .duration-1000 {
            transition-duration: 1000ms;
        }

        .pt-32 {
          padding-top: 10rem;
        }

        .pb-8 {
          padding-bottom: 2rem;
        }

        .px-8 {
          padding-left: 2rem;
          padding-right: 2rem;
        }

        .z-10 {
          z-index: 10;
        }

        .relative {
          position: relative;
        }

        .text-2xl {
          font-size: 1.5rem; /* 24px */
          line-height: 2rem; /* 32px */
        }

        .font-bold {
          font-weight: 700;
        }

        .text-emerald-400 {
          color: #34d399;
        }

        .text-xs {
            font-size: 0.75rem; /* 12px */
            line-height: 1rem; /* 16px */
        }

        .text-gray-400 {
            color: #9ca3af;
        }

        .text-gray-500 {
            color: #6b7280;
        }

        .absolute {
            position: absolute;
        }

        .inset-0 {
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
        }

        .flex {
            display: flex;
        }

        .flex-col {
            flex-direction: column;
        }

        .items-center {
            align-items: center;
        }

        .justify-center {
            justify-content: center;
        }

        .justify-between {
          justify-content: space-between;
        }

        .gap-4 {
          gap: 1rem;
        }

        .gap-2 {
          gap: 0.5rem;
        }

        .text-sm {
          font-size: 0.875rem; /* 14px */
          line-height: 1.25rem; /* 20px */
        }

        .font-medium {
          font-weight: 500;
        }

        .truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .flex-1 {
          flex: 1 1 0%;
        }

        .mr-4 {
          margin-right: 1rem;
        }

        /* --- Mobile Styles --- */
        .mobile-main-container {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .mobile-card {
          border-radius: 16px;
        }

        .mobile-card .holo-card-content {
          padding: 1rem;
        }

        .network-mobile-card .holo-card-content {
          height: 250px; /* Give network card a fixed height on mobile */
        }

        .mobile-dashboard-stack {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .mobile-metric-item {
          width: 100%;
        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .metric-label {
          font-size: 0.875rem;
          color: #d1d5db;
        }

        .metric-value {
          font-size: 0.875rem;
          font-weight: 600;
        }

        .metric-bar-background {
          width: 100%;
          height: 8px;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }

        .metric-bar-foreground {
          height: 100%;
          border-radius: 4px;
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .mobile-info-card-content {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.05);
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
        }

        .info-label {
          font-size: 0.8rem;
          color: #9ca3af;
        }

        .info-value {
          font-size: 0.8rem;
          font-weight: 500;
          color: #e5e7eb;
        }

        .flex-grow {
          flex-grow: 1;
        }

        .flex-shrink-0 {
          flex-shrink: 0;
        }

        @media (max-width: 1200px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .network-card, .processes-card {
            grid-column: span 2;
          }
        }

        @media (max-width: 768px) {
          .system-header {
            display: none; /* Hide desktop header on mobile */
          }
          .metrics-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          .network-card, .processes-card {
            grid-column: span 1;
          }
          .pt-32 {
            padding-top: 1rem; /* Adjust for no header */
          }
          .px-8 {
            padding-left: 1rem;
            padding-right: 1rem;
          }
          .chart-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
        }
      `}</style>

      <AnimatedBackground />
      
      {isMobile ? renderMobileView() : renderDesktopView()}

    </div>
  );
}

export default App;
