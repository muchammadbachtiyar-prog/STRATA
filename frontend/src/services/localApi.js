const STORAGE_KEYS = {
  santri: 'strata_local_santri',
  bulanan: 'strata_local_bulanan',
  keuangan: 'strata_local_keuangan'
};

const defaultSantri = [
  {
    rowIndex: 2,
    id: 'NJ-LOCAL-001',
    tanggal: '03/09/2026',
    nik: '3201234567890',
    namaLengkap: 'Muchammad Hamzah',
    jenisKelamin: 'Laki-laki',
    tempatLahir: 'Jakarta',
    tanggalLahir: '2010-05-15',
    alamat: 'Jl. Melati No. 12',
    pendidikan: 'SMP/MTs',
    namaWali: 'Budi',
    noHp: '081234567890',
    status: 'Aktif',
    namaAyah: 'Budi',
    namaIbu: 'Siti',
    pekerjaanOrtu: 'Wiraswasta',
    pembayaran: {
      administrasi: true,
      administrasi_tanggal: '03/09/2026',
      pengembangan: true,
      pengembangan_tanggal: '03/09/2026',
      makan: true,
      makan_tanggal: '03/09/2026'
    }
  },
  {
    rowIndex: 3,
    id: 'NJ-LOCAL-002',
    tanggal: '03/09/2026',
    nik: '3201234567891',
    namaLengkap: 'Ahmad Najieh',
    jenisKelamin: 'Laki-laki',
    tempatLahir: 'Bandung',
    tanggalLahir: '2011-08-20',
    alamat: 'Jl. Mawar No. 5',
    pendidikan: 'SD/MI',
    namaWali: 'Andi',
    noHp: '081234568888',
    status: 'Aktif',
    namaAyah: 'Andi',
    namaIbu: 'Ani',
    pekerjaanOrtu: 'PNS',
    pembayaran: {}
  }
];

const defaultBulanan = [
  { rowIndex: 2, studentId: 'NJ-LOCAL-001', studentName: 'Muchammad Hamzah', academicYear: '2026', hijriMonth: 'Muharram', makan: true, laundry: true, ziaroh: true },
  { rowIndex: 3, studentId: 'NJ-LOCAL-001', studentName: 'Muchammad Hamzah', academicYear: '2026', hijriMonth: 'Safar', makan: true, laundry: true, ziaroh: false },
  { rowIndex: 4, studentId: 'NJ-LOCAL-002', studentName: 'Ahmad Najieh', academicYear: '2026', hijriMonth: 'Muharram', makan: true, laundry: false, ziaroh: true }
];

const defaultKeuangan = [
  { id: 'TRX-LOCAL-001', rowIndex: 2, tanggal: '2026/09/01', tipe: 'pemasukan', kategori: 'pembayaran_tahunan', deskripsi: 'Pembayaran Administrasi - Muchammad Hamzah', nominal: 350000, bulanHijri: 'Muharram', tahunAjaran: '2026', referensi: 'NJ-LOCAL-001', dibuatOleh: 'Local Preview' },
  { id: 'TRX-LOCAL-002', rowIndex: 3, tanggal: '2026/09/02', tipe: 'pengeluaran', kategori: 'operasional', deskripsi: 'Pembelian ATK Kantor', nominal: 150000, bulanHijri: 'Muharram', tahunAjaran: '2026', referensi: '', dibuatOleh: 'Local Preview' }
];

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    if (value) return JSON.parse(value);
  } catch (error) {
    console.warn('Local storage tidak tersedia:', error);
  }
  return structuredClone(fallback);
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Gagal menyimpan local fixture:', error);
  }
  return value;
}

export async function loginWithPassword(username, password) {
  await new Promise(resolve => setTimeout(resolve, 250));
  if (String(username).trim() !== 'admin' || password !== 'admin123') {
    return { success: false, message: 'Login lokal gagal. Gunakan admin / admin123.' };
  }
  return {
    success: true,
    user: {
      userId: 'local-admin',
      username: 'admin',
      name: 'Local Administrator',
      role: 'Developer',
      status: 'Aktif',
      permissions: ['*']
    }
  };
}

export async function getSantriData() {
  return read(STORAGE_KEYS.santri, defaultSantri);
}

export async function getBulananData(_sessionToken, filters = {}) {
  const data = read(STORAGE_KEYS.bulanan, defaultBulanan);
  return data.filter(item =>
    (!filters.hijriMonth || item.hijriMonth === filters.hijriMonth) &&
    (!filters.academicYear || filters.academicYear === 'Semua' || String(item.academicYear) === String(filters.academicYear))
  );
}

export async function getKeuanganData() {
  return read(STORAGE_KEYS.keuangan, defaultKeuangan);
}

export async function processForm(_token, formData) {
  const data = read(STORAGE_KEYS.santri, defaultSantri);
  const next = [...data, { ...formData, rowIndex: data.length + 2, id: formData.id || `NJ-LOCAL-${String(data.length + 1).padStart(3, '0')}`, pembayaran: {} }];
  write(STORAGE_KEYS.santri, next);
  return { success: true, message: 'Data berhasil disimpan (Local Preview).' };
}

export async function updateSantri(_token, rowIndex, data) {
  const next = read(STORAGE_KEYS.santri, defaultSantri).map(item => item.rowIndex === rowIndex ? { ...item, ...data } : item);
  write(STORAGE_KEYS.santri, next);
  return { success: true, message: 'Data berhasil diperbarui (Local Preview).' };
}

export async function deleteSantri(_token, rowIndex) {
  write(STORAGE_KEYS.santri, read(STORAGE_KEYS.santri, defaultSantri).filter(item => item.rowIndex !== rowIndex));
  return { success: true, message: 'Data berhasil dihapus (Local Preview).' };
}

export async function updatePembayaran(_token, rowIndex, pembayaran) {
  const next = read(STORAGE_KEYS.santri, defaultSantri).map(item => item.rowIndex === rowIndex ? { ...item, pembayaran } : item);
  write(STORAGE_KEYS.santri, next);
  return { success: true, message: 'Data pembayaran berhasil disimpan (Local Preview).' };
}

export async function saveBulananEntry(_token, payload) {
  const data = read(STORAGE_KEYS.bulanan, defaultBulanan);
  const existingIndex = data.findIndex(item => item.rowIndex === payload.rowIndex);
  const entry = { ...payload, rowIndex: payload.rowIndex || data.length + 2 };
  if (existingIndex >= 0) data[existingIndex] = entry;
  else data.push(entry);
  write(STORAGE_KEYS.bulanan, data);
  return { success: true, message: 'Data bulanan berhasil disimpan (Local Preview).' };
}

export async function deleteBulananEntry(_token, rowIndex) {
  write(STORAGE_KEYS.bulanan, read(STORAGE_KEYS.bulanan, defaultBulanan).filter(item => item.rowIndex !== rowIndex));
  return { success: true, message: 'Data bulanan berhasil dihapus (Local Preview).' };
}

export async function saveSantriPhoto() {
  return { success: true, message: 'Foto disimpan (Local Preview).' };
}

export async function importCsvData() {
  return { success: true, message: 'Data diimpor (Local Preview).' };
}
