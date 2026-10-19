/* ============================================================
   Pelajaran Grafana k6 — Bab 6: Metrik Bawaan & Custom Metrics
   ============================================================ */
'use strict';

window.K6_LESSONS = window.K6_LESSONS || [];

window.K6_LESSONS.push({
  id: 'metrics-custom',
  title: 'Metrik Bawaan & Custom Metrics',
  chapter: 'Kualitas & Metrik',
  duration: '8–10 menit',
  intro: [
    'Bayangkan dashboard mobil: kecepatan, putaran mesin, dan bahan bakar sudah terpasang dari pabrik — lengkap dan otomatis, tapi tidak ada yang memberitahumu apakah penumpang sampai tujuan selamat. Itulah posisi <b>metrik bawaan</b> k6. <b>Custom metrics</b> adalah sensor tambahan yang kamu pasang sendiri untuk mengukur hal yang benar-benar ingin diketahui.',
    'Ini penting karena angka HTTP tidak selalu menceritakan kebenaran bisnis. Endpoint checkout bisa membalas <code>200 OK</code> dengan riang, padahal di pesanannya tertulis "pembayaran gagal". Kalau hanya <code>http_req_duration</code> yang dipantau, tes tetap hijau sementara uang pelanggan menguap diam-diam.',
    'Bab ini memetakan metrik bawaan yang perlu dikenal, membedah empat tipe custom metrics — <b>Counter, Gauge, Rate, Trend</b> — lalu membahas tagging, metrik milik <code>group()</code>, dan jebakan klasik bernama <i>cardinality</i>.'
  ],
  objectives: [
    'Mengenali metrik bawaan utama k6 dan kapan masing-masing berguna',
    'Memilih tipe custom metric yang tepat: Counter, Gauge, Rate, atau Trend',
    'Mendaftarkan custom metrics, memakainya di dalam skrip, lalu menilainya lewat threshold',
    'Memberi tag pada request dan metrik untuk menyaring data per endpoint, kanal, atau skenario'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Metrik Bawaan: Instrumentasi Otomatis</h3><p>Setiap kali kamu menjalankan skrip, k6 sudah merekam sekumpulan metrik tanpa konfigurasi apa pun:</p><table><thead><tr><th>Metrik</th><th>Tipe</th><th>Untuk apa</th></tr></thead><tbody><tr><td><code>http_reqs</code></td><td>Counter</td><td>Jumlah total request — dasar throughput (RPS).</td></tr><tr><td><code>http_req_duration</code></td><td>Trend</td><td>Total waktu per request; patokan utama latency.</td></tr><tr><td><code>http_req_waiting</code></td><td>Trend</td><td>Waktu menunggu server (TTFB).</td></tr><tr><td><code>http_req_connecting</code></td><td>Trend</td><td>Waktu buka koneksi TCP; tinggi = koneksi habis.</td></tr><tr><td><code>http_req_tls_handshaking</code></td><td>Trend</td><td>Waktu negosiasi TLS.</td></tr><tr><td><code>http_req_sending</code></td><td>Trend</td><td>Waktu kirim body request.</td></tr><tr><td><code>http_req_receiving</code></td><td>Trend</td><td>Waktu unduh body respons.</td></tr><tr><td><code>http_req_failed</code></td><td>Rate</td><td>Rasio request gagal (4xx/5xx); wajib diberi threshold.</td></tr><tr><td><code>iterations</code></td><td>Counter</td><td>Jumlah iterasi <code>default function</code> yang selesai.</td></tr><tr><td><code>iteration_duration</code></td><td>Trend</td><td>Durasi satu siklus penuh, termasuk <i>think time</i>.</td></tr><tr><td><code>vus</code> &amp; <code>vus_max</code></td><td>Gauge</td><td>VU aktif saat ini dan puncak VU yang dialokasikan.</td></tr><tr><td><code>checks</code></td><td>Rate</td><td>Rasio hasil check yang lolos.</td></tr><tr><td><code>data_received</code> &amp; <code>data_sent</code></td><td>Counter</td><td>Byte masuk dan keluar.</td></tr></tbody></table><p>Catatan pembagian tipe: <b>Counter</b> menghitung kejadian, <b>Gauge</b> menyimpan nilai sesaat, <b>Rate</b> menyimpan rasio 0–1, dan <b>Trend</b> menyimpan seluruh sampel angka sehingga bisa dihitung persentilnya. Pembagian yang sama berlaku untuk metrik buatan kamu sendiri.</p>'
    },
    {
      type: 'text',
      html: '<h3>Custom Metrics: Sensor yang Kamu Pasang Sendiri</h3><p>Modul <code>k6/metrics</code> menyediakan empat kelas untuk membuat metrik sendiri. Pilih tipe berdasarkan <b>bentuk pertanyaan</b> yang ingin kamu jawab:</p><table><thead><tr><th>Tipe</th><th>Menyimpan</th><th>Cocok untuk</th><th>Contoh threshold</th></tr></thead><tbody><tr><td><b>Counter</b></td><td>Akumulasi jumlah/tot nilai</td><td>"Berapa banyak X terjadi?" — order dibuat, retry, kuota terpakai</td><td><code>count&gt;200</code></td></tr><tr><td><b>Gauge</b></td><td>Nilai terakhir yang diisi</td><td>"Berapa nilainya sekarang?" — panjang antrean, sisa koneksi</td><td><code>value&lt;1000</code></td></tr><tr><td><b>Rate</b></td><td>Rasio nilai benar/salah</td><td>"Berapa persen yang gagal?" — error bisnis, respons tidak valid</td><td><code>rate&lt;0.01</code></td></tr><tr><td><b>Trend</b></td><td>Distribusi seluruh sampel</td><td>"Seberapa besar nilainya?" — durasi query internal, ukuran payload</td><td><code>p(95)&lt;300</code></td></tr></tbody></table><p>Buat objeknya di tingkat modul (di luar fungsi) dengan <code>new Counter(\'nama\')</code>, <code>new Rate(\'nama\')</code>, dan seterusnya. Nama itulah yang kamu pakai di <code>thresholds</code> persis seperti nama metrik bawaan. Deklarasi diletakkan <b>di luar</b> <code>default function</code> agar tidak dibuat ulang tiap iterasi.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Tiga Custom Metrics yang Dinilai Threshold',
      lang: 'javascript',
      output: false,
      code: `import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const businessErrors = new Rate('business_errors');
const apiDuration = new Trend('api_duration');
const ordersCreated = new Counter('orders_created');

export const options = {
  vus: 10,
  duration: '2m',
  thresholds: {
    business_errors: ['rate<0.02'], // maksimal 2% pesanan gagal secara bisnis
    api_duration: ['p(95)<600'],    // 95% request di bawah 600 ms
    orders_created: ['count>200'],  // minimal 200 pesanan benar-benar tercatat
  },
};

export default function () {
  const payload = JSON.stringify({ sku: 'KOPI-01', qty: 2 });
  const params = { headers: { 'Content-Type': 'application/json' } };
  const res = http.post('https://api.example.com/orders', payload, params);

  const ok = check(res, {
    'status 201': (r) => r.status === 201,
    'pesanan punya id': (r) => r.json('data.id') !== null,
  });

  // Rate: boolean. true dihitung 1, false dihitung 0
  businessErrors.add(res.json('data.id') === null);
  // Trend: angka mentah dari timming request yang sudah k6 ukur
  apiDuration.add(res.timings.duration);
  // Counter: akumulasi satu per satu
  if (ok) {
    ordersCreated.add(1);
  }

  sleep(1);
}`,
      explain: [
        '<code>business_errors</code> memakai Rate karena pertanyaannya berupa rasio: "berapa persen pesanan tidak punya id?" — nilainya dinormalisasi 0–1 sehingga <code>rate&lt;0.02</code> terbaca "maksimal 2%".',
        '<code>api_duration</code> memakai Trend sehingga mendukung <code>p(95)</code>. Kalau kamu mengukur durasi bagian dalam yang kamu pilih sendiri (bukan seluruh request), pakai Trend buatan seperti ini.',
        '<code>orders_created</code> hanya diisi ketika check lolos — <code>count&gt;200</code> berfungsi sebagai jaminan minimal: kalau aplikasi error total, counter tetap 0 dan tes gagal jelas. Objek <code>res.timings</code> menyimpan rincian waktu per request yang siap kamu masukkan ke Trend.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Tagging: Menyaring Data Per Kategori</h3><p>Sampai di sini semua request tercampur dalam satu angka. Supaya bisa dibedakan, k6 menyediakan <b>tag</b> — label key:value yang menempel pada setiap sampel metrik. Ada dua cara memasangnya:</p><ul><li><b>Tag per request</b> — lewat objek <code>params</code>: <code>http.get(url, { tags: { endpoint: \'products\' } })</code>; objek yang sama juga menerima <code>headers</code> dan <code>timeout</code>.</li><li><b>Tag per pemanggilan metric</b> — <code>paymentFailures.add(1, { channel: \'gopay\' })</code>; setiap penambahan boleh membawa label berbeda.</li></ul><p>Tag dipakai dua arah: di <b>threshold</b> dengan sintaks kurung kurawal (<code>\'http_req_duration{endpoint:products}:p(95)&lt;300\'</code>) dan di <b>dashboard Grafana</b> sebagai legenda grafik. Tag global seperti <code>options = { tags: { team: \'payments\' } }</code> berlaku untuk seluruh run.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Tag Per Request dan Per Kanal Pembayaran',
      lang: 'javascript',
      output: false,
      code: `import http from 'k6/http';
import { Counter } from 'k6/metrics';

const paymentFailures = new Counter('payment_failures');

export const options = {
  vus: 5,
  duration: '1m',
  thresholds: {
    // dua endpoint dinilai dengan pagu latency berbeda
    'http_req_duration{endpoint:products}': ['p(95)<300'],
    'http_req_duration{endpoint:checkout}': ['p(95)<800'],
    // counter bertag: hanya kegagalan via gopay yang dihitung
    'payment_failures{channel:gopay}': ['count<10'],
  },
};

export default function () {
  http.get('https://api.example.com/products', {
    tags: { endpoint: 'products' },
  });

  const checkout = http.post(
    'https://api.example.com/checkout',
    JSON.stringify({ sku: 'KOPI-01', channel: 'gopay' }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { endpoint: 'checkout', channel: 'gopay' },
    }
  );

  if (checkout.status !== 201) {
    paymentFailures.add(1, { channel: 'gopay' });
  }
}`,
      explain: [
        'Tag <code>endpoint</code> dipasang pada request sehingga satu metrik <code>http_req_duration</code> pecah menjadi beberapa kurva terpisah — katalog yang ringan tidak lagi menutupi checkout yang berat.',
        'Tag <code>channel</code> pada Counter memungkinkan ambang batas khusus per kanal: kegagalan transfer bank boleh berbeda toleransinya dengan dompet digital. Pastikan kombinasi tag tetap sedikit dan stabil — jangan pakai nilai unik seperti nomor pesanan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Metrik dari group(), Cardinality, dan Metrik Bisnis</h3><p><b>group()</b> membungkus beberapa langkah menjadi satu blok bernama, dan k6 otomatis membuat metrik turunan <code>group::&lt;nama&gt;</code> berupa Trend yang merekam durasi seluruh isi blok itu — cara termurah mendapatkan "durasi alur checkout". Misalnya <code>group(\'checkout\', () =&gt; { ... })</code> menghasilkan <code>group::checkout::duration</code>.</p><p>Lalu ada <b>cardinality</b>: setiap kombinasi tag unik menjadi satu "seri" metrik baru yang harus disimpan dan diolah k6 maupun backend kamu (misalnya Prometheus). Sepuluh tag dengan 50 nilai masing-masing bisa menghasilkan jutaan seri — dan mesin pengujian jadi lebih sibuk menghitung metrik daripada menghasilkan beban. Aturannya: tag harus <b>sedikit dan stabil</b>; jangan pernah memakai ID unik atau URL mentah berisi query acak sebagai tag.</p><p>Terakhir, pahami perbedaan <b>metrik teknis</b> dan <b>metrik bisnis</b>: <code>http_req_failed</code> hanya melihat status code, sedangkan <code>business_errors</code> yang kamu buat bisa melihat isi jawaban — ada kalau status 200 tetapi pesanan tidak tercatat di database.</p><figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 240" width="760" role="img" aria-label="Perbandingan metrik teknis HTTP dengan metrik bisnis pada respons yang sama"><rect x="20" y="30" width="220" height="90" rx="10" class="u-box"/><text x="130" y="60" class="u-title" text-anchor="middle">Respons API</text><line x1="36" y1="70" x2="224" y2="70" class="u-line"/><text x="130" y="92" class="u-lbl" text-anchor="middle">status: 200 OK</text><text x="130" y="112" class="u-lbl" text-anchor="middle">body: { data: null }</text><line x1="240" y1="60" x2="330" y2="60" class="u-line" marker-end="url(#u-arrow)"/><line x1="240" y1="95" x2="330" y2="170" class="u-line" marker-end="url(#u-arrow)"/><rect x="340" y="30" width="200" height="70" rx="10" class="u-hd"/><text x="440" y="58" class="u-title" text-anchor="middle">Metrik teknis HTTP</text><text x="440" y="82" class="u-lbl" text-anchor="middle">http_req_duration: 180 ms ✓</text><rect x="340" y="140" width="200" height="70" rx="10" class="u-box"/><text x="440" y="168" class="u-title" text-anchor="middle">Metrik bisnis (custom)</text><text x="440" y="192" class="u-lbl" text-anchor="middle">business_errors: ++ (gagal)</text></svg></div><figcaption class="fig-cap"><b>Gambar 6.1</b> — Satu respons bisa terlihat sukses secara HTTP tetapi gagal secara bisnis; hanya custom metric yang menangkap sisi kedua</figcaption></figure>'
    },
    {
      type: 'example',
      title: 'Contoh: Merangkai group() dengan Metrik Sendiri',
      lang: 'javascript',
      output: false,
      code: `import http from 'k6/http';
import { group, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const dbDuration = new Trend('db_lookup_duration');

export default function () {
  group('checkout', () => {
    const cart = http.get('https://api.example.com/cart/88');
    dbDuration.add(cart.timings.duration);

    const order = http.post(
      'https://api.example.com/orders',
      JSON.stringify({ cartId: 88 }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    // order.status dicek di sini, tapi metrik group::checkout::duration
    // tetap merekam total waktu seluruh blok ini secara otomatis
  });

  sleep(1);
}`,
      explain: [
        'Karena dibungkus <code>group(\'checkout\')</code>, k6 otomatis merekam <code>group::checkout::duration</code> sebagai Trend — bisa langsung diberi threshold tanpa kode tambahan.',
        'Group bersarang menghasilkan nama berlapis, misalnya <code>group::checkout::payment::duration</code>; jangan bikin hierarki terlalu dalam agar namanya tetap mudah dibaca. <code>db_lookup_duration</code> diisi dari <code>timings</code> request — pola berguna bila kamu ingin durasi bagian itu saja terpisah dari total.'
      ]
    },
    {
      type: 'tip',
      title: 'Ukur yang Ditanya Product Owner',
      text: 'Sebelum menambah metrik baru, tanyakan dulu: "pertanyaan apa yang ingin dijawab tes ini?" Kalau product owner bertanya "berapa pesanan yang berhasil dibuat per menit?", maka <code>Counter(\'orders_created\')</code> jauh lebih berharga daripada dua puluh variasi durasi HTTP — dan hasil tes pun langsung dipahami pihak non-teknis.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Jangan pernah memakai <b>nilai unik</b> sebagai tag: id_user, nomor pesanan, timestamp, atau URL mentah dengan query berbeda tiap request. Setiap kombinasi tag membuat satu seri metrik baru; ribuan variasi membuat konsumsi memori k6 (dan penyimpanan Prometheus/Grafana Cloud) meledak, dan penghantar bebannya sendiri bisa jadi bottleneck tes.'
    },
    {
      type: 'vocab',
      items: [
        ['Metrik bawaan', 'Metrik yang otomatis direkam k6 tanpa konfigurasi, misalnya http_req_duration.'],
        ['Counter', 'Tipe metrik yang mengakumulasi jumlah kejadian; dinilai dengan count.'],
        ['Gauge', 'Tipe metrik yang menyimpan nilai terakhir yang diisi, cocok untuk ukuran sesaat.'],
        ['Rate', 'Tipe metrik berupa rasio benar/salah (0–1); dinilai dengan fungsi rate.'],
        ['Trend', 'Tipe metrik penyimpan seluruh sampel angka; mendukung avg, med, dan p(N).'],
        ['Tag', 'Label key:value pada sampel metrik untuk menyaring data per endpoint atau kategori.'],
        ['Cardinality', 'Jumlah seri metrik unik hasil kombinasi tag; harus dijaga sedikit dan stabil.'],
        ['Metrik group', 'Metrik turunan group::&lt;nama&gt; berupa Trend untuk durasi isi blok group().']
      ]
    }
  ],
  recap: [
    'k6 merekam metrik bawaan otomatis: http_reqs dan iterations menghitung volume, http_req_duration memecah latency, http_req_failed dan checks mengukur kualitas.',
    'Empat tipe custom metrics: Counter untuk akumulasi, Gauge untuk nilai sesaat, Rate untuk rasio, Trend untuk distribusi angka — pilih sesuai pertanyaan yang ingin dijawab.',
    'Custom metric dideklarasikan di luar fungsi, lalu dinilai di thresholds persis seperti metrik bawaan.',
    'Tag dari params request atau dari pemanggilan add() memungkinkan threshold dan dashboard per kategori — asalkan kombinasinya sedikit dan stabil.',
    'Angka HTTP bukan kebenaran bisnis: respons 200 bisa berisi kegagalan, dan hanya custom metric yang kamu rancang yang menangkapnya.'
  ]
});
