import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Logo from '../../components/Logo';

import CustomToast from '../../components/CustomToast';

const LoginScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { login } = useAuth(); // removed isLoading from context
  const [isLoggingIn, setIsLoggingIn] = useState(false); // Local loading state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });

  const showToast = (message, type = 'error') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    // Clear previous general error
    setErrors(prev => {
      const { general, ...rest } = prev;
      return rest;
    });

    if (!validateForm()) return;

    try {
      setIsLoggingIn(true);
      const result = await login(formData.email, formData.password);
      console.log('Login Result:', result);

      if (!result.success) {
        const msg = result.message.toLowerCase();
        console.log('Processing Error:', msg);

        // Show Toast for immediate feedback
        showToast(result.message, 'error');

        // Map backend errors to fields
        let handled = false;

        // Email Errors
        if (
          msg.includes('email') ||
          msg.includes('user') ||
          msg.includes('account') ||
          msg.includes('not found')
        ) {
          setErrors(prev => ({ ...prev, email: result.message }));
          handled = true;
        }

        // Password Errors
        if (
          msg.includes('password') ||
          msg.includes('credential') ||
          msg.includes('match') ||
          msg.includes('valid') ||
          msg.includes('incorrect')
        ) {
          setErrors(prev => ({ ...prev, password: result.message }));
          handled = true;
        }

        // If no specific field matched, or if it's a generic error, show general error
        if (!handled) {
          setErrors(prev => ({ ...prev, general: result.message }));
        }
      }
    } catch (e) {
      console.error("Handle login exception", e);
      showToast("An unexpected error occurred", 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field and general error
    if (errors[field] || errors.general) {
      setErrors(prev => {
        const { [field]: removed, general, ...rest } = prev;
        return rest;
      });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={[colors.primary + '40', colors.background, colors.background]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={[styles.container]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Logo size={80} />
              <Text style={[styles.title, { color: colors.primary }]}>CareerLoop AI</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Resume • Job Match • Study Planner
              </Text>
            </View>

            <Card style={styles.formCard} glassmorphism={true}>
              <Input
                label="Email"
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                placeholder="Enter your email"
                keyboardType="email-address"
                leftIcon="mail-outline"
                error={errors.email}
              />

              <Input
                label="Password"
                value={formData.password}
                onChangeText={(value) => updateFormData('password', value)}
                placeholder="Enter your password"
                secureTextEntry
                leftIcon="lock-closed-outline"
                error={errors.password}
              />
              <Button
                title="Sign In"
                onPress={handleLogin}
                loading={isLoggingIn}
                style={styles.loginButton}
              />

              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                  Don't have an account?{' '}
                </Text>
                <Button
                  title="Sign Up"
                  variant="secondary"
                  size="small"
                  onPress={() => navigation.navigate('Register')}
                />
              </View>
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <CustomToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  formCard: {
    padding: 24,
  },
  loginButton: {
    marginTop: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#FEE2E2', // Hardcoded Light Red
    borderRadius: 8,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
});

export default LoginScreen;
