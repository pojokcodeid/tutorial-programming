/* ============================================================
   Pelajaran Git & GitHub — Bab 1: Pengenalan
   (topik info.md:
    - "memahami apa itu git, perbedaan sistem terpusat dan
       terdistribusi, serta fungsi repository (lokal vs remote)"
    - "kenapa penting untuk programmer")
   ============================================================ */
'use strict';

window.GIT_LESSONS = window.GIT_LESSONS || [];

/* ---------- Pelajaran 1: Apa itu Git ---------- */
window.GIT_LESSONS.push({
  id: 'apa-itu-git',
  title: 'Apa itu Git & Kontrol Versi',
  chapter: 'Pendahuluan',
  duration: '8 menit',
  intro: [
    'Pernahkah kamu menyimpan file dengan nama <code>tugas_akhir.doc</code>, <code>tugas_akhir2.doc</code>, lalu <code>tugas_akhir_FINAL.doc</code>? Itu adalah cara manual (dan berantakan) untuk mencatat perubahan. <b>Git</b> lahir untuk menggantikan kebiasaan itu.',
    'Pelajaran ini menjelaskan apa itu Git, bagaimana ia bekerja sebagai sistem kontrol versi, serta perbedaan sistem terpusat dan terdistribusi.'
  ],
  objectives: [
    'Memahami apa itu Git dan kontrol versi',
    'Membedakan sistem kontrol versi terpusat dan terdistribusi',
    'Memahami fungsi repository lokal dan repository remote'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Git</b> adalah <b>sistem kontrol versi</b> (version control system) yang diciptakan oleh <b>Linus Torvalds</b> pada tahun <b>2005</b> — ya, orang yang sama yang membuat kernel Linux. Git dibuat untuk mencatat <b>setiap perubahan</b> pada berkas proyek, siapa yang mengubahnya, kapan, dan mengapa.</p><p>Bayangkan Git seperti <b>mesin waktu untuk kode</b>: setiap kali kamu "menyimpan" (commit), Git mengabadikan foto (snapshot) seluruh proyek. Kapan pun kamu bisa kembali ke foto lama, membandingkannya dengan yang sekarang, atau membatalkan perubahan yang salah.</p>'
    },
    {
      type: 'example',
      title: 'Memeriksa Git sudah terinstal',
      lang: 'bash',
      output: false,
      code: `git --version

# Hasilnya kira-kira seperti ini:
# git version 2.43.0`,
      explain: [
        'Perintah <code>git --version</code> menampilkan versi Git yang terpasang di komputer.',
        'Jika muncul pesan error seperti <code>command not found</code>, artinya Git belum terinstal — dibahas di pelajaran berikutnya.'
      ]
    },
    {
      type: 'text',
      html: '<p>Ada dua model sistem kontrol versi yang wajib kamu ketahui:</p><table class="vocab"><tr><th>Sistem Terpusat (CVCS)</th><th>Sistem Terdistribusi (DVCS)</th></tr><tr><td>Satu server pusat menyimpan seluruh riwayat</td><td>Setiap komputer punya salinan lengkap riwayat</td></tr><tr><td>Contoh: SVN, CVS</td><td>Contoh: Git, Mercurial</td></tr><tr><td>Tanpa internet → tidak bisa menyimpan riwayat</td><td>Commit bisa dilakukan secara offline</td></tr><tr><td>Server rusak = riwayat hilang</td><td>Salinan di komputer manapun bisa jadi cadangan</td></tr></table><p>Git termasuk <b>sistem terdistribusi</b>. Karena itu kamu bisa commit secara offline di kereta, lalu menyinkronkannya nanti.</p>'
    },
    {
      type: 'text',
      html: '<p>Kata <b>repository</b> (sering disingkat <b>repo</b>) berarti "tempat penyimpanan proyek beserta riwayatnya". Dalam Git ada dua jenis repository:</p><table class="vocab"><tr><th>Repository Lokal</th><th>Repository Remote</th></tr><tr><td>Tersimpan di komputermu (folder proyek + folder .git)</td><td>Tersimpan di server, mis. GitHub, GitLab, atau Bitbucket</td></tr><tr><td>Kamu bekerja di sini sehari-hari</td><td>Tempat berbagi kode dengan tim</td></tr><tr><td>Diakses tanpa internet</td><td>Diakses lewat jaringan (git push / git pull)</td></tr></table><p>Kedua repository ini <b>selalu sinkron lewat perintah</b>: kamu mengirim commit lokal ke remote dengan <code>git push</code>, dan mengambil commit orang lain dengan <code>git pull</code>.</p>'
    },
    {
      type: 'tip',
      title: 'Git ≠ GitHub',
      text: '<b>Git</b> adalah alat (perangkat lunak) yang terinstal di komputermu. <b>GitHub</b> adalah layanan website yang menyediakan <b>repository remote</b> untuk menyimpan proyek Git di internet. Ibaratnya: Git adalah aplikasi pengolah katanya, GitHub adalah Google Docs-nya. Kamu bisa memakai Git tanpa GitHub sama sekali.'
    },
    {
      type: 'vocab',
      items: [
        ['Kontrol Versi (VCS)', 'Sistem yang mencatat perubahan berkas dari waktu ke waktu.'],
        ['Repository (repo)', 'Tempat penyimpanan proyek beserta seluruh riwayat perubahannya.'],
        ['Commit', 'Penyimpanan snapshot proyek pada satu titik waktu, lengkap dengan pesan penjelasan.'],
        ['Snapshot', 'Foto kondisi seluruh proyek pada saat commit dibuat.'],
        ['Working Directory', 'Folder proyek yang sedang kamu kerjakan saat ini.']
      ]
    },
    {
      type: 'warn',
      title: 'Jangan sampai tertukar',
      text: 'Git bukan bahasa pemrograman dan bukan layanan hosting. Git hanya mengelola <b>riwayat perubahan</b>. Anggap saja Git sebagai "penyimpan memori" proyekmu, bukan tempat menulis kode.'
    }
  ],
  recap: [
    'Git adalah sistem kontrol versi terdistribusi yang mencatat setiap perubahan proyek.',
    'Sistem terpusat menyimpan riwayat di satu server; sistem terdistribusi menyalin riwayat penuh ke setiap komputer.',
    'Repository lokal tinggal di komputermu; repository remote tinggal di server untuk kolaborasi tim.'
  ]
});

/* ---------- Pelajaran 2: Kenapa Git penting ---------- */
window.GIT_LESSONS.push({
  id: 'kenapa-git-penting',
  title: 'Kenapa Git Penting untuk Programmer',
  chapter: 'Pendahuluan',
  duration: '6 menit',
  intro: [
    'Mungkin kamu berpikir: "Saya kerja sendiri, pakai Ctrl+S saja cukup." Tunggu dulu — hampir semua lowongan kerja programmer mencantumkan Git sebagai syarat, dan ada alasan kuat di baliknya.',
    'Pelajaran ini membahas manfaat nyata Git dalam kehidupan sehari-hari seorang programmer.'
  ],
  objectives: [
    'Menyebutkan manfaat utama Git untuk pengembangan perangkat lunak',
    'Memahami cara Git melindungi kode dari kesalahan',
    'Memahami peran Git dalam kerja tim',
    'Menyadari bahwa Git berguna bahkan untuk proyek pribadi'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Berikut empat alasan mengapa Git hampir tidak bisa ditinggalkan oleh programmer modern:</p><ol><li><b>Riwayat lengkap</b> — setiap perubahan tercatat dengan nama, tanggal, dan alasan. Tiga bulan lalu kode masih jalan? Buka riwayat dan bandingkan.</li><li><b>Eksperimen tanpa rasa takut</b> — mau coba ide berisiko? Buat cabang (branch) khusus. Gagal? Hapus cabangnya, kode utama tetap aman.</li><li><b>Kerja tim tanpa saling menimpa</b> — lima orang boleh mengubah proyek yang sama tanpa menghancurkan hasil kerja satu sama lain.</li><li><b>Cadangan tersebar</b> — karena Git terdistribusi, setiap komputer anggota tim menyimpan salinan lengkap proyek.</li></ol>'
    },
    {
      type: 'example',
      title: 'Skenario nyata: kode tiba-tiba rusak',
      lang: 'text',
      output: false,
      code: `Kamu mengubah 10 berkas sekaligus, dan aplikasi malah error.

Tanpa Git:
  → panic, cari manual mana yang diubah, mungkin batal semua.

Dengan Git:
  $ git diff            # lihat persis apa yang berubah
  $ git log --oneline   # temukan commit terakhir yang sehat
  $ git checkout <id>   # kembali ke saat semuanya masih jalan

Waktu yang dibutuhkan: hitungan menit, bukan jam.`,
      explain: [
        '<code>git diff</code> menunjukkan perubahan baris per baris.',
        '<code>git log</code> membantu menemukan titik waktu ketika kode masih baik.',
        'Inilah yang disebut "mesin waktu" — Git membuat kerusakan dapat dipulihkan.'
      ]
    },
    {
      type: 'tip',
      title: 'Git juga untuk proyek solo',
      text: 'Bahkan jika kamu bekerja sendiri, Git tetap berguna: tugas sekolah, skripsi, catatan harian, hingga skrip pribadi. Riwayat perubahan membantumu mengingat <i>kapan</i> dan <i>mengapa</i> sebuah ide berubah — ingatan yang jauh lebih akurat daripada nama file berangka.'
    },
    {
      type: 'vocab',
      items: [
        ['Branch (cabang)', 'Jalur pengembangan terpisah agar eksperimen tidak mengganggu kode utama.'],
        ['Kolaborasi', 'Bekerja pada proyek yang sama tanpa saling menimpa hasil kerja.'],
        ['Riwayat (history)', 'Deretan commit dari masa lalu yang bisa ditelusuri kapan saja.'],
        ['Pemulihan (recovery)', 'Kemampuan mengembalikan proyek ke kondisi sebelumnya.']
      ]
    },
    {
      type: 'warn',
      title: 'Git tidak menggantikan backup',
      text: 'Git mencatat riwayat, tapi folder <code>.git</code> tetap bisa hilang jika komputermu rusak. Untuk proyek penting, tetap kirim (push) commit ke repository remote sebagai cadangan.'
    }
  ],
  recap: [
    'Git memberi riwayat lengkap, ruang eksperimen aman, dan kolaborasi tim yang rapi.',
    'Git memungkinkan pemulihan cepat saat kode rusak — menit, bukan jam.',
    'Git bermanfaat untuk proyek tim maupun proyek pribadi.',
    'Tetap lakukan push ke remote sebagai cadangan di luar komputer.'
  ]
});
