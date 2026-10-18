/* ============================================================
   Pelajaran Jenkins — Bab 1: Pengantar CI/CD & Arsitektur Jenkins
   ============================================================ */
'use strict';

window.JENKINS_LESSONS = window.JENKINS_LESSONS || [];

window.JENKINS_LESSONS.push({
  id: 'pengantar-cicd',
  title: 'Pengantar CI/CD & Arsitektur Jenkins',
  chapter: 'Pengenalan',
  duration: '8–10 menit',
  intro: [
    'Setiap tim pernah melewati fase yang sama: rilis dikerjakan dengan menjalankan belasan perintah sambil membuka catatan, pengujian "di laptop saya kok jalan", dan satu merge keliru mampu menghentikan layanan di akhir pekan. Semua itu bukan salah orangnya, melainkan gejala otomatisasi yang belum ada.',
    '<b>Continuous Integration (CI)</b> adalah praktik menggabungkan kode banyak developer ke satu sumber utama secara sering, lalu memverifikasinya secara otomatis setiap kali kode berubah. <b>Continuous Delivery (CD)</b> melangkah lebih jauh: hasil build selalu berada dalam kondisi siap rilis, tetapi penyebaran ke produksi masih menunggu persetujuan orang. <b>Continuous Deployment</b> menghapus gerbang persetujuan itu — setiap perubahan yang lolos verifikasi otomatis sampai ke pengguna.',
    'Bab ini membahas alur CI/CD standar, arsitektur Jenkins (Controller, Agent, Executor, dan Workspace), peran webhook, serta mengapa <b>Pipeline-as-Code</b> menggantikan konfigurasi klik-klik di UI. Seluruh praktik memakai Podman dan layanan gratis seperti GitHub/GitLab free tier, sehingga kamu bisa menjalankannya di laptop sendiri tanpa biaya.'
  ],
  objectives: [
    'Membedakan Continuous Integration, Continuous Delivery, dan Continuous Deployment',
    'Memahami peran Controller, Agent, Executor, dan Workspace dalam arsitektur Jenkins',
    'Mengenali alur CI/CD standar dari checkout sampai deploy',
    'Menyadari keunggulan Pipeline-as-Code dibanding konfigurasi di antarmuka Jenkins'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Masalah Rilis Manual</h3><p>Tanpa otomatisasi, siklus pengembangan software bergantung pada ingatan dan disiplin perorangan. Beberapa gejalanya selalu berulang:</p><ul><li><b>Integrasi menumpuk</b> — developer menggabungkan kode setiap beberapa minggu sehingga konflik menumpuk dan sulit dilacak asalnya.</li><li><b>Lingkungan tidak seragam</b> — hasil di laptop berbeda dengan hasil di server karena versi dependensi dan konfigurasi berbeda-beda.</li><li><b>Umpan balik lambat</b> — kesalahan baru diketahui saat rilis, ketika biaya perbaikan paling mahal.</li><li><b>Pengetahuan menyebar di kepala orang</b> — hanya satu orang yang hafal urutan langkah rilis, dan orang itu sedang cuti saat darurat terjadi.</li></ul><p>Otomatisasi tidak sekadar mempercepat, tetapi juga menyerahkan pekerjaan berulang ke mesin agar manusia fokus pada keputusan yang penting.</p>'
    },
    {
      type: 'text',
      html: '<h3>Apa itu Continuous Integration?</h3><p><b>Continuous Integration</b> adalah praktik menggabungkan setiap perubahan kode ke sumber utama (trunk atau branch <code>main</code>) secara sering, lalu membangun dan menguji hasilnya secara otomatis. Tujuannya bukan "memasang tool CI", melainkan <b>menemukan kesalahan dalam hitungan menit</b>, bukan hitungan minggu.</p><p>Ciri-ciri tim yang benar-benar menjalankan CI:</p><ul><li>Setiap developer meng-push minimal sekali sehari; perubahan dibuat kecil dan mudah digabung.</li><li>Build penuh (kompilasi + pengujian) selesai cepat, idealnya di bawah 10 menit, agar umpan balik tetap berguna.</li><li>Hasil build terlihat oleh seluruh tim, bukan disimpan di komputer pribadi.</li><li>Build yang gagal diperbaiki segera — build merah dianggap keadaan darurat.</li></ul>'
    },
    {
      type: 'text',
      html: '<h3>Continuous Delivery vs Continuous Deployment</h3><p>Keduanya sering tertukar karena sama-sama memakai singkatan CD. Bedanya terletak pada satu hal: <b>siapa yang menekan tombol rilis</b>.</p><ul><li><b>Continuous Delivery</b> — hasil build selalu siap diarahkan ke produksi kapan saja, tetapi penyebaran tetap memerlukan persetujuan (misalnya validasi QA atau manajer produk). Cocok untuk produk dengan kewajiban audit atau jendela rilis tetap.</li><li><b>Continuous Deployment</b> — setiap perubahan yang lolos pengujian otomatis sampai ke pengguna tanpa tangan manusia. Syaratnya wajib kuat: pengujian otomatis andal, pemantauan (monitoring) matang, dan kemampuan rollback cepat.</li></ul><p>Praktiknya, tim biasa menempuh jalur berjenjang: mulai dari Continuous Integration, lalu Continuous Delivery, dan hanya masuk ke Continuous Deployment setelah kualitas pengujian serta kesiapan pemantauan benar-benar teruji.</p>'
    },
    {
      type: 'text',
      html: '<h3>Sekilas Jenkins: dari Hudson ke Standar Industri</h3><p>Jenkins lahir sebagai <b>Hudson</b>, proyek sampingan Kohsuke Kawaguchi di Sun Microsystems sekitar 2004–2005. Setelah Oracle mengakuisisi Sun, perdebatan merek dan arah proyek memicu <b>fork terbuka pada 2011</b>; komunitas memindahkan seluruh aktifitas ke Jenkins dan Oracle menamai ulang Hudson (yang kemudian tidak lagi aktif).</p><p>Beberapa alasan Jenkins bertahan lama di industri:</p><ul><li><b>Gratis dan sumber terbuka</b> — lisensi MIT, ditulis dalam bahasa Java, dapat dijalankan di sistem operasi apa pun.</li><li><b>Ekosistem plugin</b> — lebih dari 1.800 plugin resmi komunitas menambahkan integrasi Git, notifikasi Slack, pemindaian keamanan, dan banyak lagi.</li><li><b>Self-hosted</b> — seluruh kode, log, dan kredensial tetap berada di infrastruktur milikmu sendiri.</li><li><b>Sintaks pipeline standar</b> — <code>Jenkinsfile</code> yang sama dapat dipindahkan ke server Jenkins lain dengan sedikit perubahan.</li></ul><p>Walaupun kini ada GitLab CI dan GitHub Actions, Jenkins tetap relevan karena fleksibel menyesuaikan alur kerja apa pun, termasuk lingkungan on-premise yang tidak boleh terhubung ke layanan awan.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 350" width="760" role="img" aria-label="Arsitektur Jenkins dengan Controller yang terhubung ke dua agent serta repository dengan webhook">
        <rect x="20" y="120" width="170" height="90" rx="10" class="u-box"/>
        <text x="105" y="146" class="u-title" text-anchor="middle">GitHub / GitLab</text>
        <line x1="34" y1="156" x2="176" y2="156" class="u-line"/>
        <rect x="38" y="166" width="134" height="28" rx="6" class="u-hd"/>
        <text x="105" y="185" class="u-lbl" text-anchor="middle">Webhook</text>
        <rect x="250" y="30" width="220" height="280" rx="10" class="u-box"/>
        <text x="360" y="56" class="u-title" text-anchor="middle">Controller (Master)</text>
        <line x1="264" y1="66" x2="456" y2="66" class="u-line"/>
        <rect x="266" y="78" width="188" height="34" rx="6" class="u-hd"/>
        <text x="360" y="100" class="u-lbl" text-anchor="middle">Web UI &amp; API</text>
        <rect x="266" y="120" width="188" height="34" rx="6" class="u-box"/>
        <text x="360" y="142" class="u-lbl" text-anchor="middle">Antrian Build</text>
        <rect x="266" y="162" width="188" height="34" rx="6" class="u-box"/>
        <text x="360" y="184" class="u-lbl" text-anchor="middle">Plugin &amp; Kredensial</text>
        <rect x="266" y="204" width="188" height="34" rx="6" class="u-box"/>
        <text x="360" y="226" class="u-lbl" text-anchor="middle">Penjadwal Build</text>
        <rect x="266" y="246" width="188" height="34" rx="6" class="u-box"/>
        <text x="360" y="268" class="u-lbl" text-anchor="middle">Konfigurasi &amp; Log</text>
        <line x1="190" y1="165" x2="246" y2="150" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="218" y="138" class="u-lbl" text-anchor="middle">git push</text>
        <rect x="540" y="40" width="200" height="78" rx="10" class="u-box"/>
        <text x="640" y="62" class="u-title" text-anchor="middle">Agent 1 (Node)</text>
        <line x1="553" y1="72" x2="727" y2="72" class="u-line"/>
        <rect x="553" y="82" width="82" height="28" rx="6" class="u-hd"/>
        <text x="594" y="100" class="u-lbl" text-anchor="middle">Executor</text>
        <rect x="645" y="82" width="82" height="28" rx="6" class="u-box"/>
        <text x="686" y="100" class="u-lbl" text-anchor="middle">Workspace</text>
        <text x="640" y="136" class="u-lbl" text-anchor="middle">menjalankan build</text>
        <rect x="540" y="196" width="200" height="78" rx="10" class="u-box"/>
        <text x="640" y="218" class="u-title" text-anchor="middle">Agent 2 (Node)</text>
        <line x1="553" y1="228" x2="727" y2="228" class="u-line"/>
        <rect x="553" y="238" width="82" height="28" rx="6" class="u-hd"/>
        <text x="594" y="256" class="u-lbl" text-anchor="middle">Executor</text>
        <rect x="645" y="238" width="82" height="28" rx="6" class="u-box"/>
        <text x="686" y="256" class="u-lbl" text-anchor="middle">Workspace</text>
        <text x="640" y="294" class="u-lbl" text-anchor="middle">menjalankan build</text>
        <line x1="470" y1="120" x2="534" y2="98" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="470" y1="200" x2="534" y2="222" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="502" y="165" class="u-lbl" text-anchor="middle">tugasi</text>
        <text x="380" y="342" class="u-lbl" text-anchor="middle">Webhook memicu build; Controller menugaskan ke Agent; status &amp; artefak kembali ke Web UI</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 1.1</b> — Arsitektur Jenkins: satu Controller, dua Agent dengan Executor dan Workspace, serta webhook dari repository Git</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Menjelaskan Komponen Arsitektur</h3><p><b>Controller (dahulu disebut Master)</b> adalah otak Jenkins: antarmuka web, penjadwal, antrian build, penyimpanan konfigurasi, kredensial, serta plugin. Controller sebaiknya tidak dipakai untuk menjalankan build berat — tuganya mengatur, bukan mengerjakan.</p><p><b>Agent (dahulu Node)</b> adalah mesin tempat build dieksekusi, bisa VM, laptop developer, maupun container. Setiap agent memiliki <b>Executor</b>, yaitu slot jumlah build paralel yang boleh berjalan (misalnya 2 executor berarti dua build bersamaan). Di setiap eksekusi, agent membuat <b>Workspace</b>: direktori kerja bersih tempat kode di-checkout, di-build, lalu dibersihkan.</p><p>Koneksi Controller ke agent umumnya lewat dua jalur: <b>SSH</b> (Controller masuk ke agent memakai kunci) atau <b>inbound agent</b> (agent yang menjalankan proses kecil lalu menyambung dirinya ke Controller, cocok untuk mesin di balik firewall).</p><p>Terakhir, <b>webhook</b> adalah pemberitahuan otomatis dari GitHub/GitLab setiap kali ada <code>git push</code> atau pull request. Tanpa webhook, Jenkins menunggu jadwal pemeriksaan berkala; dengan webhook, build langsung berjalan dalam hitungan detik.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 350" width="760" role="img" aria-label="Perbandingan konfigurasi job di UI Jenkins dengan Pipeline-as-Code dalam Jenkinsfile">
        <rect x="40" y="40" width="300" height="240" rx="10" class="u-box"/>
        <text x="190" y="66" class="u-title" text-anchor="middle">Konfigurasi di UI (Freestyle)</text>
        <line x1="56" y1="76" x2="324" y2="76" class="u-line"/>
        <rect x="60" y="88" width="260" height="34" rx="6" class="u-box"/>
        <text x="190" y="110" class="u-lbl" text-anchor="middle">Klik-klik di browser</text>
        <rect x="60" y="132" width="260" height="34" rx="6" class="u-box"/>
        <text x="190" y="154" class="u-lbl" text-anchor="middle">Tersimpan di server Jenkins</text>
        <rect x="60" y="176" width="260" height="34" rx="6" class="u-box"/>
        <text x="190" y="198" class="u-lbl" text-anchor="middle">Sulit direview &amp; diaudit</text>
        <rect x="60" y="220" width="260" height="34" rx="6" class="u-box"/>
        <text x="190" y="242" class="u-lbl" text-anchor="middle">Sulit direplikasi ke server lain</text>
        <rect x="420" y="40" width="300" height="240" rx="10" class="u-box"/>
        <text x="570" y="66" class="u-title" text-anchor="middle">Pipeline-as-Code (Jenkinsfile)</text>
        <line x1="436" y1="76" x2="704" y2="76" class="u-line"/>
        <rect x="440" y="88" width="260" height="34" rx="6" class="u-hd"/>
        <text x="570" y="110" class="u-lbl" text-anchor="middle">Ditulis sebagai kode Groovy</text>
        <rect x="440" y="132" width="260" height="34" rx="6" class="u-hd"/>
        <text x="570" y="154" class="u-lbl" text-anchor="middle">Hidup di repository Git</text>
        <rect x="440" y="176" width="260" height="34" rx="6" class="u-hd"/>
        <text x="570" y="198" class="u-lbl" text-anchor="middle">Direview lewat pull request</text>
        <rect x="440" y="220" width="260" height="34" rx="6" class="u-hd"/>
        <text x="570" y="242" class="u-lbl" text-anchor="middle">Sejarah versi &amp; rollback jelas</text>
        <text x="380" y="316" class="u-lbl" text-anchor="middle">Konfigurasi UI hanya cocok untuk eksperimen cepat; untuk tim, pipeline dikelola bersama seperti kode biasa</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 1.2</b> — Konfigurasi klik-klik di UI dibanding Pipeline-as-Code yang tersimpan di Git</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Alur CI/CD Standar dari Push sampai Deploy',
      lang: 'text',
      output: false,
      code: `git push ke branch main
        ↓
webhook memberi tahu Jenkins
        ↓
1. Checkout  → ambil kode terbaru dari repository
2. Build     → kompilasi / install dependensi
3. Test      → jalankan unit test, integration test, lint
4. Package   → hasilkan artefak: jar, tar.gz, atau image container
5. Publish   → unggah artefak / push image ke registry
6. Deploy    → terapkan ke server staging, lalu produksi
        ↓
notifikasi hasil build dikirim ke tim (email / Slack)`,
      explain: [
        'Urutan enam langkah ini disebut <i>alur CI/CD standar</i> dan berlaku untuk hampir semua jenis proyek, dari Node.js sampai Go.',
        'Langkah 1–3 adalah inti Continuous Integration: verifikasi bahwa setiap perubahan tetap aman digabungkan.',
        'Langkah 4–5 adalah Continuous Delivery — artefak selalu siap rilis dan tersimpan di tempat yang bisa diambil kapan saja.',
        'Langkah 6 adalah Continuous Deployment bila dijalankan otomatis, atau tetap menunggu persetujuan bila timmu memakai Continuous Delivery.'
      ]
    },
    {
      type: 'example',
      title: 'Tanpa CI vs Dengan CI',
      lang: 'text',
      output: false,
      code: `TANPA CI (manual)                     DENGAN CI (otomatis)
-------------------------------       -------------------------------
kode di-push lalu didiamkan           setiap push langsung memicu build
dites di laptop developer             diuji di server bersih & seragam
gabungan besar tiap 2–3 minggu        merge kecil & sering
konflik menumpuk                      konflik ketahuan dalam menit
rilis = checklist manual panjang      rilis = tombol, atau otomatis
bug ditemukan saat rilis              bug ditemukan sebelum merge`,
      explain: [
        'Perbandingan ini menunjukkan CI bukan sekadar penghemat waktu, tetapi perubahan cara kerja tim: masalah ditemukan lebih awal dan dampaknya jauh lebih kecil.',
        'Sisi kiri mengandalkan disiplin dan ingatan manusia; sisi kiri mengandalkan proses yang dijalankan mesin secara konsisten.',
        'Biaya awal memasang CI terbayar lunas begitu satu bug kritis tertangkap sebelum menyentuh pengguna.'
      ]
    },
    {
      type: 'example',
      title: 'Jenkinsfile Declarative Paling Sederhana',
      lang: 'groovy',
      output: false,
      code: `// Jenkinsfile — simpan di root repository, lalu commit
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Build') {
            steps {
                sh 'npm ci'
            }
        }
        stage('Test') {
            steps {
                sh 'npm test'
            }
        }
        stage('Package') {
            steps {
                sh 'podman build -t aplikasi:1.0.0 .'
            }
        }
    }

    post {
        always {
            echo 'Build selesai — kirim notifikasi ke tim'
        }
    }
}`,
      explain: [
        'Blok <code>pipeline</code> adalah gerbang masuk Declarative Pipeline; <code>agent any</code> berarti "jalankan di mana saja yang tersedia" — cocok untuk Jenkins lokal dengan satu container.',
        'Setiap <code>stage</code> mewakili satu tahap pada alur CI/CD dan tampil sebagai kartu terpisah di antarmuka Jenkins.',
        'Langkah <code>checkout scm</code> mengambil kode sesuai konfigurasi repository job, sehingga Jenkinsfile ini bisa dipakai ulang di banyak proyek.',
        'Blok <code>post { always { ... } }</code> berjalan apa pun hasilnya — tempat yang tepat untuk notifikasi pembersihan workspace.'
      ]
    },
    {
      type: 'tip',
      title: 'Praktik Gratis di Laptop Sendiri',
      text: 'Seluruh materi Jenkins di situs ini dirancang untuk dijalankan lokal dengan <b>Podman</b> (gratis, rootless) dan image resmi <code>jenkins/jenkins:lts-jdk17</code>. Untuk repository, pakai akun gratis GitHub atau GitLab; untuk proyek percobaan, Git lokal pun cukup. Tidak ada layanan berbayar yang dipakai, jadi kamu bisa mengulang praktik tanpa khawatir biaya.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Pipeline-as-Code membuat konfigurasi ikut ter-commit ke Git — termasuk kesalahanmu. Karena itu, jangan pernah menulis token, kata sandi, atau kunci privat di dalam <code>Jenkinsfile</code>: riwayat Git bersifat permanen dan sulit dibersihkan. Rahasia semacam itu wajib disimpan di <b>Credentials Manager</b> Jenkins dan dipanggil dari pipeline lewat ID kredensial, seperti dibahas pada pelajaran Keamanan &amp; Manajemen Kredensial.'
    },
    {
      type: 'vocab',
      items: [
        ['Continuous Integration (CI)', 'Praktik menggabungkan kode sering ke sumber utama, lalu membangun dan mengujinya secara otomatis setiap kali ada perubahan.'],
        ['Continuous Delivery', 'Kondisi di mana hasil build selalu siap dirilis ke produksi, tetapi penyebaran tetap memerlukan persetujuan manusia.'],
        ['Continuous Deployment', 'Penyebaran setiap perubahan yang lolos pengujian ke pengguna secara otomatis, tanpa gerbang persetujuan manual.'],
        ['Controller (Master)', 'Komponen pusat Jenkins yang mengelola antarmuka web, antrian build, penjadwal, plugin, dan kredensial.'],
        ['Agent (Node)', 'Mesin (VM, fisik, atau container) yang menjalankan build atas penugasan Controller.'],
        ['Executor', 'Satu slot paralel pada agent; menentukan berapa banyak build yang bisa berjalan bersamaan di mesin tersebut.'],
        ['Workspace', 'Direktori kerja pada agent tempat kode di-checkout, diproses, dan biasanya dibersihkan setelah build.'],
        ['Webhook', 'Pemberitahuan otomatis dari repository Git (GitHub/GitLab) ke Jenkins setiap kali terjadi push atau pull request.'],
        ['Pipeline-as-Code', 'Pendekatan menulis alur build sebagai berkas <code>Jenkinsfile</code> di Git, bukan mengklik-klik di antarmuka Jenkins.']
      ]
    }
  ],
  recap: [
    'Continuous Integration memverifikasi setiap perubahan secara otomatis; Continuous Delivery menjaga hasil build selalu siap rilis; Continuous Deployment menyebar otomatis tanpa persetujuan manual.',
    'Jenkins terdiri dari Controller sebagai pusat pengaturan dan Agent sebagai pelaksana build, lengkap dengan Executor (slot) dan Workspace (direktori kerja).',
    'Webhook membuat build berjalan dalam hitungan detik setelah push, menggantikan pemeriksaan berkala yang lambat.',
    'Pipeline-as-Code memindahkan konfigurasi dari klik-klik UI ke Jenkinsfile di Git, sehingga bisa direview, di-versioning, dan direplikasi.'
  ]
});
