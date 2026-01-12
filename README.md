# AI Career Coach - Resume Builder, Job Match & Study Planner

A production-ready React Native (Expo) mobile app that helps users build their careers with AI-powered features including resume building, job matching, study planning, and skill assessment.

## 🚀 Features

### Core Modules
- **Dashboard**: User greeting, resume ATS score, skill progress, study streak, job readiness
- **Resume Builder**: Upload PDF, AI-powered resume building, analysis, and version management
- **Job Matching**: AI-recommended jobs with match percentages, missing skills analysis
- **Study Planner**: 30-day AI study plans, daily tasks, skill tracking, MCQ exams
- **Profile Management**: User settings, statistics, theme toggle, notifications

### Advanced Features
- **AI Chat Coach**: In-app AI assistant for career guidance and doubt resolution
- **Skill Confidence Meter**: Track confidence levels per skill after exams
- **Daily Goal System**: Set and track daily study and test completion goals
- **Streak System**: Gamified daily study streaks with visual indicators
- **Resume Version History**: Manage multiple resume versions with ATS scores
- **Job Readiness Score**: Comprehensive score based on resume, skills, and exam performance
- **Placement Mode**: Focus mode for weak skills during job preparation

## 🛠 Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Bottom Tabs + Stack)
- **HTTP Client**: Axios for API calls
- **Storage**: AsyncStorage for secure token storage
- **Icons**: React Native Vector Icons (Ionicons)
- **Components**: Functional components only
- **State Management**: React Context API
- **Styling**: StyleSheet with theme support

## 📱 App Structure

```
src/
├── components/          # Reusable UI components
│   ├── Button.js
│   ├── Card.js
│   ├── Input.js
│   ├── LoadingScreen.js
│   └── ProgressBar.js
├── context/            # React Context providers
│   ├── AuthContext.js
│   └── ThemeContext.js
├── navigation/         # Navigation configuration
│   ├── AuthNavigator.js
│   └── MainNavigator.js
├── screens/           # Screen components
│   ├── auth/          # Authentication screens
│   ├── dashboard/     # Dashboard screen
│   ├── resume/        # Resume module screens
│   ├── jobs/          # Job matching screens
│   ├── study/         # Study planner screens
│   ├── profile/       # Profile screen
│   └── chat/          # AI chat screen
└── services/          # API services
    └── api.js
```

## 🎨 UI/UX Features

- **Clean Modern Design**: Card-based layout with consistent spacing
- **Dark/Light Theme**: Automatic theme switching with user preference
- **Mobile-First**: Optimized for mobile devices with touch-friendly interactions
- **Progress Indicators**: Visual progress bars and completion states
- **Loading States**: Proper loading indicators and error handling
- **Responsive Layout**: Adapts to different screen sizes

## 🔐 Authentication & Security

- **JWT Token Storage**: Secure token storage using AsyncStorage
- **Auto-logout**: Automatic logout on token expiration
- **Form Validation**: Client-side validation for all forms
- **Secure API Calls**: Interceptors for automatic token attachment

## 📊 Key Screens

### Dashboard
- Welcome message with user greeting
- Study streak counter with fire emoji
- Resume ATS score card
- Skill progress with confidence meters
- Daily goals tracking
- Weekly activity summary
- Job readiness score

### Resume Module
- **Upload Resume**: PDF upload with file picker
- **AI Resume Builder**: Step-by-step form-based resume creation
- **Resume Analysis**: Skill extraction, strengths/weaknesses, ATS score
- **Version Management**: Multiple resume versions with comparison

### Job Matching
- **Recommended Jobs**: AI-matched jobs with percentage scores
- **Job Details**: Comprehensive job information with requirements
- **Missing Skills**: Skills gap analysis with learning recommendations
- **External Links**: Direct links to LinkedIn and Naukri job searches

### Study Planner
- **30-Day Plan**: Structured learning path with daily tasks
- **Skill Tracking**: Progress monitoring with confidence levels
- **MCQ Exams**: Timed tests with immediate results and explanations
- **Placement Mode**: Focused learning for job preparation

### AI Chat
- **Career Guidance**: AI-powered career advice and recommendations
- **Contextual Responses**: Personalized responses based on user profile
- **Quick Questions**: Pre-defined questions for common queries
- **Chat History**: Persistent conversation history

## 🧪 Exam System

- **Timed Tests**: 10-minute MCQ tests with countdown timer
- **Skill-Based**: Tests categorized by programming languages and technologies
- **Immediate Results**: Instant scoring with pass/fail status (70% threshold)
- **Detailed Explanations**: Correct answers with explanations for learning
- **Retake Option**: Ability to retake failed exams
- **Confidence Updates**: Automatic skill confidence updates based on performance

## 📈 Gamification Elements

- **Study Streaks**: Daily study streak tracking with visual indicators
- **Progress Bars**: Visual progress tracking for all activities
- **Achievement System**: Skill confidence levels and completion badges
- **Goal Setting**: Daily and weekly goal setting with progress tracking

## 🔧 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-career-coach
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API endpoints**
   - Update `src/services/api.js` with your backend API URL
   - Replace mock data with actual API calls

4. **Run the app**
   ```bash
   # Start Expo development server
   npm start

   # Run on iOS simulator
   npm run ios

   # Run on Android emulator
   npm run android
   ```

## 🌐 API Integration

The app is structured to work with a backend API. Key endpoints include:

- **Authentication**: `/auth/login`, `/auth/register`
- **Resume**: `/resume/upload`, `/resume/analyze`, `/resume/improve`
- **Jobs**: `/jobs/recommended`, `/jobs/match-score`
- **Study**: `/study/plan`, `/study/progress`
- **Exams**: `/exam/questions`, `/exam/submit`
- **Chat**: `/chat/message`, `/chat/history`

## 🎯 Production Readiness

- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading States**: Loading indicators for all async operations
- **Offline Support**: Graceful handling of network issues
- **Performance**: Optimized rendering and memory usage
- **Accessibility**: Screen reader support and touch accessibility
- **Code Quality**: Clean, maintainable code with proper commenting

## 🚀 Deployment

The app is ready for deployment to:
- **iOS App Store**: Using Expo's build service
- **Google Play Store**: Using Expo's build service
- **Web**: Can be deployed as a web app using Expo Web

## 📝 Future Enhancements

- **Push Notifications**: Study reminders and job alerts
- **Social Features**: Connect with other learners
- **Video Learning**: Integrated video tutorials
- **Mock Interviews**: AI-powered interview practice
- **Certification Tracking**: Track completed certifications
- **Analytics Dashboard**: Detailed learning analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- React Native and Expo teams for the excellent framework
- React Navigation for seamless navigation
- Vector Icons for beautiful iconography
- All contributors and testers

---

**Built with ❤️ for career growth and learning**