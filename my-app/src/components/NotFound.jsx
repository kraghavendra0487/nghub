import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const NotFound = () => {
  const { handleLogout } = useAuth();

  useEffect(() => {
    // Automatically logout and redirect to login after showing the error
    const timer = setTimeout(() => {
      handleLogout();
    }, 3000);

    return () => clearTimeout(timer);
  }, [handleLogout]);

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center">
      <div className="text-center p-8">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-red-500">
            Page Not Found
          </h1>
          <p className="text-gray-600">
            The page you're looking for doesn't exist. You will be automatically logged out and redirected to login.
          </p>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500">
            Redirecting to login in 3 seconds...
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
