-- Migration: Add metadata and missing columns to notifications table
-- This allows storing additional information about notifications
-- Generated: 2025-10-18

USE land_management;

-- Add missing columns to notifications table
-- Add metadata column
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS metadata JSON NULL 
COMMENT 'Additional metadata for notification (harvest info, work info, etc.)'
AFTER message;

-- Update type enum to include new notification types
ALTER TABLE notifications 
MODIFY COLUMN type enum(
    'harvest_due',
    'harvest_overdue',
    'maintenance_due',
    'comment_added',
    'photo_added',
    'harvest',
    'work_assigned',
    'work_completed',
    'general'
) NOT NULL DEFAULT 'general';

-- Add is_active column if it doesn't exist
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS is_active tinyint(1) DEFAULT 1
COMMENT 'Whether this notification is active'
AFTER is_dismissed;

-- Add status column if it doesn't exist
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS status enum(
    'pending',
    'in_progress',
    'completed',
    'dismissed'
) DEFAULT 'pending'
COMMENT 'Current status of the notification'
AFTER is_active;

-- Add created_by column if it doesn't exist
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS created_by int(11) DEFAULT NULL
COMMENT 'User who created the notification (NULL for system-generated)'
AFTER user_id;

-- Add foreign key for created_by if it doesn't exist
SET @fk_exists = (
    SELECT COUNT(*) 
    FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = 'land_management' 
    AND TABLE_NAME = 'notifications' 
    AND CONSTRAINT_NAME = 'notifications_created_by_fk'
);

SET @sql = IF(@fk_exists = 0,
    'ALTER TABLE notifications ADD CONSTRAINT notifications_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL',
    'SELECT "Foreign key already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index on land_id and type for faster notification queries
-- Note: MariaDB doesn't support functional indexes on JSON expressions
-- We'll create standard indexes instead
CREATE INDEX IF NOT EXISTS idx_notifications_land_type ON notifications(land_id, type);
CREATE INDEX IF NOT EXISTS idx_notifications_type_priority ON notifications(type, priority);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_active ON notifications(is_active, created_at);

-- Update existing notifications to have empty metadata
UPDATE notifications SET metadata = JSON_OBJECT() WHERE metadata IS NULL;

-- Migration complete
SELECT 'Metadata and other columns added to notifications table successfully' as status;

