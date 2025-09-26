const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const AuthController = require('../controllers/authController');

const router = express.Router();

// Public routes
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.get('/verify', AuthController.verifyToken);

// Protected routes
router.get('/profile', protect, AuthController.getProfile);

module.exports = router;
