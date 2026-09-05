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
  const ok = actual === expected;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: ${actual} ${ok ? '' : '!= ' + expected}`);
};

(async () => {
  // Accountant login
  const acc = await request('POST', '/auth/login', { body: { login_id: 'accountant', password: 'Accountant@123' } });
  check('accountant login', acc.status, 200);
  const accCookie = acc.setCookie?.[0]?.split(';')[0];
  check('accountant role', acc.body?.user?.role, 'accountant');

  // Accountant can access master data + invoices + reports
  check('accountant contacts', (await request('GET', '/contacts', { cookie: accCookie })).status, 200);
  check('accountant invoices', (await request('GET', '/invoices', { cookie: accCookie })).status, 200);
  check('accountant dashboard', (await request('GET', '/dashboard', { cookie: accCookie })).status, 200);
  check('accountant reports', (await request('GET', '/reports/profit-and-loss?year=2026', { cookie: accCookie })).status, 200);
  check('accountant users 403', (await request('GET', '/users', { cookie: accCookie })).status, 403);

  // User portal login
  const usr = await request('POST', '/auth/login', { body: { login_id: 'user1', password: 'User@123' } });
  check('user login', usr.status, 200);
  const usrCookie = usr.setCookie?.[0]?.split(';')[0];
  check('user role', usr.body?.user?.role, 'user');

  // User portal: invoices OK, everything else 403
  check('user invoices 200', (await request('GET', '/invoices', { cookie: usrCookie })).status, 200);
  check('user payments 200', (await request('GET', '/payments', { cookie: usrCookie })).status, 200);
  check('user dashboard 403', (await request('GET', '/dashboard', { cookie: usrCookie })).status, 403);
  check('user contacts 403', (await request('GET', '/contacts', { cookie: usrCookie })).status, 403);
  check('user bills 403', (await request('GET', '/bills', { cookie: usrCookie })).status, 403);
  check('user sales-orders 403', (await request('GET', '/sales-orders', { cookie: usrCookie })).status, 403);
  check('user reports 403', (await request('GET', '/reports/profit-and-loss?year=2026', { cookie: usrCookie })).status, 403);
  check('user users 403', (await request('GET', '/users', { cookie: usrCookie })).status, 403);

  console.log('\nRBAC checks complete.');
})().catch((e) => { console.error(e); process.exit(1); });