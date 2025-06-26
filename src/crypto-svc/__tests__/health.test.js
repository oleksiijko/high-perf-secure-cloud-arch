const request = require('supertest');
const app = require('../server');

test('health endpoint', async () => {
  const res = await request(app).get('/health');
  expect(res.statusCode).toBe(200);
});
