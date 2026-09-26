const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/DashboardController');
const { requireAuth } = require('../middlewares/auth');

router.get('/dashboard', requireAuth, DashboardController.index);
router.get('/error_demo', (req, res) => {
    res.render('error_demo', { title: 'Demonstrasi Exception Handling LSP - Dapur Ina' });
});

module.exports = router;
