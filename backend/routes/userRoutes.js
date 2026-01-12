const express = require('express');
const router = express.Router();

// Placeholders
router.get('/', (req, res) => res.json({ success: true, data: [] }));

module.exports = router;
