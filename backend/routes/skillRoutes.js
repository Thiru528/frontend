const express = require('express');
const router = express.Router();

// Placeholders
router.get('/', (req, res) => res.json({ success: true, data: [] }));
router.post('/:skillId/confidence', (req, res) => res.json({ success: true }));

module.exports = router;
