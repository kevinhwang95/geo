-- Enhanced Land Management System Database Schema
-- Supports OAuth 2.0, Role-based Access Control, Comments, Photos, and Notifications

CREATE DATABASE IF NOT EXISTS land_management;
USE land_management;

-- Enhanced Users table with OAuth support
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role ENUM('admin', 'contributor', 'user') NOT NULL DEFAULT 'user',
    password_hash VARCHAR(255) NOT NULL,
    oauth_provider VARCHAR(50) NULL, -- 'google', 'microsoft', 'github', etc.
    oauth_id VARCHAR(255) NULL, -- OAuth provider user ID
    avatar_url VARCHAR(500) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_oauth (oauth_provider, oauth_id),
    INDEX idx_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_active (is_active)
);

-- Plant Types table (managed by admin)
CREATE TABLE IF NOT EXISTS plant_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    scientific_name VARCHAR(200) NULL,
    harvest_cycle_days INT NOT NULL DEFAULT 365,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_plant_types_active (is_active)
);

-- Categories table (managed by admin)
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    color VARCHAR(7) DEFAULT '#4285F4', -- Hex color for map display
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_categories_active (is_active)
);

-- Enhanced Lands table
CREATE TABLE IF NOT EXISTS lands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    land_name VARCHAR(255) NOT NULL,
    land_code VARCHAR(100) UNIQUE NOT NULL,
    deed_number VARCHAR(100) NOT NULL,
    location TEXT NOT NULL,
    province VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    plant_type_id INT NOT NULL,
    category_id INT NOT NULL,
    plant_date DATE NOT NULL,
    harvest_cycle_days INT NOT NULL DEFAULT 365,
    next_harvest_date DATE NULL,
    geometry LONGTEXT NOT NULL, -- GeoJSON string
    size DECIMAL(15, 2) NOT NULL, -- Area in square meters
    owner_name VARCHAR(255) NULL,
    notes TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (plant_type_id) REFERENCES plant_types(id) ON DELETE RESTRICT,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_lands_created_by (created_by),
    INDEX idx_lands_plant_type (plant_type_id),
    INDEX idx_lands_category (category_id),
    INDEX idx_lands_province (province),
    INDEX idx_lands_active (is_active),
    INDEX idx_lands_next_harvest (next_harvest_date)
);

-- Comments/Notes table
CREATE TABLE IF NOT EXISTS land_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    land_id INT NOT NULL,
    user_id INT NOT NULL,
    comment TEXT NOT NULL,
    comment_type ENUM('general', 'maintenance', 'harvest', 'fertilizer', 'pesticide', 'irrigation', 'other') DEFAULT 'general',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by INT NULL,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (land_id) REFERENCES lands(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_comments_land (land_id),
    INDEX idx_comments_user (user_id),
    INDEX idx_comments_type (comment_type),
    INDEX idx_comments_priority (priority),
    INDEX idx_comments_resolved (is_resolved),
    INDEX idx_comments_created (created_at)
);

-- Photos table with geolocation
CREATE TABLE IF NOT EXISTS land_photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comment_id INT NULL, -- Optional: photo can be standalone or attached to comment
    land_id INT NOT NULL,
    user_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8) NULL, -- Photo GPS coordinates
    longitude DECIMAL(11, 8) NULL,
    altitude DECIMAL(8, 2) NULL,
    photo_timestamp TIMESTAMP NULL, -- When photo was taken
    camera_info JSON NULL, -- Camera model, settings, etc.
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (comment_id) REFERENCES land_comments(id) ON DELETE CASCADE,
    FOREIGN KEY (land_id) REFERENCES lands(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_photos_comment (comment_id),
    INDEX idx_photos_land (land_id),
    INDEX idx_photos_user (user_id),
    INDEX idx_photos_active (is_active),
    INDEX idx_photos_location (latitude, longitude)
);

-- Notifications table for harvest alerts
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    land_id INT NOT NULL,
    user_id INT NOT NULL,
    type ENUM('harvest_due', 'harvest_overdue', 'maintenance_due', 'comment_added', 'photo_added') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    dismissed_by INT NULL,
    dismissed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (land_id) REFERENCES lands(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (dismissed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_notifications_land (land_id),
    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_type (type),
    INDEX idx_notifications_read (is_read),
    INDEX idx_notifications_dismissed (is_dismissed),
    INDEX idx_notifications_created (created_at)
);

-- OAuth Tokens table for refresh tokens
CREATE TABLE IF NOT EXISTS oauth_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_type ENUM('access', 'refresh') NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_tokens_user (user_id),
    INDEX idx_tokens_type (token_type),
    INDEX idx_tokens_expires (expires_at),
    INDEX idx_tokens_revoked (is_revoked)
);

-- Insert default admin user
INSERT INTO users (first_name, last_name, email, phone, role, password_hash) 
VALUES ('System', 'Administrator', 'admin@landmanagement.com', '+1234567890', 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON DUPLICATE KEY UPDATE email = email;

-- Insert sample admin user
INSERT INTO users (first_name, last_name, email, phone, role, password_hash) 
VALUES ('John', 'Doe', 'admin@example.com', '+1234567891', 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON DUPLICATE KEY UPDATE email = email;

-- Insert sample contributor user
INSERT INTO users (first_name, last_name, email, phone, role, password_hash) 
VALUES ('Jane', 'Smith', 'contributor@example.com', '+1234567892', 'contributor', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON DUPLICATE KEY UPDATE email = email;

-- Insert sample regular user
INSERT INTO users (first_name, last_name, email, phone, role, password_hash) 
VALUES ('Bob', 'Johnson', 'user@example.com', '+1234567893', 'user', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON DUPLICATE KEY UPDATE email = email;

-- Insert default plant types
INSERT INTO plant_types (name, description, scientific_name, harvest_cycle_days, created_by) VALUES
('Rice', 'Staple food crop', 'Oryza sativa', 120, 1),
('Corn', 'Maize crop', 'Zea mays', 90, 1),
('Soybean', 'Legume crop', 'Glycine max', 100, 1),
('Wheat', 'Cereal crop', 'Triticum aestivum', 120, 1),
('Tomato', 'Vegetable crop', 'Solanum lycopersicum', 75, 1),
('Potato', 'Tuber crop', 'Solanum tuberosum', 90, 1),
('Coffee', 'Beverage crop', 'Coffea arabica', 365, 1),
('Tea', 'Beverage crop', 'Camellia sinensis', 180, 1),
('Sugarcane', 'Sugar crop', 'Saccharum officinarum', 365, 1),
('Cotton', 'Fiber crop', 'Gossypium hirsutum', 150, 1);

-- Insert default categories
INSERT INTO categories (name, description, color, created_by) VALUES
('Food Crops', 'Crops grown for human consumption', '#4CAF50', 1),
('Cash Crops', 'Crops grown for commercial purposes', '#FF9800', 1),
('Fiber Crops', 'Crops grown for fiber production', '#9C27B0', 1),
('Oil Crops', 'Crops grown for oil production', '#FFC107', 1),
('Medicinal Crops', 'Crops grown for medicinal purposes', '#F44336', 1),
('Ornamental Crops', 'Crops grown for decorative purposes', '#E91E63', 1),
('Research', 'Experimental or research crops', '#607D8B', 1),
('Conservation', 'Crops for environmental conservation', '#795548', 1);

-- Create stored procedure to calculate next harvest date
DELIMITER //
CREATE PROCEDURE UpdateNextHarvestDate(IN land_id INT)
BEGIN
    UPDATE lands 
    SET next_harvest_date = DATE_ADD(plant_date, INTERVAL harvest_cycle_days DAY)
    WHERE id = land_id;
END //
DELIMITER ;

-- Create trigger to automatically calculate next harvest date
DELIMITER //
CREATE TRIGGER tr_lands_next_harvest_insert
AFTER INSERT ON lands
FOR EACH ROW
BEGIN
    CALL UpdateNextHarvestDate(NEW.id);
END //

CREATE TRIGGER tr_lands_next_harvest_update
AFTER UPDATE ON lands
FOR EACH ROW
BEGIN
    IF OLD.plant_date != NEW.plant_date OR OLD.harvest_cycle_days != NEW.harvest_cycle_days THEN
        CALL UpdateNextHarvestDate(NEW.id);
    END IF;
END //
DELIMITER ;

-- Create view for lands with related data
CREATE VIEW v_lands_detailed AS
SELECT 
    l.id,
    l.land_name,
    l.land_code,
    l.deed_number,
    l.location,
    l.province,
    l.district,
    l.city,
    l.plant_date,
    l.harvest_cycle_days,
    l.next_harvest_date,
    l.geometry,
    l.size,
    l.owner_name,
    l.notes,
    l.is_active,
    l.created_at,
    l.updated_at,
    pt.name as plant_type_name,
    pt.scientific_name as plant_scientific_name,
    c.name as category_name,
    c.color as category_color,
    u.first_name as created_by_first_name,
    u.last_name as created_by_last_name,
    u.email as created_by_email,
    CASE 
        WHEN l.next_harvest_date <= CURDATE() THEN 'overdue'
        WHEN l.next_harvest_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 'due_soon'
        ELSE 'normal'
    END as harvest_status
FROM lands l
JOIN plant_types pt ON l.plant_type_id = pt.id
JOIN categories c ON l.category_id = c.id
JOIN users u ON l.created_by = u.id
WHERE l.is_active = TRUE;

-- Create view for dashboard notifications
CREATE VIEW v_dashboard_notifications AS
SELECT 
    n.id,
    n.land_id,
    n.user_id,
    n.type,
    n.title,
    n.message,
    n.is_read,
    n.is_dismissed,
    n.created_at,
    l.land_name,
    l.land_code,
    u.first_name,
    u.last_name
FROM notifications n
JOIN lands l ON n.land_id = l.id
JOIN users u ON n.user_id = u.id
WHERE n.is_dismissed = FALSE
ORDER BY n.created_at DESC;
