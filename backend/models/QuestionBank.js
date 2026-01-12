const mongoose = require('mongoose');

const questionBankSchema = new mongoose.Schema({
    skill: {
        type: String,
        required: true,
        index: true,
        trim: true,
        lowercase: true
    },
    question: {
        type: String,
        required: true,
        unique: true // Prevent duplicate questions for same skill? Maybe just unique text.
    },
    options: [{
        type: String,
        required: true
    }],
    correctAnswer: {
        type: Number,
        required: true
    },
    explanation: {
        type: String,
        default: ''
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard', 'Mixed'],
        default: 'Mixed'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('QuestionBank', questionBankSchema);
