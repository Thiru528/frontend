const mongoose = require('mongoose');

const ExamSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    skill: String,
    questions: [{
        question: String,
        options: [String],
        correctAnswer: Number, // Index 0-3
        userAnswer: Number, // Index 0-3
        isCorrect: Boolean,
        explanation: String
    }],
    score: Number, // 0-100
    passed: Boolean,
    totalQuestions: Number,
    correctAnswersCount: Number,
    completedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Exam', ExamSchema);
