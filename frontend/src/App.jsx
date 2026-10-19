import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { DashboardTab } from './components/DashboardTab';
import { PembayaranTab } from './components/PembayaranTab';
import { PendaftaranTab } from './components/PendaftaranTab';
import { SantriTab } from './components/SantriTab';
import { LaporanTab } from './components/LaporanTab';
import { PengaturanTab } from './components/PengaturanTab';
import { PanduanTab } from './components/PanduanTab';
import { RekapPembayaranTab } from './components/RekapPembayaranTab';
import { 
  ReceiptModal, 
  ViewSantriModal, 
  EditSantriModal, 
  DeleteSantriModal, 
  PaymentDetailModal, 
  BulananFormModal, 
  UserFormModal,
  KeuanganFormModal 
} from './components/Modals';
import { TambahSantriModal } from './components/TambahSantriModal';
import { SimpleImportModal } from './components/SimpleImportModal';
import { Icon } from './components/Icon';
import { getSessionToken } from './services/authService.js';

import { 
  DEFAULT_FORM_DATA, 
  getScriptErrorMessage, 
  validateSantriForm, 
  onlyDigits,
  TOTAL_BIAYA,
  PAYMENT_ITEMS,
  KATEGORI_PEMASUKAN
} from './utils/helpers';

export const App = ({ onLogout, authenticatedUser }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [santriList, setSantriList] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  const [viewData, setViewData] = useState(null);
  const [editData, setEditData] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [receiptData, setReceiptData] = useState(null); 
  const [actionLoading, setActionLoading] = useState(false);

  // States for Payment checklists & angsuran
  const [paymentDetailData, setPaymentDetailData] = useState(null);
  const [tempPaymentState, setTempPaymentState] = useState({});
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // States for user settings
  const [userList, setUserList] = useState([
    { id: 1, nama: 'Muchammad hamzah', username: 'Muchammad hamzah', role: 'Super Admin' },
    { id: 2, nama: 'Nailul Jannah', username: 'Nailul Jannah', role: 'Super Admin' }
  ]);
  const [currentUser, setCurrentUser] = useState(authenticatedUser || { name: 'Pengurus PPNJ', role: 'Admin Pusat' });
  const [showUserForm, setShowUserForm] = useState(false);
  const [userFormData, setUserFormData] = useState({ id: null, nama: '', username: '', password: '', role: 'Admin' });
  const [showTambahSantriModal, setShowTambahSantriModal] = useState(false);
  const [showSimpleImport, setShowSimpleImport] = useState(false);
  const [rekapInitialPage, setRekapInitialPage] = useState('tahunan');

  const [searchQuery, setSearchQuery] = useState("");

  // States for confirmation pop-up (Refresh & Logout)
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Ya',
    cancelText: 'Tidak',
    type: 'danger'
  });

  const confirmLogout = () => {
    setConfirmModal({
      show: true,
      title: 'Konfirmasi Keluar',
      message: 'Apakah Anda yakin ingin keluar dari sistem Ponpes Nailul Jannah?',
      confirmText: 'Ya, Keluar',
      cancelText: 'Tidak',
      type: 'danger',
      onConfirm: () => {
        onLogout();
      }
    });
  };

  // States for Islamic academic calendar
  const [globalActiveYear, setGlobalActiveYear] = useState(() => {
    try {
      const saved = localStorage.getItem('ppnj_active_year');
      if (saved === 'Semua') return 'Semua';
      return parseInt(saved) || 2026;
    } catch (e) {
      return 2026;
    }
  });
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState(globalActiveYear);
  const [paymentViewMode, setPaymentViewMode] = useState(null);
  const [selectedIslamicMonth, setSelectedIslamicMonth] = useState(null);

  const updateGlobalActiveYear = (year) => {
    setGlobalActiveYear(year);
    setSelectedTahunAjaran(year);
    try {
      localStorage.setItem('ppnj_active_year', year);
    } catch (e) {}
  };

  // States for Bulanan SPP sheet
  const [bulananEntries, setBulananEntries] = useState([]);
  const [bulananLoading, setBulananLoading] = useState(false);
  const [bulananFormData, setBulananFormData] = useState({
    studentId: '',
    studentName: '',
    academicYear: '',
    hijriMonth: '',
    makan: false,
    makan_tanggal: '',
    laundry: false,
    laundry_tanggal: '',
    ziaroh: false,
    ziaroh_tanggal: ''
  });
  const [bulananFormOpen, setBulananFormOpen] = useState(false);
  const [bulananFormMode, setBulananFormMode] = useState('create');

  // State untuk semua data bulanan (dipakai dashboard chart)
  const [allBulananData, setAllBulananData] = useState([]);
  const [isSyncingData, setIsSyncingData] = useState(false);

  // States for Keuangan (financial management)
  const [keuanganEntries, setKeuanganEntries] = useState([]);
  const [keuanganLoading, setKeuanganLoading] = useState(false);
  const [keuanganFormData, setKeuanganFormData] = useState({
    tipe: 'pemasukan',
    tanggal: '',
    kategori: KATEGORI_PEMASUKAN[0].key,
    deskripsi: '',
    nominal: '',
    bulanHijri: '',
    tahunAjaran: '',
    referensi: '',
    dibuatOleh: ''
  });
  const [keuanganFormOpen, setKeuanganFormOpen] = useState(false);
  const [keuanganFormMode, setKeuanganFormMode] = useState('create');

  const handleSyncAllData = () => {
    setIsSyncingData(true);
    setAlert({ type: 'success', text: 'Menjalankan sinkronisasi data menyeluruh...' });

    if (typeof google !== 'undefined' && google.script && google.script.run) {
      google.script.run
        .withSuccessHandler((res) => {
          setIsSyncingData(false);
          if (res && res.success) {
            if (Array.isArray(res.santriData)) setSantriList(res.santriData);
            if (Array.isArray(res.bulananData)) {
              setAllBulananData(res.bulananData);
              if (selectedIslamicMonth) {
                const filtered = res.bulananData.filter(b => b.hijriMonth === selectedIslamicMonth);
                setBulananEntries(filtered);
              }
            }
            setAlert({ type: 'success', text: res.message || 'Sinkronisasi data menyeluruh selesai!' });
          } else {
            setAlert({ type: 'error', text: (res && res.message) || 'Gagal menyinkronkan data.' });
          }
        })
        .withFailureHandler((err) => {
          setIsSyncingData(false);
          setAlert({ type: 'error', text: 'Gagal sinkronisasi: ' + getScriptErrorMessage(err) });
        })
        .syncAllData();
    } else {
      setTimeout(() => {
        setIsSyncingData(false);
        setAlert({ type: 'success', text: 'Sinkronisasi data menyeluruh selesai (Preview mode).' });
      }, 1200);
    }
  };

  useEffect(() => {
    if (authenticatedUser) {
      setCurrentUser(authenticatedUser);
    }
    fetchData();
    fetchAllBulananData();
    fetchKeuanganData();
  }, []);

  // Effect for browser refresh / beforeunload interception
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isF5 = e.key === 'F5';
      const isCtrlR = (e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R');

      if (isF5 || isCtrlR) {
        e.preventDefault();
        setConfirmModal({
          show: true,
          title: 'Muat Ulang Halaman',
          message: 'Apakah Anda yakin ingin menyegarkan (refresh) halaman? Data yang belum disimpan mungkin akan hilang.',
          confirmText: 'Ya, Segarkan',
          cancelText: 'Tidak',
          type: 'warning',
          onConfirm: () => {
            window.location.reload();
          }
        });
      }
    };

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Apakah Anda yakin ingin meninggalkan halaman ini?';
      return e.returnValue;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  useEffect(() => {
    if (selectedIslamicMonth && activeTab === 'pembayaran' && paymentViewMode === 'bulanan') {
      fetchBulananData(selectedIslamicMonth);
    }
  }, [selectedIslamicMonth, activeTab, paymentViewMode, allBulananData]);

  // Fetch keuangan when mode switches or tahun changes
  useEffect(() => {
    if (activeTab === 'pembayaran' && paymentViewMode === 'keuangan') {
      fetchKeuanganData();
    }
  }, [paymentViewMode, selectedTahunAjaran, activeTab]);

  const fetchData = () => {
    setDataLoading(true);
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      google.script.run
        .withSuccessHandler((data) => {
          setSantriList(Array.isArray(data) ? data : []);
          setDataLoading(false);
        })
        .withFailureHandler((err) => {
          setDataLoading(false);
          setAlert({ type: 'error', text: 'Gagal memuat data: ' + getScriptErrorMessage(err) });
        })
        .getSantriData(getSessionToken());
    } else {
      setTimeout(() => {
        setSantriList([
          { 
            rowIndex: 2, id: 'NJ-2026-1234', tanggal: '31/05/2026', nik: '3201234567890', namaLengkap: 'Muchammad Hamzah', jenisKelamin: 'Laki-laki', tempatLahir: 'Jakarta', tanggalLahir: '2010-05-15', alamat: 'Jl. Melati No. 12', pendidikan: 'SMP/MTs', namaWali: '-', noHp: '081234567890', status: 'Aktif', namaAyah: 'Budi', namaIbu: 'Siti', pekerjaanOrtu: 'Wiraswasta',
            pembayaran: {
              administrasi: true, administrasi_tanggal: '31/05/2026',
              pengembangan: true, pengembangan_tanggal: '31/05/2026',
              makan: true, makan_tanggal: '31/05/2026',
              peralatan: true, peralatan_tanggal: '31/05/2026',
              kitab: true, kitab_tanggal: '31/05/2026',
              perlengkapan: true, perlengkapan_tanggal: '31/05/2026',
              laundry: true, laundry_tanggal: '31/05/2026',
              ziaroh: true, ziaroh_tanggal: '31/05/2026',
              jas: true, jas_tanggal: '31/05/2026'
            }
          },
          { 
            rowIndex: 3, id: 'NJ-2026-5678', tanggal: '31/05/2026', nik: '3201234567891', namaLengkap: 'Ahmad najieh', jenisKelamin: 'Laki-laki', tempatLahir: 'Bandung', tanggalLahir: '2011-08-20', alamat: 'Jl. Mawar No. 5', pendidikan: 'SD/MI', namaWali: '-', noHp: '081234568888', status: 'Aktif', namaAyah: 'Andi', namaIbu: 'Ani', pekerjaanOrtu: 'PNS',
            pembayaran: {
              administrasi: true, administrasi_tanggal: '31/05/2026',
              pengembangan: true, pengembangan_tanggal: '31/05/2026',
              makan: true, makan_tanggal: '31/05/2026',
              peralatan: true, peralatan_tanggal: '31/05/2026',
              kitab: true, kitab_tanggal: '31/05/2026',
              perlengkapan: true, perlengkapan_tanggal: '31/05/2026',
              laundry: true, laundry_tanggal: '31/05/2026',
              ziaroh: true, ziaroh_tanggal: '31/05/2026',
              jas: true, jas_tanggal: '31/05/2026'
            }
          }
        ]);
        setDataLoading(false);
      }, 1000);
    }
  };

  const fetchBulananData = (hijriMonth) => {
    setBulananLoading(true);
    const filters = {
      hijriMonth: hijriMonth || '',
      academicYear: selectedTahunAjaran ? String(selectedTahunAjaran) : ''
    };

    if (typeof google !== 'undefined' && google.script && google.script.run) {
      google.script.run
        .withSuccessHandler((data) => {
          setBulananEntries(Array.isArray(data) ? data : []);
          setBulananLoading(false);
        })
        .withFailureHandler((err) => {
          setBulananLoading(false);
          setAlert({ type: 'error', text: 'Gagal memuat data Bulanan: ' + getScriptErrorMessage(err) });
        })
        .getBulananData(getSessionToken(), filters);
    } else {
      setTimeout(() => {
        const filtered = (allBulananData || []).filter(item => {
          if (filters.hijriMonth && item.hijriMonth !== filters.hijriMonth) return false;
          if (filters.academicYear && filters.academicYear !== 'Semua' && String(item.academicYear) !== filters.academicYear) return false;
          return true;
        });
        setBulananEntries(filtered);
        setBulananLoading(false);
      }, 300);
    }
  };

  // Fetch SEMUA data bulanan tanpa filter bulan (untuk dashboard chart)
  const fetchAllBulananData = () => {
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      google.script.run
        .withSuccessHandler((data) => {
          setAllBulananData(Array.isArray(data) ? data : []);
        })
        .withFailureHandler(() => {})
        .getBulananData(getSessionToken(), {});
    } else {
      // Di mode dev: tambahkan data mock untuk syahriyah (makan, laundry, ziaroh)
      const mockBulanan = [
        // Muchammad Hamzah (NJ-2026-1234) - Tahun Ajaran 2026
        { studentId: 'NJ-2026-1234', studentName: 'Muchammad Hamzah', academicYear: '2026', hijriMonth: 'Muharram', makan: true, laundry: true, ziaroh: true, rowIndex: 2 },
        { studentId: 'NJ-2026-1234', studentName: 'Muchammad Hamzah', academicYear: '2026', hijriMonth: 'Safar', makan: true, laundry: true, ziaroh: true, rowIndex: 3 },
        { studentId: 'NJ-2026-1234', studentName: 'Muchammad Hamzah', academicYear: '2026', hijriMonth: "Rabi'ul Awal", makan: true, laundry: true, ziaroh: true, rowIndex: 4 },
        { studentId: 'NJ-2026-1234', studentName: 'Muchammad Hamzah', academicYear: '2026', hijriMonth: "Rabi'ul Akhir", makan: true, laundry: true, ziaroh: true, rowIndex: 5 },
        { studentId: 'NJ-2026-1234', studentName: 'Muchammad Hamzah', academicYear: '2026', hijriMonth: 'Jumadil Awal', makan: true, laundry: false, ziaroh: true, rowIndex: 6 }, // sebagian
        
        // Ahmad najieh (NJ-2026-5678) - Tahun Ajaran 2026
        { studentId: 'NJ-2026-5678', studentName: 'Ahmad najieh', academicYear: '2026', hijriMonth: 'Muharram', makan: true, laundry: true, ziaroh: true, rowIndex: 7 },
        { studentId: 'NJ-2026-5678', studentName: 'Ahmad najieh', academicYear: '2026', hijriMonth: 'Safar', makan: true, laundry: true, ziaroh: true, rowIndex: 8 },
        { studentId: 'NJ-2026-5678', studentName: 'Ahmad najieh', academicYear: '2026', hijriMonth: "Rabi'ul Awal", makan: false, laundry: true, ziaroh: true, rowIndex: 9 } // sebagian
      ];
      setAllBulananData(mockBulanan);
    }
  };

  const openBulananCreateForm = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setBulananFormData({
      studentId: '',
      studentName: '',
      academicYear: selectedTahunAjaran ? String(selectedTahunAjaran) : '',
      hijriMonth: selectedIslamicMonth || '',
      makan: false,
      makan_tanggal: '',
      laundry: false,
      laundry_tanggal: '',
      ziaroh: false,
      ziaroh_tanggal: ''
    });
    setBulananFormMode('create');
    setBulananFormOpen(true);
  };

  const openBulananEditForm = (entry) => {
    setBulananFormData({
      rowIndex: entry.rowIndex,
      studentId: entry.studentId || '',
      studentName: entry.studentName || '',
      academicYear: entry.academicYear || '',
      hijriMonth: entry.hijriMonth || '',
      makan: entry.makan || false,
      makan_tanggal: entry.makan_tanggal || '',
      laundry: entry.laundry || false,
      laundry_tanggal: entry.laundry_tanggal || '',
      ziaroh: entry.ziaroh || false,
      ziaroh_tanggal: entry.ziaroh_tanggal || ''
    });
    setBulananFormMode('edit');
    setBulananFormOpen(true);
  };

  const saveBulananForm = () => {
    if (!bulananFormData.studentId) {
      setAlert({ type: 'error', text: 'Student ID wajib diisi.' });
      return;
    }
    if (!bulananFormData.hijriMonth) {
      setAlert({ type: 'error', text: 'Hijri Month wajib diisi.' });
      return;
    }

    if (typeof google === 'undefined' || !google.script || !google.script.run) {
      setAllBulananData(prev => {
        const existingIdx = prev.findIndex(p =>
          p.studentId === bulananFormData.studentId &&
          p.academicYear === bulananFormData.academicYear &&
          p.hijriMonth === bulananFormData.hijriMonth
        );
        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx] = { ...next[existingIdx], ...bulananFormData };
          return next;
        }
        return [...prev, { ...bulananFormData, rowIndex: prev.length + 2 }];
      });
      setBulananFormOpen(false);
      setAlert({ type: 'success', text: 'Data bulanan berhasil disimpan (Preview)!' });
      return;
    }

    if (bulananFormMode === 'edit' && bulananFormData.rowIndex) {
      google.script.run
        .withSuccessHandler((res) => {
          if (res && res.success) {
            setAlert({ type: 'success', text: res.message || 'Data bulanan berhasil diperbarui.' });
          } else {
            setAlert({ type: 'error', text: (res && res.message) || 'Gagal memperbarui data bulanan.' });
          }
          setBulananFormOpen(false);
          fetchBulananData(selectedIslamicMonth);
          fetchAllBulananData();
        })
        .withFailureHandler((err) => {
          setAlert({ type: 'error', text: 'Gagal memperbarui: ' + getScriptErrorMessage(err) });
        })
        .saveBulananEntry(getSessionToken(), bulananFormData);
    } else {
      google.script.run
        .withSuccessHandler((res) => {
          if (res && res.success) {
            setAlert({ type: 'success', text: res.message || 'Data bulanan berhasil disimpan.' });
          } else {
            setAlert({ type: 'error', text: (res && res.message) || 'Gagal menyimpan data bulanan.' });
          }
          setBulananFormOpen(false);
          fetchBulananData(selectedIslamicMonth);
          fetchAllBulananData();
        })
        .withFailureHandler((err) => {
          setAlert({ type: 'error', text: 'Gagal menyimpan: ' + getScriptErrorMessage(err) });
        })
        .saveBulananEntry(getSessionToken(), bulananFormData);
    }
  };

  const deleteBulananItem = (entry) => {
    if (!confirm(`Hapus entri bulanan untuk ${entry.studentName || entry.studentId}?`)) return;

    if (typeof google === 'undefined' || !google.script || !google.script.run) {
      setAllBulananData(prev => prev.filter(p => p.rowIndex !== entry.rowIndex));
      setAlert({ type: 'success', text: 'Data bulanan berhasil dihapus (Preview)!' });
      return;
    }

    google.script.run
      .withSuccessHandler((res) => {
        if (res && res.success) {
          setAlert({ type: 'success', text: res.message || 'Entri berhasil dihapus.' });
        } else {
          setAlert({ type: 'error', text: (res && res.message) || 'Gagal menghapus.' });
        }
        fetchBulananData(selectedIslamicMonth);
      })
      .withFailureHandler((err) => {
        setAlert({ type: 'error', text: 'Gagal menghapus: ' + getScriptErrorMessage(err) });
      })
      .deleteBulananEntry(getSessionToken(), entry.rowIndex, selectedIslamicMonth);
  };

  // ─── KEUANGAN HANDLERS ──────────────────────────────────────
  const fetchKeuanganData = () => {
    setKeuanganLoading(true);
    const filters = {
      tahunAjaran: selectedTahunAjaran ? String(selectedTahunAjaran) : ''
    };

    if (typeof google !== 'undefined' && google.script && google.script.run) {
      google.script.run
        .withSuccessHandler((data) => {
          setKeuanganEntries(Array.isArray(data) ? data : []);
          setKeuanganLoading(false);
        })
        .withFailureHandler((err) => {
          setKeuanganLoading(false);
          setAlert({ type: 'error', text: 'Gagal memuat data keuangan: ' + getScriptErrorMessage(err) });
        })
        .getKeuanganData(getSessionToken(), filters);
    } else {
      // Preview mode mock data
      setTimeout(() => {
        setKeuanganEntries([
          { id: 'TRX-MOCK0001', tanggal: '2026/07/01', tipe: 'pemasukan', kategori: 'pembayaran_tahunan', deskripsi: 'Pembayaran Administrasi - Muchammad Hamzah', nominal: 350000, bulanHijri: 'Muharram', tahunAjaran: '2026', referensi: 'NJ-2026-1234', dibuatOleh: 'Sistem (Otomatis)', rowIndex: 2 },
          { id: 'TRX-MOCK0002', tanggal: '2026/07/02', tipe: 'pemasukan', kategori: 'pembayaran_bulanan', deskripsi: 'Pembayaran Makan (1 Bln) (Muharram) - Ahmad Najieh', nominal: 275000, bulanHijri: 'Muharram', tahunAjaran: '2026', referensi: 'NJ-2026-5678', dibuatOleh: 'Sistem (Otomatis)', rowIndex: 3 },
          { id: 'TRX-MOCK0003', tanggal: '2026/07/05', tipe: 'pengeluaran', kategori: 'operasional', deskripsi: 'Pembelian ATK Kantor', nominal: 150000, bulanHijri: 'Muharram', tahunAjaran: '2026', referensi: '', dibuatOleh: 'Admin', rowIndex: 4 },
          { id: 'TRX-MOCK0004', tanggal: '2026/07/10', tipe: 'pengeluaran', kategori: 'listrik_air', deskripsi: 'Pembayaran Listrik Juli', nominal: 850000, bulanHijri: 'Muharram', tahunAjaran: '2026', referensi: '', dibuatOleh: 'Admin', rowIndex: 5 },
          { id: 'TRX-MOCK0005', tanggal: '2026/07/15', tipe: 'pemasukan', kategori: 'donasi', deskripsi: 'Donasi dari Bpk. Ahmad', nominal: 1000000, bulanHijri: 'Muharram', tahunAjaran: '2026', referensi: '', dibuatOleh: 'Admin', rowIndex: 6 },
          { id: 'TRX-MOCK0006', tanggal: '2026/08/01', tipe: 'pengeluaran', kategori: 'gaji', deskripsi: 'Gaji Ustadz bulan Safar', nominal: 2000000, bulanHijri: 'Safar', tahunAjaran: '2026', referensi: '', dibuatOleh: 'Admin', rowIndex: 7 },
          { id: 'TRX-MOCK0007', tanggal: '2026/08/01', tipe: 'pemasukan', kategori: 'pembayaran_tahunan', deskripsi: 'Pembayaran Kitab - Ahmad Najieh', nominal: 60000, bulanHijri: 'Safar', tahunAjaran: '2026', referensi: 'NJ-2026-5678', dibuatOleh: 'Sistem (Otomatis)', rowIndex: 8 },
          { id: 'TRX-MOCK0008', tanggal: '2026/08/05', tipe: 'pengeluaran', kategori: 'konsumsi', deskripsi: 'Belanja bahan makan santri', nominal: 1500000, bulanHijri: 'Safar', tahunAjaran: '2026', referensi: '', dibuatOleh: 'Admin', rowIndex: 9 }
        ]);
        setKeuanganLoading(false);
      }, 500);
    }
  };

  const openKeuanganCreateForm = (tipe) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setKeuanganFormData({
      tipe: tipe || 'pemasukan',
      tanggal: `${yyyy}-${mm}-${dd}`,
      kategori: (tipe === 'pengeluaran' ? 'operasional' : KATEGORI_PEMASUKAN[0].key),
      deskripsi: '',
      nominal: '',
      bulanHijri: '',
      tahunAjaran: selectedTahunAjaran ? String(selectedTahunAjaran) : '',
      referensi: '',
      dibuatOleh: currentUser?.name || 'Admin'
    });
    setKeuanganFormMode('create');
    setKeuanganFormOpen(true);
  };

  const openKeuanganEditForm = (entry) => {
    setKeuanganFormData({
      ...entry,
      tanggal: (entry.tanggal || '').replace(/\//g, '-')
    });
    setKeuanganFormMode('edit');
    setKeuanganFormOpen(true);
  };

  const saveKeuanganForm = () => {
    const payload = {
      ...keuanganFormData,
      tanggal: (keuanganFormData.tanggal || '').replace(/-/g, '/'),
      nominal: Number(keuanganFormData.nominal) || 0,
      tahunAjaran: keuanganFormData.tahunAjaran || (selectedTahunAjaran ? String(selectedTahunAjaran) : ''),
      dibuatOleh: keuanganFormData.dibuatOleh || currentUser?.name || 'Admin'
    };

    if (typeof google === 'undefined' || !google.script || !google.script.run) {
      // Preview mode
      if (keuanganFormMode === 'edit') {
        setKeuanganEntries(prev => prev.map(e => e.rowIndex === payload.rowIndex ? { ...e, ...payload } : e));
      } else {
        setKeuanganEntries(prev => [...prev, { ...payload, id: 'TRX-PREV-' + Date.now(), rowIndex: prev.length + 10 }]);
      }
      setKeuanganFormOpen(false);
      setAlert({ type: 'success', text: 'Transaksi berhasil disimpan (Preview)!' });
      return;
    }

    google.script.run
      .withSuccessHandler((res) => {
        if (res && res.success) {
          setAlert({ type: 'success', text: res.message || 'Transaksi berhasil disimpan.' });
        } else {
          setAlert({ type: 'error', text: (res && res.message) || 'Gagal menyimpan transaksi.' });
        }
        setKeuanganFormOpen(false);
        fetchKeuanganData();
      })
      .withFailureHandler((err) => {
        setAlert({ type: 'error', text: 'Gagal menyimpan: ' + getScriptErrorMessage(err) });
      })
      .saveKeuanganEntry(getSessionToken(), payload);
  };

  const deleteKeuanganEntry = (entry) => {
    if (typeof google === 'undefined' || !google.script || !google.script.run) {
      setKeuanganEntries(prev => prev.filter(e => e.rowIndex !== entry.rowIndex));
      setAlert({ type: 'success', text: 'Transaksi berhasil dihapus (Preview)!' });
      return;
    }

    google.script.run
      .withSuccessHandler((res) => {
        if (res && res.success) {
          setAlert({ type: 'success', text: res.message || 'Transaksi berhasil dihapus.' });
        } else {
          setAlert({ type: 'error', text: (res && res.message) || 'Gagal menghapus.' });
        }
        fetchKeuanganData();
      })
      .withFailureHandler((err) => {
        setAlert({ type: 'error', text: 'Gagal menghapus: ' + getScriptErrorMessage(err) });
      })
      .deleteKeuanganEntry(getSessionToken(), entry.rowIndex);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const nextValue = ['nik', 'noHp'].includes(name) ? onlyDigits(value) : value;
    setFormData(prev => ({ ...prev, [name]: nextValue }));
  };

  const handleEditInput = (e) => {
    const { name, value } = e.target;
    const nextValue = ['nik', 'noHp'].includes(name) ? onlyDigits(value) : value;
    setEditData(prev => ({ ...prev, [name]: nextValue }));
  };

  const executeUpdate = () => {
    const validationMessage = validateSantriForm(editData);
    if (validationMessage) {
      setAlert({ type: 'error', text: validationMessage });
      return;
    }

    setActionLoading(true);
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      google.script.run
        .withSuccessHandler((res) => {
          setActionLoading(false);
          setEditData(null);
          setAlert({ type: res.success ? 'success' : 'error', text: res.message });
          if(res.success) fetchData();
        })
        .withFailureHandler((err) => {
          setActionLoading(false);
          setAlert({ type: 'error', text: 'Gagal update: ' + getScriptErrorMessage(err) });
        })
        .updateSantri(getSessionToken(), editData.rowIndex, editData);
    } else {
      setTimeout(() => {
        setActionLoading(false);
        setEditData(null);
        setAlert({ type: 'success', text: 'Data berhasil diperbarui (Preview)!' });
        fetchData();
      }, 1000);
    }
  };

  const executeDelete = () => {
    setActionLoading(true);
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      google.script.run
        .withSuccessHandler((res) => {
          setActionLoading(false);
          setDeleteData(null);
          setAlert({ type: res.success ? 'success' : 'error', text: res.message });
          if(res.success) fetchData();
        })
        .withFailureHandler((err) => {
          setActionLoading(false);
          setAlert({ type: 'error', text: 'Gagal menghapus: ' + getScriptErrorMessage(err) });
        })
        .deleteSantri(getSessionToken(), deleteData.rowIndex);
    } else {
      setTimeout(() => {
        setActionLoading(false);
        setDeleteData(null);
        setAlert({ type: 'success', text: 'Data berhasil dihapus (Preview)!' });
        fetchData();
      }, 1000);
    }
  };

  const submitData = () => {
    const validationMessage = validateSantriForm(formData);
    if (validationMessage) {
      setAlert({ type: 'error', text: validationMessage });
      return;
    }

    setLoading(true);
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      google.script.run
        .withSuccessHandler((res) => {
          setLoading(false);
          if (res.success) {
            setAlert({ type: 'success', text: res.message });
            setActiveTab('dashboard');
            fetchData();
            setFormData(DEFAULT_FORM_DATA);
          } else {
            setAlert({ type: 'error', text: res.message });
          }
        })
        .withFailureHandler((err) => {
          setLoading(false);
          setAlert({ type: 'error', text: 'Gagal menyimpan: ' + getScriptErrorMessage(err) });
        })
        .processForm(getSessionToken(), formData);
    } else {
      setTimeout(() => {
        setLoading(false);
        setAlert({ type: 'success', text: 'Data berhasil terkirim (Preview)!' });
        setActiveTab('dashboard');
      }, 1000);
    }
  };

  const openPaymentModal = (santri) => {
    setPaymentDetailData(santri);
    setTempPaymentState(santri.pembayaran ? { ...santri.pembayaran } : {});
  };

  const savePaymentChanges = () => {
    setIsSavingPayment(true);
    const rowIndex = paymentDetailData.rowIndex;
    
    if (selectedTahunAjaran && selectedTahunAjaran !== 2026) {
       setTimeout(() => {
         setIsSavingPayment(false);
         setPaymentDetailData(null);
         setAlert({ type: 'success', text: `Data tagihan tahun ${selectedTahunAjaran} M disimpan (Simulasi UI).` });
       }, 800);
       return;
    }

    setSantriList(prevList => prevList.map(santri => {
      if (santri.rowIndex === rowIndex) {
        return { ...santri, pembayaran: tempPaymentState };
      }
      return santri;
    }));

    if (typeof google !== 'undefined' && google.script && google.script.run) {
       google.script.run
         .withSuccessHandler(() => {
            setIsSavingPayment(false);
            setPaymentDetailData(null);
            fetchData();
            setAlert({ type: 'success', text: 'Data pembayaran berhasil disimpan!' });
         })
         .withFailureHandler((err) => {
            setIsSavingPayment(false);
            fetchData();
            setAlert({ type: 'error', text: 'Gagal menyimpan: ' + getScriptErrorMessage(err) });
         })
         .updatePembayaran(getSessionToken(), rowIndex, tempPaymentState);
    } else {
       setTimeout(() => {
         setIsSavingPayment(false);
         setPaymentDetailData(null);
         setAlert({ type: 'success', text: 'Data pembayaran berhasil disimpan (Preview)!' });
       }, 800);
    }
  };

  const escapeCsvValue = (value) => {
    const text = String(value == null ? '' : value);
    return `"${text.replace(/"/g, '""')}"`;
  };

  const handleExportExcel = () => {
    const dataToExport = activeTab === 'status' 
      ? santriList.filter(s => String(s.status).toLowerCase() !== 'alumni')
      : santriList.filter(s => String(s.status).toLowerCase() === 'alumni');
      
    if (dataToExport.length === 0) return setAlert({ type: 'error', text: 'Tidak ada data untuk diekspor.' });
    
    setAlert({ type: 'success', text: 'Mengunduh file Excel (CSV)...' });
    
    const headers = ['ID Pendaftaran', 'NIK', 'Nama Lengkap', 'Jenis Kelamin', 'Tempat Lahir', 'Tanggal Lahir', 'Alamat', 'Pendidikan', 'Nama Wali', 'No HP', 'Status'];
    const csvRows = [headers.map(escapeCsvValue).join(',')];
    
    dataToExport.forEach(row => {
      const values = [
        row.id, row.nik, row.namaLengkap, row.jenisKelamin, row.tempatLahir,
        row.tanggalLahir, row.alamat, row.pendidikan, row.namaWali, row.noHp, row.status
      ].map(escapeCsvValue);
      csvRows.push(values.join(','));
    });
    
    const blob = new Blob(['\ufeff' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `Data_${activeTab === 'status' ? 'Santri' : 'Alumni'}_PPNJ_${new Date().getTime()}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExportPDF = () => {
    setAlert({ type: 'success', text: 'Membuka pratinjau cetak PDF...' });
    setTimeout(() => window.print(), 500);
  };

  const isAlumni = (status) => String(status || '').trim().toLowerCase() === 'alumni';

  const refreshAfterImport = () => {
    fetchData();
    fetchAllBulananData();
    fetchKeuanganData();
  };

  return (
    <>
      <div className={`compact-shell flex h-screen w-full overflow-hidden bg-slate-50 relative ${receiptData ? 'print:hidden' : ''}`}>
        
        {/* Background Gradients */}
        <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-emerald-400/30 rounded-full blur-[100px] pointer-events-none z-0"></div>
        <div className="absolute bottom-[-10%] left-[10%] w-[350px] h-[350px] bg-blue-300/30 rounded-full blur-[100px] pointer-events-none z-0"></div>

        <Header 
          currentUser={currentUser} 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          alert={alert} 
          onLogout={confirmLogout}
          onSyncAllData={handleSyncAllData}
          setRekapInitialPage={setRekapInitialPage}
          isSyncingData={isSyncingData}
        />

        {/* Main Content Area */}
        <main className="compact-main strata-main strata-workspace flex-1 flex flex-col min-w-0 relative bg-slate-50/50 backdrop-blur-sm z-10 rounded-none my-0 md:ml-0 overflow-hidden shadow-[-10px_0_30px_rgba(0,0,0,0.02)]">
          <div className="compact-content flex-1 overflow-y-auto p-3 sm:p-5 md:p-8 custom-scroll">
            {activeTab === 'dashboard' && (
              <DashboardTab 
                santriList={santriList}
                dataLoading={dataLoading}
                setActiveTab={setActiveTab}
                setAlert={setAlert}
                allBulananData={allBulananData}
                fetchAllBulananData={fetchAllBulananData}
                globalActiveYear={globalActiveYear}
                onNavigatePembayaran={(mode) => { setPaymentViewMode(mode); setActiveTab('pembayaran'); }}
                onOpenImport={() => setShowSimpleImport(true)}
              />
            )}

            {activeTab === 'pembayaran' && (
              <PembayaranTab 
                dataSantri={santriList.filter(s => !isAlumni(s.status))}
                selectedTahunAjaran={selectedTahunAjaran}
                setSelectedTahunAjaran={setSelectedTahunAjaran}
                paymentViewMode={paymentViewMode}
                setPaymentViewMode={setPaymentViewMode}
                selectedIslamicMonth={selectedIslamicMonth}
                setSelectedIslamicMonth={setSelectedIslamicMonth}
                bulananEntries={bulananEntries}
                bulananLoading={bulananLoading}
                fetchBulananData={fetchBulananData}
                openBulananCreateForm={openBulananCreateForm}
                openBulananEditForm={openBulananEditForm}
                deleteBulananItem={deleteBulananItem}
                openPaymentModal={openPaymentModal}
                setReceiptData={setReceiptData}
                dataLoading={dataLoading}
                fetchData={fetchData}
                setAlert={setAlert}
                keuanganEntries={keuanganEntries}
                keuanganLoading={keuanganLoading}
                fetchKeuanganData={fetchKeuanganData}
                onAddKeuanganEntry={openKeuanganCreateForm}
                onEditKeuanganEntry={openKeuanganEditForm}
                onDeleteKeuanganEntry={deleteKeuanganEntry}
              />
            )}

            {activeTab === 'pendaftaran' && (
              <PendaftaranTab 
                formData={formData}
                handleInputChange={handleInputChange}
                submitData={submitData}
                loading={loading}
              />
            )}

            {(activeTab === 'status' || activeTab === 'alumni') && (
              <SantriTab 
                activeTab={activeTab}
                santriList={santriList}
                dataLoading={dataLoading}
                searchQuery={searchQuery}
                fetchData={fetchData}
                handleExportExcel={handleExportExcel}
                handleExportPDF={handleExportPDF}
                setViewData={setViewData}
                setEditData={setEditData}
                setDeleteData={setDeleteData}
                setAlert={setAlert}
                onOpenImport={() => setShowSimpleImport(true)}
              />
            )}

            {activeTab === 'laporan' && (
              <LaporanTab 
                santriList={santriList}
                currentUser={currentUser}
                allBulananData={allBulananData}
              />
            )}

            {activeTab === 'pengaturan' && (
              <PengaturanTab 
                userList={userList}
                setUserList={setUserList}
                setUserFormData={setUserFormData}
                setShowUserForm={setShowUserForm}
                setAlert={setAlert}
                globalActiveYear={globalActiveYear}
                onYearChange={updateGlobalActiveYear}
                onSyncAllData={handleSyncAllData}
                isSyncingData={isSyncingData}
              />
            )}

            {activeTab === 'rekap-pembayaran' && (
              <RekapPembayaranTab
                santriList={santriList}
                allBulananData={allBulananData}
                dataLoading={dataLoading}
                setAlert={setAlert}
                globalActiveYear={globalActiveYear}
                initialPage={rekapInitialPage}
              />
            )}

            {activeTab === 'feedback' && (
              <div className="w-full space-y-6 animate-in pb-10">
                <h2 className="text-3xl font-black text-slate-800">Bantuan &amp; Feedback</h2>
                <p className="text-slate-500 font-medium mt-1">Gunakan formulir ini untuk melaporkan masalah atau menyarankan fitur baru.</p>
                
                <div className="bg-white border border-slate-200 rounded-[2rem] p-8 max-w-lg shadow-sm">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Subjek</label>
                      <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-emerald-500 transition-colors" placeholder="Misal: Error tombol hapus" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Pesan / Laporan Masalah</label>
                      <textarea rows="4" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-emerald-500 transition-colors resize-none" placeholder="Tulis rincian masukan Anda di sini..."></textarea>
                    </div>
                    <button 
                      onClick={() => setAlert({ type: 'success', text: 'Terima kasih! Feedback Anda telah terkirim.' })}
                      className="w-full py-3.5 bg-[#083316] text-white rounded-xl font-bold hover:bg-[#0a421d] transition-all flex items-center justify-center gap-2 shadow-sm text-sm"
                    >
                      Kirim Feedback <Icon name="send" size={16}/>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'panduan' && (
              <PanduanTab />
            )}
          </div>
        </main>
      </div>

      {/* Modals Container */}
      <ReceiptModal 
        receiptData={receiptData} 
        setReceiptData={setReceiptData} 
      />
      
      <ViewSantriModal 
        viewData={viewData}
        setViewData={setViewData}
        setAlert={setAlert}
      />
      
      <EditSantriModal 
        editData={editData} 
        setEditData={setEditData} 
        handleEditInput={handleEditInput} 
        executeUpdate={executeUpdate} 
        actionLoading={actionLoading} 
      />
      
      <DeleteSantriModal 
        deleteData={deleteData} 
        setDeleteData={setDeleteData} 
        executeDelete={executeDelete} 
        actionLoading={actionLoading} 
      />
      
      <PaymentDetailModal 
        paymentDetailData={paymentDetailData}
        setPaymentDetailData={setPaymentDetailData}
        tempPaymentState={tempPaymentState}
        setTempPaymentState={setTempPaymentState}
        isSavingPayment={isSavingPayment}
        savePaymentChanges={savePaymentChanges}
      />

      <BulananFormModal 
        bulananFormOpen={bulananFormOpen}
        setBulananFormOpen={setBulananFormOpen}
        bulananFormMode={bulananFormMode}
        bulananFormData={bulananFormData}
        setBulananFormData={setBulananFormData}
        saveBulananForm={saveBulananForm}
        dataSantri={santriList}
      />

      <UserFormModal 
        showUserForm={showUserForm}
        setShowUserForm={setShowUserForm}
        userFormData={userFormData}
        setUserFormData={setUserFormData}
        userList={userList}
        setUserList={setUserList}
        setAlert={setAlert}
      />

      <KeuanganFormModal
        keuanganFormOpen={keuanganFormOpen}
        setKeuanganFormOpen={setKeuanganFormOpen}
        keuanganFormData={keuanganFormData}
        setKeuanganFormData={setKeuanganFormData}
        keuanganFormMode={keuanganFormMode}
        onSave={saveKeuanganForm}
        setAlert={setAlert}
        selectedTahunAjaran={selectedTahunAjaran}
        dataSantri={santriList}
      />

      <TambahSantriModal
        open={showTambahSantriModal}
        onClose={() => setShowTambahSantriModal(false)}
        onNavigate={(tab) => { setActiveTab(tab); }}
      />

      <SimpleImportModal
        open={showSimpleImport}
        onClose={() => setShowSimpleImport(false)}
        onDone={refreshAfterImport}
        setAlert={setAlert}
      />

      {/* Confirmation Modal (Refresh / Logout) */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in">
          <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100 flex flex-col transform transition-all duration-300 scale-100 animate-in">
            <div className="p-6 text-center space-y-4">
              {/* Icon Circle */}
              <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-lg
                ${confirmModal.type === 'danger' 
                  ? 'bg-rose-50 text-rose-500 shadow-rose-100' 
                  : 'bg-amber-50 text-amber-500 shadow-amber-100'
                }`}
              >
                <Icon name={confirmModal.type === 'danger' ? 'log-out' : 'refresh-cw'} size={28} />
              </div>
              
              {/* Texts */}
              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">{confirmModal.title}</h3>
                <p className="text-xs text-slate-400 font-bold leading-relaxed px-2">
                  {confirmModal.message}
                </p>
              </div>
            </div>
            
            {/* Buttons */}
            <div className="px-6 pb-6 pt-2 flex gap-3">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                className="flex-1 py-3 border border-slate-200 text-slate-500 text-xs font-black uppercase rounded-xl hover:bg-slate-50 hover:text-slate-700 transition-all active:scale-[0.98]"
              >
                {confirmModal.cancelText}
              </button>
              <button
                onClick={() => {
                  setConfirmModal(prev => ({ ...prev, show: false }));
                  if (confirmModal.onConfirm) confirmModal.onConfirm();
                }}
                className={`flex-1 py-3 text-white text-xs font-black uppercase rounded-xl transition-all active:scale-[0.98] shadow-md
                  ${confirmModal.type === 'danger' 
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' 
                    : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                  }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
