USE campus_lost_found;

CREATE TABLE IF NOT EXISTS images (
  id           INT           NOT NULL AUTO_INCREMENT,
  filename     VARCHAR(255)  NOT NULL,
  url          VARCHAR(500)  NOT NULL,
  uploaded_by  INT UNSIGNED  NOT NULL,  -- FIX: Added UNSIGNED to match users.id
  item_id      INT UNSIGNED      NULL DEFAULT NULL, -- FIX: Added UNSIGNED to match items.id
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_images_user (uploaded_by),
  INDEX idx_images_item (item_id),
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id)     REFERENCES items(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE users
  ADD COLUMN failed_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN locked_until    DATETIME         NULL DEFAULT NULL;

CREATE TABLE IF NOT EXISTS password_resets (
  id         INT          NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,  -- FIX: Added UNSIGNED to match users.id
  token      VARCHAR(64)  NOT NULL,
  expires_at DATETIME     NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_token (token),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;