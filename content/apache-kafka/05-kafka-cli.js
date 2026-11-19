/* ============================================================
   Pelajaran Apache Kafka — 05: Perintah CLI Kafka Sehari-hari
   ============================================================ */
'use strict';

window.KAFKA_LESSONS = window.KAFKA_LESSONS || [];

window.KAFKA_LESSONS.push({
  id: 'kafka-cli',
  title: 'Perintah CLI Kafka Sehari-hari',
  chapter: 'Instalasi & KRaft',
  duration: '15 menit',
  intro: [
    'Sebelum menulis kode producer/consumer, alangkah baiknya kamu fasih memakai alat bawaan Kafka. CLI bukan sekadar alat latihan — bahkan di production, <code>kafka-topics.sh</code>, <code>kafka-consumer-groups.sh</code>, dan <code>kafka-get-offsets.sh</code> tetap menjadi senjata pertama saat mendiagnosis masalah.',
    'Pelajaran ini melatih perintah-perintah yang benar-benar kamu pakai sehari-hari: membuat dan memeriksa topic, mengirim serta membaca record lewat console, memeriksa offset consumer group, dan mengubah konfigurasi — semuanya memakai CLI image <code>apache/kafka</code> di <code>/opt/kafka/bin/</code>.'
  ],
  objectives: [
    'Membuat, melihat, mendeskripsikan, mengubah, dan menghapus topic dengan kafka-topics.sh',
    'Mengirim record lewat console producer dan membacanya lewat console consumer dengan opsi offset yang tepat',
    'Memeriksa posisi consumer group dan offset dengan kafka-consumer-groups.sh serta kafka-get-offsets.sh',
    'Membaca output describe topic: partitions, leader, replicas, dan ISR'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Peta perintah yang akan dipakai</h3><p>Seluruh CLI berada di <code>/opt/kafka/bin/</code> dan selalu membutuhkan <code>--bootstrap-server localhost:9092</code>. Peta cepatnya:</p><table><thead><tr><th>Kebutuhan</th><th>Perintah</th></tr></thead><tbody><tr><td>Buat/ubah/hapus topic</td><td><code>kafka-topics.sh</code></td></tr><tr><td>Lihat detail partition</td><td><code>kafka-topics.sh --describe</code></td></tr><tr><td>Kirim record (uji cepat)</td><td><code>kafka-console-producer.sh</code></td></tr><tr><td>Baca record (uji cepat)</td><td><code>kafka-console-consumer.sh</code></td></tr><tr><td>Posisi offset suatu group</td><td><code>kafka-consumer-groups.sh --describe</code></td></tr><tr><td>Offset terakhir tiap partition</td><td><code>kafka-get-offsets.sh</code></td></tr><tr><td>Baca/ubah konfigurasi topic</td><td><code>kafka-configs.sh</code></td></tr><tr><td>Metadata cluster</td><td><code>kafka-metadata.sh</code></td></tr></tbody></table>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Peta perintah CLI Kafka dikelompokkan berdasarkan kebutuhan">
        <rect x="20" y="20" width="228" height="120" rx="10" class="u-box"/>
        <text x="134" y="46" class="u-title" text-anchor="middle">Topic</text>
        <line x1="34" y1="56" x2="234" y2="56" class="u-line"/>
        <text x="134" y="80" class="u-lbl" text-anchor="middle">kafka-topics.sh</text>
        <text x="134" y="104" class="u-lbl" text-anchor="middle">--create --describe</text>
        <text x="134" y="128" class="u-lbl" text-anchor="middle">--alter --delete</text>
        <rect x="266" y="20" width="228" height="120" rx="10" class="u-box"/>
        <text x="380" y="46" class="u-title" text-anchor="middle">Produksi &amp; Konsumsi</text>
        <line x1="280" y1="56" x2="480" y2="56" class="u-line"/>
        <text x="380" y="80" class="u-lbl" text-anchor="middle">kafka-console-producer.sh</text>
        <text x="380" y="104" class="u-lbl" text-anchor="middle">kafka-console-consumer.sh</text>
        <text x="380" y="128" class="u-lbl" text-anchor="middle">--from-beginning --offset</text>
        <rect x="512" y="20" width="228" height="120" rx="10" class="u-box"/>
        <text x="626" y="46" class="u-title" text-anchor="middle">Offset &amp; Group</text>
        <line x1="526" y1="56" x2="726" y2="56" class="u-line"/>
        <text x="626" y="80" class="u-lbl" text-anchor="middle">kafka-consumer-groups.sh</text>
        <text x="626" y="104" class="u-lbl" text-anchor="middle">--describe --reset-offsets</text>
        <text x="626" y="128" class="u-lbl" text-anchor="middle">kafka-get-offsets.sh</text>
        <rect x="20" y="164" width="354" height="116" rx="10" class="u-box"/>
        <text x="197" y="190" class="u-title" text-anchor="middle">Konfigurasi</text>
        <line x1="34" y1="200" x2="360" y2="200" class="u-line"/>
        <text x="197" y="226" class="u-lbl" text-anchor="middle">kafka-configs.sh --describe --alter</text>
        <text x="197" y="254" class="u-lbl" text-anchor="middle">retention.ms, cleanup.policy, min.insync.replicas</text>
        <rect x="392" y="164" width="348" height="116" rx="10" class="u-box"/>
        <text x="566" y="190" class="u-title" text-anchor="middle">Metadata Cluster</text>
        <line x1="406" y1="200" x2="726" y2="200" class="u-line"/>
        <text x="566" y="226" class="u-lbl" text-anchor="middle">kafka-metadata.sh --snapshot</text>
        <text x="566" y="254" class="u-lbl" text-anchor="middle">kafka-broker-api-versions.sh</text>
      </svg></div><figcaption>Delapan perintah CLI mencakup hampir semua kebutuhan sehari-hari.</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Mengelola topic</h3><p><code>kafka-topics.sh</code> adalah perintah paling sering dipakai. Tiga hal yang perlu diperhatikan saat membuat topic:</p><ul><li><b>--partitions</b> — menentukan jumlah partition (unit paralelisme). Untuk latihan 3 sudah cukup; production dihitung dari throughput.</li><li><b>--replication-factor</b> — jumlah salinan partition. Latihan 1 broker ya <code>1</code>; production minimal <code>3</code> agar toleran kegagalan.</li><li><b>--config</b> — override konfigurasi per topic saat dibuat (mis. <code>retention.ms=604800000</code> untuk retensi 7 hari).</li></ul><p>Setelah dibuat, <code>--describe</code> menampilkan tiap partition lengkap dengan leader, replicas, dan ISR — kolom yang akan dibaca terus di pelajaran replication.</p>'
    },
    {
      type: 'example',
      title: 'Membuat, memeriksa, dan menghapus topic',
      lang: 'bash',
      output: false,
      code: `# buat topic 3 partition
docker exec kafka /opt/kafka/bin/kafka-topics.sh \\
  --bootstrap-server localhost:9092 --create \\
  --topic user-events --partitions 3 --replication-factor 1

# daftar semua topic
docker exec kafka /opt/kafka/bin/kafka-topics.sh \\
  --bootstrap-server localhost:9092 --list

# detail partition: leader, replicas, ISR
docker exec kafka /opt/kafka/bin/kafka-topics.sh \\
  --bootstrap-server localhost:9092 --describe --topic user-events

# ubah jumlah partition (boleh bertambah, tidak boleh berkurang)
docker exec kafka /opt/kafka/bin/kafka-topics.sh \\
  --bootstrap-server localhost:9092 --alter \\
  --topic user-events --partitions 6

# hapus topic latihan
docker exec kafka /opt/kafka/bin/kafka-topics.sh \\
  --bootstrap-server localhost:9092 --delete --topic user-events`,
      explain: [
        'Output <code>--describe</code> memuat baris seperti <code>Partition 0  Leader 1  Replicas 1  ISR 1</code> — artinya partition 0 berada di broker 1, salinannya juga broker 1, dan broker 1 in-sync (sehat).',
        '<code>--alter --partitions 6</code> hanya boleh <b>menambah</b> partition; mengurangi partition ditolak karena berisiko kehilangan penempatan record.',
        'Topic yang dihapus tidak bisa dibatalkan — gunakan hanya untuk topic latihan, dan sadari bahwa production biasanya menonaktifkan auto-create topic.'
      ]
    },
    {
      type: 'example',
      title: 'Console producer & consumer',
      lang: 'bash',
      output: false,
      code: `# kirim record (ketik satu baris = satu record, Ctrl+D untuk selesai)
docker exec -it kafka /opt/kafka/bin/kafka-console-producer.sh \\
  --bootstrap-server localhost:9092 --topic user-events
{"event":"login","user":"andi"}
{"event":"logout","user":"andi"}

# baca dari awal (termasuk record lama)
docker exec kafka /opt/kafka/bin/kafka-console-consumer.sh \\
  --bootstrap-server localhost:9092 --topic user-events \\
  --from-beginning

# baca hanya record baru (offset terakhir)
docker exec kafka /opt/kafka/bin/kafka-console-consumer.sh \\
  --bootstrap-server localhost:9092 --topic user-events

# baca dari partition tertentu mulai offset tertentu
docker exec kafka /opt/kafka/bin/kafka-console-consumer.sh \\
  --bootstrap-server localhost:9092 --topic user-events \\
  --partition 0 --offset 2`,
      explain: [
        '<code>--from-beginning</code> membaca seluruh isi log dari offset 0 — cara tercepat membuktikan bahwa record lama masih tersimpan (replay).',
        'Tanpa opsi offset, console consumer memakai <code>auto.offset.reset=latest</code>: hanya record yang datang <b>sesudah</b> consumer mulai berjalan.',
        '<code>--partition 0 --offset 2</code> membaca tepat dari posisi tertentu — berguna saat menelusuri masalah pada satu partition.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Memeriksa offset dan consumer group</h3><p>Dua perintah untuk menjawab pertanyaan paling sering: <i>&quot;sudah sampai mana consumer saya?&quot;</i></p><ul><li><code>kafka-get-offsets.sh</code> — offset <b>terakhir</b> tiap partition (log end offset). Selisihnya dengan posisi consumer = <b>lag</b>.</li><li><code>kafka-consumer-groups.sh --describe</code> — posisi (<code>CURRENT-OFFSET</code>), log-end (<code>LOG-END-OFFSET</code>), dan <code>LAG</code> per partition untuk suatu group.</li></ul><p>Perintah <code>--reset-offsets</code> dipakai untuk menggeser posisi baca (mis. ke <code>earliest</code>) — dan hanya bisa dijalankan saat consumer group <b>tidak aktif</b>.</p>'
    },
    {
      type: 'example',
      title: 'Offset consumer group dalam satu pandang',
      lang: 'bash',
      output: false,
      code: `docker exec kafka /opt/kafka/bin/kafka-get-offsets.sh \\
  --bootstrap-server localhost:9092 --topic user-events

docker exec kafka /opt/kafka/bin/kafka-consumer-groups.sh \\
  --bootstrap-server localhost:9092 --describe --group analytics

# contoh output:
# GROUP      TOPIC         PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG
# analytics  user-events   0          14              20              6
# analytics  user-events   1          20              20              0
# analytics  user-events   2          8               20              12`,
      explain: [
        '<code>LAG</code> = LOG-END-OFFSET − CURRENT-OFFSET: berapa record yang belum diproses group itu — metrik paling penting untuk mengukur kesehatan consumer.',
        'LAG 0 pada partition 1 berarti consumer sudah menyusul (catch up); LAG 12 pada partition 2 menandakan partition itu tertinggal — perlu diperiksa apakah consumer-nya lambat atau mati.',
        'Untuk mereset: <code>--reset-offsets --to-earliest --execute</code> saat group tidak berjalan; ini sering dipakai setelah menambah consumer baru atau memperbaiki bug pemrosesan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Konfigurasi topic dengan kafka-configs.sh</h3><p>Beberapa konfigurasi paling sering diubah per topic:</p><table><thead><tr><th>Konfigurasi</th><th>Fungsi</th></tr></thead><tbody><tr><td><code>retention.ms</code></td><td>Berapa lama record disimpan (milidetik).</td></tr><tr><td><code>retention.bytes</code></td><td>Batas ukuran maksimum partition.</td></tr><tr><td><code>cleanup.policy</code></td><td><code>delete</code> (hapus record lama) atau <code>compact</code> (simpan nilai terbaru per key).</td></tr><tr><td><code>min.insync.replicas</code></td><td>Jumlah replica minimal yang harus sehat agar tulis dianggap aman.</td></tr></tbody></table><p>Selalu <code>--describe</code> dulu sebelum <code>--alter</code> agar kamu tahu nilai bawaan dan dampak perubahan.</p>'
    },
    {
      type: 'example',
      title: 'Membaca dan mengubah konfigurasi topic',
      lang: 'bash',
      output: false,
      code: `# baca konfigurasi topic
docker exec kafka /opt/kafka/bin/kafka-configs.sh \\
  --bootstrap-server localhost:9092 --entity-type topics \\
  --entity-name user-events --describe

# set retensi 7 hari + compaction mati (default delete)
docker exec kafka /opt/kafka/bin/kafka-configs.sh \\
  --bootstrap-server localhost:9092 --entity-type topics \\
  --entity-name user-events --alter \\
  --add-config retention.ms=604800000`,
      explain: [
        'Urutan <b>describe dulu, alter kemudian</b> mencegah perubahan membabi buta — konfigurasi yang salah langsung berdampak pada penyimpanan dan keamanan data.',
        '<code>--entity-type topics</code> menunjukkan bahwa perubahan ditujukan ke topic; selain itu ada <code>brokers</code> dan <code>users</code> (untuk SASL).',
        'Perubahan retensi berlaku untuk record yang sudah ada — record yang sudah melewati batas retensi akan dibuang pada background log cleaner.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan umum saat memakai CLI',
      text: '<ul><li><b>Lupa --bootstrap-server</b> — hampir semua perintah modern wajib menyebutnya (perintah lama memakai --zookeeper, sudah tidak relevan).</li><li><b>Salah path</b> — image apache/kafka menyimpannya di <code>/opt/kafka/bin/</code>.</li><li><b>Replication-factor lebih besar dari jumlah broker</b> — pembuatan topic langsung gagal.</li><li><b>--from-beginning dianggap posisi default</b> — tidak; default console consumer adalah latest.</li><li><b>--reset-offsets saat group aktif</b> — ditolak; hentikan consumer dulu.</li><li><b>--alter --partitions untuk mengurangi</b> — tidak didukung, hanya menambah.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Alias agar mengetik lebih pendek',
      text: '<p>Buat alias di shell container atau host, misal <code>kafka-topics</code> menjadi <code>docker exec kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092</code>. Dengan begitu perintah cukup ditulis <code>kafka-topics --list</code> dan kamu jauh lebih sering benar-benar memeriksa kondisi cluster daripada menundanya karena malas mengetik.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['kafka-topics.sh', 'CLI pengelola topic: create, describe, alter, delete.'],
        ['kafka-console-producer.sh', 'CLI sederhana untuk mengirim record per baris input.'],
        ['kafka-console-consumer.sh', 'CLI sederhana untuk membaca record dari topic.'],
        ['kafka-consumer-groups.sh', 'CLI inspeksi & pengelolaan consumer group dan offset.'],
        ['kafka-get-offsets.sh', 'CLI untuk melihat offset terakhir (log end) tiap partition.'],
        ['kafka-configs.sh', 'CLI membaca/mengubah konfigurasi broker, topic, atau user.'],
        ['Log end offset', 'Offset tertinggi yang sudah ada di sebuah partition.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Buat topic <code>order-created</code> 3 partition, tampilkan <code>--describe</code>, lalu sebutkan leader tiap partition.</li><li>Kirim <b>10 record</b> via console producer, lalu baca dengan <code>--from-beginning</code>.</li><li>Baca record dari <b>partition 1 mulai offset 0</b> — bandingkan isinya dengan pembacaan seluruh partition.</li><li>Tampilkan konfigurasi topic, ubah <code>retention.ms</code> jadi 1 hari, lalu buktikan perubahannya lewat <code>--describe configs</code>.</li><li>Buat topic dengan <code>--replication-factor 3</code> pada cluster 1 broker — apa errornya? Mengapa?</li></ol>'
    }
  ],
  recap: [
    'Semua CLI ada di <code>/opt/kafka/bin/</code> dan hampir semua butuh <code>--bootstrap-server localhost:9092</code>.',
    'Topic dikelola <code>kafka-topics.sh</code>: <b>create, describe, alter (hanya menambah partition), delete</b>.',
    'Console producer mengirim per baris; console consumer default <b>latest</b>, <code>--from-beginning</code> untuk replay, <code>--partition/--offset</code> untuk penelusuran presisi.',
    '<b>LAG = log end offset − current offset</b> — dilihat lewat <code>kafka-consumer-groups.sh --describe</code>; konfigurasi topic diubah dengan <code>kafka-configs.sh</code>.'
  ]
});
