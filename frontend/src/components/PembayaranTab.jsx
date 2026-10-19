import React, { useState } from 'react';
import { Icon } from './Icon';
import { KeuanganPanel } from './KeuanganPanel';
import { 
  formatRupiah, 
  formatShortRupiah, 
  PAYMENT_ITEMS, 
  TOTAL_BIAYA 
} from '../utils/helpers';

const TAHUN_AJARAN_LIST = [
  { masehi: 2026, hijriah: 1447 },
  { masehi: 2027, hijriah: 1448 },
  { masehi: 2028, hijriah: 1449 },
  { masehi: 2029, hijriah: 1450 },
  { masehi: 2030, hijriah: 1451 }
];

const ISLAMIC_MONTHS = [
  "Muharram", "Safar", "Rabi'ul Awal", "Rabi'ul Akhir", 
  "Jumadil Awal", "Jumadil Akhir", "Rajab", "Sya'ban", 
  "Ramadhan", "Syawal", "Dzulqa'dah", "Dzulhijjah"
];

export const PembayaranTab = ({
  dataSantri,
  selectedTahunAjaran,
  setSelectedTahunAjaran,
  paymentViewMode,
  setPaymentViewMode,
  selectedIslamicMonth,
  setSelectedIslamicMonth,
  bulananEntries,
  bulananLoading,
  fetchBulananData,
  openBulananCreateForm,
  openBulananEditForm,
  deleteBulananItem,
  openPaymentModal,
  setReceiptData,
  dataLoading,
  fetchData,
  setAlert,
  keuanganEntries,
  keuanganLoading,
  fetchKeuanganData,
  onAddKeuanganEntry,
  onEditKeuanganEntry,
  onDeleteKeuanganEntry
}) => {
  const [paymentFilter, setPaymentFilter] = useState("Semua");
  const [searchTahunan, setSearchTahunan] = useState('');
  const [searchBulanan, setSearchBulanan] = useState('');

  const isAlumni = (status) => String(status || '').trim().toLowerCase() === 'alumni';

  const filteredKeuanganList = dataSantri.filter(santri => {
    const isCurrentYear = selectedTahunAjaran === 2026;
    const activePembayaran = isCurrentYear ? (santri.pembayaran || {}) : {};

    const paidItems = PAYMENT_ITEMS.filter(item => activePembayaran[item.key]);
    const totalDibayar = paidItems.reduce((sum, item) => sum + item.nominal, 0);
    const isLunas = totalDibayar === TOTAL_BIAYA;

    // Filter status
    const matchStatus =
      paymentFilter === 'Semua' ? true :
      paymentFilter === 'Lunas' ? isLunas :
      paymentFilter === 'Belum Lunas' ? !isLunas :
      true;

    // Filter pencarian nama / ID
    const q = searchTahunan.trim().toLowerCase();
    const matchSearch = q === '' ||
      (santri.namaLengkap || '').toLowerCase().includes(q) ||
      (santri.id || '').toLowerCase().includes(q);

    return matchStatus && matchSearch;
  });

  const mergedBulananEntries = dataSantri
    .filter(santri => {
      const q = searchBulanan.trim().toLowerCase();
      if (!q) return true;
      return (santri.namaLengkap || '').toLowerCase().includes(q) ||
             (santri.id || '').toLowerCase().includes(q);
    })
    .map((santri) => {
      const existingEntry = (bulananEntries || []).find(e => e.studentId === santri.id);
      if (existingEntry) return existingEntry;
      return {
        isVirtual: true,
        studentId: santri.id,
        studentName: santri.namaLengkap,
        academicYear: selectedTahunAjaran ? String(selectedTahunAjaran) : '',
        hijriMonth: selectedIslamicMonth || '',
        makan: false,
        laundry: false,
        ziaroh: false,
        status: 'Belum Lunas'
      };
    });


  return (
    <div className="compact-section strata-payment-page w-full space-y-6 animate-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
             <h2 className="text-2xl font-black text-slate-800">Administrasi &amp; Pembayaran</h2>
          </div>
          <p className="text-slate-500 font-medium mt-1">Kelola dan pantau seluruh transaksi pembayaran administrasi santri secara terpadu.</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 px-5 py-3 rounded-[1.25rem] flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow cursor-default group">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-inner transform -rotate-3 group-hover:rotate-0 transition-transform duration-300">
              <Icon name="target" size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Biaya Tahunan</p>
              <p className="font-black text-slate-800 text-xl leading-none">{formatRupiah(TOTAL_BIAYA)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Angsuran & Transfer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-[2rem] p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-700"></div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm border border-emerald-100/50">
                  <Icon name="credit-card" size={20} />
                </div>
                <h4 className="font-black text-slate-800 text-lg">Skema Angsuran</h4>
              </div>
              <p className="text-sm font-medium text-slate-500 mb-6 max-w-lg">
                Biaya pendaftaran dapat diangsur untuk meringankan proses administrasi santri baru dengan dua tahap pembayaran:
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
              <div className="hidden sm:block absolute top-1/2 left-1/2 w-8 h-[2px] bg-slate-200 -translate-x-1/2 -translate-y-1/2 z-0"></div>
              
              <div className="bg-slate-50/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-200/60 relative z-10 hover:border-emerald-300 transition-colors">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black absolute -top-3 -left-2 shadow-sm border border-white">1</div>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5">Pembayaran Awal</p>
                <div className="flex items-end gap-2 mb-1">
                  <p className="text-xl font-black text-[#083316] leading-none">Rp 800<span className="text-sm text-slate-400">.000</span></p>
                  <p className="text-xs font-bold text-slate-400 mb-0.5">(Minimal)</p>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-2 flex items-center gap-1.5">
                  <Icon name="clock" size={12} className="text-emerald-500" /> Dibayar saat pendaftaran
                </p>
              </div>
              
              <div className="bg-slate-50/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-200/60 relative z-10 hover:border-emerald-300 transition-colors">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black absolute -top-3 -left-2 shadow-sm border border-white">2</div>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5">Pelunasan</p>
                <div className="flex items-end gap-2 mb-1">
                  <p className="text-xl font-black text-[#083316] leading-none">Rp 420<span className="text-sm text-slate-400">.000</span></p>
                  <p className="text-xs font-bold text-slate-400 mb-0.5">(Sisa Tagihan)</p>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-2 flex items-center gap-1.5">
                  <Icon name="calendar-check" size={12} className="text-emerald-500" /> Maksimal 1 bln setelahnya
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#059669] rounded-[2rem] p-7 text-white shadow-[0_8px_24px_rgba(4,120,87,0.25)] relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-8 -mb-8 blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <h4 className="font-black text-white/90 text-sm uppercase tracking-widest">Metode Transfer</h4>
              <Icon name="wifi" size={20} className="text-emerald-200/80 rotate-90" />
            </div>
            
            <div className="mb-6">
              <div className="w-10 h-8 rounded bg-gradient-to-r from-amber-200 to-yellow-400 mb-4 opacity-90 shadow-sm relative overflow-hidden">
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black/10"></div>
                <div className="absolute top-0 left-1/2 w-[1px] h-full bg-black/10"></div>
              </div>
              <p className="text-2xl font-black tracking-[0.15em] text-white drop-shadow-md font-mono">5896 0109 1555 535</p>
            </div>
            
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[9px] font-bold text-emerald-200/70 uppercase tracking-widest mb-1">Nama Pemilik Rekening</p>
                <p className="text-sm font-black tracking-widest">AINUN NIMAH</p>
              </div>
              <div className="bg-white text-blue-700 font-black rounded-lg flex items-center justify-center text-sm shadow-lg px-3 py-1.5 italic">
                BRI
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conditional Rendering of Panels */}
      {!selectedTahunAjaran ? (
        <div className="space-y-6 animate-in">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black text-slate-800 text-xl">Silakan Pilih Tahun Ajaran</h3>
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Icon name="calendar-search" size={20} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {TAHUN_AJARAN_LIST.map((ta) => (
              <button
                type="button"
                key={ta.masehi}
                onClick={() => { setSelectedTahunAjaran(ta.masehi); setPaymentViewMode(null); setSelectedIslamicMonth(null); setSearchTahunan(''); setSearchBulanan(''); }}
                className="group relative bg-white border border-slate-200 rounded-[2rem] p-6 cursor-pointer hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-900/10 hover:-translate-y-2 transition-all duration-500 flex flex-col items-center text-center overflow-hidden w-full"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rounded-bl-[2rem] -mr-2 -mt-2 group-hover:bg-emerald-50 transition-colors"></div>
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-[#083316] group-hover:text-white group-hover:rotate-12 transition-all duration-500 shadow-sm">
                  <Icon name="folder-kanban" size={28} />
                </div>
                <h4 className="font-black text-[#083316] text-2xl group-hover:scale-110 transition-transform">{ta.hijriah} H</h4>
                <div className="mt-3 px-4 py-1.5 bg-slate-100 rounded-full text-xs font-bold text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
                  Tahun {ta.masehi} M
                </div>
                
                <div className="absolute bottom-4 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                    Pilih Tahun <Icon name="chevron-right" size={10} />
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : !paymentViewMode ? (
        <div className="space-y-4 animate-in">
          <div className="flex items-center gap-3 ml-2 mb-4">
            <div className="p-2 bg-emerald-50 text-[#083316] rounded-xl border border-emerald-100 shadow-sm">
              <Icon name="calendar" size={18} />
            </div>
            <h3 className="font-black text-slate-800 text-lg">
              Pilih Mode Tagihan ({TAHUN_AJARAN_LIST.find(t => t.masehi === selectedTahunAjaran)?.hijriah} H / {selectedTahunAjaran} M)
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <button
              type="button"
              onClick={() => setPaymentViewMode('tahunan')} 
              className="group relative bg-white border border-slate-200/60 rounded-[2.5rem] p-7 cursor-pointer hover:border-emerald-400 hover:shadow-[0_8px_30px_rgba(16,185,129,0.12)] transition-all duration-500 overflow-hidden text-left block w-full hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-50 rounded-full -mr-20 -mt-20 group-hover:bg-emerald-400/10 group-hover:scale-150 transition-all duration-700 ease-out"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-emerald-400 group-hover:to-emerald-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-emerald-500/30 transition-all duration-500 mb-5 group-hover:-rotate-3">
                  <Icon name="file-text" size={28} />
                </div>
                <h4 className="text-xl font-black text-slate-800 mb-2 group-hover:text-emerald-700 transition-colors">Tagihan Tahunan</h4>
                <p className="text-sm font-medium text-slate-500 leading-relaxed mb-6 max-w-sm">Rekapitulasi pembayaran pendaftaran dan administrasi santri tahunan.</p>
                
                <div className="flex items-center gap-2 text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-50/50 w-fit px-4 py-2 rounded-full border border-emerald-100/50 group-hover:bg-emerald-50 group-hover:border-emerald-200 transition-colors">
                  Buka Tagihan <Icon name="arrow-right" size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentViewMode('bulanan')} 
              className="group relative bg-white border border-slate-200/60 rounded-[2.5rem] p-7 cursor-pointer hover:border-sky-400 hover:shadow-[0_8px_30px_rgba(14,165,233,0.12)] transition-all duration-500 overflow-hidden text-left block w-full hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-sky-50 rounded-full -mr-20 -mt-20 group-hover:bg-sky-400/10 group-hover:scale-150 transition-all duration-700 ease-out"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-sky-400 group-hover:to-sky-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-sky-500/30 transition-all duration-500 mb-5 group-hover:rotate-3">
                  <Icon name="calendar-range" size={28} />
                </div>
                <h4 className="text-xl font-black text-slate-800 mb-2 group-hover:text-sky-700 transition-colors">Tagihan Bulanan</h4>
                <p className="text-sm font-medium text-slate-500 leading-relaxed mb-6 max-w-sm">Kelola pembayaran rutin bulanan: SPP, makan, laundry (kalender hijriah).</p>
                
                <div className="flex items-center gap-2 text-xs font-black text-sky-600 uppercase tracking-widest bg-sky-50/50 w-fit px-4 py-2 rounded-full border border-sky-100/50 group-hover:bg-sky-50 group-hover:border-sky-200 transition-colors">
                  Buka Tagihan <Icon name="arrow-right" size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentViewMode('keuangan')} 
              className="group relative bg-white border border-slate-200/60 rounded-[2.5rem] p-7 cursor-pointer hover:border-amber-400 hover:shadow-[0_8px_30px_rgba(245,158,11,0.12)] transition-all duration-500 overflow-hidden text-left block w-full hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-amber-50 rounded-full -mr-20 -mt-20 group-hover:bg-amber-400/10 group-hover:scale-150 transition-all duration-700 ease-out"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-amber-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-amber-500/30 transition-all duration-500 mb-5 group-hover:-rotate-3">
                  <Icon name="bar-chart-3" size={28} />
                </div>
                <h4 className="text-xl font-black text-slate-800 mb-2 group-hover:text-amber-700 transition-colors">Keuangan</h4>
                <p className="text-sm font-medium text-slate-500 leading-relaxed mb-6 max-w-sm">Catat pemasukan & pengeluaran, laporan bulanan dan tahunan pesantren.</p>
                
                <div className="flex items-center gap-2 text-xs font-black text-amber-600 uppercase tracking-widest bg-amber-50/50 w-fit px-4 py-2 rounded-full border border-amber-100/50 group-hover:bg-amber-50 group-hover:border-amber-200 transition-colors">
                  Buka Keuangan <Icon name="arrow-right" size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
          </div>
        </div>
      ) : paymentViewMode === 'keuangan' ? (
        <div className="space-y-4 animate-in">
          <div className="flex items-center gap-3 ml-2 mb-4">
            <button 
              onClick={() => setPaymentViewMode(null)} 
              className="p-2 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm"
              title="Kembali Pilih Mode"
            >
              <Icon name="arrow-left" size={18} />
            </button>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shadow-sm">
                <Icon name="bar-chart-3" size={18} />
              </div>
              <h3 className="font-black text-slate-800 text-lg">
                Pengelolaan Keuangan ({TAHUN_AJARAN_LIST.find(t => t.masehi === selectedTahunAjaran)?.hijriah} H / {selectedTahunAjaran} M)
              </h3>
            </div>
          </div>
          <KeuanganPanel
            keuanganEntries={keuanganEntries}
            keuanganLoading={keuanganLoading}
            fetchKeuanganData={fetchKeuanganData}
            onAddEntry={onAddKeuanganEntry}
            onEditEntry={onEditKeuanganEntry}
            onDeleteEntry={onDeleteKeuanganEntry}
            selectedTahunAjaran={selectedTahunAjaran}
            setAlert={setAlert}
            dataSantri={dataSantri}
          />
        </div>
      ) : paymentViewMode === 'tahunan' ? (
        <div className="space-y-4 animate-in">
          <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 mb-2">
            <div className="flex items-center gap-3 ml-2">
              <button 
                onClick={() => setPaymentViewMode(null)} 
                className="p-2 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm"
                title="Kembali Pilih Mode"
              >
                <Icon name="arrow-left" size={18} />
              </button>
              <h3 className="font-black text-slate-800 text-lg">
                Tagihan Tahunan ({TAHUN_AJARAN_LIST.find(t => t.masehi === selectedTahunAjaran)?.hijriah} H)
              </h3>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Search Input Tahunan */}
              <div className="flex items-center gap-2 bg-white border border-slate-200 shadow-sm px-3 py-2 rounded-xl focus-within:ring-2 focus-within:ring-emerald-400 focus-within:border-emerald-400 transition-all w-full sm:w-52">
                <Icon name="search" size={14} className="text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Cari nama santri..."
                  value={searchTahunan}
                  onChange={(e) => setSearchTahunan(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs font-bold w-full text-slate-700 placeholder-slate-400"
                />
                {searchTahunan && (
                  <button onClick={() => setSearchTahunan('')} className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
                    <Icon name="x" size={12} />
                  </button>
                )}
              </div>
              <div className="flex items-center bg-white border border-slate-200 shadow-sm p-1 rounded-xl h-fit">
                <div className="flex items-center pl-3 pr-1 text-slate-400">
                  <Icon name="filter" size={16} />
                </div>
                <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="bg-transparent w-full text-xs font-bold text-[#083316] outline-none cursor-pointer py-2 pr-2 appearance-none">
                  <option value="Semua">Semua Status</option>
                  <option value="Lunas">Sudah Lunas</option>
                  <option value="Belum Lunas">Belum Lunas</option>
                </select>
              </div>
              
              <button onClick={() => { setAlert({type:'success', text:'Menyegarkan data...'}); fetchData(); }} title="Refresh Data" className="p-2.5 bg-white border border-slate-200 text-slate-500 flex items-center justify-center rounded-xl hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm">
                <Icon name="refresh-cw" size={16}/>
              </button>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-[2rem] border border-white shadow-sm overflow-hidden flex flex-col">
            {dataLoading ? (
              <div className="p-16 flex justify-center"><Icon name="loader-2" size={32} className="animate-spin text-[#083316]" /></div>
            ) : (
              <div className="overflow-x-auto custom-scroll w-full pb-4">
                <table className="compact-table w-full text-left text-sm min-w-[640px] border-collapse">
                  <thead className="bg-slate-100/50 text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-5 text-center w-12">No</th>
                      <th className="px-6 py-5">Nama Santri</th>
                      <th className="px-5 py-5 text-right">Nominal</th>
                      <th className="px-5 py-5 text-center">Status</th>
                      <th className="px-6 py-5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredKeuanganList.length === 0 ? (
                       <tr><td colSpan="5" className="px-6 py-10 text-center text-slate-400 font-semibold"><Icon name="inbox" size={32} className="opacity-50 mx-auto mb-2"/> Tidak ada data santri ditemukan.</td></tr>
                    ) : filteredKeuanganList.map((santri, index) => {
                      const isCurrentYear = selectedTahunAjaran === 2026;
                      const activePembayaran = isCurrentYear ? (santri.pembayaran || {}) : {};

                      const paidItems = PAYMENT_ITEMS.filter(item => activePembayaran[item.key]);
                      const totalDibayar = paidItems.reduce((sum, item) => sum + item.nominal, 0);
                      const isLunas = totalDibayar === TOTAL_BIAYA;
                      const sisaTagihan = Math.max(TOTAL_BIAYA - totalDibayar, 0);

                      return (
                        <tr key={santri.id} className="hover:bg-emerald-50/40 transition-colors group">
                          <td className="px-5 py-4 text-center text-slate-400 font-bold">{index + 1}</td>
                          
                          <td className="px-6 py-4">
                            <div className="font-black text-slate-800">
                              {santri.namaLengkap}
                            </div>
                            <div className="text-[10px] font-medium text-slate-400 font-mono mt-0.5">{santri.id}</div>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <span className={`font-black ${isLunas ? 'text-slate-400' : 'text-rose-600'}`}>
                              {isLunas ? 'Lunas' : formatRupiah(sisaTagihan)}
                            </span>
                          </td>
                          
                          <td className="px-5 py-4 text-center">
                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-block border shadow-sm
                              ${isLunas ? 'bg-green-50 border-green-200 text-green-700' : 'bg-rose-50 border-rose-200 text-rose-600'}`}>
                              {isLunas ? 'Lunas' : 'Belum Lunas'}
                            </span>
                          </td>
                          
                          <td className="px-6 py-4 text-center flex justify-center gap-2">
                            <button 
                              onClick={() => openPaymentModal({ ...santri, pembayaran: activePembayaran })} 
                              className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-600 hover:text-white transition-all text-xs font-bold shadow-sm flex items-center gap-2"
                            >
                               <Icon name="list" size={14} /> Detail
                            </button>
                            
                            <button 
                              onClick={() => setReceiptData({ ...santri, pembayaran: activePembayaran })} 
                              className="px-3 py-2 bg-[#083316] text-emerald-100 rounded-xl hover:bg-[#0a421d] hover:text-white transition-all shadow-sm"
                              title="Cetak Kwitansi"
                            >
                               <Icon name="printer" size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-in">
          {!selectedIslamicMonth ? (
            <>
              <div className="flex items-center gap-3 ml-2 mb-6">
                <button 
                  onClick={() => setPaymentViewMode(null)} 
                  className="p-2 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm"
                >
                  <Icon name="arrow-left" size={18} />
                </button>
                <h3 className="font-black text-slate-800 text-lg">Pilih Bulan (Kalender Hijriah)</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
                {ISLAMIC_MONTHS.map((month, idx) => (
                  <button
                    type="button"
                    key={idx} 
                    onClick={() => setSelectedIslamicMonth(month)}
                    className="group relative bg-white border border-slate-200 rounded-[1.8rem] p-6 cursor-pointer hover:border-sky-500 hover:shadow-2xl hover:shadow-sky-900/10 hover:-translate-y-1.5 transition-all duration-300 text-center overflow-hidden block w-full"
                  >
                    <div className="absolute top-0 right-0 w-12 h-12 bg-slate-50 rounded-bl-[1.5rem] -mr-1 -mt-1 group-hover:bg-sky-50 transition-colors"></div>
                    <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-sky-500 group-hover:text-white group-hover:rotate-12 transition-all duration-500">
                      <Icon name="moon-star" size={20} />
                    </div>
                    <h4 className="font-black text-slate-800 text-sm group-hover:text-sky-700 transition-colors tracking-tight">{month}</h4>
                    <p className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Buka Tagihan</p>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-4 animate-in">
              <div className="flex items-center gap-3 ml-2 mb-4">
                <button 
                  onClick={() => setSelectedIslamicMonth(null)} 
                  className="p-2 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm"
                >
                  <Icon name="arrow-left" size={18} />
                </button>
                <h3 className="font-black text-slate-800 text-lg">
                  Tagihan Bulan {selectedIslamicMonth} - {TAHUN_AJARAN_LIST.find(t => t.masehi === selectedTahunAjaran)?.hijriah} H
                </h3>
              </div>
              <div className="bg-white/80 backdrop-blur-md rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 border-b border-slate-200/60">
                  <div>
                    <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                      <Icon name="table-2" size={20} className="text-sky-500" /> Tabel Bulanan
                    </h3>
                    <p className="text-slate-500 font-medium text-xs mt-1">
                      Pembayaran bulanan bulan <span className="text-sky-700 font-black">{selectedIslamicMonth}</span> - {TAHUN_AJARAN_LIST.find(t => t.masehi === selectedTahunAjaran)?.hijriah || '-'} H / {selectedTahunAjaran || '-'} M
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Search Input Bulanan */}
                    <div className="flex items-center gap-2 bg-white border border-slate-200 shadow-sm px-3 py-2 rounded-xl focus-within:ring-2 focus-within:ring-sky-400 focus-within:border-sky-400 transition-all w-full sm:w-52">
                      <Icon name="search" size={14} className="text-slate-400 flex-shrink-0" />
                      <input
                        type="text"
                        placeholder="Cari nama santri..."
                        value={searchBulanan}
                        onChange={(e) => setSearchBulanan(e.target.value)}
                        className="bg-transparent border-none outline-none text-xs font-bold w-full text-slate-700 placeholder-slate-400"
                      />
                      {searchBulanan && (
                        <button onClick={() => setSearchBulanan('')} className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
                          <Icon name="x" size={12} />
                        </button>
                      )}
                    </div>
                    <button 
                      onClick={() => fetchBulananData(selectedIslamicMonth)} 
                      className="p-2 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 transition-all shadow-sm"
                      title="Refresh"
                    >
                      <Icon name="refresh-cw" size={16} />
                    </button>
                    <button 
                      onClick={openBulananCreateForm} 
                      className="px-4 py-2 bg-[#083316] text-white rounded-xl font-bold hover:bg-[#0a421d] transition-all shadow-md shadow-emerald-900/20 flex items-center gap-2 text-xs"
                    >
                      <Icon name="plus" size={16} /> Tambah Entri
                    </button>
                  </div>
                </div>
                {bulananLoading ? (
                  <div className="p-16 flex justify-center"><Icon name="loader-2" size={32} className="animate-spin text-[#083316]" /></div>
                ) : (
                  <div className="overflow-x-auto custom-scroll w-full pb-4">
                    <table className="compact-table w-full text-left text-sm min-w-[800px] border-collapse">
                      <thead className="bg-slate-100/50 text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-slate-200">
                        <tr>
                          <th className="px-5 py-4 text-center w-12">No</th>
                          <th className="px-6 py-4">Student ID</th>
                          <th className="px-6 py-4">Student Name</th>
                          <th className="px-5 py-4 text-center">Academic Year</th>
                          <th className="px-5 py-4 text-center">Hijri Month</th>
                          <th className="px-5 py-4 text-center">Makan</th>
                          <th className="px-5 py-4 text-center">Laundry</th>
                          <th className="px-5 py-4 text-center">Ziaroh</th>
                          <th className="px-5 py-4 text-center">Status</th>
                          <th className="px-6 py-4 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {mergedBulananEntries.length === 0 ? (
                          <tr>
                            <td colSpan="10" className="px-6 py-10 text-center text-slate-400 font-semibold">
                              <Icon name="users" size={32} className="opacity-50 mx-auto mb-2"/>
                              Belum ada data santri aktif untuk ditampilkan pada bulan ini.
                            </td>
                          </tr>
                        ) : mergedBulananEntries.map((entry, index) => {
                          const matchedSantri = !entry.studentName && entry.studentId
                            ? dataSantri.find(s => s.id === entry.studentId)
                            : null;
                          const displayName = entry.studentName || (matchedSantri ? matchedSantri.namaLengkap : '-');
                          return (
                            <tr key={entry.rowIndex || entry.studentId || index} className={`transition-colors group ${entry.isVirtual ? 'bg-slate-50/50 hover:bg-slate-50' : 'hover:bg-sky-50/40'}`}>
                              <td className="px-5 py-3 text-center text-slate-400 font-bold">{index + 1}</td>
                              <td className="px-6 py-3">
                                <span className="font-mono text-[11px] font-bold text-[#083316]">{entry.studentId || '-'}</span>
                              </td>
                              <td className="px-6 py-3">
                                <span className="font-black text-slate-800">{displayName}</span>
                              </td>
                              <td className="px-5 py-3 text-center">
                                <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[10px] font-black text-slate-600">{entry.academicYear || '-'}</span>
                              </td>
                              <td className="px-5 py-3 text-center">
                                <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded text-[10px] font-black uppercase">{entry.hijriMonth || '-'}</span>
                              </td>
                              <td className="px-5 py-3 text-center">
                                {entry.makan ? <Icon name="check-circle" size={16} className="text-green-500 mx-auto" /> : <Icon name="x-circle" size={16} className="text-slate-300 mx-auto" />}
                              </td>
                              <td className="px-5 py-3 text-center">
                                {entry.laundry ? <Icon name="check-circle" size={16} className="text-green-500 mx-auto" /> : <Icon name="x-circle" size={16} className="text-slate-300 mx-auto" />}
                              </td>
                              <td className="px-5 py-3 text-center">
                                {entry.ziaroh ? <Icon name="check-circle" size={16} className="text-green-500 mx-auto" /> : <Icon name="x-circle" size={16} className="text-slate-300 mx-auto" />}
                              </td>
                              <td className="px-5 py-3 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block border shadow-sm
                                  ${(entry.status || 'Belum Lunas') === 'Lunas' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                                  {entry.status || 'Belum Lunas'}
                                </span>
                              </td>
                              <td className="px-6 py-3">
                                <div className="flex justify-center gap-1.5">
                                  <button 
                                    onClick={() => openBulananEditForm(entry)} 
                                    className={`p-1.5 rounded-lg transition-all shadow-sm ${entry.isVirtual ? 'bg-sky-50 text-sky-600 hover:bg-sky-500 hover:text-white' : 'bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white'}`}
                                    title={entry.isVirtual ? "Buat Entri" : "Edit"}
                                  >
                                    <Icon name={entry.isVirtual ? "plus" : "edit-2"} size={13} />
                                  </button>
                                  {!entry.isVirtual && (
                                    <button 
                                      onClick={() => deleteBulananItem(entry)} 
                                      className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                      title="Hapus"
                                    >
                                      <Icon name="trash-2" size={13} />
                                    </button>
                                  )}
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};
