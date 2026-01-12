import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { studyAPI } from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ProgressBar from '../../components/ProgressBar';

const StudyScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [studyData, setStudyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadStudyData();
  }, []);

  const loadStudyData = async () => {
    try {
      // Fetch actual plan from Backend
      const response = await studyAPI.getStudyPlan();
      if (response.data.success && response.data.data) {
        const plan = response.data.data;

        // Calculate Progress
        const totalDays = plan.calendar.length || 30;
        const completedDays = plan.calendar.filter(d => d.isCompleted).length;
        // Current day is the first uncompleted day, or the last day if all done
        const currentDayIndex = plan.calendar.findIndex(d => !d.isCompleted);
        const currentDay = currentDayIndex !== -1 ? currentDayIndex + 1 : totalDays;

        // Get tasks for the current active day
        const currentDayTasks = plan.calendar[currentDayIndex !== -1 ? currentDayIndex : 0]?.tasks || [];

        // Determine current topic title for Hero Section
        const currentTopicTitle = plan.calendar[currentDayIndex !== -1 ? currentDayIndex : 0]?.title || "Review";

        // Transform backend plan to UI format
        setStudyData({
          ...plan,
          currentStreak: response.data.data.streak || user.streak || 0,
          studyPlan: {
            totalDays: totalDays,
            currentDay: currentDay,
            completedDays: completedDays,
            progressPercentage: totalDays > 0 ? (completedDays / totalDays) * 100 : 0
          },
          todayTasks: currentDayTasks.length > 0 ? currentDayTasks : [
            { id: 't1', title: `Complete Day ${currentDay}: ${currentTopicTitle}`, completed: false, type: 'lesson', duration: '45m', skill: 'Core' }
          ],
          currentTopicTitle: currentTopicTitle,
          skillProgress: [ // Keep mock for now or fetch real later
            { name: 'JavaScript', progress: 0.85, confidence: 72, testsCompleted: 8 },
            { name: 'React', progress: 0.65, confidence: 45, testsCompleted: 5 },
            { name: 'Node.js', progress: 0.40, confidence: 38, testsCompleted: 3 },
          ],
          weeklyGoal: {
            studyHours: { target: 10, completed: 6.5 },
            testsCompleted: { target: 5, completed: 3 },
          },
        });
      } else {
        // Fallback / First time logic
        setStudyData({ studyPlan: { totalDays: 30 }, todayTasks: [], skillProgress: [] });
      }
    } catch (error) {
      console.error('Error loading study data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateCustomPlan = async () => {
    if (!user?.isPremium && user?.planType !== 'custom_plan') {
      setCustomModalVisible(false);
      Alert.alert("Premium Required", "Custom Study Plans are a Pro feature.", [
        { text: "Cancel", style: "cancel" },
        { text: "Upgrade", onPress: () => navigation.navigate("Premium") }
      ]);
      return;
    }

    if (!customPrompt.trim()) return;

    setGenerating(true);
    try {
      const response = await studyAPI.generateCustomStudyPlan(customPrompt);
      if (response.data.success) {
        Alert.alert("Success", "Your new custom plan is ready!");
        setCustomModalVisible(false);
        loadStudyData(); // Reload to show new plan
      }
    } catch (error) {
      Alert.alert("Error", "Failed to create custom plan.");
    } finally {
      setGenerating(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStudyData();
  };

  const handleTaskComplete = async (taskId) => {
    try {
      // Update task completion status
      setStudyData(prev => ({
        ...prev,
        todayTasks: prev.todayTasks.map(task =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        ),
      }));

      // Mock API call
      // await studyAPI.markTaskCompleted(taskId);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleStartExam = (skill) => {
    navigation.navigate('Exam', { skill });
  };

  const togglePlacementMode = () => {
    setStudyData(prev => ({
      ...prev,
      placementMode: !prev.placementMode,
    }));
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 70) return colors.success;
    if (confidence >= 50) return colors.warning;
    return colors.danger;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading your study plan...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>
              Study Planner
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              30-day AI-powered learning journey
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('StudyPlan')}
            style={styles.planButton}
          >
            <Icon name="calendar-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Placement Mode Toggle */}
        <Card>
          <View style={styles.placementModeHeader}>
            <View style={styles.placementModeInfo}>
              <Text style={[styles.placementModeTitle, { color: colors.text }]}>
                Placement Mode
              </Text>
              <Text style={[styles.placementModeDesc, { color: colors.textSecondary }]}>
                Focus only on weak skills for job readiness
              </Text>
            </View>
            <TouchableOpacity
              onPress={togglePlacementMode}
              style={[
                styles.toggleSwitch,
                {
                  backgroundColor: studyData.placementMode ? colors.primary : colors.border,
                }
              ]}
            >
              <View style={[
                styles.toggleThumb,
                {
                  backgroundColor: colors.card,
                  transform: [{ translateX: studyData.placementMode ? 20 : 2 }],
                }
              ]} />
            </TouchableOpacity>
          </View>
          {studyData.placementMode && (
            <Text style={[styles.placementModeActive, { color: colors.primary }]}>
              🎯 Placement mode active! Focusing on weak skills.
            </Text>
          )}
        </Card>

        {/* Study Streak */}
        <Card>
          <View style={styles.streakContainer}>
            <Icon name="flame" size={32} color={colors.warning} />
            <View style={styles.streakText}>
              <Text style={[styles.streakNumber, { color: colors.text }]}>
                {studyData.currentStreak} Day Streak! 🔥
              </Text>
              <Text style={[styles.streakSubtext, { color: colors.textSecondary }]}>
                Keep the momentum going!
              </Text>
            </View>
          </View>
        </Card>

        {/* Learning Path Hero */}
        <Card>
          <View style={styles.heroHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 4 }]}>
                Your Learning Path
              </Text>
              <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
                Master Data Structures & Algorithms
              </Text>
            </View>
            <Icon name="map-outline" size={28} color={colors.primary} />
          </View>

          <View style={styles.heroProgress}>
            <View style={styles.planProgress}>
              <Text style={[styles.planDays, { color: colors.textSecondary }]}>
                Day {studyData.studyPlan.currentDay} of {studyData.studyPlan.totalDays}
              </Text>
              <Text style={[styles.planPercentage, { color: colors.primary }]}>
                {Math.round(studyData.studyPlan.progressPercentage || 0)}%
              </Text>
            </View>
            <ProgressBar
              progress={(studyData.studyPlan.progressPercentage || 0) / 100}
              color={colors.primary}
              showPercentage={false}
            />
            <Text style={[styles.heroStatus, { color: colors.primary, marginTop: 12 }]}>
              Current: {studyData.currentTopicTitle}
            </Text>
          </View>

          <Button
            title="Start Today's Lesson ▶"
            onPress={() => navigation.navigate('TopicDetail', {
              topic: {
                title: studyData.currentTopicTitle,
                day: studyData.studyPlan.currentDay
              }
            })}
            style={styles.heroButton}
          />
        </Card>

        {/* Weekly Goals */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            This Week's Goals
          </Text>
          <View style={styles.goalItem}>
            <Text style={[styles.goalLabel, { color: colors.text }]}>
              Study Hours
            </Text>
            <ProgressBar
              progress={(studyData?.weeklyGoal?.studyHours?.completed || 0) / (studyData?.weeklyGoal?.studyHours?.target || 1)}
              label={`${studyData?.weeklyGoal?.studyHours?.completed || 0}h / ${studyData?.weeklyGoal?.studyHours?.target || 10}h`}
              color={colors.primary}
            />
          </View>
          <View style={styles.goalItem}>
            <Text style={[styles.goalLabel, { color: colors.text }]}>
              Tests Completed
            </Text>
            <ProgressBar
              progress={(studyData?.weeklyGoal?.testsCompleted?.completed || 0) / (studyData?.weeklyGoal?.testsCompleted?.target || 1)}
              label={`${studyData?.weeklyGoal?.testsCompleted?.completed || 0} / ${studyData?.weeklyGoal?.testsCompleted?.target || 5} tests`}
              color={colors.secondary}
            />
          </View>
        </Card>

        {/* Today's Tasks */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Today's Tasks
          </Text>
          {studyData.todayTasks.map((task) => (
            <TouchableOpacity
              key={task.id || Math.random()}
              style={[
                styles.taskCard,
                { backgroundColor: colors.surface }
              ]}
              onPress={() => {
                // Smart Navigation based on Task Type
                if (task.type === 'lesson' || !task.type) {
                  // Navigate to TopicDetail
                  navigation.navigate('TopicDetail', {
                    topic: {
                      title: task.topicTitle || studyData.currentTopicTitle,
                      day: task.day || studyData.studyPlan.currentDay
                    }
                  });
                } else if (task.type === 'test') {
                  navigation.navigate('Exam', { skill: task.skill });
                }
              }}
            >
              <View style={styles.taskHeader}>
                <TouchableOpacity
                  onPress={() => handleTaskComplete(task.id)}
                  style={styles.taskCheckbox}
                >
                  <Icon
                    name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={task.completed ? colors.success : colors.textSecondary}
                  />
                </TouchableOpacity>
                <View style={styles.taskInfo}>
                  <Text style={[
                    styles.taskTitle,
                    {
                      color: task.completed ? colors.textSecondary : colors.text,
                      textDecorationLine: task.completed ? 'line-through' : 'none',
                    }
                  ]}>
                    {task.title}
                  </Text>
                  <Text style={[styles.taskDescription, { color: colors.textSecondary }]}>
                    {task.description || "Tap to start learning"}
                  </Text>
                  <View style={styles.taskMeta}>
                    <Text style={[styles.taskDuration, { color: colors.textSecondary }]}>
                      ⏱️ {task.duration || "30m"}
                    </Text>
                    <Text style={[styles.taskSkill, { color: colors.primary }]}>
                      {task.skill || "Skill"}
                    </Text>
                  </View>
                </View>
                {/* Chevron to indicate clickable */}
                <Icon name="chevron-forward" size={20} color={colors.textSecondary} style={{ alignSelf: 'center' }} />
              </View>
            </TouchableOpacity>
          ))}
        </Card>

        {/* Skill Assessments (Old MCQ) */}
        <Card>
          <View style={styles.sectionHeader}>
            <Icon name="school" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0, marginLeft: 8 }]}>
              Skill Assessments
            </Text>
          </View>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Take timed exams to test your knowledge.
          </Text>

          <View style={styles.assessmentGrid}>
            {['JavaScript', 'React', 'Node.js'].map((skill) => (
              <TouchableOpacity
                key={skill}
                style={[styles.assessmentItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => navigation.navigate('Exam', { skill: skill })}
              >
                <Text style={[styles.assessmentText, { color: colors.text }]}>{skill}</Text>
                <Icon name="arrow-forward-circle" size={20} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Skill Progress & Confidence */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Skill Progress & Confidence
          </Text>
          {studyData.skillProgress.map((skill, index) => (
            <View key={index} style={styles.skillItem}>
              <View style={styles.skillHeader}>
                <Text style={[styles.skillName, { color: colors.text }]}>
                  {skill.name}
                </Text>
                <View style={styles.skillStats}>
                  <Text style={[
                    styles.confidenceText,
                    { color: getConfidenceColor(skill.confidence) }
                  ]}>
                    {skill.confidence}% confident
                  </Text>
                  <Text style={[styles.testsCount, { color: colors.textSecondary }]}>
                    {skill.testsCompleted} tests
                  </Text>
                </View>
              </View>
              <ProgressBar
                progress={skill.progress}
                showPercentage={false}
                color={getConfidenceColor(skill.confidence)}
              />
              <View style={styles.skillActions}>
                <Button
                  title="Take Test"
                  onPress={() => handleStartExam(skill.name)}
                  size="small"
                  variant={skill.confidence < 50 ? 'primary' : 'secondary'}
                  style={styles.skillActionButton}
                />
                {skill.confidence < 70 && (
                  <Text style={[styles.needsFocus, { color: colors.danger }]}>
                    Needs focus
                  </Text>
                )}
              </View>
            </View>
          ))}
        </Card>

        {/* Quick Actions */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            CareerLoop AI Features
          </Text>
          <View style={styles.quickActions}>
            <Button
              title="🎯 Learning Path"
              onPress={() => navigation.navigate('TopicTimeline')}
              variant="secondary"
              style={styles.quickActionButton}
            />
            <Button
              title="⚡ MCQ Arena"
              onPress={() => navigation.navigate('TopicTimeline')} // Redirect to Timeline so they pick a topic
              variant="secondary"
              style={styles.quickActionButton}
            />
          </View>
          <View style={styles.quickActions}>
            <Button
              title="📚 Study Plan"
              onPress={() => navigation.navigate('StudyPlan')}
              variant="secondary"
              style={styles.quickActionButton}
            />
            <Button
              title="✨ Custom Plan"
              onPress={() => setCustomModalVisible(true)}
              variant="primary"
              style={styles.quickActionButton}
            />
          </View>
        </Card>
      </ScrollView>

      {/* Custom Plan Modal */}
      <Modal
        visible={customModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCustomModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <Card style={{ width: '90%', padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>Create Custom Plan</Text>
              <TouchableOpacity onPress={() => setCustomModalVisible(false)}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {!user?.isPremium && (
              <View style={{ backgroundColor: colors.primary + '20', padding: 10, borderRadius: 8, marginBottom: 15 }}>
                <Text style={{ color: colors.primary, fontSize: 12 }}>🔒 Pro Feature: Upgrade to create unlimited custom plans.</Text>
              </View>
            )}

            <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>What do you want to learn?</Text>
            <TextInput
              value={customPrompt}
              onChangeText={setCustomPrompt}
              placeholder="e.g. Master Docker in 2 weeks, Learn Rust basics"
              placeholderTextColor={colors.textSecondary}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                color: colors.text,
                marginBottom: 20
              }}
            />

            <Button
              title={generating ? "Generating AI Plan..." : "Create Plan"}
              onPress={handleCreateCustomPlan}
              loading={generating}
            />
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  planButton: {
    padding: 8,
  },
  placementModeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placementModeInfo: {
    flex: 1,
  },
  placementModeTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  placementModeDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  placementModeActive: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  streakContainer: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  planProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planDays: {
    fontSize: 14,
  },
  planPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  viewPlanButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  goalItem: {
    marginBottom: 16,
  },
  goalLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  taskCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  taskCheckbox: {
    marginRight: 12,
    marginTop: 2,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskDuration: {
    fontSize: 12,
  },
  taskSkill: {
    fontSize: 12,
    fontWeight: '500',
  },
  startTestButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  skillItem: {
    marginBottom: 20,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  skillName: {
    fontSize: 16,
    fontWeight: '600',
  },
  skillStats: {
    alignItems: 'flex-end',
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '500',
  },
  testsCount: {
    fontSize: 10,
    marginTop: 2,
  },
  skillActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  skillActionButton: {
    alignSelf: 'flex-start',
  },
  needsFocus: {
    fontSize: 10,
    fontWeight: '500',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: 14,
  },
  heroProgress: {
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  nodeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  nodeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  lineSegment: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
  },
  heroStatus: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  heroButton: {
    width: '100%',
  },
  assessmentGrid: {
    marginTop: 12,
  },
  assessmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  assessmentText: {
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default StudyScreen;