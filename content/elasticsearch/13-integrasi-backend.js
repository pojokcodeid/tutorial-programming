/* ============================================================
   Pelajaran Elasticsearch — 13: Integrasi Backend & Sinkronisasi Data
   ============================================================ */
'use strict';

window.ELASTICSEARCH_LESSONS = window.ELASTICSEARCH_LESSONS || [];

window.ELASTICSEARCH_LESSONS.push({
  id: 'integrasi-backend',
  title: 'Integrasi Backend & Sinkronisasi Data',
  chapter: 'Integrasi',
  duration: '16 menit',
  intro: [
    'Bayangkan database kamu adalah gudang penuh barang, sementara Elasticsearch adalah etalase yang dilihat pelanggan setiap hari. Kalau etalase tidak pernah diperbarui, pelanggan melihat produk yang sudah habis stok — dan kepercayaan mereka hilang dalam satu menit. Pelajaran ini menempatkan <b>backend sebagai penjaga etalase</b>: ia menulis ke sumber kebenaran (database), lalu menjaga indeks pencarian tetap mencerminkan isinya.',
    'Kamu akan mempelajari sisi teknis integrasinya: HTTP client dengan connection pooling, timeout, retry berbatas dan backoff, serta error handling yang tidak membocorkan kegagalan internal ke pengguna. Di sisi data, kamu akan memahami kenapa database adalah <b>source of truth</b> dan Elasticsearch adalah <b>derived data</b>, lalu mengikuti alur event-driven indexing, outbox pattern, idempotency, dan reconciliation.',
    'Pelajaran ini ditutup dengan hal yang paling sering dilupakan pemula: <b>ketika Elasticsearch mati, aplikasi harus tetap hidup</b>. Kamu akan berlatih health check, observability, mapping versioning dengan alias dan reindex, lalu sengaja mematikan container Elasticsearch untuk melihat bagaimana API-mu seharusnya bertahan.'
  ],
  objectives: [
    'Menulis HTTP client backend ke Elasticsearch dengan connection pooling, timeout terpisah, retry berbatas plus backoff, dan klasifikasi error yang benar',
    'Menjelaskan database sebagai source of truth dan index sebagai derived data, beserta alur event-driven indexing, outbox pattern, idempotency, dan reconciliation',
    'Menerapkan mapping versioning memakai index versi, Reindex API, dan alias yang dipindah secara atomik untuk migrasi tanpa downtime',
    'Membangun observability dan health check, lalu menguji ketahanan aplikasi saat Elasticsearch tidak tersedia'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Arsitektur integrasi: siapa menulis, siapa membaca</h3><p>Sebelum menyentuh kode, tetapkan dulu peran masing-masing komponen. <b>Frontend</b> hanya bicara HTTP dengan <b>Backend API</b>. Backend itulah satu-satunya yang boleh bicara dengan kedua penyimpanan: ia menulis dan membaca <b>Database (source of truth)</b> untuk operasi transaksional, serta membaca <b>Elasticsearch (search index)</b> untuk pencarian. Frontend tidak pernah tahu ada Elasticsearch di balik layar — kalau nanti kamu mengganti search engine-nya, frontend tidak ikut berubah.</p>' +
      `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 340" width="760" role="img" aria-label="Arsitektur integrasi backend: Frontend UI mengirim HTTP ke Backend API, yang menulis ke Database Source DB dan Elasticsearch Search Index, dengan sinkronisasi dari database ke index">
        <text x="380" y="28" class="u-title" text-anchor="middle">Integrasi backend: Frontend → Backend → Database &amp; Elasticsearch</text>
        <rect x="270" y="44" width="220" height="40" rx="8" class="u-hd"/>
        <text x="380" y="70" class="u-lbl" text-anchor="middle">Frontend UI</text>
        <line x1="380" y1="88" x2="380" y2="110" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="392" y="104" class="u-lbl" text-anchor="start">HTTP request</text>
        <rect x="240" y="116" width="280" height="56" rx="8" class="u-hd"/>
        <text x="380" y="140" class="u-lbl" text-anchor="middle">Backend API</text>
        <text x="380" y="160" class="u-lbl" text-anchor="middle">HTTP client · timeout · retry · bulk</text>
        <line x1="320" y1="176" x2="215" y2="216" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="228" y="190" class="u-lbl" text-anchor="middle">search</text>
        <line x1="440" y1="176" x2="545" y2="216" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="532" y="190" class="u-lbl" text-anchor="middle">CRUD</text>
        <rect x="70" y="222" width="260" height="68" rx="8" class="u-box"/>
        <text x="200" y="250" class="u-lbl" text-anchor="middle">Elasticsearch</text>
        <text x="200" y="272" class="u-lbl" text-anchor="middle">Search Index (derived data)</text>
        <rect x="430" y="222" width="260" height="68" rx="8" class="u-box"/>
        <text x="560" y="250" class="u-lbl" text-anchor="middle">Database</text>
        <text x="560" y="272" class="u-lbl" text-anchor="middle">Source DB (source of truth)</text>
        <line x1="430" y1="256" x2="334" y2="256" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="382" y="246" class="u-lbl" text-anchor="middle">event / reconcile</text>
        <text x="380" y="322" class="u-lbl" text-anchor="middle">Index bisa dibangun ulang dari Database — itulah alasan index disebut data turunan</text>
      </svg></div><figcaption>Frontend berbicara hanya dengan Backend API; backend membagi peran: Database untuk kebenaran transaksional, Elasticsearch untuk pencarian, dan perubahan database disinkronkan ke index.</figcaption></figure>` +
      '<p>Dari gambar itu muncul dua aturan emas integrasi: <b>(1)</b> setiap tulisan data resmi masuk ke database dulu, <b>(2)</b> index mengikuti database, tidak pernah sebaliknya. Semua pola di pelajaran ini — dual write, event-driven, outbox, reconciliation — sebenarnya hanya berbeda cara menegakkan dua aturan itu.</p>'
    },
    {
      type: 'text',
      html: '<h3>HTTP client, connection pooling, timeout, dan retry</h3><p>Elasticsearch berbicara HTTP/JSON, jadi backend cukup memakai HTTP client bawaan bahasa masing-masing (<code>fetch</code>/axios di Node, <code>net/http</code> di Go, <code>requests</code> di Python, <code>HttpClient</code> di Java). Empat hal berikut yang membedakan integrasi rapuh dengan integrasi tahan banting:</p><ul><li><b>Connection pooling</b> — jangan membuat koneksi baru untuk tiap request. Pakai client yang mempertahankan koneksi (keep-alive) dan batasi jumlah koneksi sesuai kapasitas cluster; pooling menekan biaya handshake yang berulang.</li><li><b>Timeout terpisah</b> — pisahkan connect timeout (misal 2 detik) dari total request timeout (misal 5 detik). Tanpa batas waktu sama sekali, satu request yang menggantung akan menahan worker kamu selamanya.</li><li><b>Retry berbatas dengan backoff</b> — ulangi hanya kegagalan yang layak diulang (timeout, koneksi terputus, <code>429</code>, <code>503</code>), maksimal 3 kali, dengan jeda eksponensial dan jitter supaya banyak worker tidak menyerang bersamaan.</li><li><b>Error handling berkelas</b> — bedakan error jaringan, error request salah (<code>400</code>/<code>404</code>: jangan diulang), dan cluster sedang tertekan (<code>429</code>/<code>503</code>: layak diulang tapi harus diberi jeda).</li></ul><table><thead><tr><th>Nilai</th><th>Lab</th><th>Keterangan</th></tr></thead><tbody><tr><td>Connect timeout</td><td>2 detik</td><td>Bila terlampaui, cluster dianggap tidak terjangkau</td></tr><tr><td>Request timeout</td><td>5 detik</td><td>Batas total satu request pencarian</td></tr><tr><td>Maksimal retry</td><td>3 kali</td><td>Lebih dari itu, anggap gagal dan laporkan</td></tr><tr><td>Backoff</td><td>100ms, 200ms, 400ms + jitter</td><td>Memberi ruang cluster pulih sebelum dicoba lagi</td></tr></tbody></table>'
    },
    {
      type: 'example',
      title: 'Health check dan simulasi Elasticsearch tidak tersedia',
      lang: 'bash',
      output: false,
      code: `# 1) health check Elasticsearch dari host
curl -fsS "http://localhost:9200/_cluster/health?pretty"
curl -s -o /dev/null -w "status=%{http_code} time=%{time_total}s\n" http://localhost:9200/

# 2) simulasi Elasticsearch tidak tersedia
podman stop elasticsearch

# 3) periksa bagaimana aplikasi backend merespons pencarian
curl -s -i "http://localhost:3000/search?q=laptop"

# 4) pulihkan dan pastikan cluster kembali terlayani
podman start elasticsearch
curl -fsS "http://localhost:9200/_cluster/health?pretty"`,
      explain: [
        '<code>_cluster/health</code> mengembalikan <code>status</code> (green/yellow/red), jumlah node, dan shard — inilah endpoint yang paling sering dipakai sebagai basis health check. Flag <code>-f</code> membuat curl gagal non-zero saat server menjawab error, sehingga mudah dipakai di script.',
        '<code>-w</code> mencetak status HTTP dan waktu total; catat angka ini sebagai baseline latency pencarianmu. Setelah <code>podman stop</code>, curl ke port 9200 akan gagal koneksi — bukti simulasi kegagalan benar-benar aktif.',
        'Langkah 3 adalah inti pelajaran ini: saat Elasticsearch mati, endpoint <code>/search</code> backend kamu harus menjawab dengan cepat dan sopan (misalnya <code>503</code> dengan pesan layanan pencarian sementara tidak tersedia), bukan menggantung sampai timeout bawaan bahasa yang bisa belasan detik.',
        'Langkah 4 memastikan pemulihan terpantau: begitu container hidup, health check kembali normal dan backend otomatis memakai koneksi baru tanpa perlu restart.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Database sebagai source of truth, index sebagai derived data</h3><p>Ini konsep paling penting di seluruh bab: <b>database menyimpan kebenaran, Elasticsearch menyimpan kemudahan mencari</b>. Kalau keduanya bertentangan, database yang menang — index tinggal dibangun ulang.</p><table><thead><tr><th>Aspek</th><th>Database (source of truth)</th><th>Elasticsearch (derived data)</th></tr></thead><tbody><tr><td>Peran</td><td>Menjawab &quot;apa yang benar&quot;: transaksi, stok, pembayaran</td><td>Menjawab &quot;apa yang mudah dicari&quot;: relevansi, autocomplete, aggregation</td></tr><tr><td>Bila datanya hilang</td><td>Data resmi ikut hilang — keadaan fatal</td><td>Bisa dibangun ulang lewat reindex dari database</td></tr><tr><td>Keadaan konsistensi</td><td>Transaksi menjamin selalu sinkron</td><td>Boleh tertinggal beberapa detik (eventual consistency)</td></tr><tr><td>Perubahan struktur</td><td>Migrasi schema yang terkontrol</td><td>Mapping &amp; alias; perubahan tertentu menuntut reindex</td></tr></tbody></table><p>Dari tabel itu lahir tiga mekanisme sinkronisasi. <b>Event-driven indexing</b>: setelah transaksi commit, backend menerbitkan event &quot;produk X berubah&quot; yang dikonsumsi untuk menulis ulang satu dokumen di index. <b>Outbox pattern</b> memperbaiki celah dual-write: event ditulis ke tabel <i>outbox</i> di dalam transaksi yang sama, lalu relay mengirimnya ke indexer — tidak ada lagi kejadian database commit tetapi event gagal terkirim. <b>Idempotency</b> membuat pengulangan aman: dokumen memakai <code>_id</code> sama dengan primary key database, sehingga retry menimpa, bukan menggandakan. Terakhir, <b>reconciliation</b> adalah pemeriksaan periodik yang membandingkan hitungan atau sampel data database vs index, lalu memperbaiki selisihnya — jaring pengaman bila ada event yang terlewat.</p>'
    },
    {
      type: 'example',
      title: 'Bulk ingestion: sinkronisasi massal dengan NDJSON',
      lang: 'http',
      output: false,
      code: `POST /products/_bulk
{"index":{"_index":"products","_id":"p-001"}}
{"id":"p-001","name":"Laptop Pro","category":"laptop","price":25000000,"status":"active"}
{"index":{"_index":"products","_id":"p-002"}}
{"id":"p-002","name":"Gaming Mouse","category":"mouse","price":750000,"status":"active"}
{"update":{"_index":"products","_id":"p-001","retry_on_conflict":3}}
{"doc":{"price":24500000,"status":"active"}}`,
      explain: [
        'Bulk memakai format NDJSON: satu baris action (<code>index</code>/<code>update</code>) diikuti satu baris dokumen, bergantian, dan request diakhiri newline. Satu request ratusan dokumen jauh lebih hemat daripada ratusan request tunggal — inilah perbedaan yang kamu ukur di pelajaran Performance.',
        'Field <code>_id</code> diisi identik dengan primary key database (<code>p-001</code>). Karena itu pengulangan (retry) tidak pernah membuat dokumen kembar: action <code>index</code> dengan _id yang sama hanya menimpa isi lama — inilah bentuk paling sederhana dari <b>idempotency</b>.',
        'Action <code>update</code> memakai <code>retry_on_conflict:3</code>, artinya bila ada tulisan lain yang sedang menabrak dokumen yang sama, Elasticsearch mengulanginya sendiri sampai tiga kali sebelum menyerah.',
        'Response bulk berupa array per baris; periksa field <code>errors</code> — selama <code>false</code> semua baris sukses. Satu baris gagal tidak membatalkan baris lain, jadi selalu laporkan baris yang gagal ke log.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Mapping versioning, alias &amp; reindex, observability</h3><p>Mapping tidak bisa diubah sembarangan: <b>menambah field baru aman, tetapi mengubah tipe field atau analyzer menuntut index baru</b>. Karena itu mapping diberi versi — simpan definisinya di Git (lebih baik lewat index template), beri nomor versi, lalu terapkan lewat pola index bernomor: <code>products_v1</code>, <code>products_v2</code>, dan seterusnya. Backend tidak pernah menyebut index versi secara langsung; ia memakai <b>alias</b> seperti <code>products_current</code>. Migrasinya menjadi tiga langkah: buat index baru dengan mapping versi berikutnya, salin data dengan Reindex API, lalu pindahkan alias — langkah terakhir atomik, sehingga pencarian tidak pernah menunjuk dua index sekaligus atau ke index yang sedang ditulis ulang. Index lama disimpan beberapa hari sebagai jalur rollback.</p><p>Bagian observability-nya minimal tiga lapis. <b>Metrik</b>: laju request pencarian, latensi p50/p95, tingkat error, jumlah retry, dan ukuran antrean bulk. <b>Log</b>: aktifkan slow log index untuk menangkap query lambat, dan catat setiap kegagalan sinkronisasi. <b>Health check berlapis</b>: <i>liveness</i> memastikan proses backend hidup, <i>readiness</i> memastikan Elasticsearch terjangkau dan index ada (supaya orchestrator tidak mengarahkan trafik ke instance yang belum siap), dan <i>startup</i> memastikan konfigurasi valid sebelum melayani. Endpoint <code>_cluster/health</code> dan <code>_nodes/stats</code> menjadi sumber pemeriksaan sisi Elasticsearch.</p>'
    },
    {
      type: 'example',
      title: 'Migrasi mapping lewat index versi, reindex, dan alias',
      lang: 'bash',
      output: false,
      code: `# 1) buat index baru dengan mapping versi berikutnya
curl -X PUT "http://localhost:9200/products_v2" -H "Content-Type: application/json" -d '{
  "mappings": {
    "properties": {
      "name": { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
      "category": { "type": "keyword" },
      "price": { "type": "long" },
      "rating": { "type": "float" }
    }
  }
}'

# 2) salin seluruh dokumen dari index lama
curl -X POST "http://localhost:9200/_reindex?refresh=true" -H "Content-Type: application/json" -d '{
  "source": { "index": "products_v1" },
  "dest": { "index": "products_v2" }
}'

# 3) pindahkan alias secara atomik: masuk v2, keluar v1
curl -X POST "http://localhost:9200/_aliases" -H "Content-Type: application/json" -d '{
  "actions": [
    { "add": { "index": "products_v2", "alias": "products_current" } },
    { "remove": { "index": "products_v1", "alias": "products_current" } }
  ]
}'

# 4) buktikan backend selalu membaca lewat alias
curl "http://localhost:9200/products_current/_search?q=laptop&size=1"`,
      explain: [
        'Index baru dibuat dengan mapping eksplisit sejak awal — tidak ada dynamic mapping yang menebak-nebak tipe data. Persis inilah keuntungan menyimpan mapping versi di Git: definisi baru bisa ditinjau sebelum dipakai.',
        '<code>_reindex</code> menyalin dokumen dari index sumber ke tujuan; parameter <code>refresh=true</code> membuat hasilnya langsung terlihat tanpa menunggu interval refresh bawaan, sehingga langkah verifikasi berikutnya tidak menemukan hasil kosong.',
        'Pemindahan alias lewat <code>_aliases</code> berjalan sebagai satu aksi atomik: backend yang sedang membaca <code>products_current</code> berpindah ke v2 dalam satu langkah, tanpa jendela waktu di mana alias menunjuk nol atau dua index sekaligus.',
        'Langkah 4 membuktikan kontraknya: cukup mengubah tujuan alias, seluruh pencarian backend ikut berpindah tanpa perubahan kode. Simpan v1 sebagai rollback selama beberapa hari, lalu hapus setelah yakin.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan integrasi yang paling sering muncul',
      text: '<ul><li><b>Retry tanpa batas</b> — saat cluster sedang tertekan, retry agresif justru membanjirinya (thundering herd) dan memperpanjang pemulihan. Batasi 3 kali dan beri backoff.</li><li><b>Menganggap index sebagai sumber kebenaran</b> — ketika database dan index berbeda, jangan pernah menimpa database dari index; perbaiki index dari database.</li><li><b>Dual-write tanpa idempotency</b> — menulis database lalu index tanpa <code>_id</code> yang sama membuat retry menghasilkan dokumen kembar yang mustahil ditemukan.</li><li><b>Menyuntik data satu per satu</b> — seeding puluhan ribu dokumen lewat request tunggal memakan waktu berjam-jam; gunakan Bulk API.</li><li><b>Mengubah mapping langsung di index produksi</b> — sebagian perubahan ditolak dengan <code>mapper_parsing_exception</code>, sebagian lagi memicu dynamic mapping liar. Selalu lewat index baru dan reindex.</li><li><b>Endpoint pencarian yang bocor</b> — stack trace Elasticsearch yang tampil di respons frontend adalah kebocoran informasi; terjemahkan menjadi kode error yang ramah.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Strategi membangun integrasi yang tahan kegagalan',
      text: '<p>Uji jalur gagal <b>lebih dulu</b>: setelah endpoint search berfungsi, langsung <code>podman stop elasticsearch</code> dan pastikan aplikasi tetap melayani CRUD dengan pesan yang jelas untuk pencarian. Kumpulkan semua angka (timeout, batas retry, ukuran bulk) dalam satu berkas konfigurasi agar mudah disesuaikan tanpa menyentuh kode bisnis. Kirim bulk dalam potongan 500–1000 dokumen atau sekitar 5–15 MB per request, lalu periksa flag <code>errors</code> pada responsnya. Terakhir, jalankan reconciliation ringan (hitungan per kategori, lalu sampel beberapa dokumen) secara berkala dan siapkan alert begitu selisih database vs index melewati ambang yang kamu tentukan.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Source of truth', 'Database yang menjadi satu-satunya sumber kebenaran resmi; bila terjadi perbedaan, seluruh komponen mengikutinya.'],
        ['Derived data', 'Data turunan seperti index Elasticsearch: berguna untuk keperluan khusus (pencarian) dan boleh dibangun ulang dari source of truth.'],
        ['Connection pooling', 'Teknik mempertahankan sekumpulan koneksi HTTP yang siap pakai agar tiap request tidak membuka koneksi baru.'],
        ['Backoff dengan jitter', 'Strategi menunda percobaan ulang secara eksponensial lalu menambah acakan, supaya banyak client tidak menyerang bersamaan.'],
        ['Idempotency', 'Sifat operasi yang aman diulang tanpa mengubah hasil akhir; dicapai dengan _id tetap dan penulisan versi dokumen.'],
        ['Outbox pattern', 'Pola menulis event sinkronisasi ke tabel outbox di dalam transaksi database yang sama, lalu meneruskannya secara terpisah.'],
        ['Reconciliation', 'Pemeriksaan berkala yang membandingkan database dengan index dan memperbaiki selisih akibat event yang terlewat.'],
        ['Alias index', 'Nama pintasan yang menunjuk ke satu atau lebih index, dipakai backend agar migrasi index tidak mengubah kode aplikasi.'],
        ['Bulk ingestion', 'Pemasukan data massal lewat Bulk API dalam format NDJSON, jauh lebih efisien daripada menulis dokumen satu per satu.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Bungkus semua pemanggilan Elasticsearch di backend kamu dengan HTTP client yang punya connect timeout 2 detik, request timeout 5 detik, maksimal 3 retry dengan backoff 100ms → 200ms → 400ms plus jitter. Uji dengan mematikan container: pastikan respons <code>/search</code> cepat dan bukan menggantung.</li><li>Implementasikan satu jalur sinkronisasi produk — pilih dual-write sederhana atau outbox pattern — lengkap dengan <code>_id</code> sama seperti primary key database, lalu buktikan retry tidak menghasilkan dokumen kembar.</li><li>Lakukan migrasi mapping: buat <code>products_v2</code>, jalankan <code>_reindex</code> dari <code>products_v1</code>, pindahkan alias <code>products_current</code>, dan verifikasi lewat alias bahwa backend tidak perlu diubah.</li><li>Jalankan reconciliation sederhana: bandingkan jumlah dokumen per kategori di database dengan hasil aggregation di index, catat selisihnya, dan perbaiki bila ada. <b>Checkpoint:</b> kamu mampu menjelaskan peran source of truth vs derived data, menulis HTTP client dengan timeout dan retry berbatas, memigrasi mapping lewat alias, serta menunjukkan aplikasi tetap hidup saat Elasticsearch dimatikan.</li></ol>'
    }
  ],
  recap: [
    '<b>Database adalah source of truth, Elasticsearch adalah derived data</b> — bila keduanya berbeda, perbaiki index dari database, tidak pernah sebaliknya.',
    'HTTP client yang sehat punya <b>connection pooling, timeout terpisah, retry berbatas dengan backoff, dan klasifikasi error</b> — tanpa itu, satu kegagalan kecil berubah menjadi hang total.',
    'Sinkronisasi andal bertumpu pada <b>idempotency (_id = primary key), outbox pattern untuk event yang atomik, dan reconciliation berkala</b> sebagai jaring pengaman.',
    'Perubahan mapping diselesaikan dengan <b>index versi + Reindex API + alias yang dipindah atomik</b>, sementara aplikasi tetap hidup berkat <b>health check berlapis, metrik, dan simulasi kegagalan</b>.'
  ]
});
