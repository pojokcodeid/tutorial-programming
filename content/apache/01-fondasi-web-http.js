/* ============================================================
   Pelajaran Apache — 01: Fondasi Web & HTTP
   ============================================================ */
'use strict';

window.APACHE_LESSONS = window.APACHE_LESSONS || [];

window.APACHE_LESSONS.push({
  id: 'fondasi-web-http',
  title: 'Fondasi Web & HTTP: Request, Response, dan Status',
  chapter: 'Fondasi',
  duration: '10 menit',
  intro: [
    'Setiap buka website, terjadi percakapan singkat yang berulang: komputer kamu mengirim <b>permintaan</b>, server membalas dengan <b>berkas atau data</b>, lalu keduanya menutup percakapan. Percakapan itu bahasanya <b>HTTP</b> — aturan main yang membuat browser di Jakarta dan server di Amerika tetap paham satu sama lain.',
    'Apache HTTP Server hanyalah mesin yang memenuhi permintaan itu. Karena itu sebelum menyentuh satu baris konfigurasi pun, kamu harus bisa <i>membaca</i> isi request dan response dengan mata telanjang. Pelajaran ini membedah bentuk request/response, header, method, status code, MIME type, serta melatihmu memakai <code>curl</code> sebagai alat pengintip.'
  ],
  objectives: [
    'Menjelaskan alur client → DNS → TCP → HTTP → response dengan urutan yang benar',
    'Membaca baris request dan response HTTP beserta header pentingnya',
    'Membedakan method GET, POST, PUT, PATCH, DELETE, dan HEAD',
    'Mengartikan status code 2xx–5xx dan menebak penyebabnya',
    'Memakai <code>curl -I</code>, <code>curl -v</code>, dan <code>-H</code> untuk menyelidiki sebuah layanan'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Perjalanan satu klik link</h3><p>Saat kamu menulis <code>http://localhost:8080/docs/</code>, lima hal terjadi berurutan. Melewati satu tahap pun, halaman tidak akan tampil.</p><table><thead><tr><th>Tahap</th><th>Yang terjadi</th><th>Kegagalan umum</th></tr></thead><tbody><tr><td>1. DNS</td><td>Nama host diterjemahkan ke IP</td><td>Host tidak dikenal</td></tr><tr><td>2. TCP</td><td>Koneksi dibuka ke IP:port (mis. 80, 443, 8080)</td><td>Connection refused — service tidak jalan</td></tr><tr><td>3. HTTP request</td><td>Baris method + path, lalu header, lalu body</td><td>400 Bad Request</td></tr><tr><td>4. Proses server</td><td>Server memilih konfigurasi, lalu file/backend</td><td>404, 403, 500</td></tr><tr><td>5. HTTP response</td><td>Status code + header + isi</td><td>Timeout / 502</td></tr></tbody></table><p>Dua istilah yang sering tertukar: <b>URL</b> adalah alamat lengkap (<code>http://localhost:8080/docs/index.html?lang=id</code>), sedangkan <b>URI</b> adalah bagian setelah host — <code>/docs/index.html?lang=id</code> — yaitu yang benar-benar dibaca server untuk memilih berkas.</p>'
    },
    {
      type: 'example',
      title: 'Bentuk mentah request dan response',
      lang: 'http',
      output: false,
      code: `GET /docs/ HTTP/1.1
Host: localhost:8080
User-Agent: curl/8.7.1
Accept: */*

HTTP/1.1 200 OK
Date: Fri, 20 Nov 2026 08:00:00 GMT
Content-Type: text/html; charset=UTF-8
Content-Length: 2390
Vary: Accept-Encoding

<!doctype html>
<html lang="id"> ...`,
      explain: [
        'Baris pertama request memuat <b>method</b> (GET), <b>path</b> (/docs/), dan <b>versi HTTP</b> (1.1). Baris-baris berikutnya adalah header dipisah titik dua.',
        '<code>Host</code> bukan formalitas: inilah kunci Apache memilih virtual host. Tanpa header ini satu port tidak bisa melayani banyak website.',
        'Baris pertama response memuat <b>status code</b> dan alasan manusiawinya, lalu header response, lalu <b>kosong satu baris</b>, lalu body.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Method: maksud client</h3><p>Method memberi tahu server apa yang diminta client terhadap suatu resource:</p><table><thead><tr><th>Method</th><th>Maksud</th><th>Idempoten?</th><th>Biasa dipakai untuk</th></tr></thead><tbody><tr><td><code>GET</code></td><td>Ambil data</td><td>Ya</td><td>Halaman, gambar, API baca</td></tr><tr><td><code>HEAD</code></td><td>Sama seperti GET tanpa body</td><td>Ya</td><td>Cek header/ukuran saja</td></tr><tr><td><code>POST</code></td><td>Kirim data untuk diproses</td><td>Tidak</td><td>Login, upload, submit form</td></tr><tr><td><code>PUT</code></td><td>Timpa resource dengan versi baru</td><td>Ya</td><td>Update lengkap</td></tr><tr><td><code>PATCH</code></td><td>Ubah sebagian</td><td>Tidak</td><td>Update parsial</td></tr><tr><td><code>DELETE</code></td><td>Hapus resource</td><td>Ya</td><td>Hapus data</td></tr></tbody></table><p><b>Idempoten</b> berarti efeknya sama walau diulang — penting ketika jaringan putus dan client mengirim ulang. Apache sendiri tidak menghafal method; ia meneruskannya atau memetakannya ke berkas.</p>'
    },
    {
      type: 'text',
      html: '<h3>Status code: hasil yang dilaporkan</h3><table><thead><tr><th>Kelas</th><th>Arti</th><th>Contoh</th></tr></thead><tbody><tr><td><b>2xx</b> berhasil</td><td>Request diterima &amp; diproses</td><td><code>200</code> OK, <code>201</code> Created, <code>204</code> No Content</td></tr><tr><td><b>3xx</b> pengalihan</td><td>Client diminta mengambil resource lain</td><td><code>301</code> pindah permanen, <code>302</code> sementara, <code>304</code> tidak berubah (cache)</td></tr><tr><td><b>4xx</b> kesalahan client</td><td>Request-nya yang bermasalah</td><td><code>400</code> Bad Request, <code>401</code> belum login, <code>403</code> ditolak, <code>404</code> tidak ada, <code>413</code> body terlalu besar</td></tr><tr><td><b>5xx</b> kesalahan server</td><td>Server/ backend yang gagal</td><td><code>500</code> error internal, <code>502</code> gateway buruk, <code>503</code> tidak tersedia, <code>504</code> timeout</td></tr></tbody></table><p>Yang paling sering membuat bingung di lab reverse proxy: <b>404 vs 403 vs 502</b>. 404 = resource tidak ada; 403 = ada tapi tidak boleh; 502/503 = Apache berhasil menerima request tapi <i>gagal</i> menuntaskannya di sisi belakang.</p>'
    },
    {
      type: 'example',
      title: 'Menyelidiki layanan dengan curl',
      lang: 'bash',
      output: true,
      code: `# 1. Lihat status + header saja (tanpa body)
curl -sI http://localhost:8080/

# 2. Lihat percakapan mentah (handshake, request, response)
curl -sv http://localhost:8080/ -o /dev/null

# 3. Paksa header Host tertentu (menguji virtual host)
curl -s -H "Host: api.local" http://localhost:8080/

# 4. Pantau berapa lama dan status apa yang diterima
curl -s -o /dev/null -w 'status=%{http_code} waktu=%{time_total}s\\n' \\
  http://localhost:8080/api/`,
      explain: [
        '<code>-I</code> mengirim <code>HEAD</code> — cukup untuk melihat <code>Content-Type</code>, <code>Content-Length</code>, dan header cache.',
        '<code>-v</code> menampilkan sisi klien dan server; pada kasus TLS juga menampilkan rangkaian handshake-nya.',
        'Header <code>Host</code> yang bisa kamu atur manual adalah alat utama menguji virtual host nanti (Pelajaran 05) tanpa perlu mengedit /etc/hosts.',
        '<code>-w</code> mencetak format sesudah request — pas untuk mengukur respons time sebelum dan sesudah optimasi.'
      ]
    },
    {
      type: 'warn',
      title: 'HTTPS bukan HTTP terbalik',
      text: '<p>HTTPS = HTTP yang dikirim di dalam terowongan TLS. Setelah port dibuka (443), terjadi <b>negosiasi TLS</b> (pilih versi &amp; cipher, verifikasi sertifikat) baru HTTP bicara di dalamnya. Artinya: konfigurasi yang salah pada sertifikat menghasilkan <i>error di tingkat TLS</i> — browser menolak sebelum satu request HTTP pun terkirim. Bedakan gejala ini dengan error 5xx yang justru datang dari HTTP. Pelajaran 11 membahas TLS secara penuh.</p>'
    },
    {
      type: 'text',
      html: '<h3>Content-Type dan MIME type</h3><p>Karena di atas protokol yang sama tersimpan HTML, gambar, JSON, dan font, setiap response wajib menyebut jenis isinya lewat <b>MIME type</b>:</p><table><thead><tr><th>MIME type</th><th>Isi</th><th>Akibat bila salah</th></tr></thead><tbody><tr><td><code>text/html</code></td><td>Halaman web</td><td>Teks tampil mentah</td></tr><tr><td><code>text/css</code></td><td> stylesheet</td><td>Halaman tidak bergaya</td></tr><tr><td><code>application/javascript</code></td><td>Skrip</td><td>Browser memblokir MIME sniffing</td></tr><tr><td><code>application/json</code></td><td>Data API</td><td>Klien tidak bisa mem-parsing</td></tr><tr><td><code>image/svg+xml</code></td><td>Vektor gambar</td><td>Gambar tidak tampil</td></tr></tbody></table><p>Apache menentukan ini dari ekstensi file lewat <code>mime.types</code> dan <code>AddType</code>. Salah satu penyebab "CSS tidak termuat padahal 200" adalah Content-Type yang keliru — karena browser menolak stylesheet yang tidak dikenali.</p>'
    },
    {
      type: 'tip',
      title: 'Latih membaca header sebelum menyentuh konfigurasi',
      text: '<p>Selama bab ini, biasakan mengawali setiap eksperimen dengan <code>curl -sI</code>. Perubahan konfigurasi Apache pada dasarnya selalu terlihat di header: <code>Cache-Control</code> muncul setelah <code>mod_expires</code> aktif, <code>Content-Encoding: gzip</code> muncul setelah <code>mod_deflate</code>, <code>Location</code> muncul setelah redirect, dan <code>Strict-Transport-Security</code> muncul setelah HSTS disetel. Header adalah bukti tercepat bahwa konfigurasimu bekerja.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['HTTP', 'Protokol teks request–response tanpa state di atas TCP.'],
        ['HTTPS', 'HTTP di dalam terowongan TLS; terjadi handshake sebelum HTTP mulai.'],
        ['Method', 'Kode maksud request: GET, POST, PUT, PATCH, DELETE, HEAD.'],
        ['Header', 'Pasangan nama–nilai tambahan pada request/response.'],
        ['Status code', 'Tiga digit hasil request: 2xx berhasil, 3xx pindah, 4xx client salah, 5xx server salah.'],
        ['MIME type', 'Penanda jenis isi (Content-Type) agar client tahu cara memprosesnya.'],
        ['URL vs URI', 'URL alamat lengkap; URI bagian path+query yang dibaca server.'],
        ['Idempoten', 'Efeknya sama walau request diulang (GET, PUT, DELETE).']
      ]
    },
    {
      type: 'text',
      html: '<h3>Latihan</h3><ol><li>Dengan lab berjalan (<code>cd examples/apache-lab &amp;&amp; podman compose up -d</code>), jalankan <code>curl -sI http://localhost:8080/</code> lalu catat status, <code>Content-Type</code>, dan seluruh header keamanan yang muncul.</li><li>Bandingkan <code>curl -sI</code> dengan <code>curl -s -o /dev/null -w \'%{http_code}\\n\'</code> — jelaskan kenapa hasilnya berkaitan tapi isinya beda.</li><li>Kirim request palsu <code>curl -s -X GET http://localhost:8080/ -H "X-Test: 1"</code> lalu buka <code>http://localhost:8080/server-status</code> dan temukan requestmu di sana.</li><li>Tuliskan dengan bahasamu sendiri beda <b>404</b>, <b>403</b>, <b>502</b>, dan <b>503</b> — beserta satu contoh penyebab masing-masing pada lab ini.</li></ol>'
    }
  ],
  recap: [
    'Satu klik = DNS → TCP → request HTTP → pemrosesan server → response HTTP; tiap tahap punya gejala gagalnya sendiri.',
    'Request berisi <b>method + path + header</b>; response berisi <b>status code + header + body</b>; header <code>Host</code> adalah kunci pemilihan virtual host.',
    'Status code 2xx berhasil, 3xx pengalihan, 4xx kesalahan client, 5xx kesalahan server — 404 tidak ada, 403 ditolak, 502/503/504 masalah di belakang Apache.',
    '<code>curl -I</code>, <code>curl -v</code>, <code>-H</code>, dan <code>-w</code> adalah alat utama membuktikan setiap perubahan konfigurasi.'
  ]
});
