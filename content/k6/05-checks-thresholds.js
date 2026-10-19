/* ============================================================
   Pelajaran Grafana k6 — Bab 5: Checks & Thresholds — Kriteria Lulus/Gagal
   ============================================================ */
'use strict';

window.K6_LESSONS = window.K6_LESSONS || [];

window.K6_LESSONS.push({
  id: 'checks-thresholds',
  title: 'Checks & Thresholds: Kriteria Lulus/Gagal',
  chapter: 'Kualitas & Metrik',
  duration: '8–10 menit',
  intro: [
    'Bayangkan kamu sedang mengoreksi ujian. Untuk tiap lembar jawaban, kamu menandai benar atau salah per soal — itulah <b>check</b> di k6. Setelah semua lembar terkoreksi, ada aturan kelulusan kelas: "minimal 99% jawaban benar dan tidak boleh ada soal tertentu yang salah" — itulah <b>threshold</b>. Check menandai per kejadian; threshold menilai keseluruhan.',
    'Tanpa keduanya, tes beban hanya menghasilkan angka-angka yang "kelihatan berjalan". Server bisa saja membalas 200 tetapi isi datanya kosong, atau 5% pembayaran gagal diam-diam selama kamu tidur. Checks dan thresholds mengubah tes menjadi <b>pengungkapan kebenaran</b>: tes yang gagal memenuhi kriteria otomatis dianggap gagal — dan menggagalkan pipeline CI kamu.',
    'Bab ini membedah tiga hal: cara menulis <code>check()</code> yang deskriptif, cara menyusun <code>thresholds</code> untuk metrik bawaan, sampai trik agar smoke test berhenti cepat ketika masalah fatal sudah terdeteksi.'
  ],
  objectives: [
    'Menulis check() untuk status code, isi body JSON, dan header respons sekaligus',
    'Menyusun threshold untuk metrik bawaan seperti http_req_failed, http_req_duration, dan checks',
    'Membaca ekspresi threshold: avg, med, min, max, p(N), dan rate',
    'Memakai abortOnFail, threshold bertag, serta threshold per skenario pada tes di pipeline CI'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Check: Menandai Benar atau Salah Per Request</h3><p><b>check()</b> adalah fungsi dari modul <code>k6</code> yang menerima sebuah respons lalu membandingkannya terhadap satu atau beberapa kriteria. Bentuk umumnya:</p><pre><code>check(res, {\n  \'nama deskriptif\': (r) =&gt; kondisi,\n  \'nama lain\': (r) =&gt; kondisi lain\n});</code></pre><p>Setiap entri menghasilkan <b>boolean</b>, dan <code>check()</code> sebagai keseluruhan juga mengembalikan boolean (true bila <i>semua</i> kriteria lolos). Tiga sifat penting yang membedakannya dari sekadar <code>if</code>:</p><ul><li><b>Tidak menghentikan iterasi</b> — check yang gagal tetap dicatat lalu iterasi lanjut, sehingga satu request jelek tidak memutus pengumpulan data.</li><li><b>Dinamai</b> — setiap kriteria punya nama yang tampil di ringkasan akhir dan di dashboard, misalnya <code>✓ status adalah 200</code> atau <code>✗ pesanan berhasil dibuat</code>.</li><li><b>Dijumlahkan</b> — semua hasil check masuk ke metrik bawaan <code>checks</code> berupa <i>rate</i> (rasio lolos terhadap total), sehingga bisa dinilai lewat threshold.</li></ul>'
    },
    {
      type: 'example',
      title: 'Contoh: Memeriksa Status, Header, dan Isi Body JSON',
      lang: 'javascript',
      output: false,
      code: `import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '30s',
};

export default function () {
  const res = http.get('https://api.example.com/products/1');

  // Banyak check sekaligus — masing-masing dinilai terpisah
  const ok = check(res, {
    'status adalah 200': (r) => r.status === 200,
    'content-type berupa JSON': (r) =>
      r.headers['Content-Type'].includes('application/json'),
    'data.id tersedia': (r) => r.json('data.id') !== null,
    'data.harga positif': (r) => r.json('data.harga') > 0,
  });

  if (!ok) {
    // check tidak menghentikan iterasi, jadi kita putuskan sendiri
    console.warn('Respons tidak sesuai, status=' + res.status);
  }

  sleep(1);
}`,
      explain: [
        'Kunci objek pada <code>check()</code> adalah <b>nama yang akan tampil di ringkasan</b>. Tulis nama seperti kalimat berita: "status adalah 200" — bukan sekadar "ok" atau "tes 1".',
        '<code>r.json(\'data.id\')</code> membaca nilai lewat jalur JSON tanpa melempar error bila jalur itu tidak ada (k6 mengembalikan <code>null</code>), sehingga aman dipakai di dalam check. Sebaliknya, <code>r.json()</code> tanpa argumen pada body non-JSON akan melempar error dan menggagalkan iterasi.',
        'Pengecekan header <code>Content-Type</code> mendeteksi kasus menjebak: server membalas 200 tetapi berisi halaman error HTML — statusnya "sukses", isinya bohong.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Threshold: Nilai Kelulusan Seluruh Tes</h3><p><b>thresholds</b> adalah kumpulan aturan nilai yang kamu tetapkan pada metrik tertentu di blok <code>options</code>. Bila ada satu threshold yang dilanggar, <b>seluruh tes dianggap gagal</b> — berapa pun hasil check lainnya. Inilah "nilai kelulusan" yang menentukan merah atau hijau di pipeline kamu.</p><p>Bentuk lengkap sebuah aturan adalah <code>\'metrik: ekspresi\'</code> dengan operator perbandingan seperti <code>&lt;</code>, <code>&lt;=</code>, <code>&gt;</code>, <code>&gt;=</code>, <code>==</code>, <code>!=</code>. Yang beragam adalah <b>fungsi agregasi</b> yang dipakai:</p><table><thead><tr><th>Ekspresi</th><th>Arti</th><th>Cocok untuk tipe metrik</th></tr></thead><tbody><tr><td><code>avg</code></td><td>Rata-rata seluruh nilai</td><td>Trend (durasi)</td></tr><tr><td><code>med</code></td><td>Median — nilai tengah</td><td>Trend</td></tr><tr><td><code>min</code> / <code>max</code></td><td>Nilai terkecil / terbesar</td><td>Trend</td></tr><tr><td><code>p(95)</code>, <code>p(99)</code></td><td>Persentil ke-95 atau ke-99</td><td>Trend</td></tr><tr><td><code>rate</code></td><td>Rasio nilai "benar" terhadap total (0–1)</td><td>Rate (dan metrik <code>checks</code>)</td></tr><tr><td><code>count</code></td><td>Jumlah kejadian yang dicatat</td><td>Counter / Rate</td></tr><tr><td><code>value</code></td><td>Nilai akhir (untuk Gauge) atau jumlah akumulasi (Counter)</td><td>Counter / Gauge</td></tr></tbody></table><p>Persentil adalah cara paling jujur untuk membicarakan latency: <code>p(95)&lt;500</code> berarti "95% request harus di bawah 500 ms" — bukan rata-rata yang bisa menutupi ekor panjang. Angka p(95) dan p(99) memang sengaja lebih besar daripada <code>avg</code>.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Konfigurasi Threshold yang Lengkap',
      lang: 'javascript',
      output: false,
      code: `import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '2m',
  thresholds: {
    // gagal kalau lebih dari 1% request error server
    http_req_failed: ['rate<0.01'],
    // latency: 95% request di bawah 500 ms, 1% terburuk di bawah 1000 ms
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    // minimal 99% check harus lolos
    checks: ['rate>0.99'],
  },
};

export default function () {
  const res = http.get('https://api.example.com/products');
  check(res, { 'status adalah 200': (r) => r.status === 200 });
  sleep(1);
}`,
      explain: [
        'Tiga aturan di atas adalah "paket minimal" yang layak ada di hampir setiap tes: <b>kegagalan server, latency mayoritas, latency ekor, dan kualitas respons</b>.',
        '<code>http_req_failed</code> adalah metrik tipe <i>Rate</i>, jadi nilainya sudah berupa rasio 0–1; karena itu memakai fungsi <code>rate</code>. Angka <code>0.01</code> berarti 1%.',
        '<code>http_req_duration</code> adalah tipe <i>Trend</i>, jadi dievaluasi dengan fungsi seperti <code>p(95)</code>. Boleh menumpuk beberapa aturan untuk satu metrik, dipisah koma dalam array.',
        '<code>checks</code> juga tipe Rate. Threshold ini membuat tes gagal secara otomatis bila kualitas respons (hasil check kamu) turun di bawah 99%.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Mempersempit Threshold dengan Tag</h3><p>Sampai di sini, threshold berlaku untuk <b>semua</b> request dalam tes. Padahal kadang endpoint publik ringan boleh lambat sedikit, sementara endpoint checkout wajib ketat. k6 menyediakan <b>tag</b> pada nama metrik: cukup sertakan filter di dalam kurung kurawal, misalnya <code>\'http_req_duration{name:GetProducts}:p(95)&lt;300\'</code>.</p><p>Tag <code>name</code> itu sendiri bisa kamu tetapkan lewat objek <code>params</code> pada pemanggilan HTTP, sehingga setiap request punya identitas sendiri di metrik. Perhatikan juga dua detail teknis: nilai tag yang mengandung koma harus di-escape (lihat dokumentasi resmi untuk versi k6 yang kamu pakai), dan setiap kombinasi tag akan menambah jumlah "seri" metrik yang dipantau.</p><p>Lalu ada <b>abortOnFail</b> — opsi yang membuat k6 <b>berhenti seketika</b> ketika sebuah threshold dilanggar, plus <b>delayAbortEval</b> untuk menunda evaluasi beberapa detik agar nilai awal yang belum stabil tidak langsung menggugurkan tes. Kombinasi ini cocok untuk smoke test di awal pipeline: kalau aplikasinya sudah rusak, tidak ada gunanya melanjutkan tes 30 menit.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Gerbang Cepat dengan abortOnFail + Threshold Bertag',
      lang: 'javascript',
      output: false,
      code: `import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    smoke_gate: {
      executor: 'constant-vus',
      vus: 2,
      duration: '30s',
      thresholds: {
        http_req_failed: [{
          threshold: 'rate<0.01',
          abortOnFail: true,     // begitu dilanggar, tes langsung berhenti
          delayAbortEval: '10s', // beri waktu 10 detik agar angka awal stabil
        }],
      },
    },
    beban_penuh: {
      executor: 'constant-vus',
      vus: 20,
      duration: '10m',
      startTime: '40s',
      // k6 menambahkan tag scenario:<nama> pada semua metrik di skenario ini
      thresholds: {
        'http_req_duration{scenario:beban_penuh}': ['p(95)<500'],
      },
    },
  },
};

export default function () {
  const res = http.get('https://api.example.com/products', {
    tags: { name: 'GetProducts' },
  });
  check(res, { 'status adalah 200': (r) => r.status === 200 });
  sleep(1);
}`,
      explain: [
        'Bentuk objek <code>{ threshold: \'rate&lt;0.01\', abortOnFail: true, delayAbortEval: \'10s\' }</code> adalah aturan "berhenti cepat": smoke test berhenti di detik ke-10 begitu error rate menyentuh pagu, tanpa perlu menunggu durasi penuh.',
        'Properti <code>thresholds</code> yang diletakkan <b>di dalam</b> skenario hanya menilai metrik dari skenario itu. Alternatifnya, kamu bisa menulis threshold di level global dan menyaringnya dengan tag otomatis <code>{scenario:beban_penuh}</code>.',
        'Tag <code>name:GetProducts</code> dari <code>params</code> memungkinkan penyaringan yang lebih halus lagi: per endpoint, bukan per skenario — keduanya boleh dipakai bersamaan.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh: Menjaga Pipeline CI Tetap Jujur (Exit Code)',
      lang: 'bash',
      output: false,
      code: `# k6 mengembalikan kode keluar (exit code) khusus saat threshold dilanggar
k6 run --vus 5 --duration 1m smoke.js
STATUS=$?

if [ "$STATUS" -eq 99 ]; then
  echo "Threshold tidak terpenuhi — deploy DIBATALKAN"
  exit 1
elif [ "$STATUS" -ne 0 ]; then
  echo "k6 gagal dengan kode $STATUS — skrip atau jaringan bermasalah"
  exit "$STATUS"
fi

echo "Semua threshold terpenuhi — lanjut ke tahap deploy"`,
      explain: [
        'k6 memakai kode keluar <b>99</b> khusus untuk "tes berjalan sempurna tetapi ada threshold yang dilanggar". Kode 0 berarti semua threshold terpenuhi; kode lain menandakan masalah teknis — cek dokumentasi resmi untuk daftar lengkapnya sesuai versi kamu.',
        'Memisahkan kode 99 dari kode error lain membuat pesan CI lebih bermakna: "produknya yang tidak sanggup" berbeda dengan "skripnya yang rusak".'
      ]
    },
    {
      type: 'text',
      html: '<h3>Membaca Ringkasan Ketika Tes Gagal</h3><p>Ketika threshold dilanggar, k6 mencetak blok ringkasan akhir yang menandai setiap aturan dengan tanda ✓ atau ✗. Cuplikan berikut disederhanakan agar mudah dibaca (tampilan persisnya bisa berbeda antarversi k6):</p>'
    },
    {
      type: 'example',
      title: 'Contoh Output: Dua Threshold Dilanggar',
      lang: 'text',
      output: false,
      code: `  ✓ status adalah 200                     99.60%  ✓ 1195  ✗ 5
  ✗ pesanan berhasil dibuat               94.00%  ✓ 1128  ✗ 72

  checks.........................: 96.80%  ✓ 2323  ✗ 77
  http_req_failed................: 0.42%   ✓ 1195  ✗ 5
  http_req_duration..............: avg=432.87 min=118.40 med=360.20
                                    max=2104.60 p(90)=684.10 p(95)=812.70 p(99)=1502.30

  ✗ checks: rate>0.99 .................. violated (0.968 < 0.99)
  ✗ http_req_duration: p(95)<500 ....... violated (812.70 > 500)`,
      explain: [
        'Baris pertama membaca hasil check per nama: "pesanan berhasil dibuat" hanya lolos 94% — dan nama itulah yang langsung menunjuk ke masalah, tanpa perlu membuka log.',
        'Deret <code>p(90)=684.10 p(95)=812.70</code> menunjukkan ekor latency yang melebar jauh di atas <code>avg</code> — persis yang ditangkap threshold <code>p(95)&lt;500</code> dan bukan oleh rata-rata.',
        'Dua pelanggaran ini membuat exit code 99: pipeline berhenti merah, dan tim tahu persis harus membuka bagian mana.'
      ]
    },
    {
      type: 'tip',
      title: 'Tetapkan Threshold dari Baseline',
      text: 'Jangan memilih angka threshold dari suasana hati. Jalankan tes beberapa kali pada versi yang sehat, catat nilai <code>p(95)</code> dan <code>rate</code> yang konsisten muncul, lalu tetapkan threshold <b>sedikit di atas</b> angka itu sebagai pagar. Threshold yang lahir dari baseline atau kesepakatan SLO dipercaya semua orang; threshold karangan hanya menimbulkan perdebatan tiap kali tes merah.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Threshold yang <b>terlalu ketat</b> membuat tes gagal acak (flaky): persentil bergerak wajar pun sudah menyentuh pagu, lalu orang mulai "klik ulang sampai hijau" — kepercayaan pada tes pun mati. Threshold yang <b>terlalu longgar</b> menutupi masalah nyata: p(95) 5 detik lolos terus karena pagunya 10 detik.'
    },
    {
      type: 'vocab',
      items: [
        ['Check', 'Penanda benar/salah untuk satu respons; menghasilkan boolean dan dicatat ke metrik checks tanpa menghentikan iterasi.'],
        ['Threshold', 'Aturan nilai pada sebuah metrik; satu pelanggaran membuat seluruh tes dianggap gagal.'],
        ['Persentil p(N)', 'Nilai di bawah mana N persen data berada; p(95) berarti 95% request lebih cepat dari angka itu.'],
        ['abortOnFail', 'Opsi threshold yang menghentikan tes seketika saat aturan dilanggar — gerbang untuk smoke test.'],
        ['delayAbortEval', 'Jeda evaluasi threshold di awal tes agar angka yang belum stabil tidak langsung menggugurkan run.'],
        ['Exit code 99', 'Kode keluar k6 ketika ada threshold yang dilanggar; dipakai sebagai penanda gagal di CI.'],
        ['Tag metrik', 'Label tambahan pada nama metrik, misalnya {name:GetProducts}, untuk menilai threshold per endpoint.']
      ]
    }
  ],
  recap: [
    'check(res, {nama: (r) =&gt; kondisi}) menandai benar/salah per respons tanpa menghentikan iterasi; hasilnya masuk ke metrik checks dan tampil di ringkasan berdasarkan nama yang kamu berikan.',
    'Threshold dipasang di blok options: Trend dinilai avg/med/min/max/p(N), Rate dengan rate, Counter dengan count — satu pelanggaran membuat seluruh tes gagal.',
    'Tag pada nama metrik, misalnya http_req_duration{name:GetProducts}:p(95)&lt;300, memungkinkan kriteria lulus berbeda per endpoint atau per skenario.',
    'abortOnFail plus delayAbortEval membuat smoke test berhenti cepat saat masalah fatal terdeteksi, sementara exit code 99 menjadi sinyal gagal yang tegas di pipeline CI.'
  ]
});
