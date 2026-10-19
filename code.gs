/**
 * Fungsi untuk melayani permintaan halaman web
 */
function doGet(e) {
  let page = 'Index';

  if (e && e.parameter && e.parameter.page) {
    const requestedPage = String(e.parameter.page).toLowerCase();
    if (requestedPage === 'index') {
      page = 'Index'; // Buka Dashboard
    } else if (requestedPage === 'register') {
      page = 'Register'; // Buka halaman pendaftaran
    } else if (requestedPage === 'login') {
      page = 'Login'; // Buka halaman login
    }
  }

  // Gunakan createHtmlOutputFromFile untuk Index (React SPA) agar Apps Script
  // tidak memproses scriptlet <? ... ?> pada JS terkompresi yang menyebabkan SyntaxError
  if (page === 'Index') {
    return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('STRATA - Santri Tabular Reporting & Academic Tracking')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  return HtmlService.createTemplateFromFile(page)
    .evaluate()
    .setTitle('STRATA - Santri Tabular Reporting & Academic Tracking')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

const SPREADSHEET_ID = '1yBycLG-jACeGTONpcbT2Mh62pPn48ddtNyQQKPt_sZ4';
const SPREADSHEET_ID_BULANAN = '1sGCPNCuzfgIL9YmaGL5Uxfv34nHJ61MQS6qCSfbL1hc';
const AUTH_SPREADSHEET_ID = '1Hsnn_IB2tqRQPS7WX3yTXITUuohOoT4Xq1OC92pk1Mk';
const DEFAULT_STATUS = 'Aktif';
const PAYMENT_KEYS = [
  'administrasi',
  'pengembangan',
  'peralatan',
  'kitab',
  'perlengkapan',
  'jas'
];
const ISLAMIC_MONTHS = ["Muharram", "Safar", "Rabi'ul Awal", "Rabi'ul Akhir", "Jumadil Awal", "Jumadil Akhir", "Rajab", "Sya'ban", "Ramadhan", "Syawal", "Dzulqa'dah", "Dzulhijjah"];

const SANTRI_CACHE_KEY = 'ppnj_santri_data_v2';
const SANTRI_CACHE_TTL_SECONDS = 120;

// Authentication Phase 1: server-side account/session primitives.
const ACCOUNT_HEADERS_V2 = [
  'UserId', 'Username', 'PasswordHash', 'PasswordSalt', 'Nama', 'Role',
  'Status', 'FailedAttempts', 'LockedUntil', 'PasswordChangedAt',
  'LastLoginAt', 'CreatedAt', 'UpdatedAt'
];
const SESSION_HEADERS_V1 = [
  'SessionId', 'TokenHash', 'UserId', 'CreatedAt', 'LastSeenAt',
  'ExpiresAt', 'RevokedAt', 'RevokeReason', 'Status'
];
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const SESSION_IDLE_TIMEOUT_SECONDS = 60 * 60;
const AUTH_MAX_FAILED_ATTEMPTS = 5;
const AUTH_LOCKOUT_SECONDS = 15 * 60;
const AUTH_LAST_SEEN_UPDATE_SECONDS = 5 * 60;

const KEUANGAN_TRX_HEADERS = [
  'ID Transaksi',
  'Tanggal',
  'Tipe',
  'Kategori',
  'Deskripsi',
  'Nominal',
  'Bulan Hijri',
  'Tahun Ajaran',
  'Referensi',
  'Dibuat Oleh'
];

const SANTRI_HEADERS = [
  'ID Pendaftaran',
  'Tanggal Daftar',
  'NIK',
  'Nama Lengkap',
  'Jenis Kelamin',
  'Tempat Lahir',
  'Tanggal Lahir',
  'Alamat',
  'Pendidikan',
  'Nama Wali',
  'No HP',
  'Status',
  'Nama Ayah',
  'Nama Ibu',
  'Pekerjaan Ortu'
];

const KEUANGAN_HEADERS = [
  'ID Pendaftaran',
  'Nama Santri',
  'Administrasi',
  'Tanggal Administrasi',
  'Pengembangan P.',
  'Tanggal Pengembangan P.',
  'Peralatan Makan',
  'Tanggal Peralatan Makan',
  'Kitab',
  'Tanggal Kitab',
  'Perlengkapan',
  'Tanggal Perlengkapan',
  'Jas Almamater',
  'Tanggal Jas Almamater',
  'Status'
];

// Helper function untuk memanggil Sheet
function getSheetSantri(ss) {
  const sheetName = 'DataSantri';
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    const firstSheet = ss.getSheets()[0];
    if (firstSheet && ['Tahunan', 'Account', 'Bulanan'].indexOf(firstSheet.getName()) === -1) {
      sheet = firstSheet;
      try {
        sheet.setName(sheetName);
      } catch (e) {}
    } else {
      sheet = ss.insertSheet(sheetName);
    }
  }

  ensureHeaderRow(sheet, SANTRI_HEADERS);
  return sheet;
}
function getSheetKeuangan(ss) {
  const sheetName = 'Tahunan';
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    const sheets = ss.getSheets();
    const fallbackSheet = sheets.length > 1 ? sheets[1] : null;
    if (fallbackSheet && ['DataSantri', 'Account', 'Bulanan'].indexOf(fallbackSheet.getName()) === -1) {
      sheet = fallbackSheet;
      try {
        sheet.setName(sheetName);
      } catch (e) {}
    } else {
      sheet = ss.insertSheet(sheetName);
    }
  }

  migrateLegacyKeuanganSheet(sheet);
  ensureHeaderRow(sheet, KEUANGAN_HEADERS);
  return sheet;
}

function ensureHeaderRow(sheet, headers) {
  if (sheet.getMaxColumns() < headers.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
  }

  const currentHeader = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const headerString = currentHeader.map(h => String(h || '').trim()).join('|');
  const expectedString = headers.join('|');

  const headerChanged = headerString !== expectedString;

  if (headerChanged) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#0a421d');
    headerRange.setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  } else if (sheet.getFrozenRows() !== 1) {
    sheet.setFrozenRows(1);
  }
}

function getCachedSantriData() {
  try {
    const cached = CacheService.getScriptCache().get(SANTRI_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch (e) {
    return null;
  }
}

function setCachedSantriData(data) {
  try {
    CacheService.getScriptCache().put(SANTRI_CACHE_KEY, JSON.stringify(data), SANTRI_CACHE_TTL_SECONDS);
  } catch (e) {}
}

function invalidateSantriCache() {
  try {
    CacheService.getScriptCache().remove(SANTRI_CACHE_KEY);
  } catch (e) {}
}

function migrateLegacyKeuanganSheet(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const header = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(h => String(h || '').trim().toLowerCase());
  const secondHeader = header[1] || '';
  const thirdHeader = header[2] || '';

  const alreadyHasNameColumn = ['nama', 'nama santri', 'student name'].indexOf(secondHeader) !== -1;
  const looksLikeLegacyPaymentColumn = ['administrasi', 'pengembangan', 'pengembangan p.', 'bayar administrasi'].indexOf(secondHeader) !== -1 || thirdHeader.indexOf('tanggal') !== -1;

  if (!alreadyHasNameColumn && looksLikeLegacyPaymentColumn) {
    sheet.insertColumnAfter(1);
  }
}

/**
 * Authentication Phase 1.
 * Account now stores only PasswordHash + PasswordSalt; never plaintext passwords.
 * Existing legacy rows are migrated in memory and rewritten as hashes on first access.
 */
function getOrCreateSheetAccount(ss) {
  ss = ss || SpreadsheetApp.openById(AUTH_SPREADSHEET_ID);
  const sheetName = 'Account';
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  migrateAccountSchema_(sheet);
  return sheet;
}

function migrateAccountSchema_(sheet) {
  const columnCount = Math.max(sheet.getLastColumn(), ACCOUNT_HEADERS_V2.length);
  const values = sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), columnCount).getValues();
  const header = values[0].map(function(value) { return String(value || '').trim(); });
  const isCurrentSchema = ACCOUNT_HEADERS_V2.every(function(name, index) {
    return header[index] === name;
  });
  if (isCurrentSchema) {
    ensureHeaderRow(sheet, ACCOUNT_HEADERS_V2);
    return;
  }

  const legacyRows = values.slice(1).filter(function(row) {
    return String(row[0] || '').trim() || String(row[1] || '').trim();
  });
  const now = authIso_(authNow_());
  const migratedRows = legacyRows.map(function(row) {
    const username = String(row[0] || '').trim();
    const legacyPassword = String(row[1] || '').trim();
    const legacyRole = String(row[2] || 'Viewer').trim() || 'Viewer';
    if (!username || !legacyPassword) {
      return [Utilities.getUuid(), username, '', '', username, legacyRole, 'Nonaktif', 0, '', now, '', now, now];
    }
    const salt = generateAuthSalt_();
    return [Utilities.getUuid(), username, hashPassword_(legacyPassword, salt), salt,
      username, legacyRole, 'Aktif', 0, '', now, '', now, now];
  });

  if (sheet.getMaxColumns() < ACCOUNT_HEADERS_V2.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), ACCOUNT_HEADERS_V2.length - sheet.getMaxColumns());
  }
  sheet.getRange(1, 1, 1, ACCOUNT_HEADERS_V2.length).setValues([ACCOUNT_HEADERS_V2]);
  if (migratedRows.length) {
    sheet.getRange(2, 1, migratedRows.length, ACCOUNT_HEADERS_V2.length).setValues(migratedRows);
  }
  const rowsToClear = Math.max(sheet.getMaxRows() - 1 - migratedRows.length, 0);
  if (rowsToClear > 0) {
    sheet.getRange(migratedRows.length + 2, 1, rowsToClear, ACCOUNT_HEADERS_V2.length).clearContent();
  }
  const headerRange = sheet.getRange(1, 1, 1, ACCOUNT_HEADERS_V2.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#0a421d');
  headerRange.setFontColor('#ffffff');
  sheet.setFrozenRows(1);
}

function getOrCreateSheetSession(ss) {
  const sheetName = 'Session';
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  ensureHeaderRow(sheet, SESSION_HEADERS_V1);
  return sheet;
}

function authNow_() {
  return new Date();
}

function authIso_(date) {
  return date instanceof Date ? date.toISOString() : new Date(date).toISOString();
}

function authBytesToHex_(bytes) {
  return bytes.map(function(byte) {
    const value = byte < 0 ? byte + 256 : byte;
    return ('0' + value.toString(16)).slice(-2);
  }).join('');
}

function authTextBytes_(text) {
  return Utilities.newBlob(String(text)).getBytes();
}

function generateAuthSalt_() {
  return authBytesToHex_(Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    authTextBytes_(Utilities.getUuid() + ':' + Utilities.getUuid() + ':' + new Date().getTime())
  ));
}

function hashPassword_(password, salt) {
  let value = String(salt) + ':' + String(password);
  for (let i = 0; i < 12000; i++) {
    value = authBytesToHex_(Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      authTextBytes_(value)
    ));
  }
  return value;
}

function generateSessionToken_() {
  // Opaque token: only random material, no user/role/permission data.
  return Utilities.getUuid().replace(/-/g, '') +
    Utilities.getUuid().replace(/-/g, '') +
    Utilities.getUuid().replace(/-/g, '');
}

function hashSessionToken_(token) {
  return authBytesToHex_(Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    authTextBytes_(String(token))
  ));
}

function authConstantTimeEqual_(left, right) {
  left = String(left || '');
  right = String(right || '');
  if (left.length !== right.length) return false;
  let result = 0;
  for (let i = 0; i < left.length; i++) {
    result |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return result === 0;
}

function accountColumnMap_() {
  const result = {};
  ACCOUNT_HEADERS_V2.forEach(function(header, index) { result[header] = index; });
  return result;
}

function sessionColumnMap_() {
  const result = {};
  SESSION_HEADERS_V1.forEach(function(header, index) { result[header] = index; });
  return result;
}

const AUTH_PERMISSION_MATRIX = {
  'Super Admin': '*',
  'Developer': '*',
  'Admin': [
    'students.view', 'students.create', 'students.update', 'students.delete',
    'payments.view', 'payments.update', 'payments.monthly.view',
    'payments.monthly.update', 'payments.monthly.delete', 'finance.view',
    'finance.summary.view', 'reports.view', 'sync.execute'
  ],
  'Admin Pusat': [
    'students.view', 'students.create', 'students.update',
    'payments.view', 'payments.update', 'payments.monthly.view',
    'payments.monthly.update', 'finance.view', 'finance.summary.view',
    'reports.view', 'sync.execute'
  ],
  'Operator Santri': ['students.view', 'students.create', 'students.update'],
  'Operator Pembayaran': [
    'students.view', 'payments.view', 'payments.update',
    'payments.monthly.view', 'payments.monthly.update'
  ],
  'Bendahara': [
    'payments.view', 'finance.view', 'finance.summary.view',
    'finance.create', 'finance.update', 'finance.delete'
  ],

  'Viewer': ['students.view', 'payments.view', 'payments.monthly.view', 'reports.view'],
  'Nonaktif': []
};

function authorizationResponse_(code, message) {
  return {
    success: false,
    authorized: false,
    code: code,
    message: message
  };
}

function getPermissionsForRole_(role) {
  const permissions = AUTH_PERMISSION_MATRIX[String(role || '')];
  if (permissions === '*') return ['*'];
  return Array.isArray(permissions) ? permissions.slice() : [];
}

function getAuthenticatedUser_(sessionToken) {
  const validation = validateSession(sessionToken);
  if (!validation || !validation.authenticated || !validation.user) {
    const code = validation && validation.code ? validation.code : 'SESSION_INVALID';
    const message = code === 'USER_DISABLED'
      ? 'Akun tidak aktif.'
      : code === 'SESSION_EXPIRED'
        ? 'Session telah kedaluwarsa.'
        : 'Session tidak valid.';
    return { authorized: false, response: authorizationResponse_(code, message) };
  }

  const user = validation.user;
  const permissions = getPermissionsForRole_(user.role);
  if (String(user.status || '').toLowerCase() !== 'aktif') {
    return { authorized: false, response: authorizationResponse_('USER_DISABLED', 'Akun tidak aktif.') };
  }
  return {
    authorized: true,
    user: {
      userId: user.userId,
      username: user.username,
      name: user.name,
      role: user.role,
      status: user.status,
      permissions: permissions
    },
    expiresAt: validation.expiresAt
  };
}

function requireAuthenticatedUser_(sessionToken) {
  // Mode internal tanpa session. Akses aplikasi dibatasi oleh deployment
  // Apps Script/Google Workspace; parameter dipertahankan untuk kompatibilitas.
  return {
    authorized: true,
    user: {
      userId: 'internal-app-user',
      username: 'internal-app-user',
      name: 'Pengurus Pesantren',
      role: 'Developer',
      status: 'Aktif',
      permissions: ['*']
    }
  };
}

function requirePermission_(authenticatedUser, permissionCode) {
  if (!authenticatedUser || !authenticatedUser.authorized || !authenticatedUser.user) {
    return { authorized: false, response: authorizationResponse_('SESSION_INVALID', 'Session tidak valid.') };
  }
  const permissions = authenticatedUser.user.permissions || [];
  if (permissions.indexOf('*') !== -1 || permissions.indexOf(permissionCode) !== -1) {
    return { authorized: true, user: authenticatedUser.user };
  }
  return {
    authorized: false,
    response: authorizationResponse_('FORBIDDEN', 'Anda tidak memiliki izin untuk operasi ini.')
  };
}

function authSafeUser_(row, columns) {
  return {
    userId: String(row[columns.UserId] || ''),
    username: String(row[columns.Username] || ''),
    name: String(row[columns.Nama] || row[columns.Username] || ''),
    role: String(row[columns.Role] || 'Viewer'),
    status: String(row[columns.Status] || '')
  };
}

function getAccountRowByUsername_(sheet, username) {
  const columns = accountColumnMap_();
  const values = sheet.getDataRange().getValues();
  const normalized = String(username || '').trim().toLowerCase();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][columns.Username] || '').trim().toLowerCase() === normalized) {
      return { rowNumber: i + 1, values: values[i], columns: columns };
    }
  }
  return null;
}

function getAccountRowById_(sheet, userId) {
  const columns = accountColumnMap_();
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][columns.UserId] || '') === String(userId || '')) {
      return { rowNumber: i + 1, values: values[i], columns: columns };
    }
  }
  return null;
}

function createSession_(account) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheetSession(ss);
  const token = generateSessionToken_();
  const now = authNow_();
  const expiry = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000);
  const sessionId = Utilities.getUuid();
  sheet.appendRow([sessionId, hashSessionToken_(token), account.userId,
    authIso_(now), authIso_(now), authIso_(expiry), '', '', 'Active']);
  return { token: token, sessionId: sessionId, expiresAt: authIso_(expiry) };
}

function loginWithPassword(username, password) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = SpreadsheetApp.openById(AUTH_SPREADSHEET_ID);
    const sheet = getOrCreateSheetAccount(ss);

    const found = getAccountRowByUsername_(sheet, username);
    const generic = { success: false, message: 'Username atau password salah.' };
    if (!found) return generic;
    const row = found.values;
    const c = found.columns;
    const now = authNow_();
    const status = String(row[c.Status] || 'Aktif').trim().toLowerCase();
    const lockedUntil = row[c.LockedUntil] ? new Date(row[c.LockedUntil]) : null;
    if (status !== 'aktif' || (lockedUntil && lockedUntil.getTime() > now.getTime())) {
      return generic;
    }
    const valid = authConstantTimeEqual_(hashPassword_(password, row[c.PasswordSalt]), row[c.PasswordHash]);
    if (!valid) {
      const attempts = Number(row[c.FailedAttempts] || 0) + 1;
      const lockUntilValue = attempts >= AUTH_MAX_FAILED_ATTEMPTS
        ? authIso_(new Date(now.getTime() + AUTH_LOCKOUT_SECONDS * 1000)) : '';
      sheet.getRange(found.rowNumber, c.FailedAttempts + 1).setValue(attempts);
      sheet.getRange(found.rowNumber, c.LockedUntil + 1).setValue(lockUntilValue);
      return generic;
    }
    sheet.getRange(found.rowNumber, c.FailedAttempts + 1).setValue(0);
    sheet.getRange(found.rowNumber, c.LockedUntil + 1).setValue('');
    sheet.getRange(found.rowNumber, c.LastLoginAt + 1).setValue(authIso_(now));
    sheet.getRange(found.rowNumber, c.UpdatedAt + 1).setValue(authIso_(now));
    const account = authSafeUser_(row, c);
    account.permissions = getPermissionsForRole_(account.role);
    return { success: true, message: 'Login berhasil', user: account, role: account.role };
  } finally {
    lock.releaseLock();
  }
}

function findSessionRow_(sheet, tokenHash) {
  const c = sessionColumnMap_();
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (authConstantTimeEqual_(values[i][c.TokenHash], tokenHash)) {
      return { rowNumber: i + 1, values: values[i], columns: c };
    }
  }
  return null;
}

function validateSession(sessionToken) {
  const generic = { success: false, authenticated: false, code: 'SESSION_INVALID', message: 'Session tidak valid.' };
  if (!sessionToken || String(sessionToken).length < 32) return generic;
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sessionSheet = getOrCreateSheetSession(ss);
    const found = findSessionRow_(sessionSheet, hashSessionToken_(sessionToken));
    if (!found) return generic;
    const row = found.values;
    const c = found.columns;
    const now = authNow_();
    if (String(row[c.Status]) !== 'Active' || row[c.RevokedAt] || new Date(row[c.ExpiresAt]).getTime() <= now.getTime()) {
      return generic;
    }
    if (row[c.LastSeenAt] && now.getTime() - new Date(row[c.LastSeenAt]).getTime() > SESSION_IDLE_TIMEOUT_SECONDS * 1000) {
      sessionSheet.getRange(found.rowNumber, c.Status + 1).setValue('Expired');
      return { success: false, authenticated: false, code: 'SESSION_EXPIRED', message: 'Session telah kedaluwarsa.' };
    }
    const accountSheet = getOrCreateSheetAccount(ss);
    const accountFound = getAccountRowById_(accountSheet, row[c.UserId]);
    if (!accountFound || String(accountFound.values[accountFound.columns.Status] || '').toLowerCase() !== 'aktif') {
      return { success: false, authenticated: false, code: 'USER_DISABLED', message: 'Akun tidak aktif.' };
    }
    if (!row[c.LastSeenAt] || now.getTime() - new Date(row[c.LastSeenAt]).getTime() >= AUTH_LAST_SEEN_UPDATE_SECONDS * 1000) {
      sessionSheet.getRange(found.rowNumber, c.LastSeenAt + 1).setValue(authIso_(now));
    }
    return { success: true, authenticated: true, user: authSafeUser_(accountFound.values, accountFound.columns), expiresAt: row[c.ExpiresAt] };
  } finally {
    lock.releaseLock();
  }
}

function revokeSession(sessionToken, reason) {
  const generic = { success: true, message: 'Logout berhasil.' };
  if (!sessionToken) return generic;
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = getOrCreateSheetSession(SpreadsheetApp.openById(SPREADSHEET_ID));
    const found = findSessionRow_(sheet, hashSessionToken_(sessionToken));
    if (!found) return generic;
    const c = found.columns;
    sheet.getRange(found.rowNumber, c.RevokedAt + 1).setValue(authIso_(authNow_()));
    sheet.getRange(found.rowNumber, c.RevokeReason + 1).setValue(String(reason || 'USER_LOGOUT'));
    sheet.getRange(found.rowNumber, c.Status + 1).setValue('Revoked');
    return generic;
  } finally {
    lock.releaseLock();
  }
}

function cleanupExpiredSessions() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = getOrCreateSheetSession(SpreadsheetApp.openById(SPREADSHEET_ID));
    const c = sessionColumnMap_();
    const values = sheet.getDataRange().getValues();
    const now = authNow_();
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][c.Status]) === 'Active' && new Date(values[i][c.ExpiresAt]).getTime() <= now.getTime()) {
        sheet.getRange(i + 1, c.Status + 1).setValue('Expired');
      }
    }
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

/** Compatibility wrapper retained for the existing frontend. */
function verifyLogin(username, password) {
  return loginWithPassword(username, password);
}

/**
 * Helper untuk memastikan sheet 'Bulanan' tersedia dengan header standar.
 * Header: Student ID, Student Name, Academic Year, Hijri Month, Makan (1 Bln), Tanggal Makan (1 Bln), Laundry (2 Bln), Tanggal Laundry (2 Bln), Tabungan Ziaroh, Tanggal Tabungan Ziaroh, Status
 */
/**
 * Helper untuk normalisasi nama bulan (mengabaikan kapitalisasi, spasi, apostrof, dan variasi ejaan)
 */
function normalizeMonthName(name) {
  if (!name) return '';
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/['`’]/g, '')
    .replace(/\s+/g, '')
    .replace(/ww/g, 'w')
    .replace(/dh/g, 'dz')
    .replace(/sh/g, 'sy');
}

/**
 * Helper untuk memastikan sheet Bulanan tersedia di Spreadsheet Khusus Bulanan.
 * Mendukung tab spesifik bulan (Muharram, Safar, Rabi'ul Awwal, dll) secara fleksibel.
 */
function getOrCreateSheetBulanan(ssBulanan, monthName) {
  ssBulanan = SpreadsheetApp.openById(SPREADSHEET_ID_BULANAN);

  const headers = [
    'Student ID',
    'Student Name',
    'Academic Year',
    'Hijri Month',
    'Makan (1 Bln)',
    'Tanggal Makan (1 Bln)',
    'Laundry (2 Bln)',
    'Tanggal Laundry (2 Bln)',
    'Tabungan Ziaroh',
    'Tanggal Tabungan Ziaroh',
    'Status'
  ];

  let targetSheetName = monthName ? String(monthName).trim() : 'Muharram';
  let sheet = ssBulanan.getSheetByName(targetSheetName);

  // Jika nama sheet eksak tidak ditemukan, cari sheet ter-normalisasi yang cocok
  if (!sheet && monthName) {
    const targetNorm = normalizeMonthName(monthName);
    const sheets = ssBulanan.getSheets();
    for (let i = 0; i < sheets.length; i++) {
      const sName = sheets[i].getName();
      if (['Tahunan', 'Account', 'DataSantri'].indexOf(sName) !== -1) continue;
      if (normalizeMonthName(sName) === targetNorm) {
        sheet = sheets[i];
        break;
      }
    }
  }

  // Jika masih belum ditemukan, buat sheet baru sesuai nama bulan yang diminta
  if (!sheet) {
    sheet = ssBulanan.insertSheet(targetSheetName);
  }

  ensureHeaderRow(sheet, headers);
  return sheet;
}

/**
 * Memindahkan entri bulanan yang tersimpan di sheet yang salah ke sheet bulan yang benar
 */
function cleanupMisplacedBulananRows(ssBulanan) {
  try {
    if (!ssBulanan) ssBulanan = SpreadsheetApp.openById(SPREADSHEET_ID_BULANAN);
    const sheets = ssBulanan.getSheets();

    sheets.forEach(sheet => {
      const sheetName = sheet.getName();
      if (['Tahunan', 'Account', 'DataSantri'].indexOf(sheetName) !== -1) return;

      const lastRow = sheet.getLastRow();
      if (lastRow < 2) return;

      const data = sheet.getRange(2, 1, lastRow - 1, 11).getValues();
      const rowsToDelete = [];

      for (let i = 0; i < data.length; i++) {
        const studentId = String(data[i][0] || '').trim();
        const rowHijriMonth = String(data[i][3] || '').trim();

        if (!studentId || !rowHijriMonth) continue;

        // Jika bulan di baris berbeda dari nama sheet ini, pindahkan
        if (normalizeMonthName(rowHijriMonth) !== normalizeMonthName(sheetName)) {
          const targetSheet = getOrCreateSheetBulanan(ssBulanan, rowHijriMonth);
          const targetLastRow = targetSheet.getLastRow();
          let targetRow = -1;

          if (targetLastRow >= 2) {
            const targetData = targetSheet.getRange(2, 1, targetLastRow - 1, 11).getValues();
            for (let t = 0; t < targetData.length; t++) {
              if (
                String(targetData[t][0] || '').trim() === studentId &&
                String(targetData[t][2] || '').trim() === String(data[i][2] || '').trim()
              ) {
                targetRow = t + 2;
                break;
              }
            }
          }

          if (targetRow !== -1) {
            targetSheet.getRange(targetRow, 1, 1, 11).setValues([data[i]]);
          } else {
            targetSheet.appendRow(data[i]);
          }

          rowsToDelete.push(i + 2);
        }
      }

      // Hapus baris dari bawah ke atas
      for (let d = rowsToDelete.length - 1; d >= 0; d--) {
        sheet.deleteRow(rowsToDelete[d]);
      }
    });
  } catch (e) {}
}

/**
 * Mengambil data Bulanan dari Spreadsheet Bulanan Khusus dengan filter opsional (academicYear, hijriMonth, studentId)
 */
function getBulananData(sessionToken, filters) {
  const authenticated = requireAuthenticatedUser_(sessionToken);
  if (!authenticated.authorized) return authenticated.response;
  const permitted = requirePermission_(authenticated, 'payments.monthly.view');
  if (!permitted.authorized) return permitted.response;

  try {
    filters = filters || {};
    const ssBulanan = SpreadsheetApp.openById(SPREADSHEET_ID_BULANAN);
    cleanupMisplacedBulananRows(ssBulanan);

    const result = [];

    if (filters.hijriMonth && String(filters.hijriMonth) !== 'Semua') {
      const sheet = getOrCreateSheetBulanan(ssBulanan, filters.hijriMonth);
      readBulananRowsFromSheet(sheet, result, filters);
    } else {
      const sheets = ssBulanan.getSheets();
      sheets.forEach(sheet => {
        readBulananRowsFromSheet(sheet, result, filters);
      });
    }

    return result;
  } catch (e) {
    return [];
  }
}

function readBulananRowsFromSheet(sheet, result, filters) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const sheetName = sheet.getName();
  if (['Tahunan', 'Account', 'DataSantri'].indexOf(sheetName) !== -1) return;

  const values = sheet.getRange(2, 1, lastRow - 1, 11).getValues();

  values.forEach((row, idx) => {
    const studentId = String(row[0] || '').trim();
    if (!studentId) return;

    const hijriMonth = String(row[3] || '').trim() || sheetName;
    const item = {
      sheetName: sheetName,
      rowIndex: idx + 2,
      studentId: studentId,
      studentName: String(row[1] || '').trim(),
      academicYear: String(row[2] || '').trim(),
      hijriMonth: hijriMonth,
      makan: parseBool(row[4]),
      makan_tanggal: row[5] ? formatPaymentDate(row[5]) : '',
      laundry: parseBool(row[6]),
      laundry_tanggal: row[7] ? formatPaymentDate(row[7]) : '',
      ziaroh: parseBool(row[8]),
      ziaroh_tanggal: row[9] ? formatPaymentDate(row[9]) : '',
      status: String(row[10] || '').trim() || 'Belum Lunas'
    };

    if (filters.academicYear && String(filters.academicYear) !== 'Semua' && item.academicYear !== String(filters.academicYear)) return;
    if (filters.hijriMonth && String(filters.hijriMonth) !== 'Semua' && normalizeMonthName(item.hijriMonth) !== normalizeMonthName(filters.hijriMonth) && normalizeMonthName(sheetName) !== normalizeMonthName(filters.hijriMonth)) return;
    if (filters.studentId && item.studentId !== String(filters.studentId)) return;

    result.push(item);
  });
}

/**
 * Menyimpan satu entri pembayaran bulanan ke Spreadsheet Bulanan Khusus pada tab bulan terkait.
 */
function saveBulananEntry(sessionToken, payload) {
  const authenticated = requireAuthenticatedUser_(sessionToken);
  if (!authenticated.authorized) return authenticated.response;
  const permitted = requirePermission_(authenticated, 'payments.monthly.update');
  if (!permitted.authorized) return permitted.response;

  try {
    if (!payload) throw new Error('Data bulanan kosong.');
    const ssBulanan = SpreadsheetApp.openById(SPREADSHEET_ID_BULANAN);

    const studentId = cleanText(payload.studentId);
    const studentName = cleanText(payload.studentName);
    const academicYear = cleanText(payload.academicYear);
    const hijriMonth = cleanText(payload.hijriMonth);

    if (!studentId) throw new Error('Student ID wajib diisi.');
    if (!hijriMonth) throw new Error('Hijri Month wajib diisi.');

    const sheetBulanan = getOrCreateSheetBulanan(ssBulanan, hijriMonth);

    const makan = parseBool(payload.makan);
    const makan_tanggal = cleanText(payload.makan_tanggal) || '';
    const laundry = parseBool(payload.laundry);
    const laundry_tanggal = cleanText(payload.laundry_tanggal) || '';
    const ziaroh = parseBool(payload.ziaroh);
    const ziaroh_tanggal = cleanText(payload.ziaroh_tanggal) || '';

    const isLunas = makan && laundry && ziaroh;
    const status = isLunas ? 'Lunas' : 'Belum Lunas';

    const lastRow = sheetBulanan.getLastRow();
    let targetRow = -1;

    if (lastRow >= 2) {
      const data = sheetBulanan.getRange(2, 1, lastRow - 1, 11).getValues();
      for (let i = 0; i < data.length; i++) {
        if (
          String(data[i][0] || '').trim() === studentId &&
          (String(data[i][2] || '').trim() === academicYear || !academicYear)
        ) {
          targetRow = i + 2;
          break;
        }
      }
    }

    const rowValues = [studentId, studentName, academicYear, hijriMonth, makan, makan_tanggal, laundry, laundry_tanggal, ziaroh, ziaroh_tanggal, status];

    // Get old data to compare
    var oldMakan = false, oldLaundry = false, oldZiaroh = false;
    if (targetRow !== -1) {
      // This was an update, check old values
      var oldData = sheetBulanan.getRange(targetRow, 1, 1, 11).getValues()[0];
      oldMakan = parseBool(oldData[4]);
      oldLaundry = parseBool(oldData[6]);
      oldZiaroh = parseBool(oldData[8]);
    }

    if (targetRow !== -1) {
      sheetBulanan.getRange(targetRow, 1, 1, 11).setValues([rowValues]);
    } else {
      targetRow = lastRow + 1;
      sheetBulanan.getRange(targetRow, 1, 1, 11).setValues([rowValues]);
    }

    // Bersihkan jika ada entri salah tempat di sheet lain
    cleanupMisplacedBulananRows(ssBulanan);

    // Auto-record pemasukan bulanan ke KeuanganTrx
    try {
      var BULANAN_NOMINALS = { makan: 275000, laundry: 120000, ziaroh: 25000 };
      var BULANAN_LABELS = { makan: 'Makan (1 Bln)', laundry: 'Laundry (2 Bln)', ziaroh: 'Tabungan Ziaroh' };
      var bulananItems = [{key:'makan', newVal: makan, oldVal: oldMakan}, {key:'laundry', newVal: laundry, oldVal: oldLaundry}, {key:'ziaroh', newVal: ziaroh, oldVal: oldZiaroh}];
      bulananItems.forEach(function(bi) {
        if (bi.newVal && !bi.oldVal) {
          autoRecordKeuangan(
            'pemasukan',
            'pembayaran_bulanan',
            'Pembayaran ' + BULANAN_LABELS[bi.key] + ' (' + hijriMonth + ') - ' + studentName,
            BULANAN_NOMINALS[bi.key],
            hijriMonth,
            academicYear,
            studentId
          );
        }
      });
    } catch (autoErr) {
      Logger.log('Auto-record bulanan keuangan error: ' + autoErr.toString());
    }

    return {
      success: true,
      message: 'Pembayaran bulanan berhasil disimpan ke sheet ' + sheetBulanan.getName() + '.',
      data: {
        sheetName: sheetBulanan.getName(),
        rowIndex: targetRow,
        studentId: studentId,
        studentName: studentName,
        academicYear: academicYear,
        hijriMonth: hijriMonth,
        makan: makan,
        makan_tanggal: makan_tanggal,
        laundry: laundry,
        laundry_tanggal: laundry_tanggal,
        ziaroh: ziaroh,
        ziaroh_tanggal: ziaroh_tanggal,
        status: status
      }
    };
  } catch (e) {
    return { success: false, message: 'Gagal menyimpan bulanan: ' + e.toString() };
  }
}

/**
 * Menghapus satu entri Bulanan berdasarkan rowIndex dan hijriMonth (opsional).
 */
function deleteBulananEntry(sessionToken, rowIndex, hijriMonth) {
  const authenticated = requireAuthenticatedUser_(sessionToken);
  if (!authenticated.authorized) return authenticated.response;
  const permitted = requirePermission_(authenticated, 'payments.monthly.delete');
  if (!permitted.authorized) return permitted.response;

  try {
    if (!rowIndex) throw new Error('RowIndex wajib diisi.');
    const ssBulanan = SpreadsheetApp.openById(SPREADSHEET_ID_BULANAN);
    const sheetBulanan = getOrCreateSheetBulanan(ssBulanan, hijriMonth);
    sheetBulanan.deleteRow(Number(rowIndex));
    return { success: true, message: 'Entri bulanan berhasil dihapus.' };
  } catch (e) {
    return { success: false, message: 'Gagal menghapus bulanan: ' + e.toString() };
  }
}

function cleanText(value) {
  return String(value || '').trim();
}

function cleanDigits(value) {
  return cleanText(value).replace(/\D/g, '');
}

function parseBool(value) {
  return value === true || String(value).toLowerCase() === 'true';
}

function formatPaymentDate(value) {
  if (!value) return '';

  try {
    return Utilities.formatDate(new Date(value), 'GMT+7', 'yyyy/MM/dd');
  } catch (e) {
    return value;
  }
}

function buildEmptyPaymentValues() {
  const values = [];
  // Tahunan: 6 items (12 cols)
  for (let i = 0; i < 6; i++) {
    values.push(false, '');
  }
  // Status
  values.push('Belum Lunas');
  return values;
}

function syncKeuanganWithSantri(sheetSantri, sheetKeuangan) {
  const santriData = sheetSantri.getDataRange().getValues();
  if (santriData.length < 2) return;

  const keuanganData = sheetKeuangan.getDataRange().getValues();
  const keuanganRowById = {};
  const width = KEUANGAN_HEADERS.length;

  for (let i = 1; i < keuanganData.length; i++) {
    const id = cleanText(keuanganData[i][0]);
    if (id) keuanganRowById[id] = i + 1;
  }

  const nameUpdates = [];
  const missingRows = [];

  for (let i = 1; i < santriData.length; i++) {
    const idSantri = cleanText(santriData[i][0]);
    const namaSantri = cleanText(santriData[i][3]);
    if (!idSantri) continue;

    const rowKeuangan = keuanganRowById[idSantri];
    if (rowKeuangan) {
      const dataIndex = rowKeuangan - 1;
      if (cleanText(keuanganData[dataIndex][1]) !== namaSantri) {
        keuanganData[dataIndex][1] = namaSantri;
        nameUpdates.push([namaSantri, rowKeuangan]);
      }
    } else {
      missingRows.push([idSantri, namaSantri].concat(buildEmptyPaymentValues()));
    }
  }

  if (nameUpdates.length) {
    const firstDataRow = 2;
    const rowCount = keuanganData.length - 1;
    if (rowCount > 0) {
      const names = keuanganData.slice(1).map(row => [row[1] || '']);
      sheetKeuangan.getRange(firstDataRow, 2, rowCount, 1).setValues(names);
    }
  }

  if (missingRows.length) {
    const startRow = sheetKeuangan.getLastRow() + 1;
    sheetKeuangan.getRange(startRow, 1, missingRows.length, width).setValues(missingRows);
  }
}

function syncBulananWithSantri(sheetSantri) {
  const ssBulanan = SpreadsheetApp.openById(SPREADSHEET_ID_BULANAN);
  const santriData = sheetSantri.getDataRange().getValues();
  if (santriData.length < 2) return;

  const width = 11;
  const currentYear = new Date().getFullYear().toString();

  ISLAMIC_MONTHS.forEach(month => {
    const sheetBulanan = getOrCreateSheetBulanan(ssBulanan, month);
    const bulananData = sheetBulanan.getDataRange().getValues();

    const bulananRowById = {};
    for (let i = 1; i < bulananData.length; i++) {
      const id = cleanText(bulananData[i][0]);
      if (id) {
        if (!bulananRowById[id]) bulananRowById[id] = [];
        bulananRowById[id].push(i + 1);
      }
    }

    const nameUpdates = [];
    const missingRows = [];

    for (let i = 1; i < santriData.length; i++) {
      const idSantri = cleanText(santriData[i][0]);
      const namaSantri = cleanText(santriData[i][3]);
      if (!idSantri) continue;

      const rowsBulanan = bulananRowById[idSantri];
      if (rowsBulanan && rowsBulanan.length > 0) {
        rowsBulanan.forEach(rowNum => {
          const dataIndex = rowNum - 1;
          if (cleanText(bulananData[dataIndex][1]) !== namaSantri) {
            bulananData[dataIndex][1] = namaSantri;
            nameUpdates.push(true);
          }
        });
      } else {
        missingRows.push([idSantri, namaSantri, currentYear, month, false, '', false, '', false, '', 'Belum Lunas']);
      }
    }

    if (nameUpdates.length > 0) {
      const firstDataRow = 2;
      const rowCount = bulananData.length - 1;
      if (rowCount > 0) {
        const names = bulananData.slice(1).map(row => [row[1] || '']);
        sheetBulanan.getRange(firstDataRow, 2, rowCount, 1).setValues(names);
      }
    }

    if (missingRows.length > 0) {
      const startRow = sheetBulanan.getLastRow() + 1;
      sheetBulanan.getRange(startRow, 1, missingRows.length, width).setValues(missingRows);
    }
  });
}

function buildSantriRecord(row, rowIndex, paymentMap) {
  let tglLahir = "";
  if (row[6]) {
    try { tglLahir = Utilities.formatDate(new Date(row[6]), "GMT+7", "yyyy-MM-dd"); }
    catch(e) { tglLahir = row[6]; }
  }

  let tglDaftar = "";
  if (row[1]) {
    try { tglDaftar = Utilities.formatDate(new Date(row[1]), "GMT+7", "dd/MM/yyyy"); }
    catch(e) { tglDaftar = row[1]; }
  }

  const idSantri = row[0];
  const payments = paymentMap[idSantri] || {};

  return {
    rowIndex: rowIndex,
    id: idSantri,
    tanggal: tglDaftar,
    nik: String(row[2]).replace(/^'/, ''),
    namaLengkap: row[3],
    jenisKelamin: row[4],
    tempatLahir: row[5],
    tanggalLahir: tglLahir,
    alamat: row[7],
    pendidikan: row[8],
    namaWali: row[9],
    noHp: String(row[10]).replace(/^'/, ''),
    status: row[11],
    namaAyah: row[12],
    namaIbu: row[13],
    pekerjaanOrtu: row[14],
    pembayaran: {
      administrasi: payments.administrasi || false,
      administrasi_tanggal: payments.administrasi_tanggal || '',
      pengembangan: payments.pengembangan || false,
      pengembangan_tanggal: payments.pengembangan_tanggal || '',
      makan: payments.makan || false,
      makan_tanggal: payments.makan_tanggal || '',
      peralatan: payments.peralatan || false,
      peralatan_tanggal: payments.peralatan_tanggal || '',
      kitab: payments.kitab || false,
      kitab_tanggal: payments.kitab_tanggal || '',
      perlengkapan: payments.perlengkapan || false,
      perlengkapan_tanggal: payments.perlengkapan_tanggal || '',
      laundry: payments.laundry || false,
      laundry_tanggal: payments.laundry_tanggal || '',
      ziaroh: payments.ziaroh || false,
      ziaroh_tanggal: payments.ziaroh_tanggal || '',
      jas: payments.jas || false,
      jas_tanggal: payments.jas_tanggal || ''
    }
  };
}

function validateSantriForm(formData) {
  if (!formData) throw new Error('Data formulir kosong.');

  const cleaned = {
    nik: cleanDigits(formData.nik),
    namaLengkap: cleanText(formData.namaLengkap),
    jenisKelamin: cleanText(formData.jenisKelamin) || 'Laki-laki',
    tempatLahir: cleanText(formData.tempatLahir),
    tanggalLahir: cleanText(formData.tanggalLahir),
    alamat: cleanText(formData.alamat),
    pendidikan: cleanText(formData.pendidikan) || 'SD/MI',
    namaWali: cleanText(formData.namaWali),
    noHp: cleanDigits(formData.noHp),
    status: cleanText(formData.status) || DEFAULT_STATUS,
    namaAyah: cleanText(formData.namaAyah),
    namaIbu: cleanText(formData.namaIbu),
    pekerjaanOrtu: cleanText(formData.pekerjaanOrtu)
  };

  if (!cleaned.namaLengkap) throw new Error('Nama lengkap wajib diisi.');
  if (!/^\d{16}$/.test(cleaned.nik)) throw new Error('NIK wajib 16 digit angka.');
  if (!/^08\d{8,13}$/.test(cleaned.noHp)) throw new Error('Nomor HP/WA wajib diawali 08 dan berisi 10-15 digit.');

  return cleaned;
}

function generateUniqueRegistrationId(sheetSantri) {
  const year = new Date().getFullYear();
  const existingIds = new Set();

  if (sheetSantri.getLastRow() > 1) {
    const ids = sheetSantri.getRange(2, 1, sheetSantri.getLastRow() - 1, 1).getValues();
    ids.forEach(row => {
      if (row[0]) existingIds.add(String(row[0]));
    });
  }

  for (let attempt = 0; attempt < 25; attempt++) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const candidate = 'NJ-' + year + '-' + randomNum;
    if (!existingIds.has(candidate)) return candidate;
  }

  throw new Error('Gagal membuat ID pendaftaran unik. Silakan coba lagi.');
}

function importCsvData(sessionToken, payload) {
  const authenticated = requireAuthenticatedUser_(sessionToken);
  if (!authenticated.authorized) return authenticated.response;

  payload = payload || {};
  const target = String(payload.target || '').trim().toLowerCase();
  const permission = target === 'santri' ? 'students.create' : 'payments.update';
  const permitted = requirePermission_(authenticated, permission);
  if (!permitted.authorized) return permitted.response;

  const configs = {
    santri: { headers: SANTRI_HEADERS, width: SANTRI_HEADERS.length },
    tahunan: { headers: KEUANGAN_HEADERS, width: KEUANGAN_HEADERS.length },
    bulanan: { headers: ['Student ID','Student Name','Academic Year','Hijri Month','Makan (1 Bln)','Tanggal Makan (1 Bln)','Laundry (2 Bln)','Tanggal Laundry (2 Bln)','Tabungan Ziaroh','Tanggal Tabungan Ziaroh','Status'], width: 11 }
  };
  const config = configs[target];
  if (!config) return { success: false, message: 'Target impor tidak valid.' };
  if (!Array.isArray(payload.headers) || payload.headers.length !== config.width ||
      payload.headers.some((header, index) => cleanText(header).toLowerCase() !== config.headers[index].toLowerCase())) {
    return { success: false, message: 'Header CSV tidak sesuai dengan target yang dipilih.' };
  }
  if (!Array.isArray(payload.rows) || !payload.rows.length) return { success: false, message: 'File tidak memiliki data.' };
  if (payload.rows.length > 1000) return { success: false, message: 'Maksimal 1000 baris per impor.' };
  if (target === 'santri' && payload.replaceAll === true && cleanText(payload.replaceConfirmation).toUpperCase() !== 'GANTI') return { success: false, message: 'Konfirmasi ganti semua tidak valid.' };

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(60000);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const ssBulanan = SpreadsheetApp.openById(SPREADSHEET_ID_BULANAN);
    const result = { success: true, total: payload.rows.length, imported: 0, skipped: 0, errors: [], message: '' };

    if (target === 'santri' && payload.replaceAll === true) {
      const replacementRows = [];
      const replacementIds = {};
      const validationErrors = [];
      payload.rows.forEach((sourceRow, index) => {
        const rowNumber = index + 2;
        const row = Array.isArray(sourceRow) ? sourceRow.slice(0, config.width) : [];
        while (row.length < config.width) row.push('');
        const id = cleanText(row[0]);
        const name = cleanText(row[3]);
        const nik = cleanText(row[2]).replace(/^'/, '');
        const noHp = cleanText(row[10]).replace(/^'/, '');
        if (!row.some(value => cleanText(value))) { validationErrors.push('Baris ' + rowNumber + ': kosong.'); return; }
        if (!id || !name) { validationErrors.push('Baris ' + rowNumber + ': ID dan nama wajib diisi.'); return; }
        if (nik && !/^\d{16}$/.test(nik)) { validationErrors.push('Baris ' + rowNumber + ': NIK harus 16 digit.'); return; }
        if (noHp && !/^08\d+$/.test(noHp)) { validationErrors.push('Baris ' + rowNumber + ': nomor HP harus diawali 08.'); return; }
        if (replacementIds[id]) { validationErrors.push('Baris ' + rowNumber + ': ID duplikat.'); return; }
        replacementIds[id] = true;
        replacementRows.push(row);
      });
      if (validationErrors.length) return { success: false, message: 'Ganti semua dibatalkan. ' + validationErrors.slice(0, 5).join(' ') };

      const clearDataRows = targetSheet => {
        if (targetSheet && targetSheet.getLastRow() > 1) targetSheet.deleteRows(2, targetSheet.getLastRow() - 1);
      };
      const sheetSantri = getSheetSantri(ss);
      const sheetKeuangan = getSheetKeuangan(ss);
      const sheetFoto = getSantriPhotoSheet_(ss);
      clearDataRows(sheetSantri);
      clearDataRows(sheetKeuangan);
      clearDataRows(sheetFoto);
      if (replacementRows.length) sheetSantri.getRange(2, 1, replacementRows.length, config.width).setValues(replacementRows);

      if (sheetKeuangan && replacementRows.length) {
        const annualRows = replacementRows.map(row => [row[0], row[3]].concat(buildEmptyPaymentValues()));
        sheetKeuangan.getRange(2, 1, annualRows.length, annualRows[0].length).setValues(annualRows);
      }

      ISLAMIC_MONTHS.forEach(month => {
        const monthlySheet = getOrCreateSheetBulanan(ssBulanan, month);
        clearDataRows(monthlySheet);
        if (replacementRows.length) {
          const currentYear = new Date().getFullYear().toString();
          const monthlyRows = replacementRows.map(row => [row[0], row[3], currentYear, month, false, '', false, '', false, '', 'Belum Lunas']);
          monthlySheet.getRange(2, 1, monthlyRows.length, monthlyRows[0].length).setValues(monthlyRows);
        }
      });

      invalidateSantriCache();
      result.imported = replacementRows.length;
      result.message = replacementRows.length + ' data santri berhasil menggantikan seluruh data lama. Tagihan tahunan dan bulanan telah direset.';
      return result;
    }

    const seen = {};

    let sheet = null;
    if (target === 'santri') sheet = getSheetSantri(ss);
    if (target === 'tahunan') sheet = getSheetKeuangan(ss);
    const existing = {};
    if (sheet && sheet.getLastRow() >= 2) sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().forEach(row => { const id = cleanText(row[0]); if (id) existing[id] = true; });

    payload.rows.forEach((sourceRow, index) => {
      const rowNumber = index + 2;
      const row = Array.isArray(sourceRow) ? sourceRow.slice(0, config.width) : [];
      while (row.length < config.width) row.push('');
      if (!row.some(value => cleanText(value))) { result.skipped++; result.errors.push('Baris ' + rowNumber + ': kosong.'); return; }
      const id = cleanText(row[0]);
      const name = cleanText(row[1] || (target === 'santri' ? row[3] : ''));
      if (!id || !name) { result.skipped++; result.errors.push('Baris ' + rowNumber + ': ID dan nama wajib diisi.'); return; }
      const duplicateKey = target === 'bulanan' ? id + '|' + cleanText(row[2]) + '|' + cleanText(row[3]) : id;
      if (seen[duplicateKey] || (target !== 'bulanan' && existing[id])) { result.skipped++; result.errors.push('Baris ' + rowNumber + ': ID sudah ada/duplikat.'); return; }
      seen[duplicateKey] = true;

      if (target === 'bulanan') {
        const month = cleanText(row[3]) || 'Muharram';
        getOrCreateSheetBulanan(ssBulanan, month).appendRow(row);
      } else {
        sheet.appendRow(row);
      }
      result.imported++;
    });

    invalidateSantriCache();
    result.message = result.imported + ' baris berhasil diimpor, ' + result.skipped + ' baris dilewati.';
    if (result.errors.length) result.message += ' Periksa baris: ' + result.errors.slice(0, 5).join(' ');
    return result;
  } catch (error) {
    return { success: false, message: 'Gagal mengimpor data: ' + error.toString() };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function processForm(sessionToken, formData) {
  const authenticated = requireAuthenticatedUser_(sessionToken);
  if (!authenticated.authorized) return authenticated.response;
  const permitted = requirePermission_(authenticated, 'students.create');
  if (!permitted.authorized) return permitted.response;

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheetSantri = getSheetSantri(ss); 
    const sheetKeuangan = getSheetKeuangan(ss);
    const cleaned = validateSantriForm(formData);
    
    const generatedId = generateUniqueRegistrationId(sheetSantri);
    
    // 1. Simpan Biodata ke tab DataSantri
    const rowDataSantri = [
      generatedId,             
      new Date(),              
      "'" + cleaned.nik,      
      cleaned.namaLengkap,    
      cleaned.jenisKelamin,   
      cleaned.tempatLahir,    
      cleaned.tanggalLahir,   
      cleaned.alamat,         
      cleaned.pendidikan,     
      cleaned.namaWali,       
      "'" + cleaned.noHp,     
      DEFAULT_STATUS,   
      cleaned.namaAyah,       
      cleaned.namaIbu,        
      cleaned.pekerjaanOrtu   
    ];
    sheetSantri.appendRow(rowDataSantri);
    
    // 2. Buat Row Default di tab Tahunan (Sekarang menyertakan Nama)
    if (sheetKeuangan) {
      const rowDataKeuangan = [
        generatedId, 
        cleaned.namaLengkap // Kolom B: Nama Santri dimasukkan ke sini
      ].concat(buildEmptyPaymentValues());
      sheetKeuangan.appendRow(rowDataKeuangan);
    }

    // 3. Buat Row Default di tab Bulanan masing-masing (12 bulan)
    try {
      const ssBulanan = SpreadsheetApp.openById(SPREADSHEET_ID_BULANAN);
      const currentYear = new Date().getFullYear().toString();
      ISLAMIC_MONTHS.forEach(month => {
        const sheetBul = getOrCreateSheetBulanan(ssBulanan, month);
        if (sheetBul) {
          sheetBul.appendRow([
            generatedId,
            cleaned.namaLengkap,
            currentYear,
            month,
            false, '', false, '', false, '', 'Belum Lunas'
          ]);
        }
      });
    } catch (eBul) {}

    invalidateSantriCache();
    const newRowIndex = sheetSantri.getLastRow();
    const newRecord = buildSantriRecord(rowDataSantri, newRowIndex, {});
    return { success: true, message: 'Berhasil! ID: ' + generatedId, data: newRecord };
  } catch (error) {
    return { success: false, message: 'Error: ' + error.toString() };
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {}
  }
}

function getSantriPhotoSheet_(ss) {
  let sheet = ss.getSheetByName('FotoSantri');
  if (!sheet) sheet = ss.insertSheet('FotoSantri');
  ensureHeaderRow(sheet, ['ID Pendaftaran', 'Foto', 'Diperbarui']);
  return sheet;
}

function getSantriPhotoMap_(ss) {
  const sheet = ss.getSheetByName('FotoSantri');
  const photos = {};
  if (!sheet || sheet.getLastRow() < 2) return photos;
  sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues().forEach(row => {
    const id = cleanText(row[0]);
    if (id && row[1]) photos[id] = String(row[1]);
  });
  return photos;
}

function saveSantriPhoto(sessionToken, santriId, dataUrl) {
  const authenticated = requireAuthenticatedUser_(sessionToken);
  if (!authenticated.authorized) return authenticated.response;
  const permitted = requirePermission_(authenticated, 'students.update');
  if (!permitted.authorized) return permitted.response;

  try {
    const id = cleanText(santriId);
    const photo = String(dataUrl || '');
    if (!id) return { success: false, message: 'ID santri tidak valid.' };
    if (!/^data:image\/(jpeg|png|webp);base64,/.test(photo)) return { success: false, message: 'Format foto tidak valid.' };
    if (photo.length > 48000) return { success: false, message: 'Ukuran foto terlalu besar.' };

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const santriSheet = getSheetSantri(ss);
    const santriIds = santriSheet.getLastRow() >= 2 ? santriSheet.getRange(2, 1, santriSheet.getLastRow() - 1, 1).getValues().flat().map(value => cleanText(value)) : [];
    if (santriIds.indexOf(id) === -1) return { success: false, message: 'Santri tidak ditemukan.' };
    const sheet = getSheetFotoSantri_(ss);
    const values = sheet.getLastRow() >= 2 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues() : [];
    for (let i = 0; i < values.length; i++) {
      if (cleanText(values[i][0]) === id) {
        sheet.getRange(i + 2, 2, 1, 2).setValues([[photo, new Date()]]);
        invalidateSantriCache();
        return { success: true, message: 'Foto berhasil diperbarui.' };
      }
    }
    sheet.appendRow([id, photo, new Date()]);
    invalidateSantriCache();
    return { success: true, message: 'Foto berhasil disimpan.' };
  } catch (e) {
    return { success: false, message: 'Gagal menyimpan foto: ' + e.toString() };
  }
}

function deleteSantriPhoto_(ss, santriId) {
  const sheet = ss.getSheetByName('FotoSantri');
  if (!sheet || sheet.getLastRow() < 2) return;
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  for (let i = values.length - 1; i >= 0; i--) {
    if (cleanText(values[i][0]) === cleanText(santriId)) sheet.deleteRow(i + 2);
  }
}

/**
 * Fungsi untuk mengambil data gabungan Santri & Keuangan
 */
function getSantriData(sessionToken) {
  const authenticated = requireAuthenticatedUser_(sessionToken);
  if (!authenticated.authorized) return authenticated.response;
  const permitted = requirePermission_(authenticated, 'students.view');
  if (!permitted.authorized) return permitted.response;

  try {
    const cached = getCachedSantriData();
    if (cached && (!cached.length || Object.prototype.hasOwnProperty.call(cached[0], 'photoUrl'))) return cached;

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheetSantri = getSheetSantri(ss);
    const sheetKeuangan = getSheetKeuangan(ss);
    syncKeuanganWithSantri(sheetSantri, sheetKeuangan);
    
    const dataSantri = sheetSantri.getDataRange().getValues();
    const dataKeuangan = sheetKeuangan ? sheetKeuangan.getDataRange().getValues() : [];
    const photoMap = getSantriPhotoMap_(ss);
    
    // Buat Kamus/Map Pembayaran berdasarkan ID Pendaftaran
    const paymentMap = {};
    for(let i = 1; i < dataKeuangan.length; i++) { // Mulai dari 1 untuk lewati header
       const id = dataKeuangan[i][0]; // ID pendaftaran (Kolom A / index 0)
       // Index digeser karena Index 1 sekarang adalah Nama Santri
       paymentMap[id] = {};

       // Tahunan: index 0 to 5
       for(let idx = 0; idx < 6; idx++) {
         const key = PAYMENT_KEYS[idx];
         const boolIndex = 2 + (idx * 2);
         const dateIndex = 3 + (idx * 2);
         paymentMap[id][key] = parseBool(dataKeuangan[i][boolIndex]);
         paymentMap[id][key + '_tanggal'] = formatPaymentDate(dataKeuangan[i][dateIndex]);
       }
     }    
    const rows = dataSantri.slice(1); // Hapus header
    
    const result = rows.map((row, i) => ({ ...buildSantriRecord(row, i + 2, paymentMap), photoUrl: photoMap[cleanText(row[0])] || '' }));
    setCachedSantriData(result);
    return result;
        } catch (e) {
    return [];
  }
}

/**
 * Fungsi untuk menghapus data berdasarkan rowIndex
 */
function deleteSantri(sessionToken, rowIndex) {
  const authenticated = requireAuthenticatedUser_(sessionToken);
  if (!authenticated.authorized) return authenticated.response;
  const permitted = requirePermission_(authenticated, 'students.delete');
  if (!permitted.authorized) return permitted.response;

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheetSantri = getSheetSantri(ss);
    
    // 1. Ambil ID Santri dari tab Santri
    const idSantri = sheetSantri.getRange(rowIndex, 1).getValue();
    deleteSantriPhoto_(ss, idSantri);
    
    // 2. Cari dan Hapus di tab Keuangan (Tahunan)
    const sheetKeuangan = getSheetKeuangan(ss);
    if (sheetKeuangan) {
       const dataKeu = sheetKeuangan.getDataRange().getValues();
       for(let i=0; i<dataKeu.length; i++) {
          if(dataKeu[i][0] === idSantri) {
             sheetKeuangan.deleteRow(i + 1);
             break;
          }
       }
    }
    
    // 3. Hapus seluruh baris di tab Bulanan dari Spreadsheet Bulanan Khusus
    try {
      const ssBulanan = SpreadsheetApp.openById(SPREADSHEET_ID_BULANAN);
      const sheetsBulanan = ssBulanan.getSheets();
      sheetsBulanan.forEach(sheetBul => {
        const dataBul = sheetBul.getDataRange().getValues();
        for (let i = dataBul.length - 1; i >= 0; i--) {
          if (String(dataBul[i][0] || '').trim() === idSantri) {
            sheetBul.deleteRow(i + 1);
          }
        }
      });
    } catch (e) {}
    
    // 4. Hapus di tab Santri
    sheetSantri.deleteRow(rowIndex);

    invalidateSantriCache();
    return { success: true, message: 'Data santri beserta catatan keuangannya berhasil dihapus!' };
  } catch(e) {
    return { success: false, message: 'Gagal menghapus: ' + e.toString() };
  }
}

/**
 * Fungsi untuk memperbarui biodata santri
 */
function updateSantri(sessionToken, rowIndex, formData) {
  const authenticated = requireAuthenticatedUser_(sessionToken);
  if (!authenticated.authorized) return authenticated.response;
  const permitted = requirePermission_(authenticated, 'students.update');
  if (!permitted.authorized) return permitted.response;

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheetSantri = getSheetSantri(ss);
    const cleaned = validateSantriForm(formData);
    
    sheetSantri.getRange(rowIndex, 3, 1, 13).setValues([[
      "'" + cleaned.nik,
      cleaned.namaLengkap,
      cleaned.jenisKelamin,
      cleaned.tempatLahir,
      cleaned.tanggalLahir,
      cleaned.alamat,
      cleaned.pendidikan,
      cleaned.namaWali,
      "'" + cleaned.noHp,
      cleaned.status,
      cleaned.namaAyah,
      cleaned.namaIbu,
      cleaned.pekerjaanOrtu
    ]]);

    // Otomatis sinkronisasi perubahan nama di tab Keuangan jika diubah
    const existingRow = sheetSantri.getRange(rowIndex, 1, 1, 15).getValues()[0];
    const idSantri = existingRow[0];
    const sheetKeuangan = getSheetKeuangan(ss);
    if (sheetKeuangan) {
       const dataKeu = sheetKeuangan.getDataRange().getValues();
       for(let i=0; i<dataKeu.length; i++) {
          if(dataKeu[i][0] === idSantri) {
             sheetKeuangan.getRange(i + 1, 2).setValue(cleaned.namaLengkap); // Update Kolom B
             break;
          }
       }
    }

    // Otomatis sinkronisasi perubahan nama di tab Bulanan pada Spreadsheet Bulanan Khusus
    try {
      const ssBulanan = SpreadsheetApp.openById(SPREADSHEET_ID_BULANAN);
      const sheetsBulanan = ssBulanan.getSheets();
      sheetsBulanan.forEach(sheetBul => {
        const dataBul = sheetBul.getDataRange().getValues();
        for (let i = 0; i < dataBul.length; i++) {
          if (String(dataBul[i][0] || '').trim() === idSantri) {
            sheetBul.getRange(i + 1, 2).setValue(cleaned.namaLengkap); // Update Kolom B
          }
        }
      });
    } catch (e) {}

    invalidateSantriCache();
    const updatedRow = [
      idSantri,
      existingRow[1],
      "'" + cleaned.nik,
      cleaned.namaLengkap,
      cleaned.jenisKelamin,
      cleaned.tempatLahir,
      cleaned.tanggalLahir,
      cleaned.alamat,
      cleaned.pendidikan,
      cleaned.namaWali,
      "'" + cleaned.noHp,
      cleaned.status,
      cleaned.namaAyah,
      cleaned.namaIbu,
      cleaned.pekerjaanOrtu
    ];
    return { success: true, message: 'Data biodata santri berhasil diperbarui!', data: buildSantriRecord(updatedRow, Number(rowIndex), {}) };
  } catch(e) {
    return { success: false, message: 'Gagal update: ' + e.toString() };
  }
}

/**
 * Fungsi KHUSUS untuk Checkbox Pembayaran -> Disimpan ke tab "Tahunan"
 */
function updatePembayaran(sessionToken, rowIndex, paymentData) {
  const authenticated = requireAuthenticatedUser_(sessionToken);
  if (!authenticated.authorized) return authenticated.response;
  const permitted = requirePermission_(authenticated, 'payments.update');
  if (!permitted.authorized) return permitted.response;

  try {
    paymentData = paymentData || {};

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheetSantri = getSheetSantri(ss);
    const sheetKeuangan = getSheetKeuangan(ss);
    
    if (!sheetKeuangan) throw new Error("Sheet 'Tahunan' belum dibuat.");

    // Ambil ID dan nama santri dalam satu panggilan agar lebih ringan di Apps Script.
    const santriRow = sheetSantri.getRange(rowIndex, 1, 1, 4).getValues()[0];
    const idSantri = santriRow[0];
    const namaSantri = santriRow[3];
    
    // Cari baris di tab Keuangan berdasarkan ID tersebut
    const dataKeu = sheetKeuangan.getDataRange().getValues();
    let targetRowKeu = -1;
    for(let i=0; i<dataKeu.length; i++) {
       if(dataKeu[i][0] === idSantri) {
          targetRowKeu = i + 1; // Index baris Google Sheet
          break;
       }
    }
    
    const today = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy/MM/dd');
    const combinedValues = [];
    let tahunanLunas = true;

    // Tahunan keys: idx 0 to 5
    for(let i=0; i<6; i++) {
       const key = PAYMENT_KEYS[i];
       const isPaid = parseBool(paymentData[key]);
       if (!isPaid) tahunanLunas = false;
       
       let existingDate = '';
       if (targetRowKeu !== -1) {
          const currentRow = dataKeu[targetRowKeu - 1];
          existingDate = currentRow[2 + (i * 2)];
       }

       let finalDate = '';
       if (isPaid) {
          finalDate = paymentData[key + '_tanggal'] || (existingDate ? formatPaymentDate(existingDate) : today);
       }
       
       combinedValues.push(isPaid, finalDate);
    }
    combinedValues.push(tahunanLunas ? 'Lunas' : 'Belum Lunas');

    if (targetRowKeu !== -1) {
       // Update baris keuangan (Mulai dari kolom C / index 3, total 13 kolom: 12 item + 1 status)
       sheetKeuangan.getRange(targetRowKeu, 3, 1, 13).setValues([combinedValues]);
    } else {
       // Jika belum ada, buat baru dan cantumkan Nama
       sheetKeuangan.appendRow([idSantri, namaSantri].concat(combinedValues));
    }

    invalidateSantriCache();

    // Auto-record pemasukan ke sheet KeuanganTrx
    try {
      // Calculate items yang baru dibayar (compare old vs new)
      var PAYMENT_NOMINALS = [350000, 150000, 10000, 60000, 30000, 200000];
      var PAYMENT_LABELS = ['Administrasi', 'Pengembangan P.', 'Peralatan Makan', 'Kitab', 'Perlengkapan', 'Jas Almamater'];
      for (var pi = 0; pi < 6; pi++) {
        var key = PAYMENT_KEYS[pi];
        var isPaid = parseBool(paymentData[key]);
        // Check if this was previously NOT paid (use old data from dataKeu)
        var wasPaid = false;
        if (targetRowKeu !== -1) {
          wasPaid = parseBool(dataKeu[targetRowKeu - 1][2 + (pi * 2)]);
        }
        if (isPaid && !wasPaid) {
          autoRecordKeuangan(
            'pemasukan',
            'pembayaran_tahunan',
            'Pembayaran ' + PAYMENT_LABELS[pi] + ' - ' + namaSantri,
            PAYMENT_NOMINALS[pi],
            '',
            '',
            idSantri
          );
        }
      }
    } catch (autoErr) {
      Logger.log('Auto-record keuangan error: ' + autoErr.toString());
    }

    return { success: true, pembayaran: paymentData };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

function getOrCreateSheetKeuanganTrx(ss) {
  const sheetName = 'KeuanganTrx';
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  ensureHeaderRow(sheet, KEUANGAN_TRX_HEADERS);
  return sheet;
}

function getKeuanganData(sessionToken, filters) {
  const authenticated = requireAuthenticatedUser_(sessionToken);
  if (!authenticated.authorized) return authenticated.response;
  const permitted = requirePermission_(authenticated, 'finance.view');
  if (!permitted.authorized) return permitted.response;

  try {
    filters = filters || {};
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = getOrCreateSheetKeuanganTrx(ss);
    
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];
    
    const data = sheet.getRange(2, 1, lastRow - 1, KEUANGAN_TRX_HEADERS.length).getValues();
    const result = [];
    
    data.forEach((row, idx) => {
      const item = {
        rowIndex: idx + 2,
        id: String(row[0] || '').trim(),
        tanggal: row[1] ? formatPaymentDate(row[1]) : '',
        tipe: String(row[2] || '').trim(),
        kategori: String(row[3] || '').trim(),
        deskripsi: String(row[4] || '').trim(),
        nominal: Number(row[5]) || 0,
        bulanHijri: String(row[6] || '').trim(),
        tahunAjaran: String(row[7] || '').trim(),
        referensi: String(row[8] || '').trim(),
        dibuatOleh: String(row[9] || '').trim()
      };
      
      if (filters.tahunAjaran && filters.tahunAjaran !== 'Semua' && item.tahunAjaran !== filters.tahunAjaran) return;
      if (filters.tipe && filters.tipe !== 'Semua' && item.tipe !== filters.tipe) return;
      if (filters.kategori && filters.kategori !== 'Semua' && item.kategori !== filters.kategori) return;
      if (filters.bulanHijri && filters.bulanHijri !== 'Semua' && item.bulanHijri !== filters.bulanHijri) return;
      
      result.push(item);
    });
    
    return result;
  } catch (e) {
    return [];
  }
}

function saveKeuanganEntry(sessionToken, payload) {
  const authenticated = requireAuthenticatedUser_(sessionToken);
  if (!authenticated.authorized) return authenticated.response;

  const requestedRow = payload && Number(payload.rowIndex);
  const permission = requestedRow > 1 ? 'finance.update' : 'finance.create';
  const permitted = requirePermission_(authenticated, permission);
  if (!permitted.authorized) return permitted.response;

  try {
    if (!payload) throw new Error('Data keuangan kosong.');
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = getOrCreateSheetKeuanganTrx(ss);
    
    let id = cleanText(payload.id);
    let targetRow = Number(payload.rowIndex) || -1;
    
    if (targetRow <= 1) {
      targetRow = -1;
      const randomChars = Math.random().toString(36).substring(2, 10).toUpperCase();
      id = 'TRX-' + randomChars;
    }
    
    const tanggal = payload.tanggal ? new Date(payload.tanggal) : new Date();
    
    const rowValues = [
      id,
      tanggal,
      cleanText(payload.tipe),
      cleanText(payload.kategori),
      cleanText(payload.deskripsi),
      Number(payload.nominal) || 0,
      cleanText(payload.bulanHijri),
      cleanText(payload.tahunAjaran),
      cleanText(payload.referensi),
      authenticated.user.name || authenticated.user.username
    ];
    
    if (targetRow !== -1) {
      sheet.getRange(targetRow, 1, 1, KEUANGAN_TRX_HEADERS.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
      targetRow = sheet.getLastRow();
    }
    
    return {
      success: true,
      message: 'Transaksi keuangan berhasil disimpan.',
      data: {
        rowIndex: targetRow,
        id: id,
        tanggal: formatPaymentDate(tanggal),
        tipe: rowValues[2],
        kategori: rowValues[3],
        deskripsi: rowValues[4],
        nominal: rowValues[5],
        bulanHijri: rowValues[6],
        tahunAjaran: rowValues[7],
        referensi: rowValues[8],
        dibuatOleh: rowValues[9]
      }
    };
  } catch (e) {
    return { success: false, message: 'Gagal menyimpan transaksi: ' + e.toString() };
  }
}

function deleteKeuanganEntry(sessionToken, rowIndex) {
  const authenticated = requireAuthenticatedUser_(sessionToken);
  if (!authenticated.authorized) return authenticated.response;
  const permitted = requirePermission_(authenticated, 'finance.delete');
  if (!permitted.authorized) return permitted.response;

  try {
    if (!rowIndex) throw new Error('RowIndex wajib diisi.');
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = getOrCreateSheetKeuanganTrx(ss);
    sheet.deleteRow(Number(rowIndex));
    return { success: true, message: 'Transaksi berhasil dihapus.' };
  } catch (e) {
    return { success: false, message: 'Gagal menghapus transaksi: ' + e.toString() };
  }
}

function getKeuanganSummary(sessionToken, tahunAjaran) {
  const authenticated = requireAuthenticatedUser_(sessionToken);
  if (!authenticated.authorized) return authenticated.response;
  const permitted = requirePermission_(authenticated, 'finance.summary.view');
  if (!permitted.authorized) return permitted.response;

  try {
    const filters = {};
    if (tahunAjaran) filters.tahunAjaran = tahunAjaran;
    const data = getKeuanganData(sessionToken, filters);
    if (data && data.success === false && data.authorized === false) return data;
    
    let totalPemasukan = 0;
    let totalPengeluaran = 0;
    const perBulanMap = {};
    const perKategoriMap = {};
    
    ISLAMIC_MONTHS.forEach(m => {
      perBulanMap[m] = { pemasukan: 0, pengeluaran: 0 };
    });
    
    data.forEach(item => {
      const nominal = item.nominal || 0;
      if (item.tipe === 'pemasukan') {
        totalPemasukan += nominal;
      } else if (item.tipe === 'pengeluaran') {
        totalPengeluaran += nominal;
      }
      
      const bHijri = item.bulanHijri;
      if (bHijri && perBulanMap[bHijri]) {
        if (item.tipe === 'pemasukan') perBulanMap[bHijri].pemasukan += nominal;
        else if (item.tipe === 'pengeluaran') perBulanMap[bHijri].pengeluaran += nominal;
      }
      
      const kat = item.kategori || 'Lainnya';
      if (!perKategoriMap[kat]) {
        perKategoriMap[kat] = { total: 0, tipe: item.tipe };
      }
      perKategoriMap[kat].total += nominal;
    });
    
    const perBulan = ISLAMIC_MONTHS.map(m => {
      return {
        bulan: m,
        pemasukan: perBulanMap[m].pemasukan,
        pengeluaran: perBulanMap[m].pengeluaran,
        saldo: perBulanMap[m].pemasukan - perBulanMap[m].pengeluaran
      };
    });
    
    const perKategori = Object.keys(perKategoriMap).map(k => {
      return {
        kategori: k,
        total: perKategoriMap[k].total,
        tipe: perKategoriMap[k].tipe
      };
    });
    
    return {
      success: true,
      totalPemasukan: totalPemasukan,
      totalPengeluaran: totalPengeluaran,
      saldo: totalPemasukan - totalPengeluaran,
      perBulan: perBulan,
      perKategori: perKategori
    };
  } catch (e) {
    return { success: false, message: 'Gagal mengambil ringkasan: ' + e.toString() };
  }
}

function autoRecordKeuangan(tipe, kategori, deskripsi, nominal, bulanHijri, tahunAjaran, referensi) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = getOrCreateSheetKeuanganTrx(ss);
    
    const id = 'TRX-AUTO-' + new Date().getTime();
    const today = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy/MM/dd');
    
    const rowValues = [
      id,
      today,
      cleanText(tipe),
      cleanText(kategori),
      cleanText(deskripsi),
      Number(nominal) || 0,
      cleanText(bulanHijri),
      cleanText(tahunAjaran),
      cleanText(referensi),
      'Sistem (Otomatis)'
    ];
    
    sheet.appendRow(rowValues);
  } catch (e) {
    Logger.log('autoRecordKeuangan error: ' + e.toString());
  }
}

/**
 * Fungsi untuk melakukan sinkronisasi data menyeluruh di seluruh sheet (DataSantri, Tahunan, & 12 Sheet Bulanan)
 */
function syncAllData() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(60000);

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const ssBulanan = SpreadsheetApp.openById(SPREADSHEET_ID_BULANAN);

    const sheetSantri = getSheetSantri(ss);
    const sheetKeuangan = getSheetKeuangan(ss);

    // 1. Sinkronisasi DataSantri -> Tahunan
    syncKeuanganWithSantri(sheetSantri, sheetKeuangan);

    // 2. Sinkronisasi DataSantri -> 12 Sheet Bulanan
    syncBulananWithSantri(sheetSantri);

    // 3. Rapikan entri bulanan yang salah tempat
    cleanupMisplacedBulananRows(ssBulanan);

    // 4. Invalidate Cache
    invalidateSantriCache();

    // 5. Ambil data terbaru pasca sinkronisasi
    const updatedSantri = getSantriData();
    const updatedBulanan = getBulananData({});

    return {
      success: true,
      message: 'Sinkronisasi data menyeluruh berhasil! DataSantri, Tahunan, dan 12 Sheet Bulanan disinkronkan.',
      santriData: updatedSantri,
      bulananData: updatedBulanan
    };
  } catch (e) {
    return {
      success: false,
      message: 'Gagal melakukan sinkronisasi menyeluruh: ' + e.toString()
    };
  } finally {
    try { lock.releaseLock(); } catch (le) {}
  }
}
