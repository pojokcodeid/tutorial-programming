/* ============================================================
   Pelajaran Grafana k6 — Bab 9: Request HTTP, Body, Header & group()
   ============================================================ */
'use strict';

window.K6_LESSONS = window.K6_LESSONS || [];

window.K6_LESSONS.push({
  id: 'request-http-group',
  title: 'Request HTTP, Body, Header & group()',
  chapter: 'API Lanjutan',
  duration: '8–10 menit',
  intro: [
    'Bayangkan kamu menitipkan surat lewat kantor pos: selalu ada <b>alamat tujuan</b>, <b>jenis perbuatan</b> (kirim, ambil, ubah, hapus), dan <b>isi surat</b>. Permintaan HTTP pun serupa — URL adalah alamatnya, metode perbuatannya, body isinya, dan header keterangannya.',
    'Di k6 percakapan itu ditulis lewat keluarga fungsi <code>http.*</code>: dari satu baris permintaan saja, k6 sudah mengukur latensi, menghitung kegagalan, dan mencatat metrik berlabel — menulis tes berarti memasang sensor, bukan sekadar mengirim paket.',
    'Bab ini disusun dari atas ke bawah: lima metode beserta <b>params</b>, cara menulis body, memvalidasi respons dengan <code>check()</code>, pengelompokan alur dengan <code>group()</code>, request paralel <code>http.batch()</code>, lalu penanganan timeout dan kegagalan.'
  ],
  objectives: [
    'Memakai http.get, http.post, http.put, http.patch, dan http.del beserta objek params yang tepat',
    'Menulis body JSON, form data, dan teks biasa dengan header yang benar',
    'Membaca respons (status, headers, body, json, timings) lalu memvalidasinya dengan check()',
    'Mengelompokkan alur dengan group(), menjalankan request paralel dengan http.batch(), serta menangani timeout dan kegagalan'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Lima Metode, Satu Pola Panggilan</h3><p>Semua permintaan di k6 lahir dari satu fungsi dasar: <b>http.request(method, url, body, params)</b>; lima metode berikut hanya pembungkusnya:</p><ul><li><code>http.get(url, params)</code> — membaca data; tidak memiliki body.</li><li><code>http.post(url, body, params)</code> — membuat data baru.</li><li><code>http.put(url, body, params)</code> — mengganti seluruh isi data.</li><li><code>http.patch(url, body, params)</code> — mengubah sebagian isi data.</li><li><code>http.del(url, body, params)</code> — menghapus data; namanya <i>del</i> karena <code>delete</code> adalah kata terlarang di JavaScript.</li></ul><p>Pola selalu sama: <b>url</b>, lalu <b>body</b>, lalu <b>params</b>. Params opsional dan mengatur <i>cara</i> permintaan dikirim, bukan isinya:</p><ul><li><b>headers</b> — pasangan nama–nilai seperti <code>Content-Type</code> atau <code>Authorization</code>.</li><li><b>tags</b> — label metrik; kunci agar grafik bisa dibaca per endpoint.</li><li><b>timeout</b> — batas waktu dalam <b>milidetik</b>; lewat dari itu request gagal.</li><li><b>redirects</b> — maksimal pengalihan yang boleh diikuti; <code>0</code> berarti berhenti seketika.</li><li><b>insecureSkipTLSVerify</b> — melewati verifikasi TLS; hanya untuk server uji bersertifikat self-signed.</li><li><b>responseType</b> — <code>text</code> (bawaan), <code>binary</code>, atau <code>json</code> agar body langsung diparse.</li><li><b>cookiejar</b> — pada k6 lama menyalakan cookie jar per request; versi terbaru sudah punya cookie jar per-VU bawaan — cek dokumentasi resmi untuk versi yang kamu pakai.</li></ul>'
    },
    {
      type: 'example',
      title: 'Contoh: Params yang Tepat dan Tiga Cara Menulis Body',
      lang: 'javascript',
      output: false,
      code: `import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://api.demo.local';
const JSON_HEADERS = { 'Content-Type': 'application/json', Accept: 'application/json' };

export const options = { vus: 5, duration: '30s' };

export default function () {
  // 1) GET: params menjadi argumen kedua karena tidak ada body
  const list = http.get(BASE_URL + '/products?page=1&limit=10', {
    headers: { Accept: 'application/json' },
    tags: { name: 'GET_products' },
    timeout: 5000,
    redirects: 5,
  });

  // 2) Body JSON manual: stringify sendiri, Content-Type disetel sendiri
  const payload = JSON.stringify({ sku: 'SKU-001', qty: 2 });
  const manual = http.post(BASE_URL + '/orders', payload, { headers: JSON_HEADERS });

  // 3) Body berupa objek JavaScript: k6 meng-serialize dan menyetel content-type otomatis
  const shorthand = http.post(BASE_URL + '/orders', { sku: 'SKU-002', qty: 1 });

  // 4) Form data: k6 mengubahnya jadi application/x-www-form-urlencoded
  const form = http.post(BASE_URL + '/sessions', { form: { username: 'budi', remember: '1' } });

  // 5) Body teks biasa
  const note = http.post(BASE_URL + '/notes', 'catatan tanpa format khusus', {
    headers: { 'Content-Type': 'text/plain' },
    timeout: 3000,
  });

  check(list, { 'produk 200': (r) => r.status === 200 });
  check(manual, { 'order manual 201': (r) => r.status === 201 });
  check(shorthand, { 'order shorthand 201': (r) => r.status === 201 });
  check(form, { 'sesi dibuat': (r) => r.status === 200 || r.status === 201 });
  check(note, { 'catatan diterima': (r) => r.status < 400 });
}`,
      explain: [
        'Pada GET, params menjadi argumen kedua; pada POST/PUT/PATCH/DEL urutannya <b>url, body, params</b>. Salah posisi adalah kesalahan paling umum saat belajar k6.',
        'Stringify manual dipakai bila butuh kendali penuh atas header (misalnya <code>X-Request-Id</code>); cara objek lebih ringkas karena k6 sudah menyetel <code>Content-Type: application/json</code>.',
        'Gaya <code>form</code> dan teks menunjukkan k6 tidak berasumsi semua endpoint memakai JSON, dan label <code>tags</code> ikut melekat pada <code>http_req_duration</code>.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Membaca dan Memahami Respons</h3><p>Setiap <code>http.*</code> mengembalikan satu objek respons. Jangan menebak isinya:</p><table><thead><tr><th>Properti</th><th>Isi dan catatan</th></tr></thead><tbody><tr><td><code>res.status</code></td><td>Kode HTTP (200, 201, 404, 500); bernilai 0 bila request gagal total.</td></tr><tr><td><code>res.headers</code></td><td>Objek header respons, berguna mengecek <code>Content-Type</code>.</td></tr><tr><td><code>res.body</code></td><td>Isi respons berupa string; untuk biner pakai <code>String()</code> atau <code>responseType</code>.</td></tr><tr><td><code>res.json()</code></td><td>Objek JavaScript dari body; melempar error bila isinya bukan JSON valid.</td></tr><tr><td><code>res.timings</code></td><td>Rincian milidetik: <code>dns</code>, <code>connect</code>, <code>tls</code>, <code>sending</code>, <code>waiting</code>, <code>receiving</code>, <code>duration</code>.</td></tr><tr><td><code>res.error</code></td><td>Pesan kesalahan bila permintaan gagal; kosong bila lancar.</td></tr><tr><td><code>res.error_code</code></td><td>Angka penanda jenis kegagalan: timeout, DNS gagal, atau koneksi terputus.</td></tr></tbody></table><p>Dua kebiasaan sehat: pastikan request berhasil sebelum memanggil <code>res.json()</code>, dan baca <code>res.timings</code> bila ingin tahu apakah lambatnya di DNS, TLS, atau <code>waiting</code> (waktu server memproses). Untuk tes besar setel <code>discardResponseBodies: true</code> agar isi respons dibuang segera setelah dibaca — memori hemat, tetapi body hilang untuk divalidasi.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Validasi Respons dan Retry Sederhana',
      lang: 'javascript',
      output: false,
      code: `import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://api.demo.local';
const headers = { 'Content-Type': 'application/json' };

export default function () {
  const body = JSON.stringify({ email: 'budi@example.test', qty: 1 });

  let res = http.post(BASE_URL + '/orders', body, { headers: headers, timeout: 8000 });

  // Retry terbatas: hanya untuk kegagalan sementara di sisi server
  let attempt = 0;
  const flaky = [502, 503, 504];
  while (flaky.indexOf(res.status) !== -1 && attempt < 2) {
    attempt = attempt + 1;
    sleep(0.5);
    res = http.post(BASE_URL + '/orders', body, { headers: headers, timeout: 8000 });
  }

  if (res.error) {
    console.warn(res.error + ' (kode ' + res.error_code + ')');
  }

  const data = res.status < 400 ? res.json() : {};

  check(res, {
    'status pembuatan order 201': (r) => r.status === 201,
    'respons ber-format JSON': (r) => {
      const type = r.headers['Content-Type'] || r.headers['content-type'] || '';
      return type.indexOf('application/json') !== -1;
    },
    'total belanja sesuai 240000': () => data.total === 240000,
    'status pembayaran pending': () => data.payment_status === 'pending',
    'tidak perlu retry': () => attempt === 0,
  });
}`,
      explain: [
        'Retry dibatasi dua kali dan hanya untuk status <b>502/503/504</b> — kegagalan sementara. Status 400 atau 404 tidak diulang karena bukan masalah timing.',
        '<code>check()</code> menerima objek: kuncinya nama yang tampil di laporan, nilainya fungsi boolean. Semua fungsi tetap dijalankan, tidak berhenti pada kegagalan pertama.',
        'Validasi <b>field bisnis</b> (total, payment_status) jauh lebih berharga daripada status 200 saja — inilah yang mendeteksi regresi saat API cepat tetapi isinya salah.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Mengelompokkan Alur dengan group()</h3><p>Alur nyata jarang berdiri sendiri: login → daftar → buat order → bayar. <code>group(name, fn)</code> membungkus sebagian kode menjadi satu blok bernama:</p><ul><li>Isi <code>fn</code> berjalan seperti biasa, dan setiap request di dalamnya <b>tetap diukur terpisah</b> — group hanya menambah lapisan ringkasan.</li><li>Di laporan akhir muncul baris <code>group::Login</code> beserta jumlah check dan durasinya, sehingga tahap yang melambat langsung terlihat.</li><li>Group boleh bersarang: <code>group("Checkout")</code> berisi <code>group("Pembayaran")</code> tampil sebagai <code>group::Checkout::Pembayaran</code> — kerumitan alur terpecah menjadi tahap yang mudah dibaca.</li></ul><h3>http.batch() untuk Request Paralel</h3><p>Request yang tidak saling bergantung — daftar produk, cek promo, lihat stok — bisa dikerjakan berbarengan lewat <code>http.batch()</code>. Ia menerima <b>array</b> request atau <b>objek</b> bila ingin mengakses hasilnya lewat nama, dan mengembalikan respons dalam bentuk yang sama seperti inputnya.</p><p>Peringatannya tegas: batch menciptakan <b>lonjakan (burst) tajam</b> — beberapa koneksi terbuka tepat pada saat bersamaan. Pada sistem dengan rate limit, burst ini bisa memicu 429 atau membuat hasil pengukuran tidak adil. Pakai seperlunya, bukan kebiasaan tiap iterasi.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Alur Berkelompok dengan Satu Batch Paralel',
      lang: 'javascript',
      output: false,
      code: `import http from 'k6/http';
import { check, group } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://api.demo.local';
const json = { 'Content-Type': 'application/json' };

export default function () {
  group('Katalog', function () {
    const list = http.get(BASE_URL + '/products?limit=20', { tags: { name: 'GET_products' } });
    check(list, { 'katalog 200': (r) => r.status === 200 });

    const detail = http.get(BASE_URL + '/products/SKU-001');
    check(detail, { 'detail produk 200': (r) => r.status === 200 });
  });

  group('Checkout', function () {
    // Tiga request independen dijalankan berbarengan
    const [cart, promo, stock] = http.batch([
      ['POST', BASE_URL + '/cart/items', JSON.stringify({ sku: 'SKU-001', qty: 1 }), { headers: json }],
      ['POST', BASE_URL + '/promo/apply', JSON.stringify({ code: 'HEMAT10' }), { headers: json }],
      ['GET', BASE_URL + '/stock/SKU-001', null, { tags: { name: 'GET_stock' } }],
    ]);

    check(cart, { 'item masuk keranjang': (r) => r.status === 201 });
    check(promo, { 'kode promo diterima': (r) => r.status === 200 });
    check(stock, { 'stok tersedia': (r) => r.json().available > 0 });
  });
}`,
      explain: [
        'Tiap <code>group()</code> menghasilkan baris tersendiri di ringkasan, misalnya <code>group::Checkout</code>, sehingga tahap yang lambat terlihat tanpa membaca metrik satu per satu.',
        'Bentuk array dipakai saat urutan tidak penting: <code>[metode, url, body, params]</code>. Bila hasil ingin dibaca lewat nama, pakai bentuk objek, misalnya <code>http.batch({ profil: ["GET", url] })</code>.',
        'Masing-masing request tetap diberi <code>check()</code> sendiri; satu batch bukan berarti satu validasi gabungan.'
      ]
    },
    {
      type: 'tip',
      title: 'Tips: Beri Tag Nama yang Statis per Endpoint',
      text: 'Setiap request penting layak diberi <code>tags: { name: "GET /products" }</code> dengan nama yang <b>selalu sama di setiap iterasi</b>. Nama dinamis seperti <code>"GET /products/" + id</code> membuat label ribuan dan grafik tak terbaca; cukup satu nama statis per endpoint.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Respons bisa sangat besar — halaman HTML, daftar jutaan baris, atau body biner. <b>Jangan membaca <code>res.body</code> bila tidak kamu perlukan</b>: setiap string yang disimpan di variabel ikut menahan memori. Untuk tes panjang pakai <code>discardResponseBodies: true</code> dan validasi ringkas.'
    },
    {
      type: 'vocab',
      items: [
        ['Params', 'Objek opsional terakhir pada http.method(url, body, params); mengatur headers, tags, timeout, dan responseType.'],
        ['Tags', 'Label tambahan pada metrik untuk memecah grafik per endpoint atau kelas request.'],
        ['responseType', 'Pengaturan tipe respons: text (bawaan), binary, atau json agar body langsung diparse.'],
        ['check()', 'Validasi berpasangan nama dan fungsi boolean; hasilnya jadi metrik, bukan error penghenti tes.'],
        ['group()', 'Pembungkus bernama yang membuat baris group::nama di laporan tanpa mengubah pengukuran request.'],
        ['http.batch()', 'Fungsi untuk menjalankan beberapa request paralel; menerima array atau objek, menimbulkan burst.'],
        ['discardResponseBodies', 'Opsi runtime k6 yang membuang isi respons begitu dibaca agar memori tetap rendah.']
      ]
    }
  ],
  recap: [
    'Lima metode http.* berbagi pola yang sama — url, lalu body, lalu params; params mengatur cara kirim (headers, timeout, redirects, responseType), bukan isi pesan.',
    'Body punya empat gaya: JSON manual dengan JSON.stringify, objek JavaScript yang di-serialize k6, form data lewat { form: ... }, dan teks biasa.',
    'Respons dibaca lewat status, headers, body, json(), timings, error, dan error_code; selalu validasi minimal satu field bisnis, bukan sekadar status 200.',
    'group() memecah alur menjadi tahap bernama di ringkasan, http.batch() menjalankan request paralel dengan catatan burst tajam, dan retry wajib dibatasi hanya untuk kegagalan sementara.'
  ]
});
