import React, { useState } from 'react';
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
import { examAPI } from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ProgressBar from '../../components/ProgressBar';
import { AdService } from '../../services/AdService';

const ExamResultScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { results, examData, selectedAnswers, skill } = route.params;
  const [showAnswers, setShowAnswers] = useState(false);
  const [confidenceUpdated, setConfidenceUpdated] = useState(false);

  const getResultColor = () => {
    if (results.passed) return colors.success;
    return colors.danger;
  };

  const getResultIcon = () => {
    if (results.passed) return 'checkmark-circle';
    return 'close-circle';
  };

  const getResultMessage = () => {
    if (results.passed) {
      if (results.percentage >= 90) return 'Excellent! Outstanding performance! 🎉';
      if (results.percentage >= 80) return 'Great job! You have a strong understanding! 👏';
      return 'Well done! You passed the exam! ✅';
    } else {
      return 'Don\'t worry! Review the topics and try again. 💪';
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const handleRetakeExam = () => {
    Alert.alert(
      'Retake Exam',
      'Are you sure you want to retake this exam? Your current score will be replaced.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Retake',
          onPress: () => {
            // Use push to start a FRESH exam instance on top of the stack
            navigation.push('Exam', { skill, timestamp: Date.now(), retake: true });
          },
        },
      ]
    );
  };

  const updateSkillConfidence = async () => {
    try {
      // Calculate new confidence based on exam performance
      const newConfidence = Math.min(100, Math.max(0, results.percentage));

      // Mock API call to update skill confidence
      // await examAPI.updateSkillConfidence(skill, newConfidence);

      setConfidenceUpdated(true);
      Alert.alert(
        'Confidence Updated',
        `Your ${skill} confidence has been updated to ${newConfidence}%`
      );
    } catch (error) {
      console.error('Error updating skill confidence:', error);
      Alert.alert('Error', 'Failed to update skill confidence.');
    }
  };

  const navigateToStudy = () => {
    // Return to previous screen (Topic Detail or Study Plan)
    navigation.goBack();
  };

  const [showAnalysis, setShowAnalysis] = useState(false);
  const [loadingAd, setLoadingAd] = useState(false);

  // Initialize Ads
  React.useEffect(() => {
    AdService.initialize();
  }, []);

  const handleUnlockAnalysis = async () => {
    setLoadingAd(true);
    try {
      const rewarded = await AdService.showRewarded();
      if (rewarded) {
        setShowAnalysis(true);
        Alert.alert("Unlocked!", "Detailed analysis is now available.");
      } else {
        // Fallback or error
        Alert.alert("Ad Skipped", "You need to finish the ad to unlock details.");
      }
    } catch (error) {
      console.log('Ad Error', error);
      // Fallback: Unlock anyway if ad fails (User Experience Rule #6)
      setShowAnalysis(true);
    } finally {
      setLoadingAd(false);
    }
  };

  const navigateToDashboard = () => {
    // Navigate to the 'Dashboard' tab
    navigation.navigate('Dashboard');
  };

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
          Exam Results
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Result Summary */}
        <Card>
          <View style={styles.resultHeader}>
            <View style={{ position: 'absolute', top: 0, right: 0 }}>
              <View style={{ backgroundColor: colors.success + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ color: colors.success, fontSize: 10, fontWeight: 'bold' }}>SAVED TO DASHBOARD</Text>
              </View>
            </View>

            <Ionicons
              name={getResultIcon()}
              size={64}
              color={getResultColor()}
            />
            <Text style={[styles.resultTitle, { color: colors.text }]}>
              {results.passed ? 'Congratulations!' : 'Keep Learning!'}
            </Text>
            <Text style={[styles.resultMessage, { color: colors.textSecondary }]}>
              {getResultMessage()}
            </Text>
          </View>

          <View style={styles.scoreContainer}>
            <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>
              Your Score
            </Text>
            <Text style={[styles.scoreValue, { color: getResultColor() }]}>
              {results.percentage}%
            </Text>
            <Text style={[styles.scoreDetails, { color: colors.textSecondary }]}>
              {results.correctAnswers} out of {results.totalQuestions} correct
            </Text>
          </View>

          <ProgressBar
            progress={results.percentage / 100}
            color={getResultColor()}
            showPercentage={false}
            style={styles.scoreProgress}
          />
        </Card>

        {/* Exam Statistics */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Exam Statistics
          </Text>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {results.correctAnswers}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Correct
              </Text>
            </View>

            <View style={styles.statItem}>
              <Ionicons name="close-circle" size={24} color={colors.danger} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {results.totalQuestions - results.correctAnswers}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Incorrect
              </Text>
            </View>

            <View style={styles.statItem}>
              <Ionicons name="time" size={24} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatTime(results.timeSpent)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Time Spent
              </Text>
            </View>

            <View style={styles.statItem}>
              <Ionicons name="school" size={24} color={colors.secondary} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {skill}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Subject
              </Text>
            </View>
          </View>
        </Card>

        {/* Performance Analysis (LOCKED) */}
        {!showAnalysis ? (
          <Card>
            <View style={{ alignItems: 'center', padding: 10 }}>
              <Ionicons name="lock-closed" size={40} color={colors.primary} style={{ marginBottom: 10 }} />
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 5 }}>Detailed AI Analysis Locked</Text>
              <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 20 }}>
                Unlock personalized strength & weakness insights by watching a short ad.
              </Text>
              <Button
                title={loadingAd ? "Loading Ad..." : "Watch Ad to Unlock 🔓"}
                onPress={handleUnlockAnalysis}
                disabled={loadingAd}
              />
            </View>
          </Card>
        ) : (
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Performance Analysis
            </Text>

            <View style={styles.analysisItem}>
              <View style={styles.analysisHeader}>
                <Text style={[styles.analysisLabel, { color: colors.text }]}>
                  Overall Performance
                </Text>
                <Text style={[styles.analysisValue, { color: getResultColor() }]}>
                  {results.percentage >= 90 ? 'Excellent' :
                    results.percentage >= 80 ? 'Very Good' :
                      results.percentage >= 70 ? 'Good' :
                        results.percentage >= 60 ? 'Fair' : 'Needs Improvement'}
                </Text>
              </View>
            </View>

            <View style={styles.analysisItem}>
              <View style={styles.analysisHeader}>
                <Text style={[styles.analysisLabel, { color: colors.text }]}>
                  Pass Status
                </Text>
                <Text style={[styles.analysisValue, { color: getResultColor() }]}>
                  {results.passed ? 'PASSED' : 'FAILED'}
                </Text>
              </View>
              <Text style={[styles.analysisDescription, { color: colors.textSecondary }]}>
                {results.passed
                  ? 'You have successfully passed this exam!'
                  : 'You need 70% or higher to pass. Keep studying and try again!'
                }
              </Text>
            </View>
          </Card>
        )}

        {/* Review Answers */}
        <Card>
          <View style={styles.reviewHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Review Answers
            </Text>
            <TouchableOpacity
              onPress={() => setShowAnswers(!showAnswers)}
              style={styles.toggleButton}
            >
              <Text style={[styles.toggleText, { color: colors.primary }]}>
                {showAnswers ? 'Hide' : 'Show'} Answers
              </Text>
              <Ionicons
                name={showAnswers ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          {showAnswers && (
            <View style={styles.answersContainer}>
              {examData.questions.map((question, index) => {
                const userAnswer = selectedAnswers[question.id];
                const isCorrect = userAnswer === question.correctAnswer;

                return (
                  <View key={question.id} style={[
                    styles.answerItem,
                    { backgroundColor: colors.surface }
                  ]}>
                    <View style={styles.answerHeader}>
                      <Text style={[styles.questionNumber, { color: colors.text }]}>
                        Q{index + 1}
                      </Text>
                      <Ionicons
                        name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                        size={20}
                        color={isCorrect ? colors.success : colors.danger}
                      />
                    </View>

                    <Text style={[styles.answerQuestion, { color: colors.text }]}>
                      {question.question}
                    </Text>

                    <View style={styles.answerDetails}>
                      <Text style={[styles.answerLabel, { color: colors.textSecondary }]}>
                        Your Answer:
                      </Text>
                      <Text style={[
                        styles.answerText,
                        { color: isCorrect ? colors.success : colors.danger }
                      ]}>
                        {userAnswer !== undefined ? question.options[userAnswer] : 'Not answered'}
                      </Text>
                    </View>

                    {!isCorrect && (
                      <View style={styles.answerDetails}>
                        <Text style={[styles.answerLabel, { color: colors.textSecondary }]}>
                          Correct Answer:
                        </Text>
                        <Text style={[styles.answerText, { color: colors.success }]}>
                          {question.options[question.correctAnswer]}
                        </Text>
                      </View>
                    )}

                    {question.explanation && (
                      <View style={[styles.explanationContainer, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }]}>
                        <Text style={{ color: colors.primary, fontWeight: 'bold', marginBottom: 4, fontSize: 13 }}>
                          💡 Explanation:
                        </Text>
                        <Text style={[styles.explanationText, { color: colors.text, fontStyle: 'italic' }]}>
                          {question.explanation}
                        </Text>
                      </View>
                    )}
                  </View>
                );

              })}
            </View>
          )}
        </Card>

        {/* Action Buttons */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            What's Next?
          </Text>

          <View style={styles.actionButtons}>
            {!results.passed && (
              <Button
                title="Retake Exam"
                onPress={handleRetakeExam}
                style={styles.actionButton}
              />
            )}

            <Button
              title="Continue Learning"
              onPress={navigateToStudy}
              variant="secondary"
              style={styles.actionButton}
            />

            <Button
              title="Back to Dashboard"
              onPress={navigateToDashboard}
              variant="secondary"
              style={styles.actionButton}
            />
          </View>
        </Card>
      </ScrollView >
    </SafeAreaView >
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
  resultHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  resultMessage: {
    fontSize: 16,
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scoreDetails: {
    fontSize: 14,
  },
  scoreProgress: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  analysisItem: {
    marginBottom: 16,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  analysisLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  analysisValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  analysisDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  confidenceButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  answersContainer: {
    marginTop: 8,
  },
  answerItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  answerQuestion: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  answerDetails: {
    marginBottom: 8,
  },
  answerLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  answerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  explanationContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  explanationLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 12,
    lineHeight: 16,
  },
  actionButtons: {
    marginTop: 8,
  },
  actionButton: {
    marginBottom: 12,
  },
});

export default ExamResultScreen;