# 🍲 Dapur Ina Aina - Sistem Informasi & POS Restoran (Node.js + PostgreSQL)

Aplikasi web modern untuk manajemen pesanan, kasir (POS), inventaris stok, dan laporan penjualan restoran **Dapur Ina Aina**. Telah dimigrasikan dari PHP ke arsitektur modern **Node.js, Express, EJS, dan PostgreSQL** dengan desain UI responsif (*Desktop & Mobile-First*).

---

## 🚀 Fitur Unggulan

1. **📱 Portal Pemesanan Pelanggan (*Customer Portal*)**:
   - Tampilan responsif untuk smartphone, tablet, dan desktop.
   - Pencarian menu interaktif *real-time* dan filter kategori (*Makanan Utama, Appetizer, Minuman*).
   - Keranjang belanja dinamis (*Floating Cart Drawer*) dengan kalkulasi otomatis.
   - Pelacakan status pesanan & nomor meja.

2. **⚡ Point of Sale (Kasir POS)**:
   - Antarmuka kasir cepat untuk transaksi meja & *take away*.
   - Kalkulasi subtotal, diskon, dan total tagihan instan.
   - Manajemen pembayaran: **Tunai (Cash)** dengan tombol nominal cepat & hitung kembalian otomatis, serta **Non-Tunai (QRIS / Transfer)**.
   - Cetak struk pembayaran format *Thermal Receipt* (58mm/80mm) yang ramah cetak (*print-ready*).

3. **📦 Manajemen Produk & Stok Porsi**:
   - Tambah, ubah, dan hapus menu makanan/minuman.
   - Penyesuaian stok cepat (*Quick Stock Stepper* `+` / `-`).
   - Peringatan stok otomatis (*Tersedia, Menipis ≤ 5 porsi, Habis*).

4. **📊 Dashboard & Laporan Keuangan**:
   - Statistik omset hari ini, total transaksi, dan menu terlaris.
   - Rekap laporan penjualan berdasarkan periode (**Harian, Mingguan, Bulanan, Rentang Kustom**).
   - Cetak dokumen rekapitulasi penjualan format A4 resmi beserta tanda tangan manajer.

---

## 📂 Struktur Proyek

```
projek lsp dapur ina/
├── config/
│   └── db.js                 # Koneksi PostgreSQL Pool & Auto-Migration
├── controllers/
│   ├── AuthController.js      # Autentikasi Admin / Kasir
│   ├── DashboardController.js # Statistik & Ringkasan Restoran
│   ├── ProdukController.js    # Manajemen Menu & Stok
│   ├── TransaksiController.js # POS Kasir, Checkout & Billing
│   ├── UserController.js      # Portal Pelanggan & Buku Menu
│   ├── LaporanController.js   # Rekapitulasi Penjualan
│   └── ApiController.js       # JSON Endpoints
├── database/
│   ├── schema.sql             # Skema DDL Tabel PostgreSQL
│   └── seed.js                # Seeder Data Awal & Menu
├── middlewares/
│   ├── auth.js                # Proteksi Rute Admin
│   └── locals.js              # Formatter Rupiah, Tanggal & Session
├── models/
│   ├── Admin.js
│   ├── Produk.js
│   ├── Pelanggan.js
│   ├── Pesanan.js
│   ├── Pembayaran.js
│   └── Laporan.js
├── public/
│   ├── css/
│   │   ├── style.css          # Desain Modern, Glassmorphism, & Mobile Nav
│   │   └── print.css          # Optimasi Cetak Struk & Dokumen
│   └── js/
│       ├── app.js             # State Keranjang Belanja & Filter Interaktif
│       └── billing.js         # Kalkulator Kasir & QRIS
├── routes/                    # Modular Express Routers
├── views/                     # EJS Templates & Partials
├── .env.example               # Contoh Konfigurasi Environment
├── server.js                  # Entry Point Server Express
└── package.json               # Dependencies & NPM Scripts
```

---

## 🛠️ Panduan Instalasi & Menjalankan Lokal

### 1. Prasyarat
- **Node.js** v18+ (Disarankan LTS)
- **PostgreSQL** aktif di komputer lokal atau menggunakan Cloud Database (Supabase / Neon / Render).

### 2. Install Dependensi
```bash
npm install
```

### 3. Konfigurasi Database `.env`
Buat file `.env` (atau salin dari `.env.example`) dan isi koneksi PostgreSQL Anda:
```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dapur_ina_db
```
*(Ganti user dan password sesuai PostgreSQL Anda)*.

### 4. Menjalankan Server
```bash
# Mode Produksi
npm start

# Mode Pengembangan (Auto-reload)
npm run dev
```

Server otomatis membuat tabel dan mengisi menu awal (*seeding*) saat pertama kali dijalankan!

---

## 🔑 Akun Default Administrator
* **URL Login**: `http://localhost:3000/login`
* **Email**: `admin@dapurina.com`
* **Password**: `admin123`

---

## 🌐 Panduan Deploy ke Cloud (Render / Railway / VPS)

Proyek ini sudah 100% siap untuk di-deploy secara publik:

### Deploy di **Render.com** (Gratis & Mudah):
1. Buat database PostgreSQL gratis di **Render Dashboard** (*New PostgreSQL*).
2. Salin **Internal / External Database URL** yang disediakan Render.
3. Buat **Web Service** baru, hubungkan repository Git proyek ini:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Tambahkan Environment Variable di Render:
   - `DATABASE_URL` = `(URL PostgreSQL dari Langkah 2)`
   - `NODE_ENV` = `production`
5. Aplikasi akan otomatis live dan dapat diakses dari HP maupun komputer di seluruh dunia! 🚀
