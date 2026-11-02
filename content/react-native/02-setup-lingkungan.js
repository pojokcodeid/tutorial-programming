/* ============================================================
   Pelajaran React Native — Bab 2: Menyiapkan Lingkungan Kerja
   ============================================================ */
'use strict';

window.REACTNATIVE_LESSONS = window.REACTNATIVE_LESSONS || [];

window.REACTNATIVE_LESSONS.push({
  id: 'rn-setup',
  title: 'Menyiapkan Lingkungan dan Menjalankan Aplikasi Pertama',
  chapter: 'Fondasi & Persiapan',
  duration: '25 menit',
  intro: [
    'Bab ini membuat proyek <b>Kantong</b> benar-benar berjalan. Sebagian besar pemula tersandung di tahap ini karena mencampur Expo Go, development build, emulator, dan perangkat fisik tanpa memahami perbedaannya. Kita akan menyusun urutan yang bisa diulang di komputer mana pun.',
    'Kamu tidak perlu memasang Android Studio dan Xcode sekaligus. Mulai dari jalur yang paling sedikit hambatannya, buktikan aplikasi berjalan, lalu tambahkan alat lain ketika kebutuhan muncul.',
    'Setelah bab ini, kamu memiliki proyek Expo + TypeScript dengan struktur yang rapi, perintah pemeriksaan kualitas, dan aplikasi yang terbuka di ponsel atau emulator.'
  ],
  objectives: [
    'Menyiapkan Node.js, package manager, dan Expo CLI dengan benar',
    'Membuat proyek Expo TypeScript serta memahami struktur foldernya',
    'Menjalankan aplikasi di Expo Go, emulator, dan development build',
    'Mengonfigurasi app.json, environment, dan perintah typecheck',
    'Mendiagnosis masalah Metro, port, dan koneksi perangkat'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Prasyarat yang Benar-Benar Dibutuhkan</h3><ul><li><b>Node.js LTS</b> (versi genap yang masih didukung). Cek dengan <code>node -v</code> dan <code>npm -v</code>.</li><li><b>Git</b> untuk version control.</li><li><b>VS Code</b> atau editor lain dengan dukungan TypeScript.</li><li><b>Ponsel Android/iOS</b> dengan Expo Go untuk percobaan pertama.</li><li><b>Android Studio</b> hanya bila ingin emulator Android atau build native lokal.</li><li><b>Xcode</b> hanya di macOS bila ingin iOS Simulator atau build iOS lokal.</li></ul><p>Gunakan satu package manager secara konsisten. Contoh di tutorial ini memakai <code>npm</code> karena tersedia bersama Node.js. Jika memakai <code>pnpm</code> atau <code>yarn</code>, jangan mencampurnya dalam satu proyek.</p>'
    },
    {
      type: 'example',
      title: 'Membuat proyek Kantong',
      lang: 'bash',
      output: false,
      code: `# 1. Buat proyek Expo dengan template default (Expo Router + TypeScript)
npx create-expo-app@latest kantong

cd kantong

# 2. Periksa kesehatan proyek
npx expo-doctor

# 3. Jalankan development server
npx expo start

# Di terminal Expo:
#   a  -> buka emulator Android
#   i  -> buka iOS Simulator (macOS)
#   QR -> pindai dengan Expo Go di ponsel`,
      explain: [
        'Template default sudah memuat Expo Router, sehingga kamu tidak perlu memasang navigasi dari nol. Ini menghemat satu bab setup dan langsung memberi struktur <code>app/</code>.',
        '<code>expo-doctor</code> memeriksa versi dependensi yang tidak cocok. Jalankan setelah instalasi dan setiap kali kamu menambah paket native.',
        'Jangan langsung menyalin konfigurasi dari tutorial lama. Versi Expo dan React Native berubah cepat; <code>npx expo install</code> memilih versi yang kompatibel untuk proyekmu.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Expo Go, Development Build, dan Build Produksi</h3><table class="vocab"><tr><th>Mode</th><th>Kapan dipakai</th><th>Batasan</th></tr><tr><td><b>Expo Go</b></td><td>Belajar komponen, layout, dan API dasar</td><td>Hanya modul yang sudah ada di aplikasi Expo Go; tidak bisa memakai native module kustom</td></tr><tr><td><b>Development build</b></td><td>Modul native, notifikasi, kamera lanjutan, pengujian mendekati produksi</td><td>Perlu build (lokal atau EAS) dan instalasi ulang saat dependensi native berubah</td></tr><tr><td><b>Preview build</b></td><td>Uji internal tim sebelum rilis</td><td>Tidak untuk pengguna umum</td></tr><tr><td><b>Production build</b></td><td>Google Play / App Store</td><td>Signing, versi, dan kebijakan toko harus benar</td></tr></table><p>Aturan praktis: mulai dengan Expo Go. Begitu kamu menambah modul yang tidak tersedia di Expo Go, buat development build. Jangan menunggu sampai akhir proyek untuk pertama kali mencoba build.</p>'
    },
    {
      type: 'example',
      title: 'Membuat development build dengan EAS',
      lang: 'bash',
      output: false,
      code: `# Pasang CLI EAS (sekali di komputer)
npm install --global eas-cli

# Masuk ke akun Expo (gratis)
eas login

# Siapkan konfigurasi build
eas build:configure

# Build development client untuk Android
eas build --profile development --platform android

# Setelah selesai, pasang APK dari tautan EAS ke perangkat,
# lalu jalankan:
npx expo start --dev-client`,
      explain: [
        'Development build menghasilkan aplikasi yang bisa memuat bundel JavaScript dari Metro, mirip Expo Go, tetapi dengan modul native milik proyekmu sendiri.',
        'Untuk iOS, build development membutuhkan akun Apple Developer dan perangkat terdaftar. Di macOS kamu juga bisa memakai <code>npx expo run:ios</code> bila Xcode sudah siap.',
        'Build pertama biasanya paling lama. Setelah itu, perubahan JavaScript cukup lewat Metro; build ulang hanya diperlukan ketika dependensi native berubah.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Struktur Proyek yang Akan Kita Pakai</h3><p>Template Expo Router memberi folder <code>app/</code> untuk rute. Kita tambahkan <code>src/</code> untuk kode yang tidak mengatur URL: komponen, fitur, layanan, database, dan tipe.</p>'
    },
    {
      type: 'example',
      title: 'Struktur folder Kantong',
      lang: 'text',
      output: false,
      code: `kantong/
├── app/                     # rute Expo Router (file = URL)
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/
│   │   ├── index.tsx        # Beranda
│   │   ├── expenses.tsx     # Daftar pengeluaran
│   │   └── profile.tsx
│   ├── expense/
│   │   └── [id].tsx         # Detail dinamis
│   └── _layout.tsx          # provider global
├── src/
│   ├── components/
│   │   ├── ui/              # Button, Input, Card
│   │   └── common/          # EmptyState, ErrorState
│   ├── features/
│   │   ├── auth/
│   │   ├── expenses/
│   │   └── reports/
│   ├── db/                  # skema & migrasi SQLite
│   ├── services/            # API client, storage
│   ├── stores/              # Zustand
│   ├── hooks/
│   ├── theme/               # token warna, spacing
│   ├── types/
│   └── utils/
├── assets/
├── app.json
├── package.json
├── tsconfig.json
└── eas.json                 # dibuat saat build:configure`,
      explain: [
        'Folder <code>app/</code> hanya berisi layar dan layout. Logika bisnis tidak diletakkan di sana agar mudah diuji dan dipakai ulang.',
        'Setiap fitur memiliki komponen, hook, dan service sendiri. Ini mencegah folder <code>components/</code> menjadi tempat sampah berisi ratusan berkas.',
        'Berkas <code>app/</code> tetap boleh mengimpor dari <code>src/</code>. Arah dependensi selalu dari rute ke fitur, bukan sebaliknya.'
      ]
    },
    {
      type: 'example',
      title: 'app.json dan tsconfig.json yang rapi',
      lang: 'json',
      output: false,
      code: `{
  "expo": {
    "name": "Kantong",
    "slug": "kantong",
    "version": "1.0.0",
    "orientation": "portrait",
    "scheme": "kantong",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "id.contoh.kantong"
    },
    "android": {
      "package": "id.contoh.kantong",
      "adaptiveIcon": {
        "backgroundColor": "#0F766E"
      }
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      "expo-sqlite"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}`,
      explain: [
        '<code>scheme</code> dipakai untuk deep link, misalnya <code>kantong://expense/123</code>. Tanpa scheme, tautan kembali dari browser atau notifikasi tidak dapat membuka aplikasi.',
        '<code>userInterfaceStyle: automatic</code> membuat aplikasi mengikuti tema sistem. Kita akan memakai token warna agar mode gelap benar-benar konsisten.',
        '<code>typedRoutes</code> membuat Expo Router menghasilkan tipe untuk rute. Kesalahan menulis <code>/expense/</code> alih-alih <code>/expenses/</code> tertangkap saat typecheck.'
      ]
    },
    {
      type: 'example',
      title: 'tsconfig.json dan script pemeriksaan',
      lang: 'json',
      output: false,
      code: `{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}`,
      explain: [
        'Alias <code>@/</code> menghindari impor relatif berantai seperti <code>../../../services/api</code>. Pastikan Metro dan TypeScript memakai alias yang sama.',
        'Tambahkan script <code>"typecheck": "tsc --noEmit"</code> dan <code>"lint": "expo lint"</code> di <code>package.json</code>. Jalankan keduanya sebelum commit.',
        'Jika alias belum dikenali Metro, periksa konfigurasi Babel/Metro sesuai dokumentasi Expo versi proyekmu. Jangan menebak versi plugin.'
      ]
    },
    {
      type: 'tip',
      title: 'Checklist "Aplikasi Sudah Benar-Benar Jalan"',
      text: 'Ubah teks di <code>app/(tabs)/index.tsx</code>, simpan, dan pastikan perubahan muncul tanpa restart. Matikan WiFi ponsel lalu nyalakan lagi; Metro harus tersambung kembali. Tutup aplikasi dan buka lagi; aplikasi harus tetap terbuka tanpa layar merah. Bila ketiganya berhasil, lingkunganmu siap.'
    },
    {
      type: 'warn',
      title: 'Masalah Setup yang Paling Sering Terjadi',
      text: 'Layar merah "Unable to resolve module" biasanya berarti cache Metro basi: jalankan <code>npx expo start -c</code>. Perangkat tidak terhubung biasanya karena ponsel dan komputer berbeda jaringan: gunakan tunnel (<code>npx expo start --tunnel</code>) atau kabel USB. Port 8081 bentrok: hentikan proses lain atau jalankan <code>npx expo start --port 8082</code>. Jangan mengatasi error dengan menghapus folder <code>node_modules</code> berulang kali tanpa membaca pesan utamanya.'
    },
    {
      type: 'text',
      html: '<h3>Praktik Mandiri</h3><ol><li>Buat proyek sesuai perintah di atas dan jalankan di ponsel fisik atau emulator.</li><li>Ubah layar awal menjadi sapaan: <b>"Halo, Kantong siap mencatat."</b> dengan tombol yang menampilkan <code>Alert.alert</code>.</li><li>Tambahkan <code>"typecheck": "tsc --noEmit"</code>, lalu jalankan. Perbaiki semua error sebelum lanjut.</li><li>Buat berkas <code>.env.local</code> berisi <code>EXPO_PUBLIC_API_URL=https://jsonplaceholder.typicode.com</code> dan pastikan nilainya terbaca lewat <code>process.env.EXPO_PUBLIC_API_URL</code>.</li><li>Ambil tangkapan layar aplikasi di ponsel dan simpan ke <code>docs/bab-02.png</code> sebagai bukti checkpoint.</li></ol><p><b>Kriteria lulus:</b> aplikasi terbuka di perangkat, perubahan kode tampil tanpa restart, typecheck bersih, dan kamu tahu mode build mana yang sedang dipakai.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Expo Go', 'Aplikasi klien umum untuk membuka proyek Expo tanpa build sendiri.'],
        ['Development build', 'Build aplikasi dengan modul native proyek, tetap memuat JS dari Metro.'],
        ['EAS', 'Expo Application Services: build, submit, dan update di cloud.'],
        ['Metro', 'Bundler yang menyajikan JavaScript saat development.'],
        ['Prebuild', 'Proses menghasilkan folder android/ios dari konfigurasi Expo.'],
        ['Scheme', 'Protokol kustom aplikasi untuk deep link, misalnya kantong://.'],
        ['Typed routes', 'Tipe otomatis untuk rute Expo Router agar kesalahan URL terdeteksi.'],
        ['Environment variable', 'Nilai konfigurasi per lingkungan; di Expo publik harus berawalan EXPO_PUBLIC_.'],
        ['Bundle identifier', 'ID unik aplikasi iOS, misalnya id.contoh.kantong.'],
        ['Package name', 'ID unik aplikasi Android, biasanya sama dengan bundle identifier.']
      ]
    }
  ],
  recap: [
    'Node LTS, Git, dan satu package manager adalah prasyarat utama; Android Studio/Xcode menyusul sesuai kebutuhan.',
    'Template Expo default sudah memakai Expo Router dan TypeScript.',
    'Expo Go cocok untuk belajar, development build dibutuhkan untuk modul native.',
    'Struktur app/ untuk rute dan src/ untuk logika menjaga batas yang jelas.',
    'Typecheck, lint, dan pengujian di perangkat fisik adalah kebiasaan sejak awal.'
  ]
});
