import React from 'react';
import { Icon } from './Icon';
import manualBookUrl from '../assets/Manual Book STRATA Final.docx?url';

const MANUAL_BOOK_FILE_NAME = 'Manual Book STRATA Final.docx';

export const PanduanTab = () => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = manualBookUrl;
    link.download = MANUAL_BOOK_FILE_NAME;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="strata-panduan-page w-full max-w-3xl mx-auto animate-in pb-10">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#083316] via-emerald-800 to-emerald-900 rounded-[2rem] p-8 md:p-10 text-white shadow-xl">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-xl flex items-center justify-center shadow-lg border border-white/20">
            <Icon name="book-open" size={38} className="text-white" />
          </div>
          <div>
            <p className="text-emerald-300 text-xs font-black uppercase tracking-[0.2em] mb-2">Dokumentasi STRATA</p>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Manual Book STRATA</h1>
            <p className="text-emerald-100 text-sm font-medium leading-relaxed max-w-xl mt-3">
              Unduh Manual Book STRATA untuk melihat panduan penggunaan sistem secara lengkap.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white text-emerald-800 font-black text-sm shadow-lg shadow-emerald-950/20 hover:bg-emerald-50 active:scale-[0.98] transition-all"
          >
            <Icon name="download" size={19} />
            Download Manual Book
          </button>
        </div>
      </section>

      <p className="text-center text-xs text-slate-400 font-medium mt-5">
        File: {MANUAL_BOOK_FILE_NAME}
      </p>
    </div>
  );
};
