const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const crypto = require('crypto');

const app = express();
const logger = winston.createLogger({
  transports: [new winston.transports.Console()],
});

const policies = JSON.parse(fs.readFileSync(path.join(__dirname, 'policies.json')));
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1e6;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(0)}ms`);
  });
  next();
});
app.use(express.json());

// IDS agent
app.use((req, res, next) => {
  const suspicious = /'\s*OR\s*1=1/i;
  const bodyStr = JSON.stringify(req.body || '');
  if (suspicious.test(req.url) || suspicious.test(bodyStr)) {
    logger.warn('ALERT: возможная SQL-инъекция');
    return res.status(403).send('Forbidden');
  }
  next();
});

// JWT + ABAC
app.use((req, res, next) => {
  if (req.path === '/health') return next();
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).send('missing token');
  let payload;
  try {
    payload = jwt.verify(token, 'demo-secret');
  } catch {
    return res.status(401).send('invalid token');
  }
  const role = payload.role;
  const allowed = (policies[role] || []);
  const ok = allowed.some(p => p === '*' || req.path.startsWith(p.replace('*', '')));
  if (!ok) return res.status(403).send('forbidden');
  req.user = payload;
  next();
});

const keyHex = process.env.AES_KEY || '0000000000000000000000000000000000000000000000000000000000000000';
const key = Buffer.from(keyHex, 'hex').subarray(0, 32);

app.get('/health', (req, res) => res.send('healthy'));

app.post('/api/encrypt', (req, res) => {
  const data = String(req.body.data || '');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const out = Buffer.concat([iv, tag, enc]).toString('base64');
  res.json({ cipher: out });
});

app.post('/api/decrypt', (req, res) => {
  try {
    const buf = Buffer.from(String(req.body.cipher || ''), 'base64');
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
    res.json({ data: dec });
  } catch (err) {
    logger.error(err);
    res.status(400).send('bad cipher');
  }
});

module.exports = app;
if (require.main === module) {
  const certDir = process.env.CERT_DIR || path.join(__dirname, '../../certs');
  https.createServer({
    key: fs.readFileSync(path.join(certDir, 'server.key')),
    cert: fs.readFileSync(path.join(certDir, 'server.crt')),
    ca: fs.readFileSync(path.join(certDir, 'ca.crt')),
    requestCert: true,
    rejectUnauthorized: false,
  }, app).listen(3000, () => logger.info('crypto-svc listening on 3000'));
}
