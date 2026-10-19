/* ============================================================
   Pelajaran Microservices — Bab 9: Keamanan Microservices
   ============================================================ */
'use strict';

window.MICROSERVICE_LESSONS = window.MICROSERVICE_LESSONS || [];

window.MICROSERVICE_LESSONS.push({
  id: 'keamanan-microservices',
  title: 'Keamanan Microservices: JWT, RBAC & Secret Management',
  chapter: 'Keamanan & Pengujian',
  duration: '13–15 menit',
  intro: [
    'Setiap microservice adalah pintu masuk baru bagi penyerang. Di monolith, satu lapis keamanan mungkin cukup; di microservices, catalog-service menerima request anonim, order-service memegang data pemesanan pelanggan, dan notification-service memegang kredensial broker — masing-masing wajib berdiri sendiri dengan pertahanannya.',
    'Bab ini merangkum paket keamanan wajib OMS: HTTPS, autentikasi JWT yang divalidasi ketat, otorisasi berbasis role, autentikasi antar-service, pengelolaan secret, sampai penangkal SQL injection dan denial of service. Prinsipnya: <b>jangan pernah mempercayai input</b>, <b>beri hak serendah mungkin</b>, dan <b>jangan biarkan rahasia tersimpan di tempat yang salah</b> — termasuk di source code dan di log.'
  ],
  objectives: [
    'Membedakan authentication dengan authorization dan memilih HS256 atau RS256 sesuai skala tim',
    'Menulis middleware validasi JWT dengan golang-jwt v5 yang memeriksa signature, expiry, issuer, dan audience',
    'Menerapkan role-based access control dan rate limiting pada rute Go',
    'Mengelola secret dengan aman dan memindai kerentanan dependensi memakai govulncheck'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>HTTPS, Authentication, dan Authorization</h3><p><b>TLS/HTTPS</b> mengenkripsi jalur komunikasi antara klien dan service, sekaligus memastikan klien bicara dengan server yang benar lewat sertifikat. Tanpa TLS, token JWT pada header <code>Authorization</code> bisa dibaca penyadap jaringan; di komunikasi antar-service pun TLS (khususnya mTLS) layak dipertimbangkan.</p><ul><li><b>Authentication (authn)</b> — <i>siapa kamu?</i> Memverifikasi identitas: mencocokkan password, memvalidasi JWT, atau memeriksa sertifikat client.</li><li><b>Authorization (authz)</b> — <i>bolehkah kamu?</i> Memverifikasi hak: apakah role customer boleh menghapus produk? Apakah service order boleh membaca katalog?</li></ul><p>Urutannya selalu authn lebih dulu, lalu authz. JWT yang valid menjawab authn; middleware role yang menyusul menjawab authz.</p>'
    },
    {
      type: 'text',
      html: '<h3>Anatomi JWT: Header, Payload, Signature</h3><p><b>JSON Web Token</b> adalah string tiga bagian yang dipisahkan titik: <code>header.payload.signature</code>. Masing-masing bagian adalah JSON yang di-encode base64url — sehingga <b>mudah dibaca siapa pun</b>. Jangan pernah menaruh data rahasia di dalamnya.</p><ul><li><b>Header</b> — metadata algoritma: <code>{"alg":"HS256","typ":"JWT"}</code>.</li><li><b>Payload</b> — klaim: <code>sub</code> (pengguna), <code>iss</code> (penerbit), <code>aud</code> (penerima), <code>exp</code> (kedaluwarsa), plus klaim kustom seperti <code>role</code>.</li><li><b>Signature</b> — hasil penandaan header dan payload dengan kunci rahasia; satu-satunya bagian yang membuat token tidak bisa dipalsukan.</li></ul><p><b>HS256</b> (HMAC) memakai satu kunci simetris dan cukup bila hanya catalog-service yang memverifikasi. <b>RS256</b> (RSA) memisahkan kunci privat penanda dan kunci publik verifier — unggul ketika banyak service harus memverifikasi, karena kebocoran satu service tidak membuka pintu pemalsuan token.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Middleware Validasi JWT dengan golang-jwt v5',
      lang: 'go',
      output: false,
      code: `package middleware

import (
    "context"
    "fmt"
    "log/slog"
    "net/http"
    "strings"
    "time"
    "github.com/golang-jwt/jwt/v5"
)

type ctxKey string
const claimsKey ctxKey = "app-claims"

type AppClaims struct {
    UserID int64  \`json:"uid"\`
    Role   string \`json:"role"\`
    jwt.RegisteredClaims
}

func Auth(secret []byte) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            header := r.Header.Get("Authorization")
            if !strings.HasPrefix(header, "Bearer ") {
                http.Error(w, \`{"error":"token tidak ditemukan"}\`, http.StatusUnauthorized)
                return
            }
            claims := &AppClaims{}
            token, err := jwt.ParseWithClaims(strings.TrimPrefix(header, "Bearer "),
                claims, keyFunc(secret),
                jwt.WithIssuer("oms-auth"),     // iss wajib cocok
                jwt.WithAudience("oms-api"),    // aud wajib cocok
                jwt.WithExpirationRequired(),   // token tanpa exp ditolak
                jwt.WithLeeway(30*time.Second), // toleransi clock skew
            )
            if err != nil || !token.Valid {
                slog.Warn("token ditolak", "alasan", fmt.Sprintf("%v", err))
                http.Error(w, \`{"error":"token tidak valid"}\`, http.StatusUnauthorized)
                return
            }
            ctx := context.WithValue(r.Context(), claimsKey, claims)
            next.ServeHTTP(w, r.WithContext(ctx))
        })
    }
}

// keyFunc menolak selain HMAC — mencegah serangan alg confusion.
func keyFunc(secret []byte) jwt.Keyfunc {
    return func(t *jwt.Token) (any, error) {
        if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, fmt.Errorf("alg tidak dikenal: %v", t.Header["alg"])
        }
        return secret, nil
    }
}`,
      explain: [
        'Dalam golang-jwt v5, <code>exp</code> sudah divalidasi otomatis oleh <code>ParseWithClaims</code>; <code>WithExpirationRequired</code> menambah aturan bahwa token tanpa <code>exp</code> sama sekali ditolak — cocok untuk token akses singkat umur.',
        '<code>WithIssuer</code> dan <code>WithAudience</code> mencegah token dari sistem lain diterima oleh produksi hanya karena signature-nya valid; <code>keyFunc</code> menolak algoritme tak terduga sehingga serangan <i>alg confusion</i> gugur, dan catatan log hanya memuat ALASAN penolakan — bukan nilai token mentah. Claims disimpan di <code>context</code> sehingga handler lanjutan (termasuk middleware role) cukup membacanya tanpa memparse ulang token.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh: Role-Based Access Control pada Rute catalog-service',
      lang: 'go',
      output: false,
      code: `func RequireRole(roles ...string) func(http.Handler) http.Handler {
    allowed := make(map[string]struct{}, len(roles))
    for _, role := range roles {
        allowed[role] = struct{}{}
    }
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            claims, ok := r.Context().Value(claimsKey).(*AppClaims)
            if !ok {
                http.Error(w, \`{"error":"belum terautentikasi"}\`, http.StatusUnauthorized)
                return
            }
            if _, ok := allowed[claims.Role]; !ok {
                slog.Warn("otorisasi ditolak", "role", claims.Role, "path", r.URL.Path)
                http.Error(w, \`{"error":"role tidak berwenang"}\`, http.StatusForbidden)
                return
            }
            next.ServeHTTP(w, r)
        })
    }
}

// Pemasangan rute: baca untuk semua role login, tulis hanya admin.
mux.Handle("POST /products", auth(RequireRole("admin")(CreateProduct(svc))))
mux.Handle("DELETE /products/{id}", auth(RequireRole("admin")(DeleteProduct(svc))))
mux.Handle("GET /products", auth(ListProducts(svc))) // semua role login`,
      explain: [
        'Urutan middleware menentukan urutan pemeriksaan: <code>Auth</code> dulu (siapa kamu), baru <code>RequireRole</code> (bolehkah kamu). Prinsip least privilege: baca untuk semua role login, tulis hanya admin.',
        'Setiap penolakan dicatat dengan role dan path — bahan berharga saat audit atau menyelidiki insiden; role baru ditambahkan tanpa mengubah kode middleware.'
      ]
    },
    {
      type: 'text',
      html: '<h3>OAuth 2.0, OpenID Connect, dan Kepercayaan Antar-Service</h3><p><b>OAuth 2.0</b> adalah kerangka otorisasi; alur <i>authorization code</i> bekerja begini: aplikasi mengarahkan pengguna ke halaman login penyedia dengan <code>response_type=code</code>, pengguna menyetujui izin, penyedia mengirim <b>kode autorisasi</b> ke <code>redirect_uri</code>, lalu aplikasi menukar kode itu (lewat back-channel, disertai <code>client_id</code> dan <code>client_secret</code>) menjadi <b>access token</b> dan <b>refresh token</b>. <b>OpenID Connect</b> adalah lapisan identitas di atasnya: ia menambahkan <b>ID token</b> berisi profil pengguna (<code>sub</code>, <code>email</code>). Pembeda kuncinya: <i>access token untuk API, ID token untuk aplikasi</i> — jangan pernah memakai ID token sebagai bukti otorisasi ke endpoint kamu.</p><p>Validasi JWT pengguna belum menutup celah antar-service. Dua pendekatan yang lazim: <b>token internal</b> — setiap service memperoleh service token (JWT dengan <code>sub</code> berisi nama service) dari endpoint khusus, lalu mengirimnya sebagai <code>Authorization: Bearer</code> pada tiap panggilan; dan <b>mTLS</b> — setiap service memegang sertifikat sendiri dan kedua sisi saling memverifikasi pada level transport. Prinsipnya sama: <b>kepercayaan tidak diberikan hanya karena berada di jaringan internal</b>. Untuk skala OMS, token internal sudah memadai; mTLS menyusul saat kepatuhan menuntutnya.</p>'
    },
    {
      type: 'warn',
      title: 'Perhatian: Secret Boleh di Mana-mana, Kecuali di Source Code',
      text: 'Jangan pernah menulis JWT secret, password database, atau token RabbitMQ langsung di file Go, compose.yaml, atau konfigurasi lain yang masuk Git. Repo sering dibaca orang baru, bocor lewat fork, atau menyimpan riwayat file yang sudah dihapus. Secret hanya boleh hidup di environment variable, Docker/Kubernetes secret, atau secret manager — source code cukup <b>membacanya</b>, bukan memilikinya.'
    },
    {
      type: 'example',
      title: 'Contoh: Membaca Secret dari Environment dengan Gagal Cepat',
      lang: 'go',
      output: false,
      code: `package config

import ("fmt"
    "os"
)

func FromEnv() (Config, error) {
    secret := os.Getenv("JWT_SECRET")
    if len(secret) < 32 {
        return Config{}, fmt.Errorf("JWT_SECRET wajib diisi, minimal 32 karakter")
    }
    return Config{
        HTTPPort:    getenv("HTTP_PORT", "8081"),
        DatabaseURL: os.Getenv("DATABASE_URL"),
        RabbitMQURL: os.Getenv("RABBITMQ_URL"),
        JWTSecret:   []byte(secret),
    }, nil
}`,
      explain: [
        'Service tidak menyimpan secret — ia hanya membaca dari environment saat startup; nilainya dipasok berbeda per lingkungan (.env untuk pengembangan, secret manager untuk produksi). Helper <code>getenv</code> mengembalikan nilai bawaan bila variabel kosong.',
        'Gagal cepat lebih baik daripada berjalan dengan secret kosong: aplikasi mati dengan pesan jelas, bukan membanjiri log dengan error autentikasi. Panjang minimum 32 karakter menahan kunci lemah hasil copy-paste.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh: Docker Secrets dan Menjaga Secret Keluar dari Git',
      lang: 'bash',
      output: false,
      code: `# 1. Buat berkas secret secara lokal (tidak masuk Git)
mkdir -p secrets
openssl rand -base64 32 > secrets/jwt_secret.txt

# 2. compose.yaml: catalog memakai secrets: [jwt_secret], berkasnya
#    dideklarasikan file: ./secrets/jwt_secret.txt (di /run/secrets/)

# 3. Pastikan berkas secret tidak pernah ter-commit
printf 'secrets/\\n.env\\n' >> .gitignore

# 4. Produksi: ganti dengan secret manager (Vault, AWS SM) yang di-inject saat runtime`,
      explain: [
        'Docker secrets menampilkan nilai sebagai file di dalam container, bukan environment variable yang mudah terekam di <code>docker inspect</code>; baris .gitignore adalah jaring pengaman terakhir sebelum rahasia ikut ter-commit.',
        'Secret manager memberi rotasi otomatis dan jejak audit — dua hal yang tidak dimiliki berkas statis atau environment variable biasa.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Penangkal SQL Injection dan Batas Ukuran Request</h3><p><b>SQL injection</b> terjadi ketika string dari pengguna menyusun teks query. Go mencegahnya dengan parameterized query — nilai dikirim terpisah oleh driver dan selalu diperlakukan sebagai data:</p><pre><code>// SALAH — nama bisa berisi: x&apos; OR &apos;1&apos;=&apos;1; DROP TABLE products;--\nq := "SELECT id FROM products WHERE name = \'" + nama + "\'"\n\n// BENAR — pgx mengirim template dan nilai secara terpisah\nrow := db.QueryRowContext(ctx,\n    "SELECT id FROM products WHERE name = $1", nama)</code></pre><p>Di ujung lain, tahan beban berlebih dengan membatasi ukuran body sejak awal handler, sebelum JSON diparse:</p><pre><code>r.Body = http.MaxBytesReader(w, r.Body, 1<<20) // maksimal 1 MiB\nif err := json.NewDecoder(r.Body).Decode(&req); err != nil {\n    http.Error(w, \`{"error":"body terlalu besar"}\`, http.StatusBadRequest)\n    return\n}</code></pre><p><code>MaxBytesReader</code> memotong upload raksasa sehingga decoder tidak pernah menghabiskan memori — perlindungan sederhana terhadap denial of service.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Rate Limiting Token Bucket per IP',
      lang: 'go',
      output: false,
      code: `func RateLimit(rps float64, burst int) func(http.Handler) http.Handler {
    var mu sync.Mutex
    limiters := make(map[string]*rate.Limiter)
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            ip, _, _ := net.SplitHostPort(r.RemoteAddr)
            mu.Lock()
            lim, ok := limiters[ip]
            if !ok {
                lim = rate.NewLimiter(rate.Limit(rps), burst)
                limiters[ip] = lim
            }
            mu.Unlock()
            if !lim.Allow() {
                http.Error(w, \`{"error":"terlalu banyak request"}\`, http.StatusTooManyRequests)
                return
            }
            next.ServeHTTP(w, r)
        })
    }
}`,
      explain: [
        'Token bucket dari <code>golang.org/x/time/rate</code> dibuat per IP: penyerang brute-force dan lonjakan trafik tidak merata ke service, sementara pengguna wajar jarang terkena.',
        'Balas <code>429 Too Many Requests</code> agar klien tahu harus menunggu; di produksi disertai header <code>Retry-After</code> dan evaluasi penyimpanan bucket di Redis bila service berjalan lebih dari satu instance.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Audit Logging dan Pemindaian Kerentanan</h3><p>Log harian menjawab <i>apa yang sedang terjadi</i>; <b>audit log</b> menjawab <i>siapa mengubah apa, kapan, dan bagaimana hasilnya</i>. Catat setiap aksi sensitif — pembuatan dan penghapusan produk, perubahan status order, penolakan otorisasi:</p><pre><code>slog.Info("audit",\n  "aksi", "product.create",\n  "aktor", claims.UserID,\n  "role", claims.Role,\n  "target", "products/42",\n  "hasil", "sukses",\n  "request_id", r.Header.Get("X-Request-ID"))</code></pre><p>Keamanan juga mencakup dependensi: setiap rilis library membawa celah baru yang bisa masuk lewat rantai import. Go menyediakan pemeriksa resmi:</p><pre><code>go install golang.org/x/vuln/cmd/govulncheck@latest\ngovulncheck ./...</code></pre><p><code>govulncheck</code> memeriksa apakah fungsi yang mengandung kerentanan benar-benar dipanggil kode kamu — jauh lebih tajam daripada memindai daftar versi. Jadwalkan di GitHub Actions agar build gagal otomatis saat celah kritis muncul.</p>'
    },
    {
      type: 'warn',
      title: 'Perhatian: Token Tidak Pernah Masuk ke Log',
      text: 'Jangan pernah mencatat nilai token, cookie, password, atau header <code>Authorization</code> ke log — termasuk saat debugging. Log diteruskan ke sistem agregasi (Loki, CloudWatch) yang diakses banyak orang dan disimpan bertahun-tahun. Cukup catat <i>token ditolak, alasan expired</i> atau ID pengguna dari claims; nilai mentahnya biarlah hilang selamanya.'
    },
    {
      type: 'tip',
      title: 'Latihan',
      text: 'Pasang middleware Auth dan RequireRole pada catalog-service: buat dua akun (admin dan customer), lalu buktikan dengan curl bahwa POST /products mengembalikan 401 tanpa token, 403 dengan token customer, dan 201 dengan token admin. Terakhir, jalankan govulncheck ./... dan catat setiap temuan berstatus kritis.'
    },
    {
      type: 'vocab',
      items: [
        ['JWT', 'JSON Web Token: token tiga bagian (header, payload, signature) yang ditandatangani kriptografis.'],
        ['HS256 vs RS256', 'HS256 memakai satu kunci simetris; RS256 memisahkan kunci privat penanda dan kunci publik verifier.'],
        ['OAuth 2.0 & OIDC', 'OAuth 2.0 = kerangka otorisasi (authorization code); OIDC menambahkan identitas lewat ID token.'],
        ['RBAC', 'Role-based access control: izin ditentukan dari role pengguna pada klaim token; mTLS adalah mutual TLS antar-service.'],
        ['govulncheck', 'Alat resmi Go untuk memindai kerentanan dependensi beserta cek pemakaian kode rentan.']
      ]
    }
  ],
  recap: [
    'Authentication menjawab siapa kamu, authorization menjawab bolehkah kamu; HTTPS/TLS melindungi keduanya dari penyadapan.',
    'JWT terdiri dari header, payload, dan signature; middleware Auth dengan golang-jwt v5 memeriksa signature, expiry, issuer, dan audience, lalu RequireRole menyaring berdasarkan role.',
    'OAuth 2.0 mengatur otorisasi dan OIDC mengatur identitas; antar-service OMS dipercayai lewat token internal atau mTLS, bukan sekadar karena berada di jaringan yang sama.',
    'Secret cukup dibaca dari environment atau Docker secrets — jangan pernah di source code, dan jangan pernah mencatat token ke log.',
    'Parameterized query ($1) menangkal SQL injection, rate limiting dan http.MaxBytesReader menahan beban berlebih, govulncheck menjaga dependensi tetap bersih.'
  ]
});
