const express = require('express');
const fs = require('fs');
const path = require('path');
const http = require('http');
const jwt = require('jsonwebtoken');
const logger = require('winston');
logger.clear().add(new logger.transports.Console({ level: 'info' }));
const app = express();

app.get('/health', (req, res) => res.send('healthy'));

const logDir = process.env.LOG_DIR || '/app/logs';
const logFile = path.join(logDir, 'sample_run.csv');
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

app.use((req, res, next) => {
  const raw = req.url + JSON.stringify(req.body);
  if (raw.includes("' OR 1=1")) {
    logger.warn("ALERT: возможная SQL-инъекция", { raw });
    return res.status(403).send('Forbidden');
  }
  next();
});

app.use((req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send('Unauthorized');
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).send('Unauthorized');
  }
});

const policyPath = path.join(__dirname, 'policy.json');
let policies = {};
if (fs.existsSync(policyPath)) {
  policies = JSON.parse(fs.readFileSync(policyPath));
}

app.use((req, res, next) => {
  if (req.path === '/health') return next();
  const payload = req.user;
  if (!payload) return res.status(401).send('Unauthorized');
  const allowed = policies[req.path];
  if (allowed && !allowed.includes(payload.role)) {
    return res.status(403).send('forbidden');
  }
  next();
});
app.get('/api/profile', (req, res) => res.json({ user: 'demo' }));

module.exports = app;
if (require.main === module) {
  http.createServer(app)
      .listen(3000, () => logger.info('account-svc listening on 3000'));
}

