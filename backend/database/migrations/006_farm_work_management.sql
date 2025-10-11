-- Farm Work Management System Migration
-- This migration replaces the basic work_assignments system with comprehensive farm work management

-- --------------------------------------------------------
-- Create work_categories table
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `work_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `color` varchar(7) DEFAULT '#3B82F6', -- Hex color for UI
  `icon` varchar(50) DEFAULT 'wrench', -- Icon name for UI
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Create work_types table
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `work_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `category_id` int(11) NOT NULL,
  `icon` varchar(50) DEFAULT 'activity', -- Icon name for UI
  `estimated_duration_hours` decimal(5,2) DEFAULT NULL, -- Estimated duration in hours
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_category` (`name`, `category_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `work_types_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `work_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Create farm_works table (replaces work_assignments)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `farm_works` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `land_id` int(11) DEFAULT NULL,
  `work_type_id` int(11) NOT NULL,
  `priority_level` enum('critical','high','medium','low') NOT NULL DEFAULT 'medium',
  `status` enum('created','assigned','in_progress','completed','canceled','pending','postponed') NOT NULL DEFAULT 'created',
  `creator_user_id` int(11) NOT NULL COMMENT 'User who created the work (can be system for auto-generated)',
  `assigner_user_id` int(11) DEFAULT NULL COMMENT 'User who assigned the work to team',
  `assigned_team_id` int(11) DEFAULT NULL,
  `assigned_date` timestamp NULL DEFAULT NULL,
  `due_date` timestamp NULL DEFAULT NULL,
  `started_date` timestamp NULL DEFAULT NULL,
  `completed_date` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `land_id` (`land_id`),
  KEY `work_type_id` (`work_type_id`),
  KEY `creator_user_id` (`creator_user_id`),
  KEY `assigner_user_id` (`assigner_user_id`),
  KEY `assigned_team_id` (`assigned_team_id`),
  KEY `status` (`status`),
  KEY `priority_level` (`priority_level`),
  KEY `due_date` (`due_date`),
  CONSTRAINT `farm_works_ibfk_1` FOREIGN KEY (`land_id`) REFERENCES `lands` (`id`) ON DELETE SET NULL,
  CONSTRAINT `farm_works_ibfk_2` FOREIGN KEY (`work_type_id`) REFERENCES `work_types` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `farm_works_ibfk_3` FOREIGN KEY (`creator_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `farm_works_ibfk_4` FOREIGN KEY (`assigner_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `farm_works_ibfk_5` FOREIGN KEY (`assigned_team_id`) REFERENCES `teams` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Create work_notes table
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `work_notes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `work_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `priority_level` enum('critical','high','medium','low') DEFAULT 'medium',
  `created_by_user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `work_id` (`work_id`),
  KEY `created_by_user_id` (`created_by_user_id`),
  KEY `priority_level` (`priority_level`),
  CONSTRAINT `work_notes_ibfk_1` FOREIGN KEY (`work_id`) REFERENCES `farm_works` (`id`) ON DELETE CASCADE,
  CONSTRAINT `work_notes_ibfk_2` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Create work_note_reads table (track who read the note)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `work_note_reads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `note_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `read_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `note_user` (`note_id`, `user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `work_note_reads_ibfk_1` FOREIGN KEY (`note_id`) REFERENCES `work_notes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `work_note_reads_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Create work_completions table
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `work_completions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `work_id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `worker_count` int(11) NOT NULL DEFAULT 1,
  `completion_note` text DEFAULT NULL,
  `weight_of_product` decimal(10,3) DEFAULT NULL COMMENT 'Weight of harvested product or applied solution',
  `truck_number` varchar(50) DEFAULT NULL,
  `driver_name` varchar(255) DEFAULT NULL,
  `completed_by_user_id` int(11) NOT NULL,
  `completed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `work_id` (`work_id`),
  KEY `team_id` (`team_id`),
  KEY `completed_by_user_id` (`completed_by_user_id`),
  CONSTRAINT `work_completions_ibfk_1` FOREIGN KEY (`work_id`) REFERENCES `farm_works` (`id`) ON DELETE CASCADE,
  CONSTRAINT `work_completions_ibfk_2` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`),
  CONSTRAINT `work_completions_ibfk_3` FOREIGN KEY (`completed_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Create work_note_photos table (links work notes to land_photos)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `work_note_photos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `note_id` int(11) NOT NULL,
  `photo_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `note_photo` (`note_id`, `photo_id`),
  KEY `photo_id` (`photo_id`),
  CONSTRAINT `work_note_photos_ibfk_1` FOREIGN KEY (`note_id`) REFERENCES `work_notes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `work_note_photos_ibfk_2` FOREIGN KEY (`photo_id`) REFERENCES `land_photos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Create work_completion_photos table (links to land_photos)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `work_completion_photos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `completion_id` int(11) NOT NULL,
  `photo_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `completion_photo` (`completion_id`, `photo_id`),
  KEY `photo_id` (`photo_id`),
  CONSTRAINT `work_completion_photos_ibfk_1` FOREIGN KEY (`completion_id`) REFERENCES `work_completions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `work_completion_photos_ibfk_2` FOREIGN KEY (`photo_id`) REFERENCES `land_photos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Create work_status_audit table
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `work_status_audit` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `work_id` int(11) NOT NULL,
  `changed_by_user_id` int(11) NOT NULL,
  `previous_status` varchar(50) DEFAULT NULL,
  `current_status` varchar(50) NOT NULL,
  `change_note` text DEFAULT NULL,
  `changed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `work_id` (`work_id`),
  KEY `changed_by_user_id` (`changed_by_user_id`),
  KEY `changed_at` (`changed_at`),
  CONSTRAINT `work_status_audit_ibfk_1` FOREIGN KEY (`work_id`) REFERENCES `farm_works` (`id`) ON DELETE CASCADE,
  CONSTRAINT `work_status_audit_ibfk_2` FOREIGN KEY (`changed_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Insert default work categories
-- --------------------------------------------------------
INSERT INTO `work_categories` (`name`, `description`, `color`, `icon`) VALUES
('Maintenance', 'Regular maintenance and upkeep activities', '#10B981', 'wrench'),
('Planting', 'Planting and cultivation activities', '#059669', 'seedling'),
('Harvesting', 'Harvest and collection activities', '#D97706', 'harvest'),
('Monitoring', 'Monitoring, checking, and inspection activities', '#3B82F6', 'eye')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- --------------------------------------------------------
-- Insert default work types
-- --------------------------------------------------------
INSERT INTO `work_types` (`name`, `description`, `category_id`, `icon`, `estimated_duration_hours`) VALUES
-- Maintenance category
('Watering', 'Water crops and plants', 1, 'droplets', 2.00),
('Fertilizing', 'Apply fertilizer to crops', 1, 'fertilizer', 3.00),
('Weeding', 'Remove weeds from fields', 1, 'scissors', 4.00),
('Pruning', 'Prune trees and plants', 1, 'pruning-shears', 3.00),
('Pest/Disease Control', 'Apply pest control and disease treatment', 1, 'shield', 2.50),
('Plowing', 'Plow and prepare soil', 1, 'tractor', 6.00),
('Burning', 'Controlled burning for field preparation', 1, 'flame', 4.00),

-- Planting category
('Planting', 'Plant new crops or trees', 2, 'seedling', 5.00),

-- Harvesting category
('Harvesting', 'Harvest mature crops', 3, 'harvest', 8.00),

-- Monitoring category
('Checking Farmland', 'Regular farmland inspection for damage, disease, drought, flooding, and theft', 4, 'search', 2.00)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- --------------------------------------------------------
-- Create indexes for better performance
-- --------------------------------------------------------
CREATE INDEX idx_farm_works_created_at ON farm_works(created_at);
CREATE INDEX idx_farm_works_status_priority ON farm_works(status, priority_level);
CREATE INDEX idx_work_notes_work_id ON work_notes(work_id);
CREATE INDEX idx_work_completions_work_id ON work_completions(work_id);
CREATE INDEX idx_work_status_audit_work_id ON work_status_audit(work_id);

-- --------------------------------------------------------
-- Create view for farm work details
-- --------------------------------------------------------
CREATE OR REPLACE VIEW v_farm_works_detailed AS
SELECT 
    fw.id,
    fw.title,
    fw.description,
    fw.land_id,
    l.land_name,
    l.land_code,
    fw.work_type_id,
    wt.name as work_type_name,
    wt.icon as work_type_icon,
    wc.id as category_id,
    wc.name as category_name,
    wc.color as category_color,
    wc.icon as category_icon,
    fw.priority_level,
    fw.status,
    fw.creator_user_id,
    CONCAT(creator.first_name, ' ', creator.last_name) as creator_name,
    fw.assigner_user_id,
    CONCAT(assigner.first_name, ' ', assigner.last_name) as assigner_name,
    fw.assigned_team_id,
    t.name as assigned_team_name,
    fw.assigned_date,
    fw.due_date,
    fw.started_date,
    fw.completed_date,
    fw.created_at,
    fw.updated_at,
    CASE 
        WHEN fw.due_date IS NULL THEN NULL
        WHEN fw.due_date < NOW() AND fw.status NOT IN ('completed', 'canceled') THEN 'overdue'
        WHEN fw.due_date <= DATE_ADD(NOW(), INTERVAL 1 DAY) AND fw.status NOT IN ('completed', 'canceled') THEN 'due_soon'
        ELSE 'on_time'
    END as due_status
FROM farm_works fw
LEFT JOIN lands l ON fw.land_id = l.id
LEFT JOIN work_types wt ON fw.work_type_id = wt.id
LEFT JOIN work_categories wc ON wt.category_id = wc.id
LEFT JOIN users creator ON fw.creator_user_id = creator.id
LEFT JOIN users assigner ON fw.assigner_user_id = assigner.id
LEFT JOIN teams t ON fw.assigned_team_id = t.id;

-- --------------------------------------------------------
-- Create view for team workload status
-- --------------------------------------------------------
CREATE OR REPLACE VIEW v_team_workload_status AS
SELECT 
    t.id as team_id,
    t.name as team_name,
    COUNT(fw.id) as assigned_work_count,
    COUNT(CASE WHEN fw.status = 'assigned' THEN 1 END) as pending_work_count,
    COUNT(CASE WHEN fw.status = 'in_progress' THEN 1 END) as in_progress_work_count,
    COUNT(CASE WHEN fw.status = 'completed' THEN 1 END) as completed_work_count,
    COUNT(CASE WHEN fw.due_date < NOW() AND fw.status NOT IN ('completed', 'canceled') THEN 1 END) as overdue_work_count,
    MAX(fw.assigned_date) as latest_assignment_date,
    AVG(CASE WHEN fw.completed_date IS NOT NULL AND fw.assigned_date IS NOT NULL 
        THEN TIMESTAMPDIFF(HOUR, fw.assigned_date, fw.completed_date) 
        END) as avg_completion_hours
FROM teams t
LEFT JOIN farm_works fw ON t.id = fw.assigned_team_id AND fw.status != 'canceled'
GROUP BY t.id, t.name;
