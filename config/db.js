/**
 * Smart Universal Database Engine (PostgreSQL -> SQLite -> Pure JS In-Memory Fallback)
 * Restoran Dapur Ina Aina
 */
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
require('dotenv').config();

let isUsingPostgres = false;
let isUsingSqlite = false;
let pgPool = null;
let sqliteDb = null;

const isProduction = process.env.NODE_ENV === 'production';

// Safe SQLite3 Loader (Prevents Vercel GLIBC native binary crashes)
let sqlite3 = null;
function getSqliteModule() {
    if (sqlite3 === null) {
        try {
            sqlite3 = require('sqlite3').verbose();
        } catch (e) {
            console.warn('⚠️ SQLite native binary is not supported in this runtime (GLIBC). Falling back to Universal JS Engine.');
            sqlite3 = false;
        }
    }
    return sqlite3;
}

// Inisialisasi PostgreSQL Pool
if (process.env.DATABASE_URL) {
    pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: isProduction || process.env.DATABASE_URL.includes('render.com') || process.env.DATABASE_URL.includes('railway.app') || process.env.DATABASE_URL.includes('supabase.co') || process.env.DATABASE_URL.includes('neon.tech')
            ? { rejectUnauthorized: false }
            : false,
        connectionTimeoutMillis: 3000
    });
} else {
    pgPool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'dapur_ina_db',
        ssl: isProduction ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 3000
    });
}

// Inisialisasi SQLite Database Helper
function getSqliteDb() {
    const mod = getSqliteModule();
    if (!mod) return null;

    if (!sqliteDb) {
        let dbPath = path.join(__dirname, '..', 'database', 'dapur_ina.sqlite');
        if (process.env.VERCEL) {
            dbPath = path.join('/tmp', 'dapur_ina.sqlite');
        }
        try {
            sqliteDb = new mod.Database(dbPath);
        } catch (err) {
            console.warn('SQLite init error, falling back:', err.message);
            sqliteDb = null;
        }
    }
    return sqliteDb;
}

// =========================================================================
// 16 VERIFIED HIGH-RESOLUTION SAMPLE PRODUCTS (100% Matching, Delicious)
// =========================================================================
const initialSampleProducts = [
    // 1. Makanan Utama
    {
        id_produk: 1,
        nama_produk: 'Nasi Goreng Spesial Dapur Ina',
        kategori: 'Makanan Utama',
        harga: 25000,
        stok: 50,
        status_stok: 'Tersedia',
        deskripsi: 'Nasi goreng bumbu racikan khas dengan suwiran ayam, telur, acar wortel mentimun, dan kerupuk renyah.',
        gambar: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80',
        id_admin: 1
    },
    {
        id_produk: 2,
        nama_produk: 'Mie Goreng Seafood Spesial',
        kategori: 'Makanan Utama',
        harga: 30000,
        stok: 25,
        status_stok: 'Tersedia',
        deskripsi: 'Mie telur kenyal dimasak wajan panas bersama udang windu segar, cumi kenyal, sayuran hijau, dan bumbu gurih lezat.',
        gambar: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80',
        id_admin: 1
    },
    {
        id_produk: 3,
        nama_produk: 'Ayam Goreng Sambal Ina',
        kategori: 'Makanan Utama',
        harga: 28000,
        stok: 45,
        status_stok: 'Tersedia',
        deskripsi: 'Ayam goreng empuk bumbu rempah kuning gurih garing keemasan, disajikan hangat dengan sambal terasi pedas mantap.',
        gambar: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80',
        id_admin: 1
    },
    {
        id_produk: 4,
        nama_produk: 'Ayam Panggang Madu Rempah',
        kategori: 'Makanan Utama',
        harga: 35000,
        stok: 3,
        status_stok: 'Menipis',
        deskripsi: 'Ayam panggang oven bumbu madu kecap rempah legit, meresap harum disajikan dengan cocolan sambal khas.',
        gambar: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=600&q=80',
        id_admin: 1
    },
    {
        id_produk: 5,
        nama_produk: 'Sate Ayam Bumbu Kacang Madura',
        kategori: 'Makanan Utama',
        harga: 28000,
        stok: 35,
        status_stok: 'Tersedia',
        deskripsi: 'Tusukan daging ayam empuk dibakar arang wangi, disajikan hangat dengan siraman bumbu kacang gurih dan irisan bawang.',
        gambar: 'https://images.unsplash.com/photo-1772855386828-a18ff9a12584?auto=format&fit=crop&w=600&q=80',
        id_admin: 1
    },
    {
        id_produk: 6,
        nama_produk: 'Soto Ayam Kuah Santan Rempah',
        kategori: 'Makanan Utama',
        harga: 32000,
        stok: 20,
        status_stok: 'Tersedia',
        deskripsi: 'Kuah kuning santan gurih kaya rempah tradisional disajikan lengkap dengan suwiran ayam, soun, nasi hangat, sambal, dan jeruk nipis.',
        gambar: 'https://images.unsplash.com/photo-1572656631137-7935297eff55?auto=format&fit=crop&w=600&q=80',
        id_admin: 1
    },
    {
        id_produk: 7,
        nama_produk: 'Mie Kuah Seafood Telur Spesial',
        kategori: 'Makanan Utama',
        harga: 32000,
        stok: 20,
        status_stok: 'Tersedia',
        deskripsi: 'Mie kuah hangat berkaldu gurih disajikan dengan udang windu manis, telur setengah matang, dan sayuran hijau segar.',
        gambar: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
        id_admin: 1
    },

    // 2. Appetizer
    {
        id_produk: 8,
        nama_produk: 'Lumpia Goreng Semarang Renyah (4 pcs)',
        kategori: 'Appetizer',
        harga: 18000,
        stok: 40,
        status_stok: 'Tersedia',
        deskripsi: 'Kulit lumpia renyah keemasan dengan isian rebung manis, ayam, dan telur, disajikan hangat dengan saus cocolan khas.',
        gambar: 'https://images.unsplash.com/photo-1515022376298-7333f33e704b?auto=format&fit=crop&w=600&q=80',
        id_admin: 1
    },
    {
        id_produk: 9,
        nama_produk: 'Pastel Goreng Segitiga Renyah (4 pcs)',
        kategori: 'Appetizer',
        harga: 16000,
        stok: 30,
        status_stok: 'Tersedia',
        deskripsi: 'Kulit pastry berlapis renyah dengan isian sayur bumbu rempah kari gurih, disajikan dengan cabai rawit hijau segar.',
        gambar: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
        id_admin: 1
    },
    {
        id_produk: 10,
        nama_produk: 'Dimsum Siomay Ayam Kukus (4 pcs)',
        kategori: 'Appetizer',
        harga: 20000,
        stok: 35,
        status_stok: 'Tersedia',
        deskripsi: 'Olahan daging ayam dan udang lembut gurih dibungkus kulit tipis, dikukus hangat disajikan dengan saus cocolan nikmat.',
        gambar: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=600&q=80',
        id_admin: 1
    },
    {
        id_produk: 11,
        nama_produk: 'Ayam Popcorn Crispy Gurih',
        kategori: 'Appetizer',
        harga: 22000,
        stok: 30,
        status_stok: 'Tersedia',
        deskripsi: 'Fillet ayam dipotong dadu dibalut tepung berbumbu gurih renyah, camilan lezat dengan cocolan saus mayones spesial.',
        gambar: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80',
        id_admin: 1
    },

    // 3. Minuman
    {
        id_produk: 12,
        nama_produk: 'Es Lemon Tea Segar',
        kategori: 'Minuman',
        harga: 8000,
        stok: 100,
        status_stok: 'Tersedia',
        deskripsi: 'Seduhan daun teh pilihan berpadu irisan lemon segar dan daun mint dengan es batu kristal pelepas dahaga.',
        gambar: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80',
        id_admin: 1
    },
    {
        id_produk: 13,
        nama_produk: 'Es Jeruk Peras Murni',
        kategori: 'Minuman',
        harga: 10000,
        stok: 80,
        status_stok: 'Tersedia',
        deskripsi: 'Jeruk peras manis segar kaya vitamin C murni tanpa pemanis buatan, disajikan dingin menyegarkan.',
        gambar: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80',
        id_admin: 1
    },
    {
        id_produk: 14,
        nama_produk: 'Kopi Susu Gula Aren Ina',
        kategori: 'Minuman',
        harga: 18000,
        stok: 50,
        status_stok: 'Tersedia',
        deskripsi: 'Perpaduan espresso kopi aromatik pilihan, susu segar lembut gurih, dan manis legit gula aren murni.',
        gambar: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
        id_admin: 1
    },
    {
        id_produk: 15,
        nama_produk: 'Es Jeruk Nipis Mint Squash',
        kategori: 'Minuman',
        harga: 12000,
        stok: 60,
        status_stok: 'Tersedia',
        deskripsi: 'Perasan jeruk nipis segar berpadu daun mint dan soda dingin kristal, memberikan sensasi asam segar yang melegakan.',
        gambar: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
        id_admin: 1
    },
    {
        id_produk: 16,
        nama_produk: 'Jus Mangga Tropis Segar',
        kategori: 'Minuman',
        harga: 18000,
        stok: 40,
        status_stok: 'Tersedia',
        deskripsi: 'Daging mangga manis harum diblend lembut kental, kaya nutrisi dan kesegaran buah tropis alami.',
        gambar: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?auto=format&fit=crop&w=600&q=80',
        id_admin: 1
    }
];

// ==========================================
// PURE JAVASCRIPT IN-MEMORY DATABASE ENGINE
// ==========================================
const memoryDb = {
    administrator: [
        {
            id_admin: 1,
            nama: 'Administrator Dapur Ina',
            email: 'admin@dapurina.com',
            // bcrypt hash of 'admin123'
            password: '$2a$10$w8TfJ3jCqLhD0kS6hPq1yO91fO2P6Ld4YqP1k8V3U5j9s.9J5lF7y',
            created_at: new Date().toISOString()
        }
    ],
    pelanggan: [],
    produk: [...initialSampleProducts],
    pesanan: [],
    detail_pesanan: [],
    laporan_penjualan: [],
    transaksi: [],
    autoInc: {
        administrator: 2,
        pelanggan: 1,
        produk: 17,
        pesanan: 1,
        detail_pesanan: 1,
        laporan_penjualan: 1,
        transaksi: 1
    }
};

function runMemoryQuery(sql, params = []) {
    const trimmed = sql.trim();
    const lower = trimmed.toLowerCase();

    // 1. SELECT COUNT
    if (lower.includes('count(')) {
        let tableName = 'administrator';
        if (lower.includes('from administrator')) tableName = 'administrator';
        else if (lower.includes('from produk')) tableName = 'produk';
        else if (lower.includes('from pesanan')) tableName = 'pesanan';
        else if (lower.includes('from pelanggan')) tableName = 'pelanggan';
        else if (lower.includes('from transaksi')) tableName = 'transaksi';
        else if (lower.includes('from laporan_penjualan')) tableName = 'laporan_penjualan';

        let list = [...(memoryDb[tableName] || [])];
        return Promise.resolve({ rows: [{ count: list.length, count_admin: list.length }], rowCount: 1 });
    }

    // 2. SELECT PRODUK
    if (lower.startsWith('select') && lower.includes('from produk')) {
        let rows = [...memoryDb.produk];
        // filter by exact name
        if (lower.includes('nama_produk =')) {
            const nameVal = params[0];
            rows = rows.filter(r => (r.nama_produk || '').toLowerCase() === String(nameVal).toLowerCase());
        }
        // filter by category
        if (lower.includes('lower(p.kategori) = lower(') || lower.includes('p.kategori =') || lower.includes('kategori =')) {
            const cat = params[0];
            if (cat) rows = rows.filter(r => (r.kategori || '').toLowerCase() === String(cat).toLowerCase());
        }
        // filter by id
        if (lower.includes('id_produk =')) {
            const idVal = params[0];
            rows = rows.filter(r => String(r.id_produk) === String(idVal));
        }
        // filter by search
        if (lower.includes('ilike') || lower.includes('like')) {
            const sParam = params.find(p => typeof p === 'string' && p.startsWith('%') && p.endsWith('%'));
            if (sParam) {
                const kw = sParam.replace(/%/g, '').toLowerCase();
                rows = rows.filter(r => (r.nama_produk || '').toLowerCase().includes(kw) || (r.deskripsi || '').toLowerCase().includes(kw));
            }
        }
        // filter low stock
        if (lower.includes('stok <= 5') || lower.includes("status_stok = 'habis'")) {
            rows = rows.filter(r => Number(r.stok) <= 5 || r.status_stok === 'Habis');
        }
        rows.sort((a, b) => b.id_produk - a.id_produk);
        return Promise.resolve({ rows, rowCount: rows.length });
    }

    // 3. SELECT ADMINISTRATOR
    if (lower.startsWith('select') && lower.includes('from administrator')) {
        let rows = [...memoryDb.administrator];
        if (lower.includes('email') && params.length > 0) {
            rows = rows.filter(r => (r.email || '').toLowerCase() === String(params[0]).toLowerCase());
        }
        if (lower.includes('id_admin =') && params.length > 0) {
            rows = rows.filter(r => String(r.id_admin) === String(params[0]));
        }
        return Promise.resolve({ rows, rowCount: rows.length });
    }

    // 4. SELECT PESANAN & DETAIL (WITH JOINS)
    if (lower.startsWith('select') && lower.includes('from pesanan')) {
        let rows = memoryDb.pesanan.map(p => {
            const cust = memoryDb.pelanggan.find(c => String(c.id_pelanggan) === String(p.id_pelanggan)) || {};
            const trx = memoryDb.transaksi.find(t => String(t.id_pesanan) === String(p.id_pesanan)) || {};
            const items = memoryDb.detail_pesanan.filter(d => String(d.id_pesanan) === String(p.id_pesanan));
            const totalItem = items.reduce((sum, it) => sum + (parseInt(it.jumlah, 10) || 1), 0);
            const rincianMenu = items.map(it => {
                const pr = memoryDb.produk.find(prod => String(prod.id_produk) === String(it.id_produk)) || {};
                return `${pr.nama_produk || 'Item'} (${it.jumlah})`;
            }).join(', ');

            return {
                ...p,
                waktu_pesan: p.tanggal || p.created_at,
                total_harga: parseFloat(p.total) || 0,
                status_pesanan: p.status || 'Menunggu',
                nomor_meja: p.nomor_meja || 'Meja 01',
                catatan: p.catatan || '',
                snap_token: p.snap_token || '',
                metode_pilihan: p.metode_pembayaran || 'tunai',
                id_pelanggan: cust.id_pelanggan || p.id_pelanggan,
                nama_pelanggan: cust.nama || p.nama_pelanggan || `Pelanggan ${p.nomor_meja || 'Meja 01'}`,
                no_telepon: cust.no_telepon || p.no_telepon || '-',
                alamat: cust.alamat || p.alamat || 'Dine In',
                id_transaksi: trx.id_transaksi || null,
                tanggal_bayar: trx.tanggal_bayar || null,
                metode_pembayaran: trx.metode || p.metode_pembayaran || 'tunai',
                jumlah_bayar: parseFloat(trx.jumlah_bayar) || 0,
                uang_diterima: parseFloat(trx.uang_diterima) || 0,
                uang_kembalian: parseFloat(trx.uang_kembalian) || 0,
                no_referensi: trx.no_referensi || '',
                status_transaksi: trx.status || 'Menunggu',
                total_item: totalItem,
                rincian_menu: rincianMenu
            };
        });

        if (lower.includes('id_pesanan =') && params.length > 0) {
            rows = rows.filter(r => String(r.id_pesanan) === String(params[0]));
        }
        rows.sort((a, b) => b.id_pesanan - a.id_pesanan);
        return Promise.resolve({ rows, rowCount: rows.length });
    }

    if (lower.startsWith('select') && lower.includes('from detail_pesanan')) {
        let rows = memoryDb.detail_pesanan.map(d => {
            const prod = memoryDb.produk.find(pr => String(pr.id_produk) === String(d.id_produk)) || {};
            return {
                ...d,
                nama_produk: prod.nama_produk || 'Menu Hidangan',
                kategori: prod.kategori || 'Makanan',
                gambar: prod.gambar || 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80',
                harga: parseFloat(d.harga) || parseFloat(prod.harga) || 0,
                subtotal: parseFloat(d.subtotal) || (parseFloat(d.harga || prod.harga || 0) * (d.jumlah || 1))
            };
        });

        if (lower.includes('id_pesanan =') && params.length > 0) {
            rows = rows.filter(r => String(r.id_pesanan) === String(params[0]));
        }
        return Promise.resolve({ rows, rowCount: rows.length });
    }

    // 5. INSERT INTO
    if (lower.startsWith('insert into')) {
        let tableName = 'administrator';
        if (lower.includes('into administrator')) tableName = 'administrator';
        else if (lower.includes('into produk')) tableName = 'produk';
        else if (lower.includes('into pesanan')) tableName = 'pesanan';
        else if (lower.includes('into pelanggan')) tableName = 'pelanggan';
        else if (lower.includes('into detail_pesanan')) tableName = 'detail_pesanan';
        else if (lower.includes('into transaksi')) tableName = 'transaksi';
        else if (lower.includes('into laporan_penjualan')) tableName = 'laporan_penjualan';

        const newId = memoryDb.autoInc[tableName]++;
        let idCol = 'id_' + tableName.replace(/s$/, '');
        if (tableName === 'administrator') idCol = 'id_admin';
        if (tableName === 'produk') idCol = 'id_produk';
        if (tableName === 'pesanan') idCol = 'id_pesanan';
        if (tableName === 'pelanggan') idCol = 'id_pelanggan';
        if (tableName === 'transaksi') idCol = 'id_transaksi';
        if (tableName === 'detail_pesanan') idCol = 'id_detail';
        if (tableName === 'laporan_penjualan') idCol = 'id_laporan';

        let newRow = { [idCol]: newId, created_at: new Date().toISOString() };

        if (tableName === 'administrator') {
            newRow.nama = params[0];
            newRow.email = params[1];
            newRow.password = params[2];
        } else if (tableName === 'produk') {
            newRow.nama_produk = params[0];
            newRow.kategori = params[1];
            newRow.harga = parseFloat(params[2]) || 0;
            newRow.stok = parseInt(params[3], 10) || 0;
            newRow.status_stok = params[4] || 'Tersedia';
            newRow.deskripsi = params[5] || '';
            newRow.gambar = params[6] || '';
            newRow.id_admin = params[7] || 1;
        } else if (tableName === 'pelanggan') {
            newRow.nama = params[0];
            newRow.no_telepon = params[1];
            newRow.alamat = params[2];
        } else if (tableName === 'pesanan') {
            // INSERT INTO pesanan (id_pelanggan, tanggal, total, status, nomor_meja, catatan, metode_pembayaran) VALUES ($1, NOW(), $2, 'Menunggu', $3, $4, $5)
            newRow.id_pelanggan = params[0];
            newRow.total = parseFloat(params[1]) || 0;
            newRow.status = 'Menunggu';
            newRow.nomor_meja = params[2] || 'Meja 01';
            newRow.catatan = params[3] || '';
            newRow.metode_pembayaran = params[4] || 'tunai';
            newRow.snap_token = '';
            newRow.tanggal = new Date().toISOString();
        } else if (tableName === 'detail_pesanan') {
            newRow.id_pesanan = params[0];
            newRow.id_produk = params[1];
            newRow.jumlah = parseInt(params[2], 10) || 1;
            newRow.harga = parseFloat(params[3]) || 0;
            newRow.subtotal = parseFloat(params[4]) || (newRow.jumlah * newRow.harga);
        } else if (tableName === 'transaksi') {
            newRow.id_pesanan = params[0];
            newRow.id_laporan = params[1] || null;
            newRow.metode = params[2] || 'tunai';
            newRow.jumlah_bayar = parseFloat(params[3]) || 0;
            newRow.uang_diterima = parseFloat(params[4]) || 0;
            newRow.uang_kembalian = parseFloat(params[5]) || 0;
            newRow.no_referensi = params[6] || '';
            newRow.status = params[7] || 'Selesai';
            newRow.tanggal_bayar = new Date().toISOString();
        }

        memoryDb[tableName].push(newRow);
        return Promise.resolve({ rows: [newRow], rowCount: 1, lastInsertId: newId });
    }

    // 6. UPDATE
    if (lower.startsWith('update')) {
        let tableName = 'produk';
        if (lower.includes('update administrator')) tableName = 'administrator';
        else if (lower.includes('update produk')) tableName = 'produk';
        else if (lower.includes('update pesanan')) tableName = 'pesanan';
        else if (lower.includes('update transaksi')) tableName = 'transaksi';

        let idParam = params[params.length - 1];
        let found = memoryDb[tableName].find(r => String(r['id_' + tableName] || r['id_admin'] || r['id_produk'] || r['id_pesanan']) === String(idParam));
        if (found) {
            if (tableName === 'pesanan') {
                if (lower.includes('snap_token =')) {
                    found.snap_token = params[0];
                }
                if (lower.includes('status =')) {
                    found.status = params[0];
                }
            } else if (tableName === 'produk') {
                if (lower.includes('set stok =')) {
                    found.stok = parseInt(params[0], 10) || 0;
                    found.status_stok = params[1];
                }
            }
        }
        return Promise.resolve({ rows: found ? [found] : [], rowCount: found ? 1 : 0 });
    }

    // 7. DELETE
    if (lower.startsWith('delete')) {
        let tableName = 'produk';
        if (lower.includes('from produk')) tableName = 'produk';
        else if (lower.includes('from detail_pesanan')) tableName = 'detail_pesanan';
        if (params.length > 0) {
            const delId = params[0];
            memoryDb[tableName] = memoryDb[tableName].filter(r => String(r.id_produk || r.id_detail) !== String(delId));
        }
        return Promise.resolve({ rows: [], rowCount: 1 });
    }

    // Generic fallback
    return Promise.resolve({ rows: [], rowCount: 0 });
}

// Helper Query Universal
function runSqlite(sql, params = []) {
    const db = getSqliteDb();
    if (!db) {
        return runMemoryQuery(sql, params);
    }

    return new Promise((resolve, reject) => {
        const trimmed = sql.trim().toLowerCase();

        // Convert Postgres $1, $2 to SQLite ?
        let convertedSql = sql.replace(/\$(\d+)/g, '?');
        convertedSql = convertedSql.replace(/ILIKE/gi, 'LIKE');
        convertedSql = convertedSql.replace(/GREATEST\(0,\s*([^)]+)\)/gi, 'CASE WHEN ($1) < 0 THEN 0 ELSE ($1) END');
        convertedSql = convertedSql.replace(/string_agg\(([^,]+),\s*([^)]+)\)/gi, 'GROUP_CONCAT($1, $2)');
        convertedSql = convertedSql.replace(/FOR\s+UPDATE/gi, '');
        convertedSql = convertedSql.replace(/CURRENT_DATE/gi, "date('now', 'localtime')");
        convertedSql = convertedSql.replace(/NOW\(\)/gi, "datetime('now', 'localtime')");

        if (trimmed.startsWith('select') || trimmed.startsWith('pragma')) {
            db.all(convertedSql, params, (err, rows) => {
                if (err) return reject(err);
                resolve({ rows: rows || [], rowCount: rows ? rows.length : 0 });
            });
        } else {
            const hasReturning = /RETURNING\s+(.+)$/i.test(convertedSql);
            if (hasReturning) {
                convertedSql = convertedSql.replace(/RETURNING\s+.+$/i, '');
            }

            db.run(convertedSql, params, function (err) {
                if (err) return reject(err);
                const lastId = this.lastID;
                const changes = this.changes;

                if (hasReturning && lastId) {
                    let tableName = '';
                    if (trimmed.startsWith('insert into')) {
                        const m = convertedSql.match(/INSERT\s+INTO\s+([^\s(]+)/i);
                        if (m) tableName = m[1];
                    } else if (trimmed.startsWith('update')) {
                        const m = convertedSql.match(/UPDATE\s+([^\s]+)/i);
                        if (m) tableName = m[1];
                    }

                    if (tableName) {
                        let idCol = 'id_' + tableName.replace(/s$/, '');
                        if (tableName === 'administrator') idCol = 'id_admin';
                        if (tableName === 'produk') idCol = 'id_produk';
                        if (tableName === 'pesanan') idCol = 'id_pesanan';
                        if (tableName === 'pelanggan') idCol = 'id_pelanggan';
                        if (tableName === 'transaksi') idCol = 'id_transaksi';
                        if (tableName === 'detail_pesanan') idCol = 'id_detail';
                        if (tableName === 'laporan_penjualan') idCol = 'id_laporan';

                        const checkSql = `SELECT * FROM ${tableName} WHERE rowid = ? OR ${idCol} = ?`;
                        db.get(checkSql, [lastId, lastId], (err2, row) => {
                            resolve({
                                rows: row ? [row] : [{ [idCol]: lastId }],
                                rowCount: changes,
                                lastInsertId: lastId
                            });
                        });
                        return;
                    }
                }

                resolve({ rows: [], rowCount: changes, lastInsertId: lastId });
            });
        }
    });
}

/**
 * Universal Query Function
 */
async function query(text, params = []) {
    if (isUsingPostgres && pgPool) {
        try {
            return await pgPool.query(text, params);
        } catch (err) {
            console.error('PostgreSQL Query Error:', err.message);
            throw err;
        }
    } else {
        return await runSqlite(text, params);
    }
}

/**
 * Universal Client/Transaction Manager
 */
const pool = {
    async connect() {
        if (isUsingPostgres && pgPool) {
            return await pgPool.connect();
        } else {
            return {
                async query(sql, params = []) {
                    if (sql.trim().toUpperCase() === 'BEGIN') {
                        return await runSqlite('BEGIN TRANSACTION');
                    }
                    if (sql.trim().toUpperCase() === 'COMMIT') {
                        return await runSqlite('COMMIT');
                    }
                    if (sql.trim().toUpperCase() === 'ROLLBACK') {
                        return await runSqlite('ROLLBACK');
                    }
                    return await runSqlite(sql, params);
                },
                release() { }
            };
        }
    },
    query
};

/**
 * Inisialisasi Skema & Data Awal
 */
async function initDatabase() {
    console.log('Memeriksa Konektivitas Database...');

    if (process.env.DATABASE_URL) {
        try {
            const client = await pgPool.connect();
            isUsingPostgres = true;
            console.log('Terhubung ke Database PostgreSQL Cloud!');

            const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
            if (fs.existsSync(schemaPath)) {
                const schemaSql = fs.readFileSync(schemaPath, 'utf8');
                await client.query(schemaSql);
            }
            client.release();
        } catch (pgErr) {
            console.warn('Gagal koneksi PostgreSQL, beralih ke SQLite / Memory Engine:', pgErr.message);
            isUsingPostgres = false;
        }
    } else {
        isUsingPostgres = false;
    }

    if (!isUsingPostgres) {
        console.log('Menggunakan Database Internal SQLite / Memory Engine.');

        const db = getSqliteDb();
        if (db) {
            await new Promise((res, rej) => {
            db.serialize(() => {
                db.run(`CREATE TABLE IF NOT EXISTS administrator (
                    id_admin INTEGER PRIMARY KEY AUTOINCREMENT,
                    nama TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                db.run(`CREATE TABLE IF NOT EXISTS pelanggan (
                    id_pelanggan INTEGER PRIMARY KEY AUTOINCREMENT,
                    nama TEXT NOT NULL,
                    no_telepon TEXT DEFAULT '-',
                    alamat TEXT DEFAULT 'Dine In',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                db.run(`CREATE TABLE IF NOT EXISTS produk (
                    id_produk INTEGER PRIMARY KEY AUTOINCREMENT,
                    nama_produk TEXT NOT NULL,
                    kategori TEXT NOT NULL,
                    harga REAL NOT NULL DEFAULT 0,
                    stok INTEGER NOT NULL DEFAULT 0,
                    status_stok TEXT NOT NULL DEFAULT 'Tersedia',
                    deskripsi TEXT DEFAULT '',
                    gambar TEXT DEFAULT '',
                    id_admin INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                db.run(`CREATE TABLE IF NOT EXISTS pesanan (
                    id_pesanan INTEGER PRIMARY KEY AUTOINCREMENT,
                    id_pelanggan INTEGER,
                    tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
                    total REAL NOT NULL DEFAULT 0,
                    status TEXT NOT NULL DEFAULT 'Menunggu',
                    nomor_meja TEXT DEFAULT 'Meja 01',
                    catatan TEXT DEFAULT '',
                    snap_token TEXT DEFAULT ''
                )`);

                db.run(`CREATE TABLE IF NOT EXISTS detail_pesanan (
                    id_detail INTEGER PRIMARY KEY AUTOINCREMENT,
                    id_pesanan INTEGER NOT NULL,
                    id_produk INTEGER,
                    jumlah INTEGER NOT NULL DEFAULT 1,
                    harga REAL NOT NULL DEFAULT 0,
                    subtotal REAL NOT NULL DEFAULT 0
                )`);

                db.run(`CREATE TABLE IF NOT EXISTS laporan_penjualan (
                    id_laporan INTEGER PRIMARY KEY AUTOINCREMENT,
                    jenis_periode TEXT NOT NULL,
                    tanggal_mulai DATE NOT NULL,
                    tanggal_akhir DATE NOT NULL,
                    total_transaksi INTEGER NOT NULL DEFAULT 0,
                    total_penjualan REAL NOT NULL DEFAULT 0,
                    id_admin INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                db.run(`CREATE TABLE IF NOT EXISTS transaksi (
                    id_transaksi INTEGER PRIMARY KEY AUTOINCREMENT,
                    id_pesanan INTEGER UNIQUE,
                    id_laporan INTEGER,
                    tanggal_bayar DATETIME DEFAULT CURRENT_TIMESTAMP,
                    metode TEXT NOT NULL DEFAULT 'tunai',
                    jumlah_bayar REAL NOT NULL DEFAULT 0,
                    uang_diterima REAL NOT NULL DEFAULT 0,
                    uang_kembalian REAL NOT NULL DEFAULT 0,
                    no_referensi TEXT DEFAULT '',
                    status TEXT NOT NULL DEFAULT 'Selesai'
                )`, (err) => {
                    if (err) rej(err);
                    else res();
                });
            });
            });
        }
    }

    // Pastikan kolom snap_token & metode_pembayaran ada di tabel pesanan
    try {
        await query("ALTER TABLE pesanan ADD COLUMN snap_token TEXT DEFAULT ''");
    } catch (colErr) {
        // Kolom sudah ada
    }

    try {
        await query("ALTER TABLE pesanan ADD COLUMN metode_pembayaran TEXT DEFAULT 'tunai'");
    } catch (colErr) {
        // Kolom sudah ada
    }

    // Seed Admin Default jika belum ada
    const adminCheck = await query('SELECT COUNT(*) as count FROM administrator');
    const adminCount = parseInt(adminCheck.rows[0].count, 10);
    if (adminCount === 0) {
        const defaultPassword = await bcrypt.hash('admin123', 10);
        await query(
            `INSERT INTO administrator (nama, email, password) VALUES ($1, $2, $3)`,
            ['Administrator Dapur Ina', 'admin@dapurina.com', defaultPassword]
        );
    }

    // 16 Verified High-Resolution Authentic Food Photography (100% Matching, Distinct, Zero AI/Emoji)
    const sampleProducts = [
        // 1. Makanan Utama
        {
            nama: 'Nasi Goreng Spesial Dapur Ina',
            kategori: 'Makanan Utama',
            harga: 25000,
            stok: 50,
            deskripsi: 'Nasi goreng bumbu racikan khas dengan suwiran ayam, telur, acar wortel mentimun, dan kerupuk renyah.',
            gambar: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80'
        },
        {
            nama: 'Mie Goreng Seafood Spesial',
            kategori: 'Makanan Utama',
            harga: 30000,
            stok: 25,
            deskripsi: 'Mie telur kenyal dimasak wajan panas bersama udang windu segar, cumi kenyal, sayuran hijau, dan bumbu gurih lezat.',
            gambar: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80'
        },
        {
            nama: 'Ayam Goreng Sambal Ina',
            kategori: 'Makanan Utama',
            harga: 28000,
            stok: 45,
            deskripsi: 'Ayam goreng empuk bumbu rempah kuning gurih garing keemasan, disajikan hangat dengan sambal terasi pedas mantap.',
            gambar: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80'
        },
        {
            nama: 'Ayam Panggang Madu Rempah',
            kategori: 'Makanan Utama',
            harga: 35000,
            stok: 3,
            deskripsi: 'Ayam panggang oven bumbu madu kecap rempah legit, meresap harum disajikan dengan cocolan sambal khas.',
            gambar: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=600&q=80'
        },
        {
            nama: 'Sate Ayam Bumbu Kacang Madura',
            kategori: 'Makanan Utama',
            harga: 28000,
            stok: 35,
            deskripsi: 'Tusukan daging ayam empuk dibakar arang wangi, disajikan hangat dengan siraman bumbu kacang gurih dan irisan bawang.',
            gambar: 'https://images.unsplash.com/photo-1772855386828-a18ff9a12584?auto=format&fit=crop&w=600&q=80'
        },
        {
            nama: 'Soto Ayam Kuah Santan Rempah',
            kategori: 'Makanan Utama',
            harga: 32000,
            stok: 20,
            deskripsi: 'Kuah kuning santan gurih kaya rempah tradisional disajikan lengkap dengan suwiran ayam, soun, nasi hangat, sambal, dan jeruk nipis.',
            gambar: 'https://images.unsplash.com/photo-1572656631137-7935297eff55?auto=format&fit=crop&w=600&q=80'
        },
        {
            nama: 'Mie Kuah Seafood Telur Spesial',
            kategori: 'Makanan Utama',
            harga: 32000,
            stok: 20,
            deskripsi: 'Mie kuah hangat berkaldu gurih disajikan dengan udang windu manis, telur setengah matang, dan sayuran hijau segar.',
            gambar: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80'
        },

        // 2. Appetizer
        {
            nama: 'Lumpia Goreng Semarang Renyah (4 pcs)',
            kategori: 'Appetizer',
            harga: 18000,
            stok: 40,
            deskripsi: 'Kulit lumpia renyah keemasan dengan isian rebung manis, ayam, dan telur, disajikan hangat dengan saus cocolan khas.',
            gambar: 'https://images.unsplash.com/photo-1515022376298-7333f33e704b?auto=format&fit=crop&w=600&q=80'
        },
        {
            nama: 'Pastel Goreng Segitiga Renyah (4 pcs)',
            kategori: 'Appetizer',
            harga: 16000,
            stok: 30,
            deskripsi: 'Kulit pastry berlapis renyah dengan isian sayur bumbu rempah kari gurih, disajikan dengan cabai rawit hijau segar.',
            gambar: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80'
        },
        {
            nama: 'Dimsum Siomay Ayam Kukus (4 pcs)',
            kategori: 'Appetizer',
            harga: 20000,
            stok: 35,
            deskripsi: 'Olahan daging ayam dan udang lembut gurih dibungkus kulit tipis, dikukus hangat disajikan dengan saus cocolan nikmat.',
            gambar: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=600&q=80'
        },
        {
            nama: 'Ayam Popcorn Crispy Gurih',
            kategori: 'Appetizer',
            harga: 22000,
            stok: 30,
            deskripsi: 'Fillet ayam dipotong dadu dibalut tepung berbumbu gurih renyah, camilan lezat dengan cocolan saus mayones spesial.',
            gambar: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80'
        },

        // 3. Minuman
        {
            nama: 'Es Lemon Tea Segar',
            kategori: 'Minuman',
            harga: 8000,
            stok: 100,
            deskripsi: 'Seduhan daun teh pilihan berpadu irisan lemon segar dan daun mint dengan es batu kristal pelepas dahaga.',
            gambar: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80'
        },
        {
            nama: 'Es Jeruk Peras Murni',
            kategori: 'Minuman',
            harga: 10000,
            stok: 80,
            deskripsi: 'Jeruk peras manis segar kaya vitamin C murni tanpa pemanis buatan, disajikan dingin menyegarkan.',
            gambar: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80'
        },
        {
            nama: 'Kopi Susu Gula Aren Ina',
            kategori: 'Minuman',
            harga: 18000,
            stok: 50,
            deskripsi: 'Perpaduan espresso kopi aromatik pilihan, susu segar lembut gurih, dan manis legit gula aren murni.',
            gambar: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80'
        },
        {
            nama: 'Es Jeruk Nipis Mint Squash',
            kategori: 'Minuman',
            harga: 12000,
            stok: 60,
            deskripsi: 'Perasan jeruk nipis segar berpadu daun mint dan soda dingin kristal, memberikan sensasi asam segar yang melegakan.',
            gambar: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80'
        },
        {
            nama: 'Jus Mangga Tropis Segar',
            kategori: 'Minuman',
            harga: 18000,
            stok: 40,
            deskripsi: 'Daging mangga manis harum diblend lembut kental, kaya nutrisi dan kesegaran buah tropis alami.',
            gambar: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?auto=format&fit=crop&w=600&q=80'
        }
    ];

    // Sinkronisasi produk agar sesuai dengan katalog foto berkualitas
    // 1. Hapus produk lama yang berformat emoji atau tidak valid
    await query("DELETE FROM produk WHERE gambar NOT LIKE 'http%'");

    // 2. Sinkronkan produk ke database
    for (const p of sampleProducts) {
        const exist = await query('SELECT id_produk, gambar FROM produk WHERE nama_produk = $1', [p.nama]);
        if (exist.rows.length === 0) {
            await query(
                `INSERT INTO produk (nama_produk, kategori, harga, stok, status_stok, deskripsi, gambar, id_admin)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, 1)`,
                [p.nama, p.kategori, p.harga, p.stok, p.stok > 0 ? (p.stok <= 5 ? 'Menipis' : 'Tersedia') : 'Habis', p.deskripsi, p.gambar]
            );
        } else {
            // Perbarui gambar dan deskripsi agar 100% akurat
            await query(
                'UPDATE produk SET gambar = $1, deskripsi = $2, harga = $3, kategori = $4 WHERE id_produk = $5',
                [p.gambar, p.deskripsi, p.harga, p.kategori, exist.rows[0].id_produk]
            );
        }
    }

    // 3. Bersihkan produk lama di database yang namanya sudah tidak terdaftar
    const validNames = sampleProducts.map(p => p.nama);
    const allProd = await query('SELECT id_produk, nama_produk FROM produk');
    for (const r of allProd.rows) {
        if (!validNames.includes(r.nama_produk)) {
            await query('DELETE FROM detail_pesanan WHERE id_produk = $1', [r.id_produk]);
            await query('DELETE FROM produk WHERE id_produk = $1', [r.id_produk]);
        }
    }

    console.log('Database Siap Digunakan!');
}

module.exports = {
    pool,
    query,
    initDatabase
};
