/* ============================================================
   shared/bus.js — "penghubung" antar micro-frontend.

   Micro-frontend tidak boleh mengimpor file internal milik remote
   lain. Semua komunikasi lintas modul lewat kanal ini (setara
   CustomEvent / event bus pada Module Federation).
   ============================================================ */

const listeners = new Map();

/** Daftarkan penangan event. Mengembalikan fungsi untuk berhenti. */
export function on(name, handler) {
  if (!listeners.has(name)) listeners.set(name, new Set());
  listeners.get(name).add(handler);
  return () => off(name, handler);
}

export function off(name, handler) {
  const set = listeners.get(name);
  if (set) set.delete(handler);
}

/** Sebarkan event ke semua pendengar. Kegagalan satu remote tidak
    boleh merusak remote lain — karena itu setiap handler dibungkus try/catch. */
export function emit(name, payload) {
  const set = listeners.get(name);
  if (!set) return;
  for (const handler of [...set]) {
    try {
      handler(payload);
    } catch (err) {
      console.error(`[bus] penangan event "${name}" gagal:`, err);
    }
  }
}
