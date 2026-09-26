/**
 * Controller Portal Pelanggan (Customer Ordering Portal)
 */
const Produk = require('../models/Produk');
const Pesanan = require('../models/Pesanan');
const Kategori = require('../models/Kategori');
const { createSnapTransaction } = require('../config/midtrans');

class UserController {
    /**
     * Halaman Menu Pelanggan (Dine-in / Online Order)
     */
    static async menu(req, res) {
        try {
            const kategoriFilter = req.query.kategori || null;
            const search = req.query.search || null;

            const produkList = await Produk.getAll({
                kategori: kategoriFilter,
                statusStok: null,
                search
            });

            const categories = Kategori.getAll();

            res.render('user/menu', {
                title: 'Buku Menu - Dapur Ina Aina',
                produkList,
                categories,
                kategoriFilter,
                search
            });
        } catch (err) {
            console.error('Error user menu:', err);
            res.status(500).send('Terjadi kesalahan memuat menu: ' + err.message);
        }
    }

    /**
     * Halaman Keranjang & Pembayaran Terpisah (Dedicated Cart & Checkout)
     */
    static async keranjang(req, res) {
        try {
            res.render('user/keranjang', {
                title: 'Keranjang & Pembayaran - Dapur Ina Aina'
            });
        } catch (err) {
            console.error('Error keranjang:', err);
            res.redirect('/menu');
        }
    }

    /**
     * Checkout Pesanan oleh Pelanggan
     */
    static async checkout(req, res) {
        try {
            const { nomor_meja, nama_pelanggan, no_telepon, alamat, catatan, cart_data, metode_pembayaran } = req.body;

            // Validasi nama pelanggan wajib diisi
            if (!nama_pelanggan || !nama_pelanggan.trim()) {
                req.session.flash_error = 'Nama Pemesan wajib diisi untuk memproses pesanan.';
                return res.redirect('/menu');
            }

            let items = [];
            if (typeof cart_data === 'string') {
                items = JSON.parse(cart_data || '[]');
            } else if (Array.isArray(cart_data)) {
                items = cart_data;
            }

            if (!items || items.length === 0) {
                req.session.flash_error = 'Keranjang belanja Anda masih kosong. silahkan pilih menu terlebih dahulu.';
                return res.redirect('/keranjang');
            }

            // Validasi batasan porsi pesanan meja
            for (const item of items) {
                const qty = parseInt(item.jumlah, 10);
                if (isNaN(qty) || qty <= 0) {
                    req.session.flash_error = 'Jumlah pesanan tidak valid.';
                    return res.redirect('/keranjang');
                }
                if (qty > 20) {
                    req.session.flash_error = `Batas maksimal pemesanan adalah 20 porsi per menu (menu '${item.nama_produk || 'item'}' dipesan ${qty} porsi). Hubungi kasir untuk pesanan porsi besar.`;
                    return res.redirect('/keranjang');
                }
            }

            const totalPorsi = items.reduce((sum, it) => sum + parseInt(it.jumlah, 10), 0);
            if (totalPorsi > 60) {
                req.session.flash_error = 'Total pesanan melebihi batas maksimal meja (maksimal 60 porsi per transaksi).';
                return res.redirect('/keranjang');
            }

            const cleanCatatan = catatan ? catatan.trim() : '';
            const cleanPhone = (no_telepon || '').replace(/[^0-9]/g, '').trim() || '-';

            const headerData = {
                nomor_meja: nomor_meja || 'Meja 01',
                nama_pelanggan: nama_pelanggan.trim(),
                no_telepon: cleanPhone,
                alamat: alamat || 'Dine In',
                catatan: cleanCatatan,
                metode_pembayaran: 'menunggu'
            };

            const createdOrder = await Pesanan.createOrder(headerData, items);

            // Simpan ID pesanan terakhir di session pelanggan agar bisa dipantau
            req.session.lastOrderId = createdOrder.id_pesanan;

            // Generate Snap token lebih awal agar siap instan jika nanti pelanggan memilih QRIS
            try {
                const snapRes = await createSnapTransaction({
                    order: createdOrder,
                    items: createdOrder.items,
                    customer: headerData
                });
                if (snapRes && snapRes.token) {
                    await Pesanan.updateSnapToken(createdOrder.id_pesanan, snapRes.token);
                }
            } catch (snapErr) {
                console.error('Midtrans token generation error on checkout:', snapErr.message);
            }

            req.session.flash_success = `Pesanan (${createdOrder.no_pesanan}) berhasil dibuat! Silakan selesaikan pembayaran via QRIS atau di Kasir.`;
            return res.redirect(`/pesanan/${createdOrder.id_pesanan}`);
        } catch (err) {
            req.session.flash_error = 'Gagal mengirim pesanan: ' + err.message;
            return res.redirect('/menu');
        }
    }

    /**
     * Halaman Status Pesanan Pelanggan
     */
    static async pesananSaya(req, res) {
        try {
            let idPesanan = parseInt(req.params.id || req.session.lastOrderId, 10);

            if (!idPesanan || isNaN(idPesanan)) {
                // Cari pesanan terakhir dari database jika belum ada di session
                const latestOrders = await Pesanan.getAll({ limit: 1 });
                if (latestOrders && latestOrders.length > 0) {
                    idPesanan = latestOrders[0].id_pesanan;
                }
            }

            if (!idPesanan) {
                req.session.flash_error = 'Belum ada pesanan aktif. silahkan pilih menu dan lakukan pemesanan.';
                return res.redirect('/menu');
            }

            const order = await Pesanan.getById(idPesanan);
            if (!order) {
                req.session.flash_error = 'Pesanan tidak ditemukan.';
                return res.redirect('/menu');
            }

            // Auto-konfirmasi jika redirect kembali dari Midtrans (payment=success atau settlement)
            const paymentSuccess = req.query.payment === 'success' || req.query.transaction_status === 'settlement' || req.query.transaction_status === 'capture';
            if (paymentSuccess && order.status_pesanan !== 'Selesai') {
                try {
                    const Pembayaran = require('../models/Pembayaran');
                    const refNo = req.query.order_id || req.query.transaction_id || `MID-${order.id_pesanan}-${Date.now().toString().slice(-4)}`;
                    await Pembayaran.prosesPembayaran({
                        id_pesanan: order.id_pesanan,
                        metode_pembayaran: 'non_tunai',
                        uang_diterima: order.total_harga,
                        no_referensi: refNo
                    });
                    order.status_pesanan = 'Selesai';
                } catch (payErr) {
                    console.warn('Auto confirm pesanan failed:', payErr.message);
                }
            }

            // Jika pesanan masih Menunggu dan belum memiliki snap_token, buatkan otomatis
            if (order.status_pesanan === 'Menunggu' && !order.snap_token) {
                try {
                    const snapRes = await createSnapTransaction({
                        order,
                        items: order.items,
                        customer: {
                            nama: order.nama_pelanggan,
                            no_telepon: order.no_telepon,
                            nomor_meja: order.nomor_meja
                        }
                    });
                    if (snapRes && snapRes.token) {
                        order.snap_token = snapRes.token;
                        await Pesanan.updateSnapToken(order.id_pesanan, snapRes.token);
                    }
                } catch (e) {
                    console.warn('Gagal generate token snap di status pesanan:', e.message);
                }
            }

            res.render('user/pesanan_saya', {
                title: `Status Pesanan ${order.no_pesanan} - Dapur Ina`,
                order,
                autoPay: req.query.pay === 'midtrans'
            });
        } catch (err) {
            req.session.flash_error = 'Gagal memuat status pesanan: ' + err.message;
            res.redirect('/menu');
        }
    }
}

module.exports = UserController;
