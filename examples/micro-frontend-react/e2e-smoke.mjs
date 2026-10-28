/**
 * Uji asap browser headless (Playwright) untuk TokoMicro React.
 *
 * Jalankan setelah build:  node e2e-smoke.mjs
 *
 * Skrip menyalakan server sendiri bila belum ada, lalu menguji alur nyata:
 *   1. Shell memuat remote header + katalog lewat Module Federation.
 *   2. Tambah ke keranjang → badge header ikut berubah.
 *   3. Rute detail dikelola remote katalog.
 *   4. Checkout tanpa sesi diarahkan ke login shell.
 *   5. Login → kembali ke checkout → pesanan dibuat.
 *   6. Sesi dipulihkan lewat cookie setelah reload.
 *   7. Profil dan riwayat pesanan dari remote akun.
 *   8. Tema, status remote, dan aplikasi legacy.
 *   9. Satu remote yang gagal tidak menjatuhkan shell.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:4173';
const errors = [];
let gagal = false;
let server = null;

function catat(pesan, ok) {
  console.log(`${ok ? '✔' : '✘'} ${pesan}`);
  if (!ok) gagal = true;
}

async function serverHidup() {
  try {
    const response = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(1000) });
    return response.ok;
  } catch {
    return false;
  }
}

async function pastikanServer() {
  if (await serverHidup()) {
    console.log('• Memakai server yang sudah berjalan.');
    return;
  }

  const logPath = path.join(ROOT, 'tests', 'e2e-server.log');
  const output = fs.createWriteStream(logPath);
  server = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  server.stdout.pipe(output);
  server.stderr.pipe(output);

  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await serverHidup()) {
      console.log('• Server uji dinyalakan sendiri.');
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Server tidak siap. Periksa ${logPath}`);
}

await pastikanServer();

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
});

try {
  /* Bahasa dipaksa Indonesia supaya label uji stabil. */
  await page.addInitScript(() => localStorage.setItem('tokomicro.locale', 'id'));

  /* 1. Shell + remote katalog. */
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Tambah ke keranjang' }).first().waitFor({
    state: 'visible',
    timeout: 20_000
  });
  catat('Shell memuat remote katalog lewat Module Federation', page.url().endsWith('/katalog'));
  catat('Remote header ikut termuat', await page.locator('header.hd').isVisible());

  /* 2. Tambah ke keranjang → badge header. */
  await page.getByRole('button', { name: 'Tambah ke keranjang' }).first().click();
  const badge = page.locator('.hd-nav .tm-badge');
  await badge.waitFor({ state: 'visible', timeout: 5_000 });
  catat(`Badge header berisi "1" (aktual: "${(await badge.innerText()).trim()}")`, (await badge.innerText()).trim() === '1');
  catat('Toast sukses muncul', await page.locator('.toast-success').first().isVisible());

  /* 3. Rute detail dikelola remote katalog. */
  await page.getByRole('link', { name: 'Detail produk' }).first().click();
  await page.waitForURL(/\/katalog\/detail\/kb-01$/, { timeout: 5_000 });
  catat('Remote katalog menangani rute detail', page.url().endsWith('/katalog/detail/kb-01'));
  await page.getByRole('link', { name: 'Kembali ke katalog' }).click();
  await page.getByRole('button', { name: 'Tambah ke keranjang' }).first().waitFor();

  /* 4. Checkout tanpa sesi → login shell. */
  await page.getByRole('link', { name: /^Keranjang/ }).click();
  await page.getByRole('button', { name: 'Buat pesanan' }).click();
  await page.waitForURL(/\/keranjang\/checkout$/, { timeout: 5_000 });
  catat('Halaman checkout dimuat di dalam remote keranjang', true);

  await page.getByRole('button', { name: 'Buat pesanan' }).click();
  await page.getByRole('heading', { name: 'Masuk ke TokoMicro' }).waitFor({ timeout: 8_000 });
  catat('Checkout tanpa sesi diarahkan ke login shell', page.url().includes('/masuk?next='));

  /* 5. Login → kembali ke checkout → pesanan dibuat. */
  await page.getByLabel('Nama pengguna').fill('demo');
  await page.getByLabel('Kata sandi').fill('demo123');
  await page.getByRole('main').getByRole('button', { name: 'Masuk', exact: true }).click();
  await page.waitForURL(/\/keranjang\/checkout$/, { timeout: 10_000 });
  catat('Login mengembalikan pengguna ke halaman checkout', true);

  await page.getByRole('button', { name: 'Buat pesanan' }).click();
  const nomorPesanan = page.getByText(/Pesanan ORD-[A-Z0-9]+ diterima/).first();
  await nomorPesanan.waitFor({ state: 'visible', timeout: 15_000 });
  const teksPesanan = (await nomorPesanan.innerText()).trim();
  catat(`Pesanan dibuat (${teksPesanan})`, /ORD-[A-Z0-9]+/.test(teksPesanan));

  /* 6. Sesi dipulihkan lewat cookie httpOnly setelah reload. */
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('header.hd').waitFor({ timeout: 15_000 });
  await page.getByText(/Halo, Dewi Lestari/).waitFor({ timeout: 10_000 });
  catat('Sesi dipulihkan lewat cookie setelah reload', true);

  /* 7. Remote akun: profil + riwayat. */
  await page.getByRole('link', { name: 'Akun' }).click();
  await page.waitForURL(/\/akun$/, { timeout: 10_000 });
  await page.getByRole('heading', { name: 'Profil' }).waitFor();
  catat('Remote akun menampilkan profil dari ctx.user', true);

  await page.getByRole('link', { name: /Riwayat pesanan/ }).first().click();
  await page.waitForURL(/\/akun\/pesanan$/, { timeout: 5_000 });
  await page.getByText(/ORD-[A-Z0-9]+/).first().waitFor({ timeout: 10_000 });
  catat('Riwayat pesanan diambil remote akun dengan token shell', true);

  /* 7b. Otorisasi admin: guard klien + penolakan server. */
  await page.goto(`${BASE}/akun/admin`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Akses ditolak' }).waitFor({ timeout: 10_000 });
  catat('Customer ditolak di /akun/admin oleh guard shell', true);

  const loginCustomer = await context.request.post(`${BASE}/api/login`, {
    data: { username: 'demo', password: 'demo123' }
  });
  const { token: tokenCustomer } = await loginCustomer.json();
  const ordersCustomer = await context.request.get(`${BASE}/api/orders?scope=all`, {
    headers: { Authorization: `Bearer ${tokenCustomer}` }
  });
  const statusCustomer = ordersCustomer.status();
  catat(`Server menolak customer di scope=all dengan 403 (aktual: ${statusCustomer})`, statusCustomer === 403);

  await page.getByRole('button', { name: 'Keluar' }).click();
  await page.goto(`${BASE}/masuk?next=%2Fakun%2Fadmin`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Nama pengguna').fill('admin');
  await page.getByLabel('Kata sandi').fill('admin123');
  await page.getByRole('main').getByRole('button', { name: 'Masuk', exact: true }).click();
  await page.waitForURL(/\/akun\/admin$/, { timeout: 10_000 });
  await page.getByRole('heading', { name: 'Semua pesanan (admin)' }).waitFor({ timeout: 10_000 });
  await page.getByText(/Pemilik:/).first().waitFor({ timeout: 10_000 });
  catat('Admin melihat seluruh pesanan lewat /api/orders?scope=all', true);

  /* 8. Tema, status, legacy. */
  const temaAwal = await page.locator('html').getAttribute('data-theme');
  await page.getByRole('button', { name: /Aktifkan tema/ }).click();
  const temaAkhir = await page.locator('html').getAttribute('data-theme');
  catat(`Tema berubah (${temaAwal} → ${temaAkhir})`, temaAwal !== temaAkhir);

  await page.getByRole('link', { name: 'Status' }).click();
  await page.getByRole('heading', { name: 'Status Remote' }).waitFor({ timeout: 8_000 });
  const kartuRemote = await page.locator('.status-grid .tm-card').count();
  catat(`Halaman status menampilkan ${kartuRemote} remote`, kartuRemote === 4);

  await page.getByRole('link', { name: 'Katalog lama' }).click();
  await page.waitForURL(/\/katalog-lama$/, { timeout: 5_000 });
  const frame = page.frameLocator('iframe.legacy-frame');
  await frame.getByText('Keyboard Mekanik').waitFor({ timeout: 10_000 });
  catat('Aplikasi legacy tampil di iframe dan memuat produk', true);

  /* 9. Isolasi kegagalan: blokir seluruh origin remote keranjang. */
  const isolated = await context.newPage();
  await isolated.addInitScript(() => localStorage.setItem('tokomicro.locale', 'id'));
  await isolated.route('http://localhost:4176/**', (route) => route.abort());
  await isolated.goto(`${BASE}/keranjang`, { waitUntil: 'domcontentloaded' });
  await isolated.getByRole('heading', { name: /Modul Keranjang tidak dapat dimuat/ }).waitFor({
    timeout: 20_000
  });
  await isolated.locator('header.hd').waitFor({ state: 'visible', timeout: 10_000 });
  catat('Remote keranjang gagal tanpa menjatuhkan shell', await isolated.locator('header.hd').isVisible());
  await isolated.close();
} catch (err) {
  gagal = true;
  console.log(`✘ Gagal: ${err.message}`);
} finally {
  const errorBersih = errors.filter((entry) => !/favicon/i.test(entry));
  if (errorBersih.length > 0) {
    gagal = true;
    console.log('✘ Ada error browser:');
    for (const entry of errorBersih) console.log(`   - ${entry}`);
  } else {
    console.log('✔ Tidak ada error console/pageerror pada alur utama');
  }

  await browser.close();
  if (server) server.kill('SIGTERM');
}

console.log(gagal ? '\nHASIL: GAGAL' : '\nHASIL: LULUS');
process.exit(gagal ? 1 : 0);
