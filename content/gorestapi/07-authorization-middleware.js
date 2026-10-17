/* ============================================================
   Pelajaran Go REST API — Bab 7: Authorization & Middleware
   ============================================================ */
'use strict';

window.GORESTAPI_LESSONS = window.GORESTAPI_LESSONS || [];

window.GORESTAPI_LESSONS.push({
  id: 'restapi-authorization-middleware',
  title: 'Middleware, Authorization & Role-Based Access',
  chapter: 'Keamanan',
  duration: '12 menit',
  intro: [
    'Setelah token diverifikasi, perintah berikutnya adalah memeriksa <b>hak akses</b>: apakah user ini boleh melakukan aksi yang diminta? Di Go, pemeriksaan berulang seperti ini paling tepat ditempatkan di <b>middleware</b>.',
    'Pelajaran ini membangun middleware <code>Authenticate</code> (verifikasi JWT) dan <code>RequireRole</code> (cek peran), lalu menyusunnya menjadi rantai yang rapi di router.'
  ],
  objectives: [
    'Memahami pola middleware dan middleware chaining',
    'Menyimpan data di context request',
    'Menerapkan middleware JWT pada route terproteksi',
    'Membatasi akses berdasarkan peran (admin vs user)',
    'Menyusun urutan middleware yang benar'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Apa itu Middleware?</h3><p><b>Middleware</b> adalah handler yang membungkus handler lain. Ia menjalankan logika umum <b>sebelum</b> (dan/atau sesudah) handler asli — mis. logging, verifikasi token, atau pengecekan peran. Pola Go yang membuat ini mungkin: <b>menerima handler, mengembalikan handler baru</b>.</p>'
    },
    {
      type: 'example',
      title: 'Bentuk dasar middleware di Go',
      lang: 'go',
      output: false,
      code: `func Logging(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        next.ServeHTTP(w, r) // lanjutkan ke handler berikutnya
        log.Printf("%s %s (%s)", r.Method, r.URL.Path, time.Since(start))
    })
}`,
      explain: [
        'Middleware menerima <code>next http.Handler</code> — handler yang harus dipanggil setelahnya.',
        'Ia mengembalikan handler baru yang sudah "dibungkus".',
        'Panggilan <code>next.ServeHTTP(w, r)</code> melanjutkan rantai; jika tidak dipanggil, rantai berhenti (dipakai untuk menolak request).'
      ]
    },
    {
      type: 'text',
      html: '<h3>Menyimpan Data di Context</h3><p>Middleware verifikasi token perlu meneruskan hasilnya (klaim user) ke handler. Caranya lewat <b>context request</b> — wadah key-value yang mengalir bersama request. Karena context bersifat generik, gunakan <b>tipe key khusus</b> agar tidak bentrok dengan pihak lain.</p>'
    },
    {
      type: 'example',
      title: 'Context key khusus & menyimpan klaim',
      lang: 'go',
      output: false,
      code: `// Tipe key khusus mencegah tabrakan dengan konteks lain.
type contextKey string
const claimsKey contextKey = "claims"

func Authenticate(v TokenValidator) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            // 1) Baca header Authorization
            header := r.Header.Get("Authorization")
            if !strings.HasPrefix(header, "Bearer ") {
                writeJSON(w, http.StatusUnauthorized, "token tidak diberikan")
                return // rantai BERHENTI di sini
            }
            raw := strings.TrimSpace(strings.TrimPrefix(header, "Bearer "))

            // 2) Verifikasi token
            claims, err := v.ParseToken(r.Context(), raw)
            if err != nil {
                writeJSON(w, http.StatusUnauthorized, "token tidak valid")
                return
            }

            // 3) Simpan klaim ke context, lalu lanjutkan
            ctx := context.WithValue(r.Context(), claimsKey, claims)
            next.ServeHTTP(w, r.WithContext(ctx))
        })
    }
}`,
      explain: [
        'Jika token tidak sah, middleware membalas 401 dan TIDAK memanggil next → handler tidak pernah tahu request itu ada.',
        '<code>context.WithValue</code> menghasilkan context baru; <code>r.WithContext(ctx)</code> membuat request baru membawanya.',
        'Tipe key khusus (bukan string biasa) adalah konvensi aman agar key tidak bentrok.'
      ]
    },
    {
      type: 'example',
      title: 'Mengambil klaim kembali di handler',
      lang: 'go',
      output: false,
      code: `func ClaimsFromContext(ctx context.Context) *service.Claims {
    claims, _ := ctx.Value(claimsKey).(*service.Claims)
    return claims // nil jika tidak ada
}

// Dipakai di handler mana pun yang butuh identitas user:
func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
    claims := middleware.ClaimsFromContext(r.Context())
    if claims == nil {
        writeError(w, http.StatusUnauthorized, "belum login")
        return
    }
    writeJSON(w, http.StatusOK, map[string]any{
        "user_id": claims.UserID,
        "role":    claims.Role,
    })
}`,
      explain: [
        'Type assertion <code>.(*service.Claims)</code> mengubah nilai context kembali menjadi tipe aslinya.',
        'Handler tidak perlu tahu cara membaca header Authorization — cukup ambil dari context.',
        'Karena ditulis dalam helper, pemakaiannya bersih dan aman (null-check otomatis).'
      ]
    },
    {
      type: 'text',
      html: '<h3>Authorization Berbasis Peran (RBAC)</h3><p>Pemeriksaan peran dibuat sebagai middleware terpisah agar bisa dipakai ulang. Prinsipnya sederhana: baca peran dari context, cocokkan dengan peran yang diminta, tolak jika tidak sesuai.</p>'
    },
    {
      type: 'example',
      title: 'Middleware RequireRole',
      lang: 'go',
      output: false,
      code: `func RequireRole(role string) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            claims := ClaimsFromContext(r.Context())
            if claims == nil || claims.Role != role {
                writeJSON(w, http.StatusForbidden,
                    "akses ditolak: peran tidak mencukupi")
                return
            }
            next.ServeHTTP(w, r)
        })
    }
}`,
      explain: [
        'Peran dibuat parametrik (<code>role string</code>) sehingga bisa dipakai untuk admin, manager, dll.',
        'Status yang dipakai <b>403 Forbidden</b> — bedakan dengan 401 (belum/tidak berhasil autentikasi).',
        'Pemeriksaan ini mengasumsikan Authenticate sudah berjalan lebih dulu (klaim sudah ada).'
      ]
    },
    {
      type: 'text',
      html: '<h3>Menyusun Rantai di Router</h3><p>Kekuatan pola ini terlihat saat penyusunan: cukup "membungkus" handler dengan middleware yang diinginkan. Urutan baca dari luar ke dalam: <code>Authenticate</code> dulu (verifikasi token), baru <code>RequireRole</code> (cek peran).</p>'
    },
    {
      type: 'example',
      title: 'Penerapan di router',
      lang: 'go',
      output: false,
      code: `authMw := middleware.Authenticate(auth)

// Publik — tanpa token
mux.HandleFunc("GET /api/v1/products",      prodH.List)
mux.HandleFunc("GET /api/v1/products/{id}", prodH.Get)

// Butuh token valid saja
mux.Handle("GET /api/v1/auth/me",
    authMw(http.HandlerFunc(authH.Me)))

// Butuh token valid DAN peran admin
adminOnly := func(h http.Handler) http.Handler {
    return authMw(middleware.RequireRole(model.RoleAdmin)(h))
}
mux.Handle("POST   /api/v1/products",      adminOnly(http.HandlerFunc(prodH.Create)))
mux.Handle("PUT    /api/v1/products/{id}", adminOnly(http.HandlerFunc(prodH.Update)))
mux.Handle("DELETE /api/v1/products/{id}", adminOnly(http.HandlerFunc(prodH.Delete)))`,
      explain: [
        'Route publik didaftarkan langsung; route terproteksi dibungkus middleware.',
        'Admin route = dua lapis: Authenticate lalu RequireRole.',
        'Urutan yang benar penting: RequireRole dulu tanpa Authenticate akan selalu 403 (klaim masih nil).'
      ]
    },
    {
      type: 'example',
      title: 'Peta akses aplikasi',
      lang: 'text',
      output: false,
      code: `Method   Endpoint                    Akses
------   --------------------------  ------------------------
POST     /api/v1/auth/register       publik
POST     /api/v1/auth/login          publik
GET      /api/v1/products            publik
GET      /api/v1/products/{id}       publik
GET      /api/v1/auth/me             login (token valid)
POST     /api/v1/products            admin
PUT      /api/v1/products/{id}       admin
DELETE   /api/v1/products/{id}       admin`,
      explain: [
        'Membaca produk terbuka untuk umum; mengubah data hanya admin.',
        'Setiap baris di atas diterjemahkan menjadi satu baris kode di router.',
        'Meninjau tabel ini secara berkala membantu memastikan tidak ada endpoint yang "terbuka" tanpa sengaja.'
      ]
    },
    {
      type: 'tip',
      title: 'Middleware berantai untuk logging',
      text: 'Karena middleware berbentuk fungsi, middleware lain bisa membungkus hasilnya: <code>Logging(mux)</code> membuat semua request — termasuk yang ditolak middleware auth — tetap tercatat. Penyusunan dari luar ke dalam menentukan urutan eksekusi.'
    },
    {
      type: 'warn',
      title: '401 vs 403 — jangan tertukar',
      text: '<b>401 Unauthorized</b> berarti "kamu belum membuktikan identitas" (token hilang/rusak/kedaluwarsa) → klien harus login ulang. <b>403 Forbidden</b> berarti "kamu sudah dikenal, tapi tidak berhak" → mengulang login tidak akan menolong. Memakai kode yang tepat membuat klien bisa bereaksi dengan benar.'
    },
    {
      type: 'vocab',
      items: [
        ['Middleware', 'Handler pembungkus handler lain untuk logika umum (auth, logging, dll).'],
        ['Middleware chaining', 'Menyusun beberapa middleware berurutan dari luar ke dalam.'],
        ['Context request', 'Wadah key-value yang mengalir bersama request (context.Context).'],
        ['RBAC', 'Role-Based Access Control — membatasi akses berdasarkan peran pengguna.'],
        ['Bearer token', 'Token yang dibawa di header Authorization: Bearer &lt;token&gt;.'],
        ['401 vs 403', '401 = belum autentikasi; 403 = sudah dikenal tapi ditolak aksesnya.']
      ]
    }
  ],
  recap: [
    'Middleware Go berpola: terima handler → kembalikan handler baru.',
    'Authenticate memverifikasi JWT, menyimpan klaim ke context, berhenti dengan 401 bila gagal.',
    'RequireRole memeriksa peran dari context, menolak dengan 403 bila tidak sesuai.',
    'Urutan yang benar: Authenticate dahulu, baru RequireRole.',
    'Data dari context diambil dengan type assertion pada tipe key khusus.'
  ]
});
