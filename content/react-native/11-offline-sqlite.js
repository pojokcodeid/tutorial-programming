/* ============================================================
   Pelajaran React Native — Bab 11: Database Lokal & Offline-First
   ============================================================ */
'use strict';

window.REACTNATIVE_LESSONS = window.REACTNATIVE_LESSONS || [];

window.REACTNATIVE_LESSONS.push({
  id: 'rn-offline-sqlite',
  title: 'SQLite, Offline-First, dan Sinkronisasi Data',
  chapter: 'Data & Perangkat',
  duration: '32 menit',
  intro: [
    'Pengguna mobile tidak selalu online. Mereka mencatat pengeluaran di lift, di pesawat, atau di daerah tanpa sinyal. Aplikasi yang menampilkan layar error setiap kali jaringan putus akan ditinggalkan, meskipun API-nya cepat ketika online.',
    '<b>Offline-first</b> berarti perangkat menjadi sumber data utama untuk pengalaman pengguna, lalu sinkronisasi berjalan di latar belakang. Ini bukan sekadar menyimpan response API ke cache; kamu perlu database lokal, antrean perubahan, dan aturan penyelesaian konflik.',
    'Bab ini membangun database SQLite Kantong, migrasi versi, operasi CRUD, dan <b>outbox</b> untuk mengirim perubahan saat jaringan kembali. Kita juga membahas batas realistis: tidak semua aplikasi membutuhkan sinkronisasi dua arah.'
  ],
  objectives: [
    'Memilih AsyncStorage, SecureStore, SQLite, atau FileSystem sesuai data',
    'Membuat skema SQLite dan migrasi yang aman',
    'Menerapkan CRUD dengan transaksi dan indeks',
    'Membangun outbox untuk sinkronisasi offline',
    'Menangani idempotency, konflik, dan data yang dihapus'
  ],
  sections: [
    {
      type: 'text',
      html: '<h3>Pilih Penyimpanan Berdasarkan Bentuk Data</h3><table class="vocab"><tr><th>Kebutuhan</th><th>Pilihan</th><th>Contoh</th></tr><tr><td>Preferensi kecil</td><td>AsyncStorage</td><td>Tema, filter terakhir</td></tr><tr><td>Rahasia</td><td>SecureStore</td><td>Refresh token</td></tr><tr><td>Data terstruktur & query</td><td>SQLite</td><td>Pengeluaran, kategori, antrean sync</td></tr><tr><td>Berkas besar</td><td>FileSystem</td><td>Foto struk, ekspor CSV</td></tr><tr><td>Cache response sementara</td><td>TanStack Query persister</td><td>Daftar terakhir</td></tr></table><p>Jangan memakai AsyncStorage untuk daftar ribuan item lalu memfilternya di JavaScript. SQLite memberi indeks, transaksi, dan query yang jauh lebih efisien.</p>'
    },
    {
      type: 'example',
      title: 'Membuka database dan menjalankan migrasi',
      lang: 'ts',
      output: false,
      code: `// src/db/database.ts
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'kantong.db';
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb() {
  if (!dbPromise) dbPromise = openAndMigrate();
  return dbPromise;
}

async function openAndMigrate() {
  const db = await SQLite.openDatabaseAsync(DB_NAME);

  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  if (current < 1) {
    await db.execAsync(\`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY NOT NULL,
        amount INTEGER NOT NULL CHECK (amount >= 0),
        note TEXT NOT NULL DEFAULT '',
        category_id TEXT NOT NULL,
        spent_at TEXT NOT NULL,
        receipt_uri TEXT,
        latitude REAL,
        longitude REAL,
        sync_state TEXT NOT NULL DEFAULT 'local',
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_expenses_spent_at
        ON expenses (spent_at DESC);
      CREATE INDEX IF NOT EXISTS idx_expenses_sync_state
        ON expenses (sync_state);

      CREATE TABLE IF NOT EXISTS outbox (
        id TEXT PRIMARY KEY NOT NULL,
        entity TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        payload TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        attempts INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_outbox_status
        ON outbox (status, created_at);

      PRAGMA user_version = 1;
    \`);
  }

  if (current < 2) {
    await db.execAsync(\`
      ALTER TABLE expenses ADD COLUMN server_id TEXT;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_expenses_server_id
        ON expenses (server_id) WHERE server_id IS NOT NULL;
      PRAGMA user_version = 2;
    \`);
  }

  return db;
}`,
      explain: [
        'Database dibuka sekali dan disimpan sebagai promise agar beberapa pemanggil tidak membuka koneksi bersamaan.',
        '<code>user_version</code> adalah cara ringan menyimpan versi skema. Setiap migrasi harus idempoten dan tidak menghapus data pengguna.',
        '<code>WAL</code> meningkatkan konkurensi baca/tulis. <code>foreign_keys</code> harus diaktifkan per koneksi.',
        'Jangan menjalankan <code>ALTER TABLE</code> yang sama dua kali. Selalu naikkan versi setelah migrasi berhasil.'
      ]
    },
    {
      type: 'example',
      title: 'Repository dengan transaksi dan pemetaan',
      lang: 'ts',
      output: false,
      code: `// src/db/expenseRepository.ts
import * as Crypto from 'expo-crypto';
import { getDb } from './database';
import type { Expense } from '@/types/domain';

type ExpenseRow = {
  id: string; amount: number; note: string; category_id: string;
  spent_at: string; receipt_uri: string | null; latitude: number | null;
  longitude: number | null; sync_state: Expense['syncState'];
};

function toDomain(row: ExpenseRow): Expense {
  return {
    id: row.id,
    amount: row.amount,
    note: row.note,
    categoryId: row.category_id as Expense['categoryId'],
    spentAt: row.spent_at,
    receiptUri: row.receipt_uri ?? undefined,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    syncState: row.sync_state,
  };
}

export async function listLocalExpenses(limit = 50): Promise<Expense[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ExpenseRow>(
    \`SELECT * FROM expenses
     WHERE deleted_at IS NULL
     ORDER BY spent_at DESC
     LIMIT ?\`,
    [limit],
  );
  return rows.map(toDomain);
}

export async function insertLocalExpense(
  input: Omit<Expense, 'id' | 'syncState'>,
): Promise<Expense> {
  const db = await getDb();
  const expense: Expense = {
    ...input,
    id: Crypto.randomUUID(),
    syncState: 'local',
  };

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      \`INSERT INTO expenses
        (id, amount, note, category_id, spent_at, receipt_uri,
         latitude, longitude, sync_state, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`,
      [
        expense.id, expense.amount, expense.note, expense.categoryId,
        expense.spentAt, expense.receiptUri ?? null,
        expense.latitude ?? null, expense.longitude ?? null,
        expense.syncState, new Date().toISOString(),
      ],
    );

    await db.runAsync(
      \`INSERT INTO outbox (id, entity, entity_id, operation, payload, created_at)
       VALUES (?, 'expense', ?, 'create', ?, ?)\`,
      [Crypto.randomUUID(), expense.id, JSON.stringify(expense), new Date().toISOString()],
    );
  });

  return expense;
}`,
      explain: [
        'Insert data dan outbox berada dalam satu transaksi. Jika salah satu gagal, keduanya dibatalkan sehingga tidak ada data tanpa antrean sync.',
        'Gunakan parameter <code>?</code>, jangan menyusun SQL dengan template string dari input pengguna. Ini mencegah SQL injection.',
        'Kolom <code>updated_at</code> dipakai untuk menyelesaikan konflik. <code>deleted_at</code> adalah tombstone agar penghapusan bisa dikirim ke server.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Outbox: Antrean Perubahan</h3><p>Outbox mencatat operasi yang belum dikirim. Saat jaringan tersedia, worker mengambil item paling lama, mengirimnya, lalu menandainya selesai. Bila gagal karena jaringan, item dibiarkan. Bila gagal karena validasi server, item dipindahkan ke status <code>failed</code> agar tidak mencoba selamanya.</p><p>Setiap operasi harus memiliki <b>idempotency key</b>. Jika response server hilang setelah data tersimpan, percobaan ulang tidak boleh membuat duplikat. Server dapat memakai <code>id</code> klien atau header <code>Idempotency-Key</code> untuk mengenali permintaan yang sama.</p>'
    },
    {
      type: 'example',
      title: 'Worker sinkronisasi sederhana',
      lang: 'ts',
      output: false,
      code: `// src/db/sync.ts
import { getDb } from './database';
import { authorizedRequest } from '@/services/authorizedRequest';

type OutboxRow = {
  id: string; entity_id: string; operation: string; payload: string;
  attempts: number;
};

export async function flushOutbox(): Promise<{ sent: number; failed: number }> {
  const db = await getDb();
  const items = await db.getAllAsync<OutboxRow>(
    \`SELECT * FROM outbox
     WHERE status = 'pending' AND attempts < 5
     ORDER BY created_at ASC LIMIT 20\`,
  );

  let sent = 0;
  let failed = 0;

  for (const item of items) {
    try {
      await authorizedRequest('/expenses', {
        method: 'POST',
        headers: { 'Idempotency-Key': item.id },
        body: item.payload,
      });

      await db.withTransactionAsync(async () => {
        await db.runAsync("UPDATE outbox SET status = 'done' WHERE id = ?", [item.id]);
        await db.runAsync(
          "UPDATE expenses SET sync_state = 'synced' WHERE id = ?",
          [item.entity_id],
        );
      });
      sent += 1;
    } catch (error) {
      failed += 1;
      const nextAttempts = item.attempts + 1;
      await db.runAsync(
        \`UPDATE outbox
         SET attempts = ?, status = CASE WHEN ? >= 5 THEN 'failed' ELSE 'pending' END
         WHERE id = ?\`,
        [nextAttempts, nextAttempts, item.id],
      );
      if (nextAttempts >= 5) {
        // Catat ke log/telemetry untuk diperiksa manusia.
      }
    }
  }

  return { sent, failed };
}`,
      explain: [
        'Worker memproses batch kecil agar tidak memblokir UI terlalu lama. Untuk antrean besar, jalankan di background task atau bertahap.',
        '<code>Idempotency-Key</code> mencegah duplikasi saat response hilang dan item dikirim ulang.',
        'Kegagalan validasi tidak boleh diulang selamanya. Batasi percobaan dan tandai <code>failed</code> agar bisa ditangani.',
        'Setelah sukses, status lokal dan outbox diperbarui dalam satu transaksi.'
      ]
    },
    {
      type: 'text',
      html: '<h3>Konflik: Siapa yang Menang?</h3><p>Konflik terjadi ketika data yang sama diubah di dua tempat. Strategi sederhana: <b>last-write-wins</b> berdasarkan <code>updated_at</code> server. Strategi ini mudah, tetapi bisa menghilangkan perubahan pengguna. Untuk data penting, gunakan <b>version</b> atau <b>field-level merge</b>.</p><p>Penghapusan juga harus disinkronkan. Jika baris langsung dihapus, server tidak tahu apa yang harus dihapus. Gunakan <code>deleted_at</code> (tombstone), kirim operasi delete, lalu bersihkan tombstone setelah server mengonfirmasi.</p>'
    },
    {
      type: 'warn',
      title: 'Offline-First Bukan Sihir',
      text: 'Sinkronisasi dua arah menambah outbox, idempotency, konflik, tombstones, dan pengujian jaringan. Jika aplikasi hanya menampilkan katalog yang boleh basi, cache read-only sudah cukup. Jangan membangun mesin sinkronisasi penuh untuk data yang tidak pernah diubah pengguna. Mulai dari kebutuhan nyata: baca offline, tulis offline, atau keduanya?'
    },
    {
      type: 'tip',
      title: 'Uji dengan Skenario Bukan Hanya Tombol',
      text: 'Uji: catat saat offline, tutup paksa aplikasi, buka kembali, lalu sambungkan jaringan. Uji dua perangkat mengubah data yang sama. Uji server menerima data dua kali dengan idempotency key yang sama. Uji penghapusan saat offline. Skrip pengujian ini lebih berharga daripada menambah fitur baru.'
    },
    {
      type: 'text',
      html: '<h3>Praktik Mandiri</h3><ol><li>Pasang <code>expo-sqlite</code> dengan <code>npx expo install expo-sqlite</code>.</li><li>Buat tabel <code>expenses</code> dan <code>outbox</code>, lalu jalankan migrasi dari versi 0 ke 2.</li><li>Tambahkan, baca, ubah, dan hapus pengeluaran secara lokal. Pastikan daftar langsung berubah.</li><li>Matikan jaringan, catat tiga pengeluaran, lalu nyalakan jaringan. Jalankan <code>flushOutbox</code> dan periksa status sync.</li><li>Kirim item yang sama dua kali dan pastikan server tidak membuat duplikat.</li></ol><p><b>Checkpoint:</b> data bertahan setelah aplikasi ditutup paksa, outbox tidak mengirim item sukses dua kali, dan penghapusan tersinkronisasi lewat tombstone.</p>'
    },
    {
      type: 'vocab',
      items: [
        ['Offline-first', 'Pendekatan yang mengutamakan data lokal dan menyinkronkan saat memungkinkan.'],
        ['SQLite', 'Database relasional tertanam yang berjalan di perangkat.'],
        ['Migrasi', 'Perubahan skema database yang berurutan dan tercatat versinya.'],
        ['Transaksi', 'Sekumpulan operasi database yang berhasil atau gagal bersama.'],
        ['Outbox', 'Tabel antrean operasi lokal yang belum dikirim ke server.'],
        ['Idempotency key', 'Nilai unik yang mencegah operasi yang sama diproses dua kali.'],
        ['Tombstone', 'Penanda penghapusan agar bisa disinkronkan.'],
        ['Last-write-wins', 'Strategi konflik yang memilih perubahan terbaru.'],
        ['WAL', 'Write-Ahead Logging; mode SQLite untuk konkurensi lebih baik.'],
        ['Index', 'Struktur database untuk mempercepat query tertentu.'],
        ['Sync state', 'Status data lokal: local, pending, synced, conflict, atau failed.'],
        ['Background task', 'Pekerjaan yang berjalan saat aplikasi tidak di depan, dengan batasan platform.']
      ]
    }
  ],
  recap: [
    'Pilih storage sesuai bentuk data: preferensi, rahasia, data terstruktur, atau berkas.',
    'SQLite membutuhkan skema, migrasi berversi, transaksi, dan indeks.',
    'Outbox mencatat perubahan lokal dan mengirimnya saat jaringan tersedia.',
    'Idempotency key mencegah duplikasi saat retry.',
    'Konflik dan penghapusan harus dirancang sejak awal, bukan ditambal belakangan.'
  ]
});
