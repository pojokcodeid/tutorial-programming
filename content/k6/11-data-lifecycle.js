/* ============================================================
   Pelajaran Grafana k6 — Bab 11: setup(), teardown() & Data Uji
   ============================================================ */
'use strict';

window.K6_LESSONS = window.K6_LESSONS || [];

window.K6_LESSONS.push({
  id: 'data-lifecycle',
  title: 'setup(), teardown() & Data Uji',
  chapter: 'Data & Lifecycle',
  duration: '8–10 menit',
  intro: [
    'Bayangkan warung kopi: pagi hari pemiliknya menyiapkan bahan dan cangkir — sekali saja untuk seluruh hari; sepanjang hari barista bekerja terus-menerus; menjelang tutup semuanya dibersihkan. Di k6 persiapan itu <code>setup()</code>, kerja berulang itu fungsi bawaan, dan penutupan itu <code>teardown()</code>.',
    'Tiga tahap ini membuat tes memakai data bersama tanpa mengulang persiapan mahal, sekaligus meninggalkan sistem target bersih. Keputusan tentang <b>di mana data dibaca</b> dan <b>bagaimana data unik dibuat</b> menentukan apakah tes 100 VU-mu ringan atau justru kehabisan memori.',
    'Bab ini membahas urutan hidup sebuah tes, pemakaian <code>SharedArray</code> agar satu file JSON dibaca sekali untuk semua VU, pembacaan file dengan <code>open()</code> dan <code>openBinary()</code>, pola data unik anti-tabrakan, sampai aturan keamanan data uji.'
  ],
  objectives: [
    'Menempatkan pekerjaan yang tepat di setup(), fungsi bawaan, dan teardown()',
    'Memakai SharedArray untuk berbagi data besar hemat memori ke semua VU',
    'Menerapkan pola data per VU dan data per iterasi dengan __VU serta __ITER',
    'Membaca file data (JSON, CSV) dengan open() dan menjaga data uji tetap unik serta aman'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Siklus Hidup: setup(), Fungsi Bawaan, teardown()</h3><p>Setiap skrip k6 bisa mengekspor tiga fungsi yang dijalankan pada waktu berbeda:</p><ul><li><b>setup()</b> — berjalan <b>sekali</b> sebelum seluruh tes. Tempat login sebagai admin, membuat <i>fixture</i> (data buatan tes), atau menghasilkan data bersama. Nilai yang kamu <code>return</code> dibagikan ke semua VU sebagai argumen fungsi bawaan.</li><li><b>Fungsi bawaan (default)</b> — berjalan berulang di setiap VU selama tes; inilah "barista" yang bekerja terus-menerus.</li><li><b>teardown()</b> — berjalan <b>sekali</b> setelah tes selesai. Tempat membersihkan data uji: menghapus order buatan tes atau membongkar akun sementara.</li></ul><p>Dua sifat nilai <code>setup()</code>: nilainya <b>di-serialisasi</b> lalu dikirim sebagai <b>salinan</b> ke tiap VU sehingga tak boleh berisi fungsi atau objek hidup, dan salinan itu <b>imutabel</b> — perubahan di satu VU tidak terlihat di VU lain. Nilai yang sama bisa diteruskan ke <code>teardown(data)</code> untuk pembersihan.</p><p>Catatan yang sering membuat kaget: <b>teardown() tidak berjalan bila proses dihentikan paksa</b> — Ctrl+C, timeout orchestrator, atau proses dibunuh sistem. Karena itu jangan jadikan <code>teardown()</code> satu-satunya jalur kebersihan; beri data uji penanda (prefix) khusus agar bisa dibersihkan massal, dan pastikan tes tetap aman dijalankan ulang.</p>'
    },
    {
      type: 'example',
      title: 'Contoh: Fixture Bersama dari setup() dan Pembersihan di teardown()',
      lang: 'javascript',
      output: false,
      code: `import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://api.demo.local';
const json = { 'Content-Type': 'application/json' };

export const options = {
  scenarios: {
    belanja: { executor: 'constant-vus', vus: 10, duration: '45s', exec: 'belanja' },
  },
};

// sekali sebelum tes
export function setup() {
  const login = http.post(BASE_URL + '/auth/login',
    JSON.stringify({ username: 'admin@example.test', password: __ENV.ADMIN_PASSWORD }), { headers: json });
  check(login, { 'login admin sukses': (r) => r.status === 200 });

  const token = login.json().token;
  const auth = { headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token } };

  // produk fixture dipakai bersama oleh semua VU
  const produk = http.post(BASE_URL + '/products',
    JSON.stringify({ name: 'Produk Fixture', price: 1000, sku: 'FIXTURE-PROD' }), { headers: auth.headers });
  check(produk, { 'fixture produk dibuat': (r) => r.status === 201 });

  return { token: token, productId: produk.json().data.id };
}

// fungsi bawaan scenario belanja
export function belanja(data) {
  const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + data.token };

  const order = http.post(BASE_URL + '/orders',
    JSON.stringify({ sku: 'FIXTURE-PROD', qty: 1, fixture_id: data.productId }), { headers: headers });
  check(order, { 'order memakai fixture': (r) => r.status === 201 });
  sleep(1);
}

// sekali setelah tes
export function teardown(data) {
  const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + data.token };

  const cleanup = http.del(BASE_URL + '/products/' + data.productId, null, { headers: headers });
  check(cleanup, { 'fixture dibersihkan': (r) => r.status === 204 || r.status === 200 });
  console.log('fixture dibersihkan: ' + data.productId);
}`,
      explain: [
        'Urutannya selalu sama: <code>setup()</code> sekali → fungsi bawaan ratusan kali → <code>teardown()</code> sekali; kode di luar ketiganya (init context) dibaca sekali per VU.',
        'Produk fixture dibuat sekali lalu dipakai 10 VU selama 45 detik — efisiensi terbesar <code>setup()</code>. Fungsi bawaan <code>belanja</code> dicocokkan dengan <code>exec: "belanja"</code>, bukan <code>default</code>.',
        '<code>teardown()</code> menerima nilai seperti fungsi bawaan sehingga <code>productId</code> dari awal tetap bisa dihapus di akhir — tetapi bila tes dihentikan paksa, bagian ini terlewat.'
      ]
    },
    {
      type: 'text',
      html: '<h3>SharedArray: Satu Kali Baca, Dipakai Semua VU</h3><p>Kebutuhan umum: menyiapkan ratusan baris data pengguna. Cara paling bodoh: memanggil <code>open()</code> lalu <code>JSON.parse()</code> di dalam fungsi bawaan — file dibaca ulang tiap VU dan memori membengkak (jumlah VU × ukuran data).</p><p><b>SharedArray</b> dari modul <code>k6/data</code> menyelesaikannya: file dibaca <b>sekali</b> per proses, lalu seluruh VU berbagi buffer yang sama secara hemat:</p><ul><li>Dibuat di <b>init context</b> (di luar fungsi), dengan nama unik dan sebuah fungsi inisialisasi.</li><li>Fungsi inisialisasi wajib <b>mengembalikan array</b>, bukan objek — inilah syarat utamanya.</li><li>Isinya <b>sama sekali tidak boleh diubah</b> (imutabel); perubahan di satu VU akan mengganggu VU lain. Butuh data berubah? Salin dulu ke variabel lokal.</li><li>Diakses seperti array biasa: <code>users[0]</code>, <code>users.length</code>.</li></ul><p>Dari sini lahir dua pola pemilihan yang wajib kamu kuasai:</p><ul><li><b>Data per VU</b> — tiap VU memegang barisnya sendiri: <code>users[(__VU - 1) % users.length]</code>. K6 menomori VU mulai dari 1, jadi kurangi 1 agar VU pertama mengambil baris pertama.</li><li><b>Data per iterasi</b> — baris berganti tiap putaran: <code>users[__ITER % users.length]</code>, cocok bila satu VU harus melewati banyak akun berbeda.</li></ul>'
    },
    {
      type: 'example',
      title: 'Contoh: SharedArray dengan Pola Data per VU dan per Iterasi',
      lang: 'javascript',
      output: false,
      code: `import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const BASE_URL = __ENV.BASE_URL || 'https://api.demo.local';

// data/users.json berupa array, misalnya:
// [ { "username": "budi@example.test", "password": "rahasia-1" }, ... ]
const users = new SharedArray('users', function () {
  const parsed = JSON.parse(open('./data/users.json'));
  return parsed.map(function (u) {
    return { username: u.username, password: u.password };
  });
});

export default function () {
  // Pola data per VU: VU 1 memakai users[0], VU 2 memakai users[1], dan seterusnya
  const user = users[(__VU - 1) % users.length];

  const login = http.post(
    BASE_URL + '/auth/login',
    JSON.stringify({ username: user.username, password: user.password }),
    { headers: { 'Content-Type': 'application/json' }, tags: { name: 'POST_login' } }
  );
  check(login, {
    'login sukses': (r) => r.status === 200,
    'mengembalikan sesi': (r) => typeof r.json().session_id === 'string',
    'akun benar milik VU ini': (r) => r.json().username === user.username,
  });

  // Pola data per iterasi: baris berganti tiap putaran
  const row = users[__ITER % users.length];
  check(row, { 'baris data tersedia': (u) => !!u.username && !!u.password });
  sleep(1);
}`,
      explain: [
        'Fungsi inisialisasi <code>SharedArray</code> dipanggil sekali; ribuan VU cukup membaca alamat memori yang sama tanpa mengulang parsing file.',
        'Pola <b>data per VU</b> membuat perilaku tiap VU konsisten — dua VU tak memakai akun yang sama pada saat bersamaan.',
        'Pola <b>data per iterasi</b> membuat tiap putaran memakai baris berbeda, dan modulo (<code>%</code>) membuat data dipakai ulang bergilir ketika baris lebih sedikit daripada VU atau iterasi.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Membaca File dengan open() dan openBinary()</h3><p>Ketika datamu bukan JSON, k6 menyediakan <code>open(path)</code> untuk mengembalikan isi file sebagai string dan <code>openBinary(path)</code> untuk berkas biner (misalnya gambar atau PDF untuk diunggah). Keduanya hanya boleh dipanggil di <b>init context</b> — bagian skrip yang dieksekusi sekali saat VU disiapkan, bukan di dalam fungsi bawaan. CSV paling mudah diuraikan sendiri: pisahkan baris, buang judul, lalu pecah berdasarkan koma.</p><h3>Data Unik dan Anti-Tabrakan</h3><p>Satu aturan emas: <b>buat data baru setiap iterasi, jangan mengandalkan ID hasil tes sebelumnya</b>. Server sering menolak duplikat; bila tidak, dua VU bisa diam-diam saling menimpa sehingga hasil tes tak dapat diulang. Rumus selalu aman: gabungan <b>timestamp + __VU + __ITER</b>:</p><ul><li><code>"INV-" + Date.now() + "-" + __VU + "-" + __ITER</code> — unik bahkan bila dua tes dijalankan berdekatan.</li><li><code>"user-" + __VU + "-" + __ITER + "@example.test"</code> — surel uji dengan domain dummy yang tidak mengirim apa pun.</li><li>Data yang harus bertahan (misalnya daftar produk) dibuat sekali di <code>setup()</code> dengan prefix <code>FIXTURE-</code> agar mudah dibersihkan.</li></ul>'
    },
    {
      type: 'example',
      title: 'Contoh: Membaca CSV dengan open() dan Membuat Referensi Unik',
      lang: 'javascript',
      output: false,
      code: `import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://api.demo.local';

// open() dipanggil di init context, bukan di dalam fungsi bawaan
const csvText = open('./data/orders.csv');

const rows = csvText
  .split('\\n')
  .slice(1) // buang baris judul
  .filter(function (line) { return line.trim() !== ''; })
  .map(function (line) {
    const cols = line.split(',');
    return { sku: cols[0].trim(), qty: parseInt(cols[1], 10) };
  });

export default function () {
  const row = rows[__ITER % rows.length];
  const reference = 'INV-' + Date.now() + '-' + __VU + '-' + __ITER;

  const res = http.post(
    BASE_URL + '/orders',
    JSON.stringify({ sku: row.sku, qty: row.qty, reference: reference }),
    { headers: { 'Content-Type': 'application/json' }, tags: { name: 'POST_orders' } }
  );

  check(res, {
    'order dari CSV dibuat': (r) => r.status === 201,
    'referensi unik terkirim': (r) => r.json().reference === reference,
    'jumlah baris CSV terbaca': () => rows.length > 0,
  });
}`,
      explain: [
        'Perhatikan <code>split("\\\\n")</code>: tanda backslash-n ditulis dalam string agar benar-benar memisahkan baris, dan <code>open()</code> dipanggil jauh di atas fungsi bawaan — persis syarat init context.',
        'Baris judul dibuang dengan <code>slice(1)</code>, baris kosong disaring, lalu tiap kolom dipetakan menjadi objek sehingga fungsi bawaan cukup memakai <code>row.sku</code> dan <code>row.qty</code>.',        '<b>reference</b> menggabungkan <code>Date.now()</code>, <code>__VU</code>, dan <code>__ITER</code> sehingga dua iterasi pada milidetik yang sama pun tetap berbeda; check terakhir memastikan file benar-benar terbaca.'
      ]
    },
    {
      type: 'tip',
      title: 'Tips: SharedArray Hanya Diisi dari Init Context',
      text: 'Fungsi inisialisasi <b>SharedArray</b> (dan <code>open()</code>) hanya dipanggil di init context — bagian skrip di luar <code>setup()</code>, fungsi bawaan, dan <code>teardown()</code>. Mengisinya dari fungsi bawaan akan error atau mengulang pembacaan file. Praktik terbaik: letakkan seluruh deklarasi data di bagian paling atas skrip dalam satu blok.'
    },
    {
      type: 'warn',
      title: 'Perhatian',
      text: 'Jangan pernah menaruh <b>token, password, atau data pribadi (PII)</b> sungguhan di file data uji. Pakai data dummy dengan domain contoh (<code>@example.test</code>), ambil rahasia dari environment variable atau secret manager, dan pastikan berkas data tidak ikut ter-commit. Satu file <code>users.json</code> berisi kredensial asli adalah kebocoran paling sering terjadi di proyek nyata.'
    },
    {
      type: 'vocab',
      items: [
        ['setup()', 'Fungsi yang berjalan sekali sebelum tes; hasilnya diserialisasi lalu dibagikan sebagai salinan ke semua VU.'],
        ['teardown()', 'Fungsi yang berjalan sekali setelah tes; membersihkan data uji dan tak berjalan bila proses dibunuh paksa.'],
        ['SharedArray', 'Struktur k6/data yang membaca file sekali per proses lalu membagikan array baca-saja hemat memori.'],
        ['Fixture', 'Data buatan khusus tes; biasanya dibuat di setup() dan dihapus di teardown().'],
        ['Data per VU', 'Pemilihan data berdasarkan nomor VU sehingga tiap VU memakai baris yang berbeda sepanjang tes.'],
        ['Data per iterasi', 'Pemilihan data berdasarkan nomor iterasi sehingga tiap putaran memakai baris yang berbeda.'],
        ['Imutability', 'Sifat data yang tak boleh diubah; elemen SharedArray dan salinan setup() bersifat baca-saja.'],
        ['Init context', 'Bagian skrip yang dieksekusi sekali saat VU disiapkan; tempat tunggal open() dan SharedArray.']
      ]
    }
  ],
  recap: [
    'setup() berjalan sekali sebelum tes untuk menyiapkan fixture dan data bersama; hasilnya dibagikan ke semua VU sebagai salinan ter-serialisasi yang tidak bisa diubah.',
    'teardown() membersihkan data uji setelah tes, tetapi tidak berjalan bila proses dihentikan paksa — siapkan pembersihan alternatif berbasis prefix.',
    'SharedArray membaca file sekali lalu dibagikan hemat memori; inisialisasinya wajib di init context dan wajib mengembalikan array.',
    'Pola data per VU memakai ( __VU - 1 ) % panjang dan pola data per iterasi memakai __ITER % panjang; data unik dibuat dari timestamp + __VU + __ITER.',
    'File dibaca dengan open()/openBinary(), dan rahasia tidak pernah masuk ke file data uji.'
  ]
});
