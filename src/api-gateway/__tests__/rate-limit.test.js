const request = require('supertest');
process.env.REDIS_MOCK = 'true';
const app = require('../server');

test('rate limiting', async () => {
  await request(app).get('/test');
  await request(app).get('/test');
  const res = await request(app).get('/test');
  expect(res.statusCode).toBe(429);
});
