const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_ROWS = 1000;

export const IMPORT_TARGETS = {
  santri: {
    label: 'Data Santri',
    headers: ['ID Pendaftaran', 'Tanggal Daftar', 'NIK', 'Nama Lengkap', 'Jenis Kelamin', 'Tempat Lahir', 'Tanggal Lahir', 'Alamat', 'Pendidikan', 'Nama Wali', 'No HP', 'Status', 'Nama Ayah', 'Nama Ibu', 'Pekerjaan Ortu']
  },
  tahunan: {
    label: 'Tagihan Tahunan',
    headers: ['ID Pendaftaran', 'Nama Santri', 'Administrasi', 'Tanggal Administrasi', 'Pengembangan P.', 'Tanggal Pengembangan P.', 'Peralatan Makan', 'Tanggal Peralatan Makan', 'Kitab', 'Tanggal Kitab', 'Perlengkapan', 'Tanggal Perlengkapan', 'Jas Almamater', 'Tanggal Jas Almamater', 'Status']
  },
  bulanan: {
    label: 'Tagihan Bulanan',
    headers: ['Student ID', 'Student Name', 'Academic Year', 'Hijri Month', 'Makan (1 Bln)', 'Tanggal Makan (1 Bln)', 'Laundry (2 Bln)', 'Tanggal Laundry (2 Bln)', 'Tabungan Ziaroh', 'Tanggal Tabungan Ziaroh', 'Status']
  }
};

const clean = value => String(value ?? '').trim();
const parseLine = line => {
  const cells = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"' && quoted) { cell += '"'; i += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === ',' && !quoted) { cells.push(cell); cell = ''; continue; }
    cell += char;
  }
  cells.push(cell);
  return cells.map(clean);
};

export const parseCsvFile = async file => {
  if (!file) throw new Error('Pilih file CSV terlebih dahulu.');
  if (!file.name.toLowerCase().endsWith('.csv')) throw new Error('Gunakan file CSV.');
  if (!file.size || file.size > MAX_FILE_BYTES) throw new Error('Ukuran file maksimal 2 MB.');

  const text = (await file.text()).replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = text.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) throw new Error('File harus memiliki header dan minimal satu baris data.');
  if (lines.length - 1 > MAX_ROWS) throw new Error(`Maksimal ${MAX_ROWS} baris per impor.`);

  return {
    fileName: file.name,
    headers: parseLine(lines[0]),
    rows: lines.slice(1).map(parseLine)
  };
};

export const headersMatch = (actual, expected) => actual.length === expected.length && actual.every((value, index) => clean(value).toLowerCase() === expected[index].toLowerCase());
