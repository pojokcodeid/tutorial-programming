/* ============================================================
   Pelajaran Elasticsearch — 09: Performance, Indexing & Query Optimization
   ============================================================ */
'use strict';

window.ELASTICSEARCH_LESSONS = window.ELASTICSEARCH_LESSONS || [];

window.ELASTICSEARCH_LESSONS.push({
  id: 'performance-optimasi',
  title: 'Performance, Indexing & Query Optimization',
  chapter: 'Operasional',
  duration: '15 menit',
  intro: [
    'Bayangkan kamu mengendarai mobil sport dengan mesin ratusan tenaga kuda, tapi bannya kempes dan jalanannya berlubang. Elasticsearch juga begitu: index dan query-mu bisa sekelas, tapi satu bottleneck kecil — heap yang sempit, bulk yang salah ukuran, atau refresh yang terlalu sering — membuat seluruh sistem terasa lambat. Di pelajaran ini kamu belajar <b>menemukan bottleneck dengan angka, bukan tebakan</b>.',
    'Kamu akan membedah lapisan resource (JVM heap lewat <code>ES_JAVA_OPTS</code>, memory pressure, disk I/O, CPU), pipeline indexing (bulk vs single insert, refresh interval, translog, segment &amp; merge), biaya query (query cache, request cache, field data, cardinalitas), desain index (shard sizing &amp; hotspot), lalu alat diagnosis (slow logs dan Profile API).',
    'Pelajaran ini ditutup lab benchmark: index <b>1.000 vs 10.000 dokumen</b> dengan berbagai ukuran bulk, pantau memakai <code>podman stats</code>, dan catat hasilnya. Semua berjalan di lab Podman tag <code>8.17.0</code> pada <code>http://localhost:9200</code> dengan security nonaktif — perbedaan lab vs produksi akan selalu kita sebut.'
  ],
  objectives: [
    'Menjelaskan peran JVM heap (<code>ES_JAVA_OPTS</code>), memory pressure, disk I/O, dan CPU terhadap throughput indexing serta latensi pencarian',
    'Membedakan single insert vs Bulk API dan menentukan ukuran bulk serta refresh interval yang tepat untuk indexing besar',
    'Menjelaskan lifecycle translog, refresh, segment, merge, query cache, request cache, field data, cardinalitas, shard sizing, dan hotspot',
    'Mendiagnosis masalah memakai slow logs dan Profile API, lalu menjalankan benchmark 1.000 vs 10.000 dokumen dan mencatat hasilnya'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Kenapa Elasticsearch bisa terasa lambat?</h3><p>Masalah performa hampir tidak pernah datang dari satu tempat. Saat pencarian terasa lambat, biasanya ada satu lapisan yang jenuh sementara lapisan lain menganggur. Karena itu langkah pertama bukan menyetel apa pun, tapi <b>menentukan lapisan mana yang batasnya</b>.</p><table><thead><tr><th>Lapisan</th><th>Peran</th><th>Gejala bila jenuh</th></tr></thead><tbody><tr><td><b>JVM heap</b> (<code>ES_JAVA_OPTS</code>)</td><td>Ruang kerja object, query cache, fielddata</td><td>Garbage collection sering, latensi melonjak naik-turun</td></tr><tr><td><b>Memory pressure</b></td><td>Page cache untuk segment + sisa RAM container</td><td>Swap aktif, pembacaan disk meningkat drastis</td></tr><tr><td><b>Disk I/O</b></td><td>Menulis translog, flush &amp; merge segment</td><td>Indexing menunggu disk, merge tertunda</td></tr><tr><td><b>CPU</b></td><td>Scoring, aggregasi, kompresi, merge</td><td>Utilisasi tinggi saat query berat atau bulk besar</td></tr><tr><td><b>Jaringan</b></td><td>Transport antar shard dan antar node</td><td>Timeout antar node (khusus cluster multi-node)</td></tr></tbody></table><p>Prinsip yang dipakai sepanjang pelajaran: <b>ukur dulu, ubah satu variabel, lalu ukur lagi</b>. Benchmark tanpa memantau resource hanya menghasilkan angka tanpa cerita.</p>'
    },
    {
      type: 'example',
      title: 'Membaca resource: JVM heap, ES_JAVA_OPTS, dan podman stats',
      lang: 'bash',
      output: false,
      code: `# 1) heap diatur lewat ES_JAVA_OPTS pada compose.yaml
#    ES_JAVA_OPTS=-Xms1g -Xmx1g   (Xms = Xmx agar heap tidak resize)

# 2) pantau CPU & memori container dari terminal kedua
podman stats --no-stream

# 3) baca statistik heap, GC, dan CPU dari sisi Elasticsearch
curl -s "http://localhost:9200/_nodes/stats/jvm,os?pretty" | head -n 60

# 4) lihat pemakaian heap dalam bentuk persentase
curl -s "http://localhost:9200/_nodes/stats/jvm?pretty" \\
  | grep -A2 heap_used_percent`,
      explain: [
        '<code>ES_JAVA_OPTS=-Xms1g -Xmx1g</code> menyetel heap awal sama dengan heap maksimum. Di lab kita memakai 1g karena container lab juga kecil; di produksi umumnya <b>50% dari RAM fisik</b> dan tidak melebihi 32 GB agar kompresi pointer tetap efektif.',
        '<code>podman stats --no-stream</code> menampilkan CPU % serta pemakaian/limit memori container Elasticsearch pada satu titik waktu. Bila angka memori mendekati limit, kamu sedang menghadapi <b>memory pressure</b> — bukan saatnya menambah data, tapi menambah resource atau mengecilkan beban.',
        '<code>_nodes/stats/jvm</code> memuat <code>heap.used_percent</code> dan hitungan garbage collection per collector. Heap tinggi <i>plus</i> GC yang sering adalah dua sinyal utama: heap kurang, atau ada yang membocorkan memori (paling sering fielddata).',
        'Endpoint <code>_nodes/stats/os</code> menambahkan utilisasi CPU dan total memori host — berguna untuk memastikan apakah Elasticsearch atau mesinnya yang jenuh.'
      ]
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Pipeline indexing Elasticsearch: Bulk API masuk ke Translog, Refresh satu detik membuka visibility, menghasilkan Segment immutable, lalu Merge memadatkan segment di background; query cache dan request cache menyimpan hasil query yang sering dipakai">
        <text x="30" y="32" class="u-title" text-anchor="start">Pipeline indexing: dari dokumen masuk sampai bisa dicari</text>
        <rect x="30" y="56" width="150" height="64" rx="8" class="u-hd"/>
        <text x="105" y="82" class="u-lbl" text-anchor="middle">Bulk API</text>
        <text x="105" y="104" class="u-lbl" text-anchor="middle">5-15 MB per request</text>
        <line x1="184" y1="88" x2="206" y2="88" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="212" y="56" width="150" height="64" rx="8" class="u-box"/>
        <text x="287" y="82" class="u-lbl" text-anchor="middle">Translog</text>
        <text x="287" y="104" class="u-lbl" text-anchor="middle">daya tahan tulis</text>
        <line x1="366" y1="88" x2="388" y2="88" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="394" y="56" width="160" height="64" rx="8" class="u-box"/>
        <text x="474" y="82" class="u-lbl" text-anchor="middle">Refresh (1 detik)</text>
        <text x="474" y="104" class="u-lbl" text-anchor="middle">membuka visibility</text>
        <line x1="558" y1="88" x2="580" y2="88" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="586" y="56" width="144" height="64" rx="8" class="u-hd"/>
        <text x="658" y="82" class="u-lbl" text-anchor="middle">Segment</text>
        <text x="658" y="104" class="u-lbl" text-anchor="middle">immutable</text>
        <rect x="30" y="146" width="545" height="100" rx="10" class="u-box"/>
        <text x="46" y="170" class="u-title" text-anchor="start">Cache yang menekan biaya query berulang</text>
        <rect x="46" y="182" width="248" height="48" rx="6" class="u-hd"/>
        <text x="170" y="204" class="u-lbl" text-anchor="middle">Query cache (bitset filter)</text>
        <text x="170" y="222" class="u-lbl" text-anchor="middle">filter tetap yang diulang</text>
        <rect x="310" y="182" width="248" height="48" rx="6" class="u-box"/>
        <text x="434" y="204" class="u-lbl" text-anchor="middle">Request cache (per shard)</text>
        <text x="434" y="222" class="u-lbl" text-anchor="middle">agregasi &amp; size 0</text>
        <line x1="658" y1="124" x2="658" y2="150" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="586" y="156" width="144" height="52" rx="8" class="u-box"/>
        <text x="658" y="178" class="u-lbl" text-anchor="middle">Merge background</text>
        <text x="658" y="196" class="u-lbl" text-anchor="middle">segment menyusut</text>
        <text x="380" y="278" class="u-lbl" text-anchor="middle">Segment kecil menumpuk = query &amp; merge mahal: perbesar bulk, longgarkan refresh</text>
      </svg></div><figcaption>Dokumen mengalir dari Bulk API ke Translog, lalu Refresh membuka visibility sehingga menjadi Segment immutable; Merge memadatkan segment di background, sementara query cache dan request cache menekan biaya query berulang.</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Refresh interval, translog, segment, dan merge</h3><p>Empat konsep ini adalah penyebab nomor satu &quot;indexing terasa lambat&quot; pada data besar. Pahami urutannya, lalu kamu tahu knob mana yang boleh disentuh.</p><table><thead><tr><th>Konsep</th><th>Peran</th><th>Saran praktik</th></tr></thead><tbody><tr><td><b>Translog</b></td><td>Jurnal tulis supaya dokumen aman sebelum di-flush ke disk</td><td>Jangan dimatikan — ini pertahanan terakhir terhadap kehilangan data</td></tr><tr><td><b>Refresh interval</b></td><td>Jarak dokumen baru bisa ditemukan pencarian (default 1 detik)</td><td>Saat bulk besar, set ke 30 detik lalu kembalikan ke 1 detik</td></tr><tr><td><b>Segment</b></td><td>Unit immutable hasil refresh; dibaca semua query</td><td>Segment kecil menumpuk = makin banyak file yang dibaca</td></tr><tr><td><b>Merge</b></td><td>Proses background memadatkan segment kecil</td><td>Biaya disk/CPU mendadak; jangan kaget bila ada puncak saat benchmark</td></tr></tbody></table><p>Menurunkan refresh selama ingest besar <b>bukan menunda daya tahan</b> — dokumen tetap aman di translog. Yang tertunda hanya visibilitas hasil pencarian, dan itu justru yang tidak dibutuhkan saat kamu sedang mengisi data.</p>'
    },
    {
      type: 'example',
      title: 'Single insert vs Bulk API',
      lang: 'bash',
      output: false,
      code: `# Single insert: 1 request = 1 round-trip HTTP penuh
for i in $(seq 1 50); do
  curl -s -X POST "http://localhost:9200/bench/_doc" \\
    -H "Content-Type: application/json" \\
    -d '{"title":"single-'$i'"}' > /dev/null
done

# Bulk: 1.000 dokumen hanya dalam beberapa request besar
curl -s -X POST "http://localhost:9200/bench/_bulk" \\
  -H "Content-Type: application/x-ndjson" \\
  --data-binary @bulk_1000.ndjson | head -c 300`,
      explain: [
        'Single insert memaksa Elasticsearch membuka, membaca, mem-parsing, dan menutup satu request HTTP untuk <b>satu dokumen</b>. Untuk 10.000 dokumen berarti 10.000 round-trip — itulah selisih yang akan kamu ukur di lab benchmark.',
        'Bulk API menggabungkan banyak aksi dalam satu request. Formatnya <b>NDJSON</b>: satu baris action (<code>{"index":{"_id":"..."}}</code>) diikuti satu baris dokumen, bergantian, dan request wajib diakhiri newline.',
        'Flag <code>--data-binary</code> wajib dipakai agar newline di dalam file terjaga; memakai <code>-d</code> biasa bisa merusak format NDJSON sehingga response berisi error parsing.',
        'Selalu cek bagian <code>errors</code> dan <code>items</code> pada response bulk: <code>errors: false</code> berarti seluruh dokumen diterima, sedangkan <code>took</code> memberi angka waktu proses server untuk kamu catat.'
      ]
    },
    {
      type: 'example',
      title: 'Lab benchmark: 1.000 vs 10.000 dokumen dengan ukuran bulk berbeda',
      lang: 'bash',
      output: false,
      code: `# 1) bersihkan index benchmark
curl -s -X DELETE "http://localhost:9200/bench?pretty"

# 2) buat 10.000 dokumen (2 baris per dokumen: action + source)
for i in $(seq 1 10000); do
  echo '{"index":{"_id":"p-'$i'"}}'
  echo '{"title":"Produk '$i'","price":'$((100000 + i))',"category":"kat-'$((i % 5))'"}'
done > bench_10000.ndjson

# 3) pecah jadi dua ukuran bulk: 100 dokumen vs 500 dokumen per request
split -l 200 bench_10000.ndjson bulk100_
split -l 1000 bench_10000.ndjson bulk500_

# 4) ukur waktu untuk tiap ukuran bulk (ulangi 3x, pakai median)
start=$(date +%s)
for f in bulk100_*; do
  curl -s -X POST "http://localhost:9200/bench/_bulk" \\
    -H "Content-Type: application/x-ndjson" --data-binary @"$f" > /dev/null
done
echo "bulk100 selesai dalam $(( $(date +%s) - start )) detik"

# 5) pantau resource selama benchmark berjalan (terminal kedua)
podman stats --no-stream elasticsearch

# 6) catat hasil: jumlah dokumen & ukuran index
curl -s "http://localhost:9200/_cat/indices/bench?v&h=index,docs.count,store.size,pri.store.size"`,
      explain: [
        'Langkah 2 membangun file NDJSON mentah: dua baris per dokumen, sehingga <code>split -l 200</code> menghasilkan potongan berisi 100 dokumen dan <code>split -l 1000</code> menghasilkan potongan berisi 500 dokumen. Angka split = jumlah baris, bukan jumlah dokumen.',
        'Ukuran bulk punya trade-off: terlalu kecil (misal 10 dokumen) membuat overhead HTTP menang, terlalu besar (ratusan MB) membuat payload melewati batas 100 MB dan menekan heap. Rentang wajar untuk lab: <b>5–15 MB per request</b> atau 1.000–5.000 dokumen.',
        '<code>podman stats --no-stream</code> diambil <i>selama</i> dan sesudah benchmark untuk mencatat CPU serta pemakaian memori. Tanpa angka ini, kamu tidak tahu apakah bottleneck di disk, CPU, atau heap.',
        'Perintah <code>_cat/indices</code> membuktikan seluruh 10.000 dokumen benar-benar tersimpan dan memberi <code>store.size</code> sebagai pembanding: bulk yang sama menghasilkan index berbeda ukuran bila refresh/merge-nya berbeda.',
        'Catat setiap percobaan ke <code>docs/benchmark.md</code>: perintah persis, tag image <code>8.17.0</code>, spek mesin, dan angka median dari tiga kali jalan — inilah Checkpoint benchmark yang bisa diulang orang lain.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Cache, field data, dan cardinalitas</h3><p>Setelah indexing cepat, langkah berikutnya adalah membuat query berulang tidak membayar harga penuh. Elasticsearch punya dua cache utama, plus satu biaya tersembunyi bernama fielddata.</p><table><thead><tr><th> Komponen</th><th>Menyimpan apa</th><th>Catatan</th></tr></thead><tbody><tr><td><b>Query cache</b></td><td>Hasil filter sebagai bitset per segment</td><td>Paling efektif untuk filter tetap yang diulang, misal kategori dan rentang harga</td></tr><tr><td><b>Request cache</b></td><td>Hasil request per shard (umumnya <code>size: 0</code> dan agregasi)</td><td>Otomatis invalid saat index berubah — cocok untuk dashboard yang sama terus</td></tr><tr><td><b>Fielddata</b></td><td>Struktur sorting/agregasi pada field <code>text</code>, dimuat ke heap</td><td>Sangat mahal; hindari dengan memakai <code>doc_values</code> pada keyword/angka</td></tr><tr><td><b>Cardinality</b></td><td>Jumlah nilai unik sebuah field</td><td>Cardinality tinggi (misal ID unik) membuat agregasi terms mahal dan tidak berguna</td></tr></tbody></table><p>Kalau kamu melihat heap terus naik setelah banyak query agregasi, periksa apakah ada agregasi pada field <code>text</code> yang memaksa fielddata. Solusinya bukan menambah heap, tapi <b>memperbaiki mapping</b>.</p>'
    },
    {
      type: 'text',
      html: '<h3>Shard sizing dan hotspot</h3><p>Materi sharding di pelajaran sebelumnya membahas struktur; sekarang kita lihat sisi performanya. Salah ukur shard adalah penyebab &quot;cluster kok lambat padahal datanya belum banyak&quot;.</p><table><thead><tr><th>Masalah</th><th>Gejala</th><th>Tindakan</th></tr></thead><tbody><tr><td><b>Shard terlalu kecil / terlalu banyak</b></td><td>Memori per shard terpakai, cluster state membesar, pencarian membuka banyak file</td><td>Targetkan ±10–50 GB per shard; hitung jumlah shard saat membuat index, bukan membagi rata berapa pun datanya</td></tr><tr><td><b>Shard terlalu besar</b></td><td>Recovery dan merge lama, kegagalan berdampak besar</td><td>Reindex ke index baru dengan jumlah shard lebih banyak</td></tr><tr><td><b>Hotspot</b></td><td>Satu node/shard menanggung beban jauh lebih besar</td><td>Periksa <code>_cat/shards</code> dan <code>_nodes/hot_threads</code>; untuk log, pakai alias + rollover</td></tr></tbody></table><p>Hotspot paling sering datang dari data yang tidak merata: satu index log berisi data hari ini (panas) bercampur index lama (dingin). Pemisahan index berbasis waktu membuat beban menyebar dan backup juga lebih ringan.</p>'
    },
    {
      type: 'example',
      title: 'Profile API dan slow logs untuk diagnosis',
      lang: 'http',
      output: false,
      code: `GET /products/_search
{
  "profile": true,
  "query": {
    "multi_match": {
      "query": "gaming laptop",
      "fields": ["name^3", "description"]
    }
  },
  "aggs": {
    "by_category": { "terms": { "field": "category" } }
  }
}

PUT /products/_settings
{
  "index.search.slowlog.threshold.query.warn": "2s",
  "index.indexing.slowlog.threshold.index.warn": "5s"
}`,
      explain: [
        '<code>"profile": true</code> membuat response menyertakan profil per langkah: bagian <code>query</code>, <code>rewrite</code>, dan <code>fetch</code>, lengkap dengan <code>time_in_nanos</code> serta <code>breakdown</code> per collector.',
        'Field <code>breakdown</code> memperlihatkan siapa yang memakan waktu — scoring, build_scorer, atau collect. Tanpa profil, kamu hanya tahu &quot;query ini lambat&quot;; dengan profil, kamu tahu <b>bagian mana</b> yang lambat.',
        'Slow log menulis permintaan yang melewati ambang waktu ke log: <code>threshold.query.warn: 2s</code> untuk pencarian dan <code>threshold.indexing.slowlog.threshold.index.warn</code> untuk indexing. Di container, lognya terbaca lewat <code>podman logs elasticsearch</code>.',
        '<b>Jangan menyisakan <code>profile: true</code> di produksi</b> — profil menambah overhead dan membesar response. Pakai sesaat untuk diagnosis, lalu matikan.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan umum yang membuat cluster melambat',
      text: '<ul><li><b>Heap dijadikan terlalu besar</b> — heap di atas 50% RAM (atau di atas 32 GB) justru memperlambat garbage collection dan menyisakan sedikit page cache untuk segment.</li><li><b>Refresh 1 detik dibiarkan saat bulk besar</b> — segment kecil menumpuk tiap detik, merge mengejar di background, dan benchmark jadi tidak stabil.</li><li><b>Insert satu per satu</b> — 10.000 single insert vs puluhan request bulk; selisihnya bisa berkali-kali lipat.</li><li><b>Fielddata diaktifkan pada field text</b> — heap terbakar untuk sort/agregasi; perbaiki mapping memakai <code>keyword</code> atau <code>doc_values</code>.</li><li><b>Jumlah shard asal-asalan</b> — ratusan shard kecil untuk data kecil membuang memori dan membesarkan cluster state.</li><li><b>Benchmark tanpa memantau resource</b> — angka tanpa <code>podman stats</code> tidak menyebutkan bottleneck, sehingga optimasi berikutnya menebak-nebak.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Satu variabel, tiga kali jalan, satu catatan',
      text: '<p>Untuk setiap percobaan performa: ubah hanya satu hal (ukuran bulk, refresh interval, jumlah shard), ulangi minimal tiga kali, lalu ambil median angkanya. Simpan hasilnya di <code>docs/benchmark.md</code> beserta perintah, tag <code>8.17.0</code>, dan spek mesin. Angka benchmark milik orang lain tidak berlaku di lab kamu — yang berharga adalah <b>cara kamu mengukurnya</b>, dan cara itu bisa diulang kapan saja.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['JVM heap', 'Ruang memori heap tempat object dan cache Elasticsearch hidup; diatur lewat <code>ES_JAVA_OPTS</code>, misal <code>-Xms1g -Xmx1g</code>.'],
        ['ES_JAVA_OPTS', 'Environment variable yang meneruskan opsi JVM ke proses Elasticsearch di dalam container.'],
        ['Memory pressure', 'Kondisi memori fisik menipis sehingga terjadi swapping dan garbage collection lebih sering — penyebab latensi melonjak.'],
        ['Translog', 'Jurnal tulis yang menjaga dokumen tetap aman sebelum di-flush menjadi segment di disk.'],
        ['Refresh interval', 'Jarak waktu (default 1 detik) sebelum dokumen baru bisa ditemukan oleh pencarian.'],
        ['Segment', 'File immutable hasil refresh; unit dasar yang dibaca oleh setiap pencarian.'],
        ['Merge', 'Proses background yang memadatkan banyak segment kecil menjadi segment lebih besar.'],
        ['Query cache &amp; request cache', 'Cache hasil filter (bitset) dan cache hasil per shard untuk request berukuran 0 atau agregasi.'],
        ['Fielddata &amp; cardinalitas', 'Struktur sorting/agregasi di heap serta jumlah nilai unik sebuah field yang menentukan biaya agregasi.'],
        ['Slow log &amp; Profile API', 'Log permintaan lambat dan API yang membedah waktu per langkah query untuk diagnosis performa.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Jalankan <code>podman stats --no-stream</code> dan <code>_nodes/stats/jvm,os</code>, lalu catat angka awal heap, CPU, dan pemakaian memori sebelum menyentuh data apa pun.</li><li>Isi 1.000 dokumen lewat single insert, lalu 1.000 dokumen lewat bulk — bandingkan waktunya, dan ulangi dengan ukuran bulk 100 vs 500 dokumen. Masukkan semua angka ke <code>docs/benchmark.md</code>.</li><li>Ulangi eksperimen dengan 10.000 dokumen dan refresh interval 1 detik vs 30 detik; amati jumlah segment lewat <code>_cat/segments</code> dan waktu merge yang terjadi sesudahnya.</li><li><b>Checkpoint:</b> mampu menjelaskan letak bottleneck dari data benchmark, memilih ukuran bulk dan refresh interval yang tepat, serta memakai Profile API untuk menemukan query yang mahal.</li></ol>'
    }
  ],
  recap: [
    'Performa Elasticsearch ditentukan lima lapisan: <b>JVM heap, memory pressure, disk I/O, CPU, dan jaringan</b> — tentukan dulu mana yang jenuh lewat <code>podman stats</code> dan <code>_nodes/stats</code>.',
    'Indexing besar menang dengan <b>Bulk API (5–15 MB per request)</b> plus refresh interval yang dilonggarkan sementara; translog tetap menjaga daya tahan data.',
    'Query berulang ditekan oleh <b>query cache dan request cache</b>, sementara fielddata dan cardinalitas tinggi adalah biaya tersembunyi yang harus dicek di mapping.',
    'Diagnosis memakai <b>slow logs dan Profile API</b>, lalu semua temuan dibuktikan dengan benchmark 1.000 vs 10.000 dokumen yang dicatat dan bisa diulang.'
  ]
});
