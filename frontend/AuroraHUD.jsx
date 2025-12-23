import React, { useState, useEffect } from 'react';

const AuroraHUD = () => {
  const [cpuLoad, setCpuLoad] = useState(23);
  const [memoryUsed, setMemoryUsed] = useState(58);
  const [diskUsed, setDiskUsed] = useState(72);
  const [networkData, setNetworkData] = useState(Array(80).fill(0));
  const [time, setTime] = useState(new Date());
  const [topProcesses, setTopProcesses] = useState([
    { name: 'Safari', cpu: 45.2 },
    { name: 'VS Code', cpu: 23.8 },
    { name: 'Chrome', cpu: 18.5 },
    { name: 'Spotify', cpu: 8.3 },
    { name: 'Terminal', cpu: 4.2 }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCpuLoad(prev => Math.max(3, Math.min(98, prev + (Math.random() - 0.48) * 15)));
      setMemoryUsed(prev => Math.max(15, Math.min(95, prev + (Math.random() - 0.5) * 3)));
      setDiskUsed(prev => Math.max(40, Math.min(98, prev + (Math.random() - 0.5) * 1)));
      
      setNetworkData(prev => {
        const newVal = 20 + Math.random() * 60;
        return [...prev.slice(1), newVal];
      });
      
      setTopProcesses(prev => prev.map(proc => ({
        ...proc,
        cpu: Math.max(0.1, Math.min(95, proc.cpu + (Math.random() - 0.5) * 8))
      })).sort((a, b) => b.cpu - a.cpu));
      
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 根据CPU负载动态调整背景
  const getAuroraStyle = () => {
    const intensity = cpuLoad / 100;
    
    if (cpuLoad < 30) {
      return {
        bg: 'linear-gradient(135deg, #0a1929 0%, #1a2980 50%, #26d0ce 100%)',
        speed: 25,
        opacity: 0.3
      };
    } else if (cpuLoad < 65) {
      return {
        bg: 'linear-gradient(135deg, #1a2a6c 0%, #b21f1f 50%, #fdbb2d 100%)',
        speed: 15,
        opacity: 0.5
      };
    } else {
      return {
        bg: 'linear-gradient(135deg, #360033 0%, #0b8793 50%, #d31027 100%)',
        speed: 8,
        opacity: 0.7
      };
    }
  };

  const aurora = getAuroraStyle();

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* 流动极光背景 */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: aurora.bg,
          animation: `flow ${aurora.speed}s ease-in-out infinite`
        }}
      />
      
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at ${50 + cpuLoad/2}% ${50 - cpuLoad/3}%, rgba(255,255,255,0.2) 0%, transparent 60%)`,
          animation: `pulse ${aurora.speed * 0.7}s ease-in-out infinite`
        }}
      />

      <style>{`
        @keyframes flow {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.1) rotate(3deg); }
          50% { transform: scale(1.05) rotate(-2deg); }
          75% { transform: scale(1.08) rotate(2deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }
        @keyframes glow {
          0%, 100% { text-shadow: 0 0 20px rgba(255,255,255,0.3), 0 0 40px rgba(255,255,255,0.2); }
          50% { text-shadow: 0 0 30px rgba(255,255,255,0.5), 0 0 60px rgba(255,255,255,0.3); }
        }
      `}</style>

      {/* 主要内容层 */}
      <div className="relative z-10 h-full flex items-center justify-center p-16">
        
        {/* CPU - 视觉中心的巨大数字 */}
        <div className="absolute left-32 top-1/2 -translate-y-1/2">
          <div 
            className="text-[28rem] leading-none"
            style={{
              fontWeight: cpuLoad > 70 ? 900 : 200,
              color: 'rgba(255,255,255,0.95)',
              textShadow: `0 0 ${cpuLoad}px rgba(255,255,255,${cpuLoad/150})`,
              transition: 'all 0.3s ease',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '-0.05em'
            }}
          >
            {Math.round(cpuLoad)}
          </div>
          <div 
            className="text-2xl tracking-[0.5em] uppercase mt-8 ml-4"
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontWeight: 300
            }}
          >
            Processor
          </div>
        </div>

        {/* Memory & Disk - 行星轨道式设计 */}
        <div className="absolute right-32 top-1/3 space-y-24">
          {/* Memory 轨道 */}
          <div className="relative">
            <svg width="280" height="280" className="transform -rotate-90">
              <circle
                cx="140"
                cy="140"
                r="120"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1.5"
                strokeDasharray="4 8"
              />
              <circle
                cx="140"
                cy="140"
                r="120"
                fill="none"
                stroke="rgba(255,255,255,0.85)"
                strokeWidth="1.5"
                strokeDasharray={`${(memoryUsed / 100) * 754} 754`}
                strokeLinecap="round"
                style={{
                  filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.6))',
                  transition: 'all 0.5s ease'
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-7xl font-extralight" style={{ color: 'rgba(255,255,255,0.95)' }}>
                {Math.round(memoryUsed)}
              </div>
              <div className="text-xs tracking-[0.4em] uppercase mt-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Memory
              </div>
            </div>
          </div>

          {/* Disk 轨道 */}
          <div className="relative">
            <svg width="200" height="200" className="transform rotate-45">
              <circle
                cx="100"
                cy="100"
                r="85"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1.5"
                strokeDasharray="4 8"
              />
              <circle
                cx="100"
                cy="100"
                r="85"
                fill="none"
                stroke="rgba(255,255,255,0.85)"
                strokeWidth="1.5"
                strokeDasharray={`${(diskUsed / 100) * 534} 534`}
                strokeLinecap="round"
                style={{
                  filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.6))',
                  transition: 'all 0.5s ease'
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center -rotate-45">
              <div className="text-5xl font-extralight" style={{ color: 'rgba(255,255,255,0.95)' }}>
                {Math.round(diskUsed)}
              </div>
              <div className="text-xs tracking-[0.4em] uppercase mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Storage
              </div>
            </div>
          </div>
        </div>

        {/* Network 波浪 - 心电图样式 */}
        <div className="absolute bottom-0 left-0 right-0 h-40 flex items-end pb-12">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 100">
            <defs>
              <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.8)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.2)" />
              </linearGradient>
            </defs>
            <polyline
              points={networkData.map((val, i) => `${i * (1000/networkData.length)},${100 - val}`).join(' ')}
              fill="none"
              stroke="url(#waveGradient)"
              strokeWidth="2"
              style={{
                filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.5))'
              }}
            />
          </svg>
          <div 
            className="absolute bottom-4 right-16 text-xs tracking-[0.3em] uppercase"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            Network
          </div>
        </div>

        {/* 系统信息 - 左下角注脚 */}
        <div 
          className="absolute bottom-8 left-8 text-[10px] tracking-wider leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          <div>MacBook Pro M3 Max • macOS Sequoia</div>
          <div className="mt-1">{time.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
        </div>

        {/* 时间 - 右上角 */}
        <div className="absolute top-16 right-16 text-right">
          <div className="text-8xl font-extralight tracking-tight" style={{ color: 'rgba(255,255,255,0.9)' }}>
            {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </div>
          <div 
            className="text-sm tracking-[0.5em] uppercase mt-3"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            {time.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}
          </div>
        </div>

        {/* Top 5 Processes - 杂志式列表 */}
        <div className="absolute top-64 right-16 w-80">
          <div 
            className="text-xs tracking-[0.5em] uppercase mb-6"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            Top Processes
          </div>
          <div className="space-y-3">
            {topProcesses.map((proc, idx) => (
              <div 
                key={proc.name}
                className="relative"
                style={{
                  animation: `fadeIn 0.6s ease ${idx * 0.1}s both`
                }}
              >
                <div className="flex items-baseline justify-between mb-1">
                  <span 
                    className="text-lg font-light tracking-wide"
                    style={{ color: 'rgba(255,255,255,0.85)' }}
                  >
                    {proc.name}
                  </span>
                  <span 
                    className="text-2xl font-extralight tabular-nums"
                    style={{ 
                      color: 'rgba(255,255,255,0.95)',
                      textShadow: `0 0 10px rgba(255,255,255,${proc.cpu/100})`
                    }}
                  >
                    {proc.cpu.toFixed(1)}
                  </span>
                </div>
                <div className="h-px bg-white/10 relative overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full bg-white/60 transition-all duration-500"
                    style={{ 
                      width: `${proc.cpu}%`,
                      boxShadow: '0 0 8px rgba(255,255,255,0.5)'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateX(20px); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default AuroraHUD;