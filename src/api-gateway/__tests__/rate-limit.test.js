const request = require('supertest');
const jwt = require('jsonwebtoken');
process.env.REDIS_MOCK = 'true';
process.env.JWT_SECRET = 'test';
const app = require('../server');

test('rate limiting', async () => {
  const token = jwt.sign({ role: 'user' }, process.env.JWT_SECRET);
  const auth = { Authorization: `Bearer ${token}` };
  await request(app).get('/test').set(auth);
  await request(app).get('/test').set(auth);
  const res = await request(app).get('/test').set(auth);
  expect(res.statusCode).toBe(429);
});
