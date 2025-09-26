import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

// storage keys + broadcast channel
const AUTH_TOKEN_KEY = 'token';
const AUTH_USER_KEY  = 'authUser';
const CHANNEL_NAME   = 'auth-bc';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const navigate = useNavigate();

  // helpers
  const clearStorage = () => {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
    } catch {}
  };

  const readFromStorage = () => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const storedUser  = localStorage.getItem(AUTH_USER_KEY);

    if (!storedToken) {
      setToken(null);
      setUser(null);
      return;
    }

    try {
      // Simple token validation - in a real app you'd decode JWT
      setToken(storedToken);
      // Always use the stored user object from the backend response
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        // Fallback - try to get user from API
        fetchUserProfile(storedToken);
      }
    } catch {
      clearStorage();
      setToken(null);
      setUser(null);
    }
  };

  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      } else {
        clearStorage();
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      clearStorage();
      setToken(null);
      setUser(null);
    }
  };

  // initial bootstrap + cross-tab sync
  useEffect(() => {
    let bc;
    readFromStorage();
    setLoading(false);

    try {
      bc = new BroadcastChannel(CHANNEL_NAME);
      bc.onmessage = (e) => {
        if (e?.data?.type === 'logout') {
          clearStorage();
          setToken(null);
          setUser(null);
          if (window.location.pathname !== '/') {
            navigate('/', { replace: true });
          }
        } else if (e?.data?.type === 'login') {
          // another tab logged in — re-read storage
          readFromStorage();
        }
      };
    } catch {
      // BroadcastChannel not supported; storage event fallback below will handle
    }

    const onStorage = (e) => {
      if (e.key === AUTH_TOKEN_KEY || e.key === AUTH_USER_KEY) {
        readFromStorage();
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
      try { bc && bc.close(); } catch {}
    };
  }, [navigate]);

  // save both token + user and broadcast to other tabs
  const handleLogin = (newToken, newUser) => {
    localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser || null));
    setToken(newToken);
    setUser(newUser || null);
    setShowForgotPassword(false);
    try {
      const bc = new BroadcastChannel(CHANNEL_NAME);
      bc.postMessage({ type: 'login' });
      bc.close();
    } catch {}
  };

  // clear creds, broadcast, redirect
  const handleLogout = useCallback(() => {
    clearStorage();
    setToken(null);
    setUser(null);
    setShowForgotPassword(false);
    try {
      const bc = new BroadcastChannel(CHANNEL_NAME);
      bc.postMessage({ type: 'logout' });
      bc.close();
    } catch {}
    navigate('/', { replace: true });
  }, [navigate]);

  // Function to handle API errors and automatically logout if needed
  const handleApiError = useCallback((error) => {
    // If it's a 401 (Unauthorized) or 403 (Forbidden), logout the user
    if (error?.status === 401 || error?.status === 403) {
      console.log('API authorization error, logging out user');
      handleLogout();
    }
  }, [handleLogout]);

  const value = { 
    user, 
    token, 
    loading, 
    showForgotPassword,
    setShowForgotPassword,
    handleLogin, 
    handleLogout, 
    handleApiError,
    isAuthenticated: !!user 
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
