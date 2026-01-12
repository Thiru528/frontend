const express = require('express');
const { getRecommendedJobs, getJobMatchScore, getMissingSkills } = require('../controllers/jobController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/recommended', protect, getRecommendedJobs);
router.get('/match-score/:id', protect, getJobMatchScore);
router.get('/missing-skills/:id', protect, getMissingSkills);

module.exports = router;
