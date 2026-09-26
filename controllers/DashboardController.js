/**
 * Controller Dashboard Admin
 */
const Pesanan = require('../models/Pesanan');
const Produk = require('../models/Produk');

class DashboardController {
    static async index(req, res) {
        try {
            const stats = await Pesanan.getDashboardStats();
            const lowStockItems = await Produk.getLowStockAlerts(5);

            res.render('dashboard/index', {
                title: 'Dashboard Admin - Dapur Ina',
                stats,
                lowStockItems
            });
        } catch (err) {
            console.error('Error Dashboard:', err);
            req.session.flash_error = 'Gagal memuat data dashboard: ' + err.message;
            res.render('dashboard/index', {
                title: 'Dashboard Admin - Dapur Ina',
                stats: {
                    omset_hari_ini: 0,
                    transaksi_hari_ini: 0,
                    total_pendapatan: 0,
                    total_transaksi: 0,
                    total_menunggu: 0,
                    total_menu: 0,
                    menu_menipis: 0,
                    top_menu: [],
                    recent_transaksi: [],
                    chart_7_days: { labels: [], omset: [], transaksi: [] },
                    chart_monthly: { labels: [], omset: [], transaksi: [] }
                },
                lowStockItems: []
            });
        }
    }
}

module.exports = DashboardController;
