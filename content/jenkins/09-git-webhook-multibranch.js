/* ============================================================
   Pelajaran Jenkins — Bab 9: Integrasi Git, Webhook & Multibranch Pipeline
   ============================================================ */
'use strict';

window.JENKINS_LESSONS = window.JENKINS_LESSONS || [];

window.JENKINS_LESSONS.push({
  id: 'git-webhook-multibranch',
  title: 'Integrasi Git, Webhook & Multibranch Pipeline',
  chapter: 'Integrasi SCM',
  duration: '8–10 menit',
  intro: [
    'Setelah Jenkinsfile selesai ditulis, pekerjaan berikutnya adalah memastikan build berjalan sendiri: tidak ada lagi tombol Build Now yang ditekan manual setiap kali ada commit baru. Masalahnya, pada awalnya Jenkins sama sekali tidak tahu bahwa repository telah berubah.',
    '<b>Integrasi SCM</b> (Source Code Management) menghubungkan Jenkins dengan hosting Git seperti GitHub atau GitLab — keduanya menyediakan paket gratis untuk penggunaan pribadi dan tim kecil — melalui dua jalur sekaligus: akses baca memakai kredensial (SSH key atau Personal Access Token) dan pemberitahuan perubahan memakai <b>webhook</b>.',
    'Bab ini membahas cara menghubungkan Jenkins ke GitHub dan GitLab, cara memasang sekaligus memverifikasi webhook, alternatif Poll SCM, serta <b>Multibranch Pipeline</b> yang menemukan dan menjalankan Jenkinsfile di setiap cabang secara otomatis.'
  ],
  objectives: [
    'Menghubungkan Jenkins ke GitHub/GitLab lewat SSH key maupun Personal Access Token',
    'Menyimpan kredensial repository dengan aman di Credentials Manager',
    'Memasang dan memverifikasi webhook, termasuk alternatif Poll SCM',
    'Membuat Multibranch Pipeline yang menemukan Jenkinsfile di banyak cabang'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Hubungan Dua Arah antara Jenkins dan Git</h3><p>Sebuah pipeline yang rapi membutuhkan dua arah komunikasi yang berbeda. <b>Arus pertama</b>: Jenkins harus bisa mengambil kode dari repository, artinya Jenkins perlu kredensial untuk membaca repo. <b>Arus kedua</b>: repository harus memberi tahu Jenkins begitu ada commit baru, supaya build tidak menunggu kamu menekan tombol <i>Build Now</i>.</p><ul><li><b>Jenkins menuju Git</b> — proses clone/pull kode memakai URL repository plus kredensial, misalnya <code>git@github.com:organisasi/proyek.git</code>.</li><li><b>Git menuju Jenkins</b> — pemberitahuan perubahan memakai <b>webhook</b>; alternatifnya Jenkins yang bertanya berkala melalui <i>Poll SCM</i>.</li></ul><p>Kedua arus dibangun hanya sekali, lalu seluruh proyek — termasuk cabang-cabang yang baru dibuat — langsung menikmatinya. Karena GitHub dan GitLab sama-sama punya paket gratis, seluruh latihan di bab ini bisa dijalankan tanpa biaya, bahkan dari laptop biasa.</p>'
    },
    {
      type: 'text',
      html: '<h3>Dua Cara Menghubungkan Jenkins ke GitHub/GitLab</h3><p><b>Cara 1: kunci SSH.</b> Kamu membuat sepasang kunci di mesin Jenkins, lalu menempelkan kunci publiknya ke repository (GitHub: <i>Settings → Deploy keys</i>; GitLab: <i>Settings → Repository → Deploy keys</i>). URL remote memakai pola <code>git@github.com:organisasi/proyek.git</code>. Kelebihannya: tidak ada kata sandi tersimpan dalam teks, akses bisa dibatasi per repository, dan kunci mudah diputar ulang.</p><p><b>Cara 2: HTTPS plus Personal Access Token (PAT).</b> Kamu membuat token di pengaturan akun (GitHub: <i>Settings → Developer settings → Personal access tokens</i>; GitLab: <i>Preferences → Access tokens</i>), lalu memakainya sebagai kata sandi saat Jenkins mengakses URL <code>https://github.com/organisasi/proyek.git</code>. PAT adalah pilihan praktis ketika jaringan memblokir port 22 atau ketika akses harus melewati proxy perusahaan.</p><p>Kedua cara disimpan di Jenkins melalui <b>Manage Jenkins → Credentials</b> lalu dipilih pada konfigurasi job, sehingga rahasia tidak pernah tertulis di dalam <code>Jenkinsfile</code> maupun di repository.</p>'
    },
    {
      type: 'example',
      title: 'Membuat Kunci SSH dan Menguji Koneksi ke GitHub',
      lang: 'bash',
      output: false,
      code: `# 1. Buat pasangan kunci ed25519 khusus CI (frasa sandi dikosongkan agar tidak diminta saat build)
ssh-keygen -t ed25519 -C "jenkins-ci@belajarkoding" -f ~/.ssh/jenkins_ed25519 -N ""

# 2. Salin seluruh isi kunci publik, lalu tempel di GitHub: Settings -> Deploy keys
cat ~/.ssh/jenkins_ed25519.pub

# 3. Uji autentikasi tanpa membuka sesi shell
ssh -T git@github.com

# 4. Uji clone memakai URL SSH
git clone git@github.com:nama-organisasi/proyek-web.git`,
      explain: [
        'Perintah ssh-keygen menghasilkan dua berkas: kunci privat (<code>jenkins_ed25519</code>) yang disimpan di Jenkins sebagai kredensial berkind <b>SSH Username with private key</b>, dan kunci publik (<code>.pub</code>) yang ditempel ke repository.',
        'Frasa sandi dikosongkan dengan <code>-N ""</code> agar proses build tidak pernah berhenti menunggu input; ganti menjadi frasa sandi bila kunci akan dipakai manusia, lalu simpan frasanya di Jenkins.',
        'Perintah <code>ssh -T git@github.com</code> mengembalikan pesan sukses berupa sapaan nama pengguna atau nama deploy key — tanda autentikasi sudah diterima tanpa perlu membuka sesi masuk.',
        'Untuk GitLab, prinsipnya identik: ganti host menjadi <code>git@gitlab.com:organisasi/proyek.git</code> dan pasang kunci publik pada menu Deploy keys repository.'
      ]
    },
    {
      type: 'example',
      title: 'Menyimpan Kredensial Repository di Jenkins',
      lang: 'text',
      output: false,
      code: `GITHUB + SSH KEY (disarankan)
1. Manage Jenkins -> Credentials -> System -> Global credentials -> Add Credentials
2. Kind: SSH Username with private key
3. ID: github-ssh-deploy  (ID inilah yang dipakai di pipeline, misal pada sshagent)
4. Username: git
5. Private Key: Enter directly -> tempel isi berkas ~/.ssh/jenkins_ed25519

GITHUB + PERSONAL ACCESS TOKEN
1. Tambah Credentials baru, Kind: Username with password
2. Username: nama pengguna GitHub
3. Password: tempel token (scope minimal: repo dan read:org)
4. URL remote pada job: https://github.com/organisasi/proyek.git

GITLAB + PERSONAL ACCESS TOKEN
1. Kind: Username with password
2. Username: nama pengguna GitLab
3. Password: token dengan scope read_api dan read_repository
4. URL remote pada job: https://gitlab.com/organisasi/proyek.git`,
      explain: [
        'Jenis kredensial dipilih sesuai mekanisme autentikasinya: kunci SSH untuk metode SSH, sedangkan Username with password untuk HTTPS di mana token bertindak sebagai kata sandi.',
        'Field <b>ID</b> bersifat wajib bila kredensial akan dipakai dari pipeline, karena ID itulah yang dirujuk oleh langkah seperti <code>sshagent([\'github-ssh-deploy\'])</code>.',
        'Token dibuat dengan hak akses seperlunya saja (scope <code>repo</code> untuk GitHub, <code>read_api</code> + <code>read_repository</code> untuk GitLab) agar dampaknya kecil bila bocor.',
        'Simpan kredensial di level <b>System (global)</b> bila dipakai banyak job, atau di dalam folder domain tertentu bila hanya boleh dipakai satu proyek.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Webhook: Pemicu Instan Ketika Ada Push</h3><p><b>Webhook</b> adalah callback HTTP: begitu ada push atau pull request, hosting Git mengirim request POST ke URL Jenkins yang telah didaftarkan. Jenkins langsung memasukkan build ke antrian, dengan latensi hitungan detik tanpa menunggu jadwal apa pun.</p><ul><li><b>GitHub</b> (paket gratis): <code>http://&lt;host&gt;:8080/github-webhook/</code> — disediakan oleh <i>GitHub plugin</i>.</li><li><b>GitLab</b> (paket gratis): <code>http://&lt;host&gt;:8080/project/&lt;token&gt;</code> — disediakan oleh <i>GitLab plugin</i>; bagian token ditentukan sendiri saat mengonfigurasi trigger pada job.</li></ul><p>Event yang dikirim sebaiknya dibatasi sejak awal: <code>push</code> untuk build cabang biasa, dan <code>pull request</code> untuk validasi PR yang dibahas pada pelajaran berikutnya. Karena Jenkins lokal umumnya berada di balik NAT, pastikan URL webhook benar-benar bisa dijangkau oleh Git hosting — untuk latihan di rumah cukup pakai IP LAN, dan bila Jenkins berada di komputer yang tidak punya akses publik gunakan SSH tunnel atau layanan tunnel semacam ngrok.</p>'
    },
    {
      type: 'example',
      title: 'Langkah Memasang Webhook di GitHub dan GitLab',
      lang: 'text',
      output: false,
      code: `GITHUB (paket gratis)
1. Buka repository -> Settings -> Webhooks -> Add webhook
2. Payload URL: http://192.168.1.10:8080/github-webhook/
3. Content type: application/json
4. Pilih event: "Just the push event" (atau centang "Pull requests")
5. Pastikan centang Active menyala, lalu klik Add webhook

GITLAB (paket gratis)
1. Buka repository -> Settings -> Webhooks
2. URL: http://192.168.1.10:8080/project/token-pilihanmu
3. Secret token: isi string acak untuk verifikasi payload
4. Centang Push events dan Merge request events
5. Klik Add webhook, lalu tombol Test -> Push events`,
      explain: [
        'Payload URL harus ditulis persis seperti contoh, termasuk garis miring terakhir pada endpoint GitHub <code>/github-webhook/</code> — satu karakter salah membuat pengiriman berstatus 404.',
        'Pada GitLab, bagian akhir URL <code>/project/&lt;token&gt;</code> adalah token rahasia yang kamu tentukan sendiri di konfigurasi trigger job, sehingga pihak yang tidak mengetahuinya tidak dapat memicu build.',
        'Bila Jenkins berjalan dalam container Podman, port 8080 harus dipublish (<code>-p 8080:8080</code>) dan firewall host harus mengizinkan trafik masuk dari mesin yang mengirim webhook.',
        'Setelah tersimpan, buka tab <b>Recent Deliveries</b> pada webhook untuk memastikan pengiriman pertama sudah diterima Jenkins.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Memverifikasi Webhook: Deliveries dan Poll SCM</h3><p>Kegagalan webhook sering tidak terasa sampai akhirnya build tidak pernah jalan. Untuk itu GitHub menyediakan <b>Recent Deliveries</b> (tab Webhooks → pilih payload → tab Request dan Response): status <code>200</code> berarti Jenkins menerima event, <code>404</code> berarti endpoint salah, sedangkan timeout berarti URL tidak terjangkau. GitLab menampilkan ikon centang pada daftar webhook beserta detail respons dan durasi pengirimannya.</p><p><b>Poll SCM</b> adalah alternatif yang berjalan di sisi Jenkins: secara berkala Jenkins membaca commit terakhir di repository dan menjalankan build bila menemukan perubahan. Jadwal khasnya adalah <code>H/5 * * * *</code>, artinya diperiksa kira-kira setiap 5 menit. Huruf <code>H</code> (hash) menyebar beban sehingga banyak job tidak serentak menanyakan hal yang sama pada menit ke-0.</p><ul><li><b>Pakai webhook</b> sebagai jalur utama: cepat, hemat sumber daya, dan tidak bergantung pada akses jaringan dari Jenkins menuju internet.</li><li><b>Pakai Poll SCM</b> bila Jenkins tidak bisa dijangkau dari luar (berada di balik NAT ketat atau VPN perusahaan), atau sekadar sebagai jaring pengaman bila webhook putus.</li></ul>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 350" width="760" role="img" aria-label="Alur git push memicu webhook ke Jenkins, Jenkins memindai cabang lalu menjalankan Jenkinsfile, dan hasil build dikirim balik sebagai status ke hosting Git">
        <rect x="24" y="56" width="200" height="150" rx="10" class="u-box"/>
        <text x="124" y="80" class="u-title" text-anchor="middle">GitHub / GitLab</text>
        <line x1="38" y1="90" x2="210" y2="90" class="u-line"/>
        <rect x="38" y="100" width="172" height="30" rx="6" class="u-hd"/>
        <text x="124" y="119" class="u-lbl" text-anchor="middle">git push (main, dev)</text>
        <rect x="38" y="140" width="172" height="30" rx="6" class="u-box"/>
        <text x="124" y="159" class="u-lbl" text-anchor="middle">event: push, pull_request</text>
        <text x="124" y="196" class="u-lbl" text-anchor="middle">endpoint /github-webhook/</text>
        <line x1="228" y1="131" x2="286" y2="131" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="257" y="118" class="u-lbl" text-anchor="middle">1. push</text>
        <text x="257" y="152" class="u-lbl" text-anchor="middle">webhook</text>
        <rect x="290" y="56" width="190" height="150" rx="10" class="u-box"/>
        <text x="385" y="80" class="u-title" text-anchor="middle">Jenkins Controller</text>
        <line x1="304" y1="90" x2="466" y2="90" class="u-line"/>
        <rect x="304" y="100" width="162" height="30" rx="6" class="u-hd"/>
        <text x="385" y="119" class="u-lbl" text-anchor="middle">Branch indexing</text>
        <rect x="304" y="140" width="162" height="30" rx="6" class="u-box"/>
        <text x="385" y="159" class="u-lbl" text-anchor="middle">checkout tiap cabang</text>
        <text x="385" y="196" class="u-lbl" text-anchor="middle">jalankan Jenkinsfile</text>
        <line x1="484" y1="131" x2="542" y2="131" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="513" y="118" class="u-lbl" text-anchor="middle">2. hasil</text>
        <text x="513" y="152" class="u-lbl" text-anchor="middle">status</text>
        <rect x="546" y="56" width="190" height="150" rx="10" class="u-box"/>
        <text x="641" y="80" class="u-title" text-anchor="middle">Balasan ke Hosting Git</text>
        <line x1="560" y1="90" x2="722" y2="90" class="u-line"/>
        <rect x="560" y="100" width="162" height="30" rx="6" class="u-hd"/>
        <text x="641" y="119" class="u-lbl" text-anchor="middle">commit status</text>
        <rect x="560" y="140" width="162" height="30" rx="6" class="u-box"/>
        <text x="641" y="159" class="u-lbl" text-anchor="middle">badge dan komentar</text>
        <text x="641" y="196" class="u-lbl" text-anchor="middle">pending lalu sukses/gagal</text>
        <rect x="24" y="250" width="200" height="64" rx="10" class="u-box"/>
        <text x="124" y="276" class="u-title" text-anchor="middle">Poll SCM (cadangan)</text>
        <text x="124" y="298" class="u-lbl" text-anchor="middle">H/5 * * * *</text>
        <line x1="228" y1="282" x2="286" y2="282" class="u-dash" marker-end="url(#u-arrow)"/>
        <text x="257" y="272" class="u-lbl" text-anchor="middle">poll</text>
        <rect x="290" y="250" width="190" height="64" rx="10" class="u-hd"/>
        <text x="385" y="276" class="u-title" text-anchor="middle">Executor / Agent</text>
        <text x="385" y="298" class="u-lbl" text-anchor="middle">menjalankan build dan test</text>
        <line x1="385" y1="210" x2="385" y2="246" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="395" y="236" class="u-lbl">4. eksekusi</text>
        <text x="380" y="342" class="u-lbl" text-anchor="middle">Webhook memicu build dalam hitungan detik; Poll SCM dan scan cabang menjadi cadangan</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 9.1</b> — Alur integrasi: git push memicu webhook, Jenkins memindai cabang lalu menjalankan Jenkinsfile, dan hasilnya dikirim balik ke hosting Git</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Multibranch Pipeline: Satu Jenkinsfile, Banyak Cabang</h3><p><b>Multibranch Pipeline</b> adalah tipe job yang memperlakukan setiap cabang di repository sebagai job tersendiri. Pada saat item dibuat, Jenkins menjalankan <b>Scan Repository on Git</b>: membaca daftar cabang, memeriksa cabang mana yang berisi <code>Jenkinsfile</code>, lalu membuat child job untuk cabang-cabang tersebut. Pemindaian ini juga yang mendeteksi cabang atau pull request baru; sedangkan pemicu untuk commit pada cabang yang sudah ada datang dari webhook atau Poll SCM.</p><p>Perbandingan singkat dengan tipe job lain:</p><ul><li><b>Pipeline biasa</b> — satu job untuk satu cabang yang kamu isi sendiri pada konfigurasi. Cocok bila hanya <code>main</code> yang boleh diproduksi.</li><li><b>Multibranch</b> — cabang baru otomatis terdeteksi, dan logika build ikut bercabang lewat <code>when { branch \'main\' }</code> atau variabel <code>env.BRANCH_NAME</code>. Cocok untuk tim yang bekerja di banyak cabang fitur.</li><li><b>Organization Folder</b> — level di atasnya: Jenkins memindai seluruh repository dalam satu organisasi GitHub/GitLab, lalu membuat Multibranch untuk setiap repository yang memiliki Jenkinsfile. Cocok ketika jumlah repository sudah banyak.</li></ul><p>Pada bagian <i>Branch Source</i> kamu memilih repository beserta kredensialnya, lalu menambahkan <i>Behaviours</i> seperti Filter by name, Discover branches, dan Discover pull requests — dari sinilah Jenkins menentukan cabang mana yang layak dipantau.</p>'
    },
    {
      type: 'example',
      title: 'Langkah Membuat Item Multibranch Pipeline',
      lang: 'text',
      output: false,
      code: `1. New Item -> Multibranch Pipeline -> beri nama, misal proyek-web -> OK
2. Branch Source -> Add source -> GitHub (atau GitLab)
3. Pilih kredensial dari langkah sebelumnya, lalu isi URL repository
4. Behaviours (klik Add property):
   - Filter by name (regex): ^(main|develop|fix-.*)$   (opsional, membatasi cabang)
   - Discover branches: All branches
   - Discover pull requests from origins: By Merging the pull request with the target branch
5. Build Configuration -> Mode: by Jenkinsfile -> Script Path: Jenkinsfile
6. Scan Repository on Git Interval: 1 menit -> Save
7. Klik "Scan Repository Log" untuk melihat cabang dan PR yang ditemukan`,
      explain: [
        'Field Script Path menunjuk berkas konfigurasi pipeline; bila namanya bukan <code>Jenkinsfile</code>, misal <code>ci/Jenkins.groovy</code>, tuliskan path lengkapnya di sini.',
        'Filter by name berguna agar Jenkins tidak membuat puluhan job dari cabang eksperimen; kamu tetap bisa menambahkannya nanti dengan memperluas regex.',
        'Interval scan cukup 1 sampai 5 menit karena tugasnya hanya menemukan cabang dan PR baru, bukan mengecek commit.',
        'Jika memilih GitLab, tambahkan dulu trigger <b>Scan Repository on Git</b> agar endpoint webhook GitLab dibuatkan oleh Jenkins.'
      ]
    },
    {
      type: 'example',
      title: 'Jenkinsfile untuk Multibranch Pipeline',
      lang: 'groovy',
      output: false,
      code: `pipeline {
  agent any
  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }
  triggers {
    pollSCM('H/5 * * * *')      // jaring pengaman bila webhook tidak aktif
  }
  stages {
    stage('Ambil Kode') {
      steps { checkout scm }
    }
    stage('Instal Dependensi') {
      steps { sh 'npm ci' }
    }
    stage('Uji') {
      steps { sh 'npm test -- --ci --reporters=jest-junit' }
    }
    stage('Rilis Container') {
      when { branch 'main' }     // hanya branch utama yang membangun image
      steps {
        sh 'podman build -t app:\${BUILD_NUMBER} .'
        sh 'podman tag app:\${BUILD_NUMBER} app:latest'
      }
    }
  }
  post {
    always  { junit allowEmptyResults: true, testResults: 'reports/*.xml' }
    success  { echo "Build \${env.BRANCH_NAME} sukses nomor \${env.BUILD_NUMBER}" }
    failure  { echo "Build \${env.BRANCH_NAME} gagal, periksa \${env.BUILD_URL}" }
  }
}`,
      explain: [
        'Pada Multibranch, <code>checkout scm</code> tidak perlu URL apa pun: Jenkins sudah tahu repository dan cabang yang harus diambil dari konfigurasi Branch Source.',
        'Variabel seperti <code>env.BRANCH_NAME</code>, <code>env.BUILD_URL</code>, dan <code>env.CHANGE_ID</code> tersedia otomatis sehingga satu Jenkinsfile bisa melayani banyak cabang.',
        'Direktif <code>when { branch \'main\' }</code> membatasi tahap rilis hanya pada branch utama, sedangkan cabang fitur tetap berhenti di tahap uji.',
        'Blok <code>triggers</code> dengan <code>pollSCM</code> dipasang sebagai cadangan; bila webhook sudah sehat, kamu boleh memakainya saja dan menghapus trigger ini.'
      ]
    },
    {
      type: 'tip',
      title: 'Manfaatkan Scan dan Poll seperlunya',
      text: 'Interval <b>Scan Repository on Git</b> cukup 1–5 menit karena tugasnya hanya menemukan cabang dan pull request baru. Untuk pemicu commit tetap andalkan webhook; bila terpaksa memakai Poll SCM, gunakan <code>H/5 * * * *</code> atau lebih longgar lagi — makin pendek interval, makin sering Jenkins menghubungi hosting Git dan makin mudah kena batas permintaan (rate limit).'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Jangan pernah menaruh kunci privat, token, atau kata sandi di dalam <code>Jenkinsfile</code> maupun di repository — semuanya disimpan lewat <b>Credentials</b>. URL webhook GitLab juga mengandung token rahasia sehingga tidak boleh dibagikan sembarangan. Terakhir, pastikan pengiriman webhook benar-benar terverifikasi lewat Recent Deliveries sebelum kamu mengandalkannya; memasang webhook sekaligus Poll SCM adalah kombinasi paling aman.'
    },
    {
      type: 'vocab',
      items: [
        ['SCM (Source Code Management)', 'Sistem pengelolaan versi kode seperti Git yang menjadi sumber kebenaran bagi pipeline.'],
        ['Kredensial Jenkins', 'Penyimpanan rahasia bawaan Jenkins pada menu Manage Jenkins → Credentials untuk kunci, token, dan kata sandi.'],
        ['Personal Access Token (PAT)', 'Token berbasis hak akses yang dibuat di akun GitHub/GitLab dan dipakai sebagai kata sandi koneksi HTTPS.'],
        ['Deploy key', 'Pasangan kunci SSH yang dipasang pada satu repository saja dan dipakai oleh akun otomatis seperti Jenkins.'],
        ['Webhook', 'Panggilan HTTP otomatis dari hosting Git ke Jenkins setiap kali terjadi push atau pull request.'],
        ['Poll SCM', 'Pemeriksaan berkala dari Jenkins ke repository untuk mendeteksi commit baru sebagai cadangan webhook.'],
        ['Branch indexing', 'Proses Multibranch Pipeline memindai daftar cabang dan pull request untuk membuat child job.'],
        ['Multibranch Pipeline', 'Tipe job yang mengelola satu child job per cabang yang memiliki Jenkinsfile.'],
        ['Organization Folder', 'Item tingkat atas yang memindai seluruh repository satu organisasi lalu membuat Multibranch di dalamnya.']
      ]
    }
  ],
  recap: [
    'Jenkins mengakses repository lewat SSH key atau HTTPS plus Personal Access Token, dan keduanya disimpan sebagai kredensial, bukan di dalam Jenkinsfile.',
    'Webhook memicu build seketika lewat endpoint <code>/github-webhook/</code> atau <code>/project/&lt;token&gt;</code>, sedangkan Poll SCM <code>H/5 * * * *</code> menjadi alternatif bila webhook tidak tersedia.',
    'Multibranch Pipeline memindai repository (Scan Repository on Git) lalu membuat job untuk setiap cabang berisi Jenkinsfile; Organization Folder memakainya untuk banyak repository.',
    'Selalu verifikasi pengiriman lewat Recent Deliveries atau log webhook GitLab sebelum mengandalkannya, dan simpan seluruh rahasia pada Credentials.'
  ]
});
