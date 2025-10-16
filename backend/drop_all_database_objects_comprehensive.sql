-- =====================================================
-- COMPREHENSIVE DROP ALL DATABASE OBJECTS SCRIPT
-- Generated for: land_management (migration-1016.sql)
-- Purpose: Safely drop all tables, views, and stored procedures
-- Based on: migration-1016.sql
-- =====================================================

-- Disable foreign key checks to avoid dependency issues
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- DROP VIEWS FIRST (they depend on tables)
-- =====================================================

DROP VIEW IF EXISTS `v_dashboard_notifications`;
DROP VIEW IF EXISTS `v_farm_works_detailed`;
DROP VIEW IF EXISTS `v_lands_detailed`;
DROP VIEW IF EXISTS `v_notification_photos`;
DROP VIEW IF EXISTS `v_team_workload_status`;

-- =====================================================
-- DROP TABLES (in reverse dependency order)
-- =====================================================

-- Work completion related tables (most dependent)
DROP TABLE IF EXISTS `work_completion_workers`;
DROP TABLE IF EXISTS `work_completion_photos`;
DROP TABLE IF EXISTS `work_completions`;
DROP TABLE IF EXISTS `work_note_photos`;
DROP TABLE IF EXISTS `work_note_reads`;
DROP TABLE IF EXISTS `work_notes`;
DROP TABLE IF EXISTS `work_status_audit`;

-- Farm works and work management tables
DROP TABLE IF EXISTS `farm_works`;
DROP TABLE IF EXISTS `work_assignments`;
DROP TABLE IF EXISTS `work_categories`;
DROP TABLE IF EXISTS `work_types`;
DROP TABLE IF EXISTS `work_statuses`;

-- Notification system tables
DROP TABLE IF EXISTS `notification_logs`;
DROP TABLE IF EXISTS `land_photos`;
DROP TABLE IF EXISTS `notifications`;

-- Team and user management tables
DROP TABLE IF EXISTS `team_members`;
DROP TABLE IF EXISTS `teams`;

-- Authentication and security tables
DROP TABLE IF EXISTS `oauth_tokens`;
DROP TABLE IF EXISTS `password_tokens`;

-- Permission and navigation system tables
DROP TABLE IF EXISTS `endpoint_role_permissions`;
DROP TABLE IF EXISTS `endpoint_permissions`;
DROP TABLE IF EXISTS `navigation_menu_permissions`;
DROP TABLE IF EXISTS `navigation_menus`;

-- Land management tables
DROP TABLE IF EXISTS `land_comments`;
DROP TABLE IF EXISTS `lands`;

-- Email and communication tables
DROP TABLE IF EXISTS `email_templates`;

-- System and configuration tables
DROP TABLE IF EXISTS `supported_languages`;
DROP TABLE IF EXISTS `schema_migrations`;

-- Plant and category management tables
DROP TABLE IF EXISTS `plant_types`;
DROP TABLE IF EXISTS `categories`;

-- Core user table (referenced by many others)
DROP TABLE IF EXISTS `users`;

-- =====================================================
-- DROP STORED PROCEDURES (if any exist)
-- =====================================================

-- Note: No stored procedures were found in the provided SQL file
-- Add any custom stored procedures here if they exist
-- Example:
-- DROP PROCEDURE IF EXISTS `procedure_name`;

-- =====================================================
-- DROP FUNCTIONS (if any exist)
-- =====================================================

-- Note: No custom functions were found in the provided SQL file
-- Add any custom functions here if they exist
-- Example:
-- DROP FUNCTION IF EXISTS `function_name`;

-- =====================================================
-- DROP TRIGGERS (if any exist)
-- =====================================================

-- Note: No triggers were found in the provided SQL file
-- Add any custom triggers here if they exist
-- Example:
-- DROP TRIGGER IF EXISTS `trigger_name`;

-- =====================================================
-- DROP EVENTS (if any exist)
-- =====================================================

-- Note: No events were found in the provided SQL file
-- Add any custom events here if they exist
-- Example:
-- DROP EVENT IF EXISTS `event_name`;

-- =====================================================
-- DROP INDEXES (if any custom indexes exist)
-- =====================================================

-- Note: Custom indexes will be dropped with their tables
-- Add any standalone indexes here if they exist
-- Example:
-- DROP INDEX IF EXISTS `index_name` ON `table_name`;

-- =====================================================
-- DROP TEMPORARY TABLES (if any exist)
-- =====================================================

-- Note: Temporary tables are automatically dropped when session ends
-- Add any temporary tables here if they exist
-- Example:
-- DROP TEMPORARY TABLE IF EXISTS `temp_table_name`;

-- =====================================================
-- RE-ENABLE FOREIGN KEY CHECKS
-- =====================================================

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Uncomment these to verify all objects have been dropped:

-- Show remaining tables
-- SHOW TABLES;

-- Show remaining views
-- SHOW FULL TABLES WHERE Table_type = 'VIEW';

-- Show remaining stored procedures
-- SHOW PROCEDURE STATUS WHERE Db = DATABASE();

-- Show remaining functions
-- SHOW FUNCTION STATUS WHERE Db = DATABASE();

-- Show remaining triggers
-- SHOW TRIGGERS;

-- Show remaining events
-- SHOW EVENTS;

-- =====================================================
-- SCRIPT COMPLETION MESSAGE
-- =====================================================

SELECT 'All database objects have been successfully dropped!' AS Status,
       NOW() AS Completed_At,
       DATABASE() AS Database_Name;

-- =====================================================
-- ADDITIONAL CLEANUP (OPTIONAL)
-- =====================================================

-- Uncomment these if you want to also clean up other database objects:

-- Drop database (WARNING: This will delete the entire database!)
-- DROP DATABASE IF EXISTS `u671899480_chokdeegeo`;

-- Create empty database (if you want to start fresh)
-- CREATE DATABASE IF NOT EXISTS `u671899480_chokdeegeo` 
-- CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
