/* ============================================================
   Pelajaran Contoh Fullstack Microservices — Bab 12: Containerisasi & Rilis
   ============================================================ */
'use strict';

window.FULLSTACK_LESSONS = window.FULLSTACK_LESSONS || [];

window.FULLSTACK_LESSONS.push({
  id: 'fs-containerisasi-rilis',
  title: 'Containerisasi & Rilis: Dari Kode ke Tujuh Container',
  chapter: 'Operasional',
  duration: '16 menit',
  intro: [
    'Bab terakhir menutup perjalanan dengan satu perintah. Selama sebelas bab kita membangun potongan demi potongan; sekarang semuanya dikemas menjadi dua berkas resep: <b>Dockerfile</b> yang mengubah kode menjadi image siap jalan, dan <b>compose.yaml</b> yang mendeklarasikan tujuh container lengkap dengan kesehatan, ketergantungan, jaringan, dan volume datanya.',
    'Ada dua keahlian yang dilatih di sini. Pertama, <b>multi-stage build</b> — image rilis tidak boleh membawa compiler maupun Node.js, hanya hasil akhir; ini mengecilkan image dari ratusan megabyte menjadi puluhan sekaligus memperkecil sasaran serangan. Kedua, <b>deklarasi ketergantungan</b> — service Go menunggu MariaDB benar-benar sehat (bukan sekadar "sudah dijalankan"), dan setiap komponen memeriksa kesehatannya sendiri.',
    'Di akhir bab seluruh stack bisa dihidupkan dengan satu perintah, diverifikasi dengan checklist singkat, dimatikan tanpa kehilangan data, dan dihidupkan lagi persis seperti semula — persis seperti yang dijanjikan sejak Gambar 1.1.'
  ],
  objectives: [
    'Menulis Dockerfile multi-stage untuk service Go (satu resep, tiga service lewat ARG) dan frontend React',
    'Mengoptimalkan lapisan build: modul diunduh lebih dulu, kode disalin belakangan, agar cache tidak terbuang',
    'Membaca dan menulis compose.yaml: image, build args, environment, depends_on sehat, port, dan volume',
    'Memahami arti healthcheck dan mengapa depends_on service_healthy mencegah perlombaan saat startup',
    'Menjalankan siklus operasional penuh: up, ps, logs, exec, restart, down, dan reset volume',
    'Menutup rilis dengan checklist verifikasi end-to-end yang bisa diulang kapan pun'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Dua Resep, Satu Perintah</h3><p>Containerisasi memisahkan dua hal yang sering tercampur: <b>bagaimana membangun</b> (Dockerfile — milik tiap aplikasi) dan <b>bagaimana mengoperasikan</b> (compose.yaml — milik keseluruhan stack). Ketiga service Go TokoKita memakai SATU Dockerfile yang dibedakan hanya oleh parameter <code>SERVICE</code> — tiga service, satu resep, tidak ada yang terduplikasi.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 245" width="760" role="img" aria-label="Skema multi-stage build: konteks build masuk ke tahap build berisi compiler, lalu hanya hasil build yang disalin ke tahap runtime yang ringan">
        <defs><marker id="mk-fs12-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs>
        <text x="380" y="30" class="u-lbl" text-anchor="middle">hanya hasil build yang berpindah — compiler dan Node.js tidak ikut rilis</text>
        <rect x="15" y="90" width="150" height="70" rx="8" class="u-box"/>
        <text x="90" y="118" class="u-title">context (repo)</text>
        <text x="90" y="140" class="u-lbl" text-anchor="middle">kode + Dockerfile</text>
        <line x1="165" y1="125" x2="196" y2="125" class="u-line" marker-end="url(#mk-fs12-1)"/>
        <rect x="200" y="70" width="220" height="110" rx="8" class="u-box"/>
        <text x="310" y="95" class="u-title">tahap build (AS build)</text>
        <text x="310" y="120" class="u-lbl" text-anchor="middle">golang:1.27-alpine — go build</text>
        <text x="310" y="142" class="u-lbl" text-anchor="middle">node:20-alpine — npm run build</text>
        <text x="310" y="164" class="u-lbl" text-anchor="middle">hidup hanya selama build</text>
        <line x1="420" y1="125" x2="451" y2="125" class="u-line" marker-end="url(#mk-fs12-1)"/>
        <text x="435" y="108" class="u-lbl" text-anchor="middle">COPY --from=build</text>
        <rect x="455" y="70" width="290" height="110" rx="8" class="u-hl"/>
        <text x="600" y="95" class="u-title">tahap runtime (image akhir)</text>
        <text x="600" y="120" class="u-lbl" text-anchor="middle">alpine:3.20 + biner Go (±20 MB)</text>
        <text x="600" y="142" class="u-lbl" text-anchor="middle">nginx:alpine + folder dist/</text>
        <text x="600" y="164" class="u-lbl" text-anchor="middle">USER app — bukan root</text>
        <text x="380" y="225" class="u-lbl" text-anchor="middle">manfaat: image kecil · patch lebih cepat · sasaran serangan menyusut</text>
        </svg></div><figcaption class="fig-cap"><b>Gambar 12.1</b> — Multi-stage build: peralatan berat berhenti di tahap build, hanya hasil karya yang dirilis</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Dockerfile Service Go: Satu Resep untuk Tiga Service</h3><p>Tahap pertama mengunduh modul lebih dulu <b>sebelum</b> menyalin kode — inilah rahasia build cepat: selama <code>go.mod</code>/<code>go.sum</code> tidak berubah, lapisan pengunduhan modul tetap terpakai dari cache dan build ulang hanya menjalankan kompilasi. Bila kode disalin duluan, setiap perubahan satu baris kode akan membuang cache modul dan mengunduh ulang semuanya.</p>'
    },
    {
      type: 'example',
      title: 'Dockerfile bersama ketiga service',
      lang: 'dockerfile',
      output: false,
      code: `FROM docker.io/library/golang:1.27-alpine AS build

# Parameter nama service: product | order | notification
ARG SERVICE

WORKDIR /src

# Salin berkas modul dulu agar lapisan cache tetap terpakai
# selama go.sum tidak berubah (build ulang jadi jauh lebih cepat).
COPY go.mod go.sum ./
RUN go mod download

COPY services/ services/

RUN CGO_ENABLED=0 GOOS=linux go build -trimpath \\
    -ldflags="-s -w" \\
    -o /out/app ./services/\${SERVICE}/cmd

# ---------- tahap runtime ----------
FROM docker.io/library/alpine:3.20

RUN apk add --no-cache ca-certificates tzdata \\
    && adduser -D -u 10001 app

USER app
COPY --from=build /out/app /usr/local/bin/app

ENTRYPOINT ["/usr/local/bin/app"]`,
      explain: [
        '<code>CGO_ENABLED=0</code> menghasilkan biner statis — biner berjalan di image alpine tanpa pustaka C apa pun, dan <code>-ldflags="-s -w"</code> membuang tabel simbol debugger sehingga ukuran mengecil tanpa memengaruhi fungsi.',
        '<code>adduser -D -u 10001 app</code> lalu <code>USER app</code>: proses berjalan sebagai non-root dengan UID tetap — meski ada kelemahan di aplikasi, penyerah tidak memulai dari kepemilikan root.',
        'Compose memakai resep ini tiga kali lewat <code>args: { SERVICE: product }</code> — lapisan cache modul juga dipakai bersama karena konteks build dan go.sum-nya sama.',
        '<code>ca-certificates</code> ikut disalin karena order-service perlu memercayai sertifikat TLS ketika katalog dipindahkan ke HTTPS; <code>tzdata</code> menyiapkan zona waktu untuk TIMESTAMP database.'
      ]
    },
    {
      type: 'example',
      title: 'Dockerfile frontend: build di Node, saji di nginx',
      lang: 'dockerfile',
      output: false,
      code: `FROM docker.io/library/node:20-alpine AS build

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install          # lapisan cache: hanya berubah bila kunci berubah
COPY . .
RUN npm run build        # menghasilkan folder dist/

# ---------- runtime: nginx ----------
FROM docker.io/library/nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80`,
      explain: [
        'Pola yang sama dengan Go: alat berat (Node.js + node_modules ratusan MB) berhenti di tahap build; yang dirilis hanyalah nginx + file statis hasil Vite.',
        '<code>nginx.conf</code> disalin terpisah dan sebelum folder dist — konfigurasi proxy jarang berubah, kode frontend sering; urutan ini menjaga cache lapisan konfigurasi tetap utuh.',
        'Di runtime tidak ada proses Node.js sama sekali — frontend produksi murni file statis, sehingga keausan JavaScript di server tidak pernah menjadi faktor.'
      ]
    },
    {
      type: 'text',
      html: '<h3>compose.yaml: Bagan Ketergantungan yang Sehat</h3><p>Berkas compose menyatakan bukan hanya "siapa berjalan", tetapi <b>dalam kondisi apa ia boleh mulai</b>. Tiga prinsip yang dipakai TokoKita: (1) setiap komponen data menyatakan <code>healthcheck</code>-nya sendiri — bukan sekadar proses hidup, melainkan benar-benar siap melayani; (2) service Go memakai <code>depends_on</code> dengan <code>condition: service_healthy</code> agar tidak menabrak database yang sedang menginisialisasi; (3) konfigurasi (DSN, alamat broker) disuntikkan lewat <code>environment</code> — resep yang sama berjalan di mesin mana pun tanpa mengedit kode.</p>'
    },
    {
      type: 'example',
      title: 'Potongan compose yang paling banyak mengajari',
      lang: 'yaml',
      output: false,
      code: `name: tokokita

services:
  mariadb:
    image: docker.io/library/mariadb:11.4
    environment:
      MARIADB_ROOT_PASSWORD: root-local
    volumes:
      - db-data:/var/lib/mysql
      # Skema & pengguna per service dijalankan otomatis saat boot pertama
      - ./migrations:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 12

  rabbitmq:
    image: docker.io/library/rabbitmq:3.13-management-alpine
    # Non-root: healthcheck ikut sebagai root dapat membuat .erlang.cookie
    # milik root lebih dulu sehingga broker gagal membacanya (EACCES).
    user: rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: tokokita
      RABBITMQ_DEFAULT_PASS: tokokita-local

  product-service:
    build:
      context: .
      dockerfile: Dockerfile
      args: { SERVICE: product }
    environment:
      PORT: "8081"
      DB_DSN: "product_svc:product-local@tcp(mariadb:3306)/product_db?parseTime=true&charset=utf8mb4"
      REDIS_ADDR: "redis:6379"
    depends_on:
      mariadb: { condition: service_healthy }
      redis: { condition: service_healthy }

  frontend:
    build: { context: ./frontend }
    ports:
      - "8080:80"   # host non-root hanya boleh port >=1024; container tetap :80

volumes:
  db-data:
  redis-data:
  mq-data:`,
      explain: [
        'Bind mount <code>./migrations</code> ke <code>/docker-entrypoint-initdb.d</code> membuat MariaDB menjalankan ketiga berkas SQL otomatis pada volume KOSONG — skema tidak pernah diketik manual maupun lupa.',
        '<code>user: rabbitmq</code> bukan sentuhan kosmetik: healthcheck yang berjalan sebagai root bisa membuat <code>.erlang.cookie</code> milik root lebih dulu, dan proses broker lalu menolak membacanya (EACCES) — mengganti seluruh proses menjadi non-root membuat kepemilikan konsisten sejak awal.',
        'Port <code>8080:80</code> adalah penyesuaian rootless: podman tanpa root tidak boleh membuka port host di bawah 1024, tetapi container tetap bebas memakai :80 di jaringannya sendiri.',
        'Nama-nama service menjadi nama host di dalam jaringan compose: <code>tcp(mariadb:3306)</code> dan <code>http://product-service:8081</code> langsung teresolusi — itulah mengapa tidak ada satu pun IP yang tertulis di mana pun.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Peta Tujuh Container dan Urutan Sehatnya</h3><p>Saat <code>up -d</code> dijalankan, compose membaca ketergantungan lalu menyalakan komponen data terlebih dahulu: MariaDB, Redis, dan RabbitMQ diperiksa healthcheck-nya, baru ketiga service Go menyusul, dan frontend terakhir. Bila sebuah healthcheck tidak pernah hijau, dependennya memang sengaja TIDAK dijalankan — lebih baik stack setengah jalan dengan pesan jelas daripada semuanya berjalan dalam keadaan rusak diam-diam.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 335" width="760" role="img" aria-label="Peta tujuh container compose: frontend di atas, tiga service Go di tengah, MariaDB, Redis, dan RabbitMQ di bawah dengan garis ketergantungan">
        <defs><marker id="mk-fs12-2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs>
        <rect x="280" y="15" width="200" height="50" rx="8" class="u-hd"/>
        <text x="380" y="37" class="u-title">frontend (nginx) :8080</text>
        <text x="380" y="56" class="u-lbl" text-anchor="middle">proxy /api/* → tiga service</text>
        <line x1="140" y1="65" x2="140" y2="96" class="u-line" marker-end="url(#mk-fs12-2)"/>
        <line x1="380" y1="65" x2="380" y2="96" class="u-line" marker-end="url(#mk-fs12-2)"/>
        <line x1="620" y1="65" x2="620" y2="96" class="u-line" marker-end="url(#mk-fs12-2)"/>
        <rect x="40" y="100" width="200" height="52" rx="8" class="u-box"/>
        <text x="140" y="122" class="u-title">product-service :8081</text>
        <text x="140" y="141" class="u-lbl" text-anchor="middle">katalog + cache</text>
        <rect x="280" y="100" width="200" height="52" rx="8" class="u-box"/>
        <text x="380" y="122" class="u-title">order-service :8082</text>
        <text x="380" y="141" class="u-lbl" text-anchor="middle">HTTP + penerbit event</text>
        <rect x="520" y="100" width="200" height="52" rx="8" class="u-box"/>
        <text x="620" y="122" class="u-title">notification-service :8083</text>
        <text x="620" y="141" class="u-lbl" text-anchor="middle">konsumer + API notifikasi</text>
        <line x1="130" y1="152" x2="130" y2="246" class="u-line" marker-end="url(#mk-fs12-2)"/>
        <text x="142" y="200" class="u-lbl">cache-aside</text>
        <line x1="180" y1="152" x2="330" y2="246" class="u-line" marker-end="url(#mk-fs12-2)"/>
        <line x1="380" y1="152" x2="380" y2="246" class="u-line" marker-end="url(#mk-fs12-2)"/>
        <line x1="430" y1="152" x2="590" y2="246" class="u-line" marker-end="url(#mk-fs12-2)"/>
        <line x1="600" y1="152" x2="450" y2="246" class="u-line" marker-end="url(#mk-fs12-2)"/>
        <line x1="660" y1="152" x2="680" y2="246" class="u-line" marker-end="url(#mk-fs12-2)"/>
        <text x="692" y="200" class="u-lbl">consumer</text>
        <rect x="30" y="250" width="200" height="56" rx="8" class="u-hl"/>
        <text x="130" y="274" class="u-title">Redis :6379</text>
        <text x="130" y="294" class="u-lbl" text-anchor="middle">cache product-service</text>
        <rect x="280" y="250" width="200" height="56" rx="8" class="u-hl"/>
        <text x="380" y="274" class="u-title">MariaDB :3306 (healthy)</text>
        <text x="380" y="294" class="u-lbl" text-anchor="middle">product_db · order_db · notification_db</text>
        <rect x="530" y="250" width="215" height="56" rx="8" class="u-hl"/>
        <text x="637" y="274" class="u-title">RabbitMQ :5672 (healthy)</text>
        <text x="637" y="294" class="u-lbl" text-anchor="middle">exchange + queue · dashboard :15672</text>
        <text x="380" y="328" class="u-lbl" text-anchor="middle">depends_on service_healthy: komponen data sehat dulu, baru service Go, lalu frontend</text>
        </svg></div><figcaption class="fig-cap"><b>Gambar 12.2</b> — Peta tujuh container TokoKita dan jalur komunikasinya di dalam jaringan compose</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Siklus operasional sehari-hari',
      lang: 'bash',
      output: false,
      code: `cd examples/fullstack-microservice

# Hidupkan seluruh stack (bangun image bila kode berubah)
podman-compose up -d --build

# Periksa: tujuh container, tiga di antaranya sehat
podman ps --format '{{.Names}}\\t{{.Status}}'

# Amati log satu service (berhenti dengan Ctrl+C; container tetap jalan)
podman logs -f tokokita_order-service_1

# Masuk ke dalam container yang sedang berjalan (misal untuk pemeriksaan)
podman exec -it tokokita_mariadb_1 mysql -uroot -proot-local order_db

# Hidupkan ulang SATU service setelah memperbaruinya
podman-compose up -d --build order-service

# Matikan seluruh stack TANPA menghapus data (volume tetap ada)
podman-compose down

# Matikan sekaligus menghapus data: SEMUA PESANAN, PRODUK & NOTIFIKASI HILANG
podman-compose down -v        # gunakan hanya bila ingin mulai dari nol`,
      explain: [
        '<code>down</code> biasa aman untuk sehari-hari: container dan jaringan dibuang, tetapi volume <code>db-data</code>, <code>redis-data</code>, dan <code>mq-data</code> bertahan — data pesanan nyata tidak ikut hilang karena kamu mematikan server.',
        '<code>exec ... mysql</code> membuka sesi SQL langsung di database — pemeriksaan tercepat saat ada yang janggal dengan isi tabel, tanpa memasang klien SQL di komputer sendiri.',
        'Memperbarui satu service cukup <code>up -d --build SERVICE</code>; compose membuang container lama dan menyusun ulang hanya yang terpengaruh — dependensi turunannya tetap jalan.'
      ]
    },
    {
      type: 'example',
      title: 'Checklist verifikasi rilis',
      lang: 'bash',
      output: false,
      code: `#1) Tujuh container hidup; mariadb, redis, rabbitmq "(healthy)"
podman ps --format '{{.Names}}\\t{{.Status}}' | grep tokokita

#2) Healthcheck tiap service Go
curl -s localhost:8081/healthz && echo
curl -s localhost:8082/healthz && echo
curl -s localhost:8083/healthz && echo

#3) Cache bekerja: MISS lalu HIT
curl -si localhost:8081/products | grep X-Cache
curl -si localhost:8081/products | grep X-Cache

#4) Pesanan + idempotensi + aliran event → notifikasi
curl -s -X POST localhost:8082/orders \\
  -H 'Content-Type: application/json' \\
  -H 'Idempotency-Key: rilis-1' \\
  -d '{"product_id":1,"qty":2,"customer":"Uji Rilis"}' && echo
sleep 2
curl -si localhost:8083/notifications | grep -i x-unread

#5) Frontend menyalakan aplikasi dan meneruskan API
curl -s localhost:8080/ | grep -o '<title>[^<]*</title>'
curl -si localhost:8080/api/products | grep HTTP`,
      explain: [
        'Checklist berlapis: bila langkah 1 gagal, masalahnya di orkestrasi; langkah 2 gagal → koneksi/database; langkah 3 → cache; langkah 4 → broker/konsumen; langkah 5 → proxy/frontend. diagnosis bergerak dari luar ke dalam tanpa menebak.',
        'Sleep dua detik di langkah 4 bukan sihir — itu memberi waktu konsumer memproses event; bila notifikasi belum datang setelahnya, buka dashboard RabbitMQ :15672 dan periksa apakah pesan berada di queue (Ready) atau hilang dari tangan (Unacked).',
        'Seluruh checklist juga bisa dijalankan lewat <code>localhost:8080/api/*</code> — jalur produksi yang sebenarnya — sehingga pengujian ikut memvalidasi nginx, bukan hanya service secara langsung.'
      ]
    },
    {
      type: 'tip',
      title: '.dockerignore: Menjaga Konteks Build Bersih',
      text: 'Folder <code>frontend/node_modules</code> berisi puluhan ribu berkas dan folder <code>dist/</code> adalah hasil build lama — keduanya tidak boleh ikut menjadi konteks build (menghapus file konteks juga menghanguskan cache). Berkas <code>.dockerignore</code> di folder induk dan folder frontend menyingkirkan <code>node_modules</code>, <code>dist</code>, <code>.git</code>, serta sampah macOS (<code>._*</code>, <code>.DS_Store</code>) yang bisa membuat build gagal di volume eksternal. Aturan praktisnya: konteks build = berkas yang benar-benar dibutuhkan Dockerfile.'
    },
    {
      type: 'warn',
      title: 'Volume Berisi Data Nyata',
      text: 'Tiga volume bernama (<code>db-data</code>, <code>redis-data</code>, <code>mq-data</code>) adalah satu-satunya tempat data bertahan antar-penyalakan. <code>down</code> biasa tidak menyentuhnya; <code>down -v</code> menghapusnya SELAMANYA termasuk pesanan dan produk yang sudah terlanjur dibuat. Pada lingkungan belajar hal ini ringan (buat ulang dari migrasi), tetapi kebiasaan membaca perintah sebelum menekan enter adalah kebiasaan yang harus terbawa sampai ke server produksi sungguhan.'
    },
    {
      type: 'vocab',
      items: [
        ['Dockerfile', 'Resep pembuatan image: instruksi berurutan FROM/COPY/RUN yang diubah mesin build menjadi lapisan-lapisan image.'],
        ['Multi-stage build', 'Dockerfile dengan dua tahap (AS build) — alat berat hanya untuk membangun; image akhir hanya menerima hasil build lewat COPY --from.'],
        ['Build context', 'Folder yang dikirim ke mesin build sebagai dasar instruksi COPY; semakin kecil dan bersih, semakin cepat dan aman build.'],
        ['Lapisan (layer) cache', 'Setiap instruksi menghasilkan lapisan yang disimpan; instruksi berikutnya memakai ulang lapisan lama selama tidak ada perubahan — kuncinya: perintah yang mahal (download) didahulukan.'],
        ['ARG', 'Parameter build yang nilainya dipilih saat build (SERVICE=product) — memungkinkan satu Dockerfile melayani banyak service.'],
        ['Healthcheck', 'Pemeriksaan berkala yang menentukan sehat-tidaknya container (bukan sekadar proses hidup); di TokoKita dipakai healthcheck.sh, redis-cli ping, dan rabbitmq-diagnostics.'],
        ['depends_on bersyarat', 'Ketergantungan compose dengan condition (service_healthy / service_started) — menunda service sampai prasyaratnya benar-benar siap.'],
        ['Named volume', 'Tempat penyimpanan bernama yang dikelola engine (db-data, mq-data) — data bertahan walau container dibuang dan dibuat ulang.'],
        ['Rootless container', 'Container yang seluruh prosesnya berjalan di bawah akun bukan-root; di macOS/Linux hal ini membatasi port host ke >=1024 (alasan frontend memakai :8080).'],
        ['.dockerignore', 'Berkas pengecualian konteks build — menyingkirkan node_modules, dist, .git, dan sampah agar build cepat, bersih, dan terprediksi.']
      ]
    }
  ],
  recap: [
    'Ketiga service Go memakai satu Dockerfile multi-stage yang dibedakan ARG SERVICE; frontend memakai Dockerfile serupa (Node build → nginx saji).',
    'Kunci build cepat: modul/dependensi diunduh SEBELUM kode disalin agar lapisan cache tidak terbuang tiap perubahan kode.',
    'compose.yaml mendeklarasikan tujuh container: healthcheck di komponen data, depends_on service_healthy di service Go, environment untuk seluruh konfigurasi.',
    'Pelajaran nyata dari proyek: user non-root pada RabbitMQ (kepemilikan cookie konsisten) dan port frontend 8080 (batasan rootless) — dua penyesuaian kecil yang menentukan stack benar-benar hidup.',
    'Siklus operasional: up -d --build, ps/logs/exec, restart per service, down tanpa -v untuk keseharian, down -v hanya untuk memulai dari nol — ditutup checklist verifikasi lima lapis.'
  ]
});
