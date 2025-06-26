const express = require('express');

const router = express.Router();

router.post('/', (req, res) => {
  res.status(201).json({ id: 1, status: 'stored' });
});

module.exports = router;
