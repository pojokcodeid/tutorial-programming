/* ============================================================
   Pelajaran Redis — Bab 13: Observability & Monitoring dengan Prometheus + Grafana
   ============================================================ */
'use strict';

window.REDIS_LESSONS = window.REDIS_LESSONS || [];

window.REDIS_LESSONS.push({
  id: 'observability-monitoring',
  title: 'Observability & Monitoring dengan Prometheus + Grafana',
  chapter: 'Operasional',
  duration: '10–12 menit',
  intro: [
    'Cek laboratorium rutin bukan sekadar formalitas: angka kolesterol, gula darah, dan tekanan darah memberi tahu risiko jauh sebelum tubuh sempat terasa sakit. Redis pun demikian. Server ini terus menghasilkan angka kesehatan — berapa banyak koneksi terbuka, seberapa besar memori terpakai, berapa kali bacaan berhasil mengenai cache — tetapi angka itu hanya berguna kalau kamu tahu di mana membacanya dan apa maknanya.',
    'Redis menyediakan dua lapis pemantauan. Yang pertama adalah perintah <b>INFO</b>, semacam foto kilat kondisi server saat itu juga. Yang kedua adalah aliran metrik kontinu: aplikasi kecil bernama <b>redis_exporter</b> membaca INFO lalu menerjemahkannya ke format <b>Prometheus</b>, sistem yang menyimpan angka beserta stempel waktunya. <b>Grafana</b> mengubah data itu menjadi grafik yang bisa dibaca manusia, dan aturan peringatan memberi tahu tim piket begitu ambang terlewati.',
    'Bab ini menyusun pipeline observability itu dari nol. Kamu akan memahami cara membaca tiap section INFO beserta urutan pemeriksaan saat insiden, menghafal metrik kunci beserta artinya lewat satu tabel rujukan, memasang exporter dengan konfigurasi scrape Prometheus, menulis query PromQL untuk dasbor dan peringatan, lalu menutup dengan catatan penting: monitoring menunjukkan masalah, tetapi penanganan timeout tetap tugas aplikasi klien.'
  ],
  objectives: [
    'Membaca section INFO (server, clients, memory, stats, persistence, replication) dan memakainya sebagai langkah pertama saat insiden',
    'Menjelaskan arti metrik kunci Redis beserta tanda bahayanya, termasuk hit rate, fragmentasi memori, dan eviction',
    'Memasang redis_exporter lalu mengonfigurasikan scrape Prometheus terhadap endpoint /metrics pada port 9121',
    'Menulis query PromQL dasar dan merancang aturan peringatan yang masuk akal untuk Redis'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>INFO: Enam Peta Kesehatan dalam Satu Perintah</h3><p>Perintah <code>INFO</code> mengembalikan puluhan baris teks berisi kondisi Redis <i>tepat saat dipanggil</i>. Hasilnya dipisah menjadi section-section yang masing-masing menjawab satu pertanyaan berbeda:</p><ul><li><b>INFO server</b> — versi Redis, waktu nyala, mode berjalan (standalone atau replica), dan apakah sedang dalam mode loading.</li><li><b>INFO clients</b> — jumlah koneksi terbuka, klien yang sedang diblokir karena perintah tertentu, serta koneksi yang ditolak.</li><li><b>INFO memory</b> — memori yang dipakai, puncak pemakaian, rasio fragmentasi, batas <code>maxmemory</code>, dan kebijakan eviction.</li><li><b>INFO stats</b> — operasi per detik, jumlah baca kena/tidak kena cache, key kedaluwarsa, dan key yang dibuang paksa.</li><li><b>INFO persistence</b> — status penyimpanan RDB dan AOF terakhir, termasuk timestamp simpan terakhir.</li><li><b>INFO replication</b> — peran server (master atau replica), panjang offset penulisan, dan posisi tiap replica.</li></ul><p>Kuncinya, kamu tidak perlu menghafal seluruh isi INFO. Kamu hanya perlu tahu <b>section mana yang menjawab pertanyaanmu</b>, dan itulah yang membuat perintah ini begitu mahir dipakai pada menit-menit pertama insiden.</p>'
    },
    {
      type: 'text',
      html: '<h3>Cara Memakai INFO Saat Insiden</h3><p>Ketika pengguna melaporkan "Redis lambat" atau "aplikasi error", hindari langsung menebak-nebak. Jalankan INFO berurutan dan biarkan angkanya yang menunjuk jalannya:</p><ul><li><b>1. INFO clients</b> — bila <code>connected_clients</code> melonjak jauh melebihi ukuran <i>pool</i> klien di aplikasi, biasanya ada koneksi bocor: ada kode yang membuka koneksi tetapi tidak pernah menutupnya.</li><li><b>2. INFO memory</b> — bila pemakaian mendekati <code>maxmemory</code>, kamu akan segera mengalami eviction; bila rasio fragmentasi tinggi, memori jadi terbuang percuma.</li><li><b>3. INFO stats</b> — bila <code>evicted_keys</code> terus bertambah, data sedang dibuang paksa; bila hit rate anjlok, cache-mu kehilangan guna.</li><li><b>4. INFO replication</b> — bila offset master dan replica jauh tertinggal, bacaan ke replica akan menyajikan data basi.</li><li><b>5. INFO persistence</b> — bila <code>rdb_last_bgsave_status</code> berisi <code>err</code>, perubahan terbaru berisiko hilang saat server mati.</li></ul><p>Satu kebiasaan baik: simpan keluaran INFO sebagai berkas teks setiap kali terjadi insiden. Rekaman seperti itu jauh lebih berharga daripada ingatan yang kabur, dan sering menjadi satu-satunya bukti ketika akar masalah baru terungkap berhari-hari kemudian.</p>'
    },
    {
      type: 'example',
      title: 'Menjelajahi Section INFO',
      lang: 'redis',
      output: false,
      code: `# Ringkasan padat: ambil hanya metrik yang sering ditanya
INFO | grep -E "^(connected_clients|used_memory|evicted_keys|keyspace)"

# Per section, sesuai pertanyaan yang sedang dijawab
INFO server       # versi, uptime, mode standalone/replica
INFO clients      # koneksi aktif, klien terblokir, koneksi ditolak
INFO memory       # used_memory, peak, rasio fragmentasi, maxmemory
INFO stats        # operasi/detik, hit & miss, expired, evicted
INFO persistence  # status RDB & AOF terakhir beserta waktunya
INFO replication  # peran, offset, jumlah replica, posisi tiap replica

# Denyut paling cepat: masih menjawab, dan secepat apa?
PING
INFO stats | grep instantaneous_ops_per_sec`,
      explain: [
        'Setiap section berdiri sendiri sehingga kamu bisa bertanya tepat sasaran: <code>INFO memory</code> jauh lebih ringan dibanding memindai seluruh keluaran INFO yang mencapai ratusan baris.',
        'Urutan pemeriksaan saat insiden pada bagian sebelumnya tidak berlaku kebetulan: koneksi dulu (apakah ada kebocoran), memori (apakah segera habis), statistik (apakah data diusir), baru replikasi dan persistensi.',
        'Pipa ke <code>grep</code> mengubah keluaran yang lebar menjadi daftar pendek yang bisa langsung ditempel ke tiket insiden; nilai waktu yang tertangkap di sana menjadi bukti kronologi yang berguna.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Dari Foto Sesat ke Deret Waktu</h3><p>INFO hanya memberi satu foto. Foto itu menjawab "berapa angkanya sekarang", tetapi tidak menjawab "sejak kapan naik" dan "apa pemicunya". Bayangkan pasien yang hanya diukur tekanan darahnya sekali setahun: angkanya ada, tetapi trennya tidak terbaca.</p><p>Di sinilah pengukuran berkala diperlukan. Bila kamu membaca INFO setiap 15 detik dan menyimpan hasilnya, kamu mendapat <b>deret waktu</b> (<i>time series</i>): grafik yang bisa ditelusuri mundur untuk menemukan titik awal masalah, dibandingkan dengan kejadian seperti rilis aplikasi atau lonjakan trafik, dan dinilai secara otomatis oleh aturan peringatan selama beberapa menit berturut-turut sehingga lonjakan sesaat tidak langsung membangunkan orang dari tidur.</p><p>Redis tidak memiliki pengumpul metrik bawaan, sehingga pekerjaan itu diserahkan kepada <b>redis_exporter</b>: program kecil yang menelepon INFO, memetakan hasilnya ke ratusan metrik bernama rapi, lalu menyajikannya pada endpoint <code>/metrics</code>. Prometheus mengambil (scrape) endpoint itu secara berkala, Grafana memvisualisasikannya, dan aturan alert mengevaluasi kondisinya berkelanjutan.</p>'
    },
    {
      type: 'text',
      html: '<h3>Metrik Kunci dan Arti yang Perlu Dibaca</h3><p>Tabel berikut adalah rujukan yang layak ditempel di dinding tim. Kolom terakhir adalah yang paling penting: angka tanpa tanda perhatian hiasan, angka dengan tanda perhatian menjadi awal penyelidikan.</p><table><thead><tr><th>Metrik</th><th>Apa artinya</th><th>Tanda perhatian</th></tr></thead><tbody><tr><td><b>connected_clients</b></td><td>Jumlah koneksi TCP yang sedang terbuka ke Redis</td><td>Terus naik tanpa pernah turun berarti ada koneksi bocor di sisi klien</td></tr><tr><td><b>used_memory</b> &amp; <b>used_memory_peak</b></td><td>Memori yang dipakai sekarang beserta puncaknya</td><td>Mendekati <code>maxmemory</code> berarti eviction akan segera bekerja</td></tr><tr><td><b>mem_fragmentation_ratio</b></td><td>Rasio memori proses terhadap memori yang diminta Redis</td><td>Di atas 1.5 → waspada; periksa RSS proses dan pertimbangkan defrag</td></tr><tr><td><b>instantaneous_ops_per_sec</b></td><td>Perkiraan operasi per detik pada saat dibaca</td><td>Melonjak jauh di luar pola harian → cari permintaan atau klien nakal</td></tr><tr><td><b>keyspace_hits</b>/<b>misses</b> → <i>hit rate</i></td><td>Persentase pembacaan yang berhasil terkena cache</td><td>Di bawah 90% → cache kurang berguna, periksa TTL dan pola penulisan key</td></tr><tr><td><b>expired_keys</b></td><td>Key yang dihapus sendiri karena mencapai TTL</td><td>Tinggi itu wajar pada data ber-TTL pendek; melonjak tanpa perubahan trafik baru aneh</td></tr><tr><td><b>evicted_keys</b></td><td>Key yang <b>dibuang paksa</b> karena memori penuh</td><td>Naik dari nol adalah tanda kebijakan eviction aktif membuang data</td></tr><tr><td><b>rdb_last_bgsave_status</b></td><td>Hasil penyimpanan RDB terakhir (cek juga <code>aof_last_write_status</code>)</td><td>Berisi <code>err</code> → perubahan terbaru berisiko hilang saat server mati</td></tr><tr><td><b>repl_offset</b> dan selisihnya antar node</td><td>Posisi penulisan terakhir yang sudah disalin ke replica</td><td>Replica tertinggal berarti bacaan ke sana menyajikan data basi</td></tr></tbody></table><p>Dua metrik paling sering jadi sumber kejutan adalah <b>evicted_keys</b> dan <b>hit rate</b>. Yang pertama berarti Redis sedang membuang data yang kamu kira masih tersimpan; yang kedua berarti kamu sudah membayar biaya cache tetapi manfaatnya tidak sampai.</p>'
    },
    {
      type: 'text',
      html: `<h3>Pipeline Observability Redis</h3><p>Perhatikan arah alirannya: Redis tidak perlu tahu-menahu soal pemantauan. Ia tetap melayani permintaan seperti biasa, sementara di sisi lain ada pihak yang membaca, menyimpan, menilai, dan memberi tahu tim.</p><figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 250" width="760" role="img" aria-label="Pipeline observability Redis: redis-server dibaca redis_exporter, diambil Prometheus, divisualisasikan Grafana, lalu dievaluasi aturan peringatan">
        <rect x="20" y="45" width="150" height="72" rx="10" class="u-box"/>
        <text x="95" y="75" class="u-title" text-anchor="middle">redis-server</text>
        <text x="95" y="99" class="u-lbl" text-anchor="middle">INFO pada :6379</text>

        <line x1="176" y1="81" x2="214" y2="81" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="195" y="66" class="u-lbl" text-anchor="middle">baca</text>

        <rect x="220" y="45" width="150" height="72" rx="10" class="u-box"/>
        <text x="295" y="75" class="u-title" text-anchor="middle">redis_exporter</text>
        <text x="295" y="99" class="u-lbl" text-anchor="middle">:9121 endpoint /metrics</text>

        <line x1="376" y1="81" x2="414" y2="81" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="395" y="66" class="u-lbl" text-anchor="middle">scrape</text>

        <rect x="420" y="45" width="150" height="72" rx="10" class="u-box"/>
        <text x="495" y="75" class="u-title" text-anchor="middle">Prometheus</text>
        <text x="495" y="99" class="u-lbl" text-anchor="middle">deret waktu tiap 15 detik</text>

        <line x1="576" y1="81" x2="614" y2="81" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="595" y="66" class="u-lbl" text-anchor="middle">query</text>

        <rect x="620" y="45" width="120" height="72" rx="10" class="u-box"/>
        <text x="680" y="75" class="u-title" text-anchor="middle">Grafana</text>
        <text x="680" y="99" class="u-lbl" text-anchor="middle">dasbor</text>

        <line x1="495" y1="121" x2="495" y2="164" class="u-line" marker-end="url(#u-arrow)"/>
        <text x="507" y="146" class="u-lbl">aturan alert</text>

        <rect x="20" y="170" width="720" height="60" rx="10" class="u-hl"/>
        <text x="380" y="196" class="u-title" text-anchor="middle">Peringatan ke tim piket</text>
        <text x="380" y="220" class="u-lbl" text-anchor="middle">hit rate di bawah 90% · evicted_keys naik · replica tertinggal · exporter mati</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 13.1</b> — Pipeline observability Redis: exporter menerjemahkan INFO ke metrik, Prometheus menyimpan deret waktunya, Grafana menampilkan, dan aturan alert memberi tahu tim</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Memasang redis_exporter (oliver006/redis_exporter)',
      lang: 'bash',
      output: false,
      code: `# 1) Siapkan jaringan bersama agar nama container bisa saling menemukan
docker network create redis-net

# 2) Jalankan Redis 7 untuk latihan
docker run -d --name redis-7 \\
  --network redis-net \\
  redis:7-alpine

# 3) Jalankan exporter dengan alamat Redis yang dipantau
docker run -d --name redis-exporter \\
  --network redis-net \\
  -p 9121:9121 \\
  -e REDIS_ADDR=redis://redis-7:6379 \\
  oliver006/redis_exporter:latest

# 4) Pastikan endpoint metrik hidup dan Redis sehat
curl -s http://localhost:9121/metrics | head -20
curl -s http://localhost:9121/metrics | grep '^redis_up'`,
      explain: [
        'Variabel <code>REDIS_ADDR</code> menunjuk Redis yang dipantau; exporter menelepon INFO ke alamat itu dan menerjemahkannya menjadi ratusan metrik Prometheus dengan nama yang seragam.',
        'Port <b>9121</b> beserta path <code>/metrics</code> adalah konvensi exporter ini. Prometheus cukup tahu host dan port, sisanya ia temukan sendiri.',
        'Baris <code>redis_up</code> bernilai <b>1</b> bila Redis bisa dihubungi dan <b>0</b> bila tidak — angka pertama yang layak dipantau karena tanpanya metrik lain bisa saja basi.'
      ]
    },
    {
      type: 'example',
      title: 'Konfigurasi Scrape Prometheus (prometheus.yml)',
      lang: 'yaml',
      output: false,
      code: `global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - alerts.yml

scrape_configs:
  - job_name: redis
    static_configs:
      - targets: ["redis-exporter:9121"]`,
      explain: [
        '<code>scrape_interval: 15s</code> berarti Prometheus mengambil metrik setiap 15 detik; <code>evaluation_interval</code> adalah frekuensi penilaian aturan peringatan.',
        'Karena Prometheus berjalan di jaringan yang sama, targetnya adalah nama container <code>redis-exporter</code> dengan port 9121, bukan localhost.',
        '<code>rule_files</code> menunjuk berkas aturan alert; kosongkan dulu bila belum punya, lalu isi pada langkah terakhir bab ini.'
      ]
    },
    {
      type: 'example',
      title: 'Query PromQL untuk Panel Dasbor dan Peringatan',
      lang: 'text',
      output: false,
      code: `# Laju operasi per detik (counter menjadi kecepatan)
rate(redis_commands_processed_total[5m])

# Pemakaian memori dalam byte, cocok untuk panel area
redis_memory_used_bytes

# Hit rate cache 5 menit terakhir (harus berada di atas 0.9)
sum(rate(redis_keyspace_hits_total[5m]))
  /
(sum(rate(redis_keyspace_hits_total[5m])) + sum(rate(redis_keyspace_misses_total[5m])))

# Laju key yang diusir paksa oleh maxmemory (targetnya selalu 0)
rate(redis_evicted_keys_total[5m])

# Exporter tidak bisa menjangkau Redis
redis_up == 0`,
      explain: [
        '<code>rate(...[5m])</code> mengubah counter yang hanya bertambah menjadi laju per detik, dan ia menghitung dengan benar walaupun proses Redis sempat restart di tengah jendela.',
        'Hit rate adalah pembagian dua counter: baca kena dibagi baca kena ditambah baca tidak kena. Ekspresi yang sama dipakai untuk panel dasbor dan untuk aturan alert agar angka yang dilihat tim selalu konsisten.',
        'Nama metrik exporter bisa sedikit berbeda antar versi; verifikasi selalu dengan membuka endpoint <code>/metrics</code> langsung sebelum menyusun query.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Aturan Peringatan dan Anti-Pattern Monitoring</h3><p>Dasbor yang indah tetap tidak menolong siapa pun bila tidak ada yang membukanya pada pukul tiga pagi. Aturan peringatan mengubah angka menjadi pemberitahuan. Beberapa ambang yang wajar untuk memulai:</p><ul><li><b>Hit rate turun</b> — persentase kena cache di bawah 90% selama 10 menit berturut-turut. Biasanya menandakan TTL terlalu pendek, key ditulis dengan format berbeda-beda, atau cache baru saja di-flush.</li><li><b>Eviction aktif</b> — laju <code>evicted_keys</code> lebih dari nol selama 5 menit. Untuk data yang tidak boleh hilang, ini darurat; untuk cache murni, ini tanda <code>maxmemory</code> terlalu kecil.</li><li><b>Replica tertinggal</b> — selisih offset replikasi melebihi ambang beberapa detik, menandakan jaringan atau replica sedang kelebihan beban.</li><li><b>Redis tak terjangkau</b> — <code>redis_up</code> bernilai 0, atau target scrape hilang sama sekali dari Prometheus.</li><li><b>Persistensi gagal</b> — status simpan RDB atau AOF terakhir berisi kegagalan, sehingga pemulihan setelah kegagalan tidak akan lengkap.</li></ul><p><b>Anti-pattern yang paling sering muncul:</b> memasang dashboard yang penuh panel tetapi tidak membuat satu pun aturan peringatan, sehingga monitoring berubah menjadi pajangan yang baru dilihat ketika sudah telat. Anti-pattern lain yang layak dihindari: menyalin ambang milik proyek lain tanpa mengukur pola trafiknya sendiri, memantau hanya pemakaian memori padahal yang dirasakan pengguna adalah latensi, serta menyimpan seluruh metrik tanpa batas waktu sehingga biaya penyimpanan justru lebih besar dari nilai informasinya.</p>'
    },
    {
      type: 'tip',
      title: 'Uji Jalur Peringatan, Bukan Hanya Kodenya',
      text: 'Setelah aturan alert dibuat, uji nyata: matikan kontainer Redis sebentar atau gunakan <code>promtool test rules</code> untuk memastikan pesan benar-benar sampai ke kanal tim piket. Peringatan yang belum pernah diuji sama saja dengan tidak ada — kegagalan biasanya muncul pada konfigurasi kanal notifikasi, bukan pada ekspresinya.'
    },
    {
      type: 'warn',
      title: 'Monitoring Tidak Menggantikan Penanganan di Klien',
      text: 'Metrik baru muncul pada siklus scrape berikutnya, sedangkan permintaan pengguna sudah gagal detik itu juga. Aplikasi tetap wajib memasang <b>timeout</b>, pembatasi percobaan ulang, dan jalur degradasi ketika Redis tidak menjawab. Prometheus memberi tahu kamu bahwa ada masalah; yang menentukan pengguna tetap bisa berbelanja adalah kode klien yang sudah siap sejak awal.'
    },
    {
      type: 'vocab',
      items: [
        ['INFO', 'Perintah Redis yang mengembalikan snapshot kondisi server dalam beberapa section: server, clients, memory, stats, persistence, replication.'],
        ['redis_exporter', 'Program perantara (proyek oliver006/redis_exporter) yang menerjemahkan keluaran INFO menjadi metrik Prometheus pada port 9121.'],
        ['Scrape', 'Pengambilan metrik berkala oleh Prometheus terhadap sebuah endpoint, umumnya tiap 15 detik.'],
        ['Deret waktu (time series)', 'Sekumpulan nilai bernomor waktu yang membuat pola naik-turun bisa dibaca sebagai grafik dan tren.'],
        ['Hit rate', 'Persentase pembacaan yang mengenai cache, dihitung dari keyspace_hits dibagi jumlah seluruh pembacaan.'],
        ['mem_fragmentation_ratio', 'Rasio antara memori proses terhadap memori yang diminta Redis; di atas 1.5 menandakan fragmentasi yang perlu diperhatikan.'],
        ['Evicted keys', 'Key yang dibuang paksa karena memori penuh; nilainya naik ketika kebijakan eviction sedang bekerja.'],
        ['PromQL', 'Bahasa query Prometheus untuk memilih, menghitung, dan membandingkan metrik pada rentang waktu tertentu.']
      ]
    }
  ],
  recap: [
    'INFO adalah langkah pertama saat insiden: clients untuk koneksi, memory untuk pemakaian dan fragmentasi, stats untuk hit rate serta eviction, replication untuk ketertinggalan, persistence untuk hasil simpan terakhir.',
    'Metrik kunci yang wajib dipantau meliputi connected_clients, used_memory, mem_fragmentation_ratio, instantaneous_ops_per_sec, hit rate, expired_keys, evicted_keys, status penyimpanan, dan selisih offset replikasi.',
    'Pipeline observability dibangun dengan redis_exporter (port 9121, endpoint /metrics) yang di-scrape Prometheus lalu divisualisasikan Grafana, lengkap dengan aturan peringatan berbasis PromQL.',
    'Monitoring adalah mata, bukan tangan: aplikasi klien tetap harus menangani timeout, percobaan ulang terbatas, dan degradasi terkendali ketika Redis tidak menjawab.'
  ]
});
