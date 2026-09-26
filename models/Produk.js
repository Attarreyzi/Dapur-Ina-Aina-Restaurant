/**
 * Model Produk & Manajemen Stok (PostgreSQL)
 */
const { query } = require('../config/db');
const Kategori = require('./Kategori');

class Produk {
    static async getAll({ kategori = null, statusStok = null, search = null } = {}) {
        let sql = `SELECT p.*, p.kategori AS nama_kategori 
                   FROM produk p 
                   WHERE 1=1`;
        const params = [];
        let pIndex = 1;

        if (kategori) {
            const catName = isNaN(kategori) ? kategori : Kategori.getNamaById(parseInt(kategori, 10));
            sql += ` AND LOWER(p.kategori) = LOWER($${pIndex++})`;
            params.push(catName);
        }

        if (statusStok && ['Tersedia', 'Habis', 'Menipis'].includes(statusStok)) {
            sql += ` AND p.status_stok = $${pIndex++}`;
            params.push(statusStok);
        }

        if (search && search.trim() !== '') {
            sql += ` AND (p.nama_produk ILIKE $${pIndex} OR p.deskripsi ILIKE $${pIndex})`;
            params.push(`%${search.trim()}%`);
            pIndex++;
        }

        sql += ` ORDER BY p.id_produk DESC`;

        const res = await query(sql, params);
        return res.rows.map(r => ({
            ...r,
            id_kategori: Kategori.getIdByNama(r.kategori),
            harga: parseFloat(r.harga) || 0,
            stok: parseInt(r.stok, 10) || 0
        }));
    }

    static async getById(id) {
        const res = await query(
            `SELECT p.*, p.kategori AS nama_kategori FROM produk p WHERE p.id_produk = $1`,
            [id]
        );
        if (res.rows.length === 0) return null;
        const r = res.rows[0];
        return {
            ...r,
            id_kategori: Kategori.getIdByNama(r.kategori),
            harga: parseFloat(r.harga) || 0,
            stok: parseInt(r.stok, 10) || 0
        };
    }

    static async create({ nama_produk, id_kategori, kategori, harga, stok, status_stok, deskripsi, gambar, id_admin = 1 }) {
        const nama = (nama_produk || '').trim();
        if (!nama) throw new Error('Nama produk wajib diisi.');

        const kategoriNama = id_kategori ? Kategori.getNamaById(id_kategori) : (kategori || 'Makanan Utama');
        const price = parseFloat(harga) || 0;
        const stock = parseInt(stok, 10) || 0;
        const status = stock > 0 ? (status_stok || (stock <= 5 ? 'Menipis' : 'Tersedia')) : 'Habis';
        const desc = (deskripsi || '').trim();
        const img = (gambar || '').trim() || 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80';

        const sql = `INSERT INTO produk (nama_produk, kategori, harga, stok, status_stok, deskripsi, gambar, id_admin)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`;
        const res = await query(sql, [nama, kategoriNama, price, stock, status, desc, img, id_admin]);
        return res.rows[0];
    }

    static async update(id, { nama_produk, id_kategori, kategori, harga, stok, status_stok, deskripsi, gambar }) {
        const nama = (nama_produk || '').trim();
        if (!nama) throw new Error('Nama produk wajib diisi.');

        const kategoriNama = id_kategori ? Kategori.getNamaById(id_kategori) : (kategori || 'Makanan Utama');
        const price = parseFloat(harga) || 0;
        const stock = parseInt(stok, 10) || 0;
        const status = stock > 0 ? (status_stok || (stock <= 5 ? 'Menipis' : 'Tersedia')) : 'Habis';
        const desc = (deskripsi || '').trim();

        let sql = `UPDATE produk 
                   SET nama_produk = $1, kategori = $2, harga = $3, stok = $4, status_stok = $5, deskripsi = $6, updated_at = NOW()`;
        const params = [nama, kategoriNama, price, stock, status, desc];
        let pIndex = 7;

        if (gambar) {
            sql += `, gambar = $${pIndex++}`;
            params.push(gambar);
        }

        sql += ` WHERE id_produk = $${pIndex} RETURNING *`;
        params.push(id);

        const res = await query(sql, params);
        return res.rows[0] || null;
    }

    static async updateStock(id, newStock) {
        const stock = Math.max(0, parseInt(newStock, 10) || 0);
        const status = stock === 0 ? 'Habis' : (stock <= 5 ? 'Menipis' : 'Tersedia');
        const res = await query(
            `UPDATE produk SET stok = $1, status_stok = $2, updated_at = NOW() WHERE id_produk = $3 RETURNING *`,
            [stock, status, id]
        );
        return res.rows[0] || null;
    }

    static async reduceStock(id, qty, client = null) {
        const q = client ? client.query.bind(client) : query;
        const res = await q(
            `UPDATE produk 
             SET stok = CASE WHEN (stok - $1) < 0 THEN 0 ELSE (stok - $1) END,
                 status_stok = CASE WHEN (stok - $1) <= 0 THEN 'Habis' WHEN (stok - $1) <= 5 THEN 'Menipis' ELSE 'Tersedia' END,
                 updated_at = NOW()
             WHERE id_produk = $2 RETURNING *`,
            [qty, id]
        );
        return res.rows[0] || null;
    }

    static async delete(id) {
        const res = await query(`DELETE FROM produk WHERE id_produk = $1 RETURNING id_produk`, [id]);
        return res.rowCount > 0;
    }

    static async getLowStockAlerts(limit = 10) {
        const res = await query(
            `SELECT * FROM produk WHERE stok <= 5 OR status_stok = 'Habis' ORDER BY stok ASC LIMIT $1`,
            [limit]
        );
        return res.rows;
    }
}

module.exports = Produk;
