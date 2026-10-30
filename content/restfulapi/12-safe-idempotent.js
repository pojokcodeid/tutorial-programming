/* ============================================================
   Pelajaran Dasar RESTful API — Bab 12: Safe & Idempotent
   ============================================================ */
'use strict';

window.RESTFULAPI_LESSONS = window.RESTFULAPI_LESSONS || [];

window.RESTFULAPI_LESSONS.push({
  id: 'safe-idempotent',
  title: 'Safe, Idempotent, dan Kesalahan Desain yang Sering Terjadi',
  chapter: 'Konsep REST',
  duration: '10 menit',
  intro: [
    'Koneksi internet sering goyang di tengah jalan. Aplikasi biasanya mengirim ulang permintaan secara otomatis. Nah, kalau API-mu salah memakai method, pengguna bisa terlanjur membayar dua kali.',
    'Untuk menghindari bencana kecil semacam itu, HTTP memberi dua sifat penting pada tiap method: <b>safe</b> (tidak mengubah data) dan <b>idempotent</b> (diulang berkali, hasil akhirnya sama). Pelajaran ini membedah keduanya plus kesalahan desain yang paling sering terjadi.'
  ],
  objectives: [
    'Menjelaskan arti safe dan idempotent dengan bahasa sederhana',
    'Menyebutkan method yang termasuk safe dan yang termasuk idempotent',
    'Mendeskripsikan akibat mengulang POST, PUT, dan DELETE',
    'Mengenali kesalahan desain endpoint yang sering terjadi'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Safe: Tidak Mengubah Data</h3><p>Membaca papan pengumuman di stasiun tidak mengubah isi papan itu. Begitu juga <b>safe</b>: method yang hanya membaca, tanpa mengubah apa pun di server.</p><p>Method yang safe: <b>GET</b> (mengambil data), <b>HEAD</b> (GET tanpa isi, hanya keterangan), dan <b>OPTIONS</b> (bertanya method apa yang didukung server).</p><p>Karena tidak mengubah apa pun, method safe boleh dipanggil berkali-kali tanpa rasa takut. Kamu bisa memuat ulang halaman produk di Tokopedia sepuasnya — datanya tetap sama.</p>'
    },
    {
      type: 'text',
      html: '<h3>Idempotent: Diulang, Hasil Akhir Sama</h3><p>Bayangkan kamu menyetel alarm pagi ke pukul 06.00. Tombolnya ditekan sekali atau tiga kali, alarm tetap berbunyi pukul 06.00. Itulah <b>idempotent</b>.</p><p>Dalam HTTP, method idempotent adalah <b>GET</b>, <b>PUT</b>, dan <b>DELETE</b>. Pengulangan tidak merusak hasil akhir.</p><ul><li><b>PUT dua kali</b> dengan isi sama → data tetap sama. Seperti menyetel alarm: hasilnya tidak berubah lagi.</li><li><b>DELETE dua kali</b> → yang kedua menjawab "sudah tidak ada", tapi hasil akhir tetap: data terhapus.</li></ul><blockquote style="border-left:3px solid var(--accent);padding-left:12px;margin:12px 0"><b>Idempotent menyangkut hasil AKHIR, bukan jawaban yang sama persis.</b> DELETE pertama menjawab 204, kedua menjawab 404 — keduanya wajar, karena keadaan akhirnya tetap sama.</blockquote>'
    },
    {
      type: 'example',
      title: 'Mengamati pengulangan PUT dan DELETE',
      lang: 'text',
      output: false,
      code: `PUT /api/v1/products/12  body:{"price":460000}  → 200  harga jadi 460.000
PUT /api/v1/products/12  body:{"price":460000}  → 200  harga TETAP 460.000
PUT /api/v1/products/12  body:{"price":460000}  → 200  harga TETAP 460.000
   ⇒ hasil akhir selalu sama ✓ idempotent

DELETE /api/v1/products/12  → 204  produk terhapus
DELETE /api/v1/products/12  → 404  "produk sudah tidak ada"
DELETE /api/v1/products/12  → 404  "produk sudah tidak ada"
   ⇒ hasil akhir selalu "terhapus" ✓ idempotent`,
      explain: [
        'PUT pertama mengubah data; PUT berikutnya tidak mengubah apa pun karena isi yang dikirim sama.',
        'Jawaban DELETE kedua memang 404, tapi keadaan akhirnya tetap "terhapus". Karena itu DELETE tetap idempotent.',
        'Sifat ini membuat pengiriman ulang (retry) otomatis dari aplikasi menjadi aman.'
      ]
    },
    {
      type: 'text',
      html: '<h3>POST Tidak Idempotent</h3><p>POST ibarat menulis di buku tamu gedung. Menulis dua kali menghasilkan <b>dua catatan</b>, bukan satu. Begitu juga POST: mengulang berarti membuat data baru lagi.</p><p>Contohnya beli pulsa atau bayar lewat e-wallet. Kalau permintaan "bayar Rp 50.000" terkirim dua kali, pengguna bisa kena debit dua kali. Uang betulan hilang dua kali.</p><p>Maka POST harus diperlakukan hati-hati. Aplikasi yang baik tidak mengirim ulang POST begitu saja saat koneksi goyang. Server pun bisa memasang pengaman, misalnya kunci anti-dobel, supaya permintaan yang sama tidak diproses dua kali.</p>'
    },
    {
      type: 'example',
      title: 'POST dipanggil dua kali: dua pesanan muncul',
      lang: 'text',
      output: false,
      code: `POST /api/v1/orders  body:{"product":12,"qty":1}  → 201  pesanan #101 lahir
POST /api/v1/orders  body:{"product":12,"qty":1}  → 201  pesanan #102 lahir

Isi gudang pesanan sekarang:
  #101  produk 12  qty 1
  #102  produk 12  qty 1   ← dobel!

   ⇒ hasil akhir BERUBAH tiap kali dipanggil ✗ tidak idempotent`,
      explain: [
        'Kedua POST membalas 201 Created — memang berhasil, justru itulah masalahnya: dua pesanan tercatat.',
        'Bandingkan dengan PUT dan DELETE: pengulangan mereka tidak menambah data apa pun.',
        'Kalau koneksi internet tiba-tiba pulih dan aplikasi mengirim ulang, pengguna bisa memesan atau membayar dua kali.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Kesalahan Desain yang Sering Terjadi</h3><p>Empat kebiasaan buruk ini paling sering membuat API jadi membingungkan. Hindari sejak awal.</p><table><thead><tr><th>Kesalahan</th><th>Contoh yang salah</th><th>Masalahnya</th></tr></thead><tbody><tr><td>GET dipakai menghapus</td><td><code>GET /products/12/delete</code></td><td>Browser atau mesin pencari bisa memicunya tanpa sengaja.</td></tr><tr><td>POST dipakai membaca</td><td><code>POST /products/search</code></td><td>Tidak perlu; membaca cukup GET.</td></tr><tr><td>Semua balasan 200 OK</td><td>galat pun dibalas 200</td><td>Pemanggil tidak bisa membedakan sukses dan gagal.</td></tr><tr><td>ID disimpan di body</td><td><code>POST /orders</code> + <code>{"id":12}</code> di body</td><td>ID yang dituju seharusnya ada di path: <code>/orders/12</code>.</td></tr></tbody></table><p>Metode yang tepat membuat API mudah diprediksi. Pemanggil tahu: GET tidak mengubah apa pun, PUT dan DELETE aman diulang, POST berarti membuat sesuatu.</p>'
    },
    {
      type: 'live',
      title: 'Latihan: simulator safe &amp; idempotent',
      lang: 'html',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Simulator Safe &amp; Idempotent</title>
<style>
  body { font-family: system-ui, sans-serif; font-size: 14px; margin: 12px; color: #1f2937; }
  h2 { margin: 0 0 4px; font-size: 17px; color: #2563eb; }
  .ket { color: #6b7280; font-size: 13px; margin-bottom: 12px; }
  .kontrol { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
  .kontrol button { border: 0; border-radius: 8px; padding: 9px 13px; color: #fff; font-weight: 700; cursor: pointer; font-family: monospace; font-size: 13px; }
  .b-get { background: #16a34a; } .b-put { background: #d97706; }
  .b-post { background: #2563eb; } .b-del { background: #dc2626; }
  .kontrol button.abu { background: #6b7280; font-family: system-ui, sans-serif; font-weight: 600; }
  .baris { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
  .kartu { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; flex: 1; min-width: 240px; font-size: 13px; }
  .kartu h4 { margin: 0 0 6px; font-size: 12px; color: #6b7280; text-transform: uppercase; }
  pre { background: #0f172a; color: #e2e8f0; padding: 10px; border-radius: 8px; margin: 0; white-space: pre-wrap; font-size: 12.5px; }
  .versi { font-weight: 700; color: #2563eb; }
  .tabel-wrap { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; overflow-x: auto; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  th, td { text-align: left; padding: 7px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  th { background: #f8fafc; color: #6b7280; font-weight: 600; }
  .mono { font-family: monospace; white-space: nowrap; }
  .ya { color: #dc2626; font-weight: 700; }
  .tidak { color: #16a34a; font-weight: 700; }
</style>
</head>
<body>
<h2>Simulator Safe &amp; Idempotent</h2>
<div class="ket">Tekan tombol method berkali-kali. Kolom "Versi hasil akhir" menandai keadaan data: kalau angkanya tidak naik, hasil akhir tetap sama. PUT selalu mengirim body yang sama; DELETE menarget produk id 12.</div>

<div class="kontrol">
  <button class="b-get" id="btnGet">GET /products/12</button>
  <button class="b-put" id="btnPut">PUT /products/12</button>
  <button class="b-post" id="btnPost">POST /orders</button>
  <button class="b-del" id="btnDel">DELETE /products/12</button>
  <button class="abu" id="btnReset">Reset</button>
</div>

<div class="baris">
  <div class="kartu"><h4>Isi produk id 12</h4><pre id="produk"></pre></div>
  <div class="kartu"><h4>Pesanan tercatat</h4><pre id="orders"></pre></div>
  <div class="kartu"><h4>Ringkasan</h4>
    Versi hasil akhir: <span class="versi" id="versi">v1</span><br>
    GET ×<span id="hGet">0</span> · PUT ×<span id="hPut">0</span><br>
    POST ×<span id="hPost">0</span> · DELETE ×<span id="hDel">0</span>
  </div>
</div>

<div class="tabel-wrap">
  <table>
    <thead>
      <tr><th>#</th><th>Method</th><th>Status</th><th>Versi hasil akhir</th><th>Berubah?</th><th>Keterangan</th></tr>
    </thead>
    <tbody id="log"></tbody>
  </table>
</div>

<script>
  var produk = { id: 12, name: 'Sepatu Lari', price: 450000 };
  var adaProduk = true;
  var pesanan = [];
  var versi = 1;
  var urut = 0;
  var hitung = { GET: 0, PUT: 0, POST: 0, DELETE: 0 };

  function sidik() {
    return JSON.stringify({ produk: adaProduk ? produk : null, pesanan: pesanan });
  }

  function $(x) { return document.getElementById(x); }

  function segarkan() {
    $('produk').textContent = adaProduk ? JSON.stringify(produk, null, 2) : '(terhapus — 404)';
    $('orders').textContent = pesanan.length ? JSON.stringify(pesanan, null, 2) : '(belum ada)';
    $('versi').textContent = 'v' + versi;
    $('hGet').textContent = hitung.GET;
    $('hPut').textContent = hitung.PUT;
    $('hPost').textContent = hitung.POST;
    $('hDel').textContent = hitung.DELETE;
  }

  function baris(method, status, berubah, ket) {
    urut++;
    var tb = $('log');
    var tr = document.createElement('tr');
    function td(isi, kelas) {
      var c = document.createElement('td');
      if (kelas) c.className = kelas;
      c.textContent = isi;
      return c;
    }
    tr.appendChild(td(urut));
    tr.appendChild(td(method, 'mono'));
    tr.appendChild(td(status, 'mono'));
    tr.appendChild(td('v' + versi, 'mono'));
    var b = td(berubah ? 'Ya' : 'Tidak');
    b.className = berubah ? 'ya' : 'tidak';
    tr.appendChild(b);
    tr.appendChild(td(ket));
    tb.insertBefore(tr, tb.firstChild);
    while (tb.rows.length > 12) tb.deleteRow(-1);
  }

  function tekan(method) {
    var sebelum = sidik();
    var status = 200;
    var ket = '';

    if (method === 'GET') {
      status = adaProduk ? 200 : 404;
      ket = adaProduk
        ? 'Membaca saja, data tidak disentuh. Safe & idempotent.'
        : 'Produk sudah tidak ada (404). Mengulang GET tetap tidak mengubah apa pun.';
    } else if (method === 'PUT') {
      if (adaProduk) {
        produk = { id: 12, name: 'Sepatu Lari', price: 460000 };
        status = 200;
        ket = 'Data diganti dengan isi body PUT (harga 460.000).';
      } else {
        status = 404;
        ket = 'Produk sudah terhapus, PUT gagal (404) — tidak ada yang berubah.';
      }
    } else if (method === 'POST') {
      pesanan.push({ id: 100 + pesanan.length + 1, product: 12, qty: 1 });
      status = 201;
      ket = 'Pesanan baru tercatat. Tiap POST menambah data — TIDAK idempotent!';
    } else if (method === 'DELETE') {
      if (adaProduk) {
        adaProduk = false;
        status = 204;
        ket = 'Produk dihapus (204).';
      } else {
        status = 404;
        ket = 'Sudah terhapus sejak tadi (404). Hasil akhir TETAP sama — idempotent.';
      }
    }

    hitung[method]++;
    var sesudah = sidik();
    var berubah = sesudah !== sebelum;
    if (berubah) versi++;
    baris(method, status, berubah, ket);
    segarkan();
  }

  $('btnGet').onclick = function () { tekan('GET'); };
  $('btnPut').onclick = function () { tekan('PUT'); };
  $('btnPost').onclick = function () { tekan('POST'); };
  $('btnDel').onclick = function () { tekan('DELETE'); };
  $('btnReset').onclick = function () {
    produk = { id: 12, name: 'Sepatu Lari', price: 450000 };
    adaProduk = true;
    pesanan = [];
    versi = 1;
    urut = 0;
    hitung = { GET: 0, PUT: 0, POST: 0, DELETE: 0 };
    $('log').innerHTML = '';
    segarkan();
  };

  segarkan();
</script>
</body>
</html>`,
      hint: 'Tekan GET beberapa kali: versi hasil akhir tetap v1. Tekan PUT dua kali: hanya tekanan pertama yang mengubah versi. Tekan DELETE dua kali: versi naik hanya sekali. Tekan POST tiga kali: versi naik tiga kali — inilah yang tidak idempotent.'
    },
    {
      type: 'tip',
      title: 'Tiga pertanyaan sebelum memilih method',
      text: 'Satu: apakah request ini <b>membaca</b> saja? Kalau ya, GET. Dua: apakah mengganti <b>seluruh</b> isi resource atau hanya sebagian? PUT untuk seluruh, PATCH untuk sebagian. Tiga: apakah pengulangan bisa <b>merugikan</b> pengguna, seperti memesan dua kali? Kalau ya, periksa ulang apakah POST-mu sudah punya pengaman.'
    },
    {
      type: 'warn',
      title: 'GET tidak boleh mengubah apa pun',
      text: 'Browser, mesin pencari, dan cache bebas memanggil GET seenaknya — termasuk saat kamu tidak sedang membuka halaman. Kalau GET dipakai menghapus data, data bisa terhapus hanya karena seseorang membuka tautan. Aksi yang mengubah data wajib memakai POST, PUT, PATCH, atau DELETE.'
    },
    {
      type: 'vocab',
      items: [
        ['Safe', 'Sifat method yang tidak mengubah data di server: GET, HEAD, OPTIONS.'],
        ['Idempotent', 'Sifat method yang hasil akhirnya tetap sama walau dipanggil berkali-kali.'],
        ['Retry', 'Pengiriman ulang request secara otomatis saat koneksi gagal atau putus.'],
        ['PUT', 'Mengganti seluruh isi resource — idempotent karena pengulangan hasilnya sama.'],
        ['DELETE', 'Menghapus resource — idempotent; pengulangan kedua menjawab 404 tapi hasil akhir tetap sama.'],
        ['POST', 'Membuat data baru — tidak idempotent; mengulang bisa menghasilkan dua data.'],
        ['Kunci anti-dobel', 'Nilai unik dari klien agar server mengenali request yang sama dan tidak memprosesnya dua kali.']
      ]
    }
  ],
  recap: [
    '<b>Safe</b> = tidak mengubah data: GET, HEAD, OPTIONS.',
    '<b>Idempotent</b> = diulang berkali, hasil akhir tetap sama: GET, PUT, DELETE.',
    'DELETE dua kali tetap "terhapus"; PUT dua kali dengan isi sama tetap data yang sama.',
    '<b>POST tidak idempotent</b> — mengulang bisa berarti dua pesanan atau bayar dua kali.',
    'Hindari kesalahan umum: GET untuk menghapus, POST untuk membaca, semua balasan 200, ID di body.'
  ]
});
