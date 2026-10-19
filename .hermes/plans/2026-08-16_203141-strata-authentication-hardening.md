# STRATA Authentication Hardening Implementation Plan

> **Status:** Plan only. No production code is changed by this document.

**Goal:** Mengganti autentikasi plaintext STRATA menjadi password hash, opaque server-side session token, expiry, revoke/logout, serta validasi role dan permission di backend tanpa mengganti React, `google.script.run`, Apps Script, Spreadsheet, atau struktur fitur yang sudah ada.

**Architecture:** Frontend tetap menjadi UI React dan memanggil Apps Script melalui `google.script.run`. Apps Script menjadi satu-satunya pihak yang memverifikasi password, menyimpan hash session, menentukan user/role/permission, dan mengakses Spreadsheet bisnis. Browser hanya menyimpan token sesi sementara dan tidak menjadi sumber kebenaran role/permission.

**Tech Stack:** React/Vite, Google Apps Script, Google Spreadsheet, `Utilities.computeDigest`, `Utilities.getUuid`, `LockService`, `sessionStorage` atau memory state.

---

## 0. Batasan dan keputusan desain

- Jangan menggunakan `Session.getActiveUser()` sebagai fondasi; deployment saat ini `Execute as = Me`, `Who has access = Anyone`, owner Gmail biasa.
- `localStorage` tidak lagi menjadi sumber user, role, atau permission.
- Token sesi harus opaque: tidak berisi username, role, permission, atau data bisnis.
- Server menyimpan hash token, bukan token mentah.
- Semua fungsi Apps Script yang membaca data sensitif atau melakukan mutasi wajib memvalidasi token dan permission sebelum bekerja.
- Password lama tidak boleh dikembalikan atau dikirim ke frontend.
- `Login.jsx` fallback credential lokal tidak boleh tersedia pada production build. Mode preview lokal harus memakai mock yang jelas terpisah dan tidak menggunakan credential produksi.
- Perubahan dilakukan bertahap dengan compatibility window terbatas; setelah migrasi selesai, endpoint lama yang tidak menerima token harus ditolak.

## 1. File yang perlu diubah

### Backend

- `code.gs`
  - Hapus/ubah `getOrCreateSheetAccount()` yang saat ini membuat password plaintext dan default credential.
  - Ganti `verifyLogin(username, password)` dengan login yang mengembalikan token sesi opaque dan profil aman.
  - Tambahkan validasi auth di awal fungsi read/mutation.
  - Pastikan fungsi bisnis tidak mempercayai `role`, `dibuatOleh`, atau user identity dari payload.
  - Endpoint yang wajib dilindungi:
    - `getSantriData`
    - `getBulananData`
    - `getKeuanganData`
    - `getKeuanganSummary`
    - `processForm`
    - `deleteSantri`
    - `updateSantri`
    - `updatePembayaran`
    - `saveBulananEntry`
    - `deleteBulananEntry`
    - `saveKeuanganEntry`
    - `deleteKeuanganEntry`
    - `executeImportSheet`
    - `syncAllData`
    - fungsi account/user settings jika endpoint tersebut memang aktif

### Frontend

- `frontend/src/components/Login.jsx`
  - Kirim username/password hanya pada login.
  - Terima token dan user profile dari backend.
  - Simpan token di `sessionStorage` atau memory; jangan simpan password, role, atau permission sebagai authority.
  - Hapus fallback credential produksi.
  - Jangan lagi menulis `ppnj_active_user` dan `ppnj_active_role` sebagai sumber identity.

- `frontend/src/main.jsx`
  - Ganti boolean-only auth flow menjadi status `checking`, `authenticated`, `unauthenticated`, dan `session_expired`.
  - Saat startup, cek token yang ada melalui endpoint validasi session.
  - Saat logout, panggil endpoint revoke sebelum membersihkan client state.
  - Tangani response `AUTH_REQUIRED`/`SESSION_EXPIRED` dari pemanggilan data.

- `frontend/src/App.jsx`
  - Terima `currentUser`/auth context dari `main.jsx`, bukan membaca role dari localStorage.
  - Sertakan token melalui helper pemanggilan Apps Script.
  - Bersihkan seluruh state data sensitif ketika logout atau session expired.
  - Hentikan pengiriman `dibuatOleh` sebagai identity terpercaya; backend yang mengisinya.

- Semua komponen/helper yang memanggil `google.script.run`
  - Migrasikan pemanggilan agar mengirim session token pada argumen/payload yang disepakati.
  - Gunakan satu helper agar tidak ada pemanggilan yang lupa token.

- `frontend/src/components/Header.jsx`, `Sidebar.jsx`, dan komponen yang menampilkan aksi
  - Gunakan permission yang dikembalikan server hanya untuk UX.
  - Backend tetap menjadi enforcement utama.
  - Logout tetap diteruskan ke `main.jsx` agar revoke dilakukan satu kali.

- `frontend/src/utils/helpers.js`
  - Tambahkan normalisasi response auth/error bila helper ini menjadi boundary bersama.
  - Jangan menaruh password hash, token generation, atau permission enforcement di frontend.

### Artefak/deployment

- `Index.html` hanya diperbarui saat fase implementasi setelah build disetujui; tidak disentuh pada fase perencanaan ini.
- `frontend/dist/` hanya diperbarui saat build/deployment resmi; tidak disentuh pada fase perencanaan ini.

## 2. File/fungsi yang perlu ditambahkan

### Backend: `auth.gs` atau bagian auth terpisah dari `code.gs`

Memisahkan auth dari fungsi bisnis direkomendasikan agar boundary mudah diaudit.

Fungsi publik:

- `login(username, password)` — pengganti `verifyLogin()`.
- `validateSession(sessionToken)` — mengembalikan profil aman atau status invalid/expired.
- `logout(sessionToken)` — revoke server-side.
- `logoutAllForUser(sessionToken)` — opsional untuk incident response/password change.
- `cleanupExpiredSessions()` — maintenance/admin function, bukan endpoint anonim.

Fungsi internal:

- `hashPassword(password, salt)`
- `verifyPassword(password, storedHash, salt)`
- `createOpaqueSessionToken()`
- `hashSessionToken(token)`
- `getAuthenticatedSession(sessionToken)`
- `requireAuthenticatedUser(sessionToken)`
- `requirePermission(sessionToken, permissionCode)`
- `getPermissionsForRole(role)`
- `safeUserProfile(accountRow)`
- `auditAuthEvent(...)`

Catatan: gunakan `Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, ...)` dengan salt unik per account. Untuk hardening lebih kuat, evaluasi keterbatasan Apps Script sebelum memilih iterated hashing; jangan mengklaim bcrypt/Argon2 jika runtime belum menyediakan implementasinya. Password policy dan rate limiting tetap wajib.

### Frontend: `frontend/src/services/authService.js`

Tanggung jawab:

- menyimpan/mengambil/menghapus token sesi dari `sessionStorage` atau memory;
- memanggil `login`, `validateSession`, dan `logout` melalui `google.script.run`;
- menormalisasi hasil auth;
- tidak menyimpan role sebagai sumber kebenaran.

### Frontend: `frontend/src/services/scriptRun.js`

Satu boundary pemanggilan Apps Script untuk:

- menyertakan token secara konsisten;
- meneruskan success/failure handler;
- mengenali `AUTH_REQUIRED` dan `SESSION_EXPIRED`;
- mencegah pemanggilan fungsi sensitif tanpa token.

### Opsional: `frontend/src/context/AuthContext.jsx`

Gunakan hanya jika state auth perlu dipakai banyak fitur. Jika perubahan minimal lebih penting, state dapat tetap di `main.jsx` dan diteruskan sebagai props.

## 3. Struktur Sheet Account

Nama sheet tetap: `Account`.

Header yang direkomendasikan:

```text
UserId | Username | PasswordHash | PasswordSalt | Nama | Role | Status | PermissionsOverride | FailedAttempts | LockedUntil | PasswordChangedAt | LastLoginAt | RevokedAt | CreatedAt | UpdatedAt
```

Keterangan:

- `UserId`: ID stabil, bukan nomor baris.
- `Username`: identifier login; normalisasi case/whitespace secara konsisten.
- `PasswordHash`: hash password; bukan password asli.
- `PasswordSalt`: salt unik per account.
- `Nama`: nama display.
- `Role`: role server-side, misalnya `SuperAdmin`, `Operator`, `Bendahara`, `Viewer`.
- `Status`: `Aktif`, `Nonaktif`, atau `Locked`.
- `PermissionsOverride`: kosong atau daftar kode yang disetujui; gunakan role matrix sebagai default.
- `FailedAttempts`: counter login gagal.
- `LockedUntil`: waktu unlock sementara.
- `PasswordChangedAt`: kebutuhan expiry/password reset.
- `LastLoginAt`: audit operasional.
- `RevokedAt`: invalidasi seluruh session bila password/privilege berubah.
- `CreatedAt`, `UpdatedAt`: metadata.

Aturan:

- Jangan menulis default username/password produksi dari source code.
- Migrasi akun lama dilakukan satu kali melalui prosedur admin terpisah.
- Password lama tidak dapat dikonversi ke hash tanpa mengetahui password; minta setiap user membuat password baru atau lakukan transisi login satu kali yang segera di-hash setelah verifikasi terbatas.
- Jangan return `PasswordHash`, `PasswordSalt`, atau field keamanan ke frontend.

## 4. Struktur Sheet Session

Nama sheet baru: `Session`.

Header:

```text
SessionId | TokenHash | UserId | CreatedAt | LastSeenAt | ExpiresAt | RevokedAt | RevokeReason | UserAgentHash | CreatedByIpHash | Status
```

Keterangan:

- `SessionId`: ID internal untuk audit, boleh UUID server-side.
- `TokenHash`: hash token opaque; token mentah tidak disimpan.
- `UserId`: referensi ke `Account.UserId`.
- `CreatedAt`, `LastSeenAt`, `ExpiresAt`: lifecycle session.
- `RevokedAt`, `RevokeReason`: logout, expiry, password change, admin revoke, suspicious activity.
- `UserAgentHash`, `CreatedByIpHash`: opsional; hanya jika tersedia secara aman. Jangan menganggap IP dapat diperoleh secara konsisten dari `google.script.run`.
- `Status`: `Active`, `Expired`, `Revoked`.

Kebijakan awal:

- Absolute expiry: 8 jam untuk akun operasional.
- Idle timeout: 30–60 menit, sesuai kebutuhan kerja.
- Refresh activity hanya melalui request terautentikasi dan tidak melewati absolute expiry.
- Maksimum concurrent sessions per user: misalnya 3; pilih angka final saat implementasi.
- Cleanup session expired dilakukan periodik atau opportunistically dengan lock.
- Semua pencarian/update Session memakai `LockService` untuk mencegah race condition.

Catatan trade-off: Spreadsheet sebagai session store mudah diaudit dan sesuai arsitektur saat ini, tetapi lebih lambat dan rentan race/kuota. Jika concurrency meningkat, pindahkan session store ke datastore eksternal tanpa mengubah kontrak frontend/backend.

## 5. Alur login

```text
Login.jsx menerima username/password
        ↓
google.script.run.login(username, password)
        ↓
Backend normalisasi username + rate-limit check
        ↓
Baca Account; tolak account tidak aktif/locked
        ↓
Verifikasi PasswordHash + PasswordSalt
        ↓
Jika gagal: increment FailedAttempts, generic error, audit event
        ↓
Jika berhasil: reset counter, update LastLoginAt
        ↓
Buat random opaque token
        ↓
Simpan hash token + UserId + expiry di Session
        ↓
Return token + safe profile + permission codes
        ↓
Frontend menyimpan token session sementara
        ↓
main.jsx menjadi authenticated
        ↓
App.jsx memuat data memakai token
```

Response login minimal:

```text
{ success, sessionToken, expiresAt, user: { userId, name, role, permissions } }
```

Jangan return password, hash, salt, Spreadsheet ID, atau detail kegagalan internal.

Login error harus generik agar tidak membocorkan apakah username terdaftar.

## 6. Alur logout

```text
User klik logout
        ↓
App/Header memanggil main.jsx handler
        ↓
google.script.run.logout(sessionToken)
        ↓
Backend hash token dan mencari session aktif
        ↓
Set RevokedAt + RevokeReason = USER_LOGOUT
        ↓
Return success
        ↓
Frontend menghapus token dari sessionStorage/memory
        ↓
Frontend membersihkan currentUser dan seluruh state data
        ↓
Kembali ke Login
```

Jika request revoke gagal karena jaringan:

- tetap hapus token lokal agar UI keluar;
- tampilkan status generik;
- catat bahwa server revoke perlu ditangani pada request berikutnya hanya jika token masih ada — jangan mempertahankan token demi retry tanpa kebijakan jelas.

Tambahkan revoke semua session ketika:

- password diubah;
- user dinonaktifkan;
- role/permission diturunkan;
- ada indikasi kompromi.

## 7. Alur validasi session

Setiap fungsi Apps Script yang membutuhkan auth menerima token sebagai argumen pertama atau dalam envelope standar:

```text
{ sessionToken, payload }
```

Validasi backend:

```text
1. Pastikan token ada dan format/length valid.
2. Hash token.
3. Cari TokenHash pada Session.
4. Pastikan Status = Active dan RevokedAt kosong.
5. Pastikan now < ExpiresAt.
6. Ambil Account berdasarkan UserId.
7. Pastikan Account.Status = Aktif.
8. Ambil role dan permission dari server.
9. Update LastSeenAt secara terkendali.
10. Jalankan requirePermission() sesuai fungsi.
11. Isi createdBy/updatedBy dari authenticated user.
```

Mapping permission awal:

```text
students.view
students.create
students.update
students.delete
payments.view
payments.update
finance.view
finance.create
finance.update
finance.delete
reports.view
import.preview
import.execute
sync.execute
users.view
users.manage
```

Enforcement minimum:

- read santri: `students.view`
- create/update santri: `students.create` / `students.update`
- delete santri: `students.delete`
- read/update pembayaran: `payments.view` / `payments.update`
- finance: permission finance sesuai operasi
- import preview: `import.preview`
- import destructive: `import.execute`
- sync: `sync.execute`
- account management: `users.manage`

Frontend boleh menyembunyikan tombol berdasarkan permission, tetapi backend tetap wajib menolak request tanpa permission.

## 8. Migrasi dari API lama

Tahap transisi:

1. Tambahkan schema baru dan helper auth tanpa menghapus fungsi lama.
2. Buat akun admin pertama secara manual/terkendali; jangan memakai default credential di source.
3. Migrasikan akun lama ke hash melalui reset password.
4. Ubah `Login.jsx` ke endpoint login baru.
5. Tambahkan token ke seluruh request read/mutation.
6. Pasang backend guard pada seluruh endpoint.
7. Ubah payload audit agar memakai user dari session.
8. Nonaktifkan `verifyLogin(username, password)` lama atau jadikan wrapper kompatibilitas yang segera diberi sunset date dan tidak boleh mengakses data bisnis.
9. Hapus fallback credential production.
10. Setelah verifikasi deployment, revoke semua session lama dan deploy versi final.

Jangan biarkan endpoint lama dan baru sama-sama membuka mutation tanpa guard.

## 9. Urutan implementasi

### Fase 1 — Kontrak dan schema, tanpa perubahan perilaku bisnis

- Dokumentasikan response auth, envelope request, error codes, permission matrix.
- Tambahkan sheet `Session` kosong dengan header final.
- Ubah struktur `Account` melalui migration terkontrol.
- Pastikan backup Spreadsheet tersedia.

Acceptance:

- Tidak ada password plaintext baru.
- Account memiliki `UserId`, hash, salt, status, dan role.
- Session sheet tidak menyimpan token mentah.

### Fase 2 — Password hashing dan login backend

- Implementasikan hash/verify password.
- Implementasikan login, generic error, failed attempts, lockout.
- Implementasikan audit auth event.
- Buat unit/fixture test untuk success, wrong password, inactive user, locked user.

Acceptance:

- Password benar menghasilkan session token.
- Password salah tidak menghasilkan token.
- Response tidak membocorkan hash/salt/password.

### Fase 3 — Session lifecycle

- Implementasikan create session, expiry, idle timeout, revoke, validate, cleanup.
- Tambahkan LockService pada operasi Session.
- Implementasikan logout dan revoke-all.

Acceptance:

- Token valid diterima.
- Token expired/revoked ditolak.
- Logout membuat token tidak bisa dipakai ulang.
- Token berbeda antarlogin.

### Fase 4 — Frontend auth boundary

- Tambahkan `authService.js` dan `scriptRun.js`.
- Ubah `Login.jsx` ke login baru.
- Ubah `main.jsx` ke state checking/authenticated/expired.
- Hapus pembacaan identity/role dari localStorage.
- Bersihkan state saat logout/session expired.

Acceptance:

- Refresh dengan token valid dapat divalidasi ulang sesuai kebijakan.
- Refresh tanpa token kembali ke login.
- Session expired menampilkan pesan aman dan mengeluarkan user.
- Preview lokal tidak memuat credential produksi.

### Fase 5 — Backend authorization

- Tambahkan `requireAuthenticatedUser` dan `requirePermission` ke semua endpoint.
- Ganti `dibuatOleh` dari payload dengan identity session.
- Validasi account status dan permission pada setiap request.
- Pastikan error unauthorized/forbidden konsisten.

Acceptance:

- User tanpa token tidak dapat read/mutate.
- User dengan role viewer tidak dapat delete/import/finance mutation.
- Memodifikasi role di localStorage tidak mengubah akses.
- Memodifikasi role di payload tidak mengubah akses.

### Fase 6 — Migrasi mutation dan data boundary

- Pertahankan fitur STRATA, tetapi tambahkan token ke semua pemanggilan.
- Ganti rowIndex dengan stable ID sebagai hardening lanjutan; ini bukan blocker untuk auth contract, tetapi wajib sebelum production mutation.
- Tambahkan lock ke seluruh mutation.
- Batasi import dengan permission, source whitelist, backup, dan rollback plan.

### Fase 7 — Cutover dan deployment

- Deploy staging Apps Script.
- Uji dengan akun operator, bendahara, viewer, akun nonaktif, dan token invalid.
- Revoke session staging.
- Deploy production version.
- Nonaktifkan endpoint plaintext lama.
- Catat deployment version dan rollback procedure.

## 10. Testing plan

### Backend unit/fixture tests

Minimal test cases:

- password hash berbeda untuk salt berbeda;
- password benar/salah;
- username tidak ditemukan memakai error generik;
- account nonaktif ditolak;
- lockout setelah threshold gagal;
- token memiliki entropy/keunikan;
- token mentah tidak muncul di Session sheet;
- token valid diterima;
- token malformed/unknown ditolak;
- token expired ditolak;
- token revoked ditolak;
- account dinonaktifkan setelah token dibuat → token ditolak;
- role/permission server-side diterapkan;
- logout revoke token;
- revoke-all membatalkan semua session user.

### Authorization matrix tests

- Viewer: read yang diizinkan, mutation ditolak.
- Operator santri: CRUD santri sesuai permission, finance ditolak.
- Bendahara: finance sesuai permission, user management ditolak.
- SuperAdmin: seluruh permission sesuai policy.
- Semua role: import destructive hanya jika `import.execute`.

### Frontend tests/manual checks

- Login sukses menyimpan token, bukan password.
- Login gagal menghapus loading state.
- Logout memanggil revoke dan membersihkan state.
- Session expired saat fetch menyebabkan kembali ke login.
- Refresh behavior sesuai policy.
- Mengubah `ppnj_active_role` di DevTools tidak menaikkan akses.
- `localStorage` tidak berisi password, hash, token authority, atau permission authority.
- Offline/local preview tidak memakai credential production.

### Integration/deployment tests

- Login melalui deployment Web App nyata.
- Semua `google.script.run` read/mutation membawa token.
- Akun Gmail yang tidak terdaftar ditolak oleh Account.
- Dua browser/session berjalan independen.
- Logout di browser A tidak menghidupkan kembali token lama.
- Expiry diuji dengan waktu pendek di staging.
- Concurrent login/logout/mutation diuji dengan LockService.
- Session cleanup tidak menghapus session aktif.

### Verification commands setelah implementasi

```bash
cd frontend
npm run lint
npm run build
npm run dev -- --host 127.0.0.1
```

Kemudian verifikasi HTML Vite dan route/flow yang tersedia. Karena Apps Script tidak dapat dijalankan penuh dari local Vite tanpa harness, uji endpoint auth dan permission harus dilakukan terhadap deployment staging Apps Script dengan Spreadsheet fixture.

## 11. Risiko dan mitigasi

- **Password hashing Apps Script:** gunakan primitive yang tersedia dan dokumentasikan parameter; evaluasi migrasi ke external identity provider jika kebutuhan keamanan meningkat.
- **Session Sheet lambat:** gunakan lock, batch read/write, cleanup, dan batasi concurrent sessions; pindahkan store jika volume meningkat.
- **Token di browser:** pilih `sessionStorage`/memory, jangan password; CSP/XSS hardening tetap diperlukan.
- **`google.script.run` stateless:** setiap call wajib membawa token; helper bersama mencegah request lupa auth.
- **Legacy endpoint:** jangan mengandalkan frontend untuk memblokir; endpoint lama harus ditutup/guarded sebelum production.
- **Account migration:** lakukan backup dan reset password; jangan membuat asumsi bahwa plaintext dapat di-hash ulang tanpa password asli.
- **Owner execution:** `Execute as = Me` tetap memberi backend privilege owner; role/permission server-side adalah kontrol wajib, bukan pilihan.

## 12. Definition of done

- Tidak ada password plaintext/default credential di source atau Sheet Account.
- Login menghasilkan opaque token yang hanya disimpan ter-hash di Session.
- Token memiliki absolute expiry dan idle timeout.
- Logout merevoke token server-side.
- Semua read/mutation sensitif memvalidasi session.
- Semua mutation menerapkan permission server-side.
- Role localStorage tidak memiliki nilai security.
- `dibuatOleh` dan audit identity berasal dari session.
- Token expired/revoked tidak dapat dipakai ulang.
- Audit log tersedia untuk login gagal/berhasil, logout, revoke, denied access, mutation, dan import.
- Lint/build frontend lulus dan deployment staging berhasil diuji.
- Tidak ada perubahan fitur STRATA di luar auth boundary yang disetujui.
