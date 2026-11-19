/* ============================================================
   Pelajaran Apache Kafka — 20: Security — SSL, SASL & ACL
   ============================================================ */
'use strict';

window.KAFKA_LESSONS = window.KAFKA_LESSONS || [];

window.KAFKA_LESSONS.push({
  id: 'security-acl',
  title: 'Security: SSL, SASL & ACL',
  chapter: 'Produksi',
  duration: '15 menit',
  intro: [
    'Kafka sering menyimpan data sensitif — identitas pengguna, riwayat transaksi, log perangkat. Tanpa pengamanan, siapa pun yang bisa mencapai port 9092 bisa membaca seluruh topic, menulis data palsu, atau menghapus data. Keamanan Kafka bertumpuk pada tiga lapis yang saling melengkapi: <b>enkripsi (SSL/TLS)</b>, <b>autentikasi (SASL)</b>, dan <b>otorisasi (ACL)</b>.',
    'Pelajaran ini membahas ketiganya secara praktis: mengamankan koneksi antar-broker dan client, mengaktifkan mekanisme SASL (PLAIN, SCRAM, mTLS), menulis ACL per principal dan topic, sampai pola keamanan untuk aplikasi produksi termasuk pensiunnya ZooKeeper dan konsekuensinya bagi keamanan di Kafka 4.0.'
  ],
  objectives: [
    'Menjelaskan tiga lapis keamanan Kafka: enkripsi, autentikasi, dan otorisasi',
    'Menerapkan SSL/TLS untuk koneksi antar-broker dan antar client',
    'Mengonfigurasi SASL (PLAIN, SCRAM-SHA-256/512) beserta trade-off-nya',
    'Menulis dan mengelola ACL per principal, topic, dan operasi'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Tiga lapis keamanan</h3><table><thead><tr><th>Lapis</th><th>Pertanyaan yang dijawab</th><th>Mekanisme</th></tr></thead><tbody><tr><td><b>Enkripsi</b></td><td>Apakah orang lain bisa membaca lalu lintasnya?</td><td>SSL/TLS (koneksinya dienkripsi)</td></tr><tr><td><b>Autentikasi</b></td><td>Siapa yang terhubung?</td><td>SASL (password/SCRAM) atau mTLS (sertifikat)</td></tr><tr><td><b>Otorisasi</b></td><td>Apa yang boleh dia lakukan?</td><td>ACL per principal, resource, dan operasi</td></tr></tbody></table><p>Ketiganya sering disalahpahami sebagai pilihan tunggal — padahal saling melengkapi. TLS tanpa autentikasi membuat enkripsi percuma (siapa pun bisa terhubung); autentikasi tanpa ACL membuat user biasa bisa menghapus topic produksi. Pola produksi yang lazim: <b>TLS + SASL/SCRAM + ACL ketat</b>, atau <b>mTLS + ACL</b> untuk layanan machine-to-machine.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 330" width="760" role="img" aria-label="Tiga lapis keamanan Kafka: TLS mengenkripsi koneksi, SASL mengautentikasi identitas, ACL mengotorisasi aksi">
        <rect x="20" y="30" width="180" height="70" rx="8" class="u-hd"/>
        <text x="110" y="58" class="u-title" text-anchor="middle">Client aplikasi</text>
        <text x="110" y="82" class="u-lbl" text-anchor="middle">producer / consumer</text>
        <line x1="206" y1="65" x2="256" y2="65" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="262" y="20" width="300" height="200" rx="10" class="u-box"/>
        <text x="412" y="46" class="u-title" text-anchor="middle">Broker Kafka (port 9092/9093)</text>
        <line x1="278" y1="56" x2="546" y2="56" class="u-line"/>
        <rect x="278" y="70" width="268" height="42" rx="5" class="u-hd"/>
        <text x="412" y="90" class="u-lbl" text-anchor="middle">1. TLS — koneksi terenkripsi</text>
        <text x="412" y="106" class="u-lbl" text-anchor="middle">truststore + sertifikat broker</text>
        <rect x="278" y="122" width="268" height="42" rx="5" class="u-box"/>
        <text x="412" y="142" class="u-lbl" text-anchor="middle">2. SASL — buktikan identitas</text>
        <text x="412" y="158" class="u-lbl" text-anchor="middle">SCRAM-SHA-256 / PLAIN / mTLS</text>
        <rect x="278" y="174" width="268" height="34" rx="5" class="u-box"/>
        <text x="412" y="196" class="u-lbl" text-anchor="middle">3. ACL — boleh topic apa, operasi apa</text>
        <line x1="568" y1="120" x2="622" y2="120" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="628" y="86" width="112" height="68" rx="8" class="u-hd"/>
        <text x="684" y="114" class="u-title" text-anchor="middle">Kafka</text>
        <text x="684" y="138" class="u-lbl" text-anchor="middle">topic aman</text>
        <rect x="20" y="244" width="720" height="66" rx="8" class="u-box"/>
        <text x="380" y="270" class="u-lbl" text-anchor="middle">Tanpa TLS: lalu lintas bisa dibaca pihak ketiga (dan SASL PLAIN ikut terekspos)</text>
        <text x="380" y="294" class="u-lbl" text-anchor="middle">Tanpa ACL: satu identitas boleh membaca semua topic — prinsip least privilege dilanggar</text>
      </svg></div><figcaption>Enkripsi melindungi isi koneksi, autentikasi membuktikan identitas, otorisasi membatasi tindakan.</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Mengaktifkan SSL/TLS di broker dan client',
      lang: 'bash',
      output: false,
      code: `# 1) buat keystore & truststore (contoh dengan keytool)
keytool -genkeypair -alias kafka-broker -keyalg RSA -keysize 2048 \\
  -keystore kafka.keystore.jks -dname "CN=kafka, OU=ops, O=corp, C=ID"
keytool -export -alias kafka-broker -keystore kafka.keystore.jks \\
  -file kafka.cer
keytool -import -trustcacerts -alias kafka-broker -file kafka.cer \\
  -keystore kafka.truststore.jks

# 2) broker.properties (listener SSL)
#   listeners=INTERNAL://:9093,EXTERNAL://:9092
#   advertised.listeners=INTERNAL://kafka1:9093,EXTERNAL://kafka.example.id:9092
#   security.inter.broker.protocol=SSL
#   ssl.keystore.location=/etc/kafka/secrets/kafka.keystore.jks
#   ssl.keystore.password=***
#   ssl.key.password=***
#   ssl.truststore.location=/etc/kafka/secrets/kafka.truststore.jks
#   ssl.truststore.password=***
#   ssl.client.auth=required          # mTLS bila dipakai

# 3) client: bootstrap server memakai SSL
#   bootstrap.servers=kafka.example.id:9092
#   security.protocol=SSL
#   ssl.truststore.location=/etc/kafka/client.truststore.jks
#   ssl.truststore.password=***`,
      explain: [
        'Kafka memisahkan <b>listener</b> internal (antar-broker) dan eksternal (client) — keamanan bisa berbeda per listener, misalnya mTLS internal dan SASL eksternal.',
        '<code>ssl.client.auth=required</code> mengubah TLS menjadi <b>mTLS</b>: client juga harus menunjukkan sertifikat — autentikasi terjadi tanpa password sama sekali.',
        'Simpan keystore di lokasi berizin dan proteksi file-nya; keystore yang bocor berarti kunci pribadi bocor — pertimbangkan HSM/secret manager untuk produksi.'
      ]
    },
    {
      type: 'text',
      html: '<h3>SASL: memilih mekanisme</h3><table><thead><tr><th>Mekanisme</th><th>Cara kerja</th><th>Catatan</th></tr></thead><tbody><tr><td><b>PLAIN</b></td><td>Password dikirim dalam teks (dalam koneksi TLS)</td><td>Paling sederhana; <b>wajib dibungkus TLS</b> — tanpa TLS, password terbaca</td></tr><tr><td><b>SCRAM-SHA-256/512</b></td><td>Challenge–response berbasis password, tidak mengirim password mentah</td><td>Pilihan wajar untuk produksi; hash tersimpan di JAAS</td></tr><tr><td><b>GSSAPI/Kerberos</b></td><td>Tiket Kerberos</td><td>Lingkungan yang sudah punya Kerberos</td></tr><tr><td><b>mTLS</b></td><td>Autentikasi lewat sertifikat klien</td><td>Cocok untuk service-to-service tanpa password</td></tr></tbody></table><p>Konfigurasi server memakai <b>JAAS</b> dan menentukan mekanisme yang diizinkan; client menentukan mekanisme yang dipakai. Praktik baik: <b>izinkan hanya mekanisme yang dibutuhkan</b> (mis. hanya SCRAM-SHA-256) agar PLAIN tidak pernah diterima secara tidak sengaja.</p>'
    },
    {
      type: 'example',
      title: 'SASL/SCRAM: broker dan client',
      lang: 'bash',
      output: false,
      code: `# broker.properties
#   listeners=SASL_SSL://:9093
#   security.inter.broker.protocol=SASL_SSL
#   sasl.mechanism.inter.broker.protocol=SCRAM-SHA-256
#   sasl.enabled.mechanisms=SCRAM-SHA-256
#   listener.name.sasl_ssl.scram-sha-256.sasl.jaas.config=\\
#     org.apache.kafka.common.security.scram.ScramLoginModule required \\
#     username="admin" password="admin-secret";

# admin: buat user SCRAM (kafka-configs.sh)
kafka-configs.sh --bootstrap-server localhost:9093 \\
  --alter --add-config 'SCRAM-SHA-256=[iterations=8192,password=rahasia]' \\
  --entity-type users --entity-name app-producer

# client (Java properties)
#   security.protocol=SASL_SSL
#   sasl.mechanism=SCRAM-SHA-256
#   sasl.jaas.config=org.apache.kafka.common.security.scram.ScramLoginModule \\
#     required username="app-producer" password="rahasia";
#   ssl.truststore.location=/etc/kafka/client.truststore.jks`,
      explain: [
        'Perhatikan kombinasinya: <b>SASL_SSL</b> berarti autentikasi password <i>dan</i> enkripsi aktif bersamaan — inilah konfigurasi produksi yang lazim.',
        'User SCRAM dibuat lewat <code>kafka-configs.sh</code>, bukan file teks biasa — hash tersimpan di internal topic, sehingga password tak pernah muncul di konfigurasi broker.',
        'Jangan lupa konfigurasi <b>inter-broker</b>: bila broker saling terhubung tanpa autentikasi, siapa pun yang bisa menyusup ke jaringan internal bisa menyamar sebagai broker.'
      ]
    },
    {
      type: 'text',
      html: '<h3>ACL: membatasi tindakan per identitas</h3><p>ACL menjawab: <b>principal mana</b> boleh melakukan <b>operasi apa</b> pada <b>resource mana</b>. Bentuk umumnya:</p><ul><li><b>Principal</b> — identitas hasil autentikasi (user SCRAM, CN sertifikat, service account).</li><li><b>Resource</b> — <code>topic:order-events</code>, <code>group:payment-service</code>, <code>cluster:kafka-cluster</code>, atau wildcard <code>*</code>.</li><li><b>Operasi</b> — READ, WRITE, CREATE, DELETE, DESCRIBE, ALTER, ALL.</li><li><b>Aksi</b> — ALLOW atau DENY (DENY berlaku lebih dulu).</li></ul><p>Prinsip <b>least privilege</b>: berikan paling sedikit yang dibutuhkan. Producer hanya butuh WRITE + DESCRIBE pada topiknya; consumer hanya READ + DESCRIBE pada topik dan group-nya; tidak ada aplikasi yang butuh CLUSTER ALTER di produksi.</p>'
    },
    {
      type: 'example',
      title: 'Menulis dan memeriksa ACL',
      lang: 'bash',
      output: false,
      code: `# producer hanya boleh menulis order-events
kafka-acls.sh --bootstrap-server localhost:9093 \\
  --add --allow-principal User:app-producer \\
  --producer --topic order-events

# consumer hanya boleh membaca + memakai group-nya
kafka-acls.sh --bootstrap-server localhost:9093 \\
  --add --allow-principal User:payment-service \\
  --consumer --topic order-events --group payment-service

# tolak user tertentu secara eksplisit
kafka-acls.sh --bootstrap-server localhost:9093 \\
  --add --deny-principal User:intern --topic order-events --operation Read

# izinkan hanya principal ini mengelola cluster
kafka-acls.sh --bootstrap-server localhost:9093 \\
  --add --allow-principal User:ops-admin --cluster kraft-cluster --operation All

# lihat seluruh ACL
kafka-acls.sh --bootstrap-server localhost:9093 --list

# hapus
kafka-acls.sh --bootstrap-server localhost:9093 \\
  --remove --allow-principal User:app-producer \\
  --producer --topic order-events

# aktifkan pemeriksaan ACL di broker
#   authorizer.class.name=org.apache.kafka.metadata.authorizer.StandardAuthorizer
#   super.users=User:ops-admin`,
      explain: [
        'Opsi <code>--producer</code> dan <code>--consumer</code> adalah pintasan: ia menambahkan kombinasi operasi yang memang dibutuhkan pola masing-masing (WRITE+DESCRIBE atau READ+DESCRIBE pada group).',
        '<b>DENY mengalahkan ALLOW</b> — tetapkan pengecualian ketat dulu sebelum membuka izin luas; dan ingat <code>--list</code> untuk audit berkala.',
        'Tanpa <code>authorizer.class.name</code>, seluruh ACL di atas <b>tidak berlaku</b> — authorizer harus aktif di broker agar otorisasi benar-benar ditegakkan.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan keamanan yang paling sering terjadi',
      text: '<ul><li><b>Meninggalkan listener tanpa autentikasi</b> — satu port terbuka membuat seluruh upaya lain percuma; audit semua listener.</li><li><b>PLAIN tanpa TLS</b> — password terkirim mentah di jaringan.</li><li><b>ACL wildcard <code>*</code> untuk banyak principal</b> — satu kebocoran kredensial langsung berdampak luas.</li><li><b>Service account dipakai bersama</b> — sulit melacak siapa yang menulis data; satu identitas per aplikasi.</li><li><b>Kredensial hard-coded di kode sumber</b> — pakai secret manager dan rotasi berkala.</li><li><b>Lupa mengamankan Schema Registry, Connect, dan UI</b> — mereka membuka jendela ke data yang sama; amankan juga.</li><li><b>Menganggap jaringan internal aman</b> — zero-trust: enkripsi dan autentikasi tetap diperlukan antar-broker.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Roadmap pengetatan bertahap',
      text: '<p>(1) <b>Aktifkan authorizer + ACL dasar</b> — paling besar manfaatnya dengan usaha paling kecil. (2) <b>Tambahkan SASL/SCRAM</b> untuk autentikasi user. (3) <b>Bungkus dengan TLS</b> pada listener eksternal. (4) <b>mTLS antar-broker</b> bila kebijakan organisasi menuntut. (5) <b>Audit berkala</b>: daftar ACL, rotasi kredensial, dan pensiunkan akun yang tak terpakai. Setiap langkah berdiri sendiri dan tetap bermanfaat meski tahap berikutnya belum dijalankan.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Enkripsi (TLS/SSL)', 'Mengubah lalu lintas menjadi tidak terbaca oleh pihak ketiga.'],
        ['Autentikasi', 'Membuktikan identitas pihak yang terhubung.'],
        ['Otorisasi (ACL)', 'Menentukan tindakan yang boleh dilakukan identitas tertentu.'],
        ['SASL', 'Kerangka autentikasi dengan mekanisme seperti PLAIN dan SCRAM.'],
        ['SCRAM-SHA-256', 'Autentikasi challenge–response berbasis password tanpa mengirim password mentah.'],
        ['mTLS', 'Mutual TLS: client juga menunjukkan sertifikatnya.'],
        ['JAAS', 'Konfigurasi Java untuk login (digunakan mekanisme SASL).'],
        ['Least privilege', 'Memberi hak paling sedikit yang benar-benar dibutuhkan.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Jelaskan perbedaan tiga lapis keamanan dengan satu contoh pelanggarannya masing-masing.</li><li>Mengapa SASL PLAIN tanpa TLS berbahaya? Bagaimana SCRAM menghindarinya?</li><li>Tulis ACL untuk aplikasi yang hanya boleh <b>membaca</b> dua topic tertentu dan memakai group-nya sendiri.</li><li>Perbedaan listener INTERNAL dan EXTERNAL — apa manfaat pemisahan itu bagi keamanan?</li><li>Buat roadmap pengetatan bertahap untuk tim kecil (3–5 langkah) dengan urutan prioritas.</li></ol>'
    }
  ],
  recap: [
    'Tiga lapis saling melengkapi: <b>TLS</b> (baca isi), <b>SASL/mTLS</b> (siapa), <b>ACL</b> (boleh apa).',
    '<b>SASL/SCRAM-SHA-256</b> = pilihan wajar produksi; <b>PLAIN</b> hanya dalam TLS; <b>mTLS</b> untuk service-to-service.',
    '<b>ACL</b> = principal + resource + operasi + ALLOW/DENY (DENY menang); berlaku hanya bila <code>authorizer.class.name</code> aktif.',
    'Terapkan bertahap: <b>authorizer+ACL → SASL → TLS → mTLS → audit berkala</b>.'
  ]
});
