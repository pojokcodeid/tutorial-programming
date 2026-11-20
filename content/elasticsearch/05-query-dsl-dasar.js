/* ============================================================
   Pelajaran Elasticsearch — 05: Query DSL & Search Fundamental
   (Roadmap Level 4 — bab Pencarian)
   ============================================================ */
'use strict';

window.ELASTICSEARCH_LESSONS = window.ELASTICSEARCH_LESSONS || [];

window.ELASTICSEARCH_LESSONS.push({
  id: 'query-dsl-dasar',
  title: 'Query DSL & Search Fundamental',
  chapter: 'Pencarian',
  duration: '16 menit',
  intro: [
    'Bayangkan kamu berdiri di depan perpustakaan raksasa berisi jutaan buku, lalu bertanya kepada petugas: &quot;Cari semua buku tentang laptop gaming, yang harganya di bawah 30 juta, tapi bukan yang sudah dicabut dari katalog.&quot; Petugas itu tidak membaca satu per satu buku di rak — dia menerjemahkan pertanyaanmu menjadi langkah-langkah pencarian yang jelas. <b>Elasticsearch menawarkan bahasa yang sama: Query DSL</b>, yaitu JSON yang kamu susun agar mesin paham persis apa yang kamu cari.',
    'Di pelajaran ini kamu membuka endpoint <code>/_search</code> dan menguasai keluarga query dasar: <code>match_all</code>, <code>match</code>, <code>term</code>, <code>terms</code>, <code>range</code>, <code>exists</code>, <code>prefix</code>, <code>wildcard</code>, dan <code>ids</code>. Setelah itu kamu merangkainya dengan <code>bool</code> (<code>must</code>, <code>should</code>, <code>filter</code>, <code>must_not</code>) untuk membuat pencarian produk yang lengkap seperti di e-commerce sungguhan.',
    'Kamu juga akan membedakan <b>query context</b> (ikut dihitung skornya) dengan <b>filter context</b> (hanya lolos/tidak, bisa di-cache), lalu menutup pelajaran dengan sorting, pagination <code>from/size</code>, pemilihan field via <code>_source</code>, dan Explain API yang membuka rahasia angka <code>_score</code>. Semua lab memakai <code>http://localhost:9200</code> dengan tag gambar <code>8.17.0</code> dan security nonaktif — itu pengaturan lab, bukan untuk produksi.'
  ],
  objectives: [
    'Menjalankan Search API dan membaca struktur response <code>hits</code>, <code>total</code>, dan <code>_score</code>',
    'Menulis sembilan query dasar (match_all, match, term, terms, range, exists, prefix, wildcard, ids) dan memilih yang tepat untuk tiap kasus',
    'Merangkai <code>bool</code> lengkap dengan <code>must</code>, <code>should</code>, <code>filter</code>, dan <code>must_not</code> untuk pencarian produk multi-kriteria',
    'Menerapkan sorting, pagination, <code>_source</code> filtering, serta Explain API sambil menjelaskan perbedaan query context dan filter context'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Anatomi satu request pencarian</h3><p>Setiap pencarian di Elasticsearch adalah HTTP request ke <code>/&lt;index&gt;/_search</code> dengan body JSON. Body itu punya potongan-potongan yang selalu berulang, jadi biasakan membacanya seperti membaca kalimat: <b>apa yang dicari</b> (<code>query</code>), <b>bagaimana diurutkan</b> (<code>sort</code>), <b>berapa yang ditampilkan</b> (<code>from</code> dan <code>size</code>), serta <b>field mana yang dikirim balik</b> (<code>_source</code>).</p><table><thead><tr><th>Bagian</th><th>Fungsi</th><th>Default</th></tr></thead><tbody><tr><td><code>query</code></td><td>Definisi dokumen mana yang cocok</td><td><code>match_all</code> bila tidak ditulis</td></tr><tr><td><code>sort</code></td><td>Urutan hasil, bisa beberapa field</td><td>skor <code>_score</code> menurun</td></tr><tr><td><code>from</code> + <code>size</code></td><td>Halaman berapa dan berapa dokumen</td><td><code>0</code> dan <code>10</code></td></tr><tr><td><code>_source</code></td><td>Field asli yang ikut dikirim</td><td>seluruh dokumen</td></tr><tr><td><code>track_total_hits</code></td><td>Akurasi hitungan total</td><td dibatasi 10.000</td></tr></tbody></table><p>Kelima potongan itu boleh dipakai bersamaan. Satu request bisa sekaligus mencari, menyaring, mengurutkan, membatasi halaman, dan memilih field — inilah alasan satu endpoint cukup untuk hampir semua kebutuhan search aplikasimu.</p>'
    },
    {
      type: 'example',
      title: 'Buka Search API dan jalankan match_all pertama',
      lang: 'bash',
      output: false,
      code: `# pastikan endpoint hidup (tag lab 8.17.0, security nonaktif)
curl http://localhost:9200

# ambil 10 dokumen pertama beserta skornya
curl -s -H "Content-Type: application/json" \\
  http://localhost:9200/products/_search \\
  -d '{
    "query": { "match_all": {} },
    "size": 5
  }' | head -40`,
      explain: [
        '<code>http://localhost:9200</code> adalah endpoint lab; respons pertama memuat <code>cluster_name</code> dan <code>tagline</code>, bukti server menjawab sebelum kamu mengirim query apa pun.',
        '<code>/products/_search</code> berarti &quot;cari di index <code>products</code>&quot; — kamu bisa juga menulis <code>/_search</code> untuk mencari di seluruh index yang boleh diakses.',
        '<code>match_all: {}</code> adalah query paling sederhana: cocokkan semua dokumen; kurung kurawal kosong tetap wajib ditulis karena semua query punya parameter sendiri.',
        '<code>size: 5</code> membatasi 5 dokumen pertama; tanpa itu Elasticsearch mengirim 10 dokumen default — perhatikan selalu <code>hits.hits</code> sebagai daftar hasil dan <code>hits.total.value</code> sebagai jumlah yang cocok.'
      ]
    },
    {
      type: 'example',
      title: 'Tiga query inti: match, term, dan terms',
      lang: 'http',
      output: false,
      code: `GET /products/_search
{
  "query": {
    "match": {
      "name": "gaming laptop"
    }
  }
}

GET /products/_search
{
  "query": {
    "term": {
      "category": "laptop"
    }
  }
}

GET /products/_search
{
  "query": {
    "terms": {
      "brand": ["Logitech", "Keychron", "Asus"]
    }
  }
}`,
      explain: [
        '<code>match</code> bekerja pada field teks: teks &quot;gaming laptop&quot; dipecah oleh analyzer menjadi dua term, lalu dokumen yang memuat salah satu atau keduanya ikut cocok dan diurutkan menurut relevansinya.',
        '<code>term</code> membandingkan satu nilai persis terhadap satu field — tepat untuk field <code>keyword</code> seperti <code>category</code>, dan salah kaprah paling umum di bab ini adalah memakainya pada field <code>text</code> beranalyzer.',
        '<code>terms</code> adalah versi <code>term</code> untuk banyak nilai sekaligus (operator OR pada daftar); kunci query-nya tetap nama field, sedangkan nilai diberikan sebagai array.',
        'Perhatikan bentuk yang sama di ketiganya: <code>"nama_field": nilai</code> — begitu kamu hafal pola ini, keluarga query lain terasa seperti kosakata baru, bukan sintaks baru.'
      ]
    },
    {
      type: 'example',
      title: 'Query kondisi: range, exists, prefix, wildcard, dan ids',
      lang: 'http',
      output: false,
      code: `GET /products/_search
{
  "query": {
    "range": {
      "price": { "gte": 1000000, "lte": 30000000 }
    }
  }
}

GET /products/_search
{
  "query": { "exists": { "field": "discount" } }
}

GET /products/_search
{
  "query": { "prefix": { "category": "key" } }
}

GET /products/_search
{
  "query": { "wildcard": { "name": "*gaming*" } }
}

GET /products/_search
{
  "query": { "ids": { "values": ["p-001", "p-002", "p-009"] } }
}`,
      explain: [
        '<code>range</code> memakai operator <code>gte</code>, <code>gt</code>, <code>lte</code>, dan <code>lt</code>; pada field <code>price</code> bertipe numerik rentangnya dibandingkan secara numerik, bukan teks.',
        '<code>exists</code> mencari dokumen yang <b>memiliki</b> field itu (bukan berisi teks tertentu) — berguna menemukan produk yang belum pernah diberi diskon atau field yang belum terisi.',
        '<code>prefix</code> dan <code>wildcard</code> cocok untuk pencarian pola: <code>*</code> mewakili banyak karakter dan <code>?</code> satu karakter; keduanya lebih mahal daripada <code>term</code> karena memindai term, jadi hindari pola yang dimulai <code>*</code> pada data besar.',
        '<code>ids</code> mengambil dokumen berdasarkan <code>_id</code> persis — ini jalan pintas saat backend sudah tahu id dokumen, tanpa harus menulis query <code>term</code> ke field <code>_id</code>.'
      ]
    },
    {
      type: 'text',
      html: '<h3>bool: merangkai banyak syarat jadi satu keputusan</h3><p>Kebutuhan nyata selalu kombinasi: &quot;laptop <i>dan</i> kategori laptop, harganya di bawah 30 juta, boleh merek apa saja asal bukan produk dicabut.&quot; Di sinilah <code>bool</code> bekerja dengan empat kunci yang punya peran berbeda:</p><table><thead><tr><th>Kunci</th><th>Makna</th><th>Mempengaruhi skor?</th></tr></thead><tbody><tr><td><code>must</code></td><td>Wajib cocok (AND)</td><td>Ya — ikut menghitung <code>_score</code></td></tr><tr><td><code>should</code></td><td>Boleh cocok (OR); jadi wajib bila tidak ada <code>must</code>/<code>filter</code></td><td>Ya — kecocokan tambahan menaikkan skor</td></tr><tr><td><code>filter</code></td><td>Wajib lolos, tapi tidak menilai</td><td>Tidak — hasil bernilai skor konstan</td></tr><tr><td><code>must_not</code></td><td>Wajib tidak cocok (NOT)</td><td>Tidak — hanya mengecualikan</td></tr></tbody></table><h3>Query context vs filter context</h3><p>Perbedaan ini bukan sekadar kosakata: ia menentukan apakah Elasticsearch repot menghitung relevansi dan apakah hasilnya bisa di-cache. Query context dipakai ketika <b>urutan relevansi penting</b>; filter context dipakai ketika kamu hanya ingin <b>lolos atau tidak</b>, seperti checkbox kategori pada halaman katalog.</p><table><thead><tr><th>Aspek</th><th>Query context</th><th>Filter context</th></tr></thead><tbody><tr><td>Pertanyaan</td><td>Seberapa cocok dokumen ini?</td><td>Dokumen ini lolos syarat tidak?</td></tr><tr><td>Skor</td><td>Dihitung per dokumen</td><td>Selalu 0 (kondusif untuk cache)</td></tr><tr><td>Contoh</td><td><code>match</code>, <code>match_phrase</code>, <code>multi_match</code></td><td><code>term</code>, <code>terms</code>, <code>range</code>, <code>exists</code> di dalam <code>filter</code></td></tr><tr><td>Tujuan</td><td>Relevansi &amp; ranking</td><td>Seleksi cepat &amp; hemat CPU</td></tr></tbody></table>'
    },
    {
      type: 'example',
      title: 'Bool query produk lengkap (must + filter + must_not + should)',
      lang: 'http',
      output: false,
      code: `GET /products/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "name": "laptop" } }
      ],
      "filter": [
        { "term": { "category": "laptop" } },
        { "range": { "price": { "lte": 30000000 } } }
      ],
      "must_not": [
        { "term": { "status": "discontinued" } }
      ],
      "should": [
        { "term": { "tags": "best-seller" } },
        { "range": { "rating": { "gte": 4.5 } } }
      ],
      "minimum_should_match": 1
    }
  }
}`,
      explain: [
        '<code>must</code> berisi <code>match</code> pada field teks <code>name</code> — inilah satu-satunya bagian yang menyumbang skor, jadi dokumen dengan kecocokan nama terbaik naik ke atas.',
        '<code>filter</code> memakai <code>term</code> dan <code>range</code> yang tidak dihitung skornya; syarat tetap wajib terpenuhi, tapi karena tidak menilai, hasilnya kandidat kuat untuk cache filter.',
        '<code>must_not</code> mengecualikan dokumen berstatus <code>discontinued</code> tanpa menambah skor — produk dicabut hilang dari hasil, bukan didorong ke bawah.',
        '<code>should</code> bersama <code>minimum_should_match: 1</code> mengubah &quot;boleh&quot; menjadi &quot;setidaknya salah satu&quot;: produk best-seller atau rating 4 ke atas diprioritaskan sekaligus jadi syarat penyaring.',
        'Tanpa <code>must</code> maupun <code>filter</code>, <code>should</code> sendiri otomatis berperan sebagai syarat wajib — pahami perilaku ini sebab sering jadi penyebab &quot;kenapa hasilku tidak muncul&quot;.'
      ]
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 320" width="760" role="img" aria-label="Alur request pencarian Elasticsearch: request _search masuk lalu terbelah menjadi query context yang menghitung skor dan filter context yang menyeleksi tanpa skor, hasilnya diurutkan dan dipaginasikan menjadi hits">
        <text x="30" y="34" class="u-title" text-anchor="start">Alur satu request _search</text>
        <rect x="30" y="70" width="170" height="70" rx="8" class="u-hd"/>
        <text x="115" y="98" class="u-lbl" text-anchor="middle">GET /products/_search</text>
        <text x="115" y="122" class="u-lbl" text-anchor="middle">query + sort + from/size</text>
        <line x1="206" y1="105" x2="252" y2="105" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="258" y="56" width="240" height="228" rx="10" class="u-box"/>
        <text x="378" y="82" class="u-title" text-anchor="middle">Bool &amp; Query DSL</text>
        <rect x="274" y="98" width="208" height="76" rx="6" class="u-hd"/>
        <text x="378" y="124" class="u-lbl" text-anchor="middle">query context</text>
        <text x="378" y="152" class="u-lbl" text-anchor="middle">match / match_phrase → _score</text>
        <rect x="274" y="186" width="208" height="76" rx="6" class="u-box"/>
        <text x="378" y="212" class="u-lbl" text-anchor="middle">filter context</text>
        <text x="378" y="240" class="u-lbl" text-anchor="middle">term / range / exists → cache</text>
        <line x1="504" y1="112" x2="550" y2="112" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="504" y1="224" x2="550" y2="224" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="556" y="72" width="176" height="80" rx="8" class="u-hd"/>
        <text x="644" y="102" class="u-lbl" text-anchor="middle">sort + from/size</text>
        <text x="644" y="130" class="u-lbl" text-anchor="middle">urut &amp; ambil halaman</text>
        <rect x="556" y="176" width="176" height="80" rx="8" class="u-box"/>
        <text x="644" y="206" class="u-lbl" text-anchor="middle">hits.hits</text>
        <text x="644" y="234" class="u-lbl" text-anchor="middle">dokumen + _score</text>
        <text x="380" y="306" class="u-lbl" text-anchor="middle">hanya query context yang menaikkan skor; filter menyeleksi tanpa menilai</text>
      </svg></div><figcaption>Query context menghitung relevansi, filter context menyeleksi dan meng-cache; keduanya baru berpadu di tahap sort dan pagination.</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Sorting, pagination, dan pemilihan field lewat _source',
      lang: 'http',
      output: false,
      code: `GET /products/_search
{
  "query": { "match_all": {} },
  "sort": [
    { "price": "asc" },
    { "created": "desc" }
  ],
  "from": 10,
  "size": 10,
  "_source": ["name", "brand", "price"],
  "track_total_hits": true
}`,
      explain: [
        '<code>sort</code> menerima array, jadi urutan dibaca dari kiri ke kanan: harga menaik dulu, lalu tanggal terbaru sebagai penentu saat harga sama — tanpa field penentu, pagination bisa mengulang dokumen yang sama antarhalaman.',
        '<code>from: 10</code> bersama <code>size: 10</code> mengambil halaman kedua; semakin besar <code>from</code>, semakin berat biayanya, karena Elasticsearch tetap harus menelusuri dan membuang dokumen sebelumnya.',
        '<code>_source</code> membatasi field yang dikirim balik ke aplikasi — menghemat bandwidth dan waktu serialisasi, terutama bila ada field deskripsi panjang yang tidak dibutuhkan di daftar hasil.',
        '<code>track_total_hits: true</code> memaksa hitungan total akurat; default membatasi penghitungan di angka 10.000, sehingga tampilan &quot;10.000+&quot; pada katalog justru perilaku bawaan yang perlu kamu sadari.'
      ]
    },
    {
      type: 'example',
      title: 'Membuka Explain API: dari mana angka _score berasal',
      lang: 'http',
      output: false,
      code: `GET /products/_explain/p-001?pretty
{
  "query": {
    "match": { "name": "gaming laptop" }
  }
}

# cara lain: minta penjelasan langsung di response search
GET /products/_search
{
  "query": { "match": { "name": "gaming laptop" } },
  "explain": true,
  "size": 1
}`,
      explain: [
        '<code>/products/_explain/&lt;id&gt;</code> menjawab &quot;apakah dokumen ini cocok, dan mengapa?&quot; — field <code>matched</code> menunjukkan kecocokan, sedangkan rincian <code>description</code> memecah kontribusi tiap term seperti <code>gaming</code> dan <code>laptop</code>.',
        'Param <code>?pretty</code> hanya mempercantik JSON agar mudah dibaca; isi responsnya identik dengan tanpa parameter itu.',
        'Field <code>explain: true</code> pada request search membuat tiap hit ikut menyertakan uraian skor — berguna untuk satu atau dua dokumen pemeriksaan, bukan untuk seluruh hasil karena responsnya membengkak.',
        'Gunakan Explain API saat kamu bertanya &quot;kenapa produk ini di atas?&quot; — alih-alih menebak, kamu melihat sumbangsih tiap field dan term secara hitungan.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan umum pemula di Query DSL',
      text: '<ul><li><b>Memakai <code>term</code> pada field teks</b> — field <code>name</code> bertipe <code>text</code> sudah dianalyzer (huruf kecil, dipecah), sehingga <code>term: { "name": "Laptop Gaming" }</code> hampir pasti nihil. Pakai <code>match</code>, atau sasarkan ke <code>name.keyword</code>.</li><li><b>Menaruh filter di <code>must</code> tanpa sadar</b> — syarat kategori atau harga di <code>must</code> tetap dihitung skornya dan membuang cache; pindahkan ke <code>filter</code> agar cepat.</li><li><b>Lupa <code>minimum_should_match</code></b> saat <code>bool</code> sudah punya <code>must</code> — semua <code>should</code> jadi opsional dan tidak berpengaruh pada hasil.</li><li><b>Memakai wildcard berawalan <code>*</code></b> pada data besar — query ini memindai banyak term; batasi pola di awal kata atau gunakan fitur autocomplete di pelajaran berikutnya.</li><li><b>Mengandalkan <code>from/size</code> jauh ke dalam</b> — halaman ratusan ke atas mendekati batas <code>max_result_window</code> 10.000; pelajaran pagination skalabel akan menggantinya dengan <code>search_after</code>.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Belajar Query DSL dengan satu dataset dan banyak pertanyaan',
      text: '<p>Pilih satu index lab (misalnya <code>products</code> yang sudah berisi beberapa dokumen) dan perlakukan seperti teka-teki: tulis satu pertanyaan manusia, lalu terjemahkan ke JSON, jalankan, dan bandingkan <code>hits.total.value</code> dengan dugaanmu. Ubah <b>satu variabel saja</b> tiap percobaan — misalnya pindahkan <code>range</code> dari <code>must</code> ke <code>filter</code> — lalu amati apakah skor berubah. Kebiasaan menguji satu hal pada satu waktu membuat kamu cepat membaca bahasa ini tanpa menghafal 40 jenis query.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Query DSL', 'Bahasa JSON untuk mendeskripsikan pencarian pada endpoint <code>_search</code>; terdiri dari query, sort, pagination, dan pemilihan field.'],
        ['match', 'Query full-text yang menganalisis teks input lalu mencocokkan termnya pada field <code>text</code>, lengkap dengan skor relevansi.'],
        ['term / terms', 'Pencocokan nilai persis pada field <code>keyword</code> atau numerik; <code>terms</code> untuk daftar banyak nilai sekaligus.'],
        ['bool', 'Query penggabung dengan empat kunci <code>must</code>, <code>should</code>, <code>filter</code>, dan <code>must_not</code>.'],
        ['Query context', 'Konteks yang menghitung <code>_score</code> sehingga hasil bisa diurutkan menurut relevansi.'],
        ['Filter context', 'Konteks seleksi lolos/tidak tanpa skor; hasilnya kandidat kuat untuk disimpan di cache.'],
        ['Relevansi (_score)', 'Angka yang menunjukkan seberapa cocok dokumen terhadap query, dihasilkan dari formula BM25 dan boost.'],
        ['Explain API', 'Endpoint <code>_explain</code> yang membedah mengapa satu dokumen cocok atau tidak beserta rincian skornya.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Tulis lima query terpisah pada index <code>products</code>: satu <code>match</code> nama, satu <code>term</code> kategori, satu <code>range</code> harga, satu <code>exists</code> field diskon, dan satu <code>ids</code> — catat <code>hits.total.value</code> tiap hasil.</li><li>Bangun bool query kombinasi: <code>must</code> match nama, <code>filter</code> kategori + rentang harga, <code>must_not</code> status dicabut, lalu ubah <code>should</code> jadi relevan dengan menambah <code>minimum_should_match: 1</code>.</li><li>Uji perbedaan skor: jalankan query yang sama dengan <code>range</code> di <code>must</code> lalu di <code>filter</code>, dan bandingkan nilai <code>_score</code> pada kedua respons.</li><li><b>Checkpoint:</b> mampu membangun Query DSL dari nol — memilih <code>match</code> atau <code>term</code> dengan tepat, memisahkan query context dari filter context, serta membaca hasil Explain API untuk menjelaskan skor.</li></ol>'
    }
  ],
  recap: [
    'Satu request <code>_search</code> punya potongan tetap: <b>query, sort, from/size, dan _source</b> — semuanya boleh dipakai bersamaan dalam satu body.',
    'Sembilan query dasar mencakup kebutuhan harian: <b>match</b> untuk teks, <b>term/terms</b> untuk nilai persis, <b>range/exists</b> untuk kondisi, <b>prefix/wildcard/ids</b> untuk pola dan id.',
    '<b>bool</b> menggabungkan <code>must</code> (wajib &amp; bernilai), <code>should</code> (opsional/bonus), <code>filter</code> (wajib tanpa skor), dan <code>must_not</code> (pengecualian) — inilah inti pencarian multi-kriteria.',
    'Beda mendasar: <b>query context menghitung skor</b>, <b>filter context hanya lolos/tidak dan bisa di-cache</b>; Explain API membuktikannya dengan membedah angka <code>_score</code>.'
  ]
});
