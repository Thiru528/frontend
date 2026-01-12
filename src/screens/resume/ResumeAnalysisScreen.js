import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/Card';
import ProgressBar from '../../components/ProgressBar';

const ResumeAnalysisScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { analysis } = route.params || {};

  // Mock analysis data if not provided
  console.log('✅ RESUME ANALYSIS DATA:', analysis || 'Using Mock Data'); // DEBUG LOG
  const analysisData = analysis || {
    extractedSkills: ['JavaScript', 'React', 'Node.js', 'Python', 'MongoDB', 'Express.js'],
    strengths: [
      'Strong technical skills in modern web technologies',
      'Good project experience with full-stack development',
      'Experience with popular frameworks and libraries',
    ],
    weaknesses: [
      'Missing soft skills and leadership experience',
      'No quantified achievements or metrics',
      'Limited industry-specific keywords',
      'Could improve formatting and structure',
    ],
    experienceLevel: 'Mid-level',
    domain: 'Software Development',
    atsScore: 75,
    recommendations: [
      'Add quantified achievements (e.g., "Improved performance by 30%")',
      'Include more soft skills like teamwork and communication',
      'Add industry-specific keywords for better ATS matching',
      'Improve resume formatting and visual hierarchy',
    ],
  };

  const getScoreColor = (score) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.danger;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Resume Analysis
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ATS Score */}
        <Card>
          <View style={styles.scoreHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              ATS Score
            </Text>
            <Text style={[
              styles.scoreValue,
              { color: getScoreColor(analysisData.atsScore) }
            ]}>
              {analysisData.atsScore}%
            </Text>
          </View>
          <ProgressBar
            progress={analysisData.atsScore / 100}
            color={getScoreColor(analysisData.atsScore)}
            showPercentage={false}
          />
          <Text style={[styles.scoreDescription, { color: colors.textSecondary }]}>
            Your resume has a {analysisData.atsScore >= 80 ? 'high' : analysisData.atsScore >= 60 ? 'moderate' : 'low'} chance of passing ATS filters
          </Text>
        </Card>

        {/* Basic Info */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Profile Summary
          </Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Experience Level
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {analysisData.experienceLevel}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Domain
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {analysisData.domain}
              </Text>
            </View>
          </View>
        </Card>



        {/* Suggested Roles */}
        {(analysisData.suggestedJobRoles || []).length > 0 && (
          <Card>
            <View style={styles.recommendationsHeader}>
              <Ionicons name="briefcase" size={24} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: 8 }]}>
                Suggested Roles
              </Text>
            </View>
            <View style={styles.skillsContainer}>
              {analysisData.suggestedJobRoles.map((role, index) => (
                <View
                  key={index}
                  style={[styles.skillTag, { backgroundColor: colors.primary + '20' }]}
                >
                  <Text style={[styles.skillText, { color: colors.primary }]}>
                    {role}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Extracted Skills */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Extracted Skills ({analysisData.extractedSkills.length})
          </Text>
          <View style={styles.skillsContainer}>
            {(analysisData.extractedSkills || []).map((skill, index) => (
              <View
                key={index}
                style={[styles.skillTag, { backgroundColor: colors.surface }]}
              >
                <Text style={[styles.skillText, { color: colors.text }]}>
                  {skill}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Strengths */}
        <Card>
          <View style={styles.strengthsHeader}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: 8 }]}>
              Strengths
            </Text>
          </View>
          {(analysisData.strengths || []).map((strength, index) => (
            <View key={index} style={styles.listItem}>
              <Ionicons name="checkmark" size={16} color={colors.success} />
              <Text style={[styles.listText, { color: colors.text }]}>
                {strength}
              </Text>
            </View>
          ))}
        </Card>

        {/* Weaknesses */}
        <Card>
          <View style={styles.weaknessesHeader}>
            <Ionicons name="alert-circle" size={24} color={colors.warning} />
            <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: 8 }]}>
              Areas for Improvement
            </Text>
          </View>
          {(analysisData.weaknesses || []).map((weakness, index) => (
            <View key={index} style={styles.listItem}>
              <Ionicons name="alert" size={16} color={colors.warning} />
              <Text style={[styles.listText, { color: colors.text }]}>
                {weakness}
              </Text>
            </View>
          ))}
        </Card>

        {/* Recommendations */}
        <Card>
          <View style={styles.recommendationsHeader}>
            <Ionicons name="bulb" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: 8 }]}>
              AI Recommendations
            </Text>
          </View>
          {(analysisData.suggestions || analysisData.recommendations || []).map((recommendation, index) => (
            <View key={index} style={styles.listItem}>
              <Ionicons name="arrow-forward" size={16} color={colors.primary} />
              <Text style={[styles.listText, { color: colors.text }]}>
                {recommendation}
              </Text>
            </View>
          ))}
        </Card>
      </ScrollView>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreDescription: {
    fontSize: 14,
    marginTop: 8,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: -4,
  },
  skillTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 4,
  },
  skillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  strengthsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  weaknessesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});

export default ResumeAnalysisScreen;