import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base API configuration
// Base API configuration
// const API_BASE_URL = 'http://localhost:5005/api'; 
const API_BASE_URL = 'http://10.169.126.4:5005/api'; // Updated to LAN IP for Mobile Access

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Increased to 60s for AI operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, logout user
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      // You might want to navigate to login screen here
    }
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),

  register: (userData) =>
    apiClient.post('/auth/register', userData),

  refreshToken: () =>
    apiClient.post('/auth/refresh'),

  deleteAccount: () =>
    apiClient.delete('/auth/me'),

  getMe: () =>
    apiClient.get('/auth/me'),
};

// Resume API endpoints
export const resumeAPI = {
  uploadResume: async (formData) => {
    // get token manually since we are bypassing apiClient interceptors
    const token = await AsyncStorage.getItem('authToken');
    return axios.post(`${API_BASE_URL}/resume/upload`, formData, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'multipart/form-data', // Axios 1.x+ with FormData often prefers this explicit or undefined. safely letting axios set boundary is best but if that fails, we try explicit.
        // Actually, best practice for RN Axios + FormData is:
        // headers: { 'Content-Type': 'multipart/form-data' } AND transformRequest: () => formData
      },
      transformRequest: (data) => data, // crucial!
    });
  },

  analyzeResume: (resumeId) =>
    apiClient.get(`/resume/analyze/${resumeId}`),

  improveResume: (resumeId, improvements) =>
    apiClient.post(`/resume/improve/${resumeId}`, { improvements }),

  enhanceResumeContent: (data) =>
    apiClient.post('/resume/enhance-content', data),

  getResume: () =>
    apiClient.get('/resume/versions'),

  getResumeVersions: () =>
    apiClient.get('/resume/versions'),

  buildResume: (formData) =>
    apiClient.post('/resume/build', formData),

  setActiveVersion: (id) =>
    apiClient.put(`/resume/set-active/${id}`),

  deleteResume: (id) =>
    apiClient.delete(`/resume/${id}`),
};

// Jobs API endpoints
export const jobsAPI = {
  getRecommendedJobs: (page = 1) =>
    apiClient.get(`/jobs/recommended?page=${page}`),

  getJobMatchScore: (jobId) =>
    apiClient.get(`/jobs/match-score/${jobId}`),

  getMissingSkills: (jobId) =>
    apiClient.get(`/jobs/missing-skills/${jobId}`),
};

// Study Plan API endpoints
export const studyAPI = {
  getStudyPlan: () =>
    apiClient.get('/study/plan'),

  markTaskCompleted: (taskId) =>
    apiClient.post(`/study/task/${taskId}/complete`),

  getSkillProgress: () =>
    apiClient.get('/study/progress'),

  updateDailyGoals: (goals) =>
    apiClient.post('/study/goals', goals),

  generateStudyPlan: () =>
    apiClient.post('/study/plan/generate'),

  generateCustomStudyPlan: (customPrompt) =>
    apiClient.post('/study/plan/custom', { customPrompt }),

  generateTopicLesson: (topic) =>
    apiClient.post('/study/lesson', { topic }),

  completeDay: (dayNumber) =>
    apiClient.post('/study/day/complete', { dayNumber }),
};

// Exam API endpoints
export const examAPI = {
  getQuestionsForSkill: (skillId, count = 10) =>
    apiClient.get(`/exam/questions/${skillId}?count=${count}`),

  submitExamAnswers: (payload) =>
    apiClient.post(`/exam/submit`, payload),

  getExamResults: (examId) =>
    apiClient.get(`/exam/results/${examId}`),

  updateSkillConfidence: (skillId, confidence) =>
    apiClient.post(`/skills/${skillId}/confidence`, { confidence }),
};

// Dashboard API endpoints
export const dashboardAPI = {
  getDashboardData: () =>
    apiClient.get('/dashboard'),

  getWeeklyActivity: () =>
    apiClient.get('/dashboard/activity'),

  getJobReadinessScore: () =>
    apiClient.get('/dashboard/job-readiness'),

  updateStreak: () =>
    apiClient.post('/dashboard/streak'),
};

// AI Chat API endpoints
export const chatAPI = {
  sendMessage: (message, context) =>
    apiClient.post('/chat/send', { message, context }),

  getChatHistory: () =>
    apiClient.get('/chat/history'),
};

// Profile API endpoints
export const profileAPI = {
  updateProfile: (profileData) =>
    apiClient.put('/profile', profileData),

  getProfile: () =>
    apiClient.get('/profile'),

  updateTargetRole: (targetRole) =>
    apiClient.post('/profile/target-role', { targetRole }),
};

// Payment API
export const paymentAPI = {
  createOrder: (planId, amount) =>
    apiClient.post('/payment/create-order', { planId, amount }),

  verifyPayment: (data) =>
    apiClient.post('/payment/verify', data),
};

export default apiClient;