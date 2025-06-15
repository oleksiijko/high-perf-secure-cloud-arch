const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');
const jwt = require('jsonwebtoken');
const pino = require('pino');
const pinoHttp = require('pino-http');
const { createClient } = require('redis');

const app = express();
const logger = pino();
app.use(pinoHttp({ logger }));

const redisClient = createClient({ url: process.env.REDIS_URL || 'redis://redis:6379' });
redisClient.connect().catch(err => logger.error(err));

const logFile = path.join(__dirname, '../../logs/sample_run.csv');
if (!fs.existsSync(logFile)) {
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.writeFileSync(logFile, 'timestamp,url,rt_ms,http_code\n');
}

app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', async () => {
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1e6;
    const line = `${new Date().toISOString()},${req.originalUrl},${ms.toFixed(0)},${res.statusCode}\n`;
    fs.appendFileSync(logFile, line);
    try {
      await redisClient.incr('requests');
      await redisClient.lpush('latency', ms.toFixed(2));
    } catch (e) {
      logger.error(e);
    }
  });
  next();
});

app.use(express.json());
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
app.get('/api/analytics', (req, res) => res.json({ data: [] }));
app.get('/api/metrics', async (req, res) => {
  try {
    const count = Number(await redisClient.get('requests')) || 0;
    const latencies = await redisClient.lrange('latency', 0, -1);
    const avg = latencies.length
      ? latencies.map(Number).reduce((a, b) => a + b, 0) / latencies.length
      : 0;
    res.json({ count, avgLatency: avg });
  } catch (e) {
    logger.error(e);
    res.status(500).send('error');
  }
});

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
