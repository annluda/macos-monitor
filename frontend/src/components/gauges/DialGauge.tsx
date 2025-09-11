import React from 'react';

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

export default DialGauge;
