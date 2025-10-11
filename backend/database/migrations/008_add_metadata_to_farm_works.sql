-- Migration: Add metadata column to farm_works table
-- This allows storing additional information about farm works, including creation source
-- Generated: 2024-01-XX

USE land_management;

-- Add metadata column to farm_works table
ALTER TABLE farm_works 
ADD COLUMN metadata JSON NULL 
COMMENT 'Additional metadata for farm work (creation source, cycle info, etc.)'
AFTER completed_date;

-- Add index for JSON queries on metadata
CREATE INDEX idx_farm_works_metadata ON farm_works((CAST(metadata->>'$.created_from' AS CHAR(50))));

-- Update existing farm works to have empty metadata
UPDATE farm_works SET metadata = JSON_OBJECT() WHERE metadata IS NULL;

-- Migration complete
SELECT 'Metadata column added to farm_works table successfully' as status;



