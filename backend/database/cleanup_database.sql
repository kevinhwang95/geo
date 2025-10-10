-- Database Cleanup Script
-- This script safely removes all tables and views in the correct order
-- based on foreign key dependencies
-- Generated at: 2025-10-10 02:10:00

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- Drop Views First (they don't have foreign key constraints)
-- --------------------------------------------------------

DROP VIEW IF EXISTS `v_dashboard_notifications`;
DROP VIEW IF EXISTS `v_lands_detailed`;

-- --------------------------------------------------------
-- Drop Tables in Reverse Dependency Order
-- --------------------------------------------------------

-- Drop tables with foreign keys to other tables (dependent tables first)

-- Work assignments table (references lands, teams, users)
DROP TABLE IF EXISTS `work_assignments`;

-- Team members table (references teams, users)
DROP TABLE IF EXISTS `team_members`;

-- Notification logs table (references users)
DROP TABLE IF EXISTS `notification_logs`;

-- Email template translations table (references users)
DROP TABLE IF EXISTS `email_template_translations`;

-- Email templates table (references users)
DROP TABLE IF EXISTS `email_templates`;

-- Photos table (references notifications)
DROP TABLE IF EXISTS `photos`;

-- Land photos table (references land_comments, lands, users)
DROP TABLE IF EXISTS `land_photos`;

-- Land comments table (references lands, users)
DROP TABLE IF EXISTS `land_comments`;

-- Notifications table (references lands, users)
DROP TABLE IF EXISTS `notifications`;

-- OAuth tokens table (references users)
DROP TABLE IF EXISTS `oauth_tokens`;

-- Password tokens table (references users)
DROP TABLE IF EXISTS `password_tokens`;

-- Navigation menu permissions table (references navigation_menus)
DROP TABLE IF EXISTS `navigation_menu_permissions`;

-- Endpoint role permissions table (references endpoint_permissions)
DROP TABLE IF EXISTS `endpoint_role_permissions`;

-- Lands table (references plant_types, categories, users)
DROP TABLE IF EXISTS `lands`;

-- Plant types table (references users)
DROP TABLE IF EXISTS `plant_types`;

-- Categories table (references users)
DROP TABLE IF EXISTS `categories`;

-- Teams table (references users)
DROP TABLE IF EXISTS `teams`;

-- Drop core tables (referenced by others)

-- Navigation menus table
DROP TABLE IF EXISTS `navigation_menus`;

-- Endpoint permissions table
DROP TABLE IF EXISTS `endpoint_permissions`;

-- Supported languages table
DROP TABLE IF EXISTS `supported_languages`;

-- Schema migrations table
DROP TABLE IF EXISTS `schema_migrations`;

-- Users table (referenced by most other tables)
DROP TABLE IF EXISTS `users`;

-- --------------------------------------------------------
-- Reset Foreign Key Checks
-- --------------------------------------------------------

SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------
-- Verification Queries (uncomment to verify cleanup)
-- --------------------------------------------------------

-- Show remaining tables (should be empty after cleanup)
-- SHOW TABLES;

-- Show remaining views (should be empty after cleanup)
-- SHOW FULL TABLES WHERE Table_type = 'VIEW';

-- Show foreign key constraints (should be empty after cleanup)
-- SELECT 
--     TABLE_NAME,
--     COLUMN_NAME,
--     CONSTRAINT_NAME,
--     REFERENCED_TABLE_NAME,
--     REFERENCED_COLUMN_NAME
-- FROM information_schema.KEY_COLUMN_USAGE 
-- WHERE TABLE_SCHEMA = DATABASE() 
-- AND REFERENCED_TABLE_NAME IS NOT NULL;


