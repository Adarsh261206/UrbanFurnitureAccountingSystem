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

describe('RBAC Enforcement', () => {
  describe('Contact endpoints', () => {
    it('admin should be able to create contacts', async () => {
      const res = await request(app)
        .post('/api/v1/contacts')
        .set('Cookie', [`auth_token=${adminToken}`])
        .send({ name: 'Admin Contact', email: 'admincontact@test.com' });

      expect(res.status).toBe(201);
    });

    it('accountant should be able to create contacts', async () => {
      const res = await request(app)
        .post('/api/v1/contacts')
        .set('Cookie', [`auth_token=${accountantToken}`])
        .send({ name: 'Accountant Contact', email: 'accountantcontact@test.com' });

      expect(res.status).toBe(201);
    });

    it('user should NOT be able to create contacts', async () => {
      const res = await request(app)
        .post('/api/v1/contacts')
        .set('Cookie', [`auth_token=${userToken}`])
        .send({ name: 'User Contact', email: 'usercontact@test.com' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('user should be able to read contacts', async () => {
      const res = await request(app)
        .get('/api/v1/contacts')
        .set('Cookie', [`auth_token=${userToken}`]);

      expect(res.status).toBe(200);
    });

    it('user should NOT be able to update contacts', async () => {
      const contact = await prisma.contact.findFirst();
      if (!contact) return;

      const res = await request(app)
        .put(`/api/v1/contacts/${contact.id}`)
        .set('Cookie', [`auth_token=${userToken}`])
        .send({ name: 'Hacked' });

      expect(res.status).toBe(403);
    });

    it('user should NOT be able to delete contacts', async () => {
      const contact = await prisma.contact.findFirst();
      if (!contact) return;

      const res = await request(app)
        .delete(`/api/v1/contacts/${contact.id}`)
        .set('Cookie', [`auth_token=${userToken}`]);

      expect(res.status).toBe(403);
    });
  });

  describe('Chart of Accounts endpoints', () => {
    it('user should NOT be able to access COA', async () => {
      const res = await request(app)
        .get('/api/v1/chart-of-accounts')
        .set('Cookie', [`auth_token=${userToken}`]);

      expect(res.status).toBe(403);
    });

    it('admin should be able to access COA', async () => {
      const res = await request(app)
        .get('/api/v1/chart-of-accounts')
        .set('Cookie', [`auth_token=${adminToken}`]);

      expect(res.status).toBe(200);
    });
  });

  describe('Journal Entries endpoints', () => {
    it('user should NOT be able to access journal entries', async () => {
      const res = await request(app)
        .get('/api/v1/journal-entries')
        .set('Cookie', [`auth_token=${userToken}`]);

      expect(res.status).toBe(403);
    });

    it('accountant should be able to access journal entries', async () => {
      const res = await request(app)
        .get('/api/v1/journal-entries')
        .set('Cookie', [`auth_token=${accountantToken}`]);

      expect(res.status).toBe(200);
    });
  });

  describe('Budget endpoints', () => {
    it('user should NOT be able to access budgets', async () => {
      const res = await request(app)
        .get('/api/v1/budgets')
        .set('Cookie', [`auth_token=${userToken}`]);

      expect(res.status).toBe(403);
    });

    it('accountant should be able to access budgets', async () => {
      const res = await request(app)
        .get('/api/v1/budgets')
        .set('Cookie', [`auth_token=${accountantToken}`]);

      expect(res.status).toBe(200);
    });
  });

  describe('Payment endpoints', () => {
    it('user should NOT be able to access payments', async () => {
      const res = await request(app)
        .get('/api/v1/payments')
        .set('Cookie', [`auth_token=${userToken}`]);

      expect(res.status).toBe(403);
    });
  });

  describe('Dashboard endpoints', () => {
    it('all roles should be able to access dashboard', async () => {
      const adminRes = await request(app)
        .get('/api/v1/dashboard')
        .set('Cookie', [`auth_token=${adminToken}`]);
      expect(adminRes.status).toBe(200);

      const accountantRes = await request(app)
        .get('/api/v1/dashboard')
        .set('Cookie', [`auth_token=${accountantToken}`]);
      expect(accountantRes.status).toBe(200);

      const userRes = await request(app)
        .get('/api/v1/dashboard')
        .set('Cookie', [`auth_token=${userToken}`]);
      expect(userRes.status).toBe(200);
    });
  });

  describe('Unauthenticated access', () => {
    it('should reject all protected endpoints without token', async () => {
      const endpoints = [
        '/api/v1/contacts',
        '/api/v1/products',
        '/api/v1/categories',
        '/api/v1/chart-of-accounts',
        '/api/v1/journal-entries',
        '/api/v1/sales-orders',
        '/api/v1/purchase-orders',
        '/api/v1/invoices',
        '/api/v1/bills',
        '/api/v1/payments',
        '/api/v1/budgets',
        '/api/v1/dashboard',
        '/api/v1/reports/profit-and-loss',
        '/api/v1/reports/balance-sheet',
      ];

      for (const endpoint of endpoints) {
        const res = await request(app).get(endpoint);
        expect(res.status).toBe(401);
      }
    });
  });
});
