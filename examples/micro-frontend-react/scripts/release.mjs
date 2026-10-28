#!/usr/bin/env node
/**
 * Rilis satu remote ke CDN lokal.
 *
 *   node scripts/release.mjs products 1.1.0
 *   node scripts/release.mjs products 1.1.0 --canary
 *   node scripts/release.mjs --all
 *
 * Skrip ini:
 *   1. menyalin apps/<remote>/dist ke cdn/<remote>/<versi>;
 *   2. memperbarui cdn/manifest.json secara atomik;
 *   3. tidak menyentuh shell — shell membaca manifest saat runtime.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_PATH = path.join(ROOT, 'cdn/manifest.json');
const REMOTES = ['header', 'products', 'cart', 'account'];
const OWNERS = {
  header: 'Tim Chrome',
  products: 'Tim Katalog',
  cart: 'Tim Transaksi',
  account: 'Tim Akun'
};

function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

function readManifest() {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  } catch {
    return { generatedAt: new Date().toISOString(), remotes: {} };
  }
}

function writeManifest(manifest) {
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  const temporary = `${MANIFEST_PATH}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(manifest, null, 2)}\n`);
  fs.renameSync(temporary, MANIFEST_PATH);
}

function remoteVersion(name) {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'apps', name, 'package.json'), 'utf8')
  );
  return pkg.version ?? '1.0.0';
}

function release(name, version, status) {
  if (!REMOTES.includes(name)) fail(`Remote tidak dikenal: ${name}`);
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    fail(`Versi harus semver, misalnya 1.1.0 (diterima: ${version}).`);
  }

  const source = path.join(ROOT, 'apps', name, 'dist');
  if (!fs.existsSync(path.join(source, 'assets', 'remoteEntry.js'))) {
    fail(`Build ${name} tidak ditemukan. Jalankan "npm run build" lebih dulu.`);
  }

  const target = path.join(ROOT, 'cdn', name, version);
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true });

  const manifest = readManifest();
  manifest.generatedAt = new Date().toISOString();
  manifest.remotes ??= {};
  manifest.remotes[name] = {
    version,
    owner: OWNERS[name],
    status,
    releasedAt: new Date().toISOString()
  };
  writeManifest(manifest);

  console.log(`✔ ${name}@${version} (${status}) → cdn/${name}/${version}`);
}

const args = process.argv.slice(2);
const canary = args.includes('--canary');
const status = canary ? 'canary' : 'stable';
const clean = args.filter((argument) => argument !== '--canary');

if (clean.includes('--all')) {
  for (const name of REMOTES) release(name, remoteVersion(name), status);
} else {
  const [name, version] = clean;
  if (!name) {
    fail('Pemakaian: node scripts/release.mjs <remote> <versi> [--canary] | --all');
  }
  release(name, version ?? remoteVersion(name), status);
}

console.log('Manifest diperbarui. Muat ulang shell untuk memakai versi baru.');
