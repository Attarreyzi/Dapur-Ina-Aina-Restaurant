/**
 * Model Pesanan & Detail Pesanan (PostgreSQL)
 */
const { pool, query } = require('../config/db');
const Produk = require('./Produk');
const Pelanggan = require('./Pelanggan');

class Pesanan {
    /**
     * Membuat Pesanan Baru beserta Detail Item dengan Database Transaction
     */
    static async createOrder(headerData, items) {
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error('Keranjang tidak boleh kosong.');
        }

        const nomorMeja = (headerData.nomor_meja || 'Meja 01').trim();
        const namaPelanggan = (headerData.nama_pelanggan || `Pelanggan ${nomorMeja}`).trim();
        const noTelepon = (headerData.no_telepon || '-').trim();
        const alamatInput = (headerData.alamat || '').trim();
        const catatan = (headerData.catatan || '').trim();

        const isTakeAway = nomorMeja.toLowerCase().includes('take away') || nomorMeja.toLowerCase().includes('bungkus');
        const alamatClean = alamatInput || (isTakeAway ? 'Take Away' : `Dine In (${nomorMeja})`);
        const metodePembayaran = (headerData.metode_pembayaran || 'tunai').trim();

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Simpan Data Pelanggan Baru
            const resPelanggan = await client.query(
                `INSERT INTO pelanggan (nama, no_telepon, alamat) VALUES ($1, $2, $3) RETURNING id_pelanggan`,
                [namaPelanggan, noTelepon, alamatClean]
            );
            const idPelanggan = resPelanggan.rows[0].id_pelanggan;

            // 2. Validasi stok setiap item & hitung subtotal
            let totalHarga = 0;
            const validatedItems = [];

            for (const item of items) {
                const idProduk = parseInt(item.id_produk, 10);
                const jumlah = parseInt(item.jumlah, 10);

                if (isNaN(jumlah) || jumlah <= 0) {
                    throw new Error('Jumlah pesanan untuk setiap item minimal 1.');
                }

                if (jumlah > 20) {
                    throw new Error(`Batas maksimal per menu adalah 20 porsi. Untuk pesanan dalam jumlah besar, silahkan hubungi kasir.`);
                }

                // Lock row produk for update
                const resProd = await client.query(
                    `SELECT * FROM produk WHERE id_produk = $1 FOR UPDATE`,
                    [idProduk]
                );

                if (resProd.rows.length === 0) {
                    throw new Error(`Produk ID #${idProduk} tidak ditemukan.`);
                }

                const prod = resProd.rows[0];
                const stokTersedia = parseInt(prod.stok, 10);

                if (prod.status_stok === 'Habis' || stokTersedia < jumlah) {
                    throw new Error(`Stok '${prod.nama_produk}' tidak mencukupi! Tersedia: ${stokTersedia}, Dipesan: ${jumlah}`);
                }

                const hargaSatuan = parseFloat(prod.harga);
                const subtotal = hargaSatuan * jumlah;
                totalHarga += subtotal;

                validatedItems.push({
                    id_produk: idProduk,
                    nama_produk: prod.nama_produk,
                    kategori: prod.kategori,
                    jumlah,
                    harga_satuan: hargaSatuan,
                    subtotal
                });
            }

            // 3. Simpan Header Pesanan
            const resOrder = await client.query(
                `INSERT INTO pesanan (id_pelanggan, tanggal, total, status, nomor_meja, catatan, metode_pembayaran)
                 VALUES ($1, NOW(), $2, 'Menunggu', $3, $4, $5) RETURNING *`,
                [idPelanggan, totalHarga, nomorMeja, catatan, metodePembayaran]
            );
            const orderHeader = resOrder.rows[0];
            const idPesanan = orderHeader.id_pesanan;

            // 4. Simpan Detail Pesanan & Kurangi Stok
            for (const vItem of validatedItems) {
                await client.query(
                    `INSERT INTO detail_pesanan (id_pesanan, id_produk, jumlah, harga, subtotal)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [idPesanan, vItem.id_produk, vItem.jumlah, vItem.harga_satuan, vItem.subtotal]
                );

                // Update stok
                await client.query(
                    `UPDATE produk
                     SET stok = CASE WHEN (stok - $1) < 0 THEN 0 ELSE (stok - $1) END,
                         status_stok = CASE WHEN (stok - $1) <= 0 THEN 'Habis' WHEN (stok - $1) <= 5 THEN 'Menipis' ELSE 'Tersedia' END,
                         updated_at = NOW()
                     WHERE id_produk = $2`,
                    [vItem.jumlah, vItem.id_produk]
                );
            }

            await client.query('COMMIT');

            return {
                id_pesanan: idPesanan,
                no_pesanan: `ORD-${String(idPesanan).padStart(5, '0')}`,
                nama_pelanggan: namaPelanggan,
                nomor_meja: nomorMeja,
                total_harga: totalHarga,
                status: 'Menunggu',
                items: validatedItems
            };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    /**
     * Ambil Detail 1 Pesanan beserta Items, Pelanggan, & Transaksi
     */
    static async getById(id) {
        const sql = `
            SELECT 
                p.id_pesanan,
                p.tanggal AS waktu_pesan,
                p.total AS total_harga,
                p.status AS status_pesanan,
                p.nomor_meja,
                p.catatan,
                p.snap_token,
                p.metode_pembayaran AS metode_pilihan,
                c.id_pelanggan,
                c.nama AS nama_pelanggan,
                c.no_telepon,
                c.alamat,
                t.id_transaksi,
                t.tanggal_bayar,
                COALESCE(t.metode, p.metode_pembayaran, 'tunai') AS metode_pembayaran,
                t.jumlah_bayar,
                t.uang_diterima,
                t.uang_kembalian,
                t.no_referensi,
                t.status AS status_transaksi
            FROM pesanan p
            LEFT JOIN pelanggan c ON p.id_pelanggan = c.id_pelanggan
            LEFT JOIN transaksi t ON p.id_pesanan = t.id_pesanan
            WHERE p.id_pesanan = $1
        `;

        const res = await query(sql, [id]);
        if (res.rows.length === 0) return null;

        const order = res.rows[0];
        order.no_pesanan = `ORD-${String(order.id_pesanan).padStart(5, '0')}`;
        order.total_harga = parseFloat(order.total_harga) || 0;
        order.snap_token = order.snap_token || '';
        order.jumlah_bayar = order.jumlah_bayar ? parseFloat(order.jumlah_bayar) : 0;
        order.uang_diterima = order.uang_diterima ? parseFloat(order.uang_diterima) : 0;
        order.uang_kembalian = order.uang_kembalian ? parseFloat(order.uang_kembalian) : 0;

        // Ambil Item Detail
        const itemsRes = await query(
            `SELECT d.*, pr.nama_produk, pr.kategori, pr.gambar
             FROM detail_pesanan d
             LEFT JOIN produk pr ON d.id_produk = pr.id_produk
             WHERE d.id_pesanan = $1
             ORDER BY d.id_detail ASC`,
            [id]
        );

        order.items = itemsRes.rows.map(item => ({
            ...item,
            harga: parseFloat(item.harga) || 0,
            harga_satuan: parseFloat(item.harga) || 0,
            subtotal: parseFloat(item.subtotal) || 0,
            jumlah: parseInt(item.jumlah, 10) || 1
        }));

        return order;
    }

    /**
     * Ambil Semua Pesanan dengan Filter
     */
    static async getAll({ status = null, search = null, limit = 50 } = {}) {
        let sql = `
            SELECT 
                p.id_pesanan,
                p.tanggal AS waktu_pesan,
                p.total AS total_harga,
                p.status AS status_pesanan,
                p.nomor_meja,
                c.nama AS nama_pelanggan,
                c.no_telepon,
                t.id_transaksi,
                t.metode AS metode_pembayaran,
                t.status AS status_transaksi
            FROM pesanan p
            LEFT JOIN pelanggan c ON p.id_pelanggan = c.id_pelanggan
            LEFT JOIN transaksi t ON p.id_pesanan = t.id_pesanan
            WHERE 1=1
        `;
        const params = [];
        let pIndex = 1;

        if (status) {
            sql += ` AND p.status = $${pIndex++}`;
            params.push(status);
        }

        if (search && search.trim() !== '') {
            sql += ` AND (c.nama ILIKE $${pIndex} OR p.nomor_meja ILIKE $${pIndex} OR CAST(p.id_pesanan AS TEXT) ILIKE $${pIndex})`;
            params.push(`%${search.trim()}%`);
            pIndex++;
        }

        sql += ` ORDER BY p.id_pesanan DESC LIMIT $${pIndex}`;
        params.push(limit);

        const res = await query(sql, params);
        return res.rows.map(r => ({
            ...r,
            no_pesanan: `ORD-${String(r.id_pesanan).padStart(5, '0')}`,
            total_harga: parseFloat(r.total_harga) || 0
        }));
    }

    static async updateStatus(id, status) {
        const res = await query(
            `UPDATE pesanan SET status = $1 WHERE id_pesanan = $2 RETURNING *`,
            [status, id]
        );
        return res.rows[0] || null;
    }

    /**
     * Statistik Penjualan Hari Ini & Keseluruhan untuk Dashboard
     */
    static async getDashboardStats() {
        // Penjualan hari ini
        const todayRes = await query(`
            SELECT 
                COALESCE(SUM(t.jumlah_bayar), 0) AS omset_hari_ini,
                COUNT(t.id_transaksi) AS transaksi_hari_ini
            FROM transaksi t
            WHERE DATE(t.tanggal_bayar) = CURRENT_DATE
        `);

        // Total keseluruhan
        const totalRes = await query(`
            SELECT 
                COALESCE(SUM(t.jumlah_bayar), 0) AS total_pendapatan,
                COUNT(t.id_transaksi) AS total_transaksi
            FROM transaksi t
        `);

        // Pesanan aktif / menunggu bayar
        const pendingRes = await query(`
            SELECT COUNT(*) AS total_menunggu 
            FROM pesanan 
            WHERE status = 'Menunggu'
        `);

        // Total Produk & Low Stock
        const prodRes = await query(`
            SELECT 
                COUNT(*) AS total_menu,
                COUNT(CASE WHEN stok <= 5 OR status_stok = 'Habis' THEN 1 END) AS menu_menipis
            FROM produk
        `);

        // Top 5 Menu Terlaris
        const topMenuRes = await query(`
            SELECT 
                pr.nama_produk,
                pr.kategori,
                pr.gambar,
                SUM(dp.jumlah) AS total_terjual,
                SUM(dp.subtotal) AS total_omset
            FROM detail_pesanan dp
            JOIN produk pr ON dp.id_produk = pr.id_produk
            JOIN pesanan p ON dp.id_pesanan = p.id_pesanan
            WHERE p.status IN ('Selesai', 'Menunggu')
            GROUP BY pr.id_produk, pr.nama_produk, pr.kategori, pr.gambar
            ORDER BY total_terjual DESC
            LIMIT 3
        `);

        // Riwayat Transaksi Selesai Terbaru
        const recentTransRes = await query(`
            SELECT 
                t.id_transaksi,
                t.id_pesanan,
                t.tanggal_bayar,
                t.metode,
                t.jumlah_bayar,
                c.nama AS nama_pelanggan,
                p.nomor_meja
            FROM transaksi t
            JOIN pesanan p ON t.id_pesanan = p.id_pesanan
            LEFT JOIN pelanggan c ON p.id_pelanggan = c.id_pelanggan
            ORDER BY t.tanggal_bayar DESC
            LIMIT 6
        `);

        // Daftar Pesanan Baru yang Menunggu Konfirmasi / Pembayaran (Live Antrean)
        const pendingOrdersRes = await query(`
            SELECT 
                p.id_pesanan,
                p.tanggal AS waktu_pesan,
                p.total AS total_tagihan,
                p.status AS status_pesanan,
                p.nomor_meja,
                p.catatan,
                c.nama AS nama_pelanggan,
                c.no_telepon,
                (
                    SELECT string_agg(CONCAT(pr.nama_produk, ' (', dp.jumlah, ')'), ', ')
                    FROM detail_pesanan dp
                    JOIN produk pr ON dp.id_produk = pr.id_produk
                    WHERE dp.id_pesanan = p.id_pesanan
                ) AS rincian_menu
            FROM pesanan p
            LEFT JOIN pelanggan c ON p.id_pelanggan = c.id_pelanggan
            WHERE p.status = 'Menunggu'
            ORDER BY p.id_pesanan DESC
            LIMIT 10
        `);

        // 1. Data Grafik 7 Hari Terakhir (Mingguan)
        const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const days7 = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            days7.push({
                date: `${yyyy}-${mm}-${dd}`,
                label: `${dayNames[d.getDay()]}, ${dd} ${monthNamesShort[d.getMonth()]}`,
                omset: 0,
                transaksi: 0
            });
        }

        // 2. Data Grafik Bulanan (Tahun Berjalan 12 Bulan)
        const currentYear = new Date().getFullYear();
        const monthsData = [];
        for (let m = 0; m < 12; m++) {
            const mm = String(m + 1).padStart(2, '0');
            monthsData.push({
                yearMonth: `${currentYear}-${mm}`,
                label: `${monthNamesShort[m]} ${currentYear}`,
                omset: 0,
                transaksi: 0
            });
        }

        // Ambil riwayat pembayaran untuk rekap grafik
        const allTransRes = await query(`
            SELECT tanggal_bayar, jumlah_bayar
            FROM transaksi
            WHERE tanggal_bayar IS NOT NULL
        `);

        for (const row of allTransRes.rows) {
            const tglStr = String(row.tanggal_bayar).slice(0, 10);
            const ymStr = String(row.tanggal_bayar).slice(0, 7);
            const amount = parseFloat(row.jumlah_bayar) || 0;

            const dayObj = days7.find(d => d.date === tglStr);
            if (dayObj) {
                dayObj.omset += amount;
                dayObj.transaksi += 1;
            }

            const monthObj = monthsData.find(m => m.yearMonth === ymStr);
            if (monthObj) {
                monthObj.omset += amount;
                monthObj.transaksi += 1;
            }
        }

        return {
            omset_hari_ini: parseFloat(todayRes.rows[0].omset_hari_ini) || 0,
            transaksi_hari_ini: parseInt(todayRes.rows[0].transaksi_hari_ini, 10) || 0,
            total_pendapatan: parseFloat(totalRes.rows[0].total_pendapatan) || 0,
            total_transaksi: parseInt(totalRes.rows[0].total_transaksi, 10) || 0,
            total_menunggu: parseInt(pendingRes.rows[0].total_menunggu, 10) || 0,
            total_menu: parseInt(prodRes.rows[0].total_menu, 10) || 0,
            menu_menipis: parseInt(prodRes.rows[0].menu_menipis, 10) || 0,
            top_menu: topMenuRes.rows.map(m => ({
                ...m,
                total_terjual: parseInt(m.total_terjual, 10) || 0,
                total_omset: parseFloat(m.total_omset) || 0
            })),
            pending_orders: pendingOrdersRes.rows.map(r => ({
                ...r,
                no_pesanan: `ORD-${String(r.id_pesanan).padStart(5, '0')}`,
                total_tagihan: parseFloat(r.total_tagihan) || 0
            })),
            recent_transaksi: recentTransRes.rows.map(r => ({
                ...r,
                no_pesanan: `ORD-${String(r.id_pesanan).padStart(5, '0')}`,
                jumlah_bayar: parseFloat(r.jumlah_bayar) || 0
            })),
            chart_7_days: {
                labels: days7.map(d => d.label),
                omset: days7.map(d => d.omset),
                transaksi: days7.map(d => d.transaksi)
            },
            chart_monthly: {
                labels: monthsData.map(m => m.label),
                omset: monthsData.map(m => m.omset),
                transaksi: monthsData.map(m => m.transaksi)
            }
        };
    }

    /**
     * Update Snap Token untuk Pesanan
     */
    static async updateSnapToken(idPesanan, snapToken) {
        return await query(
            `UPDATE pesanan SET snap_token = $1 WHERE id_pesanan = $2`,
            [snapToken, idPesanan]
        );
    }

    /**
     * Hapus Pesanan beserta Detail dan Transaksi (CASCADE)
     */
    static async delete(idPesanan) {
        return await query(`DELETE FROM pesanan WHERE id_pesanan = $1`, [idPesanan]);
    }
}

module.exports = Pesanan;
