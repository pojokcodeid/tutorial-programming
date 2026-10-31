/* ============================================================
   GraphQL — Bab 3: Menulis Query GraphQL: Selection Sets, Arguments, Aliases & Fragments
   ============================================================ */
'use strict';

window.GRAPHQL_LESSONS = window.GRAPHQL_LESSONS || [];

window.GRAPHQL_LESSONS.push({
  id: 'menulis-query',
  title: 'Menulis Query GraphQL: Selection Sets, Arguments, Aliases & Fragments',
  chapter: 'Sintaksis Klien',
  duration: '15 menit',
  intro: [
    'Menulis query GraphQL ibarat mengisi formulir pesanan di restoran mewah: kamu bisa memilih <i>persis</i> hidangan apa yang kamu mau, dengan bumbu apa, untuk siapa, bahkan memesan hidangan yang sama dalam dua versi berbeda tanpa bingung mana milik siapa. Itulah kekuatan sintaksis query GraphQL.',
    'Bab ini membahas empat fitur kunci yang membuat query GraphQL sangat fleksibel: <b>Selection Sets</b> (pilih field), <b>Arguments</b> (kirim parameter), <b>Aliases</b> (hindari konflik nama), dan <b>Fragments</b> (kelompok field yang bisa dipakai ulang).'
  ],
  objectives: [
    'Menulis selection set untuk memilih field yang tepat dari sebuah tipe GraphQL',
    'Menggunakan arguments untuk memfilter atau mengonfigurasi hasil query',
    'Menggunakan alias untuk menghindari konflik dan mengambil data yang sama dengan parameter berbeda',
    'Mendefinisikan dan menggunakan fragment untuk menghindari pengulangan kode',
    'Memahami perbedaan anonymous query vs named query'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Anatomi Sebuah Query GraphQL</h3><p>Sebelum masuk ke fitur masing-masing, kenali dulu bagian-bagian utama sebuah query:</p><table><thead><tr><th>Bagian</th><th>Contoh</th><th>Penjelasan</th></tr></thead><tbody><tr><td><b>Operation type</b></td><td><code>query</code></td><td>Jenis operasi: query, mutation, atau subscription</td></tr><tr><td><b>Operation name</b></td><td><code>ProfilUser</code></td><td>Nama opsional untuk query — sangat disarankan untuk debugging</td></tr><tr><td><b>Selection set</b></td><td><code>{ name email }</code></td><td>Daftar field yang ingin diambil, diapit kurung kurawal</td></tr><tr><td><b>Field</b></td><td><code>name</code>, <code>email</code></td><td>Satu data atomik yang diminta dari server</td></tr><tr><td><b>Arguments</b></td><td><code>(id: "42")</code></td><td>Parameter yang dikirim ke field/resolver di server</td></tr><tr><td><b>Alias</b></td><td><code>userBaru: user(id: "1")</code></td><td>Nama samaran untuk field agar tidak konflik</td></tr><tr><td><b>Fragment</b></td><td><code>...FieldUser</code></td><td>Kelompok field yang bisa dipakai ulang di banyak query</td></tr></tbody></table>'
    },
    {
      type: 'example',
      title: 'Fitur 1: Selection Sets — Pilih Field yang Dibutuhkan',
      lang: 'graphql',
      output: false,
      code: `# Selection set = daftar field yang ingin diambil, diapit { }
# Bisa bersarang (nested) untuk relasi antar tipe

query ProfilLengkap {
  user(id: "42") {         # field 'user' di root
    id                     # field skalar (string/int/bool)
    name
    email
    address {              # field objek → butuh selection set lagi
      city
      province
    }
    posts {                # field list → juga butuh selection set
      title
      publishedAt
      tags                 # list skalar — langsung, tanpa { }
    }
  }
}

# Aturan penting:
# - Field skalar (String, Int, Boolean): langsung tulis namanya
# - Field objek/relasi: HARUS diikuti selection set { ... }
# - Tidak boleh meminta objek tanpa memilih minimal satu field di dalamnya`,
      explain: [
        'Selection set membentuk struktur pohon (tree) — persis seperti bentuk JSON response yang akan kamu terima.',
        'Kamu <i>harus</i> menentukan field sampai level terdalam yang skalar (String, Int, Boolean). Tidak bisa berhenti di objek.',
        'Ini yang membuat GraphQL aman dari over-fetching: setiap field yang kamu tulis = data yang kamu bayar (bandwidth).'
      ]
    },
    {
      type: 'example',
      title: 'Fitur 2: Arguments — Mengirim Parameter ke Server',
      lang: 'graphql',
      output: false,
      code: `# Arguments: parameter yang dikirim ke field tertentu
# Format: namaField(namaArg: nilai) { ... }

query ContohArguments {
  # Argument di field root
  user(id: "42") {
    name
    email
  }

  # Argument di field nested
  products(
    category: "elektronik"   # filter kategori
    limit: 10                # maksimal 10 hasil
    offset: 0                # mulai dari data ke-0
    sortBy: "price"          # urutkan berdasar harga
    order: DESC              # urutan menurun (enum, tanpa quotes)
  ) {
    id
    name
    price
  }

  # Argument di field skalar pun bisa!
  user(id: "5") {
    name
    profilePicture(size: LARGE)   # minta ukuran gambar tertentu
  }
}`,
      explain: [
        'Arguments bisa berupa tipe skalar (String, Int, Float, Boolean) atau Enum (nilai tanpa tanda kutip).',
        'Nilai String diapit tanda kutip ganda (<code>"seperti ini"</code>). Nilai Enum, Int, Float, Boolean tidak menggunakan tanda kutip.',
        'Arguments bisa diberikan ke field mana saja — tidak hanya field root, tapi juga field nested.'
      ]
    },
    {
      type: 'example',
      title: 'Fitur 3: Aliases — Hindari Konflik & Query Ganda',
      lang: 'graphql',
      output: false,
      code: `# Masalah tanpa alias: bagaimana mengambil 2 user sekaligus?
# Ini TIDAK VALID karena nama field duplikat:
# query Invalid {
#   user(id: "1") { name }
#   user(id: "2") { name }   ← ERROR: konflik nama 'user'
# }

# Solusi: gunakan ALIAS dengan format  alias: namaField(args)
query DuaPengguna {
  pengguna1: user(id: "1") {   # alias 'pengguna1'
    name
    email
  }
  pengguna2: user(id: "2") {   # alias 'pengguna2'
    name
    email
  }
}

# Response JSON akan menggunakan nama ALIAS, bukan nama field:
# {
#   "data": {
#     "pengguna1": { "name": "Budi", "email": "budi@email.com" },
#     "pengguna2": { "name": "Ani",  "email": "ani@email.com"  }
#   }
# }

# Alias juga berguna untuk memberi nama lebih deskriptif:
query StatistikToko {
  produkTerlaris: products(sortBy: "sold", order: DESC, limit: 5) {
    name
    totalSold
  }
  produkBaru: products(sortBy: "createdAt", order: DESC, limit: 5) {
    name
    createdAt
  }
}`,
      explain: [
        'Tanpa alias, GraphQL tidak bisa membedakan dua pemanggilan <code>user()</code> dengan argument berbeda dalam satu query.',
        'Alias mengubah nama kunci di response JSON — <code>pengguna1</code> akan muncul di JSON, bukan <code>user</code>.',
        'Alias membuat kode lebih mudah dibaca: <code>produkTerlaris</code> vs <code>products</code> yang ambigu.'
      ]
    },
    {
      type: 'example',
      title: 'Fitur 4: Fragments — Kelompok Field yang Bisa Dipakai Ulang',
      lang: 'graphql',
      output: false,
      code: `# Fragment: mendefinisikan kelompok field yang bisa dipakai di banyak tempat
# Format: fragment NamaFragment on NamaTipe { field... }

# Definisi fragment
fragment FieldDasarUser on User {
  id
  name
  email
  avatarUrl
}

fragment FieldDasarPost on Post {
  id
  title
  publishedAt
  viewCount
}

# Menggunakan fragment dengan spread operator ...
query HalamanBeranda {
  currentUser {
    ...FieldDasarUser       # expand semua field dari fragment
    role
    lastLoginAt
  }

  featuredPosts {
    ...FieldDasarPost       # pakai fragment yang sama
    excerpt
    author {
      ...FieldDasarUser     # fragment bisa dipakai berulang kali!
    }
  }

  recentPosts {
    ...FieldDasarPost       # gunakan lagi di sini
    category {
      name
    }
  }
}`,
      explain: [
        'Fragment didefinisikan sekali dan bisa dipakai di banyak tempat — prinsip <i>DRY (Don\'t Repeat Yourself)</i> di GraphQL.',
        'Sintaksis <code>...NamaFragment</code> disebut <i>fragment spread</i> — mirip spread operator di JavaScript.',
        'Fragment <i>harus</i> dikaitkan ke tipe GraphQL tertentu (<code>on User</code>, <code>on Post</code>). Ini memastikan field yang dipilih valid untuk tipe tersebut.'
      ]
    },
    {
      type: 'live',
      title: 'Simulasi: Query Builder — Pilih Field & Lihat Query Terbentuk',
      lang: 'html',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: system-ui, sans-serif; font-size: 13px; margin: 10px; background: #f8fafc; }
  h3 { margin: 0 0 6px; font-size: 13px; color: #1e293b; }
  .layout { display: flex; gap: 12px; }
  .left { width: 200px; flex-shrink: 0; }
  .right { flex: 1; }
  .field-group { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 8px; }
  .field-group h4 { margin: 0 0 6px; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: .5px; }
  label { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; cursor: pointer; font-size: 12px; }
  input[type=checkbox] { width: 14px; height: 14px; cursor: pointer; }
  .code-box { background: #0f172a; color: #e2e8f0; padding: 10px; border-radius: 8px; font-family: monospace; font-size: 11px; white-space: pre-wrap; min-height: 140px; }
  .code-box .kw   { color: #c084fc; }
  .code-box .name { color: #67e8f9; }
  .code-box .field{ color: #86efac; }
  .code-box .arg  { color: #fbbf24; }
  .resp-box { background: #1e3a5f; color: #bae6fd; padding: 10px; border-radius: 8px; font-family: monospace; font-size: 11px; white-space: pre-wrap; min-height: 140px; margin-top: 8px; }
  .hint { font-size: 11px; color: #64748b; margin-top: 4px; }
  button { padding: 7px 14px; border: 0; border-radius: 6px; background: #8b5cf6; color: #fff; font-weight: 700; cursor: pointer; font-size: 12px; margin-top: 6px; }
</style>
</head>
<body>
<h3>Query Builder: Centang field yang ingin kamu ambil</h3>
<div class="layout">
  <div class="left">
    <div class="field-group">
      <h4>User Fields</h4>
      <label><input type="checkbox" class="f" data-field="id" checked> id</label>
      <label><input type="checkbox" class="f" data-field="name" checked> name</label>
      <label><input type="checkbox" class="f" data-field="email" checked> email</label>
      <label><input type="checkbox" class="f" data-field="avatarUrl"> avatarUrl</label>
      <label><input type="checkbox" class="f" data-field="createdAt"> createdAt</label>
      <label><input type="checkbox" class="f" data-field="role"> role</label>
    </div>
    <div class="field-group">
      <h4>Post Fields (nested)</h4>
      <label><input type="checkbox" class="fp" data-field="title" checked> title</label>
      <label><input type="checkbox" class="fp" data-field="publishedAt"> publishedAt</label>
      <label><input type="checkbox" class="fp" data-field="viewCount"> viewCount</label>
      <label><input type="checkbox" class="fp" data-field="excerpt"> excerpt</label>
    </div>
    <div class="field-group">
      <h4>User ID</h4>
      <input type="text" id="userId" value="42" style="width:100%;box-sizing:border-box;padding:5px;border:1px solid #cbd5e1;border-radius:4px;font-size:12px">
    </div>
    <button onclick="buildQuery()">▶ Build Query</button>
    <p class="hint">Centang field lalu klik Build Query untuk melihat query GraphQL dan simulasi response-nya.</p>
  </div>
  <div class="right">
    <h3>GraphQL Query:</h3>
    <div class="code-box" id="queryBox">Centang field lalu klik Build Query...</div>
    <h3 style="margin-top:10px">Simulasi Response JSON:</h3>
    <div class="resp-box" id="respBox">Response akan muncul di sini...</div>
  </div>
</div>
<script>
  const mockUser = {
    id: '42', name: 'Budi Santoso', email: 'budi@email.com',
    avatarUrl: 'https://i.pravatar.cc/150?u=budi', createdAt: '2020-01-15',
    role: 'ADMIN'
  };
  const mockPosts = [
    { title: 'Belajar GraphQL', publishedAt: '2026-10-01', viewCount: 1234, excerpt: 'GraphQL adalah bahasa query...' },
    { title: 'REST vs GraphQL', publishedAt: '2026-09-15', viewCount: 987, excerpt: 'Keduanya punya kelebihan...' }
  ];

  function buildQuery() {
    const uid = document.getElementById('userId').value || '42';
    const userFields = [...document.querySelectorAll('.f:checked')].map(c => c.dataset.field);
    const postFields = [...document.querySelectorAll('.fp:checked')].map(c => c.dataset.field);

    if (!userFields.length) { document.getElementById('queryBox').innerHTML = '⚠️  Pilih minimal satu user field!'; return; }

    let q = '<span class="kw">query</span> <span class="name">ProfilPengguna</span> {\n';
    q += '  <span class="field">user</span>(<span class="arg">id: \\"' + uid + '\\"</span>) {\n';
    userFields.forEach(f => q += '    <span class="field">' + f + '</span>\n');
    if (postFields.length) {
      q += '    <span class="field">posts</span>(limit: 2) {\n';
      postFields.forEach(f => q += '      <span class="field">' + f + '</span>\n');
      q += '    }\n';
    }
    q += '  }\n}';
    document.getElementById('queryBox').innerHTML = q;

    // Build mock response
    const userResp = {};
    userFields.forEach(f => { if (mockUser[f] !== undefined) userResp[f] = mockUser[f]; });
    if (postFields.length) {
      userResp.posts = mockPosts.map(p => {
        const po = {};
        postFields.forEach(f => { if (p[f] !== undefined) po[f] = p[f]; });
        return po;
      });
    }
    document.getElementById('respBox').textContent = JSON.stringify({ data: { user: userResp } }, null, 2);
  }

  buildQuery();
</script>
</body>
</html>`,
      hint: 'Centang berbagai kombinasi field dan ubah User ID, lalu klik "Build Query". Perhatikan bagaimana query dan response berubah sesuai pilihanmu.'
    },
    {
      type: 'tip',
      title: 'Selalu Gunakan Named Query untuk Debugging',
      text: 'Walaupun anonymous query (<code>{ user { name } }</code>) valid secara sintaksis, selalu beri nama pada querymu: <code>query ProfilUser { ... }</code>. Nama query akan muncul di <b>log server</b>, <b>Apollo Studio</b>, dan <b>error message</b> sehingga jauh lebih mudah ditelusuri ketika ada masalah di production. Bayangkan melihat log "error di query ProfilUser" vs "error di anonymous query" — mana yang lebih informatif?'
    },
    {
      type: 'warn',
      title: 'Tanpa Alias, Dua Query Dengan Argument Berbeda Akan Konflik!',
      text: 'Jika kamu menulis dua field dengan nama yang sama dalam satu selection set tanpa alias, GraphQL akan mengembalikan error. Contoh: dua <code>user(id: ...)</code> dalam satu query akan crash. Gunakan <b>alias</b> (<code>userPertama: user(id: "1")</code>) untuk menghindari konflik ini. Ini juga berlaku untuk library seperti Apollo Client: jika dua komponen dalam satu halaman mem-fetch field yang sama dengan argument berbeda, pastikan keduanya menggunakan named alias.'
    },
    {
      type: 'vocab',
      items: [
        ['Selection Set', 'Kumpulan field yang diminta dari sebuah tipe, diapit kurung kurawal <code>{ }</code>. Menentukan persis data apa yang akan dikembalikan server.'],
        ['Arguments', 'Parameter yang dikirim ke sebuah field untuk mengontrol data yang dikembalikan — mirip parameter fungsi atau query string di REST.'],
        ['Alias', 'Nama samaran untuk field dalam sebuah query. Berguna untuk menghindari konflik nama dan membuat response lebih deskriptif.'],
        ['Fragment', 'Kumpulan field yang didefinisikan sekali dan bisa dipakai ulang di banyak query atau mutation, menghindari pengulangan kode.'],
        ['Named Query', 'Query GraphQL yang diberi nama eksplisit setelah kata kunci <code>query</code>. Sangat disarankan untuk debugging dan monitoring.'],
        ['Field', 'Unit data terkecil dalam query GraphQL — bisa berupa nilai skalar (String, Int) atau objek yang membutuhkan selection set sendiri.']
      ]
    }
  ],
  recap: [
    '<b>Selection set</b> (<code>{ }</code>) adalah cara kamu memilih field yang diinginkan — bentuknya identik dengan struktur JSON response yang akan diterima.',
    '<b>Arguments</b> memungkinkan pengiriman parameter ke field untuk filter, pagination, atau konfigurasi — mirip query parameter di REST.',
    '<b>Alias</b> diperlukan saat dua field sama dipanggil dengan argument berbeda dalam satu query, atau untuk memberi nama lebih deskriptif pada response.',
    '<b>Fragment</b> menerapkan prinsip DRY — definisikan sekali, pakai di banyak tempat. Wajib diikaitkan ke tipe GraphQL tertentu (<code>on NamaTipe</code>).',
    'Selalu gunakan <b>named query</b> — nama query muncul di log server dan sangat membantu saat debugging di production.'
  ]
});
