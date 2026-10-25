/* ============================================================
   Pelajaran Go — Bab 17: DevOps, Deployment & Security
   (topik info.md:
    - "Containerization menggunakan Docker
       (Multi-stage build untuk binary yang kecil)"
    - "CI/CD Pipeline untuk project Go"
    - "Security best practices (mencegah SQL Injection,
       sanitasi input, CORS, JWT Auth)")
   ============================================================ */
'use strict';

window.GO_LESSONS = window.GO_LESSONS || [];

/* ---------- Pelajaran 37: Docker, CI/CD & Keamanan ---------- */
window.GO_LESSONS.push({
  id: 'devops-security',
  title: 'Docker, CI/CD & Keamanan',
  chapter: 'DevOps, Deployment & Security',
  duration: '14 menit',
  intro: [
    'Kode yang selesai belum tentu siap dipakai orang banyak. Kita perlu <b>mengemasnya</b> agar jalan di mana saja, <b>mengotomatiskan</b> pengujian dan rilis, serta menutup celah <b>keamanan</b>.',
    'Pelajaran terakhir ini memandu tiga hal itu: <b>Docker multi-stage</b> untuk biner mungil, <b>CI/CD</b> untuk merilis dengan percaya diri, dan praktik keamanan penting di Go.'
  ],
  objectives: [
    'Membuat image Docker kecil dengan multi-stage build',
    'Menyusun pipeline CI/CD untuk proyek Go',
    'Mencegah SQL Injection dengan prepared statement',
    'Menerapkan sanitasi input, CORS, dan autentikasi JWT'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Go menghasilkan <b>biner tunggal</b>, jadi mengemasnya di Docker sangat mudah. Namun menggabungkan toolchain Go ke dalam image akhir membuat ukurannya besar (ratusan MB). Solusinya <b>multi-stage build</b>: tahap pertama mengompilasi, tahap kedua hanya menyalin biner ke image super ringan.</p>'
    },
    {
      type: 'example',
      title: 'Dockerfile multi-stage untuk Go',
      lang: 'text',
      output: false,
      code: `# ---------- Tahap 1: build ----------
FROM golang:1.22-alpine AS builder

WORKDIR /src

# Salin berkas module lebih dulu agar cache dependency awet
COPY go.mod go.sum ./
RUN go mod download

# Salin sisa kode lalu kompilasi biner statis
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/app ./cmd/server

# ---------- Tahap 2: jalankan ----------
FROM gcr.io/distroless/static-debian12:nonroot

WORKDIR /app
COPY --from=builder /out/app /app/app

EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/app/app"]`,
      explain: [
        'Tahap <b>builder</b> memakai image Go lengkap; tahap akhir hanya berisi biner.',
        '<code>CGO_ENABLED=0</code> menghasilkan biner statis tanpa ketergantungan pustaka C.',
        '<code>-ldflags="-s -w"</code> membuang informasi debug sehingga biner lebih kecil.',
        'Menyalin <code>go.mod</code> lebih dulu membuat lapisan cache Docker tidak sering batal.',
        'Image <b>distroless</b> (atau <code>alpine</code>) berukuran kecil dan permukaan serangnya sedikit.'
      ]
    },
    {
      type: 'example',
      title: 'Membangun & menjalankan image',
      lang: 'bash',
      output: false,
      code: `# Bangun image
docker build -t aplikasiku:1.0 .

# Lihat ukuran image (biasanya < 20 MB dengan distroless)
docker images aplikasiku

# Jalankan dengan batas memori & port
docker run --rm -p 8080:8080 --memory=256m aplikasiku:1.0

# Jangan lupa .dockerignore agar folder besar tidak ikut tersalin:
#   .git
#   node_modules
#   *.env
#   tmp/`,
      explain: [
        '<code>docker build</code> menjalankan kedua tahap dan menyimpan hanya hasil akhir.',
        'Berkas <code>.dockerignore</code> mencegah data sensitif (<code>.env</code>) dan berkas besar ikut ke dalam context.',
        'Batasi memori container agar sesuai <code>GOMEMLIMIT</code> yang kamu setel.',
        'Biner Go bisa juga dijalankan tanpa Docker — image hanyalah cara mengemasnya rapi.'
      ]
    },
    {
      type: 'text',
      html: '<p><b>CI/CD</b> (Continuous Integration / Continuous Delivery) berarti setiap perubahan kode otomatis diuji, dibangun, dan (bila lolos) dirilis. Untuk proyek Go, pipeline dasarnya: jalankan <code>gofmt</code>/<code>go vet</code>, uji dengan race detector, bangun, lalu dorong image atau biner.</p>'
    },
    {
      type: 'example',
      title: 'Contoh pipeline GitHub Actions',
      lang: 'yaml',
      output: false,
      code: `name: Go CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.22'

      - name: Cek format & vet
        run: |
          test -z "$(gofmt -l .)" || (gofmt -l . && exit 1)
          go vet ./...

      - name: Uji dengan race detector
        run: go test -race -coverprofile=coverage.out ./...

      - name: Build
        run: go build ./...`,
      explain: [
        'Setiap <i>push</i> atau <i>pull request</i> memicu pipeline berjalan.',
        '<code>gofmt -l</code> gagal bila ada berkas yang tidak terformat rapi.',
        '<code>-race</code> mendeteksi race condition saat pengujian.',
        '<code>go vet</code> menangkap kesalahan umum yang tidak tertangkap compiler.',
        'Tambahkan langkah build & push image Docker setelah semua uji lolos.'
      ]
    },
    {
      type: 'text',
      html: '<p>Sekarang bagian <b>keamanan</b>. Celah paling berbahaya dan paling mudah terjadi adalah <b>SQL Injection</b>: penyerang menyisipkan perintah SQL lewat input pengguna. Pertahanannya sederhana tapi wajib: selalu pakai <b>prepared statement</b> dengan placeholder, jangan pernah merangkai string kueri.</p>'
    },
    {
      type: 'example',
      title: 'SQL Injection vs prepared statement',
      lang: 'go',
      output: false,
      code: `package main

import "database/sql"

// ✗ SALAH: input dimasukkan langsung ke string kueri.
func cariSalah(db *sql.DB, email string) *sql.Row {
    kueri := "SELECT id, nama FROM pengguna WHERE email = '" + email + "'"
    return db.QueryRow(kueri)
}

// ✓ BENAR: gunakan placeholder (?) — driver mengurus escaping.
func cariBenar(db *sql.DB, email string) *sql.Row {
    return db.QueryRow(
        "SELECT id, nama FROM pengguna WHERE email = ?", email,
    )
}`,
      explain: [
        'Pada versi salah, input <code>\' OR \'1\'=\'1</code> bisa membocorkan seluruh tabel.',
        'Placeholder <code>?</code> (MySQL/SQLite) atau <code>$1</code> (PostgreSQL) memisahkan kode dari data.',
        'Driver mengirim nilai sebagai parameter terpisah, bukan bagian dari teks kueri.',
        'Prinsip sama berlaku untuk <code>INSERT</code>, <code>UPDATE</code>, dan <code>DELETE</code>.'
      ]
    },
    {
      type: 'text', // other security concerns
      html: '<p>Selain SQL Injection, ada beberapa hal yang selalu diperhatikan di aplikasi web Go:</p><ul><li><b>Sanitasi & validasi input</b> — periksa panjang, format, dan rentang nilai sebelum diproses.</li><li><b>CORS</b> — batasi domain mana yang boleh mengakses API dari browser.</li><li><b>Autentikasi JWT</b> — verifikasi tanda tangan token dan periksa masa berlakunya.</li><li><b>HTTPS</b> — selalu enkripsi lalu lintas di produksi.</li><li><b>Jangan bocorkan error internal</b> — kirim pesan umum ke pengguna, catat detailnya di log.</li></ul>'
    },
    {
      type: 'example',
      title: 'CORS, validasi & verifikasi JWT (ringkas)',
      lang: 'go',
      output: false,
      code: `package main

import (
    "encoding/json"
    "net/http"
    "strings"

    "github.com/golang-jwt/jwt/v5"
)

var kunciRahasia = []byte("ganti-dengan-kunci-dari-env")

// CORS: hanya izinkan domain yang kita percaya.
func denganCORS(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "https://situsku.com")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE")
        w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
        if r.Method == http.MethodOptions {
            w.WriteHeader(http.StatusNoContent)
            return
        }
        next.ServeHTTP(w, r)
    })
}

type DaftarReq struct {
    Nama  string ` + "`" + `json:"nama"` + "`" + `
    Email string ` + "`" + `json:"email"` + "`" + `
}

// Validasi sederhana sebelum memakai input.
func validasi(req DaftarReq) error {
    if strings.TrimSpace(req.Nama) == "" {
        return &httpError{400, "nama wajib diisi"}
    }
    if !strings.Contains(req.Email, "@") {
        return &httpError{400, "email tidak valid"}
    }
    return nil
}

// Verifikasi JWT dari header Authorization.
func penggunaDariToken(r *http.Request) (string, error) {
    h := r.Header.Get("Authorization")
    tokenStr := strings.TrimPrefix(h, "Bearer ")

    token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
        // Pastikan algoritma sesuai harapan (cegah serangan "alg: none").
        if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, &httpError{401, "metode tanda tangan tidak valid"}
        }
        return kunciRahasia, nil
    })
    if err != nil || !token.Valid {
        return "", &httpError{401, "token tidak valid"}
    }
    klaim, _ := token.Claims.(jwt.MapClaims)
    return klaim["sub"].(string), nil
}

type httpError struct {
    Kode int
    Msg  string
}

func (e *httpError) Error() string { return e.Msg }

func _tulisJSON(w http.ResponseWriter, v any) {
    _ = json.NewEncoder(w).Encode(v)
}`,
      explain: [
        'CORS dibatasi ke domain tepercaya — jangan pakai <code>*</code> untuk endpoint berautentikasi.',
        'Validasi input menolak data buruk sejak awal sebelum menyentuh database.',
        'Verifikasi JWT harus memeriksa <b>algoritma</b> tanda tangan, bukan sekadar keabsahan token.',
        'Kunci rahasia JWT diambil dari environment variable, jangan ditulis di kode.',
        'Selalu gunakan HTTPS agar token tidak disadap di tengah jalan.'
      ]
    },
    {
      type: 'tip',
      title: 'Rahasia lewat environment, bukan kode',
      text: 'Kata sandi database, kunci JWT, dan API key jangan pernah masuk repositori. Bacalah dari environment variable (<code>os.Getenv</code>) atau manajer rahasia. Tambahkan <code>.env</code> ke <code>.gitignore</code> dan <code>.dockerignore</code>.'
    },
    {
      type: 'warn',
      title: 'golang-jwt v5: periksa klaim, bukan hanya Valid',
      text: 'Mulai versi v5, <code>token.Valid</code> sudah memeriksa masa berlaku, tetapi kamu tetap wajib memeriksa <b>audience</b>, <b>issuer</b>, dan <b>algoritma</b> sesuai kebutuhan. Jangan pernah memakai <code>ParseUnverified</code> untuk autentikasi.'
    },
    {
      type: 'vocab',
      items: [
        ['Docker', 'Alat mengemas aplikasi beserta lingkungannya menjadi image.'],
        ['Multi-stage build', 'Teknik Docker memakai beberapa tahap; hanya hasil akhir disimpan.'],
        ['Distroless', 'Image dasar minimalis tanpa shell/paket, memperkecil permukaan serang.'],
        ['CI/CD', 'Otomatisasi uji, build, dan rilis setiap perubahan kode.'],
        ['Race detector', 'Alat (-race) pendeteksi race condition saat pengujian.'],
        ['SQL Injection', 'Serangan menyisipkan perintah SQL lewat input pengguna.'],
        ['Prepared statement', 'Kueri dengan placeholder sehingga data terpisah dari kode SQL.'],
        ['CORS', 'Aturan browser soal domain mana yang boleh mengakses API.'],
        ['JWT', 'Token bertanda tangan untuk autentikasi berbasis klaim.'],
        ['gofmt / go vet', 'Alat format & analisis statis bawaan Go.']
      ]
    }
  ],
  recap: [
    'Multi-stage build menghasilkan image Docker sangat kecil dari biner Go.',
    'CGO_ENABLED=0 dan -ldflags="-s -w" membuat biner statis dan ringan.',
    'CI/CD mengotomatiskan gofmt, go vet, dan go test -race setiap perubahan.',
    'Cegah SQL Injection dengan prepared statement, jangan merangkai string kueri.',
    'Batasi CORS, validasi input, dan verifikasi JWT dengan benar.',
    'Simpan rahasia di environment variable, bukan di kode atau repositori.'
  ]
});
