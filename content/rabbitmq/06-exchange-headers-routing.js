/* ============================================================
   Pelajaran RabbitMQ — Bab 6: Headers Exchange & Memilih Tipe
   ============================================================ */
'use strict';

window.RABBITMQ_LESSONS = window.RABBITMQ_LESSONS || [];

window.RABBITMQ_LESSONS.push({
  id: 'exchange-headers-routing',
  title: 'Headers Exchange & Memilih Tipe Exchange',
  chapter: 'Exchange & Routing',
  duration: '8–10 menit',
  intro: [
    'Tiga tipe sebelumnya — direct, fanout, topic — semuanya memutuskan berdasarkan <b>satu</b> potongan data: routing key. Kadang keputusan harus mempertimbangkan beberapa atribut sekaligus: wilayah, tipe perangkat, dan tingkat kepentingan dalam satu waktu.',
    '<b>Headers exchange</b> menjawab kebutuhan itu dengan mengabaikan routing key sama sekali dan membaca <b>atribut headers</b> pada pesan. Aturannya mendukung mode <code>x-match: all</code> (semua kunci harus cocok) dan <code>x-match: any</code> (cukup satu).',
    'Bab ini juga menutup seluruh materi routing dengan <b>perbandingan kelima tipe exchange</b>, pertimbangan performa, dan keputusan praktis: kapan memakai apa. Setelah ini kamu sudah memiliki gambaran lengkap bagaimana pesan memilih jalannya.'
  ],
  objectives: [
    'Menjelaskan cara kerja headers exchange dan aturan x-match all vs any',
    'Membuat binding headers beserta pesan ber-headers percobaan',
    'Membandingkan kelima tipe exchange (default, direct, fanout, topic, headers)',
    'Memilih tipe exchange yang tepat menurut kebutuhan dan pertimbangan performa'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Routing Berbasis Atribut</h3><p>Headers exchange menerapkan aturan ini: <b>bandingkan isi headers pesan dengan daftar kunci pada binding</b>. Routing key tidak ikut diperiksa, sehingga boleh diisi apa pun.</p><p>Setiap binding membawa dua hal: daftar pasangan kunci-nilai (misalnya <code>wilayah: europe</code>, <code>format: json</code>) dan satu penentu mode bernama <code>x-match</code>:</p><ul><li><code>x-match = all</code> — seluruh kunci pada binding <b>harus ada</b> di headers pesan dengan nilai yang sama.</li><li><code>x-match = any</code> — <b>cukup satu</b> kunci yang cocok, sisanya boleh tidak ada.</li></ul><p>Bayangkan ini seperti formulir pendaftaran bertingkat: direct exchange hanya mengecek satu kolom, headers exchange mengecek banyak kolom sekaligus dan kamu menentukan apakah semua kolom wajib cocok atau satu saja cukup.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Headers exchange membandingkan headers pesan terhadap kunci binding dengan x-match all dan any">
        <rect x="20" y="40" width="230" height="200" rx="10" class="u-hd"/>
        <text x="135" y="66" class="u-title" text-anchor="middle">Headers pada pesan</text>
        <line x1="36" y1="76" x2="234" y2="76" class="u-line"/>
        <text x="52" y="102" class="u-lbl">wilayah : europe</text>
        <text x="52" y="126" class="u-lbl">format  : json</text>
        <text x="52" y="150" class="u-lbl">penting : tinggi</text>
        <text x="52" y="174" class="u-lbl">perangkat : mobile</text>
        <text x="135" y="212" class="u-lbl" text-anchor="middle">(routing key diabaikan)</text>

        <line x1="254" y1="140" x2="326" y2="140" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="330" y="110" width="140" height="60" rx="8" class="u-box"/>
        <text x="400" y="136" class="u-title" text-anchor="middle">Exchange</text>
        <text x="400" y="158" class="u-lbl" text-anchor="middle">tipe: headers</text>

        <line x1="474" y1="124" x2="546" y2="84" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="474" y1="156" x2="546" y2="204" class="u-line" marker-end="url(#u-arrow)"/>

        <rect x="550" y="40" width="190" height="90" rx="8" class="u-hd"/>
        <text x="645" y="64" class="u-title" text-anchor="middle">x-match: all</text>
        <text x="645" y="86" class="u-lbl" text-anchor="middle">wilayah=europe + format=json</text>
        <text x="645" y="106" class="u-lbl" text-anchor="middle">keduanya cocok → terima ✓</text>
        <rect x="550" y="170" width="190" height="90" rx="8" class="u-box"/>
        <text x="645" y="194" class="u-title" text-anchor="middle">x-match: any</text>
        <text x="645" y="216" class="u-lbl" text-anchor="middle">perangkat=desktop</text>
        <text x="645" y="236" class="u-lbl" text-anchor="middle">tidak cocok → tolak ✗</text>

        <text x="380" y="284" class="u-lbl" text-anchor="middle">Aturan dibaca dari binding, keputusan dari isi headers pesan</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 6.1</b> — Headers exchange membandingkan pasangan kunci-nilai, dengan mode all atau any</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Headers Exchange: Percobaan Lengkap',
      lang: 'bash',
      output: false,
      code: `alias rmq='podman exec -i rabbitmq-server rabbitmqadmin'

rmq declare exchange name=e-region type=headers durable=true
rmq declare queue name=q-eu-json    durable=true
rmq declare queue name=q-any-mobile durable=true

# Binding 1: semua kunci wajib cocok (x-match = all)
rmq declare binding source=e-region destination=q-eu-json \\
  arguments='{"x-match":"all","wilayah":"europe","format":"json"}'

# Binding 2: satu kunci cukup (x-match = any)
rmq declare binding source=e-region destination=q-any-mobile \\
  arguments='{"x-match":"any","perangkat":"mobile"}'

# Pesan ber-headers (routing key sengaja dibuat tidak relevan)
rmq publish exchange=e-region routing_key=abaikan \\
  headers='{"wilayah":"europe","format":"json","penting":"tinggi"}' \\
  payload='data order eropa'

rmq list queues name messages`,
      explain: [
        'Pesan pertama diterima <code>q-eu-json</code> karena kedua kunci <code>wilayah</code> dan <code>format</code> cocok dengan binding bertipe <code>all</code>.',
        'Queue <code>q-any-mobile</code> tidak menerima pesan itu karena satu-satunya kuncinya <code>perangkat: mobile</code> tidak ada di headers pesan.',
        'Nilai <code>penting: tinggi</code> pada pesan tidak merusak apa pun — binding hanya menuntut kunci yang ia sebutkan.'
      ]
    },
    {
      type: 'example',
      title: 'Kelima Tipe Exchange dalam Satu Pandangan',
      lang: 'text',
      output: false,
      code: `TIPE       DASAR KEPUTUSAN             KARAKTER                 KASUS
---------  --------------------------  -----------------------  --------------------------
default    nama queue                  tanpa konfigurasi        satu antrean sederhana
direct     routing key == binding key  persis, mudah ditebak     notifikasi per kanal
fanout     tidak memeriksa apa pun     siaran ke semua          cache, leaderboard, replica
topic      pola * dan # pada kunci     ekspresif, bertingkat    log lintas wilayah
headers    isi headers pesan           multi-atribut, paling    filter kompleks bertingkat
                                          berat

Urutan pemakaian paling umum di lapangan:
  1. direct  → pilihan default hampir semua aplikasi
  2. topic   → saat kebutuhan mulai bertingkat
  3. fanout  → saat satu pesan harus menyebar ke banyak pihak
  4. headers → hanya bila kuncinya benar-benar multi-atribut`,
      explain: [
        'Direct menjadi paling sering dipakai karena paling dapat diprediksi dan termurah dari sisi pemrosesan — cocok sebagai titik awal.',
        'Headers exchange adalah yang paling boros karena membandingkan banyak kunci per pesan per binding; gunakan hanya bila direct atau topic sudah tidak cukup.',
        'Default exchange tidak perlu dibuat; ia sudah ada sebagai "jalan pintas" menuju satu nama queue.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Pertimbangan Performa &amp; Desain</h3><p>Kelima tipe berjalan di atas mesin pencocokan yang sudah dioptimalkan, tetapi ada perbedaan nyata:</p><ul><li><b>Direct</b> — pencocokan hash sederhana, termurah.</li><li><b>Topic</b> — pola dipecah lalu dicocokkan; tetap cepat, sedikit lebih mahal dari direct.</li><li><b>Fanout</b> — sangat cepat karena tidak membandingkan apa pun; biayanya ada pada jumlah salinan.</li><li><b>Headers</b> — membandingkan banyak pasangan kunci-nilai; pakai bila manfaatnya sepadan.</li></ul><p>Prinsip desain yang lebih penting daripada performa: <b>buat routing yang bisa dibaca orang lain</b>. Kunci seperti <code>app.europe.error</code> menjelaskan dirinya sendiri di dashboard; headers yang tersembunyi di dalam kode produksi sering membuat orang bingung ketika pesan "tidak sampai".</p>'
    },
    {
      type: 'example',
      title: 'Alur Memilih Tipe Exchange',
      lang: 'text',
      output: false,
      code: `Pertanyaan 1: Pesan harus sampai ke satu queue saja, tanpa aturan?
  YA  → pakai default exchange (sendToQueue) — selesai

Pertanyaan 2: Pesan harus menyebar ke SEMUA queue terikat?
  YA  → pakai fanout

Pertanyaan 3: Keputusannya berdasarkan beberapa atribut pada headers?
  YA  → pakai headers (x-match all/any)

Pertanyaan 4: Keputusannya berdasarkan pola bertingkat?
  YA  → pakai topic (* dan #)

Sisanya → direct, lalu tambah binding sebanyak yang dibutuhkan`,
      explain: [
        'Alur ini dimulai dari yang paling sederhana; kebanyakan aplikasi berhenti di direct dan tidak perlu naik ke tipe lain.',
        'Bila ternyata routing-mu menjadi sangat rumit, pertimbangkan memecahnya menjadi dua exchange bertahap — daripada membuat satu exchange yang mustahil dibaca.',
        'Keputusan bisa berubah seiring waktu; RabbitMQ mengizinkan membuat exchange baru dan memindahkan binding tanpa mengubah skema data apa pun.'
      ]
    },
    {
      type: 'tip',
      title: 'Bila Ragu, Mulai dari Direct',
      text: 'Jangan memilih tipe exchange paling canggih sejak awal. Mulailah dengan <b>direct</b>, tambahkan binding seiring kebutuhan, lalu naik ke <b>topic</b> ketika kuncinya mulai bertingkat. Router yang sederhana jauh lebih mudah diaudit saat ada pesan "hilang" di produksi — dan dashboard akan tetap mudah dibaca oleh timmu.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Headers exchange mengabaikan routing key sepenuhnya. Bila kamu membawa informasi penting di routing key lalu mengganti tipe exchange menjadi headers, <b>seluruh aturan routing lama berhenti bekerja</b> tanpa error apa pun. Selalu uji ulang dengan pesan percobaan setiap kali mengubah tipe atau menambah binding.'
    },
    {
      type: 'vocab',
      items: [
        ['Headers exchange', 'Tipe exchange yang mengabaikan routing key lalu membandingkan isi headers pesan terhadap kunci binding.'],
        ['x-match: all', 'Mode di mana seluruh kunci pada binding harus cocok dengan headers pesan agar pesan diteruskan.'],
        ['x-match: any', 'Mode di mana cukup satu kunci yang cocok agar pesan diteruskan ke queue.'],
        ['Attributes pesan', 'Pasangan kunci-nilai tambahan pada pesan di luar body dan routing key.'],
        ['Exact match', 'Kecocokan persis milik direct exchange.'],
        ['Pattern matching', 'Kecocokan berpola memakai wildcard * dan # milik topic exchange.'],
        ['Routing table', 'Kumpulan seluruh binding pada sebuah exchange — peta yang menentukan jalannya tiap pesan.']
      ]
    }
  ],
  recap: [
    'Headers exchange mengabaikan routing key lalu membandingkan headers pesan terhadap kunci binding dengan mode x-match all atau any.',
    'Kelima tipe: default (nama queue), direct (persis), fanout (siaran), topic (pola * dan #), headers (multi-atribut).',
    'Direct paling umum karena murah dan mudah ditebak; headers paling berat dan hanya dipakai bila kebutuhan benar-benar multi-atribut.',
    'Saat mengganti tipe exchange, aturan lama berhenti bekerja tanpa error — selalu uji ulang dengan pesan percobaan.'
  ]
});
