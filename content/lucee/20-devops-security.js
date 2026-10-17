/* ============================================================
   Pelajaran Lucee CFML — Bab 20: DevOps, Deployment & Security (L20)
   ============================================================ */
'use strict';

window.LUCEE_LESSONS = window.LUCEE_LESSONS || [];

window.LUCEE_LESSONS.push({
  id: 'lucee-devops-security',
  title: 'DevOps, Deployment & Security',
  chapter: 'Operasi & Profesional',
  duration: '15 menit',
  intro: [
    'Pelajaran penutup materi Lucee membawa aplikasi toko onlinemu dari laptop ke server produksi dengan cara yang bisa diulang: memakai <b>Docker</b> dengan image resmi CommandBox, konfigurasi lewat environment variable, dan web server sebagai pelindung di depan aplikasi.',
    'Di sisi keamanan, kamu akan merangkum ancaman utama CFML — XSS, CSRF, upload file, admin yang terbuka — menjadi praktik hardening yang bisa dicek satu per satu. Ditutup dengan <b>profiling & tuning</b>: cara mencari memori bocor, mengatur heap JVM, dan checklist rilis produksi.'
  ],
  objectives: [
    'Membangun image Docker CommandBox dan menjalankannya dengan docker-compose',
    'Mengonfigurasi aplikasi lewat environment variable tanpa membakar kredensial ke image',
    'Meneruskan trafik dari Nginx atau IIS/Apache ke Lucee dengan benar',
    'Menerapkan hardening: XSS, CSRF, upload aman, dan lockdown admin Lucee',
    'Men-tuning heap JVM dan GC, serta mengenali tanda memory leak',
    'Memeriksa checklist rilis produksi sebelum deployment'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Deployment Docker dengan CommandBox</h3><p>CommandBox menyediakan <b>image resmi</b> di Docker Hub: <code>ortussolutions/commandbox</code>. Kamu tidak perlu memasang Java atau CFML apa pun di server — cukup menentukan engine lewat environment variable <code>CFENGINE</code> (misalnya <code>lucee@7.0.5</code>), menyalin kode ke webroot container, dan menjalankannya. Hasilnya: lingkungan produksi yang identik dengan pengembangan, dibangun ulang kapan saja lewat skrip.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 290" width="760" role="img" aria-label="Alur deployment: dev lokal, docker build, registry, lalu server produksi berisi nginx, container Lucee, dan database">
        <defs><marker id="mk-l20-1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8"/></marker></defs>
        <text x="380" y="24" class="u-sub" text-anchor="middle">Pengembangan → Produksi</text>
        <rect x="20" y="42" width="150" height="56" rx="8" class="u-box"/>
        <text x="95" y="65" class="u-title" text-anchor="middle">Dev lokal</text>
        <text x="95" y="85" class="u-lbl" text-anchor="middle">box server start</text>
        <line x1="170" y1="70" x2="216" y2="70" class="u-line" marker-end="url(#mk-l20-1)"/>
        <text x="193" y="58" class="u-lbl" text-anchor="middle">build</text>
        <rect x="220" y="42" width="160" height="56" rx="8" class="u-hd"/>
        <text x="300" y="65" class="u-title" text-anchor="middle">Image toko:2.4</text>
        <text x="300" y="85" class="u-lbl" text-anchor="middle">kode + engine</text>
        <line x1="380" y1="70" x2="426" y2="70" class="u-line" marker-end="url(#mk-l20-1)"/>
        <text x="403" y="58" class="u-lbl" text-anchor="middle">push</text>
        <rect x="430" y="42" width="140" height="56" rx="8" class="u-box"/>
        <text x="500" y="65" class="u-title" text-anchor="middle">Registry</text>
        <text x="500" y="85" class="u-lbl" text-anchor="middle">versi tercatat</text>
        <line x1="570" y1="70" x2="616" y2="70" class="u-line" marker-end="url(#mk-l20-1)"/>
        <text x="593" y="58" class="u-lbl" text-anchor="middle">pull</text>
        <rect x="620" y="42" width="120" height="56" rx="8" class="u-box"/>
        <text x="680" y="65" class="u-title" text-anchor="middle">Server</text>
        <text x="680" y="85" class="u-lbl" text-anchor="middle">docker compose up</text>
        <text x="380" y="128" class="u-sub" text-anchor="middle">Isi server produksi</text>
        <rect x="40" y="145" width="190" height="60" rx="8" class="u-box"/>
        <text x="135" y="170" class="u-title" text-anchor="middle">Nginx</text>
        <text x="135" y="190" class="u-lbl" text-anchor="middle">TLS · statis · rate limit</text>
        <line x1="230" y1="175" x2="276" y2="175" class="u-line" marker-end="url(#mk-l20-1)"/>
        <rect x="280" y="145" width="230" height="60" rx="8" class="u-hd"/>
        <text x="395" y="170" class="u-title" text-anchor="middle">Container CommandBox</text>
        <text x="395" y="190" class="u-lbl" text-anchor="middle">CFENGINE=lucee@7.x</text>
        <line x1="510" y1="175" x2="556" y2="175" class="u-line" marker-end="url(#mk-l20-1)"/>
        <rect x="560" y="145" width="160" height="60" rx="8" class="u-box"/>
        <text x="640" y="170" class="u-title" text-anchor="middle">MariaDB</text>
        <text x="640" y="190" class="u-lbl" text-anchor="middle">volume data</text>
        <text x="380" y="240" class="u-lbl" text-anchor="middle">Image dibangun sekali di CI; konfigurasi &amp; rahasia masuk lewat environment saat container dijalankan</text>
        <text x="380" y="262" class="u-lbl" text-anchor="middle">Image tidak pernah diubah — perubahan = build image baru = rollback semudah menunjuk tag lama</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 20.1</b> — Alur dev → image → registry → produksi; rahasia tidak pernah ikut ter-bake</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Dockerfile untuk aplikasi Lucee',
      lang: 'text',
      output: false,
      code: `# Image dasar resmi CommandBox
FROM ortussolutions/commandbox:latest

# Engine CFML & port ditentukan lewat environment
ENV CFENGINE=lucee@7.0.5
ENV PORT=8080

# Salin aplikasi ke webroot container (APP_DIR resmi image: /srv/app)
COPY ./src /srv/app

EXPOSE 8080

# Container dianggap sehat bila endpoint ini menjawab 200
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -sf http://localhost:8080/healthcheck.cfm || exit 1`,
      explain: [
        '<code>ortussolutions/commandbox</code> adalah image resmi; kamu hanya menambah kode aplikasi di atasnya.',
        '<code>CFENGINE</code> memilih mesin CFML beserta versinya — ganti ke <code>lucee@6.2.x</code> bila perlu menguji aplikasi lama di Lucee 6 tanpa membangun ulang Dockerfile.',
        '<code>HEALTHCHECK</code> memberi tahu Docker/Docker Compose kapan container layak menerima trafik.',
        'Biarkan <code>CMD</code> bawaan image — skrip startup CommandBox yang menyalakan server; menggantinya membuat container gagal berjalan.',
        'Tidak ada satu pun kredensial di berkas ini — password database masuk sebagai environment variable saat runtime.'
      ]
    },
    {
      type: 'example',
      title: 'docker-compose untuk aplikasi &amp; database',
      lang: 'yaml',
      output: false,
      code: `services:
  app:
    image: ortussolutions/commandbox
    ports:
      - "8080:8080"
    environment:
      - CFENGINE=lucee@7.0.5
      - DB_PASSWORD          # nilai diambil dari berkas .env / environment mesin
    volumes:
      - ./src:/srv/app
      - box-home:/opt/commandbox
    healthcheck:
      test: ["CMD", "curl", "-sf", "http://localhost:8080/healthcheck.cfm"]
      interval: 30s
      timeout: 5s
      retries: 3
  db:
    image: mariadb:11
    environment:
      - MARIADB_ROOT_PASSWORD   # rahasia tidak pernah ditulis di sini
    volumes:
      - db-data:/var/lib/mysql
volumes:
  box-home:
  db-data:`,
      explain: [
        'Entri environment tanpa tanda "=" mewarisi nilai dari mesin/host — pola standar untuk rahasia di Docker Compose.',
        'Volume <code>box-home</code> dipetakan ke <code>COMMANDBOX_HOME</code> (/opt/commandbox) agar konfigurasi CommandBox tetap hidup saat container diganti; <code>db-data</code> menjaga data database.',
        'Bind mount <code>./src:/srv/app</code> memudahkan pengembangan; di produksi, lebih baik kode ikut ter-bake di image.',
        'Database sengaja dipisah sebagai service sendiri sehingga bisa diskalakan atau diganti terpisah.'
      ]
    },
    {
      type: 'warn',
      title: 'Jangan pernah membakar rahasia ke image',
      text: 'Image Docker bisa ditarik dan diperiksa siapa pun yang punya akses registry — password, API key, atau certificate yang tertulis di Dockerfile/ENV akan ikut bocor dan tetap tertinggal di riwayat image. Simpan semua rahasia di environment variable atau secret manager, dan pastikan berkas <code>.env</code> masuk ke <code>.gitignore</code>.'
    },
    {
      type: 'text',
      html: '<h3>Integrasi Web Server: Nginx, IIS &amp; Apache</h3><p>Memisahkan web server dari app server bukan gaya — ada manfaat nyata: Nginx melayani file statis (gambar produk, CSS) jauh lebih hemat, menangani TLS, membatasi laju request, dan menyerap lonjakan trafik lewat buffering sementara Lucee fokus memproses CFML. Untuk server <b>Windows/IIS</b> atau <b>Apache</b>, koneksi ke Lucee memakai <b>BonCode AJP Connector</b> (protokol ringan khusus aplikasi Java) — di Apache, pasang juga <b>mod_cfml</b> supaya tiap folder baru otomatis mendapat mapping virtual directory di sisi Lucee, tanpa perlu dibuat manual satu per satu.</p>'
    },
    {
      type: 'example',
      title: 'Konfigurasi reverse proxy Nginx',
      lang: 'ini',
      output: false,
      code: `server {
    listen 80;
    server_name toko.example;

    # File statis dilayani langsung oleh Nginx
    location /assets/ {
        root /var/www/toko;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Sisanya diteruskan ke CommandBox
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
}`,
      explain: [
        '<code>proxy_http_version 1.1</code> memakai versi HTTP yang efisien untuk komunikasi ke backend.',
        'Header <code>X-Forwarded-For</code> dan <code>X-Forwarded-Proto</code> meneruskan IP asli klien dan skema (https) agar log &amp; redirect aplikasi akurat.',
        'Tanpa header ini, aplikasi melihat IP Nginx dan mengira request datang lewat http — salah untuk HTTPS.',
        'Bila memakai TLS, cukup ganti listen 443 ssl dan arahkan proxy_pass ke backend yang sama.'
      ]
    },
    {
      type: 'tip',
      title: 'Pindahkan TLS ke Nginx, bukan ke CommandBox',
      text: 'Pengelolaan sertifikat (Let\'s Encrypt, perpanjangan otomatis) jauh lebih matang di Nginx. Setelah TLS berhenti di Nginx, CommandBox/Lucee cukup melayani http di localhost — konfigurasi lebih sederhana dan port aplikasi tidak perlu terekspos ke internet.'
    },
    {
      type: 'text',
      html: '<h3>Hardening Lucee</h3><p>Hardening = menutup celah yang paling sering dieksploitasi pada aplikasi CFML. Empat besar: <b>XSS</b> (tampilkan selalu output buatan pengguna memakai <code>encodeForHTML</code>, plus header <b>CSP</b> yang membatasi sumber skrip), <b>CSRF</b> (token per sesi), <b>file upload</b> (validasi ketat + simpan di luar webroot), dan <b>admin Lucee yang terbuka</b>. Ditutup dengan HTTPS wajib, rate limit, dan pembaruan patch rutin.</p>'
    },
    {
      type: 'example',
      title: 'Token CSRF per sesi + validasi header',
      lang: 'cfml',
      output: false,
      code: `// Application.cfc
function onSessionStart() {
  session.csrfToken = generateSecretKey( "AES" );   // token acak per sesi
  return true;
}

function onRequestStart( required string targetPage ) {
  var method = uCase( cgi.request_method );
  if ( listFindNoCase( "POST,PUT,PATCH,DELETE", method ) ) {
    var headers = getHttpRequestData().headers;
    var token   = structKeyExists( headers, "X-CSRF-Token" ) ? headers[ "X-CSRF-Token" ] : "";
    if ( !len( token ) || compare( token, session.csrfToken ) ) {
      throw( type = "CSRFException", message = "Token CSRF tidak valid" );
    }
  }
  return true;
}`,
      explain: [
        'Token dibuat sekali per sesi dengan <code>generateSecretKey()</code> — acak dan tidak bisa ditebak penyerang.',
        'Setiap request mutasi (POST/PUT/PATCH/DELETE) wajib menyertakan token di header <code>X-CSRF-Token</code>.',
        '<code>compare()</code> mengembalikan 0 saat kedua string sama — karena itu kondisinya dibalik dengan tanda !',
        'Lengkapi dengan cookie <code>samesite="Lax"</code>, <code>httponly</code>, dan <code>secure</code> agar browser ikut menolak pengiriman lintas situs.'
      ]
    },
    {
      type: 'text',
      html: '<ul><li><b>File upload</b> — validasi ekstensi, MIME, dan ukuran; simpan di folder luar webroot; beri nama acak; jangan pernah mengeksekusi berkas unggahan.</li><li><b>Lockdown admin Lucee</b> — nonaktifkan/hapus admin di produksi, password kuat bila tetap dibutuhkan, dan batasi aksesnya ke IP internal.</li><li><b>HTTPS &amp; rate limit</b> — paksa redirect http → https di Nginx, dan limit request per IP untuk endpoint login agar brute-force mandek.</li><li><b>Patch rutin</b> — Lucee, CommandBox, Java, dan ekstensi rutin diperbarui; jadwalkan per bulan dan uji dulu di staging.</li></ul>'
    },
    {
      type: 'tip',
      title: 'CSP: pengaman terakhir untuk XSS',
      text: 'Header <b>Content Security Policy</b> membatasi skrip mana yang boleh berjalan di halamanmu, misalnya <code>add_header Content-Security-Policy "default-src \'self\'; script-src \'self\'";</code> di Nginx. Dengan CSP yang ketat, satu XSS yang lolos encoding pun sulit mengeksekusi skrip penyerang — terutama bila kamu menolak inline script.'
    },
    {
      type: 'text',
      html: '<h3>Profiling &amp; Performance Tuning</h3><p>Ketika aplikasi melambat atau crash, tiga hal pertama yang diperiksa: <b>GC log</b> (apakah JVM terlalu sering membersihkan memori?), <b>heap dump</b> (objek apa yang menumpuk?), dan <b>query lambat</b> (mana yang belum pakai index atau <code>cachedwithin</code>?). CommandBox memudahkan semuanya lewat <code>JVM_ARGS</code>, dan Lucee admin + JMX memberi angka penggunaan memori, thread, dan datasource secara langsung.</p>'
    },
    {
      type: 'example',
      title: 'Tuning heap, GC, dan log memori',
      lang: 'bash',
      output: false,
      code: `# Heap 2 GB, GC G1, dump memori + log GC otomatis saat bermasalah
box server set JVM_ARGS="-Xms512m -Xmx2g -XX:+UseG1GC -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/var/log/toko -Xlog:gc*:file=/var/log/toko/gc.log:time" name=toko

# Batas waktu satu request — thread tidak boleh terkunci lama
box cfconfig set requestTimeout="0,0,2,0" to=toko

box server restart name=toko`,
      explain: [
        '<code>-Xms</code>/<code>-Xmx</code> mengatur heap awal dan maksimal — ukur dulu lewat GC log, jangan menebak.',
        '<code>-XX:+UseG1GC</code> memakai collector G1 yang menyeimbangkan throughput dan jeda pembersihan memori.',
        '<code>HeapDumpOnOutOfMemoryError</code> menyimpan snapshot objek saat kehabisan memori — bahan wajib investigasi memory leak.',
        '<code>-Xlog:gc*</code> mencatat aktivitas GC ke berkas; jeda pembersihan yang terus memanjang adalah gejala awal masalah.'
      ]
    },
    {
      type: 'text',
      html: '<p>Untuk investigasi lanjutan, buka heap dump dengan Eclipse MAT atau VisualVM dan cari objek dengan retensi terbesar — pelakunya sering collection di <code>application</code> scope yang tak pernah dibersihkan atau listener yang bocor. Untuk query lambat, aktifkan request debugger Lucee secara temporer, temukan query terberat, lalu tambahkan index di database atau <code>cachedwithin</code> pada hasil yang jarang berubah. Monitoring harian cukup dengan metrik JMX (aktifkan lewat JVM_ARGS <code>-Dcom.sun.management.jmxremote</code>) yang jangan sekali-kali diekspos ke publik.</p>'
    },
    {
      type: 'text',
      html: '<h3>Checklist Rilis Produksi</h3><p>Sebelum menekan tombol rilis, pastikan semuanya tercentang:</p><ul><li>✓ Image dibangun dari CI, bukan dari laptop; versi engine <code>CFENGINE</code> terkunci.</li><li>✓ Tidak ada rahasia di image atau git; semua lewat environment variable.</li><li>✓ Admin Lucee dinonaktifkan/terkunci; HTTPS aktif dan redirect http sudah jalan.</li><li>✓ Backup database terjadwal &amp; pernah diuji restore-nya.</li><li>✓ <code>requestTimeout</code>, heap JVM, dan healthcheck terkonfigurasi.</li><li>✓ Log diamankan (rotasi + monitoring alert) dan halaman error produksi tidak membocorkan stacktrace.</li><li>✓ Rollback plan jelas: cukup jalankan image tag sebelumnya.</li></ul>'
    },
    {
      type: 'vocab',
      items: [
        ['CFENGINE', 'Environment variable CommandBox yang menentukan mesin CFML &amp; versinya (mis. lucee@7.0.5).'],
        ['Reverse proxy', 'Server (Nginx) yang meneruskan request ke aplikasi di belakangnya; tempat TLS &amp; rate limit.'],
        ['AJP', 'Apache JServ Protocol — protokol ringan antara web server (IIS/Apache) dan aplikasi JVM.'],
        ['BonCode AJP', 'Connector yang menghubungkan IIS/Apache ke Lucee/Tomcat lewat AJP; di Apache didampingi mod_cfml yang membuat mapping folder otomatis di sisi CFML server.'],
        ['CSP', 'Content Security Policy — header yang membatasi sumber skrip/gaya yang boleh dimuat halaman.'],
        ['Heap dump', 'Snapshot isi memori JVM saat kehabisan memori; bahan utama analisis memory leak.'],
        ['G1GC', 'Garbage collector Java yang menyeimbangkan throughput dan jeda; direkomendasikan untuk server.']
      ]
    }
  ],
  recap: [
    'Deploy Lucee dengan image resmi ortussolutions/commandbox dan tentukan versi engine lewat environment CFENGINE.',
    'Kode dibangun menjadi image; rahasia (password, API key) selalu masuk lewat environment variable — tidak pernah di-bake ke image.',
    'Nginx sebagai reverse proxy melayani statis + TLS; IIS/Apache memakai BonCode AJP Connector (plus mod_cfml).',
    'Hardening: encodeForHTML + CSP untuk XSS, token per sesi untuk CSRF, upload di luar webroot, lockdown admin, HTTPS, rate limit, patch rutin.',
    'Tuning memakai JVM_ARGS (heap, G1GC, GC log, heap dump) plus requestTimeout; query lambat diatasi index atau cachedwithin.',
    'Rilis produksi = checklist: image dari CI, tanpa rahasia, admin terkunci, backup teruji, dan rencana rollback jelas.'
  ]
});
