-- Migrasi untuk order-service (kepemilikan: order-service saja).
CREATE DATABASE IF NOT EXISTS order_db;
CREATE USER IF NOT EXISTS 'order_svc'@'%' IDENTIFIED BY 'order-local';
GRANT ALL PRIVILEGES ON order_db.* TO 'order_svc'@'%';

USE order_db;

CREATE TABLE IF NOT EXISTS orders (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    idempotency_key VARCHAR(64)     NOT NULL,
    product_id      BIGINT UNSIGNED NOT NULL,
    product_name    VARCHAR(120)    NOT NULL,
    unit_price      INT UNSIGNED    NOT NULL,
    qty             INT UNSIGNED    NOT NULL,
    total           INT UNSIGNED    NOT NULL,
    customer        VARCHAR(120)    NOT NULL,
    status          VARCHAR(20)     NOT NULL DEFAULT 'confirmed',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_orders_idempotency (idempotency_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
