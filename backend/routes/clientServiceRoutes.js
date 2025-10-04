const express = require('express');
const { ClientServiceController, upload } = require('../controllers/clientServiceController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware.protect);

// Admin-only routes
router.use(authMiddleware.authorize('admin'));

// POST /api/client-services/upload - Upload CSV file and bulk create client services
router.post('/upload', (req, res, next) => {
  console.log('📁 Upload route hit');
  console.log('📁 Request headers:', req.headers);
  console.log('📁 Content-Type:', req.headers['content-type']);
  
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.log('❌ Multer error:', err.message);
      console.log('❌ Multer error code:', err.code);
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }
    console.log('📁 Multer processing completed, file:', req.file);
    next();
  });
}, ClientServiceController.uploadCSVorXLS);

// GET /api/client-services/export - Export client services to CSV
router.get('/export', ClientServiceController.exportToCSV);

// ===== STATIC ROUTES (must come before dynamic routes) =====

// GET /api/client-services/service-statuses - Get predefined service statuses for dropdowns
router.get('/service-statuses', ClientServiceController.getServiceStatuses);

// GET /api/client-services/available-services - Get predefined services list for dropdowns
router.get('/available-services', ClientServiceController.getAvailableServices);

// GET /api/client-services/distinct/:column - Get distinct values for filter dropdowns
router.get('/distinct/:column', ClientServiceController.getDistinctValues);

// GET /api/client-services - Get all client services with pagination and filtering
router.get('/', ClientServiceController.getAllClientServices);

// ===== DYNAMIC ROUTES (must come after static routes) =====

// GET /api/client-services/:id - Get client service by ID (only numeric IDs)
router.get('/:id([0-9]+)', ClientServiceController.getClientServiceById);

// POST /api/client-services - Create new client service
router.post('/', ClientServiceController.createClientService);

// PUT /api/client-services/:id - Update client service (only numeric IDs)
router.put('/:id([0-9]+)', ClientServiceController.updateClientService);

// DELETE /api/client-services/:id - Delete client service (only numeric IDs)
router.delete('/:id([0-9]+)', ClientServiceController.deleteClientService);

// ===== SERVICE ITEM MANAGEMENT ROUTES =====

// GET /api/client-services/:clientServiceId/services - Get all service items for a client
router.get('/:clientServiceId([0-9]+)/services', ClientServiceController.getServiceItems);

// POST /api/client-services/:clientServiceId/services - Create new service item
router.post('/:clientServiceId([0-9]+)/services', ClientServiceController.createServiceItem);

// PUT /api/client-services/services/:id - Update service item
router.put('/services/:id([0-9]+)', ClientServiceController.updateServiceItem);

// DELETE /api/client-services/services/:id - Delete service item
router.delete('/services/:id([0-9]+)', ClientServiceController.deleteServiceItem);

module.exports = router;
