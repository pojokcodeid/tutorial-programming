/* ============================================================
   Contoh Project GraphQL (Go) — Bab 6: Menjalankan, Menguji & Rilis
   ============================================================ */
'use strict';

window.GOGRAPHQL_LESSONS = window.GOGRAPHQL_LESSONS || [];

window.GOGRAPHQL_LESSONS.push({
  id: 'gographql-menjalankan-rilis',
  title: 'Menjalankan, Menguji & Langkah ke Produksi',
  chapter: 'Proyek Blog GraphQL Go',
  duration: '25 menit',
  intro: [
    'Seluruh kode sudah tertulis — bab ini mengajakmu menjalankannya dari nol, mengisinya dengan data contoh, mengujinya dari dua sisi (Playground dan cURL), lalu menimbang apa yang harus berubah saat proyek belajar ini dipindahkan ke produksi.',
    'Fokus praktik bab ini adalah <b>observability</b> dan <b>keamanan rilis</b>: membaca log SQL GORM lewat DEBUG=1, memilih variabel lingkungan yang benar, dan daftar perubahan wajib (JWT sungguhan, mematikan Playground/introspeksi, graceful shutdown) yang membedakan proyek tutorial dari API produksi.'
  ],
  objectives: [
    'Menjalankan server dari nol: koneksi database, AutoMigrate, dan penanganan kegagalan koneksi',
    'Mengisi data contoh dengan cmd/seed (idempan) atau seed.sql sebagai alternatif',
    'Menguji seluruh operasi API dari Playground dan cURL dengan header otorisasi',
    'Membaca log SQL GORM dengan DEBUG=1 sebagai alat belajar dan debugging',
    'Menyusun daftar langkah produksi: JWT, mematikan introspeksi, graceful shutdown, konfigurasi environment'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Menjalankan dari Nol</h3><p>Prasyarat hanya dua: <b>Go 1.24+</b> dan <b>MariaDB hidup di localhost:3306</b> (user <code>root</code>, password <code>rootpassword</code>). Tidak perlu membuat database pun — saat start, server mengeksekusi <code>CREATE DATABASE IF NOT EXISTS blog_go</code> lalu <code>AutoMigrate</code> menyusun tabel mengikuti struct model. Inilah yang membuat proyek ini bisa dijalankan di mesin mana pun dalam hitungan menit.</p>'
    },
    {
      type: 'example',
      title: 'Urutan perintah lengkap: start → seed → buka',
      lang: 'bash',
      output: false,
      code: `cd examples/graphql-go-blog

# Terminal 1 — jalankan server (proses panjang)
DEBUG=1 go run .

# Output yang diharapkan:
# ✓ terhubung ke MariaDB localhost:3306 (blog_go)
# 🚀 server jalan di http://localhost:4000/graphql

# Terminal 2 — tanam data contoh (3 users, 4 posts) — idempan
go run ./cmd/seed
# ✓ seed selesai: 3 users, 4 posts

# Uji cepat dari terminal (tanpa Playground)
curl -s http://localhost:4000/graphql \\
  -H "Content-Type: application/json" \\
  -d '{"query":"{ postCount posts { id title author { name } } }"}'`,
      explain: [
        '<code>cmd/seed</code> berperilaku <b>idempan</b>: menjalankannya dua kali tidak menggandakan data — user disimpan dengan klausa <code>OnConflict{DoNothing: true}</code> (email unik), posts dilewati bila sudah ada. Aman untuk experiment berulang.',
        'Struktur <code>cmd/seed</code> sebagai command terpisah adalah konvensi Go yang lazim: <code>cmd/</code> berisi executable, <code>internal/</code> berisi paket yang dipakainya. Tool kecil seperti ini bisa dipakai ulang untuk migration data di proyek produksi.',
        'Bila MariaDB mati, server langsung exit dengan pesan <b>"gagal terhubung ke MariaDB (localhost:3306)"</b> — <code>log.Fatalf</code> memastikan tidak ada server "setengah hidup" yang menerima request tanpa database.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Membaca Log SQL: DEBUG=1 sebagai Cermin</h3><p>Fitur belajar paling berharga proyek ini. Dengan <code>DEBUG=1</code>, GORM mencetak setiap SQL beserta waktunya ke terminal. Saat kamu menjalankan query <code>{ posts { author { name } } }</code> di Playground, terminal akan memperlihatkan dua baris — utama dan Preload — persis seperti yang dijanjikan Bab 3.</p>'
    },
    {
      type: 'example',
      title: 'Contoh log saat query posts dijalankan dari Playground',
      lang: 'text',
      output: false,
      code: `[118.235.12.4] 2026/11/01 10:15:22 /workspace/go/pkg/mod/gorm.io/gorm@v1.31.0/callbacks.go:119
Succeeded in 546µs
[118.235.12.4] 2026/11/01 10:15:22 /workspace/go/pkg/mod/gorm.io/gorm@v1.31.0/callbacks.go:119
Succeeded in 281µs
[GIN] 2026/11/01 | 200 |  1.8ms |  127.0.0.1 | POST "/graphql"

# Yang terjadi di balik layar (dipermudah untuk dibaca):
# SELECT * FROM posts ORDER BY created_at DESC, id DESC   ← 546µs
# SELECT * FROM users WHERE id IN (1, 2)                  ← 281µs (Preload Author)`,
      explain: [
        'Dua panggilan GORM = dua query pada Bab 3 — inilah bukti visual Preload bekerja. Bila kamu melihat <b>enam</b> panggilan untuk enam post, itulah N+1 yang lolos.',
        'Baris terakhir adalah log HTTP server (default mux Go): status 200, durasi total request, dan alamat klien — kombinasi tiga informasi ini sudah cukup untuk diagnosis performa harian.',
        'Tanpa <code>DEBUG=1</code>, seluruh log SQL dibungkam (level Warn) — perilaku yang kamu inginkan di produksi, di mana log verbose justru memenuhi disk.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Alternatif Seed: SQL Langsung</h3><p>Bagi yang memiliki client <code>mysql</code>, file <code>seed.sql</code> menyediakan jalur kedua tanpa Go — berguna saat kamu ingin melihat bentuk tabel mentah, atau saat membagikan data contoh ke rekan yang tidak memasang Go.</p>'
    },
    {
      type: 'example',
      title: 'seed.sql — jalankan setelah tabel dibuat AutoMigrate',
      lang: 'bash',
      output: false,
      code: `# Pastikan server pernah dijalankan sekali (AutoMigrate membuat tabel),
# lalu (kredensial tutorial: root:rootpassword @ localhost:3306):
mysql -u root -prootpassword -h localhost -P 3306 blog_go < seed.sql

# Verifikasi langsung di MariaDB:
mysql -u root -prootpassword -e "USE blog_go; SELECT id, title, published, author_id FROM posts;"`,
      explain: [
        'Urutannya penting: tanpa AutoMigrate, tabel belum ada dan seed.sql gagal dengan <code>Table \'blog_go.users\' doesn\'t exist</code>.',
        'Kedua jalur seed (Go dan SQL) menanam data identik — pilih sesuai kenyamanan; keduanya aman dijalankan berulang (SQL memakai INSERT biasa, jadi jalankan sekali saja agar tidak menduplikasi).'
      ]
    },
    {
      type: 'text',
      html: '<h3>Tur Penuh: Seluruh Operasi dari Playground</h3><p>Kumpulan query berikut mencakup seluruh materi enam bab — simpan sebagai "lembar uji regresi" milikmu. Jalankan berurutan dan amati log SQL di Terminal 1 untuk setiap operasi.</p>'
    },
    {
      type: 'example',
      title: 'Lembar uji lengkap (siap tempel di Playground)',
      lang: 'graphql',
      output: false,
      code: `# BACA — seluruh post + penulis
{ posts { id title published author { name role } } }

# BACA — filter & agregat
{ posts(published: true) { id title } postCount users { id name } }

# TULIS — buat post (authorID 1 = Budi)
mutation ($input: CreatePostInput!) {
  createPost(input: $input) { id title published author { name } }
}
# variables: { "input": { "title": "Resensi Buku Go", "content": "Buku bagus.", "authorID": 1 } }

# TULIS — terbitkan post id 2
mutation { publishPost(id: 2) { id title published } }

# TULIS — hapus (kirim header X-User-ID: 1 di panel HTTP Playground)
mutation { deletePost(id: 4) }`,
      explain: [
        'Panel <b>HTTP Headers</b> di Playground (tombol kanan bawah) adalah tempat menambahkan <code>X-User-ID</code> — tanpa header itu, deletePost menolak dengan "silakan login dulu".',
        'Simpan lembar ini dan jalankan ulang setiap kali mengubah skema — kebiasaan kecil ini mendahului konsep "integration test" pada proyek nyata.'
      ]
    },
    {
      type: 'live',
      title: 'Simulasi: Detektif Log SQL — Cocokkan Query dengan Permintaan',
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
  .qlist { display: flex; flex-direction: column; gap: 6px; }
  .qbtn { padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; cursor: pointer;
          font-family: monospace; font-size: 11px; text-align: left; }
  .qbtn.on { border-color: #E10098; background: #fdf2f8; }
  .log { background: #0f172a; color: #94a3b8; border-radius: 6px; padding: 8px; min-height: 150px; max-height: 190px;
         overflow-y: auto; font-family: monospace; font-size: 11px; white-space: pre-wrap; }
  .log .ok { color: #4ade80; } .log .info { color: #7dd3fc; } .log .bad { color: #f87171; }
  .chk { font-size: 12px; margin: 10px 0; }
  .verdict { margin-top: 8px; padding: 8px; border-radius: 6px; font-size: 12px; font-weight: 700; }
  .verdict.ok { background: #dcfce7; color: #15803d; }
  .verdict.bad { background: #fee2e2; color: #b91c1c; }
  .hint { font-size: 11px; color: #64748b; margin-top: 6px; }
</style>
</head>
<body>
<h3>🔍 Terminal 1 memperlihatkan SQL ini — permintaan GraphQL mana yang menghasilkannya?</h3>
<div class="wrap">
  <div class="col">
    <b>Log DEBUG=1 (GORM)</b>
    <div class="log" id="log"><span class="info">Tekan "Jalankan query" — amati SQL yang muncul.</span></div>
    <div class="chk"><label><input type="checkbox" id="debug"> DEBUG=1 aktif (log SQL tampil)</label></div>
    <button id="btnGo" style="padding:8px 14px;border:0;border-radius:6px;font-weight:700;cursor:pointer;color:#fff;background:#E10098;">▶ Jalankan query</button>
    <div class="verdict" id="verdict">—</div>
  </div>
  <div class="col">
    <b>Permintaan GraphQL di Playground</b>
    <div class="qlist" id="qlist"></div>
    <div class="hint">Tebak dulu sebelum menekan jalankan: berapa SQL untuk permintaan terakhir bila DEBUG aktif?</div>
  </div>
</div>
<script>
  var QS = [
    { q: '{ postCount }', sql: ['SELECT count(*) FROM posts'], n1: false },
    { q: '{ posts { id title } }', sql: ['SELECT * FROM posts ORDER BY created_at DESC'], n1: false },
    { q: '{ posts { id author { name } } }', sql: ['SELECT * FROM posts ORDER BY created_at DESC',
        'SELECT * FROM users WHERE id IN (...)  ← Preload'], n1: false },
    { q: '{ users { id posts { id } } }', sql: ['SELECT * FROM users',
        'SELECT * FROM posts WHERE author_id IN (...)  ← Preload'], n1: false }
  ];
  var active = 0;
  var qlist = document.getElementById('qlist');
  QS.forEach(function (item, i) {
    var b = document.createElement('button');
    b.className = 'qbtn' + (i === 0 ? ' on' : '');
    b.textContent = item.q;
    b.onclick = function () {
      active = i;
      document.querySelectorAll('.qbtn').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
    };
    qlist.appendChild(b);
  });

  document.getElementById('btnGo').onclick = function () {
    var debug = document.getElementById('debug').checked;
    var logEl = document.getElementById('log');
    logEl.innerHTML = '';
    var v = document.getElementById('verdict');
    function log(msg, cls) {
      logEl.innerHTML += '\\n' + (cls ? '<span class="' + cls + '">' + msg + '</span>' : msg);
      logEl.scrollTop = logEl.scrollHeight;
    }
    log('POST /graphql  ' + QS[active].q, 'info');
    log('HTTP 200 — respons terkirim ke Playground', 'info');
    if (!debug) {
      log('(terminal senyap — tanpa DEBUG=1 semua SQL dibungkam)');
      v.className = 'verdict bad';
      v.textContent = 'Tanpa DEBUG=1 kamu tidak bisa memverifikasi perilaku database. Nyalakan ceklisnya.';
      return;
    }
    QS[active].sql.forEach(function (s) { log('Succeeded — ' + s, 'ok'); });
    v.className = 'verdict ok';
    v.textContent = QS[active].sql.length + ' SQL untuk permintaan ini — semua ter-batch, tidak ada N+1.';
  };
</script>
</body>
</html>`,
      hint: 'Nyalakan DEBUG=1 lalu jalankan keempat permintaan satu per satu. Perhatikan dua permintaan terakhir tetap hanya 2 SQL meski membawa banyak baris — itulah Preload. Bandingkan dengan pengalaman N+1 di Bab 3: SQL per baris data.'
    },
    {
      type: 'text',
      html: '<h3>Daftar Perubahan Menuju Produksi</h3><p>Proyek ini sengaja disederhanakan agar fokus belajar tetap pada GraphQL. Saat dipindahkan ke produksi, setidaknya enam hal wajib berubah. Daftar ini disusun berdasarkan apa yang sudah kamu miliki — sebagian besar hanya "menyambung" pengetahuan dari materi tutorial lain.</p>'
    },
    {
      type: 'example',
      title: 'Checklist produksi: dari proyek tutorial ke API sungguhan',
      lang: 'text',
      output: false,
      code: `KEAMANAN
  [ ] Ganti X-User-ID dengan JWT   → middleware: verifikasi Bearer token
                                     (materi Bab 12 + golang-jwt/jwt v5)
  [ ] Hash password saat register   → bcrypt (materi Go REST API)
  [ ] Matikan Playground & introspeksi di production build
  [ ] Rate limiting sederhana       → mis. golang.org/x/time/rate per-IP

ROBUSTNESS
  [ ] Error handling: pesan generik ke klien, detail di log terstruktur
      (zap / slog) — jangan pernah membocorkan galat GORM
  [ ] Graceful shutdown: http.Server + signal.NotifyContext,
      tunggu request in-flight selesai sebelum menutup DB
  [ ] Batas waktu request: context.WithTimeout per operasi
  [ ] Timeout koneksi DB: sqlDB.SetConnMaxLifetime (sudah ada di
      internal/database)

KONFIGURASI
  [ ] Semua rahasia dari environment (DATABASE_DSN sudah didukung)
  [ ] Kredensial database khusus aplikasi — BUKAN user root
  [ ] AutoMigrate dimatikan; pakai migrasi ber-versi (golang-migrate)`,
      explain: [
        'Perhatikan bahwa <b>tidak ada satu pun</b> yang mengharusmu menulis ulang resolver — perubahan produksi terkonsentrasi di lapisan middleware, konfigurasi, dan operasional. Arsitektur berlapis yang kamu bangun sejak Bab 1 terbayar di sini.',
        'Baris terakhir sering terlupa: <code>AutoMigrate</code> nyaman saat belajar, tetapi di produksi perubahan skema harus berupa migrasi ber-versi yang bisa direview, dicatat, dan di-rollback.'
      ]
    },
    {
      type: 'tip',
      title: 'Graceful shutdown dalam sepuluh baris',
      text: 'Ganti <code>http.ListenAndServe</code> dengan <code>srv := &http.Server{Addr: ":"+port, Handler: nil}</code>, lalu jalankan <code>srv.ListenAndServe()</code> di goroutine. Tangkap <code>SIGINT/SIGTERM</code> dengan <code>signal.NotifyContext</code>, dan pada shutdown panggil <code>srv.Shutdown(ctx)</code> yang menunggu request yang sedang berjalan selesai — sebelum menutup connection pool database. Tanpa ini, deploy ulang akan memutus tengah jalan request pengguna.'
    },
    {
      type: 'warn',
      title: 'Introspeksi & Playground dihapus di produksi',
      text: 'Playground yang terbuka berarti siapa pun bisa menjelajahi seluruh skema dan mencoba mutation. Di produksi: layani Playground hanya bila <code>DEBUG=1</code>, dan matikan introspeksi pada eksekusi schema GQLGen. Skema API adalah peta sistemmu — bagikan lewat dokumentasi terkontrol, bukan endpoint publik.'
    },
    {
      type: 'vocab',
      items: [
        ['AutoMigrate', 'Sinkronisasi tabel mengikuti struct model saat start — nyaman untuk belajar, diganti migrasi ber-versi di produksi.'],
        ['Idempan', 'Sifat operasi yang aman dijalankan berulang dengan hasil sama — prinsip di balik OnConflict{DoNothing} pada seed.'],
        ['DEBUG=1', 'Variabel lingkungan proyek yang mengaktifkan log SQL GORM (level Info) — alat observability utama saat belajar.'],
        ['Graceful shutdown', 'Penutupan server yang menunggu request in-flight selesai (Shutdown) sebelum menutup resource — mencegah request terpotong saat deploy.'],
        ['Introspection', 'Kemampuan GraphQL bertanya skemanya sendiri (__schema) — bagus di Playground, berisiko di API publik.'],
        ['Connection pool', 'SetMaxIdleConns/SetMaxOpenConns/SetConnMaxLifetime pada internal/database — mengatur berapa koneksi MariaDB yang dipakai bersamaan.'],
        ['Migrasi ber-versi', 'Perubahan skema bernomor (0001_up.sql) yang dijalankan terurut dan tercatat — menggantikan AutoMigrate di produksi.'],
        ['Structured logging', 'Log berformat (JSON) dengan field konsisten (slog/zap) — mudah dicari dan di-monitor, berbeda log teks bebas.']
      ]
    }
  ],
  recap: [
    'Jalankan: <code>DEBUG=1 go run .</code> (Terminal 1) lalu <code>go run ./cmd/seed</code> (Terminal 2) — database <code>blog_go</code> dibuat otomatis.',
    'Seed idempan dengan <code>OnConflict{DoNothing}</code>; alternatif SQL via <code>seed.sql</code> setelah AutoMigrate pernah berjalan.',
    '<b>DEBUG=1</b> memperlihatkan setiap SQL GORM — cara tercepat memverifikasi Preload dan menangkap N+1.',
    'Lembar uji Playground (baca + tulis + hapus dengan header) berfungsi sebagai uji regresi manual setiap kali skema berubah.',
    'Menuju produksi: JWT menggantikan header simulasi, introspeksi/Playground dimatikan, graceful shutdown dan batas waktu ditambahkan — tanpa menulis ulang resolver.',
    'Rahasia dari environment, user database berhak minimal, dan AutoMigrate diganti migrasi ber-versi.'
  ]
});
