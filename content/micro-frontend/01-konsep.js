/* ============================================================
   Pelajaran Micro-Frontend — Bab 1: Memahami Micro-Frontend
   ============================================================ */
'use strict';

window.MICROFRONTEND_LESSONS = window.MICROFRONTEND_LESSONS || [];

window.MICROFRONTEND_LESSONS.push({
  id: 'mf-konsep',
  title: 'Memahami Micro-Frontend dan Biayanya',
  chapter: 'Fondasi',
  duration: '18 menit',
  intro: [
    'Bayangkan kamu mengelola <b>TokoMicro</b> bersama tiga tim. Tim katalog hanya ingin mengganti teks tombol, tetapi karena semuanya berada dalam satu build, tim keranjang dan tim akun ikut menunggu jadwal rilis. Rasa frustrasi seperti inilah yang mendorong lahirnya <b>micro-frontend</b>.',
    'Micro-frontend bukan sekadar memecah berkas JavaScript menjadi kecil-kecil. Ia memecah <b>kepemilikan halaman</b>: satu tim memiliki satu bagian, membangun dan mengujinya sendiri, lalu sebuah wadah bernama <b>shell</b> menggabungkannya sehingga pengguna tetap melihat satu toko yang utuh.',
    'Di bab ini kamu akan mempelajari definisi, perbedaan dengan monolith dan modular monolith, manfaat organisasi, biaya yang harus dibayar, serta kapan arsitektur ini justru sebaiknya tidak dipakai. Semua keputusan akan kamu tuangkan dalam ADR sebelum menyentuh kode.'
  ],
  objectives: [
    'Menjelaskan micro-frontend dengan bahasa bisnis, bukan hanya istilah teknis',
    'Membedakan monolith frontend, modular monolith, dan micro-frontend',
    'Menghubungkan masalah organisasi dengan keputusan arsitektur',
    'Menilai biaya dan risiko micro-frontend secara jujur',
    'Menulis ADR serta tabel pembagian tim untuk TokoMicro'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Definisi yang Perlu Dipegang</h3><p><b>Micro-frontend</b> adalah pendekatan menyusun satu halaman atau aplikasi web dari beberapa aplikasi frontend kecil yang masing-masing <b>dimiliki satu tim</b>, <b>dibangun dan diuji sendiri</b>, <b>dirilis tanpa menunggu tim lain</b>, lalu <b>digabungkan saat runtime</b> oleh shell.</p><p>Tiga kata kuncinya: <b>dimiliki</b>, <b>dirilis mandiri</b>, dan <b>dikomposisi saat runtime</b>. Kata "micro" menyangkut organisasi, bukan jumlah baris kode. Satu remote boleh berisi ribuan baris selama satu tim menguasainya dan kontraknya stabil.</p><p>Pada TokoMicro, shell di port 4173 memiliki URL, layout, login, dan token. Remote header (4174), products (4175), cart (4176), dan account (4177) memiliki build sendiri. Aplikasi legacy di 4178 dimigrasikan bertahap tanpa mematikan toko.</p>'
    },
    {
      type: 'text',
      html: '<h3>Tiga Bentuk yang Sering Ditunggangi</h3><table class="vocab"><tr><th>Bentuk</th><th>Ciri utama</th><th>Rilis</th><th>Biaya koordinasi</th></tr><tr><td><b>Monolith frontend</b></td><td>Satu repo, satu build, satu aplikasi</td><td>Serentak</td><td>Rendah di awal, tinggi saat tim bertambah</td></tr><tr><td><b>Modular monolith</b></td><td>Satu aplikasi dengan batas modul dan kepemilikan folder</td><td>Serentak, tetapi perubahan lebih terisolasi</td><td>Sedang; disiplin batas modul</td></tr><tr><td><b>Micro-frontend</b></td><td>Beberapa aplikasi kecil digabung shell saat runtime</td><td>Mandiri per remote</td><td>Tinggi: kontrak, versi, CORS, observability</td></tr></table><p>Banyak tim melompat langsung ke kolom ketiga padahal masalahnya masih bisa diselesaikan dengan kolom kedua. Modular monolith sering menjadi langkah tengah yang jauh lebih murah.</p>'
    },
    {
      type: 'example',
      title: 'Satu pipeline vs tiga pipeline',
      lang: 'text',
      output: false,
      code: `MONOLITH FRONTEND
  Satu repository, satu build, satu jadwal rilis.
  Perbaikan teks tombol katalog menunggu:
    - build keranjang selesai
    - tes akun stabil
    - semua tim setuju tanggal rilis

MICRO-FRONTEND TOKOMICRO
  shell    :4173  layout, URL, login, error boundary
  header   :4174  Tim Chrome  - build & rilis sendiri
  products :4175  Tim Katalog - build & rilis sendiri
  cart     :4176  Tim Transaksi - build & rilis sendiri
  account  :4177  Tim Akun    - build & rilis sendiri

  Perbaikan teks tombol katalog:
    build products -> unggah remoteEntry.js -> selesai.
    Tim lain tidak membangun ulang apa pun.`,
      explain: [
        'Yang dibeli adalah <b>kecepatan rilis</b> dan <b>kejelasan kepemilikan</b>; yang dibayar adalah kompleksitas komposisi, kontrak, dan pengujian lintas remote.',
        'Shell tetap ada. Tanpa shell, pengguna akan melihat empat aplikasi terpisah, bukan satu toko dengan satu sesi login.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Manfaat, Biaya, dan Kapan Tidak Dipakai</h3><p>Manfaat utamanya bersifat organisasi: tim tidak saling menunggu, ritme rilis bisa berbeda, dan migrasi aplikasi lama dapat dilakukan satu rute demi satu rute. Micro-frontend juga memungkinkan tim memilih teknologi yang benar-benar dibutuhkan, meskipun ini sering menjadi alasan yang terlalu dibesar-besarkan.</p><p>Biayanya nyata: kontrak antar tim, peta rute, shared state, isolasi CSS, build terpisah, CORS, manifest versi, pengujian komposisi, dan observability lintas aplikasi. Setiap tambahan remote berarti satu origin, satu pipeline, dan satu kemungkinan kegagalan baru.</p><p><b>Tolak arsitektur ini</b> bila hanya ada satu atau dua pengembang, aplikasi masih CRUD sederhana, belum ada CI/CD otomatis, atau belum ada design system yang menjaga konsistensi. Dalam kondisi itu, modular monolith lebih masuk akal.</p>'
    },
    {
      type: 'example',
      title: 'Kerangka ADR untuk TokoMicro',
      lang: 'text',
      output: false,
      code: `# ADR 0001 — Memecah TokoMicro menjadi micro-frontend

Status
  Diterima, ditinjau ulang setiap 6 bulan.

Konteks
  - 4 tim, 5 rute utama, ritme rilis berbeda.
  - Rilis mingguan sering tertahan oleh satu tim.
  - Aplikasi legacy harus dimigrasikan bertahap.

Keputusan
  - Shell React + remote header, products, cart, account.
  - Komposisi memakai Module Federation.
  - Satu sesi login dimiliki shell.

Konsekuensi positif
  - Rilis per remote tanpa build shell.
  - Kepemilikan rute menjadi jelas.

Konsekuensi negatif
  - Perlu kontrak, CORS, manifest, dan uji lintas remote.
  - Versi React dan react-router-dom harus disepakati.

Alternatif yang ditolak
  - Modular monolith: belum menyelesaikan ritme rilis tim.
  - iframe: isolasi kuat, tetapi UX katalog dan SEO memburuk.`,
      explain: [
        'ADR tidak harus panjang. Yang penting: konteks, keputusan, konsekuensi, dan alternatif yang ditolak.',
        'Tuliskan juga tanggal dan pemilik keputusan agar enam bulan kemudian tim tahu siapa yang harus ditanya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Praktik: ADR dan Tabel Pembagian Tim</h3><ol><li>Buat berkas <code>docs/adr/0001-micro-frontend.md</code> di root proyek.</li><li>Salin kerangka ADR di atas, lalu ganti konteks dengan jumlah tim dan rute TokoMicro yang nyata.</li><li>Buat tabel tiga kolom: <b>bagian</b>, <b>pemilik</b>, dan <b>yang tidak boleh dilakukan</b>.</li><li>Isi baris shell, header, products, cart, account, dan legacy.</li><li>Minta satu perwakilan tiap tim menandatangani keputusan; simpan tautannya di README.</li></ol><table class="vocab"><tr><th>Bagian</th><th>Pemilik</th><th>Tidak boleh dilakukan</th></tr><tr><td>shell :4173</td><td>Tim Inti</td><td>Memanggil API bisnis remote atau menyimpan data katalog</td></tr><tr><td>header :4174</td><td>Tim Chrome</td><td>Mengatur rute global atau memanggil API cart</td></tr><tr><td>products :4175</td><td>Tim Katalog</td><td>Mengimpor komponen internal cart</td></tr><tr><td>cart :4176</td><td>Tim Transaksi</td><td>Menyimpan sesi login sendiri</td></tr><tr><td>account :4177</td><td>Tim Akun</td><td>Mengubah layout shell</td></tr><tr><td>legacy :4178</td><td>Tim Migrasi</td><td>Menambah dependensi baru yang memperpanjang umur aplikasi</td></tr></table><p><b>Checkpoint:</b> setiap baris tabel harus bisa dijelaskan dalam satu kalimat, dan tidak ada dua tim yang memiliki rute yang sama. Bila ada bagian tanpa pemilik, keputusan belum selesai.</p>'
    },
    {
      type: 'warn',
      title: 'Jangan Memilih Arsitektur karena Tren',
      text: 'Micro-frontend menambah routing, kontrak, shared state, build terpisah, CORS, manifest versi, dan pengujian lintas aplikasi. Tambahkan kompleksitas itu hanya jika masalahnya benar-benar organisasional: banyak tim, ritme rilis berbeda, atau migrasi bertahap. "Ingin terlihat modern" bukan alasan yang cukup, dan distributed monolith adalah hasil paling mahal dari keputusan yang salah.'
    },
    {
      type: 'example',
      title: 'Peta kepemilikan yang bisa dieksekusi',
      lang: 'ts',
      output: false,
      code: `// ilustrasi: peta rute shell (bisa kamu taruh di apps/shell/src/routes.ts)
import type { RemoteName } from '@tokomicro/contracts';

interface RouteOwner {
  remote: RemoteName;
  owner: string;
  path: string;
}

export const ROUTES: Record<string, RouteOwner> = {
  katalog: { remote: 'products', owner: 'Tim Katalog', path: '/katalog/*' },
  keranjang: { remote: 'cart', owner: 'Tim Transaksi', path: '/keranjang/*' },
  akun: { remote: 'account', owner: 'Tim Akun', path: '/akun/*' }
};`,
      explain: [
        'Tabel ini adalah versi executable dari ADR: shell hanya tahu nama remote, pemilik, dan pola rute, bukan isi internal remote.',
        'Mulai dari satu rute yang paling mandiri, ukur waktu build dan debugging, lalu perluas bila datanya mendukung. Ini jauh lebih jujur daripada memindahkan seluruh toko sekaligus.'
      ]
    },
    {
      type: 'vocab',
      items: [
        ['Micro-frontend', 'Aplikasi frontend kecil yang dimiliki satu tim, dirilis mandiri, lalu digabungkan shell saat runtime.'],
        ['Shell', 'Aplikasi induk yang mengatur layout, URL, login, dan pemuatan remote.'],
        ['Remote', 'Micro-frontend yang dimuat shell; memiliki build dan siklus rilis sendiri.'],
        ['Shared module', 'Kode yang dipakai beberapa remote, misalnya state keranjang dan utilitas format.'],
        ['ADR', 'Architectural Decision Record: catatan keputusan arsitektur beserta alasan dan konsekuensinya.'],
        ['Modular monolith', 'Satu aplikasi dengan batas modul dan kepemilikan yang jelas, tanpa komposisi runtime.'],
        ['Distributed monolith', 'Sistem yang terlihat terpisah, tetapi tetap harus dirilis serentak karena saling bergantung.'],
        ['Monolith frontend', 'Satu aplikasi, satu build, dan satu jadwal rilis untuk seluruh halaman.'],
        ['Rilis mandiri', 'Kemampuan satu tim mengunggah versi barunya tanpa membangun ulang aplikasi lain.'],
        ['Kontrak', 'Kesepakatan bentuk data dan fungsi antara shell dan remote, misalnya props ctx.'],
        ['Origin', 'Kombinasi protokol, host, dan port; setiap remote TokoMicro memiliki origin sendiri.'],
        ['Komposisi runtime', 'Penggabungan remote yang terjadi di browser saat halaman dibuka, bukan saat build.']
      ]
    }
  ],
  recap: [
    'Micro-frontend memecah kepemilikan tim, bukan sekadar memecah berkas kode.',
    'Tiga cirinya: dimiliki satu tim, dirilis mandiri, dan digabungkan shell saat runtime.',
    'Ia cocok untuk banyak tim dengan ritme rilis berbeda dan migrasi bertahap.',
    'Biayanya nyata: kontrak, routing, state, styling, pengujian, versi, dan observability.',
    'Keputusan harus tertulis dalam ADR dan dievaluasi ulang secara berkala.'
  ]
});
