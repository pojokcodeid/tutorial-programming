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
    'content/http/quiz-questions.js',
    'content/http/01-persiapan-laboratorium.js',
    'content/http/02-fondasi-http.js',
    'content/http/03-request-response.js',
    'content/http/04-url-query-body.js',
    'content/http/05-method-semantik.js',
    'content/http/06-status-code.js',
    'content/http/07-header-penting.js',
    'content/http/08-body-negotiation.js',
    'content/http/09-cookie-session.js',
    'content/http/10-autentikasi-otorisasi.js',
    'content/http/11-caching-conditional.js',
    'content/http/12-https-tls.js',
    'content/http/13-cors-keamanan.js',
    'content/http/14-http-versi.js',
    'content/http/15-proxy-cdn.js',
    'content/http/16-desain-api.js',
    'content/http/17-debugging-curl.js',
    'content/http/18-testing-diagnosis.js',
    'content/http/19-proyek-akhir.js',
    'content/restfulapi/quiz-questions.js',
    'content/restfulapi/01-apa-itu-api.js',
    'content/restfulapi/02-client-server-request-response.js',
    'content/restfulapi/03-url-endpoint.js',
    'content/restfulapi/04-http-method.js',
    'content/restfulapi/05-status-code.js',
    'content/restfulapi/06-json.js',
    'content/restfulapi/07-path-query-body.js',
    'content/restfulapi/08-http-headers.js',
    'content/restfulapi/09-apa-itu-rest.js',
    'content/restfulapi/10-merancang-endpoint.js',
    'content/restfulapi/11-format-response-error.js',
    'content/restfulapi/12-safe-idempotent.js',
    'content/restfulapi/13-postman-curl.js',
    'content/restfulapi/14-panggil-api-dari-kode.js',
    'content/restfulapi/15-proyek-mini-rangkuman.js',
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
    'content/reactproject/quiz-questions.js',
    'content/reactproject/01-pengenalan-setup.js',
    'content/reactproject/02-json-server.js',
    'content/reactproject/03-custom-component.js',
    'content/reactproject/04-routing.js',
    'content/reactproject/05-context.js',
    'content/reactproject/06-axios.js',
    'content/reactproject/07-auth-authorization.js',
    'content/reactproject/08-refresh-token.js',
    'content/gorestapi/quiz-questions.js',
    'content/gorestapi/01-pengenalan-arsitektur.js',
    'content/gorestapi/02-setup-konfigurasi.js',
    'content/gorestapi/03-koneksi-mariadb.js',
    'content/gorestapi/04-model-repository.js',
    'content/gorestapi/05-handler-crud.js',
    'content/gorestapi/06-auth-jwt.js',
    'content/gorestapi/07-authorization-middleware.js',
    'content/gorestapi/08-unit-testing.js',
    'content/gorestapi/09-integration-testing.js',
    'content/gorestapi/10-proyek-scalable.js',
    'content/gogui/quiz-questions.js',
    'content/gogui/01-pengenalan-proyek.js',
    'content/gogui/02-jendela-widget.js',
    'content/gogui/03-daftar-list.js',
    'content/gogui/04-form-validasi.js',
    'content/gogui/05-database-repository.js',
    'content/gogui/06-crud-dialog.js',
    'content/gogui/07-filter-pencarian.js',
    'content/gogui/08-arsitektur-testing.js',
    'content/gogui/09-tugas-latar-tema.js',
    'content/gogui/10-build-rilis.js',
    'content/lucee/quiz-questions.js',
    'content/lucee/01-pengenalan-setup.js',
    'content/lucee/02-sintaks-dasar.js',
    'content/lucee/03-variabel-scope.js',
    'content/lucee/04-kontrol-perulangan.js',
    'content/lucee/05-struktur-data.js',
    'content/lucee/06-koneksi-database.js',
    'content/lucee/07-query-crud.js',
    'content/lucee/08-orm.js',
    'content/lucee/09-fungsi-udf.js',
    'content/lucee/10-cfc.js',
    'content/lucee/11-modularisasi.js',
    'content/lucee/12-lifecycle-appcfc.js',
    'content/lucee/13-oop.js',
    'content/lucee/14-di-wirebox.js',
    'content/lucee/15-rest-api.js',
    'content/lucee/16-json-xml-jwt.js',
    'content/lucee/17-admin-konfigurasi.js',
    'content/lucee/18-integrasi-java.js',
    'content/lucee/19-testing-quality.js',
    'content/lucee/20-devops-security.js',
    'content/luceemvc/quiz-questions.js',
    'content/luceemvc/01-mvc-fondasi.js',
    'content/luceemvc/02-env-config.js',
    'content/luceemvc/03-mvc-router.js',
    'content/luceemvc/04-mvc-controller-view.js',
    'content/luceemvc/05-mvc-model-validasi.js',
    'content/luceemvc/06-mvc-rilis.js',
    'content/jenkins/quiz-questions.js',
    'content/jenkins/01-pengantar-cicd.js',
    'content/jenkins/02-instalasi-jenkins.js',
    'content/jenkins/03-administrasi-plugin.js',
    'content/jenkins/04-keamanan-kredensial.js',
    'content/jenkins/05-freestyle-job.js',
    'content/jenkins/06-pipeline-deklaratif.js',
    'content/jenkins/07-pipeline-terprogram.js',
    'content/jenkins/08-pipeline-lanjutan.js',
    'content/jenkins/09-git-webhook-multibranch.js',
    'content/jenkins/10-validasi-pull-request.js',
    'content/jenkins/11-agent-statis.js',
    'content/jenkins/12-agent-dinamis.js',
    'content/jenkins/13-shared-library.js',
    'content/jenkins/14-hardening-jcasc.js',
    'content/jenkins/15-integrasi-ekosistem.js',
    'content/jenkins/16-praktik-proyek.js',
    'content/rabbitmq/quiz-questions.js',
    'content/rabbitmq/01-pengantar-broker.js',
    'content/rabbitmq/02-setup-podman.js',
    'content/rabbitmq/03-arsitektur-dasar.js',
    'content/rabbitmq/04-exchange-default-direct.js',
    'content/rabbitmq/05-exchange-fanout-topic.js',
    'content/rabbitmq/06-exchange-headers-routing.js',
    'content/rabbitmq/07-durability-persistence.js',
    'content/rabbitmq/08-consumer-acknowledgement.js',
    'content/rabbitmq/09-prefetch-fair-dispatch.js',
    'content/rabbitmq/10-dead-letter-exchange.js',
    'content/rabbitmq/11-ttl-priority-queue.js',
    'content/rabbitmq/12-integrasi-nodejs.js',
    'content/rabbitmq/13-integrasi-go.js',
    'content/rabbitmq/14-integrasi-java.js',
    'content/rabbitmq/15-cluster-high-availability.js',
    'content/rabbitmq/16-federation-shovel.js',
    'content/rabbitmq/17-keamanan-vhost-tls.js',
    'content/rabbitmq/18-monitoring-prometheus.js',
    'content/rabbitmq/19-tuning-production.js',
    'content/rabbitmq/20-praktik-proyek.js',
    'content/redis/quiz-questions.js',
    'content/redis/01-fondasi-redis.js',
    'content/redis/02-instalasi-cli.js',
    'content/redis/03-struktur-data.js',
    'content/redis/04-expiration-ttl-keydesign.js',
    'content/redis/05-cache-database.js',
    'content/redis/06-integrasi-go.js',
    'content/redis/07-transaksi-atomik.js',
    'content/redis/08-pubsub-streams-lock.js',
    'content/redis/09-session-ratelimit-keamanan.js',
    'content/redis/10-persistence-recovery.js',
    'content/redis/11-memory-performa.js',
    'content/redis/12-high-availability.js',
    'content/redis/13-observability-monitoring.js',
    'content/redis/14-docker-cicd.js',
    'content/redis/15-microservices.js',
    'content/redis/16-praktik-proyek.js',
    'content/fullstack/quiz-questions.js',
    'content/fullstack/01-pengenalan-arsitektur.js',
    'content/fullstack/02-setup-podman.js',
    'content/fullstack/03-database-mariadb.js',
    'content/fullstack/04-backend-go-fondasi.js',
    'content/fullstack/05-product-service-crud.js',
    'content/fullstack/06-cache-redis.js',
    'content/fullstack/07-order-service.js',
    'content/fullstack/08-rabbitmq-publisher.js',
    'content/fullstack/09-notification-service.js',
    'content/fullstack/10-frontend-react.js',
    'content/fullstack/11-integrasi-frontend.js',
    'content/fullstack/12-containerisasi-rilis.js',
    'content/micro-frontend/quiz-questions.js',
    'content/micro-frontend/01-konsep.js',
    'content/micro-frontend/02-anatomi-komposisi.js',
    'content/micro-frontend/03-persiapan-monorepo.js',
    'content/micro-frontend/04-shell-react.js',
    'content/micro-frontend/05-remote-module-federation.js',
    'content/micro-frontend/06-routing-kontrak.js',
    'content/micro-frontend/07-state-event.js',
    'content/micro-frontend/08-design-system.js',
    'content/micro-frontend/09-data-api.js',
    'content/micro-frontend/10-auth-otorisasi.js',
    'content/micro-frontend/11-manifest-flags.js',
    'content/micro-frontend/12-resilience.js',
    'content/micro-frontend/13-testing.js',
    'content/micro-frontend/14-observability.js',
    'content/micro-frontend/15-performa.js',
    'content/micro-frontend/16-rilis-rollback.js',
    'content/micro-frontend/17-cicd-tim.js',
    'content/micro-frontend/18-migrasi-legacy.js',
    'content/micro-frontend/19-governance.js',
    'content/micro-frontend/20-proyek-akhir.js',
    'content/graphql/quiz-questions.js',
    'content/graphql/01-pengenalan-graphql.js',
    'content/graphql/02-tiga-operasi-graphql.js',
    'content/graphql/03-menulis-query.js',
    'content/graphql/04-mutation-dan-variables.js',
    'content/graphql/05-schema-sdl.js',
    'content/graphql/06-resolvers.js',
    'content/graphql/07-setup-server-prisma.js',
    'content/graphql/08-pagination-dan-filtering.js',
    'content/graphql/09-apollo-client-react.js',
    'content/graphql/10-normalized-cache-codegen.js',
    'content/graphql/11-n-plus-1-dataloader.js',
    'content/graphql/12-keamanan-otorisasi.js',
    'content/graphql/13-subscriptions-realtime.js',
    'content/graphql/14-apollo-federation.js',
    'content/graphql/15-graphql-dengan-go.js',
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

  // 4a2) konten HTTP: 19 pelajaran + 40 soal kuis + laboratorium lokal
  const httpC = CONTENT.get('http');
  check('HTTP terdaftar & status ready', !!httpC && httpC.status === 'ready');
  check('19 pelajaran HTTP', httpC.lessons.length === 19);
  const httpIds = httpC.lessons.map(l => l.id);
  check('id pelajaran HTTP unik', new Set(httpIds).size === httpIds.length);
  check('judul, durasi, bab, intro, objectives & recap HTTP terisi',
    httpC.lessons.every(l => l.title && /^[\d]+([–-][\d]+)? menit$/.test(l.duration) &&
      l.chapter && Array.isArray(l.intro) && l.intro.length === 3 &&
      Array.isArray(l.objectives) && l.objectives.length === 4 &&
      Array.isArray(l.recap) && l.recap.length === 4));
  let httpBadSection = 0, httpFig = 0;
  for (const l of httpC.lessons) {
    const typesL = new Set(l.sections.map(s => s.type));
    if (typesL.size < 3) httpBadSection++;
    if (l.sections.some(s => s.type === 'text' && /<figure class="fig">/.test(s.html || ''))) httpFig++;
    if (!l.sections.some(s => s.type === 'vocab' && Array.isArray(s.items) && s.items.length >= 5)) httpBadSection++;
    if (!l.sections.some(s => s.type === 'tip' || s.type === 'warn')) httpBadSection++;
    if (!l.sections.some(s => s.type === 'example' && s.code)) httpBadSection++;
    for (const s of l.sections) {
      if (s.type === 'example') {
        if (s.output !== false || !s.explain || s.explain.length < 2) httpBadSection++;
        if ((s.code || '').includes('`') || (s.code || '').includes('${')) httpBadSection++;
      }
      if (s.type === 'live') httpBadSection++;
    }
  }
  check('struktur section pelajaran HTTP valid', httpBadSection === 0);
  check('figur ilustrasi HTTP tersebar (>= 4 pelajaran)', httpFig >= 4);
  check('40 soal kuis HTTP lengkap (4 opsi, jawaban & penjelasan) & id unik httpNN',
    httpC.quizPool.length === 40 &&
    new Set(httpC.quizPool.map(q => q.id)).size === httpC.quizPool.length &&
    httpC.quizPool.every(q => /^http\d{2}$/.test(q.id)) &&
    !httpC.quizPool.some(q =>
      !q.id || !q.q || !Array.isArray(q.options) || q.options.length !== 4 ||
      typeof q.answer !== 'number' || q.answer < 0 || q.answer > 3 || !q.explain));
  const httpRefs = (httpC.refs || []).map(r => r.url);
  check('rujukan HTTP (MDN, RFC 9110, RFC 9111, curl)',
    ['https://developer.mozilla.org/en-US/docs/Web/HTTP',
     'https://www.rfc-editor.org/rfc/rfc9110',
     'https://www.rfc-editor.org/rfc/rfc9111',
     'https://curl.se/docs/']
      .every(u => httpRefs.includes(u)));
  check('laboratorium HTTP tersedia (server, proxy, tes, README, kumpulan request, logo)',
    fs.existsSync(path.join(ROOT, 'examples/http-lab/server.js')) &&
    fs.existsSync(path.join(ROOT, 'examples/http-lab/proxy.js')) &&
    fs.existsSync(path.join(ROOT, 'examples/http-lab/lab.test.js')) &&
    fs.existsSync(path.join(ROOT, 'examples/http-lab/README.md')) &&
    fs.existsSync(path.join(ROOT, 'examples/http-lab/requests.http')) &&
    fs.existsSync(path.join(ROOT, 'assets/logos/http.svg')));
  check('logo HTTP berformat SVG',
    fs.readFileSync(path.join(ROOT, 'assets/logos/http.svg'), 'utf8').includes('<svg'));

  // 4a2) konten Dasar RESTful API: 15 pelajaran + 40 soal kuis
  const rstC = CONTENT.get('restfulapi');
  check('Dasar RESTful API terdaftar & status ready', !!rstC && rstC.status === 'ready');
  check('15 pelajaran Dasar RESTful API', rstC.lessons.length === 15);
  const rstIds = rstC.lessons.map(l => l.id);
  check('id pelajaran Dasar RESTful API unik', new Set(rstIds).size === rstIds.length);
  check('judul, durasi, bab, intro, objectives & recap Dasar RESTful API terisi',
    rstC.lessons.every(l => l.title && /^\d+ menit$/.test(l.duration) &&
      l.chapter && l.intro && l.intro.length && l.objectives && l.objectives.length &&
      l.recap && l.recap.length));
  let rstBadSection = 0;
  for (const l of rstC.lessons) {
    if (!l.sections.some(s => s.type === 'example' && s.code && s.output === false)) rstBadSection++;
    if (!l.sections.some(s => s.type === 'vocab' && s.items.length >= 5)) rstBadSection++;
    if (!l.sections.some(s => s.type === 'tip' || s.type === 'warn')) rstBadSection++;
    for (const s of l.sections) {
      if (s.type === 'example' && (!s.explain || s.explain.length < 2)) rstBadSection++;
      if (s.type === 'live' &&
        (s.lang !== 'html' || !/<!DOCTYPE/i.test(s.initial || '') || !s.hint)) rstBadSection++;
    }
  }
  check('struktur section pelajaran Dasar RESTful API valid (contoh + vocab + tip/warn + live)',
    rstBadSection === 0);
  check('latihan interaktif (live) tersebar di semua pelajaran Dasar RESTful API',
    rstC.lessons.every(l => l.sections.some(s => s.type === 'live')));
  check('40 soal kuis Dasar RESTful API lengkap (4 opsi, jawaban & penjelasan) & id unik restfulNN',
    rstC.quizPool.length === 40 &&
    new Set(rstC.quizPool.map(q => q.id)).size === rstC.quizPool.length &&
    rstC.quizPool.every(q => /^restful\d{2}$/.test(q.id)) &&
    !rstC.quizPool.some(q =>
      !q.id || !q.q || !Array.isArray(q.options) || q.options.length !== 4 ||
      typeof q.answer !== 'number' || q.answer < 0 || q.answer > 3 || !q.explain));
  const rstRefs = (rstC.refs || []).map(r => r.url);
  check('rujukan Dasar RESTful API (restfulapi.net, MDN, JSONPlaceholder, PokéAPI, Postman)',
    ['https://restfulapi.net/',
     'https://developer.mozilla.org/en-US/docs/Web/HTTP',
     'https://jsonplaceholder.typicode.com/',
     'https://pokeapi.co/',
     'https://learning.postman.com/']
      .every(u => rstRefs.includes(u)));
  check('logo restful.svg berformat SVG',
    fs.readFileSync(path.join(ROOT, 'assets/logos/restful.svg'), 'utf8').includes('<svg'));

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

  // 4d2) konten Contoh Project React JS: 8 pelajaran + kuis
  const rproj = CONTENT.get('reactproject');
  check('Contoh Project React JS terdaftar & status ready', !!rproj && rproj.status === 'ready');
  check('8 pelajaran Contoh Project React JS', rproj.lessons.length === 8);
  const rprojIds = rproj.lessons.map(l => l.id);
  check('id pelajaran Contoh Project React JS unik', new Set(rprojIds).size === rprojIds.length);
  check('judul, durasi, bab, intro, objectives & recap terisi',
    rproj.lessons.every(l => l.title && /^\d+ menit$/.test(l.duration) &&
      l.chapter && l.intro && l.intro.length && l.objectives && l.objectives.length &&
      l.recap && l.recap.length));
  check('tiap pelajaran punya contoh kode, vocab & tip/warn',
    rproj.lessons.every(l =>
      l.sections.some(s => s.type === 'example' && s.code && s.output === false) &&
      l.sections.some(s => s.type === 'vocab' && s.items.length >= 5) &&
      (l.sections.some(s => s.type === 'tip') || l.sections.some(s => s.type === 'warn'))));
  check('latihan simulasi (live) tiap pelajaran valid',
    rproj.lessons.every(l => l.sections.some(s =>
      s.type === 'live' && s.lang === 'html' && /<!DOCTYPE/i.test(s.initial || '') && s.hint)));
  check('15 soal kuis Contoh Project React JS lengkap & id unik',
    rproj.quizPool.length === 15 &&
    new Set(rproj.quizPool.map(q => q.id)).size === rproj.quizPool.length &&
    !rproj.quizPool.some(q =>
      !q.id || !q.q || !Array.isArray(q.options) || q.options.length !== 4 ||
      typeof q.answer !== 'number' || q.answer < 0 || q.answer > 3 || !q.explain));
  const rprojRefs = (rproj.refs || []).map(r => r.url);
  check('rujukan Contoh Project React JS (react.dev, ant.design, axios, json-server)',
    ['https://react.dev/learn', 'https://ant.design/', 'https://axios-http.com/docs/intro', 'https://github.com/typicode/json-server']
      .every(u => rprojRefs.includes(u)));

  // 4e) konten Go REST API: 10 pelajaran + 40 soal kuis
  const api = CONTENT.get('gorestapi');
  check('Go REST API terdaftar & status ready', !!api && api.status === 'ready');
  check('10 pelajaran Go REST API', api.lessons.length === 10);
  const apiIds = api.lessons.map(l => l.id);
  check('id pelajaran Go REST API unik', new Set(apiIds).size === apiIds.length);
  check('judul & durasi pelajaran Go REST API terisi',
    api.lessons.every(l => l.title && /^[\d]+ menit$/.test(l.duration)));
  check('bab, intro, recap & tujuan pelajaran Go REST API terisi',
    api.lessons.every(l => l.chapter && l.intro && l.intro.length &&
      l.recap && l.recap.length && l.objectives && l.objectives.length));
  check('tiap pelajaran Go REST API punya contoh kode',
    api.lessons.every(l => l.sections.some(s => s.type === 'example' && s.code)));
  check('40 soal kuis Go REST API lengkap (4 opsi, jawaban & penjelasan)',
    api.quizPool.length === 40 &&
    !api.quizPool.some(q =>
      !q.id || !q.q || !Array.isArray(q.options) || q.options.length !== 4 ||
      typeof q.answer !== 'number' || q.answer < 0 || q.answer > 3 || !q.explain));
  const apiRefs = (api.refs || []).map(r => r.url);
  check('rujukan Go REST API (net/http, jwt, mariadb)',
    ['https://pkg.go.dev/net/http', 'https://github.com/golang-jwt/jwt', 'https://mariadb.com/kb/en/documentation/']
      .every(u => apiRefs.includes(u)));

  // 4f) konten Lucee CFML: 20 pelajaran sesuai topik info.md
  const lucee = CONTENT.get('lucee');
  check('Lucee CFML terdaftar & status ready', !!lucee && lucee.status === 'ready');
  check('20 pelajaran Lucee CFML', lucee.lessons.length === 20);
  const luceeIds = lucee.lessons.map(l => l.id);
  check('id pelajaran Lucee unik', new Set(luceeIds).size === luceeIds.length);
  check('judul, durasi, bab, intro, objectives & recap Lucee terisi',
    lucee.lessons.every(l => l.title && /^\d+ menit$/.test(l.duration) &&
      l.chapter && l.intro && l.intro.length && l.objectives && l.objectives.length &&
      l.recap && l.recap.length));
  check('tiap pelajaran Lucee punya contoh kode CFML & figur ilustrasi',
    lucee.lessons.every(l =>
      l.sections.some(s => s.type === 'example' && s.code) &&
      l.sections.some(s => s.type === 'text' && /<figure class="fig">/.test(s.html || ''))));
  let luceeBadSection = 0, luceeLive = 0, luceeLiveOk = 0;
  for (const l of lucee.lessons) {
    const typesL = new Set(l.sections.map(s => s.type));
    if (typesL.size < 3) luceeBadSection++;
    if (!l.sections.some(s => s.type === 'vocab' && s.items.length >= 5)) luceeBadSection++;
    if (!l.sections.some(s => s.type === 'example' && s.lang === 'cfml')) luceeBadSection++;
    if (!l.sections.some(s => s.type === 'tip' || s.type === 'warn')) luceeBadSection++;
    for (const s of l.sections) {
      if (s.type === 'example') {
        if (s.output !== false) luceeBadSection++;       // CFML hanya jalan di server
        if (!s.explain || s.explain.length < 2) luceeBadSection++;
      }
      if (s.type === 'live') {
        if (s.lang !== 'html' || !/<!DOCTYPE/i.test(s.initial || '') || !s.hint) luceeLive++;
        else luceeLiveOk++;
      }
    }
  }
  check('struktur section pelajaran Lucee valid', luceeBadSection === 0);
  check('latihan simulasi (live) Lucee valid', luceeLive === 0 && luceeLiveOk === 2);
  const luceeBad = lucee.quizPool.filter(q =>
    !q.id || !q.q || !Array.isArray(q.options) || q.options.length !== 4 ||
    typeof q.answer !== 'number' || q.answer < 0 || q.answer > 3 || !q.explain);
  check('soal kuis Lucee memadai (>= 45) & lengkap',
    lucee.quizPool.length >= 45 && luceeBad.length === 0);
  check('id soal kuis Lucee unik',
    new Set(lucee.quizPool.map(q => q.id)).size === lucee.quizPool.length);
  const luceeRefs = (lucee.refs || []).map(r => r.url);
  check('rujukan Lucee sesuai info.md (docs.lucee.org & GitBook)',
    ['https://docs.lucee.org/index.html', 'https://rorylaitila.gitbooks.io/lucee/content/']
      .every(u => luceeRefs.includes(u)));
  check('soal kuis Lucee berhenti di lq66 (soal Framework MVC pindah materi)',
    lucee.quizPool.every(q => /^lq\d+$/.test(q.id) && parseInt(q.id.slice(2), 10) <= 66));

  // 4g) konten Framework MVC (Lucee CFML): 6 pelajaran + 15 soal kuis, materi terpisah dari Lucee CFML
  const mvc = CONTENT.get('luceemvc');
  check('Framework MVC (Lucee CFML) terdaftar & status ready', !!mvc && mvc.status === 'ready');
  check('6 pelajaran Framework MVC', mvc.lessons.length === 6);
  const mvcIds = mvc.lessons.map(l => l.id);
  check('id pelajaran Framework MVC unik', new Set(mvcIds).size === mvcIds.length);
  check('judul, durasi, bab, intro, objectives & recap Framework MVC terisi',
    mvc.lessons.every(l => l.title && /^\d+ menit$/.test(l.duration) &&
      l.chapter && l.intro && l.intro.length && l.objectives && l.objectives.length &&
      l.recap && l.recap.length));
  let mvcBadSection = 0, mvcCfml = 0, mvcFig = 0;
  for (const l of mvc.lessons) {
    const typesL = new Set(l.sections.map(s => s.type));
    if (typesL.size < 3) mvcBadSection++;
    if (!l.sections.some(s => s.type === 'vocab' && s.items.length >= 5)) mvcBadSection++;
    if (!l.sections.some(s => s.type === 'example' && s.code)) mvcBadSection++;
    if (!l.sections.some(s => s.type === 'tip' || s.type === 'warn')) mvcBadSection++;
    if (l.sections.some(s => s.type === 'example' && s.lang === 'cfml')) mvcCfml++;
    if (l.sections.some(s => s.type === 'text' && /<figure class="fig">/.test(s.html || ''))) mvcFig++;
    for (const s of l.sections) {
      if (s.type === 'example' && (s.output !== false || !s.explain || s.explain.length < 2)) mvcBadSection++;
    }
  }
  check('struktur section pelajaran Framework MVC valid', mvcBadSection === 0);
  check('pelajaran Framework MVC memuat contoh CFML & figur ilustrasi', mvcCfml >= 5 && mvcFig >= 2);
  check('15 soal kuis Framework MVC lengkap (4 opsi, jawaban & penjelasan) & id unik',
    mvc.quizPool.length === 15 &&
    new Set(mvc.quizPool.map(q => q.id)).size === mvc.quizPool.length &&
    !mvc.quizPool.some(q =>
      !q.id || !q.q || !Array.isArray(q.options) || q.options.length !== 4 ||
      typeof q.answer !== 'number' || q.answer < 0 || q.answer > 3 || !q.explain));
  const mvcRefs = (mvc.refs || []).map(r => r.url);
  check('rujukan Framework MVC (docs Lucee, CommandBox, GitHub pojokcodeid)',
    ['https://docs.lucee.org/index.html', 'https://commandbox.ortusbooks.com/', 'https://github.com/pojokcodeid/cfml-mvc-framework']
      .every(u => mvcRefs.includes(u)));

  // 4h) konten Contoh Project Go GUI: 10 pelajaran + 40 soal kuis
  const gui = CONTENT.get('gogui');
  check('Contoh Project Go GUI terdaftar & status ready', !!gui && gui.status === 'ready');
  check('10 pelajaran Contoh Project Go GUI', gui.lessons.length === 10);
  const guiIds = gui.lessons.map(l => l.id);
  check('id pelajaran Go GUI unik', new Set(guiIds).size === guiIds.length);
  check('judul, durasi, bab, intro, objectives & recap Go GUI terisi',
    gui.lessons.every(l => l.title && /^\d+ menit$/.test(l.duration) &&
      l.chapter && l.intro && l.intro.length && l.objectives && l.objectives.length &&
      l.recap && l.recap.length));
  check('tiap pelajaran Go GUI punya contoh kode, vocab & tip/warn',
    gui.lessons.every(l =>
      l.sections.some(s => s.type === 'example' && s.code && s.output === false) &&
      l.sections.some(s => s.type === 'vocab' && s.items.length >= 6) &&
      (l.sections.some(s => s.type === 'tip') || l.sections.some(s => s.type === 'warn'))));
  check('contoh kode Go bebas backtick & ${',
    gui.lessons.every(l => l.sections.every(s =>
      s.type !== 'example' || (!s.code.includes('`') && !s.code.includes('${')))));
  let guiFig = 0, guiLiveOk = 0, guiLiveBad = 0, guiBadSection = 0;
  for (const l of gui.lessons) {
    const typesL = new Set(l.sections.map(s => s.type));
    if (typesL.size < 3) guiBadSection++;
    if (l.sections.some(s => s.type === 'text' && /<figure class="fig">/.test(s.html || ''))) guiFig++;
    for (const s of l.sections) {
      if (s.type === 'live') {
        if (s.lang !== 'html' || /<!DOCTYPE/i.test(s.initial || '') !== true || !s.hint ||
            !/^<!DOCTYPE/i.test((s.initial || '').trim())) guiLiveBad++;
        else guiLiveOk++;
      }
    }
  }
  check('struktur section pelajaran Go GUI valid', guiBadSection === 0);
  check('pelajaran pilihan & pengujian memuat figur ilustrasi (>= 2)',
    gui.lessons.filter(l => ['gui-database', 'gui-testing'].includes(l.id))
      .every(l => l.sections.some(s => s.type === 'text' && /<figure class="fig">/.test(s.html || ''))));
  check('figur ilustrasi Go GUI tersebar (>= 3 pelajaran)', guiFig >= 3);
  check('latihan simulasi (live) Go GUI valid & memadai (>= 3)',
    guiLiveBad === 0 && guiLiveOk >= 3);
  check('40 soal kuis Go GUI lengkap (4 opsi, jawaban & penjelasan) & id unik guiNN',
    gui.quizPool.length === 40 &&
    new Set(gui.quizPool.map(q => q.id)).size === gui.quizPool.length &&
    gui.quizPool.every(q => /^gui\d{2}$/.test(q.id)) &&
    !gui.quizPool.some(q =>
      !q.id || !q.q || !Array.isArray(q.options) || q.options.length !== 4 ||
      typeof q.answer !== 'number' || q.answer < 0 || q.answer > 3 || !q.explain));
  const guiRefs = (gui.refs || []).map(r => r.url);
  check('rujukan Go GUI (fyne.io, docs Fyne, pkg.go.dev)',
    ['https://fyne.io/', 'https://docs.fyne.io/started/', 'https://pkg.go.dev/fyne.io/fyne/v2']
      .every(u => guiRefs.includes(u)));

  // 4i) konten Jenkins: 16 pelajaran sesuai spesifikasi jenkins.md + kuis
  const jk = CONTENT.get('jenkins');
  check('Jenkins terdaftar & status ready', !!jk && jk.status === 'ready');
  check('16 pelajaran Jenkins', jk.lessons.length === 16);
  const jkIds = jk.lessons.map(l => l.id);
  check('id pelajaran Jenkins unik', new Set(jkIds).size === jkIds.length);
  check('judul, durasi, bab, intro, objectives & recap Jenkins terisi',
    jk.lessons.every(l => l.title && /^[\d]+([–-][\d]+)? menit$/.test(l.duration) &&
      l.chapter && Array.isArray(l.intro) && l.intro.length === 3 &&
      Array.isArray(l.objectives) && l.objectives.length === 4 &&
      Array.isArray(l.recap) && l.recap.length === 4));
  let jkBadSection = 0, jkFig = 0;
  for (const l of jk.lessons) {
    const types = new Set(l.sections.map(s => s.type));
    if (types.size < 3) jkBadSection++;
    if (l.sections.some(s => s.type === 'text' && /<figure class="fig">/.test(s.html || ''))) jkFig++;
    if (!l.sections.some(s => s.type === 'vocab' && Array.isArray(s.items) && s.items.length >= 5)) jkBadSection++;
    if (!l.sections.some(s => s.type === 'tip' || s.type === 'warn')) jkBadSection++;
    if (!l.sections.some(s => s.type === 'example' && s.code)) jkBadSection++;
    for (const s of l.sections) {
      if (s.type === 'example') {
        if (s.output !== false || !s.explain || s.explain.length < 2) jkBadSection++;
        if ((s.code || '').includes('`')) jkBadSection++;      // kode bebas backtick
      }
      if (s.type === 'live') jkBadSection++;                    // bab Jenkins tanpa latihan live
    }
  }
  check('struktur section pelajaran Jenkins valid', jkBadSection === 0);
  check('tiap pelajaran Jenkins memuat figur ilustrasi (16/16)', jkFig === 16);
  check('40 soal kuis Jenkins lengkap (4 opsi, jawaban & penjelasan) & id unik jqNN',
    jk.quizPool.length === 40 &&
    new Set(jk.quizPool.map(q => q.id)).size === jk.quizPool.length &&
    jk.quizPool.every(q => /^jq\d{2}$/.test(q.id)) &&
    !jk.quizPool.some(q =>
      !q.id || !q.q || !Array.isArray(q.options) || q.options.length !== 4 ||
      typeof q.answer !== 'number' || q.answer < 0 || q.answer > 3 || !q.explain));
  const jkRefs = (jk.refs || []).map(r => r.url);
  check('rujukan Jenkins (jenkins.io doc, tutorial, pipeline reference, jcasc)',
    ['https://www.jenkins.io/doc/', 'https://www.jenkins.io/learn/tutorials/',
     'https://www.jenkins.io/doc/pipeline/reference/', 'https://www.jenkins.io/projects/jcasc/']
      .every(u => jkRefs.includes(u)));

  // 4j) konten RabbitMQ: 20 pelajaran sesuai kurikulum rabbitmq.md + 40 soal kuis
  const rq = CONTENT.get('rabbitmq');
  check('RabbitMQ terdaftar & status ready', !!rq && rq.status === 'ready');
  check('20 pelajaran RabbitMQ', rq.lessons.length === 20);
  const rqIds = rq.lessons.map(l => l.id);
  check('id pelajaran RabbitMQ unik', new Set(rqIds).size === rqIds.length);
  check('judul, durasi, bab, intro, objectives & recap RabbitMQ terisi',
    rq.lessons.every(l => l.title && /^[\d]+([–-][\d]+)? menit$/.test(l.duration) &&
      l.chapter && Array.isArray(l.intro) && l.intro.length === 3 &&
      Array.isArray(l.objectives) && l.objectives.length === 4 &&
      Array.isArray(l.recap) && l.recap.length === 4));
  let rqBadSection = 0, rqFig = 0;
  for (const l of rq.lessons) {
    const types = new Set(l.sections.map(s => s.type));
    if (types.size < 3) rqBadSection++;
    if (l.sections.some(s => s.type === 'text' && /<figure class="fig">/.test(s.html || ''))) rqFig++;
    if (!l.sections.some(s => s.type === 'vocab' && Array.isArray(s.items) && s.items.length >= 5)) rqBadSection++;
    if (!l.sections.some(s => s.type === 'tip' || s.type === 'warn')) rqBadSection++;
    if (!l.sections.some(s => s.type === 'example' && s.code)) rqBadSection++;
    for (const s of l.sections) {
      if (s.type === 'example') {
        if (s.output !== false || !s.explain || s.explain.length < 2) rqBadSection++;
      }
      if (s.type === 'live') rqBadSection++; // bab RabbitMQ tanpa latihan live
    }
  }
  check('struktur section pelajaran RabbitMQ valid', rqBadSection === 0);
  check('tiap pelajaran RabbitMQ memuat figur ilustrasi (20/20)', rqFig === 20);
  check('40 soal kuis RabbitMQ lengkap (4 opsi, jawaban & penjelasan) & id unik rqNN',
    rq.quizPool.length === 40 &&
    new Set(rq.quizPool.map(q => q.id)).size === rq.quizPool.length &&
    rq.quizPool.every(q => /^rq\d{2}$/.test(q.id)) &&
    !rq.quizPool.some(q =>
      !q.id || !q.q || !Array.isArray(q.options) || q.options.length !== 4 ||
      typeof q.answer !== 'number' || q.answer < 0 || q.answer > 3 || !q.explain));
  const rqRefs = (rq.refs || []).map(r => r.url);
  check('rujukan RabbitMQ (rabbitmq.com docs, tutorials, management, clustering)',
    ['https://www.rabbitmq.com/docs', 'https://www.rabbitmq.com/tutorials',
     'https://www.rabbitmq.com/docs/management', 'https://www.rabbitmq.com/docs/clustering']
      .every(u => rqRefs.includes(u)));

  // 4k) konten Redis: 16 pelajaran sesuai kurikulum redis.md + 40 soal kuis
  const rd = CONTENT.get('redis');
  check('Redis terdaftar & status ready', !!rd && rd.status === 'ready');
  check('16 pelajaran Redis', rd.lessons.length === 16);
  const rdIds = rd.lessons.map(l => l.id);
  check('id pelajaran Redis unik', new Set(rdIds).size === rdIds.length);
  check('judul, durasi, bab, intro, objectives & recap Redis terisi',
    rd.lessons.every(l => l.title && /^[\d]+([–-][\d]+)? menit$/.test(l.duration) &&
      l.chapter && Array.isArray(l.intro) && l.intro.length === 3 &&
      Array.isArray(l.objectives) && l.objectives.length === 4 &&
      Array.isArray(l.recap) && l.recap.length === 4));
  let rdBadSection = 0, rdFig = 0;
  for (const l of rd.lessons) {
    const types = new Set(l.sections.map(s => s.type));
    if (types.size < 3) rdBadSection++;
    if (l.sections.some(s => s.type === 'text' && /<figure class="fig">/.test(s.html || ''))) rdFig++;
    if (!l.sections.some(s => s.type === 'vocab' && Array.isArray(s.items) && s.items.length >= 5)) rdBadSection++;
    if (!l.sections.some(s => s.type === 'tip' || s.type === 'warn')) rdBadSection++;
    if (!l.sections.some(s => s.type === 'example' && s.code)) rdBadSection++;
    for (const s of l.sections) {
      if (s.type === 'example') {
        if (s.output !== false || !s.explain || s.explain.length < 2) rdBadSection++;
        if ((s.code || '').includes('`')) rdBadSection++;        // kode contoh bebas backtick
      }
      if (s.type === 'live') rdBadSection++;                     // bab Redis tanpa latihan live
    }
  }
  check('struktur section pelajaran Redis valid', rdBadSection === 0);
  check('tiap pelajaran Redis memuat figur ilustrasi (16/16)', rdFig === 16);
  check('40 soal kuis Redis lengkap (4 opsi, jawaban & penjelasan) & id unik rdNN',
    rd.quizPool.length === 40 &&
    new Set(rd.quizPool.map(q => q.id)).size === rd.quizPool.length &&
    rd.quizPool.every(q => /^rd\d{2}$/.test(q.id)) &&
    !rd.quizPool.some(q =>
      !q.id || !q.q || !Array.isArray(q.options) || q.options.length !== 4 ||
      typeof q.answer !== 'number' || q.answer < 0 || q.answer > 3 || !q.explain));
  const rdRefs = (rd.refs || []).map(r => r.url);
  check('rujukan Redis (redis.io docs & commands, go-redis, docker hub)',
    ['https://redis.io/docs/latest/', 'https://redis.io/docs/latest/commands/',
     'https://github.com/redis/go-redis', 'https://hub.docker.com/_/redis']
      .every(u => rdRefs.includes(u)));

  // 4l) konten fullstack: 12 pelajaran contoh proyek TokoKita + 40 soal kuis
  const fsC = CONTENT.get('fullstack');
  check('fullstack terdaftar & status ready', !!fsC && fsC.status === 'ready');
  check('12 pelajaran fullstack', fsC.lessons.length === 12);
  const fsIds = fsC.lessons.map(l => l.id);
  check('id pelajaran fullstack unik', new Set(fsIds).size === fsIds.length);
  check('judul, durasi, bab, intro, objectives & recap fullstack terisi',
    fsC.lessons.every(l => l.title && /^[\d]+([–-][\d]+)? menit$/.test(l.duration) &&
      l.chapter && Array.isArray(l.intro) && l.intro.length === 3 &&
      Array.isArray(l.objectives) && l.objectives.length >= 4 &&
      Array.isArray(l.recap) && l.recap.length >= 4));
  let fsBadSection = 0, fsFig = 0;
  for (const l of fsC.lessons) {
    const types = new Set(l.sections.map(s => s.type));
    if (types.size < 3) fsBadSection++;
    if (l.sections.some(s => s.type === 'text' && /<figure class="fig">/.test(s.html || ''))) fsFig++;
    if (!l.sections.some(s => s.type === 'vocab' && Array.isArray(s.items) && s.items.length >= 5)) fsBadSection++;
    if (!l.sections.some(s => s.type === 'tip' || s.type === 'warn')) fsBadSection++;
    if (!l.sections.some(s => s.type === 'example' && s.code)) fsBadSection++;
    for (const s of l.sections) {
      if (s.type === 'example') {
        if (s.output !== false || !s.explain || s.explain.length < 2) fsBadSection++;
      }
      if (s.type === 'live') fsBadSection++;                     // bab fullstack tanpa latihan live
    }
  }
  check('struktur section pelajaran fullstack valid', fsBadSection === 0);
  check('tiap pelajaran fullstack memuat figur ilustrasi (12/12)', fsFig === 12);
  check('marker figur fullstack unik per pelajaran (mk-fs01..12)',
    fsC.lessons.every((l, i) => {
      const fig = l.sections.map(s => s.html || '').find(h => h.includes('<figure class="fig">')) || '';
      return fig.includes('mk-fs' + String(i + 1).padStart(2, '0') + '-1');
    }));
  check('40 soal kuis fullstack lengkap (4 opsi, jawaban & penjelasan) & id unik fsNN',
    fsC.quizPool.length === 40 &&
    new Set(fsC.quizPool.map(q => q.id)).size === fsC.quizPool.length &&
    fsC.quizPool.every(q => /^fs\d{2}$/.test(q.id)) &&
    !fsC.quizPool.some(q =>
      !q.id || !q.q || !Array.isArray(q.options) || q.options.length !== 4 ||
      typeof q.answer !== 'number' || q.answer < 0 || q.answer > 3 || !q.explain));
  const fsRefs = (fsC.refs || []).map(r => r.url);
  check('rujukan fullstack (Martin Fowler, 12factor, podman, rabbitmq, react)',
    ['https://martinfowler.com/articles/microservices.html', 'https://12factor.net/',
     'https://podman.io/docs', 'https://www.rabbitmq.com/docs', 'https://react.dev/']
      .every(u => fsRefs.includes(u)));
  check('proyek contoh examples/fullstack-microservice tersedia (compose + 3 service + frontend)',
    fs.existsSync(path.join(ROOT, 'examples/fullstack-microservice/compose.yaml')) &&
    fs.existsSync(path.join(ROOT, 'examples/fullstack-microservice/services/product/cmd/main.go')) &&
    fs.existsSync(path.join(ROOT, 'examples/fullstack-microservice/services/order/cmd/main.go')) &&
    fs.existsSync(path.join(ROOT, 'examples/fullstack-microservice/services/notification/cmd/main.go')) &&
    fs.existsSync(path.join(ROOT, 'examples/fullstack-microservice/frontend/src/App.jsx')));

  // 4m) konten micro-frontend: 20 pelajaran React + 60 soal kuis
  const mfC = CONTENT.get('microfrontend');
  check('microfrontend terdaftar & status ready', !!mfC && mfC.status === 'ready');
  check('20 pelajaran micro-frontend', mfC.lessons.length === 20);
  const mfIds = mfC.lessons.map(l => l.id);
  check('id pelajaran micro-frontend unik', new Set(mfIds).size === mfIds.length);
  check('judul, durasi, bab, intro, objectives & recap micro-frontend terisi',
    mfC.lessons.every(l => l.title && /^[\d]+([–-][\d]+)? menit$/.test(l.duration) &&
      l.chapter && Array.isArray(l.intro) && l.intro.length >= 2 &&
      Array.isArray(l.objectives) && l.objectives.length >= 4 &&
      Array.isArray(l.recap) && l.recap.length >= 4));
  let mfBadSection = 0;
  for (const l of mfC.lessons) {
    const types = new Set(l.sections.map(s => s.type));
    if (types.size < 4) mfBadSection++;
    if (!l.sections.some(s => s.type === 'vocab' && Array.isArray(s.items) && s.items.length >= 5)) mfBadSection++;
    if (!l.sections.some(s => s.type === 'tip' || s.type === 'warn')) mfBadSection++;
    if (!l.sections.some(s => s.type === 'example' && s.code)) mfBadSection++;
    const html = l.sections.map(s => `${s.title || ''} ${s.html || ''} ${s.text || ''} ${Array.isArray(s.explain) ? s.explain.join(' ') : ''}`).join(' ');
    if (!/praktik|latihan/i.test(html)) mfBadSection++;
    if (!/checkpoint|verifikasi/i.test(html)) mfBadSection++;
    for (const s of l.sections) {
      if (s.type === 'example') {
        if (s.output !== false || !s.explain || s.explain.length < 2) mfBadSection++;
      }
    }
  }
  check('struktur section pelajaran micro-frontend valid (praktik + checkpoint + vocab)', mfBadSection === 0);
  check('60 soal kuis micro-frontend lengkap (4 opsi, jawaban & penjelasan) & id unik mfNN',
    mfC.quizPool.length === 60 &&
    new Set(mfC.quizPool.map(q => q.id)).size === mfC.quizPool.length &&
    mfC.quizPool.every(q => /^mf\d{2}$/.test(q.id)) &&
    !mfC.quizPool.some(q =>
      !q.id || !q.q || !Array.isArray(q.options) || q.options.length !== 4 ||
      typeof q.answer !== 'number' || q.answer < 0 || q.answer > 3 || !q.explain));
  const mfRefs = (mfC.refs || []).map(r => r.url);
  check('rujukan micro-frontend (Fowler, Module Federation, React, Vite, Playwright, Rspack, Storybook, Web Vitals)',
    ['https://martinfowler.com/articles/micro-frontends.html',
     'https://webpack.js.org/concepts/module-federation/',
     'https://react.dev/reference/react/useSyncExternalStore',
     'https://vite.dev/guide/',
     'https://github.com/originjs/vite-plugin-federation',
     'https://playwright.dev/docs/intro',
     'https://rspack.dev/',
     'https://storybook.js.org/docs',
     'https://web.dev/articles/vitals']
      .every(u => mfRefs.includes(u)));
  check('proyek contoh React tersedia (server + shell + 4 remote + paket bersama + tes)',
    fs.existsSync(path.join(ROOT, 'examples/micro-frontend-react/server.js')) &&
    fs.existsSync(path.join(ROOT, 'examples/micro-frontend-react/apps/shell/src/App.tsx')) &&
    fs.existsSync(path.join(ROOT, 'examples/micro-frontend-react/apps/shell/src/ErrorBoundary.tsx')) &&
    fs.existsSync(path.join(ROOT, 'examples/micro-frontend-react/apps/shell/src/remoteLoader.ts')) &&
    fs.existsSync(path.join(ROOT, 'examples/micro-frontend-react/apps/shell/vite.config.ts')) &&
    fs.existsSync(path.join(ROOT, 'examples/micro-frontend-react/apps/header/src/App.tsx')) &&
    fs.existsSync(path.join(ROOT, 'examples/micro-frontend-react/apps/products/src/App.tsx')) &&
    fs.existsSync(path.join(ROOT, 'examples/micro-frontend-react/apps/cart/src/App.tsx')) &&
    fs.existsSync(path.join(ROOT, 'examples/micro-frontend-react/apps/account/src/App.tsx')) &&
    fs.existsSync(path.join(ROOT, 'examples/micro-frontend-react/packages/contracts/src/index.ts')) &&
    fs.existsSync(path.join(ROOT, 'examples/micro-frontend-react/packages/shared/src/index.ts')) &&
    fs.existsSync(path.join(ROOT, 'examples/micro-frontend-react/packages/ui-kit/src/index.ts')) &&
    fs.existsSync(path.join(ROOT, 'examples/micro-frontend-react/tests/shared.test.ts')) &&
    fs.existsSync(path.join(ROOT, 'examples/micro-frontend-react/e2e-smoke.mjs')) &&
    fs.existsSync(path.join(ROOT, 'examples/micro-frontend-react/scripts/release.mjs')) &&
    fs.existsSync(path.join(ROOT, 'examples/micro-frontend-react/cdn/manifest.json')) &&
    fs.existsSync(path.join(ROOT, 'examples/micro-frontend-react/.github/workflows/ci.yml')) &&
    fs.existsSync(path.join(ROOT, 'assets/logos/microfrontend.svg')));
  check('lab micro-frontend tersedia (teknik, webpack/rspack, ssr)',
    fs.existsSync(path.join(ROOT, 'examples/micro-frontend-techniques/README.md')) &&
    fs.existsSync(path.join(ROOT, 'examples/micro-frontend-webpack/README.md')) &&
    fs.existsSync(path.join(ROOT, 'examples/micro-frontend-ssr/README.md')));
  const shellApp = fs.readFileSync(
    path.join(ROOT, 'examples/micro-frontend-react/apps/shell/src/App.tsx'), 'utf8');
  const serverSource = fs.readFileSync(
    path.join(ROOT, 'examples/micro-frontend-react/server.js'), 'utf8');
  check('otorisasi admin tersedia (guard /akun/admin + endpoint scope=all)',
    shellApp.includes('whenPath="/akun/admin"') &&
    serverSource.includes("scope') === 'all'") &&
    serverSource.includes('user.role !== \'admin\''));
  check('proyek pembanding vanilla tersedia (server + shell + 3 remote + shared)',
    fs.existsSync(path.join(ROOT, 'examples/micro-frontend/server.js')) &&
    fs.existsSync(path.join(ROOT, 'examples/micro-frontend/shell/shell.js')) &&
    fs.existsSync(path.join(ROOT, 'examples/micro-frontend/shared/bus.js')) &&
    fs.existsSync(path.join(ROOT, 'examples/micro-frontend/shared/store.js')) &&
    fs.existsSync(path.join(ROOT, 'examples/micro-frontend/remotes/header/header.js')) &&
    fs.existsSync(path.join(ROOT, 'examples/micro-frontend/remotes/products/products.js')) &&
    fs.existsSync(path.join(ROOT, 'examples/micro-frontend/remotes/cart/cart.js')));
  check('logo microfrontend.svg berformat SVG',
    fs.readFileSync(path.join(ROOT, 'assets/logos/microfrontend.svg'), 'utf8').includes('<svg'));

  // 4n) konten GraphQL: 14 pelajaran sesuai roadmap_belajar_graphql.md + 40 soal kuis
  const gqlC = CONTENT.get('graphql');
  check('GraphQL terdaftar & status ready', !!gqlC && gqlC.status === 'ready');
  check('15 pelajaran GraphQL', gqlC.lessons.length === 15);
  const gqlIds = gqlC.lessons.map(l => l.id);
  check('id pelajaran GraphQL unik', new Set(gqlIds).size === gqlIds.length);
  check('judul, durasi, bab, intro, objectives & recap GraphQL terisi',
    gqlC.lessons.every(l => l.title && /^\d+ menit$/.test(l.duration) &&
      l.chapter && Array.isArray(l.intro) && l.intro.length >= 2 &&
      Array.isArray(l.objectives) && l.objectives.length >= 4 &&
      Array.isArray(l.recap) && l.recap.length >= 5));
  check('enam bab roadmap GraphQL + bab GraphQL dengan Go terwakili',
    ['Konsep Dasar', 'Sintaksis Klien', 'Membangun GraphQL Server',
     'Frontend Integration', 'Teknik Lanjutan', 'Arsitektur Skala Besar',
     'GraphQL dengan Go']
      .every(c => gqlC.lessons.some(l => l.chapter === c)));
  let gqlBadSection = 0;
  for (const l of gqlC.lessons) {
    const types = new Set(l.sections.map(s => s.type));
    if (types.size < 4) gqlBadSection++;
    if (!l.sections.some(s => s.type === 'vocab' && Array.isArray(s.items) && s.items.length >= 5)) gqlBadSection++;
    if (!l.sections.some(s => s.type === 'tip' || s.type === 'warn')) gqlBadSection++;
    if (!l.sections.some(s => s.type === 'example' && s.code)) gqlBadSection++;
    for (const s of l.sections) {
      if (s.type === 'example') {
        if (s.output !== false || !s.explain || s.explain.length < 2) gqlBadSection++;
      }
      if (s.type === 'live') {
        if (s.lang !== 'html' || !/<!DOCTYPE/i.test(s.initial || '') || !s.hint) gqlBadSection++;
      }
    }
  }
  check('struktur section pelajaran GraphQL valid (contoh + vocab + tip/warn + live)',
    gqlBadSection === 0);
  check('latihan simulasi (live) tersebar di semua pelajaran GraphQL',
    gqlC.lessons.every(l => l.sections.some(s => s.type === 'live')));
  check('46 soal kuis GraphQL lengkap (4 opsi, jawaban & penjelasan) & id unik gqlNN',
    gqlC.quizPool.length === 46 &&
    new Set(gqlC.quizPool.map(q => q.id)).size === gqlC.quizPool.length &&
    gqlC.quizPool.every(q => /^gql\d{2}$/.test(q.id)) &&
    !gqlC.quizPool.some(q =>
      !q.id || !q.q || !Array.isArray(q.options) || q.options.length !== 4 ||
      typeof q.answer !== 'number' || q.answer < 0 || q.answer > 3 || !q.explain));
  const gqlRefs = (gqlC.refs || []).map(r => r.url);
  check('rujukan GraphQL (graphql.org, Apollo docs, Prisma docs, Odyssey, Codegen)',
    ['https://graphql.org/',
     'https://www.apollographql.com/docs/',
     'https://www.prisma.io/docs/',
     'https://odyssey.apollographql.com/',
     'https://the-guild.dev/graphql/codegen']
      .every(u => gqlRefs.includes(u)));
  check('contoh koneksi MariaDB memakai localhost:3306 root/rootpassword',
    gqlC.lessons.some(l => l.sections.some(s => s.type === 'example' &&
      /localhost:3306/.test(s.code || '') && /rootpassword/.test(s.code || ''))));
  check('logo graphql.svg berformat SVG',
    fs.readFileSync(path.join(ROOT, 'assets/logos/graphql.svg'), 'utf8').includes('<svg'));

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