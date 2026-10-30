/* ============================================================
   Pelajaran Dasar RESTful API — Bab 15: Proyek Mini, Rangkuman, dan Langkah Berikutnya
   ============================================================ */
'use strict';

window.RESTFULAPI_LESSONS = window.RESTFULAPI_LESSONS || [];

window.RESTFULAPI_LESSONS.push({
  id: 'proyek-mini-rangkuman',
  title: 'Proyek Mini, Rangkuman, dan Langkah Berikutnya',
  chapter: 'Praktik API',
  duration: '10 menit',
  intro: [
    'Empat belas pelajaran terakhir membawamu dari “apa itu API” sampai “memanggil API dari kode”. Pelajaran penutup ini merangkum semuanya, lalu menguji pemahamanmu lewat dua proyek mini.',
    'Dua proyeknya ringkas: satu membuat aplikasi kecil yang memakai API, satu membuat dokumen rancangan API. Keduanya bisa selesai dalam satu sampai dua jam. Setelah itu, kamu siap masuk ke fase berikutnya: <b>membangun REST API sendiri</b>.'
  ],
  objectives: [
    'Merangkum kembali konsep kunci seluruh bab Dasar RESTful API',
    'Mengerjakan Proyek Mini A: menampilkan data API publik dengan pencarian dan pesan error',
    'Menyusun Proyek Mini B: dokumen rancangan API toko lengkap dengan contoh JSON',
    'Menilai kesiapan diri sebelum lanjut ke fase membangun REST API'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Rangkuman 15 Pelajaran</h3><p>Satu baris kunci per pelajaran, dari awal sampai akhir bab ini:</p><ol><li><b>Apa itu API</b> — perantara resmi dua program; analoginya pelayan restoran.</li><li><b>Client, server, request, response</b> — anatomi komunikasi web.</li><li><b>URL & endpoint</b> — alamat data; bedakan domain, path, dan query.</li><li><b>HTTP method</b> — GET, POST, PUT, PATCH, DELETE ↔ operasi CRUD.</li><li><b>Status code</b> — 2xx sukses, 4xx salah klien, 5xx salah server.</li><li><b>JSON</b> — bahasa data web: objek, array, dan tanda kutip.</li><li><b>Path, query, body</b> — tempat yang tepat untuk setiap jenis data.</li><li><b>HTTP headers</b> — keterangan amplop: Content-Type, Accept, Authorization.</li><li><b>Prinsip REST</b> — stateless, uniform interface, dan kawan-kawannya.</li><li><b>Merancang endpoint</b> — pakai kata benda jamak dan versi API.</li><li><b>Format response & error</b> — balasan yang konsisten dan pesan yang jelas.</li><li><b>Safe & idempotent</b> — GET, PUT, DELETE aman diulang; POST tidak.</li><li><b>Postman & cURL</b> — uji API tanpa menulis program.</li><li><b>Panggil API dari kode</b> — Fetch, Axios, requests; selalu periksa res.ok.</li><li><b>Proyek mini</b> — pelajaran ini: konsumsi API dan rancang API.</li></ol>'
    },
    {
      type: 'text',
      html: '<h3>Proyek Mini A — Konsumsi API</h3><p>Buat satu halaman web kecil yang menampilkan data dari API publik. Kamu boleh memilih PokéAPI atau JSONPlaceholder.</p><p>Minimal punya tiga fitur ini:</p><ul><li><b>Menampilkan data</b> — ambil daftar data, tampilkan rapi.</li><li><b>Pencarian</b> — kotak isian yang menyaring data berdasarkan kata kunci.</li><li><b>Pesan error ramah</b> — kata-kata yang mudah dipahami saat gagal.</li></ul><p>Langkah pengerjaannya:</p><ol><li>Pilih API publik dan baca dokumentasinya sekilas.</li><li>Buat halaman HTML kosong dengan satu daftar dan satu kotak cari.</li><li>Tulis fungsi ambil data dengan try…catch dan cek res.ok.</li><li>Tambahkan penyaringan data untuk pencarian.</li><li>Uji jalur gagal: matikan internet, atau panggil URL yang salah.</li></ol>'
    },
    {
      type: 'example',
      title: 'Inti Proyek Mini A: ambil, tampilkan, cari, dan tangani gagal',
      lang: 'javascript',
      output: false,
      code: `// Potongan inti halaman Proyek Mini A
const daftar = document.getElementById('daftar');
let posts = [];

async function muatData() {
  daftar.textContent = 'Memuat...';
  try {
    const res = await fetch('https://jsonplaceholder.typicode.com/posts');
    if (!res.ok) throw new Error('Status ' + res.status);
    posts = await res.json();
    tampilkan(posts.slice(0, 10));
  } catch (err) {
    daftar.innerHTML = '<p class="error">Data tidak bisa dimuat. Coba lagi nanti, ya.</p>';
  }
}

function tampilkan(daftarData) {
  daftar.innerHTML = daftarData
    .map(function (p) { return '<li>' + p.id + ' — ' + p.title + '</li>'; })
    .join('');
}

document.getElementById('cari').oninput = function (e) {
  const kata = e.target.value.toLowerCase();
  const hasil = posts.filter(function (p) {
    return p.title.toLowerCase().indexOf(kata) >= 0;
  });
  tampilkan(hasil);
};

muatData();`,
      explain: [
        'Pencarian menyaring data yang sudah diunduh, jadi tidak perlu memanggil API berulang kali.',
        'Pesan error ditampilkan dengan bahasa ramah, bukan teks mentah seperti “TypeError: Failed to fetch”.',
        'Saat kamu mengerjakan sendiri, ganti URL-nya dengan API publik pilihanmu dan sesuaikan nama field-nya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Proyek Mini B — Rancang API</h3><p>Kali ini kamu berperan sebagai perancang. Tulis dokumen rancangan API untuk sebuah toko kecil.</p><p>Dokumen minimal memuat:</p><ul><li>Daftar endpoint beserta method-nya.</li><li>Status code yang dipakai, untuk jalur sukses dan gagal.</li><li>Contoh request dan response dalam JSON.</li></ul><p>Setelah dokumen jadi, uji request-nya di Postman. Karena API-mu belum ada, pakai API tiruan <b>ReqRes</b> (https://reqres.in) sebagai tempat latihan mengirim dan menerima data.</p><p>Tujuannya bukan kode yang berjalan. Tujuannya berlatih <b>berpikir seperti perancang API</b> sebelum kamu membangunnya sendiri.</p>'
    },
    {
      type: 'example',
      title: 'Contoh isi dokumen rancangan API toko',
      lang: 'json',
      output: false,
      code: `// ===== Daftar endpoint (ringkas) =====
GET    /api/v1/produk          → 200
GET    /api/v1/produk/{id}     → 200 | 404
POST   /api/v1/produk          → 201 | 400 | 422
PUT    /api/v1/produk/{id}     → 200 | 404
DELETE /api/v1/produk/{id}     → 204 | 404

// ===== Contoh request (POST) =====
POST /api/v1/produk
Content-Type: application/json

{
  "nama": "Kopi Arabika",
  "harga": 65000,
  "stok": 12
}

// ===== Contoh response sukses (201 Created) =====
{
  "pesan": "Produk berhasil dibuat",
  "data": {
    "id": 1,
    "nama": "Kopi Arabika",
    "harga": 65000,
    "stok": 12
  }
}

// ===== Contoh response gagal (404 Not Found) =====
{
  "error": "produk tidak ditemukan"
}`,
      explain: [
        'Perhatikan pola penamaan: kata benda jamak (<code>/produk</code>), huruf kecil, dan memakai versi (<code>/v1</code>).',
        'Tiap endpoint disertai status code jalur sukses maupun gagal — inilah bagian terpenting dokumen rancangan.',
        'Bentuk response konsisten: data di bawah kunci <code>data</code>, pesan gagal di bawah kunci <code>error</code>.'
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: perancang dokumen API',
      lang: 'html',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: system-ui, sans-serif; font-size: 14px; margin: 12px; color: #0f172a; }
  .bar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 12px; }
  input { font: inherit; padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 6px; min-width: 160px; }
  button { padding: 8px 14px; border: 0; border-radius: 6px; background: #2563eb; color: #fff; font-weight: 700; cursor: pointer; }
  button:hover { background: #1d4ed8; }
  button.abu { background: #475569; }
  button.abu:hover { background: #334155; }
  h4 { margin: 14px 0 6px; font-size: 13px; }
  table { border-collapse: collapse; width: 100%; font-size: 13px; }
  th, td { border: 1px solid #e2e8f0; padding: 5px 8px; text-align: left; }
  th { background: #f1f5f9; }
  pre { background: #0f172a; color: #e2e8f0; padding: 10px; border-radius: 8px; white-space: pre-wrap; margin: 6px 0 0; }
  .note { font-size: 12px; color: #64748b; }
  code { background: #f1f5f9; padding: 1px 4px; border-radius: 4px; }
</style>
</head>
<body>
<p><b>Perancang dokumen API.</b> Isi nama resource (misalnya <b>produk</b>), lalu tekan <b>Buat Dokumen</b>.</p>
<div class="bar">
  <input id="nama" value="produk" placeholder="nama resource">
  <button id="buat">Buat Dokumen</button>
  <button id="salin" class="abu">Salin Dokumen</button>
  <span id="pesan" class="note"></span>
</div>
<div id="keluar"><p class="note">Dokumen akan muncul di sini.</p></div>
<script>
  var namaSekarang = 'produk';

  function judul(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function bersih(s) {
    return s.trim().toLowerCase().split(' ').join('-').replace(/[^a-z0-9-]/g, '');
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function barisDokumen(nama) {
    var base = '/api/v1/' + nama;
    return [
      ['GET', base, '200', 'Ambil daftar ' + nama],
      ['GET', base + '/{id}', '200 · 404', 'Ambil satu ' + nama],
      ['POST', base, '201 · 400 · 422', 'Buat ' + nama + ' baru'],
      ['PUT', base + '/{id}', '200 · 404', 'Ganti seluruh data ' + nama],
      ['DELETE', base + '/{id}', '204 · 404', 'Hapus ' + nama]
    ];
  }

  function contohBody(nama) {
    return { nama: 'Contoh ' + nama, harga: 65000, stok: 12 };
  }

  function gambarDokumen(nama) {
    var base = '/api/v1/' + nama;
    var html = '<h4>Dokumen Rancangan API — ' + judul(nama) + '</h4>';
    html += '<table><thead><tr><th>Method</th><th>Endpoint</th><th>Status</th><th>Fungsi</th></tr></thead><tbody>';
    barisDokumen(nama).forEach(function (b) {
      html += '<tr><td><code>' + b[0] + '</code></td><td><code>' + esc(b[1]) + '</code></td><td>' + b[2] + '</td><td>' + esc(b[3]) + '</td></tr>';
    });
    html += '</tbody></table>';
    html += '<h4>Contoh request — POST ' + base + '</h4><pre>' + esc(JSON.stringify(contohBody(nama), null, 2)) + '</pre>';
    html += '<h4>Contoh response sukses — 201 Created</h4><pre>' + esc(JSON.stringify({ pesan: judul(nama) + ' berhasil dibuat', data: Object.assign({ id: 1 }, contohBody(nama)) }, null, 2)) + '</pre>';
    html += '<h4>Contoh response gagal — 404 Not Found</h4><pre>' + esc(JSON.stringify({ error: nama + ' tidak ditemukan' }, null, 2)) + '</pre>';
    html += '<p class="note">Uji coba request-nya di Postman ke API tiruan: https://reqres.in</p>';
    return html;
  }

  function markdownDokumen(nama) {
    var base = '/api/v1/' + nama;
    var baris = [
      '# Dokumen Rancangan API — ' + judul(nama),
      '',
      '| Method | Endpoint | Status | Fungsi |',
      '|--------|----------|--------|--------|'
    ];
    barisDokumen(nama).forEach(function (b) {
      baris.push('| ' + b[0] + ' | ' + b[1] + ' | ' + b[2] + ' | ' + b[3] + ' |');
    });
    baris.push('', 'Contoh request POST ' + base + ':', JSON.stringify(contohBody(nama), null, 2));
    baris.push('', 'Uji coba di Postman ke API tiruan: https://reqres.in');
    return baris.join('\\n');
  }

  document.getElementById('buat').addEventListener('click', function () {
    var nama = bersih(document.getElementById('nama').value);
    if (nama === '') {
      document.getElementById('keluar').innerHTML = '<p class="note">Isi nama resource dulu, ya. Contoh: produk, pesanan, pelanggan.</p>';
      return;
    }
    namaSekarang = nama;
    document.getElementById('keluar').innerHTML = gambarDokumen(nama);
    document.getElementById('pesan').textContent = '';
  });

  document.getElementById('salin').addEventListener('click', function () {
    var teks = markdownDokumen(namaSekarang);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(teks).then(
        function () { document.getElementById('pesan').textContent = 'Tersalin ke papan klip!'; },
        function () { salinManual(teks); }
      );
    } else {
      salinManual(teks);
    }
  });

  function salinManual(teks) {
    var ta = document.createElement('textarea');
    ta.value = teks;
    document.body.appendChild(ta);
    ta.select();
    var berhasil = false;
    try { berhasil = document.execCommand('copy'); } catch (e) { berhasil = false; }
    document.body.removeChild(ta);
    if (berhasil) {
      document.getElementById('pesan').textContent = 'Tersalin ke papan klip!';
    } else {
      document.getElementById('keluar').innerHTML = '<h4>Versi teks (salin manual)</h4><pre>' + esc(teks) + '</pre>';
      document.getElementById('pesan').textContent = 'Salin otomatis diblokir peramban. Pilih teks di atas lalu salin.';
    }
  }

  document.getElementById('buat').click();
</script>
</body>
</html>`,
      hint: 'Isi nama resource, misalnya “pesanan”, lalu tekan “Buat Dokumen”. Hasilnya bisa disalin ke catatanmu, dan contoh JSON-nya bisa langsung ditempel ke Postman.'
    },
    {
      type: 'text',
      html: '<h3>Checklist: Siap Lanjut ke Fase Berikutnya?</h3><p>Centang yang sudah bisa kamu lakukan sendiri, tanpa melihat catatan:</p><ul><li>✔ Menyebutkan method dan status code yang tepat untuk operasi CRUD.</li><li>✔ Membaca dan menulis JSON tanpa bingung.</li><li>✔ Menguji GET dan POST lewat Postman atau cURL.</li><li>✔ Memanggil API dari kode sambil memeriksa res.ok atau status_code.</li><li>✔ Menyusun rancangan endpoint sederhana untuk satu aplikasi.</li></ul><p>Kalau semua sudah tercentang, selamat! Kamu siap masuk ke fase <b>Membangun REST API Pertamamu</b>.</p><p>Satuan penutup: isi <b>Kuis 40 soal</b> di tutorial ini untuk mengukur pemahamanmu. Kerjakan tanpa membuka materi lebih dulu, lalu baca pembahasan setiap jawaban. Selamat belajar!</p>'
    },
    {
      type: 'tip',
      title: 'Mulai dari yang kecil',
      text: 'Dua proyek ini sengaja dibuat ringkas. Kerjakan satu dulu sampai tuntas, baru naikkan tantangannya sedikit demi sedikit. Proyek kecil yang selesai lebih berharga daripada proyek besar yang mangkrak.'
    },
    {
      type: 'warn',
      title: 'API publik bisa berubah atau berhenti',
      text: 'API latihan gratis tidak selamanya tersedia. Saat membuat proyek, siapkan data cadangan (mock) yang kamu simpan sendiri. Aplikasimu tetap bisa dipamerkan meski API eksternal sedang bermasalah.'
    },
    {
      type: 'vocab',
      items: [
        ['Konsumsi API', 'Memakai API buatan orang lain di dalam programmu sendiri.'],
        ['Mock API', 'API tiruan untuk latihan; membalas data palsu tanpa database sungguhan.'],
        ['Dokumen rancangan API', 'Daftar endpoint, method, status code, dan contoh JSON sebuah API.'],
        ['Pagination', 'Membagi data menjadi beberapa halaman agar tidak terlalu banyak sekaligus.'],
        ['Endpoint', 'Kombinasi method dan path yang bisa dipanggil, misalnya GET /api/v1/produk.'],
        ['Checklist kelanjutan', 'Daftar kemampuan yang seharusnya sudah kamu kuasai sebelum membangun API sendiri.']
      ]
    }
  ],
  recap: [
    'Seluruh bab ini berputar di satu ide: program bertukar data lewat HTTP dengan aturan yang disepakati.',
    'Proyek Mini A melatihmu memakai API; Proyek Mini B melatihmu merancang API.',
    'Dokumen rancangan yang baik memuat endpoint, method, status code, dan contoh JSON.',
    'Kunci sebelum lanjut: paham method, status code, JSON, bisa uji di Postman, dan bisa panggil API dari kode.',
    'Uji pemahamanmu dengan Kuis 40 soal, lalu lanjut ke fase Membangun REST API Pertamamu.'
  ]
});
