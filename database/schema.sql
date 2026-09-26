-- ==========================================================
-- SKEMA BASIS DATA: RESTORAN DAPUR INA AINA (PostgreSQL)
-- Skema Sertifikasi LSP: Pemrogram Muda (Junior Programmer)
-- Database: dapur_ina_db
-- ==========================================================

-- 1. Tabel Administrator
CREATE TABLE IF NOT EXISTS administrator (
    id_admin SERIAL PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Pelanggan
CREATE TABLE IF NOT EXISTS pelanggan (
    id_pelanggan SERIAL PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    no_telepon VARCHAR(20) DEFAULT '-',
    alamat VARCHAR(255) DEFAULT 'Dine In',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Produk (3 Kategori: Makanan Utama, Appetizer, Minuman)
CREATE TABLE IF NOT EXISTS produk (
    id_produk SERIAL PRIMARY KEY,
    nama_produk VARCHAR(100) NOT NULL,
    kategori VARCHAR(50) NOT NULL,
    harga DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    stok INT NOT NULL DEFAULT 0,
    status_stok VARCHAR(20) NOT NULL DEFAULT 'Tersedia',
    deskripsi TEXT DEFAULT '',
    gambar VARCHAR(255) DEFAULT '',
    id_admin INT REFERENCES administrator(id_admin) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Pesanan (Header Transaksi)
CREATE TABLE IF NOT EXISTS pesanan (
    id_pesanan SERIAL PRIMARY KEY,
    id_pelanggan INT REFERENCES pelanggan(id_pelanggan) ON DELETE SET NULL,
    tanggal TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'Menunggu',
    nomor_meja VARCHAR(50) DEFAULT 'Meja 01',
    catatan TEXT DEFAULT ''
);

-- 5. Tabel Detail Pesanan
CREATE TABLE IF NOT EXISTS detail_pesanan (
    id_detail SERIAL PRIMARY KEY,
    id_pesanan INT NOT NULL REFERENCES pesanan(id_pesanan) ON DELETE CASCADE,
    id_produk INT REFERENCES produk(id_produk) ON DELETE RESTRICT,
    jumlah INT NOT NULL DEFAULT 1,
    harga DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00
);

-- 6. Tabel Laporan Penjualan
CREATE TABLE IF NOT EXISTS laporan_penjualan (
    id_laporan SERIAL PRIMARY KEY,
    jenis_periode VARCHAR(30) NOT NULL,
    tanggal_mulai DATE NOT NULL,
    tanggal_akhir DATE NOT NULL,
    total_transaksi INT NOT NULL DEFAULT 0,
    total_penjualan DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    id_admin INT REFERENCES administrator(id_admin) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabel Transaksi (Billing & Pembayaran)
CREATE TABLE IF NOT EXISTS transaksi (
    id_transaksi SERIAL PRIMARY KEY,
    id_pesanan INT UNIQUE REFERENCES pesanan(id_pesanan) ON DELETE CASCADE,
    id_laporan INT REFERENCES laporan_penjualan(id_laporan) ON DELETE SET NULL,
    tanggal_bayar TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metode VARCHAR(20) NOT NULL DEFAULT 'tunai', -- 'tunai' atau 'non_tunai'
    jumlah_bayar DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    uang_diterima DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    uang_kembalian DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    no_referensi VARCHAR(100) DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'Selesai'
);

-- Indexing untuk optimasi query
CREATE INDEX IF NOT EXISTS idx_produk_kategori ON produk(kategori);
CREATE INDEX IF NOT EXISTS idx_pesanan_tanggal ON pesanan(tanggal);
CREATE INDEX IF NOT EXISTS idx_transaksi_tanggal ON transaksi(tanggal_bayar);
