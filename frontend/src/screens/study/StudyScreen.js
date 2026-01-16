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
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
// Backward compatibility for existing code using <Icon />
const Icon = Ionicons;
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { studyAPI } from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ProgressBar from '../../components/ProgressBar';
import FancyLoader from '../../components/FancyLoader';
import AdBanner from '../../components/AdBanner';

const StudyScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user, refreshUser } = useAuth();
  const isFocused = useIsFocused();
  const [studyData, setStudyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('mcq'); // 'mcq' or 'plan'
  const [customPrompt, setCustomPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (isFocused) {
      loadStudyData();
      if (refreshUser) refreshUser(); // Sync latest profile (premium, minutes, streak)
    }
  }, [isFocused]);

  const loadStudyData = async () => {
    try {
      const response = await studyAPI.getStudyPlan();
      if (response.data.success && response.data.data) {
        const plan = response.data.data;
        const totalDays = plan.calendar.length || 30;
        const completedDays = plan.calendar.filter(d => d.isCompleted).length;
        const currentDayIndex = plan.calendar.findIndex(d => !d.isCompleted);
        const currentDay = currentDayIndex !== -1 ? currentDayIndex + 1 : totalDays;
        const currentDayTasksRaw = plan.calendar[currentDayIndex !== -1 ? currentDayIndex : 0]?.tasks || [];
        const currentDayTasks = currentDayTasksRaw.map(t => ({
          ...t,
          id: t._id || t.id // Ensure ID is accessible
        }));

        const currentTopicTitle = plan.calendar[currentDayIndex !== -1 ? currentDayIndex : 0]?.title || "Review";

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
          skillProgress: [],
          weeklyGoal: {
            studyHours: { target: 10, completed: Math.round((user?.studyMinutes || 0) / 60 * 10) / 10 },
            testsCompleted: { target: 5, completed: user?.dailyMcqCount || 0 },
          },
        });
      } else {
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
        loadStudyData();
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
    // Handle Placeholder Task
    if (taskId === 't1') {
      Alert.alert("Start Learning", "To complete this daily goal, please finish the lesson content first!", [
        { text: "Go to Lesson", onPress: () => navigation.navigate('TopicDetail', { topic: { title: studyData.currentTopicTitle, day: studyData.studyPlan.currentDay } }) },
        { text: "Cancel", style: "cancel" }
      ]);
      return;
    }

    // Calculate new status
    const task = studyData.todayTasks.find(t => t.id === taskId);
    const newStatus = !task?.completed;

    // Optimistic Update
    setStudyData(prev => ({
      ...prev,
      todayTasks: prev.todayTasks.map(t =>
        t.id === taskId ? { ...t, completed: newStatus } : t
      ),
    }));

    try {
      await studyAPI.markTaskCompleted(taskId, newStatus);
    } catch (error) {
      console.error('Error updating task:', error);
      // Revert if failed
      setStudyData(prev => ({
        ...prev,
        todayTasks: prev.todayTasks.map(t =>
          t.id === taskId ? { ...t, completed: !newStatus } : t
        ),
      }));
      Alert.alert("Error", "Failed to save task status. Check connection.");
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
        <FancyLoader message="Wait our Ai is creating to u a studu plan..." />
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

        {/* Learning Path - GATED by Resume */}
        {user?.hasResume ? (
          <Card>
            <View style={styles.heroHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 4 }]}>
                  Your Learning Path
                </Text>
                <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
                  {studyData.studyPlan.title || 'Personalized Study Plan'}
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
        ) : (
          <Card style={{ alignItems: 'center', padding: 24, marginBottom: 20 }}>
            <Ionicons name="rocket-outline" size={48} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16, textAlign: 'center' }]}>
              Start Your Journey
            </Text>
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 20 }}>
              Upload your resume so our AI can build your custom curriculum and skill gap analysis.
            </Text>
            <Button
              title="Upload Resume Now 🚀"
              onPress={() => navigation.navigate('Resume')}
              style={{ width: '100%' }}
            />
          </Card>
        )}

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
                if (task.type === 'lesson' || !task.type) {
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
                <Icon name="chevron-forward" size={20} color={colors.textSecondary} style={{ alignSelf: 'center' }} />
              </View>
            </TouchableOpacity>
          ))}
        </Card>

        {/* Skill Assessments - GATED by Resume */}
        {!user?.hasResume ? null : (
          <>
            <Card>
              <View style={styles.sectionHeader}>
                <Icon name="school" size={24} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0, marginLeft: 8 }]}>
                  Skill Assessments
                </Text>
              </View>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Take timed exams based on your resume skills.
              </Text>

              <View style={styles.assessmentGrid}>
                {user?.skills?.map((skill, index) => (
                  <TouchableOpacity
                    key={`${skill}-${index}`}
                    style={[styles.assessmentItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => navigation.navigate('Exam', { skill: skill })}
                  >
                    <Text style={[styles.assessmentText, { color: colors.text }]} numberOfLines={1}>{skill}</Text>
                    <Icon name="arrow-forward-circle" size={20} color={colors.primary} />
                  </TouchableOpacity>
                ))}
                {(!user?.skills || user.skills.length === 0) && (
                  <Text style={{ color: colors.textSecondary, fontStyle: 'italic', padding: 10 }}>
                    No specific skills found. Try re-analyzing your resume.
                  </Text>
                )}
              </View>
            </Card>

            <Card>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Skill Progress & Confidence
              </Text>
              {studyData.skillProgress.length > 0 ? (
                studyData.skillProgress.map((skill, index) => (
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
                ))
              ) : (
                <Text style={{ color: colors.textSecondary }}>Take an exam to see your progress!</Text>
              )}
            </Card>
          </>
        )}

        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            CareerLoop AI Features
          </Text>
          <View style={styles.quickActions}>
            <Button
              title="📚 Study Planner (30-Day)"
              onPress={() => navigation.navigate('StudyPlan')}
              variant="secondary"
              style={[styles.quickActionButton, { marginBottom: 10, width: '100%' }]}
            />
          </View>
          <View style={styles.quickActions}>
            <Button
              title="⚡ MCQ Hub"
              onPress={() => {
                setModalMode('mcq');
                setCustomPrompt('');
                setCustomModalVisible(true);
              }}
              variant="secondary"
              style={styles.quickActionButton}
            />
            <Button
              title="✨ Custom AI"
              onPress={() => {
                if (!user?.isPremium) {
                  setPremiumModalVisible(true);
                } else {
                  setModalMode('plan');
                  setCustomPrompt('');
                  setCustomModalVisible(true);
                }
              }}
              variant="primary"
              style={styles.quickActionButton}
            />
          </View>
        </Card>
      </ScrollView>

      <Modal
        visible={customModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCustomModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <Card style={{ width: '90%', maxHeight: '80%', padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>
                {modalMode === 'mcq' ? 'MCQ Arena ⚔️' : 'Custom AI Learning ✨'}
              </Text>
              <TouchableOpacity onPress={() => setCustomModalVisible(false)}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>
              {modalMode === 'mcq' ? 'Enter topic for quiz:' : 'Enter any topic or skill:'}
            </Text>
            <TextInput
              value={customPrompt}
              onChangeText={setCustomPrompt}
              placeholder={modalMode === 'mcq' ? "e.g. React Hooks, Python Basics" : "e.g. Advanced Rust, System Design"}
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

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
              {modalMode === 'plan' && (
                <Button
                  title={generating ? "Generating..." : "Create Plan 📅"}
                  onPress={handleCreateCustomPlan}
                  loading={generating}
                  style={{ flex: 1 }}
                />
              )}

              {modalMode === 'mcq' && (
                <Button
                  title="Start Quiz 📝"
                  onPress={() => {
                    if (!customPrompt.trim()) {
                      Alert.alert("Required", "Please enter a topic first.");
                      return;
                    }
                    setCustomModalVisible(false);
                    navigation.navigate('MCQArena', { topic: customPrompt, freeAccess: true }); // Explictly free if accessed here
                  }}
                  variant="primary"
                  style={{ flex: 1 }}
                />
              )}
            </View>
          </Card>
        </KeyboardAvoidingView>
      </Modal>
      <Modal
        animationType="fade"
        transparent={true}
        visible={premiumModalVisible}
        onRequestClose={() => setPremiumModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '85%', backgroundColor: colors.surface, borderRadius: 24, padding: 0, overflow: 'hidden', elevation: 10 }}>
            <LinearGradient
              colors={[colors.premium, '#7F3DB5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 20, alignItems: 'center', justifyContent: 'center' }}
            >
              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <Icon name="diamond" size={32} color="#FFF" />
              </View>
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#FFF', textAlign: 'center' }}>
                Premium Feature 💎
              </Text>
            </LinearGradient>

            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, color: colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 24 }}>
                The <Text style={{ fontWeight: 'bold', color: colors.text }}>MCQ Hub</Text> and <Text style={{ fontWeight: 'bold', color: colors.text }}>Custom AI Plans</Text> are exclusive to Pro members.
              </Text>

              <TouchableOpacity
                style={{ width: '100%', backgroundColor: colors.premium, paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 12, shadowColor: colors.premium, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
                onPress={() => {
                  setPremiumModalVisible(false);
                  navigation.navigate('Premium');
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#FFF' }}>
                  Upgrade to Pro 🚀
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                padding={10}
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
      <AdBanner />
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