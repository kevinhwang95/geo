-- Consolidate Photo Tables Migration
-- This migration consolidates the 'photos' table into 'land_photos' table
-- and updates all references accordingly

-- --------------------------------------------------------
-- Step 1: Add notification_id column to land_photos table
-- --------------------------------------------------------
ALTER TABLE `land_photos` 
ADD COLUMN `notification_id` int(11) DEFAULT NULL AFTER `comment_id`,
ADD KEY `notification_id` (`notification_id`);

-- --------------------------------------------------------
-- Step 2: Migrate data from photos table to land_photos table
-- --------------------------------------------------------
INSERT INTO `land_photos` (
    `notification_id`,
    `land_id`,
    `user_id`,
    `filename`,
    `original_filename`,
    `file_path`,
    `file_size`,
    `mime_type`,
    `latitude`,
    `longitude`,
    `altitude`,
    `photo_timestamp`,
    `camera_info`,
    `is_active`,
    `created_at`,
    `updated_at`
)
SELECT 
    p.notification_id,
    COALESCE(n.land_id, 1) as land_id, -- Default to land_id 1 if notification doesn't have land_id
    COALESCE(n.user_id, 1) as user_id, -- Default to user_id 1 if notification doesn't have user_id
    p.file_name as filename,
    p.file_name as original_filename,
    p.file_path,
    p.file_size,
    p.mime_type,
    NULL as latitude, -- No GPS data in photos table
    NULL as longitude,
    NULL as altitude,
    p.uploaded_at as photo_timestamp,
    NULL as camera_info, -- No camera info in photos table
    1 as is_active,
    p.uploaded_at as created_at,
    p.uploaded_at as updated_at
FROM `photos` p
LEFT JOIN `notifications` n ON p.notification_id = n.id;

-- --------------------------------------------------------
-- Step 3: Add foreign key constraint for notification_id
-- --------------------------------------------------------
ALTER TABLE `land_photos` 
ADD CONSTRAINT `land_photos_ibfk_4` 
FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE;

-- --------------------------------------------------------
-- Step 4: Update any existing code references
-- Note: This step requires code changes, not just SQL
-- --------------------------------------------------------

-- --------------------------------------------------------
-- Step 5: Drop the old photos table
-- --------------------------------------------------------
DROP TABLE IF EXISTS `photos`;

-- --------------------------------------------------------
-- Step 6: Create view for backward compatibility (optional)
-- --------------------------------------------------------
CREATE OR REPLACE VIEW `v_notification_photos` AS
SELECT 
    lp.id,
    lp.notification_id,
    lp.file_path,
    lp.filename as file_name,
    lp.file_size,
    lp.mime_type,
    lp.created_at as uploaded_at,
    lp.land_id,
    lp.user_id,
    lp.latitude,
    lp.longitude,
    lp.altitude,
    lp.photo_timestamp,
    lp.camera_info,
    lp.is_active
FROM `land_photos` lp
WHERE lp.notification_id IS NOT NULL;

-- --------------------------------------------------------
-- Step 7: Update indexes for better performance
-- --------------------------------------------------------
CREATE INDEX `idx_land_photos_notification_id` ON `land_photos`(`notification_id`);
CREATE INDEX `idx_land_photos_land_id` ON `land_photos`(`land_id`);
CREATE INDEX `idx_land_photos_user_id` ON `land_photos`(`user_id`);
CREATE INDEX `idx_land_photos_comment_id` ON `land_photos`(`comment_id`);
CREATE INDEX `idx_land_photos_is_active` ON `land_photos`(`is_active`);

-- --------------------------------------------------------
-- Migration Complete
-- --------------------------------------------------------
-- The photos table has been successfully consolidated into land_photos
-- All notification photos now have GPS capability and rich metadata
-- Use the v_notification_photos view for backward compatibility if needed



