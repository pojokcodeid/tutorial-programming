/* ============================================================
   Pelajaran RabbitMQ — Bab 19: Tuning untuk Production
   ============================================================ */
'use strict';

window.RABBITMQ_LESSONS = window.RABBITMQ_LESSONS || [];

window.RABBITMQ_LESSONS.push({
  id: 'tuning-production',
  title: 'Tuning RabbitMQ untuk Production',
  chapter: 'Optimasi Produksi',
  duration: '22–24 menit',
  intro: [
    'Pengaturan default RabbitMQ dirancang agar aman dan berjalan di banyak mesin, bukan agar maksimal. Ketika sistem mulai menangani trafik produksi — ribuan pesan per detik, ratusan koneksi, atau pesan berukuran besar — beberapa parameter perlu disesuaikan agar broker tidak menjadi botol leher. Bab ini membahas <b>tuning</b> praktis yang paling berdampak.',
    'Topik utamanya meliputi mekanisme <b>publisher confirm</b> (memastikan pesan benar-benar diterima broker), pengaturan <b>prefetch</b> dan <b>memory/disk alarm</b>, pemilihan tipe antrean yang tepat, serta serangkaian <b>anti-pattern</b> yang wajib dihindari. Pendekatannya sederhana: ukur dulu, ubah satu per satu, dan validasi ulang — jangan menebak.',
    'Setelah bab ini kamu akan memiliki daftar periksa (checklist) tuning untuk menyongsong trafik produksi, beserta pemahaman mengapa beberapa kebiasaan yang tampak sederhana justru bisa menggoyang broker di beban tinggi.'
  ],
  objectives: [
    'Menjelaskan cara kerja publisher confirm dan kapan harus mengaktifkannya.',
    'Mengatur nilai prefetch, memory dan disk alarm agar sesuai beban nyata.',
    'Mengidentifikasi anti-pattern umum RabbitMQ dan menghindarinya.',
    'Menyusun checklist tuning sederhana sebelum sistem masuk produksi.'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Mengapa Tuning Penting di Produksi?</h3><p>Bayangkan kamu membangun sistem pemrosesan pesan untuk e-commerce pada jam ramai. Dalam hitungan menit, ribuan pesanan berdatangan. Tanpa tuning, broker bisa kehabisan memori, consumer kewalahan, dan pesan tertunda. Dengan tuning yang tepat, sistem tetap stabil walau trafik melonjak. Mari mulai dari konsep paling penting: memastikan pesan benar-benar tersimpan.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 230" width="760" role="img" aria-label="Alur publisher confirm yang menunggu balasan resmi broker sebelum menganggap pesan terkirim">
        <rect x="30" y="40" width="170" height="60" rx="8" class="u-box"/>
        <text x="115" y="75" class="u-title" text-anchor="middle">Publisher</text>

        <line x1="205" y1="60" x2="285" y2="60" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="245" y="48" class="u-lbl" text-anchor="middle">publish</text>

        <rect x="290" y="40" width="170" height="60" rx="8" class="u-hd"/>
        <text x="375" y="75" class="u-title" text-anchor="middle">RabbitMQ Broker</text>

        <line x1="375" y1="105" x2="375" y2="150" class="u-dash" marker-end="url(#u-arrow)"/>
        <text x="450" y="130" class="u-lbl" text-anchor="middle">simpan ke disk (persistent)</text>

        <line x1="465" y1="60" x2="545" y2="60" class="u-dash" marker-end="url(#u-arrow)"/>
        <text x="505" y="48" class="u-lbl" text-anchor="middle">confirm</text>

        <rect x="550" y="40" width="170" height="60" rx="8" class="u-box"/>
        <text x="635" y="75" class="u-title" text-anchor="middle">Publisher: aman</text>

        <rect x="30" y="165" width="700" height="50" rx="8" class="u-box"/>
        <text x="380" y="195" class="u-lbl" text-anchor="middle">Hanya setelah confirm diterima, pesan dianggap benar-benar tersimpan di broker</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 19.1</b> — Publisher confirm memastikan pesan diterima (dan disimpan) broker sebelum dianggap terkirim</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Publisher Confirm</h3><p><b>Publisher Confirm</b> adalah mekanisme bawaan RabbitMQ untuk menjamin pengiriman. Tanpa konfirmasi, publisher hanya mengirim pesan ke channel dan berasumsi pesan diterima — bila broker kehabisan memori tepat saat itu, pesan bisa hilang tanpa jejak. Dengan confirm, broker memberi balasan resmi setiap pesan diterima dan (bila persistent) disimpan dengan aman.</p>'
    },
    {
      type: 'example',
      title: 'Menggunakan publisher confirm (Node.js)',
      lang: 'javascript',
      output: false,
      code: `const amqp = require('amqplib');

async function main() {
  const conn = await amqp.connect('amqp://admin:admin123@localhost:5672');
  const ch = await conn.createChannel();
  await ch.assertQueue('critical', { durable: true });

  // Aktifkan mode confirm
  await ch.confirmChannel();

  // Kirim dengan menunggu konfirmasi broker
  await ch.publish('', 'critical', Buffer.from('data penting'), {
    persistent: true
  });

  console.log('Pesan terkonfirmasi tersimpan di broker');
  await ch.close();
  await conn.close();
}

main().catch(console.error);`,
      explain: [
        'ch.confirmChannel() mengubah channel ke mode confirm; tanpa ini, publish hanya mengirim asinkron tanpa balasan resmi.',
        'Publish pada channel confirm mengembalikan Promise yang terpenuhi hanya setelah broker mengonfirmasi — ini tanda nyata pesan sudah diterima.',
        'Untuk trafik tinggi, pertimbangkan publisher confirm kolektif (batch) guna mengurangi jumlah round-trip, terutama bila pesan sangat banyak dan ukurannya kecil.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Menyetel Prefetch dan Alarm Sumber Daya</h3><p>Selanjutnya, dua parameter yang paling sering disetel ulang pada sistem produksi: <b>prefetch</b> dan <b>alarm sumber daya</b>. Seperti yang sudah dipelajari pada bab Fair Dispatch, prefetch mengatur berapa pesan unacknowledged yang diberikan ke tiap consumer. Nilai prefetch yang terlalu besar membanjiri memori consumer; terlalu kecil membuatnya sering menunggu.</p>'
    },
    {
      type: 'example',
      title: 'Contoh pengaturan broker untuk beban produksi',
      lang: 'ini',
      output: false,
      code: `# rabbitmq.conf — konfigurasi ringkas untuk beban tinggi

# Batas memori sebelum broker menolak koneksi baru (dalam MB)
vm_memory_high_watermark.relative = 0.6

# Batas disk bebas (dalam bytes) untuk memicu alarm
disk_free_limit.absolute = 2GB

# Timeout koneksi agar koneksi mati tidak menumpuk
heartbeat = 60

# Jumlah file descriptor maksimal
file_handle_cache.open_limit = 4096`,
      explain: [
        'vm_memory_high_watermark.relative=0.6 membuat broker mulai menolak koneksi baru ketika memori terpakai 60% — menyisakan ruang aman sebelum OOM.',
        'disk_free_limit.absolute=2GB memicu alarm disk ketika ruang bebas tinggal 2GB, mencegah kehilangan data pada pesan persistent.',
        'heartbeat=60 deteksi koneksi mati lebih cepat (dibanding default 60 detik), membebaskan sumber daya dan mencegah tumpukan koneksi zombie.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Anti-pattern yang Wajib Dihindari</h3><p>Sekarang mari bahas <b>anti-pattern</b> — kesalahan umum yang sering ditemui pada sistem RabbitMQ produksi:</p>'
    },
    {
      type: 'example',
      title: 'Daftar anti-pattern yang harus dihindari',
      lang: 'text',
      output: false,
      code: `# 1. Menggunakan default exchange untuk routing kompleks
#    -> buat exchange khusus (direct/topic/fanout) sesuai kebutuhan

# 2. Memakai auto-delete queue untuk data penting
#    -> gunakan durable=true dan atur DLX sebagai jaring pengaman

# 3. Mengirim pesan sangat besar (>10MB) dalam satu pesan
#    -> pecah menjadi beberapa pesan atau gunakan objek storage terpisah

# 4. Menumpuk ribuan consumer pada satu antrean tanpa prefetch
#    -> atur prefetch dan pantau Unacknowledged di dashboard

# 5. Mengabaikan monitoring dan alerts
#    -> pasang Prometheus + Grafana seperti bab sebelumnya`,
      explain: [
        'Default exchange tidak mendukung pola routing yang kompleks; penggunaan berlebihan membuat sistem sulit berkembang dan dipelihara.',
        'Auto-delete queue menghilang ketika consumer terakhir putus — berbahaya untuk data yang harus bertahan walau layanan restart.',
        'Pesan besar membebani memori broker dan memperlambat konsumsi; lebih baik simpan payload besar di storage terpisah dan kirimkan referensinya via antrean.'
      ]
    },
    {
      type: 'tip',
      title: 'Ukur Dulu, Ubah Satu per Satu',
      text: 'Terapkan prinsip "ukur dulu, ubah satu per satu". Perubahan tuning yang dilakukan serentak membuatmu tidak tahu parameter mana yang berdampak. Uji dengan beban nyata (misal dengan tools seperti perf-test dari RabbitMQ) sebelum dan sesudah perubahan, lalu bandingkan metriknya.'
    },
    {
      type: 'warn',
      title: 'Jangan Turunkan Watermark Terlalu Rendah',
      text: 'Jangan menurunkan vm_memory_high_watermark terlalu rendah tanpa alasan — broker yang terlalu sering menolak koneksi baru akan mengganggu publisher justru saat trafik sedang tinggi. Temukan keseimbangan berdasarkan profil beban nyata sistemmu.'
    },
    {
      type: 'text',
      html: '<p>Ringkasnya, tuning RabbitMQ bukan ilmu gaib — ia berangkat dari pemahaman profil trafik dan penerapan prinsip-prinsip konservatif: pastikan pesan terkonfirmasi, jaga prefetch tetap wajar, siapkan alarm memori/disk, dan hindari anti-pattern yang sudah dikenal luas. Dengan bekal ini, kamu siap menyongsong trafik produksi. Di bab terakhir, kita rangkum seluruh materi dalam sebuah proyek praktik end-to-end.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Publisher Confirm', 'Mekanisme RabbitMQ yang memberi balasan resmi saat pesan diterima broker.'],
        ['Vm Memory High Watermark', 'Ambang memori yang memicu broker menolak koneksi baru sebagai proteksi.'],
        ['Disk Free Limit', 'Batas ruang disk bebas yang memicu alarm sebelum kehabisan penyimpanan.'],
        ['Heartbeat', 'Sinyal berkala yang mendeteksi koneksi mati dan membebaskan sumber daya broker.'],
        ['Anti-pattern', 'Praktik yang tampak berfungsi tetapi menimbulkan masalah pada skala produksi.']
      ]
    }
  ],
  recap: [
    'Publisher confirm memastikan pesan benar-benar diterima broker; aktifkan untuk data kritis.',
    'Vm_memory_high_watermark dan disk_free_limit menjadi rem darurat saat sumber daya menipis.',
    'Hindari anti-pattern: default exchange untuk routing kompleks, auto-delete queue untuk data penting, pesan terlalu besar, dan consumer tanpa prefetch.',
    'Prinsip tuning: ukur dulu, ubah satu per satu, validasi ulang dengan beban nyata.'
  ]
});
