/* ============================================================
   Pelajaran RabbitMQ — Bab 5: Fanout Exchange & Topic Exchange
   ============================================================ */
'use strict';

window.RABBITMQ_LESSONS = window.RABBITMQ_LESSONS || [];

window.RABBITMQ_LESSONS.push({
  id: 'exchange-fanout-topic',
  title: 'Fanout Exchange & Topic Exchange',
  chapter: 'Exchange & Routing',
  duration: '8–10 menit',
  intro: [
    'Direct exchange punya satu kelemahan yang disengaja: ia hanya mengirim ke kecocokan persis. Ketika satu pesan harus <b>disebarkan ke semua pihak</b>, atau ketika kecocokannya berbentuk <b>pola bertingkat</b>, keduanya tidak lagi cukup.',
    'Bab ini membahas dua tipe berikutnya. <b>Fanout</b> menyiarkan pesan ke seluruh queue yang terikat tanpa peduli routing key. <b>Topic</b> memberi kekuatan pola memakai dua karakter khusus: <code>*</code> (tepat satu kata) dan <code>#</code> (nol atau banyak kata).',
    'Studi kasusnya konkret: pembaruan cache global dan leaderboard dengan fanout, lalu agregasi log lintas wilayah (<code>app.europe.error</code>, <code>audit.asia.info</code>) dengan topic.'
  ],
  objectives: [
    'Menerapkan fanout exchange untuk menyebarkan satu pesan ke semua queue terikat',
    'Menulis binding topik memakai pola * dan # beserta aturan pencocokannya',
    'Memprediksi ke mana sebuah pesan akan dikirim berdasarkan kunci dan binding',
    'Memilih tipe exchange yang tepat untuk tiga studi kasus nyata'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Fanout: Siaran Tanpa Peduli Kunci</h3><p>Fanout bekerja seperti pengeras suara: pesan yang masuk <b>disebarkan ke SEMUA queue yang terikat</b>, tanpa memeriksa routing key sama sekali. Karena itu routing key yang kamu tulis pada fanout praktis diabaikan.</p><p>Pola ini tepat ketika satu peristiwa harus diketahui banyak pihak sekaligus dan masing-masing menangani reaksinya sendiri:</p><ul><li><b>Update cache global</b> — satu pesan "produk 42 berubah" membuat seluruh service yang memegang cache ikut membuang salinannya.</li><li><b>Leaderboard / statistik</b> — service peringatan, notifikasi, dan analitik semuanya membutuhkan skor yang sama.</li><li><b>Replica antar region</b> — setiap region menerima salinan peristiwa untuk disinkronkan.</li></ul><p>Catatan penting: bila tidak ada satu pun queue yang terikat, pesan <b>langsung dibuang</b>. Fanout tidak menunggu penerima baru muncul.</p>'
    },
    {
      type: 'text',
      html: '<h3>Topic: Kecocokan Berbasis Pola</h3><p>Topic exchange adalah tipe paling ekspresif. Routing key ditulis sebagai daftar kata yang dipisahkan titik (misalnya <code>app.europe.error</code>), lalu binding key boleh memakai dua wildcard:</p><ul><li><code>*</code> (bintang) — mewakili <b>tepat satu kata</b>. <code>app.*.error</code> cocok dengan <code>app.europe.error</code> tetapi tidak dengan <code>app.europe.west.error</code>.</li><li><code>#</code> (hash) — mewakili <b>nol atau lebih kata</b>. <code>europe.#</code> cocok dengan <code>europe</code>, <code>europe.error</code>, dan <code>europe.west.error</code>.</li></ul><p>Kata-kata kunci dipisahkan oleh titik, dan wildcard tidak pernah "menelan" titik pemisah. Seluruh bagian harus cocok — tidak ada kecocokan parsial di luar wildcard.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 330" width="760" role="img" aria-label="Fanout menyiarkan ke semua queue di kiri, topic mencocokkan pola di kanan">
        <rect x="20" y="30" width="340" height="270" rx="10" class="u-box"/>
        <text x="190" y="56" class="u-title" text-anchor="middle">Fanout — siaran ke semua</text>
        <line x1="36" y1="66" x2="344" y2="66" class="u-line"/>
        <rect x="40" y="84" width="96" height="44" rx="6" class="u-hd"/>
        <text x="88" y="110" class="u-lbl" text-anchor="middle">Producer</text>
        <line x1="140" y1="106" x2="184" y2="106" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="188" y="84" width="150" height="44" rx="6" class="u-box"/>
        <text x="263" y="110" class="u-lbl" text-anchor="middle">fanout (rk diabaikan)</text>
        <line x1="263" y1="132" x2="120" y2="164" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="263" y1="132" x2="263" y2="164" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="263" y1="132" x2="406" y2="164" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="40" y="168" width="160" height="42" rx="6" class="u-hd"/>
        <text x="120" y="194" class="u-lbl" text-anchor="middle">Queue: cache-invalidate</text>
        <rect x="205" y="168" width="116" height="42" rx="6" class="u-hd"/>
        <text x="263" y="194" class="u-lbl" text-anchor="middle">Queue: leaderboard</text>
        <rect x="40" y="224" width="160" height="42" rx="6" class="u-hd"/>
        <text x="120" y="250" class="u-lbl" text-anchor="middle">Queue: analytics</text>
        <rect x="205" y="224" width="116" height="42" rx="6" class="u-box"/>
        <text x="263" y="250" class="u-lbl" text-anchor="middle">Queue: replica-eu</text>
        <text x="190" y="288" class="u-lbl" text-anchor="middle">semua terikat menerima salinan</text>

        <rect x="400" y="30" width="340" height="270" rx="10" class="u-box"/>
        <text x="570" y="56" class="u-title" text-anchor="middle">Topic — cocokkan pola</text>
        <line x1="416" y1="66" x2="724" y2="66" class="u-line"/>
        <rect x="416" y="84" width="140" height="44" rx="6" class="u-hd"/>
        <text x="486" y="110" class="u-lbl" text-anchor="middle">rk: app.europe.error</text>
        <line x1="560" y1="106" x2="596" y2="106" class="u-line" marker-end="url(#u-arrow)"/>
        <rect x="600" y="84" width="124" height="44" rx="6" class="u-box"/>
        <text x="662" y="110" class="u-lbl" text-anchor="middle">topic exchange</text>
        <line x1="662" y1="132" x2="540" y2="164" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="662" y1="132" x2="704" y2="164" class="u-dash"/>
        <rect x="416" y="168" width="200" height="42" rx="6" class="u-hd"/>
        <text x="516" y="194" class="u-lbl" text-anchor="middle">binding: app.*.error ✓</text>
        <rect x="630" y="168" width="94" height="42" rx="6" class="u-box"/>
        <text x="677" y="186" class="u-lbl" text-anchor="middle">binding:</text>
        <text x="677" y="202" class="u-lbl" text-anchor="middle">audit.# ✗</text>
        <rect x="416" y="224" width="200" height="42" rx="6" class="u-hd"/>
        <text x="516" y="250" class="u-lbl" text-anchor="middle">binding: europe.# ✓</text>
        <rect x="630" y="224" width="94" height="42" rx="6" class="u-box"/>
        <text x="677" y="242" class="u-lbl" text-anchor="middle">binding:</text>
        <text x="677" y="258" class="u-lbl" text-anchor="middle">app.us.* ✗</text>
        <text x="570" y="288" class="u-lbl" text-anchor="middle">dua dari empat binding cocok</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 5.1</b> — Fanout mengabaikan kunci dan menyiarkan; topic mencocokkan routing key terhadap pola binding</figcaption></figure>`
    },
    {
      type: 'example',
      title: 'Fanout: Satu Pesan, Empat Penerima',
      lang: 'bash',
      output: false,
      code: `alias rmq='podman exec -i rabbitmq-server rabbitmqadmin'

rmq declare exchange name=e-score type=fanout durable=true
rmq declare queue name=leaderboard durable=true
rmq declare queue name=analytics  durable=true
rmq declare queue name=cache-flush durable=true

rmq declare binding source=e-score destination=leaderboard
rmq declare binding source=e-score destination=analytics
rmq declare binding source=e-score destination=cache-flush

# Routing key di sini diabaikan — tulis apa pun hasilnya sama
rmq publish exchange=e-score routing_key=apa-saja payload='skor pemain 88'

# Ketiganya harus menerima 1 pesan
rmq list queues name messages`,
      explain: [
        'Perhatikan perintah <code>declare binding</code> tanpa <code>routing_key</code> — memang tidak diperlukan karena fanout tidak pernah membacanya.',
        'Angka Ready pada ketiga queue naik serentak dengan satu publish; inilah bukti siaran (broadcast) terjadi.',
        'Bila kamu menambah queue keempat besok, cukup buat queue dan bindingnya — pesan berikutnya otomatis ikut ke sana.'
      ]
    },
    {
      type: 'example',
      title: 'Topic: Alograsi Log Lintas Wilayah',
      lang: 'bash',
      output: false,
      code: `alias rmq='podman exec -i rabbitmq-server rabbitmqadmin'

rmq declare exchange name=e-logs type=topic durable=true
rmq declare queue name=q-all-error     durable=true
rmq declare queue name=q-europe        durable=true
rmq declare queue name=q-audit-trail   durable=true
rmq declare queue name=q-app-error-us  durable=true

rmq declare binding source=e-logs destination=q-all-error   routing_key='*.error'
rmq declare binding source=e-logs destination=q-europe      routing_key='europe.#'
rmq declare binding source=e-logs destination=q-audit-trail routing_key='audit.#'
rmq declare binding source=e-logs destination=q-app-error-us routing_key='app.us.*'

rmq publish exchange=e-logs routing_key='app.europe.error' payload='gagal simpan order'
rmq publish exchange=e-logs routing_key='audit.asia.info'  payload='login admin'

rmq list queues name messages`,
      explain: [
        'Pesan <code>app.europe.error</code> diterima <code>q-all-error</code> (pola <code>*.error</code> cocok) dan <code>q-europe</code> (pola <code>europe.#</code> cocok), tetapi tidak oleh dua queue lainnya.',
        'Pesan <code>audit.asia.info</code> hanya diterima <code>q-audit-trail</code> — pola <code>audit.#</code> menangkap tiga kata sesudahnya.',
        'Pola <code>app.us.*</code> tidak menerima apa pun karena tidak ada pesan yang dimulai <code>app.us</code> pada percobaan ini.'
      ]
    },
    {
      type: 'example',
      title: 'Tabel Kecocokan Topic — Uji Pemahamanmu',
      lang: 'text',
      output: false,
      code: `ROUTING KEY        BINDING         COCOK?  KETERANGAN
---------------     -------------   ------  --------------------------
app.europe.error    app.*.error       YA    3 kata persis 3 pola
app.europe.error    app.#             YA    # menangkap sisa (nol+)
app.europe.error    *.error           YA    * = tepat 1 kata (europe)
app.europe.error    app.*             TIDAK  app.* butuh tepat 2 kata
app.europe.error    app.europe.west.* TIDAK  jumlah kata tidak cocok
europe              europe.#          YA    # boleh nol kata
europe              *.error           TIDAK  kata kedua tidak ada
app.us.west.error   app.*.*.error     YA    empat pola = empat kata`,
      explain: [
        'Aturan terpenting: <code>*</code> = tepat satu kata, <code>#</code> = nol atau lebih. Selalu hitung jumlah kata terlebih dahulu sebelum menebak hasil.',
        'Bingung <code>app.*</code> tidak cocok dengan <code>app.europe.error</code>? Karena <code>app.*</code> menuntut tepat dua kata, sedangkan routing key-nya punya tiga.',
        'Simpan tabel ini dan uji dengan mengirim pesan sungguhan ke dashboard; melihat sendiri queue mana yang terisi jauh lebih cepat diingat daripada sekadar membaca aturan.'
      ]
    },
    {
      type: 'tip',
      title: 'Gunakan Fanout untuk Observabilitas',
      text: 'Pola paling umum untuk fanout adalah <b>pengawasan sistem</b>: satu peristiwa "order gagal" disiarkan ke queue notifikasi, queue analitik, dan queue audit sekaligus. Ketiganya boleh tumbuh, mati, atau diperbaiki tanpa menyentuh kode producer — dan itu justru yang kamu inginkan pada sistem pengawasan.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Topic exchange yang binding-nya dibuat longgar (misalnya <code>#</code>) berarti <b>setiap pesan diterima semua queue</b> — sering kali tidak disengaja dan membuat satu queue menumpuk tanpa ada yang mengkonsumsinya. Sebaliknya, binding yang terlalu sempit membuat pesan dibuang diam-diam. Periksa <code>list_bindings</code> sebelum menyimpulkan kode producer rusak.'
    },
    {
      type: 'vocab',
      items: [
        ['Fanout exchange', 'Tipe exchange yang menyiarkan pesan ke seluruh queue terikat tanpa memeriksa routing key.'],
        ['Topic exchange', 'Tipe exchange yang mencocokkan routing key terhadap pola binding memakai wildcard * dan #.'],
        ['Wildcard *', 'Pada topic, mewakili tepat satu kata dalam routing key.'],
        ['Wildcard #', 'Pada topic, mewakili nol atau lebih kata — bisa berdiri sendiri sebagai seluruh binding.'],
        ['Broadcast', 'Pola satu-ke-banyak; setiap penerima mendapat salinan pesan yang sama.'],
        ['Log aggregation', 'Pengumpulan log dari banyak sumber ke satu tujuan berdasarkan pola topik.'],
        ['Queue terikat (bound)', 'Queue yang memiliki binding ke sebuah exchange sehingga berhak menerima pesan dari sana.']
      ]
    }
  ],
  recap: [
    'Fanout menyiarkan pesan ke semua queue terikat dan mengabaikan routing key; tanpa queue terikat, pesan langsung dibuang.',
    'Topic exchange memakai pola: * mewakili tepat satu kata, # mewakili nol atau lebih kata, dipisahkan titik.',
    'Satu pesan boleh diterima banyak queue sekaligus bila banyak binding yang cocok — kuncinya jumlah kata dan urutannya.',
    'Fanout cocok untuk cache/leaderboard/replica, topic untuk log lintas wilayah; keduanya menggantikan kecocokan persis milik direct exchange.'
  ]
});
