-- Create navigation_menus table for configurable menu items
CREATE TABLE IF NOT EXISTS navigation_menus (
    id INT AUTO_INCREMENT PRIMARY KEY,
    menu_key VARCHAR(100) NOT NULL UNIQUE COMMENT 'Unique identifier for menu item (e.g., "overview", "lands", "admin")',
    label VARCHAR(100) NOT NULL COMMENT 'Display label for the menu item',
    icon VARCHAR(50) NOT NULL COMMENT 'Icon name from lucide-react',
    route VARCHAR(100) NOT NULL COMMENT 'Route or section identifier',
    order_index INT NOT NULL DEFAULT 0 COMMENT 'Display order (lower numbers appear first)',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether the menu item is active/enabled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_order (order_index),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create navigation_menu_permissions table for role-based access control
CREATE TABLE IF NOT EXISTS navigation_menu_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    menu_id INT NOT NULL,
    role VARCHAR(50) NOT NULL COMMENT 'User role (admin, contributor, team_lead, user)',
    is_visible BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether this role can see this menu item',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (menu_id) REFERENCES navigation_menus(id) ON DELETE CASCADE,
    UNIQUE KEY unique_menu_role (menu_id, role),
    INDEX idx_role (role),
    INDEX idx_visible (is_visible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default navigation menu items
INSERT INTO navigation_menus (menu_key, label, icon, route, order_index, is_active) VALUES
('overview', 'Overview', 'Home', 'overview', 1, TRUE),
('lands', 'Lands', 'Layers', 'lands', 2, TRUE),
('notifications', 'Notifications', 'Bell', 'notifications', 3, TRUE),
('map', 'Map', 'Eye', 'map', 4, TRUE),
('teams', 'Teams', 'UserCheck', 'teams', 5, TRUE),
('work-assignments', 'Work Assignments', 'ClipboardList', 'work-assignments', 6, TRUE),
('admin', 'Admin', 'Users', 'admin', 7, TRUE),
('menu-management', 'Menu Management', 'Settings', 'menu-management', 8, TRUE);

-- Insert default permissions for each role
-- Overview - visible to all roles
INSERT INTO navigation_menu_permissions (menu_id, role, is_visible) 
SELECT id, 'admin', TRUE FROM navigation_menus WHERE menu_key = 'overview';
INSERT INTO navigation_menu_permissions (menu_id, role, is_visible) 
SELECT id, 'contributor', TRUE FROM navigation_menus WHERE menu_key = 'overview';
INSERT INTO navigation_menu_permissions (menu_id, role, is_visible) 
SELECT id, 'team_lead', TRUE FROM navigation_menus WHERE menu_key = 'overview';
INSERT INTO navigation_menu_permissions (menu_id, role, is_visible) 
SELECT id, 'user', TRUE FROM navigation_menus WHERE menu_key = 'overview';

-- Lands - visible to all roles
INSERT INTO navigation_menu_permissions (menu_id, role, is_visible) 
SELECT id, 'admin', TRUE FROM navigation_menus WHERE menu_key = 'lands';
INSERT INTO navigation_menu_permissions (menu_id, role, is_visible) 
SELECT id, 'contributor', TRUE FROM navigation_menus WHERE menu_key = 'lands';
INSERT INTO navigation_menu_permissions (menu_id, role, is_visible) 
SELECT id, 'team_lead', TRUE FROM navigation_menus WHERE menu_key = 'lands';
INSERT INTO navigation_menu_permissions (menu_id, role, is_visible) 
SELECT id, 'user', TRUE FROM navigation_menus WHERE menu_key = 'lands';

-- Notifications - visible to all roles
INSERT INTO navigation_menu_permissions (menu_id, role, is_visible) 
SELECT id, 'admin', TRUE FROM navigation_menus WHERE menu_key = 'notifications';
INSERT INTO navigation_menu_permissions (menu_id, role, is_visible) 
SELECT id, 'contributor', TRUE FROM navigation_menus WHERE menu_key = 'notifications';
INSERT INTO navigation_menu_permissions (menu_id, role, is_visible) 
SELECT id, 'team_lead', TRUE FROM navigation_menus WHERE menu_key = 'notifications';
INSERT INTO navigation_menu_permissions (menu_id, role, is_visible) 
SELECT id, 'user', TRUE FROM navigation_menus WHERE menu_key = 'notifications';

-- Map - visible to all roles
INSERT INTO navigation_menu_permissions (menu_id, role, is_visible) 
SELECT id, 'admin', TRUE FROM navigation_menus WHERE menu_key = 'map';
INSERT INTO navigation_menu_permissions (menu_id, role, is_visible) 
SELECT id, 'contributor', TRUE FROM navigation_menus WHERE menu_key = 'map';
INSERT INTO navigation_menu_permissions (menu_id, role, is_visible) 
SELECT id, 'team_lead', TRUE FROM navigation_menus WHERE menu_key = 'map';
INSERT INTO navigation_menu_permissions (menu_id, role, is_visible) 
SELECT id, 'user', TRUE FROM navigation_menus WHERE menu_key = 'map';

-- Teams - visible to team_lead and above
INSERT INTO navigation_menu_permissions (menu_id, role, is_visible) 
SELECT id, 'admin', TRUE FROM navigation_menus WHERE menu_key = 'teams';
INSERT INTO navigation_menu_permissions (menu_id, role, is_visible) 
SELECT id, 'contributor', TRUE FROM navigation_menus WHERE menu_key = 'teams';
INSERT INTO navigation_menu_permissions (menu_id, role, is_visible) 
SELECT id, 'team_lead', TRUE FROM navigation_menus WHERE menu_key = 'teams';
INSERT INTO navigation_menu_permissions (menu_id, role, is_visible) 
SELECT id, 'user', FALSE FROM navigation_menus WHERE menu_key = 'teams';

-- Work Assignments - visible to team_lead and above
INSERT INTO navigation_menu_permissions (menu_id, role, is_visible) 
SELECT id, 'admin', TRUE FROM navigation_menus WHERE menu_key = 'work-assignments';
INSERT INTO navigation_menu_permissions (menu_id, role, is_visible) 
SELECT id, 'contributor', TRUE FROM navigation_menus WHERE menu_key = 'work-assignments';
INSERT INTO navigation_menu_permissions (menu_id, role, is_visible) 
SELECT id, 'team_lead', TRUE FROM navigation_menus WHERE menu_key = 'work-assignments';
INSERT INTO navigation_menu_permissions (menu_id, role, is_visible) 
SELECT id, 'user', FALSE FROM navigation_menus WHERE menu_key = 'work-assignments';

-- Admin - visible to admin only
INSERT INTO navigation_menu_permissions (menu_id, role, is_visible) 
SELECT id, 'admin', TRUE FROM navigation_menus WHERE menu_key = 'admin';
INSERT INTO navigation_menu_permissions (menu_id, role, is_visible) 
SELECT id, 'contributor', FALSE FROM navigation_menus WHERE menu_key = 'admin';
INSERT INTO navigation_menu_permissions (menu_id, role, is_visible) 
SELECT id, 'team_lead', FALSE FROM navigation_menus WHERE menu_key = 'admin';
INSERT INTO navigation_menu_permissions (menu_id, role, is_visible) 
SELECT id, 'user', FALSE FROM navigation_menus WHERE menu_key = 'admin';

-- Menu Management - visible to admin only
INSERT INTO navigation_menu_permissions (menu_id, role, is_visible) 
SELECT id, 'admin', TRUE FROM navigation_menus WHERE menu_key = 'menu-management';
INSERT INTO navigation_menu_permissions (menu_id, role, is_visible) 
SELECT id, 'contributor', FALSE FROM navigation_menus WHERE menu_key = 'menu-management';
INSERT INTO navigation_menu_permissions (menu_id, role, is_visible) 
SELECT id, 'team_lead', FALSE FROM navigation_menus WHERE menu_key = 'menu-management';
INSERT INTO navigation_menu_permissions (menu_id, role, is_visible) 
SELECT id, 'user', FALSE FROM navigation_menus WHERE menu_key = 'menu-management';

