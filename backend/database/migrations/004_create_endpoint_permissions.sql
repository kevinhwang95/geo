-- Enhanced Access Control System
-- This migration creates endpoint-based permissions that work alongside navigation menus

-- Create endpoint_permissions table for granular API access control
CREATE TABLE IF NOT EXISTS endpoint_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    endpoint_key VARCHAR(100) NOT NULL UNIQUE COMMENT 'Unique identifier for endpoint (e.g., "users.index", "lands.create")',
    endpoint_name VARCHAR(100) NOT NULL COMMENT 'Human-readable name for the endpoint',
    endpoint_description TEXT COMMENT 'Description of what this endpoint does',
    http_method ENUM('GET', 'POST', 'PUT', 'DELETE', 'PATCH') NOT NULL COMMENT 'HTTP method',
    endpoint_pattern VARCHAR(200) NOT NULL COMMENT 'URL pattern (e.g., "/users", "/users/{id}")',
    controller_method VARCHAR(100) NOT NULL COMMENT 'Controller method name (e.g., "index", "store")',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether this endpoint is active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_endpoint_key (endpoint_key),
    INDEX idx_http_method (http_method),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create endpoint_role_permissions table for role-based access control
CREATE TABLE IF NOT EXISTS endpoint_role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    endpoint_id INT NOT NULL,
    role VARCHAR(50) NOT NULL COMMENT 'User role (admin, contributor, team_lead, user)',
    is_allowed BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether this role can access this endpoint',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (endpoint_id) REFERENCES endpoint_permissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_endpoint_role (endpoint_id, role),
    INDEX idx_role (role),
    INDEX idx_allowed (is_allowed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default endpoint permissions
INSERT INTO endpoint_permissions (endpoint_key, endpoint_name, endpoint_description, http_method, endpoint_pattern, controller_method, is_active) VALUES
-- Authentication endpoints (public)
('auth.login', 'User Login', 'Authenticate user credentials', 'POST', '/auth/login', 'login', TRUE),
('auth.logout', 'User Logout', 'Logout user session', 'POST', '/auth/logout', 'logout', TRUE),
('auth.profile', 'User Profile', 'Get current user profile', 'GET', '/auth/profile', 'profile', TRUE),
('auth.refresh', 'Refresh Token', 'Refresh access token', 'POST', '/auth/refresh', 'refresh', TRUE),
('auth.setup-password', 'Setup Password', 'Set password for new user', 'POST', '/auth/setup-password', 'setupPassword', TRUE),
('auth.request-password-reset', 'Request Password Reset', 'Request password reset email', 'POST', '/auth/request-password-reset', 'requestPasswordReset', TRUE),
('auth.reset-password', 'Reset Password', 'Reset password using token', 'POST', '/auth/reset-password', 'resetPassword', TRUE),

-- User management endpoints
('users.index', 'List Users', 'Get all users', 'GET', '/users', 'index', TRUE),
('users.show', 'Show User', 'Get user by ID', 'GET', '/users/{id}', 'show', TRUE),
('users.store', 'Create User', 'Create new user', 'POST', '/users', 'store', TRUE),
('users.update', 'Update User', 'Update user information', 'PUT', '/users/{id}', 'update', TRUE),
('users.delete', 'Delete User', 'Delete user', 'DELETE', '/users/{id}', 'delete', TRUE),

-- Land management endpoints
('lands.index', 'List Lands', 'Get all lands', 'GET', '/lands', 'index', TRUE),
('lands.show', 'Show Land', 'Get land by ID', 'GET', '/lands/{id}', 'show', TRUE),
('lands.store', 'Create Land', 'Create new land', 'POST', '/lands', 'store', TRUE),
('lands.update', 'Update Land', 'Update land information', 'PUT', '/lands/{id}', 'update', TRUE),
('lands.delete', 'Delete Land', 'Delete land', 'DELETE', '/lands/{id}', 'delete', TRUE),

-- Team management endpoints
('teams.index', 'List Teams', 'Get all teams', 'GET', '/teams', 'index', TRUE),
('teams.show', 'Show Team', 'Get team by ID', 'GET', '/teams/{id}', 'show', TRUE),
('teams.store', 'Create Team', 'Create new team', 'POST', '/teams', 'store', TRUE),
('teams.update', 'Update Team', 'Update team information', 'PUT', '/teams/{id}', 'update', TRUE),
('teams.delete', 'Delete Team', 'Delete team', 'DELETE', '/teams/{id}', 'delete', TRUE),

-- Work assignment endpoints
('work-assignments.index', 'List Work Assignments', 'Get all work assignments', 'GET', '/work-assignments', 'index', TRUE),
('work-assignments.show', 'Show Work Assignment', 'Get work assignment by ID', 'GET', '/work-assignments/{id}', 'show', TRUE),
('work-assignments.store', 'Create Work Assignment', 'Create new work assignment', 'POST', '/work-assignments', 'store', TRUE),
('work-assignments.update', 'Update Work Assignment', 'Update work assignment information', 'PUT', '/work-assignments/{id}', 'update', TRUE),
('work-assignments.delete', 'Delete Work Assignment', 'Delete work assignment', 'DELETE', '/work-assignments/{id}', 'delete', TRUE),

-- Plant type endpoints
('plant-types.index', 'List Plant Types', 'Get all plant types', 'GET', '/plant-types', 'index', TRUE),
('plant-types.show', 'Show Plant Type', 'Get plant type by ID', 'GET', '/plant-types/{id}', 'show', TRUE),
('plant-types.store', 'Create Plant Type', 'Create new plant type', 'POST', '/plant-types', 'store', TRUE),
('plant-types.update', 'Update Plant Type', 'Update plant type information', 'PUT', '/plant-types/{id}', 'update', TRUE),
('plant-types.delete', 'Delete Plant Type', 'Delete plant type', 'DELETE', '/plant-types/{id}', 'delete', TRUE),

-- Category endpoints
('categories.index', 'List Categories', 'Get all categories', 'GET', '/categories', 'index', TRUE),
('categories.show', 'Show Category', 'Get category by ID', 'GET', '/categories/{id}', 'show', TRUE),
('categories.store', 'Create Category', 'Create new category', 'POST', '/categories', 'store', TRUE),
('categories.update', 'Update Category', 'Update category information', 'PUT', '/categories/{id}', 'update', TRUE),
('categories.delete', 'Delete Category', 'Delete category', 'DELETE', '/categories/{id}', 'delete', TRUE),

-- Navigation menu endpoints
('navigation-menus.role', 'Navigation Menus by Role', 'Get navigation menus for specific role', 'GET', '/navigation-menus/role/{role}', 'getMenusForRole', TRUE),
('navigation-menus.index', 'List Navigation Menus', 'Get all navigation menus', 'GET', '/navigation-menus', 'getAllMenus', TRUE),
('navigation-menus.store', 'Create Navigation Menu', 'Create new navigation menu', 'POST', '/navigation-menus', 'createMenu', TRUE),
('navigation-menus.update', 'Update Navigation Menu', 'Update navigation menu', 'PUT', '/navigation-menus/{id}', 'updateMenu', TRUE),
('navigation-menus.delete', 'Delete Navigation Menu', 'Delete navigation menu', 'DELETE', '/navigation-menus/{id}', 'deleteMenu', TRUE),

-- Notification endpoints
('notifications.index', 'List Notifications', 'Get all notifications', 'GET', '/notifications', 'index', TRUE),
('notifications.show', 'Show Notification', 'Get notification by ID', 'GET', '/notifications/{id}', 'show', TRUE),
('notifications.store', 'Create Notification', 'Create new notification', 'POST', '/notifications', 'store', TRUE),
('notifications.update', 'Update Notification', 'Update notification', 'PUT', '/notifications/{id}', 'update', TRUE),
('notifications.delete', 'Delete Notification', 'Delete notification', 'DELETE', '/notifications/{id}', 'delete', TRUE);

-- Insert default role permissions for endpoints
-- Authentication endpoints - accessible to all authenticated users
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'admin', TRUE FROM endpoint_permissions WHERE endpoint_key LIKE 'auth.%';
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'contributor', TRUE FROM endpoint_permissions WHERE endpoint_key LIKE 'auth.%';
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'team_lead', TRUE FROM endpoint_permissions WHERE endpoint_key LIKE 'auth.%';
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'user', TRUE FROM endpoint_permissions WHERE endpoint_key LIKE 'auth.%';

-- User management - admin only
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'admin', TRUE FROM endpoint_permissions WHERE endpoint_key LIKE 'users.%';
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'contributor', FALSE FROM endpoint_permissions WHERE endpoint_key LIKE 'users.%';
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'team_lead', FALSE FROM endpoint_permissions WHERE endpoint_key LIKE 'users.%';
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'user', FALSE FROM endpoint_permissions WHERE endpoint_key LIKE 'users.%';

-- Land management - admin and contributor can manage, all can view
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'admin', TRUE FROM endpoint_permissions WHERE endpoint_key LIKE 'lands.%';
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'contributor', TRUE FROM endpoint_permissions WHERE endpoint_key LIKE 'lands.%';
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'team_lead', TRUE FROM endpoint_permissions WHERE endpoint_key LIKE 'lands.%';
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'user', TRUE FROM endpoint_permissions WHERE endpoint_key LIKE 'lands.%';

-- Team management - admin and contributor can manage, team_lead can view
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'admin', TRUE FROM endpoint_permissions WHERE endpoint_key LIKE 'teams.%';
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'contributor', TRUE FROM endpoint_permissions WHERE endpoint_key LIKE 'teams.%';
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'team_lead', TRUE FROM endpoint_permissions WHERE endpoint_key LIKE 'teams.%';
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'user', FALSE FROM endpoint_permissions WHERE endpoint_key LIKE 'teams.%';

-- Work assignments - admin and contributor can manage, team_lead can view
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'admin', TRUE FROM endpoint_permissions WHERE endpoint_key LIKE 'work-assignments.%';
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'contributor', TRUE FROM endpoint_permissions WHERE endpoint_key LIKE 'work-assignments.%';
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'team_lead', TRUE FROM endpoint_permissions WHERE endpoint_key LIKE 'work-assignments.%';
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'user', FALSE FROM endpoint_permissions WHERE endpoint_key LIKE 'work-assignments.%';

-- Plant types - admin only for management, all can view
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'admin', TRUE FROM endpoint_permissions WHERE endpoint_key LIKE 'plant-types.%';
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'contributor', TRUE FROM endpoint_permissions WHERE endpoint_key LIKE 'plant-types.%';
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'team_lead', TRUE FROM endpoint_permissions WHERE endpoint_key LIKE 'plant-types.%';
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'user', TRUE FROM endpoint_permissions WHERE endpoint_key LIKE 'plant-types.%';

-- Categories - admin only for management, all can view
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'admin', TRUE FROM endpoint_permissions WHERE endpoint_key LIKE 'categories.%';
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'contributor', TRUE FROM endpoint_permissions WHERE endpoint_key LIKE 'categories.%';
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'team_lead', TRUE FROM endpoint_permissions WHERE endpoint_key LIKE 'categories.%';
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'user', TRUE FROM endpoint_permissions WHERE endpoint_key LIKE 'categories.%';

-- Navigation menus - admin only for management, all can view their role menus
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'admin', TRUE FROM endpoint_permissions WHERE endpoint_key LIKE 'navigation-menus.%';
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'contributor', TRUE FROM endpoint_permissions WHERE endpoint_key = 'navigation-menus.role';
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'team_lead', TRUE FROM endpoint_permissions WHERE endpoint_key = 'navigation-menus.role';
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'user', TRUE FROM endpoint_permissions WHERE endpoint_key = 'navigation-menus.role';

-- Notifications - all authenticated users
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'admin', TRUE FROM endpoint_permissions WHERE endpoint_key LIKE 'notifications.%';
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'contributor', TRUE FROM endpoint_permissions WHERE endpoint_key LIKE 'notifications.%';
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'team_lead', TRUE FROM endpoint_permissions WHERE endpoint_key LIKE 'notifications.%';
INSERT INTO endpoint_role_permissions (endpoint_id, role, is_allowed) 
SELECT id, 'user', TRUE FROM endpoint_permissions WHERE endpoint_key LIKE 'notifications.%';
