/* ============================================================
   GraphQL — Bab 4: Mutation & Variables: Mengubah Data dengan GraphQL
   ============================================================ */
'use strict';

window.GRAPHQL_LESSONS = window.GRAPHQL_LESSONS || [];

window.GRAPHQL_LESSONS.push({
  id: 'mutation-dan-variables',
  title: 'Mutation & Variables: Mengubah Data dengan GraphQL',
  chapter: 'Sintaksis Klien',
  duration: '12 menit',
  intro: [
    'Kalau Query seperti membaca buku, maka <b>Mutation</b> adalah menulis, mengedit, atau merobek halamannya. Setiap kali ada data yang perlu dibuat, diperbarui, atau dihapus di server, Mutation-lah yang bertugas.',
    'Tapi ada cara yang <i>baik</i> dan cara yang <i>berbahaya</i> untuk mengirim data dalam mutation. Bab ini mengajarkan cara terbaik menggunakan <b>Variables</b> untuk menjaga keamanan dan keterbacaan kode, serta dua <b>Directive</b> penting — <code>@include</code> dan <code>@skip</code> — yang membuat query menjadi dinamis tanpa harus menulis ulang.'
  ],
  objectives: [
    'Menulis mutation GraphQL untuk create, update, dan delete data',
    'Memahami mengapa variables lebih aman daripada hardcode nilai langsung di query (mencegah injection)',
    'Mendefinisikan dan menggunakan Input Types dalam mutation',
    'Memanfaatkan kemampuan mutation GraphQL untuk langsung mengembalikan data hasil perubahan',
    'Menggunakan directive @include dan @skip untuk membuat query yang dinamis'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Mutation: Create, Update, Delete dalam Satu Kata Kunci</h3><p>Di REST, kita membedakan aksi lewat HTTP method: <code>POST</code> untuk buat, <code>PUT/PATCH</code> untuk ubah, <code>DELETE</code> untuk hapus. Di GraphQL, semua aksi ini menggunakan satu kata kunci <code>mutation</code>, namun dibedakan lewat <b>nama field resolver</b> yang dipanggil.</p><table><thead><tr><th>Aksi</th><th>REST</th><th>GraphQL Mutation Field</th></tr></thead><tbody><tr><td>Buat data baru</td><td><code>POST /users</code></td><td><code>createUser(...)</code></td></tr><tr><td>Perbarui sebagian data</td><td><code>PATCH /users/42</code></td><td><code>updateUser(id: "42", ...)</code></td></tr><tr><td>Perbarui seluruh data</td><td><code>PUT /users/42</code></td><td><code>replaceUser(id: "42", ...)</code></td></tr><tr><td>Hapus data</td><td><code>DELETE /users/42</code></td><td><code>deleteUser(id: "42")</code></td></tr></tbody></table><p>Konvensi penamaan yang umum: awali dengan kata kerja — <code>create</code>, <code>update</code>, <code>delete</code>, <code>add</code>, <code>remove</code>, <code>publish</code>, dll. Nama-nama ini adalah bagian dari <b>Schema</b> yang didefinisikan di server.</p>'
    },
    {
      type: 'example',
      title: 'Anti-Pattern: Mutation Tanpa Variable (Nilai Hardcode)',
      lang: 'graphql',
      output: false,
      code: `# ❌ ANTI-PATTERN: nilai langsung dimasukkan ke dalam string query
# Inilah cara yang TIDAK DIREKOMENDASIKAN

mutation {
  createUser(input: {
    name: "Budi Santoso"
    email: "budi@email.com"
    password: "rahasia123"
  }) {
    id
    name
    email
  }
}

# Masalah dengan pendekatan ini di kode JavaScript:
const nama = getUserInput();  # nilai dari form
const query = \`
  mutation {
    createUser(input: {
      name: "\${nama}"          # ⚠️  BAHAYA! Injection rentan
      email: "\${email}"
      password: "\${password}"
    }) { id name }
  }
\`;
# Jika 'nama' mengandung karakter seperti " atau \\n,
# query akan rusak atau memungkinkan GraphQL injection!`,
      explain: [
        'Menyisipkan nilai langsung ke dalam string query (string interpolation) sangat rentan terhadap <b>GraphQL Injection</b> — serangan mirip SQL Injection.',
        'Jika pengguna memasukkan <code>","email":"hacker@evil.com","x":"</code> sebagai nama, struktur query bisa rusak atau dimanipulasi.',
        'Selain keamanan, cara ini juga membuat query tidak bisa di-cache karena string querynya selalu berbeda setiap request.'
      ]
    },
    {
      type: 'example',
      title: 'Best Practice: Mutation dengan Variables (Cara yang Benar)',
      lang: 'graphql',
      output: false,
      code: `# ✅ BEST PRACTICE: gunakan Variables untuk memisahkan query dan data

# 1. Definisikan variable di tanda tangan operasi dengan $namaVar: Tipe
mutation TambahPengguna($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    name
    email
    createdAt
  }
}

# 2. Kirim variable secara terpisah dalam objek JSON
# (dikirim di key "variables" dalam body POST, BUKAN dalam string query)
# {
#   "query": "mutation TambahPengguna($input: CreateUserInput!) { ... }",
#   "variables": {
#     "input": {
#       "name": "Budi Santoso",
#       "email": "budi@email.com",
#       "password": "rahasia123"
#     }
#   }
# }

# Contoh lengkap dengan berbagai tipe variable:
mutation UpdateArtikel(
  $id: ID!            # ID wajib (! = non-nullable)
  $judul: String      # String opsional
  $konten: String     # String opsional
  $published: Boolean # Boolean opsional
) {
  updateArticle(id: $id, input: {
    title: $judul
    content: $konten
    isPublished: $published
  }) {
    id
    title
    isPublished
    updatedAt
  }
}`,
      explain: [
        'Variables dideklarasikan dengan awalan <code>$</code> dan tipe datanya — contoh: <code>$input: CreateUserInput!</code>.',
        'Tanda seru <code>!</code> berarti <i>non-nullable</i> (wajib ada). Tanpa <code>!</code>, variable bersifat opsional.',
        'Data variable dikirim dalam objek JSON terpisah, sehingga GraphQL server dapat memvalidasi dan menanganinya dengan aman — tidak ada injection.'
      ]
    },
    {
      type: 'example',
      title: 'Input Types: Mengelompokkan Argument dalam Satu Objek',
      lang: 'graphql',
      output: false,
      code: `# Input Type didefinisikan di Schema server (bukan klien)
# Format: input NamaTipe { field: Tipe }

# Di Schema server (hanya untuk referensi):
# input CreateUserInput {
#   name:     String!
#   email:    String!
#   password: String!
#   role:     UserRole = USER   # default value
# }
#
# input UpdateUserInput {
#   name:     String   # semua opsional untuk update parsial
#   email:    String
#   avatarUrl: String
# }

# Di klien — menggunakan Input Type sebagai variable:
mutation DaftarAkun($data: CreateUserInput!) {
  createUser(input: $data) {
    id
    name
    email
    role
    createdAt
  }
}

# Variable yang dikirim:
# {
#   "data": {
#     "name": "Siti Rahayu",
#     "email": "siti@email.com",
#     "password": "katasandi123"
#     # "role" tidak perlu dikirim — pakai default value USER
#   }
# }

# Kelebihan mutation: bisa langsung dapat data hasil mutation
# dalam satu request, tanpa perlu GET request tambahan!`,
      explain: [
        '<b>Input Type</b> adalah tipe data khusus untuk argument mutation — berbeda dengan tipe output biasa (tidak bisa dipakai sebagai response type).',
        'Input Types memungkinkan pengelompokan banyak field menjadi satu argumen — kode lebih rapi, validasi lebih mudah.',
        'Setelah mutation berhasil, kita bisa langsung meminta field dari data yang baru dibuat/diubah — menghemat satu round-trip!'
      ]
    },
    {
      type: 'example',
      title: 'Directives @include dan @skip: Query Dinamis',
      lang: 'graphql',
      output: false,
      code: `# Directive mengubah eksekusi query secara kondisional
# @include(if: Boolean) — sertakan field JIKA kondisi true
# @skip(if: Boolean)    — lewati field JIKA kondisi true

query ProfilUser(
  $id: ID!
  $tampilkanEmail: Boolean!   # variable untuk kontrol
  $sembunyikanFoto: Boolean!
) {
  user(id: $id) {
    id
    name
    email @include(if: $tampilkanEmail)     # email hanya dikirim jika true
    avatarUrl @skip(if: $sembunyikanFoto)   # foto dilewati jika true
    posts {
      title
      content @include(if: $tampilkanEmail) # bisa di field nested juga
    }
  }
}

# Contoh penggunaan: tampilkan email hanya untuk admin
# Variables:
# {
#   "id": "42",
#   "tampilkanEmail": true,    # admin → email ditampilkan
#   "sembunyikanFoto": false   # foto tetap tampil
# }

# Untuk user biasa:
# {
#   "id": "42",
#   "tampilkanEmail": false,   # user biasa → email disembunyikan
#   "sembunyikanFoto": false
# }`,
      explain: [
        '<code>@include(if: true)</code> berarti "sertakan field ini". <code>@include(if: false)</code> berarti "jangan sertakan".',
        '<code>@skip</code> adalah kebalikannya: <code>@skip(if: true)</code> artinya "lewati / jangan sertakan".',
        'Gunakan <code>@include</code> saat kondisi defaultnya adalah <i>tidak tampil</i>; gunakan <code>@skip</code> saat kondisi defaultnya <i>tampil</i>.'
      ]
    },
    {
      type: 'live',
      title: 'Simulasi: Form Mutation Create User dengan Variables',
      lang: 'html',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: system-ui, sans-serif; font-size: 13px; margin: 10px; background: #f8fafc; }
  h3 { margin: 0 0 6px; font-size: 13px; color: #1e293b; }
  .layout { display: flex; gap: 12px; }
  .form-col { width: 220px; flex-shrink: 0; }
  .result-col { flex: 1; }
  .form-group { margin-bottom: 10px; }
  label { display: block; font-weight: 600; color: #475569; font-size: 12px; margin-bottom: 3px; }
  input, select {
    width: 100%; box-sizing: border-box; padding: 7px 8px;
    border: 1px solid #cbd5e1; border-radius: 5px; font-size: 12px;
  }
  input:focus, select:focus { outline: none; border-color: #8b5cf6; }
  .btn-run { width: 100%; padding: 9px; border: 0; border-radius: 6px;
             background: #8b5cf6; color: #fff; font-weight: 700; cursor: pointer; font-size: 13px; }
  .btn-run:hover { background: #7c3aed; }
  .btn-reset { width: 100%; padding: 7px; border: 1px solid #cbd5e1; border-radius: 6px;
               background: #fff; color: #64748b; font-weight: 600; cursor: pointer; font-size: 12px; margin-top: 6px; }
  .section-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;
                   letter-spacing: .5px; margin: 0 0 4px; }
  .code-box { background: #0f172a; color: #e2e8f0; padding: 10px; border-radius: 8px;
              font-family: monospace; font-size: 11px; white-space: pre-wrap; min-height: 100px; margin-bottom: 8px; }
  .code-box .kw  { color: #c084fc; }
  .code-box .op  { color: #67e8f9; }
  .code-box .var { color: #fbbf24; }
  .code-box .str { color: #86efac; }
  .resp-box { background: #0c2a4a; color: #bae6fd; padding: 10px; border-radius: 8px;
              font-family: monospace; font-size: 11px; white-space: pre-wrap; min-height: 80px; }
  .users-list { margin-top: 10px; }
  .user-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 6px;
               padding: 8px 10px; margin-bottom: 5px; display: flex; align-items: center; gap: 10px; }
  .user-avatar { width: 32px; height: 32px; border-radius: 50%; background: #8b5cf6;
                 display: flex; align-items: center; justify-content: center; color: #fff;
                 font-weight: 700; font-size: 14px; flex-shrink: 0; }
  .user-info .name { font-weight: 700; font-size: 12px; }
  .user-info .email { color: #64748b; font-size: 11px; }
  .user-info .role { display: inline-block; padding: 1px 7px; border-radius: 9999px; font-size: 10px;
                     font-weight: 700; color: #fff; margin-top: 2px; }
  .role-ADMIN { background: #dc2626; }
  .role-EDITOR { background: #d97706; }
  .role-USER { background: #2563eb; }
  .err { color: #f87171; font-size: 12px; margin-top: 4px; }
  .success-badge { display: inline-block; padding: 2px 10px; border-radius: 6px;
                   background: #dcfce7; color: #16a34a; font-weight: 700; font-size: 11px; margin-bottom: 4px; }
</style>
</head>
<body>
<div class="layout">
  <div class="form-col">
    <h3>📋 Form Tambah Pengguna</h3>
    <div class="form-group">
      <label>Nama Lengkap *</label>
      <input id="fName" type="text" placeholder="cth: Dewi Lestari">
    </div>
    <div class="form-group">
      <label>Alamat Email *</label>
      <input id="fEmail" type="email" placeholder="cth: dewi@email.com">
    </div>
    <div class="form-group">
      <label>Kata Sandi *</label>
      <input id="fPassword" type="password" placeholder="min. 8 karakter">
    </div>
    <div class="form-group">
      <label>Role</label>
      <select id="fRole">
        <option value="USER">User (default)</option>
        <option value="EDITOR">Editor</option>
        <option value="ADMIN">Admin</option>
      </select>
    </div>
    <div class="err" id="errMsg"></div>
    <button class="btn-run" onclick="runMutation()">▶ Jalankan Mutation</button>
    <button class="btn-reset" onclick="resetAll()">↺ Reset Semua</button>
  </div>

  <div class="result-col">
    <p class="section-label">Query GraphQL yang dibentuk:</p>
    <div class="code-box" id="queryBox">Isi form dan klik "Jalankan Mutation"...</div>

    <p class="section-label">Variables yang dikirim (terpisah dari query):</p>
    <div class="code-box" id="varsBox" style="background:#1a1a2e;color:#a5b4fc">—</div>

    <p class="section-label">Response dari server:</p>
    <div class="resp-box" id="respBox">—</div>

    <p class="section-label">Daftar pengguna saat ini:</p>
    <div class="users-list" id="usersList"></div>
  </div>
</div>

<script>
  let users = [
    { id: 'usr-001', name: 'Budi Santoso', email: 'budi@email.com', role: 'ADMIN', createdAt: '2020-01-15' },
    { id: 'usr-002', name: 'Ani Rahayu',   email: 'ani@email.com',  role: 'USER',  createdAt: '2021-03-22' }
  ];
  let nextNum = 3;

  function renderUsers() {
    const el = document.getElementById('usersList');
    el.innerHTML = users.map(u => {
      const initial = u.name.charAt(0).toUpperCase();
      return '<div class="user-card">' +
        '<div class="user-avatar">' + initial + '</div>' +
        '<div class="user-info">' +
          '<div class="name">' + u.name + '</div>' +
          '<div class="email">' + u.email + '</div>' +
          '<span class="role role-' + u.role + '">' + u.role + '</span>' +
        '</div></div>';
    }).join('');
  }

  function runMutation() {
    const name     = document.getElementById('fName').value.trim();
    const email    = document.getElementById('fEmail').value.trim();
    const password = document.getElementById('fPassword').value;
    const role     = document.getElementById('fRole').value;
    const errEl    = document.getElementById('errMsg');
    errEl.textContent = '';

    if (!name)  { errEl.textContent = '⚠️  Nama lengkap wajib diisi!'; return; }
    if (!email || !email.includes('@')) { errEl.textContent = '⚠️  Email tidak valid!'; return; }
    if (password.length < 8) { errEl.textContent = '⚠️  Kata sandi minimal 8 karakter!'; return; }
    if (users.find(u => u.email === email)) { errEl.textContent = '⚠️  Email sudah terdaftar!'; return; }

    // Tampilkan query (dengan variable placeholder)
    document.getElementById('queryBox').innerHTML =
      '<span class="kw">mutation</span> <span class="op">TambahPengguna</span>(<span class="var">$input</span>: CreateUserInput!) {\n' +
      '  createUser(input: <span class="var">$input</span>) {\n' +
      '    id\n    name\n    email\n    role\n    createdAt\n' +
      '  }\n}';

    // Tampilkan variables
    const variables = { input: { name, email, password: '••••••••', role } };
    document.getElementById('varsBox').textContent = JSON.stringify(variables, null, 2)
      .replace('"••••••••"', '"[dilindungi]"');

    // Simulasi server: buat user baru
    const newUser = {
      id: 'usr-00' + nextNum++,
      name, email, role,
      createdAt: new Date().toISOString().split('T')[0]
    };
    users.push(newUser);

    // Tampilkan response
    const response = {
      data: {
        createUser: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          createdAt: newUser.createdAt
        }
      }
    };

    const respEl = document.getElementById('respBox');
    respEl.innerHTML = '<span class="success-badge">✓ 200 OK — User berhasil dibuat!</span>\\n' +
      JSON.stringify(response, null, 2);

    renderUsers();

    // Reset form
    document.getElementById('fName').value    = '';
    document.getElementById('fEmail').value   = '';
    document.getElementById('fPassword').value = '';
    document.getElementById('fRole').value    = 'USER';
  }

  function resetAll() {
    users = [
      { id: 'usr-001', name: 'Budi Santoso', email: 'budi@email.com', role: 'ADMIN', createdAt: '2020-01-15' },
      { id: 'usr-002', name: 'Ani Rahayu',   email: 'ani@email.com',  role: 'USER',  createdAt: '2021-03-22' }
    ];
    nextNum = 3;
    document.getElementById('queryBox').textContent = 'Isi form dan klik "Jalankan Mutation"...';
    document.getElementById('varsBox').textContent  = '—';
    document.getElementById('respBox').textContent  = '—';
    document.getElementById('errMsg').textContent   = '';
    renderUsers();
  }

  renderUsers();
</script>
</body>
</html>`,
      hint: 'Isi form dan klik "Jalankan Mutation" untuk melihat query GraphQL yang dibentuk, variables yang dikirim terpisah, dan simulasi response JSON dari server.'
    },
    {
      type: 'tip',
      title: 'Variables Mencegah Injection & Meningkatkan Performa Cache',
      text: 'Menggunakan variables bukan hanya soal keamanan — ini juga praktik terbaik untuk performa. Ketika query dan variables dipisah, <b>string query-nya selalu sama</b> meskipun datanya berbeda. Ini memungkinkan server (atau CDN) melakukan <b>persisted query caching</b>: server tinggal menyimpan satu copy query yang sudah di-parse dan di-validasi, lalu hanya terima variable-nya saja. Hasilnya: request lebih cepat dan beban server berkurang.'
    },
    {
      type: 'vocab',
      items: [
        ['Mutation', 'Operasi GraphQL untuk mengubah data di server — create, update, atau delete. Selalu gunakan kata kunci <code>mutation</code>.'],
        ['Variables', 'Nilai dinamis yang dipisah dari string query dan dikirim dalam objek JSON tersendiri. Mencegah injection dan memungkinkan query caching.'],
        ['Input Type', 'Tipe data khusus dalam GraphQL Schema yang hanya digunakan sebagai argument mutation (bukan sebagai tipe response). Diawali kata kunci <code>input</code>.'],
        ['Directive', 'Anotasi khusus dalam query GraphQL yang mengubah cara eksekusi sebuah field. Format: <code>@namaDirective(argumen)</code>.'],
        ['@include', 'Directive yang menyertakan field dalam response <i>hanya jika</i> kondisi bernilai <code>true</code>. Sintaksis: <code>@include(if: $variabelBoolean)</code>.'],
        ['@skip', 'Directive yang melewati (tidak menyertakan) field dalam response <i>jika</i> kondisi bernilai <code>true</code>. Kebalikan dari <code>@include</code>.']
      ]
    }
  ],
  recap: [
    '<b>Mutation</b> menangani semua operasi tulis: <code>createUser</code>, <code>updateUser</code>, <code>deleteUser</code> — dibedakan lewat nama field, bukan HTTP method.',
    'Selalu gunakan <b>Variables</b>: kirim data secara terpisah dari string query untuk mencegah GraphQL Injection dan memungkinkan query caching.',
    '<b>Input Types</b> mengelompokkan banyak argument mutation menjadi satu objek yang terstruktur dan mudah divalidasi di server.',
    'Kelebihan mutation GraphQL: kamu bisa langsung mendapatkan <b>data hasil mutation</b> (ID baru, timestamp, dsb.) dalam satu round-trip.',
    '<b>@include</b> dan <b>@skip</b> membuat query menjadi dinamis berdasarkan kondisi — tanpa perlu menulis ulang string query di kode klien.'
  ]
});
