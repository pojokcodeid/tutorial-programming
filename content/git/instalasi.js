/* ============================================================
   Pelajaran Git & GitHub — Bab 2: Persiapan
   (topik info.md:
    - "cara install git dan konfigurasi awal yang harus dilakukan")
   ============================================================ */
'use strict';

window.GIT_LESSONS = window.GIT_LESSONS || [];

/* ---------- Pelajaran 3: Install & Konfigurasi Awal ---------- */
window.GIT_LESSONS.push({
  id: 'instalasi-konfigurasi',
  title: 'Cara Install Git & Konfigurasi Awal',
  chapter: 'Persiapan',
  duration: '9 menit',
  intro: [
    'Sebelum mulai membuat repository, kita perlu menginstal Git di komputer dan melakukan konfigurasi identitas satu kali. Konfigurasi ini penting karena <b>setiap commit akan mencatat nama dan email</b> kamu.',
    'Pelajaran ini memandu instalasi di Windows, macOS, dan Linux, lalu konfigurasi wajib dan opsional yang sebaiknya dilakukan di awal.'
  ],
  objectives: [
    'Menginstal Git di Windows, macOS, dan Linux',
    'Memverifikasi instalasi Git berhasil',
    'Melakukan konfigurasi awal (nama, email, editor)',
    'Memahami perbedaan konfigurasi global dan lokal'
  ],
  sections: [
    {
      type: 'text',
      html: '<p>Git berjalan di semua sistem operasi utama. Cara instalasinya:</p><table class="vocab"><tr><th>Sistem Operasi</th><th>Cara Instalasi</th></tr><tr><td>Windows</td><td>Unduh instalator dari git-scm.com, lalu ikuti wizard (pilih opsi bawaan).</td></tr><tr><td>macOS</td><td>Buka Terminal, jalankan <code>xcode-select --install</code>, atau gunakan <code>brew install git</code> kalau sudah punya Homebrew.</td></tr><tr><td>Linux (Debian/Ubuntu)</td><td>Jalankan <code>sudo apt update && sudo apt install git</code>.</td></tr><tr><td>Linux (Fedora)</td><td>Jalankan <code>sudo dnf install git</code>.</td></tr></table>'
    },
    {
      type: 'example',
      title: 'Verifikasi instalasi',
      lang: 'bash',
      output: false,
      code: `git --version

# Contoh keluaran:
# git version 2.43.0 (Apple Git-154)`,
      explain: [
        'Jika versi muncul, Git sudah siap dipakai.',
        'Kalau muncul <code>command not found</code> atau <code>git: command not found</code>, ulangi langkah instalasi atau buka jendela Terminal baru.'
      ]
    },
    {
      type: 'text',
      html: '<p>Setelah terinstal, lakukan <b>konfigurasi identitas</b> — ini wajib, karena Git menulis nama dan email ke setiap commit. Tanpa konfigurasi, Git akan menolak commit atau memakai nilai bawaan yang salah.</p>'
    },
    {
      type: 'example',
      title: 'Konfigurasi nama dan email (wajib)',
      lang: 'bash',
      output: false,
      code: `git config --global user.name "Nama Kamu"
git config --global user.email "email@kamu.com"`,
      explain: [
        '<code>user.name</code> adalah nama penulis yang tertera di riwayat commit.',
        '<code>user.email</code> adalah email penulis. Gunakan email yang kamu pakai di GitHub bila berencana berkontribusi.',
        '<code>--global</code> membuat pengaturan berlaku untuk <b>semua proyek</b> di komputer ini.'
      ]
    },
    {
      type: 'example',
      title: 'Konfigurasi tambahan yang disarankan',
      lang: 'bash',
      output: false,
      code: `# Editor untuk pesan commit yang panjang (opsional)
git config --global core.editor "nano"

# Menyalakan warna pada keluaran Git
git config --global color.ui auto

# Membuat alias singkat (opsional)
git config --global alias.st status
git config --global alias.co checkout`,
      explain: [
        '<code>core.editor</code> dipakai saat Git membuka editor (mis. untuk pesan commit panjang). Pilih yang kamu kuasai: <code>nano</code>, <code>vim</code>, atau <code>code --wait</code>.',
        '<code>color.ui auto</code> membuat keluaran <code>git status</code> dan <code>git diff</code> lebih mudah dibaca.',
        'Alias mempersingkat perintah: <code>git st</code> sama dengan <code>git status</code>.'
      ]
    },
    {
      type: 'example',
      title: 'Memeriksa seluruh konfigurasi',
      lang: 'bash',
      output: false,
      code: `git config --list

# Contoh keluaran:
# user.name=Nama Kamu
# user.email=email@kamu.com
# color.ui=auto
# alias.st=status`,
      explain: [
        '<code>git config --list</code> menampilkan semua pengaturan yang aktif beserta nilainya.',
        'Untuk mengecek satu pengaturan saja: <code>git config user.name</code>.'
      ]
    },
    {
      type: 'tip',
      title: 'Global vs lokal',
      text: 'Tanpa <code>--global</code>, pengaturan hanya berlaku di <b>proyek saat ini</b> dan disimpan di <code>.git/config</code> dalam proyek itu. Ini berguna saat kamu memakai email berbeda untuk proyek kerja dan proyek pribadi. Urutan prioritas: lokal menggantikan global.'
    },
    {
      type: 'warn',
      title: 'Email harus konsisten',
      text: 'Jika email di Git berbeda dengan email akun GitHub-mu, kontribusi tidak akan muncul di profil GitHub. Kalau sudah terlanjur, perbaiki dengan <code>git config --global user.email "email@baru.com"</code> — commit lama tidak berubah, tapi commit baru akan tercatat benar.'
    },
    {
      type: 'vocab',
      items: [
        ['user.name / user.email', 'Identitas penulis yang dicatat pada setiap commit.'],
        ['--global', 'Cakupan konfigurasi untuk semua proyek milik pengguna di komputer tersebut.'],
        ['Alias', 'Nama singkat untuk perintah Git yang sering dipakai.'],
        ['core.editor', 'Editor teks yang dipakai Git saat perlu menulis pesan panjang.']
      ]
    }
  ],
  recap: [
    'Instal Git lewat git-scm.com (Windows), xcode-select/brew (macOS), atau apt/dnf (Linux).',
    'Konfigurasi wajib: user.name dan user.email — gunakan --global agar berlaku di semua proyek.',
    'Periksa konfigurasi dengan git config --list; tambahkan editor, warna, dan alias sesuai kebutuhan.'
  ]
});
