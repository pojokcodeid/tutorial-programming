/* ============================================================
   Pelajaran React Native — Bab 1: Fondasi React Native & TypeScript
   ============================================================ */
'use strict';

window.REACTNATIVE_LESSONS = window.REACTNATIVE_LESSONS || [];

window.REACTNATIVE_LESSONS.push({
  id: 'rn-fondasi',
  title: 'React Native, Expo, dan TypeScript untuk Mobile',
  chapter: 'Fondasi & Persiapan',
  duration: '22 menit',
  intro: [
    'React Native bukan "React yang ditempel ke layar ponsel". Ia memakai model komponen dan state yang sama, tetapi merender ke <b>komponen native</b> Android dan iOS, bukan ke DOM. Perbedaan ini memengaruhi styling, navigasi, penyimpanan, izin perangkat, dan cara kamu menguji aplikasi.',
    'Sepanjang tutorial ini kamu akan membangun satu aplikasi bernama <b>Kantong</b>: pencatat pengeluaran yang mendukung mode offline, foto struk, lokasi, autentikasi, dan rilis produksi. Setiap bab menambah satu lapisan yang benar-benar dipakai di bab berikutnya, sehingga tidak ada kode contoh yang berhenti menjadi contoh.',
    'Di bab pembuka ini kamu akan memahami arsitektur React Native, memilih Expo atau bare workflow, lalu menyiapkan fondasi TypeScript yang ketat. Fondasi ini yang membedakan aplikasi hobi dari aplikasi yang masih bisa dirawat enam bulan kemudian.'
  ],
  objectives: [
    'Menjelaskan cara React Native merender UI ke komponen native',
    'Membedakan JavaScript thread, UI thread, Hermes, Metro, dan New Architecture',
    'Memilih Expo atau React Native Community CLI berdasarkan kebutuhan nyata',
    'Menyiapkan TypeScript strict dan model data untuk aplikasi Kantong',
    'Membuat tipe response API yang aman untuk data yang belum tentu valid'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Apa yang Sedang Kamu Bangun</h3><p><b>Kantong</b> adalah aplikasi pencatat pengeluaran. Fiturnya sengaja mirip aplikasi nyata: pengguna masuk, mencatat pengeluaran, melampirkan foto struk, menandai lokasi, melihat ringkasan, dan tetap bisa mencatat saat sinyal hilang. Data disinkronkan ketika jaringan kembali.</p><p>Kita memakai satu aplikasi untuk semua bab agar kamu merasakan masalah yang muncul ketika fitur bertambah: state bercampur, navigasi berlapis, token kedaluwarsa, database berubah versi, dan build rilis yang berbeda dari mode development.</p>'
    },
    {
      type: 'text',
      html: '<h3>Cara React Native Bekerja</h3><p>Kode JavaScript kamu berjalan di <b>JavaScript thread</b>. Di React Native lama, perubahan UI dikirim ke <b>UI thread</b> melalui <i>bridge</i> yang berbentuk antrean pesan. Di <b>New Architecture</b>, JSI memungkinkan pemanggilan fungsi native secara langsung, Fabric menangani rendering, dan TurboModules menangani modul native.</p><p><b>Hermes</b> adalah mesin JavaScript yang dioptimalkan untuk mobile: waktu mulai lebih cepat dan memori lebih kecil. <b>Metro</b> adalah bundler yang menggabungkan berkas JavaScript dan aset saat development maupun build.</p><table class="vocab"><tr><th>Bagian</th><th>Tugas</th><th>Gejala bila bermasalah</th></tr><tr><td>JS thread</td><td>Menjalankan komponen, state, dan logika aplikasi</td><td>Aplikasi terasa "berat" saat animasi atau scroll</td></tr><tr><td>UI thread</td><td>Menggambar dan menggerakkan komponen native</td><td>Frame drop, animasi patah-patah</td></tr><tr><td>Hermes</td><td>Mengeksekusi JavaScript</td><td>Crash saat startup, pesan error sulit dibaca</td></tr><tr><td>Metro</td><td>Menyusun bundel dan aset</td><td>Perubahan tidak muncul, cache basi</td></tr></table>'
    },
    {
      type: 'example',
      title: 'Perjalanan satu ketukan tombol',
      lang: 'text',
      output: false,
      code: `Pengguna menekan "Simpan"
        │
        ▼
Pressable (komponen native) mengirim event ke JS thread
        │
        ▼
Handler onSubmit menjalankan validasi + simpan ke SQLite
        │
        ▼
State React berubah: tombol menjadi "Menyimpan..."
        │
        ▼
Reconciler menghitung perubahan UI
        │
        ▼
Fabric / bridge meminta UI thread menggambar spinner
        │
        ▼
Setelah sukses, state berubah lagi: daftar pengeluaran diperbarui`,
      explain: [
        'Semua logika bisnis tetap di JavaScript. Yang native adalah komponen tampilan, akses kamera, GPS, dan penyimpanan tingkat sistem.',
        'Karena JS thread dan UI thread berbeda, pekerjaan berat seperti parsing JSON besar atau enkripsi dapat membuat animasi tersendat bila tidak dipindahkan.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Expo atau React Native Community CLI?</h3><p><b>Expo</b> adalah lapisan alat dan modul di atas React Native. Kamu mendapat development server, build cloud (EAS), pembaruan OTA, serta modul siap pakai untuk kamera, lokasi, notifikasi, dan SQLite. <b>React Native Community CLI</b> memberi kontrol penuh atas folder <code>android/</code> dan <code>ios/</code>, tetapi kamu mengelola Android Studio, Xcode, Gradle, CocoaPods, dan signing sendiri.</p><p>Untuk belajar dan sebagian besar aplikasi bisnis, <b>mulai dari Expo</b>. Pindah ke bare workflow atau <i>prebuild</i> hanya ketika ada kebutuhan native yang benar-benar tidak tersedia. Menghindari Expo sejak awal jarang menghemat waktu; biasanya justru menambah hambatan sebelum baris kode pertama berjalan.</p>'
    },
    {
      type: 'warn',
      title: 'Jangan Menilai React Native dari Satu Emulator',
      text: 'Emulator dan Expo Go cukup untuk belajar, tetapi tidak mewakili performa, izin, notifikasi, kamera, dan perilaku keyboard di perangkat nyata. Sejak bab awal, biasakan menguji di ponsel fisik. Jika kamu hanya punya Android, pelajari Android lebih dulu, lalu pahami perbedaan iOS dari dokumentasi dan pengujian orang lain.'
    },
    {
      type: 'text',
      html: '<h3>TypeScript yang Ketat Sejak Hari Pertama</h3><p>Aktifkan <code>strict</code> di <code>tsconfig.json</code>. Untuk aplikasi mobile, tipe yang baik bukan sekadar menghilangkan garis merah: ia mencegah bug yang mahal, seperti membaca <code>expense.amount</code> ketika response API ternyata mengirim string, atau mengirim <code>undefined</code> ke parameter navigasi.</p><p>Mulai dari empat model inti: <b>User</b>, <b>Expense</b>, <b>Category</b>, dan <b>ApiResponse</b>. Pisahkan tipe <i>domain</i> (yang dipakai UI) dari tipe <i>DTO</i> (bentuk mentah API). Pemisahan ini memungkinkan validasi dan normalisasi di satu tempat.</p>'
    },
    {
      type: 'example',
      title: 'Model domain Kantong',
      lang: 'ts',
      output: false,
      code: `// src/types/domain.ts
export type CategoryId = 'food' | 'transport' | 'bills' | 'fun' | 'other';

export interface Category {
  id: CategoryId;
  label: string;
  color: string;
}

export interface Expense {
  id: string;
  amount: number;        // rupiah, selalu bilangan bulat
  note: string;
  categoryId: CategoryId;
  spentAt: string;       // ISO 8601
  receiptUri?: string;
  latitude?: number;
  longitude?: number;
  syncState: 'local' | 'pending' | 'synced' | 'conflict';
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };`,
      explain: [
        '<code>amount</code> disimpan sebagai bilangan bulat rupiah agar tidak terkena pembulatan floating point. Format tampilan dilakukan di lapisan UI, bukan di data.',
        '<code>syncState</code> membuat status sinkronisasi terlihat oleh UI. Tanpa field ini, aplikasi offline cenderung menampilkan data seolah-olah sudah tersimpan di server.',
        '<code>Result</code> memaksa pemanggil menangani kegagalan. Ini lebih aman daripada melempar error string dan berharap ada yang menangkapnya.'
      ]
    },
    {
      type: 'example',
      title: 'Tipe DTO dan validasi batas sistem',
      lang: 'ts',
      output: false,
      code: `// src/types/api.ts
import type { CategoryId } from './domain';

/** Bentuk data mentah dari server; jangan dipakai langsung di komponen. */
export interface ExpenseDto {
  id: string;
  amount: number | string;
  note?: string | null;
  category_id: string;
  spent_at: string;
  receipt_url?: string | null;
}

export interface ApiEnvelope<T> {
  data: T;
  meta?: { page: number; total: number };
}

export function toExpense(dto: ExpenseDto) {
  const amount = typeof dto.amount === 'string'
    ? Number.parseInt(dto.amount, 10)
    : dto.amount;

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('Nominal pengeluaran tidak valid');
  }

  const allowed: CategoryId[] = ['food', 'transport', 'bills', 'fun', 'other'];
  const categoryId = allowed.includes(dto.category_id as CategoryId)
    ? (dto.category_id as CategoryId)
    : 'other';

  return {
    id: dto.id,
    amount,
    note: dto.note ?? '',
    categoryId,
    spentAt: new Date(dto.spent_at).toISOString(),
    receiptUri: dto.receipt_url ?? undefined,
    syncState: 'synced' as const
  };
}`,
      explain: [
        'Server bisa mengirim <code>amount</code> sebagai string. Tipe DTO mengakui kenyataan itu; fungsi pemetaan mengubahnya menjadi domain yang bersih.',
        'Kategori tak dikenal dipetakan ke <code>other</code> agar aplikasi tidak hancur ketika server menambah kategori baru sebelum aplikasi diperbarui.',
        'Aturan yang sama akan kita tegakkan dengan Zod saat membaca response jaringan di Bab 7.'
      ]
    },
    {
      type: 'tip',
      title: 'Aturan Tipe yang Akan Kamu Pakai Terus',
      text: 'Aktifkan <code>noUncheckedIndexedAccess</code> bila memungkinkan, hindari <code>any</code>, dan jangan memakai <code>as</code> untuk memaksa data dari jaringan. Tulis fungsi pemetaan seperti <code>toExpense</code> di atas. Satu fungsi kecil di batas sistem jauh lebih murah daripada memperbaiki crash di seluruh komponen.'
    },
    {
      type: 'text',
      html: '<h3>Praktik Mandiri</h3><ol><li>Buat folder proyek baru bernama <code>kantong</code> pada bab berikutnya, tetapi sebelum itu siapkan berkas <code>src/types/domain.ts</code> dan <code>src/types/api.ts</code> di folder latihan.</li><li>Tambahkan tipe <code>MonthlySummary</code> yang berisi <code>month</code>, <code>total</code>, dan <code>byCategory: Record&lt;CategoryId, number&gt;</code>.</li><li>Buat fungsi <code>formatRupiah(value: number): string</code> memakai <code>Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })</code>.</li><li>Jalankan <code>npx tsc --noEmit</code> dan pastikan tidak ada <code>any</code> yang bocor.</li></ol><p><b>Checkpoint:</b> kamu dapat menjelaskan mengapa <code>ExpenseDto</code> dan <code>Expense</code> tidak boleh disatukan. Jika belum, ulangi bagian DTO sebelum melanjutkan.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['React Native', 'Framework yang menjalankan React dan merender komponen native Android/iOS.'],
        ['Bridge', 'Mekanisme komunikasi asinkron antara JavaScript dan native pada arsitektur lama.'],
        ['New Architecture', 'Arsitektur React Native modern: JSI, Fabric, TurboModules, dan Codegen.'],
        ['JSI', 'JavaScript Interface; memungkinkan JavaScript memanggil fungsi native secara langsung.'],
        ['Fabric', 'Renderer React Native pada New Architecture.'],
        ['TurboModule', 'Modul native yang dimuat secara lazy dan bertipe.'],
        ['Hermes', 'Mesin JavaScript ringan yang dioptimalkan untuk React Native.'],
        ['Metro', 'Bundler resmi React Native untuk JavaScript dan aset.'],
        ['Expo', 'Toolkit dan platform modul di atas React Native, termasuk EAS dan OTA.'],
        ['Bare workflow', 'Proyek React Native dengan folder android/ios yang dikelola sendiri.'],
        ['DTO', 'Data Transfer Object; bentuk data mentah dari API yang belum tentu sama dengan model UI.'],
        ['Type narrowing', 'Proses TypeScript mempersempit tipe berdasarkan pengecekan runtime.']
      ]
    }
  ],
  recap: [
    'React Native merender komponen native; JavaScript tetap menangani logika dan state.',
    'JS thread, UI thread, Hermes, dan Metro berperan berbeda saat aplikasi berjalan.',
    'Expo adalah pilihan awal yang lebih cepat; bare workflow dipilih saat ada kebutuhan native spesifik.',
    'TypeScript strict dan pemisahan domain/DTO mencegah bug data sejak batas sistem.',
    'Aplikasi contoh Kantong akan dipakai konsisten dari fondasi sampai rilis produksi.'
  ]
});
