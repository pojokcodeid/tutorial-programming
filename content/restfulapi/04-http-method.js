/* ============================================================
   Pelajaran Dasar RESTful API — Bab 4: HTTP Method
   ============================================================ */
'use strict';

window.RESTFULAPI_LESSONS = window.RESTFULAPI_LESSONS || [];

window.RESTFULAPI_LESSONS.push({
  id: 'http-method',
  title: 'HTTP Method: GET, POST, PUT, PATCH, DELETE',
  chapter: 'HTTP Dasar',
  duration: '10 menit',
  intro: [
    'Di perpustakaan ada prosedur berbeda untuk <b>membaca daftar buku</b>, <b>mendaftar jadi anggota</b>, dan <b>mengembalikan buku</b>. Di API juga ada tombol-tombol aksi. Itulah <b>HTTP method</b>.',
    'Pelajaran ini memetakan 5 method utama ke operasi CRUD, lengkap dengan status code sukses yang menyertainya.'
  ],
  objectives: [
    'Menjelaskan arti GET, POST, PUT, PATCH, dan DELETE',
    'Memetakan 5 method utama ke operasi CRUD',
    'Membedakan PUT dengan PATCH',
    'Menyusun kombinasi method + endpoint yang tepat untuk satu skenario'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Dunia Data = CRUD</h3><p>Hampir semua kegiatan di aplikasi bisa diringkas jadi 4 operasi. Istilah kerennya <b>CRUD</b>:</p><table><thead><tr><th>Operasi</th><th>Arti</th><th>Contoh di aplikasi</th></tr></thead><tbody><tr><td><b>C</b>reate</td><td>Membuat data baru</td><td>Daftar akun, buat pesanan</td></tr><tr><td><b>R</b>ead</td><td>Membaca data</td><td>Lihat daftar produk</td></tr><tr><td><b>U</b>pdate</td><td>Mengubah data</td><td>Ganti alamat pengiriman</td></tr><tr><td><b>D</b>elete</td><td>Menghapus data</td><td>Hapus item dari keranjang</td></tr></tbody></table><p>HTTP method adalah tombol untuk menekan operasi-operasi itu.</p>'
    },
    {
      type: 'text',
      html: '<h3>Analogi Buku Tamu Perpustakaan</h3><p>Bayangkan kamu berdiri di depan buku tamu perpustakaan:</p><ul><li><b>GET</b> — membaca daftar anggota yang sudah tercatat. Tidak mengubah apa pun.</li><li><b>POST</b> — menambah satu anggota baru ke buku tamu.</li><li><b>PUT</b> — mengganti <b>seluruh</b> data satu anggota: nama, alamat, dan telepon sekaligus.</li><li><b>PATCH</b> — memperbarui <b>sebagian</b> saja, misalnya hanya nomor telepon.</li><li><b>DELETE</b> — menghapus satu baris anggota.</li></ul><p>Perhatikan: membaca (GET) tidak pernah mengubah buku tamu. Aksi mengubah selalu membawa isi baru di body.</p>'
    },
    {
      type: 'example',
      title: 'Pemetaan CRUD → method → endpoint → status sukses',
      lang: 'text',
      output: false,
      code: `Membaca daftar     GET    /users        → 200 OK
Membaca satu       GET    /users/42     → 200 OK
Membuat baru       POST   /users        → 201 Created
Mengganti semua    PUT    /users/42     → 200 OK
Memperbarui        PATCH  /users/42     → 200 OK
sebagian
Menghapus          DELETE /users/42     → 204 No Content`,
      explain: [
        'Perhatikan polanya: <b>membuat</b> memakai <code>POST</code> ke koleksi (<code>/users</code>) tanpa id.',
        'Operasi pada <b>satu data</b> selalu menulis id di ujung path: <code>/users/42</code>.',
        'Membuat data baru membalas <b>201</b>. Menghapus membalas <b>204</b>: sukses tanpa isi jawaban.',
        'Status code tiap kode dibahas tuntas di pelajaran berikutnya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Aturan Emas: Method = AKSI, Path = SIAPA</h3><p>Ingat satu kalimat ini: <b>method menentukan AKSI, path menentukan SIAPA yang diaksi</b>.</p><p>Cara membaca <code>DELETE /products/42</code>: aksinya "hapus", yang dihapus "produk id 42".</p><p>Contoh salah kaprah: <code>/deleteProducts</code>. Aksinya disimpan di URL, padahal tempatnya di method. URL yang baik hanya menyebut siapa: <code>/products</code>.</p><p>Aturan ini membuat kamu cukup menghafal 5 method, bukan ratusan nama aksi.</p>'
    },
    {
      type: 'text',
      html: '<h3>PUT vs PATCH: Sering Tertukar</h3><p>Keduanya mengubah data, tapi bedanya penting:</p><table><thead><tr><th></th><th>PUT</th><th>PATCH</th></tr></thead><tbody><tr><td><b>Cakupan</b></td><td>Mengganti <b>seluruh</b> data</td><td>Memperbarui <b>sebagian</b></td></tr><tr><td><b>Isi body</b></td><td>Lengkap</td><td>Hanya bagian yang berubah</td></tr><tr><td><b>Contoh</b></td><td>Ganti nama, harga, dan stok sekaligus</td><td>Ganti harga saja</td></tr></tbody></table><p>Contoh nyata: mengubah alamat kirim di e-wallet cukup PATCH. Mengganti seluruh profil kamu memakai PUT.</p><p>Praktik lapangan: banyak API modern hanya memakai PATCH untuk perubahan sebagian.</p>'
    },
    {
      type: 'example',
      title: 'Dari skenario ke kombinasi method + endpoint',
      lang: 'text',
      output: false,
      code: `1. "Lihat semua pesanan saya"
   → GET /orders

2. "Ubah harga produk 42 jadi 425000"
   → PATCH /products/42
     body: {"price":425000}

3. "Batalkan pesanan nomor 7"
   → DELETE /orders/7

4. "Daftar jadi anggota baru"
   → POST /users
     body: {"name":"Budi","email":"budi@mail.com"}`,
      explain: [
        'Tanya dirimu dulu: aksinya membuat, membaca, mengubah, atau menghapus? Itu menentukan <b>method</b>.',
        'Lalu tanyakan: yang diaksi satu data atau seluruh koleksi? Itu menentukan ada tidaknya <b>id</b> di path.',
        'Data yang dikirim saat membuat atau mengubah selalu diletakkan di <b>body</b>.',
        'Jawaban untuk skenario "ubah harga satu produk" ada di nomor 2: cukup menyentuh satu bagian, jadi PATCH.'
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: pilih method + endpoint, lihat balasannya',
      lang: 'html',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: system-ui, sans-serif; font-size: 14px; margin: 12px; color: #0f172a; }
  h4 { margin: 14px 0 6px; font-size: 13px; color: #475569; }
  .choices { display: flex; gap: 6px; flex-wrap: wrap; }
  button { padding: 7px 12px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; color: #0f172a; cursor: pointer; font-size: 13px; }
  button.active { background: #2563eb; border-color: #2563eb; color: #fff; font-weight: 700; }
  #result { display: block; margin-top: 16px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; background: #f8fafc; }
  #combo { font-family: ui-monospace, Menlo, monospace; font-size: 15px; font-weight: 700; }
  #code { font-family: ui-monospace, Menlo, monospace; font-size: 22px; font-weight: 800; margin: 8px 0; }
  #desc { color: #334155; }
  #rule { margin-top: 8px; font-size: 12px; color: #64748b; }
</style>
</head>
<body>
<p>Pasangkan satu method (aksi) dengan satu endpoint (siapa), lalu lihat balasan khas server:</p>
<h4>Method — menentukan AKSI</h4>
<div class="choices" id="methodChoices"></div>
<h4>Endpoint — menentukan SIAPA</h4>
<div class="choices" id="endpointChoices"></div>
<div id="result">
  <div id="combo"></div>
  <div id="code"></div>
  <div id="desc"></div>
  <div id="rule">Ingat: method = AKSI, path = SIAPA yang diaksi.</div>
</div>
<script>
  var methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  var endpoints = ['/users', '/users/42', '/products/42'];
  var matrix = {
    'GET /users': { code: '200 OK', ok: true, desc: 'membaca daftar user — tidak mengubah apa pun' },
    'GET /users/42': { code: '200 OK', ok: true, desc: 'membaca satu user dengan id 42' },
    'GET /products/42': { code: '200 OK', ok: true, desc: 'membaca satu produk dengan id 42' },
    'POST /users': { code: '201 Created', ok: true, desc: 'membuat user baru — server mengembalikan id barunya' },
    'POST /users/42': { code: '405 Method Not Allowed', ok: false, desc: 'POST dipakai untuk membuat di koleksi, bukan di item — server menolak' },
    'POST /products/42': { code: '405 Method Not Allowed', ok: false, desc: 'POST ke satu produk tidak lazim — server menolak' },
    'PUT /users': { code: '405 Method Not Allowed', ok: false, desc: 'PUT butuh target jelas (satu data), bukan seluruh koleksi' },
    'PUT /users/42': { code: '200 OK', ok: true, desc: 'mengganti seluruh data user 42 — body harus lengkap' },
    'PUT /products/42': { code: '200 OK', ok: true, desc: 'mengganti seluruh data produk 42 — nama, harga, dan stok' },
    'PATCH /users': { code: '405 Method Not Allowed', ok: false, desc: 'PATCH juga butuh satu data yang jelas sebagai target' },
    'PATCH /users/42': { code: '200 OK', ok: true, desc: 'memperbarui sebagian data user 42, misalnya alamat saja' },
    'PATCH /products/42': { code: '200 OK', ok: true, desc: 'memperbarui sebagian data produk, misalnya harga saja' },
    'DELETE /users': { code: '405 Method Not Allowed', ok: false, desc: 'menghapus semua user tidak lazim — server menolak' },
    'DELETE /users/42': { code: '204 No Content', ok: true, desc: 'user 42 terhapus — sukses tanpa isi jawaban' },
    'DELETE /products/42': { code: '204 No Content', ok: true, desc: 'produk 42 terhapus — sukses tanpa isi jawaban' }
  };
  var state = { method: 'GET', endpoint: '/users' };

  function renderButtons(boxId, items, isActive, onPick) {
    var box = document.getElementById(boxId);
    box.innerHTML = '';
    items.forEach(function (item) {
      var btn = document.createElement('button');
      btn.textContent = item;
      if (isActive(item)) { btn.className = 'active'; }
      btn.onclick = function () { onPick(item); render(); };
      box.appendChild(btn);
    });
  }

  function render() {
    renderButtons('methodChoices', methods,
      function (v) { return state.method === v; },
      function (v) { state.method = v; });
    renderButtons('endpointChoices', endpoints,
      function (v) { return state.endpoint === v; },
      function (v) { state.endpoint = v; });

    var key = state.method + ' ' + state.endpoint;
    var r = matrix[key];
    document.getElementById('combo').textContent = key;
    var codeEl = document.getElementById('code');
    codeEl.textContent = r.code;
    codeEl.style.color = r.ok ? '#16a34a' : '#dc2626';
    document.getElementById('desc').textContent = r.desc;
  }
  render();
</script>
</body>
</html>`,
      hint: 'Coba pasangkan tiap method dengan ketiga endpoint. Perhatikan mana kombinasi yang lazim dan mana yang ditolak server.'
    },
    {
      type: 'tip',
      title: 'Dua method tambahan: HEAD & OPTIONS',
      text: 'Cukup kenali namanya dulu. <b>HEAD</b> sama seperti GET, tapi server hanya mengirim header tanpa isi — cocok untuk mengecek apakah file ada. <b>OPTIONS</b> menanyakan method apa saja yang diterima sebuah endpoint. Saat baru belajar, yang wajib dikuasai tetap 5 method utama.'
    },
    {
      type: 'warn',
      title: 'Jangan pernah pakai GET untuk menghapus',
      text: 'GET seharusnya <b>tidak pernah mengubah data</b>. Browser, proxy, dan mesin pencari menganggap GET aman, bahkan bisa mengulangnya otomatis. Kalau GET dipakai menghapus, suatu saat data bisa terhapus tanpa sengaja. Pelajaran safe &amp; idempotent membahas ini lebih dalam.'
    },
    {
      type: 'vocab',
      items: [
        ['HTTP method', 'Kode pada request yang menyatakan aksi: GET, POST, PUT, PATCH, DELETE.'],
        ['CRUD', 'Create, Read, Update, Delete — empat operasi dasar pada data.'],
        ['GET', 'Membaca data tanpa mengubah apa pun; balasan suksesnya 200.'],
        ['POST', 'Membuat data baru; balasan suksesnya 201 Created.'],
        ['PUT', 'Mengganti seluruh data satu resource.'],
        ['PATCH', 'Memperbarui sebagian data saja.'],
        ['DELETE', 'Menghapus data; balasan suksesnya 204 No Content.'],
        ['Idempoten', 'Istilah lanjutan: diulang berkali hasil akhirnya sama — sifat GET, PUT, DELETE.']
      ]
    }
  ],
  recap: [
    'Kegiatan API diringkas jadi <b>CRUD</b>: Create, Read, Update, Delete.',
    '5 method utama: <b>GET</b> membaca, <b>POST</b> membuat, <b>PUT</b> mengganti semua, <b>PATCH</b> memperbarui sebagian, <b>DELETE</b> menghapus.',
    'Aturan emas: <b>method = AKSI, path = SIAPA</b> yang diaksi.',
    'Membuat data baru membalas <b>201</b>; menghapus membalas <b>204</b> tanpa isi.',
    'PUT mengganti seluruh data; PATCH hanya menyentuh bagian yang berubah.'
  ]
});
