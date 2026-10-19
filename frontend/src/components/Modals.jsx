import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import { 
  formatRupiah, 
  PAYMENT_ITEMS,
  BULANAN_ITEMS,
  TOTAL_BIAYA,
  TAHUN_AJARAN_LIST,
  ISLAMIC_MONTHS,
  formatDateLabel,
  KATEGORI_PEMASUKAN,
  KATEGORI_PENGELUARAN
} from '../utils/helpers';
import { callAppsScript } from '../services/scriptRun';
import { getSessionToken } from '../services/authService';

// 1. Printable Receipt Modal
export const ReceiptModal = ({ receiptData, setReceiptData }) => {
  if (!receiptData) return null;
  if (typeof document === 'undefined') return null;

  const paidItems = PAYMENT_ITEMS.filter(item => receiptData.pembayaran?.[item.key]);
  const totalKwitansi = paidItems.reduce((sum, item) => sum + item.nominal, 0);

  return createPortal(
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen strata-modal-backdrop strata-z-modal p-4 animate-in print:absolute print:inset-0 print:bg-transparent print:backdrop-blur-none print:p-0">
      <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl relative print:shadow-none print:border-none print:max-h-none print:rounded-none print:p-0 print:overflow-visible">
        
        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mb-6 print:hidden">
          <button onClick={() => setReceiptData(null)} className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-colors">
            <Icon name="x" size={18}/>
          </button>
          <button onClick={() => window.print()} className="px-5 py-2.5 bg-[#083316] text-white rounded-xl hover:bg-[#0a421d] flex items-center gap-2 font-bold shadow-md shadow-emerald-900/20 transition-all">
            <Icon name="printer" size={18}/> Cetak Dokumen
          </button>
        </div>

        {/* Printable Area */}
        <div className="text-slate-800 bg-white">
          <div className="flex items-center gap-5 border-b-2 border-[#083316] pb-5 mb-6">
            <div className="w-16 h-16 bg-[#083316] rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-inner print:shadow-none print:border print:border-[#083316]">
              NJ
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-[#083316]">Nailul Jannah</h2>
              <p className="text-xs md:text-sm font-medium text-slate-500 mt-1">Jl. Raya Pecangaan, Jepara, Jawa Tengah.</p>
            </div>
          </div>

          <div className="text-center mb-8">
            <h3 className="text-lg font-black tracking-widest uppercase border-b border-slate-300 inline-block pb-1">Kwitansi Pembayaran</h3>
            <p className="text-xs font-bold text-slate-400 mt-2">No. Ref: INV-{receiptData.id}</p>
          </div>

          <div className="space-y-4 text-sm mb-8">
             <div className="grid grid-cols-[160px_auto] gap-2 items-end">
                <span className="font-bold text-slate-500">Telah terima dari</span>
                <span className="font-black text-base border-b border-slate-300 pb-1">: {receiptData.namaLengkap}</span>
             </div>
             <div className="grid grid-cols-[160px_auto] gap-2 items-end">
                <span className="font-bold text-slate-500">Uang sejumlah</span>
                <span className="font-black text-lg text-[#083316] border-b border-slate-300 pb-1 bg-emerald-50 px-2 print:bg-transparent print:px-0">: {formatRupiah(totalKwitansi)}</span>
             </div>
             <div className="grid grid-cols-[160px_auto] gap-2 items-end">
                <span className="font-bold text-slate-500">Untuk Pembayaran</span>
                <span className="font-bold border-b border-slate-300 pb-1">: Administrasi & Perlengkapan Santri Baru</span>
             </div>
          </div>

          <div className="mb-10">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Rincian Transaksi:</p>
            <table className="w-full text-sm border-collapse border border-slate-300">
              <thead className="bg-slate-100 print:bg-transparent">
                <tr>
                  <th className="py-2 px-4 text-left border border-slate-300">Keterangan Item</th>
                  <th className="py-2 px-4 text-right border border-slate-300 w-48">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {paidItems.length > 0 ? paidItems.map(item => (
                  <tr key={item.key}>
                    <td className="py-2 px-4 border border-slate-300 font-medium">{item.label}</td>
                    <td className="py-2 px-4 border border-slate-300 text-right font-bold">{formatRupiah(item.nominal)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="2" className="py-4 px-4 text-center text-rose-500 font-bold italic border border-slate-300">Belum ada rincian item yang dibayarkan.</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-emerald-50 print:bg-transparent">
                  <td className="py-3 px-4 font-black text-right border border-slate-300">TOTAL DIBAYAR :</td>
                  <td className="py-3 px-4 font-black text-right text-[#083316] text-base border border-slate-300">{formatRupiah(totalKwitansi)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex justify-end text-sm mt-12">
            <div className="text-center">
              <p className="mb-16">Pecangaan, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
              <p className="font-black underline underline-offset-4">Pengurus PPNJ</p>
              <p className="text-xs font-bold text-slate-500 mt-1">Bagian Keuangan / Tata Usaha</p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// 2. View Santri Details Modal
export const ViewSantriModal = ({ viewData, setViewData, setAlert }) => {
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoLoading, setPhotoLoading] = useState(false);

  React.useEffect(() => { setPhotoPreview(viewData?.photoUrl || ''); }, [viewData]);
  if (!viewData) return null;
  if (typeof document === 'undefined') return null;

  const compressPhoto = file => new Promise((resolve, reject) => {
    if (!file?.type?.startsWith('image/')) { reject(new Error('Pilih file gambar.')); return; }
    if (file.size > 5 * 1024 * 1024) { reject(new Error('Ukuran foto maksimal 5 MB.')); return; }
    const reader = new FileReader();
    reader.onload = event => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, 720 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      image.onerror = () => reject(new Error('Foto tidak dapat dibaca.'));
      image.src = event.target.result;
    };
    reader.onerror = () => reject(new Error('Foto tidak dapat dibaca.'));
    reader.readAsDataURL(file);
  });

  const handlePhoto = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoLoading(true);
    try {
      const dataUrl = await compressPhoto(file);
      if (dataUrl.length > 48000) throw new Error('Foto masih terlalu besar. Pilih foto lain.');
      const result = await callAppsScript('saveSantriPhoto', [getSessionToken(), viewData.id, dataUrl]);
      if (!result?.success) throw new Error(result?.message || 'Foto gagal disimpan.');
      setPhotoPreview(dataUrl);
      setAlert?.({ type: 'success', text: 'Foto santri berhasil disimpan.' });
    } catch (error) { setAlert?.({ type: 'error', text: error.message || 'Foto gagal disimpan.' }); }
    finally { setPhotoLoading(false); event.target.value = ''; }
  };

  const fields = [
    ['NIK', viewData.nik], ['Jenis Kelamin', viewData.jenisKelamin], ['Tempat, Tanggal Lahir', `${viewData.tempatLahir || '-'}, ${viewData.tanggalLahir || '-'}`],
    ['No. Handphone', viewData.noHp], ['Pendidikan', viewData.pendidikan], ['Status Saat Ini', viewData.status],
    ['Nama Ayah', viewData.namaAyah], ['Nama Ibu', viewData.namaIbu], ['Nama Wali', viewData.namaWali], ['Pekerjaan Orang Tua', viewData.pekerjaanOrtu], ['Alamat', viewData.alamat]
  ];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-3 sm:p-6 animate-in" role="dialog" aria-modal="true" aria-labelledby="detail-santri-title">
      <div className="bg-slate-50 rounded-[2rem] w-full max-w-3xl max-h-[94vh] overflow-y-auto shadow-2xl relative">
        <div className="bg-gradient-to-br from-[#063b1b] via-[#0b5b2b] to-emerald-700 px-6 sm:px-8 pt-6 pb-16 text-white relative overflow-hidden">
          <div className="absolute -right-16 -top-20 w-56 h-56 rounded-full bg-emerald-300/15" />
          <button onClick={() => setViewData(null)} className="absolute top-5 right-5 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors" aria-label="Tutup detail"><Icon name="x" size={19}/></button>
          <div className="relative flex items-center gap-3"><div className="p-2.5 rounded-xl bg-white/10"><Icon name="user-check" size={20}/></div><div><p className="text-[10px] font-bold tracking-[0.22em] uppercase text-emerald-200">Profil Santri</p><h3 id="detail-santri-title" className="text-xl sm:text-2xl font-black">Detail Informasi Santri</h3></div></div>
        </div>
        <div className="px-5 sm:px-8 -mt-10 relative pb-8">
          <section className="bg-white rounded-3xl shadow-lg border border-slate-100 p-5 sm:p-6 flex flex-col sm:flex-row items-center sm:items-end gap-5">
            <div className="relative shrink-0"><div className="w-28 h-28 rounded-3xl overflow-hidden bg-emerald-50 border-4 border-white shadow-xl flex items-center justify-center">{photoPreview ? <img src={photoPreview} alt={`Foto ${viewData.namaLengkap}`} className="w-full h-full object-cover" /> : <Icon name="user" size={46} className="text-emerald-300" />}</div><label className="absolute -right-2 -bottom-2 w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-lg cursor-pointer hover:bg-emerald-800" title="Tambah atau ubah foto"><Icon name={photoLoading ? 'loader-2' : 'camera'} size={17} className={photoLoading ? 'animate-spin' : ''}/><input type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={photoLoading}/></label></div>
            <div className="min-w-0 text-center sm:text-left"><div className="flex flex-wrap justify-center sm:justify-start items-center gap-2"><h4 className="text-2xl font-black text-slate-800 truncate">{viewData.namaLengkap || '-'}</h4><span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase">{viewData.status || 'Tanpa Status'}</span></div><p className="text-sm font-semibold text-slate-400 mt-1">{viewData.id || '-'} <span className="mx-1">•</span> Klik ikon kamera untuk menambahkan foto</p></div>
          </section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            {fields.map(([label, value]) => <div key={label} className={`bg-white rounded-2xl border border-slate-100 p-4 shadow-sm ${label === 'Alamat' ? 'md:col-span-2' : ''}`}><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.16em]">{label}</p><p className="text-sm font-bold text-slate-800 mt-2 leading-relaxed">{value || '-'}</p></div>)}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// 3. Edit Santri Modal
export const EditSantriModal = ({ 
  editData, 
  setEditData, 
  handleEditInput, 
  executeUpdate, 
  actionLoading 
}) => {
  if (!editData) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen strata-modal-backdrop strata-z-modal p-4 animate-in">
      <div className="bg-white rounded-[2rem] w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl relative">
        <button onClick={() => setEditData(null)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500">
          <Icon name="x" size={20}/>
        </button>
        <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <Icon name="edit-3" className="text-amber-500" size={24}/> Edit Data Santri
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "NIK", name: "nik" }, { label: "Nama Lengkap", name: "namaLengkap" },
            { label: "Tempat Lahir", name: "tempatLahir" }, { label: "No HP", name: "noHp" },
            { label: "Nama Ayah", name: "namaAyah" }, { label: "Nama Ibu", name: "namaIbu" },
            { label: "Pekerjaan Ortu", name: "pekerjaanOrtu" }, { label: "Pendidikan", name: "pendidikan" }
          ].map(field => (
            <div key={field.name} className="space-y-1">
              <label className="text-[11px] font-black text-slate-500 uppercase">{field.label}</label>
              <input
                type={['nik', 'noHp'].includes(field.name) ? 'tel' : 'text'}
                name={field.name}
                value={editData[field.name] || ''}
                onChange={handleEditInput}
                inputMode={['nik', 'noHp'].includes(field.name) ? 'numeric' : undefined}
                maxLength={field.name === 'nik' ? 16 : field.name === 'noHp' ? 15 : undefined}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none font-semibold text-sm focus:border-emerald-500 transition-colors"
              />
            </div>
          ))}
          
          <div className="space-y-1">
            <label className="text-[11px] font-black text-slate-500 uppercase">Tanggal Lahir</label>
            <input 
              type="date" 
              name="tanggalLahir" 
              value={editData.tanggalLahir || ''} 
              onChange={handleEditInput} 
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none font-semibold text-sm focus:border-emerald-500 transition-colors" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black text-slate-500 uppercase">Status Seleksi</label>
            <select 
              name="status" 
              value={editData.status || ''} 
              onChange={handleEditInput} 
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none font-semibold text-sm focus:border-emerald-500 transition-colors"
            >
              <option value="Aktif">Aktif</option>
              <option value="Diterima">Diterima</option>
              <option value="Ditolak">Ditolak</option>
              <option value="Alumni">Alumni</option>
            </select>
          </div>
          
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] font-black text-slate-500 uppercase">Alamat Lengkap</label>
            <textarea 
              name="alamat" 
              value={editData.alamat || ''} 
              onChange={handleEditInput} 
              rows="2" 
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none font-semibold text-sm focus:border-emerald-500 transition-colors"
            ></textarea>
          </div>
        </div>

        <div className="mt-8 flex flex-col md:flex-row gap-3">
          <button onClick={executeUpdate} disabled={actionLoading} className="flex-1 py-4 bg-[#083316] text-white rounded-xl font-bold hover:bg-[#0a421d] flex justify-center items-center gap-2">
            {actionLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Icon name="save" size={18}/> Simpan Perubahan</>}
          </button>
          <button onClick={() => setEditData(null)} disabled={actionLoading} className="px-6 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200">Batal</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// 4. Delete Santri Modal
export const DeleteSantriModal = ({ deleteData, setDeleteData, executeDelete, actionLoading }) => {
  if (!deleteData) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen strata-modal-backdrop strata-z-modal p-4 animate-in">
      <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl text-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="alert-triangle" size={32} />
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-2">Hapus Data Santri?</h3>
        <p className="text-sm text-slate-500 mb-8">Apakah Anda yakin ingin menghapus data <b>{deleteData.namaLengkap}</b> secara permanen? Tindakan ini tidak dapat dibatalkan.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteData(null)} disabled={actionLoading} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200">Batal</button>
          <button onClick={executeDelete} disabled={actionLoading} className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 flex justify-center items-center gap-2">
            {actionLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Ya, Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
};

// 5. Payment Details Modal (Checklist)
export const PaymentDetailModal = ({
  paymentDetailData,
  setPaymentDetailData,
  tempPaymentState,
  setTempPaymentState,
  isSavingPayment,
  savePaymentChanges
}) => {
  if (!paymentDetailData) return null;
  if (typeof document === 'undefined') return null;

  const tempTotalDibayar = PAYMENT_ITEMS.reduce((sum, item) => tempPaymentState[item.key] ? sum + item.nominal : sum, 0);
  const tempSisa = TOTAL_BIAYA - tempTotalDibayar;

  return createPortal(
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen strata-modal-backdrop strata-z-modal p-4 animate-in">
      <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[95vh]">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
           <div>
             <h3 className="text-xl font-black text-[#083316]">Rincian Pembayaran</h3>
             <p className="text-sm font-bold text-slate-500 mt-0.5">{paymentDetailData.namaLengkap}</p>
           </div>
           <button onClick={() => setPaymentDetailData(null)} disabled={isSavingPayment} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-100 text-slate-500 transition-colors shadow-sm">
             <Icon name="x" size={18}/>
           </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scroll flex-1 space-y-2">
           {PAYMENT_ITEMS.map(item => {
             const isChecked = tempPaymentState[item.key];
             return (
               <div 
                 key={item.key} 
                 className={`flex flex-col p-3.5 border rounded-xl transition-all duration-200 
                   ${isChecked ? 'bg-emerald-50/50 border-emerald-200 shadow-sm' : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50'}`}
               >
                  <button
                    type="button"
                    onClick={() => setTempPaymentState(prev => {
                      const nextVal = !prev[item.key];
                      const newState = { ...prev, [item.key]: nextVal };
                      if (nextVal && !newState[item.key + '_tanggal']) {
                        const today = new Date();
                        const yyyy = today.getFullYear();
                        const mm = String(today.getMonth() + 1).padStart(2, '0');
                        const dd = String(today.getDate()).padStart(2, '0');
                        newState[item.key + '_tanggal'] = `${yyyy}/${mm}/${dd}`;
                      } else if (!nextVal) {
                        newState[item.key + '_tanggal'] = '';
                      }
                      return newState;
                    })}
                    className="flex items-center justify-between cursor-pointer w-full text-left"
                  >
                     <div className="flex items-center gap-3.5">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors 
                          ${isChecked ? 'bg-[#083316] border-[#083316] text-white' : 'bg-white border-slate-300 text-transparent'}`}>
                           <Icon name="check" size={14} strokeWidth={4} />
                        </div>
                        <span className={`font-bold text-sm ${isChecked ? 'text-[#083316]' : 'text-slate-600'}`}>{item.label}</span>
                     </div>
                     <span className={`font-black text-sm tracking-wide ${isChecked ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {formatRupiah(item.nominal)}
                     </span>
                  </button>
                  {isChecked && (
                    <div className="mt-3 pt-3 border-t border-emerald-200/60 flex items-center justify-between animate-in">
                      <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Tanggal Bayar</label>
                      <input 
                        type="text" 
                        placeholder="YYYY/MM/DD"
                        value={tempPaymentState[item.key + '_tanggal'] || ''}
                        onChange={(e) => setTempPaymentState(prev => ({ ...prev, [item.key + '_tanggal']: e.target.value }))}
                        className="w-32 px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs font-bold text-[#083316] outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all text-right"
                      />
                    </div>
                  )}
               </div>
             );
           })}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200/60 rounded-b-[2rem]">
           <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-6 space-y-3">
             <div className="flex justify-between items-center text-[11px] font-black text-slate-400 uppercase tracking-widest">
                <span>Total Tagihan</span>
                <span className="text-slate-800">{formatRupiah(TOTAL_BIAYA)}</span>
             </div>
             <div className="flex justify-between items-center text-xs font-black text-emerald-600 border-t border-slate-100 pt-3">
                <span className="flex items-center gap-1.5"><Icon name="check-circle" size={14}/> Sudah Dibayar</span>
                <span>{formatRupiah(tempTotalDibayar)}</span>
             </div>
             <div className="flex justify-between items-center text-lg font-black text-[#083316] border-t-2 border-slate-100 pt-3">
                <span>Sisa Tagihan</span>
                <span className={tempSisa === 0 ? 'text-emerald-500' : 'text-rose-600'}>
                  {formatRupiah(tempSisa)}
                </span>
             </div>
           </div>

           <div className="flex gap-3">
             <button onClick={() => setPaymentDetailData(null)} disabled={isSavingPayment} className="px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all text-sm">
               Batal
             </button>
             <button onClick={savePaymentChanges} disabled={isSavingPayment} className="flex-1 py-4 bg-[#083316] text-white rounded-2xl font-black hover:bg-[#0a421d] flex justify-center items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all text-base">
               {isSavingPayment ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Icon name="save" size={20}/> Simpan Pembayaran</>}
             </button>
           </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// 6. Bulanan Form Modal (SPP)
export const BulananFormModal = ({
  bulananFormOpen,
  setBulananFormOpen,
  bulananFormMode,
  bulananFormData,
  setBulananFormData,
  saveBulananForm,
  dataSantri
}) => {
  const [showSantriPicker, setShowSantriPicker] = useState(false);
  const [santriSearch, setSantriSearch] = useState('');

  if (!bulananFormOpen) return null;
  if (typeof document === 'undefined') return null;

  const matchedSantri = dataSantri.find(s => s.id === bulananFormData.studentId);

  const isAlumni = (status) => String(status || '').trim().toLowerCase() === 'alumni';
  const activeSantri = dataSantri.filter(s => !isAlumni(s.status));
  const filteredSantri = activeSantri.filter(s =>
    s.namaLengkap.toLowerCase().includes(santriSearch.toLowerCase()) ||
    s.id.toLowerCase().includes(santriSearch.toLowerCase())
  );

  const selectSantri = (santri) => {
    setBulananFormData(prev => ({
      ...prev,
      studentId: santri.id,
      studentName: santri.namaLengkap
    }));
    setShowSantriPicker(false);
    setSantriSearch('');
  };

  return createPortal(
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen strata-modal-backdrop strata-z-modal p-4 animate-in">
      <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-sky-50/40">
          <div>
            <h3 className="text-xl font-black text-[#083316] flex items-center gap-2">
              <Icon name="plus-circle" size={20} className="text-sky-600" />
              {bulananFormMode === 'edit' ? 'Edit Entri Bulanan' : 'Tambah Entri Bulanan'}
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
              Sheet: Bulanan • {bulananFormData.hijriMonth} - {bulananFormData.academicYear} M
            </p>
          </div>
          <button onClick={() => setBulananFormOpen(false)} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-100 text-slate-500 transition-colors shadow-sm">
            <Icon name="x" size={18}/>
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto custom-scroll">
          {/* Student ID Field dengan Popup Picker */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Student ID <span className="text-rose-500">*</span></label>
            <button
              type="button"
              onClick={() => { setShowSantriPicker(true); setSantriSearch(''); }}
              className={`w-full px-4 py-2.5 rounded-xl text-sm text-left transition-all border flex items-center justify-between gap-3
                ${matchedSantri
                  ? 'bg-emerald-50 border-emerald-300 text-[#083316]'
                  : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-sky-400 hover:bg-sky-50'
                }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {matchedSantri ? (
                  <>
                    <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs flex-shrink-0">
                      {matchedSantri.namaLengkap.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[#083316] text-sm truncate">{matchedSantri.namaLengkap}</p>
                      <p className="text-[10px] font-mono text-emerald-600">{matchedSantri.id}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Icon name="user-search" size={16} className="text-slate-400 flex-shrink-0" />
                    <span className="text-slate-400">Klik untuk memilih santri aktif...</span>
                  </>
                )}
              </div>
              <Icon name="chevron-down" size={16} className="text-slate-400 flex-shrink-0" />
            </button>
            {matchedSantri && (
              <p className="text-[10px] text-emerald-600 ml-1 mt-1 flex items-center gap-1">
                <Icon name="check-circle" size={11} /> Tersinkron dengan data santri aktif
              </p>
            )}
          </div>

          {/* Popup Picker Santri */}
          {showSantriPicker && (
            <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen strata-modal-backdrop strata-z-submodal p-4 animate-in">
              <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
                {/* Header Popup */}
                <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
                        <Icon name="users" size={18} className="text-sky-500" />
                        Pilih Santri Aktif
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{activeSantri.length} santri terdaftar</p>
                    </div>
                    <button
                      onClick={() => { setShowSantriPicker(false); setSantriSearch(''); }}
                      className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                    >
                      <Icon name="x" size={16} />
                    </button>
                  </div>
                  {/* Search Bar */}
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-400/10 transition-all">
                    <Icon name="search" size={16} className="text-slate-400 flex-shrink-0" />
                    <input
                      type="text"
                      autoFocus
                      value={santriSearch}
                      onChange={(e) => setSantriSearch(e.target.value)}
                      placeholder="Cari berdasarkan nama atau ID..."
                      className="bg-transparent outline-none text-sm text-slate-700 w-full"
                    />
                    {santriSearch && (
                      <button onClick={() => setSantriSearch('')} className="text-slate-400 hover:text-slate-600">
                        <Icon name="x" size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Daftar Santri */}
                <div className="overflow-y-auto custom-scroll flex-1 p-3">
                  {filteredSantri.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                      <Icon name="search-x" size={36} className="mb-3 opacity-30" />
                      <p className="text-sm">Tidak ada santri ditemukan.</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {filteredSantri.map((santri) => (
                        <button
                          key={santri.id}
                          type="button"
                          onClick={() => selectSantri(santri)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left group
                            ${
                              bulananFormData.studentId === santri.id
                                ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                                : 'bg-white border-slate-100 hover:bg-sky-50 hover:border-sky-200'
                            }`}
                        >
                          {/* Avatar */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors
                            ${
                              bulananFormData.studentId === santri.id
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-500 group-hover:bg-sky-100 group-hover:text-sky-700'
                            }`}>
                            {santri.namaLengkap.charAt(0)}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{santri.namaLengkap}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono text-slate-400">{santri.id}</span>
                              <span className="text-[10px] text-slate-300">•</span>
                              <span className="text-[10px] text-slate-400">{santri.pendidikan}</span>
                            </div>
                          </div>

                          {/* Status & Jenis Kelamin */}
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full
                              ${santri.jenisKelamin === 'Laki-laki' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                              {santri.jenisKelamin === 'Laki-laki' ? 'Putra' : 'Putri'}
                            </span>
                            {bulananFormData.studentId === santri.id && (
                              <Icon name="check-circle" size={14} className="text-emerald-500" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer info */}
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center">
                  <p className="text-[10px] text-slate-400">
                    Menampilkan <strong>{filteredSantri.length}</strong> dari <strong>{activeSantri.length}</strong> santri aktif
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Student Name</label>
            <input 
              type="text" 
              value={bulananFormData.studentName}
              onChange={(e) => setBulananFormData(prev => ({ ...prev, studentName: e.target.value }))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all outline-none"
              placeholder="Otomatis terisi sesuai DataSantri"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Academic Year</label>
              <select 
                value={bulananFormData.academicYear}
                onChange={(e) => setBulananFormData(prev => ({ ...prev, academicYear: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all"
              >
                {TAHUN_AJARAN_LIST.map(ta => <option key={ta.masehi} value={ta.masehi}>{ta.masehi} M / {ta.hijriah} H</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Hijri Month <span className="text-rose-500">*</span></label>
              <select 
                value={bulananFormData.hijriMonth}
                onChange={(e) => setBulananFormData(prev => ({ ...prev, hijriMonth: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all"
              >
                {ISLAMIC_MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-3">
             <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2 mb-2">
               Rincian Tagihan Bulanan
             </h4>
             {BULANAN_ITEMS.map(item => {
               const isChecked = bulananFormData[item.key];
               return (
                 <div 
                   key={item.key} 
                   className={`flex flex-col p-3.5 border rounded-xl transition-all duration-200 
                     ${isChecked ? 'bg-sky-50/50 border-sky-200 shadow-sm' : 'bg-white border-slate-200 hover:border-sky-300 hover:bg-slate-50'}`}
                 >
                    <button
                      type="button"
                      onClick={() => setBulananFormData(prev => {
                        const nextVal = !prev[item.key];
                        const newState = { ...prev, [item.key]: nextVal };
                        if (nextVal && !newState[item.key + '_tanggal']) {
                          const today = new Date();
                          const yyyy = today.getFullYear();
                          const mm = String(today.getMonth() + 1).padStart(2, '0');
                          const dd = String(today.getDate()).padStart(2, '0');
                          newState[item.key + '_tanggal'] = `${yyyy}/${mm}/${dd}`;
                        } else if (!nextVal) {
                          newState[item.key + '_tanggal'] = '';
                        }
                        return newState;
                      })}
                      className="flex items-center justify-between cursor-pointer w-full text-left"
                    >
                       <div className="flex items-center gap-3.5">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors 
                            ${isChecked ? 'bg-sky-600 border-sky-600 text-white' : 'bg-white border-slate-300 text-transparent'}`}>
                             <Icon name="check" size={14} strokeWidth={4} />
                          </div>
                          <span className={`font-bold text-sm ${isChecked ? 'text-sky-900' : 'text-slate-600'}`}>{item.label}</span>
                       </div>
                       <span className={`font-black text-sm tracking-wide ${isChecked ? 'text-sky-700' : 'text-slate-400'}`}>
                          {formatRupiah(item.nominal)}
                       </span>
                    </button>
                    {isChecked && (
                      <div className="mt-3 pt-3 border-t border-sky-200/60 flex items-center justify-between animate-in">
                        <label className="text-[10px] font-black text-sky-700 uppercase tracking-widest">Tanggal Bayar</label>
                        <input 
                          type="text" 
                          placeholder="YYYY/MM/DD"
                          value={bulananFormData[item.key + '_tanggal'] || ''}
                          onChange={(e) => setBulananFormData(prev => ({ ...prev, [item.key + '_tanggal']: e.target.value }))}
                          className="w-32 px-3 py-1.5 bg-white border border-sky-200 rounded-lg text-xs font-bold text-sky-900 outline-none focus:ring-2 focus:ring-sky-500/30 transition-all text-right"
                        />
                      </div>
                    )}
                 </div>
               );
             })}
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button onClick={() => setBulananFormOpen(false)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all text-sm">
            Batal
          </button>
          <button onClick={saveBulananForm} className="flex-[2] py-3 bg-[#083316] text-white rounded-xl font-black hover:bg-[#0a421d] transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 text-sm">
            <Icon name="save" size={16} /> Simpan ke Sheet Bulanan
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// 7. User Manager Form Modal
export const UserFormModal = ({
  showUserForm,
  setShowUserForm,
  userFormData,
  setUserFormData,
  userList,
  setUserList,
  setAlert
}) => {
  if (!showUserForm) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen strata-modal-backdrop strata-z-modal p-4 animate-in">
      <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl relative p-8">
        <button onClick={() => setShowUserForm(false)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500">
          <Icon name="x" size={18}/>
        </button>
        <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <Icon name={userFormData.id ? "user-cog" : "user-plus"} className="text-emerald-600" size={24}/> 
          {userFormData.id ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
        </h3>
        
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Lengkap</label>
            <input type="text" value={userFormData.nama} onChange={(e) => setUserFormData({...userFormData, nama: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none font-semibold text-sm focus:border-emerald-500 transition-colors" placeholder="Nama pengguna" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Username Login</label>
            <input type="text" value={userFormData.username} onChange={(e) => setUserFormData({...userFormData, username: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none font-semibold text-sm focus:border-emerald-500 transition-colors" placeholder="Masukkan username" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">{userFormData.id ? 'Password Baru (Opsional)' : 'Password Akses'}</label>
            <input type="password" value={userFormData.password} onChange={(e) => setUserFormData({...userFormData, password: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none font-semibold text-sm focus:border-emerald-500 transition-colors" placeholder="********" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Hak Akses</label>
            <select value={userFormData.role} onChange={(e) => setUserFormData({...userFormData, role: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none font-semibold text-sm focus:border-emerald-500 transition-colors">
              <option value="Super Admin">Super Admin</option>
              <option value="Admin Keuangan">Admin Keuangan</option>
              <option value="Admin Pendaftaran">Admin Pendaftaran</option>
            </select>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button onClick={() => setShowUserForm(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200">Batal</button>
          <button onClick={() => {
              if(!userFormData.nama || !userFormData.username) return setAlert({type: 'error', text: 'Nama dan Username wajib diisi!'});
              if(userFormData.id) {
                 setUserList(prev => prev.map(u => u.id === userFormData.id ? userFormData : u));
                 setAlert({type: 'success', text: 'Data pengguna berhasil diperbarui!'});
              } else {
                 setUserList(prev => [...prev, { ...userFormData, id: Date.now() }]);
                 setAlert({type: 'success', text: 'Pengguna baru berhasil ditambahkan!'});
              }
              setShowUserForm(false);
          }} className="flex-1 py-3 bg-[#083316] text-white rounded-xl font-bold hover:bg-[#0a421d] flex justify-center items-center gap-2">
            <Icon name="save" size={16}/> Simpan
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// 8. Keuangan Form Modal (NEW)
export const KeuanganFormModal = ({
  keuanganFormOpen,
  setKeuanganFormOpen,
  keuanganFormData,
  setKeuanganFormData,
  keuanganFormMode,
  onSave,
  setAlert,
  selectedTahunAjaran,
  dataSantri
}) => {
  if (!keuanganFormOpen) return null;
  if (typeof document === 'undefined') return null;

  const isEdit = keuanganFormMode === 'edit';
  const data = keuanganFormData || {};
  const kategoriList = data.tipe === 'pengeluaran' ? KATEGORI_PENGELUARAN : KATEGORI_PEMASUKAN;

  const handleChange = (field, value) => {
    setKeuanganFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTipeChange = (newTipe) => {
    setKeuanganFormData(prev => ({
      ...prev,
      tipe: newTipe,
      kategori: newTipe === 'pengeluaran' ? KATEGORI_PENGELUARAN[0].key : KATEGORI_PEMASUKAN[0].key
    }));
  };

  const handleSubmit = () => {
    if (!data.deskripsi || !data.deskripsi.trim()) {
      setAlert && setAlert({ type: 'error', text: 'Deskripsi wajib diisi.' });
      return;
    }
    if (!data.nominal || Number(data.nominal) <= 0) {
      setAlert && setAlert({ type: 'error', text: 'Nominal harus lebih dari 0.' });
      return;
    }
    if (!data.tanggal) {
      setAlert && setAlert({ type: 'error', text: 'Tanggal wajib diisi.' });
      return;
    }
    onSave();
  };

  return createPortal(
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen strata-modal-backdrop strata-z-modal p-4 animate-in">
      <div className="bg-white rounded-[2rem] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-7 py-5 border-b border-slate-100 rounded-t-[2rem] z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ${
                data.tipe === 'pengeluaran'
                  ? 'bg-gradient-to-br from-rose-400 to-rose-600 shadow-rose-500/20'
                  : 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/20'
              }`}>
                <Icon name={data.tipe === 'pengeluaran' ? 'minus' : 'plus'} size={20} />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-lg">
                  {isEdit ? 'Edit Transaksi' : data.tipe === 'pengeluaran' ? 'Tambah Pengeluaran' : 'Tambah Pemasukan'}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {data.tipe === 'pengeluaran' ? 'Pencatatan pengeluaran' : 'Pencatatan pemasukan'}
                </p>
              </div>
            </div>
            <button onClick={() => setKeuanganFormOpen(false)} className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 hover:text-slate-600 transition-all">
              <Icon name="x" size={18} />
            </button>
          </div>
        </div>

        <div className="p-7 space-y-5">
          {/* Tipe Toggle */}
          {!isEdit && (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tipe Transaksi</label>
              <div className="flex gap-2">
                <button onClick={() => handleTipeChange('pemasukan')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all border ${
                    data.tipe === 'pemasukan'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                  }`}>
                  <Icon name="trending-up" size={14} /> Pemasukan
                </button>
                <button onClick={() => handleTipeChange('pengeluaran')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all border ${
                    data.tipe === 'pengeluaran'
                      ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                  }`}>
                  <Icon name="trending-down" size={14} /> Pengeluaran
                </button>
              </div>
            </div>
          )}

          {/* Tanggal */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tanggal</label>
            <input type="date" value={data.tanggal || ''} onChange={e => handleChange('tanggal', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none transition-all" />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Kategori</label>
            <select value={data.kategori || ''} onChange={e => handleChange('kategori', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none transition-all bg-white cursor-pointer">
              {kategoriList.map(k => (
                <option key={k.key} value={k.key}>{k.label}</option>
              ))}
            </select>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Deskripsi</label>
            <input type="text" value={data.deskripsi || ''} onChange={e => handleChange('deskripsi', e.target.value)}
              placeholder="Contoh: Pembayaran listrik bulan Mei"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none transition-all placeholder-slate-300" />
          </div>

          {/* Nominal */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nominal (Rp)</label>
            <input type="number" value={data.nominal || ''} onChange={e => handleChange('nominal', e.target.value)}
              placeholder="0"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-black text-slate-700 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none transition-all placeholder-slate-300" />
          </div>

          {/* Bulan Hijri */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Bulan Hijriah <span className="text-slate-300">(Opsional)</span></label>
            <select value={data.bulanHijri || ''} onChange={e => handleChange('bulanHijri', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none transition-all bg-white cursor-pointer">
              <option value="">— Pilih Bulan —</option>
              {ISLAMIC_MONTHS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Referensi */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Referensi / ID Santri <span className="text-slate-300">(Opsional)</span></label>
            <input type="text" value={data.referensi || ''} onChange={e => handleChange('referensi', e.target.value)}
              placeholder="Contoh: NJ-2026-1234"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none transition-all placeholder-slate-300" />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-7 pb-7">
          <div className="flex gap-3">
            <button onClick={() => setKeuanganFormOpen(false)}
              className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">
              Batal
            </button>
            <button onClick={handleSubmit}
              className={`flex-1 py-3 text-white rounded-xl font-bold flex justify-center items-center gap-2 shadow-md transition-all ${
                data.tipe === 'pengeluaran'
                  ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
              }`}>
              <Icon name="save" size={16} /> Simpan
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
