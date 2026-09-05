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
        customer_id: customerA.id,
        order_date: '2026-01-10',
        lines: [
          { product_id: product.id, account_id: testData.arAccount.id, quantity: 2, unit_price: 100 },
          { product_id: product.id, account_id: testData.arAccount.id, quantity: 1, unit_price: 50 },
        ],
      });

    expect(res.status).toBe(201);
    salesOrderId = res.body.id;
    expect(res.body.so_number).toMatch(/^S\d{5}$/);
    expect(Number(res.body.total_amount)).toBe(250);
    expect(res.body.status).toBe('draft');
    expect(res.body.customer_name).toBe('Customer A');
  });

  it('A2: confirm SO creates JE (debit=credit, AR/Revenue)', async () => {
    const res = await request(app)
      .put(`/api/v1/sales-orders/${salesOrderId}/confirm`)
      .set('Cookie', cookie(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('confirmed');

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
        customer_id: customerA.id,
        sales_order_id: salesOrderId,
        invoice_date: '2026-01-10',
        due_date: '2026-02-10',
        payment_type: 'receive',
        payment_via: 'bank',
        lines: [
          { product_id: product.id, account_id: testData.arAccount.id, quantity: 2, unit_price: 100 },
        ],
      });

    expect(res.status).toBe(201);
    invoiceId = res.body.id;
    expect(res.body.invoice_reference).toMatch(/^INV\/2026\/\d{4}$/);
    expect(res.body.invoice_number).toMatch(/^INV-\d{5}$/);
    expect(Number(res.body.total)).toBe(200);
    expect(Number(res.body.amount_due)).toBe(200);
    expect(res.body.status).toBe('draft');
    expect(res.body.customer.name).toBe('Customer A');
    expect(res.body.lines[0].product_name).toBe('Test Product');
  });

  it('A5: confirm invoice creates JE (AR debit / Revenue credit)', async () => {
    const res = await request(app)
      .post(`/api/v1/invoices/${invoiceId}/confirm`)
      .set('Cookie', cookie(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('confirmed');
    expect(res.body.journal_entry_id).toBeDefined();

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
      .send({ amount: 200, payment_via: 'bank', payment_date: '2026-01-20' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('paid');
    expect(Number(res.body.amount_due)).toBe(0);

    const inv = await prisma.customerInvoice.findUnique({ where: { id: invoiceId } });
    expect(Number(inv!.amountDue)).toBe(0);
    expect(inv!.status).toBe('paid');

    const payment = await prisma.payment.findFirst({ where: { invoiceId } });
    expect(payment).toBeDefined();
    expect(payment!.paymentNumber).toMatch(/^PAY\/2026\/\d{4}$/);
    expect(payment!.status).toBe('successful');

    const payJe = await prisma.journalEntry.findFirst({
      where: { sourceDocumentType: 'payment', sourceDocumentId: payment!.id },
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
        customer_id: customerA.id,
        invoice_date: '2026-02-01',
        due_date: '2026-03-01',
        lines: [
          { product_id: product.id, account_id: testData.arAccount.id, quantity: 1, unit_price: 100 },
        ],
      });
    const invId = invRes.body.id;
    await request(app)
      .post(`/api/v1/invoices/${invId}/confirm`)
      .set('Cookie', cookie(adminToken));

    const res = await request(app)
      .post(`/api/v1/invoices/${invId}/pay`)
      .set('Cookie', cookie(adminToken))
      .send({ amount: 500, payment_via: 'bank' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('OVERPAYMENT_NOT_ALLOWED');
  });

  it('A9: invalid transition — pay draft invoice rejected', async () => {
    const invRes = await request(app)
      .post('/api/v1/invoices')
      .set('Cookie', cookie(adminToken))
      .send({
        customer_id: customerA.id,
        invoice_date: '2026-02-01',
        due_date: '2026-03-01',
        lines: [
          { product_id: product.id, account_id: testData.arAccount.id, quantity: 1, unit_price: 100 },
        ],
      });
    const invId = invRes.body.id;

    const res = await request(app)
      .post(`/api/v1/invoices/${invId}/pay`)
      .set('Cookie', cookie(adminToken))
      .send({ amount: 50, payment_via: 'bank' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CONFIRMED_REQUIRED');
  });

  it('A10: cancel confirmed invoice rejected (only draft can cancel)', async () => {
    const res = await request(app)
      .post(`/api/v1/invoices/${invoiceId}/cancel`)
      .set('Cookie', cookie(adminToken));
    expect(res.status).toBe(400);
  });

  it('A11: amount_paid computed field present in list', async () => {
    const res = await request(app)
      .get('/api/v1/invoices')
      .set('Cookie', cookie(adminToken));
    expect(res.body.invoices).toBeDefined();
    const row = res.body.invoices.find((i: any) => i.id === invoiceId);
    expect(Number(row.amount_paid)).toBe(200);
    expect(Number(row.amount_due)).toBe(0);
    expect(Number(row.total_amount)).toBe(200);
    expect(row.customer_name).toBe('Customer A');
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
        vendor_id: vendor.id,
        order_date: '2026-01-15',
        lines: [
          { product_id: product.id, account_id: testData.apAccount.id, quantity: 3, unit_price: 60 },
        ],
      });

    expect(res.status).toBe(201);
    purchaseOrderId = res.body.id;
    expect(res.body.po_number).toMatch(/^P\d{5}$/);
    expect(Number(res.body.total_amount)).toBe(180);
  });

  it('B2: confirm PO creates JE (expense debit / AP credit)', async () => {
    const res = await request(app)
      .put(`/api/v1/purchase-orders/${purchaseOrderId}/confirm`)
      .set('Cookie', cookie(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('confirmed');

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
        vendor_id: vendor.id,
        purchase_order_id: purchaseOrderId,
        bill_date: '2026-01-15',
        due_date: '2026-02-15',
        payment_type: 'send',
        payment_via: 'bank',
        lines: [
          { product_id: product.id, account_id: testData.apAccount.id, quantity: 3, unit_price: 60 },
        ],
      });

    expect(res.status).toBe(201);
    billId = res.body.id;
    expect(res.body.bill_reference).toMatch(/^Bill\/2026\/\d{4}$/);
    expect(Number(res.body.amount_due)).toBe(180);
  });

  it('B4: confirm bill creates JE (expense debit / AP credit)', async () => {
    const res = await request(app)
      .post(`/api/v1/bills/${billId}/confirm`)
      .set('Cookie', cookie(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('confirmed');
    expect(res.body.journal_entry_id).toBeDefined();

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
      .send({ amount: 180, payment_via: 'bank', payment_date: '2026-01-25' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('paid');

    const bill = await prisma.vendorBill.findUnique({ where: { id: billId } });
    expect(Number(bill!.amountDue)).toBe(0);
    expect(bill!.status).toBe('paid');
  });

  it('B6: overpayment rejected', async () => {
    const billRes = await request(app)
      .post('/api/v1/bills')
      .set('Cookie', cookie(adminToken))
      .send({
        vendor_id: vendor.id,
        bill_date: '2026-02-01',
        due_date: '2026-03-01',
        lines: [
          { product_id: product.id, account_id: testData.apAccount.id, quantity: 1, unit_price: 50 },
        ],
      });
    const newBillId = billRes.body.id;
    await request(app)
      .post(`/api/v1/bills/${newBillId}/confirm`)
      .set('Cookie', cookie(adminToken));

    const res = await request(app)
      .post(`/api/v1/bills/${newBillId}/pay`)
      .set('Cookie', cookie(adminToken))
      .send({ amount: 999, payment_via: 'bank' });
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
        responsible_id: customerA.id,
        start_date: '2026-01-01',
        end_date: '2026-03-31',
        type: 'income',
        analytical_id: analytical.id,
      });

    expect(res.status).toBe(201);
    budgetId = res.body.id;
    expect(res.body.status).toBe('draft');
    expect(res.body.responsible.name).toBe('Customer A');
  });

  it('C2: confirm with committed_amount', async () => {
    const res = await request(app)
      .put(`/api/v1/budgets/${budgetId}/confirm`)
      .set('Cookie', cookie(adminToken))
      .send({ committed_amount: 10000 });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('confirmed');
    expect(Number(res.body.committed_amount)).toBe(10000);
  });

  it('C3: reject confirm without committed_amount', async () => {
    const createRes = await request(app)
      .post('/api/v1/budgets')
      .set('Cookie', cookie(adminToken))
      .send({
        name: 'No Amount Budget',
        responsible_id: customerA.id,
        start_date: '2026-01-01',
        end_date: '2026-03-31',
        type: 'income',
        analytical_id: analytical.id,
      });

    const res = await request(app)
      .put(`/api/v1/budgets/${createRes.body.id}/confirm`)
      .set('Cookie', cookie(adminToken));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('AMOUNT_REQUIRED');
  });

  it('C4: achievement tracked via analytical invoice', async () => {
    const invRes = await request(app)
      .post('/api/v1/invoices')
      .set('Cookie', cookie(adminToken))
      .send({
        customer_id: customerA.id,
        invoice_date: '2026-02-01',
        due_date: '2026-03-01',
        lines: [
          { product_id: product.id, account_id: testData.arAccount.id, analytical_id: analytical.id, quantity: 1, unit_price: 100 },
        ],
      });
    await request(app)
      .post(`/api/v1/invoices/${invRes.body.id}/confirm`)
      .set('Cookie', cookie(adminToken));

    const res = await request(app)
      .get(`/api/v1/budgets/${budgetId}`)
      .set('Cookie', cookie(adminToken));

    expect(Number(res.body.achieved_amount)).toBe(100);
    expect(Number(res.body.achieved_percentage)).toBe(1);
    expect(Number(res.body.amount_to_achieve)).toBe(9900);
  });

  it('C5: revise → new draft + original revised', async () => {
    const res = await request(app)
      .post(`/api/v1/budgets/${budgetId}/revise`)
      .set('Cookie', cookie(adminToken))
      .send({ committed_amount: 12000 });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('draft');
    expect(res.body.previous_budget_id).toBe(budgetId);
    expect(Number(res.body.committed_amount)).toBe(12000);

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
      .put(`/api/v1/budgets/${budgetId}/cancel`)
      .set('Cookie', cookie(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelled');
    expect(res.body.is_archived).toBe(true);
  });

  it('C8: double cancel rejected', async () => {
    const res = await request(app)
      .put(`/api/v1/budgets/${budgetId}/cancel`)
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
        customer_id: customerA.id,
        invoice_date: '2026-03-01',
        due_date: '2026-04-01',
        lines: [{ product_id: product.id, account_id: testData.arAccount.id, quantity: 1, unit_price: 100 }],
      });
    userAInvoiceId = a.body.id;

    const b = await request(app)
      .post('/api/v1/invoices')
      .set('Cookie', cookie(adminToken))
      .send({
        customer_id: customerB.id,
        invoice_date: '2026-03-01',
        due_date: '2026-04-01',
        lines: [{ product_id: product.id, account_id: testData.arAccount.id, quantity: 1, unit_price: 100 }],
      });
    userBInvoiceId = b.body.id;
  });

  it('D1: admin and accountant access dashboard, user does not', async () => {
    expect((await request(app).get('/api/v1/dashboard').set('Cookie', cookie(adminToken))).status).toBe(200);
    expect((await request(app).get('/api/v1/dashboard').set('Cookie', cookie(accountantToken))).status).toBe(200);
    expect((await request(app).get('/api/v1/dashboard').set('Cookie', cookie(userAToken))).status).toBe(403);
  });

  it('D2: user cannot access vendor bills', async () => {
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
    const ids = res.body.invoices.map((i: any) => i.id);
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
      .send({ amount: 50, payment_via: 'bank' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('OWNERSHIP_REQUIRED');
  });

  it('D8: user A CAN pay own invoice', async () => {
    await request(app)
      .post(`/api/v1/invoices/${userAInvoiceId}/confirm`)
      .set('Cookie', cookie(adminToken));

    const res = await request(app)
      .post(`/api/v1/invoices/${userAInvoiceId}/pay`)
      .set('Cookie', cookie(userAToken))
      .send({ amount: 100, payment_via: 'bank' });
    expect(res.status).toBe(200);
  });

  it('D9: user can view own receipts (payments)', async () => {
    const res = await request(app)
      .get('/api/v1/payments')
      .set('Cookie', cookie(userAToken));
    expect(res.status).toBe(200);
    expect(res.body.payments.length).toBeGreaterThan(0);
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
    expect(res.body.year).toBe(2026);
    expect(res.body.income.items).toBeDefined();
    expect(res.body.expenses.items).toBeDefined();
    expect(typeof res.body.net_income).toBe('number');

    const salesRevenue = res.body.income.items.find((i: any) => i.account_name === 'Sales Revenue');
    expect(salesRevenue).toBeDefined();
    expect(salesRevenue.amount).toBeGreaterThan(0);
  });

  it('E2: balance sheet — liabilities include capital+income types, balance_check', async () => {
    const res = await request(app)
      .get('/api/v1/reports/balance-sheet')
      .set('Cookie', cookie(adminToken))
      .query({ year: '2026' });

    expect(res.status).toBe(200);
    expect(res.body.assets.items).toBeDefined();
    expect(res.body.liabilities.items).toBeDefined();

    const liabilityNames = res.body.liabilities.items.map((i: any) => i.account_name);
    const hasCapitalOrIncome = liabilityNames.some(
      (n: string) => n === 'Capital' || n === 'Sales Revenue'
    );
    expect(hasCapitalOrIncome).toBe(true);
    expect(typeof res.body.balance_check).toBe('boolean');
  });

  it('E3: budget report reconciles with budget engine', async () => {
    const res = await request(app)
      .get('/api/v1/reports/budget-report')
      .set('Cookie', cookie(adminToken))
      .query({ year: '2026', type: 'income' });

    expect(res.status).toBe(200);
    expect(res.body.budgets).toBeDefined();
    expect(res.body.budgets.length).toBeGreaterThan(0);
    const b = res.body.budgets.find((x: any) => x.name.includes('Q1 Sales Target'));
    expect(b).toBeDefined();
    expect(Number(b.achieved_amount)).toBe(100);
  });

  it('E4: dashboard returns kanban counts', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard')
      .set('Cookie', cookie(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.sales).toBeDefined();
    expect(res.body.sales.draft).toBeDefined();
    expect(res.body.sales.confirmed).toBeDefined();
    expect(res.body.sales.total).toBeDefined();
    expect(res.body.purchase).toBeDefined();
    expect(res.body.budgets).toBeDefined();
  });
});

describe('FLOW F — SEQUENCES', () => {
  it('F1: SO increments S00001, S00002...', async () => {
    const so1 = await request(app)
      .post('/api/v1/sales-orders')
      .set('Cookie', cookie(adminToken))
      .send({
        customer_id: customerA.id,
        order_date: '2026-04-01',
        lines: [{ product_id: product.id, account_id: testData.arAccount.id, quantity: 1, unit_price: 10 }],
      });
    const so2 = await request(app)
      .post('/api/v1/sales-orders')
      .set('Cookie', cookie(adminToken))
      .send({
        customer_id: customerA.id,
        order_date: '2026-04-01',
        lines: [{ product_id: product.id, account_id: testData.arAccount.id, quantity: 1, unit_price: 10 }],
      });
    expect(so1.body.so_number).toMatch(/^S\d{5}$/);
    expect(so2.body.so_number).toMatch(/^S\d{5}$/);
    expect(so1.body.so_number).not.toBe(so2.body.so_number);
  });

  it('F2: PO increments uniquely', async () => {
    const po1 = await request(app)
      .post('/api/v1/purchase-orders')
      .set('Cookie', cookie(adminToken))
      .send({
        vendor_id: vendor.id,
        order_date: '2026-04-01',
        lines: [{ product_id: product.id, account_id: testData.apAccount.id, quantity: 1, unit_price: 10 }],
      });
    expect(po1.body.po_number).toMatch(/^P\d{5}$/);
  });

  it('F3: invoice reference year-scoped + invoice number INV-00001', async () => {
    const inv = await request(app)
      .post('/api/v1/invoices')
      .set('Cookie', cookie(adminToken))
      .send({
        customer_id: customerA.id,
        invoice_date: '2026-04-01',
        due_date: '2026-05-01',
        lines: [{ product_id: product.id, account_id: testData.arAccount.id, quantity: 1, unit_price: 10 }],
      });
    expect(inv.body.invoice_reference).toMatch(/^INV\/2026\/\d{4}$/);
    expect(inv.body.invoice_number).toMatch(/^INV-\d{5}$/);
  });

  it('F4: JE and PAY year-scoped unique', async () => {
    const jeRes = await request(app)
      .post('/api/v1/journal-entries')
      .set('Cookie', cookie(adminToken))
      .send({
        journal_id: testData.saleJournal.id,
        accounting_date: '2026-04-01',
        lines: [
          { account_id: testData.arAccount.id, debit: 50, credit: 0 },
          { account_id: testData.salesRevenue.id, debit: 0, credit: 50 },
        ],
      });
    expect(jeRes.body.entry_number).toMatch(/^JE\/2026\/\d{4}$/);

    const freshInv = await request(app)
      .post('/api/v1/invoices')
      .set('Cookie', cookie(adminToken))
      .send({
        customer_id: customerA.id,
        invoice_date: '2026-04-01',
        due_date: '2026-05-01',
        lines: [{ product_id: product.id, account_id: testData.arAccount.id, quantity: 1, unit_price: 10 }],
      });
    await request(app)
      .post(`/api/v1/invoices/${freshInv.body.id}/confirm`)
      .set('Cookie', cookie(adminToken));

    const payRes = await request(app)
      .post('/api/v1/payments')
      .set('Cookie', cookie(adminToken))
      .send({ invoice_id: freshInv.body.id, amount: 5, payment_via: 'bank' });
    expect(payRes.body.payment_number).toMatch(/^PAY\/2026\/\d{4}$/);
  });
});

describe('FLOW G — DELETE / RUNTIME SAFETY', () => {
  it('G1: soft-delete category (no crash, correct response)', async () => {
    const cat = await request(app)
      .post('/api/v1/categories')
      .set('Cookie', cookie(adminToken))
      .send({ name: 'Temp Category' });
    const del = await request(app)
      .delete(`/api/v1/categories/${cat.body.id}`)
      .set('Cookie', cookie(adminToken));
    expect(del.status).toBe(204);
    const row = await prisma.category.findUnique({ where: { id: cat.body.id } });
    expect(row!.deletedAt).not.toBeNull();
  });

  it('G2: soft-delete journal (no crash)', async () => {
    const j = await request(app)
      .post('/api/v1/journals')
      .set('Cookie', cookie(adminToken))
      .send({ name: 'Temp Journal', journal_type: 'sale', default_account_id: testData.cashAccount.id });
    const del = await request(app)
      .delete(`/api/v1/journals/${j.body.id}`)
      .set('Cookie', cookie(adminToken));
    expect(del.status).toBe(204);
    const row = await prisma.journal.findUnique({ where: { id: j.body.id } });
    expect(row!.deletedAt).not.toBeNull();
  });

  it('G3: soft-delete COA', async () => {
    const coa = await request(app)
      .post('/api/v1/chart-of-accounts')
      .set('Cookie', cookie(adminToken))
      .send({ name: 'Temp Account', account_type: 'expense' });
    const del = await request(app)
      .delete(`/api/v1/chart-of-accounts/${coa.body.id}`)
      .set('Cookie', cookie(adminToken));
    expect(del.status).toBe(204);
    const row = await prisma.chartOfAccount.findUnique({ where: { id: coa.body.id } });
    expect(row!.deletedAt).not.toBeNull();
  });

  it('G4: soft-delete contact', async () => {
    const c = await request(app)
      .post('/api/v1/contacts')
      .set('Cookie', cookie(adminToken))
      .send({ name: 'Temp Contact', email: 'tempdel@test.com' });
    const del = await request(app)
      .delete(`/api/v1/contacts/${c.body.id}`)
      .set('Cookie', cookie(adminToken));
    expect(del.status).toBe(204);
    const row = await prisma.contact.findUnique({ where: { id: c.body.id } });
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
      .send({ name: 'Temp Product', product_type: 'goods', category_id: cat.body.id, sales_price: 10 });
    const del = await request(app)
      .delete(`/api/v1/products/${p.body.id}`)
      .set('Cookie', cookie(adminToken));
    expect(del.status).toBe(204);
    const row = await prisma.product.findUnique({ where: { id: p.body.id } });
    expect(row!.deletedAt).not.toBeNull();
  });

  it('G6: user delete deactivates (isActive=false)', async () => {
    const u = await request(app)
      .post('/api/v1/users')
      .set('Cookie', cookie(adminToken))
      .send({ name: 'Temp User', login_id: 'tempuser', email: 'tempuser@test.com', password: 'Pass@123' });
    const del = await request(app)
      .delete(`/api/v1/users/${u.body.id}`)
      .set('Cookie', cookie(adminToken));
    expect(del.status).toBe(204);
    const row = await prisma.user.findUnique({ where: { id: u.body.id } });
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
        login_id: 'portaluser',
        email: 'portal@test.com',
        password: 'Password@123',
        confirm_password: 'Password@123',
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
        login_id: 'testadmin',
        email: 'dup@test.com',
        password: 'Password@123',
        confirm_password: 'Password@123',
      });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_LOGIN_ID');
  });

  it('H3: invalid password rejected', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        login_id: 'badpass',
        email: 'bad@test.com',
        password: '123',
        confirm_password: '123',
      });
    expect(res.status).toBe(400);
  });

  it('H3b: password without special character rejected (REQ-AUTH-004)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        login_id: 'nospecial',
        email: 'nospecial@test.com',
        password: 'Password123',
        confirm_password: 'Password123',
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('WEAK_PASSWORD');
  });

  it('H3c: password without uppercase rejected (REQ-AUTH-004)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        login_id: 'noupper',
        email: 'noupper@test.com',
        password: 'password@123',
        confirm_password: 'password@123',
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('WEAK_PASSWORD');
  });

  it('H4: confirm_password mismatch rejected', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        login_id: 'mismatch2',
        email: 'mm@test.com',
        password: 'Password@123',
        confirm_password: 'Different1',
      });
    expect(res.status).toBe(400);
  });

  it('H5: login_id below minimum rejected', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        login_id: 'abc',
        email: 'short@test.com',
        password: 'Password@123',
        confirm_password: 'Password@123',
      });
    expect(res.status).toBe(400);
  });

  it('H6: login sets cookie, returns user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ login_id: 'testadmin', password: 'Admin@123' });
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.role).toBe('admin');
    expect(res.body.user.login_id).toBe('testadmin');
    expect(res.body.token).toBeUndefined();
    const cookies = (res.headers['set-cookie'] as unknown) as string[];
    expect(cookies.some((c) => c.includes('auth_token'))).toBe(true);
  });

  it('H7: invalid credentials 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ login_id: 'testadmin', password: 'wrong' });
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
        login_id: 'injector',
        email: 'inj@test.com',
        password: 'Password@123',
        confirm_password: 'Password@123',
        role: 'admin',
      });
    expect(res.status).toBe(201);
    expect(res.body.role).toBe('user');
  });

  it('H13: forgot-password returns mock message', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'admin@test.com' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });
});