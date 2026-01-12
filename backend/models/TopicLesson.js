const mongoose = require('mongoose');

const TopicLessonSchema = new mongoose.Schema({
    topic: {
        type: String,
        required: true,
        unique: true, // One lesson per topic name
        trim: true
    },
    title: String,
    pages: [
        {
            title: String,
            content: String // Markdown content
        }
    ],
    generatedAt: {
        type: Date,
        default: Date.now
    },
    version: {
        type: Number,
        default: 1
    }
});

module.exports = mongoose.model('TopicLesson', TopicLessonSchema);
