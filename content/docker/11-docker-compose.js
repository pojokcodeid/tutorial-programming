/* ============================================================
   Pelajaran Docker — Bab 11: Docker Compose (Multi-container) (L11)
   ============================================================ */
'use strict';

window.DOCKER_LESSONS = window.DOCKER_LESSONS || [];

window.DOCKER_LESSONS.push({
  id: 'docker-compose-multi-container',
  title: 'Docker Compose – Menjalankan Multi-container App',
  chapter: 'Compose',
  duration: '9–11 menit',
  intro: [
    '<b>Docker Compose</b> mempermudah menjalankan aplikasi yang terdiri dari <b>banyak container</b> (mis. web + db + redis). Semua didefinisikan dalam 1 file <code>docker-compose.yml</code> dan dikendalikan dengan 1 perintah.'
  ],
  objectives: [
    'Memahami apa itu Docker Compose & kapan dipakai',
    'Mengenal struktur <code>docker-compose.yml</code> (version, services, networks, volumes)',
    'Menjalankan, menghentikan, melihat logs dengan Compose',
    'Membuat contoh multi-container (web + MySQL)',
    'Memahami <code>depends_on</code> & networking otomatis di Compose'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Apa itu Docker Compose?</h3><p>Tanpa Compose, kamu harus jalankan <code>docker run</code> berkali-kali dengan banyak flag (network, volume, env, port). Dengan Compose, kamu definisikan <b>services</b> (container), <b>networks</b>, <b>volumes</b> dalam <code>docker-compose.yml</code>.</p><p>Perintah utama: <code>docker compose up</code>, <code>docker compose down</code>, <code>docker compose ps</code>, <code>docker compose logs</code>.</p>'
    },
    {
      type: 'text',
      html: '<h3>Struktur docker-compose.yml (dasar)</h3><p>Format modern (Compose Specification) umumnya tidak butuh <code>version:</code> lagi, tapi aman tetap ditulis atau bisa di-skip.</p>'
    },
    {
      type: 'example',
      title: 'Skeleton docker-compose.yml',
      lang: 'yaml',
      output: false,
      code: `name: myapp

services:
  web:
    image: nginx:alpine
    ports:
      - "8080:80"
    networks:
      - app-net

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: appdb
    volumes:
      - db-data:/var/lib/mysql
    networks:
      - app-net

networks:
  app-net:
    driver: bridge

volumes:
  db-data:`,
      explain: [
        '<code>services</code> = definisi container (web, db).',
        '<code>networks</code> = jaringan custom untuk komunikasi antar service.',
        '<code>volumes</code> = named volume untuk persistensi.',
        'Secara default, Compose buat network per project & semua service bisa saling reach via <b>nama service</b>.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Contoh Praktis: Node.js + MySQL</h3><p>Kita buat project simpel: API Node.js (Express) yang connect ke MySQL. Kedua dijalankan bareng pakai Compose.</p><p>Struktur folder:</p><pre><code>compose-demo/\n├── docker-compose.yml\n├── app/\n│   ├── Dockerfile\n│   ├── package.json\n│   └── index.js</code></pre>'
    },
    {
      type: 'example',
      title: 'app/package.json',
      lang: 'json',
      output: false,
      code: `{
  "name": "compose-app",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": { "start": "node index.js" },
  "dependencies": {
    "express": "^4.19.2",
    "mysql2": "^3.11.0"
  }
}`,
      explain: []
    },
    {
      type: 'example',
      title: 'app/index.js (contoh minimal)',
      lang: 'javascript',
      output: false,
      code: `const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const port = 3000;

app.get('/', async (req, res) => {
  try {
    const conn = await mysql.createConnection({
      host: 'db', // nama service di compose
      user: 'root',
      password: 'rootpass',
      database: 'appdb'
    });
    const [rows] = await conn.execute('SELECT NOW() AS waktu');
    await conn.end();
    res.json({ pesan: 'Koneksi DB OK', waktu: rows[0].waktu });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(port, () => console.log('App jalan di port', port));`,
      explain: [
        'Pakai <code>host: "db"</code> karena di network Compose, service <code>db</code> bisa di-resolve by name.',
        'Ini keunggulan user-defined network otomatis milik Compose.'
      ]
    },
    {
      type: 'example',
      title: 'app/Dockerfile',
      lang: 'dockerfile',
      output: false,
      code: `FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["npm", "start"]`,
      explain: []
    },
    {
      type: 'example',
      title: 'docker-compose.yml',
      lang: 'yaml',
      output: false,
      code: `services:
  db:
    image: mysql:8.0
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: appdb
    volumes:
      - db-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 5s
      timeout: 5s
      retries: 10

  app:
    build: ./app
    restart: unless-stopped
    ports:
      - "8086:3000"
    depends_on:
      db:
        condition: service_healthy
    environment:
      DB_HOST: db
      DB_USER: root
      DB_PASS: rootpass
      DB_NAME: appdb

volumes:
  db-data:`,
      explain: [
        '<code>build: ./app</code> → Compose akan build image dari Dockerfile di folder app.',
        '<code>depends_on</code> + <code>condition: service_healthy</code> (pakai <code>service_healthy</code> butuh healthcheck) memastikan app mulai setelah DB siap.',
        '<code>restart: unless-stopped</code> berguna biar auto-restart jika crash.',
        'Port host 8086 → container 3000.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Perintah Docker Compose</h3>'
    },
    {
      type: 'example',
      title: 'Menjalankan & Mengelola',
      lang: 'bash',
      output: false,
      code: `# Jalankan di background (-d)
docker compose up -d

# Lihat status service
docker compose ps

# Lihat logs (semua)
docker compose logs -f

# Lihat logs service tertentu
docker compose logs -f app

# Masuk ke container service
docker compose exec app sh

# Stop semua service (tetap simpan container/volumes/networks)
docker compose stop

# Start kembali
docker compose start

# Hentikan & hapus container + network (volumes TIDAK dihapus default)
docker compose down

# Hentikan & hapus container + network + volumes (HATI-HATI hapus data)
docker compose down --volumes

# Rebuild tanpa cache
docker compose build --no-cache

# Pull image terbaru
docker compose pull`,
      explain: [
        '<code>up -d</code> build (jika perlu) + create + start + attach network.',
        '<code>down</code> bersih-bersih resource project ini.',
        '<code>--volumes</code> akan menghapus named volume → data hilang.'
      ]
    },
    {
      type: 'tip',
      title: 'Networking Otomatis',
      text: 'Kamu TIDAK perlu buat network manual. Compose otomatis buat network dengan nama <code>&lt;project&gt;_default</code>. Antar service bisa komunikasi via <b>nama service</b>.'
    },
    {
      type: 'warn',
      title: 'depends_on vs healthcheck',
      text: '<code>depends_on</code> saja cuma jamin urutan start, BUKAN jamin DB "siap terima koneksi". Tambahkan <code>healthcheck</code> + <code>condition</code> biar lebih aman.'
    },
    {
      type: 'vocab',
      items: [
        ['docker-compose.yml', 'File deklaratif untuk multi-container app.'],
        ['service', 'Definisi container dalam Compose (bisa build atau image).'],
        ['depends_on', 'Mengatur urutan start antar service.'],
        ['healthcheck', 'Cek kesiapan service (healthy).'],
        ['up', 'Buat & jalankan seluruh stack.'],
        ['down', 'Hentikan & hapus resource project (opsional volumes).'],
        ['ps', 'Lihat status service project.'],
        ['logs', 'Tampilkan logs service.'],
        ['exec', 'Eksekusi perintah di service running.']
      ]
    }
  ],
  recap: [
    'Compose: 1 file (<code>docker-compose.yml</code>) → kendalikan banyak container.',
    'Antar service komunikasi via <b>nama service</b> (network otomatis).',
    '<code>docker compose up -d</code> untuk menjalankan stack.',
    '<code>docker compose down</code> untuk bersihin (hindari <code>--volumes</code> kalau data mau dipertahankan).',
    'Pakai <code>depends_on + healthcheck</code> biar app tunggu DB siap.'
  ]
});