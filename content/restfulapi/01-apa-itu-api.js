/* ============================================================
   Pelajaran Dasar RESTful API — Bab 1: Apa itu API?
   ============================================================ */
'use strict';

window.RESTFULAPI_LESSONS = window.RESTFULAPI_LESSONS || [];

window.RESTFULAPI_LESSONS.push({
  id: 'apa-itu-api',
  title: 'Apa Itu API? Kenapa Aplikasi Butuh API',
  chapter: 'Fondasi API',
  duration: '10 menit',
  intro: [
    'Pernahkah kamu pesan makanan lewat aplikasi, lalu datang 30 menit kemudian? Kamu tidak pernah masuk ke dapur restoran — kamu cukup memilih dari <b>menu</b>, <b>pelayan</b> meneruskan pesananmu, lalu makanan diantar kembali ke meja. Di dunia aplikasi, peran-peran itu juga ada.',
    '<b>API</b> adalah perantara resmi yang menentukan apa yang boleh diminta, bagaimana cara memintanya, dan bentuk jawabannya. Pelajaran ini membedah arti API, membedakan website dengan API, dan menunjukkan aktivitas harianmu yang ternyata berjalan lewat API.'
  ],
  objectives: [
    'Menjelaskan apa itu API dengan bahasa sendiri memakai analogi restoran',
    'Membedakan website (untuk manusia) dengan API (untuk program)',
    'Menyebutkan minimal 3 aktivitas harian yang memakai API',
    'Memahami peran klien, server, request, dan response secara umum'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Analogi Restoran</h3><p>Bayangkan kamu sedang makan di restoran:</p><table><thead><tr><th>Di restoran</th><th>Di aplikasi</th><th>Nama teknisnya</th></tr></thead><tbody><tr><td>Kamu (tamu)</td><td>Aplikasi di HP-mu</td><td><b>Klien (client)</b></td></tr><tr><td>Pelayan</td><td>Perantara pesanan</td><td><b>API</b></td></tr><tr><td>Dapur</td><td>Komputer penyimpan &amp; pengolah data</td><td><b>Server</b></td></tr><tr><td>Menu</td><td>Daftar yang boleh kamu minta</td><td><b>Dokumentasi API</b></td></tr><tr><td>Pesanan</td><td>Permintaan yang dikirim</td><td><b>Request</b></td></tr><tr><td>Makanan datang</td><td>Jawaban dari server</td><td><b>Response</b></td></tr></tbody></table><p>Kuncinya satu: <b>kamu tidak pernah masuk dapur</b>. Kamu hanya bicara lewat pelayan yang sudah disepakati caranya.</p>'
    },
    {
      type: 'text',
      html: '<h3>Jadi, apa itu API?</h3><p><b>API</b> adalah kependekan dari <i>Application Programming Interface</i> — kalau diterjemahkan bebas: <b>antarmuka resmi agar dua program bisa saling bicara</b>.</p><blockquote style="border-left:3px solid var(--accent);padding-left:12px;margin:12px 0"><b>API = perantara resmi.</b> Ia menentukan apa yang boleh diminta, bagaimana cara memintanya, dan bentuk jawabannya.</blockquote><p>Dua program yang bicara lewat API tidak perlu tahu isi "dapur" masing-masing. Mereka cukup sepakat pada aturan main di perantara itu. Itulah gunanya: <b>aturan yang disepakati bersama membuat semuanya bisa bekerja sama</b>.</p>'
    },
    {
      type: 'example',
      title: 'Contoh nyata: cek cuaca di HP-mu',
      lang: 'text',
      output: false,
      code: `Aplikasi cuaca (klien)
   │  1. request: "cuaca Jakarta hari ini?"
   ▼
API penyedia cuaca (perantara)
   │  2. meneruskan ke server data cuaca
   ▼
Server penyedia cuaca
   │  3. membalas: {"city":"Jakarta","temp":31,"cond":"Cerah"}
   ▼
Aplikasi cuaca menampilkan "Jakarta 31°C, Cerah"`,
      explain: [
        'Yang kamu lihat hanya langkah terakhir: tampilan di layar. Langkah 1–3 terjadi dalam sekejap.',
        'Bentuk jawabannya <b>data</b> (JSON), bukan halaman web yang dihias — ini ciri khas API.',
        'Contoh lain yang sama: login pakai Google, bayar e-wallet, notifikasi pesanan ojek online.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Bedanya website dengan API</h3><p>Dua hal ini sering tertukar padahal mendasar:</p><table><thead><tr><th></th><th>Website</th><th>API</th></tr></thead><tbody><tr><td><b>Dibuat untuk</b></td><td>Manusia (mata)</td><td>Program (kode)</td></tr><tr><td><b>Jawabannya</b></td><td>Halaman HTML yang dihias</td><td>Data terstruktur (biasanya JSON)</td></tr><tr><td><b>Cara pakai</b></td><td>Klik di browser</td><td>Dipanggil dari kode program</td></tr></tbody></table><p>Satu server bisa melayani keduanya: website untuk kamu buka di browser, API untuk dipakai aplikasi mobile — <b>makanan dari dapur yang sama, disajikan beda cara</b>.</p><p>Lalu kenapa repot membuat API? Karena <b>sekali dibuat, banyak yang bisa memakai</b>: aplikasi Android, iPhone, website, smartwatch, sampai sistem milik perusahaan lain. Tanpa API, tiap aplikasi harus mengurus semuanya sendiri dari nol.</p>'
    },
    {
      type: 'live',
      title: 'Coba sendiri: melihat simulasi request–response',
      lang: 'html',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: system-ui, sans-serif; font-size: 14px; margin: 12px; }
  button { padding: 8px 14px; border: 0; border-radius: 6px; background: #2563eb; color: #fff; font-weight: 700; cursor: pointer; }
  pre { background: #0f172a; color: #e2e8f0; padding: 10px; border-radius: 8px; margin-top: 10px; white-space: pre-wrap; }
</style>
</head>
<body>
<p>Tekan tombol untuk mensimulasikan satu percakapan klien → server:</p>
<button id="btn">Kirim request GET /products/1</button>
<pre id="out">Belum ada request.</pre>
<script>
  const products = [
    { id: 1, name: 'Laptop Gaming', price: 15000000 },
    { id: 2, name: 'Mouse Wireless', price: 250000 },
    { id: 3, name: 'Keyboard Mekanik', price: 750000 }
  ];
  document.getElementById('btn').onclick = function () {
    const out = document.getElementById('out');
    out.textContent = '1. klien  → request : GET /products/1\\n2. server → memproses...';
    setTimeout(function () {
      const p = products[0];
      out.textContent += '\\n3. server → response: 200 OK';
      out.textContent += '\\n\\n' + JSON.stringify(p, null, 2);
      out.textContent += '\\n\\n(klik lagi untuk memanggil ulang — hasilnya sama, tidak ada data yang berubah)';
    }, 500);
  };
</script>
</body>
</html>`,
      hint: 'Tekan tombolnya, perhatikan ada 3 langkah: request, proses, response.'
    },
    {
      type: 'tip',
      title: 'Ingat: API bukan hanya untuk web',
      text: 'Ketika kamu memakai <b>smartwatch</b> yang sinkron ke HP, atau <b>mobil</b> yang memanggil server pabrikan, itu juga API. API = cara program bertukar data, di perangkat apa pun.'
    },
    {
      type: 'warn',
      title: 'Jangan tertukar: API bukan bahasa pemrograman',
      text: 'API bukan bahasa (bukan Python/JavaScript), bukan framework, dan bukan aplikasi. API hanyalah <b>aturan main</b> agar dua program bisa saling bertukar data. Bahasa pemrograman dipakai untuk <i>membuat</i> atau <i>memakai</i> API.'
    },
    {
      type: 'vocab',
      items: [
        ['API', 'Perantara resmi agar dua program bisa saling bertukar data.'],
        ['Klien (client)', 'Program yang mengirim permintaan, misalnya aplikasi di HP-mu.'],
        ['Server', 'Program yang menyimpan data dan menjawab permintaan.'],
        ['Request', 'Permintaan yang dikirim klien ke server.'],
        ['Response', 'Jawaban yang dikirim server ke klien.'],
        ['Endpoint', 'Alamat untuk memanggil API — dibahas tuntas di pelajaran URL & Endpoint.'],
        ['Dokumentasi API', 'Daftar aturan main: apa saja yang boleh diminta dan bagaimana caranya.']
      ]
    }
  ],
  recap: [
    '<b>API = perantara resmi</b> agar dua program bisa saling bicara dengan aturan yang sudah disepakati.',
    'Analoginya <b>pelayan restoran</b>: kamu (klien) tidak pernah masuk dapur (server).',
    '<b>Website</b> disajikan untuk manusia, <b>API</b> disajikan untuk program — biasanya dalam bentuk JSON.',
    'Ada API membuat satu layanan bisa dipakai banyak jenis aplikasi sekaligus.',
    'Aktivitas digital harianmu (cek cuaca, bayar, login, notifikasi) berjalan lewat API.'
  ]
});
