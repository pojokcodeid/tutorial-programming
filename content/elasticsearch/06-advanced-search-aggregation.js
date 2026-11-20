/* ============================================================
   Pelajaran Elasticsearch — 06: Advanced Search & Aggregation
   (Roadmap Level 5 — bab Pencarian)
   ============================================================ */
'use strict';

window.ELASTICSEARCH_LESSONS = window.ELASTICSEARCH_LESSONS || [];

window.ELASTICSEARCH_LESSONS.push({
  id: 'advanced-search-aggregation',
  title: 'Advanced Search & Aggregation',
  chapter: 'Pencarian',
  duration: '16 menit',
  intro: [
    'Bayangkan kamu masuk ke toko dan bertanya: &quot;Cari laptop gaming terjangkau, yang paling direkomendasikan, tolong sorot kata &quot;gaming&quot; di deskripsinya, dan sambil itu tunjukkan juga berapa produk di tiap kategori serta rata-rata harganya.&quot; Satu pertanyaan itu sebenarnya meminta empat hal sekaligus — <b>itu persis yang akan kamu kuasai di pelajaran ini</b>.',
    'Kamu mulai dari pencarian multi-field dengan <code>multi_match</code> dan boost, lalu masuk ke pencarian frasa, fuzzy (tahan salah ketik), dan highlight yang menandai kata kunci di hasil. Setelah itu kamu membuka dunia <b>aggregation</b>: metric (<code>avg</code>, <code>min</code>, <code>max</code>, <code>sum</code>) dan bucket (<code>terms</code>, <code>range</code>, <code>date histogram</code>) yang mengubah daftar dokumen menjadi ringkasan bisnis.',
    'Terakhir kamu menyusun semuanya menjadi <b>faceted search</b> — pola yang dipakai hampir semua halaman katalog e-commerce — dan mempelajari <code>nested</code> untuk data bersarang seperti item pesanan, termasuk trade-off performanya.'
  ],
  objectives: [
    'Menulis pencarian multi-field dengan boost dan memilih <code>type</code> yang tepat',
    'Menerapkan pencarian frasa, fuzzy, dan highlight pada hasil',
    'Membangun aggregation metric dan bucket untuk meringkas data',
    'Menyusun faceted search serta memahami kapan field <code>nested</code> diperlukan'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Satu pertanyaan, banyak dimensi</h3><p>Pencarian dasar menjawab &quot;apa yang cocok?&quot;. Pencarian nyata menambah dimensi: <b>dimensi mana yang paling penting</b> (boost), <b>seberapa mirip kata yang diketik pengguna</b> (fuzzy), <b>bagaimana menampilkannya</b> (highlight), dan <b>apa ringkasan dari seluruh hasil</b> (aggregation). Elasticsearch merancang API-nya agar keempatnya bisa muncul dalam satu request.</p><table><thead><tr><th>Fitur</th><th>Menjawab</th><th>Bentuk utama</th></tr></thead><tbody><tr><td><code>multi_match</code></td><td>Cari di banyak field sekaligus</td><td><code>fields: ["name^3", "brand^2"]</code></td></tr><tr><td><code>match_phrase</code></td><td>Cari frasa urut</td><td>&quot;mechanical keyboard&quot; berurutan</td></tr><tr><td><code>fuzzy</code></td><td>Tahan salah ketik</td><td><code>fuzziness: AUTO</code></td></tr><tr><td><code>highlight</code></td><td>Tandai kata kunci</td><td>fragment di sekitar kecocokan</td></tr><tr><td><code>aggs</code></td><td>Ringkas seluruh hasil</td><td>rata-rata, hitung per kategori</td></tr></tbody></table><p>Satu catatan penting: aggregation berjalan pada dokumen yang <b>lolos query</b>. Karena itu <code>size: 0</code> sering dipakai saat kamu hanya ingin ringkasan — tidak perlu mengirim dokumennya, hanya angkanya.</p>'
    },
    {
      type: 'example',
      title: 'Multi-match dengan boost dan pencarian frasa',
      lang: 'http',
      output: false,
      code: `GET /products/_search
{
  "query": {
    "multi_match": {
      "query": "gaming laptop",
      "fields": ["name^3", "brand^2", "description"],
      "type": "best_fields"
    }
  }
}

GET /products/_search
{
  "query": {
    "match_phrase": {
      "description": "mechanical keyboard"
    }
  }
}`,
      explain: [
        '<code>multi_match</code> menjalankan satu query ke beberapa field; simbol <code>^3</code> dan <code>^2</code> adalah <b>boost</b> — kecocokan pada <code>name</code> bernilai tiga kali lipat dibanding field biasa, sehingga produk yang namanya cocok naik ke atas.',
        '<code>type: "best_fields"</code> mengambil skor terbaik dari satu field; alternatif seperti <code>most_fields</code> menjumlahkan skor semua field — pilih <code>best_fields</code> bila satu field yang paling menentukan relevansi.',
        '<code>match_phrase</code> menuntut urutan kata berurutan: &quot;mechanical keyboard&quot; hanya cocok bila keduanya bertetangga dan berurutan — berbeda dari <code>match</code> yang menganggap dua kata itu terpisah.',
        'Untuk pencarian frasa, Elasticsearch tetap memakai posisi term, jadi frasa yang dicari harus dianalyzer dengan cara yang sama saat indexing dan saat query.'
      ]
    },
    {
      type: 'example',
      title: 'Fuzzy search dan highlight pada hasil',
      lang: 'http',
      output: false,
      code: `GET /products/_search
{
  "query": {
    "match": {
      "name": {
        "query": "gmaing laptop",
        "fuzziness": "AUTO"
      }
    }
  },
  "highlight": {
    "fields": {
      "name": {},
      "description": {}
    },
    "pre_tags": ["<b>"],
    "post_tags": ["</b>"]
    }
}`,
      explain: [
        '<code>fuzziness: AUTO</code> mengizinkan penyimpangan huruf sebanyak yang wajar terhadap panjang kata (1 huruf untuk kata pendek, 2 untuk panjang) — &quot;gmaing&quot; tetap menemukan &quot;gaming&quot;.',
        'Fuzzy bekerja lewat jarak edit (levenshtein); ia mahal bila dipakai pada awal kata atau data sangat besar, jadi gunakan sebagai jaring pengaman ketik salah, bukan default setiap query.',
        '<code>highlight</code> mengembalikan field <code>highlight</code> di tiap hit berisi potongan teks yang sudah ditandai dengan <code>pre_tags</code> dan <code>post_tags</code>.',
        'Highlight hanya bekerja pada field yang dianalyzer dan disimpan bersama posisinya; ia menampilkan fragment di sekitar kecocokan, bukan seluruh dokumen — cocok langsung ditampilkan di daftar hasil.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Aggregation: dari daftar dokumen menjadi ringkasan</h3><p>Aggregation membalik cara membaca hasil: alih-alih menampilkan dokumen, kamu meminta <b>angka</b>. Ada dua keluarga besar.</p><table><thead><tr><th>Keluarga</th><th>Fungsi</th><th>Contoh</th></tr></thead><tbody><tr><td><b>Metric</b></td><td>Menghitung satu nilai dari banyak dokumen</td><td><code>avg</code>, <code>min</code>, <code>max</code>, <code>sum</code>, <code>cardinality</code></td></tr><tr><td><b>Bucket</b></td><td>Memecah dokumen menjadi kelompok lalu mengukurnya</td><td><code>terms</code>, <code>range</code>, <code>date_histogram</code></td></tr></tbody></table><p>Bucket bisa berisi metric, dan bucket bisa bersarang di dalam bucket — inilah yang membuat kamu bisa bertanya &quot;rata-rata harga per kategori per bulan&quot; dalam satu request. Bentuk umumnya selalu sama: beri nama aggregation, tentukan tipenya, lalu field-nya.</p>'
    },
    {
      type: 'example',
      title: 'Aggregation lengkap: terms, avg, range, dan date histogram',
      lang: 'http',
      output: false,
      code: `GET /products/_search
{
  "size": 0,
  "aggs": {
    "by_category": {
      "terms": { "field": "category", "size": 10 }
    },
    "average_price": {
      "avg": { "field": "price" }
    },
    "price_range": {
      "range": {
        "field": "price",
        "ranges": [
          { "to": 1000000 },
          { "from": 1000000, "to": 5000000 },
          { "from": 5000000 }
        ]
      }
    },
    "per_month": {
      "date_histogram": {
        "field": "created",
        "calendar_interval": "month"
      }
    }
  }
}`,
      explain: [
        '<code>size: 0</code> mematikan pengiriman dokumen — response hanya berisi <code>hits.total</code> dan <code>aggregations</code>, jauh lebih ringan bila kamu hanya butuh angka.',
        '<code>terms</code> mengelompokkan per nilai field dan mengurutkan dari bucket terbesar; <code>size: 10</code> membatasi 10 kelompok teratas agar respons tidak meledak.',
        '<code>avg</code> dan <code>range</code> adalah metric — yang pertama menghasilkan satu angka, yang kedua menghasilkan bucket berdasarkan rentang harga (setiap bucket berisi <code>doc_count</code>).',
        '<code>date_histogram</code> dengan <code>calendar_interval: "month"</code> memecah per bulan kalender — pilihan tepat untuk melihat tren penjualan dari waktu ke waktu.'
      ]
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 320" width="760" role="img" aria-label="Alur faceted search Elasticsearch: query pencarian diterapkan lalu aggregation menghasilkan bucket kategori dan brand, filter dikirim bersama query, hasil hits dan highlight dikirim ke frontend untuk ditampilkan dengan pagination">
        <text x="30" y="34" class="u-title" text-anchor="start">Faceted search: satu request, dua hasil</text>
        <rect x="30" y="60" width="200" height="90" rx="10" class="u-hd"/>
        <text x="130" y="90" class="u-lbl" text-anchor="middle">query + filter</text>
        <text x="130" y="118" class="u-lbl" text-anchor="middle">kata kunci, harga, brand</text>
        <line x1="236" y1="105" x2="282" y2="105" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="288" y="46" width="210" height="230" rx="10" class="u-box"/>
        <text x="393" y="74" class="u-title" text-anchor="middle">Elasticsearch</text>
        <rect x="306" y="90" width="174" height="70" rx="6" class="u-hd"/>
        <text x="393" y="118" class="u-lbl" text-anchor="middle">hits + highlight</text>
        <text x="393" y="146" class="u-lbl" text-anchor="middle">dokumen halaman ini</text>
        <rect x="306" y="174" width="174" height="76" rx="6" class="u-box"/>
        <text x="393" y="202" class="u-lbl" text-anchor="middle">aggs: terms kategori</text>
        <text x="393" y="230" class="u-lbl" text-anchor="middle">avg harga, brand</text>
        <line x1="504" y1="125" x2="550" y2="125" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="504" y1="212" x2="550" y2="212" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="556" y="60" width="176" height="90" rx="8" class="u-hd"/>
        <text x="644" y="90" class="u-lbl" text-anchor="middle">daftar hasil</text>
        <text x="644" y="118" class="u-lbl" text-anchor="middle">sort + pagination</text>
        <rect x="556" y="176" width="176" height="90" rx="8" class="u-box"/>
        <text x="644" y="206" class="u-lbl" text-anchor="middle">panel filter</text>
        <text x="644" y="234" class="u-lbl" text-anchor="middle">kategori (12) · brand (5)</text>
        <text x="380" y="306" class="u-lbl" text-anchor="middle">satu request: hits untuk ditampilkan, aggs untuk panel filter</text>
      </svg></div><figcaption>Faceted search mengirim query dan aggregation bersamaan — hits mengisi halaman, bucket mengisi panel filter.</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Faceted search katalog: hits + filter panel dalam satu request',
      lang: 'http',
      output: false,
      code: `GET /products/_search
{
  "query": {
    "bool": {
      "must": [
        { "multi_match": { "query": "gaming", "fields": ["name^3", "description"] } }
      ],
      "filter": [
        { "terms": { "category": ["laptop", "mouse"] } },
        { "range": { "price": { "gte": 500000, "lte": 30000000 } } },
        { "range": { "rating": { "gte": 4 } } }
      ]
    }
  },
  "sort": [
    { "_score": "desc" },
    { "price": "asc" }
  ],
  "from": 0,
  "size": 12,
  "_source": ["name", "brand", "price", "rating"],
  "highlight": { "fields": { "name": {} } },
  "aggs": {
    "kategori": { "terms": { "field": "category" } },
    "brand": { "terms": { "field": "brand", "size": 20 } },
    "rata_harga": { "avg": { "field": "price" } }
  }
}`,
      explain: [
        'Bagian <code>bool</code> menampung pencarian (must) dan filter (filter) — panel kategori, harga, dan rating bekerja sebagai filter yang tidak memengaruhi skor.',
        '<code>sort</code> dengan <code>_score</code> lalu <code>price</code> memberi urutan relevan lebih dulu, dan harga menaik sebagai pengikat saat skor sama — urutan stabil ini penting untuk pagination yang tidak melompat.',
        '<code>size: 12</code> cocok untuk grid 3×4; <code>_source</code> membatasi field yang dikirim agar daftar ringan, sedangkan <code>highlight</code> menandai kata kunci pada nama produk.',
        'Bagian <code>aggs</code> menghasilkan panel filter: berapa produk per kategori, daftar brand beserta jumlahnya, dan rata-rata harga seluruh hasil — semua dari satu request yang sama.'
      ]
    },
    {
      type: 'example',
      title: 'Nested: mempertahankan hubungan pada data bersarang',
      lang: 'http',
      output: false,
      code: `# mapping dengan field nested
PUT /orders
{
  "mappings": {
    "properties": {
      "order_id": { "type": "keyword" },
      "customer": { "type": "text" },
      "items": {
        "type": "nested",
        "properties": {
          "product_id": { "type": "keyword" },
          "name": { "type": "text" },
          "qty": { "type": "long" },
          "price": { "type": "long" }
        }
      }
    }
  }
}

# cari pesanan yang punya item: Laptop qty 1 DAN Mouse qty 2
GET /orders/_search
{
  "query": {
    "nested": {
      "path": "items",
      "query": {
        "bool": {
          "must": [
            { "match": { "items.name": "laptop" } },
            { "range": { "items.qty": { "gte": 2 } } }
          ]
        }
      }
    }
  }
}`,
      explain: [
        'Dengan tipe <code>object</code> biasa, Elasticsearch meratakan array menjadi dua himpunan terpisah — &quot;laptop qty 1&quot; dan &quot;mouse qty 2&quot; bisa tampak cocok walau aslinya berbeda item; <code>nested</code> menyimpan tiap elemen sebagai dokumen terpisah sehingga hubungan tetap utuh.',
        'Query <code>nested</code> menunjuk <code>path</code> (nama field induknya) lalu menjalankan query di dalamnya — semua syarat di dalam satu blok harus cocok pada <b>elemen yang sama</b>.',
        'Nested juga bisa dipakai dalam aggregation (misal menghitung total pendapatan per produk di dalam pesanan) dengan sintaks <code>aggs → nested</code>.',
        'Trade-off: <code>nested</code> membuat dokumen tersimpan lebih besar dan query lebih mahal karena ada dokumen turunan — gunakan hanya bila hubungan per elemen benar-benar berpengaruh pada hasil pencarian.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Object vs nested: kapan harus pakai?</h3><table><thead><tr><th>Skenario</th><th>Tipe</th><th>Alasan</th></tr></thead><tbody><tr><td>Alamat satu orang (kota, jalan)</td><td><code>object</code></td><td>Tidak ada risiko &quot;campur aduk&quot; antar field</td></tr><tr><td>Daftar tag / kategori</td><td><code>keyword</code> array</td><td>Nilai tunggal, aman diratakan</td></tr><tr><td>Item pesanan (nama + qty + harga)</td><td><code>nested</code></td><td>Syarat harus cocok pada item yang sama</td></tr><tr><td>Riwayat alamat untuk dikirim</td><td><code>nested</code></td><td>Setiap entri punya tanggal &amp; status sendiri</td></tr></tbody></table><p>Ada juga alternatif ringan: simpan ringkasan tambahan di field terpisah (misal <code>has_laptop</code> atau daftar <code>product_ids</code>) bila pertanyaannya sederhana. Desain yang baik dimulai dari pertanyaan pencarian yang benar-benar akan ditanyakan pengguna, bukan dari keinginan memodelkan seluruh dunia.</p>'
    },
    {
      type: 'warn',
      title: 'Kesalahan umum pencarian lanjutan',
      text: '<ul><li><b>Lupa <code>size: 0</code></b> saat hanya butuh aggregation — kamu mengunduh belasan dokumen yang tidak dibutuhkan.</li><li><b>Boost terlalu besar tanpa uji</b> — <code>name^10</code> bisa membuat satu kecocokan nama menimpa relevansi keseluruhan; naikkan bertahap dan bandingkan hasilnya.</li><li><b>Fuzzy pada seluruh query</b> — membuat pencarian lambat dan hasilnya terlalu longgar; pakai sebagai pelengkap ketik salah.</li><li><b>Memakai <code>object</code> untuk data yang harus bersarang</b> — hasilnya &quot;match palsu&quot; antar elemen array; pindahkan ke <code>nested</code> beserta reindex-nya.</li><li><b>Mengabaikan <code>size</code> pada <code>terms</code></b> — default membatasi bucket teratas; kategori kecil bisa hilang dari panel filter tanpa kamu sadari.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Rancang dari pertanyaan pengguna, bukan dari field yang tersedia',
      text: '<p>Tulis dulu lima pertanyaan pencarian yang akan ditanyakan pengguna katalogmu — beserta tampilan panel filter yang kamu bayangkan. Baru terjemahkan tiap pertanyaan menjadi query dan tiap panel menjadi aggregation. Dengan urutan ini kamu akan cepat sadar bila ada field yang belum ada (misal rating atau tanggal), dan kamu menambahkannya ke mapping <b>sebelum</b> data produksi masuk, bukan setelah panel filter kosong dan semua orang bertanya-tanya.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['multi_match', 'Query yang mencari satu kata kunci ke beberapa field sekaligus, lengkap dengan boost per field.'],
        ['Boost', 'Pengali relevansi (tanda <code>^</code>) yang menaikkan nilai kecocokan pada field tertentu.'],
        ['match_phrase', 'Pencarian frasa yang menuntut urutan kata berurutan di dalam teks.'],
        ['Fuzzy', 'Pencarian yang mentoleransi jarak edit (salah ketik) berdasar <code>fuzziness</code>.'],
        ['Highlight', 'Penandaan kata kunci pada hasil search agar langsung terlihat pengguna.'],
        ['Aggregation', 'Penghitungan ringkasan atas dokumen hasil query; terbagi metric dan bucket.'],
        ['Bucket aggregation', 'Pengelompokan dokumen menjadi kumpulan (terms, range, date_histogram) lalu diukur.'],
        ['Faceted search', 'Pola menampilkan hasil pencarian bersama panel filter yang diisi aggregation dalam satu request.'],
        ['Nested', 'Tipe field yang mempertahankan hubungan tiap elemen array sebagai dokumen terpisah.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Buat pencarian multi-field dengan boost pada <code>name</code>, lalu bandingkan hasilnya dengan pencarian tanpa boost — perhatikan perubahan urutan dan <code>_score</code>.</li><li>Aktifkan highlight pada pencarian deskripsi, lalu uji fuzzy dengan salah ketik satu huruf pada kata kunci; catat kapan fuzzy membantu dan kapan ia justru menambah noise.</li><li>Bangun satu request faceted search: hits + sort harga + pagination + highlight + aggregation kategori dan brand. Uji dengan mengubah filter dan amati hits serta bucket berubah bersamaan.</li><li>Buat index <code>orders</code> dengan field <code>nested</code>, lalu buktikan bahwa query nested hanya cocok bila seluruh syarat terpenuhi pada <b>item yang sama</b>. <b>Checkpoint:</b> mampu menyusun pencarian multi-dimensi — boost, frasa, fuzzy, highlight, aggregation, dan nested — dalam satu request yang utuh.</li></ol>'
    }
  ],
  recap: [
    '<b>multi_match + boost</b> memecahkan pencarian banyak field dengan bobot; <b>match_phrase</b> menuntut urutan, <b>fuzzy</b> menoleransi salah ketik.',
    '<b>Highlight</b> menandai kata kunci pada hasil sehingga daftar langsung terbaca pengguna.',
    'Aggregation terbagi <b>metric</b> (avg/min/max/sum) dan <b>bucket</b> (terms/range/date_histogram); pakai <code>size: 0</code> bila hanya butuh angka.',
    '<b>Faceted search</b> menggabungkan hits dan panel filter dalam satu request; <b>nested</b> dipakai bila syarat harus cocok pada elemen array yang sama — dengan trade-off performa yang perlu ditimbang.'
  ]
});
