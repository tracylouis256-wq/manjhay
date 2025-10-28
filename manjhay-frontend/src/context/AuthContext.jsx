import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Add refs to prevent multiple API calls
  const isCheckingUserRef = useRef(false);
  const authCheckTimeoutRef = useRef(null);

  // Set auth token for requests
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  };

  // Register user
  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      const { data } = response.data;
      
      setUser(data);
      setAuthToken(data.token);
      setIsAuthenticated(true);
      toast.success('Registration successful!');
      
      return { success: true, data };
    } catch (error) {
      if (error.response?.status === 429) {
        toast.error('Too many attempts. Please wait a moment.');
      } else {
        const message = error.response?.data?.message || 'Registration failed';
        toast.error(message);
      }
      return { success: false, error: error.response?.data?.message || 'Registration failed' };
    }
  };

  // Login user with rate limiting protection
  const login = async (email, password) => {
    try {
      // Add a small delay to prevent rapid successive requests
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const response = await axios.post('/api/auth/login', { email, password });
      const { data } = response.data;
      
      setUser(data);
      setAuthToken(data.token);
      setIsAuthenticated(true);
      toast.success('Login successful!');
      
      return { success: true, data };
    } catch (error) {
      if (error.response?.status === 429) {
        toast.error('Too many login attempts. Please wait a few minutes.');
      } else {
        const message = error.response?.data?.message || 'Login failed';
        toast.error(message);
      }
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  };

  // Logout user
  const logout = () => {
    setUser(null);
    setAuthToken(null);
    setIsAuthenticated(false);
    
    // Clear any pending timeouts
    if (authCheckTimeoutRef.current) {
      clearTimeout(authCheckTimeoutRef.current);
    }
    isCheckingUserRef.current = false;
    
    toast.info('Logged out successfully');
  };

  // Get current user with protection against multiple calls
  const getCurrentUser = async () => {
    // Prevent multiple simultaneous calls
    if (isCheckingUserRef.current) {
      console.log('🔄 [AUTH] User check already in progress, skipping...');
      return;
    }

    isCheckingUserRef.current = true;
    
    try {
      console.log('🔐 [AUTH] Checking current user...');
      const response = await axios.get('/api/auth/me');
      setUser(response.data.data);
      setIsAuthenticated(true);
      console.log('✅ [AUTH] User authenticated:', response.data.data.name);
    } catch (error) {
      console.log('❌ [AUTH] User not authenticated or token expired');
      setAuthToken(null);
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
      isCheckingUserRef.current = false;
    }
  };

  // Update profile
  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('/api/auth/profile', profileData);
      setUser(response.data.data);
      toast.success('Profile updated successfully!');
      return { success: true, data: response.data.data };
    } catch (error) {
      if (error.response?.status === 429) {
        toast.error('Too many requests. Please wait a moment.');
      } else {
        const message = error.response?.data?.message || 'Profile update failed';
        toast.error(message);
      }
      return { success: false, error: error.response?.data?.message || 'Profile update failed' };
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      await axios.put('/api/auth/change-password', passwordData);
      toast.success('Password changed successfully!');
      return { success: true };
    } catch (error) {
      if (error.response?.status === 429) {
        toast.error('Too many attempts. Please wait a moment.');
      } else {
        const message = error.response?.data?.message || 'Password change failed';
        toast.error(message);
      }
      return { success: false, error: error.response?.data?.message || 'Password change failed' };
    }
  };

  // Initialize auth state - FIXED to prevent multiple calls
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        setAuthToken(token);
        
        // Add a small delay to prevent immediate API call on app start
        authCheckTimeoutRef.current = setTimeout(() => {
          getCurrentUser();
        }, 1000);
      } else {
        setLoading(false);
      }
    };

    initializeAuth();

    // Cleanup function
    return () => {
      if (authCheckTimeoutRef.current) {
        clearTimeout(authCheckTimeoutRef.current);
      }
    };
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated,
    register,
    login,
    logout,
    updateProfile,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};