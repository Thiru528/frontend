const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        default: 'My Resume'
    },
    fileUrl: {
        type: String,
        required: true
    },
    cloudinaryId: String,
    fileName: String,
    fileSize: Number,
    isActive: {
        type: Boolean,
        default: false
    },
    atsScore: {
        type: Number,
        default: 0
    },
    resumeText: String, // Extracted text
    analysis: {
        extractedSkills: [String],
        strengths: [String],
        weaknesses: [String],
        experienceLevel: String,
        domain: String,
        suggestions: [String]
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Resume', ResumeSchema);
