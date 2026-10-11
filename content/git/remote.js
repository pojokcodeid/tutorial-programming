/* ============================================================
   Pelajaran Git & GitHub — Bab 6: Kolaborasi & Remote
   (topik info.md:
    - "bekerja dengan remote repository"
    - "menggunakan git pull dan git fetch"
    - "cara berkontribusi di proyek open source")
   ============================================================ */
'use strict';

window.GIT_LESSONS = window.GIT_LESSONS || [];

/* ---------- Pelajaran 12: Remote Repository ---------- */
window.GIT_LESSONS.push({
  id: 'remote-repository',
  title: 'Bekerja dengan Remote Repository',
  chapter: 'Kolaborasi & Remote',
  duration: '9 menit',
  intro: [
    'Selama ini kita bekerja secara lokal. Untuk berkolaborasi (dan mencadangkan kode), kita perlu menghubungkan repository lokal ke <b>remote</b> — repository yang tinggal di server seperti GitHub.',
    'Pelajaran ini membahas mendaftarkan remote, mengirim commit (push), dan melihat daftar remote.'
  ],
  objectives: [
    'Mendaftarkan remote dengan git remote add',
    'Mengirim commit ke remote dengan git push',
    'Memeriksa remote dan status sinkronisasi',
    'Memahami alur push pertama kali'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Remote</b> adalah versi repository yang tersimpan di server. Kamu bisa punya beberapa remote, tapi secara konvensi yang utama diberi nama <b>origin</b> (dibuat otomatis saat clone).</p>'
    },
    {
      type: 'example',
      title: 'Mendaftarkan dan memeriksa remote',
      lang: 'bash',
      output: false,
      code: `# Daftarkan remote baru:
git remote add origin https://github.com/pengguna/proyek.git

# Lihat daftar remote:
git remote

# Lihat lengkap dengan alamatnya:
git remote -v

# Keluaran:
# origin  https://github.com/pengguna/proyek.git (fetch)
# origin  https://github.com/pengguna/proyek.git (push)`,
      explain: [
        'Satu remote punya dua URL: untuk <b>fetch</b> (mengunduh) dan <b>push</b> (mengunggah).',
        'Nama remote bebas, tapi <code>origin</code> adalah standar yang dipakai hampir semua orang.'
      ]
    },
    {
      type: 'example',
      title: 'Push pertama kali',
      lang: 'bash',
      output: false,
      code: `# Kirim cabang main ke remote origin:
git push -u origin main

# Push berikutnya cukup:
git push`,
      explain: [
        '<code>git push</code> mengirim commit lokal ke remote.',
        '<code>-u</code> (upstream) mengingat pasangan cabang-remote, sehingga push berikutnya tinggal <code>git push</code>.',
        'Git akan meminta otentikasi (token/password) pada push pertama.'
      ]
    },
    {
      type: 'example',
      title: 'Memeriksa status sinkronisasi',
      lang: 'bash',
      output: false,
      code: `git status -sb

# ## main...origin/main
#  (setara: lokal dan remote sejajar)
# ## main...origin/main [ahead 2]
#  (ada 2 commit lokal belum di-push)
# ## main...origin/main [behind 3]
#  (ada 3 commit remote belum diambil)`,
      explain: [
        '<b>ahead</b> = commit lokal belum dikirim.',
        '<b>behind</b> = commit remote belum ditarik.',
        'Perintah ini sangat membantu sebelum push atau pull.'
      ]
    },
    {
      type: 'tip',
      title: 'SSH lebih praktis',
      text: 'Alih-alih mengetik token setiap push, banyak pengembang memakai alamat SSH (<code>git@github.com:...</code>) dengan kunci SSH. Setup satu kali, push selamanya tanpa password.'
    },
    {
      type: 'vocab',
      items: [
        ['Remote', 'Repository yang tersimpan di server (GitHub, GitLab, dll).'],
        ['origin', 'Nama konvensional remote utama.'],
        ['git push', 'Mengirim commit lokal ke remote.'],
        ['Upstream (-u)', 'Pengaturan pasangan cabang lokal dan remote.'],
        ['ahead / behind', 'Status keterlambatan lokal vs remote.'],
        ['SSH', 'Metode koneksi aman yang tidak perlu password tiap push.']
      ]
    },
    {
      type: 'warn',
      title: 'Push ditolak? Pull dulu',
      text: 'Jika push ditolak dengan pesan <i>non-fast-forward</i>, artinya remote punya commit yang belum kamu punya. Tarik dulu (<code>git pull</code>), selesaikan bila perlu, lalu push lagi.'
    }
  ],
  recap: [
    'git remote add origin <url> mendaftarkan remote; git remote -v memeriksanya.',
    'git push -u origin main mengirim commit sekaligus mengingat pasangan cabang.',
    'Periksa ahead/behind sebelum push agar tidak bertabrakan dengan remote.'
  ]
});

/* ---------- Pelajaran 13: pull & fetch ---------- */
window.GIT_LESSONS.push({
  id: 'pull-dan-fetch',
  title: 'Mengambil Perubahan: git pull & git fetch',
  chapter: 'Kolaborasi & Remote',
  duration: '7 menit',
  intro: [
    'Push mengirim perubahanmu ke dunia; <code>fetch</code> dan <code>pull</code> membawa perubahan dunia kepadamu. Keduanya mirip, tapi berbeda dalam satu hal penting: apakah langsung menggabungkan atau tidak.',
    'Pelajaran ini membedakan keduanya dan menunjukkan kapan masing-masing tepat dipakai.'
  ],
  objectives: [
    'Mengunduh informasi remote dengan git fetch',
    'Mengunduh sekaligus menggabungkan dengan git pull',
    'Menentukan kapan fetch lebih aman daripada pull'
  ],
  sections: [
    {
      type: 'example',
      title: 'fetch — lihat dulu, baru tindak',
      lang: 'bash',
      output: false,
      code: `# Unduh info & commit baru dari remote:
git fetch origin

# Periksa apa yang baru diunduh:
git log main..origin/main --oneline

# Bandingkan dulu sebelum menggabungkan:
git diff main origin/main`,
      explain: [
        '<code>git fetch</code> hanya <b>mengunduh</b> — working directory dan cabangmu <b>tidak tersentuh</b>.',
        'Ini cara paling aman: kamu bisa memeriksa perubahan sebelum memutuskan menggabungkan.',
        'Data remote tersimpan di <code>origin/main</code> — salinan lokal dari cabang remote.'
      ]
    },
    {
      type: 'example',
      title: 'pull — undang dan gabungkan',
      lang: 'bash',
      output: false,
      code: `# Unduh + gabungkan ke cabang aktif:
git pull

# Sama dengan:
git fetch origin
git merge origin/main`,
      explain: [
        '<code>git pull</code> = <b>fetch + merge</b> dalam satu perintah.',
        'Nyaman saat kamu yakin tidak ada tabrakan; langsung membawa kode tim ke working directory.',
        'Bisa menimbulkan konflik merge seperti biasa.'
      ]
    },
    {
      type: 'text',
      html: '<p>Kapan memilih yang mana?</p><table class="vocab"><tr><th>Situasi</th><th>Pilihan</th></tr><tr><td>Ingin memeriksa dulu sebelum gabung</td><td>git fetch, lalu git log / git diff</td></tr><tr><td>Pekerjaan lokal belum commit</td><td>git fetch (pull bisa memicu konflik)</td></tr><tr><td>Yakin ingin update cepat</td><td>git pull</td></tr><tr><td>Mulai kerja di pagi hari</td><td>git pull</td></tr><tr><td>Sebelum push ke remote</td><td>git pull --rebase atau fetch dulu</td></tr></table>'
    },
    {
      type: 'tip',
      title: 'pull --rebase untuk riwayat rapi',
      text: '<code>git pull --rebase</code> menyusun commit lokalmu <i>di atas</i> perubahan remote sehingga riwayat tetap lurus. Cocok untuk proyek yang menjaga sejarah tetap linier.'
    },
    {
      type: 'vocab',
      items: [
        ['git fetch', 'Mengunduh commit dan info remote tanpa mengubah working directory.'],
        ['git pull', 'fetch + merge: mengunduh sekaligus menggabungkan ke cabang aktif.'],
        ['origin/main', 'Salinan lokal dari cabang main di remote origin.'],
        ['main..origin/main', 'Notasi "commit yang ada di origin/main tapi belum di main".']
      ]
    },
    {
      type: 'warn',
      title: 'Jangan pull saat semrawut',
      text: 'Pull dengan perubahan yang belum di-commit berisiko konflik. Commit atau stash dulu perubahanmu, baru pull.'
    }
  ],
  recap: [
    'fetch mengunduh tanpa mengubah kerja lokal — paling aman untuk inspeksi.',
    'pull = fetch + merge, langsung menggabungkan perubahan remote.',
    'Biasakan fetch dulu bila ingin memeriksa sebelum menggabungkan.'
  ]
});

/* ---------- Pelajaran 14: Kontribusi Open Source ---------- */
window.GIT_LESSONS.push({
  id: 'kontribusi-open-source',
  title: 'Berkontribusi di Proyek Open Source',
  chapter: 'Kolaborasi & Remote',
  duration: '8 menit',
  intro: [
    'Kebanyakan proyek open source <b>tidak memberi akses langsung</b> ke repository-nya — itu fitur keamanan. Sebagai gantinya, mereka memakai alur <b>fork → branch → Pull Request</b>.',
    'Pelajaran ini memandu langkah demi langkah berkontribusi ke proyek orang lain di GitHub.'
  ],
  objectives: [
    'Memahami alur fork dan Pull Request',
    'Menyiapkan salinan proyek untuk kontribusi',
    'Membuat cabang kontribusi yang rapi',
    'Mengusulkan perubahan lewat Pull Request'
  ],
  sections: [
    {
      type: 'text',
      html: '<p><b>Fork</b> menyalin seluruh proyek ke akun GitHub-mu. Kamu bebas mengubah salinan itu, lalu mengusulkan perubahannya kembali ke proyek asal lewat <b>Pull Request (PR)</b> — surat permintaan agar perubahanmu digabungkan.</p>'
    },
    {
      type: 'example',
      title: 'Alur kontribusi standar',
      lang: 'bash',
      output: false,
      code: `# 1. Fork proyek lewat tombol "Fork" di GitHub (di browser).

# 2. Clone salinanmu:
git clone https://github.com/kamu/proyek.git
cd proyek

# 3. Tautkan proyek asal (upstream):
git remote add upstream https://github.com/pemilik/proyek.git

# 4. Buat cabang kontribusi:
git checkout -b perbaiki-typo-dokumen`,
      explain: [
        'Fork dilakukan di website GitHub, bukan di terminal.',
        '<b>upstream</b> adalah nama konvensional untuk remote proyek asal.',
        'Cabang kontribusi sebaiknya <b>bernama deskriptif</b> dan fokus pada satu perubahan.'
      ]
    },
    {
      type: 'example',
      title: 'Mengubah, commit, dan push',
      lang: 'bash',
      output: false,
      code: `# Edit berkas, lalu simpan:
git add README.md
git commit -m "Perbaiki typo pada bagian instalasi"

# Kirim ke fork-mu:
git push -u origin perbaiki-typo-dokumen`,
      explain: [
        'Satu PR sebaiknya berisi <b>satu tujuan</b> — memudahkan peninjau memahami perubahan.',
        'Pesan commit menjelaskan <i>apa</i> dan <i>mengapa</i> perubahan dibuat.'
      ]
    },
    {
      type: 'example',
      title: 'Membuka Pull Request',
      lang: 'text',
      output: false,
      code: `1. Buka fork-mu di GitHub — biasanya muncul
   banner "Compare & pull request".
2. Klik banner itu, lalu isi:
   - Judul: ringkas, mis. "Perbaiki typo di README"
   - Deskripsi: apa & mengapa berubah
3. Klik "Create pull request".

Pemilik proyek akan meninjau, mungkin meminta
perubahan, lalu menggabungkan (merge) PR-mu.`,
      explain: [
        'PR adalah <b>usulan</b>, bukan pengiriman otomatis — pemilik berhak menolak atau meminta revisi.',
        'Banyak proyek punya panduan kontribusi (CONTRIBUTING.md) — baca dulu sebelum mulai.'
      ]
    },
    {
      type: 'tip',
      title: 'Jaga fork tetap mutakhir',
      text: 'Sebelum membuat PR baru, sinkronkan fork-mu dengan proyek asal: <code>git fetch upstream</code> lalu <code>git merge upstream/main</code> (atau <code>git pull upstream main</code>). PR dari fork yang kedaluwarsa sering ditolak karena konflik.'
    },
    {
      type: 'vocab',
      items: [
        ['Fork', 'Salinan proyek orang lain di akun GitHub-mu.'],
        ['Pull Request (PR)', 'Usulan penggabungan perubahan dari fork ke proyek asal.'],
        ['upstream', 'Remote yang menunjuk ke proyek asal (bukan fork-mu).'],
        ['CONTRIBUTING.md', 'Berkas panduan cara berkontribusi yang sering ada di proyek besar.'],
        ['Review', 'Proses peninjauan PR oleh pemilik proyek.']
      ]
    },
    {
      type: 'warn',
      title: 'Jangan sentuh main langsung',
      text: 'Untuk berkontribusi, selalu buat <b>cabang baru</b>. Mengubah langsung di main membuat PR-mu kotor dan sulit ditinjau — serta berisiko mencampur perubahan yang tidak berkaitan.'
    }
  ],
  recap: [
    'Kontribusi open source mengikuti alur: fork → clone → cabang → commit → push → Pull Request.',
    'Satu PR sebaiknya fokus pada satu perubahan dengan pesan yang jelas.',
    'Sinkronkan fork dengan upstream sebelum membuat PR baru.'
  ]
});
