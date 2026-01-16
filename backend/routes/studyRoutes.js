const express = require('express');
const { getStudyPlan, markTaskCompleted, getSkillProgress, generateStudyPlan, generateCustomStudyPlan, generateTopicLesson, logStudyTime, completeDay, logExamCompletion } = require('../controllers/studyController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/plan', protect, getStudyPlan);
router.post('/plan/generate', protect, generateStudyPlan);
router.post('/plan/custom', protect, generateCustomStudyPlan);
router.post('/task/:taskId/complete', protect, markTaskCompleted);
router.get('/progress', protect, getSkillProgress);
router.post('/lesson', protect, generateTopicLesson);
router.post('/day/complete', protect, completeDay);
router.post('/log-time', protect, logStudyTime);
router.post('/exam/complete', protect, logExamCompletion);

module.exports = router;
