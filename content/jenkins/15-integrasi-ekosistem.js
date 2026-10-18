/* ============================================================
   Pelajaran Jenkins — Bab 15: Integrasi Ekosistem: Testing, Artefak, CD & Notifikasi
   ============================================================ */
'use strict';

window.JENKINS_LESSONS = window.JENKINS_LESSONS || [];

window.JENKINS_LESSONS.push({
  id: 'integrasi-ekosistem',
  title: 'Integrasi Ekosistem: Testing, Artefak, CD & Notifikasi',
  chapter: 'Produksi',
  duration: '8–10 menit',
  intro: [
    'Pipeline yang hanya mengompilasi kode dan berhenti di situ baru separuh perjalanan. Tim produksi membutuhkan laporan uji yang bisa dibaca, hasil build yang tersimpan rapi, penyebaran ke server atau cluster, serta pemberitahuan ketika ada kegagalan — semuanya tanpa membuka laptop di tengah malam.',
    '<b>Jenkins</b> berperan sebagai pengendali, sedangkan pekerjaan berat dijalankan oleh ekosistem di sekitarnya: <b>JUnit</b> dan <b>SonarQube</b> untuk kualitas kode, <b>OWASP Dependency-Check</b> untuk kerentanan pustaka, <b>Nexus</b> dan <b>container registry</b> untuk artefak, pola <b>GitOps</b> beserta <b>ArgoCD</b> untuk penyebaran, serta <b>Slack</b>, <b>Microsoft Teams</b>, dan email untuk notifikasi.',
    'Bab ini menyusun peta ekosistem itu lengkap dengan potongan pipeline yang bisa langsung dicoba. Sebagian besar perangkat yang dipakai tersedia dalam edisi gratis atau sumber terbuka, sehingga seluruh praktiknya bisa dijalankan di komputer sendiri.'
  ],
  objectives: [
    'Menampilkan laporan uji dengan plugin JUnit serta memahami peran quality gate SonarQube',
    'Memindai dependensi memakai OWASP Dependency-Check untuk mendeteksi kerentanan',
    'Mengelola artefak lewat archiveArtifacts, stash/unstash, dan container registry',
    'Menerapkan pola CD/GitOps dan notifikasi email serta Slack pada blok post'
  ],
  sections: [
    {
      type: 'text',
      html: `<h3>Peta Ekosistem CI/CD</h3><p>Jarang ada tim yang memakai satu alat untuk semuanya. Yang umum terjadi: Jenkins menjadi orkestrator yang menghubungkan perkakas-perkakas di sekitarnya lewat plugin dan kredensial bersama. Memahami peta ini membuat kamu tahu kapan harus menambah alat dan kapan cukup memakai bawaan Jenkins.</p>
      <figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 350" width="760" role="img" aria-label="Peta ekosistem CI CD dengan Jenkins di tengah terhubung ke Git, SonarQube, Nexus dan Registry, Server Kubernetes ArgoCD, serta Slack dan Email">
        <rect x="290" y="140" width="180" height="76" rx="10" class="u-hd"/>
        <text x="380" y="168" class="u-title" text-anchor="middle">Jenkins</text>
        <text x="380" y="192" class="u-lbl" text-anchor="middle">otak pipeline CI/CD</text>
        <rect x="20" y="30" width="180" height="76" rx="10" class="u-box"/>
        <text x="110" y="58" class="u-title" text-anchor="middle">Git / GitHub</text>
        <text x="110" y="82" class="u-lbl" text-anchor="middle">kode, Jenkinsfile, webhook</text>
        <rect x="290" y="24" width="180" height="76" rx="10" class="u-box"/>
        <text x="380" y="52" class="u-title" text-anchor="middle">SonarQube</text>
        <text x="380" y="76" class="u-lbl" text-anchor="middle">analisis kode &amp; CVE</text>
        <rect x="560" y="30" width="180" height="76" rx="10" class="u-box"/>
        <text x="650" y="58" class="u-title" text-anchor="middle">Nexus &amp; Registry</text>
        <text x="650" y="82" class="u-lbl" text-anchor="middle">arsip &amp; image container</text>
        <rect x="20" y="240" width="200" height="76" rx="10" class="u-box"/>
        <text x="120" y="268" class="u-title" text-anchor="middle">Server / Kubernetes</text>
        <text x="120" y="292" class="u-lbl" text-anchor="middle">deploy via ArgoCD</text>
        <rect x="540" y="240" width="200" height="76" rx="10" class="u-box"/>
        <text x="640" y="268" class="u-title" text-anchor="middle">Slack &amp; Email</text>
        <text x="640" y="292" class="u-lbl" text-anchor="middle">status build</text>
        <line x1="180" y1="104" x2="298" y2="152" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="214" y="120" class="u-lbl" text-anchor="middle">checkout</text>
        <line x1="380" y1="102" x2="380" y2="136" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="390" y="122" class="u-lbl">quality gate</text>
        <line x1="558" y1="104" x2="476" y2="150" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="536" y="120" class="u-lbl" text-anchor="middle">push artefak</text>
        <line x1="218" y1="246" x2="300" y2="208" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="228" y="224" class="u-lbl" text-anchor="middle">CD</text>
        <line x1="540" y1="266" x2="476" y2="208" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="518" y="242" class="u-lbl" text-anchor="middle">post</text>
        <text x="380" y="342" class="u-lbl" text-anchor="middle">Jenkins mengendalikan alur; tiap layanan terhubung lewat plugin dan kredensial bersama</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 15.1</b> — Peta ekosistem CI/CD: Jenkins di pusat, dikelilingi Git, SonarQube, Nexus/Registry, Server/Kubernetes, dan kanal notifikasi</figcaption></figure>`
    },
    {
      type: 'text',
      html: "<h3>Testing dan Kualitas Kode</h3><p>Tahap pertama integrasi adalah mengubah hasil uji menjadi informasi yang bisa dibaca orang. Plugin <b>JUnit</b> membaca berkas laporan berformat XML dan menampilkan grafik tren uji di setiap build, termasuk tab khusus <i>Test Results</i>.</p><ul><li>Langkah <code>junit</code> dipanggil di blok <code>post { always }</code> agar laporan tetap muncul meski uji gagal.</li><li>Gunakan <code>allowEmptyResults: true</code> bila sebagian build memang belum menghasilkan laporan, supaya build tidak ikut gagal hanya karena berkas XML tidak ada.</li><li>Ambang batas <code>skipOldReports</code> dan <code>healthScaleFactor</code> bisa disetel bila tren mulai ramai.</li></ul><p>Untuk kualitas kode yang lebih dalam, <b>SonarQube Community Edition</b> tersedia gratis dan bisa dijalankan lokal memakai container. Jenkins mengirimkan hasil pindai lewat <b>sonar-scanner</b>, lalu SonarQube menilai bug, <i>code smell</i>, dan cakupan kode melalui <b>quality gate</b>. Sedangkan <b>OWASP Dependency-Check</b> memeriksa pustaka eksternal proyek terhadap database kerentanan (CVE) — penting karena sebagian besar insiden modern berasal dari dependensi, bukan kode sendiri.</p>"
    },
    {
      type: 'example',
      title: 'Contoh 1: Potongan post-build JUnit dan Coverage',
      lang: 'groovy',
      output: false,
      code: `pipeline {
    agent any
    stages {
        stage('Uji') {
            steps {
                // npm test dikonfigurasi menghasilkan laporan XML dan coverage
                sh 'npm test -- --coverage --reporters=jest-junit,jest'
            }
        }
    }
    post {
        always {
            // always agar laporan tetap tampil walau ada uji yang gagal
            junit testResults: 'test-results/*.xml', allowEmptyResults: true
        }
        success {
            // Plugin Coverage (penerus Cobertura) menyimpan tren cakupan kode
            recordCoverage tools: [[parser: 'COBRETTI']], failBuild: false
        }
        failure {
            echo 'Ada unit test yang gagal — buka tab Test Results untuk rinciannya.'
        }
    }
}`,
      explain: [
        'Blok <code>always</code> memastikan laporan uji terbaca meski tahap Uji melempar kegagalan; tanpanya, hasil analisis hilang persis saat kamu membutuhkannya.',
        '<code>allowEmptyResults: true</code> membuat langkah tidak gagal ketika belum ada berkas XML — berguna untuk cabang yang belum memiliki unit test.',
        '<code>recordCoverage</code> berasal dari plugin <i>Coverage</i>; pilihan parser lain tersedia untuk proyek Java seperti JACOCO.',
        'Tren cakupan yang tercatat per build membuat penurunan kualitas terlihat sebelum menjadi masalah produksi.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh 2: Pemindaian SonarQube dan OWASP Dependency-Check',
      lang: 'bash',
      output: false,
      code: `# 1) SonarQube Community Edition — jalankan lokal, gratis dan tanpa batas
podman run -d --name sonarqube -p 9000:9000 sonarqube:lts-community

# 2) Pindai proyek dari workspace Jenkins
#    Token dibuat di SonarQube → My Account → Security → Generate Tokens
sonar-scanner \\
  -Dsonar.host.url=http://localhost:9000 \\
  -Dsonar.token="$SONAR_TOKEN" \\
  -Dsonar.projectKey=toko-online \\
  -Dsonar.sources=src \\
  -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info

# 3) Pemindaian dependensi dengan OWASP Dependency-Check
#    (pasang lewat Manage Jenkins → Tools, lalu panggil dari pipeline)
dependency-check \\
  --project "toko-online" \\
  --scan . \\
  --format HTML \\
  --out build/dependency-check-report`,
      explain: [
        'Image <code>sonarqube:lts-community</code> berjalan sepenuhnya di komputermu; hasil analisis dapat dibuka di <code>http://localhost:9000</code>.',
        'Scanner mengirimkan data ke server SonarQube melalui token, sehingga token cukup disimpan sekali sebagai Jenkins Credential dan tidak menyebar ke berkas pipeline.',
        '<code>OWASP Dependency-Check</code> membuat laporan HTML berisi daftar pustaka beserta CVE-nya; jadwalkan pemindaian ini pada build malam agar tidak memperlambat alur rilis.',
        'Hasil pemindaian kualitas dan dependensi paling berguna bila dipasang sebagai <i>quality gate</i> — build gagal otomatis bila ambang batas tidak terpenuhi.'
      ]
    },
    {
      type: 'text',
      html: "<h3>Manajemen Artefak</h3><p>Hasil build harus disimpan agar bisa dipakai ulang dan dilacak. Jenkins menyediakan tiga mekanisme bawaan:</p><ul><li><code>archiveArtifacts artifacts: 'dist/**'</code> — menyimpan berkas distribusi ke JENKINS_HOME agar bisa diunduh dari halaman build dan dipakai kembali.</li><li><code>stash</code> dan <code>unstash</code> — menyalin berkas antar-stage atau antar-agent dalam satu kali build, berguna ketika pengujian dan pemaketan berjalan di agent berbeda.</li><li><code>buildNumber</code> dan <i>fingerprint</i> — mencatat jejak berkas sehingga bisa ditelusuri sampai lingkungan mana artefak itu terpakai.</li></ul><p>Untuk skala tim, artefak sebaiknya dipindahkan ke <b>repository artefak</b>: <b>Nexus Repository</b> (edisi OSS gratis) atau <b>JFrog Artifactory</b> (edisi Community gratis) menyimpan paket, pustaka, dan image dengan aturan retensi yang jelas. <b>Container registry</b> menyimpan image: <b>Docker Hub</b> menyediakan paket gratis, <b>Quay</b> memiliki rekening gratis, dan untuk latihan sepenuhnya lokal kamu bisa menjalankan registry sendiri dengan <code>podman run -d -p 5000:5000 registry:2</code>.</p>"
    },
    {
      type: 'example',
      title: 'Contoh 3: Membungkus Artefak dan Mendorong Image ke Registry',
      lang: 'groovy',
      output: false,
      code: `stage('Arsip & Publikasi') {
    steps {
        // Simpan hasil build agar bisa diunduh dari halaman build
        archiveArtifacts artifacts: 'dist/**', fingerprint: true

        // Bawa berkas konfigurasi ke stage berikutnya / agent lain
        stash name: 'konfigurasi-deploy', includes: 'deploy/**'

        script {
            def tag = "build-\${env.BUILD_NUMBER}"
            // Registry lokal: podman run -d -p 5000:5000 registry:2
            sh "podman build -t localhost:5000/toko-online:\${tag} ."
            sh "podman push localhost:5000/toko-online:\${tag} --tls-verify=false"
        }
    }
}`,
      explain: [
        '<code>fingerprint: true</code> mencatat sidik jari berkas, sehingga artefak dapat ditelusuri ke build mana pun yang memakainya.',
        '<code>stash</code> mengirim berkas ke stage lain dalam satu build; untuk berbagi antar-build, gunakan repository artefak seperti Nexus atau Artifactory.',
        'Tag image memakai nomor build, bukan <code>latest</code>, agar rilis selalu dapat dipastikan isinya.',
        'Registry lokal <code>localhost:5000</code> cocok untuk latihan; beralih ke Docker Hub atau Quay cukup dengan mengganti prefiks nama image dan menambahkan credential login.'
      ]
    },
    {
      type: 'text',
      html: "<h3>CD dan GitOps</h3><p>Setelah artefak siap, tahap berikutnya adalah penyebaran. Tiga pendekatan yang paling sering dipakai:</p><ul><li><b>Skrip SSH atau Ansible</b> — jalankan perintah langsung ke server tujuan; sederhana dan cocok untuk jumlah server terbatas. Ansible menambahkan sifat idempoten sehingga penyebaran ulang aman.</li><li><b>Package Helm</b> — perbarui nilai image pada chart lalu <code>helm upgrade --install</code> ke cluster Kubernetes, sesuai materi Helm pada bagian Operasional tutorial Kubernetes.</li><li><b>GitOps</b> — Jenkins tidak menyentuh cluster sama sekali. Jenkins meng-commit manifest hasil build (misalnya perubahan tag image pada berkas <code>deployment.yaml</code>) ke repository manifest, lalu <b>ArgoCD</b> di cluster menyinkronkan keadaan nyata dengan isi Git. Pola ini terhubung langsung dengan materi Kubernetes di situs ini, khususnya pembahasan ArgoCD sebagai <i>reconciler</i>.</li></ul><p>Keunggulan GitOps: setiap penyebaran meninggalkan jejak commit yang bisa diaudit dan di-<i>rollback</i>, dan perbedaan antara keinginan (Git) dengan kenyataan (cluster) selalu terlihat sebagai <i>drift</i>.</p>"
    },
    {
      type: 'example',
      title: 'Contoh 4: Memperbarui Manifest (Pola GitOps)',
      lang: 'groovy',
      output: false,
      code: `stage('Perbarui Manifest') {
    steps {
        // Kunci SSH disimpan sebagai Jenkins Credential bertipe SSH Username with private key
        sshagent(['ssh-key-deploy']) {
            sh '''
                git clone --depth 1 git@github.com:tim-dev/manifest-toko.git
                cd manifest-toko
                sed -i "s|image: .*|image: localhost:5000/toko-online:build-\${BUILD_NUMBER}|" deployment.yaml
                git config user.email "jenkins@belajarkoding.local"
                git config user.name "Jenkins"
                git commit -am "rilis build-\${BUILD_NUMBER}"
                git push origin main
            '''
        }
    }
}`,
      explain: [
        'Tiga petik (<code>\'\'\'</code>) membuat string Groovy multiline; isinya dijalankan apa adanya oleh shell, sehingga <code>${BUILD_NUMBER}</code> diselesaikan oleh shell, bukan Groovy.',
        '<code>--depth 1</code> melakukan clone dangkal agar cepat; Jenkins hanya memerlukan commit terbaru pada repository manifest.',
        'Perubahan pada berkas <code>deployment.yaml</code> berupa penggantian tag image — inilah sumber kebenaran yang akan disinkronkan ArgoCD ke cluster.',
        'Setelah commit masuk, ArgoCD mendeteksinya secara otomatis lalu melakukan sinkronisasi; jalankan <code>argocd app sync toko-online</code> bila ingin mempercepat.'
      ]
    },
    {
      type: 'text',
      html: "<h3>Notifikasi: Kabar Sampai ke Orang yang Tepat</h3><p>Build gagal paling berbahaya bukan saat ditemukan orang, melainkan saat ditemukan pengguna. Karena itu setiap pipeline produksi perlu memberi kabar otomatis:</p><ul><li><b>Email (SMTP)</b> — cara paling universal; tentukan server SMTP di Manage Jenkins → System, lalu gunakan langkah <code>emailext</code> dari plugin Email Extension.</li><li><b>Slack Incoming Webhook</b> — tersedia pada paket gratis; buat webhook di workspace Slack-nya, simpan URL sebagai <i>Secret Text</i> di Jenkins Credentials, lalu panggil <code>slackSend</code> atau <code>curl</code> langsung.</li><li><b>Microsoft Teams</b> — memakai <i>Incoming Webhook</i> pada tim yang dipilih, polanya sama dengan Slack: terima POST berisi berkas JSON.</li></ul><p>Tempatkan notifikasi di blok <code>post</code> — di situlah hasil akhir build diketahui — dan kirimkan detail yang benar-benar diperlukan: nama pekerjaan, nomor build, hasil, serta tautan menuju log.</p>"
    },
    {
      type: 'example',
      title: 'Contoh 5: Menguji Webhook Slack dan Memasang Notifikasi di post',
      lang: 'bash',
      output: false,
      code: `# Uji webhook langsung dari terminal sebelum dipakai di pipeline
# (URL disimpan sebagai Jenkins Credential bertipe Secret Text)
curl -X POST -H 'Content-type: application/json' \\
  --data '{"text":"Build toko-online #42 SUKSES — arsip siap diunduh."}' \\
  "$SLACK_WEBHOOK_URL"

# Potongan Jenkinsfile untuk notifikasi otomatis (groovy):
# post {
#     success {
#         slackSend color: 'good',
#             message: "Build \${env.JOB_NAME} #\${env.BUILD_NUMBER} sukses — \${env.BUILD_URL}"
#         emailext subject: "SUKSES: \${env.JOB_NAME} #\${env.BUILD_NUMBER}",
#             body: "Pipeline selesai tanpa kegagalan. Detail: \${env.BUILD_URL}",
#             to: 'tim-devops@example.com'
#     }
#     failure {
#         slackSend color: 'danger',
#             message: "GAGAL: \${env.JOB_NAME} #\${env.BUILD_NUMBER} — periksa \${env.BUILD_URL}"
#     }
# }`,
      explain: [
        'Menguji webhook dengan <code>curl</code> lebih dahulu memisahkan masalah notifikasi dari masalah pipeline; bila pesan muncul di Slack, berarti URL dan jaringan sudah benar.',
        'Simpan URL webhook sebagai <i>Secret Text</i> di Jenkins Credentials, bukan ditulis langsung di Jenkinsfile — webhook yang bocor bisa disalahgunakan siapa pun.',
        'Pesan <code>slackSend</code> memakai warna hijau untuk sukses dan merah untuk gagal, sehingga kondisi build terlihat sekilas di daftar channel.',
        'Menambahkan <code>${env.BUILD_URL}</code> membuat penerima langsung menuju halaman build dan log yang relevan.'
      ]
    },
    {
      type: 'tip',
      title: 'Tambahkan Satu Integrasi Sekaligus, Mulai dari yang Gratis',
      text: 'Pendekatan yang terbukti efektif: kuasai satu integrasi sebelum menambah berikutnya. Mulai dari laporan <code>junit</code> yang merupakan bagian dari plugin bawaan, lanjut ke SonarQube lokal memakai container, baru repository artefak atau registry, dan terakhir notifikasi. Semua contoh di bab ini bisa dijalankan gratis — SonarQube Community, Nexus OSS, registry lokal, dan paket gratis Slack — sehingga biaya tidak menjadi penghalang berlatih.'
    },
    {
      type: 'warn',
      title: 'Kredensial Jangan Pernah Menyusup ke Pipeline',
      text: 'Token SonarQube, URL webhook Slack, dan kunci SSH bukanlah bahan yang boleh ditulis langsung di Jenkinsfile — berkas itu disimpan di Git dan dilihat banyak orang. Selalu simpan sebagai <b>Jenkins Credentials</b>, lalu akses melalui <code>withCredentials</code>, <code>sshagent</code>, atau variabel environment yang terikat credential. Selain itu, perhatikan bahwa <code>registry:2</code> yang dipakai untuk latihan memang tidak memiliki autentikasi — jangan pernah menjalankannya terbuka di jaringan publik.'
    },
    {
      type: 'vocab',
      items: [
        ['Quality Gate', 'Ambang batas kualitas di SonarQube (cakupan, bug, code smell) yang harus lolos agar sebuah build dinyatakan layak.'],
        ['SonarScanner', 'Pemindai kode yang dijalankan dari Jenkins lalu mengirim hasilnya ke server SonarQube untuk dianalisis.'],
        ['OWASP Dependency-Check', 'Pemindai sumber terbuka yang memeriksa pustaka eksternal proyek terhadap database kerentanan CVE.'],
        ['Artefak', 'Hasil akhir proses build, seperti berkas distribusi atau image, yang disimpan untuk dipakai tahap berikutnya.'],
        ['stash / unstash', 'Langkah Jenkins untuk menyalin berkas antar-stage atau antar-agent di dalam satu kali build.'],
        ['Container Registry', 'Server penyimpanan dan penyebaran image container, misalnya Docker Hub, Quay, atau registry lokal.'],
        ['GitOps', 'Pola deployment yang menjadikan Git sebagai sumber kebenaran; Jenkins memperbarui manifest, ArgoCD menyinkronkan cluster.'],
        ['Incoming Webhook', 'URL khusus layanan notifikasi yang menerima pesan JSON dari sistem lain seperti Jenkins.']
      ]
    }
  ],
  recap: [
    'Jenkins menjadi pengendali ekosistem CI/CD: Git untuk kode, SonarQube dan Dependency-Check untuk kualitas, Nexus atau registry untuk artefak, dan Slack/email untuk kabar.',
    'Laporan uji dipasang di blok post { always } dengan junit dan allowEmptyResults; cakupan kode dicatat plugin Coverage agar penurunan kualitas terlihat dini.',
    'Artefak dikelola lewat archiveArtifacts dan stash, lalu dipindahkan ke repository artefak atau registry lokal; tag image selalu memakai nomor build, bukan latest.',
    'Penyebaran dapat memakai skrip SSH/Ansible, Helm, atau pola GitOps; notifikasi dipasang di blok post dan mengambil kredensial dari Jenkins Credentials.'
  ]
});
