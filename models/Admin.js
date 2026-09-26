/**
 * Model Admin (PostgreSQL)
 */
const { query } = require('../config/db');
const bcrypt = require('bcryptjs');

class Admin {
    static async findByEmail(email) {
        const res = await query('SELECT * FROM administrator WHERE LOWER(email) = LOWER($1)', [email]);
        return res.rows[0] || null;
    }

    static async findById(id) {
        const res = await query('SELECT id_admin, nama, email, created_at FROM administrator WHERE id_admin = $1', [id]);
        return res.rows[0] || null;
    }

    static async verifyPassword(plainPassword, hashedPassword) {
        if (!hashedPassword) return false;
        // Support direct comparison if plain string or bcrypt
        if (hashedPassword.startsWith('$2a$') || hashedPassword.startsWith('$2b$')) {
            return await bcrypt.compare(plainPassword, hashedPassword);
        }
        return plainPassword === hashedPassword;
    }

    static async create({ nama, email, password }) {
        const hash = await bcrypt.hash(password, 10);
        const res = await query(
            'INSERT INTO administrator (nama, email, password) VALUES ($1, $2, $3) RETURNING id_admin, nama, email',
            [nama, email, hash]
        );
        return res.rows[0];
    }
}

module.exports = Admin;
