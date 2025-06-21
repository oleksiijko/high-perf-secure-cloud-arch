const express = require('express');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  res.json({ accessToken: 'NO_AUTH' });
});

module.exports = router;
