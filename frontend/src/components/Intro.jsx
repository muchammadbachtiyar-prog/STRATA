import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
const logoImg = '/Logo Strata.png';

export const Intro = ({ onStart }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Memberikan sedikit delay agar transisi masuk terlihat mulus
    const timer = setTimeout(() => {
      setMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`strata-auth strata-auth--intro fixed inset-0 z-50 flex items-center justify-center font-jakarta overflow-hidden bg-slate-900 transition-opacity duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* Background gradients & decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#083316] via-[#05210e] to-black"></div>
      
      {/* Glowing orbs in background */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-700/20 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-emerald-300/5 rounded-full blur-[80px] pointer-events-none animate-float-delayed"></div>

      {/* Main Content Container */}
      <div className={`relative z-10 flex flex-col items-center justify-center text-center px-6 transition-all duration-1000 transform ${mounted ? 'translate-y-0 scale-100' : 'translate-y-12 scale-95'}`}>
        
        {/* Logo Container */}
        <div className="flex items-center gap-6 sm:gap-8 mb-8 justify-center">
          
          {/* S Logo */}
          <div className="relative group cursor-default">
            <div className="absolute inset-0 bg-emerald-400 rounded-3xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500"></div>
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-[#10b981] to-[#047857] rounded-[2rem] flex items-center justify-center shadow-[0_20px_50px_-10px_rgba(16,185,129,0.5)] transform group-hover:scale-105 group-hover:-translate-y-2 transition-all duration-500 border border-emerald-300/30 overflow-hidden">
              {/* Inner shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <span className="font-black text-5xl sm:text-6xl text-white drop-shadow-md">S</span>
            </div>
          </div>

          {/* Custom Pesantren Logo */}
          <div className="relative group cursor-default">
            <div className="absolute inset-0 bg-white/10 rounded-3xl blur-xl opacity-20 group-hover:opacity-50 transition-opacity duration-500"></div>
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-[2rem] flex items-center justify-center shadow-[0_20px_50px_-10px_rgba(255,255,255,0.15)] transform group-hover:scale-105 group-hover:-translate-y-2 transition-all duration-500 border border-white/20 overflow-hidden p-4">
              {/* Inner shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-emerald-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <img 
                src={logoImg} 
                alt="Logo Pesantren" 
                className="w-full h-full object-contain drop-shadow-md" 
              />
            </div>
          </div>

        </div>

        {/* Text Content */}
        <div className="mb-12 max-w-xl">
          <div className="overflow-hidden mb-2">
            <h1 className={`font-black text-5xl sm:text-6xl md:text-7xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-100 via-white to-emerald-200 leading-tight transition-transform duration-1000 delay-300 ${mounted ? 'translate-y-0' : 'translate-y-full'}`}>
              STRATA
            </h1>
          </div>
          <div className={`transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <p className="text-emerald-400 font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase text-xs sm:text-sm mb-4">
              Pondok Pesantren Nailul Jannah
            </p>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-medium">
              Santri Tabular Reporting & Academic Tracking.<br className="hidden sm:block" /> 
              Sistem manajemen administrasi, akademik, dan keuangan terpadu.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className={`transition-all duration-1000 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <button 
            onClick={onStart}
            className="group relative px-8 py-4 bg-emerald-500 text-white rounded-2xl font-bold text-lg flex items-center gap-3 overflow-hidden shadow-[0_10px_30px_-10px_rgba(16,185,129,0.6)] transform hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(16,185,129,0.8)] transition-all duration-300 active:scale-95"
          >
            {/* Button background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <span className="relative z-10">Masuk ke Sistem</span>
            <div className="relative z-10 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:bg-white group-hover:text-emerald-700 transition-colors duration-300">
              <Icon name="arrow-right" size={18} className="transform group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>

      </div>

      {/* Footer Text */}
      <div className={`absolute bottom-6 sm:bottom-10 w-full text-center transition-opacity duration-1000 delay-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <p className="text-slate-500 text-xs font-semibold tracking-wide">
          &copy; {new Date().getFullYear()} Yayasan Nailul Jannah. All rights reserved.
        </p>
      </div>
    </div>
  );
};
