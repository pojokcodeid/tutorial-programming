/* ============================================================
   hints.js — autocomplete ringan untuk editor playground
   Popup saran ala VS Code (tag HTML, atribut, properti CSS,
   keyword & cuplikan JS) — tanpa library, 100% offline.
   ============================================================ */
'use strict';

const PgAC = (() => {

  const MARK = '\u0001'; // penanda posisi kursor setelah cuplikan disisipkan
  const MAX = 12;

  /* ---------------- data saran ---------------- */
  const mk = (arr, d) => arr.map(x => (typeof x === 'string' ? { l: x, d } : Object.assign({ d }, x)));

  const TAG_HINTS = mk([
    'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'base', 'bdi', 'bdo',
    'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'cite', 'code', 'col', 'colgroup',
    'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt', 'em', 'embed',
    'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'head', 'header', 'hgroup', 'hr', 'html', 'i', 'iframe', 'img', 'input', 'ins', 'kbd',
    'label', 'legend', 'li', 'link', 'main', 'map', 'mark', 'menu', 'meta', 'meter', 'nav',
    'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'picture', 'pre',
    'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'script', 'section', 'select', 'slot',
    'small', 'source', 'span', 'strong', 'style', 'sub', 'summary', 'sup', 'table', 'tbody',
    'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track', 'u',
    'ul', 'var', 'video', 'wbr'
  ], 'elemen');

  const ATTR_GLOBAL = [
    'class', 'id', 'style', 'title', 'hidden', 'tabindex', 'lang', 'dir', 'role',
    'aria-label', 'contenteditable', 'draggable', 'spellcheck', 'data-id'
  ];

  const ATTR_BY_TAG = {
    a: ['href', 'target', 'rel', 'download', 'hreflang', 'type'],
    img: ['src', 'alt', 'width', 'height', 'loading', 'srcset', 'sizes'],
    input: ['type', 'name', 'value', 'placeholder', 'required', 'checked', 'disabled',
      'readonly', 'min', 'max', 'step', 'pattern', 'autocomplete', 'autofocus', 'accept'],
    form: ['action', 'method', 'novalidate', 'enctype', 'target'],
    button: ['type', 'name', 'value', 'disabled'],
    label: ['for'],
    select: ['name', 'multiple', 'required', 'disabled', 'size'],
    option: ['value', 'selected', 'disabled'],
    textarea: ['name', 'rows', 'cols', 'placeholder', 'required', 'readonly', 'wrap', 'maxlength'],
    link: ['href', 'rel', 'type', 'media', 'sizes'],
    meta: ['name', 'content', 'charset', 'http-equiv'],
    script: ['src', 'type', 'async', 'defer', 'crossorigin'],
    style: ['media', 'type'],
    table: ['border', 'cellpadding', 'cellspacing'],
    td: ['colspan', 'rowspan', 'headers'],
    th: ['colspan', 'rowspan', 'scope'],
    ul: ['type'],
    ol: ['start', 'type', 'reversed'],
    video: ['src', 'controls', 'autoplay', 'loop', 'muted', 'poster', 'width', 'height', 'preload'],
    audio: ['src', 'controls', 'autoplay', 'loop', 'muted', 'preload'],
    iframe: ['src', 'width', 'height', 'allow', 'sandbox', 'title', 'loading'],
    html: ['lang', 'dir'],
    body: ['onload']
  };

  const CSS_PROPS = [
    'align-items', 'align-self', 'background', 'background-color', 'background-image',
    'background-position', 'background-repeat', 'border', 'border-color', 'border-radius',
    'border-style', 'border-width', 'bottom', 'box-shadow', 'box-sizing', 'color', 'cursor',
    'display', 'flex', 'flex-direction', 'flex-wrap', 'font-family', 'font-size', 'font-style',
    'font-weight', 'gap', 'grid-template-columns', 'grid-template-rows', 'height',
    'justify-content', 'left', 'letter-spacing', 'line-height', 'list-style', 'margin',
    'margin-bottom', 'margin-left', 'margin-right', 'margin-top', 'max-height', 'max-width',
    'min-height', 'min-width', 'object-fit', 'opacity', 'overflow', 'overflow-x', 'overflow-y',
    'padding', 'padding-bottom', 'padding-left', 'padding-right', 'padding-top', 'position',
    'right', 'text-align', 'text-decoration', 'text-overflow', 'text-transform', 'top',
    'transform', 'transition', 'vertical-align', 'visibility', 'white-space', 'width',
    'word-break', 'z-index'
  ];

  // saat memilih properti, otomatis menyisipkan "properti: " dengan kursor di belakangnya
  const CSS_HINTS = CSS_PROPS.map(p => ({ l: p, d: 'properti', i: p + ': ' + MARK }));

  const CSS_VALUES = {
    display: ['block', 'flex', 'grid', 'inline', 'inline-block', 'inline-flex', 'none'],
    position: ['absolute', 'fixed', 'relative', 'static', 'sticky'],
    'text-align': ['center', 'justify', 'left', 'right'],
    'font-weight': ['normal', 'bold', 'bolder', 'lighter', '300', '400', '500', '600', '700'],
    'justify-content': ['center', 'flex-end', 'flex-start', 'space-around', 'space-between', 'space-evenly'],
    'align-items': ['baseline', 'center', 'flex-end', 'flex-start', 'stretch'],
    'flex-direction': ['column', 'column-reverse', 'row', 'row-reverse'],
    'flex-wrap': ['nowrap', 'wrap', 'wrap-reverse'],
    overflow: ['auto', 'hidden', 'scroll', 'visible'],
    cursor: ['pointer', 'default', 'grab', 'move', 'not-allowed', 'text', 'wait'],
    'border-style': ['dashed', 'dotted', 'double', 'none', 'solid'],
    'white-space': ['nowrap', 'normal', 'pre', 'pre-line', 'pre-wrap'],
    'object-fit': ['contain', 'cover', 'fill', 'none', 'scale-down'],
    'text-transform': ['capitalize', 'lowercase', 'none', 'uppercase'],
    'text-decoration': ['line-through', 'none', 'overline', 'underline'],
    'background-repeat': ['no-repeat', 'repeat', 'repeat-x', 'repeat-y'],
    'list-style': ['circle', 'decimal', 'disc', 'none', 'square'],
    'overflow-x': ['auto', 'hidden', 'scroll', 'visible'],
    'overflow-y': ['auto', 'hidden', 'scroll', 'visible'],
    'box-sizing': ['border-box', 'content-box'],
    'vertical-align': ['baseline', 'middle', 'sub', 'super', 'top', 'bottom']
  };

  const JS_HINTS = [
    // cuplikan (snippet)
    { l: 'log', d: 'cuplikan', i: 'console.log(' + MARK + ');' },
    { l: 'fn', d: 'cuplikan', i: 'function ' + MARK + '() {\n  \n}' },
    { l: 'arrow', d: 'cuplikan', i: 'const ' + MARK + ' = () => {\n  \n};' },
    { l: 'ifel', d: 'cuplikan', i: 'if (' + MARK + ') {\n  \n} else {\n  \n}' },
    { l: 'for', d: 'cuplikan', i: 'for (let i = 0; i < ' + MARK + '; i++) {\n  \n}' },
    { l: 'foreach', d: 'cuplikan', i: '.forEach((' + MARK + ') => {\n  \n});' },
    { l: 'sel', d: 'cuplikan', i: 'document.querySelector("' + MARK + '")' },
    { l: 'getid', d: 'cuplikan', i: 'document.getElementById("' + MARK + '")' },
    { l: 'add', d: 'cuplikan', i: "addEventListener('click', (" + MARK + ') => {\n  \n});' },
    { l: 'cel', d: 'cuplikan', i: 'document.createElement("' + MARK + '")' },
    { l: 'cek', d: 'cuplikan', i: "if (typeof " + MARK + " !== 'undefined') {\n  \n}" },
    // keyword
    mk([
      'const', 'let', 'var', 'function', 'return', 'if', 'else', 'while', 'do', 'break',
      'continue', 'class', 'extends', 'constructor', 'super', 'new', 'this', 'try', 'catch',
      'finally', 'throw', 'switch', 'case', 'default', 'typeof', 'instanceof', 'import',
      'from', 'export', 'async', 'await', 'delete', 'in', 'of', 'true', 'false', 'null',
      'undefined', 'NaN', 'void', 'static', 'get', 'set'
    ], 'keyword'),
    mk([
      'console', 'document', 'window', 'Math', 'JSON', 'Array', 'Object', 'String', 'Number',
      'Boolean', 'Promise', 'Date', 'RegExp', 'Map', 'Set', 'localStorage', 'fetch',
      'setTimeout', 'setInterval', 'alert'
    ], 'objek')
  ].reduce((a, b) => a.concat(b), []);

  const MEMBERS = {
    console: ['assert', 'clear', 'count', 'debug', 'error', 'group', 'groupEnd', 'info', 'log',
      'table', 'time', 'timeEnd', 'warn'],
    document: ['body', 'head', 'title', 'activeElement', 'cookie', 'readyState',
      'addEventListener', 'createElement', 'createTextNode', 'getElementById',
      'getElementsByClassName', 'getElementsByTagName', 'querySelector', 'querySelectorAll',
      'removeEventListener', 'write'],
    window: ['alert', 'confirm', 'prompt', 'fetch', 'location', 'localStorage', 'innerWidth',
      'innerHeight', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
      'requestAnimationFrame', 'addEventListener', 'open', 'scrollTo'],
    Math: ['abs', 'ceil', 'floor', 'max', 'min', 'pow', 'random', 'round', 'sqrt', 'trunc', 'PI'],
    JSON: ['parse', 'stringify'],
    Array: ['from', 'isArray'],
    Object: ['assign', 'entries', 'keys', 'values', 'freeze']
  };

  /* ---------------- deteksi konteks ---------------- */
  function cssCtx(src, word, start) {
    const v = /([a-zA-Z-]+)\s*:\s*[^;]*$/.exec(src);
    if (v) return { kind: 'css-value', prop: v[1].toLowerCase(), word, start };
    return { kind: 'css-prop', word, start };
  }

  function jsCtx(src, word, start) {
    const q = (src.match(/["'`]/g) || []).length;
    if (q % 2 === 1) return null;            // sedang di dalam string
    const m = /([A-Za-z_$][\w$]*)\s*\.\s*[\w$]*$/.exec(src);
    if (m) {
      const list = MEMBERS[m[1]];
      if (!list) return null;                // objek tidak dikenal → jangan tampilkan
      return { kind: 'member', items: mk(list, 'anggota'), word, start };
    }
    return { kind: 'js', word, start };
  }

  function analyze(text, caret) {
    const before = text.slice(0, caret);
    const wm = /[\w-]*$/.exec(before);
    const word = wm[0];
    const start = caret - word.length;

    const lt = before.lastIndexOf('<');
    const gt = before.lastIndexOf('>');

    // --- sedang di dalam tag: <tag atribut... ---
    if (lt > gt) {
      const seg = before.slice(lt + 1);
      const tagName = (/^([a-zA-Z][\w-]*)?/.exec(seg)[1] || '').toLowerCase();

      if (!/\s/.test(seg)) return { kind: 'tag', word, start };   // masih mengetik nama tag

      const quotes = (seg.match(/["']/g) || []).length;
      if (quotes % 2 === 1) {                 // di dalam nilai atribut
        const st = /style\s*=\s*["']([^"']*)$/.exec(seg);
        if (st) return cssCtx(st[1], word, start);
        const on = /on[a-z]+\s*=\s*["']([^"']*)$/.exec(seg);
        if (on) return jsCtx(on[1], word, start);
        return null;
      }
      return { kind: 'attr', tag: tagName, word, start };
    }

    // --- di dalam <script> / <style> ---
    const so = before.lastIndexOf('<script'), sc = before.lastIndexOf('</script');
    if (so !== -1 && so > sc) return jsCtx(before, word, start);
    const yo = before.lastIndexOf('<style'), yc = before.lastIndexOf('</style');
    if (yo !== -1 && yo > yc) return cssCtx(before, word, start);

    return null;                              // konteks teks biasa → tanpa saran
  }

  function attrsFor(tag) {
    const own = ATTR_BY_TAG[tag];
    return own ? mk(own, 'atribut').concat(mk(ATTR_GLOBAL, 'atribut')) : mk(ATTR_GLOBAL, 'atribut');
  }

  function build(ctx) {
    if (!ctx) return null;
    let pool;
    switch (ctx.kind) {
      case 'tag': pool = TAG_HINTS; break;
      case 'attr': pool = attrsFor(ctx.tag); break;
      case 'css-prop': pool = CSS_HINTS; break;
      case 'css-value': pool = CSS_VALUES[ctx.prop] ? mk(CSS_VALUES[ctx.prop], 'nilai') : null; break;
      case 'js': pool = JS_HINTS; break;
      case 'member': pool = ctx.items; break;
      default: return null;
    }
    if (!pool || !pool.length) return null;

    // kata kosong hanya diizinkan pada konteks yang memang menampilkan daftar penuh
    const emptyOk = ctx.kind === 'tag' || ctx.kind === 'attr' ||
      ctx.kind === 'css-value' || ctx.kind === 'member';
    const w = (ctx.word || '').toLowerCase();
    if (!w && !emptyOk) return null;

    let list = pool.filter(it => it.l.toLowerCase().indexOf(w) === 0);
    if (!list.length && w.length >= 2) list = pool.filter(it => it.l.toLowerCase().indexOf(w) > 0);
    if (!list.length) return null;
    return list.slice(0, MAX);
  }

  /* ---------------- posisi kursor ---------------- */
  function caretRectByRange() {
    const codeEl = document.getElementById('pg-mirror');
    if (!codeEl || !codeEl.firstChild) return null;
    const walker = document.createTreeWalker(codeEl, NodeFilter.SHOW_TEXT);
    let remaining = ta.selectionStart, node = null, offset = 0, n;
    while ((n = walker.nextNode())) {
      const len = n.nodeValue.length;
      if (remaining <= len) { node = n; offset = remaining; break; }
      remaining -= len;
    }
    if (!node) return null;
    const range = document.createRange();
    range.setStart(node, offset);
    range.setEnd(node, offset);
    const r = range.getBoundingClientRect();
    if (!r || (!r.width && !r.height && !r.left && !r.top)) return null;
    return r;
  }

  let mCtx = null;
  function caretRectByMeasure() {
    const cs = getComputedStyle(ta);
    if (!mCtx) mCtx = document.createElement('canvas').getContext('2d');
    mCtx.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    const space = mCtx.measureText(' ').width;
    const tab = space * (parseInt(cs.tabSize, 10) || 8);
    const line = ta.value.slice(0, ta.selectionStart).split('\n').pop();
    let x = 0;
    line.split('\t').forEach((part, i, arr) => {
      x += mCtx.measureText(part).width;
      if (i < arr.length - 1) x = (Math.floor(x / tab) + 1) * tab;
    });
    const lh = parseFloat(cs.lineHeight) || 20;
    const lines = ta.value.slice(0, ta.selectionStart).split('\n').length - 1;
    const wr = wrap.getBoundingClientRect();
    const top = wr.top + parseFloat(cs.paddingTop) + lines * lh - ta.scrollTop;
    const left = wr.left + parseFloat(cs.paddingLeft) + x - ta.scrollLeft;
    return { left, right: left, top, bottom: top + lh, width: 0, height: lh };
  }

  function caretRect() {
    return caretRectByRange() || caretRectByMeasure();
  }

  /* ---------------- state & panel ---------------- */
  let ta = null, wrap = null, box = null, onChange = null;
  let list = [], ctx = null, idx = 0, open = false;

  function render() {
    const e = (s) => Util.esc(String(s));
    box.innerHTML = '<ul role="listbox">' + list.map((it, i) =>
      '<li role="option" data-i="' + i + '"' + (i === idx ? ' class="on"' : '') + '>' +
      '<span class="l">' + e(it.l) + '</span><span class="d">' + e(it.d || '') + '</span></li>'
    ).join('') + '</ul><div class="hint">↑↓ pilih · Tab/Enter sisipkan · Esc tutup</div>';
    const ul = box.querySelector('ul');
    if (ul) ul.scrollTop = 0;
  }

  function hide() {
    open = false;
    if (box) { box.hidden = true; box.setAttribute('aria-hidden', 'true'); }
  }

  function mark() {
    if (!box) return;
    const ul = box.querySelector('ul');
    if (!ul) return;
    const lis = box.querySelectorAll('li');
    lis.forEach((li, i) => li.classList.toggle('on', i === idx));
    const on = lis[idx];
    if (!on) return;
    const br = ul.getBoundingClientRect(), lr = on.getBoundingClientRect();
    if (lr.bottom > br.bottom) ul.scrollTop += lr.bottom - br.bottom;
    else if (lr.top < br.top) ul.scrollTop -= br.top - lr.top;
  }

  function move(d) {
    if (!open || !list.length) return;
    idx = (idx + d + list.length) % list.length;
    mark();
  }

  function accept() {
    const it = list[idx];
    if (!it || !ta || !ctx) return;
    const v = ta.value, s = ctx.start, e = ta.selectionStart;
    let ins = it.i != null ? it.i : it.l;
    let pos = null;
    const m = ins.indexOf(MARK);
    if (m >= 0) { pos = s + m; ins = ins.split(MARK).join(''); }
    ta.value = v.slice(0, s) + ins + v.slice(e);
    const p = pos != null ? pos : s + ins.length;
    ta.setSelectionRange(p, p);
    hide();
    if (onChange) onChange();
  }

  function onMouseDown(e) {
    const li = e.target.closest('li');
    e.preventDefault();                       // jangan pindahkan fokus dari editor
    if (!li) return;
    idx = Number(li.dataset.i);
    accept();
  }

  function onMouseMove(e) {
    const li = e.target.closest('li');
    if (!li) return;
    const i = Number(li.dataset.i);
    if (i !== idx) { idx = i; mark(); }
  }

  /* ---------------- API ---------------- */
  function attach(o) {
    ta = o.ta || null;
    wrap = o.wrap || null;
    onChange = o.onChange || null;
    box = wrap ? wrap.querySelector('.pg-ac') : null;
    if (box && !box.dataset.ac) {
      box.dataset.ac = '1';
      box.addEventListener('mousedown', onMouseDown);
      box.addEventListener('mousemove', onMouseMove);
    }
    if (ta && !ta.dataset.ac) {
      ta.dataset.ac = '1';
      ta.addEventListener('blur', hide);
    }
    hide();
  }

  function input() {
    if (!ta || !box) return false;
    ctx = analyze(ta.value, ta.selectionStart);
    list = build(ctx);
    if (!list) { hide(); return false; }
    idx = 0;
    render();
    open = true;
    box.hidden = false;
    box.setAttribute('aria-hidden', 'false');
    return true;
  }

  function place() {
    if (!open || !box || !wrap || !ta) return;
    const r = caretRect();
    if (!r) return;
    const wr = wrap.getBoundingClientRect();
    box.style.left = '0px'; box.style.top = '0px';
    const bw = box.offsetWidth, bh = box.offsetHeight;
    let left = r.left - wr.left;
    let top = r.bottom - wr.top + 6;
    if (left + bw > wr.width - 6) left = wr.width - bw - 6;
    if (left < 6) left = 6;
    if (top + bh > wr.height - 6) top = r.top - wr.top - bh - 6;
    if (top < 6) top = 6;
    box.style.left = Math.round(left) + 'px';
    box.style.top = Math.round(top) + 'px';
  }

  function keydown(e) {
    // pintasan dengan modifier (mis. Ctrl/Cmd+Enter = Jalankan) diteruskan
    if (!open || e.metaKey || e.ctrlKey || e.altKey) return false;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); move(1); return true;
      case 'ArrowUp': e.preventDefault(); move(-1); return true;
      case 'Enter':
      case 'Tab': e.preventDefault(); accept(); return true;
      case 'Escape': e.preventDefault(); hide(); return true;
      default: return false;
    }
  }

  return {
    attach, input, place, keydown, hide,
    isOpen: () => open,
    // textarea yang sedang terpasang — satu halaman bisa punya banyak editor
    // (playground + tiap contoh "Coba sendiri"), popup hanya boleh satu aktif.
    target: () => ta
  };
})();
