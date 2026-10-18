/* ============================================================
   Pelajaran Jenkins — Bab 2: Instalasi Jenkins dengan Podman
   ============================================================ */
'use strict';

window.JENKINS_LESSONS = window.JENKINS_LESSONS || [];

window.JENKINS_LESSONS.push({
  id: 'instalasi-jenkins',
  title: 'Instalasi Jenkins dengan Podman (Gratis & Lokal)',
  chapter: 'Pengenalan',
  duration: '8–10 menit',
  intro: [
    'Jenkins tidak memerlukan server berbayar untuk dipelajari. Dengan Podman di laptop, kamu bisa menjalankan server Jenkins lengkap dalam beberapa menit, menghapusnya tanpa bekas, dan mengulangnya kapan saja — seluruhnya gratis.',
    'Bab ini memakai <b>image resmi <code>jenkins/jenkins:lts-jdk17</code></b> — LTS berarti <i>Long-Term Support</i>, versi paling stabil yang direkomendasikan untuk pemakaian jangka panjang. Container membuka dua port: <b>8080</b> untuk antarmuka web dan <b>50000</b> sebagai port sambungan agent, serta menyimpan seluruh data pada volume bernama <code>jenkins_home</code>.',
    'Kamu akan diajak menjalankan container, membuka Setup Wizard, memverifikasi kesehatan instalasi, mengakses Jenkins CLI, hingga menyiapkan backup. Alternatif pemasangan non-container (brew, apt, rpm) juga dibahas singkat beserta kapan sebaiknya dipakai.'
  ],
  objectives: [
    'Menyiapkan prasyarat Podman rootless secara gratis di laptop',
    'Menjalankan container Jenkins dari image resmi dengan konfigurasi yang benar',
    'Menyelesaikan Setup Wizard dari Unlock Jenkins sampai Dashboard siap',
    'Memverifikasi kesehatan container dan membackup isi JENKINS_HOME'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Prasyarat: Podman Rootless</h3><p><b>Podman</b> adalah container engine sumber terbuka yang bisa berjalan tanpa daemon dan tanpa hak istimewa root (<i>rootless</i>). Di materi Docker kamu sudah memakainya; perintahnya sengaja dibuat mirip sehingga transisi ke Jenkins terasa mulus. Podman tersedia gratis untuk macOS, Linux, dan Windows (lewat WSL 2).</p><p>Instalasi dan pemeriksaan awal:</p><ul><li><b>macOS</b>: <code>brew install podman</code>, lalu <code>podman machine init</code> dan <code>podman machine start</code> bila belum ada mesin.</li><li><b>Debian/Ubuntu</b>: <code>sudo apt install podman</code>; <b>Fedora/RHEL</b>: <code>sudo dnf install podman</code>.</li><li><b>Verifikasi</b>: jalankan <code>podman --version</code> dan <code>podman info</code> — bila keduanya sukses, mesin container siap dipakai.</li></ul><p>Kamu juga perlu Java 17 atau 21 di host <i>hanya jika</i> ingin memakai Jenkins CLI dari luar container; untuk langkah dasar, cukup Podman saja.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 350" width="760" role="img" aria-label="Alur instalasi Jenkins dari mengunduh image hingga dashboard siap dipakai">
        <rect x="20" y="50" width="160" height="56" rx="8" class="u-box"/>
        <text x="100" y="83" class="u-lbl" text-anchor="middle">1. Unduh image LTS</text>
        <rect x="213" y="50" width="160" height="56" rx="8" class="u-box"/>
        <text x="293" y="83" class="u-lbl" text-anchor="middle">2. podman run -d</text>
        <rect x="406" y="50" width="160" height="56" rx="8" class="u-box"/>
        <text x="486" y="83" class="u-lbl" text-anchor="middle">3. Cek podman ps</text>
        <rect x="599" y="50" width="141" height="56" rx="8" class="u-box"/>
        <text x="669" y="76" class="u-lbl" text-anchor="middle">4. Buka</text>
        <text x="669" y="94" class="u-lbl" text-anchor="middle">:8080</text>
        <line x1="182" y1="78" x2="211" y2="78" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="375" y1="78" x2="404" y2="78" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="568" y1="78" x2="597" y2="78" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="669" y1="108" x2="669" y2="172" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="599" y="176" width="141" height="56" rx="8" class="u-box"/>
        <text x="669" y="199" class="u-lbl" text-anchor="middle">5. Ambil</text>
        <text x="669" y="217" class="u-lbl" text-anchor="middle">initialAdminPassword</text>
        <rect x="406" y="176" width="160" height="56" rx="8" class="u-box"/>
        <text x="486" y="199" class="u-lbl" text-anchor="middle">6. Install Suggested</text>
        <text x="486" y="217" class="u-lbl" text-anchor="middle">Plugins</text>
        <rect x="213" y="176" width="160" height="56" rx="8" class="u-box"/>
        <text x="293" y="199" class="u-lbl" text-anchor="middle">7. Buat akun</text>
        <text x="293" y="217" class="u-lbl" text-anchor="middle">administrator</text>
        <rect x="20" y="176" width="160" height="56" rx="8" class="u-hd"/>
        <text x="100" y="208" class="u-lbl" text-anchor="middle">8. Dashboard siap</text>
        <line x1="597" y1="204" x2="568" y2="204" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="404" y1="204" x2="375" y2="204" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="211" y1="204" x2="182" y2="204" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="380" y="290" class="u-lbl" text-anchor="middle">Langkah 4–7 dilakukan Setup Wizard di browser, berurutan dari Unlock sampai akun admin dibuat</text>
        <text x="380" y="318" class="u-lbl" text-anchor="middle">Seluruh data tersimpan di volume jenkins_home sehingga container boleh dibuat ulang kapan saja</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 2.1</b> — Alur instalasi Jenkins lokal dengan Podman, dari unduh image sampai Dashboard siap</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Menjalankan Container Jenkins</h3><p>Image resmi <code>jenkins/jenkins:lts-jdk17</code> tersedia gratis di Docker Hub dan bisa ditarik tanpa akun. Perhatikan arti setiap flag pada perintah <code>podman run</code>:</p><ul><li><code>-d</code> — jalankan di latar belakang (detached) agar terminal tetap bisa dipakai.</li><li><code>--name jenkins-server</code> — beri nama container agar mudah dirujuk pada perintah berikutnya.</li><li><code>-p 8080:8080</code> — petakan port web antarmuka Jenkins.</li><li><code>-p 50000:50000</code> — port sambungan <b>inbound agent</b>; agent lama menyambung ke port ini, meski untuk praktik lokal belum diperlukan.</li><li><code>-v jenkins_home:/var/jenkins_home</code> — simpan isi direktori data Jenkins pada <i>named volume</i> Podman agar tetap hidup walau container dihapus.</li></ul>'
    },
    {
      type: 'example',
      title: 'Menjalankan Jenkins dan Memeriksanya',
      lang: 'bash',
      output: false,
      code: `# Tarik image resmi Jenkins LTS (JDK 17) lalu jalankan container
podman run -d \\
  --name jenkins-server \\
  -p 8080:8080 -p 50000:50000 \\
  -v jenkins_home:/var/jenkins_home \\
  jenkins/jenkins:lts-jdk17

# Pastikan container berjalan dan statusnya Up
podman ps --filter name=jenkins-server

# Pantau log sampai muncul pesan "Jenkins is fully up and running"
podman logs -f jenkins-server`,
      explain: [
        'Perintah pertama menarik image bila belum ada, lalu langsung menjalankannya — image LTS sekitar 400 MB dan hanya diunduh sekali.',
        '<code>podman ps</code> menampilkan kolom STATUS "Up ..."; bila kosong, periksa galat dengan <code>podman logs jenkins-server</code>.',
        'Perintah <code>podman logs -f</code> mengikuti log secara langsung; tunggu hingga baris "Jenkins is fully up and running" muncul sebelum membuka browser.',
        'Proses penyiapan pertama kali memakan waktu 1–3 menit karena Jenkins menyiapkan direktori kerja dan database internalnya.'
      ]
    },
    {
      type: 'example',
      title: 'Membuka Kunci Jenkins & Masuk ke Shell Container',
      lang: 'bash',
      output: false,
      code: `# Baca password awal yang dihasilkan Setup Wizard
podman exec jenkins-server \\
  cat /var/jenkins_home/secrets/initialAdminPassword

# Masuk ke shell container untuk pengecekan lanjutan
podman exec -it jenkins-server bash

# Dari dalam shell: lihat isi JENKINS_HOME, lalu keluar
ls /var/jenkins_home
exit`,
      explain: [
        'Berkas <code>initialAdminPassword</code> dibuat otomatis saat pertama kali berjalan; salin nilainya lalu tempel di halaman "Unlock Jenkins" pada <code>http://localhost:8080</code>.',
        'Perintah <code>podman exec</code> membuka proses baru di container yang sedang berjalan; flag <code>-it</code> membuat sesi shell interaktif.',
        'Di dalam shell container kamu dapat memeriksa isi <code>/var/jenkins_home</code>: folder <code>jobs/</code>, <code>plugins/</code>, dan berkas seperti <code>config.xml</code>.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Setup Wizard Langkah demi Langkah</h3><p>Setelah membuka <code>http://localhost:8080</code>, Jenkins menuntun instalasi lewat antarmuka berurutan:</p><ol><li><b>Unlock Jenkins</b> — tempelkan isi <code>initialAdminPassword</code> yang tadi dibaca lewat <code>podman exec</code>.</li><li><b>Customize Jenkins</b> — pilih <b>Install Suggested Plugins</b>. Pilihan ini memasang plugin inti yang hampir selalu dibutuhkan: Git, Credentials Binding, Pipeline, SSH, dan notifikasi email. Pilihan kedua, <b>Select plugins to install</b>, dipakai bila kamu sudah tahu persis kebutuhanmu.</li><li><b>Creating admin user</b> — buat akun administrator berisi nama, kata sandi kuat, dan alamat email. Jangan memakai kata sandi lemah meski hanya untuk latihan; kebiasaan buruk mudah terbawa.</li><li><b>Instance Configuration</b> — konfirmasi URL Jenkins, misalnya <code>http://localhost:8080/</code>. URL ini dipakai pembuatan tautan notifikasi.</li><li><b>Ready to use</b> — klik <b>Start using Jenkins</b>; Dashboard akan tampil beserta kartu <i>Build Queue</i> dan <i>Build Executor Status</i>.</li></ol>'
    },
    {
      type: 'text',
      html: '<h3>Verifikasi Kesehatan &amp; Akses CLI</h3><p>Tiga pemeriksaan cepat memastikan instalasi sehat:</p><ul><li><b>Status container</b> — <code>podman ps</code> menunjukkan STATUS "Up"; restart container dengan <code>podman restart jenkins-server</code> bila berhenti.</li><li><b>Log tanpa error</b> — <code>podman logs jenkins-server</code> seharusnya menutup dengan "Jenkins is fully up and running" dan tanpa galat berulang.</li><li><b>Respons web</b> — buka <code>http://localhost:8080/login</code>; halaman login harus tampil.</li></ul><p>Selain antarmuka web, Jenkins menyediakan <b>CLI (Command Line Interface)</b> untuk otomatisasi. Berkas klien berada di <code>/usr/share/jenkins/jenkins-cli.jar</code> di dalam container; salin ke host lalu jalankan dengan Java. Autentikasi memakai <b>API Token</b> yang dibuat dari halaman pengguna: klik nama admin → <b>Configure</b> → <b>API Token</b> → <b>Add new Token</b>. Simpan token seperti rahasia — ia setara kata sandi.</p>'
    },
    {
      type: 'example',
      title: 'Mengelola Jenkins Lewat CLI',
      lang: 'bash',
      output: false,
      code: `# Salin berkas CLI client dari dalam container ke direktori kerja
podman cp jenkins-server:/usr/share/jenkins/jenkins-cli.jar ./jenkins-cli.jar

# Periksa identitas & izin akun yang dipakai
java -jar jenkins-cli.jar \\
  -s http://localhost:8080/jenkins -auth admin:TOKEN_API who-am-i

# Daftar semua plugin beserta versi yang terpasang
java -jar jenkins-cli.jar \\
  -s http://localhost:8080/jenkins -auth admin:TOKEN_API list-plugins

# Restart dengan aman: tunggu build yang sedang berjalan selesai dulu
java -jar jenkins-cli.jar \\
  -s http://localhost:8080/jenkins -auth admin:TOKEN_API safe-restart`,
      explain: [
        '<code>podman cp</code> menyalin berkas dari container ke host tanpa perlu masuk ke shell container.',
        'Alamat <code>-s http://localhost:8080/jenkins</code> menunjuk ke endpoint CLI; ganti bila Jenkins berada di host lain.',
        'Ganti <code>TOKEN_API</code> dengan token milikmu — CLI menolak autentikasi hanya dengan nama pengguna.',
        '<code>safe-restart</code> menunda restart sampai build aktif selesai, berbeda dengan restart paksa yang memutus proses di tengah jalan.'
      ]
    },
    {
      type: 'example',
      title: 'Backup JENKINS_HOME dengan Tar Bertanggal',
      lang: 'bash',
      output: false,
      code: `# Isi penting JENKINS_HOME: jobs/, config.xml, credentials.xml,
# plugins/, secrets/ — semua berada di dalam volume jenkins_home

# Buat arsip isi volume memakai container Alpine sesaat (tanpa instalasi apa pun)
TANGGAL=$(date +%Y%m%d-%H%M)
podman run --rm \\
  -v jenkins_home:/var/jenkins_home:ro \\
  -v "$PWD":/backup \\
  alpine tar czf /backup/jenkins_home-$TANGGAL.tar.gz -C /var/jenkins_home .

# Periksa hasil backup
ls -lh jenkins_home-*.tar.gz

# Untuk memulihkan: hapus container & volume lama, lalu buat ulang
# volume dari arsip, misalnya dengan membalik urutan flag -v di atas.`,
      explain: [
        'Variabel <code>TANGGAL</code> membuat nama arsip unik sehingga beberapa backup bisa disimpan berdampingan tanpa saling menimpa.',
        'Flag <code>:ro</code> membuat volume bersifat baca-saja selama proses backup — arsip tetap konsisten walau build sedang berjalan.',
        'Container Alpine bersifat sesaat (<code>--rm</code>) dan hanya dipakai untuk menjalankan <code>tar</code>; tidak ada yang perlu dipasang di host.',
        'Sisipkan perintah backup ke dalam cron atau pipeline mingguan agar rutin; cadangan yang tidak dijadwalkan sering lupa dibuat.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Alternatif Non-Container: brew, apt, dan rpm</h3><p>Jenkins juga tersedia sebagai paket sistem. Pilih jalur ini bila kamu berlatih pada mesin tetap (misalnya server kampus atau VM belajar) yang tidak memasang container engine, atau ingin memahami cara Jenkins dijalankan sebagai layanan sistem.</p><ul><li><b>macOS</b>: <code>brew install jenkins-lts</code> lalu <code>brew services start jenkins-lts</code>; Jenkins berjalan sebagai proses pengguna.</li><li><b>Debian/Ubuntu</b>: tambahkan repositori resmi <code>pkg.jenkins.io</code>, lalu <code>sudo apt install jenkins</code>; kontrol dengan <code>sudo systemctl start jenkins</code>.</li><li><b>RHEL/Fedora/Rocky</b>: tambahkan repo <code>pkg.jenkins.io</code> ke <code>/etc/yum.repos.d/</code>, lalu <code>sudo dnf install jenkins</code>.</li><li><b>Java WAR</b>: unduh <code>jenkins.war</code> dan jalankan dengan <code>java -jar jenkins.war</code> — cocok untuk uji cepat, bukan untuk pemakaian rutin.</li></ul><p>Untuk materi ini, jalur Podman tetap disarankan: isolasi rapi, mudah dihapus, dan cara kerjanya sama dengan yang dipakai tim di banyak perusahaan.</p>'
    },
    {
      type: 'tip',
      title: 'Container Boleh Dihapus, Asal Volume Tetap Ada',
      text: 'Seluruh data Jenkins (konfigurasi, job, kredensial, plugin) tidak hidup di container, melainkan di volume <code>jenkins_home</code>. Kamu bebas menjalankan <code>podman rm -f jenkins-server</code> lalu membuat ulang container dengan perintah yang sama — Jenkins akan bangun dengan identitas dan data persis seperti semula. Periksa isi volume kapan saja dengan <code>podman volume inspect jenkins_home</code>.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Jangan menjalankan <code>podman volume rm jenkins_home</code> kecuali kamu benar-benar ingin menghapus seluruh data Jenkins secara permanen. Selain itu, jangan bagikan <code>initialAdminPassword</code> atau URL <code>:8080</code> ke jaringan publik — Jenkins lokal sebaiknya hanya dapat diakses dari mesinmu sendiri atau lewat SSH tunnel. Perlakukan password awal dan API token seperti kartu akses: siapa pun yang memilikinya berhak penuh atas servermu.'
    },
    {
      type: 'vocab',
      items: [
        ['LTS (Long-Term Support)', 'Edisi Jenkins dengan dukungan jangka panjang dan pembaruan keamanan; disarankan untuk semua pemakaian. Contoh image: <code>jenkins/jenkins:lts-jdk17</code>.'],
        ['JENKINS_HOME', 'Direktori data utama Jenkins: <code>jobs/</code>, <code>config.xml</code>, <code>credentials.xml</code>, <code>plugins/</code>, dan <code>secrets/</code>.'],
        ['Rootless', 'Mode menjalankan container tanpa hak root — ciri utama Podman yang membuat praktik lokal lebih aman.'],
        ['Named Volume', 'Penyimpanan persisten yang dibuat dan dikelola container engine (di sini Podman) agar data tetap ada meski container dihapus.'],
        ['Setup Wizard', 'Antarmuka pemasangan berurutan: Unlock Jenkins → Install Suggested Plugins → buat akun admin → konfirmasi URL.'],
        ['initialAdminPassword', 'Token rahasia satu kali yang dibuat Jenkins pada penjalanan pertama, dibaca dari dalam container untuk membuka Setup Wizard.'],
        ['Port 8080 / 50000', 'Port web antarmuka Jenkins (8080) dan port sambungan inbound agent lama (50000).'],
        ['Jenkins CLI', 'Antarmuka baris perintah Jenkins melalui <code>jenkins-cli.jar</code>, dipakai untuk otomatisasi seperti memasang plugin atau restart aman.']
      ]
    }
  ],
  recap: [
    'Jenkins lokal bisa dijalankan gratis dengan Podman dan image resmi <code>jenkins/jenkins:lts-jdk17</code> pada port 8080 dan 50000.',
    'Kunci instalasi dibaca lewat <code>podman exec jenkins-server cat /var/jenkins_home/secrets/initialAdminPassword</code>, lalu dipakai menyelesaikan Setup Wizard.',
    'Kesehatan container dipastikan lewat <code>podman ps</code>, <code>podman logs</code>, dan uji respons halaman login; otomatisasi lanjutan memakai <code>jenkins-cli.jar</code>.',
    'Seluruh data berada di volume <code>jenkins_home</code>: backup rutin dengan <code>tar</code> dan jangan pernah menghapus volume tanpa cadangan.'
  ]
});
