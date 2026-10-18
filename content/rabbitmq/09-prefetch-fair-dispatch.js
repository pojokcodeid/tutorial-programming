/* ============================================================
   Pelajaran RabbitMQ — Bab 9: Prefetch & Fair Dispatch
   ============================================================ */
'use strict';

window.RABBITMQ_LESSONS = window.RABBITMQ_LESSONS || [];

window.RABBITMQ_LESSONS.push({
  id: 'prefetch-fair-dispatch',
  title: 'Prefetch & Fair Dispatch: Beban yang Adil',
  chapter: 'Keandalan Pesan',
  duration: '8–10 menit',
  intro: [
    'Kamu menjalankan dua consumer untuk satu queue, tetapi satu consumer terus bekerja sementara yang lain menganggur. Bukan karena salah satunya rusak — RabbitMQ secara bawaan membagi pesan secara <b>round-robin</b> tanpa tahu betapa beratnya tiap pesan.',
    'Bab ini membahas <b>unfair dispatch</b>: mengapa pembagian rata justru tidak adil ketika tugas berbeda-beda lamanya, dan bagaimana <code>channel.prefetch(n)</code> (QoS) mengembalikan keseimbangan dengan membatasi jumlah pesan yang dipegang satu consumer.',
    'Kamu akan mempraktikkan percobaan dua consumer dengan tugas berbeda kecepatan, lalu melihat sendiri bagaimana angka Unacknowledged berubah dan beban mulai menyebar merata.'
  ],
  objectives: [
    'Menjelaskan perilaku round-robin bawaan dan kapan ia menjadi tidak adil',
    'Memakai channel.prefetch / basic.qos untuk membatasi pesan per consumer',
    'Mengamati dampak prefetch terhadap distribusi beban lewat dashboard',
    'Menentukan nilai prefetch yang sesuai untuk kasus tertentu'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Round-robin: Adil di Atas Kertas</h3><p>Saat ada beberapa consumer pada satu queue, RabbitMQ membagi pesan secara <b>round-robin</b>: pesan pertama ke A, kedua ke B, ketiga ke A lagi, dan seterusnya. Tampak adil — tetapi hanya bila semua pesan membutuhkan waktu kerja yang sama.</p><p>Contoh nyata: queue berisi 100 tugas; 90 di antaranya hanya butuh 10 ms (membuat thumbnail), 10 sisanya butuh 5 detik (encode video). Round-robin membagi rata, tetapi consumer yang kebetulan menerima lebih banyak tugas berat akan tertinggal jauh, sementara yang ringan selesai lebih dulu lalu menganggur menunggu giliran berikutnya.</p><p>Masalah ini disebut <b>unfair dispatch</b>: pembagian merata dalam jumlah, tetapi tidak merata dalam beban.</p>'
    },
    {
      type: 'text',
      html: '<h3>prefetch: Batasi yang Boleh Dipegang</h3><p>Solusinya satu baris: <code>channel.prefetch(n)</code> (setara dengan <code>basic.qos</code>). Nilai <code>n</code> adalah batas maksimal pesan <b>unacknowledged</b> yang boleh dikirimkan RabbitMQ ke satu consumer.</p><ul><li><code>prefetch = 1</code> — consumer hanya menerima pesan berikutnya setelah yang sekarang di-ACK. Bekerja satu per satu.</li><li><code>prefetch = 10</code> — boleh memegang hingga 10 pesan sekaligus.</li><li><code>prefetch = 0</code> — tanpa batas (default lama) — inilah penyebab unfair dispatch.</li></ul><p>Dengan <code>prefetch = 1</code>, consumer yang lambat otomatis menerima lebih sedikit pesan karena ia sering tidak siap menerima tambahan. Bukan karena ia dilayani lebih perlahan, melainkan karena ia tidak lagi dibanjiri.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 340" width="760" role="img" aria-label="Perbandingan unfair dispatch tanpa prefetch dengan fair dispatch prefetch 1">
        <rect x="20" y="30" width="350" height="280" rx="10" class="u-box"/>
        <text x="195" y="56" class="u-title" text-anchor="middle">Tanpa prefetch (unfair)</text>
        <line x1="36" y1="66" x2="354" y2="66" class="u-line"/>
        <rect x="40" y="82" width="140" height="36" rx="6" class="u-hd"/>
        <text x="110" y="105" class="u-lbl" text-anchor="middle">Queue: 10 tugas</text>
        <line x1="184" y1="100" x2="230" y2="100" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="234" y="82" width="120" height="36" rx="6" class="u-box"/>
        <text x="294" y="105" class="u-lbl" text-anchor="middle">kirim apa adanya</text>
        <line x1="180" y1="130" x2="120" y2="164" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="200" y1="130" x2="270" y2="164" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="40" y="168" width="150" height="56" rx="6" class="u-hd"/>
        <text x="115" y="190" class="u-title" text-anchor="middle">Consumer A</text>
        <text x="115" y="212" class="u-lbl" text-anchor="middle">pegang 7 tugas ✗</text>
        <rect x="210" y="168" width="150" height="56" rx="6" class="u-box"/>
        <text x="285" y="190" class="u-title" text-anchor="middle">Consumer B</text>
        <text x="285" y="212" class="u-lbl" text-anchor="middle">pegang 3, sudah selesai</text>
        <text x="195" y="256" class="u-lbl" text-anchor="middle">B menganggur, A menumpuk</text>
        <text x="195" y="284" class="u-lbl" text-anchor="middle">angka Unacked A membengkak</text>

        <rect x="390" y="30" width="350" height="280" rx="10" class="u-hd"/>
        <text x="565" y="56" class="u-title" text-anchor="middle">Dengan prefetch = 1 (fair)</text>
        <line x1="406" y1="66" x2="724" y2="66" class="u-line"/>
        <rect x="410" y="82" width="140" height="36" rx="6" class="u-box"/>
        <text x="480" y="105" class="u-lbl" text-anchor="middle">Queue: 10 tugas</text>
        <line x1="554" y1="100" x2="600" y2="100" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="604" y="82" width="120" height="36" rx="6" class="u-box"/>
        <text x="664" y="105" class="u-lbl" text-anchor="middle">kirim bila siap</text>
        <line x1="540" y1="130" x2="480" y2="164" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="560" y1="130" x2="630" y2="164" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="410" y="168" width="150" height="56" rx="6" class="u-box"/>
        <text x="485" y="190" class="u-title" text-anchor="middle">Consumer A</text>
        <text x="485" y="212" class="u-lbl" text-anchor="middle">pegang 1 tugas ✓</text>
        <rect x="580" y="168" width="150" height="56" rx="6" class="u-box"/>
        <text x="655" y="190" class="u-title" text-anchor="middle">Consumer B</text>
        <text x="655" y="212" class="u-lbl" text-anchor="middle">tetap bekerja ✓</text>
        <text x="565" y="256" class="u-lbl" text-anchor="middle">keduanya sibuk sesuai kapasitas</text>
        <text x="565" y="284" class="u-lbl" text-anchor="middle">bila A selesai → baru dapat pesan baru</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 9.1</b> — Tanpa prefetch, satu consumer menumpuk; dengan prefetch=1 beban mengikuti kecepatan kerja</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Percobaan: Dua Consumer, Satu Queue',
      lang: 'bash',
      output: false,
      code: `alias rmq='podman exec -i rabbitmq-server rabbitmqadmin'

rmq declare queue name=q-mix durable=true

# Isi antrean: tugas ringan dan tugas berat bercampur
rmq publish routing_key=q-mix payload='thumb-01'   # ringan
rmq publish routing_key=q-mix payload='video-01'   # berat
rmq publish routing_key=q-mix payload='thumb-02'   # ringan
rmq publish routing_key=q-mix payload='video-02'   # berat
rmq publish routing_key=q-mix payload='thumb-03'   # ringan

# Amati distribusi saat consumer berjalan
podman exec rabbitmq-server rabbitmqctl list_queues \\
  name messages messages_ready messages_unacknowledged consumers

# Pantau terus-menerus (1 detik sekali) sambil consumer bekerja
watch -n1 'podman exec rabbitmq-server rabbitmqctl list_queues \\
  name messages messages_unacknowledged consumers'`,
      explain: [
        'Perhatikan kolom <b>Unacknowledged</b>: consumer yang memegang banyak pesan sekaligus menaikkan angka ini — tanda persis unfair dispatch.',
        'Dengan <code>prefetch=1</code>, angka Unacked tiap consumer tidak pernah melebihi 1 sehingga beban mengikuti kecepatan kerja masing-masing.',
        'Perintah <code>watch</code> membuat pemeriksaan berulang; jalankan di terminal kedua selama consumer berjalan.'
      ]
    },
    {
      type: 'example',
      title: 'Menyetel prefetch pada Tiap Bahasa',
      lang: 'text',
      output: false,
      code: `Node.js (amqplib)
  await ch.prefetch(1);

Go (amqp091-go)
  err = ch.Qos(1, 0, false)

Java (amqp-client)
  channel.basicQos(1);

Spring AMQP
  @RabbitListener(queues = "q-mix", concurrency = "2-4")

Aturan praktis pemilihan nilai:
  1       → tugas berat / butuh urutan ketat / pemrosesan lama
  10-100  → tugas sangat ringan (parsing, penulisan log) agar hemat round-trip
  0       → tanpa batas; hanya bila kamu yakin semua consumer seragam`,
      explain: [
        'Ketiga pustaka memakai konsep identik: <b>basic.qos</b> menyetel batas pesan unacknowledged per consumer.',
        'Nilai prefetch yang tepat meningkatkan throughput tanpa membuat satu consumer menumpuk — mulai dari 1, naikkan bila tugasnya ringan dan terbukti menaikkan kecepatan.',
        'QoS hanya berlaku pada consumer dengan <b>manual ack</b>; pada auto-ack batas ini tidak berarti apa-apa karena pesan langsung dianggap selesai.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Menentukan Nilai yang Tepat</h3><p>Tidak ada angka ajaib, tetapi ada proses menentukan yang masuk akal:</p><ol><li><b>Mulai dari 1</b> — kondisi paling aman dan paling adil, cocok untuk hampir semua tugas.</li><li><b>Naikkan</b> bila pemantauan menunjukkan consumer sering <i>idle</i> (menganggur) dan tugasnya ringan — prefetch 10–50 biasanya mengurangi jumlah round-trip ke broker.</li><li><b>Turunkan</b> bila pesan besar-besar memakan memori, atau bila pemrosesan membutuhkan sumber daya terbatas (misal koneksi database yang terbatas).</li><li><b>Pantau Unacknowledged</b> — bila angkanya melonjak pada satu consumer, kurangi prefetch atau periksa kembali logika ACK-nya.</li></ol><p>Perhatikan juga: prefetch mengatur distribusi <b>di dalam satu queue</b>. Bila kamu butuh penyebaran beban antar instance yang lebih agresif, pertimbangkan jumlah consumer, atau tipe queue yang dirancang untuk itu pada bab High Availability.</p>'
    },
    {
      type: 'tip',
      title: 'Kaitkan dengan Ack yang Cepat',
      text: 'Prefetch hanya bekerja bila ACK-nya dikirim segera setelah pekerjaan selesai. Consumer yang menunda ACK (misal mengumpulkan lalu mengirim belakangan) akan tetap menahan pesan dan membatasi dirinya sendiri. Pasangkan <b>prefetch kecil</b> dengan <b>ack segera</b> untuk hasil yang paling seimbang.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Menaikkan prefetch terlalu besar mengembalikan masalah unfair dispatch, karena satu consumer kembali boleh menumpuk banyak pesan sekaligus. Bila ada tugas yang gagal dan perlu dikembalikan (requeue), prefetch tinggi juga berarti lebih banyak pesan ikut tertahan. Naikkan bertahap dan pantau Unacknowledged.'
    },
    {
      type: 'vocab',
      items: [
        ['Round-robin', 'Pembagian pesan bergiliran ke antar consumer pada queue yang sama — adil dalam jumlah, belum tentu dalam beban.'],
        ['Unfair dispatch', 'Keadaan ketika pembagian rata justru membuat satu consumer menumpuk sementara yang lain menganggur.'],
        ['Prefetch (basic.qos)', 'Batas jumlah pesan unacknowledged yang boleh dikirimkan RabbitMQ ke satu consumer.'],
        ['QoS', 'Quality of Service pada AMQP; mekanisme yang sama dengan prefetch.'],
        ['Idle', 'Keadaan consumer tidak menerima pekerjaan; tanda distribusi beban tidak sehat.'],
        ['Throughput', 'Jumlah pesan yang berhasil diproses per satuan waktu.'],
        ['Manual ack sebagai syarat', 'QoS hanya berarti bila consumer memakai manual ack; auto-ack membuat batas ini tidak relevan.']
      ]
    }
  ],
  recap: [
    'RabbitMQ membagi pesan secara round-robin, yang menjadi tidak adil ketika lamanya tugas berbeda-beda.',
    'channel.prefetch(n) membatasi pesan unacknowledged per consumer; prefetch=1 membuat beban mengikuti kecepatan kerja.',
    'Mulai dari nilai 1, naikkan bila tugas ringan dan consumer sering menganggur, pantau kolom Unacknowledged di dashboard.',
    'QoS hanya bekerja bersama manual ack; pasangkan prefetch kecil dengan ack yang segera untuk distribusi paling seimbang.'
  ]
});
