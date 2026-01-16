const express = require('express');
const { getDashboardData } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getDashboardData);
router.get('/activity', protect, (req, res) => res.json({ success: true, data: [] }));
router.post('/streak', protect, require('../controllers/dashboardController').updateStreak);

module.exports = router;
