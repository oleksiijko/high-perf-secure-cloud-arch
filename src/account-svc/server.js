const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');
const jwt = require('jsonwebtoken');
const winston = require('winston');
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

// IDS stub
app.use((req, res, next) => {
  const suspicious = /'\s*OR\s*1=1/i;
  const bodyStr = JSON.stringify(req.body || '');
  if (suspicious.test(req.url) || suspicious.test(bodyStr)) {
    logger.warn('ALERT: возможная атака');
    return res.status(403).send('Forbidden');
  }
  next();
});

// JWT auth
app.use((req, res, next) => {
  if (req.path === '/health') return next();
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).send('missing token');
  try {
    jwt.verify(token, 'demo-secret');
  } catch {
    return res.status(401).send('invalid token');
  }
  next();
});
app.get('/health', (req, res) => res.send('healthy'));
app.get('/api/profile', (req, res) => res.json({ user: 'demo' }));

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
    .listen(3000, () => logger.info('account-svc listening on 3000'));
}

