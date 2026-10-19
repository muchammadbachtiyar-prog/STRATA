# PNJ PPDB & Finance Frontend (Modular Version)

Folder ini berisi versi modular dari frontend sistem PPDB & Keuangan Pondok Pesantren Nailul Jannah. Struktur ini memecah file monolitik `Index.html` asli ke dalam komponen-komponen React terpisah untuk mempermudah pengembangan, meningkatkan kecepatan pemuatan halaman (menghilangkan overhead kompilasi Babel in-browser), dan memudahkan kolaborasi tim.

## Persyaratan
Untuk menjalankan dan mengompilasi proyek ini secara lokal, Anda perlu menginstal:
*   **Node.js** (LTS recommended)
*   **npm** (otomatis terpasang bersama Node.js)

Anda dapat mengunduhnya dari [nodejs.org](https://nodejs.org/).

## Cara Menjalankan secara Lokal (Development)

1.  Buka terminal/PowerShell di folder ini (`c:\Users\ThinkPad\OneDrive\Documents(1)\TA\Project\frontend`).
2.  Instal seluruh dependensi:
    ```bash
    npm install
    ```
3.  Jalankan server pengembangan lokal:
    ```bash
    npm run dev
    ```
4.  Buka browser Anda dan akses alamat yang tertera (biasanya `http://localhost:5173`). Anda dapat menguji perubahan antarmuka secara instan menggunakan fitur *Hot Module Replacement (HMR)*.

## Cara Melakukan Kompilasi untuk Google Apps Script (Production Build)

Karena Google Apps Script (GAS) tidak mendukung pemuatan aset eksternal secara relatif (seperti file `.js` atau `.css` terpisah), proyek ini dikonfigurasi menggunakan `vite-plugin-singlefile` untuk mengompilasi seluruh aplikasi menjadi **satu file HTML tunggal** yang siap digunakan.

1.  Jalankan perintah build:
    ```bash
    npm run build
    ```
2.  Proses build akan menghasilkan folder `dist/` yang di dalamnya terdapat file `index.html`.
3.  Buka file `dist/index.html` tersebut, lalu salin seluruh isinya.
4.  Buka editor **Google Apps Script** Anda (`script.google.com`) dan ganti seluruh isi file `Index.html` Anda dengan kode yang telah disalin.
5.  Deploy kembali web app Anda!
