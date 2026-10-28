/* ============================================================
   Pelajaran Micro-Frontend — Bab 16: Rilis Mandiri, CDN
   Berversi, dan Rollback
   ============================================================ */
'use strict';

window.MICROFRONTEND_LESSONS = window.MICROFRONTEND_LESSONS || [];

window.MICROFRONTEND_LESSONS.push({
  id: 'mf-rilis-rollback',
  title: 'Rilis Mandiri, CDN Berversi, dan Rollback',
  chapter: 'Kualitas & Operasi',
  duration: '20 menit',
  intro: [
    'Sampai di sini kamu sudah punya shell dan empat remote yang berjalan. Pertanyaan yang menentukan apakah arsitektur ini benar-benar membantu adalah: bisakah tim katalog merilis perubahan tanpa membangun ulang shell dan remote lain?',
    'Jawabannya ada pada tiga hal sederhana yang sering diabaikan: artefak build disimpan di folder versi, URL remote dibaca dari manifest saat runtime, dan rollback cukup mengganti pointer manifest. Tidak ada build shell, tidak ada deploy ulang seluruh aplikasi.',
    'Bab ini membedah <code>scripts/release.mjs</code>, <code>scripts/rollback.mjs</code>, dan rute <code>/v/&lt;versi&gt;/</code> di <code>server.js</code>. Kamu akan mempraktikkan rilis <code>products</code> versi 1.0.1, memeriksa manifest, lalu mengembalikannya ke versi sebelumnya.'
  ],
  objectives: [
    'Menjelaskan struktur cdn/<remote>/<versi> dan rute /v/<versi>/',
    'Menjalankan rilis satu remote tanpa membangun ulang shell',
    'Membedakan cache immutable untuk aset berversi dan no-store untuk manifest',
    'Melakukan canary serta rollback lewat pointer manifest',
    'Menentukan urutan rilis yang aman ketika kontrak berubah'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Rilis Bukan Akhir dari Build</h3><p>Pada aplikasi monolith, build dan rilis adalah satu paket: semua halaman masuk ke satu bundel, lalu diunggah bersama. Pada micro-frontend, build hanya menghasilkan <b>artefak</b> milik satu remote. Artefak itu harus punya alamat permanen, versi yang jelas, dan cara kembali ke versi lama.</p><p>Di TokoMicro, alurnya seperti ini:</p><pre><code>apps/products/dist          →  cdn/products/1.0.1\n                                       ↓\nserver.js  /v/1.0.1/...     →  cdn/products/1.0.1/...\n                                       ↓\n/api/remotes                →  http://localhost:4175/v/1.0.1/assets/remoteEntry.js\n                                       ↓\nshell membaca manifest saat boot, lalu memuat remoteEntry versi tersebut</code></pre><p>Perhatikan bahwa shell tidak pernah menyebut nama berkas internal remote. Kontraknya hanya nama remote, URL <code>remoteEntry.js</code>, dan bentuk <code>./App</code>. Itulah yang membuat versi bisa diganti di luar siklus build shell.</p>'
    },
    {
      type: 'example',
      title: 'release.mjs: salin artefak dan tulis manifest secara atomik',
      lang: 'js',
      output: false,
      code: `const source = path.join(ROOT, 'apps', name, 'dist');
const target = path.join(ROOT, 'cdn', name, version);

fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.cpSync(source, target, { recursive: true });

const manifest = readManifest();
manifest.generatedAt = new Date().toISOString();
manifest.remotes[name] = {
  version,
  owner: OWNERS[name],
  status,
  releasedAt: new Date().toISOString()
};

const temporary = MANIFEST_PATH + '.tmp';
fs.writeFileSync(temporary, JSON.stringify(manifest, null, 2) + '\\n');
fs.renameSync(temporary, MANIFEST_PATH); // atomik pada filesystem yang sama`,
      explain: [
        'Folder tujuan memakai versi, bukan nama tetap. Dua rilis berbeda tidak saling menimpa, sehingga versi lama tetap ada untuk rollback.',
        'Manifest ditulis ke berkas sementara lalu di-rename. Pembaca tidak akan pernah melihat JSON setengah jadi, bahkan bila proses mati di tengah penulisan.',
        'Skrip ini tidak menyentuh <code>apps/shell</code>. Shell baru mengetahui versi baru ketika membaca <code>/api/remotes</code> pada pemuatan berikutnya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Dua Jenis Cache yang Tidak Boleh Dicampur</h3><p>Kesalahan cache adalah penyebab rollback yang tampak berhasil di server tetapi tetap gagal di browser. Aturannya bergantung pada apakah URL mengandung versi:</p><table class="vocab"><tr><th>URL</th><th>Header</th><th>Alasan</th></tr><tr><td><code>/v/1.0.1/assets/remoteEntry.js</code></td><td><code>public, max-age=31536000, immutable</code></td><td>URL sudah menunjuk versi tetap; isinya tidak boleh berubah.</td></tr><tr><td><code>/assets/remoteEntry.js</code> (tanpa versi)</td><td><code>no-cache</code></td><td>URL yang sama bisa menunjuk build baru; browser wajib revalidasi.</td></tr><tr><td><code>/api/remotes</code></td><td><code>no-store</code></td><td>Pointer versi harus selalu segar, terutama saat rollback.</td></tr></table><p>Di <code>server.js</code>, permintaan yang cocok dengan <code>/v/&lt;versi&gt;/</code> dilayani dari <code>cdn/&lt;nama&gt;/&lt;versi&gt;</code> dengan header immutable. Manifest API memakai <code>no-store</code>. Kombinasi ini membuat aset aman di-cache lama tanpa membuat pointer versi ikut membeku.</p>'
    },
    {
      type: 'example',
      title: 'Praktik: rilis products 1.0.1, cek manifest, lalu rollback',
      lang: 'bash',
      output: false,
      code: `cd examples/micro-frontend-react
npm install
npm run build
npm start

# terminal kedua
node scripts/release.mjs products 1.0.1
# sama dengan: npm run release -- products 1.0.1

curl -s http://localhost:4173/api/remotes | python3 -m json.tool
# cari "products": version 1.0.1 dan url /v/1.0.1/assets/remoteEntry.js

# buka http://localhost:4173/katalog dan http://localhost:4173/status
# DevTools → Network → pastikan remoteEntry.js berasal dari /v/1.0.1/

# canary opsional: node scripts/release.mjs products 1.1.0 --canary
# di proyek ini canary hanya label status, bukan pemisahan trafik

node scripts/rollback.mjs products
curl -s http://localhost:4173/api/remotes | python3 -m json.tool
# version products kembali ke versi stabil sebelumnya, misalnya 1.0.0`,
      explain: [
        'Rilis membutuhkan build remote yang sudah ada. Skrip menolak berjalan bila <code>apps/products/dist/assets/remoteEntry.js</code> tidak ditemukan.',
        'Rollback tanpa argumen versi memilih versi stabil terbaru selain versi aktif. Kamu juga bisa menyebut target eksplisit: <code>node scripts/rollback.mjs products 1.0.0</code>.',
        'Setelah rollback, muat ulang shell. Tidak ada perintah build di langkah mana pun — hanya pointer manifest yang berubah.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Canary dan Urutan Rilis yang Aman</h3><p>Di proyek ini, <code>--canary</code> hanya menandai status di manifest. Produksi sungguhan memerlukan pemisahan trafik di edge atau feature flag: sebagian pengguna diarahkan ke <code>/v/1.1.0</code>, sisanya tetap di <code>/v/1.0.1</code>. Jangan menganggap label canary sebagai canary.</p><p>Urutan yang aman ketika <b>kontrak berubah</b> mengikuti pola <b>expand-contract</b>:</p><ol><li><b>Expand:</b> rilis shell yang memahami bentuk lama dan baru. Remote lama harus tetap berjalan.</li><li><b>Migrasi:</b> rilis remote yang memakai bentuk baru, satu per satu. Pantau error per remote.</li><li><b>Contract:</b> setelah semua remote memakai bentuk baru, hapus dukungan bentuk lama dari shell.</li></ol><p>Untuk perubahan yang merusak, jangan merilis shell dan semua remote serentak. Simpan versi lama di CDN, arahkan manifest bertahap, dan pastikan rollback tidak membutuhkan build. Bila yang berubah hanya internal remote, urutannya cukup: build, unggah, verifikasi, ganti manifest.</p>'
    },
    {
      type: 'warn',
      title: 'Jangan Menimpa Folder Versi atau Mendahulukan Manifest',
      text: 'Skrip contoh menghapus folder tujuan agar rilis ulang versi yang sama idempoten, tetapi di produksi perlakukan versi yang sudah dipublikasikan sebagai immutable. Menimpa <code>cdn/products/1.0.1</code> dengan build baru membuat browser yang menyimpan chunk lama bisa mencampurnya dengan chunk baru, dan rollback ke versi itu tidak lagi mengembalikan kode yang pernah diuji. Urutan yang benar adalah unggah artefak ke versi baru, pastikan <code>remoteEntry.js</code> merespons 200, baru perbarui manifest. Bila manifest didahulukan, pengguna bisa menerima 404 di antara dua langkah.'
    },
    {
      type: 'tip',
      title: 'Latih Rollback Sebelum Insiden',
      text: 'Jadwalkan latihan rollback di staging setiap kali pipeline berubah. Rilis versi yang sengaja membawa bug kecil, ukur waktu dari keputusan sampai pointer berubah, lalu catat langkah yang membingungkan. Rollback yang baru pertama kali dicoba saat produksi sedang down bukan rencana, melainkan harapan.'
    },
    {
      type: 'text',
      html: '<h3>Checkpoint: Buktikan Rilis dan Rollback</h3><p>Jangan berhenti pada pesan <code>✔</code> dari skrip. Verifikasi empat hal berikut:</p><pre><code># 1. Manifest menunjuk versi yang benar\ncurl -s http://localhost:4173/api/remotes | python3 -m json.tool\n\n# 2. Aset versi baru dapat diakses dan immutable\ncurl -sI http://localhost:4175/v/1.0.1/assets/remoteEntry.js | grep -i cache-control\n\n# 3. Shell tetap memakai build lama (tidak ada build ulang)\nls -l apps/shell/dist/index.html\n\n# 4. Setelah rollback, versi dan URL kembali ke sebelumnya\nnode scripts/rollback.mjs products\ncurl -s http://localhost:4173/api/remotes | python3 -m json.tool</code></pre><p><b>Kriteria lulus:</b> halaman <code>/status</code> menampilkan versi produk yang berubah; tab Network memuat <code>remoteEntry.js</code> dari <code>/v/1.0.1/</code>; setelah rollback URL kembali ke <code>/v/1.0.0/</code>; dan tidak ada perubahan pada folder <code>apps/shell/dist</code>. Bila salah satu gagal, perbaiki urutan rilis sebelum mencoba canary.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Artefak rilis', 'Hasil build satu remote yang siap diunggah ke CDN, termasuk remoteEntry.js dan chunk-nya.'],
        ['CDN berversi', 'Penyimpanan artefak di folder per versi sehingga versi lama tetap dapat diakses.'],
        ['Manifest atomik', 'Penulisan manifest lewat berkas sementara lalu rename, agar pembaca tidak melihat data setengah jadi.'],
        ['Immutable cache', 'Header yang menyatakan berkas di URL tertentu tidak akan berubah isinya.'],
        ['No-store', 'Header yang melarang browser dan proxy menyimpan respons.'],
        ['Canary', 'Rilis ke sebagian kecil pengguna sebelum dipromosikan ke semua pengguna.'],
        ['Rollback', 'Mengembalikan pointer ke versi yang sudah pernah dirilis dan diuji.'],
        ['Expand-contract', 'Pola perubahan kontrak: dukung lama dan baru, migrasikan pemakai, lalu hapus yang lama.'],
        ['Pointer manifest', 'Nilai versi dan URL aktif yang dibaca shell untuk menentukan remote yang dimuat.'],
        ['Retensi artefak', 'Lama waktu versi lama disimpan agar rollback tetap mungkin dilakukan.'],
        ['Verifikasi rilis', 'Pemeriksaan manifest, aset, dan perilaku halaman setelah pointer berubah.'],
        ['Rilis idempoten', 'Rilis yang dapat diulang dengan hasil sama tanpa meninggalkan keadaan setengah jadi.']
      ]
    }
  ],
  recap: [
    'Rilis mandiri berarti satu remote dapat naik versi tanpa build ulang shell atau remote lain.',
    'Artefak disimpan di cdn/<remote>/<versi> dan dilayani lewat /v/<versi>/ dengan URL yang tetap.',
    'Manifest ditulis secara atomik; aset berversi immutable, sedangkan manifest selalu segar.',
    'Canary di proyek ini baru berupa label; canary produksi membutuhkan pemisahan trafik nyata.',
    'Perubahan kontrak mengikuti expand-contract, dan rollback hanya mengganti pointer manifest.'
  ]
});
