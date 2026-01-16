const StudyPlan = require('../models/StudyPlan');
const { generateCompletion } = require('../services/aiService');
const { updateStreak } = require('../utils/streakUtils');

exports.getStudyPlan = async (req, res, next) => {
    try {
        const plan = await StudyPlan.findOne({ user: req.user.id, isActive: true });
        // Return null if not found, frontend manages generation
        res.status(200).json({ success: true, data: plan });
    } catch (err) {
        next(err);
    }
};

exports.generateCustomStudyPlan = async (req, res, next) => {
    try {
        const { customPrompt } = req.body;

        if (!customPrompt) {
            return res.status(400).json({ success: false, message: "Prompt is required" });
        }

        // Deactivate old plans
        await StudyPlan.updateMany({ user: req.user.id }, { isActive: false });

        const prompt = `You are an expert AI Course Creator.
The user wants a custom study plan for: "${customPrompt}".
Create a detailed 30-day study plan.

Return JSON only:
{
  "title": "Mastering ${customPrompt}",
  "calendar": [
    {
      "day": 1,
      "title": "Topic Name",
      "tasks": [{"title": "Subtask", "resourceType": "Video/Article", "resourceUrl": "url", "completed": false}]
    }
  ]
}
Generate detailed tasks for Days 1-3. For Days 4-30, provide just the daily title.
`;

        let aiPlan;
        try {
            aiPlan = await generateCompletion(prompt, "You are a Senior Curriculum Designer.", true);
        } catch (error) {
            console.error("Custom Plan AI Failed:", error);
            // Fallback: Generate a safe "Offline" plan
            aiPlan = {
                title: `Mastering ${customPrompt} (Offline)`,
                calendar: Array.from({ length: 30 }, (_, i) => ({
                    day: i + 1,
                    title: `Day ${i + 1}: ${customPrompt} Concepts`,
                    tasks: [
                        { title: `Read Documentation for ${customPrompt}`, resourceType: "Article", resourceUrl: `https://www.google.com/search?q=${customPrompt}`, completed: false },
                        { title: `Practice Basic Syntax`, resourceType: "Practice", resourceUrl: "", completed: false }
                    ]
                }))
            };
        }

        let plan;
        if (aiPlan) {
            plan = await StudyPlan.create({
                user: req.user.id,
                ...aiPlan,
                totalDays: 30,
                isActive: true
            });
        } else {
            return res.status(500).json({ success: false, message: "Plan generation failed." });
        }

        res.status(200).json({ success: true, data: plan });
    } catch (err) {
        next(err);
    }
};

exports.generateStudyPlan = async (req, res, next) => {
    try {
        let plan = await StudyPlan.findOne({ user: req.user.id, isActive: true });

        if (plan) {
            return res.status(200).json({ success: true, data: plan });
        }

        const Resume = require('../models/Resume');
        const resume = await Resume.findOne({ user: req.user.id }).sort('-createdAt');

        // Combine User Profile Skills + Resume Extracted Skills
        let knownSkills = req.user.skills || [];
        if (resume && resume.analysis && resume.analysis.extractedSkills) {
            knownSkills = [...new Set([...knownSkills, ...resume.analysis.extractedSkills])];
        }

        const userSkillsStr = knownSkills.length > 0 ? knownSkills.join(', ') : "general coding basics";
        const targetRole = req.user.targetRole || 'Software Engineer';

        const prompt = `You are an AI Career Coach building a roadmap.
Create a high-impact 30-day study plan to take a user from "${userSkillsStr}" to being job-ready for a "${targetRole}".
CRITICAL: 
- Focus on GAPS. They already know: ${userSkillsStr}. Do NOT teach them what they already know unless it's advanced depths.
- Focus on skills REQUIRED for ${targetRole} that are missing.
- Return JSON only:
{
  "title": "Mastering ${targetRole}",
  "calendar": [
    {
      "day": 1,
      "title": "Topic Name",
      "skill": "Specific Skill Tag",
      "tasks": [{"title": "Watch Intro", "resourceType": "Video", "resourceUrl": "youtube_link"}]
    }
  ]
}
Make detailed plan for Days 1-7 (Week 1) ONLY.
For Days 8-30, just provide a generic title per day without tasks.
`;

        let aiPlan;
        try {
            aiPlan = await generateCompletion(prompt, "You are a Study Coach.", true);
        } catch (error) {
            console.error("AI Generation failed", error);
            // Fallback plan
            aiPlan = {
                title: "Default Study Plan",
                calendar: [{
                    day: 1,
                    title: "Getting Started",
                    tasks: [{
                        title: "Read documentation",
                        resourceType: "Article",
                        resourceUrl: "https://react.dev",
                        completed: false
                    }]
                }]
            };
        }

        if (aiPlan && !aiPlan.error) {
            plan = await StudyPlan.create({
                user: req.user.id,
                ...aiPlan,
                totalDays: 30
            });
        }

        res.status(200).json({ success: true, data: plan });
    } catch (err) {
        next(err);
    }
};

exports.markTaskCompleted = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.id;
        const StudyPlan = require('../models/StudyPlan');

        const studyPlan = await StudyPlan.findOne({ user: userId, isActive: true });
        if (!studyPlan) return res.status(404).json({ success: false, message: "No active plan found" });

        // Iterate through days to find the task
        let taskFound = false;
        for (const day of studyPlan.calendar) {
            if (day.tasks) {
                const task = day.tasks.id(taskId);
                if (task) {
                    const { completed } = req.body;
                    // Use provided status or default to true (backward compatibility)
                    task.completed = (completed !== undefined) ? completed : true;
                    task.completedAt = task.completed ? new Date() : undefined;

                    taskFound = true;
                    break;
                }
            }
        }

        if (!taskFound) return res.status(404).json({ success: false, message: "Task not found" });

        await studyPlan.save();
        res.status(200).json({ success: true, message: "Task completed", data: studyPlan });
    } catch (err) {
        next(err);
    }
};


exports.getSkillProgress = async (req, res, next) => {
    res.status(200).json({ success: true, data: [] });
};

exports.generateTopicLesson = async (req, res, next) => {
    try {
        const { topic } = req.body;
        if (!topic) return res.status(400).json({ success: false, message: "Topic is required" });

        const prompt = `You are a Senior Technical Instructor. 
        Create a comprehensive micro-course for: "${topic}".
        
        Structure (JSON Format):
        {
            "title": "${topic}",
            "pages": [
                { "title": "1. Core Concept", "content": "Markdown explanation..." },
                { "title": "2. Visual Analogy", "content": "Markdown analogy..." },
                { "title": "3. Code Example", "content": "Markdown code block..." },
                { "title": "4. Interview Question", "content": "Markdown question & answer..." }
            ],
            "resources": [
                 { "title": "${topic} Crash Course", "type": "YouTube", "searchTerm": "${topic} crash course tutorial" },
                 { "title": "${topic} Documentation", "type": "Article", "searchTerm": "${topic} official documentation" },
                 { "title": "Best ${topic} Projects", "type": "GitHub", "searchTerm": "${topic} best practices projects" }
            ]
        }
        
        Note: For "resources", provide the 'searchTerm' so the frontend can generate a valid search link (e.g. YouTube search URL).
        Return ONLY valid JSON.`;

        let lesson;
        try {
            lesson = await generateCompletion(prompt, "You are a Tech Tutor.", true);

            // Validation: Ensure AI returned valid JSON with pages
            if (lesson.error || !lesson.pages || !Array.isArray(lesson.pages)) {
                console.error("AI returned invalid lesson structure:", lesson);
                throw new Error("Invalid AI Response");
            }

        } catch (aiErr) {
            console.error("Lesson Gen Failed (Using Fallback):", aiErr.message);
            // Fallback
            lesson = {
                title: topic,
                pages: [
                    {
                        title: "1. Overview",
                        content: `### ${topic}\n\n**Introduction**\n${topic} is a key concept in this domain. Unfortunately, our AI could not generate the full detailed lesson right now.\n\nPlease check the resources below to learn more.`
                    },
                    {
                        title: "2. Key Concepts",
                        content: `### Key Concepts\n- Fundamentals of ${topic}\n- Best Practices\n- Common Use Cases`
                    }
                ],
                resources: [
                    { title: "Search YouTube", type: "YouTube", searchTerm: `${topic} tutorial` },
                    { title: "Official Documentation", type: "Article", searchTerm: `${topic} documentation` }
                ]
            };
        }

        res.status(200).json({ success: true, data: lesson });

    } catch (err) {
        next(err);
    }
};

exports.logStudyTime = async (req, res, next) => {
    try {
        const { minutes } = req.body;
        const userId = req.user.id;

        const user = await require('../models/User').findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        // Update total time
        user.studyMinutes = (user.studyMinutes || 0) + (minutes || 0);

        // STREAK LOGIC
        updateStreak(user);

        await user.save();

        res.status(200).json({
            success: true,
            message: "Study time logged",
            streak: user.streak,
            studyMinutes: user.studyMinutes
        });

    } catch (err) {
        next(err);
    }
};

exports.logExamCompletion = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await require('../models/User').findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        // Update Exam Count
        user.dailyMcqCount = (user.dailyMcqCount || 0) + 1;

        // STREAK LOGIC (Same as logStudyTime)
        updateStreak(user);

        await user.save();

        res.status(200).json({
            success: true,
            message: "Exam logged",
            dailyMcqCount: user.dailyMcqCount,
            streak: user.streak
        });
    } catch (err) {
        next(err);
    }
};

exports.completeDay = async (req, res, next) => {
    try {
        const { dayNumber } = req.body;
        console.log(`[DEBUG] completeDay called for Day ${dayNumber}`);
        const userId = req.user.id;
        const StudyPlan = require('../models/StudyPlan');

        const studyPlan = await StudyPlan.findOne({ user: userId, isActive: true });
        if (!studyPlan) {
            console.log(`[DEBUG] No active plan found`);
            return res.status(404).json({ success: false, message: "No active plan found" });
        }

        // Coerce dayNumber to integer
        const targetDay = parseInt(dayNumber);
        const day = studyPlan.calendar.find(d => d.day === targetDay);
        if (!day) return res.status(404).json({ success: false, message: "Day not found" });

        day.completed = true;

        // Auto-advance: if we finished current day, move next
        if (studyPlan.currentDay <= targetDay) {
            const nextDay = targetDay + 1;
            console.log(`[DEBUG] Advancing currentDay from ${studyPlan.currentDay} to ${nextDay}`);
            studyPlan.currentDay = nextDay;
        }

        await studyPlan.save();

        // STREAK LOGIC
        const user = await require('../models/User').findById(userId);
        if (user) {
            const { updateStreak } = require('../utils/streakUtils');
            const oldStreak = user.streak;
            updateStreak(user);
            await user.save();
            console.log(`[DEBUG] Streak updated. Old: ${oldStreak}, New: ${user.streak}`);
        }

        res.status(200).json({ success: true, message: "Day completed", data: studyPlan });
    } catch (err) {
        console.error("completeDay Error:", err);
        next(err);
    }
};
