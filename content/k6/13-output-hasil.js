/* ============================================================
   Pelajaran Grafana k6 — Bab 13: Membaca Hasil & Format Output k6
   ============================================================ */
'use strict';

window.K6_LESSONS = window.K6_LESSONS || [];

window.K6_LESSONS.push({
  id: 'output-hasil',
  title: 'Membaca Hasil & Format Output k6',
  chapter: 'Hasil & Observability',
  duration: '8–10 menit',
  intro: [
    'Setiap kali tes beban selesai, k6 menyemburkan deretan angka ke terminal. Angka itu ibarat hasil lab: kalau kamu tahu cara bacanya, langsung terlihat sehat atau tidak sistem yang diuji; kalau tidak, yang tersisa hanya kumpulan angka yang bikin pusing.',
    'Ringkasan terminal sebetulnya baru satu dari beberapa bentuk hasil. k6 juga bisa menulis time series mentah ke file (JSON), mengirimnya langsung ke Prometheus, atau mengemasnya lewat <code>handleSummary()</code> menjadi laporan formatmu sendiri.',
    'Bab ini membahas anatomi ringkasan akhir, cara membaca angkanya (kenapa <b>med</b> dan <b>p95</b> berbeda, arti <b>iterations/s</b> dan <b>vus_max</b>), menyimpan ringkasan, memilih output dan opsi CLI untuk CI, sampai kebiasaan menyimpan artefak agar bisa dibandingkan dari run ke run.'
  ],
  objectives: [
    'Membaca ringkasan akhir k6: THRESHOLDS, TOTAL RESULTS, checks, dan pesan error selama tes',
    'Menjelaskan perbedaan med dan p95, iterations dan iterations/s, vus dan vus_max',
    'Menyimpan ringkasan lewat handleSummary() ke stdout sekaligus file JSON',
    'Memilih output time series dan opsi CLI yang tepat untuk kerja lokal maupun CI'
  ],
  sections: [
    {
      type: 'example',
      title: 'Contoh: Keluaran terminal dari awal sampai akhir tes',
      lang: 'text',
      output: false,
      code: `     execution: local
        script: scenarios/load.js
        output: json=results/metrik.jsonl

     scenarios: (100.00%) 1 scenario, 20 max VUs, 1m00s max duration (incl. graceful stop):
              * default: 20 looping VUs for 1m00s (gracefulRampDown: 0s, gracefulStop: 10s)

WARN[0042] Request Failed  error="dial tcp 10.0.0.7:443: connect: connection refused"
          •••••••••••••••••••••••••••••••••••••••••••• 100%

  █ THRESHOLDS

    http_req_duration
    ✓ 'p(95)<500' p(95)=448.19ms

    http_req_failed
    ✓ 'rate<0.01' rate=0.83%


  █ TOTAL RESULTS

    checks_total.......................: 240     4.000000/s
    checks_succeeded...................: 100.00% 240 out of 240
    checks_failed......................: 0.00%   0 out of 240

    ✓ status adalah 200
    ✓ body memuat daftar produk

    HTTP
    http_req_duration..................: avg=214.71ms min=61.13ms med=188.42ms max=982.55ms p(90)=371.08ms p(95)=448.19ms
    http_req_failed....................: 0.83%   2 out of 240
    http_reqs..........................: 240     4.000000/s

    EXECUTION
    iteration_duration.................: avg=4.71s min=452ms med=4.69s max=6.12s p(90)=5.04s p(95)=5.31s
    iterations.........................: 240     4.000000/s
    vus................................: 20      min=20      max=20
    vus_max............................: 20      min=20      max=20

    NETWORK
    data_received......................: 1.9 MB  32 kB/s
    data_sent..........................: 74 kB   1.2 kB/s`,
      explain: [
        'Tiga blok pertama adalah <b>catatan eksekusi</b>: script, output yang dipakai, dan ringkasan skenario berisi jumlah VU, durasi, serta graceful stop — bagian yang membuat tes bisa direproduksi oleh rekanmu.',
        'Blok <b>THRESHOLDS</b> adalah juri: ✓ berarti syarat terpenuhi dan ✗ berarti gagal; k6 keluar dengan kode kegagalan sehingga pipeline bisa berhenti. Di sini p95 448,19ms masih di bawah syarat 500ms, tetapi error rate 0,83% mendekati batas 1%.',
        'Blok <b>TOTAL RESULTS</b> adalah inti: checks menampilkan rasio lolos beserta nama tiap check, HTTP menampilkan avg/min/med/max/p(90)/p(95), EXECUTION menampilkan iterations, iterations/s, vus, dan vus_max, sedangkan NETWORK menampilkan data yang dikirim dan diterima.',
        'Baris berawalan WARN atau ERRO tercetak di sela progress, bukan di dalam ringkasan — di sanalah letak <b>error selama tes berjalan</b>. Penamaan blok bisa berbeda antarversi; pegang dokumentasi resmi versimu.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Cara Membaca Angkanya</h3><p>Sering salah tafsir adalah <b>med</b> dan <b>p95</b>. <b>med (median)</b> adalah titik tengah: setengah request lebih cepat darinya. <b>p95</b> berarti 95% request selesai lebih cepat dari angka itu dan tersisa 5% yang lebih lambat. Med 188ms dengan p95 448ms berarti ada 5% request jauh lebih lambat — di situlah masalah yang disembunyikan rata-rata.</p><ul><li><b>avg</b> mudah dinaikkan beberapa outlier ekstrem, jadi jangan dipakai sendirian. Tanda distribusi bermasalah: avg jauh di atas med, atau max berkali-kali lipat dari p95.</li><li><b>iterations</b> adalah jumlah kali fungsi utama selesai dijalankan, <b>iterations/s</b> lajunya. Laju turun dengan jumlah VU tetap berarti tiap iterasi makin lambat — biasanya sisi server yang melambat.</li><li><b>vus</b> adalah VU aktif pada akhir pengukuran, <b>vus_max</b> puncak VU yang pernah dibuka. Pada skenario bertahap keduanya bisa jauh berbeda karena tes sedang ramp-up atau ramp-down.</li><li>Checks menjawab apakah <i>perilaku</i> yang diuji benar, bukan hanya cepat. Rasio <code>checks_succeeded</code> 100% dengan dua request gagal berarti kegagalannya terbaca sebagai error HTTP, bukan data rusak yang lolos.</li></ul><p>Untuk kebutuhan lain k6 menyediakan <code>--summary-mode=full</code> (detail per skenario dan group), <code>--summary-trend-stats</code> untuk memilih statistik seperti <code>med,p(95),p(99)</code>, dan <code>--summary-time-unit</code> agar seluruh satuan waktu konsisten.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Menyimpan ringkasan dengan handleSummary()',
      lang: 'javascript',
      output: false,
      code: `import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  iterations: 20,
  thresholds: { http_req_duration: ['p(95)<500'] },
};

export default function () {
  const res = http.get('https://test.k6.io');
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(0.5);
}

// Dipanggil k6 sekali di akhir tes, menggantikan ringkasan bawaan
export function handleSummary(data) {
  const dur = data.metrics.http_req_duration.values;
  const teks = [
    '==== HASIL TES ====',
    'Selesai pada  : ' + new Date().toISOString(),
    'Total request : ' + data.metrics.http_reqs.values.count,
    'Latency p95   : ' + dur['p(95)'].toFixed(1) + ' ms',
    'Error rate    : ' + (data.metrics.http_req_failed.values.rate * 100).toFixed(2) + ' %',
    'Checks        : ' + data.root_group.checks.map(function (c) {
      return c.name + ' (' + c.passes + '/' + (c.passes + c.fails) + ')';
    }).join(', '),
    '',
  ].join('\\n');

  return {
    stdout: teks,                                       // tampil di terminal
    'results/hasil.json': JSON.stringify(data, null, 2), // ditulis sebagai file
  };
}`,
      explain: [
        '<code>handleSummary(data)</code> menerima objek ringkasan k6 (berisi <code>metrics</code>, <code>root_group</code>, <code>options</code>, dan <code>state</code>) lalu mengembalikan peta <b>tujuan → isi</b>: <code>stdout</code> ditampilkan di terminal, <code>results/hasil.json</code> ditulis sebagai file. Buat dulu foldernya dengan <code>mkdir -p results</code>.',
        'Angka diambil dari <code>data.metrics</code>, misalnya <code>http_reqs.values.count</code> (Counter) dan <code>http_req_duration.values["p(95)"]</code> (Trend). Kunci statistik Trend mengikuti opsi <code>summaryTrendStats</code>; bila kamu mengubahnya, kuncinya ikut berubah.',
        'Saat kamu menulis <code>handleSummary()</code>, k6 tidak lagi mencetak ringkasan bawaan. Bila keduanya diperlukan, pakai <code>textSummary</code> dari <code>https://jslib.k6.io/k6-summary/</code> sebagai nilai <code>stdout</code> lalu tambahkan file milikmu.',
        'Cara lama menyimpan ringkasan adalah <code>--summary-export=hasil.json</code>; pada k6 modern opsi itu masih ada tetapi didokumentasikan sebagai <i>discouraged</i> dan digantikan <code>handleSummary()</code>. Nama opsi bisa berubah antarversi — cek dokumentasi resmi versimu.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh: Time series ke file &amp; opsi CLI yang berguna',
      lang: 'bash',
      output: false,
      code: `# 1) Simpan time series mentah: satu baris JSON per event (deklarasi metrik / titik data)
k6 run --out json=results/2026-10-18_run-abc123.jsonl scenarios/load.js

# 2) Tandai tiap run agar mudah dicocokkan dengan dashboard dan log lain
k6 run --tag run_id=abc123 --tag env=staging scenarios/load.js

# 3) Progress disembunyikan (nyaman di CI), dan setup() dilewati bila data sudah siap
k6 run --quiet --no-setup scenarios/load.js

# 4) Variabel disuntik lewat -e, dibaca di script melalui __ENV
k6 run -e BASE_URL=https://staging.example.com -e RUN_TAG=v2.3 scenarios/load.js

# 5) Intip hasil konsolidasi opsi dan kebutuhan eksekusi tanpa menjalankan tes
k6 inspect scenarios/load.js
k6 inspect --execution-requirements scenarios/load.js`,
      explain: [
        '<code>--out json=...</code> menulis satu JSON per baris: deklarasi metrik dan satu baris per titik data (waktu, nilai, tag), siap diolah dengan <code>jq</code>; akhiran <code>.gz</code> membuatnya terkompresi otomatis. Untuk visualisasi langsung tersedia <code>--out experimental-prometheus-rw</code> (bab berikutnya).',
        '<code>--tag run_id=abc123</code> menempel pada seluruh sampel run ini dan di Prometheus menjadi label untuk menyaring hasil per run. Pakai nama tag yang sama di semua skrip agar konsisten.',
        '<code>--quiet</code> mematikan progress tetapi ringkasan tetap dicetak; <code>--no-setup</code> melewati <code>setup()</code> dan hanya aman bila tes tidak butuh data segar; <code>-e NAMA=nilai</code> membuat nilai tersedia sebagai <code>__ENV.NAMA</code> di dalam skrip.',
        '<code>k6 inspect</code> mencetak opsi hasil dalam JSON tanpa menjalankan tes, dan <code>--execution-requirements</code> menampilkan kebutuhan VU serta durasi yang akan dipakai — berguna memastikan konfigurasi benar sebelum tes panjang.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Menyimpan Artefak untuk CI &amp; Baseline</h3><p>Hasil yang hanya hidup di terminal akan hilang begitu sesi tertutup, jadi simpan sebagai <b>artefak</b> — terutama saat tes dijalankan pipeline. Kebiasaan yang enak: satu folder per run bernama <code>results/2026-10-18_run-abc123</code> berisi ringkasan JSON, file time series, dan log. Kombinasi tanggal dan <b>run_id</b> membuat hasil mudah dicari sekaligus mudah dicocokkan dengan dashboard karena run_id yang sama ikut tertempel sebagai tag.</p><figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 720 180" width="720" role="img" aria-label="Alur penyimpanan hasil k6 menuju folder results per run lalu menjadi artefak CI dan baseline"><rect x="20" y="30" width="155" height="58" rx="10" class="u-hd"/><text x="97" y="55" class="u-title" text-anchor="middle">k6 run</text><text x="97" y="76" class="u-lbl" text-anchor="middle">--out · --tag run_id</text><line x1="175" y1="59" x2="225" y2="59" class="u-line" marker-end="url(#u-arrow)"/><rect x="230" y="30" width="165" height="58" rx="10" class="u-box"/><text x="312" y="55" class="u-title" text-anchor="middle">handleSummary()</text><text x="312" y="76" class="u-lbl" text-anchor="middle">stdout + file JSON</text><line x1="395" y1="59" x2="445" y2="59" class="u-line" marker-end="url(#u-arrow)"/><rect x="450" y="30" width="250" height="58" rx="10" class="u-box"/><text x="575" y="53" class="u-title" text-anchor="middle">results/2026-10-18_abc123/</text><text x="575" y="74" class="u-lbl" text-anchor="middle">ringkasan.json · metrik.jsonl · log.txt</text><line x1="575" y1="88" x2="575" y2="112" class="u-line" marker-end="url(#u-arrow)"/><rect x="450" y="116" width="250" height="50" rx="10" class="u-hd"/><text x="575" y="137" class="u-title" text-anchor="middle">CI artifacts &amp; baseline</text><text x="575" y="156" class="u-lbl" text-anchor="middle">dibandingkan dari run ke run</text><rect x="20" y="116" width="395" height="50" rx="10" class="u-box"/><text x="217" y="137" class="u-title" text-anchor="middle">metadata ikut tersimpan</text><text x="217" y="156" class="u-lbl" text-anchor="middle">versi k6 · versi aplikasi · waktu tes</text></svg></div><figcaption class="fig-cap"><b>Gambar 13.1</b> — Satu folder per run berisi ringkasan, time series, dan log, lengkap dengan metadata pembanding</figcaption></figure><p>Di CI, unggah folder itu sebagai <i>build artifact</i> dengan retensi wajar (misalnya 30 hari), lalu bandingkan dengan <b>baseline</b> — hasil acuan yang disepakati tim. Perbandingan hanya adil bila skenario, versi aplikasi, dan lingkungannya sama; kalau salah satu berubah, catat sebagai variabel, bukan sebagai kemajuan.</p><p>Satu aturan yang tidak boleh dilanggar: <b>jangan commit data sensitif</b>. Token, URL internal, atau data pengguna yang bocor ke file hasil ikut terkirim ke repository dan artefak CI. Masukkan <code>results/</code> ke <code>.gitignore</code> dan simpan kerahasiaan lewat secret manager.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Ringkasan sendiri dari data.metrics',
      lang: 'javascript',
      output: false,
      code: `import http from 'k6/http';
import { check } from 'k6';

export const options = { vus: 5, duration: '30s' };

export default function () {
  const res = http.get('https://test.k6.io');
  check(res, { 'status 200': (r) => r.status === 200 });
}

// Hitung sendiri hanya angka yang benar-benar kamu butuhkan
export function handleSummary(data) {
  function v(name, key) {
    const m = data.metrics[name];
    return m && m.values ? m.values[key] : undefined;
  }

  function collectChecks(group, out) {
    (group.checks || []).forEach(function (c) { out.push(c); });
    (group.groups || []).forEach(function (g) { collectChecks(g, out); });
    return out;
  }

  const checks = collectChecks(data.root_group, []);
  const total = checks.reduce(function (s, c) { return s + c.passes + c.fails; }, 0);
  const passed = checks.reduce(function (s, c) { return s + c.passes; }, 0);
  const p95 = v('http_req_duration', 'p(95)');
  const errRate = v('http_req_failed', 'rate');

  return {
    stdout: [
      '--- Ringkasan kustom ---',
      'Durasi tes  : ' + Math.round((data.state.testRunDurationMs || 0) / 1000) + ' detik',
      'Iterasi     : ' + (v('iterations', 'count') || 0),
      'Latency p95 : ' + (p95 === undefined ? 'n/a' : p95.toFixed(1) + ' ms'),
      'Gagal HTTP  : ' + ((errRate || 0) * 100).toFixed(2) + ' %',
      'Checks      : ' + passed + '/' + total + ' lolos',
    ].join('\\n') + '\\n',
  };
}`,
      explain: [
        'Fungsi bantu <code>v()</code> menarik nilai dari <code>data.metrics</code> dengan aman; bila metrik tidak ada (misalnya tidak ada request sama sekali), hasilnya <code>undefined</code> dan ringkasan tetap tercetak tanpa error.',
        'Seluruh angka dihitung ulang dari data mentah: durasi tes dari <code>state.testRunDurationMs</code>, jumlah iterasi, p95, error rate, serta rasio checks — isi ringkasan sepenuhnya milikmu.',
        '<code>collectChecks()</code> menyusuri <code>root_group</code> secara rekursif sehingga check di dalam <code>group()</code> bersarang tetap ikut dihitung dan tidak ada angka yang hilang.',
        'Mengembalikan <code>stdout</code> saja sudah cukup; kamu boleh menulis beberapa file sekaligus, bahkan mengirim hasil ke server lain dengan <code>http.post()</code>.'
      ]
    },
    {
      type: 'tip',
      title: 'Tips Simpan Konteks Bersama Hasil',
      text: 'Angka tanpa konteks mustahil dibandingkan. Selalu catat <b>versi k6</b> (<code>k6 version</code>), <b>versi aplikasi</b> (tag atau commit), serta <b>waktu mulai dan berakhir</b> tes lengkap dengan timezone, lalu simpan bersama setiap artefak — misalnya sebagai <code>metadata.json</code> dalam folder run yang sama.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Nama opsi, flag, dan ekstensi k6 bisa berubah antarversi. <code>--summary-export</code> adalah cara lama menyimpan ringkasan yang kini didokumentasikan sebagai <i>discouraged</i>; cara modern adalah <code>handleSummary()</code>. Cek dokumentasi resmi untuk versi k6 yang kamu pakai sebelum mengikuti tutorial atau artikel lama.'
    },
    {
      type: 'vocab',
      items: [
        ['Summary', 'Ringkasan statistik agregat yang dicetak k6 di akhir tes (end-of-test summary).'],
        ['handleSummary()', 'Fungsi opsional pada skrip yang mengubah objek ringkasan menjadi laporan apa pun, lalu menulisnya ke stdout atau file.'],
        ['JSON output', 'Keluaran time series berupa satu baris JSON per event, siap diproses sendiri dengan jq atau script lain.'],
        ['run_id', 'Penanda unik tiap kali tes dijalankan, dipasang lewat --tag agar hasil bisa dicocokkan dengan dashboard dan log.'],
        ['Baseline', 'Hasil acuan dari kondisi tertentu yang disepakati tim sebagai pembanding run berikutnya.'],
        ['Artefak', 'File hasil yang disimpan dan diarsipkan — ringkasan, time series, log — agar bisa ditinjau ulang.']
      ]
    }
  ],
  recap: [
    'Ringkasan akhir k6 berisi THRESHOLDS sebagai juri lulus/gagal dan TOTAL RESULTS berisi checks, HTTP (avg/min/med/max/p90/p95), EXECUTION (iterations, iterations/s, vus, vus_max), serta NETWORK.',
    'med adalah titik tengah distribusi sedangkan p95 menggambarkan ekor 5% terburuk; jarak keduanya menandakan ada request lambat yang tak terlihat dari rata-rata.',
    'handleSummary() adalah cara modern menyimpan ringkasan (stdout plus file seperti results/hasil.json); --summary-export adalah cara lama yang tak lagi direkomendasikan.',
    'Time series mentah bisa disimpan lewat --out json=... untuk diolah sendiri, dan --tag run_id membuat hasil mudah dicocokkan dengan dashboard di bab berikutnya.',
    'Simpan artefak per run dengan penamaan tanggal dan run_id, lengkapi versi serta waktu tes, jangan commit data sensitif, dan jadikan satu hasil sebagai baseline pembanding.'
  ]
});
