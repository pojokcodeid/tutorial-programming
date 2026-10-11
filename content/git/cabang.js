/* ============================================================
   Pelajaran Git & GitHub — Bab 5: Cabang (Branching)
   (topik info.md:
    - "menggunakan cabang untuk mencegah konflik"
    - "branching & merging"
    - "perbedaan Git checkout, Git Reset, dan Git Revert")
   ============================================================ */
'use strict';

window.GIT_LESSONS = window.GIT_LESSONS || [];

/* ---------- Pelajaran 10: Cabang & Merging ---------- */
window.GIT_LESSONS.push({
  id: 'cabang-dan-merging',
  title: 'Cabang & Merging: Bekerja Tanpa Konflik',
  chapter: 'Cabang (Branching)',
  duration: '11 menit',
  intro: [
    'Inilah fitur paling ditakuti-sekaligus-ditunggu oleh pemula: <b>cabang</b> (branch). Cabang memungkinkanmu membuat jalur pengembangan terpisah — fitur baru gagal total, kode utama tetap aman.',
    'Pelajaran ini membahas membuat, berpindah, dan menggabungkan cabang, plus cara menangani konflik merge.'
  ],
  objectives: [
    'Membuat dan berpindah antar cabang',
    'Menggabungkan cabang dengan merge',
    'Menyelesaikan konflik merge',
    'Memahami mengapa cabang mencegah konflik besar'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Secara bawaan, repository punya cabang <b>main</b> (atau <code>master</code> pada proyek lama). Bayangkan cabang sebagai <b>jalur paralel</b>: kamu bisa menyimpang, bereksperimen, lalu kembali ke jalur utama kapan pun.</p><p>Karena setiap cabang punya garis waktu sendiri, perubahan eksperimental <b>tidak menimpa</b> kode utama — inilah cara Git mencegah konflik dan kerusakan.</p>'
    },
    {
      type: 'example',
      title: 'Membuat dan berpindah cabang',
      lang: 'bash',
      output: false,
      code: `# Lihat cabang yang ada (tanda * = aktif):
git branch

# Buat cabang baru:
git branch fitur-login

# Pindah ke cabang itu:
git checkout fitur-login

# Buat + pindah sekaligus:
git checkout -b fitur-login

# (Cara modern di Git 2.23+:)
git switch -c fitur-login`,
      explain: [
        '<code>git branch</code> menampilkan daftar cabang lokal.',
        '<code>git checkout -b</code> adalah cara singkat membuat dan berpindah sekaligus.',
        'Di Git modern, <code>git switch -c</code> adalah pengganti yang lebih jelas maknanya.'
      ]
    },
    {
      type: 'example',
      title: 'Bekerja di cabang, lalu commit',
      lang: 'bash',
      output: false,
      code: `# ... edit berkas untuk fitur login ...
git add .
git commit -m "Tambah form login sederhana"

# Periksa: kita masih di cabang fitur-login
git status`,
      explain: [
        'Seluruh commit baru tersimpan <b>hanya di cabang fitur-login</b>.',
        'Cabang main tidak berubah sama sekali sampai kamu menggabungkannya.'
      ]
    },
    {
      type: 'example',
      title: 'Menggabungkan cabang (merge)',
      lang: 'bash',
      output: false,
      code: `# Kembali ke cabang utama:
git checkout main

# Gabungkan cabang fitur:
git merge fitur-login

# Keluaran (fast-forward):
# Updating 3c4b5a6..a1b2c3d
# Fast-forward
#  index.html | 12 ++++++++++++

# Hapus cabang yang sudah selesai:
git branch -d fitur-login`,
      explain: [
        'Merge harus dijalankan <b>dari cabang tujuan</b> (main), bukan dari cabang fitur.',
        '<b>Fast-forward</b> terjadi saat cabang tujuan tidak berkembang — Git cukup menggeser penunjuk.',
        '<code>git branch -d</code> menghapus cabang yang sudah digabungkan.'
      ]
    },
    {
      type: 'example',
      title: 'Ketika merge berbenturan (konflik)',
      lang: 'bash',
      output: false,
      code: `git merge fitur-login
# Auto-merging index.html
# CONFLICT (content): Merge conflict in index.html
# Automatic merge failed; fix conflicts...`,
      explain: [
        'Konflik muncul ketika dua cabang mengubah <b>baris yang sama</b>.',
        'Git berhenti dan menandai bagian bertabrakan di dalam berkas.',
        'Buka berkasnya, pilih bagian yang dipertahankan, lalu <code>git add</code> dan <code>git commit</code> untuk menyelesaikan merge.'
      ]
    },
    {
      type: 'example',
      title: 'Bentuk penanda konflik',
      lang: 'text',
      output: false,
      code: `<h1>Belajar Git</h1>
<<<<<<< HEAD
<p>Versi dari cabang main.</p>
=======
<p>Versi dari cabang fitur-login.</p>
>>>>>>> fitur-login
</body>`,
      explain: [
        'Bagian antara <code>&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD</code> dan <code>=======</code> adalah isi cabang tujuan (main).',
        'Bagian sesudahnya adalah isi cabang yang digabungkan.',
        'Hapus penanda <code>&lt;&lt;&lt;</code>, <code>=======</code>, dan <code>&gt;&gt;&gt;</code> setelah memilih.'
      ]
    },
    {
      type: 'tip',
      title: 'Cegah konflik dengan cabang kecil',
      text: 'Semakin lama cabang terpisah dari main, semakin besar kemungkinan konflik. Biasakan membuat cabang <b>kecil dan sering digabung</b>, serta pull perubahan main secara rutin.'
    },
    {
      type: 'vocab',
      items: [
        ['Branch (cabang)', 'Jalur pengembangan terpisah yang independen dari cabang lain.'],
        ['HEAD', 'Penunjuk cabang/commit yang sedang aktif.'],
        ['Merge', 'Penggabungan perubahan satu cabang ke cabang lain.'],
        ['Fast-forward', 'Merge tanpa commit baru karena cabang tujuan tidak berkembang.'],
        ['Konflik merge', 'Ketidakcocokan otomatis saat dua cabang mengubah bagian yang sama.'],
        ['git switch', 'Perintah modern untuk berpindah cabang (pengganti checkout untuk cabang).']
      ]
    },
    {
      type: 'warn',
      title: 'Jangan merge saat working directory kotor',
      text: 'Selesaikan atau staging perubahan yang belum di-commit sebelum merge. Git akan menolak merge jika ada perubahan yang belum tersimpan.'
    }
  ],
  recap: [
    'Cabang memisahkan pengembangan sehingga kegagalan eksperimen tidak merusak kode utama.',
    'Buat+pindah dengan git checkout -b; gabungkan dari cabang tujuan dengan git merge.',
    'Konflik merge diselesaikan manual: pilih bagian yang benar, lalu add dan commit.'
  ]
});

/* ---------- Pelajaran 11: checkout vs reset vs revert ---------- */
window.GIT_LESSONS.push({
  id: 'checkout-reset-revert',
  title: 'Perbedaan checkout, reset, dan revert',
  chapter: 'Cabang (Branching)',
  duration: '8 menit',
  intro: [
    'Tiga perintah ini sering membingungkan karena semuanya bisa "mengembalikan" sesuatu — tapi mengembalikan <b>ke titik yang berbeda</b> dan dengan <b>dampak berbeda</b> pada sejarah.',
    'Pelajaran ini mengupas perbedaannya dengan analogi sederhana.'
  ],
  objectives: [
    'Membedakan fungsi checkout, reset, dan revert',
    'Menentukan perintah yang tepat untuk tiap situasi',
    'Memahami dampak masing-masing terhadap riwayat commit'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Analognya: kamu menulis buku harian.</p><ul><li><b>checkout</b> = <b>membuka halaman lama</b> untuk membacanya (atau berpindah ke bab lain). Buku tidak berubah.</li><li><b>reset</b> = <b>menghapus beberapa halaman terakhir</b> dan mengatakan "halaman ini tidak pernah ada". Sejarah berubah.</li><li><b>revert</b> = <b>menulis halaman baru</b> yang isinya "membatalkan isi halaman X". Sejarah tetap utuh.</li></ul>'
    },
    {
      type: 'example',
      title: 'checkout — pindah atau lihat',
      lang: 'bash',
      output: false,
      code: `# Pindah cabang:
git checkout main

# Melihat commit lama (detached HEAD):
git checkout a1b2c3d

# Mengembalikan satu berkas ke isi commit terakhir:
git checkout -- index.html`,
      explain: [
        'checkout memindahkan <b>HEAD</b> (posisi sekarang) tanpa menghapus commit mana pun.',
        'Untuk berkas, checkout mengembalikan isinya — hati-hati, editan hilang permanen.',
        'Di Git modern: <code>git switch</code> untuk cabang, <code>git restore</code> untuk berkas.'
      ]
    },
    {
      type: 'example',
      title: 'reset — mundur & mengubah sejarah',
      lang: 'bash',
      output: false,
      code: `# Mundur satu commit, perubahan tetap di staging:
git reset --soft HEAD~1

# Mundur satu commit, perubahan ke working directory:
git reset --mixed HEAD~1   # (bawaan)

# Mundur satu commit, perubahan DIHAPUS:
git reset --hard HEAD~1`,
      explain: [
        '<code>--soft</code>: commit dibatalkan, perubahan tetap siap di-staging.',
        '<code>--mixed</code> (bawaan): perubahan dikembalikan ke working directory.',
        '<code>--hard</code>: <b>semua perubahan dihapus permanen</b> — paling berbahaya.',
        'reset menggeser cabang mundur, artinya <b>sejarah berubah</b>.'
      ]
    },
    {
      type: 'example',
      title: 'revert — batalkan dengan commit baru',
      lang: 'bash',
      output: false,
      code: `# Buat commit baru yang membatalkan commit a1b2c3d:
git revert a1b2c3d

# Keluaran: editor terbuka untuk pesan,
# lalu commit baru "Revert ..." dibuat`,
      explain: [
        'revert <b>tidak menghapus</b> commit lama; ia menambahkan commit kebalikannya.',
        'Sejarah tetap utuh dan aman untuk proyek tim — inilah pilihan utama untuk commit yang sudah di-push.',
        'Jika commit yang dibatalkan sudah digabungkan berkali-kali, revert bisa perlu penyesuaian manual.'
      ]
    },
    {
      type: 'text',
      html: '<p>Ringkasan keputusan cepat:</p><table class="vocab"><tr><th>Situasi</th><th>Pilihan</th></tr><tr><td>Mau lihat/pindah ke versi lama</td><td>git checkout &lt;hash&gt;</td></tr><tr><td>Membatalkan edit berkas yang belum commit</td><td>git restore &lt;file&gt;</td></tr><tr><td>Commit lokal salah, belum push</td><td>git reset --soft/mixed HEAD~1</td></tr><tr><td>Commit sudah push & dibagikan</td><td>git revert &lt;hash&gt;</td></tr><tr><td>Butuh penghapusan total (proyek solo)</td><td>git reset --hard (hati-hati!)</td></tr></table>'
    },
    {
      type: 'tip',
      title: 'Aturan praktis',
      text: 'Di proyek tim, anggap <b>reset pada commit yang sudah push</b> sebagai larangan — reset mengubah sejarah yang mungkin sudah dipakai orang lain. Gunakan <code>git revert</code> yang menambahkan commit pembatal tanpa mengubah masa lalu.'
    },
    {
      type: 'vocab',
      items: [
        ['checkout', 'Memindahkan HEAD ke cabang/commit lain, atau mengembalikan isi berkas.'],
        ['reset', 'Menggeser cabang mundur dan/atau membersihkan staging — mengubah sejarah.'],
        ['revert', 'Membuat commit baru yang membatalkan perubahan commit lama.'],
        ['--soft / --mixed / --hard', 'Tingkat pembatalan reset: simpan di staging / working directory / hapus semuanya.'],
        ['HEAD~1', 'Satu commit sebelum posisi saat ini.']
      ]
    },
    {
      type: 'warn',
      title: '--hard tidak punya tombol undo',
      text: '<code>git reset --hard</code> menghapus commit dan perubahan secara permanen. Untungnya, commit yang pernah dibuat masih bisa ditemukan lewat <code>git reflog</code> beberapa waktu ke depan — tapi jangan mengandalkannya.'
    }
  ],
  recap: [
    'checkout memindahkan posisi tanpa menghapus sejarah; reset mengubah sejarah; revert menambahkan commit pembatal.',
    'Untuk commit yang sudah dibagikan (push), revert adalah pilihan aman.',
    'reset --hard menghapus permanen — gunakan hanya saat benar-benar yakin.'
  ]
});
