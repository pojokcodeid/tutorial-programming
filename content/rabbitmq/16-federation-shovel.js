/* ============================================================
   Pelajaran RabbitMQ — Bab 16: Federation & Shovel
   ============================================================ */
'use strict';

window.RABBITMQ_LESSONS = window.RABBITMQ_LESSONS || [];

window.RABBITMQ_LESSONS.push({
  id: 'federation-shovel',
  title: 'Federation dan Shovel untuk Multi-Region',
  chapter: 'High Availability',
  duration: '18–20 menit',
  intro: [
    'Clustering menyelesaikan masalah kegagalan satu node dalam satu lokasi, tetapi bagaimana bila kamu punya dua pusat data di kota berbeda, atau harus berbagi pesan dengan mitra di luar jaringanmu? Menyatukan semuanya dalam satu cluster besar justru berisiko — latensi jaringan dan keamanan menjadi masalah. RabbitMQ menawarkan dua solusi khusus untuk skenario ini: <b>Federation</b> dan <b>Shovel</b>.',
    'Federation bekerja pada level <i>exchange</i> dan <i>queue</i>: ia menyalin pesan dari exchange atau antrean di satu broker ke broker lain, dengan hubungan "upstream" (sumber) dan "downstream" (tujuan). Shovel bekerja pada level yang lebih rendah, memindahkan pesan dari sebuah antrean di satu broker menuju exchange atau antrean di broker lain, layaknya pengangkut yang bolak-balik mengambil dan menurunkan muatan.',
    'Keduanya memungkinkan arsitektur antar-lokasi yang tahan latensi dan tahan gangguan: ketika koneksi antar-lokasi terputus sementara, pesan menumpuk dengan aman di broker asal, lalu dilanjutkan begitu jalur pulih. Bab ini akan mempraktikkan keduanya dengan dua instance RabbitMQ terpisah di Podman.'
  ],
  objectives: [
    'Menjelaskan perbedaan federation dan shovel serta kasus penggunaan masing-masing.',
    'Menjalankan dua instance RabbitMQ terpisah untuk mensimulasikan dua lokasi.',
    'Mengonfigurasi federation pada level exchange agar pesan mengalir antar broker.',
    'Mengonfigurasi shovel untuk memindahkan pesan dari antrean lokal ke broker remote.'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Federation vs Shovel</h3><p>Perbedaan mendasar antara keduanya: <b>Federation</b> bersifat deklaratif dan bekerja pada level routing — ia menautkan exchange atau antrean tertentu sehingga pesan yang masuk di sisi "downstream" dapat ditarik dari "upstream". <b>Shovel</b> bersifat eksplisit dan bekerja pada level konsumsi-pengiriman — ia seperti consumer sekaligus publisher yang menghubungkan dua titik tertentu secara langsung.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Perbandingan arsitektur federation dan shovel antar dua broker RabbitMQ">
        <rect x="20" y="30" width="350" height="120" rx="10" class="u-box"/>
        <text x="195" y="54" class="u-title" text-anchor="middle">Federation (exchange-to-exchange)</text>
        <line x1="36" y1="64" x2="354" y2="64" class="u-line"/>
        <rect x="40" y="80" width="130" height="40" rx="6" class="u-hd"/>
        <text x="105" y="104" class="u-lbl" text-anchor="middle">Broker A (upstream)</text>
        <line x1="175" y1="100" x2="230" y2="100" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="235" y="80" width="120" height="40" rx="6" class="u-box"/>
        <text x="295" y="104" class="u-lbl" text-anchor="middle">Broker B (down)</text>
        <text x="195" y="140" class="u-lbl" text-anchor="middle">Tarik pesan dari exchange upstream</text>

        <rect x="390" y="30" width="350" height="120" rx="10" class="u-box"/>
        <text x="565" y="54" class="u-title" text-anchor="middle">Shovel (queue-to-remote)</text>
        <line x1="406" y1="64" x2="724" y2="64" class="u-line"/>
        <rect x="410" y="80" width="120" height="40" rx="6" class="u-hd"/>
        <text x="470" y="104" class="u-lbl" text-anchor="middle">Queue A</text>
        <line x1="535" y1="100" x2="590" y2="100" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="595" y="80" width="120" height="40" rx="6" class="u-box"/>
        <text x="655" y="104" class="u-lbl" text-anchor="middle">Exchange B</text>
        <text x="565" y="140" class="u-lbl" text-anchor="middle">Konsumsi lalu teruskan eksplisit</text>

        <rect x="20" y="185" width="720" height="95" rx="10" class="u-box"/>
        <text x="380" y="212" class="u-title" text-anchor="middle">Kapan memakai masing-masing?</text>
        <line x1="36" y1="222" x2="724" y2="222" class="u-line"/>
        <text x="380" y="244" class="u-lbl" text-anchor="middle">Federation: replikasi exchange menyeluruh antar-lokasi</text>
        <text x="380" y="262" class="u-lbl" text-anchor="middle">Shovel: pengangkutan antrean terkontrol, atau ke sistem non-RabbitMQ</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 16.1</b> — Federation menautkan exchange; shovel memindahkan isi antrean ke broker remote secara eksplisit</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Menjalankan dua broker untuk simulasi dua lokasi',
      lang: 'bash',
      output: false,
      code: `# Lokasi A (utama) — port 5672 dan dashboard 15672
podman run -d --name rabbitmq-a \\
  -e RABBITMQ_DEFAULT_USER=admin \\
  -e RABBITMQ_DEFAULT_PASS=admin123 \\
  -p 5672:5672 -p 15672:15672 \\
  docker.io/library/rabbitmq:3-management

# Lokasi B (remote) — port 5673 dan dashboard 15673
podman run -d --name rabbitmq-b \\
  -e RABBITMQ_DEFAULT_USER=admin \\
  -e RABBITMQ_DEFAULT_PASS=admin123 \\
  -p 5673:5673 -p 15673:15673 \\
  docker.io/library/rabbitmq:3-management

sleep 15 && podman ps --filter name=rabbitmq-`,
      explain: [
        'Dua container mewakili dua broker terpisah pada dua "lokasi"; port berbeda membedakan keduanya pada host yang sama.',
        'RABBITMQ_DEFAULT_USER dan RABBITMQ_DEFAULT_PASS mengatur kredensial admin sejak awal, sehingga kedua broker siap dipakai tanpa langkah setup tambahan.',
        'Federation dan shovel berkomunikasi lewat port AMQP (5672/5673), sehingga kedua port harus aktif dan saling terjangkau sebelum konfigurasi diaktifkan.'
      ]
    },
    {
      type: 'example',
      title: 'Mengaktifkan plugin federation',
      lang: 'bash',
      output: false,
      code: `# Aktifkan plugin federation pada broker tujuan (B)
podman exec rabbitmq-b rabbitmq-plugins enable rabbitmq_federation
podman exec rabbitmq-b rabbitmq-plugins enable rabbitmq_federation_management

# Aktifkan juga pada broker asal (A) bila diperlukan arah sebaliknya
podman exec rabbitmq-a rabbitmq-plugins enable rabbitmq_federation`,
      explain: [
        'rabbitmq_federation adalah plugin inti yang menyediakan fitur federation pada level broker.',
        'rabbitmq_federation_management menambahkan tab Federation pada dashboard, sehingga status hubungan upstream/downstream bisa dipantau secara visual.',
        'Federation bersifat dua arah bila dikonfigurasi demikian; untuk sederhananya, kita aktifkan pada kedua broker agar keduanya bisa menjadi upstream maupun downstream.'
      ]
    },
    {
      type: 'example',
      title: 'Mengonfigurasi federation pada exchange',
      lang: 'bash',
      output: false,
      code: `# Di broker B (downstream), buat exchange lokal lalu tautkan ke upstream (A)
podman exec rabbitmq-b rabbitmqctl set_parameter federation-upstream \\
  my-upstream '{
    "uri":"amqp://admin:admin123@localhost:5672",
    "expires":3600000
  }'

# Terapkan policy federation pada exchange logs di broker B
podman exec rabbitmq-b rabbitmqctl set_policy fed-logs "^logs$" \\
  '{
    "federation-upstream-set":"all"
  }' --apply-to exchanges

# Periksa status lewat API manajemen broker B
curl -u admin:admin123 http://localhost:15673/api/federation-links`,
      explain: [
        'set_parameter federation-upstream mendefinisikan "sumber" (upstream) berupa URI AMQP menuju broker asal, termasuk kredensial dan portnya.',
        'set_policy dengan federation-upstream-set=all menautkan exchange bernama logs di broker B dengan upstream yang sudah didefinisikan.',
        'API federation-links menampilkan status hubungan; setelah link berstatus "running", pesan exchange logs di broker A akan ditarik ke broker B secara otomatis.'
      ]
    },
    {
      type: 'text',
      html: '<p>Setelah federation berjalan, kirim pesan ke exchange <code>logs</code> di broker A, dan amati di dashboard broker B: pesan yang sama akan muncul pada exchange logs di sisi B. Inilah dasar replikasi exchange antar-lokasi.</p>'
    },
    {
      type: 'text',
      html: '<h3>Shovel: Pengangkutan Eksplisit Antrean</h3><p>Sekarang praktikkan <b>Shovel</b>. Berbeda dengan federation yang menautkan exchange, shovel kita konfigurasi untuk memindahkan isi sebuah antrean lokal menuju exchange di broker remote — cocok untuk skenario "antrean pekerjaan di lokasi lama diproses oleh layanan di lokasi baru".</p>'
    },
    {
      type: 'example',
      title: 'Mengaktifkan dan mengonfigurasi shovel',
      lang: 'bash',
      output: false,
      code: `# Aktifkan plugin shovel pada broker A
podman exec rabbitmq-a rabbitmq-plugins enable rabbitmq_shovel
podman exec rabbitmq-a rabbitmq-plugins enable rabbitmq_shovel_management

# Buat antrean lokal di broker A
curl -u admin:admin123 -X POST http://localhost:15672/api/queues/%2F/incoming \\
  -H "content-type: application/json" \\
  -d '{ "durable": true }'

# Konfigurasi shovel: ambil dari antrean incoming (A), kirim ke exchange default (B)
podman exec rabbitmq-a rabbitmqctl set_parameter shovel forward-shovel \\
  '{
    "src-uri":"amqp://localhost",
    "src-queue":"incoming",
    "dest-uri":"amqp://admin:admin123@localhost:5673",
    "dest-exchange":"",
    "dest-queue":"incoming",
    "ack-mode":"on-confirm"
  }'`,
      explain: [
        'Plugin rabbitmq_shovel harus aktif di broker sumber; rabbitmq_shovel_management menambahkan tab Shovel pada dashboard untuk pemantauan.',
        'Parameter src-queue menentukan antrean asal yang dikonsumsi shovel, sedangkan dest-uri menunjuk broker tujuan beserta port dan kredensialnya.',
        'ack-mode on-confirm berarti shovel hanya mengakui pesan setelah broker tujuan mengonfirmasi penerimaan — pesan tidak dianggap sampai sebelum benar-benar diterima.'
      ]
    },
    {
      type: 'tip',
      title: 'Pilih Federation atau Shovel?',
      text: 'Untuk kebanyakan kasus antar-lokasi, mulailah dari federation bila yang ingin disalin adalah exchange/topik secara menyeluruh. Gunakan shovel bila kamu butuh kontrol presisi atas aliran antrean tertentu, atau bila sistem tujuan bukan RabbitMQ sepenuhnya (shovel lebih fleksibel untuk integrasi sepihak).'
    },
    {
      type: 'warn',
      title: 'Siapkan Kapasitas untuk Penumpukan Sementara',
      text: 'Federation dan shovel tetap bergantung pada koneksi jaringan antar broker. Bila jalur terputus, pesan menumpuk di broker asal (untuk shovel, di antrean sumber) sampai koneksi pulih. Pastikan kapasitas penyimpanan dan pemantauan DLQ memadai agar penumpukan ini tidak berubah menjadi kehilangan data atau kehabisan disk.'
    },
    {
      type: 'text',
      html: '<p>Kini kamu memiliki pola konektivitas antar-lokasi: federation untuk replikasi exchange yang otomatis, dan shovel untuk pengangkutan pesan yang terkontrol. Keduanya melengkapi strategi ketahanan dari bab clustering. Di bab berikutnya, kita akan mengunci akses ke seluruh infrastruktur ini dengan user, vhost, permission, dan TLS.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Upstream', 'Broker atau antrean sumber yang menjadi asal penyalinan pesan pada federation.'],
        ['Downstream', 'Broker tujuan yang menerima salinan pesan dari upstream.'],
        ['Federation', 'Mekanisme RabbitMQ untuk menyalin pesan antar broker pada level exchange atau queue.'],
        ['Shovel', 'Mekanisme RabbitMQ untuk memindahkan pesan dari satu titik (antrean) ke titik lain (exchange/antrean) di broker berbeda.'],
        ['ack-mode', 'Pengaturan shovel yang menentukan kapan pesan diakui, misalnya on-confirm setelah broker tujuan mengonfirmasi.']
      ]
    }
  ],
  recap: [
    'Federation menyalin pesan antar broker pada level exchange atau queue; shovel memindahkan pesan dari antrean lokal ke broker remote.',
    'Federation memakai konsep upstream (sumber) dan downstream (tujuan); shovel didefinisikan dengan src-uri dan dest-uri.',
    'Plugin rabbitmq_federation dan rabbitmq_shovel harus diaktifkan; keduanya punya varian management untuk pemantauan di dashboard.',
    'Ketika jalur antar-lokasi terputus, pesan menumpuk dengan aman di broker asal sampai koneksi pulih.'
  ]
});
