/* ============================================================
   Pelajaran Jenkins — Bab 5: Freestyle Project & Kapan Masih Memakainya (L5)
   ============================================================ */
'use strict';

window.JENKINS_LESSONS = window.JENKINS_LESSONS || [];

window.JENKINS_LESSONS.push({
  id: 'freestyle-job',
  title: 'Freestyle Project & Kapan Masih Memakainya',
  chapter: 'Administrasi',
  duration: '8–10 menit',
  intro: [
    'Jenkins jauh sebelum dikenal sebagai mesin Pipeline sebenarnya adalah mesin "job": aplikasi yang menjalankan perintah pada jadwal tertentu dan melaporkan hasilnya. Tipe job paling tua inilah yang disebut <b>Freestyle project</b>, dan hingga hari ini masih banyak ditemukan di server Jenkins nyata — termasuk di instalasi tim yang sedang bermigrasi ke gaya baru.',
    'Freestyle project adalah tipe job klasik Jenkins yang seluruh konfigurasinya dikumpulkan dalam satu halaman formulir di antarmuka web: mulai dari mengambil kode sumber, menjadwalkan build, menjalankan perintah build, sampai tindakan setelah build selesai (post-build).',
    'Bab ini membahas cara membuat Freestyle project pertama, seluruh bagian konfigurasinya (Source Code Management, Build Triggers, Build Steps, Post-build Actions), pola penjadwalan cron bergaya <code>H</code>, alasan gaya ini dianggap warisan, serta situasi di mana gaya ini masih wajar dipakai.'
  ],
  objectives: [
    'Membuat Freestyle project pertama dan menghubungkannya ke repository Git',
    'Mengonfigurasi Source Code Management, Build Triggers, Build Steps, dan Post-build Actions',
    'Memahami pola cron <code>H</code> dan perbedaan Poll SCM dengan webhook',
    'Menilai kapan Freestyle masih layak dan mengapa perlu beralih ke Pipeline as Code'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Apa itu Freestyle Project?</h3><p>Freestyle project adalah tipe job paling awal di Jenkins. Kamu membuatnya lewat menu <b>New Item</b>, memilih <b>Free-style project</b>, lalu mengisi formulir konfigurasi yang terbagi menjadi beberapa bagian:</p><ul><li><b>General</b> — nama job, deskripsi, dan opsi seperti membuang build lama (<i>Discard old builds</i>).</li><li><b>Source Code Management (SCM)</b> — menentukan kode apa yang harus diambil, misalnya repository Git beserta kredensialnya.</li><li><b>Build Triggers</b> — menentukan kapan build dijalankan: cron, polling, atau webhook dari Git.</li><li><b>Build Environment</b> — variabel lingkungan tambahan, pembersihan workspace, dan opsi lain sebelum langkah build berjalan.</li><li><b>Build Steps</b> — perintah yang benar-benar dieksekusi, misalnya <i>Execute shell</i> di Linux atau <i>Windows Batch Command</i> di Windows.</li><li><b>Post-build Actions</b> — tindakan setelah build: mengarsipkan hasil build, menerbitkan laporan pengujian, mengirim surel, dan lainnya.</li></ul><p>Prinsip kerjanya sederhana: Jenkins mengambil kode ke sebuah direktori kerja bernama <b>workspace</b>, menjalankan Build Steps berurutan, lalu menjalankan Post-build Actions berdasarkan status akhir build. Bila kamu baru memulai, jalankan Jenkins open source secara lokal dengan Podman: <code>podman run -d --name jenkins -p 8080:8080 -p 50000:50000 -v jenkins_home:/var/jenkins_home jenkins/jenkins:lts-jdk17</code> — seluruh materi ini dapat dipraktikkan gratis tanpa biaya lisensi.</p>'
    },
    {
      type: 'text',
      html: '<h3>Source Code Management &amp; Build Triggers</h3><p>Pada bagian <b>Source Code Management</b> pilih <b>Git</b>, lalu isi <b>Repository URL</b> (HTTPS maupun SSH) dan <b>Credentials</b> bila repository bersifat privat. Untuk repository privat di GitHub atau GitLab free tier, kamu cukup membuat <i>access token</i> (GitHub: <i>Personal access token</i>; GitLab: <i>Personal access token</i> dengan peran <i>read_repository</i>) lalu menyimpannya di Jenkins lewat <i>Manage Jenkins → Credentials</i> sebagai kombinasi <i>Username with password</i>. Repository publik bahkan tidak memerlukan kredensial sama sekali.</p><p>Pada bagian <b>Branches to build</b>, isikan pola cabang seperti <code>*/main</code>. Catatan: <code>main</code> hanya contoh; sesuaikan dengan nama cabang default repository-mu (ada pula yang masih memakai <code>master</code>).</p><p>Bagian <b>Build Triggers</b> menyediakan tiga cara memicu build:</p><ul><li><b>Build periodically</b> — Jenkins menjalankan build menurut jadwal cron tanpa peduli ada perubahan kode atau tidak.</li><li><b>Poll SCM</b> — Jenkins mengecek repository secara berkala dan hanya menjalankan build bila ada perubahan commit.</li><li><b>GitHub hook event for GITScm polling</b> / <b>GitHub hook trigger for GITScm polling</b> — build dipicu oleh webhook, yaitu pemberitahuan langsung dari Git setiap kali ada <code>git push</code>. Cara ini paling hemat karena tidak perlu menebak-nebak jadwal.</li></ul>'
    },
    {
      type: 'example',
      title: 'Langkah Membuat Freestyle Project Pertama',
      lang: 'text',
      output: false,
      code: `1. Buka dasbor Jenkins (http://localhost:8080) → klik New Item
2. Isi nama, misalnya "katalog-produk-ci" → pilih Free-style project → OK
3. General → centang Discard old builds → Max # of builds to keep: 10
4. Source Code Management → Git
     Repository URL : https://github.com/tim-contoh/katalog-produk.git
     Credentials    : Add → Username with password (token GitLab/GitHub)
     Branches       : */main
5. Build Triggers → centang Poll SCM → Schedule: H/15 * * * *
6. Build Steps → Add build step → Execute shell → isi perintah build
7. Post-build Actions → Archive the artifacts → Files to archive: dist/**
8. Klik Save, lalu klik Build Now untuk mencoba
9. Buka Build #1 → Console Output untuk melihat log eksekusi`,
      explain: [
        'Langkah 4 menghubungkan job dengan repository Git; URL HTTPS paling mudah untuk pemula karena cukup memakai token, tanpa perlu mengelola kunci SSH.',
        'Langkah 5 memakai Poll SCM sebagai cara paling sederhana; pada praktik lanjutan kamu akan menggantinya dengan webhook agar build langsung berjalan saat ada <code>git push</code>.',
        'Langkah 7 menyimpan file di folder <code>dist/</code> sebagai <b>artefak build</b> sehingga bisa diunduh dari halaman build tanpa membangun ulang.',
        'Jika tombol <i>Execute shell</i> tidak muncul, berarti Jenkins dijalankan di Windows — gunakan <i>Windows Batch Command</i> sebagai gantinya.'
      ]
    },
    {
      type: 'example',
      title: 'Build Steps: Execute shell untuk Aplikasi Node.js',
      lang: 'bash',
      output: false,
      code: `# 1. Pasang dependensi persis sesuai package-lock.json
npm ci

# 2. Jalankan pengujian unit; laporan ditulis ke test-results/
npm test -- --reporter=junit

# 3. Kemas hasil build ke folder dist/
npm run build

# 4. Pastikan hasil build benar-benar ada
ls -la dist/`,
      explain: [
        '<code>npm ci</code> memasang dependensi versi persis sesuai <code>package-lock.json</code>; gunakan <code>npm install</code> hanya bila file lock belum ada.',
        '<code>--reporter=junit</code> membuat file XML laporan pengujian yang nantinya dibaca oleh publisher JUnit pada Post-build Actions.',
        'Jenkins menandai build gagal bila salah satu perintah menghasilkan kode keluar (exit code) selain nol, sehingga kegagalan <code>npm test</code> langsung terlihat di dasbor.',
        'Untuk proyek Python setara: <code>python -m venv .venv &amp;&amp; .venv/bin/pip install -r requirements.txt &amp;&amp; .venv/bin/python -m pytest --junitxml=test-results/junit.xml</code>.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Build Environment &amp; Post-build Actions</h3><p><b>Build Environment</b> berisi opsi yang berlaku sebelum Build Steps dijalankan, misalnya <i>Provide Node.js bin/grunt etc.</i>, <i>Delete workspace before build starts</i>, atau <i>Timestamps</i> agar log mencantumkan waktu. Bagian ini sering dipakai untuk memastikan build dimulai dari keadaan yang bersih dan deterministik.</p><p><b>Post-build Actions</b> berjalan setelah Build Steps selesai dan menentukan "nasib" hasil build. Tindakan yang paling sering dipakai:</p><ul><li><b>Archive the artifacts</b> — menyimpan file hasil build (misalnya <code>dist/**</code>) agar dapat diunduh dan dipakai oleh job lain.</li><li><b>Publish JUnit test results</b> — membaca laporan XML pengujian lalu menampilkan grafik tren dan status sehat job.</li><li><b>Send e-mail notifications</b> atau <b>Slack Notification</b> — memberi kabar ke tim saat build gagal. Untuk Slack, pasang plugin <i>Slack Notification</i> dan isi URL webhook Slack (tier gratis Slack mengizinkan satu integrasi).</li></ul>'
    },
    {
      type: 'example',
      title: 'Konfigurasi Post-build Actions (tampilan formulir)',
      lang: 'text',
      output: false,
      code: `Post-build Actions
  Archive the artifacts
      Files to archive   : dist/**
      Fingerprint        : aktif (melacak pemakaian artefak antar job)

  Publish JUnit test results
      Test report XMLs   : test-results/*.xml
      Health scale       : unstable bila kelulusan < 80%, failure bila < 50%

  E-mail notification (plugin Mailer) atau Slack Notification
      Recipients         : tim-contoh@example.com
      Send on            : hanya saat gagal`,
      explain: [
        'Pola <code>dist/**</code> berarti "arsipkan seluruh isi folder <code>dist/</code> beserta subfoldernya".',
        'Publisher JUnit tidak membuat build gagal otomatis; yang menentukan adalah <i>Health scale</i> yang kamu atur di atas.',
        'Mengirim surel pada setiap build menghasilkan kebisingan notifikasi; kirim hanya saat gagal agar perhatian tim tetap terjaga.',
        'Pada pipeline modern, semua tindakan ini pindah ke blok <code>post</code> di dalam <code>Jenkinsfile</code> — persis materi bab berikutnya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Pola Cron dan Nilai <code>H</code></h3><p>Jenkins memakai format cron lima kolom: <code>menit jam hari-bulan hari-minggu</code>. Yang membedakannya dari cron pada umumnya adalah ketersediaan karakter khusus <b><code>H</code></b> (dibaca "hash"). Nilai <code>H</code> bukan angka tetap, melainkan <b>hash dari nama job</b> yang diubah menjadi angka dalam rentang yang sah untuk kolom tersebut.</p><p>Tujuannya mencegah "tabrakan massal": bayangkan 50 job sama-sama dijadwalkan <code>0 2 * * *</code> — pukul 02.00 server tiba-tiba membangun 50 proyek sekaligus dan kehabisan <i>executor</i>. Dengan <code>H 2 * * *</code>, tiap job mendapat menit acaknya sendiri dalam rentang jam 02.00–02.59, sehingga beban tersebar rata tanpa kamu repot mengaturnya satu per satu.</p><p>Penting: gunakan <code>H</code> pada kolom yang memungkinkan. <code>*</code> pada kolom menit tetap boleh, tetapi kebiasaan terbaik adalah menulis <code>H</code> di kolom pertama, misalnya <code>H/15 * * * *</code> berarti "tiap 15 menit, pada menit yang berbeda untuk tiap job".</p>'
    },
    {
      type: 'example',
      title: 'Contoh Jadwal cron untuk Build Triggers',
      lang: 'text',
      output: false,
      code: `Build periodically / Poll SCM — isian Schedule (cron 5 kolom)

  H/15 * * * *        tiap 15 menit, menit berbeda per job
  H(0-29) * * * *     tiap jam, pada rentang menit 0-29
  H 2 * * * *         sekali sehari, sekitar pukul 02.00 (jam acak per job)
  H/10 8-18 * * 1-5   tiap 10 menit, jam kerja, Senin sampai Jumat
  @midnight            setara H 0 * * * (tengah malam)`,
      explain: [
        '<code>H/15 * * * *</code> cocok untuk Poll SCM bila webhook belum tersedia: Jenkins mengecek repository tiap 15 menit dan menjalankan build hanya bila ada commit baru.',
        '<code>H(0-29) * * * *</code> memakai rentang pada <code>H</code>: hash job diacak dalam rentang menit 0–29.',
        'Cron tanpa <code>H</code> (misalnya <code>0 2 * * *</code>) masih sah, tetapi tidak disarankan karena memusatkan beban pada satu waktu yang sama.',
        'Selalu klik tombol <i>Help</i> di samping kolom <i>Schedule</i>: Jenkins menampilkan contoh cron lengkap langsung di formulir.'
      ]
    },
    {
      type: 'text',
      html: `<h3>Kenapa Freestyle Dianggap Warisan?</h3><p>Konfigurasi Freestyle tersimpan sebagai berkas XML di dalam <code>$JENKINS_HOME/jobs/&lt;nama-job&gt;/config.xml</code> — artinya <b>hidup dan matinya konfigurasi ada di server Jenkins</b>, bukan di repository Git tim. Akibatnya konfigurasi sulit direview, sulit diaudit, dan sulit direplikasi ke instance Jenkins lain. Bila server rusak tanpa backup, seluruh pengetahuan proses build ikut hilang.</p><figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 350" width="760" role="img" aria-label="Perbandingan dua kolom: Freestyle menyimpan konfigurasi di Jenkins UI sementara Pipeline menyimpan Jenkinsfile di Git">
        <rect x="20" y="44" width="330" height="244" rx="10" class="u-box"/>
        <text x="185" y="72" class="u-title" text-anchor="middle">Freestyle (legacy)</text>
        <line x1="35" y1="82" x2="335" y2="82" class="u-line"/>
        <rect x="40" y="94" width="290" height="34" rx="6" class="u-hd"/>
        <text x="185" y="115" class="u-lbl" text-anchor="middle">Konfigurasi lewat Jenkins UI</text>
        <rect x="40" y="136" width="290" height="34" rx="6" class="u-box"/>
        <text x="185" y="157" class="u-lbl" text-anchor="middle">Tersimpan di server (config.xml)</text>
        <rect x="40" y="178" width="290" height="34" rx="6" class="u-box"/>
        <text x="185" y="199" class="u-lbl" text-anchor="middle">Sulit direview &amp; diaudit</text>
        <rect x="40" y="220" width="290" height="34" rx="6" class="u-box"/>
        <text x="185" y="241" class="u-lbl" text-anchor="middle">Sulit direplikasi &amp; pindah agent</text>
        <rect x="410" y="44" width="330" height="244" rx="10" class="u-box"/>
        <text x="575" y="72" class="u-title" text-anchor="middle">Pipeline as Code</text>
        <line x1="425" y1="82" x2="725" y2="82" class="u-line"/>
        <rect x="430" y="94" width="290" height="34" rx="6" class="u-hd"/>
        <text x="575" y="115" class="u-lbl" text-anchor="middle">Jenkinsfile di repository Git</text>
        <rect x="430" y="136" width="290" height="34" rx="6" class="u-box"/>
        <text x="575" y="157" class="u-lbl" text-anchor="middle">Direview bersama kode (Pull Request)</text>
        <rect x="430" y="178" width="290" height="34" rx="6" class="u-box"/>
        <text x="575" y="199" class="u-lbl" text-anchor="middle">Reproducible, bisa dijalankan ulang</text>
        <rect x="430" y="220" width="290" height="34" rx="6" class="u-box"/>
        <text x="575" y="241" class="u-lbl" text-anchor="middle">Mudah berpindah antar agent</text>
        <line x1="358" y1="166" x2="392" y2="166" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="375" y="152" class="u-lbl" text-anchor="middle">migrasi</text>
        <text x="375" y="318" class="u-lbl" text-anchor="middle">Pipeline: alur build ikut bermigrasi bersama kode sumber</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 5.1</b> — Perbandingan penyimpanan konfigurasi: Freestyle di server Jenkins vs Pipeline di repository Git</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Kapan Freestyle Masih Layak Dipakai?</h3><p>Meski secara umum digolongkan warisan, Freestyle bukan berarti harus dimusnahkan seketika. Gaya ini masih wajar untuk kebutuhan sederhana dan sekali jalan, misalnya:</p><ul><li><b>Job pembersih (cleanup)</b> — menghapus file lama tiap malam, tanpa butuh pengambilan kode atau laporan pengujian.</li><li><b>Job notifikasi atau ping</b> — memeriksa kesehatan layanan dan mengirim pesan bila ada masalah.</li><li><b>Job migrasi manual</b> — menjalankan skrip sekali jalan yang tidak perlu masuk version control.</li><li><b>Jembatan migrasi</b> — saat tim belum siap dengan Pipeline, Freestyle bisa menampung kebutuhan sederhana sementara waktu.</li></ul><p>Sebaliknya, begitu sebuah job mulai menyentuh pengujian, arsip build, parameterisasi, atau penyebaran ke lebih dari satu lingkungan, migrasi ke <b>Declarative Pipeline</b> adalah langkah yang lebih sehat. Bab berikutnya akan membahasnya secara menyeluruh.</p>'
    },
    {
      type: 'tip',
      title: 'Praktik Mandiri dengan Podman &amp; Akun Gratis',
      text: 'Semua materi ini dapat dipraktikkan gratis: jalankan Jenkins open source dengan Podman (<code>podman run -d --name jenkins -p 8080:8080 -p 50000:50000 -v jenkins_home:/var/jenkins_home jenkins/jenkins:lts-jdk17</code>), buat satu repository publik di GitHub atau GitLab free tier, lalu praktikkan seluruh langkah di atas dari awal sampai akhir. Tidak perlu server berbayar.'
    },
    {
      type: 'warn',
      title: 'Freestyle Bukan Fondasi Baru',
      text: 'Jangan membangun standar baru di atas Freestyle. Konfigurasinya tidak ikut repository Git, tidak bisa direview lewat Pull Request, dan tidak direplikasi otomatis ke instance Jenkins lain. Untuk pekerjaan apa pun yang menyangkut proses build produksi, gunakan Pipeline as Code.'
    },
    {
      type: 'vocab',
      items: [
        ['Freestyle Project', 'Tipe job klasik Jenkins yang konfigurasinya diisi seluruhnya lewat formulir antarmuka web.'],
        ['Job', 'Satu unit pekerjaan di Jenkins; berisi jadwal, kode sumber, dan langkah-langkah build.'],
        ['Workspace', 'Direktori kerja tempat Jenkins mengambil kode sumber dan menjalankan perintah build.'],
        ['Build Step', 'Satu perintah yang dijalankan berurutan dalam sebuah build, misalnya Execute shell atau Windows Batch.'],
        ['Post-build Action', 'Tindakan setelah build selesai: arsip artefak, laporan pengujian, surel, notifikasi Slack.'],
        ['Artifact', 'File hasil build yang diarsipkan Jenkins agar bisa diunduh dan dipakai ulang.'],
        ['Poll SCM', 'Pemicu yang membuat Jenkins mengecek repository secara berkala; build berjalan hanya bila ada perubahan.'],
        ['Webhook', 'Pemberitahuan langsung dari layanan Git ke Jenkins setiap kali ada git push; paling hemat dibanding polling.'],
        ['Kredensial (Credentials)', 'Pasangan nama pengguna dan rahasia (token, kata sandi, kunci SSH) yang disimpan aman di Jenkins.']
      ]
    }
  ],
  recap: [
    'Freestyle project adalah tipe job klasik Jenkins yang konfigurasinya dikumpulkan dalam satu formulir antarmuka web.',
    'Bagian utamanya: Source Code Management, Build Triggers, Build Environment, Build Steps, dan Post-build Actions.',
    'Karakter <code>H</code> pada cron adalah hash nama job sehingga beban build tersebar, bukan menumpuk pada satu waktu.',
    'Freestyle masih layak untuk tugas sekali jalan yang sederhana; untuk proses build produksi, beralihlah ke Pipeline as Code.'
  ]
});
