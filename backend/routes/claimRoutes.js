const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const ClaimController = require('../controllers/claimController');

const router = express.Router();

// All routes are protected
router.use(protect);

// Admin routes
router.get('/', authorize('admin'), ClaimController.getAllClaims);
router.get('/:id', authorize('admin'), ClaimController.getClaimById);
router.post('/', authorize('admin'), ClaimController.createClaim);
router.put('/:id', authorize('admin'), ClaimController.updateClaim);
router.delete('/:id', authorize('admin'), ClaimController.deleteClaim);
router.get('/status/:status', authorize('admin'), ClaimController.getClaimsByStatus);

// Employee routes
router.get('/card/:cardId', authorize('employee'), ClaimController.getClaimsByCardId);
router.get('/customer/:customerId', authorize('employee'), ClaimController.getClaimsByCustomerId);
router.get('/employee/:employeeId', authorize('employee'), ClaimController.getClaimsByEmployeeId);

module.exports = router;
