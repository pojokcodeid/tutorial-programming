/**
 * Server contoh TokoMicro (React).
 *
 * Satu proses Node melayani empat "origin" berbeda — persis seperti
 * deployment micro-frontend sungguhan di mana shell dan tiap remote
 * berada di server/CDN masing-masing. CORS dibuka lebar karena remote
 * memang dimuat lintas origin oleh shell.
 *
 *   4173 → shell     (aplikasi induk, juga pemilik API /api/*)
 *   4174 → header    (remote)
 *   4175 → products  (remote)
 *   4176 → cart      (remote)
 *
 * Jalankan setelah build:  npm run build  lalu  npm start
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));

const SITES = [
  { name: 'shell', port: 4173, dir: 'apps/shell/dist', spa: true },
  { name: 'header', port: 4174, dir: 'apps/header/dist' },
  { name: 'products', port: 4175, dir: 'apps/products/dist' },
  { name: 'cart', port: 4176, dir: 'apps/cart/dist' }
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.map': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2'
};

/* --- API palsu (dipakai shell & remote products/cart) -------------------- */

const products = [
  { id: 'p1', name: 'Keyboard Mekanik', category: 'Aksesori', price: 750000, emoji: '⌨️' },
  { id: 'p2', name: 'Mouse Nirkabel', category: 'Aksesori', price: 320000, emoji: '🖱️' },
  { id: 'p3', name: 'Layar 27 inci', category: 'Monitor', price: 2450000, emoji: '🖥️' },
  { id: 'p4', name: 'Kursi Ergonomis', category: 'Furnitur', price: 1890000, emoji: '🪑' },
  { id: 'p5', name: 'Lampu Meja LED', category: 'Furnitur', price: 210000, emoji: '💡' },
  { id: 'p6', name: 'Headset Stereo', category: 'Aksesori', price: 540000, emoji: '🎧' }
];

const orders = [];
let orderSeq = 1;

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function handleApi(req, res, url) {
  if (url === '/api/products' && req.method === 'GET') {
    json(res, 200, products);
    return true;
  }

  if (url === '/api/orders' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      let payload;
      try {
        payload = JSON.parse(body || '{}');
      } catch {
        json(res, 400, { error: 'Payload bukan JSON yang sah.' });
        return;
      }

      if (!Array.isArray(payload.items) || payload.items.length === 0) {
        json(res, 400, { error: 'Keranjang kosong — pesanan tidak dibuat.' });
        return;
      }

      const total = payload.items.reduce((sum, item) => sum + item.price * item.qty, 0);
      const order = {
        id: 'ORD-' + String(orderSeq++).padStart(4, '0'),
        items: payload.items,
        total,
        createdAt: new Date().toISOString()
      };
      orders.push(order);
      json(res, 201, order);
    });
    return true;
  }

  if (url.startsWith('/api/')) {
    json(res, 404, { error: 'Endpoint tidak dikenal: ' + url });
    return true;
  }

  return false;
}

/* --- Server per origin ---------------------------------------------------- */

function createSiteServer(site) {
  const base = path.join(ROOT, site.dir);

  return http.createServer((req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);

    /* CORS: remote dilayani lintas origin oleh shell. */
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (handleApi(req, res, url)) return;

    if (!fs.existsSync(base)) {
      res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(
        `${site.name}: hasil build belum ada. Jalankan "npm install && npm run build" di folder examples/micro-frontend-react.`
      );
      return;
    }

    /* Tanpa ekstensi → index.html (deep link & fallback SPA). */
    const relative = url === '/' || path.extname(url) === '' ? 'index.html' : url;
    const file = path.join(base, relative);

    if (!file.startsWith(base)) {
      res.writeHead(403);
      res.end('Terlarang');
      return;
    }

    fs.readFile(file, (err, data) => {
      if (err) {
        if (site.spa && req.method === 'GET') {
          fs.readFile(path.join(base, 'index.html'), (fallbackErr, html) => {
            if (fallbackErr) {
              res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
              res.end('404 — tidak ditemukan: ' + url);
              return;
            }
            res.writeHead(200, { 'Content-Type': MIME['.html'] });
            res.end(html);
          });
          return;
        }
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 — tidak ditemukan: ' + url);
        return;
      }

      res.writeHead(200, {
        'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-cache'
      });
      res.end(data);
    });
  });
}

for (const site of SITES) {
  const built = fs.existsSync(path.join(ROOT, site.dir, 'index.html'));
  createSiteServer(site).listen(site.port, () => {
    const note = built ? '' : '  ← hasil build belum ada, jalankan "npm run build"';
    console.log(`${site.name.padEnd(8)} → http://localhost:${site.port}${note}`);
  });
}

console.log('\nTokoMicro (React) siap. Buka http://localhost:4173\n');
