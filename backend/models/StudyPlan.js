const mongoose = require('mongoose');

const StudyPlanSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    title: String,
    totalDays: Number,
    currentDay: {
        type: Number,
        default: 1
    },
    isActive: {
        type: Boolean,
        default: true
    },
    calendar: [{
        day: Number,
        title: String,
        tasks: [{
            title: String,
            resourceType: String, // "Video", "Article", "Docs"
            resourceUrl: String,
            completed: {
                type: Boolean,
                default: false
            },
            completedAt: Date
        }],
        completed: {
            type: Boolean,
            default: false
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('StudyPlan', StudyPlanSchema);
