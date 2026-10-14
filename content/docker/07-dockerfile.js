/* ============================================================
   Pelajaran Docker — Bab 7: Dockerfile – Membuat Image Sendiri (L7)
   ============================================================ */
'use strict';

window.DOCKER_LESSONS = window.DOCKER_LESSONS || [];

window.DOCKER_LESSONS.push({
  id: 'dockerfile-membuat-image',
  title: 'Dockerfile – Membuat Image Sendiri',
  chapter: 'Dockerfile',
  duration: '10–12 menit',
  intro: [
    '<b>Dockerfile</b> adalah file teks berisi instruksi untuk membangun Docker Image secara otomatis. Dengan Dockerfile, kamu bisa membuat Image aplikasi-mu sendiri dan bisa dipakai ulang.'
  ],
  objectives: [
    'Memahami tujuan & struktur Dockerfile',
    'Mengenal instruksi dasar: FROM, WORKDIR, COPY, RUN, CMD, EXPOSE, ENTRYPOINT',
    'Membangun Image dengan <code>docker build</code>',
    'Memahami build context & caching',
    'Menulis Dockerfile sederhana untuk aplikasi Node.js/HTML statis'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Apa itu Dockerfile?</h3><p>Dockerfile berisi langkah demi langkah untuk membuat Image. Setiap instruksi menghasilkan <b>layer read-only</b> baru. Docker menggunakan <b>build cache</b> untuk mempercepat build jika tidak ada perubahan.</p>'
    },
    {
      type: 'text',
      html: '<h3>Instruksi Dasar yang Sering Dipakai</h3><table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%"><thead><tr><th>Instruksi</th><th>Kegunaan</th></tr></thead><tbody><tr><td><code>FROM</code></td><td>Base image (wajib pertama). Contoh: <code>node:20-alpine</code>, <code>nginx:alpine</code></td></tr><tr><td><code>WORKDIR</code></td><td>Set working directory di dalam container</td></tr><tr><td><code>COPY</code></td><td>Menyalin file/direktori dari <b>build context</b> ke container</td></tr><tr><td><code>ADD</code></td><td>Mirip COPY, bisa URL/tar extract (jarang dipakai, prefer COPY)</td></tr><tr><td><code>RUN</code></td><td>Menjalankan perintah saat build (install deps, build app)</td></tr><tr><td><code>ENV</code></td><td>Set environment variable</td></tr><tr><td><code>EXPOSE</code></td><td>Mendokumentasikan port yang dipakai (tidak otomatis publish)</td></tr><tr><td><code>CMD</code></td><td>Perintah default saat container start (bisa di-override)</td></tr><tr><td><code>ENTRYPOINT</code></td><td>Executable utama (biasanya dipadukan dengan CMD)</td></tr></tbody></table>'
    },
    {
      type: 'text',
      html: '<h3>Contoh 1: Web Statis (HTML) dengan Nginx</h3><p>Buat file <code>Dockerfile</code> sederhana:</p>'
    },
    {
      type: 'example',
      title: 'Dockerfile – Nginx static',
      lang: 'dockerfile',
      output: false,
      code: `# Base image
FROM nginx:alpine

# Salin file HTML ke folder default nginx
COPY index.html /usr/share/nginx/html/index.html

# Port default nginx 80
EXPOSE 80

# CMD default nginx sudah ada, bisa di-skip jika mau`,
      explain: [
        '<code>nginx:alpine</code> sudah punya ENTRYPOINT/CMD untuk menjalankan nginx.',
        '<code>COPY</code> hanya file <code>index.html</code> ke direktori serve nginx.'
      ]
    },
    {
      type: 'example',
      title: 'index.html (contoh)',
      lang: 'html',
      output: false,
      code: `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><title>Docker App</title></head>
<body><h1>Halo dari Docker Container!</h1><p>Berjalan dengan Nginx.</p></body>
</html>`,
      explain: ['File ini harus ada di <b>build context</b> (folder yang sama dengan Dockerfile).']
    },
    {
      type: 'text',
      html: '<h3>Membangun Image (<code>docker build</code>)</h3><p>Perintah build:</p><pre><code>docker build [OPTIONS] PATH | URL | -</code></pre>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 240" width="760" role="img" aria-label="Alur build image dari build context ke container">
        <rect x="20" y="60" width="180" height="120" rx="8" class="u-box"/>
        <text x="110" y="88" class="u-title">Build context</text>
        <text x="110" y="114" class="u-lbl" text-anchor="middle">folder <tspan font-family="monospace">(.)</tspan></text>
        <text x="110" y="134" class="u-lbl" text-anchor="middle">Dockerfile</text>
        <text x="110" y="154" class="u-lbl" text-anchor="middle">index.html</text>
        <text x="110" y="172" class="u-lbl" text-anchor="middle">.dockerignore</text>
        <rect x="240" y="60" width="170" height="120" rx="8" class="u-hd"/>
        <text x="325" y="90" class="u-title">docker build</text>
        <text x="325" y="118" class="u-lbl" text-anchor="middle">-t web:1.0 .</text>
        <text x="325" y="142" class="u-lbl" text-anchor="middle">baca Dockerfile</text>
        <text x="325" y="164" class="u-lbl" text-anchor="middle">1 baris = 1 layer</text>
        <rect x="450" y="60" width="140" height="120" rx="8" class="u-box"/>
        <text x="520" y="90" class="u-title">Image</text>
        <text x="520" y="118" class="u-lbl" text-anchor="middle">layer 1..n</text>
        <text x="520" y="142" class="u-lbl" text-anchor="middle">read-only</text>
        <text x="520" y="164" class="u-lbl" text-anchor="middle">+ build cache</text>
        <rect x="620" y="60" width="120" height="120" rx="8" class="u-hd"/>
        <text x="680" y="90" class="u-title">Container</text>
        <text x="680" y="118" class="u-lbl" text-anchor="middle">docker run</text>
        <text x="680" y="142" class="u-lbl" text-anchor="middle">-p 8080:80</text>
        <text x="680" y="164" class="u-lbl" text-anchor="middle">container up</text>
        <line x1="204" y1="120" x2="236" y2="120" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="414" y1="120" x2="446" y2="120" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="594" y1="120" x2="616" y2="120" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="110" y="212" class="u-lbl" text-anchor="middle">1. kirim file</text>
        <text x="325" y="212" class="u-lbl" text-anchor="middle">2. eksekusi instruksi</text>
        <text x="520" y="212" class="u-lbl" text-anchor="middle">3. hasil build</text>
        <text x="680" y="212" class="u-lbl" text-anchor="middle">4. dijalankan</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 7.1</b> — Dari folder proyek ke container yang berjalan</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Build image',
      lang: 'bash',
      output: false,
      code: `# Bangun image dengan nama web-static:1.0.0
# Titik (.) = build context saat ini
docker build -t web-static:1.0.0 .

# Jalankan container
docker run -d -p 8083:80 --name web-static web-static:1.0.0

# Cek di http://localhost:8083`,
      explain: [
        '<code>-t</code> / <code>--tag</code> memberi nama:tag pada image hasil build.',
        '<code>.</code> adalah <b>build context</b> (semua file di folder itu bisa diakses COPY).',
        'Docker akan membaca <code>Dockerfile</code> di direktori tersebut.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh output docker build (BuildKit)',
      lang: 'text',
      output: false,
      code: `$ docker build -t web-static:1.0.0 .
[+] Building 3.6s (10/10) FINISHED                            docker:default
 => [internal] load build definition from Dockerfile                0.0s
 => [internal] load .dockerignore                                   0.0s
 => [internal] load metadata for docker.io/library/nginx:alpine     1.1s
 => [1/3] FROM docker.io/library/nginx:alpine@sha256:54a4...        0.5s
 => => resolve docker.io/library/nginx:alpine@sha256:54a4...        0.0s
 => CACHED [2/3] COPY index.html /usr/share/nginx/html/index.html   0.0s
 => exporting to image                                              0.1s
 => => naming to docker.io/library/web-static:1.0.0                 0.0s
 => => writing image sha256:9f3c2ab71de4...                         0.0s`,
      explain: [
        '<b>Baris [internal]</b> = pekerjaan internal BuildKit: membaca <code>Dockerfile</code>, <code>.dockerignore</code>, dan metadata base image (muncul sekali saja).',
        '<b>[1/3], [2/3], …</b> = urutan instruksi Dockerfile yang dieksekusi (setiap instruksi = 1 layer).',
        '<b>CACHED</b> = layer diambil dari build cache karena instruksi &amp; file-nya tidak berubah — ini yang bikin build ulang hanya butuh hitungan detik.',
        '<b>naming to docker.io/library/web-static:1.0.0</b> = hasil build sudah diberi tag, siap dipakai <code>docker run</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Membaca & mengontrol proses build',
      lang: 'bash',
      output: false,
      code: `# Lihat langkah eksak tanpa animasi (mudah di-debug)
docker build --progress=plain -t web-static:1.0.0 .

# Paksa build dari nol (abaikan cache) — berguna saat cache "rusak"
docker build --no-cache -t web-static:1.0.0 .

# Tunjukkan semua opsi build
docker build --help`,
      explain: [
        'Jika ada error (mis. file tidak ditemukan), <code>--progress=plain</code> menunjukkan persis langkah &amp; perintah mana yang gagal.',
        'Urutan Dockerfile menentukan cache: ubah <code>COPY index.html</code> saja → hanya langkah setelahnya yang di-build ulang.',
        'Build kedua pada proyek yang sama biasanya berakhir hampir seluruh <code>CACHED</code>.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Contoh 2: Aplikasi Node.js Sederhana</h3><p>Struktur minimal:</p><pre><code>app-node/\n├── Dockerfile\n├── package.json\n└── index.js</code></pre>'
    },
    {
      type: 'example',
      title: 'index.js',
      lang: 'javascript',
      output: false,
      code: `const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Halo dari Node.js di dalam Docker!');
});

server.listen(3000, () => console.log('Server jalan di port 3000'));`,
      explain: ['Aplikasi ini listen di port 3000 di dalam container.']
    },
    {
      type: 'example',
      title: 'package.json',
      lang: 'json',
      output: false,
      code: `{
  "name": "docker-node-app",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": { "start": "node index.js" }
}`,
      explain: []
    },
    {
      type: 'example',
      title: 'Dockerfile – Node.js',
      lang: 'dockerfile',
      output: false,
      code: `FROM node:20-alpine

WORKDIR /app

# Salin package.json dulu (untuk cache layer deps)
COPY package.json ./

# Install dependencies
RUN npm ci --omit=dev

# Salin sisa source code
COPY . .

# Expose port
EXPOSE 3000

# Jalankan aplikasi
CMD ["npm", "start"]`,
      explain: [
        'Strategi: COPY <code>package.json</code> dulu → <code>RUN npm ci</code> → baru COPY <code>.</code>. Ini memaksimalkan <b>build cache</b> (deps nggak reinstall kalau package.json nggak berubah).',
        'Pakai <code>npm ci --omit=dev</code> untuk production (lebih stabil & cepat).',
        'Gunakan <b>JSON form</b> <code>["npm","start"]</code> (exec form) agar sinyal (SIGTERM) diteruskan dengan benar.'
      ]
    },
    {
      type: 'example',
      title: 'Build & Run Node App',
      lang: 'bash',
      output: false,
      code: `docker build -t node-docker:1.0.0 .
docker run -d -p 8084:3000 --name node-docker node-docker:1.0.0`,
      explain: ['Mapping host 8084 → container 3000. Buka <code>http://localhost:8084</code>.']
    },
    {
      type: 'tip',
      title: 'Build Context & .dockerignore',
      text: 'Hanya file yang dibutuhkan yang masuk build context. Buat <code>.dockerignore</code> untuk mengabaikan node_modules, .git, dist, log, dsb (hemat ukuran context & lebih aman).'
    },
    {
      type: 'warn',
      title: 'CMD vs ENTRYPOINT',
      text: '<code>CMD</code> bisa di-override saat <code>docker run</code> (append args). <code>ENTRYPOINT</code> lebih kaku (biasanya executable). Kombinasi umum: ENTRYPOINT ["node"], CMD ["app.js"].'
    },
    {
      type: 'vocab',
      items: [
        ['Dockerfile', 'File instruksi untuk membangun Image.'],
        ['Build context', 'Direktori/file yang dikirim ke Docker daemon saat build (ditandai <code>.</code>).'],
        ['Build cache', 'Layer sebelumnya dipakai ulang jika instruksi & file tidak berubah.'],
        ['Layer', 'Hasil tiap instruksi Dockerfile (read-only).'],
        ['FROM', 'Base image pertama & wajib.'],
        ['WORKDIR', 'Working directory default di container.'],
        ['COPY vs ADD', 'COPY lebih direkomendasikan untuk file lokal.'],
        ['RUN', 'Eksekusi saat build.'],
        ['CMD', 'Default command saat container start (dapat di-override).'],
        ['ENTRYPOINT', 'Executable utama container.']
      ]
    }
  ],
  recap: [
    'Dockerfile = resep membangun Image sendiri.',
    'Urutan instruksi penting untuk memaksimalkan build cache.',
    'Build: <code>docker build -t nama:tag .</code>.',
    'Strategi Node: COPY package.json dulu → npm ci → COPY sisanya.',
    'Pakai JSON form CMD/ENTRYPOINT untuk penanganan sinyal yang benar.'
  ]
});