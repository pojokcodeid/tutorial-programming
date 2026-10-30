/* ============================================================
   Pelajaran Dasar RESTful API — Bab 5: Status Code
   ============================================================ */
'use strict';

window.RESTFULAPI_LESSONS = window.RESTFULAPI_LESSONS || [];

window.RESTFULAPI_LESSONS.push({
  id: 'status-code',
  title: 'Status Code: Kode Balasan Server',
  chapter: 'HTTP Dasar',
  duration: '10 menit',
  intro: [
    'Setelah beli obat di apotek, kamu menerima struk bertanda LUNAS, BATAL, atau MENUNGGU. Server juga selalu mengirim "struk" berisi angka hasil permintaanmu. Itulah <b>status code</b>.',
    'Pelajaran ini mengajakmu hafal kategori angka 2xx sampai 5xx, serta kode-kode yang paling sering muncul saat memakai API.'
  ],
  objectives: [
    'Membaca kategori status code dari angka pertamanya',
    'Menyebutkan kode sukses 200, 201, dan 204 beserta bedanya',
    'Membedakan 401 (belum login) dengan 403 (tidak berhak)',
    'Menebak status code yang tepat untuk skenario sederhana'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Angka Pertama Menentukan Kategori</h3><p>Sama seperti nomor antrean yang menunjukkan loket tujuanmu, <b>angka pertama</b> status code menentukan kategori hasil:</p><table><thead><tr><th>Angka</th><th>Kategori</th><th>Artinya</th></tr></thead><tbody><tr><td><b>2xx</b></td><td>Sukses</td><td>Permintaanmu berhasil</td></tr><tr><td><b>3xx</b></td><td>Pindah</td><td>Data ada di alamat lain</td></tr><tr><td><b>4xx</b></td><td>Salah klien</td><td>Permintaanmu yang bermasalah</td></tr><tr><td><b>5xx</b></td><td>Salah server</td><td>Servernya yang bermasalah</td></tr></tbody></table><p>Bedakan 4xx dan 5xx baik-baik. Kalau kamu kena 5xx, mengulang permintaan tidak menolong — servernya yang harus diperbaiki.</p>'
    },
    {
      type: 'text',
      html: '<h3>2xx Sukses, 3xx Pindah Halaman</h3><p>Tiga kode sukses yang wajib kamu kenal:</p><table><thead><tr><th>Kode</th><th>Nama</th><th>Dipakai saat</th></tr></thead><tbody><tr><td><code>200</code></td><td>OK</td><td>Berhasil membaca atau mengubah data</td></tr><tr><td><code>201</code></td><td>Created</td><td>Berhasil <b>membuat</b> data baru</td></tr><tr><td><code>204</code></td><td>No Content</td><td>Berhasil, misalnya menghapus, tapi tanpa isi jawaban</td></tr></tbody></table><p><b>3xx</b> jarang kamu tangani sendiri. Singkatnya: server bilang "datanya ada di alamat lain, ikuti saja". Browser biasanya mengikutinya diam-diam.</p>'
    },
    {
      type: 'text',
      html: '<h3>4xx dan 5xx: Bedakan Siapa yang Salah</h3><p>Dua kelompok ini paling sering bikin bingung. Ingat satu kalimat: <b>4xx = permintaanmu yang bermasalah, 5xx = servernya yang bermasalah</b>.</p><p><b>4xx — salah di sisi klien.</b> Perbaiki permintaanmu, bukan servernya:</p><table><thead><tr><th>Kode</th><th>Arti</th><th>Contoh kejadian</th></tr></thead><tbody><tr><td><code>400</code></td><td>Bad Request</td><td>Format JSON salah ketik</td></tr><tr><td><code>401</code></td><td>Unauthorized</td><td>Belum login atau token habis</td></tr><tr><td><code>403</code></td><td>Forbidden</td><td>Sudah login, tapi tidak berhak</td></tr><tr><td><code>404</code></td><td>Not Found</td><td>Endpoint atau data tidak ada</td></tr><tr><td><code>409</code></td><td>Conflict</td><td>Email sudah dipakai akun lain</td></tr><tr><td><code>422</code></td><td>Unprocessable</td><td>Format benar, isi tidak valid (harga negatif)</td></tr><tr><td><code>429</code></td><td>Too Many Requests</td><td>Kirim request terlalu sering</td></tr></tbody></table><p><b>5xx — server bermasalah.</b> Permintaanmu benar, tapi server gagal memprosesnya:</p><table><thead><tr><th>Kode</th><th>Arti</th><th>Contoh kejadian</th></tr></thead><tbody><tr><td><code>500</code></td><td>Internal Server Error</td><td>Ada bug di kode server</td></tr><tr><td><code>502</code></td><td>Bad Gateway</td><td>Pengantar (proxy) kehilangan kontak dengan dapur</td></tr><tr><td><code>503</code></td><td>Service Unavailable</td><td>Server penuh atau sedang pemeliharaan</td></tr></tbody></table><p>Kalau kena 5xx, kamu cukup menunggu lalu mengulang nanti. Kalau kamu membangun API, jangan menampilkan kode ini apa adanya ke pengguna akhir — ganti dengan pesan yang ramah.</p>'
    },
    {
      type: 'text',
      html: '<h3>Bedah Kasus: 401 vs 403</h3><p>Dua kode ini paling sering tertukar. Ingat bedanya lewat pintu gedung:</p><table><thead><tr><th></th><th>401 Unauthorized</th><th>403 Forbidden</th></tr></thead><tbody><tr><td><b>Pertanyaannya</b></td><td>"Kamu siapa?"</td><td>"Kamu boleh apa?"</td></tr><tr><td><b>Kondisi</b></td><td>Belum login / token tidak valid</td><td>Sudah login, tapi hak akses kurang</td></tr><tr><td><b>Contoh</b></td><td>Buka halaman akun tanpa login</td><td>User biasa buka laporan admin</td></tr></tbody></table><p>Di ojek online: kamu belum login lalu buka menu Dompet → <b>401</b>. Kamu sudah login tapi buka menu khusus driver → <b>403</b>.</p>'
    },
    {
      type: 'example',
      title: 'Bentuk response untuk berbagai kode',
      lang: 'json',
      output: false,
      code: `// 200 OK — membaca produk
{ "id": 42, "name": "Sepatu Lari", "price": 425000 }

// 404 Not Found — produk tidak ada
{ "error": "produk dengan id 99 tidak ditemukan" }

// 429 Too Many Requests — terlalu sering
{ "error": "permintaan terlalu sering, coba lagi 30 detik lagi" }`,
      explain: [
        'Saat gagal, body berisi <b>pesan error</b> yang bisa kamu jelaskan ke pengguna.',
        'Angka di baris pertama respons adalah status code. Baca dulu angkanya, baru baca isinya.',
        'Contoh lain: 201 muncul saat membuat data, 204 muncul saat menghapus data.'
      ]
    },
    {
      type: 'example',
      title: 'Peta kode yang paling sering muncul',
      lang: 'text',
      output: false,
      code: `200 OK                   sukses membaca / mengubah
201 Created              data baru berhasil dibuat
204 No Content           sukses menghapus, tanpa isi
301 Moved Permanently    data pindah alamat (jarang ditangani)
400 Bad Request          permintaan rusak
401 Unauthorized         belum login
403 Forbidden            sudah login, tidak berhak
404 Not Found            tidak ada
409 Conflict             bentrok dengan data lama
422 Unprocessable        isi tidak valid
429 Too Many Requests    terlalu sering
500 Internal Error       server gagal
502 Bad Gateway          pengantar kehilangan kontak
503 Unavailable          server penuh / pemeliharaan`,
      explain: [
        'Hafalan realistis: <b>200, 201, 204, 400, 401, 403, 404, 500</b> dulu, sisanya menyusul.',
        'Angka pertama tetap jadi penolong: 4 = salah klien, 5 = salah server.',
        'Kode di atas akan muncul berulang saat kamu praktik di pelajaran Postman dan cURL.'
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: kuis tebak status code',
      lang: 'html',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: system-ui, sans-serif; font-size: 14px; margin: 12px; color: #0f172a; }
  .panel { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; background: #f8fafc; }
  #progress { font-size: 12px; color: #64748b; }
  #question { margin: 8px 0 12px; font-weight: 700; }
  .opt { display: block; width: 100%; text-align: left; margin-bottom: 6px; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; color: #0f172a; font-family: ui-monospace, Menlo, monospace; font-size: 13px; cursor: pointer; }
  .opt:hover:not(:disabled) { border-color: #2563eb; }
  .opt:disabled { cursor: default; opacity: 0.9; }
  .opt.correct { background: #dcfce7; border-color: #16a34a; color: #14532d; font-weight: 700; }
  .opt.wrong { background: #fee2e2; border-color: #dc2626; color: #7f1d1d; font-weight: 700; }
  #feedback { display: none; margin-top: 8px; padding: 8px 10px; border-radius: 6px; background: #fff; font-size: 13px; }
  #feedback.ok { border-left: 4px solid #16a34a; color: #14532d; }
  #feedback.bad { border-left: 4px solid #dc2626; color: #7f1d1d; }
  #nextBtn, #restart { margin-top: 10px; padding: 8px 14px; border: 0; border-radius: 6px; background: #2563eb; color: #fff; font-weight: 700; cursor: pointer; display: none; }
  #result { display: none; }
  #score { font-size: 18px; font-weight: 800; }
</style>
</head>
<body>
<div id="quiz" class="panel">
  <div id="progress"></div>
  <div id="question"></div>
  <div id="options"></div>
  <div id="feedback"></div>
  <button id="nextBtn"></button>
</div>
<div id="result" class="panel">
  <div id="score"></div>
  <p id="scoreMsg"></p>
  <button id="restart">Ulangi kuis</button>
</div>
<script>
  var questions = [
    { q: 'Kamu memanggil GET /products/42, dan produknya ada.', answer: '200 OK', options: ['200 OK', '201 Created', '404 Not Found', '500 Internal Server Error'], why: 'Membaca data yang ada = sukses tanpa perubahan, jadi 200 OK.' },
    { q: 'Kamu mencoba menghapus produk id 99, tapi produk itu tidak ada.', answer: '404 Not Found', options: ['200 OK', '204 No Content', '404 Not Found', '409 Conflict'], why: 'Yang dicari tidak ada = 404 Not Found. Tidak mungkin 204 karena tidak ada yang terhapus.' },
    { q: 'Pendaftaran akun baru berhasil disimpan server.', answer: '201 Created', options: ['200 OK', '201 Created', '204 No Content', '400 Bad Request'], why: 'Membuat data baru membalas 201 Created.' },
    { q: 'Kamu memanggil endpoint akun tanpa token login.', answer: '401 Unauthorized', options: ['401 Unauthorized', '403 Forbidden', '404 Not Found', '400 Bad Request'], why: 'Belum login = 401. Kalau sudah login tapi tidak berhak, baru 403.' },
    { q: 'User biasa mencoba membuka laporan khusus admin.', answer: '403 Forbidden', options: ['401 Unauthorized', '403 Forbidden', '404 Not Found', '429 Too Many Requests'], why: 'Sudah login tapi tidak berhak = 403 Forbidden.' },
    { q: 'Kamu mendaftar dengan email yang sudah dipakai akun lain.', answer: '409 Conflict', options: ['400 Bad Request', '409 Conflict', '422 Unprocessable', '500 Internal Server Error'], why: 'Data baru bentrok dengan data lama = 409 Conflict.' },
    { q: 'Kamu menekan tombol beli puluhan kali dalam satu detik.', answer: '429 Too Many Requests', options: ['400 Bad Request', '404 Not Found', '429 Too Many Requests', '503 Service Unavailable'], why: 'Terlalu sering dalam waktu singkat = 429 Too Many Requests.' },
    { q: 'Server mengalami bug tak terduga saat memproses permintaanmu.', answer: '500 Internal Server Error', options: ['400 Bad Request', '403 Forbidden', '500 Internal Server Error', '503 Service Unavailable'], why: 'Gagal tak terduga di dalam server = 500. Permintaanmu sendiri sebenarnya benar.' }
  ];
  var idx = 0;
  var score = 0;
  var answered = false;

  function showQuestion() {
    answered = false;
    var q = questions[idx];
    document.getElementById('progress').textContent = 'Soal ' + (idx + 1) + ' dari ' + questions.length;
    document.getElementById('question').textContent = q.q;
    var box = document.getElementById('options');
    box.innerHTML = '';
    q.options.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.className = 'opt';
      btn.textContent = opt;
      btn.onclick = function () { answer(opt, btn); };
      box.appendChild(btn);
    });
    document.getElementById('feedback').style.display = 'none';
    document.getElementById('nextBtn').style.display = 'none';
  }

  function answer(opt, btn) {
    if (answered) { return; }
    answered = true;
    var q = questions[idx];
    var buttons = document.querySelectorAll('#options .opt');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].disabled = true;
      if (buttons[i].textContent === q.answer) { buttons[i].classList.add('correct'); }
    }
    var benar = (opt === q.answer);
    if (benar) {
      score++;
    } else {
      btn.classList.add('wrong');
    }
    var fb = document.getElementById('feedback');
    fb.textContent = (benar ? 'Benar! ' : 'Belum tepat. Jawaban benar: ' + q.answer + '. ') + q.why;
    fb.className = benar ? 'ok' : 'bad';
    fb.style.display = 'block';
    var next = document.getElementById('nextBtn');
    next.textContent = (idx === questions.length - 1) ? 'Lihat hasil' : 'Soal berikutnya';
    next.style.display = 'inline-block';
  }

  function showResult() {
    document.getElementById('quiz').style.display = 'none';
    document.getElementById('result').style.display = 'block';
    document.getElementById('score').textContent = 'Skor kamu: ' + score + ' dari ' + questions.length;
    document.getElementById('scoreMsg').textContent = (score >= 7)
      ? 'Hebat! Kamu sudah bisa membaca kode dari angka pertamanya.'
      : 'Tidak apa-apa. Baca lagi tabel 4xx, lalu coba sekali lagi.';
  }

  document.getElementById('nextBtn').onclick = function () {
    if (idx === questions.length - 1) {
      showResult();
    } else {
      idx++;
      showQuestion();
    }
  };
  document.getElementById('restart').onclick = function () {
    idx = 0;
    score = 0;
    document.getElementById('result').style.display = 'none';
    document.getElementById('quiz').style.display = 'block';
    showQuestion();
  };
  showQuestion();
</script>
</body>
</html>`,
      hint: 'Jawab 8 soal. Kuncinya: baca skenarionya dulu, lalu tanya — ini sukses, salah klien, atau salah server?'
    },
    {
      type: 'warn',
      title: 'Jangan balas semua dengan 200 OK',
      text: 'Server yang selalu membalas <code>200 OK</code> — meski permintaannya gagal — membuat program klien harus menebak isi body untuk tahu hasilnya. Salah tebak = bug yang sulit dicari. Kirimlah kode yang jujur: 201 saat membuat, 404 saat tidak ada, 500 saat server gagal.'
    },
    {
      type: 'tip',
      title: 'Cara cepat: baca angka pertamanya saja',
      text: 'Lihat kode <code>422</code> atau <code>429</code> dan bingung? Tenang. Bacalah <b>angka pertamanya saja</b>: 4 berarti salah klien, 5 berarti salah server. Kode persisnya tinggal dicari di tabel saat butuh. Untuk kerja sehari-hari, hafal 8 kode utama sudah cukup: 200, 201, 204, 400, 401, 403, 404, 500.'
    },
    {
      type: 'vocab',
      items: [
        ['Status code', 'Angka tiga digit balasan server yang menyatakan hasil sebuah permintaan.'],
        ['2xx', 'Kategori sukses: permintaan berhasil diproses.'],
        ['3xx', 'Kategori pindah: data ada di alamat lain.'],
        ['4xx', 'Kategori salah klien: permintaan yang dikirim bermasalah.'],
        ['5xx', 'Kategori salah server: server gagal memproses permintaan yang benar.'],
        ['401 Unauthorized', 'Belum login atau token tidak valid.'],
        ['403 Forbidden', 'Sudah login tapi tidak berhak mengakses.'],
        ['404 Not Found', 'Endpoint atau data yang dicari tidak ada.']
      ]
    }
  ],
  recap: [
    'Angka pertama menentukan kategori: <b>2xx sukses, 3xx pindah, 4xx salah klien, 5xx salah server</b>.',
    '<b>200</b> berhasil, <b>201</b> data baru dibuat, <b>204</b> sukses tanpa isi.',
    '<b>401 = belum login; 403 = sudah login tapi tidak berhak.</b>',
    'API yang baik mengirim kode jujur — bukan <code>200 OK</code> untuk semua kondisi.',
    'Saat menemui kode asing, baca dulu angka pertamanya, baru cari artinya.'
  ]
});
