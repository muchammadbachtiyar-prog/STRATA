import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Icon } from './Icon';
import { LaporanA4Ref } from './LaporanA4Ref';

export const LaporanPreviewModal = ({ 
  isOpen, 
  onClose, 
  currentUser,
  santriList = [],
  allBulananData = []
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [scale, setScale] = useState(0.8); // Default comfortable scale for viewing

  if (!isOpen) return null;

  const handleDownloadPDF = async () => {
    const element = document.getElementById('a4-laporan-container');
    if (!element) {
      alert('Elemen laporan tidak ditemukan.');
      return;
    }

    try {
      setIsDownloading(true);

      const canvas = await html2canvas(element, {
        scale: 2.5, // High DPI resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297

      // Calculate ratio if content spans multiple pages
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`Laporan_A4_PPNJ_M_Najih_Murtadlo_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Gagal mengunduh PDF: ' + (err.message || 'Terjadi kesalahan sistem'));
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
      
      {/* ── TOP ACTION BAR ── */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between shadow-lg text-white flex-shrink-0 no-print">
        
        {/* Left: Info */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Icon name="file-text" size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-100">Pratinjau PDF Laporan (A4 & 9:16 View)</h3>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Rasio 9:16 / Paper A4
              </span>
            </div>
            <p className="text-xs text-slate-400">
              TTD Pengurus: <strong className="text-slate-200 font-semibold">M. Najih Murtadlo</strong> | Data Sistem Terbaru
            </p>
          </div>
        </div>

        {/* Center: Scale controls */}
        <div className="hidden md:flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-300">
          <span className="text-[11px] font-medium text-slate-400">Skala Tampilan:</span>
          <button 
            onClick={() => setScale(0.6)} 
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${scale === 0.6 ? 'bg-emerald-600 text-white shadow-sm' : 'hover:bg-slate-700 text-slate-300'}`}
          >
            60%
          </button>
          <button 
            onClick={() => setScale(0.8)} 
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${scale === 0.8 ? 'bg-emerald-600 text-white shadow-sm' : 'hover:bg-slate-700 text-slate-300'}`}
          >
            80%
          </button>
          <button 
            onClick={() => setScale(1.0)} 
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${scale === 1.0 ? 'bg-emerald-600 text-white shadow-sm' : 'hover:bg-slate-700 text-slate-300'}`}
          >
            100%
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Download PDF button */}
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-lg shadow-emerald-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Mengunduh...</span>
              </>
            ) : (
              <>
                <Icon name="download" size={16} />
                <span>Unduh PDF</span>
              </>
            )}
          </button>

          {/* Cetak A4 button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 font-bold text-xs px-4 py-2 rounded-xl border border-slate-700 transition-all shadow-md"
          >
            <Icon name="printer" size={16} />
            <span className="hidden sm:inline">Cetak A4</span>
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            title="Tutup Pratinjau"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

      </div>

      {/* ── MAIN SCROLLABLE VIEWPORT IN 9:16 RATIO FRAME ── */}
      <div className="flex-1 overflow-auto custom-scroll p-4 sm:p-8 flex justify-center items-start bg-slate-950/70">
        <div 
          className="transition-transform duration-200 origin-top shadow-2xl rounded-sm aspect-[9/16] bg-white overflow-y-auto custom-scroll border border-slate-700"
          style={{ transform: `scale(${scale})` }}
        >
          <LaporanA4Ref 
            santriList={santriList}
            allBulananData={allBulananData}
            customDate="26 Juli 2026" 
            pimpinanName="M. Najih Murtadlo" 
          />
        </div>
      </div>

    </div>
  );
};
