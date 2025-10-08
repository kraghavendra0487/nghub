const express = require('express');
const router = express.Router();
const ClientServiceController = require('../controllers/clientServiceController');
const { protect } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);

// Client Services routes
router.get('/', ClientServiceController.getAllClientServices);
router.get('/statuses', ClientServiceController.getServiceStatuses);
router.get('/services/:id', ClientServiceController.getServiceItemById);
router.put('/services/:id', ClientServiceController.updateServiceItem);
router.delete('/services/:id', ClientServiceController.deleteServiceItem);
router.get('/:id/services', ClientServiceController.getClientServices);
router.post('/:id/services', ClientServiceController.addClientService);
router.get('/:id', ClientServiceController.getClientServiceById);
router.post('/', ClientServiceController.createClientService);
router.put('/:id', ClientServiceController.updateClientService);
router.delete('/:id', ClientServiceController.deleteClientService);

module.exports = router;