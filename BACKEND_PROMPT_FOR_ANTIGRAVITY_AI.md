# 🚀 AI Career Coach Backend - Complete System Prompt for Anti Gravity AI

## 📋 Project Overview
Build a production-ready **Node.js/Express backend** for the AI Career Coach mobile app. This is a comprehensive career development platform with AI-powered features for resume building, job matching, skill assessment, and career coaching.

## 🛠 Tech Stack Requirements
- **Backend**: Node.js + Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcrypt password hashing
- **AI Integration**: OpenAI GPT-4 API for resume analysis and career coaching
- **File Storage**: AWS S3 or Cloudinary for resume PDFs
- **Email**: SendGrid or Nodemailer for notifications
- **Deployment**: Docker + AWS/Railway/Render ready

## 📊 Database Schema Design

### 1. **Users Collection**
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  targetRole: String,
  experience: String, // "Entry Level", "Mid Level", "Senior"
  location: String,
  phone: String,
  linkedIn: String,
  github: String,
  profilePicture: String,
  isEmailVerified: Boolean,
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date,
  preferences: {
    notifications: {
      studyReminders: Boolean,
      examAlerts: Boolean,
      jobMatches: Boolean,
      weeklyReports: Boolean
    },
    theme: String // "light", "dark", "auto"
  }
}
```

### 2. **Resumes Collection**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  name: String, // "Original Resume", "AI Improved", etc.
  fileUrl: String, // S3/Cloudinary URL
  fileName: String,
  fileSize: Number,
  isActive: Boolean,
  version: Number,
  atsScore: Number, // 0-100
  analysis: {
    extractedSkills: [String],
    strengths: [String],
    weaknesses: [String],
    experienceLevel: String,
    domain: String,
    suggestions: [String]
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 3. **Skills Collection**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  skillName: String,
  category: String, // "Programming", "Framework", "Database", etc.
  proficiency: Number, // 0-100
  confidence: Number, // 0-100
  testsCompleted: Number,
  lastTestDate: Date,
  studyHours: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### 4. **Jobs Collection**
```javascript
{
  _id: ObjectId,
  title: String,
  company: String,
  location: String,
  salary: String,
  type: String, // "Full-time", "Part-time", "Contract"
  remote: Boolean,
  description: String,
  requirements: [String],
  benefits: [String],
  requiredSkills: [String],
  experienceLevel: String,
  industry: String,
  postedDate: Date,
  externalUrl: String,
  isActive: Boolean,
  createdAt: Date
}
```

### 5. **Job Applications Collection**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  jobId: ObjectId,
  matchPercentage: Number,
  missingSkills: [String],
  status: String, // "interested", "applied", "interviewing", "rejected", "hired"
  appliedDate: Date,
  notes: String,
  createdAt: Date
}
```

### 6. **Study Plans Collection**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  title: String, // "30-Day JavaScript Mastery"
  totalDays: Number,
  currentDay: Number,
  completedDays: Number,
  isActive: Boolean,
  weeks: [{
    week: Number,
    title: String,
    days: [{
      day: Number,
      title: String,
      tasks: [String],
      duration: String,
      skill: String,
      completed: Boolean,
      completedAt: Date
    }]
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### 7. **Exams Collection**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  skill: String,
  questions: [{
    question: String,
    options: [String],
    correctAnswer: Number,
    explanation: String
  }],
  userAnswers: [Number],
  score: Number, // 0-100
  passed: Boolean, // >= 70%
  timeSpent: Number, // seconds
  completedAt: Date,
  createdAt: Date
}
```

### 8. **Chat History Collection**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  messages: [{
    text: String,
    isBot: Boolean,
    timestamp: Date,
    context: String // "resume", "jobs", "skills", "general"
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### 9. **User Progress Collection**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  studyStreak: {
    current: Number,
    longest: Number,
    lastStudyDate: Date
  },
  totalStudyHours: Number,
  testsCompleted: Number,
  skillsLearned: Number,
  jobReadinessScore: Number, // 0-100
  weeklyGoals: {
    studyHours: { target: Number, completed: Number },
    testsCompleted: { target: Number, completed: Number }
  },
  placementMode: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔗 API Endpoints Structure

### **Authentication Routes** (`/api/auth`)
```
POST /register - User registration
POST /login - User login
POST /refresh - Refresh JWT token
POST /logout - User logout
POST /forgot-password - Send password reset email
POST /reset-password - Reset password with token
GET /verify-email/:token - Email verification
```

### **User Routes** (`/api/users`)
```
GET /profile - Get user profile
PUT /profile - Update user profile
PUT /preferences - Update user preferences
DELETE /account - Delete user account
GET /stats - Get user statistics
```

### **Resume Routes** (`/api/resumes`)
```
POST /upload - Upload resume PDF
GET / - Get all user resumes
GET /:id - Get specific resume
PUT /:id - Update resume details
DELETE /:id - Delete resume
POST /:id/analyze - Analyze resume with AI
POST /:id/improve - Get AI improvement suggestions
POST /build - Build resume with AI (form data)
POST /:id/set-active - Set as active resume
```

### **Jobs Routes** (`/api/jobs`)
```
GET /recommended - Get AI-recommended jobs for user
GET /:id - Get job details
POST /:id/match - Calculate job match percentage
GET /:id/missing-skills - Get missing skills for job
POST /:id/apply - Mark job as applied
GET /applications - Get user's job applications
PUT /applications/:id - Update application status
```

### **Skills Routes** (`/api/skills`)
```
GET / - Get user skills
POST / - Add new skill
PUT /:id - Update skill proficiency
DELETE /:id - Remove skill
POST /:id/confidence - Update skill confidence
GET /suggestions - Get skill suggestions based on target role
```

### **Study Routes** (`/api/study`)
```
GET /plan - Get user's study plan
POST /plan - Create new study plan
PUT /plan/:id - Update study plan
POST /task/:id/complete - Mark task as completed
GET /progress - Get study progress
POST /goals - Update weekly goals
POST /streak - Update study streak
```

### **Exam Routes** (`/api/exams`)
```
GET /questions/:skill - Get exam questions for skill
POST /submit - Submit exam answers
GET /results/:id - Get exam results
GET /history - Get exam history
POST /retake/:id - Retake failed exam
```

### **Chat Routes** (`/api/chat`)
```
POST /message - Send message to AI coach
GET /history - Get chat history
DELETE /history - Clear chat history
```

### **Dashboard Routes** (`/api/dashboard`)
```
GET / - Get dashboard data
GET /activity - Get weekly activity
GET /job-readiness - Calculate job readiness score
```

## 🤖 AI Integration Features

### **1. Resume Analysis AI**
```javascript
// Use OpenAI GPT-4 to analyze resume
const analyzeResume = async (resumeText) => {
  const prompt = `
    Analyze this resume and provide:
    1. Extracted skills (array)
    2. Strengths (array)
    3. Weaknesses (array)
    4. Experience level (Entry/Mid/Senior)
    5. Domain/Industry
    6. ATS score (0-100)
    7. Improvement suggestions
    
    Resume: ${resumeText}
  `;
  
  // Call OpenAI API
  // Return structured analysis
};
```

### **2. Job Matching AI**
```javascript
// Calculate job match percentage
const calculateJobMatch = async (userSkills, jobRequirements) => {
  // AI-powered matching algorithm
  // Return match percentage and missing skills
};
```

### **3. Career Coaching AI**
```javascript
// AI chat responses
const generateChatResponse = async (message, userContext) => {
  const prompt = `
    You are an AI Career Coach. User context:
    - Target Role: ${userContext.targetRole}
    - Experience: ${userContext.experience}
    - Skills: ${userContext.skills}
    
    User message: ${message}
    
    Provide helpful career advice.
  `;
  
  // Return AI response
};
```

### **4. Study Plan Generation**
```javascript
// Generate personalized study plan
const generateStudyPlan = async (userSkills, targetRole, weakSkills) => {
  // AI-generated 30-day study plan
  // Return structured plan with daily tasks
};
```

## 🔒 Security Features

### **1. Authentication Middleware**
```javascript
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};
```

### **2. Rate Limiting**
```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});
```

### **3. Input Validation**
```javascript
const { body, validationResult } = require('express-validator');

const validateRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 2 }),
  // Handle validation errors
];
```

## 📧 Email Notifications

### **Email Templates**
```javascript
const emailTemplates = {
  welcome: (userName) => ({
    subject: 'Welcome to AI Career Coach!',
    html: `<h1>Welcome ${userName}!</h1>...`
  }),
  studyReminder: (userName, todayTask) => ({
    subject: 'Daily Study Reminder',
    html: `<h1>Hi ${userName}!</h1><p>Today's task: ${todayTask}</p>...`
  }),
  jobMatch: (userName, jobTitle, matchPercentage) => ({
    subject: 'New Job Match Found!',
    html: `<h1>Hi ${userName}!</h1><p>${matchPercentage}% match for ${jobTitle}</p>...`
  })
};
```

## 🐳 Docker Configuration

### **Dockerfile**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### **docker-compose.yml**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/ai-career-coach
    depends_on:
      - mongo
  
  mongo:
    image: mongo:5
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

## 🌍 Environment Variables

### **.env Template**
```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/ai-career-coach

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_BUCKET_NAME=ai-career-coach-resumes
AWS_REGION=us-east-1

# Email
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@aicareercoach.com

# Frontend URL
FRONTEND_URL=http://localhost:8081

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📊 Sample Data Seeds

### **Skills Database**
```javascript
const skillsData = [
  { name: 'JavaScript', category: 'Programming', difficulty: 'Beginner' },
  { name: 'React', category: 'Framework', difficulty: 'Intermediate' },
  { name: 'Node.js', category: 'Backend', difficulty: 'Intermediate' },
  { name: 'Python', category: 'Programming', difficulty: 'Beginner' },
  { name: 'MongoDB', category: 'Database', difficulty: 'Intermediate' },
  // ... 100+ skills
];
```

### **Job Listings**
```javascript
const jobsData = [
  {
    title: 'Senior React Developer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    salary: '$120k - $150k',
    requiredSkills: ['React', 'JavaScript', 'Node.js'],
    // ... more job data
  },
  // ... 500+ job listings
];
```

### **MCQ Questions Bank**
```javascript
const questionsData = {
  JavaScript: [
    {
      question: 'What is the correct way to declare a variable in ES6?',
      options: ['var x = 5', 'let x = 5', 'const x = 5', 'Both let and const'],
      correctAnswer: 3,
      explanation: 'Both let and const are ES6 ways to declare variables...'
    },
    // ... 50+ questions per skill
  ],
  React: [
    // ... React questions
  ],
  // ... questions for all skills
};
```

## 🚀 Deployment Instructions

### **1. Railway Deployment**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway add mongodb
railway deploy
```

### **2. AWS Deployment**
```bash
# Using AWS Elastic Beanstalk
eb init
eb create production
eb deploy
```

### **3. Render Deployment**
```bash
# Connect GitHub repo to Render
# Set environment variables
# Auto-deploy on push
```

## 📋 Testing Requirements

### **Unit Tests**
```javascript
// Test authentication
describe('Auth Routes', () => {
  test('POST /api/auth/register', async () => {
    // Test user registration
  });
  
  test('POST /api/auth/login', async () => {
    // Test user login
  });
});

// Test resume analysis
describe('Resume Analysis', () => {
  test('should analyze resume correctly', async () => {
    // Test AI resume analysis
  });
});
```

### **Integration Tests**
```javascript
// Test complete user journey
describe('User Journey', () => {
  test('Register -> Login -> Upload Resume -> Get Jobs', async () => {
    // End-to-end test
  });
});
```

## 📈 Performance Requirements

- **Response Time**: < 200ms for API calls
- **File Upload**: Support up to 10MB PDF files
- **Concurrent Users**: Handle 1000+ concurrent users
- **Database**: Optimized queries with proper indexing
- **Caching**: Redis for frequently accessed data
- **CDN**: CloudFront for static assets

## 🔍 Monitoring & Logging

### **Logging**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### **Health Check Endpoint**
```javascript
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});
```

## 🎯 Success Criteria

### **Functional Requirements**
✅ User authentication with JWT  
✅ Resume upload and AI analysis  
✅ Job matching algorithm  
✅ Study plan generation  
✅ MCQ exam system  
✅ AI chat coaching  
✅ Progress tracking  
✅ Email notifications  

### **Non-Functional Requirements**
✅ 99.9% uptime  
✅ < 200ms API response time  
✅ Secure data handling  
✅ Scalable architecture  
✅ Comprehensive error handling  
✅ Detailed API documentation  

## 📚 Additional Features

### **Admin Dashboard**
- User management
- Content management
- Analytics dashboard
- System monitoring

### **Analytics**
- User engagement tracking
- Feature usage statistics
- Performance metrics
- A/B testing support

### **Mobile API Optimizations**
- Pagination for large datasets
- Image optimization
- Offline data caching
- Push notifications

---

## 🎯 **DELIVERABLES FOR ANTI GRAVITY AI:**

1. **Complete Node.js/Express backend** with all endpoints
2. **MongoDB database** with proper schemas and indexing
3. **AI integration** with OpenAI for resume analysis and chat
4. **File upload system** with AWS S3/Cloudinary
5. **Authentication system** with JWT and security middleware
6. **Email notification system** with templates
7. **Docker configuration** for easy deployment
8. **Comprehensive API documentation** with Postman collection
9. **Unit and integration tests** with Jest
10. **Deployment scripts** for Railway/AWS/Render

**Timeline: 2-3 weeks for complete backend development**

**Budget: $3,000 - $5,000 for full backend system**

This backend will perfectly integrate with the React Native frontend and provide all the AI-powered features for the career coaching platform! 🚀