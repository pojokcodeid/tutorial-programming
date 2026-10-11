/* ============================================================
   quiz.js — mesin kuis dinamis
   - Soal & urutan jawaban diacak berdasarkan tanggal → beda tiap hari
   - Soal yang masih salah muncul lagi di kuis berikutnya
   ============================================================ */
'use strict';

const Quiz = (() => {
  const GUEST_KEY = 'bk-guest-attempts';
  const DEFAULT_COUNT = 10;
  let guestAttempts = null; // Map tutorial -> [questionId yang salah]

  const LETTERS = ['A', 'B', 'C', 'D'];

  function guestMap() {
    if (!guestAttempts) guestAttempts = new Map(Object.entries(Util.sessionGet(GUEST_KEY, {})));
    return guestAttempts;
  }

  function dayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  /* id soal yang status terakhirnya salah (dari DB / sesi tamu) */
  function wrongIds(tutorial) {
    const u = Auth.current();
    if (u) {
      const rows = DB.all(
        `SELECT question_id, correct FROM quiz_attempts
         WHERE user_id = ? AND tutorial = ?
         ORDER BY id ASC`, [u.id, tutorial]
      );
      const last = new Map();
      for (const r of rows) last.set(r.question_id, r.correct);
      return [...last.entries()].filter(([, correct]) => correct === 0).map(([qid]) => qid);
    }
    return guestMap().get(tutorial) || [];
  }

  /* ---- pilih & susun set soal hari ini ---- */
  function buildSet(tutorial, count = DEFAULT_COUNT) {
    const tut = CONTENT.get(tutorial);
    const pool = (tut && tut.quizPool) ? tut.quizPool.slice() : [];
    if (!pool.length) return [];

    const wrong = wrongIds(tutorial);
    const wrongSet = new Set(wrong);
    const fresh = pool.filter(q => !wrongSet.has(q.id));

    const rngSeed = dayStr() + ':' + tutorial;
    const freshPick = Util.seededShuffle(fresh, rngSeed + ':fresh');
    const wrongPick = Util.seededShuffle(pool.filter(q => wrongSet.has(q.id)), rngSeed + ':wrong');

    let chosen = [];
    const wrongBudget = Math.min(wrongPick.length, Math.ceil(count / 2));
    chosen = chosen.concat(wrongPick.slice(0, wrongBudget));
    chosen = chosen.concat(freshPick.slice(0, count - chosen.length));

    // jika masih kurang (pool kecil), ulangi dari awal
    if (chosen.length < count && pool.length > 1) {
      const extra = freshPick.slice(count - chosen.length);
      chosen = chosen.concat(extra);
    }

    // acak urutan tampil soal (per hari agar konsisten)
    chosen = Util.seededShuffle(chosen, rngSeed + ':order');
    return chosen.slice(0, count);
  }

  /* ---- menyiapkan opsi jawaban dalam urutan acak yang stabil per (hari, soal, percobaan) ---- */
  function buildQuestionView(q, attemptNonce) {
    const seed = dayStr() + '|' + q.id + '|' + attemptNonce;
    const indices = Util.seededShuffle(q.options.map((_, i) => i), seed);
    return {
      id: q.id,
      q: q.q,
      options: indices.map(i => q.options[i]),
      correctIdx: indices.indexOf(q.answer),
      explain: q.explain || ''
    };
  }

  /* ---- catat jawaban ---- */
  function record(tutorial, questionId, correct) {
    const u = Auth.current();
    if (u) {
      DB.run('INSERT INTO quiz_attempts (user_id, tutorial, question_id, correct) VALUES (?, ?, ?, ?)',
        [u.id, tutorial, questionId, correct ? 1 : 0]);
    } else {
      const m = guestMap();
      const arr = m.get(tutorial) || [];
      if (!correct) {
        if (!arr.includes(questionId)) { arr.push(questionId); m.set(tutorial, arr); }
      } else {
        const i = arr.indexOf(questionId);
        if (i >= 0) arr.splice(i, 1);
        m.set(tutorial, arr);
      }
      Util.sessionSet(GUEST_KEY, Object.fromEntries(m));
    }
  }

  /* ---- info pool ---- */
  function poolInfo(tutorial) {
    const tut = CONTENT.get(tutorial);
    const n = (tut && tut.quizPool) ? tut.quizPool.length : 0;
    return { total: n, perDay: Math.min(DEFAULT_COUNT, n) };
  }

  return { buildSet, buildQuestionView, record, wrongIds, poolInfo, LETTERS, DEFAULT_COUNT };
})();