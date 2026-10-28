import express from 'express';
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const clientDir = path.join(rootDir, 'dist/client');
const serverDir = path.join(rootDir, 'dist/server');
const indexHtmlPath = path.join(rootDir, 'index.html');
const productionIndexPath = path.join(clientDir, 'index.html');
const catalog = JSON.parse(
  readFileSync(path.join(rootDir, 'data/products.json'), 'utf8')
);

const API_DELAY_MS = Number(process.env.API_DELAY_MS ?? 120);
const DEFAULT_PORT = Number(process.env.PORT ?? 5173);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const round = (value) => Math.round(value * 10) / 10;

function escapeHtml(value) {
  const entities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return String(value).replace(/[&<>"']/g, (char) => entities[char]);
}

export function serializeForHtml(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * Menyisipkan HTML hasil renderToString dan initial data ke template Vite.
 * Fungsi ini murni supaya bisa diuji tanpa menyalakan server.
 */
export function injectHtml(template, { appHtml, initialData } = {}) {
  let html = template;

  if (appHtml !== undefined) {
    const rootPattern = /<div id="root"><\/div>/;
    if (!rootPattern.test(html)) {
      throw new Error('Template tidak memiliki <div id="root"></div>');
    }
    html = html.replace(rootPattern, () => `<div id="root">${appHtml}</div>`);
  }

  if (initialData !== undefined) {
    if (!html.includes('</body>')) {
      throw new Error('Template tidak memiliki </body>');
    }
    const script = `<script>window.__INITIAL_DATA__ = ${serializeForHtml(
      initialData
    )};</script>`;
    html = html.replace('</body>', () => `${script}\n</body>`);
  }

  return html;
}

function resolveServerEntry() {
  const candidates = ['entry-server.js', 'entry-server.mjs'];
  const entry = candidates
    .map((name) => path.join(serverDir, name))
    .find((candidate) => existsSync(candidate));

  if (!entry) {
    throw new Error(
      'Build SSR belum ada. Jalankan `npm run build` sebelum `npm start`.'
    );
  }

  return entry;
}

async function createViteServer() {
  const { createServer } = await import('vite');
  return createServer({
    root: rootDir,
    server: { middlewareMode: true },
    appType: 'custom',
  });
}

export async function createServerApp({
  dev = process.env.NODE_ENV !== 'production',
} = {}) {
  const app = express();
  let vite = null;
  let productionRender = null;

  if (dev) {
    vite = await createViteServer();
  } else {
    if (!existsSync(productionIndexPath)) {
      throw new Error(
        'Build client belum ada. Jalankan `npm run build` sebelum `npm start`.'
      );
    }
    resolveServerEntry();
  }

  async function renderApp(props) {
    if (vite) {
      const module = await vite.ssrLoadModule('/src/entry-server.tsx');
      return module.render(props);
    }

    if (!productionRender) {
      const module = await import(pathToFileURL(resolveServerEntry()).href);
      productionRender = module.render;
    }

    return productionRender(props);
  }

  async function getTemplate(req) {
    const raw = await readFile(dev ? indexHtmlPath : productionIndexPath, 'utf8');
    return vite ? vite.transformIndexHtml(req.originalUrl, raw) : raw;
  }

  async function fetchProducts(req) {
    const port = req.socket.localPort ?? DEFAULT_PORT;
    const url = `http://127.0.0.1:${port}/api/products`;

    try {
      const response = await fetch(url, {
        headers: { accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const payload = await response.json();
      if (!Array.isArray(payload.products)) {
        throw new Error('payload.products bukan array');
      }
      return payload.products;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.warn(`[ssr] fetch ${url} gagal (${reason}); memakai data lokal.`);
      return catalog;
    }
  }

  async function sendPage(req, res, pageMode) {
    const started = performance.now();

    try {
      const template = await getTemplate(req);

      if (pageMode === 'csr') {
        res
          .status(200)
          .type('html')
          .set('Cache-Control', 'no-store')
          .send(template);
        return;
      }

      const dataStarted = performance.now();
      const products = await fetchProducts(req);
      const dataMs = performance.now() - dataStarted;
      const mismatch = req.query.mismatch === '1';
      const baseTiming = {
        dataMs: round(dataMs),
        renderedAt: new Date().toISOString(),
      };

      const renderStarted = performance.now();
      const appHtml = await renderApp({
        mode: 'ssr',
        products,
        mismatch,
        serverTiming: baseTiming,
      });
      const renderMs = performance.now() - renderStarted;

      const timing = {
        ...baseTiming,
        renderMs: round(renderMs),
        htmlBytes: Buffer.byteLength(appHtml),
        totalMs: round(performance.now() - started),
      };

      // props harus identik dengan yang dipakai renderToString supaya hydration
      // tidak mismatch. Nilai timing lengkap dipisahkan di initialData.timing.
      const initialData = {
        props: {
          mode: 'ssr',
          products,
          mismatch,
          serverTiming: baseTiming,
        },
        timing,
      };

      const html = injectHtml(template, { appHtml, initialData });
      res
        .status(200)
        .type('html')
        .set('Cache-Control', 'no-store')
        .send(html);
    } catch (error) {
      if (vite && error instanceof Error) vite.ssrFixStacktrace(error);
      console.error('[ssr] gagal merender:', error);
      res
        .status(500)
        .type('html')
        .send(
          `<pre>${escapeHtml(
            error instanceof Error ? error.stack ?? error.message : String(error)
          )}</pre>`
        );
    }
  }

  app.get('/api/products', async (_req, res) => {
    await sleep(API_DELAY_MS);
    res
      .set('Cache-Control', 'no-store')
      .json({
        products: catalog,
        generatedAt: new Date().toISOString(),
        source: 'local-api',
      });
  });

  app.get('/', (_req, res) => res.redirect(302, '/ssr'));
  app.get('/csr', (req, res) => sendPage(req, res, 'csr'));
  app.get('/ssr', (req, res) => sendPage(req, res, 'ssr'));

  if (vite) {
    app.use(vite.middlewares);
  } else {
    app.use(express.static(clientDir, { index: false, maxAge: '1h' }));
  }

  return { app, vite };
}

export async function startServer() {
  const dev =
    process.argv.includes('--dev') || process.env.NODE_ENV !== 'production';
  const { app, vite } = await createServerApp({ dev });

  const server = app.listen(DEFAULT_PORT, () => {
    console.log(
      `\n  SSR lab (${dev ? 'dev' : 'production'}) → http://localhost:${DEFAULT_PORT}/ssr`
    );
    console.log(`  CSR               → http://localhost:${DEFAULT_PORT}/csr`);
    console.log(
      `  Mismatch demo     → http://localhost:${DEFAULT_PORT}/ssr?mismatch=1\n`
    );
  });

  const shutdown = () => {
    server.close(async () => {
      await vite?.close();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return { server, vite };
}

const isMain =
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  startServer().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
