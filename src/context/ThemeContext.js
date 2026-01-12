import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme !== null) {
        setIsDark(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    try {
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const theme = {
    isDark,
    colors: isDark ? darkColors : lightColors,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

const lightColors = {
  primary: '#6366F1', // Electric Indigo
  secondary: '#10B981', // Emerald
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  premium: '#F59E0B', // Premium Gold
  premiumGradient: ['#F59E0B', '#B45309'],
  background: '#FFFFFF',
  surface: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  placeholder: '#94A3B8',
  accent: '#6366F1',
  glass: 'rgba(255, 255, 255, 0.1)',
};

const darkColors = {
  primary: '#6366F1', // Electric Indigo
  secondary: '#10B981', // Emerald
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  premium: '#F59E0B', // Premium Gold
  premiumGradient: ['#F59E0B', '#B45309'],
  background: '#0F172A', // Deep Charcoal
  surface: '#1E293B',
  card: '#334155',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  border: '#475569',
  placeholder: '#64748B',
  accent: '#6366F1',
  glass: 'rgba(255, 255, 255, 0.1)',
};