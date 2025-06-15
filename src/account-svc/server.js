const express = require('express');
const fs = require('fs');
const https = require('https');
const path = require('path');
const jwt = require('jsonwebtoken');
const pino = require('pino');
const logger = pino();
const app = express();

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
    logger.info({ url: req.originalUrl, ms, status: res.statusCode });
  });
  next();
});

app.use(express.json());

app.use((req, res, next) => {
  if (req.path === '/health') return next();
  const token = req.headers.authorization?.split(' ')[1];
  try {
    jwt.verify(token || '', 'demo-secret');
  } catch {
    return res.status(401).send('unauthorized');
  }
  next();
});

app.use((req, res, next) => {
  const indicator = "' OR 1=1";
  if (req.url.includes(indicator) || JSON.stringify(req.body).includes(indicator)) {
    logger.warn('ALERT: возможная атака');
    return res.status(403).send('forbidden');
  }
  next();
});
app.get('/health', (req, res) => res.send('healthy'));
app.get('/api/profile', (req, res) => res.json({ user: 'demo' }));

module.exports = app;
if (require.main === module) {
  const certDir = path.join(__dirname, '../../certs');
  const options = {
    key: fs.readFileSync(path.join(certDir, 'server.key')),
    cert: fs.readFileSync(path.join(certDir, 'server.crt')),
    ca: fs.readFileSync(path.join(certDir, 'ca.crt')),
    requestCert: true,
    rejectUnauthorized: false,
  };
  https.createServer(options, app).listen(3000);
}

