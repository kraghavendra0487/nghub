import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import RouteGuard from './components/RouteGuard';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './components/NotFound';

// Import pages
import AdminPage from './pages/admin/AdminDashboard';
import AdminEmployeesPage from './pages/admin/AdminEmployeesPage';
import AdminEmployeeDetailsPage from './pages/admin/AdminEmployeeDetailsPage';
import AdminAddEmployeePage from './pages/admin/AdminAddEmployeePage';
import AdminCustomersPage from './pages/admin/AdminCustomersPage';
import AdminCampsPage from './pages/admin/AdminCampsPage';
import AdminAddCampPage from './pages/admin/AdminAddCampPage';
import EmployeePage from './pages/employee/EmployeePage';
import EmployeeCustomersPage from './pages/employee/EmployeeCustomersPage';
import EmployeeAddCustomerPage from './pages/employee/EmployeeAddCustomerPage';
import EmployeeCampsPage from './pages/employee/EmployeeCampsPage';
import EmployeeProfilePage from './pages/employee/EmployeeProfilePage';

// Import components
import AnimatedLoginForm from './components/AnimatedLoginForm';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ForgotPasswordForm from './components/ForgotPasswordForm';

const AppContent = () => {
  const { user, loading, showForgotPassword, setShowForgotPassword, handleLogin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-4">
        {showForgotPassword ? (
          <ForgotPasswordForm onBackToLogin={() => setShowForgotPassword(false)} />
        ) : (
          <AnimatedLoginForm 
            onLogin={handleLogin} 
            onForgotPassword={() => setShowForgotPassword(true)}
          />
        )}
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          <RouteGuard isPrivate={false}>
            <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-4">
              {showForgotPassword ? (
                <ForgotPasswordForm onBackToLogin={() => setShowForgotPassword(false)} />
              ) : (
                <AnimatedLoginForm 
                  onLogin={handleLogin} 
                  onForgotPassword={() => setShowForgotPassword(true)}
                />
              )}
            </div>
          </RouteGuard>
        } />
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute role="admin">
            <AdminPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/employees" element={
          <ProtectedRoute role="admin">
            <AdminEmployeesPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/employees/:id" element={
          <ProtectedRoute role="admin">
            <AdminEmployeeDetailsPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/add-employee" element={
          <ProtectedRoute role="admin">
            <AdminAddEmployeePage />
          </ProtectedRoute>
        } />
        <Route path="/admin/customers" element={
          <ProtectedRoute role="admin">
            <AdminCustomersPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/camps" element={
          <ProtectedRoute role="admin">
            <AdminCampsPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/add-camp" element={
          <ProtectedRoute role="admin">
            <AdminAddCampPage />
          </ProtectedRoute>
        } />
        
        {/* Employee Routes */}
        <Route path="/employee" element={
          <ProtectedRoute role="employee">
            <EmployeePage />
          </ProtectedRoute>
        } />
        <Route path="/employee/customers" element={
          <ProtectedRoute role="employee">
            <EmployeeCustomersPage />
          </ProtectedRoute>
        } />
        <Route path="/employee/add-customer" element={
          <ProtectedRoute role="employee">
            <EmployeeAddCustomerPage />
          </ProtectedRoute>
        } />
        <Route path="/employee/camps" element={
          <ProtectedRoute role="employee">
            <EmployeeCampsPage />
          </ProtectedRoute>
        } />
        <Route path="/employee/profile" element={
          <ProtectedRoute role="employee">
            <EmployeeProfilePage />
          </ProtectedRoute>
        } />
        
        {/* Catch all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;