/* ============================================================
   Pelajaran Apache Kafka — 06: Topic & Partition Lebih Dalam
   ============================================================ */
'use strict';

window.KAFKA_LESSONS = window.KAFKA_LESSONS || [];

window.KAFKA_LESSONS.push({
  id: 'topic-partition',
  title: 'Topic & Partition Lebih Dalam',
  chapter: 'Data Model',
  duration: '15 menit',
  intro: [
    'Partition adalah tempat semua keajaiban paralelisme Kafka terjadi — dan juga tempat paling sering terjadi kesalahan desain. Satu keputusan sederhana seperti &quot;berapa jumlah partition&quot; atau &quot;field mana yang jadi key&quot; menentukan apakah sistemmu menangani lonjakan trafik dengan tenang atau justru menumpuk di satu broker.',
    'Pelajaran ini membuka lapisan lebih dalam tentang topic: mengapa topic dibagi menjadi partition, bagaimana key memengaruhi penempatan record lewat partitioner, apa yang terjadi pada record tanpa key, serta cara menentukan jumlah partition yang tepat.'
  ],
  objectives: [
    'Menjelaskan hubungan jumlah partition dengan throughput dan paralelisme cluster',
    'Menjelaskan cara kerja partitioner: key, hash murmur2, dan default partitioner untuk record tanpa key',
    'Menjelaskan mengapa urutan terjamin per key dan apa konsekuensinya bagi desain key',
    'Menyusun pertimbangan menentukan jumlah partition topic'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Mengapa topic dibagi menjadi partition?</h3><p>Kalau seluruh record satu topic disimpan dalam satu berkas log tunggal, hanya <b>satu broker</b> yang menulis dan membacanya — throughput-nya terbatas pada kemampuan satu mesin. Dengan membagi topic ke beberapa partition yang tersebar di banyak broker:</p><ul><li><b>Paralelisme menulis</b> — beberapa producer dapat menulis bersamaan ke partition berbeda.</li><li><b>Paralelisme membaca</b> — beberapa consumer dalam satu group dapat membaca bersamaan.</li><li><b>Kesebaran beban disk &amp; jaringan</b> — beban tidak menumpuk di satu mesin.</li><li><b>Skala horizontal</b> — menambah broker memungkinkan partition berpindah/ditambah.</li></ul><p>Singkatnya: <b>partition = unit paralelisme sekaligus unit replikasi</b>. Satu partition adalah satu log berurutan yang bisa punya beberapa salinan (replica) di broker berbeda.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 320" width="760" role="img" aria-label="Distribusi record ke tiga partition berdasarkan key menggunakan hash">
        <rect x="20" y="30" width="150" height="180" rx="8" class="u-box"/>
        <text x="95" y="54" class="u-title" text-anchor="middle">Record masuk</text>
        <line x1="34" y1="64" x2="156" y2="64" class="u-line"/>
        <rect x="34" y="78" width="122" height="34" rx="5" class="u-hd"/>
        <text x="95" y="100" class="u-lbl" text-anchor="middle">key=ACC-01</text>
        <rect x="34" y="120" width="122" height="34" rx="5" class="u-hd"/>
        <text x="95" y="142" class="u-lbl" text-anchor="middle">key=ACC-07</text>
        <rect x="34" y="162" width="122" height="34" rx="5" class="u-hd"/>
        <text x="95" y="184" class="u-lbl" text-anchor="middle">key=ACC-01</text>
        <line x1="176" y1="120" x2="244" y2="120" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="250" y="80" width="130" height="80" rx="8" class="u-box"/>
        <text x="315" y="112" class="u-title" text-anchor="middle">Partitioner</text>
        <text x="315" y="136" class="u-lbl" text-anchor="middle">hash(key) mod N</text>
        <line x1="386" y1="90" x2="454" y2="60" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="386" y1="120" x2="454" y2="140" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="386" y1="150" x2="454" y2="222" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="460" y="30" width="280" height="56" rx="6" class="u-hd"/>
        <text x="600" y="54" class="u-lbl" text-anchor="middle">Partition 0 — ACC-01, ACC-01</text>
        <text x="600" y="74" class="u-lbl" text-anchor="middle">urutan per akun terjaga</text>
        <rect x="460" y="112" width="280" height="56" rx="6" class="u-box"/>
        <text x="600" y="136" class="u-lbl" text-anchor="middle">Partition 1 — ACC-07</text>
        <text x="600" y="156" class="u-lbl" text-anchor="middle">...</text>
        <rect x="460" y="194" width="280" height="56" rx="6" class="u-box"/>
        <text x="600" y="218" class="u-lbl" text-anchor="middle">Partition 2 — (record lain)</text>
        <text x="600" y="238" class="u-lbl" text-anchor="middle">...</text>
        <text x="380" y="296" class="u-lbl" text-anchor="middle">key sama → hash sama → partition sama</text>
      </svg></div><figcaption>Key yang sama selalu mendarat di partition yang sama sehingga urutan per entitas terjaga.</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Key, hash, dan partitioner</h3><p>Untuk record yang punya <b>key</b>, Kafka memakai fungsi hash (murmur2) terhadap key, lalu modulus dengan jumlah partition: <code>partition = hash(key) % numPartitions</code>. Konsekuensinya:</p><ul><li><b>Key sama → partition sama</b> — selama jumlah partition tidak berubah, penempatannya deterministik.</li><li><b>Urutan per key terjaga</b> — semua record satu akun/user berada di satu log berurutan.</li><li><b>Key beda → bisa ke partition mana saja</b> — tersebar merata bila key cukup beragam.</li></ul><p>Pilihan key sebaiknya mencerminkan <b>satuan urutan yang dibutuhkan bisnis</b>: akun untuk mutasi saldo, user ID untuk aktivitas pengguna, order ID untuk lifecycle pesanan. Key yang buruk (mis. selalu sama untuk semua record) membuat satu partition menjadi botol leher.</p>'
    },
    {
      type: 'example',
      title: 'Record dengan key vs tanpa key',
      lang: 'text',
      output: false,
      code: `DENGAN KEY (DefaultPartitioner)
  key "ACC-01" → hash → 0 % 3 = P0
  key "ACC-07" → hash → 1 % 3 = P1
  key "ACC-01" → hash → 0 % 3 = P0   ← selalu P0

TANPA KEY (null key)
  r1 → P0 (sticky: batch berikutnya menempel ke partition terakhir)
  r2 → P0
  r3 → P0
  r4 → P1   ← berganti setelah batch/interval tertentu
  r5 → P1

Catatan: default partitioner modern memakai sticky partition —
menempel ke satu partition sampai batch penuh/lalu berganti,
bukan round-robin per record seperti versi lama.`,
      explain: [
        'Dengan key, penempatan <b>deterministik dan stabil</b> — inilah jaminan urutan per entitas yang menjadi dasar banyak pola desain.',
        'Tanpa key, producer bebas memilih partition; versi lama memakai round-robin per record, versi modern memakai <b>sticky partition</b> agar batch lebih besar dan throughput lebih tinggi.',
        'Karena urutan antar record tanpa key tidak dijamin, jangan pernah mengandalkan urutan global untuk data kritis — gunakan key.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Urutan: per key, bukan global</h3><p>Janji Kafka yang perlu kamu hafal: <b>urutan dijamin di dalam satu partition</b>. Dalam praktiknya ini berarti:</p><ul><li>Urutan <b>per key terjamin</b> (karena key sama selalu ke partition sama).</li><li>Urutan <b>antar key tidak dijamin</b> — record ACC-01 dan ACC-07 bisa berada di partition berbeda.</li><li>Urutan <b>antar partition tidak dijamin</b> — dua broker menulis paralel.</li></ul><p>Menambah/mengurangi jumlah partition mengubah hasil modulus, sehingga <b>penempatan key lama bisa berpindah partition</b>. Itulah sebabnya jumlah partition termasuk keputusan yang sulit dibatalkan — menambah partition aman (urutan lama per key tetap di partition lamanya, hanya key baru yang terdistribusi ulang), tetapi penempatan masa lalu tidak dihitung ulang.</p>'
    },
    {
      type: 'example',
      title: 'Menentukan jumlah partition: kerangka berpikir',
      lang: 'text',
      output: false,
      code: `TARGET THROUGHPUT
  target_bytes_per_sec = 50 MB/s (total, arah tulis)
  throughput_per_partition ≈ 10 MB/s (asumsi aman)
  partitions_min = ceil(50 / 10) = 5

KONSUMSI
  max_consumers_useful = jumlah partition (per group)
  kebutuhan paralelisasi consumer = 6
  → setidaknya 6 partition

KEAMANAN
  jumlah broker = 3
  partition jangan terlalu banyak dari broker
  (mis. maks 2-4x jumlah broker untuk cluster kecil)

HASIL: mulai dari 6, ukur lagi dengan benchmark nyata
(rule of thumb: lebih baik kurang daripada berlebih)`,
      explain: [
        'Jumlah partition diturunkan dari <b>target throughput</b> dan <b>kebutuhan paralelisme consumer</b>, bukan dari tebakan.',
        'Batasi agar tidak jauh melebihi jumlah broker — tiap partition membawa file log, index, dan beban replikasi yang harus dijaga semua broker.',
        'Angka akhir selalu divalidasi dengan <b>benchmark nyata</b> (dibahas di pelajaran Performance Tuning), bukan sekadar rumus di atas kertas.'
      ]
    },
    {
      type: 'warn',
      title: 'Mistake desain yang paling mahal',
      text: '<ul><li><b>Key selalu sama</b> (mis. key = &quot;global&quot; untuk semua record) — satu partition menampung semua traffic.</li><li><b>Key dengan kardinalitas rendah</b> seperti status order (&quot;paid&quot;/&quot;pending&quot;) — hanya 2-3 partition yang hidup dari 12 yang dibuat.</li><li><b>Menambah partisi tanpa pertimbangan</b> — mengubah hasil hash dan membatalkan asumsi urutan yang dibangun aplikasi.</li><li><b>Partition terlalu banyak untuk cluster kecil</b> — metadata membengkak, recovery lambat, file handle menumpuk.</li><li><b>Menaruh PII pada key</b> — key terlihat di banyak tempat (monitoring, log, tooling); pilih key yang aman.</li></ul>'
    },
    {
      type: 'tip',
      title: 'Cara memeriksa distribusi nyata',
      text: '<p>Jangan percaya asumsi — buktikan dengan <code>kafka-get-offsets.sh</code> per partition. Bila satu partition jauh lebih besar offset-nya dari yang lain, di situ ada skew: key-nya terlalu sempit atau memang ada satu entitas yang sangat aktif. Periksa juga lewat <code>--describe</code> yang menampilkan ukuran log tiap partition.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Partition', 'Satu segmen log berurutan milik topic; unit paralelisme dan replikasi.'],
        ['Key', 'Nilai (opsional) yang menentukan partition tujuan record.'],
        ['Partitioner', 'Logika memilih partition: hash(key) % jumlah partition.'],
        ['Murmur2', 'Fungsi hash yang dipakai Kafka untuk menentukan partition dari key.'],
        ['Default partitioner', 'Partitioner bawaan producer; sticky untuk record tanpa key.'],
        ['Partition skew', 'Kondisi di mana satu partition jauh lebih padat dari partition lain.'],
        ['Kardinalitas key', 'Jumlah nilai unik sebuah key — menentukan seberapa merata distribusi.']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Jelaskan dua peran partition: <b>paralelisme</b> dan <b>replikasi</b>.</li><li>Hitung: target tulis 50 MB/s, asumsi 10 MB/s per partition — berapa partition minimum? Lalu apa faktor lain yang menaikkannya?</li><li>Key apa yang kamu pilih untuk topic <code>order-events</code> bila urutan lifecycle per pesanan wajib terjaga? Mengapa?</li><li>Apa yang terjadi pada penempatan key lama ketika partition ditambah dari 3 menjadi 6?</li><li>Buktikan distribusi: kirim 20 record dengan 3 key berbeda, lalu bandingkan offset tiap partition dengan <code>kafka-get-offsets.sh</code>.</li></ol>'
    }
  ],
  recap: [
    'Partition adalah <b>unit paralelisme sekaligus unit replikasi</b> — membagi topic memungkinkan tulis/baca bersamaan di banyak broker.',
    'Record ber-key: <b>hash(key) % jumlah partition</b> → key sama selalu ke partition sama → urutan per key terjaga.',
    'Record tanpa key memakai <b>sticky partition</b> (menempel lalu berganti) — tidak ada urutan yang diandalkan.',
    'Jumlah partition diturunkan dari <b>target throughput + kebutuhan consumer</b>, dibatasi jumlah broker, divalidasi benchmark.'
  ]
});
