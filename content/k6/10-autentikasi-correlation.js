/* ============================================================
   Pelajaran Grafana k6 — Bab 10: Autentikasi, Correlation & Alur Pengguna
   ============================================================ */
'use strict';

window.K6_LESSONS = window.K6_LESSONS || [];

window.K6_LESSONS.push({
  id: 'autentikasi-correlation',
  title: 'Autentikasi, Correlation & Alur Pengguna',
  chapter: 'API Lanjutan',
  duration: '8–10 menit',
  intro: [
    'Bayangkan pintu gedung dengan dua jenis pengunjung: ada tamu yang menunjukkan kartu langganan sekali di lobi lalu bebas masuk sepanjang hari, dan ada yang setiap kali harus antre di loket untuk tiket baru. Autentikasi di tes bekerja persis begitu — pilihanmu menentukan seberapa mirip tes dengan pengunjung sungguhan.',
    'Masalahnya memang bukan sekadar "bagaimana cara login". Yang paling sering membuat tes gagal justru hal sepele: token yang kedaluwarsa di tengah tes panjang, ID hasil pembuatan yang saling ditimpa antar VU, atau validasi yang hanya mengecek status 200 padahal isinya sudah salah.',
    'Bab ini mengurainya berurutan: mengambil token dan API key dari environment, dua strategi login beserta kelebihannya, cara kerja cookie jar di k6, teknik <b>correlation</b>, pola data unik per iterasi, sampai contoh alur lengkap dari login sampai logout.'
  ],
  objectives: [
    'Mengambil token dan API key dari environment variable dengan aman',
    'Membandingkan login sekali di setup() dengan login per VU, lalu memilih sesuai tujuan pengukuran',
    'Melakukan correlation: menghubungkan POST, GET, dan DELETE lewat nilai dari respons sebelumnya',
    'Membuat data unik per iterasi dan memvalidasi hasil bisnis, bukan sekadar status 200'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Token dari Lingkungan, Bukan dari Skrip</h3><p>Dua pola autentikasi paling umum di API modern: <b>Bearer token</b> di header <code>Authorization</code>, dan <b>API key</b> di header khusus milik aplikasi. Keduanya ditulis sama di k6 — cukup tambahkan header pada params:</p><ul><li>Bearer: <code>headers: { Authorization: "Bearer " + __ENV.API_TOKEN }</code></li><li>API key: <code>headers: { "X-Api-Key": __ENV.API_KEY }</code></li></ul><p>Kuncinya ada pada nilai di kanan tanda tambah: <code>__ENV</code> berisi seluruh environment variable yang tersedia bagi skrip sehingga token tidak pernah tertulis di dalam kode. Isinya dari terminal (<code>k6 run -e API_TOKEN=abc123 skrip.js</code>) atau dari <i>secret store</i> CI. Hasilnya: skrip aman di-commit, token bisa diganti tanpa menyentuh kode, dan skrip yang sama dipakai di lingkungan mana pun dengan token berbeda.</p><p>Satu hal lagi yang sering terlupa: <b>parameterisasi</b> — buat satu objek <code>headers</code> di bagian atas fungsi lalu pakai ulang, alih-alih menyalinnya di banyak tempat. Perubahan autentikasi cukup terjadi di satu titik.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Strategi Pertama, Login Sekali di setup()',
      lang: 'javascript',
      output: false,
      code: `import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://api.demo.local';

export const options = {
  vus: 20,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
  },
};

// Berjalan sekali sebelum seluruh tes: login admin, token dibagikan ke semua VU
export function setup() {
  const res = http.post(BASE_URL + '/auth/login',
    JSON.stringify({ username: 'admin@example.test', password: __ENV.ADMIN_PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } });

  check(res, { 'login sukses 200': (r) => r.status === 200 });
  return { token: res.json().token };
}

export default function (data) {
  // data adalah salinan hasil setup untuk VU ini
  const headers = { Authorization: 'Bearer ' + data.token, 'Content-Type': 'application/json' };

  const res = http.get(BASE_URL + '/admin/orders?limit=50', {
    headers: headers,
    tags: { name: 'GET_admin_orders' },
    timeout: 5000,
  });

  check(res, {
    'data admin 200': (r) => r.status === 200,
    'bukan dilempar ke login': (r) => r.status !== 401 && r.status !== 302,
    'berisi daftar order': (r) => Array.isArray(r.json().items),
  });
}`,
      explain: [
        '<code>setup()</code> berjalan sekali sebelum tes, lalu hasil kembalian (objek berisi token) dibagikan ke setiap VU sebagai salinan yang tidak boleh diubah.',
        'Cepat: hanya ada satu percobaan login, bukan ribuan. Cocok untuk tes singkat, smoke test, atau endpoint login yang sangat berat.',
        'Risikonya: satu token dipakai bersama seluruh VU, sehingga token berumur pendek bisa membuat tes panjang tiba-tiba penuh 401 — dan check terakhir membedakan "server error" dengan "dilempar ke halaman login".'
      ]
    },
    {
      type: 'text',
      html: '<h3>Strategi Kedua: Login per VU di Default Function</h3><p>Alternatifnya, setiap VU login sendiri di dalam fungsi bawaan seperti pengunjung yang mengambil tiket sendiri-sendiri: pindahkan blok login dari <code>setup()</code> ke fungsi utama, lalu simpan token untuk request berikutnya dalam iterasi yang sama.</p><ul><li><b>Realistis</b> — tiap pengunjung benar-benar punya sesi sendiri, lengkap dengan cookie dan token miliknya.</li><li><b>Tahan lama</b> — tidak ada token bersama yang bisa kedaluwarsa di tengah tes dua jam.</li><li><b>Berbayar</b> — menambah satu login per iterasi, sehingga latensi rata-rata ikut terpengaruh; kelompokkan login agar terbaca terpisah.</li></ul><h3>Cookie &amp; Session</h3><p>k6 memiliki <b>cookie jar per VU</b>: cookie dari header <code>Set-Cookie</code> otomatis disimpan dan dikirim ulang pada request berikutnya dalam VU itu, persis seperti browser — login pertama otomatis mengunci sesi untuk seluruh alur. Bila butuh perlakuan khusus, misalnya mematikan pemakaian ulang cookie antar iterasi, ada opsi untuk itu: cek dokumentasi resmi k6 untuk versi yang kamu pakai.</p><h3>Correlation: Menyambung Respons ke Request Berikutnya</h3><p><b>Correlation</b> adalah kebiasaan mengambil nilai dari respons sebelumnya lalu memakainya kembali: membuat order, membaca <code>id</code>, lalu memakai id itu untuk mengambil dan menghapus data. Tanpa correlation tes hanya menebak; dengan correlation, tes mengikuti alur seperti pengguna asli.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: POST → GET → DELETE dengan Correlation',
      lang: 'javascript',
      output: false,
      code: `import http from 'k6/http';
import { check, group } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://api.demo.local';
const json = { 'Content-Type': 'application/json' };

export default function () {
  const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + __ENV.API_TOKEN };

  group('Siklus satu order', function () {
    // Tahap 1: buat data dengan ID unik milik VU dan iterasi ini
    const externalId = 'order-' + __VU + '-' + __ITER;

    const created = http.post(BASE_URL + '/orders',
      JSON.stringify({ sku: 'SKU-001', qty: 1, external_id: externalId }),
      { headers: headers, tags: { name: 'POST_orders' } });
    check(created, {
      'order dibuat 201': (r) => r.status === 201,
      'respons punya id': (r) => typeof r.json().data.id === 'string',
    });

    // Tahap 2: ambil nilai dari respons sebelumnya
    const orderId = created.json().data.id;

    const detail = http.get(BASE_URL + '/orders/' + orderId, {
      headers: headers,
      tags: { name: 'GET_order_detail' },
    });
    check(detail, {
      'detail ditemukan 200': (r) => r.status === 200,
      'id tidak tertukar': (r) => r.json().data.id === orderId,
      'external id sesuai yang dibuat': (r) => r.json().data.external_id === externalId,
    });

    // Tahap 3: pakai nilai yang sama untuk menghapus
    const removed = http.del(BASE_URL + '/orders/' + orderId, null,
      { headers: headers, tags: { name: 'DELETE_order' } });
    check(removed, { 'order dihapus 204': (r) => r.status === 204 });
  });
}`,
      explain: [
        'Alurnya berbentuk rantai: respons tahap pertama menjadi input tahap kedua. Bila tahap pertama gagal, <code>orderId</code> tidak ada dan tahap berikutnya ikut gagal — kegagalan langsung terbaca di laporan.',
        'Tiap tahap punya <code>check()</code> sendiri sehingga kegagalan ditelusuri ke langkah yang tepat, bukan sekadar "alur gagal".',
        'Validasi <code>external_id</code> memastikan server mengembalikan data yang kamu buat — bukan data orang lain saat VU berjalan ratusan; ID uniknya berasal dari <code>order-" + __VU + "-" + __ITER</code>.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Data Unik dan Ketergantungan Antar-VU</h3><p>Kesalahan paling klasik dalam tes paralel adalah mengandalkan satu ID bersama: bila VU-1 dan VU-2 sama-sama membuat <code>order-1</code>, salah satu menerima error duplikat atau — lebih buruk — saling menimpa diam-diam. Solusinya: <b>data unik per iterasi</b> dari dua variabel bawaan k6:</p><ul><li><b>__VU</b> — nomor VU yang sedang berjalan; k6 menomori VU mulai dari 1, dan nilainya 0 saat <code>setup()</code> serta <code>teardown()</code> berjalan.</li><li><b>__ITER</b> — nomor iterasi dalam VU itu, dimulai dari 0 dan bertambah tiap kali fungsi bawaan dipanggil ulang.</li></ul><p>Maka <code>"order-" + __VU + "-" + __ITER</code> selalu unik selama tes berjalan; pola sama berlaku untuk surel uji (<code>"user-" + __VU + "-" + __ITER + "@example.test"</code>) atau nomor referensi.</p><p>Prinsip besarnya: <b>setiap VU menyelesaikan alurnya sendiri</b>. Jangan membuat VU-A memakai ID hasil pembuatan VU-B, dan jangan berbagi data lewat variabel modul — tiap VU punya ruang modulnya sendiri, sehingga perubahan di satu VU tak terlihat di VU lain dan hasil tes mustahil diulang.</p><h3>Validasi Hasil Bisnis, Bukan Sekadar 200</h3><p>Status 200 hanya membuktikan server menjawab, bukan login menghasilkan sesi atau order tercatat. Periksa <b>isinya</b>: field wajib, status pembayaran, nilai total, dan kepemilikan data — check tambahan inilah yang membedakan tes penemu bug dengan tes pembuang waktu.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Alur Pengguna Lengkap dengan group()',
      lang: 'javascript',
      output: false,
      code: `import http from 'k6/http';
import { check, group, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://api.demo.local';
const json = { 'Content-Type': 'application/json' };

export default function () {
  let token = '';

  group('Login', function () {
    const res = http.post(BASE_URL + '/auth/login',
      JSON.stringify({ username: 'budi@example.test', password: __ENV.USER_PASSWORD }),
      { headers: json, tags: { name: 'POST_login' } });
    check(res, {
      'login diterima 200': (r) => r.status === 200,
      'menghasilkan token': (r) => typeof r.json().token === 'string',
    });
    token = res.json().token;
  });
  const auth = { headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token } };

  group('Telusuri katalog', function () {
    const list = http.get(BASE_URL + '/products?limit=20', auth);
    check(list, {
      'katalog 200': (r) => r.status === 200,
      'harga pertama valid': (r) => r.json().items[0].price > 0,
    });
    sleep(1);
  });

  group('Keranjang', function () {
    const added = http.post(BASE_URL + '/cart/items', JSON.stringify({ sku: 'SKU-001', qty: 1 }), auth);
    check(added, { 'item masuk keranjang': (r) => r.status === 201 });
    sleep(1);
  });

  group('Checkout', function () {
    const order = http.post(BASE_URL + '/checkout', JSON.stringify({ payment: 'transfer' }), auth);
    check(order, {
      'checkout sukses 201': (r) => r.status === 201,
      'status pembayaran pending': (r) => r.json().payment_status === 'pending',
      'punya nomor referensi': (r) => typeof r.json().reference === 'string',
    });
  });

  group('Logout', function () {
    const out = http.post(BASE_URL + '/auth/logout', null, auth);
    check(out, { 'logout diterima': (r) => r.status === 200 || r.status === 204 });
  });

  sleep(1);
}`,
      explain: [
        'Ini strategi <b>login per VU</b>: token baru dibuat tiap iterasi lalu dipakai seluruh group dalam alur itu — sesi benar-benar milik masing-masing VU.',
        'Tiap tahap memperoleh <code>group()</code> sendiri sehingga di ringkasan langsung terlihat tahap mana yang paling lama: Login, Katalog, Keranjang, Checkout, atau Logout.',
        'Validasi berlapis: status bersama isi bisnis seperti <code>payment_status</code> dan <code>reference</code>, ditambah <code>sleep()</code> kecil untuk meniru jeda membaca halaman.'
      ]
    },
    {
      type: 'tip',
      title: 'Tips: Pisahkan Tes Autentikasi dari Tes Endpoint',
      text: 'Tujuan pengukuran menentukan bentuk skrip. Ingin tahu seberapa cepat login? Buat tes khusus yang <b>hanya</b> berisi login — dicampur endpoint lain, angka <code>http_req_duration</code>-mu bercampur antara login yang lambat dengan endpoint yang cepat. Untuk mengukur alur belanja, kelompokkan login di <code>group("Login")</code> agar tetap terbaca terpisah di laporan meski dalam satu skrip.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Jangan pernah menaruh password, token, atau API key di dalam skrip yang disimpan ke version control — token yang bocor <b>langsung dipakai orang lain</b>. Ambil semuanya dari environment variable atau secret manager, pakai akun uji ber-izin minimal, dan ingat berkas hasil tes (JSON/HTML) bisa ikut merekam header permintaan; pengaturan secret dibahas lagi di bab berikutnya.'
    },
    {
      type: 'vocab',
      items: [
        ['Bearer token', 'String otorisasi di header Authorization dengan awalan "Bearer ", biasanya hasil login.'],
        ['API key', 'Kunci statis untuk identifikasi aplikasi, dikirim di header khusus milik layanan.'],
        ['Cookie jar per VU', 'Penyimpanan cookie milik satu VU; Set-Cookie otomatis dikirim pada request berikutnya di VU itu.'],
        ['Correlation', 'Teknik mengambil nilai dari respons sebelumnya (misalnya id) lalu memakainya pada request berikutnya.'],
        ['__VU dan __ITER', 'Nomor VU (mulai 1) dan nomor iterasi (mulai 0) bawaan k6 untuk membuat data unik tiap iterasi.'],
        ['Data per VU', 'Pemilihan data berdasarkan nomor VU sehingga tiap VU memakai baris data yang berbeda.'],
        ['Data per iterasi', 'Pemilihan data berdasarkan nomor iterasi sehingga tiap putaran memakai baris data yang berbeda.'],
        ['Validasi bisnis', 'Pemeriksaan isi respons (harga, status pembayaran, kepemilikan data), bukan hanya kode status.']
      ]
    }
  ],
  recap: [
    'Token dan API key diambil dari environment lewat __ENV sehingga skrip bebas kredensial dan bisa dipakai lintas lingkungan.',
    'Login sekali di setup() cepat tetapi berbagi satu token ke semua VU; login per VU lebih realistis dengan biaya satu login tambahan per iterasi.',
    'k6 menyimpan cookie per VU otomatis, sehingga sesi berbasis cookie mengalir sendiri sepanjang alur dalam satu VU.',
    'Correlation menghubungkan POST → GET → DELETE lewat nilai dari respons, dan ID unik "order-" + __VU + "-" + __ITER mencegah VU saling menimpa.',
    'Tes yang berguna memvalidasi isi bisnis dan mengelompokkan alur dengan group() agar hasilnya mudah dibaca.'
  ]
});
