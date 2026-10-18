/* ============================================================
   Pelajaran RabbitMQ — Bab 3: Arsitektur & Komponen Dasar
   ============================================================ */
'use strict';

window.RABBITMQ_LESSONS = window.RABBITMQ_LESSONS || [];

window.RABBITMQ_LESSONS.push({
  id: 'arsitektur-dasar',
  title: 'Arsitektur: Producer, Exchange, Queue, Consumer',
  chapter: 'Arsitektur',
  duration: '8–10 menit',
  intro: [
    'Setiap kali kamu mengirim pesan ke RabbitMQ, ada enam tokoh yang terlibat: <b>Producer</b>, <b>Exchange</b>, <b>Binding</b>, <b>Binding Key</b>, <b>Routing Key</b>, dan <b>Consumer</b>. Salah satu salah paham paling umum adalah mengira pesan langsung dari producer ke queue — padahal jalurnya selalu melewati exchange lebih dahulu.',
    'Bab ini membedah peran masing-masing komponen, alur lengkap satu pesan dari kode producer sampai ke tangan consumer, serta memperkenalkan dua alat manajemen harian: <code>rabbitmqctl</code> untuk pengelolaan node dan <code>rabbitmqadmin</code> untuk tindakan cepat lewat HTTP API.',
    'Pemahaman bab ini menjadi dasar seluruh bab berikutnya: tipe-tipe exchange pada Phase 3 hanyalah variasi aturan routing, dan keandalan pesan pada Phase 4 adalah soal bagaimana tangan terakhir menangani pesan yang diterimanya.'
  ],
  objectives: [
    'Menjelaskan peran keenam komponen inti RabbitMQ beserta hubungannya',
    'Melacak alur satu pesan dari producer sampai consumer termasuk peran binding',
    'Membedakan routing key, binding key, dan nama queue agar tidak tertukar',
    'Memakai rabbitmqctl dan rabbitmqadmin untuk memeriksa isi broker'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Enam Komponen Inti</h3><ul><li><b>Producer / Publisher</b> — aplikasi pengirim pesan. Ia tidak mengirim pesan ke queue, melainkan ke exchange, lengkap dengan <i>routing key</i>.</li><li><b>Exchange</b> — komponen penerima pesan dari producer yang menerapkan aturan routing: ke queue mana pesan ini layak dikirim?</li><li><b>Queue</b> — buffer yang menyimpan pesan sampai ada consumer yang siap memprosesnya. Inilah satu-satunya tempat pesan benar-benar <i>tinggal</i>.</li><li><b>Binding</b> — tali penghubung antara exchange dan queue, ibarat formulir pendaftaran: "queue ini mau menerima pesan dari exchange itu dengan syarat begini".</li><li><b>Routing Key</b> — label yang ditempelkan <b>producer</b> pada tiap pesan (misalnya <code>order.created</code>).</li><li><b>Consumer</b> — aplikasi penerima yang membaca pesan dari queue lalu memprosesnya.</li></ul><p>Dua istilah yang sering tertukar: <b>binding key</b> adalah syarat yang ditulis saat <i>mendaftarkan</i> binding, sedangkan <b>routing key</b> adalah label yang dibawa <i>tiap pesan</i>. Exchange membandingkan keduanya — kecocokannya persis inilah yang menentukan jalannya pesan.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 320" width="760" role="img" aria-label="Alur pesan RabbitMQ dari producer ke exchange lalu lewat binding ke dua queue dan dua consumer">
        <rect x="20" y="120" width="120" height="60" rx="8" class="u-hd"/>
        <text x="80" y="146" class="u-title" text-anchor="middle">Producer</text>
        <text x="80" y="166" class="u-lbl" text-anchor="middle">routing key: order.created</text>
        <line x1="144" y1="150" x2="226" y2="150" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="185" y="140" class="u-lbl" text-anchor="middle">publish</text>

        <rect x="230" y="110" width="150" height="80" rx="8" class="u-box"/>
        <text x="305" y="138" class="u-title" text-anchor="middle">Exchange</text>
        <text x="305" y="160" class="u-lbl" text-anchor="middle">terapkan aturan routing</text>
        <text x="305" y="178" class="u-lbl" text-anchor="middle">cocokkan routing key</text>

        <line x1="384" y1="130" x2="476" y2="86" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="384" y1="170" x2="476" y2="214" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="440" y="96" class="u-lbl" text-anchor="middle">binding: order.#</text>
        <text x="440" y="218" class="u-lbl" text-anchor="middle">binding: audit.*</text>

        <rect x="480" y="50" width="140" height="66" rx="8" class="u-hd"/>
        <text x="550" y="76" class="u-title" text-anchor="middle">Queue: orders</text>
        <text x="550" y="98" class="u-lbl" text-anchor="middle">mengantre sampai dibaca</text>
        <rect x="480" y="184" width="140" height="66" rx="8" class="u-box"/>
        <text x="550" y="210" class="u-title" text-anchor="middle">Queue: audit-log</text>
        <text x="550" y="232" class="u-lbl" text-anchor="middle">salinan untuk audit</text>

        <line x1="624" y1="83" x2="676" y2="83" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="624" y1="217" x2="676" y2="217" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="680" y="56" width="66" height="54" rx="6" class="u-box"/>
        <text x="713" y="86" class="u-lbl" text-anchor="middle">Consumer</text>
        <rect x="680" y="190" width="66" height="54" rx="6" class="u-box"/>
        <text x="713" y="220" class="u-lbl" text-anchor="middle">Consumer</text>

        <text x="380" y="290" class="u-lbl" text-anchor="middle">Pesan selalu masuk lewat exchange — queue hanya menerima bila ada binding yang cocok</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 3.1</b> — Alur satu pesan: producer → exchange → binding → queue → consumer</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Alur Lengkap Satu Pesan</h3><p>Mari telusuri langkah demi langkah apa yang benar-benar terjadi ketika aplikasi pesanan menerbitkan satu pesan:</p><ol><li>Producer membuka koneksi ke broker lalu membuat <b>channel</b> — jalur logis tempat seluruh operasi berjalan.</li><li>Producer mengirim pesan ke sebuah exchange, membawa <b>routing key</b> <code>order.created</code>.</li><li>Exchange memeriksa seluruh <b>binding</b> yang menempel padanya lalu membandingkan binding key dengan routing key.</li><li>Bila cocok, pesan disalin ke queue yang bersangkutan; bila tidak ada yang cocok, keputusan bergantung pada tipe exchange — bisa dibuang, bisa dialihkan.</li><li>Pesan menumpuk di queue menunggu consumer.</li><li>Consumer mengambil pesan, memproses, lalu mengirim <b>ACK</b> sebagai tanda selesai. Barulah pesan dihapus dari queue.</li></ol><p>Perhatikan: langkah 3 adalah jantung RabbitMQ. Seluruh variasi pada bab berikutnya (direct, fanout, topic, headers) hanyalah cara exchange membandingkan kunci di langkah itu.</p>'
    },
    {
      type: 'example',
      title: 'Empat Kunci yang Sering Tertukar',
      lang: 'text',
      output: false,
      code: `Nama queue    "orders"          nama antrean, hanya tempat penyimpanan
Routing key   "order.created"   label pada SETIAP pesan, dibawa producer
Binding key   "order.#"         syarat pada binding, ditulis saat daftar
Exchange      "e-orders"        penerima pesan, pemegang aturan routing

Cocok? routing key "order.created"  vs binding key "order.#"  → YA (pola #)
Cocok? routing key "user.login"     vs binding key "order.#"  → TIDAK`,
      explain: [
        'Pola <code>#</code> dan <code>*</code> hanya berlaku pada <b>topic exchange</b>; pada direct exchange kecocokan harus persis sama (exact match).',
        'Routing key ada pada <b>setiap pesan</b>, sedangkan binding key ada pada <b>setiap relasi exchange-queue</b>. Satu queue bisa punya banyak binding dari banyak exchange.',
        'Nama queue tidak ikut menentukan routing (kecuali lewat default exchange yang dibahas di bab berikutnya) — yang menentukan adalah kecocokan kunci pada exchange.'
      ]
    },
    {
      type: 'example',
      title: 'Memeriksa Isi Broker dengan rabbitmqctl',
      lang: 'bash',
      output: false,
      code: `# Ringkasan seluruh isi broker
podman exec rabbitmq-server rabbitmqctl list_queues name messages consumers
podman exec rabbitmq-server rabbitmqctl list_exchanges name type
podman exec rabbitmq-server rabbitmqctl list_bindings source_name destination_name

# Detail satu queue: argumen, tipe, jumlah pesan ready/unacked
podman exec rabbitmq-server rabbitmqctl list_queues name messages messages_ready \\
  messages_unacknowledged consumers

# Hapus queue latihan agar bersih
podman exec rabbitmq-server rabbitmqctl delete_queue name=orders`,
      explain: [
        '<code>list_queues</code> menampilkan dua angka penting: <b>messages</b> (total) dan <b>consumers</b> (siapa yang menunggu). Bila consumers 0 dan messages terus naik, tidak ada yang memproses.',
        '<code>list_bindings</code> adalah cara cepat menjawab "kenapa pesan ini sampai ke queue itu?" — lihat kolom <code>source_name</code> (exchange) dan <code>binding_key</code>-nya.',
        'Semua perintah berjalan di dalam container; ganti nama container bila kamu memakai nama lain.'
      ]
    },
    {
      type: 'example',
      title: 'Tindakan Cepat dengan rabbitmqadmin',
      lang: 'bash',
      output: false,
      code: `# rabbitmqadmin tersedia DI DALAM container (management plugin)
alias rmq='podman exec -i rabbitmq-server rabbitmqadmin'

# Buat queue
rmq declare queue name=orders durable=true

# Kirim pesan
rmq publish routing_key=orders payload='{"id":101,"item":"buku"}'

# Ambil pesan dari antrean
rmq get queue=orders count=1

# Lihat daftar
rmq list queues name messages consumers`,
      explain: [
        '<code>rabbitmqadmin</code> bekerja lewat <b>HTTP API</b> pada port 15672, sehingga cocok untuk skrip dan percobaan cepat tanpa menulis kode klien.',
        'Kata <code>-i</code> pada <code>podman exec</code> membuat input tersambung, karena rabbitmqadmin membaca dan menulis lewat stdin/stdout.',
        'Untuk penggunaan di aplikasi sungguhan, pakailah library klien (amqplib, amqp091-go, amqp-client) — rabbitmqadmin ditujukan untuk administrasi dan uji cepat.'
      ]
    },
    {
      type: 'tip',
      title: 'Urutan Belajar yang Paling Menyatu',
      text: 'Bila ragu mulai dari mana di dashboard, urutannya: buka tab <b>Exchanges</b> untuk melihat aturan, lalu <b>Queues</b> untuk melihat antrean, lalu <b>Bindings</b> untuk melihat penghubungnya. Ketiganya adalah tiga sudut pandang atas satu aliran pesan yang sama — dan persis tiga komponen yang akan kamu mainkan di bab-bab exchange.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Pesan yang dikirim ke exchange <b>tanpa satu pun binding yang cocok</b> akan dibuang diam-diam (kecuali exchange-nya menyediakan alternatif). Bila kamu sudah yakin kode producer sudah benar tetapi queue tetap kosong, periksa <code>list_bindings</code> lebih dahulu — hampir selalu masalahnya ada di binding yang belum dibuat atau kuncinya tidak cocok.'
    },
    {
      type: 'vocab',
      items: [
        ['Producer (Publisher)', 'Aplikasi pengirim pesan; mengirim ke exchange, bukan langsung ke queue.'],
        ['Exchange', 'Komponen penerima pesan dari producer yang menerapkan aturan routing menuju queue.'],
        ['Queue', 'Antrean penyimpan pesan di broker; satu-satunya tempat pesan benar-benar menumpuk.'],
        ['Binding', 'Relasi penghubung exchange ke queue, berisi binding key sebagai syarat kecocokan.'],
        ['Routing Key', 'Label pada tiap pesan yang dibawa producer untuk dicocokkan terhadap binding.'],
        ['Binding Key', 'Kunci pada binding yang menentukan pesan mana yang layak diteruskan ke queue.'],
        ['Channel', 'Jalur logis di dalam satu koneksi AMQP; seluruh operasi publish/consume berjalan di channel.'],
        ['Consumer', 'Aplikasi yang membaca pesan dari queue, memprosesnya, lalu mengirim ACK.']
      ]
    }
  ],
  recap: [
    'Pesan tidak pernah langsung masuk queue: selalu melewati exchange lebih dahulu, lalu diarahkan lewat binding.',
    'Enam komponen inti: producer, exchange, queue, binding, routing key (dibawa tiap pesan), dan consumer.',
    'Routing key dibawa producer pada setiap pesan; binding key ditulis saat menghubungkan exchange ke queue; keduanya dibandingkan oleh exchange.',
    'rabbitmqctl (list_queues, list_exchanges, list_bindings) memeriksa isi broker, sedangkan rabbitmqadmin memberi cara cepat mendeklarasikan queue, menerbitkan, dan mengambil pesan.'
  ]
});
