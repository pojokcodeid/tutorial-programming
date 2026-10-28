/* ============================================================
   Pelajaran HTTP — Bab 14: HTTP/1.1, HTTP/2, dan HTTP/3
   ============================================================ */
'use strict';

window.HTTP_LESSONS = window.HTTP_LESSONS || [];

window.HTTP_LESSONS.push({
  id: 'http-versi',
  title: 'HTTP/1.1, HTTP/2, dan HTTP/3',
  chapter: 'Versi & Infrastruktur',
  duration: '13–15 menit',
  intro: [
    'Selama bertahun-tahun HTTP/1.1 menjadi tulang punggung web. Ia sederhana, mudah di-debug, dan masih dipakai di banyak sistem. Namun ketika satu halaman membutuhkan puluhan aset, keterbatasan koneksi dan head-of-line blocking mulai terasa.',
    'HTTP/2 membawa perubahan besar: pesan dipecah menjadi frame biner, banyak request dapat berjalan paralel dalam satu koneksi, dan header dikompresi dengan HPACK. HTTP/3 melangkah lebih jauh dengan memakai QUIC di atas UDP, mengintegrasikan TLS 1.3, dan mengurangi head-of-line blocking pada level transport.',
    'Bab ini membandingkan ketiga versi tanpa menganggap versi terbaru selalu otomatis lebih baik. Kita akan melihat apa yang berubah, apa yang tetap sama, serta bagaimana memeriksa protokol yang benar-benar dipakai oleh koneksi.'
  ],
  objectives: [
    'Membandingkan karakteristik HTTP/1.0, HTTP/1.1, HTTP/2, dan HTTP/3',
    'Menjelaskan persistent connection, pipelining, chunked, framing, dan multiplexing',
    'Memahami head-of-line blocking serta peran HPACK dan QUIC',
    'Memeriksa protokol yang dinegosiasikan dengan curl dan DevTools'
  ],
  sections: [
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 330" width="760" role="img" aria-label="Perbandingan cara HTTP/1.1, HTTP/2, dan HTTP/3 mengirim beberapa request">
        <rect x="24" y="30" width="220" height="250" rx="10" class="u-box"/>
        <text x="134" y="56" class="u-title" text-anchor="middle">HTTP/1.1</text>
        <text x="44" y="88" class="u-lbl">Koneksi 1: GET a ──►</text>
        <text x="44" y="112" class="u-lbl">Koneksi 2: GET b ──►</text>
        <text x="44" y="136" class="u-lbl">Koneksi 3: GET c ──►</text>
        <text x="44" y="176" class="u-lbl">Banyak koneksi paralel,</text>
        <text x="44" y="198" class="u-lbl">satu request per koneksi</text>
        <text x="44" y="220" class="u-lbl">pada satu waktu.</text>

        <rect x="270" y="30" width="220" height="250" rx="10" class="u-hl"/>
        <text x="380" y="56" class="u-title" text-anchor="middle">HTTP/2</text>
        <text x="290" y="88" class="u-lbl">Satu koneksi TCP</text>
        <text x="290" y="112" class="u-lbl">Stream 1: a, b, c</text>
        <text x="290" y="136" class="u-lbl">Stream 3: d, e</text>
        <text x="290" y="160" class="u-lbl">Frame biner + HPACK</text>
        <text x="290" y="196" class="u-lbl">Multiplexing menghindari</text>
        <text x="290" y="218" class="u-lbl">antrean request di level</text>
        <text x="290" y="240" class="u-lbl">aplikasi HTTP.</text>

        <rect x="516" y="30" width="220" height="250" rx="10" class="u-box"/>
        <text x="626" y="56" class="u-title" text-anchor="middle">HTTP/3</text>
        <text x="536" y="88" class="u-lbl">Satu koneksi QUIC</text>
        <text x="536" y="112" class="u-lbl">di atas UDP</text>
        <text x="536" y="136" class="u-lbl">TLS 1.3 terintegrasi</text>
        <text x="536" y="160" class="u-lbl">Stream independen</text>
        <text x="536" y="196" class="u-lbl">Kehilangan paket pada</text>
        <text x="536" y="218" class="u-lbl">satu stream tidak otomatis</text>
        <text x="536" y="240" class="u-lbl">memblokir stream lain.</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 14.1</b> — Evolusi utama: dari banyak koneksi ke multiplexing dalam satu koneksi</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>HTTP/1.0 dan HTTP/1.1</h3><p>HTTP/1.0 umumnya membuka koneksi baru untuk setiap request. HTTP/1.1 memperkenalkan <b>persistent connection</b> sebagai default: koneksi TCP dapat dipakai ulang untuk beberapa request berurutan. Ini menghemat waktu handshake, tetapi request pada satu koneksi masih diproses berurutan.</p><ul><li><b>Pipelining</b> memungkinkan client mengirim beberapa request tanpa menunggu respons pertama, tetapi sering tidak dipakai karena masalah head-of-line blocking dan dukungan implementasi yang tidak konsisten.</li><li><b>Chunked transfer coding</b> memungkinkan body dikirim dalam potongan ketika ukuran total belum diketahui, misalnya pada streaming.</li><li><b>Domain sharding</b> dulu dipakai untuk membuka lebih banyak koneksi, tetapi bertentangan dengan tujuan HTTP/2 dan menambah biaya DNS/TLS.</li></ul><p>Pada HTTP/1.1, header <code>Connection: keep-alive</code> dan <code>Connection: close</code> mengatur koneksi. Namun pada HTTP/2 dan HTTP/3, header koneksi hop-by-hop seperti ini tidak boleh dipakai dengan cara yang sama.</p>'
    },
    {
      type: 'text',
      html: '<h3>HTTP/2: Framing, Multiplexing, dan HPACK</h3><p>HTTP/2 tidak mengirim teks request secara utuh. Ia memecah pesan menjadi <b>frame</b> biner yang membawa tipe, stream ID, dan payload. Banyak stream dapat hidup bersamaan dalam satu koneksi TCP, sehingga request dan response dapat saling menyela tanpa membuka koneksi baru.</p><p><b>HPACK</b> mengompresi header dengan tabel statis dan dinamis. Ini sangat membantu karena request modern membawa banyak header berulang. Namun HTTP/2 masih berjalan di atas TCP: jika satu paket TCP hilang, semua stream pada koneksi itu bisa tertahan. Fenomena ini disebut <b>head-of-line blocking</b> pada level transport.</p><p>Server push pernah diusulkan untuk mengirim aset sebelum diminta, tetapi dukungannya dibatasi dan kemudian dihapus dari banyak implementasi. Jangan merancang arsitektur yang bergantung padanya.</p>'
    },
    {
      type: 'text',
      html: '<h3>HTTP/3: QUIC di Atas UDP</h3><p>HTTP/3 memakai <b>QUIC</b>, protokol transport yang berjalan di atas UDP. QUIC mengintegrasikan TLS 1.3, menyediakan stream independen, dan menangani kehilangan paket per stream. Karena itu, satu stream yang kehilangan data tidak otomatis menghentikan semua stream lain seperti pada TCP.</p><p>QUIC juga mendukung <b>connection migration</b>: koneksi dapat bertahan ketika alamat IP client berubah, misalnya saat berpindah dari Wi-Fi ke seluler. Fitur <b>0-RTT</b> dapat mempercepat koneksi ulang, tetapi memiliki risiko replay sehingga hanya cocok untuk request yang aman diulang.</p>'
    },
    {
      type: 'example',
      title: 'Memeriksa Protokol yang Dipakai',
      lang: 'bash',
      output: false,
      code: `# Lab lokal hanya HTTP/1.1 (server Node.js standar)
curl -i http://localhost:8787/version

# Paksa HTTP/1.1 ke situs yang mendukung HTTP/2
curl -I --http1.1 https://example.com

# Minta HTTP/2; curl memakai ALPN saat TLS
curl -I --http2 https://example.com

# Jika curl tidak mendukung HTTP/2, cek dengan:
curl -V

# Lihat protokol di DevTools:
# Network → klik request → Headers → Protocol
# Nilainya bisa http/1.1, h2, atau h3.`,

      explain: [
        'Endpoint <code>/version</code> melaporkan <code>http_version</code> yang dilihat server. Lab memakai server HTTP/1.1 sehingga nilainya <code>1.1</code>.',
        'Negosiasi HTTP/2 pada HTTPS biasanya memakai ALPN. Tanpa TLS, HTTP/2 dapat dipakai dengan prior knowledge, tetapi jarang di browser.',
        'DevTools menampilkan protokol per request. Jika sebagian request memakai <code>h2</code> dan sebagian <code>http/1.1</code>, periksa koneksi, proxy, atau endpoint yang berbeda.'
      ]
    },
    {
      type: 'example',
      title: 'Mengamati Perbedaan Koneksi',
      lang: 'bash',
      output: false,
      code: `# Waktu total beberapa request berurutan
for i in 1 2 3; do
  curl -o /dev/null -s -w "request $i: %{http_code} connect=%{time_connect}s total=%{time_total}s\\n" \\
    https://example.com
done

# Bandingkan dengan beberapa request paralel
seq 1 6 | xargs -P 6 -I{} curl -o /dev/null -s \\
  -w 'paralel: %{http_code} total=%{time_total}s\\n' https://example.com

# Perhatikan bahwa koneksi ulang bisa memakai TLS session
# atau connection pooling, tergantung client dan server.`,

      explain: [
        'Waktu <code>time_connect</code> menunjukkan biaya membuka koneksi. Pada HTTP/1.1, koneksi baru per request membuat biaya ini berulang.',
        'Request paralel dapat memanfaatkan beberapa koneksi, tetapi jumlah koneksi per host di browser dibatasi. HTTP/2 mengurangi kebutuhan banyak koneksi.',
        'Angka timing dipengaruhi jaringan, cache, dan server. Gunakan beberapa kali pengukuran sebelum menyimpulkan perbedaan performa.'
      ]
    },
    {
      type: 'tip',
      title: 'Kapan Versi Tertentu Penting?',
      text: 'Untuk API internal sederhana, HTTP/1.1 sering sudah cukup. Untuk halaman dengan banyak aset dan latensi tinggi, HTTP/2 atau HTTP/3 dapat membantu. Namun manfaat nyata bergantung pada jaringan, dukungan client, konfigurasi proxy, dan pola request. Ukur sebelum mengoptimalkan.'
    },
    {
      type: 'warn',
      title: 'Jangan Berasumsi Versi Baru Bebas Masalah',
      text: 'HTTP/2 dan HTTP/3 mengubah perilaku infrastruktur. Header hop-by-hop tidak berlaku sama, debugging lebih rumit, dan serangan seperti request smuggling dapat muncul dari konfigurasi proxy yang tidak konsisten. Pastikan seluruh rantai mendukung protokol yang dipilih.'
    },
    {
      type: 'vocab',
      items: [
        ['Persistent connection', 'Koneksi yang dipakai ulang untuk beberapa request berurutan.'],
        ['Pipelining', 'Pengiriman beberapa request tanpa menunggu respons, jarang dipakai pada HTTP/1.1.'],
        ['Chunked transfer coding', 'Pengiriman body dalam potongan ketika ukuran total belum diketahui.'],
        ['Binary framing', 'Pemecahan pesan HTTP/2 menjadi frame biner dengan stream ID.'],
        ['Multiplexing', 'Menjalankan banyak stream secara bersamaan dalam satu koneksi.'],
        ['HPACK', 'Kompresi header pada HTTP/2.'],
        ['QUIC', 'Transport berbasis UDP yang dipakai HTTP/3 dan mengintegrasikan TLS 1.3.'],
        ['ALPN', 'Negosiasi protokol aplikasi saat handshake TLS, misalnya h2 atau http/1.1.']
      ]
    }
  ],
  recap: [
    'HTTP/1.1 memakai koneksi persisten, tetapi request pada satu koneksi masih berurutan; pipelining jarang dipakai.',
    'HTTP/2 memakai frame biner, multiplexing, dan HPACK untuk banyak request dalam satu koneksi TCP.',
    'HTTP/3 memakai QUIC di atas UDP dengan TLS 1.3 dan stream independen untuk mengurangi head-of-line blocking transport.',
    'Versi protokol harus diperiksa dengan bukti dari curl atau DevTools, dan pemilihannya didasarkan pada pengukuran.'
  ]
});
