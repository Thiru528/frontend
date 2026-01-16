import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ProgressBar from '../../components/ProgressBar';
import { resumeAPI } from '../../services/api';

const ResumeVersionsScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  // We ignore route.params.versions and always fetch fresh data
  const [versionsData, setVersionsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState(null);

  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const response = await resumeAPI.getResumes();
      if (response.data.success) {
        setVersionsData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load resume versions:', error);
      if (Platform.OS === 'web') alert('Error: Failed to load versions');
      else Alert.alert('Error', 'Failed to load resume versions.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (!score) return colors.textSecondary;
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.danger;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSetActive = async (versionId) => {
    const confirmMsg = 'Are you sure you want to set this as your active resume version?';

    // Web Confirm
    if (Platform.OS === 'web') {
      if (confirm(confirmMsg)) {
        try {
          await resumeAPI.setActiveVersion(versionId);
          alert('Success: Resume version updated!');
          loadVersions();
        } catch (error) {
          alert('Error: Failed to update active version.');
        }
      }
      return;
    }

    // Native Alert
    Alert.alert(
      'Set Active Version',
      confirmMsg,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await resumeAPI.setActiveVersion(versionId);
              Alert.alert('Success', 'Resume version updated successfully!');
              loadVersions();
            } catch (error) {
              Alert.alert('Error', 'Failed to update active version.');
            }
          },
        },
      ]
    );
  };

  const handleDownload = (version) => {
    if (version.fileUrl) {
      Linking.openURL(version.fileUrl);
    } else {
      const msg = 'File URL not found for this version.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Error', msg);
    }
  };

  const handleDelete = async (versionId) => {
    const confirmMsg = 'Are you sure you want to delete this resume version? This action cannot be undone.';

    // Web Confirm
    if (Platform.OS === 'web') {
      if (confirm(confirmMsg)) {
        try {
          await resumeAPI.deleteResume(versionId);
          alert('Success: Resume version deleted!');
          loadVersions();
        } catch (error) {
          alert('Error: Failed to delete version.');
        }
      }
      return;
    }

    // Native Alert
    Alert.alert(
      'Delete Version',
      confirmMsg,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await resumeAPI.deleteResume(versionId);
              Alert.alert('Success', 'Resume version deleted successfully!');
              loadVersions();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete version.');
            }
          },
        },
      ]
    );
  };

  const handleViewDetails = (version) => {
    setSelectedVersion(selectedVersion === version._id ? null : version._id);
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
          Resume Versions
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              Version History
            </Text>
          </View>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Manage different versions of your resume. You can switch between versions,
            download them, or set one as your active resume.
          </Text>
        </Card>

        {loading ? (
          <Text style={{ textAlign: 'center', marginTop: 20, color: colors.textSecondary }}>Loading versions...</Text>
        ) : versionsData.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 20, color: colors.textSecondary }}>No resume versions found. Create one!</Text>
        ) : (
          versionsData.map((version, index) => (
            <Card key={version._id || index} style={styles.versionCard}>
              <View style={styles.versionHeader}>
                <View style={styles.versionInfo}>
                  <View style={styles.versionTitleRow}>
                    <Text style={[styles.versionName, { color: colors.text }]}>
                      {version.name || `Version ${index + 1}`}
                    </Text>
                    {version.isActive && (
                      <View style={[styles.activeBadge, { backgroundColor: colors.success }]}>
                        <Text style={styles.activeBadgeText}>Active</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.versionDate, { color: colors.textSecondary }]}>
                    Created: {formatDate(version.createdAt || version.date)}
                  </Text>
                </View>

                <View style={styles.scoreContainer}>
                  <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>
                    ATS Score
                  </Text>
                  <Text style={[
                    styles.scoreValue,
                    { color: getScoreColor(version.atsScore || 0) }
                  ]}>
                    {version.atsScore || 'N/A'}%
                  </Text>
                </View>
              </View>

              {version.atsScore > 0 && (
                <ProgressBar
                  progress={version.atsScore / 100}
                  color={getScoreColor(version.atsScore)}
                  showPercentage={false}
                  style={styles.progressBar}
                />
              )}

              <Text style={[styles.versionDescription, { color: colors.textSecondary }]}>
                {version.analysis?.suggestions?.[0] || 'No analysis available.'}
              </Text>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <Button
                  title={selectedVersion === version._id ? "Hide Details" : "View Details"}
                  onPress={() => handleViewDetails(version)}
                  variant="secondary"
                  size="small"
                  style={styles.actionButton}
                />

                <Button
                  title="Download 📥"
                  onPress={() => handleDownload(version)}
                  variant="secondary"
                  size="small"
                  style={styles.actionButton}
                />

                {!version.isActive && (
                  <Button
                    title="Set Active"
                    onPress={() => handleSetActive(version._id)}
                    size="small"
                    style={styles.actionButton}
                  />
                )}
              </View>

              {/* Expanded Details */}
              {selectedVersion === version._id && (
                <View style={[styles.expandedDetails, { borderTopColor: colors.border }]}>
                  <Text style={[styles.detailsTitle, { color: colors.text }]}>
                    Version Details
                  </Text>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                      File Name:
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {version.fileName || 'resume.pdf'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                      Size:
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {version.fileSize ? `${Math.round(version.fileSize / 1024)} KB` : 'Unknown'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                      Format:
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      PDF
                    </Text>
                  </View>

                  {!version.isActive && (
                    <Button
                      title="Delete Version"
                      onPress={() => handleDelete(version._id)}
                      variant="danger"
                      size="small"
                      style={styles.deleteButton}
                    />
                  )}
                </View>
              )}
            </Card>
          ))
        )}

        {/* Create New Version */}
        <Card style={styles.createCard}>
          <View style={styles.createHeader}>
            <Ionicons name="add-circle" size={24} color={colors.primary} />
            <Text style={[styles.createTitle, { color: colors.text }]}>
              Create New Version
            </Text>
          </View>
          <Text style={[styles.createText, { color: colors.textSecondary }]}>
            Upload a new resume or build one with AI to create a new version.
          </Text>
          <View style={styles.createButtons}>
            <Button
              title="Upload Resume"
              onPress={() => navigation.navigate('ResumeMain')}
              variant="secondary"
              size="small"
              style={styles.createButton}
            />
            <Button
              title="Build with AI"
              onPress={() => navigation.navigate('ResumeBuild')}
              size="small"
              style={styles.createButton}
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
  placeholder: {
    width: 32,
  },
  scrollContent: {
    padding: 16,
  },
  infoCard: {
    marginBottom: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  versionCard: {
    marginBottom: 16,
  },
  versionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  versionInfo: {
    flex: 1,
  },
  versionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  versionName: {
    fontSize: 16,
    fontWeight: '600',
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  versionDate: {
    fontSize: 12,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 10,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressBar: {
    marginBottom: 12,
  },
  versionDescription: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  expandedDetails: {
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 16,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  createCard: {
    marginTop: 8,
  },
  createHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  createTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  createText: {
    fontSize: 14,
    marginBottom: 16,
  },
  createButtons: {
    flexDirection: 'row',
  },
  createButton: {
    marginRight: 8,
  },
});

export default ResumeVersionsScreen;