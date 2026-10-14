/* ============================================================
   Pelajaran Docker — Bab 10: Volume & Persistensi Data (L10)
   ============================================================ */
'use strict';

window.DOCKER_LESSONS = window.DOCKER_LESSONS || [];

window.DOCKER_LESSONS.push({
  id: 'docker-volume-persistensi',
  title: 'Volume & Persistensi Data',
  chapter: 'Data',
  duration: '7–9 menit',
  intro: [
    'Ingat: <b>writable layer</b> container hilang saat container dihapus. Kalau datamu penting (DB, upload file), kamu harus simpan secara persisten pakai <b>Volume</b> (atau bind mount).'
  ],
  objectives: [
    'Memahami mengapa data perlu persistensi',
    'Membedakan Anonymous Volume, Named Volume, Bind Mount',
    'Membuat & mengelola Named Volume',
    'Menjalankan container dengan volume',
    'Bersihin volume yang tidak terpakai'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Masalah: Data Hilang Saat Container Dihapus</h3><p>Semua perubahan file di dalam container (write layer) akan hilang jika container dihapus (<code>rm</code>). Ini oke buat cache/temp, tapi <b>tidak oke</b> buat database, file upload, logs permanen.</p><p>Solusinya: <b>persist data</b> ke luar lifecycle container → pakai <b>Volume</b> atau <b>Bind Mount</b>.</p>'
    },
    {
      type: 'text',
      html: '<h3>3 Cara Menyimpan Data di Docker</h3><table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%"><thead><tr><th>Jenis</th><th>Lokasi Host</th><th>Kegunaan</th><th>Mudah Di-port?</th></tr></thead><tbody><tr><td><b>Anonymous Volume</b></td><td>Dikelola Docker (<code>/var/lib/docker/volumes/.../_data</code>)</td><td>Sementara, otomatis dibuat (biasanya untuk cache)</td><td>Sedang</td></tr><tr><td><b>Named Volume</b></td><td>Dikelola Docker (path internal)</td><td><b>Rekomendasi</b> untuk data persisten (DB)</td><td>Bagus</td></tr><tr><td><b>Bind Mount</b></td><td>Path manual di host (kamu tentukan)</td><td>Cocok dev (sync kode) atau akses file host</td><td>Kurang portabel</td></tr></tbody></table>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 320" width="760" role="img" aria-label="Perbandingan named volume dengan bind mount">
        <text x="40" y="26" class="u-sub">① Named Volume — lokasi di-host dikelola Docker</text>
        <rect x="40" y="40" width="250" height="95" rx="8" class="u-box"/>
        <text x="165" y="66" class="u-title">Host</text>
        <rect x="65" y="76" width="200" height="44" rx="6" class="u-hd"/>
        <text x="165" y="103" class="u-title">volume: mydb_data</text>
        <rect x="470" y="40" width="250" height="95" rx="8" class="u-box"/>
        <text x="595" y="66" class="u-title">Container mysql</text>
        <rect x="495" y="76" width="200" height="44" rx="6" class="u-hd"/>
        <text x="595" y="103" class="u-title">/var/lib/mysql</text>
        <line x1="294" y1="98" x2="466" y2="98" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="380" y="86" class="u-lbl" text-anchor="middle">-v mydb_data:/var/lib/mysql</text>
        <text x="380" y="118" class="u-lbl" text-anchor="middle">aman saat container dihapus</text>
        <text x="40" y="180" class="u-sub">② Bind Mount — path host ditentukan sendiri</text>
        <rect x="40" y="194" width="250" height="95" rx="8" class="u-box"/>
        <text x="165" y="220" class="u-title">Host: /Users/kamu/app</text>
        <rect x="65" y="230" width="200" height="44" rx="6" class="u-hd"/>
        <text x="165" y="257" class="u-title">folder source code</text>
        <rect x="470" y="194" width="250" height="95" rx="8" class="u-box"/>
        <text x="595" y="220" class="u-title">Container</text>
        <rect x="495" y="230" width="200" height="44" rx="6" class="u-hd"/>
        <text x="595" y="257" class="u-title">/app</text>
        <line x1="294" y1="252" x2="466" y2="252" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="380" y="240" class="u-lbl" text-anchor="middle">-v $(pwd):/app</text>
        <text x="380" y="272" class="u-lbl" text-anchor="middle">kode host langsung terlihat</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 10.1</b> — Named volume untuk data penting; bind mount untuk sinkronisasi kode saat development</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Melihat Volume yang Ada</h3>'
    },
    {
      type: 'example',
      title: 'docker volume ls',
      lang: 'bash',
      output: false,
      code: `docker volume ls

# Inspect volume
docker volume inspect mydb_data`,
      explain: ['Volume yang belum dipakai (dangling) bisa dibersihkan nanti.']
    },
    {
      type: 'text',
      html: '<h3>Membuat Named Volume</h3><p>Named volume = volume dengan nama eksplisit, mudah dikelola & dipakai ulang.</p>'
    },
    {
      type: 'example',
      title: 'Buat volume',
      lang: 'bash',
      output: false,
      code: `# Buat named volume
docker volume create mydb_data

# Lihat
docker volume ls`,
      explain: []
    },
    {
      type: 'text',
      html: '<h3>Menjalankan Container dengan Volume</h3><p>Gunakan <code>-v NAMA_VOLUME:PATH_CONTAINER</code> (rekomendasi untuk named volume). Atau <code>--mount</code> (more verbose, lebih jelas).</p>'
    },
    {
      type: 'example',
      title: 'Contoh: MySQL dengan Named Volume',
      lang: 'bash',
      output: false,
      code: `docker run -d \
  --name mysql-db \
  -e MYSQL_ROOT_PASSWORD=rootpass \
  -e MYSQL_DATABASE=testdb \
  -v mydb_data:/var/lib/mysql \
  -p 3306:3306 \
  mysql:8.0`,
      explain: [
        '<code>/var/lib/mysql</code> = data directory MySQL di dalam container.',
        '<code>-v mydb_data:/var/lib/mysql</code> → data disimpan di named volume (tetap ada meski container dihapus).',
        'Jangan lupa set env password (sesuaikan kebutuhan).'
      ]
    },
    {
      type: 'example',
      title: 'Uji persistensi data',
      lang: 'bash',
      output: false,
      code: `# Masuk ke MySQL (opsional)
# docker exec -it mysql-db mysql -uroot -prootpass

# Hentikan & hapus container
docker stop mysql-db && docker rm mysql-db

# Jalankan ulang container baru dengan volume yang sama
docker run -d \
  --name mysql-db2 \
  -e MYSQL_ROOT_PASSWORD=rootpass \
  -e MYSQL_DATABASE=testdb \
  -v mydb_data:/var/lib/mysql \
  -p 3306:3306 \
  mysql:8.0

# Data sebelumnya tetap ada!`,
      explain: [
        'Setelah container lama dihapus, data MySQL masih tersimpan di volume <code>mydb_data</code>.',
        'Container baru bisa melanjutkan data tersebut.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Anonymous Volume vs Named Volume saat run</h3><p>Kadang image (Dockerfile) sudah define <code>VOLUME</code>, bisa muncul anonymous volume. Lebih baik eksplisit pakai named volume.</p>'
    },
    {
      type: 'example',
      title: 'Bersihin Volume',
      lang: 'bash',
      output: false,
      code: `# Hapus volume tertentu
docker volume rm mydb_data

# Hapus semua volume yang TIDAK dipakai oleh container manapun (berhati-hati!)
docker volume prune

# Bersihkan (container + network + volume dangling)
# docker system prune --volumes`,
      explain: [
        '<code>volume prune</code> menghapus volume orphaned (tidak ter-attach ke container).',
        '<code>--volumes</code> pada system prune juga hapus volume unused.'
      ]
    },
    {
      type: 'tip',
      title: 'Kapan pakai Bind Mount vs Named Volume?',
      text: '<b>Named Volume</b>: untuk data aplikasi/DB (portabel, dikelola Docker). <b>Bind Mount</b>: untuk development (sync source code) atau perlu akses path host spesifik. Untuk produksi, umumnya prefer <b>Named Volume</b>.'
    },
    {
      type: 'warn',
      title: 'Hati-hati',
      text: 'Jangan bind-mount folder penting host ke path yang bisa menimpa (mis. /etc). Selalu tentukan path container dengan tepat.'
    },
    {
      type: 'vocab',
      items: [
        ['Persistensi', 'Data tetap tersimpan meski container dihapus/dihentikan.'],
        ['Writable layer', 'Lapisan tulis di container (hilang saat rm).'],
        ['Volume', 'Cara Docker menyimpan data persisten (managed).'],
        ['Named Volume', 'Volume dengan nama, reusable & rekomendasi untuk prod.'],
        ['Anonymous Volume', 'Volume tanpa nama, auto-created.'],
        ['Bind Mount', 'Mapping path host → container (manual).'],
        ['VOLUME (Dockerfile)', 'Mendeklarasikan mount point untuk data.']
      ]
    }
  ],
  recap: [
    'Data di writable layer HILANG saat <code>docker rm</code>. Gunakan Volume/Bind Mount.',
    'Rekomendasi: <b>Named Volume</b> untuk data persisten (DB, uploads).',
    'Mount: <code>-v nama_volume:/path/container</code>.',
    'Persistensi teruji: hapus container → jalankan baru dengan volume sama → data tetap ada.',
    'Bersihin unused volume dengan <code>docker volume prune</code> (hati-hati).'
  ]
});