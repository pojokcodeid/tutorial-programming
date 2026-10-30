/* ============================================================
   Pelajaran Dasar RESTful API — Bab 14: Memanggil API dari Program
   ============================================================ */
'use strict';

window.RESTFULAPI_LESSONS = window.RESTFULAPI_LESSONS || [];

window.RESTFULAPI_LESSONS.push({
  id: 'panggil-api-dari-kode',
  title: 'Memanggil API dari Program: Fetch, Axios, Requests',
  chapter: 'Praktik API',
  duration: '10 menit',
  intro: [
    'Di pelajaran lalu kamu menguji API lewat Postman. Rasanya seperti mencicipi masakan sebelum memasak sendiri. Sekarang waktunya memasak: memakai data API di dalam program buatanmu.',
    'Misalnya, aplikasi warung kopi buatanmu bisa menampilkan menu langsung dari server. Halaman berita bisa menampilkan cuaca dari API. Pelajaran ini mengajakmu menulis request <b>GET</b> dan <b>POST</b> dengan Fetch API JavaScript, lalu membiasakan diri memeriksa status dan menangani kegagalan.'
  ],
  objectives: [
    'Menjelaskan alur memanggil API dari dalam program',
    'Menulis request GET dan POST memakai Fetch API JavaScript',
    'Memeriksa res.ok atau status_code sebelum memakai data',
    'Menangani kegagalan dengan pesan error yang ramah'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Kenapa Memanggil API dari Program?</h3><p>Alat uji seperti Postman hanya untuk kamu. Programmu butuh cara memanggil API sendiri, dari dalam kodenya.</p><p>Kabar baiknya, polanya selalu sama — hanya empat langkah:</p><ol><li><b>Kirim request</b> dari kode.</li><li><b>Tunggu balasan</b> dari server.</li><li><b>Periksa status code</b>: sukses atau gagal?</li><li><b>Baca isi balasan</b> (JSON), lalu tampilkan.</li></ol><p>JavaScript punya alat bawaan bernama <b>Fetch API</b> untuk keempat langkah itu. Tanpa perlu instal apa pun, kamu sudah bisa memanggil API dari browser maupun Node.js.</p>'
    },
    {
      type: 'text',
      html: '<h3>Kenapa Hasilnya Tidak Langsung Datang?</h3><p>Bayangkan kamu memesan ojek online. Setelah menekan pesan, kamu tidak berdiri diam menunggu. Kamu sambil memakai HP, menyiapkan dompet, atau mengerjakan hal lain.</p><p>Pemanggilan API bekerja serupa. Menunggu server bisa memakan waktu. Jadi programmu tidak perlu membeku — ia mengerjakan hal lain lebih dulu, lalu menerima hasilnya menyusul.</p><p>Istilah resminya: <b>asynchronous</b>, artinya berjalan bersamaan dan hasilnya menyusul.</p><p>Di JavaScript, hasil yang menyusul dibungkus <b>Promise</b> — semacam tanda terima yang menyusul. Kata <code>await</code> dipakai untuk menunggu tanda terima itu berisi hasil.</p>'
    },
    {
      type: 'example',
      title: 'GET: baca data lalu tampilkan',
      lang: 'javascript',
      output: false,
      code: `// GET: ambil 10 judul post, lalu tampilkan di console
async function ambilPosts() {
  try {
    const res = await fetch('https://jsonplaceholder.typicode.com/posts');

    if (!res.ok) {
      throw new Error('Gagal memuat data. Status: ' + res.status);
    }

    const data = await res.json();
    data.slice(0, 10).forEach(function (post) {
      console.log(post.id + '. ' + post.title);
    });
  } catch (err) {
    console.error('Ups, terjadi masalah: ' + err.message);
  }
}

ambilPosts();`,
      explain: [
        '<code>fetch()</code> adalah alat bawaan JavaScript untuk mengirim request. Ia mengembalikan Promise, jadi kita beri <code>await</code>.',
        '<code>res.ok</code> bernilai true bila status code 200–299. Kalau false, kita hentikan proses dengan pesan yang jelas.',
        '<code>res.json()</code> mengubah isi balasan menjadi data siap pakai — juga dengan <code>await</code>.',
        'Blok <code>try…catch</code> menangkap kegagalan lain, misalnya koneksi terputus di tengah jalan.'
      ]
    },
    {
      type: 'example',
      title: 'POST: kirim data lalu periksa statusnya',
      lang: 'javascript',
      output: false,
      code: `// POST: kirim data baru, lalu periksa balasan server
async function buatPost() {
  const payload = { title: 'Belajar REST', body: 'Percobaan pertama', userId: 7 };

  try {
    const res = await fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error('Gagal menyimpan data. Status: ' + res.status);
    }

    const data = await res.json();
    console.log('Berhasil! Data tersimpan dengan id ' + data.id);
  } catch (err) {
    console.error('Ups, terjadi masalah: ' + err.message);
  }
}

buatPost();`,
      explain: [
        'Data yang dikirim lewat fetch harus diubah dulu menjadi teks JSON memakai <code>JSON.stringify()</code>.',
        'Header <code>Content-Type: application/json</code> memberi tahu server isi body-mu berupa JSON.',
        'Balasan POST yang benar biasanya <b>201 Created</b>. Kalau kamu dapat 200 terus, periksa kembali API-nya.'
      ]
    },
    {
      type: 'text',
      html: `<h3>Alternatif: Axios dan requests</h3><p><code>fetch</code> sudah cukup untuk kebanyakan keperluan. Tapi ada pustaka populer yang sering dipakai para profesional.</p><p><b>Axios</b> untuk JavaScript — sedikit lebih ringkas:</p><pre><code>import axios from 'axios';

async function ambilPost() {
  try {
    const res = await axios.get('https://jsonplaceholder.typicode.com/posts/1');
    console.log(res.status);      // 200
    console.log(res.data.title);  // data langsung siap pakai
  } catch (err) {
    const status = err.response ? err.response.status : 'koneksi gagal';
    console.error('Gagal:', status);
  }
}

ambilPost();</code></pre><p><b>requests</b> untuk Python — pustaka HTTP paling populer di sana:</p><pre><code>import requests

r = requests.get('https://jsonplaceholder.typicode.com/posts/1')
if r.status_code == 200:
    data = r.json()
    print(data['title'])
else:
    print('Gagal. Status:', r.status_code)

payload = {'title': 'Belajar REST', 'userId': 7}
r2 = requests.post('https://jsonplaceholder.typicode.com/posts', json=payload)
print(r2.status_code)  # 201</code></pre><p>Pola yang dipakai sama semua: kirim, periksa status, baca data, tangani gagal. Bedanya hanya nama dan cara menulisnya.</p>`,
    },
    {
      type: 'text',
      html: '<h3>Kebiasaan Baik: Periksa Status, Sambut Gagal dengan Ramah</h3><p>Jangan pernah menganggap request selalu berhasil. Bisa saja data tidak ada, server error, atau koneksi terputus.</p><p>Minimal, siapkan tiga penanganan ini:</p><table><thead><tr><th>Situasi</th><th>Cara mengecek</th><th>Pesan yang ramah</th></tr></thead><tbody><tr><td>Data tidak ditemukan</td><td>status 404 / res.ok false</td><td>“Data yang kamu cari tidak ada. Coba periksa ID-nya, ya.”</td></tr><tr><td>Server bermasalah</td><td>status 500</td><td>“Layanan sedang sibuk. Coba lagi beberapa saat lagi.”</td></tr><tr><td>Koneksi gagal</td><td>blok catch (exception)</td><td>“Koneksi bermasalah. Periksa internetmu lalu coba lagi.”</td></tr></tbody></table><p>Pesan ramah membuat pengguna tetap tenang. Pesan teknis mentah seperti <code>TypeError: Failed to fetch</code> hanya membingungkan mereka.</p>'
    },
    {
      type: 'live',
      title: 'Coba sendiri: simulasi memanggil API dari kode',
      lang: 'html',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: system-ui, sans-serif; font-size: 14px; margin: 12px; color: #0f172a; }
  .bar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
  button { padding: 8px 14px; border: 0; border-radius: 6px; background: #2563eb; color: #fff; font-weight: 700; cursor: pointer; }
  button:hover { background: #1d4ed8; }
  button:disabled { background: #94a3b8; cursor: not-allowed; }
  #muat { color: #475569; font-weight: 700; }
  .kartu { border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; margin-top: 10px; }
  .kartu .judul { font-weight: 700; }
  .ok { color: #16a34a; }
  .bad { color: #dc2626; }
  pre { background: #0f172a; color: #e2e8f0; padding: 10px; border-radius: 8px; white-space: pre-wrap; margin: 6px 0 0; }
</style>
</head>
<body>
<p><b>Simulasi memanggil API dari kode.</b> Tiap tombol meniru satu skenario fetch beserta penanganan errornya.</p>
<div class="bar">
  <button data-go="ambil">Ambil Data (GET)</button>
  <button data-go="buat">Buat Data (POST)</button>
  <button data-go="notfound">Coba 404</button>
  <button data-go="server">Coba 500</button>
  <button data-go="offline">Coba koneksi gagal</button>
</div>
<p id="muat" hidden>Sedang memuat...</p>
<div id="hasil"></div>
<script>
  var posts = [
    { id: 1, title: 'Belajar REST bagian 1', userId: 7 },
    { id: 2, title: 'Status code itu penting', userId: 7 },
    { id: 3, title: 'JSON bahasa data web', userId: 3 }
  ];
  var nextId = 101;

  // Versi palsu fetch: membalas setelah 700 ms lewat Promise + setTimeout
  function mockFetch(method, path, data) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        if (path === 'koneksi-putus') {
          reject(new Error('Failed to fetch'));
          return;
        }
        function balas(ok, status, teks, body) {
          resolve({
            ok: ok, status: status, statusText: teks,
            json: function () { return Promise.resolve(body); }
          });
        }
        if (path === 'latihan/error') {
          return balas(false, 500, 'Internal Server Error', { error: 'Server lagi bermasalah' });
        }
        var bagian = path.split('/').filter(Boolean);
        if (bagian[0] === 'posts' && bagian.length === 1) {
          if (method === 'GET') return balas(true, 200, 'OK', posts);
          if (method === 'POST') {
            var baru = Object.assign({ id: nextId }, data || {});
            nextId += 1;
            posts.push(baru);
            return balas(true, 201, 'Created', baru);
          }
        }
        if (bagian[0] === 'posts' && bagian.length === 2) {
          var id = Number(bagian[1]);
          var post = posts.find(function (p) { return p.id === id; });
          if (post) return balas(true, 200, 'OK', post);
          return balas(false, 404, 'Not Found', { error: 'Post id ' + bagian[1] + ' tidak ada' });
        }
        balas(false, 404, 'Not Found', { error: 'Endpoint tidak ditemukan' });
      }, 700);
    });
  }

  var hasilEl = document.getElementById('hasil');
  var muatEl = document.getElementById('muat');
  var semuaTombol = document.querySelectorAll('button[data-go]');

  function memuat(on) {
    muatEl.hidden = !on;
    semuaTombol.forEach(function (b) { b.disabled = on; });
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function catat(judul, status, isi) {
    var div = document.createElement('div');
    div.className = 'kartu';
    var warna = status && status < 400 ? 'ok' : 'bad';
    var label = status ? status + ' ' : 'ERROR ';
    div.innerHTML = '<span class="judul">' + judul + '</span> → <span class="' + warna + '">' + label + '</span><pre>' + esc(isi) + '</pre>';
    hasilEl.prepend(div);
  }

  async function ambilData() {
    memuat(true);
    try {
      var res = await mockFetch('GET', '/posts');
      if (!res.ok) {
        catat('GET /posts', res.status, 'Gagal memuat daftar. Status ' + res.status);
        return;
      }
      var data = await res.json();
      catat('GET /posts', res.status, JSON.stringify(data, null, 2));
    } catch (err) {
      catat('GET /posts', 0, 'Koneksi gagal. Periksa internetmu, lalu coba lagi.');
    } finally {
      memuat(false);
    }
  }

  async function buatData() {
    memuat(true);
    try {
      var res = await mockFetch('POST', '/posts', { title: 'Data baru dari simulasi', userId: 7 });
      if (!res.ok) {
        catat('POST /posts', res.status, 'Gagal menyimpan data. Coba lagi nanti.');
        return;
      }
      var data = await res.json();
      catat('POST /posts', res.status, JSON.stringify(data, null, 2));
    } catch (err) {
      catat('POST /posts', 0, 'Koneksi gagal. Data belum terkirim — coba lagi.');
    } finally {
      memuat(false);
    }
  }

  async function cobaStatus(kode) {
    memuat(true);
    try {
      var path = kode === 500 ? 'latihan/error' : 'posts/999';
      var res = await mockFetch('GET', path, null);
      var data = await res.json();
      var pesan;
      if (res.status === 404) {
        pesan = 'Data yang kamu cari tidak ditemukan (404).\\nCoba periksa ID-nya, ya.';
      } else if (res.status === 500) {
        pesan = 'Server sedang bermasalah (500).\\nCoba lagi beberapa saat lagi.';
      } else {
        pesan = JSON.stringify(data, null, 2);
      }
      catat('GET /' + path, res.status, pesan);
    } finally {
      memuat(false);
    }
  }

  async function cobaKoneksi() {
    memuat(true);
    try {
      await mockFetch('GET', 'koneksi-putus', null);
    } catch (err) {
      catat('GET /latihan/koneksi-putus', 0, 'Koneksi gagal. Server tidak bisa dihubungi.\\nPeriksa jaringanmu lalu coba lagi.');
    } finally {
      memuat(false);
    }
  }

  var aksi = {
    ambil: ambilData,
    buat: buatData,
    notfound: function () { cobaStatus(404); },
    server: function () { cobaStatus(500); },
    offline: cobaKoneksi
  };
  semuaTombol.forEach(function (b) {
    b.addEventListener('click', function () { aksi[b.dataset.go](); });
  });
</script>
</body>
</html>`,
      hint: 'Tekan “Ambil Data” dan perhatikan tulisan “Memuat...” muncul sebelum hasil tiba. Lalu coba tombol 404, 500, dan koneksi gagal untuk melihat pesan error yang ramah.'
    },
    {
      type: 'tip',
      title: 'Beri tahu pengguna saat menunggu',
      text: 'Proses API butuh waktu, walau cuma sedetik. Saat memuat, tampilkan tulisan “Memuat...” atau animasi kecil. Pengguna jadi tahu aplikasimu sedang bekerja, bukan error.'
    },
    {
      type: 'warn',
      title: 'Jangan pernah menyembunyikan kegagalan',
      text: 'Lebih buruk daripada pesan error adalah tidak ada pesan sama sekali. Layar kosong membuat pengguna bingung. Selalu tampilkan kondisi dengan jujur: memuat, berhasil, atau gagal — memakai kata-kata yang mudah dipahami.'
    },
    {
      type: 'vocab',
      items: [
        ['Fetch API', 'Fitur bawaan JavaScript untuk mengirim request HTTP dari kode.'],
        ['Asynchronous', 'Proses yang hasilnya menyusul, sehingga program tidak perlu membeku.'],
        ['Promise', 'Objek penanda hasil yang belum datang; berisi sukses atau gagal.'],
        ['await', 'Kata kunci yang menunggu hasil Promise sebelum lanjut ke baris berikutnya.'],
        ['res.ok', 'Penanda boolean: true bila status code balasan 200–299.'],
        ['Axios', 'Pustaka populer untuk HTTP di JavaScript; kerap lebih ringkas dari fetch.'],
        ['requests', 'Pustaka HTTP paling populer di Python.']
      ]
    }
  ],
  recap: [
    'Di dalam program, polanya selalu: kirim request, tunggu, periksa status, baca JSON.',
    'Fetch API bawaan JavaScript; Axios (JS) dan requests (Python) adalah alternatif populer.',
    'Selalu periksa res.ok (JavaScript) atau r.status_code (Python) sebelum memakai data.',
    'Prosesnya asynchronous: hasil menyusul, program tetap bisa mengerjakan hal lain.'
  ]
});
