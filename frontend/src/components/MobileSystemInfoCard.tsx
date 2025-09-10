import React from 'react';

interface MobileSystemInfoCardProps {
  osVersion: string;
  uptime: string;
  localIP: string;
}

const MobileSystemInfoCard: React.FC<MobileSystemInfoCardProps> = ({ osVersion, uptime, localIP }) => {
  if (!osVersion) return null;

  return (
    <div className="mobile-info-card-content">
      <h3 className="text-lg font-semibold mb-4 text-transparent bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text">系统信息</h3>
      <div className="info-item">
        <span className="info-label">系统版本</span>
        <span className="info-value">{osVersion}</span>
      </div>
      <div className="info-item">
        <span className="info-label">运行时间</span>
        <span className="info-value">{uptime}</span>
      </div>
      <div className="info-item">
        <span className="info-label">本机IP</span>
        <span className="info-value">{localIP}</span>
      </div>
    </div>
  );
};

export default MobileSystemInfoCard;