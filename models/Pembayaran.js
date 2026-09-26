/**
 * Model Pembayaran & Transaksi Billing (PostgreSQL)
 */
const { pool, query } = require('../config/db');
const Pesanan = require('./Pesanan');

class Pembayaran {
    /**
     * Memproses Pembayaran Billing dan Menyimpan ke Tabel `transaksi`
     */
    static async prosesPembayaran({ id_pesanan, metode_pembayaran = 'tunai', uang_diterima = 0, no_referensi = '' }) {
        const idPesanan = parseInt(id_pesanan, 10);
        if (isNaN(idPesanan) || idPesanan <= 0) {
            throw new Error('ID Pesanan tidak valid.');
        }

        const order = await Pesanan.getById(idPesanan);
        if (!order) {
            throw new Error(`Pesanan dengan ID #${idPesanan} tidak ditemukan.`);
        }

        if (order.status_pesanan === 'Selesai' && order.id_transaksi) {
            throw new Error(`Pesanan ${order.no_pesanan} sudah Selesai dan sudah dibayar sebelumnya.`);
        }

        const totalTagihan = parseFloat(order.total_harga);
        const metodeClean = (metode_pembayaran || 'tunai').toLowerCase().includes('non') ? 'non_tunai' : 'tunai';
        let cashReceived = parseFloat(uang_diterima) || 0;
        let change = 0;

        if (metodeClean === 'tunai') {
            if (cashReceived < totalTagihan) {
                const deficit = totalTagihan - cashReceived;
                throw new Error(`Uang tunai kurang! Total tagihan: Rp ${totalTagihan.toLocaleString('id-ID')}, diterima: Rp ${cashReceived.toLocaleString('id-ID')} (Kurang: Rp ${deficit.toLocaleString('id-ID')})`);
            }
            change = cashReceived - totalTagihan;
        } else {
            cashReceived = totalTagihan;
            change = 0;
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Simpan Transaksi
            const resTrans = await client.query(
                `INSERT INTO transaksi (id_pesanan, tanggal_bayar, metode, jumlah_bayar, uang_diterima, uang_kembalian, no_referensi, status)
                 VALUES ($1, NOW(), $2, $3, $4, $5, $6, 'Selesai')
                 ON CONFLICT (id_pesanan) DO UPDATE 
                 SET tanggal_bayar = NOW(), metode = EXCLUDED.metode, jumlah_bayar = EXCLUDED.jumlah_bayar,
                     uang_diterima = EXCLUDED.uang_diterima, uang_kembalian = EXCLUDED.uang_kembalian,
                     no_referensi = EXCLUDED.no_referensi, status = 'Selesai'
                 RETURNING *`,
                [idPesanan, metodeClean, totalTagihan, cashReceived, change, no_referensi || '']
            );

            // 2. Update Status Pesanan Menjadi Selesai
            await client.query(
                `UPDATE pesanan SET status = 'Selesai' WHERE id_pesanan = $1`,
                [idPesanan]
            );

            await client.query('COMMIT');

            return {
                id_transaksi: resTrans.rows[0].id_transaksi,
                id_pesanan: idPesanan,
                no_pesanan: order.no_pesanan,
                metode_pembayaran: (metodeClean === 'tunai' ? 'Tunai' : 'Non Tunai'),
                total_tagihan: totalTagihan,
                uang_diterima: cashReceived,
                uang_kembalian: change,
                no_referensi,
                tanggal_bayar: resTrans.rows[0].tanggal_bayar
            };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    /**
     * Riwayat Transaksi Lengkap
     */
    static async getRiwayat({ startDate = null, endDate = null, metode = null, search = null, limit = 100 } = {}) {
        let sql = `
            SELECT 
                p.id_pesanan,
                p.tanggal AS waktu_pesan,
                p.total AS total_tagihan,
                p.status AS status_pesanan,
                p.nomor_meja,
                p.catatan,
                c.nama AS nama_pelanggan,
                c.no_telepon,
                c.alamat,
                t.id_transaksi,
                t.tanggal_bayar,
                COALESCE(t.metode, 'tunai') AS metode,
                COALESCE(t.jumlah_bayar, p.total) AS jumlah_bayar,
                COALESCE(t.uang_diterima, 0) AS uang_diterima,
                COALESCE(t.uang_kembalian, 0) AS uang_kembalian,
                t.no_referensi,
                COALESCE(t.status, 'Menunggu') AS status_transaksi,
                (
                    SELECT string_agg(CONCAT(pr.nama_produk, ' (', dp.jumlah, ')'), ', ')
                    FROM detail_pesanan dp
                    JOIN produk pr ON dp.id_produk = pr.id_produk
                    WHERE dp.id_pesanan = p.id_pesanan
                ) AS rincian_menu
            FROM pesanan p
            LEFT JOIN transaksi t ON p.id_pesanan = t.id_pesanan
            LEFT JOIN pelanggan c ON p.id_pelanggan = c.id_pelanggan
            WHERE 1=1
        `;
        const params = [];
        let pIndex = 1;

        if (startDate) {
            sql += ` AND DATE(COALESCE(t.tanggal_bayar, p.tanggal)) >= $${pIndex++}`;
            params.push(startDate);
        }

        if (endDate) {
            sql += ` AND DATE(COALESCE(t.tanggal_bayar, p.tanggal)) <= $${pIndex++}`;
            params.push(endDate);
        }

        if (metode && ['tunai', 'non_tunai'].includes(metode.toLowerCase())) {
            sql += ` AND COALESCE(t.metode, 'tunai') = $${pIndex++}`;
            params.push(metode.toLowerCase());
        }

        if (search && search.trim() !== '') {
            sql += ` AND (c.nama ILIKE $${pIndex} OR p.nomor_meja ILIKE $${pIndex} OR CAST(p.id_pesanan AS TEXT) ILIKE $${pIndex} OR t.no_referensi ILIKE $${pIndex})`;
            params.push(`%${search.trim()}%`);
            pIndex++;
        }

        sql += ` ORDER BY p.id_pesanan DESC LIMIT $${pIndex}`;
        params.push(limit);

        const res = await query(sql, params);
        return res.rows.map(r => ({
            ...r,
            no_pesanan: `ORD-${String(r.id_pesanan).padStart(5, '0')}`,
            jumlah_bayar: parseFloat(r.jumlah_bayar) || parseFloat(r.total_tagihan) || 0,
            uang_diterima: parseFloat(r.uang_diterima) || 0,
            uang_kembalian: parseFloat(r.uang_kembalian) || 0,
            tanggal_bayar: r.tanggal_bayar || r.waktu_pesan
        }));
    }
}

module.exports = Pembayaran;
