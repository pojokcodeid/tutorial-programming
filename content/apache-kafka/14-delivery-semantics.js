/* ============================================================
   Pelajaran Apache Kafka — 14: Delivery Semantics
   ============================================================ */
'use strict';

window.KAFKA_LESSONS = window.KAFKA_LESSONS || [];

window.KAFKA_LESSONS.push({
  id: 'delivery-semantics',
  title: 'Delivery Semantics: At-Least / At-Most / Exactly Once',
  chapter: 'Producer & Consumer',
  duration: '15 menit',
  intro: [
    'Setiap sistem messaging pada akhirnya menghadapi satu pertanyaan yang sama: <b>apa yang terjadi bila terjadi kegagalan di tengah jalan?</b> Apakah data boleh hilang? Boleh ganda? Atau harus persis sekali? Jawabannya bukan &quot;ya atau tidak&quot;, melainkan tiga pilihan semantik yang masing-masing membawa konsekuensi berbeda.',
    'Pelajaran ini membedah <b>at-most-once, at-least-once, dan exactly-once</b>: kapan masing-masing terjadi (bahkan tanpa kamu sadari), bagaimana kombinasi acks/retries/commit menentukannya, serta cara Kafka mencapai <b>exactly-once semantics</b> lewat idempotence dan transaksi — dan kapan itu benar-benar diperlukan.'
  ],
  objectives: [
    'Menjelaskan tiga semantik pengiriman beserta risiko hilang dan ganda',
    'Menelusuri bagaimana kombinasi konfigurasi menentukan semantik yang terjadi',
    'Menjelaskan cara Kafka mencapai exactly-once: idempotence dan transaksi',
    'Memilih semantik yang tepat sesuai kebutuhan bisnis dan biayanya'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Tiga semantik, satu pilihan sadar</h3><p>Pada dasarnya ada tiga kemungkinan hasil ketika sistem gagal di tengah:</p><table><thead><tr><th>Semantik</th><th>Arti praktis</th><th>Risiko</th></tr></thead><tbody><tr><td><b>At-most-once</b></td><td>Record diproses <b>sekaligus atau tidak sama sekali</b></td><td><b>Bisa hilang</b> — tidak pernah dobel</td></tr><tr><td><b>At-least-once</b></td><td>Record diproses <b>minimal sekali</b></td><td><b>Bisa dobel</b> — tidak pernah hilang</td></tr><tr><td><b>Exactly-once</b></td><td>Record diproses <b>persis sekali</b></td><td>Tanpa hilang, tanpa dobel (biaya lebih tinggi)</td></tr></tbody></table><p>Kuncinya: semantik ini <b>bukan sekadar saklar</b> yang kamu pilih di satu tempat — ia adalah hasil gabungan keputusan di <b>producer</b> (acks, retries) dan <b>consumer</b> (cara commit) sekaligus.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 330" width="760" role="img" aria-label="Perbandingan at-most-once, at-least-once, dan exactly-once pada skenario gagal di tengah">
        <rect x="20" y="20" width="228" height="290" rx="10" class="u-box"/>
        <text x="134" y="46" class="u-title" text-anchor="middle">At-most-once</text>
        <line x1="34" y1="56" x2="234" y2="56" class="u-line"/>
        <text x="134" y="84" class="u-lbl" text-anchor="middle">gagal → tidak diulang</text>
        <text x="134" y="112" class="u-lbl" text-anchor="middle">hasil: data HILANG</text>
        <text x="134" y="140" class="u-lbl" text-anchor="middle">tidak pernah dobel</text>
        <rect x="34" y="164" width="200" height="60" rx="6" class="u-hd"/>
        <text x="134" y="190" class="u-lbl" text-anchor="middle">acks=0 tanpa retry</text>
        <text x="134" y="212" class="u-lbl" text-anchor="middle">/ auto-commit dini</text>
        <text x="134" y="256" class="u-lbl" text-anchor="middle">cocok: log metrik</text>
        <text x="134" y="280" class="u-lbl" text-anchor="middle">yang hilang tak berdampak</text>
        <rect x="266" y="20" width="228" height="290" rx="10" class="u-box"/>
        <text x="380" y="46" class="u-title" text-anchor="middle">At-least-once</text>
        <line x1="280" y1="56" x2="480" y2="56" class="u-line"/>
        <text x="380" y="84" class="u-lbl" text-anchor="middle">gagal → diulang</text>
        <text x="380" y="112" class="u-lbl" text-anchor="middle">hasil: data AMAN</text>
        <text x="380" y="140" class="u-lbl" text-anchor="middle">risiko: DOBEL saat replay</text>
        <rect x="280" y="164" width="200" height="60" rx="6" class="u-hd"/>
        <text x="380" y="190" class="u-lbl" text-anchor="middle">acks=all + retries</text>
        <text x="380" y="212" class="u-lbl" text-anchor="middle">+ commit setelah sukses</text>
        <text x="380" y="256" class="u-lbl" text-anchor="middle">paling umum di production</text>
        <text x="380" y="280" class="u-lbl" text-anchor="middle">+ consumer idempoten</text>
        <rect x="512" y="20" width="228" height="290" rx="10" class="u-hd"/>
        <text x="626" y="46" class="u-title" text-anchor="middle">Exactly-once</text>
        <line x1="526" y1="56" x2="726" y2="56" class="u-line"/>
        <text x="626" y="84" class="u-lbl" text-anchor="middle">gagal → diulang TANPA dobel</text>
        <text x="626" y="112" class="u-lbl" text-anchor="middle">hasil: persis sekali</text>
        <text x="626" y="140" class="u-lbl" text-anchor="middle">butuh dukungan penuh Kafka</text>
        <rect x="526" y="164" width="200" height="60" rx="6" class="u-hd"/>
        <text x="626" y="190" class="u-lbl" text-anchor="middle">idempotence + transaksi</text>
        <text x="626" y="212" class="u-lbl" text-anchor="middle">(producer &amp; consumer EOS)</text>
        <text x="626" y="256" class="u-lbl" text-anchor="middle">untuk agregasi finansial</text>
        <text x="626" y="280" class="u-lbl" text-anchor="middle">yang tak boleh ganda</text>
      </svg></div><figcaption>Tiga semantik: pilih mana yang boleh hilang, boleh ganda, atau tak keduanya — beserta biayanya.</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Bagaimana semantik terbentuk (tanpa disadari)</h3><p><b>Di sisi producer:</b></p><ul><li><b>acks=0, tanpa retry</b> → at-most-once (bila gagal, hilang).</li><li><b>acks=1/all dengan retry</b> → at-least-once (gagal → ulang → bisa ganda bila konfirmasi hilang setelah broker sebenarnya menulis).</li><li><b>acks=all + enable.idempotence=true</b> → producer menjamin tidak dobel dan tidak bolak-balik.</li></ul><p><b>Di sisi consumer:</b></p><ul><li><b>Commit SEBELUM proses</b> → at-most-once (crash di tengah → sudah terlanjur commit → hilang).</li><li><b>Commit SESUDAH proses</b> → at-least-once (crash sebelum commit → dibaca ulang → bisa ganda).</li><li><b>Commit + proses atomik</b> → exactly-once (transaksi Kafka).</li></ul><p>Pahami pola ini: <b>at-least-once adalah default yang paling sering kamu dapatkan</b> ketika melakukan hal yang benar (commit setelah sukses + retry).</p>'
    },
    {
      type: 'example',
      title: 'Menelusuri skenario kegagalan',
      lang: 'text',
      output: false,
      code: `SKENARIO: consumer memproses 10 record lalu program crash sebelum commit

AT-MOST-ONCE (commit sebelum proses)
  commit(offset 10) → crash saat proses
  → restart: mulai dari 10 → record 0..9 TIDAK PERNAH diproses (hilang)

AT-LEAST-ONCE (commit sesudah proses)
  proses 0..9 → crash SEBELUM commit
  → restart: mulai dari 0 → record 0..9 diproses LAGI (ganda)
  → solusi: consumer idempoten (upsert) → hasil akhir tetap benar

EXACTLY-ONCE (transaksi Kafka)
  proses + commit dalam SATU transaksi atomik
  → crash di titik mana pun: seluruh batch diulang utuh TANPA dobel
  → syarat: idempotence producer + consumer transaksional

ANALOGI WARUNG
  at-most-once  : pembayaran dicatat dulu, barang belum tentu diantar → bisa hilang
  at-least-once : barang diantar, catatan menyusul → bisa terkirim dua kali
  exactly-once  : serah-terima dibukti satu tanda tangan → persis sekali`,
      explain: [
        'Perhatikan bahwa <b>kedua semantik pertama masing-masing punya kelemahan berlawanan</b> — hilang atau ganda — dan keduanya sering muncul dari kesalahan urutan commit, bukan dari konfigurasi yang aneh.',
        'At-least-once yang dipasangkan dengan <b>idempotensi consumer</b> sering menjadi pilihan pragmatis terbaik: jaminan tidak hilang, ganda ditangani di lapisan pemrosesan.',
        'Exactly-once sesungguhnya membutuhkan <b>dukungan menyeluruh</b> (producer + broker + consumer) — inilah yang disediakan transaksi Kafka, dengan konsekuensi latensi dan kompleksitas lebih tinggi.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Exactly-once di Kafka: idempotence + transaksi</h3><p>Kafka menyediakan <b>exactly-once semantics (EOS)</b> melalui dua mekanisme yang saling melengkapi:</p><ul><li><b>Idempotent producer</b> — menghapus duplikat akibat retry di sisi pengiriman (per partition, dengan sequence number).</li><li><b>Transactions</b> — mengikat &quot;menulis ke topic A dan B&quot; atau &quot;memproses lalu commit offset&quot; menjadi satu unit atomik: berhasil semua atau gagal semua.</li></ul><p>Syarat memakai EOS: producer transaksional, consumer memakai <code>isolation.level=read_committed</code>, dan (untuk alur pemrosesan) <code>processing.guarantee=exactly_once_v2</code> pada Kafka Streams/Connect. Catat juga bahwa transaksi berlaku <b>dalam satu cluster</b>.</p>'
    },
    {
      type: 'example',
      title: 'Mengaktifkan transaksi (producer & consumer)',
      lang: 'java',
      output: false,
      code: `// PRODUCER TRANSAKSIONAL
props.put(ProducerConfig.TRANSACTIONAL_ID_CONFIG, "order-service-tx");
props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, "true");
KafkaProducer<String, String> producer = new KafkaProducer<>(props);
producer.initTransactions();

producer.beginTransaction();
try {
    producer.send(new ProducerRecord<>("order-events", order));
    producer.send(new ProducerRecord<>("payment-events", payment));
    producer.sendOffsetsToTransaction(offsets, groupMetadata);   // offset ikut transaksi
    producer.commitTransaction();          // semuanya terjadi bersama
} catch (Exception e) {
    producer.abortTransaction();           // semuanya batal — seolah tidak pernah terjadi
    throw e;
}

// CONSUMER: baca hanya record dari transaksi yang sudah commit
props.put(ConsumerConfig.ISOLATION_LEVEL_CONFIG, "read_committed");`,
      explain: [
        '<code>transactional.id</code> mengidentifikasi satu alur transaksi — bila producer yang sama restart, transaksi lama yang menggantung otomatis dibatalkan.',
        '<code>sendOffsetsToTransaction()</code> adalah kunci: <b>memproses data dan mencatat posisi baca</b> menjadi satu unit — inilah yang mewujudkan exactly-once pada pola read-process-write.',
        '<code>read_committed</code> membuat consumer mengabaikan record dari transaksi yang belum commit/gagal — tanpanya, jaminan EOS di sisi producer jadi percuma.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Memilih semantik sesuai kebutuhan</h3><table><thead><tr><th>Kebutuhan</th><th>Semantik pilihan</th><th>Catatan</th></tr></thead><tbody><tr><td>Log metrik / telemetry</td><td><b>At-most-once</b></td><td>Sebagian data hilang tidak berpengaruh; paling murah</td></tr><tr><td>Notifikasi, sinkronisasi data</td><td><b>At-least-once</b> + idempoten</td><td>Paling umum; ganda ditangani dengan upsert</td></tr><tr><td>Pemrosesan finansial, agregasi ganda = salah total</td><td><b>Exactly-once</b></td><td>Butuh transaksi; biaya latensi &amp; kompleksitas</td></tr><tr><td>Enrichment stream-to-stream</td><td><b>Exactly-once</b> (Kafka Streams)</td><td>Kesalahan ganda mengubah hasil agregasi</td></tr></tbody></table><p>Sering kali, <b>at-least-once + idempotensi adalah jawaban yang paling praktis</b>: jaminan tidak hilang (yang paling mahal risikonya), sementara duplikat ditangani murah di lapisan aplikasi dengan upsert berbasis <code>event_id</code>.</p>'
    },
    {
      type: 'warn',
      title: 'Miskonsepsi yang sering berujung insiden',
      text: '<ul><li><b>&quot;acks=all berarti exactly-once&quot;</b> — tidak; acks=all hanya memastikan tulis tersimpan, duplikat dari retry masih mungkin tanpa idempotence.</li><li><b>&quot;Retries tinggi selalu aman&quot;</b> — tanpa idempotence, retries justru meningkatkan peluang record ganda.</li><li><b>&quot;Commit otomatis = pasti aman&quot;</b> — auto commit bisa terjadi sebelum proses tuntas → justru at-most-once yang tak direncanakan.</li><li><b>&quot;Exactly-once gratis&quot;</b> — ada latensi, koordinasi, dan batasan (antar cluster) yang harus dibayar.</li><li><b>Idempotensi hanya di Kafka</b> — idempotensi <b>consumer/app</b> tetap dibutuhkan walau EOS aktif, untuk sistem luar (database, API).</li></ul>'
    },
    {
      type: 'tip',
      title: 'Panduan keputusan singkat',
      text: '<p>Tanyakan dua hal: (1) <b>Apa yang lebih merugikan — data hilang atau data dobel?</b> (2) <b>Bisakah sistem luar menangani duplikat dengan murah (upsert)?</b> Bila duplikat bisa ditangani murah → <b>at-least-once + idempoten</b> hampir selalu pilihan terbaik. Bila ganda merusak total dan sistem luar tak bisa menyaringnya → barulah investasi exactly-once transaksional sepadan.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['At-most-once', 'Diproses maksimal sekali — bisa hilang, tidak pernah dobel.'],
        ['At-least-once', 'Diproses minimal sekali — tidak pernah hilang, bisa dobel.'],
        ['Exactly-once', 'Diproses persis sekali — tanpa hilang dan tanpa dobel.'],
        ['Idempotence (producer)', 'Retry tidak menghasilkan duplikat di broker.'],
        ['Transaksi Kafka', 'Unit atomik menulis + commit offset; berhasil semua atau batal.'],
        ['transactional.id', 'Pengenal transaksi yang bertahan saat producer restart.'],
        ['isolation.level', 'Setelan consumer: read_uncommitted vs read_committed.'],
        ['Idempotensi consumer', 'Memproses ulang tidak mengubah hasil akhir (upsert).']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Definisikan tiga semantik dengan satu kalimat masing-masing beserta risikonya.</li><li>Kombinasi konfigurasi apa yang menghasilkan at-most-once pada consumer? Dan pada producer?</li><li>Mengapa at-least-once sering disebut &quot;default dari melakukan hal yang benar&quot;?</li><li>Jelaskan peran <code>read_committed</code> dan <code>sendOffsetsToTransaction()</code> dalam EOS.</li><li>Untuk tiga aplikasi (metrik, notifikasi, pembayaran), pilih semantik + alasannya.</li></ol>'
    }
  ],
  recap: [
    'Tiga semantik: <b>at-most-once</b> (bisa hilang), <b>at-least-once</b> (bisa dobel), <b>exactly-once</b> (persis sekali).',
    'Semantik terbentuk dari <b>urutan commit vs proses</b> di consumer dan <b>acks/retries/idempotence</b> di producer.',
    'EOS Kafka = <b>idempotent producer + transaksi</b> (+ consumer <code>read_committed</code>); berlaku dalam satu cluster.',
    'Pilihan praktis terbaik sering: <b>at-least-once + consumer idempoten</b> — tidak hilang, ganda ditangani murah dengan upsert.'
  ]
});
