-- Production Schema Migration
-- This migration creates the database schema based on the production backup
-- Generated at: 2025-10-10 02:00:00

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- Create categories table
-- --------------------------------------------------------

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `color` varchar(7) DEFAULT '#4285F4',
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Create endpoint_permissions table
-- --------------------------------------------------------

CREATE TABLE `endpoint_permissions` (
  `id` int(11) NOT NULL,
  `endpoint_key` varchar(100) NOT NULL COMMENT 'Unique identifier for endpoint (e.g., "users.index", "lands.create")',
  `endpoint_name` varchar(100) NOT NULL COMMENT 'Human-readable name for the endpoint',
  `endpoint_description` text DEFAULT NULL COMMENT 'Description of what this endpoint does',
  `http_method` enum('GET','POST','PUT','DELETE','PATCH') NOT NULL COMMENT 'HTTP method',
  `endpoint_pattern` varchar(200) NOT NULL COMMENT 'URL pattern (e.g., "/users", "/users/{id}")',
  `controller_method` varchar(100) NOT NULL COMMENT 'Controller method name (e.g., "index", "store")',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Whether this endpoint is active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Create endpoint_role_permissions table
-- --------------------------------------------------------

CREATE TABLE `endpoint_role_permissions` (
  `id` int(11) NOT NULL,
  `endpoint_id` int(11) NOT NULL,
  `role` varchar(50) NOT NULL COMMENT 'User role (admin, contributor, team_lead, user)',
  `is_allowed` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Whether this role can access this endpoint',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Create lands table
-- --------------------------------------------------------

CREATE TABLE `lands` (
  `id` int(11) NOT NULL,
  `land_name` varchar(255) NOT NULL,
  `land_code` varchar(100) NOT NULL,
  `deed_number` varchar(100) NOT NULL,
  `location` text NOT NULL,
  `province` varchar(100) NOT NULL,
  `district` varchar(100) NOT NULL,
  `city` varchar(100) NOT NULL,
  `plant_type_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `plant_date` date NOT NULL,
  `harvest_cycle_days` int(11) NOT NULL DEFAULT 365,
  `next_harvest_date` date DEFAULT NULL,
  `geometry` longtext NOT NULL,
  `size` decimal(15,2) NOT NULL,
  `owner_name` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `tree_count` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Create land_comments table
-- --------------------------------------------------------

CREATE TABLE `land_comments` (
  `id` int(11) NOT NULL,
  `land_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `comment` text NOT NULL,
  `comment_type` enum('general','maintenance','harvest','fertilizer','pesticide','irrigation','other') DEFAULT 'general',
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `is_resolved` tinyint(1) DEFAULT 0,
  `resolved_by` int(11) DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Create land_photos table
-- --------------------------------------------------------

CREATE TABLE `land_photos` (
  `id` int(11) NOT NULL,
  `comment_id` int(11) DEFAULT NULL,
  `land_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `original_filename` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` int(11) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `altitude` decimal(8,2) DEFAULT NULL,
  `photo_timestamp` timestamp NULL DEFAULT NULL,
  `camera_info` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`camera_info`)),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Create navigation_menus table
-- --------------------------------------------------------

CREATE TABLE `navigation_menus` (
  `id` int(11) NOT NULL,
  `menu_key` varchar(100) NOT NULL COMMENT 'Unique identifier for menu item (e.g., "overview", "lands", "admin")',
  `label` varchar(100) NOT NULL COMMENT 'Display label for the menu item',
  `icon` varchar(50) NOT NULL COMMENT 'Icon name from lucide-react',
  `route` varchar(100) NOT NULL COMMENT 'Route or section identifier',
  `order_index` int(11) NOT NULL DEFAULT 0 COMMENT 'Display order (lower numbers appear first)',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Whether the menu item is active/enabled',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Create navigation_menu_permissions table
-- --------------------------------------------------------

CREATE TABLE `navigation_menu_permissions` (
  `id` int(11) NOT NULL,
  `menu_id` int(11) NOT NULL,
  `role` varchar(50) NOT NULL COMMENT 'User role (admin, contributor, team_lead, user)',
  `is_visible` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Whether this role can see this menu item',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Create notifications table
-- --------------------------------------------------------

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `land_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` enum('harvest_due','harvest_overdue','maintenance_due','comment_added','photo_added') NOT NULL,
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `is_dismissed` tinyint(1) DEFAULT 0,
  `dismissed_by` int(11) DEFAULT NULL,
  `dismissed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Create oauth_tokens table
-- --------------------------------------------------------

CREATE TABLE `oauth_tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token_type` enum('access','refresh') NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_revoked` tinyint(1) DEFAULT 0,
  `revoked_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Create password_tokens table
-- --------------------------------------------------------

CREATE TABLE `password_tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(64) NOT NULL,
  `type` enum('password_setup','password_reset') NOT NULL DEFAULT 'password_setup',
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `used` tinyint(1) NOT NULL DEFAULT 0,
  `used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Create photos table
-- --------------------------------------------------------

CREATE TABLE `photos` (
  `id` int(11) NOT NULL,
  `notification_id` int(11) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_size` int(11) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Create plant_types table
-- --------------------------------------------------------

CREATE TABLE `plant_types` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `harvest_cycle_days` int(11) DEFAULT 365,
  `requires_tree_count` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Create teams table
-- --------------------------------------------------------

CREATE TABLE `teams` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `team_lead_id` int(11) DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Create team_members table
-- --------------------------------------------------------

CREATE TABLE `team_members` (
  `id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` enum('member','lead') DEFAULT 'member',
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Create users table
-- --------------------------------------------------------

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `role` enum('system','admin','contributor','user','team_lead') NOT NULL DEFAULT 'user',
  `password_hash` varchar(255) DEFAULT NULL,
  `oauth_provider` varchar(50) DEFAULT NULL,
  `oauth_id` varchar(255) DEFAULT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Create v_dashboard_notifications view
-- --------------------------------------------------------

CREATE VIEW `v_dashboard_notifications` AS
SELECT 
    n.id,
    n.land_id,
    n.user_id,
    n.type,
    n.priority,
    n.title,
    n.message,
    n.is_read,
    n.is_dismissed,
    n.created_at,
    l.land_name,
    l.land_code,
    CONCAT(u.first_name, ' ', u.last_name) as user_name
FROM notifications n
LEFT JOIN lands l ON n.land_id = l.id
LEFT JOIN users u ON n.user_id = u.id
WHERE n.is_dismissed = 0
ORDER BY n.created_at DESC;

-- --------------------------------------------------------
-- Create v_lands_detailed view
-- --------------------------------------------------------

CREATE VIEW `v_lands_detailed` AS
SELECT 
    l.*,
    pt.name as plant_type_name,
    c.name as category_name,
    CONCAT(u.first_name, ' ', u.last_name) as created_by_name
FROM lands l
LEFT JOIN plant_types pt ON l.plant_type_id = pt.id
LEFT JOIN categories c ON l.category_id = c.id
LEFT JOIN users u ON l.created_by = u.id;

-- --------------------------------------------------------
-- Create work_assignments table (missing in production)
-- --------------------------------------------------------

CREATE TABLE `work_assignments` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `land_id` int(11) DEFAULT NULL,
  `team_id` int(11) DEFAULT NULL,
  `assigned_to_user_id` int(11) DEFAULT NULL,
  `assigned_by_user_id` int(11) NOT NULL,
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `status` enum('pending','in_progress','completed','cancelled') DEFAULT 'pending',
  `due_date` date DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Add Primary Keys
-- --------------------------------------------------------

ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `created_by` (`created_by`);

ALTER TABLE `endpoint_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `endpoint_key` (`endpoint_key`);

ALTER TABLE `endpoint_role_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_endpoint_role` (`endpoint_id`,`role`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_allowed` (`is_allowed`);

ALTER TABLE `lands`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `land_code` (`land_code`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `plant_type_id` (`plant_type_id`),
  ADD KEY `category_id` (`category_id`);

ALTER TABLE `land_comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `land_id` (`land_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `resolved_by` (`resolved_by`);

ALTER TABLE `land_photos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `land_id` (`land_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `comment_id` (`comment_id`);

ALTER TABLE `navigation_menus`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `menu_key` (`menu_key`);

ALTER TABLE `navigation_menu_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_menu_role` (`menu_id`,`role`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_visible` (`is_visible`);

ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `land_id` (`land_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `dismissed_by` (`dismissed_by`);

ALTER TABLE `oauth_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `token_hash` (`token_hash`);

ALTER TABLE `password_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `user_id` (`user_id`);

ALTER TABLE `photos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notification_id` (`notification_id`);

ALTER TABLE `plant_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `created_by` (`created_by`);

ALTER TABLE `teams`
  ADD PRIMARY KEY (`id`),
  ADD KEY `team_lead_id` (`team_lead_id`),
  ADD KEY `created_by` (`created_by`);

ALTER TABLE `team_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_team_user` (`team_id`,`user_id`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `unique_oauth` (`oauth_provider`,`oauth_id`);

ALTER TABLE `work_assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `land_id` (`land_id`),
  ADD KEY `team_id` (`team_id`),
  ADD KEY `assigned_to_user_id` (`assigned_to_user_id`),
  ADD KEY `assigned_by_user_id` (`assigned_by_user_id`);

-- --------------------------------------------------------
-- Set Auto Increment
-- --------------------------------------------------------

ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `endpoint_permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `endpoint_role_permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `lands`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `land_comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `land_photos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `navigation_menus`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `navigation_menu_permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `oauth_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `password_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `photos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `plant_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `teams`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `team_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `work_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- --------------------------------------------------------
-- Add Foreign Key Constraints
-- --------------------------------------------------------

ALTER TABLE `categories`
  ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

ALTER TABLE `endpoint_role_permissions`
  ADD CONSTRAINT `endpoint_role_permissions_ibfk_1` FOREIGN KEY (`endpoint_id`) REFERENCES `endpoint_permissions` (`id`) ON DELETE CASCADE;

ALTER TABLE `lands`
  ADD CONSTRAINT `lands_ibfk_1` FOREIGN KEY (`plant_type_id`) REFERENCES `plant_types` (`id`),
  ADD CONSTRAINT `lands_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  ADD CONSTRAINT `lands_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

ALTER TABLE `land_comments`
  ADD CONSTRAINT `land_comments_ibfk_1` FOREIGN KEY (`land_id`) REFERENCES `lands` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `land_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `land_comments_ibfk_3` FOREIGN KEY (`resolved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

ALTER TABLE `land_photos`
  ADD CONSTRAINT `land_photos_ibfk_1` FOREIGN KEY (`land_id`) REFERENCES `lands` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `land_photos_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `land_photos_ibfk_3` FOREIGN KEY (`comment_id`) REFERENCES `land_comments` (`id`) ON DELETE CASCADE;

ALTER TABLE `navigation_menu_permissions`
  ADD CONSTRAINT `navigation_menu_permissions_ibfk_1` FOREIGN KEY (`menu_id`) REFERENCES `navigation_menus` (`id`) ON DELETE CASCADE;

ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`land_id`) REFERENCES `lands` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_3` FOREIGN KEY (`dismissed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

ALTER TABLE `oauth_tokens`
  ADD CONSTRAINT `oauth_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `password_tokens`
  ADD CONSTRAINT `password_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `photos`
  ADD CONSTRAINT `photos_ibfk_1` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE;

ALTER TABLE `plant_types`
  ADD CONSTRAINT `plant_types_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

ALTER TABLE `teams`
  ADD CONSTRAINT `teams_ibfk_1` FOREIGN KEY (`team_lead_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `teams_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

ALTER TABLE `team_members`
  ADD CONSTRAINT `team_members_ibfk_1` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `team_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `work_assignments`
  ADD CONSTRAINT `work_assignments_ibfk_1` FOREIGN KEY (`land_id`) REFERENCES `lands` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `work_assignments_ibfk_2` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `work_assignments_ibfk_3` FOREIGN KEY (`assigned_to_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `work_assignments_ibfk_4` FOREIGN KEY (`assigned_by_user_id`) REFERENCES `users` (`id`);

COMMIT;


