import React, { useState, useMemo, useEffect } from 'react';
import { Icon } from './Icon';
import {
  formatRupiah,
  formatShortRupiah,
  PAYMENT_ITEMS,
  BULANAN_ITEMS,
  TOTAL_BIAYA,
  TOTAL_BIAYA_BULANAN,
  TAHUN_AJARAN_LIST,
  ISLAMIC_MONTHS
} from '../utils/helpers';

// ─────────────────────────────────────────────
// Sub-page: Rekap Pembayaran Tahunan
// ─────────────────────────────────────────────
const RekapTahunan = ({ santriList, allBulananData, dataLoading, setAlert, globalActiveYear }) => {
  const [selectedYear, setSelectedYear] = useState(globalActiveYear || 2026);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [detailStudent, setDetailStudent] = useState(null);
  const [waModal, setWaModal] = useState(null); // { item, tunggakanTahunan, tunggakanBulanan, message, phone }

  // Normalisasi nomor 08xxx → 628xxx
  const normalizeWaNumber = (noHp) => {
    const digits = String(noHp || '').replace(/\D/g, '');
    if (digits.startsWith('08')) return '62' + digits.slice(1);
    if (digits.startsWith('8')) return '62' + digits;
    return digits;
  };

  // Hitung tunggakan tahunan & bulanan untuk satu item rekap
  const getTunggakanDetail = (item) => {
    const pembayaran = item.annualDetails || {};
    // Tunggakan tahunan: semua PAYMENT_ITEMS yang belum dibayar
    const tunggakanTahunan = PAYMENT_ITEMS.filter(p => !pembayaran[p.key]);

    // Tunggakan bulanan: per bulan aktif, cek tiap sub-item yang belum lunas
    const bulananEntries = item.bulananEntries || [];
    const tunggakanBulanan = [];
    activeMonths.forEach(month => {
      const entry = bulananEntries.find(e => e.hijriMonth === month);
      const subItems = [
        { label: 'Makan (1 Bln)', nominal: 275000, paid: entry ? !!entry.makan : false },
        { label: 'Laundry (2 Bln)', nominal: 120000, paid: entry ? !!entry.laundry : false },
        { label: 'Tabungan Ziaroh', nominal: 25000, paid: entry ? !!entry.ziaroh : false },
      ];
      const belum = subItems.filter(s => !s.paid);
      if (belum.length > 0) {
        tunggakanBulanan.push({ month, items: belum });
      }
    });

    return { tunggakanTahunan, tunggakanBulanan };
  };

  // Bangun pesan WA dari tunggakan tahunan + bulanan
  const buildWaMessage = (item, tunggakanTahunan, tunggakanBulanan) => {
    const lines = [];
    tunggakanTahunan.forEach(p => {
      lines.push(`📌 ${p.label}: Rp${p.nominal.toLocaleString('id-ID')}`);
    });
    tunggakanBulanan.forEach(({ month, items }) => {
      items.forEach(s => {
        lines.push(`📌 ${s.label} (${month}): Rp${s.nominal.toLocaleString('id-ID')}`);
      });
    });
    const total = [
      ...tunggakanTahunan.map(p => p.nominal),
      ...tunggakanBulanan.flatMap(b => b.items.map(s => s.nominal))
    ].reduce((a, b) => a + b, 0);
    return `Assalamu'alaikum Wr. Wb.\n\nYth. Bapak/Ibu Wali Santri dari ${item.name},\nBerikut informasi tunggakan pembayaran:\n${lines.join('\n')}\n💰 Total Tunggakan: Rp${total.toLocaleString('id-ID')}\nMohon dapat melakukan pembayaran sesuai ketentuan pesantren.\nTerima kasih atas perhatian dan kerja samanya.\n\nWassalamu'alaikum Wr. Wb.\nPP. Nailul Jannah`;
  };

  const handleOpenWaModal = (item) => {
    const student = item.student || {};
    const noHp = String(student.noHp || '').replace(/\D/g, '');
    const { tunggakanTahunan, tunggakanBulanan } = getTunggakanDetail(item);
    const hasTunggakan = tunggakanTahunan.length > 0 || tunggakanBulanan.length > 0;

    if (!hasTunggakan) {
      setAlert({ type: 'success', text: `${item.name} tidak memiliki tunggakan pembayaran.` });
      return;
    }
    if (!noHp || noHp.length < 9) {
      setAlert({ type: 'error', text: `Nomor WhatsApp wali ${item.name} tidak tersedia atau tidak valid.` });
      return;
    }
    const message = buildWaMessage(item, tunggakanTahunan, tunggakanBulanan);
    const phone = normalizeWaNumber(noHp);
    setWaModal({ item, tunggakanTahunan, tunggakanBulanan, message, phone });
  };

  useEffect(() => {
    if (globalActiveYear) setSelectedYear(globalActiveYear);
  }, [globalActiveYear]);

  const selectedYearStr = String(selectedYear);

  // Active students (non-alumni)
  const activeStudents = useMemo(() =>
    santriList.filter(s => {
      const status = String(s.status || '').trim().toLowerCase();
      return status !== 'alumni' && status !== 'ditolak';
    }), [santriList]);

  // Bulanan filtered by year
  const filteredBulanan = useMemo(() =>
    allBulananData.filter(e => selectedYearStr === 'Semua' || String(e.academicYear) === selectedYearStr),
    [allBulananData, selectedYearStr]);

  // Active months
  const activeMonths = useMemo(() => {
    const months = new Set();
    filteredBulanan.forEach(e => { if (e.hijriMonth) months.add(e.hijriMonth); });
    return ISLAMIC_MONTHS.filter(m => months.has(m));
  }, [filteredBulanan]);

  // Per-student recap
  const studentRecaps = useMemo(() =>
    activeStudents.map(student => {
      const is2026 = selectedYear === 2026;
      const activePembayaran = is2026 ? (student.pembayaran || {}) : {};
      const annualPaidItems = PAYMENT_ITEMS.filter(item => activePembayaran[item.key]);
      const annualPaid = annualPaidItems.reduce((sum, item) => sum + item.nominal, 0);
      const annualTarget = TOTAL_BIAYA;
      const annualUnpaid = Math.max(annualTarget - annualPaid, 0);

      const studentBulananEntries = filteredBulanan.filter(e => e.studentId === student.id);
      const monthlyTarget = activeMonths.length * TOTAL_BIAYA_BULANAN;
      let monthlyPaid = 0;
      activeMonths.forEach(month => {
        const entry = studentBulananEntries.find(e => e.hijriMonth === month);
        if (entry) monthlyPaid += (entry.makan ? 275000 : 0) + (entry.laundry ? 120000 : 0) + (entry.ziaroh ? 25000 : 0);
      });
      const monthlyUnpaid = Math.max(monthlyTarget - monthlyPaid, 0);

      const totalTarget = annualTarget + monthlyTarget;
      const totalPaid = annualPaid + monthlyPaid;
      const totalUnpaid = annualUnpaid + monthlyUnpaid;

      let status = 'Menunggak';
      if (totalUnpaid === 0 && totalTarget > 0) status = 'Lunas';
      else if (totalPaid > 0) status = 'Sebagian';

      return {
        student, id: student.id, name: student.namaLengkap,
        annualPaid, annualTarget, annualUnpaid,
        monthlyPaid, monthlyTarget, monthlyUnpaid,
        totalTarget, totalPaid, totalUnpaid, status,
        annualDetails: activePembayaran,
        bulananEntries: studentBulananEntries
      };
    }), [activeStudents, filteredBulanan, activeMonths, selectedYear]);

  // Summary totals
  const totals = useMemo(() => {
    let totalTarget = 0, totalPaid = 0, totalUnpaid = 0;
    let totalAnnualTarget = 0, totalAnnualPaid = 0, totalAnnualUnpaid = 0;
    let totalMonthlyTarget = 0, totalMonthlyPaid = 0, totalMonthlyUnpaid = 0;
    let countLunas = 0, countSebagian = 0, countMenunggak = 0;

    studentRecaps.forEach(item => {
      totalTarget += item.totalTarget; totalPaid += item.totalPaid; totalUnpaid += item.totalUnpaid;
      totalAnnualTarget += item.annualTarget; totalAnnualPaid += item.annualPaid; totalAnnualUnpaid += item.annualUnpaid;
      totalMonthlyTarget += item.monthlyTarget; totalMonthlyPaid += item.monthlyPaid; totalMonthlyUnpaid += item.monthlyUnpaid;
      if (item.status === 'Lunas') countLunas++;
      else if (item.status === 'Sebagian') countSebagian++;
      else countMenunggak++;
    });

    const percentRealisasi = totalTarget > 0 ? Math.round((totalPaid / totalTarget) * 100) : 0;
    return { totalTarget, totalPaid, totalUnpaid, totalAnnualTarget, totalAnnualPaid, totalAnnualUnpaid, totalMonthlyTarget, totalMonthlyPaid, totalMonthlyUnpaid, countLunas, countSebagian, countMenunggak, percentRealisasi };
  }, [studentRecaps]);

  // Filter search/status
  const filteredRecaps = useMemo(() =>
    studentRecaps.filter(item => {
      const s = item.student || {};
      const q = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === '' ||
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        String(s.namaWali || '').toLowerCase().includes(q) ||
        String(s.namaAyah || '').toLowerCase().includes(q) ||
        String(s.namaIbu || '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'Semua' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    }), [studentRecaps, searchQuery, statusFilter]);

  const handleExportCSV = () => {
    if (filteredRecaps.length === 0) { setAlert({ type: 'error', text: 'Tidak ada data untuk diekspor.' }); return; }
    const headers = ['No', 'ID Santri', 'Nama Lengkap', 'Tahunan Target', 'Tahunan Terbayar', 'Tahunan Tunggakan', 'Bulanan Target', 'Bulanan Terbayar', 'Bulanan Tunggakan', 'Total Target', 'Total Terbayar', 'Total Tunggakan', 'Status'];
    const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const csvRows = [headers.map(escapeCsv).join(',')];
    filteredRecaps.forEach((item, index) => {
      csvRows.push([index + 1, item.id, item.name, item.annualTarget, item.annualPaid, item.annualUnpaid, item.monthlyTarget, item.monthlyPaid, item.monthlyUnpaid, item.totalTarget, item.totalPaid, item.totalUnpaid, item.status].map(escapeCsv).join(','));
    });
    const blob = new Blob(['\ufeff' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', ''); a.setAttribute('href', url);
    a.setAttribute('download', `Rekap_Tahunan_PPNJ_${selectedYear}_${new Date().getTime()}.csv`);
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setAlert({ type: 'success', text: 'Rekap CSV berhasil diunduh.' });
  };

  const statusBadgeClass = (status) =>
    status === 'Lunas' ? 'bg-green-50 border-green-200 text-green-700' :
    status === 'Sebagian' ? 'bg-amber-50 border-amber-200 text-amber-700' :
    'bg-rose-50 border-rose-200 text-rose-600';

  return (
    <div className="w-full space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-800">Rekap Pembayaran Tahunan</h3>
          <p className="text-slate-500 font-medium mt-1 text-sm">Rekapitulasi pembayaran administrasi tahunan (Pendaftaran & Perlengkapan) per santri.</p>
        </div>
        {/* Year Filter */}
        <div className="flex items-center bg-white border border-slate-200 shadow-sm p-1.5 rounded-2xl h-fit">
          <div className="flex items-center pl-3 pr-2 text-slate-400">
            <Icon name="calendar" size={16} />
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value === 'Semua' ? 'Semua' : parseInt(e.target.value))}
            className="bg-transparent text-sm font-bold text-[#083316] outline-none cursor-pointer pr-4 py-1.5 appearance-none"
          >
            <option value="Semua">Semua Tahun</option>
            {TAHUN_AJARAN_LIST.map(ta => (
              <option key={ta.masehi} value={ta.masehi}>Tahun Ajaran {ta.hijriah} H / {ta.masehi} M</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      {dataLoading ? (
        <div className="h-32 flex items-center justify-center gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
          <span className="text-sm text-slate-400 font-bold">Memuat data...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Pendapatan */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10 space-y-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Icon name="arrow-down-left" size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Pendapatan</p>
                <h4 className="font-black text-slate-800 text-lg leading-none tracking-tight tabular-nums">{formatRupiah(totals.totalPaid)}</h4>
              </div>
              <p className="text-[10px] text-emerald-600 font-bold">Lunas: {totals.countLunas} santri</p>
            </div>
          </div>

          {/* Card 2: Total Piutang */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10 space-y-3">
              <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
                <Icon name="arrow-up-right" size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Piutang</p>
                <h4 className="font-black text-slate-800 text-lg leading-none tracking-tight tabular-nums">{formatRupiah(totals.totalUnpaid)}</h4>
              </div>
              <p className="text-[10px] text-rose-500 font-bold">Menunggak: {totals.countMenunggak} santri</p>
            </div>
          </div>

          {/* Card 3: Rincian */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10 space-y-3">
              <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
                <Icon name="pie-chart" size={20} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Tahunan</p>
                  <p className="font-extrabold text-slate-800 text-xs tabular-nums leading-tight">{formatShortRupiah(totals.totalAnnualPaid)}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Bulanan</p>
                  <p className="font-extrabold text-slate-800 text-xs tabular-nums leading-tight">{formatShortRupiah(totals.totalMonthlyPaid)}</p>
                </div>
              </div>
              <p className="text-[10px] text-sky-600 font-bold">SPP Bulan Aktif: {activeMonths.length}</p>
            </div>
          </div>

          {/* Card 4: Tingkat Kepatuhan */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#083316]/5 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10 space-y-3">
              <div className="w-10 h-10 bg-emerald-50 text-[#083316] rounded-xl flex items-center justify-center">
                <Icon name="percent" size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Tingkat Kepatuhan</p>
                <h4 className="font-black text-slate-800 text-lg leading-none tracking-tight tabular-nums">{totals.percentRealisasi}%</h4>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="h-1.5 rounded-full bg-[#083316] transition-all duration-500" style={{ width: `${totals.percentRealisasi}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Table Panel */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm space-y-5">
        {/* Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Search */}
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white focus-within:border-emerald-500 transition-all w-full lg:max-w-md shadow-inner relative group">
              <Icon name="search" size={16} className="text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
              <input
                type="text"
                placeholder="Cari nama, ID, wali, ortu..."
                className="bg-transparent border-none outline-none text-xs font-bold w-full text-slate-700 placeholder-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <Icon name="x" size={14} />
                </button>
              )}
            </div>
            {/* Status Dropdown */}
            <div className="flex items-center bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl shadow-inner focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500 transition-all">
              <div className="flex items-center text-slate-400 mr-2"><Icon name="filter" size={14} /></div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer pr-3 py-0.5 appearance-none">
                <option value="Semua">Semua Status</option>
                <option value="Lunas">Sudah Lunas</option>
                <option value="Sebagian">Belum Lunas (Ada Cicilan)</option>
                <option value="Menunggak">Belum Bayar Sama Sekali</option>
              </select>
            </div>
          </div>
          {/* Export */}
          <button onClick={handleExportCSV} className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-600 hover:text-white px-5 py-2.5 rounded-2xl font-bold transition-all text-xs active:scale-[0.98] shadow-sm w-full lg:w-auto">
            <Icon name="download" size={14} />
            <span>Ekspor Rekap (CSV)</span>
          </button>
        </div>

        {/* Mobile Cards */}
        <div className="block md:hidden space-y-4">
          {dataLoading ? (
            <div className="py-16 text-center text-slate-400">
              <Icon name="loader-2" size={24} className="animate-spin mx-auto text-[#083316] mb-2" />
              Memuat tabel rekap...
            </div>
          ) : filteredRecaps.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-semibold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Icon name="inbox" size={32} className="opacity-40 mx-auto mb-2" />
              Tidak ada data rekap pembayaran ditemukan.
            </div>
          ) : filteredRecaps.map((item) => {
            const student = item.student || {};
            const parentInfo = [];
            if (student.namaWali && student.namaWali !== '-') parentInfo.push(`Wali: ${student.namaWali}`);
            if (student.namaAyah && student.namaAyah !== '-') parentInfo.push(`Ayah: ${student.namaAyah}`);
            if (student.namaIbu && student.namaIbu !== '-') parentInfo.push(`Ibu: ${student.namaIbu}`);
            return (
              <div key={item.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3 relative hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-black text-slate-800 text-sm">{item.name}</p>
                    <p className="font-mono text-[9px] text-slate-400 mt-0.5">{item.id}</p>
                    {parentInfo.length > 0 && <p className="text-[10px] text-slate-500 font-semibold mt-1">{parentInfo.join(' | ')}</p>}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-block border shadow-sm ${statusBadgeClass(item.status)}`}>{item.status}</span>
                </div>
                <div className="pt-2 border-t border-slate-100/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Terbayar</p>
                      <p className="text-xs font-bold text-slate-800">{formatRupiah(item.annualPaid)}</p>
                      <p className="text-[9px] text-slate-400">Target: {formatShortRupiah(item.annualTarget)}</p>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Tunggakan</p>
                      <p className={`text-xs font-black ${item.annualUnpaid > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                        {item.annualUnpaid > 0 ? formatRupiah(item.annualUnpaid) : 'Lunas'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setDetailStudent(item)} className="flex-1 py-2 bg-[#083316] text-white hover:bg-[#0a421d] rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1 shadow-sm active:scale-95">
                      <Icon name="search-code" size={12} />
                      <span>Rincian</span>
                    </button>
                    <button
                      onClick={() => handleOpenWaModal(item)}
                      title="Kirim Rekap Tunggakan ke WhatsApp Wali"
                      className="py-2 px-3 bg-green-500 text-white hover:bg-green-600 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1 shadow-sm active:scale-95"
                    >
                      <Icon name="message-circle" size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto custom-scroll w-full pb-4">
          <table className="compact-table w-full text-left text-sm min-w-full border-collapse">
            <thead className="bg-slate-50/50 text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-slate-200">
              <tr>
                <th className="px-5 py-4 text-center w-12">No</th>
                <th className="px-6 py-4">Nama Santri</th>
                <th className="px-5 py-4 text-right">Pembayaran Tahunan</th>
                <th className="px-5 py-4 text-right">Terbayar</th>
                <th className="px-5 py-4 text-right">Sisa Tunggakan</th>
                <th className="px-5 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dataLoading ? (
                <tr><td colSpan="7" className="px-6 py-16 text-center text-slate-400">
                  <Icon name="loader-2" size={24} className="animate-spin mx-auto text-[#083316] mb-2" />
                  Memuat tabel rekap...
                </td></tr>
              ) : filteredRecaps.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-semibold">
                  <Icon name="inbox" size={32} className="opacity-40 mx-auto mb-2" />
                  Tidak ada data rekap pembayaran ditemukan.
                </td></tr>
              ) : filteredRecaps.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-5 py-3.5 text-center text-slate-400 font-bold">{index + 1}</td>
                  <td className="px-6 py-3.5">
                    <p className="font-black text-slate-800 leading-tight">{item.name}</p>
                    <p className="font-mono text-[9px] text-slate-400 mt-0.5">{item.id}</p>
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium">
                    <span className="text-slate-500 block text-[10px]">Target: {formatShortRupiah(item.annualTarget)}</span>
                    <span className="font-bold text-slate-700">{formatRupiah(item.annualPaid)}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="font-extrabold text-emerald-600">{formatRupiah(item.annualPaid)}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`font-extrabold ${item.annualUnpaid > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                      {item.annualUnpaid > 0 ? formatRupiah(item.annualUnpaid) : 'Lunas'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-block border shadow-sm ${statusBadgeClass(item.status)}`}>{item.status}</span>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setDetailStudent(item)} className="px-3.5 py-1.5 bg-[#083316] text-white hover:bg-[#0a421d] rounded-xl font-bold transition-all text-xs flex items-center gap-1 shadow-sm active:scale-95">
                        <Icon name="search-code" size={13} />
                        <span>Rincian</span>
                      </button>
                      <button
                        onClick={() => handleOpenWaModal(item)}
                        title="Kirim Rekap Tunggakan ke WhatsApp Wali"
                        className="px-3 py-1.5 bg-green-500 text-white hover:bg-green-600 rounded-xl font-bold transition-all text-xs flex items-center gap-1 shadow-sm active:scale-95"
                      >
                        <Icon name="message-circle" size={13} />
                        <span>WA</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {detailStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in">
          <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#083316] flex items-center justify-center">
                  <Icon name="user" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 leading-tight">{detailStudent.name}</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">ID: {detailStudent.id} &bull; Status:
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase inline-block border ${statusBadgeClass(detailStudent.status)}`}>{detailStudent.status}</span>
                  </p>
                </div>
              </div>
              <button onClick={() => setDetailStudent(null)} className="p-2.5 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
                <Icon name="x" size={18} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scroll flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tahunan Details */}
                <div className="space-y-4">
                  <h4 className="font-black text-slate-700 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Icon name="file-text" size={16} className="text-[#083316]" />
                    Tagihan Tahunan (Pendaftaran)
                  </h4>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase leading-none">Total Terbayar</p>
                      <p className="font-extrabold text-[#083316] text-lg mt-1">{formatRupiah(detailStudent.annualPaid)} <span className="text-slate-400 text-xs font-normal">/ {formatShortRupiah(detailStudent.annualTarget)}</span></p>
                    </div>
                    {detailStudent.annualUnpaid > 0 ? (
                      <div className="text-right">
                        <p className="text-[9px] text-rose-500 font-black uppercase">Tunggakan</p>
                        <p className="font-bold text-rose-600 text-sm mt-0.5">{formatRupiah(detailStudent.annualUnpaid)}</p>
                      </div>
                    ) : <span className="px-2.5 py-1 bg-green-100 text-green-800 text-[10px] font-black rounded-full">LUNAS</span>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PAYMENT_ITEMS.map(item => {
                      const isPaid = !!detailStudent.annualDetails[item.key];
                      const datePaid = detailStudent.annualDetails[`${item.key}_tanggal`] || '-';
                      return (
                        <div key={item.key} className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${isPaid ? 'bg-green-50/40 border-green-100' : 'bg-white border-slate-100'}`}>
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${isPaid ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                            <Icon name={isPaid ? 'check' : 'minus'} size={14} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs text-slate-700 truncate leading-tight">{item.label}</p>
                            <p className="text-[10px] font-black text-slate-400 mt-0.5">{formatRupiah(item.nominal)}</p>
                            {isPaid && <p className="text-[9px] font-semibold text-slate-400 mt-0.5">Tgl: {datePaid}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Bulanan Details */}
                <div className="space-y-4">
                  <h4 className="font-black text-slate-700 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Icon name="calendar-range" size={16} className="text-sky-600" />
                    Tagihan Bulanan (Syahriyah)
                  </h4>
                  <div className="bg-sky-50/50 border border-sky-100 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-sky-600 font-bold uppercase leading-none">Total Syahriyah Terbayar</p>
                      <p className="font-extrabold text-sky-700 text-lg mt-1">{formatRupiah(detailStudent.monthlyPaid)} <span className="text-slate-400 text-xs font-normal">/ {formatShortRupiah(detailStudent.monthlyTarget)}</span></p>
                    </div>
                    {detailStudent.monthlyUnpaid > 0 ? (
                      <div className="text-right">
                        <p className="text-[9px] text-rose-500 font-black uppercase">Tunggakan</p>
                        <p className="font-bold text-rose-600 text-sm mt-0.5">{formatRupiah(detailStudent.monthlyUnpaid)}</p>
                      </div>
                    ) : activeMonths.length > 0 ? (
                      <span className="px-2.5 py-1 bg-green-100 text-green-800 text-[10px] font-black rounded-full">LUNAS</span>
                    ) : (
                      <span className="text-slate-400 text-[10px] font-bold">Belum ada bulan aktif</span>
                    )}
                  </div>
                  {activeMonths.length === 0 ? (
                    <div className="py-12 border border-slate-150 border-dashed rounded-2xl text-center text-slate-400">
                      <Icon name="inbox" size={24} className="mx-auto opacity-30 mb-2" />
                      <p className="text-xs font-semibold">Tidak ada bulan aktif tercatat di tahun ajaran ini.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scroll pr-1">
                      {activeMonths.map(month => {
                        const entry = detailStudent.bulananEntries.find(e => e.hijriMonth === month);
                        const isMakan = entry ? !!entry.makan : false;
                        const isLaundry = entry ? !!entry.laundry : false;
                        const isZiaroh = entry ? !!entry.ziaroh : false;
                        const subTotal = (isMakan ? 275000 : 0) + (isLaundry ? 120000 : 0) + (isZiaroh ? 25000 : 0);
                        const isMonthLunas = subTotal === TOTAL_BIAYA_BULANAN;
                        return (
                          <div key={month} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                              <h5 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide bg-slate-50 border border-slate-100 px-3 py-1 rounded-full">{month}</h5>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${isMonthLunas ? 'bg-green-50 border-green-200 text-green-600' : 'bg-amber-50 border-amber-200 text-amber-600'}`}>
                                {isMonthLunas ? 'Lunas' : `Terbayar: ${formatShortRupiah(subTotal)}`}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { label: 'Makan', nominal: 275000, active: isMakan },
                                { label: 'Laundry', nominal: 120000, active: isLaundry },
                                { label: 'Ziaroh', nominal: 25000, active: isZiaroh }
                              ].map(sub => (
                                <div key={sub.label} className={`p-2 rounded-xl border text-center space-y-1 transition-colors ${sub.active ? 'bg-emerald-50/30 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                  <p className="text-[10px] font-black leading-none">{sub.label}</p>
                                  <div className="flex items-center justify-center gap-1 mt-1">
                                    <Icon name={sub.active ? 'check-circle' : 'x-circle'} size={12} />
                                    <span className="text-[8px] font-bold">{sub.active ? 'Lunas' : 'Belum'}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setDetailStudent(null)} className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold rounded-xl text-xs transition-colors">
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Preview WA Tunggakan ── */}
      {waModal && (() => {
        const { item, message, phone, tunggakanTahunan, tunggakanBulanan } = waModal;
        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in">
            <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col border border-slate-100">
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
                    <Icon name="message-circle" size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800 leading-tight">Kirim Rekap Tunggakan via WA</h3>
                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Preview pesan sebelum dikirim ke wali santri</p>
                  </div>
                </div>
                <button onClick={() => setWaModal(null)} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors">
                  <Icon name="x" size={16} />
                </button>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto custom-scroll max-h-[60vh]">
                {/* Info Santri */}
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-[#083316]/10 text-[#083316] flex items-center justify-center font-black text-sm flex-shrink-0">
                    {item.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-slate-800 text-sm truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.id}</p>
                  </div>
                  <div className="ml-auto text-right flex-shrink-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">No. WA Wali</p>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">+{phone}</p>
                  </div>
                </div>

                {/* Rincian Tunggakan */}
                <div className="space-y-2">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Rincian Tunggakan</p>
                  {tunggakanTahunan.length === 0 && tunggakanBulanan.length === 0 ? (
                    <div className="p-4 bg-green-50 border border-green-100 rounded-2xl text-center">
                      <p className="text-green-700 font-bold text-sm">Santri tidak memiliki tunggakan pembayaran.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Tunggakan Tahunan */}
                      {tunggakanTahunan.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Icon name="file-text" size={11} className="text-[#083316]" />
                            Tagihan Tahunan
                          </p>
                          {tunggakanTahunan.map(p => (
                            <div key={p.key} className="flex items-center justify-between px-4 py-2.5 bg-rose-50 border border-rose-100 rounded-xl">
                              <div className="flex items-center gap-2">
                                <Icon name="alert-circle" size={13} className="text-rose-400" />
                                <span className="text-xs font-bold text-slate-700">{p.label}</span>
                              </div>
                              <span className="font-black text-rose-600 text-xs">Rp{p.nominal.toLocaleString('id-ID')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Tunggakan Bulanan */}
                      {tunggakanBulanan.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Icon name="calendar-range" size={11} className="text-sky-500" />
                            Tagihan Bulanan
                          </p>
                          {tunggakanBulanan.map(({ month, items }) => (
                            <div key={month} className="rounded-xl border border-amber-100 bg-amber-50 overflow-hidden">
                              <div className="px-4 py-1.5 bg-amber-100/60 border-b border-amber-100">
                                <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">{month}</span>
                              </div>
                              {items.map(s => (
                                <div key={s.label} className="flex items-center justify-between px-4 py-2 border-b border-amber-100/50 last:border-0">
                                  <div className="flex items-center gap-2">
                                    <Icon name="minus-circle" size={13} className="text-amber-500" />
                                    <span className="text-xs font-semibold text-slate-700">{s.label}</span>
                                  </div>
                                  <span className="font-bold text-amber-700 text-xs">Rp{s.nominal.toLocaleString('id-ID')}</span>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Total Gabungan */}
                      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 rounded-xl">
                        <span className="text-xs font-black text-white uppercase tracking-wider">💰 Total Tunggakan</span>
                        <span className="font-black text-white text-sm">
                          Rp{[
                            ...tunggakanTahunan.map(p => p.nominal),
                            ...tunggakanBulanan.flatMap(b => b.items.map(s => s.nominal))
                          ].reduce((a, b) => a + b, 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Preview Pesan */}
                <div className="space-y-2">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Preview Pesan WhatsApp</p>
                  <div className="bg-[#e9fbe9] border border-green-200 rounded-2xl p-4">
                    <pre className="text-xs text-slate-700 font-sans whitespace-pre-wrap leading-relaxed">{message}</pre>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setWaModal(null)}
                  className="flex-1 py-3 border border-slate-200 text-slate-500 text-xs font-black uppercase rounded-xl hover:bg-slate-100 transition-all"
                >
                  Batal
                </button>
                <a
                  href={`https://wa.me/${phone}?text=${encodeURIComponent(message)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setWaModal(null)}
                  className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white text-xs font-black uppercase rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
                >
                  <Icon name="send" size={14} />
                  Buka WhatsApp
                </a>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};


// ─────────────────────────────────────────────
// Sub-page: Rekap Pembayaran Bulanan
// ─────────────────────────────────────────────
const RekapBulanan = ({ santriList, allBulananData, dataLoading, setAlert, globalActiveYear }) => {
  const [selectedYear, setSelectedYear] = useState(globalActiveYear || 2026);
  const [selectedMonth, setSelectedMonth] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [detailMonth, setDetailMonth] = useState(null); // for per-month detail modal
  const [laporanMonth, setLaporanMonth] = useState(''); // for laporan belum bayar
  const [laporanStatusFilter, setLaporanStatusFilter] = useState('belum'); // 'belum' | 'sebagian' | 'semua'
  const [activeView, setActiveView] = useState('rekap'); // 'rekap' | 'laporan'

  useEffect(() => {
    if (globalActiveYear) setSelectedYear(globalActiveYear);
  }, [globalActiveYear]);

  const selectedYearStr = String(selectedYear);

  // Filter bulanan by year
  const filteredBulanan = useMemo(() =>
    allBulananData.filter(e => selectedYearStr === 'Semua' || String(e.academicYear) === selectedYearStr),
    [allBulananData, selectedYearStr]);

  // Active months that have entries in the selected year
  const activeMonths = useMemo(() => {
    const months = new Set();
    filteredBulanan.forEach(e => { if (e.hijriMonth) months.add(e.hijriMonth); });
    return ISLAMIC_MONTHS.filter(m => months.has(m));
  }, [filteredBulanan]);

  // Months to display (filtered by selectedMonth)
  const monthsToShow = useMemo(() => {
    if (selectedMonth === 'Semua') return activeMonths;
    return activeMonths.filter(m => m === selectedMonth);
  }, [activeMonths, selectedMonth]);

  // Active non-alumni students
  const activeStudents = useMemo(() =>
    santriList.filter(s => {
      const status = String(s.status || '').trim().toLowerCase();
      return status !== 'alumni' && status !== 'ditolak';
    }), [santriList]);

  // Per-month aggregate stats
  const monthlyStats = useMemo(() => {
    const result = {};
    monthsToShow.forEach(m => { result[m] = { totalTarget: 0, totalPaid: 0, totalUnpaid: 0, percentage: 0, countLunas: 0, countSebagian: 0, countMenunggak: 0, studentCount: 0 }; });

    monthsToShow.forEach(month => {
      const entriesForMonth = filteredBulanan.filter(e => e.hijriMonth === month);
      const studentIds = new Set(entriesForMonth.map(e => e.studentId));
      const activeCount = activeStudents.length;
      result[month].studentCount = activeCount;

      let totalPaid = 0;
      activeStudents.forEach(student => {
        const entry = entriesForMonth.find(e => e.studentId === student.id);
        const paid = entry ? (entry.makan ? 275000 : 0) + (entry.laundry ? 120000 : 0) + (entry.ziaroh ? 25000 : 0) : 0;
        totalPaid += paid;
        if (paid === TOTAL_BIAYA_BULANAN) result[month].countLunas++;
        else if (paid > 0) result[month].countSebagian++;
        else result[month].countMenunggak++;
      });

      const totalTarget = activeCount * TOTAL_BIAYA_BULANAN;
      const totalUnpaid = Math.max(totalTarget - totalPaid, 0);
      const percentage = totalTarget > 0 ? Math.round((totalPaid / totalTarget) * 100) : 0;
      result[month] = { ...result[month], totalTarget, totalPaid, totalUnpaid, percentage };
    });

    return result;
  }, [filteredBulanan, monthsToShow, activeStudents]);

  // Grand totals across all shown months
  const grandTotals = useMemo(() => {
    let totalTarget = 0, totalPaid = 0, totalUnpaid = 0, countLunas = 0, countSebagian = 0, countMenunggak = 0;
    monthsToShow.forEach(m => {
      const s = monthlyStats[m];
      if (!s) return;
      totalTarget += s.totalTarget;
      totalPaid += s.totalPaid;
      totalUnpaid += s.totalUnpaid;
      countLunas += s.countLunas;
      countSebagian += s.countSebagian;
      countMenunggak += s.countMenunggak;
    });
    const percentRealisasi = totalTarget > 0 ? Math.round((totalPaid / totalTarget) * 100) : 0;
    return { totalTarget, totalPaid, totalUnpaid, countLunas, countSebagian, countMenunggak, percentRealisasi };
  }, [monthsToShow, monthlyStats]);

  // Per-student recap for selected months (for table view)
  const studentMonthRecaps = useMemo(() => {
    return activeStudents.map(student => {
      let totalPaid = 0, totalTarget = 0;
      const monthBreakdown = {};
      monthsToShow.forEach(month => {
        const entry = filteredBulanan.find(e => e.studentId === student.id && e.hijriMonth === month);
        const paid = entry ? (entry.makan ? 275000 : 0) + (entry.laundry ? 120000 : 0) + (entry.ziaroh ? 25000 : 0) : 0;
        totalPaid += paid;
        totalTarget += TOTAL_BIAYA_BULANAN;
        monthBreakdown[month] = { paid, entry };
      });
      const totalUnpaid = Math.max(totalTarget - totalPaid, 0);
      let status = 'Menunggak';
      if (totalUnpaid === 0 && totalTarget > 0) status = 'Lunas';
      else if (totalPaid > 0) status = 'Sebagian';
      return { student, id: student.id, name: student.namaLengkap, totalPaid, totalTarget, totalUnpaid, status, monthBreakdown };
    });
  }, [activeStudents, filteredBulanan, monthsToShow]);

  // Filtered student list by search & status
  const filteredStudentRecaps = useMemo(() =>
    studentMonthRecaps.filter(item => {
      const s = item.student || {};
      const q = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === '' ||
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        String(s.namaWali || '').toLowerCase().includes(q) ||
        String(s.namaAyah || '').toLowerCase().includes(q) ||
        String(s.namaIbu || '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'Semua' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    }), [studentMonthRecaps, searchQuery, statusFilter]);

  // Laporan: daftar santri yang belum lunas untuk bulan tertentu
  const laporanBelumBayar = useMemo(() => {
    if (!laporanMonth) return [];
    const entriesForMonth = filteredBulanan.filter(e => e.hijriMonth === laporanMonth);
    return activeStudents.map(student => {
      const entry = entriesForMonth.find(e => e.studentId === student.id);
      const isMakan = entry ? !!entry.makan : false;
      const isLaundry = entry ? !!entry.laundry : false;
      const isZiaroh = entry ? !!entry.ziaroh : false;
      const paid = (isMakan ? 275000 : 0) + (isLaundry ? 120000 : 0) + (isZiaroh ? 25000 : 0);
      const unpaid = Math.max(TOTAL_BIAYA_BULANAN - paid, 0);
      const isLunas = paid === TOTAL_BIAYA_BULANAN;
      const isSebagian = paid > 0 && !isLunas;
      const statusLabel = isLunas ? 'Lunas' : isSebagian ? 'Sebagian' : 'Belum Bayar';
      return { student, id: student.id, name: student.namaLengkap, paid, unpaid, isLunas, isSebagian, isMakan, isLaundry, isZiaroh, statusLabel };
    }).filter(item => {
      if (laporanStatusFilter === 'belum') return !item.isLunas;
      if (laporanStatusFilter === 'sebagian') return item.isSebagian;
      return true; // semua
    });
  }, [laporanMonth, filteredBulanan, activeStudents, laporanStatusFilter]);

  const laporanStats = useMemo(() => {
    if (!laporanMonth) return null;
    const all = activeStudents.map(student => {
      const entry = filteredBulanan.find(e => e.studentId === student.id && e.hijriMonth === laporanMonth);
      const isMakan = entry ? !!entry.makan : false;
      const isLaundry = entry ? !!entry.laundry : false;
      const isZiaroh = entry ? !!entry.ziaroh : false;
      const paid = (isMakan ? 275000 : 0) + (isLaundry ? 120000 : 0) + (isZiaroh ? 25000 : 0);
      return { paid, isLunas: paid === TOTAL_BIAYA_BULANAN, isSebagian: paid > 0 && paid < TOTAL_BIAYA_BULANAN };
    });
    const countLunas = all.filter(x => x.isLunas).length;
    const countSebagian = all.filter(x => x.isSebagian).length;
    const countBelum = all.filter(x => x.paid === 0).length;
    const totalPaid = all.reduce((s, x) => s + x.paid, 0);
    const totalTarget = activeStudents.length * TOTAL_BIAYA_BULANAN;
    const totalUnpaid = Math.max(totalTarget - totalPaid, 0);
    const pctLunas = activeStudents.length > 0 ? Math.round((countLunas / activeStudents.length) * 100) : 0;
    return { countLunas, countSebagian, countBelum, totalPaid, totalTarget, totalUnpaid, pctLunas };
  }, [laporanMonth, filteredBulanan, activeStudents]);

  const handleExportCSV = () => {
    if (monthsToShow.length === 0) { setAlert({ type: 'error', text: 'Tidak ada data bulan aktif untuk diekspor.' }); return; }
    const headers = ['No', 'Bulan Hijriyah', 'Total Tagihan', 'Total Terbayar', 'Sisa Piutang', '% Kepatuhan', 'Lunas', 'Sebagian', 'Menunggak'];
    const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const csvRows = [headers.map(escapeCsv).join(',')];
    monthsToShow.forEach((month, idx) => {
      const s = monthlyStats[month];
      csvRows.push([idx + 1, month, s.totalTarget, s.totalPaid, s.totalUnpaid, `${s.percentage}%`, s.countLunas, s.countSebagian, s.countMenunggak].map(escapeCsv).join(','));
    });
    const blob = new Blob(['\ufeff' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', ''); a.setAttribute('href', url);
    a.setAttribute('download', `Rekap_Bulanan_PPNJ_${selectedYear}_${new Date().getTime()}.csv`);
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setAlert({ type: 'success', text: 'Rekap Bulanan CSV berhasil diunduh.' });
  };

  const handleExportLaporanCSV = () => {
    if (!laporanMonth) { setAlert({ type: 'error', text: 'Pilih bulan terlebih dahulu.' }); return; }
    if (laporanBelumBayar.length === 0) { setAlert({ type: 'error', text: 'Tidak ada data untuk diekspor.' }); return; }
    const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const headers = ['No', 'ID Santri', 'Nama Lengkap', 'Nama Wali', 'No. HP', 'Makan', 'Laundry', 'Ziaroh', 'Total Terbayar', 'Sisa Tunggakan', 'Status'];
    const csvRows = [headers.map(escapeCsv).join(',')];
    laporanBelumBayar.forEach((item, idx) => {
      const s = item.student || {};
      csvRows.push([
        idx + 1, item.id, item.name,
        s.namaWali || '-', s.noHp || '-',
        item.isMakan ? 'Lunas' : 'Belum',
        item.isLaundry ? 'Lunas' : 'Belum',
        item.isZiaroh ? 'Lunas' : 'Belum',
        item.paid, item.unpaid, item.statusLabel
      ].map(escapeCsv).join(','));
    });
    const blob = new Blob(['\ufeff' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', ''); a.setAttribute('href', url);
    a.setAttribute('download', `Laporan_Tunggakan_${laporanMonth}_${selectedYear}_${new Date().getTime()}.csv`);
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setAlert({ type: 'success', text: `Laporan tunggakan bulan ${laporanMonth} berhasil diunduh.` });
  };

  const statusBadgeClass = (status) =>
    status === 'Lunas' ? 'bg-green-50 border-green-200 text-green-700' :
    status === 'Sebagian' ? 'bg-amber-50 border-amber-200 text-amber-700' :
    'bg-rose-50 border-rose-200 text-rose-600';

  const percentColor = (p) => p >= 80 ? 'bg-emerald-500' : p >= 50 ? 'bg-amber-400' : 'bg-rose-400';

  return (
    <div className="w-full space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-800">Rekap Pembayaran Bulanan</h3>
          <p className="text-slate-500 font-medium mt-1 text-sm">Rekapitulasi pembayaran syahriyah (Makan, Laundry, Ziaroh) per bulan Hijriyah.</p>
        </div>
        {/* Year & Month Filter */}
        <div className="flex items-center bg-white border border-slate-200 shadow-sm p-1.5 rounded-2xl h-fit gap-1 flex-wrap">
          <div className="flex items-center pl-3 pr-1 text-slate-400">
            <Icon name="calendar" size={16} />
          </div>
          <select
            value={selectedYear}
            onChange={(e) => { setSelectedYear(e.target.value === 'Semua' ? 'Semua' : parseInt(e.target.value)); setSelectedMonth('Semua'); }}
            className="bg-transparent text-sm font-bold text-[#083316] outline-none cursor-pointer pr-3 py-1.5 appearance-none"
          >
            <option value="Semua">Semua Tahun</option>
            {TAHUN_AJARAN_LIST.map(ta => (
              <option key={ta.masehi} value={ta.masehi}>TA {ta.hijriah} H / {ta.masehi} M</option>
            ))}
          </select>
          <div className="w-px h-5 bg-slate-200 mx-1"></div>
          <div className="flex items-center pr-1 text-slate-400">
            <Icon name="filter" size={14} />
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent text-sm font-bold text-[#083316] outline-none cursor-pointer pr-3 py-1.5 appearance-none"
          >
            <option value="Semua">Semua Bulan</option>
            {activeMonths.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      {dataLoading ? (
        <div className="h-32 flex items-center justify-center gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="animate-spin w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full" />
          <span className="text-sm text-slate-400 font-bold">Memuat data...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {/* Card 1: Total Terbayar */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10 space-y-3">
              <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
                <Icon name="wallet" size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Terbayar</p>
                <h4 className="font-black text-slate-800 text-lg leading-none tracking-tight tabular-nums">{formatRupiah(grandTotals.totalPaid)}</h4>
              </div>
              <p className="text-[10px] text-sky-600 font-bold">Bulan Aktif: {monthsToShow.length}</p>
            </div>
          </div>

          {/* Card 2: Total Piutang */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10 space-y-3">
              <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
                <Icon name="arrow-up-right" size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Piutang</p>
                <h4 className="font-black text-slate-800 text-lg leading-none tracking-tight tabular-nums">{formatRupiah(grandTotals.totalUnpaid)}</h4>
              </div>
              <p className="text-[10px] text-rose-500 font-bold">Menunggak: {grandTotals.countMenunggak} entri</p>
            </div>
          </div>

          {/* Card 3: Status Breakdown */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10 space-y-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Icon name="users" size={20} />
              </div>
              <div className="grid grid-cols-3 gap-1">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Lunas</p>
                  <p className="font-extrabold text-emerald-600 text-sm tabular-nums">{grandTotals.countLunas}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Sebagian</p>
                  <p className="font-extrabold text-amber-500 text-sm tabular-nums">{grandTotals.countSebagian}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Nol</p>
                  <p className="font-extrabold text-rose-500 text-sm tabular-nums">{grandTotals.countMenunggak}</p>
                </div>
              </div>
              <p className="text-[10px] text-emerald-600 font-bold">Total santri aktif: {activeStudents.length}</p>
            </div>
          </div>

          {/* Card 4: Realisasi */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#083316]/5 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10 space-y-3">
              <div className="w-10 h-10 bg-emerald-50 text-[#083316] rounded-xl flex items-center justify-center">
                <Icon name="percent" size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Realisasi Pembayaran</p>
                <h4 className="font-black text-slate-800 text-lg leading-none tracking-tight tabular-nums">{grandTotals.percentRealisasi}%</h4>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className={`h-1.5 rounded-full transition-all duration-500 ${percentColor(grandTotals.percentRealisasi)}`} style={{ width: `${grandTotals.percentRealisasi}%` }}></div>
              </div>
            </div>
          </div>

          {/* Card 5: Laporan Santri Belum Bayar */}
          <button
            onClick={() => setActiveView(activeView === 'laporan' ? 'rekap' : 'laporan')}
            className={`rounded-3xl p-5 shadow-sm relative overflow-hidden group text-left transition-all border ${
              activeView === 'laporan'
                ? 'bg-rose-600 border-rose-600 text-white'
                : 'bg-white border-slate-100 hover:border-rose-200 hover:shadow-md'
            }`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110 ${
              activeView === 'laporan' ? 'bg-rose-500' : 'bg-rose-50'
            }`} />
            <div className="relative z-10 space-y-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                activeView === 'laporan' ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-500'
              }`}>
                <Icon name="file-warning" size={20} />
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${
                  activeView === 'laporan' ? 'text-rose-200' : 'text-slate-400'
                }`}>Laporan Tunggakan</p>
                <h4 className={`font-black text-sm leading-tight ${
                  activeView === 'laporan' ? 'text-white' : 'text-slate-800'
                }`}>Santri Belum Bayar</h4>
              </div>
              <p className={`text-[10px] font-bold ${
                activeView === 'laporan' ? 'text-rose-200' : 'text-rose-500'
              }`}>{activeView === 'laporan' ? '← Klik untuk tutup' : 'Klik untuk buka →'}</p>
            </div>
          </button>
        </div>
      )}

      {/* Filter & Table Panel - only shown when activeView === 'rekap' */}
      {activeView === 'rekap' && (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="table" size={16} className="text-slate-400" />
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Rekap Per Santri</h4>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              {/* Search */}
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-sky-500 focus-within:bg-white focus-within:border-sky-500 transition-all w-full lg:max-w-md shadow-inner relative group">
                <Icon name="search" size={16} className="text-slate-400 group-focus-within:text-sky-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Cari nama, ID, wali, ortu..."
                  className="bg-transparent border-none outline-none text-xs font-bold w-full text-slate-700 placeholder-slate-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <Icon name="x" size={14} />
                  </button>
                )}
              </div>
              {/* Status Dropdown */}
              <div className="flex items-center bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl shadow-inner focus-within:border-sky-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-500 transition-all">
                <div className="flex items-center text-slate-400 mr-2"><Icon name="filter" size={14} /></div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer pr-3 py-0.5 appearance-none">
                  <option value="Semua">Semua Status</option>
                  <option value="Lunas">Sudah Lunas</option>
                  <option value="Sebagian">Belum Lunas (Ada Cicilan)</option>
                  <option value="Menunggak">Belum Bayar Sama Sekali</option>
                </select>
              </div>
            </div>
            {/* Export */}
            <button onClick={handleExportCSV} className="flex items-center justify-center gap-2 bg-sky-50 text-sky-700 border border-sky-100 hover:bg-sky-600 hover:text-white px-5 py-2.5 rounded-2xl font-bold transition-all text-xs active:scale-[0.98] shadow-sm w-full lg:w-auto">
              <Icon name="download" size={14} />
              <span>Ekspor Rekap (CSV)</span>
            </button>
          </div>

          {/* No months active state */}
          {!dataLoading && monthsToShow.length === 0 && (
            <div className="py-16 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Icon name="calendar-x" size={32} className="opacity-30 mx-auto mb-2" />
              <p className="font-semibold text-sm">Tidak ada bulan aktif untuk tahun ajaran yang dipilih.</p>
              <p className="text-xs mt-1">Pastikan data bulanan sudah diimport terlebih dahulu.</p>
            </div>
          )}

          {/* Mobile Cards */}
          {monthsToShow.length > 0 && (
            <div className="block md:hidden space-y-4">
              {dataLoading ? (
                <div className="py-16 text-center text-slate-400">
                  <Icon name="loader-2" size={24} className="animate-spin mx-auto text-sky-600 mb-2" />
                  Memuat tabel rekap...
                </div>
              ) : filteredStudentRecaps.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-semibold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Icon name="inbox" size={32} className="opacity-40 mx-auto mb-2" />
                  Tidak ada data rekap bulanan ditemukan.
                </div>
              ) : filteredStudentRecaps.map(item => {
                const student = item.student || {};
                const parentInfo = [];
                if (student.namaWali && student.namaWali !== '-') parentInfo.push(`Wali: ${student.namaWali}`);
                if (student.namaAyah && student.namaAyah !== '-') parentInfo.push(`Ayah: ${student.namaAyah}`);
                if (student.namaIbu && student.namaIbu !== '-') parentInfo.push(`Ibu: ${student.namaIbu}`);
                return (
                  <div key={item.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-black text-slate-800 text-sm">{item.name}</p>
                        <p className="font-mono text-[9px] text-slate-400 mt-0.5">{item.id}</p>
                        {parentInfo.length > 0 && <p className="text-[10px] text-slate-500 font-semibold mt-1">{parentInfo.join(' | ')}</p>}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-block border shadow-sm ${statusBadgeClass(item.status)}`}>{item.status}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100/50">
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Total Terbayar</p>
                        <p className="text-xs font-bold text-emerald-600">{formatRupiah(item.totalPaid)}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Sisa Piutang</p>
                        <p className={`text-xs font-bold ${item.totalUnpaid > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          {item.totalUnpaid > 0 ? formatRupiah(item.totalUnpaid) : 'Lunas'}
                        </p>
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-400 font-semibold">Target: {formatRupiah(item.totalTarget)} ({monthsToShow.length} bulan)</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Desktop Table */}
          {monthsToShow.length > 0 && (
            <div className="hidden md:block overflow-x-auto custom-scroll w-full pb-4">
              <table className="compact-table w-full text-left text-sm min-w-full border-collapse">
                <thead className="bg-slate-50/50 text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-4 text-center w-12">No</th>
                    <th className="px-6 py-4">Nama Santri</th>
                    {monthsToShow.map(m => (
                      <th key={m} className="px-4 py-4 text-center min-w-[90px]">{m}</th>
                    ))}
                    <th className="px-5 py-4 text-right">Total Terbayar</th>
                    <th className="px-5 py-4 text-right">Sisa Piutang</th>
                    <th className="px-5 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dataLoading ? (
                    <tr><td colSpan={5 + monthsToShow.length} className="px-6 py-16 text-center text-slate-400">
                      <Icon name="loader-2" size={24} className="animate-spin mx-auto text-sky-600 mb-2" />
                      Memuat tabel rekap...
                    </td></tr>
                  ) : filteredStudentRecaps.length === 0 ? (
                    <tr><td colSpan={5 + monthsToShow.length} className="px-6 py-12 text-center text-slate-400 font-semibold">
                      <Icon name="inbox" size={32} className="opacity-40 mx-auto mb-2" />
                      Tidak ada data rekap bulanan ditemukan.
                    </td></tr>
                  ) : filteredStudentRecaps.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 text-center text-slate-400 font-bold">{index + 1}</td>
                      <td className="px-6 py-3.5">
                        <p className="font-black text-slate-800 leading-tight">{item.name}</p>
                        <p className="font-mono text-[9px] text-slate-400 mt-0.5">{item.id}</p>
                      </td>
                      {monthsToShow.map(month => {
                        const bd = item.monthBreakdown[month];
                        const paid = bd ? bd.paid : 0;
                        const isLunas = paid === TOTAL_BIAYA_BULANAN;
                        const isSebagian = paid > 0 && !isLunas;
                        return (
                          <td key={month} className="px-4 py-3.5 text-center">
                            <div className={`inline-flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-[9px] font-black border
                              ${isLunas ? 'bg-green-50 border-green-200 text-green-700' :
                                isSebagian ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                'bg-slate-50 border-slate-200 text-slate-400'}`}>
                              <span>{isLunas ? '✓ Lunas' : isSebagian ? formatShortRupiah(paid) : '—'}</span>
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-5 py-3.5 text-right">
                        <span className="font-extrabold text-emerald-600 tabular-nums">{formatRupiah(item.totalPaid)}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`font-extrabold tabular-nums ${item.totalUnpaid > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          {item.totalUnpaid > 0 ? formatRupiah(item.totalUnpaid) : 'Lunas'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-block border shadow-sm ${statusBadgeClass(item.status)}`}>{item.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Laporan Panel - only shown when activeView === 'laporan' */}
      {activeView === 'laporan' && (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm space-y-5 animate-in">
          {/* Panel Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Icon name="file-warning" size={20} />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-800 leading-tight">Laporan Santri Belum Bayar</h4>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Daftar santri yang belum melunasi syahriyah per bulan Hijriyah.</p>
              </div>
            </div>
            {laporanMonth && laporanBelumBayar.length > 0 && (
              <button
                onClick={handleExportLaporanCSV}
                className="flex items-center justify-center gap-2 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white px-5 py-2.5 rounded-2xl font-bold transition-all text-xs active:scale-[0.98] shadow-sm flex-shrink-0"
              >
                <Icon name="download" size={14} />
                <span>Ekspor CSV</span>
              </button>
            )}
          </div>

          {/* Filter Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl shadow-inner focus-within:border-rose-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-rose-300 transition-all flex-1 sm:max-w-xs gap-2">
              <Icon name="calendar" size={15} className="text-slate-400 flex-shrink-0" />
              <select
                value={laporanMonth}
                onChange={(e) => setLaporanMonth(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer pr-2 py-0.5 appearance-none w-full"
              >
                <option value="">— Pilih Bulan Hijriyah —</option>
                {activeMonths.length > 0
                  ? activeMonths.map(m => <option key={m} value={m}>{m}</option>)
                  : ISLAMIC_MONTHS.map(m => <option key={m} value={m}>{m}</option>)
                }
              </select>
            </div>
            <div className="flex items-center bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl shadow-inner focus-within:border-rose-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-rose-300 transition-all gap-2">
              <Icon name="filter" size={14} className="text-slate-400 flex-shrink-0" />
              <select
                value={laporanStatusFilter}
                onChange={(e) => setLaporanStatusFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer pr-3 py-0.5 appearance-none"
              >
                <option value="belum">Belum Lunas (Semua)</option>
                <option value="sebagian">Bayar Sebagian</option>
                <option value="semua">Tampilkan Semua Santri</option>
              </select>
            </div>
          </div>

          {/* Empty state - no month selected */}
          {!laporanMonth && (
            <div className="py-14 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Icon name="calendar-search" size={28} className="text-rose-300" />
              </div>
              <p className="font-bold text-slate-500 text-sm">Pilih bulan di atas</p>
              <p className="text-xs text-slate-400 mt-1">Daftar santri yang belum melunasi syahriyah akan ditampilkan di sini.</p>
            </div>
          )}

          {/* Content when month is selected */}
          {laporanMonth && laporanStats && (
            <div className="space-y-5">
              {/* Progress Bar */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tingkat Pelunasan — {laporanMonth}</span>
                  <span className={`text-sm font-black tabular-nums ${
                    laporanStats.pctLunas >= 80 ? 'text-emerald-600' : laporanStats.pctLunas >= 50 ? 'text-amber-500' : 'text-rose-500'
                  }`}>{laporanStats.pctLunas}%</span>
                </div>
                <div className="w-full bg-white border border-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                  <div
                    className={`h-3 rounded-full transition-all duration-700 ${
                      laporanStats.pctLunas >= 80 ? 'bg-emerald-500' : laporanStats.pctLunas >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                    }`}
                    style={{ width: `${laporanStats.pctLunas}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-semibold text-slate-400">
                  <span>0%</span>
                  <span>Terbayar: {formatShortRupiah(laporanStats.totalPaid)} · Piutang: {formatShortRupiah(laporanStats.totalUnpaid)}</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Label count */}
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {laporanStatusFilter === 'semua' ? 'Semua Santri' : laporanStatusFilter === 'sebagian' ? 'Santri Bayar Sebagian' : 'Santri Belum Lunas'}
                </p>
                <span className="bg-rose-100 text-rose-600 text-[9px] font-black px-2 py-0.5 rounded-full">{laporanBelumBayar.length} santri</span>
              </div>

              {/* All lunas */}
              {laporanBelumBayar.length === 0 ? (
                <div className="py-12 text-center bg-emerald-50 rounded-2xl border border-dashed border-emerald-200">
                  <Icon name="check-circle-2" size={32} className="mx-auto text-emerald-400 mb-2" />
                  <p className="font-bold text-emerald-600 text-sm">Semua santri sudah lunas!</p>
                  <p className="text-xs text-emerald-500 mt-1">Tidak ada tunggakan syahriyah untuk bulan {laporanMonth}.</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto custom-scroll w-full">
                    <table className="compact-table w-full text-left text-sm min-w-full border-collapse">
                      <thead className="bg-rose-50/60 text-rose-500 uppercase text-[10px] font-black tracking-widest border-b border-rose-100">
                        <tr>
                          <th className="px-4 py-3.5 text-center w-10">No</th>
                          <th className="px-5 py-3.5">Nama Santri</th>
                          <th className="px-4 py-3.5 text-center">Makan</th>
                          <th className="px-4 py-3.5 text-center">Laundry</th>
                          <th className="px-4 py-3.5 text-center">Ziaroh</th>
                          <th className="px-4 py-3.5 text-right">Terbayar</th>
                          <th className="px-4 py-3.5 text-right">Tunggakan</th>
                          <th className="px-4 py-3.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {laporanBelumBayar.map((item, idx) => {
                          const rowBg = item.isLunas ? 'bg-green-50/20' : item.isSebagian ? 'bg-amber-50/30' : 'bg-rose-50/20';
                          return (
                            <tr key={item.id} className={`${rowBg} hover:brightness-95 transition-colors`}>
                              <td className="px-4 py-3 text-center text-slate-400 font-bold text-xs">{idx + 1}</td>
                              <td className="px-5 py-3">
                                <p className="font-black text-slate-800 text-xs leading-tight">{item.name}</p>
                                <p className="font-mono text-[9px] text-slate-400 mt-0.5">{item.id}</p>
                              </td>
                              {[item.isMakan, item.isLaundry, item.isZiaroh].map((paid, i) => (
                                <td key={i} className="px-4 py-3 text-center">
                                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg border ${
                                    paid ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-rose-100 border-rose-200 text-rose-500'
                                  }`}>
                                    <Icon name={paid ? 'check' : 'x'} size={11} />
                                  </span>
                                </td>
                              ))}
                              <td className="px-4 py-3 text-right">
                                <span className="font-bold text-slate-700 text-xs tabular-nums">{formatRupiah(item.paid)}</span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className={`font-black text-xs tabular-nums ${item.unpaid > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                  {item.unpaid > 0 ? formatRupiah(item.unpaid) : '—'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest inline-block border ${
                                  item.isLunas ? 'bg-green-50 border-green-200 text-green-700' :
                                  item.isSebagian ? 'bg-amber-50 border-amber-200 text-amber-600' :
                                  'bg-rose-50 border-rose-200 text-rose-600'
                                }`}>{item.statusLabel}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      {(() => {
                        const totalPd = laporanBelumBayar.reduce((s, x) => s + x.paid, 0);
                        const totalUpd = laporanBelumBayar.reduce((s, x) => s + x.unpaid, 0);
                        return (
                          <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                            <tr>
                              <td colSpan={5} className="px-4 py-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                Total ({laporanBelumBayar.length} santri)
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="font-black text-emerald-600 text-xs tabular-nums">{formatRupiah(totalPd)}</span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="font-black text-rose-600 text-xs tabular-nums">{formatRupiah(totalUpd)}</span>
                              </td>
                              <td />
                            </tr>
                          </tfoot>
                        );
                      })()}
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="block md:hidden space-y-3">
                    {laporanBelumBayar.map((item) => (
                      <div key={item.id} className={`rounded-2xl border p-4 space-y-3 shadow-sm ${
                        item.isLunas ? 'bg-green-50/30 border-green-100' :
                        item.isSebagian ? 'bg-amber-50/30 border-amber-100' :
                        'bg-rose-50/20 border-rose-100'
                      }`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-black text-slate-800 text-sm leading-tight">{item.name}</p>
                            <p className="font-mono text-[9px] text-slate-400 mt-0.5">{item.id}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest inline-block border flex-shrink-0 mt-0.5 ${
                            item.isLunas ? 'bg-green-50 border-green-200 text-green-700' :
                            item.isSebagian ? 'bg-amber-50 border-amber-200 text-amber-600' :
                            'bg-rose-50 border-rose-200 text-rose-600'
                          }`}>{item.statusLabel}</span>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          {[
                            { label: 'Makan', paid: item.isMakan },
                            { label: 'Laundry', paid: item.isLaundry },
                            { label: 'Ziaroh', paid: item.isZiaroh },
                          ].map(b => (
                            <div key={b.label} className={`flex-1 p-1.5 rounded-xl border text-center ${
                              b.paid ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-100'
                            }`}>
                              <p className={`text-[9px] font-black leading-none ${b.paid ? 'text-emerald-600' : 'text-rose-500'}`}>{b.label}</p>
                              <Icon name={b.paid ? 'check' : 'x'} size={12} className={`mx-auto mt-1 ${b.paid ? 'text-emerald-500' : 'text-rose-400'}`} />
                            </div>
                          ))}
                          <div className="flex-1 text-right">
                            <p className="text-[9px] text-slate-400 font-bold">Tunggakan</p>
                            <p className={`text-xs font-black tabular-nums ${item.unpaid > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {item.unpaid > 0 ? formatShortRupiah(item.unpaid) : '—'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Per-Month Detail Modal */}
      {detailMonth && monthlyStats[detailMonth] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Icon name="calendar-range" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 leading-tight">Bulan {detailMonth}</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">Rincian pembayaran syahriyah per santri</p>
                </div>
              </div>
              <button onClick={() => setDetailMonth(null)} className="p-2.5 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
                <Icon name="x" size={18} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scroll flex-1 space-y-4">
              {/* Month Summary */}
              {(() => {
                const s = monthlyStats[detailMonth];
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Total Tagihan', value: formatShortRupiah(s.totalTarget), color: 'text-slate-800' },
                      { label: 'Total Terbayar', value: formatShortRupiah(s.totalPaid), color: 'text-emerald-600' },
                      { label: 'Sisa Piutang', value: formatShortRupiah(s.totalUnpaid), color: s.totalUnpaid > 0 ? 'text-rose-600' : 'text-slate-400' },
                      { label: 'Realisasi', value: `${s.percentage}%`, color: s.percentage >= 80 ? 'text-emerald-600' : s.percentage >= 50 ? 'text-amber-500' : 'text-rose-500' },
                    ].map(c => (
                      <div key={c.label} className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mb-1">{c.label}</p>
                        <p className={`text-sm font-black ${c.color}`}>{c.value}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Per-student detail for this month */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail Per Santri</h4>
                {activeStudents.map(student => {
                  const entry = filteredBulanan.find(e => e.studentId === student.id && e.hijriMonth === detailMonth);
                  const isMakan = entry ? !!entry.makan : false;
                  const isLaundry = entry ? !!entry.laundry : false;
                  const isZiaroh = entry ? !!entry.ziaroh : false;
                  const subTotal = (isMakan ? 275000 : 0) + (isLaundry ? 120000 : 0) + (isZiaroh ? 25000 : 0);
                  const isLunas = subTotal === TOTAL_BIAYA_BULANAN;
                  const isSebagian = subTotal > 0 && !isLunas;
                  return (
                    <div key={student.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${isLunas ? 'bg-green-50/30 border-green-100' : isSebagian ? 'bg-amber-50/30 border-amber-100' : 'bg-white border-slate-100'}`}>
                      <div>
                        <p className="font-bold text-xs text-slate-700">{student.namaLengkap}</p>
                        <p className="font-mono text-[9px] text-slate-400">{student.id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {[
                          { label: 'M', active: isMakan, title: 'Makan' },
                          { label: 'L', active: isLaundry, title: 'Laundry' },
                          { label: 'Z', active: isZiaroh, title: 'Ziaroh' },
                        ].map(b => (
                          <span key={b.label} title={b.title} className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black border ${b.active ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                            {b.label}
                          </span>
                        ))}
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${isLunas ? 'bg-green-50 border-green-200 text-green-700' : isSebagian ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                          {isLunas ? 'Lunas' : isSebagian ? formatShortRupiah(subTotal) : '—'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setDetailMonth(null)} className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold rounded-xl text-xs transition-colors">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// ─────────────────────────────────────────────
// Main Export: RekapPembayaranTab (with internal page tabs)
// ─────────────────────────────────────────────
export const RekapPembayaranTab = ({ santriList, allBulananData, dataLoading, setAlert, globalActiveYear, initialPage }) => {
  const [activePage, setActivePage] = useState(initialPage || 'tahunan'); // 'tahunan' | 'bulanan'

  // Sync when initialPage changes (e.g. from Quick Access)
  useEffect(() => {
    if (initialPage) setActivePage(initialPage);
  }, [initialPage]);

  const tabs = [
    { id: 'tahunan', label: 'Rekap Tahunan', icon: 'file-text' },
    { id: 'bulanan', label: 'Rekap Bulanan', icon: 'calendar-range' },
  ];

  return (
    <div className="strata-rekap-page w-full space-y-6 animate-in pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Rekap Data Pembayaran</h2>
          <p className="text-slate-500 font-medium mt-1">Pusat ringkasan dan rekapitulasi data transaksi santri.</p>
        </div>
        {/* Internal Sub-Tabs */}
        <div className="flex items-center bg-white border border-slate-200 shadow-sm p-1.5 rounded-2xl h-fit gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActivePage(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activePage === tab.id
                  ? 'bg-[#083316] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon name={tab.icon} size={14} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sub-page Content */}
      {activePage === 'tahunan' ? (
        <RekapTahunan
          santriList={santriList}
          allBulananData={allBulananData}
          dataLoading={dataLoading}
          setAlert={setAlert}
          globalActiveYear={globalActiveYear}
        />
      ) : (
        <RekapBulanan
          santriList={santriList}
          allBulananData={allBulananData}
          dataLoading={dataLoading}
          setAlert={setAlert}
          globalActiveYear={globalActiveYear}
        />
      )}
    </div>
  );
};
