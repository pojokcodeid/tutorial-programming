/* ============================================================
   Pelajaran HTTP — Bab 2: Fondasi HTTP
   ============================================================ */
'use strict';

window.HTTP_LESSONS = window.HTTP_LESSONS || [];

window.HTTP_LESSONS.push({
  id: 'fondasi-http',
  title: 'Fondasi HTTP: Client, Server, dan Request-Response',
  chapter: 'Fondasi',
  duration: '12–14 menit',
  intro: [
    'Setiap kali kamu membuka halaman web, aplikasi meminta sesuatu kepada server dan server menjawab. Pola sederhana itulah inti <b>HTTP</b> (<i>HyperText Transfer Protocol</i>): sebuah protokol komunikasi client-server yang menentukan bagaimana pesan disusun, dikirim, dan dipahami.',
    'HTTP sengaja dibuat <b>stateless</b>. Artinya, secara default server tidak mengingat request sebelumnya. Kalau kamu mengirim dua request yang sama, server memperlakukannya sebagai dua percakapan terpisah. Sifat ini membuat HTTP mudah diskalakan, tetapi juga menjelaskan mengapa kita membutuhkan cookie, session, atau token untuk menjaga keadaan login.',
    'Bab ini membangun fondasi sebelum masuk ke detail pesan: siapa client dan server, apa arti stateless, bagaimana HTTP berbeda dari HTTPS, mengapa ada beberapa versi protokol, dan ke mana harus mencari standar resmi ketika dokumentasi tutorial tidak cukup.'
  ],
  objectives: [
    'Menjelaskan model request-response dan peran client serta server',
    'Memahami makna stateless dan cara aplikasi mempertahankan state',
    'Membedakan HTTP dengan HTTPS, DNS, TCP, dan IP',
    'Mengenali versi HTTP serta peran RFC dan MDN sebagai rujukan'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>HTTP sebagai Protokol Komunikasi</h3><p><b>Protokol</b> adalah kesepakatan tentang format dan urutan pesan. Tanpa kesepakatan, browser dan server tidak akan tahu apakah sebuah teks adalah nama halaman, data formulir, atau perintah untuk menghapus sesuatu. HTTP menetapkan hal-hal seperti:</p><ul><li><b>Method</b> — tindakan yang diminta, misalnya <code>GET</code> atau <code>POST</code>.</li><li><b>Target</b> — resource yang dituju, misalnya <code>/products/4</code>.</li><li><b>Header</b> — metadata request atau response.</li><li><b>Body</b> — data opsional yang ikut dikirim.</li><li><b>Status code</b> — ringkasan hasil pemrosesan oleh server.</li></ul><p>Client tidak perlu tahu bagaimana server menyimpan data. Server juga tidak perlu tahu apakah client berupa browser, aplikasi Android, atau skrip curl. Keduanya hanya perlu berbicara dalam format HTTP yang sama.</p>'
    },
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 300" width="760" role="img" aria-label="Perjalanan request dari client melalui DNS, TCP, dan TLS menuju server lalu kembali sebagai response">
        <rect x="24" y="90" width="150" height="80" rx="10" class="u-box"/>
        <text x="99" y="120" class="u-title" text-anchor="middle">Client</text>
        <text x="99" y="143" class="u-lbl" text-anchor="middle">browser / curl</text>

        <rect x="210" y="42" width="145" height="58" rx="8" class="u-box"/>
        <text x="282" y="66" class="u-lbl" text-anchor="middle">DNS</text>
        <text x="282" y="85" class="u-lbl" text-anchor="middle">nama → IP</text>

        <rect x="210" y="118" width="145" height="58" rx="8" class="u-box"/>
        <text x="282" y="142" class="u-lbl" text-anchor="middle">TCP</text>
        <text x="282" y="161" class="u-lbl" text-anchor="middle">koneksi andal</text>

        <rect x="210" y="194" width="145" height="58" rx="8" class="u-hl"/>
        <text x="282" y="218" class="u-lbl" text-anchor="middle">TLS (HTTPS)</text>
        <text x="282" y="237" class="u-lbl" text-anchor="middle">enkripsi</text>

        <rect x="405" y="90" width="145" height="80" rx="10" class="u-box"/>
        <text x="477" y="120" class="u-title" text-anchor="middle">HTTP</text>
        <text x="477" y="143" class="u-lbl" text-anchor="middle">request / response</text>

        <rect x="590" y="90" width="145" height="80" rx="10" class="u-box"/>
        <text x="662" y="120" class="u-title" text-anchor="middle">Server</text>
        <text x="662" y="143" class="u-lbl" text-anchor="middle">aplikasi / API</text>

        <line x1="178" y1="115" x2="206" y2="76" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="178" y1="130" x2="206" y2="140" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="178" y1="150" x2="206" y2="216" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="359" y1="140" x2="401" y2="130" class="u-line" marker-end="url(#u-arrow)"/>
        <line x1="554" y1="130" x2="586" y2="130" class="u-line" marker-end="url(#u-arrow)"/>
        <path d="M 662 174 L 662 264 L 99 264 L 99 176" class="u-dash" fill="none" marker-end="url(#u-arrow)"/>
        <text x="380" y="286" class="u-lbl" text-anchor="middle">response kembali ke client</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 2.1</b> — HTTP berada di atas DNS, TCP, dan TLS; masing-masing lapisan punya tugas berbeda</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Stateless: Tidak Ingat, tetapi Bisa Bekerja Sama</h3><p>Bayangkan seorang barista yang melayani antrean tanpa mengingat pelanggan sebelumnya. Setiap pesanan harus lengkap saat disampaikan: jenis minuman, ukuran, es, dan gula. Itulah HTTP stateless. Server tidak menyimpan konteks percakapan secara otomatis; setiap request harus membawa informasi yang dibutuhkan.</p><p>Sifat ini punya dua sisi:</p><ul><li><b>Kelebihan</b> — server mudah ditambah, request bisa diarahkan ke instance mana pun, dan kegagalan satu request tidak otomatis merusak request lain.</li><li><b>Konsekuensi</b> — login tidak bisa hanya mengandalkan “server ingat saya”. Aplikasi harus mengirim bukti identitas pada request berikutnya, misalnya cookie sesi atau bearer token.</li></ul><p>Jadi, ketika orang mengatakan “HTTP stateless”, bukan berarti aplikasi web tidak bisa punya state. State tetap ada, tetapi dikelola di cookie, session store, token, atau database — bukan disimpan diam-diam di dalam protokol.</p>'
    },
    {
      type: 'example',
      title: 'Membandingkan HTTP dan HTTPS',
      lang: 'bash',
      output: false,
      code: `# HTTP polos: isi pesan bisa dibaca pihak di tengah jaringan
curl -i http://localhost:8787/health

# HTTPS: koneksi dilindungi TLS
curl -I https://example.com

# Lihat detail negosiasi TLS dan sertifikat
curl -v https://example.com

# Ringkas waktu total dan status
curl -o /dev/null -s -w 'HTTP: %{http_code}\\nTotal: %{time_total}s\\n' https://example.com`,
      explain: [
        'HTTP menentukan format pesan; HTTPS adalah HTTP yang dikirim melalui koneksi TLS. Jadi HTTPS bukan protokol pesan yang berbeda, melainkan HTTP yang lebih aman di lapisan transport.',
        'Tanpa TLS, header dan body dapat terlihat oleh pihak yang menguasai jaringan. TLS memberikan kerahasiaan, integritas, dan autentikasi server.',
        'Opsi <code>-I</code> meminta HEAD sehingga hanya header yang dikembalikan. Ini cara cepat memeriksa status dan header tanpa mengunduh body.'
      ]
    },
    {
      type: 'example',
      title: 'Satu Halaman, Banyak Request',
      lang: 'text',
      output: false,
      code: `Buka sebuah situs berita di browser, lalu amati Network:

1. Request pertama  : dokumen HTML
2. Request berikut  : CSS, JavaScript, gambar, font
3. Request API      : data berita, komentar, iklan
4. Request analitik : telemetry dan pelacakan

Satu halaman bisa menghasilkan puluhan bahkan ratusan request.
Setiap request punya method, status, header, dan timing sendiri.`,
      explain: [
        'HTML adalah titik awal, bukan keseluruhan halaman. Browser kemudian menemukan referensi CSS, JavaScript, dan gambar di dalam HTML lalu meminta file-file itu secara terpisah.',
        'Banyak request bisa berjalan paralel, tetapi batas koneksi, prioritas, dan ukuran file tetap memengaruhi waktu tampil.',
        'Saat mendiagnosis halaman lambat, jangan hanya melihat request HTML. Periksa juga aset besar, request API yang lambat, dan request yang gagal.'
      ]
    },
    {
      type: 'tip',
      title: 'Urutan Lapisan yang Perlu Diingat',
      text: 'Gunakan urutan sederhana ini saat menjelaskan masalah jaringan: <b>URL → DNS → TCP → TLS → HTTP → aplikasi</b>. Jika nama domain tidak ditemukan, masalahnya di DNS. Jika koneksi ditolak, curigai TCP/port. Jika sertifikat bermasalah, itu TLS. Jika response aneh tetapi koneksi berhasil, barulah fokus ke HTTP dan aplikasi.'
    },
    {
      type: 'warn',
      title: 'Jangan Menyamakan Semua Lapisan',
      text: 'HTTP bukan DNS dan bukan TCP. Error “tidak bisa terhubung” belum tentu berarti status code salah; bisa jadi server tidak mendengarkan port, DNS gagal, atau TLS ditolak. Memisahkan lapisan akan membuat diagnosis jauh lebih cepat daripada menebak-nebak.'
    },
    {
      type: 'vocab',
      items: [
        ['Protokol', 'Kesepakatan format dan aturan komunikasi antara dua pihak.'],
        ['Request-response', 'Pola di mana client mengirim permintaan dan server membalas dengan respons.'],
        ['Stateless', 'Sifat protokol yang tidak menyimpan konteks percakapan sebelumnya secara otomatis.'],
        ['HTTPS', 'HTTP yang dikirim melalui koneksi TLS sehingga terenkripsi dan terautentikasi.'],
        ['RFC', 'Dokumen standar teknis yang mendefinisikan perilaku protokol seperti HTTP.'],
        ['MDN', 'Dokumentasi web yang menjelaskan konsep dan API browser secara praktis.'],
        ['HTTP/1.1, HTTP/2, HTTP/3', 'Versi protokol HTTP dengan cara framing dan transport yang berbeda.']
      ]
    }
  ],
  recap: [
    'HTTP adalah protokol request-response antara client dan server dengan format pesan yang disepakati.',
    'HTTP bersifat stateless; state aplikasi seperti login harus dibawa lewat cookie, session, atau token.',
    'HTTPS adalah HTTP di atas TLS, bukan protokol pesan yang sepenuhnya berbeda.',
    'Satu halaman biasanya memicu banyak request, sehingga diagnosis performa harus melihat seluruh rangkaian.'
  ]
});
