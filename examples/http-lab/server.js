/* ============================================================
   server.js — laboratorium HTTP lokal (tanpa dependensi)
   Jalankan:  node examples/http-lab/server.js
   Buka:      http://localhost:8787/
   HTTPS:     node examples/http-lab/server.js --https
              (sertifikat lokal lihat README.md)

   Server ini sengaja dibuat kecil dan transparan agar setiap
   perilaku HTTP yang dipelajari bisa diamati langsung dengan
   curl atau DevTools. Jangan dipakai di produksi.
   ============================================================ */
'use strict';

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 8787);
const MAX_BODY = 1024 * 1024; // 1 MiB
const COOKIE_NAME = 'sid';
const TOKEN_TTL_MS = 60 * 60 * 1000;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 1000;

const DEMO_USERS = {
  nina: { username: 'nina', password: 'rahasia123', role: 'user', name: 'Nina' },
  admin: { username: 'admin', password: 'admin123', role: 'admin', name: 'Admin Lab' }
};

const DEFAULT_ORIGINS = [
  'http://localhost:8123',
  'http://127.0.0.1:8123',
  'http://localhost:8787',
  'http://127.0.0.1:8787'
];

function allowedOrigins() {
  return (process.env.CORS_ORIGINS || DEFAULT_ORIGINS.join(','))
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function createState() {
  return {
    start: new Date(),
    nextId: 4,
    products: [
      { id: 1, name: 'Kopi Arabika', price: 85000, stock: 12, created_at: '2026-01-02T08:00:00.000Z' },
      { id: 2, name: 'Teh Melati', price: 32000, stock: 30, created_at: '2026-01-03T08:00:00.000Z' },
      { id: 3, name: 'Cokelat Bubuk', price: 47000, stock: 8, created_at: '2026-01-04T08:00:00.000Z' }
    ],
    sessions: new Map(),
    tokens: new Map(),
    idempotency: new Map(),
    rate: new Map()
  };
}

function requestId() {
  return crypto.randomUUID();
}

function parseCookies(header) {
  const out = {};
  String(header || '').split(';').forEach((part) => {
    const i = part.indexOf('=');
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function sameOriginAllowed(req) {
  const origin = req.headers.origin;
  if (!origin) return null;
  return allowedOrigins().includes(origin) ? origin : null;
}

function corsHeaders(req) {
  const origin = sameOriginAllowed(req);
  if (!origin) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Expose-Headers': 'X-Request-Id, ETag, Location, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset',
    Vary: 'Origin'
  };
}

function baseHeaders(req, extra) {
  const headers = {
    'X-Request-Id': req.requestId || requestId(),
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'",
    ...corsHeaders(req),
    ...(extra || {})
  };
  if (req.socket && req.socket.encrypted) {
    headers['Strict-Transport-Security'] = 'max-age=300';
  }
  return headers;
}

function send(req, res, status, body, headers) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(body == null ? '' : String(body));
  const h = baseHeaders(req, headers);
  if (!h['Content-Type']) h['Content-Type'] = 'text/plain; charset=utf-8';
  const empty = status === 204 || status === 304 || status === 101;
  h['Content-Length'] = String(empty ? 0 : buf.length);
  res.writeHead(status, h);
  if (req.isHead || empty) {
    res.end();
  } else {
    res.end(buf);
  }
}

function json(req, res, status, data, headers) {
  send(req, res, status, JSON.stringify(data, null, 2), {
    'Content-Type': 'application/json; charset=utf-8',
    ...(headers || {})
  });
}

function html(req, res, status, body, headers) {
  send(req, res, status, body, {
    'Content-Type': 'text/html; charset=utf-8',
    ...(headers || {})
  });
}

function methodNotAllowed(req, res, allow) {
  json(req, res, 405, {
    error: 'method_not_allowed',
    message: 'Method ' + req.method + ' tidak didukung untuk endpoint ini.',
    allow
  }, { Allow: allow.join(', ') });
}

function readBody(req, limit) {
  const max = limit || MAX_BODY;
  return new Promise((resolve, reject) => {
    let size = 0;
    let tooLarge = false;
    const chunks = [];
    req.on('data', (chunk) => {
      if (tooLarge) return;
      size += chunk.length;
      if (size > max) {
        tooLarge = true;
        chunks.length = 0;
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (tooLarge) {
        const err = new Error('Body terlalu besar');
        err.code = 'BODY_TOO_LARGE';
        reject(err);
        return;
      }
      resolve(Buffer.concat(chunks));
    });
    req.on('error', reject);
  });
}

function contentType(req) {
  return String(req.headers['content-type'] || '').toLowerCase();
}

function parseJsonBody(buf) {
  const text = buf.toString('utf8').trim();
  if (!text) return { ok: true, value: {} };
  try {
    const value = JSON.parse(text);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { ok: false, error: 'Body JSON harus berupa objek.' };
    }
    return { ok: true, value };
  } catch (err) {
    return { ok: false, error: 'JSON tidak valid: ' + err.message };
  }
}

function currentUser(req, state) {
  const now = Date.now();
  const cookies = parseCookies(req.headers.cookie);
  const sid = cookies[COOKIE_NAME];
  if (sid) {
    const session = state.sessions.get(sid);
    if (session && session.expires > now) return session.user;
  }
  const auth = String(req.headers.authorization || '');
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (match) {
    const token = state.tokens.get(match[1]);
    if (token && token.expires > now) return token.user;
  }
  return null;
}

function publicUser(user) {
  return { username: user.username, name: user.name, role: user.role };
}

function validateProduct(input) {
  const errors = [];
  if (typeof input.name !== 'string' || input.name.trim().length < 2 || input.name.trim().length > 80) {
    errors.push('name wajib berupa teks 2–80 karakter.');
  }
  if (typeof input.price !== 'number' || !Number.isFinite(input.price) || input.price < 0) {
    errors.push('price wajib berupa angka >= 0.');
  }
  if (typeof input.stock !== 'number' || !Number.isInteger(input.stock) || input.stock < 0) {
    errors.push('stock wajib berupa bilangan bulat >= 0.');
  }
  return errors;
}

function productPayload(input) {
  return {
    name: String(input.name).trim(),
    price: input.price,
    stock: input.stock
  };
}

function dashboard() {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>HTTP Lab — Belajar Koding</title>
  <style>
    :root { color-scheme: light dark; }
    body { font-family: system-ui, -apple-system, Segoe UI, sans-serif; max-width: 920px; margin: 0 auto; padding: 28px 18px 60px; line-height: 1.55; }
    h1 { margin-bottom: 4px; }
    .sub { color: #667085; margin-top: 0; }
    code, pre { background: rgba(127,127,127,.14); border-radius: 6px; }
    code { padding: 2px 5px; }
    pre { padding: 14px; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; margin: 18px 0; }
    th, td { border-bottom: 1px solid rgba(127,127,127,.3); padding: 8px 10px; text-align: left; vertical-align: top; }
    th { background: rgba(127,127,127,.10); }
    .note { border-left: 4px solid #0f766e; padding: 10px 14px; background: rgba(15,118,110,.08); }
    .warn { border-left: 4px solid #b45309; padding: 10px 14px; background: rgba(180,83,9,.08); }
  </style>
</head>
<body>
  <h1>HTTP Lab</h1>
  <p class="sub">Server latihan lokal untuk tutorial HTTP — jalankan dengan <code>node examples/http-lab/server.js</code>.</p>
  <div class="note">Semua data disimpan di memori dan kembali ke data awal saat server dijalankan ulang. Jangan memakai kredensial asli di sini.</div>
  <h2>Endpoint untuk dicoba</h2>
  <table>
    <thead><tr><th>Endpoint</th><th>Kegunaan</th></tr></thead>
    <tbody>
      <tr><td><code>GET /health</code></td><td>Memastikan server hidup.</td></tr>
      <tr><td><code>/echo</code></td><td>Mengembalikan method, query, header, dan body yang kamu kirim.</td></tr>
      <tr><td><code>GET /headers</code></td><td>Melihat seluruh request header.</td></tr>
      <tr><td><code>GET /status/404</code></td><td>Mengembalikan status code tertentu (200–599).</td></tr>
      <tr><td><code>GET /redirect?to=/products</code></td><td>Contoh redirect 302 dengan header Location.</td></tr>
      <tr><td><code>/products</code></td><td>CRUD katalog produk dengan pagination dan validasi.</td></tr>
      <tr><td><code>POST /login</code></td><td>Login demo: <code>nina/rahasia123</code> atau <code>admin/admin123</code>.</td></tr>
      <tr><td><code>GET /profile</code></td><td>Butuh cookie sesi atau bearer token.</td></tr>
      <tr><td><code>GET /admin</code></td><td>Hanya untuk pengguna dengan role admin.</td></tr>
      <tr><td><code>GET /cache</code></td><td>ETag, Cache-Control, dan respons 304.</td></tr>
      <tr><td><code>GET /private</code></td><td>Contoh respons <code>no-store</code>.</td></tr>
      <tr><td><code>GET /negotiate</code></td><td>Content negotiation berdasarkan header Accept.</td></tr>
      <tr><td><code>POST /upload</code></td><td>Menghitung ukuran dan SHA-256 body yang dikirim.</td></tr>
      <tr><td><code>GET /cors</code></td><td>Contoh respons CORS; coba juga preflight OPTIONS.</td></tr>
      <tr><td><code>GET /rate</code></td><td>Rate limit 5 request per 10 detik.</td></tr>
      <tr><td><code>GET /slow?ms=2000</code></td><td>Respons lambat untuk latihan timeout.</td></tr>
      <tr><td><code>GET /range/sample.txt</code></td><td>Range request dan <code>206 Partial Content</code>.</td></tr>
      <tr><td><code>GET /gzip</code></td><td>Respons terkompresi bila client mengirim Accept-Encoding.</td></tr>
      <tr><td><code>GET /version</code></td><td>Versi HTTP yang dipakai koneksi ini.</td></tr>
    </tbody>
  </table>
  <h2>Contoh pertama</h2>
  <pre>curl -i http://localhost:8787/health
curl -i "http://localhost:8787/echo?topik=http"
curl -i -X POST http://localhost:8787/products \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Gula Aren","price":25000,"stock":20}'</pre>
  <div class="warn">Lab ini hanya untuk belajar di komputer sendiri. Jangan membuka port ini ke internet dan jangan memakai data pribadi asli.</div>
</body>
</html>`;
}

async function handle(req, res, state) {
  req.requestId = requestId();
  req.originalMethod = req.method;
  req.isHead = req.method === 'HEAD';
  // HEAD memiliki semantik GET, hanya response body yang tidak dikirim.
  if (req.isHead) req.method = 'GET';
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.originalMethod} ${req.url} -> ${res.statusCode} (${req.requestId})`);
  });

  let url;
  try {
    url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  } catch (err) {
    return json(req, res, 400, { error: 'bad_request', message: 'URL tidak valid.' });
  }

  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch (err) {
    return json(req, res, 400, { error: 'bad_request', message: 'Path mengandung encoding tidak valid.' });
  }

  if (req.method === 'OPTIONS') {
    return send(req, res, 204, '', {
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Idempotency-Key, X-Demo',
      'Access-Control-Max-Age': '600'
    });
  }

  if (pathname === '/' && req.method === 'GET') {
    return html(req, res, 200, dashboard());
  }

  if (pathname === '/health') {
    if (req.method !== 'GET') return methodNotAllowed(req, res, ['GET']);
    return json(req, res, 200, {
      ok: true,
      service: 'http-lab',
      started_at: state.start.toISOString(),
      http_version: req.httpVersion,
      encrypted: Boolean(req.socket.encrypted)
    });
  }

  if (pathname === '/headers') {
    if (req.method !== 'GET') return methodNotAllowed(req, res, ['GET']);
    return json(req, res, 200, { headers: req.headers, request_id: req.requestId });
  }

  if (pathname === '/echo') {
    const allowed = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'];
    if (!allowed.includes(req.method)) return methodNotAllowed(req, res, allowed);
    let body = '';
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const buf = await readBody(req);
      body = buf.toString('utf8');
    }
    return json(req, res, 200, {
      method: req.method,
      path: pathname,
      query: Object.fromEntries(url.searchParams.entries()),
      headers: req.headers,
      body,
      http_version: req.httpVersion,
      remote_address: req.socket.remoteAddress
    });
  }

  if (pathname === '/version') {
    if (req.method !== 'GET') return methodNotAllowed(req, res, ['GET']);
    return json(req, res, 200, {
      http_version: req.httpVersion,
      encrypted: Boolean(req.socket.encrypted),
      message: 'Versi HTTP ditentukan oleh negosiasi client dan server.'
    });
  }

  if (pathname === '/status') {
    return json(req, res, 400, { error: 'bad_request', message: 'Gunakan /status/{kode}, misalnya /status/201.' });
  }

  const statusMatch = pathname.match(/^\/status\/(\d{3})$/);
  if (statusMatch) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return methodNotAllowed(req, res, ['GET', 'HEAD']);
    const code = Number(statusMatch[1]);
    if (code < 200 || code > 599) {
      return json(req, res, 400, { error: 'bad_request', message: 'Gunakan status 200–599.' });
    }
    const extra = {};
    if (code >= 300 && code < 400) extra.Location = '/products';
    if (code === 401) extra['WWW-Authenticate'] = 'Bearer realm="http-lab"';
    if (code === 429) extra['Retry-After'] = '10';
    if (code === 204 || code === 304) return send(req, res, code, '', extra);
    return json(req, res, code, {
      requested_status: code,
      message: 'Respons ini sengaja memakai status ' + code + '.',
      request_id: req.requestId
    }, extra);
  }

  if (pathname === '/redirect') {
    if (req.method !== 'GET') return methodNotAllowed(req, res, ['GET']);
    const to = url.searchParams.get('to') || '/products';
    if (!to.startsWith('/')) {
      return json(req, res, 400, {
        error: 'bad_request',
        message: 'Contoh ini hanya mengizinkan tujuan relatif yang diawali / agar tidak menjadi open redirect.'
      });
    }
    return send(req, res, 302, 'Redirect ke ' + to, { Location: to });
  }

  if (pathname === '/login') {
    if (req.method !== 'POST') return methodNotAllowed(req, res, ['POST']);
    const buf = await readBody(req);
    let input;
    if (contentType(req).includes('application/json')) {
      const parsed = parseJsonBody(buf);
      if (!parsed.ok) return json(req, res, 400, { error: 'invalid_json', message: parsed.error });
      input = parsed.value;
    } else if (contentType(req).includes('application/x-www-form-urlencoded')) {
      input = Object.fromEntries(new URLSearchParams(buf.toString('utf8')).entries());
    } else {
      return json(req, res, 415, {
        error: 'unsupported_media_type',
        message: 'Gunakan application/json atau application/x-www-form-urlencoded.'
      });
    }
    const user = DEMO_USERS[String(input.username || '')];
    if (!user || user.password !== String(input.password || '')) {
      return json(req, res, 401, {
        error: 'invalid_credentials',
        message: 'Username atau password demo salah.'
      }, { 'WWW-Authenticate': 'Bearer realm="http-lab"' });
    }
    const sid = crypto.randomBytes(18).toString('hex');
    const token = crypto.randomBytes(24).toString('hex');
    const expires = Date.now() + TOKEN_TTL_MS;
    state.sessions.set(sid, { user, expires });
    state.tokens.set(token, { user, expires });
    const cookie = COOKIE_NAME + '=' + sid + '; HttpOnly; SameSite=Lax; Path=/; Max-Age=3600' + (req.socket.encrypted ? '; Secure' : '');
    return json(req, res, 200, {
      access_token: token,
      token_type: 'Bearer',
      expires_in: 3600,
      user: publicUser(user)
    }, { 'Set-Cookie': cookie, 'Cache-Control': 'no-store' });
  }

  if (pathname === '/logout') {
    if (req.method !== 'POST') return methodNotAllowed(req, res, ['POST']);
    const cookies = parseCookies(req.headers.cookie);
    if (cookies[COOKIE_NAME]) state.sessions.delete(cookies[COOKIE_NAME]);
    const auth = String(req.headers.authorization || '');
    const match = auth.match(/^Bearer\s+(.+)$/i);
    if (match) state.tokens.delete(match[1]);
    return send(req, res, 204, '', {
      'Set-Cookie': COOKIE_NAME + '=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'
    });
  }

  if (pathname === '/profile') {
    if (req.method !== 'GET') return methodNotAllowed(req, res, ['GET']);
    const user = currentUser(req, state);
    if (!user) {
      return json(req, res, 401, {
        error: 'unauthorized',
        message: 'Kirim cookie sesi atau header Authorization: Bearer <token>.'
      }, { 'WWW-Authenticate': 'Bearer realm="http-lab"' });
    }
    return json(req, res, 200, { user: publicUser(user), authenticated_at: 'sesi demo' }, { 'Cache-Control': 'no-store' });
  }

  if (pathname === '/admin') {
    if (req.method !== 'GET') return methodNotAllowed(req, res, ['GET']);
    const user = currentUser(req, state);
    if (!user) {
      return json(req, res, 401, { error: 'unauthorized', message: 'Belum terautentikasi.' }, { 'WWW-Authenticate': 'Bearer realm="http-lab"' });
    }
    if (user.role !== 'admin') {
      return json(req, res, 403, { error: 'forbidden', message: 'Identitas valid, tetapi tidak memiliki izin admin.' });
    }
    return json(req, res, 200, { message: 'Selamat datang, admin.', user: publicUser(user) }, { 'Cache-Control': 'no-store' });
  }

  if (pathname === '/cache') {
    if (req.method !== 'GET') return methodNotAllowed(req, res, ['GET']);
    const body = JSON.stringify({
      message: 'Respons ini boleh disimpan cache dan divalidasi dengan ETag.',
      version: '1',
      generated_at: state.start.toISOString()
    }, null, 2);
    const etag = '"' + crypto.createHash('sha1').update(body).digest('hex').slice(0, 20) + '"';
    const headers = {
      ETag: etag,
      'Cache-Control': 'public, max-age=60',
      'Last-Modified': state.start.toUTCString()
    };
    if (req.headers['if-none-match'] === etag) {
      return send(req, res, 304, '', headers);
    }
    return send(req, res, 200, body, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  }

  if (pathname === '/private') {
    if (req.method !== 'GET') return methodNotAllowed(req, res, ['GET']);
    return json(req, res, 200, {
      message: 'Data sensitif tidak boleh disimpan cache bersama.',
      policy: 'no-store'
    }, { 'Cache-Control': 'no-store' });
  }

  if (pathname === '/negotiate') {
    if (req.method !== 'GET') return methodNotAllowed(req, res, ['GET']);
    const accept = String(req.headers.accept || '*/*').toLowerCase();
    const vary = { Vary: 'Accept' };
    if (accept.includes('application/json') || accept.includes('*/*')) {
      return json(req, res, 200, { format: 'json', message: 'Respons dipilih berdasarkan header Accept.' }, vary);
    }
    if (accept.includes('text/html')) {
      return html(req, res, 200, '<!DOCTYPE html><html lang="id"><body><h1>Format HTML</h1><p>Kamu meminta text/html.</p></body></html>', vary);
    }
    if (accept.includes('text/plain')) {
      return send(req, res, 200, 'Format teks biasa.', { 'Content-Type': 'text/plain; charset=utf-8', ...vary });
    }
    return json(req, res, 406, {
      error: 'not_acceptable',
      message: 'Server tidak memiliki representasi yang cocok dengan Accept yang diminta.'
    }, vary);
  }

  if (pathname === '/upload') {
    if (req.method !== 'POST') return methodNotAllowed(req, res, ['POST']);
    const buf = await readBody(req);
    return json(req, res, 201, {
      received_bytes: buf.length,
      content_type: req.headers['content-type'] || null,
      sha256: crypto.createHash('sha256').update(buf).digest('hex'),
      message: 'Body diterima. Untuk file multipart, bagian file tidak diurai oleh lab ini.'
    });
  }

  if (pathname === '/cors') {
    if (req.method !== 'GET') return methodNotAllowed(req, res, ['GET']);
    return json(req, res, 200, {
      origin: req.headers.origin || null,
      allowed_origin: sameOriginAllowed(req),
      credentials_allowed: Boolean(sameOriginAllowed(req)),
      message: 'Bandingkan respons ini saat Origin diizinkan dan tidak diizinkan.'
    }, { Vary: 'Origin' });
  }

  if (pathname === '/rate') {
    if (req.method !== 'GET') return methodNotAllowed(req, res, ['GET']);
    const key = req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    let bucket = state.rate.get(key);
    if (!bucket || bucket.reset <= now) {
      bucket = { count: 0, reset: now + RATE_WINDOW_MS };
      state.rate.set(key, bucket);
    }
    bucket.count += 1;
    const remaining = Math.max(0, RATE_LIMIT - bucket.count);
    const headers = {
      'X-RateLimit-Limit': String(RATE_LIMIT),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(Math.ceil(bucket.reset / 1000))
    };
    if (bucket.count > RATE_LIMIT) {
      return json(req, res, 429, {
        error: 'too_many_requests',
        message: 'Batas 5 request per 10 detik tercapai. Coba lagi setelah jendela waktu berikutnya.',
        retry_after_seconds: Math.max(1, Math.ceil((bucket.reset - now) / 1000))
      }, { ...headers, 'Retry-After': String(Math.max(1, Math.ceil((bucket.reset - now) / 1000))) });
    }
    return json(req, res, 200, { ok: true, count: bucket.count, limit: RATE_LIMIT }, headers);
  }

  if (pathname === '/slow') {
    if (req.method !== 'GET') return methodNotAllowed(req, res, ['GET']);
    const ms = Math.min(10000, Math.max(0, Number(url.searchParams.get('ms') || 1000)));
    await new Promise((resolve) => setTimeout(resolve, ms));
    return json(req, res, 200, { delayed_ms: ms, message: 'Respons sengaja ditunda.' });
  }

  if (pathname === '/gzip') {
    if (req.method !== 'GET') return methodNotAllowed(req, res, ['GET']);
    const accept = String(req.headers['accept-encoding'] || '').toLowerCase();
    const body = JSON.stringify({ message: 'Respons ini dapat dikompresi.', payload: 'x'.repeat(400) }, null, 2);
    if (accept.includes('br')) {
      return send(req, res, 200, zlib.brotliCompressSync(Buffer.from(body)), {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Encoding': 'br',
        Vary: 'Accept-Encoding'
      });
    }
    if (accept.includes('gzip')) {
      return send(req, res, 200, zlib.gzipSync(Buffer.from(body)), {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Encoding': 'gzip',
        Vary: 'Accept-Encoding'
      });
    }
    return send(req, res, 200, body, {
      'Content-Type': 'application/json; charset=utf-8',
      Vary: 'Accept-Encoding'
    });
  }

  if (pathname === '/range/sample.txt') {
    if (req.method !== 'GET') return methodNotAllowed(req, res, ['GET']);
    const text = 'HTTP Range memungkinkan client meminta sebagian representasi. ' +
      'Gunakan header Range: bytes=0-9 untuk mengambil sepuluh byte pertama. ' +
      'Server membalas 206 Partial Content bila rentang valid.';
    const buf = Buffer.from(text);
    const range = String(req.headers.range || '');
    const match = range.match(/^bytes=(\d*)-(\d*)$/);
    if (match) {
      const start = match[1] === '' ? Math.max(0, buf.length - Number(match[2])) : Number(match[1]);
      const end = match[2] === '' ? buf.length - 1 : Number(match[2]);
      if (start > end || start >= buf.length || end >= buf.length) {
        return send(req, res, 416, '', { 'Content-Range': 'bytes */' + buf.length });
      }
      const part = buf.subarray(start, end + 1);
      return send(req, res, 206, part, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Range': 'bytes ' + start + '-' + end + '/' + buf.length,
        'Accept-Ranges': 'bytes'
      });
    }
    return send(req, res, 200, buf, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Accept-Ranges': 'bytes'
    });
  }

  if (pathname === '/reset') {
    if (req.method !== 'POST') return methodNotAllowed(req, res, ['POST']);
    const fresh = createState();
    state.products = fresh.products;
    state.nextId = fresh.nextId;
    state.sessions.clear();
    state.tokens.clear();
    state.idempotency.clear();
    state.rate.clear();
    return json(req, res, 200, { ok: true, message: 'Data lab dikembalikan ke kondisi awal.' });
  }

  if (pathname === '/products') {
    if (req.method === 'GET') {
      const page = Math.min(1000, Math.max(1, Number(url.searchParams.get('page') || 1)));
      const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 5)));
      const q = String(url.searchParams.get('q') || '').toLowerCase();
      const filtered = state.products.filter((p) => !q || p.name.toLowerCase().includes(q));
      const start = (page - 1) * limit;
      const items = filtered.slice(start, start + limit);
      return json(req, res, 200, {
        items,
        page,
        limit,
        total: filtered.length,
        total_pages: Math.ceil(filtered.length / limit) || 0
      }, { 'Cache-Control': 'no-store' });
    }

    if (req.method === 'POST') {
      if (!contentType(req).includes('application/json')) {
        return json(req, res, 415, {
          error: 'unsupported_media_type',
          message: 'Gunakan Content-Type: application/json.'
        });
      }
      const idempotencyKey = req.headers['idempotency-key'];
      if (idempotencyKey && state.idempotency.has(String(idempotencyKey))) {
        const saved = state.idempotency.get(String(idempotencyKey));
        return send(req, res, saved.status, saved.body, { ...saved.headers, 'Idempotency-Replayed': 'true' });
      }
      const buf = await readBody(req);
      const parsed = parseJsonBody(buf);
      if (!parsed.ok) return json(req, res, 400, { error: 'invalid_json', message: parsed.error });
      const errors = validateProduct(parsed.value);
      if (errors.length) return json(req, res, 422, { error: 'validation_error', errors });
      if (state.products.some((p) => p.name.toLowerCase() === String(parsed.value.name).trim().toLowerCase())) {
        return json(req, res, 409, { error: 'conflict', message: 'Nama produk sudah ada.' });
      }
      const product = {
        id: state.nextId++,
        ...productPayload(parsed.value),
        created_at: new Date().toISOString()
      };
      state.products.push(product);
      const body = JSON.stringify(product, null, 2);
      const headers = {
        'Content-Type': 'application/json; charset=utf-8',
        Location: '/products/' + product.id,
        ETag: '"' + crypto.createHash('sha1').update(body).digest('hex').slice(0, 20) + '"'
      };
      if (idempotencyKey) {
        state.idempotency.set(String(idempotencyKey), { status: 201, body, headers });
      }
      return send(req, res, 201, body, headers);
    }

    return methodNotAllowed(req, res, ['GET', 'POST']);
  }

  const productMatch = pathname.match(/^\/products\/(\d+)$/);
  if (productMatch) {
    const id = Number(productMatch[1]);
    const index = state.products.findIndex((p) => p.id === id);
    if (index === -1) {
      return json(req, res, 404, { error: 'not_found', message: 'Produk dengan id ' + id + ' tidak ditemukan.' });
    }
    const existing = state.products[index];

    if (req.method === 'GET') {
      return json(req, res, 200, existing, { ETag: '"' + crypto.createHash('sha1').update(JSON.stringify(existing)).digest('hex').slice(0, 20) + '"' });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      if (!contentType(req).includes('application/json')) {
        return json(req, res, 415, { error: 'unsupported_media_type', message: 'Gunakan Content-Type: application/json.' });
      }
      const buf = await readBody(req);
      const parsed = parseJsonBody(buf);
      if (!parsed.ok) return json(req, res, 400, { error: 'invalid_json', message: parsed.error });
      const candidate = req.method === 'PUT'
        ? parsed.value
        : { ...existing, ...parsed.value };
      const errors = validateProduct(candidate);
      if (errors.length) return json(req, res, 422, { error: 'validation_error', errors });
      if (state.products.some((p) => p.id !== id && p.name.toLowerCase() === String(candidate.name).trim().toLowerCase())) {
        return json(req, res, 409, { error: 'conflict', message: 'Nama produk sudah dipakai produk lain.' });
      }
      state.products[index] = {
        ...existing,
        ...productPayload(candidate),
        updated_at: new Date().toISOString()
      };
      return json(req, res, 200, state.products[index]);
    }

    if (req.method === 'DELETE') {
      state.products.splice(index, 1);
      return send(req, res, 204, '');
    }

    return methodNotAllowed(req, res, ['GET', 'PUT', 'PATCH', 'DELETE']);
  }

  return json(req, res, 404, {
    error: 'not_found',
    message: 'Endpoint tidak ditemukan. Buka / untuk daftar endpoint lab.'
  });
}

function createLabServer(options) {
  const opts = options || {};
  const state = opts.state || createState();
  const handler = (req, res) => {
    handle(req, res, state).catch((err) => {
      if (err && err.code === 'BODY_TOO_LARGE') {
        return json(req, res, 413, {
          error: 'payload_too_large',
          message: 'Body melebihi batas 1 MiB.'
        });
      }
      console.error('LAB ERROR:', err);
      if (!res.headersSent) {
        return json(req, res, 500, { error: 'internal_error', message: 'Terjadi kesalahan pada lab.' });
      }
      res.end();
    });
  };

  let server;
  if (opts.tls) {
    server = https.createServer(opts.tls, handler);
  } else {
    server = http.createServer(handler);
  }
  server.state = state;
  return server;
}

if (require.main === module) {
  const useHttps = process.argv.includes('--https');
  let server;
  if (useHttps) {
    const keyPath = path.join(__dirname, 'certs', 'localhost-key.pem');
    const certPath = path.join(__dirname, 'certs', 'localhost-cert.pem');
    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
      console.error('Sertifikat lokal belum ada. Jalankan perintah openssl di README.md lebih dahulu.');
      process.exit(1);
    }
    server = createLabServer({
      tls: {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      }
    });
  } else {
    server = createLabServer();
  }

  server.listen(PORT, () => {
    console.log('──────────────────────────────────────────────');
    console.log('  HTTP Lab — Belajar Koding');
    console.log('  Buka: ' + (useHttps ? 'https' : 'http') + '://localhost:' + PORT + '/');
    console.log('  Endpoint: /health /echo /products /cache /login /cors');
    console.log('  Hentikan: Ctrl+C');
    console.log('──────────────────────────────────────────────');
  });
}

module.exports = { createLabServer, createState };
