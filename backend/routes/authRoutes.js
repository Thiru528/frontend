const express = require('express');
const { register, login, getMe, logout, deleteAccount } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.delete('/me', protect, deleteAccount);

module.exports = router;
