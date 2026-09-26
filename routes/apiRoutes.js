const express = require('express');
const router = express.Router();
const ApiController = require('../controllers/ApiController');

router.get('/api/products', ApiController.getProducts);
router.get('/api/order/:id', ApiController.getOrder);
router.post('/api/quick_stock', ApiController.quickStock);
router.get('/api/error_demo', ApiController.errorDemo);

// Midtrans Payment Gateway Endpoints
router.post('/api/midtrans/token/:id', ApiController.getMidtransToken);
router.post('/api/midtrans/finish', ApiController.midtransFinish);
router.post('/api/midtrans/notification', ApiController.midtransNotification);

module.exports = router;
