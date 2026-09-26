const express = require('express');
const router = express.Router();
const LaporanController = require('../controllers/LaporanController');
const { requireAuth } = require('../middlewares/auth');

router.get('/laporan', requireAuth, LaporanController.index);
router.get('/cetak_laporan', requireAuth, LaporanController.cetak);
router.get('/download_laporan', requireAuth, LaporanController.downloadPdf);


module.exports = router;
