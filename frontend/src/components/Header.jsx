import React, { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
const logoImg = '/Logo Strata.png';

const MENU_SECTIONS = [
  {
    label: 'Menu Utama',
    items: [
      ['dashboard', 'Dashboard', 'layout-dashboard'],
      ['status', 'Data Santri', 'clipboard-list'],
      ['alumni', 'Data Alumni', 'graduation-cap'],
      ['pendaftaran', 'Daftar Santri Baru', 'user-plus'],
    ]
  },
  {
    label: 'Keuangan',
    items: [
      ['pembayaran', 'Administrasi', 'wallet'],
      ['rekap-pembayaran', 'Rekapitulasi', 'bar-chart-3'],
      ['laporan', 'Laporan', 'file-text'],
    ]
  },
  {
    label: 'Umum',
    items: [
      ['pengaturan', 'Pengaturan', 'settings'],
      ['panduan', 'Panduan', 'book-open'],
    ]
  }
];

export const Header = ({ currentUser, searchQuery, setSearchQuery, activeTab, setActiveTab, alert, onLogout, onSyncAllData, isSyncingData, setRekapInitialPage }) => {
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const navRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    const close = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const initials = currentUser?.name ? currentUser.name.split(' ').map(word => word[0]).slice(0, 2).join('').toUpperCase() : 'U';
  const activePageLabel = MENU_SECTIONS.flatMap(section => section.items).find(([tab]) => tab === activeTab)?.[1] || 'Dashboard';
  const navigate = (tab) => {
    setActiveTab(tab);
    setOpenMenu(null);
    setMobileDrawerOpen(false);
  };

  useEffect(() => {
    if (mobileSearchOpen) searchRef.current?.focus();
  }, [mobileSearchOpen]);

  const SidebarContent = ({ mobile = false }) => (
    <>
      <div className="sidebar-brand">
        <button className="sidebar-brand-button" onClick={() => navigate('dashboard')} aria-label="Ke Dashboard">
          <span className="sidebar-brand-mark"><img src={logoImg} alt="" /></span>
          <span className="sidebar-brand-copy"><small>NAILUL JANNAH</small><strong>STRATA</strong></span>
        </button>
        {mobile && <button className="sidebar-close" onClick={() => setMobileDrawerOpen(false)} aria-label="Tutup menu"><Icon name="x" size={18} /></button>}
      </div>
      <nav className="sidebar-nav" aria-label="Navigasi utama">
        {MENU_SECTIONS.map((section, idx) => (
          <div key={section.label} className="sidebar-section">
            {idx > 0 && <div className="sidebar-divider" />}
            <p className="sidebar-eyebrow">{section.label}</p>
            {section.items.map(([tab, label, icon]) => (
              <button key={tab} title={label} aria-label={label} className={`sidebar-item ${activeTab === tab ? 'is-active' : ''}`} onClick={() => { setActiveTab(tab); setOpenMenu(null); setMobileDrawerOpen(false); }}>
                <span className="sidebar-item-icon"><Icon name={icon} size={18} /></span>
                <span className="sidebar-item-label">{label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user-card"><span className="sidebar-avatar">{initials}</span><span className="sidebar-user-copy"><strong>{currentUser?.name || 'Pengurus'}</strong><small>{currentUser?.role || 'Admin'}</small></span><button onClick={onLogout} aria-label="Keluar"><Icon name="log-out" size={16} /></button></div>
      </div>
    </>
  );

  return (
    <div ref={navRef} className="navigation-layer strata-navigation">
      <aside className="strata-sidebar"><SidebarContent /></aside>
      <header className="strata-topbar">
        <button className="topbar-menu-button" type="button" onClick={() => setMobileDrawerOpen(true)} aria-label="Buka menu">
          <Icon name="menu" size={19} />
        </button>
        <button className="topbar-brand" type="button" onClick={() => navigate('dashboard')} aria-label="Buka Dashboard">
          <span className="topbar-brand-mark"><img src={logoImg} alt="" /></span>
          <span className="topbar-brand-name">STRATA</span>
        </button>
        <div className="topbar-context" aria-live="polite">
          <span className="topbar-context-overline">Pondok Pesantren Nailul Jannah</span>
          <strong>{activePageLabel}</strong>
        </div>
        <div className={`topbar-search ${mobileSearchOpen ? 'is-open' : ''}`}>
          <Icon name="search" size={15} />
          <input ref={searchRef} type="search" placeholder="Cari santri atau alumni..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} aria-label="Cari santri atau alumni" />
          <button type="button" onClick={() => setMobileSearchOpen(false)} aria-label="Tutup pencarian"><Icon name="x" size={15} /></button>
        </div>
        <div className="topbar-actions" aria-label="Aksi akun">
          <button className="topbar-icon-action topbar-search-toggle" type="button" onClick={() => setMobileSearchOpen(value => !value)} aria-label="Cari" title="Cari"><Icon name="search" size={17} /></button>
          <button className="topbar-icon-action" type="button" onClick={() => navigate('panduan')} aria-label="Bantuan" title="Bantuan"><Icon name="circle-help" size={17} /></button>
          <button className="topbar-account-icon" type="button" onClick={onLogout} aria-label={`Keluar dari akun ${currentUser?.name || 'pengguna'}`} title="Keluar"><span>{initials}</span></button>
        </div>
        {alert && <div className={`navbar-alert ${alert.type === 'success' ? 'is-success' : 'is-error'}`}><Icon name={alert.type === 'success' ? 'check-circle' : 'alert-circle'} size={16} />{alert.text}</div>}
      </header>
      {mobileDrawerOpen && <div className="sidebar-mobile-overlay" onClick={() => setMobileDrawerOpen(false)}><aside className="strata-sidebar strata-sidebar-mobile" onClick={(event) => event.stopPropagation()}><SidebarContent mobile /></aside></div>}
    </div>
  );
};
