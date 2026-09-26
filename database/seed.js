/**
 * Database Seeder Script (PostgreSQL)
 * Jalankan: npm run seed
 */
const { initDatabase, pool } = require('../config/db');

async function runSeed() {
    console.log('🚀 Memulai proses seeding database PostgreSQL...');
    try {
        await initDatabase();
        console.log('✅ Seeding Selesai dengan sukses!');
    } catch (err) {
        console.error('❌ Gagal melakukan seeding:', err);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

runSeed();
