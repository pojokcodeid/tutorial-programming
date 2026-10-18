/* ============================================================
   Pelajaran Jenkins — Bab 14: Hardening, Configuration as Code & Backup
   ============================================================ */
'use strict';

window.JENKINS_LESSONS = window.JENKINS_LESSONS || [];

window.JENKINS_LESSONS.push({
  id: 'hardening-jcasc',
  title: 'Hardening, Configuration as Code & Backup',
  chapter: 'Enterprise',
  duration: '8–10 menit',
  intro: [
    'Jenkins menyimpan kredensial, kunci SSH, dan akses ke seluruh sistem rilis sebuah tim. Karena itu instance Jenkins yang dibiarkan apa adanya menjadi sasaran empuk: halaman <code>/script</code> yang terbuka, artifact HTML yang memuat skrip berbahaya, plugin usang, dan konfigurasi yang hanya hidup di satu mesin.',
    '<b>Hardening</b> adalah serangkaian pengetatan agar instance bertahan menghadapi risiko itu: <b>Content Security Policy (CSP)</b> untuk artifact HTML, <b>Script Approval</b> dan Groovy Sandbox untuk kode yang dieksekusi, serta pembaruan plugin dan pencatatan jejak audit. Untuk sisi ketersediaan, hadir <b>Configuration as Code (JCasC)</b> yang mendeklarasikan seluruh konfigurasi dalam YAML, dan <b>backup</b> yang menjamin JENKINS_HOME dapat dipulihkan.',
    'Bab ini membahas ketiganya secara berurutan, lengkap dengan contoh berkas <code>jenkins.yaml</code>, skrip backup berbasis <code>tar</code>, dan cara mencobanya secara gratis dengan container Podman di komputer sendiri.'
  ],
  objectives: [
    'Menyetel Content Security Policy agar artifact HTML aman dibuka',
    'Memahami Script Approval, Groovy Sandbox, dan jejak audit eksekusi Groovy',
    'Mendeklarasikan konfigurasi Jenkins dengan Configuration as Code (JCasC)',
    'Menyusun strategi backup dan disaster recovery isi JENKINS_HOME'
  ],
  sections: [
    {
      type: 'text',
      html: "<h3>Mengapa Perlu Dihardening?</h3><p>Instalasi awal Jenkins memang dibuat sederhana agar orang cepat mulai bekerja, dan beberapa pilihan bawaannya justru membuka risiko besar:</p><ul><li><b>Artifact HTML</b> yang diarsipkan build dapat memuat skrip; tanpa kebijakan yang benar, membuka artifact bisa saja mengeksekusi skrip pihak lain di sesi pengguna.</li><li><b>Script Console</b> memungkinkan eksekusi Groovy apa pun oleh siapa pun yang punya akses — padahal Groovy bebas memanggil API internal Jenkins.</li><li><b>Plugin usang</b> adalah penyebab insiden paling sering; setiap rilis plugin biasanya memperbaiki kerentanan yang sudah diketahui.</li><li><b>Konfigurasi rahasia</b> yang hanya ada di satu mesin membuat pemulihan setelah kegagalan menjadi lotre.</li></ul><p>Karena itu, pengerasan dibagi menjadi tiga lapis: <b>perlindungan konten</b> (CSP), <b>pengawasan kode</b> (Script Approval, sandbox, dan audit), serta <b>kemampuan dipulihkan</b> (JCasC dan backup).</p>"
    },
    {
      type: 'text',
      html: "<h3>Content Security Policy: Menutup Celah Artifact HTML</h3><p><b>Content Security Policy (CSP)</b> adalah kebijakan yang dibaca browser untuk membatasi sumber konten yang boleh dimuat sebuah halaman. Di Jenkins, kebijakan ini dikendalikan lewat properti sistem <code>hudson.model.DirectoryBrowserSupport.CSP</code> dan berlaku pada halaman yang menampilkan isi workspace maupun artifact build.</p><p>Nilai bawaan hampir tidak membatasi apa pun. Nilai yang lazim dipakai untuk lingkungan produksi:</p><pre><code>sandbox; default-src 'none'; img-src 'self'; style-src 'self';</code></pre><ul><li><code>sandbox</code> — memperlakukan halaman sebagai konten tak terpercaya: skrip, form, dan plugin dimatikan.</li><li><code>default-src 'none'</code> — menolak semua sumber konten secara bawaan.</li><li><code>img-src 'self'</code> — tetap mengizinkan gambar dari host yang sama, misalnya logo pada laporan hasil build.</li><li><code>style-src 'self'</code> — mengizinkan stylesheet dari host yang sama agar laporan HTML tetap terbaca.</li></ul><p><b>Cara mengujinya:</b> buka artifact HTML dari sebuah build, lalu periksa tab Console pada browser. Bila muncul pesan CSP dan tampilan berantakan, tambahkan sumber yang benar-benar dibutuhkan satu per satu. <b>Trade-off-nya</b> nyata: CSP yang terlalu ketat membuat laporan seperti hasil coverage atau laporan OWASP Dependency-Check tampil polos. Aturan praktisnya: ketat untuk produksi, longgar hanya untuk instance lab, dan selalu uji sebelum menetapkan nilai akhir.</p>"
    },
    {
      type: 'example',
      title: 'Contoh 1: Menyetel CSP dari Script Console',
      lang: 'groovy',
      output: false,
      code: `// Buka: Manage Jenkins → Script Console, tempelkan skrip berikut lalu Run
def properti = 'hudson.model.DirectoryBrowserSupport.CSP'
def nilai = "sandbox; default-src 'none'; img-src 'self'; style-src 'self';"

System.setProperty(properti, nilai)
println "CSP aktif  : " + System.getProperty(properti)

// Uji: buka artifact HTML dari build mana pun, lalu periksa tab Console
// pada browser. Bila tidak ada pelanggaran CSP, nilainya sudah pas.`,
      explain: [
        'CSP dibaca ulang dari properti sistem pada setiap akses, sehingga perubahan lewat Script Console langsung berlaku tanpa restart.',
        'Perubahan seperti ini hanya hidup sampai instance dimulai ulang; agar tetap permanen, tetapkan nilai yang sama melalui variabel lingkungan <code>JAVA_OPTS</code> saat container Jenkins dibuat.',
        'Bila tampilan laporan coverage atau Dependency-Check rusak setelah CSP diterapkan, tambahkan sumber yang diperlukan seperti <code>style-src \'self\'</code> — jangan kembali ke nilai kosong.',
        'Catat nilai CSP yang disepakati tim di repository JCasC agar setiap instance baru otomatis memakainya.'
      ]
    },
    {
      type: 'text',
      html: "<h3>Script Approval, Groovy Sandbox, dan Jejak Audit</h3><p>Pipeline deklaratif yang kamu tulis di <code>Jenkinsfile</code> dieksekusi dalam <b>Groovy sandbox</b>: penyekat yang melarang pemanggilan metode berbahaya kecuali sudah disetujui sebelumnya. Ketika pipeline mencoba memakai metode yang belum dikenal, Jenkins menolaknya dan muncul tautan menuju halaman <b>In-process Script Approval</b> (Manage Jenkins → In-process Script Approval) berisi daftar <i>signature</i> yang menunggu persetujuan.</p><ul><li><b>Tetap dalam sandbox bila memungkinkan</b> — sandbox melindungi controller dari kesalahan maupun niat buruk pada kode pipeline.</li><li><b>Nonaktifkan sandbox hanya untuk kode tepercaya</b> — misalnya library yang sudah didaftarkan sebagai <i>Global Trusted Pipeline Library</i>, yang memang tidak dijalankan dalam sandbox.</li><li><b>Petakan signature satu per satu</b> — jangan menekan tombol <i>Approve All</i> tanpa membaca; setiap persetujuan berlaku permanen.</li></ul><h3>Jejak Audit dan Pembaruan Plugin</h3><p>Setelah persetujuan diberikan, kamu perlu tahu siapa yang mengeksekusi apa:</p><ul><li>Aktifkan <b>Enable logging of access to /script</b> di halaman Script Approval agar setiap kunjungan ke Script Console tercatat.</li><li>Buat <b>System Log Recorder</b> baru (Manage Jenkins → System Log) dengan logger <code>jenkins.security</code> dan <code>hudson.security</code> untuk memisahkan jejak keamanan dari log biasa.</li><li>Pasang plugin <b>Audit Trail</b> untuk mencatat siapa mengubah konfigurasi apa dan kapan.</li><li>Jadwalkan <b>pembaruan plugin</b> rutin dan periksa laman advisori keamanan Jenkins; perbarui di instance lab lebih dahulu sebelum produksi.</li></ul>"
    },
    {
      type: 'text',
      html: `<h3>Configuration as Code: Seluruh Konfigurasi dalam YAML</h3><p><b>Jenkins Configuration as Code (JCasC)</b> adalah plugin yang membaca berkas YAML dan menerapkannya sebagai konfigurasi instance — security realm, strategi otorisasi, jumlah executor, perangkat lunak, hingga daftar plugin. Konfigurasi yang biasanya diklik di UI menjadi berkas yang bisa direview, dicadangkan, dan dibangun ulang di mesin mana pun.</p>
      <figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 350" width="760" role="img" aria-label="Alur Configuration as Code: berkas jenkins.yaml di Git dibaca plugin Configuration as Code lalu diterapkan sebagai instance Jenkins">
        <rect x="20" y="70" width="200" height="170" rx="10" class="u-box"/>
        <text x="120" y="96" class="u-title" text-anchor="middle">Git Repository</text>
        <rect x="36" y="112" width="168" height="30" rx="6" class="u-hd"/>
        <text x="120" y="131" class="u-lbl" text-anchor="middle">jenkins.yaml</text>
        <text x="120" y="170" class="u-lbl" text-anchor="middle">securityRealm</text>
        <text x="120" y="194" class="u-lbl" text-anchor="middle">authorizationStrategy</text>
        <text x="120" y="218" class="u-lbl" text-anchor="middle">plugins &amp; tools</text>
        <line x1="222" y1="150" x2="274" y2="150" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="248" y="138" class="u-lbl" text-anchor="middle">mount</text>
        <rect x="278" y="90" width="204" height="120" rx="10" class="u-hd"/>
        <text x="380" y="116" class="u-title" text-anchor="middle">Configuration as Code</text>
        <text x="380" y="144" class="u-lbl" text-anchor="middle">CASC_JENKINS_CONFIG</text>
        <text x="380" y="168" class="u-lbl" text-anchor="middle">baca, validasi, apply</text>
        <text x="380" y="192" class="u-lbl" text-anchor="middle">saat instance boot</text>
        <line x1="484" y1="150" x2="536" y2="150" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="510" y="138" class="u-lbl" text-anchor="middle">apply</text>
        <rect x="540" y="60" width="200" height="190" rx="10" class="u-box"/>
        <text x="640" y="86" class="u-title" text-anchor="middle">Instance Jenkins</text>
        <rect x="556" y="104" width="80" height="32" rx="6" class="u-hd"/>
        <text x="596" y="124" class="u-lbl" text-anchor="middle">user admin</text>
        <rect x="644" y="104" width="80" height="32" rx="6" class="u-hd"/>
        <text x="684" y="124" class="u-lbl" text-anchor="middle">RBAC</text>
        <rect x="556" y="144" width="80" height="32" rx="6" class="u-hd"/>
        <text x="596" y="164" class="u-lbl" text-anchor="middle">executors</text>
        <rect x="644" y="144" width="80" height="32" rx="6" class="u-hd"/>
        <text x="684" y="164" class="u-lbl" text-anchor="middle">crumb</text>
        <rect x="556" y="184" width="80" height="32" rx="6" class="u-hd"/>
        <text x="596" y="204" class="u-lbl" text-anchor="middle">plugin</text>
        <rect x="644" y="184" width="80" height="32" rx="6" class="u-hd"/>
        <text x="684" y="204" class="u-lbl" text-anchor="middle">tools</text>
        <text x="380" y="300" class="u-lbl" text-anchor="middle">Instance rusak dibangun ulang dari berkas YAML yang sama — rekonfigurasi dalam hitungan menit</text>
        <text x="380" y="332" class="u-lbl" text-anchor="middle">Satu sumber kebenaran: konfigurasi ikut terkontrol versi bersama kode aplikasi</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 14.1</b> — Alur JCasC: jenkins.yaml di Git dibaca plugin Configuration as Code lalu diterapkan ke instance Jenkins</figcaption></figure>
      <p>Plugin Configuration as Code tersedia gratis dan bersifat sumber terbuka. Pada pemakaian, tentukan lokasi berkas melalui variabel lingkungan <code>CASC_JENKINS_CONFIG</code> yang dapat menunjuk satu berkas YAML atau sebuah folder berisi banyak berkas. Prinsip pemakaiannya: konfigurasi di UI hanya untuk penelusuran, sedangkan perubahan nyata dilakukan lewat commit ke <code>jenkins.yaml</code>.</p>`
    },
    {
      type: 'example',
      title: 'Contoh 2: Potongan jenkins.yaml untuk JCasC',
      lang: 'yaml',
      output: false,
      code: `# jenkins.yaml — deklarasi utuh instance, dibaca plugin Configuration as Code
jenkins:
  systemMessage: "Instance ini dibangun otomatis oleh Configuration as Code"
  numExecutors: 2
  securityRealm:
    local:
      allowsSignup: false
      users:
        - id: admin
          password: "\${JENKINS_ADMIN_PASSWORD}"
  authorizationStrategy:
    loggedInUsersCanDoAnything:
      allowAnonymousRead: false
  crumbIssuer:
    standard:
      excludeClientIPFromCrumb: true
  remotingSecurity:
    enabled: true

unclassified:
  location:
    url: "http://localhost:8080/"
    adminAddress: "devops@example.com"

plugins:
  - configuration-as-code
  - git
  - workflow-aggregator
  - credentials-binding
  - junit`,
      explain: [
        'Password admin tidak ditulis mentah di YAML: JCasC mengganti <code>\${JENKINS_ADMIN_PASSWORD}</code> dengan isi variabel lingkungan saat instance menyala.',
        '<code>securityRealm.local</code> memakai autentikasi bawaan Jenkins; untuk lingkungan korporat, ganti dengan LDAP atau realm SSO milik perusahaan.',
        '<code>crumbIssuer</code> melindungi endpoint form dari serangan CSRF, sedangkan <code>remotingSecurity</code> mengamatisasi komunikasi controller-agent.',
        'Blok <code>plugins</code> memasang plugin sesuai daftar saat boot, sehingga instance baru langsung siap tanpa klik-klik di UI.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh 3: Mencoba JCasC dengan Podman (Gratis)',
      lang: 'bash',
      output: false,
      code: `# 1) Bentuk image turunan agar plugin ikut terpasang sejak awal
mkdir -p ~/jenkins-casc && cd ~/jenkins-casc
cat > Dockerfile <<'EOF'
FROM jenkins/jenkins:lts-jdk17
RUN jenkins-plugin-cli --plugins configuration-as-code git workflow-aggregator credentials-binding junit
EOF
podman build -t jenkins-casc .

# 2) Simpan konfigurasi, lalu jalankan dengan variabel CASC_JENKINS_CONFIG
mkdir -p casc && cp jenkins.yaml casc/
export JENKINS_ADMIN_PASSWORD=admin123

podman run -d --name jenkins-casc \\
  -p 8080:8080 -p 50000:50000 \\
  -v jenkins_casc_home:/var/jenkins_home \\
  -v ~/jenkins-casc/casc:/var/jenkins_home/casc \\
  -e CASC_JENKINS_CONFIG=/var/jenkins_home/casc \\
  -e JENKINS_ADMIN_PASSWORD \\
  jenkins-casc

# 3) Pastikan YAML terbaca tanpa galat konfigurasi
podman logs jenkins-casc 2>&1 | grep -i "configuration as code"

# 4) Buka http://localhost:8080 lalu masuk memakai akun admin hasil YAML`,
      explain: [
        'Semua perintah berjalan lokal dengan Podman dan gambar sumber terbuka — tidak ada biaya langganan maupun akun layanan berbayar.',
        'Jenkins image resmi belum menyertakan plugin JCasC, sehingga perlu dibentuk image turunan kecil memakai <code>jenkins-plugin-cli</code> seperti pada langkah pertama.',
        'Bila log menampilkan pesan bahwa konfigurasi diterapkan dan user admin tercipta, berarti YAML sudah terbaca; galat penulisan YAML akan muncul jelas pada log yang sama.',
        'Instance ini cocok sebagai laboratorium: ubah YAML, hapus container beserta volumenya, lalu jalankan ulang untuk membuktikan rekonstruksi dari nol.'
      ]
    },
    {
      type: 'text',
      html: "<h3>Backup dan Disaster Recovery</h3><p><b>JENKINS_HOME</b> adalah jantung instance. Yang kritikal untuk dicadangkan:</p><table><thead><tr><th>Isi JENKINS_HOME</th><th>Mengapa Penting</th></tr></thead><tbody><tr><td><code>config.xml</code> dan <code>jobs/</code></td><td>Definisi seluruh job dan konfigurasi instance.</td></tr><tr><td><code>credentials.xml</code> dan <code>secrets/</code></td><td>Kredensial terenkripsi; tanpa <code>secrets/master.key</code>, kredensial lama tidak bisa dibuka kembali.</td></tr><tr><td><code>users/</code></td><td>Akun pengguna beserta preferensinya.</td></tr><tr><td><code>plugins/</code></td><td>Daftar dan versi plugin agar instance pemulihan memakai versi yang sama.</td></tr><tr><td><code>nodes/</code></td><td>Konfigurasi agent yang terhubung.</td></tr></tbody></table><p>Tiga jalur pencadangan yang umum dipakai:</p><ul><li><b>ThinBackup</b> — plugin gratis yang menjadwalkan backup penuh dan inkremental lengkap dengan tombol restore dari UI; cocok untuk tim yang ingin pencadangan praktis.</li><li><b>Manual <code>tar</code> / <code>rsync</code></b> — penuh kendali, mudah diotomasi lewat cron, dan tidak bergantung pada instalasi plugin.</li><li><b>JCasC + Git</b> — konfigurasi instance dibangun ulang dari YAML, sehingga pencadangan berfokus pada data rahasia dan riwayat.</li></ul><p>Kunci <b>disaster recovery</b> bukan sekadar membuat berkas cadangan, melainkan memastikan cadangan itu benar-benar bisa dipakai: lakukan backup rutin, replikasi ke lokasi terpisah (NAS atau penyimpanan objek), dan <b>uji restore berkala</b> di instance baru. Jenkinsfile dan library yang ada di Git membuat sebagian besar konfigurasi dapat dibangun ulang dengan JCasC — yang tidak bisa dibangun ulang adalah kredensial dan riwayat, itulah yang wajib dicadangkan dengan saksama.</p>"
    },
    {
      type: 'example',
      title: 'Contoh 4: Backup JENKINS_HOME dengan tar dan cron',
      lang: 'bash',
      output: false,
      code: `#!/bin/bash
# backup-jenkins.sh — pencadangan JENKINS_HOME tanpa biaya, dijalankan cron
set -euo pipefail

JENKINS_HOME="/var/jenkins_home"            # sesuaikan dengan host masing-masing
BACKUP_DIR="$HOME/backups/jenkins"
KEEP_DAYS=14
STAMP="$(date +%Y%m%d-%H%M)"

mkdir -p "$BACKUP_DIR"

# Kunci: sertakan konfigurasi, kredensial, secrets, users, plugins, dan riwayat
tar --exclude="$JENKINS_HOME/caches" \\
    --exclude="$JENKINS_HOME/workspace" \\
    --exclude="$JENKINS_HOME/.cache" \\
    -czf "$BACKUP_DIR/jenkins-home-$STAMP.tar.gz" \\
    -C "$(dirname "$JENKINS_HOME")" "$(basename "$JENKINS_HOME")"

# Replikasi ke penyimpanan lain agar tidak bergantung pada satu mesin
rsync -av "$BACKUP_DIR/" /mnt/nas/backup-jenkins/

# Bersihkan cadangan yang sudah melewati masa simpan
find "$BACKUP_DIR" -name "jenkins-home-*.tar.gz" -mtime +"$KEEP_DAYS" -delete

echo "Backup selesai: jenkins-home-$STAMP.tar.gz"

# ---- baris crontab (crontab -e) — cadangan setiap hari pukul 01:30 ----
# 30 1 * * * /usr/local/bin/backup-jenkins.sh >> /var/log/backup-jenkins.log 2>&1`,
      explain: [
        'Folder <code>workspace</code> dan <code>caches</code> dikecualikan karena bersifat sementara dan mudah dibuat ulang; ukurannya juga besar sehingga hanya memperlambat backup.',
        'Isi yang dikunci antara lain <code>credentials.xml</code>, <code>secrets/</code>, <code>users/</code>, <code>plugins/</code>, dan <code>jobs/</code> — persis yang dibutuhkan untuk membangun instance pengganti.',
        '<code>rsync</code> ke NAS atau objek storage menerapkan prinsip replikasi offsite; cadangan yang hanya berada di mesin yang sama bukan cadangan sungguhan.',
        'Selalu uji pemulihan: jalankan container baru, kembalikan isi arsip ke JENKINS_HOME, lalu pastikan job dan kredensial muncul kembali sebelum menganggap backup berhasil.'
      ]
    },
    {
      type: 'tip',
      title: 'Kombinasikan JCasC dengan Backup Data Rahasia',
      text: 'Pisahkan dua hal yang sering tercampur: <b>konfigurasi</b> dan <b>data rahasia</b>. Konfigurasi (jumlah executor, strategi otorisasi, daftar plugin, perangkat lunak) cukup dideklarasikan di <code>jenkins.yaml</code> lalu disimpan di Git, sehingga instance baru bisa dibangun ulang dalam hitungan menit. Data rahasia (kredensial, <code>secrets/master.key</code>, riwayat build) tidak boleh masuk Git dan wajib dicadangkan memakai <code>tar</code> ke lokasi terpisah. Dengan pembagian ini, pemulihan menjadi sederhana: bangun instance dari YAML, kembalikan data rahasia dari cadangan.'
    },
    {
      type: 'warn',
      title: 'Jangan Simpan Secret di Git dan Jangan Tunda Uji Restore',
      text: 'Berkas <code>jenkins.yaml</code> yang menyimpan password mentah sama saja dengan menaruh kunci server di repository; gunakan substitusi variabel lingkungan seperti pada Contoh 2. Demikian pula, cadangan yang tidak pernah diuji ulang hanyalah berkas yang meyakinkan — banyak tim baru mengetahui isi <code>tar</code> tidak lengkap justru saat bencana terjadi. Luangkan waktu bulanan untuk menguji restore di instance terpisah, dan pastikan <code>secrets/</code> ikut tercakup di dalamnya.'
    },
    {
      type: 'vocab',
      items: [
        ['Content Security Policy (CSP)', 'Kebijakan browser yang membatasi sumber konten; di Jenkins diatur lewat properti hudson.model.DirectoryBrowserSupport.CSP.'],
        ['Script Approval', 'Mekanisme persetujuan signature Groovy sebelum kode pipeline tertentu boleh dieksekusi.'],
        ['Groovy Sandbox', 'Penyekat yang membatasi pemanggilan metode berbahaya pada kode pipeline; aktif kecuali untuk library tepercaya.'],
        ['JCasC', 'Jenkins Configuration as Code — plugin yang menerapkan seluruh konfigurasi instance dari berkas YAML.'],
        ['CASC_JENKINS_CONFIG', 'Variabel lingkungan yang menunjuk berkas atau folder konfigurasi YAML bagi plugin Configuration as Code.'],
        ['ThinBackup', 'Plugin pencadangan yang menjadwalkan backup penuh dan inkremental serta menyediakan pemulihan dari UI.'],
        ['JENKINS_HOME', 'Folder utama penyimpanan konfigurasi, kredensial, plugin, dan riwayat build sebuah instance Jenkins.'],
        ['Disaster Recovery', 'Rencana memulihkan layanan setelah bencana: backup rutin, replikasi offsite, dan uji pemulihan berkala.']
      ]
    }
  ],
  recap: [
    'Content Security Policy dibaca dari properti hudson.model.DirectoryBrowserSupport.CSP; nilai sandbox; default-src \'none\'; img-src \'self\'; style-src \'self\'; membuat artifact HTML aman dengan sedikit kompromi tampilan.',
    'Groovy sandbox membatasi kode pipeline; pengecualiannya hanya untuk kode tepercaya, dan setiap persetujuan di halaman In-process Script Approval bersifat permanen sehingga wajib dibaca serta dicatat.',
    'JCasC menerjemahkan konfigurasi instance menjadi berkas jenkins.yaml yang dipasok lewat CASC_JENKINS_CONFIG, sehingga instance bisa dibangun ulang di mesin mana pun.',
    'Backup yang baik mencakup isi kritikal JENKINS_HOME, replikasi ke lokasi terpisah, dan uji restore berkala — Jenkinsfile dan library di Git menutup sisa kebutuhan lewat rekonstruksi JCasC.'
  ]
});
