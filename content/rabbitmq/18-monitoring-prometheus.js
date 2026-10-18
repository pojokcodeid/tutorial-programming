/* ============================================================
   Pelajaran RabbitMQ — Bab 18: Monitoring Prometheus & Grafana
   ============================================================ */
'use strict';

window.RABBITMQ_LESSONS = window.RABBITMQ_LESSONS || [];

window.RABBITMQ_LESSONS.push({
  id: 'monitoring-prometheus',
  title: 'Monitoring dengan Prometheus dan Grafana',
  chapter: 'Monitoring',
  duration: '20–22 menit',
  intro: [
    'Sistem antrean yang berjalan tanpa pemantauan ibarat kendaraan tanpa panel instrumen — kamu baru tahu ada masalah ketika mesin sudah mogok di tengah jalan. RabbitMQ menghasilkan banyak metrik berguna: jumlah pesan menumpuk, laju pesan masuk/keluar, koneksi aktif, penggunaan memori, hingga peringatan (<i>alarm</i>) internal broker. Metrik ini bisa dikumpulkan oleh <b>Prometheus</b> dan divisualisasikan di <b>Grafana</b>.',
    'RabbitMQ menyediakan plugin <code>rabbitmq_prometheus</code> yang mengekspos seluruh metrik broker dalam format Prometheus, tanpa perlu prosesor perantara. Prometheus akan mengambil (scrape) metrik tersebut secara berkala, menyimpannya dalam basis data waktu-nya, dan Grafana menampilkannya dalam bentuk dashboard yang mudah dibaca.',
    'Bab ini akan memasang ketiganya di Podman, membuat dasbor RabbitMQ pertamamu, dan yang terpenting: mengenali metrik-metrik kunci yang wajib dipantau serta ambang peringatan yang masuk akal. Dengan pemantauan ini, kamu bisa mendeteksi kemacetan jauh sebelum pengguna mengeluh.'
  ],
  objectives: [
    'Mengaktifkan plugin rabbitmq_prometheus dan memeriksa endpoint metrik.',
    'Menjalankan Prometheus dengan konfigurasi untuk mengambil metrik dari RabbitMQ.',
    'Menjalankan Grafana dan mengimpor dasbor RabbitMQ bawaan.',
    'Mengenali metrik kunci RabbitMQ dan menyusun ambang peringatan yang wajar.'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Langkah pertama: aktifkan plugin Prometheus pada RabbitMQ. Plugin ini menambahkan endpoint khusus yang menyajikan seluruh metrik broker dalam format yang dimengerti Prometheus.</p>'
    },
    {
      type: 'example',
      title: 'Mengaktifkan plugin rabbitmq_prometheus',
      lang: 'bash',
      output: false,
      code: `# Aktifkan plugin pada container RabbitMQ
podman exec rabbitmq-server rabbitmq-plugins enable rabbitmq_prometheus

# Verifikasi endpoint metrik
curl http://localhost:15672/metrics | head -30`,
      explain: [
        'Perintah rabbitmq-plugins enable mengaktifkan plugin tanpa perlu restart container — perubahan langsung berlaku.',
        'Endpoint /metrics menyajikan metrik dalam format teks Prometheus (jumlah pesan, koneksi, memori, dan lainnya).',
        'Pada RabbitMQ versi 3.8 ke atas, plugin ini sudah tersedia bawaan; mengaktifkannya cukup dengan satu perintah.'
      ]
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 220" width="760" role="img" aria-label="Arsitektur pemantauan: RabbitMQ mengekspos metrik, Prometheus mengambilnya, lalu Grafana memvisualisasikan">
        <rect x="30" y="60" width="180" height="70" rx="10" class="u-hd"/>
        <text x="120" y="90" class="u-title" text-anchor="middle">RabbitMQ</text>
        <text x="120" y="112" class="u-lbl" text-anchor="middle">/metrics (Prometheus)</text>

        <line x1="215" y1="95" x2="285" y2="95" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="250" y="82" class="u-lbl" text-anchor="middle">scrape</text>

        <rect x="290" y="60" width="180" height="70" rx="10" class="u-box"/>
        <text x="380" y="90" class="u-title" text-anchor="middle">Prometheus</text>
        <text x="380" y="112" class="u-lbl" text-anchor="middle">time-series DB</text>

        <line x1="475" y1="95" x2="545" y2="95" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="510" y="82" class="u-lbl" text-anchor="middle">query</text>

        <rect x="550" y="60" width="180" height="70" rx="10" class="u-box"/>
        <text x="640" y="90" class="u-title" text-anchor="middle">Grafana</text>
        <text x="640" y="112" class="u-lbl" text-anchor="middle">dasbor &amp; alerting</text>

        <rect x="30" y="160" width="700" height="45" rx="8" class="u-box"/>
        <text x="380" y="188" class="u-lbl" text-anchor="middle">Metrik kunci: pesan siap/unack, laju trafik, koneksi, alarm memori &amp; disk</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 18.1</b> — RabbitMQ mengekspos metrik, Prometheus mengambil berkala, dan Grafana memvisualisasikan dengan dasbor</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Konfigurasi Prometheus (prometheus.yml)',
      lang: 'yaml',
      output: false,
      code: `global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: "rabbitmq"
    static_configs:
      - targets: ["rabbitmq-server:15672"]`,
      explain: [
        'scrape_interval 15s berarti Prometheus mengambil metrik setiap 15 detik — frekuensi yang wajar untuk pemantauan operasional.',
        'targets menunjuk ke alamat endpoint metrik RabbitMQ dalam format host:port; dalam kontainer Podman, gunakan nama container sebagai hostname.',
        'Setiap job menjadi unit pengumpulan terpisah, sehingga kamu bisa menambah job lain (misal aplikasimu sendiri) di kemudian hari.'
      ]
    },
    {
      type: 'text',
      html: '<p>Setelah Prometheus berjalan dan berhasil mengambil metrik, langkah terakhir adalah memvisualisasikannya dengan Grafana. Kamu bisa mengimpor dasbor RabbitMQ bawaan yang sudah memuat panel-panel penting sehingga tidak perlu merancang dari nol.</p>'
    },
    {
      type: 'example',
      title: 'Menjalankan Prometheus dan Grafana di Podman',
      lang: 'bash',
      output: false,
      code: `# Buat konfigurasi Prometheus, lalu jalankan
podman run -d --name prometheus \\
  -p 9090:9090 \\
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml:z \\
  docker.io/prom/prometheus

# Jalankan Grafana dengan password admin
podman run -d --name grafana \\
  -p 3000:3000 \\
  -e GF_SECURITY_ADMIN_PASSWORD=admin123 \\
  docker.io/grafana/grafana

# Buka browser: Prometheus di http://localhost:9090, Grafana di http://localhost:3000`,
      explain: [
        'prometheus.yml di-mount dari host agar konfigurasi scrape target mudah diubah tanpa masuk ke container.',
        'Grafana berjalan dengan password admin bawaan; pada produksi, ganti dengan kredensial kuat dan simpan aman.',
        'Setelah masuk ke Grafana (admin/admin123), tambahkan datasource Prometheus (http://localhost:9090) lalu impor dasbor RabbitMQ dari grafana.com.'
      ]
    },
    {
      type: 'example',
      title: 'Metrik kunci RabbitMQ untuk dipantau',
      lang: 'text',
      output: false,
      code: `# 1. Pesan menumpuk di antrean (siap diproses)
rabbitmq_queue_messages_ready

# 2. Pesan sedang diproses (belum di-ack)
rabbitmq_queue_messages_unacknowledged

# 3. Total pesan masuk/keluar (laju traffic)
rabbitmq_queue_messages_published_total
rabbitmq_queue_messages_delivered_total

# 4. Koneksi dan channel aktif
rabbitmq_connections
rabbitmq_channels

# 5. Kesehatan node dan alarm
rabbitmq_disk_free_alarm
rabbitmq_mem_alarm`,
      explain: [
        'Messages_ready yang terus naik tanpa turun menandakan consumer tidak sanggup mengikuti laju produksi pesan.',
        'Memori dan disk alarm menjadi peringatan keras dari broker: bila memori hampir habis, RabbitMQ akan menolak koneksi baru untuk melindungi diri.',
        'Laju published vs delivered yang jauh berbeda selama periode tertentu dapat mengindikasikan kebocoran atau bottleneck pemrosesan.'
      ]
    },
    {
      type: 'tip',
      title: 'Rancang Empat Panel Utama',
      text: 'Susun dashboard Grafana dengan minimal empat panel utama: (1) jumlah pesan per antrean, (2) laju publish vs deliver, (3) jumlah consumer aktif, dan (4) memori/disk node. Empat panel ini sudah cukup untuk mendeteksi sebagian besar masalah operasional sehari-hari.'
    },
    {
      type: 'warn',
      title: 'Tetapkan Ambang Peringatan',
      text: 'Jangan hanya memantau tanpa batas ambang. Tetapkan peringatan (alerting) yang jelas, misalnya: pesan menumpuk lebih dari 1000 selama 5 menit, atau jumlah consumer aktif turun ke nol pada antrean penting. Peringatan tanpa ambang akan tenggelam di lautan notifikasi dan kehilangan makna.'
    },
    {
      type: 'text',
      html: '<p>Dengan Prometheus dan Grafana yang terpasang, kamu kini memiliki visibilitas penuh atas perilaku RabbitMQ: dari laju trafik, kesehatan node, hingga penumpukan antrean. Monitoring ini adalah mata dari sistemmu — dan seperti mata, ia harus selalu terbuka. Dari sini kita lanjut ke topik akhir teknis: mengoptimalkan RabbitMQ untuk beban produksi sesungguhnya.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Prometheus', 'Sistem pemantauan yang mengambil dan menyimpan metrik dalam format time series.'],
        ['Grafana', 'Platform visualisasi yang memetakan data Prometheus menjadi dasbor interaktif.'],
        ['Scrape', 'Proses pengambilan metrik berkala yang dilakukan Prometheus terhadap target pemantauan.'],
        ['Endpoint /metrics', 'Alamat khusus RabbitMQ yang mengekspos metrik dalam format Prometheus.'],
        ['Alarm (mem/disk)', 'Peringatan internal RabbitMQ saat sumber daya menipis, memicu proteksi broker.']
      ]
    }
  ],
  recap: [
    'Plugin rabbitmq_prometheus mengekspos metrik RabbitMQ pada endpoint /metrics tanpa perantara.',
    'Prometheus mengambil metrik secara berkala (scrape) dan menyimpannya untuk query dan alerting.',
    'Grafana memvisualisasikan metrik dari Prometheus; dasbor RabbitMQ bawaan bisa langsung diimpor.',
    'Metrik kunci meliputi jumlah pesan siap/unacknowledged, laju trafik, koneksi aktif, serta alarm memori dan disk.'
  ]
});
