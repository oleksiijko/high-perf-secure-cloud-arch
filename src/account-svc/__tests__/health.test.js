const request = require('supertest');
const app = require('../server');

describe('health', () => {
  it('GET /health -> 200', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
  });
});
