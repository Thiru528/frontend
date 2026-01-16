import axios from 'axios';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalDatabase } from './LocalDatabase';
import { authEvents } from './authEvents';


// Base API configuration
// Base API configuration
// Base API configuration
// -----------------------------------------------------------------------------
// [INSTRUCTION]: Uncomment the LIVE URL below when you have deployed your backend.
// -----------------------------------------------------------------------------

// OPTION 1: Local Development (Use your computer's IP)
// const API_BASE_URL = 'http://10.169.126.4:5005/api'; 

// OPTION 2: Live Production (Render/Railway URL)
// Replace with your actual URL, e.g., https://careerloop.onrender.com/api
const API_BASE_URL = 'https://backend-t5ju.onrender.com/api';
// const API_BASE_URL = 'https://YOUR_BACKEND_URL.onrender.com/api'; 

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Default 30s timeout
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
  (response) => {
    // Opportunistic Sync: If we just talked to server successfully, try to flush the offline queue
    if (response.status === 200 || response.status === 201) {
      syncOfflineProgress();
    }
    return response;
  },
  async (error) => {
    // Prevent auto-logout loop if the 401 comes from the login endpoint itself (Wrong Password)
    const isLoginRequest = error.config?.url?.includes('/auth/login');

    if (error.response?.status === 401 && !isLoginRequest) {
      // Token expired or Invalid: FORCE LOGOUT
      // Clear ALL sensitive/user-specific data
      const keys = ['authToken', 'userData', 'cached_exams', 'study_progress', 'chat_history'];
      try {
        await AsyncStorage.multiRemove(keys);
        console.log('🔒 Session Expired. Cleared local user data.');
        authEvents.emitLogout(); // <-- Trigger UI Logout

        // IMPORTANT: Return a non-resolving promise to SWALLOW the error.
        // This prevents the calling component (Dashboard, Chat) from getting the error 
        // and showing an alert before the app navigates to Login.
        return new Promise(() => { });
      } catch (e) {
        console.error('Failed to clear auth data', e);
      }
    }
    return Promise.reject(error);
  }
);

// SYNC ENGINE: Flushes queued offline actions to MongoDB
const syncOfflineProgress = async () => {
  const queue = LocalDatabase.getPendingActions();
  if (queue.length === 0) return;

  console.log(`SyncEngine: Attempting to sync ${queue.length} actions...`);
  let syncCount = 0;

  for (const action of queue) {
    try {
      if (action.type === 'COMPLETE_DAY') {
        // We use the raw axios instance or apiClient without timeout to avoid loops (or just apiClient)
        // Using apiClient here is fine as long as we handle errors gracefully without endless loop
        await apiClient.post('/study/day/complete', { dayNumber: action.payload.dayNumber });
        syncCount++;
      }
      // Add other action types here (e.g. EXAM_SUBMIT)
    } catch (e) {
      console.log("SyncEngine: Failed to sync action", e.message);
      // If one fails, we stop this sync cycle 
      return;
    }
  }

  if (syncCount === queue.length) {
    // All synced successfully
    await LocalDatabase.clearQueue();
    console.log("SyncEngine: Sync Complete! Queue cleared.");
  }
};

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
  getRecommendedJobs: (page = 1, role = null) => {
    let url = `/jobs/recommended?page=${page}`;
    if (role) url += `&role=${encodeURIComponent(role)}`;
    return apiClient.get(url);
  },

  getJobMatchScore: (jobId) =>
    apiClient.get(`/jobs/match-score/${jobId}`),

  getMissingSkills: (jobId) =>
    apiClient.get(`/jobs/missing-skills/${jobId}`),
};


import { OFFLINE_PLANS, OFFLINE_EXAMS } from '../data/offlineData';

// Helper: Timeout Promise (60 seconds as requested)
const withTimeout = (promise, ms = 60000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("TIMEOUT"));
    }, ms);

    promise
      .then(value => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(reason => {
        clearTimeout(timer);
        reject(reason);
      });
  });
};

// Helper: Notify User
const notifyOfflineMode = () => {
  // "say to user Ai is in offline pls wait ten get from Db"
  Alert.alert(
    "AI Connection Weak",
    "AI is in offline mode. Switching to local database...",
    [{ text: "OK" }]
  );
};

// Study Plan API endpoints
export const studyAPI = {
  getStudyPlan: async () => {
    try {
      // Wait 120 seconds for AI before failing
      const response = await withTimeout(apiClient.get('/study/plan'), 120000);
      return response;
    } catch (error) {
      console.log("Network/Timeout error fetching study plan, switching to OFFLINE MODE");

      notifyOfflineMode(); // Notify the user

      // In offline mode, default to a comprehensive plan (e.g., Java)
      const offlinePlan = LocalDatabase.getStudyPlan('Java');
      return {
        data: {
          success: true,
          data: offlinePlan,
          message: "Served from offline backup (AI Unreachable)"
        }
      };
    }
  },

  markTaskCompleted: (taskId, completed) =>
    apiClient.post(`/study/task/${taskId}/complete`, { completed }),

  getSkillProgress: () =>
    apiClient.get('/study/progress'),

  generateStudyPlan: () =>
    apiClient.post('/study/plan/generate'),

  generateCustomStudyPlan: async (customPrompt) => {
    try {
      const response = await withTimeout(apiClient.post('/study/plan/custom', { customPrompt }), 15000);
      return response;
    } catch (error) {
      console.log("Network error generating custom plan, using offline template");

      notifyOfflineMode();

      // Use the LocalDatabase to find the best match for the user's prompt
      const offlinePlan = LocalDatabase.getStudyPlan(customPrompt);

      return {
        data: {
          success: true,
          data: offlinePlan
        }
      };
    }
  },

  generateTopicLesson: async (topic) => {
    try {
      const response = await withTimeout(apiClient.post('/study/lesson', { topic }), 120000);
      return response;
    } catch (err) {
      throw err; // Let screen handle fallback with alert
    }
  },

  completeDay: async (dayNumber) => {
    // Optimistic Update: Always update local state immediately
    LocalDatabase.markDayComplete(dayNumber);

    try {
      const response = await withTimeout(apiClient.post('/study/day/complete', { dayNumber }), 5000);
      return response;
    } catch (error) {
      console.log("Network error completing day, kept local update");
      return { data: { success: true, message: "Marked complete locally" } };
    }
  },

  logTime: (minutes) => apiClient.post('/study/log-time', { minutes }),
  logExamCompletion: () => apiClient.post('/study/exam/complete'),
};

// Exam API endpoints
// Helper: Retry Strategy
const fetchWithRetry = async (fn, retries = 3, delay = 2000) => {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    console.log(`[API] Retrying... attempts left: ${retries}`);
    await new Promise(res => setTimeout(res, delay));
    return fetchWithRetry(fn, retries - 1, delay * 1.5);
  }
};

export const examAPI = {
  getQuestionsForSkill: async (skillId, count = 10) => {
    try {
      console.log(`[API] Fetching Exam for: ${skillId}`);

      // User Request: "Try for 5 times", "Hold for 20 seconds" 
      // Total Wait: 5 * 20s = 100 seconds (~1.5 mins) before switching to backup
      const response = await fetchWithRetry(
        () => withTimeout(apiClient.get(`/exam/questions/${skillId}?count=${count}`), 20000), // 20 Seconds Timeout per request
        5, // 5 Attempts
        1000 // 1s delay between retries (quick retry after timeout)
      );

      // CACHE SUCCESSFUL AI RESPONSE
      if (response.data && response.data.questions && response.data.questions.length > 0) {
        await LocalDatabase.saveAIExam(skillId, response.data);
      }

      return response;
    } catch (error) {
      console.log(`[API] Network/AI failed for ${skillId} after retries. Switching to OFFLINE MODE`);

      // Notify User
      notifyOfflineMode();

      // Fallback (Now checks Cache + Static Data)
      const offlineData = LocalDatabase.getQuiz(skillId, count);

      // Wrap in API response structure so ExamScreen can parse it (response.data.success)
      return {
        data: {
          success: true,
          data: offlineData
        }
      };
    }
  },

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

  clearHistory: () =>
    apiClient.delete('/chat/history'),
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