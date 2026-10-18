/* ============================================================
   Pelajaran Docker — Bab 5: Manipulasi Container Lanjutan (L5)
   ============================================================ */
'use strict';

window.DOCKER_LESSONS = window.DOCKER_LESSONS || [];

window.DOCKER_LESSONS.push({
  id: 'manipulasi-container-lanjutan',
  title: 'Manipulasi Container Lanjutan',
  chapter: 'Praktik Dasar',
  duration: '7–9 menit',
  intro: [
    'Pada bab ini kamu akan belajar cara berinteraksi lebih dalam dengan container: menjalankan shell secara interaktif, masuk ke dalam container yang sedang berjalan, mengeksekusi perintah tambahan, serta membuat container tanpa langsung menjalankannya.',
    'Kemampuan exec dan interactive shell ini sangat berguna saat kamu perlu mendiagnosis masalah di dalam container.'
  ],
  objectives: [
    'Menjalankan container dalam mode interaktif (-it)',
    'Membedakan -i (interactive) vs -t (tty)',
    'Mengeksekusi perintah di container running (<code>exec</code>)',
    'Masuk shell di dalam container',
    'Membuat container tanpa run (<code>create</code>) lalu start'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Mode Interaktif (-it)</h3><p>Untuk berinteraksi langsung dengan shell di dalam container, gunakan opsi <code>-it</code>, yaitu gabungan dari <code>-i</code> dan <code>-t</code>:</p><ul><li><code>-i</code> / <code>--interactive</code> – menjaga kanal masukan (STDIN) tetap terbuka sehingga ketikanmu sampai ke container.</li><li><code>-t</code> / <code>--tty</code> – mengalokasikan terminal virtual (pseudo-TTY) sehingga tampilan output lebih rapi dan mudah dibaca.</li></ul><p>Kombinasi keduanya membuat kamu benar-benar "masuk" ke dalam shell container, persis seperti membuka terminal biasa.</p>'
    },
    {
      type: 'example',
      title: 'Jalankan shell alpine interaktif',
      lang: 'bash',
      output: false,
      code: `docker container run --interactive --tty --rm alpine sh

# Atau singkat
docker container run -it --rm alpine sh`,
      explain: [
        'Kamu akan masuk ke shell <code>/ #</code> di dalam container Alpine. Coba ketik <code>ls</code>, <code>pwd</code>, atau <code>cat /etc/os-release</code>.',
        'Opsi <code>--rm</code> otomatis menghapus container begitu kamu keluar (<code>exit</code>). Sangat berguna untuk keperluan percobaan sekali jalan.'
      ]
    },
    {
      type: 'tip',
      title: 'Keluar dari shell container',
      text: 'Ketik <code>exit</code> atau tekan <code>Ctrl+D</code> untuk keluar. Jika kamu memakai <code>--rm</code>, container akan langsung terhapus pada saat kamu keluar.'
    },
    {
      type: 'text',
      html: '<h3>Mengeksekusi Perintah di Container yang Sedang Berjalan (exec)</h3><p><code>docker container exec</code> dipakai untuk menjalankan perintah tambahan di <b>container yang sudah berjalan</b>, tanpa menghentikan proses utamanya. Ini adalah cara paling umum untuk memeriksa isi container atau mendiagnosis masalah.</p>'
    },
    {
      type: 'example',
      title: 'Contoh exec',
      lang: 'bash',
      output: false,
      code: `# Jalankan nginx di background
docker container run -d --name web nginx:alpine

# Cek isi direktori /usr/share/nginx/html
docker container exec web ls /usr/share/nginx/html

# Masuk ke shell di dalam container
# (nginx:alpine memakai sh dari busybox, bukan bash)
docker container exec -it web sh

# Keluar dari shell dengan mengetik: exit`,
      explain: [
        '<code>exec</code> tidak membuat container baru, ia hanya "masuk" ke container yang sudah ada lalu menjalankan perintah.',
        'Perintah ini berguna untuk mendiagnosis masalah, memeriksa file, atau melihat isi direktori tanpa mengganggu proses utama.'
      ]
    },
    {
      type: 'warn',
      title: 'Perbedaan run vs exec',
      text: '<code>run</code> membuat container BARU dari sebuah image, sedangkan <code>exec</code> menjalankan perintah pada container yang SUDAH ADA dan sedang berjalan.'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 260" width="760" role="img" aria-label="Perbedaan docker run dan docker exec di dalam container">
        <rect x="200" y="40" width="440" height="170" rx="10" class="u-box"/>
        <text x="420" y="70" class="u-title">Container web (Running)</text>
        <rect x="230" y="90" width="180" height="60" rx="8" class="u-hd"/>
        <text x="320" y="116" class="u-title">nginx (PID 1)</text>
        <text x="320" y="138" class="u-lbl" text-anchor="middle">dari CMD / ENTRYPOINT</text>
        <rect x="440" y="90" width="180" height="60" rx="8" class="u-hd" stroke-dasharray="4 3"/>
        <text x="530" y="116" class="u-title">sh (docker exec)</text>
        <text x="530" y="138" class="u-lbl" text-anchor="middle">proses tambahan</text>
        <line x1="60" y1="120" x2="196" y2="120" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="128" y="110" class="u-lbl" text-anchor="middle">docker run</text>
        <line x1="712" y1="120" x2="644" y2="120" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="680" y="110" class="u-lbl" text-anchor="middle">docker exec</text>
        <text x="190" y="240" class="u-lbl" text-anchor="middle">run = membuat container BARU dari image</text>
        <text x="560" y="240" class="u-lbl" text-anchor="middle">exec = menambah proses di container yang sedang berjalan</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 5.1</b> — <code>exec</code> menumpuk proses baru tanpa membuat container baru</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Membuat Tanpa Menjalankan (create) lalu start</h3><p>Kadang kamu ingin menyiapkan container terlebih dahulu (misalnya mengatur port, nama, atau variabel lingkungan) tanpa langsung menjalankannya. Untuk keperluan ini gunakan kombinasi <code>create</code> lalu <code>start</code>, yang merupakan langkah pembentukan dan penjalanan secara terpisah.</p>'
    },
    {
      type: 'example',
      title: 'create + start',
      lang: 'bash',
      output: false,
      code: `# Buat container terlebih dahulu (status Created)
docker container create --name tmp-nginx -p 8082:80 nginx:alpine

# Lihat statusnya (belum berjalan)
docker container ls -a

# Jalankan container tersebut
docker container start tmp-nginx

# Cek kembali (sekarang sudah Up/berjalan)
docker container ls

# Setelah selesai, bersihkan
docker container stop tmp-nginx && docker container rm tmp-nginx`,
      explain: [
        '<code>create</code> menghasilkan container dalam status <b>Created</b>, artinya sudah dibuat tetapi belum berjalan.',
        'Pemisahan ini berguna untuk skenario tingkat lanjut atau otomatisasi, misalnya menyiapkan banyak container lalu menjalankannya pada waktu tertentu.'
      ]
    },
    {
      type: 'tip',
      title: 'Kapan memakai --rm?',
      text: 'Gunakan <code>--rm</code> saat eksplorasi atau perintah sekali jalan (misalnya <code>alpine sh</code>, <code>ubuntu bash</code>). Hindari memakai <code>--rm</code> untuk container yang ingin dipertahankan, seperti database atau aplikasi web jangka panjang.'
    },
    {
      type: 'vocab',
      items: [
        ['-i (interactive)', 'Menjaga kanal masukan (STDIN) tetap terbuka agar kamu bisa mengetik perintah.'],
        ['-t (tty)', 'Memberi terminal virtual sehingga tampilan output lebih rapi.'],
        ['exec', 'Menjalankan proses tambahan di dalam container yang sedang berjalan.'],
        ['entrypoint/cmd', 'Perintah bawaan yang dijalankan saat container mulai berjalan.'],
        ['create', 'Membuat container tanpa langsung menjalankannya.']
      ]
    }
  ],
  recap: [
    'Opsi <code>-it</code> wajib dipakai bila kamu ingin berinteraksi dengan shell di dalam container.',
    '<code>exec -it &lt;container&gt; sh</code> dipakai untuk masuk ke container yang sedang berjalan.',
    '<code>create</code> + <code>start</code> merupakan alternatif <code>run</code> dengan langkah pembuatan dan penjalanan yang dipisah.',
    '<code>--rm</code> menghapus container otomatis setelah selesai — praktis untuk keperluan latihan.'
  ]
});