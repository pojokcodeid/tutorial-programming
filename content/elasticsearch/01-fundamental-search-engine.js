/* ============================================================
   Pelajaran Elasticsearch — 01: Fundamental Search Engine & Inverted Index
   ============================================================ */
'use strict';

window.ELASTICSEARCH_LESSONS = window.ELASTICSEARCH_LESSONS || [];

window.ELASTICSEARCH_LESSONS.push({
  id: 'fundamental-search-engine',
  title: 'Fundamental Search Engine & Inverted Index',
  chapter: 'Fondasi',
  duration: '12 menit',
  intro: [
    'Bayangkan kamu mencari resep &quot;nasi goreng&quot; di perpustakaan berisi 50.000 buku. Kalau caranya membaca semua buku halaman demi halaman, seharian pun tidak selesai. Tapi kalau ada kartu katalog yang mencatat setiap kata kunci beserta nomor bukunya, kamu cukup melihat kartu bertuliskan &quot;nasi goreng&quot; lalu langsung tahu buku mana yang harus dibuka. <b>Elasticsearch bekerja seperti kartu katalog itu</b>, dan struktur kartunya itu namanya inverted index.',
    'Di pelajaran ini kamu menimbang tiga pengelola data — search engine, database relasional, dan data warehouse — lalu membedah konsep inti Elasticsearch: document, JSON, index, field, inverted index, token dan term, relevancy score, serta perbedaan exact match dengan full-text search. Semua penjelasan dibangun dari dataset kecil yang bisa kamu gambar sendiri di kertas.',
    'Kita pakai simulasi tiga dokumen produk: Laptop Gaming, Laptop Office, dan Mechanical Keyboard. Dari dataset mini itu kamu akan menjawab empat pertanyaan klasik: bagaimana kata gaming menemukan dokumen, apa bedanya Laptop dengan laptop, kenapa hasil perlu relevancy score, dan apa bedanya search dengan filter. Setelah fondasi ini mantap, kamu lanjut merangkai lab Podman di pelajaran berikutnya.'
  ],
  objectives: [
    'Membedakan search engine, database relasional, dan data warehouse beserta situasi kapan masing-masing paling tepat dipakai',
    'Menjelaskan konsep document, JSON, index, dan field serta menghubungkannya dengan use case Elasticsearch',
    'Membangun inverted index secara manual dari tiga dokumen produk dan menjelaskan istilah token serta term',
    'Membedakan exact match dan full-text search serta menjelaskan peran relevancy score dibanding filter'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Search engine vs database vs data warehouse</h3><p>Ketiganya sama-sama menyimpan data, tapi <b>dirancang untuk menjawab pertanyaan yang berbeda</b>. Salah memilih sejak awal membuat performa aneh dan fitur yang tak kunjung jadi.</p><table><thead><tr><th>Pengelola data</th><th>Dirancang untuk</th><th>Lemah di</th></tr></thead><tbody><tr><td><b>Database relasional</b> (PostgreSQL, MySQL)</td><td>Transaksi yang konsisten (OLTP), relasi antar tabel, constraint, dan laporan kecil</td><td>Pencarian teks bebas: LIKE harus memindai baris dan tidak mengurutkan hasil berdasarkan relevansi</td></tr><tr><td><b>Search engine</b> (Elasticsearch)</td><td>Mencari term di dalam teks dengan cepat, mengurutkan hasil berdasarkan relevansi, analisis teks, dan skala ke jutaan dokumen</td><td>Transaksi kompleks dan konsistensi bergaya relasional</td></tr><tr><td><b>Data warehouse</b> (ClickHouse, BigQuery)</td><td>Analitik agregasi atas data historis besar (OLAP) yang diproses dalam batch</td><td>Mencari satu dokumen secara real-time menurut kata kunci</td></tr></tbody></table><p>Use case Elasticsearch yang paling sering kamu temui:</p><ul><li><b>Katalog produk</b> — pencarian nama/deskripsi, filter kategori dan harga, autocomplete.</li><li><b>Log dan observability</b> — mengumpulkan log aplikasi lalu mencari error spesifik dalam hitungan detik.</li><li><b>Search dokumen</b> — artikel, kontrak, wiki internal dengan pencarian penuh teks.</li><li><b>Autocomplete</b> — saran kata saat pengguna mengetik.</li><li><b>Analytics</b> — agregasi cepat seperti jumlah produk per kategori.</li></ul><blockquote style="border-left:3px solid var(--accent);padding-left:12px;margin:12px 0">Pertanyaan pemilihan yang sederhana: kalau yang kamu butuhkan adalah <b>menemukan dokumen berdasarkan isinya lalu mengurutkannya menurut kecocokan</b>, pakai search engine. Kalau yang dibutuhkan adalah transaksi yang selalu konsisten, tetap di database relasional — Elasticsearch biasanya berdiri di sampingnya, bukan menggantikannya.</blockquote>'
    },
    {
      type: 'text',
      html: '<h3>Anatomi data: document, JSON, field, index</h3><p>Elasticsearch memakai JSON sebagai bahasa datanya. Karena kamu sudah kenal JSON, konsep Elasticsearch terasa seperti memindahkan istilah saja:</p><table><thead><tr><th>Di JSON</th><th>Di Elasticsearch</th><th>Keterangan</th></tr></thead><tbody><tr><td>Satu objek dengan beberapa key</td><td><b>Document</b></td><td>Unit terkecil yang disimpan dan dicari, mirip satu baris di SQL</td></tr><tr><td>Satu pasang key dan value</td><td><b>Field</b></td><td>Mirip kolom, tapi beda dokumen boleh punya field berbeda</td></tr><tr><td>Kumpulan objek yang serupa</td><td><b>Index</b></td><td>Mirip tabel, tempat seluruh document sejenis dikumpulkan</td></tr><tr><td>Nilai pada sebuah key</td><td><b>Field value</b></td><td>Bisa teks, angka, tanggal, boolean, array, bahkan objek bersarang</td></tr></tbody></table><p>Bedanya dengan SQL: kamu tidak perlu membuat daftar kolom lebih dulu sebelum memasukkan data. Elasticsearch bisa menebak tipe field sendiri (disebut <i>dynamic mapping</i>) — fitur yang nyaman, tapi juga sumber kejutan yang akan kamu bedah tuntas di pelajaran Index &amp; Mapping.</p>'
    },
    {
      type: 'example',
      title: 'Dataset simulasi: tiga dokumen produk',
      lang: 'json',
      output: false,
      code: `[
  { "id": 1, "name": "Laptop Gaming", "description": "Laptop untuk gaming" },
  { "id": 2, "name": "Laptop Office", "description": "Laptop untuk pekerjaan kantor" },
  { "id": 3, "name": "Mechanical Keyboard", "description": "Keyboard untuk gaming dan mengetik" }
]`,
      explain: [
        'Setiap objek dalam array adalah satu <b>document</b> — unit yang nantinya disimpan di Elasticsearch, bukan baris dalam satu tabel besar.',
        'Tiap pasang key dan value adalah satu <b>field</b>: <code>id</code>, <code>name</code>, dan <code>description</code>. Nama field inilah yang nanti menjadi kolom inverted index.',
        'Ketiga dokumen ini akan dikumpulkan ke dalam satu <b>index</b> (misalnya <code>products</code>), sehingga pencarian &quot;gaming&quot; cukup menyasar satu index saja.',
        'Perhatikan teks deskripsi: &quot;untuk&quot; dan &quot;dan&quot; adalah kata penghubung yang biasanya dibuang saat analisis teks — ini yang membuat istilah token dan term penting dibahas berikutnya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Inverted index: kenapa pencarian bisa cepat</h3><p>Database konvensional mencari dengan memindai data (table scan): setiap baris diperiksa satu per satu sampai ketemu. Search engine membalik cara pandangnya — bukan &quot;dokumen mana yang mengandung kata ini&quot;, melainkan <b>&quot;kata ini ada di dokumen mana saja&quot;</b>. Pembalikan itulah yang disebut <b>inverted index</b>.</p><p>Dari tiga dokumen dataset, berikut inverted index yang terbentuk setelah teks dipecah menjadi term:</p><table><thead><tr><th>Term</th><th>Dokumen</th></tr></thead><tbody><tr><td><code>laptop</code></td><td>1, 2</td></tr><tr><td><code>gaming</code></td><td>1, 3</td></tr><tr><td><code>office</code></td><td>2</td></tr><tr><td><code>mechanical</code></td><td>3</td></tr><tr><td><code>keyboard</code></td><td>3</td></tr><tr><td><code>kantor</code></td><td>2</td></tr></tbody></table><p>Waktu pencarian tidak lagi bergantung pada jumlah teks di seluruh dokumen, melainkan pada panjang daftar term — itu sebabnya Elasticsearch tetap responsif walau datanya jutaan dokumen.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Inverted index memetakan tiga dokumen produk menjadi daftar term: gaming menunjuk dokumen 1 dan 3, laptop menunjuk dokumen 1 dan 2, lalu pencarian gaming mengembalikan dokumen 1 dan 3">
        <text x="20" y="34" class="u-title" text-anchor="start">Inverted index: teks mentah menjadi term -&gt; dokumen</text>
        <rect x="20" y="52" width="250" height="190" rx="10" class="u-box"/>
        <text x="145" y="78" class="u-title" text-anchor="middle">Dokumen (JSON)</text>
        <rect x="36" y="92" width="218" height="34" rx="6" class="u-hd"/>
        <text x="145" y="114" class="u-lbl" text-anchor="middle">1 — Laptop Gaming</text>
        <rect x="36" y="132" width="218" height="34" rx="6" class="u-box"/>
        <text x="145" y="154" class="u-lbl" text-anchor="middle">2 — Laptop Office</text>
        <rect x="36" y="172" width="218" height="34" rx="6" class="u-box"/>
        <text x="145" y="194" class="u-lbl" text-anchor="middle">3 — Mechanical Keyboard</text>
        <line x1="276" y1="137" x2="316" y2="137" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="296" y="125" class="u-lbl" text-anchor="middle">tokenisasi</text>
        <rect x="322" y="52" width="250" height="190" rx="10" class="u-box"/>
        <text x="447" y="78" class="u-title" text-anchor="middle">Inverted index</text>
        <rect x="336" y="92" width="222" height="26" rx="6" class="u-hd"/>
        <text x="447" y="110" class="u-lbl" text-anchor="middle">gaming -&gt; 1, 3</text>
        <rect x="336" y="124" width="222" height="26" rx="6" class="u-box"/>
        <text x="447" y="142" class="u-lbl" text-anchor="middle">laptop -&gt; 1, 2</text>
        <rect x="336" y="156" width="222" height="26" rx="6" class="u-box"/>
        <text x="447" y="174" class="u-lbl" text-anchor="middle">office -&gt; 2</text>
        <rect x="336" y="188" width="222" height="26" rx="6" class="u-box"/>
        <text x="447" y="206" class="u-lbl" text-anchor="middle">keyboard -&gt; 3</text>
        <line x1="578" y1="137" x2="616" y2="137" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="597" y="125" class="u-lbl" text-anchor="middle">cari: gaming</text>
        <rect x="622" y="88" width="120" height="100" rx="8" class="u-hd"/>
        <text x="682" y="114" class="u-lbl" text-anchor="middle">Hasil</text>
        <text x="682" y="144" class="u-lbl" text-anchor="middle">dokumen 1</text>
        <text x="682" y="174" class="u-lbl" text-anchor="middle">dokumen 3</text>
        <text x="380" y="272" class="u-lbl" text-anchor="middle">tanpa inverted index, setiap pencarian harus memindai seluruh teks dokumen</text>
      </svg></div><figcaption>Tiga dokumen dipecah menjadi term, lalu tiap term menyimpan daftar dokumen yang memilikinya — pencarian &quot;gaming&quot; langsung menunjuk dokumen 1 dan 3.</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Token, term, relevancy score, dan dua jenis pencarian</h3><p>Sebelum masuk ke inverted index, teks dipecah lebih dulu oleh proses bernama <i>analyzer</i> (dibahas tuntas di pelajaran Analyzer). Hasil pecahan itulah <b>token</b>, dan nilai unik yang disimpan sebagai kunci index adalah <b>term</b>.</p><ul><li><b>Token</b> — satu potongan hasil pemecahan teks. Kalimat &quot;Laptop untuk gaming&quot; menjadi tiga token: <code>laptop</code>, <code>untuk</code>, <code>gaming</code>.</li><li><b>Term</b> — nilai unik yang benar-benar disimpan di inverted index. Kata penghubung seperti &quot;untuk&quot; sering dibuang sebagai stop word, sehingga term yang tersisa tinggal <code>laptop</code> dan <code>gaming</code>.</li></ul><p><b>Relevancy score</b> muncul ketika banyak dokumen yang cocok. Elasticsearch memberi skor pada tiap hasil (field <code>_score</code>): term yang langka, muncul berulang, atau berada di field penting mendapat skor lebih tinggi, sehingga hasil paling relevan berada di urutan atas.</p><table><thead><tr><th>Aspek</th><th>Exact match</th><th>Full-text search</th></tr></thead><tbody><tr><td><b>Yang dicari</b></td><td>Nilai persis satu term</td><td>Banyak kata di dalam teks bebas</td></tr><tr><td><b>Sifat hasil</b></td><td>Lulus atau gugur, tanpa skor</td><td>Diurutkan menurut relevancy score</td></tr><tr><td><b>Cocok untuk</b></td><td>Kategori, status, email, ID</td><td>Nama produk, deskripsi, artikel</td></tr><tr><td><b>Contoh pertanyaan</b></td><td>Kategori = laptop</td><td>Cari &quot;laptop gaming murah&quot;</td></tr></tbody></table><p>Di sinilah perbedaan <b>search</b> dan <b>filter</b>: search memberi skor dan boleh longgar (dokumen dengan separuh kata cocok tetap muncul, hanya peringkatnya lebih rendah), sementara filter bersifat kaku — lulus atau gugur, tanpa skor, dan hasilnya bisa disimpan di cache. Aplikasi nyata hampir selalu memakai keduanya: filter menyaring, search mengurutkan.</p>'
    },
    {
      type: 'example',
      title: 'Diskusi: gaming vs Laptop vs laptop, relevansi vs filter',
      lang: 'text',
      output: false,
      code: `PERTANYAAN 1 — kata "gaming" menemukan dokumen mana?
inverted index "gaming" -> [1, 3]
hasil: dokumen 1 (Laptop Gaming) dan dokumen 3 (Mechanical Keyboard)

PERTANYAAN 2 — "Laptop" dan "laptop" berbeda?
analyzer standar menurunkan huruf besar ke huruf kecil
"Laptop" -> laptop   dan   "laptop" -> laptop
hasil: keduanya menemukan dokumen 1 dan dokumen 2

PERTANYAAN 3 — kenapa hasil perlu relevancy score?
dokumen 1 dan 2 sama-sama mengandung "laptop"
urutan ditentukan skor kecocokan, bukan urutan id atau nama

PERTANYAAN 4 — search dan filter beda apa?
search  "laptop gaming murah" -> skor, diurutkan, boleh longgar
filter  category = laptop     -> kaku, tanpa skor, bisa di-cache`,
      explain: [
        'Pertanyaan 1 dibalas oleh inverted index dalam satu langkah: mengambil daftar di balik term <code>gaming</code> tanpa menyentuh dokumen lain — inilah sumber kecepatan yang kamu lihat di figur sebelumnya.',
        'Pertanyaan 2 dijawab oleh analyzer, bukan oleh keberuntungan: huruf besar-kecil diseragamkan saat indexing, jadi pencarian <code>laptop</code> tetap menemukan &quot;Laptop&quot;. Karena itu perbedaan huruf besar kecil bukan alasan hasil tidak muncul.',
        'Pertanyaan 3 menunjukkan bahwa <b>urutan</b> bukan hal otomatis: tanpa skor, kamu hanya mendapat daftar cocok-tidak-cook; dengan <code>_score</code>, dokumen yang paling mengena diurutkan paling atas.',
        'Pertanyaan 4 adalah jebakan klasik pemula: memakai pencarian untuk menyaring kategori membuat hasil &quot;meleset&quot; dan skor tidak berguna. Kategori, harga, dan status bekerja paling baik sebagai filter.'
      ]
    },
    {
      type: 'example',
      title: 'Gambaran arsitektur Elasticsearch dalam satu blok',
      lang: 'text',
      output: false,
      code: `[ Aplikasi / Kibana / curl ]
            |  HTTP ke http://localhost:9200
            v
[ Elasticsearch: cluster ]
  |-- node (lab memakai single-node)
  |     |-- index products
  |     |     |-- shard primary  : dokumen + inverted index
  |     |     +-- shard replica  : salinan (butuh node lain)
  |     +-- tugas: menerima request, menghitung skor, aggregasi
  +-- cluster state: daftar index, node, dan alokasi shard`,
      explain: [
        'Semua interaksi lewat satu pintu HTTP di <code>http://localhost:9200</code> — tidak ada driver khusus, cukup method, path, dan body JSON (pelajaran berikutnya kamu menyalakan labnya dengan tag versi 8.17.0).',
        'Di dalam sebuah <b>index</b>, data dipecah menjadi beberapa <b>shard</b>: shard primary menyimpan dokumen beserta inverted index-nya, shard replica adalah salinan untuk ketahanan.',
        '<b>Cluster</b> adalah kumpulan node yang bekerja sebagai satu kesatuan dan menyimpan cluster state — daftar index, siapa pemilik shard, dan sehat tidaknya tiap bagian.',
        'Untuk lab pemula, satu node sudah cukup (mode single-node); sharding dan replica baru terasa gunanya saat kamu menyentuh arsitektur terdistribusi di pelajaran tersendiri.'
      ]
    },
    {
      type: 'example',
      title: 'Pratinjau: seperti apa bentuk satu pencarian',
      lang: 'http',
      output: false,
      code: `GET /products/_search
{
  "query": {
    "match": { "name": "gaming" }
  }
}`,
      explain: [
        'Baris pertama adalah endpoint pencarian: method <code>GET</code> ke index <code>products</code> lewat endpoint <code>_search</code> — bentuk yang akan kamu ketik di Kibana Dev Tools atau terjemahkan menjadi curl ke <code>http://localhost:9200</code>.',
        'Blok <code>query</code> berisi maksud pencarianmu; <code>match</code> adalah query full-text yang meng-analyze kata &quot;gaming&quot; dulu, baru mencocokkannya ke inverted index.',
        'Field <code>name</code> menentukan kolom yang disasar — tanpa penyebutan field, pencarian menyebar ke semua field teks dan hasilnya lebih sulit ditebak.',
        'Request ini baru benar-benar berjalan setelah lab Podman di pelajaran 02 menyala; di sini kamu cukup menghafal bentuknya dulu. Catatan lab: konfigurasi kita memakai security nonaktif agar mudah mencoba — itu khusus lab, bukan untuk produksi.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan umum memahami search engine',
      text: '<ul><li><b>Menganggap Elasticsearch pengganti database</b> — dia hebat mencari dan mengurutkan, tapi bukan tempat transaksi yang butuh konsistensi ketat. Pola yang lazim: database sebagai sumber kebenaran, index sebagai data turunan.</li><li><b>Mengira LIKE dan full-text search itu sama</b> — LIKE memindai baris dan tidak memberi peringkat; full-text search memakai inverted index plus relevancy score.</li><li><b>Menganggap urutan hasil itu acak</b> — kalau urutannya terasa aneh, yang berbicara adalah skor kecocokan, bukan huruf awal nama.</li><li><b>Memakai pencarian untuk menyaring kategori</b> — kategori, status, dan harga seharusnya masuk filter; pencarian diserahkan pada teks bebas seperti nama dan deskripsi.</li><li><b>Langsung menyalakan cluster produksi dari contoh lab</b> — seluruh contoh di bab ini memakai endpoint <code>http://localhost:9200</code> dengan security nonaktif khusus lab belajar; jangan pernah konfigurasi itu dipindah ke jaringan publik.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Belajar inverted index dengan tangan sendiri',
      text: '<p>Cara tercepat memahami konsep ini: tulis tiga dokumen produk di kertas, lalu <b>pecah teksnya menjadi kata</b> dan buat tabel term ke dokumen seperti di pelajaran ini. Tambahkan pertanyaan &quot;laptop&quot; dan hitung sendiri dokumen mana yang muncul. Setelah kamu bisa membangun tabelnya tanpa melihat tutorial, konsep relevansi dan filter akan terasa sebagai kelanjutan alami, bukan materi baru yang harus dihafal. Simpan catatan itu — di pelajaran Query DSL kamu akan membukanya kembali untuk membandingkan teori dengan hasil nyata.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Search engine', 'Sistem yang membangun struktur khusus untuk mencari term dalam teks dengan cepat, lalu mengurutkan hasilnya berdasarkan relevansi.'],
        ['Document', 'Unit data terkecil Elasticsearch berupa satu objek JSON, mirip satu baris tabel di SQL.'],
        ['Field', 'Satu pasang key dan value di dalam document, mirip kolom — beda dokumen boleh punya field berbeda.'],
        ['Index', 'Kumpulan document sejenis beserta inverted index-nya, mirip tabel di database relasional.'],
        ['Inverted index', 'Struktur yang memetakan tiap term ke daftar dokumen yang memilikinya sehingga pencarian tidak perlu memindai seluruh teks.'],
        ['Token', 'Satu potongan hasil pemecahan teks oleh analyzer sebelum disimpan sebagai term.'],
        ['Term', 'Nilai unik di inverted index yang menjadi kunci pencarian, misalnya laptop atau gaming.'],
        ['Relevancy score', 'Skor kecocokan tiap hasil pencarian (field _score) yang menentukan urutan dokumen paling relevan di atas.'],
        ['Exact match', 'Pencarian nilai persis satu term tanpa skor — cocok untuk kategori, status, email, dan ID.'],
        ['Full-text search', 'Pencarian bebas atas teks yang memecah kata, mencocokkan banyak term, lalu mengurutkan hasil menurut relevansi.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Tulis kembali tabel inverted index dari tiga dokumen dataset <b>tanpa melihat pelajaran</b>, lalu jawab: dokumen mana yang muncul untuk kata <code>keyboard</code> dan <code>kantor</code>?</li><li>Bandingkan SQL <code>SELECT * FROM products WHERE name LIKE &quot;%laptop%&quot;</code> dengan pencarian full-text dalam empat baris: kecepatan, urutan hasil, uraian kata, dan biaya saat data bertambah jutaan baris.</li><li>Berikan dua contoh pertanyaan pengguna yang cocok sebagai <b>search</b> dan dua contoh yang cocok sebagai <b>filter</b>, lengkap dengan alasan pemilihannya.</li><li><b>Checkpoint:</b> mampu menjelaskan perbedaan search engine, database, dan data warehouse serta menggambar alur teks dokumen → token → term → inverted index → hasil berurutan dengan bahasamu sendiri.</li></ol>'
    }
  ],
  recap: [
    '<b>Elasticsearch adalah search engine, bukan pengganti database transaksional</b> — kuat pada pencarian teks dan peringkat, berdampingan dengan database sebagai sumber kebenaran.',
    'Data berbentuk <b>document JSON</b> yang dikumpulkan dalam <b>index</b>, dan setiap key di dalamnya menjadi <b>field</b> yang bisa dianalisis.',
    '<b>Inverted index memetakan term ke daftar dokumen</b>, seharian kata &quot;gaming&quot; langsung menunjuk dokumen 1 dan 3 tanpa memindai seluruh teks.',
    '<b>Full-text search mengurutkan hasil lewat relevancy score</b>, sementara filter bersifat kaku tanpa skor — keduanya hampir selalu dipakai bersamaan di aplikasi nyata.'
  ]
});
