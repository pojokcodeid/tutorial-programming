/* ============================================================
   Pelajaran Elasticsearch — 07: Analyzer & Text Processing
   (Roadmap Level 6 — bab Pencarian)
   ============================================================ */
'use strict';

window.ELASTICSEARCH_LESSONS = window.ELASTICSEARCH_LESSONS || [];

window.ELASTICSEARCH_LESSONS.push({
  id: 'analyzer-text-processing',
  title: 'Analyzer & Text Processing',
  chapter: 'Pencarian',
  duration: '15 menit',
  intro: [
    'Ketika kamu mengetik &quot;Laptop&quot; di kolom pencarian, Elasticsearch tidak membandingkan huruf demi huruf dengan data di disk. Ia <b>mengubah keduanya menjadi bentuk yang sama dulu</b> — memecah, menyeragamkan, mungkin membuang kata henti — baru membandingkan. Proses itulah analyzer, dan ia adalah alasan kenapa pencarian bisa menemukan &quot;laptop&quot; dari &quot;Laptop&quot;, &quot;LAPTOP&quot;, bahkan &quot;laptops&quot;.',
    'Di pelajaran ini kamu membongkar tiga lapisan analyzer: <b>character filter</b> (memperbaiki teks mentah), <b>tokenizer</b> (memecah menjadi token), dan <b>token filter</b> (memodifikasi token: huruf kecil, buang kata henti, stemming, sinonim). Kamu akan membandingkan analyzer bawaan lewat endpoint <code>_analyze</code>, lalu menyusun custom analyzer milik sendiri.',
    'Bagian khusus membahas teks <b>Bahasa Indonesia</b> — imbuhan, kata henti, dan sinonim lokal — beserta catatan jujur: analyzer bawaan tidak pernah otomatis tepat untuk semua kebutuhan. Yang menentukan kualitas adalah <b>pengujian dengan contoh query dan dokumen nyata</b>, bukan anggapan bahwa analyzer bahasa pasti sudah benar.'
  ],
  objectives: [
    'Menjelaskan alur character filter → tokenizer → token filter beserta fungsinya',
    'Membandingkan perilaku analyzer bawaan (standard, simple, whitespace, keyword) lewat <code>_analyze</code>',
    'Menulis custom analyzer pada settings index dan memakainya di mapping',
    'Menguji teks Bahasa Indonesia serta mengevaluasi hasil tokenization sebelum dipakai produksi'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Mengapa teks harus dipecah dulu?</h3><p>Bayangkan mencari kata &quot;gaming&quot; dengan memindai seluruh isi setiap dokumen satu per satu — lambat dan boros. Elasticsearch memilih jalan lain: <b>saat indexing, teks dipecah menjadi daftar token, lalu disimpan terbalik</b> (inverted index) sehingga pencarian tinggal melihat daftar. Untuk memastikan &quot;Gaming&quot;, &quot;gaming&quot;, dan &quot;GAMING&quot; menghasilkan token yang sama, teks harus melewati tahap yang sama di sisi indexing dan di sisi pencarian.</p><p>Di sinilah analyzer bekerja, dengan tiga tahap berurutan:</p><table><thead><tr><th>Tahap</th><th>Tugas</th><th>Contoh</th></tr></thead><tbody><tr><td>1. Character filter</td><td>Memperbaiki teks mentah sebelum dipecah</td><td>HTML entity dibersihkan, <code>&amp;</code> jadi spasi</td></tr><tr><td>2. Tokenizer</td><td>Memecah teks menjadi token</td><td>&quot;gaming laptop&quot; → <code>gaming</code>, <code>laptop</code></td></tr><tr><td>3. Token filter</td><td>Memodifikasi tiap token</td><td>lowercase, buang kata henti, stemming, sinonim</td></tr></tbody></table><p>Aturan emasnya: <b>analyzer yang dipakai saat indexing harus sama dengan saat query</b>. Kalau tidak, kamu membandingkan bentuk yang berbeda dan hasilnya nihil tanpa pesan error apa pun — inilah penyebab paling umum &quot;query-nya benar tapi hasilnya kosong&quot;.</p>'
    },
    {
      type: 'example',
      title: 'Endpoint _analyze: melihat mata mesin bekerja',
      lang: 'http',
      output: false,
      code: `POST /_analyze
{
  "analyzer": "standard",
  "text": "Elasticsearch is a powerful Search Engine"
}

POST /_analyze
{
  "analyzer": "whitespace",
  "text": "Elasticsearch is a powerful Search Engine"
}

POST /_analyze
{
  "analyzer": "keyword",
  "text": "Elasticsearch is a powerful Search Engine"
}

# lihat token yang tersimpan untuk dokumen tertentu
POST /_analyze
{
  "field": "name",
  "text": "Gaming Laptop Pro",
  "index": "products"
}`,
      explain: [
        'Standard analyzer menyeragamkan huruf dan membuang tanda baca: kamu melihat token <code>elasticsearch</code>, <code>powerful</code>, <code>search</code>, <code>engine</code> — kata <code>is</code> dan <code>a</code> ikut terbuang sebagai stop words bawaannya.',
        'Whitespace analyzer hanya memecah di spasi: huruf besar tetap besar dan kata henti tetap ada — perbandingan langsung menunjukkan betapa keputusan kecil mengubah hasil.',
        'Keyword analyzer menghasilkan <b>satu token utuh</b> untuk seluruh teks — inilah perlakuan field <code>keyword</code>, dan alasan ia tidak cocok untuk pencarian penuh.',
        'Varian terakhir memakai <code>field</code> dan <code>index</code> — Elasticsearch mengambil analyzer yang benar-benar dipakai index itu untuk field tersebut; cara terbaik memeriksa &quot;bagaimana data saya diperlakukan&quot;.'
      ]
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Alur analyzer Elasticsearch tiga tahap: teks mentah melewati character filter lalu tokenizer menjadi token lalu token filter menghasilkan term yang disimpan ke inverted index, tahap yang sama juga dijalankan pada teks query">
        <text x="30" y="34" class="u-title" text-anchor="start">Tiga tahap analyzer</text>
        <rect x="30" y="66" width="150" height="64" rx="8" class="u-hd"/>
        <text x="105" y="94" class="u-lbl" text-anchor="middle">teks mentah</text>
        <text x="105" y="118" class="u-lbl" text-anchor="middle">&quot;Laptop &amp; Gaming!&quot;</text>
        <line x1="186" y1="98" x2="228" y2="98" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="234" y="66" width="150" height="64" rx="8" class="u-box"/>
        <text x="309" y="94" class="u-lbl" text-anchor="middle">character filter</text>
        <text x="309" y="118" class="u-lbl" text-anchor="middle">bersihkan &amp; tanda</text>
        <line x1="390" y1="98" x2="432" y2="98" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="438" y="66" width="150" height="64" rx="8" class="u-box"/>
        <text x="513" y="94" class="u-lbl" text-anchor="middle">tokenizer</text>
        <text x="513" y="118" class="u-lbl" text-anchor="middle">pecah per kata</text>
        <line x1="594" y1="98" x2="636" y2="98" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="642" y="66" width="90" height="64" rx="8" class="u-hd"/>
        <text x="687" y="94" class="u-lbl" text-anchor="middle">token</text>
        <text x="687" y="118" class="u-lbl" text-anchor="middle">filter</text>
        <line x1="687" y1="134" x2="687" y2="176" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="470" y="182" width="262" height="72" rx="10" class="u-hd"/>
        <text x="601" y="210" class="u-lbl" text-anchor="middle">lowercase · stop words</text>
        <text x="601" y="238" class="u-lbl" text-anchor="middle">stemming · synonym</text>
        <line x1="470" y1="218" x2="426" y2="218" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="200" y="182" width="220" height="72" rx="10" class="u-box"/>
        <text x="310" y="210" class="u-lbl" text-anchor="middle">term disimpan</text>
        <text x="310" y="238" class="u-lbl" text-anchor="middle">ke inverted index</text>
        <text x="380" y="286" class="u-lbl" text-anchor="middle">query dijalankan lewat analyzer yang sama → hasil selaras</text>
      </svg></div><figcaption>Teks melewati tiga tahap saat indexing; query yang sama melewati jalur identik sehingga bentuk token selalu cocok.</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Membangun custom analyzer pada settings index',
      lang: 'http',
      output: false,
      code: `PUT /articles
{
  "settings": {
    "analysis": {
      "analyzer": {
        "custom_text_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "stop"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "title": { "type": "text", "analyzer": "custom_text_analyzer" }
    }
  }
}

# uji sebelum dipakai
POST /articles/_analyze
{
  "analyzer": "custom_text_analyzer",
  "text": "Belajar Elasticsearch dari nol"
}`,
      explain: [
        'Blok <code>settings.analysis.analyzer</code> mendefinisikan analyzer bertipe <code>custom</code>: kamu menyusun sendiri tokenizer dan daftar filter urutannya.',
        'Filter dijalankan berurutan dari atas ke bawah — <code>lowercase</code> dulu menyeragamkan huruf, baru <code>stop</code> membuang kata henti; urutan ini penting agar stop words dikenali dalam bentuk kecil.',
        'Mapping menunjuk analyzer itu pada field <code>title</code> — tanpa penunjukan ini, field tetap memakai standard analyzer bawaan dan definisi settings jadi percuma.',
        'Langkah <code>_analyze</code> sebelum indexing adalah kebiasaan terbaik: kamu melihat token persis yang akan disimpan, sehingga kejutan &quot;kenapa hasil kosong&quot; bisa dicegah di muka.'
      ]
    },
    {
      type: 'example',
      title: 'Stop words, stemming, dan sinonim dalam satu definisi',
      lang: 'http',
      output: false,
      code: `PUT /synonym-lab
{
  "settings": {
    "analysis": {
      "filter": {
        "custom_synonym": {
          "type": "synonym",
          "synonyms": [
            "laptop, notebook",
            "mouse, tetikus"
          ]
        }
      },
      "analyzer": {
        "synonym_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "custom_synonym"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "name": { "type": "text", "analyzer": "synonym_analyzer" }
    }
  }
}

POST /synonym-lab/_analyze
{
  "analyzer": "synonym_analyzer",
  "text": "Laptop Ringan"
}`,
      explain: [
        'Filter <code>synonym</code> didefinisikan di <code>settings.analysis.filter</code> lalu dipakai oleh analyzer — sinonim diterapkan saat indexing, sehingga &quot;notebook&quot; pada dokumen menyimpan token &quot;laptop&quot; juga.',
        'Daftar sinonim memakai format satu baris per kelompok, dipisah koma; perubahan sinonim pada index yang sudah berisi data butuh reindex agar seluruh dokumen dianalisis ulang.',
        'Stemming (misal filter <code>stemmer</code>) memotong imbuhan agar &quot;running&quot; dan &quot;run&quot; menyatu; untuk Bahasa Indonesia, ketersediaan stemmer terbatas dan hasilnya perlu kamu evaluasi sendiri.',
        'Jangan menumpuk filter tanpa menguji: setiap lapis menambah kejutan. Uji satu per satu lewat <code>_analyze</code> dan amati token berubah bagaimana.'
      ]
    },
    {
      type: 'example',
      title: 'Menguji teks Bahasa Indonesia dan normalizer pada keyword',
      lang: 'http',
      output: false,
      code: `# uji teks Indonesia dengan analyzer bawaan
POST /_analyze
{
  "analyzer": "standard",
  "text": "Menjalankan aplikasi dengan lebih cepat dan tepat"
}

# bandingkan: bagaimana token terpecah?
POST /_analyze
{
  "analyzer": "standard",
  "text": "pembelajaran, pengembangan, terpercaya"
}

# normalizer: perlakuan keyword huruf kecil saat indexing
PUT /products-normalized
{
  "settings": {
    "analysis": {
      "normalizer": {
        "lowercase_normalizer": {
          "type": "custom",
          "filter": ["lowercase"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "brand": { "type": "keyword", "normalizer": "lowercase_normalizer" }
    }
  }
}`,
      explain: [
        'Teks Indonesia dianalyzer standard tanpa stemmer khusus: token seperti <code>menjalankan</code> dan <code>pembelajaran</code> tetap utuh sebagai token terpisah — artinya &quot;belajar&quot; tidak otomatis menemukan &quot;pembelajaran&quot;.',
        'Uji kedua memperlihatkan imbuhan yang tetap menempel; inilah bukti bahwa kualitas pencarian Indonesia bergantung pada keputusanmu sendiri (synonym, stemmer, atau kumpulan query), bukan pada bawaan mesin.',
        '<code>normalizer</code> bekerja khusus pada field <code>keyword</code>: ia menyeragamkan huruf saat indexing tanpa memecah kata, sehingga &quot;Logitech&quot; dan &quot;logitech&quot; cocok untuk filter persis.',
        'Perbedaan penting: <code>analyzer</code> untuk field teks (memecah), <code>normalizer</code> untuk field keyword (menyeragamkan tanpa memecah) — keduanya menyelesaikan masalah huruf besar-kecil dengan cara berbeda.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan umum pemrosesan teks',
      text: '<ul><li><b>Analyzer indexing ≠ analyzer query</b> — field memakai custom analyzer sementara query memakai bawaan; hasilnya kosong tanpa error. Selalu uji dengan <code>_analyze</code>.</li><li><b>Menganggap stemming Indonesia sudah benar</b> — stemmer bawaan sering salah pada imbuhan lokal; evaluasi dengan daftar kata nyata sebelum mempercayainya.</li><li><b>Menambahkan sinonim lalu lupa reindex</b> — sinonim hanya diterapkan saat dokumen dianalisis; data lama tetap memakai bentuk lama.</li><li><b>Memakai analyzer bahasa pada field keyword</b> — analisis membuat nilai tidak persis; filter, sort, dan aggregasi jadi rusak.</li><li><b>Tidak membuang stop words pada teks panjang</b> — token sampah membesarkan indeks tanpa menambah kegunaan pencarian.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Buat daftar uji pencarian sejak hari pertama',
      text: '<p>Simpan sepuluh pasang &quot;query manusia → dokumen yang seharusnya muncul&quot; pada file catatanmu. Setiap kali mengubah analyzer, jalankan seluruh daftar itu dan pastikan tidak ada yang putus. Daftar kecil ini — bukan benchmark raksasa — yang akan menangkap regresi paling cepat, dan ia juga menjadi bukti bahwa perubahan analyzer kamu membantu, bukan merusak.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Analyzer', 'Rantai proses yang mengubah teks menjadi token saat indexing dan query; terdiri dari tiga tahap.'],
        ['Character filter', 'Tahap awal yang memperbaiki teks mentah (membersihkan HTML, mengganti karakter) sebelum dipecah.'],
        ['Tokenizer', 'Tahap pemecah teks menjadi token, misal per spasi atau per kata.'],
        ['Token filter', 'Tahap pengubah token: lowercase, stop words, stemming, sinonim.'],
        ['Stop words', 'Kata umum tanpa makna kuat (yang, dan, the) yang sering dibuang agar indeks ringan.'],
        ['Stemming', 'Pemotongan imbuahan agar berbagai bentuk kata menyatu pada satu token dasar.'],
        ['Synonym', 'Filter yang mengembangkan kata menjadi padanan (laptop ↔ notebook) saat indexing atau query.'],
        ['Normalizer', 'Pemroses untuk field <code>keyword</code> yang menyeragamkan nilai tanpa memecahnya.'],
        ['_analyze', 'Endpoint untuk melihat token hasil analyzer tertentu sebelum atau sesudah indexing.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Jalankan teks yang sama ke analyzer <code>standard</code>, <code>simple</code>, <code>whitespace</code>, dan <code>keyword</code>; buat tabel perbandingan token hasilnya dan tulis kapan masing-masing tepat dipakai.</li><li>Buat index <code>articles</code> dengan custom analyzer, uji lewat <code>_analyze</code>, lalu buktikan bahwa query pada field itu menemukan dokumen yang kamu harapkan.</li><li>Uji teks Bahasa Indonesia (imbuhan, kata henti lokal) dan catat token hasilnya; tentukan apakah kamu butuh sinonim, stemmer, atau daftar query tambahan — beserta alasannya.</li><li><b>Checkpoint:</b> mampu menjelaskan alur tiga tahap analyzer, menulis custom analyzer yang teruji, dan mengevaluasi hasil tokenization untuk teks Indonesia sebelum dipakai produksi.</li></ol>'
    }
  ],
  recap: [
    'Analyzer = <b>character filter → tokenizer → token filter</b>; tahap yang sama dijalankan pada indexing dan query agar bentuk token selaras.',
    'Endpoint <code>_analyze</code> adalah mikroskopmu: selalu uji token di sana sebelum mempercayai analyzer baru.',
    'Custom analyzer ditulis di <code>settings.analysis</code> lalu ditunjuk pada field di mapping — perubahan pada data lama menuntut <b>reindex</b>.',
    'Teks <b>Bahasa Indonesia</b> butuh pengujian sendiri: imbuhan tidak otomatis teratasi, dan keputusanmu (synonym/stemmer/daftar query) menentukan kualitas pencarian.'
  ]
});
