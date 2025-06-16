const express = require('express');
const https = require('https');
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
  const certDir = process.env.CERT_DIR || path.join(__dirname, '../../certs');
  https.createServer(
    {
      key: fs.readFileSync(path.join(certDir, 'server.key')),
      cert: fs.readFileSync(path.join(certDir, 'server.crt')),
      ca: fs.readFileSync(path.join(certDir, 'ca.crt')),
      requestCert: true,
      rejectUnauthorized: false,
    },
    app
  ).listen(3000, () => console.log('auth-svc listening on 3000'));
}
