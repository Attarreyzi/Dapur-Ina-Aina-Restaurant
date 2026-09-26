/**
 * Controller Transaksi Kasir & POS
 */
const Produk = require('../models/Produk');
const Pesanan = require('../models/Pesanan');
const Pembayaran = require('../models/Pembayaran');
const Kategori = require('../models/Kategori');

class TransaksiController {
    /**
     * Halaman POS / Katalog Kasir
     */
    static async index(req, res) {
        try {
            const kategoriFilter = req.query.kategori || null;
            const search = req.query.search || null;

            const produkList = await Produk.getAll({
                kategori: kategoriFilter,
                statusStok: null, // tampilkan semua, status habis dihandle visual
                search
            });

            const categories = Kategori.getAll();
            const pendingOrders = await Pesanan.getAll({ status: 'Menunggu' });
            const pendingCount = pendingOrders ? pendingOrders.length : 0;

            res.render('transaksi/katalog', {
                title: 'Kasir POS - Dapur Ina',
                produkList,
                categories,
                kategoriFilter,
                search,
                pendingCount
            });
        } catch (err) {
            req.session.flash_error = 'Gagal memuat katalog kasir: ' + err.message;
            res.redirect('/dashboard');
        }
    }

    /**
     * Checkout Pesanan dari Kasir POS
     */
    static async checkout(req, res) {
        try {
            const { nomor_meja, nama_pelanggan, no_telepon, alamat, catatan, cart_data } = req.body;

            let items = [];
            if (typeof cart_data === 'string') {
                items = JSON.parse(cart_data || '[]');
            } else if (Array.isArray(cart_data)) {
                items = cart_data;
            }

            if (!items || items.length === 0) {
                req.session.flash_error = 'Keranjang belanja kasir masih kosong.';
                return res.redirect('/transaksi');
            }

            const headerData = {
                nomor_meja: nomor_meja || 'Meja 01',
                nama_pelanggan: nama_pelanggan || 'Pelanggan Walk-In',
                no_telepon: no_telepon || '-',
                alamat: alamat || 'Dine In',
                catatan: catatan || ''
            };

            const createdOrder = await Pesanan.createOrder(headerData, items);

            req.session.flash_success = `Pesanan ${createdOrder.no_pesanan} berhasil dibuat! silahkan lanjutkan pembayaran.`;
            return res.redirect(`/billing/${createdOrder.id_pesanan}`);
        } catch (err) {
            req.session.flash_error = 'Gagal membuat pesanan: ' + err.message;
            return res.redirect('/transaksi');
        }
    }

    /**
     * Halaman Billing / Kasir Pembayaran
     */
    static async billing(req, res) {
        try {
            const idPesanan = parseInt(req.params.id, 10);
            if (isNaN(idPesanan)) {
                req.session.flash_error = 'ID Pesanan tidak valid.';
                return res.redirect('/transaksi');
            }

            const order = await Pesanan.getById(idPesanan);
            if (!order) {
                req.session.flash_error = 'Pesanan tidak ditemukan.';
                return res.redirect('/transaksi');
            }

            res.render('transaksi/billing', {
                title: `Billing ${order.no_pesanan} - Dapur Ina`,
                order
            });
        } catch (err) {
            req.session.flash_error = 'Gagal memuat halaman billing: ' + err.message;
            res.redirect('/transaksi');
        }
    }

    /**
     * Proses Pembayaran Transaksi
     */
    static async prosesBayar(req, res) {
        try {
            const { id_pesanan, metode_pembayaran, uang_diterima, no_referensi } = req.body;

            const hasil = await Pembayaran.prosesPembayaran({
                id_pesanan,
                metode_pembayaran,
                uang_diterima,
                no_referensi
            });

            req.session.flash_success = `Pembayaran ${hasil.no_pesanan} (${hasil.metode_pembayaran}) berhasil diSelesaikan!`;
            return res.redirect(`/cetak/${hasil.id_pesanan}`);
        } catch (err) {
            req.session.flash_error = 'Gagal memproses pembayaran: ' + err.message;
            return res.redirect(`/billing/${req.body.id_pesanan || ''}`);
        }
    }

    /**
     * Halaman Riwayat Transaksi
     */
    static async riwayat(req, res) {
        try {
            const { start_date, end_date, metode, search } = req.query;

            const listTransaksi = await Pembayaran.getRiwayat({
                startDate: start_date,
                endDate: end_date,
                metode,
                search
            });

            res.render('transaksi/riwayat', {
                title: 'Riwayat Transaksi - Dapur Ina',
                listTransaksi,
                startDate: start_date || '',
                endDate: end_date || '',
                metode: metode || '',
                search: search || ''
            });
        } catch (err) {
            req.session.flash_error = 'Gagal memuat riwayat transaksi: ' + err.message;
            res.redirect('/dashboard');
        }
    }

    /**
     * Halaman Cetak Struk
     */
    static async cetak(req, res) {
        try {
            const idPesanan = parseInt(req.params.id, 10);
            const order = await Pesanan.getById(idPesanan);

            if (!order) {
                req.session.flash_error = 'Struk pesanan tidak ditemukan.';
                return res.redirect('/riwayat');
            }

            res.render('transaksi/cetak_struk', {
                title: `Struk Pembayaran ${order.no_pesanan}`,
                order
            });
        } catch (err) {
            req.session.flash_error = 'Gagal mencetak struk: ' + err.message;
            res.redirect('/riwayat');
        }
    }

    /**
     * Hapus Riwayat Pesanan
     */
    static async hapus(req, res) {
        try {
            const idPesanan = parseInt(req.params.id, 10);
            if (!idPesanan) {
                throw new Error('ID Pesanan tidak valid.');
            }

            await Pesanan.delete(idPesanan);
            req.session.flash_success = 'Riwayat pesanan berhasil dihapus.';
            res.redirect('/riwayat');
        } catch (err) {
            req.session.flash_error = 'Gagal menghapus riwayat pesanan: ' + err.message;
            res.redirect('/riwayat');
        }
    }
}

module.exports = TransaksiController;
