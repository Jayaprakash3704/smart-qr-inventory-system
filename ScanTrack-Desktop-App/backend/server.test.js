import request from 'supertest';
import { jest } from '@jest/globals';

jest.unstable_mockModule('./auth.js', () => ({
  requireAuth: (req, res, next) => {
    req.user = { uid: 'test-admin', role: 'admin' };
    next();
  },
  requireRole: () => (req, res, next) => next(),
  auth: {
    getUserByEmail: jest.fn(),
    createUser: jest.fn()
  }
}));

jest.unstable_mockModule('./bootstrap.js', () => ({
  bootstrapAdmin: jest.fn()
}));

const { default: app } = await import('./server.js');

describe('API Endpoints', () => {
  it('GET /api/health should return OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('OK');
  });

  it('GET /api/products should return 200', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });
});
