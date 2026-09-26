const express = require('express');
const router = express.Router();
const TransaksiController = require('../controllers/TransaksiController');
const { requireAuth } = require('../middlewares/auth');

router.get('/transaksi', TransaksiController.index);
router.post('/checkout', TransaksiController.checkout);
router.get('/billing/:id', TransaksiController.billing);
router.post('/proses_bayar', TransaksiController.prosesBayar);
router.get('/riwayat', requireAuth, TransaksiController.riwayat);
router.post('/riwayat/hapus/:id', requireAuth, TransaksiController.hapus);
router.get('/cetak/:id', TransaksiController.cetak);

module.exports = router;
