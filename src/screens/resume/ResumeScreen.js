import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { resumeAPI } from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ProgressBar from '../../components/ProgressBar';
import FancyLoader from '../../components/FancyLoader';

const ResumeScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const [resumeData, setResumeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    console.log("ResumeScreen Loaded - Handlers:", !!handleUploadResume, !!handleImproveResume);
    loadResumeData();
  }, []);

  // Auto-open analysis if requested via params
  useEffect(() => {
    if (route.params?.autoOpenAnalysis && resumeData?.analysis) {
      // Clear the param immediately so it doesn't trigger again on back navigation
      navigation.setParams({ autoOpenAnalysis: false });
      navigation.navigate('ResumeAnalysis', { analysis: resumeData.analysis });
    }
  }, [resumeData, route.params]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadResumeData();
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const loadResumeData = async () => {
    try {
      setLoading(true);
      const response = await resumeAPI.getResume();
      if (response.data.success) {
        // If array (versions), pick active or first
        if (Array.isArray(response.data.data)) {
          const active = response.data.data.find(r => r.isActive) || response.data.data[0];
          setResumeData(active);
          if (active?.analysis) {
            console.log('🤖 AI Resume Analysis Report:', JSON.stringify(active.analysis, null, 2));
          } else {
            console.log('ℹ️ No Analysis Data Found in Resume');
          }
        } else {
          setResumeData(response.data.data);
          if (response.data.data?.analysis) {
            console.log('🤖 AI Resume Analysis Report:', JSON.stringify(response.data.data.analysis, null, 2));
          }
        }
      }
    } catch (error) {
      console.log('No resume found or error loading');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets[0]) {
        setLoading(true);
        const file = result.assets[0];

        // Prepare form data
        // Prepare form data
        const formData = new FormData();

        if (Platform.OS === 'web') {
          // On Web, we need to convert the URI to a Blob
          const res = await fetch(file.uri);
          const blob = await res.blob();
          formData.append('resume', blob, file.name || 'resume.pdf');
        } else {
          // On Mobile, the standard object format works
          formData.append('resume', {
            uri: file.uri,
            name: file.name,
            type: file.mimeType || 'application/pdf',
          });
        }

        const response = await resumeAPI.uploadResume(formData);

        if (response.data.success) {
          Alert.alert('Success', 'Resume uploaded successfully!');

          // Trigger AI Analysis immediately
          try {
            setLoading(true); // Keep loading true
            const resumeId = response.data.data._id;
            // Notify user analysis is starting (optional, or just keep spinner)
            const analyzeResponse = await resumeAPI.analyzeResume(resumeId);

            // After analysis, reload full data
            await loadResumeData();

            // Navigate to Analysis Screen with the new data
            if (analyzeResponse.data?.success && analyzeResponse.data?.data?.analysis) {
              navigation.navigate('ResumeAnalysis', { analysis: analyzeResponse.data.data.analysis });
            }
          } catch (analysisError) {
            console.error("Analysis Trigger Failed:", analysisError);
            Alert.alert("Notice", "Resume uploaded but AI analysis failed to start. You can try 'Improve Resume' later.");
            loadResumeData();
          }
        }
      }
    } catch (error) {
      console.error('Upload Error:', error);
      if (error.response?.status === 403) {
        Alert.alert('Premium Feature 💎', error.response.data.message, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Premium') }
        ]);
      } else {
        Alert.alert('Error', 'Failed to upload resume');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImproveResume = () => {
    if (!resumeData?.hasResume) {
      Alert.alert('No Resume', 'Please upload a resume first');
      return;
    }
    // Navigate to improvement screen or show modal
    navigation.navigate('ResumeBuild', { resumeId: resumeData._id, mode: 'improve' });
  };

  const handleViewAnalysis = () => {
    if (!resumeData?.analysis) {
      Alert.alert('Analysis Missing', 'No analysis data available yet. Please try improving your resume.');
      return;
    }
    navigation.navigate('ResumeAnalysis', { analysis: resumeData.analysis });
  };

  const getScoreColor = (score) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.danger;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {loading && <FancyLoader message="Analyzing your resume..." />}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Resume Builder
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Build, analyze, and improve your resume with AI
          </Text>
        </View>

        {/* Current Resume Status */}
        {resumeData?.hasResume ? (
          <Card>
            <View style={styles.resumeStatus}>
              <View style={styles.statusHeader}>
                <Ionicons name="document-text" size={24} color={colors.primary} />
                <View style={styles.statusText}>
                  <Text style={[styles.statusTitle, { color: colors.text }]}>
                    Current Resume
                  </Text>
                  <Text style={[styles.statusDate, { color: colors.textSecondary }]}>
                    Last updated: {resumeData.lastUpdated}
                  </Text>
                </View>
              </View>

              <View style={styles.atsScoreContainer}>
                <Text style={[styles.atsLabel, { color: colors.textSecondary }]}>
                  ATS Score
                </Text>
                <Text style={[
                  styles.atsScore,
                  { color: getScoreColor(resumeData.atsScore) }
                ]}>
                  {resumeData.atsScore}%
                </Text>
              </View>
            </View>

            <ProgressBar
              progress={resumeData.atsScore / 100}
              color={getScoreColor(resumeData.atsScore)}
              showPercentage={false}
            />
          </Card>
        ) : (
          <Card>
            <View style={styles.noResumeContainer}>
              <Ionicons name="document-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.noResumeText, { color: colors.text }]}>
                No Resume Uploaded
              </Text>
              <Text style={[styles.noResumeSubtext, { color: colors.textSecondary }]}>
                Upload your resume or build one with AI to get started
              </Text>
            </View>
          </Card>
        )}

        {/* Action Buttons */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Resume Actions
          </Text>

          <Button
            title="📄 Upload Resume PDF"
            onPress={handleUploadResume}
            loading={loading}
            style={styles.actionButton}
            variant="primary"
          />

          <Button
            title="✨ Improve Resume with AI"
            onPress={handleImproveResume}
            style={styles.actionButton}
            variant="secondary"
          />
        </Card>

        {/* Resume Analysis */}
        {resumeData?.hasResume && (
          <Card onPress={handleViewAnalysis}>
            <View style={styles.analysisHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Resume Analysis
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>

            <View style={styles.analysisPreview}>
              <View style={styles.analysisItemColumn}>
                <Text style={[styles.analysisLabel, { color: colors.textSecondary, marginBottom: 8 }]}>
                  Skills Extracted ({(resumeData.analysis?.extractedSkills || []).length})
                </Text>
                <View style={styles.skillsContainer}>
                  {(resumeData.analysis?.extractedSkills || []).slice(0, 10).map((skill, index) => (
                    <View key={index} style={[styles.skillBadge, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                      <Text style={[styles.skillText, { color: colors.text }]}>{skill}</Text>
                    </View>
                  ))}
                  {(resumeData.analysis?.extractedSkills || []).length > 10 && (
                    <View style={[styles.skillBadge, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.skillText, { color: colors.textSecondary }]}>
                        +{(resumeData.analysis?.extractedSkills || []).length - 10} more
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.analysisItem}>
                <Text style={[styles.analysisLabel, { color: colors.textSecondary }]}>
                  Experience Level
                </Text>
                <Text style={[styles.analysisValue, { color: colors.text }]}>
                  {resumeData.analysis?.experienceLevel || 'Not analyzed'}
                </Text>
              </View>

              <View style={styles.analysisItem}>
                <Text style={[styles.analysisLabel, { color: colors.textSecondary }]}>
                  Domain
                </Text>
                <Text style={[styles.analysisValue, { color: colors.text }]}>
                  {resumeData.analysis?.domain || 'General'}
                </Text>
              </View>
            </View>

            <Button
              title="View Full Analysis Report 📊"
              onPress={handleViewAnalysis}
              variant="secondary"
              style={{ marginTop: 8 }}
            />
          </Card>
        )}


      </ScrollView>
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  resumeStatus: {
    marginBottom: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusDate: {
    fontSize: 12,
    marginTop: 2,
  },
  atsScoreContainer: {
    alignItems: 'center',
  },
  atsLabel: {
    fontSize: 12,
  },
  atsScore: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  noResumeContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noResumeText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  noResumeSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionButton: {
    marginBottom: 12,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  analysisPreview: {
    marginBottom: 12,
  },
  analysisItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  analysisLabel: {
    fontSize: 14,
  },
  analysisValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  tapToView: {
    fontSize: 12,
    fontWeight: '500',
  },
  analysisItemColumn: {
    marginBottom: 16,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    marginRight: 6,
    marginBottom: 6,
  },
  skillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  versionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  versionsBadge: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  versionsCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  versionsSubtext: {
    fontSize: 14,
    marginBottom: 12,
  },
});

export default ResumeScreen;