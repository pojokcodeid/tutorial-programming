/* ============================================================
   Pelajaran HTTP — Bab 17: Debugging dengan curl dan DevTools
   ============================================================ */
'use strict';

window.HTTP_LESSONS = window.HTTP_LESSONS || [];

window.HTTP_LESSONS.push({
  id: 'debugging-curl',
  title: 'Debugging HTTP dengan curl dan DevTools',
  chapter: 'Debugging & Observability',
  duration: '14–16 menit',
  intro: [
    'Bug HTTP paling cepat ditemukan dengan bukti, bukan tebakan. Status code, header, body, dan timing memberi petunjuk berbeda. Dengan alat yang tepat, kamu bisa mereproduksi request yang gagal, membandingkannya dengan request yang berhasil, lalu mempersempit masalah ke lapisan yang benar.',
    '<code>curl</code> adalah alat utama karena menampilkan request secara transparan dan mudah diulang. Browser DevTools melengkapi dengan konteks nyata: cookie, redirect, CORS, dan timing yang dialami halaman. Keduanya sebaiknya dipakai bersama, bukan saling menggantikan.',
    'Bab ini membahas opsi curl yang paling berguna, cara membaca waktu request, redaksi data sensitif, serta urutan diagnosis dari DNS hingga aplikasi. Kita juga akan mempraktikkan studi kasus 401, 403, 404, 500, dan kegagalan CORS yang sering disalahartikan.'
  ],
  objectives: [
    'Menggunakan curl -v, -i, --trace-ascii, dan -w untuk diagnosis',
    'Membaca timing DNS, connect, TLS, TTFB, dan total request',
    'Mereproduksi request browser dengan Copy as cURL dan membandingkannya',
    'Menyusun urutan diagnosis serta log yang aman dan dapat dilacak'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Opsi curl yang Wajib Dikuasai</h3><table><thead><tr><th>Opsi</th><th>Kegunaan</th></tr></thead><tbody><tr><td><code>-i</code></td><td>Menampilkan status line dan response header bersama body.</td></tr><tr><td><code>-I</code></td><td>Mengirim HEAD dan hanya menampilkan header.</td></tr><tr><td><code>-v</code></td><td>Menampilkan detail koneksi, request header, dan response header.</td></tr><tr><td><code>--trace-ascii -</code></td><td>Menampilkan alur data secara rinci, berguna saat koneksi terputus.</td></tr><tr><td><code>-w</code></td><td>Menulis metrik seperti status, waktu, dan ukuran setelah request.</td></tr><tr><td><code>-L</code></td><td>Mengikuti redirect; tanpa ini, curl berhenti di respons 3xx.</td></tr><tr><td><code>--max-time</code></td><td>Membatasi total waktu request.</td></tr><tr><td><code>--resolve</code></td><td>Memetakan host ke IP tertentu tanpa mengubah DNS.</td></tr><tr><td><code>-k</code></td><td>Mematikan verifikasi TLS; hanya untuk latihan.</td></tr><tr><td><code>-b</code> / <code>-c</code></td><td>Mengirim / menyimpan cookie dari berkas.</td></tr></tbody></table><p>Hindari memakai <code>-X</code> hanya karena “ingin jelas”. Untuk <code>POST</code> dengan data, <code>-d</code> sudah menentukan method. Memaksa method dengan <code>-X GET -d ...</code> dapat menghasilkan request yang tidak lazim dan membingungkan server.</p>'
    },
    {
      type: 'text',
      html: '<h3>Membaca Timing</h3><table><thead><tr><th>Metrik curl</th><th>Arti</th></tr></thead><tbody><tr><td><code>time_namelookup</code></td><td>Waktu menyelesaikan DNS.</td></tr><tr><td><code>time_connect</code></td><td>Waktu membuka koneksi TCP.</td></tr><tr><td><code>time_appconnect</code></td><td>Waktu handshake TLS selesai (HTTPS).</td></tr><tr><td><code>time_starttransfer</code></td><td>Waktu sampai byte pertama response diterima (TTFB).</td></tr><tr><td><code>time_total</code></td><td>Total waktu request.</td></tr></tbody></table><p>Jika <code>time_namelookup</code> tinggi, masalahnya DNS. Jika <code>time_connect</code> tinggi, curigai jaringan atau port. Jika <code>time_appconnect</code> tinggi, TLS atau sertifikat. Jika TTFB tinggi tetapi transfer cepat, server lambat memproses. Jika transfer lama, ukuran body atau bandwidth menjadi penyebab.</p>'
    },
    {
      type: 'example',
      title: 'Debug Request yang Gagal',
      lang: 'bash',
      output: false,
      code: `# Lihat request dan response lengkap
curl -v http://localhost:8787/profile

# Status dan header saja
curl -i http://localhost:8787/status/401

# Ikuti redirect dan tampilkan tujuan akhir
curl -i -L 'http://localhost:8787/redirect?to=/products'

# Tanpa -L: curl berhenti di 302
curl -i 'http://localhost:8787/redirect?to=/products'

# Ukur waktu tiap tahap
curl -o /dev/null -s -w \\
  'dns=%{time_namelookup}s connect=%{time_connect}s tls=%{time_appconnect}s ttfb=%{time_starttransfer}s total=%{time_total}s status=%{http_code}\\n' \\
  http://localhost:8787/health

# Simulasikan timeout client
curl -s -o /dev/null -w 'status=%{http_code}\\n' --max-time 1 \\
  'http://localhost:8787/slow?ms=3000'`,

      explain: [
        '<code>-v</code> menunjukkan baris <code>&gt;</code> untuk data yang dikirim dan <code>&lt;</code> untuk data yang diterima, sehingga perbedaan header langsung terlihat.',
        'Tanpa <code>-L</code>, curl tidak otomatis mengikuti redirect. Ini sering menjadi sumber kebingungan saat membandingkan hasil dengan browser.',
        'Metrik timing membantu memisahkan masalah DNS, koneksi, TLS, server, dan transfer. Satu angka total tidak cukup untuk menentukan penyebab.'
      ]
    },
    {
      type: 'example',
      title: 'Reproduksi dari Browser dan Perbandingan',
      lang: 'text',
      output: false,
      code: `1. Buka DevTools → Network → centang Preserve log.
2. Lakukan aksi yang gagal di aplikasi.
3. Klik request yang gagal.
4. Periksa:
   - Request URL dan method
   - Status code
   - Request Headers (Cookie, Authorization, Content-Type)
   - Response Headers (CORS, cache, Location)
   - Payload / Response
   - Timing dan Protocol
5. Klik kanan → Copy → Copy as cURL.
6. Tempel di terminal, jalankan, lalu bandingkan dengan
   request yang berhasil.
7. Hapus data sensitif dari perintah sebelum dibagikan.

Jika curl berhasil tetapi browser gagal, curigai CORS,
cookie, redirect, atau perbedaan header yang dikirim browser.`,

      explain: [
        'Copy as cURL membawa header dan body yang benar-benar dipakai browser, sehingga menghilangkan tebakan saat mereproduksi bug.',
        'Perbedaan hasil antara curl dan browser adalah petunjuk penting: CORS, SameSite, dan aturan browser tidak berlaku pada curl.',
        'Selalu redaksi cookie, token, dan data pribadi sebelum menempelkan perintah ke tiket, chat, atau dokumentasi publik.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Urutan Diagnosis yang Efisien</h3><ol><li><b>URL dan DNS</b> — apakah host benar, path tidak salah ketik, dan nama domain resolve?</li><li><b>Konektivitas</b> — apakah port terbuka dan firewall mengizinkan?</li><li><b>TLS</b> — apakah sertifikat valid, hostname cocok, dan waktu sistem benar?</li><li><b>Redirect</b> — ke mana URL akhir mengarah, dan apakah method berubah?</li><li><b>Request</b> — method, header, body, encoding, dan Content-Type.</li><li><b>Status dan body</b> — apakah 4xx dari client, 5xx dari server, atau 3xx dari redirect?</li><li><b>Identitas dan izin</b> — cookie, token, role, dan CORS.</li><li><b>Proxy dan dependency</b> — 502/504, timeout, log backend, database, dan layanan lain.</li><li><b>Keamanan retry</b> — apakah aman mengulang, dan apakah operasi idempotent?</li></ol>'
    },
    {
      type: 'tip',
      title: 'Log yang Berguna Tanpa Membocorkan Data',
      text: 'Catat method, path, status, durasi, ukuran, request ID, dan hasil (sukses/gagal). Redaksi header <code>Authorization</code> dan <code>Cookie</code>, serta field sensitif di body. Gunakan correlation ID yang dikembalikan ke client agar pengguna bisa menyebutkannya saat melaporkan masalah.'
    },
    {
      type: 'warn',
      title: 'Jangan Menebak dari Satu Gejala',
      text: 'Pesan “Failed to fetch” di browser bukan berarti server mati; bisa jadi CORS, sertifikat, atau koneksi terputus. Status 500 belum tentu bug aplikasi; bisa jadi dependency gagal. Kumpulkan bukti dari beberapa lapisan sebelum menyimpulkan.'
    },
    {
      type: 'vocab',
      items: [
        ['TTFB', 'Time to First Byte, waktu sampai byte pertama response diterima.'],
        ['Trace', 'Rekaman alur komunikasi pada level byte atau koneksi.'],
        ['Copy as cURL', 'Fitur DevTools untuk menyalin request browser sebagai perintah curl.'],
        ['Correlation ID', 'Nilai yang menghubungkan satu request dengan log dan trace terkait.'],
        ['traceparent', 'Header standar W3C untuk konteks distributed tracing.'],
        ['Redaksi', 'Penghapusan atau penyamaran data sensitif sebelum log dibagikan.'],
        ['Redirect chain', 'Rangkaian respons 3xx sampai URL akhir tercapai.'],
        ['Time to first byte', 'Metrik yang memisahkan latensi server dari waktu transfer body.']
      ]
    }
  ],
  recap: [
    'curl -v, -i, --trace-ascii, dan -w memberi bukti tentang request, response, koneksi, dan timing.',
    'DevTools Copy as cURL membantu mereproduksi request browser; perbedaan hasil menunjukkan pengaruh aturan browser seperti CORS.',
    'Diagnosis harus berurutan dari URL/DNS, konektivitas, TLS, redirect, request, status, izin, lalu proxy dan dependency.',
    'Log yang baik mencatat metadata dan correlation ID, tetapi meredaksi token, cookie, dan data pribadi.'
  ]
});
