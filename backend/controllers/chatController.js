const Exam = require('../models/Exam');
const Resume = require('../models/Resume');
const Skill = require('../models/Skill');
const ChatHistory = require('../models/ChatHistory');
const { generateCompletion } = require('../services/aiService');

// ...

exports.sendMessage = async (req, res, next) => {
    try {
        const { message, context } = req.body;
        const userId = req.user.id;

        // 1. Fetch User Data
        const userProfile = await require('../models/User').findById(userId);
        const resume = await Resume.findOne({ user: userId }).sort('-createdAt');
        const skills = await Skill.find({ user: userId });
        const studyPlan = await require('../models/StudyPlan').findOne({ user: userId, isActive: true });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Daily Limit Check for Free Users
        if (!userProfile.isPremium) {
            const lastChat = userProfile.lastChatDate ? new Date(userProfile.lastChatDate) : new Date(0);

            // Normalize dates to midnight for comparison
            const lastChatDay = new Date(lastChat);
            lastChatDay.setHours(0, 0, 0, 0);
            const todayDay = new Date();
            todayDay.setHours(0, 0, 0, 0);

            // Reset count if it's a new day
            // (Using getTime() for accurate comparison)
            if (todayDay.getTime() > lastChatDay.getTime()) {
                console.log(`Chat Limit: New day detected for ${userProfile.name}. Resetting count.`);
                userProfile.dailyChatCount = 0;
                await userProfile.save({ validateBeforeSave: false });
            }

            // Enforce Limit (3 Messages)
            // Re-fetch or use updated count
            if (userProfile.dailyChatCount >= 3) {
                console.log(`Chat Limit: User ${userProfile.name} hit limit (3).`);
                return res.status(403).json({
                    success: false,
                    message: 'Daily chat limit reached (3/3). Upgrade to Premium for unlimited coaching.',
                    isPremiumLock: true
                });
            }
        }

        const recentExams = await Exam.find({ user: userId }).sort('-completedAt').limit(5);

        // 2. Construct Rich Context
        let richContext = `User Profile:
- Name: ${userProfile?.name || 'User'}
- Target Role: ${userProfile?.targetRole || 'Not specified'}
- Experience Level: ${userProfile?.experience || 'Not specified'}
- Location: ${userProfile?.location || 'Unknown'}
\n`;

        if (studyPlan) {
            richContext += `CURRENT STUDY PLAN:
- Title: ${studyPlan.title}
- Progress: Day ${studyPlan.currentDay} of ${studyPlan.totalDays}
\n`;
        }

        if (resume && resume.analysis) {
            richContext += `RESUME INSIGHTS:
- Skills: ${(resume.analysis.extractedSkills || []).join(', ')}
- Experience: ${resume.analysis.experienceLevel || 'Unknown'}
- Weaknesses: ${(resume.analysis.weaknesses || []).join(', ')}
\n`;
        }

        if (recentExams && recentExams.length > 0) {
            richContext += `RECENT EXAM SCORES:
`;
            recentExams.forEach(e => {
                richContext += `- ${e.skill}: ${e.score}% (${e.passed ? 'Passed' : 'Failed'})\n`;
            });
            richContext += `\n`;
        } else if (skills && skills.length > 0) {
            richContext += `OVERALL SKILL CONFIDENCE:
`;
            skills.forEach(s => {
                richContext += `- ${s.skillName}: ${s.confidence}%\n`;
            });
        }

        // 3. Build Prompt
        const prompt = `You are a personalized AI Career Coach.
        ${richContext}
        
        User Message: ${message}
        
        Task: Answer based on their SPECIFIC resume and exam performance above.
        If they ask about steady plans/jobs, refer to their weak skills or strong skills.
        Keep it encouraging and actionable.`;

        let reply;
        try {
            reply = await generateCompletion(prompt, "You are a Mentor.", false);

            // Increment usage for free users
            if (!userProfile.isPremium) {
                userProfile.dailyChatCount = (userProfile.dailyChatCount || 0) + 1;
                // Reset date handled in middleware, but ensure lastChatDate is set here too for accuracy
                userProfile.lastChatDate = new Date();
                await userProfile.save();
            }

            // --- SAVE TO DB ---
            await ChatHistory.create({
                user: userId,
                message: message,
                sender: 'user'
            });

            await ChatHistory.create({
                user: userId,
                message: reply,
                sender: 'ai'
            });

        } catch (aiError) {
            console.error("AI Chat Failed:", aiError);
            reply = "I'm having trouble connecting to my brain right now. Please try again in a moment.";
        }

        res.status(200).json({ success: true, data: { text: reply, isBot: true } });
    } catch (err) {
        console.error("❌ CHAT CONTROLLER ERROR:", err);
        res.status(500).json({ success: false, message: "Chat system error" });
    }
};

exports.getChatHistory = async (req, res, next) => {
    try {
        const history = await ChatHistory.find({ user: req.user.id })
            .sort('createdAt')
            .limit(50); // Limit to last 50 messages

        // Map to frontend format if needed, but schema matches roughly
        const formatted = history.map(h => ({
            id: h._id,
            text: h.message,
            isBot: h.sender === 'ai',
            timestamp: h.createdAt
        }));

        res.status(200).json({
            success: true,
            data: formatted
        });
    } catch (err) {
        next(err);
    }
};

exports.deleteChatHistory = async (req, res, next) => {
    try {
        await ChatHistory.deleteMany({ user: req.user.id });
        res.status(200).json({ success: true, message: 'Chat history cleared' });
    } catch (err) {
        next(err);
    }
};
