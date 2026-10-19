import React, { useState, useMemo, useCallback } from 'react';
import { Icon } from './Icon';
import { LaporanPreviewModal } from './LaporanPreviewModal';
import { LaporanA4Ref } from './LaporanA4Ref';
import {
  formatRupiah,
  PAYMENT_ITEMS,
  BULANAN_ITEMS,
  TOTAL_BIAYA,
  TOTAL_BIAYA_BULANAN,
  monthNamesFull,
  ISLAMIC_MONTHS,
  parsePaymentDate,
} from '../utils/helpers';

// ══════════════════════════════════════════════════════════════
// ── CONSTANTS & CONFIGURATION ──
// ══════════════════════════════════════════════════════════════
const REPORT_CONFIG = [
  { id: 'data-santri', title: 'Data Santri', desc: 'Laporan demografi dan status santri', icon: 'users', color: '#10b981', bg: '#ecfdf5' },
  { id: 'pembayaran', title: 'Pembayaran', desc: 'Status pembayaran per santri', icon: 'wallet', color: '#3b82f6', bg: '#eff6ff' },
  { id: 'rekap-bulanan', title: 'Rekap Bulanan', desc: 'Pemasukan dari pembayaran bulanan', icon: 'calendar', color: '#f59e0b', bg: '#fffbeb' },
  { id: 'rekap-tahunan', title: 'Rekap Tahunan', desc: 'Pemasukan dari pembayaran tahunan', icon: 'calendar-range', color: '#8b5cf6', bg: '#f5f3ff' },
  { id: 'tunggakan', title: 'Tunggakan', desc: 'Daftar santri yang menunggak', icon: 'alert-triangle', color: '#ef4444', bg: '#fef2f2' },
  { id: 'keuangan', title: 'Keuangan', desc: 'Ringkasan finansial dan kepatuhan', icon: 'bar-chart-3', color: '#14b8a6', bg: '#f0fdfa' },
];

const BULANAN_NOMINAL = Object.fromEntries(BULANAN_ITEMS.map(i => [i.key, i.nominal]));

// ══════════════════════════════════════════════════════════════
// ── HELPER COMPONENTS ──
// ══════════════════════════════════════════════════════════════

// Clean minimalist Donut Chart
const NailulJannahLogo = () => (
  <svg width="80" height="80" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" fill="#facc15" />
    <circle cx="50" cy="50" r="40" fill="#166534" />
    <circle cx="50" cy="50" r="28" fill="transparent" stroke="white" strokeWidth="1" strokeDasharray="4 2" />
    {/* Globe lines */}
    <path d="M50 10 C30 10, 30 90, 50 90 M50 10 C70 10, 70 90, 50 90" fill="transparent" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
    <path d="M10 50 L90 50" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
    {/* Book */}
    <path d="M35 65 L50 70 L65 65 L65 45 L50 50 L35 45 Z" fill="white" />
    <text x="43" y="62" fill="#166534" fontSize="10" fontWeight="bold">N</text>
    <text x="53" y="62" fill="#166534" fontSize="10" fontWeight="bold">J</text>
    {/* Stars */}
    <path d="M25 35 L27 40 L32 40 L28 43 L29 48 L25 45 L21 48 L22 43 L18 40 L23 40 Z" fill="#facc15" />
    <path d="M75 35 L77 40 L82 40 L78 43 L79 48 L75 45 L71 48 L72 43 L68 40 L73 40 Z" fill="#facc15" />
    <path d="M50 20 L51.5 24.5 L56 24.5 L52 27.5 L53.5 32 L50 29 L46.5 32 L48 27.5 L44 24.5 L48.5 24.5 Z" fill="#facc15" />
  </svg>
);

const DonutChart = ({ data, totalLabel, totalValue, colors }) => {
  const size = 160;
  const strokeWidth = 24;
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  
  let currentOffset = 0;
  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;

  return (
    <div className="relative flex justify-center items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {data.map((item, index) => {
          const dasharray = (item.value / total) * circumference;
          const strokeDasharray = `${dasharray} ${circumference}`;
          const strokeDashoffset = -currentOffset;
          currentOffset += dasharray;

          return (
            <circle
              key={item.label}
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={colors[index] || '#e2e8f0'}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          );
        })}
        {/* Placeholder if empty */}
        {total === 1 && data.every(d => d.value === 0) && (
           <circle cx={center} cy={center} r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth={strokeWidth} />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{totalLabel}</span>
        <span className="text-sm font-black text-slate-800">{totalValue}</span>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// ── MAIN COMPONENT ──
// ══════════════════════════════════════════════════════════════
export const LaporanTab = ({ santriList = [], currentUser, allBulananData = [] }) => {
  const [activeReport, setActiveReport] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterGender, setFilterGender] = useState('Semua');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('Semua');
  const [visibleLimit, setVisibleLimit] = useState(50);

  // ══════════════════════════════════════════════════════════════
  // ── DATA PROCESSING (USEMEMO) ──
  // ══════════════════════════════════════════════════════════════
  
  // 1. Process Santri with payments
  const processedSantri = useMemo(() => {
    return santriList.map(santri => {
      let totalBayar = 0;
      const unpaidItems = [];
      
      PAYMENT_ITEMS.forEach(item => {
        if (santri.pembayaran?.[item.key]) {
          totalBayar += item.nominal;
        } else {
          unpaidItems.push(item);
        }
      });
      
      let statusPembayaran = 'Menunggak';
      if (totalBayar === TOTAL_BIAYA) statusPembayaran = 'Lunas';
      else if (totalBayar > 0) statusPembayaran = 'Sebagian';
      
      return {
        ...santri,
        totalBayar,
        tunggakan: TOTAL_BIAYA - totalBayar,
        unpaidItems,
        statusPembayaran
      };
    });
  }, [santriList]);

  // 2. Hub Stats
  const hubStats = useMemo(() => {
    const totalSantri = processedSantri.length;
    const santriAktif = processedSantri.filter(s => s.status === 'Aktif').length;
    
    const totalPemasukanTahunan = processedSantri.reduce((sum, s) => sum + s.totalBayar, 0);
    const totalPemasukanBulanan = allBulananData.reduce((sum, d) => {
      let t = 0;
      if (d.makan) t += BULANAN_NOMINAL.makan || 275000;
      if (d.laundry) t += BULANAN_NOMINAL.laundry || 120000;
      if (d.ziaroh) t += BULANAN_NOMINAL.ziaroh || 25000;
      return t;
    }, 0);
    
    const totalPemasukan = totalPemasukanTahunan + totalPemasukanBulanan;
    const santriLunas = processedSantri.filter(s => s.statusPembayaran === 'Lunas').length;
    const kepatuhan = totalSantri ? Math.round((santriLunas / totalSantri) * 100) : 0;

    return { totalSantri, santriAktif, totalPemasukan, kepatuhan };
  }, [processedSantri, allBulananData]);

  // 3. Rekap Bulanan Data
  const bulananGrouped = useMemo(() => {
    const grouped = {};
    ISLAMIC_MONTHS.forEach(m => { grouped[m] = { month: m, makan: 0, laundry: 0, ziaroh: 0, total: 0 } });
    
    allBulananData.forEach(data => {
      if (data.hijriMonth && grouped[data.hijriMonth]) {
         const m = grouped[data.hijriMonth];
         if (data.makan) { m.makan++; m.total += BULANAN_NOMINAL.makan || 275000; }
         if (data.laundry) { m.laundry++; m.total += BULANAN_NOMINAL.laundry || 120000; }
         if (data.ziaroh) { m.ziaroh++; m.total += BULANAN_NOMINAL.ziaroh || 25000; }
      }
    });
    
    return Object.values(grouped).filter(g => g.total > 0 || g.makan > 0 || g.laundry > 0 || g.ziaroh > 0);
  }, [allBulananData]);

  // 4. Rekap Tahunan Data
  const tahunanGrouped = useMemo(() => {
    return PAYMENT_ITEMS.map(item => {
      const terbayar = processedSantri.filter(s => s.pembayaran?.[item.key]).length;
      const belumBayar = processedSantri.length - terbayar;
      const nominalTotal = terbayar * item.nominal;
      const percentage = processedSantri.length ? Math.round((terbayar / processedSantri.length) * 100) : 0;
      
      return {
        ...item,
        terbayar,
        belumBayar,
        nominalTotal,
        percentage
      };
    });
  }, [processedSantri]);

  // 5. Filtered Santri
  const filteredSantri = useMemo(() => {
    return processedSantri.filter(s => {
      const matchSearch = s.namaLengkap?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.id?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus === 'Semua' || s.status === filterStatus;
      const matchGender = filterGender === 'Semua' || s.jenisKelamin === filterGender;
      const matchPayment = filterPaymentStatus === 'Semua' || s.statusPembayaran === filterPaymentStatus;
      
      return matchSearch && matchStatus && matchGender && matchPayment;
    });
  }, [processedSantri, searchQuery, filterStatus, filterGender, filterPaymentStatus]);

  // Reset limit when switching views
  const handleViewChange = (view) => {
    setActiveReport(view);
    setVisibleLimit(50);
    setSearchQuery('');
    setFilterStatus('Semua');
    setFilterGender('Semua');
    setFilterPaymentStatus('Semua');
  };

  // ══════════════════════════════════════════════════════════════
  // ── EXPORT FUNCTIONS ──
  // ══════════════════════════════════════════════════════════════
  
  const handleExportPDF = async (title, headers, rows, summaryLines = []) => {
    try {
      const { default: jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('PP Nailul Jannah', 14, 15);
      doc.setFontSize(11);
      doc.text(title, 14, 23);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} | Oleh: ${currentUser?.name || 'Admin'}`, 14, 29);
      doc.setTextColor(0);
      
      // Summary lines
      let startY = 35;
      if (summaryLines.length > 0) {
        doc.setFontSize(9);
        summaryLines.forEach((line, i) => {
          doc.text(line, 14, startY + (i * 5));
        });
        startY += summaryLines.length * 5 + 5;
      }
      
      // Table
      doc.autoTable({
        head: [headers],
        body: rows,
        startY,
        styles: { fontSize: 8, font: 'helvetica', cellPadding: 3 },
        headStyles: { fillColor: [8, 51, 22], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
      });
      
      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(`Dokumen ini digenerate otomatis oleh SI-PPNJ — Halaman ${i} dari ${pageCount}`, 14, doc.internal.pageSize.getHeight() - 10);
      }
      
      doc.save(`${title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("Gagal mengunduh PDF. Pastikan koneksi internet stabil untuk load library.");
    }
  };

  const handleExportCSV = (headers, rows, filename) => {
    const escapeCsvValue = (val) => {
      const text = String(val == null ? '' : val);
      return `"${text.replace(/"/g, '""')}"`;
    };
    const csvRows = [headers.map(escapeCsvValue).join(',')];
    rows.forEach(row => csvRows.push(row.map(escapeCsvValue).join(',')));
    const blob = new Blob(['\ufeff' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportGlobalPDF = () => {
    const headers = ['No', 'ID', 'Nama Lengkap', 'L/P', 'Status', 'Total Bayar', 'Tunggakan', 'Status Bayar'];
    const rows = processedSantri.map((s, i) => [
      i + 1, s.id, s.namaLengkap, s.jenisKelamin === 'Laki-laki' ? 'L' : 'P', s.status,
      formatRupiah(s.totalBayar), formatRupiah(s.tunggakan), s.statusPembayaran
    ]);
    const summary = [
      `Total Santri: ${hubStats.totalSantri} | Santri Aktif: ${hubStats.santriAktif}`,
      `Total Pemasukan: ${formatRupiah(hubStats.totalPemasukan)} | Tingkat Kepatuhan: ${hubStats.kepatuhan}%`
    ];
    handleExportPDF('Laporan_Global_Pesantren', headers, rows, summary);
  };

  const exportGlobalCSV = () => {
    const headers = ['ID', 'Nama Lengkap', 'Jenis Kelamin', 'Pendidikan', 'Status', 'Total Bayar', 'Tunggakan', 'Status Pembayaran'];
    const rows = processedSantri.map(s => [
      s.id, s.namaLengkap, s.jenisKelamin, s.pendidikan, s.status, s.totalBayar, s.tunggakan, s.statusPembayaran
    ]);
    handleExportCSV(headers, rows, 'Data_Global_Pesantren');
  };


  // ══════════════════════════════════════════════════════════════
  // ── RENDERERS ──
  // ══════════════════════════════════════════════════════════════

  const renderEmptyState = (msg = "Tidak ada data yang tersedia.") => (
    <div className="py-16 flex flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border border-slate-100">
      <Icon name="search" size={48} className="text-slate-200 mb-4" />
      <p className="font-medium">{msg}</p>
    </div>
  );

  const renderHubView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#083316] mb-1 flex items-center gap-2">
          <Icon name="bar-chart-3" size={24} className="text-[#083316]" />
          Pusat Laporan
        </h2>
        <p className="text-sm text-slate-500">Pilih modul laporan yang ingin Anda lihat atau unduh rekap global.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Santri', val: hubStats.totalSantri, icon: 'users', color: 'text-emerald-500' },
          { label: 'Santri Aktif', val: hubStats.santriAktif, icon: 'user-check', color: 'text-blue-500' },
          { label: 'Total Pemasukan', val: formatRupiah(hubStats.totalPemasukan), icon: 'wallet', color: 'text-teal-500' },
          { label: 'Kepatuhan Tahunan', val: `${hubStats.kepatuhan}%`, icon: 'circle-check', color: 'text-violet-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
            <div className={`p-3 rounded-full bg-slate-50 ${stat.color}`}>
              <Icon name={stat.icon} size={20} />
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-lg font-bold text-slate-800">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {REPORT_CONFIG.map(report => (
          <div 
            key={report.id}
            onClick={() => handleViewChange(report.id)}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group flex items-start gap-4"
          >
            <div 
              className="p-3 rounded-xl shadow-sm transition-transform group-hover:scale-110"
              style={{ backgroundColor: report.bg, color: report.color }}
            >
              <Icon name={report.icon} size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-800 mb-1 group-hover:text-[#083316] transition-colors">{report.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-2">{report.desc}</p>
            </div>
            <div className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 duration-300">
              <Icon name="arrow-left" size={16} className="rotate-180" />
            </div>
          </div>
        ))}
      </div>

      {/* Official Reference A4 Report Banner */}
      <div className="bg-gradient-to-r from-[#083316] via-[#0a421d] to-[#14532d] rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-400/20 text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30 uppercase tracking-widest">
              Sesuai Referensi Resmi
            </span>
            <span className="bg-white/10 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-white/20">
              1 Halaman A4
            </span>
          </div>
          <h3 className="text-lg md:text-xl font-extrabold mb-1 tracking-tight text-white">Laporan Cetak A4 Resmi Pesantren</h3>
          <p className="text-xs text-emerald-100/80 leading-relaxed">
            Format 1 halaman A4 lengkap dengan 6 Modul Laporan (Data Santri, Pembayaran, Tunggakan, Bulanan, Tahunan, Keuangan) serta Tanda Tangan Pengurus: <strong className="text-white">M. Najih Murtadlo</strong>.
          </p>
        </div>
        <div className="flex items-center gap-2.5 w-full md:w-auto relative z-10 flex-wrap sm:flex-nowrap">
          <button 
            onClick={() => setShowPreviewModal(true)} 
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-[#083316] hover:bg-emerald-50 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Icon name="eye" size={15} /> Pratinjau PDF
          </button>
          <button 
            onClick={() => setShowPreviewModal(true)} 
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Icon name="download" size={15} /> Unduh PDF
          </button>
          <button 
            onClick={() => setShowPreviewModal(true)} 
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Icon name="printer" size={15} /> Cetak (A4)
          </button>
        </div>
      </div>

      {/* Global Exports */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-slate-700 text-sm">Unduh Rekap Global</h4>
          <p className="text-xs text-slate-500">Export seluruh data pesantren dalam satu dokumen utuh.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button onClick={exportGlobalCSV} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 rounded-xl px-4 py-2.5 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer">
            <Icon name="file-spreadsheet" size={14} /> Export CSV
          </button>
          <button onClick={() => setShowPreviewModal(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#083316] text-white rounded-xl px-4 py-2.5 text-xs font-bold hover:bg-[#0a421d] transition-all shadow-sm cursor-pointer">
            <Icon name="file-text" size={14} /> Pratinjau PDF
          </button>
          <button onClick={() => setShowPreviewModal(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-xl px-4 py-2.5 text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm cursor-pointer">
            <Icon name="printer" size={14} /> Cetak (A4)
          </button>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  // Report 1: Data Santri
  // ─────────────────────────────────────────────────────────────
  const renderDataSantri = () => {
    const displayed = filteredSantri.slice(0, visibleLimit);
    const mCount = filteredSantri.filter(s => s.jenisKelamin === 'Laki-laki').length;
    const fCount = filteredSantri.filter(s => s.jenisKelamin === 'Perempuan').length;

    const doExportPDF = () => {
      const headers = ['No', 'ID', 'Nama Lengkap', 'L/P', 'Pendidikan', 'Status'];
      const rows = filteredSantri.map((s, i) => [i+1, s.id, s.namaLengkap, s.jenisKelamin === 'Laki-laki' ? 'L' : 'P', s.pendidikan, s.status]);
      handleExportPDF('Laporan_Data_Santri', headers, rows, [`Total: ${filteredSantri.length} | Putra: ${mCount} | Putri: ${fCount}`]);
    };
    const doExportCSV = () => {
      const headers = ['ID', 'Nama', 'JK', 'Tempat Lahir', 'Tgl Lahir', 'Alamat', 'Pendidikan', 'Wali', 'No HP', 'Status'];
      const rows = filteredSantri.map(s => [s.id, s.namaLengkap, s.jenisKelamin, s.tempatLahir, s.tanggalLahir, s.alamat, s.pendidikan, s.namaWali, s.noHp, s.status]);
      handleExportCSV(headers, rows, 'Data_Santri');
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
             { label: 'Total Filtered', val: filteredSantri.length, color: 'text-slate-700' },
             { label: 'Status Aktif', val: filteredSantri.filter(s => s.status === 'Aktif').length, color: 'text-emerald-600' },
             { label: 'Putra', val: mCount, color: 'text-blue-600' },
             { label: 'Putri', val: fCount, color: 'text-pink-600' }
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name="search" size={16} className="text-slate-400" />
              </div>
              <input type="text" placeholder="Cari santri..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-50 transition-all shadow-sm" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none shadow-sm cursor-pointer">
              <option value="Semua">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Alumni">Alumni</option>
            </select>
            <select value={filterGender} onChange={e => setFilterGender(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none shadow-sm cursor-pointer">
              <option value="Semua">Semua L/P</option>
              <option value="Laki-laki">Putra</option>
              <option value="Perempuan">Putri</option>
            </select>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={doExportCSV} className="flex-1 md:flex-none justify-center flex items-center gap-2 bg-white border border-slate-200 text-slate-600 rounded-xl px-4 py-2.5 text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"><Icon name="file-spreadsheet" size={14}/> CSV</button>
            <button onClick={doExportPDF} className="flex-1 md:flex-none justify-center flex items-center gap-2 bg-emerald-600 text-white rounded-xl px-4 py-2.5 text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm"><Icon name="file-text" size={14}/> PDF</button>
          </div>
        </div>

        {filteredSantri.length === 0 ? renderEmptyState() : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide w-12 text-center">No</th>
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide">ID & Nama Lengkap</th>
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Jenis Kelamin</th>
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Pendidikan</th>
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((santri, i) => (
                    <tr key={santri.id} className="border-b border-slate-50 hover:bg-slate-25/50">
                      <td className="py-3 px-4 text-sm text-slate-500 text-center">{i + 1}</td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-bold text-slate-800">{santri.namaLengkap}</div>
                        <div className="text-xs text-slate-400">{santri.id}</div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{santri.jenisKelamin}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{santri.pendidikan}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${santri.status === 'Aktif' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                          {santri.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredSantri.length > visibleLimit && (
               <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                 <button onClick={() => setVisibleLimit(filteredSantri.length)} className="text-sm font-bold text-emerald-600 hover:text-emerald-700">Tampilkan Semua ({filteredSantri.length})</button>
               </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Report 2: Pembayaran Santri
  // ─────────────────────────────────────────────────────────────
  const renderPembayaran = () => {
    const displayed = filteredSantri.slice(0, visibleLimit);
    
    const totalTagihan = filteredSantri.length * TOTAL_BIAYA;
    const totalTerbayar = filteredSantri.reduce((sum, s) => sum + s.totalBayar, 0);
    const persentase = totalTagihan ? Math.round((totalTerbayar / totalTagihan) * 100) : 0;

    const doExportPDF = () => {
      const headers = ['No', 'Nama Lengkap', ...PAYMENT_ITEMS.map(i => i.label), 'Total', 'Status'];
      const rows = filteredSantri.map((s, i) => [
        i+1, s.namaLengkap,
        ...PAYMENT_ITEMS.map(item => s.pembayaran?.[item.key] ? 'Lunas' : '-'),
        formatRupiah(s.totalBayar),
        s.statusPembayaran
      ]);
      handleExportPDF('Laporan_Pembayaran_Santri', headers, rows, [
        `Total Tagihan: ${formatRupiah(totalTagihan)} | Total Masuk: ${formatRupiah(totalTerbayar)} | Kepatuhan: ${persentase}%`
      ]);
    };

    const doExportCSV = () => {
      const headers = ['ID', 'Nama Lengkap', ...PAYMENT_ITEMS.map(i => i.label), 'Total Bayar', 'Status'];
      const rows = filteredSantri.map(s => [
        s.id, s.namaLengkap,
        ...PAYMENT_ITEMS.map(item => s.pembayaran?.[item.key] ? 'Lunas' : 'Belum'),
        s.totalBayar, s.statusPembayaran
      ]);
      handleExportCSV(headers, rows, 'Pembayaran_Santri');
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {[
             { label: 'Total Tagihan', val: formatRupiah(totalTagihan), color: 'text-slate-700' },
             { label: 'Total Terbayar', val: formatRupiah(totalTerbayar), color: 'text-blue-600' },
             { label: 'Total Tunggakan', val: formatRupiah(totalTagihan - totalTerbayar), color: 'text-red-500' },
             { label: '% Pencapaian', val: `${persentase}%`, color: 'text-emerald-500' }
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{s.val}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name="search" size={16} className="text-slate-400" />
              </div>
              <input type="text" placeholder="Cari santri..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all shadow-sm" />
            </div>
            <select value={filterPaymentStatus} onChange={e => setFilterPaymentStatus(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none shadow-sm cursor-pointer">
              <option value="Semua">Semua Status</option>
              <option value="Lunas">Lunas</option>
              <option value="Sebagian">Sebagian</option>
              <option value="Menunggak">Menunggak</option>
            </select>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={doExportCSV} className="flex-1 md:flex-none justify-center flex items-center gap-2 bg-white border border-slate-200 text-slate-600 rounded-xl px-4 py-2.5 text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"><Icon name="file-spreadsheet" size={14}/> CSV</button>
            <button onClick={doExportPDF} className="flex-1 md:flex-none justify-center flex items-center gap-2 bg-blue-600 text-white rounded-xl px-4 py-2.5 text-xs font-bold hover:bg-blue-700 transition-all shadow-sm"><Icon name="file-text" size={14}/> PDF</button>
          </div>
        </div>

        {filteredSantri.length === 0 ? renderEmptyState() : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide w-12 text-center">No</th>
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Nama Lengkap</th>
                    {PAYMENT_ITEMS.map(item => (
                      <th key={item.key} className="py-3 px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide text-center" title={item.label}>
                         {item.label.substring(0,4)}.
                      </th>
                    ))}
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide text-right">Total Bayar</th>
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((santri, i) => (
                    <tr key={santri.id} className="border-b border-slate-50 hover:bg-slate-25/50">
                      <td className="py-3 px-4 text-sm text-slate-500 text-center">{i + 1}</td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-bold text-slate-800">{santri.namaLengkap}</div>
                      </td>
                      {PAYMENT_ITEMS.map(item => {
                        const paid = santri.pembayaran?.[item.key];
                        return (
                          <td key={item.key} className="py-3 px-2 text-center">
                            {paid ? (
                               <Icon name="circle-check" size={16} className="text-emerald-500 mx-auto" />
                            ) : (
                               <Icon name="circle-x" size={16} className="text-slate-200 mx-auto" />
                            )}
                          </td>
                        );
                      })}
                      <td className="py-3 px-4 text-sm font-bold text-slate-700 text-right">{formatRupiah(santri.totalBayar)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                          santri.statusPembayaran === 'Lunas' ? 'bg-emerald-50 text-emerald-600' :
                          santri.statusPembayaran === 'Sebagian' ? 'bg-amber-50 text-amber-600' :
                          'bg-red-50 text-red-600'
                        }`}>
                          {santri.statusPembayaran}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredSantri.length > visibleLimit && (
               <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                 <button onClick={() => setVisibleLimit(filteredSantri.length)} className="text-sm font-bold text-blue-600 hover:text-blue-700">Tampilkan Semua ({filteredSantri.length})</button>
               </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Report 3: Rekap Bulanan
  // ─────────────────────────────────────────────────────────────
  const renderRekapBulanan = () => {
    const doExportPDF = () => {
      const headers = ['No', 'Bulan', 'Makan', 'Laundry', 'Ziaroh', 'Total Nominal'];
      const rows = bulananGrouped.map((b, i) => [
        i+1, b.month, `${b.makan} Santri`, `${b.laundry} Santri`, `${b.ziaroh} Santri`, formatRupiah(b.total)
      ]);
      const totalSemua = bulananGrouped.reduce((s, b) => s + b.total, 0);
      handleExportPDF('Rekap_Pembayaran_Bulanan', headers, rows, [`Total Pemasukan Bulanan: ${formatRupiah(totalSemua)}`]);
    };

    const doExportCSV = () => {
      const headers = ['Bulan', 'Santri Makan', 'Santri Laundry', 'Santri Ziaroh', 'Total Nominal'];
      const rows = bulananGrouped.map(b => [b.month, b.makan, b.laundry, b.ziaroh, b.total]);
      handleExportCSV(headers, rows, 'Rekap_Bulanan');
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-end gap-2">
            <button onClick={doExportCSV} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 rounded-xl px-4 py-2 text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"><Icon name="file-spreadsheet" size={14}/> CSV</button>
            <button onClick={doExportPDF} className="flex items-center gap-2 bg-amber-500 text-white rounded-xl px-4 py-2 text-xs font-bold hover:bg-amber-600 transition-all shadow-sm"><Icon name="file-text" size={14}/> PDF</button>
        </div>

        {bulananGrouped.length === 0 ? renderEmptyState("Belum ada data pembayaran bulanan yang tercatat.") : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Bulan</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide text-center">Makan</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide text-center">Laundry</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide text-center">Ziaroh</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide text-right">Total Masuk</th>
                </tr>
              </thead>
              <tbody>
                {bulananGrouped.map((item, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-25/50">
                    <td className="py-3 px-4 text-sm font-bold text-slate-700">{item.month}</td>
                    <td className="py-3 px-4 text-sm text-slate-600 text-center">{item.makan} <span className="text-[10px] text-slate-400">org</span></td>
                    <td className="py-3 px-4 text-sm text-slate-600 text-center">{item.laundry} <span className="text-[10px] text-slate-400">org</span></td>
                    <td className="py-3 px-4 text-sm text-slate-600 text-center">{item.ziaroh} <span className="text-[10px] text-slate-400">org</span></td>
                    <td className="py-3 px-4 text-sm font-bold text-emerald-600 text-right">{formatRupiah(item.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50">
                <tr>
                  <td colSpan={4} className="py-3 px-4 text-sm font-bold text-slate-700 text-right">Total Keseluruhan</td>
                  <td className="py-3 px-4 text-sm font-bold text-emerald-600 text-right">{formatRupiah(bulananGrouped.reduce((s, b) => s + b.total, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Report 4: Rekap Tahunan
  // ─────────────────────────────────────────────────────────────
  const renderRekapTahunan = () => {
    const doExportPDF = () => {
      const headers = ['No', 'Item Pembayaran', 'Nominal', 'Terbayar', 'Belum Bayar', '%', 'Total Nominal Masuk'];
      const rows = tahunanGrouped.map((t, i) => [
        i+1, t.label, formatRupiah(t.nominal), `${t.terbayar} org`, `${t.belumBayar} org`, `${t.percentage}%`, formatRupiah(t.nominalTotal)
      ]);
      const totalSemua = tahunanGrouped.reduce((s, b) => s + b.nominalTotal, 0);
      handleExportPDF('Rekap_Pembayaran_Tahunan', headers, rows, [`Total Pemasukan Tahunan: ${formatRupiah(totalSemua)}`]);
    };

    const doExportCSV = () => {
      const headers = ['Item Pembayaran', 'Nominal per Siswa', 'Jml Terbayar', 'Jml Belum Bayar', 'Persentase', 'Total Nominal'];
      const rows = tahunanGrouped.map(t => [t.label, t.nominal, t.terbayar, t.belumBayar, `${t.percentage}%`, t.nominalTotal]);
      handleExportCSV(headers, rows, 'Rekap_Tahunan');
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-end gap-2">
            <button onClick={doExportCSV} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 rounded-xl px-4 py-2 text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"><Icon name="file-spreadsheet" size={14}/> CSV</button>
            <button onClick={doExportPDF} className="flex items-center gap-2 bg-violet-600 text-white rounded-xl px-4 py-2 text-xs font-bold hover:bg-violet-700 transition-all shadow-sm"><Icon name="file-text" size={14}/> PDF</button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 overflow-hidden">
           <div className="space-y-6">
              {tahunanGrouped.map(item => (
                <div key={item.key} className="border-b border-slate-100 last:border-0 pb-5 last:pb-0">
                   <div className="flex justify-between items-end mb-2">
                      <div>
                         <h4 className="font-bold text-slate-800 text-sm">{item.label}</h4>
                         <p className="text-xs text-slate-500">{formatRupiah(item.nominal)} / santri</p>
                      </div>
                      <div className="text-right">
                         <div className="text-sm font-bold text-emerald-600">{formatRupiah(item.nominalTotal)}</div>
                         <div className="text-[10px] text-slate-400">{item.terbayar} dari {processedSantri.length} santri</div>
                      </div>
                   </div>
                   <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 transition-all duration-1000" style={{ width: `${item.percentage}%` }}></div>
                   </div>
                   <div className="flex justify-between mt-1 text-[10px] font-bold">
                      <span className="text-violet-600">{item.percentage}% Terbayar</span>
                      <span className="text-slate-400">{item.belumBayar} Belum Lunas</span>
                   </div>
                </div>
              ))}
           </div>
           
           <div className="mt-6 pt-5 border-t border-slate-100 flex justify-between items-center bg-slate-50 rounded-xl p-4">
              <span className="font-bold text-slate-700 text-sm">Total Estimasi Pemasukan</span>
              <span className="font-black text-violet-700 text-lg">{formatRupiah(tahunanGrouped.reduce((s, b) => s + b.nominalTotal, 0))}</span>
           </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Report 5: Tunggakan
  // ─────────────────────────────────────────────────────────────
  const renderTunggakan = () => {
    // Only show who have tunggakan > 0, sort by highest tunggakan
    const tunggakanList = processedSantri
      .filter(s => s.tunggakan > 0)
      .sort((a, b) => b.tunggakan - a.tunggakan);
      
    const displayed = tunggakanList.slice(0, visibleLimit);
    const totalTunggakanNominal = tunggakanList.reduce((s, i) => s + i.tunggakan, 0);

    const doExportPDF = () => {
      const headers = ['No', 'Nama Lengkap', 'Kelas/Pend.', 'Total Tunggakan', 'Item Belum Bayar'];
      const rows = tunggakanList.map((s, i) => [
        i+1, s.namaLengkap, s.pendidikan, formatRupiah(s.tunggakan), s.unpaidItems.map(u => u.label).join(', ')
      ]);
      handleExportPDF('Laporan_Tunggakan', headers, rows, [
        `Total Santri Menunggak: ${tunggakanList.length} Santri`,
        `Total Nominal Tunggakan: ${formatRupiah(totalTunggakanNominal)}`
      ]);
    };

    const doExportCSV = () => {
      const headers = ['ID', 'Nama Lengkap', 'Pendidikan', 'Nominal Tunggakan', 'Item Belum Dibayar', 'No HP'];
      const rows = tunggakanList.map(s => [
        s.id, s.namaLengkap, s.pendidikan, s.tunggakan, s.unpaidItems.map(u => u.label).join('; '), s.noHp
      ]);
      handleExportCSV(headers, rows, 'Laporan_Tunggakan');
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="bg-red-50 rounded-xl border border-red-100 p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Total Santri Menunggak</p>
                <p className="text-2xl font-bold text-red-600">{tunggakanList.length} <span className="text-sm font-medium text-red-400">Santri</span></p>
              </div>
              <Icon name="users" size={32} className="text-red-200" />
           </div>
           <div className="bg-red-50 rounded-xl border border-red-100 p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Total Nominal Tunggakan</p>
                <p className="text-2xl font-bold text-red-600">{formatRupiah(totalTunggakanNominal)}</p>
              </div>
              <Icon name="wallet" size={32} className="text-red-200" />
           </div>
        </div>

        <div className="flex justify-end gap-2">
            <button onClick={doExportCSV} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 rounded-xl px-4 py-2 text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"><Icon name="file-spreadsheet" size={14}/> CSV</button>
            <button onClick={doExportPDF} className="flex items-center gap-2 bg-red-600 text-white rounded-xl px-4 py-2 text-xs font-bold hover:bg-red-700 transition-all shadow-sm"><Icon name="file-text" size={14}/> PDF</button>
        </div>

        {tunggakanList.length === 0 ? renderEmptyState("Tidak ada santri yang menunggak! Semua lunas 🎉") : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide w-12 text-center">No</th>
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Nama Lengkap</th>
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Nominal Tunggakan</th>
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Item Belum Dibayar</th>
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((santri, i) => (
                    <tr key={santri.id} className="border-b border-slate-50 hover:bg-red-50/30">
                      <td className="py-3 px-4 text-sm text-slate-500 text-center">{i + 1}</td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-bold text-slate-800">{santri.namaLengkap}</div>
                        <div className="text-[10px] text-slate-400">{santri.pendidikan} • HP: {santri.noHp || '-'}</div>
                      </td>
                      <td className="py-3 px-4 text-sm font-bold text-red-600">{formatRupiah(santri.tunggakan)}</td>
                      <td className="py-3 px-4">
                         <div className="flex flex-wrap gap-1">
                            {santri.unpaidItems.map(item => (
                               <span key={item.key} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                 {item.label}
                               </span>
                            ))}
                         </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                          santri.statusPembayaran === 'Sebagian' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {santri.statusPembayaran}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {tunggakanList.length > visibleLimit && (
               <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                 <button onClick={() => setVisibleLimit(tunggakanList.length)} className="text-sm font-bold text-red-600 hover:text-red-700">Tampilkan Semua ({tunggakanList.length})</button>
               </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Report 6: Keuangan
  // ─────────────────────────────────────────────────────────────
  const renderKeuangan = () => {
    const totalTagihanTahunan = processedSantri.length * TOTAL_BIAYA;
    const totalMasukTahunan = processedSantri.reduce((sum, s) => sum + s.totalBayar, 0);
    const totalTunggakan = totalTagihanTahunan - totalMasukTahunan;
    const totalMasukBulanan = bulananGrouped.reduce((sum, b) => sum + b.total, 0);
    const grandTotal = totalMasukTahunan + totalMasukBulanan;

    const kepatuhan = totalTagihanTahunan ? Math.round((totalMasukTahunan / totalTagihanTahunan) * 100) : 0;
    const isHealthy = kepatuhan >= 80;

    const chartData = [
      { label: 'Terbayar', value: totalMasukTahunan },
      { label: 'Tunggakan', value: totalTunggakan }
    ];

    const doExportPDF = () => {
      const headers = ['Kategori', 'Total Nominal'];
      const rows = [
        ['Pemasukan Tahunan', formatRupiah(totalMasukTahunan)],
        ['Pemasukan Bulanan', formatRupiah(totalMasukBulanan)],
        ['Total Pemasukan Keseluruhan', formatRupiah(grandTotal)],
        ['Total Tunggakan Tahunan', formatRupiah(totalTunggakan)],
      ];
      handleExportPDF('Ringkasan_Keuangan', headers, rows, [
        `Kepatuhan Pembayaran: ${kepatuhan}%`,
        `Status Keuangan: ${isHealthy ? 'Sehat (Capaian > 80%)' : 'Perlu Perhatian (Capaian < 80%)'}`
      ]);
    };

    return (
      <div className="space-y-6">
         <div className="flex justify-end gap-2">
            <button onClick={doExportPDF} className="flex items-center gap-2 bg-teal-600 text-white rounded-xl px-4 py-2 text-xs font-bold hover:bg-teal-700 transition-all shadow-sm"><Icon name="file-text" size={14}/> Export PDF</button>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col items-center justify-center lg:col-span-1">
               <h3 className="text-sm font-bold text-slate-700 mb-6 w-full text-center">Komposisi Pembayaran Tahunan</h3>
               <DonutChart 
                 data={chartData} 
                 totalLabel="Capaian" 
                 totalValue={`${kepatuhan}%`}
                 colors={['#10b981', '#ef4444']} 
               />
               <div className="mt-6 flex items-center justify-center gap-6 w-full text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-600">Terbayar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span className="text-slate-600">Tunggakan</span>
                  </div>
               </div>
            </div>

            {/* Summary Section */}
            <div className="lg:col-span-2 space-y-4">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-teal-50 rounded-2xl border border-teal-100 p-5 shadow-sm">
                     <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1">Grand Total Pemasukan</p>
                     <p className="text-3xl font-black text-teal-700 mb-2">{formatRupiah(grandTotal)}</p>
                     <div className="text-xs text-teal-600/80 font-medium">
                       Tahunan: {formatRupiah(totalMasukTahunan)} <br/>
                       Bulanan: {formatRupiah(totalMasukBulanan)}
                     </div>
                  </div>
                  <div className="bg-red-50 rounded-2xl border border-red-100 p-5 shadow-sm">
                     <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Total Tunggakan Tahunan</p>
                     <p className="text-3xl font-black text-red-600 mb-2">{formatRupiah(totalTunggakan)}</p>
                     <div className="text-xs text-red-500/80 font-medium">
                        Dari {processedSantri.filter(s => s.tunggakan > 0).length} Santri menunggak
                     </div>
                  </div>
               </div>

               <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <Icon name="bar-chart-3" size={16} /> Analisis Kesimpulan Singkat
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Berdasarkan data saat ini, tingkat kepatuhan pembayaran santri berada di angka <strong className={isHealthy ? 'text-emerald-600' : 'text-amber-600'}>{kepatuhan}%</strong>. 
                    Kondisi keuangan saat ini masuk dalam kategori <strong className={isHealthy ? 'text-emerald-600' : 'text-amber-600'}>{isHealthy ? 'Sehat' : 'Perlu Perhatian'}</strong>. 
                    {totalTunggakan > 0 ? ` Masih terdapat tunggakan sebesar ${formatRupiah(totalTunggakan)} yang perlu ditindaklanjuti.` : ' Semua pembayaran tahunan telah lunas.'}
                  </p>
               </div>
            </div>
         </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Detail View Wrapper
  // ─────────────────────────────────────────────────────────────
  const renderDetailView = () => {
    const report = REPORT_CONFIG.find(r => r.id === activeReport);
    if (!report) return null;

    return (
      <div id="laporan-content" className="space-y-6">
        <button 
          onClick={() => setActiveReport(null)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-bold transition-colors cursor-pointer w-max"
        >
          <Icon name="arrow-left" size={16} /> Kembali ke Pusat Laporan
        </button>

        <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
          <div className="p-3 rounded-xl shadow-sm" style={{ backgroundColor: report.bg, color: report.color }}>
            <Icon name={report.icon} size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#083316] mb-1">{report.title}</h2>
            <p className="text-sm text-slate-500">{report.desc}</p>
          </div>
        </div>

        <div className="pt-2">
          {activeReport === 'data-santri' && renderDataSantri()}
          {activeReport === 'pembayaran' && renderPembayaran()}
          {activeReport === 'rekap-bulanan' && renderRekapBulanan()}
          {activeReport === 'rekap-tahunan' && renderRekapTahunan()}
          {activeReport === 'tunggakan' && renderTunggakan()}
          {activeReport === 'keuangan' && renderKeuangan()}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Cetak Keseluruhan (Print A4)
  // ─────────────────────────────────────────────────────────────
  const renderPrintAll = () => (
    <div id="laporan-print-all" className="hidden print:block bg-white text-black text-xs font-sans">
      <div className="flex items-center justify-center gap-6 pb-2 mb-6 border-b-4 border-black text-center" style={{ borderBottomStyle: 'double' }}>
        <div className="flex-shrink-0">
          <NailulJannahLogo />
        </div>
        <div className="flex flex-col items-center">
          <h2 className="text-3xl font-bold mb-1" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>المعهد الإسلامي نيل الجنة</h2>
          <h1 className="text-xl font-bold tracking-wide font-serif">PONDOK PESANTREN NAILUL JANNAH</h1>
          <p className="text-sm font-serif">Jl. Pesantren Rt 2 Rw 9 Gleget Mayonglor Mayong Jepara</p>
        </div>
        <div className="w-[80px]"></div> {/* Spacer */}
      </div>

      <div className="text-center mb-6">
        <h3 className="text-lg font-bold uppercase underline">Laporan Global Pesantren</h3>
        <p>Dicetak pada: {new Date().toLocaleDateString('id-ID')} | Oleh: {currentUser?.name || 'Admin'}</p>
      </div>

      <div className="space-y-8">
        {/* Ringkasan */}
        <section>
          <h4 className="font-bold text-sm bg-slate-100 p-2 mb-2 border border-slate-300">Ringkasan Statistik</h4>
          <table className="w-full border-collapse border border-slate-300 text-sm">
             <tbody>
               <tr>
                 <td className="border border-slate-300 p-2 font-bold w-1/4">Total Santri</td>
                 <td className="border border-slate-300 p-2 w-1/4">{hubStats.totalSantri}</td>
                 <td className="border border-slate-300 p-2 font-bold w-1/4">Total Pemasukan</td>
                 <td className="border border-slate-300 p-2 w-1/4">{formatRupiah(hubStats.totalPemasukan)}</td>
               </tr>
               <tr>
                 <td className="border border-slate-300 p-2 font-bold">Santri Aktif</td>
                 <td className="border border-slate-300 p-2">{hubStats.santriAktif}</td>
                 <td className="border border-slate-300 p-2 font-bold">Kepatuhan Tahunan</td>
                 <td className="border border-slate-300 p-2">{hubStats.kepatuhan}%</td>
               </tr>
             </tbody>
          </table>
        </section>

        {/* Tabel Data Santri */}
        <section className="print-page-break mt-8">
          <h4 className="font-bold text-sm bg-slate-100 p-2 mb-2 border border-slate-300">1. Data Santri</h4>
          <table className="w-full border-collapse border border-slate-300 text-left">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-2 w-12 text-center">No</th>
                <th className="border border-slate-300 p-2">Nama Lengkap</th>
                <th className="border border-slate-300 p-2 text-center">L/P</th>
                <th className="border border-slate-300 p-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {processedSantri.map((s, i) => (
                <tr key={s.id}>
                  <td className="border border-slate-300 p-2 text-center">{i + 1}</td>
                  <td className="border border-slate-300 p-2">{s.namaLengkap}</td>
                  <td className="border border-slate-300 p-2 text-center">{s.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}</td>
                  <td className="border border-slate-300 p-2 text-center">{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Laporan Pembayaran Santri */}
        <section className="print-page-break mt-8">
          <h4 className="font-bold text-sm bg-slate-100 p-2 mb-2 border border-slate-300">2. Rekap Pembayaran Tahunan Santri</h4>
          <table className="w-full border-collapse border border-slate-300 text-left text-[11px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-2 text-center">No</th>
                <th className="border border-slate-300 p-2">Nama</th>
                {PAYMENT_ITEMS.map(i => <th key={i.key} className="border border-slate-300 p-1 text-center" title={i.label}>{i.label.substring(0,4)}.</th>)}
                <th className="border border-slate-300 p-2 text-right">Total Bayar</th>
              </tr>
            </thead>
            <tbody>
              {processedSantri.map((s, i) => (
                <tr key={s.id}>
                  <td className="border border-slate-300 p-2 text-center">{i + 1}</td>
                  <td className="border border-slate-300 p-2">{s.namaLengkap}</td>
                  {PAYMENT_ITEMS.map(item => (
                    <td key={item.key} className="border border-slate-300 p-1 text-center font-bold">{s.pembayaran?.[item.key] ? '✓' : '-'}</td>
                  ))}
                  <td className="border border-slate-300 p-2 text-right">{formatRupiah(s.totalBayar)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Rekap Tahunan Agregat */}
        <section className="print-page-break mt-8">
          <h4 className="font-bold text-sm bg-slate-100 p-2 mb-2 border border-slate-300">3. Rekapitulasi Tahunan (Agregat)</h4>
          <table className="w-full border-collapse border border-slate-300 text-left">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-2">Item Pembayaran</th>
                <th className="border border-slate-300 p-2 text-right">Nominal</th>
                <th className="border border-slate-300 p-2 text-center">Terbayar</th>
                <th className="border border-slate-300 p-2 text-center">Belum</th>
                <th className="border border-slate-300 p-2 text-right">Total Masuk</th>
              </tr>
            </thead>
            <tbody>
              {tahunanGrouped.map((item, i) => (
                <tr key={i}>
                  <td className="border border-slate-300 p-2">{item.label}</td>
                  <td className="border border-slate-300 p-2 text-right">{formatRupiah(item.nominal)}</td>
                  <td className="border border-slate-300 p-2 text-center">{item.terbayar} ({item.percentage}%)</td>
                  <td className="border border-slate-300 p-2 text-center">{item.belumBayar}</td>
                  <td className="border border-slate-300 p-2 text-right">{formatRupiah(item.nominalTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        
        {/* Rekap Bulanan Agregat */}
        <section className="print-page-break mt-8">
          <h4 className="font-bold text-sm bg-slate-100 p-2 mb-2 border border-slate-300">4. Rekapitulasi Pembayaran Bulanan (SPP)</h4>
          <table className="w-full border-collapse border border-slate-300 text-left">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-2">Bulan Hijriah</th>
                <th className="border border-slate-300 p-2 text-center">Makan</th>
                <th className="border border-slate-300 p-2 text-center">Laundry</th>
                <th className="border border-slate-300 p-2 text-center">Ziaroh</th>
                <th className="border border-slate-300 p-2 text-right">Total Pemasukan</th>
              </tr>
            </thead>
            <tbody>
              {bulananGrouped.map((row, i) => (
                <tr key={i}>
                  <td className="border border-slate-300 p-2 font-bold">{row.month}</td>
                  <td className="border border-slate-300 p-2 text-center">{row.makan}</td>
                  <td className="border border-slate-300 p-2 text-center">{row.laundry}</td>
                  <td className="border border-slate-300 p-2 text-center">{row.ziaroh}</td>
                  <td className="border border-slate-300 p-2 text-right">{formatRupiah(row.total)}</td>
                </tr>
              ))}
              {bulananGrouped.length === 0 && (
                <tr>
                  <td colSpan="5" className="border border-slate-300 p-4 text-center italic text-gray-500">Belum ada data pembayaran bulanan</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );

  return (
    <div key={activeReport || 'hub'} className="strata-laporan-page animate-in fade-in duration-500 slide-in-from-bottom-2">
      {activeReport ? renderDetailView() : renderHubView()}
      
      {/* Official A4 Print Reference component (rendered in DOM for window.print) */}
      <div className="hidden print:block">
        <LaporanA4Ref 
          santriList={santriList}
          allBulananData={allBulananData}
          customDate="26 Juli 2026" 
          pimpinanName="M. Najih Murtadlo" 
        />
      </div>

      {/* Interactive PDF Preview Modal */}
      <LaporanPreviewModal 
        isOpen={showPreviewModal} 
        onClose={() => setShowPreviewModal(false)} 
        currentUser={currentUser} 
        santriList={santriList}
        allBulananData={allBulananData}
      />
    </div>
  );
};
