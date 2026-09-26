/**
 * Model Laporan Penjualan (PostgreSQL)
 */
const { query } = require('../config/db');

class Laporan {
    /**
     * Mengambil Data Laporan Penjualan Berdasarkan Rentang Tanggal
     */
    static async getLaporan({ jenisPeriode = 'harian', startDate = null, endDate = null } = {}) {
        let start = startDate;
        let end = endDate;
        const now = new Date();

        if (!start || !end) {
            if (jenisPeriode === 'harian') {
                const todayStr = now.toISOString().split('T')[0];
                start = todayStr;
                end = todayStr;
            } else if (jenisPeriode === 'mingguan') {
                const weekAgo = new Date();
                weekAgo.setDate(now.getDate() - 7);
                start = weekAgo.toISOString().split('T')[0];
                end = now.toISOString().split('T')[0];
            } else if (jenisPeriode === 'bulanan') {
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                start = firstDay.toISOString().split('T')[0];
                end = now.toISOString().split('T')[0];
            } else {
                start = '2020-01-01';
                end = now.toISOString().split('T')[0];
            }
        }

        // Query Ringkasan Omset & Transaksi
        const summaryRes = await query(`
            SELECT 
                COUNT(t.id_transaksi) AS total_transaksi,
                COALESCE(SUM(t.jumlah_bayar), 0) AS total_penjualan,
                COALESCE(SUM(CASE WHEN t.metode = 'tunai' THEN t.jumlah_bayar ELSE 0 END), 0) AS total_tunai,
                COALESCE(SUM(CASE WHEN t.metode = 'non_tunai' THEN t.jumlah_bayar ELSE 0 END), 0) AS total_non_tunai
            FROM transaksi t
            WHERE DATE(t.tanggal_bayar) >= $1 AND DATE(t.tanggal_bayar) <= $2
        `, [start, end]);

        // Query Detail Transaksi dalam Periode
        const detailRes = await query(`
            SELECT 
                t.id_transaksi,
                t.id_pesanan,
                t.tanggal_bayar,
                t.metode,
                t.jumlah_bayar,
                t.no_referensi,
                c.nama AS nama_pelanggan,
                p.nomor_meja,
                (
                    SELECT string_agg(CONCAT(pr.nama_produk, ' x', dp.jumlah), ', ')
                    FROM detail_pesanan dp
                    JOIN produk pr ON dp.id_produk = pr.id_produk
                    WHERE dp.id_pesanan = p.id_pesanan
                ) AS rincian_menu
            FROM transaksi t
            JOIN pesanan p ON t.id_pesanan = p.id_pesanan
            LEFT JOIN pelanggan c ON p.id_pelanggan = c.id_pelanggan
            WHERE DATE(t.tanggal_bayar) >= $1 AND DATE(t.tanggal_bayar) <= $2
            ORDER BY t.tanggal_bayar ASC
        `, [start, end]);

        // Query Penjualan per Kategori
        const categoryRes = await query(`
            SELECT 
                pr.kategori,
                SUM(dp.jumlah) AS total_item,
                SUM(dp.subtotal) AS total_omset
            FROM detail_pesanan dp
            JOIN produk pr ON dp.id_produk = pr.id_produk
            JOIN pesanan p ON dp.id_pesanan = p.id_pesanan
            JOIN transaksi t ON p.id_pesanan = t.id_pesanan
            WHERE DATE(t.tanggal_bayar) >= $1 AND DATE(t.tanggal_bayar) <= $2
            GROUP BY pr.kategori
            ORDER BY total_omset DESC
        `, [start, end]);

        return {
            jenis_periode: jenisPeriode,
            tanggal_mulai: start,
            tanggal_akhir: end,
            total_transaksi: parseInt(summaryRes.rows[0].total_transaksi, 10) || 0,
            total_penjualan: parseFloat(summaryRes.rows[0].total_penjualan) || 0,
            total_tunai: parseFloat(summaryRes.rows[0].total_tunai) || 0,
            total_non_tunai: parseFloat(summaryRes.rows[0].total_non_tunai) || 0,
            detail: detailRes.rows.map(r => ({
                ...r,
                no_pesanan: `ORD-${String(r.id_pesanan).padStart(5, '0')}`,
                jumlah_bayar: parseFloat(r.jumlah_bayar) || 0
            })),
            kategori_summary: categoryRes.rows.map(c => ({
                ...c,
                total_item: parseInt(c.total_item, 10) || 0,
                total_omset: parseFloat(c.total_omset) || 0
            }))
        };
    }
}

module.exports = Laporan;
