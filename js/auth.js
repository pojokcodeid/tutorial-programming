/* ============================================================
   auth.js — login/registrasi + sesi (akun lokal)
   ============================================================ */
'use strict';

const Auth = (() => {
  let user = null; // {id, username}

  const SESSION_KEY = 'bk-session';

  async function init() {
    const s = Util.localGet(SESSION_KEY, null);
    if (s && s.id) {
      const row = DB.get('SELECT id, username FROM users WHERE id = ?', [s.id]);
      if (row) user = { id: row.id, username: row.username };
      else { Util.localSet(SESSION_KEY, null); user = null; }
    }
    return user;
  }

  function current() { return user; }
  function isLoggedIn() { return !!user; }

  function validate(username, password) {
    if (!/^[a-zA-Z0-9_.-]{3,20}$/.test(username)) {
      return 'Nama pengguna 3–20 karakter, hanya huruf, angka, titik, garis bawah, atau strip.';
    }
    if (password.length < 5) return 'Kata sandi minimal 5 karakter.';
    return null;
  }

  async function register(username, password) {
    const err = validate(username, password);
    if (err) return { ok: false, error: err };

    const existing = DB.get('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) return { ok: false, error: 'Nama pengguna sudah dipakai, pilih yang lain.' };

    const salt = Util.randHex(8);
    const hash = Util.sha256(salt + password);
    const ok = DB.run('INSERT INTO users (username, password_hash, salt) VALUES (?, ?, ?)', [username, hash, salt]);
    if (!ok) return { ok: false, error: 'Gagal menyimpan akun.' };

    const row = DB.get('SELECT id, username FROM users WHERE username = ?', [username]);
    user = { id: row.id, username: row.username };
    Util.localSet(SESSION_KEY, user);
    return { ok: true };
  }

  async function login(username, password) {
    const row = DB.get('SELECT id, username, password_hash, salt FROM users WHERE username = ?', [username]);
    if (!row) return { ok: false, error: 'Akun tidak ditemukan. Periksa nama pengguna.' };
    const hash = Util.sha256(row.salt + password);
    if (hash !== row.password_hash) return { ok: false, error: 'Kata sandi salah.' };
    user = { id: row.id, username: row.username };
    Util.localSet(SESSION_KEY, user);
    return { ok: true };
  }

  function logout() {
    user = null;
    Util.localSet(SESSION_KEY, null);
  }

  function isGuest() { return !user; }

  return { init, current, isLoggedIn, isGuest, register, login, logout };
})();