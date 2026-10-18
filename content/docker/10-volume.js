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
    'Ingat kembali bahwa <b>writable layer</b> container akan hilang ketika container dihapus. Jika datamu penting — seperti database, file hasil unggahan, atau catatan log permanen — kamu wajib menyimpannya secara persisten memakai <b>Volume</b> atau <b>Bind Mount</b>.',
    'Bab ini menjelaskan ketiga cara penyimpanan data di Docker beserta kapan sebaiknya masing-masing dipakai.'
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
      html: '<h3>Masalah: Data Hilang Saat Container Dihapus</h3><p>Semua perubahan file yang ada di dalam container (pada writable layer) akan ikut hilang ketika container dihapus dengan <code>rm</code>. Hal ini wajar untuk data sementara seperti cache atau berkas temp, tetapi <b>tidak dapat diterima</b> untuk database, file unggahan, atau log yang harus dipertahankan.</p><p>Solusinya adalah menyimpan data di luar siklus hidup container, yaitu dengan memakai <b>Volume</b> atau <b>Bind Mount</b>.</p>'
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
      html: '<h3>Memeriksa Volume yang Tersedia</h3><p>Kamu dapat melihat daftar volume yang ada beserta detailnya dengan perintah berikut.</p>'
    },
    {
      type: 'example',
      title: 'docker volume ls',
      lang: 'bash',
      output: false,
      code: `docker volume ls

# Lihat detail sebuah volume
docker volume inspect mydb_data`,
      explain: ['Volume yang belum terpakai (dangling) dapat dibersihkan pada langkah berikutnya.']
    },
    {
      type: 'text',
      html: '<h3>Membuat Named Volume</h3><p>Named volume adalah volume yang diberi nama eksplisit sehingga mudah dikelola dan dipakai ulang kapan pun dibutuhkan.</p>'
    },
    {
      type: 'example',
      title: 'Buat volume',
      lang: 'bash',
      output: false,
      code: `# Buat named volume
docker volume create mydb_data

# Pastikan sudah terdaftar
docker volume ls`,
      explain: []
    },
    {
      type: 'text',
      html: '<h3>Menjalankan Container dengan Volume</h3><p>Gunakan sintaks <code>-v NAMA_VOLUME:PATH_CONTAINER</code>, yang merupakan cara paling umum untuk memakai named volume. Alternatif lain adalah opsi <code>--mount</code> yang lebih terperinci dan mudah dibaca.</p>'
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
        '<code>/var/lib/mysql</code> adalah lokasi penyimpanan data MySQL di dalam container.',
        '<code>-v mydb_data:/var/lib/mysql</code> mengarahkan data ke named volume sehingga tetap tersimpan walaupun container dihapus.',
        'Jangan lupa mengatur variabel password melalui <code>-e</code> sesuai kebutuhanmu.'
      ]
    },
    {
      type: 'example',
      title: 'Uji persistensi data',
      lang: 'bash',
      output: false,
      code: `# Masuk ke MySQL (opsional)
# docker exec -it mysql-db mysql -uroot -prootpass

# Hentikan lalu hapus container
docker stop mysql-db && docker rm mysql-db

# Jalankan kembali container baru dengan volume yang sama
docker run -d \
  --name mysql-db2 \
  -e MYSQL_ROOT_PASSWORD=rootpass \
  -e MYSQL_DATABASE=testdb \
  -v mydb_data:/var/lib/mysql \
  -p 3306:3306 \
  mysql:8.0

# Data sebelumnya tetap tersedia!`,
      explain: [
        'Setelah container lama dihapus, data MySQL tetap tersimpan di dalam volume <code>mydb_data</code>.',
        'Container baru dapat melanjutkan membaca dan menulis data yang sama tanpa kehilangan apa pun.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Anonymous Volume vs Named Volume saat Run</h3><p>Kadang sebuah image sudah mendeklarasikan <code>VOLUME</code> di dalam Dockerfile-nya, sehingga Docker otomatis membuat anonymous volume. Untuk data yang penting, sebaiknya gunakan named volume secara eksplisit agar mudah dilacak dan dikelola.</p>'
    },
    {
      type: 'example',
      title: 'Membersihkan Volume',
      lang: 'bash',
      output: false,
      code: `# Hapus volume tertentu
docker volume rm mydb_data

# Hapus semua volume yang TIDAK dipakai oleh container manapun (berhati-hati!)
docker volume prune

# Bersihkan (container + network + volume dangling)
# docker system prune --volumes`,
      explain: [
        '<code>volume prune</code> menghapus volume yatim (orphaned) yang tidak lagi terpasang pada container mana pun.',
        'Opsi <code>--volumes</code> pada <code>system prune</code> juga membersihkan volume yang tidak terpakai.'
      ]
    },
    {
      type: 'tip',
      title: 'Kapan memakai Bind Mount vs Named Volume?',
      text: 'Pakai <b>Named Volume</b> untuk data aplikasi atau database karena portabel dan dikelola Docker. Pakai <b>Bind Mount</b> untuk pengembangan (sinkronisasi source code) atau ketika perlu mengakses path tertentu di host. Untuk lingkungan produksi, umumnya <b>Named Volume</b> lebih dianjurkan.'
    },
    {
      type: 'warn',
      title: 'Hati-hati',
      text: 'Jangan melakukan bind mount terhadap folder penting di host ke path yang berisiko menimpa data (misalnya <code>/etc</code>). Selalu tentukan path di dalam container dengan tepat dan teliti.'
    },
    {
      type: 'vocab',
      items: [
        ['Persistensi', 'Kondisi di mana data tetap tersimpan meski container dihapus atau dihentikan.'],
        ['Writable layer', 'Lapisan tulis di dalam container yang hilang saat container dihapus.'],
        ['Volume', 'Cara Docker menyimpan data secara persisten dan dikelola otomatis.'],
        ['Named Volume', 'Volume dengan nama khusus, dapat dipakai ulang dan dianjurkan untuk produksi.'],
        ['Anonymous Volume', 'Volume tanpa nama yang dibuat otomatis oleh Docker.'],
        ['Bind Mount', 'Pemetaan langsung path host ke container secara manual.'],
        ['VOLUME (Dockerfile)', 'Instruksi untuk mendeklarasikan titik mount bagi data di dalam image.']
      ]
    }
  ],
  recap: [
    'Data pada writable layer HILANG saat <code>docker rm</code>, karena itu gunakan Volume atau Bind Mount.',
    'Rekomendasi untuk data penting: <b>Named Volume</b> (database, file unggahan).',
    'Sintaks mount: <code>-v nama_volume:/path/container</code>.',
    'Persistensi terbukti: hapus container, jalankan container baru dengan volume yang sama, lalu data tetap ada.',
    'Bersihkan volume yang tidak terpakai dengan <code>docker volume prune</code> (gunakan dengan hati-hati).'
  ]
});