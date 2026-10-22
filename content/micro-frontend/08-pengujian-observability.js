/* ============================================================
   Pelajaran Micro-Frontend — Bab 8: Pengujian, Ketahanan & Observabilitas
   ============================================================ */
'use strict';

window.MICROFRONTEND_LESSONS = window.MICROFRONTEND_LESSONS || [];

window.MICROFRONTEND_LESSONS.push({
  id: 'mf-pengujian-observability',
  title: 'Pengujian, Error Boundary & Observability',
  chapter: 'Operasional',
  duration: '14 menit',
  intro: [
    'Banyak tim memecah monolith menjadi micro-frontend lalu baru menyadari sesuatu setelah rilis pertama: <b>pengujian yang tadinya satu berkas kini tersebar di banyak pipeline</b>. Padahal rilis mandiri justru menuntut pengujian yang lebih terstruktur, bukan lebih longgar.',
    'Bab ini menyusun strategi pengujian empat lapis untuk TokoMicro — unit, kontrak, integrasi, dan E2E — lalu membahas dua hal yang membuat micro-frontend tetap waras di produksi: <b>error boundary</b> yang mengisolasi kegagalan dan <b>observability</b> yang membuat masalah cepat terlihat.',
    'Di bagian praktik kamu akan memasang penangkap galat di shell dan melihat bagaimana satu remote yang rusak tidak menjatuhkan halaman lain.'
  ],
  objectives: [
    'Menyusun strategi pengujian empat lapis untuk micro-frontend',
    'Menulis penguji kontrak untuk shared module dan bentuk event',
    'Mengimplementasikan error boundary pada shell',
    'Menambahkan log ber-remoteId dan metrik performa sederhana',
    'Menjalankan latihan kegagalan untuk menguji ketahanan'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Empat Lapis Pengujian</h3><p>Karena setiap remote diuji oleh timnya sendiri, yang harus dijaga adalah <b>batas</b> antarmereka. Empat lapis ini menutup mulai dari yang paling murah sampai yang paling mahal, dan masing-masing menangkap jenis kegagalan yang berbeda.</p>'
    },
    {
      type: 'text',
      html: '<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 240" width="760" role="img" aria-label="Empat lapis pengujian: unit di dalam remote, kontrak di shared, integrasi shell plus remote, E2E seluruh halaman"><rect x="40" y="150" width="680" height="56" rx="8" class="u-box"/><text x="380" y="174" class="u-title" text-anchor="middle">4 · E2E &amp; visual — seluruh halaman dengan remote sungguhan</text><text x="380" y="194" class="u-lbl" text-anchor="middle">Playwright · paling mahal · jalankan di CI terjadwal</text><rect x="120" y="96" width="520" height="50" rx="8" class="u-box"/><text x="380" y="118" class="u-title" text-anchor="middle">3 · Integrasi — shell memuat remote sungguhan</text><text x="380" y="136" class="u-lbl" text-anchor="middle">mount → unmount → mount ulang · tanpa listener tertinggal</text><rect x="200" y="44" width="360" height="48" rx="8" class="u-hl"/><text x="380" y="65" class="u-title" text-anchor="middle">2 · Kontrak — shared module &amp; bentuk event</text><text x="380" y="82" class="u-lbl" text-anchor="middle">cart:change · shape store · dipakai semua tim</text><rect x="285" y="2" width="190" height="38" rx="8" class="u-box"/><text x="380" y="26" class="u-title" text-anchor="middle">1 · Unit — milik tiap remote</text><text x="150" y="232" class="u-lbl" text-anchor="middle">murah, dijalankan tiap commit</text><text x="610" y="232" class="u-lbl" text-anchor="middle">mahal, dijalankan terjadwal</text></svg></div><figcaption class="fig-cap"><b>Gambar 8.1</b> — Semakin ke atas, semakin mahal; karena itu jalankannya semakin jarang</figcaption></figure>'
    },
    {
      type: 'example',
      title: 'Pengujian kontrak untuk shared module',
      lang: 'js',
      output: false,
      code: `// packages/shared/__tests__/store.test.js
// penguji ini dijalankan SEMUA tim — itulah gunanya
import { test, expect } from 'vitest';
import { store, bus } from '../store.js';

test('cart:change selalu membawa bentuk yang disepakati', () => {
  const received = [];
  const off = bus.on('cart:change', (payload) => received.push(payload));

  store.addItem({ id: 'p1', name: 'Kopi', price: 24000 });
  off();

  expect(received).toHaveLength(1);
  // setiap item wajib punya empat kunci ini
  expect(Object.keys(received[0][0]).sort())
    .toEqual(['id', 'name', 'price', 'qty']);
});

test('cart() mengembalikan salinan, bukan referensi asli', () => {
  store.addItem({ id: 'p2', name: 'Teh', price: 12000 });
  const a = store.cart();
  a.push({ id: 'x' });                 // coba menyuntik
  expect(store.cart()).toHaveLength(1); // state asli tidak berubah
});`,
      explain: [
        'Pengujian kontrak inilah yang menjaga tim-tim tetap selaras: bila Tim C mengubah bentuk payload, pipeline-nya gagal <b>sebelum</b> merusak header milik Tim A.',
        'Penguji kedua menegakkan prinsip bahwa store tidak boleh membocorkan referensi internal — kesalahan yang tidak pernah muncul di pengujian unit biasa.',
        'Karena berkas ini berada di folder shared, semua tim menjalankannya di pipeline masing-masing — kesepakatan yang ditegakkan oleh mesin, bukan oleh ingatan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Error Boundary: Mengisolasi Kegagalan</h3><p>Yang membedakan micro-frontend dari sekadar \"banyak berkas\" adalah kemampuannya <b>menggagal dengan anggun</b>. Shell membungkus setiap pemanggilan <code>mount()</code> dengan penangkap galat, lalu mengganti isi slot dengan antarmuka pemulihan. Navigasi tetap hidup, remote lain tetap tampil, dan tim pemilik remote bisa memperbaiki tanpa tekanan pengguna yang melihat layar kosong.</p>'
    },
    {
      type: 'example',
      title: 'Error boundary pada shell',
      lang: 'js',
      output: false,
      code: `// shell/shell.js — pembungkus kegagalan
async function mountSafe(mod, slot, ctx) {
  try {
    await mod.mount(slot, ctx);
  } catch (err) {
    console.error('[shell] mount gagal:', err);
    showFallback(slot, err, () => render());   // pesan + tombol coba-lagi
  }
}

function showFallback(slot, err, retry) {
  slot.innerHTML =
    '<div class="shell-fallback">' +
      '<p>Bagian ini sedang bermasalah. Timnya sudah diberi tahu.</p>' +
      '<button id="retry">Coba lagi</button>' +
    '</div>';
  slot.querySelector('#retry').addEventListener('click', retry);
}

// dengarkan juga galat async yang tidak tertangkap (misal Promise yang terlewat)
addEventListener('unhandledrejection', (e) => {
  console.error('[shell] promise gagal:', e.reason);
  e.preventDefault();               // jangan biarkan merambat ke penerima bawaan
});`,
      explain: [
        'Fungsi <code>mountSafe</code> adalah satu-satunya tempat yang memanggil <code>mount()</code> — karena itu seluruh remote otomatis terlindungi tanpa perlu menambahkan kode di masing-masing.',
        'Tombol coba-lagi memanggil ulang <code>render()</code>, yang akan mengimpor dan memasang ulang remote dari awal — cara paling bersih memulihkan keadaan.',
        '<code>unhandledrejection</code> menangkap kegagalan async yang lolos dari try/catch biasa, seperti Promise yang dibuat tanpa <code>await</code>.'
      ]
    },
    {
      type: 'live',
      title: 'Coba sendiri: satu remote rusak, halaman tetap hidup',
      lang: 'html',
      hint: 'Klik "Muat remote rusak" untuk memicu galat — perhatikan hanya slot yang terpengaruhi, navigasi tetap berfungsi. Lalu klik "Coba lagi".',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Error Boundary</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 16px; }
    nav button { padding: 6px 12px; margin-right: 6px; cursor: pointer; }
    #slot { border: 2px dashed #c7d2fe; border-radius: 10px; padding: 12px; margin-top: 10px; min-height: 60px; }
    .fallback { color: #b91c1c; }
    .ok { color: #047857; }
    button.retry { padding: 6px 12px; cursor: pointer; }
  </style>
</head>
<body>
  <h3>Error Boundary</h3>
  <nav>
    <button data-r="sehat">Muat remote sehat</button>
    <button data-r="rusak">Muat remote rusak</button>
  </nav>
  <main id="slot"></main>

  <script>
    const slot = document.getElementById('slot');

    const remotes = {
      sehat: {
        mount(el) { el.innerHTML = '<p class="ok">Remote sehat tampil normal.</p>'; }
      },
      rusak: {
        mount() { throw new Error('gagal inisialisasi remote (sengaja)'); }
      }
    };

    let current = null;

    function mountSafe(mod, el) {
      try { mod.mount(el); }
      catch (err) {
        el.innerHTML =
          '<div class="fallback">' +
            '<p>Bagian ini sedang bermasalah — halaman lain tetap berfungsi.</p>' +
            '<p style="font-size:12px">' + err.message + '</p>' +
            '<button class="retry">Coba lagi</button>' +
          '</div>';
        el.querySelector('.retry').addEventListener('click', function () {
          render('rusak');
        });
      }
    }

    function render(key) {
      try { if (current && current.unmount) current.unmount(); } catch (e) {}
      current = remotes[key];
      slot.innerHTML = '';
      mountSafe(current, slot);
    }

    document.querySelectorAll('nav button').forEach(function (b) {
      b.addEventListener('click', function () { render(b.dataset.r); });
    });

    render('sehat');
  </script>
</body>
</html>`
    },
    {
      type: 'text',
      html: '<h3>Observability: Melihat Apa yang Terjadi</h3><p>Ketika sebuah halaman tersusun dari banyak remote, pertanyaan \"remote mana yang bermasalah?\" harus bisa dijawab dalam hitungan menit. Caranya sederhana dan murah: <b>setiap log mencatat remoteId</b>, setiap kegagalan dikirim ke layanan pemantauan, dan setiap rilis dicatat sebagai penanda agar perubahan metrik bisa dikaitkan dengan siapa yang merilis.</p>'
    },
    {
      type: 'example',
      title: 'Log ber-remoteId dan anggaran performa',
      lang: 'js',
      output: false,
      code: `// shell/logger.js — pencatatan yang bisa ditelusuri
export function log(remoteId, level, message, extra) {
  const entry = { remoteId, level, message, ...extra, t: Date.now() };
  console[level] ? console[level]('[remote:' + remoteId + ']', message, extra || '')
                 : console.log(entry);

  // kirim ke layanan pemantauan (Sentry, dsb.) untuk level error
  if (level === 'error' && window.__monitor) window.__monitor.capture(entry);
}

// pemakaian dari mana pun:
log('cart', 'error', 'mount gagal', { err: String(e) });

// shell/perf.js — memantau waktu muat tiap remote
export function catatWaktuMuat(remoteId, mulai) {
  const durasi = performance.now() - mulai;
  performance.mark('remote:' + remoteId + ':selesai');
  log('shell', 'info', 'remote dimuat', { remoteId, durasiMs: Math.round(durasi) });

  // anggaran: bila lewat 800ms, catat sebagai peringatan
  if (durasi > 800) log(remoteId, 'warn', 'melebihi anggaran muat', { durasiMs: durasi });
}`,
      explain: [
        'Dengan <code>remoteId</code> di setiap baris log, kamu bisa menyaring \"semua error milik cart minggu ini\" tanpa menebak-nebak dari tumpukan pesan yang seragam.',
        'Catatan waktu muat memungkinkan kamu mengetahui remote mana yang melambat setelah sebuah rilis — informasi yang tidak muncul dari pengujian lokal.',
        'Anggaran muat (<i>performance budget</i>) mengubah angka menjadi peringatan otomatis, sehingga degradasi terdeteksi tanpa harus membuka dasbor setiap hari.'
      ]
    },
    {
      type: 'tip',
      title: 'Latihan Kegagalan: Simulasikan Remote yang Hilang',
      text: 'Sekali sebulan, lakukan latihan kecil: buka aplikasi, matikan akses ke satu berkas remote lewat <i>devtools</i> atau aturan firewall, lalu perhatikan apa yang pengguna lihat. Bila hasilnya halaman kosong tanpa penjelasan, itulah pekerjaan berikutnya. Latihan seperti ini murah, cepat, dan hampir selalu menemukan sesuatu yang tidak terpikirkan saat menulis kode.'
    },
    {
      type: 'warn',
      title: 'Jangan Biarkan Pengujian Hanya Ada di Satu Sisi',
      text: 'Bila hanya remote yang diuji sedangkan shell tidak pernah diuji memuatnya sungguhan, kamu akan menemukan kegagalan integrasi tepat di produksi — misal shell memanggil <code>mount</code> dengan urutan berbeda dari yang diharapkan remote. Sediakan minimal satu pengujian integrasi yang benar-benar memuat remote lalu membongkarnya, dan periksa bahwa tidak ada listener yang tersisa. Lapisan inilah yang menjaga janji \"rilis mandiri tanpa saling merusak\".'
    },
    {
      type: 'vocab',
      items: [
        ['Pengujian kontrak', 'Penguji yang memeriksa bentuk bersama: struktur payload event, antarmuka store, dan kesepakatan lain yang dipakai lintas tim.'],
        ['Error boundary', 'Lapisan penangkap kegagalan di shell agar remote yang rusak tidak menjatuhkan halaman.'],
        ['unhandledrejection', 'Peristiwa yang menandai sebuah Promise gagal tanpa tertangkap try/catch.'],
        ['Fallback', 'Tampilan pengganti yang ramah (pesan + tombol coba-lagi) ketika sebuah remote gagal dimuat.'],
        ['Observability', 'Kemampuan memahami keadaan sistem dari luarnya lewat log, metrik, dan jejak.'],
        ['remoteId', 'Penanda pada setiap baris log yang menunjukkan remote mana yang menghasilkannya.'],
        ['Anggaran performa', 'Batas waktu muat yang disepakati; bila dilewati, sistem memberi peringatan otomatis.'],
        ['Latihan kegagalan', 'Simulasi terencana menghilangkan satu komponen untuk menguji ketahanan halaman.']
      ]
    }
  ],
  recap: [
    'Strategi pengujian empat lapis: unit (milik remote), kontrak (shared module), integrasi (shell memuat remote), dan E2E/visual (seluruh halaman).',
    'Pengujian kontract menjaga tim tetap selaras: perubahan bentuk event atau store tertangkap di pipeline sebelum merusak tim lain.',
    'Error boundary membungkus mount() di shell sehingga remote yang rusak hanya mengganti isi slot-nya, bukan seluruh halaman.',
    'Setiap log wajib memuat remoteId, dan waktu muat dicatat dengan anggaran agar degradasi cepat terdeteksi.',
    'Latihan kegagalan berkala mengungkap masalah ketahanan yang tidak pernah terlihat dari kode.'
  ]
});
