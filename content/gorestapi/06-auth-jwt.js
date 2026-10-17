/* ============================================================
   Pelajaran Go REST API — Bab 6: Authentication & JWT
   ============================================================ */
'use strict';

window.GORESTAPI_LESSONS = window.GORESTAPI_LESSONS || [];

window.GORESTAPI_LESSONS.push({
  id: 'restapi-auth-jwt',
  title: 'Authentication: bcrypt & JWT Token',
  chapter: 'Keamanan',
  duration: '13 menit',
  intro: [
    'Autentikasi modern memakai pola: login sekali → menerima <b>JWT</b> → menyertakan token di setiap request. Server tidak perlu menyimpan sesi (stateless), sehingga mudah di-scale.',
    'Pelajaran ini membangun alur register (hash password dengan bcrypt) dan login (verifikasi + terbitkan JWT), lalu memverifikasi token di sisi server.'
  ],
  objectives: [
    'Memahami hash password bcrypt dan garam acak',
    'Membuat endpoint register & login',
    'Memahami bagian-bagian JWT (header, klaim, tanda tangan)',
    'Menandatangani & memverifikasi token dengan library jwt',
    'Menangani token kedaluwarsa dan salah secret'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Hash Password dengan bcrypt</h3><p>Aturan nomor satu keamanan: <b>jangan pernah simpan password mentah</b>. Simpan <b>hash</b>-nya. bcrypt adalah algoritma standar untuk ini — ia menghasilkan hash yang mahal dihitung (menghambat brute-force) dan otomatis menambahkan <b>garam acak</b>, sehingga dua password sama menghasilkan hash berbeda.</p>'
    },
    {
      type: 'example',
      title: 'Hash & verifikasi password',
      lang: 'go',
      output: false,
      code: `import "golang.org/x/crypto/bcrypt"

// Saat register:
hash, err := bcrypt.GenerateFromPassword([]byte("rahasia123"), bcrypt.DefaultCost)
if err != nil {
    return fmt.Errorf("hash password: %w", err)
}
user.PasswordHash = string(hash) // simpan INI, bukan "rahasia123"

// Saat login:
err := bcrypt.CompareHashAndPassword(
    []byte(user.PasswordHash), // hash dari database
    []byte(input.Password),    // password mentah dari klien
)
if err != nil {
    return nil, nil, ErrUnauthorized // password salah
}`,
      explain: [
        '<code>DefaultCost (10)</code> menentukan seberapa berat perhitungan — naikkan untuk keamanan ekstra.',
        'Garam acak membuat rainbow table (daftar hash prahitung) tidak berguna.',
        'CompareHashAndPassword menghitung ulang hash dari password mentah lalu membandingkan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Endpoint Register & Login</h3><p>Register menerima data mentah, memvalidasi, meng-hash, lalu menyimpan. Login memverifikasi lalu menerbitkan token. Perhatikan bahwa register mengembalikan objek user <b>tanpa</b> password hash — cukup identitasnya saja.</p>'
    },
    {
      type: 'example',
      title: 'Handler login → token',
      lang: 'go',
      output: false,
      code: `func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
    var in service.LoginInput
    if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
        writeError(w, http.StatusBadRequest, "body JSON tidak valid")
        return
    }

    token, user, err := h.auth.Login(r.Context(), in)
    if err != nil {
        mapServiceError(w, err) // 401 untuk kredensial salah
        return
    }
    writeJSON(w, http.StatusOK, map[string]any{
        "token": token,
        "user":  user, // PasswordHash tidak ikut (json:"-")
    })
}`,
      explain: [
        'Balasan login memuat token yang akan dipakai klien di header Authorization.',
        'Field user hanya berisi data aman berkat tag <code>json:"-"</code> pada PasswordHash.',
        'Kegagalan kredensial dipetakan menjadi 401 Unauthorized.'
      ]
    },
    {
      type: 'warn',
      title: 'Pesan error yang sama untuk semua kegagalan login',
      text: 'Jangan bedakan pesan "username tidak ditemukan" dan "password salah" — penyerang bisa memakainya untuk menebak daftar username yang valid (user enumeration). Balas selalu dengan pesan yang sama: <b>"username atau password salah"</b>.'
    },
    {
      type: 'text',
      html: '<h3>Mengenal Struktur JWT</h3><p><b>JWT</b> (JSON Web Token) adalah string tiga bagian yang dipisahkan titik: <code>header.payload.signature</code>. Bagian payload berisi <b>klaim</b> (data) seperti siapa pemilik token dan kapan kedaluwarsa. Bagian terakhir adalah <b>tanda tangan</b> kriptografis yang membuat payload tidak bisa diubah pihak lain.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 200" width="760" role="img" aria-label="Struktur bagian JWT">
        <rect x="40" y="50" width="200" height="60" rx="8" class="u-box"/>
        <text x="140" y="75" class="u-title" text-anchor="middle">Header</text>
        <text x="140" y="95" class="u-lbl" text-anchor="middle">alg: HS256 · typ: JWT</text>
        <text x="255" y="85" class="u-title">.</text>
        <rect x="275" y="50" width="220" height="60" rx="8" class="u-hd"/>
        <text x="385" y="75" class="u-title" text-anchor="middle">Payload (klaim)</text>
        <text x="385" y="95" class="u-lbl" text-anchor="middle">user_id · role · exp · iat</text>
        <text x="510" y="85" class="u-title">.</text>
        <rect x="530" y="50" width="190" height="60" rx="8" class="u-box"/>
        <text x="625" y="75" class="u-title" text-anchor="middle">Signature</text>
        <text x="625" y="95" class="u-lbl" text-anchor="middle">HMAC-SHA256(secret)</text>
        <text x="380" y="155" class="u-lbl" text-anchor="middle">Payload BUKAN rahasia — hanya TIDAK BISA diubah tanpa ketahuan</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 6.1</b> — Tiga bagian JWT; tanda tangan mengunci isi payload</figcaption></figure>`
    },
    {
      type: 'warn',
      title: 'JWT bukan tempat menyimpan rahasia',
      text: 'Payload JWT hanya di-encode (base64), bukan dienkripsi — siapa pun bisa membacanya dengan dekoder online. Jangan pernah menaruh data sensitif (password, nomor kartu) di dalam klaim. JWT melindungi <b>integritas</b> (tidak bisa diubah), bukan <b>kerahasiaan</b>.'
    },
    {
      type: 'example',
      title: 'Klaim kustom + menandatangani token',
      lang: 'go',
      output: false,
      code: `// Klaim kustom menggabungkan data kita dengan registered claims bawaan.
type Claims struct {
    UserID int64  \`json:"user_id"\`
    Role   string \`json:"role"\`
    jwt.RegisteredClaims // berisi exp, iat, subject, dll
}

func (s *authService) generateToken(u *model.User) (string, error) {
    now := time.Now()
    claims := &Claims{
        UserID: u.ID,
        Role:   u.Role,
        RegisteredClaims: jwt.RegisteredClaims{
            Subject:   fmt.Sprintf("%d", u.ID),
            IssuedAt:  jwt.NewNumericDate(now),            // iat
            ExpiresAt: jwt.NewNumericDate(now.Add(s.jwtExpiry)), // exp
        },
    }
    return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).
        SignedString(s.jwtSecret)
}`,
      explain: [
        'Embed <code>jwt.RegisteredClaims</code> untuk memperoleh klaim bawaan (exp, iat, sub).',
        '<code>SigningMethodHS256</code> = HMAC SHA-256, menandatangani dengan secret milik server.',
        '<code>SignedString</code> menghasilkan token string siap dikirim ke klien.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Memverifikasi Token di Server</h3><p>Sisi server menerima token mentah lalu memverifikasi: tanda tangannya benar? masih berlaku? algoritmanya seperti yang diharapkan? Library <code>golang-jwt</code> melakukan ketiganya sekaligus.</p>'
    },
    {
      type: 'example',
      title: 'Parse & verifikasi token',
      lang: 'go',
      output: false,
      code: `func (s *authService) ParseToken(ctx context.Context, raw string) (*Claims, error) {
    claims := &Claims{}
    token, err := jwt.ParseWithClaims(raw, claims,
        func(t *jwt.Token) (any, error) {
            // Pastikan algoritma benar-benar HMAC (bukan "none" / palsu)
            if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
                return nil, fmt.Errorf("alg tak dikenal")
            }
            return s.jwtSecret, nil // kunci verifikasi
        },
        jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
    )
    if err != nil || !token.Valid {
        return nil, ErrUnauthorized // token kedaluwarsa / salah secret / palsu
    }
    return claims, nil
}`,
      explain: [
        'Function callback mengembalikan kunci verifikasi — juga tempat memeriksa metode tanda tangan.',
        '<code>WithValidMethods</code> menolak token dengan algoritma di luar daftar (mencegah serangan downgrade ke "none").',
        'Token kedaluwarsa, salah secret, atau rusak → ErrUnauthorized (401).'
      ]
    },
    {
      type: 'example',
      title: 'Mencoba alur dengan curl',
      lang: 'bash',
      output: false,
      code: `# 1. Login → ambil token
curl -X POST http://localhost:8080/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"admin","password":"admin12345"}'
# balasan: {"token":"eyJhbGci...","user":{...}}

# 2. Pakai token di request berikutnya
curl http://localhost:8080/api/v1/auth/me \\
  -H "Authorization: Bearer eyJhbGci..."`,
      explain: [
        'Format header: <code>Authorization: Bearer &lt;token&gt;</code>.',
        'Tanpa header ini, endpoint terproteksi membalas 401.',
        'Token yang sama berlaku sampai masa exp habis.'
      ]
    },
    {
      type: 'tip',
      title: 'Kenapa HS256 untuk proyek ini?',
      text: 'HS256 (symmetric) menandatangani dan memverifikasi dengan secret yang sama — sederhana dan cukup ketika hanya server kamu yang memverifikasi token. Untuk ekosistem banyak service (mis. microservices), RS256 (asymmetric) lebih umum: service lain hanya butuh public key untuk verifikasi.'
    },
    {
      type: 'vocab',
      items: [
        ['bcrypt', 'Algoritma hash password yang berat + garam acak; tahan brute-force.'],
        ['Cost', 'Parameter bcrypt yang menentukan kekuatan/berat perhitungan hash.'],
        ['JWT', 'JSON Web Token — token string berisi klaim yang ditandatangani.'],
        ['Klaim (claim)', 'Pasangan key-value di payload JWT, mis. user_id, role, exp.'],
        ['HS256', 'HMAC SHA-256 — metode tanda tangan simetris dengan satu secret.'],
        ['exp / iat', 'Klaim bawaan: waktu kedaluwarsa / waktu penerbitan token.'],
        ['User enumeration', 'Serangan menebak username valid dari perbedaan pesan error login.']
      ]
    }
  ],
  recap: [
    'Password di-hash dengan bcrypt (garam acak) — tidak pernah disimpan atau dikirim mentah.',
    'Login memverifikasi hash lalu menerbitkan JWT yang berisi user_id, role, dan exp.',
    'JWT = header.payload.signature; payload terbaca publik tapi terkunci tanda tangan.',
    'Verifikasi wajib memeriksa metode alg, secret, dan masa berlaku.',
    'Pesan kegagalan login diseragamkan untuk mencegah user enumeration.'
  ]
});
