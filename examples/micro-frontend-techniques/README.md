# Lab Micro-Frontend: iframe, Web Component, dan Import Map

Lab ini membandingkan tiga teknik integrasi micro-frontend dalam satu server kecil:

1. **iframe** — remote hidup di dokumen terpisah.
2. **Web Component** — remote dibungkus custom element dengan Shadow DOM.
3. **Import map** — remote dimuat sebagai modul ESM lewat `import()` dinamis.

Semua demo memakai data produk yang sama dari `/api/produk`, sehingga kamu bisa fokus pada
perbedaan cara integrasi, bukan pada perbedaan data. Tidak ada framework, tidak ada bundler,
dan tidak ada dependensi eksternal.

## Apa yang kamu pelajari

- Di mana isolasi gaya dan JavaScript benar-benar bekerja.
- Bagaimana komunikasi berubah dari `postMessage`, `CustomEvent`, sampai pemanggilan fungsi
  langsung.
- Trade-off layout, aksesibilitas, SEO, dan biaya integrasi.
- Cara menangani kegagalan modul remote agar shell tetap hidup.
- Kontrak sederhana yang bisa kamu pakai saat memecah aplikasi menjadi beberapa bagian.

## Persyaratan

- **Node.js 18 atau lebih baru** (disarankan Node 20+).
- Browser modern: Chrome, Edge, Firefox, atau Safari versi terbaru.
- Tidak perlu `npm install`.

## Menjalankan

Dari akar repositori:

```bash
cd examples/micro-frontend-techniques
node server.js
```

Lalu buka:

```text
http://localhost:4180
```

Jika port 4180 sedang dipakai:

```bash
PORT=4181 node server.js
```

Jika `localhost` bermasalah di sistemmu, buka `http://127.0.0.1:4180`. Server secara default
hanya mendengarkan di `127.0.0.1`; kamu bisa mengubahnya dengan `HOST=0.0.0.0 node server.js`
jika memang perlu diakses dari perangkat lain di jaringan lokal.

## Peta URL

| URL | Isi |
| --- | --- |
| `/` | Halaman utama, penjelasan, kartu perbandingan, dan tautan demo |
| `/iframe/` | Shell demo iframe |
| `/iframe/remote.html` | Dokumen remote yang dimuat di dalam iframe |
| `/web-component/` | Shell demo Web Component |
| `/web-component/product-card.js` | Definisi `<tokomicro-product-card>` |
| `/import-map/` | Shell demo import map |
| `/import-map/remote.js` | Modul remote yang dimuat lewat `import('@lab/remote')` |
| `/import-map/remote-rusak.js` | Modul yang sengaja gagal untuk menguji error handling |
| `/api/produk` | API produk. Mendukung `?q=` dan `?kategori=` |
| `/api/produk?q=keyboard` | Contoh filter pencarian |
| `/api/produk?kategori=furnitur` | Contoh filter kategori |

## Struktur folder

```text
micro-frontend-techniques/
├── server.js                       # server statis + API, tanpa dependensi
├── package.json                    # type: module, script start/test
├── test.mjs                        # unit test + integration test (node:test)
├── README.md
├── lib/
│   └── produk.js                   # data contoh + fungsi murni (format, cari, total)
└── public/
    ├── index.html                  # halaman utama lab
    ├── styles.css                  # gaya dasar semua halaman
    ├── landing.css                 # gaya khusus halaman utama
    ├── iframe/
    │   ├── index.html              # shell: kontrol postMessage + iframe
    │   ├── shell.css
    │   ├── shell.js
    │   └── remote.html             # remote mandiri: CSS + JS + katalog
    ├── web-component/
    │   ├── index.html              # shell: katalog, keranjang, uji isolasi
    │   ├── shell.css
    │   ├── shell.js
    │   └── product-card.js         # custom element + Shadow DOM
    └── import-map/
        ├── index.html              # shell + <script type="importmap">
        ├── shell.css
        ├── shell.js                # import('@lab/remote') dinamis
        ├── remote.js               # modul remote: mount() / unmount()
        └── remote-rusak.js         # modul yang sengaja throw
```

## Cara membaca lab

1. Buka halaman utama dan baca tabel perbandingan.
2. Jalankan demo **iframe**, kirim pesan, balas dari remote, lalu coba akses DOM shell.
3. Jalankan demo **Web Component**, tambahkan produk, lalu nyalakan serangan gaya.
4. Jalankan demo **import map**, muat remote, lalu coba modul rusak.
5. Buka DevTools → **Network** dan **Elements** untuk melihat perbedaan request, CSS, dan DOM.

---

## Demo 1 — iframe

**Berkas:** `public/iframe/index.html`, `public/iframe/shell.js`, `public/iframe/remote.html`

Shell dan remote adalah dua dokumen berbeda. Remote dimuat dengan:

```html
<iframe
  src="/iframe/remote.html"
  sandbox="allow-scripts"
  title="Remote katalog TokoMicro di dalam iframe"></iframe>
```

Karena `sandbox` tidak menyertakan `allow-same-origin`, dokumen remote berjalan di **origin
opaque** (`null`). Akibatnya:

- CSS shell tidak bocor ke remote, dan sebaliknya.
- Global scope dan error remote terpisah dari shell.
- Shell tidak bisa membaca DOM remote; remote juga tidak bisa membaca DOM shell.
- `fetch` dari remote ke `/api/produk` dianggap cross-origin, sehingga server harus mengirim
  `Access-Control-Allow-Origin: *`.
- `event.origin` di shell bernilai `"null"`, bukan `http://localhost:4180`.

### Coba ini

1. Klik **Kirim via postMessage**. Remote menampilkan pesan yang diterima dan otomatis
   mengirim balasan. Balasan muncul di log shell.
2. Tulis balasan di remote, lalu klik **Kirim balasan**. Pesan masuk ke log shell.
3. Klik **Coba akses DOM shell** di remote. Browser akan menolak dengan `SecurityError`.
4. Perhatikan tema remote yang terang dan serif, sementara shell tetap gelap.

### Kontrak komunikasi

```js
// shell → remote
iframe.contentWindow.postMessage(
  { tipe: 'sapa', teks: 'Halo!' },
  '*'
);

// remote → shell
window.parent.postMessage(
  { tipe: 'balasan', teks: 'Halo juga!' },
  '*'
);
```

Shell memvalidasi `event.source` dan bentuk `event.data` sebelum memakainya. Remote memvalidasi
`data.tipe` dan `data.teks`.

### Catatan teknis

- `targetOrigin: '*'` dipakai karena remote yang disandbox punya origin opaque. Di produksi,
  gunakan origin yang spesifik jika remote tidak disandbox.
- Tinggi iframe ditetapkan shell (740 px di layar lebar, 580 px di layar kecil). Remote tidak
  bisa mengubah layout halaman induk. Jika konten remote lebih panjang, remote akan menggulir
  di dalam kotaknya sendiri.
- `X-Frame-Options: SAMEORIGIN` di server mengizinkan demo ini karena shell dan remote
  dilayani dari origin yang sama. Untuk iframe lintas origin, header ini harus disesuaikan.
- Isolasi total memang aman, tetapi komunikasi menjadi manual: tidak ada state bersama,
  tidak ada import fungsi, dan setiap pesan harus diserialisasi.

---

## Demo 2 — Web Component

**Berkas:** `public/web-component/product-card.js`, `public/web-component/shell.js`

Remote didefinisikan sebagai custom element:

```html
<tokomicro-product-card
  nama="Keyboard Mekanik"
  harga="750000"
  stok="12"
  kategori="Aksesori"
  emoji="⌨️"></tokomicro-product-card>
```

Atribut yang diamati:

| Atribut | Wajib | Fungsi |
| --- | --- | --- |
| `nama` | ya | Nama produk |
| `harga` | ya | Harga dalam rupiah (angka) |
| `stok` | tidak | Jika `0`, tombol dinonaktifkan |
| `kategori` | tidak | Label kategori, default `Umum` |
| `emoji` | tidak | Ikon produk, default `📦` |

Saat tombol di dalam Shadow DOM diklik, elemen mengirim event:

```js
this.dispatchEvent(new CustomEvent('add-to-cart', {
  bubbles: true,
  composed: true,
  detail: { nama, harga, kategori, emoji, stok }
}));
```

`composed: true` penting agar event bisa menembus batas Shadow DOM dan didengar shell.
Shell cukup mendengarkan di `document`:

```js
document.addEventListener('add-to-cart', (event) => {
  tambahKeKeranjang(event.detail);
});
```

### Coba ini

1. Klik **Tambah ke keranjang** pada beberapa kartu. Keranjang dan total di panel kanan
   langsung berubah.
2. Klik **Nyalakan serangan gaya**. CSS global shell akan menimpa kartu HTML biasa di bagian
   bawah, tetapi tombol dan kartu di dalam Shadow DOM tetap memakai gaya aslinya.
3. Bandingkan warna, font, dan bentuk tombol kedua kartu sebelum dan sesudah serangan.
4. Klik **Matikan serangan gaya** untuk kembali ke tampilan normal.

### Mengapa gaya tetap aman?

CSS di dalam `product-card.js` berada di dalam Shadow Root:

```js
const shadow = this.attachShadow({ mode: 'open' });
shadow.innerHTML = `<style>...</style><article>...</article>`;
```

Selector global seperti `body.serangan-gaya button` tidak menembus Shadow DOM. Shell tetap bisa
mengubah gaya dari luar jika elemen menyediakan `part`, misalnya:

```css
tokomicro-product-card::part(tombol) {
  border-radius: 999px;
}
```

Itu adalah akses yang sengaja dibuka, bukan kebocoran CSS.

### Catatan teknis

- Shadow DOM mengisolasi **gaya dan struktur DOM**, bukan global JavaScript. Variabel global,
  `window`, dan error runtime tetap berada di halaman yang sama.
- Custom element tidak otomatis melakukan SSR. Jika kamu butuh HTML awal untuk SEO, kamu perlu
  strategi tambahan (misalnya merender markup dari server atau memakai declarative shadow DOM).
- Kontrak atribut dan event harus stabil. Perubahan nama event atau bentuk `detail` adalah
  breaking change bagi shell.

---

## Demo 3 — Import map

**Berkas:** `public/import-map/index.html`, `public/import-map/shell.js`,
`public/import-map/remote.js`, `public/import-map/remote-rusak.js`

Halaman mendefinisikan import map **sebelum** modul apa pun dimuat:

```html
<script type="importmap">
{
  "imports": {
    "@lab/remote": "/import-map/remote.js",
    "@lab/remote-rusak": "/import-map/remote-rusak.js"
  }
}
</script>
```

Shell kemudian memuat remote secara dinamis:

```js
const modul = await import('@lab/remote');
instance = modul.mount(slot, { onTambah: tambahKeKeranjang });
```

Modul remote mengekspor:

```js
export const nama = 'Katalog Remote';
export const versi = '1.0.0';
export function mount(wadah, opsi) { /* ... */ return { unmount() {} }; }
```

### Coba ini

1. Klik **Muat remote**. Status berubah dari `idle` → `memuat` → `siap`, lalu katalog muncul.
2. Klik **Tambah ke keranjang** di salah satu produk. Shell memperbarui keranjang lewat
   callback `opsi.onTambah`.
3. Klik **Bongkar**. Shell memanggil `unmount()` dan membersihkan slot.
4. Muat remote lagi, lalu klik **Coba modul rusak**. Import akan ditolak, status menjadi
   `gagal`, tetapi remote yang sudah terpasang dan seluruh shell tetap hidup.
5. Perhatikan log: durasi import, pesan error, dan status terakhir ditampilkan.

### Catatan teknis

- Import map hanya memetakan **nama modul ke URL**. Ia tidak memberikan isolasi gaya, isolasi
  global, atau sandbox.
- Modul remote menyuntikkan CSS ke `<head>` dokumen yang sama. Semua kelas memakai awalan
  `.im-remote` agar tidak bentrok, tetapi ini hanya konvensi, bukan enkapsulasi.
- Dynamic import di-cache browser. Setelah modul berhasil dimuat, pemanggilan berikutnya
  biasanya tidak melakukan request jaringan lagi.
- Untuk versi baru, gunakan URL berversi atau query cache-busting di import map, misalnya
  `@lab/remote@2` → `/import-map/remote.v2.js`.
- Jika remote berada di origin lain, server remote harus mengirim CORS dan kamu perlu
  memikirkan CSP (`script-src`) serta integritas modul.
- Import map harus muncul sebelum modul yang memakainya. Jika tidak, browser akan gagal
  me-resolve `@lab/remote`.

---

## Perbandingan trade-off

| Aspek | iframe | Web Component | Import map |
| --- | --- | --- | --- |
| Isolasi gaya | Total | Kuat (Shadow DOM) | Tidak ada |
| Isolasi JavaScript | Total | Sebagian | Tidak ada |
| Komunikasi | `postMessage` asinkron | `CustomEvent` | Import/export langsung |
| Integrasi layout | Kotak tetap, tinggi diatur shell | Mengalir di DOM | Mengalir di DOM |
| SEO & aksesibilitas | Paling sulit | Baik | Baik |
| Biaya awal | Rendah | Sedang | Rendah |
| Biaya komunikasi | Tinggi | Sedang | Rendah |
| Deploy terpisah | Sangat mudah | Tergantung aset | Mudah jika ESM |
| Risiko utama | Layout, aksesibilitas, pesan manual | Kontrak atribut/event, SSR | Konflik global, versioning |

### Kapan memilih iframe?

Pilih iframe jika remote benar-benar asing: aplikasi legacy, halaman vendor, atau bagian yang
harus diisolasi total karena alasan keamanan. iframe juga berguna saat dua aplikasi memakai
versi framework yang tidak kompatibel dan kamu tidak ingin menyatukan runtime.

Konsekuensinya, kamu harus merancang protokol pesan, mengatur tinggi, dan menerima bahwa
konten di dalam iframe lebih sulit diakses mesin pencari dan pembaca layar.

### Kapan memilih Web Component?

Pilih Web Component jika kamu ingin remote tampil menyatu dengan halaman: mengalir dalam
layout, ikut fokus keyboard, dan bisa dikomposisikan seperti elemen HTML biasa. Shadow DOM
memberi isolasi gaya yang kuat tanpa harus memisahkan dokumen.

Kamu perlu mendefinisikan kontrak atribut, event, dan versi dengan disiplin. Ingat bahwa
Shadow DOM tidak mengisolasi global JavaScript.

### Kapan memilih import map?

Pilih import map jika semua pihak memakai ESM dan kamu ingin berbagi modul tanpa bundler:
lazy load, dependensi bersama, dan pemanggilan fungsi langsung. Ini adalah integrasi paling
"dekat" di antara ketiganya.

Justru karena dekat, risikonya juga dekat: satu modul bisa mengubah global, menimpa CSS, atau
melempar error yang memengaruhi shell. Kamu perlu konvensi, error boundary, dan strategi
versioning yang jelas.

---

## Verifikasi

### 1. Test otomatis

```bash
cd examples/micro-frontend-techniques
node --test test.mjs
```

Test mencakup:

- Fungsi murni: `formatRupiah`, `cariProduk`, `hitungTotal`.
- API: struktur data, filter `q`, filter `kategori`, CORS, `HEAD`, `OPTIONS`, dan `405`.
- Halaman utama dan ketiga demo.
- Tipe konten modul JavaScript.
- Redirect `/iframe` → `/iframe/`.
- Proteksi path traversal (server tidak menyajikan berkas di luar `public/`).

Semua 15 test harus lulus. Test integration menjalankan server di port acak, jadi tidak perlu
menyalakan server secara manual lebih dulu.

### 2. Verifikasi API dengan curl

Jalankan server di terminal lain, lalu:

```bash
curl -s http://localhost:4180/api/produk
curl -s "http://localhost:4180/api/produk?q=keyboard"
curl -s "http://localhost:4180/api/produk?kategori=furnitur"
curl -i http://localhost:4180/iframe
curl -s http://localhost:4180/import-map/ | grep importmap
```

Yang diharapkan:

- `/api/produk` mengembalikan JSON dengan `data`, `total: 6`, dan `sumber`.
- `?q=keyboard` mengembalikan satu produk: **Keyboard Mekanik**.
- `?kategori=furnitur` mengembalikan dua produk.
- `/iframe` mengembalikan `301` dengan `Location: /iframe/`.
- Halaman import map mengandung `<script type="importmap">`.

### 3. Checklist browser

- [ ] Halaman utama menampilkan tiga kartu teknik dan tabel perbandingan.
- [ ] iframe: mengirim pesan menampilkan pesan di remote dan balasan di log shell.
- [ ] iframe: tombol **Coba akses DOM shell** menampilkan `SecurityError`.
- [ ] Web Component: menambah produk mengubah keranjang dan total.
- [ ] Web Component: serangan gaya mengubah kartu biasa, tetapi tidak mengubah isi Shadow DOM.
- [ ] Import map: status berubah `idle` → `memuat` → `siap`.
- [ ] Import map: menambah produk dari remote mengubah keranjang shell.
- [ ] Import map: modul rusak menampilkan status `gagal`, tetapi shell dan remote lama tetap hidup.
- [ ] Tidak ada error JavaScript di Console saat memuat halaman utama dan ketiga demo.

### 4. Verifikasi manual cepat

1. Buka DevTools → Network, lalu muat ulang demo import map. Perhatikan request
   `/import-map/remote.js` baru muncul setelah tombol **Muat remote** diklik.
2. Buka DevTools → Elements, pilih `<tokomicro-product-card>`, dan lihat `#shadow-root` di
   dalamnya.
3. Di demo iframe, pilih elemen `<iframe>` dan bandingkan pohon DOM-nya dengan shell. Kamu
   tidak akan melihat konten remote di pohon DOM induk.
4. Di demo Web Component, nyalakan serangan gaya dan periksa `getComputedStyle` tombol di
   dalam Shadow DOM. Warnanya tetap hijau-teal.

---

## Latihan

1. **iframe — origin spesifik.** Hapus `sandbox` dari iframe, lalu ganti `targetOrigin: '*'`
   dengan `window.location.origin`. Amati perbedaan perilaku dan risikonya.
2. **iframe — auto-resize.** Buat remote mengirim tinggi kontennya lewat `postMessage`, lalu
   shell mengubah `iframe.style.height`. Tangani kasus pesan yang tidak valid.
3. **iframe — balasan tervalidasi.** Tambahkan `id` pesan dan pastikan shell hanya menerima
   balasan untuk pesan yang benar-benar dikirim.
4. **Web Component — atribut diskon.** Tambahkan atribut `diskon` (persen), tampilkan harga
   coret, dan pastikan `attributeChangedCallback` memperbarui tampilan.
5. **Web Component — slot.** Tambahkan `<slot name="catatan">` di dalam kartu, lalu isi dari
   shell tanpa membocorkan gaya internal.
6. **Web Component — `::part`.** Beri gaya pada `::part(tombol)` dari CSS shell. Bandingkan
   dengan serangan CSS global yang tetap tidak menembus Shadow DOM.
7. **Import map — versi modul.** Tambahkan mapping `@lab/remote@2` ke salinan
   `remote.v2.js`, lalu muat versi tersebut tanpa mengubah shell.
8. **Import map — kegagalan jaringan.** Buka DevTools → Network → Offline, lalu klik
   **Muat remote**. Pastikan status `gagal` muncul dan shell tetap bisa dipakai.
9. **Import map — pencarian.** Tambahkan input pencarian di shell yang memanggil
   `/api/produk?q=...`, lalu kirim hasilnya ke modul remote lewat opsi `mount`.
10. **Bandingkan performa.** Catat jumlah request, ukuran transfer, dan waktu muat ketiga demo
    di DevTools. Diskusikan mengapa hasilnya berbeda.

---

## Troubleshooting

**Port 4180 sudah dipakai**

```bash
PORT=4181 node server.js
```

**`localhost` tidak bisa dibuka**

Gunakan `http://127.0.0.1:4180`. Pastikan tidak ada firewall yang memblokir port tersebut.

**Import map tidak berfungsi**

Pastikan browser modern dan `<script type="importmap">` muncul sebelum modul yang memakainya.
Jika kamu menyalin potongan kode ke halaman lain, urutannya sering menjadi penyebab.

**Remote di iframe gagal mengambil produk**

Di demo ini remote berjalan di origin opaque karena `sandbox="allow-scripts"`. Server sudah
mengirim `Access-Control-Allow-Origin: *` untuk `/api/produk`. Jika kamu mengubah sandbox atau
origin, periksa kembali header CORS.

**Serangan gaya tidak mengubah kartu biasa**

Pastikan tombol **Nyalakan serangan gaya** sudah diklik dan `document.body` memiliki class
`serangan-gaya`. Coba muat ulang halaman jika CSS lama masih ter-cache.

**Modul remote tidak ter-update setelah diedit**

Browser meng-cache modul ESM. Lakukan hard reload (Shift + Reload) atau tambahkan query
cache-busting pada URL di import map saat pengembangan.

---

## Batasan lab

- Semua demo dilayani dari **satu origin** agar mudah dijalankan. Di produksi, remote sering
  berada di origin berbeda dan membutuhkan CORS, CSP, autentikasi, serta `targetOrigin` yang
  spesifik.
- API menyimpan data di memori dan tidak memiliki autentikasi. Ini bukan contoh produksi.
- Tidak ada SSR, image optimization, atau strategi cache. Fokus lab adalah mekanisme integrasi.
- Tidak ada bundler. Import map memakai berkas ESM apa adanya; di proyek nyata kamu mungkin
  tetap membutuhkan build step untuk minifikasi, tree-shaking, atau kompatibilitas browser.
- iframe di demo ini menggunakan tinggi tetap. Pola produksi biasanya menambahkan handshake
  `postMessage` untuk menyesuaikan tinggi secara dinamis.

## Referensi

- MDN — [`<iframe>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe)
- MDN — [`Window.postMessage()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
- MDN — [Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_Components)
- MDN — [Import maps](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap)
- MDN — [Dynamic import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)
