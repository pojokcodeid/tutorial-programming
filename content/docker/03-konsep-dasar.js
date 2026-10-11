/* ============================================================
   Pelajaran Docker — Bab 3: Konsep Dasar – Image, Container, Registry (L3)
   ============================================================ */
'use strict';

window.DOCKER_LESSONS = window.DOCKER_LESSONS || [];

window.DOCKER_LESSONS.push({
  id: 'konsep-image-container-registry',
  title: 'Konsep Dasar: Image, Container & Registry',
  chapter: 'Konsep',
  duration: '6–8 menit',
  intro: [
    'Kamu sudah menjalankan <code>hello-world</code>. Sekarang pahami apa yang sebenarnya terjadi: Docker mencari Image, menarik (pull) dari Registry, lalu membuat & menjalankan Container.'
  ],
  objectives: [
    'Membedakan Image vs Container',
    'Memahami konsep layered filesystem (layer) pada Image',
    'Mengenal Docker Registry & Docker Hub',
    'Memahami alur pull → create → start (run)'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Image vs Container</h3><p><b>Image</b> bersifat <b>immutable (read-only)</b>. Berisi filesystem, konfigurasi, perintah default, dan metadata. <b>Container</b> adalah <b>writable runtime</b> dari Image – saat container berjalan, Docker menambahkan <b>writable layer</b> di atas layer-layer read-only Image.</p>'
    },
    {
      type: 'example',
      title: 'Ilustrasi Layer',
      lang: 'text',
      output: false,
      code: `Image layers (read-only):  [base OS] → [dependencies] → [app code] → [config]
Writable layer (container): [perubahan file saat runtime, log, tmp]`,
      explain: [
        'Semua container dari image yang sama berbagi read-only layers.',
        'Writable layer hilang saat container dihapus (kecuali disimpan via volume).'
      ]
    },
    {
      type: 'text',
      html: '<h3>Registry & Docker Hub</h3><p><b>Docker Registry</b> adalah server tempat menyimpan Image. <b>Docker Hub</b> (<a href="https://hub.docker.com/" target="_blank" rel="noopener">hub.docker.com</a>) adalah public registry default. Kamu bisa pakai registry lain (GitHub Container Registry, Google Artifact Registry, dll) atau self-hosted.</p><p>Image di registry biasanya ditulis dengan format: <code>[namespace/]nama[:tag]</code>. Contoh: <code>hello-world:latest</code>, <code>fhsinchy/hello-dock:latest</code>.</p>'
    },
    {
      type: 'example',
      title: 'Tagging Image',
      lang: 'text',
      output: false,
      code: `alpine:latest
alpine:3.20
nginx:1.27-alpine
fhsinchy/hello-dock:1.0.0`,
      explain: [
        '<code>latest</code> adalah tag default jika tidak disebutkan.',
        'Pakai tag spesifik (versi) biar lebih aman & reproducible.',
        'Image tanpa namespace biasanya resmi/library di Docker Hub.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Alur docker run hello-world</h3><ol><li><b>Client</b> kirim <code>docker run hello-world</code> ke <b>Daemon</b>.</li><li>Daemon cek: ada <code>hello-world:latest</code> di local cache?</li><li>Jika tidak ada → <b>pull</b> dari Docker Hub.</li><li>Daemon <b>create</b> container dari Image (tambahkan writable layer).</li><li>Daemon <b>start</b> container → jalankan entrypoint/cmd → tampil output ke Client.</li></ol>'
    },
    {
      type: 'example',
      title: 'Mencoba pull & cek image lokal',
      lang: 'bash',
      output: false,
      code: `# Pull image tanpa langsung run
docker pull alpine:latest

# Lihat daftar image lokal
docker image ls

# Atau
docker images`,
      explain: [
        '<code>docker pull</code> hanya mengambil Image, tidak membuat container.',
        '<code>docker image ls</code> menampilkan semua Image yang tersimpan lokal.'
      ]
    },
    {
      type: 'tip',
      title: 'Fakta Kecil',
      text: 'Satu Image bisa dipakai untuk membuat ratusan container. Karena layer read-only dibagi, ini hemat disk & RAM.'
    },
    {
      type: 'vocab',
      items: [
        ['Layer', 'Setiap instruksi di Dockerfile biasanya menghasilkan layer read-only baru.'],
        ['Immutable', 'Tidak bisa diubah setelah dibuat (kondisi Image).'],
        ['Writable layer', 'Lapisan tulis-hapus saat container berjalan (temporary).'],
        ['Tag', 'Penanda versi/build pada Image (mis. :latest, :1.0.0).'],
        ['Pull', 'Mengunduh Image dari Registry ke lokal.'],
        ['Run', 'Gabungan create + start untuk menjalankan container dari Image.']
      ]
    }
  ],
  recap: [
    'Image = blueprint (read-only), Container = instance (read-write saat jalan).',
    'Image berlapis (layered) → hemat resource.',
    'Registry pusat penyimpanan Image (Docker Hub).',
    'Alur: pull (jika perlu) → create → start.'
  ]
});