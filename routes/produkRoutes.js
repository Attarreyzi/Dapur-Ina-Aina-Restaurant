const express = require('express');
const router = express.Router();
const ProdukController = require('../controllers/ProdukController');
const { requireAuth } = require('../middlewares/auth');

router.get('/stok', requireAuth, ProdukController.index);
router.post('/simpan_produk', requireAuth, ProdukController.store);
router.post('/update_produk', requireAuth, ProdukController.update);
router.post('/update_stok_quick', requireAuth, ProdukController.quickStock);
router.get('/hapus_produk/:id', requireAuth, ProdukController.delete);
router.post('/hapus_produk', requireAuth, ProdukController.delete);

module.exports = router;
