const UserService = require('../services/userService');

class UserController {
  // Get all users
  static async getAllUsers(req, res) {
    try {
      const result = await UserService.getAllUsers();
      res.json(result);
    } catch (error) {
      console.error('❌ Error getting all users:', error.message);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  // Get user by ID
  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      const result = await UserService.getUserById(id);
      res.json(result);
    } catch (error) {
      console.error('❌ Error getting user by ID:', error.message);
      if (error.message === 'User not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch user' });
      }
    }
  }

  // Create user
  static async createUser(req, res) {
    try {
      const userData = req.body;
      const result = await UserService.createUser(userData);
      res.status(201).json(result);
    } catch (error) {
      console.error('❌ Error creating user:', error.message);
      if (error.message === 'User with this email already exists') {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to create user' });
      }
    }
  }

  // Update user
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const userData = req.body;
      const result = await UserService.updateUser(id, userData);
      res.json(result);
    } catch (error) {
      console.error('❌ Error updating user:', error.message);
      if (error.message === 'User not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update user' });
      }
    }
  }

  // Delete user
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const result = await UserService.deleteUser(id);
      res.json(result);
    } catch (error) {
      console.error('❌ Error deleting user:', error.message);
      if (error.message === 'User not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to delete user' });
      }
    }
  }

  // Get employees
  static async getEmployees(req, res) {
    try {
      const result = await UserService.getEmployees();
      res.json(result);
    } catch (error) {
      console.error('❌ Error getting employees:', error.message);
      res.status(500).json({ error: 'Failed to fetch employees' });
    }
  }
}

module.exports = UserController;
