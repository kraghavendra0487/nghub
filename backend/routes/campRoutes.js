const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const CampController = require('../controllers/campController');

const router = express.Router();

// All routes are protected
router.use(protect);

// Admin routes
router.get('/', authorize('admin'), CampController.getAllCamps);
router.get('/search', authorize('admin'), CampController.searchCamps);
router.post('/', authorize('admin'), CampController.createCamp);
router.get('/:id', authorize('admin'), CampController.getCampById);
router.put('/:id', authorize('admin'), CampController.updateCamp);
router.delete('/:id', authorize('admin'), CampController.deleteCamp);
router.get('/status/:status', authorize('admin'), CampController.getCampsByStatus);

// Employee routes
router.get('/employee/:employeeId', authorize('employee'), CampController.getCampsByEmployeeId);

module.exports = router;
