'use strict';
/* Pembuat js/assets.js — embed aset lokal jadi data: URL. */
const fs = require('fs');
const path = require('path');
const ROOT = '/Volumes/Asep/Youtube/tutorial';

const sample = fs.readFileSync(path.join(ROOT, 'assets/sample.svg'), 'utf8');
const logo = fs.readFileSync(path.join(ROOT, 'assets/logo.svg'), 'utf8');
const wav = fs.readFileSync(path.join(ROOT, 'assets/beep.wav')).toString('base64');

// pilih pembungkus string yang aman (tidak ada backtick/${ di dalam konten)
const isSafeTpl = (s) => !/`|\$\{/.test(s);

function esc2(s) { return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${'); }

const out = `/* ============================================================
   assets.js — aset lokal yang di-embed sebagai data: URL.
   Mengapa? Pratinjau memakai iframe sandbox (origin opaque) yang
   TIDAK boleh memuat subresource file:// — mis. gambar & audio
   lokal tidak akan tampil saat aplikasi dibuka lewat file://.
   Solusi: referensi ke assets/ di-rewrite jadi data: URL saat
   membangun dokumen pratinjau, sehingga tetap tampil offline.

   CATATAN: kalau kamu mengganti isi file di folder assets/,
   perbarui juga salinannya di bagian bawah file ini.
   ============================================================ */
'use strict';

const BK_ASSETS = (() => {

  /* ---- isi aset (salinan dari folder assets/) ---- */
  const SVG = {
    'assets/sample.svg': ${isSafeTpl(sample) ? '`' + sample + '`' : JSON.stringify(sample)},
    'assets/logo.svg': ${isSafeTpl(logo) ? '`' + logo + '`' : JSON.stringify(logo)},
  };
  const B64 = {
    'assets/beep.wav': '${wav}',
  };

  function dataUrl(path) {
    if (SVG[path]) return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(SVG[path]).replace(/'/g, '%27');
    if (B64[path]) return (path.endsWith('.wav') ? 'data:audio/wav;base64,' : 'data:application/octet-stream;base64,') + B64[path];
    return null;
  }

  /* Rewrite src=/href=/poster= yang menunjuk aset lokal menjadi data: URL.
     Kode yang ditampilkan ke siswa (di blok kode) TIDAK ikut diubah —
     hanya dokumen pratinjau yang memakai fungsi ini. */
  function inlineLocal(code) {
    if (typeof code !== 'string') return code;
    return String(code).replace(/\\b(src|href|poster)\\s*=\\s*(["'])(assets\\/[A-Za-z0-9._-]+)\\2/gi, (m, attr, q, p) => {
      const d = dataUrl(p);
      return d ? attr + '=' + q + d + q : m;
    });
  }

  return { dataUrl, inlineLocal };
})();
`;

fs.writeFileSync(path.join(ROOT, 'js/assets.js'), out);
console.log('js/assets.js ditulis,', out.length, 'bytes');