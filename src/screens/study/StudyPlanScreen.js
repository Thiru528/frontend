import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { studyAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ProgressBar from '../../components/ProgressBar';

import FancyLoader from '../../components/FancyLoader';

const StudyPlanScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user, refreshUser } = useAuth(); // Get user for Premium check
  const [studyPlan, setStudyPlan] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (refreshUser) refreshUser();
    loadStudyPlan();
  }, []);

  const loadStudyPlan = async () => {
    try {
      setLoading(true);
      const response = await studyAPI.getStudyPlan();
      if (response.data.success) {
        const formattedPlan = formatStudyPlan(response.data.data);
        setStudyPlan(formattedPlan);

        // Find current week based on current day
        if (formattedPlan.currentDay && formattedPlan.weeks) {
          const currentWeekIndex = formattedPlan.weeks.findIndex(week =>
            week.days.some(day => day.day === formattedPlan.currentDay)
          );
          if (currentWeekIndex !== -1) {
            setSelectedWeek(currentWeekIndex);
          }
        }
      }
    } catch (error) {
      console.error('Error loading study plan:', error);
      Alert.alert('Error', 'Failed to load study plan');
    } finally {
      setLoading(false);
    }
  };

  const handleDayPress = (day) => {
    if (day.completed) {
      // Allow reviewing completed days
      startStudyDay(day);
    } else if (day.isToday) {
      Alert.alert(
        'Today\'s Study',
        `Ready to start Day ${day.day}: ${day.title}?`,
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Start Now', onPress: () => startStudyDay(day) },
        ]
      );
    } else if (day.day > studyPlan.currentDay) {
      if (user?.isPremium) {
        // Premium users can access future content
        startStudyDay(day);
      } else {
        Alert.alert('Locked', 'Upgrade to Premium to unlock future lessons instantly!', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go Premium', onPress: () => navigation.navigate('Premium') }
        ]);
      }
    } else {
      startStudyDay(day);
    }
  };

  const startStudyDay = (day) => {
    if (day.title.includes('Test') || day.title.includes('Quiz') || day.title.includes('Exam')) {
      navigation.navigate('MCQArena', { topic: day.skill || day.title, dayNumber: day.day });
    } else {
      // Navigate to detailed lesson content
      navigation.navigate('TopicDetail', { topic: { title: day.title, day: day.day } });
    }
  };

  const getDayStatus = (day) => {
    if (day.completed) return 'completed';
    if (day.isToday) return 'current';

    // Check lock status
    if (day.day > studyPlan.currentDay) {
      // If user is premium, show as available (or special 'premium' state if we had one, but 'available' works)
      if (user?.isPremium) return 'available';
      return 'locked';
    }
    return 'available';
  };

  const getDayStatusColor = (status) => {
    switch (status) {
      case 'completed': return colors.success;
      case 'current': return colors.primary;
      case 'locked': return colors.textSecondary;
      case 'available': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  const getDayStatusIcon = (status) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'current': return 'play-circle';
      case 'locked': return 'lock-closed';
      case 'available': return 'ellipse-outline';
      default: return 'ellipse-outline';
    }
  };

  const formatStudyPlan = (data) => {
    // If backend returns 'weeks', use it. If 'calendar', transform it.
    if (data.weeks) return data;

    const weeks = [];
    const calendar = data.calendar || [];

    // Group by 7 days
    for (let i = 0; i < calendar.length; i += 7) {
      const weekDays = calendar.slice(i, i + 7);
      weeks.push({
        week: Math.floor(i / 7) + 1,
        title: weekDays[0]?.title || `Week ${Math.floor(i / 7) + 1}`,
        days: weekDays
      });
    }

    if (weeks.length === 0) {
      // Fallback for empty calendar
      weeks.push({ week: 1, title: 'Getting Started', days: [] });
    }

    return {
      ...data,
      weeks
    };
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <FancyLoader message="Loading your study plan..." />
      </SafeAreaView>
    );
  }

  if (!studyPlan) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.text }}>No study plan available.</Text>
          <Button title="Retry" onPress={loadStudyPlan} style={{ marginTop: 20 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          30-Day Study Plan
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress Overview */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Overall Progress
          </Text>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressText, { color: colors.text }]}>
              Day {studyPlan.currentDay || 1} of {studyPlan.totalDays || 30}
            </Text>
            <Text style={[styles.progressPercentage, { color: colors.primary }]}>
              {(studyPlan.totalDays > 0) ? Math.round(((studyPlan.completedDays || 0) / studyPlan.totalDays) * 100) : 0}%
            </Text>
          </View>
          <ProgressBar
            progress={studyPlan.completedDays / studyPlan.totalDays}
            color={colors.primary}
            showPercentage={false}
          />
          <Text style={[styles.progressSubtext, { color: colors.textSecondary }]}>
            {studyPlan.completedDays} days completed, {studyPlan.totalDays - studyPlan.completedDays} days remaining
          </Text>
        </Card>

        {/* Week Selector */}
        <View style={styles.weekSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {studyPlan.weeks?.map((week, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedWeek(index)}
                style={[
                  styles.weekTab,
                  {
                    backgroundColor: selectedWeek === index ? colors.primary : colors.surface,
                  }
                ]}
              >
                <Text style={[
                  styles.weekTabText,
                  {
                    color: selectedWeek === index ? '#FFFFFF' : colors.text,
                  }
                ]}>
                  Week {week.week}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Selected Week Content */}
        <Card>
          <Text style={[styles.weekTitle, { color: colors.text }]}>
            Week {studyPlan.weeks[selectedWeek].week}: {studyPlan.weeks[selectedWeek].title}
          </Text>

          {studyPlan.weeks?.[selectedWeek]?.days?.map((day, index) => {
            const status = getDayStatus(day);
            const statusColor = getDayStatusColor(status);
            const statusIcon = getDayStatusIcon(status);

            return (
              <TouchableOpacity
                key={index}
                onPress={() => handleDayPress(day)}
                style={[
                  styles.dayCard,
                  {
                    backgroundColor: colors.surface,
                    borderLeftColor: statusColor,
                    opacity: status === 'locked' ? 0.6 : 1,
                  }
                ]}
              >
                <View style={styles.dayHeader}>
                  <View style={styles.dayInfo}>
                    <View style={styles.dayTitleRow}>
                      <Text style={[styles.dayNumber, { color: colors.textSecondary }]}>
                        Day {day.day}
                      </Text>
                      {day.isToday && (
                        <View style={[styles.todayBadge, { backgroundColor: colors.primary }]}>
                          <Text style={styles.todayBadgeText}>Today</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.dayTitle, { color: colors.text }]}>
                      {day.title}
                    </Text>
                    <Text style={[styles.dayDuration, { color: colors.textSecondary }]}>
                      ⏱️ {day.duration} • {day.skill}
                    </Text>
                  </View>

                  <Ionicons
                    name={statusIcon}
                    size={24}
                    color={statusColor}
                  />
                </View>

                <View style={styles.dayTasks}>
                  {day.tasks.map((task, taskIndex) => (
                    <Text key={taskIndex} style={[styles.taskItem, { color: colors.textSecondary }]}>
                      • {typeof task === 'object' ? task.title : task}
                    </Text>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </Card>

        {/* Legend */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Legend
          </Text>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.legendText, { color: colors.text }]}>Completed</Text>
            </View>
            <View style={styles.legendItem}>
              <Ionicons name="play-circle" size={16} color={colors.primary} />
              <Text style={[styles.legendText, { color: colors.text }]}>Current</Text>
            </View>
            <View style={styles.legendItem}>
              <Ionicons name="ellipse-outline" size={16} color={colors.warning} />
              <Text style={[styles.legendText, { color: colors.text }]}>Available</Text>
            </View>
            <View style={styles.legendItem}>
              <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
              <Text style={[styles.legendText, { color: colors.text }]}>Locked</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressSubtext: {
    fontSize: 12,
    marginTop: 8,
  },
  weekSelector: {
    marginVertical: 16,
  },
  weekTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  weekTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  weekTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  dayCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  dayInfo: {
    flex: 1,
  },
  dayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: '500',
  },
  todayBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  todayBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  dayDuration: {
    fontSize: 12,
  },
  dayTasks: {
    marginTop: 4,
  },
  taskItem: {
    fontSize: 12,
    marginBottom: 2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '48%',
  },
  legendText: {
    fontSize: 12,
    marginLeft: 6,
  },
});

export default StudyPlanScreen;