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
    'Kamu sudah sering pakai Image (nginx, alpine). Sekarang fokus ke manajemen Image: melihat, menarik, memberi tag, menghapus, dan memahami layer.'
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
      html: '<h3>Melihat Image Lokal</h3>'
    },
    {
      type: 'example',
      title: 'docker image ls',
      lang: 'bash',
      output: false,
      code: `docker image ls

# Tampilkan semua (termasuk dangling)
docker image ls --all`,
      explain: [
        'Kolom: <b>REPOSITORY</b>, <b>TAG</b>, <b>IMAGE ID</b>, <b>CREATED</b>, <b>SIZE</b>.',
        '<b>Dangling image</b> = image tanpa tag/repo (biasanya sisa build lama).'
      ]
    },
    {
      type: 'text',
      html: '<h3>Menarik (Pull) Image</h3><p><code>docker pull</code> mengunduh Image dari registry ke lokal cache.</p>'
    },
    {
      type: 'example',
      title: 'Contoh pull',
      lang: 'bash',
      output: false,
      code: `# Pull latest
docker pull node:20-alpine

# Pull tag spesifik
docker pull node:20.17.0-alpine

# Pull dari registry lain (opsional)
# docker pull ghcr.io/username/repo:tag`,
      explain: [
        'Jika tag tidak disebut, defaultnya <code>latest</code>.',
        'Lebih baik pakai tag spesifik untuk stabilitas.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Memberi Tag Image (<code>docker image tag</code>)</h3><p>Tag berguna saat mau push ke Docker Hub dengan nama repo-mu, atau sekadar memberi alias.</p>'
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
        'Tagging TIDAK meng-copy image, cuma bikin referensi baru ke IMAGE ID yang sama.',
        'Sangat efisien (hemat disk).'
      ]
    },
    {
      type: 'text',
      html: '<h3>Menghapus Image (<code>rmi</code>)</h3><p>Hapus image dari lokal. Image tidak bisa dihapus kalau masih ada container (running/stopped) yang dibuat darinya.</p>'
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
      html: '<h3>Bersihin Image Tidak Terpakai</h3>'
    },
    {
      type: 'example',
      title: 'Prune image',
      lang: 'bash',
      output: false,
      code: `# Hapus dangling images
docker image prune

# Hapus semua image yang TIDAK dipakai oleh container manapun (berhati-hati!)
docker image prune --all`,
      explain: [
        '<code>--all</code> menghapus unused images (bisa lumayan besar hemat disk).',
        'Pastikan kamu nggak perlu image tersebut lagi.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Memahami Layer pada Image</h3><p>Setiap perintah di <code>Dockerfile</code> (mis. FROM, COPY, RUN) menciptakan layer baru. Layer bersifat read-only & bisa dipakai ulang (cache).</p><p>Kamu bisa lihat history layer sebuah image:</p>'
    },
    {
      type: 'example',
      title: 'Lihat history image',
      lang: 'bash',
      output: false,
      code: `docker image history nginx:alpine --no-trunc`,
      explain: [
        'Menunjukkan urutan layer, ukuran, dan perintah pembentuknya.',
        'Inilah alasan kenapa <b>urutan perintah di Dockerfile</b> berpengaruh ke build cache & ukuran image.'
      ]
    },
    {
      type: 'tip',
      title: 'Tips Hemat Disk',
      text: 'Sering pull image resmi (alpine) yang lebih kecil. Bersihin dangling/unused dengan prune secara berkala.'
    },
    {
      type: 'vocab',
      items: [
        ['REPOSITORY:TAG', 'Identitas unik Image (opsional namespace).'],
        ['IMAGE ID', 'Hash unik Image (SHA256).'],
        ['Dangling image', 'Image tanpa referensi repo:tag.'],
        ['Layer', 'Lapisan read-only hasil instruksi build.'],
        ['Cache', 'Layer lama dipakai ulang biar build lebih cepat.'],
        ['rmi', 'Singkatan remove image.']
      ]
    }
  ],
  recap: [
    '<code>docker image ls</code> lihat image lokal.',
    '<code>docker pull</code> tarik image dari registry.',
    '<code>docker image tag</code> bikin alias tanpa duplikasi.',
    '<code>docker image rm</code> hapus image (tidak boleh dipakai container).',
    'Layer read-only → sharing efisien antar container.'
  ]
});