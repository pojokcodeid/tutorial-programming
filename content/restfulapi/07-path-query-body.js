/* ============================================================
   Pelajaran Dasar RESTful API — Bab 7: Path, Query, dan Body
   ============================================================ */
'use strict';

window.RESTFULAPI_LESSONS = window.RESTFULAPI_LESSONS || [];

window.RESTFULAPI_LESSONS.push({
  id: 'path-query-body',
  title: 'Path, Query, dan Body: Di Mana Data Diletakkan?',
  chapter: 'HTTP Dasar',
  duration: '10 menit',
  intro: [
    'Saat kamu mencari "sepatu" di Tokopedia dan membuka produk nomor 42, sebenarnya kamu mengirim tiga jenis data sekaligus: <b>siapa</b> yang diminta, <b>cara</b> membacanya, dan <b>isi</b> data yang dikirim.',
    'Ketiganya punya tempat masing-masing: path, query, dan body. Pelajaran ini membedah ketiga tempat itu dengan analogi surat, lengkap dengan aturan sederhana agar kamu tidak lagi bingung menaruh data.'
  ],
  objectives: [
    'Menjelaskan peran path, query, dan body dalam satu request',
    'Menunjuk resource yang tepat lewat path parameter',
    'Memakai query parameter untuk filter, pencarian, dan halaman',
    'Meletakkan data pengiriman (dan rahasia) di tempat yang benar'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Tiga tempat data dalam satu request</h3><p>Bayangkan kamu mengirim surat. Tiap bagian punya tugas:</p><table><thead><tr><th>Di surat</th><th>Di request HTTP</th><th>Tugasnya</th></tr></thead><tbody><tr><td>Nama &amp; alamat orang dituju</td><td><b>Path</b></td><td>Menunjuk <b>siapa</b> resource yang diminta</td></tr><tr><td>Instruksi tambahan di amplop</td><td><b>Query</b></td><td>Mengatur <b>cara membaca</b> data</td></tr><tr><td>Isi surat</td><td><b>Body</b></td><td>Membawa <b>isi data</b> untuk membuat/mengubah</td></tr></tbody></table><p>Contoh nyata URL:</p><p><code>https://toko-contoh.com/api/v1/products/42?page=2&amp;status=aktif</code></p><p>Bagian <code>/products/42</code> adalah path. Bagian <code>?page=2&amp;status=aktif</code> adalah query. Body tidak terlihat di URL karena dikirim terpisah di bawahnya.</p>'
    },
    {
      type: 'text',
      html: '<h3>Path parameter: menunjuk SIAPA</h3><p>Path adalah bagian alamat setelah domain. Di situlah kamu menyebut resource (satu objek data) yang diminta. Angka atau kode di ujung path disebut <b>path parameter</b>.</p><ul><li><code>/products</code> → koleksi semua produk.</li><li><code>/products/42</code> → hanya produk nomor 42.</li><li><code>/users/7/orders</code> → daftar pesanan milik pengguna nomor 7.</li></ul><p>Analoginya kursi bioskop: <b>nomor kursimu menentukan siapa yang dilayani</b>. Method menentukan aksi, path menentukan korban aksinya — kombinasi inilah yang disebut endpoint.</p>'
    },
    {
      type: 'text',
      html: '<h3>Query parameter: mengatur CARA membaca</h3><p>Query muncul setelah tanda tanya <code>?</code>. Bentuknya pasangan <code>kunci=nilai</code>, dipisah tanda <code>&amp;</code>.</p><p><code>/products?q=sepatu&amp;page=2&amp;sort=harga</code></p><p>Query tidak memilih resource mana — ia mengatur <b>bagaimana data dibacakan</b>:</p><ul><li><code>q=sepatu</code> → cari yang namanya mengandung "sepatu".</li><li><code>page=2</code> → ambil halaman kedua.</li><li><code>status=aktif</code> → saring (filter) hanya yang aktif.</li><li><code>sort=harga</code> → atur urutan berdasarkan harga.</li></ul><p>Analoginya instruksi tambahan pada amplop: "kirim yang aktif saja, mulai dari halaman 2". Query biasanya dipakai saat membaca data (GET), karena tidak mengubah apa pun.</p>'
    },
    {
      type: 'text',
      html: '<h3>Body: ISI data untuk membuat atau mengubah</h3><p>Body adalah isi suratnya. Tempat inilah kamu menaruh data yang lengkap — misalnya data pendaftaran akun baru atau perubahan harga produk.</p><ul><li><b>POST</b> → body berisi data baru yang mau dibuat.</li><li><b>PUT/PATCH</b> → body berisi data hasil perubahan.</li><li><b>GET</b> → jarang punya body; cukup path dan query.</li></ul><p>Isi body biasanya berupa JSON seperti yang sudah kamu pelajari di pelajaran sebelumnya. Karena tidak muncul di URL, body lebih aman untuk data sensitif — asalkan koneksi memakai HTTPS.</p>'
    },
    {
      type: 'example',
      title: 'Tabel ringkas: jenis data mana di mana?',
      lang: 'text',
      output: false,
      code: `+--------------------------+--------+---------------------------------+
| Data                     | Tempat | Contoh penulisannya             |
+--------------------------+--------+---------------------------------+
| ID produk                | path   | /products/42                    |
| Kata kunci pencarian     | query  | ?q=sepatu                       |
| Halaman daftar           | query  | ?page=2                         |
| Saringan status          | query  | ?status=aktif                   |
| Data pendaftaran akun    | body   | {"nama":"Sari","email":"..."}   |
| Kata sandi login         | body   | {"password":"..."} via HTTPS    |
+--------------------------+--------+---------------------------------+`,
      explain: [
        'Aturan jempolnya: <b>identitas → path</b>, <b>cara membaca → query</b>, <b>isi data → body</b>.',
        'Kalau kamu ragu, tanya: "data ini untuk MENUNJUK atau untuk MENGISI?" Menunjuk berarti path, mengisi berarti body.',
        'Data rahasia seperti kata sandi tidak pernah masuk kolom query.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh request POST dengan body JSON',
      lang: 'bash',
      output: false,
      code: `curl -X POST https://toko-contoh.com/api/v1/users
  -H "Content-Type: application/json"
  -d '{"nama":"Sari","email":"sari@contoh.com"}'`,
      explain: [
        '<code>POST</code> menentukan aksi: membuat data baru. <code>/api/v1/users</code> menunjuk koleksi pengguna.',
        'Data yang dikirim ada di body (bagian <code>-d</code>), bukan di URL — inilah tempat isi surat.',
        'Baris di atas ditulis bertahap agar mudah dibaca; perintah curl aslinya biasanya satu baris utuh.'
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: penyusun tempat parameter',
      lang: 'html',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Penyusun Tempat Parameter</title>
<style>
  body { font-family: system-ui, sans-serif; font-size: 14px; margin: 12px; color: #0f172a; }
  h3 { margin: 0 0 8px; }
  .daftar { display: grid; gap: 6px; margin-bottom: 10px; }
  label.item { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; display: flex; gap: 8px; align-items: center; background: #f8fafc; cursor: pointer; }
  button { padding: 8px 14px; border: 0; border-radius: 6px; background: #2563eb; color: #fff; font-weight: 700; cursor: pointer; }
  pre { background: #0f172a; color: #e2e8f0; padding: 10px; border-radius: 8px; white-space: pre-wrap; }
  .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; color: #fff; font-size: 12px; font-weight: 700; }
  .path { background: #7c3aed; }
  .query { background: #0891b2; }
  .body { background: #ea580c; }
</style>
</head>
<body>
<h3>Penyusun Tempat Parameter</h3>
<p>Pilih data yang mau kamu kirim, lalu tekan tombol:</p>
<div class="daftar" id="daftar"></div>
<button id="susun">Susun contoh request</button>
<pre id="out">Belum ada pilihan.</pre>
<script>
  var dataTersedia = [
    { nama: 'ID produk (42)', tempat: 'path', alasan: 'Ini penunjuk SIAPA yang diambil, jadi ditaruh di alamat.', contoh: '/products/42' },
    { nama: 'Kata kunci "sepatu"', tempat: 'query', alasan: 'Ini cara membaca (mencari), bukan isi data.', contoh: 'q=sepatu' },
    { nama: 'Halaman ke-2', tempat: 'query', alasan: 'Ini pengatur cara membaca daftar.', contoh: 'page=2' },
    { nama: 'Saringan: status aktif', tempat: 'query', alasan: 'Ini filter untuk cara membaca.', contoh: 'status=aktif' },
    { nama: 'Nama & email pendaftaran', tempat: 'body', alasan: 'Ini ISI data baru — tempatnya di badan request.', contoh: '"nama":"Sari","email":"sari@contoh.com"' },
    { nama: 'Kata sandi', tempat: 'body', alasan: 'Data rahasia wajib di body (lewat HTTPS), bukan di URL.', contoh: '"password":"rahasia123"' }
  ];
  var daftar = document.getElementById('daftar');
  dataTersedia.forEach(function (d, i) {
    var lab = document.createElement('label');
    lab.className = 'item';
    lab.innerHTML = '<input type="checkbox" value="' + i + '"> ' + d.nama +
      ' <span class="pill ' + d.tempat + '">' + d.tempat + '</span>';
    daftar.appendChild(lab);
  });
  document.getElementById('susun').onclick = function () {
    var checks = daftar.querySelectorAll('input:checked');
    var out = document.getElementById('out');
    if (!checks.length) {
      out.textContent = 'Pilih dulu minimal satu data.';
      return;
    }
    var path = '/products';
    var query = [];
    var body = [];
    var alasan = [];
    checks.forEach(function (c) {
      var d = dataTersedia[Number(c.value)];
      alasan.push('- ' + d.nama + ' → ' + d.tempat.toUpperCase() + ': ' + d.alasan);
      if (d.tempat === 'path') { path = d.contoh; }
      if (d.tempat === 'query') { query.push(d.contoh); }
      if (d.tempat === 'body') { body.push(d.contoh); }
    });
    var method = body.length ? 'POST' : 'GET';
    var teks = method + ' ' + path;
    if (query.length) { teks += '?' + query.join('&'); }
    if (body.length) { teks += '\\nBody (JSON): {' + body.join(',') + '}'; }
    teks += '\\n\\nAlasan penempatan:\\n' + alasan.join('\\n');
    out.textContent = teks;
  };
</script>
</body>
</html>`,
      hint: 'Centang "ID produk" saja, lalu centang "Kata kunci pencarian". Perhatikan method berubah jadi POST begitu ada data isi (body) yang dicentang.'
    },
    {
      type: 'tip',
      title: 'Aturan jempol saat bingung',
      text: 'Tiga pertanyaan cepat: <b>(1)</b> "Ini menunjuk siapa?" → path. <b>(2)</b> "Ini mengatur cara membaca?" → query. <b>(3)</b> "Ini isi data baru/ubah?" → body. Kebanyakan kesalahan pemula selesai dengan tiga pertanyaan ini.'
    },
    {
      type: 'warn',
      title: 'Kata sandi tidak boleh di query',
      text: 'URL query tercatat di riwayat browser, log server, dan perangkat jaringan. Kalau kamu menulis <code>?password=rahasia</code>, kata sandimu "tertulis di luar amplop". Data rahasia selalu masuk <b>body</b> lewat koneksi HTTPS.'
    },
    {
      type: 'vocab',
      items: [
        ['Path parameter', 'Bagian URL yang menunjuk resource tertentu, mis. /products/42.'],
        ['Query parameter', 'Pasangan kunci=nilai setelah tanda ? untuk mengatur cara membaca data.'],
        ['Body', 'Isi request berupa data (biasanya JSON) untuk membuat atau mengubah data.'],
        ['Resource', 'Satu objek data yang diurus API, misalnya satu produk atau satu pengguna.'],
        ['Filter', 'Penyaring data lewat query, mis. hanya menampilkan yang berstatus aktif.'],
        ['Parameter', 'Sebutan umum untuk data apa pun yang kamu kirim ke API.']
      ]
    }
  ],
  recap: [
    '<b>Path</b> menunjuk SIAPA resource, <b>query</b> mengatur CARA membaca, <b>body</b> membawa ISI data.',
    'Path parameter menempel di URL, misalnya <code>/products/42</code> untuk produk nomor 42.',
    'Query muncul setelah <code>?</code>, dipisah <code>&amp;</code> — dipakai untuk cari, filter, halaman, dan urutan.',
    'Body dipakai saat POST/PUT/PATCH, isinya biasanya JSON.',
    'Data rahasia seperti kata sandi tidak boleh di query; taruh di body lewat HTTPS.'
  ]
});
