/* ============================================================
   Pelajaran Docker — Bab 4: Menjalankan & Mengelola Container (L4)
   ============================================================ */
'use strict';

window.DOCKER_LESSONS = window.DOCKER_LESSONS || [];

window.DOCKER_LESSONS.push({
  id: 'menjalankan-mengelola-container',
  title: 'Menjalankan & Mengelola Container',
  chapter: 'Praktik Dasar',
  duration: '8–10 menit',
  intro: [
    'Sekarang kamu masuk ke praktik inti Docker: menjalankan container, mempublish port agar bisa diakses dari browser, menjalankan di latar belakang (detached), melihat daftar container, memberi nama, serta menghentikan, memulai ulang, dan menghapus container.',
    'Semua perintah di bab ini adalah yang paling sering kamu pakai sehari-hari.'
  ],
  objectives: [
    'Menjalankan container dengan <code>docker run</code>',
    'Mempublish port agar bisa diakses dari host',
    'Menjalankan container di background (detached)',
    'Membuat/mengganti nama container',
    'Menghentikan, memulai ulang, menghapus container'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Menjalankan Container</h3><p>Bentuk umum perintah untuk menjalankan container adalah sebagai berikut:</p><pre><code>docker container run [OPTIONS] IMAGE [COMMAND] [ARG...]</code></pre><p><b>IMAGE</b> adalah image yang akan dijadikan dasar container (misalnya <code>alpine</code> atau <code>nginx:alpine</code>), sedangkan <b>COMMAND</b> adalah perintah yang ingin kamu jalankan di dalamnya. Jika COMMAND tidak diberi, Docker akan memakai perintah bawaan dari image tersebut. Berikut contoh paling sederhana:</p>'
    },
    {
      type: 'example',
      title: 'Jalankan alpine &amp; eksekusi perintah',
      lang: 'bash',
      output: false,
      code: `docker container run alpine echo "Halo dari Alpine!"`,
      explain: [
        'Karena image alpine belum ada, Docker menariknya (pull) terlebih dahulu, lalu membuat container, menjalankan <code>echo</code>, dan menghentikan container setelah selesai.',
        'Container secara otomatis berhenti ketika proses utamanya (entrypoint/cmd) selesai dieksekusi.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Publish Port (-p / --publish)</h3><p>Secara bawaan, container terisolasi dari jaringan luar. Agar aplikasi di dalam container bisa diakses dari browser atau host, kamu perlu mempublish port dengan format <code>HOST_PORT:CONTAINER_PORT</code>. Artinya, port yang kamu buka di laptop akan meneruskan lalu lintas jaringan ke port yang didengarkan proses di dalam container.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 230" width="760" role="img" aria-label="Mapping port host ke port container">
        <rect x="40" y="50" width="300" height="140" rx="10" class="u-box"/>
        <text x="190" y="80" class="u-title">Host (laptop kamu)</text>
        <rect x="70" y="100" width="240" height="40" rx="6" class="u-hd"/>
        <text x="190" y="125" class="u-title">browser → localhost:8080</text>
        <text x="190" y="166" class="u-lbl" text-anchor="middle">port 8080 terbuka di host</text>
        <rect x="420" y="50" width="300" height="140" rx="10" class="u-box"/>
        <text x="570" y="80" class="u-title">Container nginx</text>
        <rect x="450" y="100" width="240" height="40" rx="6" class="u-hd"/>
        <text x="570" y="125" class="u-title">proses nginx listen :80</text>
        <text x="570" y="166" class="u-lbl" text-anchor="middle">terisolasi tanpa -p</text>
        <line x1="340" y1="120" x2="416" y2="120" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="378" y="110" class="u-lbl" text-anchor="middle">-p 8080:80</text>
        <text x="380" y="216" class="u-lbl" text-anchor="middle">docker container run --publish 8080:80 nginx:alpine</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 4.1</b> — Port host (kiri) diteruskan ke port container (kanan)</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Jalankan web server & publish port',
      lang: 'bash',
      output: false,
      code: `# Jalankan nginx & mapping port 8080 (host) -> 80 (container)
docker container run --publish 8080:80 nginx:alpine`,
      explain: [
        'Buka <code>http://localhost:8080</code> di browser.',
        'Tekan <code>Ctrl+C</code> untuk menghentikan (karena berjalan foreground).'
      ]
    },
    {
      type: 'text',
      html: '<h3>Detached Mode (-d / --detach)</h3><p>Secara bawaan, container berjalan di foreground — yaitu menempel pada terminal dan menampilkan log secara langsung. Bila kamu ingin container tetap berjalan di latar belakang agar terminal bisa dipakai untuk hal lain, gunakan opsi <code>-d</code> (<code>--detach</code>):</p>'
    },
    {
      type: 'example',
      title: 'Jalankan di background',
      lang: 'bash',
      output: false,
      code: `docker container run --detach --publish 8081:80 --name web-nginx nginx:alpine

# Output hanya berupa CONTAINER ID (bukan log),
# karena container langsung berjalan di background`,
      explain: [
        '<code>--name web-nginx</code> memberi nama pada container sehingga lebih mudah dipanggil pada perintah berikutnya.',
        'Container tetap berjalan walaupun terminal sudah ditutup. Lihat statusnya dengan <code>docker container ls</code>.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Melihat Daftar Container</h3><p>Gunakan <code>docker container ls</code> untuk melihat container yang sedang berjalan, atau tambahkan <code>--all</code> agar container yang sudah berhenti juga ikut tampil.</p>'
    },
    {
      type: 'example',
      title: 'List container',
      lang: 'bash',
      output: false,
      code: `# Hanya yang sedang running
docker container ls

# Semua container (termasuk yang berhenti/exited)
docker container ls --all
# atau
docker ps -a`,
      explain: [
        '<code>STATUS</code> menunjukkan Up/Exited/Created.',
        '<code>PORTS</code> menunjukkan mapping host:container.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Stop, Start, Restart, Rename, Remove</h3>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 260" width="760" role="img" aria-label="Siklus hidup container dari created sampai removed">
        <rect x="220" y="30" width="140" height="60" rx="8" class="u-hd"/>
        <text x="290" y="58" class="u-title">Paused</text>
        <text x="290" y="80" class="u-lbl" text-anchor="middle">docker pause</text>
        <line x1="290" y1="94" x2="290" y2="114" class="u-line" marker-start="url(#u-arrow)" marker-end="url(#u-arrow)"/>
        <text x="278" y="109" class="u-lbl" text-anchor="end">pause / unpause</text>
        <rect x="20" y="120" width="140" height="64" rx="8" class="u-box"/>
        <text x="90" y="148" class="u-title">Created</text>
        <text x="90" y="170" class="u-lbl" text-anchor="middle">docker create</text>
        <rect x="220" y="120" width="140" height="64" rx="8" class="u-hd"/>
        <text x="290" y="148" class="u-title">Running</text>
        <text x="290" y="170" class="u-lbl" text-anchor="middle">run / start</text>
        <rect x="420" y="120" width="140" height="64" rx="8" class="u-box"/>
        <text x="490" y="148" class="u-title">Exited</text>
        <text x="490" y="170" class="u-lbl" text-anchor="middle">stop / selesai</text>
        <rect x="620" y="120" width="140" height="64" rx="8" class="u-box"/>
        <text x="690" y="148" class="u-title">Removed</text>
        <text x="690" y="170" class="u-lbl" text-anchor="middle">docker rm</text>
        <line x1="164" y1="152" x2="216" y2="152" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="190" y="142" class="u-lbl" text-anchor="middle">start</text>
        <line x1="364" y1="152" x2="416" y2="152" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="390" y="142" class="u-lbl" text-anchor="middle">stop</text>
        <line x1="564" y1="152" x2="616" y2="152" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="590" y="142" class="u-lbl" text-anchor="middle">rm</text>
        <path d="M490,188 L490,216 L290,216 L290,192" class="u-dash" marker-end="url(#u-arrow)"/>
        <text x="390" y="236" class="u-lbl" text-anchor="middle">start lagi — container Exited bisa dihidupkan kembali</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 4.2</b> — Siklus hidup container: Created → Running → Exited → Removed</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Mengelola container',
      lang: 'bash',
      output: false,
      code: `# Hentikan container (graceful / berhenti dengan aman)
docker container stop web-nginx

# Mulai kembali container yang sudah berhenti
docker container start web-nginx

# Restart container (hentikan lalu jalankan lagi)
docker container restart web-nginx

# Ubah nama container
docker container rename web-nginx web-server

# Hentikan dulu sebelum dihapus
# (rm hanya bisa menghapus container yang tidak berjalan)
docker container stop web-server

# Hapus container yang SUDAH berhenti
docker container rm web-server

# Hapus semua container yang sudah berhenti (exited) sekaligus
docker container prune`,
      explain: [
        '<code>stop</code> mengirimkan sinyal SIGTERM agar container berhenti dengan cara yang aman (graceful shutdown).',
        'Perintah <code>rm</code> hanya bisa menghapus container yang sudah tidak berjalan. Karena itu <code>stop</code> didahulukan sebelum <code>rm</code>.',
        'Bila terpaksa harus menghapus container yang masih berjalan, gunakan <code>rm --force</code> (gunakan seperlunya saja).',
        '<code>prune</code> sangat berguna untuk membersihkan wadah-wadah container yang sudah berhenti (exited).'
      ]
    },
    {
      type: 'tip',
      title: 'Tips',
      text: 'Kamu bisa memakai CONTAINER ID (baik yang lengkap maupun sebagian) atau NAME untuk hampir semua perintah, seperti <code>stop</code>, <code>start</code>, <code>rm</code>, dan <code>exec</code>. Cukup ketik beberapa karakter awal ID saja.'
    },
    {
      type: 'warn',
      title: 'Peringatan',
      text: 'Perintah <code>container prune</code> akan menghapus seluruh container berstatus exited tanpa konfirmasi tambahan. Pastikan tidak ada container yang masih kamu butuhkan sebelum menjalankannya.'
    },
    {
      type: 'vocab',
      items: [
        ['Foreground', 'Container menempel pada terminal sehingga log langsung terlihat.'],
        ['Detached (-d)', 'Container berjalan di latar belakang (background).'],
        ['Publish (-p)', 'Memetakan port host ke port container agar bisa diakses dari luar.'],
        ['Graceful shutdown', 'Proses menghentikan container dengan cara aman menggunakan sinyal SIGTERM.'],
        ['SIGKILL', 'Sinyal untuk memaksa proses berhenti segera (dipakai lewat <code>--force</code>).']
      ]
    }
  ],
  recap: [
    '<code>docker container run</code> berfungsi untuk membuat sekaligus menjalankan container.',
    'Gunakan <code>-p HOST:CONTAINER</code> agar aplikasi di container bisa diakses dari host.',
    '<code>-d</code> membuat container berjalan di latar belakang, sedangkan <code>--name</code> memberi nama agar mudah dikenali.',
    'Kelola container dengan <code>ls</code>, <code>stop</code>, <code>start</code>, <code>restart</code>, <code>rename</code>, <code>rm</code>, dan <code>prune</code>.'
  ]
});