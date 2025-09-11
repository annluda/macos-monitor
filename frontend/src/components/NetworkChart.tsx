import React from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { formatBytes } from '../utils';

const NetworkChart: React.FC<{ data: any[], isMobile: boolean }> = ({ data, isMobile }) => {

  const currentDownload = data[data.length - 1]?.download || 0;
  const currentUpload = data[data.length - 1]?.upload || 0;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 flex-shrink-0 chart-header">
        <h3 className="text-lg font-semibold text-transparent bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text">
          网络活动
        </h3>
        <div className="network-stats">
          <div className="network-stat-item">
            <div className="stat-indicator download-indicator"></div>
            <span className="stat-value stat-value-fixed">↓ {formatBytes(Math.abs(currentDownload))}/s</span>
          </div>
          <div className="network-stat-item">
            <div className="stat-indicator upload-indicator"></div>
            <span className="stat-value stat-value-fixed">↑ {formatBytes(currentUpload)}/s</span>
          </div>
        </div>
      </div>
      <div className="relative w-full flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            {!isMobile && (
              <defs>
                <linearGradient id="downloadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="uploadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
            )}
            <Area
              type="monotone"
              dataKey="download"
              stroke="#0ea5e9"
              strokeWidth={isMobile ? 2 : 3}
              fillOpacity={1}
              fill={isMobile ? 'none' : 'url(#downloadGradient)'}
              dot={false}
              activeDot={false}
              style={!isMobile ? { filter: 'drop-shadow(0 0 8px #0ea5e940)' } : {}}
            />
            <Area
              type="monotone"
              dataKey="upload"
              stroke="#10b981"
              strokeWidth={isMobile ? 2 : 3}
              fillOpacity={1}
              fill={isMobile ? 'none' : 'url(#uploadGradient)'}
              dot={false}
              activeDot={false}
              style={!isMobile ? { filter: 'drop-shadow(0 0 8px #10b98140)' } : {}}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default NetworkChart;
