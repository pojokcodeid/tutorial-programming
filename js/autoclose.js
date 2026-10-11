/* ============================================================
   autoclose.js — auto-close tag, kurung, dan tanda kutip
   untuk editor playground (tanpa library, 100% offline)

   Contoh perilaku:
     <div          + >   → <div>|</div>      (kursor di tengah)
     <img          + >   → <img>             (elemen void)
     </div         + >   → </div>            (tanpa duplikat)
     <br/          + >   → <br/>             (self-closing)
     (             + teks → (|)              (pasangan kurung)
     "             + teks → "|"              (pasangan kutip)
     <p class="     + "  → <p class="|        (menutup, bukan kembar)
     don't          + '  → don't              (apostrof, tanpa pasangan)
     Backspace di (|)    → |                  (hapus pasangan)
   ============================================================ */
'use strict';

const PgAutoClose = (() => {

  const PAIRS = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'", '`': '`' };
  const CLOSERS = { ')': '(', ']': '[', '}': '{' };
  const VOID = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr'
  ]);

  const has = (obj, k) => Object.prototype.hasOwnProperty.call(obj, k);

  /* Ganti rentang [from, to) dengan teks, lalu letakkan kursor di from+caret.
     Sengaja memicu event 'input' supaya pipeline editor (highlight, preview,
     dan autocomplete) ikut diperbarui seperti halnya saat mengetik biasa. */
  function splice(ta, from, to, text, caret) {
    ta.value = ta.value.slice(0, from) + text + ta.value.slice(to);
    const p = from + (caret == null ? text.length : caret);
    ta.setSelectionRange(p, p);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /* Hanya memindahkan kursor (tanpa mengubah teks) — beri tahu editor
     lewat event khusus supaya popup saran ikut diperbarui. */
  function moveCaret(ta, pos) {
    ta.setSelectionRange(pos, pos);
    ta.dispatchEvent(new CustomEvent('caretmove', { bubbles: true }));
  }

  /* ---- penutup tag: ketik ">" di dalam <tag ... ---- */
  function tagClose(e, ta) {
    const v = ta.value, s = ta.selectionStart, en = ta.selectionEnd;
    if (s !== en) return false;                       // sedang ada seleksi → biarkan

    const before = v.slice(0, s);
    const lt = before.lastIndexOf('<');
    const gt = before.lastIndexOf('>');
    if (lt < 0 || lt <= gt) return false;             // tidak sedang di dalam tag

    const seg = before.slice(lt + 1);
    if (seg[0] === '/') return false;                 // tag penutup </div → biarkan
    const m = /^([a-zA-Z][\w-]*)/.exec(seg);
    if (!m) return false;                             // bukan nama tag (mis. <!DOCTYPE)
    if (/\/\s*$/.test(seg)) return false;             // self-closing <br/ → biarkan

    const tag = m[1].toLowerCase();
    const after = v.slice(s);

    if (after[0] === '>') {                           // '>' sudah menunggu → lompati
      e.preventDefault();
      moveCaret(ta, s + 1);
      return true;
    }
    if (VOID.has(tag)) return false;                  // elemen void → cukup ">"
    if (after.toLowerCase().indexOf('</' + tag + '>') === 0) return false; // sudah ada

    e.preventDefault();
    splice(ta, s, en, '></' + m[1] + '>', 1);         // sisip, kursor setelah ">"
    return true;
  }

  /* ---- hapus pasangan saat Backspace di tengah ---- */
  function backspace(e, ta) {
    const s = ta.selectionStart, en = ta.selectionEnd;
    if (s !== en || s < 1) return false;
    const v = ta.value;
    if (PAIRS[v[s - 1]] !== v[s]) return false;
    e.preventDefault();
    splice(ta, s - 1, s + 1, '', 0);
    return true;
  }

  /* Apakah kursor sedang berada di dalam kutip yang belum tertutup
     pada baris ini? (dipakai supaya kutip tidak menjadi pasangan ganda) */
  function quoteTerbuka(v, s, k) {
    const line = v.slice(v.lastIndexOf('\n', s - 1) + 1, s);
    const n = line.split(k).length - 1;
    return n % 2 === 1;
  }

  /* ---- kurung & tanda kutip ---- */
  function pair(e, ta) {
    const k = e.key;
    const s = ta.selectionStart, en = ta.selectionEnd;
    const v = ta.value;
    if (!has(PAIRS, k) && !has(CLOSERS, k)) return false;

    const opener = has(PAIRS, k);                     // ( [ { " ' `
    const sym = opener && PAIRS[k] === k;             // tanda kutip (buka = tutup)

    // lompati penutup yang sudah ada tepat sesudah kursor: (|) → ()|
    if (s === en && ((has(CLOSERS, k) || sym) && v[s] === k)) {
      e.preventDefault();
      moveCaret(ta, s + 1);
      return true;
    }
    if (!opener) return false;                        // penutup biasa → biarkan

    if (sym) {
      // masih di dalam kutip yang belum ditutup → biarkan jadi penutup:
      //   <p class="   + "  →  <p class="|
      if (quoteTerbuka(v, s, k)) return false;
      // di tengah kata (mis. don't) → kutip berfungsi sebagai apostrof
      if (v[s - 1] !== undefined && !/[\s=([{<>,:]/.test(v[s - 1])) return false;
    }

    e.preventDefault();
    const sel = v.slice(s, en);
    // ada seleksi → bungkus, tanpa seleksi → buat pasangan kosong
    splice(ta, s, en, k + sel + PAIRS[k], 1 + sel.length);
    return true;
  }

  /* ---- API ---- */
  function keydown(e, ta) {
    if (!ta || !e) return false;
    if (e.isComposing || e.keyCode === 229) return false;   // komposisi IME
    if (e.ctrlKey || e.metaKey || e.altKey) return false;   // jangan ganggu pintasan
    if (e.key === 'Backspace') return backspace(e, ta);
    if (e.key === '>') return tagClose(e, ta);
    return pair(e, ta);
  }

  return { keydown };
})();
