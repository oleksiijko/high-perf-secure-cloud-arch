const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const { createClient } = require('redis');
const app = express();

const logger = winston.createLogger({
  transports: [new winston.transports.Console()],
});

const logFile = path.join(__dirname, '../../logs/sample_run.csv');
if (!fs.existsSync(logFile)) {
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.writeFileSync(logFile, 'timestamp,url,rt_ms,http_code\n');
}

app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1e6;
    const line = `${new Date().toISOString()},${req.originalUrl},${ms.toFixed(0)},${res.statusCode}\n`;
    fs.appendFileSync(logFile, line);
  });
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});
app.use(express.json());

let redis;
if (process.env.NODE_ENV === 'test') {
  redis = {
    incr: async () => {},
    get: async () => null,
  };
} else {
  redis = createClient({ url: process.env.REDIS_URL || 'redis://redis:6379' });
  redis.connect().catch(err => logger.error(err));
}

app.use(async (req, res, next) => {
  await redis.incr('analytics:requests');
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

app.get('/health', (req, res) => res.send('healthy'));
app.get('/api/analytics', async (req, res) => {
  const count = parseInt((await redis.get('analytics:requests')) || '0', 10);
  res.json({ requests: count });
});

module.exports = app;
if (require.main === module) {
  const certDir = process.env.CERT_DIR || path.join(__dirname, '../../certs');
  https
    .createServer(
      {
        key: fs.readFileSync(path.join(certDir, 'server.key')),
        cert: fs.readFileSync(path.join(certDir, 'server.crt')),
        ca: fs.readFileSync(path.join(certDir, 'ca.crt')),
        requestCert: true,
        rejectUnauthorized: false,
      },
      app
    )
    .listen(3000, () => logger.info('analytics-svc listening on 3000'));
}

