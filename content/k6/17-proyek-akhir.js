/* ============================================================
   Pelajaran Grafana k6 — Bab 17: Proyek Akhir Test Suite End-to-End
   ============================================================ */
'use strict';

window.K6_LESSONS = window.K6_LESSONS || [];

window.K6_LESSONS.push({
  id: 'proyek-akhir',
  title: 'Proyek Akhir: Test Suite End-to-End',
  chapter: 'Proyek',
  duration: '18–20 menit',
  intro: [
    'Selama beberapa bab kamu mengumpulkan alat satu per satu: skenario, executor, threshold, custom metric, Docker, dan pipeline. Bab penutup ini menyatukannya menjadi satu <b>test suite end-to-end</b> — dari login, memilih produk, membuat pesanan, sampai membayar, persis alur pengguna sungguhan di toko daring.',
    'Proyeknya nyata dan sederhana: API e-commerce milikmu sendiri atau lingkungan staging yang sudah ada izinnya. Kita tetapkan <b>SLO</b> yang jelas (p95 di bawah 500 ms, error di bawah 1%), membangun struktur repository yang rapi, menjalankannya di lokal, Docker, dan CI, lalu mengubah satu temuan bottleneck menjadi perbaikan terukur.',
    'Isi bab ini: skenario dan endpoint, struktur repository, kode lengkap <code>scenarios/load.js</code>, kerangka <code>lib/auth.js</code>, langkah menjalankan, siklus baseline ke optimasi, template laporan, hingga checklist kemampuan.'
  ],
  objectives: [
    'Menyusun test suite end-to-end yang mencakup seluruh alur bisnis inti e-commerce',
    'Menulis skenario k6 dengan SharedArray, setup(), group(), check(), dan custom metric',
    'Menjalankan tes di lokal, Docker, dan CI lalu menyimpan hasil ke results/',
    'Mengubah temuan baseline menjadi optimasi terukur serta laporan yang bisa ditindaklanjuti'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Skenario dan Asumsi SLO</h3><p>Alur yang diuji adalah perjalanan pelanggan: masuk, melihat barang, memesan, lalu membayar. Semua endpoint dijalankan terhadap lingkungan yang sudah berizin tertulis — bukan produksi.</p><table><thead><tr><th>Metode</th><th>Endpoint</th><th>Peran dalam alur</th></tr></thead><tbody><tr><td>POST</td><td><code>/api/login</code></td><td>Mendapatkan token; dijalankan di <code>setup()</code></td></tr><tr><td>GET</td><td><code>/api/products</code></td><td>Menelusuri katalog (paling sering dipanggil)</td></tr><tr><td>POST</td><td><code>/api/orders</code></td><td>Membuat pesanan — titik paling rawan bottleneck</td></tr><tr><td>GET</td><td><code>/api/orders/{id}</code></td><td>Memeriksa status pesanan</td></tr><tr><td>POST</td><td><code>/api/payments</code></td><td>Menyelesaikan pembayaran</td></tr></tbody></table><p>Asumsi keberhasilan: <b>p95 &lt; 500 ms</b> dan <b>error rate &lt; 1%</b>. Smoke test memakai ambang lebih longgar dengan <code>abortOnFail</code> agar kegagalan tertangkap dalam hitungan detik.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Struktur Repository dan Langkah Menjalankan',
      lang: 'text',
      output: false,
      code: `perf-ecommerce/
├── scenarios/
│   ├── smoke.js        # 60 detik, VU kecil, abortOnFail
│   └── load.js         # skenario utama: dua executor
├── lib/
│   └── auth.js         # login, mengembalikan token
├── data/
│   └── users.json      # daftar pengguna uji (dibaca SharedArray)
├── results/            # hasil percobaan (diabaikan git)
├── README.md           # perintah persis seperti di CI
└── .gitignore          # results/

JALANKAN LOKAL
k6 run scenarios/smoke.js -e BASE_URL=https://staging.example.com
k6 run -e RUN_ID=$(date +%Y%m%d-%H%M) --out json=results/load.json scenarios/load.js

JALANKAN DENGAN DOCKER
docker run --rm -v "$PWD:/scripts" -w /scripts -e BASE_URL -e RUN_ID \\
  grafana/k6:0.50.0 run /scripts/scenarios/load.js

DI CI        ikuti Bab 15: smoke test di tiap PR, load test terjadwal.
HASIL        results/load.json diunggah sebagai artefak pipeline.`,
      explain: [
        'Pisahkan skenario berat (<code>load.js</code>) dari smoke test; README berisi perintah persis agar siapa pun bisa mengulang tes seperti di CI.',
        '<code>RUN_ID</code> dan <code>BASE_URL</code> datang dari variabel lingkungan, sehingga setiap percobaan punya label yang bisa dicari di dasbor dan artefak.',
        'Folder <code>results/</code> dibuat lebih dahulu di host; Docker cukup memetakan folder proyek dan meneruskan env seperti pada Bab 15.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh: lib/auth.js dan data/users.json',
      lang: 'javascript',
      output: false,
      code: `// lib/auth.js — dipakai oleh setup() di skenario
import http from 'k6/http';
import { check } from 'k6';

export function login(baseUrl, user) {
  const res = http.post(baseUrl + '/api/login', JSON.stringify({
    username: user.username,
    password: user.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'login' },
  });

  check(res, { 'login berhasil': (r) => r.status === 200 });

  return res.json('token');
}

// --- data/users.json ---
// [
//   { "username": "nina", "password": "belanja123" },
//   { "username": "rudi", "password": "belanja123" },
//   { "username": "sari", "password": "belanja123" }
// ]`,
      explain: [
        '<code>login()</code> mengembalikan token sekali lewat <code>setup()</code>, sehingga ratusan iterasi tidak mengulang autentikasi dan angka login tidak mencemari hasil.',
        'Tag <code>endpoint: login</code> membuat metrik sub-permintaan sehingga kamu bisa memberi threshold khusus untuk login, misal <code>http_req_duration{endpoint:login}</code>.',
        '<code>users.json</code> disimpan sebagai berkas terpisah dan dibaca oleh <code>SharedArray</code>; data uji bisa diperbarui tanpa menyentuh kode skenario.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh: scenarios/load.js (lengkap)',
      lang: 'javascript',
      output: false,
      code: `import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import { login } from '../lib/auth.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const RUN_ID = __ENV.RUN_ID || 'lokal';

const businessErrors = new Rate('business_errors');

// Data dibaca sekali, lalu dipakai semua VU
const users = new SharedArray('users', function () {
  return JSON.parse(open('../data/users.json'));
});

export const options = {
  tags: { run_id: RUN_ID },
  thresholds: {
    http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: true, delayAbortEval: '15s' }],
    http_req_duration: ['p(95)<500', 'p(99)<1500'],
    'http_req_duration{endpoint:orders}': ['p(95)<400'],
    business_errors: ['rate<0.02'],
    checks: ['rate>0.98'],
  },
  scenarios: {
    belanja: {
      executor: 'constant-arrival-rate',
      rate: 20,
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 50,
      maxVUs: 200,
      exec: 'belanja',
      startTime: '30s',
    },
    puncak: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 40 },
        { duration: '3m', target: 40 },
        { duration: '1m', target: 0 },
      ],
      exec: 'jelajah',
      startTime: '6m',
    },
  },
};

export function setup() {
  return { token: login(BASE_URL, users[0]), runId: RUN_ID };
}

export function belanja(data) {
  group('cari produk', function () {
    const res = http.get(BASE_URL + '/api/products?page=1', {
      headers: { Authorization: 'Bearer ' + data.token },
      tags: { endpoint: 'products' },
    });
    check(res, { 'daftar produk tampil': (r) => r.status === 200 && Array.isArray(r.json('items')) });
  });

  group('buat pesanan', function () {
    const payload = JSON.stringify({ sku: 'SKU-1001', qty: 1 });
    const res = http.post(BASE_URL + '/api/orders', payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + data.token,
      },
      tags: { endpoint: 'orders' },
    });
    businessErrors.add(!check(res, {
      'pesanan terbuat': (r) => r.status === 201 && r.json('id') !== undefined,
    }));
  });

  group('bayar', function () {
    const res = http.post(BASE_URL + '/api/payments', JSON.stringify({ method: 'card' }), {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + data.token,
      },
      tags: { endpoint: 'payments' },
    });
    businessErrors.add(!check(res, {
      'pembayaran lunas': (r) => r.status === 200 && r.json('status') === 'paid',
    }));
  });

  sleep(1);
}

export function jelajah(data) {
  group('lacak pesanan', function () {
    const res = http.get(BASE_URL + '/api/orders/1001', {
      headers: { Authorization: 'Bearer ' + data.token },
      tags: { endpoint: 'order-detail' },
    });
    check(res, { 'pesanan ditemukan': (r) => r.status === 200 });
  });
  sleep(2);
}`,
      explain: [
        '<b>Dua executor</b> dipisah waktu lewat <code>startTime</code>: <code>belanja</code> menjaga laju tetap 20 request/detik selama 5 menit, lalu <code>puncak</code> menaikkan VU sebagai tahap puncak — beban laju tetap dan beban berbasis VU tidak saling menabrak.',
        '<code>SharedArray</code> membaca <code>users.json</code> sekali untuk seluruh proses, <code>setup()</code> mengurus token, dan <code>group()</code> membuat tiap alur bisnis terbaca terpisah di hasil akhir.',
        '<code>business_errors</code> adalah <b>custom metric</b> berupa Rate untuk kegagalan bisnis yang tak terlihat dari status HTTP saja; tag <code>run_id</code> menempel pada seluruh sampel sehingga baseline dan sesudah optimasi mudah dibedakan.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh: Perbandingan Hasil dan Template Laporan',
      lang: 'text',
      output: false,
      code: `LANGKAH
1 jalankan baseline 3 kali, catat p95 dan error   p95 820 ms, error 1,4 %
2 lakukan SATU optimasi (tambah index pada orders)
3 jalankan ulang dengan kondisi setara            p95 310 ms, error 0,4 %
4 isi laporan dengan angka, bukti, dan batasannya

PERBANDINGAN
metrik            sebelum    sesudah    selisih
p95 latency       820 ms     310 ms     -62 %
p99 latency       1,9 s      480 ms     -75 %
error rate        1,4 %      0,4 %      -1,0 poin
throughput        210 req/s  460 req/s  +119 %

LAPORAN HASIL PENGUJIAN
Ringkasan      : lulus/tidaknya SLO dalam 3-5 kalimat, plus angka terpenting
Skenario       : executor, durasi, target, versi k6, lokasi generator, run_id
Kriteria       : p95 < 500 ms dan error < 1 % beserta alasannya
Hasil          : tabel sebelum vs sesudah, tautan artefak dan log
Analisis       : bottleneck yang ditemukan dan bukti dari log/dashboard
Rekomendasi    : tindakan, pemilik tindakan, rencana pengujian ulang,
                 ketidakpastian serta batasan tes`,
      explain: [
        'Angka p95 820 ms menjadi 310 ms hanya berarti bila perubahannya satu dan kondisinya setara — karena itu baseline dijalankan tiga kali dan optimasi dilakukan setelah angka stabil.',
        'Template laporan berurutan: Ringkasan, Skenario, Kriteria, Hasil, Analisis, lalu Rekomendasi; jangan lewatkan ketidakpastian dan batasan tes agar pembaca tahu seberapa jauh angka dipercaya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Checklist Kemampuan Mahir</h3><p>Setelah proyek ini selesai, periksa dirimu terhadap daftar berikut — centang satu per satu, dan bila ada yang belum, ulangi bab terkait:</p><ol><li>Memilih model beban yang sesuai pertanyaan bisnis: <code>constant-arrival-rate</code>, <code>ramping-vus</code>, atau <code>per-vu-iterations</code>.</li><li>Menyusun skenario multi-executor dengan <code>startTime</code> agar tahapan tidak saling menabrak.</li><li>Mengautentikasi lewat <code>setup()</code> tanpa membebani tiap iterasi.</li><li>Memakai <code>SharedArray</code> agar data uji dibaca sekali oleh seluruh VU.</li><li>Mengelompokkan alur dengan <code>group()</code> dan memasang <code>check()</code> pada titik bisnis penting.</li><li>Membuat custom metric (<code>Rate</code>, <code>Counter</code>, atau <code>Trend</code>) untuk hal yang tidak terukur bawaan.</li><li>Menetapkan threshold yang wajar dan memakai <code>abortOnFail</code> pada smoke test.</li><li>Menjalankan tes di lokal, Docker, dan CI dengan versi image yang dikunci.</li><li>Membaca kurva, error, dan log untuk menemukan bottleneck, bukan menebak-nebak.</li><li>Memverifikasi satu optimasi dengan beban setara sebelum mengumumkan hasilnya.</li><li>Membandingkan hasil antar rilis berdasarkan baseline yang tersimpan sebagai artefak.</li><li>Menulis laporan berisi temuan, bukti angka, rekomendasi, pemilik tindakan, dan rencana pengujian ulang.</li></ol>'
    },
    {
      type: 'tip',
      title: 'Tips: Mulai Kecil, Akhiri dengan Portofolio',
      text: 'Selalu jalankan <b>smoke test</b> dulu sebelum skenario berat — ia memastikan skrip, autentikasi, dan endpoint benar dalam hitungan detik, sehingga kegagalan skenario besar bukan karena kesalahan sepele. Setelah proyek selesai, simpan repository, ringkasan hasil, dan laporan sebagai portofolio: kumpulan "baseline — temuan — perbaikan — bukti angka" bercerita lebih kuat daripada daftar teknologi.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: '<p>Sebelum menekan tombol jalankan, pastikan tiga hal beres: <b>izin tertulis</b> dari pemilik lingkungan, <b>batas beban</b> yang disepakati (RPS, durasi, jam), dan <b>rencana penghentian</b> berisi kontak yang dihubungi bila target melambat. <b>Jangan pernah</b> mengirim skenario stress atau spike ke produksi — uji beban berat hanya ke staging yang disiapkan, dan pastikan tim tahu kapan tes berjalan.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Test suite', 'Kumpulan skenario, data, dan konfigurasi yang dijalankan bersama untuk menguji satu sistem secara utuh.'],
        ['SharedArray', 'Cara k6 membaca data besar sekali lalu memakainya di semua VU tanpa menggandakan memori.'],
        ['setup()', 'Fungsi yang dijalankan sekali sebelum skenario, umumnya untuk login dan menyiapkan data awal.'],
        ['Executor', 'Strategi beban dalam skenario, misalnya laju tetap (constant-arrival-rate) atau VU menaik (ramping-vus).'],
        ['Custom metric', 'Metrik buatan sendiri — Rate, Counter, Trend — untuk ukuran spesifik aplikasi.'],
        ['SLO', 'Target layanan yang disepakati, misalnya p95 < 500 ms dan error < 1 %, lalu diterjemahkan ke threshold.'],
        ['run_id', 'Label unik tiap percobaan dari variabel lingkungan, dipakai memisahkan hasil antar pelaksanaan.']
      ]
    }
  ],
  recap: [
    'Test suite end-to-end terdiri dari smoke test singkat dan skenario load dengan dua executor, data pengguna lewat SharedArray, serta token dari setup().',
    'Struktur repository memisahkan scenarios, lib, data, dan results sehingga tes mudah dijalankan di lokal, Docker, maupun CI.',
    'Siklus baseline ke optimasi berarti: jalankan berulang, catat p95 dan error, ubah satu hal, lalu jalankan ulang dengan kondisi setara.',
    'Laporan yang baik memuat ringkasan, skenario, kriteria, hasil, analisis, rekomendasi, beserta ketidakpastian dan batasan tes.',
    'Checklist kemampuan mahir menjadi peta: dari memilih model beban sampai menulis laporan yang bisa ditindaklanjuti tim.'
  ]
});
