const AuthService = require('../services/authService');

class AuthController {
  // Login user
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      console.log('🔐 Login attempt:', { email: email ? 'provided' : 'missing', password: password ? 'provided' : 'missing' });

      // Validate input
      if (!email || !password) {
        console.log('❌ Missing credentials:', { email: !!email, password: !!password });
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Attempt login
      const result = await AuthService.login(email.trim(), password);

      console.log('✅ Login successful for user:', email, 'Role:', result.user.role);

      res.json({
        message: 'Login successful',
        token: result.token,
        user: result.user
      });
    } catch (error) {
      console.log("❌ Login error:", error.message);
      res.status(400).json({ error: error.message });
    }
  }

  // Register user
  static async register(req, res) {
    try {
      const { employee_id, name, email, contact, password, role } = req.body;

      console.log('📝 Registration attempt:', { email: email ? 'provided' : 'missing', name: name ? 'provided' : 'missing' });

      // Validate input
      if (!name || !email || !contact || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      // Attempt registration
      const result = await AuthService.register({
        employee_id,
        name,
        email: email.trim(),
        contact,
        password,
        role: role || 'employee'
      });

      console.log('✅ Registration successful for user:', email);

      res.status(201).json({
        message: 'Registration successful',
        token: result.token,
        user: result.user
      });
    } catch (error) {
      console.log("❌ Registration error:", error.message);
      res.status(400).json({ error: error.message });
    }
  }

  // Get user profile
  static async getProfile(req, res) {
    try {
      const result = await AuthService.getProfile(req.user.id);
      res.json(result);
    } catch (error) {
      console.log("❌ Get profile error:", error.message);
      res.status(404).json({ error: error.message });
    }
  }

  // Verify token
  static async verifyToken(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decoded = AuthService.verifyToken(token);
      res.json({ valid: true, userId: decoded.userId });
    } catch (error) {
      console.log("❌ Token verification error:", error.message);
      res.status(401).json({ error: 'Invalid token' });
    }
  }
}

module.exports = AuthController;
