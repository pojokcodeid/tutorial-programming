/* ============================================================
   Pelajaran Micro-Frontend — Bab 6: Data, API & Autentikasi
   ============================================================ */
'use strict';

window.MICROFRONTEND_LESSONS = window.MICROFRONTEND_LESSONS || [];

window.MICROFRONTEND_LESSONS.push({
  id: 'mf-data-api-auth',
  title: 'Data, API, BFF & Autentikasi',
  chapter: 'Membangun',
  duration: '14 menit',
  intro: [
    'Bila komposisi adalah jantung micro-frontend, maka <b>data</b> adalah darahnya. Bagaimana remote mengambil data, siapa yang menyimpan token, dan bagaimana keadaan ketika koneksi terputus — semua itu menentukan apakah arsitektur ini terasa cepat atau berantakan.',
    'Bab ini menetapkan tiga aturan yang dipakai TokoMicro: setiap remote memanggil <b>API miliknya sendiri</b>, shell menangani <b>autentikasi global</b>, dan kebutuhan agregasi diatasi dengan <b>BFF</b> ketika service sudah banyak. Di bagian praktik kamu akan menerapkan pembatalan request dengan <code>AbortController</code>.'
  ],
  objectives: [
    'Menjelaskan mengapa remote tidak boleh memanggil API remote lain',
    'Menerapkan pola Backend for Frontend untuk agregasi data',
    'Menempatkan token autentikasi di shell dan menyebarkannya lewat context',
    'Menghentikan request yang menggantung dengan AbortController',
    'Menangani kegagalan jaringan dengan tampilan yang jujur kepada pengguna'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Aturan Satu: Remote Memanggil API-nya Sendiri</h3><p>Ketika remote keranjang butuh data produk, godaan terbesarnya adalah memanggil API milik remote katalog. Cara ini bekerja — sampai katalog mengubah bentuk responsnya, lalu keranjang ikut rusak dan keduanya harus dirilis bersamaan. Inilah <i>distributed monolith</i> yang menyusup diam-diam: modul yang berpura-pura terpisah padahal tetap harus serentak.</p><p>Aturan yang dipegang TokoMicro: <b>remote hanya boleh memanggil API backend miliknya sendiri</b>. Bila keranjang butuh data produk, data itu datang dari <i>backend</i> (satu sumber kebenaran) atau melalui event — bukan dengan meminjam endpoint milik remote lain.</p>'
    },
    {
      type: 'example',
      title: 'Remote mengambil data sendiri',
      lang: 'js',
      output: false,
      code: `// remotes/products/entry.js — katalog mengambil datanya sendiri
const API = '/api/products';        // endpoint milik tim katalog

export async function mount(container, ctx) {
  container.innerHTML = '<div class="pf-panel">Memuat katalog…</div>';

  try {
    const res = await fetch(API, { signal: ctx.signal });   // ikut dibatalkan unmount
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    container.innerHTML = '<div class="pf-panel">' +
      data.map(p =>
        '<div class="pf-item">' +
          '<div>' + p.name + '<div class="pf-muted">' + p.desc + '</div></div>' +
          '<div class="pf-price">Rp' + p.price.toLocaleString('id-ID') + '</div>' +
        '</div>').join('') +
      '</div>';

    // tombol tambah memakai shared store — bukan memanggil API cart
    container.querySelectorAll('[data-add]').forEach(btn => {
      btn.addEventListener('click', () => ctx.store.addItem(p));
    });
  } catch (err) {
    if (err.name === 'AbortError') return;   // sengaja dibatalkan, bukan kegagalan
    container.innerHTML = '<div class="pf-panel">Katalog tidak tersedia. ' +
      '<button class="pf-btn" data-retry>Coba lagi</button></div>';
  }
}`,
      explain: [
        '<code>signal</code> dari objek context dipakai agar request ikut <b>dibatalkan</b> ketika remote dibongkar — jawaban server yang datang terlambat tidak akan menulis ke DOM yang sudah dihapus.',
        'Ketika fetch gagal, remote menampilkan tampilan kegagalan yang jujur lengkap dengan tombol coba-lagi, bukan layar kosong yang membingungkan.',
        'Menambah produk ke keranjang dilakukan lewat <code>ctx.store.addItem()</code> — shared module, bukan pemanggilan HTTP ke remote lain.'
      ]
    },
    {
      type: 'text',
      html: '<h3>BFF: Satu Pintu untuk Frontend</h3><p>Ketika sebuah halaman membutuhkan data dari lima microservice, setiap remote yang menggabungkan sendiri berarti lima remote memahami lima kontrak berbeda. Di titik inilah <b>Backend for Frontend</b> (BFF) berguna: satu server yang menyediakan <b>satu endpoint per halaman</b>, menggabungkan panggilan ke banyak service di belakangnya, lalu menyerahkan data yang sudah siap pakai.</p>'
    },
    {
      type: 'text',
      html: '<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 250" width="760" role="img" aria-label="Tiga remote memanggil BFF, lalu BFF menggabungkan tiga microservice backend"><rect x="30" y="30" width="150" height="46" rx="8" class="u-box"/><text x="105" y="58" class="u-title" text-anchor="middle">remote: products</text><rect x="30" y="100" width="150" height="46" rx="8" class="u-box"/><text x="105" y="128" class="u-title" text-anchor="middle">remote: cart</text><rect x="30" y="170" width="150" height="46" rx="8" class="u-box"/><text x="105" y="198" class="u-title" text-anchor="middle">remote: header</text><line x1="180" y1="53" x2="265" y2="88" class="u-line" marker-end="url(#u-arrow)"/><line x1="180" y1="123" x2="265" y2="115" class="u-line" marker-end="url(#u-arrow)"/><line x1="180" y1="193" x2="265" y2="145" class="u-line" marker-end="url(#u-arrow)"/><rect x="270" y="70" width="160" height="90" rx="8" class="u-hl"/><text x="350" y="98" class="u-title" text-anchor="middle">BFF</text><text x="350" y="118" class="u-lbl" text-anchor="middle">satu endpoint /halaman</text><text x="350" y="136" class="u-lbl" text-anchor="middle">gabung + siapkan data</text><text x="350" y="152" class="u-lbl" text-anchor="middle">token &amp; rate limit</text><line x1="430" y1="90" x2="530" y2="60" class="u-line" marker-end="url(#u-arrow)"/><line x1="430" y1="115" x2="530" y2="115" class="u-line" marker-end="url(#u-arrow)"/><line x1="430" y1="140" x2="530" y2="172" class="u-line" marker-end="url(#u-arrow)"/><rect x="535" y="38" width="190" height="44" rx="8" class="u-box"/><text x="630" y="65" class="u-title" text-anchor="middle">service: katalog</text><rect x="535" y="93" width="190" height="44" rx="8" class="u-box"/><text x="630" y="120" class="u-title" text-anchor="middle">service: transaksi</text><rect x="535" y="148" width="190" height="44" rx="8" class="u-box"/><text x="630" y="175" class="u-title" text-anchor="middle">service: notifikasi</text><text x="350" y="228" class="u-lbl" text-anchor="middle">frontend cukup mengenal satu kontrak: milik BFF</text></svg></div><figcaption class="fig-cap"><b>Gambar 6.1</b> — BFF menyederhanakan lima kontrak backend menjadi satu kontrak frontend</figcaption></figure>'
    },
    {
      type: 'example',
      title: 'BFF menggabungkan beberapa service',
      lang: 'js',
      output: false,
      code: `// bff/routes/halaman-produk.js — BFF TokoMicro
export async function halamanProduk(req) {
  const [produk, ulasan] = await Promise.all([
    callService('catalog',  '/products/' + req.params.id),
    callService('review',   '/reviews?product=' + req.params.id)
  ]);

  // bentuk data SIAP PAKAI — remote tidak perlu menggabungkan apa pun
  return {
    id: produk.id,
    nama: produk.name,
    harga: produk.price,
    deskripsi: produk.desc,
    rating: {
      rata: ulasan.average,
      jumlah: ulasan.count
    }
  };
}`,
      explain: [
        'Dua panggilan service dijalankan berdampingan dengan <code>Promise.all</code> — penggabungan yang tadinya diulang di setiap remote kini terjadi sekali di BFF.',
        'Yang diserahkan ke frontend adalah data yang <b>sudah siap ditampilkan</b>, termasuk penghitungan rating. Remote cukup merender, bukan berpikir soal bentuk data mentah.',
        'BFF juga tempat alami untuk menyimpan rahasia (kunci service) dan menerapkan kebijakan seperti rate limit atau personalisasi per pengguna.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Autentikasi: Milik Shell</h3><p>Token adalah keputusan halaman, maka tanggung jawab <b>shell</b>. Ia menyediakan halaman login, menyimpan token, memperpanjangnya secara diam-diam (<i>silent refresh</i>), dan memblokir rute terproteksi sebelum remote dimuat. Remote cukup menerima token melalui <code>ctx.token</code> saat dipanggil <code>mount()</code>.</p>'
    },
    {
      type: 'example',
      title: 'Shell menjaga rute dan menyebarkan token',
      lang: 'js',
      output: false,
      code: `// shell/auth.js — otentikasi global TokoMicro
export const auth = {
  token: localStorage.getItem('tm.token') || null,

  async login(email, password) {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error('Login gagal');
    const { token } = await res.json();
    this.token = token;
    localStorage.setItem('tm.token', token);   // cukup satu tempat saja
  },

  logout() {
    this.token = null;
    localStorage.removeItem('tm.token');
    location.hash = '#/';                     // kembali ke halaman aman
  },

  isLoggedIn() { return !!this.token; }
};

// shell/shell.js — guard dipakai sebelum remote dimuat
if (route.guard && !auth.isLoggedIn()) {
  location.hash = '#/login';
  return;
}

// ctx yang diterima remote sudah membawa token
await mod.mount(slot, { bus, store, token: auth.token, signal });`,
      explain: [
        'Guard dijalankan <b>sebelum</b> remote dimuat — remote yang butuh login tidak perlu menulis pemeriksaan tokennya sendiri.',
        'Token hidup di satu tempat milik shell; remote menerimanya lewat context sehingga tidak ada salinan token yang tersebar di banyak berkas.',
        'Untuk aplikasi produksi, pertimbangkan cookie <code>httpOnly</code> yang dikelola backend agar token tidak bisa dibaca skrip — polanya sama, hanya penyimpanannya yang berpindah.'
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: AbortController membatalkan request',
      lang: 'html',
      hint: 'Jalankan, klik "Muat" lalu segera klik "Batal" — catatan di bawah mencatat pembatalan. Biarkan sampai selesai untuk melihat perbandingannya.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>AbortController</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 16px; }
    button { padding: 6px 12px; margin-right: 6px; cursor: pointer; }
    #log { font-size: 13px; margin-top: 10px; white-space: pre-line; }
  </style>
</head>
<body>
  <h3>Pembatalan Request</h3>
  <button id="muat">Muat data (3 detik)</button>
  <button id="batal">Batalkan</button>
  <div id="log">Belum ada aktivitas.</div>

  <script>
    const log = document.getElementById('log');
    let controller = null;

    // tiruan request lambat: resolve setelah 3 detik
    function requestData(signal) {
      return new Promise(function (resolve, reject) {
        const t = setTimeout(function () {
          resolve({ nama: 'Kopi Susu', harga: 24000 });
        }, 3000);

        signal.addEventListener('abort', function () {
          clearTimeout(t);                       // hentikan pekerjaannya
          const e = new Error('dibatalkan');
          e.name = 'AbortError';
          reject(e);
        });
      });
    }

    document.getElementById('muat').addEventListener('click', async function () {
      if (controller) return;
      controller = new AbortController();
      log.textContent = 'Memuat… (coba klik Batal)';

      try {
        const data = await requestData(controller.signal);
        log.textContent = 'Selesai: ' + data.nama + ' — Rp' +
          data.harga.toLocaleString('id-ID');
      } catch (err) {
        log.textContent = err.name === 'AbortError'
          ? 'Request dibatalkan — tidak ada DOM yang disentuh, bandwidth hemat.'
          : 'Gagal: ' + err.message;
      } finally {
        controller = null;
      }
    });

    document.getElementById('batal').addEventListener('click', function () {
      if (controller) controller.abort();
    });
  </script>
</body>
</html>`
    },
    {
      type: 'tip',
      title: 'Satu Remote, Satu AbortController',
      text: 'Buat satu <code>AbortController</code> di awal <code>mount()</code>, simpan <code>signal</code>-nya, lalu serahkan ke setiap fetch milik remote itu. Saat <code>unmount()</code> dipanggil, cukup satu baris <code>controller.abort()</code> untuk membatalkan seluruh request yang masih menggantung — tanpa perlu mengingat satu per satu. Pola ini menjaga pengguna yang berpindah-pindah rute dengan cepat agar tidak mengumpulkan request yang sia-sia.'
    },
    {
      type: 'warn',
      title: 'Jangan Simpan Token di Shared Store yang Bisa Dibaca Semua Remote',
      text: 'Shared store memang mudah dibaca siapa pun, tetapi token bukanlah data biasa. Simpan token di satu tempat milik shell (localStorage atau cookie httpOnly), lalu serahkan nilainya melalui <code>ctx.token</code> saat mount. Semakin banyak salinan token, semakin luas jejak yang harus dibersihkan ketika terjadi kebocoran — dan semakin mudah sebuah remote yang longgar jangkauannya ikut membaca token.'
    },
    {
      type: 'vocab',
      items: [
        ['BFF (Backend for Frontend)', 'Server yang menyediakan satu endpoint per halaman, menggabungkan beberapa service dan menyiapkan data siap pakai.'],
        ['Guard rute', 'Pemeriksaan login di shell yang dijalankan sebelum remote dimuat.'],
        ['Silent refresh', 'Perpanjangan token secara diam-diam agar pengguna tidak perlu login ulang.'],
        ['AbortController', 'Pembatal request: satu panggilan abort() menghentikan semua fetch yang memakai signal-nya.'],
        ['Agregasi data', 'Menggabungkan hasil dari beberapa service menjadi satu bentuk data yang siap ditampilkan.'],
        ['Satu sumber kebenaran', 'Prinsip bahwa sebuah data hanya punya satu tempat penyimpanan resmi.'],
        ['Rate limit', 'Batas jumlah permintaan yang diperbolehkan dalam periode tertentu, umumnya diterapkan di BFF.'],
        ['Cookie httpOnly', 'Cookie yang tidak bisa dibaca skrip peramban — tempat paling aman menyimpan token.']
      ]
    }
  ],
  recap: [
    'Setiap remote memanggil API backend miliknya sendiri; memanggil API remote lain mengubah modul mandiri menjadi distributed monolith.',
    'BFF menyediakan satu endpoint per halaman, menggabungkan beberapa service, dan menyerahkan data siap pakai.',
    'Autentikasi milik shell: satu halaman login, satu penyimpanan token, guard dijalankan sebelum remote dimuat, token disebarkan lewat ctx.token.',
    'AbortController menghentikan request yang menggantung ketika remote dibongkar — satu abort() cukup untuk seluruh request remote itu.',
    'Kegagalan jaringan ditampilkan dengan tampilan yang jujur dan tombol coba-lagi, bukan halaman kosong.'
  ]
});
