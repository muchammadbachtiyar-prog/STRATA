export const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
};

export const formatShortRupiah = (num) => {
  if (num >= 1000000) return `Rp ${parseFloat((num / 1000000).toFixed(2))} Jt`;
  if (num >= 1000) return `Rp ${parseFloat((num / 1000).toFixed(2))} Rb`;
  return `Rp ${num}`;
};

export const PAYMENT_ITEMS = [
  { key: 'administrasi', label: 'Administrasi', nominal: 350000, group: 'tahunan' },
  { key: 'pengembangan', label: 'Pengembangan P.', nominal: 150000, group: 'tahunan' },
  { key: 'peralatan', label: 'Peralatan Makan', nominal: 10000, group: 'tahunan' },
  { key: 'kitab', label: 'Kitab', nominal: 60000, group: 'tahunan' },
  { key: 'perlengkapan', label: 'Perlengkapan', nominal: 30000, group: 'tahunan' },
  { key: 'jas', label: 'Jas Almamater', nominal: 200000, group: 'tahunan' }
];

export const BULANAN_ITEMS = [
  { key: 'makan', label: 'Makan (1 Bln)', nominal: 275000, group: 'bulanan' },
  { key: 'laundry', label: 'Laundry (2 Bln)', nominal: 120000, group: 'bulanan' },
  { key: 'ziaroh', label: 'Tabungan Ziaroh', nominal: 25000, group: 'bulanan' }
];

export const TOTAL_BIAYA = PAYMENT_ITEMS.reduce((sum, item) => sum + item.nominal, 0);
export const TOTAL_BIAYA_BULANAN = BULANAN_ITEMS.reduce((sum, item) => sum + item.nominal, 0);

export const DEFAULT_FORM_DATA = {
  nik: '', namaLengkap: '', jenisKelamin: 'Laki-laki', tempatLahir: '',
  tanggalLahir: '', alamat: '', pendidikan: 'SD/MI', namaWali: '',
  noHp: '', namaAyah: '', namaIbu: '', pekerjaanOrtu: ''
};

export const onlyDigits = (value) => String(value || '').replace(/\D/g, '');

export const getScriptErrorMessage = (err, fallback = 'Terjadi kesalahan pada server.') => {
  if (!err) return fallback;
  return err.message || String(err) || fallback;
};

export const validateSantriForm = (data) => {
  if (!data) return 'Data formulir belum tersedia.';

  const nik = onlyDigits(data.nik);
  const noHp = onlyDigits(data.noHp);
  const namaLengkap = String(data.namaLengkap || '').trim();

  if (!namaLengkap) return 'Nama lengkap wajib diisi.';
  if (!/^\d{16}$/.test(nik)) return 'NIK wajib berisi tepat 16 digit angka.';
  if (!/^08\d{8,13}$/.test(noHp)) return 'Nomor HP/WA wajib diawali 08 dan berisi 10-15 digit.';

  return '';
};

export const getPaymentDateParts = (dateValue) => {
  if (!dateValue) return null;

  const text = String(dateValue).trim();
  if (/^\d{4}[-/]\d{2}[-/]\d{2}$/.test(text)) {
    const parts = text.split(/[-/]/);
    return { year: parts[0], monthIndex: parseInt(parts[1], 10) - 1, day: parseInt(parts[2], 10) };
  }

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(text)) {
    const parts = text.split('/');
    return { year: parts[2], monthIndex: parseInt(parts[1], 10) - 1, day: parseInt(parts[0], 10) };
  }

  const parsedDate = new Date(text);
  if (!Number.isNaN(parsedDate.getTime())) {
    return {
      year: String(parsedDate.getFullYear()),
      monthIndex: parsedDate.getMonth(),
      day: parsedDate.getDate()
    };
  }

  return null;
};

export const parsePaymentDate = (dateValue) => {
  const parts = getPaymentDateParts(dateValue);
  if (!parts) return null;
  return new Date(parseInt(parts.year, 10), parts.monthIndex, parts.day || 1);
};

export const formatDateIndo = (dateValue) => {
  const date = dateValue instanceof Date ? dateValue : parsePaymentDate(dateValue);
  if (!date || Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

export const dayNamesId = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const monthNamesFull = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
export const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
export const dayNamesShort = ["M", "S", "S", "R", "K", "J", "S"];

export const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateLabel = (dateKey) => {
  if (!dateKey) return '';
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

export const TAHUN_AJARAN_LIST = [
  { masehi: 2026, hijriah: 1447 },
  { masehi: 2027, hijriah: 1448 },
  { masehi: 2028, hijriah: 1449 },
  { masehi: 2029, hijriah: 1450 },
  { masehi: 2030, hijriah: 1451 }
];

export const ISLAMIC_MONTHS = [
  "Muharram", "Safar", "Rabi'ul Awal", "Rabi'ul Akhir", 
  "Jumadil Awal", "Jumadil Akhir", "Rajab", "Sya'ban", 
  "Ramadhan", "Syawal", "Dzulqa'dah", "Dzulhijjah"
];

export const KATEGORI_PEMASUKAN = [
  { key: 'pembayaran_tahunan', label: 'Pembayaran Santri (Tahunan)' },
  { key: 'pembayaran_bulanan', label: 'Pembayaran Santri (Bulanan)' },
  { key: 'donasi', label: 'Donasi' },
  { key: 'lainnya_masuk', label: 'Lainnya' }
];

export const KATEGORI_PENGELUARAN = [
  { key: 'operasional', label: 'Operasional' },
  { key: 'gaji', label: 'Gaji Pengajar' },
  { key: 'pemeliharaan', label: 'Pemeliharaan' },
  { key: 'perlengkapan_pesantren', label: 'Perlengkapan' },
  { key: 'konsumsi', label: 'Konsumsi' },
  { key: 'listrik_air', label: 'Listrik & Air' },
  { key: 'lainnya_keluar', label: 'Lainnya' }
];

export const getAllKategoriLabel = (key) => {
  const all = [...KATEGORI_PEMASUKAN, ...KATEGORI_PENGELUARAN];
  const found = all.find(k => k.key === key);
  return found ? found.label : key;
};

export const generateTransactionId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'TRX-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

