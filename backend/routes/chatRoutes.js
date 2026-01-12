const express = require('express');
const { sendMessage, getChatHistory } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const { checkPremiumAccess } = require('../middleware/premium');

const router = express.Router();

router.post('/send', protect, checkPremiumAccess('chat'), sendMessage);
router.get('/history', protect, getChatHistory);

module.exports = router;
