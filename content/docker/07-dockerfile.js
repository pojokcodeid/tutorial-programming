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
    '<b>Dockerfile</b> adalah file teks berisi kumpulan instruksi untuk membangun sebuah Docker Image secara otomatis. Dengan Dockerfile, kamu dapat mengemas aplikasimu sendiri beserta seluruh dependensinya menjadi image yang siap dipakai ulang di mana saja.',
    'Bab ini akan mengenalkan struktur Dockerfile, instruksi-instruksi dasar yang paling sering dipakai, serta cara membangun image dengan <code>docker build</code>.'
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
      html: '<h3>Apa itu Dockerfile?</h3><p>Dockerfile memuat langkah demi langkah untuk membangun sebuah Image, mulai dari memilih image dasar (base image), menyalin source code, memasang dependensi, hingga menentukan perintah yang dijalankan saat container dijalankan.</p><p>Setiap instruksi dalam Dockerfile umumnya menghasilkan satu <b>layer read-only</b> baru. Docker menyimpan layer-layer ini dalam <b>build cache</b>, sehingga build berikutnya bisa jauh lebih cepat selama instruksi dan file yang terlibat tidak berubah.</p>'
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
      html: '<h3>Membangun Image (<code>docker build</code>)</h3><p>Setelah Dockerfile selesai ditulis, kamu membangun image-nya dengan perintah <code>docker build</code>. Bentuk umumnya sebagai berikut:</p><pre><code>docker build [OPTIONS] PATH | URL | -</code></pre><p>Nilai <code>PATH</code> (biasanya <code>.</code> menunjuk folder saat ini) adalah <b>build context</b>, yaitu kumpulan file yang dikirim ke Docker daemon dan bisa diakses oleh instruksi <code>COPY</code>.</p>'
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
        '<b>Baris [internal]</b> adalah pekerjaan internal BuildKit: membaca <code>Dockerfile</code>, <code>.dockerignore</code>, dan metadata base image (hanya muncul sekali saja).',
        '<b>[1/3], [2/3], …</b> menunjukkan urutan instruksi Dockerfile yang dieksekusi, di mana setiap instruksi menghasilkan satu layer.',
        '<b>CACHED</b> berarti layer diambil dari build cache karena instruksi dan file-nya tidak berubah — inilah yang membuat build ulang hanya membutuhkan hitungan detik.',
        '<b>naming to docker.io/library/web-static:1.0.0</b> menandakan hasil build sudah diberi tag dan siap dipakai dengan <code>docker run</code>.'
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
      html: '<h3>Contoh 2: Aplikasi Node.js Sederhana</h3><p>Berikut struktur folder minimal untuk contoh ini. Perhatikan adanya <code>package-lock.json</code> — file ini dibutuhkan oleh perintah <code>npm ci</code> dan dibuat dengan menjalankan <code>npm install</code> sekali di komputer lokal:</p><pre><code>app-node/\n├── Dockerfile\n├── package.json\n├── package-lock.json   # dibuat oleh: npm install\n└── index.js</code></pre>'
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

# Salin package.json & package-lock.json dulu
# (tujuannya agar cache instalasi bertahan lama)
COPY package*.json ./

# Install dependensi sesuai lock file
RUN npm ci --omit=dev

# Salin sisa source code
COPY . .

# Port yang didengarkan aplikasi (hanya dokumentasi)
EXPOSE 3000

# Jalankan aplikasi
CMD ["npm", "start"]`,
      explain: [
        'Strateginya: <code>COPY package*.json</code> dulu → <code>RUN npm ci</code> → baru <code>COPY . .</code>. Cara ini memaksimalkan <b>build cache</b>, sehingga dependensi tidak diinstal ulang selama package.json dan lock file tidak berubah.',
        '<code>npm ci</code> membaca <code>package-lock.json</code> sehingga versi dependensi persis sama di setiap build (cocok untuk produksi). Bila file lock belum ada, jalankan <code>npm install</code> sekali di lokal atau ganti dengan <code>npm install --omit=dev</code>.',
        'Gunakan <b>bentuk JSON (exec form)</b> <code>["npm","start"]</code> agar sinyal seperti SIGTERM diteruskan dengan benar ke aplikasi.'
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
      title: 'Build Context &amp; .dockerignore',
      text: 'Hanya masukkan file yang benar-benar dibutuhkan ke dalam build context. Buat file <code>.dockerignore</code> untuk mengecualikan folder seperti <code>node_modules</code>, <code>.git</code>, <code>dist</code>, dan berkas log. Cara ini membuat ukuran context lebih kecil, build lebih cepat, dan menghindari file sensitif ikut terkirim.'
    },
    {
      type: 'warn',
      title: 'CMD vs ENTRYPOINT',
      text: '<code>CMD</code> dapat ditimpa (di-override) saat menjalankan <code>docker run</code>, sedangkan <code>ENTRYPOINT</code> bersifat lebih kaku dan umumnya menunjuk program utama. Kombinasi yang umum adalah <code>ENTRYPOINT ["node"]</code> bersama <code>CMD ["app.js"]</code>.'
    },
    {
      type: 'vocab',
      items: [
        ['Dockerfile', 'File berisi instruksi untuk membangun sebuah Image.'],
        ['Build context', 'Direktori atau file yang dikirim ke Docker daemon saat build (ditandai dengan <code>.</code>).'],
        ['Build cache', 'Mekanisme pemakaian ulang layer lama selama instruksi dan file tidak berubah.'],
        ['Layer', 'Hasil dari setiap instruksi Dockerfile (bersifat read-only).'],
        ['FROM', 'Instruksi wajib pertama yang menentukan base image.'],
        ['WORKDIR', 'Menentukan direktori kerja bawaan di dalam container.'],
        ['COPY vs ADD', '<code>COPY</code> lebih dianjurkan untuk menyalin file lokal dibanding <code>ADD</code>.'],
        ['RUN', 'Menjalankan perintah pada saat build berlangsung.'],
        ['CMD', 'Perintah bawaan saat container mulai berjalan (dapat di-override).'],
        ['ENTRYPOINT', 'Program utama yang dieksekusi oleh container.']
      ]
    }
  ],
  recap: [
    'Dockerfile adalah resep untuk membangun Image milikmu sendiri.',
    'Urutan instruksi sangat menentukan efektivitas build cache, karena itu perhatikan penataannya.',
    'Perintah build: <code>docker build -t nama:tag .</code>.',
    'Strategi untuk Node.js: salin <code>package.json</code> dan lock file dahulu, jalankan <code>npm ci</code>, lalu salin sisa source code.',
    'Gunakan bentuk JSON pada <code>CMD</code>/<code>ENTRYPOINT</code> agar penanganan sinyal berjalan benar.'
  ]
});