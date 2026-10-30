/* ============================================================
   Pelajaran Dasar RESTful API — Bab 8: HTTP Headers
   ============================================================ */
'use strict';

window.RESTFULAPI_LESSONS = window.RESTFULAPI_LESSONS || [];

window.RESTFULAPI_LESSONS.push({
  id: 'http-headers',
  title: 'HTTP Headers: Instruksi di Balik Amplop',
  chapter: 'HTTP Dasar',
  duration: '10 menit',
  intro: [
    'Saat kamu mengirim surat, kamu menulis keterangan di amplop: "isi dokumen asli", "jangan dibalik", "prioritas". HTTP melakukan hal serupa lewat yang disebut <b>header</b>.',
    'Header adalah informasi tambahan di luar body request. Pelajaran ini mengenalkan lima header yang paling sering muncul di kehidupan sehari-hari API, plus cara melihatnya langsung di browser atau Postman.'
  ],
  objectives: [
    'Menjelaskan apa itu header dan posisinya dalam request',
    'Membedakan peran Content-Type dan Accept',
    'Memakai Authorization untuk membawa bukti login',
    'Melihat header nyata lewat DevTools atau Postman'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Apa itu header?</h3><p>Setiap request HTTP punya dua bagian utama: <b>body</b> (isi data) dan <b>header</b> (keterangan tambahan di luarnya). Analoginya amplop: body = isi surat, header = catatan yang kamu tulis di permukaan amplop.</p><p>Header ditulis dalam bentuk pasangan nama dan nilai, dipisah titik dua:</p><p><code>Content-Type: application/json</code></p><p>Baik request <b>maupun</b> response sama-sama punya header. Server membaca header request untuk tahu maksudmu; kamu membaca header response untuk tahu bentuk jawaban yang dikirim.</p><blockquote style="border-left:3px solid var(--accent);padding-left:12px;margin:12px 0">Aturan baca: <b>baca dulu angka status, baru header, baru body.</b> Angka memberi kesimpulan singkat, header memberi rincian, body memberi isi lengkap.</blockquote>'
    },
    {
      type: 'text',
      html: '<h3>Content-Type &amp; Accept: kirim format apa, tampilkan format apa</h3><p>Dua header ini sepasang. Keduanya bicara soal bentuk isi data, bukan isi datanya sendiri.</p><table><thead><tr><th>Header</th><th>Pertanyaannya</th><th>Contoh nilai</th></tr></thead><tbody><tr><td><b>Content-Type</b></td><td>Isi yang <b>kubirim</b> berbentuk apa?</td><td><code>application/json</code></td></tr><tr><td><b>Accept</b></td><td>Isi yang <b>kumau</b> berbentuk apa?</td><td><code>application/json</code></td></tr></tbody></table><p>Analoginya surat berbahasa asing: di amplop kamu tulis "isi: surat berbahasa Indonesia", lalu kamu tambahkan "mohon balas pakai bahasa Indonesia". Server yang membaca <code>Content-Type</code> tahu cara menguraikan body-mu. Server yang membaca <code>Accept</code> tahu bentuk jawaban yang kamu suka.</p><p>Kalau kamu kirim body JSON tapi lupa menulis <code>Content-Type: application/json</code>, banyak server akan menjawab <code>400 Bad Request</code> — bukan karena datanya salah, tapi karena "amplopnya" tidak menjelaskan isinya.</p>'
    },
    {
      type: 'text',
      html: '<h3>Authorization &amp; User-Agent: aku siapa</h3><p><b>Authorization</b> membawa bukti bahwa kamu sudah login. Bentuk yang paling umum:</p><p><code>Authorization: Bearer &lt;token&gt;</code></p><p>Pola ini mirip kartu anggota: kamu menunjukkan kartu di tiap kunjungan, satpam cukup membacanya. Token itu kamu dapatkan setelah login berhasil, lalu dipakai di request berikutnya ke halaman yang butuh izin.</p><p><b>User-Agent</b> menyebut siapa pengirimnya: nama aplikasi dan versinya. Contohnya <code>TokoKu/3.2 (Android)</code>. Server memakainya untuk tahu kamu membuka dari aplikasi HP, iPhone, atau browser — persis seperti nama pengirim yang tercetak di surat.</p>'
    },
    {
      type: 'text',
      html: '<h3>Cache-Control &amp; cara melihat header</h3><p><b>Cache-Control</b> (kendali simpan-simpan) mengatur apakah jawaban boleh disinggung sementara. Nilai <code>no-store</code> berarti "jangan simpan salinan sama sekali" — tepat untuk data login atau saldo e-wallet. Nilai lain mengizinkan penyimpanan singkat agar langkah berikutnya lebih cepat.</p><p>Cara melihat header sungguhan:</p><ul><li><b>Browser:</b> tekan <code>F12</code> → tab <b>Network</b> → buka satu situs → klik request pertama → lihat bagian <b>Request Headers</b> dan <b>Response Headers</b>.</li><li><b>Postman:</b> isi method dan URL → buka tab <b>Headers</b> untuk menambah header; hasilnya ada di panel <b>Headers</b> di bawah response.</li></ul>'
    },
    {
      type: 'example',
      title: 'Contoh lengkap: request login dengan header',
      lang: 'text',
      output: false,
      code: `POST /api/v1/login HTTP/1.1
Host: api.toko-contoh.com
Content-Type: application/json
Accept: application/json
User-Agent: TokoKu/3.2 (Android)
Cache-Control: no-store

{
  "email": "sari@contoh.com",
  "password": "rahasia123"
}`,
      explain: [
        'Header berada di atas, lalu dipisahkan dari body oleh <b>satu baris kosong</b> — aturan baku HTTP.',
        '<code>Content-Type: application/json</code> menjelaskan isi body; <code>Accept</code> meminta balasan berupa JSON juga.',
        '<code>Cache-Control: no-store</code> dipakai karena data login tidak boleh disimpan pihak mana pun.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh response dari server',
      lang: 'text',
      output: false,
      code: `HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "pesan": "login berhasil",
  "token": "eyJhbGciOiJIUzI1NiJ9.abc123"
}`,
      explain: [
        'Response juga dibuka dengan status, lalu header, lalu body — pola yang sama seperti request.',
        '<code>Content-Type: application/json</code> memberi tahu kamu: body di bawah ini berupa JSON.',
        'Token hasil login itulah yang nanti kamu kirim di request berikutnya lewat header <code>Authorization: Bearer ...</code>.'
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: pembangun header request',
      lang: 'html',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Pembangun Header Request</title>
<style>
  body { font-family: system-ui, sans-serif; font-size: 14px; margin: 12px; color: #0f172a; }
  h3 { margin: 0 0 8px; }
  .baris { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 10px; }
  input, select { padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; }
  button { padding: 8px 14px; border: 0; border-radius: 6px; background: #2563eb; color: #fff; font-weight: 700; cursor: pointer; }
  pre { background: #0f172a; color: #e2e8f0; padding: 10px; border-radius: 8px; white-space: pre-wrap; }
  #fungsi { padding-left: 18px; line-height: 1.6; }
  #fungsi b { color: #2563eb; }
</style>
</head>
<body>
<h3>Pembangun Header Request</h3>
<p>Isi keterangan "amplop"-mu, lalu tekan tombol:</p>
<div class="baris">
  <input type="text" id="app" placeholder="Nama aplikasi (mis. TokoKu)">
  <select id="tujuan">
    <option value="GET">Baca data (GET)</option>
    <option value="POST">Buat data baru (POST)</option>
    <option value="PUT">Ubah data (PUT)</option>
    <option value="DELETE">Hapus data (DELETE)</option>
  </select>
  <input type="text" id="token" placeholder="Token (opsional)">
  <select id="format">
    <option value="json">Mau jawaban JSON</option>
    <option value="teks">Mau jawaban teks biasa</option>
  </select>
</div>
<button id="bangun">Bangun header</button>
<pre id="out">Belum dibuat.</pre>
<ul id="fungsi"></ul>
<script>
  document.getElementById('bangun').onclick = function () {
    var app = document.getElementById('app').value.trim() || 'AplikasiKu/1.0';
    var tujuan = document.getElementById('tujuan').value;
    var token = document.getElementById('token').value.trim();
    var format = document.getElementById('format').value;
    var kirimJson = (tujuan === 'POST' || tujuan === 'PUT');
    var baris = [];
    var fungsi = [];
    if (kirimJson) {
      baris.push('Content-Type: application/json');
      fungsi.push('Content-Type — kabar untuk server: isi yang kubirim berupa JSON.');
    }
    var diterima = (format === 'json') ? 'application/json' : 'text/plain';
    baris.push('Accept: ' + diterima);
    fungsi.push('Accept — permintaanku: tolong balaskan dalam format itu.');
    if (token) {
      baris.push('Authorization: Bearer ' + token);
      fungsi.push('Authorization — buktiku: aku sudah login, ini token-ku.');
    }
    baris.push('User-Agent: ' + app);
    fungsi.push('User-Agent — nama pengirim, agar server tahu aplikasi apa yang memanggil.');
    baris.push('Cache-Control: no-store');
    fungsi.push('Cache-Control — perintah: jangan simpan salinan data ini.');
    var teks = tujuan + ' /api/v1/... HTTP/1.1';
    if (baris.length) { teks += '\\n' + baris.join('\\n'); }
    if (kirimJson) { teks += '\\n\\n{ ...body JSON... }'; }
    document.getElementById('out').textContent = teks;
    var ul = document.getElementById('fungsi');
    ul.innerHTML = '';
    fungsi.forEach(function (f) {
      var li = document.createElement('li');
      var potong = f.split(' — ');
      li.innerHTML = '<b>' + potong[0] + '</b> — ' + potong[1];
      ul.appendChild(li);
    });
  };
</script>
</body>
</html>`,
      hint: 'Coba pilih "Buat data baru (POST)" tanpa token — lihat Content-Type muncul. Lalu isi kolom token dan tekan tombol lagi untuk melihat Authorization ikut masuk.'
    },
    {
      type: 'tip',
      title: 'Latihan 10 detik: buka DevTools sekarang',
      text: 'Buka situs favoritmu, tekan <b>F12</b> → tab <b>Network</b> → muat ulang halaman → klik request pertama. Lihat daftar header asli: <code>User-Agent</code>, <code>Accept</code>, <code>Content-Type</code>. Membaca header sungguhan jauh lebih menempel daripada menghafalnya.'
    },
    {
      type: 'warn',
      title: 'Token Authorization adalah KTP digitalmu',
      text: 'Siapa pun yang memiliki token-mu bisa berpura-pura jadi kamu. Jangan tempel token di URL, jangan kirim lewat koneksi <code>http://</code> (tanpa s), dan jangan tampilkan di layar publik. Kalau token bocor, segera login ulang agar token lama dibatalkan.'
    },
    {
      type: 'vocab',
      items: [
        ['Header', 'Keterangan tambahan pada request atau response, ditulis di luar body.'],
        ['Content-Type', 'Header yang menjelaskan bentuk isi yang kamu kirim, mis. application/json.'],
        ['Accept', 'Header yang menyebut bentuk jawaban yang kamu minta dari server.'],
        ['Authorization', 'Header pembawa bukti login, biasanya berupa token.'],
        ['Bearer token', 'Kartu anggota digital: siapa yang membawanya dianggap pemilik akunnya.'],
        ['User-Agent', 'Header berisi nama dan versi aplikasi pengirim request.'],
        ['Cache-Control', 'Header pengatur apakah jawaban server boleh disimpan sementara.']
      ]
    }
  ],
  recap: [
    '<b>Header = keterangan tambahan</b> di luar body, ibarat tulisan pada permukaan amplop.',
    '<b>Content-Type</b> menjelaskan isi yang kamu kirim; <b>Accept</b> menjelaskan bentuk jawaban yang kamu mau.',
    '<b>Authorization</b> membawa bukti login (token); <b>User-Agent</b> menyebut aplikasi pengirim.',
    '<b>Cache-Control</b> mengatur apakah jawaban boleh disimpan sementara.',
    'Kamu bisa melihat header sungguhan lewat DevTools (tab Network) atau Postman kapan saja.'
  ]
});
