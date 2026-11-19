/* ============================================================
   Pelajaran Apache Kafka — 22: Storage, Retention & Recovery
   ============================================================ */
'use strict';

window.KAFKA_LESSONS = window.KAFKA_LESSONS || [];

window.KAFKA_LESSONS.push({
  id: 'storage-retention-recovery',
  title: 'Storage, Retention & Recovery',
  chapter: 'Produksi',
  duration: '15 menit',
  intro: [
    'Banyak yang mengira Kafka adalah antrean yang menyimpan pesan sampai dibaca — padahal Kafka adalah <b>log terdistribusi</b>: record disimpan sebagai file di disk, dibaca berdasarkan offset, dan <b>dihapus otomatis berdasarkan retensi waktu atau ukuran</b>, bukan karena sudah dibaca. Memahami model penyimpanan ini berarti memahami mengapa memori tidak ikut terpakai, mengapa disk SSD sangat menentukan performa, dan bagaimana Kafka bertahan dari kegagalan.',
    'Pelajaran ini membahas struktur penyimpanan (segment log, index), kebijakan <b>retensi</b> dan <b>compaction</b>, beserta mekanisme <b>replication dan pemulihan</b> saat broker mati: ISR, leader/follower, unclean leader election, dan bagaimana memastikan data tetap utuh.'
  ],
  objectives: [
    'Menjelaskan struktur penyimpanan Kafka: log, segment, dan index',
    'Mengatur retensi berbasis waktu dan ukuran beserta konsekuensinya',
    'Membandingkan retensi biasa dengan log compaction',
    'Menjelaskan mekanisme pemulihan: ISR, leadership, dan unclean leader election'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Bagaimana Kafka menyimpan data</h3><p>Setiap partition adalah <b>satu log di disk</b>. Record ditulis berurutan di akhir log (append) dan dibaca dari posisi offset tertentu. Log dipecah menjadi <b>segment</b> — file-file berurutan dengan rentang offset — sehingga penghapusan cukup dengan menghapus file segment lama, bukan memotong isi file.</p><table><thead><tr><th>Komponen</th><th>Fungsi</th></tr></thead><tbody><tr><td><b>Log segment</b></td><td>File berisi record (mis. <code>00000000000000000000.log</code> — angka = offset awal)</td></tr><tr><td><b>Index</b></td><td>File offset → posisi byte, dan timestamp → posisi — agar pencarian offset cepat tanpa membaca seluruh file</td></tr><tr><td><b>Active segment</b></td><td>Segment yang sedang ditulisi; tidak pernah dihapus oleh retensi</td></tr><tr><td><b>Log cleaner</b></td><td>Proses untuk <b>compaction</b> (menyusutkan log lama)</td></tr></tbody></table><p>Karena sifat <b>append-only</b> dan tidak ada update in-place, Kafka tidak membutuhkan struktur b-tree atau buffer pool yang besar — inilah alasan Kafka optimal pada disk dan mengapa arsitektur penyimpanannya jauh lebih sederhana daripada database.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 330" width="760" role="img" aria-label="Struktur penyimpanan Kafka: log partition terbagi menjadi beberapa segment dengan index dan retensi menghapus segment lama">
        <rect x="20" y="30" width="720" height="70" rx="8" class="u-hd"/>
        <text x="380" y="58" class="u-title" text-anchor="middle">Partition order-events di broker (satu direktori)</text>
        <text x="380" y="84" class="u-lbl" text-anchor="middle">order-events-0/ — log terurut per offset</text>
        <rect x="30" y="130" width="150" height="70" rx="6" class="u-box"/>
        <text x="105" y="158" class="u-lbl" text-anchor="middle">segment lama</text>
        <text x="105" y="182" class="u-lbl" text-anchor="middle">offset 0–9.999</text>
        <rect x="190" y="130" width="150" height="70" rx="6" class="u-box"/>
        <text x="265" y="158" class="u-lbl" text-anchor="middle">segment lama</text>
        <text x="265" y="182" class="u-lbl" text-anchor="middle">offset 10.000–19.999</text>
        <rect x="350" y="130" width="150" height="70" rx="6" class="u-box"/>
        <text x="425" y="158" class="u-lbl" text-anchor="middle">segment aktif</text>
        <text x="425" y="182" class="u-lbl" text-anchor="middle">offset 20.000–sekarang</text>
        <rect x="510" y="130" width="110" height="70" rx="6" class="u-hd"/>
        <text x="565" y="158" class="u-lbl" text-anchor="middle">.index</text>
        <text x="565" y="182" class="u-lbl" text-anchor="middle">offset → byte</text>
        <rect x="630" y="130" width="110" height="70" rx="6" class="u-hd"/>
        <text x="685" y="158" class="u-lbl" text-anchor="middle">.timeindex</text>
        <text x="685" y="182" class="u-lbl" text-anchor="middle">waktu → byte</text>
        <line x1="105" y1="210" x2="105" y2="248" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="30" y="254" width="310" height="56" rx="8" class="u-hd"/>
        <text x="185" y="278" class="u-title" text-anchor="middle">Retensi menghapus segment LAMA</text>
        <text x="185" y="300" class="u-lbl" text-anchor="middle">tak perlu memotong isi file (append-only)</text>
        <rect x="420" y="254" width="320" height="56" rx="8" class="u-box"/>
        <text x="580" y="278" class="u-title" text-anchor="middle">Compaction: sisakan nilai TERAKHIR per key</text>
        <text x="580" y="300" class="u-lbl" text-anchor="middle">untuk topic state (checkpoint, profil)</text>
      </svg></div><figcaption>Log dipecah menjadi segment agar penghapusan cukup menghapus file lama; index mempercepat pencarian offset.</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Retensi: waktu dan ukuran</h3><p>Record tetap tersedia sampai salah satu batas tercapai (mana yang lebih dulu):</p><ul><li><b>time.retention.ms</b> — berapa lama record boleh bertahan (default 7 hari; 1 hari = 86400000 ms).</li><li><b>size.retention.bytes</b> — batas ukuran per partition (default −1 = tak terbatas, hanya waktu yang berlaku).</li></ul><p>Retensi bukan sekadar soal pembersihan — ia menentukan <b>berapa jauh kamu bisa replay</b>: memperbaiki consumer yang salah offset, membangun ulang projection, atau mengaudit kejadian minggu lalu. Retensi terlalu pendek membatasi kemampuan itu; terlalu panjang menghabiskan disk. Keputusan yang wajar: <b>samakan dengan kebutuhan replay terjauh yang masuk akal</b>, misal 7–30 hari untuk topik bisnis, 24 jam untuk log teknis.</p>'
    },
    {
      type: 'example',
      title: 'Mengatur retensi per topic',
      lang: 'bash',
      output: false,
      code: `# retensi 30 hari untuk topik bisnis
kafka-configs.sh --bootstrap-server localhost:9092 \\
  --alter --add-config retention.ms=2592000000 \\
  --entity-type topics --entity-name order-events

# batasi ukuran 50 GB per partisi (mana yang lebih dulu tercapai)
kafka-configs.sh --bootstrap-server localhost:9092 \\
  --alter --add-config retention.bytes=53687091200 \\
  --entity-type topics --entity-name order-events

# lihat konfigurasi aktif
kafka-configs.sh --bootstrap-server localhost:9092 \\
  --describe --entity-type topics --entity-name order-events

# topic baru dengan retensi sejak awal
kafka-topics.sh --bootstrap-server localhost:9092 --create \\
  --topic payment-events --partitions 12 --replication-factor 3 \\
  --config retention.ms=604800000 --config segment.bytes=134217728

# hapus record secara manual (mis. karena kebijakan)
kafka-delete-records.sh --bootstrap-server localhost:9092 \\
  --offset-json-file delete-before-offset.json`,
      explain: [
        '<code>retention.ms</code> dihitung dari <b>waktu record ditulis</b>, bukan waktu dibaca — membaca tidak menghapus apa pun (prinsip log).',
        '<code>segment.bytes</code> menentukan seberapa sering file segment baru dibuat; segment lebih kecil = penghapusan lebih granular, tetapi jumlah file lebih banyak.',
        '<b>delete-records</b> memungkinkan pemotongan eksplisit di luar retensi — berguna untuk kebijakan penghapusan data, tetapi bersifat <b>permanen dan tidak bisa dibatalkan</b>.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Compaction: retensi untuk data berbasis kunci</h3><p>Untuk topic yang berperilaku seperti <b>database per kunci</b> (checkpoint consumer, profil pengguna, konfigurasi), menghapus berdasarkan waktu adalah salah: kamu ingin <b>nilai terakhir tetap tersedia selamanya</b>. Di sinilah <b>log compaction</b> berperan:</p><ul><li>Compaction <b>tidak menghapus berdasarkan umur</b> — ia mempertahankan <b>nilai terbaru per kunci</b> dan menyingkirkan duplikat lama.</li><li>Urutan key tidak dijamin, tetapi <b>setiap key dijamin memiliki setidaknya satu record</b> (nilai terakhirnya).</li><li>Compaction berjalan di background oleh log cleaner; bisa memicu I/O yang signifikan pada topic besar.</li></ul><p>Konfigurasi umum: <code>cleanup.policy=compact</code>, atau <code>compact,delete</code> untuk mengombinasikan compaction dengan penghapusan berdasarkan umur (mis. pertahankan nilai terakhir, tetapi tetap buang yang sangat lama).</p>'
    },
    {
      type: 'example',
      title: 'Retensi biasa vs compaction',
      lang: 'text',
      output: false,
      code: `TOPIC RETENSI BIASA (order-events, retention 7 hari)
  offset 0: user-1 login       ─┐
  offset 1: user-2 login        │ semua record bertahan
  offset 2: user-1 logout       │ sampai lewat 7 hari lalu DIHAPUS
  offset 3: user-3 login       ─┘

TOPIC COMPACTION (user-profile, cleanup.policy=compact)
  key=user-1: {name:"Andi"}        ─┐
  key=user-2: {name:"Budi"}         │ setelah compaction:
  key=user-1: {name:"Andi Wibowo"}  │ user-1 hanya menyisakan nilai TERAKHIR
  key=user-3: {name:"Citra"}       ─┘

KONFIGURASI
  kafka-configs.sh --alter \\
    --add-config cleanup.policy=compact, \\
                 min.cleanable.dirty.ratio=0.5, \\
                 segment.bytes=104857600 \\
    --entity-type topics --entity-name user-profile

PERBANDINGAN CEPAT
  aspek          retention biasa        compaction
  hapus berdasar  waktu / ukuran         key lama (nilai terakhir menang)
  cocok untuk    event / riwayat         state per kunci / checkpoint
  replay         semua dalam retensi     seluruh nilai terakhir per key
  jaminan        semua dalam retensi     setiap key ada minimal 1 record`,
      explain: [
        'Perbedaan intinya: retention menghapus <b>seluruh record lama</b>, compaction menghapus <b>duplikat yang sudah tergantikan</b> — karena itu compaction cocok untuk topik yang berfungsi seperti tabel.',
        '<code>min.cleanable.dirty.ratio</code> menentukan kapan cleaner bekerja: makin kecil, makin sering dibersihkan tetapi makin banyak I/O — default 0.5 adalah titik awal yang wajar.',
        'Jaminan &quot;setiap key tetap ada&quot; membuat compaction ideal untuk <b>state store changelog</b> (Kafka Streams) — pemulihan state tidak perlu memutar seluruh riwayat, cukup nilai terakhir per kunci.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Replication dan pemulihan</h3><p>Setiap partition punya beberapa <b>replica</b>: satu <b>leader</b> (melayani baca/tulis) dan sisanya <b>follower</b> (meniru dari leader). <b>ISR (In-Sync Replicas)</b> adalah daftar replica yang dianggap up-to-date:</p><ul><li><b>min.insync.replicas</b> — jumlah minimum follower yang harus sinkron agar write dianggap aman (mis. RF=3, min.insync=2 → toleransi 1 kegagalan tanpa kehilangan acknowledged write).</li><li><b>Ketika leader mati</b> — Kafka memilih leader baru dari ISR; proses ini disebut <b>leader election</b>.</li><li><b>unclean leader election</b> — bila diizinkan, broker yang <b>tidak</b> berada di ISR bisa menjadi leader → record terbaru yang belum tersinkron <b>hilang permanen</b>. Untuk data penting, matikan (default modern: tidak diizinkan).</li></ul><p>Prinsipnya: <b>acknowledge yang diterima client harus benar-benar tersimpan di beberapa mesin</b> — itulah yang dipertahankan oleh kombinasi <code>acks=all</code> + <code>min.insync.replicas</code>.</p>'
    },
    {
      type: 'example',
      title: 'Konfigurasi daya tahan dan pemulihan',
      lang: 'text',
      output: false,
      code: `BROKER
  default.replication.factor=3
  min.insync.replicas=2
  unclean.leader.election.enable=false   # JANGAN izinkan data hilang
  log.dirs=/var/kafka/data,/var/kafka/data2   # multi-disk
  log.retention.hours=168
  log.segment.bytes=1073741824

PRODUCER (untuk topik penting)
  acks=all
  enable.idempotence=true                # aman dari duplikat saat retry
  max.in.flight.requests.per.connection=5 # aman karena idempoten

SAAT BROKER MATI
  1. Kesehatan ISR menyusut (min.insync.replicas bisa terlampaui)
  2. Leader baru terpilih dari ISR yang tersisa
  3. Producer menerima NotEnoughReplicas → menunggu / gagal jujur
  4. Broker kembali → follower menyusul (membaca ulang dari leader)
  5. ISR pulih → traffic normal kembali

PEMERIKSAAN
  kafka-topics.sh --describe --under-replicated-partitions   # harus kosong
  kafka-metadata.sh --describe                               # RF & leader per partition`,
      explain: [
        'Kombinasi <code>acks=all</code> + <code>min.insync.replicas=2</code> adalah inti daya tahan: producer hanya menerima sukses bila <b>dua mesin</b> benar-benar menyimpannya.',
        'Ketika ISR menyusut di bawah min.insync, producer menerima error <b>NotEnoughReplicas</b> — lebih baik menolak jujur daripada mengaku sukses lalu kehilangan data.',
        'Proses pemulihan broker yang kembali (menyusul dari leader) berjalan otomatis — namun selama itu beban I/O naik, jadi siapkan kapasitas disk untuk fase penyusulan.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan penyimpanan yang sering terjadi',
      text: '<ul><li><b>Retensi default tanpa dipertimbangkan</b> — 7 hari bisa terlalu pendek untuk audit, terlalu panjang untuk topik log besar.</li><li><b>size.retention.bytes dibiarkan tak terbatas</b> — topik besar bisa menghabiskan disk broker hingga penuh dan menyeret seluruh cluster.</li><li><b>RF=1 di produksi</b> — satu kegagalan disk = kehilangan data permanen.</li><li><b>min.insync.replicas dibiarkan 1</b> — dengan RF 3 pun write bisa lolos hanya di satu mesin.</li><li><b>Mengaktifkan unclean leader election demi ketersediaan</b> — ketersediaan naik, tetapi data bisa hilang diam-diam.</li><li><b>SSD tanpa memperhatikan IOPS</b> — compaction, snapshot, dan replikasi bersaing untuk I/O yang sama.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Checklist penyimpanan sehat',
      text: '<p>(1) <b>RF ≥ 3</b> dan <b>min.insync.replicas = 2</b> untuk topik produksi. (2) <b>Unclean leader election dimatikan</b>. (3) Retensi ditentukan per topik sesuai kebutuhan replay, bukan default. (4) <b>Pantau penggunaan disk per broker</b> dan ukuran partisi tidak merata. (5) Uji pemulihan berkala: matikan satu broker di staging dan pastikan ISR pulih serta data utuh. Enam menit per bulan untuk menguji ini jauh lebih murah daripada kehilangan data.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Log (partition)', 'Urutan record append-only yang menjadi isi satu partition.'],
        ['Segment', 'Potongan file log berdasarkan rentang offset; unit penghapusan.'],
        ['Index', 'File pemetaan offset/timestamp ke posisi byte untuk pencarian cepat.'],
        ['Retention', 'Kebijakan penghapusan berdasarkan waktu atau ukuran.'],
        ['Log compaction', 'Menyusun ulang log agar hanya menyisakan nilai terakhir per kunci.'],
        ['ISR (In-Sync Replicas)', 'Daftar replica yang dianggap sinkron dengan leader.'],
        ['Leader election', 'Pemilihan broker pemimpin partition saat leader lama hilang.'],
        ['Unclean leader election', 'Pemilihan leader dari luar ISR — berisiko kehilangan data.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Jelaskan bagaimana segment dan index bekerja sama agar penghapusan dan pencarian efisien.</li><li>Mengapa membaca record tidak menghapusnya? Bagaimana penghapusan benar-benar terjadi?</li><li>Bandingkan <b>retensi</b> dan <b>compaction</b>: kapan masing-masing tepat?</li><li>Skenario RF=3, min.insync=2, satu broker mati — apakah producer masih bisa menulis? Bagaimana kalau dua mati?</li><li>Apa risiko unclean leader election dan bagaimana mencegahnya?</li></ol>'
    }
  ],
  recap: [
    'Partition = <b>log append-only</b> yang dipecah jadi <b>segment</b>; penghapusan cukup membuang file lama, <b>index</b> mempercepat pencarian.',
    '<b>Retensi</b> (waktu/ukuran) menentukan jarak replay; <b>compaction</b> menyisakan <b>nilai terakhir per kunci</b> untuk topic state.',
    '<b>RF + min.insync.replicas + acks=all</b> = jaminan write benar-benar tersimpan di beberapa mesin.',
    'Pemulihan: leader baru dari <b>ISR</b>; <b>unclean leader election</b> berisiko kehilangan data — matikan untuk topik penting.'
  ]
});
