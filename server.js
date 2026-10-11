/* ============================================================
   server.js — server lokal opsional (tanpa dependensi, Node >= 16)
   Cara pakai:  node server.js   lalu buka http://localhost:8123
   (Tidak wajib — aplikasi juga bisa dibuka langsung via index.html)
   ============================================================ */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 8123;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.sqlite': 'application/x-sqlite3',
  '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
  try {
    const url = decodeURIComponent(req.url.split('?')[0]);
    let filePath = path.join(ROOT, url === '/' ? 'index.html' : url);
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403); res.end('Forbidden'); return;
    }
    fs.stat(filePath, (err, stat) => {
      if (err) {
        // fallback ke index.html untuk hash routing
        if (url.indexOf('.') === -1) filePath = path.join(ROOT, 'index.html');
        else { res.writeHead(404); res.end('Not found'); return; }
      }
      fs.readFile(filePath, (e2, data) => {
        if (e2) { res.writeHead(404); res.end('Not found'); return; }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
          'Content-Type': MIME[ext] || 'application/octet-stream',
          'Cache-Control': 'no-cache'
        });
        res.end(data);
      });
    });
  } catch (e) {
    res.writeHead(500); res.end('Server error');
  }
});

server.listen(PORT, () => {
  console.log('──────────────────────────────────────────────');
  console.log('  Belajar Koding — server lokal');
  console.log(`  Buka:  http://localhost:${PORT}`);
  console.log('  (Ctrl+C untuk menghentikan server)');
  console.log('──────────────────────────────────────────────');
});