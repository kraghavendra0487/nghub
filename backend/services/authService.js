const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthService {
  // Generate JWT token
  static generateToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
  }

  // Hash password
  static async hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  // Compare password
  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Login user
  static async login(email, password) {
    try {
      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check password
      const isValidPassword = await this.comparePassword(password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Generate token
      const token = this.generateToken(user.id);

      // Return user data (without password) and token
      const userForClient = {
        id: user.id,
        employee_id: user.employee_id,
        name: user.name,
        email: user.email,
        contact: user.contact,
        role: user.role
      };

      return {
        token,
        user: userForClient
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Register user
  static async register(userData) {
    try {
      const { employee_id, name, email, contact, password, role } = userData;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create user
      const user = await User.create({
        employee_id,
        name,
        email,
        contact,
        password: hashedPassword,
        role: role || 'employee'
      });

      // Generate token
      const token = this.generateToken(user.id);

      // Return user data (without password) and token
      const userForClient = {
        id: user.id,
        employee_id: user.employee_id,
        name: user.name,
        email: user.email,
        contact: user.contact,
        role: user.role
      };

      return {
        token,
        user: userForClient
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Get user profile
  static async getProfile(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return { user };
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  // Verify token
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

module.exports = AuthService;
