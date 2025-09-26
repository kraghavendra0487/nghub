import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ErrorBoundary = ({ error, resetError }) => {
  const { handleLogout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If there's an error, automatically logout and redirect to login
    if (error) {
      console.error('Error boundary caught error:', error);
      
      // Wait a moment to show the error, then logout
      const timer = setTimeout(() => {
        handleLogout();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [error, handleLogout]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center">
        <div className="text-center p-8">
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-red-500">
              Something went wrong
            </h1>
            <p className="text-gray-600">
              An error occurred while loading this page. You will be automatically logged out and redirected to login.
            </p>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500">
              Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ErrorBoundary;