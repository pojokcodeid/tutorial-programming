/* ============================================================
   Kumpulan soal kuis Git & GitHub — diacak setiap hari oleh
   mesin kuis (teks q & options ditulis apa adanya; dirender
   dengan escaping)
   ============================================================ */
'use strict';

window.GIT_QUIZ_POOL = [
  {
    id: 'g01',
    q: 'Apa itu Git?',
    options: ['Sistem kontrol versi terdistribusi', 'Bahasa pemrograman web', 'Layanan hosting website', 'Database berbasis cloud'],
    answer: 0,
    explain: 'Git adalah sistem kontrol versi (version control system) terdistribusi yang diciptakan oleh Linus Torvalds pada 2005 untuk mengelola perubahan kode sumber.'
  },
  {
    id: 'g02',
    q: 'Perbedaan utama sistem kontrol versi terpusat dan terdistribusi adalah…',
    options: ['Pada sistem terdistribusi, setiap pengguna punya salinan lengkap riwayat proyek', 'Sistem terpusat lebih cepat daripada sistem terdistribusi', 'Sistem terdistribusi tidak bisa menyimpan riwayat', 'Sistem terpusat tidak memerlukan server'],
    answer: 0,
    explain: 'Pada sistem terdistribusi (seperti Git), setiap komputer menyimpan salinan penuh riwayat proyek. Pada sistem terpusat (seperti SVN), riwayat hanya tersimpan di satu server.'
  },
  {
    id: 'g03',
    q: 'Contoh sistem kontrol versi TERPUSAT adalah…',
    options: ['Subversion (SVN)', 'Git', 'Mercurial', 'Darcs'],
    answer: 0,
    explain: 'SVN (Subversion) adalah contoh klasik VCS terpusat: satu server menyimpan seluruh riwayat, klien hanya menyimpan snapshot terbaru.'
  },
  {
    id: 'g04',
    q: 'Repository remote adalah…',
    options: ['Salinan proyek yang tersimpan di server (mis. GitHub) untuk berbagi dan berkolaborasi', 'Folder proyek di komputer sendiri', 'File sementara saat proses commit', 'Cadangan otomatis dari sistem operasi'],
    answer: 0,
    explain: 'Repository remote tinggal di server (GitHub, GitLab, dll) dan menjadi tempat bertemu antaranggota tim. Repository lokal tinggal di komputer kamu.'
  },
  {
    id: 'g05',
    q: 'Kenapa Git penting bagi seorang programmer?',
    options: ['Semua jawaban benar: mencatat riwayat, memudahkan kerja tim, dan eksperimen tanpa takut rusak', 'Hanya agar bisa menyimpan file di internet', 'Untuk mempercepat koneksi internet', 'Untuk mengganti fungsi sistem operasi'],
    answer: 0,
    explain: 'Git mencatat setiap perubahan, memungkinkan kolaborasi tim tanpa saling menimpa, dan memberi ruang eksperimen aman lewat cabang.'
  },
  {
    id: 'g06',
    q: 'Perintah untuk mengecek versi Git yang terinstal adalah…',
    options: ['git --version', 'git version-check', 'git -v', 'version git'],
    answer: 0,
    explain: 'git --version menampilkan versi Git yang terpasang, misalnya git version 2.43.0.'
  },
  {
    id: 'g07',
    q: 'Perintah mengatur nama pengguna yang dicatat di setiap commit adalah…',
    options: ['git config --global user.name "Nama"', 'git set name "Nama"', 'git user name "Nama"', 'git config user "Nama"'],
    answer: 0,
    explain: 'git config --global user.name "Nama" menyimpan nama penulis commit di semua proyek pada komputer tersebut.'
  },
  {
    id: 'g08',
    q: 'Opsi --global pada git config berarti…',
    options: ['Pengaturan berlaku untuk semua proyek milik pengguna di komputer itu', 'Pengaturan berlaku untuk seluruh internet', 'Pengaturan hanya berlaku sekali', 'Pengaturan disimpan di server GitHub'],
    answer: 0,
    explain: '--global menyimpan konfigurasi di file ~/.gitconfig milik pengguna. Tanpa --global, pengaturan hanya berlaku di proyek saat ini.'
  },
  {
    id: 'g09',
    q: 'Perintah untuk melihat seluruh konfigurasi Git yang aktif adalah…',
    options: ['git config --list', 'git show config', 'git list config', 'git config --all'],
    answer: 0,
    explain: 'git config --list (atau git config -l) menampilkan semua pengaturan aktif beserta asal file-nya.'
  },
  {
    id: 'g10',
    q: 'Perintah membuat repository Git baru di folder proyek adalah…',
    options: ['git init', 'git start', 'git new', 'git create'],
    answer: 0,
    explain: 'git init membuat folder .git tersembunyi yang berisi seluruh database riwayat proyek.'
  },
  {
    id: 'g11',
    q: 'Perintah menyalin repository dari server ke komputer lokal adalah…',
    options: ['git clone <url>', 'git copy <url>', 'git pull <url>', 'git fetch <url>'],
    answer: 0,
    explain: 'git clone mengunduh proyek beserta seluruh riwayat commit-nya, lalu membuat folder kerja lokal.'
  },
  {
    id: 'g12',
    q: 'git status digunakan untuk…',
    options: ['Melihat perubahan yang belum/staging dan cabang aktif', 'Menyimpan perubahan ke repository', 'Memindahkan file ke cabang lain', 'Menghapus file dari proyek'],
    answer: 0,
    explain: 'git status melaporkan cabang aktif, file yang berubah, dan file yang sudah masuk area staging — perintah paling sering dipakai.'
  },
  {
    id: 'g13',
    q: 'Fungsi git add adalah…',
    options: ['Memindahkan perubahan ke area staging (index)', 'Langsung menyimpan permanen ke repository', 'Menambahkan file baru ke server remote', 'Mengabaikan file dari pelacakan'],
    answer: 0,
    explain: 'git add hanya menyiapkan (staging) perubahan. Perubahan baru benar-benar tersimpan setelah git commit.'
  },
  {
    id: 'g14',
    q: 'Fungsi git commit adalah…',
    options: ['Menyimpan snapshot permanen dari area staging beserta pesan', 'Mengunggah kode ke GitHub', 'Membuat cabang baru', 'Menampilkan riwayat perubahan'],
    answer: 0,
    explain: 'git commit mengabadikan isi staging area menjadi commit (snapshot) di repository lokal, lengkap dengan pesan penjelasan.'
  },
  {
    id: 'g15',
    q: 'Perintah commit dengan pesan singkat adalah…',
    options: ['git commit -m "pesan"', 'git commit --msg "pesan"', 'git commit "pesan"', 'git commit -s "pesan"'],
    answer: 0,
    explain: '-m (message) menuliskan pesan commit langsung di baris perintah tanpa membuka editor teks.'
  },
  {
    id: 'g16',
    q: 'File .gitignore berfungsi untuk…',
    options: ['Mengecualikan file tertentu agar tidak dilacak Git', 'Mengabaikan kesalahan saat commit', 'Menyembunyikan folder .git dari pandangan', 'Menonaktifkan Git sementara waktu'],
    answer: 0,
    explain: '.gitignore berisi pola file (mis. node_modules/, *.log) yang tidak boleh dikendalikan versinya oleh Git.'
  },
  {
    id: 'g17',
    q: 'git log menampilkan…',
    options: ['Daftar commit dari yang terbaru ke terlama', 'Daftar file yang diabaikan', 'Perbedaan antar dua file', 'Daftar cabang yang ada'],
    answer: 0,
    explain: 'git log menelusuri riwayat commit secara mundur. Tambahkan --oneline agar ringkas atau --graph untuk melihat percabangan.'
  },
  {
    id: 'g18',
    q: 'Perintah melihat riwayat dalam satu baris per commit adalah…',
    options: ['git log --oneline', 'git log -1', 'git history', 'git log --short'],
    answer: 0,
    explain: 'git log --oneline menampilkan tiap commit dalam satu baris: kode singkat hash + pesan commit.'
  },
  {
    id: 'g19',
    q: 'git diff digunakan untuk…',
    options: ['Melihat perbedaan antar versi isi file', 'Menghapus perbedaan file', 'Menggabungkan dua cabang', 'Mengunduh perubahan dari remote'],
    answer: 0,
    explain: 'git diff menampilkan baris yang ditambah (+) atau dihapus (-) antara working directory, staging area, dan commit terakhir.'
  },
  {
    id: 'g20',
    q: 'Untuk membatalkan perubahan pada file di working directory (kembali ke isi commit terakhir), gunakan…',
    options: ['git restore <file>', 'git diff <file>', 'git add <file>', 'git log <file>'],
    answer: 0,
    explain: 'git restore <file> mengembalikan file ke isi commit terakhir. Hati-hati: perubahan yang belum di-staging akan hilang permanen.'
  },
  {
    id: 'g21',
    q: 'Kegunaan utama membuat cabang (branch) adalah…',
    options: ['Mengembangkan fitur secara terpisah tanpa mengganggu kode utama', 'Menyalin proyek ke komputer lain', 'Mengurangi ukuran repository', 'Menghapus commit lama'],
    answer: 0,
    explain: 'Cabang memisahkan pekerjaan sehingga eksperimen gagal tidak merusak kode utama — ini cara Git mencegah konflik dan kerusakan.'
  },
  {
    id: 'g22',
    q: 'Perintah membuat dan langsung berpindah ke cabang baru adalah…',
    options: ['git checkout -b <nama>', 'git branch -d <nama>', 'git merge <nama>', 'git switch -r <nama>'],
    answer: 0,
    explain: 'git checkout -b nama membuat cabang baru sekaligus memindahkan HEAD ke sana. (Di Git baru: git switch -c nama.)'
  },
  {
    id: 'g23',
    q: 'Perintah menggabungkan cabang fitur ke cabang utama adalah…',
    options: ['git merge <nama-cabang>', 'git join <nama-cabang>', 'git combine <nama-cabang>', 'git link <nama-cabang>'],
    answer: 0,
    explain: 'Dari cabang tujuan (mis. main), jalankan git merge nama-cabang untuk menyatukan perubahannya.'
  },
  {
    id: 'g24',
    q: 'Apa yang terjadi saat dua cabang mengubah baris yang sama dan digabungkan?',
    options: ['Konflik merge yang harus diselesaikan manual', 'Git otomatis menghapus salah satu perubahan', 'Repository rusak permanen', 'Cabang otomatis terhapus'],
    answer: 0,
    explain: 'Git berhenti di konflik dan menandai bagian yang bertabrakan di file; kamu memilih bagian mana yang dipertahankan, lalu commit kembali.'
  },
  {
    id: 'g25',
    q: 'Perintah menambahkan alamat repository remote adalah…',
    options: ['git remote add <nama> <url>', 'git remote create <url>', 'git add remote <url>', 'git connect <url>'],
    answer: 0,
    explain: 'git remote add origin <url> mendaftarkan repository remote. Umumnya diberi nama "origin" sebagai standar.'
  },
  {
    id: 'g26',
    q: 'Perintah mengunggah commit lokal ke repository remote adalah…',
    options: ['git push', 'git pull', 'git fetch', 'git upload'],
    answer: 0,
    explain: 'git push mengirim commit lokal ke remote (mis. git push origin main). pull dan fetch justru mengunduh dari remote.'
  },
  {
    id: 'g27',
    q: 'Perbedaan git fetch dan git pull adalah…',
    options: ['fetch hanya mengunduh data remote, pull mengunduh sekaligus menggabungkannya', 'fetch mengunggah, pull mengunduh', 'Tidak ada perbedaan', 'pull hanya untuk cabang baru'],
    answer: 0,
    explain: 'git fetch memperbarui informasi remote secara aman tanpa menyentuh kerja kamu; git pull = fetch + merge ke cabang aktif.'
  },
  {
    id: 'g28',
    q: 'Untuk berkontribusi ke proyek open source di GitHub, langkah khas yang dilakukan adalah…',
    options: ['Fork → clone → buat cabang → commit → push → Pull Request', 'Push → fork → merge → clone', 'Clone → edit langsung di main → push', 'Email kode ke pemilik proyek'],
    answer: 0,
    explain: 'Alur standar: forking menyalin proyek ke akunmu, lalu kamu kerjakan di cabang terpisah dan mengusulkan gabungan lewat Pull Request.'
  },
  {
    id: 'g29',
    q: 'git tag biasanya dipakai untuk…',
    options: ['Menandai titik penting seperti versi rilis (v1.0.0)', 'Menghapus commit lama', 'Mengganti nama cabang', 'Menyembunyikan file'],
    answer: 0,
    explain: 'Tag adalah penanda commit, biasanya untuk versi rilis. git tag -a v1.0.0 -m "Rilis 1" membuat tag beranotasi.'
  },
  {
    id: 'g30',
    q: 'Fungsi git stash adalah…',
    options: ['Menyimpan sementara perubahan yang belum siap commit', 'Menghapus permanen file', 'Menggabungkan remote', 'Membuat cabang tersembunyi'],
    answer: 0,
    explain: 'git stash "menyimpan" working directory yang belum rapi sehingga kamu bisa pindah konteks, lalu melanjutkannya dengan git stash pop.'
  },
  {
    id: 'g31',
    q: 'Perintah mengubah commit terakhir (mis. menambah file yang terlupa) adalah…',
    options: ['git commit --amend', 'git commit --fix', 'git reset --last', 'git redo'],
    answer: 0,
    explain: 'git commit --amend mengganti commit terakhir dengan snapshot terbaru — berguna untuk menambah file atau memperbaiki pesan.'
  },
  {
    id: 'g32',
    q: 'Perbedaan git reset dan git revert adalah…',
    options: ['reset memutar ulang sejarah (berbahaya di remote), revert menambah commit baru yang membatalkan perubahan', 'reset lebih aman untuk proyek tim', 'revert menghapus file, reset menghapus cabang', 'Keduanya identik'],
    answer: 0,
    explain: 'reset menggeser posisi cabang ke belakang (mengubah sejarah), sedangkan revert menciptakan commit baru yang membatalkan commit lama tanpa mengubah sejarah.'
  },
  {
    id: 'g33',
    q: 'git rebase digunakan untuk…',
    options: ['Memindahkan/menyusun ulang commit di atas basis yang lebih baru', 'Menghapus seluruh repository', 'Mengunduh dari remote', 'Membuat tag otomatis'],
    answer: 0,
    explain: 'rebase "memindahkan" deretan commit ke ujung cabang lain sehingga riwayat tampak lurus. Hindari rebase pada commit yang sudah dibagikan.'
  },
  {
    id: 'g34',
    q: 'git cherry-pick berfungsi untuk…',
    options: ['Mengambil satu commit tertentu dari cabang lain', 'Memilih file untuk di-staging', 'Memilih cabang aktif', 'Menghapus commit terpilih'],
    answer: 0,
    explain: 'cherry-pick <hash> menerapkan satu commit dari cabang lain ke cabang saat ini tanpa menggabungkan seluruh cabang.'
  },
  {
    id: 'g35',
    q: 'Git hooks adalah…',
    options: ['Skrip yang dijalankan otomatis saat peristiwa tertentu di Git', 'Perintah untuk menghubungkan remote', 'Jenis branch khusus', 'File untuk menyimpan kata sandi'],
    answer: 0,
    explain: 'Hooks berupa skrip di folder .git/hooks (mis. pre-commit) yang otomatis jalan sebelum/menusai aksi seperti commit atau push.'
  },
  {
    id: 'g36',
    q: 'Git submodule digunakan untuk…',
    options: ['Menyertakan repository lain sebagai subfolder dalam proyek', 'Menyembunyikan modul dari Git', 'Menggabungkan semua cabang', 'Menghapus riwayat proyek'],
    answer: 0,
    explain: 'Submodule menautkan repository eksternal pada commit tertentu. Subtree adalah alternatif yang menyalin kodenya langsung ke dalam proyek.'
  },
  {
    id: 'g37',
    q: 'Perintah melihat daftar cabang yang ada adalah…',
    options: ['git branch', 'git branches', 'git list', 'git checkout'],
    answer: 0,
    explain: 'git branch menampilkan cabang lokal; tanda * menandai cabang yang sedang aktif. git branch -a menampilkan cabang remote juga.'
  },
  {
    id: 'g38',
    q: 'Perintah berpindah ke cabang yang sudah ada adalah…',
    options: ['git checkout <nama>', 'git branch <nama>', 'git merge <nama>', 'git tag <nama>'],
    answer: 0,
    explain: 'git checkout nama memindahkan working directory ke cabang tersebut. (Git modern juga punya git switch nama.)'
  },
  {
    id: 'g39',
    q: 'Alamat remote bawaan yang umum dipakai saat meng-clone dari GitHub adalah…',
    options: ['origin', 'main', 'master', 'upstream'],
    answer: 0,
    explain: 'Saat clone, Git otomatis mendaftarkan remote dengan nama "origin". "upstream" biasa dipakai untuk proyek asal setelah forking.'
  },
  {
    id: 'g40',
    q: 'Yang BUKAN bagian dari alur kerja dasar Git adalah…',
    options: ['git deploy', 'git add', 'git commit', 'git status'],
    answer: 0,
    explain: 'Alur dasar: edit → git add (staging) → git commit (simpan) → (opsional) git push. "git deploy" bukan perintah Git bawaan.'
  }
];
