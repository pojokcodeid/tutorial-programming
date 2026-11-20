/* ============================================================
   Pelajaran Elasticsearch — 10: Pagination Skalabel: search_after & PIT
   (Roadmap Level 8B — bab Operasional)
   ============================================================ */
'use strict';

window.ELASTICSEARCH_LESSONS = window.ELASTICSEARCH_LESSONS || [];

window.ELASTICSEARCH_LESSONS.push({
  id: 'pagination-skala',
  title: 'Pagination Skalabel: search_after & PIT',
  chapter: 'Operasional',
  duration: '14 menit',
  intro: [
    'Bayangkan kamu membuka katalog dengan sepuluh juta produk dan mengklik &quot;halaman 50.000&quot;. Tidak ada tombol seperti itu — dan memang seharusnya tidak ada. <b>Pagination gaya lama punya batas fisik</b>: semakin jauh kamu melangkah, semakin banyak dokumen yang harus diproses lalu dibuang begitu saja. Elasticsearch menyebut batas itu <code>max_result_window</code>, defaultnya 10.000.',
    'Pelajaran ini membedakan empat pendekatan: <code>from/size</code> yang sederhana tapi berhenti di 10.000, <b><code>search_after</code></b> yang melangkah dengan penanda (cursor) sehingga tidak pernah mundur, <b>Point in Time (PIT)</b> yang mengunci satu titik baca agar hasil konsisten antar halaman, dan <b>Scroll API</b> yang memang dirancang untuk ekstraksi data — bukan untuk halaman aplikasi.',
    'Kamu akan menulis cursor pagination yang benar-benar jalan: sort stabil dengan field unik sebagai pengikat, nilai terakhir dari halaman sebelumnya dimasukkan ke <code>search_after</code>, dan PIT dipakai agar perubahan data di tengah jalan tidak membuat dokumen lompat antar halaman.'
  ],
  objectives: [
    'Menjelaskan batas <code>from/size</code> dan kapan ia mulai menjadi masalah',
    'Menulis pencarian <code>search_after</code> dengan sort stabil untuk cursor pagination',
    'Menggabungkan PIT dan <code>search_after</code> untuk hasil yang konsisten antar halaman',
    'Memilih di antara from/size, search_after, PIT, dan scroll untuk tiap kebutuhan'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Kenapa halaman ke-50.000 mahal?</h3><p>Dengan <code>from/size</code>, Elasticsearch menghitung skor dan mengurutkan <b>semua</b> dokumen yang cocok, lalu membuang <code>from</code> dokumen pertama dan mengirim <code>size</code> berikutnya. Untuk halaman pertama, pembuangannya nol. Untuk halaman ke-1000 (from: 9990), ia membuang hampir sepuluh ribu dokumen yang sudah susah payah dihitung — hanya untuk menampilkan sepuluh.</p><table><thead><tr><th>Pendekatan</th><th>Cara melangkah</th><th>Batas</th><th>Cocok untuk</th></tr></thead><tbody><tr><td><code>from/size</code></td><td>Lompat offset</td><td><code>max_result_window</code> 10.000</td><td>Halaman dekat awal, data kecil</td></tr><tr><td><code>search_after</code></td><td>Cursor ke depan</td><td>Tidak ada offset</td><td>Feed, ekspor, halaman jauh</td></tr><tr><td>PIT + <code>search_after</code></td><td>Cursor pada titik baca tetap</td><td>Tidak ada offset</td><td>Butuh konsistensi antar halaman</td></tr><tr><td>Scroll</td><td>Snapshot batch</td><td>Resource tertahan</td><td>Ekstraksi/ETL, bukan UI</td></tr></tbody></table><p>Perubahan filosofinya: <b>berhenti berpikir &quot;halaman ke berapa&quot; dan mulai berpikir &quot;lanjutkan dari mana terakhir&quot;</b>. Pendekatan kedua tidak bisa melompat ke tengah, tapi ia tidak pernah membayar biaya membuang dokumen — dan itulah yang dibutuhkan data besar.</p>'
    },
    {
      type: 'example',
      title: 'from/size dan batas max_result_window',
      lang: 'http',
      output: false,
      code: `GET /products/_search
{
  "query": { "match_all": {} },
  "sort": [
    { "price": "asc" },
    { "_id": "asc" }
  ],
  "from": 0,
  "size": 10
}

# halaman jauh: berani coba sampai batasnya
GET /products/_search
{
  "query": { "match_all": {} },
  "sort": [{ "price": "asc" }],
  "from": 9990,
  "size": 10
}

# coba lewat batas dan baca errornya
GET /products/_search
{
  "query": { "match_all": {} },
  "from": 10000,
  "size": 10
}`,
      explain: [
        'Perhatikan sort yang menulis dua field: <code>price</code> lalu <code>_id</code> — inilah <b>sort stabil</b>; tanpa pengikat, dua produk dengan harga sama bisa tertukar urutannya antar halaman sehingga dokumen terlewat atau muncul dua kali.',
        '<code>from: 9990</code> masih di bawah batas default 10.000, tetapi Elasticsearch sudah harus menghitung dan membuang 9.990 dokumen sebelum mengirim 10 terakhir — biaya yang tumbuh seiring halaman.',
        'Mencoba <code>from: 10000</code> menghasilkan error <code>index.max_result_window</code> — pesan ini bukan bug, melainkan pengaman agar tidak ada yang diam-diam menjalankan query raksasa.',
        'Kamu boleh menaikkan batas itu, tetapi itu hanya memindahkan masalah: halaman ke-50.000 tetap mahal. Untuk kebutuhan melangkah jauh, gunakan <code>search_after</code>.'
      ]
    },
    {
      type: 'example',
      title: 'search_after: melangkah dengan penanda terakhir',
      lang: 'http',
      output: false,
      code: `# halaman pertama — ambil nilai sort terakhir sebagai penanda
GET /products/_search
{
  "query": { "match_all": {} },
  "sort": [
    { "price": "asc" },
    { "_id": "asc" }
  ],
  "size": 10
}

# halaman kedua — sisipkan penanda dari halaman pertama
GET /products/_search
{
  "query": { "match_all": {} },
  "sort": [
    { "price": "asc" },
    { "_id": "asc" }
  ],
  "size": 10,
  "search_after": [750000, "p-002"]
}`,
      explain: [
        '<code>search_after</code> menerima array nilai sort dari dokumen <b>terakhir</b> halaman sebelumnya; Elasticsearch melanjutkan tepat setelah titik itu — tidak ada dokumen yang diproses lalu dibuang.',
        'Urutan array pada <code>search_after</code> harus persis sama dengan urutan <code>sort</code> — satu saja berbeda, dan penandanya tidak akan cocok.',
        'Karena tidak ada offset, kamu tidak bisa melompat ke halaman sebelumnya; model ini disebut <b>cursor pagination</b>: hanya bisa maju, seperti membaca buku dari penanda.',
        'Nilai <code>_id</code> ikut disortir sebagai pengikat terakhir sehingga selalu ada urutan unik — tanpa itu, dua dokumen dengan harga sama membuat penanda ambigu.'
      ]
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 320" width="760" role="img" aria-label="Perbandingan pagination Elasticsearch: from size membuang dokumen offset yang mahal, search_after melangkah dengan cursor dari nilai sort terakhir, PIT mengunci titik baca agar konsisten, scroll khusus ekstraksi batch">
        <text x="30" y="34" class="u-title" text-anchor="start">Empat cara melangkahi hasil</text>
        <rect x="30" y="58" width="336" height="106" rx="10" class="u-box"/>
        <text x="198" y="86" class="u-title" text-anchor="middle">from/size (offset)</text>
        <text x="198" y="116" class="u-lbl" text-anchor="middle">urut semua → buang N → kirim 10</text>
        <text x="198" y="144" class="u-lbl" text-anchor="middle">berhenti di 10.000 (max_result_window)</text>
        <rect x="394" y="58" width="336" height="106" rx="10" class="u-hd"/>
        <text x="562" y="86" class="u-title" text-anchor="middle">search_after (cursor)</text>
        <text x="562" y="116" class="u-lbl" text-anchor="middle">lanjut setelah nilai sort terakhir</text>
        <text x="562" y="144" class="u-lbl" text-anchor="middle">tanpa offset → hemat &amp; tanpa batas</text>
        <rect x="30" y="182" width="336" height="106" rx="10" class="u-hd"/>
        <text x="198" y="210" class="u-title" text-anchor="middle">PIT + search_after</text>
        <text x="198" y="240" class="u-lbl" text-anchor="middle">snapshot titik baca konsisten</text>
        <text x="198" y="268" class="u-lbl" text-anchor="middle">data berubah pun tidak lompat</text>
        <rect x="394" y="182" width="336" height="106" rx="10" class="u-box"/>
        <text x="562" y="210" class="u-title" text-anchor="middle">Scroll (ekstraksi)</text>
        <text x="562" y="240" class="u-lbl" text-anchor="middle">menahan resource untuk batch</text>
        <text x="562" y="268" class="u-lbl" text-anchor="middle">untuk ETL, bukan halaman aplikasi</text>
        <text x="380" y="312" class="u-lbl" text-anchor="middle">UI: from/size bila dekat awal, search_after+PIT bila data besar</text>
      </svg></div><figcaption>from/size membayar biaya offset, search_after melangkah gratis dengan cursor, PIT menjamin konsistensi, dan scroll khusus ekstraksi.</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Point in Time: mengunci satu titik baca',
      lang: 'http',
      output: false,
      code: `# 1) buka PIT — beri ttl cukup untuk seluruh perjalanan
POST /products/_pit?keep_alive=2m
# → response memuat "id" yang dipakai pada semua halaman

# 2) pakai pit.id pada setiap halaman
GET /_search
{
  "size": 10,
  "pit": { "id": "46ToAWQ1d3d5UXV..." },
  "sort": [{ "price": "asc" }, { "_id": "asc" }]
}

# 3) tutup saat selesai agar resource dilepas
DELETE /_pit
{
  "id": "46ToAWQ1d3d5UXV..."
}`,
      explain: [
        'PIT membuka satu &quot;titik baca&quot; pada saat itu juga; selama PIT terbuka, setiap halaman membaca dari snapshot yang sama meskipun dokumen baru masuk atau terhapus.',
        'Field <code>keep_alive</code> memperpanjang umur PIT secara otomatis selama kamu masih mengirim request — bila kamu berhenti me-refresh, PIT kedaluwarsa dan request berikutnya menolak.',
        'Sort pada pencarian ber-PIT <b>tidak boleh memakai <code>_score</code></b> (skor bisa berbeda antar segmen); sort berbasis field + <code>_id</code> adalah pilihan standar.',
        '<code>DELETE /_pit</code> wajib dipanggil di akhir — PIT menahan resource (segmen) di memori; lupa menutupnya membuat cluster menampung snapshot yang tidak terpakai.'
      ]
    },
    {
      type: 'example',
      title: 'Cursor pagination lengkap: PIT + search_after dalam alur',
      lang: 'http',
      output: false,
      code: `# langkah 1: buka PIT
POST /products/_pit?keep_alive=2m
# → ambil "id" dari response

# langkah 2: halaman pertama
GET /_search
{
  "size": 20,
  "pit": { "id": "ID_HASIL_LANGKAH_1" },
  "sort": [
    { "created": "desc" },
    { "_id": "asc" }
  ]
}

# langkah 3: halaman berikutnya (nilai sort halaman sebelumnya)
GET /_search
{
  "size": 20,
  "pit": { "id": "ID_HASIL_LANGKAH_1" },
  "sort": [
    { "created": "desc" },
    { "_id": "asc" }
  ],
  "search_after": ["2026-11-20T08:00:00.000Z", "p-042"]
}

# langkah 4: tutup PIT
DELETE /_pit
{
  "id": "ID_HASIL_LANGKAH_1"
}`,
      explain: [
        'Alurnya selalu sama: buka PIT sekali → ulangi pencarian dengan <code>search_after</code> dari halaman sebelumnya → tutup PIT di akhir; tidak ada offset yang dikirim sama sekali.',
        'Sort <code>created desc</code> membuat feed terbaru dulu, dan <code>_id</code> sebagai pengikat menjamin dua dokumen dengan waktu sama tidak tertukar antar halaman.',
        'Karena memakai PIT, seluruh perjalanan membaca snapshot yang sama — dokumen baru yang masuk tidak akan muncul di tengah, sehingga tidak ada dokumen terlewat.',
        'Dalam kode aplikasi, simpan <code>pit.id</code> dan array sort terakhir di state request; kirim keduanya kembali ke Elasticsearch pada pemanggilan berikutnya.'
      ]
    },
    {
      type: 'example',
      title: 'Scroll API untuk ekstraksi data (bukan pagination aplikasi)',
      lang: 'http',
      output: false,
      code: `# kirim batch pertama dan simpan scroll id
POST /products/_search?scroll=1m
{
  "size": 1000,
  "query": { "match_all": {} }
}

# ambil batch berikutnya dengan scroll id yang sama
POST /_search/scroll
{
  "scroll": "1m",
  "scroll_id": "DXF1ZXJ5QW5kRmV0Y2..."
}

# lepaskan resource saat selesai
DELETE /_search/scroll
{
  "scroll_id": ["DXF1ZXJ5QW5kRmV0Y2..."]
}`,
      explain: [
        '<code>scroll=1m</code> membuat snapshot sementara dan mengirimkan batch pertama beserta <code>_scroll_id</code>; panggilan berikutnya melanjutkan dari titik itu.',
        'Scroll memegang segmen tetap selama scroll hidup — bagus untuk ekstraksi penuh ke data warehouse, tetapi berbahaya sebagai pagination UI karena resource tertahan dan posisinya tidak fleksibel.',
        'Scroll dirancang untuk konsumsi maju saja; untuk halaman aplikasi, <code>search_after</code> + PIT lebih ringan dan lebih mudah dielola.',
        'Selalu tutup scroll dengan <code>DELETE /_scroll</code> — membiarkannya kedaluwarsa otomatis memang bisa, tetapi melepas resource secepatnya adalah kebiasaan yang lebih sehat.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan umum pagination',
      text: '<ul><li><b>Sort tidak stabil</b> — hanya mengurutkan <code>price</code> tanpa pengikat unik membuat dokumen dengan harga sama tertukar antar halaman; tambahkan <code>_id</code>.</li><li><b>Urutan <code>search_after</code> tidak sama dengan <code>sort</code></b> — array nilai harus berurutan identik, kalau tidak penandanya tidak cocok dan hasilnya aneh.</li><li><b>Menaikkan <code>max_result_window</code> sebagai solusi</b> — ia hanya memundurkan batas; halaman tetap makin mahal seiring jarak.</li><li><b>Memakai scroll untuk UI</b> — resource tertahan dan pengguna tidak bisa melompat; gunakan untuk ekstraksi saja.</li><li><b>Lupa menutup PIT</b> — resource menumpuk diam-diam; selalu <code>DELETE /_pit</code> di akhir, idealnya di blok penutup kode (try/finally).</li></ul>'
    },
    {
      type: 'tip',
      title: 'Uji dengan data besar supaya masalahnya terlihat',
      text: '<p>Pagination terasa mudah saat datanya 100 dokumen — semua pendekatan terasa sama. Sengaja tanam 50.000–100.000 dokumen dengan bulk, lalu bandingkan waktu respons halaman pertama, halaman ke-500 (from/size), dan setara dengan search_after. Angka di layarmu sendiri lebih meyakinkan daripada uraian mana pun, dan itulah yang akan kamu ingat saat memutuskan di proyek nyata.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['from/size', 'Pagination berbasis offset: lewati <code>from</code> dokumen lalu kirim <code>size</code> — punya batas <code>max_result_window</code>.'],
        ['max_result_window', 'Batas jumlah offset yang diizinkan (default 10.000) untuk melindungi cluster dari query raksasa.'],
        ['search_after', 'Pencarian lanjutan yang memakai nilai sort terakhir sebagai cursor; tanpa offset dan tanpa batas.'],
        ['Sort stabil', 'Urutan yang dijamin unik dengan menambahkan field pengikat (misal <code>_id</code>) agar tidak ada dokumen tertukar.'],
        ['Point in Time (PIT)', 'Snapshot titik baca yang membuat seluruh halaman membaca data pada kondisi yang sama.'],
        ['keep_alive', 'Perpanjangan umur PIT/scroll yang diperbarui otomatis selama request masih berjalan.'],
        ['Scroll API', 'Pengambilan batch berurutan dengan menahan snapshot; cocok untuk ekstraksi, bukan halaman aplikasi.'],
        ['Cursor pagination', 'Model melangkah maju dari posisi terakhir; tidak bisa melompat mundur seperti offset.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Implementasikan pagination 10 item dengan <code>from/size</code> pada index berisi beberapa ribu dokumen; lalu coba melompat ke halaman jauh dan catat error <code>max_result_window</code>.</li><li>Bandingkan langsung: halaman ke-500 dengan <code>from/size</code> versus halaman setara dengan <code>search_after</code> — catat waktu respons keduanya.</li><li>Bangun cursor pagination lengkap dengan PIT: buka PIT, ambil tiga halaman berturut-tutup dengan <code>search_after</code>, lalu tutup PIT; buktikan tidak ada dokumen yang terlewat atau ganda.</li><li><b>Checkpoint:</b> mampu menjelaskan kapan from/size berhenti layak dipakai, menulis sort stabil, menjalankan search_after + PIT, dan memilih scroll hanya untuk ekstraksi batch.</li></ol>'
    }
  ],
  recap: [
    '<code>from/size</code> membayar biaya offset dan berhenti pada <code>max_result_window</code> (10.000) — cocok hanya untuk halaman dekat awal.',
    '<b>search_after</b> melangkah dengan cursor nilai sort terakhir: tanpa offset, tanpa batas, dan wajib disertai <b>sort stabil</b> (field + pengikat <code>_id</code>).',
    '<b>PIT</b> mengunci titik baca agar seluruh halaman konsisten walau data berubah; wajib diperpanjang <code>keep_alive</code> dan <b>ditutup di akhir</b>.',
    '<b>Scroll</b> menahan resource untuk ekstraksi batch — bukan pilihan default pagination aplikasi; pilihannya: from/size bila dekat awal, search_after + PIT bila data besar.'
  ]
});
