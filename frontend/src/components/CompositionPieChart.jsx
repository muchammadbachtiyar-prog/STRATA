import React, { useState } from 'react';
import { Icon } from './Icon';

export const CompositionPieChart = ({ data, totalCount, title = "Proporsi Santri" }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  
  const radius = 38;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius; // ~238.76

  // Filter out items with 0 values to avoid rendering empty strokes
  const activeData = data.filter(item => item.value > 0);
  const totalValue = activeData.reduce((sum, item) => sum + item.value, 0);

  // Calculate cumulative offsets
  let accumulatedPercent = 0;

  // Icons mapping for category representation
  const getCategoryIcon = (name) => {
    switch (name.toLowerCase()) {
      case 'putra': return 'user';
      case 'putri': return 'user';
      case 'alumni': return 'graduation-cap';
      default: return 'users';
    }
  };

  return (
    <div className="flex flex-col h-full relative z-10">
      {/* Header */}
      <div className="w-full mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-emerald-600 rounded-full" />
          <h4 className="font-semibold text-slate-800 text-sm">{title}</h4>
        </div>
        <span className="text-[9px] bg-emerald-50 text-emerald-600 font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider border border-emerald-100">
          Live
        </span>
      </div>

      {totalValue === 0 ? (
        <div className="h-40 flex flex-col items-center justify-center text-slate-400 w-full text-center">
          <Icon name="users" size={24} className="text-slate-300 mb-2" />
          <p className="text-xs font-medium">Tidak ada data untuk proporsi santri</p>
        </div>
      ) : (
        <div className="flex flex-col items-center w-full flex-1 justify-between min-h-[200px]">
          {/* Donut */}
          <div className="relative w-32 h-32 flex items-center justify-center my-1 select-none">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth={strokeWidth} />
              
              {activeData.map((item, idx) => {
                const percent = item.value / totalValue;
                const gap = activeData.length > 1 ? 5 : 0;
                const strokeLength = Math.max(0.1, (percent * circumference) - gap);
                const strokeOffset = circumference - (accumulatedPercent * circumference) + (gap / 2);
                accumulatedPercent += percent;
                const isHovered = hoveredIdx === idx;
                
                return (
                  <circle
                    key={item.name}
                    cx="50" cy="50" r={radius}
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth={isHovered ? strokeWidth + 2 : strokeWidth}
                    strokeDasharray={`${strokeLength} ${circumference}`}
                    strokeDashoffset={strokeOffset}
                    strokeLinecap="round"
                    className="transition-all duration-200 cursor-pointer origin-center"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    style={{ transformOrigin: '50px 50px' }}
                  />
                );
              })}
            </svg>

            {/* Center */}
            <div className="absolute inset-5 rounded-full bg-white shadow-sm flex flex-col items-center justify-center text-center border border-slate-50">
              <span className="text-xl font-bold text-slate-800 leading-none tabular-nums">
                {hoveredIdx !== null ? activeData[hoveredIdx].value : totalCount}
              </span>
              <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider mt-1 flex items-center gap-1">
                <Icon 
                  name={hoveredIdx !== null ? getCategoryIcon(activeData[hoveredIdx].name) : 'users'} 
                  size={9} 
                  className={hoveredIdx !== null ? (activeData[hoveredIdx].name === 'Putra' ? 'text-emerald-500' : activeData[hoveredIdx].name === 'Putri' ? 'text-rose-500' : 'text-sky-500') : 'text-slate-400'} 
                />
                {hoveredIdx !== null ? activeData[hoveredIdx].name : 'Total'}
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="w-full mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-1.5">
            {data.map((item, idx) => {
              const percent = totalValue > 0 ? Math.round((item.value / totalValue) * 100) : 0;
              const isHovered = hoveredIdx === idx;
              
              return (
                <div 
                  key={item.name}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className={`flex flex-col items-center p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                    isHovered 
                      ? 'bg-slate-50 border border-slate-100 scale-[1.02]' 
                      : 'bg-transparent border border-transparent hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[8px] font-semibold text-slate-500 uppercase tracking-wider">{item.name}</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 leading-none">{item.value}</span>
                  <span className="text-[8px] text-slate-400 font-medium mt-0.5">{percent}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
