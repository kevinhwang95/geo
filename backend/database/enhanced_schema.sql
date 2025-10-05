-- Enhanced Land Management System Database Schema
-- This file extends the base schema with team management and work assignment features

USE land_management;

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    team_lead_id INT,
    created_by INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (team_lead_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Team members table (many-to-many relationship between users and teams)
CREATE TABLE IF NOT EXISTS team_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('member', 'lead') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_team_user (team_id, user_id)
);

-- Work assignments table
CREATE TABLE IF NOT EXISTS work_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    land_id INT,
    team_id INT,
    assigned_to_user_id INT,
    assigned_by_user_id INT NOT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    due_date DATE,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (land_id) REFERENCES lands(id) ON DELETE SET NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT check_assignment_target CHECK (
        (team_id IS NOT NULL AND assigned_to_user_id IS NULL) OR 
        (team_id IS NULL AND assigned_to_user_id IS NOT NULL)
    )
);

-- Add new roles to users table
ALTER TABLE users MODIFY COLUMN role ENUM('system', 'admin', 'contributor', 'user', 'team_lead') NOT NULL DEFAULT 'user';

-- Add indexes for better performance
CREATE INDEX idx_teams_team_lead ON teams(team_lead_id);
CREATE INDEX idx_teams_created_by ON teams(created_by);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_work_assignments_land_id ON work_assignments(land_id);
CREATE INDEX idx_work_assignments_team_id ON work_assignments(team_id);
CREATE INDEX idx_work_assignments_assigned_to ON work_assignments(assigned_to_user_id);
CREATE INDEX idx_work_assignments_assigned_by ON work_assignments(assigned_by_user_id);
CREATE INDEX idx_work_assignments_status ON work_assignments(status);
CREATE INDEX idx_work_assignments_due_date ON work_assignments(due_date);

-- Insert sample teams
INSERT INTO teams (name, description, team_lead_id, created_by) VALUES 
('Field Operations Team', 'Handles all field work and land maintenance', NULL, 10),
('Data Management Team', 'Manages land records and documentation', NULL, 10),
('Quality Control Team', 'Ensures quality standards and compliance', NULL, 10)
ON DUPLICATE KEY UPDATE name = name;

-- Insert sample work assignments
INSERT INTO work_assignments (title, description, land_id, team_id, assigned_by_user_id, priority, status, due_date) VALUES 
('Harvest Field A1', 'Complete harvest of rice field A1', 7, 1, 7, 'high', 'pending', DATE_ADD(CURDATE(), INTERVAL 7 DAY)),
('Soil Testing', 'Conduct soil quality tests for new plots', NULL, 2, 7, 'medium', 'pending', DATE_ADD(CURDATE(), INTERVAL 14 DAY)),
('Equipment Maintenance', 'Service and maintain all farming equipment', NULL, 3, 7, 'low', 'pending', DATE_ADD(CURDATE(), INTERVAL 30 DAY))
ON DUPLICATE KEY UPDATE title = title;