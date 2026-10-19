import React, { useState, useMemo } from 'react';
import { Icon } from './Icon';

export const SantriTab = ({
  activeTab,
  santriList,
  dataLoading,
  searchQuery,
  fetchData,
  handleExportExcel,
  handleExportPDF,
  setViewData,
  setEditData,
  setDeleteData,
  setAlert,
  onOpenImport
}) => {
  const [genderFilter, setGenderFilter] = useState("Semua");
  const [sortOrder, setSortOrder] = useState("A-Z");

  const isAlumni = (status) => String(status || '').trim().toLowerCase() === 'alumni';

  const filteredList = useMemo(() => {
    return santriList.filter(santri => 
      santri.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) || 
      santri.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [santriList, searchQuery]);

  const displayedData = useMemo(() => {
    let data = filteredList.filter(s => {
      const matchStatus = activeTab === 'status' ? !isAlumni(s.status) : isAlumni(s.status);
      const matchGender = genderFilter === 'Semua' ? true : s.jenisKelamin === genderFilter;
      return matchStatus && matchGender;
    });

    const sortAlphabetically = (a, b) => {
      if (sortOrder === 'A-Z') return a.namaLengkap.localeCompare(b.namaLengkap);
      if (sortOrder === 'Z-A') return b.namaLengkap.localeCompare(a.namaLengkap);
      return 0;
    };

    return [...data].sort(sortAlphabetically);
  }, [filteredList, activeTab, genderFilter, sortOrder]);

  const totalCount = displayedData.length;
  const maleCount = displayedData.filter(s => s.jenisKelamin === 'Laki-laki').length;
  const femaleCount = displayedData.filter(s => s.jenisKelamin === 'Perempuan').length;

  return (
    <div className="strata-santri-page w-full space-y-6 animate-in pb-10">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800">
            {activeTab === 'status' ? 'Data Santri Aktif' : 'Daftar Alumni'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Manajemen data dan informasi status santri secara real-time.</p>
        </div>
        
        <div className="flex flex-wrap gap-2.5 sm:gap-3 items-center">
          {searchQuery && (
            <div className="text-xs sm:text-sm font-bold text-[#083316] bg-emerald-50 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-emerald-100 shadow-sm">
              Cari: "{searchQuery}"
            </div>
          )}
          
          {/* Action Toolbar */}
          <div className="flex items-center bg-white border border-slate-200 shadow-sm p-1.5 rounded-2xl gap-1 print:hidden flex-shrink-0">
            <button onClick={() => { setAlert({type:'success', text:'Menyegarkan data...'}); fetchData(); }} title="Refresh Data" className="w-9 h-9 flex items-center justify-center bg-slate-50 text-slate-600 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
              <Icon name="refresh-cw" size={16} />
            </button>
            <div className="w-px h-5 bg-slate-200 mx-0.5 sm:mx-1"></div>
            <button onClick={handleExportExcel} title="Export ke Excel (CSV)" className="w-9 h-9 flex items-center justify-center bg-slate-50 text-slate-600 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
              <Icon name="file-spreadsheet" size={16} />
            </button>
            <button onClick={handleExportPDF} title="Export ke PDF / Cetak Laporan" className="w-9 h-9 flex items-center justify-center bg-slate-50 text-slate-600 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors">
              <Icon name="file-text" size={16} />
            </button>
            <button
              onClick={onOpenImport}
              title="Import Data"
              className="w-9 h-9 flex items-center justify-center bg-slate-900 text-white rounded-xl hover:bg-black transition-colors"
            >
              <Icon name="file-up" size={16} />
            </button>
          </div>

          {/* Filter Options */}
          <div className="flex items-center bg-white border border-slate-200 shadow-sm p-1.5 rounded-2xl print:hidden flex-shrink-0">
            <div className="flex items-center pl-2.5 pr-1 text-slate-400">
              <Icon name="filter" size={15} />
            </div>
            <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)} className="bg-transparent text-xs font-bold text-[#083316] outline-none cursor-pointer py-1.5 px-1.5 appearance-none">
              <option value="Semua">Semua Gender</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
            
            <div className="w-px h-5 bg-slate-200 mx-1"></div>
            
            <div className="flex items-center pl-2 pr-1 text-slate-400">
              <Icon name="arrow-up-down" size={15} />
            </div>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="bg-transparent text-xs font-bold text-[#083316] outline-none cursor-pointer py-1.5 pr-3 pl-1 appearance-none">
              <option value="A-Z">A - Z</option>
              <option value="Z-A">Z - A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-[1.5rem] p-5 border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Icon name="users" size={28}/>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total {activeTab === 'status' ? 'Santri' : 'Alumni'}</p>
            <p className="text-3xl font-black text-slate-800 leading-none">{totalCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-[1.5rem] p-5 border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Icon name="user" size={28}/>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Laki-laki</p>
            <p className="text-3xl font-black text-slate-800 leading-none">{maleCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-[1.5rem] p-5 border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Icon name="user" size={28}/>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Perempuan</p>
            <p className="text-3xl font-black text-slate-800 leading-none">{femaleCount}</p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scroll w-full min-w-0">
          <table className="strata-data-table compact-table w-full text-left text-sm text-slate-600 border-collapse min-w-[640px]">
            <thead className="bg-slate-50/80 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-5 py-5">Informasi Santri</th>
                <th className="px-5 py-5">Gender</th>
                <th className="px-5 py-5">Tempat Lahir</th>
                <th className="px-5 py-5">Pendidikan</th>
                <th className="px-5 py-5">Wali</th>
                <th className="px-5 py-5 text-center">Status</th>
                <th className="px-5 py-5 text-right font-black">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dataLoading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-16 text-center">
                    <Icon name="loader-2" size={32} className="animate-spin mx-auto text-[#083316]" />
                  </td>
                </tr>
              ) : displayedData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-16 text-center">
                    <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon name="inbox" size={32}/>
                    </div>
                    <p className="text-slate-500 font-bold text-sm">Tidak ada data {activeTab === 'status' ? 'santri' : 'alumni'} ditemukan.</p>
                  </td>
                </tr>
              ) : (
                displayedData.map((row, i) => (
                  <tr key={row.id || i} className="hover:bg-emerald-50/40 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs shadow-inner uppercase flex-shrink-0">
                          {row.namaLengkap.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-sm group-hover:text-[#083316] transition-colors truncate">{row.namaLengkap}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{row.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600">{row.jenisKelamin}</td>
                    <td className="px-5 py-4 font-semibold text-slate-600">{row.tempatLahir || '-'}</td>
                    <td className="px-5 py-4 font-semibold text-slate-600">{row.pendidikan}</td>
                    <td className="px-5 py-4 font-semibold text-slate-600">
                      {(row.namaWali && row.namaWali !== '-') ? row.namaWali : '-'}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-block border shadow-sm
                        ${row.status === 'Aktif' || row.status === 'Diterima' ? 'bg-green-50 border-green-200 text-green-700' : 
                          isAlumni(row.status) ? 'bg-sky-50 border-sky-200 text-sky-700' : 
                          row.status === 'Ditolak' ? 'bg-rose-50 border-rose-200 text-rose-700' : 
                          'bg-amber-50 border-amber-200 text-amber-700'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => setViewData(row)} title="Lihat Detail" className="p-2 bg-slate-50 text-slate-500 rounded-xl hover:bg-[#083316] hover:text-white transition-all shadow-sm"><Icon name="eye" size={15}/></button>
                        <button onClick={() => setEditData(row)} title="Edit Data" className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-500 hover:text-white transition-all shadow-sm"><Icon name="edit-2" size={15}/></button>
                        <button onClick={() => setDeleteData(row)} title="Hapus Data" className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"><Icon name="trash-2" size={15}/></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
