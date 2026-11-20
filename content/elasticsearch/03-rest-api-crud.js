/* ============================================================
   Pelajaran Elasticsearch — 03: REST API & CRUD Document
   (Roadmap Level 2 — bab Data & Indexing)
   ============================================================ */
'use strict';

window.ELASTICSEARCH_LESSONS = window.ELASTICSEARCH_LESSONS || [];

window.ELASTICSEARCH_LESSONS.push({
  id: 'rest-api-crud',
  title: 'REST API & CRUD Document',
  chapter: 'Data & Indexing',
  duration: '15 menit',
  intro: [
    'Kalau Elasticsearch adalah gudang raksasa, maka REST API-nya adalah pintu masuk dan antrean layanannya. Kamu tidak perlu membeli tiket khusus atau memasang driver aneh — cukup <b>HTTP biasa dengan JSON</b>, persis seperti yang sudah kamu pakai memanggil API mana pun. Satu pintu, banyak perintah, dan semua bisa dicoba langsung dari terminal.',
    'Di pelajaran ini kamu menguasai empat method HTTP yang jadi tulang punggung CRUD: <code>PUT</code> untuk membuat dengan id tertentu, <code>POST</code> untuk membuat yang id-nya ditentukan server, <code>GET</code> untuk membaca, <code>POST /_update</code> untuk memperbarui, dan <code>DELETE</code> untuk menghapus. Kamu juga membaca response Elasticsearch — field <code>_index</code>, <code>_id</code>, <code>_version</code>, dan <code>result</code> bercerita banyak tentang apa yang barusan terjadi.',
    'Setelah satu per satu, kamu naik ke <b>Bulk API</b>: satu request yang menampung ratusan aksi sekaligus dalam format NDJSON. Ini adalah cara menanam data yang benar untuk aplikasi nyata — dan ada satu aturan kecil yang sering bikin pemula pusing: setiap baris harus diakhiri newline.'
  ],
  objectives: [
    'Menggunakan method HTTP dan membaca response status serta field penting Elasticsearch',
    'Menjalankan siklus CRUD lengkap pada document: buat, ambil, perbarui, dan hapus',
    'Membaca endpoint inspeksi <code>_cat</code> dan <code>_cluster</code> untuk memantau index, node, dan shard',
    'Menulis bulk indexing dengan format NDJSON dan memahami format baris action + document'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Satu pintu HTTP, banyak perintah</h3><p>Elasticsearch tidak punya bahasa klien khusus: semua lewat HTTP ke port 9200. Yang membedakan hanyalah <b>method</b>, <b>path</b>, dan <b>body</b>. Pola ini berulang di seluruh API-nya, jadi begitu kamu terbiasa, endpoint lain terasa seperti kosakata baru — bukan sintaks baru.</p><table><thead><tr><th>Method</th><th>Path</th><th>Aksi</th><th>Contoh</th></tr></thead><tbody><tr><td><code>PUT</code></td><td><code>/index/_doc/1001</code></td><td>Buat/replace dengan id tertentu</td><td>Saat aplikasi sudah menghasilkan id</td></tr><tr><td><code>POST</code></td><td><code>/index/_doc</code></td><td>Buat, id dibuat server</td><td>Saat id diurus Elasticsearch</td></tr><tr><td><code>GET</code></td><td><code>/index/_doc/1001</code></td><td>Ambil satu document</td><td>Halaman detail produk</td></tr><tr><td><code>POST</code></td><td><code>/index/_update/1001</code></td><td>Perbarui sebagian field</td><td>Ganti harga, status</td></tr><tr><td><code>DELETE</code></td><td><code>/index/_doc/1001</code></td><td>Hapus document</td><td>Produk dicabut</td></tr><tr><td><code>GET</code></td><td><code>/_cat/indices</code></td><td>Daftar index</td><td>Inspeksi lab</td></tr></tbody></table><p>Perhatikan pola <code>&lt;index&gt;/_doc/&lt;id&gt;</code>: <code>_doc</code> adalah tipe document (warisan versi lama yang tetap dipakai), dan id di akhir path menentukan identitas dokumen. Tanpa id, server yang menentukan — hasilnya id acak seperti <code>kX9v...</code>.</p>'
    },
    {
      type: 'example',
      title: 'CRUD lengkap: buat, ambil, perbarui, hapus',
      lang: 'http',
      output: false,
      code: `# buat index (boleh kosong, mapping menyusul di pelajaran berikutnya)
PUT /products

# tambah document dengan id
PUT /products/_doc/1001
{
  "name": "Gaming Mouse",
  "brand": "Logitech",
  "price": 750000,
  "category": "mouse"
}

# tambah document tanpa id (id dibuat server)
POST /products/_doc
{
  "name": "Mechanical Keyboard",
  "brand": "Keychron",
  "price": 1500000,
  "category": "keyboard"
}

# ambil kembali
GET /products/_doc/1001

# perbarui sebagian field
POST /products/_update/1001
{
  "doc": { "price": 700000 }
}

# hapus
DELETE /products/_doc/1001`,
      explain: [
        '<code>PUT /products</code> membuat index; bila sudah ada, Elasticsearch menjawab error <code>resource_already_exists_exception</code> — status code 400, bukan kegagalan misterius.',
        '<code>PUT .../1001</code> membuat document dengan id yang kamu tentukan; kalau id sudah ada, seluruh dokumen <b>diganti</b> (replace), inilah perbedaan PUT dengan POST.',
        '<code>POST /_update</code> menerima body berisi <code>doc</code> berisi field yang mau diubah saja — field lain tetap utuh, dan <code>_version</code> dokumen bertambah.',
        'Respons <code>GET</code> memuat <code>found: true</code>, <code>_source</code> (isi asli dokumen), dan <code>_version</code>; respons hapus memuat <code>result: deleted</code> — bacalah field <code>result</code> untuk tahu apakah aksi benar-benar diterapkan.'
      ]
    },
    {
      type: 'example',
      title: 'Bulk API: ratusan document dalam satu request',
      lang: 'http',
      output: false,
      code: `POST /products/_bulk
{"index":{"_id":"p-001"}}
{"name":"Laptop Pro","category":"laptop","price":25000000}
{"index":{"_id":"p-002"}}
{"name":"Gaming Mouse","category":"mouse","price":750000}
{"index":{"_id":"p-003"}}
{"name":"Mechanical Keyboard","category":"keyboard","price":1500000}`,
      explain: [
        'Bulk memakai format <b>NDJSON</b>: satu baris = satu objek JSON; baris ganjil berisi <b>aksi</b> (<code>index</code>, <code>create</code>, <code>update</code>, <code>delete</code>) dan baris genap berisi <b>datanya</b> untuk aksi tulis.',
        'Field <code>_id</code> di dalam aksi menentukan id dokumen; menuliskan id membuat bulk ini <b>idempotent</b> — dijalankan berkali-kali hasilnya tetap sama, aman untuk proses sinkronisasi.',
        'Setiap baris wajib diakhiri newline, termasuk baris terakhir — tanpa itu Elasticsearch menolak request dengan error parsing; inilah kesalahan paling umum pemula saat pertama memakai bulk.',
        'Keuntungan bulk: mengurangi jumlah round-trip HTTP dan memaksa Elasticsearch mengindeks dalam satu langkah — untuk 10.000 dokumen, selisihnya bisa berpuluh kali lebih cepat daripada insert satu per satu.'
      ]
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Alur CRUD Elasticsearch: method HTTP PUT POST GET DELETE DELETE diarahkan ke document index lewat endpoint _doc, hasilnya dibaca lewat response field _index _id _version dan result, serta dipantau lewat API _cat dan _cluster">
        <text x="30" y="34" class="u-title" text-anchor="start">Dari method HTTP ke document</text>
        <rect x="30" y="58" width="150" height="44" rx="6" class="u-hd"/>
        <text x="105" y="86" class="u-lbl" text-anchor="middle">PUT / _doc / id</text>
        <rect x="30" y="114" width="150" height="44" rx="6" class="u-box"/>
        <text x="105" y="142" class="u-lbl" text-anchor="middle">POST / _doc</text>
        <rect x="30" y="170" width="150" height="44" rx="6" class="u-box"/>
        <text x="105" y="198" class="u-lbl" text-anchor="middle">GET / _update</text>
        <rect x="30" y="226" width="150" height="44" rx="6" class="u-box"/>
        <text x="105" y="254" class="u-lbl" text-anchor="middle">DELETE</text>
        <line x1="186" y1="155" x2="240" y2="155" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="246" y="86" width="230" height="140" rx="10" class="u-box"/>
        <text x="361" y="114" class="u-title" text-anchor="middle">Index products</text>
        <rect x="264" y="130" width="194" height="76" rx="6" class="u-hd"/>
        <text x="361" y="158" class="u-lbl" text-anchor="middle">document (_id)</text>
        <text x="361" y="186" class="u-lbl" text-anchor="middle">_version naik tiap tulis</text>
        <line x1="482" y1="156" x2="536" y2="156" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="542" y="58" width="190" height="76" rx="8" class="u-hd"/>
        <text x="637" y="86" class="u-lbl" text-anchor="middle">response</text>
        <text x="637" y="114" class="u-lbl" text-anchor="middle">_index _id result</text>
        <rect x="542" y="150" width="190" height="76" rx="8" class="u-box"/>
        <text x="637" y="178" class="u-lbl" text-anchor="middle">_cat &amp; _cluster</text>
        <text x="637" y="206" class="u-lbl" text-anchor="middle">indices nodes shards</text>
        <text x="400" y="286" class="u-lbl" text-anchor="middle">_version dan result bercerita: apakah tulis benar-benar diterapkan?</text>
      </svg></div><figcaption>Setiap method menulis atau membaca document pada index; hasilnya dikonfirmasi lewat field response dan dipantau lewat API <code>_cat</code>/<code>_cluster</code>.</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Endpoint inspeksi: _cat dan _cluster',
      lang: 'bash',
      output: false,
      code: `# daftar index, node, shard, dan health (format tabel)
curl "http://localhost:9200/_cat/indices?v"
curl "http://localhost:9200/_cat/nodes?v"
curl "http://localhost:9200/_cat/shards?v"
curl "http://localhost:9200/_cat/health?v"
curl "http://localhost:9200/_cat/allocation?v"

# versi JSON untuk konsumsi program
curl "http://localhost:9200/_cluster/health?pretty"
curl "http://localhost:9200/_cluster/state?pretty" | head -20`,
      explain: [
        'Parameter <code>?v</code> menambahkan header tabel (nama kolom) sehingga output mudah dibaca manusia — tanpa itu kamu melihat baris tanpa keterangan.',
        '<code>_cat/indices</code> menampilkan <code>docs.count</code>, <code>store.size</code>, dan <code>health</code> tiap index — pemeriksaan pertama setelah kamu menanam data.',
        '<code>_cat/shards</code> menunjukkan shard mana primary, mana replica, di node mana, dan statusnya (<code>started</code>, <code>unassigned</code>) — alat utama memahami pelajaran arsitektur nanti.',
        '<code>_cluster/health</code> adalah ringkasan satu angka untuk seluruh cluster: <code>status</code> green/yellow/red beserta jumlah node dan shard; versi <code>state</code> memuat metadata lengkap yang jarang kamu baca manual.'
      ]
    },
    {
      type: 'example',
      title: 'Sengaja membuat error untuk belajar membaca response',
      lang: 'http',
      output: false,
      code: `# ambil document yang tidak ada
GET /products/_doc/9999

# tulis tipe data yang tidak valid
PUT /products/_doc/1002
{
  "price": "murah banget"
}

# bulk dengan baris tidak valid (JSON terputus)
POST /products/_bulk
{"index":{"_id":"p-bad"}}
{"name":"Baris ini tidak ditutup`,
      explain: [
        'Document tidak ada menghasilkan <code>found: false</code> dengan status 404 — bukan error fatal, melainkan jawaban jujur &quot;tidak ada&quot;.',
        '<code>price</code> bertipe numerik (otomatis dipetakan dari angka pertama), jadi string membuat <code>mapper_parsing_exception</code>; pesan error menyebut field bermasalah — baca pesannya, jangan panik.',
        'Bulk yang cacat memberi respons berisi array <code>errors: true</code> beserta rincian per baris — setiap kegagalan punya index barisnya sendiri, sehingga kamu bisa memperbaiki hanya bagian yang rusak.',
        'Kebiasaan membaca error adalah 50% keterampilan memakai REST API: setiap pesan Elasticsearch menyebut <code>type</code> error dan <code>reason</code>-nya, dan keduanya hampir selalu cukup untuk menebak perbaikannya.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan umum di CRUD dan Bulk',
      text: '<ul><li><b>Lupa header <code>Content-Type: application/json</code></b> saat memakai <code>curl</code> — Elasticsearch menolak body dengan pesan <code>Content-Type header is not supported</code>.</li><li><b>PUT dipakai untuk memperbarui sebagian</b> — PUT mengganti seluruh dokumen; untuk mengubah satu field gunakan <code>POST /_update</code> dengan body <code>doc</code>.</li><li><b>Baris NDJSON tanpa newline di akhir</b> — bulk ditolak; akhiri file dengan satu baris kosong atau tambahkan <code>echo</code> saat menulis dari script.</li><li><b>Melanggar pola aksi–data pada bulk</b> — baris aksi harus berpasangan dengan baris data; satu baris hilang membuat seluruh sisa bulk gagal terurai.</li><li><b>Menganggap <code>_id</code> sama dengan field bisnis</b> — <code>_id</code> menentukan identitas dokumen; menggantinya berarti membuat dokumen baru dan meninggalkan yang lama.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Berlatih CRUD dengan pola satu perintah, satu pertanyaan',
      text: '<p>Setiap kali menjalankan perintah, tuliskan dulu dugaanmu: &quot;ini akan menghasilkan status berapa? <code>result</code> apa?&quot; baru tekan Enter. Kalau dugaanmu meleset, baca response sampai ketemu field yang menjelaskan. Kebiasaan ini melatihmu membaca API secara aktif, dan dalam beberapa hari kamu akan membaca <code>result: created</code>, <code>updated</code>, <code>deleted</code> tanpa berpikir panjang.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['REST API', 'Antarmuka berbasis HTTP dengan method dan path; seluruh Elasticsearch diakses lewat cara ini.'],
        ['Document', 'Unit data terkecil, berupa JSON satu objek; disimpan di dalam index.'],
        ['Index', 'Kumpulan document yang punya mapping dan setting serupa; ibat tabel dalam database relasional.'],
        ['_id', 'Identitas unik document dalam index; bisa ditentukan sendiri atau dibuat server.'],
        ['_source', 'Isi asli document yang disimpan Elasticsearch sehingga bisa dikirim balik ke klien.'],
        ['_version', 'Angka yang bertambah setiap kali document diubah — penanda versi untuk konflik tulis.'],
        ['Bulk API', 'Endpoint <code>_bulk</code> untuk mengirim banyak aksi dalam satu request HTTP.'],
        ['NDJSON', 'Format: satu objek JSON per baris, dipisah newline; dipakai bulk Elasticsearch.'],
        ['_cat API', 'Kumpulan endpoint <code>/_cat/*</code> yang menampilkan informasi cluster dalam format tabel ringkas.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Buat index <code>employees</code>, lalu masukkan minimal 10 document employee dengan <code>PUT</code> (id eksplisit) dan <code>POST</code> (id dari server); ambil kembali dua di antaranya dengan <code>GET</code>.</li><li>Perbarui nama dan department satu employee lewat <code>POST /_update</code>, lalu hapus satu document lain dan amati field <code>result</code> pada tiap respons.</li><li>Tanam 20 product sekaligus dengan Bulk API, periksa <code>errors</code> pada response, lalu tampilkan daftarnya lewat <code>_cat/indices?v</code> dan <code>_cat/shards?v</code>.</li><li><b>Checkpoint:</b> mampu menjalankan CRUD penuh tanpa melihat catatan, menulis bulk NDJSON yang valid, dan membaca response/error Elasticsearch untuk menentukan langkah berikutnya.</li></ol>'
    }
  ],
  recap: [
    'Seluruh Elasticsearch diakses lewat <b>HTTP + JSON</b>: method menentukan aksi, path menentukan target (<code>index/_doc/id</code>).',
    'CRUD: <code>PUT</code> membuat/mengganti dengan id, <code>POST</code> membuat dengan id server, <code>GET</code> membaca, <code>POST /_update</code> memperbarui sebagian, <code>DELETE</code> menghapus.',
    'Respons Elasticsearch bercerita lewat <code>_index</code>, <code>_id</code>, <code>_version</code>, dan <code>result</code> — baca field ini, jangan hanya melihat status code.',
    '<b>Bulk API</b> memakai NDJSON berpasangan aksi–data dan wajib diakhiri newline; inilah cara menanam data yang efisien dan idempotent.'
  ]
});
