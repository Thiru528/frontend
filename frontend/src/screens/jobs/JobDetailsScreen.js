import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ProgressBar from '../../components/ProgressBar';

const JobDetailsScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { job } = route.params;
  const [bookmarked, setBookmarked] = useState(false);

  const getMatchColor = (percentage) => {
    if (percentage >= 85) return colors.success;
    if (percentage >= 70) return colors.warning;
    return colors.danger;
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    Alert.alert(
      bookmarked ? 'Removed from Bookmarks' : 'Added to Bookmarks',
      bookmarked ? 'Job removed from your saved jobs.' : 'Job saved to your bookmarks.'
    );
  };

  const openLinkedInSearch = () => {
    const searchQuery = encodeURIComponent(job.title);
    const linkedinUrl = `https://www.linkedin.com/jobs/search/?keywords=${searchQuery}`;
    Linking.openURL(linkedinUrl);
  };

  const openNaukriSearch = () => {
    const searchQuery = encodeURIComponent(job.title);
    const naukriUrl = `https://www.naukri.com/jobs-in-india?k=${searchQuery}`;
    Linking.openURL(naukriUrl);
  };

  const handleApplyNow = () => {
    if (job.applicationUrl) {
      if (Platform.OS === 'web') {
        Linking.openURL(job.applicationUrl);
      } else {
        Alert.alert(
          'Apply for Job',
          'This will redirect you to the company\'s application page.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Continue',
              onPress: () => Linking.openURL(job.applicationUrl)
            },
          ]
        );
      }
    } else {
      // Fallback to smart search
      const query = encodeURIComponent(`${job.title} ${job.company} jobs`);
      const searchUrl = `https://www.google.com/search?q=${query}`;

      if (Platform.OS === 'web') {
        Linking.openURL(searchUrl);
      } else {
        Alert.alert(
          'Apply via Search',
          'Direct link not available. Searching for this job listing...',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Search', onPress: () => Linking.openURL(searchUrl) }
          ]
        );
      }
    }
  };

  // Mock detailed job data
  const jobDetails = {
    ...job,
    description: `We are looking for a talented ${job.title} to join our dynamic team. You will be responsible for developing and maintaining high-quality web applications using modern technologies.

Key Responsibilities:
• Develop and maintain React-based web applications
• Collaborate with cross-functional teams to define and implement new features
• Write clean, maintainable, and efficient code
• Participate in code reviews and technical discussions
• Stay up-to-date with emerging technologies and industry trends

Requirements:
• Bachelor's degree in Computer Science or related field
• 3+ years of experience in web development
• Strong proficiency in JavaScript, React, and Node.js
• Experience with modern development tools and practices
• Excellent problem-solving and communication skills`,

    benefits: [
      'Health, dental, and vision insurance',
      'Flexible working hours',
      'Remote work options',
      '401(k) with company matching',
      'Professional development budget',
      'Unlimited PTO',
    ],

    companyInfo: {
      size: '500-1000 employees',
      industry: 'Technology',
      founded: '2015',
      website: 'https://techcorp.com',
    },
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
          Job Details
        </Text>
        <TouchableOpacity onPress={handleBookmark} style={styles.bookmarkButton}>
          <Ionicons
            name={bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={bookmarked ? colors.primary : colors.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Job Header */}
        <Card>
          <View style={styles.jobHeader}>
            <View style={styles.jobTitleContainer}>
              <Text style={[styles.jobTitle, { color: colors.text }]}>
                {job.title}
              </Text>
              <Text style={[styles.company, { color: colors.primary }]}>
                {job.company}
              </Text>
              <View style={styles.jobMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {job.location}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="cash-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {job.salary}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {job.type}
                  </Text>
                </View>
                {job.remote && (
                  <View style={styles.metaItem}>
                    <Ionicons name="home-outline" size={16} color={colors.success} />
                    <Text style={[styles.metaText, { color: colors.success }]}>
                      Remote
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Card>

        {/* Match Score */}
        <Card>
          <View style={styles.matchHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Job Match Score
            </Text>
            <Text style={[
              styles.matchScore,
              { color: getMatchColor(job.matchPercentage) }
            ]}>
              {job.matchPercentage}%
            </Text>
          </View>
          <ProgressBar
            progress={job.matchPercentage / 100}
            color={getMatchColor(job.matchPercentage)}
            showPercentage={false}
          />
          <Text style={[styles.matchDescription, { color: colors.textSecondary }]}>
            {job.matchPercentage >= 85
              ? 'Excellent match! You meet most requirements.'
              : job.matchPercentage >= 70
                ? 'Good match. Consider improving missing skills.'
                : 'Fair match. Focus on developing required skills.'
            }
          </Text>
        </Card>

        {/* Required Skills */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Required Skills
          </Text>
          <View style={styles.skillsContainer}>
            {(job.requiredSkills || []).map((skill, index) => (
              <View
                key={index}
                style={[styles.skillTag, { backgroundColor: colors.success + '20' }]}
              >
                <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                <Text style={[styles.skillText, { color: colors.success }]}>
                  {skill}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Missing Skills */}
        {(job.missingSkills || []).length > 0 && (
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Skills to Develop
            </Text>
            <View style={styles.skillsContainer}>
              {(job.missingSkills || []).map((skill, index) => (
                <View
                  key={index}
                  style={[styles.skillTag, { backgroundColor: colors.danger + '20' }]}
                >
                  <Ionicons name="close-circle" size={12} color={colors.danger} />
                  <Text style={[styles.skillText, { color: colors.danger }]}>
                    {skill}
                  </Text>
                </View>
              ))}
            </View>
            <Button
              title="Start Learning These Skills"
              onPress={() => navigation.navigate('Study')}
              variant="secondary"
              size="small"
              style={styles.learnButton}
            />
          </Card>
        )}

        {/* Job Description */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Job Description
          </Text>
          <Text style={[styles.description, { color: colors.text }]}>
            {jobDetails.description}
          </Text>
        </Card>

        {/* Benefits */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Benefits & Perks
          </Text>
          {(jobDetails.benefits || []).map((benefit, index) => (
            <View key={index} style={styles.benefitItem}>
              <Ionicons name="checkmark" size={16} color={colors.success} />
              <Text style={[styles.benefitText, { color: colors.text }]}>
                {benefit}
              </Text>
            </View>
          ))}
        </Card>

        {/* Company Info */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            About {job.company}
          </Text>
          <View style={styles.companyDetails}>
            <View style={styles.companyDetailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Industry:
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {jobDetails.companyInfo.industry}
              </Text>
            </View>
            <View style={styles.companyDetailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Company Size:
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {jobDetails.companyInfo.size}
              </Text>
            </View>
            <View style={styles.companyDetailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Founded:
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {jobDetails.companyInfo.founded}
              </Text>
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Apply for this Job
          </Text>
          <Text style={[styles.applyDescription, { color: colors.textSecondary }]}>
            Ready to apply? Use these platforms to find and apply for similar positions.
          </Text>

          <Button
            title="🚀 Apply Now"
            onPress={handleApplyNow}
            style={styles.applyButton}
          />

          <View style={styles.platformButtons}>
            <Button
              title="Search on LinkedIn"
              onPress={openLinkedInSearch}
              variant="secondary"
              style={styles.platformButton}
            />
            <Button
              title="Search on Naukri"
              onPress={openNaukriSearch}
              variant="secondary"
              style={styles.platformButton}
            />
          </View>
        </Card>
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
  bookmarkButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
  },
  jobHeader: {
    marginBottom: 8,
  },
  jobTitleContainer: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  company: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  jobMeta: {
    flexDirection: 'column',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 14,
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchScore: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  matchDescription: {
    fontSize: 14,
    marginTop: 8,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: -4,
  },
  skillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    margin: 4,
  },
  skillText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  learnButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  companyDetails: {
    marginTop: 8,
  },
  companyDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  applyDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  applyButton: {
    marginBottom: 16,
  },
  platformButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  platformButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default JobDetailsScreen;