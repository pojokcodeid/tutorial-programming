/* ============================================================
   Pelajaran RabbitMQ — Bab 1: Pengantar Message Broker & AMQP
   ============================================================ */
'use strict';

window.RABBITMQ_LESSONS = window.RABBITMQ_LESSONS || [];

window.RABBITMQ_LESSONS.push({
  id: 'pengantar-broker',
  title: 'Pengantar Message Broker & Protokol AMQP',
  chapter: 'Pengenalan',
  duration: '8–10 menit',
  intro: [
    'Bayangkan aplikasi pesan antar kota: pengirim cukup menyerahkan paket ke kantor pos, tidak perlu tahu siapa kurirnya, di mana truknya, atau kapan paket itu berangkat. <b>Message broker</b> bekerja persis seperti kantor pos itu — sebuah perantara yang menerima pesan, menaruhnya di tempat yang tepat, lalu menyerahkannya kepada penerima.',
    'Tanpa broker, dua layanan terikat langsung: layanan pengirim harus tahu alamat penerima, menunggu balasan, dan ikut gagal bila penerima sedang sibuk atau mati. Dengan broker, keduanya hanya perlu berurusan dengan satu pihak yang selalu siap, sehingga sistem jauh lebih tahan banting saat trafik melonjak atau salah satu komponen sedang diperbaiki.',
    'Bab ini membangun fondasi: perbedaan komunikasi sinkron vs asinkron, kapan message broker benar-benar dibutuhkan, perbandingan singkat RabbitMQ dengan Apache Kafka dan Redis Pub/Sub, serta protokol <b>AMQP 0-9-1</b> yang menjadi bahasa utama RabbitMQ.'
  ],
  objectives: [
    'Membedakan komunikasi sinkron (HTTP/REST, gRPC) dengan asinkron berbasis pesan',
    'Menjelaskan tiga alasan utama memakai message broker: decoupling, pemrosesan asinkron, dan penyeimbangan beban',
    'Membandingkan RabbitMQ, Apache Kafka, dan Redis Pub/Sub secara singkat',
    'Memahami peran protokol AMQP 0-9-1 sebagai dasar cara kerja RabbitMQ'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Komunikasi Sinkron: Satu Menunggu yang Lain</h3><p>Pada komunikasi <b>sinkron</b>, pengirim mengirim permintaan lalu <b>menunggu jawaban</b> sampai permintaan itu selesai. HTTP/REST dan gRPC adalah dua contoh paling umum. Cara ini sederhana dan mudah dipahami, tetapi memiliki beberapa sifat yang perlu disadari:</p><ul><li><b>Berurutan dan menunggu</b> — koneksi tetap terbuka selama penerima memproses; bila penerima lambat, pengirim ikut menunggu.</li><li><b>Saling tahu alamat</b> — pengirim harus tahu URL layanan penerima, port, dan format datanya.</li><li><b>Gagal bersama</b> — bila penerima mati atau penuh, permintaan ditolak dan pengirim harus mengulang sendiri.</li></ul><p>Sinkron tetap pilihan terbaik untuk permintaan yang butuh jawaban seketika: menampilkan profil pengguna, mengecek saldo, atau memvalidasi token. Masalah muncul ketika pekerjaannya berat dan tidak butuh jawaban seketika — misalnya mengirim surel ratusan ribu, memproses video, atau membuat laporan.</p>'
    },
    {
      type: 'text',
      html: '<h3>Komunikasi Asinkron dengan Message Broker</h3><p>Pada komunikasi <b>asinkron</b>, pengirim cukup <b>menyerahkan pesan</b> lalu lanjut bekerja; pemrosesan diserahkan kepada pihak lain dan hasilnya bisa diketahui kapan saja. Message broker adalah perantara yang memegang pesan itu.</p><p>Tiga peran inti sebuah message broker:</p><ul><li><b>Antre (queue)</b> — pesan disimpan dengan aman sampai ada yang siap memprosesnya, sehingga lonjakan trafik tidak langsung menimpa penerima.</li><li><b>Routing</b> — broker menentukan ke mana pesan dikirim berdasarkan aturan yang kamu tetapkan.</li><li><b>Melepas ketika siap</b> — pesan diserahkan ketika consumer benar-benar siap, bukan ketika pengirim mengirim.</li></ul><p>Konsep ini disebut <b>decoupling</b>: pengirim dan penerima tidak lagi saling kenal, tidak menunggu, dan bisa tumbuh atau diperbaiki secara terpisah.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Perbandingan komunikasi sinkron langsung dengan komunikasi asinkron melalui message broker">
        <rect x="20" y="30" width="330" height="110" rx="10" class="u-box"/>
        <text x="185" y="54" class="u-title" text-anchor="middle">Sinkron (HTTP / gRPC)</text>
        <line x1="36" y1="64" x2="334" y2="64" class="u-line"/>
        <rect x="36" y="80" width="110" height="42" rx="6" class="u-hd"/>
        <text x="91" y="106" class="u-lbl" text-anchor="middle">Pengirim</text>
        <rect x="224" y="80" width="110" height="42" rx="6" class="u-box"/>
        <text x="279" y="106" class="u-lbl" text-anchor="middle">Penerima</text>
        <line x1="150" y1="92" x2="218" y2="92" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="218" y1="110" x2="150" y2="110" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="184" y="150" class="u-lbl" text-anchor="middle">kirim → menunggu jawaban</text>

        <rect x="410" y="30" width="330" height="110" rx="10" class="u-box"/>
        <text x="575" y="54" class="u-title" text-anchor="middle">Asinkron (Message Broker)</text>
        <line x1="426" y1="64" x2="724" y2="64" class="u-line"/>
        <rect x="426" y="80" width="90" height="42" rx="6" class="u-hd"/>
        <text x="471" y="106" class="u-lbl" text-anchor="middle">Producer</text>
        <rect x="540" y="80" width="90" height="42" rx="6" class="u-box"/>
        <text x="585" y="106" class="u-lbl" text-anchor="middle">Broker</text>
        <rect x="654" y="80" width="90" height="42" rx="6" class="u-hd"/>
        <text x="699" y="106" class="u-lbl" text-anchor="middle">Consumer</text>
        <line x1="518" y1="92" x2="534" y2="92" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="632" y1="92" x2="648" y2="92" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="575" y="150" class="u-lbl" text-anchor="middle">kirim → lanjut → diproses belakangan</text>

        <rect x="20" y="185" width="720" height="80" rx="10" class="u-box"/>
        <text x="380" y="212" class="u-title" text-anchor="middle">Hasilnya bagi sistem</text>
        <line x1="36" y1="222" x2="724" y2="222" class="u-line"/>
        <text x="380" y="244" class="u-lbl" text-anchor="middle">pengirim tidak menunggu · penerima boleh mati sebentar · trafik lonjak tetap tertampung di antrean</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 1.1</b> — Sinkron menunggu jawaban langsung; asinkron menyerahkan pesan ke broker lalu melanjutkan pekerjaan</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Dua Skenario: Tanpa Broker vs Dengan Broker',
      lang: 'text',
      output: false,
      code: `TANPA BROKER (langsung)               DENGAN BROKER
---------------------------------     ---------------------------------
API pesan → langsung ke layanan email  API pesan → simpan di antrean → selesai
layanan email penuh? → 503, ulang      layanan email penuh? → pesan tetap aman
layanan email mati? → pesan hilang     layanan email mati? → pesan menunggu
trafik 10x? → pengirim ikut kewalahan trafik 10x? → antrean menampung dulu
kedua layanan wajib sama-sama hidup   keduanya bekerja pada waktunya masing-masing`,
      explain: [
        'Sisi kiri, pengirim menanggung seluruh risiko: bila tujuan sedang sibuk atau mati, ia harus mengulang, mengantre sendiri, dan gagal bersama.',
        'Sisi kanan, broker menjadi bantalan (buffer): pesan yang sudah diterima broker tetap ada walaupun penerima belum siap, sehingga pengirim bisa langsung lanjut.',
        'Perpindahan risiko ini disebut <b>decoupling</b> — dan manfaatnya paling terasa saat trafik melonjak tiba-tiba (misalnya promo atau kampanye).'
      ]
    },
    {
      type: 'text',
      html: '<h3>Kapan Message Broker Dibutuhkan?</h3><p>Broker bukan obat untuk semua masalah. Ada tiga alasan yang benar-benar membenarkan pemakaiannya:</p><ul><li><b>Decoupling</b> — memisahkan layanan agar bisa dikembangkan, diperbaiki, dan diskalakan tanpa saling mengganggu. Konfigurasi satu layanan tidak lagi mengguncang layanan lain.</li><li><b>Pemrosesan asinkron</b> — pekerjaan berat (memproses gambar, mengirim notifikasi massal, membuat laporan) dipindahkan dari jalur permintaan pengguna. Permintaan HTTP balas dalam milidetik, pekerjaan berat berjalan di belakang.</li><li><b>Penyeimbangan beban (spike leveling)</b> — saat trafik melonjak sepuluh kali lipat, antrean menampung pesan lebih dahulu lalu dikonsumsi sesuai kapasitas. Penerima bekerja dengan ritme yang stabil alih-alih kewalahan seketika.</li></ul><p>Selain itu broker sering dipakai untuk <b>batas antar layanan</b> (rate limiting), <b>urutan pekerjaan</b> (task queue), dan <b>penyebaran pesan ke banyak pihak</b> (pub/sub).</p>'
    },
    {
      type: 'text',
      html: '<h3>RabbitMQ vs Apache Kafka vs Redis Pub/Sub</h3><p>Ketiganya mengirim pesan, tetapi dirancang untuk masalah yang berbeda:</p><table><thead><tr><th></th><th>RabbitMQ</th><th>Apache Kafka</th><th>Redis Pub/Sub</th></tr></thead><tbody><tr><td><b>Model utama</b></td><td>Antrean pesan (queuing) dengan routing fleksibel</td><td>Log terdistribusi yang hanya bertambah</td><td>Kirim-lepas (fire and forget)</td></tr><tr><td><b>Konsumsi</b></td><td>Pesan terhapus setelah dibaca</td><td>Pesan tetap ada; bisa dibaca ulang dari offset</td><td>Pesan lewat begitu saja, tak disimpan</td></tr><tr><td><b>Paling cocok</b></td><td>Tugas, notifikasi, RPC, routing kompleks</td><td>Streaming event, log, analitik, replay riwayat</td><td>Pesan singkat, umum, tanpa jaminan</td></tr><tr><td><b>Jaminan</b></td><td>ACK per pesan, persistensi, dead letter</td><td>Ketertiban per partisi, replikasi</td><td>Tanpa jaminan pengiriman</td></tr></tbody></table><p>RabbitMQ dipilih ketika kamu butuh <b>aturan routing yang kaya</b>, <b>jaminan pengiriman per pesan</b>, dan <b>kontrol atas apa yang terjadi bila pemrosesan gagal</b>. Itulah sebabnya materi ini memakai RabbitMQ dari awal sampai akhir.</p>'
    },
    {
      type: 'text',
      html: '<h3>Protokol AMQP 0-9-1</h3><p>RabbitMQ berbicara lewat protokol bernama <b>AMQP</b> (<i>Advanced Message Queuing Protocol</i>), versi <code>0-9-1</code>. Protokol adalah aturan bahasa bersama antara aplikasi (klien) dan broker, sehingga aplikasi apa pun — Node.js, Go, Java, Python — bisa bicara ke RabbitMQ dengan cara yang sama.</p><p>Secara singkat, AMQP 0-9-1 mengatur empat hal:</p><ul><li><b>Koneksi &amp; channel</b> — satu koneksi TCP ke broker, lalu di dalamnya banyak <i>channel</i> (jalur logis) untuk tiap tugas. Channel jauh lebih murah daripada membuka koneksi baru.</li><li><b>Exchange</b> — titik terima pesan dari producer; exchange yang menentukan ke mana pesan dikirim.</li><li><b>Queue &amp; binding</b> — tempat pesan mengantre, dan binding sebagai aturan penghubung exchange ke queue.</li><li><b>ACK</b> — tanda terima dari consumer kepada broker bahwa pesan sudah berhasil diproses.</li></ul><p>Port standarnya <b>5672</b> (dan 5671 untuk TLS). Sisanya akan kamu praktikkan langsung di bab-bab berikutnya.</p>'
    },
    {
      type: 'example',
      title: 'Istilah AMQP yang Akan Sering Dipakai',
      lang: 'text',
      output: false,
      code: `Producer   pengirim pesan (aplikasi yang menerbitkan pesan)
Consumer   penerima pesan (aplikasi yang memproses pesan)
Exchange   penerima pesan dari producer, lalu mengarahkannya ke queue
Queue      antrean tempat pesan disimpan sampai diproses
Binding    aturan penghubung exchange -> queue (pakai binding key)
Routing key label pada pesan yang dicocokkan exchange terhadap binding
Channel    jalur logis di dalam satu koneksi (lebih murah dari koneksi baru)
ACK        tanda terima consumer bahwa pesan sudah berhasil diproses
AMQP 0-9-1 protokol standar yang dipakai RabbitMQ, port default 5672`,
      explain: [
        'Sembilan istilah ini muncul di hampir seluruh bagian materi RabbitMQ; hafalkan sejak sekarang agar penjelasan berikutnya terasa ringan.',
        'Perhatikan hubungannya: producer → <b>exchange</b> → (binding) → <b>queue</b> → consumer. Inilah alur satu pesan di RabbitMQ.',
        'AMQP bersifat terbuka, jadi library klien seperti <code>amqplib</code> (Node.js), <code>amqp091-go</code> (Go), dan <code>amqp-client</code> (Java) memakai konsep yang sama persis.'
      ]
    },
    {
      type: 'tip',
      title: 'Coba Sendiri Nanti',
      text: 'Seluruh materi RabbitMQ di situs ini bisa dipraktikkan gratis di laptop sendiri memakai <b>Podman</b> (rootless, tanpa daemon) dan image resmi <code>rabbitmq:3-management</code>. Siapkan satu perintah di bab berikutnya, lalu kamu sudah bisa bermain-main dengan exchange dan queue sungguhan lewat dashboard web.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Message broker <b>bukan pengganti database</b>. Broker dirancang untuk menyalurkan pesan — bukan menyimpan arsip jangka panjang, bukan menjalankan kueri relasi, dan bukan sumber kebenaran tunggal. Bila data harus bertahan lama dan bisa ditanya dengan banyak cara, tetap pakai database; gunakan broker untuk <b>memindahkan</b> dan <b>menjadwalkan</b> pekerjaan.'
    },
    {
      type: 'vocab',
      items: [
        ['Message Broker', 'Perantara yang menerima, menampung, merutekan, lalu menyerahkan pesan antara pengirim dan penerima.'],
        ['Sinkron', 'Komunikasi di mana pengirim menunggu jawaban selesai — misalnya HTTP/REST dan gRPC.'],
        ['Asinkron', 'Komunikasi di mana pengirim cukup menyerahkan pesan dan lanjut bekerja tanpa menunggu hasil.'],
        ['Decoupling', 'Pemisahan dua layanan agar tidak lagi saling bergantung pada alamat, waktu, dan ketersediaan satu sama lain.'],
        ['Spike leveling', 'Penyeimbangan beban saat trafik melonjak: antrean menampung pesan lalu dikonsumsi sesuai kapasitas.'],
        ['AMQP 0-9-1', 'Protokol terbuka yang menjadi bahasa utama RabbitMQ; port default 5672 (5671 untuk TLS).'],
        ['Fire and forget', 'Gaya kirim pesan tanpa menyimpan dan tanpa menunggu hasil, contohnya Redis Pub/Sub.']
      ]
    }
  ],
  recap: [
    'Komunikasi sinkron menunggu jawaban dan cocok untuk permintaan seketika; komunikasi asinkron menyerahkan pesan ke broker dan cocok untuk pekerjaan berat.',
    'Broker dibutuhkan untuk tiga hal: decoupling antar layanan, pemrosesan asinkron, serta penyeimbangan beban saat trafik melonjak.',
    'RabbitMQ unggul pada routing kompleks dan jaminan pengiriman per pesan; Kafka unggul pada log streaming yang bisa dibaca ulang; Redis Pub/Sub ringan tetapi tanpa jaminan.',
    'AMQP 0-9-1 adalah bahasa RabbitMQ: koneksi berisi channel, pesan masuk ke exchange, diarahkan lewat binding ke queue, lalu dikonsumsi dan di-ACK.'
  ]
});
