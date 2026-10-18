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
    '<b>Docker Compose</b> mempermudah kamu menjalankan aplikasi yang terdiri dari <b>banyak container</b> sekaligus, misalnya kombinasi web, database, dan redis. Seluruhnya didefinisikan dalam satu file <code>docker-compose.yml</code> lalu dikendalikan dengan beberapa perintah sederhana.',
    'Dengan Compose, kamu tidak perlu lagi menghafal deretan opsi <code>docker run</code> yang panjang untuk setiap container.'
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
      html: '<h3>Apa itu Docker Compose?</h3><p>Tanpa Compose, kamu harus menjalankan <code>docker run</code> berkali-kali dengan berbagai opsi seperti jaringan, volume, variabel lingkungan, dan port untuk setiap container. Dengan Compose, kamu cukup mendefinisikan <b>layanan (services)</b>, <b>jaringan (networks)</b>, dan <b>volume</b> di dalam satu file <code>docker-compose.yml</code>.</p><p>Perintah utama yang akan sering dipakai: <code>docker compose up</code>, <code>docker compose down</code>, <code>docker compose ps</code>, dan <code>docker compose logs</code>.</p>'
    },
    {
      type: 'text',
      html: '<h3>Struktur dasar docker-compose.yml</h3><p>Pada format modern (Compose Specification), baris <code>version:</code> umumnya sudah tidak diperlukan lagi, namun tidak masalah jika tetap ditulis. Kamu bebas menuliskannya atau melewatkannya.</p>'
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
        '<code>services</code> berisi definisi container, dalam contoh ini adalah web dan db.',
        '<code>networks</code> adalah jaringan buatan untuk komunikasi antar layanan.',
        '<code>volumes</code> adalah named volume yang dipakai untuk menyimpan data secara persisten.',
        'Secara bawaan, Compose membuat jaringan tersendiri untuk setiap proyek sehingga semua layanan saling terhubung melalui <b>nama layanan</b>.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Contoh Praktis: Node.js + MySQL</h3><p>Mari kita buat proyek sederhana berupa API Node.js (Express) yang terhubung ke MySQL, lalu keduanya dijalankan bersama menggunakan Compose.</p><p>Struktur foldernya sebagai berikut:</p><pre><code>compose-demo/\n├── docker-compose.yml\n├── app/\n│   ├── Dockerfile\n│   ├── package.json\n│   └── index.js</code></pre>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 330" width="760" role="img" aria-label="Satu file docker-compose.yml menjalankan dua service dalam satu stack">
        <rect x="240" y="20" width="280" height="66" rx="8" class="u-hd"/>
        <text x="380" y="46" class="u-title">docker-compose.yml</text>
        <text x="380" y="68" class="u-lbl" text-anchor="middle">services • networks • volumes</text>
        <line x1="380" y1="90" x2="380" y2="116" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="392" y="108" class="u-lbl">docker compose up -d</text>
        <rect x="40" y="124" width="680" height="186" rx="10" class="u-hd"/>
        <text x="380" y="152" class="u-title">network: &lt;project&gt;_default (otomatis)</text>
        <rect x="80" y="176" width="250" height="106" rx="8" class="u-box"/>
        <text x="205" y="204" class="u-title">app (build: ./app)</text>
        <text x="205" y="228" class="u-lbl" text-anchor="middle">Node.js API</text>
        <text x="205" y="250" class="u-lbl" text-anchor="middle">ports: 8086 → 3000</text>
        <text x="205" y="272" class="u-lbl" text-anchor="middle">depends_on: db</text>
        <rect x="430" y="176" width="250" height="106" rx="8" class="u-box"/>
        <text x="555" y="204" class="u-title">db (mysql:8.0)</text>
        <text x="555" y="228" class="u-lbl" text-anchor="middle">volumes: db-data</text>
        <text x="555" y="250" class="u-lbl" text-anchor="middle">healthcheck: mysqladmin ping</text>
        <text x="555" y="272" class="u-lbl" text-anchor="middle">env: MYSQL_DATABASE</text>
        <line x1="334" y1="229" x2="426" y2="229" class="u-line" marker-start="url(#u-arrow)" marker-end="url(#u-arrow)"/>
        <text x="380" y="214" class="u-lbl" text-anchor="middle">DB_HOST: db</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 11.1</b> — 1 file → 1 stack: service saling terhubung lewat nama service di network otomatis</figcaption></figure>`
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
        '<code>build: ./app</code> membuat Compose membangun image dari Dockerfile yang ada di folder app.',
        '<code>depends_on</code> beserta <code>condition: service_healthy</code> (memerlukan healthcheck) memastikan aplikasi baru mulai setelah database benar-benar siap menerima koneksi.',
        '<code>restart: unless-stopped</code> membuat container otomatis dijalankan kembali bila mengalami crash.',
        'Port 8086 di host diteruskan ke port 3000 di dalam container.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Perintah Docker Compose</h3><p>Berikut kumpulan perintah yang paling sering dipakai untuk mengelola proyek Compose.</p>'
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
        '<code>up -d</code> melakukan build bila diperlukan, lalu membuat, menjalankan, dan menghubungkan jaringan untuk seluruh stack.',
        '<code>down</code> membersihkan seluruh resource milik proyek ini.',
        'Opsi <code>--volumes</code> akan ikut menghapus named volume sehingga data di dalamnya hilang.'
      ]
    },
    {
      type: 'tip',
      title: 'Jaringan Otomatis',
      text: 'Kamu TIDAK perlu membuat jaringan secara manual. Compose otomatis membuat jaringan bernama <code>&lt;project&gt;_default</code>. Seluruh layanan dapat saling berkomunikasi melalui <b>nama layanan</b> tersebut.'
    },
    {
      type: 'warn',
      title: 'depends_on vs healthcheck',
      text: 'Perintah <code>depends_on</code> saja hanya menjamin urutan penyalaan, BUKAN menjamin database sudah benar-benar siap menerima koneksi. Tambahkan <code>healthcheck</code> beserta <code>condition</code> agar lebih andal.'
    },
    {
      type: 'vocab',
      items: [
        ['docker-compose.yml', 'File deklaratif yang mendefinisikan aplikasi multi-container.'],
        ['service', 'Definisi sebuah container dalam Compose, bisa dibuat dari build atau image.'],
        ['depends_on', 'Mengatur urutan penyalaan antar layanan.'],
        ['healthcheck', 'Pemeriksaan untuk memastikan sebuah layanan sudah siap (healthy).'],
        ['up', 'Membuat dan menjalankan seluruh stack.'],
        ['down', 'Menghentikan dan menghapus resource proyek (volume opsional).'],
        ['ps', 'Melihat status layanan dalam proyek.'],
        ['logs', 'Menampilkan log dari sebuah layanan.'],
        ['exec', 'Menjalankan perintah di layanan yang sedang berjalan.']
      ]
    }
  ],
  recap: [
    'Compose memungkinkan satu file <code>docker-compose.yml</code> mengendalikan banyak container sekaligus.',
    'Antar layanan saling berkomunikasi melalui <b>nama layanan</b> berkat jaringan otomatis.',
    'Gunakan <code>docker compose up -d</code> untuk menjalankan seluruh stack.',
    'Gunakan <code>docker compose down</code> untuk membersihkan; hindari <code>--volumes</code> bila data masih ingin dipertahankan.',
    'Selalu gunakan <code>depends_on</code> bersama <code>healthcheck</code> agar aplikasi menunggu database benar-benar siap.'
  ]
});