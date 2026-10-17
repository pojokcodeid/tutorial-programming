/* ============================================================
   Pelajaran Lucee CFML — Bab 15: RESTful API di Lucee (L15)
   ============================================================ */
'use strict';

window.LUCEE_LESSONS = window.LUCEE_LESSONS || [];

window.LUCEE_LESSONS.push({
  id: 'lucee-rest-api',
  title: 'RESTful API di Lucee',
  chapter: 'Arsitektur Modern',
  duration: '13 menit',
  intro: [
    '<b>REST</b> adalah gaya API paling umum hari ini: data disajikan sebagai <b>resource</b> dengan URL kata benda (<code>/produk</code>, <code>/pesanan</code>), aksi ditentukan <b>method HTTP</b> (GET, POST, PUT, DELETE), server tidak menyimpan state klien (<b>stateless</b>), dan balasan berupa JSON beserta <b>status code</b>.',
    'Kabar baiknya, Lucee punya modul REST <b>bawaan</b> — tidak perlu framework tambahan. Cukup satu component bertanda <code>rest="true"</code> dengan fungsi-fungsi <code>remote</code>, lalu daftarkan lewat <code>restInitApplication()</code>.',
    'Pelajaran ini membangun CRUD produk lengkap: daftar, detail, tambah, ubah, hapus — plus kontrak response JSON, penanganan error, dokumentasi endpoint, dan pengujian dengan cURL.'
  ],
  objectives: [
    'Menerjemahkan resource toko menjadi endpoint REST',
    'Menulis komponen REST Lucee dengan fungsi remote dan restArgSource',
    'Mendaftarkan API lewat restInitApplication dan me-refresh-nya setelah deploy',
    'Menyusun kontrak JSON (data, error, meta) dengan kode status yang tepat',
    'Menguji endpoint dengan cURL dan mendokumentasikannya dalam tabel'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Prinsip REST dalam 5 Menit</h3><ul><li><b>Resource</b> = kata benda pada URL. URL tidak pernah berisi kata kerja: tulis <code>POST /produk</code>, bukan <code>POST /tambahProduk</code>.</li><li><b>Method HTTP</b> = kata kerjanya. GET membaca, POST membuat, PUT memperbarui, DELETE menghapus.</li><li><b>Stateless</b>: tiap request berdiri sendiri lengkap (cookie/token), server tidak mengingat percakapan sebelumnya.</li><li><b>Status code</b> menceritakan hasil: 200 sukses, 201 terbuat, 404 tidak ada, 500 server gagal — klien tidak perlu menebak dari isi balasan.</li></ul>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 260" width="760" role="img" aria-label="Alur request REST dari klien ke komponen lalu balasan JSON">
        <defs><marker id="mk-l15-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs>
        <rect x="30" y="50" width="160" height="60" rx="8" class="u-box"/>
        <text x="110" y="75" class="u-title" text-anchor="middle">Klien</text>
        <text x="110" y="97" class="u-lbl" text-anchor="middle">curl · Postman · aplikasi</text>
        <line x1="193" y1="80" x2="245" y2="80" class="u-line" marker-end="url(#mk-l15-1)"/>
        <text x="219" y="70" class="u-lbl" text-anchor="middle">GET</text>
        <rect x="250" y="50" width="210" height="60" rx="8" class="u-hd"/>
        <text x="355" y="75" class="u-title" text-anchor="middle">Lucee REST Router</text>
        <text x="355" y="97" class="u-lbl" text-anchor="middle">restInitApplication()</text>
        <line x1="463" y1="80" x2="515" y2="80" class="u-line" marker-end="url(#mk-l15-1)"/>
        <text x="489" y="70" class="u-lbl" text-anchor="middle">/produk</text>
        <rect x="520" y="50" width="210" height="60" rx="8" class="u-box"/>
        <text x="625" y="75" class="u-title" text-anchor="middle">Produk.cfc</text>
        <text x="625" y="97" class="u-lbl" text-anchor="middle">remote + httpmethod</text>
        <line x1="625" y1="113" x2="625" y2="165" class="u-dash" marker-end="url(#mk-l15-1)"/>
        <rect x="250" y="170" width="210" height="55" rx="8" class="u-box"/>
        <text x="355" y="194" class="u-title" text-anchor="middle">Response</text>
        <text x="355" y="214" class="u-lbl" text-anchor="middle">status code + JSON</text>
        <line x1="620" y1="205" x2="468" y2="205" class="u-dash" marker-end="url(#mk-l15-1)"/>
        <line x1="247" y1="205" x2="115" y2="205" class="u-dash" marker-end="url(#mk-l15-1)"/>
        <line x1="110" y1="200" x2="110" y2="115" class="u-dash" marker-end="url(#mk-l15-1)"/>
        <text x="355" y="248" class="u-lbl" text-anchor="middle">Router mencocokkan restpath → fungsi remote → balasan JSON kembali ke klien</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 15.1</b> — Request dipetakan ke fungsi remote; balasan selalu JSON + status code</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>REST API Native Lucee</h3><p>Strukturnya: component dengan atribut <code>rest="true"</code> dan <code>restpath</code>, berisi fungsi <code>remote</code> yang diberi <code>httpmethod</code> serta <code>restpath</code> sendiri. Parameter diambil dari berbagai sumber lewat atribut <code>restArgSource</code>: <code>path</code> (potongan URL), <code>url</code>, <code>form</code>, atau <code>body</code> (payload JSON).</p>'
    },
    {
      type: 'example',
      title: 'GET daftar & detail produk',
      lang: 'cfml',
      output: false,
      code: `<!-- rest/Produk.cfc -->
component restpath="/produk" rest="true" {

  // GET /api/produk — daftar semua produk
  remote array function index() httpmethod="GET" restpath="/" {
    var q = queryExecute(
      "SELECT id, nama, harga, stok FROM produk ORDER BY id",
      {}, { datasource: "appDB" }
    );
    var hasil = [];
    loop query=q {
      arrayAppend(hasil, { id: q.id, nama: q.nama, harga: q.harga, stok: q.stok });
    }
    return hasil;
  }

  // GET /api/produk/1 — detail satu produk
  remote struct function show(required numeric id restArgSource="path")
      httpmethod="GET" restpath="/{id}" {
    var q = queryExecute(
      "SELECT id, nama, harga, stok FROM produk WHERE id = :id",
      { id: arguments.id }, { datasource: "appDB" }
    );
    if ( q.recordCount == 0 ) {
      restSetResponse(statusCode=404, statusText="Produk tidak ditemukan");
      return { "error": "produk_tidak_ditemukan" };
    }
    loop query=q {
      return { "id": q.id, "nama": q.nama, "harga": q.harga, "stok": q.stok };
    }
  }
}`,
      explain: [
        'restpath="/produk" pada component + restpath="/" pada index menghasilkan endpoint GET /api/produk.',
        'restpath="/{id}" menangkap potongan URL sebagai argumen; restArgSource="path" menunjuk sumbernya.',
        'Nilai balasan (array atau struct) otomatis di-serialize Lucee menjadi JSON.',
        'restSetResponse() mengatur status sebelum fungsi mengembalikan balasan.'
      ]
    },
    {
      type: 'example',
      title: 'POST, PUT, dan DELETE',
      lang: 'cfml',
      output: false,
      code: `component restpath="/produk" rest="true" {

  // POST /api/produk — payload JSON otomatis jadi struct
  remote struct function create(required struct data restArgSource="body")
      httpmethod="POST" restpath="/" {
    queryExecute(
      "INSERT INTO produk (nama, harga, stok) VALUES (:nama, :harga, :stok)",
      { nama: arguments.data.nama, harga: arguments.data.harga, stok: arguments.data.stok },
      { datasource: "appDB" }
    );
    restSetResponse(statusCode=201, statusText="Produk dibuat");
    return { "data": { "nama": arguments.data.nama, "harga": arguments.data.harga } };
  }

  // PUT /api/produk/1 — argumen URL + argumen body dipakai bersama
  remote struct function update(required numeric id restArgSource="path",
                                required struct data restArgSource="body")
      httpmethod="PUT" restpath="/{id}" {
    queryExecute(
      "UPDATE produk SET nama=:nama, harga=:harga, stok=:stok WHERE id=:id",
      { nama: arguments.data.nama, harga: arguments.data.harga,
        stok: arguments.data.stok, id: arguments.id },
      { datasource: "appDB" }
    );
    return { "data": { "id": arguments.id, "updated": true } };
  }

  // DELETE /api/produk/1
  remote struct function remove(required numeric id restArgSource="path")
      httpmethod="DELETE" restpath="/{id}" {
    queryExecute("DELETE FROM produk WHERE id = :id",
                 { id: arguments.id }, { datasource: "appDB" });
    restSetResponse(statusCode=204, statusText="Produk dihapus");
    return {};
  }
}`,
      explain: [
        'POST mengirim body JSON; restArgSource="body" menyerahkannya ke argumen struct data.',
        'PUT menggabungkan id dari path dan data dari body dalam satu fungsi.',
        '201 Created untuk resource baru, 204 No Content untuk penghapusan yang sukses.',
        'Semua fungsi memakai parameterized query (:nama) — tidak pernah menyusun SQL dengan string.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Registrasi &amp; Refresh Endpoint</h3><p>Komponen REST baru belum dipakai sampai didaftarkan. <code>restInitApplication()</code> memindai folder dan mendaftarkan semua component bertanda rest="true" — panggil dari Application.cfc agar berjalan sekali saat aplikasi start. Setelah deploy kode REST yang berubah, daftar ulang agar route menyegarkan; <code>restListApplication()</code> dan <code>restDeleteApplication()</code> adalah alat bantu untuk itu.</p>'
    },
    {
      type: 'example',
      title: 'Registrasi API di Application.cfc',
      lang: 'cfml',
      output: false,
      code: `// Application.cfc
component {
  this.name = "TokoKopiAPI";

  function onApplicationStart() {
    // semua .cfc di folder /rest terdaftar dengan prefix URL /api
    restInitApplication( dirPath=expandPath("/rest"), serviceMapping="api" );
    return true;
  }
}

// sesudah deploy — panggil sekali dari halaman admin / REPL
restListApplication();                                // daftar service yang terdaftar
restDeleteApplication("api");                         // lepas registrasi lama
restInitApplication( dirPath=expandPath("/rest"), serviceMapping="api" );  // daftar ulang`,
      explain: [
        'dirPath menunjuk folder berisi komponen REST; serviceMapping menentukan prefix URL (/api/produk).',
        'Pemanggilan di onApplicationStart membuat endpoint langsung siap tiap aplikasi hidup.',
        'restListApplication() menampilkan service yang terdaftar — berguna memverifikasi hasil registrasi.',
        'Setelah mengubah komponen REST: restDeleteApplication lalu restInitApplication lagi (atau restart aplikasi).'
      ]
    },
    {
      type: 'text',
      html: '<h3>Kontrak Response, Status, dan Validasi</h3><p>API yang enak dipakai selalu konsisten. Pakai satu amplop balasan: <code>data</code> untuk hasil sukses, <code>error</code> untuk kegagalan, <code>meta</code> untuk informasi tambahan (jumlah baris, halaman, waktu). Tentukan juga <code>Content-Type: application/json</code> dan kode status yang jujur melalui header() atau restSetResponse().</p>'
    },
    {
      type: 'example',
      title: 'Helper kontrak JSON sukses & gagal',
      lang: 'cfml',
      output: false,
      code: `// components/Response.cfc — dipakai semua endpoint
component {

  function sukses(required any data, struct meta={}) {
    header( name="Content-Type", value="application/json" );
    return {
      "data":  arguments.data,
      "error": javaCast("null", ""),
      "meta":  arguments.meta
    };
  }

  function gagal(required numeric kode, required string pesan, any detail={}) {
    restSetResponse( statusCode=arguments.kode, statusText=arguments.pesan );
    return {
      "data":  javaCast("null", ""),
      "error": { "code": arguments.kode, "message": arguments.pesan,
                 "detail": arguments.detail },
      "meta":  {}
    };
  }
}`,
      explain: [
        'Struktur data / error / meta yang sama membuat klien menangani balasan dengan satu kode parsing.',
        'javaCast("null", "") menghasilkan null sungguhan di JSON, bukan string kosong.',
        'gagal() mengatur status code sekaligus mengisi objek error — pesan dan kode tidak pernah berbeda.',
        'header() menetapkan Content-Type application/json agar klien tahu tipe balasan.'
      ]
    },
    {
      type: 'example',
      title: 'Validasi input sebelum menyimpan (400 Bad Request)',
      lang: 'cfml',
      output: false,
      code: `remote struct function create(required struct data restArgSource="body")
    httpmethod="POST" restpath="/" {
  var masalah = [];

  if ( !structKeyExists(arguments.data, "nama") || !len(trim(arguments.data.nama)) )
    arrayAppend(masalah, "nama wajib diisi");
  if ( !structKeyExists(arguments.data, "harga") || !isNumeric(arguments.data.harga) )
    arrayAppend(masalah, "harga harus berupa angka");
  if ( structKeyExists(arguments.data, "stok") && !isNumeric(arguments.data.stok) )
    arrayAppend(masalah, "stok harus berupa angka");

  if ( arrayLen(masalah) ) {
    return Response.gagal( 400, "Validasi gagal", masalah );
  }

  // ... simpan ke database lalu balas 201 ...
  return Response.sukses( { "nama": arguments.data.nama } );
}`,
      explain: [
        'Validasi berjalan sebelum menyentuh database — data rusak ditolak dengan 400.',
        'Daftar field yang bermasalah dikirim di error.detail sehingga form klien bisa menandai input.',
        'Periksa keberadaan kunci dengan structKeyExists sebelum memakai isNumeric/trim.',
        'Kode status, pesan, dan detail selalu berasal dari satu helper — kontrak tidak mudah menyimpang.'
      ]
    },
    {
      type: 'text',
      html: '<p>Kumpulan kode status yang lazim untuk API toko: <b>400</b> Bad Request (JSON rusak / validasi gagal), <b>401</b> Unauthorized (belum login), <b>403</b> Forbidden (sudah login tapi tidak berhak), <b>404</b> Not Found (resource tidak ada), <b>409</b> Conflict (nama produk sudah dipakai), dan <b>500</b> Internal Server Error (server gagal — detailnya hanya di log, bukan di balasan).</p>'
    },
    {
      type: 'text',
      html: '<h3>Pengujian &amp; Dokumentasi</h3><p>Sebelum ditulis frontend-nya, uji dulu endpoint-nya. Cukup dengan cURL dari terminal — lihat status dan balasan per endpoint:</p>'
    },
    {
      type: 'example',
      title: 'Menguji seluruh CRUD dengan cURL',
      lang: 'bash',
      output: false,
      code: `# Daftar produk
curl -s -i http://localhost:8080/api/produk

# Detail satu produk
curl -s http://localhost:8080/api/produk/1

# Tambah produk baru
curl -s -X POST http://localhost:8080/api/produk \\
  -H "Content-Type: application/json" \\
  -d '{"nama":"Kopi Gayo","harga":85000,"stok":12}'

# Ubah harga
curl -s -X PUT http://localhost:8080/api/produk/1 \\
  -H "Content-Type: application/json" \\
  -d '{"nama":"Kopi Gayo","harga":90000,"stok":12}'

# Hapus produk
curl -s -X DELETE http://localhost:8080/api/produk/1`,
      explain: [
        '<code>-i</code> menampilkan header respons, termasuk status code yang balasannya.',
        '<code>-X</code> memilih method HTTP; header Content-Type wajib untuk POST/PUT berbody JSON.',
        'Hapus <code>-s</code> bila kamu ingin melihat progres transfer di terminal.',
        'Semua perintah di atas bisa disimpan ke collection Postman untuk dijalankan berulang.'
      ]
    },
    {
      type: 'text',
      html: '<p>Dokumentasikan setiap endpoint dalam tabel — inilah kontrak yang dipakai frontend, mobile, maupun tim QA:</p><table class="vocab"><tr><th>Method</th><th>Endpoint</th><th>Fungsi</th><th>Kegunaan</th></tr><tr><td>GET</td><td><code>/api/produk</code></td><td>index</td><td>Daftar semua produk</td></tr><tr><td>GET</td><td><code>/api/produk/{id}</code></td><td>show</td><td>Detail satu produk</td></tr><tr><td>POST</td><td><code>/api/produk</code></td><td>create</td><td>Tambah produk (body JSON)</td></tr><tr><td>PUT</td><td><code>/api/produk/{id}</code></td><td>update</td><td>Ubah data produk</td></tr><tr><td>DELETE</td><td><code>/api/produk/{id}</code></td><td>remove</td><td>Hapus produk</td></tr></table>'
    },
    {
      type: 'warn',
      title: 'Jangan bocorkan detail error ke klien',
      text: 'Stack trace, nama tabel, atau pesan driver database di balasan 500 adalah hadiah untuk penyerang. Tangkap kegagalan tak terduga, catat lengkap dengan writeLog() di sisi server, lalu balas hanya pesan generik: <code>{"error":{"code":500,"message":"Terjadi kesalahan di server"}}</code>. Log detail, klien hanya tahu fakta.'
    },
    {
      type: 'tip',
      title: 'Uji kontrak, bukan hanya halaman sukses',
      text: 'Selalu jalankan uji kasus gagal: body JSON rusak (harus 400), id yang tidak ada (404), dan data duplikat bila ada aturan unik (409). Di Postman gunakan tab Tests untuk meng-assert status code; di cURL, periksa dengan <code>curl -i</code>. API yang hanya diuji saat senang-senang akan protes pertama kali di produksi.'
    },
    {
      type: 'vocab',
      items: [
        ['REST', 'Gaya API berbasis resource, method HTTP, stateless, dan balasan terstruktur.'],
        ['Resource', 'Entitas data yang diwakili URL, mis. /produk atau /pesanan.'],
        ['Endpoint', 'Pasangan method + URL yang bisa dipanggil klien.'],
        ['Status code', 'Kode tiga digit hasil request: 2xx sukses, 4xx klien salah, 5xx server gagal.'],
        ['restpath', 'Atribut penanda URL pada component dan fungsi remote, lengkap dengan parameter {id}.'],
        ['restArgSource', 'Atribut penentu asal argumen: path, url, form, atau body.'],
        ['restInitApplication', 'Fungsi pendaftaran komponen REST dengan dirPath dan serviceMapping.']
      ]
    }
  ],
  recap: [
    'REST memakai URL kata benda, method HTTP sebagai kata kerja, stateless, dan status code yang jujur.',
    'Komponen Lucee: rest="true" + restpath; fungsi remote dengan httpmethod, restpath="/{id}", dan restArgSource per argumen.',
    'restInitApplication(dirPath, serviceMapping) mendaftarkan API; daftar ulang dengan restDeleteApplication + restInitApplication setelah deploy.',
    'Balasan selalu satu kontrak: data untuk sukses, error untuk gagal, meta untuk informasi tambahan.',
    'Validasi input di pintu masuk dan balas 400/404/409/500 sesuai kasus; detail error teknis hanya di log.',
    'Uji CRUD dengan cURL/Postman dan dokumentasikan endpoint dalam tabel sebelum frontend memakainya.'
  ]
});
