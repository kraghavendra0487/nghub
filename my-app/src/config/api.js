// API Configuration
const getApiBaseUrl = () => {
  // Check for environment variable first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Check if we're in production mode
  if (import.meta.env.PROD) {
    // In production, use the same domain as the frontend
    return 'https://nghub.onrender.com';
  }
  
  // Development mode - use localhost
  return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

export default API_BASE_URL;
