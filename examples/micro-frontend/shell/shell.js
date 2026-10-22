/* ============================================================
   shell.js — aplikasi induk (the shell).

   Tugas shell:
     1. menyusun kerangka halaman (header, area konten, toast),
     2. me-routing hash URL,
     3. memuat remote secara malas (lazy) — satu bundel per remote,
     4. memanggil siklus hidup mount/unmount tiap remote,
     5. menjaga shell tetap hidup walaupun satu remote gagal
        (error boundary).

   Shell TIDAK tahu isi remote. Ia hanya mengenal kontrak:
       modul remote mengekspor  mount(container, ctx)  dan  unmount().
   ============================================================ */

import { on, emit } from '/shared/bus.js';

/* Peta rute → berkas entry remote. Di produksi, entri ini biasanya
   datang dari manifest build (Module Federation / build manifest). */
const routes = {
  katalog: '/remotes/products/products.js',
  keranjang: '/remotes/cart/cart.js'
};

const registry = new Map();   // cache modul remote agar tidak diimpor ulang
let activeRemote = null;      // remote yang sedang menempati #view

/* ---------------- utilitas ---------------- */

function currentRoute() {
  const name = location.hash.replace(/^#\/?/, '').split('/')[0];
  return routes[name] ? name : 'katalog';
}

async function loadRemote(url) {
  if (registry.has(url)) return registry.get(url);
  const mod = await import(url);          // dinamis = bundel terpisah
  registry.set(url, mod);
  return mod;
}

function toast(message, type = 'info') {
  const root = document.getElementById('toast-root');
  const el = document.createElement('div');
  el.className = 'toast toast-' + type;
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

/* API kecil yang diserahkan ke setiap remote saat mount. */
function createContext(route) {
  return {
    route,
    navigate(hash) { location.hash = hash; },
    toast
  };
}

/* ---------------- rendering rute ---------------- */

async function render() {
  const name = currentRoute();
  const host = document.getElementById('view');

  emit('route:change', { name });

  /* 1. bongkar remote lama (lepaskan listener & DOM-nya) */
  if (activeRemote) {
    try {
      activeRemote.unmount?.();
    } catch (err) {
      console.error('[shell] unmount gagal:', err);
    }
    activeRemote = null;
  }

  /* 2. kerangka pemuatan — shell tetap terlihat responsif */
  host.innerHTML = '<div class="skeleton"><span></span><span></span><span></span></div>';

  /* 3. muat & pasang remote */
  try {
    const mod = await loadRemote(routes[name]);
    host.innerHTML = '';
    const slot = document.createElement('div');
    slot.className = 'mfe-slot';
    host.appendChild(slot);
    mod.mount(slot, createContext(name));
    activeRemote = mod;
    host.focus({ preventScroll: true });
  } catch (err) {
    /* 4. error boundary: remote rusak tidak boleh mematikan shell */
    console.error(`[shell] remote "${name}" gagal dimuat:`, err);
    host.innerHTML = `
      <div class="error-box" role="alert">
        <h2>Modul ${name} tidak dapat dimuat</h2>
        <p>Kerusakan terisolasi di satu micro-frontend — navigasi dan modul lain tetap berfungsi.</p>
        <button class="btn" data-retry>Coba lagi</button>
      </div>`;
    host.querySelector('[data-retry]').addEventListener('click', () => {
      registry.delete(routes[name]);
      render();
    });
  }
}

/* ---------------- tombol remote: header ---------------- */

async function mountHeader() {
  const slot = document.getElementById('mfe-header');
  try {
    const mod = await loadRemote('/remotes/header/header.js');
    mod.mount(slot, createContext('header'));
  } catch (err) {
    /* Header gagal pun bukan akhir dunia: tampilkan navigasi cadangan. */
    console.error('[shell] remote header gagal:', err);
    slot.innerHTML = '<div class="hd hd-fallback"><a href="#/katalog">TokoMicro</a></div>';
  }
}

/* ---------------- peluncuran ---------------- */

window.addEventListener('hashchange', render);

/* Kesalahan tak tertangani di remote mana pun tidak boleh membuat
   halaman blank — laporkan lewat toast dan biarkan shell jalan. */
window.addEventListener('unhandledrejection', (e) => {
  console.error('[shell] promise gagal:', e.reason);
  toast('Terjadi kesalahan pada salah satu modul. Periksa konsol.', 'error');
});

/* Cegah konflik CSS: semua gaya remote memakai awalan kelasnya
   sendiri (lihat tiap berkas *.css remote). */

mountHeader();
render();
