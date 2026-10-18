/* ============================================================
   Pelajaran RabbitMQ — Bab 17: Keamanan (User, VHost, TLS)
   ============================================================ */
'use strict';

window.RABBITMQ_LESSONS = window.RABBITMQ_LESSONS || [];

window.RABBITMQ_LESSONS.push({
  id: 'keamanan-vhost-tls',
  title: 'Keamanan: User, VHost, Permissions, dan TLS',
  chapter: 'Keamanan',
  duration: '20–22 menit',
  intro: [
    'Sejauh ini kita memakai satu user admin dengan akses penuh ke seluruh broker. Di produksi, pendekatan itu berbahaya: satu kredensial bocor berarti seluruh data antrean ikut terancam. RabbitMQ menyediakan sistem otorisasi berlapis yang terdiri dari <b>user</b>, <b>virtual host (vhost)</b>, dan <b>permission</b> — tiga pilar yang memungkinkan kamu membatasi siapa boleh mengakses apa.',
    '<b>VHost</b> adalah konsep kunci di sini: semacam "ruang nama" atau "broker logis" di dalam satu instalasi RabbitMQ. Setiap vhost memiliki exchange, antrean, dan binding miliknya sendiri yang sepenuhnya terisolasi dari vhost lain. Dengan memisahkan lingkungan (dev, staging, produksi) atau tim ke vhost berbeda, kamu mencegah satu tim mengganggu atau melihat data tim lain meski berbagi satu instalasi fisik.',
    'Selain otorisasi, bab ini juga membahas enkripsi <b>TLS</b> pada port 5671, yang melindungi kredensial dan isi pesan dari penyadapan saat melewati jaringan. Setelah bab ini, kamu akan memiliki pola akses yang aman: user khusus per layanan, vhost per lingkungan, permission serendah mungkin, dan koneksi terenkripsi.'
  ],
  objectives: [
    'Menjelaskan konsep vhost dan perannya sebagai ruang isolasi logical.',
    'Membuat user, vhost, dan mengatur permission (read/write/configure) secara spesifik.',
    'Menerapkan prinsip hak akses minimum (least privilege) pada akun RabbitMQ.',
    'Mengaktifkan TLS pada RabbitMQ untuk mengenkripsi koneksi klien di port 5671.'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Struktur Otorisasi: User, VHost, Permission</h3><p>Mari mulai dari struktur otorisasi dasar RabbitMQ. Setiap koneksi klien selalu menggunakan satu user dan bertindak di dalam satu vhost. Permission mengatur apa yang boleh user lakukan pada vhost tersebut, dibagi menjadi tiga kategori: <code>configure</code> (membuat/menghapus antrean dan exchange), <code>write</code> (mengirim pesan), dan <code>read</code> (membaca/mengonsumsi pesan).</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 290" width="760" role="img" aria-label="Struktur otorisasi RabbitMQ yang terdiri dari user, vhost, dan permission, serta koneksi TLS terenkripsi">
        <rect x="20" y="30" width="220" height="130" rx="10" class="u-box"/>
        <text x="130" y="54" class="u-title" text-anchor="middle">User</text>
        <line x1="36" y1="64" x2="224" y2="64" class="u-line"/>
        <text x="130" y="88" class="u-lbl" text-anchor="middle">payment-svc</text>
        <text x="130" y="108" class="u-lbl" text-anchor="middle">password + tag</text>
        <text x="130" y="130" class="u-lbl" text-anchor="middle">sat layanan</text>

        <rect x="260" y="30" width="220" height="130" rx="10" class="u-box"/>
        <text x="370" y="54" class="u-title" text-anchor="middle">VHost (ruang isolasi)</text>
        <line x1="276" y1="64" x2="464" y2="64" class="u-line"/>
        <text x="370" y="88" class="u-lbl" text-anchor="middle">/ (default)</text>
        <text x="370" y="108" class="u-lbl" text-anchor="middle">/payments</text>
        <text x="370" y="128" class="u-lbl" text-anchor="middle">terpisah total</text>

        <rect x="500" y="30" width="240" height="130" rx="10" class="u-box"/>
        <text x="620" y="54" class="u-title" text-anchor="middle">Permission (regex)</text>
        <line x1="516" y1="64" x2="724" y2="64" class="u-line"/>
        <text x="620" y="88" class="u-lbl" text-anchor="middle">configure: ^pay\\..*</text>
        <text x="620" y="108" class="u-lbl" text-anchor="middle">write:     ^pay\\..*</text>
        <text x="620" y="128" class="u-lbl" text-anchor="middle">read:      ^pay\\..*</text>

        <rect x="20" y="190" width="720" height="80" rx="10" class="u-hd"/>
        <text x="380" y="218" class="u-title" text-anchor="middle">Koneksi Terenkripsi TLS (port 5671)</text>
        <line x1="36" y1="228" x2="724" y2="228" class="u-line"/>
        <text x="380" y="250" class="u-lbl" text-anchor="middle">amqps:// — kredensial dan isi pesan terlindungi dari penyadapan jaringan</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 17.1</b> — Tiga pilar otorisasi RabbitMQ (user, vhost, permission) dilengkapi koneksi terenkripsi TLS</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Membuat vhost khusus untuk tim pembayaran',
      lang: 'bash',
      output: false,
      code: `# Buat vhost baru bernama /payments
curl -u admin:admin123 -X PUT http://localhost:15672/api/vhosts/%2Fpayments \\
  -H "content-type: application/json" \\
  -d '{ "description": "Antrean untuk tim pembayaran" }'

# Periksa daftar vhost
curl -u admin:admin123 http://localhost:15672/api/vhosts`,
      explain: [
        '%2Fpayments adalah encoding URL untuk "/payments" — garis miring diawali persen karena dipakai sebagai bagian path API.',
        'Vhost berfungsi seperti broker terpisah di dalam satu instalasi; exchange dan antrean di /payments tidak akan terlihat dari vhost default /.',
        'Setiap vhost juga memiliki user, permission, dan kebijakan (policy) tersendiri, sehingga isolasinya menyeluruh.'
      ]
    },
    {
      type: 'example',
      title: 'Membuat user khusus layanan dan memberi permission terbatas',
      lang: 'bash',
      output: false,
      code: `# Buat user untuk layanan pembayaran
curl -u admin:admin123 -X PUT http://localhost:15672/api/users/payment-svc \\
  -H "content-type: application/json" \\
  -d '{ "password": "rahasia123", "tags": "monitoring" }'

# Beri permission HANYA pada vhost /payments dengan pola spesifik
curl -u admin:admin123 -X PUT http://localhost:15672/api/permissions/%2Fpayments/payment-svc \\
  -H "content-type: application/json" \\
  -d '{
    "configure": "^pay\\\\..*",
    "write": "^pay\\\\..*",
    "read": "^pay\\\\..*"
  }'`,
      explain: [
        "Parameter tags menentukan peran user; tag kosong ('') membuat user biasa tanpa hak administrator, sesuai prinsip hak akses minimum.",
        'Pola regex pada configure/write/read membatasi user hanya boleh beroperasi pada resource yang namanya diawali "pay." — user tidak bisa mengganggu antrean lain.',
        'Setiap permission bersifat eksplisit per vhost; user ini tidak memiliki akses apa pun pada vhost default / kecuali diberi secara terpisah.'
      ]
    },
    {
      type: 'text',
      html: '<p>Dengan konfigurasi ini, user <code>payment-svc</code> hanya bisa berinteraksi dengan resource yang namanya diawali <code>pay.</code> di vhost <code>/payments</code>. Bila ada upaya mengakses antrean lain, RabbitMQ akan menolak dengan error <code>access_refused</code>. Inilah penerapan prinsip <i>least privilege</i> secara nyata.</p>'
    },
    {
      type: 'tip',
      title: 'Pisahkan VHost per Lingkungan',
      text: 'Pisahkan vhost per lingkungan (dev, staging, production) — bukan hanya per tim. Ini mencegah pesan percobaan dari pengembang masuk ke antrean produksi, dan sebaliknya, mencegah data produksi tidak sengaja terbaca dari lingkungan pengembangan.'
    },
    {
      type: 'text',
      html: '<h3>Mengaktifkan TLS pada Port 5671</h3><p>Sekarang kita beralih ke sisi transport: enkripsi <b>TLS</b>. Tanpa TLS, kredensial dan isi pesan dikirim dalam format terbuka (AMQP) yang bisa disadap bila melewati jaringan yang tidak tepercaya. RabbitMQ mendukung AMQP over TLS pada port bawaan <code>5671</code> — port yang sama dengan 5672 tetapi dengan lapisan enkripsi.</p>'
    },
    {
      type: 'example',
      title: 'Mengaktifkan TLS pada RabbitMQ',
      lang: 'bash',
      output: false,
      code: `# 1. Siapkan sertifikat (untuk belajar: self-signed certificate)
mkdir -p rabbitmq-tls && cd rabbitmq-tls
openssl req -x509 -newkey rsa:4096 -nodes \\
  -keyout key.pem -out cert.pem -days 365 \\
  -subj "/CN=rabbitmq.local"

# 2. Jalankan RabbitMQ dengan TLS aktif di port 5671
podman run -d --name rabbitmq-tls \\
  -e RABBITMQ_DEFAULT_USER=admin \\
  -e RABBITMQ_DEFAULT_PASS=admin123 \\
  -v $(pwd)/key.pem:/etc/rabbitmq/key.pem:z \\
  -v $(pwd)/cert.pem:/etc/rabbitmq/cert.pem:z \\
  -p 5671:5671 -p 15672:15672 \\
  docker.io/library/rabbitmq:3-management

# 3. Di dalam container, aktifkan listener TLS pada rabbitmq.conf
podman exec rabbitmq-tls bash -c "echo 'listeners.ssl.default = 5671' >> /etc/rabbitmq/rabbitmq.conf"
podman exec rabbitmq-tls bash -c "echo 'ssl_options.cacertfile = /etc/rabbitmq/cert.pem' >> /etc/rabbitmq/rabbitmq.conf"
podman exec rabbitmq-tls bash -c "echo 'ssl_options.certfile   = /etc/rabbitmq/cert.pem' >> /etc/rabbitmq/rabbitmq.conf"
podman exec rabbitmq-tls bash -c "echo 'ssl_options.keyfile    = /etc/rabbitmq/key.pem' >> /etc/rabbitmq/rabbitmq.conf"
podman exec rabbitmq-tls bash -c "echo 'ssl_options.verify     = verify_peer' >> /etc/rabbitmq/rabbitmq.conf"
podman exec rabbitmq-tls bash -c "echo 'ssl_options.fail_if_no_peer_cert = false' >> /etc/rabbitmq/rabbitmq.conf"

# 4. Restart agar konfigurasi berlaku
podman restart rabbitmq-tls`,
      explain: [
        'openssl membuat sertifikat self-signed untuk pembelajaran; pada produksi gunakan sertifikat dari CA tepercaya (misal Let\u2019s Encrypt atau CA internal).',
        'listeners.ssl.default = 5671 mengaktifkan listener AMQP over TLS pada port 5671; tanpa konfigurasi ini, RabbitMQ hanya melayani koneksi terbuka.',
        'ssl_options.cacertfile, certfile, dan keyfile menunjuk berkas sertifikat; verify_peer memungkinkan verifikasi klien bila diperlukan mutual-TLS.'
      ]
    },
    {
      type: 'example',
      title: 'Menghubungkan klien dengan TLS (Node.js)',
      lang: 'javascript',
      output: false,
      code: `const amqp = require('amqplib');
const fs = require('fs');

async function main() {
  const conn = await amqp.connect('amqps://admin:admin123@localhost:5671', {
    ca: [fs.readFileSync('rabbitmq-tls/cert.pem')]
  });
  const ch = await conn.createChannel();
  console.log('Terhubung dengan TLS di port 5671');

  await ch.close();
  await conn.close();
}

main().catch(console.error);`,
      explain: [
        'Skema amqps:// memberitahu amqplib untuk memakai TLS; port 5671 adalah port bawaan AMQP over TLS.',
        'Properti ca menerima sertifikat CA (di sini self-signed) agar klien bisa memverifikasi keaslian server.',
        'Dengan TLS aktif, kredensial dan seluruh isi pesan terenkripsi selama dalam perjalanan — penyadap jaringan hanya melihat data teracak.'
      ]
    },
    {
      type: 'warn',
      title: 'Self-signed hanya untuk Belajar',
      text: 'Self-signed certificate cocok untuk pembelajaran, tetapi tidak untuk produksi — klien tidak memiliki dasar kepercayaan bersama dan berisiko menerima server palsu (man-in-the-middle). Di produksi, gunakan sertifikat dari otoritas sertifikat (CA) tepercaya dan pertimbangkan mutual TLS (mTLS) untuk verifikasi dua arah.'
    },
    {
      type: 'text',
      html: '<p>Dengan user terpisah per layanan, vhost per lingkungan, permission serendah mungkin, dan koneksi terenkripsi TLS, fondasi keamanan RabbitMQ kamu kini jauh lebih kuat. Ini adalah standar minimum yang harus ada sebelum sistem antrean dipakai menangani data sensitif di produksi. Di bab berikutnya, kita akan memasang pemantauan Prometheus dan Grafana untuk mengawasi kesehatan broker ini secara menyeluruh.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Virtual Host (VHost)', 'Ruang namespace logical dalam RabbitMQ yang mengisolasi exchange, antrean, dan binding.'],
        ['User', 'Identitas koneksi RabbitMQ; selalu terikat dengan satu vhost dan permission tertentu.'],
        ['Permission', 'Hak akses user pada vhost, terbagi menjadi configure, write, dan read.'],
        ['TLS (Transport Layer Security)', 'Protokol enkripsi yang melindungi data saat lewat jaringan.'],
        ['amqps', 'Skema URI AMQP over TLS (port 5671) yang mengenkripsi komunikasi klien-broker.']
      ]
    }
  ],
  recap: [
    'RabbitMQ memisahkan akses melalui user, virtual host (vhost), dan permission (configure/write/read).',
    'Vhost adalah ruang isolasi logical: exchange dan antrean di dalamnya sepenuhnya terpisah antar vhost.',
    'Permission diberikan per vhost dengan pola regex, menerapkan prinsip least privilege.',
    'TLS mengenkripsi koneksi pada port 5671 dengan skema amqps, melindungi kredensial dan isi pesan.'
  ]
});
