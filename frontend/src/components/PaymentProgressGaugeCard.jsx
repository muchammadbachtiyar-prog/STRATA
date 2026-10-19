import React from 'react';
import { Icon } from './Icon';
import { formatRupiah } from '../utils/helpers';

export const PaymentProgressGaugeCard = ({ 
  totalTagihan, 
  totalDibayar, 
  sisaTagihan, 
  completionRate, 
  progressSegments,
  title = "Progress Pembayaran Tahunan"
}) => {
  const normalizedTitle = String(title).toLowerCase().replace(/[^a-z0-9]/g, '-');
  const patternId = `paymentStripePattern-${normalizedTitle}`;
  const filterId = `paymentGaugeShadow-${normalizedTitle}`;

  const segments = [
    { key: 'lunas', label: 'Lunas', value: progressSegments?.lunas || 0, color: '#1E8E5A' },
    { key: 'sebagian', label: 'Sebagian Dibayar', value: progressSegments?.sebagian || 0, color: '#0F5D3D' },
    { key: 'belum', label: 'Belum Bayar', value: progressSegments?.belum || 0, color: `url(#${patternId})` }
  ];
  const cx = 140;
  const cy = 140;
  const r = 104;
  const strokeWidth = 26;
  const gap = 2.5;

  const polarToCartesian = (angle) => {
    const angleInRadians = (angle - 180) * Math.PI / 180;
    return {
      x: cx + (r * Math.cos(angleInRadians)),
      y: cy + (r * Math.sin(angleInRadians))
    };
  };

  const describeArc = (startAngle, endAngle) => {
    const start = polarToCartesian(startAngle);
    const end = polarToCartesian(endAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  let currentAngle = 0;
  const arcs = segments.filter(segment => segment.value > 0).map(segment => {
    const sweep = (segment.value / 100) * 180;
    const startAngle = currentAngle + gap / 2;
    const endAngle = currentAngle + sweep - gap / 2;
    currentAngle += sweep;
    return { ...segment, d: describeArc(startAngle, Math.max(startAngle + 1, endAngle)) };
  });

  const stats = [
    { label: 'Total Tagihan', value: formatRupiah(totalTagihan), icon: 'receipt-text' },
    { label: 'Sudah Dibayar', value: formatRupiah(totalDibayar), icon: 'check-circle-2' },
    { label: 'Sisa Tagihan', value: formatRupiah(sisaTagihan), icon: 'clock-3' }
  ];

  return (
    <div className="flex flex-col h-full min-h-[280px] justify-between">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
            Completion Rate: {completionRate}%
          </p>
          <h3 className="text-sm font-semibold text-slate-800 mt-0.5">{title}</h3>
        </div>
        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <Icon name="pie-chart" size={16} />
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[260px] pt-1">
        <svg viewBox="0 0 280 165" className="w-full h-auto overflow-visible" role="img" aria-label={`${title} ${completionRate} persen`}>
          <defs>
            <pattern id={patternId} patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
              <rect width="10" height="10" fill="#f1f5f9" />
              <rect width="3" height="10" fill="#cbd5e1" opacity="0.5" />
            </pattern>
            <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#0f172a" floodOpacity="0.06" />
            </filter>
          </defs>
          <path
            d={describeArc(0, 180)}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <g filter={`url(#${filterId})`}>
            {arcs.map(arc => (
              <path
                key={arc.key}
                d={arc.d}
                fill="none"
                stroke={arc.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </g>
        </svg>

        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-3xl md:text-4xl font-bold text-slate-800 leading-none tabular-nums">{completionRate}%</p>
          <p className="text-[10px] font-medium text-slate-500 mt-1">Pembayaran Selesai</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 mt-2">
        {stats.map(item => (
          <div key={item.label} className="rounded-lg bg-slate-50 border border-slate-100 p-1.5 min-w-0">
            <div className="flex items-center gap-1 text-slate-500 mb-0.5">
              <Icon name={item.icon} size={11} />
              <span className="text-[8px] font-semibold uppercase tracking-wide truncate">{item.label}</span>
            </div>
            <p className="text-[10px] font-semibold text-slate-800 truncate">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-auto pt-2.5 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          Lunas
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-900"></span>
          Sebagian Dibayar
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-600">
          <span className="w-2 h-2 rounded-full border border-slate-300" style={{ background: 'repeating-linear-gradient(45deg, #f1f5f9 0 4px, #cbd5e1 4px 7px)' }}></span>
          Belum Bayar
        </div>
      </div>
    </div>
  );
};
