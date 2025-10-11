-- Migration: Remove harvest_cycle_days from lands table
-- Since harvest_cycle_days is already available in plant_types table
-- Generated at: 2025-01-27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;

-- Remove harvest_cycle_days column from lands table
ALTER TABLE `lands` DROP COLUMN IF EXISTS `harvest_cycle_days`;

COMMIT;
