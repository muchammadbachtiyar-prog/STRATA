import React from 'react';
import { Icon } from './Icon';

const YEAR_OPTIONS = [
  { value: 'Semua', label: 'Semua Tahun' },
  { value: 2026, label: '1447 H / 2026 M' },
  { value: 2027, label: '1448 H / 2027 M' },
  { value: 2028, label: '1449 H / 2028 M' },
  { value: 2029, label: '1450 H / 2029 M' },
  { value: 2030, label: '1451 H / 2030 M' },
];

const getInitials = (name = '') => name
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map(word => word[0])
  .join('')
  .toUpperCase() || 'U';

export const PengaturanTab = ({
  userList,
  setUserList,
  setUserFormData,
  setShowUserForm,
  setAlert,
  globalActiveYear,
  onYearChange,
  onSyncAllData,
  isSyncingData
}) => {
  const activeYearLabel = YEAR_OPTIONS.find(option => String(option.value) === String(globalActiveYear))?.label || 'Tahun belum dipilih';

  const handleYearChange = (event) => {
    const value = event.target.value;
    const newYear = value === 'Semua' ? 'Semua' : parseInt(value, 10);
    onYearChange(newYear);
    setAlert({
      type: 'success',
      text: value === 'Semua'
        ? 'Tahun ajaran aktif diatur ke semua tahun.'
        : `Tahun ajaran aktif diatur ke tahun ${newYear} M.`
    });
  };

  const openNewUserForm = () => {
    setUserFormData({ id: null, nama: '', username: '', password: '', role: 'Admin' });
    setShowUserForm(true);
  };

  return (
    <div className="strata-pengaturan-page w-full max-w-[1400px] mx-auto space-y-6 animate-in pb-10">
      {/* Page heading */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-2">
            <Icon name="settings-2" size={14} />
            System workspace
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">Pengaturan Sistem</h2>
          <p className="text-sm text-slate-500 font-medium mt-2 max-w-2xl">
            Kelola identitas pondok, periode kerja, sinkronisasi data, dan hak akses pengguna dari satu ruang kerja terpusat.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start lg:self-auto rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.14)]" />
          <span className="text-xs font-bold text-emerald-800">Sistem aktif</span>
          <span className="text-xs text-emerald-600">•</span>
          <span className="text-xs font-semibold text-emerald-700">{activeYearLabel}</span>
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Icon name="building-2" size={21} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Instansi</span>
          </div>
          <p className="text-lg font-black text-slate-900 mt-5">Nailul Jannah</p>
          <p className="text-xs text-slate-500 font-medium mt-1">Profil pondok pesantren</p>
        </div>
        <div className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Icon name="calendar-days" size={21} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Periode</span>
          </div>
          <p className="text-lg font-black text-slate-900 mt-5">{activeYearLabel}</p>
          <p className="text-xs text-slate-500 font-medium mt-1">Periode aktif sistem</p>
        </div>
        <div className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Icon name="users" size={21} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Akses</span>
          </div>
          <p className="text-lg font-black text-slate-900 mt-5">{userList.length} Pengguna</p>
          <p className="text-xs text-slate-500 font-medium mt-1">Akun terdaftar di STRATA</p>
        </div>
      </div>

      {/* Workspace settings */}
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 md:px-8 py-5 border-b border-slate-100 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Icon name="sliders-horizontal" size={19} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Konfigurasi ruang kerja</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Preferensi utama yang digunakan di seluruh aplikasi.</p>
          </div>
        </div>
        <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-emerald-600 flex items-center justify-center shadow-sm shrink-0">
              <Icon name="home" size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nama instansi</p>
              <p className="text-sm font-black text-slate-800 mt-1 truncate">Pondok Pesantren Nailul Jannah</p>
            </div>
            <span className="ml-auto text-[10px] font-bold text-slate-400 shrink-0">Default</span>
          </div>
          <label className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 flex items-center gap-4 cursor-pointer focus-within:ring-2 focus-within:ring-emerald-300/60">
            <div className="w-10 h-10 rounded-xl bg-white border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm shrink-0">
              <Icon name="calendar" size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-[10px] font-black uppercase tracking-widest text-emerald-700/70">Tahun ajaran aktif</span>
              <select
                value={globalActiveYear}
                onChange={handleYearChange}
                className="w-full bg-transparent border-0 p-0 pr-6 mt-1 text-sm font-black text-emerald-950 outline-none cursor-pointer"
                aria-label="Tahun ajaran aktif"
              >
                {YEAR_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <Icon name="chevrons-up-down" size={16} className="text-emerald-600 shrink-0" />
          </label>
        </div>
      </section>

      {/* Sync callout */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#06351c] via-[#0a542c] to-[#0e6b3d] text-white shadow-lg">
        <div className="absolute -right-12 -top-16 w-56 h-56 rounded-full border-[28px] border-white/5" />
        <div className="absolute right-20 -bottom-24 w-48 h-48 rounded-full border-[18px] border-emerald-300/10" />
        <div className="relative z-10 p-6 md:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4 max-w-2xl">
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
              <Icon name="refresh-cw" size={20} className={isSyncingData ? 'animate-spin' : ''} />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
                Data maintenance
                <span className="w-1 h-1 rounded-full bg-emerald-300" />
                Manual action
              </div>
              <h3 className="text-lg md:text-xl font-black mt-1">Sinkronisasi data menyeluruh</h3>
              <p className="text-xs md:text-sm text-emerald-100/80 leading-relaxed font-medium mt-2">
                Selaraskan data santri, sheet Tahunan, 12 sheet Bulanan, dan cache sistem agar seluruh informasi tetap konsisten.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSyncAllData}
            disabled={isSyncingData}
            className="w-full lg:w-auto px-5 py-3.5 rounded-2xl bg-white text-[#06351c] font-black text-xs hover:bg-emerald-50 transition-all shadow-lg flex items-center justify-center gap-2.5 active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait shrink-0"
          >
            <Icon name="refresh-cw" size={16} className={isSyncingData ? 'animate-spin' : ''} />
            {isSyncingData ? 'Menyinkronkan...' : 'Jalankan sinkronisasi'}
          </button>
        </div>
      </section>

      {/* Access management */}
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 md:px-8 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Icon name="shield-check" size={19} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Manajemen akses pengguna</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Atur siapa yang dapat masuk dan mengelola STRATA.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={openNewUserForm}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#083316] text-white text-xs font-black hover:bg-[#0a421d] transition-all shadow-sm active:scale-[0.98]"
          >
            <Icon name="plus" size={15} />
            Tambah pengguna
          </button>
        </div>

        <div className="px-6 md:px-8 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">Daftar akun yang memiliki akses ke aplikasi.</p>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{userList.length} akun</span>
        </div>

        <div className="overflow-x-auto custom-scroll">
          <table className="w-full text-left min-w-[680px]">
            <thead className="text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100">
              <tr>
                <th className="px-6 md:px-8 py-4">Pengguna</th>
                <th className="px-6 py-4">Username login</th>
                <th className="px-6 py-4">Role akses</th>
                <th className="px-6 md:px-8 py-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {userList.map(user => (
                <tr key={user.id} className="group hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 md:px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-800 flex items-center justify-center font-black text-xs shadow-sm">
                        {getInitials(user.nama)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">{user.nama}</p>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">ID pengguna #{user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-600">{user.username}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 md:px-8 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => { setUserFormData(user); setShowUserForm(true); }}
                        className="w-9 h-9 rounded-xl border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-500 hover:border-amber-500 hover:text-white transition-all flex items-center justify-center"
                        title="Edit pengguna"
                        aria-label={`Edit ${user.nama}`}
                      >
                        <Icon name="pencil" size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Hapus akses untuk ${user.nama}?`)) {
                            setUserList(prev => prev.filter(u => u.id !== user.id));
                            setAlert({ type: 'success', text: 'Pengguna berhasil dihapus!' });
                          }
                        }}
                        className="w-9 h-9 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:border-rose-500 hover:text-white transition-all flex items-center justify-center"
                        title="Hapus pengguna"
                        aria-label={`Hapus ${user.nama}`}
                      >
                        <Icon name="trash-2" size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
