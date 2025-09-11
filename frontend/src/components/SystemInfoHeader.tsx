import React, { useState, useEffect } from 'react';
import { type StaticInfo } from '../types';
import { formatBytes } from '../utils';

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

export default SystemInfoHeader;
