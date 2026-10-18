/* ============================================================
   Pelajaran Jenkins — Bab 8: Pipeline Lanjutan — Parallel, When & Input (L8)
   ============================================================ */
'use strict';

window.JENKINS_LESSONS = window.JENKINS_LESSONS || [];

window.JENKINS_LESSONS.push({
  id: 'pipeline-lanjutan',
  title: 'Pipeline Lanjutan: Parallel, When & Input',
  chapter: 'Pipeline as Code',
  duration: '8–10 menit',
  intro: [
    'Pipeline yang berjalan berurutan dari awal sampai akhir sederhana dipahami, tetapi boros waktu: pengujian unit, pengujian integrasi, dan pembuatan image kontainer sebenarnya saling lepas dan tidak harus menunggu satu sama lain.',
    'Declarative Pipeline menyediakan tiga alat untuk situasi semacam ini: blok <b><code>parallel</code></b> untuk mengeksekusi beberapa tahap bersamaan, direktif <b><code>when</code></b> untuk menjalankan tahap hanya pada kondisi tertentu, dan step <b><code>input</code></b> untuk meminta persetujuan manusia — misalnya sebelum penyebaran ke produksi.',
    'Bab ini melengkapi toolbox pipeline-mu dengan <code>matrix</code> (ringkas), <code>timeout</code>, <code>retry</code>, serta <code>stash</code>/<code>unstash</code> untuk berbagi file antar tahap dan antar agent, semuanya diilustrasikan dengan contoh Jenkinsfile yang siap dipakai.'
  ],
  objectives: [
    'Menjalankan beberapa tahap bersamaan dengan blok <code>parallel</code> dan mengendalikannya lewat <code>failFast</code>',
    'Menyaring eksekusi tahap memakai direktif <code>when</code> beserta kondisi <code>branch</code>, <code>environment</code>, dan <code>expression</code>',
    'Membangun gerbang persetujuan manual dengan step <code>input</code>, <code>timeout</code>, dan <code>retry</code>',
    'Berbagi file antar workspace/agent menggunakan <code>stash</code> dan <code>unstash</code>'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Kenapa Tahap Perlu Berjalan Paralel?</h3><p>Sebuah pipeline integrasi kontinu modern umumnya memuat beberapa pekerjaan yang tidak saling bergantung: pengujian unit yang cepat, pengujian integrasi yang lambat, dan pembuatan image kontainer dengan Podman. Bila ketiganya berjalan berurutan dan masing-masing memakan waktu 3 menit, totalnya 9 menit. Dijalankan bersamaan, seluruhnya selesai dalam sekitar 3 menit — waktu umpan balik ke pengembang berkurang drastis.</p><p>Declarative Pipeline mendukung hal ini lewat blok <code>parallel</code> di dalam sebuah <code>stage</code>. Setiap cabang paralel adalah <code>stage</code> penuh dengan <code>steps</code>-nya sendiri. Perhatikan satu aturan penting: ketika sebuah cabang gagal, cabang lain yang masih berjalan bisa ditarik dengan menambahkan <code>failFast true</code> — berguna bila kegagalan satu cabang membuat cabang lainnya tidak lagi bermakna (misalnya unit test gagal tetapi image tetap dibangun).</p>'
    },
    {
      type: 'example',
      title: 'Jenkinsfile: Tiga Tahap Paralel dengan failFast',
      lang: 'groovy',
      output: false,
      code: `pipeline {
    agent any

    options {
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
    }

    stages {
        stage('Checkout & Siapkan') {
            steps {
                checkout scm
                sh 'npm ci'
            }
        }

        stage('Pengujian & Build Paralel') {
            failFast true
            parallel {
                stage('Unit Test') {
                    steps {
                        sh 'npm run test:unit'
                    }
                }
                stage('Integration Test') {
                    steps {
                        sh 'npm run test:integration'
                    }
                }
                stage('Build Image') {
                    steps {
                        sh 'podman build -t web-katalog:1.0 .'
                    }
                }
            }
        }
    }

    post {
        always {
            junit testResults: 'test-results/*.xml', allowEmptyResults: true
        }
    }
}`,
      explain: [
        'Blok <code>parallel</code> berada di dalam satu <code>stage</code> dan memuat tiga <code>stage</code> cabang; Jenkins mengeksekusinya bersamaan pada executor yang tersedia.',
        '<code>failFast true</code> menarik cabang yang masih berjalan begitu ada satu cabang gagal, sehingga waktu dan sumber daya tidak terbuang untuk hasil yang sudah pasti tidak akan dipakai.',
        'Instalasi dependensi (<code>npm ci</code>) dilakukan sekali sebelum percabangan agar ketiga cabang memakai dependensi yang sama dan hemat waktu.',
        'Pastikan ketiga cabang menulis laporan ke pola file yang berbeda atau pola yang sama tanpa konflik, agar blok <code>post</code> tetap bisa membaca seluruh hasil pengujian.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Menyaring Eksekusi dengan <code>when</code></h3><p>Direktif <code>when</code> membuat sebuah stage dijalankan hanya bila kondisinya terpenuhi; selain itu stage ditandai <i>skipped</i> dan tampil abu-abu di antarmuka. Kondisi yang paling sering dipakai:</p><ul><li><code>branch \'main\'</code> — jalankan hanya pada cabang bernama <code>main</code> (bersama <code>changeRequest()</code>, kondisi ini membutuhkan job bertipe <b>Multibranch Pipeline</b> yang menemukan cabang secara otomatis).</li><li><code>environment name: \'ENV\', value: \'production\'</code> — cocokkan nilai variabel lingkungan.</li><li><code>expression { return params.DEPLOY == true }</code> — kondisi buatan sendiri dengan Groovy; kembalikan <code>true</code> untuk menjalankan stage.</li><li><code>changeRequest()</code> — jalankan hanya untuk Pull Request / Merge Request.</li></ul><p>Kondisi dapat digabung dengan <code>allOf { }</code> (semua harus benar), <code>anyOf { }</code> (cukup satu benar), dan <code>not { }</code>. Tambahkan <code>beforeAgent true</code> agar pengecekan dilakukan <b>sebelum</b> executor dialokasikan — tanpanya, Jenkins menyewakan mesin lebih dulu bahkan untuk tahap yang akhirnya dilewati, membakar kuota executor tanpa guna.</p>'
    },
    {
      type: 'example',
      title: 'Jenkinsfile: Deploy Hanya di Cabang Utama',
      lang: 'groovy',
      output: false,
      code: `pipeline {
    agent any

    parameters {
        booleanParam(name: 'DEPLOY', defaultValue: false, description: 'Lanjutkan ke deploy?')
    }

    environment {
        DEPLOY_ENV = 'production'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Build') {
            when {
                beforeAgent true
                anyOf {
                    branch 'main'
                    branch 'release/*'
                }
            }
            steps {
                sh 'npm ci && npm run build'
            }
        }
        stage('Analisis Pull Request') {
            when {
                changeRequest()
            }
            steps {
                echo 'Ini Pull Request — jalankan pengujian saja, jangan deploy.'
            }
        }
        stage('Deploy') {
            when {
                allOf {
                    branch 'main'
                    environment name: 'DEPLOY_ENV', value: 'production'
                    expression { return params.DEPLOY == true }
                }
            }
            steps {
                sh './deploy.sh production'
            }
        }
    }
}`,
      explain: [
        '<code>beforeAgent true</code> mengecek syarat lebih dahulu; bila tidak terpenuhi, stage dilewati tanpa menyedot satu pun executor.',
        'Stage <i>Build</i> memakai <code>anyOf</code>: cukup salah satu cabang terpenuhi (baik <code>main</code> maupun <code>release/*</code>) agar dijalankan.',
        'Stage <i>Deploy</i> memakai <code>allOf</code>: semua syarat wajib benar sekaligus — cabang utama, lingkungan produksi, dan parameter <code>DEPLOY</code> dicentang pemicu build.',
        'Pola ini memisahkan kepentingan: cabang fitur diverifikasi otomatis, tetapi penyebaran ke produksi tetap membutuhkan keputusan sadar dari pemanggil build.'
      ]
    },
    {
      type: 'text',
      html: `<h3>Gerbang Manusia: <code>input</code>, <code>timeout</code>, dan <code>retry</code></h3><p>Beberapa keputusan tidak boleh diambil otomatis. Step <code>input</code> menghentikan pipeline dan menunggu seseorang menekan tombol persetujuan di antarmuka Jenkins — ideal untuk jembatan staging menuju produksi. Parameter pentingnya: <code>id</code> (penanda unik), <code>message</code> (pertanyaan yang ditampilkan), <code>ok</code> (teks tombol setuju) dan <code>cancel</code> (teks tombol tolak), <code>submitter</code> (daftar pengguna atau grup yang berhak menyetujui), <code>submitterParameter</code> (menyimpan nama penyetuju ke variabel), serta <code>timeout</code> dalam menit.</p><figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 350" width="760" role="img" aria-label="Alur pipeline: checkout bercabang menjadi tiga tahap paralel lalu bertemu kembali di gerbang input sebelum deploy">
        <rect x="290" y="16" width="180" height="32" rx="6" class="u-hd"/>
        <text x="380" y="37" class="u-lbl" text-anchor="middle">Checkout &amp; npm ci</text>
        <rect x="40" y="64" width="680" height="104" rx="8" class="u-dash"/>
        <text x="56" y="84" class="u-lbl">parallel { failFast true }</text>
        <rect x="60" y="96" width="190" height="32" rx="6" class="u-box"/>
        <text x="155" y="116" class="u-lbl" text-anchor="middle">Unit Test</text>
        <rect x="285" y="96" width="190" height="32" rx="6" class="u-box"/>
        <text x="380" y="116" class="u-lbl" text-anchor="middle">Integration Test</text>
        <rect x="510" y="96" width="190" height="32" rx="6" class="u-box"/>
        <text x="605" y="116" class="u-lbl" text-anchor="middle">Build Image (podman)</text>
        <line x1="380" y1="48" x2="155" y2="94" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="380" y1="48" x2="380" y2="94" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="380" y1="48" x2="605" y2="94" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="155" y1="128" x2="335" y2="186" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="380" y1="128" x2="380" y2="186" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="605" y1="128" x2="425" y2="186" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="265" y="188" width="230" height="46" rx="6" class="u-hd"/>
        <text x="380" y="208" class="u-lbl" text-anchor="middle">input: persetujuan manual</text>
        <text x="380" y="224" class="u-lbl" text-anchor="middle">submitter: admin · timeout 60 mnt</text>
        <line x1="380" y1="234" x2="380" y2="260" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="280" y="262" width="200" height="34" rx="6" class="u-box"/>
        <text x="380" y="284" class="u-lbl" text-anchor="middle">Deploy Produksi</text>
        <text x="380" y="326" class="u-lbl" text-anchor="middle">Cabang paralel bertemu kembali di gerbang persetujuan sebelum deploy</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 8.1</b> — Alur pipeline lanjutan: tiga cabang paralel, lalu gerbang <code>input</code> sebagai persetujuan manual sebelum deploy produksi</figcaption></figure><p><code>timeout</code> juga tersedia sebagai tahap stage (melalui blok <code>options</code>) untuk membatalkan tahap yang menggantung, dan <code>retry(n)</code> mengulang otomatis bila tahap gagal — pasangan yang tepat untuk penyebaran yang bisa gagal sementara karena jaringan.</p>`
    },
    {
      type: 'example',
      title: 'Jenkinsfile: Gate Persetujuan Sebelum Deploy Produksi',
      lang: 'groovy',
      output: false,
      code: `pipeline {
    agent any

    stages {
        stage('Build & Test') {
            steps {
                sh 'npm ci && npm test'
            }
        }
        stage('Deploy Staging') {
            steps {
                sh './deploy.sh staging'
            }
        }
        stage('Persetujuan Rilis') {
            steps {
                script {
                    def penyetuju = input(
                        id: 'rilis-produksi',
                        message: 'Boleh rilis ke produksi?',
                        ok: 'Ya, rilis',
                        cancel: 'Tidak, batalkan',
                        submitter: 'admin,tim-opsi',
                        submitterParameter: 'yang_menyetujui',
                        timeout: 60
                    )
                    echo 'Disetujui oleh: ' + penyetuju
                }
            }
        }
        stage('Deploy Produksi') {
            options {
                timeout(time: 10, unit: 'MINUTES')
                retry(2)
            }
            steps {
                sh './deploy.sh production'
            }
        }
    }

    post {
        success {
            echo 'Rilis selesai. Catatan: disetujui oleh ' + env.yang_menyetujui
        }
    }
}`,
      explain: [
        'Karena <code>input</code> mengembalikan sebuah nilai, pemanggilannya dibungkus blok <code>script</code> agar hasilnya bisa disimpan ke variabel <code>penyetuju</code>.',
        '<code>submitter: \'admin,tim-opsi\'</code> membatasi siapa yang boleh menekan tombol; pengguna lain hanya melihat tombol tanpa bisa menekannya.',
        '<code>timeout: 60</code> membuat build dibatalkan otomatis (status <code>ABORTED</code>) bila tidak ada yang merespons dalam 60 menit — tanpa ini, build bisa tertahan selamanya.',
        'Stage <i>Deploy Produksi</i> memakai <code>retry(2)</code> bersama <code>timeout</code>, sehingga kegagalan penyebaran karena gangguan sementara dicoba ulang tanpa campur tangan manual.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Matrix, dan Berbagi File Antar Agent</h3><p>Untuk pengujian kombinasi (misalnya beberapa versi Node.js pada beberapa sistem operasi), Declarative menyediakan <code>matrix</code> — deklarasi ringkas yang otomatis memperluas kombinasi sumbu menjadi stage paralel:</p><pre><code>matrix {\n    axes {\n        axis { name \'NODE_VERSION\'; values \'18\', \'20\' }\n        axis { name \'OS\'; values \'linux\', \'windows\' }\n    }\n    stages { stage(\'Build\') { steps { sh \'npm ci && npm run build\' } } }\n}</code></pre><p>Sementara itu, ketika sebuah pipeline memakai lebih dari satu agent (misalnya build pada <code>linux-builder</code> dan verifikasi pada <code>qa-runner</code>), file hasil build tidak otomatis tersedia di mesin lain — workspace tiap agent terpisah. Solusinya adalah pasangan langkah <code>stash</code> dan <code>unstash</code>: <code>stash</code> membungkus file terpilih ke dalam arsip sementara milik build, lalu <code>unstash</code> membukanya di workspace agent lain. Bila yang dibungkus ternyata besar (ratusan MB), pertimbangkan memindahkannya ke registry artefak (Nexus/Artifactory) sebagai gantinya.</p>'
    },
    {
      type: 'example',
      title: 'stash/unstash: Membawa Artefak dari Build ke Verifikasi',
      lang: 'groovy',
      output: false,
      code: `pipeline {
    agent none

    stages {
        stage('Build') {
            agent { label 'linux-builder' }
            steps {
                checkout scm
                sh 'npm ci && npm run build'
                stash name: 'artefak', includes: 'dist/**,package.json'
            }
        }
        stage('Smoke Test') {
            agent { label 'qa-runner' }
            steps {
                unstash 'artefak'
                sh './scripts/smoke-test.sh dist/'
            }
        }
    }
}`,
      explain: [
        '<code>agent none</code> di level pipeline menandakan tiap stage memilih agentnya sendiri — pola standar untuk pipeline multi-mesin.',
        '<code>stash name: \'artefak\'</code> mengemas file sesuai pola <code>includes</code>; nama itulah yang dipakai saat membukanya kembali.',
        '<code>unstash \'artefak\'</code> mendistribusikan isi arsip ke workspace stage <i>Smoke Test</i> di mesin yang berbeda, tanpa perlu Git atau artefak server tambahan.',
        'Urutannya selalu sama: yang membangun melakukan <code>stash</code>, yang mengonsumsi melakukan <code>unstash</code>; nama arsip harus cocok persis.'
      ]
    },
    {
      type: 'tip',
      title: 'Latihan dengan Sumber Daya Gratis',
      text: 'Seluruh contoh di bab ini dapat dipraktikkan tanpa biaya: Jenkins open source dijalankan lewat Podman (<code>podman run -d --name jenkins -p 8080:8080 -p 50000:50000 -v jenkins_home:/var/jenkins_home jenkins/jenkins:lts-jdk17</code>), source code berisi <code>Jenkinsfile</code> disimpan di GitHub atau GitLab free tier, dan webhook gratis menghubungkan <code>git push</code> dengan trigger build. Untuk mencoba <code>when { branch }</code>, buat job Multibranch Pipeline agar seluruh cabangmu ditemukan otomatis.'
    },
    {
      type: 'warn',
      title: 'Dua Jebakan yang Sering Terjadi',
      text: 'Pertama, kondisi <code>branch</code> dan <code>changeRequest()</code> hanya bekerja pada job <b>Multibranch Pipeline</b>; pada job Pipeline biasa, <code>env.BRANCH_NAME</code> kosong sehingga stage <code>when { branch \'main\' }</code> tidak akan pernah berjalan. Kedua, stage dengan <code>input</code> tanpa <code>timeout</code> dapat menahan build selamanya bila tidak ada yang menyetujui — selalu pasang batas waktu agar antarmuka build tetap bersih.'
    },
    {
      type: 'vocab',
      items: [
        ['parallel', 'Blok di dalam stage yang mengeksekusi beberapa stage cabang secara bersamaan.'],
        ['failFast', 'Opsi yang menarik seluruh cabang paralel begitu ada satu cabang gagal.'],
        ['when', 'Direktif yang menjalankan stage hanya bila kondisinya terpenuhi; jika tidak, stage dilewati.'],
        ['beforeAgent', 'Opsi <code>when</code> yang mengecek kondisi sebelum executor dialokasikan, menghemat sumber daya.'],
        ['changeRequest', 'Kondisi <code>when</code> yang aktif hanya untuk Pull Request / Merge Request (Multibranch Pipeline).'],
        ['input', 'Step yang menghentikan pipeline dan menunggu persetujuan manual dari pengguna yang berwenang.'],
        ['submitter', 'Daftar pengguna atau grup yang diizinkan menekan tombol persetujuan pada step <code>input</code>.'],
        ['matrix', 'Cara ringkas menyatakan kombinasi beberapa sumbu (misalnya versi Node.js × sistem operasi) sebagai stage paralel.'],
        ['stash / unstash', 'Pasangan langkah untuk membungkus file dari satu workspace lalu membukanya di workspace atau agent lain.']
      ]
    }
  ],
  recap: [
    'Blok <code>parallel</code> mengeksekusi tahap bersamaan; <code>failFast true</code> menarik cabang lain saat ada cabang gagal.',
    'Direktif <code>when</code> menyaring eksekusi tahap lewat <code>branch</code>, <code>environment</code>, <code>expression</code>, dan <code>changeRequest</code>; tambahkan <code>beforeAgent true</code> agar pengecekan mendahului alokasi executor.',
    'Step <code>input</code> membangun gerbang persetujuan manual; pasang <code>timeout</code> agar build tidak tertahan selamanya, dan gunakan <code>retry</code> pada tahap berisiko gangguan sementara.',
    '<code>stash</code>/<code>unstash</code> memindahkan hasil build antar workspace dan antar agent tanpa layanan tambahan; <code>matrix</code> mempersingkat pengujian kombinasi.'
  ]
});
