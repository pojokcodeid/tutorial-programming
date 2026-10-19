/* ============================================================
   Pelajaran Grafana k6 — Bab 12: Struktur Test Suite & Manajemen Secret
   ============================================================ */
'use strict';

window.K6_LESSONS = window.K6_LESSONS || [];

window.K6_LESSONS.push({
  id: 'struktur-suite-secret',
  title: 'Struktur Test Suite & Manajemen Secret',
  chapter: 'Data & Lifecycle',
  duration: '8–10 menit',
  intro: [
    'Bayangkan seorang koki dengan satu meja kerja: bahan ditumpuk bersamaan dengan alat, resep ditulis di punggung tisu bekas, dan garam diletakkan di dua tempat berbeda. Sekali saja ada tamu, kekacauan itu terasa. Sebuah <b>test suite</b> k6 yang berantakan bekerja persis begitu — skrip menumpuk, konfigurasi tertanam, dan rahasia tersebar di mana-mana.',
    'Ketika tes baru berisi satu file memang semua terlihat sederhana. Masalah muncul saat kamu punya smoke test untuk CI, load test untuk mingguan, stress test untuk bulanan, konfigurasi staging dan produksi, plus seperangkat data uji. Tanpa struktur, orang lain (termasuk dirimu sendiri) tidak akan tahu skrip mana yang harus dijalankan, dengan environment apa, dan bagaimana membaca hasilnya.',
    'Bab ini menyusun semuanya dari nol: susunan folder yang disarankan, konfigurasi per lingkungan lewat file JSON dan environment variable, pemisahan jenis tes ke dalam file skenario, konvensi penamaan yang rapi, cara menangani <b>secret</b> dengan aman, sampai kebiasaan menjalankan tes di lokal maupun CI.'
  ],
  objectives: [
    'Menyusun struktur folder test suite yang rapi dan mudah dipakai bersama',
    'Memisahkan konfigurasi per lingkungan dan memprioritaskan environment variable',
    'Memisahkan jenis tes ke dalam satu skenario per file dengan opsi masing-masing',
    'Mengelola secret lewat environment variable serta menjaga berkas hasil tetap aman'
  ],
  sections: [
    {
      type: 'example',
      title: 'Contoh: Susunan Folder Test Suite',
      lang: 'text',
      output: false,
      code: `k6-test-suite/
├── README.md          # tujuan, cara menjalankan, kebutuhan env, interpretasi hasil
├── .gitignore         # abaikan results/ dan berkas rahasia
├── config/
│   ├── dev.json       # baseUrl lokal, vus kecil, duration pendek
│   └── staging.json   # baseUrl staging, beban lebih realistis
├── data/
│   ├── users.json     # data dummy untuk SharedArray
│   └── orders.csv     # baris data untuk dibaca open()
├── lib/
│   ├── auth.js        # fungsi login, bangun header Authorization
│   └── helpers.js     # bangunUrl(), buatReferensiUnik(), parser CSV
├── scenarios/
│   ├── smoke.js       # tes kilat: 1-2 VU, beberapa detik
│   ├── load.js        # beban normal harian
│   ├── stress.js      # beban di luar batas, cari titik patah
│   └── soak.js        # beban panjang, cari kebocoran memori
└── results/           # artefak JSON/HTML, TIDAK di-commit
    └── .gitkeep`,
      explain: [
        'Aturan utamanya sederhana: <b>satu file = satu jenis tes</b>, sementara konfigurasi, data, dan fungsi bersama dipisah ke folder sendiri sehingga tidak pernah tersalin-tempel.',
        'Folder <code>lib/</code> berisi kode yang dipakai ulang — cara login biasanya ditulis sekali lalu diimpor semua skenario lewat <code>import { login } from "../lib/auth.js";</code>.',
        'Folder <code>results/</code> sengaja dipisah dan masuk <code>.gitignore</code>: di sanalah k6 menulis berkas hasil yang bisa berisi data sensitif.',
        'Struktur ini bukan aturan baku dari Grafana, melainkan pola yang paling sering terbukti nyaman — sesuaikan namanya dengan kebiasaan timmu.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Konfigurasi per Lingkungan</h3><p>URL lokal, staging, dan produksi jangan pernah ditulis mati di dalam skrip. Simpan konfigurasi dasar di file JSON per lingkungan — misalnya <code>config/dev.json</code> yang berisi <code>baseUrl</code>, <code>vus</code>, dan <code>duration</code> — lalu muat sekali di <b>init context</b> dengan <code>open()</code> dan <code>JSON.parse()</code>.</p><p>Yang membuat pola ini kuat adalah <b>urutan prioritas</b>: environment variable (<code>__ENV</code>) selalu menang, lalu file konfigurasi, lalu nilai bawaan dalam skrip. Dengan begitu file JSON menjadi "isi awal yang aman", sedangkan perubahan cepat cukup disuntikkan dari terminal tanpa menyentuh kode:</p><ul><li><code>k6 run -e VUS=50 scenarios/load.js</code> — menaikkan VU sekali jalan.</li><li><code>BASE_URL=https://staging.example.com k6 run scenarios/load.js</code> — memindahkan tujuan pengukuran.</li><li>Tanpa environment variable apa pun, tes tetap berjalan memakai isi <code>config/dev.json</code>.</li></ul><p>Praktik yang baik: semua file konfigurasi memakai <b>kunci yang sama persis</b> (<code>baseUrl</code>, <code>vus</code>, <code>duration</code>, dan seterusnya), sehingga skrip tidak perlu bertanya "apakah key ini ada di config yang ini?".</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Memuat Konfigurasi dengan Prioritas Environment Variable',
      lang: 'javascript',
      output: false,
      code: `import http from 'k6/http';
import { check } from 'k6';

// config/dev.json berisi:
// { "baseUrl": "http://localhost:8080", "vus": 5, "duration": "30s" }
const config = JSON.parse(open('./config/dev.json'));

// Prioritas: environment variable > file konfigurasi > nilai bawaan
const BASE_URL = __ENV.BASE_URL || config.baseUrl;
const VUS = parseInt(__ENV.VUS || config.vus, 10);
const DURATION = __ENV.DURATION || config.duration;

export const options = {
  vus: VUS,
  duration: DURATION,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
  tags: { lingkungan: __ENV.LINGKUNGAN || 'dev' },
};

export default function () {
  const res = http.get(BASE_URL + '/products?limit=5', {
    tags: { name: 'GET_products' },
    timeout: 4000,
  });

  check(res, {
    'produk tersedia 200': (r) => r.status === 200,
    'daftar tidak kosong': (r) => Array.isArray(r.json().items) && r.json().items.length > 0,
    'bukan halaman error server': (r) => r.headers['Content-Type'] === undefined || r.headers['Content-Type'].indexOf('application/json') !== -1,
  });
}`,
      explain: [
        'Konfigurasi dibaca tepat sekali di init context — sama seperti pola <code>open()</code> pada bab sebelumnya — lalu nilainya dipakai di opsi dan fungsi bawaan.',
        'Pola <code>__ENV.X || config.x</code> adalah inti seluruh bab ini: aman untuk pemula (selalu ada isi), tetapi tetap fleksibel untuk CI yang menyuntikkan nilai dari luar.',
        'Tag <code>lingkungan</code> pada seluruh metrik membuat hasil run dev dan staging tidak lagi tertukar ketika dibandingkan di Grafana.',
        'Threshold sengaja didefinisikan di sini juga: definisi "lulus" sebuah tes sebaiknya ikut tersimpan bersama skripnya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Memisahkan Jenis Tes</h3><p>Smoke test, load test, stress test, dan soak test bukanlah "setting berbeda dari skrip yang sama" — masing-masing punya pertanyaan berbeda. Karena itu tulis <b>satu skenario per file</b> di folder <code>scenarios/</code>, masing-masing dengan <code>options</code>-nya sendiri, sementara <code>lib/</code> dan <code>data/</code> dipakai bersama. Setiap file bisa dijalankan sendiri-sendiri tanpa memengaruhi yang lain: <code>k6 run scenarios/load.js</code>.</p><h3>Konvensi Penamaan</h3><p>Nama yang konsisten adalah dokumentasi gratis. Tim yang sehat memakai satu gaya saja:</p><table><thead><tr><th>Hal</th><th>Konvensi</th><th>Contoh</th></tr></thead><tbody><tr><td>File skenario</td><td>kebab-case, selaras dengan jenis tes</td><td><code>smoke.js</code>, <code>stress.js</code></td></tr><tr><td>ID skenario</td><td>kebab-case</td><td><code>per-vu-iterations</code></td></tr><tr><td>Nama metrik kustom</td><td>snake_case</td><td><code>order_created</code>, <code>checkout_total</code></td></tr><tr><td>Nama check</td><td>kalimat deskriptif berbahasa manusia</td><td><code>"order dibuat 201"</code>, <code>"total belanja sesuai"</code></td></tr><tr><td>Nilai tag</td><td>pola tetap, hindari nilai unik per iterasi</td><td><code>GET_products</code></td></tr></tbody></table><p>Nama check sangat layak diperhatikan: ia adalah satu-satunya bagian laporan k6 yang dibaca manusia langsung. Tulis seolah-olah sedang menjelaskan kegagalan kepada rekan seperjuangan — <code>"status pembayaran pending"</code> jauh lebih berguna daripada <code>"ok"</code>.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Menjalankan Skenario dan Menyuntikkan Secret',
      lang: 'bash',
      output: false,
      code: `# Dari root test suite, jalankan masing-masing jenis tes
k6 run scenarios/smoke.js
k6 run scenarios/load.js
k6 run scenarios/stress.js
k6 run scenarios/soak.js

# Ganti lingkungan dan ukuran beban tanpa menyentuh kode
k6 run -e BASE_URL=https://staging.example.com -e VUS=50 -e DURATION=2m scenarios/load.js

# Secret diambil dari environment, bukan dari file
export API_TOKEN="ganti_dengan_token_hasil_rotasi"
k6 run -e API_TOKEN=$API_TOKEN scenarios/load.js

# Simpan hasil bertanda waktu agar mudah dibandingkan antar run
mkdir -p results
k6 run --out json=results/load-2026-10-18.json scenarios/load.js

# Ringkasan HTML untuk dibuka di browser
k6 run --summary-export=results/load-summary.json scenarios/load.js`,
      explain: [
        'Setiap jenis tes berdiri sendiri: mengubah durasi <code>stress.js</code> tidak akan pernah berdampak pada <code>smoke.js</code> yang jalan di CI tiap commit.',
        'Flag <code>-e NAMA=nilai</code> adalah cara paling umum menyuntikkan konfigurasi dan secret sekali jalan dari terminal.',
        'Penamaan hasil berisi tanggal membuat perbandingan "beban bulan ini vs bulan lalu" menjadi urusan menemukan file, bukan mengingat-ingat.',
        'Perintah di atas sama persis dengan yang akan dipakai di CI nanti — hanya sumber environment variable-nya yang berbeda. Persis seperti itulah pratinjau bab otomasi.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Manajemen Secret</h3><p>Aturan pertama dan terakhir: <b>secret tidak pernah masuk ke repository</b>. Tidak di skrip, tidak di file konfigurasi, tidak di comment. Tiga jalur yang lazim dipakai:</p><ul><li><b>Environment variable dari terminal</b> — paling sederhana: <code>k6 run -e API_TOKEN=$API_TOKEN skrip.js</code>, dengan nilainya diekspor lebih dulu dari shell-mu.</li><li><b>Secret store milik CI</b> — di pipeline GitLab, GitHub Actions, atau Jenkins, nilai diisi lewat mekanisme secret bawaan lalu dipasang sebagai environment variable bagi job yang menjalankan k6. Skripnya tetap sama, tidak ada perubahan kode sama sekali.</li><li><b>Secret manager</b> — bila timmu sudah memakai layanan semacam Vault atau layanan rahasia milik cloud-mu, ambil nilai saat runtime lalu isikan ke <code>__ENV</code>.</li></ul><p>Pendampingnya adalah disiplin berkas: masukkan <code>results/</code> ke <code>.gitignore</code>, periksa sekali apakah file konfigurasi yang akan di-commit benar-benar bebas token, dan gunakan akun uji ber-izin minimal agar bocor pun dampaknya terbatas.</p><h3>Lokal sebagai Pratinjau, CI sebagai Jalur Resmi</h3><p>Kebiasaan yang baik: jalankan dulu di lokal untuk memastikan skrip sehat, biarkan CI yang menjalankan dan membandingkan hasil secara berkala. Prinsipnya sama persis — perintah identik, yang berbeda hanya lingkungan tempat ia dieksekusi. Bab otomasi di depan akan membawa pola ini ke dalam pipeline.</p><h3>Isi README Test Suite</h3><p>Tanpa README, test suite adalah teka-teka. Empat hal wajib yang layak ditulis:</p><ol><li><b>Tujuan</b> — tes ini menjawab pertanyaan apa, dan apa yang bukan wewenangnya.</li><li><b>Cara menjalankan</b> — perintah persis untuk tiap skenario, plus prasyarat seperti versi k6.</li><li><b>Kebutuhan environment</b> — daftar <code>__ENV</code> yang dibaca beserta kegunaannya.</li><li><b>Interpretasi hasil</b> — ambang batas yang dianggap lulus dan langkah berikutnya bila gagal.</li></ol>'
    },
    {
      type: 'tip',
      title: 'Tips: Beri Nama Hasil yang Bercerita',
      text: 'Berkas hasil di <code>results/</code> sebaiknya mengandung <b>nama skenario dan waktu</b>, misalnya <code>load-2026-10-18-1430.json</code>. Dua run berbeda jenis tes dengan nama filnya sama adalah sumber kebingungan klasik: minggu depan kamu tidak akan yakin apakah peningkatan latensi berasal dari load test atau stress test yang tersimpan di tempatnya.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'File hasil tes — baik JSON maupun HTML report — <b>bisa memuat token, header Authorization, dan data pengguna</b> yang ikut terkirim selama berlangsungnya tes. Sebelum hasil dibagikan ke kanal publik atau lampiran tiket, bersihkan dulu atau cukup lampirkan ringkasan angkanya saja. Pastikan <code>results/</code> masuk <code>.gitignore</code>, dan ingat bahwa satu laporan yang "sekadar untuk ditunjukkan" pernah menjadi penyebab kebocoran di banyak proyek nyata.'
    },
    {
      type: 'vocab',
      items: [
        ['Test suite', 'Kumpulan skrip tes, konfigurasi, data, dan dokumentasi yang dijalankan bersama untuk menguji satu sistem.'],
        ['Scenario', 'Satu jenis tes dengan opsi eksekusinya sendiri, disimpan satu file di folder scenarios/.'],
        ['Environment variable', 'Nilai yang disuntikkan dari luar skrip lewat -e atau env CI; sumber prioritas tertinggi konfigurasi.'],
        ['Secret manager', 'Layanan penyimpan rahasia (misalnya Vault) yang nilainya diambil saat runtime, bukan dari repository.'],
        ['CI/CD', 'Pipeline otomatis yang menjalankan tes dan deploy; tempat secret disediakan oleh secret store milik pipeline.'],
        ['kebab-case', 'Gaya penamaan berpisah tanda hubung, dipakai untuk file skenario dan id skenario.'],
        ['snake_case', 'Gaya penamaan berpisah garis bawah, dipakai untuk nama metrik kustom.'],
        ['.gitignore', 'Berkas daftar yang menandai file atau folder apa yang tidak boleh ikut ter-commit ke repository.']
      ]
    }
  ],
  recap: [
    'Struktur yang disarankan memisahkan config/, data/, lib/, scenarios/, dan results/ dengan README.md serta .gitignore di akar — satu file untuk satu jenis tes.',
    'Konfigurasi per lingkungan disimpan di JSON lalu dimuat dengan open() di init context, dengan prioritas environment variable > file konfigurasi > nilai bawaan.',
    'Jenis tes dipisah menjadi skenario terpisah (smoke, load, stress, soak) yang dijalankan sendiri-sendiri lewat k6 run scenarios/nama.js.',
    'Konvensi penamaan — kebab-case untuk file dan id, snake_case untuk metrik, nama check berbahasa manusia — membuat laporan langsung terbaca.',
    'Secret hanya lewat environment variable, secret store CI, atau secret manager; dan berkas hasil yang berisi data sensitif wajib dibersihkan serta dijauhkan dari repository.'
  ]
});
