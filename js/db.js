/* ============================================================
   db.js — SQLite via sql.js (WASM) + persistensi ke IndexedDB
   ============================================================ */
'use strict';

const DB = (() => {
  let SQL = null;      // modul sql.js
  let db = null;       // instance Database
  let ready = false;
  let initError = null;
  let dirty = false;
  let persistTimer = null;
  let persistFailed = false;

  const SCHEMA = `
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt          TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS progress (
      user_id    INTEGER NOT NULL,
      tutorial   TEXT NOT NULL,
      lesson     TEXT NOT NULL,
      completed  INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      PRIMARY KEY (user_id, tutorial, lesson)
    );
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL,
      tutorial    TEXT NOT NULL,
      question_id TEXT NOT NULL,
      correct     INTEGER NOT NULL,
      attempted_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_quiz_user ON quiz_attempts(user_id, tutorial, question_id);
  `;

  /* ---- inisialisasi ---- */
  async function init(forceNew = false) {
    if (ready && !forceNew) return { ok: true };
    try {
      if (!window.initSqlJs) throw new Error('Library sql.js tidak ditemukan.');
      SQL = await window.initSqlJs({ wasmBinary: Util.b64ToBytes(SQL_WASM_BASE64) });

      if (!forceNew) {
        const saved = await IDB.get('sqlite-db');
        if (saved && saved.length) {
          try {
            db = new SQL.Database(new Uint8Array(saved));
            const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
            const hasUsers = tables.length && tables[0].values.some(r => r[0] === 'users');
            if (!hasUsers) { db.close(); db = null; }
          } catch (e) { if (db) { try { db.close(); } catch (_) {} } db = null; }
        }
      }

      if (!db) {
        db = new SQL.Database();
        db.exec(SCHEMA);
        await persistNow();
      } else {
        // pastikan skema selalu ada (migrasi ringan)
        try { db.exec(SCHEMA); } catch (e) { /* abaikan */ }
      }

      ready = true;
      initError = null;
      return { ok: true };
    } catch (e) {
      initError = e;
      ready = false;
      return { ok: false, error: e };
    }
  }

  function isReady() { return ready; }
  function getInitError() { return initError; }

  /* ---- query helpers ---- */
  function all(sql, params = []) {
    if (!db) return [];
    try {
      const stmt = db.prepare(sql);
      try {
        stmt.bind(params);
        const rows = [];
        while (stmt.step()) rows.push(stmt.getAsObject());
        return rows;
      } finally { stmt.free(); }
    } catch (e) {
      console.error('DB all error:', e);
      return [];
    }
  }

  function get(sql, params = []) { return all(sql, params)[0] || null; }

  /* ---- eksekusi mutasi ---- */
  function run(sql, params = []) {
    if (!db) return null;
    try {
      const stmt = db.prepare(sql);
      try { stmt.bind(params); stmt.step(); } finally { stmt.free(); }
      markDirty();
      return true;
    } catch (e) {
      console.error('DB run error:', e);
      return false;
    }
  }

  function exec(sql) {
    if (!db) return [];
    try { const r = db.exec(sql); markDirty(); return r; }
    catch (e) { console.error('DB exec error:', e); return []; }
  }

  /* ---- persistensi ---- */
  function markDirty() {
    dirty = true;
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => { persistNow(); }, 600);
  }

  async function persistNow() {
    if (!db || !dirty && !persistFailed) return;
    try {
      const data = db.export();
      const ok = await IDB.set('sqlite-db', data);
      if (ok) { dirty = false; persistFailed = false; }
      else { persistFailed = true; }
    } catch (e) {
      persistFailed = true;
      console.error('persist gagal:', e);
    }
  }

  /* ---- ekspor / impor file .sqlite ---- */
  function exportBytes() {
    if (!db) return null;
    dirty = false;
    return db.export();
  }

  async function importBytes(bytes) {
    try {
      const test = new SQL.Database(new Uint8Array(bytes));
      const tables = test.exec("SELECT name FROM sqlite_master WHERE type='table'");
      const hasUsers = tables.length && tables[0].values.some(r => r[0] === 'users');
      if (!hasUsers) { test.close(); return { ok: false, error: 'File bukan database Belajar Koding (tidak ada tabel users).' }; }
      const count = test.exec('SELECT count(*) c FROM users')[0].values[0][0];
      if (count > 0 && !test.exec("SELECT id FROM users LIMIT 1")[0].values.length) { test.close(); return { ok: false, error: 'File database tidak valid.' }; }
      test.close();
      if (db) { try { db.close(); } catch (e) {} }
      db = new SQL.Database(new Uint8Array(bytes));
      try { db.exec(SCHEMA); } catch (e) {}
      ready = true;
      initError = null;
      await persistNow();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message || 'Gagal membaca file.' };
    }
  }

  /* ---- reset total ---- */
  async function resetAll() {
    if (db) { try { db.close(); } catch (e) {} }
    db = new SQL.Database();
    db.exec(SCHEMA);
    ready = true;
    await persistNow();
    return true;
  }

  /* ---- simpan sebelum tutup ---- */
  window.addEventListener('beforeunload', () => { persistNow(); });

  return {
    init, isReady, getInitError, all, get, run, exec, exportBytes, importBytes, resetAll, persistNow
  };
})();