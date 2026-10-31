/* ============================================================
   GraphQL — Bab 1: Pengenalan GraphQL: Apa dan Mengapa?
   ============================================================ */
'use strict';

window.GRAPHQL_LESSONS = window.GRAPHQL_LESSONS || [];

window.GRAPHQL_LESSONS.push({
  id: 'pengenalan-graphql',
  title: 'Pengenalan GraphQL: Apa dan Mengapa?',
  chapter: 'Konsep Dasar',
  duration: '12 menit',
  intro: [
    'Bayangkan kamu memesan makanan di restoran cepat saji, tapi pelayannya memaksa membawakan seluruh menu — padahal kamu hanya mau nasi goreng. Itulah yang sering terjadi ketika aplikasi meminta data lewat <b>REST API</b> tradisional: terlalu banyak data yang tidak dibutuhkan, atau justru harus bolak-balik meja untuk melengkapi pesanan.',
    '<b>GraphQL</b> hadir sebagai solusi: kamu bisa memesan <i>persis</i> apa yang kamu mau, tidak lebih, tidak kurang — dalam satu kali permintaan. Teknologi ini lahir di internal Facebook pada 2012, dibuka ke publik (open source) pada 2015, dan kini dipakai perusahaan seperti GitHub, Shopify, Twitter, dan banyak lagi.'
  ],
  objectives: [
    'Memahami sejarah singkat GraphQL dan latar belakang lahirnya dari Facebook',
    'Menjelaskan masalah over-fetching dan under-fetching pada REST API',
    'Memahami konsep declarative data fetching: klien yang menentukan data',
    'Membedakan pendekatan satu endpoint GraphQL vs banyak endpoint REST'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Sejarah Singkat GraphQL</h3><p>Pada tahun 2012, tim Facebook menghadapi masalah besar: aplikasi mobile Facebook (yang kala itu pindah ke native app) membutuhkan cara yang lebih efisien untuk mengambil data dari server. REST API yang ada terasa kaku dan boros — terlalu banyak request, terlalu banyak data yang tidak terpakai.</p><p>Lee Byron, Nick Schrock, dan Dan Schafer kemudian merancang <b>GraphQL</b> sebagai bahasa query internal Facebook. Setelah 3 tahun dipakai dan disempurnakan di dalam Facebook, akhirnya pada <b>2015</b> GraphQL dirilis sebagai proyek open source. Sejak itu, ekosistemnya berkembang pesat dengan dukungan dari komunitas global.</p><table><thead><tr><th>Tahun</th><th>Peristiwa</th></tr></thead><tbody><tr><td>2012</td><td>Facebook membuat GraphQL secara internal</td></tr><tr><td>2015</td><td>GraphQL dirilis sebagai open source (versi spesifikasi pertama)</td></tr><tr><td>2018</td><td>Pengelolaan GraphQL diserahkan ke <b>GraphQL Foundation</b> di bawah Linux Foundation</td></tr><tr><td>Kini</td><td>Dipakai GitHub, Shopify, Twitter, Airbnb, dan ratusan ribu perusahaan lain</td></tr></tbody></table>'
    },
    {
      type: 'text',
      html: '<h3>Masalah REST: Over-fetching & Under-fetching</h3><p>REST API bekerja dengan baik untuk kasus sederhana, tetapi punya dua masalah klasik yang sering muncul di aplikasi nyata:</p><table><thead><tr><th>Masalah</th><th>Penjelasan</th><th>Analogi</th></tr></thead><tbody><tr><td><b>Over-fetching</b></td><td>Server mengirim data lebih banyak dari yang dibutuhkan klien</td><td>Minta satu nasi goreng, dapat satu truk makanan</td></tr><tr><td><b>Under-fetching</b></td><td>Satu endpoint tidak cukup, klien harus memanggil banyak endpoint untuk melengkapi data</td><td>Minta nasi goreng tapi harus antri di 3 kasir berbeda</td></tr></tbody></table><p>Contoh nyata: Untuk menampilkan profil pengguna beserta daftar postingannya dan daftar temannya, REST biasanya butuh <b>3 request terpisah</b>: <code>GET /users/1</code>, <code>GET /users/1/posts</code>, <code>GET /users/1/friends</code>. Dengan GraphQL, cukup <b>1 request</b>.</p>'
    },
    {
      type: 'text',
      html: '<h3>REST vs GraphQL: Perbandingan Menyeluruh</h3><table><thead><tr><th>Aspek</th><th>REST API</th><th>GraphQL</th></tr></thead><tbody><tr><td><b>Endpoint</b></td><td>Banyak endpoint (<code>/users</code>, <code>/posts</code>, <code>/comments</code>)</td><td>Satu endpoint (<code>/graphql</code>)</td></tr><tr><td><b>Pengambilan data</b></td><td>Server menentukan bentuk response</td><td>Klien menentukan persis field yang diinginkan</td></tr><tr><td><b>Over-fetching</b></td><td>Sering terjadi</td><td>Tidak terjadi (hanya field yang diminta)</td></tr><tr><td><b>Under-fetching</b></td><td>Sering perlu beberapa request</td><td>Satu query bisa gabungkan banyak data</td></tr><tr><td><b>Versi API</b></td><td>Butuh versioning (<code>/v1</code>, <code>/v2</code>)</td><td>Schema bisa berkembang tanpa versioning</td></tr><tr><td><b>Dokumentasi</b></td><td>Perlu tools tambahan (Swagger, dll)</td><td>Self-documenting lewat Introspection</td></tr><tr><td><b>HTTP Method</b></td><td>GET, POST, PUT, DELETE, PATCH</td><td>Sebagian besar hanya POST (kadang GET)</td></tr><tr><td><b>Cocok untuk</b></td><td>API publik sederhana, resource CRUD baku</td><td>Aplikasi kompleks, mobile app, BFF pattern</td></tr></tbody></table>'
    },
    {
      type: 'example',
      title: 'REST: Butuh 3 Request untuk 1 Halaman Profil',
      lang: 'javascript',
      output: false,
      code: `// REST: untuk menampilkan profil + posts + teman,
// kita harus memanggil 3 endpoint berbeda

// Request 1 — data user (tapi dapat banyak field tidak terpakai)
const userRes = await fetch('/api/users/42');
const user = await userRes.json();
// Response mengandung: id, name, email, phone, address,
// birthdate, createdAt, updatedAt, preferences, ... (30+ field!)
// Kita hanya butuh: name, email, avatarUrl

// Request 2 — posts si user
const postsRes = await fetch('/api/users/42/posts');
const posts = await postsRes.json();

// Request 3 — daftar teman
const friendsRes = await fetch('/api/users/42/friends');
const friends = await friendsRes.json();

// Total: 3 round-trip ke server, masing-masing bawa data berlebih`,
      explain: [
        'Setiap request membawa overhead jaringan tersendiri — semakin banyak request, semakin lambat halaman terbuka.',
        'Response <code>/users/42</code> biasanya mengembalikan <i>semua</i> field user meski kita hanya butuh 3 — inilah over-fetching.',
        'Bayangkan pengguna dengan koneksi lambat (3G) yang harus menunggu 3 request berturut-turut sebelum halaman bisa ditampilkan.'
      ]
    },
    {
      type: 'example',
      title: 'GraphQL: Satu Query, Persis Data yang Dibutuhkan',
      lang: 'graphql',
      output: false,
      code: `# GraphQL: satu query ke /graphql, kita tentukan sendiri datanya

query ProfilPengguna {
  user(id: "42") {
    name          # hanya field ini yang kita mau
    email
    avatarUrl
    posts(limit: 5) {
      title
      publishedAt
    }
    friends(limit: 10) {
      name
      avatarUrl
    }
  }
}

# Server membalas PERSIS struktur di atas — tidak lebih, tidak kurang`,
      explain: [
        'Kita hanya menulis <i>nama field</i> yang benar-benar akan ditampilkan di layar.',
        'Server merespons dengan struktur yang <b>identik</b> dengan yang kita tulis — mudah diprediksi.',
        'Satu round-trip saja. Cocok untuk aplikasi mobile yang peka terhadap penggunaan data.'
      ]
    },
    {
      type: 'live',
      title: 'Simulasi: REST (3 Request) vs GraphQL (1 Request)',
      lang: 'html',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: system-ui, sans-serif; font-size: 13px; margin: 12px; background: #f8fafc; }
  h3 { margin: 0 0 8px; font-size: 14px; }
  .row { display: flex; gap: 12px; }
  .box { flex: 1; background: #fff; border-radius: 8px; padding: 12px; border: 1px solid #e2e8f0; }
  button {
    width: 100%; padding: 8px; border: 0; border-radius: 6px;
    font-weight: 700; cursor: pointer; margin-bottom: 8px; color: #fff;
  }
  .btn-rest { background: #ef4444; }
  .btn-gql  { background: #8b5cf6; }
  .log { background: #0f172a; color: #94a3b8; padding: 10px; border-radius: 6px;
         min-height: 120px; font-family: monospace; white-space: pre-wrap; font-size: 12px; }
  .log span.ok  { color: #4ade80; }
  .log span.req { color: #facc15; }
  .summary { margin-top: 8px; font-size: 12px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-weight: 700; color: #fff; }
  .bad  { background: #ef4444; }
  .good { background: #22c55e; }
</style>
</head>
<body>
<div class="row">
  <div class="box">
    <h3>🔴 REST API</h3>
    <button class="btn-rest" id="btnRest">Ambil Profil via REST</button>
    <div class="log" id="logRest">Tekan tombol untuk memulai...</div>
    <div class="summary" id="sumRest"></div>
  </div>
  <div class="box">
    <h3>🟣 GraphQL</h3>
    <button class="btn-gql" id="btnGql">Ambil Profil via GraphQL</button>
    <div class="log" id="logGql">Tekan tombol untuk memulai...</div>
    <div class="summary" id="sumGql"></div>
  </div>
</div>
<script>
  // Mock data
  const userData = { id:42, name:'Budi Santoso', email:'budi@email.com', avatarUrl:'/budi.jpg',
    phone:'08123456789', address:'Jl. Sudirman No.10, Jakarta', birthdate:'1990-05-20',
    createdAt:'2020-01-15', updatedAt:'2026-10-01', preferences:{ theme:'dark', lang:'id' }
  };
  const postsData = [
    { id:1, title:'Belajar GraphQL', publishedAt:'2026-10-01' },
    { id:2, title:'REST vs GraphQL', publishedAt:'2026-09-15' }
  ];
  const friendsData = [
    { id:10, name:'Ani Rahayu', avatarUrl:'/ani.jpg' },
    { id:11, name:'Cahyo Purnomo', avatarUrl:'/cahyo.jpg' }
  ];

  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  document.getElementById('btnRest').onclick = async function() {
    const log = document.getElementById('logRest');
    const sum = document.getElementById('sumRest');
    log.innerHTML = '';
    sum.innerHTML = '';

    const addLine = (html) => { log.innerHTML += html + '\\n'; };

    addLine('<span class="req">→ GET /api/users/42</span>');
    await delay(600);
    const keys = Object.keys(userData);
    addLine('<span class="ok">← 200 OK</span> (' + keys.length + ' fields, kita pakai 3)');
    addLine('   Fields tak terpakai: ' + keys.slice(3).join(', '));

    await delay(400);
    addLine('\\n<span class="req">→ GET /api/users/42/posts</span>');
    await delay(500);
    addLine('<span class="ok">← 200 OK</span> (' + postsData.length + ' posts)');

    await delay(400);
    addLine('\\n<span class="req">→ GET /api/users/42/friends</span>');
    await delay(500);
    addLine('<span class="ok">← 200 OK</span> (' + friendsData.length + ' friends)');

    await delay(200);
    addLine('\\n✅ Data lengkap setelah 3 round-trip.');
    sum.innerHTML = 'Total request: <span class="badge bad">3 request</span>';
  };

  document.getElementById('btnGql').onclick = async function() {
    const log = document.getElementById('logGql');
    const sum = document.getElementById('sumGql');
    log.innerHTML = '';
    sum.innerHTML = '';

    const addLine = (html) => { log.innerHTML += html + '\\n'; };

    addLine('<span class="req">→ POST /graphql</span>');
    addLine('   query { user(id:"42") { name email avatarUrl');
    addLine('     posts { title publishedAt }');
    addLine('     friends { name avatarUrl } } }');
    await delay(700);

    const result = {
      user: {
        name: userData.name,
        email: userData.email,
        avatarUrl: userData.avatarUrl,
        posts: postsData.map(p => ({ title: p.title, publishedAt: p.publishedAt })),
        friends: friendsData.map(f => ({ name: f.name, avatarUrl: f.avatarUrl }))
      }
    };
    addLine('\\n<span class="ok">← 200 OK</span> — persis data yang diminta:');
    addLine(JSON.stringify(result, null, 2));
    addLine('\\n✅ Data lengkap dalam 1 round-trip!');
    sum.innerHTML = 'Total request: <span class="badge good">1 request</span>';
  };
</script>
</body>
</html>`,
      hint: 'Klik kedua tombol bergantian dan perhatikan perbedaan jumlah request dan data yang diterima.'
    },
    {
      type: 'tip',
      title: 'Kapan Pakai GraphQL vs REST?',
      text: '<b>Pilih GraphQL</b> jika: aplikasimu kompleks dengan banyak tipe data yang saling terhubung, kamu punya beberapa klien (web, mobile, smartwatch) dengan kebutuhan data berbeda, atau kamu ingin menghindari pembuatan endpoint baru setiap ada fitur baru.<br><br><b>Pilih REST</b> jika: API kamu sederhana dan publik (mudah dikonsumsi siapa saja), kamu butuh caching HTTP bawaan browser/CDN secara mudah, atau tim belum familiar dengan GraphQL dan deadline mepet.'
    },
    {
      type: 'vocab',
      items: [
        ['GraphQL', 'Bahasa query untuk API sekaligus runtime untuk mengeksekusi query tersebut. Dikembangkan Facebook, open source sejak 2015.'],
        ['Over-fetching', 'Kondisi di mana server mengirim data lebih banyak dari yang dibutuhkan klien — data terbuang sia-sia.'],
        ['Under-fetching', 'Kondisi di mana satu request tidak cukup; klien harus memanggil beberapa endpoint untuk melengkapi data.'],
        ['Declarative Data Fetching', 'Pendekatan di mana klien <i>mendeklarasikan</i> data apa yang dibutuhkan, bukan bagaimana cara mengambilnya.'],
        ['Schema', 'Kontrak resmi antara klien dan server di GraphQL — mendefinisikan semua tipe data dan operasi yang tersedia.'],
        ['Resolver', 'Fungsi di sisi server yang bertanggung jawab mengambil atau mengolah data untuk setiap field dalam schema.']
      ]
    }
  ],
  recap: [
    '<b>GraphQL</b> lahir di Facebook (2012) dan open source pada 2015 untuk mengatasi keterbatasan REST di aplikasi mobile yang kompleks.',
    'REST punya dua masalah utama: <b>over-fetching</b> (data berlebih) dan <b>under-fetching</b> (harus banyak request) — GraphQL menyelesaikan keduanya.',
    'Dengan GraphQL, <b>klien menentukan sendiri</b> field apa yang dibutuhkan — prinsip ini disebut <i>declarative data fetching</i>.',
    'GraphQL menggunakan <b>satu endpoint</b> (<code>/graphql</code>) untuk semua operasi, berbeda dengan REST yang punya banyak endpoint.',
    'Pilih GraphQL untuk aplikasi kompleks dan multi-klien; pilih REST untuk API publik sederhana yang perlu caching HTTP standar.'
  ]
});
