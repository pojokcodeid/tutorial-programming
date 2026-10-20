/* ============================================================
   Pelajaran Redis — Bab 10: Persistence & Pemulihan Data
   ============================================================ */
'use strict';

window.REDIS_LESSONS = window.REDIS_LESSONS || [];

window.REDIS_LESSONS.push({
  id: 'persistence-recovery',
  title: 'Persistence & Pemulihan Data',
  chapter: 'Operasional',
  duration: '10–12 menit',
  intro: [
    'Bayangkan papan tulis di kantor: begitu ruangan kosong dan papan dilap, semua catatan lenyap. Redis pada dasarnya bekerja seperti itu — <b>data utamanya hidup di RAM</b>, dan saat proses berhenti, isi papan harus sudah dipindahkan ke buku catatan agar tidak hilang. Buku catatan itulah yang disebut <b>persistence</b>, dan dua jenisnya disebut RDB (snapshot) serta AOF (jurnal perintah).',
    'Untuk cache murni, ketiadaan persistence bukan masalah: bila key hilang, data aslinya masih ada di database dan bisa dibangun ulang. Tetapi untuk data yang <b>hanya</b> ada di Redis — sesi pengguna, antrean tugas, counter kuota, atau pemimpin cluster — kehilangan seluruh memori saat server restart sama artinya dengan kehilangan pekerjaan berminggu-minggu. Di situlah pertanyaan "seberapa sering dan seberapa teliti Redis menyimpan ke disk" menjadi keputusan arsitektur, bukan sekadar baris konfigurasi.',
    'Bab ini membedah tiga jalur: <b>RDB</b> yang mengambil potret berkala dan ringan dipulihkan, <b>AOF</b> yang mencatat setiap perintah dengan tiga tingkat kehati-hatian, dan <b>model hibrida modern</b> yang menggabungkan keduanya. Kamu juga akan mempraktikkan backup nyata (menyalin <code>dump.rdb</code> ke mesin lain lalu menguji restore-nya) serta menyiapkan rencana pemulihan bencana, dan tahu kapan persistence justru sebaiknya dimatikan.'
  ],
  objectives: [
    'Menjelaskan sifat in-memory Redis dan risiko kehilangan data tanpa persistence',
    'Membandingkan SAVE, BGSAVE, dan tiga mode fsync AOF beserta tradeoff-nya',
    'Mengonfigurasi persistence lewat redis.conf maupun argumen docker run',
    'Melakukan backup dan uji restore nyata, serta menentukan kapan persistence tidak diperlukan'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Mengapa Data di Memori Perlu Ditulis ke Disk?</h3><p>Redis menyimpan seluruh dataset di RAM karena di sanalah letak kecepatannya: membaca key memakan waktu mikrodetik, sementara disk (walau NVMe) tetap berkali-kali lipat lebih lambat. Konsekuensinya, begitu proses Redis mati — karena perintah <code>SHUTDOWN</code>, kehabisan memori, container di-restart, atau server kehilangan listrik — <b>semua isi memori ikut hilang</b>.</p><p>Persistence menambahkan "jaring pengaman" ke disk dengan dua pendekatan berbeda:</p><ul><li><b>RDB</b> — menyimpan <b>potret (snapshot)</b> dataset pada titik waktu tertentu ke berkas <code>dump.rdb</code>. Ringan, berkasnya kecil, dan memulihkannya cepat; sisanya data di antara dua snapshot berisiko hilang.</li><li><b>AOF</b> — menulis <b>log setiap perintah perubahan</b> ke berkas <code>appendonly.aof</code>. Data yang hilang jauh lebih sedikit; harganya berkas lebih besar dan proses tulis lebih sering.</li></ul><p>Prinsip yang perlu diingat: persistence bukan pengganti replikasi. Ia melindungi dari <b>kehilangan data pada satu mesin</b>, sedangkan replikasi (bab berikutnya) melindungi dari kematian mesin itu sendiri. Sistem yang serius memakai keduanya sekaligus.</p>'
    },
    {
      type: 'text',
      html: '<h3>Dua Jalur Menulis ke Disk</h3>' + `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 340" width="760" role="img" aria-label="Alur persistence Redis: data ditulis ke memori, disimpan sebagai snapshot RDB berkala dan log AOF per perintah, lalu keduanya dipakai untuk memulihkan data saat server dimulai">
        <rect x="20" y="30" width="180" height="70" rx="10" class="u-box"/>
        <text x="110" y="58" class="u-title" text-anchor="middle">Perintah Tulis</text>
        <text x="110" y="82" class="u-lbl" text-anchor="middle">SET / HSET / LPUSH</text>

        <rect x="270" y="30" width="180" height="70" rx="10" class="u-hl"/>
        <text x="360" y="58" class="u-title" text-anchor="middle">Memori (in-memory)</text>
        <text x="360" y="82" class="u-lbl" text-anchor="middle">sumber kecepatan Redis</text>

        <line x1="204" y1="65" x2="264" y2="65" class="u-line" marker-end="url(#u-arrow)"/>

        <rect x="520" y="15" width="220" height="70" rx="10" class="u-box"/>
        <text x="630" y="42" class="u-title" text-anchor="middle">RDB: snapshot berkala</text>
        <text x="630" y="66" class="u-lbl" text-anchor="middle">BGSAVE -&gt; dump.rdb</text>

        <rect x="520" y="115" width="220" height="70" rx="10" class="u-box"/>
        <text x="630" y="142" class="u-title" text-anchor="middle">AOF: log per perintah</text>
        <text x="630" y="166" class="u-lbl" text-anchor="middle">appendonly.aof (everysec)</text>

        <line x1="454" y1="52" x2="514" y2="45" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="454" y1="80" x2="514" y2="150" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="490" y="118" class="u-lbl" text-anchor="middle">ke disk</text>

        <rect x="20" y="235" width="720" height="85" rx="10" class="u-hd"/>
        <text x="380" y="262" class="u-title" text-anchor="middle">Pemulihan saat Redis start</text>
        <line x1="36" y1="272" x2="724" y2="272" class="u-line"/>
        <text x="380" y="296" class="u-lbl" text-anchor="middle">muat dump.rdb (cepat) -&gt; lalu terapkan ulang perintah di AOF (lengkap) -&gt; dataset siap</text>

        <line x1="630" y1="189" x2="440" y2="245" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="360" y1="104" x2="360" y2="229" class="u-line" marker-end="url(#u-arrow)"/>
      </svg></div><figcaption class="fig-cap"><b>Gambar 10.1</b> — Data ditulis ke memori lalu disimpan dua jalur: snapshot RDB berkala dan log AOF per perintah; keduanya menjadi bahan pemulihan saat server dinyalakan</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>RDB: Snapshot Berkala dengan SAVE dan BGSAVE</h3><p>RDB bekerja seperti tombol jepret: pada jadwal tertentu, Redis membuat salinan seluruh dataset ke berkas biner. Jadwal diatur oleh direktif <code>save</code> dengan pola <code>save &lt;jumlah_detik&gt; &lt;jumlah_perubahan&gt;</code>. Konfigurasi bawaan <code>save 900 1</code> berarti "bila ada minimal 1 perubahan dalam 15 menit, buat snapshot" — aturan yang sengaja longgar karena Redis menilai perubahan jarang tidak perlu membebani disk.</p><p>Dua perintah tersedia, dan perbedaannya penting:</p><table><thead><tr><th></th><th><code>SAVE</code></th><th><code>BGSAVE</code></th></tr></thead><tbody><tr><td><b>Dijalankan oleh</b></td><td>Klien yang memanggil, proses utama Redis</td><td>Proses anak (fork), di latar belakang</td></tr><tr><td><b>Efek pada trafik</b></td><td><b>Memblokir seluruh server</b> sampai selesai</td><td>Proses utama tetap melayani permintaan</td></tr><tr><td><b>Risiko</b></td><td>Jeda terasa hingga hitungan detik pada dataset besar</td><td>Puncak pemakaian memori dan CPU saat fork</td></tr><tr><td><b>Kapan dipakai</b></td><td>Hampir tidak pernah di produksi</td><td>Mode normal, dipakai otomatis oleh Redis</td></tr></tbody></table><p>Keindahan <code>BGSAVE</code> ada pada teknik <b>copy-on-write</b>: proses anak tidak menyalin seluruh memori sekaligus. Ia berbagi halaman memori dengan proses induk, dan hanya menyalin halaman yang kebetulan diubah selama proses berlangsung. Dalam praktiknya:</p><ul><li><b>Dataset kecil dan jarang diubah</b> — fork nyaris tak terasa, biaya salinan kecil.</li><li><b>Dataset raksasa (10 GB) dengan trafik tinggi</b> — banyak halaman berubah, salinan tumbuh mendekati ukuran asli, memori sempat hampir dua kali lipat dan bisa memicu <i>out-of-memory</i>.</li><li><b>Bila proses anak membutuhkan waktu lama</b>, Redis mencatat peringatan <code>AOF rewrite blocked for too long</code> dan operasi fork berikutnya bisa ditunda.</li></ul>'
    },
    {
      type: 'text',
      html: '<h3>AOF: Jurnal Setiap Perintah</h3><p>AOF (<i>Append Only File</i>) tidak menyimpan potret, melainkan <b>riwayat perintah</b> yang mengubah data dalam format yang bisa dijalankan ulang. Saat server pulih, Redis membaca berkas dari awal dan memainkan kembali seluruh perintah — persis seperti menonton rekaman pertandingan untuk mengetahui skor akhir.</p><p>Tingkat ketelitian diatur <code>appendfsync</code> dan inilah titik pertukaran terbesarnya:</p><ul><li><b><code>always</code></b> — berkas disinkronkan ke disk setiap perintah. Paling aman (hampir tidak ada data yang bisa hilang), tetapi setiap tulis menunggu disk; kecepatan anjlok drastis karena satu disk = sekitar ratusan sampai ribuan operasi per detik.</li><li><b><code>everysec</code></b> (bawaan, disarankan) — disinkronkan kira-kira sekali per detik. Bila terjadi kegagulan listrik mendadak, yang hilang paling banyak satu detik data. Sebagian besar sistem menerima pertukaran ini.</li><li><b><code>no</code></b> — serahkan kepada sistem operasi kapan menulisnya ke disk. Tercepat, tetapi jendela kehilangan data bisa panjang dan bergantung pada perilaku OS.</li></ul><p>Selain itu ada <b>AOF rewrite</b>: berkas log akan terus membesar karena berisi banyak perintah yang hasilnya sudah tertimpa (misal 10.000 kali <code>INCR</code> pada key yang sama). Redis menulis ulang berkas menjadi versi ringkas berisi kondisi akhir saja. Pemicunya diatur <code>auto-aof-rewrite-percentage 100</code> (berkas dua kali lipat dari ukuran saat rewrite terakhir) dan <code>auto-aof-rewrite-min-size 64mb</code> (jangan dulu bila masih kecil).</p>'
    },
    {
      type: 'example',
      title: 'Mengaktifkan Persistence Lalu Memeriksanya',
      lang: 'redis',
      output: false,
      code: `# Lihat konfigurasi persistence yang sedang berlaku
CONFIG GET save
CONFIG GET appendonly
CONFIG GET appendfsync
CONFIG GET dir

# Paksa snapshot sekarang juga (perintah ini memblokir, hindari di trafik ramai)
BGSAVE

# Periksa status latar belakang: status sukses/berjalan, waktu mulai, ukuran
INFO persistence

# Paksa AOF rewrite manual agar berkas tidak membengkak
BGREWRITEAOF`,
      explain: [
        '<code>CONFIG GET</code> adalah cara tercepat memastikan konfigurasi yang kamu ubah benar-benar aktif, tanpa perlu menebak isi berkas konfigurasi.',
        'Hasil <code>INFO persistence</code> yang perlu diperhatikan: <code>rdb_bgsave_in_progress</code>, <code>rdb_last_bgsave_status:ok</code>, dan <code>aof_pending_rewrite</code> — semuanya bahan pemantauan di produksi.',
        '<code>BGSAVE</code> dianjurkan untuk backup terjadwal; bila waktunya berbarengan dengan trafik puncak, jadwalnya digeser ke jam sepi.'
      ]
    },
    {
      type: 'example',
      title: 'Konfigurasi lewat redis.conf dan docker run',
      lang: 'bash',
      output: false,
      code: `# --- redis.conf: RDB + AOF hibrida (disarankan) ---
dir /data
save 900 1
save 300 10
save 60 10000

appendonly yes
appendfsync everysec
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
aof-use-rdb-preamble yes

# --- jalankan container dengan konfigurasi itu dan volume tetap ---
podman run -d --name redis-persist \\
  -p 127.0.0.1:6379:6379 \\
  -v ./redis-data:/data:z \\
  -v ./redis.conf:/usr/local/etc/redis/redis.conf:z \\
  docker.io/library/redis:7-alpine \\
  redis-server /usr/local/etc/redis/redis.conf

# --- cara singkat tanpa berkas konfigurasi ---
podman run -d --name redis-fast \\
  docker.io/library/redis:7-alpine \\
  redis-server --appendonly everysec --save "300 10"`,
      explain: [
        '<code>dir /data</code> menentukan lokasi berkas <code>dump.rdb</code> dan <code>appendonly.aof</code>; di container, direktori ini wajib dipetakan ke volume host agar data tidak ikut terhapus saat container dibuang.',
        'Tiga baris <code>save</code> membentuk jadwal bertingkat: perubahan banyak memicu snapshot lebih sering, perubahan sedikit tetap tercakup pada akhirnya.',
        '<code>aof-use-rdb-preamble yes</code> mengaktifkan mode hibrida — potret RDB diletakkan di awal berkas AOF agar proses rewrite jauh lebih hemat.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Model Hibrida dan Perbandingan Ketiganya</h3><p>Sejak Redis 4, AOF dan RDB tidak lagi saling bersaing; keduanya bisa digabung. Mode hibrida menaruh <b>potret RDB di bagian awal berkas AOF</b>, disusul perintah-perintah setelahnya. Saat pemulihan, Redis cukup memuat potret lalu memainkan sisa log — jauh lebih cepat daripada memutar ulang jutaan perintah sejak awal. Untuk <i>rewrite</i>, format ini juga berarti berkas yang jauh lebih kecil.</p><table><thead><tr><th>Aspek</th><th>RDB saja</th><th>AOF saja</th><th>Hibrida (disarankan)</th></tr></thead><tbody><tr><td><b>Isi berkas</b></td><td>Potret biner hasil snapshot</td><td>Daftar perintah yang bisa dimainkan ulang</td><td>Potret RDB + sisa perintah AOF</td></tr><tr><td><b>Data hilang saat crash</b></td><td>Sampai snapshot terakhir (hingga menit/jam)</td><td>Sekitar 1 detik dengan <code>everysec</code></td><td>Sekitar 1 detik</td></tr><tr><td><b>Kecepatan memulih</b></td><td>Paling cepat</td><td>Paling lambat (putar ulang log)</td><td>Cepat, berkat potret di awal</td></tr><tr><td><b>Ukuran berkas</b></td><td>Paling kecil</td><td>Besar, tumbuh terus</td><td>Sedang</td></tr><tr><td><b>Beban tulis</b></td><td>Sesuai jadwal saja</td><td>Setiap perintah</td><td>Sesuai jadwal + log</td></tr><tr><td><b>Cocok untuk</b></td><td>Cache, data yang bisa dibangun ulang</td><td>Data wajib aman, ukuran data kecil-menengah</td><td>Sebagian besar aplikasi produksi</td></tr></tbody></table>'
    },
    {
      type: 'example',
      title: 'Backup dan Uji Restore di Mesin Lain',
      lang: 'bash',
      output: false,
      code: `# 1) Ambil snapshot konsisten tanpa memblokir server
redis-cli -h 127.0.0.1 BGSAVE

# 2) Tunggu sampai benar-benar selesai (bisa butuh beberapa detik)
redis-cli INFO persistence | grep rdb_bgsave_in_progress

# 3) Salin berkas beserta stempel waktu — jangan lupa sertakan file AOF
mkdir -p backup/2026-10-20
cp /var/lib/redis/data/dump.rdb      backup/2026-10-20/
cp /var/lib/redis/data/appendonly.aof backup/2026-10-20/
tar -czf redis-backup-2026-10-20.tar.gz backup/2026-10-20

# 4) Uji restore di mesin lain (backup yang tidak pernah diuji bukanlah backup)
podman run --rm -it --name redis-uji \\
  -v $(pwd)/redis-backup-2026-10-20.tar.gz:/backup.tar.gz:z \\
  -v $(pwd)/uji-data:/data:z \\
  docker.io/library/redis:7-alpine \\
  sh -c "tar -xzf /backup.tar.gz -C /tmp && cp /tmp/backup/2026-10-20/dump.rdb /data/ && redis-server --appendonly no"

# 5) Verifikasi isinya kembali utuh
redis-cli -p 6379 DBSIZE
redis-cli -p 6379 GET "sess:s_9f3a71"`,
      explain: [
        'Menunggu <code>rdb_bgsave_in_progress:0</code> sebelum menyalin mencegah kamu mengambil berkas setengah jadi yang tidak bisa dimuat sama sekali.',
        'Pada langkah uji restore, berkas dipindahkan ke <code>/data</code> terlebih dahulu karena itulah direktori yang dibaca Redis saat memulai — kesalahan lokasi <code>dir</code> adalah penyebab restore gagal paling umum.',
        'Jalankan uji ini secara berkala di mesin terpisah: yang dibutuhkan bukan sekadar "file backup ada", melainkan bukti bahwa data benar-benar kembali terbaca.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Rencana Pemulihan Bencana dan Kapan Persistence Dimatikan</h3><p>Backup file melindungi dari kesalahan manusia (salah <code>DEL</code>, deploy yang salah, atau penghapusan tak sengaja), tetapi tidak melindungi dari kematian mesin di tengah malam. Rencana pemulihan yang wajar memakai dua lapis:</p><ul><li><b>Replica yang selalu siap</b> — replikasi asinkron (dibahas pada bab berikutnya) membuat salinan data yang bisa diaktifkan dalam hitungan detik melalui Sentinel.</li><li><b>Backup terjadwal ke lokasi terpisah</b> — <code>BGSAVE</code> harian lalu salin berkas ke objek storage di region berbeda, dengan retensi misalnya 7 hari.</li></ul><p><b>Anti-pattern yang sering ditemui</b>: mengandalkan persistence otomatis lalu tidak pernah memeriksanya sama sekali. <code>dump.rdb</code> hanya tertulis ulang saat snapshot berhasil — bila disk penuh, snapshot gagal, dan kamu baru mengetahuinya justru saat butuh. Dua kebiasaan sederhana mencegahnya: pantau kolom <code>rdb_last_bgsave_status:ok</code> di <code>INFO persistence</code>, dan jalankan uji restore bulanan.</p><p>Ada pula situasi di mana persistence justru <b>sebaiknya dimatikan</b>:</p><ul><li><b>Cache murni yang bisa dibangun ulang</b> — data aslinya masih ada di database, menulis ulang ke disk hanya membuang I/O.</li><li><b>Dataset sangat besar yang seluruhnya cache</b> — snapshot 50 GB tiap beberapa menit membebani disk tanpa memberi manfaat.</li><li><b>Instance session sementara atau antrian ringan</b> yang boleh hilang bila restart dan memang mudah dibuat ulang.</li></ul><p>Aturan pemilihan: kalau data ini hilang, apakah ada tempat lain untuk mengambilnya? Bila ya, matikan. Bila tidak, hidupkan (RDB + AOF hibrida) dan lengkapi dengan replikasi.</p>'
    },
    {
      type: 'tip',
      title: 'Pisahkan Berkas Data dari Volume yang Sama dengan Disk Sistem',
      text: 'Taruh <code>dir</code> pada volume berbeda dari yang dipakai sistem operasi, dan pastikan ukuran disknya cukup untuk dua kali lipat ukuran dataset (sisa log AOF lama ditambah berkas hasil rewrite). Banyak insiden "Redis tiba-tiba mati" di produksi sesungguhnya adalah disk penuh akibat berkas AOF yang tumbuh tanpa dipantau.'
    },
    {
      type: 'warn',
      title: 'SAVE Memblokir Seluruh Server',
      text: 'Perintah <code>SAVE</code> menghentikan seluruh permintaan selama proses berlangsung; pada dataset besar, pengguna melihat situs berhenti merespons selama beberapa detik sampai menit. Gunakan <code>BGSAVE</code> (yang juga dipakai otomatis oleh Redis sesuai jadwal <code>save</code>) dan waspadai pula beban fork-nya: pada dataset raksasa dengan trafik tinggi, memori sempat mendekati dua kali lipat karena copy-on-write.'
    },
    {
      type: 'vocab',
      items: [
        ['Persistence', 'Mekanisme menulis data dari memori ke disk agar tetap ada setelah proses atau mesin berhenti.'],
        ['RDB', 'Format snapshot biner (dump.rdb) yang berisi potret dataset pada satu titik waktu.'],
        ['SAVE', 'Perintah snapshot yang memblokir proses utama Redis sampai selesai; dihindari di produksi.'],
        ['BGSAVE', 'Snapshot yang dijalankan proses anak di latar belakang sehingga trafik tetap dilayani.'],
        ['Copy-on-write', 'Teknik fork yang hanya menyalin halaman memori yang berubah selama snapshot berlangsung.'],
        ['AOF (Append Only File)', 'Jurnal berisi perintah-perintah yang mengubah data, dimainkan ulang saat pemulihan.'],
        ['appendfsync', 'Pengaturan frekuensi sinkronisasi AOF ke disk: always, everysec (bawaan), atau no.'],
        ['AOF rewrite', 'Penulisan ulang berkas AOF menjadi kondisi akhir yang ringkas agar tidak membengkak.'],
        ['aof-use-rdb-preamble', 'Opsi model hibrida yang menaruh potret RDB di awal berkas AOF demi pemulihan cepat.'],
        ['Disaster recovery', 'Rencana memulihkan layanan saat terjadi kegagalan besar, memadukan replikasi dan backup terpisah.']
      ]
    }
  ],
  recap: [
    'Redis menyimpan data di RAM sehingga kegagulan proses berarti kehilangan data; persistence menulisnya ke disk lewat snapshot RDB dan jurnal AOF.',
    'SAVE memblokir server dan hanya untuk keadaan darurat; BGSAVE berjalan di latar belakang dengan copy-on-write yang membebani memori bila trafik mengubah banyak data.',
    'appendfsync always paling aman tetapi lambat, everysec kehilangan maksimal sekitar satu detik dan menjadi pilihan wajar, no paling cepat tetapi paling berisiko.',
    'Model hibrida (aof-use-rdb-preamble yes) disarankan karena menggabungkan kecepatan pemulihan RDB dengan ketelitian AOF; simpan juga backup terjadwal dan uji restore-nya berkala.'
  ]
});
