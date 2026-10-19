import React, { useMemo, useState } from 'react';
import { formatRupiah, TOTAL_BIAYA_BULANAN, ISLAMIC_MONTHS } from '../utils/helpers';
import { Icon } from './Icon';
import { MonthlyBarChart } from './MonthlyBarChart';

/**
 * MonthlyRecapTable Component
 * Props:
 *  - allBulananData: array of monthly payment entries
 *  - selectedYear: number | 'Semua'
 *  - monthFilter: string ('Semua' or Hijri month name)
 */
export const MonthlyRecapTable = ({ allBulananData, selectedYear, monthFilter }) => {
  // Filter by academic year
  const filteredByYear = useMemo(() => {
    if (selectedYear === 'Semua') return allBulananData;
    const yearStr = String(selectedYear);
    return allBulananData.filter(e => String(e.academicYear) === yearStr);
  }, [allBulananData, selectedYear]);

  // Determine months to display based on monthFilter
  const monthsToShow = useMemo(() => {
    if (monthFilter === 'Semua') return ISLAMIC_MONTHS;
    return [monthFilter];
  }, [monthFilter]);

  // Compute per‑month aggregates
  const monthlyData = useMemo(() => {
    const result = {};
    monthsToShow.forEach(m => {
      result[m] = { totalTarget: 0, totalPaid: 0, totalUnpaid: 0, percentage: 0 };
    });
    const studentSetPerMonth = {};
    filteredByYear.forEach(entry => {
      const { hijriMonth, studentId, makan, laundry, ziaroh } = entry;
      if (!monthsToShow.includes(hijriMonth)) return;
      // Track distinct students for target calculation
      if (!studentSetPerMonth[hijriMonth]) studentSetPerMonth[hijriMonth] = new Set();
      studentSetPerMonth[hijriMonth].add(studentId);
      const paid = (makan ? 275000 : 0) + (laundry ? 120000 : 0) + (ziaroh ? 25000 : 0);
      result[hijriMonth].totalPaid += paid;
    });
    monthsToShow.forEach(m => {
      const studentCount = studentSetPerMonth[m] ? studentSetPerMonth[m].size : 0;
      const target = studentCount * TOTAL_BIAYA_BULANAN;
      const paid = result[m].totalPaid;
      const unpaid = Math.max(target - paid, 0);
      const perc = target > 0 ? Math.round((paid / target) * 100) : 0;
      result[m] = { totalTarget: target, totalPaid: paid, totalUnpaid: unpaid, percentage: perc };
    });
    return result;
  }, [filteredByYear, monthsToShow]);

  // Sorting state
  const [sortKey, setSortKey] = useState('bulan'); // bulan, totalTarget, totalPaid, totalUnpaid, percentage
  const [sortAsc, setSortAsc] = useState(true);
  const sortedRows = useMemo(() => {
    const rows = monthsToShow.map(m => ({ bulan: m, ...monthlyData[m] }));
    const compare = (a, b) => {
      let av = a[sortKey];
      let bv = b[sortKey];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    };
    return rows.sort(compare);
  }, [monthsToShow, monthlyData, sortKey, sortAsc]);

  const toggleSort = key => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  // Export handlers (CSV & Excel)
  const handleExport = async format => {
    const rows = [
      ['Bulan', 'Total Tagihan', 'Total Pembayaran', 'Sisa Piutang', 'Persentase (%)']
    ];
    sortedRows.forEach(r => {
      rows.push([
        r.bulan,
        r.totalTarget,
        r.totalPaid,
        r.totalUnpaid,
        `${r.percentage}%`
      ]);
    });
    if (format === 'csv') {
      const csv = rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Rekap_Bulanan_${selectedYear}_${new Date().getTime()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (format === 'excel') {
      const { default: XLSX } = await import('xlsx');
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'RekapBulanan');
      XLSX.writeFile(wb, `Rekap_Bulanan_${selectedYear}.xlsx`);
    }
  };

  return (
    <div className="mt-8">
      {/* Filter bar */}
      <div className="flex items-center gap-4 mb-4">
        <select
          value={monthFilter}
          onChange={e => {
            const val = e.target.value;
            // Emit custom event for parent if needed
            const ev = new CustomEvent('month-filter-change', { detail: val });
            window.dispatchEvent(ev);
            // Also update local state (if using inside component only)
            // This component receives monthFilter as prop; parent will handle state.
          }}
          className="bg-white border border-slate-200 rounded-md px-3 py-1 text-sm"
        >
          <option value="Semua">Semua Bulan</option>
          {ISLAMIC_MONTHS.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        {/* Export button with dropdown */}
        <div className="relative inline-block">
          <button
            className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-600 hover:text-white px-4 py-1.5 rounded-md font-medium"
            onClick={e => {
              const menu = e.currentTarget.nextElementSibling;
              menu.classList.toggle('hidden');
            }}
          >
            Export <Icon name="chevron-down" size={12} />
          </button>
          <div className="hidden absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded-md shadow-lg z-10">
            <button className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100" onClick={() => handleExport('csv')}>CSV</button>
            <button className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100" onClick={() => handleExport('excel')}>Excel</button>
          </div>
        </div>
      </div>
<MonthlyBarChart rows={sortedRows} />

      {/* Summary cards (one per month) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {sortedRows.map(row => (
          <div key={row.bulan} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
            <h5 className="font-bold text-slate-800 mb-2">{row.bulan}</h5>
            <p className="text-sm text-slate-600">Tagihan: {formatRupiah(row.totalTarget)}</p>
            <p className="text-sm text-slate-600">Terbayar: {formatRupiah(row.totalPaid)}</p>
            <p className="text-sm text-slate-600">Piutang: {formatRupiah(row.totalUnpaid)}</p>
            <p className="text-sm text-slate-600">% Pembayaran: {row.percentage}%</p>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${row.percentage}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-2 cursor-pointer" onClick={() => toggleSort('bulan')}>Bulan {sortKey === 'bulan' && (sortAsc ? '▲' : '▼')}</th>
              <th className="px-4 py-2 cursor-pointer" onClick={() => toggleSort('totalTarget')}>Tagihan {sortKey === 'totalTarget' && (sortAsc ? '▲' : '▼')}</th>
              <th className="px-4 py-2 cursor-pointer" onClick={() => toggleSort('totalPaid')}>Pembayaran {sortKey === 'totalPaid' && (sortAsc ? '▲' : '▼')}</th>
              <th className="px-4 py-2 cursor-pointer" onClick={() => toggleSort('totalUnpaid')}>Piutang {sortKey === 'totalUnpaid' && (sortAsc ? '▲' : '▼')}</th>
              <th className="px-4 py-2 cursor-pointer" onClick={() => toggleSort('percentage')}>% Pembayaran {sortKey === 'percentage' && (sortAsc ? '▲' : '▼')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedRows.map(row => (
              <tr key={row.bulan} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-sm font-medium">{row.bulan}</td>
                <td className="px-4 py-2 text-right text-sm">{formatRupiah(row.totalTarget)}</td>
                <td className="px-4 py-2 text-right text-sm">{formatRupiah(row.totalPaid)}</td>
                <td className="px-4 py-2 text-right text-sm">{formatRupiah(row.totalUnpaid)}</td>
                <td className="px-4 py-2 text-right text-sm">{row.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
