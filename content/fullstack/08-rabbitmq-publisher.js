/* ============================================================
   Pelajaran Contoh Fullstack Microservices — Bab 8: RabbitMQ Publisher
   ============================================================ */
'use strict';

window.FULLSTACK_LESSONS = window.FULLSTACK_LESSONS || [];

window.FULLSTACK_LESSONS.push({
  id: 'fs-rabbitmq-publisher',
  title: 'RabbitMQ: Exchange, Routing & Penerbit Event',
  chapter: 'Komunikasi & Event',
  duration: '15 menit',
  intro: [
    'Pesan sudah tersimpan di <code>order_db</code>, tetapi belum seorang pun tahu. Bab ini memasang suara sistem: order-service <b>menerbitkan event</b> <code>order.created</code> ke RabbitMQ, dan notification-service (bab 9) akan mendengarkannya. Keduanya tidak pernah saling mengenal satu sama lain — yang menghubungkan hanyalah kontrak pesan di atas exchange.',
    'Kita akan memahami model RabbitMQ dari sudut pandang PENERBIT lebih dulu: apa itu exchange, mengapa memakai tipe <b>topic</b>, bagaimana routing key bekerja, mengapa pesan ditandai <b>persistent</b>, dan bagaimana deklarasi topologi yang idempoten membuat urutan start container tidak lagi penting.',
    'Di akhir bab pesanan akan benar-benar meninggalkan jejak digital ke RabbitMQ — dan kamu bisa membuktikannya lewat dashboard manajemen di port 15672, bahkan sebelum konsumer menuliskan apa pun.'
  ],
  objectives: [
    'Menjelaskan peran exchange, routing key, queue, dan binding pada topologi TokoKita',
    'Mendeklarasikan topologi topic exchange secara idempoten dari sisi publisher',
    'Menerbitkan event JSON persistent dengan context, MessageId, dan timestamp',
    'Menerapkan prinsip "event gagal tidak menggagalkan transaksi" dengan pencatatan log yang tepat',
    'Memverifikasi event masuk ke RabbitMQ lewat dashboard manajemen dan CLI'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Model RabbitMQ dalam Satu Gambar</h3><p>RabbitMQ punya empat kata yang sering tertukar. Bedakan sekarang: <b>exchange</b> adalah kantor pos tempat penerbit MELEMPAR pesan (penerbit tidak pernah mengirim langsung ke queue); <b>routing key</b> adalah alamat pada amplopnya; <b>queue</b> adalah kotak surat konsumen; <b>binding</b> adalah aturan antre: "kotak surat ini menerima surat dengan alamat sekian".</p><p>Topologi TokoKita dibuat sederhana namun tepat guna: satu exchange <b>topic</b> bernama <code>tokokita.events</code>, satu queue <code>notification.orders</code>, dan satu binding dengan pola <code>order.created</code>. Tipe <code>topic</code> dipilih (bukan <code>direct</code>) karena mendukung pola wildcard <code>order.*</code> atau <code>#</code> — konsumen baru di masa depan (misal notifikasi ke email, pencatatan keuangan) cukup menambah binding sendiri tanpa menyentuh kode penerbit.</p>'
    },
    {
      type: 'example',
      title: 'Topologi pesan TokoKita',
      lang: 'text',
      output: false,
      code: `order-service                          notification-service
(penerbit)                             (konsumen)
     │                                       ▲
     │ Publish                                │ Consume
     │ routing key: "order.created"           │ (autoAck=false)
     ▼                                       │
┌────────────────────────┐    bind    ┌───────┴───────────┐
│ EXCHANGE (topic)       │ "order.*"  │ QUEUE (durable)   │
│ tokokita.events        ├───────────▶│ notification.orders│
└────────────────────────┘            └───────────────────┘

event (JSON) yang mengalir:
  {"event_id":"ord-7-9f2c...", "order_id":7, "customer":"Budi",
   "product":"Kopi Arabika Gayo", "qty":2, "total":170000,
   "created_at":"2026-10-20T09:15:04Z"}

Aturan topic binding:
  "order.created"  → cocok persis
  "order.*"        → cocok "order.created", TIDAK "order.created.failed"
  "#"              → cocok semua (konsumen audit umumnya memakai ini)`,
      explain: [
        'Penerbit TIDAK PERNAH tahu siapa yang menerima — ia cukup melempar ke exchange. Inilah asinkronisme sejati: notification-service boleh mati 10 menit, event tetap menunggu di queue.',
        'Pemisahan <code>event_id</code> (kejadian) dari <code>order_id</code> (entitas) penting: satu pesanan bisa memicu beberapa kejadian berbeda di masa depan (order.created, order.shipped) tanpa bentrok kunci dedup.',
        'Wildcard <code>order.*</code> pada binding konsumen memberi ruang tumbuh: menambah konsumen email cukup menambah binding baru, tanpa mengubah satu baris kode order-service.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Menyiapkan Sisi Penerbit</h3><p>Bagian penerbit sengaja dibuat tipis: satu channel AMQP, deklarasi exchange sekali saat startup, lalu fungsi <code>Publish</code> yang menerima event. Perhatikan bahwa <b>deklarasi exchange dilakukan OLEH penerbit</b> — bukan menunggu konsumen mendahului. Dengan siapa pun boleh mendeklarasikan topologi yang sama (sifat idempoten), urutan start container kehilangan pengaruhnya.</p>'
    },
    {
      type: 'example',
      title: 'Publisher: deklarasi idempoten + PublishWithContext',
      lang: 'go',
      output: false,
      code: `const (
	ExchangeName = "tokokita.events"
	RoutingKey   = "order.created"
)

// New menyiapkan channel sekaligus mendeklarasikan exchange (idempoten:
// deklarasi yang sama berkali-kali aman).
//
// Kegagalan di sini dianggap FATAL: tanpa channel AMQP, order-service tidak
// pernah bisa menerbitkan event. Kegagalan dicatat sebagai log JSON lalu
// proses keluar — keputusan yang sama dengan ketika RabbitMQ tak pernah siap.
func New(conn *amqp.Connection, log *slog.Logger) *Publisher {
	ch, err := conn.Channel()
	if err != nil {
		logx.Fatal(log, "gagal membuka channel AMQP", "galat", err)
	}
	if err := ch.ExchangeDeclare(ExchangeName, "topic", true, false, false, false, nil); err != nil {
		logx.Fatal(log, "gagal mendeklarasikan exchange", "galat", err)
	}
	log.Info("exchange deklarasi", "exchange", ExchangeName, "tipe", "topic",
		"routing_key", RoutingKey)
	return &Publisher{ch: ch}
}

// Publish mengirim satu event order.created dengan batas waktu.
func (p *Publisher) Publish(ctx context.Context, ev Event) error {
	body, err := json.Marshal(ev)
	if err != nil {
		return err
	}
	return p.ch.PublishWithContext(ctx, ExchangeName, RoutingKey, false, false, amqp.Publishing{
		ContentType:  "application/json",
		DeliveryMode: amqp.Persistent, // tahan restart broker
		MessageId:    ev.EventID,
		Timestamp:    time.Now(),
		Body:         body,
	})
}`,
      explain: [
        'Urutan argumen <code>ExchangeDeclare</code>: nama, tipe "topic", durable=true (topologi selamat restart broker), autoDelete=false, internal=false, noWait=false, args=nil. <b>Durable=true pada exchange</b> berpasangan dengan Persistent pada pesan — keduanya harus sama-sama benar agar pesan bertahan restart.',
        'Logger disuntikkan seperti lapisan lain (<code>log *slog.Logger</code>), dan kegagalan memakai <code>logx.Fatal</code> karena <code>slog</code> tidak memiliki <code>Fatalf</code>: baris ERROR tercatat lebih dulu, baru proses keluar dengan kode 1.',
        '<code>PublishWithContext</code> mengikat penerbitan pada context: bila request sudah dibatalkan klien, event ikut batal — tidak ada event yatim untuk pesanan yang bahkan tidak dilihat lagi.',
        '<code>MessageId</code> diisi event_id: konsumen nanti memakainya untuk dedup, dan operator bisa mencari pesan tertentu di dashboard berdasar ID ini.'
      ]
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 255" width="760" role="img" aria-label="Jalur pesan dari penerbit ke exchange topic, cocok dengan binding, masuk queue durable, lalu ditulis ke disk broker karena pesan persistent">
        <defs><marker id="mk-fs08-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs>
        <text x="380" y="30" class="u-lbl" text-anchor="middle">empat lapisan ketahanan: exchange durable · queue durable · pesan persistent · ACK setelah tersimpan</text>
        <text x="185" y="64" class="u-lbl" text-anchor="middle">order.created</text>
        <text x="400" y="64" class="u-lbl" text-anchor="middle">pola order.* cocok</text>
        <text x="588" y="64" class="u-lbl" text-anchor="middle">antre</text>
        <rect x="15" y="75" width="140" height="70" rx="8" class="u-box"/>
        <text x="85" y="100" class="u-title">order-service</text>
        <text x="85" y="122" class="u-lbl" text-anchor="middle">Publish(ctx, ev)</text>
        <rect x="215" y="75" width="155" height="70" rx="8" class="u-hd"/>
        <text x="292" y="100" class="u-title">EXCHANGE (topic)</text>
        <text x="292" y="122" class="u-lbl" text-anchor="middle">tokokita.events</text>
        <rect x="430" y="75" width="135" height="70" rx="8" class="u-box"/>
        <text x="497" y="100" class="u-title">BINDING</text>
        <text x="497" y="122" class="u-lbl" text-anchor="middle">order.* → queue</text>
        <rect x="615" y="75" width="130" height="70" rx="8" class="u-box"/>
        <text x="680" y="100" class="u-title">QUEUE</text>
        <text x="680" y="122" class="u-lbl" text-anchor="middle">notification.orders</text>
        <line x1="155" y1="110" x2="211" y2="110" class="u-line" marker-end="url(#mk-fs08-1)"/>
        <line x1="370" y1="110" x2="426" y2="110" class="u-line" marker-end="url(#mk-fs08-1)"/>
        <line x1="565" y1="110" x2="611" y2="110" class="u-line" marker-end="url(#mk-fs08-1)"/>
        <line x1="680" y1="145" x2="680" y2="172" class="u-line" marker-end="url(#mk-fs08-1)"/>
        <text x="692" y="163" class="u-lbl">tulis</text>
        <rect x="615" y="176" width="130" height="48" rx="8" class="u-hl"/>
        <text x="680" y="197" class="u-title">disk broker</text>
        <text x="680" y="216" class="u-lbl" text-anchor="middle">pesan persistent</text>
        <text x="380" y="245" class="u-lbl" text-anchor="middle">tanpa flag persistent, restart broker = pesan lenyap tanpa jejak dan tanpa error</text>
        </svg></div><figcaption class="fig-cap"><b>Gambar 8.1</b> — Jalur pesan penerbit dan empat lapisan yang menjaganya tetap utuh sampai dikonsumsi</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Pesan Persistent: Bertahan atau Tidak?</h3><p>RabbitMQ menandai setiap pesan dengan tipe pengiriman. Defaultnya <code>Non-persistent</code> — pesan hidup di memori broker dan <b>lenyap</b> bila RabbitMQ restart. Flag <code>amqp.Persistent</code> memerintahkan broker menulis pesan ke disk. Pemilihan ini bukan detail teknis kecil: tanpanya, restart broker di tengah malam berarti notifikasi hilang selamanya, tanpa jejak, tanpa error.</p>'
    },
    {
      type: 'example',
      title: 'Empat lapisan ketahanan pesan TokoKita',
      lang: 'text',
      output: false,
      code: `LAPISAN              PENERAPAN DI TOKOKITA                YANG DIJAMIN
─────────────────────────────────────────────────────────────────────────
1. Exchange durable   ExchangeDeclare(..., durable=true)   Topologi selamat
                                                            restart broker
2. Queue durable      QueueDeclare(..., durable=true)      Antrean (dan
                                                            pesan di dalamnya)
                                                            selamat restart
3. Pesan persistent   amqp.Publishing{DeliveryMode:        Isi pesan ditulis
                     amqp.Persistent}                      ke disk broker
4. Pemrosesan di      Simpan ke MariaDB SEBELUM ACK        Notifikasi tak
   konsumen                                                  hilang di tengah
                                                            jalan (bab 9)

Urutan pemeriksaan saat pesan "hilang":
  1. Apakah exchange & queue durable?   (lihat deklarasi)
  2. Apakah DeliveryMode persistent?    (lihat Publish)
  3. Apakah konsumer sempat ACK?        (lihat log konsumen)
  4. Apakah ada pesan menunggu di queue?→ rabbitmqctl list_queues`,
      explain: [
        'Lapisan 1–3 menjamin pesan SELAMAT di broker; lapisan 4 (bab berikutnya) menjamin pesan tidak hilang di tengah pemrosesan. Keempatnya dibutuhkan bersama — satu saja yang bolong, jaminannya runtuh.',
        'Pesan non-persistent memang 30% lebih cepat — dan itu pilihan wajar untuk data hilang-ganti seperti telemetri. Untuk event transaksi seperti order.created, ketahanan menang atas kecepatan.',
        'Urutan pemeriksaan di atas adalah troubleshooting langkah-demi-langkah yang bisa langsung kamu ikuti ketika notifikasi tidak muncul di produksi.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Kegagalan Penerbitan: Pilihan yang Ditimbang</h3><p>Ada satu titik keputusan krusial yang sering menimbulkan perdebatan: <b>kalau RabbitMQ gagal menerima event, apakah pesanan harus dibatalkan?</b> TokoKita memilih tidak — pesanan tetap disimpan dan dijawab 201, sementara kegagalan penerbitan hanya dicatat di log. Pilihan ini ditimbang, bukan sembrono.</p>'
    },
    {
      type: 'example',
      title: 'Dua pilihan, dua konsekuensi',
      lang: 'go',
      output: false,
      code: `ev := publisher.Event{
	EventID:   "ord-" + strconv.FormatInt(saved.ID, 10) + "-" + randomID()[:8],
	OrderID:   saved.ID,
	Customer:  saved.Customer,
	Product:   saved.Product,
	Qty:       saved.Qty,
	Total:     saved.Total,
	CreatedAt: saved.CreatedAt,
}
if err := a.publisher.Publish(r.Context(), ev); err != nil {
	a.log.Warn("event gagal diterbitkan — notifikasi tertunda",
		"event", publisher.RoutingKey, "event_id", ev.EventID,
		"order_id", saved.ID, "galat", err)
} else {
	a.log.Info("event diterbitkan",
		"event", publisher.RoutingKey, "event_id", ev.EventID, "order_id", saved.ID)
}

writeJSON(w, http.StatusCreated, saved)

/*  Pilihan A — transaksi gagal kalau event gagal (OUTBOX / dua-fase):
      ✓ tidak pernah ada pesanan tanpa notifikasi
      ✗ butuh tabel outbox + poller/relay, kode jauh lebih kompleks

    Pilihan B — TokoKita: pesanan tetap, event dicatat saja:
      ✓ sederhana; pengguna tidak kehilangan pesanan hanya karena
        notifikasi sedang bermasalah
      ✗ bisa ada jeda notifikasi (bahkan hilang) saat RabbitMQ lama mati

    Untuk skala TokoKita, B dipilih — dan KEJUJURANNYA ditulis di log,
    sehingga kegagalan tetap terlihat oleh operator.                  */`,
      explain: [
        'Level <code>WARN</code> (bukan ERROR) bukan hiasan: pesanan memang berhasil, hanya efek sampingnya yang tertunda. Filter <code>podman compose logs --no-log-prefix order-service | jq \'select(.level=="WARN" or .level=="ERROR")\'</code> (jq opsional — pasang lebih dulu; flag --no-log-prefix membersihkan awalan provider supaya tiap baris murni JSON dan bisa dibaca jq) langsung menyisakan kejadian yang layak ditinjau di antara ribuan baris INFO — kejujuran inilah setengah dari pilihan B yang bertanggung jawab.',
        'Atribut <code>event_id</code> membuat kegagalan ini bisa dicocokkan langsung dengan baris konsumen nanti: satu ID yang sama menghubungkan dua service yang tidak pernah saling mengenal.',
        'Pilihan A (transactional outbox) adalah jawaban benar untuk sistem keuangan; ia bukan sekadar "menyimpan di tabel lalu mengirim", tetapi memerlukan relay yang menjamin pengiriman.',
        'Yang menjadikan pilihan B dapat diterima: jangka waktunya TERBATAS — begitu broker pulih, konsumen menyusul; sementara pada pilihan A kegagalan apapun ikut menahan bisnis proses.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Struktur Event sebagai Kontrak</h3><p>Event adalah API tersembunyi: konsumen mem-parsing bentuknya mungkin jauh hari setelah penerbit ditulis (atau oleh tim lain). Karena itu strukturnya dibuat stabil dan bermakna mandiri. Tiga aturan yang dipegang TokoKita bisa menjadi pedoman umum.</p>'
    },
    {
      type: 'example',
      title: 'Tiga aturan kontrak event',
      lang: 'text',
      output: false,
      code: `ATURAN 1 — Bawa data yang cukup, jangan paksa kembali menanya.
  ✓ {"event_id":..., "order_id":7, "customer":"Budi",
     "product":"Kopi Arabika Gayo", "qty":2, "total":170000}
  ✗ {"order_id":7}          → konsumen harus memanggil 2 service untuk
                               menampilkan notifikasi (chattiness)

ATURAN 2 — timestamp SELALU ikut, dalam format RFC 3339.
  "created_at":"2026-10-20T09:15:04Z"
  (bawaan serialisasi time.Time Go) — tidak bergantung jam konsumen.

ATURAN 3 — nama field: kontrak, bukan refleksi nama kolom.
  product_id (snake_case) konsisten; TIDAK pernah diubah nama —
  perubahan nama field = breaking change = konsumen lama rusak.
  Bila perlu tambahan, TAMBAHKAN field baru (tambah aman, ubah berbahaya).`,
      explain: [
        'Aturan 1 yang paling sering dilanggar: "event tipis" terdengar hemat, tetapi memaksa konsumen melakukan N panggilan balik — mengubah asinkronisme menjadi rapat kembali lewat pintu belakang.',
        'Aturan 3 adalah pola evolusi backward-compatible: field lama tidak pernah dihapus/diubah makna; hanya penambahan yang diizinkan. Inilah dasar versioning API pada umumnya.',
        'Snapshot pada aturan 1 konsisten dengan keputusan di tabel orders (bab 3): riwayat yang terbentuk dari event pun harus tetap bermakna walau produk berubah.'
      ]
    },
    {
      type: 'example',
      title: 'Membuktikan event sampai ke RabbitMQ',
      lang: 'bash',
      output: false,
      code: `# 1) Buat pesanan (event diterbitkan saat itu juga)
curl -si -X POST localhost:8082/orders \\
  -H 'Content-Type: application/json' \\
  -H 'Idempotency-Key: mq-001' \\
  -d '{"product_id":1,"qty":2,"customer":"Budi"}'
# perhatikan log order-service — SATU baris JSON per kejadian:
#   {"level":"INFO","msg":"event diterbitkan","service":"order-service",
#    "event":"order.created","event_id":"ord-N-xxxxxxx","order_id":N}
# saring kalau lognya penuh (butuh jq; --no-log-prefix = baris murni JSON):
podman compose logs --no-log-prefix order-service | jq 'select(.msg=="event diterbitkan")'

# 2) Lihat dari dashboard manajemen — buka browser:
#    http://localhost:15672   (tokokita / tokokita-local)
#    - Tab "Exchanges"    → tokokita.events (topic)
#    - Tab "Queues"       → notification.orders
#    - Tab "Queues" → "Get messages" → baca isi pesan langsung
#      (centang "Ack mode: Nack requeue true" agar pesan TIDAK hilang!)

# 3) Atau dari CLI tanpa browser — perintah memakai NAMA SERVICE sehingga
#    berlaku sama pada podman compose maupun podman-compose:
podman compose exec rabbitmq rabbitmqctl list_exchanges name type | grep tokokita
podman compose exec rabbitmq rabbitmqctl list_queues name messages

# 4) Lihat pola routing yang terpasang — catatan: list_bindings memakai
#    flag --vhost ("/"), bukan argumen posisional maupun nama exchange:
podman compose exec rabbitmq rabbitmqctl --no-table-headers list_bindings --vhost / | grep tokokita`,
      explain: [
        'Ack mode <b>reject_requeue_true</b> pada langkah 2 sangat penting: mengambil pesan dengan ack otomatis akan MEMBUANGNYA dari queue (dan konsumen tak pernah melihatnya) — siluman paling umum saat bereksperimen.',
        'Langkah 4 menampilkan binding nyata <code>tokokita.events → notification.orders</code> dengan routing key order.created — bukti topologi tersusun persis seperti rancangan. Dua kesalahan yang sering terjadi: mengoper nama exchange ke <code>list_bindings</code> (itu nama vhost) lalu heran hasilnya kosong; serta menulis <code>list_bindings /</code> tanpa flag — RabbitMQ 3.13 menolaknya dengan usage error, vhost harus lewat <code>--vhost /</code>.',
        'Baris log di langkah 1 bisa dicari kembali kapan pun lewat <code>event_id</code> yang sama — di log notification-service baris konsumennya memakai ID identik.',
        'Bila langkah 3 menunjukkan pesan menunggu tetapi log penerbit menyatakan sukses, periksa urutan: kemungkinan konsumen sudah mengambilnya (bab 9) — dan itu justru berarti seluruh rangkaian bekerja.'
      ]
    },
    {
      type: 'tip',
      title: 'Mulailah Menamai Event Seperti Produk Perangkat Lunak',
      text: 'Nama <code>order.created</code> memakai pola <b>benda.kejadian</b> — sama persis dengan pola yang lazim dipakai webhook Stripe, GitHub, dan Shopify. Kebiasaan ini membuat konsumen potensial langsung paham maknanya, dan mengingatkanmu bahwa event adalah kontrak publik: begitu dipakai konsumen lain, mengganti namanya setara mematikan API yang dipakai orang.'
    },
    {
      type: 'warn',
      title: 'Satu Channel untuk Satu Goroutine, Atau Kunci Channel',
      text: 'amqp.Channel TIDAK aman dipakai bersamaan oleh beberapa goroutine — pesan bisa tercampur atau error aneh muncul di tengah beban. Di TokoKita hal ini tidak terjadi karena hanya satu goroutine HTTP yang menerbitkan, tetapi begitu kamu menambah pengirim paralel, buatlah satu channel per goroutine (koneksi boleh dibagi, channel tidak) — kesalahan klasik yang muncul tepat ketika trafik naik.'
    },
    {
      type: 'vocab',
      items: [
        ['Exchange', 'Titik kirim pesan di RabbitMQ; penerbit selalu mengirim ke exchange, tidak pernah langsung ke queue.'],
        ['Tipe topic', 'Tipe exchange yang mencocokkan routing key dengan pola wildcard (* untuk satu kata, # untuk banyak kata).'],
        ['Routing key', 'Label alamat pada pesan; dicocokkan dengan binding untuk menentukan queue tujuan.'],
        ['Binding', 'Aturan keterhubungan exchange → queue dengan pola routing key tertentu.'],
        ['Durable', 'Sifat exchange/queue yang dibuat ulang oleh broker setelah restart; berpasangan dengan pesan persistent.'],
        ['Persistent (DeliveryMode 2)', 'Penanda pesan yang menyuruh broker menulisnya ke disk — berbeda dari durable yang menyangkut wadahnya.'],
        ['Event-driven', 'Gaya komunikasi di mana pekerjaan dipicu oleh kejadian (event) yang dipublikasikan, bukan panggilan langsung.'],
        ['Transactional outbox', 'Pola dua-fase: tulis event ke tabel outbox dalam transaksi yang sama dengan bisnis data, lalu relay menerbitkannya — jaminan event tak pernah hilang.']
      ]
    }
  ],
  recap: [
    'Penerbit melempar ke EXCHANGE (bukan langsung ke queue): tokokita.events bertipe topic dengan routing key order.created.',
    'Topologi dideklarasikan idempoten oleh penerbit maupun konsumen sehingga urutan start container tidak lagi menentukan keberhasilan.',
    'Ketahanan pesan membutuhkan empat lapisan bersama: exchange durable, queue durable, pesan persistent, dan ACK setelah tersimpan di konsumen.',
    'Kegagalan penerbitan TIDAK membatalkan pesanan (pilihan sadar) — dicatat sebagai baris WARN pada log JSON; transactional outbox adalah jalur upgrade bila kehilangan notifikasi tak bisa ditolerir.',
    'Event adalah kontrak publik: bawa data cukup untuk konsumen mandiri, sertakan timestamp RFC 3339, dan hanya boleh menambah field — tidak pernah mengubah yang sudah ada.'
  ]
});
