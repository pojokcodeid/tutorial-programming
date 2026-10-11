/* ============================================================
   Pelajaran Git & GitHub — Bab 4: Riwayat & Revisi
   (topik info.md:
    - "navigasi & inspeksi history (git log, git diff, git checkout)"
    - "melihat catatan log revisi"
    - "melihat perbandingan revisi dengan git diff"
    - "perintah untuk membatalkan revisi")
   ============================================================ */
'use strict';

window.GIT_LESSONS = window.GIT_LESSONS || [];

/* ---------- Pelajaran 7: Navigasi & Inspeksi History ---------- */
window.GIT_LESSONS.push({
  id: 'navigasi-history',
  title: 'Menelusuri Riwayat dengan git log',
  chapter: 'Riwayat & Revisi',
  duration: '8 menit',
  intro: [
    'Setiap commit adalah titik dalam garis waktu proyek. Perintah <code>git log</code> adalah mesin waktu yang memungkinkanmu berjalan mundur: melihat siapa, kapan, dan apa yang berubah.',
    'Pelajaran ini membahas cara membaca catatan log revisi dan pilihan tampilan yang paling berguna.'
  ],
  objectives: [
    'Membaca catatan log revisi dengan git log',
    'Menggunakan --oneline dan --graph untuk tampilan ringkas',
    'Memfilter log berdasarkan berkas atau penulis',
    'Menggunakan git checkout untuk melihat versi lama'
  ],
  sections: [
    {
      type: 'example',
      title: 'Catatan log lengkap',
      lang: 'bash',
      output: false,
      code: `git log

# Keluaran:
# commit a1b2c3d4e5f6...
# Author: Nama Kamu <email@kamu.com>
# Date:   Mon Oct 6 10:15:02 2025 +0700
#
#     Tambah halaman utama dan gaya dasar`,
      explain: [
        'Setiap entri menampilkan <b>hash</b> lengkap, penulis, tanggal, dan pesan commit.',
        'Urutan: commit terbaru di atas, makin ke bawah makin lama.',
        'Tekan <code>q</code> untuk keluar dari penampil log.'
      ]
    },
    {
      type: 'example',
      title: 'Tampilan ringkas dan grafik',
      lang: 'bash',
      output: false,
      code: `git log --oneline

# a1b2c3d Tambah halaman utama dan gaya dasar
# 9f8e7d6 Perbaiki typo di navigasi
# 3c4b5a6 Commit awal

git log --oneline --graph --all

# * 3c4b5a6 (HEAD -> main) Commit awal
# ...`,
      explain: [
        '<code>--oneline</code> menampilkan satu baris per commit — paling sering dipakai.',
        '<code>--graph</code> menggambar cabang dan titik penggabungan sebagai ASCII art.',
        '<code>--all</code> menyertakan semua cabang, bukan hanya yang aktif.'
      ]
    },
    {
      type: 'example',
      title: 'Memfilter riwayat',
      lang: 'bash',
      output: false,
      code: `# Riwayat satu berkas saja:
git log -- index.html

# Riwayat dari penulis tertentu:
git log --author="Nama Kamu"

# Perubahan dalam 7 hari terakhir:
git log --since="7 days ago"

# Hanya 5 commit terakhir:
git log -5`,
      explain: [
        'Filter mempercepat pencarian saat riwayat sudah panjang.',
        'Kombinasikan filter, mis. <code>git log --oneline -- index.html</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Melihat isi commit tertentu',
      lang: 'bash',
      output: false,
      code: `git show 9f8e7d6

# Menampilkan: detail commit + perbedaan (diff)
# yang dibawa commit tersebut`,
      explain: [
        '<code>git show <hash></code> menampilkan satu commit lengkap beserta perubahan isinya.',
        'Hash bisa ditulis singkat — cukup 4-7 karakter awal.'
      ]
    },
    {
      type: 'example',
      title: 'Melompat ke versi lama (checkout)',
      lang: 'bash',
      output: false,
      code: `git checkout 3c4b5a6

# Kini working directory berisi proyek
# seperti pada commit tersebut.

# Kembali ke cabang terbaru:
git checkout main`,
      explain: [
        '<code>git checkout <hash></code> memindahkan working directory ke versi lama (mode "detached HEAD").',
        'Untuk kembali, pindah ke nama cabang, mis. <code>git checkout main</code>.',
        'Mode ini hanya untuk <b>melihat</b>; untuk mengubah, buat cabang baru dulu.'
      ]
    },
    {
      type: 'tip',
      title: 'Alias yang sangat membantu',
      text: 'Banyak pengembang menambahkan <code>git config --global alias.lg "log --oneline --graph --all"</code> sehingga cukup mengetik <code>git lg</code> untuk melihat peta seluruh riwayat.'
    },
    {
      type: 'vocab',
      items: [
        ['git log', 'Perintah menampilkan deretan commit dari terbaru ke terlama.'],
        ['--oneline', 'Opsi menampilkan tiap commit dalam satu baris.'],
        ['--graph', 'Opsi menggambar percabangan riwayat.'],
        ['git show', 'Menampilkan detail satu commit beserta diff-nya.'],
        ['Detached HEAD', 'Kondisi ketika HEAD menunjuk commit, bukan cabang.']
      ]
    },
    {
      type: 'warn',
      title: 'Hati-hati mengedit di detached HEAD',
      text: 'Commit yang dibuat di detached HEAD bisa "hilang" dari peta cabang saat kamu berpindah. Untuk bereksperimen, buat cabang baru: <code>git switch -c coba-coba</code>.'
    }
  ],
  recap: [
    'git log menampilkan riwayat commit; --oneline membuatnya ringkas.',
    'git show <hash> menampilkan detail dan perubahan satu commit.',
    'git checkout <hash> membuka versi lama; kembali dengan checkout nama-cabang.'
  ]
});

/* ---------- Pelajaran 8: Membandingkan Revisi ---------- */
window.GIT_LESSONS.push({
  id: 'membandingkan-revisi',
  title: 'Membandingkan Revisi dengan git diff',
  chapter: 'Riwayat & Revisi',
  duration: '7 menit',
  intro: [
    'Setelah tahu <i>kapan</i> perubahan terjadi (git log), kamu perlu tahu <i>apa</i> yang berubah. Perintah <code>git diff</code> menunjukkan perbedaan baris per baris.',
    'Pelajaran ini membahas perbandingan antara working directory, staging area, dan commit.'
  ],
  objectives: [
    'Membaca keluaran git diff (tanda + dan -)',
    'Membandingkan working directory dengan staging/commit',
    'Membandingkan dua commit atau dua cabang',
    'Membatasi diff pada satu berkas'
  ],
  sections: [
    {
      type: 'example',
      title: 'Perubahan yang belum distaging',
      lang: 'bash',
      output: false,
      code: `git diff

# Keluaran:
# diff --git a/index.html b/index.html
# index 3f9c2a1..7e4d8b2 100644
# --- a/index.html
# +++ b/index.html
# @@ -1,4 +1,5 @@
#  <h1>Belajar Git</h1>
#  <p>Materi pertama.</p>
# +<p>Paragraf baru ditambahkan.</p>
#  </body>`,
      explain: [
        'Baris dengan tanda <b>-</b> (merah) = dihapus, tanda <b>+</b> (hijau) = ditambah.',
        'Tanpa argumen, <code>git diff</code> membandingkan working directory vs <b>staging area</b>.',
        'Simbol <code>@@ -1,4 +1,5 @@</code> menunjukkan lokasi perubahan (baris 1-4 menjadi 1-5).'
      ]
    },
    {
      type: 'example',
      title: 'Apa yang sudah distaging',
      lang: 'bash',
      output: false,
      code: `git diff --staged

# Membandingkan staging area dengan commit terakhir.
# Berguna untuk memeriksa isi sebelum commit.`,
      explain: [
        '<code>git diff --staged</code> (dulunya <code>--cached</code>) menampilkan perubahan yang sudah di-staging.',
        'Jalankan ini tepat sebelum <code>git commit</code> untuk memastikan tidak ada yang salah masuk.'
      ]
    },
    {
      type: 'example',
      title: 'Membandingkan dua titik waktu',
      lang: 'bash',
      output: false,
      code: `# Commit terakhir vs commit sebelumnya:
git diff HEAD~1

# Dua commit tertentu:
git diff 3c4b5a6 a1b2c3d

# Dua cabang:
git diff main fitur-login

# Satu berkas saja:
git diff index.html`,
      explain: [
        '<code>HEAD~1</code> berarti "satu commit sebelum posisi sekarang".',
        '<code>git diff cabangA cabangB</code> membandingkan ujung kedua cabang.',
        'Menambahkan nama berkas membatasi keluaran hanya pada berkas itu.'
      ]
    },
    {
      type: 'tip',
      title: 'Diff dalam format warna',
      text: 'Dengan <code>git config --global color.ui auto</code> (sudah kita atur di bab sebelumnya), baris yang dihapus tampil merah dan yang ditambah hijau — jauh lebih mudah dibaca.'
    },
    {
      type: 'vocab',
      items: [
        ['git diff', 'Perintah menampilkan perbedaan antar versi berkas.'],
        ['+ / -', 'Tanda baris yang ditambahkan / dihapus pada keluaran diff.'],
        ['--staged', 'Opsi membandingkan staging area dengan commit terakhir.'],
        ['HEAD~1', 'Commit satu langkah sebelum posisi HEAD saat ini.'],
        ['Hunk (@@)', 'Blok perubahan pada keluaran diff, ditandai @@.'],
        ['diff', 'Format standar penunjukan perubahan antar berkas teks.']
      ]
    }
  ],
  recap: [
    'git diff menampilkan perbedaan: merah (-) dihapus, hijau (+) ditambah.',
    'Tanpa argumen: working directory vs staging; --staged: staging vs commit terakhir.',
    'Bisa membandingkan commit, cabang, atau satu berkas saja.'
  ]
});

/* ---------- Pelajaran 9: Membatalkan Revisi ---------- */
window.GIT_LESSONS.push({
  id: 'membatalkan-revisi',
  title: 'Perintah untuk Membatalkan Revisi',
  chapter: 'Riwayat & Revisi',
  duration: '9 menit',
  intro: [
    'Salah edit? Salah staging? Tenang — Git dirancang agar hampir semua langkah bisa dibatalkan. Kuncinya adalah memahami <b>tahap</b> perubahan itu berada.',
    'Pelajaran ini membahas pembatalan pada setiap tahap: working directory, staging area, dan commit terakhir.'
  ],
  objectives: [
    'Membatalkan perubahan di working directory',
    'Mengeluarkan berkas dari staging area',
    'Mengubah commit terakhir dengan --amend',
    'Memilih antara restore, reset, dan revert'
  ],
  sections: [
    {
      type: 'example',
      title: 'Batalkan edit di working directory',
      lang: 'bash',
      output: false,
      code: `# Kembalikan berkas ke isi commit terakhir:
git restore index.html

# (Cara lama, masih sering dipakai:)
git checkout -- index.html`,
      explain: [
        '<code>git restore</code> mengembalikan berkas ke kondisi commit terakhir.',
        '<b>PERINGATAN:</b> perubahan yang belum di-staging <b>hilang permanen</b>. Pastikan benar-benar ingin membatalkan.'
      ]
    },
    {
      type: 'example',
      title: 'Batalkan staging (unstage)',
      lang: 'bash',
      output: false,
      code: `# Kembalikan berkas dari staging ke working directory:
git restore --staged index.html

# (Cara lama:)
git reset HEAD index.html

# Edit ulang, lalu staging lagi jika sudah benar`,
      explain: [
        '<code>git restore --staged</code> mengeluarkan berkas dari staging tanpa menghapus editannya.',
        'Berkas tetap ada dan tetap berubah — tinggal distaging ulang saat siap.'
      ]
    },
    {
      type: 'example',
      title: 'Mengubah commit terakhir',
      lang: 'bash',
      output: false,
      code: `# Tambah berkas yang terlupa ke commit terakhir:
git add style.css
git commit --amend --no-edit

# Atau perbaiki pesannya saja:
git commit --amend -m "Perbaiki typo dan gaya navigasi"`,
      explain: [
        '<code>--amend</code> mengganti commit terakhir dengan isi staging saat ini.',
        '<code>--no-edit</code> mempertahankan pesan lama.',
        'Hanya aman untuk commit yang <b>belum di-push</b>.'
      ]
    },
    {
      type: 'text',
      html: '<p>Untuk membatalkan commit yang <b>sudah push</b> ke remote, pilihan aman adalah <code>git revert</code> — kita bahas secara mendalam di bab tentang cabang. Prinsipnya:</p><table class="vocab"><tr><th>Perintah</th><th>Kapan dipakai</th></tr><tr><td>git restore</td><td>Membatalkan perubahan berkas atau unstaging (aman).</td></tr><tr><td>git commit --amend</td><td>Menyempurnakan commit terakhir yang belum push.</td></tr><tr><td>git reset</td><td>Menggeser cabang mundur — ubah sejarah (hati-hati di tim).</td></tr><tr><td>git revert</td><td>Membatalkan lewat commit baru — aman untuk sejarah bersama.</td></tr></table>'
    },
    {
      type: 'tip',
      title: 'Aturan emas',
      text: 'Semakin jauh perubahan dari commit (belum staging &lt; sudah staging &lt; sudah commit lokal &lt; sudah push), semakin <b>berhati-hatilah</b> membatalkannya. Yang belum di-commit paling mudah dibatalkan; yang sudah dibagikan sebaiknya dibatalkan dengan commit baru.'
    },
    {
      type: 'vocab',
      items: [
        ['git restore', 'Membatalkan perubahan berkas atau mengeluarkan dari staging.'],
        ['--amend', 'Opsi mengganti commit terakhir, bukan menambah commit baru.'],
        ['Unstage', 'Mengeluarkan berkas dari staging area kembali ke working directory.'],
        ['Sejarah bersama (shared history)', 'Commit yang sudah di-push dan mungkin dipakai orang lain.']
      ]
    },
    {
      type: 'warn',
      title: 'restore menghapus perubahan selamanya',
      text: '<code>git restore index.html</code> tanpa opsi menghapus editan kamu secara permanen. Kalau ragu, salin dulu berkasnya, atau cek <code>git diff</code> untuk memastikan apa yang akan hilang.'
    }
  ],
  recap: [
    'git restore <file> membatalkan edit di working directory; --staged untuk unstaging.',
    'git commit --amend menyempurnakan commit terakhir yang belum push.',
    'Untuk commit yang sudah dibagikan, gunakan git revert (dibahas di bab cabang).'
  ]
});
