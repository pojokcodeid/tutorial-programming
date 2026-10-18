/* ============================================================
   Pelajaran RabbitMQ — Bab 20: Praktik Proyek End-to-End
   ============================================================ */
'use strict';

window.RABBITMQ_LESSONS = window.RABBITMQ_LESSONS || [];

window.RABBITMQ_LESSONS.push({
  id: 'praktik-proyek',
  title: 'Praktik Proyek: Sistem Antrean End-to-End',
  chapter: 'Praktik Proyek',
  duration: '28–30 menit',
  intro: [
    'Selamat! Kamu telah menempuh perjalanan panjang: dari konsep dasar antrean, tipe exchange, acknowledgment, dead letter, cluster, hingga keamanan dan pemantauan. Bab penutup ini menyatukan semua menjadi satu praktik utuh: membangun <b>sistem antrean end-to-end</b> yang lengkap dengan worker queue, pola retry, dan graceful shutdown.',
    'Proyek ini terbagi dalam tiga skenario yang saling berurutan. <b>Skenario 1</b> membangun worker queue sederhana untuk memproses tugas. <b>Skenario 2</b> menambahkan pola publisher-subscriber dengan retry dan dead letter queue untuk menangani kegagalan. <b>Skenario 3</b> menyempurnakan sistem dengan graceful shutdown yang menjamin tidak ada pesan yang hilang saat aplikasi berhenti.',
    'Setiap skenario dilengkapi kode lengkap, langkah praktik, dan penjelasan mengapa keputusan tertentu diambil. Anggap bab ini sebagai latihan mandiri yang bisa kamu ulang kapan saja — pola yang kamu bangun di sini langsung bisa dipakai sebagai kerangka proyek nyata.'
  ],
  objectives: [
    'Merangkum seluruh materi RabbitMQ menjadi satu sistem kerja yang utuh.',
    'Membangun worker queue dengan acknowledgment dan prefetch yang benar.',
    'Menerapkan pola retry dengan dead letter queue untuk penanganan kegagalan.',
    'Menyelesaikan sistem dengan graceful shutdown yang menjaga integritas pesan.'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Sebelum mulai, pastikan RabbitMQ sudah berjalan di Podman dengan nama <code>rabbitmq-server</code>, image <code>rabbitmq:3-management</code>, dan kredensial <code>admin</code>/<code>admin123</code> sesuai seluruh materi sebelumnya. Siapkan juga proyek Node.js dengan <code>npm install amqplib</code>.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Arsitektur proyek akhir: publisher, antrean dengan retry dan DLQ, serta worker yang graceful">
        <rect x="30" y="40" width="130" height="50" rx="8" class="u-box"/>
        <text x="95" y="70" class="u-title" text-anchor="middle">Publisher</text>

        <line x1="165" y1="65" x2="245" y2="65" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="205" y="53" class="u-lbl" text-anchor="middle">publish</text>

        <rect x="250" y="30" width="190" height="70" rx="8" class="u-hd"/>
        <text x="345" y="55" class="u-title" text-anchor="middle">events.worker</text>
        <text x="345" y="78" class="u-lbl" text-anchor="middle">antrean utama</text>

        <line x1="445" y1="50" x2="525" y2="50" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="485" y="38" class="u-lbl" text-anchor="middle">ack</text>

        <rect x="530" y="30" width="160" height="50" rx="8" class="u-box"/>
        <text x="610" y="60" class="u-title" text-anchor="middle">Worker</text>

        <line x1="345" y1="105" x2="345" y2="150" class="u-dash" marker-end="url(#u-arrow)"/>
        <text x="430" y="130" class="u-lbl" text-anchor="middle">nack requeue=false</text>

        <rect x="250" y="155" width="190" height="50" rx="8" class="u-box"/>
        <text x="345" y="175" class="u-title" text-anchor="middle">events.retry</text>
        <text x="345" y="195" class="u-lbl" text-anchor="middle">TTL 5s</text>

        <line x1="445" y1="180" x2="525" y2="180" class="u-dash" marker-end="url(#u-arrow)"/>
        <text x="485" y="168" class="u-lbl" text-anchor="middle">balik lagi</text>

        <rect x="530" y="155" width="160" height="50" rx="8" class="u-box"/>
        <text x="610" y="175" class="u-title" text-anchor="middle">events.dlq</text>
        <text x="610" y="195" class="u-lbl" text-anchor="middle">cadangan</text>

        <rect x="30" y="235" width="700" height="50" rx="8" class="u-hd"/>
        <text x="380" y="265" class="u-lbl" text-anchor="middle">Graceful shutdown: cancel consumer → tunggu selesai → tutup channel &amp; koneksi</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 20.1</b> — Alur proyek akhir: publisher, antrean dengan retry &amp; DLQ, dan worker yang graceful</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Skenario 1: Worker Queue Sederhana</h3><p>Mulai dari yang paling mendasar: satu antrean, satu publisher, satu worker. Tujuan skenario ini memastikan kamu nyaman dengan pola publish-consume dan acknowledgment.</p>'
    },
    {
      type: 'example',
      title: 'setup.js — menyiapkan antrean dasar',
      lang: 'javascript',
      output: false,
      code: `const amqp = require('amqplib');

async function setup() {
  const conn = await amqp.connect('amqp://admin:admin123@localhost:5672');
  const ch = await conn.createChannel();
  await ch.assertQueue('tasks.basic', { durable: true });
  console.log('Antrean tasks.basic siap digunakan');
  await ch.close();
  await conn.close();
}

setup().catch(console.error);`,
      explain: [
        "Antrean tasks.basic dibuat dengan durable=true agar tetap ada walau broker restart.",
        'Memisahkan setup dari publisher/worker membuat kode lebih rapi dan memudahkan pengulangan praktik.',
        'Jalankan sekali dengan node setup.js untuk membuat antrean sebelum memakai publisher dan worker.'
      ]
    },
    {
      type: 'text',
      html: '<p>Jalankan <code>node publisher.js</code> untuk mengirim beberapa tugas, lalu <code>node worker.js</code> untuk memprosesnya. Perhatikan di dashboard: pesan berpindah dari kolom Ready ke Unacknowledged, lalu hilang setelah di-ack. Skenario 1 selesai ketika kamu melihat alur ini berjalan lancar.</p>'
    },
    {
      type: 'text',
      html: '<h3>Skenario 2: Publisher-Subscriber dengan Retry</h3><p>Sekarang tingkatkan sistem: satu pesan harus bisa diterima banyak subscriber (polanya seperti fanout), dan kegagalan pemrosesan harus ditangani dengan retry sebelum jatuh ke DLQ. Ini adalah bentuk nyata dari reliability yang sudah dipelajari pada bab Dead Letter dan TTL.</p>'
    },
    {
      type: 'example',
      title: 'setup.js — antrean dengan retry & DLQ',
      lang: 'javascript',
      output: false,
      code: `const amqp = require('amqplib');

async function setup() {
  const conn = await amqp.connect('amqp://admin:admin123@localhost:5672');
  const ch = await conn.createChannel();

  await ch.assertExchange('events', 'fanout', { durable: true });

  // Antrean consumer dengan DLX menuju retry
  await ch.assertQueue('events.worker', {
    durable: true,
    arguments: { 'x-dead-letter-exchange': 'retry.exchange' }
  });
  await ch.assertQueue('events.retry', {
    durable: true,
    arguments: {
      'x-message-ttl': 5000, // tunggu 5 detik sebelum retry
      'x-dead-letter-exchange': 'events'
    }
  });
  await ch.assertQueue('events.dlq', { durable: true });

  await ch.bind('events.worker', 'events', '');
  await ch.bind('events.retry', 'retry.exchange', '');

  console.log('Antrean events.worker, events.retry, events.dlq siap');
  await ch.close();
  await conn.close();
}

setup().catch(console.error);`,
      explain: [
        "Exchange 'events' bertipe fanout menyiarkan pesan ke semua antrean yang terikat — pola publisher-subscriber.",
        "Antrean 'events.retry' memiliki TTL 5 detik dan dead-letter kembali ke exchange 'events'; inilah inti pola retry: pesan gagal menunggu sebentar di retry, lalu dicoba ulang.",
        "Antrean 'events.dlq' menjadi tempat pesan terakhir bila retry melebihi batas yang ditentukan (misal setelah beberapa percobaan)."
      ]
    },
    {
      type: 'example',
      title: 'worker.js — menangani kegagalan dengan retry',
      lang: 'javascript',
      output: false,
      code: `const amqp = require('amqplib');

async function main() {
  const conn = await amqp.connect('amqp://admin:admin123@localhost:5672');
  const ch = await conn.createChannel();
  await ch.assertQueue('events.worker', { durable: true });
  ch.prefetch(1);

  ch.consume('events.worker', async (msg) => {
    try {
      const event = JSON.parse(msg.content.toString());
      if (event.forceFail) {
        throw new Error('Simulasi kegagalan');
      }
      console.log('Berhasil memproses event:', event.type);
      ch.ack(msg);
    } catch (err) {
      console.log('Gagal, dikirim ke retry:', err.message);
      // Requeue=false agar pesan mengalir ke antrean retry via DLX
      ch.nack(msg, false, false);
    }
  }, { noAck: false });

  console.log('Worker siap memproses events');
}

main().catch(console.error);`,
      explain: [
        'ch.nack(msg, false, false) mengirim pesan gagal ke exchange retry (bukan mengulang langsung) sehingga beban broker tetap terkendali.',
        'Pesan di retry menunggu 5 detik (TTL), lalu otomatis kembali ke exchange events untuk dicoba ulang — inilah pola retry berbasis TTL + DLX.',
        'Pesan yang terus gagal akan berputar di siklus retry; untuk membatasi jumlah percobaan, tambahkan hitungan percobaan pada payload atau kebijakan lain di produksi.'
      ]
    },
    {
      type: 'text',
      html: '<p>Untuk menguji: kirim event dengan properti <code>forceFail: true</code>, lalu amati dashboard — pesan akan berpindah dari events.worker ke events.retry, menunggu lima detik, lalu kembali. Ulangi beberapa kali untuk melihat siklusnya berjalan sebagaimana mestinya.</p>'
    },
    {
      type: 'text',
      html: '<h3>Skenario 3: Graceful Shutdown</h3><p>Terakhir, tambahkan penanganan sinyal berhenti agar worker menyelesaikan pekerjaan yang sedang berjalan sebelum menutup koneksi. Ini mencegah pesan hilang atau diproses ganda saat deploy atau pemberhentian container.</p>'
    },
    {
      type: 'example',
      title: 'worker.js — graceful shutdown pada Skenario 3',
      lang: 'javascript',
      output: false,
      code: `const amqp = require('amqplib');

async function main() {
  const conn = await amqp.connect('amqp://admin:admin123@localhost:5672');
  const ch = await conn.createChannel();
  await ch.assertQueue('events.worker', { durable: true });
  ch.prefetch(1);

  let consumerTag = null;
  let processing = false;

  ch.consume('events.worker', async (msg) => {
    processing = true;
    try {
      const event = JSON.parse(msg.content.toString());
      await new Promise(r => setTimeout(r, 1500)); // simulasi kerja
      console.log('Selesai memproses:', event.type);
      ch.ack(msg);
    } catch (err) {
      ch.nack(msg, false, false);
    } finally {
      processing = false;
    }
  }, { noAck: false }).then(ok => consumerTag = ok.consumerTag);

  async function shutdown() {
    console.log('Mulai graceful shutdown...');
    if (consumerTag) await ch.cancel(consumerTag); // berhenti terima baru
    while (processing) { await new Promise(r => setTimeout(r, 100)); } // tunggu selesai
    await ch.close();
    await conn.close();
    console.log('Shutdown selesai tanpa kehilangan pesan');
    process.exit(0);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(console.error);`,
      explain: [
        'ch.cancel(consumerTag) menghentikan penerimaan pesan baru, tetapi pesan yang sedang diproses tetap berjalan sampai selesai.',
        'Loop processing memastikan program menunggu pemrosesan aktif benar-benar tuntas sebelum menutup channel dan koneksi.',
        'Menangani SIGINT dan SIGTERM membuat worker siap dipakai bersama Podman atau orkestrator lain tanpa risiko kehilangan pesan.'
      ]
    },
    {
      type: 'tip',
      title: 'Simpan Sebagai Template',
      text: 'Simpan ketiga skenario ini sebagai template proyek. Ketika nanti membangun sistem antrean sungguhan, kamu bisa langsung memulai dari pola yang sudah teruji — tinggal menyesuaikan nama antrean, logika bisnis, dan strategi retry sesuai kebutuhan.'
    },
    {
      type: 'warn',
      title: 'Batasi Percobaan Retry',
      text: 'Pada pola retry berbasis DLX tanpa pembatas percobaan, pesan yang selalu gagal akan berputar terus antara worker dan retry queue. Untuk produksi, tambahkan batas jumlah percobaan (misal dengan menghitung header x-death) dan alihkan ke DLQ setelah batas tercapai.'
    },
    {
      type: 'text',
      html: '<p>Dengan selesainya tiga skenario ini, kamu telah mempraktikkan hampir seluruh materi RabbitMQ: exchange, queue, acknowledgment, prefetch, TTL, dead letter, dan graceful shutdown dalam satu sistem yang utuh. Sistem ini bisa dikembangkan lebih jauh — misalnya dengan menambahkan quorum queue untuk ketahanan, TLS untuk keamanan, atau Prometheus untuk pemantauan sesuai bab-bab sebelumnya. Selamat — kamu kini siap memakai RabbitMQ secara mandiri di proyek nyata.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Skenario', 'Tahapan praktik berurutan yang membangun sistem dari dasar hingga lengkap.'],
        ['Fanout Exchange', 'Tipe exchange yang menyiarkan pesan ke semua antrean terikat tanpa penyaringan.'],
        ['Retry Queue', 'Antrean perantara ber-TTL yang mengembalikan pesan gagal untuk dicoba ulang.'],
        ['Graceful Shutdown', 'Proses berhenti yang menyelesaikan pekerjaan berjalan sebelum menutup koneksi.'],
        ['End-to-End System', 'Sistem lengkap yang mencakup seluruh alur dari produksi hingga konsumsi pesan.']
      ]
    }
  ],
  recap: [
    'Skenario 1 membangun worker queue dasar: satu antrean durable, publisher, dan worker dengan acknowledgment.',
    'Skenario 2 menambahkan pola publisher-subscriber (fanout) dengan retry berbasis TTL dan dead letter queue.',
    'Skenario 3 menyempurnakan sistem dengan graceful shutdown yang menunggu pemrosesan aktif selesai sebelum menutup koneksi.',
    'Seluruh materi RabbitMQ kini terangkum dalam satu sistem kerja yang siap dikembangkan menjadi proyek produksi.'
  ]
});
