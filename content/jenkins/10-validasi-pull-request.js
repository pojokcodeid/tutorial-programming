/* ============================================================
   Pelajaran Jenkins — Bab 10: Validasi Pull Request & Merge Gate
   ============================================================ */
'use strict';

window.JENKINS_LESSONS = window.JENKINS_LESSONS || [];

window.JENKINS_LESSONS.push({
  id: 'validasi-pull-request',
  title: 'Validasi Pull Request & Merge Gate',
  chapter: 'Integrasi SCM',
  duration: '8–10 menit',
  intro: [
    'Seorang rekan mengirim <b>pull request (PR)</b> berisi dua ratus baris perubahan. Reviewer harus membacanya, dan seseorang harus memastikan kode itu masih lolos lint dan unit test sebelum disatukan ke <code>main</code>. Jika pemeriksaan itu dilakukan manual, hasilnya lambat dan tidak konsisten.',
    'Jenkins bisa mengambil alih seluruh pemeriksaan tersebut: begitu PR dibuka atau diperbarui, build dijalankan pada <b>hasil merge sementara</b> antara cabang PR dan cabang target, lalu hasilnya dikirim balik ke GitHub atau GitLab sebagai <b>status check</b> yang tampil sebagai centang merah atau hijau di halaman PR.',
    'Bab ini membahas pemicu PR pada GitHub Branch Source dan plugin GitLab Merge Request, cara mengirim status serta komentar hasil build, pengaturan <b>merge gate</b> lewat branch protection, serta aturan keamanan ketika PR berasal dari fork.'
  ],
  objectives: [
    'Memicu build Jenkins ketika pull request dibuka atau diperbarui',
    'Menguji hasil merge sementara dan mengirim status check kembali ke hosting Git',
    'Mengatur branch protection agar PR hanya bisa digabung bila CI sukses',
    'Menjaga keamanan build PR, terutama untuk PR yang berasal dari fork'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Mengapa Pull Request Perlu Divalidasi Otomatis</h3><p>Pull Request adalah tempat kode baru masuk ke cabang utama, sehingga di situlah pemeriksaan paling murah dan paling berguna bisa dilakukan. <b>Continuous Integration</b> menjawab pertanyaan "apakah perubahan ini masih membuat proyek sehat?" jauh sebelum reviewer membukanya.</p><p>Poin pentingnya: yang diuji bukan cabang PR apa adanya, melainkan <b>hasil merge sementara</b> — gabungan antara cabang PR dengan cabang target. Konflik dan efek samping integration justru muncul di titik itu, bukan di cabang yang berdiri sendiri.</p><ul><li>Reviewer tiba dengan bukti: lint, unit test, dan coverage sudah dijalankan otomatis.</li><li>Biaya review turun karena kegagalan teknis tersaring lebih dulu.</li><li>Hasil build melekat pada PR lewat status check, sehingga siapa pun bisa melihatnya tanpa membuka Jenkins.</li><li>Riwayat commit tetap utuh: PR digabung dengan <i>squash</i>, <i>merge</i>, atau <i>rebase</i> sesuai aturan tim.</li></ul><p>GitHub menyediakan fasilitas ini lewat paket gratisnya (Branch Source), sedangkan GitLab menyediakan plugin Merge Request — keduanya tersedia tanpa biaya pada layanan berbayar nol.</p>'
    },
    {
      type: 'text',
      html: '<h3>Memicu Build Saat Pull Request Dibuka</h3><p>Pada <b>GitHub</b>, aktifkan webhook dengan event <i>Pull requests</i> ke endpoint <code>/github-webhook/</code>, lalu di item Multibranch tambahkan <i>Behaviours → Discover pull requests from origins</i>. Jenkins akan membuat child job terpisah untuk tiap PR (misalnya <code>PR-42</code>) dan menjalankannya pada gabungan PR dengan cabang target.</p><p>Pada <b>GitLab</b>, pasang webhook dengan trigger <i>Merge request events</i> menuju endpoint <code>/project/&lt;token&gt;</code> milik plugin GitLab, atau gunakan tipe job <i>Multibranch Pipeline</i> dengan GitLab Branch Source yang mendeteksi merge request secara otomatis.</p><p>Selama build PR berjalan, Jenkins menyediakan variabel khusus yang sangat berguna untuk penulisan pipeline:</p><ul><li><code>env.CHANGE_ID</code> — nomor PR (misal <code>42</code>), kosong bila build bukan tipe PR.</li><li><code>env.CHANGE_BRANCH</code> — nama cabang asal PR.</li><li><code>env.CHANGE_TARGET</code> — cabang tujuan, misalnya <code>main</code>.</li></ul>'
    },
    {
      type: 'example',
      title: 'Memilih Antara Build Setiap PR atau Hanya yang Layak',
      lang: 'text',
      output: false,
      code: `GITHUB BRANCH SOURCE (item Multibranch -> Branch Source -> Behaviours)
- Discover pull requests from origins: By Merging the pull request with the target branch
- Discover pull requests from Forks: Trust = Members (atau Nobody bila tidak butuh PR fork)
- Build strategies: centang "Build open pull requests" untuk membangun semua PR terbuka
- Filter by name (regex): bila hanya PR dengan pola cabang tertentu yang boleh dibangun

GITLAB (webhook + plugin Merge Request)
- Centang Merge request events, dan biarkan Opened / Reopen / Update dicentang
- Nonaktifkan Closed, supaya PR yang sudah ditutup tidak lagi memakan antrian

PANDUAN SINGKAT
- Tim kecil / repo privat: "build every pull request" paling sederhana, semua PR diperiksa.
- Repo publik: batasi ke PR dari anggota organisasi (Trust = Members) agar resource
  Jenkins tidak dipakai sembarang orang lewat PR spam.
- PR closed / merged: jangan dibangun lagi, karena hasilnya tidak dipakai.`,
      explain: [
        'Opsi <b>Build open pull requests</b> (pada GitHub Branch Source) dan <i>Build every pull request</i> pada plugin lama GitHub Pull Request Builder memiliki maksud yang sama: setiap PR yang terbuka langsung diperiksa tanpa perlu persetujuan tambahan.',
        'Pilihan <b>Trust</b> menentukan siapa yang boleh memicu build: <i>Everyone</i> berarti siapa pun, <i>Members</i> hanya anggota organisasi, dan <i>Nobody</i> berarti PR dari fork tidak dibangun sama sekali.',
        'Membatasi event ke <i>Opened</i>, <i>Reopen</i>, dan <i>Updated</i> membuat build hanya berjalan ketika isi PR benar-benar berubah.',
        'Gunakan <i>Filter by name</i> bila cabang PR mengikuti pola tertentu, misalnya hanya <code>fitur/.*</code>, agar job PR tidak terlalu banyak.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Mengirim Status dan Komentar Balik ke Platform</h3><p>Build yang sukses tanpa laporan tidak berguna bagi reviewer. Jenkins mengirimkan hasilnya dengan dua cara: <b>commit status</b> (tampil sebagai check di halaman PR) dan <b>komentar</b> (berisi ringkasan hasil test).</p><ul><li><b>GitHub</b> — langkah <code>githubNotify</code> dari plugin <i>GitHub Notify Commit Status</i>, atau <i>GitHub Checks API</i>. Kamu menentukan <code>context</code> (nama check), <code>status</code> berisi <code>SUCCESS</code>, <code>FAILURE</code>, atau <code>PENDING</code>, beserta <code>description</code> singkat.</li><li><b>GitLab</b> — langkah <code>updateGitlabCommitStatus</code> dari plugin GitLab dengan <code>name</code> dan <code>state</code> berisi <code>running</code>, <code>success</code>, atau <code>failed</code>.</li><li><b>Komentar</b> — objek <code>pullRequest.comment(\'...\')</code> tersedia pada build GitHub Branch Source; untuk GitLab komentar bisa dikirim lewat API memakai Personal Access Token.</li></ul><p>Nama <code>context</code> harus ditulis persis sama dengan nama yang nanti dicari pada pengaturan branch protection. Bila berbeda satu karakter pun, centang hijau tidak akan pernah dikenali dan PR tetap terkunci.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 350" width="760" role="img" aria-label="Alur validasi pull request dari pembukaan PR, webhook ke Jenkins, pemeriksaan, status di GitHub, sampai keputusan merge gate">
        <rect x="20" y="40" width="175" height="120" rx="10" class="u-box"/>
        <text x="107" y="64" class="u-title" text-anchor="middle">GitHub / GitLab</text>
        <line x1="34" y1="74" x2="181" y2="74" class="u-line"/>
        <rect x="34" y="84" width="147" height="28" rx="6" class="u-hd"/>
        <text x="107" y="102" class="u-lbl" text-anchor="middle">Buka Pull Request</text>
        <rect x="34" y="120" width="147" height="28" rx="6" class="u-box"/>
        <text x="107" y="138" class="u-lbl" text-anchor="middle">event: pull_request</text>
        <line x1="199" y1="100" x2="301" y2="100" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="250" y="86" class="u-lbl" text-anchor="middle">1. webhook</text>
        <text x="250" y="124" class="u-lbl" text-anchor="middle">POST event</text>
        <rect x="305" y="40" width="150" height="120" rx="10" class="u-box"/>
        <text x="380" y="64" class="u-title" text-anchor="middle">Jenkins</text>
        <line x1="319" y1="74" x2="441" y2="74" class="u-line"/>
        <rect x="319" y="84" width="122" height="28" rx="6" class="u-hd"/>
        <text x="380" y="102" class="u-lbl" text-anchor="middle">checkout merge ref</text>
        <rect x="319" y="120" width="122" height="28" rx="6" class="u-box"/>
        <text x="380" y="138" class="u-lbl" text-anchor="middle">lint + unit test</text>
        <line x1="459" y1="100" x2="571" y2="100" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="515" y="86" class="u-lbl" text-anchor="middle">2. hasil check</text>
        <text x="515" y="124" class="u-lbl" text-anchor="middle">status + komentar</text>
        <rect x="575" y="40" width="165" height="120" rx="10" class="u-box"/>
        <text x="657" y="64" class="u-title" text-anchor="middle">Status di PR</text>
        <line x1="589" y1="74" x2="726" y2="74" class="u-line"/>
        <rect x="589" y="84" width="137" height="28" rx="6" class="u-hd"/>
        <text x="657" y="102" class="u-lbl" text-anchor="middle">check: pr-validate</text>
        <rect x="589" y="120" width="137" height="28" rx="6" class="u-box"/>
        <text x="657" y="138" class="u-lbl" text-anchor="middle">ringkasan test</text>
        <line x1="645" y1="164" x2="578" y2="238" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="655" y="196" class="u-lbl">3. syarat merge</text>
        <rect x="190" y="244" width="380" height="82" rx="10" class="u-box"/>
        <text x="380" y="268" class="u-title" text-anchor="middle">Branch Protection (merge gate)</text>
        <line x1="204" y1="278" x2="556" y2="278" class="u-line"/>
        <rect x="204" y="286" width="170" height="32" rx="6" class="u-hd"/>
        <text x="289" y="306" class="u-lbl" text-anchor="middle">semua check hijau</text>
        <rect x="386" y="286" width="170" height="32" rx="6" class="u-box"/>
        <text x="471" y="306" class="u-lbl" text-anchor="middle">ada check gagal</text>
        <text x="380" y="344" class="u-lbl" text-anchor="middle">Cabang terlindungi hanya menerima merge bila required status check dan review terpenuhi</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 10.1</b> — Alur validasi pull request: PR memicu webhook, Jenkins memeriksa hasil merge, status dikirim balik, lalu branch protection memutuskan apakah Merge diizinkan</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Mengatur Branch Protection sebagai Merge Gate',
      lang: 'text',
      output: false,
      code: `GITHUB (paket gratis)
1. Buka repository -> Settings -> Branches -> Add branch protection rule
   (versi baru: Settings -> Rules -> Add branch ruleset)
2. Branch name pattern: main
3. Centang "Require a pull request before merging" -> Required approvals: 1
4. Centang "Require status checks to pass before merging"
5. Pada kolom pencarian, pilih status check "pr-validate" (nama context dari Jenkins)
6. Centang "Require branches to be up to date before merging" (opsional, paling ketat)
7. Centang "Do not allow bypassing the above settings" agar admin tetap terikat
8. Save changes

GITLAB (paket gratis)
1. Repo -> Settings -> Repository -> Protected branches -> main
2. Allowed to merge: Maintainers   |   Allowed to push: No one
3. Centang "Pipelines must succeed"
4. Repo -> Settings -> Merge requests -> Approval rules: minimal 1 reviewer

VERIFIKASI
- Buka PR percobaan, pastikan check "pr-validate" tampil lalu coba klik Merge
  saat check masih merah: tombol Merge harus tetap terkunci.`,
      explain: [
        'Nama pada baris <b>Require status checks</b> harus sama persis dengan nilai <code>context</code> yang dikirim <code>githubNotify</code>; tulislah <code>pr-validate</code> di keduanya.',
        'Persetujuan review (approval) dan status check adalah dua syarat terpisah: PR bisa saja hijau CI-nya tetapi belum direview, atau sebaliknya.',
        'Opsi <i>Require branches to be up to date</i> memaksa cabang PR digabungkan ulang ke target terbaru sebelum merge, sehingga konflik ketahuan lebih awal.',
        'Pada GitLab, <i>Pipelines must succeed</i> adalah padanan merge gate: tombol Merge baru aktif bila pipeline terakhir sukses.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Merge Gate: Aturan Praktis Review dan CI</h3><p>Branch protection baru berguna bila aturannya masuk akal. Pola yang paling umum dipakai tim kecil:</p><ul><li><b>Wajib lewat PR</b> — tidak ada push langsung ke <code>main</code>, termasuk oleh admin.</li><li><b>Minimal satu approval</b> — pemeriksaan manusia tetap ada untuk logika dan desain kode.</li><li><b>Wajib hijau</b> — <i>Require status checks</i> dengan nama context milik Jenkins.</li><li><b>Review basi dihapus</b> — <i>Dismiss stale pull request approvals</i>, supaya approval lama tidak berlaku setelah kode berubah.</li><li><b>Perbaikan di cabang PR</b> — bila CI merah, penulis memperbaiki di cabang yang sama, bukan mengulang dari awal.</li></ul><p>Beberapa kebiasaan yang menjaga merge gate tetap dipercaya: <b>jangan pernah memaksakan merge</b> (force merge) saat check gagal hanya karena sedang terburu-buru; bila kegagalan ternyata flaky (tes tidak stabil), ulangi build terlebih dahulu dan perbaiki tesnya. Batasi jumlah required check — dua sampai tiga check yang bermakna lebih baik daripada sepuluh check yang selalu dilewati orang.</p>'
    },
    {
      type: 'example',
      title: 'Jenkinsfile untuk Validasi Pull Request',
      lang: 'groovy',
      output: false,
      code: `pipeline {
  agent { label 'pr-check' }          // agent khusus PR, tanpa kredensial produksi
  options {
    timestamps()
    disableConcurrentBuilds(abortPrevious: true)   // commit baru membatalkan build lama
  }
  stages {
    stage('Siapkan Kode') {
      when { changeRequest() }        // hanya berjalan untuk build bertipe pull request
      steps {
        checkout scm                  // mengambil hasil merge PR dengan cabang target
        sh 'npm ci'
      }
    }
    stage('Lint') {
      when { changeRequest() }
      steps { sh 'npm run lint' }
    }
    stage('Unit Test') {
      when { changeRequest() }
      steps { sh 'npm test -- --ci --reporters=jest-junit' }
    }
  }
  post {
    always {
      junit allowEmptyResults: true, testResults: 'reports/*.xml'
      script {
        if (env.CHANGE_ID) {
          def hasil = currentBuild.currentResult == 'SUCCESS' ? 'SUCCESS' : 'FAILURE'
          githubNotify status: hasil,
                       context: 'pr-validate',
                       description: "Lint dan unit test: \${currentBuild.currentResult}"
          pullRequest.comment("Hasil validasi: \${currentBuild.currentResult} - \${env.BUILD_URL}")
        }
      }
    }
  }
}`,
      explain: [
        'Direktif <code>when { changeRequest() }</code> memastikan tahap hanya berjalan ketika build bertipe pull request; bila Multibranch juga membangun cabang biasa, kamu bisa menambah cabang <code>main</code> pada tahap tersendiri.',
        'Pada GitHub Branch Source, <code>checkout scm</code> mengambil hasil gabungan PR dengan cabang target, sehingga test dijalankan terhadap kode yang benar-benar akan digabung.',
        'Langkah <code>githubNotify</code> mengirim status check bernama <code>pr-validate</code>, sedangkan <code>pullRequest.comment</code> menuliskan ringkasan hasil langsung di halaman PR beserta tautan log.',
        'Kode di dalam blok <code>post</code> dibungkus <code>script</code> karena memakai logika Groovy biasa (percabangan <code>if</code> dan variabel <code>def</code>).'
      ]
    },
    {
      type: 'text',
      html: '<h3>Keamanan: PR dari Fork Boleh Diuji, Bolehkah Diberi Rahasia?</h3><p><b>Fork</b> adalah salinan repository milik orang lain. PR dari fork berisi kode yang belum tentu tepercaya — dan pada Multibranch, <code>Jenkinsfile</code> yang dieksekusi pun ikut diambil dari PR tersebut. Artinya penulis PR secara praktis bisa menulis pipeline apa pun yang dia kehendaki, termasuk langkah yang membaca kredensial.</p><p>Karena itu berlaku aturan keras berikut:</p><ul><li><b>Percaya seperlunya</b> — pada <i>Discover pull requests from Forks</i> pilih <i>Trust: Members</i> atau <i>Nobody</i>; dengan <i>Nobody</i>, PR fork tidak dibangun sama sekali.</li><li><b>Agent khusus</b> — jalankan build PR pada label tersendiri, misalnya <code>pr-check</code>, yaitu node tanpa kredensial produksi dan tanpa akses jaringan internal.</li><li><b>Rahasia disaring</b> — <code>withCredentials</code> hanya dipanggil setelah kondisi <code>env.CHANGE_ID</code> kosong (build cabang) dipastikan; PR tidak pernah menyentuh kunci rilis.</li><li><b>Tidak ada deploy dari PR</b> — tahap push image atau rilis hanya diberi <code>when { branch \'main\' }</code>.</li><li><b>Perubahan Jenkinsfile wajib direview</b> — siapa pun yang mengubah pipeline harus mendapat persetujuan reviewer, karena pipeline adalah kode yang berjalan dengan izin Jenkins.</li></ul>'
    },
    {
      type: 'example',
      title: 'Menguji Webhook Secara Lokal dengan curl',
      lang: 'bash',
      output: false,
      code: `# 1. Kirim event pull_request tiruan ke endpoint Jenkins (jalankan dari LAN yang sama)
curl -i -X POST http://localhost:8080/github-webhook/ \\
  -H 'Content-Type: application/json' \\
  -H 'X-GitHub-Event: pull_request' \\
  -d '{"action":"opened","number":42,
       "pull_request":{"html_url":"https://github.com/aku/proyek/pull/42",
                       "head":{"ref":"fitur-tombol"},
                       "base":{"ref":"main"}}}'

# 2. Varian GitLab: endpoint memakai token rahasia milik job
curl -i -X POST http://localhost:8080/project/token-pilihanmu \\
  -H 'Content-Type: application/json' \\
  -H 'X-Gitlab-Event: Merge Request Hook' \\
  -d '{"object_kind":"merge_request",
       "object_attributes":{"action":"open","iid":7,"state":"opened"}}'

# 3. Periksa hasilnya: GitHub -> Settings -> Webhooks -> Recent Deliveries
#    atau lihat log Jenkins pada menu Manage Jenkins -> System Log`,
      explain: [
        'Header <code>X-GitHub-Event</code> dan <code>X-Gitlab-Event</code> memberi tahu plugin jenis event yang diterima; tanpanya Jenkins akan mengabaikan payload.',
        'Balasan <code>HTTP/1.1 200</code> berarti endpoint menerima payload; <code>404</code> menandakan URL salah, sedangkan <code>403</code> menandakan token atau verifikasi payload tidak cocok.',
        'Cara ini berguna saat webhook asli dari internet tidak bisa menjangkau Jenkins lokal, atau ketika kamu ingin mereproduksi kegagalan tanpa menekan tombol di GitHub.',
        'Setelah yakin endpoint sehat, jalankan pengiriman asli dari halaman Recent Deliveries agar build PR benar-benar terpicu dengan payload lengkap.'
      ]
    },
    {
      type: 'tip',
      title: 'Strategi checkout menentukan apa yang diuji',
      text: 'Pada <i>Branch Source → Behaviours</i>, strategi <b>Merging the pull request with the current target branch revision</b> menguji hasil gabungan — ini yang disarankan karena paling mirip dengan keadaan setelah merge. Bila kamu justru ingin menguji cabang PR apa adanya, pilih strategi pembangunan revisi tertentu, lalu sadari bahwa konflik dengan cabang target baru akan ketahuan setelah PR digabung.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Jangan pernah memberi build PR akses ke kredensial produksi, kunci rilis, atau socket container pada host — kode di dalam PR belum tentu tepercaya, dan <code>Jenkinsfile</code>-nya bisa saja sudah dimodifikasi penulis PR. Selain itu, jangan memaksakan merge (bypass) hanya karena check gagal; perbaiki di cabang PR, lalu biarkan merge gate bekerja sebagaimana mestinya.'
    },
    {
      type: 'vocab',
      items: [
        ['Pull Request (PR)', 'Permintaan penggabungan cabang ke repository utama, menjadi tempat review dan validasi otomatis berjalan.'],
        ['Merge Gate', 'Aturan yang mencegah penggabungan sebelum syarat tertentu, misalnya CI hijau dan review, terpenuhi.'],
        ['Status Check', 'Laporan hasil build yang dikirim Jenkins ke hosting Git dengan nama context dan tampil sebagai centang merah atau hijau.'],
        ['Required Status Check', 'Status check yang wajib lulus sebelum tombol Merge aktif, diatur lewat branch protection.'],
        ['Branch Protection', 'Kumpulan aturan proteksi cabang pada GitHub/GitLab: wajib PR, wajib review, wajib CI lulus.'],
        ['Change Request', 'Tipe build Jenkins untuk PR/MR; dikenali lewat <code>when { changeRequest() }</code> dan variabel <code>env.CHANGE_ID</code>.'],
        ['Fork', 'Salinan repository milik pengguna lain; isi dan pipelinenya belum tentu tepercaya.'],
        ['Context', 'Nama tampilan sebuah status check, misalnya <code>pr-validate</code>, yang harus dicari persis saat mengatur required checks.']
      ]
    }
  ],
  recap: [
    'Pull request memicu build lewat webhook event pull request (GitHub) atau merge request (GitLab), lalu Multibranch membuat child job khusus seperti PR-42.',
    'Hasil build dikirim balik sebagai status check (<code>githubNotify</code> atau <code>updateGitlabCommitStatus</code>) dan komentar hasil test di halaman PR.',
    'Merge gate diatur lewat branch protection: wajib PR, minimal satu approval, dan required status check dengan nama context yang persis sama.',
    'PR dari fork tidak boleh memperoleh kredensial produksi; gunakan Trust: Members/Nobody, agent khusus berlabel <code>pr-check</code>, dan <code>when { changeRequest() }</code>.'
  ]
});
