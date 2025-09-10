
import React from 'react';

interface MetricItemProps {
  label: string;
  percent: number;
  color: string;
  valueText?: string;
}

const MetricItem: React.FC<MetricItemProps> = ({ label, percent, color, valueText }) => {
  return (
    <div className="mobile-metric-item">
      <div className="metric-header">
        <span className="metric-label">{label}</span>
        <span className="metric-value" style={{ color }}>
          {valueText || `${percent.toFixed(1)}%`}
        </span>
      </div>
      <div className="metric-bar-background">
        <div
          className="metric-bar-foreground"
          style={{ width: `${percent}%`, backgroundColor: color }}
        ></div>
      </div>
    </div>
  );
};

interface MobileDashboardStackProps {
  cpuPercent: number;
  memPercent: number;
  diskPercent: number;
  load1: number;
  cpuCores: number;
  getGaugeColor: (percent: number) => string;
}

const MobileDashboardStack: React.FC<MobileDashboardStackProps> = (
  { cpuPercent, memPercent, diskPercent, load1, cpuCores, getGaugeColor }
) => {

  const loadPercent = Math.min((load1 / (cpuCores > 0 ? cpuCores : 1)) * 100, 100);

  return (
    <div className="mobile-dashboard-stack">
      <MetricItem
        label="CPU"
        percent={cpuPercent}
        color={getGaugeColor(cpuPercent)}
      />
      <MetricItem
        label="内存"
        percent={memPercent}
        color={getGaugeColor(memPercent)}
      />
      <MetricItem
        label="磁盘"
        percent={diskPercent}
        color={getGaugeColor(diskPercent)}
      />
      <MetricItem
        label="负载"
        percent={loadPercent}
        valueText={load1.toFixed(2)}
        color={getGaugeColor(loadPercent)} // Or a different color logic for load
      />
    </div>
  );
};

export default MobileDashboardStack;
