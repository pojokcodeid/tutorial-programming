/* ============================================================
   Pelajaran Micro-Frontend — Bab 2: Anatomi & Teknik Komposisi
   ============================================================ */
'use strict';

window.MICROFRONTEND_LESSONS = window.MICROFRONTEND_LESSONS || [];

window.MICROFRONTEND_LESSONS.push({
  id: 'mf-anatomi',
  title: 'Anatomi & Teknik Komposisi',
  chapter: 'Fondasi',
  duration: '14 menit',
  intro: [
    'Bagaimana sebuah remote benar-benar masuk ke dalam halaman? Bab ini menjawabnya dari dua sisi: <b>anatomi</b> — bentuk sebuah remote dan kontrak yang harus dipenuhinya, serta <b>teknik komposisi</b> — empat cara menggabungkan remote, mulai dari iframe sampai Module Federation.',
    'Kamu akan mengenal kontrak <code>mount(container, ctx)</code> dan <code>unmount()</code> yang menjadi kesepakatan universal micro-frontend, lalu membandingkan iframe, JavaScript entry, Web Components, dan Module Federation dalam satu tabel sehingga kamu bisa memilih dengan sadar, bukan ikut-ikutan.',
    'Di bagian praktik kamu akan membuat sebuah <b>Web Component</b> kecil yang bisa dipasang di halaman mana pun — bukti nyata bahwa sebuah potongan antarmuka bisa dibuat mandiri lalu dikomposisikan.'
  ],
  objectives: [
    'Menjelaskan struktur sebuah remote dan kontrak mount/unmount',
    'Membedakan empat teknik komposisi beserta kelebihan dan biayanya',
    'Memilih teknik komposisi sesuai kebutuhan produk',
    'Membuat custom element sederhana yang bisa dikomposisikan shell',
    'Mengenali tanda-tanda remote yang melanggar kontrak'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Anatomi Sebuah Remote</h3><p>Sebuah remote adalah aplikasi kecil yang lengkap. Yang membedakannya dari komponen biasa adalah satu hal: <b>ia tidak tahu ia akan dipasang di mana</b>. Ia hanya menyediakan dua pintu — <code>mount</code> untuk dipasang dan <code>unmount</code> untuk dibongkar — dan shell yang mengatur sisanya.</p>'
    },
    {
      type: 'example',
      title: 'Bentuk umum sebuah remote',
      lang: 'js',
      output: false,
      code: `// remote/entry.js — berkas masuk sebuah remote
let root = null;
let cleanup = null;

export function mount(container, ctx) {
  // 1. simpan slot DOM yang diberikan shell
  root = container;

  // 2. bangun antarmuka ke dalam slot itu (BUKAN ke document.body)
  root.innerHTML = '<div class="pf-panel">Kerangka produk</div>';

  // 3. mulai bekerja: dengarkan event, ambil data, pasang timer
  cleanup = ctx.bus.on('cart:change', (items) => {
    root.querySelector('.pf-panel').textContent = 'Item: ' + items.length;
  });
}

export function unmount() {
  // 4. lepas SEMUA yang pernah dipasang
  if (cleanup) cleanup();
  if (root) root.innerHTML = '';
  root = null;
}`,
      explain: [
        'Antarmuka dibangun ke <code>container</code> yang diberikan shell, bukan ke <code>document.body</code> — inilah yang membuat beberapa remote bisa hidup berdampingan dalam satu halaman.',
        'Objek <code>ctx</code> adalah satu-satunya jembatan remote ke dunia luar: event bus, state bersama, dan token. Remote tidak pernah mengimpor berkas milik remote lain.',
        'Fungsi <code>mount</code> mengembalikan fungsi pembatal (<i>disposer</i>) dari langganan event; disimpan lalu dipanggil di <code>unmount</code> agar tidak ada yang tertinggal.'
      ]
    },
    {
      type: 'tip',
      title: 'Rantai Cleanup: DOM, Listener, Timer, Request',
      text: 'Ada empat jenis peninggalan yang wajib dibersihkan unmount(): <b>DOM</b> yang kamu buat di container, <b>listener</b> yang dipasang pada window/document/event bus, <b>timer</b> (setInterval, setTimeout yang masih hidup), dan <b>request</b> yang masih menggantung. Simpan semua pembatalnya ke dalam satu array <code>cleanups</code>, lalu panggil semuanya saat unmount — pola ini jauh lebih mudah diawasi daripada mengingat satu per satu.'
    },
    {
      type: 'text',
      html: '<h3>Empat Teknik Komposisi</h3><p>\"Komposisi\" berarti menggabungkan remote menjadi satu halaman. Ada empat cara utama, dan masing-masing menempati titik berbeda antara isolasi dan kesatuan tampilan.</p>'
    },
    {
      type: 'text',
      html: '<figure class="fig"><div class="fig-scroll"><svg viewBox="0 0 760 250" width="760" role="img" aria-label="Empat teknik komposisi: iframe, JavaScript entry, Web Components, Module Federation"><rect x="15" y="55" width=\"170\" height=\"90\" rx=\"8\" class=\"u-box\"/><text x=\"100\" y=\"80\" class=\"u-title\" text-anchor=\"middle\">1. iframe</text><text x=\"100\" y=\"100\" class=\"u-lbl\" text-anchor=\"middle\">isolasi penuh</text><text x=\"100\" y=\"118\" class=\"u-lbl\" text-anchor=\"middle\">dokumen terpisah</text><text x=\"100\" y=\"136\" class=\"u-lbl\" text-anchor=\"middle\">postMessage</text><line x1=\"190\" y1=\"100\" x2=\"200\" y2=\"100\" class=\"u-line\"/><rect x=\"205\" y=\"55\" width=\"170\" height=\"90\" rx=\"8\" class=\"u-box\"/><text x=\"290\" y=\"80\" class=\"u-title\" text-anchor=\"middle\">2. JS entry</text><text x=\"290\" y=\"100\" class=\"u-lbl\" text-anchor=\"middle\">impor runtime</text><text x=\"290\" y=\"118\" class=\"u-lbl\" text-anchor=\"middle\">salah CSS bisa bocor</text><text x=\"290\" y=\"136\" class=\"u-lbl\" text-anchor=\"middle\">ringan, tanpa tooling</text><line x1=\"380\" y1=\"100\" x2=\"390\" y2=\"100\" class=\"u-line\"/><rect x=\"395\" y=\"55\" width=\"170\" height=\"90\" rx=\"8\" class=\"u-box\"/><text x=\"480\" y=\"80\" class=\"u-title\" text-anchor=\"middle\">3. Web Components</text><text x=\"480\" y=\"100\" class=\"u-lbl\" text-anchor=\"middle\">standar peramban</text><text x=\"480\" y=\"118\" class=\"u-lbl\" text-anchor=\"middle\">shadow DOM opsional</text><text x=\"480\" y=\"136\" class=\"u-lbl\" text-anchor=\"middle\">lintas framework</text><line x1=\"570\" y1=\"100\" x2=\"580\" y2=\"100\" class=\"u-line\"/><rect x=\"580\" y=\"55\" width=\"170\" height=\"90\" rx=\"8\" class=\"u-hl\"/><text x=\"665\" y=\"80\" class=\"u-title\" text-anchor=\"middle\">4. Module Fed.</text><text x=\"665\" y=\"100\" class=\"u-lbl\" text-anchor=\"middle\">manifest + bundler</text><text x=\"665\" y=\"118\" class=\"u-lbl\" text-anchor=\"middle\">berbagi dependensi</text><text x=\"665\" y=\"136\" class=\"u-lbl\" text-anchor=\"middle\">butuh konfigurasi</text><line x1=\"100\" y1=\"145\" x2=\"100\" y2=\"185\" class=\"u-line\" marker-end=\"url(#u-arrow)\"/><line x1=\"290\" y1=\"145\" x2=\"290\" y2=\"185\" class=\"u-line\" marker-end=\"url(#u-arrow)\"/><line x1=\"480\" y1=\"145\" x2=\"480\" y2=\"185\" class=\"u-line\" marker-end=\"url(#u-arrow)\"/><line x1=\"665\" y1=\"145\" x2=\"665\" y2=\"185\" class=\"u-line\" marker-end=\"url(#u-arrow)\"/><rect x=\"120\" y=\"190\" width=\"520\" height=\"44\" rx=\"8\" class=\"u-hd\"/><text x=\"380\" y=\"211\" class=\"u-title\" text-anchor=\"middle\">SHELL — memilih teknik per bagian halaman</text><text x=\"380\" y=\"227\" class=\"u-lbl\" text-anchor=\"middle\">bagian inti: JS entry atau Web Components · bagian asing: iframe</text></svg></div><figcaption class="fig-cap\"><b>Gambar 2.1</b> — Dari isolasi penuh (kiri) menuju kesatuan tampilan (kanan)</figcaption></figure>'
    },
    {
      type: 'example',
      title: 'Perbandingan empat teknik komposisi',
      lang: 'text',
      output: false,
      code: `TEKNIK           CARA KERJA                       KELEBIHAN                  BIAYA
───────────────  ────────────────────────────────  ─────────────────────────  ──────────────────────────────
iframe           <iframe src="remote.html">         isolasi CSS/JS penuh       pengaturan ukuran manual,
                                     + postMessage  remote asing tak merusak   navigasi janggal, SEO lemah

JS entry         shell mengimpor entri remote      sederhana, tanpa tooling   salah CSS bisa bocor ke
                 lalu memanggil mount(slot)         (cukup modul ES)           remote lain; pustaka bentrok

Web Components   remote merilis <app-cart>;         standar peramban,          perlu disiplin atribut &
                 shell menempatkannya di slot       bisa dicampur framework    kontrak nama elemen

Module           bundler memuat remoteEntry +       berbagi dependensi,        konfigurasi berat, perlu
Federation       manifest; shared singleton         rilis benar-benar mandiri  pemahaman bundler

Pilihan TokoMicro: JS entry (modul ES) karena proyek sengaja tanpa tooling —
prinsipnya sama dengan Module Federation, hanya konfigurasinya yang lebih ringan.`,
      explain: [
        'Tidak ada teknik yang paling benar secara mutlak: iframe dipilih untuk bagian yang tidak tepercaya atau benar-benar asing, sedangkan bagian inti produk umumnya memakai JS entry atau Web Components agar terasa menyatu.',
        'Module Federation memberi kemampuan paling lengkap (berbagi satu React untuk semua remote), tetapi juga menuntut konfigurasi dan pemahaman bundler paling dalam.',
        'Yang penting bukan tekniknya, melainkan <b>kontrak mount/unmount-nya tetap sama</b> — shell bisa menukar teknik komposisi tanpa mengubah cara remote bekerja.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Membuat Web Component</h3><p>Web Components adalah bukti paling jelas sifat <i>portable</i> sebuah remote: karena berbasis standar peramban, kode yang sama bisa dipasang di halaman React, Vue, atau HTML biasa tanpa perubahan apa pun. Cukup daftarkan elemen kustom sekali, lalu gunakan seperti tag biasa.</p>'
    },
    {
      type: 'live',
      title: 'Coba sendiri: Web Component produk',
      lang: 'html',
      hint: 'Jalankan, lalu ganti atribut nama dan harga pada <app-produk> — elemennya berubah sendiri tanpa menyentuh JavaScript.',
      initial: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Web Component Produk</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 16px; }
    app-produk { display: block; }
  </style>
</head>
<body>
  <h3>Komposisi remote</h3>

  <!-- dua "remote" berbeda, dipasang di halaman yang sama -->
  <app-produk nama="Kopi Susu" harga="24000" stok="8"></app-produk>
  <app-produk nama="Teh Manis" harga="12000" stok="0"></app-produk>

  <script>
    class ProdukEl extends HTMLElement {
      connectedCallback() {
        const nama = this.getAttribute('nama') || 'Produk';
        const harga = Number(this.getAttribute('harga') || 0);
        const stok = Number(this.getAttribute('stok') || 0);

        const box = document.createElement('div');
        box.style.cssText = 'border:1px solid #c7d2fe;border-radius:10px;' +
          'padding:10px 12px;margin:8px 0;max-width:280px';

        box.innerHTML =
          '<div style="font-weight:600">' + nama + '</div>' +
          '<div style="color:#6366f1">Rp' + harga.toLocaleString('id-ID') + '</div>' +
          '<div style="font-size:12px;color:#666">' +
            (stok > 0 ? stok + ' tersedia' : 'habis') + '</div>';

        this.appendChild(box);
      }
    }

    // daftarkan sekali — bisa dipakai di halaman mana pun
    customElements.define('app-produk', ProdukEl);
  </script>
</body>
</html>`
    },
    {
      type: 'warn',
      title: 'Nama Elemen adalah Kontrak',
      text: 'Karena nama elemen kustom berlaku global di seluruh peramban, <code>&lt;app-cart&gt;</code> hanya boleh didefinisikan satu kali di seluruh halaman. Bila dua remote mendaftarkan nama yang sama, peramban akan menolak definisi kedua dan elemennya berhenti bekerja — kesalahan yang membingungkan karena kodenya sendiri terlihat benar. Sepakati ruang nama sekali di awal (misal awalan <code>app-</code>), dan pastikan hanya satu pihak yang mendaftarkan setiap nama.'
    },
    {
      type: 'vocab',
      items: [
        ['Kontrak mount/unmount', 'Perjanjian dua fungsi yang diekspor remote: dipasang ke container yang diberikan shell, lalu dibongkar bersih saat rute ditinggalkan.'],
        ['Slot DOM', 'Elemen yang disediakan shell sebagai tempat sebuah remote membangun antarmukanya.'],
        ['Custom element', 'Elemen HTML buatan pengembang yang didaftarkan lewat customElements.define() dan dipakai seperti tag biasa.'],
        ['Shadow DOM', 'Lapisan DOM terisolasi yang menyembunyikan internal komponen dari CSS dan selektor halaman induk.'],
        ['Module Federation', 'Kemampuan bundler (Vite/Webpack) memuat modul dari proyek lain saat runtime, lengkap dengan berbagi dependensi bersama.'],
        ['remoteEntry.js', 'Berkas kecil hasil build yang menjadi pintu masuk sebuah remote — berisi peta modul yang bisa dimuat.'],
        ['Komposisi runtime', 'Penggabungan remote yang terjadi di peramban ketika halaman dibuka, bukan saat proses build.'],
        ['postMessage', 'Cara baku untuk berkomunikasi antardokumen, termasuk antara shell dan remote berbentuk iframe.']
      ]
    }
  ],
  recap: [
    'Sebuah remote mengekspor mount(container, ctx) untuk dipasang dan unmount() untuk dibongkar; ia tidak pernah tahu ia dipasang di mana.',
    'Empat teknik komposisi: iframe (isolasi penuh), JS entry (sederhana), Web Components (standar lintas framework), dan Module Federation (berbagi dependensi).',
    'Pilihan teknik bersifat per-bagian: bagian inti produk umumnya memakai JS entry/Web Components, bagian asing bisa memakai iframe.',
    'Karena nama custom element bersifat global, hanya satu pihak yang boleh mendaftarkan setiap nama elemen.',
    'Yang harus tetap sama walau teknik komposisi berganti adalah kontrak mount/unmount.'
  ]
});
