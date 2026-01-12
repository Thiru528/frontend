const express = require('express');
const { uploadResume, analyzeResume, getResumes, improveResume, enhanceResumeContent, buildResume, setActiveVersion, deleteResume } = require('../controllers/resumeController');
const { protect } = require('../middleware/auth');
const { checkPremiumAccess } = require('../middleware/premium');
const { upload } = require('../config/upload');

const router = express.Router();

const uploadMiddleware = (req, res, next) => {
    upload.single('resume')(req, res, (err) => {
        if (err) {
            console.error("Multer/Cloudinary Upload Error:", err);
            return res.status(400).json({
                success: false,
                message: 'File upload failed: ' + (err.message || err)
            });
        }
        console.log("Upload Middleware - File:", req.file ? "Found" : "Missing");
        console.log("Upload Middleware - Body:", req.body);
        next();
    });
};

router.post('/upload', protect, uploadMiddleware, uploadResume);
router.get('/analyze/:id', protect, checkPremiumAccess('resume_analysis'), analyzeResume);
router.get('/versions', protect, getResumes);
router.post('/improve/:id', protect, improveResume);
router.post('/enhance-content', protect, enhanceResumeContent);
router.post('/build', protect, buildResume);
router.put('/set-active/:id', protect, setActiveVersion);
router.delete('/:id', protect, deleteResume);

module.exports = router;
