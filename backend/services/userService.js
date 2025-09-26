const User = require('../models/User');

class UserService {
  // Get all users
  static async getAllUsers() {
    try {
      const users = await User.findAll();
      return { users };
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  // Get user by ID
  static async getUserById(id) {
    try {
      const user = await User.findById(id);
      if (!user) {
        throw new Error('User not found');
      }
      return { user };
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  // Create user
  static async createUser(userData) {
    try {
      // Check if user already exists
      const existingUser = await User.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      const user = await User.create(userData);
      return { user };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Update user
  static async updateUser(id, userData) {
    try {
      const user = await User.update(id, userData);
      if (!user) {
        throw new Error('User not found');
      }
      return { user };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user
  static async deleteUser(id) {
    try {
      const user = await User.delete(id);
      if (!user) {
        throw new Error('User not found');
      }
      return { message: 'User deleted successfully' };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Get users by role
  static async getUsersByRole(role) {
    try {
      const users = await User.findByRole(role);
      return { users };
    } catch (error) {
      console.error('Error getting users by role:', error);
      throw error;
    }
  }

  // Get employees
  static async getEmployees() {
    try {
      const users = await User.findByRole('employee');
      return { users };
    } catch (error) {
      console.error('Error getting employees:', error);
      throw error;
    }
  }
}

module.exports = UserService;
