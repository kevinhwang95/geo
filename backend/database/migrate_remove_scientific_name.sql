-- Migration Script: Remove scientific_name and make harvest_cycle_days nullable
-- This script is for existing databases that already have the plant_types table

USE land_management;

-- Remove scientific_name column if it exists
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'plant_types' 
     AND COLUMN_NAME = 'scientific_name') > 0,
    'ALTER TABLE plant_types DROP COLUMN scientific_name',
    'SELECT "scientific_name column does not exist"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Make harvest_cycle_days nullable if it exists and is NOT NULL
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'plant_types' 
     AND COLUMN_NAME = 'harvest_cycle_days'
     AND IS_NULLABLE = 'NO') > 0,
    'ALTER TABLE plant_types MODIFY COLUMN harvest_cycle_days INT DEFAULT NULL',
    'SELECT "harvest_cycle_days column already nullable or does not exist"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Show the updated table structure
DESCRIBE plant_types;

COMMIT;

