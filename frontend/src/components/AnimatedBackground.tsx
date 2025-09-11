import React from 'react';

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

export default AnimatedBackground;
