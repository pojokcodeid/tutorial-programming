/* ============================================================
   Soal kuis Elasticsearch — 40 soal (es01–es40)
   Sebaran: es01–es03 = Level 0 · es04–es06 = Level 1
            es07–es09 = Level 2 · es10–es12 = Level 3
            es13–es15 = Level 4 · es16–es18 = Level 5
            es19–es21 = Level 6 · es22–es24 = Level 7
            es25–es27 = Level 8A · es28–es30 = Level 8B
            es31–es33 = Level 8C · es34–es36 = Level 8D
            es37–es38 = Level 9 · es39–es40 = Capstone
   Jawaban berputar 0,1,2,3 sehingga tiap indeks = 10 soal.
   ============================================================ */
'use strict';

window.ELASTICSEARCH_QUIZ_POOL = window.ELASTICSEARCH_QUIZ_POOL || [];

window.ELASTICSEARCH_QUIZ_POOL.push(
  {
    id: 'es01',
    q: 'Kamu mendeskripsikan Elasticsearch kepada rekan yang baru pertama mendengarnya. Pernyataan paling tepat adalah...',
    options: [
      'Elasticsearch adalah search engine terdistribusi yang menyimpan dokumen JSON dan mencarinya secara cepat lewat inverted index',
      'Elasticsearch adalah database relasional yang menyimpan data dalam baris dan kolom lalu menjawab SQL',
      'Elasticsearch adalah message broker yang menyalurkan pesan antar service',
      'Elasticsearch adalah file storage untuk menyimpan gambar dan dokumen mentah'
    ],
    answer: 0,
    explain: 'Elasticsearch berbasis dokumen JSON dan inverted index untuk pencarian cepat dan terdistribusi — bukan database relasional, message broker, maupun file storage.'
  },
  {
    id: 'es02',
    q: 'Dalam struktur data Elasticsearch, hubungan yang benar antara index, document, dan field adalah...',
    options: [
      'Document berisi kumpulan index, dan index berisi field',
      'Index berisi kumpulan document, dan document terdiri dari kumpulan field dengan nilai',
      'Field berisi kumpulan index, dan index berisi document',
      'Ketiganya berada pada level yang sama dan tidak berhubungan'
    ],
    answer: 1,
    explain: 'Index adalah wadah kumpulan document; satu document adalah objek JSON yang terdiri dari field-field beserta nilainya — mirip tabel, baris, dan kolom.'
  },
  {
    id: 'es03',
    q: 'Ketika kamu mengetik &quot;laptop gaming&quot; pada kolom pencarian sebuah situs, komponen Elasticsearch yang bertanggung jawab menemukan document yang cocok adalah...',
    options: [
      'Snapshot repository yang membaca salinan backup',
      'Master node yang memilih shard pemenang',
      'Analyzer yang memecah teks menjadi token, lalu mencocokkannya ke inverted index',
      'Kibana yang merender hasil pencarian'
    ],
    answer: 2,
    explain: 'Query diproses analyzer menjadi token lalu dicocokkan ke inverted index. Kibana hanya menampilkan hasil, snapshot untuk backup, dan master node mengelola cluster — bukan pencarian dokumen.'
  },
  {
    id: 'es04',
    q: 'Kamu menulis compose.yaml untuk lab Elasticsearch dan ragu memakai tag gambar. Pilihan paling aman untuk reproducibility adalah...',
    options: [
      'Tag latest agar selalu versi terbaru',
      'Tanpa tag sehingga otomatis memakai versi stabil',
      'Tag beta agar mencoba fitur terbaru',
      'Tag 8.17.0 — versi tetap untuk seluruh lab sehingga perilaku bisa diprediksi dan direproduksi'
    ],
    answer: 3,
    explain: 'Tag versi tetap (8.17.0) membuat lab reproducible; latest bisa berubah sewaktu-waktu dan merusak hasil percobaan, sedangkan beta tidak stabil.'
  },
  {
    id: 'es05',
    q: 'Setelah podman compose up -d, kamu ingin memastikan Elasticsearch benar-benar siap melayani, bukan sekadar container berstatus running. Pemeriksaan yang tepat adalah...',
    options: [
      'Membaca kolom health pada podman compose ps (healthy) dan mencoba curl http://localhost:9200 sampai menjawab',
      'Langsung membuka Kibana karena container pasti siap',
      'Menunggu tepat 60 detik tanpa memeriksa apa pun',
      'Menjalankan podman rm agar container bersih'
    ],
    answer: 0,
    explain: 'Status running hanya berarti proses hidup; Elasticsearch masih memuat index. Health check (healthy) plus curl ke port 9200 adalah bukti kesiapan sesungguhnya.'
  },
  {
    id: 'es06',
    q: 'Kamu menghapus container lab dengan podman compose down, lalu menjalankannya kembali. Data index yang kamu buat sebelumnya...',
    options: [
      'Hilang selamanya karena container ikut terhapus',
      'Tetap ada, karena data tersimpan di volume (misal esdata) yang tidak ikut terhapus oleh down',
      'Berubah menjadi format backup otomatis',
      'Pindah ke Kibana sehingga tidak bisa diakses lagi'
    ],
    answer: 1,
    explain: 'down menghapus container dan network tetapi menyisakan volume; data hanya hilang ketika volume ikut dihapus (podman volume rm).'
  },
  {
    id: 'es07',
    q: 'Kamu ingin membuat document dengan id tertentu &quot;p-100&quot; pada index products. Method HTTP yang tepat adalah...',
    options: [
      'POST /products/_doc tanpa id (id dibuat server)',
      'GET /products/_doc/p-100 (GET hanya untuk membaca)',
      'PUT /products/_doc/p-100 — membuat atau mengganti document dengan id eksplisit',
      'DELETE /products/_doc/p-100 (menghapus bukan membuat)'
    ],
    answer: 2,
    explain: 'PUT ke /index/_doc/id membuat atau mengganti document dengan id yang kamu tentukan; POST dipakai bila id diserahkan ke server.'
  },
  {
    id: 'es08',
    q: 'Perbedaan utama PUT /products/_doc/1 dan POST /products/_doc (keduanya berisi data sama) adalah...',
    options: [
      'PUT mengirim data lebih cepat daripada POST',
      'POST hanya bisa dipakai pada index kosong',
      'Tidak ada perbedaan, keduanya selalu menghasilkan id yang sama',
      'PUT membuat id 1 secara eksplisit (bila sudah ada, replace), sedangkan POST membuat document baru dengan id acak dari server'
    ],
    answer: 3,
    explain: 'PUT menentukan id sehingga idempotent (replace bila sudah ada); POST menyerahkan pembuatan id pada server sehingga setiap panggilan menghasilkan document baru.'
  },
  {
    id: 'es09',
    q: 'Saat menulis Bulk API, kamu lupa mengakhiri baris terakhir dengan newline dan mencampur urutan aksi dengan data. Akibatnya...',
    options: [
      'Bulk gagal diparse atau sebagian aksi tidak cocok dengan datanya — semua baris wajib berupa JSON satu per baris dan berpasangan aksi–data',
      'Elasticsearch diam-diam memperbaiki format sehingga tidak masalah',
      'Hanya baris pertama yang gagal, sisanya tetap masuk semua',
      'Data masuk tetapi tanpa _id sehingga tidak bisa diambil'
    ],
    answer: 0,
    explain: 'Bulk memakai NDJSON: satu objek JSON per baris, baris aksi berpasangan dengan baris data, dan setiap baris (termasuk terakhir) wajib diakhiri newline.'
  },
  {
    id: 'es10',
    q: 'Field employee_id seharusnya selalu dicari secara persis (&quot;E-1001&quot;). Tipe data yang paling tepat untuknya adalah...',
    options: [
      'text — agar bisa dicari penuh seperti deskripsi',
      'keyword — disimpan utuh tanpa analyzer sehingga cocok untuk pencocokan persis, filter, dan sort',
      'object — agar bebas menyimpan format apa pun',
      'float — agar mendukung perbandingan'
    ],
    answer: 1,
    explain: 'keyword disimpan utuh tanpa dipotong analyzer sehingga cocok untuk kecocokan persis, filter, sort, dan aggregation; text justru akan memecah nilainya.'
  },
  {
    id: 'es11',
    q: 'Kamu sudah memiliki banyak data pada index dengan mapping yang salah tipe (misal salary berupa text). Untuk mengubahnya menjadi long, langkah yang benar adalah...',
    options: [
      'Cukup mengirim PUT /index/_mapping dengan tipe baru — Elasticsearch mengubah data lama otomatis',
      'Menghapus seluruh index lalu mulai dari nol tanpa reindex (data ikut hilang)',
      'Membuat index baru dengan mapping benar, lalu memindahkan data lewat POST /_reindex',
      'Mengubah tipe field lewat settings pada compose lalu restart container'
    ],
    answer: 2,
    explain: 'Perubahan tipe field yang sudah ada tidak didukung; cara benar adalah membuat index baru dengan mapping eksplisit, reindex datanya, lalu memindahkan alias/aplikasi.'
  },
  {
    id: 'es12',
    q: 'Kamu perlu mengurutkan produk berdasarkan nama sekaligus mengagregasinya. Field name bertipe text. Solusi paling tepat adalah...',
    options: [
      'Mengubah seluruh field name menjadi text agar lebih fleksibel',
      'Menghapus field name dan menyimpannya di database saja',
      'Memakai analyzer whitespace pada field name',
      'Menambahkan sub-field name.keyword bertipe keyword lewat blok fields, lalu memakainya untuk sort dan aggregation'
    ],
    answer: 3,
    explain: 'Multi-field (name + name.keyword) memberi dua kemampuan dalam satu field: pencarian penuh pada text dan sort/agregasi yang tepat pada keyword.'
  },
  {
    id: 'es13',
    q: 'Pada bool query, bagian filter memiliki karakteristik khusus dibanding must, yaitu...',
    options: [
      'Filter tidak memengaruhi skor _score dan bisa memakai cache sehingga lebih efisien untuk syarat tetap seperti harga atau status',
      'Filter hanya bisa berisi satu klausa saja',
      'Filter menghapus document dari index secara permanen',
      'Filter mengabaikan query dan menampilkan semua document'
    ],
    answer: 0,
    explain: 'Filter menentukan termasuk/tidaknya document tanpa menghitung relevansi (skor tetap), dan hasilnya dapat di-cache — tepat untuk syarat tetap seperti rentang harga dan kategori.'
  },
  {
    id: 'es14',
    q: 'Kamu mencari &quot;mechanical keyboard&quot; dan ingin kedua kata berurutan persis dalam teks. Query yang tepat adalah...',
    options: [
      'match dengan fuzziness AUTO agar longgar',
      'match_phrase — menuntut urutan kata berurutan di dalam teks',
      'term pada field name.keyword dengan nilai &quot;mechanical keyboard&quot; utuh',
      'match_all lalu menyaring manual di aplikasi'
    ],
    answer: 1,
    explain: 'match_phrase menuntut frasa berurutan; match biasa menganggap kata terpisah, sedangkan term pada keyword menuntut seluruh nilai persis sama.'
  },
  {
    id: 'es15',
    q: 'Pada query match, fuzziness: AUTO berguna untuk...',
    options: [
      'Menghapus document yang salah ketik dari index',
      'Menaikkan _score menjadi dua kali lipat',
      'Menoleransi jarak edit sehingga &quot;gmaing&quot; tetap menemukan &quot;gaming&quot; (mengatasi salah ketik)',
      'Membuat pencarian menjadi case-sensitive'
    ],
    answer: 2,
    explain: 'fuzziness mengizinkan penyimpangan huruf (levenshtein) sesuai panjang kata sehingga pencarian tahan salah ketik; ia tidak menghapus data, menggandakan skor, maupun mengubah sensitivitas huruf.'
  },
  {
    id: 'es16',
    q: 'Kamu hanya ingin menampilkan ringkasan jumlah produk per kategori tanpa mengirim dokumennya. Praktik yang benar adalah...',
    options: [
      'Mengirim query match_all dengan size besar lalu menghitung di aplikasi',
      'Menggunakan scroll API untuk membaca semua document',
      'Menghapus seluruh document setelah aggregasi selesai',
      'Mengatur size: 0 pada request dan menambahkan aggregation terms pada field kategori'
    ],
    answer: 3,
    explain: 'size: 0 menonaktifkan pengiriman dokumen sehingga response hanya berisi hits.total dan agregasi; aggregation terms mengelompokkan per kategori tanpa mengunduh dokumen.'
  },
  {
    id: 'es17',
    q: 'Pada request pencarian, field _source yang berisi [&quot;name&quot;, &quot;price&quot;] berfungsi untuk...',
    options: [
      'Membatasi field yang dikembalikan pada response agar daftar lebih ringan, tanpa memengaruhi query atau aggregation',
      'Memfilter document mana yang boleh muncul berdasarkan field tersebut',
      'Menghapus field lain dari index secara permanen',
      'Mengubah tipe data field menjadi string'
    ],
    answer: 0,
    explain: '_source hanya memilih field mana yang ikut dikirim pada response; query, sort, dan aggregation tetap berjalan pada seluruh data di index.'
  },
  {
    id: 'es18',
    q: 'Untuk menemukan pesanan yang memiliki item laptop qty minimal 2 DAN item mouse sekaligus pada field items, pendekatan yang benar adalah...',
    options: [
      'Memakai object biasa — array otomatis dipertahankan per elemen',
      'Memakai field bertipe nested sehingga syarat terpenuhi pada elemen array yang sama, dengan query nested berpath items',
      'Cukup menambahkan dua match pada bool must tanpa nested',
      'Mengubah items menjadi text lalu mencari frasa'
    ],
    answer: 1,
    explain: 'Object biasa meratakan array sehingga syarat bisa &quot;campur aduk&quot; antar elemen; nested menyimpan tiap elemen terpisah sehingga seluruh syarat harus cocok pada item yang sama.'
  },
  {
    id: 'es19',
    q: 'Kamu menjalankan POST /_analyze dengan analyzer standard pada teks &quot;Elasticsearch is Powerful&quot; dan memperhatikan hasilnya. Perilaku yang benar adalah...',
    options: [
      'Teks dikembalikan utuh sebagai satu token karena analyzer tidak mengubah apa pun',
      'Teks diterjemahkan ke bahasa lain sebelum dipecah',
      'Teks dipecah menjadi token huruf kecil, tanda baca dibuang, dan stop words seperti &quot;is&quot; ikut terbuang',
      'Hanya huruf kapital yang disimpan sebagai token'
    ],
    answer: 2,
    explain: 'Standard analyzer menyeragamkan huruf (lowercase), membuang tanda baca, dan membuang stop words bawaan sehingga menghasilkan token seperti elasticsearch, powerful.'
  },
  {
    id: 'es20',
    q: 'Aturan emas pemakaian analyzer adalah analyzer saat indexing harus sama dengan saat query. Bila tidak terpenuhi, akibatnya...',
    options: [
      'Elasticsearch otomatis memakai analyzer query untuk seluruh data sehingga tetap aman',
      'Muncul warning pada log tetapi hasil pencarian tetap benar',
      'Index rusak dan harus dihapus selamanya',
      'Pencarian bisa kosong tanpa error apa pun, karena bentuk token di kedua sisi tidak pernah cocok'
    ],
    answer: 3,
    explain: 'Ketidakcocokan analyzer membuat token hasil indexing tidak pernah sama dengan token query — hasilnya nihil tanpa error, penyebab paling umum &quot;query benar tapi hasil kosong&quot;.'
  },
  {
    id: 'es21',
    q: 'Setelah menambahkan filter sinonim &quot;laptop, notebook&quot; pada analyzer sebuah index yang sudah berisi banyak document, document lama belum langsung mengenali &quot;notebook&quot; sebagai &quot;laptop&quot; karena...',
    options: [
      'Filter synonym hanya berlaku untuk document yang ditulis setelah perubahan — document lama harus dianalisis ulang lewat reindex',
      'Sinonim tidak didukung oleh Elasticsearch sama sekali',
      'Sinonim hanya bekerja pada field keyword, bukan text',
      'Document lama harus dihapus manual satu per satu'
    ],
    answer: 0,
    explain: 'Analyzer (termasuk sinonim) diterapkan saat dokumen dianalisis; dokumen lama menyimpan token lama sehingga perlu reindex agar dianalisis ulang dengan konfigurasi baru.'
  },
  {
    id: 'es22',
    q: 'Cluster health berwarna yellow pada cluster satu node dengan number_of_replicas 1. Penjelasan paling tepat adalah...',
    options: [
      'Data hilang dan harus segera direstore dari snapshot',
      'Primary shard aktif, tetapi replica tidak punya node lain untuk ditempatkan sehingga belum teralokasi — normal pada cluster satu node',
      'Seluruh shard rusak dan harus dibuat ulang',
      'Node sedang proses upgrade sehingga yellow selalu muncul'
    ],
    answer: 1,
    explain: 'Yellow berarti semua primary aktif tetapi ada replica yang belum teralokasi; pada satu node, replica tidak boleh se-temat dengan primary sehingga memang tidak bisa dialokasikan.'
  },
  {
    id: 'es23',
    q: 'Mengapa Elasticsearch tidak menempatkan replica shard pada node yang sama dengan primary shard-nya?',
    options: [
      'Agar replica tidak memakan terlalu banyak memori pada node yang sama',
      'Karena primary dan replica tidak boleh memiliki jumlah shard yang sama',
      'Agar ketika node itu mati, salinan tetap ada di tempat lain sehingga data tidak ikut hilang',
      'Karena replica hanya boleh disimpan di disk eksternal'
    ],
    answer: 2,
    explain: 'Tujuan replica adalah ketahanan; bila bersebelahan dengan primary, satu kegagalan node menghapus keduanya sekaligus sehingga salinan menjadi percuma.'
  },
  {
    id: 'es24',
    q: 'Saat node data kedua tiba-tiba mati, tindakan pertama yang paling membantu diagnosis adalah...',
    options: [
      'Langsung menghapus seluruh index dan membuatnya dari awal',
      'Menaikkan max_result_window agar query tidak gagal',
      'Menambahkan analyzer baru pada seluruh field',
      'Membaca _cluster/health, _cat/nodes, dan _cat/shards untuk melihat status, node yang tersisa, serta shard mana yang menjadi unassigned'
    ],
    answer: 3,
    explain: 'Tiga endpoint itu menunjukkan warna cluster, siapa yang masih hidup, dan di mana data berada — mempersempit masalah ke alokasi shard sebelum mengambil tindakan lain.'
  },
  {
    id: 'es25',
    q: 'Kamu memeriksa query lambat dan menemukan pencarian fuzzy berjalan pada setiap kata kunci pengguna. Dampak dan solusi terbaik adalah...',
    options: [
      'Fuzzy menambah beban pencarian; jadikan pelengkap (misal hanya saat hasil sedikit) dan batasi field serta fuzziness-nya',
      'Fuzzy membuat _score nol sehingga harus diganti match_all',
      'Fuzzy hanya bisa dipakai pada field keyword, jadi pindahkan semua field ke keyword',
      'Fuzzy tidak memengaruhi performa sama sekali, jadi biarkan pada semua query'
    ],
    answer: 0,
    explain: 'Fuzzy menghitung jarak edit sehingga mahal bila dipakai mutlak; gunakan sebagai jaring pengaman ketik salah dengan pembatasan field/fuzziness, bukan dihapus total maupun diganti match_all.'
  },
  {
    id: 'es26',
    q: 'Untuk mempercepat pencarian pada field yang sering difilter (status, kategori) tanpa mengubah _score, opsi yang tepat adalah...',
    options: [
      'Menjadikan seluruh field bertipe text agar dianalyzer lebih cepat',
      'Membuat field bertipe keyword (atau menambah sub-field keyword) sehingga filter dapat dijalankan pada nilai utuh dan hasilnya bisa di-cache',
      'Menambahkan fuzzy pada setiap filter',
      'Mematikan replica agar shard lebih sedikit'
    ],
    answer: 1,
    explain: 'Filter pada keyword bekerja pada nilai utuh dan hasilnya dapat di-cache sehingga cepat; text justru salah untuk filter, dan fuzzy/mematikan replica tidak menyelesaikan masalah filter lambat.'
  },
  {
    id: 'es27',
    q: 'Kamu memeriksa pemakaian memori container Elasticsearch dan mendekati batas heap yang diatur. Langkah paling tepat adalah...',
    options: [
      'Menambah fuzzy pada semua query agar beban terdistribusi',
      'Menaikkan max_result_window menjadi sangat besar',
      'Mengevaluasi query berat (aggregation besar, fuzzy), membatasi size, serta menyesuaikan ES_JAVA_OPTS dengan memori mesin — bukan sekadar menaikkan heap tanpa analisis',
      'Menghapus replica seluruhnya agar hemat memori'
    ],
    answer: 2,
    explain: 'Lonjakan memori biasanya berasal dari query/agg besar dan size berlebih; evaluasi dulu lalu sesuaikan heap secara sadar. Menaikkan batas offset atau menghapus replica hanya menutupi gejala.'
  },
  {
    id: 'es28',
    q: 'Kamu mencoba from: 20000 pada pencarian dan menerima error index.max_result_window. Solusi paling tepat untuk menampilkan halaman jauh adalah...',
    options: [
      'Menaikkan max_result_window menjadi sangat besar agar from bebas berapa pun',
      'Menghapus data agar total dokumen kurang dari 10.000',
      'Mengganti sort menjadi _score saja agar tidak ada batas',
      'Berpindah ke search_after dengan sort stabil, karena ia melangkah dengan cursor tanpa offset sehingga tidak terkena batas window'
    ],
    answer: 3,
    explain: 'search_after tidak memakai offset sehingga bebas max_result_window; menaikkan batas hanya memundurkan masalah karena halaman jauh tetap mahal.'
  },
  {
    id: 'es29',
    q: 'Dalam search_after, sort [&quot;price asc&quot;, &quot;_id asc&quot;] disertai _id sebagai pengikat bertujuan untuk...',
    options: [
      'Membuat urutan menjadi unik dan stabil sehingga document dengan harga sama tidak tertukar atau terlewat antar halaman',
      'Mengurutkan document berdasarkan id agar seragam saja',
      'Menghapus document dengan id duplikat',
      'Mengubah _score menjadi nol agar konsisten'
    ],
    answer: 0,
    explain: 'Tanpa pengikat unik, dua document dengan harga sama bisa bertukar posisi antar halaman sehingga ada yang terlewat atau ganda; _id menjamin urutan total yang stabil.'
  },
  {
    id: 'es30',
    q: 'Manfaat Point in Time (PIT) pada pagination adalah...',
    options: [
      'Mengunci index agar tidak ada yang boleh menulis sama sekali',
      'Membuat seluruh halaman membaca snapshot data yang sama sehingga hasil konsisten walau data berubah di tengah perjalanan, dan wajib ditutup dengan DELETE /_pit',
      'Menyimpan hasil pencarian ke disk sebagai backup otomatis',
      'Menggantikan kebutuhan sort sehingga sort boleh dihapus'
    ],
    answer: 1,
    explain: 'PIT adalah titik baca tetap: seluruh halaman melihat kondisi data yang sama (tidak ada yang terlewat/lompat), keep_alive memperpanjang umurnya, dan PIT wajib ditutup agar resource dilepas.'
  },
  {
    id: 'es31',
    q: 'Setelah mengaktifkan xpack.security.enabled=true, sebuah request tanpa credential mengembalikan status...',
    options: [
      '200 — karena security hanya memengaruhi Kibana',
      '404 — karena endpoint berubah',
      '401 — missing authentication credentials, karena identitas belum dibuktikan',
      '301 — redirect ke halaman login Kibana'
    ],
    answer: 2,
    explain: 'Tanpa autentikasi, Elasticsearch menolak dengan 401 (missing credentials); 403 baru muncul ketika identitas sudah benar tetapi izinnya kurang.'
  },
  {
    id: 'es32',
    q: 'Prinsip least privilege pada pembuatan role Elasticsearch berarti...',
    options: [
      'Memberi user role superuser agar semua pekerjaan mudah dan cepat',
      'Membuat satu role universal untuk semua aplikasi',
      'Menonaktifkan seluruh role agar tidak ada yang salah',
      'Membatasi izin sesedikit mungkin yang tetap cukup untuk tugasnya — misal read saja pada index tertentu, bukan manage seluruh cluster'
    ],
    answer: 3,
    explain: 'Least privilege memberi hanya hak yang benar-benar dibutuhkan pada cakupan seluas yang perlu — memperkecil kerusakan bila kredensial bocor.'
  },
  {
    id: 'es33',
    q: 'API key dibuat dengan role_descriptors dan expiration 30d. Keuntungan utamanya dibanding memakai user superuser pada aplikasi adalah...',
    options: [
      'Cakupan API key dibatasi tepat pada index dan hak yang dibutuhkan, serta kedaluwarsa otomatis sehingga risiko bocor lebih terkendali',
      'API key membuat query berjalan dua kali lebih cepat',
      'API key tidak perlu disimpan sehingga aman dari kebocoran',
      'API key menghapus kebutuhan TLS pada aplikasi'
    ],
    answer: 0,
    explain: 'role_descriptors membatasi cakupan dan expiration membatasi umur — kombinasi yang memperkecil dampak bila bocor; API key tetap rahasia dan tidak menggantikan TLS.'
  },
  {
    id: 'es34',
    q: 'Sebelum mengandalkan sebuah snapshot repository untuk keadaan darurat, tindakan wajib pertama adalah...',
    options: [
      'Langsung menghapus index produksi untuk menguji restore',
      'Memverifikasi repository dengan /_snapshot/&lt;nama&gt;/_verify dan memastikan snapshot terakhir berstatus SUCCESS',
      'Mengganti type repository menjadi fs',
      'Menaikkan jumlah replica agar data lebih aman'
    ],
    answer: 1,
    explain: 'Verifikasi memastikan cluster benar-benar bisa baca/tulis ke repository, dan status SUCCESS memastikan snapshot siap dipulihkan — keduanya sebelum kejadian, bukan sesudahnya.'
  },
  {
    id: 'es35',
    q: 'Dalam kebijakan backup, RPO (Recovery Point Objective) menentukan...',
    options: [
      'Berapa lama waktu yang dibutuhkan hingga layanan pulih sepenuhnya (RTO)',
      'Berapa banyak user yang boleh mengakses repository',
      'Seberapa banyak data terbaru yang siap hilang — snapshot harian berarti RPO hingga 24 jam',
      'Jumlah shard yang harus dimiliki setiap index'
    ],
    answer: 2,
    explain: 'RPO adalah titik kehilangan yang bisa diterima (seberapa sering backup diambil); RTO yang menentukan lama pemulihan. Keduanya sering tertukar.'
  },
  {
    id: 'es36',
    q: 'Saat memulihkan index produksi yang terhapus, urutan tindakan paling aman adalah...',
    options: [
      'Restore langsung menimpa index yang sedang dipakai aplikasi agar cepat',
      'Mengubah mapping aplikasi agar tidak perlu restore',
      'Membuat index baru dari nol dan menyalin data lewat kursor manual',
      'Restore ke index baru (atau dalam keadaan tertutup), verifikasi jumlah dokumen dan query uji, lalu memindahkan alias aplikasi ke index hasil restore'
    ],
    answer: 3,
    explain: 'Restore ke tempat baru lalu verifikasi memberi jalan mundur bila snapshot ternyata bermasalah; menimpa langsung berisiko menimpa data baik dengan data yang belum tentu benar.'
  },
  {
    id: 'es37',
    q: 'Dalam integrasi backend, pola yang benar untuk menjaga pencarian tetap sinkron dengan database relasional adalah...',
    options: [
      'Database tetap source of truth; setelah perubahan, backend mengirim indexing (bulk) ke Elasticsearch dengan idempotensi, dan reconciliation berkala menutup selisih',
      'Elasticsearch dianggap source of truth, dan database hanya menyalin dari index',
      'Sinkronisasi dilakukan dengan menghapus dan membuat ulang index setiap jam',
      'Cukup menyimpan data di database — Elasticsearch akan membaca database secara otomatis'
    ],
    answer: 0,
    explain: 'Database adalah kebenaran, Elasticsearch data turunan; perubahan diteruskan lewat indexing idempoten dan reconciliation menutup selisih akibat kegagalan di tengah jalan.'
  },
  {
    id: 'es38',
    q: 'Saat Elasticsearch sedang mati, perilaku backend yang benar terhadap pengguna adalah...',
    options: [
      'Mengembalikan error 500 pada setiap request search agar pengguna tahu sistem rusak',
      'Degradasi terkendali: mencoba fallback (misal query database atau cache) atau menampilkan pesan pencarian tidak tersedia, lalu menyembuhkan diri saat ES pulih',
      'Menghapus antrian request agar tidak menumpuk',
      'Mematikan seluruh aplikasi sampai Elasticsearch kembali'
    ],
    answer: 1,
    explain: 'Degradasi terkendali menjaga pengalaman pengguna tetap wajar tanpa error 500; setelah pulih, reconciliation menyinkronkan kembali tanpa mematikan aplikasi.'
  },
  {
    id: 'es39',
    q: 'Pada capstone product search, bagian bool.filter dipakai untuk kategori, harga, dan rating karena...',
    options: [
      'Filter membuat _score produk yang cocok menjadi lebih tinggi',
      'Filter hanya berfungsi bila size diatur 0',
      'Syarat tetap tersebut tidak perlu memengaruhi skor relevansi dan hasilnya dapat di-cache, sehingga pencarian relevan (must) tetap murni',
      'Filter menghapus document yang tidak cocok dari index'
    ],
    answer: 2,
    explain: 'Filter memisahkan syarat tetap dari pencarian relevan: skor tidak tercemar, hasil dapat di-cache, dan document yang tidak lolos filter tidak ikut dihitung — bukan menghapus atau menaikkan skor.'
  },
  {
    id: 'es40',
    q: 'Sebuah capstone dianggap &quot;mahir&quot; ketika...',
    options: [
      'Jumlah fitur paling banyak dibanding proyek lain',
      'Berhasil demo pada data 10 dokumen saja',
      'Tidak pernah mengalami error selama pengembangan',
      'Seluruh Definition of Done terpenuhi dan kamu bisa menjelaskan alasan setiap keputusan (kenapa keyword untuk brand, kenapa filter, kenapa search_after) serta membuktikan aplikasi tetap melayani saat Elasticsearch mati'
    ],
    answer: 3,
    explain: 'Indikator mahir adalah pemahaman atas alasan di balik keputusan plus ketahanan yang terbukti (degradasi saat ES mati) — bukan sekadar jumlah fitur atau demo dengan data kecil.'
  }
);
