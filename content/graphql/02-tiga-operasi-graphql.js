/* ============================================================
   GraphQL — Bab 2: Tiga Operasi GraphQL: Query, Mutation, Subscription
   ============================================================ */
'use strict';

window.GRAPHQL_LESSONS = window.GRAPHQL_LESSONS || [];

window.GRAPHQL_LESSONS.push({
  id: 'tiga-operasi-graphql',
  title: 'Tiga Operasi GraphQL: Query, Mutation, Subscription',
  chapter: 'Konsep Dasar',
  duration: '10 menit',
  intro: [
    'Kalau REST menggunakan berbagai <b>HTTP method</b> (GET, POST, PUT, DELETE) untuk membedakan jenis aksi, GraphQL punya cara sendiri yang lebih eksplisit: tiga <b>operation type</b> yang masing-masing punya peran jelas — seperti tiga jenis karyawan di kantor: yang membaca arsip, yang membuat/mengubah dokumen, dan yang terus memantau situasi secara real-time.',
    'Memahami ketiga operasi ini adalah kunci untuk menulis kode GraphQL yang benar. Pelajaran ini membahas kapan dan bagaimana menggunakan <b>Query</b>, <b>Mutation</b>, dan <b>Subscription</b>.'
  ],
  objectives: [
    'Membedakan fungsi Query (baca), Mutation (tulis), dan Subscription (real-time)',
    'Memetakan operasi GraphQL ke padanan HTTP method di REST',
    'Menulis sintaksis dasar ketiga operasi GraphQL',
    'Memahami mengapa Subscription membutuhkan WebSocket, bukan HTTP biasa'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Tiga Operasi GraphQL vs HTTP Methods REST</h3><p>Tabel berikut memetakan padanan antara operasi GraphQL dengan HTTP method di REST:</p><table><thead><tr><th>Operasi GraphQL</th><th>Padanan REST</th><th>Fungsi</th><th>Contoh Aksi</th></tr></thead><tbody><tr><td><b>Query</b></td><td>GET</td><td>Membaca / mengambil data</td><td>Ambil profil user, daftar produk, detail artikel</td></tr><tr><td><b>Mutation</b></td><td>POST / PUT / PATCH / DELETE</td><td>Mengubah data (buat, perbarui, hapus)</td><td>Daftar akun baru, edit profil, hapus komentar</td></tr><tr><td><b>Subscription</b></td><td>WebSocket / SSE (tidak ada padanan HTTP langsung)</td><td>Mendengarkan perubahan data secara real-time</td><td>Notifikasi pesan baru, update stok langsung, live score</td></tr></tbody></table><p>Perbedaan mendasar: di REST, jenis aksi ditentukan oleh <i>HTTP method</i>. Di GraphQL, semua request dikirim via <b>POST ke satu endpoint</b>, dan jenis aksi ditentukan oleh <i>kata kunci di dalam body</i> (<code>query</code>, <code>mutation</code>, <code>subscription</code>).</p>'
    },
    {
      type: 'example',
      title: 'Operasi 1: Query — Membaca Data',
      lang: 'graphql',
      output: false,
      code: `# Query digunakan untuk MEMBACA data — setara GET di REST
# Operasi query bersifat "read-only", tidak mengubah data di server

query DaftarProduk {
  products(category: "elektronik", limit: 3) {
    id
    name
    price
    stock
    category {
      name
    }
  }
}

# Respon dari server (JSON):
# {
#   "data": {
#     "products": [
#       { "id": "1", "name": "Laptop Gaming", "price": 15000000,
#         "stock": 5, "category": { "name": "Elektronik" } },
#       { "id": "2", "name": "Mouse Wireless", "price": 250000,
#         "stock": 42, "category": { "name": "Elektronik" } }
#     ]
#   }
# }`,
      explain: [
        'Kata kunci <code>query</code> memberitahu server bahwa ini operasi baca — tidak ada data yang akan berubah.',
        '<code>DaftarProduk</code> adalah nama query — opsional, tapi sangat berguna untuk debugging dan logging di server.',
        'Argumen <code>(category: "elektronik", limit: 3)</code> adalah filter yang dikirim ke resolver di server.'
      ]
    },
    {
      type: 'example',
      title: 'Operasi 2: Mutation — Mengubah Data',
      lang: 'graphql',
      output: false,
      code: `# Mutation digunakan untuk MENGUBAH data (create, update, delete)
# Setara POST/PUT/PATCH/DELETE di REST

# Contoh 1: Membuat user baru (setara POST /users)
mutation DaftarPengguna {
  createUser(input: {
    name: "Siti Rahayu"
    email: "siti@email.com"
    password: "rahasia123"
  }) {
    id           # kita bisa langsung ambil data hasil mutation
    name
    email
    createdAt
  }
}

# Contoh 2: Memperbarui data (setara PUT /users/42)
mutation UpdateProfil {
  updateUser(id: "42", input: { name: "Siti Rahayu Putri" }) {
    id
    name
    updatedAt
  }
}

# Contoh 3: Menghapus data (setara DELETE /users/42)
mutation HapusUser {
  deleteUser(id: "42") {
    success
    message
  }
}`,
      explain: [
        'Kata kunci <code>mutation</code> secara eksplisit memberi tahu server bahwa aksi ini <i>akan mengubah data</i>.',
        'Keunikan GraphQL: setelah mutation berhasil, kita bisa langsung meminta data hasil perubahan dalam <b>satu request yang sama</b> — tidak perlu GET lagi setelahnya.',
        'Satu file bisa mendefinisikan banyak mutation, tapi hanya yang dipanggil oleh nama yang akan dieksekusi.'
      ]
    },
    {
      type: 'example',
      title: 'Operasi 3: Subscription — Data Real-time',
      lang: 'graphql',
      output: false,
      code: `# Subscription digunakan untuk MENDENGARKAN perubahan data secara real-time
# Koneksi tetap terbuka — server akan PUSH data setiap ada perubahan

# Contoh: pantau pesan baru di chat room
subscription PesanBaru {
  messageAdded(roomId: "room-123") {
    id
    content
    sender {
      name
      avatarUrl
    }
    sentAt
  }
}

# Contoh: pantau perubahan stok produk live
subscription StokBerubah {
  stockUpdated(productId: "prod-456") {
    productId
    productName
    oldStock
    newStock
    updatedAt
  }
}

# Di sisi klien (JavaScript dengan Apollo Client):
# const { data } = useSubscription(PESAN_BARU_SUBSCRIPTION, {
#   variables: { roomId: 'room-123' }
# });
# → setiap ada pesan baru, 'data' otomatis terupdate`,
      explain: [
        'Berbeda dengan Query dan Mutation yang request-response biasa, Subscription membuka <b>koneksi persisten</b> lewat WebSocket.',
        'Server yang aktif "mendorong" (push) data ke klien setiap ada perubahan — klien tidak perlu polling terus-menerus.',
        'Contoh penggunaan nyata: aplikasi chat, notifikasi real-time, live score pertandingan, dashboard monitoring server.'
      ]
    },
    {
      type: 'live',
      title: 'Simulasi: Query dan Mutation GraphQL Interaktif',
      lang: 'html',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: system-ui, sans-serif; font-size: 13px; margin: 10px; background: #f8fafc; }
  h3 { margin: 0 0 6px; font-size: 13px; }
  .tabs { display: flex; gap: 6px; margin-bottom: 10px; }
  .tab { padding: 6px 14px; border: 0; border-radius: 6px; cursor: pointer;
         background: #e2e8f0; font-weight: 600; font-size: 12px; }
  .tab.active { background: #8b5cf6; color: #fff; }
  .panel { display: none; } .panel.active { display: block; }
  .row { display: flex; gap: 10px; }
  .col { flex: 1; }
  label { display: block; margin-bottom: 4px; font-weight: 600; color: #475569; font-size: 12px; }
  input { width: 100%; box-sizing: border-box; padding: 6px 8px; border: 1px solid #cbd5e1;
          border-radius: 5px; font-size: 12px; }
  button { padding: 7px 14px; border: 0; border-radius: 6px; font-weight: 700;
           cursor: pointer; color: #fff; font-size: 12px; margin-top: 6px; }
  .btn-q { background: #2563eb; }
  .btn-m { background: #dc2626; }
  .log { background: #0f172a; color: #94a3b8; padding: 10px; border-radius: 6px; margin-top: 8px;
         font-family: monospace; white-space: pre-wrap; font-size: 11px; min-height: 100px; }
  .log .ok  { color: #4ade80; }
  .log .key { color: #7dd3fc; }
  .list { margin-top: 8px; }
  .item { background: #fff; border: 1px solid #e2e8f0; border-radius: 6px;
          padding: 6px 10px; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center; }
  .item-name { font-weight: 600; }
  .item-email { color: #64748b; font-size: 11px; }
  .del-btn { background: #ef4444; padding: 3px 8px; font-size: 11px; border: 0;
             border-radius: 4px; color: #fff; cursor: pointer; }
</style>
</head>
<body>
<div class="tabs">
  <button class="tab active" onclick="switchTab('query')">🔵 Query (Baca)</button>
  <button class="tab" onclick="switchTab('mutation')">🔴 Mutation (Tulis)</button>
</div>

<!-- PANEL QUERY -->
<div class="panel active" id="panel-query">
  <div class="row">
    <div class="col">
      <label>Filter nama (kosongkan untuk semua):</label>
      <input id="qFilter" placeholder="cth: budi" />
      <button class="btn-q" onclick="runQuery()">▶ Jalankan Query</button>
    </div>
  </div>
  <div class="log" id="logQ">Query belum dijalankan...</div>
  <div class="list" id="listQ"></div>
</div>

<!-- PANEL MUTATION -->
<div class="panel" id="panel-mutation">
  <div class="row">
    <div class="col">
      <label>Nama:</label>
      <input id="mName" placeholder="cth: Dewi Lestari" />
    </div>
    <div class="col">
      <label>Email:</label>
      <input id="mEmail" placeholder="cth: dewi@email.com" />
    </div>
  </div>
  <button class="btn-m" onclick="runMutation()">▶ Jalankan Mutation createUser</button>
  <div class="log" id="logM">Mutation belum dijalankan...</div>
  <div class="list" id="listM"></div>
</div>

<script>
  let users = [
    { id: 1, name: 'Budi Santoso', email: 'budi@email.com' },
    { id: 2, name: 'Ani Rahayu', email: 'ani@email.com' },
    { id: 3, name: 'Cahyo Purnomo', email: 'cahyo@email.com' }
  ];
  let nextId = 4;

  function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('panel-' + tab).classList.add('active');
  }

  function renderUsers(containerId, list) {
    const el = document.getElementById(containerId);
    if (!list.length) { el.innerHTML = '<div style="color:#94a3b8;font-size:12px;padding:6px">Tidak ada data.</div>'; return; }
    el.innerHTML = list.map(u =>
      '<div class="item"><div><div class="item-name">' + u.name + '</div><div class="item-email">' + u.email + '</div></div>' +
      '<button class="del-btn" onclick="deleteUser(' + u.id + ')">Hapus</button></div>'
    ).join('');
  }

  function runQuery() {
    const filter = document.getElementById('qFilter').value.toLowerCase();
    const log = document.getElementById('logQ');
    const filtered = filter ? users.filter(u => u.name.toLowerCase().includes(filter)) : users;

    log.innerHTML = '<span class="key">query</span> CariPengguna {\n' +
      '  users' + (filter ? '(name: \\"' + filter + '\\")' : '') + ' {\n    id\n    name\n    email\n  }\n}\n\n' +
      '<span class="ok">← 200 OK</span>\n' +
      JSON.stringify({ data: { users: filtered } }, null, 2);

    renderUsers('listQ', filtered);
  }

  function runMutation() {
    const name = document.getElementById('mName').value.trim();
    const email = document.getElementById('mEmail').value.trim();
    const log = document.getElementById('logM');

    if (!name || !email) { log.innerHTML = '⚠️  Nama dan email wajib diisi!'; return; }

    const newUser = { id: nextId++, name, email };
    users.push(newUser);

    log.innerHTML = '<span class="key">mutation</span> TambahPengguna {\n' +
      '  createUser(input: { name: \\"' + name + '\\", email: \\"' + email + '\\" }) {\n    id\n    name\n    email\n  }\n}\n\n' +
      '<span class="ok">← 200 OK — user berhasil dibuat:</span>\n' +
      JSON.stringify({ data: { createUser: newUser } }, null, 2);

    renderUsers('listM', users);
    document.getElementById('mName').value = '';
    document.getElementById('mEmail').value = '';
  }

  function deleteUser(id) {
    users = users.filter(u => u.id !== id);
    const log = document.getElementById('logM');
    log.innerHTML = '<span class="key">mutation</span> HapusPengguna {\n' +
      '  deleteUser(id: \\"' + id + '\\") {\n    success\n    message\n  }\n}\n\n' +
      '<span class="ok">← 200 OK</span>\n' +
      JSON.stringify({ data: { deleteUser: { success: true, message: 'User berhasil dihapus' } } }, null, 2);
    renderUsers('listM', users);
    renderUsers('listQ', users);
  }

  // Init
  runQuery();
  renderUsers('listM', users);
</script>
</body>
</html>`,
      hint: 'Coba tab Query untuk membaca data, dan tab Mutation untuk menambah/menghapus user. Perhatikan sintaksis GraphQL yang terbentuk di log.'
    },
    {
      type: 'warn',
      title: 'Subscription Butuh WebSocket — Tidak Bisa HTTP Biasa!',
      text: 'Subscription GraphQL <b>tidak bisa dijalankan lewat HTTP request biasa</b> karena HTTP bersifat <i>request-response</i> (satu tanya, satu jawab, selesai). Subscription butuh koneksi <b>WebSocket</b> yang tetap terbuka sehingga server bisa mengirim data kapan saja. Pastikan server GraphQL-mu mendukung WebSocket (contoh: <code>graphql-ws</code> atau <code>subscriptions-transport-ws</code>) dan CDN/proxy di depannya juga mendukung long-lived connection.'
    },
    {
      type: 'vocab',
      items: [
        ['Query', 'Operasi GraphQL untuk membaca data — bersifat read-only, tidak mengubah state di server. Setara GET di REST.'],
        ['Mutation', 'Operasi GraphQL untuk mengubah data: membuat, memperbarui, atau menghapus. Setara POST/PUT/DELETE di REST.'],
        ['Subscription', 'Operasi GraphQL untuk mendengarkan perubahan data secara real-time. Server aktif mengirim data ke klien setiap ada perubahan.'],
        ['WebSocket', 'Protokol komunikasi dua arah yang membuka koneksi persisten antara klien dan server — wajib untuk Subscription GraphQL.'],
        ['Real-time', 'Data yang diperbarui dan dikirim ke semua klien yang terhubung secara langsung, tanpa klien perlu meminta (polling) ulang.']
      ]
    }
  ],
  recap: [
    'GraphQL punya tiga operasi: <b>Query</b> (baca), <b>Mutation</b> (tulis/ubah/hapus), dan <b>Subscription</b> (real-time).',
    'Berbeda dengan REST yang membedakan aksi lewat HTTP method, GraphQL menggunakan <b>kata kunci eksplisit</b> di dalam body request.',
    'Keunggulan Mutation GraphQL: kamu bisa langsung mendapatkan <b>data hasil perubahan</b> dalam satu request yang sama.',
    '<b>Subscription</b> memerlukan koneksi <b>WebSocket</b> yang persisten — tidak bisa menggunakan HTTP request biasa.',
    'Semua Query dan Mutation GraphQL dikirim via <b>POST ke satu endpoint</b> (<code>/graphql</code>).'
  ]
});
