const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const UserController = require('../controllers/userController');

const router = express.Router();

// All routes are protected
router.use(protect);

// Admin only routes
router.get('/', authorize('admin'), UserController.getAllUsers);
router.get('/employees', authorize('admin'), UserController.getEmployees);
router.post('/', authorize('admin'), UserController.createUser);
router.get('/:id', authorize('admin'), UserController.getUserById);
router.put('/:id', authorize('admin'), UserController.updateUser);
router.delete('/:id', authorize('admin'), UserController.deleteUser);

module.exports = router;
