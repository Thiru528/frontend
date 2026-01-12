const Job = require('../models/Job');
const Resume = require('../models/Resume');
const User = require('../models/User'); // Import User
const { generateCompletion } = require('../services/aiService');
const axios = require('axios');

const ADZUNA_APP_ID = 'cbe7ae22';
const ADZUNA_APP_KEY = '239a7c17c8f9d8518cb58653ed3fa7f4';

// @desc    Get Recommended Jobs (Real-time from Adzuna)
// @route   GET /api/jobs/recommended
// @access  Private
exports.getRecommendedJobs = async (req, res, next) => {
    try {
        const resume = await Resume.findOne({ user: req.user.id }).sort('-createdAt');
        const user = await User.findById(req.user.id);

        // --- STRICT FILTERING LOGIC ---

        // 1. Location Filter
        // Use user's preferred location, or default to 'India' if not set
        const locationQuery = user.location || 'India';

        // 2. Experience/Role Filter
        // Derive level from Resume Analysis OR User Profile
        let experienceLevel = 'Entry Level'; // Default
        if (resume && resume.analysis && resume.analysis.experienceLevel) {
            experienceLevel = resume.analysis.experienceLevel;
        } else if (user.experience) {
            experienceLevel = user.experience;
        }

        // Determine keywords to append to search
        let levelKeyword = '';
        if (experienceLevel.toLowerCase().includes('intern')) levelKeyword = 'Intern';
        else if (experienceLevel.toLowerCase().includes('entry') || experienceLevel.toLowerCase().includes('junior')) levelKeyword = 'Junior';
        else if (experienceLevel.toLowerCase().includes('senior') || experienceLevel.toLowerCase().includes('lead')) levelKeyword = 'Senior';
        else if (experienceLevel.toLowerCase().includes('mid')) levelKeyword = 'Mid Level';

        // 3. Construct Search Query
        let baseQuery = 'software developer';
        if (resume && resume.analysis && resume.analysis.extractedSkills && resume.analysis.extractedSkills.length > 0) {
            // Take top skill + level for very specific match
            // e.g., "Java Intern" or "React Senior"
            const topSkill = resume.analysis.extractedSkills[0];
            baseQuery = topSkill;
        }

        const finalQuery = levelKeyword ? `${baseQuery} ${levelKeyword}` : baseQuery;

        console.log(`🔍 Strict Job Search: Query="${finalQuery}", Location="${locationQuery}"`);

        const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=15&what=${encodeURIComponent(finalQuery)}&where=${encodeURIComponent(locationQuery)}&content-type=application/json`;

        let jobs = [];

        try {
            const response = await axios.get(adzunaUrl);
            const adzunaJobs = response.data.results || [];

            // Map Adzuna results to our Job Schema
            jobs = adzunaJobs.map(job => ({
                _id: job.id || String(Math.random()), // Use Adzuna ID or random
                title: job.title,
                company: job.company?.display_name || 'Unknown Company',
                location: job.location?.display_name || 'Remote',
                salary: job.salary_min ? `₹${job.salary_min}` : 'Not Disclosed',
                type: job.contract_type || 'Full-time',
                description: job.description,
                applicationUrl: job.redirect_url, // Vital for "Apply Now"
                requiredSkills: [baseQuery], // Adzuna doesn't give skills list, so use query
                postedAt: job.created,
                matchScore: 0 // Will calculate below
            }));

            console.log(`✅ Fetched ${jobs.length} jobs from Adzuna.`);

        } catch (apiError) {
            console.error("❌ Adzuna API Failed:", apiError.message);
            // Fallback to local DB jobs if API fails
            jobs = await Job.find({ isActive: true }).limit(10);
        }

        // Calculate Match Score (Mock logic for external jobs)
        if (resume && resume.analysis) {
            jobs = jobs.map(job => {
                // Random realistic score for demo feeling
                job.matchScore = Math.floor(Math.random() * (95 - 70) + 70);
                return job;
            });
            // Sort by match score
            jobs.sort((a, b) => b.matchScore - a.matchScore);
        }

        res.status(200).json({
            success: true,
            data: jobs
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get Job Match Score
// @route   GET /api/jobs/match-score/:id
// @access  Private
exports.getJobMatchScore = async (req, res, next) => {
    try {
        const job = await Job.findById(req.params.id);
        const resume = await Resume.findOne({ user: req.user.id }).sort('-createdAt'); // Latest resume

        if (!job || !resume || !resume.resumeText) {
            return res.status(404).json({ success: false, message: 'Job or Resume text not found' });
        }

        const prompt = `You are a Recruiter.
Calculate a match percentage (0-100) between the Job and Resume.
Identify missing skills.
Return JSON:
{
  "matchPercentage": 85,
  "missingSkills": ["Skill A", "Skill B"],
  "explanation": "Reasoning..."
}

Job: ${job.title} - ${job.description} - Skills: ${job.requiredSkills.join(', ')}
Resume: ${resume.resumeText.substring(0, 5000)}
`;

        const result = await generateCompletion(prompt, "You are a Job Matcher.", true);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get Missing Skills (Simplified version of match)
// @route   GET /api/jobs/missing-skills/:id
// @access  Private
exports.getMissingSkills = async (req, res, next) => {
    // Reuse match logic or simplified
    req.url = `/match-score/${req.params.id}`;
    exports.getJobMatchScore(req, res, next);
};
