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
  primary: '#4F46E5', // Deep Indigo
  secondary: '#10B981', // Emerald
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  premium: '#F59E0B', // Gold
  premiumGradient: ['#F59E0B', '#B45309'],
  background: '#F8FAFC', // Slate 50
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  placeholder: '#94A3B8',
  accent: '#6366F1',
  glass: 'rgba(255, 255, 255, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.5)',
};

const darkColors = {
  primary: '#818CF8', // Indigo 400
  secondary: '#34D399', // Emerald 400
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#EF4444',
  premium: '#FBBF24', // Gold
  premiumGradient: ['#F59E0B', '#78350F'],
  background: '#0F172A', // Slate 900 (Deep Blue/Black)
  surface: '#1E293B', // Slate 800
  card: 'rgba(30, 41, 59, 0.7)', // Glassy Dark
  text: '#F8FAFC', // Slate 50
  textSecondary: '#94A3B8', // Slate 400
  border: '#334155',
  placeholder: '#475569',
  accent: '#818CF8',
  glass: 'rgba(30, 41, 59, 0.6)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
};