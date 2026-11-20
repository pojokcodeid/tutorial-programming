/* ============================================================
   Pelajaran Elasticsearch — 04: Index, Mapping & Data Modeling
   (Roadmap Level 3 — bab Data & Indexing)
   ============================================================ */
'use strict';

window.ELASTICSEARCH_LESSONS = window.ELASTICSEARCH_LESSONS || [];

window.ELASTICSEARCH_LESSONS.push({
  id: 'index-mapping',
  title: 'Index, Mapping & Data Modeling',
  chapter: 'Data & Indexing',
  duration: '16 menit',
  intro: [
    'Bayangkan kamu memasukkan surat ke sebuah arsip. Kalau petugasnya bebas menaruh surat di laci mana saja tanpa label, satu tahun kemudian tidak ada yang bisa menemukan apa-apa. <b>Mapping adalah sistem label dan laci itu</b> — ia memberi tahu Elasticsearch bagaimana membaca setiap field: mana yang diperlakukan sebagai teks penuh, mana yang harus persis, mana angka, mana tanggal.',
    'Pelajaran ini membedakan dua jalan: <b>dynamic mapping</b> (Elasticsearch menebak tipe dari data pertama yang masuk) dan <b>explicit mapping</b> (kamu menentukan sendiri sebelum data masuk). Untuk aplikasi nyata, jalan kedua yang menang — teka-teki mesin sering salah menebak, dan mengubah tebakan itu di kemudian hari tidak selalu murah.',
    'Kamu akan menulis mapping eksplisit untuk index <code>employees</code>, memahami tabel data types, membedakan <code>text</code> dari <code>keyword</code>, menambah multi-field untuk nama, membuat alias, sampai melakukan reindex ketika struktur harus berubah. Ini adalah pelajaran paling menentukan kualitas pencarianmu nanti: kesalahan di sini baru terasa sebagai query yang tidak pernah cocok.'
  ],
  objectives: [
    'Membedakan dynamic mapping dan explicit mapping beserta konsekuensinya',
    'Memilih tipe data yang tepat untuk tiap field dari tabel data types Elasticsearch',
    'Menjelaskan perbedaan <code>text</code> dan <code>keyword</code> serta kapan multi-field diperlukan',
    'Membuat alias dan melakukan reindex ketika struktur index harus berubah'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Apa yang sebenarnya disimpan di balik sebuah dokumen?</h3><p>Ketika kamu mengirim JSON ke Elasticsearch, ia tidak menyimpannya begitu saja seperti database menyimpan baris. Ia <b>mengubahnya menjadi struktur pencarian</b>: teks dipecah menjadi term, angka disimpan dalam format yang bisa dibandingkan, dan tanggal dinormalisasi. Struktur inilah yang disebut <b>mapping</b>, dan ia menentukan segalanya — apakah &quot;laptop gaming&quot; bisa ditemukan, apakah harga bisa difilter, apakah tanggal bisa diurutkan.</p><table><thead><tr><th>Konsep</th><th>Pertanyaan yang dijawab</th><th>Contoh</th></tr></thead><tbody><tr><td>Document</td><td>Apa satu entitas?</td><td>Satu produk, satu karyawan</td></tr><tr><td>Field</td><td>Satu aspek entitas bernilai apa?</td><td><code>price</code>: 750000</td></tr><tr><td>Mapping</td><td>Bagaimana field dibaca &amp; diperlakukan?</td><td><code>price</code> bertipe <code>long</code></td></tr><tr><td>Index</td><td>Di mana kumpulan document serupa?</td><td><code>products</code>, <code>employees</code></td></tr></tbody></table><p>Perhatikan hubungan mapping dengan perilaku query: field <code>text</code> dianalyzer sehingga cocok untuk pencarian penuh, sedangkan <code>keyword</code> disimpan utuh sehingga cocok untuk filter, sorting, dan aggregation. Memilih salah satu di awal = memilih gagal atau berhasil di akhir.</p>'
    },
    {
      type: 'example',
      title: 'Dynamic mapping: biarkan menebak dulu, amati tebakannya',
      lang: 'http',
      output: false,
      code: `# buat index tanpa mappings sama sekali
PUT /employees-dynamic

# masukkan satu document, lalu periksa tebakan mesin
POST /employees-dynamic/_doc
{
  "employee_id": "E-1001",
  "full_name": "Asep Komarudin",
  "email": "asep@example.com",
  "salary": 8500000,
  "is_active": true,
  "join_date": "2024-03-01"
}

GET /employees-dynamic/_mapping`,
      explain: [
        '<code>PUT /employees-dynamic</code> tanpa <code>mappings</code> membuat index kosong; mapping baru terbentuk saat document pertama masuk.',
        'Elasticsearch menebak dari nilai nyata: string menjadi <code>text</code> dengan sub-field <code>keyword</code>, angka menjadi <code>long</code>, boolean menjadi <code>boolean</code>, dan string berformat tanggal menjadi <code>date</code>.',
        '<code>GET /_mapping</code> menampilkan tebakan itu — bacalah: bila <code>employee_id</code> ternyata <code>text</code>, kamu baru menyadari bahwa filter persis padahal belum pernah kamu uji.',
        'Dynamic mapping memudahkan eksperimen cepat, tapi tebakannya berdasar <b>satu document pertama</b> — data campuran di kemudian hari bisa memicu error atau tebakan yang salah arah.'
      ]
    },
    {
      type: 'example',
      title: 'Explicit mapping: tentukan sendiri sebelum data masuk',
      lang: 'http',
      output: false,
      code: `PUT /employees
{
  "mappings": {
    "properties": {
      "employee_id": { "type": "keyword" },
      "full_name": {
        "type": "text",
        "fields": {
          "keyword": { "type": "keyword" }
        }
      },
      "email": { "type": "keyword" },
      "department": { "type": "keyword" },
      "position": { "type": "text" },
      "salary": { "type": "long" },
      "is_active": { "type": "boolean" },
      "join_date": { "type": "date" }
    }
  }
}`,
      explain: [
        '<code>mappings.properties</code> adalah daftar field beserta tipenya; menulisnya sebelum data masuk membuat perilaku pencarian dapat diprediksi sejak awal.',
        '<code>employee_id</code> dan <code>email</code> memakai <code>keyword</code> karena selalu dicari persis — tidak masuk akal mencari &quot;asep&quot; di tengah alamat email.',
        '<code>full_name</code> memakai <code>text</code> agar bisa dicari &quot;komarudin asep&quot;, namun ia diberi sub-field <code>keyword</code> lewat <code>fields</code> agar tetap bisa di-sort dan di-aggregate — satu field, dua kemampuan.',
        '<code>salary</code> memakai <code>long</code> (bukan <code>text</code>) sehingga <code>range</code> dan <code>avg</code> bekerja secara numerik; <code>join_date</code> memakai <code>date</code> agar mendukung operator tanggal dan format ISO 8601.'
      ]
    },
    {
      type: 'text',
      html: '<h3>text vs keyword: dua perlakuan yang berbeda</h3><p>Ini perbedaan paling sering salah dipahami pemula. <code>text</code> melewati <b>analyzer</b> — teks dipecah, huruf diseragamkan, dan bisa difilter kata henti. <code>keyword</code> disimpan sebagai satu utuh, persis seperti yang kamu tulis. Karena itu pemakaiannya bertolak belakang.</p><table><thead><tr><th>Aspek</th><th><code>text</code></th><th><code>keyword</code></th></tr></thead><tbody><tr><td>Perlakuan</td><td>Diproses analyzer (dipecah jadi term)</td><td>Disimpan sebagai satu nilai utuh</td></tr><tr><td>Cocok untuk</td><td>Pencarian penuh, relevansi</td><td>Pencocokan persis, filter, sort, aggregasi</td></tr><tr><td>Query tepat</td><td><code>match</code></td><td><code>term</code>, <code>terms</code>, <code>range</code></td></tr><tr><td>Contoh field</td><td><code>position</code>, deskripsi</td><td><code>email</code>, <code>department</code>, status</td></tr><tr><td>Bisa sorting?</td><td>Tidak disarankan (field data)</td><td>Ya, ringan</td></tr></tbody></table><h3>Data types yang perlu kamu kenal</h3><table><thead><tr><th>Tipe</th><th>Untuk</th><th>Catatan</th></tr></thead><tbody><tr><td><code>text</code></td><td>Teks penuh</td><td>Lewat analyzer</td></tr><tr><td><code>keyword</code></td><td>Nilai persis</td><td>Tag, kategori, email</td></tr><tr><td><code>integer</code>/<code>long</code></td><td>Bulat</td><td><code>long</code> untuk angka besar</td></tr><tr><td><code>float</code>/<code>double</code></td><td>Desimal</td><td>Harga, rating</td></tr><tr><td><code>boolean</code></td><td>Ya/tidak</td><td><code>is_active</code></td></tr><tr><td><code>date</code></td><td>Waktu</td><td>Format ISO 8601</td></tr><tr><td><code>object</code></td><td>JSON bersarang</td><td>Diratakan saat indexing</td></tr><tr><td><code>nested</code></td><td>Daftar objek</td><td>Pertahankan hubungan per elemen</td></tr><tr><td><code>ip</code>, <code>geo_point</code></td><td>Alamat IP, koordinat</td><td>Tipe khusus untuk kasus khusus</td></tr></tbody></table>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Perbandingan dynamic mapping dan explicit mapping: dynamic mapping menebak tipe dari data pertama lalu sering salah, explicit mapping ditulis di awal sehingga query dapat diprediksi, keduanya menghasilkan struktur index yang dibaca Elasticsearch saat indexing dan pencarian">
        <text x="30" y="34" class="u-title" text-anchor="start">Dynamic vs Explicit mapping</text>
        <rect x="30" y="58" width="330" height="104" rx="10" class="u-box"/>
        <text x="195" y="84" class="u-title" text-anchor="middle">Dynamic (menebak)</text>
        <text x="195" y="114" class="u-lbl" text-anchor="middle">data pertama masuk → mesin menebak tipe</text>
        <text x="195" y="140" class="u-lbl" text-anchor="middle">cepat untuk eksperimen, rawan salah tebak</text>
        <rect x="400" y="58" width="330" height="104" rx="10" class="u-hd"/>
        <text x="565" y="84" class="u-title" text-anchor="middle">Explicit (kamu menentukan)</text>
        <text x="565" y="114" class="u-lbl" text-anchor="middle">mappings.properties ditulis di awal</text>
        <text x="565" y="140" class="u-lbl" text-anchor="middle">query &amp; performa dapat diprediksi</text>
        <line x1="195" y1="170" x2="195" y2="212" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="565" y1="170" x2="565" y2="212" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="200" y="218" width="360" height="64" rx="10" class="u-hd"/>
        <text x="380" y="244" class="u-lbl" text-anchor="middle">Index: struktur field dibaca Elasticsearch</text>
        <text x="380" y="268" class="u-lbl" text-anchor="middle">saat indexing (tulis) dan search (baca)</text>
        <text x="380" y="306" class="u-lbl" text-anchor="middle">mapping hanya bisa ditambah, sebagian ubahan butuh reindex</text>
      </svg></div><figcaption>Dynamic mapping memudahkan percobaan; explicit mapping menjamin prediktabilitas — dan keduanya menghasilkan struktur yang tidak bisa diubah sembarangan setelah data masuk.</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Multi-field, alias, dan membaca mapping',
      lang: 'http',
      output: false,
      code: `# bandingkan pencarian ke full_name dan full_name.keyword
GET /employees/_search
{ "query": { "match": { "full_name": "asep komarudin" } } }

GET /employees/_search
{ "query": { "term": { "full_name.keyword": "Asep Komarudin" } } }

# buat alias sebagai nama pengganti
POST /_aliases
{
  "actions": [
    { "add": { "index": "employees", "alias": "employees_current" } }
  ]
}

# pakai alias seolah index asli
GET /employees_current/_count

# periksa mapping kapan saja
GET /employees/_mapping`,
      explain: [
        'Query pertama menemukan dokumen walau urutan kata berbeda karena <code>text</code> dianalyzer; query kedua menuntut kecocokan persis pada <code>full_name.keyword</code> — inilah bukti nyata dua perlakuan berbeda dalam satu field.',
        '<code>_aliases</code> menambahkan nama pengganti; kini aplikasi boleh menulis ke <code>employees_current</code> tanpa tahu nama index aslinya.',
        'Manfaat alias: saat kamu membuat index baru (misal dengan mapping terkini), kamu cukup memindahkan alias — tidak perlu mengubah konfigurasi aplikasi.',
        '<code>_mapping</code> dipanggil kapan saja untuk memeriksa struktur; biasakan mengeceknya sebelum menulis query ke field yang baru kamu tambahkan.'
      ]
    },
    {
      type: 'example',
      title: 'Reindex: mengubah struktur yang tidak bisa diubah',
      lang: 'http',
      output: false,
      code: `# 1) buat index baru dengan mapping yang benar
PUT /employees_v2
{
  "mappings": {
    "properties": {
      "employee_id": { "type": "keyword" },
      "full_name": {
        "type": "text",
        "fields": { "keyword": { "type": "keyword" } }
      },
      "salary": { "type": "long" },
      "join_date": { "type": "date" }
    }
  }
}

# 2) salin seluruh data dari index lama
POST /_reindex
{
  "source": { "index": "employees" },
  "dest": { "index": "employees_v2" }
}

# 3) verifikasi jumlah dokumen
GET /employees_v2/_count`,
      explain: [
        'Sebagian perubahan mapping (seperti mengubah <code>text</code> menjadi <code>keyword</code> pada field lama) <b>tidak didukung</b> — struktur lama sudah terlanjur membentuk index, jadi satu-satunya jalan adalah membuat index baru.',
        '<code>POST /_reindex</code> menyalin dokumen dari <code>source</code> ke <code>dest</code>; ia memakai scroll internal sehingga aman untuk jumlah dokumen besar.',
        'Urutan yang benar: buat index baru dengan mapping benar → reindex → pindahkan alias → verifikasi jumlah → baru arahkan aplikasi; jangan sebaliknya.',
        '<code>_count</code> memastikan jumlah dokumen di index baru sama dengan aslinya sebelum kamu membuang index lama — selalu verifikasi sebelum menghapus apa pun.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan umum data modeling',
      text: '<ul><li><b>Mengandalkan dynamic mapping untuk produksi</b> — tebakan pertama bisa jadi <code>text</code> padahal kamu butuh <code>keyword</code>; perbaikannya butuh reindex.</li><li><b>Memakai field bersarang bebas tanpa perencanaan</b> — setiap field baru otomatis ditambahkan; struktur yang liar membuat index membengkak dan query membingungkan (disebut mapping explosion).</li><li><b>Lupa sub-field keyword pada field teks</b> — sorting dan aggregasi atas nama produk tidak akan bisa dilakukan nanti tanpa <code>fields.keyword</code>.</li><li><b>Mengubah tipe field yang sudah ada</b> — Elasticsearch menolak; siapkan reindex sejak awal, bukan improvisasi di tengah kepanikan.</li><li><b>Memakai <code>nested</code> untuk semua data bersarang</b> — <code>nested</code> lebih mahal; pakai hanya bila hubungan per elemen benar-benar harus dipertahankan.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Tulis mapping dulu, baru code aplikasi',
      text: '<p>Sebelum menulis satu baris pun klien indexing di aplikasi, buat dulu index-nya dengan mapping eksplisit dan uji dengan dua atau tiga document contoh: satu <code>match</code>, satu <code>term</code>, satu <code>range</code>. Kalau ketiganya bekerja seperti dugaanmu, struktur itu layak dipakai. Kebiasaan ini mencegah kamu membangun seluruh endpoint search di atas field yang ternyata salah tipe — temuan yang paling mahal adalah temuan setelah aplikasi tayang.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Mapping', 'Definisi tipe dan perlakuan tiap field dalam index; menentukan bagaimana data dibaca Elasticsearch.'],
        ['Dynamic mapping', 'Pembuatan mapping otomatis oleh Elasticsearch berdasarkan data pertama yang masuk.'],
        ['Explicit mapping', 'Penentuan tipe field secara manual lewat <code>mappings.properties</code> sebelum data masuk.'],
        ['text', 'Tipe field teks penuh yang dianalyzer; cocok untuk pencarian relevan, bukan untuk filter persis.'],
        ['keyword', 'Tipe nilai utuh tanpa analyzer; cocok untuk filter, sorting, dan aggregation.'],
        ['Multi-field', 'Satu field dengan lebih dari satu tipe lewat blok <code>fields</code>, misal <code>full_name.keyword</code>.'],
        ['Reindex', 'Proses menyalin dokumen dari index lama ke index baru dengan struktur berbeda (<code>POST /_reindex</code>).'],
        ['Alias', 'Nama pengganti untuk index yang bisa dipindahkan antar index tanpa mengubah aplikasi.'],
        ['Mapping explosion', 'Kondisi jumlah field membengkak karena struktur data terlalu liar — memori dan performa ikut terpengaruh.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Buat index <code>employees</code> dengan mapping eksplisit sesuai contoh, masukkan document dengan berbagai field, lalu periksa strukturnya lewat <code>GET /employees/_mapping</code>.</li><li>Sengaja masukkan data yang salah tipe (misal <code>salary</code> berupa teks) dan baca error response-nya; catat pesan apa yang muncul.</li><li>Bandingkan query ke <code>full_name</code> dan <code>full_name.keyword</code> — buktikan sendiri bedanya pada hasil dan <code>_score</code>.</li><li>Buat alias <code>employees_current</code>, lalu latih reindex: buat <code>employees_v2</code>, salin datanya, dan verifikasi jumlahnya. <b>Checkpoint:</b> mampu memilih tipe field dengan tepat, menjelaskan kapan reindex diperlukan, dan memakai alias agar aplikasi tidak terikat nama index.</li></ol>'
    }
  ],
  recap: [
    'Mapping menentukan bagaimana tiap field <b>dibaca Elasticsearch</b> — kesalahan tipe di awal baru terasa sebagai query yang tidak pernah cocok.',
    '<b>Dynamic mapping</b> praktis untuk eksperimen; <b>explicit mapping</b> wajib untuk produksi agar perilaku dapat diprediksi.',
    'Perbedaan inti: <code>text</code> dianalyzer untuk pencarian penuh, <code>keyword</code> disimpan utuh untuk filter/sort/agregasi — dan <b>multi-field</b> memberi keduanya pada satu field.',
    'Perubahan struktur yang tidak didukung menuntut <b>reindex ke index baru</b>, dan <b>alias</b> menjaga aplikasi tetap tenang saat nama index berganti.'
  ]
});
