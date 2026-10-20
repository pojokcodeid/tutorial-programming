-- Migrasi untuk product-service (kepemilikan: product-service saja).
CREATE DATABASE IF NOT EXISTS product_db;
CREATE USER IF NOT EXISTS 'product_svc'@'%' IDENTIFIED BY 'product-local';
GRANT ALL PRIVILEGES ON product_db.* TO 'product_svc'@'%';

USE product_db;

CREATE TABLE IF NOT EXISTS products (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name        VARCHAR(120)    NOT NULL,
    category    VARCHAR(60)     NOT NULL DEFAULT 'umum',
    price       INT UNSIGNED    NOT NULL,
    stock       INT UNSIGNED    NOT NULL DEFAULT 0,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_products_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data awal supaya tampilan langsung terisi saat pertama kali dijalankan.
INSERT INTO products (name, category, price, stock) VALUES
    ('Kopi Arabika Gayo', 'minuman', 85000, 40),
    ('Teh Melati Premium', 'minuman', 32000, 75),
    ('Keripik Singkong Balado', 'makanan', 18000, 120),
    ('Cokelat Batang 70%', 'makanan', 45000, 30),
    ('Air Mineral 600ml', 'minuman', 4000, 500);
