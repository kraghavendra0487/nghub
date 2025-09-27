const express = require('express');
const ClaimController = require('../controllers/claimController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Read operations for authenticated users
router.get('/', protect, authorize('admin', 'employee'), ClaimController.getAllClaims);
router.get('/:id', protect, authorize('admin', 'employee'), ClaimController.getClaimById);
router.get('/status/:status', protect, authorize('admin', 'employee'), ClaimController.getClaimsByStatus);
router.get('/card/:cardId', protect, authorize('admin', 'employee'), ClaimController.getClaimsByCardId);
router.get('/customer/:customerId', protect, authorize('admin', 'employee'), ClaimController.getClaimsByCustomerId);
router.get('/employee/:employeeId', protect, authorize('admin', 'employee'), ClaimController.getClaimsByEmployeeId);

// Write operations restricted to admin
router.post('/', protect, authorize('admin'), ClaimController.createClaim);
router.put('/:id', protect, authorize('admin'), ClaimController.updateClaim);
router.delete('/:id', protect, authorize('admin'), ClaimController.deleteClaim);

module.exports = router;
