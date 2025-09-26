import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, role }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (role && user.role !== role) {
    const home = user.role === 'admin' ? '/admin' : '/employee';
    return <Navigate to={home} replace />;
  }

  return children;
};

export default ProtectedRoute;
