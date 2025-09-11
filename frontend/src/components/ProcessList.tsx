import React from 'react';
import { type Process } from '../types';
import { formatBytes } from '../utils';

const ProcessList: React.FC<{ processes: Process[] }> = ({ processes }) => {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4 text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text">
        活跃进程
      </h3>
      <div className="space-y-2">
        {processes.length > 0 ? processes.slice(0, 5).map((process, index) => (
          <div
            key={process.pid}
            className="process-item"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium truncate flex-1 mr-4">{process.name}</span>
              <div className="flex gap-4 text-xs">
                <span className="text-cyan-400">{process.cpu_percent.toFixed(1)}%</span>
                <span className="text-purple-400">{formatBytes(process.memory_rss)}</span>
              </div>
            </div>
            <div className="mt-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(process.cpu_percent, 100)}%` }}
              ></div>
            </div>
          </div>
        )) : (
          <div className="text-gray-400 text-center py-8">加载中...</div>
        )}
      </div>
    </div>
  );
};

export default ProcessList;
