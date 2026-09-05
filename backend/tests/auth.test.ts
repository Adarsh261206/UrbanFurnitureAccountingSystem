import request from 'supertest';
import app from '../src/app';
import { prisma, cleanupTestDB, seedTestDB, generateToken } from './setup';

let testData: any;
let adminToken: string;
let accountantToken: string;
let userToken: string;

beforeAll(async () => {
  await cleanupTestDB();
  testData = await seedTestDB();
  adminToken = generateToken(testData.admin);
  accountantToken = generateToken(testData.accountant);
  userToken = generateToken(testData.user);
});

afterAll(async () => {
  await cleanupTestDB();
  await prisma.$disconnect();
});

describe('Auth Endpoints', () => {
  describe('POST /api/v1/auth/signup', () => {
    it('should create a new user with valid data', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'New User',
          loginId: 'newuser',
          email: 'new@test.com',
          password: 'Password123',
        });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.loginId).toBe('newuser');
      expect(res.body.user.email).toBe('new@test.com');
      expect(res.body.user.role).toBe('user');
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it('should reject duplicate loginId', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'Duplicate User',
          loginId: 'testadmin',
          email: 'other@test.com',
          password: 'Password123',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('USER_EXISTS');
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'Duplicate Email',
          loginId: 'uniqueid',
          email: 'testadmin@test.com',
          password: 'Password123',
        });

      expect(res.status).toBe(409);
    });

    it('should reject invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'Bad Email',
          loginId: 'bademail',
          email: 'not-an-email',
          password: 'Password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject short password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'Short Pass',
          loginId: 'shortpass',
          email: 'short@test.com',
          password: '12345',
        });

      expect(res.status).toBe(400);
    });

    it('should set auth cookie', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'Cookie Test',
          loginId: 'cookietest',
          email: 'cookie@test.com',
          password: 'Password123',
        });

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.includes('auth_token'))).toBe(true);
    });

    it('should NOT return token in body', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          name: 'No Token',
          loginId: 'notoken',
          email: 'notoken@test.com',
          password: 'Password123',
        });

      expect(res.body.token).toBeUndefined();
      expect(res.body.accessToken).toBeUndefined();
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ loginId: 'testadmin', password: 'Admin@123' });

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.loginId).toBe('testadmin');
      expect(res.body.user.role).toBe('admin');
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ loginId: 'testadmin', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject non-existent user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ loginId: 'nonexistent', password: 'Password123' });

      expect(res.status).toBe(401);
    });

    it('should set auth cookie on login', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ loginId: 'testadmin', password: 'Admin@123' });

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.includes('auth_token'))).toBe(true);
    });

    it('should NOT return token in body', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ loginId: 'testadmin', password: 'Admin@123' });

      expect(res.body.token).toBeUndefined();
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user with valid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', [`auth_token=${adminToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.loginId).toBe('testadmin');
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', ['auth_token=invalid-token-here']);

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should clear auth cookie', async () => {
      const res = await request(app).post('/api/v1/auth/logout');

      expect(res.status).toBe(200);
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.includes('auth_token=;'))).toBe(true);
    });
  });
});
