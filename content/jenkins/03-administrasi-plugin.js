/* ============================================================
   Pelajaran Jenkins — Bab 3: Antarmuka Jenkins & Manajemen Plugin
   ============================================================ */
'use strict';

window.JENKINS_LESSONS = window.JENKINS_LESSONS || [];

window.JENKINS_LESSONS.push({
  id: 'administrasi-plugin',
  title: 'Antarmuka Jenkins & Manajemen Plugin',
  chapter: 'Administrasi',
  duration: '8–10 menit',
  intro: [
    'Setelah instalasi selesai, yang kamu lihat adalah Dashboard dengan deretan menu yang asing. Kabar baiknya, peta Jenkins sebenarnya sederhana: satu halaman pusat bernama Manage Jenkins mengatur hampir seluruh aspek server.',
    'Kekuatan utama Jenkins berasal dari <b>plugin</b>: integrasi Git, pipeline, notifikasi, hingga pemindaian keamanan semuanya berupa plugin. Namun plugin juga menjadi sumber masalah paling sering — versi yang tidak cocok, ketergantungan yang belum terpenuhi, dan restart di waktu yang salah.',
    'Bab ini memetakan Dashboard dan Manage Jenkins, lalu membahas siklus hidup plugin: mencari, memasang, memperbarui, sampai menonaktifkan plugin yang tidak terpakai — termasuk cara membaca System Log saat ada yang bermasalah. Semua dapat dipraktikkan di Jenkins lokal hasil bab sebelumnya.'
  ],
  objectives: [
    'Mengenali bagian utama Dashboard Jenkins dan fungsinya',
    'Memahami isi halaman Manage Jenkins sebagai pusat konfigurasi',
    'Mampu memasang, memperbarui, dan menonaktifkan plugin dengan aman',
    'Mampu memeriksa plugin dan log lewat antarmuka web maupun CLI'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Tur singkat Dashboard</h3><p>Dashboard adalah halaman pertama setelah login. Elemen yang perlu dikenali:</p><ul><li><b>Daftar item</b> (tabel di tengah) — seluruh job: Freestyle, Pipeline, maupun Multibranch. Kolom <i>Status</i> menampilkan bola hasil terakhir, <i>Last Success</i>/<i>Last Failure</i>, dan durasi build terakhir.</li><li><b>Build Queue</b> (kiri bawah) — antrian build yang menunggu giliran, misalnya karena semua executor sedang terpakai.</li><li><b>Build Executor Status</b> (kiri bawah) — kondisi tiap executor pada built-in node; klik <b>Abort</b> untuk membatalkan build yang nyangkut.</li><li><b>People</b> — daftar pengguna terdaftar beserta aktivitas terakhirnya.</li><li><b>Manage Jenkins</b> — gerbang ke seluruh konfigurasi server; tanpa izin Administer, menu ini tidak terlihat.</li><li><b>New Item</b> — membuat job baru (dibahas pada pelajaran Freestyle &amp; Pipeline).</li></ul>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 350" width="760" role="img" aria-label="Peta halaman Manage Jenkins dengan bidang pengaturan utama yang saling terhubung">
        <rect x="260" y="30" width="240" height="52" rx="10" class="u-hd"/>
        <text x="380" y="62" class="u-title" text-anchor="middle">Manage Jenkins</text>
        <rect x="20" y="140" width="160" height="54" rx="8" class="u-box"/>
        <text x="100" y="172" class="u-lbl" text-anchor="middle">System</text>
        <rect x="210" y="140" width="160" height="54" rx="8" class="u-box"/>
        <text x="290" y="172" class="u-lbl" text-anchor="middle">Tools &amp; Platforms</text>
        <rect x="400" y="140" width="160" height="54" rx="8" class="u-box"/>
        <text x="480" y="172" class="u-lbl" text-anchor="middle">Plugins</text>
        <rect x="590" y="140" width="160" height="54" rx="8" class="u-box"/>
        <text x="670" y="172" class="u-lbl" text-anchor="middle">Nodes &amp; Processes</text>
        <rect x="20" y="240" width="160" height="54" rx="8" class="u-box"/>
        <text x="100" y="272" class="u-lbl" text-anchor="middle">Credentials</text>
        <rect x="210" y="240" width="160" height="54" rx="8" class="u-box"/>
        <text x="290" y="272" class="u-lbl" text-anchor="middle">Users</text>
        <rect x="400" y="240" width="160" height="54" rx="8" class="u-box"/>
        <text x="480" y="272" class="u-lbl" text-anchor="middle">Global Security</text>
        <rect x="590" y="240" width="160" height="54" rx="8" class="u-box"/>
        <text x="670" y="272" class="u-lbl" text-anchor="middle">System Log</text>
        <line x1="380" y1="82" x2="102" y2="136" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="380" y1="82" x2="291" y2="136" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="380" y1="82" x2="479" y2="136" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="380" y1="82" x2="668" y2="136" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="100" y1="194" x2="100" y2="236" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="290" y1="194" x2="290" y2="236" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="480" y1="194" x2="480" y2="236" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="670" y1="194" x2="670" y2="236" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="380" y="330" class="u-lbl" text-anchor="middle">Satu halaman untuk konfigurasi, tool, plugin, mesin build, kredensial, pengguna, keamanan, dan log</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 3.1</b> — Peta halaman Manage Jenkins: pusat pengaturan seluruh aspek server</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Isi Manage Jenkins</h3><p>Berikut ringkasan bidang yang paling sering dipakai administrator:</p><ul><li><b>System</b> — identitas server: URL Jenkins, jumlah executor bawaan, variabel lingkungan global, jembatan email (SMTP), dan zona waktu.</li><li><b>Tools &amp; Platforms</b> — definisi tool yang dipakai build: instalasi JDK, Maven, Node.js, Git, maupun container engine. Diberi nama di sini lalu dipakai dari pipeline.</li><li><b>Plugins</b> — pusat kendali plugin: memasang, memperbarui, dan menonaktifkan.</li><li><b>Nodes &amp; Processes</b> — mengelola built-in node serta menambah agent baru (SSH maupun inbound).</li><li><b>Credentials</b> — penyimpan rahasia seperti kata sandi, token, dan kunci SSH (dibahas pelajaran berikutnya).</li><li><b>Users</b> — akun lokal: membuat, mengubah, menghapus.</li><li><b>Global Security</b> — kebijakan autentikasi dan otorisasi, proteksi CSRF, dan batasan agent.</li><li><b>System Log</b> — log server tempat membaca peringatan dan error tanpa membuka terminal.</li></ul>'
    },
    {
      type: 'text',
      html: '<h3>Cara Kerja Plugin &amp; Update Center</h3><p>Jenkins menyimpan katalog plugin di <b>Update Center</b>, yaitu indeks daring resmi komunitas. Saat kamu membuka halaman Plugins, Jenkins mengunduh daftar terbaru dari indeks itu lalu mencocokkannya dengan versi yang terpasang. Karena itu koneksi internet diperlukan saat memasang plugin pertama kali.</p><p>Halaman Plugins terbagi atas tiga kolom:</p><ul><li><b>Available</b> — semua plugin yang bisa dipasang; cari lewat kotak pencarian.</li><li><b>Installed</b> — yang sudah terpasang, lengkap dengan versi dan kebutuhan plugin lain.</li><li><b>Updates</b> — versi baru yang tersedia; kolom <i>Uninstall</i> dan <i>Downgrade</i> tersedia pula di Installed.</li></ul><p>Tanda <b>(Restart)</b> pada kolom Installed berarti perubahan belum aktif penuh sampai Jenkins dimulai ulang. Gunakan <b>Restart Jenkins when installation is complete</b> agar Jenkins menunggu semua pemasangan selesai lalu restart otomatis — jangan mematikan container di tengah proses.</p>'
    },
    {
      type: 'text',
      html: '<h3>Plugin Wajib untuk Memulai</h3><p>Bila memilih <i>Install Suggested Plugins</i> saat instalasi, sebagian besar daftar ini sudah ada. Periksa lewat kolom Installed:</p><ul><li><b>Git</b> + <b>Git client</b> — mengambil kode dari GitHub/GitLab lewat HTTPS atau SSH.</li><li><b>Credentials Binding</b> — membuat kredensial tersedia pada build secara aman dan ter-masking.</li><li><b>Pipeline</b> (kumpulan <code>workflow-*</code>) — mesin eksekusi Jenkinsfile; tanpa ini, job Pipeline tidak bisa dibuat.</li><li><b>GitHub Branch Source</b> / <b>GitLab Plugin</b> — memindai repository dan menjalankan Multibranch Pipeline dengan webhook.</li><li><b>Blue Ocean</b> — antarmuka modern untuk visualisasi pipeline; opsional, mempercantik tampilan tanpa mengubah fungsi.</li><li><b>Configuration as Code</b> — mendeklarasikan seluruh konfigurasi Jenkins dalam YAML; opsional, tetapi sangat membantu bila Jenkins perlu direplikasi.</li></ul>'
    },
    {
      type: 'example',
      title: 'Memasang Plugin Lewat Antarmuka Web',
      lang: 'text',
      output: false,
      code: `1. Login sebagai admin → Manage Jenkins → Plugins
2. Buka tab Available, ketik "GitLab" pada kotak pencarian
3. Centang plugin yang dibutuhkan, misalnya GitLab Plugin
4. Periksa panel "Selected for installation" di kanan atas
5. Klik Install now — halaman Progress menampilkan tiap tahap:
   Download → Dependencies → Installed
6. Bila muncul tanda (Restart), centang opsi
   "Restart Jenkins when installation is complete"
7. Tunggu Jenkins bangun kembali (cek podman logs jenkins-server),
   lalu buka Manage Jenkins → Plugins → tab Installed
   untuk memastikan versi plugin sudah tercatat`,
      explain: [
        'Selalu pasang dari tab Available agar dependensi ikut terhitung; memasang berkas .hpi secara manual berisiko melupakan plugin pendukungnya.',
        'Panel kanan menampilkan rencana pemasangan lengkap — perhatikan bila ada plugin tak terduga ikut terpasang.',
        'Tanda (Restart) berarti perubahan belum aktif; pilihan restart otomatis lebih aman daripada mematikan container sendiri.',
        'Verifikasi setelah restart mencegah masalah diam-diam: plugin gagal muat sering hanya muncul di System Log.'
      ]
    },
    {
      type: 'example',
      title: 'Memeriksa & Memasang Plugin Lewat CLI',
      lang: 'bash',
      output: false,
      code: `# Siapkan klien CLI (sekali saja) dan buat API Token di halaman pengguna
podman cp jenkins-server:/usr/share/jenkins/jenkins-cli.jar ./jenkins-cli.jar

# Daftar semua plugin aktif beserta versi
java -jar jenkins-cli.jar \\
  -s http://localhost:8080/jenkins -auth admin:TOKEN_API list-plugins

# Pasang plugin beserta ketergantungannya tanpa membuka browser
java -jar jenkins-cli.jar \\
  -s http://localhost:8080/jenkins -auth admin:TOKEN_API \\
  install-plugin git blueocean

# Terapkan perubahan dengan restart aman
java -jar jenkins-cli.jar \\
  -s http://localhost:8080/jenkins -auth admin:TOKEN_API safe-restart`,
      explain: [
        '<code>list-plugins</code> menampilkan kolom versi aktif dan versi terbaru bila ada pembaruan — berguna untuk audit cepat.',
        '<code>install-plugin</code> menerima lebih dari satu nama sekaligus dan otomatis menarik ketergantungan yang belum terpasang.',
        '<code>safe-restart</code> menunggu build berjalan selesai sebelum memulai ulang, sehingga tidak memutus proses di tengah jalan.',
        'CLI mempermudah pemasangan massal, misalnya saat menyiapkan banyak server Jenkins identik lewat skrip.'
      ]
    },
    {
      type: 'example',
      title: 'Membaca System Log Saat Ada Masalah',
      lang: 'text',
      output: false,
      code: `1. Manage Jenkins → System Log → All Jenkins Logs
2. Ulangi langkah yang tadi bermasalah, misalnya memasang plugin
3. Muat ulang halaman log, lalu saring baris berlabel SEVERE / WARNING
4. Baca pesan teliti — contoh umum:
   - "Plugin ... requires ... but it is not installed"
     → dependensi belum terpasang; pasang lewat tab Available
   - "No such property: ... for class: ..."
     → nama properti salah di Jenkinsfile
5. Untuk log yang lebih rinci, klik Add new Log Recorder,
   buat logger bernama komponen, misalnya hudson.plugins.git,
   dengan level FINE, lalu ulangi aksinya`,
      explain: [
        'System Log menampilkan catatan log4j dari seluruh komponen Jenkins; membacanya jauh lebih cepat daripada menelusuri <code>podman logs</code> yang bercampur.',
        'Saring dulu berdasarkan tingkat keparahan SEVERE dan WARNING sebelum menelusuri pesan biasa.',
        'Saat ada keraguan, buka juga <code>podman logs jenkins-server</code> — pesan kegagalan startup hanya muncul di sana.',
        'Kembalikan level logger ke INFO setelah selesai agar log tidak membengkak.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Cara Aman Memperbarui Plugin</h3><p>Pembaruan plugin membawa perbaikan dan fitur baru, tetapi juga risiko: perubahan nama properti, dependensi naik versi, hingga ketidakcocokan dengan pipeline lama. Urutan aman yang disarankan:</p><ol><li><b>Catat versi saat ini</b> — jalankan <code>list-plugins</code> atau buka kolom Installed, lalu simpan hasilnya.</li><li><b>Backup JENKINS_HOME</b> — ulangi metode <code>tar</code> dari pelajaran instalasi; backup satu-satunya jaring pengaman bila pembaruan merusak sesuatu.</li><li><b>Baca rilis notes</b> — buka halaman plugin di Update Center, lalu tautan <i>Release notes</i> atau halaman proyeknya; cari perubahan yang tidak kompatibel.</li><li><b>Perbarui di lingkungan percobaan dulu</b> — bila memungkinkan, coba pada Jenkins lokal (seperti milikmu di laptop) sebelum menyentuh server bersama.</li><li><b>Terapkan dengan safe restart</b> — pasang pembaruan, izinkan Jenkins restart otomatis, lalu pantau System Log saat kembali berjalan.</li><li><b>Verifikasi</b> — jalankan satu pipeline uji dan pastikan build sukses sebelum mengumumkan pembaruan ke tim.</li></ol>'
    },
    {
      type: 'text',
      html: '<h3>Menonaktifkan &amp; Menangani Masalah Plugin</h3><p>Plugin yang tidak terpakai menambah beban pemuatan dan memperluas permukaan risiko keamanan. Jenkins membedakan dua tindakan:</p><ul><li><b>Disable</b> — plugin dinonaktifkan sementara tanpa dihapus; konfigurasi tersimpan, dan bisa diaktifkan lagi kapan saja. Pilihan yang tepat saat menguji dugaan masalah.</li><li><b>Uninstall</b> — plugin dihapus; pilihan ini baru aman setelah dipastikan tidak ada job yang bergantung padanya.</li></ul><p>Gejala khas masalah plugin: Jenkins minta restart berulang, halaman tertentu menampilkan <i>Oops!</i>, atau build gagal dengan pesan kelas Groovy tidak ditemukan. Langkah penanganannya berurutan: baca System Log, nonaktifkan plugin terakhir yang berubah, periksa ketergantungan di kolom Installed, lalu kembalikan versi lama lewat fitur <b>Downgrade</b> bila tersedia.</p>'
    },
    {
      type: 'tip',
      title: 'Kurangi Plugin yang Dipasang',
      text: 'Semakin sedikit plugin, semakin kecil risiko konflik dan pemeliharaan. Nonaktifkan plugin bawaan yang tidak kamu pakai — misalnya CVS atau Subversion bila timmu hanya memakai Git. Perhatikan juga asal sumber plugin: utamakan yang tercantum di Update Center resmi komunitas, dan berhati-hatilah memasang berkas .hpi dari sumber tidak dikenal.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Jangan memperbarui plugin ketika build penting sedang berjalan, dan jangan memaksa restart dengan menghapus container — gunakan selalu <b>safe restart</b> agar proses yang sedang berjalan selesai dengan rapi. Sebelum pembaruan apa pun, backup <code>jenkins_home</code> adalah langkah wajib, bukan pilihan.'
    },
    {
      type: 'vocab',
      items: [
        ['Plugin', 'Modul ekstensi Jenkins yang menambah kemampuan, mulai dari integrasi Git hingga visualisasi pipeline.'],
        ['Update Center', 'Katalog daring resmi tempat Jenkins mengunduh daftar dan berkas plugin beserta ketergantungannya.'],
        ['Dependency', 'Plugin lain yang wajib terpasang agar sebuah plugin dapat berfungsi; dipasang otomatis saat pemasangan normal.'],
        ['Safe Restart', 'Perintah memulai ulang Jenkins yang menunggu build berjalan selesai sebelum proses berhenti.'],
        ['System Log', 'Halaman log internal Jenkins (Manage Jenkins → System Log) untuk membaca peringatan dan error tanpa terminal.'],
        ['Disable vs Uninstall', 'Menonaktifkan plugin tanpa menghapusnya dibanding menghapusnya permanen; pilih disable saat masih ragu.'],
        ['Blue Ocean', 'Antarmuka opsional yang menampilkan pipeline sebagai alur visual modern tanpa mengubah cara pipeline berjalan.'],
        ['Configuration as Code (JCasC)', 'Plugin untuk mendeklarasikan konfigurasi Jenkins dalam berkas YAML sehingga mudah direplikasi dan di-versioning.']
      ]
    }
  ],
  recap: [
    'Dashboard menampilkan daftar item, Build Queue, Build Executor Status, dan People; seluruh konfigurasi terpusat di Manage Jenkins.',
    'Manage Jenkins memuat System, Tools &amp; Platforms, Plugins, Nodes &amp; Processes, Credentials, Users, Global Security, dan System Log.',
    'Plugin dipasang dari tab Available, diperiksa di Installed, dan diperbarui dari Updates; tanda (Restart) berarti perlu safe restart.',
    'Selalu backup JENKINS_HOME sebelum memperbarui, baca rilis notes, dan gunakan System Log sebagai alat diagnosis utama.'
  ]
});
