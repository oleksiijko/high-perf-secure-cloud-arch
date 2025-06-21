const express = require('express');

const router = express.Router();

// GET /api/analytics
router.get('/', (req, res) => {
  res.json({ views: 123, likes: 45 });
});

module.exports = router;
