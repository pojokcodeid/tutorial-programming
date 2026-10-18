/* ============================================================
   Pelajaran Jenkins — Bab 13: Shared Library untuk Pipeline yang Bisa Dipakai Ulang
   ============================================================ */
'use strict';

window.JENKINS_LESSONS = window.JENKINS_LESSONS || [];

window.JENKINS_LESSONS.push({
  id: 'shared-library',
  title: 'Shared Library untuk Pipeline yang Bisa Dipakai Ulang',
  chapter: 'Enterprise',
  duration: '8–10 menit',
  intro: [
    'Bayangkan lima tim di perusahaan yang sama, masing-masing memiliki belasan repository, dan setiap repository menyimpan Jenkinsfile hasil salin-tempel dari template yang sama. Ketika aturan keamanan berubah, perubahan itu harus diulang di puluhan berkas dan beberapa pasti terlewat — inilah penyakit duplikasi pipeline.',
    '<b>Shared Library</b> (pustaka bersama) adalah solusinya: logika pipeline yang dipakai bersama disimpan dalam satu repository Git terpisah, lalu dipanggil dari Jenkinsfile mana pun lewat deklarasi <code>@Library</code>. Isinya terbagi atas <code>vars/</code> (langkah global), <code>src/</code> (pustaka kelas Groovy), dan <code>resources/</code> (berkas statis).',
    'Bab ini membahas struktur repository Shared Library, cara mendaftarkannya di Manage Jenkins, teknik versioning memakai tag Git, contoh nyata <code>vars/buildApp.groovy</code> yang memanggil kelas dari <code>src/</code>, serta aturan keamanan yang wajib dipegang karena library tepercaya menjalankan kode tanpa sandbox.'
  ],
  objectives: [
    'Memahami masalah duplikasi Jenkinsfile dan manfaat Shared Library',
    'Mengenali peran folder vars/, src/, resources/, dan test/ dalam satu repository library',
    'Mendaftarkan library di Global Trusted Pipeline Libraries dan memakainya di Jenkinsfile',
    'Menerapkan versioning memakai tag Git serta memahami risiko library tepercaya'
  ],
  sections: [
    {
      type: 'text',
      html: "<h3>Masalah Duplikasi Jenkinsfile</h3><p>Pada materi Pipeline as Code, kamu menyimpan <code>Jenkinsfile</code> di dalam repository aplikasi agar konfigurasi build ikut terkontrol versi. Namun begitu jumlah repository puluhan, muncul masalah baru: template pipeline yang sama disalin berulang kali dan perlahan berubah bentuk di tiap tim.</p><ul><li><b>Perubahan lambat</b> — satu kebijakan baru (misalnya setiap build wajib memindai dependensi) harus diedit di banyak tempat.</li><li><b>Hasil build tidak konsisten</b> — tim A memakai Node 18, tim B memakai Node 20, padahal pipeline-nya dianggap sama.</li><li><b>Sulit diaudit</b> — tidak ada satu titik untuk memastikan seluruh tim memakai langkah keamanan dan versi tools terbaru.</li><li><b>Kearifan terkunci</b> — cara build yang benar hanya diketahui tim pemilik berkas, bukan organisasi.</li></ul><p><b>Shared Library</b> mengubah keadaan itu: logika build dipusatkan pada satu repository, dan setiap Jenkinsfile cukup memanggilnya. Sekali perbaiki di library, langsung berlaku untuk semua pemakai.</p>"
    },
    {
      type: 'text',
      html: "<h3>Anatomi Repository Shared Library</h3><p>Repository Shared Library hanyalah proyek Git biasa dengan struktur folder yang sudah ditentukan Jenkins. Tiga folder utamanya adalah <code>vars/</code>, <code>src/</code>, dan <code>resources/</code>, ditambah <code>test/</code> untuk pengujian:</p><table><thead><tr><th>Folder</th><th>Peran</th><th>Cara dipakai di pipeline</th></tr></thead><tbody><tr><td><code>vars/</code></td><td>Global variable / custom step. Tiap berkas <code>xxx.groovy</code> berisi metode <code>call(...)</code> dan otomatis tersedia sebagai langkah bernama <code>xxx</code>.</td><td><code>buildApp appName: 'web'</code></td></tr><tr><td><code>src/</code></td><td>Pustaka Groovy berbasis paket, disusun seperti kelas biasa, misalnya <code>src/com/company/Version.groovy</code>.</td><td><code>import com.company.Version</code> lalu <code>Version.next(...)</code></td></tr><tr><td><code>resources/</code></td><td>Berkas statis: template konfigurasi, berkas env, skrip pendukung.</td><td><code>libraryResource 'defaults/app.env'</code></td></tr><tr><td><code>test/</code></td><td>Unit test untuk isi library, umumnya memakai JenkinsPipelineUnit.</td><td>Dijalankan terpisah sebelum library dirilis</td></tr></tbody></table><p>Aturan penting: nama berkas di <code>vars/</code> menjadi nama langkah — <code>vars/buildApp.groovy</code> dipanggil sebagai <code>buildApp()</code>. Sediakan pula berkas <code>vars/buildApp.html</code> berisi deskripsi singkat; isinya muncul sebagai tooltip di halaman pemilihan langkah dan sangat membantu tim pemakai.</p>"
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 350" width="760" role="img" aria-label="Struktur repository Shared Library dengan folder vars src resources test dan alur pemanggilan dari Jenkinsfile menuju vars lalu langkah Jenkins">
        <rect x="60" y="10" width="640" height="130" rx="10" class="u-box"/>
        <text x="380" y="34" class="u-title" text-anchor="middle">Repository Shared Library (Git)</text>
        <rect x="80" y="48" width="140" height="72" rx="6" class="u-hd"/>
        <text x="150" y="76" class="u-lbl" text-anchor="middle">vars/</text>
        <text x="150" y="98" class="u-lbl" text-anchor="middle">call() menjadi step</text>
        <rect x="234" y="48" width="140" height="72" rx="6" class="u-box"/>
        <text x="304" y="76" class="u-lbl" text-anchor="middle">src/</text>
        <text x="304" y="98" class="u-lbl" text-anchor="middle">kelas Groovy</text>
        <rect x="388" y="48" width="140" height="72" rx="6" class="u-box"/>
        <text x="458" y="76" class="u-lbl" text-anchor="middle">resources/</text>
        <text x="458" y="98" class="u-lbl" text-anchor="middle">berkas statis</text>
        <rect x="542" y="48" width="140" height="72" rx="6" class="u-box"/>
        <text x="612" y="76" class="u-lbl" text-anchor="middle">test/</text>
        <text x="612" y="98" class="u-lbl" text-anchor="middle">uji library</text>
        <line x1="349" y1="142" x2="349" y2="204" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="358" y="176" class="u-lbl">dimuat dari Git</text>
        <rect x="40" y="210" width="170" height="80" rx="10" class="u-hd"/>
        <text x="125" y="234" class="u-title" text-anchor="middle">Jenkinsfile</text>
        <text x="125" y="256" class="u-lbl" text-anchor="middle">@Library('lib@1.2.0')</text>
        <text x="125" y="276" class="u-lbl" text-anchor="middle">buildApp(appName: 'web')</text>
        <line x1="212" y1="250" x2="253" y2="250" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="232" y="240" class="u-lbl" text-anchor="middle">panggil</text>
        <rect x="257" y="210" width="184" height="80" rx="10" class="u-box"/>
        <text x="349" y="234" class="u-title" text-anchor="middle">vars/buildApp.groovy</text>
        <text x="349" y="256" class="u-lbl" text-anchor="middle">def call(Map cfg)</text>
        <text x="349" y="276" class="u-lbl" text-anchor="middle">checkout build test</text>
        <line x1="443" y1="250" x2="484" y2="250" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="463" y="240" class="u-lbl" text-anchor="middle">jalankan</text>
        <rect x="488" y="200" width="232" height="100" rx="10" class="u-box"/>
        <text x="604" y="224" class="u-title" text-anchor="middle">Langkah Jenkins</text>
        <rect x="502" y="238" width="104" height="28" rx="6" class="u-hd"/>
        <text x="554" y="257" class="u-lbl" text-anchor="middle">checkout</text>
        <rect x="614" y="238" width="92" height="28" rx="6" class="u-hd"/>
        <text x="660" y="257" class="u-lbl" text-anchor="middle">build</text>
        <rect x="502" y="272" width="104" height="28" rx="6" class="u-hd"/>
        <text x="554" y="291" class="u-lbl" text-anchor="middle">test</text>
        <rect x="614" y="272" width="92" height="28" rx="6" class="u-hd"/>
        <text x="660" y="291" class="u-lbl" text-anchor="middle">arsip</text>
        <text x="380" y="340" class="u-lbl" text-anchor="middle">Perubahan di vars/buildApp.groovy langsung berlaku untuk semua pipeline pemakai</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 13.1</b> — Struktur repository Shared Library dan alur pemanggilan dari Jenkinsfile ke langkah Jenkins</figcaption></figure>`
    },
    {
      type: 'text',
      html: "<h3>Mendaftarkan dan Memakai Library</h3><p>Sebelum dipakai, library didaftarkan sekali oleh administrator melalui <b>Manage Jenkins → System</b>, lalu geser ke bagian <b>Global Trusted Pipeline Libraries</b>:</p><ul><li><b>Name</b> — nama pemanggilan library, misalnya <code>acme-pipeline</code>.</li><li><b>Default Version</b> — versi bawaan, misalnya <code>1.2.0</code> (tag Git) atau <code>main</code> bila ingin selalu memakai perkembangan terbaru.</li><li><b>Retrieval Method</b> — pilih <i>Modern SCM</i>, lalu tentukan URL repository Git dan kredensial aksesnya.</li><li><b>Library Path</b> — isi subdirektori bila library tidak berada di root repository, misalnya <code>pipeline-library</code>.</li></ul><p>Di Jenkinsfile, muat library dengan deklarasi berikut sebagai baris paling atas:</p><pre><code>@Library('acme-pipeline@1.2.0') _</code></pre><p>Karakter garis bawah di akhir diperlukan agar penulisan tetap valid ketika <code>@Library</code> ditempatkan sebelum blok <code>pipeline</code>. Kombinasi <code>nama@versi</code> membuat build deterministik: library yang sama persis akan dipakai lagi pada build berikutnya.</p><h3>Versioning Memakai Tag Git</h3><p>Library memakai sistem versi yang sama dengan software biasa: buat tag Git untuk setiap rilis stabil, misalnya <code>git tag -a v1.2.0 -m 'rilis buildApp'</code> lalu <code>git push origin v1.2.0</code>. Gunakan pola <i>semantic versioning</i> — angka tengah untuk penambahan fitur, angka kanan untuk perbaikan. Memakai <code>@Library('acme-pipeline@main') _</code> memang menggiurkan saat mengembangkan library karena selalu mendapat versi terbaru, tetapi hindari di produksi: hasil build dapat berubah tanpa ada perubahan apa pun pada aplikasi.</p>"
    },
    {
      type: 'example',
      title: 'Contoh 1: Isi vars/buildApp.groovy (Langkah Global)',
      lang: 'groovy',
      output: false,
      code: `// vars/buildApp.groovy — satu berkas = satu langkah global: buildApp(...)
import com.company.Version

def call(Map cfg = [:]) {
    def appName   = cfg.appName   ?: error('Parameter appName wajib diisi')
    def testCmd   = cfg.testCmd   ?: 'npm test'
    def engineCmd = cfg.engineCmd ?: 'podman'
    def tagRilis  = cfg.tagRilis ?: env.BUILD_NUMBER.toString()

    stage('Checkout') {
        checkout scm
    }
    stage('Build') {
        sh 'npm ci --omit=dev'
    }
    stage('Test') {
        sh testCmd
    }
    stage('Artifact & Image') {
        def versi = Version.next(appName, tagRilis)
        sh "\${engineCmd} build -t \${appName}:\${versi} ."
        archiveArtifacts artifacts: 'dist/**', fingerprint: true
        echo "Rilis \${appName}:\${versi} siap dipasang"
    }
}`,
      explain: [
        'Berkas di folder <code>vars/</code> wajib memiliki metode <code>call(...)</code>; di situ letak inti langkahnya.',
        'Pola <code>Map cfg = [:]</code> membuat parameter bersifat opsional dengan nilai bawaan, sehingga library tetap mudah dipakai pemula sekaligus fleksibel bagi tim lanjutan.',
        'Konfigurasi diterima sebagai peta (appName, testCmd, engineCmd, tagRilis) sehingga satu library melayani banyak proyek tanpa disalin.',
        'Pemanggilan <code>Version.next(...)</code> memakai kelas dari folder <code>src/</code> — perhatikan deklarasi import di bagian atas.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh 2: Isi src/com/company/Version.groovy (Pustaka Kelas)',
      lang: 'groovy',
      output: false,
      code: `// src/com/company/Version.groovy — kelas Groovy biasa dengan struktur paket
package com.company

class Version implements Serializable {

    // Menghasilkan string versi rilis, misalnya toko-online-v42
    static String next(String appName, String buildNumber) {
        return appName + '-v' + buildNumber
    }

    // Menentukan apakah cabang ini boleh menghasilkan rilis
    static boolean isRilis(String branch) {
        return branch in ['main', 'master']
    }

    // Menyusun nama image lengkap dengan lokasi registry
    static String imageName(String appName, String registry) {
        return registry + '/' + appName
    }
}`,
      explain: [
        'Isi folder <code>src/</code> disusun sebagai kelas Groovy biasa: deklarasikan <code>package</code> sesuai jalur berkas, misalnya <code>src/com/company/</code> menjadi <code>package com.company</code>.',
        'Pemakaian di pipeline memerlukan <code>import com.company.Version</code>, berbeda dengan <code>vars/</code> yang langsung menjadi langkah global.',
        'Kelas pipeline sebaiknya mengimplementasikan <code>Serializable</code> agar state-nya aman ketika Jenkins menghentikan dan melanjutkan kembali proses build.',
        'Tempatkan logika murni seperti perhitungan versi di <code>src/</code> agar mudah diuji terpisah; sisakan orkestrasi langkah Jenkins di <code>vars/</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh 3: Jenkinsfile Aplikasi yang Memakai Library',
      lang: 'groovy',
      output: false,
      code: `// Jenkinsfile di repository aplikasi — hanya memanggil library perusahaan
@Library('acme-pipeline@1.2.0') _

pipeline {
    agent any
    options { timestamps() }
    parameters {
        string(name: 'TEST_CMD', defaultValue: 'npm test', description: 'Perintah menjalankan unit test')
    }
    environment {
        REGISTRY = 'localhost:5000'
    }
    stages {
        stage('Build & Uji') {
            steps {
                buildApp(
                    appName:   'toko-online',
                    testCmd:   params.TEST_CMD,
                    engineCmd: 'podman',
                    tagRilis:  env.BUILD_NUMBER
                )
            }
        }
    }
    post {
        success { echo 'Build sukses — image sudah dibuat dan artefak diarsipkan.' }
        failure { echo 'Build gagal — periksa log stage yang merah dan kabari tim.' }
    }
}`,
      explain: [
        'Perhatikan bagaimana ringkasnya Jenkinsfile ini: seluruh logika checkout, build, test, dan artefak berada di library, sedangkan berkas ini hanya menyatakan parameter proyek.',
        'Versi library dikunci di baris <code>@Library</code>, sehingga pembaruan library dilakukan secara sadar melalui perubahan versi pada Jenkinsfile, bukan tanpa diundang.',
        'Parameter pengguna (<code>params.TEST_CMD</code>) diteruskan ke library, jadi tim tetap bisa bereksperimen tanpa menyentuh isi library.',
        'Struktur ini membuat review menjadi mudah: perubahan pada satu berkas library dibahas sekali, lalu dampaknya terlihat di seluruh pemakai.'
      ]
    },
    {
      type: 'tip',
      title: 'Mulailah dari Satu Langkah yang Paling Sering Disalin',
      text: 'Tidak perlu langsung memindahkan seluruh pipeline ke library. Pilih satu blok yang paling sering disalin-tempel antartim — misalnya bagian build image dan arsip artefak — bungkus sebagai <code>vars/buildApp.groovy</code>, lalu biarkan tim mengadopsinya bertahap. Setelah library terbukti berguna, tambahkan berkas <code>vars/xxx.html</code> sebagai dokumentasi singkat dan jalankan unit test di folder <code>test/</code> memakai JenkinsPipelineUnit sebelum setiap rilis tag.'
    },
    {
      type: 'warn',
      title: 'Library Tepercaya Berarti Kode Tepercaya',
      text: 'Library yang terdaftar di <b>Global Trusted Pipeline Libraries</b> dianggap kode tepercaya: kode di dalamnya boleh memanggil langkah apa pun dan <b>tidak dijalankan dalam Groovy sandbox</b>. Artinya satu baris jahat di library langsung berdampak pada seluruh pipeline perusahaan. Wajibkan code review minimal satu pemberi persetujuan lain, batasi siapa yang boleh menggabungkan perubahan, dan perlakukan repository library persis seperti kode produksi — termasuk pemindaian dependensi dan pencatatan perubahan.'
    },
    {
      type: 'vocab',
      items: [
        ['Shared Library', 'Pustaka Groovy berisi logika pipeline bersama yang disimpan di satu Git dan dipakai banyak Jenkinsfile.'],
        ['vars/', 'Folder berisi berkas xxx.groovy dengan metode call(); otomatis tersedia sebagai langkah global di pipeline.'],
        ['src/', 'Folder berisi kelas Groovy berstruktur paket yang dipakai lewat import, seperti pustaka pada umumnya.'],
        ['resources/', 'Folder berkas statis yang diambil pipeline dengan langkah libraryResource.'],
        ['Global Trusted Pipeline Libraries', 'Bagian Manage Jenkins → System untuk mendaftarkan library tepercaya beserta versi bawaannya.'],
        ['Tag Git', 'Penanda revisi pada repository Git yang dipakai sebagai versi rilis library, misalnya v1.2.0.'],
        ['Groovy Sandbox', 'Penyekat keamanan yang membatasi kode agar tidak memanggil API berbahaya; dilewati oleh library tepercaya.']
      ]
    }
  ],
  recap: [
    'Duplikasi Jenkinsfile membuat perubahan lambat dan hasil build tidak konsisten; Shared Library memusatkan logika pipeline di satu repository Git.',
    'Struktur library: vars/ untuk langkah global berbasis call(), src/ untuk kelas Groovy berpaket, resources/ untuk berkas statis, dan test/ untuk uji library.',
    'Library didaftarkan di Manage Jenkins → System → Global Trusted Pipeline Libraries, lalu dipakai dengan @Library(\'nama@versi\') _ di bagian atas Jenkinsfile.',
    'Versioning memakai tag Git agar build deterministik; library tepercaya dijalankan tanpa sandbox sehingga wajib melewati code review seperti kode produksi.'
  ]
});
