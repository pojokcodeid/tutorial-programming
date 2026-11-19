/* ============================================================
   Pelajaran Apache Kafka — 18: Kafka Connect & CDC
   ============================================================ */
'use strict';

window.KAFKA_LESSONS = window.KAFKA_LESSONS || [];

window.KAFKA_LESSONS.push({
  id: 'kafka-connect-cdc',
  title: 'Kafka Connect & CDC',
  chapter: 'Ekosistem',
  duration: '15 menit',
  intro: [
    'Menulis kode producer/consumer untuk setiap integrasi berarti pekerjaan berulang yang sama: membaca dari PostgreSQL, memanggil REST API, menulis ke Elasticsearch — lagi dan lagi. <b>Kafka Connect</b> hadir untuk menghapus pengulangan itu: kerangka berbasis konfigurasi yang menyambungkan Kafka ke sistem lain lewat <b>connector</b> siap pakai, tanpa menulis kode sama sekali.',
    'Pelajaran ini membedah arsitektur Connect (worker, tasks, converters), perbedaan <b>Source vs Sink connector</b>, mode <b>distributed vs standalone</b>, konsep <b>exactly-once & offset tracking</b>, serta penerapan paling terkenalnya: <b>Change Data Capture (CDC) dengan Debezium</b> — membaca perubahan database langsung dari log (WAL) menuju Kafka.'
  ],
  objectives: [
    'Menjelaskan arsitektur Kafka Connect: worker, connector, tasks, dan converters',
    'Membedakan Source connector, Sink connector, serta mode distributed dan standalone',
    'Menjelaskan cara Connect melacak offset dan menjaga idempotensi saat restart',
    'Menerapkan ide CDC dengan Debezium beserta alur dan manfaatnya'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Apa itu Kafka Connect?</h3><p>Kafka Connect adalah <b>kerangka integrasi data</b> bawaan ekosistem Kafka. Alih-alih menulis program producer/consumer, kamu menulis <b>JSON konfigurasi</b> dan menjalankannya sebagai service. Dua kelompok connector:</p><ul><li><b>Source connector</b> — memindahkan data <i>dari</i> sistem lain <i>ke</i> Kafka (PostgreSQL, Debezium CDC, S3, file, API, MongoDB, ...).</li><li><b>Sink connector</b> — memindahkan data <i>dari</i> Kafka <i>ke</i> sistem tujuan (Elasticsearch, PostgreSQL, S3, HTTP, ...).</li></ul><p>Komponen utamanya:</p><table><thead><tr><th>Komponen</th><th>Tugas</th></tr></thead><tbody><tr><td><b>Worker</b></td><td>Proses JVM yang menjalankan connector; ada mode <b>distributed</b> (klaster, fault-tolerant) dan <b>standalone</b> (satu proses, untuk dev)</td></tr><tr><td><b>Connector</b></td><td>Objek konfigurasi yang mendeskripsikan sumber/tujuan (mis. tabel mana, topic apa)</td></tr><tr><td><b>Task</b></td><td>Unit kerja paralel hasil pemecahan connector — dikerjakan banyak task di banyak worker</td></tr><tr><td><b>Converter</b></td><td>Format data: JsonConverter, StringConverter, AvroConverter, ProtobufConverter</td></tr><tr><td><b>REST API</b></td><td>Endpoint pengelolaan (default port 8083): deploy, pause, resume, hapus connector</td></tr></tbody></table>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 330" width="760" role="img" aria-label="Alur Kafka Connect: source connector membaca database lalu menulis ke Kafka, sink connector membaca Kafka lalu menulis ke sistem tujuan">
        <rect x="20" y="40" width="150" height="70" rx="8" class="u-box"/>
        <text x="95" y="68" class="u-title" text-anchor="middle">PostgreSQL</text>
        <text x="95" y="92" class="u-lbl" text-anchor="middle">tabel orders</text>
        <line x1="176" y1="75" x2="234" y2="75" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="240" y="30" width="240" height="90" rx="8" class="u-hd"/>
        <text x="360" y="56" class="u-title" text-anchor="middle">Source Connector</text>
        <text x="360" y="80" class="u-lbl" text-anchor="middle">worker + N task paralel</text>
        <text x="360" y="104" class="u-lbl" text-anchor="middle">offset disimpan di Kafka config topic</text>
        <line x1="486" y1="75" x2="544" y2="75" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="550" y="30" width="190" height="90" rx="8" class="u-box"/>
        <text x="645" y="56" class="u-title" text-anchor="middle">Kafka Topics</text>
        <text x="645" y="80" class="u-lbl" text-anchor="middle">dbserver1.public.orders</text>
        <text x="645" y="104" class="u-lbl" text-anchor="middle">converter: Avro/JSON</text>
        <line x1="645" y1="126" x2="645" y2="166" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="550" y="172" width="190" height="90" rx="8" class="u-hd"/>
        <text x="645" y="198" class="u-title" text-anchor="middle">Sink Connector</text>
        <text x="645" y="222" class="u-lbl" text-anchor="middle">baca dari topic Kafka</text>
        <text x="645" y="246" class="u-lbl" text-anchor="middle">idempotent writes</text>
        <line x1="544" y1="217" x2="486" y2="217" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="240" y="172" width="240" height="90" rx="8" class="u-box"/>
        <text x="360" y="198" class="u-title" text-anchor="middle">Elasticsearch / DWH</text>
        <text x="360" y="222" class="u-lbl" text-anchor="middle">indeks analitik / laporan</text>
        <text x="360" y="246" class="u-lbl" text-anchor="middle">sink = tulis ke sistem tujuan</text>
        <line x1="234" y1="217" x2="176" y2="217" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="20" y="286" width="720" height="34" rx="6" class="u-hd"/>
        <text x="380" y="308" class="u-lbl" text-anchor="middle">kelola lewat REST API :8083 — POST/GET/DELETE /connectors</text>
      </svg></div><figcaption>Source connector mengangkut data ke Kafka; sink connector menyalurkannya ke sistem tujuan — semuanya berbasis konfigurasi.</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Menjalankan source & sink connector (REST API)',
      lang: 'bash',
      output: false,
      code: `# 1) deploy source connector (PostgreSQL CDC memakai Debezium)
curl -s -X POST http://localhost:8083/connectors \\
  -H 'Content-Type: application/json' \\
  -d '{
    "name": "orders-source",
    "config": {
      "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
      "database.hostname": "postgres",
      "database.port": "5432",
      "database.user": "replicator",
      "database.password": "secret",
      "database.dbname": "shop",
      "table.include.list": "public.orders",
      "topic.prefix": "dbserver1",
      "plugin.name": "pgoutput",
      "tasks.max": "2"
    }
  }'

# 2) pantau status connector
curl -s http://localhost:8083/connectors/orders-source/status | jq

# 3) deploy sink (Elasticsearch)
curl -s -X POST http://localhost:8083/connectors \\
  -H 'Content-Type: application/json' \\
  -d '{
    "name": "orders-sink",
    "config": {
      "connector.class": "io.confluent.connect.elasticsearch.ElasticsearchSinkConnector",
      "topics": "dbserver1.public.orders",
      "connection.url": "http://elasticsearch:9200",
      "key.ignore": "false",
      "behavior.on.null.values": "delete",
      "errors.tolerance": "all",
      "errors.deadletter.topic.name": "orders-sink-dlq"
    }
  }'

# 4) kontrol: pause / resume / hapus
curl -s -X POST http://localhost:8083/connectors/orders-source/pause
curl -s -X POST http://localhost:8083/connectors/orders-source/resume
curl -s -X DELETE http://localhost:8083/connectors/orders-source`,
      explain: [
        'Konfigurasi <b>tasks.max</b> menentukan paralelisme: Connect memecah pekerjaan menjadi task yang dapat berjalan di beberapa worker sekaligus pada mode distributed.',
        '<code>topic.prefix</code> + <code>table.include.list</code> menentukan topic tujuan hasil pemetaan (mis. <code>dbserver1.public.orders</code>) — kombinasi inilah yang harus kamu catat saat menulis konsumennya.',
        '<code>errors.deadletter.topic.name</code> pada sink menghubungkan praktik <b>Dead Letter Topic</b> dari pelajaran sebelumnya ke dunia Connect: record yang gagal ditulis ke tujuan tidak hilang, melainkan tercatat untuk ditindaklanjuti.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Distributed vs standalone</h3><table><thead><tr><th>Aspek</th><th>Standalone</th><th>Distributed</th></tr></thead><tbody><tr><td><b>Proses</b></td><td>Satu JVM</td><td>Beberapa worker dalam satu cluster</td></tr><tr><td><b>Penyimpanan config/offset</b></td><td>File lokal</td><td>Kafka topic internal (config, status, offsets)</td></tr><tr><td><b>Fault tolerance</b></td><td>Tidak ada — mati = berhenti</td><td>Task dipindahkan otomatis ke worker lain</td></tr><tr><td><b>Skala</b></td><td>Satu mesin</td><td>Task dibagi &amp; ditambah horizontal</td></tr><tr><td><b>Cocok untuk</b></td><td>Dev/eksperimen</td><td>Semua yang serius</td></tr></tbody></table><p>Perhatikan keindahan desainnya: pada mode distributed, <b>state Connect disimpan di Kafka sendiri</b> (topic <code>connect-configs</code>, <code>connect-status</code>, <code>connect-offsets</code>) — sehingga worker bisa mati dan hidup lagi tanpa kehilangan posisi.</p>'
    },
    {
      type: 'text',
      html: '<h3>Offset dan idempotensi di Connect</h3><p>Setiap source task menyimpan <b>offset pemrosesannya</b> — mis. posisi LSN database, offset file, atau timestamp terakhir. Ketika worker restart atau task dipindahkan, pekerjaan <b>lanjut dari offset tersimpan</b>, bukan dari nol.</p><ul><li><b>Konfigurasi offset flush</b> — <code>offset.flush.interval.ms</code> menentukan seberapa sering offset disimpan setelah pengiriman ke Kafka.</li><li><b>Risiko interval panjang</b> — bila offset disimpan setelah data terkirim dengan jeda besar, restart di antaranya membuat task <b>mengirim ulang</b> (at-least-once).</li><li><b>Sink idempoten</b> — tulis ke tujuan harus memakai kunci unik (mis. upsert berdasar key record) agar pengulangan tidak merusak.</li><li><b>Batch kecil ≠ buruk</b> — <code>flush.size</code> membatasi jumlah record per batch offset; batas wajar memperkecil pengulangan saat restart.</li></ul>'
    },
    {
      type: 'text',
      html: '<h3>Change Data Capture (CDC) dengan Debezium</h3><p><b>CDC</b> adalah teknik membaca perubahan data langsung dari <b>log perubahan database</b> (PostgreSQL WAL, MySQL binlog) secara streaming — tanpa query berulang, tanpa kolom <code>updated_at</code> yang diretas. <b>Debezium</b> adalah platform CDC populer yang berjalan sebagai Kafka Connect connector.</p><ol><li>Connector Debezium terhubung ke database sebagai <b>replica logikal</b>.</li><li>Setiap <code>INSERT/UPDATE/DELETE</code> terbaca dari log → menghasilkan event <code>read</code>/<code>insert</code>/<code>update</code>/<code>delete</code> lengkap dengan <b>before</b> dan <b>after</b> image.</li><li>Event ditulis ke topic Kafka per tabel (mis. <code>dbserver1.public.orders</code>).</li><li>Consumer membangun projection, search index, cache — tanpa menyentuh database sumber.</li></ol><p>Inilah wujud praktis <b>outbox + CDC</b> dari pelajaran sebelumnya, maupun jalur langsung tanpa tabel outbox bila kamu mau mempublikasikan seluruh perubahan tabel.</p>'
    },
    {
      type: 'example',
      title: 'Bentuk event perubahan dari Debezium',
      lang: 'json',
      output: false,
      code: `{
  "before": null,
  "after": {
    "id": "ORD-1001",
    "user_id": "USR-1001",
    "total": 250000,
    "updated_at": "2026-11-18T10:00:01Z"
  },
  "source": {
    "version": "2.7.0.Final",
    "connector": "postgresql",
    "name": "dbserver1",
    "ts_ms": 1795716301000,
    "db": "shop",
    "schema": "public",
    "table": "orders"
  },
  "op": "c",
  "ts_ms": 1795716301200
}`,
      explain: [
        'Field <code>op</code> menandai jenis operasi: <code>c</code> create, <code>u</code> update, <code>d</code> delete, <code>r</code> read (snapshot awal).',
        '<code>before</code> dan <code>after</code> memberi <b>seluruh konteks perubahan</b> — konsumen update tidak perlu lagi membaca ulang database sumber.',
        'Fase <b>snapshot</b> pada awal connector menghasilkan op <code>r</code> untuk seluruh baris, sehingga konsumen baru bisa membangun state awal dari topic tanpa memohon data ke aplikasi.'
      ]
    },
    {
      type: 'warn',
      title: 'Jebakan umum Kafka Connect & CDC',
      text: '<ul><li><b>Konversi data tanpa schema registry</b> — JSONConverter dengan schemas.enable=true menghasilkan envelope schema; matikan bila tak dipakai, atau pakai Avro + registry agar konsisten.</li><li><b>Sink non-idempoten</b> — restart task menulis ulang; tujuan harus siap upsert.</li><li><b>Tabel besar tanpa perencanaan snapshot</b> — snapshot awal bisa membanjiri database; atur mode snapshot dan throttle.</li><li><b>Replica logikal bermasalah</b> — slot/replication lama menumpuk setelah connector lama mati; bersihkan slot yang tak terpakai.</li><li><b>Lupa memantau status</b> — connector bisa PAUSED/FAILED tanpa terasa; pantau <code>/connectors/{name}/status</code> dan jadikan alert.</li><li><b>Perubahan skema tabel</b> — penambahan kolom mengubah event; siapkan consumer yang toleran (lihat pelajaran Schema Registry).</li></ul>'
    },
    {
      type: 'tip',
      title: 'Kapan memakai Connect vs kode sendiri?',
      text: '<p>Pakai <b>Kafka Connect</b> bila integrasinya sudah umum (database, search, object storage, REST) — lebih cepat, dijaga komunitas, dan minim kode. Tulis <b>producer/consumer sendiri</b> bila logikanya khusus: transformasi berat, pemanggilan API dengan alur rumit, atau kebutuhan bisnis yang tak dicakup connector mana pun. Keduanya bisa hidup berdampingan dalam satu arsitektur.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Kafka Connect', 'Kerangka integrasi berbasis konfigurasi untuk memindahkan data antara Kafka dan sistem lain.'],
        ['Source connector', 'Connector yang membaca dari sistem luar menuju Kafka.'],
        ['Sink connector', 'Connector yang membaca dari Kafka menuju sistem tujuan.'],
        ['Worker', 'Proses JVM pelaksana connector (standalone/distributed).'],
        ['Task', 'Unit kerja paralel hasil pecahan satu connector.'],
        ['Converter', 'Konverter format data (JSON, Avro, Protobuf, String).'],
        ['CDC', 'Change Data Capture: membaca perubahan database dari log perubahannya.'],
        ['Debezium', 'Platform CDC populer yang berjalan sebagai connector Kafka Connect.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Sebutkan 5 komponen utama Connect beserta tugas singkatnya.</li><li>Bandingkan source dan sink connector dengan satu contoh nyata masing-masing.</li><li>Mengapa offset Connect disimpan di Kafka (mode distributed), bukan di file worker?</li><li>Jelaskan alur CDC Debezium dari perubahan INSERT hingga consumer membacanya.</li><li>Kapan kamu memilih Connect, dan kapan menulis kode producer/consumer sendiri?</li></ol>'
    }
  ],
  recap: [
    '<b>Kafka Connect</b> = integrasi berbasis konfigurasi: <b>worker → connector → task → converter</b>, dikelola via REST API :8083.',
    '<b>Source</b> (sistem luar → Kafka) vs <b>Sink</b> (Kafka → tujuan); mode <b>distributed</b> menyimpan state di Kafka sehingga tahan kegagalan.',
    'Source task menyimpan <b>offset pemrosesan</b> → restart lanjut dari posisi tersimpan; pengiriman ulang membuat sink wajib <b>idempoten</b> + punya DLT.',
    '<b>CDC/Debezium</b> membaca perubahan database dari log (WAL/binlog) → event before/after per tabel ke Kafka — tanpa query berulang.'
  ]
});
