/* ============================================================
   Pelajaran RabbitMQ — Bab 7: Durability & Persistence
   ============================================================ */
'use strict';

window.RABBITMQ_LESSONS = window.RABBITMQ_LESSONS || [];

window.RABBITMQ_LESSONS.push({
  id: 'durability-persistence',
  title: 'Durability & Persistence: Pesan yang Tahan Restart',
  chapter: 'Keandalan Pesan',
  duration: '8–10 menit',
  intro: [
    'Pernahkah kamu mengirim pesan, lalu broker dimatikan dan ketika dinyalakan lagi pesan itu lenyap? Kejadian ini hampir selalu disebabkan oleh satu hal: <b>queue dibuat sementara (transient)</b> atau <b>pesannya sendiri tidak ditandai persisten</b>. RabbitMQ tidak mengasal simpan ke disk — menulis ke disk itu mahal, jadi dia hanya melakukannya bila kamu memintanya.',
    'Bab ini membedah dua saklar yang harus sama-sama dinyakinkan: <b>durability</b> pada objek (queue dan exchange tetap ada setelah restart) dan <b>persistence</b> pada pesan (isi pesan ditulis ke disk). Keduanya sering tertukar padahal berbeda objek.',
    'Kamu juga akan mempraktikkan langsung percobaan paling meyakinkan: kirim pesan, matikan container dengan paksa, nyalakan lagi, lalu buktikan pesannya masih ada.'
  ],
  objectives: [
    'Membedakan transient vs durable pada queue dan exchange',
    'Membedakan persistent vs transient pada pesan (delivery mode)',
    'Menjalankan percobaan restart dan membuktikan pesan selamat',
    'Menjelaskan posisi publisher confirms sebagai pelengkap jaminan pengiriman'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Durability: Objeknya yang Bertahan</h3><p><b>Durability</b> menyangkut <b>metadata objek</b>: apakah definisi queue dan exchange ikut tersimpan di disk sehingga tetap ada setelah RabbitMQ restart?</p><ul><li><b>Durable</b> — definisi disimpan ke disk. Broker mati → nyalakan → queue masih ada (walau bisa saja kosong).</li><li><b>Transient</b> — definisi hanya hidup di memori. Broker mati → queue beserta isinya hilang selamanya.</li></ul><p>Default saat membuat queue lewat banyak library klien adalah <b>transient</b>, dan inilah penyebab kebingungan paling sering. Selalu nyatakan <code>durable=true</code> bila data itu penting.</p><p>Catatan: <code>durable</code> adalah properti yang <b>tidak bisa diubah</b> setelah queue dibuat. Mengubahnya berarti menghapus queue lalu membuat ulang — dan semua pesan di dalamnya ikut hilang.</p>'
    },
    {
      type: 'text',
      html: '<h3>Persistence: Pesannya yang Ditulis ke Disk</h3><p><b>Persistence</b> menyangkut <b>isi pesan</b>. Setiap pesan membawa <i>delivery mode</i>:</p><ul><li><b>Mode 1 (non-persistent)</b> — pesan hanya di memori. Cepat, tetapi hilang bila broker restart atau kehabisan memori.</li><li><b>Mode 2 (persistent)</b> — pesan ditulis ke disk (<i>message store</i>) sebelum di-ACK.</li></ul><p>Kombinasi yang sering bikin bingung: queue durable tetapi pesan non-persistent → queue-nya tetap ada, isinya lenyap. Begitu pula sebaliknya. <b>Keduanya harus dinyatakan</b> agar benar-benar aman.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 330" width="760" role="img" aria-label="Empat kombinasi durability queue dan persistence pesan beserta hasil saat broker restart">
        <rect x="20" y="30" width="720" height="60" rx="8" class="u-box"/>
        <text x="380" y="56" class="u-title" text-anchor="middle">Saklar 1: queue durable? &nbsp;&nbsp; Saklar 2: pesan persistent?</text>
        <text x="380" y="78" class="u-lbl" text-anchor="middle">keduanya harus aktif agar pesan selamat dari restart</text>

        <rect x="20" y="110" width="350" height="90" rx="8" class="u-hd"/>
        <text x="195" y="136" class="u-title" text-anchor="middle">durable ✓ + persistent ✓</text>
        <text x="195" y="160" class="u-lbl" text-anchor="middle">restart → queue ada, pesan masih di dalamnya</text>
        <text x="195" y="180" class="u-lbl" text-anchor="middle">inilah satu-satunya kombinasi aman</text>

        <rect x="390" y="110" width="350" height="90" rx="8" class="u-box"/>
        <text x="565" y="136" class="u-title" text-anchor="middle">durable ✓ + persistent ✗</text>
        <text x="565" y="160" class="u-lbl" text-anchor="middle">restart → queue ada, tapi KOSONG</text>
        <text x="565" y="180" class="u-lbl" text-anchor="middle">pesannya tidak pernah ditulis ke disk</text>

        <rect x="20" y="214" width="350" height="90" rx="8" class="u-box"/>
        <text x="195" y="240" class="u-title" text-anchor="middle">durable ✗ + persistent ✓</text>
        <text x="195" y="264" class="u-lbl" text-anchor="middle">restart → queue HILANG beserta isinya</text>
        <text x="195" y="284" class="u-lbl" text-anchor="middle">tidak ada tempat menyimpan sisa pesan</text>

        <rect x="390" y="214" width="350" height="90" rx="8" class="u-box"/>
        <text x="565" y="240" class="u-title" text-anchor="middle">durable ✗ + persistent ✗</text>
        <text x="565" y="264" class="u-lbl" text-anchor="middle">restart → semua lenyap seketika</text>
        <text x="565" y="284" class="u-lbl" text-anchor="middle">cepat, tetapi tanpa jaminan apa pun</text>

        <text x="380" y="322" class="u-lbl" text-anchor="middle">Pesan non-persistent di antrean panjang juga bisa hilang saat broker kehabisan memori (memory alarm)</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 7.1</b> — Empat kombinasi durability queue dan persistence pesan; hanya kiri-atas yang aman</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Percobaan: Bukti Pesan Selamat dari Restart',
      lang: 'bash',
      output: false,
      code: `alias rmq='podman exec -i rabbitmq-server rabbitmqadmin'

# 1. Queue durable + pesan persistent (mode 2)
rmq declare queue name=q-invoice durable=true
rmq publish routing_key=q-invoice delivery-mode=2 payload='tagihan #INV-001'
rmq publish routing_key=q-invoice delivery-mode=2 payload='tagihan #INV-002'

# 2. Pastikan ada 2 pesan
rmq list queues name messages

# 3. Matikan container dengan paksa, lalu nyalakan lagi
podman stop rabbitmq-server
podman start rabbitmq-server
podman exec rabbitmq-server rabbitmq-diagnostics -q ping

# 4. Pesannya masih di sana?
rmq list queues name messages`,
      explain: [
        'Langkah 3 memakai <code>stop</code>/<code>start</code> — proses Erlang ditutup dengan rapi sehingga seluruh data ter-flush ke disk sebelum berhenti.',
        'Pada langkah 4, angkanya tetap 2. Bila kamu mengulang tanpa <code>delivery-mode=2</code>, angkanya kembali 0 setelah restart.',
        'Untuk uji yang lebih keras lagi, pakai <code>podman kill</code> (langsung SIGKILL) — durable + persistent tetap menang, hanya lebih lambat pada pemeriksaan awal.'
      ]
    },
    {
      type: 'example',
      title: 'Membuat Queue &amp; Exchange Tahan Banting',
      lang: 'bash',
      output: false,
      code: `alias rmq='podman exec -i rabbitmq-server rabbitmqadmin'

# Exchange durable (ingat: properti ini tidak bisa diubah belakangan)
rmq declare exchange name=e-billing type=direct durable=true

# Queue durable; rmqadmin menulis argumen x-queue-type=classic secara default
rmq declare queue name=q-billing durable=true

# Bila ingin menegaskan tipe queue klasik, tulis eksplisit:
rmq declare queue name=q-billing2 durable=true \\
  arguments='{"x-queue-mode":"default"}'

rmq declare binding source=e-billing destination=q-billing routing_key=billing.paid

# Terbitkan pesan persisten ke exchange (bukan ke queue langsung)
rmq publish exchange=e-billing routing_key=billing.paid \\
  delivery-mode=2 payload='pembayaran lunas'`,
      explain: [
        'Pesan <code>delivery-mode=2</code> berarti <i>persistent</i>; nilai 1 (default) berarti hanya di memori.',
        'Mendeklarasikan ulang queue dengan properti sama adalah tindakan aman; <b>mencoba mengubah</b> <code>durable</code> justru memicu error inequivalent property.',
        'Exchange juga punya sifat durable — tanpanya, definisi exchange lenyap saat restart dan producer gagal terhubung.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Publisher Confirms: Jaminan dari Sisi Producer</h3><p>Durability dan persistence menjamin pesan <b>setelah diterima broker</b>. Lantas bagaimana tahu broker benar-benar menerimanya — bukan hanya socket-nya masih terbuka? Jawabannya <b>publisher confirms</b>: producer meminta broker mengirim balasan konfirmasi per pesan (atau per batch).</p><ul><li><b>Konfirmasi diterima</b> — pesan sudah masuk antrean (dan sudah ditulis ke disk bila persistent).</li><li><b>Konfirmasi tidak datang / connection drop</b> — producer menganggap gagal lalu mengirim ulang.</li></ul><p>Inilah lapisan jaminan terakhir pada trilogi: <b>durable queue + persistent message + publisher confirm</b>. Materi praktik kode dan bab tuning produksi akan memakainya secara penuh.</p>'
    },
    {
      type: 'example',
      title: 'Tiga Syarat Pesan Benar-benar Aman',
      lang: 'text',
      output: false,
      code: `1. Queue & exchange dideklarasikan durable = true
      → objeknya tetap ada setelah broker restart

2. Pesan dikirim dengan delivery-mode = 2 (persistent)
      → isi pesan ditulis ke disk sebelum diproses

3. Producer menunggu publisher confirm
      → ada bukti broker menerima, bukan sekadar koneksi terbuka

Bonus: consumer memakai manual ACK
      → pesan baru hilang setelah benar-benar selesai diproses`,
      explain: [
        'Empat langkah ini saling melengkapi; melewatkan satu saja membuka celah kehilangan pesan di titik yang berbeda.',
        'Manual ACK dibahas pada bab Consumer Acknowledgements — di sanalah keputusan "pesan boleh dihapus" dibuat.',
        'Trade-off-nya adalah kecepatan: menulis ke disk dan menunggu confirm menambah latensi. Untuk data non-kritis (log debug, metrik), mode non-persistent justru lebih tepat.'
      ]
    },
    {
      type: 'tip',
      title: 'Kapan Boleh Tidak Persisten?',
      text: 'Tidak semua pesan butuh perlindungan penuh. Log debug, ping antar service, dan metrik mentah boleh memakai mode non-persistent karena dampak kehilangannya kecil dan volumenya besar — menulis semuanya ke disk justru membebani broker. Terapkan perlindungan penuh pada pesan bernilai: pembayaran, pesanan, dan perintah perubahan data.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: '<b>Durable bukan berarti tersimpan selamanya.</b> Queue yang tidak pernah dikonsumsi akan terus tumbuh sampai memori penuh, lalu RabbitMQ memicu <i>memory alarm</i> dan berhenti menerima pesan dari seluruh producer. Durability menjaga data tetap ada saat restart — bukan menggantikan consumer yang sehat dan pemantauan antrean.'
    },
    {
      type: 'vocab',
      items: [
        ['Durability', 'Sifat objek (queue/exchange) yang tetap tersimpan di disk sehingga bertahan setelah broker restart.'],
        ['Transient queue', 'Queue yang hanya hidup di memori; hilang selamanya saat broker berhenti.'],
        ['Persistent message', 'Pesan ber- delivery mode 2 yang ditulis ke disk sebelum diproses.'],
        ['Non-persistent', 'Pesan ber- delivery mode 1 yang hanya bertahan di memori.'],
        ['Message store', 'Penyimpanan disk internal RabbitMQ tempat pesan persisten ditulis.'],
        ['Publisher confirm', 'Mekanisme di mana broker mengonfirmasi penerimaan pesan kepada producer.'],
        ['Inequivalent property', 'Galat saat mendeklarasikan ulang queue/exchange dengan properti yang berbeda dari sebelumnya.'],
        ['Memory alarm', 'Keadaan darurat ketika memori penuh; RabbitMQ menahan pesan masuk dari seluruh producer.']
      ]
    }
  ],
  recap: [
    'Durability berlaku pada objek (queue/exchange), persistence berlaku pada isi pesan; keduanya harus aktif bersama.',
    'Queue transient hilang saat restart; queue durable tetap ada tetapi hanya bila pesannya juga persistent.',
    'Pesan persisten ditulis ke disk dengan delivery-mode=2; publisher confirm memberi bukti broker benar-benar menerimanya.',
    'Durability bukan pengganti consumer: antrean yang tak pernah dikonsumsi tetap memicu memory alarm.'
  ]
});
