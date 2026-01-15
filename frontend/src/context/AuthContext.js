import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';
import { authEvents } from '../services/authEvents';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  console.log('AuthProvider Initializing...'); // Debug: Verify new code loaded

  useEffect(() => {
    // Listen for Force Logout events (401 from API)
    const unsubscribe = authEvents.onLogout(() => {
      logout();
    });
    return unsubscribe;
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');

      if (token && userData) {
        setIsAuthenticated(true);
        setUser(JSON.parse(userData));

        // Background refresh to get latest status (Premium, Skills, etc.)
        // This fixes the "Stale Premium Status" bug
        setTimeout(() => {
          console.log("AuthProvider: Background refreshing user profile...");
          value.refreshUser();
        }, 1000);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      // API call without triggering global loading
      const response = await authAPI.login(email, password);

      if (response.data.success) {
        const { token, user } = response.data;

        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));

        setIsAuthenticated(true);
        setUser(user);
        return { success: true };
      }

      return { success: false, message: response.data.message || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);

      let message = error.response?.data?.message;

      if (!message) {
        if (error.response?.status === 401) {
          message = 'Invalid email or password';
        } else if (error.response?.status === 400) {
          message = 'Invalid details provided';
        } else {
          message = error.message || 'Login failed. Please try again.';
        }
      }

      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);

      if (response.data.success) {
        const { token, user } = response.data;

        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));

        setIsAuthenticated(true);
        setUser(user);
        return { success: true };
      }

      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: error.response?.data?.message || 'Registration failed. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = async (updatedUserData) => {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
      setUser(updatedUserData);
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  const deleteAccount = async () => {
    try {
      await authAPI.deleteAccount();
      await logout();
      return { success: true };
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    login,
    register,
    logout,
    updateUser,
    deleteAccount,
    checkAuthStatus,
    refreshUser: async () => {
      try {
        const response = await authAPI.getMe();
        if (response.data.success) {
          const userData = response.data.data;
          setUser(userData);
          await AsyncStorage.setItem('userData', JSON.stringify(userData));
          return userData;
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
      return null;
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};