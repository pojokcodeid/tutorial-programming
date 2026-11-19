/* ============================================================
   Pelajaran Apache Kafka — 08: Replication, ISR & Durability
   ============================================================ */
'use strict';

window.KAFKA_LESSONS = window.KAFKA_LESSONS || [];

window.KAFKA_LESSONS.push({
  id: 'replication-durability',
  title: 'Replication, ISR & Durability',
  chapter: 'Data Model',
  duration: '15 menit',
  intro:
  [
    'Satu pertanyaan menentukan apakah kamu siap production: <b>kalau satu broker mati, apakah data kamu masih utuh?</b> Jawabannya tidak datang dari keberuntungan, melainkan dari konfigurasi replikasi: berapa salinan yang disimpan, berapa yang harus sehat, dan seberapa jauh broker boleh tertinggal.',
    'Pelajaran ini membongkar mekanisme replikasi Kafka: leader dan follower, replication factor, in-sync replicas (ISR), leader election, tiga mode <code>acks</code>, <code>min.insync.replicas</code>, sampai risiko unclean leader election — dan bagaimana semua itu membentuk trade-off antara durability, availability, dan latency.'
  ],
  objectives: [
    'Menjelaskan peran leader, follower, replication factor, dan in-sync replicas (ISR)',
    'Menjelaskan perbedaan acks=0, acks=1, dan acks=all beserta konsekuensinya',
    'Menjelaskan peran min.insync.replicas dalam menjamin keamanan tulis',
    'Menjelaskan unclean leader election dan trade-off durability vs availability'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Leader, follower, dan replication factor</h3><p>Setiap partition punya satu <b>leader</b> — broker tempat seluruh baca/tulis dilayani. Selain leader, ada <b>follower</b>: salinan partition di broker lain yang terus mengikuti (meng-consume) data dari leader.</p><ul><li><b>Replication factor (RF)</b> — jumlah total salinan (leader + follower). RF=3 berarti ada 3 salinan di 3 broker berbeda.</li><li><b>Followers menyalin secara asinkron</b> — ada jeda kecil antara leader dan follower (itulah sumber trade-off latency vs keamanan).</li><li><b>Ketika leader mati</b> — follower yang memenuhi syarat dipromosikan menjadi leader baru.</li></ul><p>Aturan praktis: RF <b>minimal 3</b> di production, dan letakkan replica di broker/rack berbeda agar kegagalan satu mesin tidak menghabiskan semua salinan.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 320" width="760" role="img" aria-label="Topic dengan replication factor tiga menampilkan leader dan follower serta status in-sync replicas">
        <rect x="20" y="30" width="230" height="120" rx="10" class="u-box"/>
        <text x="135" y="56" class="u-title" text-anchor="middle">Broker 1</text>
        <line x1="34" y1="66" x2="236" y2="66" class="u-line"/>
        <rect x="34" y="80" width="202" height="52" rx="6" class="u-hd"/>
        <text x="135" y="104" class="u-lbl" text-anchor="middle">Partition 0 — LEADER</text>
        <text x="135" y="124" class="u-lbl" text-anchor="middle">baca/tulis dilayani di sini</text>
        <rect x="265" y="30" width="230" height="120" rx="10" class="u-box"/>
        <text x="380" y="56" class="u-title" text-anchor="middle">Broker 2</text>
        <line x1="279" y1="66" x2="481" y2="66" class="u-line"/>
        <rect x="279" y="80" width="202" height="52" rx="6" class="u-box"/>
        <text x="380" y="104" class="u-lbl" text-anchor="middle">Partition 0 — Follower</text>
        <text x="380" y="124" class="u-lbl" text-anchor="middle">in-sync (ISR)</text>
        <rect x="510" y="30" width="230" height="120" rx="10" class="u-box"/>
        <text x="625" y="56" class="u-title" text-anchor="middle">Broker 3</text>
        <line x1="524" y1="66" x2="726" y2="66" class="u-line"/>
        <rect x="524" y="80" width="202" height="52" rx="6" class="u-box"/>
        <text x="625" y="104" class="u-lbl" text-anchor="middle">Partition 0 — Follower</text>
        <text x="625" y="124" class="u-lbl" text-anchor="middle">tertinggal 12 offset</text>
        <line x1="135" y1="156" x2="380" y2="156" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="135" y1="156" x2="625" y2="156" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="380" y="176" class="u-lbl" text-anchor="middle">follower menyalin dari leader (fetch)</text>
        <rect x="20" y="204" width="720" height="96" rx="10" class="u-hd"/>
        <text x="380" y="232" class="u-title" text-anchor="middle">ISR (In-Sync Replicas) = [Broker 1, Broker 2]</text>
        <text x="380" y="258" class="u-lbl" text-anchor="middle">RF = 3 (3 salinan) · min.insync.replicas = 2</text>
        <text x="380" y="282" class="u-lbl" text-anchor="middle">tulis aman hanya bila minimal 2 anggota ISR mengonfirmasi</text>
      </svg></div><figcaption>ISR berisi replica yang sehat dan menyusul; broker 3 yang tertinggal keluar dari ISR.</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>In-Sync Replicas (ISR)</h3><p>ISR adalah kumpulan replica (termasuk leader) yang <b>dianggap sehat dan cukup up-to-date</b>. Sebuah follower keluar dari ISR bila tertinggal lebih dari <code>replica.lag.time.max.ms</code> (default 30 detik), dan kembali masuk begitu menyusul.</p><p>ISR menjadi penengah antara &quot;semua salinan harus sempurna&quot; (lambat) dan &quot;bebas saja tertinggal&quot; (berisiko). Ketika leader mati, Kafka hanya mempromosikan follower dari <b>ISR</b> — itulah mekanisme <b>leader election</b> yang aman.</p><p>Perhatikan pada figur: broker 3 tertinggal 12 offset tetapi masih dalam toleransi waktu → boleh jadi masih di ISR; bila melewati batas waktu, ia dikeluarkan dari ISR dan tulis dengan <code>acks=all</code> tidak lagi menunggunya.</p>'
    },
    {
      type: 'example',
      title: 'Tiga mode acks',
      lang: 'text',
      output: false,
      code: `acks=0 (fire-and-forget)
  Producer ──▶ Broker : langsung dianggap sukses
  Risiko: broker belum menerima, jaringan putus, atau data korup
          TETAP dianggap sukses. Cocok untuk log metrik yang
          tidak kritis.

acks=1 (leader only)
  Producer ──▶ Leader: sukses begitu leader menulis
  Risiko: leader mati sebelum follower menyalin → data hilang.
  Follower yang belum menyalin tidak ikut menentukan.

acks=all (leader + seluruh ISR)
  Producer ──▶ Leader + minimal min.insync.replicas anggota
              mengonfirmasi → baru sukses.
  Data jauh lebih aman; latency sedikit lebih tinggi.
  (Kadang disebut acks=-1, identik dengan all.)`,
      explain: [
        '<code>acks=0</code> meniadakan kepastian sama sekali — hanya pantas untuk data yang kehilangannya tidak berpengaruh.',
        '<code>acks=1</code> melindungi dari kegagalan jaringan setelah leader menerima, tetapi <b>tidak melindungi dari kegagalan leader</b> sebelum follower menyalin.',
        '<code>acks=all</code> menjadi benar-benar kuat hanya bila dipasangkan dengan <code>min.insync.replicas</code> yang tepat — tanpa itu, ISR bisa menyusut jadi satu dan perlindungannya sirna.'
      ]
    },
    {
      type: 'text',
      html: '<h3>min.insync.replicas: pasangan wajib acks=all</h3><p>Konfigurasi broker per topic (atau default broker) ini menentukan <b>minimal berapa anggota ISR yang harus mengonfirmasi</b> agar tulis dianggap berhasil. Pola konfigurasi yang umum dipakai:</p><table><thead><tr><th>RF</th><th>min.insync.replicas</th><th>Tetap aman saat...</th></tr></thead><tbody><tr><td>3</td><td>2</td><td>1 broker mati (ISR tinggal 2, tulis tetap jalan)</td></tr><tr><td>3</td><td>3</td><td>Tidak ada — satu broker mati pun tulis berhenti (paling ketat)</td></tr><tr><td>2</td><td>2</td><td>Tidak ada — sama ketatnya, dan RF 2 hanya sanggup bertahan 1 kegagalan bila ISR penuh</td></tr></tbody></table><p>Konsekuensinya jelas: bila anggota ISR turun di bawah <code>min.insync.replicas</code>, producer dengan <code>acks=all</code> akan <b>gagal menulis</b> (NotEnoughReplicas) — Kafka memilih <b>tidak menerima data</b> daripada menerima data berisiko hilang. Inilah trade-off availability vs durability secara harfiah.</p>'
    },
    {
      type: 'example',
      title: 'Konfigurasi replikasi yang umum dipakai',
      lang: 'bash',
      output: false,
      code: `# saat membuat topic (production)
docker exec kafka /opt/kafka/bin/kafka-topics.sh \\
  --bootstrap-server localhost:9092 --create \\
  --topic payment-events --partitions 12 \\
  --replication-factor 3 \\
  --config min.insync.replicas=2 \\
  --config acks=all

# verifikasi konfigurasinya
docker exec kafka /opt/kafka/bin/kafka-configs.sh \\
  --bootstrap-server localhost:9092 --entity-type topics \\
  --entity-name payment-events --describe

# cek kesehatan replikasi
docker exec kafka /opt/kafka/bin/kafka-topics.sh \\
  --bootstrap-server localhost:9092 --describe --topic payment-events`,
      explain: [
        '<code>--replication-factor 3</code> menyimpan 3 salinan; <code>min.insync.replicas=2</code> menjamin minimal 2 salinan mengonfirmasi setiap tulis.',
        'Perhatikan bahwa latihan satu broker tetap memakai RF=1 — konfigurasi production baru bermakna setelah ada 3 broker (dibahas di pelajaran cluster).',
        'Perintah <code>--describe</code> menampilkan kolom ISR: pastikan angkanya sama dengan RF — bila berkurang, ada replica yang tertinggal/bermasalah.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Unclean leader election: pilihan yang menakutkan</h3><p>Bayangkan semua anggota ISR mati bersamaan (mis. dua broker rusak). Ketika ada permintaan leadership, tersisa dua pilihan:</p><ul><li><b>Menunggu</b> (default, <code>unclean.leader.election.enable=false</b>) — partition tetap tidak dapat menulis/selamanya bila leader tidak kembali. Data aman, tapi <b>partition offline</b>.</li><li><b>Memilih leader tak bersih</b> (diaktifkan) — follower yang <b>tertinggal</b> dipromosikan; partition hidup kembali, tetapi <b>record yang belum tersalin hilang permanen</b>.</li></ul><p>Default Kafka memilih keamanan data (<code>false</code>). Mengaktifkannya hanya layak untuk data yang rela kehilangan sebagian demi tetap tersedia (mis. log aktivitas non-kritis). Inilah inti trade-off: <b>durability vs availability</b> — kamu tidak bisa maksimal di dua sisi sekaligus.</p>'
    },
    {
      type: 'example',
      title: 'Membaca status replikasi dari describe',
      lang: 'text',
      output: false,
      code: `Topic: payment-events  Partition: 0  Leader: 1  Replicas: 1,2,3  ISR: 1,2,3
Topic: payment-events  Partition: 1  Leader: 2  Replicas: 2,3,1  ISR: 2,3,1
Topic: payment-events  Partition: 2  Leader: 3  Replicas: 3,1,2  ISR: 3,1      ← broker 2 tertinggal

Replicas : urutan penempatan salinan (yang pertama = preferensi leader)
ISR      : salinan yang sehat & menyusul saat ini
Leader   : broker yang melayani baca/tulis sekarang`,
      explain: [
        'Baris partition 2 menunjukkan <b>ISR menyusut</b> (hanya 1,3) — dengan <code>min.insync.replicas=2</code> tulis masih aman, tetapi satu kegagalan lagi membuat tulis berhenti.',
        'Kolom <b>Replicas tetap lengkap [3,1,2]</b> — salinan tidak dihapus, hanya dianggap tidak in-sync; begitu broker 2 pulih, ia menyalin ulang dan kembali ke ISR.',
        'Kebiasaan baik: pantau perubahan ISR (shrink/expand) sebagai metrik kesehatan cluster — salah satu tanda awal disk atau jaringan bermasalah.'
      ]
    },
    {
      type: 'warn',
      title: 'Konfigurasi replikasi yang sering keliru',
      text: '<ul><li><b>acks=all tanpa min.insync.replicas</b> — ISR bisa menyusut ke 1 dan perlindungan tidak berarti.</li><li><b>RF=1 di production</b> — satu kegagalan broker = data hilang permanen.</li><li><b>Menempatkan semua replica di satu mesin/rack</b> — satu kegagalan menghabiskan semua salinan.</li><li><b>Mengaktifkan unclean election tanpa memahami risikonya</b> — data bisa hilang diam-diam.</li><li><b>Mengabaikan ISR yang terus menyusut</b> — padahal itu gejala awal kegagalan berat.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Formula kombinasi yang lazim',
      text: '<p>Pola paling umum di lapangan: <b>replication.factor=3 + min.insync.replicas=2 + acks=all (producer)</b>. Kombinasi ini bertahan terhadap satu kegagalan broker tanpa mengorbankan keamanan tulis, tetapi tetap mengizinkan operasi selama ada dua broker sehat. Untuk data super kritis, pertimbangkan RF lebih tinggi atau strategi backup lintas wilayah.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Leader', 'Broker yang melayani baca/tulis untuk sebuah partition.'],
        ['Follower', 'Salinan partition yang menyalin data dari leader.'],
        ['Replication factor', 'Jumlah total salinan partition (leader + follower).'],
        ['ISR (In-Sync Replicas)', 'Kumpulan replica sehat dan menyusul dengan leader.'],
        ['acks', 'Tingkat kepastian tulis: 0, 1, atau all.'],
        ['min.insync.replicas', 'Minimal anggota ISR yang wajib mengonfirmasi tulis.'],
        ['Leader election', 'Proses memilih leader baru saat leader lama mati.'],
        ['Unclean leader election', 'Pemilihan leader dari follower yang masih tertinggal.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Sebutkan perbedaan <b>Replicas</b> dan <b>ISR</b> pada output <code>--describe</code>.</li><li>RF=3, min.insync.replicas=2: broker mana saja yang boleh mati tanpa menurunkan keamanan tulis?</li><li>Mengapa <code>acks=all</code> tanpa <code>min.insync.replicas</code> bisa menyesatkan?</li><li>Bandingkan dua pilihan saat seluruh ISR mati: tunggu vs unclean election — untung ruginya masing-masing.</li><li>Uji: hentikan satu broker di cluster latihan, amati perubahan ISR, lalu perhatikan pesan error producer (bila kamu mengonfigurasi acks=all + min.insync=2).</li></ol>'
    }
  ],
  recap: [
    'Setiap partition punya <b>satu leader</b> yang melayani baca/tulis dan beberapa <b>follower</b>; jumlah total salinan = replication factor.',
    '<b>ISR = replica sehat dan menyusul</b> — hanya anggota ISR yang dipromosikan menjadi leader baru.',
    '<b>acks=0/1/all</b> menentukan kepastian tulis; <code>acks=all</code> baru bermakna dengan <code>min.insync.replicas</code> yang tepat.',
    'Unclean election menyelamatkan ketersediaan dengan <b>risiko kehilangan data</b> — inti trade-off <b>durability vs availability</b>.'
  ]
});
