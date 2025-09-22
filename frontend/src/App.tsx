import { useState, useEffect, useRef } from 'react';
import { useResponsive } from './hooks/useResponsive';
import MobileDashboardStack from './components/MobileDashboardStack';
import MobileSystemInfoCard from './components/MobileSystemInfoCard';
import type { StaticInfo, DynamicMetrics } from './types';
import { formatBytes, formatUptime } from './utils';
import AnimatedBackground from './components/AnimatedBackground';
import GlowingGauge from './components/gauges/GlowingGauge';
import HoloCard from './components/cards/HoloCard';
import WaterBall from './components/gauges/WaterBall';
import LoadAverage from './components/gauges/LoadAverage';
import ProcessList from './components/ProcessList';
import NetworkChart from './components/NetworkChart';
import SystemInfoHeader from './components/SystemInfoHeader';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE; 
const WS_BASE_URL = import.meta.env.VITE_WS_BASE; 


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
    fetch(`${API_BASE_URL}/api/system/static`)
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
      fetch(`${API_BASE_URL}/api/system/dynamic`)
        .then(res => res.json())
        .then(setDynamicMetrics)
        .catch(console.error);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket for real-time network data
  useEffect(() => {
    const ws = new WebSocket(`ws://${WS_BASE_URL}/ws/network`);
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
              <div>{staticInfo && dynamicMetrics ? formatBytes(staticInfo.total_disk - dynamicMetrics.disk_used, 1) : '...'} 可用</div>
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
          osVersion={staticInfo?.os_version ?? '--'}
          uptime={uptime}
          localIP={staticInfo?.local_ip ?? '--'}
        />
      </HoloCard>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      {isMobile ? renderMobileView() : renderDesktopView()}

    </div>
  );
}

export default App;