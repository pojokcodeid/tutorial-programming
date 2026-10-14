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
    'Kamu akan belajar: menjalankan container interaktif, masuk ke dalam container, mengeksekusi perintah di container yang sedang jalan, serta membuat container tanpa langsung menjalankannya.'
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
      html: '<h3>Mode Interaktif (-it)</h3><p>Untuk berinteraksi langsung dengan shell di dalam container, pakai <code>-it</code> (gabungan <code>-i</code> dan <code>-t</code>).</p><ul><li><code>-i</code> / <code>--interactive</code> – menjaga STDIN tetap terbuka</li><li><code>-t</code> / <code>--tty</code> – alokasikan pseudo-TTY (biar mirip terminal biasa)</li></ul>'
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
        'Kamu akan masuk ke shell <code>/ #</code> di dalam container Alpine.',
        'Coba <code>ls</code>, <code>pwd</code>, <code>cat /etc/os-release</code>.',
        '<code>--rm</code> otomatis hapus container saat kamu keluar (<code>exit</code>). Sangat berguna untuk coba-coba.'
      ]
    },
    {
      type: 'tip',
      title: 'Keluar dari shell container',
      text: 'Ketik <code>exit</code> atau tekan <code>Ctrl+D</code>. Jika pakai <code>--rm</code>, container langsung terhapus.'
    },
    {
      type: 'text',
      html: '<h3>Mengeksekusi Perintah di Container yang Sedang Berjalan (exec)</h3><p><code>docker container exec</code> dipakai untuk menjalankan perintah tambahan di <b>container yang sudah running</b>, tanpa menghentikan proses utamanya.</p>'
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

# Masuk shell bash di dalam container (nginx:alpine pakai sh/busybox)
docker container exec -it web sh

# Keluar: exit`,
      explain: [
        '<code>exec</code> tidak membuat container baru, cuma "masuk" & jalanin perintah.',
        'Bisa dipakai untuk debug, cek file, restart service internal (jarang), dll.'
      ]
    },
    {
      type: 'warn',
      title: 'Perbedaan run vs exec',
      text: '<code>run</code> = buat container BARU dari image. <code>exec</code> = jalanin perintah di container YANG SUDAH ADA & RUNNING.'
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
      html: '<h3>Membuat Tanpa Menjalankan (create) lalu start</h3><p>Kadang kamu pengen siapkan container dulu (konfigurasi port/name/env) tanpa langsung menjalankannya. Gunakan <code>create</code> + <code>start</code>.</p>'
    },
    {
      type: 'example',
      title: 'create + start',
      lang: 'bash',
      output: false,
      code: `# Buat container (status Created)
docker container create --name tmp-nginx -p 8082:80 nginx:alpine

# Lihat status
docker container ls -a

# Jalankan
docker container start tmp-nginx

# Cek
docker container ls

# Bersihin
docker container stop tmp-nginx && docker container rm tmp-nginx`,
      explain: [
        '<code>create</code> menghasilkan container dalam state <b>Created</b> (belum running).',
        'Berguna misalnya untuk skenario advanced atau automation.'
      ]
    },
    {
      type: 'tip',
      title: 'Kapan pakai --rm?',
      text: 'Pakai <code>--rm</code> saat eksplorasi (alpine sh, ubuntu bash, one-off command). Hindari <code>--rm</code> untuk container yang mau dipertahankan (database, web app jangka panjang).'
    },
    {
      type: 'vocab',
      items: [
        ['-i (interactive)', 'Menjaga STDIN tetap terbuka biar bisa ketik perintah.'],
        ['-t (tty)', 'Memberi terminal virtual agar output lebih rapi.'],
        ['exec', 'Menjalankan proses tambahan di dalam container yang sedang berjalan.'],
        ['entrypoint/cmd', 'Perintah default yang dijalankan saat container start.'],
        ['create', 'Membuat container tanpa langsung menjalankannya.']
      ]
    }
  ],
  recap: [
    '<code>-it</code> wajib kalau mau interaksi dengan shell di container.',
    '<code>exec -it &lt;container&gt; sh</code> buat "nyemplung" ke container yang sedang jalan.',
    '<code>create</code> + <code>start</code> = alternatif <code>run</code> (pisah tahap).',
    '<code>--rm</code> auto-hapus container setelah selesai – praktis buat latihan.'
  ]
});