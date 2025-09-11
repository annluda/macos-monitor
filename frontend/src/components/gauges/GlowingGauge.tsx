import React from 'react';

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

export default GlowingGauge;
