-- Skema MySQL / MariaDB untuk aplikasi Todo App (referensi).
-- Dijalankan otomatis oleh internal/repository/mysql saat aplikasi dibuka.
--
-- Buat database & user terlebih dahulu:
--   CREATE DATABASE todo_app CHARACTER SET utf8mb4;
--   CREATE USER 'todo'@'localhost' IDENTIFIED BY 'rahasia';
--   GRANT ALL ON todo_app.* TO 'todo'@'localhost';

CREATE TABLE IF NOT EXISTS todos (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    title      VARCHAR(120) NOT NULL,
    note       TEXT         NOT NULL,
    category   VARCHAR(40)  NOT NULL DEFAULT 'Umum',
    priority   VARCHAR(10)  NOT NULL DEFAULT 'sedang',
    done       TINYINT(1)   NOT NULL DEFAULT 0,
    created_at TEXT         NOT NULL,        -- RFC3339, mis. 2026-10-18T09:30:00Z
    updated_at TEXT         NOT NULL,
    KEY idx_todos_done (done)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
