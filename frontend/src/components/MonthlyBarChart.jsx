import React from 'react';

/**
 * MonthlyBarChart renders a simple horizontal bar chart showing payment percentage per month.
 * Props:
 *   - rows: array of objects with { bulan, percentage }
 */
export const MonthlyBarChart = ({ rows }) => (
  <div className="mb-6">
    <h4 className="text-lg font-semibold mb-3 text-slate-800">Persentase Pembayaran per Bulan</h4>
    <div className="space-y-2">
      {rows.map(row => (
        <div key={row.bulan} className="flex items-center">
          <span className="w-24 text-sm text-slate-600">{row.bulan}</span>
          <div className="flex-1 bg-slate-200 rounded-full h-4 overflow-hidden mr-2">
            <div className="bg-emerald-500 h-4" style={{ width: `${row.percentage}%` }} />
          </div>
          <span className="w-12 text-sm text-slate-800">{row.percentage}%</span>
        </div>
      ))}
    </div>
  </div>
);
