-- Allow NULL land_id for work note photos
-- This migration modifies the land_photos table to allow NULL land_id
-- which is needed for work note photos that are not associated with specific lands

-- --------------------------------------------------------
-- Step 1: Modify land_id column to allow NULL values
-- --------------------------------------------------------
ALTER TABLE `land_photos` 
MODIFY COLUMN `land_id` int(11) DEFAULT NULL;

-- --------------------------------------------------------
-- Step 2: Update foreign key constraint to handle NULL values
-- --------------------------------------------------------
-- First, drop the existing foreign key constraint
ALTER TABLE `land_photos` 
DROP FOREIGN KEY `land_photos_ibfk_1`;

-- Recreate the foreign key constraint with proper NULL handling
ALTER TABLE `land_photos` 
ADD CONSTRAINT `land_photos_ibfk_1` 
FOREIGN KEY (`land_id`) REFERENCES `lands` (`id`) ON DELETE CASCADE;

-- --------------------------------------------------------
-- Step 3: Add index for better performance on NULL land_id queries
-- --------------------------------------------------------
CREATE INDEX `idx_land_photos_land_id_null` ON `land_photos`(`land_id`);

-- --------------------------------------------------------
-- Migration Complete
-- --------------------------------------------------------
-- The land_photos table now supports NULL land_id values
-- This allows work note photos to be stored without being tied to specific lands
-- Work note photos will have land_id = NULL
-- Land photos will continue to have land_id referencing the specific land


