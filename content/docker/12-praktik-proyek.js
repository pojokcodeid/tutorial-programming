/* ============================================================
   Pelajaran Docker — Bab 12: Praktik Proyek Mini & Latihan (L12)
   ============================================================ */
'use strict';

window.DOCKER_LESSONS = window.DOCKER_LESSONS || [];

window.DOCKER_LESSONS.push({
  id: 'praktik-proyek-mini',
  title: 'Praktik Proyek Mini & Latihan Mandiri',
  chapter: 'Latihan',
  duration: '10–12 menit',
  intro: [
    'Saatnya menggabungkan semua materi: Dockerfile, Volume, Network, dan Docker Compose. Kerjakan bertahap & coba modifikasi sesuai kreativitasmu.'
  ],
  objectives: [
    'Menyelesaikan Proyek A: Containerize Web Statis + .dockerignore',
    'Menyelesaikan Proyek B: Node.js CRUD sederhana + Named Volume (opsional)',
    'Menyelesaikan Proyek C: Stack Web + DB dengan Docker Compose',
    'Menguji pemahaman via checklist latihan',
    'Mengenal tips next step (push image ke Docker Hub)'
  ],
  sections: [
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
      html: '<h3>Proyek B: Node.js App + Bind Mount (Development)</h3><p><b>Target:</b> Containerize app Node.js, pakai bind mount biar perubahan kode langsung reflekt.</p>'
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
      html: '<h3>Checklist Latihan Mandiri</h3><p>Centang kemampuanmu setelah praktik:</p>'
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
[✓] Bisa pakai .dockerignore
[✓] Bisa pakai bind mount untuk dev
[✓] Paham Named Volume untuk persistensi
[✓] Bisa buat user-defined network & test by name
[✓] Bisa pakai docker compose up/down/ps/logs`,
      explain: ['Kalau ada yang masih kosong, ulang pelajaran terkait ya.']
    },
    {
      type: 'text',
      html: '<h3>Next Step: Push Image ke Docker Hub</h3><p>Setelah sukses build image, kamu bisa share ke Docker Hub.</p>'
    },
    {
      type: 'example',
      title: 'Push ke Docker Hub',
      lang: 'bash',
      output: false,
      code: `# 1) Login
docker login

# 2) Tag image sesuai username Docker Hub
docker image tag proyek-a:1.0.0 usernamekamu/proyek-a:1.0.0

# 3) Push
docker push usernamekamu/proyek-a:1.0.0

# 4) Pull dari mana aja
docker pull usernamekamu/proyek-a:1.0.0`,
      explain: [
        'Ganti <code>usernamekamu</code> dengan username Docker Hub-mu.',
        'Bisa buat repo private/public di Docker Hub.'
      ]
    },
    {
      type: 'tip',
      title: 'Tips Belajar Lanjutan',
      text: 'Coba eksplor: Multi-stage build yang beneran (build frontend → copy ke nginx), docker compose dengan healthcheck, atau cobain image Distroless. Fokus pada "membaca & memahami" Dockerfile orang lain juga sangat berguna.'
    },
    {
      type: 'vocab',
      items: [
        ['Containerize', 'Proses mengemas aplikasi jadi Image Docker siap dijalankan.'],
        ['Healthcheck', 'Pemeriksaan kesiapan service/container.'],
        ['Orphaned volume', 'Volume yang tidak ter-attach ke container manapun.'],
        ['Push', 'Mengupload Image ke Registry (Docker Hub).'],
        ['Login', 'Autentikasi ke Docker Registry.']
      ]
    }
  ],
  recap: [
    'Proyek A–C bantu menguatkan konsep dasar → praktik nyata.',
    'Fokus: build → run → manage → multi-container dengan Compose.',
    'Setelah nyaman CLI, kamu bisa explore push ke registry & optimasi image (multi-stage).',
    'Kuncinya: <b>praktik > hafalin semua perintah</b>. Coba modifikasi contoh biar makin paham.'
  ]
});