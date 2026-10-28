/**
 * Server statis tanpa dependensi untuk lab Module Federation.
 *
 *   http://localhost:4181  → apps/host/dist    (host, SPA fallback)
 *   http://localhost:4182  → apps/remote/dist  (remote, SPA fallback)
 *
 * CORS dibuka karena host di :4181 memang mengunduh remoteEntry.js dan chunk
 * dari origin :4182. Di produksi, ganti "*" dengan origin yang kamu izinkan.
 */
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOST_PORT, REMOTE_PORT } from './lib/lab-config.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));

const SITES = [
  {
    name: 'host',
    port: HOST_PORT,
    dir: path.join(ROOT, 'apps/host/dist'),
    spa: true,
  },
  {
    name: 'remote',
    port: REMOTE_PORT,
    dir: path.join(ROOT, 'apps/remote/dist'),
    spa: true,
  },
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

function setCommonHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

function sendText(res, status, message, method = 'GET') {
  const body = Buffer.from(`${message}\n`, 'utf8');
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': body.byteLength,
    'Cache-Control': 'no-store',
  });
  if (method === 'HEAD') {
    res.end();
    return;
  }
  res.end(body);
}

function resolveInside(root, relativePath) {
  const target = path.resolve(root, relativePath);
  const rootPrefix = root.endsWith(path.sep) ? root : `${root}${path.sep}`;

  if (target !== root && !target.startsWith(rootPrefix)) {
    return null;
  }

  return target;
}

async function serveFile(res, filePath, method) {
  const data = await fsp.readFile(filePath);
  const extension = path.extname(filePath).toLowerCase();
  const isEntry = path.basename(filePath) === 'remoteEntry.js';
  const cacheControl =
    extension === '.html' || isEntry
      ? 'no-store'
      : 'public, max-age=31536000, immutable';

  res.writeHead(200, {
    'Content-Type': MIME[extension] ?? 'application/octet-stream',
    'Content-Length': data.byteLength,
    'Cache-Control': cacheControl,
  });

  if (method === 'HEAD') {
    res.end();
    return;
  }

  res.end(data);
}

function createSiteServer(site) {
  return http.createServer(async (req, res) => {
    setCommonHeaders(res);

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      sendText(res, 405, '405 Method Not Allowed', req.method);
      return;
    }

    let pathname;
    try {
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
      pathname = decodeURIComponent(url.pathname);
    } catch {
      sendText(res, 400, '400 Bad Request — URL tidak valid', req.method);
      return;
    }

    let relativePath = pathname.replace(/^\/+/, '');
    if (relativePath === '' || relativePath.endsWith('/')) {
      relativePath += 'index.html';
    }

    const filePath = resolveInside(site.dir, relativePath);
    if (!filePath) {
      sendText(res, 403, '403 Forbidden', req.method);
      return;
    }

    try {
      const stat = await fsp.stat(filePath);
      if (stat.isFile()) {
        await serveFile(res, filePath, req.method);
        return;
      }
    } catch {
      // Berkas tidak ada — lanjut ke SPA fallback atau 404.
    }

    const acceptsHtml = (req.headers.accept ?? '').includes('text/html');
    const hasExtension = path.extname(pathname) !== '';

    if (site.spa && acceptsHtml && !hasExtension) {
      const fallback = path.join(site.dir, 'index.html');
      try {
        await serveFile(res, fallback, req.method);
        return;
      } catch {
        // index.html juga tidak ada; jatuh ke 404 di bawah.
      }
    }

    sendText(
      res,
      404,
      `404 Not Found — ${pathname}\nPastikan kamu sudah menjalankan "npm run build".`,
      req.method
    );
  });
}

for (const site of SITES) {
  if (!fs.existsSync(site.dir)) {
    console.error(`\nFolder build tidak ditemukan: ${path.relative(ROOT, site.dir)}`);
    console.error('Jalankan "npm run build" (Webpack) atau "npm run build:rspack" terlebih dahulu.\n');
    process.exit(1);
  }
}

const servers = [];

for (const site of SITES) {
  const server = createSiteServer(site);

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`\nPort ${site.port} sudah dipakai. Hentikan proses lain atau ubah port di lib/lab-config.mjs.\n`);
    } else {
      console.error(`\nServer ${site.name} gagal:`, error);
    }
    process.exit(1);
  });

  server.listen(site.port, () => {
    const folder = path.relative(ROOT, site.dir);
    console.log(`[${site.name.padEnd(6)}] http://localhost:${site.port}  →  ${folder}`);
  });

  servers.push(server);
}

console.log('\nBuka http://localhost:4181 — host akan memuat remote dari :4182.');
console.log('Tekan Ctrl+C untuk berhenti.\n');

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log(`\nMenerima ${signal}. Menutup server…`);

  for (const server of servers) {
    server.close();
  }

  setTimeout(() => process.exit(0), 150).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
