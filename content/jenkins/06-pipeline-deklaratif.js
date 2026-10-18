/* ============================================================
   Pelajaran Jenkins — Bab 6: Declarative Pipeline — Anatomi Jenkinsfile (L6)
   ============================================================ */
'use strict';

window.JENKINS_LESSONS = window.JENKINS_LESSONS || [];

window.JENKINS_LESSONS.push({
  id: 'pipeline-deklaratif',
  title: 'Declarative Pipeline: Anatomi Jenkinsfile',
  chapter: 'Pipeline as Code',
  duration: '8–10 menit',
  intro: [
    '<b>Pipeline as Code</b> adalah pendekatan di mana alur integrasi dan penyebaran ditulis sebagai berkas kode bernama <b>Jenkinsfile</b> dan disimpan bersama source code di repository Git. Konfigurasi berpindah dari formulir Jenkins ke tangan pengembang: bisa direview, diubah lewat Pull Request, dan dijalankan ulang di instance Jenkins mana pun.',
    '<b>Declarative Pipeline</b> adalah gaya penulisan Jenkinsfile dengan struktur baku dan terbatas: kamu mendeklarasikan <i>apa</i> yang harus terjadi (agent, stages, post), dan Jenkins mengeksekusinya secara berurutan. Gaya ini paling direkomendasikan untuk tim yang baru memulai karena hasilnya konsisten dan mudah distandarkan.',
    'Bab ini membahas anatomi lengkap Jenkinsfile — dari blok <code>pipeline</code>, <code>agent</code>, <code>options</code>, <code>triggers</code>, <code>environment</code>, <code>parameters</code>, <code>tools</code>, sampai <code>stages</code> dan <code>post</code> — serta cara memasangnya lewat job bertipe Pipeline.'
  ],
  objectives: [
    'Memahami anatomi Jenkinsfile Declarative dan urutan bloknya',
    'Menggunakan direktif <code>agent</code>, <code>environment</code>, <code>parameters</code>, dan <code>options</code> dengan tepat',
    'Menulis stages, steps, dan blok post (<code>always</code>, <code>success</code>, <code>failure</code>, <code>changed</code>)',
    'Memasang Jenkinsfile ke job Pipeline lewat mekanisme "Pipeline script from SCM"'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Perubahan Mindset: dari Job ke Berkas</h3><p>Pada Freestyle, seluruh konfigurasi berada di formulir Jenkins. Pada Pipeline, konfigurasi pindah ke satu berkas Groovy bernama <code>Jenkinsfile</code> yang diletakkan di root repository (atau lokasi lain yang kamu tentukan). Begitu berkas ini ter-commit, setiap perubahan alur build ikut terekam dalam riwayat Git: siapa yang mengubah, kapan, dan mengapa.</p><p>Keunggulan praktisnya nyata: konfigurasi bisa <b>direview</b> bersama kode dalam satu Pull Request, <b>direplikasi</b> dengan menyalin satu berkas ke repository lain, dan <b>dijalankan ulang</b> di instance Jenkins mana pun tanpa mengklik ulang formulir. Untuk mencoba sendiri, kamu cukup Jenkins open source (jalankan dengan Podman) dan repository publik gratis di GitHub atau GitLab.</p>'
    },
    {
      type: 'text',
      html: '<h3>Blok-Blok Utama Jenkinsfile</h3><p>Secara berurutan dari luar ke dalam, struktur Declarative terdiri dari:</p><table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%"><thead><tr><th>Blok / Direktif</th><th>Fungsi</th></tr></thead><tbody><tr><td><code>pipeline { }</code></td><td>Kerangka wajib; seluruh isi berada di dalamnya</td></tr><tr><td><code>agent</code></td><td>Menentukan di mana pekerjaan dijalankan: <code>any</code>, <code>none</code>, atau <code>label</code></td></tr><tr><td><code>options</code></td><td>Opsi build: <code>timeout()</code>, <code>timestamps()</code>, <code>buildDiscarder()</code></td></tr><tr><td><code>triggers</code></td><td>Penjadwalan otomatis, misalnya <code>cron(\'H 2 * * *\')</code></td></tr><tr><td><code>environment</code></td><td>Variabel lingkungan; nilai rahasia diambil lewat <code>credentials(\'id\')</code></td></tr><tr><td><code>parameters</code></td><td>Parameter build: <code>string()</code>, <code>booleanParam()</code>, <code>choice()</code></td></tr><tr><td><code>tools</code></td><td>Alat yang disediakan Jenkins, misalnya <code>nodejs \'node-20\'</code></td></tr><tr><td><code>stages</code> → <code>stage</code> → <code>steps</code></td><td>Alur pekerjaan: rangkaian tahap, masing-masing berisi langkah</td></tr><tr><td><code>post</code></td><td>Tindakan penutup berdasarkan hasil: <code>always</code>, <code>success</code>, <code>failure</code>, <code>changed</code>, <code>aborted</code></td></tr></tbody></table>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 350" width="760" role="img" aria-label="Anatomi Jenkinsfile berjenjang: pipeline, direktif, stages berisi stage, lalu post">
        <rect x="270" y="16" width="220" height="32" rx="6" class="u-hd"/>
        <text x="380" y="37" class="u-lbl" text-anchor="middle">pipeline { }</text>
        <rect x="20" y="66" width="165" height="30" rx="6" class="u-box"/>
        <text x="102" y="85" class="u-lbl" text-anchor="middle">agent any</text>
        <rect x="205" y="66" width="165" height="30" rx="6" class="u-box"/>
        <text x="287" y="85" class="u-lbl" text-anchor="middle">options</text>
        <rect x="390" y="66" width="165" height="30" rx="6" class="u-box"/>
        <text x="472" y="85" class="u-lbl" text-anchor="middle">environment</text>
        <rect x="575" y="66" width="165" height="30" rx="6" class="u-box"/>
        <text x="657" y="85" class="u-lbl" text-anchor="middle">parameters</text>
        <line x1="330" y1="48" x2="112" y2="64" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="360" y1="48" x2="292" y2="64" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="400" y1="48" x2="467" y2="64" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="430" y1="48" x2="650" y2="64" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="380" y1="96" x2="380" y2="114" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="280" y="116" width="200" height="30" rx="6" class="u-box"/>
        <text x="380" y="135" class="u-lbl" text-anchor="middle">stages { }</text>
        <rect x="30" y="170" width="155" height="30" rx="6" class="u-box"/>
        <text x="107" y="189" class="u-lbl" text-anchor="middle">stage Checkout</text>
        <rect x="205" y="170" width="155" height="30" rx="6" class="u-box"/>
        <text x="282" y="189" class="u-lbl" text-anchor="middle">stage Test</text>
        <rect x="380" y="170" width="155" height="30" rx="6" class="u-box"/>
        <text x="457" y="189" class="u-lbl" text-anchor="middle">stage Build</text>
        <rect x="555" y="170" width="155" height="30" rx="6" class="u-box"/>
        <text x="632" y="189" class="u-lbl" text-anchor="middle">stage Deploy</text>
        <line x1="380" y1="146" x2="112" y2="168" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="380" y1="146" x2="287" y2="168" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="380" y1="146" x2="452" y2="168" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="380" y1="146" x2="627" y2="168" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="107" y="216" class="u-lbl" text-anchor="middle">checkout scm</text>
        <text x="282" y="216" class="u-lbl" text-anchor="middle">sh 'npm test'</text>
        <text x="457" y="216" class="u-lbl" text-anchor="middle">sh 'npm run build'</text>
        <text x="632" y="216" class="u-lbl" text-anchor="middle">sh './deploy.sh'</text>
        <line x1="632" y1="226" x2="420" y2="252" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="200" y="256" width="360" height="34" rx="6" class="u-box"/>
        <text x="380" y="277" class="u-lbl" text-anchor="middle">post { always | success | failure | changed }</text>
        <text x="380" y="322" class="u-lbl" text-anchor="middle">Urutan eksekusi: dari pipeline ke stages, lalu ditutup oleh post</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 6.1</b> — Anatomi Jenkinsfile Declarative: kerangka pipeline, direktif konfigurasi, stages berisi stage, dan penutup post</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Jenkinsfile Minimal: Hello, Declarative',
      lang: 'groovy',
      output: false,
      code: `pipeline {
    agent any

    stages {
        stage('Sapa') {
            steps {
                echo 'Halo dari Declarative Pipeline!'
            }
        }
    }

    post {
        always {
            echo 'Selesai, entah berhasil atau gagal.'
        }
    }
}`,
      explain: [
        '<code>agent any</code> berarti "jalankan di mana saja": Jenkins menugaskan pekerjaan ini ke executor mana pun yang tersedia.',
        'Blok <code>stages</code> wajib berisi minimal satu <code>stage</code>, dan tiap <code>stage</code> wajib berisi blok <code>steps</code>.',
        '<code>echo</code> adalah langkah paling sederhana; langkah nyata memakai <code>sh</code> (Linux) atau <code>bat</code> (Windows).',
        'Blok <code>post</code> di sini memakai kondisi <code>always</code>: selalu dijalankan apa pun hasil akhirnya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Menentukan Tempat Kerja: <code>agent</code></h3><p>Direktif <code>agent</code> menjawab pertanyaan "di mesin mana pekerjaan ini berjalan". Tiga bentuk yang paling sering dipakai:</p><ul><li><code>agent any</code> — jalankan di agent mana pun yang punya <i>executor</i> kosong. Paling sederhana untuk pemula.</li><li><code>agent none</code> — jangan tugaskan apa pun di level pipeline; tiap stage harus menentukan agentnya sendiri. Pola ini dipakai saat tahap berbeda membutuhkan mesin berbeda.</li><li><code>agent { label \'linux-builder\' }</code> — hanya jalankan pada agent yang memiliki <i>label</i> tersebut. Label memungkinkan kamu mengarahkan pekerjaan ke mesin tertentu, misalnya yang sudah terpasang Podman atau JDK 17.</li></ul><p>Variabel lingkungan diakses lewat <code>env.NAMA</code>. Beberapa variabel sudah disediakan Jenkins: <code>env.JOB_NAME</code>, <code>env.BUILD_NUMBER</code>, dan <code>env.BUILD_URL</code>. Untuk nilai rahasia (token, kata sandi), jangan pernah menulisnya langsung di Jenkinsfile — gunakan <code>credentials(\'id-credentials\')</code> yang nilai aslinya tersimpan aman di <i>Manage Jenkins → Credentials</i>.</p>'
    },
    {
      type: 'text',
      html: '<h3>Parameter, Opsi, dan Penjadwalan</h3><p>Blok <code>parameters</code> membuat tombol job berubah menjadi <b>Build with Parameters</b>. Tersedia beberapa tipe:</p><ul><li><code>string(name: \'TARGET_ENV\', defaultValue: \'staging\')</code> — isian teks bebas.</li><li><code>booleanParam(name: \'RUN_MIGRATION\', defaultValue: false)</code> — kotak centang; nilainya <code>true</code> bila dicentang.</li><li><code>choice(name: \'LOG_LEVEL\', choices: [\'info\', \'debug\'])</code> — daftar pilihan; nilai pertama menjadi bawaan.</li></ul><p>Nilai parameter diakses lewat <code>params.NAMA</code> (atau <code>env.NAMA</code>). Perubahan parameter baru aktif setelah job disimpan ulang — bila kamu baru menambahkannya, kembali ke <i>Configure</i> lalu <i>Save</i> sebelum mencoba.</p><p>Blok <code>options</code> mengatur perilaku build: <code>timeout(time: 15, unit: \'MINUTES\')</code> membatalkan build yang menggantung, <code>timestamps()</code> mencantumkan waktu pada setiap baris log, <code>buildDiscarder(logRotator(numToKeepStr: \'10\'))</code> membuang build lama agar hemat disk, dan <code>disableConcurrentBuilds()</code> mencegah dua build job yang sama berjalan bersamaan. Untuk penjadwalan mandiri, gunakan <code>triggers { cron(\'H 2 * * *\') }</code> — karakter <code>H</code> adalah hash nama job sehingga beban tersebar, seperti yang sudah dibahas pada bab Freestyle.</p>'
    },
    {
      type: 'example',
      title: 'Jenkinsfile Lengkap: Aplikasi Node.js dengan Parameters &amp; Post',
      lang: 'groovy',
      output: false,
      code: `pipeline {
    agent any

    options {
        timeout(time: 15, unit: 'MINUTES')
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }

    triggers {
        cron('H 2 * * *')
    }

    parameters {
        string(name: 'TARGET_ENV', defaultValue: 'staging', description: 'Lingkungan tujuan: staging atau production')
        booleanParam(name: 'RUN_MIGRATION', defaultValue: false, description: 'Jalankan migrasi database?')
        choice(name: 'LOG_LEVEL', choices: ['info', 'debug'], description: 'Tingkat log aplikasi')
    }

    environment {
        APP_NAME = 'web-katalog'
        NPM_CONFIG_LOGLEVEL = 'error'
        NPM_TOKEN = credentials('npm-token-tim')
    }

    tools {
        nodejs 'node-20'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Install Dependensi') {
            steps {
                sh 'npm ci'
            }
        }
        stage('Lint & Test') {
            steps {
                sh 'npm run lint'
                sh 'npm test -- --reporter=junit'
            }
        }
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
        stage('Migrasi Database') {
            when {
                expression { return params.RUN_MIGRATION == true }
            }
            steps {
                sh 'node scripts/migrate.js'
            }
        }
    }

    post {
        always {
            junit testResults: 'test-results/*.xml', allowEmptyResults: true
            archiveArtifacts artifacts: 'dist/**', fingerprint: true
        }
        success {
            echo '\${env.APP_NAME} nomor \${env.BUILD_NUMBER} sukses'
        }
        failure {
            emailext subject: 'Build GAGAL: \${env.JOB_NAME} #\${env.BUILD_NUMBER}',
                     body: 'Periksa log di \${env.BUILD_URL}',
                     to: 'tim-contoh@example.com'
        }
        changed {
            echo 'Status build berubah dibanding build sebelumnya'
        }
    }
}`,
      explain: [
        'Blok <code>environment</code> mendefinisikan variabel tetap; <code>NPM_TOKEN = credentials(\'npm-token-tim\')</code> mengisi <code>env.NPM_TOKEN</code> dengan rahasia yang tersimpan di Credentials Manager — nilai aslinya tidak pernah muncul di log.',
        'Direktif <code>when</code> pada stage <i>Migrasi Database</i> memungkinkan tahap dilewati: <code>expression</code> mengembalikan <code>true</code> atau <code>false</code> berdasarkan nilai parameter.',
        'Blok <code>post</code> menggabungkan arsip artefak (<code>dist/**</code>), laporan pengujian JUnit, dan notifikasi surel otomatis saat gagal — tiga hal yang tadinya menjadi Post-build Actions di Freestyle.',
        'Tanda <code>\${...}</code> pada string Groovy adalah interpolasi variabel; nilainya diambil dari <code>env</code> saat build berjalan.'
      ]
    },
    {
      type: 'example',
      title: 'Tampilan Build with Parameters',
      lang: 'text',
      output: false,
      code: `web-katalog » #42 [Build with Parameters]

  TARGET_ENV       [ staging         ]   <- string
  RUN_MIGRATION    [ ]                  <- booleanParam (centang = true)
  LOG_LEVEL        [ info          v ]   <- choice

  [ Build ]    [ Git Polling Log ]    [ Build with Parameters ]`,
      explain: [
        'Formulir ini muncul otomatis setelah blok <code>parameters</code> didefinisikan dan job disimpan ulang.',
        'Nilai yang dipilih akan tersedia sebagai <code>params.TARGET_ENV</code>, <code>params.RUN_MIGRATION</code>, dan <code>params.LOG_LEVEL</code> di dalam Jenkinsfile.',
        'Bila parameter tidak diubah, nilai bawaan (<i>default</i>) yang dipakai — memudahkan pemakaian sehari-hari.',
        'Pada halaman riwayat build, setiap build mencantumkan parameter yang dipakai sehingga reproduksi masalah menjadi mudah.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Memasang Jenkinsfile ke Job</h3><p>Setelah <code>Jenkinsfile</code> tersimpan di repository, buat job barunya: <b>New Item → Pipeline</b>. Pada bagian <b>Pipeline</b> di bagian bawah formulir, pilih <b>Pipeline script from SCM</b> (bukan <i>Pipeline script</i> yang menyimpan kode langsung di Jenkins — gaya itu justru mengulang masalah Freestyle).</p><p>Isian yang perlu diisi: <b>SCM → Git</b>, <b>Repository URL</b>, <b>Credentials</b> (untuk repository privat; cukup token dari GitHub atau GitLab free tier), <b>Branches to build</b> (misalnya <code>*/main</code>), dan <b>Script Path</b> yang menunjuk lokasi berkas, umumnya <code>Jenkinsfile</code>. Setiap kali job dijalankan, Jenkins mengambil versi terbaru berkas itu dari Git — inilah inti Pipeline as Code.</p>'
    },
    {
      type: 'example',
      title: 'Ringkasan Konfigurasi Job Pipeline',
      lang: 'text',
      output: false,
      code: `New Item → nama: web-katalog → pilih Pipeline → OK

Pipeline
  Definition : Pipeline script from SCM
  SCM        : Git
     Repository URL : https://github.com/tim-contoh/web-katalog.git
     Credentials    : github-token-tim (opsional, untuk repo privat)
     Branches       : */main
  Script Path: Jenkinsfile

  -> Save -> Build Now -> buka Console Output`,
      explain: [
        'Pilihan <i>Pipeline script from SCM</i> memastikan alur build hidup bersama kode dan mengikuti siklus version control.',
        '<i>Script Path</i> bersifat bebas: boleh <code>Jenkinsfile</code>, boleh <code>ci/Jenkinsfile</code> bila tim memisahkan berkas CI di subfolder.',
        'Kamu bisa mencoba seluruh alur ini secara gratis: Jenkins open source dijalankan dengan Podman, source code di-hosting di GitHub atau GitLab free tier.',
        'Bila job gagal membaca Jenkinsfile, periksa kembali ejaan <i>Script Path</i> dan nama cabang pada isian <i>Branches to build</i>.'
      ]
    },
    {
      type: 'tip',
      title: 'Mulai dari Contoh, Lalu Kembangkan',
      text: 'Cara tercepat belajar: salin Jenkinsfile minimal di atas ke repository coba-mu (satu folder kosong pun cukup), pasang job Pipeline, lalu tambahkan blok demi blok sambil melihat hasilnya di Console Output. Berlatih dengan Podman + Jenkins open source + GitHub/GitLab free tier sudah lebih dari cukup untuk memahami seluruh mekanisme bab ini.'
    },
    {
      type: 'warn',
      title: 'Rahasia Tidak Boleh di Jenkinsfile',
      text: 'Jangan pernah menulis token, kata sandi, atau kunci privat langsung di Jenkinsfile — berkas ini terlihat publik oleh siapa pun yang bisa mengakses repository. Selalu simpan rahasia di <i>Manage Jenkins → Credentials</i>, lalu ambil nilainya lewat <code>credentials(\'id\')</code> atau blok <code>withCredentials</code>. Jenkins juga otomatis menyensor nilai yang terdaftar sebagai kredensial agar tidak bocor ke log.'
    },
    {
      type: 'vocab',
      items: [
        ['Jenkinsfile', 'Berkas Groovy berisi definisi alur CI/CD, disimpan bersama source code di repository Git.'],
        ['Declarative Pipeline', 'Gaya penulisan pipeline dengan struktur baku (pipeline, stages, post) yang tegas dan mudah distandarkan.'],
        ['Pipeline as Code', 'Prinsip menyimpan konfigurasi proses build sebagai kode, bukan konfigurasi antarmuka.'],
        ['Agent', 'Mesin (controller atau agent) tempat pekerjaan dijalankan; ditentukan lewat direktif <code>agent</code>.'],
        ['Stage', 'Satu tahap dalam <code>stages</code>, misalnya Checkout, Test, Build, atau Deploy.'],
        ['Steps', 'Langkah konkret di dalam sebuah stage, misalnya <code>sh</code>, <code>echo</code>, atau <code>checkout scm</code>.'],
        ['Post', 'Blok penutup pipeline yang menjalankan tindakan berdasarkan hasil build: <code>always</code>, <code>success</code>, <code>failure</code>, <code>changed</code>.'],
        ['Parameters', 'Nilai yang dipilih pemicu build lewat tombol <i>Build with Parameters</i>; diakses lewat <code>params.NAMA</code>.'],
        ['Script Path', 'Isian pada job Pipeline yang menunjuk lokasi Jenkinsfile di dalam repository, umumnya <code>Jenkinsfile</code>.']
      ]
    }
  ],
  recap: [
    'Declarative Pipeline menulis alur CI/CD dalam <code>Jenkinsfile</code> di Git: direview, diubah, dan dijalankan ulang bersama kode.',
    'Strukturnya berjenjang: <code>pipeline</code> → (<code>agent</code>, <code>options</code>, <code>environment</code>, <code>parameters</code>, <code>triggers</code>, <code>tools</code>) → <code>stages</code> → <code>stage</code> → <code>steps</code>, ditutup <code>post</code>.',
    'Rahasia diambil lewat <code>credentials(\'id\')</code>, bukan ditulis langsung di Jenkinsfile.',
    'Pasang Jenkinsfile lewat job Pipeline dengan pilihan <i>Pipeline script from SCM</i> dan <i>Script Path</i> <code>Jenkinsfile</code>.'
  ]
});
