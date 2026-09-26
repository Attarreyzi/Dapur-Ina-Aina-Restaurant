/**
 * Server Entry Point (Node.js + Express + EJS + PostgreSQL)
 * Restoran Dapur Ina Aina - Sistem Informasi & POS Kasir
 */

const express = require('express');
const path = require('path');
const session = require('express-session');
const morgan = require('morgan');
require('dotenv').config();

const { initDatabase } = require('./config/db');
const setupLocals = require('./middlewares/locals');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const produkRoutes = require('./routes/produkRoutes');
const transaksiRoutes = require('./routes/transaksiRoutes');
const userRoutes = require('./routes/userRoutes');
const laporanRoutes = require('./routes/laporanRoutes');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// View Engine EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'dapur_ina_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 24 jam
        httpOnly: true
    }
}));

// Auto DB Initialization Middleware (Guarantees DB Ready on Serverless)
let dbInitPromise = null;
app.use(async (req, res, next) => {
    try {
        if (!dbInitPromise) {
            dbInitPromise = initDatabase();
        }
        await dbInitPromise;
    } catch (err) {
        console.error('DB Middleware Init Error:', err);
        dbInitPromise = null;
    }
    next();
});

// Setup Global Helpers & Locals for Views
app.use(setupLocals);

// Register Route Handlers
app.use('/', authRoutes);
app.use('/', dashboardRoutes);
app.use('/', produkRoutes);
app.use('/', transaksiRoutes);
app.use('/', userRoutes);
app.use('/', laporanRoutes);
app.use('/', apiRoutes);

// 404 Not Found Handler
app.use((req, res) => {
    res.status(404).render('partials/header', {
        title: '404 - Halaman Tidak Ditemukan',
        bodyClass: 'customer-layout'
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('🔥 Global Server Error:', err);
    res.status(500).send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h2>Terjadi Kesalahan pada Server</h2>
            <p style="color: #ef4444;">${err.message}</p>
            <a href="/" style="color: #f59e0b; text-decoration: underline;">Kembali ke Beranda</a>
        </div>
    `);
});

// Start Server & Initialize Database
if (process.env.VERCEL !== '1') {
    app.listen(PORT, async () => {
        console.log('==========================================================');
        console.log(`RESTORAN DAPUR INA AINA SERVER BERJALAN`);
        console.log(`Akses Aplikasi: http://localhost:${PORT}`);
        console.log(`Portal Pelanggan: http://localhost:${PORT}/menu`);
        console.log(`Kasir & Admin: http://localhost:${PORT}/login`);
        console.log('==========================================================');

        // Auto Migration & Sample Seeding
        await initDatabase();
    });
} else {
    // Inisialisasi Database di environment Vercel
    initDatabase().catch(err => console.error('Database Init Error:', err));
}

module.exports = app;
