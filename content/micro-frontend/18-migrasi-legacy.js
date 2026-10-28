/* ============================================================
   Pelajaran Micro-Frontend — Bab 18: Migrasi Bertahap dari
   Aplikasi Legacy
   ============================================================ */
'use strict';

window.MICROFRONTEND_LESSONS = window.MICROFRONTEND_LESSONS || [];

window.MICROFRONTEND_LESSONS.push({
  id: 'mf-migrasi-legacy',
  title: 'Migrasi Bertahap dari Aplikasi Legacy',
  chapter: 'Produksi & Evolusi',
  duration: '20 menit',
  intro: [
    'Aplikasi legacy jarang bisa dimatikan pada hari Senin lalu diganti sepenuhnya pada hari Selasa. Ia masih melayani pengguna, masih punya tautan yang dibagikan, dan mungkin masih menghasilkan pendapatan. Migrasi yang baik bukan penulisan ulang besar-besaran, melainkan perpindahan rute demi rute dengan jalan kembali.',
    'TokoMicro menyimpan contoh nyata di origin <code>4178</code>: katalog lama berupa HTML statis tanpa bundler. Shell memuatnya lewat iframe di rute <code>/katalog-lama</code>. Dari sana kamu bisa membandingkan iframe dengan remote React, memindahkan satu rute, dan memastikan tautan lama tetap bekerja.',
    'Bab ini membahas pola <b>strangler fig</b>, pilihan teknik komposisi, dual-run, redirect, SEO, autentikasi lintas aplikasi, dan kriteria kapan legacy boleh dihapus.'
  ],
  objectives: [
    'Menjelaskan pola strangler fig dan memilih rute pertama yang aman',
    'Membandingkan iframe, Web Component, import map, dan Module Federation',
    'Merencanakan dual-run, redirect, dan strategi SEO saat migrasi',
    'Menangani autentikasi lintas aplikasi tanpa membocorkan token',
    'Menentukan kriteria dan urutan penghapusan aplikasi legacy'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Legacy adalah Produk yang Masih Hidup</h3><p>Pola <b>strangler fig</b> meniru tanaman yang merambat di pohon lama: bagian baru tumbuh perlahan, mengambil trafik, dan akhirnya pohon lama tidak lagi diperlukan. Pada frontend, bagian baru adalah remote atau shell modern; bagian lama tetap melayani sampai rute baru terbukti setara.</p><p>Langkah pertama bukan menulis kode, melainkan membuat <b>inventaris rute</b>: URL apa yang ada, berapa trafiknya, siapa pemakainya, tautan mana yang dibagikan, dan rute mana yang paling sedikit risikonya. Di TokoMicro, katalog adalah kandidat pertama karena sifatnya read-only dan sudah punya remote pengganti.</p><p>Setiap langkah migrasi harus punya <b>kriteria kembali</b>: feature flag, redirect, atau versi lama yang masih dilayani. Tanpa itu, migrasi berubah menjadi pertaruhan.</p>'
    },
    {
      type: 'text',
      html: '<h3>Empat Teknik dan Kapan Dipakai</h3><table class="vocab"><tr><th>Teknik</th><th>Isolasi</th><th>Integrasi</th><th>Cocok untuk</th></tr><tr><td><b>iframe</b></td><td>Kuat: CSS dan JS terpisah</td><td>Lemah: state, router, auth, SEO terpisah</td><td>Jembatan sementara untuk legacy</td></tr><tr><td><b>Web Component</b></td><td>Shadow DOM mengisolasi gaya</td><td>Sedang: komunikasi lewat CustomEvent</td><td>Widget lintas framework</td></tr><tr><td><b>import map</b></td><td>Rendah: berbagi dokumen dan dependensi</td><td>Kuat untuk ESM, tetapi dikelola manual</td><td>Prototipe tanpa bundler</td></tr><tr><td><b>Module Federation</b></td><td>Sedang: batas modul, bukan sandbox</td><td>Kuat: React singleton, kontrak runtime</td><td>Aplikasi React dengan banyak tim</td></tr></table><p>Lab <code>examples/micro-frontend-techniques</code> memperagakan iframe, Web Component, dan import map di port 4180. Lab <code>examples/micro-frontend-webpack</code> menunjukkan Module Federation dengan Webpack 5 di port 4181/4182. Jalankan keduanya untuk merasakan perbedaan isolasi dan biaya integrasinya.</p>'
    },
    {
      type: 'example',
      title: 'LegacyView: iframe sebagai jembatan sementara',
      lang: 'tsx',
      output: false,
      code: `const LEGACY_URL = import.meta.env.VITE_LEGACY_URL ?? 'http://localhost:4178';

export function LegacyView({ ctx }: Props) {
  return (
    <section className="legacy">
      <h1>{ctx.t('legacy.title')}</h1>
      <p>{ctx.t('legacy.lead')}</p>
      <iframe
        className="legacy-frame"
        title="Aplikasi katalog lama"
        src={LEGACY_URL}
        loading="lazy"
        sandbox="allow-scripts allow-same-origin"
        referrerPolicy="no-referrer"
      />
      <a href={ctx.href('/katalog')}>Buka katalog baru</a>
    </section>
  );
}`,
      explain: [
        'Iframe memberi isolasi terbaik: CSS, JavaScript, dan router legacy tidak menyentuh dokumen shell. Itulah alasan teknik ini sering dipakai sebagai langkah pertama migrasi.',
        '<code>title</code> wajib agar pembaca layar dapat menjelaskan isi frame. <code>sandbox</code> membatasi kemampuan dokumen lama; sesuaikan izinnya dengan kebutuhan, jangan asal longgar.',
        'Harga yang dibayar: iframe tidak berbagi state keranjang, token, tema, atau router. Perpindahan ke remote React baru menghilangkan batas-batas itu.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Pindahkan Satu Rute, Bukan Seluruh Aplikasi</h3><p>Urutan migrasi TokoMicro yang realistis:</p><ol><li><b>Inventaris:</b> catat <code>/katalog</code>, <code>/katalog/detail/:id</code>, <code>/keranjang</code>, <code>/akun</code>, dan <code>/katalog-lama</code>.</li><li><b>Paritas:</b> pastikan remote produk menampilkan data, filter, dan detail yang sama dengan legacy.</li><li><b>Dual-run:</b> arahkan sebagian pengguna ke remote baru lewat flag, sisanya tetap ke iframe.</li><li><b>Redirect:</b> setelah paritas terbukti, alihkan URL lama ke URL baru sambil mempertahankan query.</li><li><b>Decommission:</b> hapus origin legacy setelah trafik dan tautan lama benar-benar nol.</li></ol><p>Redirect di shell dapat mempertahankan query lama:</p><pre><code>function LegacyRedirect() {\n  const location = useLocation();\n  return &lt;Navigate to={`/katalog${location.search}`} replace /&gt;;\n}\n\n&lt;Route\n  path="/katalog-lama"\n  element={ctx.flags.legacyCatalog ? &lt;LegacyView ctx={ctx} /&gt; : &lt;LegacyRedirect /&gt;}\n/&gt;</code></pre><p>Dengan flag, kamu bisa mematikan iframe tanpa menghapus kode lama. Bila metrik memburuk, nyalakan flag lagi dan pengguna kembali ke jalur yang sudah terbukti.</p>'
    },
    {
      type: 'text',
      html: '<h3>Auth, SEO, dan Tautan Lama</h3><p><b>Autentikasi.</b> Shell tetap pemilik login. Legacy katalog hanya membaca data publik, jadi ia tidak perlu token. Bila legacy benar-benar butuh sesi, jangan mengirim token lewat query string atau <code>postMessage("*")</code>. Gunakan cookie <code>httpOnly</code> pada domain yang tepat, atau <code>postMessage</code> dengan <code>targetOrigin</code> spesifik dan validasi <code>event.origin</code> di penerima.</p><p><b>SEO.</b> Isi iframe bukan bagian dari halaman induk: judul, meta, dan canonical milik shell tidak otomatis berlaku untuk dokumen lama. Selama rute baru masih CSR, pertahankan versi legacy yang server-rendered atau tambahkan prerender/SSR. Siapkan <b>redirect map</b> 301/308 dari URL lama ke URL baru, perbarui sitemap, dan jangan menghapus URL tanpa pengalihan.</p><p><b>Tautan lama.</b> Uji deep link yang mengandung query seperti <code>/katalog-lama?kategori=audio</code>. Redirect harus mempertahankan parameter agar kampanye dan bookmark tidak kehilangan konteks.</p>'
    },
    {
      type: 'example',
      title: 'Praktik: bandingkan iframe dan remote, lalu pindahkan satu rute',
      lang: 'bash',
      output: false,
      code: `cd examples/micro-frontend-react
npm run build && npm start

# 1. Buka kedua versi
#    http://localhost:4173/katalog-lama   (iframe ke 4178)
#    http://localhost:4173/katalog        (remote products 4175)

# 2. DevTools → Network
#    - dokumen HTML dari localhost:4178
#    - remoteEntry.js dan chunk dari localhost:4175

# 3. Tambah produk di /katalog, lihat badge header berubah.
#    Di dalam iframe tidak ada tombol tambah dan badge tidak berubah:
#    itu bukti state shell dan legacy tidak terhubung.

# 4. Ubah route /katalog-lama menjadi LegacyRedirect saat
#    flags.legacyCatalog bernilai false, lalu uji:
curl -s -o /dev/null -w "%{http_code}\\n" http://localhost:4173/katalog-lama

# 5. Buka /katalog-lama?kategori=audio di browser.
#    Pastikan URL akhir /katalog?kategori=audio; parameter tidak hilang saat redirect.

# 6. Periksa flag yang mengendalikan dual-run
curl -s http://localhost:4173/api/flags | python3 -m json.tool

# 7. Nyalakan legacyCatalog lagi, lalu buka /katalog-lama.
#    Iframe harus muncul kembali tanpa deploy ulang.`,
      explain: [
        'Perbandingan Network menunjukkan perbedaan mendasar: iframe memuat dokumen penuh dari origin lain, sedangkan remote memuat modul federasi ke dalam dokumen shell.',
        'Perbedaan tombol dan badge membuktikan iframe tidak berbagi keranjang. Ini bukan bug, melainkan batas yang harus kamu pahami sebelum memilih teknik migrasi.',
        'Redirect harus diuji dengan query, bukan hanya URL dasar. Tautan kampanye dan bookmark sering membawa parameter yang menentukan isi halaman.'
      ]
    },
    {
      type: 'warn',
      title: 'Iframe adalah Jembatan, Bukan Tujuan Akhir',
      text: 'Membiarkan iframe selamanya berarti memelihara dua UI, dua sistem autentikasi, dua design system, dan dua cara mengukur performa. Aksesibilitas juga lebih sulit karena fokus dan judul dokumen terpisah. Tetapkan tanggal peninjauan dan kriteria decommission sejak awal. Sebaliknya, jangan menghapus legacy secara mendadak hanya karena remote baru sudah tampak bagus di staging.'
    },
    {
      type: 'text',
      html: '<h3>Checkpoint: Migrasi yang Dapat Dibatalkan</h3><p>Sebelum menyatakan satu rute selesai, buktikan:</p><ul><li>Rute baru menampilkan data dan perilaku yang setara dengan legacy, termasuk filter dan detail.</li><li>URL lama tetap merespons dan mengarah ke rute baru tanpa kehilangan query.</li><li>Login, logout, dan pemulihan sesi bekerja sama seperti sebelumnya.</li><li>Tidak ada error di console, dan iframe memiliki <code>title</code> yang bermakna.</li><li>Flag <code>legacyCatalog</code> dapat mengembalikan iframe setelah server memuat flag baru, tanpa build ulang shell.</li><li>Metrik error, waktu muat, dan keluhan pengguna tidak memburuk setelah dual-run.</li></ul><p><b>Kriteria lulus:</b> kamu bisa memindahkan satu rute, membuktikan tautan lama masih bekerja, lalu mengembalikannya lewat flag tanpa deploy ulang. Setelah itu barulah legacy boleh dihapus.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Strangler fig', 'Pola migrasi bertahap yang menggantikan bagian lama satu per satu tanpa mematikan layanan.'],
        ['Dual-run', 'Menjalankan versi lama dan baru bersamaan untuk membandingkan perilaku dan metrik.'],
        ['Paritas', 'Kondisi ketika versi baru memiliki fungsi dan data yang setara dengan versi lama.'],
        ['Redirect map', 'Daftar pemetaan URL lama ke URL baru yang dipakai saat migrasi.'],
        ['Iframe', 'Dokumen terpisah yang dimuat di dalam halaman induk; isolasi kuat, integrasi lemah.'],
        ['Web Component', 'Custom element dengan Shadow DOM yang dapat dipakai lintas framework.'],
        ['Import map', 'Pemetaan nama modul ESM ke URL, memungkinkan pemuatan modul tanpa bundler.'],
        ['Decommission', 'Penghapusan resmi aplikasi atau rute lama setelah tidak lagi diperlukan.'],
        ['Parity test', 'Pengujian yang membandingkan perilaku versi baru dengan versi lama pada skenario yang sama.'],
        ['Feature flag', 'Saklar runtime untuk mengaktifkan atau mematikan perilaku tanpa deploy ulang.']
      ]
    }
  ],
  recap: [
    'Migrasi legacy adalah perpindahan rute demi rute dengan jalan kembali, bukan penulisan ulang sekaligus.',
    'Iframe memberi isolasi terbaik untuk langkah awal, tetapi tidak berbagi state, auth, router, atau SEO.',
    'Pilih teknik komposisi sesuai kebutuhan: iframe, Web Component, import map, atau Module Federation.',
    'Dual-run, redirect yang mempertahankan query, dan flag adalah alat untuk membatasi risiko.',
    'Legacy hanya boleh dihapus setelah paritas, metrik aman, dan tautan lama terverifikasi.'
  ]
});
