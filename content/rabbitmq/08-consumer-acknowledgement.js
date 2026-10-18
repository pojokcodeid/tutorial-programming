/* ============================================================
   Pelajaran RabbitMQ — Bab 8: Consumer Acknowledgements
   ============================================================ */
'use strict';

window.RABBITMQ_LESSONS = window.RABBITMQ_LESSONS || [];

window.RABBITMQ_LESSONS.push({
  id: 'consumer-acknowledgement',
  title: 'Consumer Acknowledgements: ACK, NACK & Reject',
  chapter: 'Keandalan Pesan',
  duration: '8–10 menit',
  intro: [
    'Ketika consumer menerima sebuah pesan, ada satu momen penentuan: apakah pesan itu <b>langsung dihapus</b> dari queue, atau <b>dipertahankan sampai pemrosesannya selesai</b>? Pilihan ini menentukan apakah sistem kehilangan data atau justru memprosesnya dua kali.',
    'Bab ini membahas <b>manual acknowledgement</b> — tiga perintah inti <code>basic.ack</code>, <code>basic.nack</code>, dan <code>basic.reject</code> — beserta perbedaan kritis antara <code>requeue = true</code> dan <code>requeue = false</code>. Kamu juga akan melihat secara langsung apa yang terjadi ketika consumer dibunuh di tengah jalan.',
    'Ini adalah bab paling penting dalam seluruh materi keandalan: tanpa ACK yang benar, seluruh durability dan persistence yang sudah dibangun tidak akan menyelamatkan pesan dari kehilangan.'
  ],
  objectives: [
    'Membedakan auto-ack dan manual ack beserta risiko masing-masing',
    'Memakai ack, nack, dan reject beserta pilihan requeue yang tepat',
    'Mengamati perilaku pesan unacknowledged saat consumer dibunuh',
    'Menerapkan pola pemrosesan yang aman untuk pesan yang gagal'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Auto-ACK vs Manual ACK</h3><p><b>Auto-ack</b> berarti RabbitMQ menghapus pesan <b>tepat saat dikirimkan</b> ke consumer — sebelum diproses, bahkan sebelum kode sempat membacanya. Bila proses consumer crash setengah detik kemudian, pesan itu hilang selamanya.</p><p><b>Manual ack</b> berarti pesan tetap berada di queue (statusnya berubah menjadi <i>unacknowledged</i>) selama consumer bekerja. Hanya setelah consumer mengirim <code>basic.ack</code>, barulah pesan dihapus.</p><ul><li><b>Auto-ack</b> hanya layak untuk data yang boleh hilang: log, metrik, ping.</li><li><b>Manual ack</b> wajib untuk data bernilai: pembayaran, pesanan, perintah perubahan data.</li></ul><p>Aturan praktisnya: <b>ack setelah pekerjaan benar-benar selesai</b>, bukan setelah pesan diterima.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 320" width="760" role="img" aria-label="Alur manual acknowledgement: pesan unacknowledged sampai consumer mengirim ack atau nack">
        <rect x="20" y="130" width="120" height="60" rx="8" class="u-box"/>
        <text x="80" y="156" class="u-title" text-anchor="middle">Queue</text>
        <text x="80" y="176" class="u-lbl" text-anchor="middle">pesan menumpuk</text>

        <line x1="144" y1="160" x2="226" y2="160" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="185" y="150" class="u-lbl" text-anchor="middle">deliver</text>

        <rect x="230" y="118" width="170" height="84" rx="8" class="u-hd"/>
        <text x="315" y="146" class="u-title" text-anchor="middle">Consumer</text>
        <text x="315" y="168" class="u-lbl" text-anchor="middle">memproses pesan...</text>
        <text x="315" y="188" class="u-lbl" text-anchor="middle">status: unacked</text>

        <line x1="404" y1="140" x2="516" y2="88" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="404" y1="182" x2="516" y2="238" class="u-dash" marker-end="url(#u-arrow)"/>
        <text x="470" y="100" class="u-lbl" text-anchor="middle">basic.ack</text>
        <text x="470" y="234" class="u-lbl" text-anchor="middle">basic.nack / reject</text>

        <rect x="520" y="50" width="220" height="76" rx="8" class="u-hd"/>
        <text x="630" y="76" class="u-title" text-anchor="middle">Berhasil ✓</text>
        <text x="630" y="100" class="u-lbl" text-anchor="middle">pesan dihapus dari queue</text>

        <rect x="520" y="196" width="220" height="106" rx="8" class="u-box"/>
        <text x="630" y="222" class="u-title" text-anchor="middle">Gagal ✗ — dua pilihan</text>
        <text x="630" y="246" class="u-lbl" text-anchor="middle">requeue = true → kembali ke antrean</text>
        <text x="630" y="268" class="u-lbl" text-anchor="middle">requeue = false → dibuang / ke DLX</text>
        <text x="630" y="290" class="u-lbl" text-anchor="middle">jangan lakukan keduanya tanpa perhitungan</text>

        <text x="380" y="118" class="u-lbl" text-anchor="middle">pesan unacked tetap di broker — bukan di memori consumer</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 8.1</b> — Siklus ACK: pesan dipertahankan selama diproses, baru dihapus setelah ack</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Tiga Perintah dan Dua Nilai requeue',
      lang: 'text',
      output: false,
      code: `basic.ack    (delivery-tag)               pesan SELESAI → hapus dari queue
basic.nack   (tag, multiple, requeue)      pesan GAGAL  → putuskan nasibnya
basic.reject (delivery-tag, requeue)       versi sederhana dari nack (1 pesan)

requeue = true
  → pesan KEMBALI ke antrean (bisa ke consumer lain)
  → bahaya: bila pesan itu selalu gagal, ia berputar tanpa henti
             memakan memori dan mengulang kegagalan yang sama

requeue = false
  → pesan DIBUANG, atau dialihkan ke Dead Letter Exchange bila dikonfigurasi
  → inilah jalur yang lazim untuk pesan yang gagal total

multiple = true (pada ack/nack)
  → mengonfirmasi SEMUAP pesan dengan nomor tag sampai titik itu
  → praktis dipakai ketika memproses pesan secara batch`,
      explain: [
        'Delivery tag bersifat <b>unik per channel</b>, bukan global — inilah sebabnya channel harus dibuat per koneksi logis.',
        'Pola aman: coba proses, bila gagal bernapas (misal database sedang down) kirim <code>requeue = true</code>; bila pesannya sendiri rusak/tidak valid kirim <code>requeue = false</code> (atau ke DLQ).',
        '<code>basic.reject</code> hanya menolak satu pesan; <code>basic.nack</code> menambah opsi <code>multiple</code> dan menolak beberapa sekaligus.'
      ]
    },
    {
      type: 'example',
      title: 'Percobaan: Apa yang Terjadi Tanpa ACK?',
      lang: 'bash',
      output: false,
      code: `alias rmq='podman exec -i rabbitmq-server rabbitmqadmin'

rmq declare queue name=q-job durable=true
rmq publish routing_key=q-job payload='tugas-1'
rmq publish routing_key=q-job payload='tugas-2'

# Ambil pesan TANPA mengonfirmasi apa pun (no_ack=false)
rmq get queue=q-job count=1 requeue=false

# Lihat kolom Unacked — pesan sudah keluar dari queue tetapi belum dihapus
podman exec rabbitmq-server rabbitmqctl list_queues \\
  name messages messages_ready messages_unacknowledged

# Bunuh proses consumer (simulasi crash di tengah jalan)
# → pesan unacked OTOMATIS kembali ke queue oleh broker
podman exec rabbitmq-server rabbitmqctl list_queues name messages_unacknowledged`,
      explain: [
        'Pesan berpindah dari <b>Ready</b> ke <b>Unacknowledged</b> ketika dikirim ke consumer; angka inilah yang harus dipantau di dashboard.',
        'Bila proses consumer mati, RabbitMQ mendeteksi putusnya channel lalu <b>menaruh kembali seluruh pesan unacked-nya</b> ke antrean — inilah penyelamat utama dari kehilangan data.',
        'Karena itu pola "pesan diproses lalu di-ACK" menjamin pesan tidak hilang; yang tersisa hanyalah memastikan pemrosesan itu idempoten (mengulang dua kali tidak merusak).'
      ]
    },
    {
      type: 'example',
      title: 'Pemrosesan Aman dengan Manual ACK (amqplib)',
      lang: 'javascript',
      output: false,
      code: `const amqp = require('amqplib');

async function main() {
  const conn = await amqp.connect('amqp://admin:admin123@localhost:5672');
  const ch = await conn.createChannel();

  // Batasi agar hanya 1 pesan dikirim sebelum ACK sebelumnya (lihat bab berikutnya)
  await ch.prefetch(1);
  await ch.assertQueue('q-job', { durable: true });

  await ch.consume('q-job', async (msg) => {
    if (!msg) return; // broker menutup channel
    try {
      await proses(msg.content.toString());
      ch.ack(msg);                 // sukses: hapus pesan
    } catch (err) {
      const kburuk = err.permanen === true;
      // pesan rusak permanen → buang (atau ke DLQ); gagal sementara → kembali
      ch.nack(msg, false, !kburuk);
    }
  });

  console.log('menunggu pesan... tekan Ctrl+C untuk berhenti');
}

main();`,
      explain: [
        '<code>ch.ack(msg)</code> dipanggil <b>setelah</b> <code>proses()</code> sukses — urutan inilah yang membuat pesan tidak pernah hilang sebelum dikerjakan.',
        'Pesan ditolak dengan <code>nack</code> memakai keputusan ganda: bila kegagalan bersifat <b>permanen</b> (data rusak), kirim <code>requeue=false</code> agar tidak berputar; bila sementara, kembalikan ke antrean.',
        'Pesan yang di-<code>requeue=false</code> tanpa Dead Letter Exchange akan <b>hilang</b> — itulah sebabnya bab Dead Letter Exchange hadir tepat setelah ini.'
      ]
    },
    {
      type: 'text',
      html: '<h3>At Least Once dan Idempotensi</h3><p>Dengan manual ack, RabbitMQ memberi jaminan <b>at least once</b> (setidaknya sekali): pesan diproses minimal satu kali, dan bisa terjadi lebih dari satu kali bila consumer crash setelah bekerja tetapi sebelum ACK terkirim.</p><p>Karena itu pemrosesan sebaiknya dibuat <b>idempoten</b> — menerima data yang sama dua kali tidak menghasilkan efek ganda. Beberapa caranya paling umum:</p><ul><li><b>Simpan ID pesan</b> dan lewati bila ID sudah pernah diproses.</li><li><b>Gunakan kondisi unik</b> pada database (unique constraint) sehingga insert kedua otomatis ditolak.</li><li><b>Cek status transisi</b> — "bayar hanya bila status belum lunas".</li></ul><p>Jaminan <i>exactly once</i> yang sempurna tidak realistis di sistem terdistribusi; idempoten adalah jawaban praktis yang dipakai hampir semua tim produksi.</p>'
    },
    {
      type: 'tip',
      title: 'Kapan Boleh Memakai Auto-ack?',
      text: 'Boleh memakai auto-ack ketika <b>kehilangan pesan tidak berarti apa-apa</b>: pengumpulan metrik, log debug, atau sinyal kecil antar service. Uji sederhananya: "bila pesan ini hilang, apakah ada orang perlu melakukan sesuatu?" Bila jawabannya ya, pakai manual ack. Di materi praktik kode, seluruh consumer memakai manual ack.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Jangan menunda ACK terlalu lama. Selama pesan berstatus <i>unacknowledged</i>, ia memakan memori broker dan tidak bisa diberikan ke consumer lain — satu consumer yang lambat mampu membuat antrean terlihat "macet". Batasi jumlah pesan yang dipegang (prefetch) dan selesaikan pemrosesan dengan cepat; itulah isi bab Fair Dispatch berikutnya.'
    },
    {
      type: 'vocab',
      items: [
        ['ACK (basic.ack)', 'Tanda terima consumer bahwa pesan selesai diproses; broker lalu menghapus pesan dari queue.'],
        ['NACK (basic.nack)', 'Penolakan atas pesan; menyertai keputusan apakah pesan dikembalikan (requeue) atau dibuang.'],
        ['Reject (basic.reject)', 'Penolakan satu pesan tanpa opsi multiple — versi sederhana dari NACK.'],
        ['Auto-ack', 'Mode di mana pesan dihapus otomatis saat dikirim ke consumer, sebelum diproses.'],
        ['Unacknowledged', 'Status pesan yang sudah dikirim ke consumer tetapi belum di-ACK; tetap tersimpan di broker.'],
        ['Delivery tag', 'Nomor penanda unik per channel yang dipakai untuk merujuk pesan saat ACK/NACK.'],
        ['Idempotensi', 'Sifat pemrosesan yang memberi hasil sama walau data yang sama diterima berulang kali.'],
        ['At least once', 'Jaminan bahwa pesan diproses minimal sekali; bisa terjadi berulang bila terjadi crash di tengah.']
      ]
    }
  ],
  recap: [
    'Auto-ack menghapus pesan sebelum diproses dan hanya layak untuk data yang boleh hilang; manual ack mempertahankannya sampai pemrosesan selesai.',
    'ack menyelesaikan pesan, nack/reject menolaknya; requeue=true mengembalikan ke antrean, requeue=false membuang atau mengalihkan ke DLX.',
    'Bila consumer mati di tengah jalan, seluruh pesan unacknowledged otomatis kembali ke queue — itulah penyelamat data utama.',
    'Jaminannya at least once, sehingga pemrosesan wajib idempoten agar pengulangan tidak berdampak ganda.'
  ]
});
