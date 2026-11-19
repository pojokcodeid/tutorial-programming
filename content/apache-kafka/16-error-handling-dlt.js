/* ============================================================
   Pelajaran Apache Kafka — 16: Error Handling, Retry & Dead Letter Topic
   ============================================================ */
'use strict';

window.KAFKA_LESSONS = window.KAFKA_LESSONS || [];

window.KAFKA_LESSONS.push({
  id: 'error-handling-dlt',
  title: 'Error Handling, Retry & Dead Letter Topic',
  chapter: 'Reliability',
  duration: '15 menit',
  intro: [
    'Anggap sistem Kafka-mu tidak akan pernah gagal adalah jalan pintas menuju insiden tengah malam. Broker bisa kehabisan disk, jaringan bisa timeout sesaat, payload bisa rusak dari producer lama, dan database tujuan bisa sedang maintenance. Yang membedakan sistem rapuh dengan sistem andal bukanlah ketiadaan error, melainkan <b>cara kegagalan itu ditangani</b>.',
    'Pelajaran ini membahas rantai penanganan kegagalan dari yang paling ringan sampai yang paling berat: mengenali jenis kegagalan, mencoba ulang dengan backoff eksponensial plus jitter, membatasi percobaan lewat retry topic, sampai mengubur pesan bermasalah di <b>Dead Letter Topic (DLT)</b> beserta metadata error untuk diperiksa dan di-replay secara terkendali.'
  ],
  objectives: [
    'Mengklasifikasi jenis kegagalan menjadi transient (layak dicoba ulang) dan non-retryable (langsung dikubur ke DLT)',
    'Membandingkan retry langsung dengan backoff eksponensial + jitter serta menentukan batas retry yang wajar',
    'Menjelaskan alur retry topic menuju Dead Letter Topic beserta metadata error yang ikut disimpan',
    'Merancang proses replay manual dan peringatan (alerting) untuk pesan yang terkubur di DLT'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Kegagalan itu pasti — yang penting bagaimana</h3><p>Sebuah pipeline event tidak pernah bebas error selamanya. Yang bisa kamu tentukan adalah apakah kegagalan itu <i>mereda sendiri</i> atau <i>memperparah keadaan</i>. Kuncinya adalah membagi seluruh kemungkinan gagal menjadi dua kelompok besar:</p><table><thead><tr><th>Jenis kegagalan</th><th>Contoh nyata</th><th>Kategori</th></tr></thead><tbody><tr><td>Broker down</td><td>broker mati, leadership partition pindah, ISR mengecil</td><td><b>transient</b></td></tr><tr><td>Network timeout</td><td>koneksi client–broker terputus sesaat, fetch time out</td><td><b>transient</b></td></tr><tr><td>Serialization error</td><td>deserializer tidak memahami bytes yang masuk</td><td>non-retryable</td></tr><tr><td>Payload invalid</td><td>JSON rusak, field wajib kosong, tipe data salah</td><td>non-retryable</td></tr><tr><td>Validasi bisnis gagal</td><td>saldo kurang, stok habis, diskon tidak berlaku</td><td>non-retryable</td></tr><tr><td>DB/API tujuan mati</td><td>PostgreSQL sedang maintenance, API payment 503</td><td><b>transient</b></td></tr><tr><td>Consumer crash</td><td>proses mati di tengah poll, lalu rebalance terjadi</td><td><b>transient</b></td></tr><tr><td>Duplicate event</td><td>event yang sama terproses dua kali setelah retry</td><td>tangani dengan idempotency</td></tr><tr><td>Poison message</td><td>p selalu membuat consumer crash berulang kali</td><td>non-retryable</td></tr></tbody></table><p>Aturan praktisnya: bila <b>kondisi di luar aplikasimu</b> yang bermasalah (jaringan, broker, database tujuan) maka kegagalan itu transient dan layak dicoba ulang. Bila <b>isi pesannya sendiri</b> yang bermasalah, mencoba ulang hanya membuang waktu — pesan itu harus dikirim ke DLT secepatnya.</p>'
    },
    {
      type: 'text',
      html: '<h3>Alur pesan gagal: retry topic lalu Dead Letter Topic</h3><p><b>Dead Letter Topic (DLT)</b>, kadang disebut DLQ (<i>Dead Letter Queue</i>), adalah topic khusus tempat pesan yang sudah gagal berkali-kali dikuburkan, lengkap dengan keterangan kenapa ia gagal. Pesan di DLT tidak hilang: ia tetap tersimpan di log Kafka sehingga bisa diperiksa, diperbaiki penyebabnya, lalu di-replay.</p><p>Pola yang paling umum memakai <b>retry topic</b> sebagai antrean percobaan: consumer utama yang menemukan kegagalan tidak langsung mengulang di memori, melainkan melempar pesan ke topic <code>order-events.retry</code>. Retry topic diproses oleh consumer terpisah dengan jeda yang makin lama; setelah batas percobaan habis, pesan berpindah ke <code>order-events.dlt</code>.</p><figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Alur pesan gagal dari topic utama ke retry topic lalu ke dead letter topic"><rect x="20" y="60" width="150" height="90" rx="10" class="u-box"/><text x="95" y="86" class="u-title" text-anchor="middle">Topic Utama</text><line x1="36" y1="96" x2="154" y2="96" class="u-line"/><text x="95" y="124" class="u-lbl" text-anchor="middle">order-events</text><text x="95" y="142" class="u-lbl" text-anchor="middle">record masuk</text><rect x="210" y="60" width="150" height="90" rx="10" class="u-hd"/><text x="285" y="86" class="u-title" text-anchor="middle">Consumer</text><line x1="226" y1="96" x2="344" y2="96" class="u-line"/><text x="285" y="124" class="u-lbl" text-anchor="middle">proses &amp; gagal</text><text x="285" y="142" class="u-lbl" text-anchor="middle">maks 5 percobaan</text><rect x="400" y="60" width="160" height="90" rx="10" class="u-box"/><text x="480" y="86" class="u-title" text-anchor="middle">Retry Topic</text><line x1="416" y1="96" x2="544" y2="96" class="u-line"/><text x="480" y="124" class="u-lbl" text-anchor="middle">order-events.retry</text><text x="480" y="142" class="u-lbl" text-anchor="middle">backoff eksponensial</text><rect x="600" y="60" width="140" height="90" rx="10" class="u-box"/><text x="670" y="86" class="u-title" text-anchor="middle">Dead Letter</text><line x1="616" y1="96" x2="724" y2="96" class="u-line"/><text x="670" y="124" class="u-lbl" text-anchor="middle">order-events.dlt</text><text x="670" y="142" class="u-lbl" text-anchor="middle">+ alerting</text><line x1="170" y1="105" x2="204" y2="105" class="u-line" marker-end="url(#u-arrow)"/><line x1="360" y1="105" x2="394" y2="105" class="u-line" marker-end="url(#u-arrow)"/><line x1="560" y1="105" x2="594" y2="105" class="u-line" marker-end="url(#u-arrow)"/><rect x="20" y="195" width="720" height="75" rx="10" class="u-box"/><text x="380" y="222" class="u-title" text-anchor="middle">Setelah batas retry habis</text><line x1="36" y1="232" x2="724" y2="232" class="u-line"/><text x="380" y="253" class="u-lbl" text-anchor="middle">pesan + metadata error dikubur ke DLT, lalu diperbaiki &amp; di-replay — urutan bisa berubah</text></svg></div><figcaption>Keterangan singkat figur: pesan gagal melewati retry topic dengan backoff, dan bila tetap gagal ia berhenti di Dead Letter Topic beserta metadata errornya.</figcaption></figure>'
    },
    {
      type: 'example',
      title: 'Jadwal backoff eksponensial + jitter (5 percobaan)',
      lang: 'text',
      output: false,
      code: `LAYANAN: consumer order-events
BASIS 1 detik, multiplier 2, maksimum 60 detik, jitter acak 0-500 ms, batas 5 percobaan

percobaan   jeda sebelumnya   keterangan
    1             -           langsung diproses
    2           1 dtk         1 x 2^0  = 1s  + jitter acak
    3           2 dtk         1 x 2^1  = 2s  + jitter acak
    4           4 dtk         1 x 2^2  = 4s  + jitter acak
    5           8 dtk         1 x 2^3  = 8s  + jitter acak
  masih gagal    -            kirim ke order-events.dlt + alert

RETRY LANGSUNG                   BACKOFF + JITTER + BATAS
-------------------------------   -------------------------------------
gagal -> coba -> gagal -> coba    gagal -> tunggu -> coba -> tunggu -> coba
1.000 pesan gagal = 1.000 hantaman percobaan menyebar, target sempat pulih
menimpa service sekaligus         sebagian besar akhirnya berhasil
target makin down, gagal terus    setelah 5x tetap gagal -> ke DLT`,
      explain: [
        'Baris percobaan menunjukkan jeda yang berlipat ganda: 1, 2, 4, 8 detik. Inilah inti <b>backoff eksponensial</b> — memberi waktu bertambah besar pada setiap kali gagal.',
        '<b>Jitter</b> menambahkan acakan ratusan milidetik pada tiap jeda, sehingga seribu pesan yang gagal bersamaan tidak bangun di detik yang sama (mencegah thundering herd).',
        'Sisi kiri memperlihatkan risiko retry langsung: satu kegagalan beruntun langsung menyerang service yang sedang sekarat. Sisi kanan menunjukkan jalan keluar yang manusiawi, ditutup dengan batas 5 percobaan lalu DLT.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Retry langsung vs backoff, dan kenapa ada retry topic</h3><p><b>Retry langsung</b> berarti begitu proses gagal, ia langsung mengulang di tempat. Untuk gangguan sepersekian detik cara ini terlihat efisien, tetapi begitu penyebabnya bertahan (misal database tujuan benar-benar mati), kamu mendapatkan <i>hot loop</i>: satu pesan diulang ribuan kali per menit, membanjiri log, membebani service yang sudah sakit, dan menahan offset agar tidak maju.</p><p><b>Backoff eksponensial + jitter</b> memperbaiki itu semua: jeda digandakan tiap percobaan (1s, 2s, 4s, 8s, ...) dan diberi acakan, sehingga beban ulang menyebar dan target punya waktu pulih. Namun retry di dalam memori punya masalah lain — consumer tetap memegang pesan itu, dan bila ia ikut crash seluruh percobaan hilang. Di sinilah <b>retry topic</b> berperan: kegagalan ditulis ke topic tersendiri, offset topic utama aman maju, dan pekerjaan ulang dijalankan oleh consumer lain yang memang didedikasikan.</p><ulli></ulli><ul><li><b>Batas retry wajar</b> — antara 3 sampai 10 percobaan dengan total jeda puluhan detik; melebihi itu biasanya berarti masalahnya bukan soal waktu.</li><li><b>Urutan bisa berubah</b> — karena percobaan ulang berjalan lewat topic terpisah, pesan yang tadinya lebih dulu bisa tiba belakangan. Siapkan consumer yang <b>idempoten</b> dan tidak berasumsi urutan antartopik.</li><li><b>Batasi juga per topic retry</b> — beri jumlah partition yang memadai agar satu pesan bermasalah tidak memblokir topic retry seluruhnya.</li></ul>'
    },
    {
      type: 'example',
      title: 'Konfigurasi penanganan error consumer (JSON)',
      lang: 'json',
      output: false,
      code: `{
  "consumer": {
    "topic": "order-events",
    "group.id": "payment-service",
    "enable.auto.commit": "false",
    "max.poll.records": 100
  },
  "retry": {
    "topic": "order-events.retry",
    "maxAttempts": 5,
    "backoff": {
      "initialMs": 1000,
      "multiplier": 2.0,
      "maxMs": 60000,
      "jitterMs": 500
    },
    "nonRetryable": [
      "SerializationException",
      "InvalidPayloadException",
      "BusinessRuleException"
    ]
  },
  "dlt": {
    "topic": "order-events.dlt",
    "headers": [
      "dlt-exception-class",
      "dlt-exception-message",
      "dlt-original-topic",
      "dlt-original-timestamp",
      "dlt-attempts"
    ]
  },
  "alerting": {
    "channel": "#ops-alerts",
    "warnIfDepth": 10,
    "pageIfDepth": 100
  }
}`,
      explain: [
        'Bagian <code>retry</code> menyimpan jadwal backoff (mulai 1 detik, digandakan, maksimum 60 detik) dan <b>daftar exception non-retryable</b> yang langsung dilempar ke DLT tanpa percobaan ulang — ini yang mencegah pemborosan waktu untuk pesan yang memang tidak akan pernah berhasil.',
        'Bagian <code>dlt.headers</code> adalah <b>metadata error</b>: kelas exception, pesannya, topic asal, timestamp kejadian, dan jumlah percobaan. Semua itu ikut menempel pada pesan sehingga penyebab kegagalan bisa dibaca tanpa menelusuri log.',
        '<code>enable.auto.commit: false</code> memastikan offset hanya maju setelah pemrosesan (atau penguburan ke DLT) benar-benar selesai, sehingga pesan tidak pernah hilang di tengah jalan.',
        'Bagian <code>alerting</code> mengubah DLT dari tempat pembuangan diam-diam menjadi sistem peringatan: kedalaman yang meledak berarti ada yang salah dan harus segera ditangani.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Metadata error, replay manual, dan alerting</h3><p>DLT yang baik bukan sekadar tempat sampah. Setiap pesan yang masuk ke sana harus membawa identitas lengkapnya agar bisa ditindaklanjuti:</p><ul><li><b>Topic asal</b> — dari topic mana pesan ini berasal, sehingga replay mengembalikannya ke tempat yang benar.</li><li><b>Exception (kelas &amp; pesan)</b> — penyebab kegagalan dalam bentuk yang langsung bisa dicari.</li><li><b>Timestamp</b> — kapan kejadian terjadi, untuk mengukur lamanya masalah berlangsung.</li><li><b>Jumlah percobaan &amp; consumer</b> — berapa kali diulang dan siapa yang menyerah.</li><li><b>Payload asli utuh</b> — jangan pernah membuang badan pesan; hanya menambah header.</li></ul><p>Perbaikan selesai, tibalah giliran <b>replay</b>: baca pesan dari DLT, perbaiki (atau biarkan begitu saja bila memang hanya gangguan sesaat), lalu produksikan ulang ke topic asal. Lakukan dengan script terkendali — sebagian dulu (seeding), pantau hasilnya, baru seluruh isi DLT. Selama proses replay, consumer tujuan harus <b>idempoten</b> karena sebagian pesan mungkin sudah terlanjur diproses.</p><p>Terakhir, <b>alerting</b>. Kedalaman DLT yang mendadak naik dari 0 menjadi ratusan adalah gejala paling jujur dari kegagalan sistemik: skema berubah tidak kompatibel, dependency tujuan mati, atau ada bug baru di consumer. Pantau lag topic utama <i>dan</i> ukuran DLT bersamaan — keduanya adalah tanda vital pipeline-mu.</p>'
    },
    {
      type: 'warn',
      title: 'Poison message &amp; pesan yang menggantung',
      text: '<ul><li><b>Jangan retry tanpa batas.</b> Satu pesan rusak yang diulang selamanya akan memblokir consumer dan menahan seluruh partition di belakangnya.</li><li><b>Jangan commit offset sebelum selesai.</b> Commit lebih dulu lalu gagal berarti pesan hilang (at-most-once) — kegagalan yang jauh lebih mahal daripada duplikat.</li><li><b>Jangan menghapus payload di DLT.</b> Metadata boleh ditambahkan, tetapi badan pesan wajib utuh agar bisa di-replay.</li><li><b>Jangan menganggap urutan tetap utuh.</b> Setelah melewati retry topic, urutan antarpesan bisa berubah; andalkan idempotency, bukan asumsi urutan.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Mulai dari yang sederhana',
      text: '<p>Untuk sistem baru, cukup dua topic per topik bisnis: <code>order-events</code> dan <code>order-events.dlt</code>, dengan retry in-process berbatas (misal 3 kali backoff). Tambahkan <b>retry topic</b> hanya ketika memang ada dependency lambat yang sering tersendat. Kompleksitas penanganan error yang terlalu dini justru membuat pipeline sulit dipahami saat terjadi insiden nyata.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Transient failure', 'Kegagalan sementara akibat kondisi luar (jaringan, broker, database tujuan) yang layak dicoba ulang.'],
        ['Non-retryable error', 'Kegagalan permanen akibat isi pesan atau aturan bisnis; ulangan tidak akan pernah berhasil, langsung ke DLT.'],
        ['Backoff eksponensial', 'Strategi menunda percobaan ulang yang digandakan tiap kali (1s, 2s, 4s, 8s, ...) agar memberi waktu sistem pulih.'],
        ['Jitter', 'Acakan kecil pada jeda retry agar banyak pesan gagal tidak bangun bersamaan dan menyerang target serentak.'],
        ['Retry topic', 'Topic terpisah yang menampung pesan gagal untuk diproses ulang oleh consumer khusus dengan jadwal backoff.'],
        ['Dead Letter Topic (DLQ)', 'Topic tujuan akhir pesan yang sudah menyerah; menyimpan payload utuh plus metadata error untuk diagnosis dan replay.'],
        ['Poison message', 'Pesan yang selalu membuat pemrosesan gagal atau crash, sehingga wajib diisolasi agar tidak memblokir partition.'],
        ['Replay', 'Tindakan memutar ulang pesan dari DLT atau offset tertentu kembali ke topic asal secara terkendali.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Kelompokkan 8 kegagalan berikut ke dalam transient dan non-retryable: disk broker penuh, JSON tidak valid, timeout ke PostgreSQL, saldo tidak cukup, deserializer gagal, API shipping 503, duplikat event, payload terpotong. Jelaskan alasan pemilihanmu dalam satu kalimat per kategori.</li><li>Hitung total waktu percobaan dengan backoff eksponensial: basis 2 detik, multiplier 2, maksimum 30 detik, batas 6 percobaan. Kapan tepatnya pesan dikirim ke DLT?</li><li>Susun daftar header yang harus kamu tempel pada pesan DLT untuk sistem payment-mu, lalu tuliskan langkah-langkah replay dari DLT kembali ke topic asal beserta risiko duplikasi yang mungkin muncul.</li></ol>'
    }
  ],
  recap: [
    'Kegagalan dibedakan menjadi transient (broker down, timeout, DB tujuan mati) yang layak di-retry, dan non-retryable (payload invalid, validasi bisnis gagal) yang langsung dikirim ke DLT.',
    'Retry langsung memicu hot loop dan thundering herd; backoff eksponensial + jitter menyebar beban dan memberi waktu pulih, selalu dengan batas percobaan yang jelas.',
    'Retry topic memindahkan pekerjaan ulang ke antrean terpisah sehingga consumer utama tidak tersendat — konsekuensinya urutan pemrosesan bisa berubah dan consumer wajib idempoten.',
    'DLT menyimpan pesan gagal beserta metadata (topic asal, exception, timestamp, jumlah percobaan) untuk diagnosis, perbaikan, lalu replay terkendali dan alerting.'
  ]
});
