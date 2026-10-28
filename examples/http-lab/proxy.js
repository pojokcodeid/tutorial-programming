/* ============================================================
   proxy.js — reverse proxy sederhana untuk latihan HTTP
   Jalankan:  node examples/http-lab/proxy.js
   Proxy:     http://localhost:8788
   Backend:   http://127.0.0.1:8787 (lab)
   ============================================================ */
'use strict';

const http = require('http');
const crypto = require('crypto');

const PORT = Number(process.env.PROXY_PORT || 8788);
const TARGET = process.env.TARGET || 'http://127.0.0.1:8787';
const UPSTREAM_TIMEOUT_MS = Number(process.env.UPSTREAM_TIMEOUT_MS || 3000);

function writeJson(res, status, data, extra) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'X-Proxy': 'http-lab',
    ...(extra || {})
  });
  res.end(body);
}

function createProxyServer(options) {
  const opts = options || {};
  const target = opts.target || TARGET;
  const timeoutMs = opts.timeoutMs || UPSTREAM_TIMEOUT_MS;
  const targetUrl = new URL(target);

  return http.createServer((req, res) => {
    const incoming = new URL(req.url, 'http://localhost');
    if (incoming.pathname === '/__down') {
      return writeJson(res, 502, {
        error: 'bad_gateway',
        message: 'Simulasi upstream tidak tersedia.'
      });
    }

    const requestId = crypto.randomUUID();
    const headers = {
      ...req.headers,
      host: targetUrl.host,
      'x-forwarded-for': req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown',
      'x-forwarded-proto': 'http',
      'x-request-id': requestId,
      'x-proxy': 'http-lab'
    };

    const upstream = http.request({
      hostname: targetUrl.hostname,
      port: targetUrl.port || 80,
      path: req.url,
      method: req.method,
      headers,
      timeout: timeoutMs
    }, (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode || 502, {
        ...upstreamRes.headers,
        'x-proxy': 'http-lab',
        'x-proxy-request-id': requestId
      });
      upstreamRes.pipe(res);
    });

    upstream.on('timeout', () => {
      upstream.destroy();
      if (!res.headersSent) {
        writeJson(res, 504, {
          error: 'gateway_timeout',
          message: 'Upstream melewati batas waktu ' + timeoutMs + ' ms.',
          request_id: requestId
        }, { 'X-Proxy-Request-Id': requestId });
      }
    });

    upstream.on('error', (err) => {
      if (!res.headersSent) {
        writeJson(res, 502, {
          error: 'bad_gateway',
          message: 'Proxy gagal menghubungi upstream: ' + err.code,
          request_id: requestId
        }, { 'X-Proxy-Request-Id': requestId });
      }
    });

    req.pipe(upstream);
  });
}

if (require.main === module) {
  const server = createProxyServer();
  server.listen(PORT, () => {
    console.log('──────────────────────────────────────────────');
    console.log('  HTTP Lab Proxy');
    console.log('  Proxy:   http://localhost:' + PORT + '/');
    console.log('  Target:  ' + TARGET);
    console.log('  Timeout: ' + UPSTREAM_TIMEOUT_MS + ' ms');
    console.log('  Simulasi upstream mati: /__down');
    console.log('  Hentikan: Ctrl+C');
    console.log('──────────────────────────────────────────────');
  });
}

module.exports = { createProxyServer };
