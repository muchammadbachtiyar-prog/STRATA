import React, { useState } from 'react';
import { Icon } from './Icon';

// Field input yang bisa dipakai ulang
const Field = ({ label, required, hint, children }) => (
  <div className="space-y-1.5">
    <div className="flex items-baseline justify-between gap-2">
      <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
        {label}
        {required && <span className="text-rose-500 text-xs">*</span>}
      </label>
      {hint && <span className="text-[10px] text-slate-400 italic">{hint}</span>}
    </div>
    {children}
  </div>
);

const inputClass = (focusColor = 'emerald') =>
  `w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none text-slate-800 text-sm transition-all
   focus:bg-white focus:border-${focusColor}-400 focus:ring-4 focus:ring-${focusColor}-400/10 placeholder:text-slate-300`;

const SECTIONS = [
  { id: 'identitas', icon: 'user', label: 'Identitas Santri', color: 'emerald' },
  { id: 'keluarga',  icon: 'users', label: 'Data Keluarga',  color: 'sky'     },
];

export const PendaftaranTab = ({
  formData,
  handleInputChange,
  submitData,
  loading
}) => {
  const [activeSection, setActiveSection] = useState('identitas');

  const progressFields = [
    !!formData.nik && formData.nik.length === 16,
    !!formData.namaLengkap,
    !!formData.tanggalLahir,
    !!formData.jenisKelamin,
    !!formData.pendidikan,
    !!formData.alamat,
    !!formData.noHp,
    !!formData.namaAyah,
    !!formData.namaIbu,
  ];
  const filled = progressFields.filter(Boolean).length;
  const total  = progressFields.length;
  const pct    = Math.round((filled / total) * 100);

  const identitasDone = [
    !!formData.nik && formData.nik.length === 16,
    !!formData.namaLengkap,
    !!formData.tanggalLahir,
    !!formData.jenisKelamin,
    !!formData.pendidikan,
    !!formData.alamat,
  ].every(Boolean);

  return (
    <div className="strata-pendaftaran-page w-full animate-in pb-8 max-w-6xl mx-auto">

      {/* ── HERO HEADER ── */}
      <div className="relative rounded-[2rem] overflow-hidden mb-6 bg-gradient-to-br from-[#062b15] via-[#0a5e35] to-[#12a65a] p-6 sm:p-8 shadow-2xl shadow-emerald-900/25">
        {/* Decorative blobs */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-4 right-4 w-16 h-16 bg-white/5 rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner">
              <Icon name="user-plus" size={26} className="text-white" />
            </div>
            <div>
              <p className="text-emerald-200/80 text-[11px] font-bold uppercase tracking-widest mb-1">Form Pendaftaran</p>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">Daftar Santri Baru</h2>
              <p className="text-emerald-100/70 text-xs sm:text-sm mt-1 max-w-lg">Lengkapi data calon santri secara bertahap. Anda dapat berpindah langkah tanpa kehilangan isian.</p>
            </div>
          </div>

          {/* Progress ring */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-5 py-4 self-start sm:self-center">
            <div className="relative w-14 h-14 flex-shrink-0">
              <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90">
                <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
                <circle
                  cx="28" cy="28" r="22"
                  fill="none"
                  stroke="#4ade80"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${(pct / 100) * 138.2} 138.2`}
                  className="transition-all duration-500"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{pct}%</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm">{filled}/{total} Field</p>
              <p className="text-emerald-200/70 text-[10px] mt-0.5">Terisi</p>
            </div>
          </div>
        </div>

        {/* Checklist tips */}
        <div className="relative z-10 mt-5 pt-5 border-t border-white/10 flex flex-wrap gap-x-6 gap-y-2">
          {[
            { icon: 'id-card',      text: 'NIK 16 digit sesuai KTP/KK' },
            { icon: 'phone',        text: 'Nomor HP/WA yang aktif (08...)' },
            { icon: 'users', text: 'Nama lengkap ayah & ibu kandung' },
          ].map(tip => (
            <div key={tip.text} className="flex items-center gap-2">
              <div className="w-5 h-5 bg-emerald-400/30 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon name={tip.icon} size={10} className="text-emerald-200" />
              </div>
              <span className="text-xs text-emerald-100/80">{tip.text}</span>
            </div>
          ))}
        </div>

        <div className="relative z-10 mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="rounded-xl bg-black/10 border border-white/10 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-widest text-emerald-200/70 font-black">Langkah 01</p>
            <p className="text-xs font-bold text-white mt-0.5">Identitas santri</p>
          </div>
          <div className="rounded-xl bg-black/10 border border-white/10 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-widest text-emerald-200/70 font-black">Langkah 02</p>
            <p className="text-xs font-bold text-white mt-0.5">Keluarga & kontak</p>
          </div>
          <div className="rounded-xl bg-white/10 border border-white/15 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-widest text-emerald-200/70 font-black">Sebelum simpan</p>
            <p className="text-xs font-bold text-white mt-0.5">Periksa kembali data</p>
          </div>
        </div>
      </div>

      {/* ── SECTION TABS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {SECTIONS.map((sec, idx) => {
          const isDone = sec.id === 'identitas' ? identitasDone : (!!formData.noHp && !!formData.namaAyah && !!formData.namaIbu);
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`flex items-center gap-3 px-4 sm:px-5 py-3.5 rounded-2xl border-2 transition-all duration-200 min-h-[70px]
                ${isActive
                  ? sec.color === 'emerald'
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-900/20'
                    : 'bg-sky-600 border-sky-600 text-white shadow-lg shadow-sky-900/20'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                }`}
            >
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors
                ${isActive ? 'bg-white/20' : sec.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'}`}>
                <Icon name={sec.icon} size={15} className={isActive ? 'text-white' : ''} />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <p className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-700'}`}>{sec.label}</p>
                  {isDone && (
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isActive ? 'bg-white/30' : 'bg-emerald-100'}`}>
                      <Icon name="check" size={9} className={isActive ? 'text-white' : 'text-emerald-600'} />
                    </div>
                  )}
                </div>
                <p className={`text-[10px] ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                  Bagian {idx + 1} dari {SECTIONS.length}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── SECTION: IDENTITAS SANTRI ── */}
      {activeSection === 'identitas' && (
        <div className="bg-white rounded-[1.75rem] border border-slate-200/70 shadow-md shadow-slate-200/40 p-5 sm:p-7 space-y-6 animate-in">
          {/* Section title */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon name="user" size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Informasi Pribadi Santri</h3>
              <p className="text-[11px] text-slate-400">Sesuaikan dengan Kartu Keluarga atau Akte Kelahiran.</p>
            </div>
          </div>

          {/* NIK + Nama */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="NIK" required hint="16 digit">
              <div className="relative">
                <Icon name="id-card" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="tel"
                  name="nik"
                  value={formData.nik}
                  onChange={handleInputChange}
                  inputMode="numeric"
                  maxLength="16"
                  className={`${inputClass('emerald')} pl-9 font-mono tracking-wide`}
                  placeholder="1234567890123456"
                />
              </div>
              {formData.nik && (
                <p className={`text-[10px] flex items-center gap-1 mt-0.5 ${formData.nik.length === 16 ? 'text-emerald-600' : 'text-amber-500'}`}>
                  <Icon name={formData.nik.length === 16 ? 'check-circle' : 'alert-circle'} size={10} />
                  {formData.nik.length}/16 digit {formData.nik.length === 16 ? '— Valid' : '— Belum lengkap'}
                </p>
              )}
            </Field>

            <div className="sm:col-span-2">
              <Field label="Nama Lengkap" required hint="Sesuai dokumen resmi">
                <div className="relative">
                  <Icon name="user" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    name="namaLengkap"
                    value={formData.namaLengkap}
                    onChange={handleInputChange}
                    className={`${inputClass('emerald')} pl-9`}
                    placeholder="Nama lengkap sesuai Akte / KK"
                  />
                </div>
              </Field>
            </div>
          </div>

          {/* Jenis Kelamin + Pendidikan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Jenis Kelamin" required>
              <div className="flex gap-3">
                {['Laki-laki', 'Perempuan'].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleInputChange({ target: { name: 'jenisKelamin', value: val } })}
                    className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl border-2 text-sm font-bold transition-all
                      ${formData.jenisKelamin === val
                        ? val === 'Laki-laki'
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-900/20'
                          : 'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-900/20'
                        : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}
                  >
                    <Icon name={val === 'Laki-laki' ? 'user' : 'user'} size={15} />
                    {val}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Tingkat Pendidikan" required>
              <div className="flex flex-col gap-2">
                {[
                  { val: 'SD/MI',     label: 'SD / MI',     sub: 'Sekolah Dasar' },
                  { val: 'SMP/MTs',   label: 'SMP / MTs',   sub: 'Sekolah Menengah Pertama' },
                  { val: 'SMA/MA/SMK',label: 'SMA / MA / SMK', sub: 'Sekolah Menengah Atas' },
                ].map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => handleInputChange({ target: { name: 'pendidikan', value: opt.val } })}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 text-left transition-all
                      ${formData.pendidikan === opt.val
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-900/15'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-white'
                      }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
                      ${formData.pendidikan === opt.val ? 'border-white' : 'border-slate-300'}`}>
                      {formData.pendidikan === opt.val && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${formData.pendidikan === opt.val ? 'text-white' : 'text-slate-700'}`}>{opt.label}</p>
                      <p className={`text-[10px] ${formData.pendidikan === opt.val ? 'text-white/70' : 'text-slate-400'}`}>{opt.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </Field>
          </div>

          {/* Tempat & Tanggal Lahir */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tempat Lahir">
              <div className="relative">
                <Icon name="map-pin" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  name="tempatLahir"
                  value={formData.tempatLahir}
                  onChange={handleInputChange}
                  className={`${inputClass('emerald')} pl-9`}
                  placeholder="Nama kota / kabupaten"
                />
              </div>
            </Field>

            <Field label="Tanggal Lahir">
              <div className="relative">
                <Icon name="calendar" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  name="tanggalLahir"
                  value={formData.tanggalLahir}
                  onChange={handleInputChange}
                  className={`${inputClass('emerald')} pl-9`}
                />
              </div>
            </Field>
          </div>

          {/* Alamat */}
          <Field label="Alamat Lengkap" hint="RT/RW, Desa, Kecamatan, Kota">
            <div className="relative">
              <Icon name="home" size={15} className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
              <textarea
                name="alamat"
                value={formData.alamat}
                onChange={handleInputChange}
                rows="2"
                className={`${inputClass('emerald')} pl-9 resize-none`}
                placeholder="Jl. Melati No. 12, RT 03/RW 02, Desa Sumber Agung, Kec. Pecangaan..."
              />
            </div>
          </Field>

          {/* Next button */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setActiveSection('keluarga')}
              className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2 text-sm"
            >
              Lanjut ke Data Keluarga <Icon name="arrow-right" size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── SECTION: DATA KELUARGA ── */}
      {activeSection === 'keluarga' && (
        <div className="bg-white rounded-[1.75rem] border border-slate-200/70 shadow-md shadow-slate-200/40 p-5 sm:p-7 space-y-6 animate-in">
          {/* Section title */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-9 h-9 bg-sky-100 text-sky-700 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon name="users" size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Data Keluarga & Kontak</h3>
              <p className="text-[11px] text-slate-400">Isi nama orang tua dan nomor yang bisa dihubungi.</p>
            </div>
          </div>

          {/* Ayah & Ibu */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Orang Tua Kandung</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nama Ayah" required>
                <div className="relative">
                  <Icon name="user" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    name="namaAyah"
                    value={formData.namaAyah}
                    onChange={handleInputChange}
                    className={`${inputClass('sky')} pl-9`}
                    placeholder="Nama lengkap ayah"
                  />
                </div>
              </Field>

              <Field label="Nama Ibu" required>
                <div className="relative">
                  <Icon name="user" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    name="namaIbu"
                    value={formData.namaIbu}
                    onChange={handleInputChange}
                    className={`${inputClass('sky')} pl-9`}
                    placeholder="Nama lengkap ibu"
                  />
                </div>
              </Field>
            </div>
          </div>

          {/* Wali & Pekerjaan */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Wali & Kontak</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="No. HP / WhatsApp Wali" required hint="Awali dengan 08">
                <div className="relative">
                  <Icon name="phone" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="tel"
                    name="noHp"
                    value={formData.noHp}
                    onChange={handleInputChange}
                    inputMode="numeric"
                    maxLength="15"
                    className={`${inputClass('sky')} pl-9 font-mono`}
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
                {formData.noHp && !formData.noHp.startsWith('08') && (
                  <p className="text-[10px] text-amber-500 flex items-center gap-1 mt-0.5">
                    <Icon name="alert-circle" size={10} /> Nomor harus dimulai dengan 08
                  </p>
                )}
              </Field>

              <Field label="Pekerjaan Orang Tua / Wali">
                <div className="relative">
                  <Icon name="briefcase" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    name="pekerjaanOrtu"
                    value={formData.pekerjaanOrtu}
                    onChange={handleInputChange}
                    className={`${inputClass('sky')} pl-9`}
                    placeholder="Wiraswasta, Petani, dll."
                  />
                </div>
              </Field>

              <div className="sm:col-span-2">
                <Field
                  label="Nama Wali (Opsional)"
                  hint="Isi jika bukan orang tua kandung"
                >
                  <div className="relative">
                    <Icon name="handshake" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      name="namaWali"
                      value={formData.namaWali}
                      onChange={handleInputChange}
                      className={`${inputClass('sky')} pl-9`}
                      placeholder="Nama wali yang bertanggung jawab"
                    />
                  </div>
                </Field>
              </div>
            </div>
          </div>

          {/* Ringkasan sebelum submit */}
          {pct > 50 && (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Ringkasan Data</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                {[
                  { label: 'Nama', val: formData.namaLengkap },
                  { label: 'NIK',  val: formData.nik },
                  { label: 'Jenis Kelamin', val: formData.jenisKelamin },
                  { label: 'Pendidikan', val: formData.pendidikan },
                  { label: 'No. HP', val: formData.noHp },
                  { label: 'Ayah / Ibu', val: [formData.namaAyah, formData.namaIbu].filter(Boolean).join(' / ') },
                ].map(item => item.val ? (
                  <div key={item.label} className="flex items-start gap-2">
                    <Icon name="check-circle" size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400">{item.label}: </span>
                      <span className="text-[10px] font-bold text-slate-700 truncate">{item.val}</span>
                    </div>
                  </div>
                ) : null)}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveSection('identitas')}
              className="sm:w-auto px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Icon name="arrow-left" size={15} /> Kembali
            </button>

            <button
              onClick={submitData}
              disabled={loading}
              className="flex-1 sm:flex-none px-10 py-3.5 rounded-xl font-bold text-white bg-[#083316] hover:bg-[#0a421d] transition-all duration-200 shadow-xl shadow-emerald-900/25 hover:-translate-y-0.5 hover:shadow-emerald-900/35 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center gap-3 text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Icon name="save" size={17} />
                  Simpan & Daftarkan Santri
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── FOOTER NOTE ── */}
      <div className="mt-5 flex items-start gap-2.5 text-slate-400">
        <Icon name="shield-check" size={14} className="flex-shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          Data yang Anda masukkan akan disimpan secara aman di sistem informasi Nailul Jannah.
          Field bertanda <span className="text-rose-400 font-bold">*</span> wajib diisi sebelum menyimpan.
        </p>
      </div>
    </div>
  );
};
