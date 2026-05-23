-- =============================================================
--  Campus Lost & Found — Database Schema
--  MySQL 8.0+
--
--  Setup:
--    mysql -u root -p < database/schema.sql
--
--  First admin account:
--    1. Register normally through the app
--    2. Then run:
--       UPDATE users SET role = 'admin' WHERE username = 'your_username';
-- =============================================================

CREATE DATABASE IF NOT EXISTS campus_lost_found
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE campus_lost_found;

-- ─────────────────────────────────────────
--  USERS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  username   VARCHAR(50)     NOT NULL,
  email      VARCHAR(100)    NOT NULL,
  password   VARCHAR(255)    NOT NULL,        -- bcrypt hash (60 chars)
  role       ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_username (username),
  UNIQUE KEY uq_email    (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ─────────────────────────────────────────
--  ITEMS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS items (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  title       VARCHAR(150)    NOT NULL,
  description TEXT            NOT NULL,
  category    VARCHAR(80)     NOT NULL,
  type        ENUM('lost','found') NOT NULL,
  location    VARCHAR(200)    NOT NULL,
  image_url   VARCHAR(500)        NULL DEFAULT NULL,
  reported_by INT UNSIGNED    NOT NULL,
  status      ENUM('pending','approved','claimed') NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  -- browsing & filtering
  INDEX idx_status     (status),
  INDEX idx_type       (type),
  INDEX idx_created_at (created_at),

  CONSTRAINT fk_items_user
    FOREIGN KEY (reported_by) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ─────────────────────────────────────────
--  CLAIMS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS claims (
  id         INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  item_id    INT UNSIGNED    NOT NULL,
  user_id    INT UNSIGNED    NOT NULL,
  message    TEXT            NOT NULL,
  status     ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  -- one claim per user per item
  UNIQUE KEY uq_claim_per_user (item_id, user_id),

  -- dashboard queries
  INDEX idx_claims_user    (user_id),
  INDEX idx_claims_created (created_at),

  CONSTRAINT fk_claims_item
    FOREIGN KEY (item_id) REFERENCES items (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_claims_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
