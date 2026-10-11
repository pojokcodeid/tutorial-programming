/* ============================================================
   app.js — aplikasi utama: router, tampilan, interaksi
   ============================================================ */
'use strict';

const App = (() => {

  /* ---------------- state ---------------- */
  const quizState = { tutorial: null, phase: 'intro', questions: [], cursor: 0, nonce: Date.now() };
  let pgMode = 'html';
  let currentRoute = null;
  const esc = (s) => Util.esc(s);

  /* ---------------- ikon tutorial ----------------
     Bila "icon" berupa alamat berkas (logo resmi di
     assets/logos/), tampilkan sebagai <img>; bila
     emoji, tampilkan apa adanya. */
  function iconHtml(tut, cls) {
    const p = String(tut.icon || '');
    if (p.startsWith('assets/')) {
      return `<img class="${cls || 'tut-logo'}" src="${p}" alt="Logo ${esc(tut.title)}" draggable="false">`;
    }
    return esc(p);
  }

  /* Kotak ikon pada kartu/hero tutorial: latar warna
     hanya untuk emoji — logo resmi sudah membawa warna
     sendiri, jadi latar dibuat netral. */
  function tutIcoHtml(tut) {
    const isImg = String(tut.icon || '').startsWith('assets/');
    const style = isImg ? 'background:var(--bg-soft);box-shadow:none;' : `background:${tut.color}`;
    return `<div class="tut-ico" style="${style}">${iconHtml(tut)}</div>`;
  }

  const PG_TEMPLATES = {
    html: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Playground — HTML</title>
</head>
<body>
  <h1>Halo! 👋</h1>
  <p>Ini playground HTML. Ubah isi halaman ini, lalu klik <b>▶ Jalankan</b>.</p>
</body>
</html>`,
    css: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; }
    h1 { color: #4f46e5; }
    .kartu {
      background: #eef2ff; border-radius: 12px; padding: 16px; margin-top: 12px;
      border-left: 4px solid #4f46e5;
    }
  </style>
</head>
<body>
  <h1>Belajar CSS 🎨</h1>
  <div class="kartu">
    <p>Ubah warna, ukuran, atau tata letak dengan mengedit CSS di sebelah kiri.</p>
  </div>
</body>
</html>`,
    js: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
</head>
<body>
  <h1>Belajar JavaScript ⚡</h1>
  <button id="tombol" style="padding:8px 16px;font-size:16px">Klik saya!</button>
  <p id="hasil" style="font-size:18px">Belum diklik.</p>
  <script>
    const tombol = document.getElementById('tombol');
    tombol.addEventListener('click', () => {
      document.getElementById('hasil').textContent = 'Tombol diklik! 🎉';
    });
  <\/script>
</body>
</html>`
  };

  /* ---------------- shell ---------------- */
  function applyTheme() {
    const t = Util.localGet('bk-theme', 'light');
    document.documentElement.setAttribute('data-theme', t);
    const sw = document.getElementById('theme-switch');
    if (sw) sw.checked = (t === 'dark');
    setHlTheme(t);
  }

  function setHlTheme(t) {
    const light = document.getElementById('hl-theme-light');
    const dark = document.getElementById('hl-theme-dark');
    if (light) light.disabled = (t === 'dark');
    if (dark) dark.disabled = (t !== 'dark');
  }

  function toggleTheme() {
    const t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    Util.localSet('bk-theme', t);
    applyTheme();
    renderShell();
    if (currentRoute) renderView();
  }

  /* ---------------- sidebar ---------------- */
  function renderSidebar() {
    const nav = document.getElementById('side-nav');
    const parts = [];
    parts.push(`<a class="nav-pill ${isActive('home')}" href="#/">
      <span class="ico">🏠</span> Beranda</a>`);
    parts.push(`<a class="nav-pill ${isActive('playground')}" href="#/playground">
      <span class="ico">🧪</span> Playground</a>`);

    // Tutorial yang sedang dibuka (route daftar/lesson/kuis) —
    // hanya itu yang sub-materinya terbuka; lainnya rapi terlipat.
    const aktifId = currentRoute && (currentRoute.name === 'tutorial' || currentRoute.name === 'lesson' || currentRoute.name === 'quiz')
      ? currentRoute.tutorial : null;

    for (const tut of CONTENT.all) {
      const ready = tut.status === 'ready';
      const lessons = tut.lessons || [];
      const done = Progress.lessonsDone(tut.id);
      const pct = Progress.tutorialPercent(tut.id);
      const badge = ready
        ? (done >= lessons.length ? `<span class="badge complete">Selesai ✓</span>` : `<span class="badge">${done}/${lessons.length}</span>`)
        : `<span class="badge soon">Segera</span>`;

      // Sub-materi hanya otomatis terbuka bila tutorial ini sedang dibaca
      const terbuka = ready && aktifId === tut.id;

      parts.push(`<div class="tut-group">
        <button class="tut-head" data-action="tut-toggle" data-tut="${tut.id}" aria-expanded="${terbuka}">
          <span class="ico">${iconHtml(tut, 'ico-logo')}</span> ${esc(tut.title)} ${badge}
        </button>
        <ul class="tut-lessons" ${terbuka ? '' : 'style="display:none"'}>
          ${listLessons(tut, ready)}
        </ul>
      </div>`);
    }
    nav.innerHTML = parts.join('');
  }

  function isActive(name) {
    return currentRoute && currentRoute.name === name ? 'active' : '';
  }

  function lessonStateIcon(tut, idx) {
    const l = tut.lessons[idx];
    if (!l) return '';
    if (Progress.isCompleted(tut.id, l.id)) return `<span class="li-state complete">✓</span>`;
    if (!Progress.isUnlocked(tut.id, idx)) return `<span class="li-state locked">🔒</span>`;
    return `<span class="li-num">${idx + 1}</span>`;
  }

  function listLessons(tut, ready) {
    if (!ready) return `<li><span style="color:var(--muted);font-size:12.5px;padding:4px 10px;display:block">Materi ini sedang disiapkan…</span></li>`;
    let html = '';
    tut.lessons.forEach((l, i) => {
      const active = currentRoute && currentRoute.name === 'lesson' && currentRoute.lesson === l.id ? 'active' : '';
      html += `<li><a href="#/t/${tut.id}/${l.id}" class="${active}">
        ${lessonStateIcon(tut, i)}
        <span class="li-txt">${esc(l.title)}</span></a></li>`;
    });
    html += `<li><a href="#/t/${tut.id}/quiz" class="${currentRoute && currentRoute.name === 'quiz' ? 'active' : ''}">
      <span class="li-state">🏆</span><span class="li-txt">Ujian Akhir</span></a></li>`;
    return html;
  }

  function renderSideUser() {
    const box = document.getElementById('side-user');
    const u = Auth.current();
    if (u) {
      box.innerHTML = `<div class="setting-row" style="border:0;padding:4px 2px">
        <div><div class="t">👤 ${esc(u.username)}</div>
        <div class="s">Akun lokal · <a href="#/profil">Profil</a></div></div>
      </div>`;
    } else {
      box.innerHTML = `<div class="setting-row" style="border:0;padding:4px 2px">
        <div><div class="t">Tamu</div>
        <div class="s"><a href="#/auth">Masuk / Daftar</a> untuk menyimpan progres.</div></div>
      </div>`;
    }
  }

  /* ---------------- topbar ---------------- */
  function renderTopbar(crumb) {
    const el = document.getElementById('crumb');
    el.innerHTML = crumb;
    const btn = document.getElementById('acc-btn');
    const u = Auth.current();
    if (u) {
      btn.innerHTML = `<span class="dot"></span> ${esc(u.username)}`;
      btn.onclick = () => { location.hash = '#/profil'; };
    } else {
      btn.innerHTML = `🔑 Masuk`;
      btn.onclick = () => { location.hash = '#/auth'; };
    }
  }

  function renderShell() {
    renderSidebar();
    renderSideUser();
  }

  /* ---------------- router ---------------- */
  function parseRoute() {
    const h = location.hash.replace(/^#\/?/, '');
    const parts = h.split('/').filter(Boolean);
    if (parts.length === 0) return { name: 'home' };
    const a = parts[0], b = parts[1], c = parts[2];
    if (a === 't') {
      if (b && c === 'quiz') return { name: 'quiz', tutorial: b };
      if (b && c) return { name: 'lesson', tutorial: b, lesson: c };
      if (b) return { name: 'tutorial', tutorial: b };
    }
    if (a === 'playground') return { name: 'playground' };
    if (a === 'auth') return { name: 'auth' };
    if (a === 'profil') return { name: 'profile' };
    return { name: 'home' };
  }

  function navigate() {
    currentRoute = parseRoute();
    renderShell();
    renderView();
    window.scrollTo({ top: 0 });
    document.body.classList.remove('sidebar-open');
  }

  /* ---------------- view renderers ---------------- */

  function renderView() {
    const view = document.getElementById('view');
    const r = currentRoute;
    let crumb = '';
    let html = '';
    switch (r.name) {
      case 'home': { const h = renderHome(); html = h.html; crumb = h.crumb; break; }
      case 'tutorial': { const h = renderTutorialIndex(r.tutorial); html = h.html; crumb = h.crumb; break; }
      case 'lesson': { const h = renderLesson(r.tutorial, r.lesson); html = h.html; crumb = h.crumb; break; }
      case 'quiz': { const h = renderQuiz(r.tutorial); html = h.html; crumb = h.crumb; break; }
      case 'playground': { const h = renderPlayground(); html = h.html; crumb = h.crumb; break; }
      case 'auth': { const h = renderAuth(); html = h.html; crumb = h.crumb; break; }
      case 'profile': { const h = renderProfile(); html = h.html; crumb = h.crumb; break; }
      default: html = renderNotFound().html; crumb = 'Tidak ditemukan';
    }
    document.body.classList.remove('pg-noscroll');   // pastikan tak tersangkut di layar penuh
    view.innerHTML = html;
    renderTopbar(crumb);
    highlightCode();
    bindView();
  }

  function highlightCode() {
    const view = document.getElementById('view');
    view.querySelectorAll('pre code').forEach((el) => {
      if (!window.hljs) return;
      if (el.id === 'pg-mirror') return; // playground meng-highlight sendiri
      try {
        if (!el.classList.contains('hljs') && !el.querySelector('span[class^="hljs-"]')) {
          hljs.highlightElement(el);
        }
      } catch (e) { /* abaikan */ }
    });
  }

  /* ---------- Home ---------- */
  function renderHome() {
    const u = Auth.current();
    const last = Progress.lastActive();
    let continueCard = '';
    if (last && last.tutorial) {
      const tut = CONTENT.get(last.tutorial);
      const lesson = tut.lessons.find(l => l.id === last.lesson);
      continueCard = `<div class="card continue-card">
        <div class="cont-ico">${iconHtml(tut, 'cont-logo')}</div>
        <div class="grow">
          <h3>${lesson ? esc(lesson.title) : 'Semua selesai! 🎉'}</h3>
          <p>${lesson ? 'Lanjutkan dari pelajaran terakhirmu.' : 'Kamu sudah menyelesaikan semua pelajaran tutorial ini.'}</p>
        </div>
        <a class="btn primary" href="#/t/${tut.id}/${last.lesson}">Lanjutkan →</a>
      </div>`;
    }

    const cards = CONTENT.all.map((tut) => {
      const pct = tut.status === 'ready' ? Progress.tutorialPercent(tut.id) : 0;
      const done = Progress.lessonsDone(tut.id);
      const total = tut.lessons.length;
      if (tut.status === 'ready') {
        return `<div class="tut-card" data-action="go" data-href="#/t/${tut.id}">
          <div class="tut-top">
            ${tutIcoHtml(tut)}
            <div><h3>${esc(tut.title)}</h3><div class="tag">${esc(tut.tagline)}</div></div>
          </div>
          <p class="desc">${esc(tut.desc)}</p>
          <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
          <div class="meta"><span>${done} dari ${total} pelajaran selesai</span><b>${pct}%</b></div>
        </div>`;
      }
      return `<div class="tut-card soon">
        <div class="tut-top">
          ${tutIcoHtml(tut)}
          <div><h3>${esc(tut.title)}</h3><div class="tag">${esc(tut.tagline)}</div></div>
        </div>
        <p class="desc">${esc(tut.desc)}</p>
        <div class="soon-line">🚧 Materi sedang disiapkan · akan segera hadir</div>
      </div>`;
    }).join('');

    const crumb = `<b>Beranda</b>`;
    return {
      crumb,
      html: `
      <div class="hero">
        <div class="hero-emoji">💻</div>
        <h1>Belajar Koding, dari Nol</h1>
        <p>Tutorial pemrograman interaktif berbahasa Indonesia — bekerja 100% offline di komputermu. Materi tersusun bertahap, ada contoh kode berwarna, pratinjau langsung, playground, dan kuis yang soalnya berganti setiap hari.</p>
        <div class="actions">
          <a class="btn primary" href="#/t/html">Mulai Belajar HTML →</a>
          <a class="btn" href="#/t/css">🎨 Belajar CSS</a>
          <a class="btn ghost" href="#/playground">🧪 Coba Playground</a>
          <a class="btn ghost" href="#/profil">Pengaturan &amp; Data</a>
        </div>
      </div>
      ${continueCard}
      <div class="section-title">📚 Tutorial ${u ? '' : '<span class="count">— masuk untuk menyimpan progres belajarmu</span>'}</div>
      <div class="grid-tuts">${cards}</div>
      <div class="section-title">ℹ️ Tentang aplikasi</div>
      <div class="card" style="padding:18px 22px;font-size:14px;color:var(--text-2)">
        Aplikasi ini berjalan sepenuhnya <b>lokal &amp; offline</b>. Database memakai <b>SQLite</b> (tersimpan di browser, bisa diekspor sebagai file .sqlite dari halaman Profil). Akun dibuat lokal di komputermu — privasi terjaga, tanpa server.
      </div>`
    };
  }

  /* ---------- Tutorial index ---------- */
  function renderTutorialIndex(tid) {
    const tut = CONTENT.get(tid);
    if (!tut) return renderNotFound();
    const lessons = tut.lessons || [];
    const done = Progress.lessonsDone(tid);
    const pct = Progress.tutorialPercent(tid);
    const quizToday = Progress.bestQuizScore(tid);

    const rows = lessons.map((l, i) => {
      const unlocked = Progress.isUnlocked(tid, i);
      const completed = Progress.isCompleted(tid, l.id);
      if (!unlocked) {
        return `<div class="lesson-row locked">
          <div class="num">🔒</div>
          <div class="info"><div class="t">${esc(l.title)}</div><div class="s">Selesaikan pelajaran sebelumnya untuk membuka.</div></div>
          <span class="arrow">—</span>
        </div>`;
      }
      return `<a class="lesson-row" href="#/t/${tid}/${l.id}">
        <div class="num">${completed ? '✓' : i + 1}</div>
        <div class="info">
          <div class="t">${esc(l.title)}</div>
          <div class="s">${esc(l.chapter)} · ⏱ ${esc(l.duration)} ${completed ? '· ✓ selesai' : ''}</div>
        </div>
        <span class="arrow">→</span>
      </a>`;
    }).join('');

    /* Rujukan belajar (MDN, W3Schools, web.dev) — dari registry konten */
    const refs = tut.refs || [];
    const refsHtml = refs.length ? `<div class="section-title">📖 Rujukan
        <span class="count">— dibuka di tab baru, butuh internet</span></div>
      <div class="refs-row">${refs.map(r => `<a class="ref-chip" href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.label)} <span class="ext">↗</span></a>`).join('')}</div>` : '';

    const quizLine = quizToday
      ? `<div class="quiz-row" data-action="go" data-href="#/t/${tid}/quiz">
          <div class="num">🏆</div>
          <div class="info"><div class="t">Ujian Akhir ${esc(tut.title)}</div>
          <div class="s">Skor kamu hari ini: ${quizToday.correct}/${quizToday.total} (${quizToday.percent}%) · soal berganti setiap hari</div></div>
          <span class="arrow">▶</span>
        </div>`
      : `<div class="quiz-row" data-action="go" data-href="#/t/${tid}/quiz">
          <div class="num">🏆</div>
          <div class="info"><div class="t">Ujian Akhir ${esc(tut.title)}</div>
          <div class="s">10 soal acak — susunan soal & jawaban berganti setiap hari</div></div>
          <span class="arrow">▶</span>
        </div>`;

    return {
      crumb: `<a href="#/">Beranda</a> <span class="sep">/</span> <b>${esc(tut.title)}</b>`,
      html: `
      <div class="tut-hero">
        ${tutIcoHtml(tut)}
        <div>
          <h1>Belajar ${esc(tut.title)}</h1>
          <p class="sub">${esc(tut.desc)}</p>
        </div>
      </div>
      <div class="tut-stats">
        <span class="tut-stat">📚 <b>${lessons.length}</b> ${Util.plural(lessons.length, 'pelajaran', 'pelajaran')}</span>
        <span class="tut-stat">✅ <b>${done}</b> selesai</span>
        <span class="tut-stat">📈 <b>${pct}%</b> progres</span>
        <span class="tut-stat">📝 <b>${tut.quizPool.length}</b> soal kuis</span>
      </div>
      <div class="progress-track" style="margin-bottom:22px"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div class="section-title">Materi bertahap <span class="count">— selesaikan berurutan untuk membuka pelajaran berikutnya</span></div>
      <ul class="lesson-list">${rows}</ul>
      <div class="section-title">Ujian</div>
      ${quizLine}
      ${refsHtml}`
    };
  }

  /* ---------- Lesson ---------- */
  function renderLesson(tid, lid) {
    const tut = CONTENT.get(tid);
    if (!tut) return renderNotFound();
    const lessons = tut.lessons || [];
    const idx = lessons.findIndex(l => l.id === lid);
    if (idx < 0) return renderNotFound();
    const lesson = lessons[idx];

    const unlocked = Progress.isUnlocked(tid, idx);
    if (!unlocked) {
      const prev = lessons[idx - 1];
      return {
        crumb: `<a href="#/">Beranda</a> <span class="sep">/</span> <a href="#/t/${tid}">${esc(tut.title)}</a> <span class="sep">/</span> <b>${esc(lesson.title)}</b>`,
        html: `
        <div class="lesson-chapter">${esc(lesson.chapter)}</div>
        <h1 class="lesson-title">🔒 ${esc(lesson.title)}</h1>
        <div class="lesson-meta"><span>⏱ ${esc(lesson.duration)}</span></div>
        <div class="lock-notice">
          <span class="lock-ico">🔒</span>
          <div>Pelajaran ini <b>terkunci</b>. Materi bersifat bertahap — selesaikan <b>“${esc(prev ? prev.title : '')}”</b> terlebih dahulu, lalu kembali ke sini.</div>
        </div>
        <div class="lesson-nav">
          <a class="btn" href="#/t/${tid}/${prev ? prev.id : ''}">← Pelajaran Sebelumnya</a>
          <span class="grow"></span>
          <a class="btn" href="#/t/${tid}">Daftar Materi</a>
        </div>`
      };
    }

    const sectionsHtml = lesson.sections.map((s, i) => renderSection(s, i)).join('');

    const done = Progress.isCompleted(tid, lid);
    const next = lessons[idx + 1];
    const navNext = next
      ? `<a class="btn primary" href="#/t/${tid}/${next.id}">Lanjut: ${esc(next.title)} →</a>`
      : `<a class="btn primary" href="#/t/${tid}/quiz">🏆 Kerjakan Ujian Akhir →</a>`;

    return {
      crumb: `<a href="#/">Beranda</a> <span class="sep">/</span> <a href="#/t/${tid}">${esc(tut.title)}</a> <span class="sep">/</span> <b>${esc(lesson.title)}</b>`,
      html: `
      <div class="lesson-chapter">${esc(lesson.chapter)}</div>
      <h1 class="lesson-title">${esc(lesson.title)}</h1>
      <div class="lesson-meta"><span>⏱ ${esc(lesson.duration)}</span>
        <span class="dot"></span><span>Pelajaran ${idx + 1} dari ${lessons.length}</span>
        ${done ? '<span class="dot"></span><span class="badge complete">✓ Selesai</span>' : ''}
      </div>

      ${lesson.intro ? `<div class="objectives">
        <div class="lbl">🎯 Tujuan pembelajaran</div>
        <ul>${(lesson.objectives || []).map(o => `<li>${o}</li>`).join('')}</ul>
      </div>` : ''}

      <div class="lesson-body">
        ${lesson.intro ? lesson.intro.map(p => `<div class="intro-p">${p}</div>`).join('') : ''}
        ${sectionsHtml}
        ${lesson.recap ? `<div class="recap-box"><div class="ttl">✅ Rangkuman</div><ul>${lesson.recap.map(r => `<li>${r}</li>`).join('')}</ul></div>` : ''}
      </div>

      <div class="lesson-nav">
        ${idx > 0 ? `<a class="btn" href="#/t/${tid}/${lessons[idx - 1].id}">← Sebelumnya</a>` : ''}
        <span class="grow"></span>
        ${done
          ? `<span class="complete-hint">✓ Sudah ditandai selesai</span>`
          : `<button class="btn success" data-action="mark-complete" data-t="${tid}" data-l="${lid}">✓ Tandai Selesai</button>`}
        <a class="btn" href="#/t/${tid}">Daftar Materi</a>
        ${navNext}
      </div>`
    };
  }

  /* ---------- Section renderers ---------- */
  function renderSection(s, i) {
    switch (s.type) {
      case 'text':
        return `<div style="margin:16px 0">${s.html}</div>`;
      case 'example':
        return renderExample(s);
      case 'tip':
        return `<div class="callout tip"><span class="ci">💡</span><div><div class="ttl">${esc(s.title || 'Tips')}</div>${s.text}</div></div>`;
      case 'warn':
        return `<div class="callout warn"><span class="ci">⚠️</span><div><div class="ttl">${esc(s.title || 'Perhatian')}</div>${s.text}</div></div>`;
      case 'live':
        return renderLive(s, i);
      case 'vocab': {
        const rows = s.items.map(([term, def]) => `<tr><td>${term}</td><td>${def}</td></tr>`).join('');
        return `<div style="margin:16px 0"><table class="vocab"><tr><th>Istilah</th><th>Penjelasan</th></tr>${rows}</table></div>`;
      }
      default:
        return '';
    }
  }

  function wrapPreview(code) {
    const str = String(code);
    const lower = str.toLowerCase();
    // Rewrite referensi aset lokal (assets/*) jadi data: URL agar tampil
    // offline di iframe sandbox (origin opaque dilarang memuat file://).
    const body = (typeof BK_ASSETS !== 'undefined' && BK_ASSETS.inlineLocal) ? BK_ASSETS.inlineLocal(str) : str;
    if (lower.includes('<!doctype') || lower.includes('<html')) return body;
    return `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>${body}</body></html>`;
  }

  function renderExample(s) {
    const hasOut = !!s.output;
    const code = String(s.code == null ? '' : s.code);
    const codeHtml = `<div class="ex-code"><pre><code class="language-${esc(s.lang || 'html')}">${esc(code)}</code></pre></div>`;
    let outHtml = '';
    if (hasOut) {
      // Bila ada "doc", pratinjau memakai dokumen HTML itu dengan kode
      // contoh disisipkan pada penanda __CODE__ (mis. di dalam <style>).
      const src = s.doc ? Util.injectCode(s.doc, code) : code;
      const doc = esc(wrapPreview(src));
      outHtml = `<div class="ex-out">
        <div class="out-bar"><i></i> Hasil pratinjau</div>
        <div class="out-frame"><iframe sandbox="allow-scripts" srcdoc="${doc}"></iframe></div>
      </div>`;
    }
    let explainHtml = '';
    if (s.explain && s.explain.length) {
      explainHtml = `<div class="ex-body"><div class="lbl">Penjelasan</div><ul>${s.explain.map(e => `<li>${e}</li>`).join('')}</ul></div>`;
    }
    return `<div class="ex-card">
      <div class="ex-head"><span class="dotc">◉</span><span class="t">${esc(s.title || 'Contoh kode')}</span><span class="lang-chip">${esc(s.lang || 'html').toUpperCase()}</span></div>
      <div class="ex-grid ${hasOut ? '' : 'single'}">${codeHtml}${outHtml}</div>
      ${explainHtml}
    </div>`;
  }

  function renderLive(s, i) {
    const hint = s.hint ? `<div class="live-status"><span>💡 ${s.hint}</span></div>` : '';
    const lang = s.lang || 'html';
    // Kerangka yang sama dengan playground: gutter nomor baris, layer highlight,
    // garis bantu indentasi, textarea transparan, dan popup saran autocomplete.
    return `<div class="live-card">
      <div class="live-head">
        <span style="font-size:17px">🧪</span><span class="t">${esc(s.title || 'Coba sendiri')}</span>
        <span class="grow"></span>
        <button class="btn small" data-action="ed-full">⛶ Layar Penuh</button>
        <button class="btn small" data-action="live-reset" data-idx="${i}">↺ Reset</button>
        <button class="btn small primary" data-action="live-run" data-idx="${i}">▶ Jalankan</button>
      </div>
      <div class="live-editor-wrap code-ed">
        <div class="pg-gutter" aria-hidden="true"></div>
        <pre class="pg-mirror"><code class="language-${esc(lang)}"></code></pre>
        <div class="pg-guides" aria-hidden="true"></div>
        <textarea class="live-code pg-ta" data-lang="${esc(lang)}" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off" wrap="off">${esc(s.initial)}</textarea>
        <div class="pg-ac" hidden aria-hidden="true" role="presentation"></div>
      </div>
      ${hint}
      <div class="live-out-wrap"><iframe class="live-out" sandbox="allow-scripts" title="Hasil latihan"></iframe></div>
    </div>`;
  }

  /* ---------- Quiz ---------- */
  function renderQuiz(tid) {
    const tut = CONTENT.get(tid);
    if (!tut) return renderNotFound();
    const crumb = `<a href="#/">Beranda</a> <span class="sep">/</span> <a href="#/t/${tid}">${esc(tut.title)}</a> <span class="sep">/</span> <b>Ujian Akhir</b>`;

    if (quizState.tutorial !== tid) { quizState.tutorial = tid; quizState.phase = 'intro'; quizState.questions = []; quizState.cursor = 0; quizState.nonce = Date.now(); }

    const info = Quiz.poolInfo(tid);
    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    let html;
    if (quizState.phase === 'intro') {
      html = `<div class="card quiz-card quiz-intro">
        <div class="big">🏆</div>
        <h1>Ujian Akhir ${esc(tut.title)}</h1>
        <p>Uji pemahamanmu setelah menyelesaikan seluruh materi. Soal dan urutan jawaban <b>diacak setiap hari</b> — soal yang masih salah akan muncul lagi di ujian berikutnya.</p>
        <div class="quiz-feats">
          <span class="quiz-feat">📅 ${today}</span>
          <span class="quiz-feat">📝 ${info.perDay} dari ${info.total} soal</span>
          <span class="quiz-feat">🔀 Soal berganti tiap hari</span>
        </div>
        <button class="btn primary" data-action="quiz-start">Mulai Ujian →</button>
      </div>`;
    } else if (quizState.phase === 'play') {
      html = quizPlayHtml(quizState);
    } else {
      html = quizResultHtml(quizState);
    }

    return { crumb, html };
  }

  function quizPlayHtml(qs) {
    const q = qs.questions[qs.cursor];
    const total = qs.questions.length;
    const answered = q.picked != null;
    const pct = Math.round(((qs.cursor) / total) * 100);
    const w = (i) => {
      if (!answered) return '';
      if (i === q.correctIdx) return 'correct';
      if (i === q.picked) return 'wrong';
      return 'dim';
    };
    const opts = q.options.map((opt, i) => `
      <button class="opt ${w(i)}" data-action="quiz-answer" data-q="${qs.cursor}" data-opt="${i}" ${answered ? 'disabled' : ''}>
        <span class="letter">${Quiz.LETTERS[i]}</span> ${esc(opt)}
      </button>`).join('');

    let feedback = '';
    if (answered) {
      const good = q.picked === q.correctIdx;
      feedback = `<div class="quiz-feedback ${good ? 'good' : 'bad'}">
        <div class="t">${good ? '✅ Benar! ' : '❌ Belum tepat.'} ${good ? 'Lanjutkan!' : ''}</div>
        <div>${good ? '' : `Jawaban yang benar: <b>${esc(q.options[q.correctIdx])}</b>. `}${q.explain}</div>
      </div>`;
    }

    return `<div class="card quiz-card">
      <div class="quiz-top">
        <span class="quiz-counter">Soal <b>${qs.cursor + 1}</b> dari ${total}</span>
        <span class="badge chapter">⚡ ${qs.score} benar</span>
      </div>
      <div class="progress-track" style="margin-bottom:16px"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div class="quiz-q">${esc(q.q)}</div>
      <div class="quiz-opts">${opts}</div>
      ${feedback}
      <div class="quiz-controls">
        <a class="btn ghost" href="#/t/${qs.tutorial}">✕ Keluar</a>
        <span class="grow"></span>
        ${answered ? `<button class="btn primary" data-action="quiz-next">${qs.cursor + 1 >= total ? 'Lihat Hasil →' : 'Soal Berikutnya →'}</button>` : ''}
      </div>
    </div>`;
  }

  function quizResultHtml(qs) {
    const total = qs.questions.length;
    const score = qs.score;
    const pct = Math.round(score / total * 100);
    const cls = pct >= 75 ? 'ok' : pct >= 50 ? 'mid' : 'low';
    const verdict = pct >= 75 ? 'Luar biasa! Kamu menguasai materinya. 🎉'
      : pct >= 50 ? 'Bagus, tinggal sedikit lagi! 💪'
      : 'Jangan menyerah — pelajari ulang materinya, lalu coba lagi. 📖';
    const wrong = qs.questions.filter(q => q.picked !== q.correctIdx);
    const review = wrong.length ? `<div class="quiz-review">
      <div class="t">📝 ${wrong.length} soal yang masih salah (akan muncul lagi di ujian berikutnya)</div>
      ${wrong.map(q => `<div class="review-item">
        <div class="q">${esc(q.q)}</div>
        <div class="ans">Jawaban benar: ${esc(q.options[q.correctIdx])}</div>
        ${q.explain ? `<div class="expl">${q.explain}</div>` : ''}
      </div>`).join('')}
    </div>` : `<div class="quiz-review"><div class="t">🎯 Semua soal terjawab benar. Pertahankan!</div></div>`;

    return `<div class="card quiz-card quiz-result">
      <div class="quiz-score ${cls}">${score}/${total}</div>
      <div class="quiz-verdict">${verdict}</div>
      <div class="quiz-sub">Tingkat keberhasilan ${pct}% · soal besok akan berbeda lagi</div>
      <div class="progress-track" style="max-width:280px;margin:0 auto 18px"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div class="quiz-controls" style="justify-content:center">
        <button class="btn primary" data-action="quiz-retry">🔁 Ulangi Ujian</button>
        <a class="btn" href="#/t/${qs.tutorial}">Kembali ke Materi</a>
      </div>
      ${review}
    </div>`;
  }

  /* ---------- Playground ---------- */
  function renderPlayground() {
    const crumb = `<b>Playground</b>`;
    const initial = Util.sessionGet('bk-playground', PG_TEMPLATES.html);
    return {
      crumb,
      html: `
      <div class="pg-view" id="pg-view">
      <div class="page-head">
        <h1>🧪 Playground</h1>
        <p class="sub">Tempat bereksperimen bebas. Tulis kode di kiri, lihat hasilnya langsung di kanan — tanpa internet, tanpa server. Pakai <b>Tab</b> / <b>Shift+Tab</b> untuk meng-indentasi atau meng-unindentasi baris (atau blok yang dipilih).</p>
      </div>
      <div class="pg-toolbar">
        <div class="pg-mode">
          <button data-action="pg-mode" data-mode="html" class="${pgMode === 'html' ? 'active' : ''}">HTML</button>
          <button data-action="pg-mode" data-mode="css" class="${pgMode === 'css' ? 'active' : ''}">HTML + CSS</button>
          <button data-action="pg-mode" data-mode="js" class="${pgMode === 'js' ? 'active' : ''}">HTML + CSS + JS</button>
        </div>
        <span class="grow"></span>
        <button class="btn small" data-action="pg-full">⛶ Layar Penuh</button>
        <button class="btn small" data-action="pg-reset">↺ Reset</button>
        <button class="btn small primary" data-action="pg-run">▶ Jalankan (Ctrl/Cmd+Enter)</button>
      </div>
      <div class="pg-split">
        <div class="live-card pg-editor">
          <div class="live-head"><span class="t">Kode kamu</span></div>
          <div class="live-editor-wrap pg-editor-wrap code-ed">
            <div class="pg-gutter" id="pg-gutter" aria-hidden="true"></div>
            <pre class="pg-mirror"><code id="pg-mirror" class="language-html"></code></pre>
            <div class="pg-guides" id="pg-guides" aria-hidden="true"></div>
            <textarea class="live-code pg-ta" id="pg-code" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off" wrap="off">${esc(initial)}</textarea>
            <div class="pg-ac" hidden aria-hidden="true" role="presentation"></div>
          </div>
        </div>
        <div class="live-card">
          <div class="live-head"><span class="t">Hasil</span><span class="grow"></span><span class="lang-chip">LIVE</span></div>
          <iframe id="pg-out" sandbox="allow-scripts" title="Hasil playground"></iframe>
        </div>
      </div>
      </div>`
    };
  }

  /* ---------- Auth ---------- */
  function renderAuth() {
    const crumb = `<b>Masuk / Daftar</b>`;
    return {
      crumb,
      html: `<div class="auth-wrap">
        <div class="card" style="padding:26px">
          <div class="page-head" style="margin-bottom:16px">
            <h1 style="font-size:22px">🔑 Akun Lokal</h1>
            <p class="sub">Buat akun supaya riwayat belajarmu tersimpan (database SQLite di komputermu).</p>
          </div>
          <div class="auth-tabs">
            <button class="auth-tab active" data-action="auth-tab" data-mode="login">Masuk</button>
            <button class="auth-tab" data-action="auth-tab" data-mode="register">Daftar</button>
          </div>
          <div class="form-err" id="auth-err"></div>
          <form id="auth-form" novalidate>
            <div class="field">
              <label for="au-username">Nama pengguna</label>
              <input id="au-username" autocomplete="username" placeholder="cth: budi2026">
            </div>
            <div class="field">
              <label for="au-password">Kata sandi</label>
              <input type="password" id="au-password" autocomplete="current-password">
              <div class="hint" id="auth-hint" style="display:none">Minimal 5 karakter.</div>
            </div>
            <button class="btn primary block" type="submit" data-action="auth-submit" data-mode="login">Masuk →</button>
          </form>
          <div class="auth-info">💡 Bisa juga dipakai tanpa akun — sebagai tamu kamu tetap bisa belajar, hanya progresnya tidak tersimpan.</div>
        </div>
      </div>`
    };
  }

  /* ---------- Profile ---------- */
  function renderProfile() {
    const u = Auth.current();
    const crumb = `<b>Profil &amp; Data</b>`;
    const rows = CONTENT.all.map(tut => {
      if (tut.status === 'soon') return '';
      const pct = Progress.tutorialPercent(tut.id);
      const done = Progress.lessonsDone(tut.id);
      const total = tut.lessons.length;
      const quiz = Progress.bestQuizScore(tut.id);
      return `<div class="setting-row">
        <div><div class="t">${iconHtml(tut, 'prof-logo')} ${esc(tut.title)}</div>
        <div class="s">${done}/${total} pelajaran selesai${quiz ? ` · skor kuis hari ini ${quiz.correct}/${quiz.total}` : ''}</div></div>
        <div class="progress-track" style="width:180px"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>`;
    }).join('');

    const account = u ? `
      <div class="profile-hero">
        <div class="avatar">${esc(u.username[0].toUpperCase())}</div>
        <div><h1>${esc(u.username)}</h1>
        <div class="sub">Terdaftar sebagai pengguna lokal · database SQLite</div></div>
        <span class="badge complete" style="margin-left:auto">✓ Masuk</span>
      </div>` : `
      <div class="profile-hero">
        <div class="avatar" style="font-size:16px">?</div>
        <div><h1>Tamu</h1>
        <div class="sub">Progres tidak disimpan. <a href="#/auth">Masuk / Daftar</a> untuk menyimpan riwayat belajar.</div></div>
      </div>`;

    return {
      crumb,
      html: `
      ${account}
      <div class="section-title">Progres belajar</div>
      <div class="card">${rows || '<div class="empty">Belum ada tutorial yang tersedia.</div>'}</div>

      <div class="section-title">Tampilan</div>
      <div class="card">
        <div class="setting-row">
          <div><div class="t">Mode gelap</div><div class="s">Kurangi silau saat belajar di malam hari.</div></div>
          <label class="switch"><input type="checkbox" id="theme-switch-profil" ${document.documentElement.getAttribute('data-theme') === 'dark' ? 'checked' : ''}><span class="slider"></span></label>
        </div>
      </div>

      <div class="section-title">Data &amp; privasi (SQLite)</div>
      <div class="card">
        <div class="setting-row">
          <div><div class="t">💾 Ekspor database</div><div class="s">Unduh file <code>belajarkoding.sqlite</code> — bisa dipindahkan &amp; diimpor di komputer lain.</div></div>
          <button class="btn small" data-action="export-db">Ekspor</button>
        </div>
        <div class="setting-row">
          <div><div class="t">📥 Impor database</div><div class="s">Pulihkan progres dari file .sqlite yang pernah diekspor.</div></div>
          <button class="btn small" data-action="import-db">Impor</button>
          <input type="file" id="imp-file" accept=".sqlite,.db" style="display:none" data-action="import-file">
        </div>
        <div class="setting-row">
          <div><div class="t">🗑️ Hapus semua data</div><div class="s">Reset database: akun, progres, dan riwayat kuis ikut terhapus.</div></div>
          <button class="btn small danger" data-action="reset-data">Reset</button>
        </div>
        ${u ? `<div class="setting-row">
          <div><div class="t">🚪 Keluar</div><div class="s">Akun tetap tersimpan di database; kamu bisa masuk lagi kapan saja.</div></div>
          <button class="btn small" data-action="logout">Keluar</button>
        </div>` : ''}
      </div>

      <div class="section-title">Tentang</div>
      <div class="card" style="padding:16px 20px;font-size:13.5px;color:var(--text-2)">
        <p><b>Belajar Koding</b> — aplikasi tutorial interaktif berbahasa Indonesia. Berjalan 100% offline &amp; portabel: tinggal buka <code>index.html</code>.</p>
        <p>Teknologi: HTML, CSS, JavaScript murni · <b>SQLite</b> (sql.js/WASM, disimpan di IndexedDB) · syntax highlighting <b>highlight.js</b> — semua library tersimpan lokal.</p>
        <p>Referensi materi HTML &amp; CSS: MDN Web Docs, W3Schools, dan web.dev.</p>
      </div>`
    };
  }

  function renderNotFound() {
    return { crumb: 'Tidak ditemukan', html: `<div class="empty"><div class="big">🧭</div><h3>Halaman tidak ditemukan</h3><p>Alamat yang kamu tuju tidak ada.</p><a class="btn primary" href="#/">Kembali ke Beranda</a></div>` };
  }

  /* ---------------- bind view events ---------------- */
  function bindView() {
    const view = document.getElementById('view');

    // jalankan semua live editor sekali (agar hasil langsung terlihat)
    const liveRuns = view.querySelectorAll('[data-action="live-run"]');
    liveRuns.forEach(btn => { runLive(btn); });

    // playground
    if (currentRoute.name === 'playground') {
      const code = document.getElementById('pg-code');
      let t;
      if (code) {
        const wrap = code.closest('.pg-editor-wrap');
        PgAC.attach({ ta: code, wrap: wrap, onChange: () => pgUpdate() });

        // Perbarui saran; bila popup tampil, repaint layer highlight dulu
        // supaya posisi caret (dan popup) bisa diukur dengan tepat.
        function refreshAC() {
          const shown = PgAC.input();
          if (shown) { pgHighlight(); PgAC.place(); }
        }

        code.addEventListener('input', (e) => {
          if (!e.fromIndent) refreshAC();      // Tab/Shift+Tab: jangan buka popup saran
          clearTimeout(t); t = setTimeout(pgUpdate, 150);
        });
        code.addEventListener('scroll', () => { syncPgScroll(); PgAC.place(); });
        code.addEventListener('click', () => { if (PgAC.isOpen()) refreshAC(); });
        // auto-close hanya memindahkan kursor (tanpa 'input') → perbarui saran
        code.addEventListener('caretmove', () => { if (PgAC.isOpen()) refreshAC(); });
        code.addEventListener('keyup', (e) => {
          if (PgAC.isOpen() && ['ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].indexOf(e.key) > -1) refreshAC();
        });
        code.addEventListener('keydown', (e) => {
          if (PgAC.keydown(e)) return;          // popup menangani panah / Tab / Enter / Esc
          if (PgAutoClose.keydown(e, code)) return; // auto-close tag, kurung & kutip
          if (PgAutoIndent.keydown(e, code)) return; // auto-indent saat buka blok
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); pgUpdate(); }
        });
        code.focus();
        pgUpdate();
      }
    }

    // editor "Coba sendiri" di tiap sub bab materi
    view.querySelectorAll('.live-card:not(.pg-editor)').forEach((card) => {
      const ta = card.querySelector('textarea.live-code');
      if (!ta) return;
      const wrap = ta.closest('.live-editor-wrap');
      if (!wrap) return;
      let t;
      const refresh = () => edHighlight(edCtxOf(ta));

      // Perbarui saran; bila popup tampil, repaint layer highlight dulu
      // supaya posisi caret (dan popup) bisa diukur dengan tepat.
      function refreshAC() {
        if (PgAC.target() !== ta) return;
        const shown = PgAC.input();
        if (shown) { edHighlight(edCtxOf(ta)); PgAC.place(); }
      }

      // satu halaman punya banyak editor, popup saran hanya boleh satu aktif:
      // pasang ke editor yang sedang difokuskan (attach menyembunyikan popup lama)
      ta.addEventListener('focusin', () => PgAC.attach({ ta, wrap, onChange: refresh }));

      ta.addEventListener('input', (e) => {
        if (!e.fromIndent) refreshAC();        // Tab/Shift+Tab: jangan buka popup saran
        clearTimeout(t); t = setTimeout(refresh, 150);
      });
      ta.addEventListener('scroll', () => { edSync(edCtxOf(ta)); if (PgAC.target() === ta) PgAC.place(); });
      ta.addEventListener('click', () => { if (PgAC.isOpen()) refreshAC(); });
      // auto-close hanya memindahkan kursor (tanpa 'input') → perbarui saran
      ta.addEventListener('caretmove', () => { if (PgAC.isOpen()) refreshAC(); });
      ta.addEventListener('keyup', (e) => {
        if (PgAC.isOpen() && ['ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].indexOf(e.key) > -1) refreshAC();
      });
      ta.addEventListener('keydown', (e) => {
        if (PgAC.target() === ta && PgAC.keydown(e)) return;   // popup: panah / Tab / Enter / Esc
        if (PgAutoClose.keydown(e, ta)) return;                // auto-close tag, kurung & kutip
        if (PgAutoIndent.keydown(e, ta)) return;               // auto-indent saat buka blok
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); runLive(card); }
      });
      refresh();   // warnai kode contoh saat halaman dibuka
    });

    // form auth: cegah reload, jalankan lewat tombol
    const form = document.getElementById('auth-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = form.querySelector('[data-action="auth-submit"]');
        if (btn) btn.click();
      });
    }

    // switch tema di halaman profil
    const sw2 = document.getElementById('theme-switch-profil');
    if (sw2) sw2.addEventListener('change', toggleTheme);
  }

  function runLive(idxOrEl) {
    let card;
    if (typeof idxOrEl === 'number') {
      const cards = Array.from(document.querySelectorAll('.live-card'));
      card = cards[idxOrEl];
    } else {
      card = idxOrEl.closest('.live-card');
    }
    if (!card) return;
    const ta = card.querySelector('textarea.live-code');
    const out = card.querySelector('iframe.live-out');
    if (!ta || !out) return;
    const code = ta.value;
    out.srcdoc = wrapPreview(code);
    out.style.height = '220px';
  }

  /* ---- lapisan editor: highlight <-> textarea ----
     Berlaku untuk semua editor yang memakai kerangka .live-editor-wrap
     (playground maupun contoh "Coba sendiri" di materi). */
  const PG_UNIT = 2;   // 1 tingkat indentasi = 2 spasi (sesuai tab-size: 2)

  // Kumpulkan semua lapisan milik satu textarea.
  function edCtxOf(ta) {
    if (!ta) return null;
    const wrap = ta.closest('.live-editor-wrap');
    if (!wrap) return null;
    const pre = wrap.querySelector('.pg-mirror');
    return {
      ta, wrap, pre,
      code: pre && pre.querySelector('code'),
      gutter: wrap.querySelector('.pg-gutter'),
      guides: wrap.querySelector('.pg-guides'),
      lang: ta.getAttribute('data-lang') || 'html'
    };
  }

  function edSync(ctx) {
    if (!ctx || !ctx.ta) return;
    const st = ctx.ta.scrollTop, sl = ctx.ta.scrollLeft;
    if (ctx.pre) { ctx.pre.scrollTop = st; ctx.pre.scrollLeft = sl; }
    // gutter nomor baris: ikut gulir vertikal saja (horizontal tetap)
    if (ctx.gutter) ctx.gutter.scrollTop = st;
    // garis bantu indentasi: ikut gulir seperti mirror
    if (ctx.guides) { ctx.guides.scrollTop = st; ctx.guides.scrollLeft = sl; }
  }

  // Nomor baris + garis bantu indentasi. Dipanggil bersamaan dengan highlight
  // supaya lapisan selalu seiring dengan isi textarea.
  function edLayers(ctx) {
    if (!ctx || !ctx.ta || (!ctx.gutter && !ctx.guides)) return;
    const baris = (ctx.ta.value || '').split('\n');

    if (ctx.gutter) {
      let n = '';
      for (let i = 1; i <= baris.length; i++) n += i + '\n';
      ctx.gutter.textContent = n;
    }

    if (ctx.guides) {
      let html = '';
      for (let i = 0; i < baris.length; i++) {
        const spasi = /^[ \t]*/.exec(baris[i])[0];
        // lebar indentasi dalam satuan kolom (tab = 2 kolom)
        let kolom = 0;
        for (let j = 0; j < spasi.length; j++) kolom += (spasi[j] === '\t' ? PG_UNIT - (kolom % PG_UNIT) : 1);
        let cells = '';
        for (let x = 0; x + 1 < kolom; x += PG_UNIT) cells += '<i style="left:' + x + 'ch"></i>';
        html += '<span>' + cells + '</span>';
      }
      ctx.guides.innerHTML = html;
    }
  }

  function edHighlight(ctx) {
    if (!ctx || !ctx.ta || !ctx.code) return;
    // Playground memakai dokumen lengkap, contoh materi berupa fragmen HTML —
    // keduanya memakai grammar html (ikut mewarnai <style>/<script> di dalamnya).
    ctx.code.className = 'language-' + ctx.lang;
    ctx.code.textContent = ctx.ta.value || '';
    if (window.hljs) {
      try {
        // hljs menolak meng-highlight ulang elemen yang masih punya
        // data-highlighted, akibatnya warna hilang begitu pengguna mengetik.
        ctx.code.removeAttribute('data-highlighted');
        hljs.highlightElement(ctx.code);
      } catch (e) { /* abaikan */ }
    }
    edLayers(ctx);
    edSync(ctx);
  }

  /* pembungkus versi playground (alur lama tetap memakai nama lama) */
  function syncPgScroll() { edSync(edCtxOf(document.getElementById('pg-code'))); }
  function pgLayers() { edLayers(edCtxOf(document.getElementById('pg-code'))); }
  function pgHighlight() { edHighlight(edCtxOf(document.getElementById('pg-code'))); }

  function pgUpdate() {
    pgHighlight();
    runPlayground();
  }

  function runPlayground() {
    const code = document.getElementById('pg-code');
    const out = document.getElementById('pg-out');
    if (!code || !out) return;
    const val = code.value;
    Util.sessionSet('bk-playground', val);
    out.srcdoc = (typeof BK_ASSETS !== 'undefined' && BK_ASSETS.inlineLocal) ? BK_ASSETS.inlineLocal(val) : val;
  }

  /* Mode layar penuh untuk editor mana pun — playground (tombol di toolbar)
     maupun kartu "Coba sendiri" (tombol di kepala kartu). Esc untuk keluar. */
  function edFullscreen(box, on) {
    if (!box) return;
    const kelas = box.id === 'pg-view' ? 'pg-full' : 'live-full';
    const aktif = (on === undefined) ? !box.classList.contains(kelas) : !!on;
    box.classList.toggle(kelas, aktif);
    document.body.classList.toggle('pg-noscroll', aktif);
    const btn = box.querySelector('[data-action="pg-full"], [data-action="ed-full"]');
    if (btn) btn.textContent = aktif ? '✕ Keluar (Esc)' : '⛶ Layar Penuh';
    const ta = box.querySelector('textarea');
    if (aktif && ta) ta.focus();
    // tinggi editor berubah → selaraskan lagi lapisan & popup saran
    requestAnimationFrame(() => {
      const ctx = edCtxOf(ta);
      edSync(ctx);
      if (ctx && PgAC.target() === ta && PgAC.isOpen()) PgAC.place();
    });
  }

  /* ---------------- start quiz ---------------- */
  function startQuiz() {
    quizState.phase = 'play';
    quizState.cursor = 0;
    quizState.score = 0;
    quizState.nonce = Date.now();
    const set = Quiz.buildSet(quizState.tutorial, Quiz.DEFAULT_COUNT);
    quizState.questions = set.map(q => Object.assign({ picked: null }, Quiz.buildQuestionView(q, quizState.nonce)));
    renderView();
  }

  /* ---------------- global events ---------------- */
  function attachGlobalEvents() {
    // klik delegasi
    document.addEventListener('click', (e) => {
      const act = e.target.closest('[data-action]');
      if (!act) return;
      const action = act.getAttribute('data-action');
      handleAction(action, act, e);
    });
    document.addEventListener('change', (e) => {
      if (e.target && e.target.getAttribute && e.target.getAttribute('data-action') === 'import-file') {
        handleImportFile(e.target);
      }
    });
    // hamburger
    const ham = document.getElementById('hamburger');
    if (ham) ham.addEventListener('click', () => document.body.classList.toggle('sidebar-open'));
    document.getElementById('backdrop').addEventListener('click', () => document.body.classList.remove('sidebar-open'));
    // Esc keluar dari layar penuh playground (bila popup saran tidak sedang terbuka;
    // PgAC sudah menangani Esc lebih dulu dan mem-PreventDefault)
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      const box = document.querySelector('#pg-view.pg-full, .live-card.live-full');
      if (box) edFullscreen(box, false);
    });
    // theme toggle sidebar
    const sw = document.getElementById('theme-switch');
    if (sw) sw.addEventListener('change', toggleTheme);
  }

  async function handleAction(action, el, ev) {
    switch (action) {
      case 'go':
        location.hash = el.getAttribute('data-href');
        break;
      case 'tut-toggle': {
        const head = el;
        const list = head.nextElementSibling;
        const expanded = head.getAttribute('aria-expanded') === 'true';
        head.setAttribute('aria-expanded', String(!expanded));
        list.style.display = expanded ? 'none' : '';
        break;
      }
      case 'mark-complete': {
        const t = el.getAttribute('data-t'), l = el.getAttribute('data-l');
        await Progress.markCompleted(t, l);
        Util.toast('Pelajaran ditandai selesai. Lanjutkan! 👏', 'ok');
        renderShell();
        renderView();
        break;
      }
      case 'live-run': runLive(el); break;
      case 'live-reset': {
        const cards = Array.from(document.querySelectorAll('.live-card'));
        const idx = cards.indexOf(el.closest('.live-card'));
        if (idx < 0) break;
        const card = cards[idx];
        // ambil ulang nilai awal dari konten pelajaran
        const currentLesson = currentLessonObject();
        if (currentLesson) {
          const liveSections = currentLesson.sections.filter(s => s.type === 'live');
          const sec = liveSections[idx];
          if (sec) {
            const ta = card.querySelector('textarea.live-code');
            ta.value = sec.initial;
            runLive(card);
            edHighlight(edCtxOf(ta));   // warnai ulang + perbarui nomor baris
          }
        }
        break;
      }
      case 'quiz-start': startQuiz(); break;
      case 'quiz-answer': {
        const qi = Number(el.getAttribute('data-q'));
        const oi = Number(el.getAttribute('data-opt'));
        const q = quizState.questions[qi];
        if (!q || q.picked != null) return;
        q.picked = oi;
        const correct = oi === q.correctIdx;
        if (correct) quizState.score++;
        Quiz.record(quizState.tutorial, q.id, correct);
        renderView();
        break;
      }
      case 'quiz-next': {
        quizState.cursor++;
        if (quizState.cursor >= quizState.questions.length) {
          quizState.phase = 'done';
        }
        renderView();
        break;
      }
      case 'quiz-retry': startQuiz(); break;
      case 'pg-mode': {
        pgMode = el.getAttribute('data-mode');
        const code = document.getElementById('pg-code');
        if (code) { code.value = PG_TEMPLATES[pgMode]; Util.sessionSet('bk-playground', code.value); }
        renderView();
        break;
      }
      case 'pg-full': edFullscreen(document.getElementById('pg-view')); break;
      case 'ed-full': edFullscreen(el.closest('.live-card')); break;
      case 'pg-run': pgUpdate(); break;
      case 'pg-reset': {
        const code = document.getElementById('pg-code');
        if (code) { code.value = PG_TEMPLATES[pgMode]; Util.sessionSet('bk-playground', code.value); pgUpdate(); }
        break;
      }
      case 'auth-tab': {
        const mode = el.getAttribute('data-mode');
        const tabs = Array.from(document.querySelectorAll('.auth-tab'));
        tabs.forEach(t => t.classList.toggle('active', t === el));
        const btn = document.querySelector('[data-action="auth-submit"]');
        btn.setAttribute('data-mode', mode);
        btn.textContent = mode === 'login' ? 'Masuk →' : 'Buat Akun →';
        const hint = document.getElementById('auth-hint');
        if (hint) hint.style.display = mode === 'register' ? '' : 'none';
        break;
      }
      case 'auth-submit': {
        ev.preventDefault();
        const mode = el.getAttribute('data-mode');
        const username = (document.getElementById('au-username').value || '').trim();
        const password = document.getElementById('au-password').value || '';
        if (mode === 'register') {
          Auth.register(username, password).then((r) => {
            if (r.ok) {
              Progress.refresh().then(() => { Util.toast(`Selamat datang, ${username}! 🎉`, 'ok'); finishAuth(); });
            } else showAuthErr(r.error);
          });
        } else {
          Auth.login(username, password).then((r) => {
            if (r.ok) { Progress.refresh().then(() => { Util.toast(`Halo lagi, ${username}! 👋`, 'ok'); finishAuth(); }); }
            else showAuthErr(r.error);
          });
        }
        break;
      }
      case 'logout': {
        Auth.logout();
        Progress.refresh().then(() => {
          Util.toast('Kamu telah keluar.', 'ok');
          location.hash = '#/';
        });
        break;
      }
      case 'export-db': exportDatabase(); break;
      case 'import-db': {
        const inp = document.getElementById('imp-file');
        if (inp) inp.click();
        break;
      }
      case 'reset-data': {
        Util.confirmDialog('Hapus semua data?', 'Seluruh akun, progres, dan riwayat kuis pada database akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.', 'Ya, hapus')
          .then(async (ok) => {
            if (!ok) return;
            await DB.resetAll();
            await Progress.resetAll();   // sekaligus bersihkan progres tamu (sessionStorage)
            Auth.logout();
            await Progress.refresh();
            Util.toast('Database direset. Mulai dari awal! 🌱', 'ok');
            location.hash = '#/';
          });
        break;
      }
      default: break;
    }
  }

  async function handleImportFile(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const res = await DB.importBytes(new Uint8Array(buf));
      if (res.ok) {
        await Auth.init();
        await Progress.refresh();
        renderShell();
        renderView();
        Util.toast('Database berhasil diimpor. 🎉', 'ok');
      } else {
        Util.toast(res.error, 'err');
      }
    } catch (e) {
      Util.toast('Gagal membaca file: ' + (e.message || 'error'), 'err');
    }
    input.value = '';
  }

  function exportDatabase() {
    const bytes = DB.exportBytes();
    if (!bytes) { Util.toast('Database belum siap.', 'err'); return; }
    const blob = new Blob([bytes], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'belajarkoding.sqlite';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
    Util.toast('Database diekspor sebagai belajarkoding.sqlite', 'ok');
  }

  function showAuthErr(msg) {
    const box = document.getElementById('auth-err');
    if (box) { box.textContent = msg; box.classList.add('show'); }
  }

  function finishAuth() {
    renderShell();
    renderTopbar('<b>Beranda</b>');
    location.hash = '#/';
  }

  function currentLessonObject() {
    const r = currentRoute;
    if (!r || r.name !== 'lesson') return null;
    const tut = CONTENT.get(r.tutorial);
    if (!tut) return null;
    return tut.lessons.find(l => l.id === r.lesson) || null;
  }

  /* ---------------- boot ---------------- */
  async function boot() {
    // tangkap error agar muncul sebagai toast
    window.addEventListener('error', (e) => {
      try { Util.toast('Kendala: ' + (e.message || 'error'), 'err'); console.error(e); } catch (_) {}
    });

    const splash = document.getElementById('view');
    splash.innerHTML = `<div class="empty"><div class="big">⏳</div><h3>Memuat aplikasi…</h3><p>Menyalakan mesin SQLite &amp; memuat materi.</p></div>`;

    applyTheme();
    attachGlobalEvents();

    const r = await DB.init();
    if (!r.ok || !DB.isReady()) {
      splash.innerHTML = `<div class="empty"><div class="big">😵</div><h3>Gagal memuat database</h3>
        <p>${Util.esc(DB.getInitError() ? DB.getInitError().message : 'Kesalahan tidak diketahui')}</p>
        <p style="font-size:12.5px">Aplikasi ini memerlukan browser modern yang mendukung WebAssembly.</p></div>`;
      return;
    }

    await Auth.init();
    await Progress.refresh();

    window.addEventListener('hashchange', navigate);
    navigate();
  }

  return { boot };
})();

document.addEventListener('DOMContentLoaded', () => { App.boot(); });