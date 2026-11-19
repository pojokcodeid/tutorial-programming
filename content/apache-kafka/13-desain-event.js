/* ============================================================
   Pelajaran Apache Kafka — 11: Desain Event & Schema
   ============================================================ */
'use strict';

window.KAFKA_LESSONS = window.KAFKA_LESSONS || [];

window.KAFKA_LESSONS.push({
  id: 'desain-event',
  title: 'Desain Event & Schema',
  chapter: 'Konsumsi Data',
  duration: '15 menit',
  intro: [
    'Di production, masalah terbesar jarang berasal dari Kafka-nya — melainkan dari <b>bentuk data yang mengalir</b>. Satu field diganti nama, satu tipe berubah dari string ke number, lalu consumer lama mulai error satu per satu. Karena event hidup lebih lama daripada kode producer yang menulisnya, desain event dan schema adalah keputusan arsitektur, bukan detail kecil.',
    'Pelajaran ini membahas cara menyusun envelope event yang sehat, strategi evolusi schema (backward/forward/compatible), perbandingan format <b>JSON, Avro, dan Protobuf</b>, peran <b>Schema Registry</b>, serta prinsip naming dan versioning yang membuat sistem tetap mudah dikembangkan.'
  ],
  objectives: [
    'Menyusun envelope event dengan field wajib dan field yang sebaiknya dihindari',
    'Membandingkan JSON, Avro, dan Protobuf beserta kapan masing-masing tepat',
    'Menjelaskan konsep backward, forward, dan full compatibility',
    'Menjelaskan peran Schema Registry dan prinsip versioning event'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Envelope event: kerangka yang konsisten</h3><p>Alih-alih mengirim payload apa adanya, bungkus setiap event dalam <b>envelope</b> berisi metadata yang selalu ada. Kerangka yang umum dipakai:</p><table><thead><tr><th>Field</th><th>Wajib?</th><th>Fungsi</th></tr></thead><tbody><tr><td><code>event_id</code></td><td>Ya</td><td>Identitas unik — untuk deduplikasi dan tracing antarservice</td></tr><tr><td><code>event_type</code></td><td>Ya</td><td>Jenis peristiwa, mis. <code>order.created</code> (versioned: <code>order.created.v2</code>)</td></tr><tr><td><code>event_version</code></td><td>Ya</td><td>Versi skema payload — konsumen tahu cara membaca</td></tr><tr><td><code>occurred_at</code></td><td>Ya</td><td>Waktu kejadian (bisa berbeda dari waktu produksi)</td></tr><tr><td><code>produced_at</code></td><td>Saran</td><td>Waktu event dikirim — untuk mengukur latensi</td></tr><tr><td><code>source</code></td><td>Saran</td><td>Service/ sistem asal event</td></tr><tr><td><code>correlation_id</code></td><td>Saran</td><td>Mengikat satu alur bisnis lintas service (mis. satu pesanan)</td></tr><tr><td><code>data</code></td><td>Ya</td><td>Payload inti peristiwa</td></tr></tbody></table>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 320" width="760" role="img" aria-label="Alur event dari producer melewati Schema Registry dan topic menuju consumer">
        <rect x="20" y="40" width="150" height="70" rx="8" class="u-hd"/>
        <text x="95" y="70" class="u-title" text-anchor="middle">Producer</text>
        <text x="95" y="94" class="u-lbl" text-anchor="middle">order-service</text>
        <line x1="176" y1="75" x2="238" y2="75" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="244" y="24" width="240" height="102" rx="10" class="u-box"/>
        <text x="364" y="50" class="u-title" text-anchor="middle">Schema Registry</text>
        <line x1="258" y1="60" x2="470" y2="60" class="u-line"/>
        <text x="364" y="86" class="u-lbl" text-anchor="middle">validasi skema + versi (id, latest)</text>
        <text x="364" y="112" class="u-lbl" text-anchor="middle">compatibility: BACKWARD / FORWARD</text>
        <rect x="244" y="156" width="240" height="86" rx="10" class="u-hd"/>
        <text x="364" y="184" class="u-title" text-anchor="middle">Topic: order-events</text>
        <text x="364" y="210" class="u-lbl" text-anchor="middle">record = skema-id + payload biner</text>
        <text x="364" y="232" class="u-lbl" text-anchor="middle">(Avro/Protobuf) atau JSON bebas</text>
        <line x1="490" y1="75" x2="560" y2="75" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="490" y1="199" x2="560" y2="199" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="566" y="40" width="174" height="70" rx="8" class="u-hd"/>
        <text x="653" y="70" class="u-title" text-anchor="middle">Consumer</text>
        <text x="653" y="94" class="u-lbl" text-anchor="middle">payment-service</text>
        <rect x="566" y="164" width="174" height="70" rx="8" class="u-box"/>
        <text x="653" y="194" class="u-title" text-anchor="middle">Consumer</text>
        <text x="653" y="218" class="u-lbl" text-anchor="middle">audit-service (replay)</text>
        <text x="380" y="290" class="u-lbl" text-anchor="middle">skema divalidasi saat produce; consumer mengambil skema berdasarkan id</text>
      </svg></div><figcaption>Skema dikelola terpusat: producer memvalidasi saat menulis, consumer mengambil definisi berdasarkan id record.</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Contoh envelope event yang sehat',
      lang: 'json',
      output: false,
      code: `{
  "event_id": "evt-9f3a1c22",
  "event_type": "order.created",
  "event_version": 2,
  "occurred_at": "2026-11-18T10:00:00Z",
  "produced_at": "2026-11-18T10:00:01Z",
  "source": "order-service",
  "correlation_id": "ORD-1001",
  "data": {
    "order_id": "ORD-1001",
    "user_id": "USR-1001",
    "items_count": 3,
    "total": 250000,
    "currency": "IDR"
  }
}`,
      explain: [
        '<code>event_id</code> unik membuat consumer dapat <b>menduplikasi dengan aman</b> bila record terbaca dua kali (mis. setelah rebalance).',
        '<code>occurred_at</code> dipisah dari <code>produced_at</code>: kadang pesanan dibuat pukul 09:59 tetapi baru dikirim 10:00 — analitik butuh waktu kejadian yang jujur.',
        'Field <code>data</code> memuat hanya fakta peristiwa — hindari menyisipkan data sensitif (kartu, KTP) yang tidak dibutuhkan consumer.'
      ]
    },
    {
      type: 'text',
      html: '<h3>JSON vs Avro vs Protobuf</h3><table><thead><tr><th>Aspek</th><th>JSON</th><th>Avro</th><th>Protobuf</th></tr></thead><tbody><tr><td><b>Bentuk</b></td><td>Teks, mudah dibaca</td><td>Biner + skema</td><td>Biner + skema</td></tr><tr><td><b>Ukuran</b></td><td>Besar (banyak spasi/kunci)</td><td>Kecil (tanpa nama field)</td><td>Sangat kecil (tag numerik)</td></tr><tr><td><b>Kecepatan</b></td><td>Sedang (parse teks)</td><td>Cepat</td><td>Sangat cepat</td></tr><tr><td><b>Evolusi</b></td><td>Lunak (tanggung jawab kode)</td><td>Ketat via Schema Registry</td><td>Kuat via tag + rules</td></tr><tr><td><b>Tooling</b></td><td>Universal</td><td>Ekosistem data/Kafka</td><td>Ekosistem gRPC/Google</td></tr><tr><td><b>Cocok untuk</b></td><td>Event kecil, inspeksi cepat</td><td>Pipeline data besar, ETL</td><td>RPC internal, high volume</td></tr></tbody></table><p>Aturan praktis: bila kamu masih eksplorasi atau event-nya sedikit, <b>JSON dulu</b> (mudah dibaca & debug). Begitu volume besar, retensi panjang, atau evolusi skema mulai jadi masalah, pindah ke <b>Avro/Protobuf dengan Schema Registry</b>.</p>'
    },
    {
      type: 'text',
      html: '<h3>Kompatibilitas: backward, forward, full</h3><p><b>Compatible</b> berarti konsumen lama dan baru tetap bisa memproses record yang saling ditulis. Tiga tingkat utama:</p><ul><li><b>Backward compatible</b> — skema baru bisa membaca data lama. (Skema baru menambah field dengan <i>default</i>.)</li><li><b>Forward compatible</b> — skema lama bisa membaca data baru. (Skema baru menghapus field yang sudah punya default, atau tidak mengubah makna lama.)</li><li><b>Full compatible</b> — keduanya terpenuhi; paling aman dan paling lazim untuk production.</li></ul><p>Kunci teknisnya hampir selalu <b>default value</b>: field baru wajib punya default agar konsumen lama tidak crash, dan field yang dihapus sebaiknya tetap punya default agar konsumen baru tidak bingung.</p>'
    },
    {
      type: 'example',
      title: 'Evolusi skema yang aman vs berbahaya',
      lang: 'text',
      output: false,
      code: `SKEMA v1 (awal)
  { "order_id": string, "total": int }

AMAN (backward + forward)
  v2: { "order_id": string, "total": int, "currency": string = "IDR" }
      → field baru punya DEFAULT: konsumen lama tetap jalan
  v3: { "order_id": string, "total": int, "currency": string = "IDR",
        "note": string = "" }
      → default kosong: aman untuk semua pihak

BERBAHAYA
  v2: mengganti total:int → total:string     ← tipe berubah: konsumen lama crash
  v2: menghapus order_id tanpa default        ← data lama tak bisa dibaca konsumen baru
  v2: mengganti nama field total → amount     ← tanpa alias: data lama tak terbaca
      (solusi bila wajib rename: pakai alias di skema + periode transisi ganda)

ATURAN MAIN
  1. Tambah field → SELALU beri default
  2. Hapus field → hanya bila sudah tidak dipakai & ada default
  3. Ubah tipe/nama → jangan di produksi berjalan; pakai event_type baru (.v2)
  4. Validasi otomatis lewat Schema Registry sebelum deploy producer/consumer`,
      explain: [
        'Menambah field dengan <b>default</b> adalah satu-satunya perubahan yang aman untuk hampir semua skenario — jadikan kebiasaan.',
        'Mengubah tipe atau makna field adalah pelanggaran berat: jalur amannya adalah membuat <b>event_type baru</b> (mis. <code>order.created.v2</code>) dan menjalankan keduanya berdampingan sementara.',
        'Schema Registry memberi <b>gerbang otomatis</b>: perubahan skema yang tidak kompatibel akan <b>ditolak saat registrasi</b>, bukan saat consumer error di production.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Prinsip naming dan versioning</h3><ul><li><b>Nama event = kata kerja lampau</b> — <code>order.created</code>, <code>payment.settled</code>: menggambarkan fakta yang sudah terjadi, bukan perintah.</li><li><b>Pisahkan konsep perintah vs peristiwa</b> — <code>order.create</code> (perintah) vs <code>order.created</code> (peristiwa) adalah hal berbeda.</li><li><b>Versi di nama bila perubahan besar</b> — <code>order.created.v2</code> membuat dua skema bisa hidup berdampingan tanpa saling tabrak.</li><li><b>Topic per bounded context</b> — satu topic untuk satu domain (mis. <code>order-events</code>), bukan satu topic raksasa berisi semuanya.</li><li><b>Jangan tumpuk field opsional tanpa batas</b> — event yang semua field-nya nullable sulit dipahami dan divalidasi.</li></ul>'
    },
    {
      type: 'warn',
      title: 'Anti-pattern desain event yang mahal',
      text: '<ul><li><b>Menaruh data rahasia</b> (nomor kartu, KTP, token) ke dalam event — event bersifat luas dan panjang umur; sekali bocor sulit ditarik.</li><li><b>Skema tanpa versioning</b> — begitu ada dua versi, konsumen tidak tahu mana yang harus dipakai.</li><li><b>Ubah tipe field diam-diam</b> — semua konsumen lama tiba-tiba error di production.</li><li><b>Event terlalu besar</b> — ribuan item dalam satu record memperlambat konsumen dan boros memori.</li><li><b>Satu topic untuk segalanya</b> — routing dan retensi jadi tidak mungkin disetel per kebutuhan.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Mulai sederhana, siap naik kelas',
      text: '<p>Belajar dan MVP: pakai <b>JSON + envelope wajib</b> — mudah dibaca, cepat berubah. Begitu ada kebutuhan nyata (volume besar, evolusi ketat, integritas lintas tim), transisikan ke <b>Avro + Schema Registry dengan compatibility FULL</b>. Yang terpenting bukan formatnya, melainkan <b>disiplin envelope, default, dan versioning</b> sejak hari pertama.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Envelope', 'Pembungkus event berisi metadata + payload data.'],
        ['Schema', 'Definisi bentuk dan tipe field sebuah event.'],
        ['Avro', 'Format biner dengan skema; populer di ekosistem data Kafka.'],
        ['Protobuf', 'Format biner ringan dengan tag numerik (gRPC).'],
        ['Schema Registry', 'Layanan pusat pendaftaran & validasi skema.'],
        ['Backward compatible', 'Skema baru dapat membaca data lama.'],
        ['Forward compatible', 'Skema lama dapat membaca data baru.'],
        ['Default value', 'Nilai bawaan yang membuat evolusi skema aman.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Susun envelope untuk event <code>payment.settled</code> dengan field wajib lengkap dan jelaskan fungsi tiap field.</li><li>Mengapa <code>event_id</code> dibutuhkan konsumen yang memproses secara at-least-once?</li><li>Perubahan mana yang backward compatible: menambah field dengan default, mengubah tipe, menghapus field tanpa default?</li><li>Bandingkan JSON dan Avro dalam 3 baris: ukuran, kecepatan, evolusi.</li><li>Skenario rename field <code>total</code> → <code>amount</code> di produksi berjalan — susun strategi transisinya.</li></ol>'
    }
  ],
  recap: [
    'Envelope wajib: <b>event_id, event_type, event_version, occurred_at, data</b> — plus source & correlation_id untuk tracing.',
    '<b>JSON</b> untuk kemudahan; <b>Avro/Protobuf</b> untuk volume besar dan evolusi ketat — didukung Schema Registry.',
    'Kompatibilitas: <b>backward</b> (baru baca lama), <b>forward</b> (lama baca baru), <b>full</b> (duanya) — kuncinya <b>default value</b>.',
    'Nama event = kata kerja lampau (<code>order.created</code>); perubahan besar memakai <b>event_type/version baru</b>, bukan diam-diam.'
  ]
});
