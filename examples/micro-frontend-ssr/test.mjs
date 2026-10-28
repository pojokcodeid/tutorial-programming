import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { render } from './dist/server/entry-server.js';
import { injectHtml } from './server.mjs';

const products = [
  {
    id: 'kopi-gayo',
    name: 'Kopi Arabika Gayo',
    category: 'Minuman',
    price: 85000,
    stock: 18,
    emoji: '☕',
    description: 'Biji kopi single origin dari Aceh.',
  },
  {
    id: 'roti-sourdough',
    name: 'Roti Sourdough',
    category: 'Roti',
    price: 48000,
    stock: 9,
    emoji: '🍞',
    description: 'Fermentasi alami 24 jam.',
  },
];

const baseTiming = {
  dataMs: 12.4,
  renderedAt: '2026-01-01T00:00:00.000Z',
};

test('render SSR menghasilkan HTML katalog lengkap', () => {
  const html = render({
    mode: 'ssr',
    products,
    mismatch: false,
    serverTiming: baseTiming,
  });

  assert.match(html, /data-mode="ssr"/);
  assert.match(html, /Kopi Arabika Gayo/);
  assert.match(html, /Roti Sourdough/);
  assert.match(html, /Rp 85\.000/);
  assert.match(html, /Ada — dikirim server/);
  assert.doesNotMatch(html, /undefined/);
  assert.doesNotMatch(html, /Uji mismatch aktif/);
});

test('render SSR dengan mismatch menulis nilai SERVER ke HTML', () => {
  const html = render({
    mode: 'ssr',
    products,
    mismatch: true,
    serverTiming: baseTiming,
  });

  assert.match(html, /Uji mismatch aktif/);
  assert.match(html, /data-side="SERVER"/);
  assert.doesNotMatch(html, /data-side="CLIENT"/);
});

test('render CSR tidak menyertakan produk di HTML awal', () => {
  const html = render({ mode: 'csr' });

  assert.match(html, /data-mode="csr"/);
  assert.match(html, /Mode CSR: HTML awal kosong/);
  assert.doesNotMatch(html, /Kopi Arabika Gayo/);
  assert.doesNotMatch(html, /Roti Sourdough/);
});

test('injectHtml menyisipkan appHtml dan initial data ke template', async () => {
  const template = await readFile(new URL('./index.html', import.meta.url), 'utf8');
  const html = injectHtml(template, {
    appHtml: '<p>Halo dari renderToString</p>',
    initialData: {
      props: { mode: 'ssr', products, serverTiming: baseTiming },
      timing: baseTiming,
    },
  });

  assert.match(html, /<div id="root"><p>Halo dari renderToString<\/p><\/div>/);
  assert.match(html, /window\.__INITIAL_DATA__ = \{/);
  assert.match(html, /Kopi Arabika Gayo/);
  assert.match(html, /2026-01-01T00:00:00\.000Z/);
});

test('injectHtml meng-escape </script> di initial data', () => {
  const html = injectHtml('<div id="root"></div></body>', {
    initialData: {
      props: { note: '</script><script>alert(1)</script>' },
    },
  });

  assert.doesNotMatch(html, /<\/script><script>alert/);
  assert.match(html, /\\u003c\/script\\u003e/);
});
