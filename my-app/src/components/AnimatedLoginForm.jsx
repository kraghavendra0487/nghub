import { useState } from 'react';
import { validateEmail, validatePassword, handleApiError, showErrorToast, showSuccessToast } from '../utils/errorHandler';

const AnimatedLoginForm = ({ onLogin, onForgotPassword }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate form data
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    // Validate email format
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    // Validate password
    if (!validatePassword(formData.password)) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting login with:', { email: formData.email });
      
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password
        }),
      });

      console.log('Login response status:', response.status);

      const data = await response.json();
      console.log('Login response data:', data);

      if (response.ok) {
        localStorage.setItem('token', data.token);
        showSuccessToast('Login successful!');
        if (onLogin) onLogin(data.user);
      } else {
        const errorMessage = data.error || 'Login failed';
        setError(errorMessage);
        showErrorToast(errorMessage);
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = handleApiError(err, 'Login failed. Please try again.');
      setError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handleForgotPassword = () => {
    if (onForgotPassword) {
      onForgotPassword();
    }
  };


  return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-4 font-sans">
      {/* Main Login Card */}
      <div className="w-full max-w-lg sm:max-w-xl md:max-w-2xl">
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 lg:p-12">
          
          {/* Logo */}
          <div className="text-center mb-6">
            <img 
              src="https://pub-8f7d5f81a3294be18dbe97ddb794a4ae.r2.dev/logo.png" 
              alt="Company Logo" 
              className="mx-auto h-16 w-auto object-contain"
            />
          </div>
          
          {/* Header */}
          <div className="text-center mb-8 lg:mb-10">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 text-[#FCA600]">
              Welcome Back
            </h1>
            <p className="text-gray-500 text-sm sm:text-base lg:text-lg">Sign in to your account</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8 max-w-md mx-auto">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 sm:py-4 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all duration-200 text-sm sm:text-base"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 sm:py-4 pr-12 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all duration-200 text-sm sm:text-base"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-3 sm:py-4 px-6 rounded-lg font-semibold bg-[#FCB72D] hover:bg-yellow-500 transition-all duration-300 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/50 disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  <span>Signing In...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Forgot Password Link */}
            {onForgotPassword && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm font-medium text-[#FF6B6B] hover:underline transition-colors duration-300"
                >
                  Forgot your password?
                </button>
              </div>
            )}
          </form>

        </div>
      </div>
    </div>
  )
}

export default AnimatedLoginForm
