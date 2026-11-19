/* ============================================================
   Pelajaran Apache Kafka — 25: Proyek Akhir
   ============================================================ */
'use strict';

window.KAFKA_LESSONS = window.KAFKA_LESSONS || [];

window.KAFKA_LESSONS.push({
  id: 'proyek-akhir',
  title: 'Proyek Akhir: Pipeline Pesanan End-to-End',
  chapter: 'Proyek',
  duration: '20 menit',
  intro: [
    'Seluruh pelajaran ini akhirnya bertemu di satu tempat: membangun sistem nyata yang mengalirkan data dari HTTP hingga analitik. Pada proyek akhir ini kamu akan merancang dan mewujudkan <b>pipeline pesanan e-commerce end-to-end</b> — producer menulis pesanan, beberapa consumer bereaksi (pembayaran, stok, notifikasi, analitik), dengan <b>exactly-once di sisi yang kritis</b>, penanganan error, monitoring, dan seluruh keputusan desain yang sudah dipelajari.',
    'Proyek ini dirancang agar setiap keputusan punya <b>alasan yang bisa dijelaskan</b>: mengapa partisi sebanyak itu, mengapa retensi segitu, mengapa outbox, mengapa idempoten. Bagian akhir berisi <b>checklist produksi</b> dan latihan pemeriksaan mandiri untuk mengukur sejauh kamu sudah menguasai materi ini.'
  ],
  objectives: [
    'Merancang topik, key, partition, dan konfigurasi pipeline pesanan yang tepat',
    'Mengimplementasikan producer dan consumer dengan pola outbox, DLT, dan idempotensi',
    'Memasang monitoring, alerting, dan prosedur pemulihan untuk pipeline tersebut',
    'Menilai kesiapan produksi melalui checklist dan latihan pemeriksaan mandiri'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Rancangan sistem</h3><p>Satu skenario yang dipakai sejak Pelajaran 12: pengguna membuat pesanan → pembayaran → pemotongan stok → notifikasi → analitik. Setiap layanan berdiri sendiri, membaca dengan <b>group.id</b>-nya sendiri, dan hanya bertanggung jawab atas reaksinya.</p><ul><li><b>order-service</b> — menerima HTTP, menyimpan ke database + outbox (satu transaksi), relay mengirim ke Kafka.</li><li><b>payment-service</b> — memproses pembayaran, menghasilkan <code>order.paid</code> atau <code>payment.failed</code>.</li><li><b>inventory-service</b> — memangkas stok pada <code>order.paid</code> (idempoten, kunci = order_id).</li><li><b>notification-service</b> — mengirim surel/push pada peristiwa relevan.</li><li><b>analytics-service</b> — membangun projection penjualan per jam (CQRS).</li><li><b>audit-service</b> — menyimpan seluruh peristiwa (retensi panjang).</li></ul>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 350" width="760" role="img" aria-label="Arsitektur proyek akhir pipeline pesanan end-to-end dengan producer, topik, consumer, DLT, dan analitik">
        <rect x="20" y="30" width="170" height="70" rx="8" class="u-hd"/>
        <text x="105" y="58" class="u-title" text-anchor="middle">Client / HTTP</text>
        <text x="105" y="82" class="u-lbl" text-anchor="middle">POST /orders</text>
        <line x1="196" y1="65" x2="240" y2="65" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="246" y="20" width="200" height="90" rx="8" class="u-box"/>
        <text x="346" y="46" class="u-title" text-anchor="middle">order-service</text>
        <text x="346" y="70" class="u-lbl" text-anchor="middle">DB + outbox (1 tx)</text>
        <text x="346" y="94" class="u-lbl" text-anchor="middle">relay/CDC → produce</text>
        <line x1="452" y1="65" x2="496" y2="65" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="502" y="20" width="238" height="200" rx="10" class="u-box"/>
        <text x="621" y="46" class="u-title" text-anchor="middle">Kafka topics</text>
        <line x1="516" y1="56" x2="726" y2="56" class="u-line"/>
        <rect x="516" y="68" width="210" height="34" rx="5" class="u-hd"/>
        <text x="621" y="90" class="u-lbl" text-anchor="middle">order-events (key=order_id, RF=3)</text>
        <rect x="516" y="110" width="210" height="34" rx="5" class="u-box"/>
        <text x="621" y="132" class="u-lbl" text-anchor="middle">payment-events</text>
        <rect x="516" y="152" width="210" height="34" rx="5" class="u-box"/>
        <text x="621" y="174" class="u-lbl" text-anchor="middle">stock-events</text>
        <rect x="516" y="194" width="210" height="20" rx="5" class="u-box"/>
        <text x="621" y="209" class="u-lbl" text-anchor="middle">order-events.dlt (dead letter)</text>
        <line x1="502" y1="120" x2="446" y2="150" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="502" y1="170" x2="446" y2="170" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="502" y1="210" x2="446" y2="190" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="246" y="130" width="190" height="56" rx="8" class="u-hd"/>
        <text x="341" y="154" class="u-title" text-anchor="middle">payment-service</text>
        <text x="341" y="176" class="u-lbl" text-anchor="middle">group=payment · idempoten</text>
        <rect x="246" y="196" width="190" height="56" rx="8" class="u-box"/>
        <text x="341" y="220" class="u-title" text-anchor="middle">inventory-service</text>
        <text x="341" y="242" class="u-lbl" text-anchor="middle">group=inventory · upsert</text>
        <rect x="20" y="130" width="190" height="56" rx="8" class="u-box"/>
        <text x="115" y="154" class="u-title" text-anchor="middle">notification-service</text>
        <text x="115" y="176" class="u-lbl" text-anchor="middle">group=notification</text>
        <rect x="20" y="196" width="190" height="56" rx="8" class="u-box"/>
        <text x="115" y="220" class="u-title" text-anchor="middle">analytics-service</text>
        <text x="115" y="242" class="u-lbl" text-anchor="middle">projection per jam (CQRS)</text>
        <rect x="246" y="280" width="494" height="50" rx="8" class="u-hd"/>
        <text x="493" y="302" class="u-title" text-anchor="middle">Monitoring: lag per group · under-replicated · DLT depth · p99 produce/fetch</text>
        <text x="493" y="322" class="u-lbl" text-anchor="middle">alert: lag &gt; ambang 10 mnt · disk &gt; 85% · DLT &gt; 0</text>
      </svg></div><figcaption>Satu peristiwa pesanan mengalir melalui beberapa topik; tiap layanan berkelompok sendiri dan seluruh alur dipantau.</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Keputusan rancangan dan alasannya',
      lang: 'text',
      output: false,
      code: `KEPUTUSAN                PILIHAN                ALASAN
─────────────────────────────────────────────────────────────
key topic order-events   order_id                satu pesanan berurutan di satu partition
partisi order-events     12                      kelipatan consumer (6–8 consumer aktif)
replication factor       3                       toleransi 1 broker mati (min.insync=2)
acks                     all + idempotence       tak ada acknowledged write yang hilang
retensi order-events     30 hari                 audit + replay kejadian sebulan lalu
retensi DLT              30 hari + kompresi       investigasi tanpa membebani disk
format payload           Avro + Schema Registry  evolusi skema terkontrol (BACKWARD)
consumer offset          manual commit           commit hanya setelah proses tuntas
penulisan DB + event     transactional outbox    tak ada dual-write di lapisan aplikasi
error                    retry berbatas → DLT    transient diulang, permanen dikubur
consumer                 idempoten (event_id)    at-least-once tetap aman
monitoring               lag per group + DLT     deteksi dini sebelum pengguna mengeluh

TOPIK YANG DIBUHTUHKAN
  order-events        (RF 3, 12 partisi, key order_id, retensi 30 hari)
  payment-events      (RF 3, 6 partisi,  key payment_id)
  stock-events        (RF 3, 6 partisi,  key sku)
  order-events.retry  (2 partisi, retensi 3 hari)
  order-events.dlt    (2 partisi, retensi 30 hari)
  sales-per-hour      (RF 3, 6 partisi, hasil agregasi analytics)`,
      explain: [
        'Perhatikan pola pemikirannya: <b>setiap keputusan disertai alasan</b> — inilah yang membedakan engineer yang paham Kafka dari yang hanya menyalin konfigurasi contoh.',
        'Key <code>order_id</code> menjamin seluruh event satu pesanan berada di partisi yang sama sehingga urutannya konsisten — keputusan ini harus diambil <b>sejak awal</b> karena mengubahnya berarti berpindah partisi.',
        'Jumlah partisi dipilih sebagai <b>kelipatan</b> jumlah consumer agar beban terbagi rata, dan DLT memakai retensi sama dengan topik utama agar investigasi selalu punya data yang cukup.'
      ]
    },
    {
      type: 'example',
      title: 'Producer, consumer, dan penanganan error (pseudocode)',
      lang: 'text',
      output: false,
      code: `PRODUCER (order-service — menulis setelah transaksi outbox commit)
  producer.send(record with:
      key   = order_id
      value = {event_id, event_type, occurred_at, data}
      headers = correlation_id
  ) with acks=all, enable.idempotence=true

CONSUMER (payment-service)
  loop:
    records = consumer.poll(100 ms)
    for record in records:
      event_id = record.headers.correlation_id
      if already_processed(event_id):        # IDEMPOTEN
        commit(record); continue
      try:
        result = process(record)             # bayar, simpan, dst.
        save_processed(event_id, result)     # satu transaksi dengan bisnis
        commit(record)
      except TransientError as e:            # jaringan / DB mati
        if attempts(record) < 5: retry with backoff (1s,2s,4s,8s + jitter)
        else: send_to_dlt(record, e); commit(record)
      except PermanentError as e:            # payload rusak / aturan bisnis
        send_to_dlt(record, e); commit(record)

DLT HEADER
  dlt-exception-class, dlt-original-topic, dlt-attempts, dlt-correlation-id

ANALYTICS (projection per jam — Kafka Streams / ksqlDB)
  order-events.filter(status=PAID)
    .groupBy(user_id, window 1 jam)
    .aggregate(total) → sales-per-hour`,
      explain: [
        'Alur consumer menggabungkan pelajaran 10, 15, dan 16: <b>commit setelah tuntas</b>, <b>idempoten</b> berdasarkan event_id, <b>retry berbatas</b> untuk yang transient, dan <b>DLT</b> untuk yang permanen.',
        'Pembedaan <b>TransientError vs PermanentError</b> adalah inti penanganan error: mengulang payload yang rusak hanya membuang waktu dan membanjiri log.',
        'Proyeksi analitik memakai jendela waktu — pilihan pola dari pelajaran Kafka Streams; hasilnya menjadi topik baru yang bisa dibaca banyak layanan laporan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Monitoring dan prosedur pemulihan</h3><p>Dashboard proyek ini minimal memuat: (1) <b>lag per consumer group</b> dengan ambang, (2) <b>under-replicated partition</b> (harus nol), (3) <b>kedalaman DLT</b> (bernilai nol kecuali sedang ada masalah), (4) <b>p99 produce &amp; fetch</b>, (5) <b>penggunaan disk per broker</b>. Untuk setiap alert disiapkan runbook singkat:</p><ol><li><b>Lag melonjak</b> — cek apakah consumer hidup, periksa apakah ada poison pill di DLT, periksa rebalance berulang.</li><li><b>Under-replicated</b> — periksa broker mana yang tersangkut, pastikan disk &amp; jaringan sehat, tunggu penyusulan atau restart broker bila perlu.</li><li><b>DLT bertambah</b> — buka record terakhir, baca exception, tentukan apakah transient (tunggu pulih) atau permanen (perbaiki producer), lalu replay dengan idempotensi tetap aktif.</li><li><b>Disk hampir penuh</b> — periksa partisi terbesar, pertimbangkan memperpendek retensi topik log, atau tambah kapasitas.</li></ol>'
    },
    {
      type: 'text',
      html: '<h3>Checklist kesiapan produksi</h3><p>Sebelum sistem ini menyentuh pengguna nyata, seluruh butir berikut harus terpenuhi:</p><ul><li><b>Topik &amp; partition</b> — RF 3, min.insync 2, jumlah partisi sesuai perhitungan, tata nama konsisten.</li><li><b>Penulisan</b> — acks all, idempotence aktif, outbox untuk DB + event.</li><li><b>Consumer</b> — commit manual, idempoten, DLT aktif, auto.offset.reset disengaja.</li><li><b>Keamanan</b> — authorizer + ACL, SASL untuk client, TLS di listener eksternal, kredensial di secret manager.</li><li><b>Skema</b> — registry aktif, auto-register mati di production, kompatibilitas BACKWARD/FULL.</li><li><b>Monitoring</b> — lima panel inti, alert dengan durasi, runbook tersedia.</li><li><b>Operasional</b> — prosedur backup, uji failover broker berkala, retensi disetel per topik, kapasitas disk diperiksa berkala.</li></ul>'
    },
    {
      type: 'example',
      title: 'Pemeriksaan mandiri: uji sistem bekerja',
      lang: 'bash',
      output: false,
      code: `# 1) kirim 1.000 pesanan uji lalu periksa alurnya
kafka-console-producer.sh --bootstrap-server localhost:9092 \\
  --topic order-events --property parse.key=true \\
  --property key.separator=| <<'EOF'
ORD-1001|{"event_id":"evt-1","event_type":"order.created","data":{"order_id":"ORD-1001","total":250000}}
ORD-1002|{"event_id":"evt-2","event_type":"order.created","data":{"order_id":"ORD-1002","total":175000}}
EOF

# 2) baca dengan group test dan pastikan lag menyusut ke nol
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \\
  --group payment-service --describe

# 3) simulasi payload rusak → masuk DLT
kafka-console-producer.sh --bootstrap-server localhost:9092 \\
  --topic order-events --property parse.key=true \\
  --property key.separator=| <<'EOF'
ORD-BAD|{"event_id":"evt-bad","event_type":BROKEN_JSON
EOF
kafka-console-consumer.sh --bootstrap-server localhost:9092 \\
  --topic order-events.dlt --from-beginning

# 4) uji pemulihan: matikan satu broker, amati ISR & leadership
docker stop kafka && \\
  kafka-topics.sh --bootstrap-server localhost:9092 \\
  --describe --under-replicated-partitions
docker start kafka   # tunggu hingga ISR pulih`,
      explain: [
        'Uji <b>DLT dengan payload rusak</b> membuktikan jalur error benar-benar berfungsi — banyak tim hanya menguji jalur sukses dan menemukan DLT bermasalah tepat saat insiden.',
        'Uji <b>matikan satu broker</b> memvalidasi seluruh rantai daya tahan: ISR menyusut, leader pindah, producer tetap jalan, lalu semuanya pulih — persis yang dipelajari di pelajaran replication dan storage.',
        'Periksa <b>lag setelah uji</b>: lag yang kembali ke nol membuktikan consumer memproses dan commit dengan benar; lag yang menggantung menandakan masalah commit atau rebalance.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan pemeriksaan mandiri</h3><p>Jawab tanpa membuka materi — bila ragu, kembali ke pelajaran terkait:</p><ol><li>Mengapa key pesanan memakai <code>order_id</code> dan bukan <code>user_id</code>? Apa akibatnya bila diganti?</li><li>Jelaskan perjalanan satu record dari HTTP hingga analitik: menyebutkan topik, group, dan mekanisme yang dilalui.</li><li>Apa bedanya bila <code>min.insync.replicas</code> dibiarkan 1 dengan RF 3?</li><li>Bila DLT mencapai 10 ribu record dalam 5 menit, apa tiga pertanyaan pertamamu?</li><li>Kapan kamu memilih transactional outbox, dan kapan dual write masih boleh dipakai?</li><li>Sebutkan lima panel dashboard dan tiga alert untuk sistem ini.</li></ol>'
    },
    {
      type: 'warn',
      title: 'Kesalahan yang paling sering terjadi pada proyek nyata',
      text: '<ul><li><b>Menguji hanya jalur sukses</b> — error path (DLT, retry, replikasi) tidak pernah diuji sampai insiden.</li><li><b>Key dipilih tanpa pertimbangan</b> — mengganti key di produksi memindahkan data antarpartisi dan mengacaukan urutan.</li><li><b>Idempotensi dianggap opsional</b> — dengan at-least-once, duplikat adalah kepastian; tanpa idempotensi, stok terpotong dua kali.</li><li><b>Retensi dan kapasitas tidak dihitung</b> — kejutan tagihan disk di akhir bulan.</li><li><b>Tanpa runbook</b> — alert berbunyi jam 3 pagi dan tidak ada yang tahu harus mulai dari mana.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Langkah lanjutan setelah proyek ini',
      text: '<p>Bila proyek ini berjalan lancar, langkah berikutnya yang bermakna: (1) <b>multi-datacenter</b> ketika ada kebutuhan DR/latensi, (2) <b>tiered storage</b> bila retensi panjang mulai mahal, (3) <b>stream processing</b> yang lebih dalam (Kafka Streams/ksqlDB) untuk analitik real-time, (4) <b>chaos test</b> berkala (matikan broker, putus jaringan) untuk memastikan ketahanan benar-benar teruji. Yang terpenting: terus ukur, terus dokumentasikan alasan setiap keputusan — itu yang membuat sistem bertahan bertahun-tahun.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Pipeline end-to-end', 'Alur data lengkap dari penerimaan hingga konsumsi akhir.'],
        ['Idempotensi', 'Memproses ulang record yang sama tidak mengubah hasil akhir.'],
        ['Outbox', 'Menulis data dan event dalam satu transaksi database.'],
        ['Dead Letter Topic', 'Tempat pesan menyerah setelah percobaan habis.'],
        ['Projection', 'Model baca yang dibangun dari stream (CQRS).'],
        ['Runbook', 'Langkah penanganan siap pakai saat alert berbunyi.'],
        ['Checklist produksi', 'Daftar pemeriksaan kesiapan sebelum sistem dipakai nyata.'],
        ['Chaos test', 'Uji ketahanan dengan sengaja menyebabkan kegagalan.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Rangkuman akhir perjalanan</h3><p>Dari pelajaran pertama hingga ini, kamu telah menempuh: <b>konsep inti</b> (topic, partition, offset) → <b>operasional</b> (environment, CLI, KRaft) → <b>membaca &amp; menulis</b> (producer, consumer, group) → <b>desain</b> (integrasi, event, delivery semantics) → <b>keandalan</b> (outbox, DLT, skema) → <b>ekosistem</b> (Connect, Streams, Registry) → <b>produksi</b> (keamanan, monitoring, storage, tuning) → <b>skala</b> (multi-datacenter) — dan kini kamu memiliki kerangka kerja untuk membangun sistem yang benar-benar bertahan.</p><p>Prinsip yang tidak pernah berubah di semua tingkatan: <b>ukur sebelum mengubah</b>, <b>asumsi harus diuji</b>, <b>kegagalan itu pasti — yang penting bagaimana menanganinya</b>, dan <b>setiap keputusan konfigurasi punya alasan yang bisa dijelaskan</b>.</p>'
    }
  ],
  recap: [
    'Proyek: <b>order-service (outbox) → order-events → payment/inventory/notification/analytics</b> — satu peristiwa, banyak pembaca dengan group masing-masing.',
    'Setiap keputusan (key, partisi, retensi, format, commit) <b>disertai alasan</b> — itulah tanda penguasaan, bukan sekadar menyalin konfigurasi.',
    'Keandalan: <b>acks all + idempotence, outbox, retry berbatas → DLT, consumer idempoten</b> — diuji, bukan hanya ditulis.',
    'Siap produksi = <b>checklist terpenuhi + runbook + uji kegagalan</b> (matikan broker, rusakkan payload) — uji jalur error lebih penting daripada jalur sukses.'
  ]
});
