/* ============================================================
   Pelajaran RabbitMQ — Bab 4: Default Exchange & Direct Exchange
   ============================================================ */
'use strict';

window.RABBITMQ_LESSONS = window.RABBITMQ_LESSONS || [];

window.RABBITMQ_LESSONS.push({
  id: 'exchange-default-direct',
  title: 'Default Exchange & Direct Exchange',
  chapter: 'Exchange & Routing',
  duration: '8–10 menit',
  intro: [
    'Setiap pesan yang kamu kirim ke RabbitMQ pasti melewati exchange — tidak ada pengecualian. Yang mungkin tidak kamu sadari: ketika kode producer terlihat "langsung mengirim ke queue", sebenarnya ia memakai <b>default exchange</b> yang tersembunyi.',
    'Bab ini membahas dua exchange paling sering dipakai. <b>Default exchange</b> (tanpa nama) merutekan pesan murni berdasarkan nama queue. <b>Direct exchange</b> mengirim pesan hanya ke queue yang binding key-nya <b>persis sama</b> dengan routing key pesan.',
    'Keduanya menjadi basis studi kasus sistem notifikasi: notifikasi email, SMS, dan push yang masing-masing menerima hanya pesan yang benar-benar menjadi bagiannya.'
  ],
  objectives: [
    'Memahami cara kerja default exchange (nameless) yang memakai nama queue sebagai kuncinya',
    'Menerapkan direct exchange dengan aturan exact match pada binding key',
    'Membuat dan menguji sendiri exchange, queue, dan binding lewat rabbitmqadmin',
    'Menjelaskan studi kasus notifikasi multi-kanal dengan direct exchange'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Default Exchange: Exchange Tersembunyi</h3><p>Setiap broker memiliki satu exchange bawaan bernama <b>kosong</b> (string kosong) dengan tipe <code>direct</code>. Sifat khususnya: ia <b>selalu mengirim pesan ke queue yang namanya sama persis dengan routing key</b>.</p><p>Itulah sebabnya kode sederhana sering terlihat "langsung ke queue":</p><pre><code>channel.sendToQueue("orders", Buffer.from("payload"))</code></pre><p>Sebenarnya perintah itu mengirim pesan ke default exchange dengan routing key <code>orders</code>, dan karena default exchange mengarah ke nama queue, pesan mendarat di queue <code>orders</code>. Praktiknya: bila kamu hanya butuh satu antrean tanpa aturan routing, kirim lewat <code>sendToQueue</code> atau publish ke default exchange — cepat, ringkas, tanpa konfigurasi.</p>'
    },
    {
      type: 'text',
      html: '<h3>Direct Exchange: Kocokan Persis</h3><p>Direct exchange adalah tipe paling banyak dipakai (dan menjadi default ketika kamu membuat exchange baru tanpa menyebut tipe). Aturannya sederhana dan keras kepala: <b>routing key pesan harus sama persis dengan binding key</b> — bukan pola, bukan sebagian, tetapi identik.</p><p>Satu direct exchange boleh punya banyak queue, masing-masing dengan binding key berbeda. Ketika pesan datang, exchange mencocokkan lalu mengirim hanya ke queue yang cocok. Bila ada dua queue dengan binding key yang sama, keduanya akan menerima salinan — kecocokan ganda tetap mungkin.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Direct exchange mengirim pesan hanya ke queue yang binding key-nya persis sama dengan routing key">
        <rect x="20" y="120" width="120" height="56" rx="8" class="u-hd"/>
        <text x="80" y="146" class="u-title" text-anchor="middle">Producer</text>
        <text x="80" y="164" class="u-lbl" text-anchor="middle">rk: notify.sms</text>
        <line x1="144" y1="148" x2="236" y2="148" class="u-line" marker-end="url(#u-arrow)"/>

        <rect x="240" y="110" width="150" height="76" rx="8" class="u-box"/>
        <text x="315" y="140" class="u-title" text-anchor="middle">Exchange: e-notify</text>
        <text x="315" y="164" class="u-lbl" text-anchor="middle">tipe: direct (exact match)</text>

        <line x1="394" y1="126" x2="486" y2="70" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="394" y1="148" x2="486" y2="148" class="u-dash"/>
        <line x1="394" y1="172" x2="486" y2="230" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="452" y="74" class="u-lbl" text-anchor="middle">notify.email</text>
        <text x="452" y="236" class="u-lbl" text-anchor="middle">notify.sms</text>

        <rect x="490" y="40" width="150" height="56" rx="8" class="u-box"/>
        <text x="565" y="64" class="u-title" text-anchor="middle">Queue: q-email</text>
        <text x="565" y="84" class="u-lbl" text-anchor="middle">binding notify.email</text>
        <rect x="490" y="120" width="150" height="56" rx="8" class="u-box"/>
        <text x="565" y="144" class="u-title" text-anchor="middle">Queue: q-push</text>
        <text x="565" y="164" class="u-lbl" text-anchor="middle">binding notify.push</text>
        <rect x="490" y="202" width="150" height="56" rx="8" class="u-hd"/>
        <text x="565" y="226" class="u-title" text-anchor="middle">Queue: q-sms</text>
        <text x="565" y="246" class="u-lbl" text-anchor="middle">binding notify.sms ✓</text>

        <rect x="660" y="120" width="86" height="56" rx="6" class="u-box"/>
        <text x="703" y="152" class="u-lbl" text-anchor="middle">Consumer</text>
        <line x1="644" y1="148" x2="656" y2="148" class="u-line" marker-end="url(#u-arrow)"/>

        <text x="380" y="284" class="u-lbl" text-anchor="middle">Hanya notify.sms yang cocok — q-email dan q-push tidak menerima apa-apa</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 4.1</b> — Direct exchange: pesan dengan routing key notify.sms hanya sampai ke q-sms</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Membuat Exchange, Queue, dan Binding (rabbitmqadmin)',
      lang: 'bash',
      output: false,
      code: `alias rmq='podman exec -i rabbitmq-server rabbitmqadmin'

# 1. Exchange direct yang tahan restart (durable)
rmq declare exchange name=e-notify type=direct durable=true

# 2. Queue-nya
rmq declare queue name=q-email durable=true
rmq declare queue name=q-sms   durable=true
rmq declare queue name=q-push  durable=true

# 3. Binding: syarat kecocokan tiap queue
rmq declare binding source=e-notify destination=q-email  routing_key=notify.email
rmq declare binding source=e-notify destination=q-sms    routing_key=notify.sms
rmq declare binding source=e-notify destination=q-push   routing_key=notify.push

# 4. Kirim dua pesan: satu untuk SMS, satu untuk email
rmq publish exchange=e-notify routing_key=notify.sms  payload='halo via SMS'
rmq publish exchange=e-notify routing_key=notify.email payload='halo via email'

# 5. Buktikan hanya q-sms dan q-email yang menerima
rmq list queues name messages`,
      explain: [
        'Langkah 1–3 bersifat <b>satu kali</b> (idempoten): mendeklarasikan ulang dengan properti sama tidak menyebabkan error, sehingga aman dijalankan berulang.',
        'Pada langkah 5, queue <code>q-push</code> seharusnya tetap 0 pesan — pesan bertanda <code>notify.push</code> tidak pernah dikirim, dan pesan lain tidak cocok dengannya.',
        'Properti <code>durable=true</code> membuat exchange dan queue tetap ada setelah broker restart; ini dibahas tuntas pada bab Durability &amp; Persistence.'
      ]
    },
    {
      type: 'example',
      title: 'Skenario Sistem Notifikasi dengan Direct Exchange',
      lang: 'text',
      output: false,
      code: `Peristiwa "user mendaftar" menghasilkan 3 pesan:
  exchange e-notify (direct)
  ├── routing_key = notify.email   → queue q-email   → kirim surel
  ├── routing_key = notify.sms     → queue q-sms     → kirim SMS
  └── routing_key = notify.push    → queue q-push    → kirim push notification

Menambah kanal baru (mis. WhatsApp):
  cukup tambah 1 binding baru → TIDAK mengubah kode producer maupun consumer

Gagal mengirim SMS?  → pesan di q-sms tetap ada, consumer SMS bisa diperbaiki
                       tanpa mengganggu email dan push`,
      explain: [
        'Studi kasus ini memperlihatkan <b>decoupling</b> yang sesungguhnya: producer cukup tahu nama exchange dan kunci, tidak perlu tahu berapa banyak kanal yang ada.',
        'Menambah kanal = menambah binding saja. Tidak ada kode producer yang diubah, tidak ada downtime.',
        'Kegagalan satu kanal terisolasi di queue-nya sendiri — persis manfaat yang dijanjikan message broker pada bab pengantar.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Memilih di Antara Keduanya</h3><table><thead><tr><th>Kebutuhan</th><th>Pakai</th></tr></thead><tbody><tr><td>Satu antrean, tanpa aturan, dikonsumsi satu pihak</td><td>Default exchange (<code>sendToQueue</code>)</td></tr><tr><td>Banyak antrean, tiap antrean menerima jenis pesan tertentu</td><td>Direct exchange + binding key berbeda</td></tr><tr><td>Satu pesan harus sampai ke SEMUA antrean</td><td>Fanout (bab berikutnya)</td></tr><tr><td>Cocok berdasarkan pola bertingkat (<code>app.*.error</code>)</td><td>Topic (bab berikutnya)</td></tr></tbody></table><p>Direct exchange menjadi pilihan default karena paling dapat diprediksi: tidak ada kejutan, tidak ada pesan "nyasar" ke pihak yang tidak berkepentingan.</p>'
    },
    {
      type: 'tip',
      title: 'Verifikasi Cepat Tanpa Kode',
      text: 'Setelah publish, buka dashboard → tab <b>Queues</b> → lihat kolom <b>Ready</b>. Angka bertambah berarti routing bekerja. Selanjutnya klik nama queue → tab <b>Get messages</b> → <i>Get one or more messages</i> untuk membaca isinya langsung dari dashboard — cara tercepat menguji aturan routing sebelum menulis consumer sungguhan.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Direct exchange yang tidak punya binding apa pun akan <b>membuang pesan diam-diam</b>. Begitu pula routing key yang salah ketik — tidak ada error, tidak ada peringatan, pesan hilang begitu saja. Biasakan memeriksa <code>list_bindings</code> dan angka <b>Ready</b> di dashboard sebelum menyimpulkan consumer-nya yang bermasalah.'
    },
    {
      type: 'vocab',
      items: [
        ['Default exchange', 'Exchange bawaan bernama kosong bertipe direct; selalu mengirim ke queue sesuai nama (routing key = nama queue).'],
        ['Direct exchange', 'Tipe exchange yang mengirim pesan hanya ke queue dengan binding key persis sama dengan routing key.'],
        ['Exact match', 'Kecocokan persis tanpa pola — aturan utama direct exchange.'],
        ['sendToQueue', 'Operasi klien yang menerbitkan pesan ke default exchange menuju satu nama queue.'],
        ['Durable', 'Sifat exchange/queue yang tetap tersimpan walau broker dimatikan.'],
        ['Binding key', 'Kunci yang didaftarkan pada binding; syarat yang dibandingkan terhadap routing key.'],
        ['Notification fan-out', 'Pola menyebarkan satu peristiwa ke banyak kanal lewat banyak binding terpisah.']
      ]
    }
  ],
  recap: [
    'Default exchange bernama kosong, bertipe direct, dan selalu mengirim pesan ke queue yang namanya sama dengan routing key.',
    'Direct exchange mengirim hanya ke queue yang binding key-nya persis sama dengan routing key pesan (exact match).',
    'Satu direct exchange bisa melayani banyak kanal sekaligus — menambah kanal cukup dengan menambah binding.',
    'Pesan tanpa binding yang cocok akan dibuang diam-diam; selalu periksa binding dan angka Ready di dashboard saat routing tidak seperti harapan.'
  ]
});
