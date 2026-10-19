/* ============================================================
   Pelajaran Grafana k6 — Bab 7: Scenarios, Stages & Executors
   ============================================================ */
'use strict';

window.K6_LESSONS = window.K6_LESSONS || [];

window.K6_LESSONS.push({
  id: 'skenario-stages-executor',
  title: 'Scenarios, Stages & Executors',
  chapter: 'Skenario Beban',
  duration: '8–10 menit',
  intro: [
    'Bayangkan kamu merancang latihan pemadam kebakaran. Kalau semua petugas langsung berlari ke lapangan di detik pertama dan berhenti serentak juga, kamu tidak pernah tahu bagaimana tim bertahan saat beban datang bertahap, bertahan lama, lalu perlahan surut. Bentuk <b>kurva beban</b> itulah yang menentukan apakah latihanmu jujur atau tidak.',
    'Cara paling sederhana di k6 memang hanya menyebut <code>vus</code> dan <code>duration</code>: semua VU hidup sejak awal dan berhenti serentak. Tapi sistem nyata jarang begitu. Pengunjung datang bertahap, menumpuk di jam sibuk, lalu menjauh — dan k6 menyediakan <code>stages</code> serta objek <code>scenarios</code> untuk merekam bentuk itu.',
    'Bab ini membedah tiga hal bertingkat: dari <code>stages</code> sederhana (ramp-up, hold, ramp-down), ke objek <code>scenarios</code> yang bisa menjalankan beberapa bentuk beban sekaligus, sampai tabel <b>executor</b> — mesin penggerak di balik tiap skenario.'
  ],
  objectives: [
    'Membedakan konfigurasi vus+duration dengan bentuk stages bertahap',
    'Menulis stages lengkap beserta penjelasan tiap tahap dan peran gracefulRampDown',
    'Menjalankan beberapa skenario sekaligus dengan exec dan startTime yang berbeda',
    'Memilih executor yang tepat: constant-vus, ramping-vus, arrival-rate, atau shared-iterations'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>vus + duration: Cara Paling Sederhana</h3><p>Bentuk konfigurasi dasar k6 hanya menyebut dua angka:</p><pre><code>export const options = {\n  vus: 20,\n  duration: &quot;10m&quot;,\n};</code></pre><p>Artinya: 20 <b>VU</b> (virtual user) berjalan terus-menerus selama 10 menit, lalu semuanya berhenti. Bentuk kurvanya persegi — dari nol langsung ke 20, dan dari 20 langsung ke nol. Ini cukup untuk tes cepat, tetapi menyembunyikan dua hal penting: bagaimana sistem <b>merespons kenaikan beban</b> secara bertahap, dan apa yang terjadi saat beban <b>perlahan dilepas</b>.</p><p>Selain itu, istilah <b>VU</b> dan <b>iteration</b> perlu kamu pegang erat: satu VU adalah "satu pengguna palsu" yang menjalankan <code>default function</code> berulang-ulang. Satu putaran penuh fungsi itu disebut satu <b>iterasi</b>. Karena itu angka VU bukan jumlah pengguna sesungguhnya, melainkan jumlah "tab browser" yang bekerja bersamaan.</p>'
    },
    {
      type: 'text',
      html: '<h3>Stages: Ramp-Up, Hold, Ramp-Down</h3><p>Untuk meniru bentuk kurva nyata, ganti <code>duration</code> dengan array <b>stages</b>. Setiap tahap adalah objek berisi <code>target</code> (jumlah VU yang ingin dicapai) dan <code>duration</code> (waktu untuk mencapainya):</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Kurva Naik–Tahan–Turun',
      lang: 'javascript',
      output: false,
      code: `import http from 'k6/http';

export const options = {
  stages: [
    { target: 5,  duration: '1m' },  // ramp-up:  0 -> 5 VU
    { target: 20, duration: '3m' },  // naik lagi: 5 -> 20 VU, lalu tahan
    { target: 0,  duration: '1m' },  // ramp-down: 20 -> 0 VU
  ],
};

export default function () {
  http.get('https://api.example.com/products');
}`,
      explain: [
        'Tahap pertama menaikkan VU dari 0 ke 5 selama satu menit — masa pemanasan (warm-up) supaya cache, koneksi, dan JIT sempat stabil sebelum diukur sungguhan.',
        'Tahap kedua menaikkan ke 20 VU selama tiga menit; pada detik terakhir tahap ini sistem berada di beban puncak — itulah bagian yang paling sering kamu analisis.',
        'Tahap ketiga menurunkan ke 0 selama satu menit, sehingga VU dilepas perlahan dan request yang sedang berjalan tetap sempat selesai.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Mengapa Ramp-Down Penting (gracefulRampDown)</h3><p>Ketika VU berhenti mendadak, k6 memutus iterasi yang sedang berjalan. Ini bisa membuat angka <code>http_req_failed</code> melonjak palsu dan respons yang sebenarnya sukses ikut terpotong. Untuk menghindarinya, setiap tahap boleh diberi <b>gracefulRampDown</b> — waktu jeda tambahan agar VU yang dilepas menyelesaikan iterasinya terlebih dahulu sebelum benar-benar dimatikan.</p><p>Bentuknya sederhana: <code>{ target: 0, duration: \'1m\', gracefulRampDown: \'30s\' }</code> berarti k6 memberi tiap VU sampai 30 detik ekstra untuk merampungkan iterasi yang sedang berjalan sebelum menariknya keluar dari permainan. Tanpa ini, angka error di fase penurunan bisa menyesatkan.</p><p>Praktik yang lazim: beri <code>gracefulRampDown</code> minimal selama <i>think time</i> terpanjangmu, atau sedikitnya 10–30 detik untuk API pada umumnya. Nilai ini tidak mengubah jumlah VU target, hanya memperlambat pemadaman agar tidak merusak hasil pengukuran.</p>'
    },
    {
      type: 'text',
      html: '<h3>Objek scenarios: Banyak Kurva dalam Satu Run</h3><p><b>scenarios</b> memungkinkanmu menjalankan beberapa bentuk beban berdampingan dalam satu perintah <code>k6 run</code>. Setiap entri adalah sebuah skenario dengan propertinya sendiri:</p><ul><li><b>executor</b> — mesin penggeraknya (lihat tabel di bawah).</li><li><b>exec</b> — nama fungsi yang akan dijalankan skenario ini; inilah cara membedakan alur tiap skenario.</li><li><b>startTime</b> — kapan skenario mulai, dihitung dari detik pertama run (berguna untuk menumpuk beban berurutan).</li><li><b>vus</b>, <b>duration</b>, atau <b>stages</b> — besaran beban, tergantung executor yang dipakai.</li><li><b>gracefulStop</b> — waktu tunggu ekstra setelah durasi skenario habis agar iterasi yang berjalan selesai.</li><li><b>env</b> dan <b>tags</b> — variabel lingkungan serta label khusus skenario ini saja.</li></ul><p>Dua aturan yang sering bikin bingung: (1) bila kamu mendefinisikan <code>scenarios</code>, sebaiknya jangan menaruh <code>vus</code>/<code>duration</code> di level atas — pilih salah satu gaya; dan (2) karena tiap skenario punya fungsi sendiri lewat <code>exec</code>, kamu bisa membuat satu skenario menguji katalog dan skenario lain menguji checkout pada saat bersamaan.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Dua Skenario Berdampingan',
      lang: 'javascript',
      output: false,
      code: `import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    // 1. Arrival rate: menjaga 30 iterasi/menit terus-menerus
    api_tetap: {
      executor: 'constant-arrival-rate',
      exec: 'apiProducts',
      startRate: 30,
      timeUnit: '1m',
      duration: '5m',
      preAllocatedVUs: 10,
      maxVUs: 50,
    },
    // 2. Ramping VU: mulai setelah menit pertama, naik ke 25 VU
    beban_meningkat: {
      executor: 'ramping-vus',
      exec: 'alurCheckout',
      stages: [
        { target: 10, duration: '2m' },
        { target: 25, duration: '3m' },
        { target: 0,  duration: '1m', gracefulRampDown: '30s' },
      ],
      startTime: '1m',
      env: { KANAL: 'gopay' },
      tags: { tim: 'payments' },
    },
  },
};

export function apiProducts() {
  const res = http.get('https://api.example.com/products', {
    tags: { name: 'GetProducts' },
  });
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}

export function alurCheckout() {
  const payload = JSON.stringify({ sku: 'KOPI-01', channel: __ENV.KANAL });
  const res = http.post('https://api.example.com/orders', payload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'CreateOrder' },
  });
  check(res, { 'pesanan dibuat': (r) => r.status === 201 });
  sleep(2);
}`,
      explain: [
        'Skenario <code>api_tetap</code> memakai <b>arrival rate</b>: k6 menjamin 30 iterasi per menit berapa pun lamanya respons, sehingga hasilnya murni menggambarkan tekanan trafik, bukan kecepatan VU.',
        'Skenario <code>beban_meningkat</code> memakai <b>ramping-vus</b> dan baru mulai setelah satu menit (startTime: \'1m\'), sehingga dua kurva beban saling tumpang tindih secara terkendali.',
        '<code>exec</code> menunjuk fungsi berbeda untuk tiap skenario — satu mengetes katalog ringan, satu lagi mengetes alur checkout yang berat.',
        '<code>env</code> dan <code>tags</code> diberlakukan hanya untuk skenario ini; nilai <code>KANAL</code> dibaca lewat <code>__ENV.KANAL</code> di dalam kode.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Tabel Executor: Mesin Penggerak Tiap Skenario</h3><p>Setiap skenario dijalankan oleh satu <b>executor</b>. Pilihan executor menentukan logika "siapa yang mengatur": kamu yang menentukan jumlah VU, atau kamu yang menentukan kecepatan kedatangan permintaan.</p><table><thead><tr><th>Executor</th><th>Prinsip kerja</th><th>Properti kunci</th></tr></thead><tbody><tr><td><code>constant-vus</code></td><td>Sejumlah VU terus-menerus menjalankan iterasi selama durasi</td><td><code>vus</code>, <code>duration</code></td></tr><tr><td><code>ramping-vus</code></td><td>Jumlah VU berubah mengikuti kurva stages</td><td><code>stages</code> (target, duration, gracefulRampDown)</td></tr><tr><td><code>constant-arrival-rate</code></td><td>k6 menjamin jumlah iterasi mulai per unit waktu, berapa pun lamanya respons</td><td><code>startRate</code>, <code>timeUnit</code>, <code>duration</code>, <code>preAllocatedVUs</code>, <code>maxVUs</code></td></tr><tr><td><code>ramping-arrival-rate</code></td><td>Seperti di atas, tetapi laju kedatangan berubah mengikuti stages</td><td><code>stages</code> (target rate), <code>timeUnit</code>, <code>preAllocatedVUs</code>, <code>maxVUs</code></td></tr><tr><td><code>shared-iterations</code></td><td>Jumlah iterasi total dibagi rata ke sejumlah VU, selesai ketika semua iterasi habis</td><td><code>vus</code>, <code>iterations</code>, <code>maxDuration</code></td></tr></tbody></table>'
    },
    {
      type: 'example',
      title: 'Contoh: Potongan Konfigurasi Tiap Executor',
      lang: 'javascript',
      output: false,
      code: `// 1. constant-vus: 20 VU stabil selama 10 menit
{ executor: 'constant-vus', vus: 20, duration: '10m' }

// 2. ramping-vus: kurva naik-tahan-turun
{ executor: 'ramping-vus', stages: [
    { target: 20, duration: '5m' },
    { target: 20, duration: '10m' },
    { target: 0,  duration: '2m', gracefulRampDown: '30s' },
] }

// 3. constant-arrival-rate: jamin 30 iterasi per menit
{ executor: 'constant-arrival-rate', startRate: 30, timeUnit: '1m',
  duration: '15m', preAllocatedVUs: 15, maxVUs: 80 }

// 4. ramping-arrival-rate: laju datang naik bertahap
{ executor: 'ramping-arrival-rate', timeUnit: '1m', startRate: 10,
  stages: [{ target: 100, duration: '10m' }],
  preAllocatedVUs: 20, maxVUs: 150 }

// 5. shared-iterations: 100 iterasi dibagi ke 5 VU
{ executor: 'shared-iterations', vus: 5, iterations: 100,
  maxDuration: '3m' }`,
      explain: [
        'Kelima potongan ini bisa langsung diletakkan sebagai nilai satu entri di dalam <code>options.scenarios</code>, lengkap dengan <code>exec</code> yang menunjuk fungsi target.',
        'Perhatikan dua executor arrival-rate yang wajib menyertakan <code>preAllocatedVUs</code> dan <code>maxVUs</code>, sedangkan executor berbasis VU cukup menyebut <code>vus</code> dan <code>duration</code>/<code>stages</code>.',
        '<code>shared-iterations</code> berbeda dari yang lain: ia berhenti secara alami begitu seluruh <code>iterations</code> selesai, sehingga <code>maxDuration</code> berfungsi sebagai pagar pengaman, bukan durasi utama.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Kurva Beban: Melihat Bentuk Secara Utuh</h3><p>Berikut ilustrasi kurva yang dihasilkan konfigurasi stages pada contoh pertama — perhatikan bagaimana tiga tahap membentuk gunung kecil: naik perlahan, bertahan di puncak, lalu turun tanpa membentur tembok.</p><figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 280" width="760" role="img" aria-label="Kurva beban naik ke 20 VU lalu turun kembali ke nol"><rect x="60" y="30" width="660" height="180" rx="8" class="u-box" fill="none"/><line x1="60" y1="210" x2="720" y2="210" class="u-line"/><line x1="60" y1="30" x2="60" y2="210" class="u-line"/><polyline points="60,210 180,90 480,90 660,210 720,210" fill="none" class="u-line" stroke-width="3"/><line x1="180" y1="90" x2="180" y2="210" class="u-dash"/><line x1="480" y1="90" x2="480" y2="210" class="u-dash"/><text x="120" y="70" class="u-lbl" text-anchor="middle">ramp-up</text><text x="330" y="70" class="u-lbl" text-anchor="middle">hold (puncak 20 VU)</text><text x="580" y="70" class="u-lbl" text-anchor="middle">ramp-down</text><text x="40" y="214" class="u-lbl" text-anchor="end">0</text><text x="40" y="94" class="u-lbl" text-anchor="end">20</text><text x="40" y="34" class="u-lbl" text-anchor="end">VU</text><text x="120" y="232" class="u-lbl" text-anchor="middle">0m</text><text x="330" y="232" class="u-lbl" text-anchor="middle">1m</text><text x="570" y="232" class="u-lbl" text-anchor="middle">4m</text><text x="660" y="232" class="u-lbl" text-anchor="middle">5m</text><text x="390" y="262" class="u-lbl" text-anchor="middle">Tahap naik menguji perlahan · tahap tahan menguji stamina · tahap turun menjaga data tetap bersih</text></svg></div><figcaption class="fig-cap"><b>Gambar 7.1</b> — Kurva stages ramp-up, hold, dan ramp-down: bentuk paling umum untuk load test yang realistis</figcaption></figure>'
    },
    {
      type: 'tip',
      title: 'Beri Nama Skenario dengan Kebab-case',
      text: 'Gunakan nama skenario huruf kecil bersambung tanda hubung, misalnya <code>api-tetap</code>, <code>beban-checkout</code>, atau <code>spike-flash-sale</code>. Nama ini tampil di ringkasan, di metrik bertag <code>scenario:</code>, dan di dashboard Grafana kamu. Nama yang jelas membuat siapa pun bisa mengenali kurva mana yang sedang dilihatnya tanpa membuka ulang file konfigurasi.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Executor berbasis <b>arrival rate</b> (constant-arrival-rate, ramping-arrival-rate) membutuhkan <code>preAllocatedVUs</code> dan <code>maxVUs</code> yang memadai. Bila respons server melambat, iterasi menumpuk dan k6 kehabisan VU — muncul error <b>"Insufficient VUs"</b> dan tes berhenti sebelum waktunya. Selalu siapkan maxVUs lebih besar daripada yang kamu kira perlu, dan pastikan mesin yang menjalankan k6 sendiri cukup kuat (cek dokumentasi resmi untuk panduan alokasi VU sesuai versi yang kamu pakai).'
    },
    {
      type: 'vocab',
      items: [
        ['Scenario', 'Satu bentuk beban yang dijalankan berdampingan dalam satu run; didefinisikan di objek options.scenarios.'],
        ['Executor', 'Mesin penggerak skenario yang menentukan logika beban, misalnya constant-vus atau constant-arrival-rate.'],
        ['Stage', 'Satu tahap dalam kurva beban, berisi target jumlah (VU atau rate) dan durasi untuk mencapainya.'],
        ['Ramp-up', 'Tahap menaikkan beban secara bertahap dari nol ke target tertentu.'],
        ['Ramp-down', 'Tahap menurunkan beban kembali ke nol; penting agar data penutupan tidak tercampur error palsu.'],
        ['gracefulRampDown', 'Waktu ekstra per tahap agar VU yang dilepas menyelesaikan iterasi yang sedang berjalan sebelum dimatikan.'],
        ['preAllocatedVUs', 'Jumlah VU yang disiapkan k6 lebih awal untuk skenario arrival-rate agar tidak ada jeda alokasi.'],
        ['maxVUs', 'Batas atas jumlah VU yang boleh dialokasikan skenario arrival-rate; kehabisan VU memicu "Insufficient VUs".']
      ]
    }
  ],
  recap: [
    'Konfigurasi vus+duration menghasilkan beban kotak (langsung penuh, langsung berhenti); stages memungkinkan kurva naik, tahan, dan turun yang lebih realistis.',
    'Setiap tahap stages berisi target dan duration; tambahkan gracefulRampDown agar VU yang dilepas sempat menyelesaikan iterasinya dan tidak memunculkan error palsu.',
    'Objek scenarios menjalankan beberapa kurva berdampingan; tiap skenario punya executor, exec (fungsi sendiri), startTime, gracefulStop, env, dan tags.',
    'Executor terbagi dua keluarga: berbasis VU (constant-vus, ramping-vus, shared-iterations) dan berbasis laju kedatangan (constant-arrival-rate, ramping-arrival-rate).',
    'Executor arrival-rate wajib punya preAllocatedVUs dan maxVUs yang cukup agar tes tidak berhenti dengan "Insufficient VUs".'
  ]
});
