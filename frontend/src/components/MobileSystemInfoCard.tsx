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