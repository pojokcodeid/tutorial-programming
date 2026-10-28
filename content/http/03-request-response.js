/* ============================================================
   Pelajaran HTTP — Bab 3: Membaca Request dan Response
   ============================================================ */
'use strict';

window.HTTP_LESSONS = window.HTTP_LESSONS || [];

window.HTTP_LESSONS.push({
  id: 'request-response',
  title: 'Membaca Request dan Response Mentah',
  chapter: 'Fondasi',
  duration: '12–14 menit',
  intro: [
    'Di balik tampilan browser yang rapi, HTTP sebenarnya adalah teks yang disusun dengan aturan ketat. Pada HTTP/1.1, request dan response bisa dibaca seperti surat: ada baris pembuka, daftar header, satu baris kosong, lalu body bila ada.',
    'Kemampuan membaca pesan mentah sangat berguna saat debugging. Ketika API mengembalikan error yang membingungkan, sering kali jawabannya ada di status line, header <code>Content-Type</code>, atau body yang tidak sesuai dengan yang kamu kira.',
    'Bab ini membedah request line, status line, header, dan body. Kita juga akan melihat bagaimana HTTP/2 dan HTTP/3 mengubah cara pesan dikirim di jaringan, meskipun konsep method, header, dan status tetap sama.'
  ],
  objectives: [
    'Membaca struktur request HTTP/1.1 dari baris pertama sampai body',
    'Membaca struktur response HTTP/1.1 dan membedakan status line dengan header',
    'Menggunakan curl -v, -i, dan --trace-ascii untuk memeriksa pesan',
    'Memahami mengapa representasi mentah HTTP/2 dan HTTP/3 tidak lagi berupa teks biasa'
  ],
  sections: [
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 360" width="760" role="img" aria-label="Anatomi request dan response HTTP/1.1">
        <rect x="24" y="24" width="330" height="300" rx="10" class="u-box"/>
        <text x="189" y="50" class="u-title" text-anchor="middle">Request HTTP/1.1</text>
        <line x1="40" y1="62" x2="338" y2="62" class="u-line"/>
        <text x="42" y="88" class="u-lbl">GET /products?page=2 HTTP/1.1</text>
        <text x="42" y="110" class="u-lbl">Host: localhost:8787</text>
        <text x="42" y="132" class="u-lbl">Accept: application/json</text>
        <text x="42" y="154" class="u-lbl">User-Agent: LearningClient/1.0</text>
        <text x="42" y="176" class="u-lbl">(baris kosong)</text>
        <text x="42" y="204" class="u-lbl">body opsional, misalnya JSON</text>

        <rect x="406" y="24" width="330" height="300" rx="10" class="u-box"/>
        <text x="571" y="50" class="u-title" text-anchor="middle">Response HTTP/1.1</text>
        <line x1="422" y1="62" x2="720" y2="62" class="u-line"/>
        <text x="424" y="88" class="u-lbl">HTTP/1.1 200 OK</text>
        <text x="424" y="110" class="u-lbl">Content-Type: application/json</text>
        <text x="424" y="132" class="u-lbl">Cache-Control: max-age=60</text>
        <text x="424" y="154" class="u-lbl">ETag: "abc123"</text>
        <text x="424" y="176" class="u-lbl">(baris kosong)</text>
        <text x="424" y="204" class="u-lbl">{"items":[],"page":2}</text>

        <text x="380" y="346" class="u-lbl" text-anchor="middle">Baris pembuka → header → baris kosong → body</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 3.1</b> — Request dan response HTTP/1.1 memiliki struktur berlapis yang bisa dibaca langsung</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Request Line</h3><p>Baris pertama request HTTP/1.1 berisi tiga bagian: <b>method</b>, <b>request target</b>, dan <b>versi protokol</b>. Contoh <code>GET /products?page=2 HTTP/1.1</code> berarti client meminta representasi resource <code>/products?page=2</code> dengan method GET menggunakan HTTP/1.1.</p><p>Perhatikan bahwa fragment (<code>#bagian</code>) tidak ikut dikirim ke server. Fragment dipakai browser untuk berpindah posisi di halaman, bukan bagian dari permintaan resource ke server. Query string (<code>?page=2</code>) tetap dikirim karena merupakan bagian dari target.</p>'
    },
    {
      type: 'text',
      html: '<h3>Header dan Body</h3><p>Header adalah pasangan nama-nilai yang memberi konteks. Nama header tidak membedakan huruf besar-kecil, tetapi penulisan yang konsisten memudahkan pembacaan. Setelah header, ada <b>satu baris kosong</b> yang menandai berakhirnya metadata dan dimulainya body.</p><ul><li><code>Host</code> wajib pada HTTP/1.1 untuk memberi tahu server nama host yang dituju.</li><li><code>Content-Type</code> menjelaskan format body.</li><li><code>Content-Length</code> menyebut ukuran body dalam byte.</li><li><code>Authorization</code> membawa kredensial atau token.</li><li><code>Accept</code> menyatakan format respons yang diinginkan client.</li></ul><p>Response memiliki <b>status line</b> seperti <code>HTTP/1.1 200 OK</code>, lalu header, baris kosong, dan body. Status code memberi ringkasan hasil; header menjelaskan detail; body membawa representasi data.</p>'
    },
    {
      type: 'example',
      title: 'Melihat Pesan Mentah dengan curl',
      lang: 'bash',
      output: false,
      code: `# -i menampilkan status line dan response header
curl -i http://localhost:8787/health

# -v menampilkan detail koneksi, request header, dan response header
curl -v http://localhost:8787/echo?topik=response

# --trace-ascii menunjukkan alur byte secara lebih rinci
curl --trace-ascii - http://localhost:8787/health

# Mengirim request dengan header tambahan
curl -i http://localhost:8787/headers \\
  -H 'Accept: application/json' \\
  -H 'X-Demo: belajar-http'`,
      explain: [
        'Baris yang diawali <code>&gt;</code> pada output verbose adalah data yang dikirim client; baris <code>&lt;</code> adalah data yang diterima dari server.',
        '<code>--trace-ascii</code> berguna ketika kamu ingin melihat kapan request benar-benar dikirim dan bagaimana response diterima, termasuk pada koneksi yang gagal di tengah jalan.',
        'Coba kirim header <code>X-Demo</code> lalu buka <code>/headers</code>; nilai itu akan muncul di respons karena server mengembalikan seluruh header yang diterimanya.'
      ]
    },
    {
      type: 'example',
      title: 'Membaca Response JSON',
      lang: 'bash',
      output: false,
      code: `curl -i 'http://localhost:8787/products?page=1&limit=2'

# HTTP/1.1 200 OK
# Content-Type: application/json; charset=utf-8
# Cache-Control: no-store
# X-Request-Id: 0f0c...
#
# {
#   "items": [
#     { "id": 1, "name": "Kopi Arabika", "price": 85000, ... }
#   ],
#   "page": 1,
#   "limit": 2,
#   "total": 3
# }

# Ambil hanya body tanpa header, lalu format dengan jq bila tersedia
curl -s 'http://localhost:8787/products?page=1&limit=2' | jq .`,
      explain: [
        'Status <code>200</code> menunjukkan request berhasil, tetapi keberhasilan bisnis tetap harus diperiksa dari isi body. API bisa membalas 200 dengan field <code>error</code> bila desainnya buruk.',
        '<code>Content-Type</code> memberi tahu client cara membaca body. Tanpa header ini, client hanya bisa menebak apakah body berupa JSON, HTML, atau teks.',
        'Header <code>X-Request-Id</code> dapat disalin ke log atau tiket insiden agar request yang sama mudah dicari di server.'
      ]
    },
    {
      type: 'tip',
      title: 'HTTP/2 dan HTTP/3 Tidak Berupa Teks',
      text: 'Pada HTTP/1.1, pesan dikirim sebagai teks yang mudah dibaca. HTTP/2 memakai <i>binary framing</i> dan kompresi header HPACK; HTTP/3 memakai QUIC di atas UDP. Method, status, dan header secara konseptual tetap ada, tetapi tampilan mentahnya bukan lagi teks biasa. Gunakan DevTools atau alat khusus untuk memeriksanya.'
    },
    {
      type: 'warn',
      title: 'Jangan Mengandalkan Tebakan',
      text: 'Jika response tidak sesuai harapan, periksa status line dan header sebelum menyimpulkan. Body kosong pada <code>204</code> atau <code>304</code> adalah hal normal, bukan bug. Redirect juga tidak selalu berarti error; lihat header <code>Location</code> dan status yang dipakai.'
    },
    {
      type: 'vocab',
      items: [
        ['Request line', 'Baris pertama request HTTP/1.1 berisi method, target, dan versi protokol.'],
        ['Status line', 'Baris pertama response HTTP/1.1 berisi versi protokol, status code, dan reason phrase.'],
        ['Header', 'Metadata berbentuk nama-nilai yang menjelaskan request, response, atau body.'],
        ['Body', 'Data opsional yang dibawa request atau response, misalnya JSON atau file.'],
        ['Request target', 'Bagian URL yang dituju, umumnya path dan query string.'],
        ['Reason phrase', 'Teks penjelas setelah status code, misalnya OK; bukan sumber kebenaran utama.'],
        ['Binary framing', 'Cara HTTP/2 memecah pesan menjadi frame biner, bukan teks mentah.']
      ]
    }
  ],
  recap: [
    'Request HTTP/1.1 terdiri dari request line, header, baris kosong, lalu body opsional.',
    'Response HTTP/1.1 terdiri dari status line, header, baris kosong, lalu body opsional.',
    'curl -i menampilkan header response; curl -v dan --trace-ascii memperlihatkan alur komunikasi lebih rinci.',
    'HTTP/2 dan HTTP/3 mengubah framing di jaringan, tetapi konsep method, status, dan header tetap berlaku.'
  ]
});
