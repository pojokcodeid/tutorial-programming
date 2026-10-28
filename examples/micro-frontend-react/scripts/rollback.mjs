#!/usr/bin/env node
/**
 * Rollback satu remote ke versi yang sudah pernah dirilis.
 *
 *   node scripts/rollback.mjs products
 *   node scripts/rollback.mjs products 1.0.0
 *
 * Tanpa argumen versi, skrip memilih versi stabil terbaru selain versi aktif.
 * Rollback hanya mengubah cdn/manifest.json — shell tidak perlu di-build ulang.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_PATH = path.join(ROOT, 'cdn/manifest.json');

function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

function readManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
}

function writeManifest(manifest) {
  const temporary = `${MANIFEST_PATH}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(manifest, null, 2)}\n`);
  fs.renameSync(temporary, MANIFEST_PATH);
}

function versionsOf(name) {
  const folder = path.join(ROOT, 'cdn', name);
  if (!fs.existsSync(folder)) return [];
  return fs
    .readdirSync(folder, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((version) => fs.existsSync(path.join(folder, version, 'assets', 'remoteEntry.js')));
}

function compare(a, b) {
  const left = a.split('.').map(Number);
  const right = b.split('.').map(Number);
  for (let index = 0; index < 3; index += 1) {
    if ((left[index] ?? 0) !== (right[index] ?? 0)) {
      return (left[index] ?? 0) - (right[index] ?? 0);
    }
  }
  return 0;
}

const [name, requested] = process.argv.slice(2);
if (!name) fail('Pemakaian: node scripts/rollback.mjs <remote> [versi]');

const manifest = readManifest();
const current = manifest.remotes?.[name]?.version;
const available = versionsOf(name).sort(compare);

if (available.length === 0) fail(`Belum ada versi rilis untuk "${name}".`);

const target = requested ?? [...available].reverse().find((version) => version !== current);
if (!target) fail(`Tidak ada versi lain untuk dituju selain ${current}.`);
if (!available.includes(target)) {
  fail(`Versi ${target} tidak ada. Tersedia: ${available.join(', ')}`);
}

manifest.generatedAt = new Date().toISOString();
manifest.remotes[name] = {
  ...(manifest.remotes[name] ?? {}),
  version: target,
  status: 'stable',
  releasedAt: new Date().toISOString()
};
writeManifest(manifest);

console.log(`✔ ${name} di-rollback dari ${current ?? '—'} ke ${target}.`);
