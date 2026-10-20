# TokoKita — Contoh Fullstack Microservices

Proyek contoh nyata untuk materi tutorial **Contoh Fullstack Project Microservices**.
Satu aplikasi toko sederhana yang dibangun dari **tiga service Go**, **MariaDB**,
**Redis**, **RabbitMQ**, dan **frontend React + Ant Design** — semuanya berjalan
di container **Podman** dengan satu perintah.

## Fitur

- **3 microservice Go** dengan `net/http` standar (tanpa framework):
  - `product-service` (:8081) — CRUD produk + **cache Redis** (pola cache-aside)
  - `order-service` (:8082) — buat pesanan, validasi produk via HTTP, terbitkan event
  - `notification-service` (:8083) — konsumen event RabbitMQ + API notifikasi
- **MariaDB** dengan **database-per-service**: `product_db`, `order_db`, `notification_db`
- **Redis** sebagai cache katalog produk (TTL 30 detik + invalidasi saat tulis)
- **RabbitMQ** sebagai message broker: exchange topic `tokokita.events`,
  queue `notification.orders`, routing key `order.created`
- **Frontend React 19 + Ant Design** di balik nginx (proxy `/api` ke service Go)
- **Idempotency key** pada pesanan: request ulang tidak membuat data ganda
- **Konsumer tahan putus**: auto-ack manual, prefetch 10, dedup berbasis `event_id`

## Arsitektur

```
                         ┌──────────────────────────────┐
                         │  Browser (React + Ant Design)│
                         └──────────────┬───────────────┘
                                        │ HTTP
                         ┌──────────────▼───────────────┐
                         │  nginx (frontend container)  │
                         │  /  → file build React       │
                         │  /api/* → proxy ke service   │
                         └───┬──────────┬───────────┬───┘
                             │          │           │
              ┌──────────────▼──┐  ┌────▼────────┐  ┌▼──────────────────┐
              │ product-service │  │ order-service│  │ notification-svc  │
              │      :8081      │  │    :8082     │  │      :8083        │
              └───┬─────────┬───┘  └──┬───────┬──┘  └──┬────────────┬───┘
                  │         │         │       │        │            │
             MariaDB      Redis    MariaDB  RabbitMQ MariaDB     RabbitMQ
           product_db    (cache)   order_db  publish  notif_db    consume
```

Alur pesanan (rantai lengkap lintas service):

1. Frontend `POST /api/orders` → **order-service**.
2. order-service memvalidasi produk ke **product-service** (HTTP, timeout 2 dtk).
3. Pesanan disimpan ke `order_db` (dengan kunci idempotensi).
4. order-service menerbitkan event `order.created` ke exchange `tokokita.events`.
5. **notification-service** menerima event, menyimpan notifikasi ke `notification_db`.
6. Frontend melihat notifikasi baru lewat badge lonceng (polling tiap 5 detik).

## Struktur Proyek

```
fullstack-microservice/
├── compose.yaml                    # seluruh stack: 7 container
├── Dockerfile                      # build image Go (parameter SERVICE)
├── migrations/
│   ├── 001_product.sql             # product_db + user product_svc
│   ├── 002_order.sql               # order_db + user order_svc
│   └── 003_notification.sql        # notification_db + user notification_svc
├── services/
│   ├── product/
│   │   ├── cmd/main.go             # wiring + graceful shutdown
│   │   └── internal/
│   │       ├── store/              # akses MariaDB product_db
│   │       ├── cache/              # cache Redis (cache-aside)
│   │       └── httpapi/            # handler REST + validasi
│   ├── order/
│   │   ├── cmd/main.go
│   │   └── internal/
│   │       ├── store/              # akses MariaDB order_db + idempotensi
│   │       ├── publisher/          # penerbit event RabbitMQ
│   │       └── httpapi/            # handler + HTTP client ke product-service
│   └── notification/
│       ├── cmd/main.go
│       └── internal/
│           ├── store/              # akses MariaDB notification_db + dedup
│           ├── consumer/           # konsumer event (reconnect, ack manual)
│           └── httpapi/            # API notifikasi untuk frontend
└── frontend/
    ├── Dockerfile                  # build Vite → sajikan dengan nginx
    ├── nginx.conf                  # SPA + proxy /api ke tiga service
    ├── vite.config.js              # proxy untuk pengembangan lokal
    └── src/
        ├── main.jsx / App.jsx      # gerbang React + peta rute
        ├── api/                    # axios: productApi, orderApi, notificationApi
        ├── components/             # AppShell (sidebar + lonceng), PageHeader
        └── pages/                  # Dashboard, Products, Orders, Notifications
```

## Prasyarat

- **Podman** 4.7+ dengan `podman machine` sudah berjalan
- **Podman Compose**: `podman compose` (butuh `podman-compose` atau
  `docker-compose` sebagai provider), atau `podman-compose` klasik
  - macOS: `brew install podman-compose`
  - Linux: `pip3 install podman-compose`

## Cara Menjalankan (satu perintah)

```bash
cd examples/fullstack-microservice

# Bangun image & jalankan seluruh stack
podman compose up --build
# atau: podman-compose up --build

# Buka aplikasi
#   http://localhost:8080     → frontend TokoKita (React + Ant Design)
#   http://localhost:15672    → dashboard RabbitMQ (tokokita / tokokita-local)
#   http://localhost:8081/healthz → cek product-service
```

Pesan pertama kali akan lambat (MariaDB menyiapkan skema, RabbitMQ boot,
image Go dibangun). Tunggu sampai muncul log `product-service berjalan`,
`order-service berjalan`, dan `notification-service ... mendengarkan event`.

### Uji cepat dari terminal

```bash
# 1. Lihat produk (panggilan pertama MISS dari DB, kedua HIT dari Redis)
curl -i http://localhost:8081/products
curl -i http://localhost:8081/products        # perhatikan header X-Cache: HIT

# 2. Buat pesanan (header Idempotency-Key bisa dikirim ulang tanpa data ganda)
curl -s -X POST http://localhost:8082/orders \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: coba-123' \
  -d '{"product_id":1,"qty":2,"customer":"Budi"}'

# 3. Lihat notifikasi hasil event RabbitMQ
curl -s http://localhost:8083/notifications
```

## Menjalankan Mode Pengembangan (tanpa container untuk aplikasi)

Cocok saat mengubah kode Go/React berkali-kali tanpa rebuild image:

```bash
# terminal 1–3: infrastruktur saja
podman run -d --name tokokita-db -p 3306:3306 \
  -e MARIADB_ROOT_PASSWORD=root-local \
  -v "$PWD/migrations:/docker-entrypoint-initdb.d:ro" \
  docker.io/library/mariadb:11.4

podman run -d --name tokokita-redis -p 6379:6379 \
  docker.io/library/redis:7-alpine

podman run -d --name tokokita-mq -p 5672:5672 -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=tokokita -e RABBITMQ_DEFAULT_PASS=tokokita-local \
  docker.io/library/rabbitmq:3.13-management-alpine

# terminal 4–6: jalankan service Go langsung dari host
cd services/product   && go run ./cmd          # :8081
cd services/order     && go run ./cmd          # :8082
cd services/notification && go run ./cmd       # :8083

# terminal 7: frontend React dengan hot reload
cd frontend && npm install && npm run dev      # :5173 (proxy otomatis)
```

## Konfigurasi (variabel lingkungan)

| Service | Variabel | Bawaan |
| --- | --- | --- |
| product | `PORT`, `DB_DSN`, `REDIS_ADDR` | 8081, product_svc@..., localhost:6379 |
| order | `PORT`, `DB_DSN`, `CATALOG_URL`, `AMQP_URL` | 8082, order_svc@..., http://localhost:8081, amqp://... |
| notification | `PORT`, `DB_DSN`, `AMQP_URL` | 8083, notification_svc@..., amqp://... |

## Perintah Berguna

```bash
podman compose logs -f order-service     # log satu service
podman compose ps                        # daftar container sehat
podman compose down                      # hentikan (data tetap di volume)
podman compose down -v                   # hentikan + HAPUS data (fresh start)
podman exec -it <container-mariadb> mariadb -uroot -proot-local order_db
```

## Catatan Keamanan (untuk belajar, bukan produksi)

- Kata sandi database/broker ditulis di `compose.yaml` — produksi wajib memakai
  rahasia (secret) dan enkripsi at-rest.
- Tidak ada autentikasi di API: pelajaran JWT/RBAC ada di materi **Go REST API**
  dan **Contoh Project React JS** — silakan disambungkan sebagai latihan.
- `Idempotency-Key` di frontend memakai `crypto.randomUUID()`; di produksi,
  kunci biasanya dikaitkan dengan sesi pengguna.
- Konsumer memakai `Nack(requeue=false)` untuk pesan rusak agar tidak loop —
  produksi biasanya menambahkan dead-letter queue untuk peninjauan.
