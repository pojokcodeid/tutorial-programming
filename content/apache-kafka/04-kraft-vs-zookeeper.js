/* ============================================================
   Pelajaran Apache Kafka — 04: KRaft vs ZooKeeper
   ============================================================ */
'use strict';

window.KAFKA_LESSONS = window.KAFKA_LESSONS || [];

window.KAFKA_LESSONS.push({
  id: 'kraft-vs-zookeeper',
  title: 'KRaft vs ZooKeeper',
  chapter: 'Instalasi & KRaft',
  duration: '12 menit',
  intro: [
    'Banyak tutorial Kafka lama masih meminta kamu menjalankan ZooKeeper lebih dulu sebelum broker. Kalau kamu membaca tutorial semacam itu hari ini, kamu akan bertanya-tanya: apakah ZooKeeper masih wajib? Jawabannya: <b>tidak lagi</b>. Sejak Kafka 4.0, ZooKeeper sudah sepenuhnya digantikan mode <b>KRaft</b>.',
    'Pelajaran ini menjelaskan peran ZooKeeper pada arsitektur lama, bagaimana KRaft mengambil alih pekerjaan itu lewat metadata quorum internal, apa untung-ruginya, serta kenapa kamu tetap perlu mengenali ZooKeeper saat membaca dokumentasi atau tutorial lama.'
  ],
  objectives: [
    'Menjelaskan peran ZooKeeper pada arsitektur Kafka lama dan mengapa perannya besar',
    'Menjelaskan cara KRaft bekerja: controller, broker, dan metadata quorum berbasis Raft',
    'Membandingkan ZooKeeper vs KRaft dari sisi komponen, operasi, dan skalabilitas',
    'Menyebutkan langkah migrasi umum serta alasan tutorial lama masih memakai ZooKeeper'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Arsitektur lama: Kafka + ZooKeeper</h3><p>Pada versi lama, Kafka tidak mengelola metadata-nya sendiri. Semua informasi krusial — daftar broker, partisi mana yang leader-nya di mana, konfigurasi topic, siapa controller aktif, siapa anggota consumer group (untuk versi lama) — disimpan di <b>ZooKeeper</b>, sistem terpisah yang ditulis khusus untuk koordinasi.</p><p>Akibatnya operasi jadi dua sistem sekaligus:</p><ul><li>ZooKeeper berjalan sebagai <b>ensemble</b> (biasanya 3 atau 5 node) dengan pemilihan leader sendiri.</li><li>Broker Kafka bergantung penuh pada ZooKeeper — ZooKeeper mati, broker tidak bisa mengubah metadata (walau membaca/menulis data sementara mungkin masih jalan).</li><li>Deploy, monitoring, upgrade, dan troubleshooting berlaku untuk <b>dua stack</b>.</li></ul>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 330" width="760" role="img" aria-label="Perbandingan arsitektur Kafka lama dengan ZooKeeper terpisah dan Kafka modern dengan KRaft">
        <rect x="20" y="20" width="340" height="290" rx="10" class="u-box"/>
        <text x="190" y="46" class="u-title" text-anchor="middle">Arsitektur Lama (ZooKeeper)</text>
        <line x1="34" y1="56" x2="346" y2="56" class="u-line"/>
        <rect x="40" y="72" width="300" height="56" rx="6" class="u-hd"/>
        <text x="190" y="96" class="u-lbl" text-anchor="middle">ZooKeeper Ensemble (3 node)</text>
        <text x="190" y="116" class="u-lbl" text-anchor="middle">metadata, leader election</text>
        <line x1="190" y1="134" x2="190" y2="160" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="40" y="166" width="140" height="52" rx="6" class="u-box"/>
        <text x="110" y="190" class="u-lbl" text-anchor="middle">Broker 1</text>
        <text x="110" y="208" class="u-lbl" text-anchor="middle">partition</text>
        <rect x="200" y="166" width="140" height="52" rx="6" class="u-box"/>
        <text x="270" y="190" class="u-lbl" text-anchor="middle">Broker 2</text>
        <text x="270" y="208" class="u-lbl" text-anchor="middle">partition</text>
        <text x="190" y="248" class="u-lbl" text-anchor="middle">dua sistem dioperasikan</text>
        <text x="190" y="270" class="u-lbl" text-anchor="middle">&amp; di-monitor bersama</text>
        <text x="190" y="296" class="u-lbl" text-anchor="middle">ZK mati = metadata terkunci</text>
        <rect x="400" y="20" width="340" height="290" rx="10" class="u-box"/>
        <text x="570" y="46" class="u-title" text-anchor="middle">Arsitektur Modern (KRaft)</text>
        <line x1="414" y1="56" x2="726" y2="56" class="u-line"/>
        <rect x="420" y="72" width="300" height="56" rx="6" class="u-hd"/>
        <text x="570" y="96" class="u-lbl" text-anchor="middle">Metadata Quorum (Raft internal)</text>
        <text x="570" y="116" class="u-lbl" text-anchor="middle">controller = anggota quorum</text>
        <line x1="570" y1="134" x2="570" y2="160" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="420" y="166" width="140" height="52" rx="6" class="u-box"/>
        <text x="490" y="190" class="u-lbl" text-anchor="middle">Broker 1</text>
        <text x="490" y="208" class="u-lbl" text-anchor="middle">partition</text>
        <rect x="580" y="166" width="140" height="52" rx="6" class="u-box"/>
        <text x="650" y="190" class="u-lbl" text-anchor="middle">Broker 2</text>
        <text x="650" y="208" class="u-lbl" text-anchor="middle">partition</text>
        <text x="570" y="248" class="u-lbl" text-anchor="middle">satu proses, satu konfigurasi</text>
        <text x="570" y="270" class="u-lbl" text-anchor="middle">tanpa dependensi eksternal</text>
        <text x="570" y="296" class="u-lbl" text-anchor="middle">Kafka 4.0: KRaft-only</text>
      </svg></div><figcaption>KRaft memindahkan pekerjaan ZooKeeper ke dalam proses Kafka sendiri lewat metadata quorum.</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Lalu, apa itu KRaft?</h3><p><b>KRaft (Kafka Raft)</b> adalah mode di mana Kafka <b>mengelola metadata-nya sendiri di dalam prosesnya</b>. Tidak ada layanan koordinasi terpisah lagi. Dua peran utama:</p><ul><li><b>Controller</b> — broker yang bertugas mengelola metadata cluster: menjaga daftar broker, menetapkan leader partition, menangani create/delete topic, dan mengoordinasi perubahan konfigurasi.</li><li><b>Broker</b> — menyimpan partition dan melayani produksi/konsumsi data (peran yang dikenal sejak awal).</li></ul><p>Keduanya dijalankan oleh proses yang sama (bisa terpisah atau <i>combined</i> seperti environment latihan). Yang benar-benar baru adalah <b>metadata quorum</b>: kumpulan controller (anggota voting) yang menyimpan metadata pada log internal dan mencapai kesepakatan lewat protokol <b>Raft</b>. Karena itu metadata menjadi:</p><ul><li><b>Tahan kegagalan</b> — selama mayoritas quorum hidup, metadata tetap dapat berubah.</li><li><b>Ter-replikasi</b> — tiap anggota quorum menyimpan salinan metadata.</li><li><b>Otomatis tervalidasi</b> — perubahan hanya diterima bila disetujui quorum.</li></ul>'
    },
    {
      type: 'example',
      title: 'Membandingkan dua arsitektur',
      lang: 'text',
      output: false,
      code: `ZOOKEEPER (Kafka lama)                 KRAFT (Kafka modern)
─────────────────────                 ────────────────────
ZooKeeper ensemble (3-5 node)         Metadata quorum (Raft)
  • daftar broker                         • disimpan di log Kafka
  • leader partition                      • voting antar controller
  • konfigurasi topic                   Broker (process.roles)
  • session consumer group               • broker: simpan partition
Broker Kafka                              • controller: kelola metadata
  • simpan partition                     • broker,controller: keduanya
  • melayani produce/consume
                                       Satu proses, satu log, satu
Dua stack, dua monitoring,             konfigurasi, tanpa dependensi
dua jalur upgrade                      eksternal ke pihak ketiga`,
      explain: [
        'Perbedaan terbesar bukan pada penyimpanan data record — tetapi pada <b>metadata</b>: dulu dipegang ZooKeeper, sekarang dipegang quorum internal Kafka.',
        'KRaft menghapus satu <b>titik kegagalan dan satu beban operasional</b>; tidak perlu lagi mengelola ensemble ZooKeeper terpisah.',
        'Dampak praktis: jumlah proses, port, dan file konfigurasi yang dipantau berkurang signifikan — terasa saat deploy dan troubleshooting.'
      ]
    },
    {
      type: 'text',
      html: '<h3>ZooKeeper vs KRaft: tabel perbandingan</h3><table><thead><tr><th>Aspek</th><th>ZooKeeper</th><th>KRaft</th></tr></thead><tbody><tr><td><b>Komponen</b></td><td>Ensemble ZooKeeper + broker Kafka</td><td>Hanya proses Kafka</td></tr><tr><td><b>Metadata</b></td><td>Disimpan di ZK (znode)</td><td>Disimpan di log internal quorum</td></tr><tr><td><b>Skala metadata</b></td><td>Terbatas — jutaan partisi mulai berat</td><td>Jauh lebih besar, didesain untuk skala modern</td></tr><tr><td><b>Latensi perubahan</b></td><td>Lewat dua sistem (ZK lalu broker)</td><td>Langsung lewat quorum internal</td></tr><tr><td><b>Operasional</b></td><td>Dua stack, dua upgrade, dua monitoring</td><td>Satu stack</td></tr><tr><td><b>Status rilis</b></td><td>Deprecated, dihapus sejak Kafka 4.0</td><td>Default dan satu-satunya mode</td></tr></tbody></table>'
    },
    {
      type: 'text',
      html: '<h3>Kenapa banyak tutorial lama masih ZooKeeper?</h3><p>Karena sebagian besar materi ditulis sebelum Kafka 4.0 (2025), ketika KRaft masih berstatus <i>early access</i> dan banyak connector/library belum teruji penuh di KRaft. Tutorial lama biasanya meminta:</p><ul><li>Menjalankan <code>zookeeper-server-start.sh</code> lebih dulu.</li><li>Baru menjalankan <code>kafka-server-start.sh</code> dengan <code>zookeeper.connect=localhost:2181</code>.</li><li>Memakai perintah <code>kafka-topics.sh --zookeeper ...</code> (flag lama) alih-alih <code>--bootstrap-server</code>.</li></ul><p>Ketika membaca tutorial lama: <b>terjemahkan saja</b>. <code>--zookeeper localhost:2181</code> → <code>--bootstrap-server localhost:9092</code>; blok ZooKeeper → tidak diperlukan. Untuk belajar hari ini, selalu mulai dari mode KRaft.</p>'
    },
    {
      type: 'example',
      title: 'Menerjemahkan perintah tutorial lama',
      lang: 'bash',
      output: false,
      code: `# TUTORIAL LAMA (ZooKeeper)
zookeeper-server-start.sh config/zookeeper.properties &
kafka-server-start.sh config/server.properties &
kafka-topics.sh --zookeeper localhost:2181 --create \\
  --topic user-events --partitions 3 --replication-factor 1

# MODERN (KRaft, tanpa ZooKeeper)
docker compose up -d
docker exec kafka /opt/kafka/bin/kafka-topics.sh \\
  --bootstrap-server localhost:9092 --create \\
  --topic user-events --partitions 3 --replication-factor 1`,
      explain: [
        'Dua baris pertama pada tutorial lama (menjalankan ZooKeeper lalu broker) <b>hilang total</b> di KRaft — cukup satu container.',
        'Flag <code>--zookeeper</code> digantikan <code>--bootstrap-server</code>: semua operasi admin modern berbicara langsung ke broker.',
        'Perintah yang tersisa pada tutorial lama tetap valid — hanya titik koneksi dan prasyaratnya yang berubah.'
      ]
    },
    {
      type: 'tip',
      title: 'Kenali juga untuk wawancara',
      text: '<p>Pertanyaan &quot;apa perbedaan ZooKeeper dan KRaft&quot; masih sering muncul. Jawaban ringkasnya: dulu metadata dipegang layanan koordinasi terpisah (ZooKeeper) yang harus dioperasikan bersama Kafka; dengan KRaft, metadata dipegang quorum internal Kafka berbasis Raft — satu sistem, lebih sederhana, dan mendukung skala partition yang jauh lebih besar.</p>'
    },
    {
      type: 'warn',
      title: 'Kesalahan konsep yang sering terjadi',
      text: '<ul><li><b>Menyangka KRaft adalah pengganti replication</b> — tidak. KRaft menggantikan ZooKeeper untuk <b>metadata</b>; replikasi data partition tetap lewat leader/follower seperti biasa.</li><li><b>Menjalankan ZooKeeper untuk Kafka 4.x tanpa alasan</b> — mode itu sudah tidak didukung.</li><li><b>Mengira controller hanya ada satu permanen</b> — quorum punya banyak anggota, satu di antaranya menjabat controller aktif dan dapat berpindah bila gagal.</li><li><b>Menyalin konfigurasi <code>zookeeper.connect</code> dari tutorial lama</b> — di KRaft konfigurasi itu tidak dipakai.</li></ul>'
    },
    {
      type: 'vocab',
      items: [
        ['KRaft', 'Kafka Raft — mode pengelolaan metadata internal tanpa ZooKeeper.'],
        ['ZooKeeper', 'Sistem koordinasi terpisah yang dulu menyimpan metadata Kafka.'],
        ['Controller', 'Broker aktif yang mengelola metadata dan pemilihan leader partition.'],
        ['Metadata quorum', 'Kumpulan anggota voting penyimpan metadata KRaft.'],
        ['Raft', 'Protokol konsensus: pemilihan leader dan replikasi log antaranggota.'],
        ['Combined mode', 'Broker yang menjalankan peran broker dan controller sekaligus.'],
        ['process.roles', 'Konfigurasi yang menentukan peran proses Kafka (broker/controller).']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Sebutkan <b>empat informasi metadata</b> yang dulu disimpan ZooKeeper.</li><li>Jelaskan peran <b>controller</b> dan <b>metadata quorum</b> dengan bahasamu sendiri.</li><li>Mengapa ZooKeeper mati bisa melumpuhkan perubahan metadata Kafka?</li><li>Tulis versi modern (KRaft) dari perintah tutorial lama yang memakai <code>--zookeeper</code>.</li><li>Apa tiga keuntungan operasional KRaft dibanding dua arsitektur?</li></ol>'
    }
  ],
  recap: [
    'ZooKeeper dulu menyimpan <b>metadata Kafka</b>: daftar broker, leader partition, konfigurasi topic — sehingga operasi berlaku dua sistem.',
    '<b>KRaft memindahkan metadata ke dalam Kafka</b> lewat metadata quorum berbasis Raft; broker berperan broker dan/atau controller.',
    'KRaft unggul dari sisi <b>operasional (satu stack), skalabilitas metadata, dan latensi perubahan</b>.',
    'Kafka 4.0 adalah <b>KRaft-only</b>; tutorial lama tinggal diterjemahkan: buang ZooKeeper, ganti <code>--zookeeper</code> dengan <code>--bootstrap-server</code>.'
  ]
});
