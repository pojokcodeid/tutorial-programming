/* ============================================================
   Pelajaran Jenkins — Bab 4: Keamanan, Pengguna & Manajemen Kredensial
   ============================================================ */
'use strict';

window.JENKINS_LESSONS = window.JENKINS_LESSONS || [];

window.JENKINS_LESSONS.push({
  id: 'keamanan-kredensial',
  title: 'Keamanan, Pengguna & Manajemen Kredensial',
  chapter: 'Administrasi',
  duration: '8–10 menit',
  intro: [
    'Jenkins memegang dua hal yang paling tidak boleh bocor: akses ke seluruh sistem (karena mampu menjalankan kode di banyak mesin) dan rahasia tim seperti token registry, kunci SSH, serta kata sandi basis data. Satu pengaturan keamanan yang longgar sudah cukup untuk membuka semuanya.',
    'Bab ini membedakan <b>Authentication</b> (siapa kamu) dari <b>Authorization</b> (boleh melakukan apa), mengenal Security Realm (Local, LDAP, GitHub OAuth), serta tiga strategi otorisasi: Matrix-based, Project-based Matrix, dan Role-Based Access Control. Bab ini juga membahas Credentials Manager: jenis kredensial, lingkup penyimpanan, dan cara memakainya dari pipeline tanpa pernah membocorkan nilainya ke log.',
    'Praktiknya berjalan sepenuhnya di Jenkins lokal hasil bab sebelumnya, sehingga kamu bisa mencoba membuat pengguna <i>developer</i>, menetapkan izin minimal, lalu menguji kredensial dari pipeline — semuanya gratis dan aman di laptop sendiri.'
  ],
  objectives: [
    'Membedakan autentikasi, otorisasi, dan security realm',
    'Menetapkan strategi otorisasi yang sesuai untuk tim kecil',
    'Memilih jenis kredensial dan lingkup penyimpanan yang tepat',
    'Memakai kredensial dari pipeline tanpa membocorkan nilainya ke log'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Authentication vs Authorization</h3><p>Dua istilah ini sering tertukar, padahal pembagiannya jelas:</p><ul><li><b>Authentication (autentikasi)</b> — memverifikasi identitas: "benarkah kamu si developer Andi?" Dilakukan oleh <b>Security Realm</b>.</li><li><b>Authorization (otorisasi)</b> — menentukan batas kewenangan: "setelah teridentifikasi sebagai Andi, bolehkah membangun project A tetapi tidak boleh mengubah konfigurasi server?" Dilakukan oleh <b>Authorization Strategy</b>.</li></ul><p>Pada instalasi awal, Jenkins Setup Wizard sudah menciptakan satu akun administrator, tetapi pengaturan keamanan lain masih bersifat bawaan. Sebelum dipakai bersama, buka Manage Jenkins → <b>Global Security</b> dan pastikan <i>Allow anonymous read access</i> tetap <b>mati</b> — tanpa itu, siapa pun yang bisa menjangkau port 8080 dapat melihat daftar job dan hasil build.</p>'
    },
    {
      type: 'text',
      html: '<h3>Security Realm: Sumber Daftar Pengguna</h3><p>Security Realm menentukan <i>di mana</i> Jenkins menemukan identitas pengguna. Pilihan yang umum dipakai:</p><ul><li><b>Local users</b> — pengguna dibuat dan dikelola di dalam Jenkins lewat Manage Jenkins → Users. Paling sederhana; cocok untuk tim kecil dan praktik lokal.</li><li><b>LDAP / Active Directory</b> — mencocokkan akun perusahaan; satu identitas untuk seluruh layanan internal. Memerlukan server LDAP yang bisa diakses.</li><li><b>GitHub OAuth</b> — memakai plugin gratis <b>GitHub OAuth</b>, pengguna cukup login memakai akun GitHub organisasimu. Keuntungannya: tidak ada kata sandi tambahan yang disimpan Jenkins, dan penambahan anggota tim cukup diatur dari GitHub.</li></ul><p>Untuk latihan lokal, <b>Local users</b> adalah pilihan paling praktis karena tidak memerlukan layanan tambahan apa pun.</p>'
    },
    {
      type: 'text',
      html: '<h3>Strategi Otorisasi untuk Tim</h3><p>Setelah identitas siap, tentukan siapa boleh melakukan apa. Tiga strategi utama:</p><ul><li><b>Matrix-based Security</b> — satu tabel izin untuk semua orang. Baris berisi tindakan (Overall/Read, Job/Build, Manage Jenkins) dan kolom berisi pengguna. Paling mudah dipahami, tetapi menjadi panjang bila pengguna banyak.</li><li><b>Project-based Matrix</b> — matrix yang sama, tetapi bisa diatur per job. Cocok bila tiap tim memegang proyeknya sendiri dan tidak boleh saling menyentuh.</li><li><b>Role-Based Access Control</b> (plugin <b>Role Strategy</b>) — definisikan peran sekali (misalnya "viewer", "developer", "admin"), lalu tetapkan peran ke pengguna atau grup. Paling terukur untuk organisasi besar.</li></ul><p>Contoh penerapan untuk tim kecil dengan Role Strategy:</p><ul><li>Peran <b>viewer</b> — Overall/Read, Job/Read: boleh melihat dashboard dan hasil build.</li><li>Peran <b>developer</b> — viewer ditambah Job/Build, Job/Cancel, Workspace/Read: boleh menjalankan build tetapi tidak menyentuh konfigurasi server.</li><li>Peran <b>admin</b> — Overall/Administer: kuasa penuh, hanya untuk penanggung jawab server.</li></ul><p>Buatlah pengguna bernama <code>developer</code> dengan izin Overall/Read saja, lalu <code>admin</code> dengan Overall/Administer, dan uji login keduanya. Menguji dari sisi penerima izin adalah cara terbaik memastikan pengaturan benar-benar bekerja.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 350" width="760" role="img" aria-label="Alur kredensial dari Credentials Store di Controller ke build di agent lalu ke tool atau registry">
        <rect x="20" y="60" width="230" height="210" rx="10" class="u-box"/>
        <text x="135" y="86" class="u-title" text-anchor="middle">Credentials Store (Controller)</text>
        <line x1="34" y1="96" x2="236" y2="96" class="u-line"/>
        <rect x="36" y="106" width="198" height="32" rx="6" class="u-hd"/>
        <text x="135" y="127" class="u-lbl" text-anchor="middle">Username + Password</text>
        <rect x="36" y="146" width="198" height="32" rx="6" class="u-box"/>
        <text x="135" y="167" class="u-lbl" text-anchor="middle">Secret text / API token</text>
        <rect x="36" y="186" width="198" height="32" rx="6" class="u-box"/>
        <text x="135" y="207" class="u-lbl" text-anchor="middle">SSH private key</text>
        <rect x="36" y="226" width="198" height="32" rx="6" class="u-box"/>
        <text x="135" y="247" class="u-lbl" text-anchor="middle">Certificate / Docker config</text>
        <rect x="310" y="90" width="200" height="150" rx="10" class="u-box"/>
        <text x="410" y="116" class="u-title" text-anchor="middle">Build di Agent</text>
        <line x1="323" y1="126" x2="497" y2="126" class="u-line"/>
        <rect x="323" y="136" width="174" height="30" rx="6" class="u-hd"/>
        <text x="410" y="155" class="u-lbl" text-anchor="middle">withCredentials([...])</text>
        <rect x="323" y="174" width="174" height="30" rx="6" class="u-box"/>
        <text x="410" y="193" class="u-lbl" text-anchor="middle">Variabel lingkungan</text>
        <rect x="323" y="212" width="174" height="30" rx="6" class="u-box"/>
        <text x="410" y="231" class="u-lbl" text-anchor="middle">Nilai dimasking ****</text>
        <rect x="560" y="90" width="180" height="150" rx="10" class="u-box"/>
        <text x="650" y="116" class="u-title" text-anchor="middle">Tool / Registry</text>
        <line x1="573" y1="126" x2="727" y2="126" class="u-line"/>
        <rect x="573" y="136" width="154" height="30" rx="6" class="u-box"/>
        <text x="650" y="155" class="u-lbl" text-anchor="middle">Git server</text>
        <rect x="573" y="174" width="154" height="30" rx="6" class="u-box"/>
        <text x="650" y="193" class="u-lbl" text-anchor="middle">Container registry</text>
        <rect x="573" y="212" width="154" height="30" rx="6" class="u-box"/>
        <text x="650" y="231" class="u-lbl" text-anchor="middle">Server deploy (SSH)</text>
        <line x1="252" y1="165" x2="306" y2="165" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="279" y="152" class="u-lbl" text-anchor="middle">ambil</text>
        <line x1="512" y1="165" x2="556" y2="165" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="534" y="152" class="u-lbl" text-anchor="middle">auth</text>
        <text x="380" y="312" class="u-lbl" text-anchor="middle">Rahasia hanya diambil saat dibutuhkan, nilai dimasking di log, dan tidak pernah ditulis di Jenkinsfile</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 4.1</b> — Alur kredensial: dari Credentials Store di Controller, dipakai saat build di Agent, diterima tool/registry</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Credentials Manager: Bank Rahasia Tim</h3><p>Credentials Manager adalah penyimpan resmi rahasia di Jenkins, buka lewat Manage Jenkins → Credentials. Lima jenis yang tersedia:</p><ul><li><b>Username with password</b> — pasangan akun dan kata sandi; lazim untuk akun registry container atau basis data.</li><li><b>Secret text</b> — satu string rahasia, seperti API token Slack atau token GitHub.</li><li><b>SSH Username with private key</b> — kunci privat untuk kloning repository atau deploy ke server via SSH.</li><li><b>Docker registry</b> — kombinasi akun registry Docker khusus, lengkap dengan domain registry-nya.</li><li><b>Certificate</b> — berkas keamanan SSL/TLS untuk layanan yang membutuhkan autentifikasi sertifikat.</li></ul><p>Dua hal menentukan seberapa aman pemakaian kredensial:</p><ul><li><b>Scope</b> — <i>Global</i> berarti tersedia bagi seluruh job di Jenkins ini; <i>System</i> berarti hanya untuk keperluan internal server dan tidak muncul di pemilihan pipeline. Pilih scope sesempit mungkin: Global hanya bila kredensial itu memang dipakai banyak job.</li><li><b>ID</b> — beri ID deskriptif dan stabil seperti <code>dockerhub-userpass</code> atau <code>deploy-staging-key</code>; ID inilah yang dipakai di pipeline, bukan nama tampilan.</li></ul>'
    },
    {
      type: 'example',
      title: 'Memakai Kredensial dari Pipeline dengan Aman',
      lang: 'groovy',
      output: false,
      code: `// Jenkinsfile — rahasia diambil dari Credentials Manager, bukan dari Git
pipeline {
    agent any

    environment {
        IMAGE_TAG = '1.0.0'
    }

    stages {
        stage('Rakit Image') {
            steps {
                sh 'podman build -t aplikasi:\${IMAGE_TAG} .'
            }
        }
        stage('Dorong ke Registry') {
            steps {
                script {
                    withCredentials([usernamePassword(
                        credentialsId: 'dockerhub-userpass',
                        usernameVariable: 'REG_USER',
                        passwordVariable: 'REG_PASS'
                    )]) {
                        sh 'podman login -u "$REG_USER" -p "$REG_PASS" docker.io'
                        sh 'podman push docker.io/\${REG_USER}/aplikasi:\${IMAGE_TAG}'
                    }
                }
            }
        }
    }

    post {
        always {
            echo 'Selesai — REG_PASS sudah dimasking otomatis di console log'
        }
    }
}`,
      explain: [
        'Blok <code>withCredentials</code> menyuntikkan nilai kredensial sebagai variabel lingkungan hanya selama bloknya berjalan; setelah itu nilainya dihapus dari memori proses build.',
        'Nama variabel bebas (<code>REG_USER</code>, <code>REG_PASS</code>) dan tidak boleh ditulis ulang ke berkas — cukup dipakai langsung oleh <code>sh</code>.',
        'Setiap kali nilai rahasia muncul di console log, Jenkins menggantinya dengan tanda <b>****</b>; masking ini perlindungan dasar, bukan enkripsi.',
        'Untuk kunci SSH gunakan <code>sshagent(credentials: [\'deploy-staging-key\'])</code> — pola yang sama, tinggal jenis kredensialnya berbeda.'
      ]
    },
    {
      type: 'example',
      title: 'Menambahkan Kunci SSH Lewat Antarmuka Web',
      lang: 'text',
      output: false,
      code: `1. Login sebagai admin → Manage Jenkins → Credentials → System
2. Klik Global credentials (unrestricted) → Add Credentials
3. Kind: pilih "SSH Username with private key"
4. Scope: Global (untuk dipakai job apa pun)
5. ID: deploy-staging-key
   (ini yang akan kamu tulis di pipeline, buat mudah diingat)
6. Username: deploy
7. Private Key: pilih "Enter directly", tempel isi berkas
   ~/.ssh/id_ed25519 milikmu
8. Deskripsi: Kunci deploy server staging
9. Klik OK, lalu uji kuncinya dari terminal:
   ssh -i id_ed25519 deploy@IP-STAGING 'hostname'
10. Jangan lupa: buat pasangan kunci khusus CI, jangan
    memakai kunci pribadimu yang juga dipakai untuk login`,
      explain: [
        'Memisahkan kunci CI dari kunci pribadi membuat penarikan akses semudah menghapus satu kredensial, tanpa mengganti kunci di banyak mesin.',
        'ID yang stabil membuat pipeline tetap berfungsi walau nama tampilan diubah.',
        'Uji kunci langsung dari terminal memastikan masalahnya bukan pada kunci sebelum kamu menyalahkannya pada Jenkins.',
        'Simpan kunci privat di clipboard sesingkat mungkin; hindari meninggalkan salinan di berkas catatan atau chat tim.'
      ]
    },
    {
      type: 'example',
      title: 'Mengelola Kredensial Lewat CLI',
      lang: 'bash',
      output: false,
      code: `# Siapkan klien CLI sekali saja (lihat pelajaran instalasi)
podman cp jenkins-server:/usr/share/jenkins/jenkins-cli.jar ./jenkins-cli.jar

# Daftar kredensial pada store sistem — nilai tidak pernah ditampilkan
java -jar jenkins-cli.jar \\
  -s http://localhost:8080/jenkins -auth admin:TOKEN_API \\
  list-credentials system::system::jenkins

# Tambah kredensial baru dari berkas XML (dibuat di bawah)
java -jar jenkins-cli.jar \\
  -s http://localhost:8080/jenkins -auth admin:TOKEN_API \\
  create-credentials system::system::jenkins < creds.xml

# Periksa ulang bahwa kredensial baru sudah tercatat
java -jar jenkins-cli.jar \\
  -s http://localhost:8080/jenkins -auth admin:TOKEN_API \\
  list-credentials system::system::jenkins`,
      explain: [
        '<code>list-credentials</code> menampilkan ID, jenis, dan deskripsi saja — nilai rahasia tidak pernah dicetak, bahkan ke administrator.',
        '<code>create-credentials</code> menerima berkas XML dari standar masuk, sehingga cocok untuk pemasangan massal banyak server Jenkins.',
        'Untuk penggunaan harian, menambah kredensial lewat UI tetap lebih aman karena berkas XML berisi nilai rahasia dan harus dihapus segera setelah dipakai.',
        'Selalu ganti nilai contoh dengan token sungguhan yang berscope paling kecil, dan jangan pernah meng-commit berkas <code>creds.xml</code> ke Git.'
      ]
    },
    {
      type: 'example',
      title: 'Berkas XML untuk create-credentials',
      lang: 'text',
      output: false,
      code: `<com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>
  <scope>GLOBAL</scope>
  <id>dockerhub-userpass</id>
  <description>Akun Docker Hub — pakai token, bukan kata sandi asli</description>
  <username>namamu</username>
  <password>TOKEN-DARI-REGISTRY</password>
</com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>`,
      explain: [
        'Tag terluar menentukan jenis kredensial; untuk token tunggal gunakan <code>StringCredentialsImpl</code>, dan untuk kunci SSH <code>BasicSSHUserPrivateKey</code>.',
        'Field <code>id</code> harus unik dan sama persis dengan yang ditulis pada blok <code>credentials(\'...\')</code> di pipeline.',
        'Isi <code>password</code> dengan token dari registry, bukan kata sandi utama — token bisa ditarik sewaktu-waktu tanpa mengganggu akun.',
        'Hapus berkas XML begitu perintah selesai: <code>shred -u creds.xml</code> di Linux atau hapus manual di macOS.'
      ]
    },
    {
      type: 'tip',
      title: 'Kebiasaan Kredensial yang Sehat',
      text: 'Gunakan token berscope paling kecil yang mampu menyelesaikan tugas (misalnya token Docker Hub hanya dengan izin push ke satu repository), rotasi berkala, dan aktifkan jejak audit dengan plugin gratis <b>Audit Trail</b> untuk mencatat siapa mengubah konfigurasi dan kredensial. Pengaturan log ini dapat ditemukan di Manage Jenkins setelah plugin terpasang.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Jangan pernah menulis token, kata sandi, atau kunci privat di dalam <code>Jenkinsfile</code>, Dockerfile, atau repository mana pun — riwayat Git permanen dan sulit dibersihkan. Hindari pula menempel nilai rahasia pada perintah <code>curl</code> dengan parameter <code>--user</code> tanpa masking, dan berhati-hatilah dengan opsi "Expose password" atau pencetakan variabel ke log: satu baris <code>echo</code> yang salah sudah cukup membocorkan rahasia ke siapa pun yang boleh membaca hasil build.'
    },
    {
      type: 'vocab',
      items: [
        ['Authentication', 'Proses memverifikasi identitas pengguna saat masuk ke Jenkins; ditentukan oleh Security Realm.'],
        ['Authorization', 'Penetapan kewenangan pengguna: apa yang boleh dilihat, dijalankan, dan diubah; ditentukan oleh Authorization Strategy.'],
        ['Security Realm', 'Sumber daftar pengguna Jenkins: local users, LDAP/Active Directory, atau GitHub OAuth melalui plugin.'],
        ['Matrix-based Security', 'Strategi otorisasi berupa tabel tunggal: baris tindakan, kolom pengguna, centang izin yang diberikan.'],
        ['Role-Based Access Control', 'Strategi otorisasi berbasis peran (plugin Role Strategy): definisikan peran sekali, tetapkan ke banyak pengguna.'],
        ['Credentials Manager', 'Penyimpan rahasia bawaan Jenkins di Manage Jenkins → Credentials, tempat kredensial disimpan dan dipanggil oleh build.'],
        ['Scope', 'Lingkup kredensial: Global (tersedia bagi semua job) atau System (hanya untuk keperluan internal server).'],
        ['withCredentials', 'Blok pada pipeline yang menyuntikkan kredensial sebagai variabel lingkungan selama langkah berjalan, lengkap dengan masking log.'],
        ['Masking', 'Penggantian otomatis nilai rahasia dengan tanda **** pada console log; perlindungan dasar, bukan enkripsi.']
      ]
    }
  ],
  recap: [
    'Authentication memverifikasi identitas lewat Security Realm; Authorization membatasi kewenangan lewat strategi seperti Matrix, Project-based Matrix, atau Role-Based Access Control.',
    'Untuk tim kecil, Local users sudah memadai; untuk organisasi, LDAP atau GitHub OAuth menghemat pengelolaan akun.',
    'Credentials Manager menyimpan lima jenis rahasia dengan scope Global atau System; aturan emasnya: rahasia tidak pernah ditulis di Jenkinsfile atau Git.',
    'Pipeline memanggil kredensial lewat ID pada blok withCredentials; nilai otomatis dimasking di log, dan audit log membantu melacak perubahan.'
  ]
});
