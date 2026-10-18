/* ============================================================
   Pelajaran Jenkins — Bab 12: Agent Dinamis Container & Build Image
   ============================================================ */
'use strict';

window.JENKINS_LESSONS = window.JENKINS_LESSONS || [];

window.JENKINS_LESSONS.push({
  id: 'agent-dinamis',
  title: 'Agent Dinamis Container & Build Image',
  chapter: 'Build Terdistribusi',
  duration: '8–10 menit',
  intro: [
    'Agent statis punya dua masalah yang muncul lama kelamaan: workspace menumpuk sisa build sebelumnya, dan versi toolchain di mesin itu perlahan berbeda dari yang dipakai rekan lain. Build yang tadinya berhasil mendadak gagal hanya karena seseorang memperbarui Node di mesin agent.',
    '<b>Agent dinamis</b> menjawabnya dengan prinsip berbeda: setiap build membuka satu container khusus dari image yang sudah ditentukan, menjalankan seluruh tahap di sana, lalu membuang container begitu selesai. Semua bersih kembali, dan toolchain persis sebagaimana tertulis di pipeline.',
    'Bab ini membahas perbandingan agent statis dengan agent sementara (ephemeral), cara memakai <code>agent { docker ... }</code> beserta konfigurasi socket Podman gratis di Controller, pola membangun dan mem-push image ke registry lokal, serta aturan keamanan yang tidak boleh dilanggar.'
  ],
  objectives: [
    'Membedakan agent statis dengan agent container sementara (ephemeral)',
    'Menjalankan build di container lewat agent docker atau podman run --rm',
    'Membangun, men-tag, dan mem-push image ke registry lokal gratis',
    'Mengenali risiko akses socket container dan cara memasukkan kredensial registry dengan aman'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Agent Ephemeral vs Agent Statis</h3><p><b>Ephemeral</b> berarti sementara: agent dibuat khusus untuk satu build, dipakai, lalu dihapus. Dalam praktiknya yang dibuang biasanya container-nya, sedangkan mesin peladen tetap berjalan dan hanya membuka container baru setiap kali ada pekerjaan.</p><p>Perbandingannya:</p><ul><li><b>Isolasi</b> — dependensi build tidak pernah bercampur dengan build lain atau dengan lingkungan host.</li><li><b>Kebersihan workspace</b> — tidak ada sisa <code>node_modules</code>, berkas setengah jadi, atau konfigurasi lama; setiap build memulai dari nol.</li><li><b>Versi toolchain presisi</b> — cukup menyebut <code>node:20-alpine</code> atau <code>golang:1.22</code>, seluruh tim memakai versi yang sama persis.</li><li><b>Skalabilitas</b> — container baru bisa dibuka di mesin mana pun yang punya label cocok, termasuk mesin kedua atau cluster Kubernetes.</li></ul><p>Harganya: ada waktu tambahan untuk menarik image dan membuka container. Dalam skala tim kecil hal ini biasanya di bawah beberapa detik, apalagi bila image sudah tersimpan lokal di agent.</p>'
    },
    {
      type: 'text',
      html: '<h3>Menjalankan Build di Dalam Container</h3><p>Direktif <code>agent { docker { image \'node:20-alpine\' } }</code> memerintahkan Jenkins: cari agent berlabel <code>docker</code>, buka container dari image tersebut, jalankan seluruh tahap di dalamnya, lalu buang container. Bentuk singkatnya adalah <code>agent { docker \'node:20-alpine\' }</code>.</p><p>Agar perintah ini bekerja, Jenkins harus dapat menjangkau <b>API socket container</b>:</p><ul><li><b>Docker</b> — tersedia pada <code>/var/run/docker.sock</code>; menambahkan user jenkins ke grup <code>docker</code> sudah cukup.</li><li><b>Podman (gratis, rootless)</b> — nyalakan API lewat <code>systemctl --user enable --now podman.socket</code> atau <code>podman system service --time=0 unix:///run/user/1000/podman/podman.sock</code>, lalu arahkan Jenkins dengan variabel <code>DOCKER_HOST</code>. Kompatibilitas perintah <code>docker</code> tersedia dari paket <i>podman-docker</i>.</li></ul><p>Pada Podman rootless ada batasan yang perlu diketahui: butuh cgroup versi 2 dan sistem operasi yang cukup baru, sebagian opsi jaringan Docker belum didukung penuh, dan akses volume bersifat terbatas. Bila konfigurasi socket terasa rumit, ada dua jalur alternatif yang tetap gratis: menjalankan <code>podman run --rm</code> sebagai langkah biasa di agent statis, atau memakai plugin Docker dan plugin Kubernetes yang mengelola agent per pod (praktik yang dibahas pada materi Kubernetes).</p>'
    },
    {
      type: 'example',
      title: 'Jenkinsfile dengan Agent Container Sementara',
      lang: 'groovy',
      output: false,
      code: `pipeline {
  // Satu container dibuka dari image ini untuk seluruh pipeline, lalu dibuang
  agent {
    docker {
      image 'node:20-alpine'      // versi Node dibekukan di pipeline, bukan di mesin
      label 'docker'              // hanya agent yang punya Docker/Podman
      args '-v npm-cache:/root/.npm'   // opsional: cache agar install kedua cepat
    }
  }
  options { timestamps() }

  stages {
    stage('Ambil Kode')     { steps { checkout scm } }
    stage('Instal Dependensi') { steps { sh 'npm ci' } }
    stage('Uji')            { steps { sh 'npm test -- --ci --reporters=jest-junit' } }
    stage('Bangun Aset')    { steps { sh 'npm run build' } }
  }

  post {
    always  { junit allowEmptyResults: true, testResults: 'reports/*.xml' }
    cleanup { deleteDir() }   // workspace dibersihkan, siap untuk build berikutnya
  }
}`,
      explain: [
        'Container hanya dibuka sekali untuk satu pipeline, sehingga seluruh tahap berbagi instalasi yang sama, lalu container dibuang begitu build selesai.',
        'Dengan image <code>node:20-alpine</code> dinyatakan di pipeline, hasil build di laptopmu dan di mesin rekan dijamin memakai Node versi yang sama.',
        'Label <code>docker</code> memastikan hanya mesin yang benar-benar memiliki Docker atau Podman yang menerima pekerjaan ini; tanpanya build akan menunggu selamanya di antrian.',
        'Bentuk singkat <code>agent { docker \'node:20-alpine\' }</code> juga sah dan cukup bila kamu tidak perlu menambah argumen container.'
      ]
    },
    {
      type: 'example',
      title: 'Menyiapkan Socket Podman (Gratis, Rootless) pada Controller',
      lang: 'bash',
      output: false,
      code: `# ===== DI MESIN CONTROLLER (Podman rootless, contoh UID 1000) =====
export XDG_RUNTIME_DIR=/run/user/$(id -u)

# Cara paling rapi: nyalakan socket lewat systemd user
systemctl --user enable --now podman.socket

# Alternatif tanpa systemd: jalankan API service secara manual
podman system service --time=0 unix://$XDG_RUNTIME_DIR/podman/podman.sock &

# Agar perintah "docker ..." diterjemahkan ke Podman (paket podman-docker)
sudo ln -sf /usr/bin/podman /usr/local/bin/docker

# Uji API-nya
podman --url unix://$XDG_RUNTIME_DIR/podman/podman.sock ps

# ===== Bila Jenkins berjalan sebagai container, bawa socket-nya masuk =====
podman run -d --name jenkins-server \\
  -p 8080:8080 -p 50000:50000 \\
  -v jenkins_home:/var/jenkins_home \\
  -v $XDG_RUNTIME_DIR/podman/podman.sock:/run/user/1000/podman/podman.sock:z \\
  -e DOCKER_HOST=unix:///run/user/1000/podman/podman.sock \\
  jenkins/jenkins:lts-jdk17`,
      explain: [
        'File socket inilah yang diakses plugin Docker Pipeline; tanpanya langkah <code>agent { docker ... }</code> akan gagal dengan pesan bahwa daemon tidak ditemukan.',
        'Podman rootless tidak berjalan sebagai root dan tidak membutuhkan daemon sistem — cukup systemd tingkat user, dengan syarat sistem memakai cgroup versi 2.',
        'Menambahkan user <code>jenkins</code> ke grup <code>docker</code> (pada Docker) berarti user tersebut memperoleh kendali setingkat root atas host; pertimbangkan baik-baik sebelum melakukannya.',
        'Bila jalur socket terasa merepotkan, alternatif gratis yang setara adalah menjalankan <code>podman run --rm</code> sebagai langkah sh pada agent statis, atau memakai plugin Kubernetes pada cluster lokal seperti Minikube atau Kind.'
      ]
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 350" width="760" role="img" aria-label="Alur build dengan agent container sementara: antrian Jenkins membuka container, menjalankan checkout test dan build, mem-push image ke registry lokal, lalu container dibuang">
        <rect x="24" y="40" width="176" height="90" rx="10" class="u-box"/>
        <text x="112" y="64" class="u-title" text-anchor="middle">Jenkins Controller</text>
        <line x1="38" y1="74" x2="186" y2="74" class="u-line"/>
        <rect x="38" y="84" width="148" height="28" rx="6" class="u-hd"/>
        <text x="112" y="103" class="u-lbl" text-anchor="middle">Antrian build</text>
        <text x="112" y="126" class="u-lbl" text-anchor="middle">tanpa executor berat</text>
        <line x1="204" y1="85" x2="276" y2="85" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="240" y="72" class="u-lbl" text-anchor="middle">1. antrian</text>
        <text x="240" y="108" class="u-lbl" text-anchor="middle">podman run</text>
        <rect x="280" y="40" width="250" height="210" rx="10" class="u-box"/>
        <text x="405" y="64" class="u-title" text-anchor="middle">Container agent sementara</text>
        <line x1="294" y1="74" x2="516" y2="74" class="u-line"/>
        <rect x="294" y="84" width="222" height="28" rx="6" class="u-hd"/>
        <text x="405" y="103" class="u-lbl" text-anchor="middle">checkout kode</text>
        <rect x="294" y="120" width="222" height="28" rx="6" class="u-box"/>
        <text x="405" y="139" class="u-lbl" text-anchor="middle">lint + unit test</text>
        <rect x="294" y="156" width="222" height="28" rx="6" class="u-box"/>
        <text x="405" y="175" class="u-lbl" text-anchor="middle">podman build image</text>
        <text x="405" y="204" class="u-lbl" text-anchor="middle">image: node:20-alpine</text>
        <text x="405" y="236" class="u-lbl" text-anchor="middle">workspace bersih tiap build</text>
        <rect x="24" y="176" width="176" height="64" rx="10" class="u-box"/>
        <text x="112" y="200" class="u-title" text-anchor="middle">Image toolchain</text>
        <text x="112" y="224" class="u-lbl" text-anchor="middle">node:20-alpine / golang</text>
        <line x1="204" y1="208" x2="276" y2="228" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="212" y="196" class="u-lbl">tarik image</text>
        <line x1="534" y1="85" x2="586" y2="85" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="560" y="72" class="u-lbl" text-anchor="middle">3. push</text>
        <text x="560" y="108" class="u-lbl" text-anchor="middle">tag versi</text>
        <rect x="590" y="40" width="146" height="90" rx="10" class="u-box"/>
        <text x="663" y="64" class="u-title" text-anchor="middle">Registry lokal</text>
        <line x1="604" y1="74" x2="722" y2="74" class="u-line"/>
        <text x="663" y="98" class="u-lbl" text-anchor="middle">localhost:5000</text>
        <text x="663" y="118" class="u-lbl" text-anchor="middle">registry:2 (gratis)</text>
        <line x1="405" y1="254" x2="405" y2="278" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="415" y="272" class="u-lbl">4. selesai</text>
        <rect x="300" y="282" width="210" height="40" rx="6" class="u-hd"/>
        <text x="405" y="307" class="u-lbl" text-anchor="middle">container dibuang (--rm)</text>
        <text x="380" y="344" class="u-lbl" text-anchor="middle">Satu container untuk satu build: dibuka, dipakai, lalu dibuang bersama sisa buildnya</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 12.1</b> — Alur build dengan agent container sementara: antrian Jenkins membuka container agent, menjalankan checkout sampai build, mem-push image ke registry lokal, lalu membuang container</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Membangun Image di Dalam Jenkins</h3><p>Begitu test lulus, langkah wajar berikutnya adalah membungkus aplikasi menjadi container image. Pola yang lazim dipakai:</p><ul><li><b>Build</b> — <code>podman build -t app:1.0 .</code> dari berkas Dockerfile yang ada di repository.</li><li><b>Tag versi</b> — beri label yang bisa ditelusuri, misalnya <code>app:build-42</code> memakai <code>BUILD_NUMBER</code>, sehingga selalu diketahui image mana yang melahirkan rilis.</li><li><b>Push</b> — kirimkan ke registry agar agent lain atau mesin deployment bisa menariknya.</li><li><b>Deploy</b> — perbarui manifest atau skrip deployment; bila mengikuti materi Kubernetes, langkah ini bisa memicu GitOps menuju ArgoCD.</li></ul><p>Untuk latihan, registry tidak perlu akun mana pun: proyek <b>Distribution</b> (referensi <code>registry:2</code>) berjalan sebagai container dan menyimpan image sepenuhnya di mesinmu. Perintahnya <code>podman run -d -p 5000:5000 registry:2</code>, dan image dituju sebagai <code>localhost:5000/app:1.0</code>. Perlu diingat: bila Jenkins berjalan di dalam container, <code>localhost</code> merujuk container itu sendiri — gunakan <code>host.containers.internal:5000</code> (Podman) untuk menjangkau registry di host.</p>'
    },
    {
      type: 'example',
      title: 'Registry Lokal dan Push Image dengan Podman',
      lang: 'bash',
      output: false,
      code: `# 1. Jalankan registry lokal (gratis, sepenuhnya offline)
podman run -d --name registry-local -p 5000:5000 registry:2

# 2. Bangun image aplikasi dari Dockerfile
podman build -t localhost:5000/app:1.0 .

# 3. Tag tambahan yang menunjuk ke image sama, untuk melacak nomor build
podman tag localhost:5000/app:1.0 localhost:5000/app:build-42

# 4. Kirim ke registry lokal
podman push localhost:5000/app:1.0
podman push localhost:5000/app:build-42

# 5. Verifikasi isi registry
curl -s http://localhost:5000/v2/_catalog
podman images`,
      explain: [
        'Image <code>registry:2</code> adalah rujukan proyek Distribution; ia menyimpan image di hostmu sehingga seluruh latihan tetap berjalan tanpa internet dan tanpa biaya.',
        'URL <code>localhost:5000/app:1.0</code> berarti registry pada port 5000 milik mesin lokal; jangan menerbitkannya ke jaringan publik selama masih berupa registry latihan.',
        'Tag <code>build-42</code> dibuat dari <code>BUILD_NUMBER</code> sehingga setiap image bisa ditelusuri kembali ke build yang menghasilkannya, dan rollback cukup mengganti tag.',
        'Bila registry berjalan di host sementara Jenkins berada di container, ganti <code>localhost:5000</code> menjadi <code>host.containers.internal:5000</code> saat push dari dalam container.'
      ]
    },
    {
      type: 'example',
      title: 'Pola Aman Memasukkan Kredensial Registry',
      lang: 'groovy',
      output: false,
      code: `stage('Push ke Registry') {
  steps {
    withCredentials([usernamePassword(
      credentialsId: 'registry-lokal',   // dibuat di Manage Jenkins -> Credentials
      usernameVariable: 'REG_USER',
      passwordVariable: 'REG_PASS'
    )]) {
      // Kutip tunggal Groovy: $REG_PASS dibaca oleh shell, bukan oleh Groovy
      sh 'printf "%s" "$REG_PASS" | podman login -u "$REG_USER" --password-stdin localhost:5000'
      sh 'podman tag localhost:5000/app:1.0 localhost:5000/app:$BUILD_NUMBER'
      sh 'podman push localhost:5000/app:$BUILD_NUMBER'
      sh 'podman push localhost:5000/app:latest'
    }
  }
}

// JANGAN dilakukan: password muncul di log, riwayat shell, dan daftar proses
// podman push --creds myuser:s3r3t localhost:5000/app:1.0`,
      explain: [
        '<code>withCredentials</code> hanya membuka rahasia selama blok berjalan, lalu menutupnya kembali; selain itu Jenkins otomatis menyamar (mask) nilai tersebut pada log.',
        'Flag <code>--password-stdin</code> menerima kata sandi lewat pipa masukan sehingga tidak muncul sebagai argumen proses yang bisa dibaca perintah <code>ps</code>.',
        'Blok <code>sh</code> memakai kutip tunggal Groovy, sehingga <code>$REG_USER</code> dan <code>$REG_PASS</code> diteruskan apa adanya ke shell dan dibaca dari variabel lingkungan.',
        'Nomor build dipakai sebagai tag (<code>app:$BUILD_NUMBER</code>) agar setiap rilis terlacak; tag <code>latest</code> hanya penanda kenyamanan, bukan rujukan versi.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Keamanan: Socket Container, DinD, dan Rahasia</h3><p>Kemampuan membuka container berarti kendali yang sangat besar. Tiga aturan berikut sebaiknya tidak dilanggar:</p><ul><li><b>Socket adalah root</b> — memberi akses <code>docker.sock</code> atau <code>podman.sock</code> ke sebuah build sama dengan memberi kendali penuh atas host: container baru bisa dibuat dengan volume root filesystem host. Karena itu pasang socket pada Controller dan agent tepercaya saja, jangan pada agent yang menjalankan kode PR.</li><li><b>Hati-hati dengan container-in-container</b> — pola Docker-in-Docker (DinD) biasanya menuntut mode <i>privileged</i>, yang mematikan sebagian besar isolasi. Jalur yang lebih aman adalah memakai socket milik host atau menambahkan klien build ke cluster Kubernetes.</li><li><b>Rahasia tidak boleh di argumen perintah</b> — gunakan <code>withCredentials</code> beserta <code>--password-stdin</code>; hindari <code>--creds</code>, URL berisi <code>user:pass@</code>, dan <code>ARG</code> bersifat rahasia di dalam Dockerfile karena keduanya terekam di log dan riwayat image.</li></ul><p>Tambahan kecil yang berdampak besar: jangan menarik image sembarangan dari internet pada pipeline produksi, dan pin digest image (<code>image@sha256:...</code>) bila toolchain tidak boleh berubah tanpa pengawasan.</p>'
    },
    {
      type: 'tip',
      title: 'Memulai dari yang paling sederhana',
      text: 'Bila konfigurasi socket terasa berat untuk latihan pertama, mulailah dari pola termudah yang tetap gratis: pasang Podman pada agent statis (pelajaran sebelumnya), beri label <code>docker</code>, jalankan <code>podman build</code> sebagai langkah biasa, lalu simpan hasilnya ke registry lokal. Setelah pola itu teruji, barulah beralih ke <code>agent { docker ... }</code> atau plugin Kubernetes yang membuka container baru per build.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Memasang socket container ke dalam build adalah keputusan keamanan, bukan sekadar konfigurasi teknis. Jangan lakukan pada agent yang menjalankan kode pull request, jangan menyalakan mode <i>privileged</i> tanpa kebutuhan nyata, dan jangan menempelkan token registry di baris perintah — log build bisa dibaca siapa pun yang punya akses melihat job.'
    },
    {
      type: 'vocab',
      items: [
        ['Agent Ephemeral', 'Agent yang dibuka khusus untuk satu build lalu dihapus setelah pekerjaan selesai.'],
        ['agent docker', 'Direktif Declarative Pipeline yang menjalankan seluruh tahap di dalam container image tertentu.'],
        ['Registry Container', 'Server penyimpan image; lokal dengan registry:2 atau publik seperti Docker Hub dan ghcr.io.'],
        ['Tag', 'Nama versi image seperti 1.0 atau build-42 yang menunjuk pada satu hasil build tertentu.'],
        ['Socket API', 'Berkas soket UNIX tempat klien mengakses API daemon container di host, misalnya podman.sock.'],
        ['Docker-in-Docker (DinD)', 'Praktik menjalankan daemon container di dalam container, biasanya memerlukan mode privileged.'],
        ['--password-stdin', 'Cara memberi kata sandi registry lewat pipa standar masukan agar tidak tampil di log maupun proses.'],
        ['BUILD_NUMBER', 'Variabel lingkungan Jenkins berisi nomor build berjalan, sering dipakai sebagai tag image unik.']
      ]
    }
  ],
  recap: [
    'Agent ephemeral dibuka untuk satu build lalu dibuang, sehingga workspace selalu bersih dan versi toolchain persis sesuai pipeline.',
    'Direktif <code>agent { docker ... }</code> membutuhkan akses socket container: Docker pada umumnya, atau socket Podman rootless yang diaktifkan lewat <code>podman.socket</code>.',
    'Pola rilis: <code>podman build</code>, tag dengan <code>BUILD_NUMBER</code>, <code>podman push</code> ke registry lokal <code>registry:2</code>, lalu deploy bila build sukses.',
    'Keamanan: socket container setara kendali host, hindari Docker-in-Docker privileged, dan selalu pakai <code>withCredentials</code> plus <code>--password-stdin</code>.'
  ]
});
