import { useAuth } from '../contexts/AuthContext';

export const useApiErrorHandler = () => {
  const { handleLogout } = useAuth();

  const handleError = (error) => {
    console.error('API Error:', error);
    
    // Check if it's an authorization error
    if (error?.status === 401 || error?.status === 403) {
      console.log('Authorization error detected, logging out user');
      handleLogout();
    }
    
    // Return the error for further handling if needed
    return error;
  };

  return { handleError };
};
