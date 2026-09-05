const http = require('http');

const BASE = 'http://localhost:3000/api/v1';
const ORIGIN = 'http://localhost:5173';

function request(method, path, { body, cookie, origin = ORIGIN } = {}) {
  return new Promise((resolve, reject) => {
    const headers = { Origin: origin };
    if (cookie) headers.Cookie = cookie;
    if (body) { headers['Content-Type'] = 'application/json'; }
    const req = http.request({ host: 'localhost', port: 3000, path: BASE + path, method, headers }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch {}
        const setCookie = res.headers['set-cookie'];
        const acao = res.headers['access-control-allow-origin'];
        resolve({ status: res.statusCode, body: parsed, setCookie, acao, contentType: res.headers['content-type'] });
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async () => {
  const results = [];
  const check = (name, actual, expected) => {
    const ok = actual === expected;
    results.push({ name, ok, actual, expected });
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: got ${actual}, expected ${expected}`);
  };

  // 1. Login as admin
  const login = await request('POST', '/auth/login', { body: { login_id: 'admin', password: 'Admin@123' } });
  check('login status', login.status, 200);
  check('login ACAO', login.acao, ORIGIN);
  check('login user.login_id', login.body?.user?.login_id, 'admin');
  const cookie = login.setCookie?.[0]?.split(';')[0];
  check('login sets cookie', typeof cookie, 'string');

  // 2. /auth/me
  const me = await request('GET', '/auth/me', { cookie });
  check('me status', me.status, 200);
  check('me login_id', me.body?.login_id, 'admin');

  // 3. GET /users (admin)
  const users = await request('GET', '/users', { cookie });
  check('users status', users.status, 200);
  check('users array', Array.isArray(users.body?.users), true);

  // 4. GET /contacts
  const contacts = await request('GET', '/contacts', { cookie });
  check('contacts status', contacts.status, 200);
  check('contacts keyed', Array.isArray(contacts.body?.contacts), true);

  // 5. GET /products
  const products = await request('GET', '/products', { cookie });
  check('products status', products.status, 200);
  check('products keyed', Array.isArray(products.body?.products), true);

  // 6. GET /categories (bare array)
  const categories = await request('GET', '/categories', { cookie });
  check('categories status', categories.status, 200);
  check('categories bare array', Array.isArray(categories.body), true);

  // 7. GET /analyticals (bare array)
  const analyticals = await request('GET', '/analyticals', { cookie });
  check('analyticals status', analyticals.status, 200);
  check('analyticals bare array', Array.isArray(analyticals.body), true);

  // 8. GET /chart-of-accounts (bare array)
  const coa = await request('GET', '/chart-of-accounts', { cookie });
  check('coa status', coa.status, 200);
  check('coa bare array', Array.isArray(coa.body), true);

  // 9. GET /journals (bare array)
  const journals = await request('GET', '/journals', { cookie });
  check('journals status', journals.status, 200);
  check('journals bare array', Array.isArray(journals.body), true);

  // 10. GET /journal-entries
  const jes = await request('GET', '/journal-entries', { cookie });
  check('journal-entries status', jes.status, 200);
  check('journal-entries keyed', Array.isArray(jes.body?.journal_entries), true);

  // 11. GET /sales-orders
  const sos = await request('GET', '/sales-orders', { cookie });
  check('sales-orders status', sos.status, 200);
  check('sales-orders keyed', Array.isArray(sos.body?.sales_orders), true);

  // 12. GET /purchase-orders
  const pos = await request('GET', '/purchase-orders', { cookie });
  check('purchase-orders status', pos.status, 200);
  check('purchase-orders keyed', Array.isArray(pos.body?.purchase_orders), true);

  // 13. GET /invoices
  const invoices = await request('GET', '/invoices', { cookie });
  check('invoices status', invoices.status, 200);
  check('invoices keyed', Array.isArray(invoices.body?.invoices), true);

  // 14. GET /bills
  const bills = await request('GET', '/bills', { cookie });
  check('bills status', bills.status, 200);
  check('bills keyed', Array.isArray(bills.body?.bills), true);

  // 15. GET /payments
  const payments = await request('GET', '/payments', { cookie });
  check('payments status', payments.status, 200);
  check('payments keyed', Array.isArray(payments.body?.payments), true);

  // 16. GET /budgets
  const budgets = await request('GET', '/budgets', { cookie });
  check('budgets status', budgets.status, 200);
  check('budgets keyed', Array.isArray(budgets.body?.budgets), true);

  // 17. GET /dashboard
  const dash = await request('GET', '/dashboard', { cookie });
  check('dashboard status', dash.status, 200);
  check('dashboard.sales', typeof dash.body?.sales, 'object');
  check('dashboard.purchase', typeof dash.body?.purchase, 'object');
  check('dashboard.budgets', typeof dash.body?.budgets, 'object');

  // 18. GET /reports/profit-and-loss
  const pnl = await request('GET', '/reports/profit-and-loss?year=2026', { cookie });
  check('pnl status', pnl.status, 200);
  check('pnl net_income', typeof pnl.body?.net_income, 'number');
  check('pnl income.items', Array.isArray(pnl.body?.income?.items), true);

  // 19. GET /reports/balance-sheet
  const bs = await request('GET', '/reports/balance-sheet?year=2026', { cookie });
  check('bs status', bs.status, 200);
  check('bs balance_check', typeof bs.body?.balance_check, 'boolean');
  check('bs assets.items', Array.isArray(bs.body?.assets?.items), true);

  // 20. GET /reports/budget-report
  const br = await request('GET', '/reports/budget-report?year=2026', { cookie });
  check('budget-report status', br.status, 200);
  check('budget-report budgets', Array.isArray(br.body?.budgets), true);

  // 21. POST /auth/forgot-password
  const fp = await request('POST', '/auth/forgot-password', { body: { email: 'admin@urbanfurniture.com' } });
  check('forgot-password status', fp.status, 200);
  check('forgot-password message', typeof fp.body?.message, 'string');

  // 22. Logout
  const logout = await request('POST', '/auth/logout', { cookie });
  check('logout status', logout.status, 200);
  check('logout clears cookie', (logout.setCookie?.[0] ?? '').includes('auth_token=;'), true);

  // 23. 401 after logout (no cookie sent — browser clears it client-side)
  const afterLogout = await request('GET', '/auth/me');
  check('me after logout 401', afterLogout.status, 401);

  // 24. Unauthenticated invoice list 401
  const noAuth = await request('GET', '/invoices');
  check('invoices without cookie 401', noAuth.status, 401);

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n=== ${passed}/${results.length} checks passed ===`);
  process.exit(passed === results.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });