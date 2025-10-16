-- Migration: Create work_statuses table
-- This allows flexible management of work statuses instead of hardcoded enum values
-- Generated: 2024-01-XX

USE land_management;

-- Create work_statuses table
CREATE TABLE IF NOT EXISTS `work_statuses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT 'Status name (e.g., pending, in_progress, completed)',
  `display_name` varchar(100) NOT NULL COMMENT 'Human-readable display name',
  `description` text DEFAULT NULL COMMENT 'Description of what this status means',
  `color` varchar(20) DEFAULT '#6b7280' COMMENT 'Hex color code for UI display',
  `icon` varchar(50) DEFAULT NULL COMMENT 'Icon name for UI display',
  `sort_order` int(11) DEFAULT 0 COMMENT 'Order for display in dropdowns',
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'Whether this status is active and can be used',
  `is_final` tinyint(1) DEFAULT 0 COMMENT 'Whether this is a final status (completed, canceled, etc.)',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_name` (`name`),
  KEY `is_active` (`is_active`),
  KEY `sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert default work statuses
INSERT INTO `work_statuses` (`name`, `display_name`, `description`, `color`, `icon`, `sort_order`, `is_active`, `is_final`) VALUES
('created', 'Created', 'Work assignment has been created but not yet assigned', '#6b7280', 'FileText', 1, 1, 0),
('assigned', 'Assigned', 'Work has been assigned to a team or individual', '#3b82f6', 'Users', 2, 1, 0),
('pending', 'Pending', 'Work is pending and waiting to be started', '#f59e0b', 'Clock', 3, 1, 0),
('in_progress', 'In Progress', 'Work is currently being performed', '#10b981', 'Play', 4, 1, 0),
('completed', 'Completed', 'Work has been finished successfully', '#059669', 'CheckCircle', 5, 1, 1),
('canceled', 'Canceled', 'Work has been canceled and will not be completed', '#dc2626', 'XCircle', 6, 1, 1),
('postponed', 'Postponed', 'Work has been postponed to a later date', '#7c3aed', 'Calendar', 7, 1, 0),
('on_hold', 'On Hold', 'Work is temporarily paused', '#f97316', 'Pause', 8, 1, 0),
('review', 'Under Review', 'Work is completed and under review', '#8b5cf6', 'Eye', 9, 1, 0),
('approved', 'Approved', 'Work has been reviewed and approved', '#16a34a', 'CheckCircle2', 10, 1, 1),
('rejected', 'Rejected', 'Work has been reviewed and rejected', '#dc2626', 'X', 11, 1, 1);

-- Add work_status_id column to farm_works table
ALTER TABLE `farm_works` 
ADD COLUMN `work_status_id` int(11) DEFAULT NULL 
COMMENT 'Reference to work_statuses table'
AFTER `status`;

-- Add foreign key constraint
ALTER TABLE `farm_works` 
ADD CONSTRAINT `farm_works_ibfk_6` 
FOREIGN KEY (`work_status_id`) REFERENCES `work_statuses` (`id`) ON DELETE SET NULL;

-- Add index for work_status_id
CREATE INDEX `idx_farm_works_work_status_id` ON `farm_works` (`work_status_id`);

-- Migrate existing status data to use work_statuses table
UPDATE `farm_works` fw 
JOIN `work_statuses` ws ON fw.status = ws.name 
SET fw.work_status_id = ws.id 
WHERE fw.status IS NOT NULL;

-- Update farm_works to make work_status_id NOT NULL for new records
-- (We'll keep status column for backward compatibility during transition)
ALTER TABLE `farm_works` 
MODIFY COLUMN `work_status_id` int(11) NOT NULL 
COMMENT 'Reference to work_statuses table';

-- Migration complete
SELECT 'Work statuses table created and farm_works updated successfully' as status;





