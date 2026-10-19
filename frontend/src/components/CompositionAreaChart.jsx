import React, { useState } from 'react';
import { Icon } from './Icon';

const COMPOSITION_SERIES = [
  { key: 'putra', label: 'Santri Putra', color: '#10b981', fillId: 'compositionPutraFill' },
  { key: 'putri', label: 'Santri Putri', color: '#f43f5e', fillId: 'compositionPutriFill' },
  { key: 'alumni', label: 'Alumni', color: '#0ea5e9', fillId: 'compositionAlumniFill' }
];

export const CompositionAreaChart = ({ 
  monthlyData, 
  totalCount, 
  selectedYearLabel, 
  onExport, 
  compositionYear, 
  onYearChange, 
  yearOptions 
}) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [hoveredSeriesKey, setHoveredSeriesKey] = useState(null);

  const w = 560;
  const h = 200; // Increased height to give the chart more vertical breathing room
  const padX = 48;
  const padY = 24;
  const gradSuffix = String(compositionYear).replace(/\W/g, '');

  const hasData = monthlyData.some(d => d.putra + d.putri + d.alumni > 0);
  const maxVal = Math.max(...monthlyData.flatMap(d => [d.putra, d.putri, d.alumni]), 1);

  const getX = (idx) => padX + (idx * ((w - padX * 2) / (monthlyData.length - 1 || 1)));
  const getY = (val) => h - padY - ((val / maxVal) * (h - padY * 2));

  const smoothLine = (pts) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const seriesPaths = COMPOSITION_SERIES.map(series => {
    const points = monthlyData.map((d, i) => ({
      x: getX(i),
      y: getY(d[series.key]),
      value: d[series.key],
      month: d.month,
      monthFull: d.monthFull
    }));
    const linePath = smoothLine(points);
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${h - padY} L ${points[0].x} ${h - padY} Z`;
    return { ...series, points, linePath, areaPath };
  });

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(pct => {
    const val = Math.round(maxVal * pct);
    return { val, y: getY(val) };
  });

  const hoveredMonth = hoveredIdx !== null ? monthlyData[hoveredIdx] : null;

  return (
    <div className="w-full h-full flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 p-0.5 rounded-lg flex-shrink-0">
            {COMPOSITION_SERIES.map((series) => {
              const isDimmed = hoveredSeriesKey !== null && hoveredSeriesKey !== series.key;
              const isActive = hoveredSeriesKey === series.key;
              return (
                <button
                  type="button"
                  key={series.key}
                  onMouseEnter={() => setHoveredSeriesKey(series.key)}
                  onMouseLeave={() => setHoveredSeriesKey(null)}
                  title={series.label}
                  className={`w-5 h-5 rounded-md flex items-center justify-center bg-white border border-slate-100 transition-all duration-200 cursor-pointer focus:outline-none select-none
                    ${isDimmed ? 'opacity-30 scale-90' : 'opacity-100 scale-100'} 
                    ${isActive ? 'border-slate-200 shadow-sm scale-105' : ''}`}
                >
                  <span 
                    className="w-2 h-2 rounded-full transition-all duration-200" 
                    style={{ backgroundColor: series.color }} 
                  />
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-0.5">
            <h4 className="font-semibold text-slate-800 text-sm leading-none">Komposisi Santri</h4>
            <p className="text-[10px] text-slate-400">
              Diagram <span className="text-emerald-600 font-semibold">{selectedYearLabel}</span>
              {' · '}Total <span className="text-emerald-600 font-semibold">{totalCount}</span> santri
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          <div className="relative">
            <select
              value={compositionYear}
              onChange={(e) => onYearChange(e.target.value)}
              className="appearance-none pl-2.5 pr-7 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-600 hover:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer transition-all"
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>{y === 'Semua' ? 'Semua Tahun' : y}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-slate-400">
              <Icon name="chevron-down" size={12} />
            </div>
          </div>
          <button
            type="button"
            onClick={onExport}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-600 hover:bg-slate-50 hover:border-emerald-200 transition-all flex items-center gap-1.5"
          >
            <Icon name="download" size={11} />
            <span>Ekspor</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 w-full min-h-[200px] relative rounded-xl bg-slate-50/50 border border-slate-100 overflow-hidden">
        {!hasData ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
            <Icon name="line-chart" size={40} className="mb-2 opacity-20" />
            <p className="text-sm font-semibold">Belum ada data pendaftaran {compositionYear}</p>
          </div>
        ) : (
          <div className="absolute inset-0 w-full h-full p-2 select-none">
            {/* Y-axis labels */}
            <div className="absolute inset-0 pointer-events-none">
              {yTicks.map((tick, i) => (
                <div 
                  key={i} 
                  className="absolute text-[9px] font-medium text-slate-400 tracking-tight"
                  style={{
                    left: `${padX - 10}px`,
                    top: `${(tick.y / h) * 100}%`,
                    transform: 'translate(-100%, -50%)'
                  }}
                >
                  {tick.val}
                </div>
              ))}
            </div>

            {/* SVG Chart paths, gridlines & highlights */}
            <svg 
              viewBox={`0 0 ${w} ${h}`} 
              className="w-full h-full overflow-visible" 
              preserveAspectRatio="none"
            >
              <defs>
                {COMPOSITION_SERIES.map(series => (
                  <linearGradient key={`${series.fillId}-${gradSuffix}`} id={`${series.fillId}-${gradSuffix}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={series.color} stopOpacity="0.25" />
                    <stop offset="50%" stopColor={series.color} stopOpacity="0.08" />
                    <stop offset="100%" stopColor={series.color} stopOpacity="0.00" />
                  </linearGradient>
                ))}
              </defs>

              {/* Horizontal Grid lines */}
              {yTicks.map((tick, i) => (
                <line 
                  key={i} 
                  x1={padX} 
                  y1={tick.y} 
                  x2={w - padX} 
                  y2={tick.y} 
                  stroke="#f1f5f9" 
                  strokeWidth="1" 
                />
              ))}

              {/* Active Month Laser Guideline */}
              {hoveredIdx !== null && (
                <line 
                  x1={getX(hoveredIdx)} 
                  y1={padY} 
                  x2={getX(hoveredIdx)} 
                  y2={h - padY} 
                  stroke="#cbd5e1" 
                  strokeWidth="1.5" 
                  strokeDasharray="4 3" 
                  className="transition-all duration-150"
                />
              )}

              {/* Area & Stroke Lines for each series */}
              {seriesPaths.map(series => {
                const isDimmed = hoveredSeriesKey !== null && hoveredSeriesKey !== series.key;
                const isHighlighted = hoveredSeriesKey === series.key;
                return (
                  <g 
                    key={series.key} 
                    className="transition-opacity duration-300"
                    style={{
                      opacity: isDimmed ? 0.15 : 1
                    }}
                  >
                    {/* Gradient Fill under path */}
                    <path 
                      d={series.areaPath} 
                      fill={`url(#${series.fillId}-${gradSuffix})`} 
                    />
                    
                    {/* Shadow / Glow Line */}
                    <path 
                      d={series.linePath} 
                      fill="none" 
                      stroke={series.color} 
                      strokeWidth={isHighlighted ? "5" : "4"} 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="opacity-[0.08]"
                      vectorEffect="non-scaling-stroke"
                    />

                    {/* Main Curve Line */}
                    <path 
                      d={series.linePath} 
                      fill="none" 
                      stroke={series.color} 
                      strokeWidth={isHighlighted ? "2.5" : "2"} 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                );
              })}

              {/* Active data nodes on hover */}
              {hoveredIdx !== null && seriesPaths.map(series => {
                const p = series.points[hoveredIdx];
                if (!p || p.value === 0) return null;
                
                const isDimmed = hoveredSeriesKey !== null && hoveredSeriesKey !== series.key;
                if (isDimmed) return null;

                return (
                  <g key={series.key}>
                    {/* Pulsing ring */}
                    <circle 
                      cx={p.x} 
                      cy={p.y} 
                      r="5.5" 
                      fill={series.color} 
                      className="opacity-20" 
                    />
                    {/* Solid center dot */}
                    <circle 
                      cx={p.x} 
                      cy={p.y} 
                      r="3.5" 
                      fill="#fff" 
                      stroke={series.color} 
                      strokeWidth="2" 
                    />
                  </g>
                );
              })}

              {/* Mouse interactive zones */}
              {monthlyData.map((d, i) => {
                const x = getX(i);
                return (
                  <g 
                    key={i} 
                    onMouseEnter={() => setHoveredIdx(i)} 
                    onMouseLeave={() => setHoveredIdx(null)} 
                    className="cursor-pointer"
                  >
                    {/* Transparent bar for easy hover detection */}
                    <rect 
                      x={x - (w - padX * 2) / (2 * (monthlyData.length - 1))} 
                      y={0} 
                      width={(w - padX * 2) / (monthlyData.length - 1)} 
                      height={h} 
                      fill="transparent" 
                    />
                  </g>
                );
              })}
            </svg>

            {/* X-axis labels */}
            <div className="absolute left-0 right-0 bottom-1 h-4 pointer-events-none">
              {monthlyData.map((d, i) => {
                const isHovered = hoveredIdx === i;
                return (
                  <div
                    key={i}
                    className={`absolute text-[10px] font-medium tracking-wide -translate-x-1/2 transition-all duration-150
                      ${isHovered ? 'text-slate-700 font-semibold' : 'text-slate-400'}`}
                    style={{
                      left: `${(getX(i) / w) * 100}%`
                    }}
                  >
                    {d.month}
                  </div>
                );
              })}
            </div>

            {/* Tooltip */}
            {hoveredIdx !== null && hoveredMonth && (
              <div 
                className="absolute z-30 pointer-events-none transition-all duration-150 ease-out"
                style={{
                  left: `${(getX(hoveredIdx) / w) * 100}%`,
                  top: '12px',
                  transform: getX(hoveredIdx) > w / 2 ? 'translateX(-106%)' : 'translateX(6%)',
                }}
              >
                <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-lg min-w-[140px]">
                  <p className="font-semibold text-slate-800 border-b border-slate-100 pb-1.5 mb-2 text-[10px] uppercase tracking-wider">
                    {hoveredMonth.monthFull}
                  </p>
                  <div className="space-y-1">
                    {COMPOSITION_SERIES.map((series) => {
                      const isDimmed = hoveredSeriesKey !== null && hoveredSeriesKey !== series.key;
                      return (
                        <div 
                          key={series.key} 
                          className={`flex items-center justify-between gap-4 transition-opacity duration-200
                            ${isDimmed ? 'opacity-30' : 'opacity-100'}`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: series.color }} />
                            <span className="text-slate-500 font-medium text-[10px]">{series.label}</span>
                          </div>
                          <span className="font-semibold text-[11px]" style={{ color: series.color }}>
                            {hoveredMonth[series.key]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
