/* ============================================================
   Pelajaran Apache Kafka — 10: Consumer — Membaca & Memproses Data
   ============================================================ */
'use strict';

window.KAFKA_LESSONS = window.KAFKA_LESSONS || [];

window.KAFKA_LESSONS.push({
  id: 'consumer',
  title: 'Consumer: Membaca & Memproses Data',
  chapter: 'Producer & Consumer',
  duration: '15 menit',
  intro: [
    'Kafka memberi kebebasan yang tidak dimiliki antrean biasa: kamu bisa membaca dari awal riwayat (earliest), dari ujung log (latest), dari posisi tertentu, bahkan dari timestamp tertentu. Namun membaca baru separuh cerita — yang menantang adalah menulis consumer yang andal: poll secara konsisten, memproses batch, commit dengan aman, bertahan dari restart, dan menangani pemrosesan gagal tanpa kehilangan data.',
    'Pelajaran ini merangkai keduanya menjadi pola kerja konkret: memilih <b>titik awal baca</b> (earliest/latest/timestamp + seek), lalu siklus <b>poll → proses → commit</b>, peran <code>max.poll.records</code>, strategi commit (sync vs async), pemrosesan per-partition, penanganan <b>poison pill</b>, sampai consumer idempoten yang tahan baca ulang.'
  ],
  objectives: [
    'Memilih titik awal baca: earliest, latest, berbasis timestamp, dan seek()',
    'Menulis siklus kerja consumer: poll → proses → commit dengan benar',
    'Membandingkan commitSync dan commitAsync beserta pola penggunaannya',
    'Menjelaskan penanganan poison pill dan strategi consumer idempoten'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Siklus dasar: poll, proses, commit</h3><p>Seluruh kerja consumer berputar pada satu siklus berulang:</p><ol><li><b>poll()</b> — ambil sejumlah record (maksimal <code>max.poll.records</code>) dari partition yang ditugaskan.</li><li><b>Proses</b> — kerjakan record: simpan ke database, panggil API, dsb.</li><li><b>Commit</b> — catat kemajuan (offset terakhir yang berhasil diproses).</li><li>Ulangi — selama program berjalan.</li></ol><p>Dua perangkap utama: (a) memproses terlalu lama sehingga melewati <code>max.poll.interval.ms</code> → rebalance; (b) commit terlalu awal → record bisa hilang saat crash. Keduanya dihindari dengan <b>membatasi ukuran batch</b> dan <b>commit hanya setelah proses tuntas</b>.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 320" width="760" role="img" aria-label="Siklus kerja consumer: poll, proses, commit, dengan penanganan error dan poison pill">
        <rect x="20" y="30" width="160" height="70" rx="8" class="u-hd"/>
        <text x="100" y="58" class="u-title" text-anchor="middle">poll()</text>
        <text x="100" y="82" class="u-lbl" text-anchor="middle">maks max.poll.records</text>
        <line x1="186" y1="65" x2="244" y2="65" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="250" y="30" width="170" height="70" rx="8" class="u-box"/>
        <text x="335" y="58" class="u-title" text-anchor="middle">Proses batch</text>
        <text x="335" y="82" class="u-lbl" text-anchor="middle">simpan / hitung / kirim</text>
        <line x1="426" y1="65" x2="484" y2="65" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="490" y="30" width="160" height="70" rx="8" class="u-hd"/>
        <text x="570" y="58" class="u-title" text-anchor="middle">commit</text>
        <text x="570" y="82" class="u-lbl" text-anchor="middle">sync (aman) / async</text>
        <line x1="656" y1="65" x2="714" y2="65" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="250" y="150" width="400" height="70" rx="8" class="u-hd"/>
        <text x="450" y="178" class="u-title" text-anchor="middle">Proses GAGAL?</text>
        <text x="450" y="202" class="u-lbl" text-anchor="middle">→ JANGAN commit; retry / dead-letter per record</text>
        <line x1="570" y1="106" x2="570" y2="150" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="335" y1="106" x2="335" y2="150" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="20" y="150" width="200" height="70" rx="8" class="u-box"/>
        <text x="120" y="178" class="u-title" text-anchor="middle">Idempotensi</text>
        <text x="120" y="202" class="u-lbl" text-anchor="middle">aman bila diproses ulang</text>
        <line x1="226" y1="185" x2="244" y2="185" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="20" y="250" width="720" height="56" rx="8" class="u-hd"/>
        <text x="380" y="274" class="u-title" text-anchor="middle">Prinsip: commit SELALU setelah proses tuntas</text>
        <text x="380" y="296" class="u-lbl" text-anchor="middle">crash di tengah → record diproses ulang → konsumen harus idempoten</text>
      </svg></div><figcaption>Siklus consumer yang sehat membatasi batch, memproses, lalu commit — dan menangani gagal tanpa commit buta.</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Titik awal baca: earliest, latest, dan timestamp</h3><p>Sebelum memproses, tentukan dulu <b>posisi awal</b>. Dua nilai paling dasar (lewat <code>auto.offset.reset</code> atau opsi CLI):</p><ul><li><b>earliest</b> — mulai dari offset 0, yaitu <b>seluruh riwayat</b> yang masih ada di log.</li><li><b>latest</b> — mulai dari ujung log, yaitu hanya <b>record baru</b> sesudah consumer berjalan.</li></ul><p>Keduanya hanya berlaku <b>saat belum ada committed offset</b>. Begitu ada, posisi terakhir itulah yang dipakai — kecuali kamu <code>seek()</code> atau reset eksplisit. Untuk kasus yang butuh titik waktu (mis. &quot;sejak insiden pukul 10:05&quot;), baca dari <b>timestamp record</b> memakai <code>--offset &lt;epoch millis&gt;</code> (CLI) atau <code>offsetsForTimes()</code> + <code>seek()</code> (API).</p><table><thead><tr><th>Skenario</th><th>Titik awal</th></tr></thead><tbody><tr><td>Proses real-time (notifikasi)</td><td><b>latest</b> — hanya record baru</td></tr><tr><td>Backfill / migrasi / state awal service</td><td><b>earliest</b> — riwayat penuh</td></tr><tr><td>Audit sejak waktu tertentu</td><td><b>timestamp</b> (epoch millis)</td></tr><tr><td>Debug satu record</td><td><b>--partition + --offset</b> presisi</td></tr></tbody></table>'
    },
    {
      type: 'example',
      title: 'Menentukan dan memindahkan posisi baca',
      lang: 'bash',
      output: false,
      code: `# earliest: seluruh riwayat yang masih ada
docker exec kafka /opt/kafka/bin/kafka-console-consumer.sh \\
  --bootstrap-server localhost:9092 --topic user-events --from-beginning

# latest: hanya record baru (default tanpa opsi offset)
docker exec kafka /opt/kafka/bin/kafka-console-consumer.sh \\
  --bootstrap-server localhost:9092 --topic user-events

# dari timestamp: epoch millis (nilai besar = waktu, bukan offset)
docker exec kafka /opt/kafka/bin/kafka-console-consumer.sh \\
  --bootstrap-server localhost:9092 --topic user-events \\
  --partition 0 --offset 1795716300000

# di aplikasi: cari offset untuk timestamp lalu pindah posisi
#   var found = consumer.offsetsForTimes(Map.of(tp, tsMillis));
#   consumer.seek(tp, found.get(tp).offset());
# setelah proses tuntas: consumer.commitSync() agar posisi bertahan restart`,
      explain: [
        '<code>--from-beginning</code> (earliest) membuktikan record lama masih tersimpan — rekam ulang riwayat kapan pun; tanpa opsi, console consumer memakai <b>latest</b>.',
        'Nilai <code>--offset</code> berjuta-juta ke atas diinterpretasikan sebagai <b>epoch millis</b> — cara termudah membaca dari waktu tertentu tanpa menulis kode.',
        '<code>seek()</code> hanya memindahkan posisi di memori — <b>harus dicommit</b> agar tidak melonjak balik ke committed offset lama saat restart.'
      ]
    },
    {
      type: 'example',
      title: 'Pola consumer andal (Java)',
      lang: 'java',
      output: false,
      code: `Properties props = new Properties();
props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
props.put(ConsumerConfig.GROUP_ID_CONFIG, "analytics");
props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class.getName());
props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "false");   // komit manual
props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, "500");        // batasi batch

KafkaConsumer<String, JsonNode> consumer = new KafkaConsumer<>(props);
consumer.subscribe(List.of("user-events"));

while (running) {
    ConsumerRecords<String, JsonNode> records = consumer.poll(Duration.ofMillis(500));
    if (records.isEmpty()) continue;

    try {
        for (ConsumerRecord<String, JsonNode> r : records) {
            simpanKeDatabase(r);            // idempoten: upsert berdasarkan event_id
        }
        consumer.commitSync();              // aman: hanya setelah semua sukses
    } catch (Exception e) {
        log.error("gagal memproses batch: tidak dicommit", e);
        // opsi A: retry berikutnya (poll ulang mengambil lagi dari offset lama)
        // opsi B: dead-letter per record lalu commit yang berhasil
    }
}`,
      explain: [
        '<code>enable.auto.commit=false</code> + <code>commitSync()</code> memastikan offset hanya bergerak bila pemrosesan benar-benar tuntas — inilah inti at-least-once.',
        '<code>max.poll.records=500</code> membatasi supaya satu siklus ringan dan tetap jauh di bawah <code>max.poll.interval.ms</code> (mencegah rebalance).',
        'Bila batch gagal, tanpa commit offset akan terbaca ulang pada poll berikutnya — karena itu pemrosesannya harus <b>idempoten</b> agar pengulangan tidak merusak.'
      ]
    },
    {
      type: 'text',
      html: '<h3>commitSync vs commitAsync</h3><table><thead><tr><th>Aspek</th><th>commitSync()</th><th>commitAsync()</th></tr></thead><tbody><tr><td><b>Blokir?</b></td><td>Ya — menunggu hasil broker</td><td>Tidak — lanjut sambil menunggu</td></tr><tr><td><b>Kegagalan</b></td><td>Lempar exception (bisa ditangani)</td><td>Dipanggil kembali via callback; terakhir menang</td></tr><tr><td><b>Cocok untuk</b></td><td>Kommit kritis setelah sukses</td><td>Kommit sering di tengah batch besar</td></tr></tbody></table><p>Pola yang lazim: <b>commitAsync</b> selama memproses (mengurangi overhead), lalu <b>commitSync sekali</b> di akhir batch sebagai jaminan sebelum lanjut. Bila commitSync gagal, berhenti memproses dan biarkan offset tidak bergerak — record akan dibaca ulang (lebih baik dobel daripada hilang).</p>'
    },
    {
      type: 'example',
      title: 'Commit async di tengah, sync di akhir',
      lang: 'java',
      output: false,
      code: `while (running) {
    ConsumerRecords<String, JsonNode> records = consumer.poll(Duration.ofMillis(500));
    int i = 0;
    for (ConsumerRecord<String, JsonNode> r : records) {
        simpanKeDatabase(r);
        // komit berkala agar restart tidak mengulang terlalu banyak
        if (++i % 100 == 0) consumer.commitAsync();
    }
    try {
        consumer.commitSync();          // jaminan komit terakhir
    } catch (CommitFailedException e) {
        log.error("rebalance terjadi saat commit, offset tidak tersimpan", e);
        break;                          // berhenti; baca ulang dari offset lama
    }
}`,
      explain: [
        '<code>commitAsync</code> setiap 100 record memperkecil jumlah record yang diproses ulang bila crash di tengah batch.',
        '<code>commitSync</code> di akhir adalah jaring pengaman terakhir — kalau ia gagal (mis. karena rebalance), berhenti dulu daripada melanjutkan dengan posisi yang tidak pasti.',
        'Pola dua tingkat ini menjaga keseimbangan: overhead kommit rendah, tetapi jaminan komit tetap ada tiap akhir batch.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Pemrosesan aman per partition</h3><p>Beberapa situasi mengharuskan kamu memperhatikan <b>partition mana</b> sebuah record berasal:</p><ul><li><b>Urutan per key harus dipertahankan</b> — proses record satu partition secara berurutan, jangan dicampur dengan partition lain yang bisa maju lebih cepat.</li><li><b>Konteks per partition</b> — mis. state window/tersimpan per partition; simpan per <code>TopicPartition</code>, bukan global.</li><li><b>Commit per partition</b> — komit spesifik <code>Map&lt;TopicPartition, OffsetAndMetadata&gt;</code> memberi kontrol presisi.</li></ul><p>Untuk kebanyakan use case sederhana, memproses per batch apa adanya sudah cukup. Naikkan granularitas ini ketika ada tuntutan urutan atau state.</p>'
    },
    {
      type: 'example',
      title: 'Commit presisi per partition',
      lang: 'java',
      output: false,
      code: `Map<TopicPartition, OffsetAndMetadata> offsets = new HashMap<>();
for (TopicPartition tp : records.partitions()) {
    List<ConsumerRecord<String, JsonNode>> partRecs = records.records(tp);
    for (ConsumerRecord<String, JsonNode> r : partRecs) {
        simpanKeDatabase(r);                       // proses berurutan per partition
    }
    // offset berikutnya setelah record terakhir partition ini
    long last = partRecs.get(partRecs.size() - 1).offset() + 1;
    offsets.put(tp, new OffsetAndMetadata(last));
}
consumer.commitSync(offsets);                     // komit hanya partition yang selesai`,
      explain: [
        'Dengan komit per partition, satu partition yang gagal <b>tidak menarik mundur</b> offset partition lain yang sudah sukses.',
        '<code>offset + 1</code> karena committed offset selalu menunjuk <b>berikutnya</b> yang akan dibaca, bukan terakhir yang dibaca.',
        'Bila sebagian partition gagal diproses, cukup komit yang sukses — yang gagal akan terbaca ulang saat restart.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Poison pill dan consumer idempoten</h3><p><b>Poison pill</b> adalah record yang selalu membuat pemrosesan crash (JSON rusak, field null memicu NPE, data tak sesuai skema). Masalahnya: karena offset tidak pernah ter-commit, consumer membaca record yang sama berulang dan terjebak — <b>tidak ada kemajuan sama sekali</b>.</p><p>Penanganan umum:</p><ul><li><b>Dead-letter topic (DLT)</b> — record bermasalah dialihkan ke topic khusus untuk diteliti, offset tetap dicommit agar alur berlanjut.</li><li><b>Validasi cepat + skip ber-log</b> — bila record memang bisa ditinggalkan (mis. data kadaluarsa), catat log lalu lanjut.</li><li><b>Retry dengan backoff terbatas</b> — untuk error sementara; setelah batas, kirim ke DLT.</li></ul><p>Di sisi lain, <b>consumer idempoten</b> membuat pengulangan aman: karena at-least-once bisa memproses record dua kali, simpan <code>event_id</code>/key dan gunakan <b>upsert</b> — hasil akhirnya sama walau diproses ulang.</p>'
    },
    {
      type: 'example',
      title: 'Rantai aman: validasi → DLT → commit',
      lang: 'java',
      output: false,
      code: `for (ConsumerRecord<String, JsonNode> r : records) {
    JsonNode payload;
    try {
        payload = parser.readTree(r.value());
        wajibAda(payload, "event_id", "event_type");
    } catch (Exception e) {
        // poison pill: salin ke topic DLT, JANGAN hentikan alur
        kirimKeDeadLetter(r, e);
        log.warn("record rusak dialihkan ke DLT: offset {}", r.offset());
        continue;                        // lanjut ke record berikutnya
    }
    try {
        upsertBerdasarkanEventId(payload);   // idempoten: aman diproses ulang
    } catch (Exception e) {
        log.error("proses gagal untuk {}", payload.get("event_id"), e);
        throw e;                            // hentikan batch: jangan commit
    }
}

// DLT sendiri punya consumer yang memantau dan mengirim alert
// (dibahas lengkap di pelajaran Error Handling & Dead Letter Topic)`,
      explain: [
        'Pemisahan <b>kegagalan format (rusak)</b> dan <b>kegagalan proses (error sistem)</b> penting: yang rusak dialihkan agar tidak menghambat, yang sistem error menghentikan komit agar diproses ulang.',
        'Dengan offset tetap dicommit setelah record rusak dialihkan, consumer <b>tidak terjebak</b> pada poison pill — alur berlanjut dan record tetap tersimpan untuk diperiksa.',
        'Idempotensi lewat <b>upsert berdasarkan event_id</b> membuat pembacaan ulang tidak menggandakan data.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan consumer di aplikasi',
      text: '<ul><li><b>auto commit dibiarkan aktif</b> untuk pemrosesan kritis — record bisa terlewat tanpa diproses.</li><li><b>Batch tanpa batas</b> — proses melewati max.poll.interval.ms → rebalance berulang.</li><li><b>Commit sebelum selesai</b> — record hilang dari antrean.</li><li><b>Tanpa idempotensi</b> — at-least-once memproses ulang, data jadi ganda.</li><li><b>Poison pill menghambat seluruh alur</b> — satu record rusak membuat konsumsi mandek tanpa mekanisme DLT.</li><li><b>Exception tak tertangani menutup proses</b> — rebalance mendadak dan lag melonjak.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Checklist consumer sebelum production',
      text: '<p>Lima hal yang layak dicek: (1) <code>enable.auto.commit=false</code> dan komit eksplisit, (2) <code>max.poll.records</code> diatur agar batch cepat selesai, (3) deserialisasi &amp; parsing dibungkus try-catch dengan jalur DLT, (4) pemrosesan idempoten (upsert), (5) <code>auto.offset.reset</code> disengaja (bukan default tak sadar). Semuanya dibaca ulang dengan cepat di pelajaran Error Handling.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['poll()', 'Mengambil batch record dari partition yang ditugaskan.'],
        ['max.poll.records', 'Jumlah record maksimum yang diambil per poll.'],
        ['commitSync', 'Commit yang menunggu hasil broker (bisa ditangani errornya).'],
        ['commitAsync', 'Commit non-bloking; kegagalan masuk callback, terakhir menang.'],
        ['Poison pill', 'Record yang selalu membuat pemrosesan gagal.'],
        ['Dead-letter topic', 'Topic tujuan record bermasalah agar alur tetap berlanjut.'],
        ['Idempoten', 'Memproses ulang data tidak mengubah hasil akhir.'],
        ['Upsert', 'Insert bila belum ada, update bila sudah — kunci idempotensi.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Bandingkan <b>earliest</b> dan <b>latest</b>: kapan masing-masing tepat, dan mengapa keduanya hanya berlaku sebelum ada committed offset?</li><li>Baca record dari <b>waktu tertentu</b> (epoch millis) lalu buktikan isinya dengan <code>--partition --offset</code>.</li><li>Tulis ulang siklus consumer dalam 4 langkah dan sebutkan dua perangkap di tiap tahap.</li><li>Bandingkan <code>commitSync</code> dan <code>commitAsync</code>: kapan memakai masing-masing?</li><li>Skenario poison pill: apa yang terjadi tanpa DLT, dan bagaimana DLT menyelamatkannya? Buktikan idempotensi dengan upsert dua kali.</li></ol>'
    }
  ],
  recap: [
    'Titik awal baca: <b>earliest</b> (riwayat penuh), <b>latest</b> (record baru), <b>timestamp/seek</b> (presisi) — hanya berlaku saat <b>belum ada committed offset</b>.',
    'Siklus consumer: <b>poll → proses → commit</b> — komit hanya setelah proses tuntas, batch dibatasi lewat <code>max.poll.records</code>.',
    '<b>commitAsync</b> untuk kommit ringan berkala, <b>commitSync</b> sebagai jaminan akhir batch; <b>poison pill</b> dialihkan ke <b>dead-letter topic</b> lalu tetap commit.',
    '<b>Consumer idempoten</b> (upsert berdasarkan event_id) membuat at-least-once aman tanpa data ganda.'
  ]
});
