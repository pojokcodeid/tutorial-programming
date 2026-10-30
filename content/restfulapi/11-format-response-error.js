/* ============================================================
   Pelajaran Dasar RESTful API — Bab 11: Format Response & Error
   ============================================================ */
'use strict';

window.RESTFULAPI_LESSONS = window.RESTFULAPI_LESSONS || [];

window.RESTFULAPI_LESSONS.push({
  id: 'format-response-error',
  title: 'Format Response & Error yang Konsisten',
  chapter: 'Konsep REST',
  duration: '10 menit',
  intro: [
    'Bayangkan belanja di dua kasir. Kasir pertama selalu memberi struk rapi: tanggal, daftar belanja, total. Kasir kedua kadang hanya menyebut angka, kadang menulis bebas. Kamu pasti lebih percaya yang pertama.',
    'API juga memberi "struk" berupa respons. Pelajaran ini mengatur bentuk respons sukses dan gagal supaya selalu seragam, aman, dan mudah dibaca program yang memanggilnya.'
  ],
  objectives: [
    'Menulis contoh respons sukses dan gagal dalam bentuk JSON',
    'Menjelaskan kenapa bentuk respons harus konsisten',
    'Menyusun pesan error yang aman tanpa membocorkan detail internal',
    'Melengkapi respons daftar data dengan field bantu seperti meta'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Bentuk Respons yang Selalu Sama</h3><p>Struk toko punya bagian tetap: nama toko, tanggal, daftar belanja, total. Karena selalu sama, mata kamu tahu harus baca di mana.</p><p>Respons API juga sebaiknya punya bagian tetap. Bentuk yang umum dipakai:</p><table><thead><tr><th>Bagian</th><th>Isi</th><th>Untuk siapa</th></tr></thead><tbody><tr><td><code>success</code></td><td><code>true</code> atau <code>false</code></td><td>Program (penanda cepat)</td></tr><tr><td><code>message</code></td><td>Kalimat singkat hasil aksi</td><td>Manusia</td></tr><tr><td><code>data</code></td><td>Isi yang diminta</td><td>Program</td></tr><tr><td><code>error</code></td><td>Kode + detail kegagalan</td><td>Program &amp; manusia</td></tr></tbody></table><p>Aturan mainnya sederhana: <b>respons sukses memakai <code>data</code>, respons gagal memakai <code>error</code></b>. Keduanya tidak boleh bertukar tempat.</p><h3>Kenapa Harus Konsisten?</h3><p>Program yang memanggil API menulis kode membaca respons. Kalau semua endpoint memakai bentuk yang sama, kode itu ditulis <b>sekali</b> dan berlaku untuk semuanya.</p><p>Kebalikannya menyakitkan. Bayangkan endpoint A membalas <code>{"produk": ...}</code>, endpoint B membalas <code>{"items": ...}</code>, endpoint C membalas <code>{"result": ...}</code>. Pemanggil harus menulis pengecekan khusus tiap kali. Satu saja lupa, aplikasi error di tengah jalan.</p><blockquote style="border-left:3px solid var(--accent);padding-left:12px;margin:12px 0"><b>Konsistensi = kesopanan kepada pemanggil.</b> Bentuk yang seragam membuat kode pemanggil pendek, mudah diuji, dan jarang rusak.</blockquote><p>Terapkan bentuk yang sama ke semua endpoint: login, daftar produk, simpan pesanan. Tidak ada endpoint yang boleh "bermain sendiri".'
    },
    {
      type: 'example',
      title: 'Contoh respons sukses (200 OK)',
      lang: 'json',
      output: false,
      code: `{
  "success": true,          // penanda cepat: permintaan berhasil
  "message": "Produk berhasil dimuat.",  // kalimat untuk manusia
  "data": {                 // isi yang diminta program
    "id": 12,
    "name": "Sepatu Lari",
    "price": 450000,
    "stock": 7
  }
}`,
      explain: [
        '<code>data</code> selalu ada pada respons sukses, walau isinya <code>null</code> atau <code>[]</code>. Program pemanggil tidak perlu bertanya "field-nya ada?"',
        '<code>message</code> untuk ditampilkan ke manusia; <code>data</code> untuk diproses program. Jangan mencampur keduanya.',
        'Status code tetap dikirim: <code>200 OK</code>. Bentuk respons tidak menggantikan status code.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh respons gagal (404 &amp; 422)',
      lang: 'json',
      output: false,
      code: `// GET /api/v1/products/99 → 404 Not Found
{
  "success": false,
  "error": {
    "code": "PRODUK_TIDAK_DITEMUKAN",  // kode tetap untuk program
    "message": "Produk dengan id 99 tidak ditemukan."  // untuk manusia
  }
}

// POST /api/v1/products (harga kosong) → 422 Unprocessable Entity
{
  "success": false,
  "error": {
    "code": "VALIDASI_GAGAL",
    "message": "Harga wajib diisi."
  }
}`,
      explain: [
        'Respons gagal memakai <code>error</code>, bukan <code>data</code>. Program cukup mengecek: ada <code>error</code> berarti gagal.',
        '<code>code</code> berisi kode tetap (misalnya <code>VALIDASI_GAGAL</code>). Program boleh mengambil keputusan dari kode ini.',
        '<code>message</code> berisi kalimat ramah. Jangan minta program menebak isi kalimat untuk mengambil keputusan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Pesan Error: Aman dan Jelas</h3><p>Kasir toko yang baik bilang <b>"barang itu sedang tidak tersedia"</b>. Ia tidak membuka-buka gudang sambil berkata "gudang rusak, rak 3 berantakan, komputer kasir error di baris 42". Informasi internal gudang bukan urusan pembeli.</p><p>Begitu juga API. Pesan error harus <b>aman</b> — tidak membocorkan detail internal — dan <b>jelas</b> — bisa dipahami orang awam.</p><ul><li>Boleh: "Produk dengan id 99 tidak ditemukan."</li><li>Boleh: "Harga wajib diisi."</li><li><b>Tidak boleh</b>: "SQLSTATE[HY000] Connection refused at /var/www/db.php line 42, password=rahasia123"</li></ul><p>Detail galat teknis seperti jejak galat (stack trace), nama berkas server, dan isi perintah database sebaiknya <b>dicatat di log server</b> untuk tim developer, bukan dikirim ke pengguna.'
    },
    {
      type: 'text',
      html: `<h3>Field Bantu: meta untuk Daftar Data</h3><p>Saat API mengirim daftar yang dibagi halaman, pengguna perlu tahu posisinya. Analoginya katalog tebal: di sampul tertulis "halaman 2 dari 15". Tanpa itu, kamu tidak tahu masih ada halaman berikutnya.</p><p>Maka lengkapi respons daftar dengan <code>meta</code>:</p><pre style="background:#0f172a;color:#e2e8f0;padding:10px;border-radius:8px;overflow-x:auto"><code>{
  "success": true,
  "data": [ ... 10 produk ... ],
  "meta": {
    "page": 2,        // halaman yang sedang dibaca
    "limit": 10,      // item per halaman
    "total": 57,      // seluruh jumlah data
    "totalPages": 6   // jumlah halaman
  }
}</code></pre><p>Tanpa <code>meta</code>, tombol "Halaman Berikutnya" di aplikasi jadi tidak bisa diputuskan dengan benar. Aplikasi akan menebak: apakah masih ada data atau tidak.`
    },
    {
      type: 'text',
      html: '<h3>Status Code dan Bentuk Respons Harus Sinkron</h3><p>Status code adalah angka di baris pertama respons; bentuk body adalah isi JSON-nya. Keduanya harus bercerita hal yang sama.</p><table><thead><tr><th>Situasi</th><th>Status code</th><th>Bentuk body</th></tr></thead><tbody><tr><td>Baca data berhasil</td><td><code>200</code></td><td><code>data</code> berisi isi yang diminta</td></tr><tr><td>Buat data baru</td><td><code>201</code></td><td><code>data</code> berisi data yang baru dibuat</td></tr><tr><td>Hapus berhasil</td><td><code>204</code></td><td>Tanpa body (tidak ada yang perlu dikirim)</td></tr><tr><td>Data tidak ada</td><td><code>404</code></td><td><code>error</code> dengan kode &amp; pesan</td></tr><tr><td>Isi tidak valid</td><td><code>422</code></td><td><code>error</code> VALIDASI_GAGAL</td></tr><tr><td>Server kegagalan</td><td><code>500</code></td><td><code>error</code> umum, tanpa detail internal</td></tr></tbody></table><p>Jangan menulis <code>200 OK</code> untuk semua keadaan. Program pemanggil mempercayai angka status lebih dulu sebelum membaca isi.'
    },
    {
      type: 'live',
      title: 'Latihan: perbaiki response yang berantakan',
      lang: 'html',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Rapikan Response</title>
<style>
  body { font-family: system-ui, sans-serif; font-size: 14px; margin: 12px; color: #1f2937; }
  h2 { margin: 0 0 4px; font-size: 17px; color: #2563eb; }
  .ket { color: #6b7280; font-size: 13px; margin-bottom: 12px; }
  .kasus { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
  .kasus button { border: 1px solid #cbd5e1; background: #fff; border-radius: 8px; padding: 8px 12px; font-size: 13px; cursor: pointer; }
  .kasus button.aktif { border-color: #2563eb; background: #eff6ff; font-weight: 700; }
  .judul { font-weight: 700; margin-bottom: 6px; }
  pre { background: #0f172a; color: #e2e8f0; padding: 10px; border-radius: 8px; white-space: pre-wrap; margin: 0 0 10px; font-size: 12.5px; }
  .label { font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase; margin: 10px 0 4px; }
  .label.rapi { color: #16a34a; }
  button.rapi-btn { border: 0; border-radius: 8px; padding: 9px 14px; background: #16a34a; color: #fff; font-weight: 700; cursor: pointer; margin-bottom: 10px; }
  .alasan { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 12px; font-size: 13px; line-height: 1.6; display: none; }
  .alasan.tampil { display: block; }
  .alasan b { color: #14532d; }
</style>
</head>
<body>
<h2>Rapikan Response yang Berantakan</h2>
<div class="ket">Pilih satu kasus, baca respons kacau di bawah, lalu tekan tombol hijau untuk melihat versi rapi beserta alasannya.</div>

<div class="kasus" id="kasus"></div>

<div class="judul" id="judul"></div>
<div class="label"> respons kacau </div>
<pre id="kacau"></pre>
<button class="rapi-btn" id="tombol">⚡ Rapikan!</button>
<div class="label rapi" id="lblRapi" style="display:none"> respons rapi </div>
<pre id="rapi" style="display:none"></pre>
<div class="alasan" id="alasan"></div>

<script>
  var kasus = [
    {
      nama: 'Kasus 1: campur aduk',
      judul: 'GET /api/v1/products/12 → respons sukses yang bentuknya berantakan',
      kacau: '{\\n  "status": "ok",\\n  "produk": { "id": 12, "nama": "Sepatu Lari", "harga": 450000 },\\n  "pesan_sukses": "mantap, ketemu",\\n  "stok": 7\\n}',
      rapi: '{\\n  "success": true,\\n  "message": "Produk berhasil dimuat.",\\n  "data": {\\n    "id": 12,\\n    "name": "Sepatu Lari",\\n    "price": 450000,\\n    "stock": 7\\n  }\\n}',
      alasan: ['Field <code>stok</code> tercecer di luar objek produk — pindahkan ke dalam <code>data</code>.',
               'Nama field dicampur gaya (<code>produk</code>, <code>pesan_sukses</code>) — seragamkan: <code>success</code>, <code>message</code>, <code>data</code>.',
               'Isi <code>data</code> memakai bahasa Inggris seragam (<code>name</code>, <code>price</code>) agar program pemanggil tidak bingung bahasa.']
    },
    {
      nama: 'Kasus 2: error bocor',
      judul: 'GET /api/v1/products/99 → respons gagal yang membocorkan isi dapur',
      kacau: '{\\n  "status": 200,\\n  "pesan": "ERROR: SQLSTATE[HY000] [2002] Connection refused\\\\n  at /var/www/app/models/DB.php:42\\\\n  query: SELECT * FROM products WHERE id = 99\\\\n  db_user: root, db_pass: rahasia123",\\n  "data": null\\n}',
      rapi: '{\\n  "success": false,\\n  "error": {\\n    "code": "PRODUK_TIDAK_DITEMUKAN",\\n    "message": "Produk dengan id 99 tidak ditemukan."\\n  }\\n}',
      alasan: ['Angka status dikirim <code>200</code> padahal gagal — kirim <b>404 Not Found</b> lewat status code HTTP, bukan di body.',
               'Isi query database, nama berkas, dan password <b>tidak boleh</b> sampai ke pengguna — catat di log server.',
               'Pesan diganti kalimat ramah, dan ditambah <code>code</code> tetap untuk program.']
    },
    {
      nama: 'Kasus 3: daftar tanpa keterangan',
      judul: 'GET /api/v1/products?page=2 → daftar tanpa meta',
      kacau: '{\\n  "hasil": [\\n    { "id": 31, "nama": "Tas Ransel", "harga": 250000 },\\n    { "id": 32, "nama": "Topi Baseball", "harga": 75000 }\\n  ]\\n}',
      rapi: '{\\n  "success": true,\\n  "data": [\\n    { "id": 31, "name": "Tas Ransel", "price": 250000 },\\n    { "id": 32, "name": "Topi Baseball", "price": 75000 }\\n  ],\\n  "meta": {\\n    "page": 2,\\n    "limit": 10,\\n    "total": 57,\\n    "totalPages": 6\\n  }\\n}',
      alasan: ['Field <code>hasil</code> diganti <code>data</code> agar seragam dengan endpoint lain.',
               'Tambahkan <code>meta</code>: page, limit, total, totalPages — supaya aplikasi tahu masih ada halaman berikutnya.',
               'Tanpa <code>meta</code>, tombol "Halaman Berikutnya" harus menebak dan sering salah.']
    }
  ];
  var aktif = 0;
  var $ = function (x) { return document.getElementById(x); };

  function tombolkasus() {
    var w = $('kasus');
    w.innerHTML = '';
    kasus.forEach(function (k, i) {
      var b = document.createElement('button');
      b.textContent = k.nama;
      b.onclick = function () { pilih(i); };
      w.appendChild(b);
    });
  }

  function pilih(i) {
    aktif = i;
    var bs = $('kasus').getElementsByTagName('button');
    for (var j = 0; j < bs.length; j++) bs[j].className = (j === i) ? 'aktif' : '';
    $('judul').textContent = kasus[i].judul;
    $('kacau').textContent = kasus[i].kacau;
    $('tombol').style.display = 'inline-block';
    $('tombol').textContent = '⚡ Rapikan!';
    $('lblRapi').style.display = 'none';
    $('rapi').style.display = 'none';
    $('alasan').className = 'alasan';
  }

  $('tombol').onclick = function () {
    var k = kasus[aktif];
    $('rapi').textContent = k.rapi;
    $('lblRapi').style.display = 'block';
    $('rapi').style.display = 'block';
    var html = '<b>Kenapa versi ini lebih baik?</b><ul>' +
      k.alasan.map(function (a) { return '<li>' + a + '</li>'; }).join('') +
      '</ul>';
    $('alasan').innerHTML = html;
    $('alasan').className = 'alasan tampil';
    this.style.display = 'none';
  };

  tombolkasus();
  pilih(0);
</script>
</body>
</html>`,
      hint: 'Buka tiap kasus, baca respons kacau, lalu tekan "Rapikan!" dan bandingkan. Perhatikan status code, penamaan field, dan apa yang tidak boleh bocor ke pengguna.'
    },
    {
      type: 'tip',
      title: 'Tulis bentuk respons SEBELUM menulis kode',
      text: 'Saat merancang API, tulis dulu contoh respons sukses dan gagal tiap endpoint di kertas atau dokumen. Kebiasaan ini menangkap ketidakseragaman sejak awal — jauh lebih murah daripada memperbaiki setelah aplikasi pemanggil terlanjur dibuat.'
    },
    {
      type: 'warn',
      title: 'Jangan pernah menampilkan galat mentah ke pengguna',
      text: 'Jejak galat (stack trace), nama berkas &amp; baris kode server, isi perintah database, alamat IP, sampai kunci rahasia — semuanya wajib disembunyikan dari respons. Selain menakutkan pengguna, detail itu membantu penyusup mengincar kelemahan servermu. Kirim pesan umum yang ramah, catat detailnya di log internal.'
    },
    {
      type: 'vocab',
      items: [
        ['Respons (response)', 'Jawaban server berisi status code, header, dan body (biasanya JSON).'],
        ['Field', 'Satu pasangan "nama: nilai" di dalam JSON, contoh: "price": 450000.'],
        ['Bentuk respons', 'Susunan field yang dipakai API — sebaiknya seragam untuk semua endpoint.'],
        ['Kode error', 'Kode tetap seperti VALIDASI_GAGAL agar program bisa mengambil keputusan tanpa membaca kalimat.'],
        ['Field meta', 'Keterangan tambahan seperti page, limit, total untuk respons berupa daftar.'],
        ['Stack trace (jejak galat)', 'Daftar langkah program saat galat — untuk log developer, bukan untuk pengguna.'],
        ['Sinkron', 'Status code dan isi body bercerita hal yang sama.']
      ]
    }
  ],
  recap: [
    'Bentuk respons seragam: sukses memakai <code>data</code>, gagal memakai <code>error</code>.',
    'Konsistensi membuat kode pemanggil ditulis sekali dan berlaku untuk semua endpoint.',
    'Pesan error harus <b>aman &amp; jelas</b>: tanpa detail internal, tapi tetap mudah dipahami.',
    'Daftar data dibantu <code>meta</code> (page, limit, total, totalPages) agar pemanggil tahu posisi halaman.',
    'Status code dan bentuk body harus sinkron — jangan memakai 200 untuk semua keadaan.'
  ]
});
