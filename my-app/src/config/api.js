// API Configuration
const getApiBaseUrl = () => {
  // Check for environment variable first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In development, use empty string to leverage Vite proxy
  // In production, use empty string to make relative API calls to same domain
  return '';
};

const API_BASE_URL = getApiBaseUrl();

export default API_BASE_URL;
