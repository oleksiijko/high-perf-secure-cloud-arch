const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');
const jwt = require('jsonwebtoken');
const pino = require('pino');
const pinoHttp = require('pino-http');

const app = express();
const logger = pino();
app.use(pinoHttp({ logger }));
app.use(express.json());

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
  next();
});

app.use((req, res, next) => {
  const header = req.headers['authorization'] || '';
  if (!header.startsWith('Bearer ')) return res.status(401).send('missing token');
  try {
    jwt.verify(header.slice(7), process.env.JWT_SECRET || 'secret');
    next();
  } catch (err) {
    logger.warn({ err }, 'invalid token');
    res.status(401).send('invalid token');
  }
});

app.use((req, res, next) => {
  const suspicious = "' OR 1=1";
  const body = JSON.stringify(req.body || '');
  if ((req.url && req.url.includes(suspicious)) || body.includes(suspicious)) {
    logger.warn('ALERT: возможная атака');
    return res.status(403).send('forbidden');
  }
  next();
});

app.get('/health', (req, res) => res.send('healthy'));
app.post('/api/content', (req, res) => res.json({ status: 'ok' }));

const httpsOptions = {
  cert: fs.readFileSync(path.join(__dirname, 'certs', 'cert.pem')),
  key: fs.readFileSync(path.join(__dirname, 'certs', 'key.pem')),
  ca: fs.readFileSync(path.join(__dirname, 'certs', 'cert.pem')),
  requestCert: true,
  rejectUnauthorized: false,
};

module.exports = app;
if (require.main === module) {
  https.createServer(httpsOptions, app).listen(3000);
}
