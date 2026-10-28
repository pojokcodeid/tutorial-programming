/* ============================================================
   lab.test.js — pengujian otomatis laboratorium HTTP
   Jalankan: node --test examples/http-lab/lab.test.js
   ============================================================ */
'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createLabServer } = require('./server');
const { createProxyServer } = require('./proxy');

let server;
let proxy;
let base;
let proxyBase;

before(async () => {
  server = createLabServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = 'http://127.0.0.1:' + server.address().port;

  proxy = createProxyServer({ target: base, timeoutMs: 250 });
  await new Promise((resolve) => proxy.listen(0, '127.0.0.1', resolve));
  proxyBase = 'http://127.0.0.1:' + proxy.address().port;
});

after(async () => {
  await new Promise((resolve) => proxy.close(resolve));
  await new Promise((resolve) => server.close(resolve));
});

test('health merespons 200 dan X-Request-Id', async () => {
  const res = await fetch(base + '/health');
  assert.equal(res.status, 200);
  assert.ok(res.headers.get('x-request-id'));
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(data.service, 'http-lab');
});

test('echo mengembalikan method, query, header, dan body', async () => {
  const res = await fetch(base + '/echo?topik=http&page=2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Demo': 'ya' },
    body: JSON.stringify({ pesan: 'halo' })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.method, 'POST');
  assert.equal(data.query.topik, 'http');
  assert.equal(data.query.page, '2');
  assert.equal(data.headers['x-demo'], 'ya');
  assert.match(data.body, /halo/);
});

test('status code dapat dipilih dan 204 tidak berbody', async () => {
  const created = await fetch(base + '/status/201');
  assert.equal(created.status, 201);

  const noContent = await fetch(base + '/status/204');
  assert.equal(noContent.status, 204);
  assert.equal(await noContent.text(), '');

  const notFound = await fetch(base + '/status/404');
  assert.equal(notFound.status, 404);
});

test('HEAD mengirim header tanpa body', async () => {
  const res = await fetch(base + '/health', { method: 'HEAD' });
  assert.equal(res.status, 200);
  assert.ok(Number(res.headers.get('content-length')) > 0);
  assert.equal(await res.text(), '');
});

test('CRUD produk, validasi, dan idempotency key', async () => {
  const list = await fetch(base + '/products?page=1&limit=2');
  assert.equal(list.status, 200);
  const page = await list.json();
  assert.equal(page.items.length, 2);
  assert.ok(page.total >= 3);

  const wrongType = await fetch(base + '/products', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: 'bukan json'
  });
  assert.equal(wrongType.status, 415);

  const invalid = await fetch(base + '/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'A', price: -1, stock: 1.5 })
  });
  assert.equal(invalid.status, 422);

  const payload = { name: 'Produk Uji ' + Date.now(), price: 12345, stock: 7 };
  const create = await fetch(base + '/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': 'test-' + Date.now()
    },
    body: JSON.stringify(payload)
  });
  assert.equal(create.status, 201);
  assert.ok(create.headers.get('location'));
  const product = await create.json();
  assert.equal(product.name, payload.name);

  const detail = await fetch(base + '/products/' + product.id);
  assert.equal(detail.status, 200);

  const patch = await fetch(base + '/products/' + product.id, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stock: 9 })
  });
  assert.equal(patch.status, 200);
  assert.equal((await patch.json()).stock, 9);

  const remove = await fetch(base + '/products/' + product.id, { method: 'DELETE' });
  assert.equal(remove.status, 204);

  const gone = await fetch(base + '/products/' + product.id);
  assert.equal(gone.status, 404);
});

test('login, bearer token, otorisasi, dan logout', async () => {
  const login = await fetch(base + '/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'nina', password: 'rahasia123' })
  });
  assert.equal(login.status, 200);
  const session = await login.json();
  assert.ok(session.access_token);
  assert.equal(session.user.role, 'user');
  assert.ok(login.headers.get('set-cookie'));

  const profile = await fetch(base + '/profile', {
    headers: { Authorization: 'Bearer ' + session.access_token }
  });
  assert.equal(profile.status, 200);

  const adminAsUser = await fetch(base + '/admin', {
    headers: { Authorization: 'Bearer ' + session.access_token }
  });
  assert.equal(adminAsUser.status, 403);

  const wrong = await fetch(base + '/profile', {
    headers: { Authorization: 'Bearer token-palsu' }
  });
  assert.equal(wrong.status, 401);

  const logout = await fetch(base + '/logout', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + session.access_token }
  });
  assert.equal(logout.status, 204);

  const afterLogout = await fetch(base + '/profile', {
    headers: { Authorization: 'Bearer ' + session.access_token }
  });
  assert.equal(afterLogout.status, 401);
});

test('cache memakai ETag dan menghasilkan 304', async () => {
  const first = await fetch(base + '/cache');
  assert.equal(first.status, 200);
  const etag = first.headers.get('etag');
  assert.ok(etag);
  assert.match(first.headers.get('cache-control'), /max-age=60/);

  const second = await fetch(base + '/cache', {
    headers: { 'If-None-Match': etag }
  });
  assert.equal(second.status, 304);
  assert.equal(await second.text(), '');

  const privateRes = await fetch(base + '/private');
  assert.match(privateRes.headers.get('cache-control'), /no-store/);
});

test('content negotiation memilih format sesuai Accept', async () => {
  const json = await fetch(base + '/negotiate', { headers: { Accept: 'application/json' } });
  assert.equal(json.status, 200);
  assert.match(json.headers.get('content-type'), /application\/json/);

  const html = await fetch(base + '/negotiate', { headers: { Accept: 'text/html' } });
  assert.equal(html.status, 200);
  assert.match(html.headers.get('content-type'), /text\/html/);

  const no = await fetch(base + '/negotiate', { headers: { Accept: 'image/png' } });
  assert.equal(no.status, 406);
});

test('CORS preflight dan respons dengan Origin', async () => {
  const preflight = await fetch(base + '/cors', {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:8123',
      'Access-Control-Request-Method': 'POST'
    }
  });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), 'http://localhost:8123');
  assert.match(preflight.headers.get('access-control-allow-methods'), /POST/);

  const get = await fetch(base + '/cors', {
    headers: { Origin: 'http://localhost:8123' }
  });
  assert.equal(get.headers.get('access-control-allow-origin'), 'http://localhost:8123');
});

test('range request menghasilkan 206 Partial Content', async () => {
  const res = await fetch(base + '/range/sample.txt', {
    headers: { Range: 'bytes=0-9' }
  });
  assert.equal(res.status, 206);
  assert.match(res.headers.get('content-range'), /^bytes 0-9\//);
  assert.equal((await res.text()).length, 10);
});

test('gzip dan upload bekerja', async () => {
  const compressed = await fetch(base + '/gzip', {
    headers: { 'Accept-Encoding': 'gzip' }
  });
  assert.equal(compressed.status, 200);
  assert.equal(compressed.headers.get('content-encoding'), 'gzip');

  const uploadBody = 'isi file latihan';
  const upload = await fetch(base + '/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: uploadBody
  });
  assert.equal(upload.status, 201);
  const info = await upload.json();
  assert.equal(info.received_bytes, Buffer.byteLength(uploadBody));
});

test('rate limit mengembalikan 429 setelah batas', async () => {
  let last;
  for (let i = 0; i < 6; i += 1) {
    last = await fetch(base + '/rate');
  }
  assert.equal(last.status, 429);
  assert.ok(last.headers.get('retry-after'));
});

test('proxy meneruskan request, mensimulasikan 502 dan 504', async () => {
  const ok = await fetch(proxyBase + '/health');
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get('x-proxy'), 'http-lab');
  assert.ok(ok.headers.get('x-proxy-request-id'));

  const down = await fetch(proxyBase + '/__down');
  assert.equal(down.status, 502);

  const timeout = await fetch(proxyBase + '/slow?ms=600');
  assert.equal(timeout.status, 504);
});
