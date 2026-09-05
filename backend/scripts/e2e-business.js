const http = require('http');

const BASE = 'http://localhost:3000/api/v1';
const ORIGIN = 'http://localhost:5173';

function request(method, path, { body, cookie } = {}) {
  return new Promise((resolve, reject) => {
    const headers = { Origin: ORIGIN };
    if (cookie) headers.Cookie = cookie;
    if (body) { headers['Content-Type'] = 'application/json'; }
    const req = http.request({ host: 'localhost', port: 3000, path: BASE + path, method, headers }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch {}
        resolve({ status: res.statusCode, body: parsed, setCookie: res.headers['set-cookie'] });
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const check = (name, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: ${JSON.stringify(actual)} ${ok ? '' : '!= ' + JSON.stringify(expected)}`);
  return ok;
};

(async () => {
  const login = await request('POST', '/auth/login', { body: { login_id: 'admin', password: 'Admin@123' } });
  const cookie = login.setCookie?.[0]?.split(';')[0];
  check('login', login.status, 200);

  // Create contact (customer)
  const contact = await request('POST', '/contacts', { cookie, body: { name: 'E2E Customer', email: 'e2e@test.com', phone: '5551234' } });
  check('create contact', contact.status, 201);
  const customerId = contact.body.id;

  // Create category + product
  const category = await request('POST', '/categories', { cookie, body: { name: 'E2E Category' } });
  check('create category', category.status, 201);
  const product = await request('POST', '/products', { cookie, body: { name: 'E2E Chair', product_type: 'goods', category_id: category.body.id, sales_price: 250, cost: 150 } });
  check('create product', product.status, 201);
  check('product category_name', product.body.category_name, 'E2E Category');
  const productId = product.body.id;

  // Sales Order
  const so = await request('POST', '/sales-orders', { cookie, body: {
    customer_id: customerId,
    order_date: '2026-09-05',
    lines: [{ product_id: productId, account_id: product.body.category_id ? '00000000-0000-0000-0000-000000000000' : undefined, quantity: 2, unit_price: 250 }],
  } });
  console.log('SO create (expected 400, no account_id) status:', so.status, JSON.stringify(so.body));

  // Get AR account id from COA
  const coa = await request('GET', '/chart-of-accounts', { cookie });
  const ar = coa.body.find((a) => a.account_type === 'asset');
  const salesRevenue = coa.body.find((a) => a.account_type === 'income');

  const so2 = await request('POST', '/sales-orders', { cookie, body: {
    customer_id: customerId,
    order_date: '2026-09-05',
    lines: [{ product_id: productId, account_id: ar.id, quantity: 2, unit_price: 250 }],
  } });
  check('create SO', so2.status, 201);
  check('SO total_amount', Number(so2.body.total_amount), 500);
  check('SO so_number', /^S\d{5}$/.test(so2.body.so_number), true);
  check('SO customer_name', so2.body.customer_name, 'E2E Customer');
  const soId = so2.body.id;

  // Confirm SO
  const soConfirm = await request('PUT', `/sales-orders/${soId}/confirm`, { cookie });
  check('confirm SO', soConfirm.status, 200);
  check('SO confirmed status', soConfirm.body.status, 'confirmed');

  // Invoice
  const invoice = await request('POST', '/invoices', { cookie, body: {
    customer_id: customerId,
    sales_order_id: soId,
    invoice_date: '2026-09-05',
    due_date: '2026-10-05',
    payment_via: 'bank',
    lines: [{ product_id: productId, account_id: ar.id, quantity: 2, unit_price: 250 }],
  } });
  check('create invoice', invoice.status, 201);
  check('invoice total', Number(invoice.body.total), 500);
  check('invoice amount_due', Number(invoice.body.amount_due), 500);
  check('invoice ref', /^INV\/2026\/\d{4}$/.test(invoice.body.invoice_reference), true);
  check('invoice number', /^INV-\d{5}$/.test(invoice.body.invoice_number), true);
  check('invoice lines product_name', invoice.body.lines[0].product_name, 'E2E Chair');
  const invoiceId = invoice.body.id;

  // Confirm invoice
  const invConfirm = await request('POST', `/invoices/${invoiceId}/confirm`, { cookie });
  check('confirm invoice', invConfirm.status, 200);
  check('invoice confirmed', invConfirm.body.status, 'confirmed');
  check('invoice journal_entry_id set', invConfirm.body.journal_entry_id !== null, true);

  // Pay invoice
  const pay = await request('POST', `/invoices/${invoiceId}/pay`, { cookie, body: { amount: 500, payment_via: 'bank', payment_date: '2026-09-10' } });
  check('pay invoice', pay.status, 200);
  check('invoice paid', pay.body.status, 'paid');
  check('amount_due 0', Number(pay.body.amount_due), 0);

  // Payments list
  const payments = await request('GET', '/payments', { cookie });
  check('payments list has 1', payments.body.payments.length >= 1, true);
  check('payment number format', /^PAY\/2026\/\d{4}$/.test(payments.body.payments[0].payment_number), true);
  check('payment status successful', payments.body.payments[0].status, 'successful');

  // Purchase: vendor + PO + bill + pay
  const vendor = await request('POST', '/contacts', { cookie, body: { name: 'E2E Vendor', email: 'vendore2e@test.com' } });
  check('create vendor', vendor.status, 201);
  const vendorId = vendor.body.id;

  const po = await request('POST', '/purchase-orders', { cookie, body: {
    vendor_id: vendorId,
    order_date: '2026-09-05',
    lines: [{ product_id: productId, account_id: ar.id, quantity: 1, unit_price: 150 }],
  } });
  check('create PO', po.status, 201);
  const poId = po.body.id;

  const poConfirm = await request('PUT', `/purchase-orders/${poId}/confirm`, { cookie });
  check('confirm PO', poConfirm.status, 200);

  const bill = await request('POST', '/bills', { cookie, body: {
    vendor_id: vendorId,
    purchase_order_id: poId,
    bill_date: '2026-09-05',
    due_date: '2026-10-05',
    payment_via: 'bank',
    lines: [{ product_id: productId, account_id: ar.id, quantity: 1, unit_price: 150 }],
  } });
  check('create bill', bill.status, 201);
  check('bill ref', /^Bill\/2026\/\d{4}$/.test(bill.body.bill_reference), true);
  const billId = bill.body.id;

  const billConfirm = await request('POST', `/bills/${billId}/confirm`, { cookie });
  check('confirm bill', billConfirm.status, 200);

  const billPay = await request('POST', `/bills/${billId}/pay`, { cookie, body: { amount: 150, payment_via: 'bank', payment_date: '2026-09-10' } });
  check('pay bill', billPay.status, 200);
  check('bill paid', billPay.body.status, 'paid');

  // Budget
  const budget = await request('POST', '/budgets', { cookie, body: {
    name: 'E2E Budget',
    responsible_id: customerId,
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    type: 'income',
    analytical_id: null,
  } });
  console.log('budget create (no analytical) status:', budget.status, JSON.stringify(budget.body));

  // Find analytical or create one
  const analyticals = await request('GET', '/analyticals', { cookie });
  let analyticalId = analyticals.body[0]?.id;
  if (!analyticalId) {
    const ana = await request('POST', '/analyticals', { cookie, body: {
      name: 'E2E Analytical',
      responsible_id: customerId,
      start_date: '2026-01-01',
      to_date: '2026-12-31',
      end_date: '2026-12-31',
      analytic_account: 'ANA-001',
    } });
    analyticalId = ana.body.id;
  }
  check('analytical created', typeof analyticalId, 'string');

  const budget2 = await request('POST', '/budgets', { cookie, body: {
    name: 'E2E Budget',
    responsible_id: customerId,
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    type: 'income',
    analytical_id: analyticalId,
  } });
  check('create budget', budget2.status, 201);
  const budgetId = budget2.body.id;

  const budgetConfirm = await request('PUT', `/budgets/${budgetId}/confirm`, { cookie, body: { committed_amount: 10000 } });
  check('confirm budget', budgetConfirm.status, 200);
  check('budget confirmed', budgetConfirm.body.status, 'confirmed');

  const budgetRevise = await request('POST', `/budgets/${budgetId}/revise`, { cookie });
  check('revise budget', budgetRevise.status, 201);
  check('revised is draft', budgetRevise.body.status, 'draft');

  const budgetCancel = await request('PUT', `/budgets/${budgetId}/cancel`, { cookie });
  check('cancel budget', budgetCancel.status, 200);
  check('cancelled + archived', budgetCancel.body.status === 'cancelled' && budgetCancel.body.is_archived === true, true);

  // Reports
  const pnl = await request('GET', '/reports/profit-and-loss?year=2026', { cookie });
  check('P&L 200', pnl.status, 200);
  check('P&L net_income', typeof pnl.body.net_income, 'number');

  const bs = await request('GET', '/reports/balance-sheet?year=2026', { cookie });
  check('BS 200', bs.status, 200);
  check('BS balance_check', typeof bs.body.balance_check, 'boolean');

  const br = await request('GET', '/reports/budget-report?year=2026&type=income', { cookie });
  check('budget report 200', br.status, 200);
  check('budget report budgets array', Array.isArray(br.body.budgets), true);

  // Dashboard
  const dash = await request('GET', '/dashboard', { cookie });
  check('dashboard 200', dash.status, 200);
  check('dashboard counts', typeof dash.body.sales.total, 'number');

  console.log('\nE2E business flow complete.');
})().catch((e) => { console.error(e); process.exit(1); });