/**
 * Test minimal tanpa server hidup.
 *
 * Yang diuji:
 * 1. fungsi murni format remote + validasi
 * 2. isi konfigurasi Webpack/Rspack (kontrak federasi)
 * 3. artefak build kalau sudah ada (kalau belum, test artefak di-skip)
 *
 * Jalankan: npm test
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  federationRemote,
  parseRemoteUrl,
  HOST_PORT,
  REMOTE_PORT,
} from './lib/lab-config.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const read = (relativePath) => readFileSync(path.join(ROOT, relativePath), 'utf8');

test('port dan URL federasi konsisten', () => {
  assert.equal(HOST_PORT, 4181);
  assert.equal(REMOTE_PORT, 4182);
  assert.equal(federationRemote(), 'remote@http://localhost:4182/remoteEntry.js');
});

test('parseRemoteUrl menerima format name@url', () => {
  const parsed = parseRemoteUrl('remote@http://localhost:4182/remoteEntry.js');

  assert.equal(parsed.name, 'remote');
  assert.equal(parsed.url, 'http://localhost:4182/remoteEntry.js');
  assert.equal(parsed.entry, 'remote@http://localhost:4182/remoteEntry.js');
});

test('parseRemoteUrl menolak format yang salah', () => {
  assert.throws(() => parseRemoteUrl('remote'), /format remote tidak valid/);
  assert.throws(
    () => parseRemoteUrl('remote@ftp://localhost/remoteEntry.js'),
    /http atau https/
  );
  assert.throws(
    () => parseRemoteUrl('remote@http://localhost:4182/remoteEntry'),
    /berkas \.js/
  );
  assert.throws(() => parseRemoteUrl('remote@'), /format remote tidak valid/);
});

test('host Webpack memakai ModuleFederationPlugin, React.lazy, dan singleton', () => {
  const config = read('apps/host/webpack.config.mjs');
  const app = read('apps/host/src/App.tsx');

  assert.match(config, /ModuleFederationPlugin/);
  assert.match(config, /remotes:\s*\{/);
  assert.match(config, /federationRemote\(\)/);
  assert.match(config, /singleton:\s*true/);
  assert.match(app, /React\.lazy\(\(\) => import\('remote\/App'\)\)/);
  assert.match(app, /React\.Suspense/);
});

test('remote Webpack mengekspos ./App sebagai remoteEntry.js', () => {
  const config = read('apps/remote/webpack.config.mjs');

  assert.match(config, /filename:\s*'remoteEntry\.js'/);
  assert.match(config, /exposes:\s*\{/);
  assert.match(config, /'\.\/App':\s*'\.\/src\/App\.tsx'/);
  assert.match(config, /singleton:\s*true/);
});

test('varian Rspack tersedia untuk host dan remote', () => {
  for (const appName of ['host', 'remote']) {
    const config = read(`apps/${appName}/rspack.config.mjs`);

    assert.match(config, /@rspack\/core/);
    assert.match(config, /ModuleFederationPlugin/);
    assert.match(config, /singleton:\s*true/);
  }
});

test('artefak build diperiksa kalau sudah ada', (t) => {
  const hostIndex = path.join(ROOT, 'apps/host/dist/index.html');
  const remoteEntry = path.join(ROOT, 'apps/remote/dist/remoteEntry.js');

  if (!existsSync(hostIndex) || !existsSync(remoteEntry)) {
    t.skip('dist belum ada — jalankan "npm run build" untuk memeriksa artefak');
    return;
  }

  const html = readFileSync(hostIndex, 'utf8');
  const entry = readFileSync(remoteEntry, 'utf8');

  // html-webpack-plugin meminimalkan HTML di mode production,
  // jadi atribut id bisa ditulis tanpa tanda kutip: <div id=root>.
  assert.match(html, /<div id=["']?root["']?><\/div>/);
  assert.ok(entry.length > 100, 'remoteEntry.js tidak boleh kosong');
  assert.match(entry, /remote/);
});
