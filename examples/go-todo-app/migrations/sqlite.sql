-- Skema SQLite untuk aplikasi Todo App (referensi).
-- Salinan yang sama dieksekusi otomatis oleh internal/repository/sqlite
-- saat aplikasi dibuka, sehingga file ini murni dokumentasi/riwayat migrasi.

CREATE TABLE IF NOT EXISTS todos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT    NOT NULL,
    note       TEXT    NOT NULL DEFAULT '',
    category   TEXT    NOT NULL DEFAULT 'Umum',
    priority   TEXT    NOT NULL DEFAULT 'sedang',
    done       INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL,            -- RFC3339, mis. 2026-10-18T09:30:00Z
    updated_at TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_todos_done ON todos(done);
