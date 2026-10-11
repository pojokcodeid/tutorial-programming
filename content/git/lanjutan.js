/* ============================================================
   Pelajaran Git & GitHub — Bab 7: Git Lanjutan
   (topik info.md:
    - "menggunakan git tag"
    - "history manipulation (git reset, git revert, git stash,
       git rebase, git cherry-pick)"
    - "git submodules & subtrees"
    - "git hooks")
   Catatan: reset & revert sudah dibahas mendalam di bab
   "Cabang (Branching)", pelajaran ini merangkumnya kembali
   bersama stash, rebase, dan cherry-pick.
   ============================================================ */
'use strict';

window.GIT_LESSONS = window.GIT_LESSONS || [];

/* ---------- Pelajaran 15: Tag ---------- */
window.GIT_LESSONS.push({
  id: 'git-tag',
  title: 'Menandai Versi dengan git tag',
  chapter: 'Git Lanjutan',
  duration: '7 menit',
  intro: [
    'Setiap rilis perangkat lunak butuh penanda: versi 1.0.0, 2.1.3, dan seterusnya. <b>Tag</b> adalah "pin" yang menempelkan nama pada sebuah commit tertentu.',
    'Pelajaran ini membahas tag ringan (lightweight) dan beranotasi (annotated), serta cara mengirimnya ke remote.'
  ],
  objectives: [
    'Memahami fungsi tag',
    'Membuat tag ringan dan beranotasi',
    'Melihat dan menghapus tag',
    'Mengirim tag ke remote'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Tag</b> mirip cabang yang tidak pernah bergerak: ia menunjuk satu commit selamanya. Kegunaan paling umum adalah <b>menandai rilis</b> sehingga siapa pun bisa mengunduh kode persis seperti versi yang dirilis.</p>'
    },
    {
      type: 'example',
      title: 'Membuat dua jenis tag',
      lang: 'bash',
      output: false,
      code: `# Tag ringan (hanya penunjuk):
git tag v1.0.0

# Tag beranotasi (recommended — punya penulis & tanggal):
git tag -a v1.0.0 -m "Rilis pertama untuk publik"

# Tag pada commit tertentu:
git tag -a v0.9.0 3c4b5a6 -m "Versi beta"`,
      explain: [
        '<b>Lightweight</b> hanyalah penunjuk tanpa metadata.',
        '<b>Annotated</b> menyimpan penulis, tanggal, dan pesan — jenis yang direkomendasikan untuk rilis.',
        'Tanpa argumen hash, tag menempel pada commit terakhir (HEAD).'
      ]
    },
    {
      type: 'example',
      title: 'Melihat dan menghapus tag',
      lang: 'bash',
      output: false,
      code: `# Daftar semua tag:
git tag

# Detail satu tag:
git show v1.0.0

# Hapus tag lokal:
git tag -d v1.0.0`,
      explain: [
        '<code>git tag</code> menampilkan tag berurutan abjad.',
        '<code>git show</code> pada tag menampilkan anotasi dan perubahan commit-nya.',
        'Tag dihapus dari lokal dengan <code>-d</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Mengirim tag ke remote',
      lang: 'bash',
      output: false,
      code: `# Kirim satu tag:
git push origin v1.0.0

# Kirim semua tag sekaligus:
git push origin --tags

# Hapus tag di remote:
git push origin --delete v1.0.0`,
      explain: [
        'Tag <b>tidak ikut</b> dalam push biasa — harus dikirim tersendiri.',
        '<code>--tags</code> mengunggah semua tag lokal.',
        'Untuk GitHub, tag beranotasi bisa dipakai sebagai <b>Release</b> di halaman proyek.'
      ]
    },
    {
      type: 'tip',
      title: 'Ikuti Semantic Versioning',
      text: 'Penomoran umum: <b>MAJOR.MINOR.PATCH</b> (mis. 2.1.3). MAJOR naik untuk perubahan besar, MINOR untuk fitur baru, PATCH untuk perbaikan kecil. Konvensi ini memudahkan semua orang memahami jangkauan perubahan.'
    },
    {
      type: 'vocab',
      items: [
        ['Tag', 'Penunjuk tetap pada satu commit, biasanya untuk versi rilis.'],
        ['Lightweight tag', 'Tag tanpa metadata — sekadar alias hash.'],
        ['Annotated tag', 'Tag lengkap dengan penulis, tanggal, dan pesan.'],
        ['Semantic Versioning', 'Konvensi penomoran versi MAJOR.MINOR.PATCH.'],
        ['Release', 'Paket rilis di GitHub yang biasanya dikaitkan dengan tag.']
      ]
    },
    {
      type: 'warn',
      title: 'Tag yang sudah dipakai',
      text: 'Git menolak membuat tag dengan nama yang sudah ada. Hapus dulu (<code>git tag -d</code>) atau pakai nama lain.'
    }
  ],
  recap: [
    'Tag menandai commit penting, biasanya rilis versi.',
    'Gunakan tag beranotasi (-a -m) untuk rilis resmi.',
    'Kirim tag ke remote dengan git push origin --tags.'
  ]
});

/* ---------- Pelajaran 16: Manipulasi History ---------- */
window.GIT_LESSONS.push({
  id: 'history-manipulation',
  title: 'Manipulasi History: stash, rebase, cherry-pick',
  chapter: 'Git Lanjutan',
  duration: '10 menit',
  intro: [
    'Selain commit biasa, Git punya peralatan untuk <b>menyusun ulang</b> riwayat: menyimpan sementara, memindahkan commit, atau memetik satu commit dari cabang lain.',
    'Pelajaran ini merangkum reset dan revert, lalu membahas stash, rebase, dan cherry-pick.'
  ],
  objectives: [
    'Menyimpan perubahan sementara dengan stash',
    'Menyusun ulang commit dengan rebase',
    'Memetik satu commit dengan cherry-pick',
    'Mengingat kembali kapan reset dan revert dipakai'
  ],
  sections: [
    {
      type: 'example',
      title: 'stash — simpan sementara',
      lang: 'bash',
      output: false,
      code: `# Simpan working directory yang belum rapi:
git stash

# Lihat daftar simpanan:
git stash list

# Kembalikan simpanan terbaru:
git stash pop

# Kembalikan tanpa menghapus dari daftar:
git stash apply`,
      explain: [
        'stash berguna saat kamu harus <b>pindah konteks</b> mendadak (mis. fix bug di main) tapi belum siap commit.',
        '<code>pop</code> mengembalikan sekaligus menghapus simpanan; <code>apply</code> membiarkannya tetap ada.',
        'stash juga bisa menyimpan perubahan yang sudah di-staging.'
      ]
    },
    {
      type: 'example',
      title: 'rebase — susun ulang di atas basis baru',
      lang: 'bash',
      output: false,
      code: `# Pindahkan commit cabang fitur ke ujung main:
git checkout fitur-login
git rebase main`,
      explain: [
        'rebase "memindahkan" deretan commit sehingga basisnya <b>commit terbaru main</b>.',
        'Hasilnya riwayat <b>lurus</b> tanpa commit merge — mudah dibaca.',
        'Proses: ambil commit cabang, pindahkan satu per satu ke ujung main.'
      ]
    },
    {
      type: 'warn',
      title: 'Jangan rebase commit yang sudah dibagikan',
      text: 'rebase mengubah hash commit. Jika commit sudah di-push dan dipakai orang lain, rebase akan menimbulkan kekacauan. Rebase hanya untuk commit <b>lokal yang belum dibagikan</b>.'
    },
    {
      type: 'example',
      title: 'cherry-pick — petik satu commit',
      lang: 'bash',
      output: false,
      code: `# Ambil satu commit dari cabang lain:
git checkout main
git cherry-pick a1b2c3d

# Bisa beberapa sekaligus:
git cherry-pick a1b2c3d e4f5g6h`,
      explain: [
        'cherry-pick menerapkan <b>hanya commit yang dipilih</b> ke cabang saat ini — tanpa menggabungkan seluruh cabang.',
        'Cocok untuk membawa satu perbaikan bug ke cabang rilis lama.',
        'Jika perubahan bentrok, Git akan berhenti dan memintamu menyelesaikannya.'
      ]
    },
    {
      type: 'text',
      html: '<p>Rangkuman perintah manipulasi sejarah:</p><table class="vocab"><tr><th>Perintah</th><th>Efek</th><th>Ubah sejarah?</th></tr><tr><td>git reset</td><td>Menggeser cabang mundur</td><td>Ya</td></tr><tr><td>git revert</td><td>Menambah commit pembatal</td><td>Tidak</td></tr><tr><td>git stash</td><td>Menyimpan/menarik perubahan sementara</td><td>Tidak</td></tr><tr><td>git rebase</td><td>Memindahkan commit ke basis baru</td><td>Ya</td></tr><tr><td>git cherry-pick</td><td>Menerapkan commit pilihan</td><td>Menambah commit baru</td></tr></table>'
    },
    {
      type: 'tip',
      title: 'Aturan praktis',
      text: 'Dalam proyek tim: <b>revert</b> untuk membatalkan commit bersama, <b>rebase</b> hanya untuk commit lokalmu sendiri, dan <b>stash</b> untuk jeda singkat. Jika ragu, pilih perintah yang <b>menambah</b> commit daripada mengubah yang sudah ada.'
    },
    {
      type: 'vocab',
      items: [
        ['git stash', 'Menyimpan working directory tidak rapi ke tumpukan sementara.'],
        ['git rebase', 'Memindahkan deretan commit ke ujung cabang lain.'],
        ['git cherry-pick', 'Menerapkan satu atau beberapa commit tertentu ke cabang aktif.'],
        ['Konflik cherry-pick', 'Bentrok saat perubahan yang dipetik tidak cocok dengan basis baru.']
      ]
    },
    {
      type: 'warn',
      title: 'stash bukan tempat penyimpanan permanen',
      text: 'Simpanan stash mudah terlupakan dan bisa terhapus saat pop konflik. Segera kembalikan (pop/apply) atau commit — jangan jadikan stash gudang penyimpanan.'
    }
  ],
  recap: [
    'stash menyimpan perubahan sementara saat harus pindah konteks.',
    'rebase menyusun ulang commit agar riwayat lurus — hanya untuk commit lokal.',
    'cherry-pick membawa satu commit dari cabang lain tanpa merge penuh.',
    'reset/revert sudah dibahas: reset mengubah sejarah, revert menambah commit pembatal.'
  ]
});

/* ---------- Pelajaran 17: Submodules & Subtrees ---------- */
window.GIT_LESSONS.push({
  id: 'submodules-subtrees',
  title: 'Git Submodules & Subtrees',
  chapter: 'Git Lanjutan',
  duration: '8 menit',
  intro: [
    'Proyek besar sering bergantung pada proyek lain: library utilitas, kerangka UI, atau aset bersama. Bagaimana menyertakannya tanpa menyalin-tempel manual?',
    'Pelajaran ini membahas dua solusi Git: <b>submodule</b> dan <b>subtree</b>.'
  ],
  objectives: [
    'Memahami fungsi submodule',
    'Menambahkan dan memperbarui submodule',
    'Memahami alternatif subtree',
    'Menentukan kapan masing-masing cocok dipakai'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Submodule</b> memungkinkan satu repository <b>menaut</b> repository lain pada commit tertentu, sebagai subfolder. Proyek luar tetap berdiri sendiri — kamu hanya menyimpan <b>penunjuk</b> ke commit-nya.</p>'
    },
    {
      type: 'example',
      title: 'Menambahkan submodule',
      lang: 'bash',
      output: false,
      code: `# Tautkan repo lain ke subfolder:
git submodule add https://github.com/pemilik/library.git libs/library

# Simpan penunjuknya:
git commit -m "Tautkan library sebagai submodule"`,
      explain: [
        'Git membuat folder <code>libs/library</code> berisi clone dari repository luar.',
        'Proyekmu menyimpan <b>commit ID</b> yang ditautkan, bukan seluruh kodenya.',
        'Berkas <code>.gitmodules</code> mencatat alamat dan jalur submodule.'
      ]
    },
    {
      type: 'example',
      title: 'Clone proyek yang punya submodule',
      lang: 'bash',
      output: false,
      code: `# Clone sekaligus inisialisasi submodule:
git clone --recurse-submodules https://github.com/kamu/proyek.git

# Atau, pada clone biasa:
git submodule init
git submodule update`,
      explain: [
        'Tanpa opsi itu, folder submodule akan <b>kosong</b>.',
        '<code>--recurse-submodules</code> otomatis mengambil isi submodule saat clone.'
      ]
    },
    {
      type: 'example',
      title: 'Memperbarui submodule',
      lang: 'bash',
      output: false,
      code: `# Ambil versi terbaru submodule:
git submodule update --remote

# Di dalam submodule, perlakukan seperti repo biasa:
cd libs/library
git checkout main
git pull`,
      explain: [
        '<code>update --remote</code> membawa submodule ke commit terbarunya.',
        'Setelah memperbarui, commit perubahan penunjuk di proyek utama.'
      ]
    },
    {
      type: 'text',
      html: '<p><b>Subtree</b> adalah pendekatan alternatif: kode proyek luar <b>disalin langsung</b> ke dalam repository-mu, bukan ditautkan.</p><table class="vocab"><tr><th>Aspek</th><th>Submodule</th><th>Subtree</th></tr><tr><td>Kode proyek luar</td><td>Ditautkan (referensi commit)</td><td>Disalin ke dalam repo</td></tr><tr><td>Clone</td><td>Perlu inisialisasi khusus</td><td>Langsung lengkap</td></tr><tr><td>Proyek luar tetap mandiri</td><td>Ya</td><td>Kopinya mandiri</td></tr><tr><td>Kompleksitas</td><td>Lebih tinggi</td><td>Lebih sederhana</td></tr><tr><td>Cocok untuk</td><td>Library yang sering update</td><td>Vendor kode jarang berubah</td></tr></table>'
    },
    {
      type: 'tip',
      title: 'Pilih yang sederhana dulu',
      text: 'Submodule kuat tapi sering membingungkan pemula (folder kosong, detached HEAD). Untuk dependensi kode, pertimbangkan dulu manajer paket (npm, dll). Submodule/subtree paling berguna ketika kamu harus memakai proyek Git yang <b>bukan</b> paket.'
    },
    {
      type: 'vocab',
      items: [
        ['Submodule', 'Repository lain yang ditautkan pada commit tertentu sebagai subfolder.'],
        ['.gitmodules', 'Berkas yang mencatat alamat dan jalur tiap submodule.'],
        ['Subtree', 'Teknik menyertakan proyek lain dengan menyalin kodenya ke repo utama.'],
        ['--recurse-submodules', 'Opsi clone yang otomatis mengambil isi submodule.']
      ]
    },
    {
      type: 'warn',
      title: 'Jangan edit submodule asal-asalan',
      text: 'Mengedit di dalam submodule menyentuh repository <b>terpisah</b>. Perubahan di sana tidak otomatis tersimpan di proyek utama.'
    }
  ],
  recap: [
    'Submodule menautkan repository lain pada commit tertentu.',
    'Clone proyek ber-submodule perlu --recurse-submodules atau init+update.',
    'Subtree menyalin kodenya langsung — lebih sederhana, tapi tidak terhubung ke upstream.'
  ]
});

/* ---------- Pelajaran 18: Git Hooks ---------- */
window.GIT_LESSONS.push({
  id: 'git-hooks',
  title: 'Otomatisasi dengan Git Hooks',
  chapter: 'Git Lanjutan',
  duration: '8 menit',
  intro: [
    'Bayangkan setiap commit otomatis menjalankan pengecekan: format kode, tes singkat, atau larangan kata sandi. Itulah <b>Git hooks</b> — skrip yang otomatis jalan saat peristiwa tertentu terjadi.',
    'Pelajaran ini membahas konsep hooks dan contoh hook yang paling sering dipakai.'
  ],
  objectives: [
    'Memahami apa itu git hooks',
    'Mengenal hook yang sering dipakai (pre-commit, post-merge)',
    'Membuat hook sederhana',
    'Memahami keterbatasan hooks'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Hook</b> adalah skrip yang disimpan di folder <code>.git/hooks/</code> dan otomatis dijalankan Git saat peristiwa tertentu — sebelum commit, setelah push, dan lain-lain. Skrip gagal bisa <b>menggagalkan</b> peristiwa itu.</p>'
    },
    {
      type: 'example',
      title: 'Melihat hooks bawaan',
      lang: 'bash',
      output: false,
      code: `ls .git/hooks

# Contoh isi folder:
# applypatch-msg.sample       pre-commit.sample
# commit-msg.sample           pre-push.sample
# post-commit.sample          prepare-commit-msg.sample
# ... (semua berekstensi .sample)`,
      explain: [
        'Git menyediakan <b>contoh</b> hook (.sample) untuk setiap peristiwa.',
        'Hook baru aktif setelah berekstensi <code>.sample</code> dihapus dan diberi izin jalan (executable).'
      ]
    },
    {
      type: 'example',
      title: 'Contoh hook pre-commit',
      lang: 'bash',
      output: false,
      code: `# Berkas: .git/hooks/pre-commit
# (hapus .sample, lalu beri izin: chmod +x pre-commit)

#!/bin/sh
# Larangan commit yang menyisakan kode debug
if git diff --cached | grep -i "console.log"; then
  echo "❌ Commit ditolak: masih ada console.log!"
  exit 1
fi
exit 0`,
      explain: [
        '<code>pre-commit</code> jalan sebelum commit dibuat; keluar dengan kode bukan nol akan <b>membatalkan</b> commit.',
        'Skrip memeriksa isi staging area untuk jejak <code>console.log</code>.',
        'Shebang <code>#!/bin/sh</code> menentukan penerjemah skrip.'
      ]
    },
    {
      type: 'example',
      title: 'Hook populer lainnya',
      lang: 'text',
      output: false,
      code: `pre-commit    sebelum commit (format, lint, tes cepat)
commit-msg    memeriksa format pesan commit
pre-push      sebelum push (jalankan tes lengkap)
post-merge    setelah merge (mis. install dependensi)
post-checkout setelah berpindah cabang
pre-receive   di server: menolak push yang tidak memenuhi aturan`,
      explain: [
        'Hook <b>sisi klien</b> (pre-commit, pre-push) hanya berlaku di komputermu.',
        'Hook <b>sisi server</b> (pre-receive) dipakai penyedia hosting untuk aturan bersama.',
        'Karena hook tidak ikut di-clone, tim biasanya memakai alat bantu seperti Husky atau menaruh skrip di luar .git.'
      ]
    },
    {
      type: 'tip',
      title: 'Hooks untuk proyek tim',
      text: 'Hook lokal tidak ikut terbawa clone. Untuk menegakkan aturan bersama, simpan skrip di folder proyek (mis. <code>scripts/</code>) dan instal ke <code>.git/hooks</code> lewat skrip setup, atau gunakan library seperti <b>Husky</b> (ekosistem npm) yang mengotomatiskannya.'
    },
    {
      type: 'vocab',
      items: [
        ['Git hook', 'Skrip yang otomatis jalan saat peristiwa Git tertentu.'],
        ['pre-commit', 'Hook yang jalan sebelum commit; bisa membatalkan commit.'],
        ['commit-msg', 'Hook yang memeriksa isi pesan commit.'],
        ['pre-push', 'Hook yang jalan sebelum push ke remote.'],
        ['Kode keluar (exit code)', 'Nilai kembalian skrip; bukan nol berarti gagal.'],
        ['Husky', 'Alat populer untuk mengelola hooks dalam proyek JavaScript.']
      ]
    },
    {
      type: 'warn',
      title: 'Hook tidak ikut di-clone',
      text: 'Folder <code>.git/hooks</code> tidak pernah disalin ke komputer lain. Hook bersifat <b>lokal</b> — anggota tim lain tidak otomatis mendapat hook milikmu.'
    }
  ],
  recap: [
    'Hooks adalah skrip di .git/hooks yang otomatis jalan saat peristiwa Git terjadi.',
    'pre-commit bisa menolak commit yang tidak memenuhi aturan.',
    'Hook tidak ikut di-clone; untuk tim, gunakan Husky atau skrip instalasi.'
  ]
});
