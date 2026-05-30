USE campus_lost_found;

ALTER TABLE users
  MODIFY COLUMN role ENUM('user','admin','superadmin') NOT NULL DEFAULT 'user';

CREATE TABLE IF NOT EXISTS ads (
  id          INT           NOT NULL AUTO_INCREMENT,
  title       VARCHAR(200)  NOT NULL,
  body        TEXT          NOT NULL,
  link_url    VARCHAR(500)  NULL DEFAULT NULL,
  image_url   VARCHAR(500)  NULL DEFAULT NULL,
  active      TINYINT(1)    NOT NULL DEFAULT 1,
  created_by  INT           NOT NULL,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
