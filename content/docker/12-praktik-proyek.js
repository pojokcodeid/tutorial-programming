/* ============================================================
   Pelajaran Docker — Bab 12: Praktik Proyek Mini & Latihan (L12)
   ============================================================ */
'use strict';

window.DOCKER_LESSONS = window.DOCKER_LESSONS || [];

window.DOCKER_LESSONS.push({
  id: 'praktik-proyek-mini',
  title: 'Praktik Proyek Mini & Latihan Mandiri',
  chapter: 'Latihan',
  duration: '12–15 menit',
  intro: [
    'Saatnya menggabungkan seluruh materi yang sudah dipelajari: Dockerfile, Volume, Network, dan Docker Compose. Kerjakan secara bertahap dan coba modifikasi sesuai kreativitasmu, termasuk satu <b>proyek lengkap</b> dari awal hingga image siap produksi.',
    'Bab ini ditutup dengan checklist latihan mandiri dan langkah lanjutan yaitu mengunggah image ke Docker Hub.'
  ],
  objectives: [
    'Menyelesaikan Proyek A: Containerize Web Statis + .dockerignore',
    'Menyelesaikan Proyek B: Node.js CRUD sederhana + Named Volume (opsional)',
    'Menyelesaikan Proyek C: Stack Web + DB dengan Docker Compose',
    'Menjalankan Proyek D: build project lengkap &amp; membaca output <code>docker build</code>',
    'Menguji pemahaman via checklist latihan',
    'Mengenal tips next step (push image ke Docker Hub)'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Alur Build Project dari Awal sampai Selesai</h3><p>Setiap proyek di bawah memakai alur yang sama. Pahami alurnya sekali, proyek berikutnya jadi pengulangan yang mudah:</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 220" width="760" role="img" aria-label="Alur build project dari menulis kode sampai push image">
        <rect x="10" y="70" width="126" height="96" rx="8" class="u-box"/>
        <text x="73" y="96" class="u-title">1. Kode</text>
        <text x="73" y="120" class="u-lbl" text-anchor="middle">src/ + package.json</text>
        <text x="73" y="138" class="u-lbl" text-anchor="middle">kode aplikasi</text>
        <text x="73" y="156" class="u-lbl" text-anchor="middle">siap dijalankan</text>
        <rect x="166" y="70" width="126" height="96" rx="8" class="u-box"/>
        <text x="229" y="96" class="u-title">2. Resep</text>
        <text x="229" y="120" class="u-lbl" text-anchor="middle">Dockerfile</text>
        <text x="229" y="138" class="u-lbl" text-anchor="middle">.dockerignore</text>
        <text x="229" y="156" class="u-lbl" text-anchor="middle">build context (.)</text>
        <rect x="322" y="70" width="126" height="96" rx="8" class="u-hd"/>
        <text x="385" y="96" class="u-title">3. Build</text>
        <text x="385" y="120" class="u-lbl" text-anchor="middle">docker build</text>
        <text x="385" y="138" class="u-lbl" text-anchor="middle">-t proyek-d:1.0.0 .</text>
        <text x="385" y="156" class="u-lbl" text-anchor="middle">layer + cache</text>
        <rect x="478" y="70" width="126" height="96" rx="8" class="u-hd"/>
        <text x="541" y="96" class="u-title">4. Run</text>
        <text x="541" y="120" class="u-lbl" text-anchor="middle">docker run -d</text>
        <text x="541" y="138" class="u-lbl" text-anchor="middle">-p 8095:3000</text>
        <text x="541" y="156" class="u-lbl" text-anchor="middle">container jalan</text>
        <rect x="634" y="70" width="126" height="96" rx="8" class="u-box"/>
        <text x="697" y="96" class="u-title">5. Uji &amp; Push</text>
        <text x="697" y="120" class="u-lbl" text-anchor="middle">curl / browser</text>
        <text x="697" y="138" class="u-lbl" text-anchor="middle">docker images</text>
        <text x="697" y="156" class="u-lbl" text-anchor="middle">tag → push</text>
        <line x1="140" y1="118" x2="162" y2="118" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="296" y1="118" x2="318" y2="118" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="452" y1="118" x2="474" y2="118" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="608" y1="118" x2="630" y2="118" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="385" y="198" class="u-lbl" text-anchor="middle">Gagal di langkah 3 → cek Dockerfile, build context &amp; .dockerignore · Gagal di langkah 4 → cek port &amp; logs</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 12.1</b> — Lima langkah build project: kode → resep → image → container → uji</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Proyek A: Web Statis dengan Nginx</h3><p><b>Target:</b> Buat Image sendiri untuk file HTML statis, jalankan container & akses via browser.</p>'
    },
    {
      type: 'example',
      title: 'Langkah Proyek A',
      lang: 'bash',
      output: false,
      code: `# 1) Buat folder
mkdir -p ~/docker-latihan/proyek-a && cd ~/docker-latihan/proyek-a

# 2) Buat index.html
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><title>Proyek A Docker</title></head>
<body><h1>Berhasil Containerize Web Statis!</h1><p>Dibuat dengan Docker + Nginx</p></body>
</html>
EOF

# 3) Buat Dockerfile
cat > Dockerfile << 'EOF'
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
EXPOSE 80
EOF

# 4) Buat .dockerignore
echo -e "Dockerfile*\n.dockerignore\nREADME.md" > .dockerignore

# 5) Build & Run
docker build -t proyek-a:1.0.0 .
docker run -d -p 8090:80 --name proyek-a proyek-a:1.0.0

# 6) Coba buka http://localhost:8090`,
      explain: [
        'Pastikan bisa diakses di browser.',
        'Coba edit <code>index.html</code> (tanpa rebuild) pakai bind mount untuk lihat perbedaannya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Proyek B: Node.js App + Bind Mount (Development)</h3><p><b>Target:</b> Mengemas aplikasi Node.js ke dalam container, lalu memakai bind mount agar setiap perubahan kode langsung terlihat tanpa build ulang.</p>'
    },
    {
      type: 'example',
      title: 'Langkah Proyek B',
      lang: 'bash',
      output: false,
      code: `mkdir -p ~/docker-latihan/proyek-b && cd ~/docker-latihan/proyek-b

# package.json
cat > package.json << 'EOF'
{
  "name": "proyek-b",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": { "start": "node index.js", "dev": "nodemon index.js" },
  "dependencies": { "express": "^4.19.2" },
  "devDependencies": { "nodemon": "^3.1.4" }
}
EOF

# index.js
cat > index.js << 'EOF'
const express = require('express');
const app = express(); const port=3000;
app.get('/', (req,res)=>res.json({pesan:'Halo dari Proyek B', waktu:new Date()}));
app.listen(port,()=>console.log('Jalan di',port));
EOF

# Dockerfile (dev style)
cat > Dockerfile << 'EOF'
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
EOF

# .dockerignore
echo -e "node_modules\nDockerfile*\n.dockerignore" > .dockerignore

# Jalankan dengan bind mount
docker run -d -p 8091:3000 --name proyek-b \
  -v $(pwd):/app -v /app/node_modules \
  proyek-b:dev

# Build image dulu: docker build -t proyek-b:dev .
# Lalu run di atas`,
      explain: [
        'Ubah isi <code>index.js</code> (mis. ubah pesan), simpan. Reload browser <code>http://localhost:8091</code> → harus berubah tanpa rebuild (karena bind mount + nodemon).'
      ]
    },
    {
      type: 'text',
      html: '<h3>Proyek C: Full Stack dengan Docker Compose</h3><p><b>Target:</b> Gabungkan Web/API + Database dalam 1 <code>docker-compose.yml</code>. Terapkan network, volume, depends_on (opsional healthcheck).</p>'
    },
    {
      type: 'example',
      title: 'docker-compose.yml (referensi)',
      lang: 'yaml',
      output: false,
      code: `services:
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: latihan
    volumes:
      - dbvol:/var/lib/mysql
    networks:
      - latihan-net

  api:
    build: ./api
    ports:
      - "8092:3000"
    environment:
      DB_HOST: db
      DB_USER: root
      DB_PASS: rootpass
      DB_NAME: latihan
    depends_on:
      - db
    networks:
      - latihan-net

networks:
  latihan-net:

volumes:
  dbvol:`,
      explain: [
        'Buat folder <code>api/</code> dengan Dockerfile + app sederhana (bisa pakai Express + mysql2).',
        'Jalankan: <code>docker compose up -d</code>, buka <code>http://localhost:8092</code>.',
        'Stop: <code>docker compose down</code> (coba tanpa/ dengan <code>--volumes</code> amati bedanya).'
      ]
    },
    {
      type: 'text',
      html: '<h3>Proyek D: Build Project Lengkap dari Nol</h3><p><b>Target:</b> Satu project nyata — API Node.js — dibangun sampai menjadi image produksi, diuji, lalu dibaca output build-nya. Inilah contoh build project end-to-end yang dipakai tim saat bekerja.</p><p>Struktur folder:</p><pre><code>proyek-d/\n├── Dockerfile\n├── .dockerignore\n├── package.json\n├── package-lock.json   # hasil npm install\n└── src/\n    └── server.js</code></pre>'
    },
    {
      type: 'example',
      title: 'src/server.js',
      lang: 'javascript',
      output: false,
      code: `const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (_req, res) => {
  res.json({ pesan: 'Halo dari Proyek D!', stack: 'docker build' });
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(port, () => console.log('Proyek D jalan di port', port));`,
      explain: ['Port dibaca dari <code>ENV PORT</code> dengan fallback 3000 — container jadi lebih fleksibel.']
    },
    {
      type: 'example',
      title: 'package.json',
      lang: 'json',
      output: false,
      code: `{
  "name": "proyek-d",
  "version": "1.0.0",
  "main": "src/server.js",
  "scripts": { "start": "node src/server.js" },
  "dependencies": { "express": "^4.19.2" }
}`,
      explain: ['Jalankan <code>npm install</code> sekali di lokal untuk membuat <code>package-lock.json</code> — file ini wajib ada jika memakai <code>npm ci</code>.']
    },
    {
      type: 'example',
      title: 'Dockerfile (multi-stage, siap produksi)',
      lang: 'dockerfile',
      output: false,
      code: `# ---------- Stage 1: build ----------
FROM node:20-alpine AS build
WORKDIR /app
# package*.json dulu supaya cache install bertahan lama
COPY package*.json ./
RUN npm ci
COPY . .

# ---------- Stage 2: produksi ----------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/src ./src
USER node
EXPOSE 3000
CMD ["node", "src/server.js"]`,
      explain: [
        'Dua <code>FROM</code> = dua stage. Stage <code>build</code> dipakai untuk install &amp; siapkan artefak, lalu <b>dibuang</b> dari image final.',
        '<code>COPY package*.json</code> selalu diletakkan <b>sebelum</b> <code>RUN npm ci</code> supaya cache install tidak hilang hanya karena kode berubah.',
        '<code>COPY --from=build</code> hanya menyalin folder <code>src</code> → image final ramping.',
        '<code>USER node</code> menjalankan proses sebagai user non-root (praktik keamanan).'
      ]
    },
    {
      type: 'example',
      title: '.dockerignore',
      lang: 'text',
      output: false,
      code: `node_modules
npm-debug.log
Dockerfile*
.dockerignore
.git
.env
README.md
coverage`,
      explain: [
        '<code>node_modules</code> tidak boleh ikut dari host — dependensi harus di-install <b>di dalam</b> container agar sesuai environment-nya.',
        '<code>.env</code> dijaga agar rahasia tidak ikut masuk build context.'
      ]
    },
    {
      type: 'example',
      title: 'Langkah build project',
      lang: 'bash',
      output: false,
      code: `mkdir -p ~/docker-latihan/proyek-d/src && cd ~/docker-latihan/proyek-d
# (isi file sesuai contoh di atas)

# 1) Buat lock file — sekali saja, butuh internet
npm install

# 2) Bangun image
docker build -t proyek-d:1.0.0 .

# 3) Jalankan container
docker run -d -p 8095:3000 --name proyek-d proyek-d:1.0.0

# 4) Uji dari host
curl http://localhost:8095
curl http://localhost:8095/health`,
      explain: [
        '<code>-t proyek-d:1.0.0</code> memberi nama + versi pada hasil build.',
        'Buka juga <code>http://localhost:8095</code> di browser untuk melihat JSON-nya.',
        'Ganti <code>8095</code> bila port-nya bentrok dengan proyek sebelumnya.'
      ]
    },
    {
      type: 'example',
      title: 'Membaca output docker build',
      lang: 'text',
      output: false,
      code: `$ docker build -t proyek-d:1.0.0 .
[+] Building 12.4s (14/14) FINISHED                            docker:default
 => [internal] load build definition from Dockerfile             0.0s
 => [internal] load .dockerignore                                0.0s
 => [internal] load metadata for docker.io/library/node:20-alpine 0.9s
 => [build 1/6] FROM docker.io/library/node:20-alpine@sha256:... 0.6s
 => [build 3/6] COPY package*.json ./                            0.0s
 => [build 4/6] RUN npm ci                                       6.8s
 => [build 5/6] COPY . .                                         0.1s
 => [build 6/6] ...                                              0.0s
 => [prod 1/5] FROM docker.io/library/node:20-alpine@sha256:...  0.0s
 => [prod 3/5] COPY package*.json ./                             0.0s
 => [prod 4/5] RUN npm ci --omit=dev && npm cache clean --force  4.2s
 => [prod 5/5] COPY --from=build /app/src ./src                  0.0s
 => exporting to image                                           0.2s
 => => naming to docker.io/library/proyek-d:1.0.0                0.0s
 => => writing image sha256:1c9a4be07fd2...                      0.0s`,
      explain: [
        '<b>[build x/6]</b> = stage 1 (builder), <b>[prod x/5]</b> = stage 2 (image final) — angka per tahap menunjukkan total instruksi stage itu.',
        '<b>[internal]</b> = pekerjaan internal BuildKit (baca Dockerfile, .dockerignore, metadata base image) — bukan instruksi milikmu.',
        'Total <code>12.4s</code> adalah build pertama; sebagian besar waktu habis di dua perintah <code>npm ci</code>.',
        'Baris terakhir <code>naming to ... proyek-d:1.0.0</code> menandakan build sukses &amp; image sudah bisa dijalankan.'
      ]
    },
    {
      type: 'example',
      title: 'Build ulang setelah kode berubah (uji cache)',
      lang: 'text',
      output: false,
      code: `$ # ubah pesan di src/server.js, lalu build lagi
$ docker build -t proyek-d:1.0.1 .
[+] Building 1.9s (14/14) FINISHED                             docker:default
 => CACHED [build 4/6] RUN npm ci                               0.0s
 => [build 5/6] COPY . .                                        0.1s   ← berubah
 => CACHED [prod 4/5] RUN npm ci --omit=dev && npm cache clean  0.0s
 => [prod 5/5] COPY --from=build /app/src ./src                 0.0s   ← ikut berubah`,
      explain: [
        'Dari <b>12.4 detik → 1.9 detik</b>: instalasi dependensi tetap memakai cache karena <code>package*.json</code> tidak berubah.',
        'Yang di-build ulang hanya langkah setelah file yang kamu ubah — inilah gunanya mengurutkan Dockerfile dengan benar.',
        'Bila seluruh baris ikut berubah, coba <code>docker build --no-cache</code> untuk memastikan bukan akibat cache yang tersangkut.'
      ]
    },
    {
      type: 'example',
      title: 'Verifikasi hasil build',
      lang: 'bash',
      output: false,
      code: `# Image & ukurannya
docker images proyek-d

# Rincian layer + perintah pembentuknya
docker history proyek-d:1.0.0

# Log & isi container
docker logs proyek-d
docker exec proyek-d ls -la /app

# Konsumsi disk Docker secara keseluruhan
docker system df

# Bersihin setelah praktik
docker stop proyek-d && docker rm proyek-d`,
      explain: [
        '<code>docker images</code> → pastikan tag <code>1.0.0</code> &amp; ukuran image masuk akal.',
        '<code>docker history</code> menampilkan ukuran tiap layer — cocok untuk menemukan layer yang membuat image menjadi besar.',
        '<code>docker logs</code> menunjukkan pesan <code>Proyek D jalan di port 3000</code> bila build &amp; run benar.'
      ]
    },
    {
      type: 'tip',
      title: 'Penanganan masalah build yang sering muncul',
      text: '<b>1)</b> <code>failed to compute cache key: ... not found</code> → file tidak ada di build context: periksa nama file, path <code>COPY</code>, dan apakah file tersebut terkena <code>.dockerignore</code>. <b>2)</b> <code>npm ci can only install with an existing package-lock.json</code> → jalankan <code>npm install</code> terlebih dahulu di komputer lokal agar lock file terbentuk. <b>3)</b> Seluruh layer di-build ulang padahal kamu hanya mengubah satu baris → pastikan <code>COPY package*.json</code> dan <code>RUN npm ci</code> berada <b>sebelum</b> <code>COPY . .</code>.'
    },
    {
      type: 'text',
      html: '<h3>Checklist Latihan Mandiri</h3><p>Centang kemampuanmu setelah selesai praktik:</p>'
    },
    {
      type: 'example',
      title: 'Self-Check',
      lang: 'text',
      output: false,
      code: `[✓] Bisa install & verifikasi Docker
[✓] Paham Image vs Container
[✓] Bisa run/stop/start/rm container + publish port
[✓] Bisa exec -it masuk ke container
[✓] Bisa build image dari Dockerfile
[✓] Bisa membaca output docker build (layer, CACHED, naming)
[✓] Bisa menyelesaikan build project end-to-end (Proyek D)
[✓] Bisa pakai .dockerignore
[✓] Bisa pakai bind mount untuk dev
[✓] Paham Named Volume untuk persistensi
[✓] Bisa buat user-defined network & test by name
[✓] Bisa pakai docker compose up/down/ps/logs`,
      explain: ['Kalau ada yang masih kosong, ulang pelajaran terkait ya.']
    },
    {
      type: 'text',
      html: '<h3>Langkah Berikutnya: Mengunggah Image ke Docker Hub</h3><p>Setelah berhasil membangun image, kamu dapat membagikannya kepada orang lain melalui Docker Hub agar bisa diunduh dari komputer mana pun.</p>'
    },
    {
      type: 'example',
      title: 'Push ke Docker Hub',
      lang: 'bash',
      output: false,
      code: `# 1) Login
docker login

# 2) Beri tag image sesuai username Docker Hub-mu
docker image tag proyek-a:1.0.0 usernamekamu/proyek-a:1.0.0

# 3) Unggah (push)
docker push usernamekamu/proyek-a:1.0.0

# 4) Unduh (pull) dari komputer mana pun
docker pull usernamekamu/proyek-a:1.0.0`,
      explain: [
        'Ganti <code>usernamekamu</code> dengan username Docker Hub milikmu.',
        'Kamu dapat membuat repository dengan visibilitas publik maupun privat sesuai kebutuhan.'
      ]
    },
    {
      type: 'tip',
      title: 'Tips Belajar Lanjutan',
      text: 'Coba jelajahi materi lebih lanjut, misalnya multi-stage build yang sesungguhnya (membangun frontend lalu menyalinnya ke nginx), Docker Compose dengan healthcheck, atau mencoba image Distroless. Selain itu, membaca dan memahami Dockerfile milik orang lain juga sangat melatih pemahamanmu.'
    },
    {
      type: 'vocab',
      items: [
        ['Containerize', 'Proses mengemas aplikasi menjadi Image Docker yang siap dijalankan.'],
        ['Healthcheck', 'Pemeriksaan untuk memastikan sebuah layanan atau container sudah siap.'],
        ['Orphaned volume', 'Volume yang tidak lagi terpasang pada container mana pun.'],
        ['Push', 'Mengunggah Image ke Registry seperti Docker Hub.'],
        ['Login', 'Proses autentikasi ke sebuah Docker Registry.']
      ]
    }
  ],
  recap: [
    'Alur pembangunan proyek selalu sama: kode → Dockerfile → <code>docker build</code> → image → <code>docker run</code> → uji.',
    'Proyek A sampai D membantu menguatkan konsep dasar hingga praktik nyata, termasuk cara membaca output build.',
    'Alur yang perlu dikuasai: build → run → kelola → multi-container dengan Compose.',
    'Setelah nyaman dengan CLI, kamu dapat melanjutkan ke pengunggahan image ke registry dan optimasi image (multi-stage).',
    'Kuncinya adalah <b>praktik lebih penting daripada menghafal semua perintah</b>. Coba modifikasi contoh agar pemahamanmu semakin kuat.'
  ]
});