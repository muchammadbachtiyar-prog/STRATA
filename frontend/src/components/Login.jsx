import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { getScriptErrorMessage } from '../utils/helpers';
import { isLocalMode } from '../services/scriptRun';
import { loginWithPassword } from '../services/authService';
const logoImg = '/Logo Strata.png';

export const Login = ({ onLogin, initialMessage = '' }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    remember: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(initialMessage);

  useEffect(() => {
    try {
      const rememberedUsername = localStorage.getItem('ppnj_admin_username');
      if (rememberedUsername) {
        setFormData(prev => ({ ...prev, username: rememberedUsername, remember: true }));
      }
    } catch (err) {}
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await loginWithPassword(formData.username, formData.password);
      if (formData.remember) {
        localStorage.setItem('ppnj_admin_username', formData.username);
      } else {
        localStorage.removeItem('ppnj_admin_username');
      }
      if (onLogin) onLogin(response.user);
    } catch (err) {
      setErrorMsg(err.message || ('Gagal terhubung ke server: ' + getScriptErrorMessage(err)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="strata-auth strata-auth--login font-jakarta min-h-screen w-full flex items-center justify-center p-4 md:p-6 relative overflow-hidden bg-slate-50 selection:bg-emerald-200 selection:text-emerald-900 text-slate-800">
      
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[350px] h-[350px] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <div className="w-full max-w-[900px] bg-white rounded-[1.8rem] shadow-[0_18px_48px_-18px_rgba(8,51,22,0.15)] flex flex-col md:flex-row overflow-hidden relative z-10 min-h-[520px]">
        
        <div className="w-full md:w-1/2 lg:w-7/12 bg-white p-8 md:p-12 lg:p-16 flex flex-col justify-center relative order-2 md:order-1">
          
          <div className="md:hidden flex items-center gap-3 mb-10">
             <div className="w-10 h-10 flex items-center justify-center">
               <img src={logoImg} alt="Logo" className="w-full h-full object-contain" />
             </div>
             <div>
               <h1 className="font-black text-[#083316] text-lg leading-none">STRATA</h1>
               <p className="text-[10px] text-emerald-700/70 font-semibold">Nailul Jannah</p>
             </div>
          </div>

          <div className="max-w-sm w-full mx-auto">
            <div className="mb-10">
              <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-3 tracking-tight">Selamat Datang</h2>
              <p className="text-slate-500 font-medium leading-relaxed">Sistem ini dibatasi khusus untuk Pengurus Pondok Pesantren. Silakan masuk untuk melanjutkan.</p>
              {isLocalMode() && (
                <p className="mt-3 text-xs font-semibold text-amber-600">Local Preview: gunakan admin / admin123</p>
              )}
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 animate-in">
                <Icon name="alert-triangle" size={20} className="text-rose-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-rose-600 leading-relaxed">{errorMsg}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Username</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#083316] transition-colors">
                    <Icon name="user" size={18} />
                  </div>
                  <input 
                    type="text" name="username" required
                    value={formData.username} onChange={handleChange}
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-[#083316] focus:ring-4 focus:ring-emerald-900/10 transition-all"
                    placeholder="Masukkan username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                   <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Password</label>
                   <button type="button" className="text-[11px] font-bold text-emerald-600 hover:text-[#083316] transition-colors">Lupa Password?</button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#083316] transition-colors">
                    <Icon name="lock" size={18} />
                  </div>
                  <input 
                    type="password" name="password" required
                    value={formData.password} onChange={handleChange}
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-[#083316] focus:ring-4 focus:ring-emerald-900/10 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-start gap-3">
                <div className="flex items-center h-5">
                  <input 
                    id="remember" name="remember" type="checkbox"
                    checked={formData.remember} onChange={handleChange}
                    className="w-5 h-5 border-2 border-slate-300 rounded-lg text-[#083316] checkbox-custom focus:ring-[#083316] focus:ring-offset-2 transition-all cursor-pointer"
                  />
                </div>
                <label htmlFor="remember" className="text-sm font-medium text-slate-500 cursor-pointer pt-0.5">
                  Ingat saya di perangkat ini
                </label>
              </div>

              <div className="pt-6">
                <button 
                  type="submit" disabled={isLoading}
                  className="w-full py-4 bg-[#083316] text-white rounded-2xl font-black text-sm lg:text-base flex items-center justify-center gap-2 hover:bg-[#0a421d] hover:shadow-[0_10px_20px_-10px_rgba(8,51,22,0.5)] transform hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>Masuk Sistem <Icon name="log-in" size={18} /></>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>

        <div className="w-full md:w-1/2 lg:w-5/12 bg-gradient-to-br from-[#0a421d] to-[#041a0b] p-8 md:p-12 text-white relative overflow-hidden flex flex-col justify-between order-1 md:order-2 hidden md:flex">
          
          <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/20 rounded-full -ml-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full -mr-32 -mb-32 blur-3xl"></div>

          <div className="relative z-10 flex items-center justify-end gap-4 animate-in">
            <div className="text-right">
              <h1 className="text-[11px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1.5">Portal Keamanan</h1>
              <h2 className="font-bold text-sm leading-none tracking-tight text-emerald-50 opacity-90">Akses Terbatas</h2>
            </div>
            <div className="w-12 h-12 flex items-center justify-center">
              <img src={logoImg} alt="Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          <div className="relative z-10 flex-1 flex items-center justify-center my-12">
            <div className="absolute top-4 left-4 animate-float text-emerald-200/60 drop-shadow-lg">
              <Icon name="shield-check" size={32} />
            </div>
            <div className="absolute top-10 right-8 animate-float-delayed text-emerald-300/70">
              <Icon name="star" size={20} />
            </div>
            <div className="absolute bottom-12 right-6 animate-float text-emerald-100/50">
              <Icon name="server" size={28} />
            </div>
            <div className="absolute bottom-4 left-10 animate-float-fast text-emerald-400/60">
              <Icon name="key" size={24} />
            </div>

            <div className="w-64 h-64 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center relative shadow-[0_0_40px_rgba(16,185,129,0.1)]">
              <div className="absolute inset-4 border border-emerald-500/20 rounded-full border-dashed animate-[spin_20s_linear_infinite]"></div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-900/50 mb-[-10px] z-20">
                  <Icon name="lock" size={40} className="text-white" />
                </div>
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 transform -rotate-12 translate-x-2">
                    <Icon name="fingerprint" size={24} className="text-emerald-200" />
                  </div>
                  <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 transform rotate-12 -translate-x-2">
                    <Icon name="shield" size={24} className="text-emerald-200" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 text-right">
            <h2 className="text-3xl lg:text-4xl font-black leading-[1.1] mb-4">
              STRATA <br/><span className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-300 to-emerald-100 text-xl font-bold">Santri Tabular Reporting &<br/>Academic Tracking Architecture</span>
            </h2>
            <p className="text-emerald-100/70 text-sm font-medium leading-relaxed ml-auto max-w-sm">
              Privasi dan kerahasiaan data santri adalah prioritas utama kami. Sistem ini dienkripsi dengan standar keamanan tingkat tinggi.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
