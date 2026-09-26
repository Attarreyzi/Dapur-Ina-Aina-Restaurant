const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { redirectIfAuthenticated } = require('../middlewares/auth');

router.get('/login', redirectIfAuthenticated, AuthController.showLogin);
router.post('/login', redirectIfAuthenticated, AuthController.processLogin);
router.get('/logout', AuthController.logout);
router.post('/logout', AuthController.logout);

module.exports = router;
