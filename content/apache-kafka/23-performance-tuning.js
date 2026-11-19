/* ============================================================
   Pelajaran Apache Kafka — 23: Performance Tuning
   ============================================================ */
'use strict';

window.KAFKA_LESSONS = window.KAFKA_LESSONS || [];

window.KAFKA_LESSONS.push({
  id: 'performance-tuning',
  title: 'Performance Tuning',
  chapter: 'Produksi',
  duration: '15 menit',
  intro: [
    'Kafka mampu menangani jutaan record per detik, tetapi angka itu tidak datang sendirian: ia adalah hasil dari keputusan konfigurasi yang tepat di tiga tempat — <b>producer</b> (batching dan kompresi), <b>broker</b> (partition, I/O, jaringan), dan <b>consumer</b> (paralelisme dan pemrosesan). Salah satu pilihan di antaranya bisa mengubah throughput dari ratusan ribu menjadi puluhan ribu record per detik tanpa tanda-tanda yang jelas di log.',
    'Pelajaran ini menyusun pendekatan tuning yang benar: <b>ukur dulu, ubah satu variabel</b>, lalu pahami peran masing-masing konfigurasi kunci — <code>batch.size</code>, <code>linger.ms</code>, kompresi, jumlah partition, paralelisme consumer — beserta bottleneck paling lazim dan cara mengatasinya secara sistematis.'
  ],
  objectives: [
    'Menerapkan metodologi tuning: mengukur baseline, mengubah satu variabel, dan membandingkan hasil',
    'Mengatur batching dan kompresi di producer untuk throughput tinggi',
    'Mengoptimalkan jumlah partition, paralelisme consumer, dan I/O broker',
    'Mengenali bottleneck umum dan cara menanganinya secara sistematis'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Metodologi: ukur, ubah satu hal, bandingkan</h3><p>Tuning tanpa pengukuran adalah tebakan. Urutan kerja yang benar:</p><ol><li><b>Tentukan metrik target</b> — throughput (record/detik), latency p99, atau keduanya. Target yang berbeda menuntut konfigurasi yang bertentangan.</li><li><b>Ukur baseline</b> — jalankan beban uji yang mewakili produksi, catat angka awal.</li><li><b>Ubah satu variabel</b> — lalu ukur ulang. Mengubah tiga hal sekaligus membuat kamu tidak tahu mana yang membantu.</li><li><b>Bandingkan dan putuskan</b> — pertahankan yang membaik, kembalikan yang tidak.</li></ol><p>Peringatan penting: <b>throughput dan latency adalah trade-off</b>. Menggabungkan record menjadi batch besar menaikkan throughput tetapi menambah latency (record menunggu di batch). Jika layananmu menuntut respons cepat, jangan mengejar angka throughput tanpa melihat latency p99-nya.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 330" width="760" role="img" aria-label="Pipeline throughput Kafka dari producer melalui batching dan kompresi ke broker lalu consumer dengan titik pengukuran">
        <rect x="20" y="30" width="160" height="80" rx="8" class="u-hd"/>
        <text x="100" y="58" class="u-title" text-anchor="middle">Producer</text>
        <text x="100" y="82" class="u-lbl" text-anchor="middle">record/detik masuk</text>
        <text x="100" y="102" class="u-lbl" text-anchor="middle">[ukur 1]</text>
        <line x1="186" y1="70" x2="230" y2="70" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="236" y="20" width="200" height="100" rx="8" class="u-box"/>
        <text x="336" y="48" class="u-title" text-anchor="middle">Batching + kompresi</text>
        <text x="336" y="74" class="u-lbl" text-anchor="middle">batch.size · linger.ms</text>
        <text x="336" y="98" class="u-lbl" text-anchor="middle">compression.type=lz4</text>
        <line x1="442" y1="70" x2="486" y2="70" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="492" y="20" width="248" height="100" rx="8" class="u-box"/>
        <text x="616" y="48" class="u-title" text-anchor="middle">Broker</text>
        <text x="616" y="74" class="u-lbl" text-anchor="middle">append ke disk · replikasi ISR</text>
        <text x="616" y="98" class="u-lbl" text-anchor="middle">[ukur: p99 produce &amp; disk I/O]</text>
        <line x1="616" y1="126" x2="616" y2="166" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="492" y="172" width="248" height="100" rx="8" class="u-hd"/>
        <text x="616" y="200" class="u-title" text-anchor="middle">Consumer</text>
        <text x="616" y="226" class="u-lbl" text-anchor="middle">fetch · poll · proses</text>
        <text x="616" y="250" class="u-lbl" text-anchor="middle">[ukur: lag &amp; records-lag-max]</text>
        <line x1="486" y1="222" x2="442" y2="222" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="236" y="172" width="200" height="100" rx="8" class="u-box"/>
        <text x="336" y="200" class="u-title" text-anchor="middle">Paralelisme</text>
        <text x="336" y="226" class="u-lbl" text-anchor="middle">jumlah partition</text>
        <text x="336" y="250" class="u-lbl" text-anchor="middle">consumer per group</text>
        <rect x="20" y="290" width="720" height="34" rx="6" class="u-hd"/>
        <text x="380" y="312" class="u-lbl" text-anchor="middle">ubah SATU variabel → ukur ulang → bandingkan (throughput vs latency p99)</text>
      </svg></div><figcaption>Titik pengukuran di producer, broker, dan consumer memperlihatkan di mana throughput terhambat.</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Producer: batching, kompresi, acknowledgments</h3><ul><li><b>batch.size</b> — ukuran maksimum batch (default 16 KB). Lebih besar = lebih sedikit request, throughput naik — tetapi juga menaikkan latency dan penggunaan memori.</li><li><b>linger.ms</b> — berapa lama producer menunggu sebelum mengirim batch yang belum penuh (default 0). Nilai kecil (5–100 ms) memberi jeda kecil yang menghasilkan batch lebih besar dan throughput jauh lebih tinggi.</li><li><b>compression.type</b> — <code>lz4</code> atau <code>snappy</code> untuk kecepatan, <code>zstd</code> untuk rasio terbaik. Kompresi mengurangi penggunaan jaringan dan disk sekaligus — seringkali menaikkan throughput end-to-end.</li><li><b>acks</b> — <code>all</code> untuk keamanan (lihat pelajaran durability), dengan <code>enable.idempotence=true</code> agar retry tidak menghasilkan duplikat.</li><li><b>buffer.memory</b> — antrian record di memori sebelum dikirim; terlalu kecil membuat producer memblokir.</li></ul><p>Aturan praktis: untuk throughput tinggi, mulai dari <b>linger.ms 5–50 ms + batch besar + lz4</b>, lalu turunkan latency bila p99 melebihi target.</p>'
    },
    {
      type: 'example',
      title: 'Konfigurasi producer untuk throughput tinggi',
      lang: 'java',
      output: false,
      code: `Properties props = new Properties();
props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "kafka1:9092,kafka2:9092");
props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());

// batching & throughput
props.put(ProducerConfig.BATCH_SIZE_CONFIG, 65536);          // 64 KB
props.put(ProducerConfig.LINGER_MS_CONFIG, 20);              // tunggu 20 ms
props.put(ProducerConfig.BUFFER_MEMORY_CONFIG, 67108864);    // 64 MB antrian
props.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "lz4");    // kompresi cepat

// keamanan + efisiensi retry
props.put(ProducerConfig.ACKS_CONFIG, "all");
props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
props.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, 5);

// pemisahan paralelisme
props.put(ProducerConfig.MAX_REQUEST_SIZE_CONFIG, 1048576);  // 1 MB per request`,
      explain: [
        '<code>linger.ms=20</code> berarti producer rela menunggu 20 ms agar batch lebih penuh — perubahan paling berdampak untuk throughput pada beban tinggi, dengan biaya latency yang masih kecil.',
        '<code>batch.size</code> dinaikkan dari 16 KB ke 64 KB agar headroom batch besar tersedia ketika volume melonjak; nilai terlalu besar hanya membuang memori bila beban rendah.',
        '<b>Kompresi lz4</b> menekan data di sisi producer dan memperkecil ukuran jaringan/disk — pada topik dengan payload besar, ini sering menjadi peningkatan throughput terbesar dengan usaha terkecil.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Broker: partition, disk, dan jaringan</h3><ul><li><b>Jumlah partition</b> — unit paralelisme. Terlalu sedikit = broker dan consumer tidak bisa bekerja paralel; terlalu banyak = jumlah file terbuka, memori index, dan waktu leader election bertambah. Mulai dari <b>3–6 per broker per topik</b> dan tambah hanya bila dibuktikan perlu.</li><li><b>Disk</b> — sequential append membuat SSD/NVMe sangat cocok; pisahkan <code>log.dirs</code> ke beberapa disk agar I/O menyebar. Pantau IOPS dan latensi I/O saat compaction berjalan.</li><li><b>Jaringan</b> — throughput broker dibatasi bandwidth; perhatikan <code>num.network.threads</code> dan <code>num.io.threads</code> agar permintaan tidak menumpuk.</li><li><b>Retensi &amp; segment</b> — segment terlalu kecil membuat banyak file; terlalu besar menunda penghapusan. Default 1 GB adalah titik awal wajar.</li></ul>'
    },
    {
      type: 'example',
      title: 'Konfigurasi broker dan consumer',
      lang: 'text',
      output: false,
      code: `BROKER (server.properties)
  num.network.threads=8
  num.io.threads=16
  log.dirs=/data/kafka1,/data/kafka2
  log.segment.bytes=1073741824
  log.flush.interval.messages=10000
  default.replication.factor=3
  min.insync.replicas=2

CONSUMER (Java)
  props.put(ConsumerConfig.FETCH_MIN_BYTES_CONFIG, 1);        // 1 = segera
  props.put(ConsumerConfig.FETCH_MAX_WAIT_MS_CONFIG, 500);    // 500 ms maks
  props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 500);     // batas per poll
  props.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, 300000);
  props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);

ANALISIS PARALELISME
  throughput target      200.000 record/detik
  kapasitas 1 consumer   ~30.000 record/detik (tergantung proses)
  → butuh minimal        7 consumer
  → siapkan partition    >= 8 (idealnya kelipatan jumlah consumer)

KAPAN MENAMBAH PARTITION
  ✓ lag konsisten tinggi walau consumer sudah maksimal
  ✓ satu partisi jauh lebih panjang dari lainnya (skew)
  ✗ saat belum yakin penyebabnya adalah paralelisme`,
      explain: [
        '<b>fetch.min.bytes</b> kecil membuat broker merespons segera (latensi rendah), sementara <b>fetch.max.wait.ms</b> membatasi berapa lama consumer menunggu ketika tidak ada data — kombinasi keduanya mengatur keseimbangan latency dan efisiensi fetch.',
        'Perhitungan paralelisme menunjukkan aturan praktis: <b>jumlah partisi ≥ jumlah consumer</b>, dan idealnya kelipatan agar beban terbagi rata — menambah consumer melebihi partisi tidak menambah paralelisme apa pun.',
        'Menambah partition adalah keputusan yang <b>tidak bisa dibatalkan dengan mudah</b>: perubahan ini mengubah hasil hash key sehingga record bisa berpindah partisi — lakukan hanya saat bottleneck paralelisme sudah terbukti.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Consumer: paralelisme dan pemrosesan</h3><ul><li><b>Jumlah consumer ≤ partition</b> — satu consumer per partition dalam satu group adalah batas paralelisme alami.</li><li><b>max.poll.records</b> — batas record per poll; kecil = latensi komit rendah, besar = efisiensi tinggi tetapi rentan <b>rebalance</b> bila proses lambat.</li><li><b>Pemrosesan luar batch</b> — jika memproses butuh waktu lama, pindahkan ke thread/queue terpisah; jangan menahan poll.</li><li><b>Multi-group</b> — beberapa jenis pekerjaan berbeda memakai group berbeda agar tidak saling menunggu.</li></ul><p>Anti-pattern klasik: satu consumer menangani semua pekerjaan dengan <code>max.poll.records</code> besar dan pemrosesan lambat → lag tumbuh → rebalance → makin lambat. Solusinya: kurangi batch, percepat pemrosesan, atau tambah partisi + consumer.</p>'
    },
    {
      type: 'text',
      html: '<h3>Bottleneck umum dan cara mengatasinya</h3><table><thead><tr><th>Gejala</th><th>Kemungkinan penyebab</th><th>Tindakan</th></tr></thead><tbody><tr><td>Throughput producer rendah</td><td>Batch kecil, tanpa kompresi, linger 0</td><td>Naikkan <code>linger.ms</code> &amp; <code>batch.size</code>, aktifkan lz4</td></tr><tr><td>Latensi p99 melonjak</td><td>Batch terlalu besar, I/O disk jenuh, jaringan penuh</td><td>Kecilkan batch, periksa disk &amp; bandwidth</td></tr><tr><td>Lag consumer terus naik</td><td>Consumer kurang, proses lambat, partisi tidak cukup</td><td>Percepat pemrosesan; tambah partisi bila terbukti</td></tr><tr><td>Broker CPU tinggi</td><td>Terlalu banyak partisi, kompresi berat, replikasi tertinggal</td><td>Kurangi partisi, cek ISR, pantau compaction</td></tr><tr><td>Disk I/O tinggi</td><td>Retensi panjang, compaction, banyak consumer lama</td><td>Sesuaikan retensi, jadwalkan compaction, audit consumer</td></tr></tbody></table>'
    },
    {
      type: 'warn',
      title: 'Kesalahan tuning yang paling merugikan',
      text: '<ul><li><b>Tuning tanpa baseline</b> — perubahan tidak bisa dinilai tanpa angka awal dan akhir.</li><li><b>Mengejar throughput tanpa melihat latency</b> — pengguna akhir merasakan latency, bukan angka aggregate.</li><li><b>Menambah partisi setiap kali lag naik</b> — padahal penyebabnya pemrosesan lambat; partisi tidak mempercepat kode yang lambat.</li><li><b>Menyalakan semua optimasi sekaligus</b> — sulit mengetahui mana yang membantu dan mana yang merugikan.</li><li><b>Mengabaikan efek compaction dan replikasi</b> — tuning throughput percuma bila I/O terbagi untuk pekerjaan latar.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Checklist urutan tuning',
      text: '<p>(1) <b>Ukur baseline</b> throughput + latency p99. (2) <b>Producer</b>: linger.ms 5–50, batch besar, lz4 — sering kali ini sudah menaikkan angka dua kali lipat. (3) <b>Paralelisme</b>: pastikan partisi ≥ consumer yang dibutuhkan dari perhitungan sederhana. (4) <b>Consumer</b>: batasi max.poll.records, pindahkan pekerjaan berat keluar dari poll. (5) <b>Broker</b>: I/O threads, disk terpisah, pantau IOPS saat beban puncak. (6) <b>Ukur ulang dan bandingkan</b> — hanya pertahankan perubahan yang terbukti.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Batching', 'Menggabungkan banyak record menjadi satu request untuk efisiensi.'],
        ['linger.ms', 'Waktu tunggu producer agar batch lebih penuh sebelum dikirim.'],
        ['Kompresi', 'Memperkecil ukuran payload (lz4, snappy, zstd) untuk I/O lebih hemat.'],
        ['Throughput', 'Jumlah record yang berhasil diproses per satuan waktu.'],
        ['Latency p99', '99 persen request lebih cepat dari nilai ini — mendeteksi ekor panjang.'],
        ['Paralelisme', 'Jumlah kerja yang bisa berjalan bersamaan (partition × consumer).'],
        ['Bottleneck', 'Titik paling lambat yang membatasi seluruh sistem.'],
        ['Skew', 'Beban tidak merata antarpartition atau antarkey.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Uraikan metodologi tuning dalam 4 langkah dan mengapa mengubah satu variabel penting.</li><li>Jelaskan hubungan <code>linger.ms</code>, <code>batch.size</code>, throughput, dan latency.</li><li>Hitung kebutuhan partition: target 500 ribu record/detik, satu consumer menangani 40 ribu — berapa minimal? Apa yang terjadi bila consumer ditambah melebihi partition?</li><li>Gejala lag naik terus — sebutkan tiga kemungkinan penyebab dan cara membedakannya.</li><li>Kapan kompresi justru memperburuk latency, dan kapan ia justru memperbaikinya?</li></ol>'
    }
  ],
  recap: [
    '<b>Ukur baseline → ubah satu variabel → ukur ulang → bandingkan</b> — tuning tanpa pengukuran adalah tebakan.',
    'Producer: <b>linger.ms + batch.size + kompresi</b> adalah tuas throughput terbesar; latency adalah biayanya.',
    'Paralelisme: <b>partition ≥ consumer</b> yang dibutuhkan; menambah partisi mengubah hash key dan sulit dibatalkan.',
    'Kenali bottleneck: <b>gejala → penyebab → tindakan</b> — lag naik bukan selalu berarti kurang partisi.'
  ]
});
