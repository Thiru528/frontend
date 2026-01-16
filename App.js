import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import LoadingScreen from './src/components/LoadingScreen';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { registerForPushNotificationsAsync } from './src/services/notificationService';

const Stack = createStackNavigator();

function AppContent() {
  const { isAuthenticated, isLoading, checkAuthStatus, login } = useAuth();

  useEffect(() => {
    checkAuthStatus();
    registerForPushNotificationsAsync();

    // Check for demo URL parameter (web only)
    if (Platform.OS === 'web') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('demo') === 'true' || window.location.pathname === '/home') {
        // Auto login for demo
        login('demo@example.com', 'demo123');
      }
    }
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  const linking = {
    prefixes: [Linking.createURL('/'), 'careerloop://'],
    config: {
      screens: {
        Auth: {
          screens: {
            Login: 'login',
            Register: 'register',
          },
        },
        Main: {
          screens: {
            MainTabs: {
              screens: {
                Dashboard: 'home',
                Resume: {
                  screens: {
                    ResumeMain: 'resume',
                    ResumeAnalysis: 'resume/analysis',
                  },
                },
                Jobs: {
                  screens: {
                    JobsMain: 'jobs',
                    JobDetails: 'jobs/:id',
                  },
                },
                Study: {
                  screens: {
                    StudyMain: 'study',
                    StudyPlan: 'study/plan',
                    MCQArena: 'study/mcq',
                  },
                },
                Profile: 'profile',
              },
            },
            Premium: 'premium',
            Chat: 'chat',
          },
        },
      },
    },
  };

  return (
    <NavigationContainer linking={linking}>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}