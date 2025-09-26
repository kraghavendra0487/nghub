import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AUTH_KEYS = ['authToken', 'authUser', 'token', 'user', 'jwt', 'jwtToken'];

const broadcastLogout = () => {
  try {
    const bc = new BroadcastChannel('auth-bc');
    bc.postMessage({ type: 'logout' });
    bc.close();
  } catch {}
};

const clearCreds = () => {
  try {
    AUTH_KEYS.forEach((k) => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
  } catch {}
};

const useApi = (url, endpoint) => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const cacheBuster = `_t=${Date.now()}`;
    const finalUrl = endpoint.includes('?')
      ? `${url}${endpoint}&${cacheBuster}`
      : `${url}${endpoint}?${cacheBuster}`;

    try {
      const res = await fetch(finalUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 🔒 global unauthorized handling
      if (res.status === 401 || res.status === 403) {
        clearCreds();
        broadcastLogout();
        if (mounted.current) {
          setData(null);
          setError('Unauthorized');
          setIsLoading(false);
        }
        window.location.replace('/');
        return;
      }

      if (!res.ok) {
        // best-effort error body
        let msg = 'Failed to fetch data';
        try {
          const errJson = await res.json();
          msg = errJson?.message || msg;
        } catch {}
        throw new Error(msg);
      }

      const result = await res.json();
      if (mounted.current) setData(result);
    } catch (err) {
      if (mounted.current) setError(err.message || 'Request failed');
    } finally {
      if (mounted.current) setIsLoading(false);
    }
  }, [url, endpoint]);

  useEffect(() => {
    mounted.current = true;
    fetchData();
    return () => {
      mounted.current = false;
    };
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
};

export default useApi;
