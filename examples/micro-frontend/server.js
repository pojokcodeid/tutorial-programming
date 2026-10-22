/* ============================================================
   server.js — server statis + API palsu untuk proyek contoh
   micro-frontend "TokoMicro".

   Jalankan : node server.js
   Buka     : http://localhost:4173

   Tidak memerlukan dependensi apa pun (Node >= 16).
   ============================================================ */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 4173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};

/* --- data contoh (pengganti database) --- */
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

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);

  /* CORS dibuka lebar: tiap micro-frontend boleh dilayani oleh port/origin
     berbeda, persis seperti skenario deploy terpisah. */
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  /* --- API --- */
  if (url === '/api/products' && req.method === 'GET') {
    json(res, 200, products);
    return;
  }

  if (url === '/api/orders' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      let payload;
      try { payload = JSON.parse(body || '{}'); } catch { json(res, 400, { error: 'Payload bukan JSON yang sah.' }); return; }
      if (!Array.isArray(payload.items) || payload.items.length === 0) {
        json(res, 400, { error: 'Keranjang kosong — pesanan tidak dibuat.' });
        return;
      }
      const total = payload.items.reduce((sum, i) => sum + i.price * i.qty, 0);
      const order = {
        id: 'ORD-' + String(orderSeq++).padStart(4, '0'),
        items: payload.items,
        total,
        createdAt: new Date().toISOString()
      };
      orders.push(order);
      json(res, 201, order);
    });
    return;
  }

  if (url === '/api/orders' && req.method === 'GET') {
    json(res, 200, orders);
    return;
  }

  /* --- file statis --- */
  const file = path.join(ROOT, url === '/' ? 'shell/index.html' : url);
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end('Terlarang'); return; }

  fs.readFile(file, (err, data) => {
    if (err) {
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

server.listen(PORT, () => {
  console.log('──────────────────────────────────────────────');
  console.log('  TokoMicro — contoh micro-frontend');
  console.log(`  Buka: http://localhost:${PORT}`);
  console.log('  (Ctrl+C untuk menghentikan server)');
  console.log('──────────────────────────────────────────────');
});
