const express = require('express');
const fs = require('fs');
const path = require('path');
const http = require('http');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const crypto = require('crypto');

const app = express();
const logger = winston.createLogger({
  transports: [new winston.transports.Console()],
});

let hasAES = false;
try {
  const cpuinfo = fs.readFileSync('/proc/cpuinfo', 'utf8');
  hasAES = cpuinfo.includes(' aes ');
} catch {}
logger.info(
  hasAES
    ? 'AES-NI detected, hardware crypto enabled'
    : 'AES-NI not detected, falling back to software crypto'
);

app.use(express.json());

app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - start) / 1e6;
    logger.info(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        endpoint: req.originalUrl,
        duration_ms: Math.round(duration),
      })
    );
  });
  next();
});

app.use((req, res, next) => {
  const suspicious = /'\s*OR\s*1=1/i;
  const bodyStr = JSON.stringify(req.body || '');
  if (suspicious.test(req.url) || suspicious.test(bodyStr)) {
    logger.warn('ALERT: возможная SQL-инъекция');
    return res.status(403).send('Forbidden');
  }
  next();
});

const policyPath = path.join(__dirname, 'policy.json');
let policies = {};
if (fs.existsSync(policyPath)) {
  policies = JSON.parse(fs.readFileSync(policyPath));
}

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
  const allowed = policies[req.path];
  if (allowed && !allowed.includes(payload.role)) {
    return res.status(403).send('forbidden');
  }
  req.user = payload;
  next();
});

const ALGO = 'aes-256-gcm';
let KEY;
try {
  if (!process.env.CRYPTO_KEY) throw new Error('CRYPTO_KEY not set');
  const keyBuf = Buffer.from(process.env.CRYPTO_KEY, 'base64');
  if (keyBuf.length !== 32) throw new Error('Key must be 32 bytes');
  KEY = keyBuf;
} catch (err) {
  logger.error(`Invalid crypto key: ${err.message}`);
  KEY = crypto.randomBytes(32);
}

app.get('/health', (req, res) => res.send('healthy'));

app.post('/encrypt', (req, res) => {
  if (!req.body || typeof req.body.data !== 'string') {
    return res.status(400).send('missing data');
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  let encrypted = cipher.update(req.body.data, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const tag = cipher.getAuthTag();
  res.json({
    data: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  });
});

app.post('/decrypt', (req, res) => {
  const { data, iv, tag } = req.body || {};
  if (!data || !iv || !tag) return res.status(400).send('missing fields');
  try {
    const decipher = crypto.createDecipheriv(ALGO, KEY, Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    let decrypted = decipher.update(Buffer.from(data, 'base64'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    res.json({ data: decrypted.toString('utf8') });
  } catch {
    res.status(400).send('decrypt error');
  }
});

module.exports = app;
if (require.main === module) {
  http.createServer(app)
      .listen(3000, () => logger.info('crypto-svc listening on 3000'));
}
