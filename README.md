# Belajar Koding — Aplikasi Web Tutorial Interaktif

Aplikasi tutorial pemrograman interaktif berbahasa Indonesia. Topik pertama: **HTML**.
Berbasis **web statis** — semua library tersimpan lokal, tanpa server backend.

## Fitur (sesuai info.md)

- ✅ Materi multiple tutorial: **HTML (13 pelajaran)**, **CSS (18 pelajaran)**, **JavaScript (21 pelajaran)**, **TypeScript (26 pelajaran)**, **Git & GitHub (15 pelajaran)**, **SQL (16 pelajaran)**, **React JS (19 pelajaran)**, **Contoh Project React JS (8 pelajaran)**, **Go / Golang (36 pelajaran)**, **Go Web Examples (13 pelajaran)**, **Go REST API (10 pelajaran)**, **Contoh Project Go GUI (10 pelajaran)**, **Docker (12 pelajaran)**, **Lucee CFML (20 pelajaran)**, **Framework MVC Lucee CFML (6 pelajaran)**, **Kubernetes dengan Podman (14 pelajaran)**, **Jenkins (16 pelajaran)**, **RabbitMQ (20 pelajaran)**, **Grafana k6 (17 pelajaran)**, **Microservices dengan Go (16 pelajaran)**, **Redis (16 pelajaran)**, dan **Contoh Fullstack Microservices (12 pelajaran)**
- ✅ Subjudul/pelajaran di sidebar per materi
- ✅ Penjelasan Bahasa Indonesia yang sederhana
- ✅ Contoh kode dengan pewarnaan syntax (highlight.js, termasuk grammar khusus **CFML** buatan sendiri di `js/hljs-cfml.js`)
- ✅ **Pratinjau hasil langsung** untuk setiap contoh + editor latihan interaktif
- ✅ Contoh CSS bisa menampilkan **hanya kode CSS** di panel, sementara pratinjau memakai dokumen HTML lengkap (penanda `__CODE__`)
- ✅ Playground untuk bereksperimen bebas (HTML / HTML+CSS / HTML+CSS+JS)
- ✅ Autocomplete di playground & editor "Coba sendiri" (tag HTML, atribut, properti CSS, keyword & cuplikan JS)
- ✅ Auto-close tag, kurung, dan tanda kutip
- ✅ Auto-indent: Enter membuka blok (tag/kurung) dan meneruskan indentasi
- ✅ Tab / Shift+Tab di editor: indentasi & unindentasi baris atau blok yang dipilih (playground & "Coba sendiri")
- ✅ Playground & editor "Coba sendiri": pewarnaan kode, nomor baris, garis bantu indentasi, dan mode layar penuh (⛶, Esc untuk keluar)
- ✅ Kuis di akhir materi — soal & urutan jawaban **berubah setiap hari**, soal yang masih salah **muncul lagi** di ujian berikutnya
- ✅ Login & riwayat belajar tersimpan (akun lokal di SQLite)
- ✅ Materi bertahap: pelajaran terbuka setelah pelajaran sebelumnya selesai
- ✅ Bisa dijalankan langsung sebagai web statis (GitHub Pages) atau dengan server lokal

## Cara menjalankan

### Cara 1 — Paling mudah (tanpa server)
Buka file `index.html` di browser mana pun (Chrome/Firefox/Edge/Safari terbaru), atau di macOS cukup **double-click** `start.command`.

### Cara 2 — Server lokal (opsional)
```bash
node server.js
# lalu buka http://localhost:8123
```
Di macOS, double-click `start-server.command`. Butuh Node.js versi apa pun (16+).

## Struktur folder

```
├── index.html            # aplikasi utama
├── css/                  # gaya + tema highlight.js
├── js/                   # logika aplikasi (db, auth, kuis, router, dll)
├── content/html/         # materi tutorial HTML (Bahasa Indonesia)
├── content/css/          # materi tutorial CSS (Bahasa Indonesia)
├── content/js/           # materi tutorial JavaScript (Bahasa Indonesia)
├── content/typescript/   # materi tutorial TypeScript (Bahasa Indonesia)
├── content/git/          # materi tutorial Git & GitHub (Bahasa Indonesia)
├── content/sql/          # materi tutorial SQL (Bahasa Indonesia)
├── content/react/        # materi tutorial React JS (Bahasa Indonesia)
├── content/reactproject/ # materi tutorial Contoh Project React JS (Bahasa Indonesia)
├── content/go/           # materi tutorial Go / Golang (Bahasa Indonesia)
├── content/goweb/        # materi tutorial Go Web Examples (Bahasa Indonesia)
├── content/gorestapi/    # materi tutorial Go REST API (Bahasa Indonesia)
├── examples/go-restapi/  # contoh proyek Go REST API nyata (dari materi gorestapi)
├── content/gogui/        # materi tutorial Contoh Project Go GUI (Bahasa Indonesia)
├── examples/go-todo-app/ # contoh proyek desktop Go + Fyne + database bebas (dari materi gogui)
├── examples/react-project/ # contoh proyek React nyata (dari materi reactproject)
├── examples/cfml-mvc-framework/  # contoh proyek framework MVC (dari materi luceemvc)
├── content/docker/       # materi tutorial Docker (Bahasa Indonesia)
├── content/kubernetes/   # materi tutorial Kubernetes dengan Podman (Bahasa Indonesia)
├── content/jenkins/      # materi tutorial Jenkins CI/CD (Bahasa Indonesia)
├── content/rabbitmq/     # materi tutorial RabbitMQ Message Broker (Bahasa Indonesia)
├── content/k6/           # materi tutorial Grafana k6 Performance Testing (Bahasa Indonesia)
├── content/microservice/ # materi tutorial Microservices dengan Go (Bahasa Indonesia)
├── content/fullstack/    # materi tutorial Contoh Fullstack Microservices (Bahasa Indonesia)
├── examples/fullstack-microservice/ # contoh proyek nyata TokoKita: MariaDB + 3 service Go + Redis + RabbitMQ + React/AntD (dari materi fullstack)
├── content/lucee/        # materi tutorial Lucee CFML (Bahasa Indonesia)
├── content/luceemvc/     # materi tutorial Framework MVC Lucee CFML (Bahasa Indonesia)
├── assets/               # gambar & audio contoh, termasuk logo resmi tiap bahasa di assets/logos/
├── lib/                  # sql.js (SQLite/WASM) & highlight.js — lokal
├── server.js             # server lokal opsional (tanpa dependensi)
└── start*.command        # peluncur macOS
```

## Database (SQLite)

- Database memakai **SQLite** via `sql.js` (WebAssembly), tersimpan di IndexedDB browser.
- Preferensi & sesi login memakai `localStorage`/`sessionStorage`, dengan *fallback* ke memori
  bila browser memblokir storage pada `file://` — aplikasi tetap berfungsi di lingkungan mana pun.
- Di halaman **Profil** kamu bisa:
  - **Ekspor** database → mengunduh file `belajarkoding.sqlite` asli
  - **Impor** database → memulihkan progres di komputer lain
  - **Reset** → menghapus semua data
- Akun dibuat lokal di komputermu (tanpa server, privasi terjaga).

## Menambah tutorial baru (CSS, JavaScript, dst.)

1. Buat file pelajaran: `content/<nama>/<bagian>.js` dengan pola seperti `content/html/basics.js`
   (setiap pelajaran di-push ke `window.HTML_LESSONS`).
2. Buat soal kuis: set `window.HTML_QUIZ_POOL` (lihat `content/html/quiz-questions.js`).
3. Daftarkan di `js/content.js` (isi `lessons`, `quizPool`, opsional `refs`).
4. Tambahkan `<script>`-nya di `index.html` sebelum `js/content.js`.

### Contoh CSS dengan pratinjau

Bila kode contoh hanya berisi CSS, tulis `lang: 'css'` + `doc` (dokumen HTML lengkap
yang memuat penanda `__CODE__` di dalam `<style>`). Aplikasi menyuntikkan kode CSS
ke penanda itu untuk pratinjau — panel kode tetap menampilkan CSS saja:

```js
{
  type: 'example',
  title: 'Contoh flexbox',
  lang: 'css',
  output: true,
  code: `.row { display: flex; gap: 12px; }`,
  doc: `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><title>Flexbox</title>
<style>
__CODE__
</style></head>
<body><div class="row"><div>A</div><div>B</div></div></body></html>`,
  explain: ['…']
}
```

## Referensi materi

- **HTML** — https://developer.mozilla.org/en-US/docs/Web/HTML · https://www.w3schools.com/Html/ · https://web.dev/learn/html/welcome
- **CSS** — https://developer.mozilla.org/en-US/docs/Web/CSS · https://www.w3schools.com/css/ · https://web.dev/learn/css/welcome
- **JavaScript** — https://javascript.info/ · https://developer.mozilla.org/en-US/docs/Web/JavaScript · https://www.javascripttutorial.net/ · https://www.w3schools.com/js/
- **Git & GitHub** — https://git-scm.com/book/id/v2 · https://www.w3schools.com/git/
- **SQL** — https://www.w3schools.com/sql/default.asp · https://www.sqltutorial.org/
- **React JS** — https://react.dev/learn · https://www.w3schools.com/react/default.asp · https://www.javascripttutorial.net/react-tutorial/
- **Contoh Project React JS** — https://react.dev/learn · https://ant.design/ · https://reactrouter.com/ · https://axios-http.com/docs/intro · https://github.com/typicode/json-server
- **Go / Golang** — https://www.gotutorial.org/ · https://go.dev/doc/tutorial/ · https://www.w3schools.com/go/index.php
- **Go Web Examples** — https://gowebexamples.com/
- **Go REST API** — https://pkg.go.dev/net/http · https://github.com/golang-jwt/jwt · https://github.com/go-sql-driver/mysql · https://mariadb.com/kb/en/documentation/
- **Contoh Project Go GUI** — https://fyne.io/ · https://docs.fyne.io/started/ · https://pkg.go.dev/fyne.io/fyne/v2
- **Docker** — https://www.freecodecamp.org/news/the-docker-handbook/ · https://docs.docker.com/get-started/ · https://docs.docker.com/reference/
- **Kubernetes** — https://kubernetes.io/docs/home/ · https://kubernetes.io/docs/tutorials/ · https://helm.sh/docs/
- **Jenkins** — https://www.jenkins.io/doc/ · https://www.jenkins.io/learn/tutorials/ · https://www.jenkins.io/doc/pipeline/reference/ · https://www.jenkins.io/projects/jcasc/
- **RabbitMQ** — https://www.rabbitmq.com/docs · https://www.rabbitmq.com/tutorials · https://www.rabbitmq.com/docs/management · https://www.rabbitmq.com/docs/clustering
- **Grafana k6** — https://grafana.com/docs/k6/latest/ · https://grafana.com/docs/k6/latest/get-started/ · https://grafana.com/docs/k6/latest/javascript-api/ · https://grafana.com/docs/k6/latest/using-k6/scenarios/ · https://grafana.com/docs/grafana-cloud/testing/k6/
- **Microservices dengan Go** — https://martinfowler.com/articles/microservices.html · https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/microservices · https://12factor.net/ · https://go.dev/doc/ · https://opentelemetry.io/docs/
- **Contoh Fullstack Microservices** — https://martinfowler.com/articles/microservices.html · https://12factor.net/ · https://podman.io/docs · https://mariadb.com/kb/en/documentation/ · https://go.dev/doc/ · https://redis.io/docs/latest/ · https://www.rabbitmq.com/docs · https://react.dev/ · https://ant.design/docs/react/introduce · https://vite.dev/guide/
- **Lucee CFML** — https://docs.lucee.org/index.html · https://rorylaitila.gitbooks.io/lucee/content/ · https://commandbox.ortusbooks.com/
- **Framework MVC (Lucee CFML)** — https://github.com/pojokcodeid/cfml-mvc-framework · https://commandbox.ortusbooks.com/ · https://docs.lucee.org/index.html

(Rujukan lengkap juga tampil di halaman tiap tutorial, di bagian "📖 Rujukan".)

## Lisensi library
- [sql.js](https://sql.js.org) — MIT
- [highlight.js](https://highlightjs.org) — BSD-3-Clause