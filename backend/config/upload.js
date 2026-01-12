const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log("Saving file to local storage:", uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create unique filename: resume-userid-timestamp.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    console.log(`[Upload Filter] Check: ${file.originalname} (${file.mimetype})`);

    // Allow any file type during debugging, but perform check for safety later
    // Just for now, to ensure Multer passes it through
    const allowedTypes = /pdf|doc|docx|txt|octet-stream/;

    // Check extension
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    // Check mime
    const mimetype = allowedTypes.test(file.mimetype) ||
        file.mimetype === 'application/pdf' ||
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype === 'text/plain';

    if (extname || mimetype) { // Relaxed to OR for debugging
        return cb(null, true);
    } else {
        console.error(`[Upload Filter] Rejected: ${file.mimetype}`);
        cb(new Error('Error: Resumes only (pdf, doc, docx, txt)!'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

module.exports = { upload };
