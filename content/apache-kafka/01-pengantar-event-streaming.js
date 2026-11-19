/* ============================================================
   Pelajaran Apache Kafka — 01: Apa Itu Apache Kafka?
   ============================================================ */
'use strict';

window.KAFKA_LESSONS = window.KAFKA_LESSONS || [];

window.KAFKA_LESSONS.push({
  id: 'pengantar-event-streaming',
  title: 'Apa Itu Apache Kafka?',
  chapter: 'Fondasi',
  duration: '15 menit',
  intro: [
    'Bayangkan pabrik yang setiap menit memproduksi ribuan paket. Kalau setiap paket harus diantar langsung oleh kurir ke alamat penerima satu per satu, kurirnya kewalahan dan pabrik berhenti menunggu. Solusinya adalah <b>gudang raksasa yang mencatat setiap paket</b>: produksi tetap berjalan, penerima datang kapan saja, dan catatan paket tetap tersimpan untuk diperiksa ulang.',
    'Itulah peran <b>Apache Kafka</b> — platform event streaming terdistribusi yang menyimpan aliran data (event) dengan urutan dan dapat dibaca ulang. Pelajaran ini membedah masalah yang diselesaikan Kafka, perbedaan komunikasi sinkron dan asinkron, konsep event-driven architecture, sampai perbandingan Kafka dengan RabbitMQ, Redis Pub/Sub, dan database.'
  ],
  objectives: [
    'Menjelaskan apa itu Apache Kafka dengan kalimatmu sendiri memakai analogi gudang paket',
    'Membedakan komunikasi sinkron (request-response) dengan asinkron (queue dan event streaming)',
    'Menjelaskan peran producer, consumer, message/event, dan prinsip event-driven architecture',
    'Membandingkan Kafka dengan RabbitMQ, Redis Pub/Sub, dan database beserta kapan masing-masing tepat dipakai'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Masalah yang diselesaikan Kafka</h3><p>Hampir semua sistem modern harus memindahkan data antarprogram: pesanan dari aplikasi ke pembayaran, perubahan profil ke notifikasi, log aktivitas ke analitik. Cara paling sederhana adalah memanggil langsung lewat HTTP — tetapi begitu penerima sedang sibuk atau mati, pengirim ikut tersendat.</p><p>Kafka menjawab tiga masalah sekaligus:</p><ul><li><b>Decoupling</b> — pengirim tidak perlu tahu siapa penerima, bahkan penerima belum tentu ada saat data dikirim.</li><li><b>Pemrosesan asinkron</b> — pengirim menyerahkan data lalu lanjut bekerja; pemrosesan terjadi belakangan.</li><li><b>Penyeimbangan beban</b> — lonjakan trafik ditampung sebagai antrean, bukan langsung menimpa penerima.</li></ul><p>Yang membedakan Kafka dari message broker biasa adalah sifatnya sebagai <b>distributed log terdistribusi</b>: data yang masuk tetap tersimpan selama periode retensi, sehingga bisa dibaca ulang (replay) oleh banyak pihak kapan saja.</p>'
    },
    {
      type: 'text',
      html: '<h3>Jadi, apa itu Apache Kafka?</h3><p><b>Apache Kafka</b> adalah platform open source untuk <b>distributed event streaming</b> yang pertama dikembangkan di LinkedIn (2011), lalu menjadi proyek Apache Software Foundation. Secara singkat:</p><blockquote style="border-left:3px solid var(--accent);padding-left:12px;margin:12px 0"><b>Kafka = tempat producer menulis event ke topic, event disimpan berurutan dalam partition, lalu consumer membacanya kapan saja — termasuk membacanya ulang dari awal.</b></blockquote><p>Tiga kemampuan intinya: <b>menerbitkan</b> (produce) event dengan throughput tinggi, <b>menyimpan</b> event selama retensi yang kamu tentukan, dan <b>memproses/consume</b> event secara real-time maupun secara batch. Kafka bukan database pengganti untuk query rumit, dan bukan pengganti HTTP untuk permintaan yang butuh jawaban seketika.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 280" width="760" role="img" aria-label="Alur data Kafka: producer menulis record ke topic yang terbagi menjadi partition, lalu consumer membaca berdasarkan offset">
        <rect x="20" y="40" width="140" height="70" rx="8" class="u-hd"/>
        <text x="90" y="70" class="u-title" text-anchor="middle">Producer</text>
        <text x="90" y="94" class="u-lbl" text-anchor="middle">menulis record</text>
        <line x1="166" y1="75" x2="228" y2="75" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="234" y="20" width="272" height="224" rx="10" class="u-box"/>
        <text x="370" y="46" class="u-title" text-anchor="middle">Topic: user-events</text>
        <line x1="248" y1="56" x2="492" y2="56" class="u-line"/>
        <rect x="248" y="70" width="244" height="46" rx="6" class="u-hd"/>
        <text x="370" y="98" class="u-lbl" text-anchor="middle">Partition 0 — offset 0,1,2...</text>
        <rect x="248" y="126" width="244" height="46" rx="6" class="u-box"/>
        <text x="370" y="154" class="u-lbl" text-anchor="middle">Partition 1 — offset 0,1,2...</text>
        <rect x="248" y="182" width="244" height="46" rx="6" class="u-box"/>
        <text x="370" y="210" class="u-lbl" text-anchor="middle">Partition 2 — offset 0,1,2...</text>
        <line x1="512" y1="93" x2="574" y2="93" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="512" y1="149" x2="574" y2="149" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="512" y1="205" x2="574" y2="205" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="580" y="40" width="160" height="70" rx="8" class="u-hd"/>
        <text x="660" y="70" class="u-title" text-anchor="middle">Consumer</text>
        <text x="660" y="94" class="u-lbl" text-anchor="middle">membaca per offset</text>
        <text x="370" y="266" class="u-lbl" text-anchor="middle">urutan terjamin di dalam tiap partition</text>
      </svg></div><figcaption>Producer menulis record ke topic; topic terbagi menjadi partition; consumer membaca berdasarkan offset.</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Sinkron vs asinkron: request-response, queue, dan streaming</h3><p><b>Sinkron (request-response)</b>: pengirim mengirim permintaan lalu <b>menunggu jawaban</b>. HTTP/REST dan gRPC contohnya. Cocok untuk data yang butuh jawaban seketika (cek saldo, login), tetapi membuat pengirim bergantung pada kesehatan penerima.</p><p><b>Asinkron</b> punya dua bentuk utama:</p><table><thead><tr><th>Aspek</th><th>Message Queue</th><th>Event Streaming</th></tr></thead><tbody><tr><td><b>Pola</b></td><td>Satu pesan dikonsumsi satu worker</td><td>Satu event disimpan, banyak pembaca</td></tr><tr><td><b>Fokus</b></td><td>Mengerjakan pekerjaan (job)</td><td>Mencatat fakta yang terjadi</td></tr><tr><td><b>Retensi</b></td><td>Hilang setelah diproses</td><td>Tersimpan selama retensi, bisa replay</td></tr><tr><td><b>Contoh</b></td><td>RabbitMQ, SQS</td><td>Apache Kafka</td></tr></tbody></table><p>Queue menjawab &quot;siapa yang mengerjakan ini?&quot;, streaming menjawab &quot;apa saja yang terjadi?&quot;. Keduanya saling melengkapi, bukan saling menggantikan.</p>'
    },
    {
      type: 'example',
      title: 'Dua cara memindahkan data antarprogram',
      lang: 'text',
      output: false,
      code: `SINKRON (HTTP)
App A ──POST /order──▶ App B ──201 Created──▶ App A
        (App A menunggu; App B mati = App A gagal)

ASINKRON (Kafka)
App A ──produce event──▶ [ Topic: order-created ] ──▶ App B (kapan saja)
                                │
                                └──▶ App C (audit, kapan saja)`,
      explain: [
        'Pada mode sinkron, kesehatan penerima ikut menentukan keberhasilan pengirim — satu layanan mati bisa menjalar ke layanan lain.',
        'Pada mode Kafka, App A cukup menulis event lalu lanjut; topic menampungnya dan bisa dibaca beberapa consumer sekaligus (App B dan App C) tanpa App A perlu tahu.',
        'Karena event tetap tersimpan, consumer baru bisa menambah diri dan membaca ulang riwayat — ini yang tidak dimiliki queue biasa.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Event-driven architecture (EDA) dan use case</h3><p><b>Event-driven architecture</b> adalah gaya arsitektur di mana <b>event (fakta yang terjadi)</b> menjadi aliran komunikasi utama antarservice: &quot;pesanan dibuat&quot;, &quot;pembayaran diterima&quot;, &quot;profil diperbarui&quot;. Service menerbitkan event, service lain berlangganan dan bereaksi.</p><p>Use case paling umum memakai Kafka:</p><ul><li><b>Sinkronisasi data</b> — perubahan dari satu database didistribusikan ke layanan lain secara near real-time.</li><li><b>Audit log</b> — setiap aksi penting dicatat berurutan dan tidak hilang.</li><li><b>Notifikasi</b> — event pesanan memicu surel, push notification, dan SMS oleh service terpisah.</li><li><b>Aktivitas pengguna</b> — klik, view, dan search diolah untuk rekomendasi dan analitik.</li><li><b>Integrasi microservices</b> — satu peristiwa bisnis diketahui semua layanan tanpa saling memanggil satu per satu.</li></ul>'
    },
    {
      type: 'text',
      html: '<h3>Kafka vs teknologi lain</h3><p>Jangan menganggap satu teknologi selalu menggantikan yang lain. Pemilihan bergantung pada pola konsumsi, retensi, routing, dan operasional:</p><table><thead><tr><th>Teknologi</th><th>Fokus utama</th><th>Perlu diketahui</th></tr></thead><tbody><tr><td><b>Apache Kafka</b></td><td>Distributed event streaming &amp; log terdistribusi</td><td>Event tersimpan &amp; bisa dibaca ulang banyak pihak</td></tr><tr><td><b>RabbitMQ</b></td><td>Message broker dengan routing &amp; antrean pesan</td><td>Pesan umumnya hilang setelah dikonsumsi; routing sangat fleksibel</td></tr><tr><td><b>Redis Pub/Sub</b></td><td>Pub/sub ringan dan cepat</td><td>Pesan <b>tidak disimpan</b> — subscriber yang offline melewatkan pesan</td></tr><tr><td><b>Database</b></td><td>Penyimpanan &amp; query data terstruktur</td><td>Untuk data yang butuh query, bukan aliran event</td></tr></tbody></table>'
    },
    {
      type: 'example',
      title: 'Bentuk satu record event di Kafka',
      lang: 'json',
      output: false,
      code: `{
  "event_id": "evt-10001",
  "event_type": "order.created",
  "event_version": 1,
  "occurred_at": "2026-11-18T10:00:00Z",
  "data": {
    "order_id": "ORD-1001",
    "user_id": "USR-1001",
    "total": 250000
  }
}`,
      explain: [
        'Record Kafka berisi <b>key</b> (opsional), <b>value</b> (payload — di sini seluruh JSON), <b>timestamp</b>, dan offset yang diberikan broker.',
        'Field <code>event_id</code> berguna untuk deduplikasi, <code>event_version</code> menjaga kompatibilitas perubahan schema, dan <code>occurred_at</code> mencatat waktu kejadian (bukan waktu pengiriman).',
        'Struktur envelope seperti ini dibahas tuntas di pelajaran Desain Event — di sini cukup kenali bentuknya dulu.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan umum pemula',
      text: '<ul><li>Menganggap Kafka adalah <b>database pengganti</b> — Kafka tidak punya query SQL dan retensinya terbatas.</li><li>Memakai Kafka untuk permintaan yang butuh <b>jawaban seketika</b> (cek saldo) — itu pekerjaan HTTP/RPC.</li><li>Mengira Kafka menggantikan RabbitMQ selamanya — untuk pekerjaan satu-pesan-satu-worker, queue tetap lebih sederhana.</li><li>Langsung memakai istilah partition, offset, dan consumer group tanpa memahaminya — semua itu dibahas bertahap di pelajaran berikutnya.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Cara membaca bab ini',
      text: '<p>Urutan 25 pelajaran Kafka dirancang berjenjang: pelajaran 1–2 membangun kosakata, 3–5 menjalankan Kafka sungguhan, 6–11 mendalami model data dan pembacaan, lalu naik ke pola desain, ekosistem, keamanan, operasi, dan proyek akhir. Kerjakan berurutan — tiap pelajaran memakai konsep dari pelajaran sebelumnya.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Event / Record', 'Unit data tunggal yang dikirim ke Kafka (satu baris pesan).'],
        ['Topic', 'Kategori/nama stream tempat record ditulis, mis. order-created.'],
        ['Producer', 'Aplikasi yang menulis/menerbitkan record ke Kafka.'],
        ['Consumer', 'Aplikasi yang membaca record dari Kafka.'],
        ['Broker', 'Satu server Kafka yang menyimpan partition dan melayani baca/tulis.'],
        ['Cluster', 'Kumpulan broker yang bekerja bersama sebagai satu kesatuan.'],
        ['Event-driven architecture', 'Arsitektur yang memakai event sebagai aliran komunikasi utama antarservice.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Tulis <b>3 kalimat</b> menjelaskan Kafka ke rekan kerja yang belum tahu, memakai analogi gudang paket.</li><li>Sebutkan <b>tiga masalah</b> yang dijawab Kafka (decoupling, asinkron, penyeimbangan beban) dengan satu contoh nyata masing-masing.</li><li>Bandingkan <b>queue</b> dan <b>event streaming</b> dalam tabel 4 baris: pola, fokus, retensi, contoh teknologi.</li><li>Kapan kamu akan memilih <b>RabbitMQ</b> dan kapan memilih <b>Kafka</b>? Tulis satu skenario untuk masing-masing.</li></ol>'
    }
  ],
  recap: [
    '<b>Kafka = distributed event streaming</b>: producer menulis event ke topic, event disimpan berurutan, consumer membaca kapan saja termasuk replay.',
    'Tiga masalah utama yang dijawab: <b>decoupling, pemrosesan asinkron, dan penyeimbangan beban</b>.',
    'Sinkron (HTTP) untuk jawaban seketika; <b>queue untuk pekerjaan</b>; <b>streaming untuk mencatat fakta</b> yang bisa dibaca banyak pihak.',
    'Kafka bukan pengganti database maupun RabbitMQ — <b>pilihan teknologi bergantung pada pola konsumsi, retensi, dan routing</b>.'
  ]
});
