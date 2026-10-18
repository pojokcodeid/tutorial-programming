/* ============================================================
   Pelajaran Jenkins — Bab 7: Scripted Pipeline & Dasar Groovy (L7)
   ============================================================ */
'use strict';

window.JENKINS_LESSONS = window.JENKINS_LESSONS || [];

window.JENKINS_LESSONS.push({
  id: 'pipeline-terprogram',
  title: 'Scripted Pipeline & Dasar Groovy',
  chapter: 'Pipeline as Code',
  duration: '8–10 menit',
  intro: [
    'Declarative Pipeline menawarkan struktur baku, tetapi ada kalanya kebutuhan build tidak muat di kerangka itu: logika percabangan yang rumit, pengulangan dinamis, atau pipeline warisan yang harus tetap dipelihara. Di sinilah <b>Scripted Pipeline</b> berperan.',
    'Scripted Pipeline ditulis dengan <b>Groovy DSL</b>, yaitu bahasa Groovy (turunan Java yang sintaksnya ringan) yang diperkaya dengan fungsi-fungsi khusus Jenkins seperti <code>node</code>, <code>stage</code>, <code>sh</code>, dan <code>error</code>. Kekuatannya besar karena kamu bebas menggunakan konstruksi Groovy apa pun: variabel, percabangan, perulangan, hingga fungsi lokal.',
    'Bab ini membahas struktur dasar Scripted Pipeline, sintaks Groovy yang wajib dikuasai, cara mengendalikan hasil build, perbandingannya dengan Declarative, serta catatan keamanan berupa Groovy sandbox dan Script Approval.'
  ],
  objectives: [
    'Memahami struktur dasar Scripted Pipeline: blok <code>node</code>, <code>stage</code>, dan <code>steps</code>',
    'Menguasai sintaks Groovy minimal: <code>def</code>, <code>if/else</code>, <code>try/catch/finally</code>, perulangan, dan fungsi lokal',
    'Mengendalikan hasil build memakai <code>currentBuild.result</code> dan <code>error</code>',
    'Menilai kapan Scripted masih relevan dan mengapa Declarative tetap menjadi pilihan utama'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Struktur Dasar Scripted Pipeline</h3><p>Secara paling sederhana, Scripted Pipeline terdiri dari blok <code>node</code> yang berisi rangkaian <code>stage</code>, dan tiap stage berisi langkah-langkah eksekusi:</p><pre><code>node {\n    stage(\'Checkout\') {\n        checkout scm\n    }\n    stage(\'Build\') {\n        sh \'npm ci\'\n    }\n}</code></pre><p>Blok <code>node</code> memilih tempat eksekusi (bisa diberi label, misalnya <code>node(\'linux-builder\')</code>), <code>stage</code> memberi nama tahap agar terlihat di antarmuka, dan <code>sh</code> menjalankan perintah shell. Tidak ada blok <code>pipeline</code> maupun aturan urutan yang kaku — seluruh isi Groovy yang sah boleh ditulis di dalamnya.</p>'
    },
    {
      type: 'text',
      html: '<h3>Dasar Groovy untuk Pipeline</h3><p>Groovy terasa famililer bagi yang pernah menulis JavaScript atau Java. Konsep yang paling sering dipakai di pipeline:</p><ul><li><b>Deklarasi variabel</b> — <code>def nama = \'katalog\'</code> atau <code>int jumlah = 3</code>. Variabel dideklarasikan di dalam <code>node</code> akan tersedia sepanjang blok itu.</li><li><b>Percabangan</b> — <code>if (params.DEPLOY) { ... } else { ... }</code> untuk memilih jalur eksekusi berdasarkan parameter.</li><li><b>Penanganan kesalahan</b> — blok <code>try/catch/finally</code> untuk menangkap kegagalan perintah tanpa langsung menggagalkan seluruh build.</li><li><b>Perulangan</b> — <code>for (int i = 0; i &lt; n; i++)</code> atau <code>list.each { item -> ... }</code> untuk menjalankan langkah yang sama terhadap banyak target.</li><li><b>Fungsi lokal</b> — <code>def runStep(...) { ... }</code> untuk merangkum langkah berulang menjadi satu fungsi yang dapat dipanggil berkali-kali.</li></ul><p>Satu perbedaan penting dengan bahasa sehari-hari: kode pipeline dijalankan oleh mesin bernama <b>CPS (Continuation Passing Style)</b> Jenkins, sehingga ada batasan teknis tertentu pada Groovy murni (misalnya pemakaian <code>def</code> di dalam blok <code>catch</code>). Bila kamu menemui anjuran <i>Script Approval</i> saat memakai fitur Groovy lanjutan, baca catatan keamanan di bagian akhir bab ini.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 350" width="760" role="img" aria-label="Perbandingan dua kolom: struktur Declarative pipeline dengan stages dan struktur Scripted node dengan stage">
        <rect x="20" y="36" width="340" height="256" rx="10" class="u-box"/>
        <text x="190" y="62" class="u-title" text-anchor="middle">Declarative</text>
        <line x1="35" y1="72" x2="345" y2="72" class="u-line"/>
        <rect x="40" y="84" width="300" height="28" rx="6" class="u-hd"/>
        <text x="190" y="102" class="u-lbl" text-anchor="middle">pipeline { }</text>
        <rect x="58" y="120" width="282" height="28" rx="6" class="u-box"/>
        <text x="199" y="138" class="u-lbl" text-anchor="middle">stages { }</text>
        <rect x="76" y="156" width="264" height="28" rx="6" class="u-box"/>
        <text x="208" y="174" class="u-lbl" text-anchor="middle">stage(\'Test\') { steps { ... } }</text>
        <rect x="76" y="192" width="264" height="28" rx="6" class="u-box"/>
        <text x="208" y="210" class="u-lbl" text-anchor="middle">stage(\'Build\') { steps { ... } }</text>
        <rect x="40" y="228" width="300" height="28" rx="6" class="u-box"/>
        <text x="190" y="246" class="u-lbl" text-anchor="middle">post { success / failure }</text>
        <text x="190" y="282" class="u-lbl" text-anchor="middle">Struktur baku, mudah distandarkan</text>
        <rect x="400" y="36" width="340" height="256" rx="10" class="u-box"/>
        <text x="570" y="62" class="u-title" text-anchor="middle">Scripted</text>
        <line x1="415" y1="72" x2="725" y2="72" class="u-line"/>
        <rect x="420" y="84" width="300" height="28" rx="6" class="u-hd"/>
        <text x="570" y="102" class="u-lbl" text-anchor="middle">node { }</text>
        <rect x="438" y="120" width="282" height="28" rx="6" class="u-box"/>
        <text x="579" y="138" class="u-lbl" text-anchor="middle">stage(\'Test\') { sh \'...\' }</text>
        <rect x="438" y="156" width="282" height="28" rx="6" class="u-box"/>
        <text x="579" y="174" class="u-lbl" text-anchor="middle">if / try-catch / for</text>
        <rect x="438" y="192" width="282" height="28" rx="6" class="u-box"/>
        <text x="579" y="210" class="u-lbl" text-anchor="middle">def fungsiLokal() { ... }</text>
        <rect x="420" y="228" width="300" height="28" rx="6" class="u-box"/>
        <text x="570" y="246" class="u-lbl" text-anchor="middle">currentBuild.result / error</text>
        <text x="570" y="282" class="u-lbl" text-anchor="middle">Groovy bebas, logika dinamis</text>
        <line x1="366" y1="164" x2="394" y2="164" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="380" y="150" class="u-lbl" text-anchor="middle">vs</text>
        <text x="380" y="326" class="u-lbl" text-anchor="middle">Declarative kaku dan terstandarkan; Scripted lentur tetapi perlu disiplin</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 7.1</b> — Perbandingan struktur Declarative (pipeline berisi stages) dengan Scripted (node berisi stage dan logika Groovy bebas)</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Scripted Dasar: try/catch Memisahkan Hasil Pengujian',
      lang: 'groovy',
      output: false,
      code: `node {
    stage('Checkout') {
        checkout scm
    }

    stage('Install') {
        sh 'npm ci'
    }

    stage('Test') {
        try {
            sh 'npm test -- --reporter=junit'
            currentBuild.result = 'SUCCESS'
        } catch (err) {
            currentBuild.result = 'UNSTABLE'
            echo 'Pengujian gagal: ' + err.getMessage()
        } finally {
            junit testResults: 'test-results/*.xml', allowEmptyResults: true
        }
    }

    stage('Build') {
        sh 'npm run build'
    }
}`,
      explain: [
        'Tanpa <code>try/catch</code>, kegagalan <code>sh \'npm test\'</code> langsung menggagalkan seluruh build dan tahap berikutnya tidak pernah berjalan.',
        'Dengan <code>catch</code>, kegagalan pengujian ditangkap lebih dulu lalu dicatat, sehingga tahap <i>Build</i> tetap bisa berjalan dan kamu tetap mendapat artefak hasil build.',
        '<code>finally</code> selalu dijalankan — tempat yang tepat untuk laporan JUnit agar laporan tetap terbit meski pengujian gagal.',
        'Status <code>UNSTABLE</code> membuat ikon build kuning (bermasalah) berbeda dari <code>FAILURE</code> (merah), sehingga tim dapat membedakan "build gagal total" dengan "build jalan tetapi ada test gagal".'
      ]
    },
    {
      type: 'example',
      title: 'Perulangan: Menjalankan Banyak Modul dalam Satu Build',
      lang: 'groovy',
      output: false,
      code: `def modules = ['api', 'web', 'worker']

node {
    stage('Checkout') {
        checkout scm
    }

    stage('Test Semua Modul') {
        for (int i = 0; i < modules.size(); i++) {
            def nama = modules[i]
            stage("Test \${nama}") {
                dir(nama) {
                    sh 'npm ci'
                    sh 'npm test'
                }
            }
        }
    }

    stage('Rangkum') {
        echo 'Semua modul selesai diuji: ' + modules.join(', ')
    }
}`,
      explain: [
        'Daftar modul dideklarasikan sekali di bagian atas; bila bertambah, cukup tambahkan satu entri tanpa menulis ulang seluruh tahap.',
        'Setiap iterasi membuat stage baru bernama dinamis lewat interpolasi string <code>"Test \${nama}"</code> sehingga hasilnya tetap terlihat rapi di antarmuka Jenkins.',
        'Blok <code>dir(nama)</code> memindahkan kerja ke subfolder modul, menghindari tabrakan workspace antar-modul.',
        'Pendekatan ini hanya mungkin karena sifat Scripted yang fleksibel; pada Declarative, pengulangan semacam ini membutuhkan fitur <code>matrix</code> yang lebih terbatas.'
      ]
    },
    {
      type: 'example',
      title: 'Fungsi Groovy Lokal: Merangkum Langkah Berulang',
      lang: 'groovy',
      output: false,
      code: `def runStep(nama, perintah) {
    stage(nama) {
        try {
            sh perintah
            echo nama + ' selesai.'
        } catch (err) {
            currentBuild.result = 'FAILURE'
            error nama + ' gagal: ' + err.getMessage()
        }
    }
}

node {
    stage('Checkout') {
        checkout scm
    }

    runStep('Install', 'npm ci')
    runStep('Lint', 'npm run lint')
    runStep('Test', 'npm test')

    stage('Notifikasi') {
        if (currentBuild.result == 'FAILURE') {
            emailext subject: 'Build GAGAL: ' + env.JOB_NAME + ' #' + env.BUILD_NUMBER,
                     body: 'Periksa log di ' + env.BUILD_URL,
                     to: 'tim-contoh@example.com'
        }
    }
}`,
      explain: [
        'Fungsi <code>runStep</code> dideklarasikan di bagian paling atas, di luar blok <code>node</code>, agar tersedia sebelum pekerjaan dimulai.',
        'Setiap pemanggilan otomatis membuat stage bernama sesuai parameter pertama, sehingga analisis tetap mudah walaupun langkahnya dirangkum.',
        '<code>error \'pesan\'</code> memaksa build berstatus gagal dengan pesan yang jelas — lebih informatif daripada membiarkan exception Groovy mentah bocor ke log.',
        'Notifikasi memakai <code>emailext</code> (plugin Email Extension) dan hanya dikirim bila hasil akhir <code>FAILURE</code>, agar tim tidak dikejutkan surel berlebihan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Declarative vs Scripted: Kapan Memakai Yang Mana?</h3><p>Keduanya berjalan di mesin pipeline yang sama dan bisa memanggil langkah (<i>step</i>) yang sama pula. Perbedaannya terletak pada kebebasan dan tingkat keterbacaan:</p><table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%"><thead><tr><th>Aspek</th><th>Declarative</th><th>Scripted</th></tr></thead><tbody><tr><td>Struktur</td><td>Baku dan terbatas</td><td>Bebas, Groovy penuh</td></tr><tr><td>Logika kompleks</td><td>Terbatas (perlu <code>script</code> block)</td><td>Alami dan ringkas</td></tr><tr><td>Keterbacaan tim</td><td>Tinggi, seragam</td><td>Bervariasi, bergaya penulis</td></tr><tr><td>Kurva belajar</td><td>Rendah</td><td>Sedang (perlu dasar Groovy)</td></tr><tr><td>Eksekusi paralel &amp; <code>when</code></td><td>Didukung natif</td><td>Dirakit manual</td></tr><tr><td>Contoh pemakaian</td><td>Sebagian besar proyek baru</td><td>Pipeline warisan, logika dinamis berat</td></tr></tbody></table><p>Scripted masih relevan pada tiga situasi: <b>pipeline warisan</b> yang sudah lama berjalan dan terlalu besar untuk ditulis ulang sekaligus, <b>kebutuhan dinamis berat</b> seperti membangun daftar tahap dari konfigurasi eksternal, serta <b>logika percabangan kompleks</b> yang sulit diekspresikan dalam kerangka Declarative. Untuk proyek baru, rekomendasi tetap: <b>mulailah dengan Declarative</b>, dan sisipkan blok <code>script</code> hanya bila benar-benar diperlukan.</p>'
    },
    {
      type: 'text',
      html: '<h3>Keamanan: Groovy Sandbox &amp; Script Approval</h3><p>Karena pipeline berisi kode yang dieksekusi, Jenkins menerapkan dua lapis pengaman. Pertama, <b>Groovy sandbox</b> membatasi API Groovy yang boleh dipanggil dari pipeline sehingga kode tidak dapat sembarangan mengakses sistem. Kedua, pemanggilan di luar daftar yang diizinkan memicu proses bernama <b>Script Approval</b>: seorang administrator harus menyetujui kode tersebut sebelum bisa dijalankan.</p><p>Artinya, bila pipeline kamu berhenti dengan pesan <i>“Requires script approval”</i>, itu bukan kesalahan penulisan, melainkan mekanisme keamanan bekerja. Dalam tim, mintalah administrator menyetujui signature yang dibutuhkan — atau lebih baik lagi, hindari pemakaian Groovy mentah yang memicu approval. Pembahasan hardening menyeluruh (Content Security Policy, audit log) tersedia pada bab keamanan Jenkins.</p>'
    },
    {
      type: 'example',
      title: 'Membaca &amp; Mengubah Hasil Build',
      lang: 'groovy',
      output: false,
      code: `node {
    stage('Test') {
        try {
            sh 'npm test'
        } catch (err) {
            // tandai tidak sehat tanpa menggagalkan build
            currentBuild.result = 'UNSTABLE'
        }
    }

    stage('Keputusan Deploy') {
        if (currentBuild.result == 'SUCCESS') {
            echo 'Lolos, siap untuk tahap deploy.'
        } else if (currentBuild.result == 'UNSTABLE') {
            echo 'Ada test gagal — tunda deploy dan beri tahu tim.'
        } else {
            error 'Keadaan tidak terduga: ' + currentBuild.result
        }
    }
}`,
      explain: [
        '<code>currentBuild.result</code> menampung status build saat ini: <code>SUCCESS</code>, <code>UNSTABLE</code>, <code>FAILURE</code>, atau <code>ABORTED</code>.',
        'Status hanya bisa diturunkan, bukan dinaikkan: bila sudah <code>FAILURE</code>, mengembalikan ke <code>SUCCESS</code> tidak akan mengubah apa pun.',
        'Pola percabangan di atas berguna untuk menahan tahap berisiko (misalnya deploy) ketika pengujian belum sepenuhnya hijau.',
        'Untuk membaca status tanpa mengubahnya, gunakan <code>currentBuild.currentResult</code> — perbedaan penting saat mengecek hasil di tengah pipeline.'
      ]
    },
    {
      type: 'tip',
      title: 'Saran Berlatih dari Nol',
      text: 'Buat satu repository publik gratis (GitHub atau GitLab), letakkan satu berkas <code>Jenkinsfile</code> berisi <code>node { stage(\'Hello\') { sh \'echo halo\' } }</code>, lalu pasang job Pipeline pada Jenkins open source yang berjalan di Podman. Dari titik itu, tambahkan satu fitur Groovy setiap kali: variabel, percabangan, <code>try/catch</code>, lalu fungsi lokal. Belajar bertahap seperti ini jauh lebih cepat daripada membaca seluruh referensi Groovy sekaligus.'
    },
    {
      type: 'warn',
      title: 'Kebebasan Groovy Ada Batasnya',
      text: 'Kode Scripted berjalan di lingkungan yang diawasi: fungsi Groovy yang tidak terdaftar akan ditahan <b>Groovy sandbox</b> dan menunggu persetujuan administrator melalui <b>Script Approval</b>. Jangan mengandalkan kode eksotis di pipeline produksi; dan perlu diingat bahwa seluruh isi Jenkinsfile (termasuk fungsi utilitas) bersifat internal perusahaan bila repositorymu privat.'
    },
    {
      type: 'vocab',
      items: [
        ['Scripted Pipeline', 'Gaya penulisan pipeline berbasis Groovy DSL tanpa kerangka kaku; struktur utamanya <code>node</code> yang berisi <code>stage</code>.'],
        ['Groovy', 'Bahasa pemrograman berbasis Java yang sintaksnya ringan; menjadi bahasa pengantar seluruh Jenkinsfile.'],
        ['DSL (Domain-Specific Language)', 'Dialek bahasa yang dibuat khusus untuk satu domain; Groovy di Jenkins diperkaya fungsi seperti <code>sh</code>, <code>node</code>, dan <code>stage</code>.'],
        ['node block', 'Blok penentu tempat eksekusi Scripted Pipeline; opsional diberi label agent, misalnya <code>node(\'linux-builder\')</code>.'],
        ['currentBuild', 'Objek yang membawa status build berjalan; <code>result</code> menampung <code>SUCCESS</code>, <code>UNSTABLE</code>, <code>FAILURE</code>, atau <code>ABORTED</code>.'],
        ['error step', 'Perintah <code>error \'pesan\'</code> yang menggagalkan build dengan pesan yang mudah dibaca.'],
        ['Groovy sandbox', 'Lapisan keamanan yang membatasi API Groovy yang boleh dipakai pipeline agar kode tidak berbahaya.'],
        ['Script Approval', 'Mekanisme persetujuan administrator untuk kode atau signature Groovy yang berada di luar daftar yang diizinkan.'],
        ['emailext', 'Langkah notifikasi surel dari plugin Email Extension, dipakai untuk mengirim kabar hasil build ke tim.']
      ]
    }
  ],
  recap: [
    'Scripted Pipeline memakai struktur <code>node</code> yang berisi <code>stage</code>, dengan Groovy bebas di dalamnya.',
    'Kekuatannya ada pada variabel, percabangan, <code>try/catch/finally</code>, perulangan, dan fungsi Groovy lokal.',
    'Hasil build dikendalikan lewat <code>currentBuild.result</code>, dan <code>error \'pesan\'</code> menggagalkan build secara terkendali.',
    'Scripted relevan untuk pipeline warisan dan logika dinamis; untuk proyek baru mulailah dengan Declarative, dan kenali Groovy sandbox serta Script Approval agar tidak bingung saat build tertahan persetujuan.'
  ]
});
