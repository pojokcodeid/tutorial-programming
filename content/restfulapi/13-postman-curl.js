/* ============================================================
   Pelajaran Dasar RESTful API — Bab 13: Mencoba API Sungguhan: Postman & cURL
   ============================================================ */
'use strict';

window.RESTFULAPI_LESSONS = window.RESTFULAPI_LESSONS || [];

window.RESTFULAPI_LESSONS.push({
  id: 'postman-curl',
  title: 'Mencoba API Sungguhan: Postman & cURL',
  chapter: 'Praktik API',
  duration: '10 menit',
  intro: [
    'Sebelum membeli sepeda, kamu pasti mencobanya dulu. Tidak membayar sebelum tahu sepedanya layak. Begitu juga dengan API: sebelum menulis program, kamu perlu memastikan API-nya benar-benar bisa dipanggil.',
    'Pelajaran ini mengenalkan alat pengujian API tanpa program: <b>Postman</b> dan <b>cURL</b>. Kamu akan belajar menyusun satu request lengkap, membaca hasilnya, lalu mencoba API publik gratis untuk latihan.'
  ],
  objectives: [
    'Mengenal tool pengujian API: Postman, Bruno, Thunder Client, dan cURL',
    'Menyusun satu request lengkap (URL, method, header, body) di Postman',
    'Membaca hasil response: status code, header response, dan body response',
    'Menangani kegagalan umum: koneksi putus, 404, dan 500'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Kenapa Perlu Alat Penguji?</h3><p>Postman dan cURL adalah alat untuk mencicipi API sebelum kamu memasaknya sendiri di program. Kamu kirim permintaan, lalu melihat balasan apa yang datang.</p><p>Ada beberapa pilihan alat. Semuanya punya tujuan yang sama:</p><table><thead><tr><th>Tool</th><th>Bentuk</th><th>Cocok untuk</th></tr></thead><tbody><tr><td><b>Postman</b></td><td>Aplikasi desktop/online</td><td>Paling populer; gratis untuk fitur dasar</td></tr><tr><td><b>Bruno</b></td><td>Aplikasi desktop</td><td>Ringan; koleksi disimpan sebagai file biasa di komputermu</td></tr><tr><td><b>Thunder Client</b></td><td>Ekstensi VS Code</td><td>Praktis; muncul langsung di editor kesayanganmu</td></tr><tr><td><b>cURL</b></td><td>Perintah di terminal</td><td>Bawaan hampir semua sistem operasi; tanpa instal aplikasi</td></tr></tbody></table><p>Kamu cukup pilih satu. Konsepnya sama semua: isi alamat, pilih method, tekan kirim, baca balasan.</p>'
    },
    {
      type: 'text',
      html: '<h3>Anatomi Satu Request di Postman</h3><p>Mengirim request di Postman terasa seperti mengirim paket:</p><table><thead><tr><th>Di formulir paket</th><th>Di Postman</th><th>Contoh</th></tr></thead><tbody><tr><td>Alamat tujuan</td><td><b>URL</b></td><td>https://jsonplaceholder.typicode.com/posts</td></tr><tr><td>Jenis layanan</td><td><b>Method</b></td><td>GET, POST, PUT, DELETE</td></tr><tr><td>Keterangan amplop</td><td><b>Header</b></td><td>Content-Type: application/json</td></tr><tr><td>Isi paket</td><td><b>Body</b></td><td>{"title":"Belajar REST"}</td></tr><tr><td>Serah ke kurir</td><td><b>Tombol Send</b></td><td>Klik sekali, request terkirim</td></tr></tbody></table><p>Urutan pengisiannya: pilih method, ketik URL, tambahkan header bila perlu, isi body untuk POST atau PUT, lalu tekan tombol kirim.</p><p>Untuk GET, body dibiarkan kosong. GET hanya membaca data, tidak mengirim isi apa pun.</p>'
    },
    {
      type: 'text',
      html: '<h3>Membaca Hasil: Status, Header, Body</h3><p>Server selalu membalas tiga hal:</p><table><thead><tr><th>Bagian</th><th>Isi</th><th>Contoh</th></tr></thead><tbody><tr><td><b>Status code</b></td><td>Angka hasil; cek dulu ini</td><td>200 OK, 201 Created, 404 Not Found</td></tr><tr><td><b>Header response</b></td><td>Keterangan tambahan balasan</td><td>content-type: application/json</td></tr><tr><td><b>Body response</b></td><td>Isi jawaban, biasanya JSON</td><td>{"id":1,"title":"..."}</td></tr></tbody></table><p>Selalu baca status code lebih dulu. Baru setelah itu buka body. Di Postman, ketiganya tampil di panel bawah setelah kamu menekan tombol kirim.</p><h3>Bagaimana Kalau Gagal?</h3><table><thead><tr><th>Kejadian</th><th>Artinya</th><th>Yang harus dilakukan</th></tr></thead><tbody><tr><td>Koneksi putus (tidak ada balasan)</td><td>Komputer dan server tidak tersambung</td><td>Cek internet, cek ejaan URL, coba lagi</td></tr><tr><td>404 Not Found</td><td>Alamat salah atau data tidak ada</td><td>Periksa path dan angka id</td></tr><tr><td>500 Internal Server Error</td><td>Server mengalami masalah di dalam</td><td>Ulangi nanti; kalau API-mu sendiri, periksa log server</td></tr></tbody></table><blockquote style="border-left:3px solid var(--accent);padding-left:12px;margin:12px 0"><b>Aturan jempol:</b> kode 4xx berarti ada yang salah dari permintaanmu (klien). Kode 5xx berarti servernya yang bermasalah.</blockquote>'
    },
    {
      type: 'example',
      title: 'cURL: GET satu post dari JSONPlaceholder',
      lang: 'bash',
      output: false,
      code: `# Ambil satu post (hanya body)
curl https://jsonplaceholder.typicode.com/posts/1

# Tampilkan juga status code dan header response
curl -i https://jsonplaceholder.typicode.com/posts/1`,
      explain: [
        '<code>curl</code> adalah perintah satu baris di terminal — alternatif tanpa aplikasi grafis seperti Postman.',
        'Opsi <code>-i</code> membuat cURL menampilkan status code dan header response sebelum body, persis seperti tab "Headers" di Postman.',
        'JSONPlaceholder selalu membalas data palsu yang sama, jadi aman diulang-ulang saat latihan.'
      ]
    },
    {
      type: 'example',
      title: 'cURL: POST membuat data baru',
      lang: 'bash',
      output: false,
      code: `curl -X POST https://jsonplaceholder.typicode.com/posts \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Belajar REST","body":"Percobaan pertama","userId":7}'`,
      explain: [
        '<code>-X POST</code> memilih method; dengan <code>-d</code>, cURL otomatis menjadikan request-mu POST.',
        '<code>-H "Content-Type: application/json"</code> memberi tahu server isi body berupa JSON — ibarat keterangan pada amplop.',
        '<code>-d</code> berisi body request. Server membalas <b>201 Created</b> plus id baru (101) — tanda data berhasil dibuat.'
      ]
    },
    {
      type: 'text',
      html: '<h3>API Publik untuk Latihan</h3><p>Belajar nyetir dimulai di sirkuit tertutup. Belajar API juga butuh tempat latihan yang aman: data palsu, gratis, tanpa perlu daftar akun.</p><table><thead><tr><th>API</th><th>URL</th><th>Isi</th></tr></thead><tbody><tr><td><b>JSONPlaceholder</b></td><td>https://jsonplaceholder.typicode.com</td><td>Data postingan palsu; mendukung GET, POST, PUT, DELETE</td></tr><tr><td><b>PokéAPI</b></td><td>https://pokeapi.co</td><td>Data Pokémon; contoh: https://pokeapi.co/api/v2/pokemon/pikachu</td></tr><tr><td><b>ReqRes</b></td><td>https://reqres.in</td><td>Data pengguna tiruan; pas untuk latihan POST dan PUT</td></tr></tbody></table><h3>Langkah Latihan: 3 Request Pertama</h3><ol><li><b>GET daftar post</b> — method GET, URL https://jsonplaceholder.typicode.com/posts. Harus muncul 200 OK dan daftar 10 post.</li><li><b>GET satu post</b> — tambahkan /1 di ujung URL. Harus muncul 200 OK dan satu objek post.</li><li><b>POST buat data baru</b> — method POST, URL sama dengan langkah 1, isi body JSON {"title":"Belajar REST","userId":7}. Harus muncul 201 Created dan id baru 101.</li></ol><p>Ketiga langkah itu bisa kamu kerjakan di Postman maupun lewat cURL seperti contoh sebelumnya.</p>'
    },
    {
      type: 'live',
      title: 'Coba sendiri: simulasi Postman mini',
      lang: 'html',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: system-ui, sans-serif; font-size: 14px; margin: 12px; color: #0f172a; }
  .bar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 8px; }
  select, input, textarea { font: inherit; padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 6px; }
  #url { flex: 1; min-width: 200px; }
  textarea { width: 100%; box-sizing: border-box; min-height: 56px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  button { padding: 8px 14px; border: 0; border-radius: 6px; background: #2563eb; color: #fff; font-weight: 700; cursor: pointer; }
  button:hover { background: #1d4ed8; }
  .grid { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 12px; }
  .panel { flex: 1; min-width: 250px; }
  h4 { margin: 0 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: .05em; color: #64748b; }
  pre { background: #0f172a; color: #e2e8f0; padding: 10px; border-radius: 8px; white-space: pre-wrap; margin: 6px 0 0; }
  #status { font-weight: 700; }
  .ok { color: #16a34a; }
  .bad { color: #dc2626; }
  #hdr { color: #64748b; font-family: ui-monospace, monospace; }
  ol#history { margin: 0; padding-left: 20px; }
  #history li { cursor: pointer; padding: 2px 0; }
  #history li:hover { text-decoration: underline; }
  .note { font-size: 12px; color: #64748b; }
</style>
</head>
<body>
<p><b>Simulasi Postman mini.</b> Isi method dan URL, lalu body untuk POST/PUT. Tekan <b>Kirim</b>.</p>
<div class="bar">
  <select id="method">
    <option>GET</option>
    <option>POST</option>
    <option>PUT</option>
    <option>DELETE</option>
  </select>
  <input id="url" value="https://jsonplaceholder.typicode.com/posts">
</div>
<textarea id="body">{"title":"Belajar REST","userId":7}</textarea>
<div class="bar">
  <button id="send">Kirim</button>
  <span class="note">Coba juga .../posts/999 (404), .../latihan/error (500), atau .../latihan/koneksi-putus.</span>
</div>
<div class="grid">
  <div class="panel">
    <h4>Hasil</h4>
    <p>Status: <span id="status">—</span></p>
    <div id="hdr"></div>
    <pre id="res">Belum ada request. Tekan "Kirim".</pre>
  </div>
  <div class="panel">
    <h4>Riwayat (tab History)</h4>
    <ol id="history"></ol>
    <p class="note">Klik salah satu untuk memuat ulang request-nya.</p>
  </div>
</div>
<script>
  var posts = [
    { id: 1, title: 'Belajar REST bagian 1', body: 'Mengenal request dan response', userId: 7 },
    { id: 2, title: 'Status code itu penting', body: 'Kategori 2xx, 4xx, dan 5xx', userId: 7 },
    { id: 3, title: 'JSON bahasa data web', body: 'Objek dan array berpasangan kunci dan nilai', userId: 3 }
  ];
  var nextId = 101;
  var riwayat = [];

  function pendek(url) {
    var p = url.trim();
    var skema = p.indexOf('://');
    if (skema >= 0) p = p.slice(skema + 3);
    var garis = p.indexOf('/');
    p = garis >= 0 ? p.slice(garis) : '/';
    if (p.length > 1 && p.charAt(p.length - 1) === '/') p = p.slice(0, -1);
    var tanya = p.indexOf('?');
    if (tanya >= 0) p = p.slice(0, tanya);
    return p === '' ? '/' : p;
  }

  // Simulasi server: hasilkan balasan sesuai method + path
  function jalankan(method, url, bodyTeks) {
    var path = pendek(url);
    if (path.indexOf('koneksi-putus') >= 0) return { gagalKoneksi: true };
    if (path === '/latihan/error') {
      return { status: 500, statusText: 'Internal Server Error', body: { error: 'Server sedang bermasalah. Coba lagi nanti.' } };
    }
    var data = null;
    if (bodyTeks.trim() !== '') {
      try { data = JSON.parse(bodyTeks); }
      catch (e) { return { status: 400, statusText: 'Bad Request', body: { error: 'Body bukan JSON yang valid. Periksa tanda kutip dan koma.' } }; }
    }
    var bagian = path.split('/').filter(Boolean);
    if (bagian[0] === 'posts' && bagian.length === 1) {
      if (method === 'GET') return { status: 200, statusText: 'OK', body: posts };
      if (method === 'POST') {
        if (data === null) return { status: 400, statusText: 'Bad Request', body: { error: 'POST butuh body JSON.' } };
        var baru = Object.assign({ id: nextId }, data);
        nextId += 1;
        posts.push(baru);
        return { status: 201, statusText: 'Created', body: baru };
      }
      return { status: 405, statusText: 'Method Not Allowed', body: { error: method + ' tidak didukung di /posts.' } };
    }
    if (bagian[0] === 'posts' && bagian.length === 2) {
      var id = Number(bagian[1]);
      var idx = isNaN(id) ? -1 : posts.findIndex(function (p) { return p.id === id; });
      if (idx < 0) return { status: 404, statusText: 'Not Found', body: { error: 'Post dengan id ' + bagian[1] + ' tidak ditemukan.' } };
      if (method === 'GET') return { status: 200, statusText: 'OK', body: posts[idx] };
      if (method === 'PUT') {
        if (data === null) return { status: 400, statusText: 'Bad Request', body: { error: 'PUT butuh body JSON.' } };
        posts[idx] = Object.assign({ id: id }, data);
        return { status: 200, statusText: 'OK', body: posts[idx] };
      }
      if (method === 'DELETE') {
        posts.splice(idx, 1);
        return { status: 200, statusText: 'OK', body: { ok: true, deletedId: id } };
      }
      return { status: 405, statusText: 'Method Not Allowed', body: { error: method + ' tidak didukung di /posts/{id}.' } };
    }
    return { status: 404, statusText: 'Not Found', body: { error: 'Endpoint ' + path + ' tidak ditemukan.' } };
  }

  document.getElementById('send').addEventListener('click', function () {
    var method = document.getElementById('method').value;
    var url = document.getElementById('url').value;
    var bodyTeks = document.getElementById('body').value;
    var hasil = jalankan(method, url, bodyTeks);
    var statusEl = document.getElementById('status');
    var hdrEl = document.getElementById('hdr');
    var resEl = document.getElementById('res');

    if (hasil.gagalKoneksi) {
      statusEl.textContent = 'Koneksi gagal';
      statusEl.className = 'bad';
      hdrEl.textContent = '';
      resEl.textContent = 'Tidak ada balasan dari server.\\nPeriksa internet dan URL, lalu coba lagi. (simulasi: URL berisi "koneksi-putus")';
    } else {
      statusEl.textContent = hasil.status + ' ' + hasil.statusText;
      statusEl.className = hasil.status < 400 ? 'ok' : 'bad';
      hdrEl.textContent = hasil.status === 201
        ? 'content-type: application/json; charset=utf-8 · location: /posts/' + (nextId - 1)
        : 'content-type: application/json; charset=utf-8';
      resEl.textContent = JSON.stringify(hasil.body, null, 2);
    }

    riwayat.unshift({ method: method, url: url, body: bodyTeks, code: hasil.gagalKoneksi ? 'ERROR' : hasil.status });
    gambarRiwayat();
  });

  function gambarRiwayat() {
    var ol = document.getElementById('history');
    ol.innerHTML = '';
    riwayat.slice(0, 8).forEach(function (r) {
      var li = document.createElement('li');
      li.textContent = r.method + ' ' + pendek(r.url) + ' → ' + r.code;
      li.addEventListener('click', function () {
        document.getElementById('method').value = r.method;
        document.getElementById('url').value = r.url;
        document.getElementById('body').value = r.body;
      });
      ol.appendChild(li);
    });
  }
</script>
</body>
</html>`,
      hint: 'Isi method dan URL, lalu tekan Kirim. Coba GET /posts, GET /posts/999 untuk 404, dan POST untuk membuat data baru — perhatikan riwayat di kanan bertambah seperti tab History di Postman.'
    },
    {
      type: 'tip',
      title: 'Simpan request yang sering diulang',
      text: 'Postman menyimpan riwayat (History) otomatis dan koleksi (Collection) yang bisa kamu beri nama. Bruno dan Thunder Client juga punya fitur serupa. Dengan menyimpan request, kamu tidak perlu mengetik ulang URL dan body setiap kali.'
    },
    {
      type: 'warn',
      title: 'API latihan hanya untuk latihan',
      text: 'JSONPlaceholder, PokéAPI, dan ReqRes memakai data palsu. Perubahanmu biasanya tidak benar-benar tersimpan. Jangan pernah mengirim data pribadi atau rahasia — nama lengkap, alamat, kata sandi, token — ke API mana pun selama latihan.'
    },
    {
      type: 'vocab',
      items: [
        ['Postman', 'Aplikasi untuk menyusun dan menguji request API tanpa menulis program.'],
        ['cURL', 'Perintah di terminal untuk mengirim dan menerima HTTP; bawaan banyak sistem.'],
        ['Header request', 'Keterangan tambahan yang dikirim bersama request, misalnya Content-Type.'],
        ['Body request', 'Isi data yang dikirim, umumnya JSON, untuk POST atau PUT.'],
        ['Collection', 'Kumpulan request yang disimpan agar mudah diulang dan dibagikan.'],
        ['Riwayat (History)', 'Catatan otomatis request yang pernah kamu kirim.'],
        ['API publik untuk latihan', 'API gratis berisi data palsu untuk belajar, misalnya JSONPlaceholder.']
      ]
    }
  ],
  recap: [
    'Alat uji API: Postman (aplikasi grafis), Thunder Client (ekstensi VS Code), Bruno, dan cURL (terminal) — konsepnya sama.',
    'Satu request terdiri dari URL, method, header, body, lalu tombol kirim.',
    'Baca hasil berurutan: status code dulu, baru header dan body response.',
    'Koneksi putus = cek internet dan URL; 404 = periksa path/id; 500 = server bermasalah, ulangi nanti.',
    'Tempat latihan gratis: JSONPlaceholder, PokéAPI, dan ReqRes — datanya palsu dan aman diulang.'
  ]
});
