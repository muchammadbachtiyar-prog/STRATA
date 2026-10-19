import React, { useState, useMemo } from 'react';
import { Icon } from './Icon';
import {
  formatRupiah,
  ISLAMIC_MONTHS,
  KATEGORI_PEMASUKAN,
  KATEGORI_PENGELUARAN,
  getAllKategoriLabel,
  formatDateIndo
} from '../utils/helpers';

// ─── SVG Bar Chart Component ────────────────────────────────────
const KeuanganBarChart = ({ data, height = 260 }) => {
  const maxVal = Math.max(...data.map(d => Math.max(d.pemasukan, d.pengeluaran)), 1);
  const barW = Math.min(28, Math.floor(700 / data.length / 2.5));
  const chartW = data.length * (barW * 2 + 24) + 60;
  const chartH = height;
  const padTop = 30, padBot = 55, padLeft = 70;
  const plotH = chartH - padTop - padBot;

  const yTicks = 5;
  const yStep = maxVal / yTicks;

  return (
    <div className="overflow-x-auto custom-scroll pb-2">
      <svg width={Math.max(chartW, 600)} height={chartH} className="font-sans">
        {/* Grid lines */}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const y = padTop + plotH - (plotH * (i * yStep) / maxVal);
          return (
            <g key={i}>
              <line x1={padLeft} y1={y} x2={chartW - 10} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray={i === 0 ? "0" : "4,4"} />
              <text x={padLeft - 10} y={y + 4} textAnchor="end" fontSize="10" fontWeight="600" fill="#94a3b8">
                {formatRupiah(Math.round(i * yStep))}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const x = padLeft + i * (barW * 2 + 24) + 16;
          const hP = (d.pemasukan / maxVal) * plotH;
          const hE = (d.pengeluaran / maxVal) * plotH;
          const yP = padTop + plotH - hP;
          const yE = padTop + plotH - hE;
          const label = d.bulan.length > 6 ? d.bulan.slice(0, 5) + '.' : d.bulan;

          return (
            <g key={i}>
              {/* Pemasukan bar */}
              <rect x={x} y={yP} width={barW} height={Math.max(hP, 1)} rx="4" fill="url(#gradPemasukan)" className="transition-all duration-500">
                <animate attributeName="height" from="0" to={Math.max(hP, 1)} dur="0.6s" fill="freeze" />
                <animate attributeName="y" from={padTop + plotH} to={yP} dur="0.6s" fill="freeze" />
              </rect>
              {/* Pengeluaran bar */}
              <rect x={x + barW + 4} y={yE} width={barW} height={Math.max(hE, 1)} rx="4" fill="url(#gradPengeluaran)" className="transition-all duration-500">
                <animate attributeName="height" from="0" to={Math.max(hE, 1)} dur="0.6s" fill="freeze" />
                <animate attributeName="y" from={padTop + plotH} to={yE} dur="0.6s" fill="freeze" />
              </rect>
              {/* Label */}
              <text x={x + barW + 2} y={padTop + plotH + 18} textAnchor="middle" fontSize="9" fontWeight="700" fill="#64748b"
                transform={`rotate(-25, ${x + barW + 2}, ${padTop + plotH + 18})`}>
                {label}
              </text>
            </g>
          );
        })}

        {/* Gradients */}
        <defs>
          <linearGradient id="gradPemasukan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="gradPengeluaran" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

// ─── SVG Donut Chart ────────────────────────────────────────────
const KeuanganDonutChart = ({ data, title, colors }) => {
  const total = data.reduce((s, d) => s + d.total, 0);
  if (total === 0) return (
    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
      <Icon name="pie-chart" size={40} className="opacity-30 mb-2" />
      <p className="text-sm font-bold">Tidak ada data</p>
    </div>
  );

  const defaultColors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
  const usedColors = colors || defaultColors;
  const cx = 90, cy = 90, r = 70, strokeW = 24;
  const circumference = 2 * Math.PI * r;
  let accOffset = 0;

  return (
    <div>
      <h4 className="font-black text-slate-800 text-sm mb-4">{title}</h4>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={strokeW} />
          {data.map((d, i) => {
            const pct = d.total / total;
            const dashLen = circumference * pct;
            const offset = circumference * accOffset;
            accOffset += pct;
            return (
              <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                stroke={usedColors[i % usedColors.length]}
                strokeWidth={strokeW}
                strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${cx} ${cy})`}
                className="transition-all duration-700"
                strokeLinecap="round"
              />
            );
          })}
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="11" fontWeight="800" fill="#334155">Total</text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fontWeight="700" fill="#64748b">{formatRupiah(total)}</text>
        </svg>
        <div className="flex flex-col gap-2 text-xs">
          {data.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: usedColors[i % usedColors.length] }} />
              <span className="font-bold text-slate-700">{d.label}</span>
              <span className="font-bold text-slate-400 ml-auto">{formatRupiah(d.total)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// ═══ MAIN KEUANGAN PANEL COMPONENT ═══════════════════════════
// ═══════════════════════════════════════════════════════════════
export const KeuanganPanel = ({
  keuanganEntries,
  keuanganLoading,
  fetchKeuanganData,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
  selectedTahunAjaran,
  setAlert,
  dataSantri
}) => {
  const [keuanganSubTab, setKeuanganSubTab] = useState('transaksi');
  const [filterTipe, setFilterTipe] = useState('Semua');
  const [filterKategori, setFilterKategori] = useState('Semua');
  const [searchKeuangan, setSearchKeuangan] = useState('');
  const [selectedBulan, setSelectedBulan] = useState(null);

  // Derived data
  const entries = keuanganEntries || [];

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      if (filterTipe !== 'Semua' && e.tipe !== filterTipe) return false;
      if (filterKategori !== 'Semua' && e.kategori !== filterKategori) return false;
      const q = searchKeuangan.trim().toLowerCase();
      if (q) {
        const matchDesc = (e.deskripsi || '').toLowerCase().includes(q);
        const matchRef = (e.referensi || '').toLowerCase().includes(q);
        const matchKat = (getAllKategoriLabel(e.kategori) || '').toLowerCase().includes(q);
        if (!matchDesc && !matchRef && !matchKat) return false;
      }
      return true;
    });
  }, [entries, filterTipe, filterKategori, searchKeuangan]);

  const totalPemasukan = useMemo(() => entries.filter(e => e.tipe === 'pemasukan').reduce((s, e) => s + (Number(e.nominal) || 0), 0), [entries]);
  const totalPengeluaran = useMemo(() => entries.filter(e => e.tipe === 'pengeluaran').reduce((s, e) => s + (Number(e.nominal) || 0), 0), [entries]);
  const saldo = totalPemasukan - totalPengeluaran;

  // Per-bulan data for charts
  const perBulanData = useMemo(() => {
    return ISLAMIC_MONTHS.map(bulan => {
      const bulanEntries = entries.filter(e => e.bulanHijri === bulan);
      const pem = bulanEntries.filter(e => e.tipe === 'pemasukan').reduce((s, e) => s + (Number(e.nominal) || 0), 0);
      const pen = bulanEntries.filter(e => e.tipe === 'pengeluaran').reduce((s, e) => s + (Number(e.nominal) || 0), 0);
      return { bulan, pemasukan: pem, pengeluaran: pen, saldo: pem - pen };
    });
  }, [entries]);

  // Per-kategori data for donut
  const perKategoriPemasukan = useMemo(() => {
    const map = {};
    entries.filter(e => e.tipe === 'pemasukan').forEach(e => {
      const k = e.kategori || 'lainnya_masuk';
      map[k] = (map[k] || 0) + (Number(e.nominal) || 0);
    });
    return Object.entries(map).map(([key, total]) => ({ label: getAllKategoriLabel(key), total })).sort((a, b) => b.total - a.total);
  }, [entries]);

  const perKategoriPengeluaran = useMemo(() => {
    const map = {};
    entries.filter(e => e.tipe === 'pengeluaran').forEach(e => {
      const k = e.kategori || 'lainnya_keluar';
      map[k] = (map[k] || 0) + (Number(e.nominal) || 0);
    });
    return Object.entries(map).map(([key, total]) => ({ label: getAllKategoriLabel(key), total })).sort((a, b) => b.total - a.total);
  }, [entries]);

  // Entries for selected month in laporan bulanan detail
  const selectedBulanEntries = useMemo(() => {
    if (!selectedBulan) return [];
    return entries.filter(e => e.bulanHijri === selectedBulan);
  }, [entries, selectedBulan]);

  const handleDelete = (entry) => {
    if (!confirm(`Hapus transaksi "${entry.deskripsi || entry.id}"?`)) return;
    onDeleteEntry(entry);
  };

  // ─── PDF EXPORT ───────────────────────────────────────────────
  const handleExportPDF = (reportType) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setAlert && setAlert({ type: 'error', text: 'Pop-up diblokir. Izinkan pop-up untuk mencetak laporan.' });
      return;
    }

    const tahun = selectedTahunAjaran || '-';
    let tableRows = '';
    let grandPemasukan = 0;
    let grandPengeluaran = 0;

    if (reportType === 'bulanan' && selectedBulan) {
      const bulanData = selectedBulanEntries;
      bulanData.forEach((e, i) => {
        const nom = Number(e.nominal) || 0;
        if (e.tipe === 'pemasukan') grandPemasukan += nom;
        else grandPengeluaran += nom;
        tableRows += `<tr>
          <td style="padding:6px 10px;border:1px solid #d1d5db;text-align:center">${i + 1}</td>
          <td style="padding:6px 10px;border:1px solid #d1d5db">${e.tanggal || '-'}</td>
          <td style="padding:6px 10px;border:1px solid #d1d5db"><span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:10px;font-weight:700;background:${e.tipe === 'pemasukan' ? '#dcfce7;color:#166534' : '#fee2e2;color:#991b1b'}">${e.tipe === 'pemasukan' ? 'Masuk' : 'Keluar'}</span></td>
          <td style="padding:6px 10px;border:1px solid #d1d5db">${getAllKategoriLabel(e.kategori)}</td>
          <td style="padding:6px 10px;border:1px solid #d1d5db">${e.deskripsi || '-'}</td>
          <td style="padding:6px 10px;border:1px solid #d1d5db;text-align:right;font-weight:700;color:${e.tipe === 'pemasukan' ? '#166534' : '#991b1b'}">${e.tipe === 'pemasukan' ? '+' : '-'}${formatRupiah(nom)}</td>
        </tr>`;
      });
    } else {
      // Tahunan
      perBulanData.forEach((d, i) => {
        grandPemasukan += d.pemasukan;
        grandPengeluaran += d.pengeluaran;
        tableRows += `<tr>
          <td style="padding:6px 10px;border:1px solid #d1d5db;text-align:center">${i + 1}</td>
          <td style="padding:6px 10px;border:1px solid #d1d5db;font-weight:600">${d.bulan}</td>
          <td style="padding:6px 10px;border:1px solid #d1d5db;text-align:right;color:#166534;font-weight:700">${formatRupiah(d.pemasukan)}</td>
          <td style="padding:6px 10px;border:1px solid #d1d5db;text-align:right;color:#991b1b;font-weight:700">${formatRupiah(d.pengeluaran)}</td>
          <td style="padding:6px 10px;border:1px solid #d1d5db;text-align:right;font-weight:800;color:${d.saldo >= 0 ? '#166534' : '#991b1b'}">${formatRupiah(d.saldo)}</td>
        </tr>`;
      });
    }

    const headerCols = reportType === 'bulanan' && selectedBulan
      ? '<th style="padding:8px 10px;border:1px solid #d1d5db;background:#f1f5f9;text-align:center">No</th><th style="padding:8px 10px;border:1px solid #d1d5db;background:#f1f5f9">Tanggal</th><th style="padding:8px 10px;border:1px solid #d1d5db;background:#f1f5f9">Tipe</th><th style="padding:8px 10px;border:1px solid #d1d5db;background:#f1f5f9">Kategori</th><th style="padding:8px 10px;border:1px solid #d1d5db;background:#f1f5f9">Deskripsi</th><th style="padding:8px 10px;border:1px solid #d1d5db;background:#f1f5f9;text-align:right">Nominal</th>'
      : '<th style="padding:8px 10px;border:1px solid #d1d5db;background:#f1f5f9;text-align:center">No</th><th style="padding:8px 10px;border:1px solid #d1d5db;background:#f1f5f9">Bulan</th><th style="padding:8px 10px;border:1px solid #d1d5db;background:#f1f5f9;text-align:right">Pemasukan</th><th style="padding:8px 10px;border:1px solid #d1d5db;background:#f1f5f9;text-align:right">Pengeluaran</th><th style="padding:8px 10px;border:1px solid #d1d5db;background:#f1f5f9;text-align:right">Saldo</th>';

    const reportTitle = reportType === 'bulanan' && selectedBulan
      ? `Laporan Keuangan Bulan ${selectedBulan}`
      : `Laporan Keuangan Tahunan`;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${reportTitle}</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; font-size: 12px; }
      h1 { font-size: 18px; margin-bottom: 4px; color: #083316; }
      h2 { font-size: 14px; color: #475569; margin-bottom: 20px; font-weight: 500; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      .summary { display: flex; gap: 20px; margin-bottom: 20px; }
      .sum-card { flex: 1; padding: 12px 16px; border-radius: 8px; }
      .sum-pemasukan { background: #dcfce7; color: #166534; }
      .sum-pengeluaran { background: #fee2e2; color: #991b1b; }
      .sum-saldo { background: #f0f9ff; color: #0c4a6e; }
      .sum-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
      .sum-value { font-size: 16px; font-weight: 800; margin-top: 4px; }
      .footer { margin-top: 30px; font-size: 10px; color: #94a3b8; text-align: center; }
      @media print { body { padding: 15px; } }
    </style></head><body>
    <div style="display:flex;align-items:center;gap:12px;border-bottom:2px solid #083316;padding-bottom:12px;margin-bottom:16px">
      <div style="width:44px;height:44px;background:#083316;border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:16px">NJ</div>
      <div>
        <h1 style="margin:0">Pondok Pesantren Nailul Jannah</h1>
        <p style="margin:0;font-size:11px;color:#64748b">Jl. Raya Pecangaan, Jepara, Jawa Tengah</p>
      </div>
    </div>
    <h1>${reportTitle}</h1>
    <h2>Tahun Ajaran ${tahun} M</h2>
    <div class="summary">
      <div class="sum-card sum-pemasukan"><div class="sum-label">Total Pemasukan</div><div class="sum-value">${formatRupiah(grandPemasukan)}</div></div>
      <div class="sum-card sum-pengeluaran"><div class="sum-label">Total Pengeluaran</div><div class="sum-value">${formatRupiah(grandPengeluaran)}</div></div>
      <div class="sum-card sum-saldo"><div class="sum-label">Saldo Bersih</div><div class="sum-value">${formatRupiah(grandPemasukan - grandPengeluaran)}</div></div>
    </div>
    <table><thead><tr>${headerCols}</tr></thead><tbody>${tableRows}</tbody></table>
    <div class="footer">Dicetak pada ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} — STRATA Pondok Pesantren Nailul Jannah</div>
    <script>window.onload=function(){window.print()}</script>
    </body></html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // ─── SUB TAB CONTENT ──────────────────────────────────────────
  const subTabs = [
    { key: 'transaksi', label: 'Transaksi', icon: 'list' },
    { key: 'laporan-bulanan', label: 'Laporan Bulanan', icon: 'calendar' },
    { key: 'laporan-tahunan', label: 'Laporan Tahunan', icon: 'bar-chart-3' }
  ];

  return (
    <div className="space-y-6 animate-in">
      {/* ── Summary Cards ─────────────────────────────────────── */}
      <div className="strata-metric-strip grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Pemasukan */}
        <div className="keuangan-summary-card group relative bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-emerald-500/10 transition-colors duration-500" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:-rotate-6 transition-transform duration-300">
                <Icon name="trending-up" size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Pemasukan</p>
            </div>
            <p className="text-2xl font-black text-emerald-700 leading-none">{formatRupiah(totalPemasukan)}</p>
          </div>
        </div>

        {/* Pengeluaran */}
        <div className="keuangan-summary-card group relative bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-rose-500/10 transition-colors duration-500" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:rotate-6 transition-transform duration-300">
                <Icon name="trending-down" size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Pengeluaran</p>
            </div>
            <p className="text-2xl font-black text-rose-600 leading-none">{formatRupiah(totalPengeluaran)}</p>
          </div>
        </div>

        {/* Saldo */}
        <div className="keuangan-summary-card group relative bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-amber-500/10 transition-colors duration-500" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${saldo >= 0 ? 'from-amber-400 to-amber-600' : 'from-red-400 to-red-600'} flex items-center justify-center text-white shadow-md ${saldo >= 0 ? 'shadow-amber-500/20' : 'shadow-red-500/20'} group-hover:-rotate-6 transition-transform duration-300`}>
                <Icon name="wallet" size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Bersih</p>
            </div>
            <p className={`text-2xl font-black leading-none ${saldo >= 0 ? 'text-amber-700' : 'text-red-600'}`}>{formatRupiah(saldo)}</p>
          </div>
        </div>
      </div>

      {/* ── Sub Tabs ──────────────────────────────────────────── */}
      <div className="keuangan-workspace strata-admin-surface bg-white/80 backdrop-blur-md rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="flex items-center border-b border-slate-200/60 px-5 pt-5 gap-1 flex-wrap">
          {subTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setKeuanganSubTab(tab.key); setSelectedBulan(null); }}
              className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
                keuanganSubTab === tab.key
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-500'
                  : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon name={tab.icon} size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════ TAB: TRANSAKSI ══════════ */}
        {keuanganSubTab === 'transaksi' && (
          <div className="p-5">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => onAddEntry('pemasukan')}
                  className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 text-xs">
                  <Icon name="plus" size={14} /> Pemasukan
                </button>
                <button onClick={() => onAddEntry('pengeluaran')}
                  className="px-4 py-2.5 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-all shadow-md shadow-rose-500/20 flex items-center gap-2 text-xs">
                  <Icon name="minus" size={14} /> Pengeluaran
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                {/* Search */}
                <div className="strata-filter-control flex items-center gap-2 bg-white border border-slate-200 shadow-sm px-3 py-2 rounded-xl focus-within:ring-2 focus-within:ring-emerald-400 focus-within:border-emerald-400 transition-all w-full sm:w-52">
                  <Icon name="search" size={14} className="text-slate-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Cari transaksi..."
                    value={searchKeuangan}
                    onChange={(e) => setSearchKeuangan(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs font-bold w-full text-slate-700 placeholder-slate-400"
                  />
                  {searchKeuangan && (
                    <button onClick={() => setSearchKeuangan('')} className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
                      <Icon name="x" size={12} />
                    </button>
                  )}
                </div>
                {/* Filter Tipe */}
                <div className="flex items-center bg-white border border-slate-200 shadow-sm p-1 rounded-xl">
                  <div className="flex items-center pl-3 pr-1 text-slate-400"><Icon name="filter" size={14} /></div>
                  <select value={filterTipe} onChange={e => setFilterTipe(e.target.value)}
                    className="bg-transparent w-full text-xs font-bold text-slate-700 outline-none cursor-pointer py-2 pr-2 appearance-none">
                    <option value="Semua">Semua Tipe</option>
                    <option value="pemasukan">Pemasukan</option>
                    <option value="pengeluaran">Pengeluaran</option>
                  </select>
                </div>
                {/* Refresh */}
                <button onClick={() => { setAlert && setAlert({ type: 'success', text: 'Menyegarkan data keuangan...' }); fetchKeuanganData(); }}
                  className="p-2.5 bg-white border border-slate-200 text-slate-500 flex items-center justify-center rounded-xl hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"
                  title="Refresh">
                  <Icon name="refresh-cw" size={16} />
                </button>
              </div>
            </div>

            {/* Table */}
            {keuanganLoading ? (
              <div className="p-16 flex justify-center"><Icon name="loader-2" size={32} className="animate-spin text-[#083316]" /></div>
            ) : (
              <div className="overflow-x-auto custom-scroll w-full pb-4">
                <table className="strata-data-table compact-table w-full text-left text-sm min-w-[800px] border-collapse">
                  <thead className="bg-slate-100/50 text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-4 text-center w-10">No</th>
                      <th className="px-4 py-4">Tanggal</th>
                      <th className="px-4 py-4 text-center">Tipe</th>
                      <th className="px-4 py-4">Kategori</th>
                      <th className="px-4 py-4">Deskripsi</th>
                      <th className="px-4 py-4 text-right">Nominal</th>
                      <th className="px-4 py-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEntries.length === 0 ? (
                      <tr><td colSpan="7" className="px-6 py-10 text-center text-slate-400 font-semibold">
                        <Icon name="inbox" size={32} className="opacity-50 mx-auto mb-2" /> Belum ada transaksi keuangan.
                      </td></tr>
                    ) : filteredEntries.map((entry, i) => {
                      const isAuto = (entry.dibuatOleh || '').includes('Otomatis');
                      return (
                        <tr key={entry.id || i} className="hover:bg-emerald-50/40 transition-colors group">
                          <td className="px-4 py-3 text-center text-slate-400 font-bold">{i + 1}</td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-700 text-xs">{entry.tanggal || '-'}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block border shadow-sm ${
                              entry.tipe === 'pemasukan' 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                                : 'bg-rose-50 border-rose-200 text-rose-600'
                            }`}>
                              {entry.tipe === 'pemasukan' ? 'Masuk' : 'Keluar'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-700 text-xs">{getAllKategoriLabel(entry.kategori)}</span>
                              {isAuto && (
                                <span className="px-1.5 py-0.5 bg-sky-50 border border-sky-200 text-sky-600 rounded text-[8px] font-black uppercase">Auto</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-600 font-medium">{entry.deskripsi || '-'}</span>
                            {entry.referensi && (
                              <span className="block text-[10px] font-mono text-slate-400 mt-0.5">{entry.referensi}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-black text-sm ${entry.tipe === 'pemasukan' ? 'text-emerald-700' : 'text-rose-600'}`}>
                              {entry.tipe === 'pemasukan' ? '+' : '-'}{formatRupiah(Number(entry.nominal) || 0)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-1.5">
                              <button onClick={() => onEditEntry(entry)}
                                className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-500 hover:text-white transition-all shadow-sm" title="Edit">
                                <Icon name="edit-2" size={13} />
                              </button>
                              <button onClick={() => handleDelete(entry)}
                                className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-500 hover:text-white transition-all shadow-sm" title="Hapus">
                                <Icon name="trash-2" size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══════════ TAB: LAPORAN BULANAN ══════════ */}
        {keuanganSubTab === 'laporan-bulanan' && (
          <div className="p-5">
            {!selectedBulan ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-slate-800 text-lg">Ringkasan Per Bulan Hijriah</h3>
                </div>
                {/* Chart */}
                <div className="bg-slate-50/50 rounded-2xl p-5 mb-6 border border-slate-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <div className="w-3 h-3 rounded-sm bg-gradient-to-b from-emerald-400 to-emerald-600" /> Pemasukan
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <div className="w-3 h-3 rounded-sm bg-gradient-to-b from-orange-400 to-orange-600" /> Pengeluaran
                    </div>
                  </div>
                  <KeuanganBarChart data={perBulanData} />
                </div>

                {/* Month Grid */}
                <div className="keuangan-month-list grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {perBulanData.map((d, idx) => (
                    <button key={idx} onClick={() => setSelectedBulan(d.bulan)}
                      className="keuangan-month-card group relative bg-white border border-slate-200 rounded-2xl p-5 cursor-pointer hover:border-emerald-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden">
                      <div className="absolute top-0 right-0 w-10 h-10 bg-slate-50 rounded-bl-2xl -mr-1 -mt-1 group-hover:bg-emerald-50 transition-colors" />
                      <h4 className="font-black text-slate-800 text-xs mb-3 group-hover:text-emerald-700 transition-colors">{d.bulan}</h4>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-emerald-600 uppercase">Masuk</span>
                          <span className="text-[10px] font-black text-emerald-700">{formatRupiah(d.pemasukan)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-rose-500 uppercase">Keluar</span>
                          <span className="text-[10px] font-black text-rose-600">{formatRupiah(d.pengeluaran)}</span>
                        </div>
                        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Saldo</span>
                          <span className={`text-[10px] font-black ${d.saldo >= 0 ? 'text-slate-800' : 'text-red-600'}`}>{formatRupiah(d.saldo)}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="animate-in">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedBulan(null)}
                      className="p-2 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm">
                      <Icon name="arrow-left" size={18} />
                    </button>
                    <h3 className="font-black text-slate-800 text-lg">Detail Keuangan — {selectedBulan}</h3>
                  </div>
                  <button onClick={() => handleExportPDF('bulanan')}
                    className="px-4 py-2 bg-[#083316] text-white rounded-xl font-bold hover:bg-[#0a421d] transition-all shadow-md shadow-emerald-900/20 flex items-center gap-2 text-xs">
                    <Icon name="file-down" size={14} /> Export PDF
                  </button>
                </div>

                {/* Summary cards for selected month */}
                <div className="strata-metric-strip grid grid-cols-3 gap-4 mb-5">
                  {[
                    { label: 'Pemasukan', val: selectedBulanEntries.filter(e => e.tipe === 'pemasukan').reduce((s, e) => s + (Number(e.nominal) || 0), 0), color: 'emerald' },
                    { label: 'Pengeluaran', val: selectedBulanEntries.filter(e => e.tipe === 'pengeluaran').reduce((s, e) => s + (Number(e.nominal) || 0), 0), color: 'rose' },
                    { label: 'Saldo', val: selectedBulanEntries.filter(e => e.tipe === 'pemasukan').reduce((s, e) => s + (Number(e.nominal) || 0), 0) - selectedBulanEntries.filter(e => e.tipe === 'pengeluaran').reduce((s, e) => s + (Number(e.nominal) || 0), 0), color: 'amber' }
                  ].map((card, ci) => (
                    <div key={ci} className={`bg-${card.color}-50 rounded-xl p-4 border border-${card.color}-100`}>
                      <p className={`text-[10px] font-black text-${card.color}-500 uppercase tracking-widest mb-1`}>{card.label}</p>
                      <p className={`text-lg font-black text-${card.color}-700`}>{formatRupiah(card.val)}</p>
                    </div>
                  ))}
                </div>

                {/* Detail Table */}
                <div className="overflow-x-auto custom-scroll pb-4">
                  <table className="strata-data-table compact-table w-full text-left text-sm min-w-[640px] border-collapse">
                    <thead className="bg-slate-100/50 text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-4 text-center w-10">No</th>
                        <th className="px-4 py-4">Tanggal</th>
                        <th className="px-4 py-4 text-center">Tipe</th>
                        <th className="px-4 py-4">Kategori</th>
                        <th className="px-4 py-4">Deskripsi</th>
                        <th className="px-4 py-4 text-right">Nominal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedBulanEntries.length === 0 ? (
                        <tr><td colSpan="6" className="px-6 py-10 text-center text-slate-400 font-semibold">
                          <Icon name="inbox" size={32} className="opacity-50 mx-auto mb-2" /> Tidak ada transaksi pada bulan ini.
                        </td></tr>
                      ) : selectedBulanEntries.map((entry, i) => (
                        <tr key={entry.id || i} className="hover:bg-emerald-50/40 transition-colors">
                          <td className="px-4 py-3 text-center text-slate-400 font-bold">{i + 1}</td>
                          <td className="px-4 py-3 font-bold text-slate-700 text-xs">{entry.tanggal || '-'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border shadow-sm ${
                              entry.tipe === 'pemasukan' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-600'
                            }`}>{entry.tipe === 'pemasukan' ? 'Masuk' : 'Keluar'}</span>
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-700 text-xs">{getAllKategoriLabel(entry.kategori)}</td>
                          <td className="px-4 py-3 text-xs text-slate-600">{entry.deskripsi || '-'}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-black ${entry.tipe === 'pemasukan' ? 'text-emerald-700' : 'text-rose-600'}`}>
                              {entry.tipe === 'pemasukan' ? '+' : '-'}{formatRupiah(Number(entry.nominal) || 0)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════ TAB: LAPORAN TAHUNAN ══════════ */}
        {keuanganSubTab === 'laporan-tahunan' && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-slate-800 text-lg">Laporan Keuangan Tahunan ({selectedTahunAjaran} M)</h3>
              <button onClick={() => handleExportPDF('tahunan')}
                className="px-4 py-2 bg-[#083316] text-white rounded-xl font-bold hover:bg-[#0a421d] transition-all shadow-md shadow-emerald-900/20 flex items-center gap-2 text-xs">
                <Icon name="file-down" size={14} /> Export PDF
              </button>
            </div>

            {/* Chart */}
            <div className="bg-slate-50/50 rounded-2xl p-5 mb-6 border border-slate-100">
              <h4 className="font-black text-slate-800 text-sm mb-4">Tren Pemasukan vs Pengeluaran</h4>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <div className="w-3 h-3 rounded-sm bg-gradient-to-b from-emerald-400 to-emerald-600" /> Pemasukan
                </div>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <div className="w-3 h-3 rounded-sm bg-gradient-to-b from-orange-400 to-orange-600" /> Pengeluaran
                </div>
              </div>
              <KeuanganBarChart data={perBulanData} height={280} />
            </div>

            {/* Donut Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <KeuanganDonutChart data={perKategoriPemasukan} title="Distribusi Pemasukan" colors={['#10b981', '#34d399', '#6ee7b7', '#a7f3d0']} />
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <KeuanganDonutChart data={perKategoriPengeluaran} title="Distribusi Pengeluaran" colors={['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fb923c', '#fdba74', '#c084fc']} />
              </div>
            </div>

            {/* Yearly Summary Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h4 className="font-black text-slate-800 text-sm">Ringkasan Per Bulan</h4>
              </div>
              <div className="overflow-x-auto custom-scroll pb-4">
                <table className="strata-data-table compact-table w-full text-left text-sm min-w-[640px] border-collapse">
                  <thead className="bg-slate-100/50 text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-4 text-center w-10">No</th>
                      <th className="px-4 py-4">Bulan</th>
                      <th className="px-4 py-4 text-right">Pemasukan</th>
                      <th className="px-4 py-4 text-right">Pengeluaran</th>
                      <th className="px-4 py-4 text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {perBulanData.map((d, i) => (
                      <tr key={i} className="hover:bg-emerald-50/40 transition-colors">
                        <td className="px-4 py-3 text-center text-slate-400 font-bold">{i + 1}</td>
                        <td className="px-4 py-3 font-black text-slate-800">{d.bulan}</td>
                        <td className="px-4 py-3 text-right font-black text-emerald-700">{formatRupiah(d.pemasukan)}</td>
                        <td className="px-4 py-3 text-right font-black text-rose-600">{formatRupiah(d.pengeluaran)}</td>
                        <td className={`px-4 py-3 text-right font-black ${d.saldo >= 0 ? 'text-slate-800' : 'text-red-600'}`}>{formatRupiah(d.saldo)}</td>
                      </tr>
                    ))}
                    {/* Total row */}
                    <tr className="bg-slate-50 font-black">
                      <td className="px-4 py-4" colSpan="2"><span className="text-slate-800 uppercase text-xs tracking-widest">Total</span></td>
                      <td className="px-4 py-4 text-right text-emerald-700 text-sm">{formatRupiah(totalPemasukan)}</td>
                      <td className="px-4 py-4 text-right text-rose-600 text-sm">{formatRupiah(totalPengeluaran)}</td>
                      <td className={`px-4 py-4 text-right text-sm ${saldo >= 0 ? 'text-emerald-800' : 'text-red-600'}`}>{formatRupiah(saldo)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
