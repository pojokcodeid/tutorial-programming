/* ============================================================
   Pelajaran HTTP — Bab 15: Reverse Proxy, Load Balancer, dan CDN
   ============================================================ */
'use strict';

window.HTTP_LESSONS = window.HTTP_LESSONS || [];

window.HTTP_LESSONS.push({
  id: 'proxy-cdn',
  title: 'Reverse Proxy, Load Balancer, dan CDN',
  chapter: 'Versi & Infrastruktur',
  duration: '14–16 menit',
  intro: [
    'Saat aplikasi tumbuh, request jarang langsung dari browser ke proses aplikasi. Ada lapisan di antaranya: reverse proxy, load balancer, CDN, atau gateway. Lapisan ini menangani TLS, cache, routing, pembatasan laju, dan distribusi beban agar aplikasi utama tetap fokus pada logika bisnis.',
    'Memahami lapisan ini penting karena banyak gejala HTTP berasal dari sana: respons 502 atau 504, header <code>X-Forwarded-For</code> yang salah, redirect loop, timeout yang tidak konsisten, hingga cache yang menyajikan data lama. Tanpa memahami alurnya, kita mudah menyalahkan aplikasi padahal masalahnya ada di proxy.',
    'Bab ini menjalankan reverse proxy lokal di depan lab, lalu mensimulasikan upstream mati dan lambat. Kita juga membahas forwarded headers, connection pooling, timeout, retry dengan exponential backoff dan jitter, serta peran CDN dalam cache dan keamanan.'
  ],
  objectives: [
    'Membedakan forward proxy, reverse proxy, load balancer, gateway, dan CDN',
    'Menjalankan rantai client → proxy → backend dan membaca header yang ditambahkan',
    'Mendiagnosis 502, 503, dan 504 berdasarkan bukti dari proxy dan upstream',
    'Merancang timeout, retry, keep-alive, dan cache yang aman'
  ],
  sections: [
    {
      type: 'text',
      html: `<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 320" width="760" role="img" aria-label="Alur request melalui CDN, load balancer, dan beberapa instance backend">
        <rect x="20" y="120" width="120" height="70" rx="10" class="u-box"/>
        <text x="80" y="148" class="u-title" text-anchor="middle">Client</text>
        <text x="80" y="170" class="u-lbl" text-anchor="middle">browser</text>

        <rect x="176" y="112" width="140" height="86" rx="10" class="u-hl"/>
        <text x="246" y="140" class="u-title" text-anchor="middle">CDN / Edge</text>
        <text x="246" y="162" class="u-lbl" text-anchor="middle">cache + TLS</text>
        <text x="246" y="182" class="u-lbl" text-anchor="middle">origin request</text>

        <rect x="352" y="112" width="150" height="86" rx="10" class="u-box"/>
        <text x="427" y="140" class="u-title" text-anchor="middle">Load Balancer</text>
        <text x="427" y="162" class="u-lbl" text-anchor="middle">routing + health</text>
        <text x="427" y="182" class="u-lbl" text-anchor="middle">X-Forwarded-*</text>

        <rect x="538" y="30" width="190" height="58" rx="8" class="u-box"/>
        <text x="633" y="55" class="u-lbl" text-anchor="middle">Backend instance 1</text>
        <text x="633" y="74" class="u-lbl" text-anchor="middle">sehat / tidak sehat</text>

        <rect x="538" y="122" width="190" height="58" rx="8" class="u-box"/>
        <text x="633" y="147" class="u-lbl" text-anchor="middle">Backend instance 2</text>
        <text x="633" y="166" class="u-lbl" text-anchor="middle">sehat / tidak sehat</text>

        <rect x="538" y="214" width="190" height="58" rx="8" class="u-box"/>
        <text x="633" y="239" class="u-lbl" text-anchor="middle">Backend instance 3</text>
        <text x="633" y="258" class="u-lbl" text-anchor="middle">sehat / tidak sehat</text>

        <line x1="144" y1="155" x2="172" y2="155" class="u-line"/>
        <line x1="320" y1="155" x2="348" y2="155" class="u-line"/>
        <line x1="506" y1="140" x2="534" y2="72" class="u-line"/>
        <line x1="506" y1="158" x2="534" y2="151" class="u-line"/>
        <line x1="506" y1="176" x2="534" y2="240" class="u-line"/>
        <text x="380" y="300" class="u-lbl" text-anchor="middle">Proxy meneruskan request ke upstream yang sehat dan menambahkan metadata koneksi</text>
      </svg></div><figcaption class="fig-cap"><b>Gambar 15.1</b> — Lapisan proxy memisahkan client dari instance backend yang sebenarnya</figcaption></figure>`
    },
    {
      type: 'text',
      html: '<h3>Istilah yang Sering Tertukar</h3><table><thead><tr><th>Komponen</th><th>Posisi</th><th>Tugas utama</th></tr></thead><tbody><tr><td><b>Forward proxy</b></td><td>Di sisi client</td><td>Mewakili client mengakses internet, misalnya filter atau cache kantor.</td></tr><tr><td><b>Reverse proxy</b></td><td>Di depan server</td><td>Menerima request publik lalu meneruskannya ke backend.</td></tr><tr><td><b>Load balancer</b></td><td>Di depan beberapa instance</td><td>Membagi request dan menghindari instance yang gagal.</td></tr><tr><td><b>API gateway</b></td><td>Di depan banyak API</td><td>Routing, autentikasi, rate limit, dan kebijakan lintas service.</td></tr><tr><td><b>CDN</b></td><td>Jaringan edge global</td><td>Menyimpan cache dan melayani konten dekat pengguna.</td></tr></tbody></table><p>Reverse proxy dan load balancer sering digabung dalam satu produk. CDN juga bisa berperan sebagai reverse proxy di edge. Yang penting adalah memahami <b>siapa berbicara dengan siapa</b> dan header apa yang ditambahkan di setiap hop.</p>'
    },
    {
      type: 'text',
      html: '<h3>Forwarded Headers dan Kepercayaan</h3><p>Karena backend melihat alamat proxy, bukan alamat client, proxy menambahkan header seperti <code>X-Forwarded-For</code>, <code>X-Forwarded-Proto</code>, dan <code>X-Forwarded-Host</code>. Standar <code>Forwarded</code> juga ada, meskipun <code>X-Forwarded-*</code> lebih umum di praktik.</p><p>Header ini <b>bisa dipalsukan</b> jika backend dapat diakses langsung oleh client. Jangan memakai <code>X-Forwarded-For</code> untuk keputusan keamanan kecuali backend hanya menerima koneksi dari proxy tepercaya dan proxy menimpa nilai lama dengan benar. Untuk rantai proxy, baca dari entri yang paling kanan dan dokumentasikan urutannya.</p>'
    },
    {
      type: 'example',
      title: 'Menjalankan Proxy Lokal',
      lang: 'bash',
      output: false,
      code: `# Terminal 1: jalankan lab
node examples/http-lab/server.js

# Terminal 2: jalankan reverse proxy
node examples/http-lab/proxy.js

# Request normal melalui proxy
curl -i http://localhost:8788/health

# Perhatikan header tambahan:
# X-Proxy, X-Proxy-Request-Id, X-Forwarded-For, X-Forwarded-Proto

# Lihat header yang diterima backend melalui proxy
curl -s http://localhost:8788/echo | grep -i forwarded

# Simulasi upstream mati
curl -i http://localhost:8788/__down

# Simulasi upstream lambat (proxy timeout default 3 detik)
curl -i 'http://localhost:8788/slow?ms=4000'`,

      explain: [
        'Proxy meneruskan request ke <code>http://127.0.0.1:8787</code> dan menambahkan <code>X-Forwarded-For</code>, <code>X-Forwarded-Proto</code>, serta request ID.',
        '<code>/__down</code> mengembalikan <code>502 Bad Gateway</code> untuk mensimulasikan upstream yang tidak tersedia atau mengirim respons tidak valid.',
        'Request yang melewati batas waktu proxy menghasilkan <code>504 Gateway Timeout</code>. Ini berbeda dari 500: server backend mungkin masih memproses, tetapi proxy sudah menyerah menunggu.'
      ]
    },
    {
      type: 'example',
      title: 'Timeout dan Retry yang Aman',
      lang: 'bash',
      output: false,
      code: `# Timeout client dan proxy berbeda; bandingkan keduanya
time curl -s -o /dev/null -w 'status=%{http_code} total=%{time_total}s\\n' \\
  --max-time 1 'http://localhost:8787/slow?ms=3000'

curl -s -o /dev/null -w 'status=%{http_code} total=%{time_total}s\\n' \\
  'http://localhost:8787/slow?ms=3000'

# Retry hanya untuk kegagalan sementara dan operasi yang aman diulang
# Contoh konseptual dengan exponential backoff + jitter:
# delay = min(cap, base * 2^attempt) + random(0..jitter)
#
# Jangan retry POST pembayaran tanpa idempotency key.

# Cek apakah proxy masih hidup saat upstream mati
curl -i http://localhost:8788/__down`,

      explain: [
        'Client timeout yang lebih pendek dari waktu proses server akan membatalkan koneksi lebih awal. Server bisa tetap menyelesaikan pekerjaan yang tidak lagi ditunggu client.',
        'Retry harus mempertimbangkan method dan idempotensi. GET aman diulang; POST pembuatan pesanan perlu idempotency key agar tidak menghasilkan duplikat.',
        'Jitter mencegah semua client mencoba lagi pada waktu yang sama setelah gangguan, sehingga tidak menimbulkan badai request.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Keep-Alive, Connection Pooling, dan Backpressure</h3><p>Membuka koneksi TCP/TLS baru untuk setiap request mahal. <b>Connection pooling</b> memungkinkan client atau proxy memakai ulang koneksi ke upstream. <b>Keep-alive</b> menjaga koneksi tetap terbuka selama masih dipakai. Namun jumlah koneksi harus dibatasi agar backend tidak kehabisan resource.</p><p><b>Backpressure</b> adalah kemampuan sistem memperlambat penerimaan data ketika pemroses lebih lambat dari pengirim. Tanpa backpressure, antrean membengkak dan latensi melonjak. Batas antrean, timeout, serta konkurensi yang wajar lebih baik daripada menerima semua request lalu runtuh.</p>'
    },
    {
      type: 'tip',
      title: 'Urutan Diagnosis di Depan Proxy',
      text: 'Mulai dari client: apakah DNS dan TLS berhasil? Lalu periksa status dari proxy. Jika 502, cek konektivitas proxy ke upstream dan log upstream. Jika 504, bandingkan timeout proxy dengan latensi backend. Jika 503, cek health check dan kapasitas. Setelah itu baru periksa aplikasi dan dependency-nya.'
    },
    {
      type: 'warn',
      title: 'Jangan Percaya Header Forwarded Buta',
      text: 'Aplikasi yang membaca <code>X-Forwarded-For</code> dari koneksi langsung dapat dimanipulasi untuk memalsukan alamat IP, melewati rate limit, atau meracuni log. Batasi akses backend hanya dari proxy, bersihkan header lama, dan dokumentasikan rantai kepercayaan.'
    },
    {
      type: 'vocab',
      items: [
        ['Reverse proxy', 'Server di depan backend yang meneruskan request masuk.'],
        ['Load balancer', 'Komponen yang membagi request ke beberapa instance backend.'],
        ['Upstream', 'Server tujuan yang menerima request dari proxy.'],
        ['CDN', 'Jaringan edge yang menyimpan cache dan melayani konten dekat pengguna.'],
        ['X-Forwarded-For', 'Header berisi alamat client asli yang ditambahkan proxy.'],
        ['Connection pooling', 'Pemakaian ulang koneksi ke upstream untuk mengurangi biaya handshake.'],
        ['Backpressure', 'Mekanisme memperlambat aliran data saat pemroses tidak mampu mengikuti.'],
        ['Exponential backoff', 'Strategi menunggu semakin lama antarpercobaan ulang.']
      ]
    }
  ],
  recap: [
    'Reverse proxy, load balancer, gateway, dan CDN berada di jalur request dan dapat mengubah header serta perilaku koneksi.',
    '502 berarti gateway gagal mendapat respons valid dari upstream; 504 berarti gateway kehabisan waktu menunggu upstream.',
    'Header forwarded hanya boleh dipercaya dari proxy tepercaya dan harus dibersihkan atau ditimpa dengan benar.',
    'Timeout, retry dengan backoff dan jitter, connection pooling, serta backpressure harus dirancang bersama, bukan terpisah.'
  ]
});
