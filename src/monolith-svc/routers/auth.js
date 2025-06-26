const express = require('express');

const router = express.Router();

router.post('/login', (req, res) => {
  res.json({ accessToken: 'NO_AUTH' });
});

module.exports = router;
