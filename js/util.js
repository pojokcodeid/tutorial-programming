/* ============================================================
   util.js — fungsi bantu umum
   ============================================================ */
'use strict';

const Util = (() => {

  /* ---- escape HTML ---- */
  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ---- builder DOM ---- */
  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k === 'text') node.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : v);
    }
    for (const c of children.flat(Infinity)) {
      if (c == null || c === false) continue;
      node.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return node;
  }

  /* ---- SHA-256 (murni JS, tanpa WebCrypto agar aman di file://) ---- */
  const __te = (typeof TextEncoder !== 'undefined') ? new TextEncoder() : null;
  function utf8Encode(str) {
    if (__te) return __te.encode(String(str));
    // fallback manual (lingkungan tanpa TextEncoder)
    const s = unescape(encodeURIComponent(String(str)));
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }

  function sha256(str) {
    return sha256Bytes(utf8Encode(str));
  }

  function sha256Bytes(bytes) {
    const K = new Uint32Array([
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ]);
    const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));

    const l = bytes.length;
    const withOne = l + 1;
    const padded = new Uint8Array(((withOne + 8 + 63) >> 6) << 6);
    padded.set(bytes);
    padded[l] = 0x80;
    const dv = new DataView(padded.buffer);
    dv.setUint32(padded.byteLength - 8, Math.floor(l / 0x20000000));
    dv.setUint32(padded.byteLength - 4, (l << 3) >>> 0);

    const w = new Uint32Array(64);
    for (let i = 0; i < padded.length; i += 64) {
      for (let t = 0; t < 16; t++) w[t] = dv.getUint32(i + t * 4);
      for (let t = 16; t < 64; t++) {
        const s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
        const s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
      }
      let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (let t = 0; t < 64; t++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K[t] + w[t]) >>> 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
    }
    let out = '';
    for (let i = 0; i < 8; i++) out += H[i].toString(16).padStart(8, '0');
    return out;
  }

  /* ---- random ---- */
  function randHex(len) {
    try {
      const a = new Uint8Array(len);
      crypto.getRandomValues(a);
      return Array.from(a, b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      let s = '';
      for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
      return s;
    }
  }

  /* ---- RNG deterministik ---- */
  function xmur3(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return (h ^= h >>> 16) >>> 0;
    };
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function rngFromString(str) {
    const seedGen = xmur3(String(str));
    return mulberry32(seedGen());
  }

  function seededShuffle(arr, seedStr) {
    const rng = rngFromString(seedStr);
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ---- base64 ↔ bytes ---- */
  function b64ToBytes(b64) {
    try {
      if (typeof Uint8Array.fromBase64 === 'function') {
        return Uint8Array.fromBase64(b64);
      }
    } catch (e) { /* jatuh ke fallback */ }
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function bytesToB64(bytes) {
    let s = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      s += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(s);
  }

  /* ---- storage aman (file:// bisa gagal) ---- */
  // Beberapa browser/webview memblokir localStorage (bahkan sessionStorage) pada
  // URL file://. Semua akses dibungkus try/catch dengan fallback berjenjang:
  // localStorage → sessionStorage → memori (masa satu sesi) agar fitur seperti
  // tema gelap & sesi login tetap berfungsi di lingkungan mana pun.
  const memStore = new Map();
  function localGet(key, def) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }
    catch (e) { return sessionGet(key, def); }
  }
  function localSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) { return sessionSet(key, val); }
  }
  function sessionGet(key, def) {
    try { const v = sessionStorage.getItem(key); return v ? JSON.parse(v) : def; }
    catch (e) { return memStore.has(key) ? JSON.parse(memStore.get(key)) : def; }
  }
  function sessionSet(key, val) {
    try { sessionStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) { memStore.set(key, JSON.stringify(val)); return true; }
  }

  /* ---- toast ---- */
  function toast(msg, type = 'info', ms = 3200) {
    let root = document.getElementById('toast-root');
    if (!root) { root = el('div', { id: 'toast-root' }); document.body.appendChild(root); }
    const t = el('div', { class: 'toast ' + (type === 'ok' ? 'ok' : type === 'err' ? 'err' : '') }, msg);
    root.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, ms - 250);
    setTimeout(() => t.remove(), ms);
  }

  /* ---- modal konfirmasi ---- */
  function confirmDialog(title, message, okLabel = 'Ya', cancelLabel = 'Batal') {
    return new Promise((resolve) => {
      const root = document.getElementById('modal-root');
      const close = (val) => { root.classList.remove('open'); root.innerHTML = ''; resolve(val); };
      const m = el('div', { class: 'modal' },
        el('h3', { text: title }),
        el('p', { text: message }),
        el('div', { class: 'modal-actions' },
          el('button', { class: 'btn ghost', text: cancelLabel, onclick: () => close(false) }),
          el('button', { class: 'btn danger', text: okLabel, onclick: () => close(true) })
        )
      );
      root.innerHTML = '';
      root.appendChild(m);
      root.classList.add('open');
    });
  }

  /* ---- format ---- */
  function plural(n, satu, banyak) { return n === 1 ? satu : banyak; }
  function dateId(ts) {
    return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  /* ---- mimetype file ---- */
  function mime(name) {
    const ext = name.split('.').pop().toLowerCase();
    return ext === 'sqlite' || ext === 'db' ? 'application/x-sqlite3' : 'application/octet-stream';
  }

  /* Sisipkan kode contoh ke templat dokumen pratinjau: setiap
     penanda __CODE__ dalam dokumen diganti dengan isi `code`.
     Dipakai contoh "example" yang kodenya hanya berisi CSS (atau
     JS), sedangkan pratinjau membutuhkan dokumen HTML lengkap. */
  function injectCode(doc, code) {
    return String(doc).split('__CODE__').join(String(code == null ? '' : code));
  }

  return {
    esc, el, sha256, sha256Bytes,
    randHex, rngFromString, seededShuffle, xmur3, mulberry32,
    b64ToBytes, bytesToB64,
    localGet, localSet, sessionGet, sessionSet,
    toast, confirmDialog, plural, dateId, mime, injectCode
  };
})();