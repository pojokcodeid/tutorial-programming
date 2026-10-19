/* ============================================================
   Pelajaran Microservices — Bab 16: Proyek Akhir OMS
   ============================================================ */
'use strict';

window.MICROSERVICE_LESSONS = window.MICROSERVICE_LESSONS || [];

window.MICROSERVICE_LESSONS.push({
  id: 'proyek-akhir-oms',
  title: 'Proyek Akhir: Merangkai Order Management System',
  chapter: 'Operasional & Proyek',
  duration: '15–18 menit',
  intro: [
    'Seluruh seri ini berjalan pada satu sistem yang sama: <b>Order Management System (OMS)</b> — katalog produk, pemesanan, dan notifikasi, masing-masing sebagai service Go dengan database sendiri. Bab ini adalah bab penutup sekaligus peta akhir: arsitektur lengkap yang sudah kamu bangun per bagian, urutan implementasi yang masuk akal bila kamu membangunnya dari nol, runbook troubleshooting untuk masa operasional, serta cara menguji dan mendokumentasikannya supaya proyek ini layak disebut <b>siap produksi</b>, bukan sekadar demo yang berjalan di laptop.',
    'Yang membedakan proyek magang dengan proyek yang dipakai sungguhan bukan jumlah fitur, melainkan tiga hal: kegagalan sudah diperhitungkan sejak awal (timeout, retry, DLQ, idempotency), setiap keputusan arsitektur punya alasan yang tertulis (trade-off dan ADR), dan ketika pukul tiga pagi terjadi masalah ada <b>runbook</b> yang menjelaskan gejala ke tindakan — bukan ke panik.',
    'Gunakan bab ini dua kali: sekali sebagai panduan menyusun urutan implementasi proyek akhirmu, dan sekali sebagai daftar periksa kelulusan sebelum kamu menyebut proyek ini selesai. Semua angka dan konvensi mengikuti OMS yang dipakai sepanjang seri.'
  ],
  objectives: [
    'Menjelaskan alur lengkap create order pada arsitektur OMS dari client sampai notifikasi',
    'Menyusun urutan implementasi proyek dari monorepo hingga dokumentasi',
    'Menangani kejadian operasional umum memakai runbook gejala–penyebab–tindakan',
    'Menjalankan uji performa singkat dengan k6 dan membaca hasilnya',
    'Menuliskan trade-off, batasan, dan kriteria kelulusan proyek'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Arsitektur Lengkap OMS</h3><p>Tiga service, tiga database, satu broker. Setiap service memiliki <b>database ownership</b> yang tegas: catalog-service adalah satu-satunya yang boleh menyentuh <code>catalog_db</code>, order-service satu-satunya yang menulis <code>order_db</code>. Komunikasi sinkron (HTTP) dipakai ketika jawaban dibutuhkan seketika — order-service memvalidasi produk ke catalog-service sebelum order dikonfirmasi. Komunikasi asinkron (RabbitMQ) dipakai untuk efek samping yang boleh tertunda: notifikasi email tidak boleh menggagalkan pesanan.</p><figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 240" width="760" role="img" aria-label="Alur create order: client mengirim POST orders ke order-service yang memvalidasi produk ke catalog-service, menerbitkan event OrderCreated ke exchange oms.events, diteruskan ke queue notification.orders, lalu notification-service mengirim email"><rect x="15" y="35" width="100" height="50" rx="8" class="u-box"/><text x="65" y="57" class="u-title" text-anchor="middle">Client</text><text x="65" y="75" class="u-lbl" text-anchor="middle">JWT</text><line x1="115" y1="60" x2="152" y2="60" class="u-line" marker-end="url(#u-arrow)"/><text x="134" y="48" class="u-lbl" text-anchor="middle">1</text><rect x="160" y="30" width="140" height="60" rx="8" class="u-hd"/><text x="230" y="55" class="u-title" text-anchor="middle">order-service</text><text x="230" y="74" class="u-lbl" text-anchor="middle">:8082 · order_db</text><line x1="300" y1="60" x2="342" y2="60" class="u-line" marker-end="url(#u-arrow)"/><text x="322" y="48" class="u-lbl" text-anchor="middle">2</text><rect x="350" y="35" width="150" height="50" rx="8" class="u-box"/><text x="425" y="57" class="u-title" text-anchor="middle">catalog-service</text><text x="425" y="75" class="u-lbl" text-anchor="middle">:8081 · catalog_db</text><line x1="230" y1="90" x2="230" y2="133" class="u-line" marker-end="url(#u-arrow)"/><text x="330" y="115" class="u-lbl" text-anchor="middle">3 outbox relay: publish order.created</text><rect x="160" y="140" width="140" height="45" rx="8" class="u-hd"/><text x="230" y="160" class="u-title" text-anchor="middle">oms.events</text><text x="230" y="177" class="u-lbl" text-anchor="middle">exchange topic</text><line x1="300" y1="162" x2="342" y2="162" class="u-line" marker-end="url(#u-arrow)"/><text x="322" y="150" class="u-lbl" text-anchor="middle">4</text><rect x="350" y="140" width="150" height="45" rx="8" class="u-box"/><text x="425" y="160" class="u-title" text-anchor="middle">notification.orders</text><text x="425" y="177" class="u-lbl" text-anchor="middle">queue + DLQ</text><line x1="500" y1="162" x2="542" y2="162" class="u-line" marker-end="url(#u-arrow)"/><text x="522" y="150" class="u-lbl" text-anchor="middle">5</text><rect x="550" y="135" width="180" height="55" rx="8" class="u-box"/><text x="640" y="158" class="u-title" text-anchor="middle">notification-service</text><text x="640" y="177" class="u-lbl" text-anchor="middle">:8083 · kirim email</text><line x1="640" y1="192" x2="640" y2="215" class="u-dash" marker-end="url(#u-arrow)"/><text x="640" y="232" class="u-lbl" text-anchor="middle">email ke pelanggan</text></svg></div><figcaption class="fig-cap"><b>Gambar 16.1</b> — Alur create order: satu request HTTP, satu validasi sinkron, satu event asinkron</figcaption></figure>'
    },
    {
      type: 'example',
      title: 'Struktur repository monorepo',
      lang: 'text',
      output: false,
      code: `oms/
├── go.mod                          # module example.com/oms
├── README.md                       # cara menjalankan satu perintah
├── docs/
│   ├── architecture.md             # diagram & keputusan arsitektur
│   ├── api-contracts.md            # kontrak REST + skema event
│   ├── runbook.md                  # gejala -> tindakan
│   └── adr/
│       └── 0001-database-per-service.md
├── services/
│   ├── catalog/
│   │   ├── cmd/catalog/main.go
│   │   ├── internal/handler/
│   │   ├── internal/repository/
│   │   ├── internal/service/
│   │   ├── migrations/
│   │   ├── Dockerfile
│   │   └── handler_test.go
│   ├── order/
│   │   ├── cmd/order/main.go
│   │   ├── internal/handler/
│   │   ├── internal/catalogclient/  # HTTP client + timeout + retry
│   │   ├── internal/outbox/         # transactional outbox + relay
│   │   ├── migrations/
│   │   └── Dockerfile
│   └── notification/
│       ├── cmd/notification/main.go
│       ├── internal/consumer/       # ack, prefetch, dedup
│       └── Dockerfile
├── deploy/
│   ├── compose.yaml                 # catalog-db, order-db, rabbitmq, 3 service
│   └── k8s/                         # manifest per service + ingress
├── scripts/
│   └── smoke.sh                     # healthz, readyz, alur order minimal
└── .github/
    └── workflows/                   # catalog.yml, order.yml, notification.yml`,
      explain: [
        'Satu <b>module</b> (<code>example.com/oms</code>) untuk ketiga service: berbagi paket internal seperti modul event bersama tanpa kehilangan kebebasan merilis per service.',
        'Setiap service berdiri sendiri: <code>cmd/</code> untuk titik masuk, <code>internal/</code> untuk logika yang tidak boleh diimpor luar, <code>migrations/</code> untuk skemanya.',
        'Folder <code>deploy/</code> dan <code>docs/</code> berada di tingkat atas karena menjadi tanggung jawab seluruh sistem, bukan satu service.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Checklist Implementasi Berurutan</h3><p>Urutan di bawah ini disusun agar setiap langkah hanya bergantung pada yang sudah selesai — dan kamu selalu punya sesuatu yang bisa diuji di akhir hari.</p><ol><li><b>Buat monorepo dan module</b> — <code>go mod init example.com/oms</code>, struktur folder seperti di atas, README berisi cara menjalankan meski berisi tulisan sementara.</li><li><b>Bangun catalog-service</b> — CRUD produk di PostgreSQL <code>catalog_db</code>, endpoint <code>/healthz</code> dan <code>/readyz</code>, migration, pagination, serta unit test validasi.</li><li><b>Bangun order-service</b> — buat order dengan header <code>Idempotency-Key</code>, validasi produk lewat HTTP ke catalog-service dengan timeout 2 detik, status pending/confirmed/cancelled, dan penanganan kegagalan downstream.</li><li><b>Sambungkan event</b> — transactional outbox pada transaksi yang sama dengan insert order, relay yang menerbitkan <code>OrderCreated</code> ke <code>oms.events</code>.</li><li><b>Bangun notification-service</b> — konsumsi <code>notification.orders</code> dengan manual ack, prefetch, tabel <code>processed_events</code>, dan routing pesan gagal ke DLQ.</li><li><b>Docker Compose</b> — catalog-db, order-db, rabbitmq, ketiga service; satu perintah <code>docker compose up</code> membentuk sistem utuh.</li><li><b>JWT dan RBAC</b> — login menerbitkan JWT (golang-jwt/jwt/v5), middleware memverifikasi signature dan expiry, role admin boleh mengelola produk, role customer hanya membuat order.</li><li><b>Logging terstruktur</b> — log/slog dengan request ID yang di-propagasi lintas service, token dan password tidak pernah masuk log.</li><li><b>Pengamatan</b> — metrik RED per endpoint ke Prometheus, dashboard Grafana, distributed trace OpenTelemetry dari order-service ke catalog-service.</li><li><b>CI/CD</b> — workflow GitHub Actions per service: gofmt, vet, test, build image bertag SHA, deploy dev, smoke test.</li><li><b>Pengujian dan dokumentasi</b> — unit, integration (container database), dan contract test untuk kontrak REST serta skema event; lalu architecture.md, sequence diagram, runbook, dan dokumentasi trade-off.</li></ol>'
    },
    {
      type: 'example',
      title: 'Contoh: Docker Compose yang menyatukan seluruh stack',
      lang: 'yaml',
      output: false,
      code: `name: oms

services:
  catalog-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: catalog_db
      POSTGRES_USER: catalog
      POSTGRES_PASSWORD: catalog-local
    volumes:
      - catalog-data:/var/lib/postgresql/data

  order-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: order_db
      POSTGRES_USER: order
      POSTGRES_PASSWORD: order-local
    volumes:
      - order-data:/var/lib/postgresql/data

  rabbitmq:
    image: rabbitmq:3.13-management-alpine
    ports:
      - "15672:15672"        # dasbor management untuk memantau

  catalog:
    build: ./services/catalog
    environment:
      HTTP_PORT: "8081"
      DB_HOST: catalog-db
      DB_USER: catalog
      DB_PASSWORD: catalog-local
    ports:
      - "8081:8081"
    depends_on:
      catalog-db:
        condition: service_healthy   # tunggu pg_isready, bukan sekadar start

  order:
    build: ./services/order
    environment:
      HTTP_PORT: "8082"
      DB_HOST: order-db
      DB_USER: order
      DB_PASSWORD: order-local
      CATALOG_URL: http://catalog:8081
      AMQP_URL: amqp://guest:guest@rabbitmq:5672/
    ports:
      - "8082:8082"
    depends_on:
      order-db:
        condition: service_healthy
      rabbitmq:
        condition: service_started

  notification:
    build: ./services/notification
    environment:
      AMQP_URL: amqp://guest:guest@rabbitmq:5672/
    depends_on:
      rabbitmq:
        condition: service_started

volumes:
  catalog-data:
  order-data:`,
      explain: [
        'Dua database dipisah tegas — <code>catalog-db</code> dan <code>order-db</code> — sebagai cerminan database ownership: bahkan di Compose, tidak ada service yang menghubungi database milik layanan lain.',
        '<code>depends_on</code> dengan <code>condition: service_healthy</code> mencegah service start sebelum database siap; syaratnya kamu menambahkan blok <code>healthcheck</code> berbasis <code>pg_isready</code> di masing-masing database.',
        'Kredensial di atas hanya untuk lingkungan belajar; di staging dan produksi gunakan Docker secrets atau secret manager, dan jangan pernah menaruh nilai asli di repository.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Runbook Troubleshooting</h3><p>Runbook adalah bagian dari proyek, bukan catatan sampingan. Ia menghubungkan <b>gejala yang terlihat</b> dengan <b>tindakan yang sudah dipikirkan sebelumnya</b> — sehingga diagnosis dimulai dari hipotesis, bukan dari panik.</p><table><thead><tr><th>Gejala</th><th>Kemungkinan penyebab</th><th>Tindakan</th></tr></thead><tbody><tr><td><b>Timeout antar service</b> (order gagal saat validasi produk)</td><td>catalog-service tidak ready, tidak ada timeout di http.Client, atau DNS service bermasalah</td><td>Cek <code>/readyz</code> catalog; pastikan client memakai <code>context.WithTimeout</code> 2 detik; baca trace untuk melihat di segmen mana menggantung; bila perlu aktifkan retry dengan backoff</td></tr><tr><td><b>DLQ menumpuk</b></td><td>Kode consumer rusak setelah rilis, dependency (SMTP/API notifikasi) down, atau payload lama tidak kompatibel</td><td>Baca isi DLQ; bila sementara, perbaiki dependency lalu publish ulang; bila karena kode, rollback versi consumer; pasang alert pada panjang DLQ</td></tr><tr><td><b>p95 latency naik</b> tanpa perubahan trafik</td><td>Query tanpa index setelah data tumbuh, CPU throttling karena limits terlalu kecil, atau pool koneksi habis</td><td><code>EXPLAIN ANALYZE</code> query lambat; cek throttling di dashboard resource; bandingkan p95 dengan p99 untuk membedakan kemacetan umum vs ekor panjang</td></tr><tr><td><b>Migration gagal</b> di pipeline</td><td>Tabel terkunci oleh transaksi lama, atau perubahan tidak kompatibel dengan versi pod yang masih berjalan</td><td>Cek <code>pg_stat_activity</code>; kembalikan ke pola expand–contract; jalankan migration sebagai langkah terpisah sebelum deploy kode, bukan saat start aplikasi</td></tr><tr><td><b>Consumer tidak menerima pesan</b></td><td>Binding salah, queue dibuat di vhost berbeda, prefetch terlalu kecil, atau auto-ack salah diset true lalu pesan hilang</td><td><code>rabbitmqctl list_queues</code> untuk melihat antrean dan pesan; periksa binding di dasbor management; pastikan <code>Qos</code> dan auto-ack false; verifikasi deklarasi topology identik antarversi</td></tr></tbody></table>'
    },
    {
      type: 'example',
      title: 'Contoh: Uji performa singkat dengan k6',
      lang: 'bash',
      output: false,
      code: `# Smoke test singkat: selalu jalankan sebelum dan sesudah rilis
k6 run --env BASE_URL=http://dev.example.com scenarios/smoke.js

# Pengujian beban menuju puncak harian: 10 menit, hasil disimpan
k6 run --duration 10m --vus 50 \\
  --out json=results/load-$(date +%Y%m%d).json scenarios/load.js

# Ambil angka untuk laporan: p95 dan error rate
jq '.metrics.http_req_duration.values["p(95)"]' results/load-*.json
jq '.metrics.http_req_failed.values.rate' results/load-*.json`,
      explain: [
        'Ukur dua skenario berbeda: <b>alur order utama</b> (POST /orders dengan Idempotency-Key) dan <b>baca katalog</b> (GET /products) — bottleneck sering berbeda antara keduanya.',
        'Jalankan pengujian terhadap environment yang identik produksi (compose penuh dengan broker dan database), bukan mock — bagian mahal justru di integrasinya.',
        'Cara membaca, menyimpan baseline, dan memasang threshold sebagai gerbang pipeline dibahas tuntas di materi <b>Grafana k6</b> pada aplikasi ini — manfaatkan bila kamu ingin memperdalam sisi pengujian performa.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Dokumentasi Trade-off dan Batasan</h3><p>Tidak ada arsitektur tanpa kompromi; yang membedakan proyek profesional adalah komprominya <b>ditulis dan dipertanggungjawabkan</b>. Simpan sebagai <b>ADR (Architectural Decision Record)</b> singkat di <code>docs/adr/</code>: konteks, keputusan, alternatif yang ditolak, dan konsekuensi. Contoh untuk OMS: (1) <i>Database per service</i> — mengorbankan JOIN lintas domain demi kebebasan rilis dan skala per tim; query laporan memakai konsumsi event, bukan join. (2) <i>Transactional outbox</i> — menambah tabel dan komponen relay demi jaminan "order tersimpan berarti event terbit" tanpa distributed transaction dua fase. (3) <i>RabbitMQ, bukan Kafka</i> — volume event masih ratusan per menit; Kafka dipertimbangkan bila butuh replay riwayat atau ratusan ribu event per detik. (4) <i>Idempotency-Key pada POST /orders</i> — klien bertanggung jawab mengirim kunci yang sama saat retry, sesuai pola REST.</p><p>Batasan yang jujur juga wajib dicatat: notifikasi bersifat <b>eventual</b> (bisa tertunda beberapa detik saat consumer pulih), tidak ada refund otomatis (order gagal ditandai cancelled dan menunggu proses manual), retensi DLQ dibatasi agar tidak tumbuh tanpa batas, dan HA database belum diaktifkan pada lingkungan demo. Menulis batasan bukan mengakui kelemahan — ia melindungi pembaca berikutnya dari mengasumsikan sesuatu yang tidak pernah dirancang.</p>'
    },
    {
      type: 'text',
      html: '<h3>Kriteria Kelulusan</h3><p>Proyek dianggap selesai bila seluruh butir berikut terpenuhi dan dapat dibuktikan, bukan sekadar diyakini:</p><ul><li><b>Reproduksi</b> — pengguna baru menjalankan <code>git clone</code> lalu <code>docker compose up</code> dan seluruh sistem hidup tanpa langkah manual tersembunyi.</li><li><b>Teruji otomatis</b> — <code>go test -race ./...</code> hijau di CI; ada integration test dengan database nyata dan contract test untuk kontrak REST serta skema event.</li><li><b>Tahan kegagalan yang direncanakan</b> — matikan catalog-service saat membuat order, pesanan tetap aman dengan respons error yang jelas; matikan notification-service, pesan menumpuk lalu menyusul; kirim event duplikat, notifikasi tidak ganda.</li><li><b>Teramati</b> — dashboard Grafana menampilkan request rate, error rate, dan p95 lintas service; trace satu order dapat ditelusuri dari order-service ke catalog-service.</li><li><b>Dirilis otomatis</b> — pipeline CI/CD menguji, membangun image bertag SHA, mendeploy ke dev, dan menjalankan smoke test; rollback pernah diuji dan berhasil.</li><li><b>Terdokumentasi</b> — architecture.md, sequence diagram, runbook, API contract, dan minimal satu ADR tersedia serta konsisten dengan kode.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Tips: Bangun Bertahap, Ukur Tiap Tahap',
      text: 'Jangan menumpuk semuanya di akhir minggu. Setiap checklist yang selesai seharusnya diakhiri dengan satu <b>pengujian kegagalan kecil</b>: matikan satu komponen, amati apa yang terjadi, dan pastikan perilakunya sesuai harapan. Sistem yang kamu pahami cara rusaknya adalah sistem yang kamu berani jalankan sungguhan — dan cara terbaik memahaminya adalah membongkarnya sendiri di lingkungan dev, bukan menunggu produksi yang melakukannya untukmu.'
    },
    {
      type: 'vocab',
      items: [
        ['Database ownership', 'Aturan bahwa hanya satu service yang boleh mengakses database miliknya; komunikasi lintas domain lewat API atau event.'],
        ['Idempotency-Key', 'Header yang membuat POST /orders aman diulang: kunci sama menghasilkan order yang sama, bukan duplikat.'],
        ['Transactional outbox', 'Pola menulis event ke tabel outbox dalam transaksi yang sama dengan data bisnis, lalu menerbitkannya lewat relay.'],
        ['Contract test', 'Pengujian bahwa producer dan consumer sepakat soal bentuk pesan dan respons API, tanpa menjalankan seluruh sistem.'],
        ['Runbook', 'Dokumen operasional yang memetakan gejala ke penyebab dan tindakan.'],
        ['ADR', 'Architectural Decision Record: catatan singkat berisi konteks, keputusan, alternatif, dan konsekuensi sebuah pilihan arsitektur.'],
        ['Trade-off', 'Kompromi sadar antara dua nilai (misal konsistensi vs ketersediaan) yang konsekuensinya didokumentasikan.'],
        ['Blast radius', 'Seberapa luas dampak satu kegagalan; dikecilkan oleh batas resource, network policy, dan isolasi database per service.']
      ]
    }
  ],
  recap: [
    'OMS menyatukan tiga service Go dengan komunikasi sinkron HTTP untuk validasi dan asinkron RabbitMQ untuk efek samping, masing-masing dengan database sendiri.',
    'Bangun bertahap: monorepo, catalog, order dengan idempotency, outbox dan event, notification dengan dedup, Compose, keamanan, pengamatan, CI/CD, lalu pengujian dan dokumentasi.',
    'Runbook menghubungkan gejala nyata (timeout, DLQ menumpuk, p95 naik, migration gagal, consumer sepi) dengan penyebab dan tindakan yang sudah dipikirkan sebelumnya.',
    'Uji performa dengan k6 terhadap stack utuh, simpan hasilnya, dan perdalami teknik pengujian pada materi Grafana k6 dalam aplikasi ini.',
    'Dokumentasikan trade-off dan batasan dalam ADR; proyek dinyatakan lulus bila dapat direproduksi, diuji otomatis, tahan kegagalan yang direncanakan, teramati, dirilis otomatis, dan terdokumentasi.'
  ]
});
