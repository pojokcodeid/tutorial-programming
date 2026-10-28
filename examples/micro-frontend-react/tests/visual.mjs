/**
 * Uji visual ringan.
 *
 *   node tests/visual.mjs
 *
 * Skrip tidak membandingkan pixel dengan baseline (itu butuh layanan khusus),
 * tetapi memastikan halaman utama benar-benar merender isi, bukan layar kosong,
 * lalu menyimpan tangkapan layar untuk ditinjau manusia.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tests', 'screenshots');
const BASE = 'http://localhost:4173';
let server = null;

async function sehat() {
  try {
    const response = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(1000) });
    return response.ok;
  } catch {
    return false;
  }
}

if (!(await sehat())) {
  server = spawn(process.execPath, ['server.js'], { cwd: ROOT, stdio: 'ignore' });
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await sehat()) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
await page.addInitScript(() => localStorage.setItem('tokomicro.locale', 'id'));

let gagal = false;

async function ambil(nama, siap) {
  await siap();
  const buffer = await page.screenshot({ path: path.join(OUT, `${nama}.png`), fullPage: true });
  const cukup = buffer.length > 20_000;
  console.log(`${cukup ? '✔' : '✘'} ${nama}.png (${(buffer.length / 1024).toFixed(0)} kB)`);
  if (!cukup) gagal = true;
}

try {
  await page.goto(`${BASE}/katalog`, { waitUntil: 'domcontentloaded' });
  await ambil('katalog-terang', async () => {
    await page.getByRole('button', { name: 'Tambah ke keranjang' }).first().waitFor({
      timeout: 20_000
    });
  });

  await page.getByRole('button', { name: /Aktifkan tema/ }).click();
  await ambil('katalog-gelap', async () => {
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
  });

  await page.goto(`${BASE}/status`, { waitUntil: 'domcontentloaded' });
  await ambil('status-remote', async () => {
    await page.getByRole('heading', { name: 'Status Remote' }).waitFor({ timeout: 10_000 });
    await page.locator('.status-grid .tm-card').first().waitFor();
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/katalog`, { waitUntil: 'domcontentloaded' });
  await ambil('katalog-mobile', async () => {
    await page.getByRole('button', { name: 'Tambah ke keranjang' }).first().waitFor({
      timeout: 20_000
    });
  });
} catch (error) {
  gagal = true;
  console.log(`✘ ${error.message}`);
} finally {
  await browser.close();
  if (server) server.kill('SIGTERM');
}

console.log(`\nTangkapan layar: ${path.relative(ROOT, OUT)}`);
console.log(gagal ? 'HASIL: GAGAL' : 'HASIL: LULUS');
process.exit(gagal ? 1 : 0);
