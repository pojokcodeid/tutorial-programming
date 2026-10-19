/* ============================================================
   Pelajaran Grafana k6 — Bab 3: Struktur Script, Lifecycle & Scope
   ============================================================ */
'use strict';

window.K6_LESSONS = window.K6_LESSONS || [];

window.K6_LESSONS.push({
  id: 'struktur-script-lifecycle',
  title: 'Struktur Script, Lifecycle & Scope',
  chapter: 'Menulis Script',
  duration: '8–10 menit',
  intro: [
    'Bayangkan sebuah pabrik kue: ada pekerjaan <b>sekali</b> saat pintu dibuka (menyalakan oven, menyiapkan bahan), ada yang diulang-ulang sepanjang hari (memanggang adonan), dan ada yang <b>sekali lagi</b> saat tutup (membersihkan meja). Salah menaruh satu langkah saja hasilnya kacau.',
    'Skrip k6 punya anatomi sama. Kode di luar fungsi disebut <b>init context</b> dan hanya menyiapkan sesuatu; <code>setup()</code> dan <code>teardown()</code> masing-masing berjalan sekali; <code>default function</code> diulang setiap virtual user. Pembagian ini kunci agar skrip tidak hanya berjalan, tetapi juga benar.',
    'Bab ini membedah anatomi skrip, keempat fase <b>lifecycle</b> beserta gambar alurnya, tabel "boleh-tidak boleh" per konteks eksekusi, serta scope variabel — termasuk konfigurasi <code>__ENV</code> dan kenapa runtime k6 bukan Node.js.'
  ],
  objectives: [
    'Menyusun anatomi skrip k6: import modul, options, dan export default function',
    'Membedakan empat fase lifecycle dan kapan tiap fase dieksekusi',
    'Menentukan aksi mana yang boleh di init, setup, VU context, dan teardown',
    'Mengelola scope variabel dan konfigurasi aman lewat __ENV serta flag -e'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Anatomi Sebuah Skrip k6</h3><ul><li><b>Impor modul</b> — <code>import http from \'k6/http\'</code> untuk request, <code>import { check, sleep } from \'k6\'</code> untuk utilitas inti, <code>import { Counter, Trend } from \'k6/metrics\'</code> untuk metrik buatan, dan <code>import { SharedArray } from \'k6/data\'</code> untuk data bersama.</li><li><b>Blok options</b> — <code>export const options = { ... }</code> berisi beban (vus, duration, scenarios) dan threshold; dibaca k6 <b>sebelum</b> skrip dieksekusi.</li><li><b>Default function</b> — <code>export default function () { ... }</code>; tubuh iterasi yang diulang tiap VU.</li><li><b>Opsional: <code>setup()</code> dan <code>teardown()</code></b> — masing-masing berjalan sekali per run, untuk menyiapkan data di awal dan membersihkan di akhir.</li><li><b>Kode di luar fungsi mana pun</b> — inilah <b>init context</b>: tempat konstanta, definisi metrik, dan pembacaan data bersama.</li></ul><p>Urutan lazim: impor, konstanta/init, options, baru fungsi-fungsi. Namun k6 membaca <code>options</code> dari ekspor, bukan dari urutan baris — penataan ini soal keterbacaan.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Skeleton Skrip yang Lengkap',
      lang: 'javascript',
      output: false,
      code: `import http from 'k6/http';
import { check, sleep } from 'k6';

// --- init context: dieksekusi saat skrip dimuat ---
const BASE_URL = __ENV.BASE_URL || 'https://test.k6.io';

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    checks: ['rate>0.99'],
  },
};

// --- sekali sebelum beban dimulai ---
export function setup() {
  const res = http.get(BASE_URL + '/api/health');
  return { startedAt: Date.now(), healthy: res.status === 200 };
}

// --- diulang oleh tiap VU, tiap iterasi ---
export default function (data) {
  const res = http.get(BASE_URL + '/');
  check(res, { 'status adalah 200': (r) => r.status === 200 });
  sleep(1);
}

// --- sekali setelah beban selesai ---
export function teardown(data) {
  console.log('Tes berjalan ' + (Date.now() - data.startedAt) + ' ms');
}`,
      explain: [
        'Tiga ekspor inilah kerangka k6: <code>options</code> (bacaan konfigurasi), <code>default function</code> (inti iterasi), serta pasangan opsional <code>setup</code> dan <code>teardown</code> yang masing-masing berjalan sekali.',
        'Kode di atas impor dan di luar fungsi adalah <b>init context</b>: hanya menyiapkan sesuatu — tidak ada request dan tidak ada sleep yang boleh masuk.',
        'Nilai yang dikembalikan <code>setup()</code> diteruskan sebagai argumen <code>data</code> ke <code>default function</code> dan <code>teardown()</code> — jalur resmi membawa data dari awal ke akhir tes; <code>sleep(1)</code> meniru jeda manusia.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Empat Fase Lifecycle</h3><p>Satu perintah <code>k6 run</code> menempuh urutan yang selalu sama:</p><ul><li><b>Init context</b> — kode di luar fungsi dieksekusi saat skrip dimuat, sekali per VU; tempat impor, konstanta, definisi metrik, dan <code>SharedArray</code>. Tanpa jaringan, tanpa sleep.</li><li><b>setup()</b> — <b>sekali saja</b> sebelum virtual user bekerja; umumnya mengambil token atau menyiapkan data uji.</li><li><b>VU context / default function</b> — bagian berulang: tiap VU menjalankannya berkali-kali selama durasi, masing-masing dengan state sendiri.</li><li><b>teardown()</b> — sekali setelah beban selesai; tempat membersihkan data uji atau mencatat hasil.</li></ul><figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 240" width="760" role="img" aria-label="Alur empat fase lifecycle k6: init context, setup, VU context yang berulang, lalu teardown"><rect x="20" y="60" width="155" height="90" rx="10" class="u-box"/><text x="97" y="96" class="u-title" text-anchor="middle">Init context</text><text x="97" y="122" class="u-lbl" text-anchor="middle">saat skrip dimuat</text><line x1="175" y1="105" x2="212" y2="105" class="u-line" marker-end="url(#u-arrow)"/><rect x="215" y="60" width="140" height="90" rx="10" class="u-hd"/><text x="285" y="96" class="u-title" text-anchor="middle">setup()</text><text x="285" y="122" class="u-lbl" text-anchor="middle">sekali per run</text><line x1="355" y1="105" x2="392" y2="105" class="u-line" marker-end="url(#u-arrow)"/><rect x="395" y="45" width="190" height="120" rx="10" class="u-box"/><text x="490" y="76" class="u-title" text-anchor="middle">VU context</text><text x="490" y="102" class="u-lbl" text-anchor="middle">default function</text><text x="490" y="126" class="u-lbl" text-anchor="middle">tiap iterasi tiap VU</text><line x1="585" y1="105" x2="622" y2="105" class="u-line" marker-end="url(#u-arrow)"/><rect x="625" y="60" width="115" height="90" rx="10" class="u-hd"/><text x="682" y="96" class="u-title" text-anchor="middle">teardown()</text><text x="682" y="122" class="u-lbl" text-anchor="middle">sekali di akhir</text><line x1="560" y1="196" x2="430" y2="196" class="u-dash" marker-end="url(#u-arrow)"/><text x="495" y="218" class="u-lbl" text-anchor="middle">iterasi berikutnya</text></svg></div><figcaption class="fig-cap"><b>Gambar 3.1</b> — Init sekali, setup sekali, default function berulang per VU, lalu teardown sekali di akhir</figcaption></figure>'
    },
    {
      type: 'example',
      title: 'Contoh: Tabel Boleh / Tidak Boleh per Konteks',
      lang: 'text',
      output: false,
      code: `AKSI                                   init    setup   VU/default   teardown
-------------------------------------  ------  ------  -----------  --------
import modul & deklarasi options          vi      -         -           -
http.get(...) / request jaringan          x       v         v           v
sleep()                                   x       v         v           v
definisi metrik baru (new Counter)        v       x         x           x
SharedArray(...)                          v       x         x           x
open('./data.csv')                        v       x         x           x
membaca __ENV                            v       v         v           v
console.log(...)                          v       v         v           v
kapan dieksekusi                     sekali   sekali   tiap iterasi  sekali

v = boleh   x = tidak boleh   - = hanya ditulis di tempat itu`,
      explain: [
        'Aturan emasnya dua: <b>tidak ada request maupun sleep di init context</b>, dan <b>definisi metrik serta SharedArray harus berada di init</b> — bukan di dalam fungsi.',
        '<code>open()</code> hanya boleh di init karena membaca berkas dari disk; untuk data besar, bungkus dengan <code>SharedArray</code> agar dibaca sekali lalu dibagi hemat ke semua VU.',
        'Setup dan teardown berjalan sekali per run — tempat token sekali pakai dan pembersihan. Galat <i>using http in init context</i> menunjuk langsung ke pelanggaran baris pertama; hal yang berubah antarversi: <b>cek dokumentasi resmi untuk versi yang kamu pakai</b>.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Scope: Siapa Memakai Variabel Siapa</h3><p>Variabel yang dideklarasikan di init context <b>dibaca oleh semua VU</b>, tetapi sifatnya <b>read-only</b> — tiap VU memakai nilai bersama itu sebagai bahan baku: URL, daftar endpoint, hasil <code>SharedArray</code>. Konsekuensinya perlu dipahami: <b>jangan memutasi variabel global sebagai penampung status</b>. Menulis <code>let counter = 0</code> di lalu menambahnya di dalam default function tidak menghasilkan hitungan yang bisa diandalkan. Untuk status beragregasi pakai <b>metrik buatan</b> (<code>Counter</code>, <code>Rate</code> dari <code>k6/metrics</code>); untuk data per-VU seperti token hasil login, simpan di dalam fungsi agar tiap VU punya salinan sendiri.</p><h3>Konfigurasi dengan __ENV dan Flag -e</h3><p>Nilai lingkungan dibaca lewat objek <code>__ENV</code>, diisi dari flag CLI <code>-e NAMA=nilai</code> atau dari variabel lingkungan sistem, dan <b>bisa dibaca di mana saja</b> — init, setup, maupun default function. Karena itu URL lingkungan dan parameter lain tidak perlu membuat skrip berubah:</p><ul><li>Baca <code>__ENV</code> <b>sekali di init</b> lalu simpan ke konstanta, agar seluruh skrip menunjuk ke satu sumber.</li><li><b>Rahasia (token, kata sandi) jangan pernah ditulis keras</b> di skrip — berkasnya ikut ter-commit; ambil dari environment atau injeksi rahasia CI, lalu serahkan lewat <code>-e</code>.</li><li>Sediakan nilai bawaan yang aman (<code>__ENV.BASE_URL || \'http://localhost:3000\'</code>) agar skrip tetap jalan di mesin mana pun.</li></ul>'
    },
    {
      type: 'example',
      title: 'Contoh: Konfigurasi Satu Sumber Lewat __ENV',
      lang: 'javascript',
      output: false,
      code: `import http from 'k6/http';
import { check } from 'k6';

// Satu titik pusat pembacaan konfigurasi (init context)
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';
const ENVIRONMENT = __ENV.ENVIRONMENT || 'lokal';

export const options = {
  vus: 5,
  duration: '30s',
  tags: { environment: ENVIRONMENT }, // hasil mudah disaring per lingkungan
};

export default function () {
  const params = {
    headers: { Authorization: 'Bearer ' + AUTH_TOKEN },
    tags: { name: 'GET /api/profile' },
  };

  const res = http.get(BASE_URL + '/api/profile', params);
  check(res, { 'status adalah 200': (r) => r.status === 200 });
}`,
      explain: [
        'Dijalankan dengan: <code>k6 run -e BASE_URL=https://staging.example.com -e AUTH_TOKEN=... -e ENVIRONMENT=staging script.js</code> — tanpa menyunting satu baris pun di skrip. Nilai <code>AUTH_TOKEN</code> datang dari luar skrip sehingga berkasnya aman dari kebocoran lewat version control.',
        'Tag <code>environment</code> menempel pada setiap metrik, sehingga di Grafana hasil tes staging dan produksi bisa dibandingkan tanpa mengganti skrip.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Runtime k6 Bukan Node.js</h3><p>Kata "JavaScript" sering membuat orang membayangkan Node.js, <code>require()</code>, dan <code>npm install</code>. k6 memakai mesin JavaScript sendiri di atas Go, sehingga kebiasaan Node berikut <b>tidak berlaku</b>:</p><ul><li><b>Tidak ada <code>require()</code> sembarang</b> — gunakan <code>import</code>/<code>export</code> (ES modules); berkas lokal diimpor jalur relatif, contohnya <code>import { getJson } from \'./lib/helpers.js\'</code>.</li><li><b>Tidak ada npm package bebas</b> — <code>npm install moment</code> tidak berpengaruh pada skrip k6. Yang tersedia hanya modul bawaan seperti <code>k6</code>, <code>k6/http</code>, <code>k6/metrics</code>, <code>k6/data</code>, <code>k6/ws</code>, dan <code>k6/crypto</code>, termasuk modul eksperimental yang datang pergi antar rilis.</li><li><b>Timer dibatasi</b> — tidak ada <code>setTimeout</code>/<code>setInterval</code>; jeda memakai <code>sleep()</code> di VU context, beban diatur lewat <code>options</code> atau scenario.</li><li><b><code>open()</code> untuk berkas lokal</b> — hanya di init context, biasanya dibungkus <code>SharedArray</code>.</li></ul><p>Bila skrip butuh kemampuan di luar itu, jalurnya adalah <b>xk6</b> — dibahas pada bab modularisasi — bukan berkas <code>package.json</code>. Penamaan modul bisa berubah antar rilis, jadi <b>cek dokumentasi resmi untuk versi yang kamu pakai</b>.</p>'
    },
    {
      type: 'tip',
      title: 'Tips: Pastikan Opsi Terbaca Sebelum Menjalankan',
      text: 'Sebelum menjalankan tes panjang, jalankan <code>k6 inspect script.js</code>. Perintah ini menampilkan JSON berisi seluruh <code>options</code> yang berhasil diterima k6 — termasuk hasil penggabungan dengan flag CLI — sehingga kamu langsung tahu apakah <code>--vus</code>, <code>-e</code>, dan isi blok options sudah sesuai harapan.'
    },
    {
      type: 'vocab',
      items: [
        ['Init context', 'Seluruh kode di luar fungsi yang dieksekusi saat skrip dimuat; tanpa request dan tanpa sleep.'],
        ['VU context', 'Konteks eksekusi di dalam default function; tempat request, check, group, dan sleep berjalan berulang.'],
        ['Lifecycle', 'Urutan empat fase satu kali k6 run: init, setup, default function, lalu teardown.'],
        ['Scope', 'Jangkauan variabel; variabel init bersama semua VU bersifat read-only, variabel dalam fungsi milik tiap VU.'],
        ['__ENV', 'Objek bawaan k6 berisi variabel lingkungan, diisi lewat flag -e atau environment sistem.'],
        ['SharedArray', 'Struktur dari k6/data untuk membaca berkas sekali di init lalu membagikannya hemat memori ke semua VU.']
      ]
    }
  ],
  recap: [
    'Skrip k6 tersusun dari impor modul, blok options, dan export default function; kode di luar fungsi adalah init context yang nilainya bersifat read-only untuk semua VU.',
    'Empat fase lifecycle selalu berurutan: init (sekali per VU), setup (sekali per run), default function (berulang per iterasi), lalu teardown (sekali di akhir).',
    'Aturan konteks: request dan sleep tidak boleh di init; definisi metrik, SharedArray, dan open() hanya di init; __ENV bisa dibaca di mana saja.',
    'Status agregasi memakai metrik Counter/Rate, data per-VU disimpan di dalam fungsi, dan runtime k6 bukan Node.js — tidak ada require sembarang, npm bebas, maupun setTimeout; konfigurasi lewat __ENV dan flag -e.'
  ]
});
