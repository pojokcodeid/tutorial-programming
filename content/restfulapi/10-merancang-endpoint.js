/* ============================================================
   Pelajaran Dasar RESTful API — Bab 10: Merancang Endpoint
   ============================================================ */
'use strict';

window.RESTFULAPI_LESSONS = window.RESTFULAPI_LESSONS || [];

window.RESTFULAPI_LESSONS.push({
  id: 'merancang-endpoint',
  title: 'Merancang Endpoint yang Enak Dibaca',
  chapter: 'Konsep REST',
  duration: '10 menit',
  intro: [
    'Pernahkah kamu masuk toko yang papan namanya jelas: "Kasir", "Ruang Ganti", "Informasi"? Toko seperti itu enak karena kamu langsung tahu harus ke mana. Endpoint yang dirancang rapi bekerja sama: siapa pun bisa menebak alamatnya.',
    'Pelajaran ini mengatur cara menamai resource, membatasi kedalaman path, memberi versi API, dan menyusun daftar endpoint untuk sebuah aplikasi toko. Setelahnya, kamu bisa menilai sebuah endpoint: rapi atau menyebalkan.'
  ],
  objectives: [
    'Menamai resource dengan kata benda jamak dan penulisan yang seragam',
    'Membatasi resource bersarang maksimal 2–3 level',
    'Memahami kegunaan versi API seperti /api/v1',
    'Menyusun daftar endpoint lengkap untuk satu aplikasi sederhana'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Nama Resource: Kata Benda, Bukan Kata Kerja</h3><p>Papan nama toko menulis <b>"Kasir"</b>, bukan <b>"Pergi Ke Kasir"</b>. Ia menyebut benda, bukan perintah. Endpoint juga begitu: path hanya menyebut <b>apa</b> yang dituju.</p><p>Aksinya dibawa oleh method. Membaca = GET, membuat = POST, mengganti = PUT. Jadi kamu tidak perlu menulis kata kerja di path.</p><ul><li>Pakai <b>kata benda jamak</b>: <code>/users</code>, bukan <code>/user</code> atau <code>/getUsers</code>.</li><li>Pakai <b>huruf kecil semua</b>: <code>/products</code>, bukan <code>/Products</code>.</li><li>Pisahkan kata dengan <b>strip (kebab-case)</b>: <code>/order-items</code>, bukan <code>/orderItems</code> atau <code>/order_items</code>.</li></ul>'
    },
    {
      type: 'example',
      title: 'Bandingkan: penamaan yang bikin pusing vs yang enak',
      lang: 'text',
      output: false,
      code: `# ❌ Susah ditebak
GET    /getUserById?id=42
POST   /doAddNewProduct
GET    /OrderList
POST   /product/update_price

# ✅ Enak ditebak
GET    /api/v1/users/42
POST   /api/v1/products
GET    /api/v1/orders
PATCH  /api/v1/products/12`,
      explain: [
        'Yang buruk mencampur kata kerja (<code>get</code>, <code>doAdd</code>, <code>update</code>) ke dalam path. Aksi sudah diwakili method.',
        'Yang buruk juga campur aduk gaya huruf besar-kecil dan gaya pemisah kata. Yang seragam selalu huruf kecil dengan strip.',
        'Yang rapi membuat kamu bisa menebak: buka daftar produk dengan <code>GET /api/v1/products</code>, buat baru dengan <code>POST</code> ke path yang sama.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Resource Bersarang: Cukup 2–3 Level</h3><p>Ada data yang memang "anak" dari data lain. Pesanan adalah milik sebuah pengguna. Maka alamatnya boleh disarang: <code>/users/42/orders</code> — "pesanan milik pengguna nomor 42".</p><p>Analoginya pos: kamu menulis alamat lengkap rumah, bukan seluruh riwayat hidup penghuninya. Cukup sampai alamat yang masuk akal.</p><blockquote style="border-left:3px solid var(--accent);padding-left:12px;margin:12px 0"><b>Batas wajar: 2–3 level.</b> <code>/users/42/orders</code> masih enak. <code>/users/42/orders/9/items/3/reviews</code> sudah membingungkan — pertimbangkan resource sendiri, misalnya <code>/reviews?item=3</code>.</blockquote><h3>Kenapa Perlu Versi API?</h3><p>Toko cetak buku panduan punya edisi. Edisi lama tetap beredar, edisi baru memuat perbaikan. Versi API bekerja sama: <code>/api/v1/products</code>, <code>/api/v2/products</code>.</p><p>Kelak kamu boleh mengubah bentuk data di v2 tanpa memutus aplikasi lama yang masih memanggil v1. Aplikasi di HP pengguna tidak bisa diperbarui serentak, jadi versi melindungi mereka dari kejutan.</p><p>Gunakan versi hanya saat ada perubahan besar yang merusak pemanggil lama. Perubahan kecil tidak perlu versi baru — cukup tambah field, jangan hapus atau ganti makna field lama.</p>'
    },
    {
      type: 'example',
      title: 'Daftar endpoint: aplikasi toko sederhana',
      lang: 'text',
      output: false,
      code: `# PRODUK
GET    /api/v1/products              → 200  daftar produk
GET    /api/v1/products/12           → 200  satu produk
POST   /api/v1/products              → 201  buat produk baru
PUT    /api/v1/products/12           → 200  ganti seluruh data
PATCH  /api/v1/products/12           → 200  ubah sebagian (mis. stok)
DELETE /api/v1/products/12           → 204  hapus produk

# KATEGORI
GET    /api/v1/categories            → 200
POST   /api/v1/categories            → 201
DELETE /api/v1/categories/5          → 204

# PESANAN
GET    /api/v1/orders                → 200  semua pesanan
GET    /api/v1/orders/99             → 200  satu pesanan
POST   /api/v1/orders                → 201  buat pesanan baru
GET    /api/v1/users/42/orders       → 200  pesanan milik user 42

# PENGGUNA
GET    /api/v1/users/42              → 200
PATCH  /api/v1/users/42              → 200  ubah profil
DELETE /api/v1/users/42              → 204`,
      explain: [
        'Perhatikan polanya: <b>path selalu nama resource</b>, method menentukan aksi, status sukses mengikuti jenis aksi.',
        'Data baru lahir → <code>201 Created</code>. Menghapus sukses → <code>204 No Content</code> (tidak ada isi yang perlu dibalas).',
        'ID selalu berada di path (<code>/products/12</code>), bukan disembunyikan di body. Ini membuat alamat jelas dan mudah dicatat.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Query Parameter: Filter dan Halaman</h3><p>Path menentukan <b>apa</b> yang dibaca. Query menentukan <b>cara</b> membacanya — menyaring, mencari, atau mengambil sebagian.</p><p>Analoginya rak arsip. <code>/products</code> berarti "ambil semua map produk". <code>?category=sepatu&amp;page=2</code> berarti "khusus map sepatu, ambil halaman 2".</p><ul><li>Filter: <code>/products?category=sepatu</code></li><li>Urutkan: <code>/products?sort=-price</code> (termahal dulu)</li><li>Halaman: <code>/products?page=2&amp;limit=10</code> (10 item per halaman)</li><li>Cari: <code>/products?search=lari</code></li></ul><p>Query boleh dikombinasikan. Yang penting: <b>jangan memindahkan aksi ke query</b>. <code>/products?action=delete</code> adalah kebiasaan buruk — hapus pakai <code>DELETE /products/12</code>.'
    },
    {
      type: 'text',
      html: '<h3>Kenapa Konsistensi Itu Berharga?</h3><p>Ketika semua resource ditulis seragam, programmer tidak perlu menebak-nebak. Ia cukup tahu satu pola, lalu berlaku untuk seluruh API.</p><ul><li>Dokumentasi jadi ringkas: cukup menjelaskan pola, bukan menguraikan tiap alamat satu per satu.</li><li>Kode pemanggil bisa memakai satu fungsi untuk semua resource. Menambah fitur jadi cepat.</li><li>Kesalahan menurun: tidak ada lagi perdebatan <code>/getOrder</code> vs <code>/fetch-order</code> vs <code>/orderDetail</code>.</li></ul><p>Konsistensi adalah wujud prinsip <b>uniform interface</b> dari pelajaran REST. Aturan main sama untuk semua resource, di seluruh API-mu.</p>'
    },
    {
      type: 'live',
      title: 'Latihan: perancang endpoint',
      lang: 'html',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Perancang Endpoint</title>
<style>
  body { font-family: system-ui, sans-serif; font-size: 14px; margin: 12px; color: #1f2937; }
  h2 { margin: 0 0 4px; font-size: 17px; color: #2563eb; }
  .ket { color: #6b7280; font-size: 13px; margin-bottom: 12px; }
  .skor { font-weight: 700; margin-bottom: 8px; }
  .kartu { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 12px; }
  .skenario { font-size: 14px; line-height: 1.5; margin: 4px 0 10px; }
  .blok { margin-bottom: 10px; }
  .blok b { display: block; font-size: 12px; color: #6b7280; margin-bottom: 6px; text-transform: uppercase; }
  .pilih { display: flex; flex-wrap: wrap; gap: 8px; }
  .pilih button { border: 1px solid #cbd5e1; background: #fff; border-radius: 8px; padding: 8px 12px; font-size: 13px; cursor: pointer; font-family: monospace; }
  .pilih button.teks { font-family: system-ui, sans-serif; }
  .pilih button:hover { border-color: #2563eb; }
  .pilih button.benar { background: #dcfce7; border-color: #16a34a; color: #14532d; font-weight: 700; }
  .pilih button.salah { background: #fee2e2; border-color: #dc2626; color: #7f1d1d; }
  .pilih button.dimatikan { opacity: .45; cursor: not-allowed; }
  .umpan { border-radius: 8px; padding: 10px 12px; font-size: 13px; line-height: 1.6; display: none; }
  .umpan.tampil { display: block; }
  .umpan.ok { background: #dcfce7; color: #14532d; }
  .umpan.no { background: #fee2e2; color: #7f1d1d; }
  .hasil { font-family: monospace; font-weight: 700; margin-bottom: 4px; }
  button.lanjut { border: 0; border-radius: 8px; padding: 9px 14px; background: #2563eb; color: #fff; font-weight: 700; cursor: pointer; margin-top: 10px; display: none; }
</style>
</head>
<body>
<h2>Perancang Endpoint</h2>
<div class="ket">Setiap ronde: baca skenario, pilih method yang tepat, lalu pilih penulisan path yang benar. Nilai muncul di akhir.</div>
<div class="skor" id="skor">Skor: 0 · Ronde: 1/8</div>
<div class="kartu">
  <b>Skenario</b>
  <p class="skenario" id="skenario"></p>
  <div class="blok">
    <b>1. Method apa?</b>
    <div class="pilih" id="method"></div>
  </div>
  <div class="blok">
    <b>2. Path mana yang benar?</b>
    <div class="pilih" id="path"></div>
  </div>
</div>
<div class="umpan" id="umpan"></div>
<button class="lanjut" id="lanjut">Ronde berikutnya</button>
<script>
  var soal = [
    { t: 'Toko menampilkan daftar semua produk di beranda.', m: 'GET', p: '/api/v1/products', o: ['/api/v1/products', '/api/v1/getProducts', '/api/v1/product/list'] },
    { t: 'Pembeli menekan tombol "Tambah ke Keranjang" untuk produk id 12.', m: 'POST', p: '/api/v1/cart/items', o: ['/api/v1/cart/items', '/api/v1/addToCart', '/api/v1/cart/12/add'] },
    { t: 'Admin mengganti SELURUH data produk id 7 (nama, harga, stok, foto).', m: 'PUT', p: '/api/v1/products/7', o: ['/api/v1/products/7', '/api/v1/updateProduct/7', '/api/v1/products?id=7'] },
    { t: 'Kurir hanya memperbarui STATUS pesanan id 99 menjadi "selesai".', m: 'PATCH', p: '/api/v1/orders/99', o: ['/api/v1/orders/99', '/api/v1/orders/99/status', '/api/v1/changeOrderStatus'] },
    { t: 'Admin menghapus kategori id 5 yang sudah tidak dipakai.', m: 'DELETE', p: '/api/v1/categories/5', o: ['/api/v1/categories/5', '/api/v1/deleteCategory/5', '/api/v1/categories/5/remove'] },
    { t: 'Pengguna melihat riwayat semua pesanan milik dirinya (id 42).', m: 'GET', p: '/api/v1/users/42/orders', o: ['/api/v1/users/42/orders', '/api/v1/orders/user?id=42', '/api/v1/getOrderHistory'] },
    { t: 'Aplikasi memuat produk kategori "sepatu", halaman 2, 10 item per halaman.', m: 'GET', p: '/api/v1/products?category=sepatu&page=2&limit=10', o: ['/api/v1/products?category=sepatu&page=2&limit=10', '/api/v1/sepatu/products/page/2', '/api/v1/products/sepatu/2'] },
    { t: 'Pelanggan membatalkan pesanan id 3 miliknya.', m: 'DELETE', p: '/api/v1/orders/3', o: ['/api/v1/orders/3', '/api/v1/orders/3/cancel', '/api/v1/cancelOrder?id=3'] }
  ];
  var metode = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  var ronde = 0, skor = 0, kunciMethod = '', kunciPath = '', jawabMethod = null, jawabPath = null;

  function $(x) { return document.getElementById(x); }

  function mulai() {
    ronde = 0; skor = 0;
    rondeBerikut();
  }

  function rondeBerikut() {
    var s = soal[ronde];
    kunciMethod = s.m; kunciPath = s.p;
    jawabMethod = null; jawabPath = null;
    $('skenario').textContent = s.t;
    $('skor').textContent = 'Skor: ' + skor + ' · Ronde: ' + (ronde + 1) + '/' + soal.length;
    $('umpan').className = 'umpan';
    $('lanjut').style.display = 'none';

    var wm = $('method'); wm.innerHTML = '';
    metode.forEach(function (m) {
      var b = document.createElement('button');
      b.textContent = m;
      b.onclick = function () { pilihMethod(m, b); };
      wm.appendChild(b);
    });

    var wp = $('path'); wp.innerHTML = '';
    var opsi = s.o.slice();
    for (var i = opsi.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = opsi[i]; opsi[i] = opsi[j]; opsi[j] = t;
    }
    opsi.forEach(function (p) {
      var b = document.createElement('button');
      b.textContent = p;
      b.onclick = function () { pilihPath(p, b); };
      wp.appendChild(b);
    });
  }

  function kunciBaris(id) {
    var bs = $(id).getElementsByTagName('button');
    for (var i = 0; i < bs.length; i++) bs[i].className = 'dimatikan';
  }

  function tandaiBenar(id, nilai) {
    var bs = $(id).getElementsByTagName('button');
    for (var i = 0; i < bs.length; i++) {
      if (bs[i].textContent === nilai) bs[i].className = 'benar';
    }
  }

  function pilihMethod(m, b) {
    if (jawabMethod) return;
    jawabMethod = m;
    if (m === kunciMethod) { b.className = 'benar'; }
    else { b.className = 'salah'; tandaiBenar('method', kunciMethod); }
    kunciBaris('method');
    cek();
  }

  function pilihPath(p, b) {
    if (jawabPath) return;
    jawabPath = p;
    if (p === kunciPath) { b.className = 'benar'; }
    else { b.className = 'salah'; tandaiBenar('path', kunciPath); }
    kunciBaris('path');
    cek();
  }

  function cek() {
    if (!jawabMethod || !jawabPath) return;
    var benar = jawabMethod === kunciMethod && jawabPath === kunciPath;
    if (benar) skor++;
    var u = $('umpan');
    u.className = 'umpan tampil ' + (benar ? 'ok' : 'no');
    u.innerHTML = '<div class="hasil">' + kunciMethod + ' ' + kunciPath + ' &nbsp;→&nbsp; status sukses</div>' +
      (benar ? 'Tepat sekali! Method dan path-nya sudah sesuai pola REST.'
             : 'Belum tepat. Yang benar: <b>' + kunciMethod + ' ' + kunciPath + '</b>. Ingat: path hanya nama resource, aksi dibawa method, dan filter/halaman lewat query.');
    $('skor').textContent = 'Skor: ' + skor + ' · Ronde: ' + (ronde + 1) + '/' + soal.length;
    if (ronde < soal.length - 1) {
      $('lanjut').textContent = 'Ronde berikutnya';
    } else {
      $('lanjut').textContent = 'Lihat hasil akhir';
    }
    $('lanjut').style.display = 'inline-block';
  }

  $('lanjut').onclick = function () {
    if (ronde < soal.length - 1) {
      ronde++;
      rondeBerikut();
    } else {
      var u = $('umpan');
      u.className = 'umpan tampil ' + (skor >= 6 ? 'ok' : 'no');
      u.textContent = 'Hasil akhir: ' + skor + ' dari ' + soal.length + ' ronde benar. ' +
        (skor >= 6 ? 'Kerja bagus — pola penamaan sudah melekat.' : 'Ulangi lagi sampai semua benar. Kuncinya: path = nama resource, method = aksi.');
      $('lanjut').textContent = 'Main lagi';
      ronde = -1;
      this.onclick = function () { mulai(); };
    }
  };

  mulai();
</script>
</body>
</html>`,
      hint: 'Kerjakan 8 ronde: pilih method dulu, lalu path yang benar. Kalau salah, jawaban benar disorot dan alasannya ditampilkan. Target skor 8/8.'
    },
    {
      type: 'tip',
      title: 'Uji endpoint dengan membacanya keras-keras',
      text: 'Bacakan endpoint dengan kalimat manusia biasa. <code>GET /api/v1/users/42/orders</code> terbaca "ambil pesanan milik pengguna 42". Kalau tidak bisa dibaca lancar, rancanganmu perlu diperbaiki. Cara ini cepat menangkap penulisan yang janggal.'
    },
    {
      type: 'warn',
      title: 'Hindari tiga kebiasaan buruk ini',
      text: 'Satu: menaruh kata kerja di path (<code>/doDeleteProduct</code>). Dua: menyimpan ID di query saat membaca satu data (<code>/products?id=12</code> — benarnya <code>/products/12</code>). Tiga: bersarang terlalu dalam (<code>/users/1/orders/2/items/3</code>). Ketiganya membuat API susah ditebak dan susah didokumentasikan.'
    },
    {
      type: 'vocab',
      items: [
        ['Resource', 'Objek data yang disediakan API, misalnya produk, pesanan, pengguna.'],
        ['Endpoint', 'Kombinasi method + path yang bisa dipanggil, misalnya GET /api/v1/products.'],
        ['Kebab-case', 'Gaya penulisan kata dengan strip, contoh: order-items.'],
        ['Resource bersarang', 'Resource yang alamatnya mencantumkan induknya, contoh: /users/42/orders.'],
        ['Versi API', 'Penanda edisi pada path, contoh /v1, agar perubahan besar tidak merusak pemanggil lama.'],
        ['Query parameter', 'Tambahan di tanda tanya (?) untuk filter, urutan, dan halaman.'],
        ['Konsistensi penamaan', 'Semua resource ditulis dengan pola yang sama agar mudah ditebak.']
      ]
    }
  ],
  recap: [
    'Path hanya menyebut <b>kata benda jamak</b>: <code>/users</code>, bukan <code>/getUsers</code>.',
    'Penulisan seragam: huruf kecil, dipisah strip (kebab-case), hindari kata kerja.',
    'Resource bersarang cukup <b>2–3 level</b>, contoh: <code>/users/42/orders</code>.',
    'Versi API (<code>/api/v1</code>) melindungi pemanggil lama saat ada perubahan besar.',
    'Aksi ada di method, filter dan halaman ada di query — bukan kebalikannya.'
  ]
});
