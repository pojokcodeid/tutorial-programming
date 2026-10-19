# Roadmap Belajar Microservices dengan Go (Golang)

## Tujuan

Mampu membangun sistem microservices dari nol menggunakan Go, PostgreSQL, Docker, message broker, Grafana, OpenTelemetry, CI/CD, dan Kubernetes.

**Durasi:** 16–20 minggu  
**Waktu belajar:** 6–8 jam per minggu  
**Metode:** 30% teori, 70% praktik.

---

## Tahap 0 — Fondasi Backend

**Durasi:** 1 minggu

### Materi

- [ ] Konsep client-server dan arsitektur backend.
- [ ] HTTP/HTTPS, DNS, TCP, TLS.
- [ ] HTTP methods dan status codes.
- [ ] REST API dan JSON.
- [ ] Authentication dan authorization.
- [ ] SQL, database, transaksi, dan indeks.
- [ ] Git, terminal, Linux, dan environment variables.
- [ ] Perbedaan monolith, modular monolith, dan microservices.

### Praktik

- [ ] Buat dokumentasi REST API sederhana.
- [ ] Panggil API menggunakan `curl`.
- [ ] Buat diagram client → API → database.
- [ ] Jelaskan kelebihan dan kekurangan microservices.

### Referensi

- https://developer.mozilla.org/en-US/docs/Web/HTTP
- https://12factor.net/

---

## Tahap 1 — Belajar Go dari Dasar

**Durasi:** 2 minggu

### Materi

- [ ] Instalasi Go dan `go version`.
- [ ] `go mod init`, package, dan import.
- [ ] Variabel, konstanta, tipe data, dan operator.
- [ ] Function dan multiple return values.
- [ ] Struct, method, pointer, dan interface.
- [ ] Array, slice, map, dan loop.
- [ ] Error handling dan error wrapping.
- [ ] JSON encoding dan decoding.
- [ ] File I/O dan environment variables.
- [ ] Goroutine dan channel.
- [ ] Mutex dan `sync.WaitGroup`.
- [ ] `context.Context`, cancellation, dan timeout.
- [ ] Unit testing menggunakan `testing`.
- [ ] Formatting dengan `gofmt`.

### Praktik

- [ ] Buat aplikasi CLI untuk membaca konfigurasi.
- [ ] Buat program CRUD sederhana berbasis memori.
- [ ] Buat worker pool menggunakan goroutine.
- [ ] Buat unit test untuk fungsi validasi.
- [ ] Jalankan `go test ./...` dan `go vet ./...`.

### Referensi

- https://go.dev/tour/
- https://go.dev/doc/
- https://go.dev/doc/effective_go

### Kriteria kelulusan

Mampu menulis program Go, menangani error, menggunakan concurrency dasar, dan menulis unit test.

---

## Tahap 2 — REST API dengan Go

**Durasi:** 1 minggu

### Materi

- [ ] `net/http`.
- [ ] HTTP handler dan router.
- [ ] Request, response, header, dan status code.
- [ ] JSON request dan response.
- [ ] Input validation.
- [ ] Middleware.
- [ ] Structured logging.
- [ ] Request ID.
- [ ] Graceful shutdown.
- [ ] Server timeout.
- [ ] Health check.
- [ ] OpenAPI documentation.

### Praktik

Buat `catalog-service` dengan endpoint:

| Method | Endpoint         | Fungsi          |
| ------ | ---------------- | --------------- |
| GET    | `/healthz`       | Health check    |
| GET    | `/products`      | Daftar produk   |
| GET    | `/products/{id}` | Detail produk   |
| POST   | `/products`      | Tambah produk   |
| PUT    | `/products/{id}` | Perbarui produk |
| DELETE | `/products/{id}` | Hapus produk    |

### Kriteria kelulusan

API berjalan, input tervalidasi, error konsisten, dan server dapat dihentikan dengan aman.

---

## Tahap 3 — Database dengan Go

**Durasi:** 1 minggu

### Materi

- [ ] PostgreSQL.
- [ ] SQL CRUD dan JOIN.
- [ ] Index dan constraint.
- [ ] `database/sql`.
- [ ] Database connection pooling.
- [ ] Parameterized queries.
- [ ] Transaction commit dan rollback.
- [ ] Schema migration.
- [ ] Repository pattern secara proporsional.
- [ ] Query timeout.
- [ ] Pagination.
- [ ] Unique constraint dan idempotency dasar.

### Praktik

- [ ] Hubungkan `catalog-service` ke PostgreSQL.
- [ ] Buat tabel produk.
- [ ] Buat migration.
- [ ] Implementasikan repository.
- [ ] Tangani record yang tidak ditemukan.
- [ ] Buat integration test.

### Kriteria kelulusan

Service mampu mengelola data secara aman dan dapat diuji.

---

## Tahap 4 — Clean Architecture dan Modular Monolith

**Durasi:** 1 minggu

### Materi

- [ ] Separation of concerns.
- [ ] Handler, use case, dan repository.
- [ ] Domain model.
- [ ] Dependency direction.
- [ ] Dependency injection.
- [ ] Interface kecil dan idiomatis di Go.
- [ ] Domain-Driven Design dasar.
- [ ] Bounded context.
- [ ] Business rules.
- [ ] Unit testing tanpa database.

### Praktik

Bangun modular monolith dengan modul:

- `catalog`
- `orders`
- `customers`

Pastikan masing-masing modul mempunyai tanggung jawab yang jelas.

### Kriteria kelulusan

Mampu memisahkan business logic dari transport layer dan database.

---

## Tahap 5 — Konsep Microservices

**Durasi:** 1 minggu

### Materi

- [ ] Service boundary.
- [ ] Bounded context.
- [ ] Database per service.
- [ ] API contract.
- [ ] Sinkron vs asinkron.
- [ ] Service discovery.
- [ ] API gateway.
- [ ] Distributed system dan partial failure.
- [ ] Distributed monolith.
- [ ] Independent deployment.
- [ ] Backward-compatible API changes.
- [ ] Architectural Decision Records (ADR).

### Praktik

Rancang sistem pemesanan:

1. `catalog-service`: katalog produk.
2. `order-service`: pemesanan.
3. `notification-service`: notifikasi.

Buat diagram arsitektur dan tentukan pemilik data setiap service.

### Kriteria kelulusan

Mampu menjelaskan mengapa service dipisahkan dan bagaimana service berkomunikasi.

---

## Tahap 6 — Komunikasi Antar-Service

**Durasi:** 1 minggu

### Materi

- [ ] HTTP client di Go.
- [ ] REST API antar-service.
- [ ] Timeout dan deadline.
- [ ] Context propagation.
- [ ] Retry dengan exponential backoff.
- [ ] Jitter dan retry storm.
- [ ] Circuit breaker.
- [ ] Idempotency.
- [ ] gRPC dan Protocol Buffers.
- [ ] Contract testing.
- [ ] Request ID propagation.

### Praktik

- [ ] `order-service` memanggil `catalog-service`.
- [ ] Validasi produk sebelum membuat pesanan.
- [ ] Tambahkan timeout.
- [ ] Simulasikan service downstream tidak tersedia.
- [ ] Tangani HTTP 4xx dan 5xx.
- [ ] Uji request duplikat.

### Kriteria kelulusan

Kegagalan service lain tidak membuat request menggantung tanpa batas.

---

## Tahap 7 — Distributed Transactions dan Reliability

**Durasi:** 2 minggu

### Materi

- [ ] Eventual consistency.
- [ ] Saga pattern.
- [ ] Compensating transaction.
- [ ] Transactional outbox.
- [ ] Inbox dan deduplication.
- [ ] At-least-once delivery.
- [ ] Idempotent operation.
- [ ] Rate limiting.
- [ ] Backpressure.
- [ ] Cache dan invalidation.
- [ ] Failure recovery.
- [ ] Timeout budget end-to-end.

### Praktik

Implementasikan alur order:

1. Buat order dengan status `pending`.
2. Validasi ketersediaan produk.
3. Konfirmasi order.
4. Jika gagal, lakukan kompensasi dan tandai order sebagai `cancelled`.
5. Pastikan pengiriman request berulang tidak membuat order duplikat.

### Kriteria kelulusan

Mampu menjelaskan bagaimana data tetap konsisten ketika satu service gagal.

---

## Tahap 8 — Security

**Durasi:** 1 minggu

### Materi

- [ ] HTTPS dan TLS.
- [ ] Authentication vs authorization.
- [ ] JWT.
- [ ] OAuth 2.0 dan OpenID Connect.
- [ ] Role-based access control.
- [ ] Service-to-service authentication.
- [ ] Secret management.
- [ ] SQL injection prevention.
- [ ] Rate limiting.
- [ ] Request size limits.
- [ ] Audit logging.
- [ ] Dependency vulnerability scanning.

### Praktik

- [ ] Tambahkan autentikasi pada API.
- [ ] Validasi expiry dan signature JWT.
- [ ] Batasi akses berdasarkan role.
- [ ] Simpan secret di environment atau secret manager.
- [ ] Pastikan token tidak masuk ke log.

### Kriteria kelulusan

Setiap endpoint mempunyai kebijakan akses yang jelas dan secret tidak tersimpan di source code.

---

## Tahap 9 — Testing

**Durasi:** 1 minggu

### Materi

- [ ] Unit testing.
- [ ] Table-driven tests.
- [ ] `net/http/httptest`.
- [ ] Integration testing.
- [ ] Contract testing.
- [ ] End-to-end testing.
- [ ] Race detector.
- [ ] Fuzz testing.
- [ ] Dependency mocking secara selektif.
- [ ] Static analysis.
- [ ] Test timeout dan retry.

### Praktik

- [ ] Test happy path.
- [ ] Test invalid input.
- [ ] Test database error.
- [ ] Test downstream service failure.
- [ ] Jalankan `go test -race ./...`.
- [ ] Jalankan `go vet ./...`.

### Kriteria kelulusan

Alur bisnis utama memiliki test otomatis dan kegagalan dependency dapat disimulasikan.

---

## Tahap 10 — Docker dan Docker Compose

**Durasi:** 1 minggu

### Materi

- [ ] Dockerfile.
- [ ] Multi-stage build untuk Go.
- [ ] Docker image dan container.
- [ ] Docker network.
- [ ] Volume.
- [ ] Environment configuration.
- [ ] Docker Compose.
- [ ] Health check.
- [ ] Non-root container.
- [ ] Persistent database.
- [ ] Startup readiness.

### Praktik

Jalankan stack berikut dengan Docker Compose:

- `catalog-service`
- `order-service`
- PostgreSQL untuk setiap service
- `notification-service` jika sudah dibutuhkan

### Kriteria kelulusan

Seluruh stack dapat dijalankan secara konsisten dengan satu perintah dan konfigurasi yang terdokumentasi.

---

## Tahap 11 — Observability dengan Grafana

**Durasi:** 1–2 minggu

### Materi

- [ ] Structured logging.
- [ ] Request ID dan trace ID.
- [ ] Metrics.
- [ ] Prometheus.
- [ ] Grafana dashboards.
- [ ] OpenTelemetry.
- [ ] Distributed tracing.
- [ ] Trace context propagation.
- [ ] RED method.
- [ ] USE method.
- [ ] Alerting.
- [ ] SLO dan error budget.
- [ ] Cardinality pada metrics.

### Praktik

- [ ] Instrumentasikan endpoint Go.
- [ ] Tampilkan request rate.
- [ ] Tampilkan error rate.
- [ ] Tampilkan p95 latency.
- [ ] Buat distributed trace dari `order-service` ke `catalog-service`.
- [ ] Simulasikan latency tinggi dan cari penyebabnya.

### Kriteria kelulusan

Mampu menelusuri request lintas service dan menemukan sumber masalah menggunakan logs, metrics, dan traces.

---

## Tahap 12 — CI/CD

**Durasi:** 1–2 minggu

### Materi

- [ ] Git branching dan pull request.
- [ ] Automated formatting dan linting.
- [ ] Automated testing.
- [ ] Build Go binary.
- [ ] Build dan publish Docker image.
- [ ] Container registry.
- [ ] Secret management pada pipeline.
- [ ] Deployment ke dev/staging.
- [ ] Smoke test setelah deployment.
- [ ] Rolling deployment.
- [ ] Rollback.
- [ ] Database migration yang kompatibel.

### Praktik

Buat pipeline yang:

1. Memeriksa format dan kualitas kode.
2. Menjalankan unit test.
3. Membangun Docker image.
4. Menerbitkan image dengan tag versi.
5. Melakukan deployment ke lingkungan dev.
6. Menjalankan smoke test.

### Kriteria kelulusan

Perubahan dapat diuji dan dirilis secara otomatis serta memiliki prosedur rollback.

---

## Tahap 13 — Message Broker

**Durasi:** 1 minggu

### Materi

- [ ] Queue dan pub/sub.
- [ ] Event vs command.
- [ ] Producer dan consumer.
- [ ] RabbitMQ atau Kafka.
- [ ] Acknowledgment.
- [ ] Retry dan dead-letter queue.
- [ ] At-least-once delivery.
- [ ] Duplicate event handling.
- [ ] Event versioning.
- [ ] Transactional outbox.
- [ ] Idempotent consumer.

### Praktik

- [ ] `order-service` menerbitkan event `OrderCreated`.
- [ ] `notification-service` mengonsumsi event.
- [ ] Simulasikan consumer mati.
- [ ] Uji event duplikat.
- [ ] Tangani pesan yang gagal diproses.

### Kriteria kelulusan

Mampu membangun komunikasi asinkron dan menangani pesan gagal atau terkirim lebih dari sekali.

---

## Tahap 14 — Kubernetes

**Durasi:** 1–2 minggu

### Materi

- [ ] Cluster, node, dan pod.
- [ ] Deployment dan Service.
- [ ] Namespace.
- [ ] ConfigMap dan Secret.
- [ ] Readiness dan liveness probes.
- [ ] Resource requests dan limits.
- [ ] Horizontal Pod Autoscaler.
- [ ] Ingress/Gateway.
- [ ] Rolling update.
- [ ] Rollback.
- [ ] Helm atau Kustomize.
- [ ] RBAC dan network policy.

### Praktik

- [ ] Deploy satu service Go ke cluster lokal.
- [ ] Konfigurasikan readiness dan liveness.
- [ ] Uji rolling update.
- [ ] Uji rollback.
- [ ] Amati resource usage dan scaling.

### Kriteria kelulusan

Mampu men-deploy service ke cluster lokal dan memahami health check, resource limit, serta deployment lifecycle.

---

## Tahap 15 — Proyek Akhir

**Durasi:** 2 minggu atau lebih

### Proyek: Order Management System

Bangun sistem pemesanan dengan Go.

#### Service

**1. catalog-service**

- CRUD produk.
- Validasi produk.
- Database katalog.

**2. order-service**

- Membuat pesanan.
- Mengelola status pesanan.
- Validasi produk melalui API.
- Idempotency untuk pembuatan order.

**3. notification-service**

- Mengonsumsi event order.
- Memproses notifikasi.
- Retry dan penanganan pesan gagal.

### Persyaratan proyek

- [ ] Semua service menggunakan Go.
- [ ] REST API dan OpenAPI.
- [ ] Database ownership yang jelas.
- [ ] Docker Compose.
- [ ] Unit, integration, dan contract tests.
- [ ] JWT atau mekanisme autentikasi yang sesuai.
- [ ] Timeout dan penanganan downstream failure.
- [ ] Message broker bila sesuai.
- [ ] Structured logging.
- [ ] Prometheus dan Grafana.
- [ ] OpenTelemetry tracing.
- [ ] CI/CD.
- [ ] Dokumentasi arsitektur.
- [ ] Diagram sequence.
- [ ] Runbook troubleshooting.
- [ ] Pengujian performa dan laporan hasil.
- [ ] Dokumentasi trade-off dan batasan.

### Kriteria akhir

Proyek dianggap berhasil jika dapat dijalankan dari repository, diuji secara otomatis, diamati melalui dashboard, serta tetap menangani kegagalan yang sudah direncanakan.

---

## Struktur Repository Contoh

```text
go-microservices-project/
├── README.md
├── docs/
│   ├── architecture.md
│   ├── api-contracts.md
│   ├── runbook.md
│   └── adr/
├── services/
│   ├── catalog/
│   ├── order/
│   └── notification/
├── deploy/
│   ├── compose.yaml
│   └── k8s/
└── .github/
    └── workflows/
```

Untuk proyek kecil, satu Go module dengan beberapa executable juga dapat digunakan. Pilih struktur berdasarkan kebutuhan dependency dan rilis.

---

## Checklist Kesiapan Mahir

- [ ] Menguasai Go dan concurrency.
- [ ] Mampu mendesain API yang konsisten.
- [ ] Mampu menentukan batas domain service.
- [ ] Memahami database ownership dan transaksi.
- [ ] Mampu menangani timeout, retry, dan partial failure.
- [ ] Memahami eventual consistency, saga, dan outbox.
- [ ] Mampu menulis unit, integration, dan contract tests.
- [ ] Mampu mengamankan API dan mengelola secret.
- [ ] Mampu menjalankan service melalui Docker.
- [ ] Mampu membuat pipeline CI/CD.
- [ ] Mampu menggunakan Grafana dan OpenTelemetry.
- [ ] Mampu melakukan deployment dan rollback.
- [ ] Mampu menganalisis performa dan bottleneck.
- [ ] Mampu menjelaskan trade-off microservices dibanding monolith.

---

## Referensi Resmi

### Go

- https://go.dev/tour/
- https://go.dev/doc/
- https://go.dev/doc/effective_go

### Arsitektur dan API

- https://martinfowler.com/articles/microservices.html
- https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/microservices
- https://spec.openapis.org/oas/latest.html
- https://12factor.net/

### Database dan deployment

- https://www.postgresql.org/docs/
- https://docs.docker.com/
- https://docs.docker.com/compose/
- https://kubernetes.io/docs/home/

### Observability dan messaging

- https://opentelemetry.io/docs/
- https://prometheus.io/docs/
- https://grafana.com/docs/
- https://www.rabbitmq.com/tutorials
- https://kafka.apache.org/documentation/

---

## Jadwal Belajar

| Minggu | Fokus                            |
| ------ | -------------------------------- |
| 1      | Fondasi backend                  |
| 2–3    | Go dasar dan concurrency         |
| 4      | REST API dengan Go               |
| 5      | Database                         |
| 6      | Modular monolith dan domain      |
| 7      | Desain microservices             |
| 8      | Komunikasi antar-service         |
| 9–10   | Reliability dan konsistensi data |
| 11     | Security dan testing             |
| 12     | Docker Compose                   |
| 13–14  | Observability                    |
| 15–16  | CI/CD dan message broker         |
| 17–18  | Kubernetes                       |
| 19–20  | Proyek akhir dan evaluasi        |

**Prinsip utama:** jangan membuat microservices hanya demi memecah aplikasi. Mulai dari domain yang jelas, gunakan Go untuk implementasi, lalu tambahkan messaging, observability, dan orkestrasi sesuai kebutuhan nyata.
