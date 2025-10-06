-- Database Schema Update: Add Tree Count Field
-- This script adds a tree_count field to the lands table and creates the plant_types table if it doesn't exist

USE land_management;

-- Create plant_types table if it doesn't exist
CREATE TABLE IF NOT EXISTS plant_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    harvest_cycle_days INT DEFAULT NULL,
    requires_tree_count BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Create categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Add tree_count field to lands table if it doesn't exist
ALTER TABLE lands 
ADD COLUMN IF NOT EXISTS tree_count INT DEFAULT NULL COMMENT 'Number of trees (required for Palm Oil)';

-- Update lands table structure to use foreign keys if not already done
-- Check if plant_type_id column exists, if not add it
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'lands' 
     AND COLUMN_NAME = 'plant_type_id') = 0,
    'ALTER TABLE lands ADD COLUMN plant_type_id INT DEFAULT NULL AFTER plant_type',
    'SELECT "plant_type_id column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if category_id column exists, if not add it
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'lands' 
     AND COLUMN_NAME = 'category_id') = 0,
    'ALTER TABLE lands ADD COLUMN category_id INT DEFAULT NULL AFTER category',
    'SELECT "category_id column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add other missing columns if they don't exist
ALTER TABLE lands 
ADD COLUMN IF NOT EXISTS plant_date DATE DEFAULT NULL COMMENT 'Date when plants were planted',
ADD COLUMN IF NOT EXISTS harvest_cycle_days INT DEFAULT NULL COMMENT 'Harvest cycle in days',
ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255) DEFAULT NULL COMMENT 'Land owner name',
ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL COMMENT 'Additional notes',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE COMMENT 'Whether the land record is active';

-- Add foreign key constraints if they don't exist
-- Note: These will fail if the constraints already exist, which is expected
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'lands' 
     AND CONSTRAINT_NAME = 'fk_lands_plant_type') = 0,
    'ALTER TABLE lands ADD CONSTRAINT fk_lands_plant_type FOREIGN KEY (plant_type_id) REFERENCES plant_types(id) ON DELETE SET NULL',
    'SELECT "plant_type foreign key already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'lands' 
     AND CONSTRAINT_NAME = 'fk_lands_category') = 0,
    'ALTER TABLE lands ADD CONSTRAINT fk_lands_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL',
    'SELECT "category foreign key already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Insert default plant types if they don't exist
INSERT IGNORE INTO plant_types (name, description, harvest_cycle_days, requires_tree_count, created_by) VALUES 
('Rice', 'Rice cultivation', 120, FALSE, 1),
('Corn', 'Maize cultivation', 90, FALSE, 1),
('Palm Oil', 'Oil palm cultivation', 1095, TRUE, 1),
('Rubber', 'Rubber tree cultivation', 2555, TRUE, 1),
('Coffee', 'Coffee cultivation', 1095, TRUE, 1),
('Tea', 'Tea cultivation', 365, FALSE, 1),
('Vegetables', 'Mixed vegetable cultivation', 60, FALSE, 1),
('Fruits', 'Mixed fruit cultivation', 365, TRUE, 1);

-- Insert default categories if they don't exist
INSERT IGNORE INTO categories (name, description, color, created_by) VALUES 
('Agriculture', 'Agricultural land use', '#10B981', 1),
('Plantation', 'Large scale plantation', '#F59E0B', 1),
('Smallholding', 'Small scale farming', '#3B82F6', 1),
('Research', 'Research and development', '#8B5CF6', 1),
('Conservation', 'Conservation area', '#059669', 1);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lands_tree_count ON lands(tree_count);
CREATE INDEX IF NOT EXISTS idx_lands_plant_type_id ON lands(plant_type_id);
CREATE INDEX IF NOT EXISTS idx_lands_category_id ON lands(category_id);
CREATE INDEX IF NOT EXISTS idx_lands_is_active ON lands(is_active);
CREATE INDEX IF NOT EXISTS idx_plant_types_requires_tree_count ON plant_types(requires_tree_count);
CREATE INDEX IF NOT EXISTS idx_plant_types_is_active ON plant_types(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- Update existing lands to set is_active = TRUE if NULL
UPDATE lands SET is_active = TRUE WHERE is_active IS NULL;

-- Migration: Update existing plant_types table if it has scientific_name column
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

-- Migration: Make harvest_cycle_days nullable if it exists and is NOT NULL
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

COMMIT;
