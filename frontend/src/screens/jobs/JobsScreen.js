import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Linking,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { jobsAPI } from '../../services/api';
import { sendLocalNotification } from '../../services/notificationService';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ProgressBar from '../../components/ProgressBar';
import FancyLoader from '../../components/FancyLoader';
import AdBanner from '../../components/AdBanner';

const JobsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [jobsData, setJobsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadJobsData(1);
  }, []);

  const loadJobsData = async (pageNum = 1) => {
    try {
      if (pageNum === 1) setLoading(true);

      // Pass user's target role to fetch relevant jobs
      const roleFilter = user?.targetRole || user?.interests?.[0];
      const response = await jobsAPI.getRecommendedJobs(pageNum, roleFilter);

      if (response.data.success) {
        const newJobs = response.data.data;
        if (pageNum === 1) {
          setJobsData({
            recommendedJobs: newJobs,
            jobReadinessScore: 70,
          });
        } else {
          setJobsData(prev => {
            // Filter duplicates to prevent "same job again" issue
            const existingIds = new Set(prev.recommendedJobs.map(j => j._id));
            const distinctNewJobs = newJobs.filter(j => !existingIds.has(j._id));
            return {
              ...prev,
              recommendedJobs: [...prev.recommendedJobs, ...distinctNewJobs]
            };
          });
        }

        if (newJobs.length > 0) {
          sendLocalNotification('New Jobs Found! 🚀', `We found ${newJobs.length} new jobs that match your profile.`);
        }

        setHasMore(newJobs.length > 0);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error loading jobs data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadJobsData(page + 1);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadJobsData();
  };

  const getMatchColor = (percentage) => {
    if (percentage >= 85) return colors.success;
    if (percentage >= 70) return colors.warning;
    return colors.danger;
  };

  const openLinkedInSearch = (jobTitle) => {
    const searchQuery = encodeURIComponent(jobTitle);
    const linkedinUrl = `https://www.linkedin.com/jobs/search/?keywords=${searchQuery}`;
    Linking.openURL(linkedinUrl);
  };

  const openNaukriSearch = (jobTitle) => {
    const searchQuery = encodeURIComponent(jobTitle);
    const naukriUrl = `https://www.naukri.com/jobs-in-india?k=${searchQuery}`;
    Linking.openURL(naukriUrl);
  };

  const handleJobPress = (job) => {
    navigation.navigate('JobDetails', { job });
  };

  const openJobLink = async (url) => {
    if (!url) {
      Alert.alert("Link Unavailable", "This job post doesn't have a direct application link.");
      return;
    }
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Cannot open this link: " + url);
      }
    } catch (err) {
      console.error("Link error:", err);
      Alert.alert("Error", "Failed to open job link.");
    }
  };


  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <FancyLoader message="Finding your perfect jobs..." />
      </SafeAreaView>
    );
  }

  if (!jobsData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
          <Text style={[styles.loadingText, { color: colors.text, marginTop: 16, textAlign: 'center' }]}>
            Unable to load jobs. The server might be restarting or offline.
          </Text>
          <Button title="Retry" onPress={() => loadJobsData(1)} style={{ marginTop: 24 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {!user?.hasResume ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ borderRadius: 24, padding: 3, elevation: 5 }}
          >
            <View style={{ backgroundColor: colors.background, borderRadius: 21, padding: 24, alignItems: 'center' }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                <Ionicons name="cloud-upload" size={40} color={colors.primary} />
              </View>
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 12, textAlign: 'center' }}>
                Find Your Dream Job
              </Text>
              <Text style={{ fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
                Upload your resume to let our AI match you with the perfect opportunities based on your skills.
              </Text>
              <Button title="Upload Resume to Unlock 🚀" onPress={() => navigation.navigate('Resume')} style={{ width: '100%' }} />
            </View>
          </LinearGradient>
        </View>
      ) : (
        <FlatList
          data={jobsData.recommendedJobs || []}
          keyExtractor={(item, index) => item.id || item._id || index.toString()}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <>
              {/* Header */}
              <View style={styles.header}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={[styles.title, { color: colors.text }]}>
                      Job Recommendations
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                      AI-matched jobs based on your profile
                    </Text>
                  </View>
                  <TouchableOpacity onPress={onRefresh} style={{ padding: 8 }}>
                    <Ionicons name="reload-circle-outline" size={28} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Job Readiness Score */}
              <Card>
                <View style={styles.readinessHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Job Readiness Score
                  </Text>
                  <Text style={[
                    styles.readinessScore,
                    { color: getMatchColor(jobsData.jobReadinessScore) }
                  ]}>
                    {jobsData.jobReadinessScore}%
                  </Text>
                </View>
                <ProgressBar
                  progress={jobsData.jobReadinessScore / 100}
                  color={getMatchColor(jobsData.jobReadinessScore)}
                  showPercentage={false}
                />
                <Text style={[styles.readinessText, { color: colors.textSecondary }]}>
                  {jobsData.jobReadinessScore >= 80
                    ? 'You\'re ready to apply for most positions!'
                    : jobsData.jobReadinessScore >= 60
                      ? 'Almost ready! Focus on improving weak skills.'
                      : 'Keep studying to improve your job readiness.'
                  }
                </Text>
              </Card>

              {/* Job Listings Title */}
              <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: 8, marginBottom: 12 }]}>
                Recommended Jobs ({jobsData.recommendedJobs.length})
              </Text>
            </>
          }
          renderItem={({ item: job }) => (
            <Card onPress={() => handleJobPress(job)} style={styles.jobCard}>
              {/* Job Header */}
              <View style={styles.jobHeader}>
                <View style={styles.jobTitleContainer}>
                  <Text style={[styles.jobTitle, { color: colors.text }]} onPress={() => job.applicationUrl && Linking.openURL(job.applicationUrl)}>
                    {job.title}
                  </Text>
                  <View style={styles.jobMeta}>
                    <Text style={[styles.company, { color: colors.textSecondary }]}>
                      {job.company}
                    </Text>
                    <Text style={[styles.separator, { color: colors.textSecondary }]}>
                      •
                    </Text>
                    <Text style={[styles.location, { color: colors.textSecondary }]}>
                      {job.location}
                    </Text>
                  </View>
                </View>

                <View style={styles.matchContainer}>
                  <Text style={[styles.matchLabel, { color: colors.textSecondary }]}>
                    Match
                  </Text>
                  <Text style={[
                    styles.matchPercentage,
                    { color: getMatchColor(job.matchPercentage) }
                  ]}>
                    {job.matchPercentage}%
                  </Text>
                </View>
              </View>

              {/* Job Details */}
              <View style={styles.jobDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="cash-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.detailText, { color: colors.text }]}>
                    {job.salary}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.detailText, { color: colors.text }]}>
                    {job.type}
                  </Text>
                </View>

                {job.remote && (
                  <View style={styles.detailRow}>
                    <Ionicons name="home-outline" size={16} color={colors.success} />
                    <Text style={[styles.detailText, { color: colors.success }]}>
                      Remote
                    </Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                    Posted {job.posted}
                  </Text>
                </View>
              </View>

              {/* Match Progress */}
              <ProgressBar
                progress={job.matchPercentage / 100}
                color={getMatchColor(job.matchPercentage)}
                showPercentage={false}
                style={styles.matchProgress}
              />

              {/* Missing Skills */}
              {job.missingSkills && job.missingSkills.length > 0 && (
                <View style={styles.missingSkillsContainer}>
                  <Text style={[styles.missingSkillsLabel, { color: colors.textSecondary }]}>
                    Missing Skills:
                  </Text>
                  <View style={styles.skillsContainer}>
                    {(job.missingSkills || []).map((skill, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => navigation.navigate('Exam', { skill })}
                        style={[styles.skillTag, { backgroundColor: colors.danger + '20' }]}
                      >
                        <Text style={[styles.skillText, { color: colors.danger }]}>
                          {skill}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <Button
                  title={job.applicationUrl ? "Apply Now 🚀" : "View Details"}
                  onPress={() => job.applicationUrl ? openJobLink(job.applicationUrl) : handleJobPress(job)}
                  variant={job.applicationUrl ? "primary" : "secondary"}
                  size="small"
                  style={styles.actionButton}
                />

                <Button
                  title="LinkedIn"
                  onPress={() => openLinkedInSearch(job.title)}
                  variant="secondary"
                  size="small"
                  style={styles.actionButton}
                />

                <Button
                  title="Naukri"
                  onPress={() => openNaukriSearch(job.title)}
                  size="small"
                  style={styles.actionButton}
                />
              </View>
            </Card>
          )}
          ListFooterComponent={
            <Card style={styles.loadMoreCard}>
              <Text style={[styles.loadMoreText, { color: colors.textSecondary }]}>
                Want to see more job recommendations?
              </Text>
              <Button
                title={hasMore ? "Load More Jobs" : "No More Jobs"}
                onPress={handleLoadMore}
                variant="secondary"
                disabled={!hasMore}
                style={styles.loadMoreButton}
              />
            </Card>
          }
        />
      )}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  readinessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  readinessScore: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  readinessText: {
    fontSize: 14,
    marginTop: 8,
  },
  jobCard: {
    marginBottom: 16,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobTitleContainer: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  jobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  company: {
    fontSize: 14,
    fontWeight: '500',
  },
  separator: {
    marginHorizontal: 8,
  },
  location: {
    fontSize: 14,
  },
  matchContainer: {
    alignItems: 'center',
  },
  matchLabel: {
    fontSize: 10,
  },
  matchPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  jobDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    marginLeft: 8,
  },
  matchProgress: {
    marginBottom: 12,
  },
  missingSkillsContainer: {
    marginBottom: 16,
  },
  missingSkillsLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    margin: 2,
  },
  skillText: {
    fontSize: 10,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  loadMoreCard: {
    alignItems: 'center',
    marginTop: 8,
  },
  loadMoreText: {
    fontSize: 14,
    marginBottom: 12,
  },
  loadMoreButton: {
    alignSelf: 'center',
  },
});

export default JobsScreen;