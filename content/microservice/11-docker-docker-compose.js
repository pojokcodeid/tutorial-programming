/* ============================================================
   Pelajaran Microservices — Bab 11: Docker & Docker Compose
   ============================================================ */
'use strict';

window.MICROSERVICE_LESSONS = window.MICROSERVICE_LESSONS || [];

window.MICROSERVICE_LESSONS.push({
  id: 'docker-docker-compose',
  title: 'Docker & Docker Compose: Menjalankan Seluruh Stack OMS',
  chapter: 'Infrastruktur & Observabilitas',
  duration: '12–14 menit',
  intro: [
    'Microservices berarti banyak proses: catalog-service, order-service, notification-service, dua PostgreSQL, satu RabbitMQ. Tanpa alat bantu, setiap developer harus memasang semuanya secara manual dengan versi yang berbeda-beda — dan kalimat "di mesin saya jalan" pun lahir. Docker menjawabnya dengan membungkus aplikasi beserta seluruh dependensinya menjadi <b>image</b> yang reproducible; Docker Compose menyatukan seluruh stack menjadi satu perintah.',
    'Bab ini membangun jalur dari kode Go menjadi kontainer produksi: Dockerfile multi-stage yang menghasilkan image kecil dan aman, .dockerignore agar cache build tidak rusak oleh file yang tidak perlu, kontainer non-root, jaringan dan volume bawaan Compose, sampai <code>compose.yaml</code> lengkap untuk OMS dengan healthcheck yang benar.',
    'Setelah bab ini, perintah <code>docker compose up -d --wait</code> akan menyalakan seluruh sistem — dua database, broker, dan tiga service Go — dalam keadaan siap melayani request, di mesin mana pun.'
  ],
  objectives: [
    'Membedakan image dengan container dan memilih perintah Docker yang tepat',
    'Menulis Dockerfile multi-stage untuk binary Go dengan CGO_ENABLED=0',
    'Menjalankan kontainer sebagai non-root user dan menjaga secret keluar dari image',
    'Memahami docker network, volume, dan environment variable sebagai cara konfigurasi',
    'Menulis compose.yaml dengan healthcheck dan depends_on condition service_healthy'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Image dan Container</h3><p><b>Image</b> adalah cetakan bersifat-snapshot: filesystem berlapis berisi binary Go, library sistem, dan metadata (perintah jalankan, port, variabel). Sifatnya immutable — image yang sudah dibangun tidak pernah berubah, sehingga image v1.4.2 yang kamu deploy hari ini identik byte demi byte dengan yang diuji minggu lalu.</p><p><b>Container</b> adalah image yang sedang berjalan: satu proses nyata dengan filesystem lapisan tulis di atasnya. Ribuan container bisa lahir dari satu image; menghapus container tidak menghapus image. Perintah yang lazim: <code>docker build</code> membuat image, <code>docker run</code> menjadikannya container, <code>docker ps</code> melihat yang berjalan, <code>docker compose logs</code> membaca log.</p><h3>Multi-Stage Build untuk Go</h3><p>Binary Go bisa dikompilasi statis dengan <code>CGO_ENABLED=0</code>, sehingga image akhir tidak memerlukan toolchain Go sama sekali. Pola multi-stage memisahkannya menjadi dua tahap: tahap build memakai image golang lengkap (ratusan MB), tahap runtime hanya menyalin hasil build ke image minim (puluhan MB).</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Dockerfile Multi-Stage catalog-service',
      lang: 'dockerfile',
      output: false,
      code: `# ---------- Tahap 1: build ----------
FROM golang:1.22-alpine AS build
WORKDIR /src

# Salin manifest dulu agar lapisan modul cache-nya stabil
# (perubahan kode tidak memicu go mod download ulang)
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build \\
    -trimpath -ldflags="-s -w" \\
    -o /out/catalog ./services/catalog/cmd/server

# ---------- Tahap 2: runtime ----------
FROM alpine:3.20
RUN addgroup -S oms && adduser -S oms -G oms
WORKDIR /app
COPY --from=build /out/catalog /app/catalog
USER oms:oms
EXPOSE 8081
ENTRYPOINT ["/app/catalog"]`,
      explain: [
        'Perintah <code>COPY go.mod go.sum</code> di atas <code>COPY . .</code> membuat lapisan <code>go mod download</code> hanya dijalankan ulang ketika dependensi berubah — memangkas waktu build dari menit ke detik.',
        '<code>CGO_ENABLED=0</code> menghasilkan binary statis yang bisa berjalan di image tanpa libc; <code>-trimpath -ldflags="-s -w"</code> membuang simbol debug dan path lokal, memperkecil binary sekaligus mencegah kebocoran struktur direktori developer.',
        '<code>USER oms:oms</code> menjalankan proses sebagai non-root: bila ada celah eksploitasi di aplikasi, penyerang tidak memperoleh hak root di dalam container.',
        'Alpine dipilih karena base image kecil (sekitar 10 MB) dan tetap memuat busybox wget yang dibutuhkan healthcheck. Alternatif lebih ketat: distroless static, dengan catatan tidak ada shell sama sekali di dalamnya.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh: .dockerignore — Jaga Cache Build dan Jaga Secret',
      lang: 'text',
      output: false,
      code: `.git
.github
docs/
deploy/
tests/
*.md
.env
secrets/
docker-compose*.yml
bin/`,
      explain: [
        'Tanpa .dockerignore, perintah <code>COPY . .</code> ikut menyalin folder .git (puluhan MB) dan file compose, merusak cache build setiap kali file tidak relevan berubah.',
        'Baris <code>.env</code> dan <code>secrets/</code> memastikan berkas berisi kredensial tidak pernah terkirim ke daemon Docker — apalagi ikut ter-commit ke registry sebagai bagian image.',
        'Prinsipnya: yang masuk ke image hanya yang dibutuhkan proses runtime. Semakin sedikit, semakin kecil image dan semakin kecil permukaan serangan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Network, Volume, dan Environment</h3><p>Docker Compose membuat satu <b>network</b> bernama proyek secara otomatis. Di dalamnya, setiap service punya hostname sekaligus nama service: order-service cukup mengakses <code>http://catalog:8081</code> — DNS internal Compose menyelesaikannya, tanpa perlu IP statis atau service discovery tambahan. Publikasi port ke mesin host (<code>ports:</code>) hanya dilakukan untuk keperluan debugging; komunikasi antar-service cukup lewat network internal.</p><p><b>Volume</b> menyimpan data yang harus bertahan setelah container dihapus — terutama data PostgreSQL. Tanpa volume, data database hidup di lapisan tulis container dan ikut lenyap saat <code>docker compose down</code>. <b>Environment variable</b> adalah cara konfigurasi utama: setiap service membaca <code>DATABASE_URL</code>, <code>HTTP_PORT</code>, dan <code>RABBITMQ_URL</code> dari environment, sehingga image yang sama bisa dipakai untuk dev, staging, dan produksi tanpa dibangun ulang.</p><h3>Healthcheck dan Urutan Startup</h3><p>Database butuh waktu beberapa detik untuk menerima koneksi, dan <code>depends_on</code> biasa hanya menunggu container <i>mulai</i>, bukan siap. Compose menyelesaikannya dengan <b>healthcheck</b>: perintah berkala di dalam container yang menandai status <code>healthy</code>. Kombinasi <code>depends_on: condition: service_healthy</code> membuat catalog-service baru mulai ketika catalog-db benar-benar siap menerima query — tanpa sleep kaku dan tanpa race condition saat startup.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: compose.yaml Lengkap untuk Order Management System',
      lang: 'yaml',
      output: false,
      code: `name: oms

services:
  catalog-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: catalog_db
      POSTGRES_USER: catalog
      POSTGRES_PASSWORD: catalog_dev_password
    volumes:
      - catalog-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U catalog -d catalog_db"]
      interval: 5s
      timeout: 5s
      retries: 10

  order-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: order_db
      POSTGRES_USER: order
      POSTGRES_PASSWORD: order_dev_password
    volumes:
      - order-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U order -d order_db"]
      interval: 5s
      timeout: 5s
      retries: 10

  rabbitmq:
    image: rabbitmq:3.13-management-alpine
    ports:
      - "15672:15672" # UI manajemen, hanya untuk pengembangan
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "-q", "ping"]
      interval: 10s
      timeout: 5s
      retries: 10

  catalog:
    build:
      context: .
      dockerfile: services/catalog/Dockerfile
    environment:
      HTTP_PORT: "8081"
      DATABASE_URL: postgres://catalog:catalog_dev_password@catalog-db:5432/catalog_db?sslmode=disable
    ports:
      - "8081:8081"
    depends_on:
      catalog-db:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:8081/readyz || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5

  order:
    build:
      context: .
      dockerfile: services/order/Dockerfile
    environment:
      HTTP_PORT: "8082"
      DATABASE_URL: postgres://order:order_dev_password@order-db:5432/order_db?sslmode=disable
      CATALOG_URL: http://catalog:8081
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672/
    ports:
      - "8082:8082"
    depends_on:
      order-db:
        condition: service_healthy
      catalog:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:8082/readyz || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5

  notification:
    build:
      context: .
      dockerfile: services/notification/Dockerfile
    environment:
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672/
    depends_on:
      rabbitmq:
        condition: service_healthy

volumes:
  catalog-data:
  order-data:
  rabbitmq-data:`,
      explain: [
        'Setiap service memakai database miliknya sendiri — catalog-db untuk products, order-db untuk orders — sesuai prinsip database-per-service. Tidak ada service yang menyentuh database service lain.',
        'URL antar-service memakai nama service sebagai hostname (<code>http://catalog:8081</code>, <code>@catalog-db:5432</code>) — semua diselesaikan DNS internal network Compose.',
        'Rantai depends_on menggambarkan urutan nyata: database dan broker harus healthy dulu, baru service Go yang membutuhkannya mulai; catalog harus siap sebelum order menerima trafik.',
        'Healthcheck pada service Go memakai <code>/readyz</code>, bukan <code>/healthz</code>: readiness memastikan koneksi database dan broker sudah terbentuk, sehingga compose --wait benar-benar berarti siap melayani.',
        'Nilai password di atas bersifat pengembangan. Untuk produksi, gunakan Docker secrets atau secret manager dan jangan pernah memakai akun guest RabbitMQ.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh: Perintah Harian Docker Compose',
      lang: 'bash',
      output: false,
      code: `# Naikkan seluruh stack di latar belakang; --wait sampai semua healthy
docker compose up -d --wait

# Periksa status: mana yang healthy, mana yang restarting
docker compose ps

# Ikuti log satu service (Ctrl+C tidak menghentikan container)
docker compose logs -f order --tail 100

# Bangun ulang setelah kode berubah lalu naikkan lagi
docker compose up -d --build order

# Bawa turun stack; -v menghapus volume — DATA IKUT HILANG
docker compose down`,
      explain: [
        'Kata kunci <code>compose</code> menyatukan perintah lama <code>docker-compose</code> (dengan strip) menjadi satu perintah bawaan Docker — gunakan bentuk baru ini.',
        '<code>--wait</code> menggantikan pola lama menunggu sambil membaca log: compose keluar dengan kode sukses hanya ketika seluruh kontainer sudah healthy.',
        'Setelah <code>docker compose down</code> tanpa <code>-v</code>, data di volume tetap ada dan bisa dipakai ulang saat stack dinaikkan kembali — inilah gunanya volume, bukan sekadar kebiasaan.'
      ]
    },
    {
      type: 'warn',
      title: 'Perhatian: Kredensial di compose.yaml Bukan untuk Produksi',
      text: 'Password <code>catalog_dev_password</code> dan akun guest RabbitMQ pada contoh di atas nyaman untuk pengembangan, tetapi jangan pernah dibawa ke produksi: compose.yaml hampir selalu ikut ter-commit ke Git. Untuk produksi, ganti dengan Docker secrets atau secret manager, matikan publikasi port manajemen (15672), dan gunakan user RabbitMQ khusus per service dengan permission minimal.'
    },
    {
      type: 'tip',
      title: 'Latihan: Nyalakan Seluruh OMS dengan Satu Perintah',
      text: 'Jalankan docker compose up -d --wait dari root repository, lalu buktikan stack benar-benar siap: buka http://localhost:8081/readyz dan http://localhost:8082/healthz, kirim POST /orders pertama, dan pastikan notification-service menerima event OrderCreated lewat docker compose logs notification. Terakhir, uji ketahanan data: matikan catalog-db dengan docker compose stop catalog-db, amati catalog-service gagal readiness, hidupkan lagi, dan pastikan data produk tetap utuh berkat volume.'
    },
    {
      type: 'vocab',
      items: [
        ['Image', 'Snapshot filesystem bersifat immutable berisi aplikasi dan dependensinya; bahan dasar container.'],
        ['Container', 'Instance image yang sedang berjalan; bisa ribuan dari satu image dan dihapus tanpa menghapus image.'],
        ['Multi-stage build', 'Pola Dockerfile dengan dua tahap build dan runtime agar image akhir hanya berisi hasil build.'],
        ['Docker network', 'Jaringan virtual Compose yang membuat service saling menjangkau lewat nama service sebagai hostname.'],
        ['Volume', 'Penyimpanan persisten di luar container; data database bertahan setelah container dihapus.'],
        ['Healthcheck', 'Perintah berkala di dalam container yang menandai status healthy atau unhealthy bagi orchestrator.'],
        ['service_healthy', 'Kondisi depends_on yang menahan service sampai dependensinya benar-benar siap melayani.']
      ]
    }
  ],
  recap: [
    'Image adalah snapshot immutable, container adalah instance yang berjalan; kompilasi Go statis dengan CGO_ENABLED=0 memungkinkan runtime image yang sangat ringan.',
    'Dockerfile multi-stage menyalin go.mod lebih dulu agar cache modul stabil, lalu menyalin binary ke Alpine dan menjalankannya sebagai user non-root.',
    '.dockerignore menjaga cache build dan mencegah .env beserta folder secrets ikut terkirim ke daemon Docker.',
    'compose.yaml OMS mendeklarasikan dua PostgreSQL, RabbitMQ, dan tiga service Go dengan healthcheck serta depends_on condition service_healthy untuk urutan startup yang benar.',
    'docker compose up -d --wait, ps, logs -f, dan down adalah perintah harian; -v menghapus volume dan data, jadi gunakan hanya saat memang ingin bersih-bersih.'
  ]
});
