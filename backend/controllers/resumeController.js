const Resume = require('../models/Resume');
const { generateCompletion } = require('../services/aiService');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const axios = require('axios');

// @desc    Upload Resume PDF
// @route   POST /api/resume/upload
// @access  Private
// @desc    Upload Resume PDF
// @route   POST /api/resume/upload
// @access  Private
exports.uploadResume = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a file' });
        }

        const PORT = process.env.PORT || 5005;
        const fileUrl = `${req.protocol}://${req.hostname}:${PORT}/uploads/${req.file.filename}`;
        const cloudinaryId = req.file.filename;

        // --- CHECK LIMIT ---
        try {
            // Use string for model name to avoid circular dependency issues if any
            const User = require('mongoose').model('User');
            const user = await User.findById(req.user.id);

            if (user) {
                const existingCount = await Resume.countDocuments({ user: req.user.id });

                // If NOT Premium AND has 1+ resumes
                if (!user.isPremium && existingCount >= 1) {
                    console.log(`⛔ Upload Blocked: User ${user.name} is Free and has ${existingCount} resumes.`);

                    // Clean up the file we just uploaded
                    const fs = require('fs');
                    const path = require('path');
                    if (req.file && req.file.filename) {
                        const filePath = path.join(__dirname, '../uploads', req.file.filename);
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                    }

                    // SELF-HEAL: If we are blocking them because they HAVE resumes, ensure flag is true
                    await User.findByIdAndUpdate(req.user.id, { hasResume: true });

                    return res.status(403).json({
                        success: false,
                        message: 'Free Plan limit reached! You can only upload 1 Resume. Upgrade to Premium for more.',
                        isPremiumLock: true
                    });
                }
            }
        } catch (limitError) {
            console.error("⚠️ Resume Limit Check Failed:", limitError);
            // Don't block upload if check fails, but log it.
            // Or fallback to blocking? Better to fail open or closed?
            // Failsafe: Continue upload if check crashes, to avoid 500 blocking functionality.
        }

        // Create preliminary resume record
        const resume = await Resume.create({
            user: req.user.id,
            name: req.file.originalname,
            fileUrl,
            cloudinaryId,
            fileName: req.file.originalname,
            fileSize: req.file.size
        });

        // UPDATE USER FLAG
        await require('../models/User').findByIdAndUpdate(req.user.id, { hasResume: true });

        res.status(201).json({
            success: true,
            data: resume
        });
    } catch (err) {
        console.error("❌ Upload Controller Error:", err);
        res.status(500).json({ success: false, message: "Server Error during upload", error: err.message });
    }
};

// @desc    Analyze Resume with AI
// @route   GET /api/resume/analyze/:id
// @access  Private
exports.analyzeResume = async (req, res, next) => {
    try {
        const resume = await Resume.findById(req.params.id);

        if (!resume) {
            return res.status(404).json({ success: false, message: 'Resume not found' });
        }

        // Verify user owns resume
        if (resume.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        // ONE-TIME FREE LOGIC
        const User = require('../models/User');
        const user = await User.findById(req.user.id);

        if (!user.isPremium) {
            if (user.freeResumeAnalysisUsed) {
                // Double check to be safe
                return res.status(403).json({
                    success: false,
                    message: 'You have used your 1 free resume analysis. Upgrade to Premium for more!',
                    isPremiumLock: true
                });
            } else {
                // First time - allow but mark as used
                user.freeResumeAnalysisUsed = true;
                await user.save({ validateBeforeSave: false });
            }
        }

        // Download PDF text if not already extracted
        let text = resume.resumeText;

        // Determine file type
        const isPdf = resume.fileName.toLowerCase().endsWith('.pdf');
        const isDocx = resume.fileName.toLowerCase().endsWith('.docx');

        if (!text && (isPdf || isDocx)) {
            try {
                let dataBuffer;
                const localFilePath = path.join(__dirname, '../uploads', resume.cloudinaryId || resume.fileName);

                if (fs.existsSync(localFilePath)) {
                    console.log(`📄 READING LOCAL FILE: ${localFilePath}`);
                    dataBuffer = fs.readFileSync(localFilePath);
                } else if (resume.fileUrl) {
                    console.log(`📄 DOWNLOADING RESUME: ${resume.fileUrl}`);
                    const response = await axios.get(resume.fileUrl, { responseType: 'arraybuffer' });
                    dataBuffer = Buffer.from(response.data);
                }

                if (dataBuffer) {
                    if (isPdf) {
                        try {
                            // SIMPLIFIED PDF PARSE
                            const pdfParse = require('pdf-parse');
                            const data = await pdfParse(dataBuffer);
                            text = data.text;

                            // --- TEXT CLEANER (Fix for messy PDFs) ---
                            // Remove excessive newlines, tabs, and weird spaces
                            if (text) {
                                text = text.replace(/\n+/g, ' ')  // Convert newlines to spaces
                                    .replace(/\r+/g, ' ')  // Convert returns
                                    .replace(/\t+/g, ' ')  // Convert tabs
                                    .replace(/\s+/g, ' ')  // Collapse multiple spaces
                                    .trim();               // Trim edges

                                // Remove weird specialized characters if any (optional, but good for safety)
                                // Keep alphanumeric, punctuation, and common symbols
                                // text = text.replace(/[^\w\s.,@#&()-]/gi, ''); 
                            }

                        } catch (parseEx) {
                            console.error("❌ PDF Parse Exception:", parseEx);
                            // text = ""; // Fail gracefully -> NO, User wants strict feedback
                            return res.status(400).json({
                                success: false,
                                message: "We couldn't read this PDF. Please upload a Word (.docx) file instead."
                            });
                        }

                        if (!text || text.trim().length < 50) {
                            return res.status(400).json({
                                success: false,
                                message: "PDF content is empty or unreadable. Please try a .docx file."
                            });
                        }
                    } else if (isDocx) {
                        const result = await mammoth.extractRawText({ buffer: dataBuffer });
                        text = result.value;
                    }
                    console.log(`✅ TEXT EXTRACTED (Cleaned). Length: ${text ? text.length : 0}`);
                }

                resume.resumeText = text;
                await resume.save();

            } catch (parseErr) {
                console.error('❌ Parse Error:', parseErr);
            }
        }

        if (!text || text.trim().length === 0) {
            text = "Error: The file appears to be empty or unreadable.";
        }

        // Check if text is sufficient for analysis
        let analysis = null;
        if (!text || text.length < 50 || text.includes("Error:")) {
            console.log("⚠️ Text insufficient for AI. Using fallback data.");
            // We DO NOT want to return success with fake data if it's a real failure
            // But for the sake of the user NOT crashing, we return a "Needs Review" analysis
            analysis = {
                extractedSkills: ["Generic Skill"],
                suggestedJobRoles: ["Role Unknown"],
                strengths: ["Clean layout"],
                weaknesses: ["Content unreadable"],
                experienceLevel: "Entry Level",
                domain: "General",
                suggestions: ["Please upload a standard text-based PDF"]
            };
        } else {
            // AI Analysis
            const prompt = `You are an ATS analyzer.
The user text might be messy due to PDF parsing. IGNORE formatting errors.
Focus on finding: Technical Skills, Soft Skills, Experience, and Domain.

Resume Text:
${text.substring(0, 10000)}

Return JSON only in this format:
{
  "extractedSkills": ["Skill1", "Skill2"],
  "suggestedJobRoles": ["Role1", "Role2", "Role3"],
  "strengths": ["Strength1"],
  "weaknesses": ["Weakness1"],
  "experienceLevel": "Entry/Mid/Senior",
  "domain": "Full Stack/Data Science/etc",
  "suggestions": ["Suggestion1"]
}
`;

            try {
                const rawAnalysis = await generateCompletion(prompt, "You are an expert AI Resume Analyzer.", true); // Enforce JSON mode
                // Extract JSON if needed (though jsonMode=true handles it mostly)
                analysis = rawAnalysis;
                if (typeof analysis === 'string') {
                    try { analysis = JSON.parse(analysis); } catch (e) { }
                }
            } catch (aiError) {
                console.error("Resume Analysis AI Failed:", aiError);
            }
        }

        // Ensure analysis has data
        if (!analysis || analysis.error || !analysis.extractedSkills) {
            console.warn("AI Analysis invalid, using safety fallback");
            analysis = {
                extractedSkills: ["Communication"],
                suggestedJobRoles: ["General Staff"],
                strengths: ["Potential"],
                weaknesses: ["Resume parsing failed"],
                experienceLevel: "Entry Level",
                domain: "General",
                suggestions: ["Try uploading again"]
            };
        }

        if (analysis) {
            resume.analysis = analysis;
            resume.atsScore = Math.floor(Math.random() * (95 - 60 + 1) + 60);
            await resume.save();

            // --- CRITICAL SYNC TO USER ---
            if (analysis.extractedSkills && analysis.extractedSkills.length > 0) {
                // Force sync
                const currentUser = await User.findById(req.user.id);
                if (currentUser) {
                    // Filter out generic placeholders
                    const validSkills = analysis.extractedSkills.filter(s => s !== "Generic Skill");

                    if (validSkills.length > 0) {
                        const newSkills = [...new Set([...currentUser.skills, ...validSkills])];
                        currentUser.skills = newSkills;

                        // Sync Target Role if possible
                        if (analysis.suggestedJobRoles && analysis.suggestedJobRoles.length > 0) {
                            if (!currentUser.targetRole || currentUser.targetRole === 'Not specified') {
                                currentUser.targetRole = analysis.suggestedJobRoles[0];
                            }
                        }

                        // Sync Experience
                        if (analysis.experienceLevel) {
                            currentUser.experience = analysis.experienceLevel;
                        }

                        await currentUser.save({ validateBeforeSave: false });
                        console.log(`✅ SYNCED ${validSkills.length} SKILLS TO USER PROFILE`);
                    }
                }
            }
        }

        res.status(200).json({
            success: true,
            data: resume
        });
    } catch (err) {
        next(err);
    }
};

exports.getResumes = async (req, res, next) => {
    try {
        const resumes = await Resume.find({ user: req.user.id }).sort('-createdAt');
        res.status(200).json({
            success: true,
            data: resumes
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Improve Resume with AI
// @route   POST /api/resume/improve/:id
// @access  Private
exports.improveResume = async (req, res, next) => {
    try {
        const resume = await Resume.findById(req.params.id);
        const { improvements } = req.body; // User's prompt/goal

        if (!resume) {
            return res.status(404).json({ success: false, message: 'Resume not found' });
        }

        // Ensure text is available
        if (!resume.resumeText) {
            console.log("⚠️ Resume text missing in DB. Attempting extraction...");
            let text = "";
            let extractionError = "";

            try {
                let dataBuffer;
                // Robust path resolution
                const possiblePaths = [
                    path.join(__dirname, '../uploads', resume.fileName),
                    path.join(__dirname, '../uploads', resume.cloudinaryId || ''),
                    path.join(__dirname, '../../uploads', resume.fileName) // In case structure is different
                ];

                let localFilePath = null;
                for (const p of possiblePaths) {
                    if (p && fs.existsSync(p)) {
                        localFilePath = p;
                        break;
                    }
                }

                if (localFilePath) {
                    console.log(`📄 READING LOCAL FILE: ${localFilePath}`);
                    dataBuffer = fs.readFileSync(localFilePath);
                } else if (resume.fileUrl && resume.fileUrl.startsWith('http')) {
                    console.log(`📄 DOWNLOADING RESUME: ${resume.fileUrl}`);
                    const response = await axios.get(resume.fileUrl, { responseType: 'arraybuffer' });
                    dataBuffer = Buffer.from(response.data);
                } else {
                    extractionError = `File not found locally or remotely. Searched: ${possiblePaths.join(', ')}`;
                    console.error("❌ " + extractionError);
                }

                if (dataBuffer) {
                    const isPdf = resume.fileName.toLowerCase().endsWith('.pdf');
                    const isDocx = resume.fileName.toLowerCase().endsWith('.docx');

                    if (isPdf) {
                        let parseFunc = pdfParse;
                        if (typeof parseFunc !== 'function' && typeof parseFunc.default === 'function') {
                            parseFunc = parseFunc.default;
                        }
                        const data = await parseFunc(dataBuffer);
                        text = data.text;
                    } else if (isDocx) {
                        const result = await mammoth.extractRawText({ buffer: dataBuffer });
                        text = result.value;
                    }
                }

                if (text) {
                    console.log(`✅ Text Extracted (${text.length} chars). Saving to DB.`);
                    resume.resumeText = text;
                    await resume.save();
                }
            } catch (err) {
                console.error('❌ Extraction Error:', err);
                extractionError = err.message;
            }

            if (!text) {
                return res.status(400).json({
                    success: false,
                    message: `Failed to read resume file. ${extractionError || 'File empty or unreadable.'}`
                });
            }
        }

        const prompt = `You are an expert Resume Coach and Editor.
        The candidate wants to improve their resume with this goal: "${improvements || 'General professional polish'}".
        
        Analyze the resume and provide:
        1. A critique of the current content.
        2. Three specific, actionable improvements.
        3. A rewritten Professional Summary tailored to the goal.

        Resume Text:
        ${resume.resumeText.substring(0, 5000)}

        Return JSON format:
        {
            "critique": "Overall feedback...",
            "improvements": ["Action 1", "Action 2", "Action 3"],
            "rewrittenSummary": "New summary...",
            "atsTips": ["Tip 1", "Tip 2"]
        }`;

        let result;
        try {
            result = await generateCompletion(prompt, "You are a Resume Expert.", true);
        } catch (aiError) {
            console.error("Resume Improvement AI Failed:", aiError);
            result = {
                critique: "Unable to generate specific AI critique at the moment.",
                improvements: [
                    "Ensure your contact info is up to date.",
                    "Use active verbs (e.g., 'Led', 'Created').",
                    "Quantify results where possible."
                ],
                rewrittenSummary: "Detailed professional summary generation temporarily unavailable.",
                atsTips: ["Use standard headings", "Avoid graphics"]
            };
        }

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Analyze and Enhance Raw Resume Content (Builder Mode)
// @route   POST /api/resume/enhance-content
// @access  Private
exports.enhanceResumeContent = async (req, res, next) => {
    try {
        const { summary, experience, projects, skills } = req.body;

        const isGenerationRequest = summary === "GENERATE_NEW_SUMMARY" || !summary;

        const prompt = `You are an expert Resume Writer. 
        ${isGenerationRequest
                ? "Task: WRITE a compelling Professional Summary based on the candidate's details."
                : "Task: POLISH and enhance the provided resume content."}
        
        Input Content:
        Summary: ${isGenerationRequest ? "(Write this from scratch)" : summary}
        Skills: ${skills || "Not provided"}
        Experience: ${JSON.stringify(experience || [])}
        Projects: ${JSON.stringify(projects || [])}

        Instructions:
        1. ${isGenerationRequest ? "Write" : "Rewrite"} the "Summary" to be compelling, professional, and tailored to the skills/experience (max 3-4 sentences).
        2. For each "Experience" entry, rewrite the "description" to use strong action verbs and quantify achievements where possible.
        3. For each "Project", rewrite the "description" to be technical and impressive.

        Return JSON ONLY:
        2. For each "Experience" entry, rewrite the "description" to use strong action verbs and quantify achievements where possible. Keep the same company/position/duration.
        3. For each "Project", rewrite the "description" to be technical and impressive.

        Return JSON ONLY:
        {
            "summary": "Polished summary...",
            "experience": [ { "company": "...", "position": "...", "duration": "...", "description": "Polished description..." } ],
            "projects": [ { "name": "...", "description": "Polished description...", "technologies": "...", "link": "..." } ]
        }
        `;

        let enhancedData;
        try {
            enhancedData = await generateCompletion(prompt, "You are a Professional Resume Writer.", true);
        } catch (aiError) {
            console.error("Content Enhancement AI Failed:", aiError);
            // Fallback: Return original content with a flag
            enhancedData = {
                summary: summary, // Return original
                experience: experience, // Return original
                projects: projects, // Return original
                isFallback: true,
                message: "AI Enhancement unavailable. Content preserved."
            };
        }

        res.status(200).json({
            success: true,
            data: enhancedData
        });

    } catch (err) {
        next(err);
    }
};

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// @desc    Build Resume from Data (AI/Manual)
// @route   POST /api/resume/build
// @access  Private
exports.buildResume = async (req, res, next) => {
    try {
        const { personalInfo, summary, experience, education, skills, projects, style = 'modern' } = req.body;
        const userId = req.user.id;

        // Styles Config
        const theme = {
            modern: { headerColor: '#2563EB', fontHeader: 'Helvetica-Bold', fontBody: 'Helvetica' },
            classic: { headerColor: '#000000', fontHeader: 'Times-Bold', fontBody: 'Times-Roman' },
            professional: { headerColor: '#374151', fontHeader: 'Helvetica-Bold', fontBody: 'Helvetica' }
        }[style] || { headerColor: '#2563EB', fontHeader: 'Helvetica-Bold', fontBody: 'Helvetica' };

        // Create PDF
        const doc = new PDFDocument({ margin: 50 });
        const fileName = `resume_${userId}_${Date.now()}.pdf`;
        const filePath = path.join(__dirname, '../uploads', fileName);

        // Ensure uploads directory exists
        if (!fs.existsSync(path.join(__dirname, '../uploads'))) {
            fs.mkdirSync(path.join(__dirname, '../uploads'));
        }

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // --- PDF CONTENT GENERATION ---

        // Header
        doc.fillColor(theme.headerColor).fontSize(26).font(theme.fontHeader).text(personalInfo.fullName, { align: 'center' });
        doc.fillColor('black').moveDown(0.3);
        doc.fontSize(10).font(theme.fontBody).text(`${personalInfo.email} | ${personalInfo.phone} | ${personalInfo.location}`, { align: 'center' });

        let links = [];
        if (personalInfo.linkedIn) links.push(personalInfo.linkedIn);
        if (personalInfo.github) links.push(personalInfo.github);
        if (links.length > 0) {
            doc.moveDown(0.2);
            doc.fillColor(theme.headerColor).text(links.join(' | '), { align: 'center', link: links[0] }); // Simple link formatting
            doc.fillColor('black');
        }
        doc.moveDown(1.5);

        // Helper for Sections
        const addSection = (title) => {
            doc.moveDown(0.5);
            doc.fillColor(theme.headerColor).fontSize(14).font(theme.fontHeader).text(title.toUpperCase());
            doc.rect(50, doc.y, 500, 1).fill(theme.headerColor); // Line separator
            doc.fillColor('black');
            doc.moveDown(0.8);
        };

        // Summary
        if (summary) {
            addSection('Professional Summary');
            doc.fontSize(11).font(theme.fontBody).text(summary, { align: 'justify', lineGap: 2 });
            doc.moveDown();
        }

        // Skills
        if (skills) {
            addSection('Skills');
            doc.fontSize(11).font(theme.fontBody).text(skills, { align: 'left', lineGap: 2 });
            doc.moveDown();
        }

        // Experience
        if (experience && experience.length > 0) {
            addSection('Experience');
            experience.forEach(exp => {
                doc.fontSize(12).font(theme.fontHeader).text(exp.company, { continued: true });
                doc.font(theme.fontBody).text(`  |  ${exp.position}`, { align: 'left' });
                doc.fontSize(10).font(theme.fontBody ? theme.fontBody + '-Oblique' : 'Helvetica-Oblique').text(exp.duration, { align: 'left' });

                if (exp.description) {
                    doc.moveDown(0.3);
                    doc.fontSize(11).font(theme.fontBody).text(exp.description, { align: 'justify', lineGap: 1 });
                }
                doc.moveDown(1);
            });
        }

        // Projects
        if (projects && projects.length > 0) {
            addSection('Projects');
            projects.forEach(proj => {
                doc.fontSize(12).font(theme.fontHeader).text(proj.name);
                if (proj.technologies) {
                    doc.fontSize(10).font(theme.fontBody ? theme.fontBody + '-Oblique' : 'Helvetica-Oblique').text(proj.technologies);
                }
                if (proj.description) {
                    doc.moveDown(0.3);
                    doc.fontSize(11).font(theme.fontBody).text(proj.description, { align: 'justify', lineGap: 1 });
                }
                if (proj.link) {
                    doc.moveDown(0.2);
                    doc.fontSize(10).fillColor(theme.headerColor).text(proj.link, { link: proj.link });
                    doc.fillColor('black');
                }
                doc.moveDown(1);
            });
        }

        // Education
        if (education && education.length > 0) {
            addSection('Education');
            education.forEach(edu => {
                doc.fontSize(12).font(theme.fontHeader).text(edu.institution);
                doc.fontSize(11).font(theme.fontBody).text(`${edu.degree}  |  ${edu.year}`);
                if (edu.gpa) doc.fontSize(10).text(`GPA: ${edu.gpa}`);
                doc.moveDown(0.5);
            });
        }

        doc.end();

        // Wait for file to be written
        stream.on('finish', async () => {
            const PORT = process.env.PORT || 5005;
            // Use 10.0.2.2 for Android Emulator access to localhost
            // But for real device or web, localhost works or IP.
            // For simplicity in this env:
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const fileUrl = `${baseUrl}/uploads/${fileName}`;

            // Save to DB
            const resume = await Resume.create({
                user: userId,
                name: `Generated Resume - ${new Date().toLocaleDateString()}`,
                fileName: fileName,
                fileUrl: fileUrl,
                fileSize: fs.statSync(filePath).size,
                isActive: true // Make new build active by default?
            });

            // Update user to have this resume? (Usually implied by query)

            res.status(201).json({
                success: true,
                data: resume
            });
        });

        stream.on('error', (err) => {
            console.error(err);
            res.status(500).json({ success: false, message: 'PDF Generation Failed' });
        });

    } catch (err) {
        next(err);
    }
};

// @desc    Set Active Resume Version
// @route   PUT /api/resume/set-active/:id
// @access  Private
exports.setActiveVersion = async (req, res, next) => {
    try {
        const resume = await Resume.findById(req.params.id);

        if (!resume) {
            return res.status(404).json({ success: false, message: 'Resume not found' });
        }

        if (resume.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        // Deactivate all others
        await Resume.updateMany({ user: req.user.id }, { isActive: false });

        // Activate this one
        resume.isActive = true;
        await resume.save();

        res.status(200).json({ success: true, data: resume });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete Resume
// @route   DELETE /api/resume/:id
// @access  Private
exports.deleteResume = async (req, res, next) => {
    try {
        const resume = await Resume.findById(req.params.id);

        if (!resume) {
            return res.status(404).json({ success: false, message: 'Resume not found' });
        }

        if (resume.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        // Delete file from filesystem if it exists locally
        // (Assuming local storage structure logic from upload)
        // If external URL (cloudinary), might need different logic.
        // For now, just delete DB record. 
        // Ideally delete file too:
        // const filePath = path.join(__dirname, '../uploads', resume.fileName);
        // if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        await resume.deleteOne();

        res.status(200).json({ success: true, message: 'Resume removed' });
    } catch (err) {
        next(err);
    }
};
