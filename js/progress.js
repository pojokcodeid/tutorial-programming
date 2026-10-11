/* ============================================================
   progress.js — riwayat belajar per pengguna
   - Login    : tersimpan di SQLite
   - Tamu     : tersimpan di sessionStorage (hilang saat tab ditutup)
   ============================================================ */
'use strict';

const Progress = (() => {
  const GUEST_KEY = 'bk-guest-progress';
  let cache = null;      // Map "tutorial|lesson" -> true (pengguna login)
  let guestCache = null; // Map "tutorial|lesson" -> true (tamu)

  function key(t, l) { return t + '|' + l; }

  function guest() {
    if (!guestCache) guestCache = new Map(Object.entries(Util.sessionGet(GUEST_KEY, {})));
    return guestCache;
  }

  function guestSave() {
    Util.sessionSet(GUEST_KEY, Object.fromEntries(guest()));
  }

  async function refresh() {
    cache = new Map();
    const u = Auth.current();
    if (u) {
      const rows = DB.all('SELECT tutorial, lesson FROM progress WHERE user_id = ? AND completed = 1', [u.id]);
      for (const r of rows) cache.set(key(r.tutorial, r.lesson), true);
    } else {
      cache = new Map();
    }
  }

  function isCompleted(t, l) {
    const u = Auth.current();
    return u ? !!cache.get(key(t, l)) : !!guest().get(key(t, l));
  }

  /* Pelajaran ke-n (0-based) terbuka jika ke-n-1 sudah selesai */
  function isUnlocked(tutorial, lessonIndex) {
    const tut = CONTENT.get(tutorial);
    if (!tut || !tut.lessons || tut.lessons.length === 0) return false;
    if (!tut.sequential) return true;
    if (lessonIndex === 0) return true;
    const prev = tut.lessons[lessonIndex - 1];
    return prev ? isCompleted(tutorial, prev.id) : true;
  }

  async function markCompleted(t, l) {
    const u = Auth.current();
    if (u) {
      const updated = (new Date()).toISOString();
      DB.run(
        `INSERT INTO progress (user_id, tutorial, lesson, completed, updated_at) VALUES (?, ?, ?, 1, ?)
         ON CONFLICT(user_id, tutorial, lesson)
         DO UPDATE SET completed = 1, updated_at = excluded.updated_at`,
        [u.id, t, l, updated]
      );
      cache.set(key(t, l), true);
    } else {
      guest().set(key(t, l), true);
      guestSave();
    }
  }

  function tutorialPercent(t) {
    const tut = CONTENT.get(t);
    if (!tut || !tut.lessons || !tut.lessons.length) return 0;
    let done = 0;
    for (const l of tut.lessons) if (isCompleted(t, l.id)) done++;
    return Math.round((done / tut.lessons.length) * 100);
  }

  function lessonsDone(t) {
    const tut = CONTENT.get(t);
    if (!tut || !tut.lessons) return 0;
    return tut.lessons.filter(l => isCompleted(t, l.id)).length;
  }

  /* pelajaran terakhir yang sedang dikerjakan */
  function lastActive() {
    const order = CONTENT.all;
    for (const tut of order) {
      if (!tut.lessons || !tut.lessons.length) continue;
      for (let i = tut.lessons.length - 1; i >= 0; i--) {
        if (isCompleted(tut.id, tut.lessons[i].id)) {
          const next = tut.lessons[i + 1];
          return { tutorial: tut.id, lesson: next ? next.id : tut.lessons[i].id, doneAll: !next };
        }
      }
    }
    return null;
  }

  async function resetAll() {
    const u = Auth.current();
    if (u) DB.run('DELETE FROM progress WHERE user_id = ?', [u.id]);
    if (guestCache) { guestCache = new Map(); guestSave(); }
    cache = new Map();
  }

  /* ---- kuis: skor hari ini (soal unik terbaru) ---- */
  function bestQuizScore(tutorial) {
    const u = Auth.current();
    if (!u) return null;
    const rows = DB.all(
      `SELECT question_id, correct FROM quiz_attempts
       WHERE user_id = ? AND tutorial = ?
         AND date(attempted_at) = date('now', 'localtime')
       ORDER BY id ASC`,
      [u.id, tutorial]
    );
    if (!rows.length) return null;
    const uniq = new Map();
    for (const r of rows) uniq.set(r.question_id, r.correct); // percobaan terakhir menang
    const total = uniq.size;
    const correct = [...uniq.values()].filter(v => v === 1).length;
    return total ? { correct, total, percent: Math.round(correct / total * 100) } : null;
  }

  return {
    refresh, isCompleted, isUnlocked, markCompleted,
    tutorialPercent, lessonsDone, lastActive, resetAll, bestQuizScore
  };
})();