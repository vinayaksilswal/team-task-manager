import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch the profile of the currently logged-in user
  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/users/me');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // On mount, load profile if token exists in localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      
      // Instantly load the profile details
      const profileResponse = await api.get('/users/me');
      setUser(profileResponse.data);
      setLoading(false);
      return profileResponse.data;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signup = async (name, email, password, role) => {
    setLoading(true);
    try {
      await api.post('/auth/signup', { name, email, password, role });
      // Perform auto-login after successful registration
      return await login(email, password);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
