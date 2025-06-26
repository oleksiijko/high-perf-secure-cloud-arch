const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');

test('health endpoint', async () => {
  process.env.JWT_SECRET = 'test';
  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET);
  const res = await request(app)
    .get('/health')
    .set('Authorization', `Bearer ${token}`);
  expect(res.statusCode).toBe(200);
});
