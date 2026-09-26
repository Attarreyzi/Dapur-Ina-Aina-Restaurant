/**
 * Model Pelanggan (PostgreSQL)
 */
const { query } = require('../config/db');

class Pelanggan {
    static async create({ nama, no_telepon = '-', alamat = 'Dine In' }, client = null) {
        const q = client ? client.query.bind(client) : query;
        const res = await q(
            `INSERT INTO pelanggan (nama, no_telepon, alamat) VALUES ($1, $2, $3) RETURNING *`,
            [nama || 'Pelanggan Umum', no_telepon || '-', alamat || 'Dine In']
        );
        return res.rows[0];
    }

    static async getById(id) {
        const res = await query('SELECT * FROM pelanggan WHERE id_pelanggan = $1', [id]);
        return res.rows[0] || null;
    }

    static async getAll() {
        const res = await query('SELECT * FROM pelanggan ORDER BY id_pelanggan DESC');
        return res.rows;
    }
}

module.exports = Pelanggan;
