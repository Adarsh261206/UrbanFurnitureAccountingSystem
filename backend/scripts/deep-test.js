// DEEP FEATURE TEST — every screen/button per 23_FRONTEND_SCREEN_CONTROL_MATRIX.md
// Simulates exactly what the frontend does (same API calls, same fields, same order).
const http = require('http');

const BASE = '/api/v1';
const ORIGIN = 'http://localhost:8080';

let cookie = null;
let results = [];
let step = 0;

function req(method, path, { body, rawBody, contentType, cookie: c } = {}) {
  return new Promise((resolve, reject) => {
    const headers = { Origin: ORIGIN };
    if (c) headers.Cookie = c;
    if (contentType) headers['Content-Type'] = contentType;
    else if (body) { headers['Content-Type'] = 'application/json'; headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body)); }
    if (rawBody) headers['Content-Length'] = Buffer.byteLength(rawBody);
    const r = http.request({ host: 'localhost', port: 3000, path: BASE + path, method, headers }, (res) => {
      const chunks = [];
      res.on('data', (x) => chunks.push(x));
      res.on('end', () => resolve({
        status: res.statusCode,
        body: res.headers['content-type']?.includes('json') ? JSON.parse(Buffer.concat(chunks).toString() || 'null') : Buffer.concat(chunks),
        buf: Buffer.concat(chunks),
        setCookie: res.headers['set-cookie'],
      }));
    });
    r.on('error', reject);
    if (rawBody) r.write(rawBody);
    else if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

function check(screen, action, actual, expected, extra = '') {
  step++;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  results.push({ ok, screen, action });
  console.log(`${ok ? '✅' : '❌'} [${String(step).padStart(2)}] ${screen} › ${action} — ${JSON.stringify(actual)}${ok ? '' : ' (expected ' + JSON.stringify(expected) + ')'}${extra ? ' ' + extra : ''}`);
  return ok;
}

function section(name) {
  console.log(`\n══════════════════════════════════════════`);
  console.log(`  ${name}`);
  console.log(`══════════════════════════════════════════`);
}

(async () => {
  // ============ 1. AUTH ============
  section('1. AUTH SCREEN — POST /auth/login (docs §1)');
  const login = await req('POST', '/auth/login', { body: { login_id: 'admin', password: 'Admin@123' } });
  check('Login', 'valid credentials', login.status, 200);
  check('Login', 'user.login_id', login.body?.user?.login_id, 'admin');
  check('Login', 'user.role', login.body?.user?.role, 'admin');
  const cookieOk = login.setCookie?.[0]?.includes('Max-Age=900');
  check('Login', 'cookie Max-Age=900 (15 min)', cookieOk, true);
  cookie = login.setCookie?.[0]?.split(';')[0];

  // Wrong password → error message per docs §1 "Show error message"
  const badLogin = await req('POST', '/auth/login', { body: { login_id: 'admin', password: 'wrong' } });
  check('Login', 'wrong password → 401', badLogin.status, 401);
  check('Login', 'INVALID_CREDENTIALS code', badLogin.body?.error?.code, 'INVALID_CREDENTIALS');

  // Non-existent user
  const ghost = await req('POST', '/auth/login', { body: { login_id: 'nobody', password: 'X@1234567' } });
  check('Login', 'non-existent user → 401', ghost.status, 401);

  section('1b. AUTH ME — GET /auth/me (page refresh, docs §22.5)');
  const me = await req('GET', '/auth/me', { cookie });
  check('Auth/me', 'status after refresh', me.status, 200);
  check('Auth/me', 'login_id', me.body?.login_id, 'admin');

  section('1c. SIGNUP — POST /auth/signup (docs §2) — note: 3/hour rate limit per docs §10');
  const uniq = 'sign' + Math.floor(Math.random() * 90000 + 10000);
  const signup = await req('POST', '/auth/signup', { body: { login_id: uniq, email: uniq + '@test.com', password: 'Test@12345', confirm_password: 'Test@12345' } });
  check('Signup', 'create user', signup.status, 201);
  check('Signup', 'role forced to user', signup.body?.role, 'user');
  check('Signup', 'NO cookie set', signup.setCookie, undefined);

  // Rate limit behavior is verified separately (docs §10: 3 signups/hour/IP)
  const weakPw = await req('POST', '/auth/signup', { body: { login_id: 'weakpw', email: 'weak@t.com', password: 'short', confirm_password: 'short' } });
  check('Signup', 'weak password → 400', weakPw.status, 400);

  section('1d. FORGOT PASSWORD — POST /auth/forgot-password (docs §22.12)');
  const fp = await req('POST', '/auth/forgot-password', { body: { email: 'admin@urbanfurniture.com' } });
  check('Forgot', 'mock message', fp.status, 200);
  check('Forgot', 'message present', typeof fp.body?.message, 'string');

  section('1e. LOGOUT — POST /auth/logout (docs §4)');
  const logout = await req('POST', '/auth/logout', { cookie });
  check('Logout', 'cookie cleared', (logout.setCookie?.[0] ?? '').includes('auth_token=;'), true);
  check('Logout', 'message', logout.body?.message, 'Logged out successfully');

  // ============ 2. DASHBOARD ============
  section('2. DASHBOARD — GET /dashboard (docs §3 kanban counts)');
  const dash = await req('GET', '/dashboard', { cookie });
  check('Dashboard', 'status', dash.status, 200);
  check('Dashboard', 'sales object', typeof dash.body?.sales, 'object');
  check('Dashboard', 'purchase object', typeof dash.body?.purchase, 'object');
  check('Dashboard', 'budgets object', typeof dash.body?.budgets, 'object');
  check('Dashboard', 'sales.total number', typeof dash.body?.sales?.total, 'number');

  // ============ 3. MASTER DATA ============
  section('3. CONTACTS (docs §4-5)');
  const contacts = await req('GET', '/contacts', { cookie });
  check('Contacts', 'list status', contacts.status, 200);
  check('Contacts', 'entity-keyed array', Array.isArray(contacts.body?.contacts), true);
  check('Contacts', 'pagination fields', typeof contacts.body?.total, 'number');

  const contact = await req('POST', '/contacts', { cookie, body: { name: 'Deep Test Customer', email: 'deepc' + Math.floor(Math.random()*90000+10000) + '@test.com', phone: '9999999999', city: 'Mumbai', state: 'MH', country: 'India', pincode: '400001' } });
  check('Contacts', 'create (all address fields)', contact.status, 201);
  check('Contacts', 'created name', contact.body?.name, 'Deep Test Customer');
  check('Contacts', 'created city', contact.body?.city, 'Mumbai');
  const customerId = contact.body.id;

  const cGet = await req('GET', `/contacts/${customerId}`, { cookie });
  check('Contacts', 'get by id', cGet.status, 200);

  const cUpd = await req('PUT', `/contacts/${customerId}`, { cookie, body: { city: 'Pune' } });
  check('Contacts', 'update city', cUpd.status, 200);
  check('Contacts', 'updated city', cUpd.body?.city, 'Pune');

  const cSearch = await req('GET', '/contacts?search=Deep+Test', { cookie });
  check('Contacts', 'search filter', cSearch.body?.contacts?.some((c) => c.name === 'Deep Test Customer'), true);

  section('4. CATEGORIES (docs §7 on-the-fly)');
  const cats = await req('GET', '/categories', { cookie });
  check('Categories', 'bare array', Array.isArray(cats.body), true);
  const cat = await req('POST', '/categories', { cookie, body: { name: 'Deep Category' } });
  check('Categories', 'create', cat.status, 201);
  const categoryId = cat.body.id;

  section('5. PRODUCTS (docs §6-7, incl. category_name on-the-fly)');
  const prods = await req('GET', '/products', { cookie });
  check('Products', 'list status', prods.status, 200);
  check('Products', 'entity-keyed', Array.isArray(prods.body?.products), true);

  // on-the-fly category creation via category_name
  const prodOnFly = await req('POST', '/products', { cookie, body: { name: 'Deep Sofa', product_type: 'goods', category_name: 'OnTheFly Cat', sales_price: 15000, cost: 9000 } });
  check('Products', 'create with on-the-fly category_name', prodOnFly.status, 201);
  check('Products', 'category_name returned', prodOnFly.body?.category_name, 'OnTheFly Cat');

  const prod = await req('POST', '/products', { cookie, body: { name: 'Deep Chair', product_type: 'goods', category_id: categoryId, sales_price: 2500, cost: 1500 } });
  check('Products', 'create with category_id', prod.status, 201);
  check('Products', 'product_type', prod.body?.product_type, 'goods');
  check('Products', 'sales_price', Number(prod.body?.sales_price), 2500);
  const productId = prod.body.id;

  const pGet = await req('GET', `/products/${productId}`, { cookie });
  check('Products', 'get by id', pGet.status, 200);

  const pUpd = await req('PUT', `/products/${productId}`, { cookie, body: { sales_price: 2800 } });
  check('Products', 'update price', pUpd.status, 200);
  check('Products', 'updated price', Number(pUpd.body?.sales_price), 2800);

  section('6. ANALYTICALS (docs §7)');
  const anas = await req('GET', '/analyticals', { cookie });
  check('Analyticals', 'bare array', Array.isArray(anas.body), true);
  const ana = await req('POST', '/analyticals', { cookie, body: { name: 'Deep Analytical', responsible_id: customerId, start_date: '2026-01-01', to_date: '2026-12-31', end_date: '2026-12-31', analytic_account: 'ANA-DEEP-001' } });
  check('Analyticals', 'create', ana.status, 201);
  check('Analyticals', 'responsible_id', ana.body?.responsible_id, customerId);
  const analyticalId = ana.body.id;

  section('7. CHART OF ACCOUNTS (docs §7)');
  const coa = await req('GET', '/chart-of-accounts', { cookie });
  check('COA', 'bare array', Array.isArray(coa.body), true);
  const arAccount = coa.body.find((a) => a.account_type === 'asset');
  const revenueAccount = coa.body.find((a) => a.account_type === 'income');
  const expenseAccount = coa.body.find((a) => a.account_type === 'expense');
  check('COA', 'AR account present', arAccount?.name, 'Accounts Receivable');
  check('COA', 'Revenue account present', revenueAccount?.name, 'Sales Revenue');

  section('8. JOURNALS (docs §7)');
  const journals = await req('GET', '/journals', { cookie });
  check('Journals', 'bare array', Array.isArray(journals.body), true);
  const saleJournal = journals.body.find((j) => j.journal_type === 'sale');
  check('Journals', 'sale journal present', saleJournal?.name, 'Sale Journal');

  section('9. JOURNAL ENTRIES (docs §14)');
  const jes = await req('GET', '/journal-entries', { cookie });
  check('JE', 'list status', jes.status, 200);
  check('JE', 'entity-keyed', Array.isArray(jes.body?.journal_entries), true);

  const je = await req('POST', '/journal-entries', { cookie, body: {
    journal_id: saleJournal.id,
    accounting_date: '2026-09-05',
    lines: [
      { account_id: arAccount.id, debit: 500, credit: 0 },
      { account_id: revenueAccount.id, debit: 0, credit: 500 },
    ],
  } });
  check('JE', 'create balanced → posted', je.status, 201);
  check('JE', 'status posted', je.body?.status, 'posted');
  check('JE', 'entry_number format', /^JE\/2026\/\d{4}$/.test(je.body?.entry_number ?? ''), true);
  const jeId = je.body.id;

  const jeUnbalanced = await req('POST', '/journal-entries', { cookie, body: {
    journal_id: saleJournal.id,
    accounting_date: '2026-09-05',
    lines: [
      { account_id: arAccount.id, debit: 100, credit: 0 },
      { account_id: revenueAccount.id, debit: 0, credit: 90 },
    ],
  } });
  check('JE', 'unbalanced → 400 UNBALANCED_JOURNAL', jeUnbalanced.status, 400);
  check('JE', 'error code', jeUnbalanced.body?.error?.code, 'UNBALANCED_JOURNAL');

  const jeGet = await req('GET', `/journal-entries/${jeId}`, { cookie });
  check('JE', 'get by id', jeGet.status, 200);
  check('JE', 'lines length', jeGet.body?.lines?.length, 2);

  const jeListFilter = await req('GET', `/journal-entries?journal_id=${saleJournal.id}&status=posted`, { cookie });
  check('JE', 'list filtered by journal+status', jeListFilter.body?.journal_entries?.length >= 1, true);

  // ============ 10. SALES FLOW ============
  section('10. SALES ORDERS (docs §10)');
  const sos = await req('GET', '/sales-orders', { cookie });
  check('SO', 'list status', sos.status, 200);
  check('SO', 'entity-keyed', Array.isArray(sos.body?.sales_orders), true);

  const so = await req('POST', '/sales-orders', { cookie, body: {
    customer_id: customerId,
    order_date: '2026-09-05',
    lines: [
      { product_id: productId, account_id: arAccount.id, quantity: 2, unit_price: 2500 },
      { product_id: productId, account_id: arAccount.id, quantity: 1, unit_price: 15000 },
    ],
  } });
  check('SO', 'create (2 lines)', so.status, 201);
  check('SO', 'so_number format', /^S\d{5}$/.test(so.body?.so_number ?? ''), true);
  check('SO', 'total_amount = 2*2500+15000', Number(so.body?.total_amount), 20000);
  check('SO', 'customer_name', so.body?.customer_name, 'Deep Test Customer');
  check('SO', 'order_date', so.body?.order_date, '2026-09-05');
  const soId = so.body.id;

  const soConfirm = await req('PUT', `/sales-orders/${soId}/confirm`, { cookie });
  check('SO', 'confirm', soConfirm.status, 200);
  check('SO', 'confirmed status', soConfirm.body?.status, 'confirmed');

  const soConfirm2 = await req('PUT', `/sales-orders/${soId}/confirm`, { cookie });
  check('SO', 'duplicate confirm → 400', soConfirm2.status, 400);

  section('11. INVOICES (docs §8-9)');
  const invs = await req('GET', '/invoices', { cookie });
  check('Invoices', 'list status', invs.status, 200);
  check('Invoices', 'entity-keyed', Array.isArray(invs.body?.invoices), true);

  const inv = await req('POST', '/invoices', { cookie, body: {
    customer_id: customerId,
    sales_order_id: soId,
    invoice_date: '2026-09-05',
    due_date: '2026-10-05',
    payment_type: 'receive',
    payment_via: 'bank',
    lines: [
      { product_id: productId, account_id: arAccount.id, quantity: 2, unit_price: 2500 },
    ],
  } });
  check('Invoices', 'create from SO', inv.status, 201);
  check('Invoices', 'invoice_reference format', /^INV\/2026\/\d{4}$/.test(inv.body?.invoice_reference ?? ''), true);
  check('Invoices', 'invoice_number format', /^INV-\d{5}$/.test(inv.body?.invoice_number ?? ''), true);
  check('Invoices', 'total', Number(inv.body?.total), 5000);
  check('Invoices', 'amount_due', Number(inv.body?.amount_due), 5000);
  check('Invoices', 'customer object', inv.body?.customer?.name, 'Deep Test Customer');
  check('Invoices', 'line product_name', inv.body?.lines?.[0]?.product_name, 'Deep Chair');
  check('Invoices', 'line qty/unit_price', [Number(inv.body?.lines?.[0]?.qty), Number(inv.body?.lines?.[0]?.unit_price)], [2, 2500]);
  const invId = inv.body.id;

  // update draft (edit invoice per docs §9)
  const invUpd = await req('PUT', `/invoices/${invId}`, { cookie, body: { due_date: '2026-11-05' } });
  check('Invoices', 'update draft', invUpd.status, 200);
  check('Invoices', 'updated due_date', invUpd.body?.due_date, '2026-11-05');

  const invConfirm = await req('POST', `/invoices/${invId}/confirm`, { cookie });
  check('Invoices', 'confirm → JE created', invConfirm.status, 200);
  check('Invoices', 'confirmed status', invConfirm.body?.status, 'confirmed');
  check('Invoices', 'journal_entry_id set', invConfirm.body?.journal_entry_id != null, true);

  const invConfirm2 = await req('POST', `/invoices/${invId}/confirm`, { cookie });
  check('Invoices', 'duplicate confirm → ALREADY_CONFIRMED', invConfirm2.body?.error?.code, 'ALREADY_CONFIRMED');

  // list filter by status
  const invFilter = await req('GET', '/invoices?status=confirmed', { cookie });
  check('Invoices', 'list filter status=confirmed', invFilter.body?.invoices?.some((i) => i.id === invId), true);

  // Print (docs §9 Print Button → PDF download)
  const print = await req('POST', `/invoices/${invId}/print`, { cookie });
  check('Invoices', 'print → PDF blob', print.buf?.subarray(0, 4)?.toString(), '%PDF');
  check('Invoices', 'print content-type', (print.body && print.buf.length > 0) ? 'pdf' : 'x', 'pdf');

  // Send (docs §9 Send Button)
  const send = await req('POST', `/invoices/${invId}/send`, { cookie, body: { email_to: 'a@b.com', subject: 'Invoice', body: 'Please pay' } });
  check('Invoices', 'send → message', send.status, 200);
  check('Invoices', 'send message', typeof send.body?.message, 'string');

  // Pay (docs §10 Payment Screen)
  const pay = await req('POST', `/invoices/${invId}/pay`, { cookie, body: { amount: 3000, payment_via: 'bank', payment_date: '2026-09-10' } });
  check('Invoices', 'partial pay', pay.status, 200);
  check('Invoices', 'amount_due reduced to 2000', Number(pay.body?.amount_due), 2000);
  check('Invoices', 'status still confirmed', pay.body?.status, 'confirmed');

  const pay2 = await req('POST', `/invoices/${invId}/pay`, { cookie, body: { amount: 2000, payment_via: 'bank', payment_date: '2026-09-12' } });
  check('Invoices', 'final pay', pay2.status, 200);
  check('Invoices', 'amount_due 0', Number(pay2.body?.amount_due), 0);
  check('Invoices', 'status paid', pay2.body?.status, 'paid');

  // Overpayment on a new invoice (docs §10 amount <= amount_due)
  const inv2 = await req('POST', '/invoices', { cookie, body: {
    customer_id: customerId,
    invoice_date: '2026-09-06',
    due_date: '2026-10-06',
    lines: [{ product_id: productId, account_id: arAccount.id, quantity: 1, unit_price: 1000 }],
  } });
  await req('POST', `/invoices/${inv2.body.id}/confirm`, { cookie });
  const overpay = await req('POST', `/invoices/${inv2.body.id}/pay`, { cookie, body: { amount: 9999, payment_via: 'bank' } });
  check('Invoices', 'overpayment → OVERPAYMENT_NOT_ALLOWED', overpay.body?.error?.code, 'OVERPAYMENT_NOT_ALLOWED');

  // Cancel (draft only) — create a draft then cancel (docs §9 Cancel Button → DELETE)
  const inv3 = await req('POST', '/invoices', { cookie, body: {
    customer_id: customerId,
    invoice_date: '2026-09-07',
    due_date: '2026-10-07',
    lines: [{ product_id: productId, account_id: arAccount.id, quantity: 1, unit_price: 100 }],
  } });
  const cancel = await req('POST', `/invoices/${inv3.body.id}/cancel`, { cookie });
  check('Invoices', 'cancel draft', cancel.status, 200);
  check('Invoices', 'cancel returns invoice', cancel.body?.id, inv3.body.id);

  // Cancel confirmed → 400
  const cancelConfirmed = await req('POST', `/invoices/${invId}/cancel`, { cookie });
  check('Invoices', 'cancel confirmed → 400', cancelConfirmed.status, 400);

  // ============ 12. PURCHASE FLOW ============
  section('12. PURCHASE ORDERS (docs §11)');
  const vendor = await req('POST', '/contacts', { cookie, body: { name: 'Deep Vendor', email: 'deepv' + Math.floor(Math.random()*90000+10000) + '@test.com' } });
  const vendorId = vendor.body.id;

  const pos = await req('GET', '/purchase-orders', { cookie });
  check('PO', 'list status', pos.status, 200);
  check('PO', 'entity-keyed', Array.isArray(pos.body?.purchase_orders), true);

  const po = await req('POST', '/purchase-orders', { cookie, body: {
    vendor_id: vendorId,
    order_date: '2026-09-05',
    lines: [{ product_id: productId, account_id: arAccount.id, quantity: 3, unit_price: 1500 }],
  } });
  check('PO', 'create', po.status, 201);
  check('PO', 'po_number format', /^P\d{5}$/.test(po.body?.po_number ?? ''), true);
  check('PO', 'total_amount', Number(po.body?.total_amount), 4500);
  check('PO', 'vendor_name', po.body?.vendor_name, 'Deep Vendor');
  const poId = po.body.id;

  const poConfirm = await req('PUT', `/purchase-orders/${poId}/confirm`, { cookie });
  check('PO', 'confirm', poConfirm.status, 200);
  check('PO', 'confirmed', poConfirm.body?.status, 'confirmed');

  section('13. BILLS (docs §11-12)');
  const bills = await req('GET', '/bills', { cookie });
  check('Bills', 'list status', bills.status, 200);
  check('Bills', 'entity-keyed', Array.isArray(bills.body?.bills), true);

  const bill = await req('POST', '/bills', { cookie, body: {
    vendor_id: vendorId,
    purchase_order_id: poId,
    bill_date: '2026-09-05',
    due_date: '2026-10-05',
    payment_type: 'send',
    payment_via: 'bank',
    lines: [{ product_id: productId, account_id: arAccount.id, quantity: 3, unit_price: 1500 }],
  } });
  check('Bills', 'create from PO', bill.status, 201);
  check('Bills', 'bill_reference format', /^Bill\/2026\/\d{4}$/.test(bill.body?.bill_reference ?? ''), true);
  check('Bills', 'total', Number(bill.body?.total), 4500);
  check('Bills', 'amount_due', Number(bill.body?.amount_due), 4500);
  check('Bills', 'vendor object', bill.body?.vendor?.name, 'Deep Vendor');
  const billId = bill.body.id;

  const billUpd = await req('PUT', `/bills/${billId}`, { cookie, body: { due_date: '2026-11-05' } });
  check('Bills', 'update draft', billUpd.status, 200);

  const billConfirm = await req('POST', `/bills/${billId}/confirm`, { cookie });
  check('Bills', 'confirm → JE', billConfirm.status, 200);
  check('Bills', 'confirmed + journal_entry_id', billConfirm.body?.status === 'confirmed' && billConfirm.body?.journal_entry_id != null, true);

  const billPay = await req('POST', `/bills/${billId}/pay`, { cookie, body: { amount: 4500, payment_via: 'bank', payment_date: '2026-09-15' } });
  check('Bills', 'pay full', billPay.status, 200);
  check('Bills', 'paid status', billPay.body?.status, 'paid');
  check('Bills', 'amount_due 0', Number(billPay.body?.amount_due), 0);

  const billPrint = await req('POST', `/bills/${billId}/print`, { cookie });
  check('Bills', 'print → PDF', billPrint.buf?.subarray(0, 4)?.toString(), '%PDF');

  const billSend = await req('POST', `/bills/${billId}/send`, { cookie, body: { email_to: 'v@b.com', subject: 'Bill', body: 'pay' } });
  check('Bills', 'send → message', billSend.status, 200);

  // ============ 14. PAYMENTS ============
  section('14. PAYMENTS (docs §13)');
  const pays = await req('GET', '/payments', { cookie });
  check('Payments', 'list status', pays.status, 200);
  check('Payments', 'entity-keyed', Array.isArray(pays.body?.payments), true);
  check('Payments', 'payment_number format', /^PAY\/2026\/\d{4}$/.test(pays.body?.payments?.[0]?.payment_number ?? ''), true);
  check('Payments', 'payment_via', pays.body?.payments?.[0]?.payment_via, 'bank');
  check('Payments', 'payment_date present', /^\d{4}-\d{2}-\d{2}$/.test(pays.body?.payments?.[0]?.payment_date ?? ''), true);

  // ============ 15. BUDGETS ============
  section('15. BUDGETS (docs §3 Analytical Budget)');
  const budgets = await req('GET', '/budgets', { cookie });
  check('Budgets', 'list status', budgets.status, 200);
  check('Budgets', 'entity-keyed', Array.isArray(budgets.body?.budgets), true);

  const budget = await req('POST', '/budgets', { cookie, body: {
    name: 'Deep Budget Q3',
    responsible_id: customerId,
    start_date: '2026-07-01',
    end_date: '2026-09-30',
    type: 'income',
    analytical_id: analyticalId,
  } });
  check('Budgets', 'create', budget.status, 201);
  check('Budgets', 'status draft', budget.body?.status, 'draft');
  check('Budgets', 'responsible object', budget.body?.responsible?.name, 'Deep Test Customer');
  const budgetId = budget.body.id;

  const budgetUpd = await req('PUT', `/budgets/${budgetId}`, { cookie, body: { name: 'Deep Budget Q3 v2' } });
  check('Budgets', 'update draft', budgetUpd.status, 200);
  check('Budgets', 'updated name', budgetUpd.body?.name, 'Deep Budget Q3 v2');

  const budgetConfirm = await req('PUT', `/budgets/${budgetId}/confirm`, { cookie, body: { committed_amount: 50000 } });
  check('Budgets', 'confirm with committed_amount', budgetConfirm.status, 200);
  check('Budgets', 'confirmed', budgetConfirm.body?.status, 'confirmed');
  check('Budgets', 'committed_amount', Number(budgetConfirm.body?.committed_amount), 50000);

  // Create invoice with analytical_id on line to track achievement
  const achInv = await req('POST', '/invoices', { cookie, body: {
    customer_id: customerId,
    invoice_date: '2026-08-01',
    due_date: '2026-09-01',
    lines: [{ product_id: productId, account_id: arAccount.id, analytical_id: analyticalId, quantity: 1, unit_price: 10000 }],
  } });
  await req('POST', `/invoices/${achInv.body.id}/confirm`, { cookie });
  const budgetGet = await req('GET', `/budgets/${budgetId}`, { cookie });
  check('Budgets', 'achieved_amount tracked', Number(budgetGet.body?.achieved_amount), 10000);
  check('Budgets', 'achieved_percentage', Number(budgetGet.body?.achieved_percentage), 20);
  check('Budgets', 'amount_to_achieve', Number(budgetGet.body?.amount_to_achieve), 40000);

  const budgetRevise = await req('POST', `/budgets/${budgetId}/revise`, { cookie });
  check('Budgets', 'revise → new draft', budgetRevise.status, 201);
  check('Budgets', 'new budget status draft', budgetRevise.body?.status, 'draft');
  check('Budgets', 'previous_budget_id link', budgetRevise.body?.previous_budget_id, budgetId);
  const revisedBudgetId = budgetRevise.body.id;

  const budgetCancel = await req('PUT', `/budgets/${budgetId}/cancel`, { cookie });
  check('Budgets', 'cancel original', budgetCancel.status, 200);
  check('Budgets', 'cancelled', budgetCancel.body?.status, 'cancelled');
  check('Budgets', 'is_archived', budgetCancel.body?.is_archived, true);

  // ============ 16. REPORTS ============
  section('16. REPORTS (docs §15-16)');
  const pnl = await req('GET', '/reports/profit-and-loss?year=2026', { cookie });
  check('P&L', 'status', pnl.status, 200);
  check('P&L', 'year', pnl.body?.year, 2026);
  check('P&L', 'income.items array', Array.isArray(pnl.body?.income?.items), true);
  check('P&L', 'income.total number', typeof pnl.body?.income?.total, 'number');
  check('P&L', 'expenses.items array', Array.isArray(pnl.body?.expenses?.items), true);
  check('P&L', 'net_income number', typeof pnl.body?.net_income, 'number');
  const pnlRevenue = pnl.body?.income?.items?.find((i) => i.account_name === 'Sales Revenue');
  check('P&L', 'Sales Revenue item present', Number(pnlRevenue?.amount) > 0, true);

  const pnlPdf = await req('GET', '/reports/profit-and-loss?year=2026&format=pdf', { cookie });
  check('P&L', 'PDF export', pnlPdf.buf?.subarray(0, 4)?.toString(), '%PDF');

  const bs = await req('GET', '/reports/balance-sheet?year=2026', { cookie });
  check('BS', 'status', bs.status, 200);
  check('BS', 'assets.items array', Array.isArray(bs.body?.assets?.items), true);
  check('BS', 'liabilities.items array', Array.isArray(bs.body?.liabilities?.items), true);
  check('BS', 'balance_check boolean', typeof bs.body?.balance_check, 'boolean');
  const liabNames = (bs.body?.liabilities?.items ?? []).map((i) => i.account_name);
  check('BS', 'liabilities include Capital/Income', liabNames.some((n) => n === 'Capital' || n === 'Sales Revenue'), true);

  const bsPdf = await req('GET', '/reports/balance-sheet?year=2026&format=pdf', { cookie });
  check('BS', 'PDF export', bsPdf.buf?.subarray(0, 4)?.toString(), '%PDF');

  const br = await req('GET', '/reports/budget-report?year=2026&type=income', { cookie });
  check('Budget Report', 'status', br.status, 200);
  check('Budget Report', 'budgets array', Array.isArray(br.body?.budgets), true);
  const brBudget = br.body?.budgets?.find((b) => b.id === budgetId || b.name.includes('Deep Budget'));
  check('Budget Report', 'budget included with achieved', Number(brBudget?.achieved_amount) >= 10000, true);

  // ============ 17. USERS (admin) ============
  section('17. USERS (docs §2.2 admin only)');
  const users = await req('GET', '/users', { cookie });
  check('Users', 'list status', users.status, 200);
  check('Users', 'entity-keyed', Array.isArray(users.body?.users), true);
  const newUser = await req('POST', '/users', { cookie, body: { name: 'Deep Accountant', login_id: 'deepacc', email: 'deepacc' + Math.floor(Math.random()*90000+10000) + '@test.com', role: 'accountant', password: 'Deep@12345', confirm_password: 'Deep@12345' } });
  check('Users', 'create accountant', newUser.status, 201);
  check('Users', 'role', newUser.body?.role, 'accountant');

  // ============ 18. UPLOAD (docs §5 image upload) ============
  section('18. UPLOAD (docs §5 image upload)');
  const boundary = '----DeepTestBoundary7MA4YWxkTrZu0gW';
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const upBody = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="deep.png"\r\nContent-Type: image/png\r\n\r\n`),
    png,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  const up = await req('POST', '/upload', { cookie, contentType: `multipart/form-data; boundary=${boundary}`, rawBody: upBody });
  check('Upload', 'image → {url}', up.status, 200);
  check('Upload', 'url starts /uploads/', up.body?.url?.startsWith('/uploads/'), true);

  const badBoundary = '----DeepTestBoundary7MA4YWxkTrZu0gW';
  const badBody = Buffer.concat([
    Buffer.from(`--${badBoundary}\r\nContent-Disposition: form-data; name="file"; filename="bad.txt"\r\nContent-Type: text/plain\r\n\r\n`),
    Buffer.from('hello'),
    Buffer.from(`\r\n--${badBoundary}--\r\n`),
  ]);
  const upBad = await req('POST', '/upload', { cookie, contentType: `multipart/form-data; boundary=${badBoundary}`, rawBody: badBody });
  check('Upload', 'invalid type → 400', upBad.status, 400);

  // ============ 19. RBAC ============
  section('19. RBAC (docs §18)');
  const accLogin = await req('POST', '/auth/login', { body: { login_id: 'accountant', password: 'Accountant@123' } });
  const accCookie = accLogin.setCookie?.[0]?.split(';')[0];
  check('RBAC', 'accountant login', accLogin.status, 200);
  check('RBAC', 'accountant → users 403', (await req('GET', '/users', { cookie: accCookie })).status, 403);
  check('RBAC', 'accountant → contacts 200', (await req('GET', '/contacts', { cookie: accCookie })).status, 200);
  check('RBAC', 'accountant → invoices 200', (await req('GET', '/invoices', { cookie: accCookie })).status, 200);
  check('RBAC', 'accountant → dashboard 200', (await req('GET', '/dashboard', { cookie: accCookie })).status, 200);

  const usrLogin = await req('POST', '/auth/login', { body: { login_id: 'user1', password: 'User@123' } });
  const usrCookie = usrLogin.setCookie?.[0]?.split(';')[0];
  check('RBAC', 'user portal login', usrLogin.status, 200);
  check('RBAC', 'user → invoices 200 (own)', (await req('GET', '/invoices', { cookie: usrCookie })).status, 200);
  check('RBAC', 'user → payments 200 (own)', (await req('GET', '/payments', { cookie: usrCookie })).status, 200);
  check('RBAC', 'user → dashboard 403', (await req('GET', '/dashboard', { cookie: usrCookie })).status, 403);
  check('RBAC', 'user → contacts 403', (await req('GET', '/contacts', { cookie: usrCookie })).status, 403);
  check('RBAC', 'user → bills 403', (await req('GET', '/bills', { cookie: usrCookie })).status, 403);
  check('RBAC', 'user → sales-orders 403', (await req('GET', '/sales-orders', { cookie: usrCookie })).status, 403);
  check('RBAC', 'user → users 403', (await req('GET', '/users', { cookie: usrCookie })).status, 403);
  check('RBAC', 'user → reports 403', (await req('GET', '/reports/profit-and-loss?year=2026', { cookie: usrCookie })).status, 403);
  check('RBAC', 'no cookie → 401', (await req('GET', '/invoices')).status, 401);

  // ============ 20. DELETE (docs: soft delete / deactivate) ============
  section('20. DELETE / DEACTIVATE');
  const delCat = await req('DELETE', `/categories/${categoryId}`, { cookie });
  check('Delete', 'category soft-delete 204', delCat.status, 204);
  const delContact = await req('DELETE', `/contacts/${customerId}`, { cookie });
  check('Delete', 'contact soft-delete 204', delContact.status, 204);
  const delProd = await req('DELETE', `/products/${productId}`, { cookie });
  check('Delete', 'product soft-delete 204', delProd.status, 204);

  // ============ SUMMARY ============
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n══════════════════════════════════════════`);
  console.log(`  DEEP TEST SUMMARY`);
  console.log(`══════════════════════════════════════════`);
  console.log(`  Total checks : ${passed + failed}`);
  console.log(`  PASSED       : ${passed}`);
  console.log(`  FAILED       : ${failed}`);
  console.log(`══════════════════════════════════════════`);
  if (failed > 0) {
    console.log('\nFailed checks:');
    results.filter((r) => !r.ok).forEach((r) => console.log(`  ❌ ${r.screen} › ${r.action}`));
  }
  process.exit(failed === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });