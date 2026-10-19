import React, { useState, useMemo } from 'react';
import { Icon } from './Icon';
import { formatShortRupiah, formatRupiah, ISLAMIC_MONTHS, BULANAN_ITEMS } from '../utils/helpers';

const SHORT_MONTHS = [
  'Mhrm', 'Sfr', 'R.Awl', 'R.Akhr',
  'J.Awl', 'J.Akhr', 'Rajb', "Sya'b",
  'Rdhn', 'Sywl', 'Dzlq', 'Dzlh'
];

export const BulananFlowChart = ({ allBulananData = [], selectedYear, onYearChange, availableYears = [] }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Aggregate data per Islamic month
  const monthlyData = useMemo(() => {
    return ISLAMIC_MONTHS.map((month, idx) => {
      const entries = allBulananData.filter(e =>
        e.hijriMonth === month &&
        (!selectedYear || String(e.academicYear) === String(selectedYear))
      );
      const total = entries.reduce((sum, e) => {
        let entrySum = 0;
        if (e.makan) entrySum += BULANAN_ITEMS.find(i => i.key === 'makan')?.nominal || 0;
        if (e.laundry) entrySum += BULANAN_ITEMS.find(i => i.key === 'laundry')?.nominal || 0;
        if (e.ziaroh) entrySum += BULANAN_ITEMS.find(i => i.key === 'ziaroh')?.nominal || 0;
        return sum + entrySum;
      }, 0);
      return { month, shortMonth: SHORT_MONTHS[idx], total, count: entries.length };
    });
  }, [allBulananData, selectedYear]);

  const maxValue = Math.max(...monthlyData.map(d => d.total), 1);
  const totalIncome = monthlyData.reduce((sum, d) => sum + d.total, 0);
  const activeMonths = monthlyData.filter(d => d.total > 0).length;
  const peakMonth = monthlyData.reduce((a, b) => b.total > a.total ? b : a, monthlyData[0]);

  // SVG dimensions
  const W = 560;
  const H = 160;
  const padL = 48;
  const padR = 12;
  const padT = 14;
  const padB = 32;
  const cw = W - padL - padR;
  const ch = H - padT - padB;

  const pts = monthlyData.map((d, i) => ({
    x: padL + (i / (monthlyData.length - 1)) * cw,
    y: padT + ch - (d.total / maxValue) * ch,
    ...d,
    idx: i
  }));

  // Smooth bezier path
  const linePath = pts.map((p, i) => {
    if (i === 0) return `M ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    const cpx = ((pts[i - 1].x + p.x) / 2).toFixed(2);
    return `C ${cpx} ${pts[i - 1].y.toFixed(2)}, ${cpx} ${p.y.toFixed(2)}, ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }).join(' ');

  const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(2)} ${(padT + ch).toFixed(2)} L ${pts[0].x.toFixed(2)} ${(padT + ch).toFixed(2)} Z`;

  const activePoint = hoveredIdx !== null ? pts[hoveredIdx] : null;

  return (
    <div className="w-full flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-500"></div>
            <h4 className="font-semibold text-slate-800 text-sm">Grafik Syahriyah</h4>
          </div>
          <p className="text-[10px] text-slate-400 ml-3.5">
            Total uang masuk syahriyah tahun{' '}
            <span className="font-semibold text-sky-600">{selectedYear}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <span className="px-2 py-0.5 bg-sky-50 text-sky-600 rounded-md text-[10px] font-semibold border border-sky-100">
              {activeMonths} bulan aktif
            </span>
            {peakMonth.total > 0 && (
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-semibold border border-emerald-100">
                Puncak: {peakMonth.shortMonth}
              </span>
            )}
          </div>

          {availableYears.length > 0 && (
            <select
              value={selectedYear}
              onChange={e => onYearChange(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-semibold text-emerald-700 outline-none cursor-pointer focus:ring-2 focus:ring-sky-400/20 transition-all"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 w-full relative min-h-[160px]">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="bulananAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="bulananLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(pct => {
            const y = padT + ch - pct * ch;
            return (
              <g key={pct}>
                <line
                  x1={padL} y1={y} x2={W - padR} y2={y}
                  stroke="#e2e8f0" strokeWidth="0.5"
                  strokeDasharray={pct === 0 ? 'none' : '3 4'}
                />
                {pct > 0 && (
                  <text
                    x={padL - 5} y={y + 3}
                    textAnchor="end"
                    fontSize="7"
                    fill="#94a3b8"
                    fontWeight="500"
                  >
                    {formatShortRupiah(maxValue * pct)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Area fill */}
          {totalIncome > 0 && (
            <path d={areaPath} fill="url(#bulananAreaGrad)" />
          )}

          {/* Line */}
          {totalIncome > 0 && (
            <path
              d={linePath}
              fill="none"
              stroke="url(#bulananLineGrad)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Zero baseline */}
          {totalIncome === 0 && (
            <text
              x={W / 2} y={H / 2}
              textAnchor="middle"
              fontSize="10"
              fill="#94a3b8"
              fontWeight="600"
            >
              Belum ada data syahriyah untuk tahun {selectedYear}
            </text>
          )}

          {/* Hover touch areas + dots */}
          {pts.map((p, i) => (
            <g key={i}>
              {/* Invisible wide hover area */}
              <rect
                x={padL + (i / monthlyData.length) * cw - (cw / monthlyData.length / 2)}
                y={0}
                width={cw / monthlyData.length}
                height={H}
                fill="transparent"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              />
              {/* Dot */}
              {p.total > 0 && (
                <circle
                  cx={p.x} cy={p.y} r={hoveredIdx === i ? 5 : 3}
                  fill="white"
                  stroke={hoveredIdx === i ? '#0284c7' : '#38bdf8'}
                  strokeWidth={hoveredIdx === i ? 2.5 : 1.5}
                  className="transition-all duration-150 pointer-events-none"
                />
              )}
            </g>
          ))}

          {/* Vertical line on hover */}
          {activePoint && activePoint.total > 0 && (
            <line
              x1={activePoint.x} y1={padT}
              x2={activePoint.x} y2={padT + ch}
              stroke="#0ea5e9" strokeWidth="1"
              strokeDasharray="3 3"
              className="pointer-events-none"
            />
          )}

          {/* Tooltip on hover */}
          {activePoint && activePoint.total > 0 && (() => {
            const tipW = 90;
            const tipH = 40;
            const tipX = activePoint.x > W / 2
              ? activePoint.x - tipW - 8
              : activePoint.x + 10;
            const tipY = Math.max(activePoint.y - tipH / 2, padT);
            return (
              <g className="pointer-events-none">
                <rect
                  x={tipX} y={tipY}
                  width={tipW} height={tipH}
                  rx="6" ry="6"
                  fill="white"
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
                <text x={tipX + tipW / 2} y={tipY + 13} textAnchor="middle" fontSize="8" fill="#64748b" fontWeight="600">
                  {activePoint.month}
                </text>
                <text x={tipX + tipW / 2} y={tipY + 26} textAnchor="middle" fontSize="10" fill="#0ea5e9" fontWeight="600">
                  {formatShortRupiah(activePoint.total)}
                </text>
                <text x={tipX + tipW / 2} y={tipY + 37} textAnchor="middle" fontSize="7" fill="#94a3b8" fontWeight="500">
                  {activePoint.count} entri
                </text>
              </g>
            );
          })()}

          {/* X-axis labels */}
          {pts.map((p, i) => (
            <text
              key={i}
              x={p.x} y={H - 4}
              textAnchor="middle"
              fontSize="7"
              fill={hoveredIdx === i ? '#0ea5e9' : '#94a3b8'}
              fontWeight={hoveredIdx === i ? '600' : '500'}
              className="transition-colors duration-150"
            >
              {p.shortMonth}
            </text>
          ))}
        </svg>
      </div>

      {/* Footer summary */}
      <div className="mt-2.5 pt-2.5 border-t border-slate-100 grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-[9px] text-slate-400 uppercase tracking-wider">Total Masuk</p>
          <p className="font-semibold text-sky-600 text-xs mt-0.5">{formatShortRupiah(totalIncome)}</p>
        </div>
        <div className="text-center border-x border-slate-100">
          <p className="text-[9px] text-slate-400 uppercase tracking-wider">Bulan Aktif</p>
          <p className="font-semibold text-slate-700 text-xs mt-0.5">{activeMonths} / 12</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-slate-400 uppercase tracking-wider">Bulan Terbesar</p>
          <p className="font-semibold text-slate-700 text-xs mt-0.5">
            {peakMonth.total > 0 ? peakMonth.shortMonth : '-'}
          </p>
        </div>
      </div>
    </div>
  );
};
