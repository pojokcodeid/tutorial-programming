/* ============================================================
   tests/smoke.js — uji asap (smoke test) logika aplikasi di Node
   Memuat file aplikasi asli dengan stub browser, lalu menjalankan
   alur: boot DB → registrasi → progres → kuis → ekspor.
   Jalankan: node tests/smoke.js
   ============================================================ */
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// ---- stub penyimpanan IndexedDB (in-memory) ----
const idbStore = new Map();
const IDBStub = {
  async get(k) { return idbStore.has(k) ? idbStore.get(k) : null; },
  async set(k, v) { idbStore.set(k, v); return true; },
  async remove(k) { idbStore.delete(k); return true; },
  async supports() { return true; }
};

const memStore = new Map(); // localStorage
const memSession = new Map(); // sessionStorage

const ctx = {
  console, TextEncoder, TextDecoder, Uint8Array, ArrayBuffer, Uint32Array, DataView,
  Math, JSON, Date, Promise, atob, btoa, setTimeout, clearTimeout,
  Event: class Event { constructor(type, opts) { this.type = type; this.bubbles = !!(opts && opts.bubbles); } },
  CustomEvent: class CustomEvent { constructor(type, opts) { this.type = type; this.bubbles = !!(opts && opts.bubbles); this.detail = opts && opts.detail; } },
  crypto: { getRandomValues: (a) => { for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256); return a; } },
  location: { hash: '#/', href: 'http://localhost/' },
  navigator: { userAgent: 'node-smoke' },
  addEventListener: () => {},
  localStorage: {
    getItem: k => memStore.has(k) ? memStore.get(k) : null,
    setItem: (k, v) => memStore.set(k, String(v)),
    removeItem: k => memStore.delete(k)
  },
  sessionStorage: {
    getItem: k => memSession.has(k) ? memSession.get(k) : null,
    setItem: (k, v) => memSession.set(k, String(v)),
    removeItem: k => memSession.delete(k)
  },
  indexedDB: null, // tidak dipakai karena IDB di-stub terlebih dahulu
  IDB: IDBStub
};
ctx.window = ctx;
ctx.globalThis = ctx;
vm.createContext(ctx);

async function main() {
  // 1) modul sql.js
  const initSqlJs = require(path.join(ROOT, 'lib', 'sql-wasm.js'));
  ctx.initSqlJs = initSqlJs;

  // 2) muat file aplikasi sesuai urutan index.html (tanpa app.js & tanpa storage.js)
  const order = [
    'lib/sql-wasm.base64.js',
    'js/util.js',
    'js/db.js',          // memakai ctx.IDB (stub) — bukan storage.js
    'js/auth.js',
    'js/progress.js',
    'js/quiz.js',
    'js/autoindent.js',
    'content/html/quiz-questions.js',
    'content/html/basics.js',
    'content/html/text-content.js',
    'content/html/tables-forms.js',
    'content/html/semantics-media.js',
    'content/css/quiz-questions.js',
    'content/css/basics.js',
    'content/css/selectors-properties.js',
    'content/css/box-position.js',
    'content/css/flex-grid-responsive.js',
    'content/css/effects-variables.js',
    'content/css/practices.js',
    'content/js/quiz-questions.js',
    'content/js/basics.js',
    'content/js/variables.js',
    'content/js/operators.js',
    'content/js/control-flow.js',
    'content/js/data-structures.js',
    'content/js/functions.js',
    'content/js/dom-events.js',
    'content/js/dom-bom.js',
    'content/js/advanced.js',
    'content/js/oop.js',
    'content/typescript/quiz-questions.js',
    'content/typescript/basics.js',
    'content/typescript/types.js',
    'content/typescript/composite.js',
    'content/typescript/advanced-types.js',
    'content/typescript/flow.js',
    'content/typescript/data-structures.js',
    'content/typescript/functions.js',
    'content/typescript/interfaces.js',
    'content/typescript/oop.js',
    'content/typescript/generics.js',
    'content/typescript/modules.js',
    'content/typescript/decorators.js',
    'content/git/quiz-questions.js',
    'content/git/pengenalan.js',
    'content/git/instalasi.js',
    'content/git/workflow-dasar.js',
    'content/git/riwayat-revisi.js',
    'content/git/cabang.js',
    'content/git/remote.js',
    'content/git/lanjutan.js',
    'content/sql/quiz-questions.js',
    'content/sql/pengenalan.js',
    'content/sql/query-dasar.js',
    'content/sql/dml-ddl.js',
    'content/sql/group-join.js',
    'content/sql/query-lanjutan.js',
    'content/sql/performa.js',
    'content/sql/transaksi.js',
    'content/react/quiz-questions.js',
    'content/react/pengenalan-setup.js',
    'content/react/jsx-components.js',
    'content/react/state-rendering.js',
    'content/react/hooks.js',
    'content/react/forms-routing.js',
    'content/react/state-management.js',
    'content/react/advanced.js',
    'content/react/ecosystem.js',
    'js/content.js'
  ];
  for (const f of order) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    vm.runInContext(src, ctx, { filename: f });
  }

  const DB = vm.runInContext('DB', ctx);
  const Auth = vm.runInContext('Auth', ctx);
  const Progress = vm.runInContext('Progress', ctx);
  const Quiz = vm.runInContext('Quiz', ctx);
  const Util = vm.runInContext('Util', ctx);
  const CONTENT = vm.runInContext('CONTENT', ctx);

  /* ---- konten CSS: setiap topik di info.md wajib ada ---- */
  const TOPIK_CSS = [
    'pengenalan-cara-menambahkan-css', 'selektor-css', 'properti-dasar',
    'unit-ukuran', 'text-styling', 'box-model', 'display-dan-visibilitas',
    'position', 'z-index-dan-layering', 'flexbox-dasar', 'grid-layout',
    'media-query-responsive', 'pseudo-class-dan-pseudo-element',
    'transition-dan-animasi-dasar', 'box-shadow-dan-text-shadow',
    'css-variable', 'best-praktis-penulisan-css', 'css-reset-dan-normalize'
  ];
  const JENIS_SECTION = ['text', 'example', 'tip', 'warn', 'live', 'vocab'];

  const results = [];
  const check = (name, cond) => { results.push([name, !!cond]); console.log((cond ? '✓ ' : '✗ ') + name); };

  // 3) boot DB
  const r = await DB.init();
  check('DB.init sukses', r.ok === true && DB.isReady());

  // 4) konten terdaftar
  check('13 pelajaran HTML', CONTENT.html.lessons.length === 13);
  check('24 soal kuis', CONTENT.html.quizPool.length === 24);
  check('judul pelajaran pertama', CONTENT.html.lessons[0].title === 'Apa itu HTML?');
  const types = new Set();
  CONTENT.html.lessons.forEach(l => l.sections.forEach(s => types.add(s.type)));
  check('semua jenis section dipakai', ['text','example','tip','warn','live','vocab'].every(t => types.has(t)));

  // 4b) konten CSS: 18 pelajaran = 18 topik di info.md, terdaftar & siap
  check('CSS status ready', CONTENT.css.status === 'ready');
  check('18 pelajaran CSS', CONTENT.css.lessons.length === 18);
  check('30 soal kuis CSS', CONTENT.css.quizPool.length === 30);
  const cssIds = CONTENT.css.lessons.map(l => l.id).sort();
  check('semua topik info.md dibahas (id unik & lengkap)',
    cssIds.length === TOPIK_CSS.length && TOPIK_CSS.slice().sort().every((id, i) => id === cssIds[i]));
  check('judul & durasi terisi', CONTENT.css.lessons.every(l => l.title && /^[\d]+ menit$/.test(l.duration)));
  check('bab pelajaran terisi', CONTENT.css.lessons.every(l => l.chapter && l.intro && l.intro.length && l.recap && l.recap.length));

  // struktur section tiap pelajaran
  let badSection = 0, badLive = 0, badExample = 0, badDoc = 0;
  for (const l of CONTENT.css.lessons) {
    const typesL = new Set(l.sections.map(s => s.type));
    if (!l.sections.some(s => JENIS_SECTION.includes(s.type))) badSection++;
    if (typesL.size < 3) badSection++;
    if (!l.sections.some(s => s.type === 'live')) badLive++;
    if (!l.sections.some(s => s.type === 'example' && s.output)) badExample++;
    for (const s of l.sections) {
      if (s.type === 'live') {
        if (s.lang !== 'html' || !/<style/i.test(s.initial) || !/<!DOCTYPE/i.test(s.initial) || !s.hint) badLive++;
      }
      if (s.type === 'example') {
        if (s.output && (!s.explain || s.explain.length < 2)) badExample++;
        if (s.doc) {
          const n = s.doc.split('__CODE__').length - 1;
          const pakaiStyle = /<style/i.test(s.doc) || /style="__CODE__"/.test(s.doc);
          if (n !== 1 || !/<!DOCTYPE/i.test(s.doc) || !pakaiStyle) badDoc++;
          if (s.lang !== 'css') badDoc++;
        }
      }
    }
  }
  check('struktur section tiap pelajaran valid', badSection === 0);
  check('tiap pelajaran ada latihan (live) & contoh berpratinjau', badLive === 0 && badExample === 0);
  check('contoh CSS+doc: penanda __CODE__ tepat 1x di <style> dokumen lengkap', badDoc === 0);

  // soal kuis CSS
  const cssBad = CONTENT.css.quizPool.filter(q =>
    !q.id || !q.q || !Array.isArray(q.options) || q.options.length !== 4 ||
    typeof q.answer !== 'number' || q.answer < 0 || q.answer > 3 || !q.explain);
  check('semua soal kuis CSS lengkap (4 opsi, jawaban & penjelasan)', cssBad.length === 0);

  // rujukan CSS sesuai info.md
  const cssRefs = (CONTENT.css.refs || []).map(r => r.url);
  check('rujukan CSS sesuai info.md (MDN, W3Schools, web.dev)',
    ['https://developer.mozilla.org/en-US/docs/Web/CSS', 'https://www.w3schools.com/css/', 'https://web.dev/learn/css/welcome']
      .every(u => cssRefs.includes(u)));

  // 4c) konten SQL: 16 pelajaran sesuai topik info.md
  check('SQL status ready', CONTENT.sql.status === 'ready');
  check('16 pelajaran SQL', CONTENT.sql.lessons.length === 16);
  check('50 soal kuis SQL', CONTENT.sql.quizPool.length === 50);
  const sqlIds = CONTENT.sql.lessons.map(l => l.id);
  check('id pelajaran SQL unik', new Set(sqlIds).size === sqlIds.length);
  check('judul & durasi pelajaran SQL terisi',
    CONTENT.sql.lessons.every(l => l.title && /^[\d]+ menit$/.test(l.duration)));
  check('bab, intro, recap pelajaran SQL terisi',
    CONTENT.sql.lessons.every(l => l.chapter && l.intro && l.intro.length && l.recap && l.recap.length));
  check('tiap pelajaran SQL punya contoh kode',
    CONTENT.sql.lessons.every(l => l.sections.some(s => s.type === 'example' && s.code)));
  const sqlBad = CONTENT.sql.quizPool.filter(q =>
    !q.id || !q.q || !Array.isArray(q.options) || q.options.length !== 4 ||
    typeof q.answer !== 'number' || q.answer < 0 || q.answer > 3 || !q.explain);
  check('semua soal kuis SQL lengkap (4 opsi, jawaban & penjelasan)', sqlBad.length === 0);
  const sqlRefs = (CONTENT.sql.refs || []).map(r => r.url);
  check('rujukan SQL sesuai info.md (W3Schools, sql tutorial)',
    ['https://www.w3schools.com/sql/default.asp', 'https://www.sqltutorial.org/']
      .every(u => sqlRefs.includes(u)));

  // 4d) konten React: 19 pelajaran sesuai topik info.md
  check('React status ready', CONTENT.react.status === 'ready');
  check('19 pelajaran React', CONTENT.react.lessons.length === 19);
  const reactIds = CONTENT.react.lessons.map(l => l.id);
  check('id pelajaran React unik', new Set(reactIds).size === reactIds.length);
  check('judul & durasi pelajaran React terisi',
    CONTENT.react.lessons.every(l => l.title && /^[\d]+ menit$/.test(l.duration)));
  check('bab, intro, recap & tujuan pelajaran React terisi',
    CONTENT.react.lessons.every(l => l.chapter && l.intro && l.intro.length &&
      l.recap && l.recap.length && l.objectives && l.objectives.length));
  check('tiap pelajaran React punya contoh kode',
    CONTENT.react.lessons.every(l => l.sections.some(s => s.type === 'example' && s.code)));
  check('soal kuis React memadai (>= 40) & lengkap',
    CONTENT.react.quizPool.length >= 40 &&
    !CONTENT.react.quizPool.some(q =>
      !q.id || !q.q || !Array.isArray(q.options) || q.options.length !== 4 ||
      typeof q.answer !== 'number' || q.answer < 0 || q.answer > 3 || !q.explain));
  const reactRefs = (CONTENT.react.refs || []).map(r => r.url);
  check('rujukan React sesuai info.md (react.dev, W3Schools, javascripttutorial)',
    ['https://react.dev/learn', 'https://www.w3schools.com/react/default.asp', 'https://www.javascripttutorial.net/react-tutorial/']
      .every(u => reactRefs.includes(u)));

  // utilitas sisip kode pratinjau
  check('Util.injectCode menyuntik kode ke penanda __CODE__',
    Util.injectCode('<style>\n__CODE__\n</style>', 'a{color:red}') === '<style>\na{color:red}\n</style>');
  check('Util.injectCode tanpa penanda mengembalikan dokumen apa adanya',
    Util.injectCode('<p>x</p>', 'a{}') === '<p>x</p>');

  // 5) auth
  let ar = await Auth.register('budi', 'rahasia123');
  check('registrasi sukses', ar.ok === true);
  check('sesi tersimpan', Auth.isLoggedIn());
  check('username benar', Auth.current().username === 'budi');
  ar = await Auth.login('budi', 'salah');
  check('login password salah ditolak', ar.ok === false);
  ar = await Auth.login('budi', 'rahasia123');
  check('login benar', ar.ok === true);

  // 6) progres
  await Progress.refresh();
  check('pelajaran 1 terbuka', Progress.isUnlocked('html', 0) === true);
  check('pelajaran 2 terkunci', Progress.isUnlocked('html', 1) === false);
  await Progress.markCompleted('html', 'pengenalan');
  check('pelajaran 2 terbuka setelah L1 selesai', Progress.isUnlocked('html', 1) === true);
  check('progres 1/13', Progress.lessonsDone('html') === 1);

  // 7) kuis
  const set = Quiz.buildSet('html', 10);
  check('kuis ambil 10 soal', set.length === 10);
  check('soal kuis unik', new Set(set.map(q => q.id)).size === 10);
  const view = Quiz.buildQuestionView(set[0], Date.now());
  check('opsi teracak 4 pilihan', view.options.length === 4 && view.correctIdx >= 0);
  check('jawaban benar ikut teracak & tetap valid',
    view.options[view.correctIdx] === set[0].options[set[0].answer]);
  Quiz.record('html', view.id, false);
  const wrong = Quiz.wrongIds('html');
  check('soal salah tercatat', wrong.includes(view.id));
  const set2 = Quiz.buildSet('html', 10);
  check('soal yang salah muncul lagi', set2.some(q => q.id === view.id));

  // 7b) editor: Tab / Shift+Tab indentasi & unindent (kedua editor)
  const PgAutoIndent = vm.runInContext('PgAutoIndent', ctx);
  const fakeTA = (value, s, en) => ({
    value, selectionStart: s, selectionEnd: en == null ? s : en, events: [],
    setSelectionRange(a, b) { this.selectionStart = a; this.selectionEnd = b; },
    dispatchEvent(ev) { this.events.push(ev.type); return true; }
  });
  const key = (k, opt) => Object.assign({
    key: k, shiftKey: false, metaKey: false, ctrlKey: false, altKey: false,
    defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }
  }, opt || {});

  let ta = fakeTA('<p>Halo', 0);
  let ev = key('Tab');
  check('Tab: indent baris & cegah fokus pindah',
    PgAutoIndent.keydown(ev, ta) === true && ev.defaultPrevented &&
    ta.value === '  <p>Halo' && ta.selectionStart === 2 && ta.events[0] === 'input');

  const src = '<ul>\n<li>a</li>\n<li>b</li>\n</ul>';
  ta = fakeTA(src, 5, 26);
  PgAutoIndent.keydown(key('Tab'), ta);
  check('Tab: seleksi multi-baris ikut ter-indentasi & seleksi ikut bergeser',
    ta.value === '<ul>\n  <li>a</li>\n  <li>b</li>\n</ul>' &&
    ta.value[ta.selectionStart] === '<' &&                              // tak menelan spasi indentasi baru
    ta.value.slice(ta.selectionStart, ta.selectionEnd).replace(/\n {2}/g, '\n') === src.slice(5, 26));

  ta = fakeTA('a\nb\nc', 0, 2);           // seleksi "a\n", berakhir di awal baris "b"
  PgAutoIndent.keydown(key('Tab'), ta);
  check('Tab: baris sesudah seleksi tidak ikut', ta.value === '  a\nb\nc');

  ta = fakeTA('  <b>x</b>', 11);
  ev = key('Tab', { shiftKey: true });
  check('Shift+Tab: unindent spasi',
    PgAutoIndent.keydown(ev, ta) === true && ev.defaultPrevented &&
    ta.value === '<b>x</b>' && ta.selectionStart === 9 && ta.events[0] === 'input');

  ta = fakeTA('\t<b>y</b>', 8);
  PgAutoIndent.keydown(key('Tab', { shiftKey: true }), ta);
  check('Shift+Tab: unindent satu tab', ta.value === '<b>y</b>');

  ta = fakeTA('tanpa indentasi', 5);
  ev = key('Tab', { shiftKey: true });
  check('Shift+Tab: baris polos tak berubah, tombol tetap dikonsumsi',
    PgAutoIndent.keydown(ev, ta) === true && ev.defaultPrevented && ta.value === 'tanpa indentasi');

  ta = fakeTA('', 0);
  check('Tab di dokumen kosong tetap mengindentasi',
    PgAutoIndent.keydown(key('Tab'), ta) === true && ta.value === '  ' && ta.selectionStart === 2);

  ta = fakeTA('x', 1);
  check('Ctrl+Tab tidak ditangkap (diteruskan ke browser)',
    PgAutoIndent.keydown(key('Tab', { ctrlKey: true }), ta) === false && ta.value === 'x');

  ta = fakeTA('  <div></div>', 7);
  check('regresi: Enter tetap auto-indent',
    PgAutoIndent.keydown(key('Enter'), ta) === true && ta.value === '  <div>\n    \n  </div>');

  // 8) simpan ke IndexedDB-stub (mutasi → tunggu debounce persist 600ms)
  DB.run("INSERT INTO quiz_attempts (user_id, tutorial, question_id, correct) VALUES (1,'html','zz-debug',1)");
  await new Promise(r => setTimeout(r, 800));
  const saved = idbStore.get('sqlite-db');
  check('database tersimpan ke IndexedDB', saved && saved.length > 0);

  const bytes = DB.exportBytes();
  check('ekspor byte sqlite', bytes && bytes.length > 0);

  await DB.resetAll();
  await Auth.init();
  await Progress.refresh();
  check('reset: akun terhapus', Auth.isLoggedIn() === false);

  const fails = results.filter(([, ok]) => !ok);
  console.log('\n────────────────────────────');
  console.log(fails.length === 0 ? 'SEMUA UJI LULUS ✅' : `${fails.length} uji gagal ❌`);
  process.exit(fails.length === 0 ? 0 : 1);
}

main().catch((e) => { console.error('HARNESS ERROR:', e); process.exit(1); });