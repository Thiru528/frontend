// Fixed MCQArenaScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { examAPI } from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Markdown from 'react-native-markdown-display';
import FancyLoader from '../../components/FancyLoader';

const { width } = Dimensions.get('window');

const MCQArenaScreen = ({ route, navigation }) => {
  const { topic = "General", freeAccess = false } = route.params || {};
  const { colors } = useTheme();
  const { user } = useAuth();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(true);

  // Premium Gate (Bypass if freeAccess is true)
  if (!user?.isPremium && !freeAccess) {
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={[colors.premium || '#8A2BE2', '#4B0082']}
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}
        >
          <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
            <Ionicons name="lock-closed" size={50} color="#FFF" />
          </View>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FFF', textAlign: 'center', marginBottom: 16 }}>
            Premium Arena 💎
          </Text>
          <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginBottom: 40, lineHeight: 24 }}>
            The MCQ Arena is locked for free users. Upgrade to Pro to access unlimited AI-generated practice questions.
          </Text>

          <TouchableOpacity
            style={{ width: '100%', backgroundColor: '#FFF', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 }}
            onPress={() => navigation.navigate('Premium')}
          >
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.premium || '#8A2BE2' }}>
              Unlock Now 🚀
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFF', opacity: 0.9 }}>
              Go Back
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  useEffect(() => {
    loadQuestions();
  }, []);

  const [quizFinished, setQuizFinished] = useState(false);

  const [source, setSource] = useState('LOADING');

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await examAPI.getQuestionsForSkill(topic, 10);

      if (response.data.success && response.data.data.questions.length > 0) {
        setQuestions(response.data.data.questions);
        setSource(response.data.data.source || 'AI');
      } else {
        // Fallback if API returns empty - Generate 10 mock questions
        const mockQuestions = Array(10).fill(0).map((_, i) => ({
          id: i + 1,
          question: `(Offline Mode) Question ${i + 1}: What is a key feature of ${topic}?`,
          options: ['Performance', 'Scalability', 'Security', 'All of the above'],
          correctAnswer: 3,
          explanation: `**All of the above**. ${topic} is crucial for modern systems.`
        }));
        setQuestions(mockQuestions);
        setSource('OFFLINE');
      }
    } catch (error) {
      console.error("Failed to load questions:", error);
      Alert.alert("Error", "Could not load specific questions. Using practice mode.");
      // Error Fallback - 10 questions
      const errorQuestions = Array(10).fill(0).map((_, i) => ({
        id: 100 + i,
        question: `Practice Question ${i + 1} for ${topic}`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 0,
        explanation: "This is a placeholder for practice."
      }));
      setQuestions(errorQuestions);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (index) => {
    setSelectedOption(index);
    setShowExplanation(true);
    // Use loose equality to handle string/number mismatches from AI
    // Parsing 'correctAnswer' (property name fixed from correctIndex)
    const correctIdx = parseInt(questions[currentIndex].correctAnswer);
    console.log("Checking Answer:", index, "Expected:", correctIdx, "Raw:", questions[currentIndex].correctAnswer);

    if (index == correctIdx) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      // Quiz Finished - Show Result View
      setQuizFinished(true);
    }
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setShowExplanation(false);
    setQuizFinished(false);
  };

  useEffect(() => {
    if (quizFinished) {
      const passingScore = Math.ceil(questions.length * 0.6); // 60% Passing
      if (score >= passingScore) {
        // Update Streak and Complete Day
        const updateStats = async () => {
          try {
            // 1. Mark Day Complete
            const { dayNumber } = route.params || {};
            if (dayNumber) {
              await import('../../services/api').then(({ studyAPI }) => studyAPI.completeDay(dayNumber));
            }

            // 2. Update Streak via Dashboard API
            await import('../../services/api').then(({ dashboardAPI }) => dashboardAPI.updateStreak());

            Alert.alert("🔥 Streak Ignition!", "You kept your streak alive! +1 Day added.");
          } catch (e) {
            console.error("Stats Update Failed", e);
          }
        };
        updateStats();
      }
    }
  }, [quizFinished]);

  if (loading) {
    const loadingMessages = [
      `Analyzing ${topic}...`,
      "Curating challenging questions... 🧠",
      "Checking valid answers... ✅",
      "Almost ready! 🚀",
      "Did you know? Active recall boosts memory! 📚"
    ];
    return <FancyLoader message={loadingMessages} />;
  }

  if (quizFinished) {
    const passingScore = Math.ceil(questions.length * 0.6);
    const passed = score >= passingScore;

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, padding: 20, justifyContent: 'center' }]}>
        <Card style={{ alignItems: 'center', padding: 30 }}>
          <Ionicons name={passed ? "trophy" : "alert-circle"} size={64} color={passed ? colors.primary : colors.danger} style={{ marginBottom: 20 }} />
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 10 }}>
            {passed ? "Day Completed! 🎉" : "Keep Try! 💪"}
          </Text>

          <Text style={{ fontSize: 18, color: colors.textSecondary, marginBottom: 5 }}>
            You scored <Text style={{ fontWeight: 'bold', color: passed ? colors.primary : colors.danger }}>{score}/{questions.length}</Text>
          </Text>

          <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 20, textAlign: 'center' }}>
            {passed ? "Great job! The next day is now unlocked." : "You need 60% to unlock the next day."}
          </Text>

          <View style={{ width: '100%', gap: 10 }}>
            {!passed && <Button title="Retry Quiz" onPress={handleRetry} variant="secondary" />}
            <Button title="Back to Study Plan" onPress={() => navigation.goBack()} />
          </View>
        </Card>
      </SafeAreaView>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Arena: {topic}</Text>
          {questions.length > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Ionicons name={source === 'AI' ? "flash" : "server"} size={12} color={source === 'AI' ? colors.primary : colors.textSecondary} />
              <Text style={{ fontSize: 10, color: colors.textSecondary, marginLeft: 4 }}>
                {source === 'AI' ? "AI Generated Live" : (source === 'HARD_FALLBACK' || source === 'OFFLINE' ? "Offline Mode" : "Database Cache")}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>Score: {score}</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${((currentIndex + 1) / questions.length) * 100}%`, backgroundColor: colors.primary }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.questionCard}>
          <Text style={[styles.questionText, { color: colors.text }]}>
            {currentQ.question}
          </Text>
        </Card>

        <View style={styles.optionsContainer}>
          {currentQ.options.map((option, index) => {
            let userSelected = selectedOption === index;
            // logic fix: use correctAnswer consistently
            let isCorrect = index == parseInt(currentQ.correctAnswer);

            let borderCol = colors.border;
            let bgCol = colors.surface;

            if (showExplanation) {
              if (isCorrect) {
                borderCol = colors.success;
                bgCol = colors.success + '20';
              } else if (userSelected) {
                borderCol = colors.danger;
                bgCol = colors.danger + '20';
              }
            }

            return (
              <TouchableOpacity
                key={index}
                disabled={showExplanation}
                onPress={() => handleOptionSelect(index)}
                style={[
                  styles.optionButton,
                  {
                    borderColor: borderCol,
                    backgroundColor: bgCol,
                    borderWidth: 2
                  }
                ]}
              >
                <Text style={[styles.optionText, { color: colors.text }]}>{option}</Text>
                {showExplanation && isCorrect && <Ionicons name="checkmark-circle" size={20} color={colors.success} />}
                {showExplanation && userSelected && !isCorrect && <Ionicons name="close-circle" size={20} color={colors.danger} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {showExplanation && (
          <View style={styles.explanationBox}>
            {user?.isPremium ? (
              <>
                <Text style={[styles.explanationLabel, { color: colors.textSecondary }]}>Explanation:</Text>
                <Markdown style={{ body: { color: colors.text } }}>
                  {currentQ.explanation}
                </Markdown>
              </>
            ) : (
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center' }}>
                  <Ionicons name="lock-closed" size={14} /> Detailed explanation is locked.
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Premium')}>
                  <Text style={{ color: colors.primary, fontWeight: 'bold', textAlign: 'center', marginTop: 4 }}>
                    Upgrade to Pro to unlock 🔓
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            <Button
              title={currentIndex === questions.length - 1 ? "Finish Quiz" : "Next Question"}
              onPress={handleNext}
              style={{ marginTop: 16 }}
            />
          </View>
        )}

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
    justifyContent: 'space-between',
    padding: 16,
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  scoreBadge: {
    backgroundColor: '#F59E0B20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  scoreText: {
    color: '#F59E0B',
    fontWeight: 'bold'
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
    width: '100%'
  },
  progressBar: {
    height: '100%'
  },
  content: {
    padding: 20
  },
  questionCard: {
    marginBottom: 24,
    minHeight: 120,
    justifyContent: 'center'
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26
  },
  optionsContainer: {
    marginBottom: 20
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500'
  },
  explanationBox: {
    marginTop: 10,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12
  },
  explanationLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4
  }
});

export default MCQArenaScreen;