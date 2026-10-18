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
    'Kamu sudah menjalankan <code>hello-world</code>. Sekarang mari pahami apa yang sebenarnya terjadi di balik layar: Docker mencari sebuah Image, menariknya (pull) dari Registry bila belum ada, lalu membuat dan menjalankan sebuah Container.',
    'Pemahaman konsep Image, Container, dan Registry adalah fondasi yang akan kamu pakai di setiap perintah Docker berikutnya.'
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
      html: '<h3>Image vs Container</h3><p><b>Image</b> bersifat <b>immutable (read-only)</b>. Image berisi filesystem, konfigurasi, perintah bawaan (default command), dan metadata. Setelah dibuat, isinya tidak boleh diubah.</p><p><b>Container</b> adalah bentuk runtime yang bisa dibaca dan ditulis (read-write) dari sebuah Image. Saat container berjalan, Docker menambahkan satu <b>writable layer</b> di atas seluruh layer read-only Image. Segala perubahan file saat runtime (log, file sementara, konfigurasi tambahan) ditulis ke lapisan ini — dan lapisan inilah yang hilang ketika container dihapus.</p>'
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
      html: '<h3>Registry &amp; Docker Hub</h3><p><b>Docker Registry</b> adalah server tempat menyimpan dan mendistribusikan Image. <b>Docker Hub</b> (<a href="https://hub.docker.com/" target="_blank" rel="noopener">hub.docker.com</a>) adalah registry publik yang dipakai secara bawaan oleh Docker. Selain itu kamu juga dapat memakai registry lain seperti GitHub Container Registry, Google Artifact Registry, atau membuat registry privat sendiri.</p><p>Path sebuah Image di registry ditulis dengan format: <code>[namespace/]nama[:tag]</code>. Contoh: <code>hello-world:latest</code>, <code>library/nginx:1.27</code>, atau <code>fhsinchy/hello-dock:1.0.0</code>.</p>'
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
        '<code>latest</code> adalah tag bawaan jika kamu tidak menyebutkan tag apa pun.',
        'Untuk proyek produksi, gunakan tag versi yang spesifik agar lebih aman dan hasil build bisa diulang (reproducible).',
        'Image tanpa namespace biasanya merupakan image resmi dari organisasi <code>library</code> di Docker Hub.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Alur Perintah docker run hello-world</h3><p>Satu perintah <code>docker run</code> sebenarnya menjalankan beberapa tahap di belakang layar. Memahami alur ini akan membantu kamu menebak di mana sebuah perintah bisa gagal:</p><ol><li><b>Client</b> mengirim perintah <code>docker run hello-world</code> ke <b>Daemon</b>.</li><li>Daemon mengecek apakah <code>hello-world:latest</code> sudah ada di cache lokal.</li><li>Jika belum ada, Daemon melakukan <b>pull</b> (unduh) Image dari Docker Hub.</li><li>Daemon <b>membuat (create)</b> container baru dari Image tersebut dengan menambahkan writable layer.</li><li>Daemon <b>menjalankan (start)</b> container, yaitu mengeksekusi perintah bawaan (ENTRYPOINT/CMD), lalu output-nya dikirim kembali ke Client (terminal kamu).</li></ol>'
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
        '<code>docker pull</code> hanya mengambil Image ke lokal, tidak membuat container.',
        '<code>docker image ls</code> menampilkan seluruh Image yang tersimpan di cache lokal beserta ukurannya.'
      ]
    },
    {
      type: 'tip',
      title: 'Fakta Menarik',
      text: 'Satu Image dapat dipakai untuk membuat ratusan container sekaligus. Karena semua container dari Image yang sama berbagi layer read-only yang sama, penggunaan disk dan memori menjadi jauh lebih hemat.'
    },
    {
      type: 'vocab',
      items: [
        ['Layer', 'Setiap instruksi di Dockerfile umumnya menghasilkan satu layer read-only baru.'],
        ['Immutable', 'Tidak dapat diubah setelah dibuat (sifat Image).'],
        ['Writable layer', 'Lapisan tulis-sementara yang muncul saat container berjalan; hilang bila container dihapus.'],
        ['Tag', 'Penanda versi/build pada Image (misalnya <code>:latest</code>, <code>:1.0.0</code>).'],
        ['Pull', 'Proses mengunduh Image dari Registry ke penyimpanan lokal.'],
        ['Run', 'Gabungan create + start untuk menjalankan container dari sebuah Image.']
      ]
    }
  ],
  recap: [
    'Image adalah blueprint (read-only), Container adalah instance yang berjalan (read-write).',
    'Image bersifat berlapis (layered) sehingga hemat sumber daya dan bisa dibagikan antar container.',
    'Registry berfungsi sebagai pusat penyimpanan Image; Docker Hub adalah registry publik bawaan.',
    'Alur di balik <code>docker run</code>: pull (jika belum ada) → create → start.'
  ]
});