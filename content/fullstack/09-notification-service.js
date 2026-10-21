/* ============================================================
   Pelajaran Contoh Fullstack Microservices — Bab 9: Konsumer RabbitMQ
   ============================================================ */
'use strict';

window.FULLSTACK_LESSONS = window.FULLSTACK_LESSONS || [];

window.FULLSTACK_LESSONS.push({
  id: 'fs-notifikasi-konsumer',
  title: 'Notification Service: Konsumer Event & Deduplikasi',
  chapter: 'Komunikasi & Event',
  duration: '16 menit',
  intro: [
    'Bab ini menutup lingkaran event TokoKita: <b>notification-service</b> mendengarkan <code>order.created</code> dari RabbitMQ, menyimpannya sebagai notifikasi di <code>notification_db</code>, lalu menyajikannya ke frontend lewat API polling. Inilah konsumen tunggal yang membuat order-service boleh "melempar dan lupa" tanpa mengorbankan informasi ke pengguna.',
    'Tiga persoalan inti akan kita bahas: bagaimana konsumen menangani pesan dengan <b>ACK manual</b> agar tidak pernah kehilangan data di tengah jalan, mengapa pemrosesan <b>at-least-once</b> justru aman ketika disandingkan dengan deduplikasi <code>event_id</code> UNIQUE, dan bagaimana konsumen bangkit sendiri ketika koneksi broker putus — sikap yang berbeda dari sisi penerbit di bab sebelumnya, yang menyerah (fatal) setelah 30 percobaan.',
    'Di akhir bab seluruh rantai akan teruji: pesanan dibuat → event mengalir → notifikasi tersimpan → API siap dilirik lonceng di bab frontend.'
  ],
  objectives: [
    'Mendeklarasikan topologi exchange + queue + binding dari sisi konsumen secara idempoten',
    'Menerapkan ACK manual dengan urutan yang benar: persist ke database dulu, ACK kemudian',
    'Menggunakan QoS (prefetch) untuk menjaga konsumen agar tidak dibanjiri broker',
    'Menerapkan deduplikasi event_id UNIQUE sebagai jaring pengaman pemrosesan ganda',
    'Membangun loop reconnect yang membuat konsumen bertahan melewati kegagalan broker',
    'Menyusun API notifikasi (daftar + tandai-baca) untuk kebutuhan polling frontend'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Peta Posisi Konsumen</h3><p>notification-service adalah service paling sederhana dari segi bisnis (ia hanya mencatat), tetapi paling kaya pelajaran dari segi operasional. Ia menjalankan dua peran sekaligus: <b>pekerja latar</b> yang mendengarkan queue tanpa henti, dan <b>pelayan API</b> yang menyajikan daftar notifikasi untuk polling frontend.</p><p>Perhatikan perbedaan filosofis dengan bab 8: order-service (penerbit) mencoba broker <b>30 kali dengan jeda 2 detik</b> saat start, lalu menganggapnya <b>fatal</b> — tanpa broker, event tidak akan pernah terbit. notification-service (konsumer) memperlakukan kegagalan broker sebagai <b>hal rutin tanpa batas</b> — selama pesan belum ada yang mengambilnya, queue akan menahannya. Karena itu konsumen tidak pernah menyerah: ia memutar ulang koneksi selama service hidup.</p>'
    },
    {
      type: 'example',
      title: 'Peta konsumsi notification-service',
      lang: 'text',
      output: false,
      code: `order-service                    RabbitMQ                     notification-service
(penerbit)                       (broker)                      (konsumen)
     │                                │                               │
     │ Publish                        │                               │
     │ key "order.created"            │                               │
     ├───────────────────────────────▶│  exchange tokokita.events      │
     │                                │         │ binding "order.created"
     │                                │         ▼                      │
     │                                │  queue notification.orders     │
     │                                │         │  Consume(autoAck=false)
     │                                │         │  Qos(prefetch=10)     │
     │                                │         └──────────────────────▶│
     │                                │                               │ INSERT notifications
     │                                │◀─────── ACK / NACK ────────────┤ (UNIQUE event_id)
     │                                │                               │
     │                                │                               │ GET /notifications
     │                                │                               │◀──── frontend (polling)
Langkah hidup pesan di konsumen:
  delivered → diproses → ACK (tersimpan)  |  NACK+requeue (galat sementara)
                                   NACK tanpa requeue (pesan rusak/salah)`,
      explain: [
        'Konsumen TIDAK mengirim apa pun ke exchange — deklarasinya murni agar topologi tersedia walau konsumen start lebih dulu daripada penerbit (ingat: urutan start tidak penting).',
        'Langkah "delivered → diproses → ACK" adalah inti manual ack: status pesan di broker ditentukan oleh keputusan kode konsumen, bukan oleh pengiriman.',
        'Baris terakhir adalah alur jangka panjang: API baca berjalan terpisah dari loop konsumsi — keduanya dibagi oleh database, bukan oleh memori proses.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Deklarasi Topologi dari Sisi Konsumen</h3><p>Sama seperti penerbit, konsumen mendeklarasikan exchange, queue, dan binding — semuanya idempoten. Perbedaannya hanya pada satu langkah tambahan yang hanya masuk akal di sisi konsumen: <code>QueueDeclare</code>. Queue adalah milik konsumen; ia yang menentukan nama, ketahanan (<code>durable</code>), dan aturan antreannya.</p>'
    },
    {
      type: 'example',
      title: 'once(): hubungkan → deklarasikan → batasi → konsumsi',
      lang: 'go',
      output: false,
      code: `const (
\tExchangeName = "tokokita.events"
\tQueueName    = "notification.orders"
\tBindingKey   = "order.created"
)

// once menjalankan SATU sesi koneksi. Bila fungsi ini kembali (putus),
// pemanggil (Run) akan mencoba menghubungkan ulang.
func once(ctx context.Context, url string, st *store.Store, log *slog.Logger) error {
\tconn, err := amqp.Dial(url)
\tif err != nil {
\t\treturn err
\t}
\tdefer conn.Close()

\tch, err := conn.Channel()
\tif err != nil {
\t\treturn err
\t}
\tdefer ch.Close()

\t// Deklarasi idempoten — sama dengan milik order-service.
\tif err := ch.ExchangeDeclare(ExchangeName, "topic", true, false, false, false, nil); err != nil {
\t\treturn err
\t}
\tq, err := ch.QueueDeclare(QueueName, true, false, false, false, nil)
\tif err != nil {
\t\treturn err
\t}
\tif err := ch.QueueBind(q.Name, BindingKey, ExchangeName, false, nil); err != nil {
\t\treturn err
\t}
\t// Batasi pengiriman: 10 pesan tanpa ACK belum boleh ditambah.
\tif err := ch.Qos(10, 0, false); err != nil {
\t\treturn err
\t}

\tdeliveries, err := ch.Consume(q.Name, "", false, false, false, false, nil)
\tif err != nil {
\t\treturn err
\t}
\tlog.Info("mendengarkan event", "queue", QueueName, "binding", BindingKey)
\t// ... loop deliveries di contoh berikutnya
\t_ = deliveries
\treturn nil
}`,
      explain: [
        'Argumen keempat <code>Consume(..., autoAck, ...)</code> bernilai <b>false</b> — keputusan paling penting di seluruh bab ini: pesan baru hilang dari broker ketika KITA memutuskannya.',
        '<code>Qos(10, 0, false)</code> (prefetch) mencegah broker menyeret seluruh isi antrean ke memori konsumen sekaligus — konsumen kecil diberi jatah 10 pesan yang belum di-ACK, sisanya menunggu di broker.',
        'Pemisahan <code>once</code> (satu sesi) dan <code>Run</code> (siklus ulang) membuat logika reconnect terbaca sebagai perulangan biasa, bukan sebagai keadaan darurat yang berserakan di dalam kode.'
      ]
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 410" width="760" role="img" aria-label="Pohon keputusan konsumen: berhenti tanpa ACK, pesan rusak di-ACK, duplikat di-ACK, galat database di-NACK, sukses di-ACK">
        <defs><marker id="mk-fs09-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs>
        <rect x="270" y="15" width="220" height="40" rx="8" class="u-hd"/>
        <text x="380" y="40" class="u-title">pesan diterima (delivered)</text>
        <line x1="380" y1="55" x2="380" y2="76" class="u-line" marker-end="url(#mk-fs09-1)"/>
        <rect x="270" y="76" width="220" height="42" rx="8" class="u-box"/>
        <text x="380" y="103" class="u-title">service sedang berhenti?</text>
        <line x1="490" y1="97" x2="606" y2="97" class="u-line" marker-end="url(#mk-fs09-1)"/>
        <text x="548" y="89" class="u-lbl" text-anchor="middle">ya</text>
        <rect x="610" y="76" width="140" height="42" rx="8" class="u-hl"/>
        <text x="680" y="95" class="u-title">tinggalkan</text>
        <text x="680" y="113" class="u-lbl" text-anchor="middle">tanpa ACK → requeue</text>
        <line x1="380" y1="118" x2="380" y2="140" class="u-line" marker-end="url(#mk-fs09-1)"/>
        <text x="394" y="134" class="u-lbl">tidak</text>
        <rect x="270" y="140" width="220" height="42" rx="8" class="u-box"/>
        <text x="380" y="167" class="u-title">JSON valid?</text>
        <line x1="490" y1="161" x2="606" y2="161" class="u-line" marker-end="url(#mk-fs09-1)"/>
        <text x="548" y="153" class="u-lbl" text-anchor="middle">tidak</text>
        <rect x="610" y="140" width="140" height="42" rx="8" class="u-hl"/>
        <text x="680" y="159" class="u-title">pesan rusak</text>
        <text x="680" y="177" class="u-lbl" text-anchor="middle">ACK — dibuang</text>
        <line x1="380" y1="182" x2="380" y2="204" class="u-line" marker-end="url(#mk-fs09-1)"/>
        <text x="394" y="198" class="u-lbl">ya</text>
        <rect x="270" y="204" width="220" height="42" rx="8" class="u-box"/>
        <text x="380" y="231" class="u-title">event_id sudah ada?</text>
        <line x1="490" y1="225" x2="606" y2="225" class="u-line" marker-end="url(#mk-fs09-1)"/>
        <text x="548" y="217" class="u-lbl" text-anchor="middle">ya</text>
        <rect x="610" y="204" width="140" height="42" rx="8" class="u-hl"/>
        <text x="680" y="223" class="u-title">duplikat</text>
        <text x="680" y="241" class="u-lbl" text-anchor="middle">ACK tanpa simpan</text>
        <line x1="380" y1="246" x2="380" y2="268" class="u-line" marker-end="url(#mk-fs09-1)"/>
        <text x="394" y="262" class="u-lbl">belum</text>
        <rect x="270" y="268" width="220" height="42" rx="8" class="u-box"/>
        <text x="380" y="295" class="u-title">INSERT ke MariaDB</text>
        <line x1="270" y1="289" x2="164" y2="289" class="u-line" marker-end="url(#mk-fs09-1)"/>
        <text x="217" y="281" class="u-lbl" text-anchor="middle">gagal</text>
        <rect x="15" y="268" width="145" height="42" rx="8" class="u-hl"/>
        <text x="87" y="287" class="u-title">galat database</text>
        <text x="87" y="305" class="u-lbl" text-anchor="middle">NACK, requeue=false</text>
        <line x1="380" y1="310" x2="380" y2="332" class="u-line" marker-end="url(#mk-fs09-1)"/>
        <text x="394" y="326" class="u-lbl">sukses</text>
        <rect x="270" y="332" width="220" height="46" rx="8" class="u-hl"/>
        <text x="380" y="354" class="u-title">ACK</text>
        <text x="380" y="374" class="u-lbl" text-anchor="middle">notifikasi tersimpan</text>
        <text x="380" y="400" class="u-lbl" text-anchor="middle">aturan emas: simpan dulu, ACK kemudian</text>
        </svg></div><figcaption class="fig-cap"><b>Gambar 9.1</b> — Pohon keputusan nasib setiap pesan di konsumen: empat jenis kegagalan, empat tindakan berbeda</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>ACK Manual: Pesan Bertahan Sampai Benar-Benar Aman</h3><p>Ketika <code>autoAck=false</code>, setiap pesan yang dikirim ke konsumen berstatus <b>delivered-but-unacknowledged</b> di broker. Bila konsumen crash sebelum ACK, broker mengirimnya ulang ke konsumen berikutnya (atau ke dirinya sendiri setelah restart). Inilah dasar jaminan <b>at-least-once</b>: tidak ada pesan hilang, meski bisa terjadi dua kali.</p><p>Loop pemrosesan TokoKita memutuskan nasib pesan lewat empat jalur yang berbeda — dan setiap jalur memilih tindakan yang tepat untuk jenis kegagalannya:</p>'
    },
    {
      type: 'example',
      title: 'Empat jalur keputusan pada tiap pesan',
      lang: 'go',
      output: false,
      code: `for d := range deliveries {
\tif ctx.Err() != nil {
\t\t// Sedang berhenti: JANGAN ACK — biar broker kirim ulang nanti.
\t\treturn ctx.Err()
\t}
\tvar ev storeEvent
\tif err := json.Unmarshal(d.Body, &ev); err != nil {
\t\tlog.Warn("pesan rusak — dibuang", "delivery_tag", d.DeliveryTag, "galat", err)
\t\td.Ack(false) // tanpa ACK pesan ini berputar selamanya
\t\tcontinue
\t}
\tmsg := "Pesanan #" + strconv.FormatInt(ev.OrderID, 10) + " untuk " + ev.Customer +
\t\t" (" + ev.Product + " x" + strconv.Itoa(ev.Qty) + ") sudah dikonfirmasi."
\tif err := st.Save(ctx, ev.EventID, ev.OrderID, ev.Customer, msg); err != nil {
\t\tif errors.Is(err, store.ErrDuplicate) {
\t\t\t// Sudah pernah diproses (misal pesan dikirim ulang) → ACK saja.
\t\t\tlog.Info("event duplikat — dilewati",
\t\t\t\t"event", BindingKey, "event_id", ev.EventID, "order_id", ev.OrderID)
\t\t\td.Ack(false)
\t\t\tcontinue
\t\t}
\t\t// Galat database nyata: NACK tanpa requeue agar tidak loop,
\t\t// tapi pesan sudah dicatat broker untuk ditinjau.
\t\tlog.Error("gagal menyimpan notifikasi",
\t\t\t"event_id", ev.EventID, "order_id", ev.OrderID, "galat", err)
\t\td.Nack(false, false)
\t\tcontinue
\t}
\td.Ack(false)
\tlog.Info("notifikasi tersimpan",
\t\t"event", BindingKey, "event_id", ev.EventID, "order_id", ev.OrderID)
}`,
      explain: [
        '<b>Jalur 1 — berhenti (ctx batal)</b>: tanpa ACK, broker menganggap pesan belum diterima dan mengirim ulang setelah konsumen hidup lagi. Tidak ada pekerjaan yang hilang saat shutdown.',
        '<b>Jalur 2 — pesan rusak (JSON tidak valid)</b>: ACK tanpa memproses adalah pilihan sadar; pesan ini TIDAK AKAN PERNAH benar, requeue hanya membuat loop tanpa ujung (poison message).',
        '<b>Jalur 3 — duplikat</b>: ErrDuplicate dari database diterima sebagai keadaan normal (ACK) — inilah yang membuat at-least-once aman.',
        '<b>Jalur 4 — galat database</b>: NACK <code>requeue=false</code> membuang pesan dari antrean aktif tetapi TIDAK membuangnya dari broker (masuk dead-letter bila dikonfigurasi) — berbeda dari poison message yang jelas mustahil diproses.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Deduplikasi: At-Last-Once Jadi Efektif Tersimpan Sekali</h3><p>Karena broker bisa mengirim ulang pesan (crash sebelum ACK, reconnect, timeout), konsumen pasti akan melihat event yang sama lebih dari sekali dalam hidupnya. Tanpa pengaman, pengguna menerima notifikasi ganda untuk satu pesanan.</p><p>Pengawalnya ada di database: kolom <code>event_id</code> dideklarasikan <b>UNIQUE</b> (migrasi 003). Ketika INSERT kedua terjadi dengan event_id yang sama, database menolak dengan galat MySQL 1062, store memetakannya menjadi <code>ErrDuplicate</code>, dan konsumen menganggapnya sebagai "sudah beres" — ACK tanpa menyimpan apa pun. Idempotensi ditegakkan di tempat paling otoritatif: oleh database sendiri.</p>'
    },
    {
      type: 'example',
      title: 'Idempotensi konsumen di tingkat database',
      lang: 'sql',
      output: false,
      code: `-- dari migrations/003_notification.sql
CREATE TABLE IF NOT EXISTS notifications (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    event_id    VARCHAR(64)     NOT NULL,   -- pengenal KEJADIAN (bukan pesanan)
    order_id    BIGINT UNSIGNED NOT NULL,
    customer    VARCHAR(120)    NOT NULL,
    message     VARCHAR(255)    NOT NULL,
    is_read     TINYINT(1)      NOT NULL DEFAULT 0,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_notifications_event (event_id)   -- ← penjaga duplikat
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
      explain: [
        'Bandingkan dengan idempotency key di bab 7: di sana KEJADIAN (permintaan klien) yang diberi pengenal unik; di sini event yang diberi pengenal unik — dua sisi masalah yang sama, satu solusi: UNIQUE constraint.',
        'Pemetaan dilakukan dengan <code>errors.As(err, &me) && me.Number == 1062</code> — nomor galat MySQL spesifik untuk duplicate entry, persis pola yang dipakai order-service.',
        'Strategi ini disebut <b>idempotent consumer</b>: konsumen boleh melihat pesan berkali-kali, tetapi efeknya di database hanya terjadi sekali.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Loop Reconnect: Konsumen yang Tidak Pernah Menyerah</h3><p>Bedakan dua sikap terhadap kegagalan broker: penerbit (bab 8) mencoba <code>waitForAMQP</code> 30 kali dengan jeda 2 detik, lalu memilih <code>logx.Fatal</code> — tanpa broker, event tidak akan pernah terbit. Konsumen memilih <b>memutar ulang tanpa batas</b> — pekerjaannya adalah MENUNGGU, dan queue menahan pesan selama ia pergi. Selama broker pulih dalam hitungan menit (kasus umum restart terjadwal), tidak ada satu pun pesan yang hilang.</p>'
    },
    {
      type: 'example',
      title: 'Run(): siklus hubungkan-ulang tanpa batas',
      lang: 'go',
      output: false,
      code: `// Run menjalankan siklus: hubungkan → deklarasikan topologi → konsumsi.
// Selama ctx belum batal, setiap putus dicoba hubungkan ulang.
func Run(ctx context.Context, url string, st *store.Store, log *slog.Logger) error {
\tfor attempt := 1; ; attempt++ {
\t\tif ctx.Err() != nil {
\t\t\treturn ctx.Err()
\t\t}
\t\terr := once(ctx, url, st, log)
\t\tif ctx.Err() != nil {
\t\t\treturn ctx.Err()
\t\t}
\t\tlog.Warn("koneksi AMQP putus — mencoba ulang dalam 3 detik",
\t\t\t"percobaan", attempt, "galat", err)
\t\tselect {
\t\tcase <-ctx.Done():
\t\t\treturn ctx.Err()
\t\tcase <-time.After(3 * time.Second):
\t\t}
\t}
}

// di main.go — konsumer berjalan di goroutine terpisah:
go func() {
\tif err := consumer.Run(ctx, amqpURL, st, log); err != nil && !errors.Is(err, context.Canceled) {
\t\tlog.Error("konsumer berhenti", "galat", err)
\t}
}()`,
      explain: [
        'Retry di sini TANPA batas — berbeda dengan <code>waitForDB</code>/<code>waitForAMQP</code> di bab 8 (30 percobaan lalu fatal). Perbedaan itu sah: konsumen memang dirancang hidup selama service hidup, dan tiap kegagalan dicatat berurutan sehingga operator tetap melihat masalahnya.',
        'Percobaan di-reset tiap <code>once</code> kembali SUKSES — bila koneksi bertahan lama, angka percobaan tidak lagi membengkak di log.',
        'Mengapa 3 detik, bukan backoff eksponensial? Karena antrian menumpuk selama mati; jeda tetap kecil membuat konsumen kembali mengejar antrean secepat mungkin tanpa menumpuk penalti ganda.'
      ]
    },
    {
      type: 'text',
      html: '<h3>API Notifikasi untuk Lonceng Frontend</h3><p>Bagian kedua service ini adalah API baca yang sangat ringkas — hanya dua endpoint, tetapi dengan satu detail cerdik: jumlah belum-dibaca dikirim sebagai <b>header</b> <code>X-Unread-Count</code> pada respons daftar. Lonceng di header navigasi hanya butuh angka itu; ia tidak perlu menghitung ulang dari ratusan item di klien.</p>'
    },
    {
      type: 'example',
      title: 'Dua endpoint + header ringkas',
      lang: 'go',
      output: false,
      code: `func (a *API) Router() http.Handler {
\tmux := http.NewServeMux()
\tmux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
\t\twriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
\t})
\tmux.HandleFunc("GET /notifications", a.list)
\tmux.HandleFunc("PATCH /notifications/{id}/read", a.markRead)
\t// Middleware logx (bab 4) mencatat tiap request sebagai satu baris JSON;
\t// /healthz di-skip karena dipantau compose tiap 10 detik.
\treturn logx.Middleware(a.log, "/healthz")(mux)
}

func (a *API) list(w http.ResponseWriter, r *http.Request) {
\tlist, err := a.store.List(r.Context())
\tif err != nil {
\t\ta.log.Error("gagal membaca daftar notifikasi", "galat", err)
\t\twriteError(w, http.StatusInternalServerError, "gagal membaca notifikasi")
\t\treturn
\t}
\tif list == nil {
\t\tlist = []store.Notification{} // selalu array, bukan null
\t}
\tunread, err := a.store.UnreadCount(r.Context())
\tif err != nil {
\t\t// Bukan kegagalan fatal: daftar tetap dikirim, hanya angka badge
\t\t// lonceng yang awalnya 0. Tetap dicatat agar tidak diam-diam.
\t\ta.log.Warn("gagal membaca jumlah notifikasi belum dibaca", "galat", err)
\t\tunread = 0
\t}
\tw.Header().Set("X-Unread-Count", strconv.Itoa(unread))
\twriteJSON(w, http.StatusOK, list)
}`,
      explain: [
        'Endpoint memakai pola metode+path Go1.22: <code>PATCH /notifications/{id}/read</code> — metode PATCH dipilih karena perubahan hanya sebagian (satu kolom <code>is_read</code>), bukan penggantian objek penuh (PUT).',
        'Header diisi SEBELUM WriteHeader dipanggil writeJSON — urutan yang sama kritisnya seperti bab 5.',
        'Balasan tandai-baca memakai <code>204 No Content</code>: permintaan berhasil tetapi tidak ada isi yang layak dibalas — frontend cukup menyegarkan daftarnya.',
        'Kegagalan menghitung unread bukan alasan menolak seluruh daftar: badge lonceng boleh awalnya 0, TETAPI kegagalan itu tetap dicatat (log.Warn) — keheningan pada log adalah awal dari hilangnya kepercayaan pada sistem observability.'
      ]
    },
    {
      type: 'example',
      title: 'Uji end-to-end: dari pesanan sampai notifikasi',
      lang: 'bash',
      output: false,
      code: `# Prasyarat: seluruh stack berjalan (podman compose up -d --build).
# Perintah memakai NAMA SERVICE — sama di podman compose & podman-compose.

# 1) Buat pesanan — event harus mengalir dalam hitungan milidetik
curl -s -X POST localhost:8082/orders \\
  -H 'Content-Type: application/json' \\
  -H 'Idempotency-Key: uji-notif-1' \\
  -d '{"product_id":1,"qty":2,"customer":"Budi"}'
sleep 2

# 2) Notifikasi terbaru muncul di paling atas (urutan id DESC)
curl -si localhost:8083/notifications | head -3
curl -s localhost:8083/notifications | head -c 300

# 3) Tandai dibaca → 204, lalu jumlah unread berkurang.
#    Id tidak ditulis mati: ambil dari daftar saat itu juga.
ID=$(curl -s localhost:8083/notifications | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
curl -si -X PATCH localhost:8083/notifications/$ID/read | grep HTTP
curl -si localhost:8083/notifications | grep -i x-unread

# 4) Uji KETAHANAN: matikan konsumer saat ada pesan menunggu
podman compose stop notification-service
curl -s -X POST localhost:8082/orders \\
  -H 'Content-Type: application/json' \\
  -H 'Idempotency-Key: uji-notif-2' \\
  -d '{"product_id":2,"qty":1,"customer":"Siti"}'
podman compose start notification-service
# nginx (frontend) mengingat IP lama container — bila selanjutnya diuji
# lewat localhost:8080, restart frontend sekali agar resolve ulang:
podman compose restart frontend
sleep 3
# → notifikasi Siti muncul: pesan DITAHAN queue selama konsumen mati
curl -s localhost:8083/notifications | grep -c Siti     # → 1 (tidak ganda)

# 5) Jejak log konsumen — nasib tiap pesan sebagai JSON per baris:
podman compose logs notification-service | grep event_id | tail -3
# → "event":"order.created","event_id":"...","order_id":2 — benang penelusur

# 6) Lihat antrian dari dashboard (port 15672 → tab Queues)
#    notification.orders  Ready: 0, Unacked: 0 — bukti semua beres`,
      explain: [
        'Uji 4 adalah pembuktian paling penting: queue benar-benar MENAHAN pesan selama konsumer berhenti — inilah asinkronisme yang dijanjikan di bab 1, dirasakan langsung dengan menghilangkan satu komponen.',
        'Baris <code>grep -c Siti</code> =1 memastikan pengulangan tidak menghasilkan notifikasi ganda walaupun ada kemungkinan pengiriman ulang.',
        'Header <code>X-Unread-Count</code> berkurang setelah PATCH membuktikan hitungan dihitung dari database (sumber kebenaran), bukan dari state sementara frontend.',
        'Id notifikasi diambil dari respons daftar saat itu juga (grep/cut) — menulisnya mati akan membuat langkah 3 rapuh terhadap isi database pembaca.',
        'Uji 5 menyandingkan bukti log dengan bukti data: <code>event_id</code> di baris log konsumen adalah benang yang sama dengan event yang diterbitkan bab 8 — satu kejadian, dua jejak yang bisa dicocokkan.',
        'Nuansa operasional yang mudah membuat panik: <code>compose start</code> memberi container IP BARU, sedangkan nginx membaca DNS sekali saat ia sendiri start — akibatnya localhost:8080 menjawab 504 padahal service di port aslinya sehat. <code>compose restart frontend</code> memaksa nginx resolve ulang; uji langsung ke :8081–:8083 (seperti blok ini) tidak terpengaruh.'
      ]
    },
    {
      type: 'tip',
      title: 'Polling Sederhana Sebelum WebSocket',
      text: 'Frontend TokoKita mengambil notifikasi dengan polling berkala (setiap beberapa detik) — sederhana, bekerja di balik proxy apa pun, dan mudah di-debug. Untuk skala produksi modern, polling 10–30 detik masih sangat wajar; baru ketika butuh real-time milidetik (chat, lelang) WebSocket atau Server-Sent Events menjadi pilihan. Yang penting: <b>interval harus lebih besar daripada durasi minimal antar-panggilan</b>, dan layar yang tidak terlihat sebaiknya berhenti polling (browsers yang menghemat daya akan memperlambatnya otomatis).'
    },
    {
      type: 'warn',
      title: 'Jangan ACK Sebelum Data Tersimpan',
      text: 'Urutan yang benar adalah <b>simpan → ACK</b>. Membaliknya (ACK dulu, simpan kemudian) membuka celah klasik: konsumen crash di sela-sela dua langkah itu, broker menganggap pesan selesai, dan notifikasi hilang selamanya tanpa jejak. Prinsipnya berlaku universal: status "selesai" hanya dicatat setelah pekerjaan sungguhan berhasil — di AMQP maupun di sistem antrean lain.'
    },
    {
      type: 'vocab',
      items: [
        ['Auto-ACK', 'Mode konsumsi di mana broker menganggap pesan selesai begitu dikirim; dipakai TokoKita TIDAK — semua pemrosesan memakai ACK manual.'],
        ['Prefetch / QoS', 'Batas jumlah pesan unacknowledged yang boleh dikirim broker ke satu konsumen; di TokoKita diatur 10 agar konsumen tidak dibanjiri.'],
        ['At-least-once', 'Jaminan bahwa pesan diproses minimal sekali (bisa lebih); dipadukan dengan deduplikasi agar efektifnya tersimpan tepat sekali.'],
        ['Idempotent consumer', 'Pola konsumen yang aman dipanggil berkali-kali untuk kejadian yang sama — dicapai lewat pengenal unik + UNIQUE constraint.'],
        ['Poison message', 'Pesan yang selalu gagal diproses (misal JSON rusak); harus dibuang (ACK) atau dialihkan, bukan di-requeue terus-menerus.'],
        ['NACK / requeue', 'Penolakan eksplisit atas pesan; requeue=true mengembalikannya ke antrean (untuk galat sementara), false membuangnya (untuk galat permanen).'],
        ['Dead-letter queue', 'Tujuan khusus pesan yang dibuang/DLX agar bisa diselidiki nanti; alternatif aman dibanding membuang pesan begitu saja.'],
        ['Reconnect loop', 'Siklus mencoba-ulang koneksi tanpa batas yang membuat konsumer bangkit sendiri setelah broker pulih.'],
        ['X-Unread-Count', 'Header respons berisi jumlah notifikasi belum dibaca — angka ringkas khusus lonceng agar klien tidak menghitung ulang daftar penuh.']
      ]
    }
  ],
  recap: [
    'Konsumen mendeklarasikan exchange + queue + binding secara idempoten, lalu konsumsi dengan autoAck=false dan Qos(prefetch=10).',
    'Urutan wajib: persist ke database dulu, ACK kemudian; galat permanen (pesan rusak/duplikat) di-ACK, galat sementara di-NACK requeue.',
    'Deduplikasi event_id UNIQUE (MySQL 1062 → ErrDuplicate) membuat pengiriman ulang broker aman: efeknya tetap tersimpan sekali.',
    'Konsumen memakai loop reconnect tanpa batas (3 detik) — berbeda dengan penerbit yang menyerah (fatal) setelah 30 percobaan — karena antrian menahan pesan selama konsumen pergi.',
    'API notifikasi hanya GET /notifications (dengan header X-Unread-Count) dan PATCH /notifications/{id}/read — bahan siap pakai untuk lonceng frontend.'
  ]
});
