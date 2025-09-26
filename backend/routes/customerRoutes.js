const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const CustomerController = require('../controllers/customerController');

const router = express.Router();

// All routes are protected
router.use(protect);

// Admin routes
router.get('/', authorize('admin'), CustomerController.getAllCustomers);
router.get('/search', authorize('admin'), CustomerController.searchCustomers);
router.post('/', authorize('admin'), CustomerController.createCustomer);
router.get('/:id', authorize('admin'), CustomerController.getCustomerById);
router.put('/:id', authorize('admin'), CustomerController.updateCustomer);
router.delete('/:id', authorize('admin'), CustomerController.deleteCustomer);

// Employee routes
router.get('/employee/:employeeId', authorize('employee'), CustomerController.getCustomersByEmployeeId);

module.exports = router;
