/* ============================================================
   Pelajaran Dasar RESTful API — Bab 6: Mengenal JSON
   ============================================================ */
'use strict';

window.RESTFULAPI_LESSONS = window.RESTFULAPI_LESSONS || [];

window.RESTFULAPI_LESSONS.push({
  id: 'mengenal-json',
  title: 'Mengenal JSON: Bahasa Data Web',
  chapter: 'HTTP Dasar',
  duration: '10 menit',
  intro: [
    'Setiap kali kamu buka halaman produk di Tokopedia atau lacak pesanan GoFood, HP-mu menerima <b>tumpukan teks berisi data</b> dari server. Teks itulah yang disebut <b>JSON</b> — format data paling populer di dunia API.',
    'Pelajaran ini mengajakmu membaca dan menulis JSON dari nol. Kamu akan belajar struktur dasarnya, aturan tanda kutip dan koma, cara membaca JSON yang bersarang, serta alat kecil untuk berlatih langsung di halaman ini.'
  ],
  objectives: [
    'Menjelaskan apa itu JSON dan fungsinya di dalam API',
    'Membedakan objek dan array dalam sebuah JSON',
    'Menulis JSON valid lengkap dengan aturan kutip dan koma',
    'Membaca JSON bersarang secara bertingkat'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Apa itu JSON?</h3><p>Bayangkan rak toko. Tiap barang punya <b>label</b> dan <b>nilai</b>: label "harga", nilainya 349000; label "nama", nilainya "Sepatu Lari". JSON menyimpan data dengan cara yang sama.</p><p><b>JSON</b> (<i>JavaScript Object Notation</i>) adalah format data ringan yang mudah dibaca manusia <b>dan</b> mesin. Isinya cuma dua bentuk:</p><table><thead><tr><th>Bentuk</th><th>Tanda</th><th>Fungsi</th><th>Analogi</th></tr></thead><tbody><tr><td><b>Objek</b></td><td><code>{ }</code></td><td>Kumpulan pasangan "kunci": nilai</td><td>Formulir yang punya banyak kolom</td></tr><tr><td><b>Array</b></td><td><code>[ ]</code></td><td>Daftar nilai berurutan</td><td>Daftar belanja di secarik kertas</td></tr></tbody></table><p>Di dalam objek, tiap data ditulis sebagai pasangan: <code>"kunci": nilai</code>. Kunci adalah nama kolomnya, nilai adalah isinya.</p>'
    },
    {
      type: 'text',
      html: '<h3>Aturan kecil yang wajib dipatuhi</h3><p>JSON lebih "galak" daripada bahasa JavaScript. Sedikit saja salah, mesin langsung menolak membacanya:</p><ul><li>Kunci <b>wajib</b> pakai tanda kutip ganda: <code>"nama"</code>, bukan <code>nama</code>.</li><li>Nilai berupa teks juga wajib kutip ganda: <code>"Sepatu Lari"</code>.</li><li>Angka, <code>true</code>, <code>false</code>, dan <code>null</code> ditulis tanpa kutip.</li><li>Antar item dipisah koma, tapi <b>tanpa koma</b> setelah item terakhir.</li><li>JSON tidak boleh berisi komentar sama sekali.</li></ul><table><thead><tr><th>Salah</th><th>Benar</th></tr></thead><tbody><tr><td><code>{nama: "Sari"}</code></td><td><code>{"nama": "Sari"}</code></td></tr><tr><td><code>{"harga": 349000,}</code></td><td><code>{"harga": 349000}</code></td></tr><tr><td><code>{"a": 1; "b": 2}</code></td><td><code>{"a": 1, "b": 2}</code></td></tr><tr><td><code>{"stok": "7"}</code></td><td><code>{"stok": 7}</code> (angka, bukan teks)</td></tr></tbody></table><p>Kesalahan paling sering: koma tambahan di akhir objek dan kunci tanpa kutip. Hafalkan dua ini, 80% masalahmu selesai.</p>'
    },
    {
      type: 'example',
      title: 'Contoh response JSON: satu produk di toko online',
      lang: 'json',
      output: false,
      code: `{
  "id": 42,
  "nama": "Sepatu Lari Pria",
  "harga": 349000,
  "diskon": 15,
  "tersedia": true,
  "kategori": ["sepatu", "olahraga"],
  "penjual": {
    "nama": "Toko Sport ID",
    "kota": "Bandung"
  }
}`,
      explain: [
        'Setiap baris adalah satu pasangan <code>"kunci": nilai</code>, dipisang koma.',
        'Nilainya bermacam tipe: teks berkutip (<code>"nama"</code>), angka (<code>"harga"</code>), benar/salah (<code>"tersedia"</code>), daftar (<code>"kategori"</code>), dan objek (<code>"penjual"</code>).',
        'Bentuk inilah yang biasanya dikirim server saat kamu menekan tombol "lihat detail produk".'
      ]
    },
    {
      type: 'text',
      html: '<h3>JSON bersarang: cara membacanya bertingkat</h3><p>Objek boleh berisi objek, dan array boleh berisi objek. Ini disebut JSON <b>bersarang</b>. Analoginya laci bertingkat: buka laci utama, di dalamnya ada laci kecil lagi.</p><p>Cara membacanya satu tingkat demi satu tingkat, dari luar ke dalam:</p><ul><li>Tingkat 1: objek utama — ada kunci <code>id</code>, <code>nama</code>, <code>penjual</code>.</li><li>Tingkat 2: buka <code>penjual</code> → ada <code>nama</code> dan <code>kota</code>.</li><li>Tingkat 2 juga: buka <code>kategori</code> → ada daftar <code>"sepatu"</code>, <code>"olahraga"</code>.</li></ul><blockquote style="border-left:3px solid var(--accent);padding-left:12px;margin:12px 0"><b>Tips membaca:</b> jangan buru-buru. Sebut dulu "ini objek utama", lalu tunjuk satu kunci, baru buka isinya.</blockquote>'
    },
    {
      type: 'example',
      title: 'Contoh bersarang: status pesanan ojek online',
      lang: 'json',
      output: false,
      code: `{
  "id_pesanan": "GF-9081",
  "status": "diantar",
  "resto": {
    "nama": "Warung Sate Pak Kumis",
    "kota": "Depok"
  },
  "menu": [
    { "nama": "Sate Ayam", "jumlah": 2, "harga": 25000 },
    { "nama": "Es Teh",    "jumlah": 1, "harga": 5000 }
  ],
  "total": 55000,
  "dibayar_e_wallet": true
}`,
      explain: [
        'Kunci <code>menu</code> adalah array yang isinya objek — satu objek per menu yang kamu pesan.',
        'Jalur membaca menu pertama: buka <code>menu</code> → ambil yang pertama → ambil <code>nama</code>. Hasilnya "Sate Ayam".',
        'Makin banyak tingkat, makin teliti kamu membacanya. Tapi polanya selalu sama: buka satu lapis, lanjut ke dalam.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Kenapa hampir semua API modern memakai JSON?</h3><p>Tiga alasan utama:</p><ul><li><b>Ringan.</b> Tanda baca JSON hanya kurung dan kutip. Hemat kuota dan cepat dikirim.</li><li><b>Seragam.</b> Hampir semua bahasa pemrograman punya cara mudah mengubah JSON menjadi data lokalnya — dan sebaliknya.</li><li><b>Manusia masih bisa membacanya.</b> Saat debugging, kamu bisa lihat isinya langsung tanpa alat khusus.</li></ul><p>Pendahulunya adalah <b>XML</b>: format yang mirip tapi memakai tag berpasangan seperti <code>&lt;nama&gt;Sari&lt;/nama&gt;</code>. XML lebih tebal dan lebih ribet ditulis. Kini XML masih dipakai sistem lama di perbankan atau layanan pemerintah, tapi API baru mayoritas memakai JSON.</p>'
    },
    {
      type: 'live',
      title: 'Coba sendiri: alat validasi & penampil JSON',
      lang: 'html',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Alat Validasi JSON</title>
<style>
  body { font-family: system-ui, sans-serif; font-size: 14px; margin: 12px; color: #0f172a; }
  h3 { margin: 0 0 8px; }
  textarea { width: 100%; min-height: 130px; box-sizing: border-box; font-family: ui-monospace, monospace; font-size: 13px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; }
  .baris { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin: 10px 0; }
  input, select { padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; }
  button { padding: 8px 14px; border: 0; border-radius: 6px; background: #2563eb; color: #fff; font-weight: 700; cursor: pointer; }
  button.alt { background: #0f766e; }
  #status { font-weight: 700; margin: 6px 0; }
  pre { background: #0f172a; color: #e2e8f0; padding: 10px; border-radius: 8px; white-space: pre-wrap; }
</style>
</head>
<body>
<h3>Alat Validasi JSON</h3>
<p>Tempel JSON di kotak bawah, lalu tekan tombol.</p>
<textarea id="json">{
  "id": 42,
  "nama": "Sepatu Lari Pria",
  "kategori": ["sepatu", "olahraga"]
}</textarea>
<div class="baris">
  <button id="validasi">Validasi &amp; tampilkan</button>
  <input type="text" id="kunci" placeholder="kunci baru (mis. stok)">
  <input type="text" id="nilai" placeholder="nilai (mis. 7)">
  <select id="tipe">
    <option value="teks">teks</option>
    <option value="angka">angka</option>
    <option value="benar">benar/salah</option>
  </select>
  <button id="tambah" class="alt">Tambah data &amp; tulis ulang</button>
</div>
<p id="status">Belum diperiksa.</p>
<pre id="out">—</pre>
<script>
  var ta = document.getElementById('json');
  var statusEl = document.getElementById('status');
  var out = document.getElementById('out');
  function baca() {
    try {
      return { ok: true, data: JSON.parse(ta.value) };
    } catch (e) {
      return { ok: false, pesan: e.message };
    }
  }
  document.getElementById('validasi').onclick = function () {
    var hasil = baca();
    if (!hasil.ok) {
      statusEl.textContent = 'JSON tidak valid: ' + hasil.pesan;
      statusEl.style.color = '#dc2626';
      out.textContent = 'Perbaiki dulu kotaknya, lalu coba lagi.';
      return;
    }
    statusEl.textContent = 'JSON valid! Berhasil dibaca mesin.';
    statusEl.style.color = '#16a34a';
    out.textContent = JSON.stringify(hasil.data, null, 2);
  };
  document.getElementById('tambah').onclick = function () {
    var hasil = baca();
    if (!hasil.ok) {
      statusEl.textContent = 'JSON tidak valid: ' + hasil.pesan;
      statusEl.style.color = '#dc2626';
      return;
    }
    var data = hasil.data;
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      statusEl.textContent = 'Tambah data hanya bisa untuk objek {...}.';
      statusEl.style.color = '#dc2626';
      return;
    }
    var kunci = document.getElementById('kunci').value.trim();
    if (!kunci) {
      statusEl.textContent = 'Isi dulu kolom kunci baru.';
      statusEl.style.color = '#dc2626';
      return;
    }
    var nilai = document.getElementById('nilai').value;
    var tipe = document.getElementById('tipe').value;
    if (tipe === 'angka') { nilai = Number(nilai); }
    if (tipe === 'benar') { nilai = (nilai === 'true'); }
    data[kunci] = nilai;
    ta.value = JSON.stringify(data, null, 2);
    statusEl.textContent = 'Data baru masuk, JSON ditulis ulang dengan rapi.';
    statusEl.style.color = '#16a34a';
    out.textContent = ta.value;
  };
</script>
</body>
</html>`,
      hint: 'Validasi JSON bawaan, lalu ubah salah satu tanda kutip jadi kutip tunggal dan validasi lagi — lihat bedanya. Setelah itu coba tambah data baru lewat kolom di bawah tombol.'
    },
    {
      type: 'tip',
      title: 'Rapikan JSON dengan mudah',
      text: 'JSON yang dikirim server sering tampil sebagai satu baris panjang. Kamu bisa merapikannya dengan menempelnya ke kotak di atas, atau memakai <code>JSON.stringify(data, null, 2)</code> di console browser. Angka <code>2</code> berarti "spasi dua per tingkat".'
    },
    {
      type: 'warn',
      title: 'Satu koma nyasar bisa bikin semuanya gagal',
      text: 'Mesin berhenti membaca begitu menemukan kesalahan kecil: koma di akhir objek, kunci tanpa kutip, atau komentar di dalam JSON. Kalau API-mu tiba-tiba "tidak terbaca", periksa bagian itu lebih dulu sebelum menyalahkan koneksi.'
    },
    {
      type: 'vocab',
      items: [
        ['JSON', 'Format data ringan yang mudah dibaca manusia dan mesin; bahasa data web.'],
        ['Objek <code>{ }</code>', 'Kumpulan pasangan "kunci": nilai — seperti formulir berisi kolom.'],
        ['Array <code>[ ]</code>', 'Daftar nilai berurutan, misalnya daftar kategori produk.'],
        ['Kunci', 'Nama penanda sebuah data; selalu ditulis dengan tanda kutip ganda.'],
        ['Nilai', 'Isi sebuah kunci: teks, angka, true/false, array, atau objek.'],
        ['Bersarang', 'Objek atau array yang di dalamnya berisi objek/array lain.'],
        ['Parsing', 'Mengubah teks JSON menjadi data yang bisa langsung dipakai program.']
      ]
    }
  ],
  recap: [
    '<b>JSON = format data ringan</b> yang mudah dibaca manusia sekaligus mesin.',
    'Isinya hanya dua bentuk: <b>objek <code>{}</code></b> untuk kumpulan kunci-nilai, <b>array <code>[]</code></b> untuk daftar.',
    'Kunci dan nilai teks wajib tanda kutip ganda; koma dipakai sebagai pemisah tanpa koma di akhir.',
    'JSON boleh bersarang — baca bertingkat, dari luar ke dalam.',
    'API modern memakai JSON karena ringan, seragam, dan tetap enak dibaca manusia.'
  ]
});
