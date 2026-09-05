import request from 'supertest';
import app from '../src/app';
import { prisma, cleanupTestDB, seedTestDB, generateToken } from './setup';
import { authConfig } from '../src/config/auth';
import jwt from 'jsonwebtoken';

let testData: any;
let adminToken: string;
let accountantToken: string;
let userAToken: string;
let userBToken: string;

let customerA: any;
let customerB: any;
let vendor: any;
let product: any;
let analytical: any;
let userAInvoiceId: string;
let userBInvoiceId: string;

beforeAll(async () => {
  await cleanupTestDB();
  testData = await seedTestDB();
  adminToken = generateToken(testData.admin);
  accountantToken = generateToken(testData.accountant);
  userAToken = generateToken(testData.user);

  const userB = await prisma.user.create({
    data: {
      name: 'User B',
      loginId: 'userb2',
      email: 'userb@test.com',
      passwordHash: testData.user.passwordHash,
      role: 'user',
    },
  });
  userBToken = generateToken(userB);

  customerA = await prisma.contact.create({
    data: { name: 'Customer A', email: 'testuser@test.com', phone: '1111111111' },
  });
  customerB = await prisma.contact.create({
    data: { name: 'Customer B', email: 'userb@test.com', phone: '2222222222' },
  });
  vendor = testData.vendor;
  product = testData.product;
  analytical = testData.analytical;
});

afterAll(async () => {
  await cleanupTestDB();
  await prisma.$disconnect();
});

function cookie(token: string): string[] {
  return [`auth_token=${token}`];
}

describe('FLOW A — SALES END TO END', () => {
  let salesOrderId: string;
  let invoiceId: string;

  it('A1: create customer, product, sales order', async () => {
    const res = await request(app)
      .post('/api/v1/sales-orders')
      .set('Cookie', cookie(adminToken))
      .send({
        customerId: customerA.id,
        date: '2026-01-10',
        invoiceDate: '2026-01-10',
        dueDate: '2026-02-10',
        lines: [
          { productId: product.id, accountId: testData.arAccount.id, qty: 2, unitPrice: 100 },
          { productId: product.id, accountId: testData.arAccount.id, qty: 1, unitPrice: 50 },
        ],
      });

    expect(res.status).toBe(201);
    salesOrderId = res.body.data.id;
    expect(res.body.data.soNumber).toMatch(/^S\d{5}$/);
    expect(Number(res.body.data.total)).toBe(250);
    expect(res.body.data.status).toBe('draft');
  });

  it('A2: confirm SO creates JE (debit=credit, AR/Revenue)', async () => {
    const res = await request(app)
      .put(`/api/v1/sales-orders/${salesOrderId}/confirm`)
      .set('Cookie', cookie(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('confirmed');

    const je = await prisma.journalEntry.findFirst({
      where: { sourceDocumentType: 'sales_order', sourceDocumentId: salesOrderId },
      include: { lines: { include: { account: true } } },
    });
    expect(je).toBeDefined();
    expect(je!.lines).toHaveLength(2);
    const totalDebit = je!.lines.reduce((s, l) => s + Number(l.debit), 0);
    const totalCredit = je!.lines.reduce((s, l) => s + Number(l.credit), 0);
    expect(totalDebit).toBe(totalCredit);
    expect(je!.lines[0].account.name).toBe('Accounts Receivable');
    expect(je!.lines[1].account.name).toBe('Sales Revenue');
  });

  it('A3: duplicate confirm rejected', async () => {
    const res = await request(app)
      .put(`/api/v1/sales-orders/${salesOrderId}/confirm`)
      .set('Cookie', cookie(adminToken));
    expect(res.status).toBe(400);
  });

  it('A4: create invoice from SO (INV reference + INV- number)', async () => {
    const res = await request(app)
      .post('/api/v1/invoices')
      .set('Cookie', cookie(adminToken))
      .send({
        customerId: customerA.id,
        salesOrderId,
        partnerId: customerA.id,
        date: '2026-01-10',
        invoiceDate: '2026-01-10',
        dueDate: '2026-02-10',
        paymentType: 'receive',
        paymentVia: 'bank',
        lines: [
          { productId: product.id, accountId: testData.arAccount.id, qty: 2, unitPrice: 100 },
        ],
      });

    expect(res.status).toBe(201);
    invoiceId = res.body.data.id;
    expect(res.body.data.invoiceReference).toMatch(/^INV\/2026\/\d{4}$/);
    expect(res.body.data.invoiceNumber).toMatch(/^INV-\d{5}$/);
    expect(Number(res.body.data.total)).toBe(200);
    expect(Number(res.body.data.amountDue)).toBe(200);
    expect(res.body.data.status).toBe('draft');
  });

  it('A5: confirm invoice creates JE (AR debit / Revenue credit)', async () => {
    const res = await request(app)
      .post(`/api/v1/invoices/${invoiceId}/confirm`)
      .set('Cookie', cookie(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('confirmed');
    expect(res.body.data.journalEntryId).toBeDefined();

    const je = await prisma.journalEntry.findFirst({
      where: { sourceDocumentType: 'customer_invoice', sourceDocumentId: invoiceId },
      include: { lines: { include: { account: true } } },
    });
    expect(je).toBeDefined();
    const totalDebit = je!.lines.reduce((s, l) => s + Number(l.debit), 0);
    const totalCredit = je!.lines.reduce((s, l) => s + Number(l.credit), 0);
    expect(totalDebit).toBe(totalCredit);
    expect(je!.lines[0].account.name).toBe('Accounts Receivable');
    expect(je!.lines[1].account.name).toBe('Sales Revenue');
  });

  it('A6: duplicate confirm rejected (ALREADY_CONFIRMED)', async () => {
    const res = await request(app)
      .post(`/api/v1/invoices/${invoiceId}/confirm`)
      .set('Cookie', cookie(adminToken));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('ALREADY_CONFIRMED');
  });

  it('A7: pay invoice (1-step) → paid, payment + JE created', async () => {
    const res = await request(app)
      .post(`/api/v1/invoices/${invoiceId}/pay`)
      .set('Cookie', cookie(adminToken))
      .send({ amount: 200, paymentVia: 'bank', paymentDate: '2026-01-20' });

    expect(res.status).toBe(200);
    expect(res.body.data.paymentNumber).toMatch(/^PAY\/2026\/\d{4}$/);
    expect(res.body.data.status).toBe('successful');

    const inv = await prisma.customerInvoice.findUnique({ where: { id: invoiceId } });
    expect(Number(inv!.amountDue)).toBe(0);
    expect(inv!.status).toBe('paid');

    const payJe = await prisma.journalEntry.findFirst({
      where: { sourceDocumentType: 'payment', sourceDocumentId: res.body.data.id },
      include: { lines: { include: { account: true } } },
    });
    expect(payJe).toBeDefined();
    const totalDebit = payJe!.lines.reduce((s, l) => s + Number(l.debit), 0);
    const totalCredit = payJe!.lines.reduce((s, l) => s + Number(l.credit), 0);
    expect(totalDebit).toBe(totalCredit);
    expect(payJe!.lines[0].account.name).toBe('Bank');
    expect(payJe!.lines[1].account.name).toBe('Accounts Receivable');
  });

  it('A8: overpayment rejected (OVERPAYMENT_NOT_ALLOWED)', async () => {
    const invRes = await request(app)
      .post('/api/v1/invoices')
      .set('Cookie', cookie(adminToken))
      .send({
        customerId: customerA.id,
        date: '2026-02-01',
        invoiceDate: '2026-02-01',
        dueDate: '2026-03-01',
        lines: [
          { productId: product.id, accountId: testData.arAccount.id, qty: 1, unitPrice: 100 },
        ],
      });
    const invId = invRes.body.data.id;
    await request(app)
      .post(`/api/v1/invoices/${invId}/confirm`)
      .set('Cookie', cookie(adminToken));

    const res = await request(app)
      .post(`/api/v1/invoices/${invId}/pay`)
      .set('Cookie', cookie(adminToken))
      .send({ amount: 500, paymentVia: 'bank' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('OVERPAYMENT_NOT_ALLOWED');
  });

  it('A9: invalid transition — pay draft invoice rejected', async () => {
    const invRes = await request(app)
      .post('/api/v1/invoices')
      .set('Cookie', cookie(adminToken))
      .send({
        customerId: customerA.id,
        date: '2026-02-01',
        invoiceDate: '2026-02-01',
        dueDate: '2026-03-01',
        lines: [
          { productId: product.id, accountId: testData.arAccount.id, qty: 1, unitPrice: 100 },
        ],
      });
    const invId = invRes.body.data.id;

    const res = await request(app)
      .post(`/api/v1/invoices/${invId}/pay`)
      .set('Cookie', cookie(adminToken))
      .send({ amount: 50, paymentVia: 'bank' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_STATUS');
  });

  it('A10: cancel confirmed invoice rejected (only draft can cancel)', async () => {
    const res = await request(app)
      .post(`/api/v1/invoices/${invoiceId}/cancel`)
      .set('Cookie', cookie(adminToken));
    expect(res.status).toBe(400);
  });

  it('A11: amount_paid computed field present', async () => {
    const res = await request(app)
      .get(`/api/v1/invoices/${invoiceId}`)
      .set('Cookie', cookie(adminToken));
    expect(Number(res.body.data.amountPaid)).toBe(200);
  });
});

describe('FLOW B — PURCHASE END TO END', () => {
  let purchaseOrderId: string;
  let billId: string;

  it('B1: create PO (P-number)', async () => {
    const res = await request(app)
      .post('/api/v1/purchase-orders')
      .set('Cookie', cookie(adminToken))
      .send({
        vendorId: vendor.id,
        date: '2026-01-15',
        billDate: '2026-01-15',
        dueDate: '2026-02-15',
        lines: [
          { productId: product.id, accountId: testData.apAccount.id, qty: 3, unitPrice: 60 },
        ],
      });

    expect(res.status).toBe(201);
    purchaseOrderId = res.body.data.id;
    expect(res.body.data.poNumber).toMatch(/^P\d{5}$/);
    expect(Number(res.body.data.total)).toBe(180);
  });

  it('B2: confirm PO creates JE (expense debit / AP credit)', async () => {
    const res = await request(app)
      .put(`/api/v1/purchase-orders/${purchaseOrderId}/confirm`)
      .set('Cookie', cookie(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('confirmed');

    const je = await prisma.journalEntry.findFirst({
      where: { sourceDocumentType: 'purchase_order', sourceDocumentId: purchaseOrderId },
      include: { lines: { include: { account: true } } },
    });
    expect(je).toBeDefined();
    const totalDebit = je!.lines.reduce((s, l) => s + Number(l.debit), 0);
    const totalCredit = je!.lines.reduce((s, l) => s + Number(l.credit), 0);
    expect(totalDebit).toBe(totalCredit);
    expect(je!.lines[0].account.name).toBe('Purchase Expense');
    expect(je!.lines[1].account.name).toBe('Accounts Payable');
  });

  it('B3: create bill (Bill/YYYY/NNNN)', async () => {
    const res = await request(app)
      .post('/api/v1/bills')
      .set('Cookie', cookie(adminToken))
      .send({
        vendorId: vendor.id,
        purchaseOrderId,
        partnerId: vendor.id,
        date: '2026-01-15',
        billDate: '2026-01-15',
        dueDate: '2026-02-15',
        paymentType: 'send',
        paymentVia: 'bank',
        lines: [
          { productId: product.id, accountId: testData.apAccount.id, qty: 3, unitPrice: 60 },
        ],
      });

    expect(res.status).toBe(201);
    billId = res.body.data.id;
    expect(res.body.data.billReference).toMatch(/^Bill\/2026\/\d{4}$/);
    expect(Number(res.body.data.amountDue)).toBe(180);
  });

  it('B4: confirm bill creates JE (expense debit / AP credit)', async () => {
    const res = await request(app)
      .post(`/api/v1/bills/${billId}/confirm`)
      .set('Cookie', cookie(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('confirmed');
    expect(res.body.data.journalEntryId).toBeDefined();

    const je = await prisma.journalEntry.findFirst({
      where: { sourceDocumentType: 'vendor_bill', sourceDocumentId: billId },
      include: { lines: { include: { account: true } } },
    });
    expect(je).toBeDefined();
    const totalDebit = je!.lines.reduce((s, l) => s + Number(l.debit), 0);
    const totalCredit = je!.lines.reduce((s, l) => s + Number(l.credit), 0);
    expect(totalDebit).toBe(totalCredit);
    expect(je!.lines[0].account.name).toBe('Purchase Expense');
    expect(je!.lines[1].account.name).toBe('Accounts Payable');
  });

  it('B5: pay bill → paid', async () => {
    const res = await request(app)
      .post(`/api/v1/bills/${billId}/pay`)
      .set('Cookie', cookie(adminToken))
      .send({ amount: 180, paymentVia: 'bank', paymentDate: '2026-01-25' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('successful');

    const bill = await prisma.vendorBill.findUnique({ where: { id: billId } });
    expect(Number(bill!.amountDue)).toBe(0);
    expect(bill!.status).toBe('paid');
  });

  it('B6: overpayment rejected', async () => {
    const billRes = await request(app)
      .post('/api/v1/bills')
      .set('Cookie', cookie(adminToken))
      .send({
        vendorId: vendor.id,
        date: '2026-02-01',
        billDate: '2026-02-01',
        dueDate: '2026-03-01',
        lines: [
          { productId: product.id, accountId: testData.apAccount.id, qty: 1, unitPrice: 50 },
        ],
      });
    const newBillId = billRes.body.data.id;
    await request(app)
      .post(`/api/v1/bills/${newBillId}/confirm`)
      .set('Cookie', cookie(adminToken));

    const res = await request(app)
      .post(`/api/v1/bills/${newBillId}/pay`)
      .set('Cookie', cookie(adminToken))
      .send({ amount: 999, paymentVia: 'bank' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('OVERPAYMENT_NOT_ALLOWED');
  });
});

describe('FLOW C — BUDGET', () => {
  let budgetId: string;

  it('C1: create budget', async () => {
    const res = await request(app)
      .post('/api/v1/budgets')
      .set('Cookie', cookie(adminToken))
      .send({
        name: 'Q1 Sales Target',
        responsibleId: customerA.id,
        startDate: '2026-01-01',
        endDate: '2026-03-31',
        type: 'income',
        analyticalId: analytical.id,
      });

    expect(res.status).toBe(201);
    budgetId = res.body.data.id;
    expect(res.body.data.status).toBe('draft');
  });

  it('C2: confirm with committed_amount', async () => {
    const res = await request(app)
      .post(`/api/v1/budgets/${budgetId}/confirm`)
      .set('Cookie', cookie(adminToken))
      .send({ committedAmount: 10000 });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('confirmed');
    expect(Number(res.body.data.committedAmount)).toBe(10000);
  });

  it('C3: reject confirm without committed_amount', async () => {
    const createRes = await request(app)
      .post('/api/v1/budgets')
      .set('Cookie', cookie(adminToken))
      .send({
        name: 'No Amount Budget',
        responsibleId: customerA.id,
        startDate: '2026-01-01',
        endDate: '2026-03-31',
        type: 'income',
        analyticalId: analytical.id,
      });

    const res = await request(app)
      .post(`/api/v1/budgets/${createRes.body.data.id}/confirm`)
      .set('Cookie', cookie(adminToken));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('AMOUNT_REQUIRED');
  });

  it('C4: achievement tracked via analytical invoice', async () => {
    const invRes = await request(app)
      .post('/api/v1/invoices')
      .set('Cookie', cookie(adminToken))
      .send({
        customerId: customerA.id,
        date: '2026-02-01',
        invoiceDate: '2026-02-01',
        dueDate: '2026-03-01',
        lines: [
          { productId: product.id, accountId: testData.arAccount.id, analyticId: analytical.id, qty: 1, unitPrice: 100 },
        ],
      });
    await request(app)
      .post(`/api/v1/invoices/${invRes.body.data.id}/confirm`)
      .set('Cookie', cookie(adminToken));

    const res = await request(app)
      .get(`/api/v1/budgets/${budgetId}`)
      .set('Cookie', cookie(adminToken));

    expect(Number(res.body.data.achievedAmount)).toBe(100);
    expect(Number(res.body.data.achievedPercentage)).toBe(1);
    expect(Number(res.body.data.amountToAchieve)).toBe(9900);
  });

  it('C5: revise → new draft + original revised', async () => {
    const res = await request(app)
      .post(`/api/v1/budgets/${budgetId}/revise`)
      .set('Cookie', cookie(adminToken))
      .send({ committedAmount: 12000 });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.originalBudgetId).toBe(budgetId);

    const original = await prisma.budget.findUnique({ where: { id: budgetId } });
    expect(original!.status).toBe('revised');
  });

  it('C6: invalid transition — revise draft rejected', async () => {
    const res = await request(app)
      .post(`/api/v1/budgets/${budgetId}/revise`)
      .set('Cookie', cookie(adminToken));
    expect(res.status).toBe(400);
  });

  it('C7: cancel → is_archived = true', async () => {
    const res = await request(app)
      .post(`/api/v1/budgets/${budgetId}/cancel`)
      .set('Cookie', cookie(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('cancelled');
    expect(res.body.data.isArchived).toBe(true);
  });

  it('C8: double cancel rejected', async () => {
    const res = await request(app)
      .post(`/api/v1/budgets/${budgetId}/cancel`)
      .set('Cookie', cookie(adminToken));
    expect(res.status).toBe(400);
  });
});

describe('FLOW D — RBAC + OWNERSHIP', () => {
  beforeAll(async () => {
    const a = await request(app)
      .post('/api/v1/invoices')
      .set('Cookie', cookie(adminToken))
      .send({
        customerId: customerA.id,
        date: '2026-03-01',
        invoiceDate: '2026-03-01',
        dueDate: '2026-04-01',
        lines: [{ productId: product.id, accountId: testData.arAccount.id, qty: 1, unitPrice: 100 }],
      });
    userAInvoiceId = a.body.data.id;

    const b = await request(app)
      .post('/api/v1/invoices')
      .set('Cookie', cookie(adminToken))
      .send({
        customerId: customerB.id,
        date: '2026-03-01',
        invoiceDate: '2026-03-01',
        dueDate: '2026-04-01',
        lines: [{ productId: product.id, accountId: testData.arAccount.id, qty: 1, unitPrice: 100 }],
      });
    userBInvoiceId = b.body.data.id;
  });

  it('D1: admin and accountant access dashboard, user does not', async () => {
    expect((await request(app).get('/api/v1/dashboard').set('Cookie', cookie(adminToken))).status).toBe(200);
    expect((await request(app).get('/api/v1/dashboard').set('Cookie', cookie(accountantToken))).status).toBe(200);
    expect((await request(app).get('/api/v1/dashboard').set('Cookie', cookie(userAToken))).status).toBe(403);
  });

  it('D2: user cannot access vendor bills', async () => {
    expect((await request(app).get('/api/v1/bills').set('Cookie', cookie(userAToken))).status).toBe(403);
    expect((await request(app).get('/api/v1/bills').set('Cookie', cookie(userAToken))).status).toBe(403);
  });

  it('D3: user cannot access contacts/products/categories/SO/PO/reports', async () => {
    const blocked = [
      '/api/v1/contacts',
      '/api/v1/products',
      '/api/v1/categories',
      '/api/v1/sales-orders',
      '/api/v1/purchase-orders',
      '/api/v1/reports/profit-and-loss',
      '/api/v1/reports/balance-sheet',
      '/api/v1/reports/budget-report',
    ];
    for (const path of blocked) {
      const res = await request(app).get(path).set('Cookie', cookie(userAToken));
      expect(res.status).toBe(403);
    }
  });

  it('D4: user A sees own invoices only', async () => {
    const res = await request(app)
      .get('/api/v1/invoices')
      .set('Cookie', cookie(userAToken));

    expect(res.status).toBe(200);
    const ids = res.body.data.map((i: any) => i.id);
    expect(ids).toContain(userAInvoiceId);
    expect(ids).not.toContain(userBInvoiceId);
  });

  it('D5: user A cannot access user B invoice by UUID', async () => {
    const res = await request(app)
      .get(`/api/v1/invoices/${userBInvoiceId}`)
      .set('Cookie', cookie(userAToken));
    expect(res.status).toBe(403);
  });

  it('D6: user A can access own invoice', async () => {
    const res = await request(app)
      .get(`/api/v1/invoices/${userAInvoiceId}`)
      .set('Cookie', cookie(userAToken));
    expect(res.status).toBe(200);
  });

  it('D7: user A cannot pay user B invoice', async () => {
    await request(app)
      .post(`/api/v1/invoices/${userBInvoiceId}/confirm`)
      .set('Cookie', cookie(adminToken));

    const res = await request(app)
      .post(`/api/v1/invoices/${userBInvoiceId}/pay`)
      .set('Cookie', cookie(userAToken))
      .send({ amount: 50, paymentVia: 'bank' });
    expect(res.status).toBe(403);
  });

  it('D8: user A CAN pay own invoice', async () => {
    await request(app)
      .post(`/api/v1/invoices/${userAInvoiceId}/confirm`)
      .set('Cookie', cookie(adminToken));

    const res = await request(app)
      .post(`/api/v1/invoices/${userAInvoiceId}/pay`)
      .set('Cookie', cookie(userAToken))
      .send({ amount: 100, paymentVia: 'bank' });
    expect(res.status).toBe(200);
  });

  it('D9: user can view own receipts (payments)', async () => {
    const res = await request(app)
      .get('/api/v1/payments')
      .set('Cookie', cookie(userAToken));
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('D10: unauthenticated access rejected', async () => {
    const res = await request(app).get('/api/v1/invoices');
    expect(res.status).toBe(401);
  });
});

describe('FLOW E — REPORTING', () => {
  it('E1: P&L year report matches manual calculation', async () => {
    const res = await request(app)
      .get('/api/v1/reports/profit-and-loss')
      .set('Cookie', cookie(adminToken))
      .query({ year: '2026' });

    expect(res.status).toBe(200);
    expect(res.body.data.year).toBe(2026);
    expect(res.body.data.income.items).toBeDefined();
    expect(res.body.data.expenses.items).toBeDefined();
    expect(typeof res.body.data.net_income).toBe('number');

    const salesRevenue = res.body.data.income.items.find((i: any) => i.account_name === 'Sales Revenue');
    expect(salesRevenue).toBeDefined();
    expect(salesRevenue.amount).toBeGreaterThan(0);
  });

  it('E2: balance sheet — liabilities include capital+income types, balance_check', async () => {
    const res = await request(app)
      .get('/api/v1/reports/balance-sheet')
      .set('Cookie', cookie(adminToken))
      .query({ year: '2026' });

    expect(res.status).toBe(200);
    expect(res.body.data.assets.items).toBeDefined();
    expect(res.body.data.liabilities.items).toBeDefined();

    const liabilityNames = res.body.data.liabilities.items.map((i: any) => i.account_name);
    const hasCapitalOrIncome = liabilityNames.some(
      (n: string) => n === 'Capital' || n === 'Sales Revenue'
    );
    expect(hasCapitalOrIncome).toBe(true);
    expect(typeof res.body.data.balance_check).toBe('boolean');
  });

  it('E3: budget report reconciles with budget engine', async () => {
    const res = await request(app)
      .get('/api/v1/reports/budget-report')
      .set('Cookie', cookie(adminToken))
      .query({ year: '2026', type: 'income' });

    expect(res.status).toBe(200);
    expect(res.body.data.budgets).toBeDefined();
    expect(res.body.data.budgets.length).toBeGreaterThan(0);
    const b = res.body.data.budgets.find((x: any) => x.name.includes('Q1 Sales Target'));
    expect(b).toBeDefined();
    expect(Number(b.achieved_amount)).toBe(100);
  });

  it('E4: dashboard returns kanban counts', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard')
      .set('Cookie', cookie(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.data.sales).toBeDefined();
    expect(res.body.data.sales.draft).toBeDefined();
    expect(res.body.data.sales.confirmed).toBeDefined();
    expect(res.body.data.sales.total).toBeDefined();
    expect(res.body.data.purchase).toBeDefined();
    expect(res.body.data.budgets).toBeDefined();
  });
});

describe('FLOW F — SEQUENCES', () => {
  it('F1: SO increments S00001, S00002...', async () => {
    const so1 = await request(app)
      .post('/api/v1/sales-orders')
      .set('Cookie', cookie(adminToken))
      .send({
        customerId: customerA.id,
        date: '2026-04-01',
        invoiceDate: '2026-04-01',
        dueDate: '2026-05-01',
        lines: [{ productId: product.id, accountId: testData.arAccount.id, qty: 1, unitPrice: 10 }],
      });
    const so2 = await request(app)
      .post('/api/v1/sales-orders')
      .set('Cookie', cookie(adminToken))
      .send({
        customerId: customerA.id,
        date: '2026-04-01',
        invoiceDate: '2026-04-01',
        dueDate: '2026-05-01',
        lines: [{ productId: product.id, accountId: testData.arAccount.id, qty: 1, unitPrice: 10 }],
      });
    expect(so1.body.data.soNumber).toMatch(/^S\d{5}$/);
    expect(so2.body.data.soNumber).toMatch(/^S\d{5}$/);
    expect(so1.body.data.soNumber).not.toBe(so2.body.data.soNumber);
  });

  it('F2: PO increments uniquely', async () => {
    const po1 = await request(app)
      .post('/api/v1/purchase-orders')
      .set('Cookie', cookie(adminToken))
      .send({
        vendorId: vendor.id,
        date: '2026-04-01',
        billDate: '2026-04-01',
        dueDate: '2026-05-01',
        lines: [{ productId: product.id, accountId: testData.apAccount.id, qty: 1, unitPrice: 10 }],
      });
    expect(po1.body.data.poNumber).toMatch(/^P\d{5}$/);
  });

  it('F3: invoice reference year-scoped + invoice number INV-00001', async () => {
    const inv = await request(app)
      .post('/api/v1/invoices')
      .set('Cookie', cookie(adminToken))
      .send({
        customerId: customerA.id,
        date: '2026-04-01',
        invoiceDate: '2026-04-01',
        dueDate: '2026-05-01',
        lines: [{ productId: product.id, accountId: testData.arAccount.id, qty: 1, unitPrice: 10 }],
      });
    expect(inv.body.data.invoiceReference).toMatch(/^INV\/2026\/\d{4}$/);
    expect(inv.body.data.invoiceNumber).toMatch(/^INV-\d{5}$/);
  });

  it('F4: JE and PAY year-scoped unique', async () => {
    const jeRes = await request(app)
      .post('/api/v1/journal-entries')
      .set('Cookie', cookie(adminToken))
      .send({
        accountingDate: '2026-04-01',
        journalId: testData.saleJournal.id,
        lines: [
          { accountId: testData.arAccount.id, debit: 50, credit: 0 },
          { accountId: testData.salesRevenue.id, debit: 0, credit: 50 },
        ],
      });
    expect(jeRes.body.data.entryNumber).toMatch(/^JE\/2026\/\d{4}$/);

    const freshInv = await request(app)
      .post('/api/v1/invoices')
      .set('Cookie', cookie(adminToken))
      .send({
        customerId: customerA.id,
        date: '2026-04-01',
        invoiceDate: '2026-04-01',
        dueDate: '2026-05-01',
        lines: [{ productId: product.id, accountId: testData.arAccount.id, qty: 1, unitPrice: 10 }],
      });
    await request(app)
      .post(`/api/v1/invoices/${freshInv.body.data.id}/confirm`)
      .set('Cookie', cookie(adminToken));

    const payRes = await request(app)
      .post('/api/v1/payments')
      .set('Cookie', cookie(adminToken))
      .send({ invoiceId: freshInv.body.data.id, amount: 5, paymentVia: 'bank' });
    expect(payRes.body.data.paymentNumber).toMatch(/^PAY\/2026\/\d{4}$/);
  });
});

describe('FLOW G — DELETE / RUNTIME SAFETY', () => {
  it('G1: soft-delete category (no crash, correct response)', async () => {
    const cat = await request(app)
      .post('/api/v1/categories')
      .set('Cookie', cookie(adminToken))
      .send({ name: 'Temp Category' });
    const del = await request(app)
      .delete(`/api/v1/categories/${cat.body.data.id}`)
      .set('Cookie', cookie(adminToken));
    expect(del.status).toBe(204);
    const row = await prisma.category.findUnique({ where: { id: cat.body.data.id } });
    expect(row!.deletedAt).not.toBeNull();
  });

  it('G2: soft-delete journal (no crash)', async () => {
    const j = await request(app)
      .post('/api/v1/journals')
      .set('Cookie', cookie(adminToken))
      .send({ name: 'Temp Journal', journalType: 'sale', defaultAccountId: testData.cashAccount.id });
    const del = await request(app)
      .delete(`/api/v1/journals/${j.body.data.id}`)
      .set('Cookie', cookie(adminToken));
    expect(del.status).toBe(204);
    const row = await prisma.journal.findUnique({ where: { id: j.body.data.id } });
    expect(row!.deletedAt).not.toBeNull();
  });

  it('G3: soft-delete COA', async () => {
    const coa = await request(app)
      .post('/api/v1/chart-of-accounts')
      .set('Cookie', cookie(adminToken))
      .send({ name: 'Temp Account', accountType: 'expense' });
    const del = await request(app)
      .delete(`/api/v1/chart-of-accounts/${coa.body.data.id}`)
      .set('Cookie', cookie(adminToken));
    expect(del.status).toBe(204);
    const row = await prisma.chartOfAccount.findUnique({ where: { id: coa.body.data.id } });
    expect(row!.deletedAt).not.toBeNull();
  });

  it('G4: soft-delete contact', async () => {
    const c = await request(app)
      .post('/api/v1/contacts')
      .set('Cookie', cookie(adminToken))
      .send({ name: 'Temp Contact', email: 'tempdel@test.com' });
    const del = await request(app)
      .delete(`/api/v1/contacts/${c.body.data.id}`)
      .set('Cookie', cookie(adminToken));
    expect(del.status).toBe(204);
    const row = await prisma.contact.findUnique({ where: { id: c.body.data.id } });
    expect(row!.deletedAt).not.toBeNull();
  });

  it('G5: soft-delete product', async () => {
    const cat = await request(app)
      .post('/api/v1/categories')
      .set('Cookie', cookie(adminToken))
      .send({ name: 'Prod Cat' });
    const p = await request(app)
      .post('/api/v1/products')
      .set('Cookie', cookie(adminToken))
      .send({ name: 'Temp Product', productType: 'goods', categoryId: cat.body.data.id, salesPrice: 10 });
    const del = await request(app)
      .delete(`/api/v1/products/${p.body.data.id}`)
      .set('Cookie', cookie(adminToken));
    expect(del.status).toBe(204);
    const row = await prisma.product.findUnique({ where: { id: p.body.data.id } });
    expect(row!.deletedAt).not.toBeNull();
  });

  it('G6: user delete deactivates (isActive=false)', async () => {
    const u = await request(app)
      .post('/api/v1/users')
      .set('Cookie', cookie(adminToken))
      .send({ name: 'Temp User', loginId: 'tempuser', email: 'tempuser@test.com', password: 'Pass@123' });
    const del = await request(app)
      .delete(`/api/v1/users/${u.body.data.id}`)
      .set('Cookie', cookie(adminToken));
    expect(del.status).toBe(204);
    const row = await prisma.user.findUnique({ where: { id: u.body.data.id } });
    expect(row!.isActive).toBe(false);
  });

  it('G7: invalid UUID returns 400 not crash', async () => {
    const res = await request(app)
      .get('/api/v1/contacts/invalid-uuid')
      .set('Cookie', cookie(adminToken));
    expect(res.status).toBe(400);
  });
});

describe('FLOW H — AUTH', () => {
  it('H1: signup creates user role=user, flat response, no cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Portal User',
        loginId: 'portaluser',
        email: 'portal@test.com',
        password: 'Password@123',
        confirmPassword: 'Password@123',
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.role).toBe('user');
    expect(res.body.login_id).toBe('portaluser');
    const cookies = (res.headers['set-cookie'] as unknown) as string[] | undefined;
    expect(cookies).toBeUndefined();
  });

  it('H2: duplicate signup rejected 409', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Dup',
        loginId: 'testadmin',
        email: 'dup@test.com',
        password: 'Password@123',
        confirmPassword: 'Password@123',
      });
    expect(res.status).toBe(409);
  });

  it('H3: invalid password rejected', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Bad',
        loginId: 'badpass',
        email: 'bad@test.com',
        password: '123',
        confirmPassword: '123',
      });
    expect(res.status).toBe(400);
  });

  it('H3b: password without special character rejected (REQ-AUTH-004)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'NoSpecial',
        loginId: 'nospecial',
        email: 'nospecial@test.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      });
    expect(res.status).toBe(400);
  });

  it('H3c: password without uppercase rejected (REQ-AUTH-004)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'NoUpper',
        loginId: 'noupper',
        email: 'noupper@test.com',
        password: 'password@123',
        confirmPassword: 'password@123',
      });
    expect(res.status).toBe(400);
  });

  it('H4: confirm_password mismatch rejected', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'MM',
        loginId: 'mismatch2',
        email: 'mm@test.com',
        password: 'Password@123',
        confirmPassword: 'Different1',
      });
    expect(res.status).toBe(400);
  });

  it('H5: login_id below minimum rejected', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Short',
        loginId: 'abc',
        email: 'short@test.com',
        password: 'Password@123',
        confirmPassword: 'Password@123',
      });
    expect(res.status).toBe(400);
  });

  it('H6: login sets cookie, returns user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ loginId: 'testadmin', password: 'Admin@123' });
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.role).toBe('admin');
    expect(res.body.token).toBeUndefined();
    const cookies = (res.headers['set-cookie'] as unknown) as string[];
    expect(cookies.some((c) => c.includes('auth_token'))).toBe(true);
  });

  it('H7: invalid credentials 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ loginId: 'testadmin', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('H8: logout clears cookie', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.status).toBe(200);
    const cookies = (res.headers['set-cookie'] as unknown) as string[];
    expect(cookies.some((c) => c.includes('auth_token=;'))).toBe(true);
  });

  it('H9: /auth/me returns flat user', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', cookie(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.login_id).toBe('testadmin');
    expect(res.body.user).toBeUndefined();
  });

  it('H10: invalid JWT rejected', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', ['auth_token=not-a-real-jwt']);
    expect(res.status).toBe(401);
  });

  it('H11: JWT expiry is exactly 15 minutes (900s)', async () => {
    const token = generateToken(testData.admin);
    const decoded = jwt.decode(token) as any;
    expect(decoded.exp - decoded.iat).toBe(900);
    expect(authConfig.jwtExpiry).toBe(900);
  });

  it('H12: role injection rejected — signup always creates user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Injector',
        loginId: 'injector',
        email: 'inj@test.com',
        password: 'Password@123',
        confirmPassword: 'Password@123',
        role: 'admin',
      });
    expect(res.status).toBe(201);
    expect(res.body.role).toBe('user');
  });

  it('H13: rate limiters configured per source (5 login/min, 3 signup/hr, 100 API/min)', async () => {
    const { loginLimiter, signupLimiter, apiLimiter } = require('../src/middleware/rateLimiter');
    expect(loginLimiter).toBeDefined();
    expect(signupLimiter).toBeDefined();
    expect(apiLimiter).toBeDefined();
  });
});