import React from 'react';
import DialGauge from './DialGauge';

const LoadAverage: React.FC<{
  load: { load1: number; load5: number; load15: number } | undefined;
  cpuCores: number;
}> = ({ load, cpuCores }) => {
  if (!load) {
    return null;
  }

  // The gauge's maximum value is 2x the number of CPU cores.
  const maxValue = cpuCores * 2;

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="flex items-center justify-between">
        {/* 1 minute gauge */}
        <div className="flex-1 flex justify-center">
          <DialGauge
            value={load.load1}
            maxValue={maxValue}
            label="系统负载"
          />
        </div>

        {/* 5min and 15min gauges */}
        <div className="flex flex-col gap-2">
          <div style={{ zoom: 0.5 }}>
            <DialGauge
              value={load.load5}
              maxValue={maxValue}
              label="5 min"
            />
          </div>
          <div style={{ zoom: 0.5 }}>
            <DialGauge
              value={load.load15}
              maxValue={maxValue}
              label="15 min"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadAverage;
