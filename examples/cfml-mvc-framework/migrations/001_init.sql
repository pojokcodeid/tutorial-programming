-- Skema database untuk proyek contoh framework MVC Lucee
-- Jalankan dengan: mysql -u root -p latihan < migrations/001_init.sql

CREATE TABLE IF NOT EXISTS personal (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(100) NOT NULL,
    age        INT          NOT NULL,
    attachment VARCHAR(255) NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Contoh data awal
INSERT INTO personal (name, email, age) VALUES
    ('Budi Santoso', 'budi@example.com', 30),
    ('Siti Aminah',  'siti@example.com',  26);
