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
    'Sebelum praktik, kamu perlu menginstal Docker di komputer. Docker tersedia untuk macOS, Windows, dan Linux, dan setiap sistem operasi memiliki langkah pemasangan yang berbeda.',
    'Pada bab ini kamu akan memasang Docker, memverifikasi bahwa instalasi berjalan benar, dan memahami perbedaan antara Docker Desktop dan Docker Engine.'
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
      html: '<h3>Docker Desktop vs Docker Engine</h3><p>Sebelum memasang, penting mengetahui dua edisi utama Docker:</p><ul><li><b>Docker Desktop</b> (untuk macOS & Windows) adalah paket lengkap yang sudah memuat Docker Engine, Docker Compose, antarmuka grafis (GUI), hingga Kubernetes (opsional). Karena macOS dan Windows tidak berbasis kernel Linux, Docker Desktop menjalankan Docker Engine di dalam sebuah mesin virtual Linux kecil yang dikelola otomatis.</li><li><b>Docker Engine</b> (untuk Linux) hanya berisi inti runtime Docker: CLI (<code>docker</code>) dan daemon (<code>dockerd</code>). Docker Compose umumnya dipasang terpisah sebagai plugin.</li></ul>'
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
      html: '<h3>1) Instalasi di macOS</h3><ol><li>Kunjungi <a href="https://www.docker.com/products/docker-desktop/" target="_blank" rel="noopener">docker.com/products/docker-desktop</a></li><li>Unduh <b>Docker Desktop for Mac</b> (pilih versi stabil). Untuk Apple Silicon (M1/M2/M3) pilih versi <b>Apple Silicon</b>; untuk Intel pilih <b>Intel Chip</b>.</li><li>Buka file <code>.dmg</code>, lalu seret (drag) <b>Docker.app</b> ke folder <b>Applications</b>.</li><li>Jalankan Docker dari folder Applications. Ikon paus Docker akan muncul di menu bar dan berputar selama proses penyiapan.</li></ol>'
    },
    {
      type: 'text',
      html: '<h3>2) Instalasi di Windows</h3><ol><li>Pastikan <b>WSL 2</b> (Windows Subsystem for Linux) sudah terpasang dengan benar — ikuti <a href="https://learn.microsoft.com/en-us/windows/wsl/install" target="_blank" rel="noopener">panduan resmi Microsoft</a>.</li><li>Unduh <b>Docker Desktop for Windows</b> dari situs resmi.</li><li>Jalankan installer dan biarkan pilihan default (pastikan opsi <b>Use WSL 2</b> tercentang).</li><li>Setelah instalasi selesai, buka Docker Desktop dan tunggu hingga statusnya <b>Running</b>.</li></ol>'
    },
    {
      type: 'text',
      html: '<h3>3) Instalasi di Linux (contoh Ubuntu)</h3><p>Di Linux, Docker Engine dipasang langsung dari repositori resmi Docker. Dokumentasi resmi selalu paling mutakhir, tetapi secara umum langkahnya seperti di bawah ini.</p>'
    },
    {
      type: 'example',
      title: 'Langkah Pemasangan Docker Engine di Ubuntu',
      lang: 'bash',
      output: false,
      code: `# 1) Hapus versi Docker lama agar tidak bentrok (opsional)
sudo apt-get remove -y docker docker-engine docker.io containerd runc

# 2) Pasang dependensi & kunci repositori
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \\
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 3) Tambahkan repositori resmi Docker
echo \\
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \\
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \\
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 4) Pasang Docker Engine + Compose plugin
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io \\
  docker-buildx-plugin docker-compose-plugin

# 5) Tambahkan usermu ke grup docker (agar tanpa sudo)
sudo usermod -aG docker $USER
# lalu logout & login kembali agar grup aktif`,
      explain: [
        '<b>docker-ce</b> adalah Docker Engine, <b>docker-ce-cli</b> adalah perintah <code>docker</code>, dan <b>containerd.io</b> adalah container runtime.',
        '<b>docker-compose-plugin</b> membuat perintah <code>docker compose</code> tersedia di Linux.',
        'Langkah 5 membuat kamu bisa menjalankan perintah docker tanpa <code>sudo</code> setelah logout/login.'
      ]
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

# Atau jika masih memakai docker-compose v1 lama
docker-compose --version

# Coba jalankan container pertama
docker run hello-world`,
      explain: [
        '<code>docker --version</code> menampilkan versi Docker Engine/Client.',
        '<code>docker compose version</code> menampilkan versi plugin Compose.',
        '<code>docker run hello-world</code> akan menarik image hello-world lalu menampilkan pesan sukses bila instalasi sudah benar.'
      ]
    },
    {
      type: 'tip',
      title: 'Tips Linux Pasca-Instalasi',
      text: 'Setelah menambahkan user ke grup docker, lakukan logout lalu login kembali agar perubahan grup berlaku. Tanpa langkah ini, kamu wajib memakai <code>sudo</code> untuk hampir semua perintah docker.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Hindari menjalankan Docker sebagai root. Gunakan grup docker di Linux, atau Docker Desktop yang sudah mengelola konteksnya dengan aman.'
    },
    {
      type: 'vocab',
      items: [
        ['Docker Desktop', 'Paket lengkap Docker untuk macOS/Windows (GUI + Engine + Compose + Kubernetes opsional).'],
        ['Docker Engine', 'Inti runtime Docker untuk Linux (CLI + daemon dockerd).'],
        ['Docker Compose', 'Alat untuk mendefinisikan dan menjalankan aplikasi multi-container (kini berupa plugin <code>docker compose</code>).'],
        ['WSL 2', 'Windows Subsystem for Linux versi 2, menjadi backend Docker Desktop di Windows.']
      ]
    }
  ],
  recap: [
    'Sesuaikan pemasangan dengan platform: Docker Desktop untuk macOS/Windows, Docker Engine untuk Linux.',
    'Verifikasi keberhasilan dengan <code>docker --version</code>, <code>docker compose version</code>, dan <code>docker run hello-world</code>.',
    'Di Linux, jalankan langkah pasca-instalasi (menambahkan user ke grup docker) agar lebih nyaman dan tidak perlu <code>sudo</code>.'
  ]
});