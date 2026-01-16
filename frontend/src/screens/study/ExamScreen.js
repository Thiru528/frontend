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
import { useAuth } from '../../context/AuthContext';
import { examAPI } from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Component from '../../components/ProgressBar';
import { AdService } from '../../services/AdService';

const ExamScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { skill, day } = route.params || {};
  const [examStarted, setExamStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Preparing your exam...');
  const [timeLeft, setTimeLeft] = useState(300);

  // Rotating Loading Messages
  useEffect(() => {
    let messageInterval;
    if (loading) {
      const messages = [
        "Contacting AI Tutor... 🤖",
        "Analysing your skill level... 📊",
        "Curating challenging questions... 🧠",
        "Preparing offline backup... 💾",
        "Almost ready! 🚀"
      ];
      let i = 0;
      messageInterval = setInterval(() => {
        setLoadingMessage(messages[i]);
        i = (i + 1) % messages.length;
      }, 2500);
    }
    return () => clearInterval(messageInterval);
  }, [loading]);

  // Reset state when route params change (e.g. retake)
  useEffect(() => {
    setExamStarted(false);
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setTimeLeft(300);
    setLoading(true);
    setLoadingMessage("Connecting to AI Tutor...");
    setLoadingMessage("Connecting to AI Tutor...");
    AdService.initialize(); // Preload ads
    loadExamQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.timestamp]);

  useEffect(() => {
    let timer;
    if (examStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [examStarted, timeLeft]);

  const loadExamQuestions = async () => {
    try {
      // Use user's target role or first interest, fallback to skill param or 'JavaScript'
      const userDefaultSkill = user?.targetRole || user?.interests?.[0] || 'JavaScript';
      const skillToFetch = skill || userDefaultSkill;

      const response = await examAPI.getQuestionsForSkill(skillToFetch);

      if (response.data.success) {
        console.log('✅ EXAM DATA RECEIVED FROM AI:', response.data.data);

        // Filter out bad questions (empty options)
        const validQuestions = response.data.data.questions.filter(q =>
          q.options &&
          q.options.length > 1 &&
          q.options.every(o => o && o.toString().trim().length > 0)
        );

        if (validQuestions.length === 0) {
          throw new Error("No valid questions received from AI content generator.");
        }

        const validExamData = {
          ...response.data.data,
          questions: validQuestions
        };

        setExamData(validExamData);
        setTimeLeft(response.data.data.duration);

        // Nudge for Resume if not present
        if (!user?.hasResume) {
          Alert.alert(
            "Personalize Your Exams 🎯",
            "Upload your resume to get questions tailored to your specific skill gaps!",
            [
              { text: "Later", style: "cancel" },
              { text: "Upload Now", onPress: () => navigation.navigate('Resume') }
            ]
          );
        }
      } else {
        console.error('❌ EXAM DATA ERROR:', response.data.message);
        throw new Error(response.data.message || 'Failed to get questions');
      }
    } catch (error) {
      console.error('Error loading exam questions:', error);
      Alert.alert('Error', 'Failed to load exam questions. Please try again.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const startExam = () => {
    setExamStarted(true);
    setTimeLeft(examData.duration);
  };

  const handleAnswerSelect = (questionId, answerIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestion < examData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleTimeUp = () => {
    Alert.alert(
      'Time Up!',
      'Your exam time has ended. Submitting your answers.',
      [{ text: 'OK', onPress: submitExam }]
    );
  };

  const submitExam = async () => {
    const results = calculateResults();

    // Call API to save internal progress
    try {
      setLoading(true);

      // 1. Log Exam Completion for Streak/Goals (Fire & Forget or Await)
      studyAPI.logExamCompletion().catch(err => console.log("Log Exam Failed", err));

      // 2. Optimistic Update (Immediate "Tasks Completed" inc)
      if (user && updateUser) {
        updateUser({
          ...user,
          dailyMcqCount: (user.dailyMcqCount || 0) + 1,
          streak: (user.dailyMcqCount > 0) ? user.streak : (user.streak || 0) + 1 // Simple optimistic streak logic
        });
      }

      // 3. Save Detailed Results (Existing)
      await examAPI.submitExamAnswers({
        skill: examData.skill,
        score: results.percentage,
        passed: results.passed
      });

      // Show Interstitial Ad before navigating
      await AdService.showInterstitial();

    } catch (error) {
      console.error('Failed to save exam results', error);
      // We continue to show results even if save fails, but maybe show alert?
      // Alert.alert("Note", "Could not save progress to server.");
    } finally {
      setLoading(false);
      navigation.replace('ExamResult', {
        results,
        examData,
        selectedAnswers,
        skill: examData.skill,
      });
    }
  };

  const calculateResults = () => {
    let correctAnswers = 0;
    const totalQuestions = examData.questions.length;

    examData.questions.forEach(question => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = percentage >= 70; // 70% pass threshold

    return {
      correctAnswers,
      totalQuestions,
      percentage,
      passed,
      timeSpent: examData.duration - timeLeft,
    };
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft <= 60) return colors.danger; // Last minute
    if (timeLeft <= 180) return colors.warning; // Last 3 minutes
    return colors.text;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text, fontSize: 18, fontWeight: '500', marginTop: 20 }]}>
            {examStarted ? 'Submitting Exam...' : loadingMessage}
          </Text>
          <Text style={{ marginTop: 10, color: colors.textSecondary, fontSize: 14 }}>
            (This might take 10-15 seconds)
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!examData) return null;

  if (!examStarted) {
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
            {examData.skill} Exam
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Exam Info */}
          <Card>
            <View style={styles.examInfoHeader}>
              <Ionicons name="school" size={32} color={colors.primary} />
              <Text style={[styles.examTitle, { color: colors.text }]}>
                {examData.skill} Assessment
              </Text>
            </View>

            <View style={styles.examDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="help-circle-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.detailText, { color: colors.text }]}>
                  {examData.totalQuestions} Questions
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.detailText, { color: colors.text }]}>
                  {Math.floor(examData.duration / 60)} Minutes
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.detailText, { color: colors.text }]}>
                  70% to Pass
                </Text>
              </View>
            </View>
          </Card>

          {/* Instructions */}
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Instructions
            </Text>
            <View style={styles.instructions}>
              <Text style={[styles.instructionItem, { color: colors.text }]}>
                • Read each question carefully before selecting an answer
              </Text>
              <Text style={[styles.instructionItem, { color: colors.text }]}>
                • You can navigate between questions using Next/Previous buttons
              </Text>
              <Text style={[styles.instructionItem, { color: colors.text }]}>
                • Your progress is saved automatically
              </Text>
              <Text style={[styles.instructionItem, { color: colors.text }]}>
                • You need 70% or higher to pass this exam
              </Text>
              <Text style={[styles.instructionItem, { color: colors.text }]}>
                • Timer will start once you begin the exam
              </Text>
            </View>
          </Card>

          {/* Start Button */}
          <Button
            title="Start Exam"
            onPress={startExam}
            style={styles.startButton}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const question = examData.questions?.[currentQuestion];
  const progress = (currentQuestion + 1) / (examData.questions?.length || 1);

  if (!question) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.text }}>Loading Question...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Timer */}
      <View style={[styles.examHeader, { backgroundColor: colors.surface }]}>
        <View style={styles.examHeaderContent}>
          <Text style={[styles.questionCounter, { color: colors.text }]}>
            Question {currentQuestion + 1} of {examData.questions.length}
          </Text>
          <Text style={[styles.timer, { color: getTimeColor() }]}>
            ⏱️ {formatTime(timeLeft)}
          </Text>
        </View>
        <ProgressBar
          progress={progress}
          color={colors.primary}
          showPercentage={false}
          height={4}
        />
      </View>

      <ScrollView contentContainerStyle={styles.examContent}>
        {/* Question */}
        <Card>
          <Text style={[styles.questionText, { color: colors.text }]}>
            {question.question}
          </Text>

          <View style={styles.optionsContainer}>
            {question.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleAnswerSelect(question.id, index)}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: selectedAnswers[question.id] === index
                      ? colors.primary + '20'
                      : colors.surface,
                    borderColor: selectedAnswers[question.id] === index
                      ? colors.primary
                      : colors.border,
                  }
                ]}
              >
                <View style={styles.optionContent}>
                  <View style={[
                    styles.optionRadio,
                    {
                      borderColor: selectedAnswers[question.id] === index
                        ? colors.primary
                        : colors.border,
                      backgroundColor: selectedAnswers[question.id] === index
                        ? colors.primary
                        : 'transparent',
                    }
                  ]}>
                    {selectedAnswers[question.id] === index && (
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    )}
                  </View>
                  <Text style={[
                    styles.optionText,
                    {
                      color: selectedAnswers[question.id] === index
                        ? colors.primary
                        : colors.text,
                    }
                  ]}>
                    {option}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      </ScrollView>

      {/* Navigation */}
      <View style={[styles.navigationContainer, { backgroundColor: colors.surface }]}>
        <Button
          title="Previous"
          onPress={handlePreviousQuestion}
          variant="secondary"
          disabled={currentQuestion === 0}
          style={[styles.navButton, { opacity: currentQuestion === 0 ? 0.5 : 1 }]}
        />

        {currentQuestion === examData.questions.length - 1 ? (
          <Button
            title="Submit Exam"
            onPress={submitExam}
            style={styles.navButton}
          />
        ) : (
          <Button
            title="Next"
            onPress={handleNextQuestion}
            style={styles.navButton}
          />
        )}
      </View>
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
  examInfoHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  examTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  examDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  instructions: {
    marginBottom: 8,
  },
  instructionItem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  startButton: {
    marginTop: 16,
  },
  examHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  examHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionCounter: {
    fontSize: 14,
    fontWeight: '500',
  },
  timer: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  examContent: {
    padding: 16,
    paddingBottom: 100,
  },
  questionText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  optionsContainer: {
    marginTop: 8,
  },
  optionButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  navigationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  navButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default ExamScreen;