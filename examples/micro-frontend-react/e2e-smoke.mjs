/**
 * Uji asap browser headless (Playwright) untuk TokoMicro React.
 *
 * Jalankan setelah build & server hidup:  node e2e-smoke.mjs
 * Alur yang diuji:
 *   1. Buka shell, pastikan tidak ada error console/pageerror.
 *   2. Tekan "Tambah ke keranjang" pada produk pertama → badge header = 1.
 *   3. Pindah ke #/keranjang, tekan "Buat pesanan" → muncul ORD-0001.
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:4173';
const errors = [];
let gagal = false;

function catat(pesan, ok) {
  console.log(`${ok ? '✔' : '✘'} ${pesan}`);
  if (!ok) gagal = true;
}

const browser = await chromium.launch();
const page = await browser.newPage();

page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
});

try {
  await page.goto(BASE, { waitUntil: 'networkidle' });

  /* 1. Produk remote termuat lewat Module Federation. */
  const tombolTambah = page.getByRole('button', { name: 'Tambah ke keranjang' }).first();
  await tombolTambah.waitFor({ state: 'visible', timeout: 15000 });
  catat('Katalog produk dimuat (remote products OK)', true);

  /* 2. Tekan tambah → badge header menunjukkan 1. */
  await tombolTambah.click();
  const badge = page.locator('.hd-badge');
  await badge.waitFor({ state: 'visible', timeout: 5000 });
  const isiBadge = (await badge.innerText()).trim();
  catat(`Badge header berisi "1" (aktual: "${isiBadge}")`, isiBadge === '1');

  /* 3. Pindah ke keranjang dan checkout. */
  await page.evaluate(() => {
    location.hash = '#/keranjang';
  });
  const tombolPesan = page.getByRole('button', { name: 'Buat pesanan' });
  await tombolPesan.waitFor({ state: 'visible', timeout: 15000 });
  catat('Halaman keranjang dimuat (remote cart OK)', true);

  await tombolPesan.click();
  await page.getByText('ORD-0001').first().waitFor({ state: 'visible', timeout: 15000 });
  catat('Teks "ORD-0001" muncul setelah checkout', true);
} catch (err) {
  gagal = true;
  console.log(`✘ Gagal: ${err.message}`);
} finally {
  /* 4. Tidak boleh ada error console/pageerror sama sekali. */
  const errorTanpaFavicon = errors.filter((e) => !/favicon/i.test(e));
  if (errorTanpaFavicon.length > 0) {
    gagal = true;
    console.log('✘ Ada error browser:');
    for (const e of errorTanpaFavicon) console.log(`   - ${e}`);
  } else {
    console.log(`✔ Tidak ada error console/pageerror (${errors.length} aba-aba favicon diabaikan)`);
  }

  await browser.close();
}

console.log(gagal ? '\nHASIL: GAGAL' : '\nHASIL: LULUS');
process.exit(gagal ? 1 : 0);
