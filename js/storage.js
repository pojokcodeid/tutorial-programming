/* ============================================================
   storage.js — pembungkus IndexedDB untuk menyimpan file .sqlite
   ============================================================ */
'use strict';

const IDB = (() => {
  const DB_NAME = 'belajarkoding';
  const STORE = 'kv';

  function open() {
    return new Promise((resolve, reject) => {
      try {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      } catch (e) { reject(e); }
    });
  }

  async function get(key) {
    try {
      const db = await open();
      return new Promise((resolve, reject) => {
        try {
          const tx = db.transaction(STORE, 'readonly');
          const req = tx.objectStore(STORE).get(key);
          req.onsuccess = () => resolve(req.result !== undefined ? req.result : null);
          req.onerror = () => reject(req.error);
          tx.oncomplete = () => db.close();
        } catch (e) { reject(e); }
      });
    } catch (e) { return null; }
  }

  async function set(key, value) {
    try {
      const db = await open();
      return new Promise((resolve, reject) => {
        try {
          const tx = db.transaction(STORE, 'readwrite');
          tx.objectStore(STORE).put(value, key);
          tx.oncomplete = () => { db.close(); resolve(true); };
          tx.onerror = () => reject(tx.error);
        } catch (e) { reject(e); }
      });
    } catch (e) { return false; }
  }

  async function remove(key) {
    try {
      const db = await open();
      return new Promise((resolve, reject) => {
        try {
          const tx = db.transaction(STORE, 'readwrite');
          tx.objectStore(STORE).delete(key);
          tx.oncomplete = () => { db.close(); resolve(true); };
          tx.onerror = () => reject(tx.error);
        } catch (e) { reject(e); }
      });
    } catch (e) { return false; }
  }

  async function supports() {
    try { await open(); return true; } catch (e) { return false; }
  }

  return { get, set, remove, supports };
})();