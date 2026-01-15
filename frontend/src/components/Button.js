import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const { colors } = useTheme();

  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[size]];
    
    switch (variant) {
      case 'primary':
        baseStyle.push({
          backgroundColor: disabled ? colors.textSecondary : colors.primary,
        });
        break;
      case 'secondary':
        baseStyle.push({
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: disabled ? colors.textSecondary : colors.primary,
        });
        break;
      case 'danger':
        baseStyle.push({
          backgroundColor: disabled ? colors.textSecondary : colors.danger,
        });
        break;
      case 'success':
        baseStyle.push({
          backgroundColor: disabled ? colors.textSecondary : colors.success,
        });
        break;
      default:
        baseStyle.push({
          backgroundColor: disabled ? colors.textSecondary : colors.primary,
        });
    }

    return [...baseStyle, style];
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`${size}Text`]];
    
    switch (variant) {
      case 'secondary':
        baseStyle.push({
          color: disabled ? colors.textSecondary : colors.primary,
        });
        break;
      default:
        baseStyle.push({
          color: '#FFFFFF',
        });
    }

    return [...baseStyle, textStyle];
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  large: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  text: {
    fontWeight: '600',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
});

export default Button;