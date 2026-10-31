# Blog GraphQL dengan Go — GQLGen + GORM + MariaDB

Proyek contoh nyata dari materi **Bab 15: GraphQL dengan Go** pada tutorial GraphQL.
Server GraphQL lengkap dengan Query, Mutation, otorisasi sederhana, dan database MariaDB.

## Teknologi

| Komponen | Pilihan | Versi teruji |
|---|---|---|
| Bahasa | Go | 1.24+ (teruji di 1.27) |
| GraphQL server | [GQLGen](https://gqlgen.com/) | v0.17.98 |
| ORM | [GORM](https://gorm.io/) + driver MySQL | v1.31 / v1.6 |
| Database | MariaDB | `localhost:3306`, user `root`, password `rootpassword` |

## Struktur folder

```
graphql-go-blog/
├── graph/
│   ├── schema.graphqls        ← SKEMA GraphQL (sumber kebenaran — ubah lalu generate)
│   ├── schema.resolvers.go    ← implementasi resolver (diisi manual, dipertahankan generate)
│   ├── resolver.go            ← struct Resolver (wadah dependency: DB)
│   ├── context.go             ← helper "pengguna login" pada context
│   ├── model/
│   │   ├── models_gen.go      ← hasil generate (input & tipe tanpa kustomisasi)
│   │   ├── post.go            ← struct Post GORM (kustom, dengan relasi & foreign key)
│   │   └── user.go            ← struct User GORM (kustom)
│   └── generated/generated.go ← hasil generate — JANGAN diedit
├── internal/database/database.go ← koneksi GORM + AutoMigrate (+buat database otomatis)
├── cmd/seed/main.go           ← pengisi data contoh (idempan, aman diulang)
├── gqlgen.yml                 ← konfigurasi GQLGen
├── seed.sql                   ← alternatif seed lewat client mysql
└── main.go                    ← entry point: HTTP server + Playground + middleware auth
```

## Cara menjalankan

Prasyarat: Go 1.24+ dan MariaDB berjalan di `localhost:3306` (user `root`, password
`rootpassword`). Tidak perlu membuat database — server membuat `blog_go` otomatis
(bisa dimatikan lewat variabel `DATABASE_DSN`).

```bash
cd examples/graphql-go-blog

# 1. Jalankan server (membuat database + tabel bila belum ada)
DEBUG=1 go run .

# 2. Terminal terpisah — tanam data contoh (3 users, 4 posts)
go run ./cmd/seed

# 3. Buka Playground
open http://localhost:4000/
```

`DEBUG=1` menampilkan setiap SQL yang dijalankan GORM di terminal — sangat membantu
saat belajar. Tanpa `DEBUG=1`, log SQL dibungkam.

## Contoh query (siap tempel di Playground)

```graphql
# Baca: semua post beserta penulisnya
{ posts { id title published author { name role } } }

# Baca: hanya post terbit + jumlah total
{ postCount posts(published: true) { id title } }

# Tulis: buat post baru (authorID 1 = Budi)
mutation {
  createPost(input: { title: "Resensi Buku Go", content: "Buku bagus.", authorID: 1 }) {
    id title author { name }
  }
}

# Tulis: terbitkan post id 2
mutation { publishPost(id: 2) { id title published } }

# Tulis: hapus — KIRIM HEADER X-User-ID (simulasi login)
#   tanpa header      → ditolak: "silakan login dulu"
#   X-User-ID: 3      → ditolak (bukan penulis, bukan admin)
#   X-User-ID: 1      → sukses (Budi = ADMIN, boleh hapus post siapa pun)
mutation { deletePost(id: 4) }
```

Contoh dengan cURL:

```bash
curl -s http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 1" \
  -d '{"query":"mutation { deletePost(id: 3) }"}'
```

## Otorisasi (contoh belajar)

`deletePost` mempraktikkan materi Bab 12 (Keamanan & Otorisasi) versi Go:

1. **Autentikasi** — middleware `authMiddleware` membaca header `X-User-ID`,
   memverifikasi id ke database, lalu menyuntikkan `*model.User` ke `context`
   (pola persis `buildContext` Apollo Server).
2. **Otorisasi** — resolver memeriksa `CurrentUserFrom(ctx)`: hanya **penulis post**
   atau pengguna berperan `ADMIN` yang boleh menghapus.

> Header `X-User-ID` hanyalah simulasi agar fokus belajar tetap pada GraphQL.
> Produksi wajib memakai JWT sungguhan — lihat materi Bab 12.

## Alur mengubah schema (kerja harian GQLGen)

```bash
# 1. Edit graph/schema.graphqls
# 2. Regenerasi struct + interface resolver:
~/go/bin/gqlgen generate        # hasil install: go install github.com/99designs/gqlgen@v0.17.98
#    — atau tanpa install: go run github.com/99designs/gqlgen generate
# 3. Compiler menunjuk resolver yang belum diisi → implementasikan di schema.resolvers.go
# 4. go run . — uji di Playground
```

Catatan di macOS: file resource-fork `._*` bisa mengganggu pembacaan skema
(`Unexpected <Invalid>`). Bila itu terjadi: `find . -name '._*' -delete`.

## Variabel lingkungan

| Variabel | Default | Fungsi |
|---|---|---|
| `PORT` | `4000` | Port HTTP server |
| `DATABASE_DSN` | `root:rootpassword@tcp(localhost:3306)/blog_go?parseTime=True&charset=utf8mb4` | DSN GORM penuh |
| `DEBUG` | *(kosong)* | `1` = tampilkan SQL GORM |

> Kredensial di atas adalah konfigurasi **belajar lokal**. Di produksi, ambil semua
> rahasia dari environment/secret manager — jangan pernah hardcode di kode sumber.
