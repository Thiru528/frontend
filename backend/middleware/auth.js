const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Set token from Bearer token in header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            req.user = await User.findById(decoded.id);

            if (!req.user) {
                return res.status(401).json({ success: false, error: 'User no longer exists' });
            }

            next();
        } catch (err) {
            console.error(err);
            return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
    }
};

module.exports = { protect };
