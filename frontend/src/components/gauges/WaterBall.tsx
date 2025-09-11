import React, { useState, useEffect } from 'react';

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

export default WaterBall;
