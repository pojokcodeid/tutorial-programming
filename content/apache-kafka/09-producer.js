/* ============================================================
   Pelajaran Apache Kafka — 12: Producer: Key, Batching & Acks
   ============================================================ */
'use strict';

window.KAFKA_LESSONS = window.KAFKA_LESSONS || [];

window.KAFKA_LESSONS.push({
  id: 'producer',
  title: 'Producer: Key, Batching & Acks',
  chapter: 'Producer & Consumer',
  duration: '15 menit',
  intro: [
    'Producer adalah gerbang masuknya data ke Kafka, dan tiga keputusannya menentukan segalanya: <b>key apa</b> yang dipakai (penempatan partition), <b>seberapa besar batch</b> (throughput vs latensi), dan <b>berapa banyak acks</b> (kepastian data). Kesalahan di salah satu area akan terasa jelas: data menumpuk di satu partition, throughput anjlok, atau record hilang diam-diam.',
    'Pelajaran ini membongkar sisi producer: alur pengiriman dari serialize → partitioner → accumulator → IO, konfigurasi batching (<code>batch.size</code>, <code>linger.ms</code>), pilihan acks (0/1/all), retries & idempotence, serta strategi menangani record gagal dengan producer callback.'
  ],
  objectives: [
    'Menguraikan alur pengiriman record dari producer hingga diterima broker',
    'Menjelaskan cara kerja accumulator dan pengaruh batch.size serta linger.ms',
    'Memilih acks yang tepat sesuai kebutuhan kepastian data',
    'Menjelaskan retries, enable.idempotence, dan penanganan record gagal via callback'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Alur pengiriman record di producer</h3><p>Ketika kamu memanggil <code>send()</code>, perjalanan record melewati beberapa tahap:</p><ol><li><b>Serialize</b> — key dan value diubah menjadi byte oleh serializer (StringSerializer, JsonSerializer, dll).</li><li><b>Partitioner</b> — menentukan partition tujuan: hash(key) % jumlah partition; bila tanpa key, memakai sticky partitioner.</li><li><b>Accumulator</b> — record dikumpulkan per partition menjadi <b>batch</b> sebelum dikirim (bukan per record!)</li><li><b>Sender thread / IO</b> — begitu batch penuh atau <code>linger.ms</code> habis, batch dikirim ke broker leader partition itu.</li><li><b>Acknowledgement</b> — broker mengonfirmasi sesuai <code>acks</code>; bila gagal, <b>retries</b> dijalankan sesuai konfigurasi.</li></ol><p>Pemahaman kuncinya: <b>producer mengirim dalam batch, bukan per record</b>. Di sinilah asal-usul pengaturan throughput dan latensi.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 330" width="760" role="img" aria-label="Alur record di producer: serialize, partitioner, accumulator, pengiriman batch ke broker, lalu acknowledgement">
        <rect x="20" y="30" width="130" height="64" rx="8" class="u-hd"/>
        <text x="85" y="56" class="u-title" text-anchor="middle">send()</text>
        <text x="85" y="80" class="u-lbl" text-anchor="middle">key + value</text>
        <line x1="156" y1="62" x2="206" y2="62" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="212" y="30" width="140" height="64" rx="8" class="u-box"/>
        <text x="282" y="56" class="u-title" text-anchor="middle">Serializer</text>
        <text x="282" y="80" class="u-lbl" text-anchor="middle">key/value → byte</text>
        <line x1="358" y1="62" x2="408" y2="62" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="414" y="30" width="150" height="64" rx="8" class="u-box"/>
        <text x="489" y="56" class="u-title" text-anchor="middle">Partitioner</text>
        <text x="489" y="80" class="u-lbl" text-anchor="middle">hash(key) % N</text>
        <line x1="570" y1="62" x2="620" y2="62" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="626" y="30" width="114" height="64" rx="8" class="u-box"/>
        <text x="683" y="56" class="u-title" text-anchor="middle">Accumulator</text>
        <text x="683" y="80" class="u-lbl" text-anchor="middle">per partition</text>
        <line x1="683" y1="100" x2="683" y2="134" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="470" y="140" width="270" height="70" rx="8" class="u-hd"/>
        <text x="605" y="166" class="u-title" text-anchor="middle">Batch siap kirim</text>
        <text x="605" y="192" class="u-lbl" text-anchor="middle">penuh (batch.size) ATAU linger.ms habis</text>
        <line x1="464" y1="175" x2="404" y2="175" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="212" y="140" width="186" height="70" rx="8" class="u-box"/>
        <text x="305" y="166" class="u-title" text-anchor="middle">Broker (leader)</text>
        <text x="305" y="192" class="u-lbl" text-anchor="middle">tulis ke partition</text>
        <line x1="305" y1="216" x2="305" y2="250" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="20" y="256" width="720" height="56" rx="8" class="u-hd"/>
        <text x="380" y="280" class="u-title" text-anchor="middle">Ack: acks=0 | acks=1 | acks=all</text>
        <text x="380" y="302" class="u-lbl" text-anchor="middle">gagal → retries (backoff) → masih gagal → callback error ke aplikasi</text>
      </svg></div><figcaption>Producer menumpuk record per partition dalam batch, mengirim saat penuh/linger, lalu menangani ack dan retry.</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Batching: batch.size dan linger.ms</h3><p>Dua konfigurasi ini bekerja bersama menentukan kapan batch dikirim:</p><table><thead><tr><th>Konfigurasi</th><th>Default</th><th>Fungsi</th></tr></thead><tbody><tr><td><code>batch.size</code></td><td>16384 (16 KB)</td><td>Ukuran maksimum batch per partition (byte). Penuh → langsung kirim.</td></tr><tr><td><code>linger.ms</code></td><td>0</td><td>Berapa lama producer menunggu sebelum mengirim walau batch belum penuh.</td></tr></tbody></table><p>Dilemanya klasik:</p><ul><li><b>linger.ms = 0</b> (default) — kirim segera → <b>latensi rendah</b>, tetapi batch kecil → overhead per request besar → <b>throughput lebih rendah</b>.</li><li><b>linger.ms lebih besar (mis. 5–50 ms)</b> — menunggu sedikit → batch lebih besar → <b>throughput naik</b>, latensi bertambah sedikit.</li></ul><p>Untuk high throughput, umumnya menaikkan <code>batch.size</code> (mis. 32–64 KB) dan <code>linger.ms</code> kecil positif; untuk latensi kritis (mis. bidding), biarkan <code>linger.ms</code> rendah.</p>'
    },
    {
      type: 'example',
      title: 'Konfigurasi producer: throughput vs latensi',
      lang: 'java',
      output: false,
      code: `Properties props = new Properties();
props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class.getName());

// --- mode HIGH THROUGHPUT ---
props.put(ProducerConfig.LINGER_MS_CONFIG, "20");            // tunggu 20ms agar batch penuh
props.put(ProducerConfig.BATCH_SIZE_CONFIG, "65536");         // 64 KB per batch
props.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "lz4");     // kompresi batch
props.put(ProducerConfig.BUFFER_MEMORY_CONFIG, "33554432");   // 32 MB accumulator

// --- mode LOW LATENCY (alternatif) ---
// props.put(ProducerConfig.LINGER_MS_CONFIG, "0");
// props.put(ProducerConfig.BATCH_SIZE_CONFIG, "16384");
// props.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "none");

// --- kepastian & keamanan ---
props.put(ProducerConfig.ACKS_CONFIG, "all");
props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, "true");
props.put(ProducerConfig.RETRIES_CONFIG, "10");
props.put(ProducerConfig.RETRY_BACKOFF_MS_CONFIG, "100");

KafkaProducer<String, JsonNode> producer = new KafkaProducer<>(props);`,
      explain: [
        'Pengaturan throughput memakai <b>linger.ms &gt; 0 + batch lebih besar + kompresi</b> — record ditumpuk dulu sehingga tiap request membawa lebih banyak data dan overhead jaringan terbagi rata.',
        'Mode latensi rendah membalikkannya: kirim secepat mungkin, biarkan batch kecil — cocok bila setiap milidetik berharga.',
        '<code>acks=all</code> + <code>enable.idempotence=true</code> adalah kombinasi keamanan tulis; keduanya dibahas lebih lanjut di bagian retries.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Acks: memilih tingkat kepastian</h3><p>Singkatnya (detail lengkap di pelajaran Replication):</p><ul><li><b>acks=0</b> — tanpa konfirmasi; risiko hilang tanpa kabar, latensi terendah.</li><li><b>acks=1</b> — cukup leader menulis; risiko kehilangan saat leader mati sebelum tersalin.</li><li><b>acks=all</b> — seluruh ISR (sesuai min.insync.replicas) mengonfirmasi; paling aman.</li></ul><p>Untuk hampir semua sistem bisnis (order, pembayaran, akun), <b>pakai acks=all</b>. <code>acks=0</code> hanya untuk metrik yang bila hilang tidak berpengaruh apa pun.</p>'
    },
    {
      type: 'text',
      html: '<h3>Retries dan idempotence</h3><p>Ketika pengiriman gagal (broker sedang pindah leadership, jaringan terputus sesaat), producer melakukan <b>retry</b> dengan backoff. Di sinilah masalah halus muncul: retry bisa membuat record <b>terkirim dua kali</b> atau <b>tiba tidak berurutan</b>.</p><p>Solusinya adalah <b>enable.idempotence=true</b>: producer memberi <b>sequence number</b> pada tiap batch per partition, dan broker menduplikasi berdasarkan sequence tersebut — sehingga record tidak dobel, tidak bolak-balik, walau ada retry.</p><ul><li>Idempotence aktif → <code>acks</code> otomatis <code>all</code>, <code>retries</code> maksimal (Integer.MAX_VALUE), <code>max.in.flight.requests.per.connection</code> maksimal 5.</li><li>Untuk skenario butuh <b>urutan persis</b> antar record dalam partition, tambahkan <code>max.in.flight.requests.per.connection=1</code> (latensi sedikit naik).</li></ul>'
    },
    {
      type: 'example',
      title: 'Producer callback: menangani record gagal',
      lang: 'java',
      output: false,
      code: `producer.send(record, (metadata, exception) -> {
    if (exception != null) {
        // record TIDAK sampai: putuskan kebijakan gagal kamu
        log.error("gagal kirim ke {}-{} : {}",
            record.topic(), record.partition(), exception.getMessage());
        simpanKeDeadLetter(record, exception);   // mis. tulis ke topic DLT / lokal
        return;
    }
    // sukses: metadata berisi partition & offset tujuan
    log.debug("ok {}-{} @{}", metadata.topic(), metadata.partition(), metadata.offset());
});

// tunggu seluruh antrean terkirim sebelum shutdown
producer.flush();
producer.close();`,
      explain: [
        '<b>Callback adalah satu-satunya cara mengetahui</b> apakah record sampai — tanpanya, record yang gagal hilang diam-diam.',
        'Kebijakan yang umum: beberapa kali retry internal → bila tetap gagal, <b>simpan ke dead-letter topic atau penyimpanan lokal</b> agar tidak lenyap, lalu monitor.',
        '<code>flush()</code> sebelum <code>close()</code> memastikan seluruh batch di accumulator terkirim — tanpanya, program bisa exit membawa data yang belum terkirim.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan producer yang sering terjadi',
      text: '<ul><li><b>Mengabaikan callback</b> — error pengiriman tidak pernah terlihat sampai data hilang diketahui.</li><li><b>acks=1 untuk data kritis</b> — terasa cepat, tetapi satu kegagalan leader = data raib.</li><li><b>Serializer salah</b> — key/value tidak cocok dengan tipe yang diharapkan consumer; error sering muncul di consumer, bukan producer.</li><li><b>Tanpa idempotence + retries tinggi</b> — risiko duplikat dan reordering saat broker bermasalah.</li><li><b>flush() tidak pernah dipanggil</b> — shutdown mendadak membuat sebagian antrean tidak terkirim.</li><li><b>Satu producer dipakai lintas banyak topik tanpa key jelas</b> — pemetaan partition jadi tak terkontrol.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Ukur, jangan menebak',
      text: '<p>Uji dampak konfigurasi dengan beban nyata: kirim N record sambil mencatat <b>throughput (record/detik)</b> dan <b>latensi end-to-end (p95/p99)</b>. Naikkan <code>linger.ms</code> bertahap (0 → 5 → 20 → 50) dan amati kapan throughput berhenti naik sementara latensi terus membesar — titik itulah pilihan terbaik untuk sistem kamu.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Serializer', 'Mengubah key/value menjadi byte sebelum dikirim.'],
        ['Partitioner', 'Menentukan partition tujuan record.'],
        ['Accumulator', 'Penampung batch record per partition di memori producer.'],
        ['batch.size', 'Ukuran maksimum batch (byte) yang dikirim per partition.'],
        ['linger.ms', 'Waktu tunggu sebelum batch dikirim walau belum penuh.'],
        ['acks', 'Tingkat kepastian konfirmasi tulis dari broker.'],
        ['Idempotence', 'Sifat pengiriman ulang yang tidak menghasilkan duplikat.'],
        ['max.in.flight', 'Jumlah request yang dikirim tanpa menunggu jawaban.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Urutkan 5 tahap perjalanan record dari <code>send()</code> hingga acknowledgement.</li><li>Jelaskan hubungan <code>batch.size</code> dan <code>linger.ms</code>; apa yang terjadi bila linger dinaikkan?</li><li>Kapan kamu memilih <code>acks=all</code> dan kapan <code>acks=0</code> masih bisa dibenarkan?</li><li>Mengapa <code>enable.idempotence=true</code> mengurangi risiko duplikat saat retry? Jelaskan mekanismenya.</li><li>Praktikkan callback: hentikan broker saat producer mengirim, amati pesan error pada callback.</li></ol>'
    }
  ],
  recap: [
    'Alur producer: <b>serialize → partitioner → accumulator (batch) → kirim → ack/retry</b> — pengiriman selalu berbasis batch, bukan per record.',
    '<b>batch.size</b> (ukuran maks) dan <b>linger.ms</b> (waktu tunggu) menyeimbangkan <b>throughput vs latensi</b>; kompresi memperbesar manfaat batch besar.',
    '<b>acks=0/1/all</b>: pilih sesuai kebutuhan kepastian — untuk data bisnis, <b>acks=all</b>.',
    '<b>Retries + idempotence</b> menghindari duplikat/reorder; <b>callback</b> + <b>flush()</b> memastikan record tidak hilang diam-diam.'
  ]
});
