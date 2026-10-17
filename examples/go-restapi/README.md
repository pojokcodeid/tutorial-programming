# Contoh RESTful API dengan Go

Proyek contoh nyata untuk materi tutorial **Go REST API** — RESTful API
produksi dengan Go memakai `net/http` standar, autentikasi JWT, otorisasi
berbasis peran, database MariaDB, unit testing, dan integration testing.

## Fitur

- **RESTful API** dengan `net/http` standar Go 1.22+ (method + path pattern)
- **Authentication** register/login dengan hash password **bcrypt**
- **JWT (HS256)** untuk sesi stateless
- **Authorization** berbasis peran: `admin` (CRUD) vs `user` (baca)
- **MariaDB** via `database/sql` + `go-sql-driver/mysql` (connection pool)
- **Arsitektur modular/layered**: handler → service → repository → database
- **Unit testing** (mock repository, table-driven, `httptest`)
- **Integration testing** (build tag `integration`, butuh MariaDB)

## Struktur Proyek

```
go-restapi/
├── cmd/
│   ├── server/main.go        # titik masuk server (wire-up + graceful shutdown)
│   └── seed/main.go          # menanam akun admin untuk development
├── internal/
│   ├── config/               # baca konfigurasi dari env / .env
│   ├── database/             # koneksi & connection pool MariaDB
│   ├── model/                # entitas User, Product + validasi
│   ├── repository/           # akses data (interface + implementasi MariaDB)
│   ├── service/              # logika bisnis (auth JWT, produk)
│   ├── handler/              # lapisan HTTP (decode/encode JSON, status code)
│   ├── middleware/           # logging, Authenticate (JWT), RequireRole
│   └── router/               # registrasi semua route
├── migrations/001_init.sql   # skema tabel users & products
├── .env.example              # contoh konfigurasi
└── go.mod
```

## Prasyarat

- Go 1.22 atau lebih baru
- MariaDB berjalan di `localhost` (default: user `root`, password `root`)

## Cara Menjalankan

```bash
# 1. Salin konfigurasi (sesuaikan kredensial DB bila perlu)
cp .env.example .env

# 2. Buat database & jalankan migrasi
mysql -uroot -proot -e "CREATE DATABASE IF NOT EXISTS gorestapi_app"
mysql -uroot -proot gorestapi_app < migrations/001_init.sql

# 3. (Opsional) tanam akun admin: admin / admin12345
go run ./cmd/seed

# 4. Jalankan server
go run ./cmd/server
# Server berjalan di http://localhost:8080
```

## Menjalankan Test

```bash
# Unit test (tanpa database — pakai mock)
go test ./... -v

# Integration test (butuh database gorestapi_test)
mysql -uroot -proot -e "CREATE DATABASE IF NOT EXISTS gorestapi_test"
mysql -uroot -proot gorestapi_test < migrations/001_init.sql
go test -tags=integration ./internal/repository/ -v
```

## Daftar Endpoint

| Method | Path                     | Auth        | Keterangan                    |
|--------|--------------------------|-------------|-------------------------------|
| POST   | `/api/v1/auth/register`  | publik      | Daftar akun baru (peran user) |
| POST   | `/api/v1/auth/login`     | publik      | Login, mengembalikan JWT      |
| GET    | `/api/v1/auth/me`        | token       | Klaim user dari token         |
| GET    | `/api/v1/products`       | publik      | Daftar produk (pagination)    |
| GET    | `/api/v1/products/{id}`  | publik      | Detail produk                 |
| POST   | `/api/v1/products`       | token admin | Tambah produk                 |
| PUT    | `/api/v1/products/{id}`  | token admin | Ubah produk                   |
| DELETE | `/api/v1/products/{id}`  | token admin | Hapus produk                  |

## Contoh Penggunaan (curl)

```bash
# Register
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"budi","email":"budi@mail.com","password":"rahasia123"}'

# Login → salin nilai "token"
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin12345"}'

# Akses endpoint admin dengan Bearer token
curl -X POST http://localhost:8080/api/v1/products \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Laptop Gaming","price":15000000,"stock":3}'
```

## Keamanan

- Password di-hash dengan bcrypt (garam acak), tidak pernah disimpan/dikirim mentah.
- JWT ditandatangani HS256; token kedaluwarsa/salah secret/`alg` palsu ditolak.
- Pesan error login sengaja sama untuk username tak dikenal & password salah
  (anti user-enumeration).
- Query database memakai prepared statement (`?`) → aman dari SQL injection.
- Simpan `JWT_SECRET` lewat environment, jangan di-commit ke version control.

> **Catatan:** contoh ini untuk pembelajaran. Untuk produksi, tambahkan refresh
> token, rate limiting, HTTPS, dan penanganan error yang lebih rinci.
