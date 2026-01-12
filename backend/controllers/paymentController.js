const instance = require('../config/razorpay');
const crypto = require('crypto');
const User = require('../models/User');

// @desc    Create Razorpay Order
// @route   POST /api/payment/create-order
// @access  Private
exports.createOrder = async (req, res, next) => {
    try {
        const { planId, amount } = req.body; // amount in smallest currency unit (paise)

        const options = {
            amount: amount * 100, // INR to paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                userId: req.user.id,
                planId: planId
            }
        };

        const order = await instance.orders.create(options);

        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        console.error("Razorpay Order Error:", error);
        res.status(500).json({ success: false, message: "Payment initiation failed" });
    }
};

// @desc    Verify Payment Signature
// @route   POST /api/payment/verify
// @access  Private
exports.verifyPayment = async (req, res, next) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planType } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        // Allow bypass for testing/simulated flows in Development
        const isDevBypass = process.env.NODE_ENV === 'development' && razorpay_signature === 'simulated_signature';

        if (expectedSignature === razorpay_signature || isDevBypass) {
            // Payment Success
            const user = await User.findById(req.user.id);

            user.isPremium = true;
            user.planType = planType || 'monthly';

            // Set dates
            const startDate = new Date();
            const expiryDate = new Date();

            if (planType === 'yearly') {
                expiryDate.setFullYear(expiryDate.getFullYear() + 1);
            } else if (planType === 'resume_boost') {
                // One time boost - maybe 7 days access or just a flag? 
                // Let's assume 30 days for simplicity or specific logic
                expiryDate.setDate(expiryDate.getDate() + 7);
            } else {
                // Monthly default
                expiryDate.setMonth(expiryDate.getMonth() + 1);
            }

            user.premiumStartDate = startDate;
            user.premiumExpiryDate = expiryDate;

            await user.save();

            res.status(200).json({
                success: true,
                message: "Payment verified. Premium unlocked!",
                user
            });
        } else {
            res.status(400).json({ success: false, message: "Invalid signature" });
        }
    } catch (error) {
        console.error("Payment Verification Error:", error);
        res.status(500).json({ success: false, message: "Verification failed" });
    }
};
