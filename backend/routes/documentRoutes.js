const express = require('express');
const router = express.Router();
const { DocumentController, upload, uploadMiddleware } = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);

// Document routes
router.post('/service/:serviceId/upload', uploadMiddleware, DocumentController.uploadDocuments);
router.get('/service/:serviceId', DocumentController.getServiceDocuments);
router.get('/:documentId', DocumentController.getDocument);
router.get('/:documentId/signed-url', DocumentController.getSignedUrl);
router.delete('/:documentId', DocumentController.deleteDocument);
router.get('/', DocumentController.getAllDocuments);

module.exports = router;
