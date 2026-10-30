# 🗺️ Roadmap Belajar RESTful API: Dari Nol Sampai Mahir

Panduan bertahap untuk memahami, membangun, mengamankan, dan men-deploy RESTful API secara profesional.

> **Estimasi waktu total:** 4–6 bulan (belajar 1–2 jam/hari). Sesuaikan dengan kecepatanmu sendiri.

---

## 📌 Gambaran Umum Roadmap

| Fase | Topik | Estimasi |
|------|-------|----------|
| 0 | Prasyarat & Persiapan | 1–2 minggu |
| 1 | Fundamental Web & HTTP | 1–2 minggu |
| 2 | Konsep REST | 1 minggu |
| 3 | Konsumsi API (Client Side) | 1 minggu |
| 4 | Membangun API Pertama | 2–3 minggu |
| 5 | Database & Persistensi Data | 2–3 minggu |
| 6 | Desain API yang Baik | 2 minggu |
| 7 | Autentikasi & Otorisasi | 2 minggu |
| 8 | Keamanan API | 1–2 minggu |
| 9 | Testing & Dokumentasi | 2 minggu |
| 10 | Performa & Skalabilitas | 2 minggu |
| 11 | Deployment & DevOps | 2 minggu |
| 12 | Topik Lanjutan (Mahir) | Berkelanjutan |

---

## 🔰 Fase 0: Prasyarat & Persiapan

**Tujuan:** Punya bekal dasar sebelum masuk ke API.

### Yang perlu dikuasai
- [ ] Dasar-dasar pemrograman (variabel, tipe data, perulangan, fungsi, OOP dasar)
- [ ] Pilih **satu** bahasa backend untuk fokus
- [ ] Command line / terminal dasar
- [ ] Git & GitHub (commit, branch, push, pull request)
- [ ] Text editor / IDE (VS Code direkomendasikan)

### Pilihan bahasa & framework

| Bahasa | Framework Populer |
|--------|-------------------|
| JavaScript / TypeScript | Express.js, NestJS, Fastify |
| Python | FastAPI, Flask, Django REST Framework |
| PHP | Laravel, Slim |
| Java | Spring Boot |
| Go | Gin, Fiber, Echo |
| C# | ASP.NET Core |

> 💡 **Saran pemula:** Mulai dengan **Node.js (Express)** atau **Python (FastAPI)** karena komunitasnya besar dan kurva belajarnya ramah.

---

## 🌐 Fase 1: Fundamental Web & HTTP

**Tujuan:** Memahami bagaimana web berkomunikasi, karena REST dibangun di atas HTTP.

### Materi
- [ ] Arsitektur **Client–Server**
- [ ] Apa itu **URL, URI, domain, IP, port**
- [ ] **DNS** dan bagaimana browser memuat halaman
- [ ] **HTTP vs HTTPS** (konsep TLS/SSL)
- [ ] Siklus **Request–Response**
- [ ] **HTTP Methods:** `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`
- [ ] **HTTP Status Codes**
  - `1xx` Informational
  - `2xx` Success (`200`, `201`, `204`)
  - `3xx` Redirection (`301`, `302`, `304`)
  - `4xx` Client Error (`400`, `401`, `403`, `404`, `409`, `422`, `429`)
  - `5xx` Server Error (`500`, `502`, `503`)
- [ ] **HTTP Headers:** `Content-Type`, `Accept`, `Authorization`, `Cache-Control`, `User-Agent`
- [ ] **Request Body** vs **Query Parameter** vs **Path Parameter**
- [ ] **Cookies & Session**
- [ ] **CORS** (Cross-Origin Resource Sharing)

### Format data
- [ ] **JSON** (wajib dikuasai)
- [ ] XML (cukup tahu)
- [ ] Form data & multipart/form-data

### Latihan
1. Buka DevTools browser → tab **Network**, amati request/response saat membuka sebuah website.
2. Coba perintah `curl` sederhana:
   ```bash
   curl -i https://jsonplaceholder.typicode.com/posts/1
   ```

---

## 🧩 Fase 2: Memahami Konsep REST

**Tujuan:** Mengerti apa itu REST dan prinsip-prinsipnya.

### Apa itu REST?
**REST (Representational State Transfer)** adalah gaya arsitektur untuk merancang layanan web yang diperkenalkan oleh Roy Fielding pada tahun 2000. **RESTful API** adalah API yang mengikuti prinsip-prinsip REST.

### 6 Prinsip (Constraint) REST
1. **Client–Server:** Pemisahan tanggung jawab antara client dan server.
2. **Stateless:** Setiap request berdiri sendiri, server tidak menyimpan state klien antar request.
3. **Cacheable:** Response harus menyatakan apakah bisa di-cache atau tidak.
4. **Uniform Interface:** Antarmuka yang konsisten (resource, representasi, HATEOAS).
5. **Layered System:** Arsitektur berlapis (load balancer, proxy, gateway).
6. **Code on Demand** *(opsional)*: Server dapat mengirim kode yang dieksekusi di client.

### Konsep inti
- [ ] **Resource:** entitas yang diakses (user, produk, order)
- [ ] **Endpoint / URI:** alamat resource
- [ ] **Representasi:** bentuk data resource (biasanya JSON)
- [ ] Pemetaan operasi **CRUD** ke HTTP method

| Operasi | HTTP Method | Contoh Endpoint | Status Sukses |
|---------|-------------|-----------------|---------------|
| Ambil daftar | `GET` | `/users` | `200 OK` |
| Ambil satu | `GET` | `/users/42` | `200 OK` |
| Buat baru | `POST` | `/users` | `201 Created` |
| Ganti total | `PUT` | `/users/42` | `200 OK` |
| Ubah sebagian | `PATCH` | `/users/42` | `200 OK` |
| Hapus | `DELETE` | `/users/42` | `204 No Content` |

### Konsep penting: Idempotency & Safe Methods
- **Safe:** tidak mengubah data (`GET`, `HEAD`, `OPTIONS`)
- **Idempotent:** dipanggil berkali-kali hasilnya sama (`GET`, `PUT`, `DELETE`)
- `POST` **tidak** idempotent

---

## 🔌 Fase 3: Mengonsumsi API (Sisi Client)

**Tujuan:** Terbiasa memakai API sebelum membuatnya.

### Tools
- [ ] **Postman** / **Insomnia** / **Bruno** / **Thunder Client** (ekstensi VS Code)
- [ ] **cURL** via terminal
- [ ] **Fetch API / Axios** (JavaScript) atau **requests** (Python)

### Contoh dengan Fetch (JavaScript)
```javascript
// GET
const res = await fetch("https://jsonplaceholder.typicode.com/posts/1");
const data = await res.json();
console.log(data);

// POST
const created = await fetch("https://jsonplaceholder.typicode.com/posts", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title: "Halo", body: "Belajar REST", userId: 1 }),
});
console.log(await created.json());
```

### Contoh dengan Python
```python
import requests

r = requests.get("https://jsonplaceholder.typicode.com/posts/1")
print(r.status_code, r.json())
```

### API publik untuk latihan
- [JSONPlaceholder](https://jsonplaceholder.typicode.com/)
- [PokéAPI](https://pokeapi.co/)
- [Public APIs (GitHub list)](https://github.com/public-apis/public-apis)
- [ReqRes](https://reqres.in/)

### Latihan
- Buat aplikasi kecil yang menampilkan data dari API publik (misalnya daftar Pokémon atau cuaca).
- Tangani error: network gagal, `404`, `500`.

---

## 🛠️ Fase 4: Membangun REST API Pertamamu

**Tujuan:** Membuat API sederhana dengan operasi CRUD.

### Materi
- [ ] Setup project & struktur folder
- [ ] **Routing** (mendefinisikan endpoint)
- [ ] **Controller / Handler**
- [ ] Membaca **path param**, **query param**, dan **body**
- [ ] **Middleware** (logging, parsing JSON, error handler)
- [ ] Mengirim **status code** dan **response** yang tepat
- [ ] **Environment variable** (`.env`)
- [ ] **Validasi input** (Zod, Joi, Pydantic, class-validator, dll.)
- [ ] **Error handling** yang konsisten

### Contoh minimal (Express.js)
```javascript
import express from "express";
const app = express();
app.use(express.json());

let todos = [{ id: 1, title: "Belajar REST", done: false }];

app.get("/todos", (req, res) => res.json(todos));

app.get("/todos/:id", (req, res) => {
  const todo = todos.find(t => t.id === Number(req.params.id));
  if (!todo) return res.status(404).json({ message: "Todo tidak ditemukan" });
  res.json(todo);
});

app.post("/todos", (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ message: "title wajib diisi" });
  const todo = { id: Date.now(), title, done: false };
  todos.push(todo);
  res.status(201).json(todo);
});

app.delete("/todos/:id", (req, res) => {
  todos = todos.filter(t => t.id !== Number(req.params.id));
  res.status(204).send();
});

app.listen(3000, () => console.log("Server jalan di http://localhost:3000"));
```

### Contoh minimal (FastAPI)
```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()
todos = []

class Todo(BaseModel):
    title: str
    done: bool = False

@app.get("/todos")
def list_todos():
    return todos

@app.post("/todos", status_code=201)
def create_todo(todo: Todo):
    todos.append(todo)
    return todo
```

### 🎯 Proyek Mini
**To-Do API** dengan endpoint CRUD lengkap, validasi input, dan error handling.

---

## 🗄️ Fase 5: Database & Persistensi Data

**Tujuan:** Menyimpan data secara permanen.

### Materi
- [ ] **SQL (Relasional):** PostgreSQL / MySQL
  - Tabel, primary key, foreign key, relasi (1–1, 1–N, N–N)
  - Query dasar: `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `JOIN`
  - Index & transaksi
- [ ] **NoSQL:** MongoDB (dokumen), Redis (key-value)
- [ ] **ORM / ODM / Query Builder**
  - JS/TS: Prisma, Drizzle, TypeORM, Sequelize, Mongoose
  - Python: SQLAlchemy, Django ORM
  - PHP: Eloquent
- [ ] **Migration** & **seeding**
- [ ] Pola **Repository / Service layer**
- [ ] Menghindari **N+1 query**

### Struktur proyek yang rapi (contoh layered)
```
src/
├── routes/        # definisi endpoint
├── controllers/   # menangani request/response
├── services/      # logika bisnis
├── repositories/  # akses database
├── models/        # skema/entitas
├── middlewares/   # auth, error handler, dll.
├── validators/    # skema validasi
└── config/        # konfigurasi & env
```

### 🎯 Proyek
**Blog API** — user, post, comment, dengan relasi antar tabel.

---

## 🎨 Fase 6: Desain API yang Baik (Best Practices)

**Tujuan:** Membuat API yang konsisten, intuitif, dan mudah dipakai.

### Penamaan endpoint
- ✅ Gunakan **kata benda jamak**, bukan kata kerja: `/users`, bukan `/getUsers`
- ✅ Gunakan **huruf kecil** dan **kebab-case**: `/order-items`
- ✅ Resource bersarang secukupnya: `/users/42/orders`
- ❌ Hindari nesting terlalu dalam (maks. 2–3 level)

### Fitur penting
- [ ] **Pagination:** `?page=2&limit=20` atau **cursor-based**
- [ ] **Filtering:** `?status=active&role=admin`
- [ ] **Sorting:** `?sort=-created_at`
- [ ] **Searching:** `?q=keyword`
- [ ] **Field selection:** `?fields=id,name`
- [ ] **Versioning:** `/api/v1/users` (atau via header)
- [ ] **Format response konsisten**

### Contoh format response yang konsisten
```json
{
  "success": true,
  "message": "Data berhasil diambil",
  "data": [{ "id": 1, "name": "Budi" }],
  "meta": { "page": 1, "limit": 20, "total": 134 }
}
```

### Contoh format error yang konsisten
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input tidak valid",
    "details": [{ "field": "email", "message": "Format email salah" }]
  }
}
```
> Pertimbangkan standar **RFC 7807 (Problem Details for HTTP APIs)** untuk format error.

### Prinsip tambahan
- [ ] Gunakan **status code yang tepat**
- [ ] **Idempotency key** untuk operasi pembayaran/kritis
- [ ] **HATEOAS** (level lanjut dari Richardson Maturity Model)
- [ ] Pahami **Richardson Maturity Model** (Level 0–3)
- [ ] **Backward compatibility** & deprecation policy

---

## 🔐 Fase 7: Autentikasi & Otorisasi

**Tujuan:** Mengamankan akses ke API.

### Konsep
- **Autentikasi (AuthN):** *Siapa kamu?*
- **Otorisasi (AuthZ):** *Apa yang boleh kamu lakukan?*

### Materi
- [ ] **Password hashing:** bcrypt / argon2 (jangan pernah simpan password plaintext!)
- [ ] **Session-based auth** vs **Token-based auth**
- [ ] **JWT (JSON Web Token)**
  - Struktur: header, payload, signature
  - Access token & **refresh token**
  - Masa berlaku & rotasi token
- [ ] **API Key**
- [ ] **OAuth 2.0** & **OpenID Connect** (login dengan Google/GitHub)
- [ ] **RBAC (Role-Based Access Control)**
- [ ] **ABAC / Permission-based** (lanjutan)
- [ ] Penyimpanan token yang aman (HttpOnly cookie vs header)

### Alur JWT sederhana
```
1. Client  → POST /auth/login  (email + password)
2. Server  → 200 OK { accessToken, refreshToken }
3. Client  → GET /profile  (Authorization: Bearer <accessToken>)
4. Server  → memverifikasi token → mengembalikan data
5. Token kedaluwarsa → POST /auth/refresh → token baru
```

### 🎯 Proyek
Tambahkan **register, login, logout, refresh token,** dan **role admin/user** pada Blog API.

---

## 🛡️ Fase 8: Keamanan API

**Tujuan:** Melindungi API dari serangan umum.

### Wajib dipahami: OWASP API Security Top 10
- [ ] **Broken Object Level Authorization (BOLA/IDOR)**
- [ ] Broken Authentication
- [ ] Excessive Data Exposure
- [ ] Lack of Resources & **Rate Limiting**
- [ ] Broken Function Level Authorization
- [ ] Mass Assignment
- [ ] Security Misconfiguration
- [ ] **Injection** (SQL Injection, NoSQL Injection)
- [ ] Improper Asset Management
- [ ] Insufficient Logging & Monitoring

### Praktik keamanan
- [ ] Selalu gunakan **HTTPS**
- [ ] **Validasi & sanitasi** semua input
- [ ] **Rate limiting & throttling**
- [ ] Konfigurasi **CORS** yang ketat
- [ ] Security headers (**Helmet** di Node.js)
- [ ] Jangan bocorkan stack trace/error internal ke client
- [ ] Simpan **secret** di environment variable / secret manager
- [ ] Gunakan **parameterized query** / ORM
- [ ] Audit dependensi (`npm audit`, `pip-audit`, Dependabot)
- [ ] **Logging** aktivitas penting (tanpa data sensitif)

---

## ✅ Fase 9: Testing & Dokumentasi

### Testing
- [ ] **Unit Test:** menguji fungsi/service secara terisolasi
- [ ] **Integration Test:** menguji endpoint + database
- [ ] **End-to-End Test**
- [ ] **Mocking & Stubbing**
- [ ] **Test coverage**
- [ ] **Load/Performance Test:** k6, Artillery, JMeter

| Bahasa | Tools Testing |
|--------|---------------|
| JS/TS | Jest, Vitest, Supertest |
| Python | Pytest, httpx |
| PHP | PHPUnit, Pest |
| Java | JUnit, MockMvc |
| Go | `testing`, Testify |

### Dokumentasi API
- [ ] **OpenAPI / Swagger Specification**
- [ ] **Swagger UI / Redoc** (dokumentasi interaktif)
- [ ] **Postman Collection**
- [ ] README yang jelas (cara setup, contoh request/response)
- [ ] Changelog & versioning

> 💡 FastAPI membuat dokumentasi Swagger otomatis di `/docs`. Untuk Express/NestJS, gunakan `swagger-jsdoc` atau `@nestjs/swagger`.

### Contoh OpenAPI singkat
```yaml
openapi: 3.0.3
info:
  title: Todo API
  version: 1.0.0
paths:
  /todos:
    get:
      summary: Ambil semua todo
      responses:
        "200":
          description: Berhasil
```

---

## ⚡ Fase 10: Performa & Skalabilitas

**Tujuan:** Membuat API cepat dan tahan beban.

### Materi
- [ ] **Caching**
  - HTTP caching: `ETag`, `Cache-Control`, `Last-Modified`
  - Application cache: **Redis**, Memcached
  - CDN
- [ ] **Database optimization:** index, query tuning, connection pooling
- [ ] **Pagination** yang efisien (cursor-based untuk data besar)
- [ ] **Kompresi** response (gzip / brotli)
- [ ] **Asynchronous processing:** background job & queue (BullMQ, Celery, RabbitMQ, Kafka)
- [ ] **Rate limiting** terdistribusi
- [ ] **Horizontal vs vertical scaling**
- [ ] **Load balancing**
- [ ] **Monitoring & profiling**

### Metrik yang perlu dipantau
- Latency (p50, p95, p99)
- Throughput (request/detik)
- Error rate
- Resource usage (CPU, memori)

---

## 🚀 Fase 11: Deployment & DevOps

**Tujuan:** Menjalankan API di lingkungan produksi.

### Materi
- [ ] **Docker** & Docker Compose
- [ ] **CI/CD:** GitHub Actions / GitLab CI
- [ ] **Cloud / Hosting:** VPS, Railway, Render, Fly.io, AWS, GCP, Azure, Vercel
- [ ] **Reverse proxy:** Nginx / Caddy
- [ ] **Domain, DNS, & SSL** (Let's Encrypt)
- [ ] **Environment** terpisah: dev, staging, production
- [ ] **Logging terpusat** & **Monitoring** (Prometheus, Grafana, Sentry, Datadog)
- [ ] **Health check endpoint:** `/health`
- [ ] Backup & disaster recovery database
- [ ] **12-Factor App** methodology

### Contoh Dockerfile (Node.js)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "src/index.js"]
```

### Contoh pipeline GitHub Actions
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm test
```

---

## 🏆 Fase 12: Topik Lanjutan (Level Mahir)

### Arsitektur & paradigma
- [ ] **Clean Architecture / Hexagonal / DDD**
- [ ] **Microservices** vs **Monolith** vs **Modular Monolith**
- [ ] **API Gateway** (Kong, NGINX, AWS API Gateway)
- [ ] **Service-to-service communication**
- [ ] **Event-driven architecture**

### Alternatif & pelengkap REST
| Teknologi | Kapan Dipakai |
|-----------|---------------|
| **GraphQL** | Client butuh fleksibilitas query, hindari over/under-fetching |
| **gRPC** | Komunikasi antar-service berperforma tinggi |
| **WebSocket** | Komunikasi dua arah real-time (chat, notifikasi) |
| **Server-Sent Events** | Streaming satu arah dari server |
| **Webhooks** | Server memberi tahu sistem lain saat ada event |
| **tRPC** | End-to-end type safety di ekosistem TypeScript |

### Topik tingkat lanjut
- [ ] **Idempotency** & **retry** yang aman
- [ ] **Distributed tracing** (OpenTelemetry, Jaeger)
- [ ] **Circuit breaker, bulkhead, retry with backoff**
- [ ] **Eventual consistency** & pola **Saga**
- [ ] **CQRS & Event Sourcing**
- [ ] **API versioning strategy** & kontrak (contract testing, Pact)
- [ ] **API governance & design-first** (OpenAPI-first)
- [ ] **Multi-tenancy**
- [ ] **File upload besar** (presigned URL, S3)
- [ ] **Observability** lengkap: logs, metrics, traces
- [ ] **API monetization & analytics**

---

## 🎯 Proyek Portofolio (Berjenjang)

| Level | Proyek | Fokus Skill |
|-------|--------|-------------|
| 🟢 Pemula | **To-Do API** | CRUD, routing, validasi |
| 🟢 Pemula | **Bookmark/Notes API** | CRUD + penyimpanan file/JSON |
| 🟡 Menengah | **Blog API** | Relasi DB, auth JWT, role |
| 🟡 Menengah | **E-commerce API** | Produk, keranjang, order, pagination, filter |
| 🟠 Lanjut | **Social Media API** | Follow, feed, like, comment, cache, rate limit |
| 🟠 Lanjut | **Payment/Booking API** | Idempotency, transaksi DB, webhook |
| 🔴 Mahir | **Microservices Marketplace** | Gateway, queue, event-driven, observability, CI/CD |

> 📁 Upload semua proyek ke **GitHub** lengkap dengan **README, dokumentasi OpenAPI, test, dan Docker**, ini sangat bernilai di portofolio.

---

## 📚 Sumber Belajar yang Direkomendasikan

### Dokumentasi & referensi
- [MDN Web Docs: HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP)
- [REST API Tutorial](https://restfulapi.net/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [OWASP API Security Top 10](https://owasp.org/API-Security/)
- [roadmap.sh/backend](https://roadmap.sh/backend)
- [Microsoft REST API Guidelines](https://github.com/microsoft/api-guidelines)
- [Google API Design Guide](https://cloud.google.com/apis/design)

### Buku
- *RESTful Web APIs* — Leonard Richardson & Mike Amundsen
- *Designing Web APIs* — Brenda Jin, Saurabh Sahni, Amir Shevat
- *Designing Data-Intensive Applications* — Martin Kleppmann
- *Clean Architecture* — Robert C. Martin

### Tools yang berguna
- **Postman / Bruno / Insomnia** — testing API
- **Swagger Editor** — menulis & memvalidasi OpenAPI
- **DBeaver / TablePlus** — manajemen database
- **Docker Desktop** — containerization
- **k6** — load testing

---

## 💡 Tips Belajar Efektif

1. **Praktik > Teori.** Setiap konsep langsung dicoba dalam kode.
2. **Bangun proyek nyata**, jangan hanya mengikuti tutorial (hindari *tutorial hell*).
3. **Baca kode API open-source** (misalnya milik GitHub, Stripe, Twitter) untuk belajar desain yang baik.
4. **Pelajari dokumentasi API populer** seperti Stripe & GitHub sebagai referensi *gold standard*.
5. **Review & refactor** kode lamamu secara berkala.
6. **Tulis catatan/blog** tentang apa yang kamu pelajari.
7. **Gabung komunitas** (Discord, Telegram, Stack Overflow, forum lokal).
8. **Konsisten** — 1 jam setiap hari lebih baik daripada 7 jam sekali seminggu.

---

## ✔️ Checklist Kemahiran

Kamu bisa dibilang **mahir** jika sudah mampu:

- [ ] Menjelaskan prinsip REST dan perbedaannya dengan RPC/GraphQL
- [ ] Mendesain endpoint, response, dan error yang konsisten
- [ ] Membangun API lengkap dengan database, auth, dan validasi
- [ ] Mengamankan API dari kerentanan OWASP umum
- [ ] Menulis unit & integration test dengan coverage memadai
- [ ] Mendokumentasikan API dengan OpenAPI/Swagger
- [ ] Mengoptimalkan performa (cache, index, pagination, queue)
- [ ] Men-deploy dengan Docker + CI/CD ke cloud
- [ ] Memonitor & men-debug API di produksi
- [ ] Merancang arsitektur yang skalabel dan mudah dirawat

---

> 🚀 **Selamat belajar!** Mulailah dari Fase 0, selesaikan satu fase demi satu fase, dan jangan lupa membangun proyek di setiap tahap. Konsistensi adalah kunci untuk menjadi mahir.
