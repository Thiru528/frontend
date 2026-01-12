const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    skillName: {
        type: String,
        required: true
    },
    category: String, // "Programming", "Framework", "Database", etc.
    proficiency: {
        type: Number,
        default: 0
    }, // 0-100
    confidence: {
        type: Number,
        default: 0
    }, // 0-100
    testsCompleted: {
        type: Number,
        default: 0
    },
    studyHours: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Skill', SkillSchema);
