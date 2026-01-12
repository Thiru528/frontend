const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    company: {
        type: String,
        required: true
    },
    location: String,
    salary: String,
    type: String, // "Full-time", "Part-time", "Contract"
    remote: {
        type: Boolean,
        default: false
    },
    description: String,
    requirements: [String],
    benefits: [String],
    requiredSkills: [String],
    experienceLevel: String,
    industry: String,
    externalUrl: String,
    isActive: {
        type: Boolean,
        default: true
    },
    postedDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Job', JobSchema);
