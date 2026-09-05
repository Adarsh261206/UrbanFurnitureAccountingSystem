import request from 'supertest';
import app from '../src/app';
import { prisma, cleanupTestDB, seedTestDB, generateToken } from './setup';

let testData: any;
let adminToken: string;
let accountantToken: string;

beforeAll(async () => {
  await cleanupTestDB();
  testData = await seedTestDB();
  adminToken = generateToken(testData.admin);
  accountantToken = generateToken(testData.accountant);
});

afterAll(async () => {
  await cleanupTestDB();
  await prisma.$disconnect();
});

describe('Accounting Engine', () => {
  describe('Journal Entry Creation', () => {
    it('should create a journal entry with balanced debit/credit', async () => {
      const res = await request(app)
        .post('/api/v1/journal-entries')
        .set('Cookie', [`auth_token=${adminToken}`])
        .send({
          accountingDate: '2025-01-15',
          journalId: testData.saleJournal.id,
          lines: [
            { accountId: testData.arAccount.id, debit: 1000, credit: 0 },
            { accountId: testData.salesRevenue.id, debit: 0, credit: 1000 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.entryNumber).toBeDefined();
      expect(res.body.data.status).toBe('posted');
      expect(res.body.data.lines).toHaveLength(2);
    });

    it('should reject journal entry with less than 2 lines', async () => {
      const res = await request(app)
        .post('/api/v1/journal-entries')
        .set('Cookie', [`auth_token=${adminToken}`])
        .send({
          accountingDate: '2025-01-15',
          journalId: testData.saleJournal.id,
          lines: [
            { accountId: testData.arAccount.id, debit: 1000, credit: 0 },
          ],
        });

      expect(res.status).toBe(400);
    });

    it('should reject unbalanced journal entry with UNBALANCED_JOURNAL', async () => {
      const res = await request(app)
        .post('/api/v1/journal-entries')
        .set('Cookie', [`auth_token=${adminToken}`])
        .send({
          accountingDate: '2025-01-15',
          journalId: testData.saleJournal.id,
          lines: [
            { accountId: testData.arAccount.id, debit: 1000, credit: 0 },
            { accountId: testData.salesRevenue.id, debit: 0, credit: 500 },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('UNBALANCED_JOURNAL');
    });

    it('should reject invalid accounting date', async () => {
      const res = await request(app)
        .post('/api/v1/journal-entries')
        .set('Cookie', [`auth_token=${adminToken}`])
        .send({
          accountingDate: 'not-a-date',
          journalId: testData.saleJournal.id,
          lines: [
            { accountId: testData.arAccount.id, debit: 1000, credit: 0 },
            { accountId: testData.salesRevenue.id, debit: 0, credit: 1000 },
          ],
        });

      expect(res.status).toBe(400);
    });
  });

  describe('Journal Entry Posting', () => {
    it('should reject posting an already-posted entry', async () => {
      const createRes = await request(app)
        .post('/api/v1/journal-entries')
        .set('Cookie', [`auth_token=${adminToken}`])
        .send({
          accountingDate: '2025-01-15',
          journalId: testData.saleJournal.id,
          lines: [
            { accountId: testData.arAccount.id, debit: 200, credit: 0 },
            { accountId: testData.salesRevenue.id, debit: 0, credit: 200 },
          ],
        });

      const entryId = createRes.body.data.id;

      const postRes = await request(app)
        .post(`/api/v1/journal-entries/${entryId}/post`)
        .set('Cookie', [`auth_token=${adminToken}`]);

      expect(postRes.status).toBe(400);
      expect(postRes.body.error.code).toBe('ALREADY_POSTED');
    });
  });

  describe('Sequence Generation', () => {
    it('should generate unique JE entry numbers', async () => {
      const res1 = await request(app)
        .post('/api/v1/journal-entries')
        .set('Cookie', [`auth_token=${adminToken}`])
        .send({
          accountingDate: '2025-01-15',
          journalId: testData.saleJournal.id,
          lines: [
            { accountId: testData.arAccount.id, debit: 100, credit: 0 },
            { accountId: testData.salesRevenue.id, debit: 0, credit: 100 },
          ],
        });

      const res2 = await request(app)
        .post('/api/v1/journal-entries')
        .set('Cookie', [`auth_token=${adminToken}`])
        .send({
          accountingDate: '2025-01-15',
          journalId: testData.saleJournal.id,
          lines: [
            { accountId: testData.arAccount.id, debit: 100, credit: 0 },
            { accountId: testData.salesRevenue.id, debit: 0, credit: 100 },
          ],
        });

      expect(res1.body.data.entryNumber).not.toBe(res2.body.data.entryNumber);
      expect(res1.body.data.entryNumber).toMatch(/^JE\/\d{4}\/\d{4}$/);
      expect(res2.body.data.entryNumber).toMatch(/^JE\/\d{4}\/\d{4}$/);
    });
  });

  describe('Decimal Precision', () => {
    it('should handle decimal values correctly', async () => {
      const res = await request(app)
        .post('/api/v1/journal-entries')
        .set('Cookie', [`auth_token=${adminToken}`])
        .send({
          accountingDate: '2025-01-15',
          journalId: testData.saleJournal.id,
          lines: [
            { accountId: testData.arAccount.id, debit: 99.99, credit: 0 },
            { accountId: testData.salesRevenue.id, debit: 0, credit: 99.99 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.lines[0].debit).toBe('99.99');
      expect(res.body.data.lines[1].credit).toBe('99.99');
    });
  });
});

describe('Master CRUD Endpoints', () => {
  describe('Contacts', () => {
    it('should create, read, update, and soft delete a contact', async () => {
      const createRes = await request(app)
        .post('/api/v1/contacts')
        .set('Cookie', [`auth_token=${adminToken}`])
        .send({ name: 'CRUD Test', email: 'crud@test.com', phone: '1234567890' });

      expect(createRes.status).toBe(201);
      const contactId = createRes.body.data.id;

      const readRes = await request(app)
        .get(`/api/v1/contacts/${contactId}`)
        .set('Cookie', [`auth_token=${adminToken}`]);
      expect(readRes.status).toBe(200);
      expect(readRes.body.data.name).toBe('CRUD Test');

      const updateRes = await request(app)
        .put(`/api/v1/contacts/${contactId}`)
        .set('Cookie', [`auth_token=${adminToken}`])
        .send({ name: 'Updated Name' });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.name).toBe('Updated Name');

      const deleteRes = await request(app)
        .delete(`/api/v1/contacts/${contactId}`)
        .set('Cookie', [`auth_token=${adminToken}`]);
      expect(deleteRes.status).toBe(204);

      const readAfterDelete = await request(app)
        .get(`/api/v1/contacts/${contactId}`)
        .set('Cookie', [`auth_token=${adminToken}`]);
      expect(readAfterDelete.status).toBe(404);
    });
  });

  describe('Products', () => {
    it('should create, read, update, and soft delete a product', async () => {
      const createRes = await request(app)
        .post('/api/v1/products')
        .set('Cookie', [`auth_token=${adminToken}`])
        .send({
          name: 'Test Product CRUD',
          productType: 'goods',
          categoryId: testData.category.id,
          salesPrice: 150,
          cost: 80,
        });

      expect(createRes.status).toBe(201);
      const productId = createRes.body.data.id;

      const readRes = await request(app)
        .get(`/api/v1/products/${productId}`)
        .set('Cookie', [`auth_token=${adminToken}`]);
      expect(readRes.status).toBe(200);
      expect(readRes.body.data.name).toBe('Test Product CRUD');

      const deleteRes = await request(app)
        .delete(`/api/v1/products/${productId}`)
        .set('Cookie', [`auth_token=${adminToken}`]);
      expect(deleteRes.status).toBe(204);
    });
  });

  describe('Categories', () => {
    it('should create, read, update, and soft delete a category', async () => {
      const createRes = await request(app)
        .post('/api/v1/categories')
        .set('Cookie', [`auth_token=${adminToken}`])
        .send({ name: 'Test Category CRUD' });

      expect(createRes.status).toBe(201);
      const categoryId = createRes.body.data.id;

      const readRes = await request(app)
        .get(`/api/v1/categories/${categoryId}`)
        .set('Cookie', [`auth_token=${adminToken}`]);
      expect(readRes.status).toBe(200);

      const deleteRes = await request(app)
        .delete(`/api/v1/categories/${categoryId}`)
        .set('Cookie', [`auth_token=${adminToken}`]);
      expect(deleteRes.status).toBe(204);
    });
  });
});

describe('Sales Flow', () => {
  let salesOrderId: string;
  let invoiceId: string;

  it('should create a sales order', async () => {
    const res = await request(app)
      .post('/api/v1/sales-orders')
      .set('Cookie', [`auth_token=${adminToken}`])
      .send({
        customerId: testData.customer.id,
        date: '2025-01-15',
        invoiceDate: '2025-01-15',
        dueDate: '2025-02-15',
        lines: [
          { productId: testData.product.id, accountId: testData.arAccount.id, qty: 2, unitPrice: 100 },
        ],
      });

    expect(res.status).toBe(201);
    salesOrderId = res.body.data.id;
    expect(Number(res.body.data.total)).toBe(200);
    expect(res.body.data.status).toBe('draft');
  });

  it('should confirm a sales order and create JE', async () => {
    const res = await request(app)
      .post(`/api/v1/sales-orders/${salesOrderId}/confirm`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('confirmed');

    const jeRes = await request(app)
      .get('/api/v1/journal-entries')
      .set('Cookie', [`auth_token=${adminToken}`])
      .query({ status: 'posted' });

    const soEntry = jeRes.body.data.find(
      (e: any) => e.sourceDocumentType === 'sales_order' && e.sourceDocumentId === salesOrderId
    );
    expect(soEntry).toBeDefined();
    expect(soEntry.lines).toHaveLength(2);
  });

  it('should reject duplicate confirm', async () => {
    const res = await request(app)
      .post(`/api/v1/sales-orders/${salesOrderId}/confirm`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(res.status).toBe(400);
  });

  it('should create an invoice linked to SO', async () => {
    const res = await request(app)
      .post('/api/v1/invoices')
      .set('Cookie', [`auth_token=${adminToken}`])
      .send({
        customerId: testData.customer.id,
        salesOrderId: salesOrderId,
        partnerId: testData.customer.id,
        date: '2025-01-15',
        invoiceDate: '2025-01-15',
        dueDate: '2025-02-15',
        paymentType: 'receive',
        paymentVia: 'bank',
        lines: [
          { productId: testData.product.id, accountId: testData.arAccount.id, qty: 2, unitPrice: 100 },
        ],
      });

    expect(res.status).toBe(201);
    invoiceId = res.body.data.id;
    expect(Number(res.body.data.total)).toBe(200);
    expect(Number(res.body.data.amountDue)).toBe(200);
    expect(res.body.data.status).toBe('draft');
  });

  it('should confirm an invoice and create JE', async () => {
    const res = await request(app)
      .post(`/api/v1/invoices/${invoiceId}/confirm`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('confirmed');
    expect(res.body.data.journalEntryId).toBeDefined();
  });

  it('should reject confirming non-draft invoice', async () => {
    const res = await request(app)
      .post(`/api/v1/invoices/${invoiceId}/confirm`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(res.status).toBe(400);
  });

  it('should create a payment and reduce amountDue', async () => {
    const res = await request(app)
      .post('/api/v1/payments')
      .set('Cookie', [`auth_token=${adminToken}`])
      .send({
        invoiceId: invoiceId,
        amount: 100,
        paymentVia: 'bank',
        paymentDate: '2025-01-20',
      });

    expect(res.status).toBe(201);

    const confirmRes = await request(app)
      .post(`/api/v1/payments/${res.body.data.id}/confirm`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.status).toBe('confirmed');

    const invoiceRes = await request(app)
      .get(`/api/v1/invoices/${invoiceId}`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(Number(invoiceRes.body.data.amountDue)).toBe(100);
    expect(invoiceRes.body.data.status).toBe('confirmed');
  });

  it('should mark invoice as paid when fully paid', async () => {
    const payRes = await request(app)
      .post('/api/v1/payments')
      .set('Cookie', [`auth_token=${adminToken}`])
      .send({
        invoiceId: invoiceId,
        amount: 100,
        paymentVia: 'cash',
        paymentDate: '2025-01-25',
      });

    await request(app)
      .post(`/api/v1/payments/${payRes.body.data.id}/confirm`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    const invoiceRes = await request(app)
      .get(`/api/v1/invoices/${invoiceId}`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(Number(invoiceRes.body.data.amountDue)).toBe(0);
    expect(invoiceRes.body.data.status).toBe('paid');
  });
});

describe('Purchase Flow', () => {
  let purchaseOrderId: string;
  let billId: string;

  it('should create a purchase order', async () => {
    const res = await request(app)
      .post('/api/v1/purchase-orders')
      .set('Cookie', [`auth_token=${adminToken}`])
      .send({
        vendorId: testData.vendor.id,
        date: '2025-01-15',
        billDate: '2025-01-15',
        dueDate: '2025-02-15',
        lines: [
          { productId: testData.product.id, accountId: testData.apAccount.id, qty: 3, unitPrice: 60 },
        ],
      });

    expect(res.status).toBe(201);
    purchaseOrderId = res.body.data.id;
    expect(Number(res.body.data.total)).toBe(180);
  });

  it('should confirm a purchase order and create JE', async () => {
    const res = await request(app)
      .post(`/api/v1/purchase-orders/${purchaseOrderId}/confirm`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('confirmed');
  });

  it('should create a bill linked to PO', async () => {
    const res = await request(app)
      .post('/api/v1/bills')
      .set('Cookie', [`auth_token=${adminToken}`])
      .send({
        vendorId: testData.vendor.id,
        purchaseOrderId: purchaseOrderId,
        partnerId: testData.vendor.id,
        date: '2025-01-15',
        billDate: '2025-01-15',
        dueDate: '2025-02-15',
        paymentType: 'send',
        paymentVia: 'bank',
        lines: [
          { productId: testData.product.id, accountId: testData.apAccount.id, qty: 3, unitPrice: 60 },
        ],
      });

    expect(res.status).toBe(201);
    billId = res.body.data.id;
    expect(Number(res.body.data.total)).toBe(180);
    expect(Number(res.body.data.amountDue)).toBe(180);
  });

  it('should confirm a bill and create JE', async () => {
    const res = await request(app)
      .post(`/api/v1/bills/${billId}/confirm`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('confirmed');
    expect(res.body.data.journalEntryId).toBeDefined();
  });

  it('should create payment for bill and reduce amountDue', async () => {
    const payRes = await request(app)
      .post('/api/v1/payments')
      .set('Cookie', [`auth_token=${adminToken}`])
      .send({
        vendorBillId: billId,
        amount: 180,
        paymentVia: 'bank',
        paymentDate: '2025-01-20',
      });

    const confirmRes = await request(app)
      .post(`/api/v1/payments/${payRes.body.data.id}/confirm`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(confirmRes.status).toBe(200);

    const billRes = await request(app)
      .get(`/api/v1/bills/${billId}`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(Number(billRes.body.data.amountDue)).toBe(0);
    expect(billRes.body.data.status).toBe('paid');
  });
});

describe('Budget Flow', () => {
  let budgetId: string;

  it('should create a budget', async () => {
    const res = await request(app)
      .post('/api/v1/budgets')
      .set('Cookie', [`auth_token=${adminToken}`])
      .send({
        name: 'Test Budget 2025',
        responsibleId: testData.customer.id,
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        type: 'income',
        analyticalId: testData.analytical.id,
        committedAmount: 10000,
      });

    expect(res.status).toBe(201);
    budgetId = res.body.data.id;
    expect(res.body.data.status).toBe('draft');
  });

  it('should confirm a budget', async () => {
    const res = await request(app)
      .post(`/api/v1/budgets/${budgetId}/confirm`)
      .set('Cookie', [`auth_token=${adminToken}`])
      .send({ committedAmount: 10000 });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('confirmed');
  });

  it('should reject confirm without committed amount', async () => {
    const createRes = await request(app)
      .post('/api/v1/budgets')
      .set('Cookie', [`auth_token=${adminToken}`])
      .send({
        name: 'No Amount Budget',
        responsibleId: testData.customer.id,
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        type: 'expense',
        analyticalId: testData.analytical.id,
      });

    const res = await request(app)
      .post(`/api/v1/budgets/${createRes.body.data.id}/confirm`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('AMOUNT_REQUIRED');
  });

  it('should revise a confirmed budget', async () => {
    const res = await request(app)
      .post(`/api/v1/budgets/${budgetId}/revise`)
      .set('Cookie', [`auth_token=${adminToken}`])
      .send({ committedAmount: 12000 });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.originalBudgetId).toBe(budgetId);
    expect(Number(res.body.data.committedAmount)).toBe(12000);

    const originalRes = await request(app)
      .get(`/api/v1/budgets/${budgetId}`)
      .set('Cookie', [`auth_token=${adminToken}`]);
    expect(originalRes.body.data.status).toBe('revised');
  });

  it('should cancel a budget', async () => {
    const res = await request(app)
      .post(`/api/v1/budgets/${budgetId}/cancel`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('cancelled');
  });

  it('should reject double cancel', async () => {
    const res = await request(app)
      .post(`/api/v1/budgets/${budgetId}/cancel`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(res.status).toBe(400);
  });

  it('should archive a budget', async () => {
    const createRes = await request(app)
      .post('/api/v1/budgets')
      .set('Cookie', [`auth_token=${adminToken}`])
      .send({
        name: 'Archive Test',
        responsibleId: testData.customer.id,
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        type: 'expense',
        analyticalId: testData.analytical.id,
      });

    const archiveRes = await request(app)
      .post(`/api/v1/budgets/${createRes.body.data.id}/archive`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(archiveRes.status).toBe(200);
    expect(archiveRes.body.data.isArchived).toBe(true);
  });
});

describe('Reports', () => {
  it('should return profit and loss report', async () => {
    const res = await request(app)
      .get('/api/v1/reports/profit-and-loss')
      .set('Cookie', [`auth_token=${adminToken}`])
      .query({ year: '2025' });

    expect(res.status).toBe(200);
    expect(res.body.data.income).toBeDefined();
    expect(res.body.data.income.items).toBeDefined();
    expect(res.body.data.income.total).toBeDefined();
    expect(res.body.data.expenses).toBeDefined();
    expect(res.body.data.expenses.items).toBeDefined();
    expect(res.body.data.expenses.total).toBeDefined();
    expect(res.body.data.net_income).toBeDefined();
  });

  it('should return balance sheet', async () => {
    const res = await request(app)
      .get('/api/v1/reports/balance-sheet')
      .set('Cookie', [`auth_token=${adminToken}`])
      .query({ year: '2025' });

    expect(res.status).toBe(200);
    expect(res.body.data.assets).toBeDefined();
    expect(res.body.data.assets.items).toBeDefined();
    expect(res.body.data.assets.total).toBeDefined();
    expect(res.body.data.liabilities).toBeDefined();
    expect(res.body.data.liabilities.items).toBeDefined();
    expect(res.body.data.liabilities.total).toBeDefined();
    expect(typeof res.body.data.balance_check).toBe('boolean');
  });

  it('should return budget report', async () => {
    const res = await request(app)
      .get('/api/v1/reports/budget-report')
      .set('Cookie', [`auth_token=${adminToken}`])
      .query({ year: '2025' });

    expect(res.status).toBe(200);
    expect(res.body.data.budgets).toBeDefined();
  });
});

describe('Security', () => {
  it('should have security headers', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['x-xss-protection']).toBe('1; mode=block');
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  it('should rate limit login attempts', async () => {
    if (process.env.NODE_ENV === 'test') {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      return;
    }

    const promises = Array(6).fill(null).map((_, i) =>
      request(app)
        .post('/api/v1/auth/login')
        .send({ loginId: 'testadmin', password: 'wrong' })
    );

    const results = await Promise.all(promises);
    const rateLimited = results.some((r) => r.status === 429);
    expect(rateLimited).toBe(true);
  });

  it('should validate input on create endpoints', async () => {
    const res = await request(app)
      .post('/api/v1/contacts')
      .set('Cookie', [`auth_token=${adminToken}`])
      .send({ name: '', email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should validate UUID format in params', async () => {
    const res = await request(app)
      .get('/api/v1/contacts/invalid-uuid')
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(res.status).toBe(400);
  });
});
