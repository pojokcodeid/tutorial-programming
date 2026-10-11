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
    'Sekarang masuk praktik: menjalankan container, mempublish port, mode detached, melihat daftar container, memberi nama, stop/start/restart, hapus container.'
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
      html: '<h3>Menjalankan Container</h3><p>Bentuk umum (modern):</p><pre><code>docker container run [OPTIONS] IMAGE [COMMAND] [ARG...]</code></pre><p>Contoh sederhana:</p>'
    },
    {
      type: 'example',
      title: 'Jalankan alpine & eksekusi perintah',
      lang: 'bash',
      output: false,
      code: `docker container run alpine echo "Halo dari Alpine!"`,
      explain: [
        'Docker pull alpine (jika belum ada), buat container, jalankan <code>echo</code>, lalu container berhenti otomatis.',
        'Container berhenti saat proses utama (entrypoint/cmd) selesai.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Publish Port (-p / --publish)</h3><p>Agar aplikasi di dalam container bisa diakses dari browser/host, publish port: <code>HOST_PORT:CONTAINER_PORT</code>.</p>'
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
      html: '<h3>Detached Mode (-d / --detach)</h3><p>Supaya container tetap jalan di background (tidak menempel terminal):</p>'
    },
    {
      type: 'example',
      title: 'Jalankan di background',
      lang: 'bash',
      output: false,
      code: `docker container run --detach --publish 8081:80 --name web-nginx nginx:alpine

# Output berupa CONTAINER ID`,
      explain: [
        '<code>--name web-nginx</code> memberi nama container (lebih mudah dipanggil).',
        'Container tetap berjalan meski terminal ditutup.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Melihat Daftar Container</h3>'
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
      type: 'example',
      title: 'Mengelola container',
      lang: 'bash',
      output: false,
      code: `# Hentikan container (graceful)
docker container stop web-nginx

# Mulai kembali container
docker container start web-nginx

# Restart container
docker container restart web-nginx

# Ubah nama container
docker container rename web-nginx web-server

# Hapus container yang SUDAH berhenti
docker container rm web-server

# Hapus paksa meski masih running (hati-hati)
docker container rm --force web-server

# Hapus semua container yang exited
docker container prune`,
      explain: [
        '<code>stop</code> kirim SIGTERM → graceful shutdown.',
        '<code>rm</code> hanya bisa jika container tidak running (kecuali pakai <code>--force</code>).',
        '<code>prune</code> berguna bersihin "sampah" container exited.'
      ]
    },
    {
      type: 'tip',
      title: 'Tips',
      text: 'Kamu bisa pakai CONTAINER ID (full/partial) atau NAME untuk hampir semua perintah (stop/start/rm/exec).'
    },
    {
      type: 'warn',
      title: 'Peringatan',
      text: '<code>container prune</code> akan menghapus container exited tanpa konfirmasi tambahan. Pastikan tidak ada yang masih dibutuhkan.'
    },
    {
      type: 'vocab',
      items: [
        ['Foreground', 'Container menempel ke terminal (output langsung terlihat).'],
        ['Detached (-d)', 'Container jalan di background.'],
        ['Publish (-p)', 'Memetakan port host -> port container.'],
        ['Graceful shutdown', 'Penutupan container dengan cara aman (SIGTERM).'],
        ['SIGKILL', 'Paksa berhenti segera (bisa dipakai via kill/--force).']
      ]
    }
  ],
  recap: [
    '<code>docker container run</code> = buat + jalankan container.',
    'Gunakan <code>-p HOST:CONTAINER</code> untuk akses dari host.',
    '<code>-d</code> biar jalan background, <code>--name</code> biar gampang diidentifikasi.',
    'Kelola dengan <code>ls/stop/start/restart/rename/rm/prune</code>.'
  ]
});