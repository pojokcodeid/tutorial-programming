/**
 * Server contoh TokoMicro (React + TypeScript).
 *
 * Satu proses Node melayani enam "origin" berbeda — persis seperti deployment
 * micro-frontend sungguhan di mana shell dan tiap remote berada di server/CDN
 * masing-masing.
 *
 *   4173 → shell     (aplikasi induk, juga pemilik API /api/*)
 *   4174 → header    (remote)
 *   4175 → products  (remote)
 *   4176 → cart      (remote)
 *   4177 → account   (remote)
 *   4178 → legacy    (aplikasi lama, statis)
 *
 * Setiap origin remote juga melayani versi rilis di /v/<versi>/* yang dibaca
 * dari folder cdn/<nama>/<versi>. Itulah yang membuat rilis dan rollback per
 * remote bisa dilakukan tanpa build ulang shell.
 *
 * Jalankan setelah build:  npm run build  lalu  npm start
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));

const SITES = [
  { name: 'shell', port: 4173, dir: 'apps/shell/dist', spa: true },
  { name: 'header', port: 4174, dir: 'apps/header/dist' },
  { name: 'products', port: 4175, dir: 'apps/products/dist' },
  { name: 'cart', port: 4176, dir: 'apps/cart/dist' },
  { name: 'account', port: 4177, dir: 'apps/account/dist' },
  { name: 'legacy', port: 4178, dir: 'apps/legacy' }
];

const REMOTE_PORTS = {
  header: 4174,
  products: 4175,
  cart: 4176,
  account: 4177
};

const OWNERS = {
  header: 'Tim Chrome',
  products: 'Tim Katalog',
  cart: 'Tim Transaksi',
  account: 'Tim Akun'
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
};

/* ------------------------------------------------------------------ */
/* Data demo                                                           */
/* ------------------------------------------------------------------ */

const PRODUCTS = [
  { id: 'kb-01', name: 'Keyboard Mekanik', category: 'Periferal', price: 850_000, emoji: '⌨️' },
  { id: 'ms-02', name: 'Mouse Nirkabel', category: 'Periferal', price: 320_000, emoji: '🖱️' },
  { id: 'mn-03', name: 'Monitor 27 inci', category: 'Layar', price: 3_400_000, emoji: '🖥️' },
  { id: 'hp-04', name: 'Headphone Studio', category: 'Audio', price: 1_250_000, emoji: '🎧' },
  { id: 'sp-05', name: 'Speaker Meja', category: 'Audio', price: 780_000, emoji: '🔊' },
  { id: 'st-06', name: 'Stand Laptop', category: 'Aksesori', price: 240_000, emoji: '🪜' },
  { id: 'cm-07', name: 'Kamera Web 4K', category: 'Periferal', price: 1_150_000, emoji: '📷' },
  { id: 'ch-08', name: 'Hub USB-C', category: 'Aksesori', price: 410_000, emoji: '🔌' }
];

const USERS = {
  demo: { username: 'demo', name: 'Dewi Lestari', role: 'customer', password: 'demo123' },
  admin: { username: 'admin', name: 'Raka Pratama', role: 'admin', password: 'admin123' }
};

/** Token akses hidup di memori. Restart server = semua sesi berakhir. */
const accessTokens = new Map();
/** Refresh token dipetakan ke username; cookie-nya httpOnly. */
const refreshTokens = new Map();

const ORDERS = [
  {
    id: 'ORD-2401',
    items: [
      { ...PRODUCTS[0], qty: 1 },
      { ...PRODUCTS[5], qty: 2 }
    ],
    total: 850_000 + 240_000 * 2,
    user: publicUser(USERS.demo),
    createdAt: new Date(Date.now() - 86_400_000 * 3).toISOString()
  }
];

const FLAGS = {
  newCheckout: true,
  accountRemote: true,
  legacyCatalog: true
};

const TELEMETRY = [];

/* ------------------------------------------------------------------ */
/* Utilitas                                                            */
/* ------------------------------------------------------------------ */

function publicUser(user) {
  return { username: user.username, name: user.name, role: user.role };
}

function tokenFor(username) {
  const token = crypto.randomBytes(24).toString('base64url');
  accessTokens.set(token, {
    username,
    expiresAt: Date.now() + 15 * 60_000
  });
  return token;
}

function refreshFor(username) {
  const token = crypto.randomBytes(32).toString('base64url');
  refreshTokens.set(token, username);
  return token;
}

function readCookie(request, name) {
  const header = request.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

function setRefreshCookie(response, token, maxAgeSeconds = 60 * 60 * 24 * 7) {
  const value = token
    ? `tm_refresh=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`
    : 'tm_refresh=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0';
  response.setHeader('Set-Cookie', value);
}

function userFromRequest(request) {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7);
  const session = accessTokens.get(token);
  if (!session || session.expiresAt < Date.now()) {
    accessTokens.delete(token);
    return null;
  }
  return USERS[session.username] ?? null;
}

function sendJson(response, status, body) {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store'
  });
  response.end(payload);
}

async function readBody(request, limit = 256 * 1024) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) throw new Error('Body terlalu besar');
    chunks.push(chunk);
  }

  if (chunks.length === 0) return {};
  const text = Buffer.concat(chunks).toString('utf8');
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Body bukan JSON yang valid');
  }
}

function applyCors(request, response) {
  const origin = request.headers.origin;
  response.setHeader('Access-Control-Allow-Origin', origin ?? '*');
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.setHeader('Vary', 'Origin');
}

/* ------------------------------------------------------------------ */
/* Manifest remote                                                     */
/* ------------------------------------------------------------------ */

function readCdnManifest() {
  try {
    const raw = fs.readFileSync(path.join(ROOT, 'cdn/manifest.json'), 'utf8');
    return JSON.parse(raw);
  } catch {
    return { remotes: {} };
  }
}

function versionedExists(name, version) {
  return fs.existsSync(path.join(ROOT, 'cdn', name, version, 'assets', 'remoteEntry.js'));
}

function buildManifest(request) {
  const hostname = (request.headers.host ?? 'localhost:4173').split(':')[0];
  const stored = readCdnManifest();
  const remotes = {};

  for (const [name, port] of Object.entries(REMOTE_PORTS)) {
    const entry = stored.remotes?.[name] ?? {};
    const version = entry.version ?? '1.0.0';
    const base = `http://${hostname}:${port}`;
    const url = versionedExists(name, version)
      ? `${base}/v/${version}/assets/remoteEntry.js`
      : `${base}/assets/remoteEntry.js`;

    remotes[name] = {
      version,
      url,
      owner: entry.owner ?? OWNERS[name],
      status: entry.status === 'canary' ? 'canary' : 'stable',
      releasedAt: entry.releasedAt ?? new Date().toISOString()
    };
  }

  return { generatedAt: new Date().toISOString(), remotes };
}

/* ------------------------------------------------------------------ */
/* API                                                                 */
/* ------------------------------------------------------------------ */

async function handleApi(request, response, url) {
  applyCors(request, response);

  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return true;
  }

  const route = url.pathname;

  if (route === '/api/health') {
    sendJson(response, 200, { ok: true, uptime: process.uptime() });
    return true;
  }

  if (route === '/api/products' && request.method === 'GET') {
    sendJson(response, 200, { products: PRODUCTS });
    return true;
  }

  if (route === '/api/config' && request.method === 'GET') {
    sendJson(response, 200, {
      app: 'TokoMicro',
      apiBase: '/api',
      locales: ['id', 'en'],
      remotePorts: REMOTE_PORTS
    });
    return true;
  }

  if (route === '/api/flags' && request.method === 'GET') {
    sendJson(response, 200, { flags: FLAGS });
    return true;
  }

  if (route === '/api/remotes' && request.method === 'GET') {
    sendJson(response, 200, buildManifest(request));
    return true;
  }

  if (route === '/api/login' && request.method === 'POST') {
    try {
      const body = await readBody(request);
      const username = String(body.username ?? '');
      const user = USERS[username];
      if (!user || body.password !== user.password) {
        sendJson(response, 401, { error: 'Nama pengguna atau kata sandi salah.' });
        return true;
      }

      const token = tokenFor(username);
      const refresh = refreshFor(username);
      setRefreshCookie(response, refresh);
      sendJson(response, 200, {
        token,
        expiresAt: Date.now() + 15 * 60_000,
        user: publicUser(user)
      });
    } catch (error) {
      sendJson(response, 400, { error: error.message });
    }
    return true;
  }

  if (route === '/api/refresh' && request.method === 'POST') {
    const refresh = readCookie(request, 'tm_refresh');
    const username = refresh ? refreshTokens.get(refresh) : null;
    const user = username ? USERS[username] : null;

    if (!refresh || !user) {
      setRefreshCookie(response, null);
      /* Bukan galat: ini hanya berarti belum ada sesi aktif. */
      sendJson(response, 200, { token: null });
      return true;
    }

    /* Rotasi refresh token: token lama langsung tidak berlaku. */
    refreshTokens.delete(refresh);
    const nextRefresh = refreshFor(username);
    setRefreshCookie(response, nextRefresh);

    sendJson(response, 200, {
      token: tokenFor(username),
      expiresAt: Date.now() + 15 * 60_000,
      user: publicUser(user)
    });
    return true;
  }

  if (route === '/api/logout' && request.method === 'POST') {
    const refresh = readCookie(request, 'tm_refresh');
    if (refresh) refreshTokens.delete(refresh);

    const header = request.headers.authorization;
    if (header?.startsWith('Bearer ')) accessTokens.delete(header.slice(7));

    setRefreshCookie(response, null);
    sendJson(response, 200, { ok: true });
    return true;
  }

  if (route === '/api/me' && request.method === 'GET') {
    const user = userFromRequest(request);
    if (!user) {
      sendJson(response, 401, { error: 'Belum masuk atau token kedaluwarsa.' });
      return true;
    }
    sendJson(response, 200, publicUser(user));
    return true;
  }

  if (route === '/api/orders' && request.method === 'GET') {
    const user = userFromRequest(request);
    if (!user) {
      sendJson(response, 401, { error: 'Belum masuk atau token kedaluwarsa.' });
      return true;
    }

    /* Hanya admin yang boleh melihat seluruh pesanan. Guard klien bukan batas keamanan. */
    if (url.searchParams.get('scope') === 'all') {
      if (user.role !== 'admin') {
        sendJson(response, 403, { error: 'Akses ditolak: khusus admin.' });
        return true;
      }
      sendJson(response, 200, { orders: ORDERS });
      return true;
    }

    sendJson(response, 200, {
      orders: ORDERS.filter((order) => order.user.username === user.username)
    });
    return true;
  }

  if (route === '/api/orders' && request.method === 'POST') {
    const user = userFromRequest(request);
    if (!user) {
      sendJson(response, 401, { error: 'Belum masuk atau token kedaluwarsa.' });
      return true;
    }

    try {
      const body = await readBody(request);
      const requested = Array.isArray(body.items) ? body.items : [];
      if (requested.length === 0) {
        sendJson(response, 400, { error: 'Keranjang kosong.' });
        return true;
      }

      const items = [];
      for (const entry of requested) {
        const product = PRODUCTS.find((item) => item.id === entry.id);
        const qty = Number(entry.qty);
        if (!product || !Number.isInteger(qty) || qty <= 0) {
          sendJson(response, 400, { error: `Item tidak valid: ${entry.id}` });
          return true;
        }
        items.push({ ...product, qty });
      }

      /* Harga dihitung ulang di server — jangan percaya total dari klien. */
      const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
      const order = {
        id: `ORD-${Date.now().toString(36).toUpperCase()}`,
        items,
        total,
        user: publicUser(user),
        createdAt: new Date().toISOString()
      };

      ORDERS.unshift(order);
      sendJson(response, 201, { order });
    } catch (error) {
      sendJson(response, 400, { error: error.message });
    }
    return true;
  }

  if (route === '/api/telemetry' && request.method === 'POST') {
    try {
      const body = await readBody(request, 64 * 1024);
      if (body && typeof body.name === 'string') {
        TELEMETRY.push({ ...body, receivedAt: new Date().toISOString() });
        if (TELEMETRY.length > 500) TELEMETRY.splice(0, TELEMETRY.length - 500);
      }
      response.writeHead(204, { 'Cache-Control': 'no-store' });
      response.end();
    } catch {
      response.writeHead(204);
      response.end();
    }
    return true;
  }

  if (route === '/api/metrics/summary' && request.method === 'GET') {
    const byApp = {};
    let events = 0;
    let errors = 0;
    let metrics = 0;

    for (const entry of TELEMETRY) {
      byApp[entry.app ?? 'unknown'] = (byApp[entry.app ?? 'unknown'] ?? 0) + 1;
      if (entry.type === 'error') errors += 1;
      else if (entry.type === 'metric') metrics += 1;
      else events += 1;
    }

    sendJson(response, 200, { events, errors, metrics, byApp, total: TELEMETRY.length });
    return true;
  }

  return false;
}

/* ------------------------------------------------------------------ */
/* Berkas statis                                                       */
/* ------------------------------------------------------------------ */

function safeJoin(base, target) {
  const resolved = path.resolve(base, `.${path.posix.sep}${target}`);
  return resolved.startsWith(path.resolve(base)) ? resolved : null;
}

function serveFile(response, filePath, { immutable = false } = {}) {
  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch {
    return false;
  }

  if (!stat.isFile()) return false;

  const ext = path.extname(filePath).toLowerCase();
  response.writeHead(200, {
    'Content-Type': MIME[ext] ?? 'application/octet-stream',
    'Content-Length': stat.size,
    'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
    'Access-Control-Allow-Origin': '*'
  });

  if (response.req?.method === 'HEAD') {
    response.end();
    return true;
  }

  fs.createReadStream(filePath).pipe(response);
  return true;
}

function serveSite(site, request, response, url) {
  const siteRoot = path.join(ROOT, site.dir);
  let relative = decodeURIComponent(url.pathname);
  let immutable = false;
  let baseRoot = siteRoot;

  /* /v/<versi>/... → cdn/<nama>/<versi>/... */
  const versioned = /^\/v\/([^/]+)\/(.*)$/.exec(relative);
  if (versioned && site.name !== 'legacy') {
    const [, version, rest] = versioned;
    if (!/^[0-9A-Za-z._-]+$/.test(version)) {
      response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Versi tidak valid.');
      return;
    }
    baseRoot = path.join(ROOT, 'cdn', site.name, version);
    relative = `/${rest}`;
    immutable = true;
  }

  if (relative === '/') relative = '/index.html';

  const filePath = safeJoin(baseRoot, relative);
  if (filePath && serveFile(response, filePath, { immutable })) return;

  /* RemoteEntry bisa diminta tanpa folder assets (kompatibilitas). */
  if (relative === '/remoteEntry.js') {
    const alt = safeJoin(baseRoot, '/assets/remoteEntry.js');
    if (alt && serveFile(response, alt, { immutable })) return;
  }

  if (site.spa) {
    const indexPath = path.join(siteRoot, 'index.html');
    if (serveFile(response, indexPath)) return;
  }

  response.writeHead(404, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  response.end(
    `Tidak ditemukan: ${url.pathname}\n` +
      `Pastikan sudah menjalankan "npm run build" di ${path.relative(ROOT, siteRoot)}.\n`
  );
}

/* ------------------------------------------------------------------ */
/* Server per origin                                                   */
/* ------------------------------------------------------------------ */

function createSiteServer(site) {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);

    if (site.name === 'shell' && url.pathname.startsWith('/api/')) {
      const handled = await handleApi(request, response, url);
      if (handled) return;
      sendJson(response, 404, { error: 'Endpoint API tidak dikenal.' });
      return;
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Metode tidak didukung.');
      return;
    }

    serveSite(site, request, response, url);
  });
}

const servers = SITES.map((site) => {
  const server = createSiteServer(site);
  server.listen(site.port, () => {
    console.log(`[tokomicro] ${site.name.padEnd(8)} → http://localhost:${site.port}`);
  });
  return server;
});

function shutdown() {
  for (const server of servers) server.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
