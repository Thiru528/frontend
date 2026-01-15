import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const Card = ({
  children,
  style,
  onPress,
  padding = 16,
  margin = 8,
  elevation = 2,
  glassmorphism = false,
  premium = false
}) => {
  const { colors } = useTheme();

  const cardStyle = [
    styles.card,
    {
      backgroundColor: glassmorphism ? 'rgba(255, 255, 255, 0.1)' : colors.card,
      ...(Platform.OS !== 'web' ? { shadowColor: colors.text } : {}),
      elevation,
      padding,
      margin,
      borderWidth: glassmorphism ? 1 : 0,
      borderColor: glassmorphism ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
    },
    style,
  ];

  const content = (
    <>
      {premium && (
        <LinearGradient
          colors={[colors.premium + '20', colors.primary + '10']}
          style={styles.premiumOverlay}
        />
      )}
      {children}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      }
    }),
  },
  premiumOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
});

export default Card;