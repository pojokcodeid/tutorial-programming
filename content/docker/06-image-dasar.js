/* ============================================================
   Pelajaran Docker — Bab 6: Image Docker – Dasar (L6)
   ============================================================ */
'use strict';

window.DOCKER_LESSONS = window.DOCKER_LESSONS || [];

window.DOCKER_LESSONS.push({
  id: 'image-docker-dasar',
  title: 'Image Docker – Pull, Tag, List, Hapus & Layer',
  chapter: 'Image',
  duration: '7–9 menit',
  intro: [
    'Kamu sudah memakai image seperti nginx dan alpine beberapa kali. Sekarang fokusnya berganti ke pengelolaan image: melihat, menarik, memberi tag, menghapus, serta memahami cara kerja layer di balik sebuah image.',
    'Memahami image dengan baik akan membantu kamu membuat image aplikasimu sendiri di bab berikutnya.'
  ],
  objectives: [
    'Melihat daftar Image lokal (<code>image ls</code>)',
    'Menarik Image dari registry (<code>pull</code>)',
    'Memberi tag ulang Image (<code>tag</code>)',
    'Menghapus Image (<code>rmi</code>, <code>image prune</code>)',
    'Memahami hubungan layer & sharing antar container'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Melihat Image Lokal</h3><p>Perintah <code>docker image ls</code> menampilkan seluruh image yang tersimpan di penyimpanan lokal Docker beserta informasinya.</p>'
    },
    {
      type: 'example',
      title: 'docker image ls',
      lang: 'bash',
      output: false,
      code: `docker image ls

# Tampilkan semua, termasuk image dangling
docker image ls --all`,
      explain: [
        'Kolom yang tampil: <b>REPOSITORY</b> (nama repo), <b>TAG</b> (versi), <b>IMAGE ID</b> (hash unik), <b>CREATED</b> (usia), dan <b>SIZE</b> (ukuran).',
        '<b>Dangling image</b> adalah image yang tidak lagi memiliki tag atau referensi repository, biasanya sisa dari build lama.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Menarik (Pull) Image</h3><p><code>docker pull</code> berfungsi mengunduh image dari registry ke penyimpanan lokal. Perintah ini berguna bila kamu membutuhkan image tanpa langsung menjalankannya, atau ingin memastikan image sudah tersedia sebelum build.</p>'
    },
    {
      type: 'example',
      title: 'Contoh pull',
      lang: 'bash',
      output: false,
      code: `# Tarik image dengan tag bawaan (latest)
docker pull node:20-alpine

# Tarik image dengan tag versi yang spesifik
docker pull node:20.17.0-alpine

# Tarik dari registry selain Docker Hub (opsional)
# docker pull ghcr.io/username/repo:tag`,
      explain: [
        'Bila kamu tidak menyebutkan tag, Docker akan memakai tag bawaan <code>latest</code>.',
        'Untuk proyek produksi, gunakan tag versi yang spesifik agar hasil build tetap stabil dan dapat diulang.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Memberi Tag Image (<code>docker image tag</code>)</h3><p>Tagging berguna ketika kamu ingin mengunggah (push) image ke Docker Hub dengan nama repository milikmu, atau sekadar memberi nama alias yang lebih mudah diingat pada image yang sama.</p>'
    },
    {
      type: 'example',
      title: 'Tagging',
      lang: 'bash',
      output: false,
      code: `# Lihat image ID
docker image ls

# Beri tag baru berdasarkan IMAGE ID
docker image tag node:20-alpine mynode:local

# Atau berdasarkan repo:tag
docker image tag node:20-alpine asepkomarudin/mynode:1.0.0

# Cek hasil
docker image ls`,
      explain: [
        'Tagging TIDAK menyalin (meng-copy) image, ia hanya membuat referensi baru yang menunjuk ke IMAGE ID yang sama.',
        'Cara ini sangat efisien karena tidak memakan ruang disk tambahan.'
      ]
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 240" width="760" role="img" aria-label="Banyak tag menunjuk ke satu image id yang sama">
        <rect x="40" y="40" width="220" height="44" rx="6" class="u-hd"/>
        <text x="150" y="68" class="u-title">nginx:latest</text>
        <rect x="40" y="100" width="220" height="44" rx="6" class="u-hd"/>
        <text x="150" y="128" class="u-title">nginx:1.27-alpine</text>
        <rect x="40" y="160" width="220" height="44" rx="6" class="u-hd"/>
        <text x="150" y="188" class="u-title">asep/nginx:1.0</text>
        <line x1="264" y1="62" x2="336" y2="102" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="264" y1="122" x2="336" y2="120" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="264" y1="182" x2="336" y2="140" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="340" y="70" width="210" height="100" rx="8" class="u-box"/>
        <text x="445" y="100" class="u-title">IMAGE ID</text>
        <text x="445" y="124" class="u-lbl" text-anchor="middle">a1b2c3d4e5f6</text>
        <text x="445" y="148" class="u-lbl" text-anchor="middle">satu image, banyak nama</text>
        <line x1="554" y1="120" x2="596" y2="120" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="600" y="70" width="120" height="100" rx="8" class="u-hd"/>
        <text x="660" y="100" class="u-title">Layer</text>
        <text x="660" y="124" class="u-lbl" text-anchor="middle">read-only</text>
        <text x="660" y="144" class="u-lbl" text-anchor="middle">dibagikan</text>
        <text x="445" y="220" class="u-lbl" text-anchor="middle">Menghapus satu tag tidak menghapus image selama masih ada tag lain</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 6.1</b> — Tag hanya label referensi; isi image tetap yang sama</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Menghapus Image (<code>rmi</code>)</h3><p>Perintah <code>docker image rm</code> berfungsi menghapus image dari penyimpanan lokal. Sebuah image tidak bisa dihapus selama masih dipakai oleh container mana pun, baik yang sedang berjalan maupun yang sudah berhenti.</p>'
    },
    {
      type: 'example',
      title: 'Hapus image',
      lang: 'bash',
      output: false,
      code: `# Hapus berdasarkan repo:tag
docker image rm mynode:local

# Hapus berdasarkan IMAGE ID (bisa partial)
docker image rm a1b2c3d4e5f6

# Hapus beberapa sekaligus
docker image rm node:20-alpine node:20.17.0-alpine

# Alias: docker rmi`,
      explain: [
        'Jika muncul "image is being used", hapus container-nya dulu (<code>docker container rm</code>) atau pakai <code>--force</code> (jarang disarankan).'
      ]
    },
    {
      type: 'text',
      html: '<h3>Membersihkan Image yang Tidak Terpakai</h3><p>Seiring waktu, penyimpanan lokal bisa penuh oleh image lama. Docker menyediakan perintah <code>prune</code> untuk membersihkannya.</p>'
    },
    {
      type: 'example',
      title: 'Prune image',
      lang: 'bash',
      output: false,
      code: `# Hapus image dangling (yang tidak berna)
docker image prune

# Hapus semua image yang TIDAK dipakai container mana pun
# (gunakan dengan hati-hati)
docker image prune --all`,
      explain: [
        'Opsi <code>--all</code> menghapus seluruh image yang tidak sedang dipakai container, yang biasanya cukup besar hemat ruang disknya.',
        'Pastikan kamu benar-benar tidak membutuhkan image tersebut lagi sebelum menjalankannya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Memahami Layer pada Image</h3><p>Setiap instruksi di dalam <code>Dockerfile</code> (misalnya <code>FROM</code>, <code>COPY</code>, <code>RUN</code>) menghasilkan satu layer baru. Layer bersifat read-only dan dapat dipakai ulang sebagai cache.</p><p>Kamu dapat melihat riwayat (history) pembentukan sebuah image beserta ukuran tiap layer-nya:</p>'
    },
    {
      type: 'example',
      title: 'Lihat history image',
      lang: 'bash',
      output: false,
      code: `docker image history nginx:alpine --no-trunc`,
      explain: [
        'Perintah ini menampilkan urutan layer, ukurannya, dan instruksi yang membentuknya.',
        'Inilah alasan mengapa <b>urutan instruksi di Dockerfile</b> sangat berpengaruh terhadap kecepatan build cache dan ukuran image akhir.'
      ]
    },
    {
      type: 'tip',
      title: 'Tips Hemat Disk',
      text: 'Gunakan image resmi berbasis Alpine yang ukurannya lebih kecil bila memungkinkan. Secara berkala, bersihkan image dangling dan tidak terpakai dengan perintah prune agar ruang disk tetap lega.'
    },
    {
      type: 'vocab',
      items: [
        ['REPOSITORY:TAG', 'Penamaan unik sebuah Image, dengan namespace sebagai opsional.'],
        ['IMAGE ID', 'Nilai hash unik (SHA256) yang mewakili sebuah Image.'],
        ['Dangling image', 'Image yang tidak lagi memiliki referensi repository:tag.'],
        ['Layer', 'Lapisan read-only hasil dari satu instruksi build.'],
        ['Cache', 'Mekanisme pemakaian ulang layer lama agar proses build lebih cepat.'],
        ['rmi', 'Singkatan dari remove image, berfungsi menghapus image.']
      ]
    }
  ],
  recap: [
    '<code>docker image ls</code> berfungsi melihat image yang tersimpan lokal.',
    '<code>docker pull</code> berfungsi menarik image dari registry.',
    '<code>docker image tag</code> membuat nama alias baru tanpa menduplikasi image.',
    '<code>docker image rm</code> menghapus image, dengan syarat image tersebut tidak sedang dipakai container.',
    'Sifat layer read-only membuat sharing menjadi efisien antar container.'
  ]
});