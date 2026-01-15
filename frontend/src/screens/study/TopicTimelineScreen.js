import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { studyAPI } from '../../services/api';

const TopicTimelineScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth(); // Get user status
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimeline();
  }, []);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      const response = await studyAPI.getStudyPlan();
      if (response.data.success && response.data.data) {
        const plan = response.data.data;
        // Transform user plan to timeline format
        const topics = plan.calendar.map((day, index) => {
          // Determine status based on completion and previous day
          let status = 'locked';

          // Logic: 
          // - If Day 1: Open
          // - If Previous Day Completed: Open (or 'current')
          // - If Completed: 'completed'

          const prevDay = plan.calendar[index - 1];
          if (day.isCompleted) {
            status = 'completed';
          } else if (index === 0 || (prevDay && prevDay.isCompleted)) {
            status = 'current';
          }

          return {
            id: day._id || index,
            title: day.title,
            day: day.day,
            status: status,
            premium: day.day > 7 // Example logic
          };
        });
        setTimelineData(topics);
      } else {
        // Fallback / No Plan Found
        // Ideally prompt to create plan
        setTimelineData([]);
      }
    } catch (error) {
      console.error("Failed to load timeline", error);
    } finally {
      setLoading(false);
    }
  };

  const isLocked = (topic) => {
    // Premium Users: EVERYTHING Unlocked (Bypass sequential & day limits)
    if (user?.isPremium) return false;

    // Free Users: Day 6+ Locked
    if (topic.day > 5) return true;

    // Free Users: Sequential Lock (Must complete previous day)
    // if (topic.status === 'locked') return true; 
    // User requested "unlock" generally, so maybe we relax sequential lock for everyone for first 5 days?
    // Let's keep sequential lock for Free users to guide them, but unlock everything for Premium.
    if (topic.status === 'locked') return true;

    return false;
  };

  const handleTopicPress = (topic) => {
    // Check dynamic lock status
    if (!user?.isPremium && topic.day > 5) {
      Alert.alert(
        'Premium Content 🔒',
        `Day ${topic.day} is available only for Pro members.\nFree plan includes the first 5 days.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Unlock Full Course', onPress: () => navigation.navigate('Premium') }
        ]
      );
      return;
    }

    if (topic.status === 'locked') {
      Alert.alert('Locked 🔒', 'Complete the previous day\'s quiz to unlock this topic!');
      return;
    }

    // Navigate to detailed study view
    navigation.navigate('TopicDetail', { topic });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
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
          Learning Path {user?.isPremium ? '💎' : ''}
        </Text>
        <TouchableOpacity onPress={loadTimeline} style={styles.backButton}>
          <Ionicons name="refresh" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Free Plan Notice */}
        {!user?.isPremium && (
          <Card style={{ marginBottom: 20, backgroundColor: colors.primary + '10' }}>
            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Free Plan Limit: Days 1-5</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              Upgrade to CareerLoop Pro to unlock the full 30-day course.
            </Text>
          </Card>
        )}

        <View style={styles.timelineContainer}>
          {timelineData.map((topic, index) => {
            const locked = isLocked(topic);
            const status = topic.status; // isLocked logic handles alerts, status handles color

            return (
              <View key={topic.id} style={styles.timelineItem}>
                {/* Line Connector */}
                {index !== timelineData.length - 1 && (
                  <View
                    style={[
                      styles.connector,
                      {
                        backgroundColor: status === 'completed' ? colors.success : colors.border
                      }
                    ]}
                  />
                )}

                {/* Node Icon */}
                <TouchableOpacity
                  onPress={() => handleTopicPress(topic)}
                  activeOpacity={0.8}
                  style={[
                    styles.node,
                    {
                      backgroundColor:
                        status === 'completed' ? colors.success :
                          (status === 'current' && !locked) ? colors.primary :
                            colors.surface,
                      borderColor:
                        (status === 'current' && !locked) ? colors.primary : colors.border
                    }
                  ]}
                >
                  {status === 'completed' ? (
                    <Ionicons name="checkmark" size={20} color="#FFF" />
                  ) : locked ? (
                    <Ionicons name="lock-closed" size={18} color={colors.textSecondary} />
                  ) : (
                    <Ionicons name="play" size={20} color={status === 'current' ? "#FFF" : colors.primary} />
                  )}
                </TouchableOpacity>

                {/* Content Card */}
                <Card
                  style={[
                    styles.topicCard,
                    status === 'current' && !locked && { borderColor: colors.primary, borderWidth: 1 }
                  ]}
                  onPress={() => handleTopicPress(topic)}
                >
                  <View style={styles.topicHeader}>
                    <Text style={[
                      styles.dayText,
                      { color: (status === 'current' && !locked) ? colors.primary : colors.textSecondary }
                    ]}>
                      DAY {topic.day}
                    </Text>
                    {locked && (
                      <View style={[styles.premiumBadge, { backgroundColor: colors.textSecondary }]}>
                        <Text style={styles.premiumText}>LOCKED</Text>
                      </View>
                    )}
                    {!locked && topic.premium && (
                      <View style={[styles.premiumBadge, { backgroundColor: colors.premium }]}>
                        <Text style={styles.premiumText}>PRO</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[
                    styles.topicTitle,
                    { color: locked ? colors.textSecondary : colors.text }
                  ]}>
                    {topic.title}
                  </Text>
                </Card>
              </View>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            More topics unlock as you progress!
          </Text>
        </View>
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
    padding: 20,
  },
  timelineContainer: {
    paddingLeft: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
    position: 'relative',
  },
  connector: {
    position: 'absolute',
    left: 17, // Center of node (35/2) - half line width (1)
    top: 35,
    bottom: -24,
    width: 2,
    // zIndex: -1, // Removed to ensure visibility on Android, stacking order handles it
  },
  node: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
  },
  topicCard: {
    flex: 1,
    marginTop: 0,
    marginBottom: 0,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  premiumBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  footerText: {
    fontSize: 14,
  }
});

export default TopicTimelineScreen;