# Go Todo App — Aplikasi Desktop dengan Fyne + Database Bebas

Proyek contoh nyata untuk materi **Contoh Project Go GUI** (10 pelajaran, topik `gogui`).
Aplikasi desktop Todo App ditulis sepenuhnya dalam Go, tampilannya memakai GUI **Fyne**,
dan databasenya **bebas pilih** lewat satu interface: SQLite (default), MySQL/MariaDB, atau in-memory.

## Fitur

- CRUD todo: judul, catatan, kategori, prioritas (rendah/sedang/tinggi), status selesai
- Validasi input di dua lapis: `model` (aturan data) + `service` (aturan bisnis)
- Filter (semua / aktif / selesai) + pencarian bebas yang bisa digabung
- Hitungan total, aktif, dan selesai di header
- Dialog tambah/edit, konfirmasi hapus, konfirmasi keluar
- Pergantian database tanpa mengubah kode: cukup environment variable
- Tema kustom aksen `#0E7490` (sedikit lebih gelap dari warna asli agar kontras aman)

## Menjalankan

```bash
cd examples/go-todo-app
go run ./cmd/todo                    # SQLite (default) — file todo.db dibuat otomatis
TODO_DB_DRIVER=memory go run ./cmd/todo   # in-memory, cocok untuk coba-coba
TODO_DB_DRIVER=mysql TODO_DB_DSN="todo:rahasia@tcp(127.0.0.1:3306)/todo_app?parseTime=true" \
  go run ./cmd/todo                     # MySQL / MariaDB
```

Butuh Go 1.22+ dan toolchain build Fyne untuk aplikasi desktop (lihat pelajaran 2).

Isi contoh data (opsional, idempoten):

```bash
go run ./cmd/seed
```

## Struktur

```
cmd/todo/         titik masuk aplikasi GUI
cmd/seed/         pengisi data contoh (tanpa GUI)
internal/model/       entitas Todo + aturan validasi
internal/repository/  interface Repository + driver sqlite | mysql | memory
internal/service/     logika bisnis (validasi + orkestrasi repository)
internal/storage/     pemilihan driver dari environment variable
internal/ui/          jendela, daftar, dialog, tema Fyne
migrations/       skema SQL (referensi — driver juga mengeksekusi otomatis)
```

Alur ketergantungan: `ui` → `service` → `repository` → driver database.
UI tidak pernah tahu database apa yang dipakai — itulah inti "database bebas".

## Pengujian

```bash
go test ./...           # unit test service, driver sqlite, & uji UI headless
go test -race ./...     # dengan race detector
go vet ./...
```

## Materi terkait

Setiap pelajaran di materi **Contoh Project Go GUI** memakai kode dari proyek ini sebagai contoh nyata — dari struktur folder, interface repository, sampai build rilis.
