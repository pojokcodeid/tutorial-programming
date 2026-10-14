/* ============================================================
   Pelajaran Docker — Bab 2: Instalasi Docker (L2)
   ============================================================ */
'use strict';

window.DOCKER_LESSONS = window.DOCKER_LESSONS || [];

window.DOCKER_LESSONS.push({
  id: 'installasi-docker',
  title: 'Instalasi Docker (macOS, Windows, Linux)',
  chapter: 'Persiapan',
  duration: '6–8 menit',
  intro: [
    'Sebelum praktik, kamu perlu menginstal Docker di komputermu. Docker tersedia untuk macOS, Windows, dan Linux dengan langkah yang berbeda.'
  ],
  objectives: [
    'Mengetahui cara instalasi Docker Desktop di macOS & Windows',
    'Mengetahui cara instalasi Docker Engine + Docker Compose di Linux',
    'Memverifikasi instalasi Docker berhasil',
    'Mengenal perbedaan Docker Desktop vs Docker Engine'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Docker Desktop vs Docker Engine</h3><p><b>Docker Desktop</b> (macOS/Windows) berisi Docker Engine, Docker Compose, GUI, Kubernetes (opsional), dan tools pendukung. <b>Docker Engine</b> (Linux) hanya engine + CLI, biasanya dipasang terpisah bersama Docker Compose.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 270" width="760" role="img" aria-label="Isi Docker Desktop di macOS Windows dibanding Docker Engine di Linux">
        <rect x="40" y="50" width="300" height="180" rx="10" class="u-box"/>
        <text x="190" y="80" class="u-title">macOS / Windows</text>
        <rect x="65" y="95" width="250" height="40" rx="6" class="u-hd"/>
        <text x="190" y="120" class="u-title">Docker Desktop</text>
        <rect x="65" y="145" width="250" height="32" rx="6" class="u-box"/>
        <text x="190" y="166" class="u-lbl" text-anchor="middle">Docker Engine (di VM Linux)</text>
        <rect x="65" y="183" width="250" height="32" rx="6" class="u-box"/>
        <text x="190" y="204" class="u-lbl" text-anchor="middle">Compose + GUI + Kubernetes</text>
        <rect x="420" y="50" width="300" height="180" rx="10" class="u-box"/>
        <text x="570" y="80" class="u-title">Linux</text>
        <rect x="445" y="95" width="250" height="40" rx="6" class="u-hd"/>
        <text x="570" y="120" class="u-title">Docker Engine</text>
        <rect x="445" y="145" width="250" height="32" rx="6" class="u-box"/>
        <text x="570" y="166" class="u-lbl" text-anchor="middle">docker CLI + dockerd</text>
        <rect x="445" y="183" width="250" height="32" rx="6" class="u-box"/>
        <text x="570" y="204" class="u-lbl" text-anchor="middle">docker compose (plugin)</text>
        <text x="380" y="256" class="u-lbl" text-anchor="middle">Linux memasang engine + CLI secara mandiri; macOS/Windows memakai bundle Docker Desktop</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 2.1</b> — Docker Desktop = bundle lengkap; Linux = engine + CLI + plugin</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>1) Instalasi di macOS</h3><ol><li>Kunjungi <a href="https://www.docker.com/products/docker-desktop/" target="_blank" rel="noopener">docker.com/products/docker-desktop</a></li><li>Download <b>Docker Desktop for Mac</b> (stable)</li><li>Buka file <code>.dmg</code>, drag <b>Docker.app</b> ke folder <b>Applications</b></li><li>Jalankan Docker.app (ikon akan muncul di menu bar)</li></ol>'
    },
    {
      type: 'text',
      html: '<h3>2) Instalasi di Windows</h3><ol><li>Pastikan <b>WSL 2</b> terpasang (lihat <a href="https://learn.microsoft.com/en-us/windows/wsl/install" target="_blank" rel="noopener">panduan Microsoft</a>)</li><li>Download <b>Docker Desktop for Windows</b></li><li>Jalankan installer (biarkan default)</li><li>Setelah selesai, jalankan Docker Desktop</li></ol>'
    },
    {
      type: 'text',
      html: '<h3>3) Instalasi di Linux (contoh Ubuntu)</h3><p>Dokumentasi resmi lebih up-to-date. Secara umum langkahnya:</p><ol><li>Hapus versi lama (opsional): <code>sudo apt remove docker docker-engine docker.io containerd runc</code></li><li>Pasang dependensi & repositori Docker</li><li>Install <code>docker-ce</code>, <code>docker-ce-cli</code>, <code>containerd.io</code>, <code>docker-buildx-plugin</code>, <code>docker-compose-plugin</code></li><li>Tambahkan user ke grup <code>docker</code> agar bisa jalan tanpa <code>sudo</code></li></ol>'
    },
    {
      type: 'example',
      title: 'Verifikasi Instalasi',
      lang: 'bash',
      output: false,
      code: `# Cek versi Docker
docker --version

# Cek versi Docker Compose (plugin v2: docker compose)
docker compose version

# Atau jika masih pakai docker-compose v1
docker-compose --version

# Coba jalankan container pertama
docker run hello-world`,
      explain: [
        '<code>docker --version</code> menampilkan versi Docker Engine/Client.',
        '<code>docker compose version</code> menampilkan versi Compose plugin.',
        '<code>docker run hello-world</code> akan pull image & tampil pesan sukses jika instalasi benar.'
      ]
    },
    {
      type: 'tip',
      title: 'Tips Linux Post-Install',
      text: 'Setelah menambahkan user ke grup docker, logout/login ulang agar perubahan grup berlaku. Tanpa langkah ini, kamu harus pakai sudo untuk kebanyakan perintah docker.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Hindari menjalankan Docker sebagai root. Gunakan grup docker atau Docker Desktop yang sudah mengelola konteksnya.'
    },
    {
      type: 'vocab',
      items: [
        ['Docker Desktop', 'Bundle lengkap Docker untuk macOS/Windows (GUI + Engine + Compose).'],
        ['Docker Engine', 'Core runtime Docker untuk Linux (CLI + daemon).'],
        ['Docker Compose', 'Tools untuk mendefinisikan & menjalankan multi-container app (bisa via plugin).'],
        ['WSL 2', 'Windows Subsystem for Linux v2 (backend Docker Desktop di Windows).']
      ]
    }
  ],
  recap: [
    'Instal sesuai platform: Docker Desktop (macOS/Windows), Docker Engine (Linux).',
    'Verifikasi dengan <code>docker --version</code> & <code>docker run hello-world</code>.',
    'Di Linux, biasakan post-install (grup docker) biar lebih nyaman.'
  ]
});