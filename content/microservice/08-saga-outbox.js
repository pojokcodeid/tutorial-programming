/* ============================================================
   Pelajaran Microservices — Bab 8: Saga, Outbox, dan Reliability
   ============================================================ */
'use strict';

window.MICROSERVICE_LESSONS = window.MICROSERVICE_LESSONS || [];

window.MICROSERVICE_LESSONS.push({
  id: 'saga-dan-outbox',
  title: 'Saga, Transactional Outbox, dan Reliability',
  chapter: 'Arsitektur Microservices',
  duration: '18–20 menit',
  intro: [
    'Di monolith, membuat pesanan dan mengurangi stok bisa dibungkus satu transaksi database: commit atau rollback bersama. Di microservices, order-service memegang <code>order_db</code> dan catalog-service memegang <code>catalog_db</code> — transaksi ACID tidak lagi membentang dua database. Moment inilah banyak tim menyadari bahwa pemecahan service membawa konsekuensi paling mahal: <b>konsistensi tidak lagi otomatis</b>.',
    'Bab ini membahas dua pilar penyelesaiannya. <b>Saga</b> mengganti transaksi besar dengan urutan langkah lokal plus langkah kompensasi bila terjadi kegagalan — pesanan dibuat pending, stok direservasi, lalu dikonfirmasi; bila reservasi gagal, pesanan ditandai cancelled. <b>Transactional outbox</b> menyelesaikan masalah dual-write: event ditulis ke tabel outbox dalam transaksi yang sama dengan data bisnis, lalu relay mengirimkannya ke RabbitMQ.',
    'Kita lengkapi dengan inbox dan deduplikasi untuk menghadapi at-least-once delivery, token bucket untuk rate limiting dan backpressure, strategi cache invalidation, serta perencanaan failure recovery. Semua contoh memakai Order Management System yang sudah kita bangun sejak bab pertama.'
  ],
  objectives: [
    'Menjelaskan perbedaan konsistensi kuat dan eventual consistency beserta harganya',
    'Merancang saga dengan orchestration, termasuk langkah kompensasi',
    'Menerapkan transactional outbox pada order-service dan relay ke RabbitMQ',
    'Menangani duplikasi pesan dengan inbox dan operasi idempotent',
    'Menerapkan rate limiting sederhana dan memahami backpressure'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Eventual Consistency: Harga dari Kebebasan</h3><p><b>Konsistensi kuat</b> berarti setiap pembacaan melihat hasil terbaru dari setiap tulisan — milik satu database ACID. <b>Eventual consistency</b> berarti setelah tulisan terakhir berhenti, semua salinan data pada akhirnya akan sama; di antaranya masih ada jendela di mana dua service menjawab hal berbeda. Setelah order-service menandai pesanan confirmed, notification-service mungkin baru menerimanya dua detik kemudian. Itu bukan bug — itu kontrak yang kamu pilih sadar-sadar.</p><p>Konsekuensi yang harus kamu rancang: tampilan ke pengguna mungkin menampilkan status lama sesaat, laporan lintas service harus bertoleran terhadap selisih waktu, dan setiap pembacaan yang menentukan keputusan bisnis kritis harus bertanya langsung ke pemilik datanya. Pertanyaan terakhirnya selalu: <i>seberapa buruk bila dua salinan berbeda selama tiga detik?</i> Bila jawabannya "pengguna melihat status pending tiga detik lebih lama, lalu update", eventual consistency adalah pilihan tepat. Bila jawabannya "uang double", kamu butuh langkah lain — seperti unique constraint pada sisi pemilik data.</p>'
    },
    {
      type: 'text',
      html: '<h3>Saga: Transaksi sebagai Urutan Langkah</h3><p><b>Saga</b> menggantikan satu transaksi besar dengan urutan langkah lokal, di mana tiap langkah punya <b>compensating transaction</b> — pengembali yang menghapus efeknya. Bila reservasi stok di catalog gagal, langkah pembuatan order pending dikompensasi dengan menandai order cancelled. Tidak ada rollback sungguhan; hanya pembalasan yang dirancang lebih dulu.</p><p>Dua gaya penyutradaraan: <b>orchestration</b> — satu komponen (biasanya service pemilik alur) memegang urutan langkah dan memanggilnya satu per satu, seperti konduktor; dan <b>choreography</b> — tiap service bereaksi terhadap event dan menerbitkan event baru, tanpa penanggung jawab pusat. Orchestration membuat alur mudah dibaca dan diuji karena urutannya eksplisit; choreography membuat service sangat longgar tetapi alurnya sulit ditemukan saat terjadi masalah. Untuk alur pesanan OMS yang jelas tiga langkah, kita memakai orchestration di order-service.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Orkestrator Saga Pesanan (order-service)',
      lang: 'go',
      output: false,
      code: `package orders

import (
    "context"
    "log/slog"
)

// CreateOrder menjalankan saga: simpan pending, reservasi stok, lalu konfirmasi.
func (s *OrderService) CreateOrder(ctx context.Context, cmd CreateOrderCommand) (*Order, error) {
    order := NewPendingOrder(cmd.CustomerID, cmd.ProductID, cmd.Qty)
    if err := s.orders.Save(ctx, order); err != nil {
        return nil, err
    }
    if err := s.reserveStock(ctx, order); err != nil {
        s.compensate(ctx, order, err)
        return order, err
    }
    if err := s.confirm(ctx, order); err != nil {
        s.compensate(ctx, order, err)
        return order, err
    }
    return order, nil
}

// compensate adalah compensating transaction: membatalkan efek
// langkah yang sudah berjalan dengan menandai order cancelled.
func (s *OrderService) compensate(ctx context.Context, order *Order, cause error) {
    order.Status = StatusCancelled
    order.CancelReason = cause.Error()
    if err := s.orders.Save(ctx, order); err != nil {
        // Kegagalan kompensasi dicatat untuk review manual, jangan ditelan diam-diam.
        slog.Error("kompensasi gagal, perlu review manual", "order_id", order.ID, "error", err)
    }
    slog.Warn("order dibatalkan setelah saga gagal", "order_id", order.ID, "cause", cause)
}`,
      explain: [
        'Order dibuat <code>pending</code> lebih dulu sehingga selalu ada jejak meski langkah berikutnya gagal — inilah kebalikan dari rollback yang menghapus semuanya.',
        '<code>compensate</code> tidak melempar error; kegagalan kompensasi dicatat sebagai insiden karena itulah titik di mana data bisa tidak konsisten, dan <code>CancelReason</code> menyimpan sebabnya agar tim dukungan tidak menebak.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Transactional Outbox: Menyelesaikan Masalah Dual-Write</h3><p>Setelah order dikonfirmasi, order-service harus menerbitkan event <code>OrderCreated</code> ke RabbitMQ (exchange topic <code>oms.events</code>, routing key <code>order.created</code>) agar notification-service mengirim pemberitahuan. Di sinilah jebakan klasik muncul: bila kamu commit ke database lalu publish ke RabbitMQ, ada dua titik gagal — commit sukses tetapi publish gagal (event hilang selamanya), atau publish sukses tetapi commit gagal (event bohong bahwa pesanan ada).</p><p><b>Transactional outbox</b> menghapus jeda itu dengan aturan satu transaksi: tulis baris bisnis DAN baris event ke tabel <code>outbox</code> dalam <b>transaksi database yang sama</b>. Kalau transaksi sukses, event pasti ada di tabel; kalau gagal, keduanya hilang bersama. Publish ke RabbitMQ kemudian dilakukan proses terpisah (relay) yang membaca outbox dan menandai baris sudah terkirim — dengan asumsi at-least-once, karena relay bisa mati di antara publish dan update.</p><pre><code>CREATE TABLE outbox (\n    id           BIGSERIAL PRIMARY KEY,\n    event_type   TEXT        NOT NULL,  -- order.created\n    payload      JSONB       NOT NULL,\n    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),\n    published_at TIMESTAMPTZ            -- NULL = belum terkirim\n);\nCREATE INDEX idx_outbox_pending ON outbox (id) WHERE published_at IS NULL;</code></pre><p>Indeks parsialnya membuat relay hanya membaca baris yang benar-benar belum terkirim, berapa pun besar tabel outbox. Kolom <code>published_at</code> yang masih NULL adalah pembeda transaksi lokal (pasti, dalam satu commit) dari pengiriman jaringan (yang hanya bisa diusahakan at-least-once).</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Menulis Order dan Outbox dalam Satu Transaksi (pgx)',
      lang: 'go',
      output: false,
      code: `func (r *OrderRepo) CreateWithOutbox(ctx context.Context, tx pgx.Tx, order *Order, event OutboxEvent) error {
    if err := tx.QueryRow(ctx,
        \`INSERT INTO orders (customer_id, product_id, qty, status)
         VALUES ($1, $2, $3, $4) RETURNING id\`,
        order.CustomerID, order.ProductID, order.Qty, order.Status).Scan(&order.ID); err != nil {
        return fmt.Errorf("insert order: %w", err)
    }
    if _, err := tx.Exec(ctx,
        \`INSERT INTO outbox (event_type, payload) VALUES ($1, $2)\`,
        event.Type, event.Payload); err != nil {
        return fmt.Errorf("insert outbox: %w", err)
    }
    return tx.Commit(ctx)
}`,
      explain: [
        'Kedua INSERT berada dalam satu <code>tx</code>; bila yang kedua gagal, deferred rollback menghapus yang pertama — janji all-or-nothing terpenuhi.',
        '<code>RETURNING id</code> mengisi ID order hasil insert tanpa query terpisah, dan payload event disiapkan dari data yang sama dengan order sehingga tidak ada perbedaan antara yang tersimpan dan yang dikirim.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh: Relay Outbox dengan FOR UPDATE SKIP LOCKED',
      lang: 'go',
      output: false,
      code: `func (r *OutboxRelay) RunOnce(ctx context.Context) error {
    tx, err := r.db.Begin(ctx)
    if err != nil { return err }
    defer tx.Rollback(ctx) // no-op bila sudah commit
    rows, err := tx.Query(ctx,
        \`SELECT id, event_type, payload FROM outbox
         WHERE published_at IS NULL ORDER BY id LIMIT 50
         FOR UPDATE SKIP LOCKED\`)
    if err != nil {
        return fmt.Errorf("baca outbox: %w", err)
    }
    defer rows.Close()
    var batch []outboxRow
    for rows.Next() {
        var row outboxRow
        if err := rows.Scan(&row.ID, &row.EventType, &row.Payload); err != nil { return err }
        batch = append(batch, row)
    }
    for _, row := range batch {
        err = r.ch.PublishWithContext(ctx, "oms.events", row.EventType, false, false,
            amqp.Publishing{ContentType: "application/json", Body: row.Payload})
        if err != nil { return fmt.Errorf("publish %d: %w", row.ID, err) }
    }
    ids := make([]int64, 0, len(batch))
    for _, row := range batch { ids = append(ids, row.ID) }
    _, err = tx.Exec(ctx, \`UPDATE outbox SET published_at = now() WHERE id = ANY($1)\`, ids)
    if err != nil {
        return err
    }
    return tx.Commit(ctx)
}`,
      explain: [
        '<code>FOR UPDATE SKIP LOCKED</code> membuat banyak relay bisa berjalan paralel tanpa berebut baris yang sama — setiap relay mengambil baris yang belum dikunci.',
        'Bila publish gagal di tengah batch, rollback mengembalikan semua baris ke status belum terkirim; dan karena pembaruan published_at terjadi setelah publish, crash di antaranya menghasilkan pengiriman ulang — itulah alasan consumer wajib idempotent.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Inbox, Deduplikasi, dan At-Least-Once Delivery</h3><p>Broker menjamin <b>at-least-once delivery</b>: lebih baik pesan terkirim dua kali daripada hilang. Konsumsi di notification-service karena itu harus <b>idempotent</b> — memproses dua kali tidak boleh menghasilkan dua email. Pola standarnya adalah <b>inbox</b>: setiap event punya ID unik, dan consumer menyimpan ID itu di tabel inbox dengan primary key pada kolomnya sebelum memproses. Pesan kedua dengan ID sama langsung diabaikan — pelanggaran unique constraint justru menjadi penanda "sudah diproses".</p><p>Beriringan dengan itu, <b>backpressure</b> menjaga consumer tidak tenggelam: prefetch yang wajar pada RabbitMQ membatasi berapa pesan yang dikirim ke satu worker, sehingga bila pemrosesan melambat, pesan menumpuk di broker (yang dirancang untuk itu) bukan di memori aplikasi. Prinsip yang sama berlaku ke hulu: batasi laju permintaan yang diterima, tolak dengan 429 lebih cepat, daripada menerima semuanya lalu kehabisan memori.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Consumer Idempotent dengan Inbox',
      lang: 'go',
      output: false,
      code: `func (h *Handler) handleOrderCreated(ctx context.Context, msg amqp.Delivery) error {
    var event OrderCreatedEvent
    if err := json.Unmarshal(msg.Body, &event); err != nil {
        return err // pesan rusak: kirim ke DLQ, jangan di-ack
    }
    tag, err := h.db.Exec(ctx,
        \`INSERT INTO inbox (message_id, payload) VALUES ($1, $2)
         ON CONFLICT (message_id) DO NOTHING\`,
        msg.MessageId, msg.Body)
    if err != nil { return err }
    if tag.RowsAffected() == 0 {
        slog.Info("duplikat, diabaikan", "message_id", msg.MessageId)
        return nil
    }
    return h.notifier.SendOrderConfirmation(ctx, event)
}`,
      explain: [
        '<code>ON CONFLICT DO NOTHING</code> membuat insert duplikat tidak melempar error; RowsAffected 0 berarti event ini sudah pernah diproses.',
        'ID pesan dari broker (MessageId) dipakai sebagai kunci deduplikasi sehingga pengiriman ulang oleh relay otomatis terdeteksi, sementara pesan rusak tidak di-ack agar diteruskan ke dead-letter exchange.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Rate Limiting dan Cache Invalidation</h3><p><b>Rate limiting</b> melindungi service dari lonjakan yang tidak sehat. Pola paling sederhana adalah <b>token bucket</b>: ember berisi token yang diisi ulang pada laju tetap (misalnya 10 token per detik) dengan kapasitas maksimum (burst 20); setiap permintaan mengambil satu token, dan bila ember kosong permintaan ditolak 429. Sederhana, tanpa state eksternal, dan cocok sebagai lapisan pertahanan pertama di dalam service atau di gateway.</p><p><b>Cache invalidation</b> singkat: cache data produk di order-service mempercepat validasi, tetapi harga yang basi bisa membuat total pesanan salah. Tiga pilihan yang masuk akal: TTL pendek (beberapa detik) yang membatasi besaran kesalahan waktu; invalidasi langsung lewat event <code>product.updated</code> yang diterbitkan catalog-service; atau jangan di-cache sama sekali bila data itu menentukan uang. Pilih berdasarkan konsekuensi salahnya, bukan berdasarkan kecepatannya.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Token Bucket Sederhana',
      lang: 'go',
      output: false,
      code: `type TokenBucket struct {
    mu                  sync.Mutex
    tokens, rate, burst float64 // rate: token per detik
    last                time.Time
}

func NewTokenBucket(rate float64, burst int) *TokenBucket {
    return &TokenBucket{tokens: float64(burst), rate: rate, burst: float64(burst), last: time.Now()}
}

func (b *TokenBucket) Allow() bool {
    b.mu.Lock()
    defer b.mu.Unlock()
    now := time.Now()
    b.tokens += now.Sub(b.last).Seconds() * b.rate // lazy refill
    if b.tokens > b.burst {
        b.tokens = b.burst // ember tidak boleh meluap
    }
    b.last = now
    if b.tokens < 1 {
        return false
    }
    b.tokens--
    return true
}`,
      explain: [
        'Token dihitung ulang berdasarkan waktu yang berlalu (lazy refill) sehingga tidak perlu timer latar yang terus-menerus berjalan.',
        'Pembatasan pada <code>burst</code> mencegah ember menumpuk token selama periode sepi lalu melepas serangan besar sekaligus; mutex menjaga keamanan konkurensinya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Failure Recovery: Merencanakan Sebelum Terjadi</h3><p>Saga dan outbox menunda kegagalan, bukan menghapusnya — sehingga kamu membutuhkan rencana pemulihan yang eksplisit. Tiga komponen minimum: <b>order pending yang kedaluwarsa</b> — job periodik membatalkan pesanan pending yang lebih lama dari, katakanlah, 15 menit, karena artinya saga tidak pernah tuntas; <b>outbox yang macet</b> — alert ketika baris unpublished terlalu tua, karena notifikasi berhenti tanpa ada error yang terlihat; dan <b>consumer yang bolak-balik gagal</b> — pesan yang melebihi ambang percobaan dialihkan ke dead-letter queue beserta alasan kegagalannya untuk ditinjau manusia. Ketiganya adalah bagian dari runbook-mu: bukan kode yang menarik, tetapi justru yang membedakan sistem yang bisa dipercaya pukul tiga pagi dari yang hanya berjalan saat semuanya hijau.</p>'
    },
    {
      type: 'tip',
      title: 'Mulai dari Konsistensi yang Dibutuhkan, Bukan yang Ideal',
      text: 'Sebelum mengadopsi saga penuh, tanyakan dulu apakah kamu benar-benar butuh dua database. Bila langkah-langkah transaksimu masih berada dalam satu bounded context, transaksi lokal yang satu tetap jauh lebih sederhana dan lebih mudah dibenarkan. Pindah ke saga ketika dua langkah benar-benar hidup di dua service dengan pemilik data berbeda — persis seperti pembuatan order di order_db dan reservasi stok di catalog_db pada OMS.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Jangan pernah menulis ke database lalu publish ke broker tanpa outbox — dua titik gagal itu akan menghasilkan event yang hilang atau event bohong, dan keduanya baru ketahuan jauh setelah terjadi. Sebaliknya, jangan juga berpikir outbox membuat semuanya otomatis: relay yang mati, tabel outbox yang tidak pernah dibersihkan, dan consumer yang tidak idempotent adalah tiga kegagalan paling umum pada pola ini. Uji ketiganya secara sadar sebelum menyebut sistemmu handal.'
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Tambahkan langkah ketiga ke saga: memvalidasi metode pembayaran melalui service pembayaran fiktif, lengkap dengan kompensasi bila langkah itu gagal setelah stok direservasi.</li><li>Jalankan dua instans relay secara bersamaan dan amati <code>FOR UPDATE SKIP LOCKED</code> membagi antrean tanpa duplikasi baris.</li><li>Hentikan notification-service selama satu menit, nyalakan kembali, dan pastikan inbox menahan pemrosesan ganda untuk pesan yang dikirim ulang relay.</li><li>Batasi POST /orders ke 5 request per detik dengan token bucket; ukur respons 429 yang dihasilkan saat burst datang.</li></ol>'
    },
    {
      type: 'vocab',
      items: [
        ['Konsistensi kuat', 'Setiap pembacaan melihat hasil tulisan terbaru; milik satu database ACID.'],
        ['Eventual consistency', 'Salinan data menyamakan diri setelah tulisan berhenti; ada jendela selisih yang harus dirancang.'],
        ['Saga', 'Transaksi yang dipecah menjadi langkah lokal berurutan, masing-masing dengan kompensasi.'],
        ['Orchestration', 'Satu komponen mengatur urutan langkah saga dan memanggil tiap service.'],
        ['Choreography', 'Tiap service bereaksi terhadap event dan menerbitkan event baru tanpa penanggung jawab pusat.'],
        ['Compensating transaction', 'Langkah pembalik yang menghapus efek sebuah langkah saga saat alur gagal.'],
        ['Transactional outbox', 'Pola menulis event ke tabel dalam transaksi yang sama dengan data bisnis, lalu relay mengirimkannya.'],
        ['Inbox', 'Tabel konsumen berisi ID pesan yang sudah diproses; primary key-nya menjadi penanda deduplikasi.'],
        ['At-least-once delivery', 'Jaminan broker: pesan bisa terkirim lebih dari sekali, tidak pernah hilang diam-diam.'],
        ['Backpressure', 'Pengendalian laju agar penangan melambat dengan menahan data di broker, bukan kehabisan memori.'],
        ['Token bucket', 'Algoritma rate limiting berbasis ember token yang diisi ulang pada laju tetap dengan batas burst.'],
        ['Dead-letter queue', 'Antrean tujuan pesan yang terus gagal diproses, agar bisa ditinjau secara manual.']
      ]
    }
  ],
  recap: [
    'Database per service menghapus transaksi ACID lintas service; pilih secara sadar antara konsistensi kuat di satu tempat dan eventual consistency dengan kompensasi.',
    'Saga menggantikan rollback dengan compensating transaction; orchestration membuat alur eksplisit dan mudah diuji — cocok untuk alur pesanan OMS.',
    'Transactional outbox menulis event dalam transaksi yang sama dengan data bisnis; relay mengirimkannya ke RabbitMQ secara at-least-once dengan bantuan FOR UPDATE SKIP LOCKED.',
    'Konsumen wajib idempotent: inbox dengan primary key pada message ID membuat pesan ulang tidak menggandakan efek.',
    'Token bucket membatasi laju masuk, backpressure menahan beban di broker, dan rencana recovery (order pending basi, outbox macet, DLQ) menutup celah yang tersisa.'
  ]
});
