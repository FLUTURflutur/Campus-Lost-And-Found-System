USE campus_lost_found;

ALTER TABLE claims ADD COLUMN rejection_reason TEXT NULL;
ALTER TABLE items  ADD COLUMN deleted_at       DATETIME NULL DEFAULT NULL;
ALTER TABLE items  MODIFY COLUMN status ENUM('pending','approved','claimed','resolved') NOT NULL DEFAULT 'pending';
