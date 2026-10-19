import React, { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { getSessionToken } from '../services/authService';
import { callAppsScript } from '../services/scriptRun';
import { headersMatch, IMPORT_TARGETS, parseCsvFile } from '../services/csvImport';

export const SimpleImportModal = ({ open, onClose, onDone, setAlert }) => {
  const [target, setTarget] = useState('santri');
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [replaceAll, setReplaceAll] = useState(false);
  const [replaceConfirmation, setReplaceConfirmation] = useState('');

  useEffect(() => {
    if (open) {
      setTarget('santri'); setFile(null); setParsed(null); setError(''); setBusy(false); setReplaceAll(false); setReplaceConfirmation('');
    }
  }, [open]);

  if (!open) return null;
  const config = IMPORT_TARGETS[target];

  const chooseFile = async selected => {
    setFile(selected); setParsed(null); setError('');
    try {
      const data = await parseCsvFile(selected);
      if (!headersMatch(data.headers, config.headers)) {
        throw new Error('Header file tidak sesuai dengan target yang dipilih. Gunakan template CSV yang sesuai.');
      }
      setParsed(data);
    } catch (err) { setError(err.message || 'File tidak dapat dibaca.'); }
  };

  const submit = async () => {
    if (!parsed) return;
    setBusy(true); setError('');
    try {
      const result = await callAppsScript('importCsvData', [getSessionToken(), { target, replaceAll, replaceConfirmation, headers: parsed.headers, rows: parsed.rows, fileName: parsed.fileName }]);
      if (!result?.success) throw new Error(result?.message || 'Impor gagal.');
      setAlert({ type: 'success', text: result.message || 'Data berhasil diimpor.' });
      onDone?.(); onClose();
    } catch (err) { setError(err.message || 'Impor gagal.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="simple-import-title">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div><h2 id="simple-import-title" className="text-xl font-black text-slate-800">Import Data</h2><p className="text-xs text-slate-500 mt-1">Pilih target, pilih CSV, lalu impor.</p></div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100" aria-label="Tutup"><Icon name="x" size={20} /></button>
        </div>
        <div className="p-6 space-y-5">
          <label className="block"><span className="block text-xs font-bold text-slate-600 mb-2">Jenis data</span><select value={target} onChange={e => { setTarget(e.target.value); setParsed(null); setError(''); setReplaceAll(false); setReplaceConfirmation(''); }} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-semibold outline-none focus:border-emerald-500">{Object.entries(IMPORT_TARGETS).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select></label>
          <label className="block border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors"><Icon name="file-up" size={28} className="mx-auto text-emerald-600 mb-2" /><span className="block text-sm font-bold text-slate-700">{file?.name || 'Pilih file CSV'}</span><span className="block text-xs text-slate-400 mt-1">Header harus sesuai template {config.label}</span><input type="file" accept=".csv,text/csv" className="hidden" onChange={e => chooseFile(e.target.files?.[0])} /></label>
          {target === 'santri' && <div className={`rounded-2xl border p-4 space-y-3 ${replaceAll ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-slate-50'}`}>
            <label className="flex items-start gap-3 cursor-pointer"><input type="checkbox" checked={replaceAll} onChange={e => { setReplaceAll(e.target.checked); setReplaceConfirmation(''); }} className="mt-1 h-4 w-4 accent-rose-600" /><span><strong className="block text-sm text-slate-800">Ganti semua data santri</strong><span className="block text-xs text-slate-500 mt-1">DataSantri, tagihan tahunan, dan tagihan bulanan lama akan dikosongkan.</span></span></label>
            {replaceAll && <label className="block"><span className="block text-xs font-bold text-rose-700 mb-1">Ketik GANTI untuk melanjutkan</span><input value={replaceConfirmation} onChange={e => setReplaceConfirmation(e.target.value)} placeholder="GANTI" className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-white text-sm outline-none focus:border-rose-500" /></label>}
          </div>}
          {parsed && <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-800"><strong>{parsed.rows.length} baris siap diimpor.</strong><div className="mt-2 overflow-x-auto"><table className="text-[11px] whitespace-nowrap"><tbody>{parsed.rows.slice(0, 3).map((row, i) => <tr key={i}>{row.slice(0, 4).map((cell, j) => <td key={j} className="pr-4 py-1">{cell || '-'}</td>)}</tr>)}</tbody></table></div></div>}
          {error && <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 text-sm text-rose-700 flex gap-2"><Icon name="alert-circle" size={17} className="shrink-0" />{error}</div>}
          <p className="text-[11px] text-slate-400">{replaceAll ? 'Mode ganti semua: data lama dan tagihan terkait akan dihapus sebelum data baru disimpan.' : 'Impor bersifat tambah data. Data lama tidak dihapus.'}</p>
        </div>
        <div className="px-6 pb-6 flex gap-3"><button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-600">Batal</button><button onClick={submit} disabled={!parsed || busy || (replaceAll && replaceConfirmation.trim().toUpperCase() !== 'GANTI')} className={`flex-1 py-3 rounded-xl text-white font-bold disabled:opacity-40 ${replaceAll ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-700 hover:bg-emerald-800'}`}>{busy ? 'Memproses...' : replaceAll ? 'Ganti Semua Data' : 'Impor Sekarang'}</button></div>
      </div>
    </div>
  );
};
