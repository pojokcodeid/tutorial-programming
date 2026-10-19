/* ============================================================
   Pelajaran Microservices — Bab 14: Message Broker & Event
   ============================================================ */
'use strict';

window.MICROSERVICE_LESSONS = window.MICROSERVICE_LESSONS || [];

window.MICROSERVICE_LESSONS.push({
  id: 'message-broker-event',
  title: 'Message Broker: Event, Retry, dan Dead-Letter Queue',
  chapter: 'Operasional & Proyek',
  duration: '14–16 menit',
  intro: [
    'Sampai sejauh ini order-service memanggil catalog-service lewat HTTP — komunikasi <b>sinkron</b>: pengirim berhenti menunggu sampai penerima menjawab. Cara ini tepat bila jawabannya dibutuhkan seketika, seperti memvalidasi produk saat pesanan dibuat. Tapi bayangkan bila setiap order juga harus mengirim email, mendorong notifikasi ke aplikasi, dan mencatat ke data warehouse. Menggantungkan order-service pada ketiga layanan itu berarti kegagalan email menggagalkan pesanan — ketergantungan yang tidak adil.',
    'Solusinya: order-service cukup <b>menerbitkan event</b> "pesanan ini sudah dibuat" ke <b>message broker</b>, lalu melanjutkan hidup. notification-service yang berlangganan event itu mengurus notifikasi dengan kecepatannya sendiri. Pengirim dan penerima tidak saling menunggu, tidak perlu tahu satu sama lain, dan bila penerima sedang mati, pesan menunggu dengan rapi di antrean sampai ia bangun lagi.',
    'Bab ini memakai RabbitMQ di sekitar event <code>OrderCreated</code>: producer di order-service, consumer di notification-service dengan manual ack dan prefetch, strategi retry beserta dead-letter queue, penanganan event duplikat, versioning event, serta perbandingan singkat RabbitMQ dengan Kafka.'
  ],
  objectives: [
    'Membedakan antrean dengan pub/sub dan event dengan command',
    'Menerbitkan event OrderCreated dari order-service ke exchange topic oms.events',
    'Menulis consumer dengan manual acknowledgment dan prefetch (Qos)',
    'Mengonfigurasi dead-letter queue untuk pesan yang gagal diproses',
    'Membuat consumer idempotent dengan tabel processed_events'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Antrean vs Pub/Sub, Event vs Command</h3><p>Dua pasang istilah ini sering tertukar padahal menjawab pertanyaan berbeda. <b>Antrean vs pub/sub</b> menyangkut <i>ke mana pesan pergi</i>: pada antrean klasik, satu pesan dikonsumsi oleh tepat satu worker — cocok untuk tugas yang harus dikerjakan sekali. Pada pub/sub, satu pesan diantar ke <b>semua</b> pelanggan yang berlangganan — cocok bila banyak layanan bereaksi terhadap kejadian yang sama.</p><p><b>Event vs command</b> menyangkut <i>makna pesan</i>: <b>command</b> adalah instruksi "lakukan ini" yang ditujukan ke satu penerima dan mengharapkan hasil — setara dengan memanggil fungsi. <b>Event</b> adalah pengumuman "ini sudah terjadi" tanpa instruksi dan tanpa mengharapkan hasil; penerima menentukan sendiri apa yang harus dilakukan. Pesan <code>OrderCreated</code> adalah event: order-service tidak peduli apakah ada yang mengonsumsinya.</p><table><thead><tr><th></th><th>Command</th><th>Event</th></tr></thead><tbody><tr><td><b>Niat</b></td><td>Minta tindakan</td><td>Umumkan kejadian</td></tr><tr><td><b>Penerima</b></td><td>Tepat satu</td><td>Boleh banyak</td></tr><tr><td><b>Konsekuensi kegagalan</b></td><td>Pengirim peduli (retry, error)</td><td>Pengirim sudah lanjut</td></tr><tr><td><b>Contoh OMS</b></td><td>CancelOrder, SendEmail</td><td>OrderCreated, OrderCancelled</td></tr></tbody></table>'
    },
    {
      type: 'text',
      html: '<p>RabbitMQ berbicara protokol <b>AMQP 0-9-1</b> dan menengahi lewat tiga konsep: <b>exchange</b> menerima pesan dari producer lalu meneruskannya sesuai <b>routing key</b>, <b>queue</b> menyimpan pesan sampai dikonsumsi, dan <b>binding</b> menghubungkan queue ke exchange dengan pola tertentu. OMS memakai <b>exchange bertipe <code>topic</code></b> bernama <code>oms.events</code>: routing key berbentuk titik seperti <code>order.created</code>, dan pola wildcard <code>order.*</code> atau <code>#</code> memungkinkan pelanggan berlangganan sebagian kejadian tanpa mengubah producer sama sekali.</p><figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 220" width="760" role="img" aria-label="Alur pesanan: client memanggil order-service, order-service memvalidasi ke catalog-service lalu menerbitkan event ke exchange oms.events yang diteruskan ke queue notification.orders dan dikonsumsi notification-service"><rect x="20" y="40" width="110" height="50" rx="8" class="u-box"/><text x="75" y="70" class="u-title" text-anchor="middle">Client</text><line x1="130" y1="65" x2="172" y2="65" class="u-line" marker-end="url(#u-arrow)"/><rect x="180" y="40" width="150" height="50" rx="8" class="u-hd"/><text x="255" y="70" class="u-title" text-anchor="middle">order-service</text><line x1="330" y1="65" x2="372" y2="65" class="u-line" marker-end="url(#u-arrow)"/><text x="351" y="53" class="u-lbl" text-anchor="middle">HTTP</text><rect x="380" y="40" width="150" height="50" rx="8" class="u-box"/><text x="455" y="62" class="u-title" text-anchor="middle">catalog-service</text><text x="455" y="80" class="u-lbl" text-anchor="middle">validasi produk</text><line x1="255" y1="90" x2="255" y2="138" class="u-line" marker-end="url(#u-arrow)"/><text x="360" y="118" class="u-lbl" text-anchor="middle">publish order.created</text><rect x="180" y="145" width="150" height="45" rx="8" class="u-hd"/><text x="255" y="165" class="u-title" text-anchor="middle">oms.events</text><text x="255" y="182" class="u-lbl" text-anchor="middle">exchange topic</text><line x1="330" y1="167" x2="372" y2="167" class="u-line" marker-end="url(#u-arrow)"/><text x="351" y="155" class="u-lbl" text-anchor="middle">bind</text><rect x="380" y="145" width="150" height="45" rx="8" class="u-box"/><text x="455" y="165" class="u-title" text-anchor="middle">notification.orders</text><text x="455" y="182" class="u-lbl" text-anchor="middle">queue durable</text><line x1="530" y1="167" x2="572" y2="167" class="u-line" marker-end="url(#u-arrow)"/><text x="551" y="155" class="u-lbl" text-anchor="middle">ack</text><rect x="580" y="145" width="160" height="50" rx="8" class="u-box"/><text x="660" y="167" class="u-title" text-anchor="middle">notification-service</text><text x="660" y="185" class="u-lbl" text-anchor="middle">consumer idempotent</text></svg></div><figcaption class="fig-cap"><b>Gambar 14.1</b> — Order dibuat sinkron lewat HTTP, lalu kejadian "sudah dibuat" diteruskan asinkron ke notifikasi</figcaption></figure>'
    },
    {
      type: 'example',
      title: 'Contoh: Producer — order-service menerbitkan OrderCreated',
      lang: 'go',
      output: false,
      code: `package messaging

import (
    "context"
    "encoding/json"
    "fmt"
    "time"

    amqp "github.com/rabbitmq/amqp091-go"
)

// OrderCreated adalah fakta: pesanan sudah tersimpan di order_db.
type OrderCreated struct {
    SchemaVersion int       \`json:"schema_version"\`
    EventID       string    \`json:"event_id"\`
    OrderID       int64     \`json:"order_id"\`
    CustomerEmail string    \`json:"customer_email"\`
    TotalAmount   int64     \`json:"total_amount"\`
    CreatedAt     time.Time \`json:"created_at"\`
}

type Publisher struct {
    ch   *amqp.Channel
    exch string
}

func NewPublisher(conn *amqp.Connection) (*Publisher, error) {
    ch, err := conn.Channel()
    if err != nil {
        return nil, fmt.Errorf("buka channel: %w", err)
    }
    // Deklaratif: aman dipanggil ulang tiap service start.
    if err := ch.ExchangeDeclare("oms.events", "topic", true, false, false, false, nil); err != nil {
        return nil, fmt.Errorf("deklarasi exchange: %w", err)
    }
    return &Publisher{ch: ch, exch: "oms.events"}, nil
}

func (p *Publisher) OrderCreated(ctx context.Context, evt OrderCreated) error {
    body, err := json.Marshal(evt)
    if err != nil {
        return fmt.Errorf("marshal event: %w", err)
    }
    return p.ch.PublishWithContext(ctx,
        p.exch, "order.created", // exchange, routing key: objek.aksi
        false, false,
        amqp.Publishing{
            ContentType:  "application/json",
            DeliveryMode: amqp.Persistent, // pesan disimpan disk, bukan memori
            MessageId:    evt.EventID,     // kunci deduplikasi di consumer
            Type:         "order.created",
            Timestamp:    time.Now().UTC(),
            Body:         body,
        },
    )
}`,
      explain: [
        'Nama tipe dan seluruh field dibuat <b>di masa lalu</b>: "pesanan sudah dibuat", bukan "buat pesanan". Consumer tidak bisa mengembalikan apa pun — memang begitu rancangannya.',
        '<code>DeliveryMode: amqp.Persistent</code> hanya efektif bila queue dan exchange juga durable; tiga-tiganya harus konsisten agar pesan selamat dari restart broker.',
        '<code>MessageId</code> diisi <code>EventID</code> (UUID yang dibuat sekali saat event terbentuk) — inilah nilai yang dicatat consumer untuk mendeteksi duplikat.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Consumer dengan Manual Ack dan Prefetch</h3><p>Setiap pesan yang dikirim broker berada dalam status <b>unacknowledged</b> sampai consumer memanggil <code>Ack</code>. Bila consumer mati di tengah jalan, broker mendeteksinya dan mengembalikan pesan ke antrean untuk diproses ulang — inilah jaring pengaman utama komunikasi asinkron. Karena itu <b>auto-ack harus selalu <code>false</code></b>: begitu pesan di-Ack, broker boleh membuangnya, dan bila prosesmu crash satu milidetik kemudian, pesan itu hilang selamanya.</p><p>Supaya broker tidak membanjiri satu consumer, pasang <b>prefetch</b> lewat <code>Qos</code>: jumlah pesan yang boleh dikirim tanpa konfirmasi. Nilai kecil seperti 1 mendistribusikan beban paling adil antar worker; nilai 10–50 meningkatkan throughput untuk pemrosesan ringan. Tanpa prefetch, broker mengirim semua pesan ke satu consumer begitu channel terbuka.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Consumer — notification-service memproses OrderCreated',
      lang: 'go',
      output: false,
      code: `package messaging

import (
    "context"
    "encoding/json"
    "fmt"
    "log/slog"
    "time"

    amqp "github.com/rabbitmq/amqp091-go"
)

func RunConsumer(conn *amqp.Connection, handler func(context.Context, OrderCreated) error) error {
    ch, err := conn.Channel()
    if err != nil {
        return fmt.Errorf("buka channel: %w", err)
    }
    defer ch.Close()

    // Maksimal 10 pesan tak terkonfirmasi per channel consumer.
    if err := ch.Qos(10, 0, false); err != nil {
        return fmt.Errorf("set prefetch: %w", err)
    }

    // Posisi ch.Consume: queue, nama consumer (kosong = otomatis), auto-ack (HARUS false), exclusive, noLocal, noWait, args.
    msgs, err := ch.Consume("notification.orders", "", false, false, false, false, nil)
    if err != nil {
        return fmt.Errorf("daftar consumer: %w", err)
    }

    for d := range msgs {
        var evt OrderCreated
        if err := json.Unmarshal(d.Body, &evt); err != nil {
            // Payload rusak: requeue hanya mengulang kegagalan identik.
            slog.Error("payload rusak, kirim ke DLQ", "message_id", d.MessageId, "error", err)
            _ = d.Nack(false, false) // requeue=false
            continue
        }
        ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
        err := handler(ctx, evt)
        cancel()
        if err != nil {
            slog.Warn("pemrosesan gagal, minta kirim ulang",
                "event_id", evt.EventID, "retries", d.Headers["x-retry-count"], "error", err)
            _ = d.Nack(false, true) // requeue=true: broker kirim lagi nanti
            continue
        }
        _ = d.Ack(false) // hanya setelah sukses penuh
    }
    return nil
}`,
      explain: [
        '<code>Qos(10, 0, false)</code> adalah prefetch: broker mengirim paling banyak 10 pesan sebelum menunggu satu di-Ack. Sesuaikan dengan biaya pemrosesan — kirim email 10 sekaligus wajar, memproses video mungkin 1–2.',
        'Dua jalur kegagalan ditangani berbeda: <b>payload rusak</b> di-<code>Nack</code> tanpa requeue karena ulang kali tidak akan memperbaiki JSON yang cacat — ia langsung terdorong ke DLQ oleh broker.',
        '<b>Kegagalan sementara</b> (SMTP down, timeout) di-requeue agar dicoba lagi; batas percobaan ditegakkan lewat header <code>x-retry-count</code> dan TTL pada deklarasi queue. Loop <code>for d := range msgs</code> berjalan selama channel hidup; tutup channel dengan defer saat shutdown agar pesan unacknowledged segera dikembalikan broker.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Retry dan Dead-Letter Queue</h3><p>Requeue tanpa batas berbahaya: pesan yang gagal terus-menerus memutar habis daya consumer dan menutupi antrean sehat di belakangnya. Pola yang lazim: beri <b>TTL</b> pada queue utama dan arahkan pesan yang lewat waktu ke <b>dead-letter exchange (DLX)</b>, sehingga percobaan ulang datang dengan jeda dan pesan yang gagal terus-menerus mendarat di <b>dead-letter queue (DLQ)</b> — antrean "panggung merah" yang dipantau manusia. Prinsipnya sederhana: pesan tidak boleh menghilang, tetapi juga tidak boleh menghabiskan resource tanpa hasil.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Deklarasi queue utama, DLX, dan DLQ',
      lang: 'go',
      output: false,
      code: `// Dipanggil saat notification-service start (deklaratif, aman diulang).
func DeclareTopology(ch *amqp.Channel) error {
    // 1. Exchange khusus untuk pesan mati
    if err := ch.ExchangeDeclare("oms.dlx", "direct", true, false, false, false, nil); err != nil {
        return fmt.Errorf("deklarasi oms.dlx: %w", err)
    }
    // 2. Queue utama: pesan gagal dan lewat TTL diteruskan ke DLX
    args := amqp.Table{
        "x-dead-letter-exchange":    "oms.dlx",
        "x-dead-letter-routing-key": "failed",
    }
    if _, err := ch.QueueDeclare("notification.orders", true, false, false, false, args); err != nil {
        return fmt.Errorf("deklarasi notification.orders: %w", err)
    }
    // 3. DLQ: tanpa argumen dead-letter, sehingga pesan berhenti di sini
    if _, err := ch.QueueDeclare("notification.orders.dlq", true, false, false, false, nil); err != nil {
        return fmt.Errorf("deklarasi DLQ: %w", err)
    }
    // 4. Routing failed -> DLQ
    return ch.QueueBind("notification.orders.dlq", "failed", "oms.dlx", false, nil)
}`,
      explain: [
        'Argumen <code>x-dead-letter-*</code> diberikan pada <b>deklarasi queue</b>, bukan saat publish — broker yang meneruskan pesan ke DLX ketika TTL habis atau consumer memanggil <code>Nack(requeue=false)</code>.',
        'DLQ sengaja dibuat <b>tanpa</b> argumen dead-letter agar pesan tidak diteruskan lagi ke mana pun; di sanalah inspeksi dan pemutusan keputusan (perbaiki data lalu publish ulang, atau buang) dilakukan. Umumkan juga metrik panjang DLQ ke Prometheus: perubahan mendadak pada jumlahnya adalah sinyal awal bahwa ada yang rusak di consumer sebelum pengguna menyadarinya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>At-Least-Once dan Consumer Idempotent</h3><p>RabbitMQ memberi jaminan <b>at-least-once delivery</b>: pesan bisa dikirim lebih dari sekali (requeue saat consumer mati, retry saat timeout), tetapi tidak pernah hilang selama topologi durable. Konsekuensinya tegas — <b>setiap consumer wajib tahan duplikat</b>. Ulangan tersembunyi seperti ini: consumer memproses pesan dengan sukses lalu crash sebelum <code>Ack</code> terkirim; broker mengembalikan pesan yang sama, dan notifikasi email terkirim dua kali ke pelanggan.</p><p>Penawarnya adalah pola <b>inbox/deduplikasi</b>: catat <code>event_id</code> yang sudah diproses dalam tabel <code>processed_events</code> dengan <b>primary key unik</b>, dan lakukan pemeriksaan serta pemrosesan dalam <b>satu transaksi database</b> yang sama. Bila insert ke processed_events tidak menambahkan baris berarti event itu sudah pernah diproses — cukup Ack dan lewat.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Handler idempotent dengan processed_events',
      lang: 'go',
      output: false,
      code: `// Migrasi sekali jalan:
// CREATE TABLE processed_events (event_id text PRIMARY KEY,
//     processed_at timestamptz NOT NULL DEFAULT now());

func (s *Service) HandleOrderCreated(ctx context.Context, evt messaging.OrderCreated) error {
    tx, err := s.db.BeginTx(ctx, nil)
    if err != nil {
        return fmt.Errorf("mulai transaksi: %w", err)
    }
    defer tx.Rollback(ctx) // no-op setelah Commit

    // Kunci deduplikasi: ON CONFLICT DO NOTHING = "kalau sudah ada, diam"
    res, err := tx.ExecContext(ctx,
        "INSERT INTO processed_events (event_id) VALUES ($1) ON CONFLICT DO NOTHING", evt.EventID)
    if err != nil {
        return fmt.Errorf("catat event: %w", err)
    }
    if n, _ := res.RowsAffected(); n == 0 {
        slog.Info("event duplikat, dilewati", "event_id", evt.EventID)
        return nil // consumer akan Ack tanpa efek samping
    }
    if _, err := tx.ExecContext(ctx,
        "INSERT INTO notifications (order_id, channel, recipient, body) VALUES ($1, 'email', $2, $3)",
        evt.OrderID, evt.CustomerEmail, fmt.Sprintf("Pesanan %d sudah kami terima", evt.OrderID),
    ); err != nil {
        return fmt.Errorf("simpan notifikasi: %w", err)
    }
    return tx.Commit() // event tercatat dan notifikasi tersimpan bersamaan
}`,
      explain: [
        'Duplikat dicek dan efek samping dikerjakan dalam transaksi yang sama — tidak ada jendela waktu di mana keduanya bisa berbeda.',
        '<code>ON CONFLICT DO NOTHING</code> membuat baris kedua untuk event_id yang sama gagal diam-diam; <code>RowsAffected</code> menandai apakah ini pengulangan. Bila email benar-benar dikirim di dalam handler, kegagalan setelah commit membuatnya tidak terkirim; kirim email sebagai langkah <i>setelah</i> commit atau terima bahwa pengiriman ulang email lebih baik daripada tidak terkirim.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Versioning Event dan Kaitan dengan Outbox</h3><p>Karena producer dan consumer dirilis terpisah, event yang kamu terbitkan hari ini akan dibaca consumer versi lama dan versi jauh lebih baru. Aturan versioning yang aman: setiap event membawa <b><code>schema_version</code></b> (angka bulat, dimulai dari 1), perubahan yang bersifat <b>tambahan field baru bersifat opsional</b> dianggap kompatibel, sedangkan perubahan makna atau penghapusan field wajib menaikkan versi dan menjalankan consumer agar mendukung dua versi selama masa transisi. Jangan pernah memakai ulang nama field dengan tipe atau makna berbeda — lebih baik buat field baru dan tandai yang lama deprecated.</p><p>Lalu di mana event diterbitkan? Bukan di tengah-tengah logika HTTP begitu saja. Ikuti pola <b>transactional outbox</b> yang sudah dibahas pada bab reliability: baris event ditulis ke tabel <code>outbox</code> <b>dalam transaksi yang sama</b> dengan insert order, lalu <b>relay outbox</b> membacanya dan menerbitkan lewat <code>Publisher.OrderCreated</code> di atas. Dengan begitu order tersimpan berarti event pasti terbit, dan broker yang sedang mati hanya menunda — bukan menghapus — pengiriman.</p>'
    },
    {
      type: 'text',
      html: '<h3>RabbitMQ vs Kafka</h3><p>Keduanya sama-sama memindahkan data antarlayanan, tetapi modelnya berbeda mendasar. RabbitMQ adalah <b>broker pesan</b>: pesan disimpan di queue dan dihapus setelah dikonsumsi. Kafka adalah <b>log ter-partisi</b> yang dirancang seperti database append-only: pesan bertahan lama (berhari-hari atau berminggu-minggu) dan consumer membacanya sendiri-sendiri sesuai offset.</p><table><thead><tr><th>Aspek</th><th>RabbitMQ</th><th>Kafka</th></tr></thead><tbody><tr><td><b>Model</b></td><td>Antrean; pesan dihapus setelah ack</td><td>Log ter-partisi; pesan bertahan sesuai retensi</td></tr><tr><td><b>Konsumsi</b></td><td>Satu consumer per queue (competing consumers)</td><td>Banyak consumer group membaca posisi berbeda</td></tr><tr><td><b>Replay</b></td><td>Terbatas (perlu DLQ/manual)</td><td>Natif: geser offset ke belakang</td></tr><tr><td><b>Keunggulan</b></td><td>Routing fleksibel, pengiriman cepat, mudah dioperasikan</td><td>Throughput sangat tinggi, streaming, ketahanan data</td></tr></tbody></table><p>Untuk OMS dengan beberapa event dan latency penting, RabbitMQ sudah lebih dari cukup dan jauh lebih sederhana dioperasikan. Pertimbangkan Kafka ketika kamu punya <b>puluhan ribu event per detik</b>, membutuhkan <b>replay riwayat</b> (misal membangun ulang materialized view atau melatih ulang model), atau beberapa tim ingin membaca stream yang sama dengan kecepatan masing-masing — itu bukan kebutuhan microservice biasa, tetapi kebutuhan data streaming.</p>'
    },
    {
      type: 'tip',
      title: 'Latihan: Matikan Consumer dan Uji Duplikat',
      text: '<p>Lakukan dua eksperimen di Docker Compose. <b>Pertama</b>: matikan notification-service, lalu buat lima pesanan dan amati <code>rabbitmqctl list_queues name messages</code> — pesan menumpuk dan service kembali menyusul saat dinyalakan. <b>Kedua</b>: kirim event dengan <code>EventID</code> yang sama dua kali (bisa lewat skrip kecil) dan pastikan hanya satu notifikasi tercatat berkat <code>processed_events</code>; lalu uji skenario crash: buat consumer meng-<code>Ack</code> tapi matikan proses sebelum ack terkirim, dan amati pesan dikirim ulang namun tetap tidak menggandakan notifikasi. Terakhir, periksa DLQ: kirim payload JSON yang sengaja rusak dan pastikan pesan mendarat di <code>notification.orders.dlq</code>.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Producer', 'Sisi yang menerbitkan pesan ke broker, di OMS ini order-service.'],
        ['Consumer', 'Sisi yang berlangganan dan memproses pesan, di OMS ini notification-service.'],
        ['Exchange', 'Komponen RabbitMQ yang menerima pesan lalu meneruskannya sesuai tipe dan binding; OMS memakai tipe topic bernama oms.events.'],
        ['Prefetch (Qos)', 'Batas pesan unacknowledged yang boleh dikirim broker ke satu consumer.'],
        ['Dead-letter queue', 'Antrean tujuan pesan yang gagal terus-menerus atau lewat TTL, untuk ditinjau manusia.'],
        ['At-least-once', 'Jaminan pengiriman: pesan bisa berulang tetapi tidak hilang; menuntut consumer idempotent.'],
        ['Idempotent consumer', 'Consumer yang memberi hasil sama walau event yang sama diproses berkali-kali, via tabel processed_events.'],
        ['Schema version', 'Nomor versi struktur event yang membantu consumer menangani perubahan format antar rilis.']
      ]
    }
  ],
  recap: [
    'Command meminta tindakan ke satu penerima; event mengumumkan kejadian tanpa mengharapkan hasil — OrderCreated adalah event.',
    'RabbitMQ meneruskan pesan lewat exchange topic oms.events dengan routing key order.created; durable dan persistent membuat pesan selamat restart.',
    'Consumer memakai auto-ack false, Qos prefetch, Ack hanya setelah sukses, dan Nack dengan requeue yang berbeda untuk kegagalan sementara versus payload rusak.',
    'Dead-letter queue menampung pesan yang gagal terus-menerus sehingga tidak membanjiri worker; panjangnya dipantau sebagai metrik.',
    'At-least-once delivery menuntut consumer idempotent: primary key event_id di processed_events dalam transaksi yang sama dengan efek samping.',
    'Event membawa schema_version, dan pengiriman idealnya lewat transactional outbox sehingga order tersimpan berarti event pasti terbit.'
  ]
});
