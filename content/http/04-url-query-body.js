/* ============================================================
   Pelajaran HTTP — Bab 4: URL, Query String, Body, dan Fragment
   ============================================================ */
'use strict';

window.HTTP_LESSONS = window.HTTP_LESSONS || [];

window.HTTP_LESSONS.push({
  id: 'url-query-body',
  title: 'URL, Query String, Body, dan Fragment',
  chapter: 'Fondasi',
  duration: '11–13 menit',
  intro: [
    'URL adalah alamat yang menyatukan banyak informasi: protokol yang dipakai, nama server, port, path resource, parameter pencarian, dan terkadang penanda bagian halaman. Kesalahan kecil di salah satu bagian bisa membuat request menuju tempat yang salah atau data tidak terbaca.',
    'Dua hal yang sering tertukar adalah <b>query string</b> dan <b>request body</b>. Query string menempel pada URL dan cocok untuk parameter yang mengubah cara resource dibaca. Body membawa representasi data yang lebih besar atau lebih terstruktur, misalnya JSON saat membuat produk.',
    'Bab ini membedah URL bagian demi bagian, menjelaskan percent-encoding, lalu menunjukkan kapan memakai query dan kapan memakai body. Kita juga akan memastikan satu hal yang sering ditanyakan: mengapa fragment <code>#...</code> tidak pernah sampai ke server.'
  ],
  objectives: [
    'Menguraikan URL menjadi scheme, host, port, path, query, dan fragment',
    'Memahami percent-encoding dan karakter yang perlu di-encode',
    'Memilih antara query string dan request body sesuai semantik',
    'Menjelaskan mengapa fragment tidak dikirim sebagai bagian request target'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Anatomi URL</h3><p>Perhatikan contoh berikut:</p><pre><code>https://shop.example.com:8443/products/42?tab=detail&amp;lang=id#ulasan</code></pre><table><thead><tr><th>Bagian</th><th>Nilai</th><th>Arti</th></tr></thead><tbody><tr><td><b>Scheme</b></td><td><code>https</code></td><td>Protokol yang dipakai.</td></tr><tr><td><b>Host</b></td><td><code>shop.example.com</code></td><td>Nama server yang dituju.</td></tr><tr><td><b>Port</b></td><td><code>8443</code></td><td>Port koneksi; bila kosong, memakai default scheme.</td></tr><tr><td><b>Path</b></td><td><code>/products/42</code></td><td>Resource yang diminta.</td></tr><tr><td><b>Query</b></td><td><code>tab=detail&amp;lang=id</code></td><td>Parameter tambahan untuk membaca resource.</td></tr><tr><td><b>Fragment</b></td><td><code>ulasan</code></td><td>Penanda bagian halaman; tidak dikirim ke server.</td></tr></tbody></table><p>Istilah <b>URI</b> lebih luas daripada URL. URL adalah jenis URI yang menunjukkan lokasi resource. Dalam percakapan sehari-hari, orang sering memakai keduanya bergantian, tetapi dalam spesifikasi keduanya punya makna teknis yang berbeda.</p>'
    },
    {
      type: 'text',
      html: '<h3>Percent-Encoding</h3><p>URL tidak boleh berisi sembarang karakter. Spasi, tanda kutip, karakter non-ASCII, dan beberapa simbol harus diubah menjadi bentuk <b>percent-encoding</b>, misalnya spasi menjadi <code>%20</code> dan huruf é menjadi <code>%C3%A9</code>. Ini mencegah karakter tersebut disalahartikan sebagai pemisah bagian URL.</p><p>Contoh query yang aman:</p><pre><code>/search?q=kopi%20arabika&amp;sort=harga</code></pre><p>Gunakan fitur encode dari bahasa pemrograman atau <code>curl --data-urlencode</code> daripada menyusun string secara manual. Menggabungkan input pengguna langsung ke URL juga membuka risiko injeksi parameter dan open redirect.</p>'
    },
    {
      type: 'text',
      html: '<h3>Query String versus Body</h3><table><thead><tr><th>Aspek</th><th>Query string</th><th>Request body</th></tr></thead><tbody><tr><td>Posisi</td><td>Bagian dari URL setelah <code>?</code></td><td>Setelah header dan baris kosong</td></tr><tr><td>Cocok untuk</td><td>Filter, pencarian, pagination, sort</td><td>Data yang dibuat/diubah, file, JSON kompleks</td></tr><tr><td>Terlihat di log</td><td>Ya, URL sering tercatat</td><td>Biasanya tidak, tetapi tetap bisa dicatat</td></tr><tr><td>Batas ukuran</td><td>Terbatas oleh URL dan server</td><td>Bisa lebih besar, tetapi tetap perlu batas</td></tr><tr><td>Contoh</td><td><code>GET /products?page=2</code></td><td><code>POST /products</code> dengan JSON</td></tr></tbody></table><p>Aturan praktisnya: gunakan query untuk <b>cara membaca</b> resource, dan body untuk <b>representasi data</b> yang dikirim. Jangan menaruh password, token, atau data sensitif di query karena URL mudah tersimpan di riwayat browser, log proxy, dan referrer.</p>'
    },
    {
      type: 'example',
      title: 'Mengirim Query String',
      lang: 'bash',
      output: false,
      code: `# Query sederhana
curl -i 'http://localhost:8787/echo?topik=http&page=2'

# Query dengan spasi dan karakter khusus
curl -i -G 'http://localhost:8787/echo' \\
  --data-urlencode 'cari=kopi arabika' \\
  --data-urlencode 'kota=Bandung'

# Lihat bagaimana server membaca query
curl -s 'http://localhost:8787/echo?nama=Nina&peran=admin' | jq .`,
      explain: [
        'Tanda <code>&amp;</code> memisahkan pasangan nama-nilai pada query string. Karakter tersebut harus di-escape dengan benar saat ditulis di shell.',
        'Opsi <code>-G</code> membuat curl menambahkan data ke URL sebagai query, sementara <code>--data-urlencode</code> melakukan encoding otomatis.',
        'Endpoint <code>/echo</code> mengembalikan objek <code>query</code>, sehingga kamu bisa memastikan server membaca nilai yang sama dengan yang kamu maksud.'
      ]
    },
    {
      type: 'example',
      title: 'Mengirim Body JSON',
      lang: 'bash',
      output: false,
      code: `curl -i -X POST http://localhost:8787/echo \\
  -H 'Content-Type: application/json' \\
  -d '{"nama":"Nina","topik":"HTTP","level":"pemula"}'

# Bandingkan: data yang sama di query akan terlihat di URL dan log
curl -i 'http://localhost:8787/echo?nama=Nina&topik=HTTP&level=pemula'`,
      explain: [
        'Body tidak muncul di URL. Ia dikirim setelah header dan baris kosong, dengan format yang dijelaskan oleh <code>Content-Type</code>.',
        'Query mudah dibagikan dan di-cache, tetapi tidak cocok untuk data besar atau sensitif. Body lebih tepat untuk representasi objek yang utuh.',
        'Untuk request <code>POST</code>, body adalah bagian utama. Untuk <code>GET</code>, body umumnya tidak didefinisikan dengan baik dan sebaiknya dihindari.'
      ]
    },
    {
      type: 'tip',
      title: 'Praktik Langsung',
      text: 'Buka <code>http://localhost:8787/echo?topik=http#bagian</code> lalu perhatikan respons server. Fragment <code>bagian</code> tidak muncul di objek <code>query</code> maupun <code>path</code>. Sekarang ganti menjadi <code>?topik=http&amp;level=lanjut</code> dan lihat bagaimana query bertambah.'
    },
    {
      type: 'warn',
      title: 'Jangan Menaruh Rahasia di URL',
      text: 'URL sering tersimpan di riwayat browser, log server, log proxy, referrer, dan tangkapan layar. Token, password, atau data pribadi di query string bisa bocor tanpa disadari. Gunakan header <code>Authorization</code> atau body yang dilindungi HTTPS untuk data sensitif.'
    },
    {
      type: 'vocab',
      items: [
        ['URL', 'Alamat lengkap resource yang mencakup scheme, host, port, path, query, dan fragment.'],
        ['URI', 'Pengenal resource yang cakupannya lebih luas daripada URL.'],
        ['Query string', 'Bagian URL setelah tanda tanya berisi pasangan nama-nilai.'],
        ['Request body', 'Data yang dikirim setelah header request, misalnya JSON atau file.'],
        ['Percent-encoding', 'Pengubahan karakter khusus menjadi bentuk %XX agar aman di URL.'],
        ['Fragment', 'Penanda bagian dokumen setelah # yang diproses browser, bukan server.'],
        ['Path', 'Bagian URL yang menunjuk resource, misalnya /products/42.']
      ]
    }
  ],
  recap: [
    'URL terdiri dari scheme, host, port, path, query, dan fragment; masing-masing punya peran berbeda.',
    'Query string cocok untuk parameter baca seperti filter dan pagination, sedangkan body cocok untuk data yang dibuat atau diubah.',
    'Fragment tidak dikirim ke server karena hanya dipakai browser untuk menavigasi bagian halaman.',
    'Selalu encode input dan jangan menaruh token atau data sensitif di URL.'
  ]
});
