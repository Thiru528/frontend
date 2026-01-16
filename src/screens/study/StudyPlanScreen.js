import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
  Platform,
  Modal,
  RefreshControl
} from 'react-native';
import { useIsFocused } from '@react-navigation/native'; // Import focus hook
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { studyAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import FancyLoader from '../../components/FancyLoader';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const StudyPlanScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user, refreshUser } = useAuth();
  const [studyPlan, setStudyPlan] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [loading, setLoading] = useState(true);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const isFocused = useIsFocused(); // Hook to detect focus

  useEffect(() => {
    if (isFocused) {
      if (refreshUser) refreshUser();
      loadStudyPlan(); // Auto-reload when screen is focused (e.g. coming back from lesson)
    }
  }, [isFocused]);

  const loadStudyPlan = async () => {
    try {
      setLoading(true);
      const response = await studyAPI.getStudyPlan();
      if (response.data.success) {
        const formattedPlan = formatStudyPlan(response.data.data);
        setStudyPlan(formattedPlan);

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
    const dayNum = parseInt(day.day, 10);

    // 1. Premium Lock (Day > 5)
    if (!user?.isPremium && dayNum > 5) {
      setPremiumModalVisible(true);
      return;
    }

    // 2. Allow access (Free 1-5, Premium 1-30)
    startStudyDay(day);
  };

  const startStudyDay = (day) => {
    const dayNum = parseInt(day.day, 10);
    const isFreeDay = dayNum <= 5;

    if (day.title.includes('Test') || day.title.includes('Quiz') || day.title.includes('Exam')) {
      navigation.navigate('MCQArena', {
        topic: day.skill || day.title,
        dayNumber: day.day,
        freeAccess: isFreeDay
      });
    } else {
      navigation.navigate('TopicDetail', { topic: { title: day.title, day: day.day } });
    }
  };

  const formatStudyPlan = (data) => {
    if (!data) return { weeks: [], calendar: [], currentDay: 1 };
    if (data.weeks) return data;
    const weeks = [];
    const calendar = data.calendar || [];
    for (let i = 0; i < calendar.length; i += 7) {
      const weekDays = calendar.slice(i, i + 7);
      weeks.push({
        week: Math.floor(i / 7) + 1,
        title: weekDays[0]?.title || `Week ${Math.floor(i / 7) + 1}`,
        days: weekDays
      });
    }
    if (weeks.length === 0) weeks.push({ week: 1, title: 'Getting Started', days: [] });
    return { ...data, weeks };
  };

  const getDayStatus = (day) => {
    if (day.completed) return 'completed';
    // if (day.isToday) return 'current'; // Removed 'current' locking preference to allow viewing any free day

    const dayNum = parseInt(day.day, 10);

    // Lock Only if day > 5 AND not premium
    if (dayNum > 5 && !user?.isPremium) {
      return 'locked';
    }

    if (day.isToday) return 'current';

    return 'available';
  };

  if (loading) return <FancyLoader message="Loading your personalized plan..." />;

  if (!studyPlan) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={['#4F46E5', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.centerBox, { padding: 24, justifyContent: 'center' }]}
        >
          <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', padding: 20, borderRadius: 100, marginBottom: 24 }}>
            <Ionicons name="document-text" size={64} color="#FFF" />
          </View>
          <Text style={{ color: '#FFF', fontSize: 28, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>
            Unlock Your Career Brain
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginBottom: 32, fontSize: 16, lineHeight: 24 }}>
            {user?.hasResume
              ? "We can generate a personalized roadmap based on your Resume Gaps."
              : "Upload your resume to generate a personalized AI roadmap tailored to your skill gaps."}
          </Text>

          {user?.hasResume ? (
            <Button title="Generate AI Plan" onPress={loadStudyPlan} style={{ width: '100%', backgroundColor: '#FFF' }} textStyle={{ color: '#4F46E5', fontWeight: 'bold' }} />
          ) : (
            <View style={{ width: '100%', gap: 16 }}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Resume')}
                style={{
                  backgroundColor: '#FFF',
                  paddingVertical: 16,
                  borderRadius: 16,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 5
                }}
              >
                <Ionicons name="cloud-upload" size={20} color="#4F46E5" style={{ marginRight: 8 }} />
                <Text style={{ color: '#4F46E5', fontSize: 16, fontWeight: 'bold' }}>Upload Resume</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={loadStudyPlan} // Or handle basic plan generation
                style={{ padding: 12, alignItems: 'center' }}
              >
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Or generate basic plan</Text>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8F9FA' }]}>
      <StatusBar barStyle="light-content" />

      {/* Premium Header with Gradient */}
      <LinearGradient
        colors={['#4F46E5', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Study Roadmap</Text>
            <Text style={styles.headerSubtitle}>{studyPlan.title || 'Your Career Path'}</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={loadStudyPlan} style={{ padding: 8, marginRight: 4 }}>
                <Ionicons name="refresh" size={22} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>

              {user?.isPremium ? (
                <View style={styles.proBadge}><Text style={styles.proText}>PRO</Text></View>
              ) : (
                <Ionicons name="sparkles-outline" size={24} color="#FFF" />
              )}
            </View>
          </View>
        </View>

        {/* Floating Progress Card */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{studyPlan.currentDay || 1}</Text>
            <Text style={styles.statLabel}>Current Day</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{studyPlan.totalDays || 30}</Text>
            <Text style={styles.statLabel}>Total Days</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{Math.round(((studyPlan.completedDays || 0) / studyPlan.totalDays) * 100)}%</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={loadStudyPlan} />
        }
      >

        {/* Week Selector Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekScroll}>
          {studyPlan.weeks?.map((week, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setSelectedWeek(index)}
              style={[
                styles.weekTab,
                selectedWeek === index ? styles.activeWeekTab : styles.inactiveWeekTab,
                { borderColor: selectedWeek === index ? '#4F46E5' : '#E5E7EB' }
              ]}
            >
              <Text style={[
                styles.weekTabText,
                { color: selectedWeek === index ? '#4F46E5' : '#6B7280' }
              ]}>
                Week {week.week}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Timeline View */}
        <View style={styles.timelineContainer}>
          {studyPlan.weeks?.[selectedWeek]?.days?.map((day, index) => {
            const status = getDayStatus(day);
            const isLocked = status === 'locked';
            const isCompleted = status === 'completed';
            const isCurrent = status === 'current';

            return (
              <TouchableOpacity
                key={index}
                onPress={() => handleDayPress(day)}
                activeOpacity={0.9}
                style={[
                  styles.dayCard,
                  isCurrent && styles.currentDayCard,
                  isCompleted && styles.completedDayCard,
                  isLocked && styles.lockedDayCard
                ]}
              >
                <View style={styles.timelineLine} />
                <View style={[
                  styles.timelineDot,
                  isCompleted ? { backgroundColor: '#10B981' } :
                    isCurrent ? { backgroundColor: '#4F46E5', borderColor: '#C7D2FE', borderWidth: 4 } :
                      { backgroundColor: '#D1D5DB' }
                ]}>
                  {isCompleted && <Ionicons name="checkmark" size={12} color="#FFF" />}
                  {isLocked && <Ionicons name="lock-closed" size={12} color="#FFF" />}
                </View>

                <View style={styles.dayContent}>
                  <View style={styles.dayHeaderRow}>
                    <Text style={[styles.dayNumber, isCurrent && { color: '#4F46E5' }]}>DAY {day.day}</Text>
                    {isCurrent && <View style={styles.todayTag}><Text style={styles.todayText}>TODAY</Text></View>}
                    {!user?.isPremium && parseInt(day.day) <= 5 && !isCompleted && !isCurrent && (
                      <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 }}>
                        <Text style={{ color: '#065F46', fontSize: 10, fontWeight: 'bold' }}>FREE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.dayTitle, isLocked && { color: '#9CA3AF' }]} numberOfLines={2}>
                    {day.title}
                  </Text>
                  <View style={styles.dayMeta}>
                    <Ionicons name="time-outline" size={14} color="#6B7280" />
                    <Text style={styles.metaText}>{day.duration || '45 min'}</Text>
                    <View style={styles.metaDivider} />
                    <Ionicons name="pricetag-outline" size={14} color="#6B7280" />
                    <Text style={styles.metaText}>{day.skill || 'Core'}</Text>
                  </View>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isLocked ? "#D1D5DB" : "#9CA3AF"}
                  style={{ alignSelf: 'center' }}
                />
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={premiumModalVisible}
        onRequestClose={() => setPremiumModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '85%', backgroundColor: colors.surface, borderRadius: 24, padding: 0, overflow: 'hidden', elevation: 10 }}>
            <LinearGradient
              colors={[colors.premium || '#7F3DB5', '#4B0082']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 20, alignItems: 'center', justifyContent: 'center' }}
            >
              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <Ionicons name="diamond" size={32} color="#FFF" />
              </View>
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#FFF', textAlign: 'center' }}>
                Premium Locked 🔒
              </Text>
            </LinearGradient>

            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, color: colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 24 }}>
                The <Text style={{ fontWeight: 'bold', color: colors.text }}>Free Plan</Text> includes the first 5 days. Upgrade to unlock the full 30-Day Roadmap!
              </Text>

              <TouchableOpacity
                style={{ width: '100%', backgroundColor: colors.premium || '#7F3DB5', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 12, shadowColor: colors.premium, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
                onPress={() => {
                  setPremiumModalVisible(false);
                  navigation.navigate('Premium');
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#FFF' }}>
                  Unlock Full Plan 🚀
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ padding: 10 }}
                onPress={() => setPremiumModalVisible(false)}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingHorizontal: 20,
    paddingBottom: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },
  headerTitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '600', letterSpacing: 1 },
  headerSubtitle: { fontSize: 22, color: '#FFF', fontWeight: 'bold' },
  proBadge: { backgroundColor: '#F59E0B', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  proText: { color: '#FFF', fontWeight: 'bold', fontSize: 10 },

  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginTop: 10,
    marginBottom: -40, // Pulls it down over the content
  },
  statBox: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  divider: { width: 1, height: '100%', backgroundColor: '#E5E7EB' },

  scrollContent: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 40 },

  weekScroll: { marginBottom: 20, paddingVertical: 10 },
  weekTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
    backgroundColor: '#FFF',
  },
  activeWeekTab: { backgroundColor: '#EEF2FF' },
  inactiveWeekTab: { backgroundColor: '#FFF' },
  weekTabText: { fontSize: 14, fontWeight: '600' },

  timelineContainer: { marginTop: 10 },
  dayCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    // shadowColor etc kept for iOS but reduced complexity
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'flex-start',
    position: 'relative',
    overflow: 'hidden'
  },
  currentDayCard: { borderColor: '#4F46E5', borderWidth: 1, backgroundColor: '#FAFAFF' },
  completedDayCard: { opacity: 0.8 },
  lockedDayCard: { backgroundColor: '#F3F4F6', opacity: 0.9 },

  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    zIndex: 2,
    marginTop: 4
  },
  //   timelineLine: { // Optional vertical line effect
  //     position: 'absolute',
  //     left: 27,
  //     top: 30,
  //     bottom: -20,
  //     width: 2,
  //     backgroundColor: '#E5E7EB',
  //     zIndex: 1
  //   },

  dayContent: { flex: 1 },
  dayHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  dayNumber: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5 },
  todayTag: { backgroundColor: '#DEF7EC', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  todayText: { color: '#03543F', fontSize: 10, fontWeight: 'bold' },

  dayTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },

  dayMeta: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12, color: '#6B7280', marginLeft: 4 },
  metaDivider: { width: 1, height: 10, backgroundColor: '#D1D5DB', marginHorizontal: 8 },

  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

export default StudyPlanScreen;