/* ============================================================
   Pelajaran Jenkins — Bab 16: Praktik Proyek — 3 Proyek CI/CD Ujung ke Ujung
   ============================================================ */
'use strict';

window.JENKINS_LESSONS = window.JENKINS_LESSONS || [];

window.JENKINS_LESSONS.push({
  id: 'praktik-proyek',
  title: 'Praktik Proyek: 3 Proyek CI/CD Ujung ke Ujung',
  chapter: 'Praktik',
  duration: '8–10 menit',
  intro: [
    'Pengetahuan pipeline baru benar-benar melekat ketika kamu membangun sesuatu dari nol sampai berjalan otomatis. Bab ini merangkai seluruh materi Jenkins — Pipeline as Code, webhook, multibranch, container, sampai GitOps — menjadi tiga proyek berurutan yang saling melanjuti.',
    'Seluruh proyek dirancang agar bisa diselesaikan <b>gratis sepenuhnya</b> di komputer sendiri: <b>Podman</b> sebagai engine container, akun <b>GitHub</b> gratis untuk repository dan webhook, cluster lokal <b>Minikube</b> atau <b>Kind</b>, serta registry container lokal dengan <code>registry:2</code>. Tidak ada layanan berbayar yang diperlukan.',
    'Kamu akan membangun pipeline web app sederhana (Proyek 1), menaikkannya ke Multibranch Pipeline dengan aturan cabang dan webhook (Proyek 2), lalu menyempurnakannya menjadi alur GitOps ujung ke ujung di mana Jenkins meng-commit manifest dan ArgoCD menyinkronkannya ke cluster (Proyek 3). Di penutup, tersedia tabel troubleshooting untuk masalah yang paling sering muncul saat praktek.'
  ],
  objectives: [
    'Menyelesaikan Proyek 1: pipeline web app dengan unit test, build image Podman, dan tag rilis',
    'Menyelesaikan Proyek 2: Multibranch Pipeline dengan aturan cabang dan webhook otomatis',
    'Menyelesaikan Proyek 3: alur GitOps dari Jenkins sampai sinkronisasi ArgoCD ke cluster lokal',
    'Mendiagnosis masalah umum memakai tabel troubleshooting dan menyusun rencana belajar lanjutan'
  ],
  sections: [
    {
      type: 'text',
      html: `<h3>Peta Tiga Proyek</h3><p>Ketiga proyek disusun menanjak: masing-masing memakai hasil proyek sebelumnya sebagai fondasi, sehingga kamu tidak mengulang penyiapan dari nol. Setiap proyek diselesaikan ketika checklist-nya tercentang semua.</p>
      <figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 350" width="760" role="img" aria-label="Roadmap tiga proyek Jenkins berurutan dari pipeline sederhana ke multibranch lalu ke GitOps ujung ke ujung">
        <rect x="230" y="24" width="300" height="52" rx="10" class="u-hd"/>
        <text x="380" y="56" class="u-lbl" text-anchor="middle">Stack GRATIS: Podman · GitHub · Minikube/Kind · registry lokal</text>
        <rect x="30" y="110" width="200" height="120" rx="10" class="u-box"/>
        <text x="130" y="138" class="u-title" text-anchor="middle">Proyek 1</text>
        <text x="130" y="164" class="u-lbl" text-anchor="middle">Pipeline web app</text>
        <text x="130" y="186" class="u-lbl" text-anchor="middle">unit test + image</text>
        <text x="130" y="208" class="u-lbl" text-anchor="middle">tag rilis</text>
        <rect x="280" y="110" width="200" height="120" rx="10" class="u-box"/>
        <text x="380" y="138" class="u-title" text-anchor="middle">Proyek 2</text>
        <text x="380" y="164" class="u-lbl" text-anchor="middle">Multibranch + webhook</text>
        <text x="380" y="186" class="u-lbl" text-anchor="middle">when branch</text>
        <text x="380" y="208" class="u-lbl" text-anchor="middle">push ke registry lokal</text>
        <rect x="530" y="110" width="200" height="120" rx="10" class="u-box"/>
        <text x="630" y="138" class="u-title" text-anchor="middle">Proyek 3</text>
        <text x="630" y="164" class="u-lbl" text-anchor="middle">GitOps ujung ke ujung</text>
        <text x="630" y="186" class="u-lbl" text-anchor="middle">commit manifest</text>
        <text x="630" y="208" class="u-lbl" text-anchor="middle">ArgoCD sync</text>
        <line x1="232" y1="170" x2="274" y2="170" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="253" y="158" class="u-lbl" text-anchor="middle">naik</text>
        <line x1="482" y1="170" x2="524" y2="170" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="503" y="158" class="u-lbl" text-anchor="middle">naik</text>
        <rect x="30" y="266" width="700" height="48" rx="10" class="u-hd"/>
        <text x="380" y="296" class="u-lbl" text-anchor="middle">Hasil akhir: pipeline teruji, berversi di Git, siap dipakai tim — tanpa biaya langganan</text>
        <text x="380" y="340" class="u-lbl" text-anchor="middle">Setiap proyek memakai Jenkinsfile yang tersimpan di Git, sehingga konfigurasi ikut terkontrol versi</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 16.1</b> — Roadmap tiga proyek praktik: dari pipeline sederhana menuju GitOps ujung ke ujung</figcaption></figure>`
    },
    {
      type: 'text',
      html: "<h3>Persiapan Bersama Ketiga Proyek</h3><p>Siapkan sekali di awal, lalu dipakai untuk seluruh proyek. Semua tersedia gratis:</p><ul><li><b>Podman</b> — engine container rootless sebagai pengganti Docker di komputer lokal.</li><li><b>Jenkins lokal</b> — jalankan <code>podman run -d --name jenkins-server -p 8080:8080 -p 50000:50000 -v jenkins_home:/var/jenkins_home jenkins/jenkins:lts-jdk17</code>, lalu selesaikan pemasangan awal melalui browser.</li><li><b>Plugin dasar</b> — pasang Git, Credentials Binding, Pipeline, dan GitHub dari Manage Jenkins → Plugins.</li><li><b>Akun GitHub gratis</b> — untuk repository aplikasi, repository manifest, dan webhook.</li><li><b>Registry lokal</b> — <code>podman run -d -p 5000:5000 --name registry -v registry_data:/var/lib/registry registry:2</code>.</li><li><b>Cluster lokal</b> — Minikube dengan <code>--driver=podman</code> atau Kind, dipakai pada Proyek 3 sesuai materi Kubernetes di situs ini.</li><li><b>Kredensial</b> — siapkan SSH key untuk push ke GitHub dan simpan sebagai Jenkins Credential bertipe <i>SSH Username with private key</i>.</li></ul>"
    },
    {
      type: 'text',
      html: "<h3>Proyek 1 — Pipeline Web App Sederhana</h3><p>Proyek pertama memastikan kamu menguasai alur dasar: repository berisi aplikasi kecil, Jenkinsfile yang mengujinya, membangun image container, lalu memberi tag rilis. Aplikasinya sengaja dibuat sederhana — satu berkas uji sudah cukup — karena fokus latihan ada pada pipeline, bukan aplikasinya.</p><h4>Checklist Langkah</h4><ul><li>Buat repository Node.js kecil dengan setidaknya satu unit test yang lolos.</li><li>Taruh berkas <code>Jenkinsfile</code> di root repository lalu push ke GitHub.</li><li>Buat job <i>Pipeline</i> baru dengan <i>Pipeline script from SCM</i>, tunjuk repository, dan isi <code>Jenkinsfile</code> sebagai Script Path.</li><li>Jalankan job pertama dan pastikan seluruh stage hijau.</li><li>Verifikasi image muncul di registry lokal dan nama image memakai tag bernomor build.</li></ul>"
    },
    {
      type: 'example',
      title: 'Contoh 1: Menyiapkan Aplikasi dan Repository (Terminal)',
      lang: 'bash',
      output: false,
      code: `# 1) Buat proyek Node.js kecil beserta unit test
mkdir toko-online && cd toko-online
npm init -y
npm install --save-dev jest
npm pkg set scripts.test="jest --ci"

# 2) Tulis unit test pertama
cat > index.test.js <<'EOF'
const sum = (a, b) => a + b;
test('menjumlah dua angka', () => { expect(sum(2, 3)).toBe(5); });
EOF

# 3) Pastikan unit test berjalan sebelum masuk Jenkins
npm test

# 4) Taruh Jenkinsfile sederhana di root repository
cat > Jenkinsfile <<'EOF'
pipeline {
    agent any
    stages { stage('Uji') { steps { sh 'npm ci && npm test' } } }
}
EOF

# 5) Push ke GitHub (akun gratis)
git init -b main
git add -A
git commit -m "inisiasi toko-online"
git remote add origin git@github.com:username/toko-online.git
git push -u origin main`,
      explain: [
        'Menjalankan <code>npm test</code> langsung dari terminal sebelum memakai Jenkins memisahkan masalah aplikasi dari masalah pipeline.',
        'Berkas <code>Jenkinsfile</code> diletakkan di root repository agar Jenkins otomatis menemukannya dengan nilai bawaan Script Path.',
        'Pemakaian <code>git init -b main</code> membuat cabang utamanya langsung bernama <code>main</code>, sesuai konvensi GitHub saat ini.',
        'Setelah push selesai, buka Manage Jenkins → Credentials lalu tambahkan SSH key agar Jenkins bisa mengambil kode dari repository ini.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh 2: Jenkinsfile Proyek 1 — Uji, Build Image, Tag Rilis',
      lang: 'groovy',
      output: false,
      code: `// Jenkinsfile untuk Proyek 1 — pipeline web app sederhana
pipeline {
    agent any
    options { timestamps(); disableConcurrentBuilds() }
    environment {
        IMAGE = 'localhost:5000/toko-online'
    }
    stages {
        stage('Ambil Kode') {
            steps { checkout scm }
        }
        stage('Uji') {
            steps { sh 'npm ci && npm test' }
        }
        stage('Build Image') {
            steps {
                sh 'podman build -t \${IMAGE}:\${BUILD_NUMBER} .'
            }
        }
        stage('Tag Rilis') {
            steps {
                // Penanda rilis terakhir agar mudah dipasang dan ditarik
                sh 'podman tag \${IMAGE}:\${BUILD_NUMBER} \${IMAGE}:rilis-terakhir'
            }
        }
    }
    post {
        success { echo 'Sukses — image tersedia di registry lokal dengan nomor build dan rilis-terakhir.' }
        failure { echo 'Gagal — periksa log stage yang merah sebelum melanjutkan.' }
        always { deleteDir() }
    }
}`,
      explain: [
        'Urutan stage mengikuti alur nyata: ambil kode, uji, bangun image, lalu memberi tag — urutan ini tetap sama meski proyek bertambah kompleks.',
        'Variabel <code>IMAGE</code> ditetapkan sekali di blok <code>environment</code>, sehingga perubahan lokasi registry cukup dilakukan di satu tempat.',
        'Tag <code>rilis-terakhir</code> memudahkan penarikan image tanpa harus mengingat nomor build; untuk lingkungan produksi, ganti dengan tag versi seperti <code>v1.0.0</code>.',
        '<code>deleteDir()</code> pada blok <code>always</code> membersihkan workspace setelah build, mencegah workspace kotor yang menjadi sumber keanehan pada build berikutnya.'
      ]
    },
    {
      type: 'text',
      html: "<h3>Proyek 2 — Multibranch Microservice CI/CD</h3><p>Proyek kedua menaikkan Proyek 1 ke Multibranch Pipeline: satu job induk yang memindai semua cabang repository dan membuat job turunan untuk tiap cabang yang memiliki <code>Jenkinsfile</code>. Dengan webhook, setiap <code>git push</code> langsung memicu build tanpa jadwal pengecekan.</p><h4>Aturan Cabang yang Dipakai</h4><table><thead><tr><th>Cabang</th><th>Yang Berjalan</th><th>Tujuan</th></tr></thead><tbody><tr><td><code>feature/*</code></td><td>Uji saja</td><td>Validasi cepat untuk perubahan kecil</td></tr><tr><td><code>develop</code></td><td>Uji</td><td>Integrasi antarfitur sebelum masuk rilis</td></tr><tr><td><code>main</code></td><td>Uji + build image + push registry</td><td>Satu-satunya jalur yang menghasilkan artefak rilis</td></tr><tr><td><code>v*</code> (tag)</td><td>Uji + build + tag versi</td><td>Penanda rilis resmi</td></tr></tbody></table><h4>Checklist Langkah</h4><ul><li>Buat job <i>Multibranch Pipeline</i> dan tunjuk repository yang sama.</li><li>Tambahkan branch source <i>GitHub</i>, lalu aktifkan <i>Discover branches</i>.</li><li>Pasang webhook GitHub: buka <i>Settings → Webhooks → Add webhook</i>, isi URL <code>http://&lt;host-jenkins&gt;/github-webhook/</code>, pilih event <i>Push</i> dan <i>Pull request</i>.</li><li>Buat cabang <code>develop</code> dan beberapa <code>feature/*</code>, lalu pastikan job turunan tercipta otomatis.</li><li>Uji aturan: push ke <code>feature/x</code> hanya menjalankan uji; push ke <code>main</code> sampai pada stage push registry.</li></ul>"
    },
    {
      type: 'example',
      title: 'Contoh 3: Jenkinsfile Proyek 2 — Aturan Cabang dengan when',
      lang: 'groovy',
      output: false,
      code: `// Jenkinsfile untuk Proyek 2 — aturan cabang pada Multibranch Pipeline
pipeline {
    agent any
    options { timestamps(); disableConcurrentBuilds() }
    environment {
        REGISTRY = 'localhost:5000'
        APP      = 'toko-online'
    }
    stages {
        stage('Ambil Kode') {
            steps { checkout scm }
        }
        stage('Uji') {
            when { anyOf { branch 'develop'; branch 'feature/*'; branch 'main' } }
            steps { sh 'npm ci && npm test' }
        }
        stage('Publikasi Image') {
            // Hanya cabang main yang boleh menghasilkan dan mendorong image
            when { branch 'main' }
            steps {
                script {
                    def tag = "build-\${env.BUILD_NUMBER}"
                    sh "podman build -t \${REGISTRY}/\${APP}:\${tag} ."
                    sh "podman push \${REGISTRY}/\${APP}:\${tag} --tls-verify=false"
                    sh "podman tag \${REGISTRY}/\${APP}:\${tag} \${REGISTRY}/\${APP}:latest"
                }
            }
        }
    }
    post {
        success { echo "Rilis \${env.JOB_NAME} #\${env.BUILD_NUMBER} selesai." }
        failure { echo 'Gagal — periksa log dan hasil uji pada halaman build.' }
    }
}`,
      explain: [
        'Direktif <code>when { branch ... }</code> membatasi stage pada cabang tertentu; nilai <code>BRANCH_NAME</code> terisi otomatis pada Multibranch Pipeline.',
        'Kombinasi <code>anyOf</code> memungkinkan satu aturan mencakup beberapa cabang sekaligus tanpa menulis stage berulang.',
        'Cabang <code>feature/*</code> hanya menjalankan uji, sehingga eksperimen developer tidak pernah menggeser image rilis di registry.',
        'Perhatikan bagian dalam <code>script { }</code>: di situ Groovy bebas dipakai untuk mendefinisikan variabel sebelum dipakai pada string perintah shell.'
      ]
    },
    {
      type: 'text',
      html: "<h3>Proyek 3 — GitOps Ujung ke Ujung</h3><p>Proyek terakhir mengubah peran Jenkins: ia tidak lagi menyentuh cluster, melainkan hanya menulis keinginan ke Git. Setelah uji dan build image selesai, Jenkins meng-commit perubahan tag image pada repository manifest, lalu <b>ArgoCD</b> yang berjalan di cluster menyinkronkan keadaan nyata dengan isi Git — persis pola GitOps pada materi Kubernetes di situs ini.</p><h4>Checklist Langkah</h4><ul><li>Buat cluster lokal: <code>minikube start --driver=podman</code> atau <code>kind create cluster</code>.</li><li>Buat repository manifest terpisah (misalnya <code>manifest-toko</code>) berisi <code>deployment.yaml</code> dan <code>service.yaml</code>.</li><li>Pasang ArgoCD di cluster lalu daftarkan aplikasi menuju repository manifest.</li><li>Tambahkan SSH key deploy sebagai Jenkins Credential dan pakai pada stage pembaruan manifest.</li><li>Jalankan build pada <code>main</code>, lalu amati commit baru muncul di repository manifest dan pod di cluster terganti otomatis.</li></ul>"
    },
    {
      type: 'example',
      title: 'Contoh 4: Jenkinsfile Proyek 3 — Uji, Rilis, lalu Commit Manifest',
      lang: 'groovy',
      output: false,
      code: `// Jenkinsfile untuk Proyek 3 — Jenkins menulis ke Git, ArgoCD yang menyerang cluster
pipeline {
    agent any
    options { timestamps() }
    environment {
        APP           = 'toko-online'
        MANIFEST_REPO = 'git@github.com:tim-dev/manifest-toko.git'
    }
    stages {
        stage('Uji') {
            steps { sh 'npm ci && npm test' }
        }
        stage('Build & Dorong Image') {
            steps {
                script {
                    def tag = "build-\${env.BUILD_NUMBER}"
                    sh "podman build -t localhost:5000/\${APP}:\${tag} ."
                    sh "podman push localhost:5000/\${APP}:\${tag} --tls-verify=false"
                }
            }
        }
        stage('Perbarui Manifest') {
            steps {
                // ssh-key-deploy adalah Jenkins Credential bertipe SSH Username with private key
                sshagent(['ssh-key-deploy']) {
                    sh '''
                        git clone --depth 1 "$MANIFEST_REPO" manifest-toko
                        cd manifest-toko
                        sed -i "s|image: .*|image: localhost:5000/toko-online:build-\${BUILD_NUMBER}|" deployment.yaml
                        git config user.email "jenkins@belajarkoding.local"
                        git config user.name "Jenkins"
                        git commit -am "rilis build-\${BUILD_NUMBER}"
                        git push origin main
                    '''
                }
            }
        }
    }
    post {
        success { echo "Manifest diperbarui — ArgoCD akan menyinkronkan \${env.JOB_NAME} #\${env.BUILD_NUMBER}." }
        failure { echo 'Gagal — periksa kredensial SSH dan isi repository manifest.' }
    }
}`,
      explain: [
        'Perhatikan pola tugas yang terbagi: Jenkins bertanggung jawab menguji dan menerbitkan artefak, sedangkan penyerahan ke cluster diserahkan pada ArgoCD.',
        'Blok string tiga petik (<code>\'\'\'</code>) dijalankan oleh shell apa adanya, sehingga <code>${BUILD_NUMBER}</code> diselesaikan shell berdasarkan variabel lingkungan build.',
        '<code>sed -i</code> menggantian baris <code>image:</code> pada <code>deployment.yaml</code> — perubahan kecil ini menjadi sumber kebenaran yang disinkronkan ArgoCD.',
        'Bila kamu memakai Kind, tambahkan konfigurasi registry in-cluster agar image <code>localhost:5000</code> bisa ditarik node cluster.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh 5: Mendaftarkan dan Mensinkronkan Aplikasi (ArgoCD / kubectl)',
      lang: 'bash',
      output: false,
      code: `# Pastikan cluster lokal sudah berjalan
kubectl get nodes

# Pasang ArgoCD (manifest resmi, gratis)
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Daftarkan aplikasi menuju repository manifest
argocd app create toko-online \\
  --repo git@github.com:tim-dev/manifest-toko.git \\
  --path . \\
  --dest-server https://kubernetes.default.svc \\
  --dest-namespace default

# Sinkronkan lalu pantau kesehatannya
argocd app sync toko-online
argocd app wait toko-online --health

# Alternatif tanpa ArgoCD — terapkan langsung setelah commit dari Jenkins masuk
git -C manifest-toko pull origin main
kubectl apply -f manifest-toko/deployment.yaml
kubectl rollout status deployment/toko-online`,
      explain: [
        'ArgoCD memantau repository manifest secara berkala; begitu commit dari Jenkins muncul, perbedaan dengan cluster terlihat di UI lalu disinkronkan.',
        'Perintah <code>argocd app wait --health</code> menunggu sampai pod benar-benar sehat, bukan sekadar objek berhasil dibuat.',
        'Jalur <code>kubectl apply</code> adalah alternatif sederhana bila ArgoCD dirasa terlalu berat untuk latihan; pola deklaratifnya tetap sama.',
        'Setelah proyek selesai, bersihkan resource agar hemat disk: <code>argocd app delete toko-online</code>, <code>kubectl delete namespace argocd</code>, lalu <code>minikube delete</code> bila sudah tidak dipakai.'
      ]
    },
    {
      type: 'text',
      html: "<h3>Troubleshooting Umum</h3><p>Enam masalah berikut menampung sebagian besar kebingungan yang muncul selama praktik. Gunakan sebagai daftar periksa pertama sebelum mencari lebih jauh:</p><table><thead><tr><th>Masalah</th><th>Gejala</th><th>Solusi</th></tr></thead><tbody><tr><td>SSH ditolak</td><td>Log build: <code>Permission denied (publickey)</code></td><td>Pastikan public key ada di <code>~/.ssh/authorized_keys</code> akun remote, permission berkas <code>authorized_keys</code> dan folder <code>.ssh</code> masing-masing 600 dan 700, serta Jenkins memakai credential yang tepat.</td></tr><tr><td>Workspace kotor</td><td>Build gagal aneh setelah rename cabang atau mengganti Node version</td><td>Aktifkan <i>Wipe out repository and force a fresh clone</i>, atau tambahkan <code>deleteDir()</code> pada blok <code>post { always }</code>.</td></tr><tr><td>Plugin belum terpasang</td><td><code>No such DSL method 'junit'</code> atau <code>no method found for slackSend</code></td><td>Buka Manage Jenkins → Plugins, pasang plugin yang sesuai, lalu restart Jenkins sebelum menjalankan ulang build.</td></tr><tr><td>Webhook tidak terpicu</td><td>Push ke GitHub tidak menjalankan build sama sekali</td><td>Periksa URL webhook (<code>/github-webhook/</code>), status pengiriman di halaman webhook GitHub, dan pastikan job memakai <i>GitHub hook trigger for GITScm polling</i>.</td></tr><tr><td>Disk penuh</td><td><code>No space left on device</code> atau build selalu gagal di tahap checkout</td><td>Bersihkan workspace lama, hapus <code>JENKINS_HOME/caches</code>, atur retensi build (max # of builds to keep), dan pertimbangkan memindahkan JENKINS_HOME ke disk besar.</td></tr><tr><td>Agent offline</td><td>Build antre dengan pesan <i>waiting for next available executor</i></td><td>Buka Manage Jenkins → Nodes, periksa status agent, uji koneksi jaringan dan port SSH, lalu jalankan ulang layanan agent pada mesin tersebut.</td></tr></tbody></table>"
    },
    {
      type: 'text',
      html: "<h3>Langkah Lanjutan Setelah Lulus Tiga Proyek</h3><p>Ketiga proyek di atas menempatkanmu pada posisi yang baik untuk melanjutkan. Beberapa arah yang bisa dipilih:</p><ul><li><b>Sertifikasi</b> — ikuti sertifikasi Jenkins yang tersedia (misalnya <i>Certified Jenkins Engineer</i> yang diselenggarakan CloudBees); periksa halaman resminya untuk jadwal dan silabus terkini sebelum mendaftar.</li><li><b>Kontribusi plugin</b> — mulai dari yang ringan: laporkan bug pada plugin yang kamu pakai, perbaiki dokumentasinya, lalu naik ke kode sumber plugin kecil. Ini cara tercepat memahami ekosistem plugin.</li><li><b>Jenkins on Kubernetes</b> — jalankan Jenkins sendiri sebagai pod di cluster lokal, lalu manfaatkan <i>dynamic agent</i> yang lahir sebagai pod per build; materi Kubernetes di situs ini menjadi bekal yang pas.</li><li><b>Shared Library dan JCasC</b> — terapkan materi Bab 13 dan Bab 14 pada proyek ini: bungkus pipeline menjadi library, lalu rekonstruksi instance memakai berkas <code>jenkins.yaml</code>.</li><li><b>Manajemen artefak sungguhan</b> — pasang Nexus OSS atau registry lokal yang lebih tertata, lalu atur retensi artefak sesuai kebijakan tim.</li></ul><p>Yang terpenting: pertahankan ketiga proyek ini sebagai laboratorium hidup. Setiap kali mempelajari konsep baru, kembalikan ke sini dan terapkan — itulah cara paling andal memastikan ilmu benar-benar melekat.</p>"
    },
    {
      type: 'tip',
      title: 'Ulangi dari Nol di Mesin Bersih',
      text: 'Setelah ketiga proyek berjalan, luangkan satu sesi untuk mengulanginya dari awal di instalasi Jenkins yang baru. Sebagian besar pelajaran paling berharga justru muncul ketika penyiapan yang biasanya dilewati harus dikerjakan ulang — kredensial, plugin, webhook, dan registry. Bila berhasil dalam waktu jauh lebih singkat, itu tanda penguasaanmu sudah nyata.'
    },
    {
      type: 'warn',
      title: 'Perhatian Keamanan pada Seluruh Proyek',
      text: 'Registry lokal dengan <code>registry:2</code> memang tidak memiliki autentikasi — jalankan hanya di komputer pribadi, jangan dibuka ke jaringan publik. Kunci SSH yang dipakai Jenkins sebaiknya khusus untuk otomatisasi (bukan kunci pribadi harianmu), disimpan sebagai Jenkins Credential, dan dibatasi aksesnya hanya pada repository yang dibutuhkan. Jangan pernah menempelkan token atau password langsung ke dalam Jenkinsfile.'
    },
    {
      type: 'vocab',
      items: [
        ['Multibranch Pipeline', 'Tipe job yang memindai seluruh cabang repository lalu menjalankan Jenkinsfile dari masing-masing cabang.'],
        ['when', 'Direktif deklaratif yang membatasi kapan sebuah stage dijalankan, misalnya hanya pada cabang main.'],
        ['Webhook', 'Pemicu HTTP otomatis dari Git hosting menuju Jenkins setiap kali ada push atau pull request.'],
        ['Registry lokal', 'Container registry yang dijalankan sendiri di komputer, misalnya podman run -d -p 5000:5000 registry:2.'],
        ['Manifest', 'Berkas YAML yang mendeklarasikan objek Kubernetes seperti Deployment dan Service.'],
        ['ArgoCD', 'Aplikasi GitOps yang menyinkronkan isi repository manifest dengan keadaan cluster Kubernetes.'],
        ['Workspace', 'Folder sementara di agent tempat Jenkins meng-clone repository dan menjalankan build.'],
        ['Troubleshooting', 'Proses mendiagnosis gejala kegagalan lalu memilih solusi berdasarkan pola yang umum terjadi.']
      ]
    }
  ],
  recap: [
    'Tiga proyek dirancang menanjak dan sepenuhnya gratis: pipeline web app (Proyek 1), Multibranch dengan aturan cabang dan webhook (Proyek 2), serta GitOps ujung ke ujung (Proyek 3).',
    'Proyek 1 menjalankan unit test, membangun image Podman, dan memberi tag rilis; Proyek 2 membatasi image rilis hanya untuk cabang main lewat when { branch }.',
    'Proyek 3 membagi peran: Jenkins menguji, menerbitkan image, lalu meng-commit manifest; ArgoCD menyinkronkan perubahan itu ke cluster lokal Minikube atau Kind.',
    'Saat macet, periksa tabel troubleshooting — SSH ditolak, workspace kotor, plugin belum terpasang, webhook tak terpicu, disk penuh, dan agent offline — sebelum mencari penyebab lebih jauh.'
  ]
});
