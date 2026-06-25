"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        } catch (err) {
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user, token } = res.data;
    if (token) {
      localStorage.setItem('token', token);
    }
    setUser(user);
  };

  const loginWithGoogle = async (credential) => {
    const res = await api.post('/auth/google', { credential });
    const { user, token } = res.data;
    if (token) {
      localStorage.setItem('token', token);
    }
    setUser(user);
  };

  const signup = async (name, username, email, password) => {
    const res = await api.post('/auth/signup', { name, username, email, password });
    const { user } = res.data;
    // Backend signup does not return a token, so log in immediately after signup
    const loginRes = await api.post('/auth/login', { email, password });
    const { token } = loginRes.data;
    if (token) {
      localStorage.setItem('token', token);
    }
    setUser(loginRes.data.user || user);
  };

  const sendOtp = async (email) => {
    const res = await api.post('/otp/send', { email });
    return res.data;
  };

  const verifyOtp = async (email, otp) => {
    const res = await api.post('/otp/verify', { email, otp });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, signup, logout, sendOtp, verifyOtp, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
