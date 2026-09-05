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
          journal_id: testData.saleJournal.id,
          accounting_date: '2025-01-15',
          lines: [
            { account_id: testData.arAccount.id, debit: 1000, credit: 0 },
            { account_id: testData.salesRevenue.id, debit: 0, credit: 1000 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.entry_number).toBeDefined();
      expect(res.body.status).toBe('posted');
      expect(res.body.lines).toHaveLength(2);
    });

    it('should reject journal entry with less than 2 lines', async () => {
      const res = await request(app)
        .post('/api/v1/journal-entries')
        .set('Cookie', [`auth_token=${adminToken}`])
        .send({
          journal_id: testData.saleJournal.id,
          accounting_date: '2025-01-15',
          lines: [
            { account_id: testData.arAccount.id, debit: 1000, credit: 0 },
          ],
        });

      expect(res.status).toBe(400);
    });

    it('should reject unbalanced journal entry with UNBALANCED_JOURNAL', async () => {
      const res = await request(app)
        .post('/api/v1/journal-entries')
        .set('Cookie', [`auth_token=${adminToken}`])
        .send({
          journal_id: testData.saleJournal.id,
          accounting_date: '2025-01-15',
          lines: [
            { account_id: testData.arAccount.id, debit: 1000, credit: 0 },
            { account_id: testData.salesRevenue.id, debit: 0, credit: 500 },
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
          journal_id: testData.saleJournal.id,
          accounting_date: 'not-a-date',
          lines: [
            { account_id: testData.arAccount.id, debit: 1000, credit: 0 },
            { account_id: testData.salesRevenue.id, debit: 0, credit: 1000 },
          ],
        });

      expect(res.status).toBe(400);
    });
  });

  describe('Sequence Generation', () => {
    it('should generate unique JE entry numbers', async () => {
      const res1 = await request(app)
        .post('/api/v1/journal-entries')
        .set('Cookie', [`auth_token=${adminToken}`])
        .send({
          journal_id: testData.saleJournal.id,
          accounting_date: '2025-01-15',
          lines: [
            { account_id: testData.arAccount.id, debit: 100, credit: 0 },
            { account_id: testData.salesRevenue.id, debit: 0, credit: 100 },
          ],
        });

      const res2 = await request(app)
        .post('/api/v1/journal-entries')
        .set('Cookie', [`auth_token=${adminToken}`])
        .send({
          journal_id: testData.saleJournal.id,
          accounting_date: '2025-01-15',
          lines: [
            { account_id: testData.arAccount.id, debit: 100, credit: 0 },
            { account_id: testData.salesRevenue.id, debit: 0, credit: 100 },
          ],
        });

      expect(res1.body.entry_number).not.toBe(res2.body.entry_number);
      expect(res1.body.entry_number).toMatch(/^JE\/\d{4}\/\d{4}$/);
      expect(res2.body.entry_number).toMatch(/^JE\/\d{4}\/\d{4}$/);
    });
  });

  describe('Decimal Precision', () => {
    it('should handle decimal values correctly', async () => {
      const res = await request(app)
        .post('/api/v1/journal-entries')
        .set('Cookie', [`auth_token=${adminToken}`])
        .send({
          journal_id: testData.saleJournal.id,
          accounting_date: '2025-01-15',
          lines: [
            { account_id: testData.arAccount.id, debit: 99.99, credit: 0 },
            { account_id: testData.salesRevenue.id, debit: 0, credit: 99.99 },
          ],
        });

      expect(res.status).toBe(201);
      expect(Number(res.body.lines[0].debit)).toBe(99.99);
      expect(Number(res.body.lines[1].credit)).toBe(99.99);
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
      const contactId = createRes.body.id;
      expect(createRes.body.name).toBe('CRUD Test');

      const readRes = await request(app)
        .get(`/api/v1/contacts/${contactId}`)
        .set('Cookie', [`auth_token=${adminToken}`]);
      expect(readRes.status).toBe(200);
      expect(readRes.body.name).toBe('CRUD Test');

      const updateRes = await request(app)
        .put(`/api/v1/contacts/${contactId}`)
        .set('Cookie', [`auth_token=${adminToken}`])
        .send({ name: 'Updated Name' });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.name).toBe('Updated Name');

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
          product_type: 'goods',
          category_id: testData.category.id,
          sales_price: 150,
          cost: 80,
        });

      expect(createRes.status).toBe(201);
      const productId = createRes.body.id;
      expect(createRes.body.category_name).toBe('Test Category');

      const readRes = await request(app)
        .get(`/api/v1/products/${productId}`)
        .set('Cookie', [`auth_token=${adminToken}`]);
      expect(readRes.status).toBe(200);
      expect(readRes.body.name).toBe('Test Product CRUD');

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
      const categoryId = createRes.body.id;

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

  describe('Bare-array endpoints', () => {
    it('categories returns a bare array', async () => {
      const res = await request(app)
        .get('/api/v1/categories')
        .set('Cookie', [`auth_token=${adminToken}`]);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('analyticals returns a bare array', async () => {
      const res = await request(app)
        .get('/api/v1/analyticals')
        .set('Cookie', [`auth_token=${adminToken}`]);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('chart-of-accounts returns a bare array', async () => {
      const res = await request(app)
        .get('/api/v1/chart-of-accounts')
        .set('Cookie', [`auth_token=${adminToken}`]);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('journals returns a bare array', async () => {
      const res = await request(app)
        .get('/api/v1/journals')
        .set('Cookie', [`auth_token=${adminToken}`]);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
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
        customer_id: testData.customer.id,
        order_date: '2025-01-15',
        lines: [
          { product_id: testData.product.id, account_id: testData.arAccount.id, quantity: 2, unit_price: 100 },
        ],
      });

    expect(res.status).toBe(201);
    salesOrderId = res.body.id;
    expect(Number(res.body.total_amount)).toBe(200);
    expect(res.body.status).toBe('draft');
  });

  it('should confirm a sales order and create JE', async () => {
    const res = await request(app)
      .put(`/api/v1/sales-orders/${salesOrderId}/confirm`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('confirmed');

    const jeRes = await request(app)
      .get('/api/v1/journal-entries')
      .set('Cookie', [`auth_token=${adminToken}`])
      .query({ status: 'posted' });

    const soEntry = jeRes.body.journal_entries.find(
      (e: any) => e.reference && e.reference.includes(salesOrderId)
    );
    expect(soEntry).toBeDefined();
  });

  it('should reject duplicate confirm', async () => {
    const res = await request(app)
      .put(`/api/v1/sales-orders/${salesOrderId}/confirm`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(res.status).toBe(400);
  });

  it('should create an invoice linked to SO', async () => {
    const res = await request(app)
      .post('/api/v1/invoices')
      .set('Cookie', [`auth_token=${adminToken}`])
      .send({
        customer_id: testData.customer.id,
        sales_order_id: salesOrderId,
        invoice_date: '2025-01-15',
        due_date: '2025-02-15',
        payment_type: 'receive',
        payment_via: 'bank',
        lines: [
          { product_id: testData.product.id, account_id: testData.arAccount.id, quantity: 2, unit_price: 100 },
        ],
      });

    expect(res.status).toBe(201);
    invoiceId = res.body.id;
    expect(Number(res.body.total)).toBe(200);
    expect(Number(res.body.amount_due)).toBe(200);
    expect(res.body.status).toBe('draft');
  });

  it('should confirm an invoice and create JE', async () => {
    const res = await request(app)
      .post(`/api/v1/invoices/${invoiceId}/confirm`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('confirmed');
    expect(res.body.journal_entry_id).toBeDefined();
  });

  it('should reject confirming non-draft invoice', async () => {
    const res = await request(app)
      .post(`/api/v1/invoices/${invoiceId}/confirm`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('ALREADY_CONFIRMED');
  });

  it('should create a payment and reduce amountDue', async () => {
    const res = await request(app)
      .post('/api/v1/payments')
      .set('Cookie', [`auth_token=${adminToken}`])
      .send({
        invoice_id: invoiceId,
        amount: 100,
        payment_via: 'bank',
        payment_date: '2025-01-20',
      });

    expect(res.status).toBe(201);

    const confirmRes = await request(app)
      .post(`/api/v1/payments/${res.body.id}/confirm`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.status).toBe('confirmed');

    const invoiceRes = await request(app)
      .get(`/api/v1/invoices/${invoiceId}`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(Number(invoiceRes.body.amount_due)).toBe(100);
    expect(invoiceRes.body.status).toBe('confirmed');
  });

  it('should mark invoice as paid when fully paid', async () => {
    const payRes = await request(app)
      .post('/api/v1/payments')
      .set('Cookie', [`auth_token=${adminToken}`])
      .send({
        invoice_id: invoiceId,
        amount: 100,
        payment_via: 'cash',
        payment_date: '2025-01-25',
      });

    await request(app)
      .post(`/api/v1/payments/${payRes.body.id}/confirm`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    const invoiceRes = await request(app)
      .get(`/api/v1/invoices/${invoiceId}`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(Number(invoiceRes.body.amount_due)).toBe(0);
    expect(invoiceRes.body.status).toBe('paid');
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
        vendor_id: testData.vendor.id,
        order_date: '2025-01-15',
        lines: [
          { product_id: testData.product.id, account_id: testData.apAccount.id, quantity: 3, unit_price: 60 },
        ],
      });

    expect(res.status).toBe(201);
    purchaseOrderId = res.body.id;
    expect(Number(res.body.total_amount)).toBe(180);
  });

  it('should confirm a purchase order and create JE', async () => {
    const res = await request(app)
      .put(`/api/v1/purchase-orders/${purchaseOrderId}/confirm`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('confirmed');
  });

  it('should create a bill linked to PO', async () => {
    const res = await request(app)
      .post('/api/v1/bills')
      .set('Cookie', [`auth_token=${adminToken}`])
      .send({
        vendor_id: testData.vendor.id,
        purchase_order_id: purchaseOrderId,
        bill_date: '2025-01-15',
        due_date: '2025-02-15',
        payment_type: 'send',
        payment_via: 'bank',
        lines: [
          { product_id: testData.product.id, account_id: testData.apAccount.id, quantity: 3, unit_price: 60 },
        ],
      });

    expect(res.status).toBe(201);
    billId = res.body.id;
    expect(Number(res.body.total)).toBe(180);
    expect(Number(res.body.amount_due)).toBe(180);
  });

  it('should confirm a bill and create JE', async () => {
    const res = await request(app)
      .post(`/api/v1/bills/${billId}/confirm`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('confirmed');
    expect(res.body.journal_entry_id).toBeDefined();
  });

  it('should create payment for bill and reduce amountDue', async () => {
    const payRes = await request(app)
      .post('/api/v1/payments')
      .set('Cookie', [`auth_token=${adminToken}`])
      .send({
        vendor_bill_id: billId,
        amount: 180,
        payment_via: 'bank',
        payment_date: '2025-01-20',
      });

    const confirmRes = await request(app)
      .post(`/api/v1/payments/${payRes.body.id}/confirm`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(confirmRes.status).toBe(200);

    const billRes = await request(app)
      .get(`/api/v1/bills/${billId}`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(Number(billRes.body.amount_due)).toBe(0);
    expect(billRes.body.status).toBe('paid');
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
        responsible_id: testData.customer.id,
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        type: 'income',
        analytical_id: testData.analytical.id,
      });

    expect(res.status).toBe(201);
    budgetId = res.body.id;
    expect(res.body.status).toBe('draft');
  });

  it('should confirm a budget', async () => {
    const res = await request(app)
      .put(`/api/v1/budgets/${budgetId}/confirm`)
      .set('Cookie', [`auth_token=${adminToken}`])
      .send({ committed_amount: 10000 });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('confirmed');
  });

  it('should reject confirm without committed amount', async () => {
    const createRes = await request(app)
      .post('/api/v1/budgets')
      .set('Cookie', [`auth_token=${adminToken}`])
      .send({
        name: 'No Amount Budget',
        responsible_id: testData.customer.id,
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        type: 'expense',
        analytical_id: testData.analytical.id,
      });

    const res = await request(app)
      .put(`/api/v1/budgets/${createRes.body.id}/confirm`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('AMOUNT_REQUIRED');
  });

  it('should revise a confirmed budget', async () => {
    const res = await request(app)
      .post(`/api/v1/budgets/${budgetId}/revise`)
      .set('Cookie', [`auth_token=${adminToken}`])
      .send({ committed_amount: 12000 });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('draft');
    expect(res.body.previous_budget_id).toBe(budgetId);
    expect(Number(res.body.committed_amount)).toBe(12000);

    const originalRes = await request(app)
      .get(`/api/v1/budgets/${budgetId}`)
      .set('Cookie', [`auth_token=${adminToken}`]);
    expect(originalRes.body.status).toBe('revised');
  });

  it('should cancel a budget', async () => {
    const res = await request(app)
      .put(`/api/v1/budgets/${budgetId}/cancel`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelled');
  });

  it('should reject double cancel', async () => {
    const res = await request(app)
      .put(`/api/v1/budgets/${budgetId}/cancel`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(res.status).toBe(400);
  });

  it('should archive a budget', async () => {
    const createRes = await request(app)
      .post('/api/v1/budgets')
      .set('Cookie', [`auth_token=${adminToken}`])
      .send({
        name: 'Archive Test',
        responsible_id: testData.customer.id,
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        type: 'expense',
        analytical_id: testData.analytical.id,
      });

    const archiveRes = await request(app)
      .post(`/api/v1/budgets/${createRes.body.id}/archive`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(archiveRes.status).toBe(200);
    expect(archiveRes.body.is_archived).toBe(true);
  });
});

describe('Reports', () => {
  it('should return profit and loss report', async () => {
    const res = await request(app)
      .get('/api/v1/reports/profit-and-loss')
      .set('Cookie', [`auth_token=${adminToken}`])
      .query({ year: '2025' });

    expect(res.status).toBe(200);
    expect(res.body.income).toBeDefined();
    expect(res.body.income.items).toBeDefined();
    expect(res.body.income.total).toBeDefined();
    expect(res.body.expenses).toBeDefined();
    expect(res.body.expenses.items).toBeDefined();
    expect(res.body.expenses.total).toBeDefined();
    expect(res.body.net_income).toBeDefined();
  });

  it('should return balance sheet', async () => {
    const res = await request(app)
      .get('/api/v1/reports/balance-sheet')
      .set('Cookie', [`auth_token=${adminToken}`])
      .query({ year: '2025' });

    expect(res.status).toBe(200);
    expect(res.body.assets).toBeDefined();
    expect(res.body.assets.items).toBeDefined();
    expect(res.body.assets.total).toBeDefined();
    expect(res.body.liabilities).toBeDefined();
    expect(res.body.liabilities.items).toBeDefined();
    expect(res.body.liabilities.total).toBeDefined();
    expect(typeof res.body.balance_check).toBe('boolean');
  });

  it('should return budget report', async () => {
    const res = await request(app)
      .get('/api/v1/reports/budget-report')
      .set('Cookie', [`auth_token=${adminToken}`])
      .query({ year: '2025' });

    expect(res.status).toBe(200);
    expect(res.body.budgets).toBeDefined();
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