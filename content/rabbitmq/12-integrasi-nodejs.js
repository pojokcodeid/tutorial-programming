/* ============================================================
   Pelajaran RabbitMQ — Bab 12: Integrasi Node.js (amqplib)
   ============================================================ */
'use strict';

window.RABBITMQ_LESSONS = window.RABBITMQ_LESSONS || [];

window.RABBITMQ_LESSONS.push({
  id: 'integrasi-nodejs',
  title: 'Integrasi RabbitMQ dengan Node.js (amqplib)',
  chapter: 'Integrasi Aplikasi',
  duration: '20–22 menit',
  intro: [
    'Sekarang saatnya memakai RabbitMQ dari kode aplikasi sungguhan. Di ekosistem Node.js, pustaka resmi yang paling umum untuk AMQP 0-9-1 adalah <b>amqplib</b>. Dengan pustaka ini, aplikasi kamu bisa menjadi publisher (pengirim pesan) maupun consumer (penerima pesan) tanpa harus berurusan dengan detail protokol AMQP secara manual.',
    'Bab ini akan membangun sebuah <i>worker queue</i> lengkap: publisher yang mengirim tugas, worker yang memprosesnya dengan mekanisme acknowledgment, prefetch agar beban terdistribusi, serta penanganan error dan graceful shutdown yang rapi. Pola-pola inilah yang menjadi kerangka kerja aplikasi antrean produksi sehari-hari.',
    'Setelah menyelesaikan bab ini, kamu akan memiliki dua file JavaScript siap pakai — <code>publisher.js</code> dan <code>worker.js</code> — yang bisa kamu jalankan, ubah, dan kembangkan sesuai kebutuhan. Pola yang sama akan kita ulang dengan bahasa berbeda pada bab Go dan Java berikutnya.'
  ],
  objectives: [
    'Memasang dan memuat pustaka amqplib di proyek Node.js.',
    'Menulis publisher yang mengirim pesan JSON ke antrean dengan properti persistent.',
    'Menulis consumer/worker yang memakai manual acknowledgment, prefetch, dan penanganan error.',
    'Menerapkan graceful shutdown agar tidak ada pesan yang hilang saat aplikasi berhenti.'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Siapkan proyek Node.js baru dan pasang amqplib:</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 200" width="760" role="img" aria-label="Alur worker queue Node.js: publisher mengirim tugas, worker memproses dengan ack dan prefetch">
        <rect x="30" y="40" width="130" height="50" rx="8" class="u-box"/>
        <text x="95" y="70" class="u-title" text-anchor="middle">publisher.js</text>

        <line x1="165" y1="65" x2="245" y2="65" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="205" y="53" class="u-lbl" text-anchor="middle">sendToQueue</text>

        <rect x="250" y="40" width="170" height="50" rx="8" class="u-hd"/>
        <text x="335" y="60" class="u-title" text-anchor="middle">Queue: tasks</text>
        <text x="335" y="80" class="u-lbl" text-anchor="middle">durable + persistent</text>

        <line x1="425" y1="65" x2="505" y2="65" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="465" y="53" class="u-lbl" text-anchor="middle">prefetch(1)</text>

        <rect x="510" y="40" width="150" height="50" rx="8" class="u-box"/>
        <text x="585" y="70" class="u-title" text-anchor="middle">worker.js</text>

        <line x1="585" y1="95" x2="585" y2="135" class="u-dash" marker-end="url(#u-arrow)"/>
        <text x="660" y="118" class="u-lbl" text-anchor="middle">ack / nack</text>

        <rect x="30" y="145" width="700" height="45" rx="8" class="u-box"/>
        <text x="380" y="172" class="u-lbl" text-anchor="middle">Graceful shutdown: cancel consumer → selesaikan yang berjalan → tutup channel &amp; koneksi</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 12.1</b> — Worker queue Node.js: publisher mengirim tugas persistent, worker memproses dengan ack dan prefetch</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Menyiapkan proyek dan memasang amqplib',
      lang: 'bash',
      output: false,
      code: `# Buat folder proyek dan masuk ke dalamnya
mkdir rabbitmq-nodejs && cd rabbitmq-nodejs

# Inisialisasi package.json (ikuti prompt, boleh pakai -y)
npm init -y

# Pasang amqplib
npm install amqplib

# Pastikan RabbitMQ sudah berjalan di Podman
podman ps --filter name=rabbitmq-server`,
      explain: [
        '<code>npm init -y</code> membuat package.json tanpa interaksi; file ini mencantumkan dependensi proyek kamu.',
        '<code>amqplib</code> adalah pustaka AMQP 0-9-1 populer untuk Node.js yang mendukung koneksi, channel, ack, prefetch, dan fitur RabbitMQ lainnya.',
        'Memeriksa container memastikan RabbitMQ benar-benar aktif sebelum kode aplikasi dijalankan — koneksi akan gagal bila broker mati.'
      ]
    },
    {
      type: 'example',
      title: 'publisher.js — mengirim tugas ke antrean',
      lang: 'javascript',
      output: false,
      code: `const amqp = require('amqplib');

const QUEUE = 'tasks';

async function publishTask(task) {
  const conn = await amqp.connect('amqp://admin:admin123@localhost:5672');
  const ch = await conn.createChannel();
  await ch.assertQueue(QUEUE, { durable: true });

  const payload = JSON.stringify(task);
  ch.sendToQueue(QUEUE, Buffer.from(payload), { persistent: true });
  console.log('Tugas terkirim:', task);

  await ch.close();
  await conn.close();
}

publishTask({ id: 1, action: 'resize-image', file: 'photo.jpg' });`,
      explain: [
        "<code>amqp.connect</code> menerima URL dengan format amqp://user:pass@host:port — sama dengan kredensial yang kita buat di Podman.",
        "<code>assertQueue</code> dengan durable: true memastikan antrean bertahan walau broker restart; sendToQueue mengirim pesan langsung ke antrean bernama QUEUE.",
        'Properti <code>persistent: true</code> membuat pesan ikut terdorong ke disk; tanpa ini, pesan bisa hilang bila broker mati mendadak.'
      ]
    },
    {
      type: 'text',
      html: '<p>Jalankan publisher dengan <code>node publisher.js</code>. Pesan akan masuk ke antrean <code>tasks</code> dan menunggu sampai ada worker yang membacanya. Sekarang kita buat sisi pemrosesnya.</p>'
    },
    {
      type: 'example',
      title: 'worker.js — memproses tugas dengan acknowledgment dan prefetch',
      lang: 'javascript',
      output: false,
      code: `const amqp = require('amqplib');

const QUEUE = 'tasks';

async function main() {
  const conn = await amqp.connect('amqp://admin:admin123@localhost:5672');
  const ch = await conn.createChannel();
  await ch.assertQueue(QUEUE, { durable: true });

  // Batasi jumlah pesan unacknowledged per worker
  ch.prefetch(1);

  ch.consume(QUEUE, async (msg) => {
    try {
      const task = JSON.parse(msg.content.toString());
      console.log('Memproses:', task.action, 'id', task.id);

      // Simulasikan pekerjaan berat
      await new Promise(r => setTimeout(r, 2000));

      // Pekerjaan selesai — akui pesan
      ch.ack(msg);
      console.log('Selesai:', task.id);
    } catch (err) {
      console.error('Gagal memproses:', err.message);
      // Tolak pesan tanpa requeue agar tidak loop tanpa henti;
      // pesan akan jatuh ke DLQ bila antrean dikonfigurasi DLX.
      ch.nack(msg, false, false);
    }
  }, { noAck: false });
}

main().catch(console.error);`,
      explain: [
        '<code>ch.prefetch(1)</code> membatasi satu pesan unacknowledged per worker — pola fair dispatch dari bab 9, mencegah satu worker kebanjiran sementara yang lain menganggur.',
        "<code>noAck: false</code> menyalakan mode manual acknowledgment; pesan tetap di antrean sampai dipanggil ch.ack(msg) sebagai tanda berhasil diproses.",
        'Pesan yang gagal diproses ditolak dengan <code>ch.nack(msg, false, false)</code> — requeue=false agar tidak berputar terus; dengan konfigurasi DLX, pesan itu akan mendarat di dead letter queue.'
      ]
    },
    {
      type: 'text',
      html: '<p>Buka terminal terpisah dan jalankan <code>node worker.js</code>. Kamu bisa menjalankan beberapa worker sekaligus — masing-masing akan menerima tugas secara adil berkat prefetch. Perhatikan di dashboard: kolom <i>Ready</i> menyusut saat worker memproses, dan <i>Unacknowledged</i> naik turun mengikuti pekerjaan yang sedang berjalan.</p>'
    },
    {
      type: 'tip',
      title: 'Gunakan Nodemon saat Pengembangan',
      text: 'Untuk mempercepat pengembangan, kamu bisa memakai nodemon atau node --watch agar worker otomatis restart ketika kode berubah. Namun pastikan shutdown-nya tetap rapi (lihat langkah berikutnya) agar pesan yang sedang diproses tidak menggantung.'
    },
    {
      type: 'text',
      html: '<h3>Graceful Shutdown</h3><p>Salah satu kesalahan klasik aplikasi antrean adalah berhenti mendadak. Ketika kamu menekan Ctrl+C, koneksi TCP langsung terputus — dan pesan yang sedang diproses (belum di-ack) akan dikembalikan broker ke antrean. Untuk sistem sederhana ini cukup aman, tetapi untuk aplikasi produksi kita harus melakukan <b>graceful shutdown</b>: berhenti menerima pesan baru, selesaikan yang sedang berjalan, lalu tutup koneksi.</p>'
    },
    {
      type: 'example',
      title: 'Graceful shutdown pada worker',
      lang: 'javascript',
      output: false,
      code: `const amqp = require('amqplib');

async function main() {
  const conn = await amqp.connect('amqp://admin:admin123@localhost:5672');
  const ch = await conn.createChannel();
  await ch.assertQueue('tasks', { durable: true });
  ch.prefetch(1);

  let consumerTag = null;

  ch.consume('tasks', async (msg) => {
    // proses seperti biasa, lalu ch.ack(msg)
    await new Promise(r => setTimeout(r, 2000));
    ch.ack(msg);
  }, { noAck: false }).then((ok) => {
    consumerTag = ok.consumerTag;
  });

  async function shutdown() {
    console.log('Menerima sinyal berhenti, menutup koneksi dengan rapi...');
    if (consumerTag) await ch.cancel(consumerTag); // berhenti menerima pesan baru
    await ch.close();
    await conn.close();
    console.log('Koneksi ditutup. Aman berhenti.');
    process.exit(0);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(console.error);`,
      explain: [
        '<code>ch.cancel(consumerTag)</code> memberi tahu broker bahwa worker tidak lagi menerima pesan baru, tetapi pesan yang sedang diproses tetap diprioritaskan.',
        'Setelah membatalkan consumer, <code>ch.close()</code> dan <code>conn.close()</code> menutup channel dan koneksi secara tertib — memastikan tidak ada pesan yang hilang atau menggantung.',
        'Menangani SIGINT (Ctrl+C) dan SIGTERM (perintah berhenti container/pod) membuat worker siap dipakai di lingkungan Podman/Kubernetes tanpa risiko kehilangan pekerjaan.'
      ]
    },
    {
      type: 'warn',
      title: 'Jangan Exit Sebelum Ack',
      text: 'Jangan pernah memanggil process.exit() sebelum ch.ack(msg) — pesan yang belum diakui akan dikembalikan ke antrean, tetapi bila pekerjaannya tidak idempoten (misal sudah menulis ke database), kamu bisa memproses data ganda. Selalu akui pesan setelah pekerjaannya benar-benar selesai.'
    },
    {
      type: 'text',
      html: '<p>Dengan ini kamu memiliki kerangka aplikasi antrean Node.js yang lengkap: publisher mengirim tugas persistent, worker memprosesnya dengan acknowledgment, prefetch menjaga distribusi beban, dan shutdown tertib menjaga integritas pesan. Pola yang sama persis — hanya dengan sintaks berbeda — akan kita bangun di bab Go berikutnya, sehingga kamu bisa membandingkan bagaimana konsep AMQP dipetakan ke berbagai bahasa.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['amqplib', 'Pustaka JavaScript untuk AMQP 0-9-1 yang menjadi standar de facto RabbitMQ di Node.js.'],
        ['Publisher', 'Aplikasi yang mengirim pesan ke exchange atau antrean RabbitMQ.'],
        ['Consumer', 'Aplikasi yang menerima dan memproses pesan dari antrean.'],
        ['ConsumerTag', 'Pengenal unik untuk sebuah consumer pada channel, dipakai untuk membatalkan langganan pesan.'],
        ['Graceful Shutdown', 'Proses berhenti yang tertib — berhenti menerima pesan baru, menyelesaikan yang berjalan, lalu menutup koneksi.']
      ]
    }
  ],
  recap: [
    'amqplib adalah pustaka AMQP 0-9-1 populer untuk Node.js yang dipasang lewat npm install amqplib.',
    'Publisher mengirim pesan JSON dengan sendToQueue dan properti persistent:true agar pesan tahan restart broker.',
    'Consumer memakai manual acknowledgment (noAck:false) dan prefetch(1) untuk distribusi beban yang adil.',
    'Graceful shutdown dilakukan dengan membatalkan consumer, menutup channel dan koneksi secara berurutan sebelum keluar.'
  ]
});
