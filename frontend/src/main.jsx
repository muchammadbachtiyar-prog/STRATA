import React, { useState, useEffect, Component } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { Login } from './components/Login';
import { Intro } from './components/Intro';
import {
  revokeCurrentSession,
  clearSessionToken
} from './services/authService';
import './index.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught application error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
          <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mb-4 border border-rose-500/30">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Terjadi Kendala Memuat Aplikasi</h2>
          <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            {this.state.error?.message || 'Terjadi kesalahan saat inisialisasi aplikasi.'}
          </p>
          <button
            onClick={() => {
              try { sessionStorage.clear(); } catch (e) {}
              window.location.reload();
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-950/50"
          >
            Muat Ulang Aplikasi
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const MainApp = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [authState, setAuthState] = useState('checking');
  const [currentUser, setCurrentUser] = useState(null);
  const [authMessage, setAuthMessage] = useState('');
  const [transitionState, setTransitionState] = useState('intro-active');

  useEffect(() => {
    // Mode tanpa session: setiap reload meminta login kembali.
    setAuthState('unauthenticated');
  }, []);

  const handleStartIntro = () => {
    setTransitionState('intro-leaving');
    setTimeout(() => {
      setShowIntro(false);
      setTransitionState('login-active');
    }, 800);
  };

  const handleLogin = (user) => {
    setAuthMessage('');
    setCurrentUser(user || null);
    setTransitionState('login-leaving');
    setTimeout(() => {
      setAuthState('authenticated');
      setTransitionState('app-entering');
      setTimeout(() => setTransitionState('app-active'), 30);
    }, 250);
  };

  const handleLogout = async () => {
    setAuthMessage('');
    await revokeCurrentSession();
    clearSessionToken();
    setCurrentUser(null);
    setTransitionState('app-entering');
    setTimeout(() => {
      setAuthState('unauthenticated');
      setTransitionState('login-active');
    }, 250);
  };

  const isLoggedIn = authState === 'authenticated';

  return (
    <ErrorBoundary>
      <div className="w-screen h-screen overflow-hidden bg-slate-50 relative">
        {showIntro && (
          <div className={`absolute inset-0 w-full h-full z-50 transition-all duration-700 ease-in-out origin-center
             ${transitionState === 'intro-leaving' ? 'opacity-0 scale-[1.05] pointer-events-none blur-md' : 'opacity-100 scale-100 blur-0'}`}>
            <Intro onStart={handleStartIntro} />
          </div>
        )}

        {!showIntro && authState === 'checking' && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-slate-500 text-sm font-bold">
            Memvalidasi session...
          </div>
        )}

        {!showIntro && !isLoggedIn && authState !== 'checking' && (
          <div className={`absolute inset-0 w-full h-full transition-all duration-300 ease-in-out origin-center
             ${transitionState === 'login-leaving' ? 'opacity-0 scale-[0.97] blur-[2px] pointer-events-none' : 'opacity-100 scale-100 blur-0'}`}>
            <Login onLogin={handleLogin} initialMessage={authMessage} />
          </div>
        )}

        {!showIntro && isLoggedIn && (
          <div className={`absolute inset-0 w-full h-full transition-all duration-300 ease-out origin-center
             ${transitionState === 'app-entering' ? 'opacity-0 scale-[1.02] blur-[2px] pointer-events-none' : 'opacity-100 scale-100 blur-0'}`}>
            <App onLogout={handleLogout} authenticatedUser={currentUser} />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MainApp />
  </React.StrictMode>
);
