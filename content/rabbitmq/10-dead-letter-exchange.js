/* ============================================================
   Pelajaran RabbitMQ — Bab 10: Dead Letter Exchange
   ============================================================ */
'use strict';

window.RABBITMQ_LESSONS = window.RABBITMQ_LESSONS || [];

window.RABBITMQ_LESSONS.push({
  id: 'dead-letter-exchange',
  title: 'Dead Letter Exchange: Mengelola Pesan Gagal',
  chapter: 'Keandalan Pesan',
  duration: '16–18 menit',
  intro: [
    'Dalam sistem nyata, tidak semua pesan berhasil diproses. Data rusak, layanan hilang sementara, atau pemrosesan melebihi batas waktu. Bila pesan gagal begitu saja, antrean menjadi tempat pesan menumpuk tanpa kejelasan. RabbitMQ menyediakan mekanisme bawaan bernama <b>Dead Letter Exchange (DLX)</b> untuk mengalirkan pesan gagal ke tempat khusus agar bisa diperiksa, dicoba ulang, atau dibuang dengan terkendali.',
    'Dead letter bekerja pada level queue. Ketika sebuah queue menolak pesan — karena consumer menolaknya dengan <code>nack</code>/<code>reject</code> tanpa requeue, karena pesan melewati batas waktu (TTL), atau karena antrean penuh — queue tersebut dapat meneruskan pesan ke exchange lain yang ditentukan. Exchange tujuan ini disebut <i>dead letter exchange</i>, dan biasanya mengarah ke queue khusus bernama <i>dead letter queue</i> (DLQ).',
    'Pola ini adalah fondasi reliability dalam sistem antrean. Dengan DLX, kegagalan tidak lagi berarti kehilangan data: pesan gagal terkumpul rapi, tim bisa memeriksanya, memperbaiki penyebabnya, lalu memproses ulang. Bab ini akan membangun DLQ lengkap dengan contoh nyata, lalu mengarahkannya ke bab berikutnya: menangani pesan kadaluarsa dan prioritas.'
  ],
  objectives: [
    'Menjelaskan apa itu Dead Letter Exchange dan tiga syarat sebuah pesan bisa menjadi dead letter.',
    'Membuat exchange dan queue khusus (DLX/DLQ) pada RabbitMQ lewat RabbitMQ Management API.',
    'Mengonfigurasi sebuah queue agar otomatis meneruskan pesan gagal ke DLQ.',
    'Menerapkan pola retry sederhana yang memanfaatkan DLX untuk menangani kegagalan pemrosesan.'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Mengapa Butuh Jalur Khusus untuk Pesan Gagal?</h3><p>Bayangkan sebuah layanan pemrosesan pembayaran. Consumer menerima pesan pesanan, memvalidasi nomor kartu, lalu memanggil layanan bank. Suatu ketika nomor kartu salah format — bukan masalah antrean, melainkan masalah data. Consumer tidak bisa memprosesnya, dan bila ia hanya melempar pesan itu kembali ke antrean (<i>requeue</i>), pesan yang sama akan diterima lagi, gagal lagi, dan berputar tanpa henti memakan CPU.</p><p>Dead letter exchange menyelesaikan masalah ini dengan mengalirkan pesan gagal ke jalur lain. Queue asli tetap bersih, pesan bermasalah terkumpul di DLQ, dan sistem bisa mengambil keputusan sadar: coba ulang nanti, kirim ke tim untuk investigasi, atau buang dengan tercatat.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 260" width="760" role="img" aria-label="Alur pesan gagal dari antrean utama menuju dead letter exchange lalu ke dead letter queue">
        <rect x="30" y="30" width="130" height="50" rx="8" class="u-box"/>
        <text x="95" y="60" class="u-lbl" text-anchor="middle">Producer</text>
        <line x1="165" y1="55" x2="230" y2="55" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="235" y="30" width="170" height="50" rx="8" class="u-hd"/>
        <text x="320" y="50" class="u-title" text-anchor="middle">Queue: payments</text>
        <text x="320" y="70" class="u-lbl" text-anchor="middle">durable + DLX</text>
        <line x1="410" y1="45" x2="490" y2="45" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="450" y="35" class="u-lbl" text-anchor="middle">ack</text>
        <rect x="495" y="30" width="130" height="50" rx="8" class="u-box"/>
        <text x="560" y="60" class="u-lbl" text-anchor="middle">Consumer</text>
        <line x1="320" y1="85" x2="320" y2="140" class="u-dash" marker-end="url(#u-arrow)"/>
        <text x="420" y="115" class="u-lbl" text-anchor="middle">nack requeue=false / TTL / antrean penuh</text>
        <rect x="235" y="145" width="170" height="50" rx="8" class="u-hd"/>
        <text x="320" y="165" class="u-title" text-anchor="middle">Dead Letter Exchange</text>
        <text x="320" y="185" class="u-lbl" text-anchor="middle">x-dead-letter-exchange</text>
        <line x1="410" y1="170" x2="490" y2="170" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="495" y="145" width="150" height="50" rx="8" class="u-box"/>
        <text x="570" y="165" class="u-title" text-anchor="middle">Queue: payments.dlq</text>
        <text x="570" y="185" class="u-lbl" text-anchor="middle">menunggu pemeriksaan</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 10.1</b> — Pesan gagal diteruskan dari antrean utama ke dead letter exchange, lalu menumpuk di DLQ untuk diperiksa</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Tiga Syarat Pesan Menjadi Dead Letter</h3><p>RabbitMQ mengalirkan pesan menjadi <i>dead letter</i> dalam tiga situasi:</p><ol><li><b>Consumer menolak pesan</b> — consumer memanggil <code>nack</code> (atau <code>reject</code>) dengan parameter <code>requeue</code> bernilai <code>false</code>. Ini kasus paling umum.</li><li><b>Pesan melewati batas waktu (TTL)</b> — pesan telah habis masa berlakunya di antrean dan tidak sempat diproses.</li><li><b>Antrean mencapai batas panjang</b> — queue dibatasi dengan <code>x-max-length</code>, dan pesan terlama tersingkir untuk memberi ruang.</li></ol><p>Penting dipahami: menolak pesan dengan <code>requeue=true</code> hanya mengembalikannya ke posisi awal antrean — itu bukan dead letter, dan justru berisiko menciptakan loop tanpa akhir.</p>'
    },
    {
      type: 'example',
      title: 'Membangun DLQ dan mengaktifkan DLX pada antrean',
      lang: 'bash',
      output: false,
      code: `# 1. Login ke RabbitMQ
curl -u admin:admin123 -X POST http://localhost:15672/api/queues/%2F/payments.dlq \\
  -H "content-type: application/json" \\
  -d '{ "durable": true, "autoDelete": false }'

# 2. Buat antrean payments dengan dead-letter-exchange mengarah ke DLQ
curl -u admin:admin123 -X POST http://localhost:15672/api/queues/%2F/payments \\
  -H "content-type: application/json" \\
  -d '{
    "durable": true,
    "arguments": {
      "x-dead-letter-exchange": "",
      "x-dead-letter-routing-key": "payments.dlq"
    }
  }'

# Catatan: exchange kosong ("") berarti default exchange.
# Dengan routing key "payments.dlq", pesan gagal akan
# mendarat persis di antrean payments.dlq.`,
      explain: [
        'Antrean DLQ dibuat lebih dulu agar pesan gagal tidak hilang ketika antrean utama mulai membuang pesan.',
        'Argumen <code>x-dead-letter-exchange</code> menunjuk ke exchange tujuan; nilai "" adalah default exchange yang mengarahkan berdasarkan nama antrean.',
        '<code>x-dead-letter-routing-key</code> menentukan nama antrean tujuan — tanpa ini, routing key asli pesan dipertahankan, dan pesan mungkin tidak sampai ke DLQ.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Consumer yang Menolak Pesan Bermasalah</h3><p>Sekarang konfigurasi sudah lengkap: antrean <code>payments</code> siap meneruskan pesan gagal ke <code>payments.dlq</code>. Tinggal membuat consumer yang menolak pesan tidak valid tanpa requeue. Berikut contoh consumer Node.js yang memvalidasi nomor kartu:</p>'
    },
    {
      type: 'example',
      title: 'Consumer yang menolak pesan bermasalah ke DLQ',
      lang: 'javascript',
      output: false,
      code: `const amqp = require('amqplib');

async function main() {
  const conn = await amqp.connect('amqp://admin:admin123@localhost:5672');
  const ch = await conn.createChannel();
  await ch.assertQueue('payments', { durable: true });
  ch.prefetch(1);

  ch.consume('payments', async (msg) => {
    const order = JSON.parse(msg.content.toString());
    if (!order.cardNumber || order.cardNumber.length < 12) {
      console.log('Data tidak valid, dikirim ke DLQ:', order.id);
      // requeue=false: pesan dialirkan ke payments.dlq, bukan diulang terus
      return ch.nack(msg, false, false);
    }
    console.log('Memproses pembayaran:', order.id);
    // Proses berhasil...
    ch.ack(msg);
  });

  process.on('SIGTERM', async () => {
    await ch.close();
    await conn.close();
  });
}

main().catch(console.error);`,
      explain: [
        '<code>ch.nack(msg, false, false)</code> berarti: akui pesan (requeue=false) tanpa mengembalikannya; broker kemudian meneruskannya ke exchange dead-letter yang telah dikonfigurasi pada queue.',
        'Pesan valid diterima dan langsung di-ack agar keluar dari antrean; pesan rusak dialirkan ke DLQ sehingga antrean utama tetap bersih.',
        'Kode juga menutup koneksi dengan rapi saat menerima sinyal SIGTERM — pola graceful shutdown yang akan dipakai lagi pada bab praktik proyek.'
      ]
    },
    {
      type: 'text',
      html: '<p>Kamu bisa memantau DLQ melalui tab <b>Queues</b> pada dashboard di <code>http://localhost:15672</code>. Ketika ada pesan masuk ke <code>payments.dlq</code>, angka <i>Ready</i> akan bertambah — pesan itu menunggu untuk diperiksa tim.</p>'
    },
    {
      type: 'tip',
      title: 'DLQ Bukan Tempat Sampah',
      text: 'DLQ bukan tempat sampah. Beri jadwal pemeriksaan rutin (harian/mingguan), atur peringatan bila jumlah pesan DLQ melampaui ambang tertentu, dan selidiki penyebabnya — kalau tidak, DLQ hanya menunda masalah.'
    },
    {
      type: 'text',
      html: '<h3>Pola Retry Berbasis DLX</h3><p>Salah satu penggunaan DLX yang paling cerdas adalah <b>pola retry</b>. Ketika pemrosesan gagal karena layanan lain sedang sibuk (bukan karena data rusak), kita tidak ingin membuang pesan — kita ingin mencoba lagi nanti. Caranya: antrean utama punya DLX menuju antrean <i>retry</i>, dan antrean retry tersebut punya TTL serta DLX yang mengarah kembali ke antrean utama.</p><p>Alurnya: pesan gagal → masuk antrean retry → menunggu beberapa detik (TTL) → otomatis kembali ke antrean utama untuk dicoba lagi. Kombinasi ini akan dibahas tuntas pada bab berikutnya bersama topik TTL.</p>'
    },
    {
      type: 'warn',
      title: 'Hindari Requeue Tanpa Pertimbangan',
      text: 'Hindari requeue tanpa pertimbangan. Mengembalikan pesan ke antrean (requeue=true) saat gagal bisa menciptakan loop: pesan yang sama diterima, gagal, dikembalikan, diterima lagi, dan seterusnya — membebani broker dan menutupi masalah sebenarnya. Gunakan DLX sebagai jalur keluar yang terkendali.'
    },
    {
      type: 'text',
      html: '<p>Dengan dead letter exchange, sistem kini punya "tempat pembuangan resmi" yang rapi untuk pesan gagal — bukan sekadar menghapus atau memutar ulang tanpa batas. Pastikan kamu sudah mempraktikkan konfigurasi DLQ di atas sebelum lanjut: bab berikutnya akan memakai konsep yang sama (TTL) untuk membuat pesan kedaluwarsa dan antrean dengan prioritas.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Dead Letter Exchange (DLX)', 'Exchange khusus yang menerima pesan yang ditolak atau kedaluarsa dari sebuah antrean.'],
        ['Dead Letter Queue (DLQ)', 'Antrean yang dibuat khusus untuk menampung pesan dead letter guna pemeriksaan lebih lanjut.'],
        ['Nack (Negative Acknowledgement)', 'Sinyal dari consumer kepada broker bahwa sebuah pesan gagal diproses.'],
        ['Requeue', 'Mengembalikan pesan ke antrean; bila false, pesan diteruskan ke DLX bila dikonfigurasi.'],
        ['Retry Queue', 'Antrean perantara untuk mencoba ulang pemrosesan, biasanya dengan TTL yang mengarah kembali ke antrean utama.']
      ]
    }
  ],
  recap: [
    'Dead Letter Exchange (DLX) adalah exchange tujuan yang menerima pesan yang ditolak atau kedaluarsa dari sebuah antrean.',
    'Pesan menjadi dead letter bila consumer menolaknya dengan nack/requeue=false, pesan melewati TTL, atau antrean mencapai batas x-max-length.',
    'Konfigurasi DLX dilakukan per antrean melalui argumen x-dead-letter-exchange dan x-dead-letter-routing-key.',
    'DLQ menjadi tempat pesan bermasalah terkumpul untuk diperiksa, dan menjadi dasar pola retry dengan TTL.'
  ]
});
