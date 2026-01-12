import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const ProgressBar = ({ 
  progress, 
  label, 
  showPercentage = true, 
  height = 8, 
  color,
  style 
}) => {
  const { colors } = useTheme();
  const progressColor = color || colors.primary;
  const percentage = Math.round(progress * 100);

  return (
    <View style={[styles.container, style]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
          {showPercentage && (
            <Text style={[styles.percentage, { color: colors.textSecondary }]}>
              {percentage}%
            </Text>
          )}
        </View>
      )}
      <View style={[styles.track, { backgroundColor: colors.border, height }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${percentage}%`,
              backgroundColor: progressColor,
              height,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  percentage: {
    fontSize: 12,
    fontWeight: '400',
  },
  track: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 4,
  },
});

export default ProgressBar;