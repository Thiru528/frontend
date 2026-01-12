const User = require('../models/User');

// Feature Limits configuration
const FREE_LIMITS = {
    STUDY_DAYS: 5,
    CHAT_DAILY_LIMIT: 3,
    JOB_LIMIT: 15,
    MCQ_DAILY_LIMIT: 5
};

exports.checkPremiumAccess = (feature) => {
    return async (req, res, next) => {
        try {
            const user = await User.findById(req.user.id);
            req.user.isPremium = user.isPremium; // Ensure latest status

            if (user.isPremium) {
                return next();
            }

            // Free Tier Logic
            switch (feature) {
                case 'resume_analysis':
                    if (user.freeResumeAnalysisUsed) {
                        return res.status(403).json({
                            success: false,
                            message: 'You have used your 1 free resume analysis. Upgrade to Premium for more!',
                            isPremiumLock: true
                        });
                    }
                    return next();

                case 'unlimited_jobs':
                    // Just pass flag to controller to limit results
                    req.isLimited = true;
                    req.limitCount = FREE_LIMITS.JOB_LIMIT;
                    return next();

                case 'study_plan_full':
                    // Handled in controller usually, but if requesting specific day > 5:
                    if (req.params.day && parseInt(req.params.day) > FREE_LIMITS.STUDY_DAYS) {
                        return res.status(403).json({
                            success: false,
                            message: `Day ${req.params.day} is locked. Day 1-5 are free. Upgrade to continue!`,
                            isPremiumLock: true
                        });
                    }
                    return next();

                case 'chat':
                    // Reset counter if new day
                    const today = new Date().toDateString();
                    const lastChat = user.lastChatDate ? new Date(user.lastChatDate).toDateString() : null;

                    if (lastChat !== today) {
                        user.dailyChatCount = 0;
                        user.lastChatDate = new Date();
                        await user.save();
                    }

                    if (user.dailyChatCount >= FREE_LIMITS.CHAT_DAILY_LIMIT) {
                        return res.status(403).json({
                            success: false,
                            message: 'Daily chat limit reached (5/5). Upgrade for unlimited.',
                            isPremiumLock: true
                        });
                    }
                    return next();

                case 'mcq_limit':
                    const todayMcq = new Date().toDateString();
                    const lastMcq = user.lastMcqDate ? new Date(user.lastMcqDate).toDateString() : null;

                    if (lastMcq !== todayMcq) {
                        user.dailyMcqCount = 0;
                        user.lastMcqDate = new Date();
                        await user.save();
                    }

                    if (user.dailyMcqCount >= FREE_LIMITS.MCQ_DAILY_LIMIT) {
                        return res.status(403).json({
                            success: false,
                            message: 'Daily Quiz limit reached (5/5). Upgrade for unlimited practice!',
                            isPremiumLock: true
                        });
                    }
                    return next();

                case 'custom_plan':
                    return res.status(403).json({
                        success: false,
                        message: 'Custom Study Plans are a Premium feature.',
                        isPremiumLock: true
                    });

                default:
                    return next();
            }

        } catch (error) {
            console.error("Premium Middleware Error", error);
            next(error);
        }
    };
};

exports.FREE_LIMITS = FREE_LIMITS;
