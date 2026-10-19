import React from 'react';
import { Icon } from './Icon';

export const TambahSantriModal = ({ open, onClose, onNavigate }) => {
  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in"
      onClick={onClose}
    >
      <div 
        className="bg-white/90 backdrop-blur-2xl rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden border border-white/80 flex flex-col transform transition-all duration-300 scale-100 animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#083316] to-emerald-700 px-7 pt-8 pb-7">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-12 -mt-12 blur-xl"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full -ml-8 -mb-8 blur-lg"></div>
          
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
              <Icon name="user-plus" size={26} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-black text-lg leading-tight">Tambah Santri Baru</h3>
              <p className="text-emerald-100/80 text-xs font-medium mt-1">Nailul Jannah</p>
            </div>
          </div>

          {/* Close button */}
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-white/30 hover:text-white transition-all z-20"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-7 space-y-4">
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            Daftarkan santri baru ke sistem Nailul Jannah. Anda akan diarahkan ke formulir pendaftaran.
          </p>

          {/* Info cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 text-center">
              <Icon name="file-text" size={20} className="text-emerald-600 mx-auto mb-1.5" />
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Formulir</p>
              <p className="text-[10px] text-emerald-500 font-medium mt-0.5">Data lengkap</p>
            </div>
            <div className="bg-sky-50 border border-sky-100 rounded-xl p-3.5 text-center">
              <Icon name="shield-check" size={20} className="text-sky-600 mx-auto mb-1.5" />
              <p className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">Validasi</p>
              <p className="text-[10px] text-sky-500 font-medium mt-0.5">Otomatis</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3 pt-2">
            <button 
              onClick={() => {
                onNavigate('pendaftaran');
                onClose();
              }}
              className="w-full py-3.5 bg-gradient-to-r from-[#083316] to-emerald-700 text-white rounded-xl font-bold hover:from-[#0a421d] hover:to-emerald-800 transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-900/20 text-sm active:scale-[0.98]"
            >
              <Icon name="user-plus" size={18} />
              Mulai Pendaftaran
              <Icon name="arrow-right" size={16} className="ml-1" />
            </button>
            
            <button 
              onClick={onClose}
              className="w-full py-3 border border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wide rounded-xl hover:bg-slate-50 hover:text-slate-700 transition-all active:scale-[0.98]"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
