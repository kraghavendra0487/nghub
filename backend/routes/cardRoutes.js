const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const CardController = require('../controllers/cardController');

const router = express.Router();

// All routes are protected
router.use(protect);

// Admin routes
router.get('/', authorize('admin'), CardController.getAllCards);
router.get('/:id', authorize('admin'), CardController.getCardById);
router.post('/', authorize('admin'), CardController.createCard);
router.put('/:id', authorize('admin'), CardController.updateCard);
router.delete('/:id', authorize('admin'), CardController.deleteCard);

// Employee routes
router.get('/customer/:customerId', authorize('employee'), CardController.getCardByCustomerId);
router.get('/employee/:employeeId', authorize('employee'), CardController.getCardsByEmployeeId);

module.exports = router;
