/* ============================================================
   Pelajaran Apache Kafka — 07: Offset, Consumer Position & Lag
   ============================================================ */
'use strict';

window.KAFKA_LESSONS = window.KAFKA_LESSONS || [];

window.KAFKA_LESSONS.push({
  id: 'offset-dan-lag',
  title: 'Offset, Consumer Position & Lag',
  chapter: 'Data Model',
  duration: '15 menit',
  intro: [
    'Offset adalah cara Kafka menjawab pertanyaan paling sederhana namun paling krusial: <b>&quot;sudah sampai mana pembacaan saya?&quot;</b>. Memahami offset berarti memahami cara consumer bertahan setelah restart, bagaimana replay terjadi, dan dari mana angka <b>consumer lag</b> yang kamu lihat di dashboard berasal.',
    'Pelajaran ini membedah tiga konsep yang saling terkait: <b>current position</b> (posisi baca saat ini), <b>committed offset</b> (penanda kemajuan yang disimpan), dan <b>lag</b> (selisihnya dengan ujung log) — termasuk auto commit, manual commit, dan cara mereset offset dengan aman.'
  ],
  objectives: [
    'Membedakan current position, committed offset, dan log end offset',
    'Menjelaskan cara kerja auto commit vs manual commit beserta risikonya',
    'Menjelaskan auto.offset.reset dan kapan earliest/latest dipakai',
    'Menghitung consumer lag serta menjalankan reset offset dengan aman'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Tiga angka yang perlu kamu kenal</h3><p>Di setiap partition, ada tiga posisi yang sering tertukar:</p><table><thead><tr><th>Istilah</th><th>Arti</th><th>Siapa memegang</th></tr></thead><tbody><tr><td><b>Log end offset</b></td><td>Offset tertinggi yang sudah ada di partition (ujung log)</td><td>Broker</td></tr><tr><td><b>Current position</b></td><td>Offset berikutnya yang akan dibaca oleh consumer</td><td>Consumer (di memori)</td></tr><tr><td><b>Committed offset</b></td><td>Penanda kemajuan yang disimpan consumer agar restart tidak mulai dari nol</td><td>Kafka (disimpan per group + partition)</td></tr></tbody></table><p>Selisih <code>log end offset − committed offset</code> itulah <b>consumer lag</b>. Lag tinggi bisa berarti consumer lambat, consumer mati, atau memang ada lonjakan trafik.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Posisi committed offset dan log end offset pada sebuah partition beserta consumer lag">
        <rect x="20" y="40" width="470" height="140" rx="10" class="u-box"/>
        <text x="255" y="66" class="u-title" text-anchor="middle">Partition 0 — log end offset = 20</text>
        <line x1="34" y1="76" x2="476" y2="76" class="u-line"/>
        <rect x="34" y="94" width="442" height="60" rx="6" class="u-hd"/>
        <text x="255" y="132" class="u-lbl" text-anchor="middle">record offset 0 ... 13 (sudah diproses)</text>
        <line x1="248" y1="88" x2="248" y2="160" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="245" y="176" class="u-lbl" text-anchor="middle">committed offset = 14</text>
        <line x1="480" y1="110" x2="538" y2="110" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="544" y="40" width="198" height="140" rx="10" class="u-box"/>
        <text x="643" y="66" class="u-title" text-anchor="middle">Consumer</text>
        <line x1="558" y1="76" x2="728" y2="76" class="u-line"/>
        <text x="643" y="104" class="u-lbl" text-anchor="middle">position: 14</text>
        <text x="643" y="130" class="u-lbl" text-anchor="middle">membaca 14, 15, 16...</text>
        <text x="643" y="156" class="u-lbl" text-anchor="middle">group: analytics</text>
        <rect x="20" y="212" width="722" height="60" rx="10" class="u-hd"/>
        <text x="381" y="238" class="u-title" text-anchor="middle">LAG = 20 − 14 = 6 record belum diproses</text>
        <text x="381" y="262" class="u-lbl" text-anchor="middle">lag nol = consumer sudah menyusul (catch up)</text>
      </svg></div><figcaption>Lag adalah selisih ujung log dengan committed offset — gambaran seberapa jauh consumer tertinggal.</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Auto commit vs manual commit</h3><p><b>Auto commit</b> (<code>enable.auto.commit=true</code>, bawaan) menyimpan posisi secara periodik (<code>auto.commit.interval.ms</code>, default 5 detik) setiap kali <code>poll()</code> dipanggil. Simpel, tetapi punya risiko:</p><ul><li><b>Commit terjadi meski pemrosesan belum selesai</b> — consumer mati tepat setelah commit, record yang sedang diproses hilang dari antrean (at-most-once).</li><li><b>Commit bisa gagal tanpa kamu sadar</b> — posisi tidak tersimpan, restart membaca ulang (at-least-once).</li></ul><p><b>Manual commit</b> (<code>enable.auto.commit=false</code>) memberi kendali penuh: commit hanya setelah pemrosesan benar-benar tuntas. Inilah pilihan untuk pemrosesan yang butuh kepastian.</p>'
    },
    {
      type: 'example',
      title: 'Auto commit vs manual commit',
      lang: 'java',
      output: false,
      code: `// AUTO COMMIT (bawaan)
properties.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "true");
properties.put(ConsumerConfig.AUTO_COMMIT_INTERVAL_MS_CONFIG, "5000");
while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
    proses(records);   // posisi bisa ter-commit sebelum proses selesai
}

// MANUAL COMMIT (lebih aman untuk efek samping)
properties.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "false");
while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
    try {
        for (ConsumerRecord<String, String> r : records) {
            simpanKeDatabase(r);        // atau: idempoten dulu, baru commit
        }
        consumer.commitSync();          // commit hanya bila semua sukses
    } catch (Exception e) {
        log.error("proses gagal, offset belum dicommit", e);
        // jangan commit: record akan diproses ulang saat restart
    }
}`,
      explain: [
        'Pada auto commit, posisi bisa ter-commit <b>sebelum</b> pemrosesan selesai — bila consumer mati di titik itu, record yang belum selesai diproses <b>terlewat</b>.',
        'Pada manual commit dengan <code>commitSync()</code>, offset hanya disimpan setelah seluruh batch sukses; kegagalan berarti record akan <b>diproses ulang</b> (at-least-once).',
        'Karena diproses ulang bisa menggandakan efek, pasangkan manual commit dengan <b>consumer idempoten</b> — itu dibahas di pelajaran Delivery Semantics.'
      ]
    },
    {
      type: 'text',
      html: '<h3>auto.offset.reset: earliest, latest, none</h3><p>Nilai ini hanya berlaku ketika consumer mencoba membaca partition <b>tanpa committed offset</b> — mis. group baru pertama kali membaca topic, atau offset lama sudah dihapus karena retensi. Pilihannya:</p><table><thead><tr><th>Nilai</th><th>Perilaku</th><th>Cocok untuk</th></tr></thead><tbody><tr><td><code>earliest</code></td><td>Mulai dari offset 0 — baca seluruh riwayat</td><td>Backfill, migrasi, ingin replay penuh</td></tr><tr><td><code>latest</code></td><td>Mulai dari ujung log — hanya record baru</td><td>Proses real-time yang tidak butuh riwayat</td></tr><tr><td><code>none</code></td><td>Error bila tidak ada committed offset</td><td>Memaksa konfigurasi eksplisit (aman dari kejutan)</td></tr></tbody></table><p>Perhatikan: <b>tidak ada pilihan &quot;lanjut dari terakhir&quot; secara ajaib</b> — bila committed offset consumer ada, Kafka memakai itu; bila tidak ada, barulah aturan ini dipakai.</p>'
    },
    {
      type: 'example',
      title: 'Mengukur dan mereset offset',
      lang: 'bash',
      output: false,
      code: `# ukur lag suatu group
docker exec kafka /opt/kafka/bin/kafka-consumer-groups.sh \\
  --bootstrap-server localhost:9092 --describe --group analytics

# lihat ujung log tiap partition
docker exec kafka /opt/kafka/bin/kafka-get-offsets.sh \\
  --bootstrap-server localhost:9092 --topic user-events

# RESET (consumer harus berhenti dulu!)
docker exec kafka /opt/kafka/bin/kafka-consumer-groups.sh \\
  --bootstrap-server localhost:9092 --group analytics \\
  --topic user-events --reset-offsets --to-earliest --execute

# periksa hasilnya sebelum menjalankan consumer lagi
docker exec kafka /opt/kafka/bin/kafka-consumer-groups.sh \\
  --bootstrap-server localhost:9092 --describe --group analytics`,
      explain: [
        '<code>--reset-offsets</code> <b>ditolak</b> bila group masih aktif — hentikan consumer dulu, ini pencegah kekacauan posisi.',
        '<code>--to-earliest --execute</code> memindahkan posisi ke offset 0 sehingga consumer berikutnya membaca ulang seluruh riwayat; ada juga <code>--to-latest</code>, <code>--shift-by</code>, dan <code>--to-datetime</code>.',
        'Selalu <b>deskripsikan ulang setelah reset</b> untuk memastikan posisi benar sebelum consumer dinyalakan — kebiasaan kecil yang mencegah insiden besar.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Lag: membaca angka dengan benar</h3><p>Lag bukan sekadar &quot;besar atau kecil&quot; — konteksnya menentukan:</p><ul><li><b>Lag stabil kecil</b> — consumer sehat dan menyusul trafik masuk.</li><li><b>Lag naik terus</b> — consumer tidak sanggup (lambat, sering error, atau kekurangan paralelisme).</li><li><b>Lag melonjak lalu turun</b> — normal setelah lonjakan trafik atau restart consumer (proses mengejar).</li><li><b>Lag sangat besar setelah downtime</b> — wajar bila memang banyak record tertunda; yang jadi masalah bila SLA pemrosesan ketat.</li></ul><p>Di production, lag dipantau per partition — lag rata-rata dapat menutupi satu partition bermasalah. Alert sebaiknya memakai <b>ambang lag maksimum + waktu tertinggal</b>, bukan hanya angka tunggal.</p>'
    },
    {
      type: 'warn',
      title: 'Kesalahan offset yang paling sering terjadi',
      text: '<ul><li><b>Auto commit dibiarkan untuk pemrosesan berat</b> — poll interval &gt; max.poll.interval.ms memicu rebalance; record yang sedang dikerjakan bisa terlewat.</li><li><b>Commit sebelum selesai memproses</b> — akibatnya record hilang dari antrean tanpa diproses sempurna.</li><li><b>Reset offset saat group aktif</b> — perintah ditolak atau posisi jadi kacau bila dipaksa.</li><li><b>Menyangka lag = jumlah record yang hilang</b> — lag hanya tertinggal; record tetap di log sampai kena retensi.</li><li><b>Mengabaikan auto.offset.reset</b> — group baru tiba-tiba membaca seluruh riwayat (atau justru sebaliknya) tanpa disengaja.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Resep aman untuk pemrosesan penting',
      text: '<p>Kombinasi yang umum dipakai: <code>enable.auto.commit=false</code> + <code>auto.offset.reset=earliest</code> + commit setelah sukses + consumer idempoten. Dengan begitu: restart tidak pernah kehilangan record, gangguan diproses ulang dengan aman, dan group baru selalu memulai dari riwayat yang benar.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Log end offset', 'Offset tertinggi yang tersedia di sebuah partition.'],
        ['Current position', 'Offset berikutnya yang akan dibaca consumer.'],
        ['Committed offset', 'Penanda kemajuan baca yang disimpan per group & partition.'],
        ['Consumer lag', 'Selisih log end offset dengan committed offset.'],
        ['Auto commit', 'Penyimpanan posisi otomatis berkala oleh consumer.'],
        ['Manual commit', 'Penyimpanan posisi eksplisit (commitSync/commitAsync).'],
        ['auto.offset.reset', 'Aturan saat consumer belum punya committed offset.'],
        ['Replay', 'Membaca ulang record dari offset awal tertentu.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Bedakan <b>log end offset, current position, committed offset</b> dengan satu kalimat masing-masing.</li><li>Hitung lag: log end 1.500, committed 1.230 — berapa lagnya? Apa artinya?</li><li>Kapan <code>auto.offset.reset=earliest</code> menjadi pilihan yang tepat? Kapan <code>latest</code>?</li><li>Mengapa auto commit berisiko pada record yang sedang diproses? Uraikan skenarionya.</li><li>Praktikkan: baca 10 record, hentikan consumer, restart — apakah ia mulai dari offset terakhir? Buktikan dengan <code>--describe</code>.</li></ol>'
    }
  ],
  recap: [
    'Tiga angka: <b>log end offset</b> (broker), <b>current position</b> (consumer), <b>committed offset</b> (tersimpan per group) — lag = selisih log end dan committed.',
    '<b>Auto commit sederhana tapi berisiko</b> (bisa commit sebelum selesai); <b>manual commit</b> memberi kendali dan cocok dipasangkan dengan idempotensi.',
    '<code>auto.offset.reset</code> hanya berlaku bila <b>belum ada committed offset</b>: earliest (riwayat penuh), latest (hanya baru), none (error).',
    'Reset offset hanya saat group <b>tidak aktif</b>; lag dipantau per partition dengan ambang + waktu, bukan angka tunggal.'
  ]
});
