import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ResumeScreen from '../screens/resume/ResumeScreen';
import JobsScreen from '../screens/jobs/JobsScreen';
import StudyScreen from '../screens/study/StudyScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Resume Stack
import ResumeAnalysisScreen from '../screens/resume/ResumeAnalysisScreen';
import ResumeBuildScreen from '../screens/resume/ResumeBuildScreen';
import ResumeImproveScreen from '../screens/resume/ResumeImproveScreen';
import ResumeVersionsScreen from '../screens/resume/ResumeVersionsScreen';

// Study Stack
import ExamScreen from '../screens/study/ExamScreen';
import ExamResultScreen from '../screens/study/ExamResultScreen';
import StudyPlanScreen from '../screens/study/StudyPlanScreen';
import TopicTimelineScreen from '../screens/study/TopicTimelineScreen';
import TopicDetailScreen from '../screens/study/TopicDetailScreen';
import MCQArenaScreen from '../screens/study/MCQArenaScreen';

// Jobs Stack
import JobDetailsScreen from '../screens/jobs/JobDetailsScreen';

// Chat Stack
import ChatScreen from '../screens/chat/ChatScreen';

// Premium Stack
import PremiumScreen from '../screens/premium/PremiumScreen';

import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Resume Stack Navigator
const ResumeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ResumeMain" component={ResumeScreen} />
    <Stack.Screen name="ResumeAnalysis" component={ResumeAnalysisScreen} />
    <Stack.Screen name="ResumeBuild" component={ResumeBuildScreen} />
    <Stack.Screen name="ResumeImprove" component={ResumeImproveScreen} />
    <Stack.Screen name="ResumeVersions" component={ResumeVersionsScreen} />
  </Stack.Navigator>
);

// Study Stack Navigator
const StudyStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="StudyMain" component={StudyScreen} />
    <Stack.Screen name="StudyPlan" component={StudyPlanScreen} />
    <Stack.Screen name="TopicTimeline" component={TopicTimelineScreen} />
    <Stack.Screen name="TopicDetail" component={TopicDetailScreen} />
    <Stack.Screen name="MCQArena" component={MCQArenaScreen} />
    <Stack.Screen name="Exam" component={ExamScreen} />
    <Stack.Screen name="ExamResult" component={ExamResultScreen} />
  </Stack.Navigator>
);

// Jobs Stack Navigator
const JobsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="JobsMain" component={JobsScreen} />
    <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
  </Stack.Navigator>
);

// Main Tab Navigator
const MainNavigator = () => {
  const { colors } = useTheme();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="Premium"
        component={PremiumScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          presentation: 'modal',
          headerShown: true,
          headerTitle: 'CareerLoop AI Coach',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />

      {/* Legal Screens */}
      <Stack.Screen
        name="PrivacyPolicy"
        component={require('../screens/profile/PrivacyPolicyScreen').default}
        options={{
          headerShown: true,
          title: 'Privacy Policy',
          headerBackTitle: 'Back'
        }}
      />
      <Stack.Screen
        name="Terms"
        component={require('../screens/profile/TermsScreen').default}
        options={{
          headerShown: true,
          title: 'Terms of Service',
          headerBackTitle: 'Back'
        }}
      />
    </Stack.Navigator>
  );
};

const MainTabs = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Resume':
              iconName = focused ? 'document-text' : 'document-text-outline';
              break;
            case 'Jobs':
              iconName = focused ? 'briefcase' : 'briefcase-outline';
              break;
            case 'Study':
              iconName = focused ? 'school' : 'school-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'circle';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Resume" component={ResumeStack} />
      <Tab.Screen name="Jobs" component={JobsStack} />
      <Tab.Screen name="Study" component={StudyStack} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default MainNavigator;