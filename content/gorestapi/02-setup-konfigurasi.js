/* ============================================================
   Pelajaran Go REST API — Bab 2: Setup Proyek & Konfigurasi
   ============================================================ */
'use strict';

window.GORESTAPI_LESSONS = window.GORESTAPI_LESSONS || [];

window.GORESTAPI_LESSONS.push({
  id: 'restapi-setup-konfigurasi',
  title: 'Setup Proyek Modular & Konfigurasi (.env)',
  chapter: 'Setup Proyek',
  duration: '10 menit',
  intro: [
    'Sebelum menulis kode API, siapkan dulu kerangka proyeknya: <b>Go modules</b> untuk dependensi, struktur folder yang modular, dan <b>paket config</b> yang membaca pengaturan dari environment variable.',
    'Pemisahan konfigurasi dari kode membuat aplikasi mudah dipindah antar lingkungan (lokal, staging, produksi) tanpa mengubah kode.'
  ],
  objectives: [
    'Menginisialisasi Go module dan menambah dependensi',
    'Menyusun struktur folder cmd/ dan internal/',
    'Membaca environment variable dengan os.Getenv',
    'Membuat parser .env sederhana tanpa library'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Inisialisasi Proyek</h3><p>Setiap proyek Go dimulai dengan <code>go mod init</code>. Perintah ini membuat <code>go.mod</code> yang mencatat nama module dan versi Go yang dipakai — inilah "jati diri" proyek yang membuat import antar-package saling terhubung.</p>'
    },
    {
      type: 'example',
      title: 'Inisialisasi & menambah dependensi',
      lang: 'bash',
      output: false,
      code: `# Buat folder proyek
mkdir go-restapi && cd go-restapi

# Inisialisasi module (nama bebas, biasanya alamat repo)
go mod init example.com/go-restapi

# Tambah dependensi yang dibutuhkan
go get github.com/go-sql-driver/mysql    # driver MariaDB
go get github.com/golang-jwt/jwt/v5      # library JWT
go get golang.org/x/crypto/bcrypt        # hash password`,
      explain: [
        '<code>go mod init</code> membuat file <code>go.mod</code> (dan nanti <code>go.sum</code> untuk checksum).',
        '<code>go get</code> mengunduh dependensi dan mencatatnya di go.mod.',
        'Keduanya wajib di-commit ke git agar tim memakai versi dependensi yang sama.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Konfigurasi lewat Environment Variable</h3><p>Jangan pernah menanam password atau secret langsung di kode. Praktik yang benar: baca dari <b>environment variable</b>. Di Go, caranya mudah dengan <code>os.Getenv</code> — dan kita bungkus dengan fungsi bantuan yang mendukung nilai default.</p>'
    },
    {
      type: 'example',
      title: 'Fungsi bantuan untuk membaca env dengan default',
      lang: 'go',
      output: false,
      code: `package config

import "os"

// getEnv mengembalikan nilai dari environment variable,
// atau fallback jika kosong/tidak diset.
func getEnv(key, fallback string) string {
    if v, ok := os.LookupEnv(key); ok && v != "" {
        return v
    }
    return fallback
}`,
      explain: [
        '<code>os.LookupEnv</code> mengembalikan (nilai, ada-tidaknya) — berbeda dengan <code>os.Getenv</code> yang hanya mengembalikan string kosong.',
        'Kita menganggap nilai kosong = tidak diset, sehingga fallback dipakai.',
        'Dengan begini, aplikasi tetap jalan walau env tidak diset sama sekali (mode development).'
      ]
    },
    {
      type: 'text',
      html: '<h3>Parser .env Sederhana</h3><p>Agar nyaman saat development, kita buat pembaca file <code>.env</code> kecil tanpa library eksternal. Formatnya sederhana: satu <code>KEY=VALUE</code> per baris, baris kosong dan komentar (<code>#</code>) diabaikan. Penting: nilai yang <b>sudah</b> diset secara eksternal tidak boleh ditimpa.</p>'
    },
    {
      type: 'example',
      title: 'Membaca file .env tanpa library',
      lang: 'go',
      output: false,
      code: `func loadDotEnv(path string) {
    data, err := os.ReadFile(path)
    if err != nil {
        return // file .env opsional — abaikan jika tidak ada
    }
    for _, line := range strings.Split(string(data), "\\n") {
        line = strings.TrimSpace(line)
        if line == "" || strings.HasPrefix(line, "#") {
            continue
        }
        key, val, found := strings.Cut(line, "=")
        if !found {
            continue
        }
        key = strings.TrimSpace(key)
        val = strings.Trim(strings.TrimSpace(val), \`"'\`)
        if _, exists := os.LookupEnv(key); !exists {
            os.Setenv(key, val)
        }
    }
}`,
      explain: [
        '<code>strings.Cut</code> memisah baris menjadi bagian sebelum "=" dan sesudahnya.',
        'Nilai dibersihkan dari tanda kutip pembungkus (<code>strings.Trim</code>).',
        'Baris terakhir <code>if _, exists := os.LookupEnv(key); !exists</code> memastikan env eksternal tidak ditimpa file .env.'
      ]
    },
    {
      type: 'example',
      title: 'Isi file .env untuk development',
      lang: 'bash',
      output: false,
      code: `APP_PORT=8080
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=root
DB_NAME=gorestapi_app
JWT_SECRET=dev-secret-ganti-saya
JWT_EXPIRY_MINUTES=60`,
      explain: [
        'Salin <code>.env.example</code> menjadi <code>.env</code>, lalu sesuaikan.',
        '<code>.env</code> berisi rahasia → masukkan ke <code>.gitignore</code>, jangan di-commit.',
        'Di produksi, env diset oleh sistem (Docker/Kubernetes), bukan file .env.'
      ]
    },
    {
      type: 'example',
      title: 'Struct Config yang menggabungkan semuanya',
      lang: 'go',
      output: false,
      code: `type Config struct {
    Port      string
    DBHost    string
    DBPort    string
    DBUser    string
    DBPass    string
    DBName    string
    JWTSecret string
    JWTExpiry time.Duration
}

func Load() (*Config, error) {
    loadDotEnv(".env")

    expiryMin, err := strconv.Atoi(getEnv("JWT_EXPIRY_MINUTES", "60"))
    if err != nil || expiryMin <= 0 {
        return nil, fmt.Errorf("JWT_EXPIRY_MINUTES tidak valid")
    }

    return &Config{
        Port:      getEnv("APP_PORT", "8080"),
        DBHost:    getEnv("DB_HOST", "localhost"),
        DBUser:    getEnv("DB_USER", "root"),
        DBPass:    getEnv("DB_PASS", "root"),
        DBName:    getEnv("DB_NAME", "gorestapi_app"),
        JWTSecret: getEnv("JWT_SECRET", "dev-secret-ganti-saya"),
        JWTExpiry: time.Duration(expiryMin) * time.Minute,
    }, nil
}`,
      explain: [
        '<code>Load()</code> mengembalikan struct siap pakai + error bila konfigurasi tidak valid.',
        'Mengubah string menit menjadi <code>time.Duration</code> memudahkan pemakaian berikutnya.',
        'Seluruh package lain cukup menerima <code>*Config</code> — tidak ada <code>os.Getenv</code> tersebar di mana-mana.'
      ]
    },
    {
      type: 'tip',
      title: 'Kenapa membungkus os.Getenv?',
      text: 'Memanggil <code>os.Getenv</code> langsung di banyak tempat menyulitkan pengujian (harus menyetel env di test). Dengan satu titik <code>config.Load()</code>, konfigurasi bisa dipassing ke mana pun dan mudah dimock saat unit test.'
    },
    {
      type: 'warn',
      title: 'Jangan commit rahasia',
      text: 'File <code>.env</code> berisi password dan JWT secret. Selalu daftarkan di <code>.gitignore</code>, dan commit hanya <code>.env.example</code> (berisi placeholder). Kebocoran secret di repository publik adalah penyebab kebocoran data yang paling umum.'
    },
    {
      type: 'vocab',
      items: [
        ['go.mod', 'File daftar module & dependensi proyek Go.'],
        ['Environment variable', 'Pasangan KEY=VALUE dari sistem operasi, dibaca via os.Getenv.'],
        ['.env', 'File berisi env untuk development; tidak di-commit ke git.'],
        ['internal/', 'Direktori package yang tidak bisa di-import luar — menyembunyikan detail.'],
        ['time.Duration', 'Tipe Go untuk jarak waktu, mis. 5 * time.Minute.']
      ]
    }
  ],
  recap: [
    'Proyek dimulai dengan go mod init; dependensi ditambah dengan go get.',
    'Struktur cmd/ (executable) + internal/ (implementasi privat) menjaga proyek modular.',
    'Konfigurasi dibaca dari environment variable dengan fallback default.',
    'Parser .env kecil bisa dibuat tanpa library, dengan aturan tidak menimpa env eksternal.'
  ]
});
