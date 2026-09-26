# LAPORAN IMPLEMENTASI & DOKUMENTASI SISTEM (TUGAS 3)
## SISTEM INFORMASI OPERASIONAL & TRANSAKSI RESTORAN "DAPUR INA AINA"
**Skema Sertifikasi: Pemrogram Muda (*Junior Programmer*) &bull; LSP Universitas Gunadarma**

---

## 1. Ringkasan Eksekutif & Pemenuhan Tugas

Aplikasi ini dirancang dan dibangun untuk memenuhi seluruh kompetensi pada **Tugas 3 LSP Pemrogram Muda**:
1. **Pengolahan Transaksi**: Menampilkan data pesanan pelanggan, perhitungan otomatis subtotal & total belanja, pencatatan kasir, dan penanganan status transaksi.
2. **Kesesuaian *Coding-Guidelines* & Paradigma**: Dibangun dengan paradigma **Object-Oriented Programming (OOP)**, pola arsitektur **MVC (Model-View-Controller)**, clean code, penamaan variabel deskriptif, dan pemisahan logika bisnis (*Separation of Concerns*).
3. **Penanganan & Demonstrasi Error**: Dilengkapi mekanisme **Exception Handling (`try-catch`)** terstruktur, validasi input, pencegahan stok minus (*stock concurrency protection*), dan halaman simulasi error interaktif untuk pengujian asesor LSP.
4. **Tugas 3 No. 5 (Input & Update Data Stok)**: Form tambah dan update data stok menu berdasarkan 3 kriteria kategori (**Makanan Utama**, **Appetizer**, **Minuman**), terhubung langsung dengan basis data MySQL `db_dapur_ina`.
5. **Tugas 3 No. 6 (Billing & Pembayaran)**: Menampilkan rincian billing tagihan pesanan pelanggan secara transparan, opsi pembayaran **Tunai (Cash)** dengan kalkulasi uang kembalian otomatis, opsi **Non-Tunai (Debit, Kartu Kredit, QRIS)** dengan nomor referensi transaksi, serta cetak bukti struk/nota kasir (*print-ready*).

---

## 2. Struktur Proyek & Paradigma Pemrograman

```
projek lsp dapur ina/
├── config/
│   └── database.php           # Koneksi PDO Singleton & Exception Handler
├── models/
│   ├── Kategori.php           # Model Master Kategori (3 Kategori LSP)
│   ├── Produk.php             # Model Menu Produk & Validasi Stok (Tugas 3.5)
│   ├── Pesanan.php            # Model Transaksi Header & Detail Pesanan
│   └── Pembayaran.php         # Model Billing & Pembayaran Tunai/Non-Tunai (Tugas 3.6)
├── controllers/
│   ├── ProdukController.php   # Controller Manajemen Stok & Menu
│   ├── TransaksiController.php# Controller Transaksi Kasir & Billing
│   └── ApiController.php      # JSON API & Simulasi Error Handling
├── views/
│   ├── layout/
│   │   ├── header.php         # Navbar, Indikator Koneksi DB Live, Meta
│   │   └── footer.php         # Footer & Hak Cipta LSP Gunadarma
│   ├── transaksi/
│   │   ├── index.php          # POS Antarmuka Kasir (Kategori, Keranjang, Meja)
│   │   ├── billing.php        # Tampilan Billing & Form Bayar Tunai/Non-Tunai
│   │   ├── riwayat.php        # Data Pesanan Pelanggan & Status
│   │   └── cetak_struk.php    # Format Cetak Struk Billing Kasir (80mm)
│   ├── stok/
│   │   └── index.php          # Manajemen Stok: Input & Update Menu
│   └── error_demo.php         # Halaman Demonstrasi Penanganan Error LSP
├── assets/
│   ├── css/
│   │   ├── style.css          # Design System UI Modern & Responsif
│   │   └── print.css          # Print CSS Layout Thermal Struk
│   └── js/
│       ├── app.js             # Client Script POS & Keranjang Real-time
│       └── billing.js         # Kalkulator Kembalian & Mode Pembayaran
├── database/
│   ├── schema.sql             # Skema SQL DDL & DML Awal
│   └── setup.php              # Automated One-Click Database Migration
├── tests/
│   └── integration_test.php   # Skrip Pengujian Otomatis Seluruh Alur
├── index.php                  # Router Utama Aplikasi (Entry Point)
└── README_TUGAS_3.md          # Dokumentasi Resmi Tugas 3 LSP
```

---

## 3. Fitur Utama & Ketercapaian Soal

### A. Pengolahan Transaksi & Tampilan Data Pesanan
- **Filter Kategori Cepat**: Memilah daftar menu berdasarkan **Makanan Utama**, **Appetizer**, dan **Minuman**.
- **Keranjang Interaktif (POS)**: Penambahan porsi dengan proteksi stok real-time (tidak dapat menambah porsi jika stok di database habis atau tidak mencukupi).
- **Pencatatan Meja & Pelanggan**: Mendukung pencatatan nomor meja, nama pelanggan, waktu pesanan, dan nama kasir bertugas.
- **Daftar Riwayat Pesanan**: Tabel riwayat lengkap dengan filter status (*Menunggu*, *Selesai*, *Batal*).

### B. Tugas 3 No. 5: Input & Update Data Stok
- **Input Data Menu Baru**: Form modal interaktif untuk menambahkan menu ke dalam 3 kategori wajib beserta harga, stok awal, status (*Tersedia* / *Habis*), dan deskripsi.
- **Update Data Menu**: Pembaruan menyeluruh informasi menu dan harga.
- **Update Cepat Sisa Stok (*Quick Stock Adjuster*)**: Tombol cepat `+5`, `-5`, atau input angka manual yang langsung memperbarui tabel basis data dan status ketersediaan secara otomatis.
- **Koneksi Database Terverifikasi**: Indikator status live database pada navbar atas (`Database Online (MySQL)`) yang mendeteksi ketersediaan port 3306.

### C. Tugas 3 No. 6: Billing & Pembayaran Tunai / Non-Tunai
- **Tampilan Dokumen Billing**: Format nota tagihan terperinci memuat No. Nota (`ORD-YYYYMMDD-XXXX`), Waktu, Meja, Rincian Item Porsi, Harga Satuan, Subtotal, dan Total Tagihan.
- **Pembayaran Tunai (Cash)**:
  - Input nominal uang yang diterima dari pelanggan.
  - Tombol pintasan nominal (*Uang Pas*, Rp 50.000, Rp 100.000, Rp 150.000, Rp 200.000, Rp 500.000).
  - Kalkulasi otomatis uang kembalian.
  - Validasi error jika uang yang diserahkan kurang dari total tagihan.
- **Pembayaran Non-Tunai**:
  - Opsi: **Debit Card**, **Kartu Kredit**, dan **QRIS**.
  - Input nomor referensi transaksi / 
  - Nominal langsung terkonfirmasi Selesai tanpa kembalian.
- **Cetak Struk Transaksi**: Tampilan cetak standar kasir (*Thermal Print Format 80mm*) dengan tombol cetak langsung (`window.print()`).

---

## 4. Penanganan Error & Coding Guidelines

Aplikasi menerapkan standar industri dengan penanganan eksepsi bertingkat:

| Jenis Error | Mekanisme Penanganan | Respon Aplikasi |
| :--- | :--- | :--- |
| **Koneksi Database Gagal** | `PDOException` ditangkap di `config/database.php` | Status badge berubah menjadi *DB Disconnected*, sistem tidak crash dan menampilkan panduan pengecekan server MySQL. |
| **Pemesanan Stok Habis** | Exception di `models/Pesanan.php` & `models/Produk.php` | Transaksi dibatalkan (Rollback), tombol tambah porsi dinonaktifkan, muncul notifikasi error stok tidak mencukupi. |
| **Uang Tunai Kurang** | `InvalidArgumentException` di `models/Pembayaran.php` | Form menampilkan alert merah selisih nominal kekurangan dan menonaktifkan tombol submit pembayaran. |
| **Form Input Kosong / Invalid** | Validasi Server & Client | Field wajib diberi tanda bintang (`*`), regex & boundary check (harga & stok $\ge$ 0). |

---

## 5. Panduan Menjalankan Aplikasi (Untuk Asesor / Penguji LSP)

### Langkah 1: Memastikan Server MySQL Aktif
Pastikan MySQL aktif (misal melalui XAMPP Control Panel pada port 3306).

### Langkah 2: Setup Database Otomatis (One-Click Migration)
Jalankan perintah berikut di terminal:
```bash
php database/setup.php
```

### Langkah 3: Menjalankan Web Server PHP
Jalankan perintah built-in server PHP di folder proyek:
```bash
php -S 127.0.0.1:8080
```

### Langkah 4: Membuka Aplikasi di Browser
Buka browser dan akses:
- **Halaman Kasir & Transaksi**: `http://127.0.0.1:8080/index.php?page=transaksi`
- **Halaman Kelola Stok Menu**: `http://127.0.0.1:8080/index.php?page=stok`
- **Halaman Riwayat Pesanan & Billing**: `http://127.0.0.1:8080/index.php?page=riwayat`
- **Halaman Uji Penanganan Error LSP**: `http://127.0.0.1:8080/index.php?page=error_demo`

### Langkah 5: Menjalankan Pengujian Otomatis (Unit & Integration Test)
```bash
php tests/integration_test.php
```
