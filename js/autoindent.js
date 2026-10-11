/* ============================================================
   autoindent.js — auto-indent untuk editor playground
   (tanpa library, 100% offline)

   Contoh perilaku:
     "  <div>|</div>" + Enter →
        <div>
          |                     (kursor 1 tingkat lebih dalam)
        </div>
     "if (x) {"      + Enter →  indentasi bertambah 1 tingkat
     "    teks"      + Enter →  baris baru ikut "    "
     ketik "}" di baris yang hanya berisi spasi →
                                rata dengan baris pembuka "{" nya
     ketik "}" saat penutup otomatis menunggu di bawah →
                                baris kosong dihapus, jadikan satu "}"
     Tab              + kursor/seleksi → indentasi 1 tingkat
     Shift+Tab        + kursor/seleksi → unindent 1 tingkat
   ============================================================ */
'use strict';

const PgAutoIndent = (() => {

  const UNIT = '  ';                       // 2 spasi (sesuai template & tab-size: 2)

  const VOID = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr'
  ]);

  const PAIR_OPEN = { '}': '{', ')': '(', ']': '[' };

  const lead = (s) => /^[ \t]*/.exec(s)[0];
  const lineStart = (v, s) => v.lastIndexOf('\n', s - 1) + 1;

  /* Ganti rentang [from, to) dengan teks, lalu letakkan kursor di from+caret.
     Memantik event 'input' supaya highlight, preview, dan autocomplete ikut
     diperbarui — sama seperti saat mengetik biasa. */
  function splice(ta, from, to, text, caret) {
    ta.value = ta.value.slice(0, from) + text + ta.value.slice(to);
    const p = from + (caret == null ? text.length : caret);
    ta.setSelectionRange(p, p);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /* Penutup yang menempel tepat sesudah kursor: ) } ] </tag> */
  function closerAfter(v, s) {
    const m = /^([)\]}]|<\/[a-zA-Z][\w-]*>)/.exec(v.slice(s));
    return m ? m[1] : null;
  }

  /* Apakah teks baris (sampai kursor) menandai pembuka blok baru? */
  function bukaBlok(t) {
    const x = t.replace(/[ \t]+$/, '');
    if (!x) return false;
    if (/[{(\[]$/.test(x)) return true;                 // { ( [
    if (/=$/.test(x)) return true;                      // = (lanjutan nilai)
    if (/:$/.test(x)) return true;                      // color: / case x:
    if (/>$/.test(x)) {
      const lt = x.lastIndexOf('<');
      if (lt >= 0) {
        const seg = x.slice(lt);
        const m = /^<([a-zA-Z][\w-]*)/.exec(seg);
        if (!m) return false;                           // </h1>, < 3 > → blok biasa
        if (VOID.has(m[1].toLowerCase())) return false;  // <img>, <br> → tidak buka blok
      }
      return true;                                      // <div>, =>
    }
    return false;
  }

  /* ---- Enter: lanjutkan / tambah indentasi ---- */
  function autoIndent(e, ta) {
    const v = ta.value, s = ta.selectionStart, en = ta.selectionEnd;
    if (s !== en) return false;                         // ada seleksi → biarkan

    const ls = lineStart(v, s);
    const baris = v.slice(ls, s);                       // teks baris s/d kursor
    const base = lead(baris);
    const dekat = closerAfter(v, s);                    // ) } ] </tag> menempel?
    const blok = bukaBlok(baris);

    let sisip, caret;
    if (dekat) {
      // buka blok: sisipkan baris di dalam, penutup turun ke baris berikut
      sisip = '\n' + base + UNIT + '\n' + base;
      caret = 1 + base.length + UNIT.length;
    } else if (blok) {
      sisip = '\n' + base + UNIT;                       // tambah satu tingkat
      caret = 1 + base.length + UNIT.length;
    } else {
      sisip = '\n' + base;                              // lanjut indentasi yang sama
      caret = 1 + base.length;
    }
    e.preventDefault();
    splice(ta, s, en, sisip, caret);
    return true;
  }

  /* Indentasi baris tempat pasangan pembuka ditemukan */
  function openerIndent(v, s, open, close) {
    let depth = 0;
    for (let i = s - 1; i >= 0; i--) {
      const c = v[i];
      if (c === close) depth++;
      else if (c === open) {
        if (depth === 0) return lead(v.slice(lineStart(v, i), i));
        depth--;
      }
    }
    return null;
  }

  /* ---- mengetik ) } ] di baris kosong → ratakan dengan pembukanya ----
     Bila penutupnya sudah menunggu di baris bawah (hasil auto-close),
     baris kosong ikut dihapus supaya tidak jadi ganda: "}}" → "}" */
  function closeDedent(e, ta) {
    const k = e.key;
    const s = ta.selectionStart, en = ta.selectionEnd;
    if (s !== en) return false;
    const v = ta.value;
    const ls = lineStart(v, s);
    if (/\S/.test(v.slice(ls, s))) return false;        // masih ada kode di baris ini
    const ind = openerIndent(v, s, PAIR_OPEN[k], k);
    if (ind == null) return false;                      // pasangannya tak ditemukan

    let to = s;                                         // sampai mana teks diganti
    const tunggu = /^[ \t]*(?:\n[ \t]*)?([)\]}])/.exec(v.slice(s));
    if (tunggu && tunggu[1] === k) to = s + tunggu[0].length;   // pakai penutup bawah

    e.preventDefault();
    splice(ta, ls, to, ind + k, (ind + k).length);
    return true;
  }

  const kunciDedent = (k) => k === '}' || k === ')' || k === ']';

  /* ---- Tab / Shift+Tab: indentasi & unindent baris atau seleksi ---- */

  const indentLine = (line) => UNIT + line;

  /* Buang satu tingkat: satu tab ATAU spasi awal (maks. sepanjang UNIT) */
  function outdentLine(line) {
    if (line.charAt(0) === '\t') return line.slice(1);
    let n = 0;
    while (n < UNIT.length && line.charAt(n) === ' ') n++;
    return line.slice(n);
  }

  /* Rentang baris yang disentuh Tab: dari awal baris berisi selectionStart
     sampai akhir baris berisi selectionEnd.
     Seleksi yang berakhir PERSIS di awal sebuah baris tidak menarik baris
     itu (pindah baris saat memblok tidak ikut ter-indentasi). */
  function lineRange(v, s, en) {
    const from = lineStart(v, s);
    if (en > lineStart(v, en)) {                  // berada di tengah baris
      const nl = v.indexOf('\n', en);
      return { from, to: nl < 0 ? v.length : nl + 1 };
    }
    if (en > s) return { from, to: en };          // berakhir tepat di awal baris
    const nl = v.indexOf('\n', s);                // tanpa seleksi → baris ini saja
    return { from, to: nl < 0 ? v.length : nl + 1 };
  }

  function reindent(e, ta, shift) {
    const v = ta.value, s = ta.selectionStart, en = ta.selectionEnd;
    const range = lineRange(v, s, en);
    const chunk = v.slice(range.from, range.to);
    const adaNL = chunk.charAt(chunk.length - 1) === '\n';
    const lines = chunk.split('\n');
    if (adaNL) lines.pop();                       // entri kosong palsu sesudah '\n' terakhir

    const oldStart = [], oldLen = [], newStart = [], delta = [], hasil = [];
    let off = range.from, newOff = range.from, total = 0, berubah = false;

    for (const line of lines) {
      const next = shift ? outdentLine(line) : indentLine(line);
      if (next !== line) berubah = true;
      const d = next.length - line.length;
      oldStart.push(off); oldLen.push(line.length);
      newStart.push(newOff); delta.push(d);
      hasil.push(next);
      off += line.length + 1;                     // +1 untuk '\n'
      newOff += next.length + 1;
      total += d;
    }

    // Tab selalu dikonsumsi di editor: jangan sampai fokus lompat keluar
    e.preventDefault();
    if (!berubah) return true;                    // tak ada yang bisa dihapus (outdent)

    const text = hasil.join('\n') + (adaNL ? '\n' : '');

    /* Geser seleksi supaya tetap menempel pada teks yang sama */
    function map(pos) {
      if (pos < range.from) return pos;
      if (pos >= range.to) return pos + total;
      for (let i = 0; i < oldStart.length; i++) {
        if (pos < oldStart[i]) break;
        const rel = pos - oldStart[i];
        if (rel > oldLen[i]) continue;                                // sudah lewat '\n' → baris berikutnya
        if (rel === oldLen[i]) return newStart[i] + hasil[i].length;  // tepat di karakter '\n'
        const d = delta[i];
        const nr = d >= 0 ? rel + d : Math.max(0, rel + d);           // sisipan/diawal baris
        return newStart[i] + Math.min(nr, hasil[i].length);
      }
      return pos;
    }

    ta.value = v.slice(0, range.from) + text + v.slice(range.to);
    ta.setSelectionRange(map(s), map(en));
    const ev = new Event('input', { bubbles: true });
    ev.fromIndent = true;      // penanda: jangan membuka popup saran autocomplete
    ta.dispatchEvent(ev);      // refresh highlight/preview/AC
    return true;
  }

  /* ---- API ---- */
  function keydown(e, ta) {
    if (!ta || !e) return false;
    if (e.isComposing || e.keyCode === 229) return false;   // komposisi IME
    if (e.ctrlKey || e.metaKey || e.altKey) return false;   // jangan ganggu pintasan
    if (e.key === 'Enter') return autoIndent(e, ta);
    if (e.key === 'Tab') return reindent(e, ta, !!e.shiftKey);
    if (kunciDedent(e.key)) return closeDedent(e, ta);
    return false;
  }

  return { keydown };
})();
