/* ============================================================
   Pelajaran Apache Kafka — 03: Menjalankan Kafka: Environment & KRaft
   ============================================================ */
'use strict';

window.KAFKA_LESSONS = window.KAFKA_LESSONS || [];

window.KAFKA_LESSONS.push({
  id: 'setup-environment',
  title: 'Menjalankan Kafka: Environment & KRaft',
  chapter: 'Instalasi & KRaft',
  duration: '15 menit',
  intro: [
    'Teori Kafka baru terasa nyata ketika broker berjalan di mesinmu dan kamu bisa menulis serta membaca record sendiri. Kabar baiknya, pada versi modern Kafka bisa dijalankan cukup dengan <b>satu container</b> tanpa ZooKeeper berkat mode <b>KRaft</b>.',
    'Pelajaran ini menyiapkan environment latihan yang dapat dibuat ulang dengan satu perintah: image resmi <code>apache/kafka</code>, konfigurasi env KRaft (<code>KAFKA_NODE_ID</code>, <code>KAFKA_PROCESS_ROLES</code>, <code>KAFKA_LISTENERS</code>, <code>KAFKA_ADVERTISED_LISTENERS</code>, <code>KAFKA_CONTROLLER_QUORUM_VOTERS</code>), port 9092/9093, volume data, sampai verifikasi bahwa broker benar-benar siap melayani.'
  ],
  objectives: [
    'Menyiapkan container Kafka satu broker dengan image resmi apache/kafka dan mode KRaft',
    'Menjelaskan fungsi tiap variabel env KAFKA_* utama (NODE_ID, PROCESS_ROLES, LISTENERS, ADVERTISED_LISTENERS, CONTROLLER_QUORUM_VOTERS)',
    'Menghubungkan port 9092 (client) dan 9093 (controller) dengan kebutuhan koneksi',
    'Memverifikasi broker siap: membuat topic, mengirim record, lalu membacanya kembali'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Komponen environment latihan</h3><p>Untuk belajar, kamu tidak butuh cluster besar. Satu container dengan dua peran (<b>broker + controller</b>) sudah cukup untuk mempelajari hampir semua konsep. Komponen yang disiapkan:</p><ul><li><b>Kafka broker</b> — image resmi <code>apache/kafka</code> dari Docker Hub, berjalan dalam mode KRaft (tanpa ZooKeeper).</li><li><b>Kafka CLI tools</b> — sudah ikut di dalam image pada direktori <code>/opt/kafka/bin/</code>.</li><li><b>Kafka UI (opsional)</b> — mis. provectuslabs/kafka-ui untuk inspeksi visual topic dan record.</li><li><b>Volume</b> — menyimpan log partition supaya data tetap ada saat container di-restart.</li><li><b>Network khusus</b> — agar container lain (aplikasi latihan) dapat mengakses broker lewat nama service.</li></ul>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 310" width="760" role="img" aria-label="Environment Kafka satu container KRaft dengan volume data, CLI, dan Kafka UI opsional">
        <rect x="20" y="40" width="130" height="60" rx="8" class="u-hd"/>
        <text x="85" y="66" class="u-title" text-anchor="middle">Host / CLI</text>
        <text x="85" y="88" class="u-lbl" text-anchor="middle">docker exec</text>
        <line x1="156" y1="70" x2="214" y2="70" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="220" y="24" width="340" height="200" rx="10" class="u-box"/>
        <text x="390" y="50" class="u-title" text-anchor="middle">Container: apache/kafka (KRaft)</text>
        <line x1="234" y1="60" x2="546" y2="60" class="u-line"/>
        <rect x="234" y="74" width="146" height="56" rx="6" class="u-hd"/>
        <text x="307" y="98" class="u-lbl" text-anchor="middle">Broker</text>
        <text x="307" y="118" class="u-lbl" text-anchor="middle">:9092 (client)</text>
        <rect x="392" y="74" width="146" height="56" rx="6" class="u-hd"/>
        <text x="465" y="98" class="u-lbl" text-anchor="middle">Controller</text>
        <text x="465" y="118" class="u-lbl" text-anchor="middle">:9093 (quorum)</text>
        <rect x="234" y="144" width="304" height="56" rx="6" class="u-box"/>
        <text x="386" y="168" class="u-lbl" text-anchor="middle">/opt/kafka/bin (CLI tools)</text>
        <text x="386" y="188" class="u-lbl" text-anchor="middle">LOG_DIRS=/tmp/kraft-combined-logs</text>
        <line x1="390" y1="230" x2="390" y2="258" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="290" y="262" width="200" height="34" rx="6" class="u-box"/>
        <text x="390" y="284" class="u-lbl" text-anchor="middle">Volume: kafka-data</text>
        <line x1="566" y1="110" x2="624" y2="110" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="630" y="80" width="112" height="60" rx="8" class="u-box"/>
        <text x="686" y="106" class="u-title" text-anchor="middle">Kafka UI</text>
        <text x="686" y="128" class="u-lbl" text-anchor="middle">(opsional)</text>
      </svg></div><figcaption>Satu container KRaft menampung broker, controller, dan CLI; data bertahan lewat volume.</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Mengenal variabel env KRaft</h3><p>Image <code>apache/kafka</code> membaca konfigurasi broker dari variabel environment dengan awalan <code>KAFKA_</code>. Berikut yang wajib kamu pahami:</p><table><thead><tr><th>Variabel</th><th>Fungsi</th></tr></thead><tbody><tr><td><code>KAFKA_NODE_ID</code></td><td>Identitas unik broker ini di dalam cluster (mis. 1).</td></tr><tr><td><code>KAFKA_PROCESS_ROLES</code></td><td>Peran proses: <code>broker</code>, <code>controller</code>, atau <code>broker,controller</code> (combined, untuk latihan).</td></tr><tr><td><code>KAFKA_LISTENERS</code></td><td>Alamat &amp; port yang <b>diproses</b> broker ini (bind), mis. <code>PLAINTEXT://:9092,CONTROLLER://:9093</code>.</td></tr><tr><td><code>KAFKA_ADVERTISED_LISTENERS</code></td><td>Alamat yang <b>diberitahukan ke client</b> — harus dapat diakses dari mesin client.</td></tr><tr><td><code>KAFKA_CONTROLLER_QUORUM_VOTERS</code></td><td>Daftar anggota quorum controller, mis. <code>1@localhost:9093</code>.</td></tr><tr><td><code>KAFKA_CONTROLLER_LISTENER_NAMES</code></td><td>Nama listener untuk komunikasi controller, mis. <code>CONTROLLER</code>.</td></tr><tr><td><code>KAFKA_LISTENER_SECURITY_PROTOCOL_MAP</code></td><td>Pemetaan nama listener ke protokol: PLAINTEXT, SSL, SASL_PLAINTEXT, dll.</td></tr><tr><td><code>KAFKA_INTER_BROKER_LISTENER_NAME</code></td><td>Listener yang dipakai komunikasi antarbroker dalam cluster.</td></tr><tr><td><code>KAFKA_LOG_DIRS</code></td><td>Lokasi penyimpanan log partition di dalam container.</td></tr><tr><td><code>CLUSTER_ID</code></td><td>UUID cluster (format base64) — wajib sama untuk semua broker KRaft.</td></tr></tbody></table>'
    },
    {
      type: 'example',
      title: 'docker-compose.yaml: satu broker KRaft siap pakai',
      lang: 'yaml',
      output: false,
      code: `services:
  kafka:
    image: docker.io/apache/kafka:4.4.0
    container_name: kafka
    ports:
      - "9092:9092"
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://:9092,CONTROLLER://:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@localhost:9093
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,CONTROLLER:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_LOG_DIRS: /tmp/kraft-combined-logs
      CLUSTER_ID: MkU3OEVBNTcwNTJENDM2Qk
    volumes:
      - kafka-data:/tmp/kraft-combined-logs

volumes:
  kafka-data:`,
      explain: [
        '<code>KAFKA_PROCESS_ROLES: broker,controller</code> membuat satu container berperan ganda — pola combined mode yang praktis untuk latihan satu broker.',
        '<code>KAFKA_ADVERTISED_LISTENERS</code> memakai <code>localhost:9092</code> supaya client di host bisa tersambung; untuk cluster multi-broker, alamat ini harus memakai nama service/host yang dapat diakses tiap client.',
        '<code>CLUSTER_ID</code> mengikat semua broker ke satu cluster KRaft yang sama — seluruh broker dalam satu cluster wajib memakai CLUSTER_ID identik.'
      ]
    },
    {
      type: 'example',
      title: 'Jalankan dan verifikasi broker',
      lang: 'bash',
      output: false,
      code: `docker compose up -d

# tunggu sampai broker siap, lalu cek config inti
docker exec kafka /opt/kafka/bin/kafka-broker-api-versions.sh --bootstrap-server localhost:9092

# buat topic latihan 3 partition
docker exec kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 \\
  --create --topic user-events --partitions 3 --replication-factor 1

# lihat daftar & detail topic
docker exec kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list
docker exec kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 \\
  --describe --topic user-events`,
      explain: [
        'Perintah <code>kafka-broker-api-versions.sh</code> adalah cara termudah memastikan broker sudah benar-benar melayani koneksi — bila broker belum siap, perintah ini gagal dengan timeout.',
        'CLI image <code>apache/kafka</code> berada di <code>/opt/kafka/bin/</code>; karena itu setiap perintah diawali <code>docker exec kafka /opt/kafka/bin/...</code>. Alternatifnya: masuk shell dengan <code>docker exec -it kafka bash</code> lalu jalankan perintah langsung.',
        '<code>--describe</code> menampilkan tiap partition beserta leader, replicas, dan ISR — tabel yang akan kamu baca berulang kali di pelajaran replication.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Port 9092 vs 9093</h3><p>Dua port yang paling sering membingungkan pemula:</p><ul><li><b>9092</b> — listener client (PLAINTEXT): tempat producer dan consumer mengirim/menerima record.</li><li><b>9093</b> — listener controller: komunikasi internal quorum KRaft (pemilihan controller, metadata). Client biasanya tidak menyentuh port ini.</li></ul><p>Konsekuensi praktis: bila <code>advertised.listeners</code> menunjuk <code>localhost:9092</code> tetapi container diakses dari mesin lain, client akan gagal setelah discovery pertama — karena broker memberitahu alamat yang tidak dapat diakses client. Ini salah satu penyebab error paling umum di awal belajar Kafka.</p>'
    },
    {
      type: 'text',
      html: '<h3>Persistensi dan pembuatan ulang environment</h3><p>Dengan volume pada <code>KAFKA_LOG_DIRS</code>, data partition bertahan saat container di-restart. Uji sendiri: kirim beberapa record, lalu <code>docker compose restart kafka</code> — record tetap bisa dibaca. Untuk memulai dari nol (mis. setelah salah konfigurasi), hapus volume: <code>docker compose down -v</code>.</p><p>Karena seluruh environment dideklarasikan dalam satu file compose, environment latihanmu dapat dibuat ulang kapan pun di mesin mana pun — inilah prinsip <b>reproducible environment</b> yang dipakai sepanjang bab ini.</p>'
    },
    {
      type: 'warn',
      title: 'Jebakan awal yang paling sering terjadi',
      text: '<ul><li><b>Broker belum siap tapi langsung dipakai</b> — beri jeda beberapa detik atau ulangi perintah verifikasi.</li><li><b>advertised.listeners salah</b> — client gagal tepat setelah koneksi pertama; pastikan alamatnya dapat diakses dari mesin client.</li><li><b>CLUSTER_ID berbeda antarbroker</b> — broker menolak bergabung; semua broker harus memakai CLUSTER_ID yang sama.</li><li><b>Port bentrok di host</b> — 9092 sudah dipakai proses lain; ganti sisi host menjadi <code>19092:9092</code> dan sesuaikan client.</li><li><b>Salah path CLI</b> — image apache/kafka menyimpannya di <code>/opt/kafka/bin/</code>, bukan <code>/usr/bin</code>.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Mulai dari shell interaktif',
      text: '<p>Saat belajar, jalankan <code>docker exec -it kafka bash</code> sekali, lalu semua perintah cukup <code>/opt/kafka/bin/kafka-topics.sh ...</code> tanpa mengetik panjang berulang. Gunakan tab completion bila tersedia — jauh lebih cepat daripada menyalin perintah panjang setiap kali.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['KRaft', 'Mode Kafka yang mengelola metadata sendiri tanpa ZooKeeper (Kafka Raft).'],
        ['Broker', 'Proses server Kafka yang menyimpan partition dan melayani baca/tulis.'],
        ['Controller', 'Broker yang mengkoordinasi metadata cluster dan pemilihan leader partition.'],
        ['Quorum', 'Kumpulan anggota controller yang memilih dan menjaga metadata (dalam KRaft).'],
        ['listeners', 'Alamat & port yang didengarkan (di-bind) oleh broker.'],
        ['advertised.listeners', 'Alamat yang diumumkan broker kepada client saat discovery.'],
        ['LOG_DIRS', 'Direktori tempat broker menulis log partition di disk.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Jalankan Kafka satu broker dengan <code>docker compose up -d</code> dan buktikan siap lewat <code>kafka-broker-api-versions.sh</code>.</li><li>Buat topic <code>user-events</code> dengan <b>3 partition</b>, lalu tampilkan hasil <code>--describe</code> dan identifikasi leader tiap partition.</li><li>Jelaskan perbedaan <code>KAFKA_LISTENERS</code> dan <code>KAFKA_ADVERTISED_LISTENERS</code> dengan bahasamu sendiri.</li><li>Kirim 10 record via console producer, restart container, lalu baca lagi — apakah data masih ada? Mengapa?</li><li>Apa yang terjadi bila <code>CLUSTER_ID</code> dua broker berbeda? Uji di dua container bila memungkinkan.</li></ol>'
    }
  ],
  recap: [
    'Kafka modern berjalan dengan <b>satu container KRaft</b> — tanpa ZooKeeper — memakai image resmi <code>apache/kafka</code>.',
    'Env inti: <b>NODE_ID, PROCESS_ROLES, LISTENERS, ADVERTISED_LISTENERS, CONTROLLER_QUORUM_VOTERS, CONTROLLER_LISTENER_NAMES, LOG_DIRS, CLUSTER_ID</b>.',
    '<b>9092 = port client</b>, <b>9093 = port controller</b>; advertised.listeners harus dapat diakses dari mesin client.',
    'CLI berada di <code>/opt/kafka/bin/</code>; environment compose + volume membuat latihan <b>dapat dibuat ulang dan data bertahan saat restart</b>.'
  ]
});
