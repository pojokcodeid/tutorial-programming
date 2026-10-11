/* ============================================================
   Pelajaran Git & GitHub — Bab 3: Dasar-Dasar Git
   (topik info.md:
    - "cara membuat repository git pada project"
    - "workflow dasar (git init, git status, git add, git commit)")
   + bonus: .gitignore (praktis & sering dibutuhkan)
   ============================================================ */
'use strict';

window.GIT_LESSONS = window.GIT_LESSONS || [];

/* ---------- Pelajaran 4: Membuat Repository ---------- */
window.GIT_LESSONS.push({
  id: 'membuat-repository',
  title: 'Membuat Repository Git',
  chapter: 'Dasar-Dasar Git',
  duration: '7 menit',
  intro: [
    'Repository (repo) adalah jantung Git — tempat proyek dan seluruh riwayatnya disimpan. Ada dua cara membuat repo: dari folder yang sudah ada, atau menyalin dari server.',
    'Pelajaran ini membahas <code>git init</code> dan <code>git clone</code> beserta isi folder <code>.git</code> yang muncul.'
  ],
  objectives: [
    'Membuat repository baru dengan git init',
    'Menyalin repository dengan git clone',
    'Memahami fungsi folder .git'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Cara pertama: <code>git init</code></b> — mengubah folder biasa menjadi repository Git. Cocok untuk proyek yang sudah kamu mulai dari nol.</p>'
    },
    {
      type: 'example',
      title: 'Membuat repository dari folder yang ada',
      lang: 'bash',
      output: false,
      code: `cd proyek-saya
git init

# Keluaran:
# Initialized empty Git repository in /.../proyek-saya/.git/`,
      explain: [
        '<code>cd</code> memindahkan terminal ke folder proyek.',
        '<code>git init</code> membuat folder tersembunyi <code>.git</code> — di situlah seluruh database riwayat disimpan.',
        'Setelah ini, folder tersebut sudah menjadi repository Git yang bisa dipakai.'
      ]
    },
    {
      type: 'text',
      html: '<p><b>Cara kedua: <code>git clone</code></b> — menyalin repository dari server (mis. GitHub) beserta <b>seluruh riwayat commit</b> ke komputermu.</p>'
    },
    {
      type: 'example',
      title: 'Menyalin repository dari internet',
      lang: 'bash',
      output: false,
      code: `git clone https://github.com/pengguna/proyek.git

# Folder "proyek" otomatis dibuat berisi kode + riwayat

# Clone ke folder pilihan:
git clone https://github.com/pengguna/proyek.git proyek-ku`,
      explain: [
        'Git otomatis membuat folder bernama sesuai repository (di sini: <code>proyek</code>).',
        'Argumen kedua mengubah nama folder tujuan.',
        'Git juga otomatis mendaftarkan remote bernama <code>origin</code> yang menunjuk ke alamat sumber.'
      ]
    },
    {
      type: 'example',
      title: 'Isi folder .git (jangan diutak-atik)',
      lang: 'text',
      output: false,
      code: `proyek-saya/
├── .git/          ← database riwayat Git (rahasia!)
│   ├── objects/   ← semua commit & snapshot
│   ├── refs/      ← penunjuk cabang & tag
│   ├── config     ← konfigurasi proyek ini
│   └── HEAD       ← penunjuk cabang aktif
├── index.html
└── style.css`,
      explain: [
        'Folder <code>.git</code> adalah otak repository. Menghapusnya berarti menghapus seluruh riwayat.',
        'Semua berkas lain di luar <code>.git</code> disebut <b>working directory</b> — area kerjamu sehari-hari.'
      ]
    },
    {
      type: 'tip',
      title: '.git itu tersembunyi',
      text: 'Di Windows perlu centang "Hidden items", di macOS/Linux tekan <code>ls -a</code> untuk melihat folder <code>.git</code>. Sifat tersembunyi ini sengaja dibuat agar folder proyek tetap rapi.'
    },
    {
      type: 'vocab',
      items: [
        ['git init', 'Perintah mengubah folder biasa menjadi repository Git baru.'],
        ['git clone', 'Perintah menyalin repository remote beserta riwayatnya ke komputer lokal.'],
        ['.git', 'Folder tersembunyi yang menyimpan database seluruh riwayat proyek.'],
        ['origin', 'Nama bawaan remote yang dibuat otomatis saat clone.'],
        ['HEAD', 'Penunjuk yang menandai cabang/commit yang sedang aktif.']
      ]
    }
  ],
  recap: [
    'git init membuat repository di folder yang sudah ada.',
    'git clone menyalin repository remote beserta riwayat lengkapnya.',
    'Folder .git menyimpan seluruh database riwayat — jangan dihapus atau diedit manual.'
  ]
});

/* ---------- Pelajaran 5: Workflow Dasar ---------- */
window.GIT_LESSONS.push({
  id: 'workflow-dasar',
  title: 'Workflow Dasar: status, add, commit',
  chapter: 'Dasar-Dasar Git',
  duration: '10 menit',
  intro: [
    'Alur kerja Git harian bisa diringkas dalam tiga langkah: <b>edit → add → commit</b>. Di antara ketiganya ada area perantara bernama <b>staging area</b> yang jadi kunci memahami Git.',
    'Pelajaran ini membahas tiga area kerja Git dan perintah <code>git status</code>, <code>git add</code>, serta <code>git commit</code>.'
  ],
  objectives: [
    'Memahami tiga area: working directory, staging area, repository',
    'Menggunakan git status untuk memantau perubahan',
    'Menyiapkan perubahan dengan git add',
    'Menyimpan snapshot dengan git commit'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Setiap berkas melewati tiga area sebelum menjadi sejarah:</p><table class="vocab"><tr><th>Area</th><th>Artinya</th></tr><tr><td>Working Directory</td><td>Berkas nyata di folder proyek — tempat kamu menulis kode.</td></tr><tr><td>Staging Area (Index)</td><td>"Daftar belanja" perubahan yang akan dimasukkan ke commit berikutnya.</td></tr><tr><td>Repository (local)</td><td>Penyimpanan permanen commit — snapshot yang sudah diabadikan.</td></tr></table><p>Staging area memungkinkan kamu <b>memilih</b> perubahan mana yang masuk commit A dan mana yang masuk commit B — inilah kekuatan Git dibanding simpan-biasa.</p>'
    },
    {
      type: 'example',
      title: 'Melihat kondisi proyek',
      lang: 'bash',
      output: false,
      code: `git status

# Contoh keluaran:
# On branch main
# Changes not staged for commit:
#   modified:   index.html
# Untracked files:
#   style.css`,
      explain: [
        '<b>modified</b> = berkas sudah diubah tapi belum distaging.',
        '<b>untracked</b> = berkas baru yang belum dikenal Git.',
        '<code>git status</code> adalah perintah yang paling sering dipakai — jalankan sesering mungkin.'
      ]
    },
    {
      type: 'example',
      title: 'Menyiapkan perubahan (staging)',
      lang: 'bash',
      output: false,
      code: `git add index.html     # satu berkas
git add style.css      # berkas lain
git add .              # semua perubahan sekaligus`,
      explain: [
        '<code>git add</code> memindahkan perubahan ke <b>staging area</b>.',
        '<code>git add .</code> menyiapkan semua perubahan dan berkas baru.',
        'Perintah ini <b>belum</b> menyimpan permanen — hanya "mengantre".'
      ]
    },
    {
      type: 'example',
      title: 'Menyimpan snapshot (commit)',
      lang: 'bash',
      output: false,
      code: `git commit -m "Tambah halaman utama dan gaya dasar"

# Keluaran:
# [main 3f9c2a1] Tambah halaman utama dan gaya dasar
#  2 files changed, 25 insertions(+)`,
      explain: [
        '<code>git commit</code> mengabadikan isi staging area menjadi commit baru.',
        '<code>-m</code> menuliskan pesan langsung di baris perintah.',
        'Kode <code>3f9c2a1</code> adalah <b>hash</b> — identitas unik commit tersebut.'
      ]
    },
    {
      type: 'example',
      title: 'Setelah commit',
      lang: 'bash',
      output: false,
      code: `git status

# Keluaran:
# On branch main
# nothing to commit, working tree clean`,
      explain: [
        '<code>working tree clean</code> berarti tidak ada perubahan tersisa — semua sudah diabadikan.',
        'Siklus berikutnya tinggal diulang: edit → add → commit.'
      ]
    },
    {
      type: 'tip',
      title: 'Pesan commit yang baik',
      text: 'Tulis pesan yang menjelaskan <b>maksud</b>, bukan sekadar perintah. ❌ "fix bug" ❌ "update file". ✅ "Perbaiki tombol login tidak merespons di layar kecil". Pesan bagus membuat riwayat mudah dibaca berbulan-bulan kemudian.'
    },
    {
      type: 'warn',
      title: 'Hati-hati dengan git add .',
      text: '<code>git add .</code> ikut menstaging berkas yang tidak seharusnya (mis. file hasil build, log, atau data sensitif). Selalu periksa dengan <code>git status</code> sebelum commit.'
    },
    {
      type: 'vocab',
      items: [
        ['Staging area (index)', 'Area penampungan perubahan yang akan dimasukkan ke commit berikutnya.'],
        ['Commit', 'Snapshot permanen proyek, diidentifikasi oleh hash unik.'],
        ['Hash', 'Kode singkat (mis. 3f9c2a1) yang mengidentifikasi sebuah commit.'],
        ['Working tree clean', 'Status ketika tidak ada perubahan yang belum di-commit.'],
        ['Untracked', 'Berkas yang ada di folder tapi belum dilacak Git.']
      ]
    }
  ],
  recap: [
    'Alur dasar: edit → git add (staging) → git commit (simpan permanen).',
    'git status melaporkan perubahan, staging, dan berkas untracked.',
    'Pesan commit yang jelas membuat riwayat mudah dipahami di masa depan.'
  ]
});

/* ---------- Pelajaran 6: Mengabaikan Berkas ---------- */
window.GIT_LESSONS.push({
  id: 'mengabaikan-berkas',
  title: 'Mengabaikan Berkas dengan .gitignore',
  chapter: 'Dasar-Dasar Git',
  duration: '6 menit',
  intro: [
    'Proyek biasanya berisi berkas yang tidak perlu dicatat riwayatnya: hasil kompilasi, log, folder dependensi seperti <code>node_modules</code>. Di sinilah <b>.gitignore</b> dibutuhkan.',
    'Pelajaran ini membahas cara membuat pola pengabaian agar repository tetap ringan dan aman.'
  ],
  objectives: [
    'Memahami fungsi .gitignore',
    'Menulis pola pengabaian dasar',
    'Mengabaikan berkas yang sudah terlanjur dilacak'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>File <b>.gitignore</b> berisi daftar pola berkas yang <b>diabaikan</b> Git — tidak muncul sebagai untracked dan tidak bisa distaging. Manfaatnya: repository ringan, tidak ada kode rahasia atau sampah yang ikut ter-commit.</p>'
    },
    {
      type: 'example',
      title: 'Contoh isi .gitignore',
      lang: 'ini',
      output: false,
      code: `# Folder dependensi
node_modules/
vendor/

# File hasil build
dist/
build/

# Log & database sementara
*.log
*.tmp

# Rahasia — JANGAN pernah di-commit
.env
kunci-api.txt

# Abaikan semua, kecuali satu folder
# *
# !src/`,
      explain: [
        'Baris diawali <code>#</code> adalah komentar.',
        '<code>node_modules/</code> mengabaikan folder dan isinya; <code>*.log</code> mengabaikan semua berkas berekstensi .log.',
        '<code>.env</code> sering menyimpan kata sandi dan kunci API — wajib diabaikan.'
      ]
    },
    {
      type: 'tip',
      title: 'Letakkan di akar proyek',
      text: 'File .gitignore diletakkan di <b>akar repository</b>. Kamu juga boleh menaruh .gitignore di subfolder — polanya hanya berlaku untuk folder itu ke bawah.'
    },
    {
      type: 'example',
      title: 'Berkas sudah terlanjur dilacak?',
      lang: 'bash',
      output: false,
      code: `# Hentikan pelacakan (berkas tetap ada di folder):
git rm --cached data-lama.log

# Lalu commit perubahannya:
git commit -m "Hentikan pelacakan log lama"`,
      explain: [
        '.gitignore hanya bekerja untuk berkas yang <b>belum</b> dilacak.',
        '<code>git rm --cached</code> menghapus berkas dari pelacakan tanpa menghapus file-nya dari disk.'
      ]
    },
    {
      type: 'vocab',
      items: [
        ['.gitignore', 'Berkas berisi pola nama yang diabaikan Git.'],
        ['Pola (pattern)', 'Aturan nama berkas, mis. *.log atau dist/.'],
        ['git rm --cached', 'Menghapus berkas dari pelacakan tanpa menghapus file di disk.'],
        ['node_modules/', 'Folder dependensi yang hampir selalu diabaikan pada proyek JavaScript.']
      ]
    },
    {
      type: 'warn',
      title: 'Jangan abaikan .gitignore itu sendiri',
      text: 'Aneh tapi sering terjadi: orang menambahkan .gitignore ke .gitignore. Biarkan .gitignore ikut ter-commit agar aturan yang sama berlaku untuk seluruh tim.'
    }
  ],
  recap: [
    '.gitignore mencegah berkas tertentu dilacak Git — ringankan dan amankan repository.',
    'Pola umum: node_modules/, dist/, *.log, .env.',
    'Berkas yang sudah dilacak harus dihentikan dengan git rm --cached.'
  ]
});
