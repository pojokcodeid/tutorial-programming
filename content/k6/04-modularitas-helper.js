/* ============================================================
   Pelajaran Grafana k6 — Bab 4: Modularisasi Script & Helper
   ============================================================ */
'use strict';

window.K6_LESSONS = window.K6_LESSONS || [];

window.K6_LESSONS.push({
  id: 'modularitas-helper',
  title: 'Modularisasi Script & Helper',
  chapter: 'Menulis Script',
  duration: '8–10 menit',
  intro: [
    'Pernah melihat dapur restoran yang satu orang mengurus semuanya — mencuci, memotong, menggoreng, menyajikan — sampai satu resep berubah dan empat menu ikut kacau? Skrip k6 yang tumbuh besar pun begitu: bila tiap berkas mengulang cara menambah header, mengecek status, dan menyusun URL, satu perubahan kecil harus disalin ke mana-mana.',
    '<b>Modularisasi</b> memecah skrip menjadi berkas-berkas kecil dengan tanggung jawab jelas: <code>lib/helpers.js</code> untuk fungsi bantu, <code>lib/http.js</code> untuk pembungkus request, <code>lib/auth.js</code> untuk login, dan satu berkas per kerangka tes di <code>scenarios/</code>. k6 mendukung hal ini lewat mekanisme <b>ES modules</b> — <code>import</code> dan <code>export</code> dengan jalur relatif, persis seperti JavaScript modern pada umumnya.',
    'Bab ini memberimu pola kerja yang bisa langsung dipakai: cara memecah proyek, satu contoh lengkap berkas helper, pembungkus request dengan <code>timeout</code> dan <b>tag</b> otomatis, cara k6 memuat modul, sampai batasan yang mengharuskanmu beralih ke <b>xk6</b> bila butuh pustaka ekstra.'
  ],
  objectives: [
    'Memecah proyek k6 menjadi scenarios dan lib dengan pola folder yang konsisten',
    'Menulis berkas helper: getJson, postJson, assertStatus, dan buildHeaders',
    'Membungkus request dengan timeout dan tag otomatis agar metrik mudah disaring',
    'Memahami cara k6 memuat modul serta alternatif xk6 ketika butuh pustaka ekstra'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Kenapa Skrip Perlu Dipecah?</h3><p>Tiga alasan yang paling sering muncul: <b>konsistensi</b> (semua request pakai header dan pengecekan yang sama), <b>perubahan tunggal</b> (ganti cara login di satu tempat, seluruh skrip ikut), dan <b>kolaborasi</b> (tim menulis berkas masing-masing tanpa saling menimpa).</p><p>Pola organisasi yang terbukti nyaman untuk k6:</p><ul><li><b>Satu berkas per kerangka tes</b> — <code>smoke.js</code>, <code>load.js</code>, dan <code>spike.js</code> berisi <code>options</code>-nya masing-masing, tetapi berbagi seluruh helper. Beban berbeda, logika bisnis sama.</li><li><b>Isi <code>lib/</code> murni fungsi</b> — tanpa <code>options</code>, tanpa <code>default function</code>, hanya <code>export function</code> yang bisa dipanggil siapa pun.</li><li><b>Penamaan konsisten</b> — pilih satu gaya (misalnya <code>getJson</code>/<code>postJson</code>, bukan campur <code>fetchData</code>/<code>doPost</code>) dan pegang teguh; nama yang konsisten membuat helper mudah ditemukan lewat pelengkap otomatis editor.</li></ul>'
    },
    {
      type: 'example',
      title: 'Contoh: Struktur Folder Proyek yang Rapi',
      lang: 'text',
      output: false,
      code: `my-k6-project/
├── scenarios/              # satu berkas per kerangka tes
│   ├── smoke.js            # beban kecil, hampir tiap commit
│   ├── load.js             # beban wajar, dijalankan berkala
│   └── spike.js            # lonjakan tiba-tiba
├── lib/                    # helper bersama: ekspor fungsi saja
│   ├── helpers.js          # getJson, postJson, assertStatus, buildHeaders
│   ├── http.js             # wrapper request: timeout + tag otomatis
│   └── auth.js             # login sekali & simpan token
├── data/
│   └── users.json          # dibaca via SharedArray di init
└── README.md               # cara menjalankan tiap skrip`,
      explain: [
        'Dua folder inti: <b>scenarios</b> untuk apa yang kamu uji beserta bebannya, <b>lib</b> untuk bagaimana kamu menguji. Pemisahan ini membuat perubahan beban tidak pernah menyentuh logika request.',
        'Berkas di <code>lib/</code> sengaja tidak memiliki blok <code>options</code> maupun <code>default function</code>; keduanya hanya boleh hidup di dalam <code>scenarios/</code> agar tidak ada dua "pemilik" konfigurasi.',
        'Folder <code>data/</code> menampung berkas JSON/CSV yang dibaca sekali di init context melalui <code>SharedArray</code>, bukan <code>open()</code> yang dipanggil berulang di dalam fungsi. Struktur ini bukan aturan baku k6 — yang penting aturannya disepakati tim dan ditulis di README.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Cara k6 Memuat Modul</h3><p>k6 mengikuti standar <b>ES modules</b>. Ada empat hal yang perlu dipegang:</p><ul><li><b>Hanya file yang di-import yang dibaca</b> — k6 menelusuri <code>import</code> dari skrip utama; berkas yang tidak tersentuh tidak dimuat, tidak dieksekusi, dan tidak menimbulkan efek apa pun.</li><li><b>Jalur relatif harus eksplisit</b> — <code>import { getJson } from \'./lib/helpers.js\'</code> (dari dalam folder <code>scenarios/</code> menjadi <code>\'../lib/helpers.js\'</code>). Sebagian versi menuntut ekstensi <code>.js</code> ditulis, sebagian menerima tanpa ekstensi — <b>cek dokumentasi resmi untuk versi yang kamu pakai</b>.</li><li><b>Yang bisa diekspor</b> — fungsi, objek, konstanta, dan <code>options</code>. Satu berkas boleh mengekspor banyak hal sekaligus dengan <code>export function</code> dan <code>export const</code>.</li><li><b>Hindari side-effect di init</b> — kode tingkat atas sebuah modul ikut dieksekusi saat dimuat (untuk tiap VU). Bila di sana kamu sudah melakukan request atau memproses data berat, pekerjaan itu terulang berkali-kali. Biarkan tingkat atas hanya berisi deklarasi dan konstanta.</li></ul><p>Modularitas hanya memperpanjang aturan init/VU context yang sudah dibahas pada bab sebelumnya ke banyak berkas.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: lib/helpers.js — Empat Fungsi Inti',
      lang: 'javascript',
      output: false,
      code: `import http from 'k6/http';
import { check } from 'k6';

// Header standar yang dipakai seluruh skrip
export function buildHeaders(token) {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = 'Bearer ' + token;
  }
  return headers;
}

// Menjadikan status tak terduga sebagai kegagalan yang terlihat
export function assertStatus(res, expected) {
  const label = 'status adalah ' + expected;
  return check(res, { [label]: (r) => r.status === expected });
}

// GET yang otomatis ber-JSON, bertag, dan dicek statusnya
export function getJson(url, token, name) {
  const params = {
    headers: buildHeaders(token),
    tags: { name: name || 'GET ' + url },
  };
  const res = http.get(url, params, 'json');
  assertStatus(res, 200);
  return res.json();
}

// POST JSON dengan body yang diserialisasi otomatis
export function postJson(url, body, token, name, expected) {
  const params = {
    headers: buildHeaders(token),
    tags: { name: name || 'POST ' + url },
  };
  const res = http.post(url, JSON.stringify(body), params, 'json');
  assertStatus(res, expected || 200);
  return res.json();
}`,
      explain: [
        'Pola <b>wrapper + pengecekan</b>: pemanggil tidak lagi menulis header dan <code>check</code> berulang — ia cukup memanggil <code>getJson(url, token, name)</code> dan langsung menerima objek JSON hasil parse.',
        '<code>assertStatus(res, 200)</code> membuat nama check menjadi dinamis (<code>status adalah 200</code>) sehingga kegagalan tetap terbaca di ringkasan, bukan sekadar hilang diam-diam.',
        'Argumen <code>name</code> pada tiap fungsi adalah <b>tag</b> untuk metrik: alih-alih ratusan URL mentah, metrik dikelompokkan menjadi nama endpoint yang bersih, dan berkas ini tidak menjalankan apa pun saat dimuat sehingga aman dipakai berbagai skrip.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh: lib/http.js — Wrapper dengan Timeout & Tag Otomatis',
      lang: 'javascript',
      output: false,
      code: `import http from 'k6/http';

const DEFAULT_TIMEOUT = '10s';

// Membungkus seluruh method di balik satu pintu
export function request(method, url, body, opts) {
  const options = opts || {};
  const endpoint = options.name || (method + ' ' + url);

  const params = {
    headers: options.headers || {},
    timeout: options.timeout || DEFAULT_TIMEOUT,
    tags: Object.assign({ name: endpoint }, options.tags || {}),
  };

  const responseType = options.responseType || 'text';
  return http.request(method, url, body, params, responseType);
}

// Turunan yang lazim dipakai, agar pemanggilan tetap singkat
export function get(url, opts) {
  return request('GET', url, null, opts);
}

export function put(url, body, opts) {
  return request('PUT', url, body, opts);
}`,
      explain: [
        '<b>timeout</b> adalah jaring pengaman: tanpa batas waktu, satu endpoint yang menggantung bisa menahan VU dan membuat hasil tes tidak masuk akal.',
        '<b>tag name</b> diisi dari <code>options.name</code> bila disediakan, otomatis <code>METHOD + URL</code> bila tidak; <code>Object.assign</code> menggabungkannya dengan tag milik pemanggil. Nama endpoint yang rapi membuat <code>http_req_duration</code> mudah disaring per endpoint di Grafana.',
        'Pembungkus semacam ini langkah pertama paling berdampak: menyentuh <b>setiap</b> request tanpa mengubah logika bisnis di skrip.'
      ]
    },
    {
      type: 'example',
      title: 'Contoh: scenarios/smoke.js yang Memakai Helper',
      lang: 'javascript',
      output: false,
      code: `import { check, sleep } from 'k6';
import { getJson, buildHeaders } from '../lib/helpers.js';
import { get } from '../lib/http.js';

const BASE_URL = __ENV.BASE_URL || 'https://jsonplaceholder.typicode.com';

export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 3,
      duration: '1m',
    },
  },
};

export default function () {
  const post = getJson(BASE_URL + '/posts/1', '', 'GET /posts/1');
  check(post, { 'judul tersedia': (p) => p.title && p.title.length > 0 });

  const res = get(BASE_URL + '/posts', { name: 'GET /posts', timeout: '5s' });
  check(res, { 'daftar berisi entri': (r) => r.status === 200 });

  console.log('Header siap: ' + Object.keys(buildHeaders('')).join(', '));
  sleep(1);
}`,
      explain: [
        'Perhatikan jalur relatifnya: dari dalam <code>scenarios/</code>, berkas helper diakses lewat <code>\'../lib/helpers.js\'</code>. Kedua modul yang diimpor hanya dijalankan saat dimuat, tanpa efek samping.',
        'Pemanggilan menjadi sangat ringkas: satu baris <code>getJson(...)</code> menggantikan penulisan header, request, pengecekan status, dan parsing JSON yang sebelumnya enam baris.',
        'Skrip lain seperti <code>load.js</code> hanya perlu menyalin blok <code>options</code> dan mengubah bebannya — seluruh logika request tetap berada di <code>lib/</code>.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Keterbatasan dan Solusi: xk6</h3><p>k6 sengaja tidak membuka akses ke npm, sehingga kebutuhan yang melampaui API bawaan harus dicari jalannya. Tiga langkah, dari yang paling sederhana:</p><ol><li><b>Tulis sendiri dengan API k6</b> — sering kali kebutuhan (kompresi, parsing format tertentu, kripto ringan) sudah tersedia lewat modul bawaan seperti <code>k6/crypto</code>, <code>k6/encoding</code>, dan <code>k6/utils</code>. Cek dulu sebelum menambah apa pun.</li><li><b>Ekstensi JavaScript (xk6)</b> — proyek k6 di luar bisa mendaftarkan modul baru sehingga kamu mengimpornya seperti modul biasa. Paling cocok untuk menambah API kecil.</li><li><b>Ekstensi Go (xk6)</b> — kamu menulis modul Go, lalu <code>xk6</code> (toolchain resmi Grafana) <b>membangun biner k6 kustom</b> yang sudah menyertakan ekstensi itu. Ini jalur untuk klien database, protokol khusus, atau integrasi internal perusahaan.</li></ol><p>Harga langkah 2 dan 3: kamu ikut bertanggung jawab atas biner hasil build — versinya harus dijaga mengikuti rilis k6 dan disebarkan ke seluruh tim serta mesin CI. Bentuk perintah <code>xk6 build</code>, penamaan modul, dan cara mendaftarkan ekstensi berubah antar versi, jadi <b>cek dokumentasi resmi untuk versi yang kamu pakai</b>. Aturan praktisnya: bila kebutuhan bisa diselesaikan dengan 20 baris helper, tulis helper dulu; pertimbangkan xk6 hanya ketika pekerjaannya benar-benar di luar jangkauan JavaScript murni di k6.</p>'
    },
    {
      type: 'tip',
      title: 'Tips: Refactor Bertahap, Bukan Sekali Jadi',
      text: 'Jangan langsung memecah skrip menjadi sepuluh berkas. Mulailah dari <b>satu pembungkus <code>http.request</code></b> saja (fungsi <code>get</code>/<code>post</code> dengan timeout dan tag), jalankan ulang skrip, dan pastikan hasilnya identik. Setelah terbiasa, pindahkan pengecekan status ke helper, lalu login ke modul terpisah. Setiap langkah kecil mudah diuji dan mudah dibatikskan; refactor besar sekaligus justru membuat hasil tes tidak bisa dipercaya.'
    },
    {
      type: 'vocab',
      items: [
        ['Init context', 'Bagian skrip yang dieksekusi saat modul dimuat; tempat konstanta dan definisi bersama, tanpa side-effect.'],
        ['VU context', 'Konteks eksekusi di dalam default function tempat request, check, dan sleep berjalan berulang.'],
        ['ES module', 'Standar modul JavaScript k6: berkas mengekspor dengan export lalu diimpor dengan import lewat jalur relatif.'],
        ['Helper', 'Fungsi bantu di folder lib yang dipakai bersama oleh banyak skrip, misalnya getJson dan assertStatus.'],
        ['Wrapper', 'Fungsi pembungkus panggilan bawaan k6 yang menambahkan timeout, tag, dan header secara terpusat.'],
        ['Tag', 'Label pada metrik (misalnya name endpoint) yang memudahkan penyaringan hasil per endpoint di Grafana.'],
        ['xk6 extension', 'Ekstensi k6 hasil build kustom (JavaScript atau Go) untuk menambah modul di luar API bawaan k6.']
      ]
    }
  ],
  recap: [
    'Pola organisasi yang rapi: satu berkas per kerangka tes di scenarios/, fungsi murni di lib/, dan penamaan konsisten di seluruh proyek.',
    'k6 memuat modul memakai ES modules: hanya file yang di-import yang dibaca, jalur relatif ditulis eksplisit, dan kode tingkat atas sebaiknya bebas side-effect.',
    'lib/helpers.js memusatkan buildHeaders, assertStatus, getJson, dan postJson sehingga satu baris pemanggilan menggantikan header, request, check, dan parsing JSON.',
    'Wrapper http.request menambahkan timeout pengaman dan tag name otomatis sehingga metrik bisa disaring per endpoint di Grafana.',
    'Karena tidak ada npm bebas, kebutuhan pustaka dijawab bertahap: API bawaan k6, lalu ekstensi JavaScript, baru ekstensi Go lewat xk6 build.'
  ]
});
