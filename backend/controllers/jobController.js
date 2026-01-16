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

        // --- 1. PREPARE SEARCH PARAMETERS ---
        let locationInput = user.location || 'India';
        let locationQuery = locationInput;
        let isRemote = false;

        // Handle "Remote" smart logic
        if (locationInput.toLowerCase().includes('remote')) {
            isRemote = true;
            locationQuery = 'India'; // Adzuna /in/ endpoint needs a country context
        }

        // Determine Experience Level
        let experienceLevel = user.experience || (resume && resume.analysis?.experienceLevel) || 'Entry Level';
        let levelKeyword = '';
        const expLower = experienceLevel.toLowerCase();

        if (expLower.includes('intern')) levelKeyword = 'Intern';
        else if (expLower.includes('entry') || expLower.includes('fresher') || expLower.includes('junior')) levelKeyword = 'Junior';
        else if (expLower.includes('senior') || expLower.includes('lead')) levelKeyword = 'Senior';
        else if (expLower.includes('mid')) levelKeyword = 'Mid Level';

        // Base Role
        let baseQuery = user.targetRole || '';
        if (resume && resume.analysis) {
            if (!baseQuery && resume.analysis.domain) baseQuery = resume.analysis.domain;
            if (!baseQuery) baseQuery = 'Software Developer';

            // Add top skill for precision
            if (resume.analysis.extractedSkills && resume.analysis.extractedSkills.length > 0) {
                const topSkill = resume.analysis.extractedSkills[0];
                if (!baseQuery.toLowerCase().includes(topSkill.toLowerCase())) {
                    baseQuery = `${baseQuery} ${topSkill}`;
                }
            }
        } else if (!baseQuery) {
            baseQuery = 'Software Developer';
        }

        const page = req.query.page || 1;

        // --- 2. SEARCH STRATEGY (RETRY LOGIC) ---
        const searchAdzuna = async (what, where) => {
            const url = `https://api.adzuna.com/v1/api/jobs/in/search/${page}?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=15&what=${encodeURIComponent(what)}&where=${encodeURIComponent(where)}&content-type=application/json`;
            console.log(`🔎 Adzuna Search: What="${what}", Where="${where}"`);
            const response = await axios.get(url);
            return response.data.results || [];
        };

        let jobs = [];
        let searchAttempts = [];

        // Attempt 1: Strict (Role + Level + Location + Remote?)
        let query1 = levelKeyword ? `${baseQuery} ${levelKeyword}` : baseQuery;
        if (isRemote) query1 += ' Remote';
        searchAttempts.push(() => searchAdzuna(query1, locationQuery));

        // Attempt 2: Relaxed Level (Role + Location + Remote?)
        let query2 = baseQuery;
        if (isRemote) query2 += ' Remote'; // Keep Remote if requested
        searchAttempts.push(() => searchAdzuna(query2, locationQuery));

        // Attempt 3: Relaxed Location (Role only + India) - If user specified a city but found nothing
        if (locationQuery !== 'India') {
            searchAttempts.push(() => searchAdzuna(query1, 'India'));
        }

        // Attempt 4: Generic Fallback (Software Developer + India) - LAST RESORT before Mock
        // This ensures new users with no inputs still get REAL jobs, not static mocks.
        searchAttempts.push(() => searchAdzuna('Software Developer', 'India'));

        // Execute Search Strategy
        for (const attempt of searchAttempts) {
            try {
                jobs = await attempt();
                if (jobs.length > 0) break; // Found jobs!
            } catch (e) {
                console.log("   Search attempt failed:", e.message);
            }
        }

        // --- 3. RESULTS PROCESSING ---
        if (jobs.length === 0) {
            console.log("⚠️ Adzuna returned 0 jobs after all attempts. Falling back to local/mock.");
            throw new Error("No remote jobs found");
        }

        // Map Results
        jobs = jobs.map(job => {
            const uniqueKey = `${job.title}-${job.company}-${job.location}`;
            const stableId = job.id ? String(job.id) : Buffer.from(uniqueKey).toString('base64');

            return {
                _id: stableId,
                title: job.title,
                company: job.company?.display_name || 'Unknown Company',
                location: job.location?.display_name || 'Remote',
                salary: job.salary_min ? `₹${job.salary_min}` : 'Not Disclosed',
                type: job.contract_type || 'Full-time',
                description: job.description,
                applicationUrl: job.redirect_url,
                requiredSkills: [baseQuery],
                postedAt: job.created,
                matchScore: Math.floor(Math.random() * (95 - 75) + 75) // Random realistic match score
            };
        });

        // Sort by match score
        jobs.sort((a, b) => b.matchScore - a.matchScore);

        console.log(`✅ Fetched ${jobs.length} jobs.`);
        res.status(200).json({ success: true, data: jobs });

    } catch (err) {
        // Fallback Logic (Keep existing mock data fallback)
        try {
            console.error("❌ Adzuna API Failed or Empty:", err.message);
            let localJobs = await Job.find({ isActive: true }).limit(10);

            if (localJobs.length === 0) {
                localJobs = [
                    { _id: 'mock1', title: 'React Developer', company: 'Tech Corp', location: 'Remote', salary: '₹12L - ₹18L', type: 'Full-time', description: 'Fallback job.', requiredSkills: ['React', 'Node.js'], matchScore: 85, applicationUrl: 'https://linkedin.com' },
                    { _id: 'mock2', title: 'Frontend Engineer', company: 'Startup Inc', location: 'Bangalore', salary: '₹8L - ₹12L', type: 'Full-time', description: 'Fallback job.', requiredSkills: ['JavaScript', 'HTML'], matchScore: 75, applicationUrl: 'https://naukri.com' }
                ];
            }
            res.status(200).json({ success: true, data: localJobs });
        } catch (finalErr) {
            next(finalErr);
        }
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
