const http = require('http');
const fs = require('fs');

function request(method, path, { body, cookie, contentType, rawBody } = {}) {
  return new Promise((resolve, reject) => {
    const headers = { Origin: 'http://localhost:5173' };
    if (cookie) headers.Cookie = cookie;
    if (contentType) headers['Content-Type'] = contentType;
    else if (body) headers['Content-Type'] = 'application/json';
    if (rawBody) headers['Content-Length'] = Buffer.byteLength(rawBody);
    else if (body) headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
    const req = http.request({ host: 'localhost', port: 3000, path: '/api/v1' + path, method, headers }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, buf: Buffer.concat(chunks), headers: res.headers }));
    });
    req.on('error', reject);
    if (rawBody) req.write(rawBody);
    else if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async () => {
  const login = await request('POST', '/auth/login', { body: { login_id: 'admin', password: 'Admin@123' } });
  const cookie = login.headers['set-cookie']?.[0]?.split(';')[0];
  console.log('login:', login.status, 'cookie:', cookie ? 'yes' : 'no');

  const invoices = await request('GET', '/invoices', { cookie });
  const invList = JSON.parse(invoices.buf.toString());
  console.log('invoices status:', invoices.status, 'count:', invList.invoices?.length);
  const invId = invList.invoices?.[0]?.id;
  console.log('first invoice id:', invId);

  if (invId) {
    const print = await request('POST', `/invoices/${invId}/print`, { cookie });
    console.log('print status:', print.status, 'content-type:', print.headers['content-type'], 'size:', print.buf.length, 'magic:', print.buf.subarray(0, 4).toString());
  }

  const pnlPdf = await request('GET', '/reports/profit-and-loss?year=2026&format=pdf', { cookie });
  console.log('pnl pdf status:', pnlPdf.status, 'content-type:', pnlPdf.headers['content-type'], 'size:', pnlPdf.buf.length);

  const bsPdf = await request('GET', '/reports/balance-sheet?year=2026&format=pdf', { cookie });
  console.log('bs pdf status:', bsPdf.status, 'content-type:', bsPdf.headers['content-type'], 'size:', bsPdf.buf.length);

  // Upload: build a minimal multipart body manually
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const parts = [];
  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n`);
  const body = Buffer.concat([Buffer.from(parts[0]), png, Buffer.from(`\r\n--${boundary}--\r\n`)]);
  const up = await request('POST', '/upload', { cookie, contentType: `multipart/form-data; boundary=${boundary}`, rawBody: body });
  console.log('upload status:', up.status, 'body:', up.buf.toString());

  // Upload invalid type (text file) → 400
  const parts2 = [];
  parts2.push(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="bad.txt"\r\nContent-Type: text/plain\r\n\r\n`);
  const body2 = Buffer.concat([Buffer.from(parts2[0]), Buffer.from('hello'), Buffer.from(`\r\n--${boundary}--\r\n`)]);
  const up2 = await request('POST', '/upload', { cookie, contentType: `multipart/form-data; boundary=${boundary}`, rawBody: body2 });
  console.log('upload bad type status:', up2.status, 'body:', up2.buf.toString());
})().catch((e) => { console.error(e); process.exit(1); });