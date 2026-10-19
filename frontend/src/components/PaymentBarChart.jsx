import React, { useState } from 'react';
import { formatShortRupiah, formatRupiah } from '../utils/helpers';

export const PaymentBarChart = ({ data, chartYear, availableYears, onYearChange }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // SVG dimensions
  const W = 560;
  const H = 160;
  const padL = 42;
  const padR = 10;
  const padT = 12;
  const padB = 22;
  const cw = W - padL - padR;
  const ch = H - padT - padB;

  const maxValue = Math.max(...data.map(d => d.dibayar), 1000000);
  const totalIncome = data.reduce((sum, d) => sum + d.dibayar, 0);

  const pts = data.map((d, i) => ({
    x: padL + (i / (data.length - 1)) * cw,
    y: padT + ch - (d.dibayar / maxValue) * ch,
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
      <div className="flex items-center justify-between mb-3 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            <h4 className="font-semibold text-slate-800 text-sm">Grafik Administrasi</h4>
          </div>
          <p className="text-[10px] text-slate-400 ml-3.5">
            Realisasi tagihan tahunan tahun{' '}
            <span className="font-semibold text-emerald-600">{chartYear}</span>
          </p>
        </div>

        <select
          value={chartYear}
          onChange={(e) => onYearChange(e.target.value)}
          className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-semibold text-emerald-700 outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500/20 transition-all"
        >
          {availableYears.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Chart */}
      <div className="flex-1 w-full relative min-h-[160px]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id="administrasiAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="administrasiLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.5, 1].map(pct => {
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
                    x={padL - 8} y={y + 3}
                    textAnchor="end"
                    className="text-[7px] font-medium fill-slate-400"
                  >
                    {formatShortRupiah(maxValue * pct)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Area fill */}
          {totalIncome > 0 && (
            <path d={areaPath} fill="url(#administrasiAreaGrad)" />
          )}

          {/* Line */}
          {totalIncome > 0 && (
            <path
              d={linePath}
              fill="none"
              stroke="url(#administrasiLineGrad)"
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
              className="text-[9px] font-bold fill-slate-400"
            >
              Belum ada data untuk tahun {chartYear}
            </text>
          )}

          {/* Hover touch areas + dots */}
          {pts.map((p, i) => (
            <g key={i}>
              <rect
                x={padL + (i / data.length) * cw - (cw / data.length / 2)}
                y={0}
                width={cw / data.length}
                height={H}
                fill="transparent"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              />
              {p.dibayar > 0 && (
                <circle
                  cx={p.x} cy={p.y} r={hoveredIdx === i ? 4 : 2.5}
                  fill="white"
                  stroke={hoveredIdx === i ? '#059669' : '#10b981'}
                  strokeWidth={hoveredIdx === i ? 2 : 1.5}
                  className="transition-all duration-150 pointer-events-none"
                />
              )}
            </g>
          ))}

          {/* Vertical line on hover */}
          {activePoint && activePoint.dibayar > 0 && (
            <line
              x1={activePoint.x} y1={padT}
              x2={activePoint.x} y2={padT + ch}
              stroke="#10b981" strokeWidth="1"
              strokeDasharray="3 3"
              className="pointer-events-none"
            />
          )}

          {/* Tooltip on hover */}
          {activePoint && activePoint.dibayar > 0 && (() => {
            const tipW = 85;
            const tipH = 34;
            const tipX = activePoint.x > W / 2
              ? activePoint.x - tipW - 6
              : activePoint.x + 8;
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
                <text x={tipX + tipW / 2} y={tipY + 13} textAnchor="middle" className="text-[8px] font-medium fill-slate-500">
                  {activePoint.monthFull}
                </text>
                <text x={tipX + tipW / 2} y={tipY + 25} textAnchor="middle" className="text-[10px] font-semibold fill-emerald-600">
                  {formatRupiah(activePoint.dibayar)}
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
              className={`text-[8px] font-medium transition-colors ${hoveredIdx === i ? 'fill-emerald-600' : 'fill-slate-400'}`}
            >
              {p.month}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
};

