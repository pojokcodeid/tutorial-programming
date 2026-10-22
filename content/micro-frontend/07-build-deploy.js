/* ============================================================
   Pelajaran Micro-Frontend — Bab 7: Build, Monorepo & Module Federation
   ============================================================ */
'use strict';

window.MICROFRONTEND_LESSONS = window.MICROFRONTEND_LESSONS || [];

window.MICROFRONTEND_LESSONS.push({
  id: 'mf-build-deploy',
  title: 'Build, Monorepo & Module Federation',
  chapter: 'Membangun',
  duration: '15 menit',
  intro: [
    'Rilis mandiri hanya nyata kalau <b>build-nya juga mandiri</b>. Bab ini membahas bagaimana beberapa remote dibangun dan disajikan: mulai dari susunan <b>monorepo</b>, cara <b>Module Federation</b> memuat modul antarproyek beserta berbagi dependensi, sampai <b>manifest versi</b> dan penyebaran berkas ke CDN.',
    'TokoMicro yang kamu jalankan di <code>examples/micro-frontend/</code> sengaja dibuat tanpa tooling build — cukup modul ES yang disajikan Node. Prinsip yang dipelajari di sini tetap sama persis; tooling seperti Vite hanya mempermudah, bukan mengubah konsepnya.'
  ],
  objectives: [
    'Menyusun monorepo yang tetap menjaga batas kepemilikan tim',
    'Menjelaskan cara kerja Module Federation dan shared dependencies',
    'Menggunakan manifest versi agar shell selalu memuat entri terbaru',
    'Menerapkan penyebaran berkas dengan content hash dan cache policy',
    'Memilih strategi build sesuai tingkat kematangan tim'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Monorepo: Banyak Proyek, Satu Tempat</h3><p>Kebanyakan tim memilih <b>monorepo</b> — satu repository berisi shell, seluruh remote, dan shared module. Alasannya praktis: perubahan kontrak bersama bisa dilihat sekali dalam satu <i>pull request</i>, dan alat bantu seperti Vitest bisa menjalankan pengujian lintas paket dengan mudah.</p><p>Syaratnya satu: <b>batas kepemilikan harus tetap tegas walau repository-nya satu</b>. Gunakan <code>CODEOWNERS</code> untuk menegaskan bahwa folder <code>packages/cart</code> hanya boleh diubah oleh Tim C, dan pastikan pipeline membangun tiap paket terpisah. Satu repository bukan berarti satu tim, dan bukan berarti satu build.</p>'
    },
    {
      type: 'example',
      title: 'Susunan monorepo TokoMicro',
      lang: 'text',
      output: false,
      code: `toko-micro/
├── packages/
│   ├── shell/              # pemilik layout, routing, login — Tim Inti
│   │   ├── src/routes.js   # peta rute -> remote
│   │   └── src/manifest.js # daftar remote + versinya
│   ├── remote-header/      # Tim A
│   ├── remote-products/    # Tim B
│   ├── remote-cart/        # Tim C
│   └── shared/             # dipakai bersama — semua tim menjaganya
│       ├── bus.js
│       └── store.js
├── bff/                    # backend untuk frontend
├── CODEOWNERS              # siapa berhenti menyentuh folder mana
├── package.json            # skrip: build:shell, build:cart, dll.
└── pnpm-workspace.yaml`,
      explain: [
        'Setiap remote punya folder sendiri lengkap dengan berkas build dan pengujiannya — kepemilikannya jelas meski berbagi repository.',
        'Folder <code>shared</code> adalah tempat paling sensitif: perubahan di sana harus melalui persetujuan beberapa tim, karena berkasnya dipakai semuanya.',
        'Skrip build dipisah per paket (<code>build:shell</code>, <code>build:cart</code>) — pipeline Tim C cukup menjalankan miliknya, tanpa membangun ulang seluruh monorepo.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Module Federation</h3><p><b>Module Federation</b> adalah kemampuan bundler (Webpack dan Vite) memuat modul dari proyek lain pada saat runtime. Setiap remote menghasilkan satu berkas kecil bernama <code>remoteEntry.js</code> yang menjadi pintu masuknya, lengkap dengan peta modul yang tersedia. Shell cukup tahu alamat berkas itu untuk bisa memuat remote kapan pun diperlukan.</p>'
    },
    {
      type: 'text',
      html: '<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 240" width="760" role="img" aria-label="Alur build dan deploy: tiap remote membangun remoteEntry lalu diunggah ke CDN dengan content hash, shell membaca manifest"><rect x="20" y="40" width="150" height="50" rx="8" class="u-box"/><text x="95" y="63" class="u-title" text-anchor="middle">remote: cart</text><text x="95" y="80" class="u-lbl" text-anchor="middle">Tim C rilis</text><rect x="20" y="110" width="150" height="50" rx="8" class="u-box"/><text x="95" y="133" class="u-title" text-anchor="middle">remote: products</text><text x="95" y="150" class="u-lbl" text-anchor="middle">Tim B rilis</text><line x1="170" y1="65" x2="215" y2="80" class="u-line" marker-end="url(#u-arrow)"/><line x1="170" y1="135" x2="215" y2="120" class="u-line" marker-end="url(#u-arrow)"/><rect x="220" y="60" width="170" height="80" rx="8" class="u-box"/><text x="305" y="85" class="u-title" text-anchor="middle">build → remoteEntry</text><text x="305" y="105" class="u-lbl" text-anchor="middle">konten di-hash</text><text x="305" y="123" class="u-lbl" text-anchor="middle">cart.a3f9c1.js</text><line x1="390" y1="100" x2="435" y2="100" class="u-line" marker-end="url(#u-arrow)"/><rect x="440" y="60" width="140" height="80" rx="8" class="u-box"/><text x="510" y="85" class="u-title" text-anchor="middle">CDN</text><text x="510" y="105" class="u-lbl" text-anchor="middle">cache satu tahun</text><text x="510" y="123" class="u-lbl" text-anchor="middle">aman karena hash</text><line x1="510" y1="140" x2="510" y2="158" class="u-dash" marker-end="url(#u-arrow)"/><rect x="440" y="160" width="140" height="56" rx="8" class="u-hl"/><text x="510" y="183" class="u-title" text-anchor="middle">manifest.json</text><text x="510" y="201" class="u-lbl" text-anchor="middle">cart → a3f9c1</text><text x="200" y="220" class="u-lbl" text-anchor="middle">shell membaca manifest lalu mengimpor entri remote yang sesuai</text></svg></div><figcaption class="fig-cap"><b>Gambar 7.1</b> — Build per remote, sebar dengan content hash, shell mengikuti manifest</figcaption></figure>'
    },
    {
      type: 'example',
      title: 'Konfigurasi Vite Plugin Federation',
      lang: 'js',
      output: false,
      code: `// packages/remote-cart/vite.config.js
import federation from '@originjs/vite-plugin-federation';

export default {
  plugins: [
    federation({
      name: 'remote_cart',
      filename: 'remoteEntry.js',          // pintu masuk remote ini
      exposes: {
        './cart': './src/entry.js'         // modul yang bisa dipakai shell
      },
      shared: {
        react:      { singleton: true, requiredVersion: '^18.2.0' },
        'react-dom':{ singleton: true, requiredVersion: '^18.2.0' }
      }
    })
  ],
  build: { target: 'esnext' }
};`,
      explain: [
        '<code>exposes</code> adalah daftar modul yang bersedia dipinjam — di TokoMicro hanya satu: <code>./cart</code> yang berisi <code>mount</code> dan <code>unmount</code>.',
        '<code>shared</code> dengan <code>singleton: true</code> memaksa seluruh remote memakai <b>satu</b> salinan React yang sama, sehingga tidak ada dua kinstance framework hidup berdampingan di satu halaman.',
        '<code>remoteEntry.js</code> yang dihasilkan berukuran kecil (hanya peta modul); berkas berat tetap diunduh saat rutenya terbuka.'
      ]
    },
    {
      type: 'warn',
      title: 'Dua Kinstance React = Satu Halaman Rusak',
      text: 'Tanpa <code>shared</code>, tiap remote membawa salinan React sendiri. Dua kinstance React dalam satu halaman bukan sekadar boros memori: konteks dan hook bisa gagal terbaca lintas remote, sehingga sebagian komponen bekerja dan sebagian lagi diam tanpa penjelasan yang jelas. Inilah alasan <code>singleton: true</code> wajib disepakati sekali di awal, lengkap dengan aturan versi minimum yang kompatibel.'
    },
    {
      type: 'text',
      html: '<h3>Manifest Versi dan Penyebaran</h3><p>Karena tiap remote merilis sendiri, shell harus tahu <b>entri terbaru</b> milik masing-masing. Caranya lewat <b>manifest</b>: berkas JSON kecil yang diperbarui oleh pipeline setiap kali sebuah remote selesai diunggah. Shell membaca manifest saat aplikasi dibuka lalu mengimpor entri yang tercatat di sana.</p>'
    },
    {
      type: 'example',
      title: 'Manifest remote TokoMicro',
      lang: 'json',
      output: false,
      code: `{
  "remotes": {
    "header": {
      "entry": "https://cdn.example.com/header/remoteEntry.a3f9c1.js",
      "version": "1.4.2",
      "releasedAt": "2026-03-18T09:12:00Z"
    },
    "products": {
      "entry": "https://cdn.example.com/products/remoteEntry.77be02.js",
      "version": "2.1.0",
      "releasedAt": "2026-03-19T03:40:00Z"
    },
    "cart": {
      "entry": "https://cdn.example.com/cart/remoteEntry.5d1e88.js",
      "version": "1.9.3",
      "releasedAt": "2026-03-19T07:05:00Z"
    }
  }
}`,
      explain: [
        'Nama berkas memuat <b>content hash</b> (<code>a3f9c1</code>) sehingga bisa disimpan di CDN dengan masa simpan satu tahun — setiap perubahan kode menghasilkan nama berkas baru, dan manifest yang menunjuk ke alamatnya.',
        'Rollback semudah mengembalikan manifest ke versi sebelumnya: pengguna berikutnya membuka aplikasi akan memuat entri yang lama, tanpa perlu membangun ulang apa pun.',
        'Waktu rilis remote yang berbeda-beda terlihat jelas di manifest — bukti nyata bahwa tim-tim itu benar-benar merilis mandiri.'
      ]
    },
    {
      type: 'tip',
      title: 'Mulai Tanpa Tooling, Naik Ketika Sudah Terasa Butuh',
      text: 'TokoMicro berjalan tanpa bundler sama sekali: berkas JavaScript mentah yang disajikan Node, dimuat shell lewat <code>import()</code>. Ini cukup untuk memahami dan mengajarkan konsep. Ketika proyek mulai butuh penggabungan berkas, minifikasi, atau berbagi React, barulah tambahkan Vite dan plugin federation — pengetahuan kontrak <code>mount/unmount</code> yang kamu miliki akan tetap berlaku persis sama.'
    },
    {
      type: 'vocab',
      items: [
        ['Monorepo', 'Satu repository berisi banyak paket/proyek; aman hanya bila batas kepemilikan tim tetap tegas.'],
        ['CODEOWNERS', 'Berkas yang menetapkan tim mana yang berhenti menyetujui perubahan pada folder tertentu.'],
        ['Module Federation', 'Kemampuan bundler memuat modul dari proyek lain saat runtime, termasuk berbagi dependensi.'],
        ['remoteEntry.js', 'Berkas kecil hasil build yang menjadi pintu masuk sebuah remote.'],
        ['Shared dependencies', 'Pustaka (misal React) yang dipakai bersama satu salinan untuk seluruh remote.'],
        ['Singleton', 'Pengaturan yang memaksa satu salinan pustaka dipakai semua pihak — mencegah dua kinstance framework.'],
        ['Content hash', 'Potongan hash pada nama berkas hasil dari isinya, membuat cache CDN selalu aman dipakai.'],
        ['Manifest versi', 'Berkas JSON berisi daftar remote beserta alamat entri dan versinya, diperbarui pipeline.']
      ]
    }
  ],
  recap: [
    'Monorepo menyatukan banyak proyek dalam satu repository; batas kepemilikan dijaga lewat CODEOWNERS dan pipeline build per paket.',
    'Module Federation memuat modul remote lewat remoteEntry.js saat runtime; shared singleton mencegah dua kinstance React dalam satu halaman.',
    'Manifest versi memberi tahu shell entri remote terbaru; rollback cukup mengembalikan manifest ke versi sebelumnya.',
    'Content hash pada nama berkas membuat cache CDN bisa disetel sangat lama tanpa takut pengguna mendapat berkas lama.',
    'Mulailah tanpa tooling bila konsep masih dipelajari; tambahkan bundler dan federation ketika kebutuhannya sudah nyata.'
  ]
});
