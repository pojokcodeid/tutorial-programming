/* ============================================================
   Pelajaran Micro-Frontend — Bab 9: Tim, CI/CD, Versioning & Migrasi
   ============================================================ */
'use strict';

window.MICROFRONTEND_LESSONS = window.MICROFRONTEND_LESSONS || [];

window.MICROFRONTEND_LESSONS.push({
  id: 'mf-tim-cicd',
  title: 'Tim, CI/CD, Versioning & Migrasi',
  chapter: 'Operasional',
  duration: '14 menit',
  intro: [
    'Sampai di sini kamu sudah bisa membangun micro-frontend secara teknis. Bab ini membahas bagian yang sering dilupakan padahal menentukan keberhasilan arsitektur ini di jangka panjang: <b>bagaimana tim disusun, bagaimana pipeline bekerja, bagaimana kontrak diberi versi, dan bagaimana memigrasi aplikasi lama tanpa menghentikan layanan</b>.',
    'Prinsip yang menopang semuanya adalah <b>Hukum Conway</b>: produk cenderung mencerminkan struktur tim yang membangunnya. Micro-frontend adalah cara paling eksplisit menerapkannya — dengan konsekuensi bahwa keputusan organisasi langsung terlihat pada arsitektur.'
  ],
  objectives: [
    'Menyusun tim yang selaras dengan batas micro-frontend',
    'Menyusun pipeline CI/CD per remote lengkap dengan rollback',
    'Menerapkan semantic versioning pada kontrak bersama',
    'Memigrasi aplikasi lama bertahap dengan pola strangler fig',
    'Menilai kembali arsitektur berdasarkan pengukuran, bukan asumsi'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Tim yang Selaras dengan Arsitektur</h3><p><b>Hukum Conway</b> menyatakan bahwa desain sistem pada akhirnya mencerminkan komunikasi organisasi yang membangunnya. Micro-frontend menerapkannya secara sadar: satu tim, satu bagian halaman, tanggung jawab penuh dari kode sampai pemantauan di produksi — prinsip yang dikenal sebagai <i>you build it, you run it</i>.</p><p>Yang membuat arsitektur ini bekerja bukan jumlah remote, melainkan <b>kejelasan kepemilikan</b>. Setiap bagian halaman harus punya tim yang bisa ditanya, dan setiap tim harus tahu bagian mana yang menjadi miliknya. Bila sebuah remote \"dimiliki semua orang\", ia tidak dimiliki siapa pun — dan perubahan di sana akan selalu terasa berbahaya.</p>'
    },
    {
      type: 'text',
      html: '<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 230" width="760" role="img" aria-label="Pipeline CI/CD per remote: commit, uji, build, unggah CDN, perbarui manifest, smoke test, rollback bila gagal"><rect x="20" y="50" width="110" height="46" rx="8" class="u-box"/><text x="75" y="78" class="u-title" text-anchor="middle">commit</text><line x1="130" y1="73" x2="150" y2="73" class="u-line" marker-end="url(#u-arrow)"/><rect x="155" y="50" width="110" height="46" rx="8" class="u-box"/><text x="210" y="78" class="u-title" text-anchor="middle">uji</text><line x1="265" y1="73" x2="285" y2="73" class="u-line" marker-end="url(#u-arrow)"/><rect x="290" y="50" width="110" height="46" rx="8" class="u-box"/><text x="345" y="78" class="u-title" text-anchor="middle">build</text><line x1="400" y1="73" x2="420" y2="73" class="u-line" marker-end="url(#u-arrow)"/><rect x="425" y="50" width="130" height="46" rx="8" class="u-box"/><text x="490" y="78" class="u-title" text-anchor="middle">unggah CDN</text><line x1="555" y1="73" x2="575" y2="73" class="u-line" marker-end="url(#u-arrow)"/><rect x="580" y="50" width="160" height="46" rx="8" class="u-box"/><text x="660" y="72" class="u-title" text-anchor="middle">perbarui manifest</text><text x="660" y="89" class="u-lbl" text-anchor="middle">cart → a3f9c1</text><line x1="660" y1="96" x2="660" y2="126" class="u-line" marker-end="url(#u-arrow)"/><rect x="580" y="130" width="160" height="46" rx="8" class="u-hl"/><text x="660" y="152" class="u-title" text-anchor="middle">smoke test</text><text x="660" y="169" class="u-lbl" text-anchor="middle">uji halaman hidup</text><line x1="580" y1="153" x2="430" y2="153" class="u-dash" marker-end="url(#u-arrow)"/><rect x="290" y="130" width="130" height="46" rx="8" class="u-box"/><text x="355" y="158" class="u-title" text-anchor="middle">rollback manifest</text><text x="140" y="200" class="u-lbl" text-anchor="middle">gagal? kembalikan pointer manifest — tanpa build ulang</text></svg></div><figcaption class="fig-cap"><b>Gambar 9.1</b> — Pipeline satu remote: dari commit sampai rollback yang murah</figcaption></figure>'
    },
    {
      type: 'example',
      title: 'Pipeline CI/CD satu remote (pseudocode)',
      lang: 'yaml',
      output: false,
      code: `# .github/workflows/remote-cart.yml — milik Tim C saja
name: remote-cart
on:
  push:
    paths: ['packages/remote-cart/**', 'packages/shared/**']

jobs:
  rilis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - name: Uji unit & kontrak
        run: pnpm --filter remote-cart test
      - name: Bangun
        run: pnpm --filter remote-cart build
      - name: Unggah ke CDN
        run: pnpm --filter remote-cart deploy   # cart.a3f9c1.js
      - name: Perbarui manifest
        run: ./scripts/manifest-set.sh cart \${{ github.sha }}
      - name: Smoke test halaman hidup
        run: node tests/smoke-halaman.js         # muat #/keranjang sungguhan
      - name: Rollback otomatis bila smoke gagal
        if: failure()
        run: ./scripts/manifest-rollback.sh cart`,
      explain: [
        'Pipeline berjalan hanya bila berkas remote-cart atau shared berubah — pipeline Tim B tidak pernah tersentuh oleh rilis Tim C.',
        'Langkah terakhir adalah <b>smoke test pada halaman yang sudah hidup</b>: memuat rute keranjang sungguhan dan memastikannya tampil, bukan hanya lolos build.',
        'Bila smoke test gagal, manifest otomatis dikembalikan — pengguna praktis tidak pernah melihat versi yang rusak.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Memberi Versi pada Kontrak</h3><p>Modul yang dirilis mandiri tetap saling membutuhkan melalui kontrak: bentuk event, isi shared store, dan bentuk data API. Karena shell dan remote hidup di jadwal rilis berbeda, kontrak perlu <b>versi</b> agar bisa dinyatakan kompatibel atau tidak. <b>Semantic versioning</b> memberi tiga angka: <code>MAJOR.MINOR.PATCH</code>.</p>'
    },
    {
      type: 'example',
      title: 'Kapan angka versi berubah',
      lang: 'text',
      output: false,
      code: `PATCH  1.9.3 -> 1.9.4   perbaikan bug tanpa mengubah kontrak
                       (misal memperbaiki perhitungan total keranjang)

MINOR  1.9.4 -> 1.10.0  penambahan yang TIDAK memutus lama
                       (misal cart:change kini ikut membawa field discount)

MAJOR  1.10.0 -> 2.0.0  perubahan yang MEMUTUS kompatibilitas
                       (misal field name dihapus dari payload)
                       → wajib didahului pengumuman & jadwal pensiun versi lama

Kesepakatan TokoMicro:
  • shell versi 1.x harus tetap berfungsi dengan remote versi minor terbaru
  • remote dilarang menghapus/mengganti nama field tanpa naik MAJOR
  • versi shared module dicatat di manifest, sama seperti versi remote`,
      explain: [
        'Perhatikan fokusnya: versi di sini menyangkut <b>kontrak</b>, bukan berapa banyak perubahan kode. Satu perbaikan yang mengubah bentuk payload bisa jadi MAJOR meski hanya satu baris.',
        'Aturan \"shell versi lama tetap berfungsi\" adalah janji paling penting — karena pengguna bisa membuka halaman dengan shell lama yang tersimpan di perambannya.',
        'Tanpa versi, \"rilis mandiri\" berubah menjadi \"rilis yang tidak sengaja merusak tim lain\" — dan biasanya ditemukan ketika pengguna sudah melaporkannya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Migrasi Bertahap: Strangler Fig</h3><p>Bagaimana memindahkan aplikasi lama yang sudah besar? Bukan dengan menulis ulang semuanya lalu bertukar (<i>big bang</i>), melainkan dengan <b>pola strangler fig</b>: bangun shell baru, pindahkan satu rute, amati, lalu lanjut ke rute berikutnya. Aplikasi lama tetap berjalan sebagai remote sampai rute terakhirnya dipindahkan.</p>'
    },
    {
      type: 'example',
      title: 'Urutan migrasi rute demi rute',
      lang: 'text',
      output: false,
      code: `MINGGU 1-2   shell dasar: layout, routing, login
             rute lama tetap dipanggil via iframe/tautan

MINGGU 3-4   pindahkan rute PROFIL (paling sederhana, risiko rendah)
             lama: /profil -> remote:profil baru
             pantau error & waktu muat 1 minggu

MINGGU 5-8   pindahkan rute KATALOG (butuh data & filter)
             tambah BFF untuk menggabungkan service

MINGGU 9-12  pindahkan rute KERANJANG (paling kritis, paling akhir)
             uji beban penuh sebelum mengalihkan seluruh lalu lintas

SETELAHNYA   matikan kode lama per rute, lalu seluruhnya
             setelah seluruh rute terbukti stabil

Prinsipnya: setiap langkah hanya menyangkut satu rute,
sehingga kegagalan mudah dibatalkan dan manfaatnya langsung terasa.`,
      explain: [
        'Urutannya disengaja: mulai dari rute paling sederhana untuk membuktikan polanya, lalu rute paling kritis terakhir ketika tim sudah siap.',
        'Setiap langkah bernilai bagi pengguna sekaligus menjadi pembelajaran — inilah keunggulan strangler fig dibanding menulis ulang besar yang tidak menghasilkan apa-apa selama berbulan-bulan.',
        'Rute lama yang belum dimigrasi tetap berfungsi, sehingga tidak ada tekanan waktu yang memaksa keputusan terburu-buru.'
      ]
    },
    {
      type: 'tip',
      title: 'Ukur, Lalu Putuskan — Termasuk Mundur',
      text: 'Tambahkan pengukuran sederhana sejak awal: berapa lama waktu rilis, berapa sering koordinasi antartim diperlukan, berapa banyak perubahan yang harus menyentuh banyak remote sekaligus. Bila beberapa bulan kemudian angka-angka itu menunjukkan koordinasi makin mahal tanpa kecepatan rilis yang membaik — terutama bila tim menyusut — kembali ke satu aplikasi yang terstruktur rapi adalah keputusan yang benar, bukan kegagalan. Arsitektur adalah alat; pengukuran yang menentukan alat itu masih layak dipakai.'
    },
    {
      type: 'warn',
      title: 'Hindari Penulis Ulang Besar (Big Bang Rewrite)',
      text: 'Proyek migrasi paling sering gagal dengan pola yang sama: menghentikan pengembangan fitur selama berbulan-bulan demi menulis ulang seluruhnya, sementara kebutuhan bisnis terus berubah dan hasil akhirnya selalu terlambat. Strangler fig menghindarinya dengan tetap menghasilkan nilai di setiap langkah. Bila kamu merancang migrasi yang tidak menghasilkan rilis bernilai selama satu kuartal, itulah tanda rencananya perlu dipecah.'
    },
    {
      type: 'vocab',
      items: [
        ['Hukum Conway', 'Prinsip bahwa struktur produk mencerminkan struktur komunikasi tim yang membangunnya.'],
        ['You build it, you run it', 'Prinsip kepemilikan penuh: tim yang menulis kode juga memantau dan menjaganya di produksi.'],
        ['Semantic versioning', 'Penomoran versi MAJOR.MINOR.PATCH yang menyatakan tingkat perubahan kontrak.'],
        ['Smoke test', 'Pengujian singkat pada halaman yang sudah hidup setelah deploy untuk memastikan masih berfungsi.'],
        ['Rollback manifest', 'Mengembalikan pointer manifest ke versi sebelumnya sebagai pemulihan cepat.'],
        ['Strangler fig', 'Pola migrasi bertahap: memindahkan rute demi rute dari aplikasi lama ke shell baru.'],
        ['Big bang rewrite', 'Penulisan ulang seluruh aplikasi sekaligus — pola yang paling sering menyebabkan proyek gagal.'],
        ['Pensiun versi (deprecation)', 'Pengumuman jadwal berakhirnya dukungan untuk versi kontrak lama.']
      ]
    }
  ],
  recap: [
    'Micro-frontend menerapkan Hukum Conway secara sadar: satu tim, satu bagian halaman, tanggung jawab penuh sampai produksi.',
    'Pipeline berjalan per remote dengan smoke test setelah deploy dan rollback manifest otomatis bila gagal.',
    'Semantic versioning menyatakan kompatibilitas kontrak: PATCH perbaikan, MINOR penambahan, MAJOR pemutusan.',
    'Strangler fig memigrasi rute demi rute — tiap langkah bernilai dan mudah dibatalkan bila gagal.',
    'Keputusan arsitektur diukur, bukan diasumsikan; kembali ke monolith adalah pilihan yang sah bila pengukuran menunjukkan begitu.'
  ]
});
