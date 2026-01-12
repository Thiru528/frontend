const express = require('express');
const { getExamQuestions, submitExamAnswers, getExamResults } = require('../controllers/examController');
const { protect } = require('../middleware/auth');
const { checkPremiumAccess } = require('../middleware/premium');

const router = express.Router();

router.get('/questions/:skillId', protect, checkPremiumAccess('mcq_limit'), getExamQuestions);
router.post('/submit', protect, submitExamAnswers);
router.get('/results', protect, getExamResults);

module.exports = router;
