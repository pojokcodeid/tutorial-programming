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