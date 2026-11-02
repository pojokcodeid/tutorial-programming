/* ============================================================
   Pelajaran React Native — Bab 19: Build, CI/CD, dan Produksi
   ============================================================ */
'use strict';

window.REACTNATIVE_LESSONS = window.REACTNATIVE_LESSONS || [];

window.REACTNATIVE_LESSONS.push({
  id: 'rn-build-deploy',
  title: 'Build, CI/CD, dan Kesiapan Produksi',
  chapter: 'Arsitektur & Rilis',
  duration: '35 menit',
  intro: [
    'Aplikasi yang hanya berjalan di mode development belum selesai. Ia harus bisa dibangun secara konsisten, ditandatangani, diuji, diunggah ke toko, dan dipantau setelah dirilis.',
    'Bab ini menyiapkan rilis Kantong dengan EAS: profil development, preview, dan production; versi aplikasi dan runtime; signing; GitHub Actions; serta pembaruan OTA yang aman. Kita juga membahas hal yang sering terlupakan: environment, logging, crash reporting, analytics, privasi, dan checklist toko aplikasi.',
    'Tujuannya bukan sekadar menghasilkan APK/AAB/IPA, tetapi memiliki proses rilis yang bisa diulang oleh orang lain tanpa bertanya kepada kamu.'
  ],
  objectives: [
    'Membedakan build development, preview, dan production',
    'Mengonfigurasi EAS Build, Submit, dan Update',
    'Mengelola versi, environment, dan signing dengan aman',
    'Membuat pipeline CI yang menjalankan typecheck, test, dan build',
    'Menilai kesiapan produksi dengan checklist yang nyata'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Tiga Jenis Build yang Tidak Boleh Dicampur</h3><table class="vocab"><tr><th>Profil</th><th>Tujuan</th><th>Distribusi</th><th>Ciri</th></tr><tr><td>Development</td><td>Harian, dengan Metro</td><td>Tim internal</td><td>Development client, debug menu, modul native proyek</td></tr><tr><td>Preview</td><td>Uji internal sebelum rilis</td><td>TestFlight / internal track</td><td>Mirip produksi, tanda tangan uji, logging</td></tr><tr><td>Production</td><td>Pengguna nyata</td><td>App Store / Play Store</td><td>Minified, signing produksi, tanpa debug</td></tr></table><p>Jangan menguji fitur native hanya di Expo Go, dan jangan mengirim build development ke toko. Keduanya menghasilkan bug yang tidak terlihat sampai terlambat.</p>'
    },
    {
      type: 'example',
      title: 'eas.json untuk tiga lingkungan',
      lang: 'json',
      output: false,
      code: `{
  "cli": {
    "version": ">= 12.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://dev-api.kantong.id",
        "EXPO_PUBLIC_ENV": "development"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://staging-api.kantong.id",
        "EXPO_PUBLIC_ENV": "preview"
      }
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.kantong.id",
        "EXPO_PUBLIC_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./secrets/play-service-account.json",
        "track": "internal"
      },
      "ios": {
        "appleId": "akun@contoh.id",
        "ascAppId": "1234567890"
      }
    }
  }
}`,
      explain: [
        '<code>developmentClient: true</code> menghasilkan build yang bisa memuat JS dari Metro. Ini bukan build untuk toko.',
        '<code>autoIncrement</code> menaikkan build number secara otomatis. Version name (1.0.0) tetap dikelola manusia; build number harus selalu naik.',
        'Jangan menaruh file service account atau sertifikat di repositori. Gunakan secret EAS/GitHub dan .gitignore.',
        'URL API berbeda per environment. Pastikan build tidak pernah menunjuk ke API development saat rilis.'
      ]
    },
    {
      type: 'example',
      title: 'app.config.ts: versi, runtime, dan konfigurasi',
      lang: 'ts',
      output: false,
      code: `// app.config.ts
import type { ExpoConfig } from 'expo/config';

const IS_PRODUCTION = process.env.EXPO_PUBLIC_ENV === 'production';

const config: ExpoConfig = {
  name: IS_PRODUCTION ? 'Kantong' : 'Kantong (Dev)',
  slug: 'kantong',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'kantong',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  runtimeVersion: { policy: 'appVersion' },
  updates: {
    url: 'https://u.expo.dev/PROJECT_ID',
    fallbackToCacheTimeout: 0,
  },
  ios: {
    bundleIdentifier: 'id.contoh.kantong',
    supportsTablet: true,
    infoPlist: {
      NSCameraUsageDescription:
        'Kamera dipakai untuk memfoto struk pengeluaranmu.',
      NSLocationWhenInUseUsageDescription:
        'Lokasi dipakai untuk menandai tempat pengeluaran.',
    },
  },
  android: {
    package: 'id.contoh.kantong',
    permissions: ['CAMERA', 'ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
    adaptiveIcon: { backgroundColor: '#0F766E' },
  },
  plugins: ['expo-router', 'expo-secure-store', 'expo-sqlite', 'expo-notifications'],
  extra: {
    eas: { projectId: 'PROJECT_ID' },
  },
};

export default config;`,
      explain: [
        '<code>runtimeVersion</code> menentukan kompatibilitas OTA. Pembaruan JS hanya boleh dikirim ke build dengan runtime yang sama.',
        '<code>fallbackToCacheTimeout: 0</code> membuat aplikasi langsung memakai bundel yang tersedia, lalu memeriksa update di latar belakang.',
        'Izin dan teks alasan harus sesuai fitur nyata. Jangan menyalin teks generik dari template.',
        'Gunakan <code>app.config.ts</code> bila butuh logika environment; <code>app.json</code> statis lebih sederhana untuk proyek kecil.'
      ]
    },
    {
      type: 'example',
      title: 'Alur rilis dari lokal',
      lang: 'bash',
      output: false,
      code: `# 1. Pastikan kualitas
npm run typecheck
npm test
npx expo-doctor

# 2. Build preview untuk uji internal
eas build --profile preview --platform all

# 3. Uji build di perangkat (bukan hanya simulator)
#    - login, tambah pengeluaran, foto, lokasi, offline, logout

# 4. Build production
eas build --profile production --platform all

# 5. Kirim ke toko (internal track dulu)
eas submit --profile production --platform android
eas submit --profile production --platform ios

# 6. Setelah stabil, naikkan rollout bertahap`,
      explain: [
        'Urutan ini mencegah build mahal dibuat sebelum kualitas dasar lulus.',
        'Uji build preview di perangkat fisik. Perbedaan signing dan optimasi bisa memunculkan bug yang tidak terlihat di development.',
        'Mulai dari internal track/test flight, lalu naikkan rollout. Jangan langsung 100% ke semua pengguna.',
        'Simpan artefak dan catatan rilis: versi, build number, commit, dan perubahan.'
      ]
    },
    {
      type: 'example',
      title: 'GitHub Actions: cek kualitas dan build',
      lang: 'yaml',
      output: false,
      code: `name: mobile-ci

on:
  pull_request:
  push:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm test -- --ci --coverage
      - run: npx expo-doctor

  preview-build:
    if: github.ref == 'refs/heads/main'
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: \${{ secrets.EXPO_TOKEN }}
      - run: eas build --profile preview --platform android --non-interactive --no-wait`,
      explain: [
        'Pull request menjalankan typecheck dan test; build hanya dibuat dari main agar tidak memboroskan kuota.',
        '<code>EXPO_TOKEN</code> disimpan sebagai secret repositori, bukan di workflow.',
        '<code>--no-wait</code> membuat CI tidak menunggu build selesai; hasil build dapat dipantau di EAS. Untuk gerbang rilis ketat, hapus flag ini.',
        'Tambahkan caching dependensi dan batas waktu job agar pipeline tidak menggantung.'
      ]
    },
    {
      type: 'text',
      html: '<h3>OTA Update: Cepat, tetapi Bukan Sihir</h3><p>EAS Update mengirim bundel JavaScript dan aset tanpa melalui review toko. Ini berguna untuk perbaikan bug kecil dan perubahan teks. Namun OTA <b>tidak bisa</b> mengubah kode native, menambah izin, atau mengganti library yang membutuhkan build baru.</p><p>Aturan aman: gunakan <code>runtimeVersion</code> yang benar, uji update di channel preview, kirim bertahap, dan siapkan rollback. Jangan mengirim update yang mengubah kontrak data tanpa kompatibilitas mundur.</p>'
    },
    {
      type: 'example',
      title: 'Update OTA dengan channel',
      lang: 'bash',
      output: false,
      code: `# Build production dengan channel
eas build --profile production --platform all

# Kirim update ke channel production
eas update --channel production --message "Perbaiki format tanggal"

# Uji lebih dulu di channel preview
eas update --channel preview --message "Uji perbaikan tanggal"

# Rollback: arahkan kembali ke update sebelumnya
eas update:republish --group <GROUP_ID> --channel production`,
      explain: [
        'Channel memisahkan alur update. Build preview dan production harus memakai channel masing-masing.',
        'Pesan update yang jelas memudahkan audit saat ada masalah.',
        'Republish bukan undo ajaib; pastikan update lama masih kompatibel dengan build yang beredar.',
        'Selalu uji update di build yang sama dengan yang dipakai pengguna.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Kesiapan Produksi</h3><ul><li><b>Keamanan:</b> token di SecureStore, tidak ada secret di bundel, HTTPS, certificate pinning bila diperlukan, validasi server.</li><li><b>Observability:</b> crash reporting (Sentry/Bugsnag), analytics peristiwa penting, log tanpa data pribadi.</li><li><b>Privasi:</b> kebijakan privasi, izin dijelaskan, data yang dikumpulkan minimal, penghapusan akun.</li><li><b>Kualitas:</b> typecheck, test, E2E alur kritis, uji offline, uji aksesibilitas, uji perangkat kecil.</li><li><b>Operasi:</b> versi dan build number, catatan rilis, rollback, kontak dukungan, monitoring error.</li><li><b>Toko:</b> ikon, screenshot, deskripsi, klasifikasi usia, kebijakan privasi, data safety form.</li></ul><p>Buat checklist ini sebagai dokumen di repositori dan perbarui setiap rilis. Rilis yang bergantung pada ingatan satu orang adalah risiko.</p>'
    },
    {
      type: 'warn',
      title: 'Jangan Menaruh Rahasia di Repositori atau Bundel',
      text: 'File <code>.env</code>, keystore, service account, dan sertifikat tidak boleh di-commit. <code>EXPO_PUBLIC_*</code> tetap terlihat di bundel. Untuk rahasia, gunakan secret EAS/GitHub dan backend. Jika sebuah kunci pernah bocor, mencabutnya lebih penting daripada menghapusnya dari riwayat Git.'
    },
    {
      type: 'tip',
      title: 'Rilis Kecil, Sering, dan Terukur',
      text: 'Rilis besar menumpuk risiko. Rilis kecil dengan catatan perubahan jelas lebih mudah diuji dan di-rollback. Pantau crash rate, waktu startup, dan metrik alur utama setelah rilis. Siapkan rencana jika angka memburuk: rollback OTA, matikan feature flag, atau tarik build dari rollout.'
    },
    {
      type: 'text',
      html: '<h3>Praktik Mandiri</h3><ol><li>Buat <code>eas.json</code> dengan tiga profil dan pastikan environment API berbeda.</li><li>Build preview untuk Android, pasang di perangkat, dan uji alur login → tambah → offline → logout.</li><li>Buat workflow GitHub Actions yang menjalankan typecheck dan test pada setiap pull request.</li><li>Kirim satu update OTA ke channel preview dan verifikasi versi yang diterima aplikasi.</li><li>Isi checklist produksi untuk Kantong, termasuk privacy policy dan data safety.</li></ol><p><b>Checkpoint:</b> build preview bisa diinstal orang lain, pipeline gagal saat test gagal, dan kamu tahu kapan OTA tidak boleh dipakai.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['EAS Build', 'Layanan build aplikasi Expo di cloud.'],
        ['EAS Submit', 'Layanan pengunggahan build ke App Store/Play Store.'],
        ['EAS Update', 'Pembaruan bundel JavaScript/aset tanpa review toko.'],
        ['Development client', 'Build yang memuat Metro dan modul native proyek.'],
        ['Runtime version', 'Penanda kompatibilitas antara build native dan update OTA.'],
        ['Channel', 'Jalur distribusi update, misalnya preview dan production.'],
        ['Signing', 'Tanda tangan kriptografis yang membuktikan keaslian aplikasi.'],
        ['Keystore', 'Penyimpanan kunci signing Android.'],
        ['Provisioning profile', 'Konfigurasi izin dan sertifikat untuk build iOS.'],
        ['Build number', 'Nomor build yang harus selalu naik.'],
        ['Rollout', 'Peluncuran bertahap ke sebagian pengguna.'],
        ['Crash reporting', 'Pengumpulan dan analisis crash dari perangkat pengguna.'],
        ['Data safety', 'Formulir Play Store tentang data yang dikumpulkan aplikasi.']
      ]
    }
  ],
  recap: [
    'Development, preview, dan production memiliki tujuan dan signing berbeda.',
    'EAS Build/Submit/Update mempercepat rilis, tetapi tetap membutuhkan pengujian nyata.',
    'OTA hanya untuk JS/aset; perubahan native memerlukan build baru.',
    'CI harus menjalankan typecheck, test, dan pemeriksaan kesehatan proyek.',
    'Rahasia tidak boleh berada di repositori atau bundel publik.'
  ]
});
