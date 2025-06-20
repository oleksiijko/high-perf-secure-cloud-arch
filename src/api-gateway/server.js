const express = require('express');
const fs = require('fs');
const path = require('path');
const http = require('http');
const winston = require('winston');
const { createClient } = require('redis');
const jwt = require('jsonwebtoken');

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

const policyPath = path.join(__dirname, 'policy.json');
let policies = {};
if (fs.existsSync(policyPath)) {
  policies = JSON.parse(fs.readFileSync(policyPath));
}

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

app.use((req, res, next) => {
  if (req.path === '/health') return next();
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).send('missing token');
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET || 'demo-secret');
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
app.get('/test', (req, res) => res.send('ok'));

module.exports = app;

if (require.main === module) {
  http.createServer(app)
    .listen(3000, () => logger.info('api-gateway HTTP listening on 3000'));
}
