/* ============================================================
   Pelajaran Apache Kafka — 09: Consumer Group & Rebalancing
   ============================================================ */
'use strict';

window.KAFKA_LESSONS = window.KAFKA_LESSONS || [];

window.KAFKA_LESSONS.push({
  id: 'consumer-group',
  title: 'Consumer Group & Rebalancing',
  chapter: 'Konsumsi Data',
  duration: '15 menit',
  intro: [
    'Consumer group adalah mekanisme yang membuat Kafka mampu memproses data secara paralel tanpa kehilangan rekaman: beberapa proses consumer bekerja bersama, tiap partition dibagi rata, dan tidak ada record yang diproses dua kali oleh group yang sama. Namun begitu ada consumer baru bergabung atau consumer lama keluar, pembagian harus dihitung ulang — dan di situlah istilah <b>rebalancing</b> muncul.',
    'Pelajaran ini membahas bagaimana group bekerja, alur rebalancing beserta prosedur join dan sync, strategi partition assignment (Range dan RoundRobin), penyebab rebalance tak terduga, hingga cooperative sticky assignment yang mengurangi gangguan.'
  ],
  objectives: [
    'Menjelaskan cara consumer group membagi partition secara eksklusif',
    'Menguraikan alur rebalancing: join group, sync, assignment, dan resume',
    'Membandingkan strategi assignment Range, RoundRobin, dan CooperativeSticky',
    'Mengenali penyebab rebalance tak terduga dan cara meminimalkannya'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Bagaimana satu group bekerja</h3><p>Setiap consumer dalam group memakai <b>group.id yang sama</b>. Saat bergabung, Kafka membagi seluruh partition topic yang diikuti secara <b>eksklusif</b>: satu partition hanya ditugaskan ke <b>maksimal satu consumer dalam satu group</b> pada satu waktu. Dengan begitu:</p><ul><li>Tidak ada record yang diproses dua kali oleh group yang sama (tanpa duplikasi internal).</li><li>Tidak ada partition yang terlewat — selalu ada yang bertugas.</li><li>Group berbeda saling independen — masing-masing membaca dari posisinya sendiri.</li></ul><p>Karena itu jumlah consumer yang <b>berguna</b> per group tidak boleh melebihi jumlah partition: consumer tambahan akan duduk idle tanpa tugas.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 320" width="760" role="img" aria-label="Consumer group membagi tiga partition ke dua consumer lalu melakukan rebalancing saat consumer baru bergabung">
        <rect x="20" y="20" width="352" height="130" rx="10" class="u-box"/>
        <text x="196" y="46" class="u-title" text-anchor="middle">Sebelum rebalance (group: analytics)</text>
        <line x1="34" y1="56" x2="358" y2="56" class="u-line"/>
        <rect x="34" y="70" width="96" height="60" rx="6" class="u-hd"/>
        <text x="82" y="94" class="u-lbl" text-anchor="middle">P0</text>
        <text x="82" y="116" class="u-lbl" text-anchor="middle">consumer-a</text>
        <rect x="142" y="70" width="96" height="60" rx="6" class="u-hd"/>
        <text x="190" y="94" class="u-lbl" text-anchor="middle">P1</text>
        <text x="190" y="116" class="u-lbl" text-anchor="middle">consumer-b</text>
        <rect x="250" y="70" width="96" height="60" rx="6" class="u-box"/>
        <text x="298" y="94" class="u-lbl" text-anchor="middle">P2</text>
        <text x="298" y="116" class="u-lbl" text-anchor="middle">consumer-b</text>
        <line x1="196" y1="156" x2="196" y2="186" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="196" y="176" class="u-lbl" text-anchor="middle">consumer-c bergabung</text>
        <rect x="388" y="20" width="352" height="130" rx="10" class="u-box"/>
        <text x="564" y="46" class="u-title" text-anchor="middle">Sesudah rebalance</text>
        <line x1="402" y1="56" x2="726" y2="56" class="u-line"/>
        <rect x="402" y="70" width="96" height="60" rx="6" class="u-hd"/>
        <text x="450" y="94" class="u-lbl" text-anchor="middle">P0</text>
        <text x="450" y="116" class="u-lbl" text-anchor="middle">consumer-a</text>
        <rect x="510" y="70" width="96" height="60" rx="6" class="u-hd"/>
        <text x="558" y="94" class="u-lbl" text-anchor="middle">P1</text>
        <text x="558" y="116" class="u-lbl" text-anchor="middle">consumer-b</text>
        <rect x="618" y="70" width="96" height="60" rx="6" class="u-hd"/>
        <text x="666" y="94" class="u-lbl" text-anchor="middle">P2</text>
        <text x="666" y="116" class="u-lbl" text-anchor="middle">consumer-c</text>
        <rect x="20" y="176" width="720" height="124" rx="10" class="u-hd"/>
        <text x="380" y="204" class="u-title" text-anchor="middle">Alur rebalancing</text>
        <text x="380" y="232" class="u-lbl" text-anchor="middle">1. consumer baru: JoinGroup → 2. anggota menyetor subscription</text>
        <text x="380" y="258" class="u-lbl" text-anchor="middle">3. leader group menghitung assignment → 4. SyncGroup membagi tugas</text>
        <text x="380" y="284" class="u-lbl" text-anchor="middle">5. semua consumer poll() lagi dengan pembagian baru</text>
      </svg></div><figcaption>Saat consumer baru bergabung, partition dibagikan ulang — inilah rebalancing.</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Alur rebalancing langkah demi langkah</h3><p>Ketika ada perubahan anggota (consumer mati, baru bergabung, atau timeout), protocol koordinasi berjalan:</p><ol><li><b>JoinGroup</b> — semua anggota group memberi tahu Kafka bahwa mereka siap (dan menyebutkan topic yang diikuti). Satu anggota ditunjuk sebagai <b>group leader</b>.</li><li><b>Subscription/assignment</b> — anggota menyetor daftar topic yang diikuti; lalu <b>leader group</b> (bukan broker!) yang menghitung pembagian partition memakai strategi assignment.</li><li><b>SyncGroup</b> — hasil pembagian dikirim balik ke masing-masing consumer.</li><li><b>Resume polling</b> — semua consumer melanjutkan <code>poll()</code> dengan tugas barunya.</li></ol><p>Selama proses berlangsung, <b>pembacaan berhenti sesaat</b>. Karena itu rebalance yang terlalu sering membuat throughput anjlok dan lag melonjak — di sinilah penyebab rebalance tak terduga perlu dicermati.</p>'
    },
    {
      type: 'example',
      title: 'Strategi assignment: Range vs RoundRobin',
      lang: 'text',
      output: false,
      code: `Kondisi: topic user-events P0,P1,P2,P3,P4 (5 partition), 2 consumer

RANGE (default bawaan, per topic)
  consumer-a: P0,P1,P2   (3 partition)
  consumer-b: P3,P4      (2 partition)
  → pembagian per topic: ambil rentoran awal untuk consumer pertama

ROUNDROBIN (merata lintas semua topic yang diikuti)
  consumer-a: P0,P2,P4   (3 partition)
  consumer-b: P1,P3      (2 partition)
  → dibulatkan bergiliran; paling rata bila banyak topic

COOPERATIVESTICKY (dipilih bila ingin gangguan minimal)
  consumer-a: P0,P1,P2   (tetap — tidak diusik)
  consumer-b: P3,P4      (tetap)
  → hanya partition pindah yang dibagikan ulang, bukan semua

Ketika consumer-c bergabung (pembagian jadi rata):
  Range:      a:P0,P1  b:P2,P3  c:P4
  RoundRobin: a:P0,P3  b:P1,P4  c:P2`,
    explain: [
      '<b>Range</b> membagi per topic: rentoran awal jatuh ke consumer pertama, sehingga bila ada banyak topic pembagiannya bisa tidak merata antar consumer.',
      '<b>RoundRobin</b> membulatkan lintas seluruh topic yang diikuti — paling rata, tetapi bila daftar topic tiap consumer berbeda, hasilnya bisa mengejutkan.',
      '<b>CooperativeSticky</b> (CooperativeStickyAssignor) hanya memindahkan partition yang benar-benar perlu berpindah — mayoritas consumer tetap bekerja tanpa jeda, mengurangi gangguan drastis.'
    ]
    },
    {
      type: 'text',
      html: '<h3>Penyebab rebalance tak terduga</h3><p>Rebalance wajar terjadi saat deploy (consumer baru naik). Tetapi rebalance <b>berulang tanpa jelas</b> adalah gejala masalah. Penyebab paling umum:</p><ul><li><b>Poll terlalu jarang</b> — bila jeda antar <code>poll()</code> melewati <code>max.poll.interval.ms</code> (default 5 menit), Kafka menganggap consumer mati dan mengeluarkannya dari group → rebalance.</li><li><b>Batch terlalu besar</b> — jumlah record per <code>poll()</code> melebihi <code>max.poll.records</code> sehingga satu siklus memproses lebih lama dari interval maksimum.</li><li><b>Proses lambat</b> — pemrosesan record (mis. panggil API luar) butuh waktu lama tanpa commit.</li><li><b>Session timeout habis</b> — heartbeat terputus (<code>session.timeout.ms</code>, default 45 detik) karena GC panjang atau jaringan.</li><li><b>Exception tak tertangani</b> — proses keluar tanpa leave group yang rapi.</li></ul>'
    },
    {
      type: 'example',
      title: 'Konfigurasi anti-rebalance yang lazim dipakai',
      lang: 'java',
      output: false,
      code: `properties.put(ConsumerConfig.GROUP_ID_CONFIG, "analytics");
// strategi kooperatif: hanya partition yang pindah dibagikan ulang
properties.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG,
    CooperativeStickyAssignor.class.getName());

// beri ruang: proses batch harus selesai sebelum batas ini
properties.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, "300000");   // 5 menit
properties.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, "500");          // batasi batch

// heartbeat cukup sering walau sesekali ada jeda
properties.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, "45000");
properties.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG, "15000");

// commit eksplisit setelah batch benar-benar selesai
properties.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "false");`,
      explain: [
        'Kuncinya satu: <b>waktu memproses satu batch harus jauh di bawah <code>max.poll.interval.ms</code></b>. Bila tidak, rebalance akan terjadi berulang walau consumer sehat.',
        'Menurunkan <code>max.poll.records</code> memperkecil batch — lebih sering poll, lebih cepat tiap siklus, risiko interval terlampaui mengecil.',
        'Strategi <code>CooperativeStickyAssignor</code> membuat rebalance menjadi non-stop-the-world: consumer yang tugasnya tidak berubah tetap lanjut membaca.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Kapan rebalance itu wajar?</h3><p>Sebagian rebalance memang tak terhindarkan dan sehat:</p><ul><li><b>Scaling</b> — menambah consumer saat beban naik (atau mengurangi saat sepi).</li><li><b>Rolling restart / deploy</b> — consumer lama keluar, baru masuk.</li><li><b>Kegagalan nyata</b> — consumer crash atau mesin mati, tugasnya harus dialihkan.</li><li><b>Perubahan subscription</b> — consumer mulai mengikuti topic baru.</li></ul><p>Yang perlu dihindari adalah <b>rebalance karena kekeliruan konfigurasi</b> (interval terlampaui, heartbeat putus, crash tak tertangani). Di production, pantau metrik <code>rebalance-rate-per-hour</code> dan waktu yang dihabiskan dalam status rebalancing — bila angkanya tinggi, cari penyebabnya, bukan sekadar menambah consumer.</p>'
    },
    {
      type: 'warn',
      title: 'Kesalahan consumer group yang sering terjadi',
      text: '<ul><li><b>group.id berbeda tiap deploy</b> — setiap group baru dianggap belum pernah membaca; otomatis mulai dari <code>auto.offset.reset</code> (bisa lari ke awal log atau melompat ke ujung).</li><li><b>Menambah consumer melebihi jumlah partition</b> — consumer berlebih idle dan percuma.</li><li><b>Pemrosesan berat tanpa membatasi batch</b> — interval terlampaui → rebalance loop.</li><li><b>auto commit + proses panjang</b> — posisi ter-commit sebelum selesai, record bisa terlewat.</li><li><b>Mengabaikan consumer mati</b> — tugas dialihkan, tetapi lag tetap membengkak bila sisa consumer tidak sanggup.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Cara cepat memeriksa sehat-tidaknya group',
      text: '<p>Jalankan <code>kafka-consumer-groups.sh --describe --group NAMA</code>. Perhatikan dua hal: (1) semua partition punya <b>CURRENT-OFFSET</b> yang bergerak (bukan mentok), dan (2) <b>LAG</b> tidak terus membesar. Kalau ada partition tanpa consumer (kolom MEMBER kosong), berarti ada partition yang belum ditugaskan — biasanya karena jumlah consumer kurang atau group sedang rebalance.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Consumer group', 'Kumpulan consumer dengan group.id sama yang berbagi partition secara eksklusif.'],
        ['Rebalancing', 'Proses pembagian ulang partition antar anggota group.'],
        ['Group leader', 'Anggota group yang menghitung pembagian partition (assignment).'],
        ['JoinGroup', 'Langkah pendaftaran anggota saat memulai rebalance.'],
        ['SyncGroup', 'Langkah penyebaran hasil assignment ke tiap anggota.'],
        ['Range assignor', 'Strategi default: membagi rentoran partition per topic.'],
        ['RoundRobin assignor', 'Strategi membulatkan pembagian lintas seluruh topic.'],
        ['CooperativeSticky', 'Strategi kooperatif yang hanya memindahkan partition yang perlu.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Jelaskan aturan eksklusivitas: mengapa satu partition hanya boleh ke satu consumer dalam satu group?</li><li>Urutkan 5 langkah alur rebalancing dengan bahasamu sendiri.</li><li>Topic 5 partition, 2 consumer: bandingkan pembagian Range dan RoundRobin. Kapan keduanya memberi hasil sama?</li><li>Sebutkan 4 penyebab rebalance tak terduga dan solusi konfigurasi masing-masing.</li><li>Uji: jalankan consumer, lalu matikan satu proses — amati perubahan <code>--describe</code> sebelum dan sesudahnya.</li></ol>'
    }
  ],
  recap: [
    'Dalam satu group, <b>satu partition hanya ke satu consumer</b> — pembagian eksklusif agar tidak ada duplikasi internal maupun yang terlewat.',
    'Rebalance = JoinGroup → hitung assignment di <b>leader group</b> → SyncGroup → poll lagi; selama itu pembacaan berhenti sesaat.',
    'Strategi: <b>Range</b> per topic, <b>RoundRobin</b> merata lintas topic, <b>CooperativeSticky</b> meminimalkan gangguan.',
    'Rebalance tak terduga umumnya karena <b>batch terlalu besar / proses lambat melewati max.poll.interval.ms</b> — batasi batch dan pantau lag.'
  ]
});
