const Exam = require('../models/Exam');
const Skill = require('../models/Skill');
const { generateCompletion } = require('../services/aiService');

const QuestionBank = require('../models/QuestionBank');

exports.getExamQuestions = async (req, res, next) => {
    try {
        const { skillId } = req.params;
        let validSkillId = skillId;
        // FIX: Ensure count is an Integer for MongoDB $sample aggregation
        const count = parseInt(req.query.count) || 10;

        // If generic or random, PRIORITY: Resume Skills -> Target Role
        if (!validSkillId || validSkillId === 'General' || validSkillId === 'Random') {
            const Resume = require('../models/Resume');
            const resume = await Resume.findOne({ user: req.user.id }).sort('-createdAt');
            const user = await require('../models/User').findById(req.user.id);

            // PRIORITY 1: Check User Profile Skills (e.g. from Signup or Resume Sync)
            let candidateSkills = user.skills || [];

            // PRIORITY 2: Check Resume Analysis directly if profile is empty
            if (candidateSkills.length === 0 && resume && resume.analysis) {
                candidateSkills = [
                    ...(resume.analysis.extractedSkills || []),
                    ...(resume.analysis.strengths || [])
                ];
            }

            // FILTER: Remove generic junk
            candidateSkills = candidateSkills.filter(s => s && s !== 'Communication' && s !== 'Teamwork' && s !== 'Generic Skill');

            // 1. Pick from Candidate Skills
            if (candidateSkills.length > 0) {
                const randomSkill = candidateSkills[Math.floor(Math.random() * candidateSkills.length)];
                validSkillId = randomSkill;
                console.log(`🎯 Skill-Based Exam Topic: ${validSkillId}`);
            }
            // 2. Fallback to Target Role (e.g. "Business Analyst")
            else if (user.targetRole && user.targetRole !== 'Not specified') {
                validSkillId = `Core Interview Questions for ${user.targetRole}`;
                console.log(`🎯 Role-Based Exam Topic: ${validSkillId}`);
            } else {
                // Final Fallback
                validSkillId = 'General Software Engineering Principles';
            }
        }

        const prompt = `Generate ${count} technical multiple choice questions for "${validSkillId}".
        STYLE: GeeksForGeeks / LeetCode / Technical Interview style.
        CRITICAL: Ensure all ${count} questions are UNIQUE and DISTINCT. No duplicates.
        DIFFICULTY: Medium to Hard. Avoid simple definitions.
        content_requirements:
        - Include at least 2 questions with small code snippets to analyze.
        - Focus on "Output prediction", "Time Complexity", "Edge Cases", or "Conceptual understanding".
        - Make them challenging for a Junior/Mid-level developer.
        
        OUTPUT FORMAT: JSON Object.
        {
          "questions": [
            {
              "question": "Question text?",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctAnswer": 2, // INTEGER (0-3). MUST MATCH index of the correct string in 'options'.
              "explanation": "Detailed explanation."
            }
          ]
        }
        
        IMPORTANT: Return ONLY the JSON object.`;

        let questions = [];
        let source = 'AI';

        try {
            console.log("🤖 STARTING AI QUESTION GEN FOR:", validSkillId);
            const startTime = Date.now();

            // Try to generate unique questions with AI
            // Use strict system prompt to reduce JSON parsing errors
            const aiResponse = await generateCompletion(prompt, "You are a strict JSON API. Output ONLY valid JSON. No markdown, no commentary.", true);

            if (aiResponse.questions && Array.isArray(aiResponse.questions)) {
                questions = aiResponse.questions;
            } else if (Array.isArray(aiResponse)) {
                questions = aiResponse; // Fallback if it returned array despite prompt
            } else {
                console.warn("AI returned unexpected structure:", aiResponse);
                throw new Error("Invalid AI structure");
            }

            console.log(`✅ AI GEN COMPLETE in ${(Date.now() - startTime) / 1000}s. Count: ${questions.length}`);

            // Save to QuestionBank (Fire and Forget or Await?)
            // We want to save them for future use.
            if (questions.length > 0) {
                const savePromises = questions.map(q => {
                    return QuestionBank.findOneAndUpdate(
                        { question: q.question, skill: validSkillId.toLowerCase() },
                        {
                            skill: validSkillId.toLowerCase(),
                            question: q.question,
                            options: q.options,
                            correctAnswer: q.correctAnswer,
                            explanation: q.explanation || ''
                        },
                        { upsert: true, new: true }
                    );
                });
                await Promise.all(savePromises);
                console.log(`💾 Saved ${questions.length} questions to DB for ${validSkillId}`);
            }

        } catch (aiError) {
            console.error("AI Generation failed/time-out. Attempting DB Fallback...", aiError.message);
            source = 'DB_FALLBACK';

            // Try to fetch from DB
            let dbQuestions = [];
            try {
                dbQuestions = await QuestionBank.aggregate([
                    { $match: { skill: validSkillId.toLowerCase() } },
                    { $sample: { size: count } }
                ]);
            } catch (dbError) {
                console.error("⚠️ DB Fallback failed:", dbError.message);
                dbQuestions = []; // Continue to Hard Fallback
            }

            if (dbQuestions && dbQuestions.length > 0) {
                questions = dbQuestions;
                console.log(`✅ Retrieved ${questions.length} questions from DB for ${validSkillId}`);
            } else {
                console.warn("⚠️ DB is empty for this skill. Using Hardcoded Fallback.");
                source = 'HARD_FALLBACK';
                // Fallback questions
                questions = Array(count).fill(0).map((_, i) => ({
                    question: `Fallback: What is distinct regarding concept #${i + 1} of ${validSkillId}? (AI Unavailable)`,
                    options: [
                        `Feature A${i}`,
                        `Feature B${i}`,
                        `Feature C${i}`,
                        `Correct Feature D${i}`
                    ],
                    correctAnswer: 3,
                    explanation: "This is a placeholder explanation for offline mode."
                }));
            }
        }

        // Assign IDs
        questions = questions.map((q, i) => ({
            id: q._id || `q_${Date.now()}_${i}`,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation
        }));

        res.status(200).json({
            success: true,
            data: {
                skill: validSkillId,
                questions: questions,
                duration: 300,
                totalQuestions: questions.length,
                source: source
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.submitExamAnswers = async (req, res, next) => {
    try {
        console.log("📝 SUBMIT EXAM RECEIVED:", req.body);
        const { score, skill, passed } = req.body;
        const userId = req.user.id;

        if (!skill) {
            console.error("❌ SUBMIT EXAM ERROR: Missing skill name");
            return res.status(400).json({ success: false, message: 'Skill name is required' });
        }

        // Update User Skill
        let userSkill = await Skill.findOne({ user: userId, skillName: skill });

        if (!userSkill) {
            console.log("Creating new skill record for:", skill);
            userSkill = await Skill.create({
                user: userId,
                skillName: skill,
                confidence: score,
                testsCompleted: 1
            });
        } else {
            console.log("Updating existing skill record for:", skill);
            // Update confidence (weighted average)
            const newConfidence = Math.round((userSkill.confidence + score) / 2);
            userSkill.confidence = newConfidence;
            userSkill.testsCompleted += 1;
            await userSkill.save();
        }

        // Save detailed Exam Record
        await Exam.create({
            user: userId,
            skill: skill,
            score: score,
            passed: passed,
            totalQuestions: 10, // Default or pass from frontend if available
            correctAnswersCount: Math.round((score / 100) * 10), // Approximate
            // questions: [] // We don't have full Q&A from this endpoint yet, but tracking score is key
        });

        console.log("✅ EXAM SUBMIT SAVED:", userSkill._id);
        res.status(200).json({ success: true, data: userSkill });
    } catch (err) {
        console.error("❌ EXAM SUBMIT CONTROLLER ERROR:", err);
        // Don't crash, just return error
        res.status(500).json({ success: false, message: 'Failed to save exam results' });
    }
};

exports.getExamResults = async (req, res, next) => {
    try {
        const exams = await Exam.find({ user: req.user.id })
            .sort('-completedAt')
            .limit(20);

        res.status(200).json({
            success: true,
            data: exams
        });
    } catch (err) {
        next(err);
    }
};
