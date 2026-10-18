/* ============================================================
   Pelajaran Jenkins — Bab 11: Build Terdistribusi — Agent Statis & Label
   ============================================================ */
'use strict';

window.JENKINS_LESSONS = window.JENKINS_LESSONS || [];

window.JENKINS_LESSONS.push({
  id: 'agent-statis',
  title: 'Build Terdistribusi: Agent Statis & Label',
  chapter: 'Build Terdistribusi',
  duration: '8–10 menit',
  intro: [
    'Pada awalnya semua build berjalan di komputer yang sama dengan Jenkins. Ketika proyek bertambah, terasa sendiri: antarmuka Jenkins melambat, build saling berebut CPU, dan mesin yang tadinya ringan mendadak panas selama berjam-jam.',
    '<b>Build terdistribusi</b> memisahkan peran pengelola dari pelaksana. <b>Controller</b> cukup menangani antarmuka, antrian, dan plugin, sedangkan pekerjaan berat dipindahkan ke <b>node</b> lain yang disebut <b>agent</b> — bisa laptop kedua, mesin virtual, atau server lawas di jaringan yang sama, semuanya tanpa biaya lisensi.',
    'Bab ini membahas mengapa Controller wajib ringan, konsep dasar Node, Executor, Workspace, dan Label, dua cara menambah agent statis (SSH dan Inbound Agent/JNLP), konfigurasi executor dan label, serta cara merutekan pipeline ke agent yang tepat.'
  ],
  objectives: [
    'Memahami alasan build didistribusikan dan peran Controller yang harus tetap ringan',
    'Mengenali konsep Node, Executor, Workspace, dan Label',
    'Menambah agent statis lewat SSH maupun Inbound Agent (agent.jar)',
    'Merutekan build ke agent tertentu memakai label pada Jenkinsfile'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Kenapa Build Harus Terdistribusi?</h3><p>Jenkins Controller memegang tugas yang tidak boleh terganggu: menyajikan antarmuka, mengelola antrian build, menjadwalkan pekerjaan, menyimpan riwayat, dan melayani permintaan ribuan request saat tim membuka dashboard. Semua itu bekerja optimal bila mesinnya ringan.</p><p>Sebaliknya, pekerjaan build sangat rakus sumber daya: <code>npm install</code> menaruh ribuan berkas, kompilasi memakai seluruh inti CPU, dan unit test paralel memakan memori. Bila keduanya berjalan di satu mesin, akibatnya klasik:</p><ul><li>Antarmuka Jenkins lambat merespons, padahal hanya ingin melihat log.</li><li>Backup <code>JENKINS_HOME</code> dan pembaruan plugin jadi lama karena disk dipenuhi workspace.</li><li>Semua build saling antre pada satu mesin sehingga waktu penyelesaian membengkak.</li><li>Build membutuhkan sistem operasi atau arsitektur berbeda (misalnya Windows atau ARM) tidak mungkin dijalankan.</li></ul><p>Karenanya ada aturan praktis yang berlaku di hampir semua instalasi Jenkins: <b>Controller hanya 1–2 executor, sisanya dibebaskan untuk agent</b>. Dengan begitu tugas berat berpindah sementara Jenkins tetap responsif.</p>'
    },
    {
      type: 'text',
      html: '<h3>Empat Konsep Dasar: Node, Executor, Workspace, Label</h3><ul><li><b>Node</b> — sebuah mesin yang dihubungkan ke Jenkins: fisik, virtual, bahkan container. Mesin tempat Controller berjalan juga node, namanya <i>built-in node</i> (dulu disebut master).</li><li><b>Executor</b> — satu slot pekerjaan pada node. Dua executor berarti node itu bisa menjalankan dua build secara bersamaan. Jumlah executor diatur per node dan menjadi batas paralelisme nyata.</li><li><b>Workspace</b> — folder kerja milik tiap job di dalam node, berisi kode hasil checkout dan seluruh artefak build. Workspace berbeda untuk tiap job, dan bisa dihapus kapan saja untuk memulai bersih.</li><li><b>Label</b> — teks penanda kemampuan sebuah node, misalnya <code>linux</code>, <code>docker</code>, <code>amd64</code>, <code>arm64</code>, atau <code>windows</code>. Label menjadi bahasa yang dipakai pipeline untuk meminta "jalankan saya di mesin yang tepat".</li></ul><p>Hubungan keempatnya sederhana: sebuah <b>node</b> menyediakan sejumlah <b>executor</b>, tiap executor memakai <b>workspace</b> saat menjalankan job, dan <b>label</b> menentukan job mana yang boleh masuk ke node tersebut.</p>'
    },
    {
      type: 'example',
      title: 'Langkah Menambah Node lewat UI (Launch via SSH)',
      lang: 'text',
      output: false,
      code: `1. Manage Jenkins -> Nodes -> New Node
2. Node name: agent-linux-1
   Type: Permanent Agent -> OK
3. Remote root directory: /var/lib/jenkins-agent
   (sama dengan home directory user agent di mesin tersebut)
4. Usage: Only build jobs with label expressions matching this node
5. Labels: linux amd64 docker
6. Number of executors: 2
7. Launch method: Launch agents via SSH
   - Host: 192.168.1.20        - Port: 22
   - Credentials: pilih kredensial SSH (Username = jenkins-agent)
   - Host Key Verification Strategy:
       * Manually provided key file  -> tempel hasil: ssh-keyscan -H 192.168.1.20
       * Non verifying Verification   -> hanya untuk latihan lokal
8. Availability: Keep this agent online as much as possible
9. Save, lalu buka node tersebut -> Log untuk melihat proses koneksi`,
      explain: [
        'Tipe <b>Permanent Agent</b> adalah node statis: terdaftar terus-menerus dan siap menerima build kapan pun dibutuhkan.',
        'Field <b>Remote root directory</b> menjadi dasar penyimpanan workspace di mesin agent; pastikan user yang dipakai memiliki hak tulis di sana.',
        'Pilihan <b>Only build jobs with label expressions matching this node</b> mencegah job tanpa label mendarat di agent ini, sehingga kamu bisa menyalakan build default ke built-in node.',
        'Strategi verifikasi host key <b>Manually provided key file</b> diisi kunci hasil <code>ssh-keyscan</code>; pilihan <i>Non verifying</i> lebih sederhana tetapi tidak memverifikasi identitas mesin agent.'
      ]
    },
    {
      type: 'example',
      title: 'Menyiapkan Mesin Agent (Laptop Kedua atau VM)',
      lang: 'bash',
      output: false,
      code: `# Dijalankan di MESIN AGENT (contoh Ubuntu/Debian)
sudo apt update && sudo apt install -y openssh-server openjdk-17-jre-headless

# Buat user khusus build dan folder kerjanya
sudo useradd -m -s /bin/bash jenkins-agent
sudo mkdir -p /var/lib/jenkins-agent
sudo chown -R jenkins-agent:jenkins-agent /var/lib/jenkins-agent

# Dari MESIN CONTROLLER: pasang kunci publik agar tanpa kata sandi
ssh-copy-id -i ~/.ssh/jenkins_ed25519.pub jenkins-agent@192.168.1.20

# Uji koneksi dan pastikan Java tersedia di agent
ssh jenkins-agent@192.168.1.20 'hostname && java -version && nproc'`,
      explain: [
        'Agent tetap membutuhkan Java, karena proses agent yang berkomunikasi dengan Controller ditulis dalam Java; <code>openjdk-17-jre-headless</code> sudah cukup untuk kebanyakan build.',
        'User khusus <code>jenkins-agent</code> memastikan build tidak berjalan sebagai root, sehingga risiko terhadap mesin agent jauh lebih kecil.',
        'Perintah <code>ssh-copy-id</code> menyalin kunci publik ke <code>authorized_keys</code> milik user agent; setelah itu koneksi Controller ke agent tidak lagi meminta kata sandi.',
        'Bila mesin agent memakai Windows, langkahnya berbeda: pasang Java, lalu pakai metode <i>Inbound Agent</i> yang dijelaskan pada bagian berikutnya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Dua Cara Menghubungkan Agent: SSH dan Inbound Agent (JNLP)</h3><p><b>Cara 1 — Launch agent via SSH.</b> Controller yang masuk ke mesin agent memakai SSH lalu menjalankan proses agent di sana. Syaratnya: mesin agent membuka port SSH, bisa dijangkau dari Controller, dan Java terpasang. Cara ini paling mudah dijelaskan dan mudah dipantau karena koneksi dimulai dari sisi Jenkins.</p><p><b>Cara 2 — Inbound Agent</b> (dahulu dikenal sebagai JNLP, <i>Java Network Launch Protocol</i>). Kebalikannya: proses agent yang dimulai di mesin agent, lalu <b>menghubungi keluar</b> menuju Controller. Cara ini cocok bila agent berada di balik NAT, firewall ketat, atau jaringan kantor yang tidak mengizinkan koneksi masuk — yang dibutuhkan hanyalah akses keluar menuju port 8080 Controller.</p><p>Perintah utamanya memakai <code>agent.jar</code> yang disediakan Controller pada URL <code>/jnlpJars/agent.jar</code>, beserta <i>secret</i> khusus node yang bisa disalin dari halaman konfigurasi agent. Bila port 50000 (port agent lama) diblokir, tambahkan opsi <b>WebSocket</b> sehingga seluruh komunikasi lewat satu port 8080.</p>'
    },
    {
      type: 'example',
      title: 'Menjalankan Inbound Agent dari Terminal',
      lang: 'bash',
      output: false,
      code: `# 1. Di Jenkins: Manage Jenkins -> Nodes -> New Node
#    Launch method: "Launch agent by connecting it to Jenkins"
#    Salin tiga nilai ini: URL Jenkins, Secret, dan nama node (agent-linux-2)

# 2. Di MESIN AGENT: unduh agent.jar dari Controller
curl -fsSL -o agent.jar http://192.168.1.10:8080/jnlpJars/agent.jar

# 3. Jalankan agent (secret dan nama node sesuai yang tampil di Jenkins)
java -jar agent.jar \\
  -jnlpUrl http://192.168.1.10:8080/computer/agent-linux-2/jenkins-agent.jnlp \\
  -secret 6f0c1c2e5b1a4d9f8c3b7a2e0d4f6a1b \\
  -workDir /var/lib/jenkins-agent

# 4. Bila port 50000 diblokir, sambungkan lewat WebSocket
java -jar agent.jar -webSocket \\
  -jnlpUrl http://192.168.1.10:8080/computer/agent-linux-2/jenkins-agent.jnlp \\
  -secret 6f0c1c2e5b1a4d9f8c3b7a2e0d4f6a1b \\
  -workDir /var/lib/jenkins-agent`,
      explain: [
        'Berkas <code>agent.jar</code> adalah klien Jenkins; ia meminta pekerjaan dari Controller, menjalankannya di mesin ini, lalu mengembalikan hasil dan log.',
        'Nilai <code>-secret</code> bersifat rahasia dan unik per node; tanpanya koneksi ditolak. Salin langsung dari halaman konfigurasi node, jangan diketik ulang manual.',
        'Opsi <code>-workDir</code> menentukan lokasi workspace; tanpanya agent memakai folder bawaan yang bisa saja berbeda antar sistem operasi.',
        'Opsi <code>-webSocket</code> membuat koneksi keluar lewat port HTTP yang sama, sehingga cocok untuk jaringan yang hanya mengizinkan satu port terbuka.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Konfigurasi Lanjutan: Executor, Label, Retention, dan Pemantauan</h3><p>Setelah node terdaftar, beberapa pengaturan berikut menentukan perilakunya sehari-hari:</p><ul><li><b>Number of executors</b> — disarankan <b>2 per agent</b>; lebih dari itu membuat workspace bersaing dan build justru melambat. Untuk Controller cukup <b>1–2</b>.</li><li><b>Labels</b> — tulis beberapa label dipisah spasi. Gunakan kata yang deskriptif dan berlaku umum: <code>linux</code>, <code>amd64</code>, <code>docker</code>, <code>windows</code>.</li><li><b>Usage</b> — pilih <i>Only build jobs with label expressions matching this node</i> agar job yang tidak menyebut label tidak memakai agent ini.</li><li><b>Node Properties</b> — tempat menambahkan variabel lingkungan khusus (misal <code>PODMAN_HOST</code>), referensi tool, serta monitor seperti batas penggunaan disk.</li><li><b>Retention strategy</b> — <i>Keep this agent online as much as possible</i> menjaga agent selalu siap; strategi <i>Demand</i> menyalakan/mematikan agent sesuai kebutuhan, cocok untuk VM berbayar.</li><li><b>Keep-alive</b> — pada metode SSH dan inbound, opsi ini mengirim ping berkala agar koneksi tidak putus karena idle timeout.</li></ul><p>Untuk memantau kesehatan node: buka <i>Manage Jenkins → Nodes</i> untuk melihat status Online/Offline, lalu pilih node dan buka tab <b>Log</b> guna melihat error koneksi. Tab <i>System Log</i> dan halaman <i>Node Monitoring</i> menampilkan pemakaian CPU, memori, dan disk tiap node.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 350" width="760" role="img" aria-label="Arsitektur satu Jenkins Controller dengan dua agent berbeda label, masing-masing memiliki dua executor dan workspace sendiri">
        <rect x="250" y="30" width="260" height="110" rx="10" class="u-box"/>
        <text x="380" y="54" class="u-title" text-anchor="middle">Jenkins Controller</text>
        <line x1="264" y1="64" x2="496" y2="64" class="u-line"/>
        <rect x="264" y="74" width="232" height="28" rx="6" class="u-hd"/>
        <text x="380" y="93" class="u-lbl" text-anchor="middle">Antrian build (queue)</text>
        <text x="380" y="126" class="u-lbl" text-anchor="middle">UI, scheduler, plugin - 1-2 executor</text>
        <line x1="310" y1="144" x2="185" y2="196" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="176" y="166" class="u-lbl" text-anchor="end">ke Agent A (linux)</text>
        <line x1="450" y1="144" x2="575" y2="196" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="584" y="166" class="u-lbl">ke Agent B (arm64)</text>
        <rect x="30" y="200" width="300" height="124" rx="10" class="u-box"/>
        <text x="180" y="224" class="u-title" text-anchor="middle">Agent A - label: linux</text>
        <line x1="44" y1="234" x2="316" y2="234" class="u-line"/>
        <rect x="44" y="244" width="130" height="30" rx="6" class="u-hd"/>
        <text x="109" y="263" class="u-lbl" text-anchor="middle">2 executor</text>
        <rect x="186" y="244" width="130" height="30" rx="6" class="u-box"/>
        <text x="251" y="263" class="u-lbl" text-anchor="middle">Workspace A</text>
        <text x="180" y="300" class="u-lbl" text-anchor="middle">Linux x86_64 + Docker/Podman</text>
        <rect x="430" y="200" width="300" height="124" rx="10" class="u-box"/>
        <text x="580" y="224" class="u-title" text-anchor="middle">Agent B - label: arm64</text>
        <line x1="444" y1="234" x2="716" y2="234" class="u-line"/>
        <rect x="444" y="244" width="130" height="30" rx="6" class="u-hd"/>
        <text x="509" y="263" class="u-lbl" text-anchor="middle">2 executor</text>
        <rect x="586" y="244" width="130" height="30" rx="6" class="u-box"/>
        <text x="651" y="263" class="u-lbl" text-anchor="middle">Workspace B</text>
        <text x="580" y="300" class="u-lbl" text-anchor="middle">Raspberry Pi / mesin VM kedua</text>
        <text x="380" y="344" class="u-lbl" text-anchor="middle">Antrian dirutekan ke agent berlabel cocok; tiap agent punya executor dan workspace sendiri</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 11.1</b> — Satu Controller dengan dua agent berbeda label: antrian build dirutekan, dan masing-masing agent menjalankan build di executor serta workspace miliknya</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Merutekan Build Memakai Label</h3><p>Setelah label terpasang, pemakaian dari pipeline sangat ringan. Pada Declarative Pipeline cukup tuliskan agent beserta labelnya; pada gaya skrip gunakan langkah <code>node(\'...\')</code>; dan untuk satu tahap tertentu kamu bisa memilih agent berbeda agar tidak memakai satu agent untuk seluruh tahap.</p><ul><li><code>agent { label \'linux-builder\' }</code> — memilih salah satu executor di node yang punya label tersebut.</li><li><code>agent none</code> di bagian atas, lalu <code>agent { label \'docker\' }</code> per tahap — pola paling hemat kapasitas.</li><li><code>node(\'label\') { ... }</code> — gaya skrip, berguna untuk memilih agent di dalam blok <code>script</code>.</li><li>Ekspresi gabungan didukung: <code>label \'linux && docker\'</code> (keduanya) dan <code>label \'windows || arm64\'</code> (salah satu).</li></ul><p>Label juga berguna untuk <b>menghindari bentrok</b>: beri label <code>docker</code> hanya pada mesin yang benar-benar punya Docker/Podman, dan label <code>gpu</code> pada mesin yang punya GPU. Dengan begitu pipeline yang butuh Docker tidak akan pernah dijadwalkan ke mesin yang tidak siap.</p>'
    },
    {
      type: 'example',
      title: 'Jenkinsfile yang Memakai Label dan Agent Berbeda',
      lang: 'groovy',
      output: false,
      code: `pipeline {
  agent none                       // tiap tahap memilih agent sendiri-sendiri
  options { timestamps() }

  stages {
    stage('Ambil Kode') {
      agent { label 'linux' }      // masuk ke salah satu agent berlabel linux
      steps {
        checkout scm
        sh 'whoami; hostname; nproc'   // bukti eksekusi ada di agent, bukan Controller
      }
    }
    stage('Bangun') {
      agent { label 'linux && docker' }   // hanya agent yang punya keduanya
      steps {
        sshagent(['github-ssh-deploy']) { // kredensial tipe SSH dari Credentials
          sh 'git ls-remote git@github.com:organisasi/proyek.git HEAD'
        }
        sh 'podman build -t app:build-\${BUILD_NUMBER} .'
      }
    }
    stage('Verifikasi Arsitektur') {
      steps {
        script {
          node('arm64') {                  // gaya skrip: pindah agent di tengah tahap
            sh 'uname -m'
          }
        }
      }
    }
  }
  post {
    always { echo "Selesai di \${env.BUILD_URL}" }
  }
}`,
      explain: [
        'Dengan <code>agent none</code> di tingkat pipeline, setiap tahap menentukan sendiri agentnya — paling cocok bila tahap build butuh kemampuan berbeda dengan tahap lain.',
        'Blok <code>sshagent</code> menyediakan kunci SSH selama langkah berjalan, sehingga rahasia tidak pernah muncul pada log atau pada <code>Jenkinsfile</code>.',
        'Ekspresi <code>\'linux && docker\'</code> mengharuskan kedua label ada pada node; tanpa label <code>docker</code>, pipeline akan menunggu selamanya di antrian.',
        'Langkah <code>node(\'arm64\')</code> memungkinkan satu tahap berjalan di mesin lain tanpa mengubah agent seluruh pipeline — misalnya untuk memverifikasi biner lintas arsitektur.'
      ]
    },
    {
      type: 'tip',
      title: 'Kuota executor dan penamaan label',
      text: 'Mulailah dengan <b>2 executor per agent</b> dan <b>1–2 di Controller</b>; jumlah lebih besar hanya menambah persaingan disk tanpa mempercepat. Untuk label, gunakan kata yang berlaku umum dan bebas spasi (<code>linux</code>, <code>amd64</code>, <code>docker</code>, <code>windows</code>) supaya konsisten di seluruh pipeline tim, dan catatnya di satu berkas dokumentasi bersama.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Jangan pernah memakai Controller untuk build berat hanya karena malas menambah agent — begitu UI mulai melambat, seluruh tim ikut terhambat. Selain itu, periksa selalu tab <b>Log</b> pada node bila agent berstatus Offline: penyebab paling umum adalah Java belum terpasang, user/kredensial salah, direktori remote tidak ada, atau kunci host host yang belum diverifikasi.'
    },
    {
      type: 'vocab',
      items: [
        ['Node', 'Mesin (fisik, virtual, atau container) yang dihubungkan ke Jenkins untuk menjalankan build.'],
        ['Executor', 'Satu slot pekerjaan paralel pada node; jumlahnya menentukan berapa build bisa berjalan bersamaan.'],
        ['Workspace', 'Folder kerja per job di dalam node tempat kode di-checkout dan hasil build disimpan.'],
        ['Label', 'Teks penanda kemampuan node seperti linux atau docker, dipakai untuk merutekan job.'],
        ['Built-in Node', 'Node tempat Controller berjalan; sebaiknya hanya memakai 1-2 executor dan tidak untuk build berat.'],
        ['Permanent Agent', 'Tipe node statis yang terdaftar terus-menerus dan selalu siap menerima pekerjaan.'],
        ['Inbound Agent (JNLP)', 'Klien yang memulai koneksi keluar dari mesin agent ke Controller, cocok untuk jaringan di balik NAT.'],
        ['Retention Strategy', 'Aturan kapan node harus tetap online (keep forever) atau menyala sesuai kebutuhan (demand).']
      ]
    }
  ],
  recap: [
    'Controller wajib ringan karena menangani UI, antrian, dan plugin; build berat sebaiknya dijalankan pada agent melalui 1-2 executor di Controller.',
    'Empat konsep dasar: Node (mesin), Executor (slot paralel), Workspace (folder kerja per job), dan Label (penanda kemampuan).',
    'Agent statis ditambahkan lewat dua metode: Launch via SSH (Controller masuk ke agent) dan Inbound Agent (agent menghubungi Controller dengan agent.jar).',
    'Pemakaian label: <code>agent { label \'linux && docker\' }</code> pada Declarative dan <code>node(\'label\')</code> pada gaya skrip, lengkap dengan <code>sshagent</code> untuk kredensial.'
  ]
});
