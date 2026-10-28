import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createServer } from './server.js';
import { PRODUK, cariProduk, formatRupiah, hitungTotal } from './lib/produk.js';

/* ------------------------------------------------------------
   Unit test: fungsi murni
   ------------------------------------------------------------ */

test('formatRupiah memformat angka, string, nol, dan nilai negatif', () => {
  assert.equal(formatRupiah(750000), 'Rp 750.000');
  assert.equal(formatRupiah('320000'), 'Rp 320.000');
  assert.equal(formatRupiah(1250000), 'Rp 1.250.000');
  assert.equal(formatRupiah(0), 'Rp 0');
  assert.equal(formatRupiah(-1500), '-Rp 1.500');
  assert.equal(formatRupiah('bukan angka'), 'Rp 0');
});

test('cariProduk mencari nama dan kategori tanpa peka huruf besar/kecil', () => {
  const keyboard = cariProduk(PRODUK, 'keyboard');
  assert.equal(keyboard.length, 1);
  assert.equal(keyboard[0].nama, 'Keyboard Mekanik');

  const aksesori = cariProduk(PRODUK, 'AKSESORI');
  assert.equal(aksesori.length, 3);

  assert.equal(cariProduk(PRODUK, '').length, PRODUK.length);
  assert.equal(cariProduk(PRODUK, '   ').length, PRODUK.length);
  assert.equal(cariProduk(PRODUK, 'tidak-ada').length, 0);
});

test('hitungTotal menjumlahkan item valid dan mengabaikan item rusak', () => {
  assert.equal(
    hitungTotal([
      { harga: 1000, jumlah: 2 },
      { harga: 500, jumlah: 3 }
    ]),
    3500
  );

  assert.equal(hitungTotal([{ harga: 125000 }]), 125000);
  assert.equal(hitungTotal([{ harga: 1000, jumlah: 0 }]), 0);
  assert.equal(hitungTotal([{ harga: 1000, jumlah: -2 }]), 0);
  assert.equal(hitungTotal([{ harga: 'rusak', jumlah: 2 }]), 0);
  assert.equal(hitungTotal(null), 0);
  assert.equal(hitungTotal([]), 0);
});

/* ------------------------------------------------------------
   Integration test: server dijalankan di port acak
   ------------------------------------------------------------ */

let server;
let basis;
let port;

before(async () => {
  server = createServer();

  await new Promise((resolve, reject) => {
    const gagal = (err) => reject(err);
    server.once('error', gagal);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', gagal);
      resolve();
    });
  });

  port = server.address().port;
  basis = `http://127.0.0.1:${port}`;
});

after(async () => {
  if (!server) return;
  await new Promise((resolve) => server.close(resolve));
});

function mintaMentah(path) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: '127.0.0.1', port, path, method: 'GET' },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (bagian) => { body += bagian; });
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      }
    );

    req.on('error', reject);
    req.end();
  });
}

test('GET /api/produk mengembalikan data, total, dan header CORS', async () => {
  const res = await fetch(`${basis}/api/produk`);

  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /application\/json/);
  assert.equal(res.headers.get('access-control-allow-origin'), '*');

  const body = await res.json();
  assert.equal(body.total, 6);
  assert.equal(body.data.length, 6);
  assert.equal(body.sumber, '/api/produk');
  assert.ok(body.data.every((produk) => typeof produk.nama === 'string'));
  assert.ok(body.data.every((produk) => typeof produk.harga === 'number'));
});

test('GET /api/produk mendukung filter q dan kategori', async () => {
  const cari = await fetch(`${basis}/api/produk?q=keyboard`);
  const hasilCari = await cari.json();
  assert.equal(hasilCari.total, 1);
  assert.equal(hasilCari.data[0].nama, 'Keyboard Mekanik');

  const kategori = await fetch(`${basis}/api/produk?kategori=furnitur`);
  const hasilKategori = await kategori.json();
  assert.equal(hasilKategori.total, 2);
  assert.ok(hasilKategori.data.every((produk) => produk.kategori === 'Furnitur'));
});

test('API menolak metode yang tidak didukung dan menjawab preflight', async () => {
  const post = await fetch(`${basis}/api/produk`, { method: 'POST' });
  assert.equal(post.status, 405);
  assert.match(post.headers.get('allow'), /GET/);

  const opsi = await fetch(`${basis}/api/produk`, { method: 'OPTIONS' });
  assert.equal(opsi.status, 204);
  assert.equal(opsi.headers.get('access-control-allow-methods'), 'GET, HEAD, OPTIONS');
});

test('HEAD /api/produk tidak mengirim body', async () => {
  const res = await fetch(`${basis}/api/produk`, { method: 'HEAD' });

  assert.equal(res.status, 200);
  assert.equal(await res.text(), '');
});

test('endpoint API yang tidak dikenal mengembalikan JSON 404', async () => {
  const res = await fetch(`${basis}/api/tidak-ada`);

  assert.equal(res.status, 404);
  const body = await res.json();
  assert.match(body.error, /tidak ditemukan/i);
});

test('halaman utama memuat penjelasan dan tautan ketiga demo', async () => {
  const res = await fetch(`${basis}/`);
  const html = await res.text();

  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/html/);
  assert.match(html, /Tiga cara menyatukan/);
  assert.match(html, /\/iframe\//);
  assert.match(html, /\/web-component\//);
  assert.match(html, /\/import-map\//);
});

test('halaman demo iframe memakai sandbox dan halaman remote terpisah', async () => {
  const html = await (await fetch(`${basis}/iframe/`)).text();

  assert.match(html, /sandbox="allow-scripts"/);
  assert.match(html, /\/iframe\/remote\.html/);
  assert.match(html, /postMessage/);
});

test('halaman demo Web Component memakai custom element dan event', async () => {
  const html = await (await fetch(`${basis}/web-component/`)).text();

  assert.match(html, /<tokomicro-product-card/);
  assert.match(html, /add-to-cart/);
});

test('halaman import map memetakan @lab/remote ke berkas remote.js', async () => {
  const html = await (await fetch(`${basis}/import-map/`)).text();

  assert.match(html, /type="importmap"/);
  assert.match(html, /"@lab\/remote":\s*"\/import-map\/remote\.js"/);
});

test('modul remote dan custom element dilayani sebagai JavaScript', async () => {
  const remote = await fetch(`${basis}/import-map/remote.js`);
  assert.equal(remote.status, 200);
  assert.match(remote.headers.get('content-type'), /text\/javascript/);
  assert.match(await remote.text(), /export function mount/);

  const kartu = await fetch(`${basis}/web-component/product-card.js`);
  assert.equal(kartu.status, 200);
  assert.match(kartu.headers.get('content-type'), /text\/javascript/);
  assert.match(await kartu.text(), /attachShadow/);
});

test('URL folder tanpa garis miring dialihkan ke versi bergaris miring', async () => {
  const res = await fetch(`${basis}/iframe`, { redirect: 'manual' });

  assert.equal(res.status, 301);
  assert.equal(res.headers.get('location'), '/iframe/');
});

test('server tidak menyajikan berkas di luar folder public', async () => {
  const langsung = await fetch(`${basis}/server.js`);
  assert.equal(langsung.status, 404);

  const traversal = await mintaMentah('/..%2F..%2Fserver.js');
  assert.equal(traversal.status, 404);
  assert.doesNotMatch(traversal.body, /createServer/);
});
