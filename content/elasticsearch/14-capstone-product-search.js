/* ============================================================
   Pelajaran Elasticsearch — 14: Capstone Product Search & Discovery
   (Roadmap Level 10 — bab Capstone)
   ============================================================ */
'use strict';

window.ELASTICSEARCH_LESSONS = window.ELASTICSEARCH_LESSONS || [];

window.ELASTICSEARCH_LESSONS.push({
  id: 'capstone-product-search',
  title: 'Capstone: Product Search & Discovery Platform',
  chapter: 'Capstone',
  duration: '20 menit',
  intro: [
    'Seluruh bab ini adalah potongan-potongan: mapping di satu pelajaran, bool query di pelajaran lain, aggregation, analyzer, cluster, keamanan. <b>Capstone menyatukannya menjadi satu sistem yang benar-benar bisa kamu tunjukkan</b> — platform pencarian dan penemuan produk yang menyerupai katalog e-commerce sungguhan.',
    'Kamu akan menyusun keempat lapis sekaligus: <b>model produk</b> dengan mapping eksplisit, <b>fitur pencarian</b> (full-text, multi-field, fuzzy, highlight, autocomplete, synonym), <b>filtering &amp; sorting</b>, dan <b>analytics</b> berupa aggregation. Di samping itu ada lapis operasional: Podman Compose, persistent storage, health check, logging, keamanan, backup, sampai load testing.',
    'Pelajaran ini ditutup dengan <b>Definition of Done</b> — daftar periksa yang menentukan apakah proyekmu benar-benar selesai, bukan sekadar &quot;terlihat berjalan di layar&quot;. Di situlah pembeda antara mengikuti tutorial dan memiliki sistem yang siap dipakai.'
  ],
  objectives: [
    'Menyusun model produk dengan mapping eksplisit yang mendukung seluruh fitur pencarian',
    'Membangun endpoint search: query, filter, sort, pagination, highlight, dan autocomplete',
    'Menambahkan aggregation untuk analytics katalog serta autocomplete dengan suggester',
    'Menerapkan lapisan operasional dan menilai proyek dengan Definition of Done'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Apa yang membuat capstone ini &quot;mahir&quot;?</h3><p>Proyek pencarian produk terlihat sederhana dari luar: kotak pencarian, daftar hasil, panel filter. Yang membedakan hasil akhirnya adalah keputusan di balik layar — tipe field yang tepat, query yang memisahkan pencarian dari filter, pagination yang tidak jebol di data besar, dan penanganan saat Elasticsearch sedang mati.</p><table><thead><tr><th>Lapis</th><th>Isi</th><th>Pelajaran sumber</th></tr></thead><tbody><tr><td>Data</td><td>Model produk + mapping eksplisit</td><td>Index &amp; Mapping</td></tr><tr><td>Search</td><td>Full-text, multi-field, fuzzy, highlight</td><td>Query DSL &amp; Advanced Search</td></tr><tr><td>Discovery</td><td>Autocomplete, synonym, typo tolerance</td><td>Analyzer &amp; Aggregation</td></tr><tr><td>Analytics</td><td>Aggregation kategori, harga, brand</td><td>Advanced Search &amp; Aggregation</td></tr><tr><td>Operasional</td><td>Compose, health, backup, security, load test</td><td>Setup, Security, Backup</td></tr></tbody></table><p>Prinsip arsitektur yang dipakai: <b>database relasional tetap source of truth</b>, Elasticsearch adalah <b>derived data</b> yang disinkronkan. Pencarian boleh sedikit tertinggal dari database (eventual), tetapi tidak boleh hilang tanpa jejak — di sinilah bulk ingestion, idempotensi, dan reconciliation berperan.</p>'
    },
    {
      type: 'example',
      title: 'Model produk dan mapping eksplisit',
      lang: 'http',
      output: false,
      code: `PUT /products
{
  "settings": {
    "number_of_shards": 2,
    "number_of_replicas": 1,
    "analysis": {
      "filter": {
        "product_synonym": {
          "type": "synonym",
          "synonyms": ["laptop, notebook", "mouse, tetikus"]
        }
      },
      "analyzer": {
        "product_text": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "product_synonym"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "product_id":      { "type": "keyword" },
      "name":            {
        "type": "text",
        "analyzer": "product_text",
        "fields": { "keyword": { "type": "keyword" } }
      },
      "description":     { "type": "text", "analyzer": "product_text" },
      "category":        { "type": "keyword" },
      "brand":           { "type": "keyword" },
      "price":           { "type": "long" },
      "stock":           { "type": "integer" },
      "status":          { "type": "keyword" },
      "tags":            { "type": "keyword" },
      "created":         { "type": "date" },
      "rating":          { "type": "float" }
    }
  }
}`,
      explain: [
        'Setiap field punya keputusan: <code>product_id</code>, <code>category</code>, <code>brand</code>, <code>status</code>, dan <code>tags</code> memakai <code>keyword</code> untuk filter/sort/agregasi; <code>name</code> dan <code>description</code> memakai analyzer khusus untuk pencarian penuh.',
        'Analyzer <code>product_text</code> menambahkan sinonim <code>laptop ↔ notebook</code> sehingga pengguna yang mengetik &quot;notebook murah&quot; tetap menemukan produk &quot;Laptop ...&quot; — sinonim diterapkan saat indexing.',
        'Sub-field <code>name.keyword</code> memungkinkan sort nama produk dan aggregasi brand/kategori yang tepat — tanpa itu, sorting nama tidak bisa dilakukan dengan benar.',
        '<code>rating</code> memakai <code>float</code> dan <code>created</code> memakai <code>date</code> sehingga keduanya mendukung filter rentang dan aggregasi temporal; keputusan mapping ini harus selesai sebelum data produksi masuk.'
      ]
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 320" width="760" role="img" aria-label="Arsitektur capstone product search: web frontend terhubung ke backend API yang menulis ke database source of truth dan membaca dari Elasticsearch search engine, Kibana menampilkan dashboard, dengan pengiriman bulk dan pengaturan health check">
        <text x="30" y="34" class="u-title" text-anchor="start">Product Search &amp; Discovery Platform</text>
        <rect x="300" y="54" width="160" height="52" rx="8" class="u-hd"/>
        <text x="380" y="86" class="u-lbl" text-anchor="middle">Web Frontend</text>
        <line x1="380" y1="110" x2="380" y2="146" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="396" y="132" class="u-lbl" text-anchor="start">HTTP</text>
        <rect x="290" y="152" width="180" height="56" rx="8" class="u-box"/>
        <text x="380" y="186" class="u-lbl" text-anchor="middle">Backend API</text>
        <line x1="330" y1="212" x2="200" y2="248" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="430" y1="212" x2="560" y2="248" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="60" y="252" width="170" height="54" rx="8" class="u-hd"/>
        <text x="145" y="284" class="u-lbl" text-anchor="middle">Database (source of truth)</text>
        <rect x="530" y="252" width="200" height="54" rx="8" class="u-hd"/>
        <text x="630" y="278" class="u-lbl" text-anchor="middle">Elasticsearch</text>
        <text x="630" y="298" class="u-lbl" text-anchor="middle">search index (derived)</text>
        <rect x="60" y="152" width="150" height="56" rx="8" class="u-box"/>
        <text x="135" y="176" class="u-lbl" text-anchor="middle">Kibana</text>
        <text x="135" y="198" class="u-lbl" text-anchor="middle">dashboard</text>
        <line x1="216" y1="180" x2="286" y2="180" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="380" y="330" class="u-lbl" text-anchor="middle">bulk ingestion + idempotency + reconciliation; ES down pun aplikasi tetap hidup</text>
      </svg></div><figcaption>Database memegang kebenaran, Elasticsearch memegang pencarian; backend menjembatani keduanya dan tetap melayani saat search service sedang tersendat.</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Endpoint search lengkap: query, filter, sort, pagination, highlight',
      lang: 'http',
      output: false,
      code: `GET /products/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "multi_match": {
            "query": "gaming laptop",
            "fields": ["name^3", "brand^2", "description"],
            "fuzziness": "AUTO"
          }
        }
      ],
      "filter": [
        { "terms": { "category": ["laptop"] } },
        { "range": { "price": { "gte": 5000000, "lte": 30000000 } } },
        { "range": { "rating": { "gte": 4 } } },
        { "term": { "status": "active" } }
      ],
      "must_not": [
        { "term": { "stock": 0 } }
      ]
    }
  },
  "sort": [
    { "_score": "desc" },
    { "price": "asc" },
    { "_id": "asc" }
  ],
  "from": 0,
  "size": 12,
  "_source": ["product_id", "name", "brand", "price", "rating", "stock"],
  "highlight": {
    "fields": { "name": {}, "description": {} }
  },
  "aggs": {
    "kategori": { "terms": { "field": "category" } },
    "brand": { "terms": { "field": "brand", "size": 20 } },
    "harga_rata": { "avg": { "field": "price" } },
    "rentang_harga": {
      "range": {
        "field": "price",
        "ranges": [
          { "to": 5000000 },
          { "from": 5000000, "to": 15000000 },
          { "from": 15000000 }
        ]
      }
    }
  }
}`,
      explain: [
        'Bagian <code>must</code> menampung pencarian relevan dengan boost dan fuzzy; <code>filter</code> menampung checkbox kategori, harga, rating, dan status yang tidak memengaruhi skor — persis pemisahan query context dan filter context yang kamu pelajari.',
        '<code>must_not</code> mengeluarkan produk habis stok; <code>sort</code> menggabungkan relevansi lalu harga, dengan <code>_id</code> sebagai pengikat agar pagination stabil.',
        '<code>size: 12</code> cocok untuk grid katalog, <code>_source</code> memilih field daftar agar ringan, dan <code>highlight</code> menandai kata kunci pada nama serta deskripsi.',
        'Bagian <code>aggs</code> mengisi panel filter: hitung per kategori dan brand, rata-rata harga, serta rentang harga — seluruhnya dari satu request yang sama.'
      ]
    },
    {
      type: 'example',
      title: 'Autocomplete dengan completion suggester',
      lang: 'http',
      output: false,
      code: `# mapping khusus untuk suggest (field completion)
PUT /products_suggest
{
  "mappings": {
    "properties": {
      "suggest": {
        "type": "completion"
      },
      "name": { "type": "text" }
    }
  }
}

# ambil saran berdasarkan awalan kata
GET /products_suggest/_search
{
  "suggest": {
    "product-suggest": {
      "prefix": "gam",
      "completion": {
        "field": "suggest",
        "size": 5,
        "skip_duplicates": true
      }
    }
  }
}

# alternatif ringan: search biasa untuk kata sebagian
GET /products/_search
{
  "query": {
    "prefix": { "name.keyword": "Gam" }
  },
  "size": 5
}`,
      explain: [
        'Field tipe <code>completion</code> dibangun khusus sebagai struktur sugesti (DAG) sehingga pencarian awalan kata sangat cepat — cocok untuk kotak autocomplete yang mengetik tiap huruf.',
        'Parameter <code>prefix</code> berisi teks yang sudah diketik pengguna; <code>size</code> membatasi jumlah saran dan <code>skip_duplicates</code> mencegah saran kembar muncul.',
        'Setiap dokumen memerlukan field <code>suggest</code> berisi teks yang layak disarakan (biasanya nama produk) — isi saat indexing, bukan saat query.',
        'Untuk kebutuhan sederhana, <code>prefix</code> pada field keyword cukup; completion suggester unggul saat data besar dan latensi ketikan harus sangat rendah.'
      ]
    },
    {
      type: 'example',
      title: 'Simulasi Elasticsearch down dan health check',
      lang: 'bash',
      output: false,
      code: `# health check yang dipakai backend
curl -fsS http://localhost:9200/_cluster/health || echo "ES DOWN"

# hentikan search service di tengah jalan
podman compose stop elasticsearch

# aplikasi seharusnya: fallback ke DB, tampilkan pesan wajar,
# dan TIDAK mengembalikan error 500 ke pengguna
curl -s -o /dev/null -w "%{http_code}\n" \\
  "http://localhost:3000/search?q=laptop"

# pulihkan dan pastikan sinkronisasi berjalan
podman compose start elasticsearch
sleep 25
curl -fsS "http://localhost:9200/_cluster/health?pretty"`,
      explain: [
        'Health check backend sebaiknya memeriksa Elasticsearch secara berkala dan menyimpan statusnya — bukan menunggu setiap request search gagal.',
        'Saat ES mati, strategi yang benar adalah <b>degradasi terkendali</b>: cari ke database (lambat tapi ada) atau tampilkan pesan &quot;pencarian tidak tersedia&quot; — bukan error 500 yang merusak pengalaman.',
        'Setelah pulih, jalankan reconciliation: bandingkan jumlah dokumen di ES dengan database, lalu kirim ulang yang kurang (biasanya lewat bulk dengan idempotency).',
        'Uji kegagalan seperti ini adalah bagian dari Definition of Done — sistem yang belum pernah diuji saat komponennya mati belum terbukti tangguh.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Lapisan operasional yang wajib ada</h3><p>Fitur pencarian yang bagus tanpa operasional adalah demo, bukan sistem. Berikut daftar yang melengkapi capstone ini — masing-masing sudah kamu pelajari di pelajaran sebelumnya.</p><table><thead><tr><th>Aspek</th><th>Yang dikerjakan</th><th>Standar penyelesaian</th></tr></thead><tbody><tr><td>Compose &amp; storage</td><td>Satu perintah menjalankan seluruh stack</td><td><code>podman compose up -d</code> dari repo bersih</td></tr><tr><td>Health check</td><td>Endpoint health backend + ES</td><td>Status jelas saat ES sehat/sakit</td></tr><tr><td>Logging</td><td>Log akses &amp; error search</td><td>Query lambat terlihat di log</td></tr><tr><td>Monitoring</td><td>Metrik cluster &amp; latency pencarian</td><td>Tahu kapan pencarian melambat</td></tr><tr><td>Security</td><td>Auth untuk API dan cluster</td><td>Tidak ada port 9200 terbuka publik</td></tr><tr><td>Backup</td><td>Snapshot terjadwal + restore teruji</td><td>Restore pernah dibuktikan</td></tr><tr><td>Load testing</td><td>Uji pencarian paralel</td><td>Angka latency &amp; throughput tercatat</td></tr></tbody></table>'
    },
    {
      type: 'example',
      title: 'Definition of Done: daftar periksa akhir',
      lang: 'text',
      output: false,
      code: `Definition of Done — Product Search & Discovery
-----------------------------------------------
[ ] Seluruh container jalan dengan satu perintah compose
[ ] Data tidak hilang saat container dihapus & dijalankan ulang
[ ] Index memakai mapping eksplisit (bukan tebakan dynamic)
[ ] Search: query, filter, sort, pagination jalan satu endpoint
[ ] Highlight & fuzzy bekerja pada hasil pencarian
[ ] Autocomplete memberi saran yang relevan
[ ] Aggregation kategori/harga/brand tampil benar
[ ] Elasticsearch down: aplikasi tetap melayani (degradasi)
[ ] Timeout, retry berbatas, dan error handling terpasang
[ ] Snapshot terjadwal & restore pernah diuji
[ ] Dokumentasi API + setup tersedia di README
[ ] Benchmark sederhana tercatat (latency p50/p95)
[ ] Project jalan ulang dari repository yang bersih

Rubrik "mahir"
-----------------------------------------------
Lulus  = seluruh item terpenuhi & bisa didemokan
Mahir  = bisa menjelaskan SETIAP keputusan: kenapa
         keyword utk brand, kenapa filter bukan must,
         kenapa search_after utk halaman jauh, dan apa
         yang terjadi saat cluster berubah yellow`,
      explain: [
        'Daftar ini bersifat objektif: tiap baris bisa dijawab ya/tidak dengan bukti (perintah, screenshot, atau angka) — menghindari penilaian &quot;sepertinya sudah jalan&quot;.',
        'Item &quot;Elasticsearch down: aplikasi tetap melayani&quot; adalah pembeda tersulit dan paling berharga; ia menguji integrasi, bukan sekadar fitur search.',
        'Rubrik menekankan bahwa indikator mahir bukan jumlah fitur, melainkan kemampuan <b>menjelaskan alasan</b> di balik tiap keputusan teknis.',
        'Simpan daftar ini sebagai README proyekmu — penerima manfaat pertama dari dokumentasi itu adalah kamu sendiri tiga bulan lagi.'
      ]
    },
    {
      type: 'warn',
      title: 'Jebakan capstone',
      text: '<ul><li><b>Mengejar jumlah fitur tanpa fondasi</b> — autocomplete tanpa mapping yang benar, fuzzy tanpa uji performa; perbaiki fondasi dulu.</li><li><b>Lupa sinkronisasi data</b> — produk baru tidak pernah muncul di pencarian karena tidak ada mekanisme indexing setelah insert di database.</li><li><b>Pagination lompat-lompat</b> — sort tanpa pengikat unik membuat produk terlewat atau ganda di halaman berikutnya.</li><li><b>Belum pernah menguji kegagalan</b> — sistem yang hanya diuji dalam keadaan sehat akan mengejutkanmu saat produksi.</li><li><b>Tidak ada dokumentasi</b> — tanpa README cara setup dan daftar endpoint, proyek hanya bisa dijalankan oleh pembuatnya.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Demo yang meyakinkan adalah demo yang sudah pernah gagal',
      text: '<p>Saat mempresentasikan capstone, siapkan satu skenario kegagalan yang kamu tunjukkan sendiri: matikan Elasticsearch di depan audiens, tunjukkan aplikasi tetap melayani dengan pesan yang wajar, lalu nyalakan kembali dan perlihatkan pemulihan. Presentasi seperti itu membuktikan kamu memahami sistemnya — bukan sekadar mengikuti langkah tutorial sampai layar menampilkan data.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Source of truth', 'Sumber kebenaran data (database relasional); Elasticsearch tidak otomatis menggantikannya.'],
        ['Derived data', 'Data turunan yang dibangun dari source of truth; dapat dibangun ulang dari awal bila hilang.'],
        ['Bulk ingestion', 'Pemasukan data banyak sekaligus lewat Bulk API agar indexing efisien.'],
        ['Idempotensi', 'Sifat operasi yang hasilnya sama walau dijalankan berulang — aman untuk retry.'],
        ['Reconciliation', 'Pencocokan ulang data antara database dan index untuk menutup selisih sinkronisasi.'],
        ['Completion suggester', 'Struktur field khusus untuk autocomplete berbasis awalan kata yang sangat cepat.'],
        ['Degradation terkendali', 'Menurunkan fitur dengan sopan saat komponen mati, bukan mengembalikan error.'],
        ['Definition of Done', 'Daftar periksa objektif yang menentukan kapan proyek benar-benar selesai.'],
        ['Load testing', 'Uji pencarian di bawah beban untuk mengukur latency dan throughput sebelum produksi.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Bangun index <code>products</code> dengan mapping eksplisit dan analyzer khusus (termasuk sinonim), lalu isi dengan minimal 100 produk lewat Bulk API.</li><li>Susun satu endpoint search yang melayani sekaligus: pencarian multi-field dengan boost, filter kategori/harga/rating, sorting, pagination, highlight, dan aggregation panel filter.</li><li>Tambahkan autocomplete dengan completion suggester, lalu uji dengan awalan kata yang salah ketik sebagian — catat perilakunya.</li><li>Jalankan seluruh Definition of Done satu per satu dan perbaiki apa yang gagal; terakhir, matikan Elasticsearch dan buktikan aplikasi tetap melayani. <b>Checkpoint:</b> mampu menyusun sistem pencarian produk lengkap — dari mapping sampai operasional — dan menjelaskan alasan setiap keputusan teknis di dalamnya.</li></ol>'
    }
  ],
  recap: [
    'Capstone menyatukan seluruh bab: <b>mapping eksplisit + analyzer khusus</b> untuk data, <b>bool + boost + fuzzy + highlight</b> untuk pencarian, <b>aggregation</b> untuk analytics.',
    'Arsitektur yang benar: <b>database sebagai source of truth</b>, Elasticsearch sebagai derived data yang disinkronkan lewat bulk, idempotensi, dan reconciliation.',
    'Operasional bukan pelengkap: compose, health check, logging, security, backup teruji, dan load testing membedakan demo dari sistem sungguhan.',
    'Indikator <b>mahir</b> adalah kemampuan menjelaskan alasan tiap keputusan — dan membuktikan sistem tetap hidup saat Elasticsearch sedang mati.'
  ]
});
