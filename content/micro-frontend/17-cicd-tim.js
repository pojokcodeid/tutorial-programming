/* ============================================================
   Pelajaran Micro-Frontend — Bab 17: CI/CD dan Kepemilikan Tim
   ============================================================ */
'use strict';

window.MICROFRONTEND_LESSONS = window.MICROFRONTEND_LESSONS || [];

window.MICROFRONTEND_LESSONS.push({
  id: 'mf-cicd-tim',
  title: 'CI/CD dan Kepemilikan Tim',
  chapter: 'Kualitas & Operasi',
  duration: '18 menit',
  intro: [
    'Rilis mandiri hanya nyata bila setiap tim bisa membuktikan kualitas remote-nya sendiri. Di sinilah CI/CD berperan: ia mengubah kesepakatan tim menjadi langkah otomatis yang sama untuk semua orang, bukan ingatan seseorang di dokumen wiki.',
    'Bab ini membedah <code>.github/workflows/ci.yml</code> dan <code>release.yml</code> milik TokoMicro. Kamu akan melihat urutan typecheck, unit test, build, E2E, dan anggaran performa, lalu menghubungkannya dengan branch protection, CODEOWNERS, dan kepemilikan remote.',
    'Kamu juga akan menambah quality gate dan sengaja membuat PR gagal untuk memahami bagaimana pipeline menghentikan perubahan berbahaya sebelum sampai ke pengguna.'
  ],
  objectives: [
    'Membaca alur CI dan workflow rilis TokoMicro',
    'Menjelaskan affected build dan filter paths pada monorepo',
    'Menambahkan quality gate performa serta artefak build',
    'Menerapkan branch protection, trunk-based, dan CODEOWNERS',
    'Memetakan setiap remote ke tim pemilik dan kontrak versinya'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Pipeline adalah Kontrak yang Dieksekusi</h3><p>Setiap remote punya janji yang sama: kode bertipe, unit test lulus, build menghasilkan <code>remoteEntry.js</code>, alur nyata di browser bekerja, dan ukuran bundel tidak melewati anggaran. Pipeline menjalankan janji itu berurutan dari yang paling murah ke paling mahal.</p><p>Urutan yang sehat adalah <b>typecheck → unit test → build → E2E → perf → artefak</b>. Typecheck dan unit test memberi umpan balik dalam hitungan detik. E2E dan perf lebih lambat, jadi dijalankan setelah build berhasil. Bila langkah awal gagal, pipeline berhenti dan tidak membuang waktu di browser.</p><p>Pipeline yang hijau bukan formalitas. Ia adalah <b>syarat merge</b> yang membuat tim lain percaya bahwa remote yang mereka muat tidak akan merusak halaman.</p>'
    },
    {
      type: 'example',
      title: 'ci.yml: verifikasi workspace dan dependensinya',
      lang: 'yaml',
      output: false,
      code: `name: CI
on:
  push:
    branches: [main]
    paths:
      - 'examples/micro-frontend-react/**'
      - '.github/workflows/ci.yml'
  pull_request:
    paths:
      - 'examples/micro-frontend-react/**'

defaults:
  run:
    working-directory: examples/micro-frontend-react

jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: examples/micro-frontend-react/package-lock.json
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - run: npm run perf
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: tokomicro-dist
          path: examples/micro-frontend-react/apps/*/dist
          if-no-files-found: ignore`,
      explain: [
        '<code>paths</code> membatasi pipeline pada perubahan proyek ini. Tim remote lain tidak perlu menunggu CI yang tidak relevan.',
        '<code>npm ci</code> memasang versi persis dari lockfile. Jangan memakai <code>npm install</code> di CI karena hasilnya bisa berbeda dari mesin pengembang.',
        'Artefak diunggah dengan <code>if: always()</code> agar log build tetap bisa diperiksa ketika pipeline gagal.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Affected Build dan Kepemilikan</h3><p>Di repo kecil, membangun semua aplikasi masih murah. Di repo besar, setiap PR tidak perlu membangun seluruh dunia. <b>Affected build</b> hanya membangun paket yang berubah beserta paket yang bergantung padanya. Turbo dapat melakukannya dengan filter seperti <code>turbo run build --filter=...[origin/main]</code>, sementara CI tetap menjalankan typecheck dan test untuk paket terdampak.</p><p>Namun ada jebakan: perubahan di <code>packages/contracts</code> atau <code>packages/shared</code> memengaruhi banyak remote. Filter paths harus memasukkan paket bersama, bukan hanya folder remote. Itulah sebabnya contoh di atas memakai <code>examples/micro-frontend-react/**</code> yang mencakup seluruh workspace.</p><table class="vocab"><tr><th>Remote</th><th>Pemilik</th><th>Kontrak utama</th></tr><tr><td><code>header</code></td><td>Tim Chrome</td><td>nav, badge, tema, locale</td></tr><tr><td><code>products</code></td><td>Tim Katalog</td><td>daftar produk, detail, event tambah</td></tr><tr><td><code>cart</code></td><td>Tim Transaksi</td><td>item keranjang, checkout</td></tr><tr><td><code>account</code></td><td>Tim Akun</td><td>profil, riwayat pesanan</td></tr></table><p>Kepemilikan bukan hanya nama di tabel. Tim pemilik menanggung review, on-call, dan rollback remote tersebut.</p>'
    },
    {
      type: 'example',
      title: 'release.yml: rilis manual dengan input yang jelas',
      lang: 'yaml',
      output: false,
      code: `name: Rilis Remote
on:
  workflow_dispatch:
    inputs:
      remote:
        type: choice
        options: [header, products, cart, account]
        required: true
      version:
        description: Versi semver, misalnya 1.1.0
        required: true
      canary:
        type: boolean
        default: false

defaults:
  run:
    working-directory: examples/micro-frontend-react

jobs:
  release:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
      - name: Rilis ke CDN
        run: |
          REMOTE=$(jq -r '.inputs.remote' "$GITHUB_EVENT_PATH")
          VERSION=$(jq -r '.inputs.version' "$GITHUB_EVENT_PATH")
          CANARY=$(jq -r '.inputs.canary // false' "$GITHUB_EVENT_PATH")
          if [ "$CANARY" = "true" ]; then EXTRA="--canary"; else EXTRA=""; fi
          node scripts/release.mjs "$REMOTE" "$VERSION" $EXTRA
      - uses: actions/upload-artifact@v4
        with:
          name: rilis-manual
          path: |
            cdn/manifest.json
            cdn/`,
      explain: [
        '<code>workflow_dispatch</code> membuat rilis menjadi keputusan sadar: pilih remote, isi versi, dan tentukan canary. Tidak ada rilis produksi yang terpicu hanya karena sebuah commit masuk ke main.',
        'Input dibaca lewat <code>GITHUB_EVENT_PATH</code> dan <code>jq</code> agar nilai tidak diinterpolasi langsung ke shell. Ini mengurangi risiko injeksi perintah dari input.',
        'Di produksi, langkah berikutnya adalah mengunggah folder versi ke CDN dan mengganti manifest. Rollback berarti mengganti manifest ke versi lama, bukan membangun ulang semuanya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Branch Protection, Trunk-Based, dan CODEOWNERS</h3><p><b>Trunk-based development</b> berarti perubahan masuk ke <code>main</code> lewat PR kecil yang sering, bukan cabang panjang yang hidup berminggu-minggu. Semakin lama cabang hidup, semakin besar konflik dan semakin mahal integrasinya.</p><p>Lindungi <code>main</code> dengan aturan berikut: wajib PR, wajib review, wajib status check CI, larangan push langsung, dan riwayat linear. Untuk kontrak bersama, wajibkan review dari tim platform dan tim yang terdampak.</p><pre><code># .github/CODEOWNERS\n/apps/header/       @tokomicro/tim-chrome\n/apps/products/     @tokomicro/tim-katalog\n/apps/cart/         @tokomicro/tim-transaksi\n/apps/account/      @tokomicro/tim-akun\n/packages/contracts/ @tokomicro/platform @tokomicro/tim-katalog\n/packages/ui-kit/   @tokomicro/design-system</code></pre><p>CODEOWNERS bukan pengganti pengujian. Ia memastikan orang yang memahami risiko kontrak melihat perubahan sebelum merge.</p>'
    },
    {
      type: 'example',
      title: 'Praktik: baca CI, tambah quality gate, simulasi PR gagal',
      lang: 'bash',
      output: false,
      code: `cd examples/micro-frontend-react

# 1. Baca workflow dan cari langkah perf
sed -n '1,90p' .github/workflows/ci.yml
grep -n "npm run perf" .github/workflows/ci.yml

# 2. Bila belum ada, tambahkan setelah langkah E2E:
#      - name: Anggaran performa
#        run: npm run perf

# 3. Simulasi PR gagal dengan tes sementara
cat > tests/pr-gagal.test.ts <<'EOF'
import { expect, test } from 'vitest';
test('simulasi PR gagal', () => {
  expect(1).toBe(2);
});
EOF
npm test
rm tests/pr-gagal.test.ts

# 4. Jalankan urutan yang sama dengan CI
npm run typecheck && npm test && npm run build && npm run perf`,
      explain: [
        'Langkah <code>npm run perf</code> memeriksa anggaran bundel: shell 320 kB dan setiap remote 140 kB (gzip). Bila melewati batas, skrip keluar dengan kode 1 dan pipeline berhenti.',
        'Tes sementara di atas sengaja gagal. Di GitHub, PR akan menampilkan check merah dan tombol merge terkunci oleh branch protection. Hapus berkas setelah latihan.',
        'Menjalankan urutan yang sama secara lokal mempercepat debugging; CI bukan tempat pertama kali kamu mengetahui ada kesalahan tipe.'
      ]
    },
    {
      type: 'warn',
      title: 'Jangan Memberi Kredensial Rilis ke Pull Request',
      text: 'Workflow yang berjalan pada <code>pull_request_target</code> lalu melakukan checkout kode dari fork bisa mengeksekusi kode penyerang dengan secret organisasi. Jangan menaruh token CDN, kredensial registry, atau izin deploy di workflow PR. Rilis produksi sebaiknya hanya lewat <code>workflow_dispatch</code> dari <code>main</code>, memakai environment dengan persetujuan, dan hak akses minimum.'
    },
    {
      type: 'text',
      html: '<h3>Checkpoint: Pipeline yang Dapat Dipercaya</h3><p>Setelah latihan, kumpulkan bukti berikut:</p><ul><li><code>npm run typecheck</code>, <code>npm test</code>, <code>npm run build</code>, dan <code>npm run perf</code> lulus di mesinmu.</li><li>PR percobaan menampilkan check CI merah saat tes sengaja gagal, lalu hijau setelah tes dihapus.</li><li>Halaman Actions menyimpan artefak <code>tokomicro-dist</code> dan log perf.</li><li>Workflow <b>Rilis Remote</b> hanya bisa dijalankan manual dan meminta remote, versi, serta canary.</li><li>File <code>CODEOWNERS</code> memetakan setiap folder remote ke tim yang tepat.</li></ul><p><b>Kriteria lulus:</b> kamu dapat menjelaskan mengapa PR gagal tidak bisa di-merge, langkah mana yang paling cepat memberi umpan balik, dan bagaimana rilis dapat dilakukan tanpa memberi developer akses langsung ke CDN.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['CI', 'Integrasi berkelanjutan: setiap perubahan diuji dan dibangun otomatis.'],
        ['CD', 'Pengiriman atau deploy berkelanjutan dengan gerbang kualitas yang jelas.'],
        ['Affected build', 'Hanya membangun paket yang berubah dan paket yang bergantung padanya.'],
        ['Quality gate', 'Pemeriksaan yang harus lulus sebelum perubahan boleh merge atau rilis.'],
        ['Branch protection', 'Aturan yang melarang push langsung dan mewajibkan review serta status check.'],
        ['CODEOWNERS', 'Berkas yang menentukan reviewer wajib untuk folder atau berkas tertentu.'],
        ['Trunk-based', 'Kebiasaan merge perubahan kecil ke main sesering mungkin.'],
        ['workflow_dispatch', 'Pemicu GitHub Actions untuk menjalankan workflow secara manual dengan input.'],
        ['Artefak', 'Hasil build atau laporan yang disimpan untuk diperiksa dan dirilis.']
      ]
    }
  ],
  recap: [
    'CI mengubah kesepakatan kualitas menjadi langkah otomatis yang sama untuk semua tim.',
    'Urutan pipeline dimulai dari pemeriksaan murah: typecheck, unit test, build, E2E, lalu perf.',
    'Filter paths dan affected build mempersingkat umpan balik, tetapi harus mencakup paket bersama.',
    'Rilis produksi dijalankan manual dengan input dan persetujuan, bukan otomatis dari setiap PR.',
    'Branch protection dan CODEOWNERS menjaga main tetap stabil serta kontrak tetap ditinjau pemiliknya.'
  ]
});
