/* ============================================================
   Pelajaran React Native — Bab 20: Proyek Akhir Kantong
   ============================================================ */
'use strict';

window.REACTNATIVE_LESSONS = window.REACTNATIVE_LESSONS || [];

window.REACTNATIVE_LESSONS.push({
  id: 'rn-proyek-akhir',
  title: 'Proyek Akhir: Kantong dari Nol sampai Rilis',
  chapter: 'Arsitektur & Rilis',
  duration: '40 menit',
  intro: [
    'Inilah bab penutup. Kita tidak menambah konsep baru, tetapi merangkai semuanya menjadi satu aplikasi yang bisa dijalankan, diuji, dan dirilis: <b>Kantong</b>, pencatat pengeluaran offline-first.',
    'Kamu akan menyusun lingkup, milestone, kriteria penerimaan, dan urutan pengerjaan. Setiap milestone menghasilkan sesuatu yang bisa didemokan, sehingga kamu tidak menunggu berbulan-bulan untuk melihat hasil.',
    'Di akhir bab ada rubrik penilaian dan checklist portofolio. Gunakan sebagai peta, bukan sebagai daftar yang harus sempurna sebelum kamu mulai.'
  ],
  objectives: [
    'Menetapkan lingkup proyek yang realistis dan bisa diselesaikan',
    'Menyusun milestone yang menghasilkan demo di setiap tahap',
    'Menerapkan arsitektur, database, autentikasi, dan desain dari bab sebelumnya',
    'Menguji alur kritis dan menyiapkan build rilis',
    'Mempresentasikan proyek dalam portofolio dengan bukti'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Lingkup Kantong v1.0</h3><p>Batasi versi pertama agar selesai. Fitur inti:</p><ul><li>Daftar dan registrasi dengan sesi yang bertahan.</li><li>CRUD pengeluaran: nominal, catatan, kategori, tanggal.</li><li>Foto struk opsional dan lokasi opsional.</li><li>Ringkasan bulanan per kategori.</li><li>Mode offline: baca dan tulis lokal, sinkronisasi saat online.</li><li>Pencarian/filter sederhana.</li><li>Mode gelap dan aksesibilitas dasar.</li><li>Build Android (dan iOS bila tersedia) yang bisa diinstal.</li></ul><p><b>Di luar lingkup v1:</b> multi-mata uang otomatis, berbagi anggaran keluarga, prediksi AI, widget native, dan integrasi bank. Tuliskan fitur yang sengaja ditunda agar kamu tidak tergoda menambahkannya di tengah jalan.</p>'
    },
    {
      type: 'example',
      title: 'Milestone yang bisa didemokan',
      lang: 'text',
      output: false,
      code: `M1 — Kerangka (2–3 hari)
  Expo + TypeScript + Expo Router + tema
  Demo: aplikasi terbuka, tab Beranda/Pengeluaran/Profil

M2 — Data lokal (3–5 hari)
  SQLite + repository + form tambah
  Demo: tambah pengeluaran, restart aplikasi, data tetap ada

M3 — Autentikasi (3–4 hari)
  Login, SecureStore, refresh, guard
  Demo: login, tutup aplikasi, sesi pulih, logout bersih

M4 — Sinkronisasi (4–6 hari)
  API client + outbox + status sync
  Demo: catat offline, online, data terkirim tanpa duplikat

M5 — UX & fitur perangkat (3–5 hari)
  Foto, lokasi, notifikasi, mode gelap, empty/error state
  Demo: struk dan lokasi tampil, pengingat berjalan

M6 — Kualitas (3–4 hari)
  Unit/component test, Maestro alur kritis, perbaikan bug
  Demo: test lulus, alur utama stabil

M7 — Rilis (2–3 hari)
  EAS preview/production, checklist toko, catatan rilis
  Demo: build terpasang di perangkat orang lain`,
      explain: [
        'Setiap milestone harus punya demo yang bisa dilihat, bukan hanya "kode selesai".',
        'Jangan mengerjakan M4 sebelum M2 stabil; sinkronisasi di atas data lokal yang berubah-ubah akan menyulitkan.',
        'Jika waktu terbatas, selesaikan M1–M4 dengan kualitas baik daripada M1–M7 setengah jadi.'
      ]
    },
    {
      type: 'example',
      title: 'Struktur akhir proyek',
      lang: 'text',
      output: false,
      code: `kantong/
├── app/
│   ├── (auth)/login.tsx
│   ├── (auth)/register.tsx
│   ├── (tabs)/_layout.tsx
│   ├── (tabs)/index.tsx
│   ├── (tabs)/expenses.tsx
│   ├── (tabs)/profile.tsx
│   ├── expense/[id].tsx
│   ├── expense/new.tsx
│   └── _layout.tsx
├── src/
│   ├── components/ui/{Button,TextField,Card,EmptyState,Skeleton}.tsx
│   ├── features/auth/{components,hooks,services}/
│   ├── features/expenses/{components,domain,data,hooks,schemas}/
│   ├── features/reports/{components,hooks,services}/
│   ├── db/{database,expenseRepository,sync}.ts
│   ├── services/{api,authorizedRequest,queryClient}.ts
│   ├── stores/{filterStore,preferences}.ts
│   ├── theme/{tokens,ThemeProvider}.tsx
│   ├── types/{domain,api}.ts
│   └── utils/format.ts
├── modules/kantong-device/       # native module lokal (opsional)
├── tests/                        # setup & helper test
├── .maestro/                     # alur E2E
├── app.config.ts
├── eas.json
├── jest.config.js
└── package.json`,
      explain: [
        'Rute tetap tipis; logika ada di fitur dan service.',
        'Folder <code>tests/</code> menyimpan setup global, bukan seluruh test. Test komponen sebaiknya dekat dengan komponennya.',
        'Modul native lokal bersifat opsional; jangan menambahkannya jika tidak ada kebutuhan nyata.'
      ]
    },
    {
      type: 'example',
      title: 'Urutan perintah verifikasi',
      lang: 'bash',
      output: false,
      code: `# Instalasi bersih
npm ci

# Kualitas statis
npm run typecheck
npm run lint

# Test
npm test -- --ci

# Jalankan di perangkat
npx expo start --dev-client

# Build preview
eas build --profile preview --platform android

# E2E pada build yang terpasang
maestro test .maestro/alur-utama.yaml

# Build production
eas build --profile production --platform all
eas submit --profile production --platform android`,
      explain: [
        'Urutkan dari yang paling cepat dan murah. Jangan menunggu build cloud untuk menemukan error TypeScript.',
        'E2E dijalankan pada build preview/production, bukan Expo Go, agar perilaku native mendekati pengguna.',
        'Simpan hasil test dan tautan build di catatan rilis.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Kriteria Penerimaan v1.0</h3><p>Proyek dinyatakan selesai bila daftar berikut terbukti, bukan diasumsikan:</p><ul><li><b>Autentikasi:</b> login, refresh, logout, dan sesi bertahan setelah restart.</li><li><b>CRUD:</b> tambah, lihat, ubah, hapus pengeluaran; data bertahan setelah aplikasi ditutup paksa.</li><li><b>Offline:</b> catat saat offline, sinkron saat online, tidak ada duplikat setelah retry.</li><li><b>Perangkat:</b> foto dan lokasi opsional; penolakan izin tidak membuat crash.</li><li><b>Desain:</b> mode gelap, safe area, touch target, dan empat state data.</li><li><b>Kualitas:</b> typecheck, lint, unit/component test, dan satu alur Maestro lulus.</li><li><b>Rilis:</b> build preview terpasang di perangkat lain, versi dan build number benar.</li><li><b>Dokumentasi:</b> README berisi setup, arsitektur, screenshot, dan catatan rilis.</li></ul>'
    },
    {
      type: 'example',
      title: 'README portofolio yang menjual bukti',
      lang: 'md',
      output: false,
      code: `# Kantong — Pencatat Pengeluaran Offline-First

Aplikasi React Native (Expo + TypeScript) untuk mencatat pengeluaran,
melampirkan struk, dan tetap bekerja tanpa jaringan.

## Fitur
- Autentikasi dengan access/refresh token dan SecureStore
- SQLite lokal + outbox sinkronisasi idempoten
- Foto struk, lokasi opsional, notifikasi pengingat
- Mode gelap, aksesibilitas dasar, state loading/empty/error

## Teknologi
Expo SDK, React Native, TypeScript, Expo Router, TanStack Query,
Zustand, SQLite, React Hook Form + Zod, Reanimated.

## Menjalankan
\`\`\`bash
npm ci
cp .env.example .env.local
npx expo start
\`\`\`

## Arsitektur
Rute di \`app/\`, fitur di \`src/features/\`, akses data di
\`src/db/\` dan \`src/services/\`. Lihat \`docs/arsitektur.md\`.

## Bukti
- Screenshot: \`docs/screenshots/\`
- Video demo: tautan
- Build preview: tautan EAS
- Test: \`npm test\`, \`maestro test .maestro/\`
- Catatan rilis: \`CHANGELOG.md\`

## Keputusan penting
- Offline-first karena pengguna mencatat di tempat tanpa sinyal.
- Idempotency key untuk mencegah duplikasi saat retry.
- Access token di memori, refresh token di SecureStore.`,
      explain: [
        'Portofolio yang baik menunjukkan masalah, keputusan, dan bukti, bukan hanya daftar teknologi.',
        'Sertakan perintah yang benar-benar bisa dijalankan orang lain. Uji README di folder baru.',
        'Screenshot dan video membantu perekrut memahami aplikasi tanpa memasangnya.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Jadwal Belajar 8 Minggu</h3><table class="vocab"><tr><th>Minggu</th><th>Fokus</th><th>Output</th></tr><tr><td>1</td><td>Fondasi, setup, komponen, layout</td><td>Kerangka + layar daftar</td></tr><tr><td>2</td><td>Navigasi, API, TanStack Query</td><td>Daftar dari API + detail</td></tr><tr><td>3</td><td>State klien, auth, SecureStore</td><td>Login dan sesi bertahan</td></tr><tr><td>4</td><td>SQLite, form, offline</td><td>CRUD lokal + outbox</td></tr><tr><td>5</td><td>Fitur perangkat, design system</td><td>Foto, lokasi, tema</td></tr><tr><td>6</td><td>Animasi, performa, realtime</td><td>Daftar halus + sinkronisasi</td></tr><tr><td>7</td><td>Testing, debugging, rilis</td><td>Test lulus + build preview</td></tr><tr><td>8</td><td>Polish, dokumentasi, portofolio</td><td>Build production + README</td></tr></table><p>Sesuaikan dengan waktu nyata. Yang penting adalah urutan dan bukti di setiap akhir minggu, bukan kecepatan.</p>'
    },
    {
      type: 'warn',
      title: 'Jangan Menunda Rilis Sampai Sempurna',
      text: 'Aplikasi pertama tidak akan sempurna. Rilis versi kecil yang stabil, kumpulkan umpan balik, lalu perbaiki. Yang perlu dihindari bukan kekurangan fitur, melainkan data hilang, crash saat login, atau kebocoran token. Selesaikan alur inti dengan benar sebelum menambah fitur baru.'
    },
    {
      type: 'tip',
      title: 'Rubrik Penilaian Diri',
      text: 'Beri nilai 1–5 untuk: kebenaran data, keamanan sesi, pengalaman offline, kualitas UI, aksesibilitas, performa, test, dan dokumentasi. Bagian dengan nilai terendah adalah fokus minggu berikutnya. Jangan menilai berdasarkan jumlah fitur.'
    },
    {
      type: 'text',
      html: '<h3>Praktik Akhir</h3><ol><li>Tulis lingkup v1.0 dan daftar fitur yang sengaja ditunda di <code>docs/lingkup.md</code>.</li><li>Kerjakan M1–M4 terlebih dahulu. Setiap milestone harus punya screenshot/video demo.</li><li>Uji di perangkat fisik dengan mode pesawat, font besar, dan mode gelap.</li><li>Jalankan typecheck, test, dan satu alur Maestro sebelum build preview.</li><li>Publikasikan build internal, minta dua orang mencoba, catat masalah, lalu perbaiki.</li><li>Perbarui README dengan bukti dan tautan build. Itulah portofolio yang kamu punya.</li></ol><p><b>Kriteria lulus akhir:</b> orang lain dapat mengikuti README, memasang build, menyelesaikan alur utama, dan memahami keputusan arsitektur dari dokumentasimu.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['MVP', 'Versi minimum yang sudah memberi nilai nyata bagi pengguna.'],
        ['Milestone', 'Tahap proyek dengan hasil yang bisa didemokan.'],
        ['Acceptance criteria', 'Kriteria yang harus terbukti sebelum fitur dianggap selesai.'],
        ['Scope creep', 'Pelebaran lingkup tanpa kendali yang membuat proyek tidak selesai.'],
        ['Offline-first', 'Data lokal menjadi sumber utama, sinkronisasi menyusul.'],
        ['Idempotency', 'Operasi aman diulang tanpa efek ganda.'],
        ['Build preview', 'Build untuk uji internal sebelum produksi.'],
        ['Release candidate', 'Build yang siap menjadi rilis final bila tidak ada bug kritis.'],
        ['Portfolio', 'Kumpulan bukti kemampuan: kode, demo, dokumentasi, dan keputusan.'],
        ['README', 'Dokumen utama yang menjelaskan cara menjalankan dan memahami proyek.'],
        ['Rubrik', 'Daftar kriteria penilaian yang jelas.'],
        ['Rollback', 'Mengembalikan versi sebelumnya saat rilis bermasalah.']
      ]
    }
  ],
  recap: [
    'Lingkup yang jelas dan milestone yang bisa didemokan membuat proyek selesai.',
    'Data lokal, autentikasi, dan sinkronisasi adalah inti Kantong; fitur tambahan menyusul.',
    'Kualitas diukur dengan bukti: test, build nyata, dan pengujian perangkat.',
    'README dan demo adalah bagian dari hasil, bukan pelengkap.',
    'Rilis kecil yang stabil lebih berharga daripada fitur banyak yang belum teruji.'
  ]
});
