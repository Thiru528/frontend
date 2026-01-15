import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
  RefreshControl
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI } from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Avatar from '../../components/Avatar';
import ConfirmationModal from '../../components/ConfirmationModal';

const ProfileScreen = ({ navigation }) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const { userData, user, logout, updateUser, deleteAccount, refreshUser } = useAuth();
  const isFocused = useIsFocused();

  // Use userData or user, falling back to empty object
  const currentUser = userData || user || {};

  useEffect(() => {
    if (isFocused && refreshUser) {
      refreshUser();
    }
  }, [isFocused]);

  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: currentUser.name || '',
    email: currentUser.email || '',
    targetRole: currentUser.targetRole || '',
    experience: currentUser.experience || 'Entry Level',
    location: currentUser.location || '',
    phone: currentUser.phone || '',
    linkedIn: currentUser.linkedIn || '',
    github: currentUser.github || '',
  });

  const [notifications, setNotifications] = useState({
    studyReminders: true,
    examAlerts: true,
    jobMatches: true,
  });

  // Modal States
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const [stats, setStats] = useState(null);


  useEffect(() => {
    loadProfileStats();
  }, []);

  const loadProfileStats = async () => {
    try {
      const response = await dashboardAPI.getDashboardData();
      if (response.data.success) {
        const data = response.data.data;
        setStats({
          currentStreak: data.studyStreak || 0,
          jobReadiness: data.jobReadiness || 0,
          totalStudyHours: data.weeklyActivity?.studyHours || 0,
          testsCompleted: data.weeklyActivity?.testsCompleted || 0,
          resumeScore: data.resumeScore || 0
        });
      }
    } catch (error) {
      console.error('Error loading profile stats:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (updateUser) {
        await updateUser({ ...currentUser, ...profileData });
      }
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  const handleLogout = async () => {
    setLogoutModalVisible(false);
    await logout();
  };

  const handleDeleteAccount = async () => {
    setDeleteModalVisible(false);
    try {
      await deleteAccount();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete account');
    }
  };

  const handleExportData = () => {
    const msg = "Your data export has been requested. We will email it to you shortly.";
    if (Platform.OS === 'web') alert(msg);
    else Alert.alert('Export Data', msg);
  };

  const updateFormData = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const updateNotificationSetting = (setting, value) => {
    setNotifications(prev => ({ ...prev, [setting]: value }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const MenuItem = ({ icon, title, onPress, value, type = 'normal', color }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      disabled={type === 'toggle'}
    >
      <View style={[styles.menuIconContainer, { backgroundColor: color ? `${color}20` : `${colors.primary}20` }]}>
        <Ionicons
          name={icon}
          size={22}
          color={color || colors.primary}
        />
      </View>
      <View style={styles.menuContent}>
        <Text style={[
          styles.menuTitle,
          { color: type === 'danger' ? colors.danger : colors.text }
        ]}>
          {title}
        </Text>
      </View>
      {type === 'toggle' ? (
        <Switch
          value={value}
          onValueChange={onPress}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={'#FFFFFF'}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Custom Modals */}
      <ConfirmationModal
        visible={logoutModalVisible}
        title="Logout"
        message="Are you sure you want to logout?"
        onConfirm={handleLogout}
        onCancel={() => setLogoutModalVisible(false)}
        confirmText="Logout"
        type="primary" // Changed to primary as logout is standard action
      />

      <ConfirmationModal
        visible={deleteModalVisible}
        title="Delete Account"
        message="Are you sure? This action is permanent and cannot be undone."
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeleteModalVisible(false)}
        confirmText="Delete Permanently"
        type="danger"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={loadProfileStats} />
        }
      >
        {/* Header */}
        <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
          <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
          <TouchableOpacity onPress={loadProfileStats} style={{ padding: 8 }}>
            <Ionicons name="reload-circle-outline" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar name={currentUser.name || 'User'} size={70} style={styles.avatar} />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {currentUser.name || 'User Name'}
              </Text>
              <Text style={[styles.profileRole, { color: colors.textSecondary }]}>
                {currentUser.targetRole || 'Aspiring Professional'}
              </Text>
              <TouchableOpacity
                onPress={() => setEditing(!editing)}
                style={[styles.smallEditBtn, { borderColor: colors.border }]}
              >
                <Text style={{ fontSize: 12, color: colors.text }}>
                  {editing ? 'Cancel Edit' : 'Edit Profile'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {editing && (
            <View style={{ marginTop: 16 }}>
              <Input label="Name" value={profileData.name} onChangeText={(v) => updateFormData('name', v)} />
              <Input label="Target Role" value={profileData.targetRole} onChangeText={(v) => updateFormData('targetRole', v)} />
              <Input label="Phone" value={profileData.phone} onChangeText={(v) => updateFormData('phone', v)} />
              <Input label="Location" value={profileData.location} onChangeText={(v) => updateFormData('location', v)} />
              <Button title="Save Changes" onPress={handleSaveProfile} size="small" style={{ marginTop: 8 }} />
            </View>
          )}
        </Card>

        {/* Stats - Powered by Live User Data */}
        {stats && !editing && (
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Text style={[styles.statVal, { color: colors.primary }]}>
                {currentUser.streak || stats.currentStreak || 0} 🔥
              </Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Day Streak</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={[styles.statVal, { color: colors.success }]}>
                {stats.jobReadiness || 0}%
              </Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Readiness</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={[styles.statVal, { color: colors.text }]}>
                {Math.round((currentUser.studyMinutes || 0) / 60 * 10) / 10}h
              </Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Studied</Text>
            </Card>
          </View>
        )}

        {/* Premium Section */}
        {/* Premium Section */}
        {currentUser.isPremium ? (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SUBSCRIPTION STATUS</Text>
            <Card style={[styles.menuCard, { borderColor: colors.premium, borderWidth: 1 }]}>
              <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ backgroundColor: colors.premium + '20', padding: 8, borderRadius: 20, marginRight: 16 }}>
                  <Ionicons name="diamond" size={32} color={colors.premium} />
                </View>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>CareerLoop Pro Active</Text>
                  <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
                    Valid until: {currentUser.premiumExpiryDate ? formatDate(currentUser.premiumExpiryDate) : 'Lifetime'}
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>CAREERLOOP PRO</Text>

            {/* Show Expired Message if applicable */}
            {currentUser.premiumExpiryDate && new Date(currentUser.premiumExpiryDate) < new Date() && (
              <Card style={[styles.menuCard, { borderColor: colors.danger, borderWidth: 1, marginBottom: 12 }]}>
                <View style={{ padding: 12, flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="alert-circle" size={24} color={colors.danger} style={{ marginRight: 12 }} />
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.danger }}>Subscription Expired</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                      Expired on: {formatDate(currentUser.premiumExpiryDate)}
                    </Text>
                  </View>
                </View>
              </Card>
            )}

            <Card style={styles.menuCard} premium>
              <MenuItem
                icon="diamond"
                title="Upgrade to CareerLoop Pro"
                onPress={() => navigation.navigate('Premium')}
                color={colors.premium}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <MenuItem
                icon="flash"
                title="Unlimited MCQ Arena"
                onPress={() => navigation.navigate('Premium')}
                color={colors.primary}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <MenuItem
                icon="document-text"
                title="AI Resume Polishing"
                onPress={() => navigation.navigate('Premium')}
                color={colors.secondary}
              />
            </Card>
          </>
        )}

        {/* Settings */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SETTINGS</Text>
        <Card style={styles.menuCard}>
          <MenuItem icon={isDark ? "moon" : "sunny"} title="Dark Mode" type="toggle" value={isDark} onPress={toggleTheme} color={isDark ? "#FFD700" : "#FDB813"} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MenuItem icon="notifications" title="Notifications" type="toggle" value={notifications.jobMatches} onPress={() => updateNotificationSetting('jobMatches', !notifications.jobMatches)} />
        </Card>

        {/* Legal */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>LEGAL & PRIVACY</Text>
        <Card style={styles.menuCard}>
          <MenuItem icon="download-outline" title="Export Data" onPress={handleExportData} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MenuItem icon="shield-checkmark-outline" title="Privacy Policy" onPress={() => navigation.navigate('PrivacyPolicy')} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MenuItem icon="document-text-outline" title="Terms of Service" onPress={() => navigation.navigate('Terms')} />
        </Card>

        {/* Account */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ACCOUNT</Text>
        <Card style={styles.menuCard}>
          <MenuItem icon="log-out-outline" title="Logout" onPress={() => setLogoutModalVisible(true)} color={colors.primary} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MenuItem icon="trash-outline" title="Delete Account" type="danger" color={colors.danger} onPress={() => setDeleteModalVisible(true)} />
        </Card>

        <Text style={[styles.versionText, { color: colors.textSecondary }]}>Version 1.0.2</Text>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  header: { marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold' },
  profileCard: { marginBottom: 20 },
  profileHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { marginRight: 16 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: 'bold' },
  profileRole: { fontSize: 14, marginBottom: 6 },
  smallEditBtn: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { flex: 1, marginHorizontal: 4, alignItems: 'center', paddingVertical: 12 },
  statVal: { fontSize: 18, fontWeight: 'bold' },
  statLbl: { fontSize: 12, marginTop: 4 },
  sectionTitle: { fontSize: 12, fontWeight: '700', marginBottom: 8, marginLeft: 4, marginTop: 8 },
  menuCard: { padding: 0, overflow: 'hidden', marginBottom: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuIconContainer: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '500' },
  divider: { height: 1, marginLeft: 64 },
  versionText: { textAlign: 'center', fontSize: 12, marginTop: 10, opacity: 0.6 }
});

export default ProfileScreen;