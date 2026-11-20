/* ============================================================
   Pelajaran Elasticsearch — 08: Cluster, Sharding & Arsitektur Terdistribusi
   (Roadmap Level 7 — bab Arsitektur)
   ============================================================ */
'use strict';

window.ELASTICSEARCH_LESSONS = window.ELASTICSEARCH_LESSONS || [];

window.ELASTICSEARCH_LESSONS.push({
  id: 'cluster-sharding',
  title: 'Cluster, Sharding & Arsitektur Terdistribusi',
  chapter: 'Arsitektur',
  duration: '16 menit',
  intro: [
    'Bayangkan satu perpustakaan yang tumbuh sampai gedungnya tidak muat. Jawabannya bukan membeli rak yang lebih panjang tanpa batas, tetapi <b>memindahkan sebagian koleksi ke gedung kedua</b> dan menyusun aturan bagaimana petugas menemukan buku di antara dua gedung. Elasticsearch tumbuh dengan cara yang sama: data dipecah menjadi shard, dan shard disebar ke banyak node.',
    'Di pelajaran ini kamu mempelajari tiga hal yang menentukan ketahanan Elasticsearch: <b>cluster</b> (kelompok node yang bekerja sebagai satu kesatuan), <b>node</b> (satu proses Elasticsearch dengan perannya masing-masing), dan <b>shard</b> (potongan index — primary untuk data asli, replica untuk salinan). Kamu juga membaca <b>cluster health</b> (green, yellow, red) yang menjadi lampu lalu lintas seluruh sistem.',
    'Semua ini tidak lagi teoretis: kamu akan menjalankan <b>cluster dua node dengan Podman Compose</b>, membuat index berisi primary dan replica, lalu mematikan satu node untuk melihat failover dan recovery bekerja di depan mata. Di sinilah Elasticsearch berhenti sekadar menjadi &quot;database untuk search&quot; dan mulai terlihat sebagai sistem terdistribusi.'
  ],
  objectives: [
    'Menjelaskan peran cluster, node, dan tugas tiap node role',
    'Membedakan primary shard dan replica shard beserta pengaruhnya terhadap cluster health',
    'Menjalankan cluster dua node dan mengamati alokasi shard, failover, dan recovery',
    'Membaca cluster health, allocation explain, serta membuat index template dan alias'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Anatomi sebuah cluster</h3><p>Elasticsearch dirancang sejak awal untuk berjalan di banyak mesin. Kumpulan mesin itu disebut <b>cluster</b>, dan setiap mesin menjalankan satu <b>node</b>. Karena itu &quot;server Elasticsearch&quot; yang kamu jalankan di lab sebenarnya sudah sebuah cluster — hanya berisi satu node.</p><table><thead><tr><th>Istilah</th><th>Peran</th><th>Analogi perpustakaan</th></tr></thead><tbody><tr><td>Cluster</td><td>Kesatuan seluruh node, punya satu <code>cluster_name</code></td><td>Gedung-gedung perpustakaan yang bekerja sama</td></tr><tr><td>Node</td><td>Satu proses Elasticsearch</td><td>Satu gedung</td></tr><tr><td>Index</td><td>Kumpulan document serupa</td><td>Satu koleksi (mis. majalah)</td></tr><tr><td>Primary shard</td><td>Potongan asli data index</td><td>Bagian asli koleksi</td></tr><tr><td>Replica shard</td><td>Salinan primary</td><td>Salinan untuk pengunjung lain</td></tr></tbody></table><h3>Node roles: siapa mengerjakan apa</h3><p>Satu node bisa memegang beberapa peran. Dalam lab single-node, semuanya menumpuk pada satu proses — tetapi di cluster produksi peran ini dipisahkan agar masing-masing bisa dioptimalkan.</p><table><thead><tr><th>Role</th><th>Tugas</th><th>Perhatian</th></tr></thead><tbody><tr><td><b>Master-eligible</b></td><td>Menjaga cluster state &amp; memilih pemimpin</td><td>Jangan terlalu banyak; harus mayoritas selamat</td></tr><tr><td><b>Data</b></td><td>Menyimpan shard &amp; melayani index/search</td><td>Butuh disk dan memori besar</td></tr><tr><td><b>Ingest</b></td><td>Memproses data sebelum masuk (pipeline)</td><td>Beban CPU pra-indexing</td></tr><tr><td><b>Coordinating</b></td><td>Menerima request, mendistribusikan, menggabung hasil</td><td>Tidak menyimpan data</td></tr></tbody></table>'
    },
    {
      type: 'example',
      title: 'Membaca cluster health dan daftar node',
      lang: 'http',
      output: false,
      code: `GET /_cluster/health?pretty

GET /_cat/nodes?v
GET /_cat/indices?v
GET /_cat/shards?v

# siapa yang dipilih jadi master, dan mengapa?
GET /_cluster/health?filter_path=status,cluster_name,number_of_nodes,
  initializing_shards,unassigned_shards,relocating_shards`,
      explain: [
        'Field <code>status</code> adalah lampu lalu lintas: <b>green</b> (semua primary dan replica aktif), <b>yellow</b> (primary aktif, ada replica belum teralokasi), <b>red</b> (ada primary yang hilang — data tidak bisa dibaca penuh).',
        '<code>_cat/nodes</code> menampilkan node beserta role-nya (<code>dim</code> untuk master/data/ingest), pemakaian heap, dan beban — cara cepat memastikan node yang kamu jalankan benar-benar ikut cluster.',
        '<code>_cat/shards</code> menunjukkan shard mana <code>p</code> (primary) dan mana <code>r</code> (replica), di node mana, dan statusnya — inilah bukti nyata data benar-benar dipecah.',
        'Field <code>unassigned_shards</code> menjelaskan warna yellow: replica menunggu node lain menampungnya; pada cluster satu node, replica memang tidak bisa dialokasikan — itu normal, bukan kerusakan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Primary, replica, dan mengapa cluster bisa yellow</h3><p>Ketika kamu membuat index dengan <code>number_of_shards: 3</code> dan <code>number_of_replicas: 1</code>, Elasticsearch menyiapkan enam potongan: tiga primary (penyimpan asli) dan tiga replica (salinannya). Aturan utamanya sederhana: <b>replica tidak pernah ditempatkan di node yang sama dengan primary-nya</b> — kalau node itu mati, keduanya ikut hilang dan salinannya jadi percuma.</p><table><thead><tr><th>Kondisi</th><th>Health</th><th>Arti</th><th>Tindakan</th></tr></thead><tbody><tr><td>Semua primary + replica aktif</td><td><b>green</b></td><td>Siap penuh</td><td>Normal</td></tr><tr><td>Replica belum teralokasi</td><td><b>yellow</b></td><td>Read tetap jalan, redundancy kurang</td><td>Tambah node atau turunkan jumlah replica</td></tr><tr><td>Ada primary hilang</td><td><b>red</b></td><td>Sebagian data tidak terbaca</td><td>Pulihkan node / restore snapshot</td></tr></tbody></table><p>Perhatikan keputusan penting: <b>cluster health menyangkut seluruh cluster, bukan satu index</b>. Satu index tunggal yang replica-nya belum dialokasi sudah membuat seluruh cluster berwarna yellow — inilah alasan kamu harus memeriksa <code>_cat/indices</code> untuk menemukan biang keladinya.</p>'
    },
    {
      type: 'example',
      title: 'Lab cluster dua node dengan Podman Compose',
      lang: 'cfg',
      output: false,
      code: `services:
  es-node1:
    image: docker.io/library/elasticsearch:8.17.0
    container_name: es-node1
    environment:
      - cluster.name=elastic-lab
      - node.name=es-node1
      - discovery.seed_hosts=es-node2
      - cluster.initial_master_nodes=es-node1,es-node2
      - xpack.security.enabled=false
      - ES_JAVA_OPTS=-Xms1g -Xmx1g
    ports:
      - "9200:9200"
    networks:
      - elastic-lab

  es-node2:
    image: docker.io/library/elasticsearch:8.17.0
    container_name: es-node2
    environment:
      - cluster.name=elastic-lab
      - node.name=es-node2
      - discovery.seed_hosts=es-node1
      - cluster.initial_master_nodes=es-node1,es-node2
      - xpack.security.enabled=false
      - ES_JAVA_OPTS=-Xms1g -Xmx1g
    ports:
      - "9201:9200"
    networks:
      - elastic-lab

networks:
  elastic-lab:`,
      explain: [
        '<code>cluster.name</code> yang sama mengikat kedua proses menjadi satu cluster; <code>node.name</code> memberi nama unik agar mudah dikenali di <code>_cat/nodes</code>.',
        '<code>discovery.seed_hosts</code> menyebut alamat node lain yang bisa diajak bergabung — inilah &quot;gerbang perkenalan&quot; yang membuat node menemukan satu sama lain lewat network.',
        '<code>cluster.initial_master_nodes</code> hanya ditulis saat <b>bootstrap cluster baru</b>; setelah cluster terbentuk, jangan mengubahnya lagi sebab fungsinya hanya untuk pemilihan awal.',
        'Dua node = dua proses JVM, jadi siapkan RAM memadai (minimal 2 GB per node di lab); kurangi <code>ES_JAVA_OPTS</code> bila mesinmu sempit. Port 9200 dan 9201 dipetakan ke host agar kamu bisa menembak tiap node langsung.'
      ]
    },
    {
      type: 'example',
      title: 'Membuat index dengan primary + replica lalu mengamati alokasinya',
      lang: 'http',
      output: false,
      code: `# buat index 2 primary, 1 replica (butuh minimal 2 node agar green)
PUT /orders
{
  "settings": {
    "number_of_shards": 2,
    "number_of_replicas": 1
  }
}

GET /_cat/shards?v
GET /_cluster/health?pretty

# kenapa shard ini belum punya tempat?
GET /_cluster/allocation/explain
{
  "index": "orders",
  "shard": 0,
  "primary": false
}`,
      explain: [
        'Dengan dua node dan <code>number_of_replicas: 1</code>, tiap primary punya tempat untuk replica di node lain sehingga cluster mencapai <b>green</b>.',
        '<code>_cat/shards</code> memperlihatkan pasangan <code>p</code> dan <code>r</code> berada di node berbeda — periksa kolom <code>node</code> untuk membuktikannya.',
        '<code>_cluster/allocation/explain</code> menjawab pertanyaan &quot;kenapa shard ini tidak dialokasikan?&quot; dengan alasan spesifik seperti &quot;tidak ada node yang memenuhi syarat&quot; — alat troubleshooting utama untuk masalah shard.',
        'Bila kamu menambah <code>number_of_replicas</code> jadi 3 di cluster dua node, replica ketiga dan keempat tidak punya tempat — cluster kembali yellow, dan allocation explain akan menjelaskannya apa adanya.'
      ]
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 320" width="760" role="img" aria-label="Cluster Elasticsearch dua node: index orders terpecah menjadi shard primary pada node1 dan node2 dengan replica di node berlawanan, cluster state dijaga master eligible, saat node1 mati replica menjadi primary dan cluster berubah yellow lalu pulih saat node kembali">
        <text x="30" y="34" class="u-title" text-anchor="start">Cluster dua node: primary &amp; replica</text>
        <rect x="30" y="58" width="330" height="150" rx="10" class="u-box"/>
        <text x="195" y="86" class="u-title" text-anchor="middle">node es-node1 (:9200)</text>
        <rect x="48" y="102" width="146" height="42" rx="6" class="u-hd"/>
        <text x="121" y="128" class="u-lbl" text-anchor="middle">primary shard 0</text>
        <rect x="206" y="102" width="136" height="42" rx="6" class="u-box"/>
        <text x="274" y="128" class="u-lbl" text-anchor="middle">replica shard 1</text>
        <text x="195" y="178" class="u-lbl" text-anchor="middle">role: master-eligible + data</text>
        <rect x="400" y="58" width="330" height="150" rx="10" class="u-box"/>
        <text x="565" y="86" class="u-title" text-anchor="middle">node es-node2 (:9201)</text>
        <rect x="418" y="102" width="146" height="42" rx="6" class="u-box"/>
        <text x="491" y="128" class="u-lbl" text-anchor="middle">replica shard 0</text>
        <rect x="576" y="102" width="136" height="42" rx="6" class="u-hd"/>
        <text x="644" y="128" class="u-lbl" text-anchor="middle">primary shard 1</text>
        <text x="565" y="178" class="u-lbl" text-anchor="middle">role: master-eligible + data</text>
        <line x1="366" y1="130" x2="394" y2="130" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="380" y="118" class="u-lbl" text-anchor="middle">discovery</text>
        <rect x="140" y="234" width="480" height="62" rx="10" class="u-hd"/>
        <text x="380" y="260" class="u-lbl" text-anchor="middle">node1 mati → replica shard 0 naik jadi primary</text>
        <text x="380" y="284" class="u-lbl" text-anchor="middle">cluster: yellow (redundancy berkurang) → node kembali → green</text>
        <text x="380" y="316" class="u-lbl" text-anchor="middle">replica tidak pernah se-temat dengan primary-nya</text>
      </svg></div><figcaption>Shard tersebar agar primary dan replica berada di node berbeda; kegagalan satu node memindahkan peran, bukan menghapus data.</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Simulasi failover: matikan satu node dan amati pemulihan',
      lang: 'bash',
      output: false,
      code: `# pastikan cluster sehat dulu
curl "http://localhost:9200/_cluster/health?pretty"
curl "http://localhost:9201/_cluster/health?pretty"

# matikan salah satu node
podman compose stop es-node2
curl "http://localhost:9200/_cluster/health?pretty"
curl "http://localhost:9200/_cat/shards?v"

# nyalakan kembali dan amati recovery
podman compose start es-node2
sleep 20
curl "http://localhost:9200/_cat/nodes?v"
curl "http://localhost:9200/_cluster/health?pretty"`,
      explain: [
        'Sebelum node dimatikan, kedua endpoint menjawab dengan <code>status: green</code> dan jumlah node 2 — titik acuan pembanding.',
        'Setelah <code>stop es-node2</code>, cluster berubah <b>yellow</b>: primary tetap utuh (ia ada di node1) tetapi replica yang semula di node2 kehilangan tempat; bila primary yang hilang ada di node2, cluster akan <b>red</b> sampai node kembali.',
        'Saat dinyalakan lagi, node bergabung kembali ke cluster, shard dialokasikan ulang, dan status kembali green — proses ini disebut <b>recovery</b> dan terlihat di <code>_cat/shards</code> berstatus <code>initializing</code> sementara.',
        'Ini inti dari <b>failover</b>: ketersediaan dipertahankan oleh salinan, bukan oleh satu mesin yang tidak pernah boleh mati. Selalu uji skenario ini di lab sebelum mengklaim sistemmu tahan kegagalan.'
      ]
    },
    {
      type: 'example',
      title: 'Index template, data stream, dan alias untuk rolling index',
      lang: 'http',
      output: false,
      code: `# template: pengaturan otomatis untuk index log-*
PUT /_index_template/logs_template
{
  "index_patterns": ["logs-*"],
  "template": {
    "settings": {
      "number_of_shards": 2,
      "number_of_replicas": 1
    },
    "mappings": {
      "properties": {
        "@timestamp": { "type": "date" },
        "message": { "type": "text" },
        "level": { "type": "keyword" }
      }
    }
  }
}

# alias dengan pembacaan saja (untuk proses rolling)
POST /_aliases
{
  "actions": [
    { "add": { "index": "logs-2026.11", "alias": "logs-current", "is_write_index": false } }
  ]
}`,
      explain: [
        '<code>index_patterns</code> membuat pengaturan dan mapping otomatis diterapkan ke setiap index baru yang namanya cocok — kamu tidak perlu menyalin konfigurasi ke setiap index harian.',
        'Template adalah tempat terbaik menyimpan keputusan tetap seperti jumlah shard dan mapping timestamp; perubahan di sini berlaku untuk index baru berikutnya, bukan index lama.',
        'Alias seperti <code>logs-current</code> membuat aplikasi cukup menulis/membaca satu nama, sementara di belakangnya kamu berganti index tiap hari/minggu (rolling) tanpa mengubah kode.',
        'Data stream adalah mekanisme bawaan untuk pola ini: satu alias tulis yang mengarah ke banyak index time-based, lengkap dengan pengaturan lifecycle-nya.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan umum saat bermain dengan cluster',
      text: '<ul><li><b>Mengubah <code>cluster.initial_master_nodes</code> setelah cluster terbentuk</b> — parameter itu hanya untuk bootstrap; mengubahnya berisiko mengganggu pemilihan master.</li><li><b>Memakai nama cluster sama dengan cluster lain di jaringan</b> — node bisa tidak sengaja bergabung ke cluster yang salah; beri nama unik untuk lab.</li><li><b>Panik saat melihat yellow</b> — pada cluster satu node, yellow karena replica tidak bisa dialokasikan adalah normal; yang perlu dikhawatirkan adalah <b>red</b>.</li><li><b>Replica sama dengan jumlah node atau lebih</b> — kelebihan replica hanya memakan disk dan membuat shard tidak punya tempat; sisakan ruang untuk kegagalan.</li><li><b>Menambah node tanpa memeriksa alokasi</b> — setelah node baru masuk, Elasticsearch memang memindahkan sebagian shard (relocating); pantau dengan <code>_cat/shards</code> agar tidak kaget akan lonjakan I/O.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Baca cluster seperti dokter membaca tanda vital',
      text: '<p>Lakukan tiga pemeriksaan ini secara berkala dan hafalkan bentuk normalnya: <code>_cluster/health</code> (warna), <code>_cat/nodes</code> (siapa saja yang hidup), dan <code>_cat/shards</code> (di mana data berada). Saat terjadi masalah, ketiganya langsung mempersempit dugaan: warna merah berarti data hilang, node berkurang berarti kegagalan mesin, shard unassigned berarti masalah alokasi. Tiga baris itu menyelamatkan jam-jam tebakan.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Cluster', 'Kumpulan node Elasticsearch yang bekerja sebagai satu kesatuan dengan cluster state bersama.'],
        ['Node', 'Satu proses Elasticsearch; bisa memiliki peran master, data, ingest, atau coordinating.'],
        ['Master-eligible', 'Node yang berhak terpilih menjaga cluster state dan mengelola alokasi shard.'],
        ['Shard', 'Potongan index; memungkinkan index dibagi dan disebar ke banyak node.'],
        ['Primary shard', 'Potongan data asli; dokumen ditulis ke primary terlebih dahulu.'],
        ['Replica shard', 'Salinan primary di node lain; sumber ketahanan bila node mati.'],
        ['Cluster health', 'Status ringkas cluster: green, yellow, atau red, dilihat lewat <code>_cluster/health</code>.'],
        ['Allocation', 'Proses penempatan shard ke node; dapat dijelaskan dengan <code>_cluster/allocation/explain</code>.'],
        ['Failover', 'Peralihan peran ke salinan saat node utama gagal; diikuti recovery saat node kembali.'],
        ['Index template', 'Konfigurasi otomatis yang diterapkan ke index baru berdasarkan pola namanya.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Jalankan cluster dua node, lalu buktikan dengan <code>_cat/nodes</code> bahwa ada dua node dan dengan <code>_cat/shards</code> bahwa primary serta replica berada di node berbeda.</li><li>Buat index dengan <code>number_of_shards: 2</code> dan <code>number_of_replicas: 1</code>; amati cluster menjadi green, lalu ubah replica menjadi 2 dan jelaskan kenapa bisa yellow.</li><li>Matikan satu node, catat perubahan cluster health dan posisi shard, lalu nyalakan kembali dan amati proses recovery sampai kembali hijau.</li><li>Buat index template untuk pola <code>logs-*</code> dan satu alias; jelaskan keduanya masing-masing menyelesaikan masalah apa. <b>Checkpoint:</b> mampu menjelaskan primary vs replica, membaca cluster health, membaca hasil allocation explain, dan memprediksi apa yang terjadi saat satu node mati.</li></ol>'
    }
  ],
  recap: [
    'Cluster = kumpulan node; node memegang peran <b>master-eligible, data, ingest, coordinating</b> yang dapat dipisah di produksi.',
    'Index dipecah menjadi <b>primary shard</b> (asli) dan <b>replica</b> (salinan) — dan replica tidak pernah ditempatkan pada node yang sama dengan primary-nya.',
    '<b>Cluster health</b>: green (siap), yellow (replica belum teralokasi), red (primary hilang); periksa <code>_cat/indices</code> untuk menemukan biang keladinya.',
    'Lab dua node memakai <code>discovery.seed_hosts</code> dan <code>cluster.initial_master_nodes</code> (hanya saat bootstrap); <b>allocation explain</b> menjawab &quot;kenapa shard tidak dialokasikan&quot;, dan <b>alias + index template</b> mengelola pertumbuhan index.'
  ]
});
