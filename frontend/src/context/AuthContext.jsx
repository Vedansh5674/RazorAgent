import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAuthToken, setAuthToken } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.me();
        setUser(data.user);
        setMerchant(data.merchant);
      } catch (err) {
        console.warn('Failed to load user with stored token:', err);
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    setAuthToken(data.token);
    setUser(data.user);
    setMerchant(data.merchant);
    return data;
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setMerchant(null);
  };

  return (
    <AuthContext.Provider value={{ user, merchant, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
