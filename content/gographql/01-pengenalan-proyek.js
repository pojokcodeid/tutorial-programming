/* ============================================================
   Contoh Project GraphQL (Go) — Bab 1: Mengenal Proyek & Arsitektur
   ============================================================ */
'use strict';

window.GOGRAPHQL_LESSONS = window.GOGRAPHQL_LESSONS || [];

window.GOGRAPHQL_LESSONS.push({
  id: 'gographql-pengenalan-proyek',
  title: 'Mengenal Proyek: Blog GraphQL dengan Go',
  chapter: 'Proyek Blog GraphQL Go',
  duration: '15 menit',
  intro: [
    'Selamat datang di proyek praktis! Di tutorial <b>GraphQL</b> sebelumnya kamu sudah memahami konsep dan sintaksnya lewat server Node.js. Kini kita membangun hal yang sama dengan <b>Go</b> — bahasa yang dipakai luas untuk API berperforma tinggi — pada satu proyek utuh bernama <b>blog-go-graphql</b>.',
    'Proyek ini bukan contoh main-main: server GraphQL lengkap dengan <b>Query, Mutation, filtering, otorisasi</b>, database <b>MariaDB di localhost:3306</b> (user <code>root</code>, password <code>rootpassword</code>), data contoh (seed), dan Playground untuk menguji. Di akhir enam bab ini, kamu akan memiliki aplikasi yang bisa kamu kembangkan sendiri menjadi proyek nyata.'
  ],
  objectives: [
    'Memahami arsitektur proyek blog GraphQL: dari klien HTTP hingga MariaDB',
    'Mengenali peran tiap teknologi: Go, GQLGen, GORM, dan MariaDB',
    'Membaca struktur folder proyek dan tahu file mana yang kamu ubah vs yang di-generate',
    'Mempersiapkan prasyarat: Go 1.24+, MariaDB aktif di localhost:3306',
    'Menjalankan proyek contoh pertama kali dan membuka Playground'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Apa yang Kita Bangun?</h3><p>Sebuah <b>aplikasi blog sederhana</b> — pilihan klasik karena hampir semua konsep API tercakup di dalamnya: relasi satu-ke-banyak (user → post), CRUD lengkap, filtering, dan otorisasi. Perbandingan singkat dengan proyek Node.js di materi GraphQL:</p><table><thead><tr><th>Aspek</th><th>Materi GraphQL (Node)</th><th>Proyek ini (Go)</th></tr></thead><tbody><tr><td>Server GraphQL</td><td>Apollo Server</td><td>GQLGen</td></tr><tr><td>Akses database</td><td>Prisma ORM</td><td>GORM</td></tr><tr><td>Bahasa resolver</td><td>JavaScript/TypeScript</td><td>Go (bertipe ketat)</td></tr><tr><td>Kontrak schema</td><td><code>typeDefs</code> string</td><td>File <code>.graphqls</code> + kode di-generate</td></tr><tr><td>Database</td><td>MariaDB <code>localhost:3306</code></td><td>MariaDB <code>localhost:3306</code> (sama!)</td></tr></tbody></table><p>Karena database dan konsep GraphQL-nya sama, kamu bisa fokus mempelajari hal baru: <b>bagaimana Go dan GQLGen menerjemahkan schema menjadi kode bertipe ketat</b>.</p>'
    },
    {
      type: 'text',
      html: '<h3>Arsitektur: Perjalanan Satu Request</h3><p>Saat klien mengirim query GraphQL, perjalanan datanya melewati lapisan-lapisan berikut. Memahami peta ini sejak awal membuat debugging jauh lebih mudah nanti:</p>'
    },
    {
      type: 'example',
      title: 'Peta lapisan proyek (dibaca dari klien ke database)',
      lang: 'text',
      output: false,
      code: `┌─────────┐   POST /graphql   ┌──────────────┐
│  Klien   │ ────────────────► │   net/http   │  main.go
│ (Playground /                     └──────┬───────┘
│  cURL / React)                          │
│                                  ┌──────▼───────┐
│                                  │ authMiddleware│  main.go
│                                  │ (X-User-ID →  │  context.go
│                                  │  context)     │
│                                  └──────┬───────┘
│                                  ┌──────▼───────┐
│                                  │   GQLGen     │  graph/generated/
│                                  │ parse +      │  (di-generate)
│                                  │ validasi     │
│                                  └──────┬───────┘
│                                  ┌──────▼───────┐
│                                  │  Resolver    │  graph/
│                                  │ (logika kamu)│  schema.resolvers.go
│                                  └──────┬───────┘
│                                  ┌──────▼───────┐
│                                  │    GORM      │  internal/database/
│                                  │ (SQL builder)│
│                                  └──────┬───────┘
│                                  ┌──────▼───────┐
                                  │   MariaDB    │  localhost:3306
                                  │   blog_go    │  (root/rootpassword)
                                  └──────────────┘`,
      explain: [
        'Lapisan dibaca berurutan: <b>HTTP → auth → validasi GraphQL → resolver → GORM → database</b>. Setiap lapisan punya satu tanggung jawab — ketika ada error, kamu tahu harus melihat di lapisan mana.',
        'Dua lapisan pertama (<b>authMiddleware</b> dan <b>context.go</b>) adalah bagian dari proyek yang kamu tulis sendiri untuk keamanan — kita bahas mendetail di Bab 5.',
        'Lapisan <b>graph/generated/</b> di-generate dari schema — kamu tidak mengeditnya, tapi wajib tahu keberadaannya agar tidak kebingungan saat membaca error compiler.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Struktur Folder Proyek</h3><p>Saat kamu membuka folder <code>examples/graphql-go-blog</code>, inilah yang akan kamu lihat — perhatikan pembagian penting antara <b>file yang kamu tulis</b> dan <b>file hasil generate</b>:</p>'
    },
    {
      type: 'example',
      title: 'Struktur folder + penanda mana yang boleh diedit',
      lang: 'bash',
      output: false,
      code: `graphql-go-blog/
├── graph/
│   ├── schema.graphqls        ✏️  SKEMA — sumber kebenaran API
│   ├── schema.resolvers.go    ✏️  logika resolver (diisi manual)
│   ├── resolver.go            ✏️  struct Resolver (wadah dependency)
│   ├── context.go             ✏️  helper pengguna login di context
│   ├── model/
│   │   ├── post.go            ✏️  struct GORM Post (kustom)
│   │   ├── user.go            ✏️  struct GORM User (kustom)
│   │   └── models_gen.go      ⚙️  hasil generate — JANGAN diedit
│   └── generated/generated.go ⚙️  hasil generate — JANGAN diedit
├── internal/database/
│   └── database.go            ✏️  koneksi GORM + AutoMigrate
├── cmd/seed/main.go           ✏️  pengisi data contoh
├── main.go                    ✏️  entry point + middleware
├── gqlgen.yml                 ✏️  konfigurasi GQLGen
├── go.mod / go.sum            ⚙️  dikelola otomatis oleh Go
└── README.md                  📖  panduan lengkap proyek`,
      explain: [
        'Penanda <b>✏️</b> = file yang kamu tulis dan kelola; <b>⚙️</b> = hasil generate/otomatis. Aturan emas: <b>jangan pernah mengedit file ⚙️</b> — perubahanmu akan hilang saat generate ulang. Kustomisasi tipe dilakukan lewat <code>gqlgen.yml</code> (Bab 3).',
        '<code>go.mod</code> dan <code>go.sum</code> seperti <code>package.json</code> + lock file di Node: mencatat nama modul dan versi persis seluruh dependensi agar build reproducible.'
      ]
    },
    {
      type: 'live',
      title: 'Simulasi: Perjalanan Request melintasi Lapisan',
      lang: 'html',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: system-ui, sans-serif; font-size: 13px; margin: 12px; background: #f8fafc; color: #0f172a; }
  h3 { margin: 0 0 8px; font-size: 14px; }
  .wrap { display: flex; gap: 14px; flex-wrap: wrap; }
  .col { flex: 1; min-width: 250px; }
  .layers { list-style: none; margin: 0; padding: 0; }
  .layers li { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 9px 12px; margin: 6px 0;
               display: flex; justify-content: space-between; align-items: center; transition: all .3s; opacity: .45; }
  .layers li.active { opacity: 1; border-color: #E10098; box-shadow: 0 2px 8px rgba(225,0,152,.15); background: #fdf2f8; }
  .layers li.done { opacity: 1; border-color: #22c55e; background: #f0fdf4; }
  .layers .file { font-size: 10px; color: #64748b; font-family: monospace; }
  button { padding: 8px 14px; border: 0; border-radius: 6px; font-weight: 700; cursor: pointer; color: #fff; background: #E10098; }
  button:disabled { background: #94a3b8; cursor: wait; }
  button.reset { background: #64748b; margin-left: 6px; }
  .log { background: #0f172a; color: #94a3b8; border-radius: 6px; padding: 8px; min-height: 130px; max-height: 170px;
         overflow-y: auto; font-family: monospace; font-size: 11px; white-space: pre-wrap; }
  .log .ok { color: #4ade80; } .log .info { color: #7dd3fc; }
  select, input { padding: 6px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; }
  .ctl { margin: 6px 0; display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
  .hint { font-size: 11px; color: #64748b; margin-top: 6px; }
</style>
</head>
<body>
<h3>🚚 Simulasi perjalanan request GraphQL melintasi 6 lapisan</h3>
<div class="wrap">
  <div class="col">
    <div class="ctl">
      <label>Query:</label>
      <select id="qsel">
        <option value="query">query { posts { id title } }</option>
        <option value="mutation">mutation { createPost(...) { id } }</option>
        <option value="unauth">mutation { deletePost(id:1) } (tanpa login)</option>
        <option value="invalid">query { pos { id } } (typo!)</option>
      </select>
    </div>
    <div class="ctl">
      <label>Login sebagai:</label>
      <select id="user">
        <option value="0">anonim (tanpa header)</option>
        <option value="1">X-User-ID: 1 (Budi, ADMIN)</option>
        <option value="2">X-User-ID: 2 (Ani, USER)</option>
      </select>
    </div>
    <div class="ctl">
      <button id="btnGo">▶ Kirim request</button>
      <button id="btnReset" class="reset">Reset</button>
    </div>
    <ol class="layers" id="layers">
      <li data-i="0"><span>1. net/http</span><span class="file">main.go</span></li>
      <li data-i="1"><span>2. authMiddleware</span><span class="file">main.go · context.go</span></li>
      <li data-i="2"><span>3. GQLGen validasi</span><span class="file">graph/generated/ ⚙️</span></li>
      <li data-i="3"><span>4. Resolver</span><span class="file">schema.resolvers.go</span></li>
      <li data-i="4"><span>5. GORM</span><span class="file">internal/database/</span></li>
      <li data-i="5"><span>6. MariaDB :3306</span><span class="file">blog_go</span></li>
    </ol>
  </div>
  <div class="col">
    <b>Log server (go run .)</b>
    <div class="log" id="log"><span class="info">Tekan "Kirim request" — amati lapisan mana yang dilewati.</span></div>
    <div class="hint">Perhatikan: query typo berhenti di lapisan 3 (tidak sampai resolver!), dan deletePost tanpa login berhenti di lapisan 4.</div>
  </div>
</div>
<script>
  var lis = document.querySelectorAll('#layers li');
  var running = false;

  function resetLayers() {
    for (var i = 0; i < lis.length; i++) lis[i].className = '';
  }
  function log(msg, cls) {
    var el = document.getElementById('log');
    el.innerHTML += '\\n' + (cls ? '<span class="' + cls + '">' + msg + '</span>' : msg);
    el.scrollTop = el.scrollHeight;
  }
  function step(i, msg, cls, delay, next) {
    setTimeout(function () {
      if (i > 0) { lis[i - 1].className = 'done'; }
      lis[i].className = 'active';
      log(msg, cls);
      if (next) next();
    }, delay);
  }

  document.getElementById('btnGo').onclick = function () {
    if (running) return;
    running = true;
    var btn = this; btn.disabled = true;
    resetLayers();
    var q = document.getElementById('qsel').value;
    var uid = document.getElementById('user').value;

    step(0, 'POST /graphql diterima net/http', 'info', 300, function () {
      // lapisan 2: auth
      step(1, uid === '0'
        ? 'authMiddleware: tanpa header → context anonim (currentUser=nil)'
        : 'authMiddleware: verifikasi X-User-ID:' + uid + ' → currentUser disuntikkan ke context', 'info', 500, function () {
        // lapisan 3: validasi
        if (q === 'invalid') {
          step(2, 'GQLGen: VALIDATION FAILED — Unknown field "pos" on type "Query"', 'info', 500, function () {
            lis[2].className = 'done';
            log('✗ 400 Bad Request — request BERHENTI di sini; resolver tidak pernah dijalankan', 'ok');
            finish();
          });
          return;
        }
        step(2, 'GQLGen: parse OK, validasi schema OK → panggil resolver', 'info', 500, function () {
          // lapisan 4: resolver
          var rname = q === 'mutation' ? 'createPost' : (q === 'unauth' ? 'deletePost' : 'Posts');
          if (q === 'unauth' && uid === '0') {
            step(3, 'resolver DeletePost: CurrentUserFrom(ctx) == nil', 'info', 500, function () {
              log('✗ error: "silakan login dulu (set header X-User-ID)"', 'ok');
              finish();
            });
            return;
          }
          if (q === 'mutation' && uid !== '1' && uid !== '2') {
            step(3, 'resolver CreatePost: currentUser == nil → tolak', 'info', 500, function () {
              log('✗ error: "harus login untuk membuat post"', 'ok');
              finish();
            });
            return;
          }
          step(3, 'resolver ' + rname + ' berjalan — validasi input & cek data', 'info', 500, function () {
            // lapisan 5: gorm
            var sqls = {
              query: 'SELECT * FROM posts ORDER BY created_at DESC',
              mutation: "SELECT * FROM users WHERE id = 1; INSERT INTO posts (...)",
              unauth: 'DELETE FROM posts WHERE id = 1'
            };
            step(4, 'GORM ▸ ' + sqls[q], 'info', 550, function () {
              step(5, 'MariaDB localhost:3306 mengeksekusi SQL', 'info', 450, function () {
                lis[5].className = 'done';
                var ok = { query: '{"data":{"posts":[...]}}', mutation: '{"data":{"createPost":{"id":5}}}', unauth: '{"data":{"deletePost":true}}' };
                log('✓ 200 OK → ' + ok[q], 'ok');
                finish();
              });
            });
          });
        });
      });
    });

    function finish() { running = false; btn.disabled = false; }
  };

  document.getElementById('btnReset').onclick = function () {
    resetLayers();
    document.getElementById('log').innerHTML = '<span class="info">Tekan "Kirim request" — amati lapisan mana yang dilewati.</span>';
  };
</script>
</body>
</html>`,
      hint: 'Kirim ketiga pilihan query berurutan: query normal (melewati 6 lapisan penuh), query dengan typo (berhenti di lapisan 3 — validasi GQLGen), dan deletePost tanpa login (berhenti di resolver). Uji juga peran berbeda pada query mutation.'
    },
    {
      type: 'example',
      title: 'Prasyarat & menjalankan proyek pertama kali',
      lang: 'bash',
      output: false,
      code: `# 1. Pastikan Go terpasang (butuh 1.24+; teruji di 1.27)
go version

# 2. Pastikan MariaDB aktif di localhost:3306
#    (user root / password rootpassword — kredensial proyek tutorial)
#    Tidak perlu membuat database — server membuat "blog_go" otomatis.

# 3. Masuk ke folder proyek dan jalankan server
cd examples/graphql-go-blog
DEBUG=1 go run .

# Output yang diharapkan:
# ✓ terhubung ke MariaDB localhost:3306 (blog_go)
# 🚀 server jalan di http://localhost:4000/graphql

# 4. Terminal TERPISAH — tanam data contoh (3 users, 4 posts)
go run ./cmd/seed
# ✓ seed selesai: 3 users, 4 posts

# 5. Buka Playground di browser
open http://localhost:4000/`,
      explain: [
        '<code>DEBUG=1</code> menampilkan setiap SQL yang dijalankan GORM di terminal — alat belajar paling ampuh di proyek ini. Jalankan juga tanpa DEBUG untuk perbandingan.',
        'Dua perintah <code>go run</code> dijalankan di <b>dua terminal</b>: yang pertama menjalankan server (proses panjang), yang kedua menjalankan tool seed lalu selesai.',
        'Tidak ada client <code>mysql</code> yang dibutuhkan — seed ditulis dalam Go (<code>cmd/seed</code>) sehingga proyek ini berjalan di mesin mana pun yang memiliki Go + MariaDB.'
      ]
    },
    {
      type: 'tip',
      title: 'Bila server gagal start',
      text: 'Pesan <b>"gagal terhubung ke MariaDB (localhost:3306)"</b> berarti MariaDB tidak menyala atau kredensial berbeda — periksa layanan database-mu. Pesan <b>port sudah dipakai</b> berarti sisa proses dari percobaan sebelumnya masih hidup: matikan dengan <code>pkill -f gqlgo-blog</code> atau ganti port: <code>PORT=4001 go run .</code>. Di macOS, file <code>._*</code> (resource fork) bisa mengganggu pembacaan skema dengan pesan <code>Unexpected &lt;Invalid&gt;</code> — bersihkan dengan <code>find . -name \'._*\' -delete</code>.'
    },
    {
      type: 'warn',
      title: 'Kredensial ini untuk belajar lokal saja',
      text: 'Password <code>rootpassword</code> dan user root dipakai agar konsisten dengan seluruh materi tutorial ini. Untuk proyek nyata: buat database user khusus dengan hak minimal, simpan kredensial di <b>environment variable</b> (<code>DATABASE_DSN</code> sudah didukung proyek ini), dan jangan pernah meng-commit rahasia ke git.'
    },
    {
      type: 'vocab',
      items: [
        ['GQLGen', 'Toolkit GraphQL untuk Go dengan pendekatan schema-first: schema .graphqls menjadi sumber kebenaran, lalu kode Go bertipe aman di-generate darinya.'],
        ['GORM', 'ORM paling populer di Go — memetakan struct Go ke tabel database (find/create/update/delete) tanpa menulis SQL mentah.'],
        ['Schema-first', 'Pendekatan desain API: tulis kontrak schema dulu, biarkan compiler/generator menghasilkan kode — kesalahan tipe tertangkap lebih awal.'],
        ['AutoMigrate', 'Fitur GORM yang membuat/memperbarui tabel mengikuti struct model saat server pertama dijalankan.'],
        ['Model kustom', 'Struct milik kita (bukan hasil generate) yang diarahkan lewat gqlgen.yml — tempat menambahkan tag relasi & kolom GORM.'],
        ['Seed', 'Program kecil untuk mengisi database dengan data contoh — di proyek ini cmd/seed/main.go, idempan (aman dijalankan berulang).'],
        ['Playground', 'Antarmuka web bawaan GQLGen di http://localhost:4000/ untuk menulis dan menjalankan query tanpa instalasi tambahan.'],
        ['net/http', 'Package bawaan Go untuk HTTP server — proyek ini memakainya langsung tanpa framework web tambahan.']
      ]
    }
  ],
  recap: [
    'Proyek <b>blog-go-graphql</b> adalah aplikasi blog lengkap: Query, Mutation, filtering, otorisasi, MariaDB <code>localhost:3306</code>, seed, dan Playground.',
    'Arsitektur per request: <b>net/http → authMiddleware → GQLGen (validasi) → resolver → GORM → MariaDB</b> — setiap lapisan punya satu tanggung jawab.',
    'Kunci bekerja dengan GQLGen: <b>file generate (⚙️) tidak diedit</b>; perubahan selalu dimulai dari <code>schema.graphqls</code> (✏️) lalu generate ulang.',
    'Prasyarat: Go 1.24+ dan MariaDB hidup di <code>localhost:3306</code> (root/rootpassword); database <code>blog_go</code> dibuat otomatis oleh server.',
    'Jalankan dengan <code>DEBUG=1 go run .</code> (lihat SQL), tanam data dengan <code>go run ./cmd/seed</code>, uji di <code>http://localhost:4000/</code>.',
    'Kredensial bawaan hanya untuk belajar — produksi wajib memakai environment variable dan user database berhak minimal.'
  ]
});
