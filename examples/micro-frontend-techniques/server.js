/* ============================================================
   server.js — satu origin, tiga teknik integrasi.

   Jalankan : node server.js
   Buka     : http://localhost:4180

   Tidak ada dependensi eksternal dan tidak ada proses build.
   Server melayani halaman statis dari folder public/ serta API
   kecil di /api/produk.
   ============================================================ */

import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRODUK, cariProduk } from './lib/produk.js';

const DIR_INI = path.dirname(fileURLToPath(import.meta.url));
const DIR_PUBLIK = path.join(DIR_INI, 'public');
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 4180);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

const HEADER_API = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store'
};

export function createServer() {
  return http.createServer((req, res) => {
    tangani(req, res).catch((err) => {
      if (res.headersSent) {
        res.destroy();
        return;
      }
      console.error(`Galat server: ${err.message}`);
      kirimTeks(req, res, 500, 'Terjadi galat di server. Cek terminal untuk detailnya.');
    });
  });
}

async function tangani(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    kirimTeks(req, res, 400, 'Alamat URL tidak valid.');
    return;
  }

  if (pathname === '/api/produk' || pathname === '/api/produk/') {
    tanganiApi(req, res, url);
    return;
  }

  if (pathname.startsWith('/api/')) {
    kirimJson(req, res, 404, { error: 'Endpoint API tidak ditemukan.' });
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    kirimTeks(req, res, 405, 'Metode tidak didukung untuk halaman statis.', { Allow: 'GET, HEAD' });
    return;
  }

  // /iframe -> /iframe/ supaya path relatif di dalam halaman tetap benar.
  if (pathname !== '/' && !pathname.endsWith('/') && !path.extname(pathname)) {
    res.writeHead(301, {
      Location: `${pathname}/${url.search}`,
      'Content-Length': '0',
      'Cache-Control': 'no-store'
    });
    res.end();
    return;
  }

  await layaniStatis(req, res, pathname);
}

function tanganiApi(req, res, url) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, HEADER_API);
    res.end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    kirimJson(req, res, 405, { error: 'Gunakan GET untuk membaca produk.' }, { Allow: 'GET, HEAD, OPTIONS' });
    return;
  }

  const kataKunci = url.searchParams.get('q') || '';
  const kategori = url.searchParams.get('kategori') || '';

  let data = cariProduk(PRODUK, kataKunci);
  if (kategori) {
    data = data.filter((produk) => produk.kategori.toLowerCase() === kategori.toLowerCase());
  }

  kirimJson(req, res, 200, {
    data,
    total: data.length,
    sumber: '/api/produk'
  });
}

async function layaniStatis(req, res, pathname) {
  const berkas = resolveStatis(pathname);

  if (!berkas) {
    kirimHalaman404(req, res, pathname);
    return;
  }

  let info;
  try {
    info = await stat(berkas);
  } catch {
    kirimHalaman404(req, res, pathname);
    return;
  }

  if (!info.isFile()) {
    kirimHalaman404(req, res, pathname);
    return;
  }

  const isi = await readFile(berkas);
  const tipe = MIME[path.extname(berkas).toLowerCase()] || 'application/octet-stream';

  res.writeHead(200, {
    'Content-Type': tipe,
    'Content-Length': isi.length,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    // Same-origin saja: cukup untuk demo iframe di lab ini.
    'X-Frame-Options': 'SAMEORIGIN'
  });

  if (req.method === 'HEAD') res.end();
  else res.end(isi);
}

/**
 * Ubah pathname menjadi berkas di dalam public/.
 * Mengembalikan null jika path keluar dari public/ atau menyentuh dotfile.
 */
function resolveStatis(pathname) {
  let relatif = pathname.replace(/^\/+/, '');

  if (relatif === '') relatif = 'index.html';
  if (relatif.endsWith('/')) relatif += 'index.html';

  const kandidat = path.resolve(DIR_PUBLIK, relatif);

  if (kandidat !== DIR_PUBLIK && !kandidat.startsWith(DIR_PUBLIK + path.sep)) {
    return null;
  }

  const segmen = path.relative(DIR_PUBLIK, kandidat).split(path.sep);
  if (segmen.some((bagian) => bagian.startsWith('.'))) {
    return null;
  }

  return kandidat;
}

function kirimJson(req, res, status, data, tambahan = {}) {
  const isi = Buffer.from(JSON.stringify(data, null, 2));

  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': isi.length,
    'X-Content-Type-Options': 'nosniff',
    ...HEADER_API,
    ...tambahan
  });

  if (req.method === 'HEAD') res.end();
  else res.end(isi);
}

function kirimTeks(req, res, status, teks, tambahan = {}) {
  const isi = Buffer.from(teks);

  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': isi.length,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...tambahan
  });

  if (req.method === 'HEAD') res.end();
  else res.end(isi);
}

function kirimHalaman404(req, res, pathname) {
  const isi = Buffer.from(`<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>404 — Halaman tidak ditemukan</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #070b14; color: #e8eefb; font-family: system-ui, sans-serif; }
    main { max-width: 36rem; padding: 2rem; }
    h1 { margin: 0 0 .5rem; font-size: 2rem; }
    p { color: #9fb0c9; line-height: 1.6; }
    code { background: #111c31; padding: .15rem .4rem; border-radius: 6px; }
    a { color: #7dd3fc; }
  </style>
</head>
<body>
  <main>
    <h1>404 — Halaman tidak ditemukan</h1>
    <p>Alamat <code>${escapeHtml(pathname)}</code> tidak tersedia di lab ini.</p>
    <p><a href="/">Kembali ke halaman utama</a></p>
  </main>
</body>
</html>`);

  res.writeHead(404, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': isi.length,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });

  if (req.method === 'HEAD') res.end();
  else res.end(isi);
}

function escapeHtml(teks) {
  return String(teks)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const dijalankanLangsung =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (dijalankanLangsung) {
  const server = createServer();

  server.listen(PORT, HOST, () => {
    const alamat = HOST === '0.0.0.0' ? 'localhost' : HOST;
    console.log(`Lab micro-frontend berjalan di http://${alamat}:${PORT}`);
  });

  server.on('error', (err) => {
    console.error(`Gagal menjalankan server: ${err.message}`);
    process.exitCode = 1;
  });
}
