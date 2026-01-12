const express = require('express');
const { getStudyPlan, markTaskCompleted, getSkillProgress, generateStudyPlan, generateCustomStudyPlan, generateTopicLesson, updateDailyGoals } = require('../controllers/studyController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/plan', protect, getStudyPlan);
router.post('/plan/generate', protect, generateStudyPlan);
router.post('/plan/custom', protect, generateCustomStudyPlan);
router.post('/task/:taskId/complete', protect, markTaskCompleted);
router.get('/progress', protect, getSkillProgress);
router.post('/lesson', protect, generateTopicLesson);
router.post('/day/complete', protect, require('../controllers/studyController').completeDay);
router.post('/goals', protect, updateDailyGoals);

module.exports = router;
