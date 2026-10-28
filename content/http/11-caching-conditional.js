/* ============================================================
   Pelajaran HTTP — Bab 11: Caching dan Conditional Request
   ============================================================ */
'use strict';

window.HTTP_LESSONS = window.HTTP_LESSONS || [];

window.HTTP_LESSONS.push({
  id: 'caching-conditional',
  title: 'Caching dan Conditional Request',
  chapter: 'Cache & Performa',
  duration: '14–16 menit',
  intro: [
    'Cache adalah alasan sebuah halaman bisa terbuka hampir seketika, tetapi cache yang salah konfigurasi juga bisa menampilkan data lama atau membocorkan informasi pribadi. HTTP menyediakan aturan eksplisit agar browser, proxy, dan CDN tahu kapan boleh menyimpan respons dan kapan harus bertanya kembali ke server.',
    'Dua mekanisme utamanya adalah <b>freshness</b> dan <b>validation</b>. Freshness menentukan berapa lama respons boleh dipakai tanpa menghubungi server. Validation memungkinkan client mengirim kondisi seperti <code>If-None-Match</code>; jika representasi belum berubah, server membalas <code>304 Not Modified</code> tanpa body.',
    'Bab ini membedah <code>Cache-Control</code>, <code>ETag</code>, <code>Last-Modified</code>, <code>Vary</code>, dan conditional request. Kita akan mempraktikkannya pada endpoint <code>/cache</code> dan <code>/private</code> di lab, lalu menyusun kebijakan cache yang masuk akal untuk aset statis dan data API.'
  ],
  objectives: [
    'Menjelaskan perbedaan browser cache, shared cache, CDN, dan reverse proxy cache',
    'Memilih direktif Cache-Control sesuai jenis data dan tingkat sensitivitasnya',
    'Mempraktikkan validasi ETag sampai menghasilkan 304 Not Modified',
    'Menghindari cache poisoning dan kebocoran data melalui Vary serta no-store'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Siapa yang Menyimpan Cache?</h3><table><thead><tr><th>Jenis cache</th><th>Lokasi</th><th>Catatan</th></tr></thead><tbody><tr><td><b>Browser cache</b></td><td>Komputer pengguna</td><td>Menyimpan respons per pengguna; cocok untuk aset dan data privat.</td></tr><tr><td><b>Reverse proxy cache</b></td><td>Di depan server aplikasi</td><td>Melayani banyak client; harus hati-hati dengan cookie dan data pribadi.</td></tr><tr><td><b>CDN cache</b></td><td>Jaringan edge global</td><td>Mempercepat aset dan respons publik; butuh invalidasi yang benar.</td></tr><tr><td><b>Shared cache</b></td><td>Proxy, gateway, atau CDN</td><td>Tidak boleh menyimpan respons yang ditandai <code>private</code> atau <code>no-store</code>.</td></tr></tbody></table><p>Respons yang boleh disimpan cache bersama harus benar-benar sama untuk semua pengguna. Jika respons bergantung pada cookie, bahasa, atau header lain, cache harus diberi tahu melalui <code>Vary</code> atau respons harus ditandai privat.</p>'
    },
    {
      type: 'text',
      html: '<h3>Direktif Cache-Control</h3><table><thead><tr><th>Direktif</th><th>Arti</th></tr></thead><tbody><tr><td><code>max-age=60</code></td><td>Respons dianggap segar selama 60 detik.</td></tr><tr><td><code>s-maxage=300</code></td><td>Masa segar khusus untuk shared cache, menimpa max-age di sana.</td></tr><tr><td><code>public</code></td><td>Boleh disimpan cache bersama, termasuk yang belum terautentikasi.</td></tr><tr><td><code>private</code></td><td>Hanya boleh disimpan cache privat seperti browser pengguna.</td></tr><tr><td><code>no-cache</code></td><td>Boleh disimpan, tetapi wajib divalidasi ulang sebelum dipakai.</td></tr><tr><td><code>no-store</code></td><td>Tidak boleh disimpan di cache mana pun.</td></tr><tr><td><code>must-revalidate</code></td><td>Setelah tidak segar, cache wajib memvalidasi, tidak boleh memakai salinan basi.</td></tr><tr><td><code>immutable</code></td><td>Selama masih segar, respons tidak perlu divalidasi; cocok untuk aset ber-hash.</td></tr></tbody></table><p><b><code>no-cache</code> tidak sama dengan <code>no-store</code>.</b> <code>no-cache</code> masih mengizinkan penyimpanan asalkan divalidasi. <code>no-store</code> melarang penyimpanan sama sekali dan dipakai untuk data sensitif seperti halaman profil atau token.</p>'
    },
    {
      type: 'text',
      html: '<h3>ETag, Last-Modified, dan 304</h3><p><b>ETag</b> adalah penanda versi representasi. Client menyimpan ETag dari respons pertama, lalu mengirim <code>If-None-Match</code> pada request berikutnya. Jika ETag masih cocok, server membalas <code>304 Not Modified</code> tanpa body. Selain menghemat bandwidth, ini memberi sinyal bahwa cache masih valid.</p><p><b>Last-Modified</b> memakai waktu perubahan terakhir dan divalidasi dengan <code>If-Modified-Since</code>. ETag lebih presisi karena tidak bergantung pada resolusi waktu dan bisa mewakili perubahan konten yang halus. Untuk operasi tulis, <code>If-Match</code> dapat dipakai sebagai kontrol konkurensi agar update tidak menimpa perubahan orang lain.</p>'
    },
    {
      type: 'example',
      title: 'Melihat Header Cache dan Menghasilkan 304',
      lang: 'bash',
      output: false,
      code: `# Respons pertama: simpan ETag
curl -i http://localhost:8787/cache

# Ambil ETag ke variabel shell
ETAG=$(curl -sI http://localhost:8787/cache \\
  | tr -d '\\r' | awk -F': ' 'tolower($1)=="etag"{print $2}')

echo "ETag: $ETAG"

# Kirim conditional request
curl -i http://localhost:8787/cache \\
  -H "If-None-Match: $ETAG"

# Bandingkan ukuran body: 200 punya body, 304 tidak
curl -s -o /dev/null -w 'status=%{http_code} bytes=%{size_download}\\n' \\
  http://localhost:8787/cache

curl -s -o /dev/null -w 'status=%{http_code} bytes=%{size_download}\\n' \\
  http://localhost:8787/cache -H "If-None-Match: $ETAG"`,

      explain: [
        'Respons <code>/cache</code> memuat <code>ETag</code>, <code>Cache-Control: public, max-age=60</code>, dan <code>Last-Modified</code>. Ketiganya memberi tahu cache tentang kesegaran dan cara validasi.',
        'Jika <code>If-None-Match</code> cocok, server membalas <code>304</code> dengan header cache tetapi tanpa body. Client memakai salinan yang sudah dimilikinya.',
        'Mengukur <code>size_download</code> memperlihatkan penghematan bandwidth: respons 304 jauh lebih kecil karena tidak mengirim payload.'
      ]
    },
    {
      type: 'example',
      title: 'Data Privat dan Variasi Respons',
      lang: 'bash',
      output: false,
      code: `# Data sensitif: tidak boleh disimpan cache
curl -i http://localhost:8787/private

# Content negotiation: respons bergantung pada Accept
curl -i http://localhost:8787/negotiate \\
  -H 'Accept: application/json'

curl -i http://localhost:8787/negotiate \\
  -H 'Accept: text/html'

# Perhatikan Vary: Accept pada kedua respons.
# Tanpa Vary, cache bisa menyajikan HTML kepada client yang meminta JSON.

# Cek header keamanan dan cache pada respons produk
curl -i 'http://localhost:8787/products?page=1&limit=2'`,

      explain: [
        'Endpoint <code>/private</code> membalas <code>Cache-Control: no-store</code> agar data pribadi tidak tersimpan di browser, proxy, atau CDN.',
        'Header <code>Vary: Accept</code> memberi tahu cache bahwa kunci penyimpanan harus mempertimbangkan header Accept, bukan hanya URL.',
        'Daftar produk memakai <code>no-store</code> pada lab karena datanya berubah selama latihan. Pada aplikasi nyata, kebijakannya bisa berbeda asalkan konsisten dan aman.'
      ]
    },
    {
      type: 'tip',
      title: 'Pola Cache yang Sering Dipakai',
      text: 'Aset statis ber-hash seperti <code>app.3f9c2.js</code> cocok memakai <code>Cache-Control: public, max-age=31536000, immutable</code>. HTML biasanya <code>no-cache</code> agar selalu divalidasi. Data API publik bisa memakai <code>max-age</code> pendek ditambah ETag. Data pribadi atau token wajib <code>private, no-store</code>.'
    },
    {
      type: 'warn',
      title: 'Cache Bisa Menyebabkan Kebocoran dan Data Basi',
      text: 'Jangan menandai respons berisi data pengguna sebagai <code>public</code>. Pastikan <code>Vary</code> mencakup header yang memengaruhi isi, dan invalidasi cache saat data berubah. Untuk respons yang sangat sensitif, <code>no-store</code> lebih aman daripada mengandalkan penghapusan cache belakangan.'
    },
    {
      type: 'vocab',
      items: [
        ['Cache', 'Salinan respons yang disimpan untuk mempercepat request berikutnya.'],
        ['Cache-Control', 'Header yang mengatur kesegaran, penyimpanan, dan validasi respons.'],
        ['Freshness', 'Periode ketika respons boleh dipakai tanpa menghubungi server.'],
        ['ETag', 'Penanda versi representasi untuk validasi cache.'],
        ['If-None-Match', 'Header conditional yang mengirim ETag yang dimiliki client.'],
        ['304 Not Modified', 'Respons tanpa body yang berarti cache client masih valid.'],
        ['Vary', 'Header yang menyebut request header lain sebagai bagian kunci cache.'],
        ['no-store', 'Direktif yang melarang penyimpanan respons di cache mana pun.']
      ]
    }
  ],
  recap: [
    'Cache menyimpan respons agar lebih cepat, tetapi harus dibatasi berdasarkan sensitivitas dan variasi respons.',
    'Cache-Control mengatur freshness dan penyimpanan; no-cache butuh validasi, sedangkan no-store melarang penyimpanan.',
    'ETag dan If-None-Match menghasilkan 304 sehingga client dapat memakai salinan lokal tanpa mengunduh ulang body.',
    'Gunakan Vary untuk respons yang bergantung pada header, dan no-store untuk data pribadi atau token.'
  ]
});
