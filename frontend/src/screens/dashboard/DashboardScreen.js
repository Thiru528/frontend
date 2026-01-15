import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI } from '../../services/api';
import Card from '../../components/Card';
import ProgressBar from '../../components/ProgressBar';
import Button from '../../components/Button';
import Logo from '../../components/Logo';
import FloatingActionButton from '../../components/FloatingActionButton';

const DashboardScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user, refreshUser } = useAuth();
  const isFocused = useIsFocused();
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    if (isFocused) {
      if (refreshUser) refreshUser();
      loadDashboardData();
    }
  }, [isFocused]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await dashboardAPI.getDashboardData();

      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        console.error('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const openChat = () => {
    navigation.navigate('Chat');
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={[colors.primary + '10', colors.background, colors.background]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={[styles.container]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Logo size={40} style={{ marginRight: 12 }} />
              <View>
                <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                  {getGreeting()},
                </Text>
                <Text style={[styles.userName, { color: colors.text }]}>
                  {user?.name || 'User'}
                </Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={onRefresh} style={styles.chatButton}>
                <Ionicons name="reload-circle-outline" size={26} color={colors.primary} />
              </TouchableOpacity>
              {!user?.isPremium && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Premium')}
                  style={[styles.premiumButton, { backgroundColor: colors.premium + '20' }]}
                >
                  <Ionicons name="diamond" size={20} color={colors.premium} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={openChat} style={styles.chatButton}>
                <Ionicons name="chatbubble-outline" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Study Streak */}
          <Card style={styles.streakCard} premium>
            <View style={styles.streakContent}>
              <Ionicons name="flame" size={32} color={colors.warning} />
              <View style={styles.streakText}>
                <Text style={[styles.streakNumber, { color: colors.text }]}>
                  {dashboardData?.studyStreak || 0} Day Streak! 🔥
                </Text>
                <Text style={[styles.streakSubtext, { color: colors.textSecondary }]}>
                  Keep it up! Don't break the chain.
                </Text>
              </View>
            </View>
          </Card>

          {/* Resume Nudge vs Stats */}
          {!user?.hasResume ? (
            <Card style={{ padding: 24, alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Ionicons name="document-text" size={30} color={colors.primary} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text, textAlign: 'center', marginBottom: 8 }]}>
                Complete Your Profile
              </Text>
              <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 20, lineHeight: 20 }}>
                First, upload your resume to get your <Text style={{ fontWeight: 'bold', color: colors.primary }}>AI Study Plan</Text> and personalized <Text style={{ fontWeight: 'bold', color: colors.secondary }}>MCQ Assignments</Text>.
              </Text>
              <Button
                title="Upload Resume Now 📄"
                onPress={() => navigation.navigate('Resume')}
                style={{ width: '100%' }}
              />
            </Card>
          ) : (
            <>
              {/* Key Metrics */}
              <View style={styles.metricsRow}>
                <Card style={[styles.metricCard, { flex: 1, marginRight: 8 }]}>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                    Resume ATS Score
                  </Text>
                  <Text style={[styles.metricValue, { color: colors.primary }]}>
                    {dashboardData?.resumeScore || 0}%
                  </Text>
                </Card>
                <Card style={[styles.metricCard, { flex: 1, marginLeft: 8 }]}>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                    Job Readiness
                  </Text>
                  <Text style={[styles.metricValue, { color: colors.success }]}>
                    {dashboardData?.jobReadiness || 0}%
                  </Text>
                </Card>
              </View>

              {/* Daily Goals - Powered by Real-Time User Data */}
              <Card>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Today's Goals
                </Text>
                <View style={styles.goalItem}>
                  <Text style={[styles.goalLabel, { color: colors.text }]}>
                    Study Time
                  </Text>
                  <ProgressBar
                    progress={((user?.studyMinutes || 0) / 60) / 10} // Target 10h
                    label={`${Math.round((user?.studyMinutes || 0) / 60 * 10) / 10}h / 10h`}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.goalItem}>
                  <Text style={[styles.goalLabel, { color: colors.text }]}>
                    MCQ Tests
                  </Text>
                  <ProgressBar
                    progress={(user?.dailyMcqCount || 0) / 5}
                    label={`${user?.dailyMcqCount || 0} / 5 completed`}
                    color={colors.secondary}
                  />
                </View>
              </Card>
            </>
          )}

          {/* Quick Actions */}
          <Card style={styles.quickActionsCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Quick Actions
            </Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={[styles.quickActionItem, { backgroundColor: colors.primary + '20' }]}
                onPress={() => navigation.navigate('Study', { screen: 'MCQArena' })}
              >
                <Ionicons name="flash" size={24} color={colors.primary} />
                <Text style={[styles.quickActionText, { color: colors.primary }]}>
                  MCQ Arena
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionItem, { backgroundColor: colors.secondary + '20' }]}
                onPress={() => navigation.navigate('Study', { screen: 'StudyPlan' })}
              >
                <Ionicons name="calendar" size={24} color={colors.secondary} />
                <Text style={[styles.quickActionText, { color: colors.secondary }]}>
                  Study Planner 30 Days
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionItem, { backgroundColor: colors.warning + '20' }]}
                onPress={() => navigation.navigate('Resume', { autoOpenAnalysis: true })}
              >
                <Ionicons name="document-text" size={24} color={colors.warning} />
                <Text style={[styles.quickActionText, { color: colors.warning }]}>
                  AI Resume
                </Text>
              </TouchableOpacity>

              {!user?.isPremium && (
                <TouchableOpacity
                  style={[styles.quickActionItem, { backgroundColor: colors.premium + '20' }]}
                  onPress={() => navigation.navigate('Premium')}
                >
                  <Ionicons name="diamond" size={24} color={colors.premium} />
                  <Text style={[styles.quickActionText, { color: colors.premium }]}>
                    Go Pro
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
          <Card>
            <View style={styles.taskHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Today's Study Task
              </Text>
              <Ionicons name="school-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.taskText, { color: colors.textSecondary }]}>
              {dashboardData?.todayTask || 'No specific task for today.'}
            </Text>
            <Button
              title="Start Learning"
              onPress={() => navigation.navigate('Study')}
              style={styles.taskButton}
              size="small"
            />
          </Card>

          {/* Skill Progress */}
          {dashboardData?.skillProgress && (
            <Card>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Skill Progress & Confidence
              </Text>
              {dashboardData.skillProgress.map((skill, index) => (
                <View key={index} style={styles.skillItem}>
                  <View style={styles.skillHeader}>
                    <Text style={[styles.skillName, { color: colors.text }]}>
                      {skill.name}
                    </Text>
                    <Text style={[styles.confidenceText, { color: colors.textSecondary }]}>
                      {skill.confidence}% confident
                    </Text>
                  </View>
                  <ProgressBar
                    progress={skill.progress}
                    showPercentage={false}
                    color={skill.confidence > 60 ? colors.success : skill.confidence > 40 ? colors.warning : colors.danger}
                  />
                </View>
              ))}
            </Card>
          )}

          {/* Weekly Activity */}
          {dashboardData?.weeklyActivity && (
            <Card>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                This Week's Activity
              </Text>
              <View style={styles.activityGrid}>
                <View style={styles.activityItem}>
                  <Text style={[styles.activityValue, { color: colors.primary }]}>
                    {dashboardData.weeklyActivity.studyHours}h
                  </Text>
                  <Text style={[styles.activityLabel, { color: colors.textSecondary }]}>
                    Study Time
                  </Text>
                </View>
                <View style={styles.activityItem}>
                  <Text style={[styles.activityValue, { color: colors.secondary }]}>
                    {dashboardData.weeklyActivity.testsCompleted}
                  </Text>
                  <Text style={[styles.activityLabel, { color: colors.textSecondary }]}>
                    Tests Completed
                  </Text>
                </View>
                <View style={styles.activityItem}>
                  <Text style={[styles.activityValue, { color: colors.success }]}>
                    {dashboardData.weeklyActivity.skillsImproved}
                  </Text>
                  <Text style={[styles.activityLabel, { color: colors.textSecondary }]}>
                    Skills Improved
                  </Text>
                </View>
              </View>
            </Card>
          )}

          {/* Job Match */}
          <Card onPress={() => navigation.navigate('Jobs')}>
            <View style={styles.jobMatchHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Job Match Score
              </Text>
              <Text style={[styles.jobMatchScore, { color: colors.success }]}>
                {dashboardData?.jobMatchPercentage || 0}%
              </Text>
            </View>
            <Text style={[styles.jobMatchText, { color: colors.textSecondary }]}>
              Great match for your target role! Tap to see recommended jobs.
            </Text>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  chatButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumButton: {
    padding: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  quickActionsCard: {
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakCard: {
    marginBottom: 16,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    marginLeft: 12,
    flex: 1,
  },
  streakNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  streakSubtext: {
    fontSize: 14,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  metricCard: {
    alignItems: 'center',
    padding: 16,
  },
  metricLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  goalItem: {
    marginBottom: 16,
  },
  goalLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskText: {
    fontSize: 16,
    marginBottom: 12,
  },
  taskButton: {
    alignSelf: 'flex-start',
  },
  skillItem: {
    marginBottom: 16,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  skillName: {
    fontSize: 14,
    fontWeight: '500',
  },
  confidenceText: {
    fontSize: 12,
  },
  activityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  activityItem: {
    alignItems: 'center',
  },
  activityValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  activityLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  jobMatchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobMatchScore: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  jobMatchText: {
    fontSize: 14,
  },
});

export default DashboardScreen;