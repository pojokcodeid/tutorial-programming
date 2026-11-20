/* ============================================================
   Pelajaran Elasticsearch — 12: Snapshot, Backup & Restore
   (Roadmap Level 8D — bab Operasional)
   ============================================================ */
'use strict';

window.ELASTICSEARCH_LESSONS = window.ELASTICSEARCH_LESSONS || [];

window.ELASTICSEARCH_LESSONS.push({
  id: 'backup-restore',
  title: 'Snapshot, Backup & Restore',
  chapter: 'Operasional',
  duration: '14 menit',
  intro: [
    'Ada satu pertanyaan yang sering ditanyakan terlambat: &quot;Data kita hilang — ada backup tidak?&quot; Elasticsearch punya jawaban bawaan yang rapi: <b>snapshot</b>. Ia menyalin state index (termasuk shard dan metadata) ke repository eksternal, sehingga cluster yang rusak bisa dibangun ulang dari salinan itu. Tetapi snapshot hanya berguna kalau pernah dibuat — dan <b>diuji</b>.',
    'Pelajaran ini membangun alur penuh: membuat <b>snapshot repository</b>, memverifikasinya, mengambil <b>snapshot</b>, memeriksa status, lalu sengaja menghapus index dan <b>me-restore</b>-nya kembali untuk membuktikan backup itu benar-benar bekerja. Kamu juga mempelajari <b>RPO</b> (seberapa besar data yang siap kamu korbankan) dan <b>RTO</b> (berapa lama pemulihan) yang menentukan seberapa sering backup harus diambil.',
    'Satu kebiasaan yang ingin kamu bawa dari pelajaran ini: <b>backup yang belum pernah dipulihkan belum tentu backup</b>. Karena itu lab ini memaksa kamu menghapus sesuatu yang berharga (index latihan) dan mengembalikannya — persis seperti yang akan terjadi di kejadian nyata, hanya saja tanpa kepanikan.'
  ],
  objectives: [
    'Membuat snapshot repository dan memverifikasinya sebelum dipakai',
    'Mengambil snapshot, memeriksa status, dan me-restore setelah index hilang',
    'Menjelaskan RPO dan RTO serta menentukan kebijakan backup yang masuk akal',
    'Menyusun dokumentasi prosedur recovery yang bisa diikuti orang lain'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Apa yang sebenarnya disimpan sebuah snapshot?</h3><p>Snapshot bukan sekadar &quot;copy file index&quot;. Ia menyalin <b>segmen shard yang belum berubah</b> — kalau sebagian data sudah ada di snapshot sebelumnya, hanya bagian barunya yang disalin. Hasilnya: pengambilan snapshot berikutnya jauh lebih cepat dan hemat tempat. Penyimpanannya bukan di dalam cluster, melainkan di <b>repository eksternal</b> yang kamu tentukan.</p><table><thead><tr><th>Konsep</th><th>Pertanyaan</th><th>Contoh</th></tr></thead><tbody><tr><td>Repository</td><td>Ke mana salinan disimpan?</td><td>Shared filesystem, S3, GCS</td></tr><tr><td>Snapshot</td><td>Kapan salinan diambil?</td><td><code>snapshot_2026-11-20</code></td></tr><tr><td>Restore</td><td>Bagaimana data dikembalikan?</td><td><code>/_restore</code> ke index baru</td></tr><tr><td>Verify</td><td>Apakah salinan bisa dipercaya?</td><td><code>_verify</code>, uji restore berkala</td></tr></tbody></table><p>Dua istilah menentukan kualitas kebijakanmu: <b>RPO</b> (Recovery Point Objective) = seberapa banyak data terbaru yang siap hilang, dan <b>RTO</b> (Recovery Time Objective) = berapa lama sampai layanan pulih. Snapshot harian berarti RPO hingga 24 jam; RTO dipengaruhi ukuran data dan kecepatan restore — keduanya harus disepakati bersama pemilik bisnis, bukan ditebak teknis.</p>'
    },
    {
      type: 'example',
      title: 'Membuat repository dan memverifikasinya',
      lang: 'http',
      output: false,
      code: `# daftar tipe repository yang didukung instalasimu
GET /_snapshot?pretty

# buat repository bertipe shared filesystem (path harus disiapkan)
PUT /_snapshot/lab_backup
{
  "type": "fs",
  "settings": {
    "location": "/mount/backups/es",
    "compress": true
  }
}

# verifikasi: apakah repository ini benar-benar bisa dipakai?
POST /_snapshot/lab_backup/_verify?pretty

# buat repo baru: periksa dulu, jangan percaya setelah dibuat
GET /_snapshot/lab_backup?pretty`,
      explain: [
        '<code>type: "fs"</code> memakai shared filesystem — untuk lab, path ini harus dapat diakses container; untuk produksi biasanya objek storage seperti S3.',
        '<code>location</code> adalah direktori penyimpanan; Elasticsearch menulis manifest di sana, jadi path harus sudah ada dan punya izin tulis sebelum repository dibuat.',
        '<code>_verify</code> memastikan cluster benar-benar bisa membaca dan menulis ke lokasi itu — jalankan verifikasi sebelum mengandalkan repository, bukan sesudah kejadian.',
        'Perintah terakhir menampilkan pengaturan repository yang tersimpan — berguna saat audit apakah kompresi dan lokasi masih sesuai rencana.'
      ]
    },
    {
      type: 'example',
      title: 'Mengambil snapshot dan memantau statusnya',
      lang: 'http',
      output: false,
      code: `# snapshot seluruh index yang ada
PUT /_snapshot/lab_backup/snapshot_2026-11-20?wait_for_completion=false
{
  "indices": "*",
  "ignore_unavailable": true,
  "include_global_state": true
}

# pantau progres
GET /_snapshot/lab_backup/snapshot_2026-11-20/_status?pretty

# daftar semua snapshot di repository
GET /_snapshot/lab_backup/_all?pretty

# snapshot hanya index tertentu, lebih ringan
PUT /_snapshot/lab_backup/products_only
{
  "indices": ["products"],
  "ignore_unavailable": true
}`,
      explain: [
        '<code>wait_for_completion=false</code> membuat request langsung mengembalikan id snapshot sehingga tidak timeout; progresnya kamu pantau lewat <code>_status</code>.',
        'Field <code>state</code> pada status bergerak <code>IN_PROGRESS</code> → <code>SUCCESS</code> — tunggu <code>SUCCESS</code> sebelum menganggap backup selesai, bukan sekadar request diterima.',
        '<code>indices</code> membatasi cakupan: meng-backup seluruh cluster lebih menyeluruh, sedangkan satu index jauh lebih ringan untuk latihan rutin.',
        '<code>ignore_unavailable: true</code> menghindari kegagalan bila ada index yang sedang tidak tersedia — penting agar proses snapshot tidak gagal karena satu index bermasalah.'
      ]
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 320" width="760" role="img" aria-label="Alur backup dan pemulihan Elasticsearch: cluster mengirim snapshot ke repository eksternal, saat index hilang restore mengembalikan data dari repository lalu diverifikasi kembali, RPO menentukan seberapa sering backup diambil dan RTO menentukan target waktu pemulihan">
        <text x="30" y="34" class="u-title" text-anchor="start">Alur backup → kehilangan → pemulihan</text>
        <rect x="30" y="64" width="200" height="86" rx="10" class="u-hd"/>
        <text x="130" y="96" class="u-lbl" text-anchor="middle">cluster produksi</text>
        <text x="130" y="124" class="u-lbl" text-anchor="middle">index + shard aktif</text>
        <line x1="236" y1="107" x2="282" y2="107" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="259" y="94" class="u-lbl" text-anchor="middle">snapshot</text>
        <rect x="288" y="64" width="190" height="86" rx="10" class="u-box"/>
        <text x="383" y="96" class="u-title" text-anchor="middle">repository</text>
        <text x="383" y="124" class="u-lbl" text-anchor="middle">fs / S3 (eksternal)</text>
        <line x1="484" y1="107" x2="530" y2="107" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="536" y="64" width="194" height="86" rx="10" class="u-hd"/>
        <text x="633" y="96" class="u-lbl" text-anchor="middle">index hilang</text>
        <text x="633" y="124" class="u-lbl" text-anchor="middle">restore dari snapshot</text>
        <line x1="633" y1="156" x2="633" y2="196" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="536" y="202" width="194" height="64" rx="8" class="u-box"/>
        <text x="633" y="230" class="u-lbl" text-anchor="middle">verifikasi data pulih</text>
        <text x="633" y="254" class="u-lbl" text-anchor="middle">jumlah dokumen &amp; query uji</text>
        <rect x="30" y="202" width="460" height="64" rx="10" class="u-box"/>
        <text x="260" y="230" class="u-lbl" text-anchor="middle">RPO: seberapa sering snapshot (harian → hilang maks 24 jam)</text>
        <text x="260" y="254" class="u-lbl" text-anchor="middle">RTO: berapa lama restore selesai (ukuran data &amp; kecepatan I/O)</text>
        <text x="380" y="300" class="u-lbl" text-anchor="middle">snapshot belum tentu backup — sampai kamu membuktikan restore-nya</text>
      </svg></div><figcaption>Snapshot menyalin ke repository eksternal; restore mengembalikannya; RPO dan RTO menentukan seberapa sering dan seberapa cepat siklus ini dijalankan.</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Skenario penuh: hapus index lalu pulihkan',
      lang: 'http',
      output: false,
      code: `# pastikan snapshot terakhir berstatus SUCCESS dulu
GET /_snapshot/lab_backup/snapshot_2026-11-20/_status?pretty

# kecelakaan: index latihan terhapus
DELETE /products

# buktikan hilang
GET /products/_count

# pulihkan dari snapshot
POST /_snapshot/lab_backup/snapshot_2026-11-20/_restore
{
  "indices": ["products"],
  "ignore_unavailable": true
}

# tunggu selesai lalu verifikasi
GET /products/_count
GET /_cluster/health?pretty`,
      explain: [
        'Langkah pertama menegaskan kebiasaan penting: <b>periksa status snapshot sebelum mengandalkannya</b> — snapshot yang gagal atau masih berjalan tidak bisa dipulihkan.',
        'Setelah <code>DELETE /products</code>, <code>_count</code> mengembalikan error index tidak ditemukan — justru momen yang membuat pelajaran ini terasa nyata.',
        '<code>/_restore</code> mengembalikan isi snapshot ke index; perhatikan restore menghasilkan index baru yang berada dalam keadaan tertutup (<code>close</code>) — buka kembali bila kamu ingin menulis data.',
        'Verifikasi terakhir membandingkan jumlah dokumen dengan kondisi sebelum hilang; selalu cocokkan angka, jangan hanya melihat bahwa request restore &quot;berhasil&quot;.'
      ]
    },
    {
      type: 'example',
      title: 'Kebijakan backup: jadwal, retensi, dan dokumentasi',
      lang: 'text',
      output: false,
      code: `Kebijakan snapshot — lab (contoh)
--------------------------------
Frekuensi   : harian, 02.00 WIB (di lalu lintas rendah)
Cakupan     : seluruh index + global state
Retensi      : harian x 7, mingguan x 4, bulanan x 3
Repository   : shared filesystem / objek storage (terpisah dari cluster)
Verifikasi   : restore index sample tiap minggu ke lab terpisah
RPO         : 24 jam (snapshot terakhir kemarin)
RTO         : target 60 menit untuk 100 GB
Tanggung jawab: tim backend, cadangan di dokumentasi runbook

Runbook recovery (ringkas)
--------------------------------
1. Hentikan aplikasi yang menulis ke index
2. Pilih snapshot terakhir berstatus SUCCESS
3. Restore ke index (baru bila perlu), tunggu selesai
4. Buka index, verifikasi jumlah dokumen & query uji
5. Arahkan alias aplikasi ke index hasil restore
6. Nyalakan aplikasi, pantau health & error`,
      explain: [
        'Frekuensi menentukan <b>RPO</b>: snapshot harian berarti data terakhir yang siap hilang adalah 24 jam — kalau bisnis tidak sanggup, naikkan frekuensinya.',
        'Retensi bertingkat (harian/mingguan/bulanan) menyeimbangkan kebutuhan melihat kejadian lama dengan biaya penyimpanan yang terus tumbuh.',
        'Restore berkala ke lab terpisah adalah satu-satunya cara memastikan backup benar-benar bisa dipulihkan — dan menemukan masalah (path salah, izin kurang) jauh sebelum insiden.',
        'Runbook ditulis langkah demi langkah agar pemulihan bisa dijalankan orang lain di tengah kepanikan — ingatan yang baik tidak bisa diandalkan pada saat krisis.'
      ]
    },
    {
      type: 'warn',
      title: 'Kesalahan umum backup',
      text: '<ul><li><b>Percaya backup tanpa pernah menguji restore</b> — repository yang salah izin atau path-nya hilang baru ketahuan saat dibutuhkan; uji berkala ke lab terpisah.</li><li><b>Repository di mesin yang sama dengan cluster</b> — kegagalan mesin menghapus cluster dan salinannya sekaligus; simpan di lokasi terpisah.</li><li><b>Langsung menimpa index produksi saat restore</b> — pulihkan ke index baru, verifikasi, baru pindahkan alias; ini memberi jalan mundur bila ternyata snapshot salah.</li><li><b>Tidak memantau status snapshot</b> — request diterima ≠ berhasil; selalu cek <code>state: SUCCESS</code>.</li><li><b>Mengabaikan retensi</b> — storage penuh membuat snapshot gagal diam-diam; atur retensi dan pantau kapasitas repository.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Latih pemulihan seperti latihan kebakaran',
      text: '<p>Sisakan satu jam sebulan untuk skenario ini: hapus index latihan, lalu pulihkan dari snapshot sambil menghitung waktunya. Catat berapa menit dari &quot;index hilang&quot; sampai &quot;query uji kembali benar&quot; — angka itulah RTO nyatamu, dan biasanya ia lebih lama dari dugaan. Setiap ketidakcocokan antara runbook dan kenyataan yang kamu temukan di latihan adalah satu masalah yang tidak akan kamu temukan di tengah insiden.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Snapshot', 'Salinan state index dan metadata yang disimpan ke repository eksternal.'],
        ['Repository', 'Lokasi penyimpanan snapshot (filesystem, S3, dst.) yang didefinisikan di cluster.'],
        ['Restore', 'Proses mengembalikan data dari snapshot ke index — idealnya index baru dulu.'],
        ['Verify', 'Pemeriksaan bahwa repository dapat dibaca/ditulis cluster (<code>_verify</code>).'],
        ['RPO', 'Recovery Point Objective: seberapa banyak data terbaru yang siap hilang.'],
        ['RTO', 'Recovery Time Objective: berapa lama hingga layanan pulih sepenuhnya.'],
        ['Global state', 'Metadata cluster (template, alias, pipeline) yang ikut disimpan bila <code>include_global_state</code> aktif.'],
        ['Retention', 'Kebijakan berapa lama snapshot disimpan sebelum dibuang agar hemat ruang.'],
        ['Runbook', 'Dokumentasi langkah pemulihan yang diikuti orang lain saat kejadian nyata.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Buat repository snapshot, verifikasi dengan <code>_verify</code>, lalu ambil satu snapshot dan pantau statusnya sampai <code>SUCCESS</code>.</li><li>Hapus index latihan, buktikan hilang dengan <code>_count</code>, lalu restore dari snapshot dan verifikasi jumlah dokumennya kembali sama.</li><li>Tentukan RPO dan RTO untuk skenario lab-mu (misal &quot;data 24 jam boleh hilang, pemulihan maksimal 1 jam&quot;), lalu susun jadwal snapshot dan retensi yang mendukung angka itu.</li><li><b>Checkpoint:</b> mampu menjalankan siklus repository → snapshot → verify → restore secara utuh, serta menjelaskan RPO/RTO dan menulis runbook recovery singkat yang bisa diikuti orang lain.</li></ol>'
    }
  ],
  recap: [
    '<b>Repository</b> menyimpan snapshot di luar cluster; selalu <code>_verify</code> sebelum mengandalkannya dan pastikan lokasinya terpisah dari mesin cluster.',
    'Snapshot bersifat inkremental (hanya segmen baru yang disalin) — cepat diambil, tetapi tetap wajib dipantau statusnya sampai <code>SUCCESS</code>.',
    'Pemulihan yang benar: <b>restore ke index baru → verifikasi jumlah &amp; query uji → pindahkan alias</b>, bukan menimpa langsung yang sedang dipakai.',
    '<b>RPO</b> menentukan frekuensi snapshot, <b>RTO</b> menentukan target waktu pulih; keduanya hidup dalam runbook yang <b>diuji berkala</b> — backup yang belum pernah dipulihkan belum tentu backup.'
  ]
});
