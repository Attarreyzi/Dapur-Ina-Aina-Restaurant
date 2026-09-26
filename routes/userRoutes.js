const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');

// Halaman utama / customer menu
router.get('/', (req, res) => res.redirect('/menu'));
router.get('/menu', UserController.menu);
router.get('/keranjang', UserController.keranjang);
router.post('/user_checkout', UserController.checkout);
router.get('/pesanan', UserController.pesananSaya);
router.get('/pesanan/:id', UserController.pesananSaya);

module.exports = router;
