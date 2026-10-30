/* ============================================================
   Pelajaran Dasar RESTful API — Bab 3: URL & Endpoint
   ============================================================ */
'use strict';

window.RESTFULAPI_LESSONS = window.RESTFULAPI_LESSONS || [];

window.RESTFULAPI_LESSONS.push({
  id: 'url-endpoint',
  title: 'URL & Endpoint: Alamat Rumah untuk Data',
  chapter: 'HTTP Dasar',
  duration: '10 menit',
  intro: [
    'Mau mengirim surat, kamu wajib menulis alamat yang lengkap: nama jalan, nomor rumah, kota. Di internet, alamat lengkap itu disebut <b>URL</b>.',
    'Pelajaran ini membedah bagian-bagian URL, mengenal <b>endpoint (alamat resource API)</b>, dan menegaskan aturan penamaan yang enak dibaca.'
  ],
  objectives: [
    'Membedakan skema, domain, path, dan query dalam sebuah URL',
    'Menjelaskan arti endpoint dengan bahasa sendiri',
    'Memahami peran singkat DNS (penerjemah nama ke nomor)',
    'Menamai endpoint dengan kata benda, bukan kata kerja'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Anatomi URL</h3><p>Contoh utama pelajaran ini:</p><p><code>https://toko.com/api/v1/products?category=sepatu</code></p><p>URL itu tersusun dari 4 bagian, selalu dengan urutan yang sama:</p><table><thead><tr><th>Bagian</th><th>Nilai</th><th>Fungsinya</th></tr></thead><tbody><tr><td><b>Skema</b></td><td><code>https://</code></td><td>Cara mengambil data; hampir selalu https</td></tr><tr><td><b>Domain</b></td><td><code>toko.com</code></td><td>Nama pemilik layanan</td></tr><tr><td><b>Path</b></td><td><code>/api/v1/products</code></td><td>Lokasi resource; <code>v1</code> = versi 1</td></tr><tr><td><b>Query</b></td><td><code>?category=sepatu</code></td><td>Instruksi tambahan; boleh kosong</td></tr></tbody></table><p>Cara membacanya seperti kalimat: "ambil data, dari toko.com, resource produk, khusus kategori sepatu".</p>'
    },
    {
      type: 'example',
      title: 'Bedah dua URL lagi',
      lang: 'text',
      output: false,
      code: `https://gofood.co.id/api/v2/restaurants?city=Jakarta&page=2

https://            → skema
gofood.co.id        → domain (nama pemilik)
/api/v2/restaurants  → path (resource: daftar restoran)
?city=Jakarta&page=2 → query (filter kota + halaman 2)

https://api.tokopedia.com/products/42

https://            → skema
api.tokopedia.com   → domain (subdomain khusus API)
/products           → path (resource: produk)
/42                 → id produk (angka di ujung path)`,
      explain: [
        'Query bisa berisi banyak pasangan, dipisah tanda <code>&amp;</code>.',
        'Angka di ujung path menunjuk <b>satu data tertentu</b>. Istilahnya path parameter.',
        'Beberapa layanan memakai subdomain khusus <code>api.</code> agar alamat API terpisah dari website-nya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Domain dan IP: Nama dan Nomor Rumah</h3><p>Komputer tidak mengenal nama domain. Komputer hanya mengenal <b>nomor IP</b>, seperti <code>103.28.12.7</code>.</p><p><b>DNS</b> adalah buku telepon internet. Ia menerjemahkan <code>toko.com</code> menjadi nomor IP. Kamu cukup mengingat nama; penerjemahannya terjadi otomatis dalam sekejap.</p><p>Analoginya: IP = nomor rumah, domain = nama jalan, DNS = petugas kantor pos yang menerjemahkan nama jadi nomor.</p>'
    },
    {
      type: 'text',
      html: '<h3>Apa Itu Endpoint?</h3><p><b>Endpoint</b> adalah alamat yang bisa dipanggil API. Syaratnya ada dua: <b>URL + method</b>.</p><p><code>https://toko.com/products</code> baru URL. <code>GET /products</code> sudah disebut endpoint.</p><p>Kenapa method ikut? Karena satu URL bisa menerima aksi berbeda. <code>GET /products</code> membaca daftar produk. <code>POST /products</code> menambah produk baru.</p><blockquote style="border-left:3px solid var(--accent);padding-left:12px;margin:12px 0"><b>URL menentukan SIAPA yang diminta, method menentukan APA yang dilakukan.</b></blockquote>'
    },
    {
      type: 'text',
      html: '<h3>Pakai Kata Benda, Bukan Kata Kerja</h3><p>Endpoint yang baik menamai <b>resource (data)</b>, bukan aksi. Aksinya sudah dibawa method.</p><table><thead><tr><th>Kurang tepat</th><th>Tepat</th></tr></thead><tbody><tr><td><code>/getProducts</code></td><td><code>/products</code> + GET</td></tr><tr><td><code>/createUser</code></td><td><code>/users</code> + POST</td></tr><tr><td><code>/deleteOrder/9</code></td><td><code>/orders/9</code> + DELETE</td></tr></tbody></table><p>Bayangkan papan penunjuk di mal. Tertulis "Toko Sepatu", bukan "Masuk ke Toko Sepatu". Singkat dan tidak mengulang informasi.</p><p>Dengan aturan ini, kamu bisa menebak endpoint baru hanya dari namanya.</p>'
    },
    {
      type: 'example',
      title: 'Contoh endpoint: toko online & marketplace',
      lang: 'text',
      output: false,
      code: `# Toko online
GET    /api/v1/products            → daftar produk
GET    /api/v1/products/42         → satu produk
POST   /api/v1/products            → tambah produk
GET    /api/v1/orders              → daftar pesanan
POST   /api/v1/orders              → buat pesanan baru

# Marketplace (gaya Tokopedia)
GET    /api/v2/shop/8877           → info satu toko
GET    /api/v2/shop/8877/products  → produk milik toko 8877
GET    /api/v2/products?category=sepatu&sort=price`,
      explain: [
        'Semua namanya memakai <b>kata benda jamak</b>: <code>products</code>, <code>orders</code>, <code>shop</code>.',
        'Resource boleh bersarang secukupnya: <code>/shop/8877/products</code> dibaca "produk milik toko 8877".',
        'Tidak ada kata kerja di URL. Aksinya dibawa method, yang dibahas lengkap di pelajaran berikutnya.'
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: penyusun URL dari komponen',
      lang: 'html',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: system-ui, sans-serif; font-size: 14px; margin: 12px; color: #0f172a; }
  h4 { margin: 14px 0 6px; font-size: 13px; color: #475569; }
  .choices { display: flex; gap: 6px; flex-wrap: wrap; }
  button { padding: 7px 12px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; color: #0f172a; cursor: pointer; font-size: 13px; }
  button.active { background: #2563eb; border-color: #2563eb; color: #fff; font-weight: 700; }
  #url { margin-top: 14px; padding: 12px; background: #0f172a; border-radius: 8px; font-family: ui-monospace, Menlo, monospace; font-size: 14px; word-break: break-all; }
  .skema { color: #93c5fd; }
  .domain { color: #86efac; }
  .path { color: #fcd34d; }
  .query { color: #c4b5fd; }
  table { border-collapse: collapse; margin-top: 12px; width: 100%; }
  th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; font-size: 13px; }
  th { background: #f1f5f9; }
  #note { margin-top: 10px; color: #475569; font-size: 13px; }
</style>
</head>
<body>
<p>Susun URL-mu sendiri, lalu lihat penjelasan tiap bagian di bawah:</p>
<h4>1. Domain (nama pemilik)</h4>
<div class="choices" id="domainChoices"></div>
<h4>2. Resource (kata benda)</h4>
<div class="choices" id="pathChoices"></div>
<h4>3. Menunjuk satu data atau semua data?</h4>
<div class="choices" id="idChoices"></div>
<h4>4. Query (instruksi tambahan — boleh pilih lebih dari satu)</h4>
<div class="choices" id="queryChoices"></div>
<div id="url"></div>
<table>
  <thead><tr><th>Bagian</th><th>Nilai</th><th>Fungsi</th></tr></thead>
  <tbody id="breakdown"></tbody>
</table>
<p id="note"></p>
<script>
  var state = { domain: 'toko.com', resource: 'products', id: '', query: [] };
  var domains = ['toko.com', 'gofood.co.id', 'api.tokopedia.com'];
  var resources = ['products', 'orders', 'users'];
  var idOptions = [
    { v: '', l: 'Semua data' },
    { v: '42', l: 'Satu data — id 42' },
    { v: '8877', l: 'Satu data — id 8877' }
  ];
  var queryOptions = ['category=sepatu', 'page=2', 'sort=price'];

  function renderButtons(boxId, items, isActive, onPick) {
    var box = document.getElementById(boxId);
    box.innerHTML = '';
    items.forEach(function (item) {
      var btn = document.createElement('button');
      btn.textContent = item.l;
      if (isActive(item.v)) { btn.className = 'active'; }
      btn.onclick = function () { onPick(item.v); render(); };
      box.appendChild(btn);
    });
  }

  function render() {
    renderButtons('domainChoices',
      domains.map(function (d) { return { v: d, l: d }; }),
      function (v) { return state.domain === v; },
      function (v) { state.domain = v; });
    renderButtons('pathChoices',
      resources.map(function (r) { return { v: r, l: '/' + r }; }),
      function (v) { return state.resource === v; },
      function (v) { state.resource = v; });
    renderButtons('idChoices', idOptions,
      function (v) { return state.id === v; },
      function (v) { state.id = v; });
    renderButtons('queryChoices',
      queryOptions.map(function (q) { return { v: q, l: q }; }),
      function (v) { return state.query.indexOf(v) >= 0; },
      function (v) {
        var at = state.query.indexOf(v);
        if (at >= 0) { state.query.splice(at, 1); } else { state.query.push(v); }
      });

    var path = '/api/v1/' + state.resource + (state.id ? '/' + state.id : '');
    var qs = state.query.length ? '?' + state.query.join('&') : '';
    document.getElementById('url').innerHTML =
      '<span class="skema">https://</span>' +
      '<span class="domain">' + state.domain + '</span>' +
      '<span class="path">' + path + '</span>' +
      '<span class="query">' + qs + '</span>';

    var rows = [
      ['Skema', 'https://', 'cara mengambil data — hampir selalu https'],
      ['Domain', state.domain, 'nama pemilik layanan (DNS menerjemahkannya jadi nomor IP)'],
      ['Path', path, state.id ? 'lokasi resource + id satu data' : 'lokasi koleksi (seluruh data)'],
      ['Query', qs || '(kosong)', state.query.length ? 'instruksi tambahan untuk membaca data' : 'tanpa instruksi tambahan']
    ];
    var html = '';
    rows.forEach(function (r) {
      html += '<tr><td><b>' + r[0] + '</b></td><td>' + r[1] + '</td><td>' + r[2] + '</td></tr>';
    });
    document.getElementById('breakdown').innerHTML = html;
    document.getElementById('note').textContent =
      'Contoh pemakaian: GET https://' + state.domain + path + qs +
      ' — membaca ' + (state.id ? 'satu data' : 'daftar ' + state.resource) + '.';
  }
  render();
</script>
</body>
</html>`,
      hint: 'Ubah-ubah pilihanmu, lalu perhatikan bagian URL yang berwarna dan tabel penjelasannya.'
    },
    {
      type: 'tip',
      title: 'Tips cepat membaca URL asing',
      text: 'Mulailah dari <b>belakang</b>. Abaikan dulu skema dan query. Kata teruncanya biasanya resource utamanya: di <code>/shop/8877/products</code>, yang diminta adalah <b>products</b>. Setelah terbiasa, kamu bisa membaca endpoint seperti kalimat: "produk, milik toko 8877".'
    },
    {
      type: 'warn',
      title: 'Jangan taruh data rahasia di query',
      text: '<code>?password=rahasia123</code> sangat berbahaya. Query tercatat di riwayat browser, riwayat server, dan bisa ikut terkirim ke situs lain. Kata sandi dan token harus dikirim lewat body atau header — akan dibahas di pelajaran header.'
    },
    {
      type: 'vocab',
      items: [
        ['URL', 'Alamat lengkap di internet: skema, domain, path, dan query.'],
        ['Skema', 'Cara mengambil data; untuk API modern hampir selalu https.'],
        ['Domain', 'Nama pemilik layanan, misalnya toko.com.'],
        ['Path', 'Lokasi resource di dalam layanan, misalnya /products.'],
        ['Query', 'Tambahan instruksi di URL, diawali tanda tanya: ?category=sepatu.'],
        ['Endpoint', 'Alamat API yang bisa dipanggil: kombinasi URL + method.'],
        ['DNS', 'Buku telepon internet: menerjemahkan nama domain jadi nomor IP.'],
        ['Resource', 'Satu jenis data yang dikelola API, misalnya produk atau pesanan.']
      ]
    }
  ],
  recap: [
    'URL tersusun dari <b>skema → domain → path → query</b>, selalu dengan urutan itu.',
    '<b>Endpoint = URL + method</b> — alamat lengkap plus aksinya.',
    'DNS menerjemahkan nama domain menjadi nomor IP, seperti petugas kantor pos.',
    'Endpoint memakai <b>kata benda</b>: <code>/products</code>, bukan <code>/getProducts</code>.',
    'Jangan pernah menaruh kata sandi atau token di bagian query.'
  ]
});
