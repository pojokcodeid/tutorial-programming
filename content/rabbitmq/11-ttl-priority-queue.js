/* ============================================================
   Pelajaran RabbitMQ — Bab 11: TTL Pesan & Priority Queue
   ============================================================ */
'use strict';

window.RABBITMQ_LESSONS = window.RABBITMQ_LESSONS || [];

window.RABBITMQ_LESSONS.push({
  id: 'ttl-priority-queue',
  title: 'TTL Pesan dan Priority Queue',
  chapter: 'Keandalan Pesan',
  duration: '16–18 menit',
  intro: [
    'Tidak semua pesan relevan selamanya. Kode promo yang harus kedaluwarsa pukul 24.00, pesan verifikasi yang hanya berlaku lima menit, atau tugas yang sudah terlambat dan tak lagi bernilai — semuanya membutuhkan mekanisme kadaluarsa. RabbitMQ mendukung hal ini melalui fitur <b>Time To Live (TTL)</b>, yang membuat pesan otomatis dibuang atau dialsirkan ke dead letter setelah rentang waktu tertentu.',
    'Selain TTL, RabbitMQ juga mendukung <b>Priority Queue</b> — antrean yang mengeluarkan pesan berdasarkan tingkat prioritas, bukan semata urutan kedatangan. Dalam sistem dengan bermacam tugas (peringatan kritikal, laporan besar, notifikasi santai), prioritas memastikan yang penting lebih dulu dilayani tanpa harus memisah antrean secara manual.',
    'Bab ini akan mempraktikkan keduanya: mengatur TTL pada level pesan maupun antrean, memahami bagaimana interaksi TTL dengan dead letter, lalu membangun antrean dengan prioritas tinggi dan rendah. Kedua fitur ini melengkapi pola reliability dari bab sebelumnya dan dipakai kembali pada latihan retry di praktik proyek.'
  ],
  objectives: [
    'Menjelaskan perbedaan TTL pada level pesan dan level antrean serta kapan memakai masing-masing.',
    'Membuat antrean dengan TTL bawaan (x-message-ttl) dan mengatur expired message ke DLQ.',
    'Mengamati bagaimana pesan kedaluarsa dialsirkan otomatis ke dead letter exchange.',
    'Membuat dan memakai priority queue (x-max-priority) serta memahami batasannya.'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Dua Level TTL: Pesan dan Antrean</h3><p>Time To Live menentukan berapa lama sebuah pesan boleh tinggal di antrean. Setelah batas waktu itu terlampaui, pesan dianggap kedaluarsa (<i>expired</i>). RabbitMQ mendukung TTL pada dua level: <b>per pesan</b> (diatur publisher saat mengirim) dan <b>per antrean</b> (berlaku untuk semua pesan dalam antrean). Keduanya bisa dipakai bersamaan, dan nilai per pesan yang lebih kecil yang akan menang untuk pesan tersebut.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Perbandingan antrean dengan TTL yang mengalir ke DLQ dan priority queue yang mengeluarkan pesan berprioritas tinggi lebih dulu">
        <rect x="20" y="30" width="350" height="120" rx="10" class="u-box"/>
        <text x="195" y="54" class="u-title" text-anchor="middle">Antrean dengan TTL</text>
        <line x1="36" y1="64" x2="354" y2="64" class="u-line"/>
        <rect x="40" y="80" width="150" height="40" rx="6" class="u-hd"/>
        <text x="115" y="104" class="u-lbl" text-anchor="middle">x-message-ttl 60s</text>
        <line x1="194" y1="100" x2="240" y2="100" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="244" y="80" width="110" height="40" rx="6" class="u-box"/>
        <text x="299" y="104" class="u-lbl" text-anchor="middle">DLQ</text>
        <text x="195" y="140" class="u-lbl" text-anchor="middle">Pesan kedaluarsa dialsirkan ke dead letter</text>

        <rect x="390" y="30" width="350" height="120" rx="10" class="u-box"/>
        <text x="565" y="54" class="u-title" text-anchor="middle">Priority Queue</text>
        <line x1="406" y1="64" x2="724" y2="64" class="u-line"/>
        <rect x="410" y="80" width="80" height="40" rx="6" class="u-hd"/>
        <text x="450" y="104" class="u-lbl" text-anchor="middle">prio 9</text>
        <rect x="500" y="80" width="80" height="40" rx="6" class="u-box"/>
        <text x="540" y="104" class="u-lbl" text-anchor="middle">prio 5</text>
        <rect x="590" y="80" width="80" height="40" rx="6" class="u-box"/>
        <text x="630" y="104" class="u-lbl" text-anchor="middle">prio 1</text>
        <line x1="450" y1="130" x2="690" y2="130" class="u-dash" marker-end="url(#u-arrow)"/>
        <text x="565" y="140" class="u-lbl" text-anchor="middle">prio tinggi keluar lebih dulu</text>

        <rect x="20" y="185" width="720" height="95" rx="10" class="u-box"/>
        <text x="380" y="212" class="u-title" text-anchor="middle">Kapan memakai masing-masing?</text>
        <line x1="36" y1="222" x2="724" y2="222" class="u-line"/>
        <text x="380" y="244" class="u-lbl" text-anchor="middle">TTL: pesan yang kehilangan relevansi bila terlambat (kode promo, token)</text>
        <text x="380" y="262" class="u-lbl" text-anchor="middle">Priority: pesan yang tetap sah, tetapi tingkat kepentingannya berbeda-beda</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 11.1</b> — TTL mengalirkan pesan kedaluarsa ke DLQ; priority queue mengeluarkan pesan berprioritas tinggi lebih dulu</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Mengatur TTL pada level pesan (per message)',
      lang: 'javascript',
      output: false,
      code: `const amqp = require('amqplib');

async function main() {
  const conn = await amqp.connect('amqp://admin:admin123@localhost:5672');
  const ch = await conn.createChannel();
  await ch.assertQueue('promos', { durable: true });

  const payload = JSON.stringify({ kode: 'HEMAT50', diskon: 50 });

  // Pesan ini hanya berlaku 10 detik; setelah itu dianggap expired.
  ch.sendToQueue('promos', Buffer.from(payload), {
    persistent: true,
    expiration: '10000' // milidetik, sebagai string
  });

  console.log('Kode promo terkirim dengan TTL 10 detik');
  await ch.close();
  await conn.close();
}

main().catch(console.error);`,
      explain: [
        'Properti <code>expiration</code> diberikan pada saat publish, dalam milidetik dan berupa string — ini mengatur masa berlaku pesan tersebut saja.',
        '<code>persistent: true</code> memastikan pesan ikut terdorong ke disk; tanpa ini, pesan bisa hilang bila broker dimatikan sebelum TTL habis.',
        'Tanpa consumer yang membaca, pesan akan tetap expired setelah 10 detik; dengan konfigurasi DLX pada antrean, pesan expired akan dialsirkan ke dead letter queue.'
      ]
    },
    {
      type: 'example',
      title: 'Mengatur TTL pada level antrean (x-message-ttl)',
      lang: 'bash',
      output: false,
      code: `# Antrean dengan TTL bawaan 60 detik, terhubung ke DLQ
curl -u admin:admin123 -X POST http://localhost:15672/api/queues/%2F/promos \\
  -H "content-type: application/json" \\
  -d '{
    "durable": true,
    "arguments": {
      "x-message-ttl": 60000,
      "x-dead-letter-exchange": "",
      "x-dead-letter-routing-key": "promos.dlq"
    }
  }'

# Lalu buat antrean DLQ-nya
curl -u admin:admin123 -X POST http://localhost:15672/api/queues/%2F/promos.dlq \\
  -H "content-type: application/json" \\
  -d '{ "durable": true }'`,
      explain: [
        '<code>x-message-ttl</code> menetapkan masa berlaku bawaan untuk semua pesan dalam antrean, dalam milidetik.',
        'Pasangan <code>x-dead-letter-exchange</code> dan <code>x-dead-letter-routing-key</code> membuat pesan yang kedaluarsa tidak hilang, melainkan terkumpul di antrean promos.dlq untuk diperiksa.',
        'Antrean DLQ dibuat terpisah tanpa argumen TTL agar pesan yang masuk tidak ikut kedaluarsa di dalamnya.'
      ]
    },
    {
      type: 'text',
      html: '<p>Setelah konfigurasi di atas, jalankan publisher tanpa consumer. Tunggu lebih dari 10 detik, lalu periksa antrean <code>promos.dlq</code> melalui API: pesan promo yang kedaluarsa akan terlihat di sana. Pola ini berguna nyata — misalnya, kode promo yang belum sempat diproses sistem saat masa berlakunya habis otomatis terkumpul dan bisa diaudit, bukan sembunyi diam-diam di antrean.</p>'
    },
    {
      type: 'warn',
      title: 'TTL dan Urutan Pesan',
      text: 'TTL per pesan yang berbeda-beda dapat memengaruhi urutan pengeluaran pesan. RabbitMQ hanya mendahulukan pesan expired bila ia berada di posisi terdepan antrean; pesan expired di tengah antrean baru dialsirkan saat tiba gilirannya. Karena itu, jangan mengandalkan TTL untuk urutan yang ketat — gunakan priority queue bila yang kamu butuhkan adalah pembedaan tingkat kepentingan.'
    },
    {
      type: 'text',
      html: '<h3>Priority Queue: Mengutamakan yang Penting</h3><p>Sekarang kita beralih ke <b>Priority Queue</b>. Secara default, antrean bersifat FIFO — pesan keluar sesuai urutan masuk. Priority queue menambahkan satu lapis: setiap pesan membawa angka prioritas (0–255), dan pesan dengan prioritas lebih tinggi dikeluarkan lebih dahulu. Antrean dibuat dengan argumen <code>x-max-priority</code> yang menentukan batas prioritas tertinggi yang didukung.</p>'
    },
    {
      type: 'example',
      title: 'Membuat antrean prioritas dan mengirim pesan dengan prioritas',
      lang: 'javascript',
      output: false,
      code: `const amqp = require('amqplib');

async function main() {
  const conn = await amqp.connect('amqp://admin:admin123@localhost:5672');
  const ch = await conn.createChannel();

  // x-max-priority: 10 — antrean mendukung prioritas 0 sampai 10
  await ch.assertQueue('tasks', {
    durable: true,
    arguments: { 'x-max-priority': 10 }
  });

  // Kirim tiga pesan dengan prioritas berbeda, urutan masuk sengaja dibalik
  ch.sendToQueue('tasks', Buffer.from('Laporan bulanan (rendah)'), { priority: 1 });
  ch.sendToQueue('tasks', Buffer.from('Pembayaran tertunda (tinggi)'), { priority: 9 });
  ch.sendToQueue('tasks', Buffer.from('Sinkronisasi data (sedang)'), { priority: 5 });

  console.log('Tiga tugas terkirim dengan prioritas berbeda');
  await ch.close();
  await conn.close();
}

main().catch(console.error);`,
      explain: [
        "Argumen <code>'x-max-priority': 10</code> membuat antrean mendukung nilai prioritas 0–10; pesan tanpa properti priority dianggap prioritas 0.",
        "Properti <code>priority</code> pada publish menentukan tingkat pesan — meski 'Laporan bulanan' dikirim lebih dulu, 'Pembayaran tertunda' dengan prioritas 9 akan keluar lebih dulu.",
        'Consumer tidak perlu diubah — ia cukup membaca antrean seperti biasa, dan RabbitMQ yang mengatur urutan keluar berdasarkan prioritas.'
      ]
    },
    {
      type: 'text',
      html: '<p>Uji dengan membuka dashboard, masuk ke antrean <code>tasks</code>, lalu Get Messages tanpa mengaktifkan consumer. Pesan dengan prioritas 9 akan muncul paling atas, disusul prioritas 5, lalu 1. Sesederhana itu sistem kamu menjadi sadar prioritas.</p>'
    },
    {
      type: 'tip',
      title: 'Nilai x-max-priority Sebaiknya Kecil',
      text: 'Gunakan nilai x-max-priority yang kecil (misal 5 atau 10). Semakin banyak tingkat prioritas, semakin besar overhead pemrosesan di broker. Untuk kebanyakan aplikasi, cukup 2–3 tingkat: tinggi, sedang, rendah.'
    },
    {
      type: 'text',
      html: '<p>Kedua fitur ini saling melengkapi dengan bab sebelumnya. TTL memberi batas waktu dan menjadi bahan baku pola retry (antrean retry ber-TTL yang mengembalikan pesan ke antrean utama). Priority queue memastikan tugas penting tidak antre di belakang tugas ringan. Di praktik proyek nanti, kamu akan memakai keduanya dalam satu sistem penanganan pesan yang lengkap.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Time To Live (TTL)', 'Batas waktu hidup sebuah pesan di antrean, diukur dalam milidetik.'],
        ['Expired Message', 'Pesan yang telah melewati batas TTL dan tidak lagi diproses, biasanya dialsirkan ke DLQ.'],
        ['x-message-ttl', 'Argumen antrean yang menetapkan masa berlaku bawaan untuk semua pesan di dalamnya.'],
        ['Priority Queue', 'Antrean yang mengeluarkan pesan berdasarkan angka prioritas, bukan hanya urutan kedatangan.'],
        ['x-max-priority', 'Argumen antrean yang menentukan nilai prioritas maksimum yang didukung (rentang 0–255).']
      ]
    }
  ],
  recap: [
    'TTL (Time To Live) mengatur masa berlaku pesan di antrean; dapat diatur per pesan (expiration saat publish) atau per antrean (x-message-ttl).',
    'Pesan yang kedaluarsa dapat dialsirkan otomatis ke DLQ bila antrean dikonfigurasi dengan x-dead-letter-exchange.',
    'Priority queue dibuat dengan argumen x-max-priority; pesan berprioritas tinggi (0–255) dikeluarkan lebih dahulu.',
    'Gunakan nilai x-max-priority kecil dan sadari keterbatasan: pesan expired hanya diperiksa saat berada di posisi terdepan antrean.'
  ]
});
