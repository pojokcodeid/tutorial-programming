/* ============================================================
   Pelajaran Microservices — Bab 6: Konsep Microservices
   ============================================================ */
'use strict';

window.MICROSERVICE_LESSONS = window.MICROSERVICE_LESSONS || [];

window.MICROSERVICE_LESSONS.push({
  id: 'konsep-microservices',
  title: 'Konsep Microservices: Batas, Data, dan Keputusan',
  chapter: 'Arsitektur Microservices',
  duration: '16–18 menit',
  intro: [
    'Microservices bukan teknologi yang kamu pasang, melainkan keputusan arsitektur yang kamu ambil — dan keputusan itu harus berlabuh pada masalah nyata: domain yang jelas terpisah, tim yang butuh rilis independen, atau beban yang tumbuh tidak merata antar bagian. Memecah service karena sedang tren adalah cara paling mahal untuk membeli masalah baru.',
    'Bab ini membedah lima pertanyaan yang harus terjawab sebelum kamu memecah OMS: di mana batas tiap service (bounded context), siapa pemilik data, bagaimana service berkomunikasi (sinkron vs asinkron), bagaimana mereka menemukan satu sama lain, dan apa yang terjadi ketika satu dari mereka jatuh di tengah request.',
    'Di akhir bab, kamu akan merancang arsitektur tiga service OMS — catalog, order, dan notification — beserta pemilik data masing-masing, dan menuliskan keputusan penting ke dalam Architectural Decision Record (ADR) agar bisa dipahami orang yang datang setelahmu.'
  ],
  objectives: [
    'Menjelaskan alasan sah memecah service: domain, skala tim, dan siklus rilis',
    'Menentukan service boundary lewat bounded context dan pemilik data',
    'Membedakan komunikasi sinkron dan asinkron beserta konsekuensinya',
    'Mengenali partial failure, fallacies of distributed computing, dan distributed monolith',
    'Menulis Architectural Decision Record untuk keputusan arsitektur penting'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Kenapa Memecah Service?</h3><p>Tiga alasan berikut layak menjadi dasar pemecahan, dan ketiganya berasal dari tekanan nyata bukan dari selera pribadi:</p><ul><li><b>Domain</b> — dua bagian aplikasi punya bahasa berbeda dan aturan berbeda. Di OMS, "produk" di katalog (nama, harga, stok) dan "baris pesanan" di order (snapshot harga saat pembelian) adalah dua hal yang kebetulan namanya sama. Dua bounded context seperti ini kandidat kuat untuk dipisah.</li><li><b>Skala tim</b> — timmu sudah lebih dari delapan sampai dua belas orang dan semua mengedit satu repository, saling menunggu merge. Satu service per tim mengembalikan kecepatan; setiap tim memilih stack dan jadwal rilisnya sendiri.</li><li><b>Siklus rilis</b> — bagian notifikasi ingin rilis tiap hari, bagian katalog hanya perlu sebulan sekali, tetapi keduanya terpaksa naik versi bersama. Memisahkan mengakhiri konvoi rilis yang memaksa semua orang ikut.</li></ul><p>Sebaliknya, alasan "microservices itu modern" bukan alasan — itu tren. Monolith yang terawat jauh lebih baik daripada sepuluh service yang dikelola orang yang belum siap.</p>'
    },
    {
      type: 'text',
      html: '<h3>Service Boundary dan Bounded Context</h3><p><b>Bounded context</b> adalah alat paling tajam untuk menarik batas service. Caranya: dengarkan bahasa tim. Saat tim katalog dan tim order berbeda pendapat tentang arti kata "produk" dan keduanya sama-sama benar dalam konteksnya, di situ ada dua bounded context. Batas yang baik punya tiga ciri: setiap keputusan bisnis bisa dijawab oleh satu service tanpa berkonsultasi ke service lain, data yang dimiliki service tidak diubah oleh service mana pun selain pemiliknya, dan service bisa dirilis tanpa service lain ikut naik versi.</p><p>Batasi juga jumlah neighbor-nya. Setiap kali satu service memanggil service lain secara sinkron saat request berjalan, kamu menambah satu titik kegagalan. Pertanyakan dengan jujur: bisakah alur ini menunggu lewat pesan asinkron? Bila ya, ambil itu — sebagian besar ketergantungan sinkron sebenarnya hanya kebiasaan.</p>'
    },
    {
      type: 'text',
      html: '<h3>Database per Service dan Konsekuensinya</h3><p>Aturan emas microservices: <b>setiap service memegang sendiri database-nya</b>, dan tidak ada service yang membaca maupun menulis database milik service lain secara langsung. Untuk OMS, artinya catalog memegang <code>catalog_db</code> berisi tabel products, order memegang <code>order_db</code> berisi tabel orders, dan notification memegang miliknya. Bila order butuh data produk, ia bertanya lewat API — bukan lewat JOIN lintas database.</p><p>Konsekuensinya harus kamu terima sadar-sadar: <ul><li><b>Tidak ada join lintas database</b> — laporan yang dulu satu query kini menjadi beberapa panggilan API atau tabel agregat yang kamu materialisasi sendiri.</li><li><b>Data ganda dan dua kebenaran</b> — order menyimpan snapshot nama dan harga produk. Bila harga berubah di katalog, data lama di order tidak ikut berubah — dan itu memang benar untuk riwayat transaksi.</li><li><b>Rekonsiliasi</b> — ketika dua salinan data wajib selaras, kamu butuh mekanisme: event dari pemilik data, atau pekerjaan periodik yang mencocokkan dan memperbaiki selisih.</li></ul></p>'
    },
    {
      type: 'text',
      html: '<h3>API Contract, Sinkron vs Asinkron</h3><p><b>API contract</b> adalah janji bentuk permintaan dan respons yang dipublikasikan service: endpoint, method, status code, dan skema JSON. Kontrak ini hidup sebagai dokumen OpenAPI untuk panggilan HTTP, dan sebagai skema event untuk pesan. Keduanya harus diperbarui secara sadar dan backward-compatible.</p><table><thead><tr><th>Sifat</th><th>Sinkron (HTTP/gRPC)</th><th>Asinkron (RabbitMQ/Kafka)</th></tr></thead><tbody><tr><td>Hasil</td><td>Langsung diketahui pemanggil</td><td>Tertunda, dikonfirmasi lewat status atau event</td></tr><tr><td>Kegagalan</td><td>Menular ke pemanggil saat itu juga</td><td>Tertahan di antrean, diproses ulang</td></tr><tr><td>Cocok untuk</td><td>Validasi produk saat membuat pesanan</td><td>Kirim notifikasi, sinkronisasi data</td></tr><tr><td>Risiko</td><td>Timeout menular, rantai pemanggilan panjang</td><td>Butuh idempotensi dan penanganan duplikat</td></tr></tbody></table>'
    },
    {
      type: 'text',
      html: '<h3>Service Discovery, API Gateway, dan Partial Failure</h3><p>Ketika service berjalan di banyak instance yang berganti-ganti, alamat IP-nya tidak lagi bisa ditulis keras di konfigurasi. <b>Service discovery</b> menyelesaikannya: di lapisan jaringan, DNS cluster dan mekanisme Kubernetes seperti Service dan CoreDNS memberi nama stabil seperti <code>catalog-service.default.svc.cluster.local</code> yang di-resolve ke IP pod yang hidup. Di dalam aplikasi, cukup gunakan nama itu sebagai base URL.</p><p><b>API gateway</b> menjadi pintu tunggal klien: satu domain publik yang meneruskan <code>/products</code> ke catalog-service dan <code>/orders</code> ke order-service, sekaligus tempat memasang TLS, rate limiting, dan autentikasi di satu titik.</p><p>Lalu datang jebakan klasik yang dikenal sebagai <b>fallacies of distributed computing</b>: jaringan itu andal, latency nol, bandwidth tak terbatas, dan semuanya selalu hidup — keempatnya salah. Karena itu setiap panggilan lintas service wajib memiliki <b>timeout budget end-to-end</b>: bila gateway memberi anggaran 5 detik untuk seluruh request, order-service yang memanggil catalog harus memakai anggaran yang lebih kecil — misalnya 2 detik — agar masih tersisa waktu untuk menulis respons gagal yang benar. Anggaran mengalir dari tepi ke inti, selalu menyusut.</p>'
    },
    {
      type: 'text',
      html: '<h3>Distributed Monolith dan Independent Deployment</h3><p><b>Distributed monolith</b> adalah anti-pattern paling mahal: service sudah terpecah menjadi banyak proses, tetapi setiap perubahan kecil tetap memaksa semua service ikut dirilis — karena kontraknya rapuh, versinya saling mengunci, atau semua service bergantung sinkron pada satu sama lain saat request berjalan. Kamu menanggung seluruh biaya jaringan tanpa mendapat satu pun manfaat pemisahan. Tanda-tandanya: rilis selalu berkonvoi, deploy satu service memerlukan koordinasi tiga tim, dan ada tim yang menolak menambah field baru pada API-nya karena takut merusak pemanggil.</p><p>Kunci penawarnya adalah <b>independent deployment</b> yang dimungkinkan oleh perubahan API yang <b>backward-compatible</b>: bersifat aditif (menambah field baru pada respons, karena klien lama mengabaikannya), tidak pernah mengubah makna field lama, dan bila perlu perubahan inkompatibel dikemas sebagai endpoint baru <code>/v2</code> sambil menjalankan versi lama secara paralel. Konsumen yang mengunci schema justru wajib diuji dengan contract test agar perubahan provider cepat terdeteksi.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Perubahan Aditif yang Aman di Depan',
      lang: 'json',
      output: false,
      code: `// Respons GET /products/42 VERSI LAMA — tetap dikirim apa adanya
{
  "id": 42,
  "name": "Kopi Susu",
  "price": 25000
}

// Respons VERSI BARU — hanya menambah field, tidak ada yang hilang
{
  "id": 42,
  "name": "Kopi Susu",
  "price": 25000,
  "category": "minuman",
  "stock": 120
}`,
      explain: [
        'Klien lama yang hanya mengurai id, name, dan price tetap berfungsi penuh — field tambahan diabaikan begitu saja oleh decoder JSON yang umum.',
        'Yang TIDAK boleh: menghapus field, mengubah tipe (price dari integer ke string), atau mengubah makna (price sebelumnya bruto, kini sudah termasuk pajak).',
        'Bila perubahan harus inkompatibel, buka endpoint baru <code>/v2/products</code> dan jalankan keduanya paralel sampai semua konsumen bermigrasi.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Architectural Decision Record</h3><p>Keputusan arsitektur yang diambil hari ini akan dipertanyakan enam bulan lagi — oleh orang baru, oleh dirimu sendiri, atau oleh tim audit. <b>Architectural Decision Record (ADR)</b> adalah cara paling murah untuk menjawabnya: satu file teks pendek berisi konteks, keputusan, konsekuensi, dan alternatif yang ditolak. Simpan di <code>docs/adr/</code>, beri nomor urut, dan ubah statusnya bila keputusan dibatalkan. Contoh nyatanya untuk OMS:</p>'
    },
    {
      type: 'example',
      title: 'Contoh: ADR-0003 — Validasi Produk lewat REST',
      lang: 'text',
      output: false,
      code: `ADR-0003: order-service memanggil catalog-service lewat REST

Status: Diterima (2026-10-19)

Konteks:
order-service harus memvalidasi keberadaan produk dan
membaca harga sebelum membuat pesanan. Dua opsi dipertimbangkan:
REST sinkron (HTTP) dan pesan asinkron lewat RabbitMQ.

Keputusan:
order-service memanggil GET /products/{id} pada catalog-service
menggunakan HTTP/JSON.

Konsekuensi:
+ Validasi harga dan stok terjadi saat itu juga.
+ Tidak perlu menambah topik dan consumer baru.
- order-service kini bergantung pada ketersediaan catalog.
  Mitigasi: timeout 2 detik, retry terbatas, circuit breaker.
- Harga harus disimpan sebagai snapshot di order_db.

Alternatif yang ditolak:
- Query langsung ke catalog_db: melanggar database ownership.
- Validasi lewat event asinkron: pengguna tidak langsung tahu
  pesanan ditolak; cocok untuk use case yang berbeda.`,
      explain: [
        'Status (proposed, accepted, superseded) membuat pembaca tahu apakah keputusan ini masih berlaku.',
        'Bagian alternatif yang ditolak paling sering dibutuhkan: tanpanya, orang baru akan mengusulkan ulang opsi yang sudah dipikir matang dan ditolak.',
        'Konsekuensi negatif tidak disembunyikan — justru dicatat lengkap dengan mitigasinya, agar semua pihak tahu risiko yang diterima.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan: Merancang Arsitektur OMS</h3><p>Tugasmu: tarik batas tiga service, tentukan siapa pemilik data apa, lalu gambar arsitekturnya. Perhatikan diagram berikut sebagai acuan.</p><figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Arsitektur OMS: klien ke API gateway, lalu ke catalog-service, order-service, dan notification-service melalui RabbitMQ"><rect x="300" y="20" width="160" height="50" rx="10" class="u-box"/><text x="380" y="42" class="u-title" text-anchor="middle">Klien</text><text x="380" y="62" class="u-lbl" text-anchor="middle">web / mobile</text><line x1="380" y1="72" x2="380" y2="96" class="u-line" marker-end="url(#u-arrow)"/><rect x="280" y="100" width="200" height="46" rx="10" class="u-hd"/><text x="380" y="128" class="u-title" text-anchor="middle">API Gateway :443</text><line x1="180" y1="148" x2="120" y2="176" class="u-line" marker-end="url(#u-arrow)"/><line x1="380" y1="148" x2="380" y2="176" class="u-line" marker-end="url(#u-arrow)"/><rect x="30" y="180" width="190" height="60" rx="10" class="u-box"/><text x="125" y="204" class="u-title" text-anchor="middle">catalog-service :8081</text><text x="125" y="224" class="u-lbl" text-anchor="middle">products, stok</text><rect x="285" y="180" width="190" height="60" rx="10" class="u-box"/><text x="380" y="204" class="u-title" text-anchor="middle">order-service :8082</text><text x="380" y="224" class="u-lbl" text-anchor="middle">orders, status</text><rect x="540" y="180" width="190" height="60" rx="10" class="u-box"/><text x="635" y="204" class="u-title" text-anchor="middle">notification-service :8083</text><text x="635" y="224" class="u-lbl" text-anchor="middle">email, WhatsApp</text><line x1="477" y1="210" x2="536" y2="210" class="u-dash" marker-end="url(#u-arrow)"/><text x="506" y="198" class="u-lbl" text-anchor="middle">event</text><line x1="224" y1="196" x2="281" y2="196" class="u-line" marker-end="url(#u-arrow)"/><text x="252" y="184" class="u-lbl" text-anchor="middle">REST</text><rect x="30" y="256" width="700" height="34" rx="8" class="u-box"/><text x="380" y="278" class="u-lbl" text-anchor="middle">catalog_db (milik catalog) | order_db (milik order) | RabbitMQ topic oms.events, routing key order.created</text></svg></div><figcaption class="fig-cap"><b>Gambar 6.1</b> — Arsitektur OMS: validasi produk sinkron lewat REST, notifikasi asinkron lewat RabbitMQ.</figcaption></figure><p>Pemilik data yang benar untuk OMS:</p><table><thead><tr><th>Data</th><th>Pemilik</th><th>Alasan</th></tr></thead><tbody><tr><td>products (nama, harga, stok)</td><td>catalog-service</td><td>Satu-satunya tempat stok diubah; order hanya boleh membaca lewat API.</td></tr><tr><td>orders (status, total, snapshot harga)</td><td>order-service</td><td>Siklus hidup pesanan ada di sini; status pending, confirmed, cancelled.</td></tr><tr><td>riwayat notifikasi</td><td>notification-service</td><td>Dibuat dari event OrderCreated; tidak memengaruhi keputusan bisnis lain.</td></tr></tbody></table>'
    },
    {
      type: 'tip',
      title: 'Uji Batas dengan Pertanyaan Ini',
      text: 'Sebelum memfinalisasi sebuah boundary, ajukan tiga pertanyaan: apakah satu keputusan bisnis bisa dijawab tanpa bertanya ke service lain; apakah data di dalamnya tidak pernah ditulis oleh service lain; dan apakah service ini bisa dirilis sendiri tanpa memaksa yang lain ikut. Bila satu saja jawabannya tidak, batas itu kemungkinan ditarik terlalu dekat atau terlalu jauh — sering kali karena tergoda memecah berdasarkan lapisan teknis (semua service pembayaran) alih-alih berdasarkan domain (cart, checkout, billing yang punya bahasa berbeda).'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Jangan pecah service hanya karena kodenya sudah besar. Satu proses yang rapi dengan modular monolith selalu lebih murah untuk dijalankan daripada tiga service yang butuh Docker Compose, message broker, distributed tracing, dan on-call pukul tiga pagi. Pecah saat tekanannya sudah nyata — tim yang saling menunggu, rilis yang memaksa konvoi, atau beban yang tumbuh tak merata — bukan sebelumnya.'
    },
    {
      type: 'vocab',
      items: [
        ['Bounded context', 'Batas domain di mana sebuah istilah punya makna tetap; kandidat alami untuk service boundary.'],
        ['Database per service', 'Prinsip setiap service memegang database sendiri; tidak ada akses langsung ke database milik service lain.'],
        ['API contract', 'Janji bentuk permintaan, respons, dan status code yang dipublikasikan service; hidup sebagai OpenAPI atau skema event.'],
        ['Sinkron vs asinkron', 'Sinkron menunggu hasil langsung (HTTP); asinkron menyerahkan ke antrean dan diproses belakangan (RabbitMQ).'],
        ['Service discovery', 'Mekanisme penemuan alamat service yang berubah-ubah; di Kubernetes ditangani DNS dan Service object.'],
        ['API gateway', 'Pintu tunggal klien menuju banyak service; tempat TLS, routing, rate limiting, dan autentikasi dipasang.'],
        ['Partial failure', 'Kondisi satu bagian sistem gagal sementara bagian lain hidup; khas sistem terdistribusi.'],
        ['Fallacies of distributed computing', 'Anggapan keliru bahwa jaringan andal, cepat, dan selalu tersedia.'],
        ['Timeout budget end-to-end', 'Anggaran waktu total request yang dibagi menyusut dari tepi ke inti rantai pemanggilan.'],
        ['Distributed monolith', 'Anti-pattern: service terpecah tetapi harus selalu dirilis bersama.'],
        ['Independent deployment', 'Kemampuan merilis satu service tanpa memaksa service lain ikut naik versi.'],
        ['ADR', 'Architectural Decision Record: catatan pendek berisi konteks, keputusan, konsekuensi, dan alternatif yang ditolak.']
      ]
    }
  ],
  recap: [
    'Pecah service karena domain yang terpisah, tekanan tim, atau siklus rilis yang berbeda — bukan karena tren.',
    'Bounded context menarik batas lewat bahasa bisnis; setiap service memegang sendiri database-nya dan menerima konsekuensi: tanpa join lintas database, data ganda harus direkonsiliasi.',
    'Sinkron cocok untuk validasi langsung seperti cek produk; asinkron cocok untuk notifikasi — keduanya punya profil kegagalan yang berbeda.',
    'Setiap panggilan lintas service butuh timeout budget end-to-end; tanpa itu, partial failure akan menular dan berujung pada distributed monolith.',
    'Keputusan arsitektur yang penting ditulis sebagai ADR di docs/adr agar konteks dan alasannya tidak hilang bersama pergantian orang.'
  ]
});
