const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const auth = require('./authMiddleware');

const app = express();
app.use(express.json());
app.use(auth());

app.get('/health', (req, res) => res.send('healthy'));
app.get('/secure', (req, res) => res.json({ ok: true }));

module.exports = app;

if (require.main === module) {
  http.createServer(app)
       .listen(3000, () => logger.info('auth-svc HTTP listening on 3000'));
}
