const mongoose = require('mongoose');

const ChatHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    messages: [{
        role: { type: String, enum: ['user', 'assistant', 'system'] },
        content: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    context: String, // "Resume Analysis", "Study Help", etc.
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ChatHistory', ChatHistorySchema);
