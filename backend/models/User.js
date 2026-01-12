const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    targetRole: String,
    experience: String, // "Entry Level", "Mid Level", "Senior"
    location: String,
    phone: String,
    linkedIn: String,
    github: String,
    profilePicture: String,
    skills: {
        type: [String],
        default: []
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    preferences: {
        notifications: {
            studyReminders: { type: Boolean, default: true },
            examAlerts: { type: Boolean, default: true },
            jobMatches: { type: Boolean, default: true },
            weeklyReports: { type: Boolean, default: true }
        },
        theme: { type: String, default: 'light' }
    },
    freeResumeAnalysisUsed: {
        type: Boolean,
        default: false
    },
    dailyChatCount: {
        type: Number,
        default: 0
    },
    lastChatDate: {
        type: Date
    },
    dailyMcqCount: {
        type: Number,
        default: 0
    },
    lastMcqDate: {
        type: Date
    },
    isPremium: {
        type: Boolean,
        default: false
    },
    planType: {
        type: String, // 'monthly', 'yearly', 'resume_boost'
        default: 'free'
    },
    premiumStartDate: Date,
    premiumExpiryDate: Date,
    streak: {
        type: Number,
        default: 0
    },
    lastLoginDate: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

module.exports = mongoose.model('User', UserSchema);
