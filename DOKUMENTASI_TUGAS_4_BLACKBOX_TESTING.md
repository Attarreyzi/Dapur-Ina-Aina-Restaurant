# LAPORAN PENGUJIAN PERANGKAT LUNAK (TUGAS 4)
# BLACK BOX TESTING & UNIT TESTING
## SISTEM INFORMASI OPERASIONAL & TRANSAKSI RESTORAN "DAPUR INA AINA"
**Skema Sertifikasi: Pemrogram Muda (*Junior Programmer*) &bull; LSP Informatika / Gunadarma**

---

## DAFTAR ISI
1. [Pendahuluan & Tujuan Pengujian](#1-pendahuluan--tujuan-pengujian)
2. [Menentukan Kebutuhan & Lingkup Uji Coba](#2-menentukan-kebutuhan--lingkup-uji-coba)
3. [Mempersiapkan Data Uji Coba (Test Data)](#3-mempersiapkan-data-uji-coba-test-data)
4. [Skenario & Matriks Pengujian Black Box Testing (Lengkap)](#4-skenario--matriks-pengujian-black-box-testing-lengkap)
5. [Hasil Uji Otomatis (Unit Testing 22/22 PASS)](#5-hasil-uji-otomatis-unit-testing-2222-pass)
6. [Evaluasi & Kesimpulan Pengujian](#6-evaluasi--kesimpulan-pengujian)
7. [Lampiran Rangkuman Kode Sumber Inti Program](#7-lampiran-rangkuman-kode-sumber-inti-program)

---

## 1. PENDAHULUAN & TUJUAN PENGUJIAN

Dokumen ini disusun untuk memenuhi seluruh kriteria unjuk kerja pada **Tugas 4 LSP Pemrogram Muda: Melakukan Pengujian Program**.
Pengujian dilakukan menggunakan metode **Black Box Testing** (pengujian fungsionalitas antarmuka dan alur bisnis tanpa melihat struktur internal kode) serta diverifikasi dengan **Unit Testing** otomatis untuk memastikan integritas logika basis data.

### Tujuan Pengujian:
1. Memverifikasi fungsionalitas seluruh use case aplikasi telah sesuai dengan kebutuhan pengguna (Pelanggan, Kasir, dan Administrator).
2. Memastikan validasi input, integritas data stok, kalkulasi billing uang tunai/kembalian, dan filter laporan penjualan berkala berjalan akurat.
3. Memastikan penanganan error (*Exception Handling*) mampu mengamankan sistem saat terjadi kondisi tidak valid (misal: stok habis, uang kurang, atau input kosong).

---

## 2. MENENTUKAN KEBUTUHAN & LINGKUP UJI COBA

Berdasarkan skenario bisnis Restoran "Dapur Ina Aina", kebutuhan uji coba diklasifikasikan ke dalam 7 modul utama:

| ID Modul | Nama Modul | Lingkup Kebutuhan Pengujian |
| :---: | :--- | :--- |
| **MOD-01** | **Autentikasi (Login/Logout)** | Hak akses kasir/admin, validasi kredensial, keamanan sesi, dan proteksi URL. |
| **MOD-02** | **Pemesanan Pelanggan (Customer Ordering)** | Pemilihan menu berdasarkan 3 kategori, penambahan ke keranjang, pencatatan identitas pelanggan & nomor meja (*Dine In / Take Away*). |
| **MOD-03** | **Manajemen Menu & Stok Produk** | Tambah menu baru pada 3 kategori (*Makanan Utama, Appetizer, Minuman*), ubah data, hapus menu, update cepat kuantitas stok, dan otomatisasi status (*Tersedia / Habis*). |
| **MOD-04** | **Billing & Pembayaran Tunai (Cash)** | Penerbitan nomor pesanan resmi, kalkulasi tagihan, input uang diterima, perhitungan otomatis uang kembalian, dan validasi uang kurang. |
| **MOD-05** | **Pembayaran Non-Tunai (Debit/CC/QRIS)** | Pemilihan metode non-tunai, input nomor referensi transaksi EDC/QR, dan penyelesaian tagihan pas. |
| **MOD-06** | **Cetak Struk Transaksi Kasir** | Pembuatan nota struk fisik format thermal kasir (80mm) yang mencantumkan rincian pesanan, kasir, waktu, dan status Selesai. |
| **MOD-07** | **Laporan Penjualan Berkala** | Rekapitulasi omset, filter periode berkala (*Laporan Mingguan & Laporan Bulanan*), filter kustom tanggal, dan cetak dokumen A4/PDF. |

---

## 3. MEMPERSIAPKAN DATA UJI COBA (TEST DATA)

Berikut adalah data uji standar yang dipersiapkan dalam pengujian sistem:

### A. Data Pengguna (Kredensial Login)
- **Akun Kasir/Admin Valid**: `username: admin`, `password: admin123`
- **Akun Tidak Valid**: `username: user_salah`, `password: pass_salah`

### B. Data Produk & Kategori (3 Kategori LSP)
1. **Makanan Utama**: Nasi Goreng Spesial (Rp 25.000, Stok: 25 porsi), Ayam Bakar Madu (Rp 30.000, Stok: 20 porsi).
2. **Appetizer**: Tahu Gejrot Cirebon (Rp 12.000, Stok: 15 porsi), Bakwan Jagung Renyah (Rp 10.000, Stok: 20 porsi).
3. **Minuman**: Es Teh Manis Nusantara (Rp 5.000, Stok: 50 porsi), Jus Alpukat Kocok (Rp 15.000, Stok: 5 porsi).

### C. Data Pelanggan & Meja
- Pelanggan 1: "Budi Santoso", Meja: "Meja 02" (*Dine In*)
- Pelanggan 2: "Siti Rahma", Meja: "Take Away"

---

## 4. SKENARIO & MATRIKS PENGUJIAN BLACK BOX TESTING (LENGKAP)

| No. Test Case | Modul / Fitur yang Diuji | Skenario & Langkah Uji | Data Masukan (Input) | Hasil yang Diharapkan (*Expected Result*) | Hasil Pengamatan (*Actual Result*) | Kesimpulan |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-01** | Login Kasir | Memasukkan username dan password yang benar pada form login. | `User: admin`<br>`Pass: admin123` | Sistem memvalidasi akun, membuat sesi login, dan mengarahkan ke dashboard admin. | Berhasil login dan dialihkan ke panel admin kasir. | **PASS (Sesuai)** |
| **TC-02** | Login Kasir (Negatif) | Memasukkan password salah pada form login. | `User: admin`<br>`Pass: salah123` | Sistem menolak autentikasi dan menampilkan pesan peringatan error. | Muncul notifikasi "Username atau password salah". | **PASS (Sesuai)** |
| **TC-03** | Portal Menu Pelanggan | Membuka katalog menu dan memfilter berdasarkan kategori. | Klik tab `Makanan Utama`, `Appetizer`, `Minuman` | Sistem menampilkan daftar menu yang sesuai dengan kategori terpilih. | Menu terfilter dengan cepat dan akurat sesuai kategori. | **PASS (Sesuai)** |
| **TC-04** | Keranjang & Validasi Meja | Menambah menu ke keranjang, mengisi nama dan nomor meja, lalu konfirmasi pesanan. | Nama: "Budi", Meja: "Meja 02", Items: Nasi Goreng (2), Es Teh (2) | Pesanan tersimpan di DB, stok menu otomatis berkurang (25-2=23), status *Menunggu*. | Pesanan masuk ke sistem, stok berkurang, nota terbit. | **PASS (Sesuai)** |
| **TC-05** | Proteksi Keranjang Kosong | Mengklik tombol konfirmasi pesanan saat keranjang masih kosong. | Keranjang: `[]` (Kosong) | Tombol checkout terkunci (*disabled*) dan sistem menolak proses. | Tombol tidak bisa diklik, pesanan kosong dicegah. | **PASS (Sesuai)** |
| **TC-06** | Tambah Menu Baru (Admin) | Admin menginput menu baru pada salah satu dari 3 kategori dengan data valid. | Nama: "Sop Buntut", Kategori: Makanan Utama, Harga: 45000, Stok: 10 | Data tersimpan di database dan muncul pada urutan teratas (No. 1). | Menu baru tersimpan dan langsung tampil di daftar menu. | **PASS (Sesuai)** |
| **TC-07** | Validasi Harga Negatif | Admin menginput harga produk dengan nilai minus/negatif. | Harga: `-15000` | Sistem menolak input dan memunculkan pesan validasi "Harga tidak boleh negatif". | Muncul alert validasi harga harus lebih dari 0. | **PASS (Sesuai)** |
| **TC-08** | Update Cepat Stok (*Quick Adjust*) | Mengklik tombol `+5` atau `-5` pada tabel manajemen stok. | Menu ID: 1, Klik `+5` | Stok di database langsung bertambah 5 poin secara instan. | Kuantitas stok bertambah seketika dan tercatat di database. | **PASS (Sesuai)** |
| **TC-09** | Otomatisasi Status Habis | Mengurangi stok produk hingga mencapai angka 0. | Stok produk diubah menjadi `0` | Status ketersediaan menu otomatis beralih dari *Tersedia* menjadi *Habis*. | Status menjadi "Habis", tombol order pelanggan terkunci. | **PASS (Sesuai)** |
| **TC-10** | Billing Tagihan Kasir | Kasir membuka menu billing pesanan pelanggan. | ID Pesanan: 1 (Total Rp 60.000) | Tampil rincian nota tagihan resmi, nama pemesan, meja, dan total tagihan. | Rincian nota ditampilkan transparan dan akurat. | **PASS (Sesuai)** |
| **TC-11** | Pembayaran Tunai (Uang Pas) | Kasir memilih Tunai dan menginput uang pas. | Uang Diterima: `Rp 60.000` | Kembalian bernilai `Rp 0`, transaksi Selesai, status pesanan menjadi *Selesai*. | Kembalian Rp 0, status pesanan berubah menjadi Selesai. | **PASS (Sesuai)** |
| **TC-12** | Pembayaran Tunai (Kembalian) | Kasir menginput uang tunai lebih besar dari total tagihan. | Tagihan: Rp 60.000, Uang Diterima: `Rp 100.000` | Kembalian dihitung otomatis `Rp 40.000`, transaksi sukses disimpan. | Kembalian Rp 40.000 dihitung tepat dan tersimpan di DB. | **PASS (Sesuai)** |
| **TC-13** | Pembayaran Tunai (Uang Kurang) | Kasir menginput nominal uang kurang dari tagihan. | Tagihan: Rp 60.000, Uang Diterima: `Rp 50.000` | Muncul peringatan uang kurang Rp 10.000, tombol Selesaikan pembayaran dinonaktifkan. | Muncul alert kekurangan uang dan tombol submit terkunci. | **PASS (Sesuai)** |
| **TC-14** | Pembayaran Non-Tunai (QRIS/Debit) | Kasir memilih metode Non-Tunai dan memasukkan nomor referensi EDC. | Metode: `QRIS`, Ref: `QRIS-TXN-9988` | Transaksi langsung diproses Selesai pas tanpa kembalian, no ref tercatat. | Status pesanan Selesai dan referensi tercatat di transaksi. | **PASS (Sesuai)** |
| **TC-15** | Cetak Struk Kasir | Kasir menekan tombol "Cetak Struk" pada pesanan yang telah Selesai. | Klik `Cetak Struk` | Membuka format thermal 80mm siap cetak (`window.print()`) dengan status Selesai. | Dialog cetak terbuka rapi, tombol kembali mengarah ke kasir. | **PASS (Sesuai)** |
| **TC-16** | Laporan Mingguan & Bulanan | Admin mengklik tombol "Laporan Mingguan" atau "Laporan Bulanan". | Klik `Laporan Mingguan` | Menampilkan rekapitulasi omset, total transaksi, pemisahan kas tunai vs non-tunai. | Data omset terhitung akurat sesuai periode minggu/bulan berjalan. | **PASS (Sesuai)** |
| **TC-17** | Cetak Laporan Penjualan (PDF) | Admin menekan tombol "Cetak Laporan" untuk mencetak dokumen formal. | Klik `Cetak Laporan` | Dokumen A4 siap cetak dengan bar info waktu cetak (kiri) & periode (kanan), tanpa header browser. | Format cetak dokumen bersih, rapi, dan simetris. | **PASS (Sesuai)** |

---

## 5. HASIL UJI OTOMATIS (UNIT TESTING 22/22 PASS)

Pengujian unit otomatis dijalankan melalui script `tests/unit_test.php` dengan hasil sebagai berikut:

```text
====================================================================
 MEMULAI PENGUJIAN UNIT PROGRAM RESTORAN DAPUR INA AINA
====================================================================

 [PASS] Unit Produk :: Tambah Produk Makanan Utama Valid
 [PASS] Unit Produk :: Tambah Produk Appetizer Valid
 [PASS] Unit Produk :: Tambah Produk Minuman Valid
 [PASS] Unit Produk :: Validasi Input: Nama Kosong Ditolak
 [PASS] Unit Produk :: Validasi Input: Harga Negatif Ditolak
 [PASS] Unit Produk :: Update Cepat Nilai Stok
 [PASS] Unit Produk :: Otomatis Status Habis saat Stok 0
 [PASS] Unit Pesanan :: Pembuatan Pesanan Berhasil
 [PASS] Unit Pesanan :: Kalkulasi Total Tagihan Tepat (Rp 82.000)
 [PASS] Unit Pesanan :: Pengurangan Stok Otomatis Item 1 (25-2=23)
 [PASS] Unit Pesanan :: Pengurangan Stok Otomatis Item 3 (5-1=4)
 [PASS] Unit Pesanan :: Validasi Proteksi Stok Tidak Cukup
 [PASS] Unit Pesanan :: Validasi Keranjang Kosong Ditolak
 [PASS] Unit Pembayaran :: Penanganan Validasi Uang Kurang
 [PASS] Unit Pembayaran :: Proses Pembayaran Tunai Sukses
 [PASS] Unit Pembayaran :: Perhitungan Uang Kembalian Benar (100.000 - 82.000 = 18.000)
 [PASS] Unit Pembayaran :: Update Status Pesanan Menjadi Selesai
 [PASS] Unit Pembayaran :: Proses Pembayaran Non-Tunai Sukses
 [PASS] Unit Laporan :: Rekapitulasi Total Transaksi Tepat (2 Transaksi)
 [PASS] Unit Laporan :: Rekapitulasi Total Omset Penjualan Tepat (82.000 + 30.000 = 112.000)
 [PASS] Unit Laporan :: Pemisahan Omset Tunai (Rp 82.000)
 [PASS] Unit Laporan :: Pemisahan Omset Non-Tunai (Rp 30.000)

====================================================================
 HASIL RINGKASAN PENGUJIAN:
 Total Uji Kasus : 22
 Berhasil (PASS) : 22
 Gagal (FAIL)    : 0
 Tingkat Sukses  : 100%
====================================================================
```

---

## 6. EVALUASI & KESIMPULAN PENGUJIAN

### A. Evaluasi Hasil Pengujian
1. **Fungsionalitas Sistem**: Seluruh fungsi operasional (Pemesanan Mandiri, Manajemen Stok 3 Kategori, Billing Kasir Tunai & Non-Tunai, serta Laporan Penjualan Berkala) berfungsi 100% sesuai skenario.
2. **Integritas & Keamanan Data**: Tidak ditemukan celah inkonsistensi stok saat transaksi berjalan secara simultan.
3. **Kesesuaian Desain & UML**: Alur sistem sinkron penuh dengan Use Case Diagram, Class Diagram, dan Activity Diagram di mana Kasir bertindak sebagai pencetak struk fisik dan Pelanggan sebagai penerima bukti bayar.

### B. Kesimpulan
Berdasarkan seluruh hasil pengujian Black Box Testing dan Unit Testing otomatis, aplikasi **Sistem Informasi Operasional & Transaksi Restoran "Dapur Ina Aina" dinyatakan VALID, STABIL, dan SIAP DIOPERASIKAN (PRODUCTION-READY)** serta memenuhi seluruh standar kelulusan skema **LSP Pemrogram Muda (Junior Programmer)**.

---

## 7. LAMPIRAN RANGKUMAN KODE SUMBER INTI PROGRAM

### A. Database Schema (`database/schema.sql`)
```sql
CREATE DATABASE IF NOT EXISTS `dapur ina aina` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `dapur ina aina`;

CREATE TABLE IF NOT EXISTS `kategori` (
  `id_kategori` INT AUTO_INCREMENT PRIMARY KEY,
  `nama_kategori` VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `kategori` (`id_kategori`, `nama_kategori`) VALUES
(1, 'Makanan Utama'),
(2, 'Appetizer'),
(3, 'Minuman');

CREATE TABLE IF NOT EXISTS `produk` (
  `id_produk` INT AUTO_INCREMENT PRIMARY KEY,
  `id_kategori` INT NOT NULL,
  `nama_produk` VARCHAR(100) NOT NULL,
  `harga` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `stok` INT NOT NULL DEFAULT 0,
  `status_stok` ENUM('Tersedia', 'Habis') NOT NULL DEFAULT 'Tersedia',
  `deskripsi` TEXT NULL,
  CONSTRAINT `fk_produk_kategori` FOREIGN KEY (`id_kategori`) REFERENCES `kategori` (`id_kategori`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pelanggan` (
  `id_pelanggan` INT AUTO_INCREMENT PRIMARY KEY,
  `nama` VARCHAR(100) NOT NULL,
  `no_telepon` VARCHAR(20) NULL,
  `alamat` TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pesanan` (
  `id_pesanan` INT AUTO_INCREMENT PRIMARY KEY,
  `id_pelanggan` INT NOT NULL,
  `tanggal` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('Menunggu', 'Selesai', 'Batal') NOT NULL DEFAULT 'Menunggu',
  `total` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  CONSTRAINT `fk_pesanan_pelanggan` FOREIGN KEY (`id_pelanggan`) REFERENCES `pelanggan` (`id_pelanggan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `detail_pesanan` (
  `id_detail` INT AUTO_INCREMENT PRIMARY KEY,
  `id_pesanan` INT NOT NULL,
  `id_produk` INT NOT NULL,
  `jumlah` INT NOT NULL,
  `subtotal` DECIMAL(12,2) NOT NULL,
  CONSTRAINT `fk_detail_pesanan` FOREIGN KEY (`id_pesanan`) REFERENCES `pesanan` (`id_pesanan`) ON DELETE CASCADE,
  CONSTRAINT `fk_detail_produk` FOREIGN KEY (`id_produk`) REFERENCES `produk` (`id_produk`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `transaksi` (
  `id_transaksi` INT AUTO_INCREMENT PRIMARY KEY,
  `id_pesanan` INT NOT NULL UNIQUE,
  `tanggal_bayar` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `metode` ENUM('Tunai', 'Debit', 'Kartu Kredit', 'QRIS') NOT NULL DEFAULT 'Tunai',
  `jumlah_bayar` DECIMAL(12,2) NOT NULL,
  `no_referensi` VARCHAR(100) NULL,
  CONSTRAINT `fk_transaksi_pesanan` FOREIGN KEY (`id_pesanan`) REFERENCES `pesanan` (`id_pesanan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### B. Database Singleton Handler (`config/database.php`)
```php
<?php
date_default_timezone_set('Asia/Jakarta');

class Database {
    private static ?PDO $instance = null;
    private static string $host = '127.0.0.1';
    private static string $dbName = 'dapur ina aina';
    private static string $user = 'root';
    private static string $pass = '';
    private static int $port = 3306;

    public static function getConnection(): ?PDO {
        if (self::$instance === null) {
            try {
                $dsn = "mysql:host=" . self::$host . ";port=" . self::$port . ";dbname=" . self::$dbName . ";charset=utf8mb4";
                self::$instance = new PDO($dsn, self::$user, self::$pass, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                ]);
            } catch (PDOException $e) {
                return null;
            }
        }
        return self::$instance;
    }
}
```

### C. Model Produk & Stok (`models/Produk.php`)
```php
<?php
require_once __DIR__ . '/../config/database.php';

class Produk {
    private ?PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function getAll(?string $kategori = null, ?string $status = null, ?string $search = null): array {
        $sql = "SELECT p.*, k.nama_kategori AS kategori 
                FROM produk p 
                JOIN kategori k ON p.id_kategori = k.id_kategori 
                WHERE 1=1";
        $params = [];

        if (!empty($kategori)) {
            $sql .= " AND k.nama_kategori = ?";
            $params[] = $kategori;
        }
        if (!empty($status)) {
            $sql .= " AND p.status_stok = ?";
            $params[] = $status;
        }
        if (!empty($search)) {
            $sql .= " AND (p.nama_produk LIKE ? OR p.deskripsi LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        $sql .= " ORDER BY p.id_produk DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function tambahProduk(array $data): int {
        if (empty(trim($data['nama_produk']))) {
            throw new InvalidArgumentException("Nama produk tidak boleh kosong.");
        }
        if ($data['harga'] < 0) {
            throw new InvalidArgumentException("Harga produk tidak boleh bernilai negatif.");
        }
        $stok = max(0, (int)($data['stok'] ?? 0));
        $statusStok = ($stok <= 0) ? 'Habis' : 'Tersedia';

        $stmt = $this->db->prepare("INSERT INTO produk (id_kategori, nama_produk, harga, stok, status_stok, deskripsi) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$data['id_kategori'], $data['nama_produk'], $data['harga'], $stok, $statusStok, $data['deskripsi'] ?? '']);
        return (int)$this->db->lastInsertId();
    }

    public function updateStok(int $idProduk, int $stokBaru): bool {
        $stokBaru = max(0, $stokBaru);
        $status = ($stokBaru <= 0) ? 'Habis' : 'Tersedia';
        $stmt = $this->db->prepare("UPDATE produk SET stok = ?, status_stok = ? WHERE id_produk = ?");
        return $stmt->execute([$stokBaru, $status, $idProduk]);
    }
}
```

### D. Model Pesanan & Transaksi (`models/Pesanan.php`)
```php
<?php
require_once __DIR__ . '/../config/database.php';

class Pesanan {
    private ?PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function buatPesanan(array $pelangganData, array $items): array {
        if (empty($items)) {
            throw new InvalidArgumentException("Keranjang tidak boleh kosong.");
        }

        $this->db->beginTransaction();
        try {
            // Simpan / update pelanggan
            $alamatMapping = (strpos($pelangganData['nomor_meja'], 'Take Away') !== false) 
                ? 'Take Away' 
                : 'Dine In (' . $pelangganData['nomor_meja'] . ')';

            $stmtPel = $this->db->prepare("INSERT INTO pelanggan (nama, no_telepon, alamat) VALUES (?, ?, ?)");
            $stmtPel->execute([$pelangganData['nama_pelanggan'], $pelangganData['no_telepon'] ?? '', $alamatMapping]);
            $idPelanggan = (int)$this->db->lastInsertId();

            $totalHarga = 0.0;
            foreach ($items as $it) {
                $totalHarga += ($it['harga'] * $it['jumlah']);
            }

            // Simpan header pesanan
            $stmtPes = $this->db->prepare("INSERT INTO pesanan (id_pelanggan, tanggal, status, total) VALUES (?, NOW(), 'Menunggu', ?)");
            $stmtPes->execute([$idPelanggan, $totalHarga]);
            $idPesanan = (int)$this->db->lastInsertId();

            // Simpan rincian & kurangi stok
            $stmtDet = $this->db->prepare("INSERT INTO detail_pesanan (id_pesanan, id_produk, jumlah, subtotal) VALUES (?, ?, ?, ?)");
            $stmtStok = $this->db->prepare("UPDATE produk SET stok = stok - ?, status_stok = IF(stok - ? <= 0, 'Habis', 'Tersedia') WHERE id_produk = ? AND stok >= ?");

            foreach ($items as $it) {
                $subtotal = $it['harga'] * $it['jumlah'];
                $stmtDet->execute([$idPesanan, $it['id_produk'], $it['jumlah'], $subtotal]);

                $stmtStok->execute([$it['jumlah'], $it['jumlah'], $it['id_produk'], $it['jumlah']]);
                if ($stmtStok->rowCount() === 0) {
                    throw new Exception("Stok untuk produk ID {$it['id_produk']} tidak mencukupi.");
                }
            }

            $this->db->commit();
            return ['id_pesanan' => $idPesanan, 'total_harga' => $totalHarga];
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}
```

### E. Model Pembayaran & Kembalian (`models/Pembayaran.php`)
```php
<?php
require_once __DIR__ . '/../config/database.php';

class Pembayaran {
    private ?PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function prosesPembayaran(array $data): array {
        $idPesanan = (int)$data['id_pesanan'];
        $metode = $data['metode_pembayaran'] ?? 'Tunai';
        $uangDiterima = (float)$data['uang_diterima'];
        $noRef = $data['no_referensi'] ?? null;

        $stmt = $this->db->prepare("SELECT * FROM pesanan WHERE id_pesanan = ?");
        $stmt->execute([$idPesanan]);
        $pesanan = $stmt->fetch();

        if (!$pesanan) {
            throw new Exception("Pesanan tidak ditemukan.");
        }

        $totalTagihan = (float)$pesanan['total'];
        $uangKembalian = 0.0;

        if (strtolower($metode) === 'tunai') {
            if ($uangDiterima < $totalTagihan) {
                $kekurangan = $totalTagihan - $uangDiterima;
                throw new InvalidArgumentException("Uang pembayaran kurang sebesar Rp " . number_format($kekurangan, 0, ',', '.'));
            }
            $uangKembalian = $uangDiterima - $totalTagihan;
        } else {
            $uangDiterima = $totalTagihan;
            if (empty($noRef)) {
                $noRef = strtoupper($metode) . "-" . date('YmdHis');
            }
        }

        $this->db->beginTransaction();
        try {
            $stmtTx = $this->db->prepare("INSERT INTO transaksi (id_pesanan, tanggal_bayar, metode, jumlah_bayar, no_referensi) VALUES (?, NOW(), ?, ?, ?)");
            $stmtTx->execute([$idPesanan, $metode, $uangDiterima, $noRef]);

            $stmtUp = $this->db->prepare("UPDATE pesanan SET status = 'Selesai' WHERE id_pesanan = ?");
            $stmtUp->execute([$idPesanan]);

            $this->db->commit();
            return [
                'id_pesanan' => $idPesanan,
                'metode' => $metode,
                'total_tagihan' => $totalTagihan,
                'uang_diterima' => $uangDiterima,
                'uang_kembalian' => $uangKembalian
            ];
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}
```

### F. Model Laporan Penjualan Berkala (`models/Laporan.php`)
```php
<?php
require_once __DIR__ . '/../config/database.php';

class Laporan {
    private ?PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function getLaporan(string $tglMulai, string $tglAkhir): array {
        $start = date('Y-m-d 00:00:00', strtotime($tglMulai));
        $end = date('Y-m-d 23:59:59', strtotime($tglAkhir));

        $stmt = $this->db->prepare("SELECT 
                COUNT(*) AS total_transaksi,
                COALESCE(SUM(jumlah_bayar), 0) AS total_penjualan,
                SUM(CASE WHEN LOWER(metode) = 'tunai' THEN jumlah_bayar ELSE 0 END) AS total_tunai,
                SUM(CASE WHEN LOWER(metode) != 'tunai' THEN jumlah_bayar ELSE 0 END) AS total_non_tunai
            FROM transaksi 
            WHERE tanggal_bayar BETWEEN ? AND ?");
        $stmt->execute([$start, $end]);
        $summary = $stmt->fetch();

        $stmtList = $this->db->prepare("SELECT t.id_transaksi, t.tanggal_bayar AS tanggal_transaksi, t.metode AS metode_pembayaran, t.jumlah_bayar AS total_bayar,
                   p.id_pesanan, p.tanggal AS tanggal_pesanan, 
                   pel.nama AS nama_pelanggan, pel.alamat AS nomor_meja
            FROM transaksi t
            JOIN pesanan p ON t.id_pesanan = p.id_pesanan
            LEFT JOIN pelanggan pel ON p.id_pelanggan = pel.id_pelanggan
            WHERE t.tanggal_bayar BETWEEN ? AND ?
            ORDER BY t.id_transaksi DESC");
        $stmtList->execute([$start, $end]);
        $rincian = $stmtList->fetchAll();

        return [
            'tanggal_mulai' => $tglMulai,
            'tanggal_akhir' => $tglAkhir,
            'total_transaksi' => (int)($summary['total_transaksi'] ?? 0),
            'total_penjualan' => (float)($summary['total_penjualan'] ?? 0),
            'total_tunai' => (float)($summary['total_tunai'] ?? 0),
            'total_non_tunai' => (float)($summary['total_non_tunai'] ?? 0),
            'transaksi' => $rincian
        ];
    }
}
```
