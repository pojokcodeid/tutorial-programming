-- Migrasi untuk notification-service (kepemilikan: notification-service saja).
CREATE DATABASE IF NOT EXISTS notification_db;
CREATE USER IF NOT EXISTS 'notification_svc'@'%' IDENTIFIED BY 'notification-local';
GRANT ALL PRIVILEGES ON notification_db.* TO 'notification_svc'@'%';

USE notification_db;

CREATE TABLE IF NOT EXISTS notifications (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    event_id    VARCHAR(64)     NOT NULL,
    order_id    BIGINT UNSIGNED NOT NULL,
    customer    VARCHAR(120)    NOT NULL,
    message     VARCHAR(255)    NOT NULL,
    is_read     TINYINT(1)      NOT NULL DEFAULT 0,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_notifications_event (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
