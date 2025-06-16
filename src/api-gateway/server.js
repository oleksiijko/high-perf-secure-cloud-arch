const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');
const winston = require('winston');
const { createClient } = require('redis');

const app = express();
const logger = winston.createLogger({
  transports: [new winston.transports.Console()],
});

const WINDOW = 60; // seconds
const LIMIT = 2;  // requests per window

function createStore() {
  if (process.env.REDIS_MOCK === 'true') {
    const data = new Map();
    return {
      incr: async key => {
        const val = (data.get(key) || 0) + 1;
        data.set(key, val);
        return val;
      },
      expire: async (key, ttl) => {
        if (!data.has(key)) return;
        setTimeout(() => data.delete(key), ttl * 1000);
      },
    };
  }
  const client = createClient({ url: process.env.REDIS_URL || 'redis://redis:6379' });
  client.connect().catch(err => logger.error(err));
  return {
    incr: key => client.incr(key),
    expire: (key, ttl) => client.expire(key, ttl),
  };
}

const store = createStore();

app.use(async (req, res, next) => {
  if (req.path === '/health') return next();
  try {
    const key = `rate:${req.ip}`;
    const count = await store.incr(key);
    if (count === 1) await store.expire(key, WINDOW);
    if (count > LIMIT) return res.status(429).send('Too many requests');
  } catch (err) {
    logger.error(err);
  }
  next();
});

app.get('/health', (req, res) => res.send('healthy'));
app.get('/test', (req, res) => res.send('ok'));

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
    .listen(3000, () => logger.info('api-gateway listening on 3000'));
}
