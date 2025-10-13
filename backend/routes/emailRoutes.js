const express = require('express');
const EmailController = require('../controllers/emailController');

const router = express.Router();

// POST /api/email/send - Send custom email
router.post('/send', EmailController.sendEmail);

module.exports = router;

