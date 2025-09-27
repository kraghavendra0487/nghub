const express = require('express');
const CustomerController = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Read operations available to authenticated users
router.get('/', protect, authorize('admin', 'employee'), CustomerController.getAllCustomers);
router.get('/search', protect, authorize('admin', 'employee'), CustomerController.searchCustomers);
router.get('/employee/:employeeId', protect, authorize('admin', 'employee'), CustomerController.getCustomersByEmployeeId);
router.get('/:id', protect, authorize('admin', 'employee'), CustomerController.getCustomerById);

// Write operations: employees can create/update customers, only admins can delete
router.post('/', protect, authorize('admin', 'employee'), CustomerController.createCustomer);
router.put('/:id', protect, authorize('admin', 'employee'), CustomerController.updateCustomer);
router.delete('/:id', protect, authorize('admin'), CustomerController.deleteCustomer);

module.exports = router;
