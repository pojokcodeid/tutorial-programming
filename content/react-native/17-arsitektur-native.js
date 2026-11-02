/* ============================================================
   Pelajaran React Native — Bab 17: Arsitektur, Native Module,
   dan New Architecture
   ============================================================ */
'use strict';

window.REACTNATIVE_LESSONS = window.REACTNATIVE_LESSONS || [];

window.REACTNATIVE_LESSONS.push({
  id: 'rn-arsitektur-native',
  title: 'Arsitektur Maintainable dan Native Module',
  chapter: 'Arsitektur & Rilis',
  duration: '34 menit',
  intro: [
    'Pada bab-bab awal, kode masih bisa ditelusuri dari satu layar. Setelah ada autentikasi, database, sinkronisasi, dan notifikasi, batas antar bagian menjadi penentu apakah aplikasi masih bisa diubah dengan aman.',
    'Bab ini menyusun ulang Kantong dengan <b>feature-based architecture</b>: setiap fitur memiliki komponen, hook, service, schema, dan tipe sendiri. Kita juga membahas repository, dependency inversion, dan kapan sesuatu layak menjadi lapisan terpisah.',
    'Bagian kedua masuk ke <b>New Architecture</b>: JSI, Fabric, TurboModules, Codegen, dan Expo Modules API. Kamu akan membuat native module sederhana untuk membaca label perangkat, sekaligus memahami kapan sebaiknya tidak menulis kode native sama sekali.'
  ],
  objectives: [
    'Menyusun struktur fitur dengan batas domain, data, dan presentasi',
    'Menerapkan repository dan dependency inversion tanpa over-engineering',
    'Memahami JSI, Fabric, TurboModules, dan Codegen',
    'Membuat serta memakai native module lokal dengan Expo Modules API',
    'Mendiagnosis masalah native module dan build'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Struktur yang Tumbuh Bersama Fitur</h3><p>Struktur berbasis lapisan teknis (<code>components/</code>, <code>hooks/</code>, <code>services/</code>) mudah dimulai, tetapi melebar tanpa batas. Struktur berbasis fitur mengelompokkan hal yang berubah bersama: semua kode pengeluaran ada di <code>features/expenses/</code>.</p><p>Di dalam fitur, pisahkan tiga lapisan: <b>domain</b> (tipe dan aturan bisnis), <b>data</b> (API, database, repository), dan <b>presentasi</b> (komponen, hook, layar). Lapisan presentasi boleh bergantung pada domain dan data; domain tidak boleh bergantung pada React Native.</p>'
    },
    {
      type: 'example',
      title: 'Struktur fitur Kantong',
      lang: 'text',
      output: false,
      code: `src/
├── features/
│   ├── auth/
│   │   ├── components/LoginForm.tsx
│   │   ├── hooks/useSession.ts
│   │   ├── services/authService.ts
│   │   └── types.ts
│   ├── expenses/
│   │   ├── components/ExpenseCard.tsx
│   │   ├── components/ExpenseForm.tsx
│   │   ├── domain/expense.ts
│   │   ├── data/expenseRepository.ts
│   │   ├── hooks/useExpenses.ts
│   │   ├── hooks/useCreateExpense.ts
│   │   └── schemas/expenseSchema.ts
│   └── reports/
│       ├── components/MonthlyChart.tsx
│       ├── hooks/useMonthlySummary.ts
│       └── services/reportService.ts
├── components/
│   ├── ui/                # design system lintas fitur
│   └── common/            # EmptyState, ErrorState
├── services/              # api, queryClient, storage
├── stores/                # state klien lintas fitur
├── db/                    # koneksi & migrasi SQLite
├── theme/
├── types/                 # tipe lintas fitur
└── utils/`,
      explain: [
        'Fitur boleh mengimpor dari <code>components/ui</code>, <code>services</code>, dan <code>utils</code>. Fitur lain tidak boleh mengimpor internal fitur secara sembarangan.',
        'Berkas rute di <code>app/</code> hanya merangkai layar: memanggil hook, menangani navigasi, dan menampilkan state.',
        'Jika satu komponen dipakai dua fitur, pindahkan ke <code>components/common</code>. Jika dipakai banyak aplikasi/tim, pertimbangkan paket terpisah.'
      ]
    },
    {
      type: 'example',
      title: 'Domain, repository, dan implementasi',
      lang: 'ts',
      output: false,
      code: `// features/expenses/domain/expenseRepository.ts
import type { Expense } from '@/types/domain';

export interface ExpenseRepository {
  list(limit?: number): Promise<Expense[]>;
  create(input: Omit<Expense, 'id' | 'syncState'>): Promise<Expense>;
  remove(id: string): Promise<void>;
}

// features/expenses/data/sqliteExpenseRepository.ts
import { listLocalExpenses } from '@/db/expenseRepository';
import type { ExpenseRepository } from '../domain/expenseRepository';

export function createSqliteExpenseRepository(): ExpenseRepository {
  return {
    async list(limit = 50) {
      return listLocalExpenses(limit);
    },
    async create(input) {
      // delegasi ke insertLocalExpense (Bab 11)
      throw new Error('implementasikan pemanggilan insertLocalExpense');
    },
    async remove(_id) {
      // tandai deleted_at, masukkan ke outbox
    },
  };
}`,
      explain: [
        'Komponen dan hook bergantung pada <i>interface</i>, bukan implementasi SQLite. Ini memudahkan pengujian dengan repository palsu.',
        'Jangan membuat repository untuk setiap tabel hanya karena pola. Buat ketika ada batas yang perlu dilindungi atau implementasi yang bisa berganti.',
        'Repository mengembalikan model domain, bukan row database mentah. Pemetaan tetap di lapisan data.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Dependency Inversion Tanpa Framework Berat</h3><p>Kamu tidak perlu container DI. Cukup buat satu modul komposisi yang merangkai implementasi: <code>const expenseRepository = createSqliteExpenseRepository()</code> lalu <code>const syncService = createSyncService({ repository: expenseRepository })</code>.</p><p>Hook menerima dependensi lewat parameter atau Context. Saat pengujian, ganti dengan implementasi in-memory. Hindari singleton global yang tersembunyi; ia membuat test saling memengaruhi.</p>'
    },
    {
      type: 'text',
      html: '<h3>New Architecture dalam Satu Halaman</h3><table class="vocab"><tr><th>Bagian</th><th>Peran</th><th>Manfaat</th></tr><tr><td><b>JSI</b></td><td>Antarmuka JavaScript ke C++/native</td><td>Pemanggilan sinkron tanpa bridge antrean</td></tr><tr><td><b>Fabric</b></td><td>Renderer UI baru</td><td>Rendering lebih cepat dan konsisten</td></tr><tr><td><b>TurboModules</b></td><td>Modul native lazy-loaded</td><td>Startup lebih ringan, tipe lebih jelas</td></tr><tr><td><b>Codegen</b></td><td>Menghasilkan kode penghubung dari spesifikasi tipe</td><td>Mengurangi kesalahan manual</td></tr><tr><td><b>Hermes</b></td><td>Mesin JavaScript</td><td>Startup cepat, memori kecil</td></tr></table><p>Sebagian besar aplikasi Expo tidak perlu menulis kode native. Kamu memakai modul yang sudah ada. Native module baru masuk akal ketika ada SDK perangkat, algoritma berat, atau integrasi sistem yang belum tersedia.</p>'
    },
    {
      type: 'example',
      title: 'Membuat native module lokal dengan Expo Modules API',
      lang: 'bash',
      output: false,
      code: `# Di root proyek Expo (bukan di dalam app/)
npx create-expo-module@latest --local kantong-device

# Struktur yang dihasilkan:
# modules/kantong-device/
#   android/src/main/java/.../KantongDeviceModule.kt
#   ios/KantongDeviceModule.swift
#   index.ts
#   expo-module.config.json

# Setelah menambah modul native, buat development build ulang:
npx expo run:android
# atau
eas build --profile development --platform android`,
      explain: [
        'Modul lokal berada di dalam proyek dan tidak dipublikasikan ke npm. Cocok untuk kebutuhan spesifik aplikasi.',
        'Expo Go tidak bisa memuat modul native kustom. Kamu wajib memakai development build.',
        'Setiap perubahan kode native memerlukan build ulang; perubahan JavaScript tetap bisa lewat Metro.'
      ]
    },
    {
      type: 'example',
      title: 'Implementasi Kotlin, Swift, dan pemakaian TypeScript',
      lang: 'kt',
      output: false,
      code: `// modules/kantong-device/android/.../KantongDeviceModule.kt
package expo.modules.kantongdevice

import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class KantongDeviceModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("KantongDevice")

    Function("getDeviceLabel") {
      "Android \${Build.MANUFACTURER} \${Build.MODEL}"
    }
  }
}

// modules/kantong-device/ios/KantongDeviceModule.swift
import ExpoModulesCore
import UIKit

public class KantongDeviceModule: Module {
  public func definition() -> ModuleDefinition {
    Name("KantongDevice")

    Function("getDeviceLabel") {
      "iOS \\(UIDevice.current.model)"
    }
  }
}

// modules/kantong-device/index.ts
import { requireNativeModule } from 'expo-modules-core';

type KantongDeviceModule = {
  getDeviceLabel(): string;
};

const Native = requireNativeModule<KantongDeviceModule>('KantongDevice');
export function getDeviceLabel() {
  return Native.getDeviceLabel();
}`,
      explain: [
        'Nama modul pada <code>Name("KantongDevice")</code> harus sama dengan yang diminta <code>requireNativeModule</code>.',
        'Fungsi sinkron cocok untuk nilai kecil. Untuk pekerjaan berat atau I/O, gunakan fungsi async agar tidak menahan thread.',
        'Kode Kotlin dan Swift di atas adalah contoh minimal. Untuk produksi, tambahkan penanganan error, tipe yang tepat, dan pengujian di kedua platform.'
      ]
    },
    {
      type: 'warn',
      title: 'Jangan Menulis Native Module Tanpa Kebutuhan',
      text: 'Native module menambah beban perawatan: dua bahasa, dua build system, dua platform, dan risiko breaking saat upgrade React Native. Cari modul Expo/community terlebih dahulu. Tulis sendiri hanya bila ada kebutuhan yang tidak bisa dipenuhi, dan dokumentasikan alasan serta pemiliknya.'
    },
    {
      type: 'tip',
      title: 'Troubleshooting Native yang Sistematis',
      text: 'Mulai dari pesan error pertama, bukan yang terakhir. Jalankan <code>npx expo-doctor</code>, hapus cache Metro (<code>npx expo start -c</code>), lalu build ulang. Untuk Android, periksa Logcat dan pastikan package name cocok. Untuk iOS, periksa Xcode build log dan pod install. Jangan mengubah versi acak-acakan sebelum tahu penyebabnya.'
    },
    {
      type: 'text',
      html: '<h3>Praktik Mandiri</h3><ol><li>Refactor satu fitur menjadi <code>domain/</code>, <code>data/</code>, dan <code>presentasi</code>. Pastikan tidak ada impor React Native di lapisan domain.</li><li>Buat interface <code>ExpenseRepository</code> dan dua implementasi: SQLite dan in-memory untuk test.</li><li>Buat modul lokal <code>kantong-device</code> yang mengembalikan label perangkat, lalu tampilkan di layar Profil.</li><li>Uji modul di Android dan iOS melalui development build.</li><li>Hapus satu abstraksi yang ternyata tidak memberi nilai, lalu jelaskan alasannya.</li></ol><p><b>Checkpoint:</b> struktur fitur jelas, test bisa memakai repository palsu, dan modul native berjalan di build nyata.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Feature-based architecture', 'Mengelompokkan kode berdasarkan fitur, bukan jenis teknis.'],
        ['Separation of concerns', 'Memisahkan tanggung jawab agar perubahan terlokalisasi.'],
        ['Repository', 'Abstraksi akses data yang menyembunyikan detail penyimpanan.'],
        ['Dependency inversion', 'Bergantung pada abstraksi, bukan implementasi konkret.'],
        ['Composition root', 'Tempat merangkai implementasi dependensi saat aplikasi mulai.'],
        ['SOLID', 'Lima prinsip desain berorientasi objek untuk kode yang mudah diubah.'],
        ['JSI', 'JavaScript Interface pada New Architecture.'],
        ['Fabric', 'Renderer UI React Native modern.'],
        ['TurboModule', 'Modul native bertipe yang dimuat secara lazy.'],
        ['Codegen', 'Pembuat kode penghubung dari spesifikasi tipe.'],
        ['Expo Modules API', 'API untuk membuat modul native yang kompatibel dengan Expo.'],
        ['Development build', 'Build yang memuat modul native proyek.'],
        ['Over-engineering', 'Menambah abstraksi tanpa kebutuhan nyata.']
      ]
    }
  ],
  recap: [
    'Struktur berbasis fitur menjaga perubahan tetap terlokalisasi.',
    'Domain tidak bergantung pada React Native; data dan presentasi boleh bergantung pada domain.',
    'Repository dan dependency inversion berguna saat ada batas atau implementasi yang bisa berganti.',
    'New Architecture terdiri dari JSI, Fabric, TurboModules, dan Codegen.',
    'Native module hanya dibuat jika modul yang ada tidak mencukupi, dan wajib diuji di development build.'
  ]
});
