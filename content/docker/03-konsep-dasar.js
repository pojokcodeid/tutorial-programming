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
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 350" width="760" role="img" aria-label="Image read-only berlapis dan writable layer di container">
        <rect x="60" y="40" width="300" height="290" rx="10" class="u-box"/>
        <text x="210" y="70" class="u-title">Image (read-only)</text>
        <text x="210" y="92" class="u-lbl" text-anchor="middle">tidak bisa diubah setelah dibuat</text>
        <rect x="80" y="110" width="260" height="34" rx="5" class="u-hd"/>
        <text x="210" y="132" class="u-lbl" text-anchor="middle">Layer 4 — config &amp; CMD</text>
        <rect x="80" y="150" width="260" height="34" rx="5" class="u-hd"/>
        <text x="210" y="172" class="u-lbl" text-anchor="middle">Layer 3 — source code app</text>
        <rect x="80" y="190" width="260" height="34" rx="5" class="u-hd"/>
        <text x="210" y="212" class="u-lbl" text-anchor="middle">Layer 2 — dependencies</text>
        <rect x="80" y="230" width="260" height="34" rx="5" class="u-hd"/>
        <text x="210" y="252" class="u-lbl" text-anchor="middle">Layer 1 — base image (alpine)</text>
        <text x="210" y="300" class="u-lbl" text-anchor="middle">setiap layer dibagikan oleh semua container</text>
        <rect x="420" y="40" width="300" height="290" rx="10" class="u-box"/>
        <text x="570" y="70" class="u-title">Container</text>
        <text x="570" y="92" class="u-lbl" text-anchor="middle">Image + lapisan tulis saat berjalan</text>
        <rect x="440" y="110" width="260" height="34" rx="5" class="u-hd" stroke-dasharray="4 3"/>
        <text x="570" y="132" class="u-lbl" text-anchor="middle">Writable layer (perubahan runtime)</text>
        <rect x="440" y="150" width="260" height="34" rx="5" class="u-box"/>
        <text x="570" y="172" class="u-lbl" text-anchor="middle">Layer 4 — config &amp; CMD</text>
        <rect x="440" y="190" width="260" height="34" rx="5" class="u-box"/>
        <text x="570" y="212" class="u-lbl" text-anchor="middle">Layer 3 — source code app</text>
        <rect x="440" y="230" width="260" height="34" rx="5" class="u-box"/>
        <text x="570" y="252" class="u-lbl" text-anchor="middle">Layer 2 — dependencies</text>
        <rect x="440" y="270" width="260" height="34" rx="5" class="u-box"/>
        <text x="570" y="292" class="u-lbl" text-anchor="middle">Layer 1 — base image (alpine)</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 3.1</b> — Writable layer menumpuk di atas layer Image; hilang saat container dihapus</figcaption></figure>`
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
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 210" width="760" role="img" aria-label="Alur perintah docker run hello-world dari client sampai output">
        <rect x="10" y="60" width="126" height="90" rx="8" class="u-box"/>
        <text x="73" y="86" class="u-title">1. Client</text>
        <text x="73" y="110" class="u-lbl" text-anchor="middle">docker run</text>
        <text x="73" y="128" class="u-lbl" text-anchor="middle">hello-world</text>
        <rect x="166" y="60" width="126" height="90" rx="8" class="u-box"/>
        <text x="229" y="86" class="u-title">2. Cek lokal</text>
        <text x="229" y="110" class="u-lbl" text-anchor="middle">image sudah ada</text>
        <text x="229" y="128" class="u-lbl" text-anchor="middle">di cache?</text>
        <rect x="322" y="60" width="126" height="90" rx="8" class="u-hd"/>
        <text x="385" y="86" class="u-title">3. Pull</text>
        <text x="385" y="110" class="u-lbl" text-anchor="middle">unduh image dari</text>
        <text x="385" y="128" class="u-lbl" text-anchor="middle">Docker Hub</text>
        <rect x="478" y="60" width="126" height="90" rx="8" class="u-box"/>
        <text x="541" y="86" class="u-title">4. Create</text>
        <text x="541" y="110" class="u-lbl" text-anchor="middle">container baru +</text>
        <text x="541" y="128" class="u-lbl" text-anchor="middle">writable layer</text>
        <rect x="634" y="60" width="126" height="90" rx="8" class="u-box"/>
        <text x="697" y="86" class="u-title">5. Start</text>
        <text x="697" y="110" class="u-lbl" text-anchor="middle">jalankan CMD →</text>
        <text x="697" y="128" class="u-lbl" text-anchor="middle">output ke terminal</text>
        <line x1="140" y1="105" x2="162" y2="105" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="296" y1="105" x2="318" y2="105" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="452" y1="105" x2="474" y2="105" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="608" y1="105" x2="630" y2="105" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="385" y="185" class="u-lbl" text-anchor="middle">Bila image sudah ada di lokal, langkah 3 dilewati → perintah berikutnya jauh lebih cepat</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 3.2</b> — Lima langkah di balik satu perintah <code>docker run</code></figcaption></figure>`
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