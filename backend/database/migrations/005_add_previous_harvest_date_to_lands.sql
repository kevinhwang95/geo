-- Migration: Add previous_harvest_date column to lands table
-- This allows tracking when the last harvest occurred for calculating next harvest date
-- Generated: 2024-01-XX

USE land_management;

-- Add previous_harvest_date column to lands table
ALTER TABLE lands 
ADD COLUMN previous_harvest_date DATE NULL 
COMMENT 'Date of the last harvest - used to calculate next harvest date'
AFTER next_harvest_date;

-- Add index for better query performance on harvest date calculations
CREATE INDEX idx_lands_previous_harvest_date ON lands(previous_harvest_date);

-- Add index for combined harvest date queries
CREATE INDEX idx_lands_harvest_dates ON lands(previous_harvest_date, next_harvest_date);
