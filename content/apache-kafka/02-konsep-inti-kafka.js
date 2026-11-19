/* ============================================================
   Pelajaran Apache Kafka — 02: Konsep Inti: Topic, Partition, Offset
   ============================================================ */
'use strict';

window.KAFKA_LESSONS = window.KAFKA_LESSONS || [];

window.KAFKA_LESSONS.push({
  id: 'konsep-inti-kafka',
  title: 'Konsep Inti: Topic, Partition, Offset',
  chapter: 'Fondasi',
  duration: '15 menit',
  intro: [
    'Setiap teknologi punya kosakata sendiri, dan Kafka terkenal dengan istilahnya yang padat: topic, partition, offset, broker, replication, consumer group. Tanpa kosakata ini, dokumentasi Kafka akan terasa seperti bahasa asing — tetapi begitu paham, semuanya menyatu menjadi satu gambaran yang sangat logis.',
    'Pelajaran ini membangun kosakata inti tersebut: bagaimana record mengalir dari producer ke broker lalu ke consumer, apa fungsi tiap partition dan offset, serta mengapa <b>urutan data hanya dijamin di dalam satu partition</b>, bukan di seluruh topic.'
  ],
  objectives: [
    'Menjelaskan fungsi record, topic, partition, offset, broker, cluster, replication, dan consumer group',
    'Menguraikan alur 6 langkah data di Kafka dari producer hingga consumer mengelola offset',
    'Menjelaskan mengapa urutan dijamin per partition dan bukan per topic',
    'Menghubungkan jumlah partition dengan throughput, paralelisme, dan jumlah consumer'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Sepuluh istilah inti</h3><p>Sebelum melangkah, kenali dulu istilah-istilah berikut beserta fungsinya:</p><table><thead><tr><th>Istilah</th><th>Fungsi</th></tr></thead><tbody><tr><td><b>Event / Record</b></td><td>Unit data yang dikirim ke Kafka (memiliki key, value, timestamp).</td></tr><tr><td><b>Topic</b></td><td>Kategori tempat record ditulis, mis. <code>user-events</code>.</td></tr><tr><td><b>Partition</b></td><td>Bagian dari topic; satu file log berurutan yang disimpan satu broker.</td></tr><tr><td><b>Offset</b></td><td>Nomor urut posisi record di dalam satu partition (dimulai dari 0).</td></tr><tr><td><b>Producer</b></td><td>Aplikasi yang menulis record ke topic.</td></tr><tr><td><b>Consumer</b></td><td>Aplikasi yang membaca record dari topic.</td></tr><tr><td><b>Broker</b></td><td>Satu server Kafka penyimpan partition.</td></tr><tr><td><b>Cluster</b></td><td>Kumpulan broker yang bekerja bersama.</td></tr><tr><td><b>Replication</b></td><td>Salinan partition di broker lain untuk toleransi kegagalan.</td></tr><tr><td><b>Consumer group</b></td><td>Sekelompok consumer yang berbagi pekerjaan membaca topic.</td></tr></tbody></table>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 330" width="760" role="img" aria-label="Cluster Kafka tiga broker dengan topic user-events yang tiga partitionnya tersebar">
        <rect x="20" y="30" width="150" height="60" rx="8" class="u-hd"/>
        <text x="95" y="56" class="u-title" text-anchor="middle">Producer</text>
        <text x="95" y="78" class="u-lbl" text-anchor="middle">user-service</text>
        <line x1="176" y1="60" x2="226" y2="60" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="232" y="20" width="330" height="240" rx="10" class="u-box"/>
        <text x="397" y="46" class="u-title" text-anchor="middle">Cluster Kafka (3 broker)</text>
        <line x1="246" y1="56" x2="548" y2="56" class="u-line"/>
        <rect x="246" y="70" width="302" height="46" rx="6" class="u-hd"/>
        <text x="397" y="90" class="u-lbl" text-anchor="middle">Broker 1 — Partition 0 (leader)</text>
        <text x="397" y="108" class="u-lbl" text-anchor="middle">salinan: Broker 2 (follower)</text>
        <rect x="246" y="126" width="302" height="46" rx="6" class="u-box"/>
        <text x="397" y="146" class="u-lbl" text-anchor="middle">Broker 2 — Partition 1 (leader)</text>
        <text x="397" y="164" class="u-lbl" text-anchor="middle">salinan: Broker 3 (follower)</text>
        <rect x="246" y="182" width="302" height="46" rx="6" class="u-box"/>
        <text x="397" y="202" class="u-lbl" text-anchor="middle">Broker 3 — Partition 2 (leader)</text>
        <text x="397" y="220" class="u-lbl" text-anchor="middle">salinan: Broker 1 (follower)</text>
        <text x="397" y="250" class="u-lbl" text-anchor="middle">topic: user-events (3 partition)</text>
        <line x1="568" y1="60" x2="618" y2="60" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="568" y1="149" x2="618" y2="149" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="568" y1="205" x2="618" y2="205" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="624" y="30" width="118" height="60" rx="8" class="u-hd"/>
        <text x="683" y="56" class="u-title" text-anchor="middle">Consumer</text>
        <text x="683" y="78" class="u-lbl" text-anchor="middle">group: analytics</text>
        <rect x="624" y="240" width="118" height="60" rx="8" class="u-box"/>
        <text x="683" y="266" class="u-title" text-anchor="middle">Consumer</text>
        <text x="683" y="288" class="u-lbl" text-anchor="middle">group: audit</text>
        <text x="380" y="300" class="u-lbl" text-anchor="middle">tiap partition punya 1 leader + follower untuk replikasi</text>
      </svg></div><figcaption>Satu topic tersebar ke tiga broker; tiap partition punya leader dan follower, lalu dibaca consumer dari group yang berbeda.</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Alur 6 langkah data di Kafka</h3><ol><li><b>Producer membuat event</b> — memilih topic tujuan dan (opsional) key record.</li><li><b>Producer mengirim event ke topic</b> — koneksi ke bootstrap server cluster.</li><li><b>Kafka menentukan partition tujuan</b> — lewat partitioner berdasarkan key (atau round-robin bila tanpa key).</li><li><b>Broker menyimpan record dan memberi offset</b> — record ditulis berurutan ke akhir log partition.</li><li><b>Consumer membaca record berdasarkan offset</b> — dari posisi yang ditentukan consumer itu.</li><li><b>Consumer mengelola kemajuan baca</b> — mencatat (commit) offset supaya restart tidak membaca ulang dari awal.</li></ol><p>Poin penting: Kafka <b>bukan antrean yang menghapus data setelah dibaca</b>. Data tetap di tempat; yang berpindah hanyalah <b>penanda posisi baca</b> (offset) milik tiap consumer.</p>'
    },
    {
      type: 'text',
      html: '<h3>Mengapa urutan hanya dijamin per partition</h3><p>Kafka menjamin <b>urutan record di dalam satu partition</b> — record dengan offset 5 selalu berada sebelum offset 6. Tetapi <b>tidak ada urutan global antar partition</b>, karena record diedarkan ke beberapa broker yang menulis secara paralel.</p><p>Konsekuensinya penting untuk desain aplikasi:</p><ul><li>Bila urutan wajib dipertahankan (mis. urutan perubahan saldo satu akun), taruh data itu di <b>satu partition yang sama</b> dengan key yang sama.</li><li>Bila data tidak butuh urutan antar entitas, penyebaran ke banyak partition justru meningkatkan throughput.</li><li>Itulah sebabnya <b>key</b> menjadi senjata utama: key yang sama → hash yang sama → partition yang sama.</li></ul>'
    },
    {
      type: 'example',
      title: 'Apa yang terjadi di dalam satu partition',
      lang: 'text',
      output: false,
      code: `Partition 0 topic "order-created" (disimpan Broker 1)
+--------+--------+---------------------+------------+
| Offset |  Key   |        Value        |  Timestamp |
+--------+--------+---------------------+------------+
|   0    | ACC-01 | {"total": 100000}   | 10:00:01.0 |
|   1    | ACC-07 | {"total": 250000}   | 10:00:01.2 |
|   2    | ACC-01 | {"total": 50000}    | 10:00:02.1 |
|   3    | ACC-03 | {"total": 75000}    | 10:00:02.9 |
+--------+--------+---------------------+------------+
Consumer membaca: offset 0,1,2,3 lalu commit offset 4
("saya sudah sampai di sini")`,
      explain: [
        'Offset adalah <b>nomor urut internal</b> yang diberikan broker — producer tidak menentukannya, consumer hanya menyimpan penanda posisi terakhir yang berhasil diproses.',
        'Record dengan <b>key yang sama</b> (ACC-01) selalu mendarat di partition yang sama sehingga urutan per akun tetap terjaga.',
        'Commit offset dilakukan <b>consumer</b>, bukan broker; karena itu bila consumer mati dan restart, ia melanjutkan dari offset terakhir yang dicommit.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Partition, throughput, dan jumlah consumer</h3><p>Partition adalah unit <b>paralelisme</b> di Kafka. Semakin banyak partition, semakin banyak yang bisa menulis dan membaca secara bersamaan — tetapi juga semakin banyak file log, index, dan metadata yang harus dijaga broker.</p><table><thead><tr><th>Kondisi</th><th>Akibat</th></tr></thead><tbody><tr><td>Partition lebih banyak dari consumer</td><td>Sebagian consumer menerima lebih banyak partition; sebagian tidak mendapat assignment sama sekali bila jumlah consumer &gt; partition</td></tr><tr><td>Consumer lebih banyak dari partition</td><td>Consumer berlebih duduk <b>idle</b> (tidak membaca apa pun) dalam satu group</td></tr><tr><td>Consumer group berbeda</td><td>Saling independen — semua membaca topic yang sama dari posisi masing-masing</td></tr></tbody></table><p>Aturan emasnya: <b>satu partition hanya ditugaskan ke maksimal satu consumer dalam satu consumer group pada satu waktu.</b> Aturan ini dibahas tuntas di pelajaran Consumer Group &amp; Rebalancing.</p>'
    },
    {
      type: 'example',
      title: 'Topic tiga partition dibaca dua consumer',
      lang: 'text',
      output: false,
      code: `Topic "user-events" : P0   P1   P2
                      │    │    │
Group "analytics"     ▼    ▼    ▼
  consumer-a          [P0]           ← 1 partition
  consumer-b               [P1][P2] ← 2 partition

Group "audit"         ▼    ▼    ▼
  consumer-x          [P0][P1][P2]  ← membaca ulang sendiri

Ditambah consumer-c di group "analytics"
→ tidak mendapat partition (melebihi jumlah partition)`,
      explain: [
        'Dalam <b>satu group</b>, tiap partition dibagi rata ke consumer yang ada — pembagian tidak boleh tumpang tindih agar tidak ada record yang diproses dua kali oleh group yang sama.',
        '<b>Group berbeda</b> membaca independen: group audit bisa membaca dari offset 0 sementara group analytics sudah di ujung log.',
        'Consumer tambahan yang melebihi jumlah partition <b>tidak berguna</b> dalam group yang sama — itulah alasan jumlah consumer harus disesuaikan dengan jumlah partition.'
      ]
    },
    {
      type: 'tip',
      title: 'Cara cepat memvisualkan',
      text: '<p>Pikirkan topic sebagai <b>buku kas besar</b>, partition sebagai <b>bagian buku (jilid 1, 2, 3)</b>, dan offset sebagai <b>nomor baris di tiap jilid</b>. Producer menulis di akhir tiap jilid, consumer menandai sampai baris berapa ia sudah membaca. Karena tiap jilid ditangani orang (broker) yang berbeda, urutan antar jilid bebas — tetapi urutan di dalam satu jilid selalu rapi.</p>'
    },
    {
      type: 'warn',
      title: 'Mitos yang sering menyesatkan',
      text: '<ul><li><b>&quot;Kafka menghapus record setelah dibaca&quot;</b> — tidak. Record hilang hanya karena <b>retensi</b> (waktu/ukuran), bukan karena dibaca.</li><li><b>&quot;Urutan global di seluruh topic terjaga&quot;</b> — tidak; urutan hanya dijamin per partition.</li><li><b>&quot;Semakin banyak partition selalu lebih baik&quot;</b> — berlebihan menambah partition memperbesar metadata, file, dan waktu recovery.</li><li><b>&quot;Offset ditentukan producer&quot;</b> — tidak; offset diberikan broker saat record ditulis.</li></ul>'
    },
    {
      type: 'vocab',
      items: [
        ['Record / Event', 'Unit data berisi key, value, dan timestamp yang ditulis ke Kafka.'],
        ['Topic', 'Nama logikal tempat record ditulis; terdiri dari satu atau banyak partition.'],
        ['Partition', 'Satu segmen log berurutan milik topic, disimpan pada satu broker.'],
        ['Offset', 'Nomor urut posisi record di dalam satu partition, dimulai dari 0.'],
        ['Broker', 'Proses server Kafka yang menyimpan partition dan melayani produksi/konsumsi.'],
        ['Replication', 'Salinan partition pada broker lain (leader + follower) untuk toleransi kegagalan.'],
        ['Consumer group', 'Kumpulan consumer dengan group.id sama yang berbagi partition secara eksklusif.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Urutkan kembali <b>alur 6 langkah</b> data di Kafka dengan bahasamu sendiri.</li><li>Sebutkan <b>10 istilah inti</b> dan fungsi singkatnya — uji dirimu tanpa melihat tabel.</li><li>Jelaskan mengapa record dengan <b>key yang sama</b> selalu masuk partition yang sama, dan mengapa itu penting.</li><li>Pada topic 3 partition: berapa consumer maksimal yang berguna dalam satu group? Apa yang terjadi bila ada 5?</li><li>Mengapa offset disebut &quot;kemajuan pembacaan milik consumer&quot;, bukan milik broker?</li></ol>'
    }
  ],
  recap: [
    'Sepulah istilah inti Kafka: <b>record, topic, partition, offset, producer, consumer, broker, cluster, replication, consumer group</b>.',
    'Alur data: producer → menentukan partition → broker menulis + memberi offset → consumer membaca → <b>consumer commit offset</b> sebagai penanda kemajuan.',
    '<b>Urutan hanya dijamin di dalam satu partition</b>; antar partition tidak ada urutan global — key menentukan partition tujuan.',
    'Partition adalah unit paralelisme: <b>maksimal satu consumer per partition dalam satu group</b>, consumer berlebih jadi idle, group berbeda membaca independen.'
  ]
});
