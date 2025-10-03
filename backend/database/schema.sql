-- Land Management System Database Schema

CREATE DATABASE IF NOT EXISTS land_management;
USE land_management;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role ENUM('system', 'admin', 'user') NOT NULL DEFAULT 'user',
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Lands table
CREATE TABLE IF NOT EXISTS lands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    land_name VARCHAR(255) NOT NULL,
    land_code VARCHAR(100) UNIQUE NOT NULL,
    deed_number VARCHAR(100) NOT NULL,
    location TEXT NOT NULL,
    province VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    plant_type VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    plant_year INT NOT NULL,
    harvest_cycle INT NOT NULL DEFAULT 0,
    geometry LONGTEXT NOT NULL, -- GeoJSON string
    size DECIMAL(15, 2) NOT NULL, -- Area in square meters
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Insert default system user
INSERT INTO users (first_name, last_name, email, phone, role, password_hash) 
VALUES ('System', 'Administrator', 'admin@landmanagement.com', '+1234567890', 'system', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON DUPLICATE KEY UPDATE email = email;

-- Insert sample admin user
INSERT INTO users (first_name, last_name, email, phone, role, password_hash) 
VALUES ('John', 'Doe', 'admin@example.com', '+1234567891', 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON DUPLICATE KEY UPDATE email = email;

-- Insert sample regular user
INSERT INTO users (first_name, last_name, email, phone, role, password_hash) 
VALUES ('Jane', 'Smith', 'user@example.com', '+1234567892', 'user', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON DUPLICATE KEY UPDATE email = email;

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_lands_created_by ON lands(created_by);
CREATE INDEX idx_lands_province ON lands(province);
CREATE INDEX idx_lands_plant_type ON lands(plant_type);
CREATE INDEX idx_lands_created_at ON lands(created_at);

-- Photos table for notification attachments
CREATE TABLE IF NOT EXISTS photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    notification_id INT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
);

CREATE INDEX idx_photos_notification_id ON photos(notification_id);
CREATE INDEX idx_photos_uploaded_at ON photos(uploaded_at);