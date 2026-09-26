/**
 * Controller API JSON Endpoints
 */
const Produk = require('../models/Produk');
const Pesanan = require('../models/Pesanan');
const Pembayaran = require('../models/Pembayaran');

class ApiController {
    static async getProducts(req, res) {
        try {
            const { kategori, search, status } = req.query;
            const items = await Produk.getAll({
                kategori,
                statusStok: status,
                search
            });
            res.json({ success: true, count: items.length, data: items });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    static async getOrder(req, res) {
        try {
            const id = parseInt(req.params.id, 10);
            const order = await Pesanan.getById(id);
            if (!order) {
                return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
            }
            res.json({ success: true, data: order });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    static async quickStock(req, res) {
        try {
            const { id_produk, delta, exact } = req.body;
            const id = parseInt(id_produk, 10);
            const prod = await Produk.getById(id);
            if (!prod) {
                return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
            }

            let newStock = prod.stok;
            if (exact !== undefined) {
                newStock = parseInt(exact, 10);
            } else if (delta !== undefined) {
                newStock = prod.stok + parseInt(delta, 10);
            }

            const updated = await Produk.updateStock(id, newStock);
            res.json({ success: true, data: updated });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    /**
     * Demonstrasi Exception Handling LSP
     */
    static async errorDemo(req, res) {
        const scenario = req.query.scenario || req.query.type || 'out_of_stock';
        try {
            switch (scenario) {
                case 'invalid_order':
                    throw new Error('Validasi Gagal: Keranjang belanja kosong atau ID produk tidak valid.');
                case 'out_of_stock':
                    throw new Error("Stok Habis: Stok item 'Soto Betawi' tersisa 0, transaksi tidak dapat dilanjutkan.");
                case 'insufficient_cash':
                    throw new Error('Validasi Pembayaran: Uang tunai diterima Rp 50.000 kurang dari total tagihan Rp 85.000.');
                case 'database_error':
                    throw new Error('Database Error: Koneksi ke basis data PostgreSQL terputus (ETIMEDOUT).');
                default:
                    throw new Error(`Simulasi error '${scenario}' berhasil ditangkap oleh Exception Handler.`);
            }
        } catch (err) {
            res.status(400).json({
                status: false,
                error_type: err.name || 'Error',
                message: err.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Endpoint Generate Snap Token Midtrans
     */
    static async getMidtransToken(req, res) {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id) || id <= 0) {
                return res.status(400).json({ success: false, message: 'ID Pesanan tidak valid' });
            }

            const order = await Pesanan.getById(id);
            if (!order) {
                return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
            }

            if (order.status_pesanan === 'Selesai') {
                return res.status(400).json({ success: false, message: 'Pesanan ini sudah selesai dibayar.' });
            }

            const { createSnapTransaction } = require('../config/midtrans');
            const snapRes = await createSnapTransaction({
                order,
                items: order.items,
                customer: {
                    nama: order.nama_pelanggan,
                    no_telepon: order.no_telepon,
                    nomor_meja: order.nomor_meja
                }
            });

            await Pesanan.updateSnapToken(order.id_pesanan, snapRes.token);

            res.json({
                success: true,
                token: snapRes.token,
                redirect_url: snapRes.redirect_url,
                is_mock: snapRes.is_mock,
                order_id: snapRes.order_id
            });
        } catch (err) {
            console.error('Error getMidtransToken:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    }

    /**
     * Endpoint Konfirmasi Sukses Pembayaran Midtrans dari Frontend Snap
     */
    static async midtransFinish(req, res) {
        try {
            const { id_pesanan, result } = req.body;
            const id = parseInt(id_pesanan, 10);
            if (isNaN(id) || id <= 0) {
                return res.status(400).json({ success: false, message: 'ID Pesanan tidak valid' });
            }

            const order = await Pesanan.getById(id);
            if (!order) {
                return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
            }

            if (order.status_pesanan === 'Selesai') {
                return res.json({
                    success: true,
                    message: 'Pesanan sudah dalam status Selesai.',
                    redirect: `/pesanan/${id}?payment=success`
                });
            }

            const paymentType = (result && result.payment_type) ? `midtrans_${result.payment_type}` : 'midtrans_gateway';
            const refNo = (result && (result.transaction_id || result.order_id)) || `MID-${Date.now()}`;

            const pembayaranHasil = await Pembayaran.prosesPembayaran({
                id_pesanan: id,
                metode_pembayaran: paymentType,
                uang_diterima: order.total_harga,
                no_referensi: refNo
            });

            req.session.flash_success = `Pembayaran Midtrans untuk pesanan ${order.no_pesanan} berhasil diselesaikan!`;

            res.json({
                success: true,
                message: 'Pembayaran Midtrans berhasil diproses.',
                redirect: `/pesanan/${id}?payment=success`,
                data: pembayaranHasil
            });
        } catch (err) {
            console.error('Error midtransFinish:', err);
            res.status(500).json({ success: false, message: err.message });
        }
    }

    /**
     * Endpoint Webhook Notifikasi HTTP dari Midtrans Server
     */
    static async midtransNotification(req, res) {
        try {
            const notif = req.body || {};
            const orderIdStr = notif.order_id || '';
            const transactionStatus = notif.transaction_status || '';
            const fraudStatus = notif.fraud_status || '';
            const paymentType = notif.payment_type || 'qris';

            console.log(`[Midtrans Webhook] order_id: ${orderIdStr}, status: ${transactionStatus}, type: ${paymentType}`);

            const match = orderIdStr.match(/INA-(\d+)-/);
            const idPesanan = match ? parseInt(match[1], 10) : null;

            if (idPesanan) {
                const order = await Pesanan.getById(idPesanan);
                if (order && order.status_pesanan !== 'Selesai') {
                    if (transactionStatus === 'capture') {
                        if (fraudStatus === 'accept') {
                            await Pembayaran.prosesPembayaran({
                                id_pesanan: idPesanan,
                                metode_pembayaran: `midtrans_${paymentType}`,
                                uang_diterima: order.total_harga,
                                no_referensi: notif.transaction_id || orderIdStr
                            });
                        }
                    } else if (transactionStatus === 'settlement') {
                        await Pembayaran.prosesPembayaran({
                            id_pesanan: idPesanan,
                            metode_pembayaran: `midtrans_${paymentType}`,
                            uang_diterima: order.total_harga,
                            no_referensi: notif.transaction_id || orderIdStr
                        });
                    }
                }
            }

            res.status(200).json({ status: 'OK' });
        } catch (err) {
            console.error('Error midtransNotification:', err);
            res.status(500).json({ status: 'ERROR', message: err.message });
        }
    }
}

module.exports = ApiController;
