import React from 'react';

interface MobileSystemInfoCardProps {
  osVersion: string;
  uptime: string;
}

const MobileSystemInfoCard: React.FC<MobileSystemInfoCardProps> = ({ osVersion, uptime }) => {
  if (!osVersion) return null;

  return (
    <div className="mobile-info-card-content">
      <div className="info-item">
        <span className="info-label">Operating System</span>
        <span className="info-value">{osVersion}</span>
      </div>
      <div className="info-item">
        <span className="info-label">System Uptime</span>
        <span className="info-value">{uptime}</span>
      </div>
    </div>
  );
};

export default MobileSystemInfoCard;