/* ============================================================
   Pelajaran Elasticsearch — 11: Security: User, Role, API Key & TLS
   (Roadmap Level 8C — bab Operasional)
   ============================================================ */
'use strict';

window.ELASTICSEARCH_LESSONS = window.ELASTICSEARCH_LESSONS || [];

window.ELASTICSEARCH_LESSONS.push({
  id: 'security-elasticsearch',
  title: 'Security: User, Role, API Key & TLS',
  chapter: 'Operasional',
  duration: '15 menit',
  intro: [
    'Selama beberapa pelajaran kamu menjalankan Elasticsearch dengan security mati — <code>xpack.security.enabled=false</code> — supaya bisa fokus belajar API. Bayangkan sekarang cluster itu terhubung ke jaringan kantor: <b>siapa pun yang bisa mencapai port 9200 bisa membaca seluruh data, menghapus index, bahkan membanjiri disk</b>. Pada titik ini keamanan bukan lagi pilihan tambahan.',
    'Pelajaran ini membalik pengaturannya. Kamu mengaktifkan security, lalu mempelajari empat lapis yang dipakai Elasticsearch: <b>authentication</b> (siapa kamu), <b>authorization lewat role</b> (apa yang boleh kamu lakukan), <b>API key</b> (kredensial untuk aplikasi), dan <b>TLS</b> (enkripsi saat data melintas). Masing-masing menyelesaikan masalah yang sedikit berbeda dan saling melengkapi.',
    'Catatan penting sejak awal: lab ini dijalankan <b>terpisah</b> dengan security aktif, dan seluruh kredensial hanya untuk latihan — tidak boleh dikirim ke Git. Prinsip yang kamu bawa ke produksi sederhana: <b>jangan pernah mengekspos cluster tanpa autentikasi ke jaringan yang tidak kamu percaya</b>.'
  ],
  objectives: [
    'Mengaktifkan security pada lab terpisah dan memahami konsekuensinya',
    'Membuat user, role, serta role berbasis index privileges dengan prinsip least privilege',
    'Membuat dan menguji API key untuk keperluan aplikasi',
    'Menjelaskan peran TLS, network isolation, dan audit logging dalam keamanan menyeluruh'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Empat lapis keamanan Elasticsearch</h3><p>Keamanan yang baik selalu berlapis, dan Elasticsearch menyediakan keempatnya secara bawaan (fitur X-Pack Security). Pahami perannya satu per satu sebelum menyentuh konfigurasi:</p><table><thead><tr><th>Lapis</th><th>Menjawab</th><th>Contoh</th></tr></thead><tbody><tr><td><b>Authentication</b></td><td>Siapa yang mencoba masuk?</td><td>Username + password, API key</td></tr><tr><td><b>Authorization</b></td><td>Apa yang boleh ia lakukan?</td><td>Role read-only vs role tulis ke index tertentu</td></tr><tr><td><b>TLS/HTTPS</b></td><td>Apakah aman saat melintas?</td><td>Sertifikat, port 9200 dengan https</td></tr><tr><td><b>Network &amp; audit</b></td><td>Siapa yang boleh mencapai &amp; siapa yang melakukan apa?</td><td>Firewall, audit logging</td></tr></tbody></table><p>Perhatikan urutan logikanya: tanpa authentication, authorization tidak berarti (tidak ada identitas untuk dinilai); tanpa TLS, kredensial yang sudah benar bisa disadap di jaringan; tanpa pembatasan jaringan, kamu mengandalkan satu lapis saja. Karena itu checklist keamanan selalu menanyakan keempatnya, bukan hanya yang paling mudah.</p>'
    },
    {
      type: 'example',
      title: 'Mengaktifkan security pada lab terpisah',
      lang: 'cfg',
      output: false,
      code: `# compose-lab-security/ — LAB TERPISAH, jangan dicampur lab biasa
services:
  elasticsearch-secure:
    image: docker.io/library/elasticsearch:8.17.0
    container_name: elasticsearch-secure
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=true
      - xpack.security.http.ssl.enabled=false
      - ELASTIC_PASSWORD=rahasia-lab-hanya-untuk-latihan
      - ES_JAVA_OPTS=-Xms1g -Xmx1g
    ports:
      - "9200:9200"
    networks:
      - secure-lab

networks:
  secure-lab:`,
      explain: [
        'Lab dijalankan di compose dan network terpisah agar pengaturan security-nya tidak mengganggu lab biasa — dan kamu berlatih dari keadaan bersih.',
        '<code>xpack.security.enabled=true</code> mengaktifkan autentikasi dan otorisasi; <code>ELASTIC_PASSWORD</code> mengatur password bawaan user <code>elastic</code> (user superuser).',
        '<code>xpack.security.http.ssl.enabled=false</code> membiarkan HTTP dulu agar kamu fokus ke auth/authorization; TLS dibahas sebagai langkah lanjutan — di produksi, keduanya harus aktif.',
        'Password di sini hanya untuk latihan. Praktik yang benar: simpan di environment/secrets manager, jangan pernah di commit ke Git — lihat peringatan di bawah.'
      ]
    },
    {
      type: 'example',
      title: 'Membuat user, role, dan mengujinya',
      lang: 'http',
      output: false,
      code: `# semua request kini butuh credential
curl -u elastic:rahasia-lab-hanya-untuk-latihan \\
  "http://localhost:9200/_cluster/health?pretty"

# tanpa credential → ditolak (bukti auth aktif)
curl -i "http://localhost:9200/_cluster/health"

# buat role read-only khusus index products
POST /_security/role/products_reader
{
  "indices": [
    {
      "names": ["products"],
      "privileges": ["read"]
    }
  ]
}

# buat user yang memakai role itu
POST /_security/user/ani
{
  "password": "password-ani-lab",
  "roles": ["products_reader"]
}

# uji: user ani boleh membaca products
curl -u ani:password-ani-lab \\
  "http://localhost:9200/products/_count"

# uji: ani TIDAK boleh menulis
curl -u ani:password-ani-lab -X POST \\
  "http://localhost:9200/products/_doc" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "dilarang"}'`,
      explain: [
        'Request tanpa credential menghasilkan status <code>401</code> dengan pesan <code>missing authentication credentials</code> — inilah bukti paling sederhana bahwa security benar-benar menyala.',
        'Role <code>products_reader</code> memakai <code>privileges: ["read"]</code> pada satu index saja — contoh prinsip <b>least privilege</b>: hanya apa yang benar-benar dibutuhkan.',
        'User <code>ani</code> diberi satu role; Elasticsearch menggabungkan seluruh role miliknya menjadi izin efektif — untuk menulis, ia butuh role tambahan yang diberikan secara sadar.',
        'Uji terakhir seharusnya ditolak dengan <code>403</code> (forbidden) — memang sengaja: menguji pembatasan sama pentingnya dengan menguji izin.'
      ]
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Lapis keamanan Elasticsearch: aplikasi mengirim API key atau user password lewat HTTPS dengan TLS, diperiksa authentication lalu authorization dengan role dan index privileges sebelum mencapai data index, seluruh aksi tercatat di audit log">
        <text x="30" y="34" class="u-title" text-anchor="start">Perjalanan satu request yang aman</text>
        <rect x="30" y="60" width="160" height="70" rx="8" class="u-hd"/>
        <text x="110" y="90" class="u-lbl" text-anchor="middle">aplikasi / user</text>
        <text x="110" y="114" class="u-lbl" text-anchor="middle">API key atau user+password</text>
        <line x1="196" y1="95" x2="240" y2="95" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="218" y="82" class="u-lbl" text-anchor="middle">HTTPS</text>
        <rect x="246" y="46" width="260" height="210" rx="10" class="u-box"/>
        <text x="376" y="76" class="u-title" text-anchor="middle">Elasticsearch Security</text>
        <rect x="264" y="92" width="224" height="52" rx="6" class="u-hd"/>
        <text x="376" y="116" class="u-lbl" text-anchor="middle">1. authentication</text>
        <text x="376" y="138" class="u-lbl" text-anchor="middle">siapa kamu?</text>
        <rect x="264" y="156" width="224" height="52" rx="6" class="u-box"/>
        <text x="376" y="180" class="u-lbl" text-anchor="middle">2. authorization</text>
        <text x="376" y="202" class="u-lbl" text-anchor="middle">role + index privileges</text>
        <line x1="512" y1="110" x2="556" y2="110" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="512" y1="190" x2="556" y2="190" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="562" y="60" width="170" height="70" rx="8" class="u-hd"/>
        <text x="647" y="90" class="u-lbl" text-anchor="middle">data index</text>
        <text x="647" y="114" class="u-lbl" text-anchor="middle">read / write sesuai izin</text>
        <rect x="562" y="176" width="170" height="70" rx="8" class="u-box"/>
        <text x="647" y="206" class="u-lbl" text-anchor="middle">audit log</text>
        <text x="647" y="230" class="u-lbl" text-anchor="middle">siapa melakukan apa</text>
        <text x="380" y="286" class="u-lbl" text-anchor="middle">least privilege: izin sesedikit mungkin, seluas yang benar-benar perlu</text>
      </svg></div><figcaption>Authentication mengenal identitas, authorization menilai izin, TLS mengamankan jalur, dan audit logging merekam semuanya.</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'API key untuk aplikasi (bukan user manusia)',
      lang: 'http',
      output: false,
      code: `# buat API key dengan role tertentu dan masa berlaku
POST /_security/api_key
{
  "name": "backend-search-app",
  "role_descriptors": {
    "app_write": {
      "indices": [
        {
          "names": ["products", "orders"],
          "privileges": ["read", "write"]
        }
      ]
    }
  },
  "expiration": "30d"
}

# pakai API key pada request aplikasi
curl -H "Authorization: ApiKey Z2F3R2..." \\
  "http://localhost:9200/products/_search?q=gaming"

# daftar dan cabut bila bocor
GET /_security/api_key
DELETE /_security/api_key
{
  "ids": ["id-api-key-ini"]
}`,
      explain: [
        '<code>role_descriptors</code> membatasi cakupan API key tepat pada index dan hak yang dibutuhkan aplikasi — bahkan bila key bocor, kerusakannya terbatas pada cakupan itu.',
        '<code>expiration: "30d"</code> membuat key kedaluwarsa otomatis; kredensial yang hidup selamanya adalah kredensial yang lupa dicabut saat sudah tidak dipakai.',
        'Header <code>Authorization: ApiKey ...</code> adalah cara aplikasi mengirimkannya — kredensial ini dibuat khusus untuk mesin, bukan untuk login manusia di Kibana.',
        '<code>GET /_security/api_key</code> menampilkan daftar key aktif beserta pemiliknya; cabut segera key yang mencurigakan — cabut lebih cepat daripada menyelidiki lebih lama.'
      ]
    },
    {
      type: 'example',
      title: 'TLS: mengamankan jalur data',
      lang: 'bash',
      output: false,
      code: `# konsep: generate sertifikat lab (self-signed)
openssl req -x509 -newkey rsa:2048 -nodes \\
  -keyout es-lab.key -out es-lab.crt -days 365 \\
  -subj "/CN=elasticsearch-lab"

# setelah sertifikat dipasang pada container, uji dengan HTTPS
curl -k -u elastic:password-lab \\
  https://localhost:9200/_cluster/health?pretty

# bandingkan: HTTP kini seharusnya ditolak / tidak lagi disediakan
curl -i http://localhost:9200/_cluster/health`,
      explain: [
        'Sertifikat self-signed hanya untuk lab — produksi memakai sertifikat dari CA tepercaya agar klien tidak perlu <code>-k</code> (yang justru mematikan verifikasi).',
        '<code>-k</code> menyuruh curl menerima sertifikat yang tidak dikenal; berguna di lab, berbahaya sebagai kebiasaan karena mengabaikan kemungkinan serangan man-in-the-middle.',
        'Dengan TLS aktif, username, password, API key, dan seluruh isi dokumen terenkripsi saat melintasi jaringan — siapa pun yang menyadap hanya melihat data teracak.',
        'TLS juga memastikan klien benar-benar berbicara dengan Elasticsearch kamu (verifikasi identitas server), bukan dengan mesin lain yang menyamar di jaringan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Network isolation, audit, dan kebiasaan keras</h3><p>Di luar fitur bawaan, keamanan juga soal <b>siapa yang boleh mencapai port sama sekali</b>. Port 9200 seharusnya tidak diekspos ke internet publik — taruh Elasticsearch di jaringan internal, akses hanya dari backend, dan bila perlu dari VPN. Audit melengkapi gambaran: ketika terjadi insiden, <code>audit logging</code> memberi tahu siapa mengakses index apa dan kapan.</p><table><thead><tr><th>Praktik</th><th>Di lab</th><th>Di produksi</th></tr></thead><tbody><tr><td>Security</td><td>Boleh mati untuk lab biasa</td><td><b>Wajib aktif</b></td></tr><tr><td>TLS</td><td>Opsional (boleh HTTP)</td><td><b>Wajib</b> untuk lintas jaringan</td></tr><tr><td>Port 9200</td><td>Terbuka di localhost</td><td>Tersembunyi di jaringan internal</td></tr><tr><td>Credential</td><td>Latihan, di compose lab</td><td>Secrets manager, tidak di Git</td></tr><tr><td>Audit log</td><td>Boleh nonaktif</td><td>Aktif + dipantau</td></tr></tbody></table>'
    },
    {
      type: 'warn',
      title: 'Kesalahan umum keamanan Elasticsearch',
      text: '<ul><li><b>Security mati di luar lab</b> — cluster tanpa auth di jaringan publik adalah pelanggaran data menunggu kejadian; banyak pemindaian otomatis mencari port 9200 terbuka.</li><li><b>Commit credential ke Git</b> — password dan API key harus hidup di environment atau secrets manager; kalau pernah ter-commit, cabut dan ganti, bukan hapus saja.</li><li><b>Memberi user <code>superuser</code> pada aplikasi</b> — aplikasi seharusnya memakai API key dengan privilege sesedikit mungkin pada index yang dibutuhkannya saja.</li><li><b>Mengandalkan TLS saja tanpa auth</b> — enkripsi melindungi data saat melintas, tetapi tidak menanyakan siapa yang boleh masuk.</li><li><b>Lupa mencabut key yang sudah tidak dipakai</b> — kredensial menumpuk dan tidak ada yang tahu mana yang masih hidup; audit berkala mencegah hal ini.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Belajar security dengan menguji diri sendiri',
      text: '<p>Setelah mengonfigurasi role dan API key, jalankan tiga uji ini setiap kali: (1) request tanpa credential harus <b>401</b>, (2) request dengan credential tapi izin kurang harus <b>403</b>, (3) request yang benar harus <b>200</b>. Ketiganya harus bisa kamu prediksi sebelum menekan Enter. Uji negatif seperti ini adalah bukti bahwa keamanan bekerja — menguji hanya jalur yang diizinkan tidak pernah membuktikan apa pun.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Authentication', 'Proses membuktikan identitas: user + password atau API key.'],
        ['Authorization', 'Penentuan izin setelah identitas dikenal; di Elasticsearch berbasis role.'],
        ['Role', 'Kumpulan privilege yang dapat diberikan ke user atau API key.'],
        ['Index privileges', 'Hak per index seperti <code>read</code>, <code>write</code>, <code>create_index</code>, <code>manage</code>.'],
        ['Least privilege', 'Prinsip memberi izin sesedikit mungkin yang tetap cukup untuk tugasnya.'],
        ['API key', 'Kredensial mesin untuk aplikasi; dapat dibatasi cakupan dan masa berlakunya.'],
        ['TLS/HTTPS', 'Enkripsi dan verifikasi identitas server saat data melintasi jaringan.'],
        ['Audit logging', 'Rekaman siapa mengakses apa dan kapan; dasar investigasi insiden.'],
        ['Self-signed', 'Sertifikat yang ditandatangani sendiri; cukup untuk lab, bukan untuk produksi.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Jalankan lab terpisah dengan <code>xpack.security.enabled=true</code>, lalu buktikan request tanpa credential ditolak dengan 401.</li><li>Buat role read-only untuk satu index, berikan ke user baru, lalu uji bahwa ia bisa membaca tetapi ditolak (403) saat menulis.</li><li>Buat API key terbatas cakupan index dengan masa berlaku, uji dipakai pada request, lalu cabut dan buktikan key lama tidak berfungsi lagi.</li><li><b>Checkpoint:</b> mampu menjelaskan keempat lapis keamanan, membuat role dengan least privilege, menguji izin positif dan negatif, serta menyebutkan mengapa credential tidak boleh masuk ke Git.</li></ol>'
    }
  ],
  recap: [
    'Keamanan Elasticsearch berlapis: <b>authentication</b> (siapa), <b>authorization</b> (boleh apa), <b>TLS</b> (jalur aman), dan <b>network/audit</b> (jangkauan &amp; rekaman).',
    'Lab security dijalankan <b>terpisah</b> dengan <code>xpack.security.enabled=true</code>; tanpa credential, request ditolak 401 — inilah bukti auth menyala.',
    'Role dengan <b>index privileges</b> menerapkan least privilege; user dan <b>API key</b> sama-sama dibatasi cakupannya, dan API key memiliki masa berlaku.',
    'TLS mengenkripsi isi termasuk kredensial; di produksi, port tidak diekspos ke publik dan <b>credential hidup di secrets manager — bukan di Git</b>.'
  ]
});
