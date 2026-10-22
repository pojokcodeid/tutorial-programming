/* ============================================================
   Pelajaran Micro-Frontend — Bab 3: Shell, Routing & Lazy Loading
   ============================================================ */
'use strict';

window.MICROFRONTEND_LESSONS = window.MICROFRONTEND_LESSONS || [];

window.MICROFRONTEND_LESSONS.push({
  id: 'mf-shell-routing',
  title: 'Shell, Routing & Lazy Loading',
  chapter: 'Membangun',
  duration: '14 menit',
  intro: [
    'Shell adalah wajah produk: ia menentukan URL mana yang ada, bagian mana yang menampilkan remote mana, dan apa yang terjadi ketika sebuah remote gagal dimuat. Bab ini membangun shell TokoMicro selangkah demi selangkah — mulai dari peta rute, muat malas (<i>lazy loading</i>), sampai siklus hidup <code>mount</code>/<code>unmount</code>.',
    'Prinsip utamanya hanya satu: <b>shell mengatur, remote melayani</b>. Shell menentukan kapan sebuah remote dimuat dan dibongkar, tetapi tidak pernah tahu apa yang ada di dalamnya.',
    'Setelah bab ini kamu akan mampu membuat shell sendiri yang memetakan hash URL ke remote, memuatnya hanya ketika dibutuhkan, mendukung tautan langsung (<i>deep link</i>), dan tetap hidup ketika sebuah remote gagal.'
  ],
  objectives: [
    'Menjelaskan tugas shell dan batasan yang harus dijaganya',
    'Membangun peta rute hash ke modul remote',
    'Menerapkan muat malas berdasarkan rute aktif',
    'Memanggil siklus hidup mount/unmount dengan benar',
    'Menangani remote gagal muat tanpa menjatuhkan halaman'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Tugas dan Batasan Shell</h3><p>Shell memiliki empat tanggung jawab yang tidak bisa diwakilkan: <b>routing</b> (memetakan URL ke remote), <b>layout</b> (menyediakan slot DOM), <b>gaya dasar</b> (reset, design tokens, tipografi), dan <b>otentikasi global</b> (login, token, memblokir rute terproteksi). Selain itu ia juga memuat remote secara malas dan menangani kegagalan.</p><p>Yang <b>tidak</b> boleh dilakukan shell: memanggil API milik remote, menyimpan data bisnis remote, atau mengimpor berkas internal remote. Begitu shell melakukan salah satunya, batas kepemilikan menghilang dan kamu kembali ke monolith — hanya saja kali ini lebih sulit ditemukan penyebabnya.</p>'
    },
    {
      type: 'text',
      html: '<figure class="fig"><div class="fig-scroll"><svg viewBox=\"0 0 760 240\" width=\"760\" role=\"img\" aria-label=\"Alur shell: hash berubah, pilih remote dari peta rute, lazy load, mount ke slot, unmount remote sebelumnya\"><rect x=\"15\" y=\"80\" width=\"150\" height=\"60\" rx=\"8\" class=\"u-box\"/><text x=\"90\" y=\"106\" class=\"u-title\" text-anchor=\"middle\">#/#/#/keranjang</text><text x=\"90\" y=\"126\" class=\"u-lbl\" text-anchor=\"middle\">hash berubah</text><line x1=\"165\" y1=\"110\" x2=\"205\" y2=\"110\" class=\"u-line\" marker-end=\"url(#u-arrow)\"/><rect x=\"210\" y=\"65\" width=\"180\" height=\"90\" rx=\"8\" class=\"u-box\"/><text x=\"300\" y=\"90\" class=\"u-title\" text-anchor=\"middle\">peta rute</text><text x=\"300\" y=\"110\" class=\"u-lbl\" text-anchor=\"middle\">#/ → remote:header</text><text x=\"300\" y=\"128\" class=\"u-lbl\" text-anchor=\"middle\">#/keranjang → remote:cart</text><text x=\"300\" y=\"146\" class=\"u-lbl\" text-anchor=\"middle\">#/produk → remote:products</text><line x1=\"390\" y1=\"110\" x2=\"430\" y2=\"110\" class=\"u-line\" marker-end=\"url(#u-arrow)\"/><rect x=\"435\" y=\"65\" width=\"150\" height=\"90\" rx=\"8\" class=\"u-box\"/><text x=\"510\" y=\"90\" class=\"u-title\" text-anchor=\"middle\">lazy load</text><text x=\"510\" y=\"110\" class=\"u-lbl\" text-anchor=\"middle\">import(path)</text><text x=\"510\" y=\"128\" class=\"u-lbl\" text-anchor=\"middle\">unmount remote lama</text><text x=\"510\" y=\"146\" class=\"u-lbl\" text-anchor=\"middle\">mount remote baru</text><line x1=\"585\" y1=\"110\" x2=\"625\" y2=\"110\" class=\"u-line\" marker-end=\"url(#u-arrow)\"/><rect x=\"630\" y=\"80\" width=\"115\" height=\"60\" rx=\"8\" class=\"u-hl\"/><text x=\"687\" y=\"106\" class=\"u-title\" text-anchor=\"middle\">slot DOM</text><text x=\"687\" y=\"126\" class=\"u-lbl\" text-anchor=\"middle\">&lt;main id=\"app\"&gt;</text><line x1=\"90\" y1=\"140\" x2=\"90\" y2=\"190\" class=\"u-dash\"/><line x1=\"90\" y1=\"190\" x2=\"687\" y2=\"190\" class=\"u-dash\"/><text x=\"380\" y=\"215\" class=\"u-lbl\" text-anchor=\"middle\">deep link: hash dibaca saat aplikasi dibuka, bukan hanya saat navigasi berikutnya</text></svg></div><figcaption class=\"fig-cap\"><b>Gambar 3.1</b> — Alur dari perubahan hash sampai tampilan remote di slot DOM</figcaption></figure>'
    },
    {
      type: 'example',
      title: 'Peta rute dan pemilihan remote',
      lang: 'js',
      output: false,
      code: `// shell/routes.js — peta rute milik shell
// kuncinya: hanya shell yang tahu peta lengkap ini
export const ROUTES = {
  '':            { entry: 'shell/home.js',    guard: false },
  produk:        { entry: 'remotes/products/entry.js', guard: false },
  keranjang:     { entry: 'remotes/cart/entry.js',     guard: true  },
  riwayat:       { entry: 'remotes/history/entry.js',  guard: true  }
};

export function resolve(hash) {
  const key = (hash || '').replace(/^#\\/?/, '').split('?')[0];
  return ROUTES[key] || ROUTES[''];
}`,
      explain: [
        'Kunci objek adalah bagian hash setelah <code>#/</code>; nilai berisi jalur berkas entri remote dan penanda apakah rute butuh login.',
        'Fungsi <code>resolve</code> selalu mengembalikan sesuatu — kalau rute tidak dikenal, ia jatuh ke beranda, bukan menampilkan halaman kosong.',
        'Di proyek besar peta ini biasanya dibaca dari berkas <code>manifest.json</code> yang diperbarui oleh pipeline, bukan ditulis tangan seperti di atas.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Memuat Remote Secara Malas</h3><p><b>Lazy loading</b> berarti berkas sebuah remote hanya diunduh ketika rutenya terbuka. Pengguna yang berada di halaman produk tidak mengunduh berkas keranjang sama sekali. Dalam JavaScript modern, ini cukup satu baris: <code>await import(path)</code>.</p>'
    },
    {
      type: 'example',
      title: 'Siklus mount/unmount pada shell',
      lang: 'js',
      output: false,
      code: `// shell/shell.js — inti shell TokoMicro
const routes   = await import('./routes.js');
const busMod   = await import('../shared/bus.js');
const slot     = document.getElementById('app');
let current    = null;   // { unmount } remote yang sedang aktif

async function render() {
  const route = routes.resolve(location.hash);

  if (route.guard && !isLogin()) {
    location.hash = '#/login';
    return;
  }

  try {
    // 1) bongkar remote lama agar tidak ada listener tertinggal
    if (current) { current.unmount(); current = null; }

    // 2) muat remote baru (dinamis → berkasnya diunduh sekarang)
    const mod = await import('../' + route.entry);

    // 3) pasang ke slot yang disediakan shell
    await mod.mount(slot, { bus: busMod.bus, store: busMod.store });
    current = mod;
  } catch (err) {
    // 4) gagal? tampilkan pemulihan, jangan kosongkan halaman
    slot.innerHTML = errorBox('Remote belum tersedia');
    console.error('[shell] gagal memuat', route.entry, err);
  }
}

addEventListener('hashchange', render);
render();   // deep link: hash pertama kali juga ikut dirender`,
      explain: [
        'Urutannya penting: <b>unmount remote lama dulu, baru memuat remote baru</b>. Kalau dibalik, dua remote bisa hidup bersamaan dan berebut slot yang sama.',
        'Seluruh pemanggilan <code>mount</code> dibungkus try/catch — inilah <i>error boundary</i> versi paling dasar yang membuat remote rusak tidak menjatuhkan halaman.',
        '<code>render()</code> dipanggil sekali di akhir berkas saat aplikasi dibuka, sehingga tautan langsung ke <code>#/keranjang</code> tetap berfungsi tanpa pengguna harus menekan menu terlebih dulu.'
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: mini shell dengan dua remote',
      lang: 'html',
      hint: 'Jalankan lalu klik tombol navigasi. Perhatikan bagian "Bongkar" yang mencatat setiap unmount(). Tambahkan remote ketiga dengan meniru pola yang sama!',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Mini Shell</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 16px; }
    nav button { padding: 6px 12px; margin-right: 6px; cursor: pointer; }
    #app { border: 2px dashed #c7d2fe; border-radius: 10px; padding: 12px; margin-top: 10px; }
    #log { font-size: 12px; color: #666; margin-top: 10px; }
  </style>
</head>
<body>
  <h3>Mini Shell</h3>
  <nav>
    <button data-route="produk">Produk</button>
    <button data-route="keranjang">Keranjang</button>
  </nav>
  <main id="app"></main>
  <div id="log"></div>

  <script>
    const slot = document.getElementById('app');
    const log  = document.getElementById('log');

    // dua "remote" berkas terpisah — di sini disederhanakan jadi fungsi
    const remotes = {
      produk: {
        mount(el) {
          el.innerHTML = '<h4>Katalog</h4><p>Kopi Susu — Rp24.000</p>';
        },
        unmount() { log.textContent = 'unmount remote:produk ✓'; }
      },
      keranjang: {
        mount(el) {
          el.innerHTML = '<h4>Keranjang</h4><p>1 item — Rp24.000</p>';
        },
        unmount() { log.textContent = 'unmount remote:keranjang ✓'; }
      }
    };

    const ROUTES = { produk: 'produk', keranjang: 'keranjang' };
    let current = null;

    async function render() {
      const key = (location.hash || '#/produk').replace('#/', '');

      if (current) { current.unmount(); current = null; }

      try {
        const mod = remotes[ROUTES[key] || 'produk'];
        await mod.mount(slot);
        current = mod;
        log.textContent = 'mount remote:' + key + ' ✓';
      } catch (err) {
        slot.innerHTML = '<p style="color:#b91c1c">Remote gagal dimuat.</p>';
      }
    }

    document.querySelectorAll('nav button').forEach(function (b) {
      b.addEventListener('click', function () {
        location.hash = '#/' + b.dataset.route;
      });
    });

    addEventListener('hashchange', render);
    render();
  </script>
</body>
</html>`
    },
    {
      type: 'tip',
      title: 'Kunci Navigasi Ganda: Hanya Satu Pihak yang Mendengar Rute',
      text: 'Kesalahan klasik pemula: setiap remote memasang listener <code>hashchange</code> sendiri. Akibatnya ketika hash berubah, tiga remote berebut memproses rute — sebuah produk bisa tercatat dua kali di keranjang dan listener lama tetap hidup meski remote sudah dibongkar. Aturannya tegas: <b>hanya shell yang boleh mendengar perubahan rute</b>. Remote cukup tahu rutenya sendiri melalui <code>ctx.route</code> yang diberikan saat mount.'
    },
    {
      type: 'warn',
      title: 'Gagal Muat Bukan Berarti Halaman Kosong',
      text: 'Remote bisa gagal karena berkasnya belum dideploy, jaringan sedang bermasalah, atau kodenya melempar galat saat inisialisasi. Bila shell tidak menanganinya, pengguna melihat layar putih tanpa penjelasan dan tidak bisa navigasi ke mana pun. Sediakan kotak pemulihan berisi pesan ramah dan tombol <b>coba-lagi</b> yang memanggil ulang <code>render()</code> — perbaikan kecil dengan dampak besar terhadap ketahanan produk.'
    },
    {
      type: 'vocab',
      items: [
        ['Shell', 'Aplikasi induk pemilik layout, routing, gaya dasar, dan otentikasi global; memuat lalu membongkar remote.'],
        ['Peta rute (route map)', 'Daftar yang memetakan URL/hash ke jalur entri remote, sering kali berupa manifest.json yang diperbarui pipeline.'],
        ['Lazy loading', 'Pola memuat berkas hanya ketika dibutuhkan — berkas remote diunduh saat rutenya terbuka.'],
        ['Deep link', 'Kemampuan membuka URL langsung ke rute remote tertentu tanpa melewati halaman lain.'],
        ['Slot DOM', 'Elemen pada layout shell (misal <main id="app">) yang menjadi tempat mount() membangun antarmuka.'],
        ['Guard rute', 'Pemeriksaan sebelum remote dimount, misal memblokir rute keranjang bila pengguna belum login.'],
        ['Error boundary', 'Lapisan penangkap kegagalan di shell agar remote yang rusak tidak menjatuhkan seluruh halaman.'],
        ['Manifest remote', 'Berkas JSON berisi daftar remote beserta alamat entri dan versinya, dipakai shell saat runtime.']
      ]
    }
  ],
  recap: [
    'Shell bertugas routing, layout, gaya dasar, otentikasi global, memuat remote malas, dan menangani kegagalan — bukan mengelola data remote.',
    'Peta rute memetakan hash ke entri remote; di proyek besar berupa manifest.json yang diperbarui pipeline.',
    'Lazy loading dilakukan dengan import(path) dinamis: berkas diunduh ketika rutenya terbuka.',
    'Urutan siklus hidup yang benar: unmount remote lama → import remote baru → mount ke slot; seluruhnya dibungkus try/catch.',
    'Hanya shell yang boleh mendengar hashchange, dan render() harus juga dipanggil saat aplikasi dibuka agar deep link berfungsi.'
  ]
});
