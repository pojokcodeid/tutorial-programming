/* ============================================================
   Pelajaran Dasar RESTful API — Bab 2: Client, Server, dan Anatomi Request–Response
   ============================================================ */
'use strict';

window.RESTFULAPI_LESSONS = window.RESTFULAPI_LESSONS || [];

window.RESTFULAPI_LESSONS.push({
  id: 'client-server-request-response',
  title: 'Client, Server, dan Anatomi Request–Response',
  chapter: 'Fondasi API',
  duration: '10 menit',
  intro: [
    'Bayangkan kamu mengirim pesan lewat kurir. Kamu menulis surat, kurir mengantar, lalu penerima membalas. Di internet juga ada dua pihak: yang <b>meminta</b> dan yang <b>melayani</b>.',
    'Pelajaran ini membedah isi "surat" internet: bagian-bagian <b>request</b> (permintaan), bagian-bagian <b>response</b> (jawaban), dan cara melihatnya langsung di browser.'
  ],
  objectives: [
    'Membedakan peran klien (yang minta) dan server (yang melayani)',
    'Menyebutkan 4 bagian utama sebuah request',
    'Menyebutkan 3 bagian utama sebuah response',
    'Mengamati request sungguhan lewat DevTools tab Network'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Klien dan Server</h3><p>Ketika kamu buka Tokopedia di browser, dua pihak ini bekerja sama:</p><table><thead><tr><th>Pihak</th><th>Peran</th><th>Contoh</th></tr></thead><tbody><tr><td><b>Klien (client)</b></td><td>Pihak yang <b>meminta</b> data</td><td>Browser, aplikasi di HP-mu</td></tr><tr><td><b>Server</b></td><td>Pihak yang <b>melayani</b>: menyimpan data lalu menjawab</td><td>Komputer milik Tokopedia</td></tr></tbody></table><p>Klien selalu memulai. Server baru menjawab setelah diminta.</p><p>Ingat analogi restoran: kamu (klien) memesan, dapur (server) mengantar makanan ke mejamu.</p>'
    },
    {
      type: 'text',
      html: '<h3>Isi Request: 4 Bagian</h3><p>Setiap permintaan yang dikirim klien selalu punya 4 bagian:</p><table><thead><tr><th>Bagian</th><th>Fungsi</th><th>Contoh</th></tr></thead><tbody><tr><td><b>Method</b></td><td>Aksi yang diminta</td><td><code>GET</code></td></tr><tr><td><b>URL</b></td><td>Alamat yang diminta</td><td><code>/products/42</code></td></tr><tr><td><b>Header</b></td><td>Keterangan tambahan</td><td><code>Content-Type: application/json</code></td></tr><tr><td><b>Body</b> (opsional)</td><td>Data yang ikut dikirim</td><td><code>{"name":"Sepatu"}</code></td></tr></tbody></table><p>GET biasanya tidak punya body. POST dan PUT hampir selalu punya body berisi data baru.</p>'
    },
    {
      type: 'text',
      html: '<h3>Isi Response: 3 Bagian</h3><p>Jawaban dari server juga punya bagian yang selalu sama:</p><table><thead><tr><th>Bagian</th><th>Fungsi</th><th>Contoh</th></tr></thead><tbody><tr><td><b>Status code</b></td><td>Hasil permintaan, dalam angka</td><td><code>200 OK</code></td></tr><tr><td><b>Header</b></td><td>Keterangan tambahan</td><td><code>Content-Type: application/json</code></td></tr><tr><td><b>Body</b></td><td>Isi jawaban: data atau pesan error</td><td><code>{"id":42,...}</code></td></tr></tbody></table><p>Status code dibahas tuntas di pelajaran tersendiri. Intinya: <b>angka pertama memberi tahu hasil</b>. Angka 2 berarti sukses, 4 berarti salahmu, 5 berarti servernya bermasalah.</p>'
    },
    {
      type: 'example',
      title: 'Bedah satu percakapan: request → response',
      lang: 'text',
      output: false,
      code: `REQUEST (dikirim browser):
GET /products/42 HTTP/1.1      ← method + URL
Host: toko.com                 ← header
Accept: application/json       ← header

RESPONSE (dibalas server):
HTTP/1.1 200 OK                ← status code
Content-Type: application/json ← header

{"id":42,"name":"Sepatu Lari","price":399000}  ← body`,
      explain: [
        'Baris pertama request berisi <b>method</b> dan <b>URL</b> yang diminta.',
        'Baris <code>Host</code> dan <code>Accept</code> adalah contoh <b>header</b> — keterangan tambahan di luar isi pesan.',
        'Response diawali <b>status code</b> <code>200 OK</code>, lalu header, lalu body berisi data JSON.',
        'Inilah bentuk asli yang dikirim dan diterima — kamu bisa melihatnya di DevTools (langkahnya di bawah).'
      ]
    },
    {
      type: 'example',
      title: 'Bedah request login (POST)',
      lang: 'text',
      output: false,
      code: `REQUEST:
POST /login HTTP/1.1                ← method + URL
Host: toko.com                      ← header
Content-Type: application/json      ← header

{"email":"budi@mail.com","password":"********"}  ← body

RESPONSE:
HTTP/1.1 200 OK
Content-Type: application/json

{"token":"abc123","name":"Budi"}    ← body`,
      explain: [
        'Bedanya dengan contoh pertama: di sini methodnya <code>POST</code> dan ada <b>body</b> berisi data login.',
        'Header <code>Content-Type</code> memberi tahu server: "isi body-ku format JSON".',
        'Pesan rahasia seperti kata sandi dikirim lewat <b>body</b>, bukan lewat URL.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Analogi Surat</h3><p>Agar gampang diingat, petakan tiap bagian ke surat:</p><table><thead><tr><th>Di internet</th><th>Di surat</th></tr></thead><tbody><tr><td><b>Method</b></td><td>Jenis surat (surat biasa, undangan, pengembalian)</td></tr><tr><td><b>URL</b></td><td>Alamat tujuan</td></tr><tr><td><b>Header</b></td><td>Keterangan pada amplop</td></tr><tr><td><b>Body</b></td><td>Isi surat</td></tr><tr><td><b>Status code</b></td><td>Tanda terima / cap pos</td></tr></tbody></table><p>Kalau alamat salah (URL keliru), surat tidak sampai. Di internet hasilnya <code>404 Not Found</code>.</p>'
    },
    {
      type: 'text',
      html: '<h3>Kenapa Terjadi Ribuan Kali Sehari?</h3><p>Saat kamu buka satu situs berita, browser tidak mengirim satu request. Ia mengirim banyak request terpisah: halaman utama, logo, gambar, font, iklan.</p><p>Setiap berita yang muncul, setiap tombol suka yang kamu tekan, setiap chat baru di WhatsApp Web — semuanya adalah request–response baru.</p><p>Karena itu pemahaman ini penting: <b>ratusan ribu percakapan kecil terjadi setiap detik</b>, dan semuanya memakai format yang sama.</p>'
    },
    {
      type: 'live',
      title: 'Coba sendiri: simulasi request–response interaktif',
      lang: 'html',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: system-ui, sans-serif; font-size: 14px; margin: 12px; color: #0f172a; }
  .cases { display: flex; gap: 8px; flex-wrap: wrap; margin: 10px 0 14px; }
  button { padding: 8px 14px; border: 0; border-radius: 6px; background: #2563eb; color: #fff; font-weight: 700; cursor: pointer; }
  button:hover { background: #1d4ed8; }
  .box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; margin-bottom: 10px; background: #f8fafc; display: none; }
  .box h4 { margin: 0 0 8px; font-size: 14px; }
  #reqBox { border-top: 3px solid #2563eb; }
  #resBox { border-top: 3px solid #16a34a; }
  .lbl { font-size: 12px; color: #64748b; margin: 8px 0 2px; }
  pre { background: #0f172a; color: #e2e8f0; padding: 8px 10px; border-radius: 6px; margin: 0; white-space: pre-wrap; font-size: 13px; }
</style>
</head>
<body>
<p>Tekan satu situasi, lalu perhatikan "surat" yang dikirim dan jawaban yang kembali:</p>
<div class="cases">
  <button data-i="0">Lihat produk id 2</button>
  <button data-i="1">Tambah produk baru</button>
  <button data-i="2">Lihat produk id 99</button>
</div>
<div id="reqBox" class="box">
  <h4>Request dikirim klien</h4>
  <div class="lbl">Method + URL</div><pre id="reqLine"></pre>
  <div class="lbl">Header</div><pre id="reqHeader"></pre>
  <div class="lbl">Body (data yang dibawa)</div><pre id="reqBody"></pre>
</div>
<div id="resBox" class="box">
  <h4>Response diterima klien</h4>
  <div class="lbl">Status code</div><pre id="resStatus"></pre>
  <div class="lbl">Body (isi jawaban)</div><pre id="resBody"></pre>
</div>
<script>
  var cases = [
    {
      line: 'GET /products/2',
      header: 'Accept: application/json',
      body: '(GET biasanya tidak membawa body)',
      status: '200 OK',
      resBody: { id: 2, name: 'Tas Ransel', price: 250000 }
    },
    {
      line: 'POST /products',
      header: 'Content-Type: application/json',
      body: '{ "name": "Topi Baseball", "price": 75000 }',
      status: '201 Created',
      resBody: { id: 4, name: 'Topi Baseball', price: 75000 }
    },
    {
      line: 'GET /products/99',
      header: 'Accept: application/json',
      body: '(GET biasanya tidak membawa body)',
      status: '404 Not Found',
      resBody: { error: 'produk id 99 tidak ditemukan' }
    }
  ];
  var buttons = document.querySelectorAll('button[data-i]');
  for (var b = 0; b < buttons.length; b++) {
    buttons[b].onclick = function () {
      var i = Number(this.getAttribute('data-i'));
      var c = cases[i];
      document.getElementById('reqLine').textContent = c.line;
      document.getElementById('reqHeader').textContent = c.header;
      document.getElementById('reqBody').textContent = c.body;
      document.getElementById('reqBox').style.display = 'block';
      document.getElementById('resBox').style.display = 'none';
      window.setTimeout(function () {
        document.getElementById('resStatus').textContent = c.status;
        document.getElementById('resBody').textContent = JSON.stringify(c.resBody, null, 2);
        document.getElementById('resBox').style.display = 'block';
      }, 600);
    };
  }
</script>
</body>
</html>`,
      hint: 'Tekan ketiga tombol satu per satu. Bandingkan isi request dan status code response-nya.'
    },
    {
      type: 'tip',
      title: 'Latihan: amati request pertama di DevTools',
      text: '<ol><li>Buka situs apa pun, misalnya tokopedia.com.</li><li>Tekan <b>F12</b> (Mac: <b>Cmd + Option + I</b>) untuk membuka DevTools.</li><li>Pilih tab <b>Network</b>, lalu muat ulang halaman dengan <b>F5</b>.</li><li>Klik baris pertama. Lihat <b>Headers</b> untuk method, URL, dan status code. Lihat <b>Response</b> untuk isi jawabannya.</li></ol> Materi HTTP membahas header jauh lebih dalam — di sini cukup kenali dulu bentuknya.'
    },
    {
      type: 'vocab',
      items: [
        ['Klien (client)', 'Pihak yang mengirim permintaan, misalnya browser atau aplikasi di HP.'],
        ['Server', 'Pihak yang melayani permintaan: menyimpan data lalu menjawab.'],
        ['Request', 'Permintaan dari klien; terdiri dari method, URL, header, dan body.'],
        ['Response', 'Jawaban dari server; terdiri dari status code, header, dan body.'],
        ['Method', 'Kode yang menunjukkan aksi yang diminta, misalnya GET atau POST.'],
        ['Header', 'Informasi tambahan di luar isi pesan, ibarat keterangan pada amplop.'],
        ['Body', 'Isi pesan, biasanya berupa data JSON.']
      ]
    }
  ],
  recap: [
    'Komunikasi web selalu melibatkan <b>klien yang meminta</b> dan <b>server yang melayani</b>.',
    'Request punya 4 bagian: <b>method, URL, header, body</b>.',
    'Response punya 3 bagian: <b>status code, header, body</b>.',
    'Analogi surat: method = jenis surat, URL = alamat, header = amplop, body = isi, status code = tanda terima.',
    'Kamu bisa melihat semuanya langsung: <b>DevTools → tab Network</b>.'
  ]
});
