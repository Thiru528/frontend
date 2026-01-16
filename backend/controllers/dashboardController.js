const User = require('../models/User');
const Resume = require('../models/Resume');
const Skill = require('../models/Skill');
const { checkStreakDecay, updateStreak } = require('../utils/streakUtils');

exports.getDashboardData = async (req, res, next) => {
    try {
        const userId = req.user.id; // User is attached by auth middleware

        // 1. Get Resume for ATS Score
        const resume = await Resume.findOne({ user: userId }).sort({ createdAt: -1 });
        const resumeScore = resume ? resume.atsScore : 0;

        // 2. Get Skills for Progress
        const skills = await Skill.find({ user: userId });

        const skillProgress = skills.map(s => ({
            name: s.skillName,
            confidence: s.confidence,
            progress: s.confidence / 100 // Normalized 0-1
        }));

        // Calculate aggregate stats
        const totalConfidence = skills.reduce((sum, s) => sum + s.confidence, 0);
        const avgConfidence = skills.length > 0 ? Math.round(totalConfidence / skills.length) : 0;

        // Job Readiness approx logic
        const jobReadiness = Math.round((resumeScore * 0.4) + (avgConfidence * 0.6));

        // 3. Construct Response matches Frontend structure

        const StudyPlan = require('../models/StudyPlan');
        const activePlan = await StudyPlan.findOne({ user: userId, isActive: true });

        // Real MCQ Count
        const todayStr = new Date().toDateString();
        const lastMcqStr = req.user.lastMcqDate ? new Date(req.user.lastMcqDate).toDateString() : null;
        const mcqCompleted = (lastMcqStr === todayStr) ? (req.user.dailyMcqCount || 0) : 0;

        // 3. Construct Response matches Frontend structure
        // Calculate estimated study hours (2 hours per completed day + 0.2 hours per test)
        const completedDaysCount = activePlan ? (activePlan.completedDays || 0) : 0;
        const totalTests = await require('../models/Exam').countDocuments({ user: userId });
        const estimatedStudyHours = (completedDaysCount * 2) + Math.round(totalTests * 0.2);


        // Check Streak Decay
        if (checkStreakDecay(req.user)) {
            await req.user.save();
        }

        const dashboardData = {
            studyStreak: req.user.streak || 0,
            resumeScore: resumeScore,
            jobReadiness: jobReadiness,
            dailyGoals: {
                studyTime: { completed: 1, target: 4 }, // Mock for now, or track session time later
                mcqTests: { completed: mcqCompleted, target: 5 }
            },
            todayTask: activePlan && activePlan.calendar && activePlan.calendar.length > 0
                ? `Day ${activePlan.currentDay || 1}: ${activePlan.calendar[(activePlan.currentDay || 1) - 1]?.title || "Review"}`
                : "Create a Study Plan to get started!",
            skillProgress: skillProgress.length > 0 ? skillProgress : [
                { name: "Add your first skill!", confidence: 0, progress: 0 }
            ],
            weeklyActivity: {
                studyHours: estimatedStudyHours,
                testsCompleted: totalTests,
                skillsImproved: skills.length
            },
            jobMatchPercentage: jobReadiness // Use calculated readiness for match score too
        };

        res.status(200).json({
            success: true,
            data: dashboardData
        });
    } catch (error) {
        console.error("Dashboard Error:", error);
        next(error);
    }
};


exports.updateStreak = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        updateStreak(user);

        await user.save();
        res.status(200).json({ success: true, streak: user.streak, message: "Streak updated" });
    } catch (err) {
        next(err);
    }
};
