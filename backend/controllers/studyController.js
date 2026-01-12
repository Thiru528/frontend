const StudyPlan = require('../models/StudyPlan');
const { generateCompletion } = require('../services/aiService');

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
            return res.status(500).json({ success: false, message: "AI generation failed, please try again." });
        }

        let plan;
        if (aiPlan && !aiPlan.error) {
            plan = await StudyPlan.create({
                user: req.user.id,
                ...aiPlan,
                totalDays: 30,
                isActive: true
            });
        } else {
            return res.status(500).json({ success: false, message: "Failed to parse AI response." });
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

        const userSkills = req.user.skills && req.user.skills.length > 0 ? req.user.skills.join(', ') : "general coding skills";

        const prompt = `You are an AI study coach.
Create a 30-day beginner-friendly study plan for a ${req.user.targetRole || 'Software Engineer'}.
The user already knows: ${userSkills}. Focus on filling gaps for the target role.
Return JSON only:
{
  "title": "30 Days from ${userSkills.substring(0, 20)}... to ${req.user.targetRole}",
  "calendar": [
    {
      "day": 1,
      "title": "Topic Name",
      "tasks": [{"title": "Watch Intro", "resourceType": "Video", "resourceUrl": "youtube_link"}]
    }
  ]
}
Make detialed plan for Days 1-7 (Week 1) ONLY.
For Days 8-30, just provide a generic title per day without tasks.
This allows fast generation.
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
    // Logic to find task in subdocument and update
    res.status(200).json({ success: true });
};

exports.completeDay = async (req, res, next) => {
    try {
        const { dayNumber } = req.body;

        let plan = await StudyPlan.findOne({ user: req.user.id, isActive: true });
        if (!plan) return res.status(404).json({ success: false, message: "No active plan found" });

        const dayIndex = plan.calendar.findIndex(d => d.day === dayNumber);
        if (dayIndex !== -1) {
            plan.calendar[dayIndex].isCompleted = true;
            await plan.save();
            return res.status(200).json({ success: true, message: `Day ${dayNumber} completed!` });
        } else {
            return res.status(400).json({ success: false, message: "Day not found in plan" });
        }
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
        } catch (aiErr) {
            console.error("Lesson Gen Failed:", aiErr);
            // Fallback
            lesson = {
                title: topic,
                pages: [
                    { title: "1. Introduction", content: `(AI Unavailable) Introduction to **${topic}**.\nPlease try again later.` }
                ],
                resources: [
                    { title: "Search YouTube", type: "YouTube", searchTerm: `${topic} tutorial` }
                ]
            };
        }

        res.status(200).json({ success: true, data: lesson });

    } catch (err) {
        next(err);
    }
};

exports.updateDailyGoals = async (req, res, next) => {
    // Placeholder - implement actual logic later if needed
    res.status(200).json({ success: true, message: "Goals updated" });
};
