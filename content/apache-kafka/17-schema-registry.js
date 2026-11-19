/* ============================================================
   Pelajaran Apache Kafka — 17: Schema Registry & Evolusi Skema
   ============================================================ */
'use strict';

window.KAFKA_LESSONS = window.KAFKA_LESSONS || [];

window.KAFKA_LESSONS.push({
  id: 'schema-registry',
  title: 'Schema Registry & Evolusi Skema',
  chapter: 'Ekosistem',
  duration: '15 menit',
  intro: [
    'Pelajaran Desain Event sudah membahas <b>bentuk</b> event dan konsep kompatibilitas. Pelajaran ini menurunkannya menjadi mekanisme nyata: bagaimana <b>Schema Registry</b> menyimpan definisi skema, bagaimana record memakai <b>schema id</b>, bagaimana konfigurasi kompatibilitas diterapkan per subject, serta bagaimana schema evolution berjalan aman antarversi Avro/Protobuf/JSON.',
    'Kamu juga akan melihat cara memeriksa skema lewat REST API, apa yang terjadi bila producer mengirim skema tak terdaftar, dan bagaimana memecahkan masalah umum seperti &quot;consumer tidak bisa membaca data baru&quot; atau &quot;id tidak ditemukan&quot;.'
  ],
  objectives: [
    'Menjelaskan arsitektur Schema Registry dan bagaimana record Kafka menyimpan schema id',
    'Menjelaskan strategi penamaan subject (TopicNameStrategy vs RecordNameStrategy)',
    'Menerapkan pengaturan kompatibilitas per subject beserta alur evolusi skema yang aman',
    'Memeriksa dan memecahkan masalah skema memakai REST API Schema Registry'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Peran Schema Registry</h3><p>Schema Registry adalah layanan terpisah (bukan bagian dari broker) yang menjadi <b>satu-satunya sumber definisi skema</b>. Producer dan consumer berkomunikasi dengannya untuk memvalidasi dan mengambil skema; data tetap mengalir lewat Kafka seperti biasa.</p><ul><li><b>Register</b> — skema baru didaftarkan; registry memeriksa kompatibilitas terhadap versi sebelumnya.</li><li><b>Fetch by id</b> — record di Kafka hanya menyimpan <b>schema id</b> (4 byte di awal payload); consumer mengambil definisinya dari registry.</li><li><b>Fetch latest</b> — producer mengambil skema terbaru sebelum menulis.</li><li><b>Compatibility check</b> — konfigurasi per subject menentukan aturan evolusi yang boleh.</li></ul><p>Karena definisi terpusat, payload tetap ringan (biner Avro/Protobuf dengan field tanpa nama) sementara maknanya tetap jelas untuk semua pihak.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 320" width="760" role="img" aria-label="Arsitektur Schema Registry: producer memvalidasi skema, record berisi schema id, consumer mengambil definisi berdasarkan id">
        <rect x="20" y="30" width="150" height="70" rx="8" class="u-hd"/>
        <text x="95" y="58" class="u-title" text-anchor="middle">Producer</text>
        <text x="95" y="82" class="u-lbl" text-anchor="middle">Avro/KafkaProducer</text>
        <line x1="176" y1="52" x2="244" y2="52" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="250" y="20" width="230" height="90" rx="8" class="u-box"/>
        <text x="365" y="46" class="u-title" text-anchor="middle">Schema Registry</text>
        <line x1="264" y1="56" x2="466" y2="56" class="u-line"/>
        <text x="365" y="82" class="u-lbl" text-anchor="middle">register + compatibility check</text>
        <text x="365" y="102" class="u-lbl" text-anchor="middle">subject: order-events-value v3</text>
        <line x1="176" y1="78" x2="244" y2="140" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="250" y="140" width="230" height="70" rx="8" class="u-hd"/>
        <text x="365" y="166" class="u-title" text-anchor="middle">Topic: order-events</text>
        <text x="365" y="190" class="u-lbl" text-anchor="middle">record = [schema id 4 byte] + payload</text>
        <line x1="486" y1="175" x2="548" y2="175" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="554" y="140" width="186" height="70" rx="8" class="u-box"/>
        <text x="647" y="166" class="u-title" text-anchor="middle">Consumer</text>
        <text x="647" y="190" class="u-lbl" text-anchor="middle">baca id → ambil skema</text>
        <line x1="647" y1="116" x2="647" y2="140" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="486" y1="65" x2="548" y2="65" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="554" y="36" width="186" height="70" rx="8" class="u-hd"/>
        <text x="647" y="62" class="u-title" text-anchor="middle">Registry client</text>
        <text x="647" y="86" class="u-lbl" text-anchor="middle">GET /schemas/ids/{id}</text>
        <rect x="20" y="240" width="720" height="60" rx="8" class="u-box"/>
        <text x="380" y="266" class="u-title" text-anchor="middle">Kesepakatan: data mengalir di Kafka, makna dikunci di Registry</text>
        <text x="380" y="290" class="u-lbl" text-anchor="middle">skema tak terdaftar / tak kompatibel → producer DITOLAK sebelum menulis</text>
      </svg></div><figcaption>Record hanya membawa schema id; definisi sebenarnya hidup di Schema Registry yang memvalidasi setiap perubahan.</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'REST API: memeriksa dan mendaftarkan skema',
      lang: 'bash',
      output: false,
      code: `# daftar subject
curl -s http://localhost:8081/subjects | jq

# lihat semua versi suatu subject
curl -s http://localhost:8081/subjects/order-events-value/versions | jq

# ambil definisi skema versi terbaru
curl -s http://localhost:8081/subjects/order-events-value/versions/latest | jq

# ambil skema berdasarkan id (dipakai consumer saat decode)
curl -s http://localhost:8081/schemas/ids/7 | jq

# daftarkan skema baru (registry mengecek kompatibilitas)
curl -s -X POST http://localhost:8081/subjects/order-events-value/versions \\
  -H 'Content-Type: application/json' \\
  -d '{"schema":"{\\"type\\":\\"record\\",\\"name\\":\\"OrderCreated\\",\\"fields\\":[{\\"name\\":\\"order_id\\",\\"type\\":\\"string\\"},{\\"name\\":\\"total\\",\\"type\\":\\"int\\"}]}","schemaType":"AVRO"}'

# periksa & ubah kompatibilitas subject
curl -s http://localhost:8081/config/order-events-value | jq
curl -s -X PUT http://localhost:8081/config/order-events-value \\
  -H 'Content-Type: application/json' -d '{"compatibility":"BACKWARD"}'`,
      explain: [
        'Tiga endpoint yang paling sering dipakai: <code>/subjects</code> (daftar), <code>/versions</code> (riwayat), dan <code>/schemas/ids/{id}</code> (definisi per record).',
        'Saat <code>POST /versions</code> menolak skema, berarti perubahanmu <b>tidak kompatibel</b> dengan konfigurasi subject — inilah gerbang pengaman sebelum error muncul di consumer production.',
        'Endpoint <code>/config/{subject}</code> menampilkan dan mengubah aturan kompatibilitas — perhatikan perubahan berlaku ke <b>registrasi berikutnya</b>, bukan memperbaiki skema yang sudah terlanjur ada.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Subject: penamaan yang menentukan cakupan validasi</h3><p>Registry menyusun riwayat berdasarkan <b>subject</b>. Dua strategi bawaan:</p><table><thead><tr><th>Strategi</th><th>Subject dibentuk dari</th><th>Cocok untuk</th></tr></thead><tbody><tr><td><b>TopicNameStrategy</b> (default)</td><td>Nama topic: <code>order-events-value</code> / <code>-key</code></td><td>Satu skema per topic; paling umum &amp; sederhana</td></tr><tr><td><b>RecordNameStrategy</b></td><td>Nama record Avro: <code>OrderCreated</code></td><td>Banyak tipe record berbeda dalam satu topic</td></tr><tr><td><b>TopicRecordNameStrategy</b></td><td>Kombinasi topic + nama record</td><td>Fleksibel: beberapa tipe per topic, tetap terisolasi per topic</td></tr></tbody></table><p>Pemilihan ini menentukan <b>seberapa longgar validasi berlaku</b>: bila satu topic memuat banyak tipe event berbeda, TopicNameStrategy menyatukan mereka ke satu riwayat subject sehingga perubahan satu tipe ikut menyangkut tipe lain.</p>'
    },
    {
      type: 'text',
      html: '<h3>Kompatibilitas dalam praktik</h3><p>Konfigurasi per subject (juga bisa global) yang paling dipakai:</p><ul><li><b>BACKWARD</b> (default di banyak instalasi) — skema baru harus bisa membaca data lama. Syarat: field baru punya default, penghapusan field aman bila konsumen lama tidak memakainya lagi.</li><li><b>FORWARD</b> — skema lama harus bisa membaca data baru.</li><li><b>FULL</b> — keduanya; paling ketat, paling aman untuk production.</li><li><b>NONE</b> — tanpa pemeriksaan; hanya untuk lingkungan eksperimen.</li></ul><p>Alur evolusi yang aman secara umum: <b>tambah field dengan default → registrasi → deploy consumer baru (jika perlu) → deploy producer</b>. Untuk perubahan besar (ubah tipe/nama), buat <b>subject/topik baru</b> atau event_type berbeda, jalankan keduanya berdampingan, lalu pensiunkan yang lama.</p>'
    },
    {
      type: 'example',
      title: 'Evolusi Avro: aman vs ditolak',
      lang: 'json',
      output: false,
      code: `v1 (tersimpan):
  {"type":"record","name":"OrderCreated","fields":[
     {"name":"order_id","type":"string"},
     {"name":"total","type":"int"}]}

v2 DITERIMA (backward: field baru punya default):
  {"type":"record","name":"OrderCreated","fields":[
     {"name":"order_id","type":"string"},
     {"name":"total","type":"int"},
     {"name":"currency","type":"string","default":"IDR"}]}

v3 DITOLAK (tipe berubah — data lama tak terbaca):
  {"name":"total","type":"string"}          <-- error: type mismatch

v3 ALTERNATIF DITERIMA (tambah field baru, total dibiarkan):
  ... + {"name":"total_v2","type":["null","string"],"default":null}

ATURAN CEPAT
  + field dengan default      → aman (BACKWARD)
  - field lama                → hati-hati (perlu FULL &amp; tak dipakai)
  ubah tipe / rename          → jangan; pakai subject atau event_type baru`,
      explain: [
        'Registry menolak v3 di <b>saat registrasi</b> — kamu mengetahui masalahnya sebelum satu pun record rusak mengalir.',
        'Pola <b>menambah field baru</b> dengan nama berbeda (total_v2) plus konversi adalah jalur aman ketika perubahan tipe di wajib; data lama tetap terbaca, data baru berdampingan.',
        'Konsekuensi praktis <b>BACKWARD</b>: siapkan default untuk setiap penambahan — tanpanya, registrasi akan ditolak.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Apa yang terjadi bila terjadi kegagalan skema</h3><ul><li><b>Skema tak terdaftar</b> — producer gagal (atau fallback tergantung konfigurasi <code>auto.register.schemas</code>); periksa koneksi registry dan izin registrasi.</li><li><b>Id tidak ditemukan</b> saat consumer decode — biasanya registry berbeda antar-environment, data dipindahkan tanpa skemanya, atau registry sudah dibersihkan.</li><li><b>Consumer tak bisa membaca data baru</b> — skema baru tidak kompatibel dengan yang diharapkan consumer (periksa <code>latest.compatibility.strict</code>).</li><li><b>Registry down</b> — koneksi dibuka di awal; bila harus memuat skema baru saat runtime, producer/consumer bisa gagal. Pertimbangkan <b>cache lokal</b> dan registry dengan HA.</li></ul>'
    },
    {
      type: 'warn',
      title: 'Kesalahan umum yang sering menimpa tim baru',
      text: '<ul><li><b>auto.register.schemas=true di production</b> — skema terdaftar otomatis dari kode developer mana pun; perubahan tak terkontrol lolos begitu saja. Matikan registrasi otomatis, daftarkan lewat CI/CD.</li><li><b>Menghapus lalu membuat ulang subject</b> — id skema lama bisa tidak konsisten; tangani sebagai perubahan besar.</li><li><b>Lupa default pada field baru</b> — registrasi ditolak atau data baru gagal dibaca konsumen lama.</li><li><b>Satu registry untuk semua environment tanpa pemisahan</b> — dev/staging/prod saling menimpa riwayat.</li><li><b>Mengandalkan registry sebagai penyimpanan data</b> — registry menyimpan definisi, bukan record; record tetap di log Kafka dengan retensinya.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Checklist adopsi Schema Registry',
      text: '<p>(1) Pilih format — Avro/Protobuf. (2) Pilih strategi subject — mulai <code>TopicNameStrategy</code>. (3) Set kompatibilitas <b>BACKWARD atau FULL</b> di semua subject. (4) Matikan auto-register di production; daftarkan via CI dengan pemeriksaan kompatibilitas. (5) Siapkan alert untuk registrasi gagal dan kegagalan decode. Dengan lima langkah ini, evolusi skema berhenti menjadi insiden dan menjadi rutinitas yang terkendali.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Schema Registry', 'Layanan pusat pendaftaran, validasi, dan penyimpanan definisi skema.'],
        ['Schema id', 'Angka 4 byte di awal payload yang menunjuk definisi skema di registry.'],
        ['Subject', 'Nama riwayat skema (per topic / per record) tempat versi disimpan.'],
        ['TopicNameStrategy', 'Subject dibentuk dari nama topic (default).'],
        ['RecordNameStrategy', 'Subject dibentuk dari nama tipe record.'],
        ['BACKWARD / FORWARD / FULL', 'Tingkat kompatibilitas evolusi skema per subject.'],
        ['auto.register.schemas', 'Setelan registrasi otomatis — sebaiknya mati di production.'],
        ['Schema evolution', 'Perubahan bertahap skema dari versi ke versi secara kompatibel.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Uraikan perjalanan <b>schema id</b> dari producer hingga consumer memahami payload.</li><li>Bandingkan TopicNameStrategy dan RecordNameStrategy: kapan masing-masing tepat?</li><li>Daftarkan skema v2 dengan field baru bertanda default lewat REST API — lalu coba daftarkan perubahan tipe; catat hasilnya.</li><li>Kenapa <code>auto.register.schemas=true</code> berisiko di production?</li><li>Skenario &quot;id tidak ditemukan&quot; di consumer — sebutkan 3 kemungkinan penyebab.</li></ol>'
    }
  ],
  recap: [
    'Schema Registry = <b>sumber definisi skema terpusat</b>; record Kafka hanya membawa <b>schema id</b>, consumer mengambil definisinya.',
    'Validasi terjadi <b>saat registrasi</b> — skema tak kompatibel ditolak sebelum membanjiri data rusak.',
    'Strategi subject (Topic/Record/TopicRecordName) menentukan <b>cakupan riwayat</b>; kompatibilitas (BACKWARD/FORWARD/FULL) menentukan <b>aturan evolusi</b>.',
    'Di production: <b>matikan auto-register</b>, daftarkan via CI, siapkan alert registrasi gagal dan kegagalan decode.'
  ]
});
