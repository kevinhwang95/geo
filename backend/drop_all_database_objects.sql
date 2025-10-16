-- =====================================================
-- DROP ALL DATABASE OBJECTS SCRIPT
-- Generated for: land_management (migration-1016.sql)
-- Purpose: Safely drop all tables, views, and stored procedures
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

-- Drop work completion related tables (most dependent)
DROP TABLE IF EXISTS `work_completion_workers`;
DROP TABLE IF EXISTS `work_completion_photos`;
DROP TABLE IF EXISTS `work_completions`;
DROP TABLE IF EXISTS `work_note_photos`;
DROP TABLE IF EXISTS `work_note_reads`;
DROP TABLE IF EXISTS `work_notes`;
DROP TABLE IF EXISTS `work_status_audit`;

-- Drop farm works and work management tables
DROP TABLE IF EXISTS `farm_works`;
DROP TABLE IF EXISTS `work_assignments`;
DROP TABLE IF EXISTS `work_categories`;
DROP TABLE IF EXISTS `work_types`;
DROP TABLE IF EXISTS `work_statuses`;

-- Drop notification system tables
DROP TABLE IF EXISTS `notification_logs`;
DROP TABLE IF EXISTS `land_photos`;
DROP TABLE IF EXISTS `notifications`;

-- Drop team and user management tables
DROP TABLE IF EXISTS `team_members`;
DROP TABLE IF EXISTS `teams`;

-- Drop authentication and security tables
DROP TABLE IF EXISTS `oauth_tokens`;
DROP TABLE IF EXISTS `password_tokens`;

-- Drop permission and navigation system tables
DROP TABLE IF EXISTS `endpoint_role_permissions`;
DROP TABLE IF EXISTS `endpoint_permissions`;
DROP TABLE IF EXISTS `navigation_menu_permissions`;
DROP TABLE IF EXISTS `navigation_menus`;

-- Drop land management tables
DROP TABLE IF EXISTS `land_comments`;
DROP TABLE IF EXISTS `lands`;

-- Drop email and communication tables
DROP TABLE IF EXISTS `email_templates`;

-- Drop system and configuration tables
DROP TABLE IF EXISTS `supported_languages`;
DROP TABLE IF EXISTS `schema_migrations`;

-- Drop plant and category management tables
DROP TABLE IF EXISTS `plant_types`;
DROP TABLE IF EXISTS `categories`;

-- Drop core user table (referenced by many others)
DROP TABLE IF EXISTS `users`;

-- =====================================================
-- DROP STORED PROCEDURES (if any exist)
-- =====================================================

-- Note: No stored procedures were found in the provided SQL file
-- Add any custom stored procedures here if they exist

-- =====================================================
-- DROP FUNCTIONS (if any exist)
-- =====================================================

-- Note: No custom functions were found in the provided SQL file
-- Add any custom functions here if they exist

-- =====================================================
-- DROP TRIGGERS (if any exist)
-- =====================================================

-- Note: No triggers were found in the provided SQL file
-- Add any custom triggers here if they exist

-- =====================================================
-- DROP EVENTS (if any exist)
-- =====================================================

-- Note: No events were found in the provided SQL file
-- Add any custom events here if they exist

-- =====================================================
-- DROP INDEXES (if any custom indexes exist)
-- =====================================================

-- Note: Custom indexes will be dropped with their tables
-- Add any standalone indexes here if they exist

-- =====================================================
-- RE-ENABLE FOREIGN KEY CHECKS
-- =====================================================

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Uncomment these to verify all objects have been dropped:

-- SHOW TABLES;
-- SHOW FULL TABLES WHERE Table_type = 'VIEW';
-- SHOW PROCEDURE STATUS WHERE Db = DATABASE();
-- SHOW FUNCTION STATUS WHERE Db = DATABASE();
-- SHOW TRIGGERS;

-- =====================================================
-- SCRIPT COMPLETION MESSAGE
-- =====================================================

SELECT 'All database objects have been successfully dropped!' AS Status;
