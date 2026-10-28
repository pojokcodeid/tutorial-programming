#!/usr/bin/env node
/**
 * Laporan ukuran bundel per aplikasi.
 *
 *   node scripts/perf-report.mjs
 *   node scripts/perf-report.mjs --live
 *
 * --live juga membaca /api/metrics/summary dari shell yang sedang berjalan,
 * sehingga angka Web Vitals dan waktu muat remote ikut terlihat.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const APPS = [
  { name: 'shell', dir: 'apps/shell/dist', budgetKb: 320 },
  { name: 'header', dir: 'apps/header/dist', budgetKb: 140 },
  { name: 'products', dir: 'apps/products/dist', budgetKb: 140 },
  { name: 'cart', dir: 'apps/cart/dist', budgetKb: 140 },
  { name: 'account', dir: 'apps/account/dist', budgetKb: 140 }
];

function walk(directory, files = []) {
  if (!fs.existsSync(directory)) return files;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith('.js') || entry.name.endsWith('.css')) files.push(full);
  }
  return files;
}

function kb(bytes) {
  return `${(bytes / 1024).toFixed(1)} kB`;
}

let failed = false;
const rows = [];

for (const app of APPS) {
  const files = walk(path.join(ROOT, app.dir));
  if (files.length === 0) {
    rows.push({ app: app.name, raw: '—', gzip: '—', budget: `${app.budgetKb} kB`, status: 'belum build' });
    continue;
  }

  let raw = 0;
  let gzip = 0;
  for (const file of files) {
    const buffer = fs.readFileSync(file);
    raw += buffer.length;
    gzip += zlib.gzipSync(buffer).length;
  }

  const over = gzip / 1024 > app.budgetKb;
  if (over) failed = true;
  rows.push({
    app: app.name,
    raw: kb(raw),
    gzip: kb(gzip),
    budget: `${app.budgetKb} kB`,
    status: over ? 'melebihi budget' : 'ok'
  });
}

console.table(rows);

async function liveReport() {
  try {
    const response = await fetch('http://localhost:4173/api/metrics/summary');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const summary = await response.json();
    console.log('\nTelemetri shell:');
    console.log(
      `  event ${summary.events} · error ${summary.errors} · metrik ${summary.metrics} · total ${summary.total}`
    );
    console.log('  per aplikasi:', summary.byApp);
  } catch (error) {
    console.log(`\n(Telemetri live tidak tersedia: ${error.message})`);
  }
}

if (process.argv.includes('--live')) await liveReport();

if (failed) {
  console.error('\n✖ Ada bundel yang melewati budget. Periksa dependensi atau pecah rute.');
  process.exit(1);
}

console.log('\n✔ Semua bundel berada dalam budget.');
