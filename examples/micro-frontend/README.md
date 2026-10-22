# TokoMicro — Contoh Proyek Micro-Frontend

Proyek kecil yang dipakai sebagai praktik pada panduan [`micro-frontend.md`](../../micro-frontend.md).
Terdiri atas **satu shell** dan **tiga micro-frontend (remote)** yang dimuat terpisah, tanpa framework dan tanpa proses build.

## Menjalankan

```bash
cd examples/micro-frontend
node server.js
```

Buka **http://localhost:4173**, lalu:

1. Tekan **Tambah ke keranjang** pada salah satu produk — badge di header langsung bertambah.
2. Buka **Keranjang** — daftar item tampil dari state bersama, ubah jumlah, lalu **Buat pesanan**.
3. Matikan satu berkas remote (misalnya ganti isi `remotes/products/products.js` menjadi sintaks rusak) lalu muat ulang — shell tetap hidup dan hanya modul itu yang menampilkan pesan galat.

## Struktur

```text
micro-frontend/
├── server.js                  # server statis + API palsu (/api/products, /api/orders)
├── shell/                     # aplikasi induk: layout, routing, lazy load, error boundary
│   ├── index.html
│   ├── shell.js
│   └── shell.css
├── shared/                    # modul bersama: event bus & state keranjang
│   ├── bus.js
│   └── store.js
└── remotes/                   # tiap folder = satu micro-frontend mandiri
    ├── header/                # chrome: logo, navigasi, badge
    ├── products/              # katalog & filter kategori
    └── cart/                  # keranjang & checkout
```

## Kontrak antar pihak

| Pihak | Kewajiban |
| --- | --- |
| Shell | menyiapkan slot DOM, memuat remote sesuai rute, memanggil `mount()` / `unmount()`, menangani kegagalan load |
| Remote | mengekspor `mount(container, ctx)` dan `unmount()`, memakai awalan kelas CSS sendiri, hanya berkomunikasi lewat `shared/bus.js` & `shared/store.js` |
| Shared module | state satu instance untuk semua remote, tidak boleh mengimpor remote mana pun |
