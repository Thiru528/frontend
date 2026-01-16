const User = require('../models/User');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, targetRole, experience } = req.body;

        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        user = await User.create({
            name,
            email,
            password,
            targetRole,
            experience: experience || 'Entry Level' // Default fallback
        });

        sendTokenResponse(user, 201, res);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }
        next(err);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide an email and password' });
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(400).json({ success: false, message: 'Email is wrong' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Password is wrong' });
        }

        // Check for premium expiration
        if (user.isPremium && user.premiumExpiryDate && new Date() > user.premiumExpiryDate) {
            user.isPremium = false;
            user.planType = 'free';
            await user.save({ validateBeforeSave: false });
        }

        // Update Last Login
        user.lastLoginDate = Date.now();
        await user.save({ validateBeforeSave: false });

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Get current logged in user
// @route   POST /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        // Check for premium expiration
        if (user.isPremium && user.premiumExpiryDate && new Date() > user.premiumExpiryDate) {
            user.isPremium = false;
            user.planType = 'free';
            await user.save({ validateBeforeSave: false });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
    res.status(200).json({
        success: true,
        data: {}
    });
};

// @desc    Delete user account and data
// @route   DELETE /api/auth/me
// @access  Private
exports.deleteAccount = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Delete all user data
        await User.findByIdAndDelete(userId);

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = user.getSignedJwtToken();

    const expireMs = process.env.JWT_EXPIRE_MS ? parseInt(process.env.JWT_EXPIRE_MS, 10) : 30 * 24 * 60 * 60 * 1000;

    const options = {
        expires: new Date(Date.now() + expireMs),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res
        .status(statusCode)
        .json({
            success: true,
            token,
            user
        });
};
