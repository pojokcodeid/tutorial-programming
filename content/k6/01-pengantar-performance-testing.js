/* ============================================================
   Pelajaran Grafana k6 — Bab 1: Pengantar Performance Testing & Metrik
   ============================================================ */
'use strict';

window.K6_LESSONS = window.K6_LESSONS || [];

window.K6_LESSONS.push({
  id: 'pengantar-performance-testing',
  title: 'Pengantar Performance Testing & Metrik',
  chapter: 'Pengenalan',
  duration: '8–10 menit',
  intro: [
    'Bayangkan antrean tiket konser: lima loket seharusnya cukup, tetapi antrean tetap memanjang — bisa jadi satu kasir melayani pembelian puluhan tiket sekaligus, atau jaringan loket sempat putus. <b>Performance testing</b> bertujuan menemukan penyebab seperti itu sebelum gerbang dibuka untuk pengunjung sungguhan.',
    'Di dunia web, pengunjung berubah menjadi <b>virtual users</b>, loket menjadi server dan database, dan antrean menjadi latency yang naik saat trafik melonjak. Pertanyaannya tidak berubah: berapa lama respons ketika 10 orang datang bersamaan, bagaimana ketika 1.000, dan di titik mana sistem mulai menolak? Itu semua harus diukur, bukan ditebak.',
    'Bab ini menyiapkan bahasa bersama seluruh materi k6: perjalanan satu request HTTP, enam jenis tes, metrik inti beserta percentiles, perbedaan virtual user dengan iteration, sampai cara menerjemahkan <b>SLO</b> menjadi ambang batas (threshold) yang bisa diuji otomatis.'
  ],
  objectives: [
    'Menjelaskan perjalanan satu request HTTP dan bagian mana yang diukur k6 sebagai latency',
    'Membedakan enam jenis performance testing beserta tujuan dan contoh beban/durasinya',
    'Membaca metrik inti dan percentiles p50/p90/p95/p99 tanpa terkecoh rata-rata',
    'Menerjemahkan SLO menjadi threshold k6 dan menetapkan baseline perbandingan'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Perjalanan Satu Request HTTP</h3><p>Setiap kali pengguna menekan tombol beli terjadi perjalanan panjang. k6 berdiri di sisi klien, jadi yang ia ukur adalah <b>seluruh perjalanan</b> dari permintaan dikirim sampai respons lengkap — angka inilah <code>http_req_duration</code>:</p><ul><li><b>DNS lookup</b> — menerjemahkan nama domain ke alamat IP; bila lambat, masalah di resolver.</li><li><b>TCP handshake</b> — membuka koneksi (dilewati bila koneksi dipakai ulang).</li><li><b>TLS handshake</b> — sertifikat dan kunci HTTPS; sering menyumbang puluhan milidetik pertama.</li><li><b>Proses server</b> — validasi token dan logika bisnis.</li><li><b>Query database</b> — ambil atau simpan data; sering jadi biang keladi (indeks hilang, kueri N+1).</li><li><b>Mengirim respons</b> — body kembali lewat jaringan.</li></ul><p>Waktu sampai <b>byte pertama</b> tiba dicatat terpisah pada <code>http_req_waiting</code> — disebut <b>TTFB</b> (<i>time to first byte</i>); rincian tiap tahapan (<code>connecting</code>, <code>tlsHandshaking</code>, <code>sending</code>, <code>receiving</code>) ada di properti <code>timings</code>. Trik baca cepat: TTFB besar menunjuk ke jaringan atau antrean server; TTFB kecil tetapi total besar menunjuk ke pemrosesan atau database.</p><h3>Prasyarat Singkat: Bahasa HTTP</h3><ul><li><b>Method</b> — <code>GET</code> membaca, <code>POST</code> membuat, <code>PUT</code> mengganti seluruh data, <code>PATCH</code> mengubah sebagian, <code>DELETE</code> menghapus.</li><li><b>Status code</b> — <code>2xx</code> berhasil (mis. <code>200</code> OK, <code>201</code> Created), <code>3xx</code> dialihkan (<code>301</code>, <code>304</code>), <code>4xx</code> kesalahan klien (<code>400</code>, <code>401</code>, <code>404</code>), <code>5xx</code> kesalahan server (<code>500</code>, <code>503</code>).</li></ul><p><b>Header</b> membawa metadata (<code>Content-Type</code>, <code>Authorization</code>); <b>body</b> membawa data, dan format paling umum adalah <b>JSON</b> — di situlah <code>res.json()</code> membaca dan <code>JSON.stringify()</code> mengirim. Ini prasyarat: hampir seluruh contoh berikutnya memakainya.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Enam Jenis Performance Testing',
      lang: 'text',
      output: false,
      code: `JENIS TES      TUJUAN                                  CONTOH BEBAN / DURASI
-------------  --------------------------------------  --------------------------
smoke          memastikan skrip & target sehat          1-5 VU, 1-2 menit
load           memetakan perilaku pada beban wajar      50 VU, 15-30 menit
stress         mencari titik patah: beban naik terus    10 -> 100 -> 300 VU, 30 menit
spike          lonjakan tiba-tiba lalu kembali normal   5 VU -> 250 VU -> 5 VU, 10 menit
soak           mendeteksi kebocoran & degradasi         30 VU, 1-6 jam
breakpoint     beban naik tanpa henti sampai GAGAL      ramp terus, berhenti saat runtuh`,
      explain: [
        'Urutan belajar yang wajar: <b>smoke → load → stress → spike → soak</b>. Smoke selalu duluan karena ia memvalidasi skripnya sendiri — skrip yang salah akan menghasilkan angka salah pada tes apa pun.',
        '<b>Load</b> paling sering dipakai sehari-hari: beban ditetapkan pada angka realistis, lalu latency dan error diamati di situ. <b>Stress</b> menaikkan beban bertahap sampai patah, sedangkan <b>spike</b> meniru lonjakan sesaat yang harus segera pulih.',
        '<b>Soak</b> dan <b>breakpoint</b> paling mahal waktunya; jalankan sesekali di staging, bukan setiap commit.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Metrik Inti yang Wajib Dibaca</h3><ul><li><b>Latency</b> — waktu respons; bedakan <i>TTFB</i> (sampai byte pertama) dengan <i>total duration</i> (sampai respons selesai).</li><li><b>Throughput / request rate</b> — request selesai per detik pada <code>http_reqs</code> (satuan <code>/s</code>).</li><li><b>Iteration rate</b> — berapa kali <code>default function</code> berjalan per detik (<code>iterations</code>), bukan berapa request.</li><li><b>Error rate</b> — proporsi request gagal (<code>http_req_failed</code>) dan iterasi gagal (<code>iterations_failed</code>).</li><li><b>Data received / sent</b> — (<code>data_received</code>, <code>data_sent</code>) byte per detik; mendeteksi respons yang membengkak.</li></ul><h3>Percentile: Angka yang Jujur tentang Latency</h3><p>Dari 1.000 request: <b>p50 = 120 ms</b> (setengah pengguna lebih cepat), <b>p90 = 340 ms</b>, <b>p95 = 480 ms</b> (hanya 5% lebih lambat), <b>p99 = 1.900 ms</b> (1% terburuk). Percentile menjawab "seberapa buruk pengalaman paling jelek yang masih umum".</p><p><b>Rata-rata bisa menyesatkan.</b> Bayangkan 999 request masing-masing 100 ms dan satu request 9 detik karena kueri macet: rata-ratanya cuma sekitar <b>109 ms</b> — terdengar sehat, padahal ada pengguna menunggu 9 detik. Angka p99 langsung memperlihatkan itu, sebab itulah target tes memakai persentil, bukan rata-rata.</p><h3>SLO, SLA, dan Baseline</h3><ul><li><b>SLO</b> (<i>service level objective</i>) — komitmen internal: <b>"p95 &lt; 500 ms, error rate &lt; 1%"</b>.</li><li><b>SLA</b> (<i>service level agreement</i>) — perjanjian resmi dengan pihak lain, biasanya dengan konsekuensi bila dilanggar.</li><li><b>Baseline</b> — hasil ukur pada kondisi normal sebagai patokan pembanding.</li></ul><p>Kuncinya: tulis SLO sebagai <b>threshold k6</b>, bukan sekadar dokumen, dan buat sedikit lebih ketat (misalnya <code>p(95)&lt;450</code> untuk SLO 500 ms) agar ada peringatan dini. Contohnya menyusul di bagian akhir bab.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Membaca Ringkasan Metrik Hipotetis',
      lang: 'text',
      output: false,
      code: `=== RINGKASAN (hipotetis) ===

  http_req_duration...: avg=187.40ms min=92.10ms med=151.60ms max=1.92s p(90)=302.80ms p(95)=486.10ms p(99)=1.44s
  http_reqs...........: 1450   48.30/s
  iterations..........:  290    9.66/s
  iterations_failed...:    0    0.00%
  http_req_failed.....:    0    0.00%
  checks..............: ✓ 580 ✗ 0
  data_received.......: 2.1 MB 70.1 kB/s
  data_sent...........:  84 kB  2.8 kB/s
  vus.................:   10   min=10 max=10

Dibaca terhadap SLO "p95 < 500 ms, error rate < 1%":
  p95 486 ms   -> LOLOS, tetapi tipis (sisa 14 ms sebelum melanggar)
  error 0.00%  -> LOLOS, jauh di bawah 1%
  avg 187 ms   -> terlihat sehat, TETAPI p99 = 1.44 s
  48.30 req/s  -> throughput; bandingkan dengan baseline sebelum perubahan`,
      explain: [
        '<b>p99 = 1.44 s</b> adalah temuan terpenting: ekor distribusinya panjang dan rata-rata 187 ms menutupinya; <code>med</code> melihat kasus biasa, <code>max</code> nyaris selalu ekstrem sehingga jangan jadi ukuran utama.',
        'Bandingkan ke <b>baseline</b>: throughput 48/s bukan "baik" atau "buruk" — baik bila sebelumnya 48/s, buruk bila sebelumnya 120/s dengan VU yang sama.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Virtual User, Iteration, dan Request</h3><ul><li><b>Virtual user (VU)</b> — "manusia tiruan" yang menjalankan skripmu secara mandiri dan berulang.</li><li><b>Iteration</b> — satu putaran eksekusi <code>default function</code> oleh satu VU.</li><li><b>Request</b> — satu panggilan HTTP di dalam iterasi; satu iterasi bisa berisi nol sampai belasan request.</li></ul><p>Contoh konkret: satu VU menjalankan 10 iterasi, tiap iterasi 3 request (login, lihat daftar, tambah ke keranjang) — dihasilkan <b>10 iterasi</b> dan <b>30 request</b>. Jadi <code>iterations</code> tidak sama dengan <code>http_reqs</code> kecuali tiap iterasi persis satu request. Menambah <code>duration</code> menambah iterasi; menambah <code>vus</code> menambah paralelisme.</p><figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 240" width="760" role="img" aria-label="Alur satu virtual user: kirim request, lakukan check, lalu sleep, kemudian mengulang"><rect x="20" y="30" width="180" height="80" rx="10" class="u-box"/><text x="110" y="62" class="u-title" text-anchor="middle">Init context</text><text x="110" y="90" class="u-lbl" text-anchor="middle">sekali, saat skrip dimuat</text><line x1="200" y1="70" x2="278" y2="70" class="u-line" marker-end="url(#u-arrow)"/><rect x="280" y="20" width="460" height="150" rx="10" class="u-box"/><text x="510" y="46" class="u-title" text-anchor="middle">Virtual User #1 — default function berulang</text><rect x="300" y="66" width="130" height="44" rx="6" class="u-hd"/><text x="365" y="94" class="u-lbl" text-anchor="middle">http.request</text><rect x="455" y="66" width="100" height="44" rx="6" class="u-box"/><text x="505" y="94" class="u-lbl" text-anchor="middle">check()</text><rect x="580" y="66" width="130" height="44" rx="6" class="u-box"/><text x="645" y="94" class="u-lbl" text-anchor="middle">sleep(1)</text><line x1="430" y1="88" x2="451" y2="88" class="u-line" marker-end="url(#u-arrow)"/><line x1="555" y1="88" x2="576" y2="88" class="u-line" marker-end="url(#u-arrow)"/><path d="M 645 110 L 645 140 L 365 140 L 365 114" class="u-dash" marker-end="url(#u-arrow)"/><text x="380" y="205" class="u-title" text-anchor="middle">1 VU × 10 iterasi × 3 request = 10 iterasi &amp; 30 request</text></svg></div><figcaption class="fig-cap"><b>Gambar 1.1</b> — Satu VU menjalankan default function berulang: request, check, sleep, mengulang</figcaption></figure>'
    },
    {
      type: 'example',
      title: 'Contoh: Menerjemahkan SLO menjadi Threshold k6',
      lang: 'javascript',
      output: false,
      code: `import http from 'k6/http';
import { check, sleep } from 'k6';

// SLO: p95 < 500 ms, error rate < 1% -> dibuat sedikit lebih ketat
export const options = {
  vus: 20,
  duration: '5m',
  thresholds: {
    http_req_duration: ['p(95)<450'], // SLO 500 ms, diberi jarak peringatan dini
    http_req_failed: ['rate<0.01'], // SLO error rate < 1%
    checks: ['rate>0.99'], // minimal 99% check harus lolos
  },
};

export default function () {
  const res = http.get('https://test.k6.io/');
  check(res, { 'status adalah 200': (r) => r.status === 200 });
  sleep(1);
}`,
      explain: [
        'Setiap baris <code>thresholds</code> berasal dari satu kalimat SLO — kunci objek adalah nama metrik, nilainya ekspresi seperti <code>p(95)&lt;450</code>.',
        'Batas yang <b>lebih ketat sedikit</b> dari SLO memberi ruang peringatan dini: tes mulai gagal di CI sebelum komitmen ke pelanggan dilanggar.',
        'Metrik <code>http_req_failed</code> mewakili error rate, sedangkan <code>checks</code> menambah kriteria isi respons. Threshold yang dilanggar membuat k6 keluar dengan kode 99 — pemicu gagal di pipeline CI.'
      ]
    },
    {
      type: 'tip',
      title: 'Tips Menyusun Baseline',
      text: 'Sebelum mengubah kode produksi, jalankan dulu tes yang sama persis dan simpan hasilnya sebagai <b>baseline</b> lewat <code>--out json=baseline.json</code>. Sesudah perubahan, jalankan ulang skrip yang sama lalu bandingkan <b>p95</b> dan <b>throughput</b>. Angka tanpa pembanding hanyalah angka — baseline langsung menjawab "lebih baik atau lebih buruk?".'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Performance testing berarti <b>menyengaja membuat sistem menerima beban besar</b>. Hanya uji sistem yang kamu milikinya atau yang sudah ada izin tertulisnya — staging jauh lebih aman daripada produksi. Siapkan <b>rencana berhenti</b> sebelum menekan tombol: siapa yang menghentikan tes (Ctrl+C pada k6), bagaimana memantau server selama tes, dan ke mana melapor bila ada tanda kegagalan.'
    },
    {
      type: 'vocab',
      items: [
        ['Latency', 'Waktu dari permintaan dikirim sampai respons selesai; terbagi jadi TTFB (byte pertama) dan total duration.'],
        ['Throughput (request rate)', 'Jumlah request selesai per satuan waktu, tampil pada metrik http_reqs dengan satuan /s.'],
        ['Error rate', 'Proporsi request atau iterasi yang gagal; diwakili http_req_failed dan iterations_failed.'],
        ['Percentile', 'Nilai di bawah mana sekian persen data berada; p95 berarti 95% request lebih cepat dari angka itu.'],
        ['Virtual user (VU)', 'Satu pengguna tiruan yang menjalankan skrip berulang selama tes berlangsung.'],
        ['Iteration', 'Satu putaran lengkap eksekusi default function oleh satu VU.'],
        ['SLO', 'Service level objective: komitmen internal kualitas layanan, misalnya p95 di bawah 500 ms.'],
        ['Baseline', 'Hasil ukur pada kondisi normal yang dijadikan patokan pembanding setelah ada perubahan.']
      ]
    }
  ],
  recap: [
    'k6 mengukur seluruh perjalanan satu request HTTP; TTFB (http_req_waiting) dan total duration (http_req_duration) menunjuk ke masalah yang berbeda.',
    'Enam jenis tes punya tujuan berbeda: smoke memvalidasi skrip, load memetakan beban wajar, stress mencari titik patah, spike menguji lonjakan, soak mendeteksi kebocoran, breakpoint batas absolut.',
    'Baca percentiles, bukan rata-rata — 999 request 100 ms ditambah satu request 9 detik memberi rata-rata 109 ms yang menyesatkan.',
    'VU pelakunya, iteration putarannya, request aksinya: 1 VU × 10 iterasi × 3 request menghasilkan 10 iterasi dan 30 request.',
    'SLO seperti p95 < 500 ms ditulis sebagai threshold k6 yang sedikit lebih ketat, disertai baseline sebagai pembanding perubahan.'
  ]
});
