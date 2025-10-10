-- Production Database Update Script
-- Generated: 2025-10-10 01:45:00
-- Description: Complete update script to sync production database with development schema
-- 
-- IMPORTANT: 
-- 1. Always backup your production database before running this script
-- 2. Test this script on a staging environment first
-- 3. Run this script during maintenance windows
-- 4. Monitor the execution for any errors

-- Set safe mode to prevent accidental data loss
SET SQL_SAFE_UPDATES = 1;

-- Start transaction for atomicity
START TRANSACTION;

-- --------------------------------------------------------
-- 1. Create missing tables
-- --------------------------------------------------------

-- Create email_templates table
CREATE TABLE IF NOT EXISTS `email_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `template_key` varchar(100) NOT NULL COMMENT 'Unique identifier for the template (e.g., password_setup, password_reset)',
  `subject` varchar(255) NOT NULL COMMENT 'Email subject line',
  `html_content` longtext NOT NULL COMMENT 'HTML email template content',
  `text_content` longtext NOT NULL COMMENT 'Plain text email template content',
  `variables` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Available template variables and their descriptions' CHECK (json_valid(`variables`)),
  `description` text DEFAULT NULL COMMENT 'Description of what this template is used for',
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'Whether this template is currently active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL COMMENT 'User ID who created this template',
  `updated_by` int(11) DEFAULT NULL COMMENT 'User ID who last updated this template',
  `language_code` varchar(5) NOT NULL DEFAULT 'en' COMMENT 'ISO language code (e.g., en, th, zh)',
  `base_template_id` int(11) DEFAULT NULL COMMENT 'Reference to the base template if this is a translation',
  `is_base_template` tinyint(1) DEFAULT 0 COMMENT 'Whether this is the base template for translations',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_template_language` (`template_key`,`language_code`),
  KEY `idx_template_key` (`template_key`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_language_code` (`language_code`),
  KEY `idx_base_template_id` (`base_template_id`),
  KEY `idx_template_key_lang` (`template_key`,`language_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Dynamic email templates for the application';

-- Create notification_logs table
CREATE TABLE IF NOT EXISTS `notification_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `notification_type` VARCHAR(255) NOT NULL COMMENT 'Type of notification (e.g., release_notification)',
  `subject` VARCHAR(255) NOT NULL COMMENT 'Notification subject',
  `successful_sends` INT DEFAULT 0 COMMENT 'Number of successful email sends',
  `failed_sends` INT DEFAULT 0 COMMENT 'Number of failed email sends',
  `errors` JSON DEFAULT NULL COMMENT 'JSON array of error details',
  `sent_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'When the notification was sent',
  `created_by` INT DEFAULT NULL COMMENT 'User ID who sent the notification',
  INDEX `idx_notification_type` (`notification_type`),
  INDEX `idx_sent_at` (`sent_at`),
  INDEX `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Log of all sent notifications for audit trail';

-- Create schema_migrations table for migration tracking
CREATE TABLE IF NOT EXISTS `schema_migrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  `executed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `migration` (`migration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 2. Add missing columns to existing tables
-- --------------------------------------------------------

-- Add language_code column to users table if it doesn't exist
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `language_code` varchar(5) DEFAULT 'en' COMMENT 'User preferred language code (e.g., en, th, zh)';

-- Add Thai area calculation columns to lands table if they don't exist
ALTER TABLE `lands` 
ADD COLUMN IF NOT EXISTS `plant_year` INT DEFAULT NULL COMMENT 'Year when plants were planted' AFTER `category_id`,
ADD COLUMN IF NOT EXISTS `harvest_cycle` INT NOT NULL DEFAULT 0 COMMENT 'Harvest cycle in days' AFTER `plant_year`,
ADD COLUMN IF NOT EXISTS `palm_area` decimal(15,2) DEFAULT NULL COMMENT 'Area used for palm growing in rai' AFTER `size`,
ADD COLUMN IF NOT EXISTS `area_rai` decimal(10,2) DEFAULT NULL COMMENT 'Area in Thai rai' AFTER `palm_area`,
ADD COLUMN IF NOT EXISTS `area_ngan` decimal(10,2) DEFAULT NULL COMMENT 'Area in Thai ngan' AFTER `area_rai`,
ADD COLUMN IF NOT EXISTS `area_tarangwa` decimal(10,2) DEFAULT NULL COMMENT 'Area in Thai tarangwa' AFTER `area_ngan`;

-- --------------------------------------------------------
-- 3. Update existing data
-- --------------------------------------------------------

-- Update existing lands records to populate plant_year from plant_date
UPDATE `lands` SET `plant_year` = YEAR(`plant_date`) WHERE `plant_year` IS NULL;

-- --------------------------------------------------------
-- 4. Insert default email templates
-- --------------------------------------------------------

-- Insert English email templates
INSERT INTO `email_templates` (`id`, `template_key`, `subject`, `html_content`, `text_content`, `variables`, `description`, `is_active`, `created_at`, `updated_at`, `created_by`, `updated_by`, `language_code`, `base_template_id`, `is_base_template`) VALUES
(1, 'password_setup', 'Welcome to Chokdee App - Set Up Your Password', '<!DOCTYPE html>\r\n<html>\r\n<head>\r\n    <meta charset=\"UTF-8\">\r\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\r\n    <title>Welcome to Chokdee App</title>\r\n    <style>\r\n        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }\r\n        .container { max-width: 600px; margin: 0 auto; padding: 20px; }\r\n        .header { background: #7c3aed; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }\r\n        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }\r\n        .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }\r\n        .button:hover { background: #6d28d9; }\r\n        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }\r\n        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }\r\n    </style>\r\n</head>\r\n<body>\r\n    <div class=\"container\">\r\n        <div class=\"header\">\r\n            <h1>Welcome to Chokdee App!</h1>\r\n        </div>\r\n        <div class=\"content\">\r\n            <h2>Hello {{user_name}},</h2>\r\n            <p>Welcome to Chokdee App! Your account has been created and you are ready to get started.</p>\r\n            <p>To complete your registration, please set up your password by clicking the button below:</p>\r\n            \r\n            <div style=\"text-align: center;\">\r\n                <a href=\"{{setup_url}}\" class=\"button\">Set Up My Password</a>\r\n            </div>\r\n            \r\n            <div class=\"warning\">\r\n                <strong>Important:</strong> This link will expire in 24 hours for security reasons. If you do not set up your password within this time, please contact your administrator.\r\n            </div>\r\n            \r\n            <p>If the button does not work, you can copy and paste this link into your browser:</p>\r\n            <p style=\"word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px; font-family: monospace;\">\r\n                {{setup_url}}\r\n            </p>\r\n            \r\n            <p>If you did not expect this email, please ignore it or contact support.</p>\r\n        </div>\r\n        <div class=\"footer\">\r\n            <p>This email was sent from Chokdee App. Please do not reply to this email.</p>\r\n        </div>\r\n    </div>\r\n</body>\r\n</html>', 'Welcome to Chokdee App!\r\n\r\nHello {{user_name}},\r\n\r\nWelcome to Chokdee App! Your account has been created and you are ready to get started.\r\n\r\nTo complete your registration, please set up your password by visiting this link:\r\n\r\n{{setup_url}}\r\n\r\nIMPORTANT: This link will expire in 24 hours for security reasons. If you do not set up your password within this time, please contact your administrator.\r\n\r\nIf you did not expect this email, please ignore it or contact support.\r\n\r\nThis email was sent from Chokdee App. Please do not reply to this email.', '{\"user_name\": \"The name of the user receiving the email\", \"setup_url\": \"The password setup URL link\"}', 'Email template sent to new users to set up their password', 1, NOW(), NOW(), 1, 1, 'en', NULL, 1),
(2, 'password_reset', 'Reset Your Password - Chokdee App', '<!DOCTYPE html>\r\n<html>\r\n<head>\r\n    <meta charset=\"UTF-8\">\r\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\r\n    <title>Reset Your Password - Chokdee App</title>\r\n    <style>\r\n        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }\r\n        .container { max-width: 600px; margin: 0 auto; padding: 20px; }\r\n        .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }\r\n        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }\r\n        .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }\r\n        .button:hover { background: #b91c1c; }\r\n        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }\r\n        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }\r\n    </style>\r\n</head>\r\n<body>\r\n    <div class=\"container\">\r\n        <div class=\"header\">\r\n            <h1>Reset Your Password</h1>\r\n        </div>\r\n        <div class=\"content\">\r\n            <h2>Hello {{user_name}},</h2>\r\n            <p>We received a request to reset your password for your Chokdee App account.</p>\r\n            <p>To reset your password, please click the button below:</p>\r\n            \r\n            <div style=\"text-align: center;\">\r\n                <a href=\"{{reset_url}}\" class=\"button\">Reset My Password</a>\r\n            </div>\r\n            \r\n            <div class=\"warning\">\r\n                <strong>Important:</strong> This link will expire in 24 hours for security reasons. If you do not reset your password within this time, you will need to request a new reset link.\r\n            </div>\r\n            \r\n            <p>If the button does not work, you can copy and paste this link into your browser:</p>\r\n            <p style=\"word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px; font-family: monospace;\">\r\n                {{reset_url}}\r\n            </p>\r\n            \r\n            <p>If you did not request this password reset, please ignore this email or contact support if you have concerns.</p>\r\n        </div>\r\n        <div class=\"footer\">\r\n            <p>This email was sent from Chokdee App. Please do not reply to this email.</p>\r\n        </div>\r\n    </div>\r\n</body>\r\n</html>', 'Reset Your Password - Chokdee App\r\n\r\nHello {{user_name}},\r\n\r\nWe received a request to reset your password for your Chokdee App account.\r\n\r\nTo reset your password, please visit this link:\r\n\r\n{{reset_url}}\r\n\r\nIMPORTANT: This link will expire in 24 hours for security reasons. If you do not reset your password within this time, you will need to request a new reset link.\r\n\r\nIf you did not request this password reset, please ignore this email or contact support if you have concerns.\r\n\r\nThis email was sent from Chokdee App. Please do not reply to this email.', '{\"user_name\": \"The name of the user receiving the email\", \"reset_url\": \"The password reset URL link\"}', 'Email template sent to users who request a password reset', 1, NOW(), NOW(), 1, 1, 'en', NULL, 1)
ON DUPLICATE KEY UPDATE 
    subject = VALUES(subject),
    html_content = VALUES(html_content),
    text_content = VALUES(text_content),
    variables = VALUES(variables),
    description = VALUES(description),
    updated_at = NOW(),
    updated_by = 1;

-- Insert Thai email templates
INSERT INTO `email_templates` (`template_key`, `subject`, `html_content`, `text_content`, `variables`, `description`, `is_active`, `created_at`, `updated_at`, `created_by`, `updated_by`, `language_code`, `base_template_id`, `is_base_template`) VALUES
('password_setup', 'ยินดีต้อนรับสู่แอปโชคดี - ตั้งรหัสผ่านของคุณ', '<!DOCTYPE html>\r\n<html>\r\n<head>\r\n    <meta charset=\"UTF-8\">\r\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\r\n    <title>ยินดีต้อนรับสู่แอปโชคดี</title>\r\n    <style>\r\n        body { font-family: \'Segoe UI\', Tahoma, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }\r\n        .container { max-width: 600px; margin: 0 auto; padding: 20px; }\r\n        .header { background: #7c3aed; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }\r\n        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }\r\n        .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }\r\n        .button:hover { background: #6d28d9; }\r\n        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }\r\n    </style>\r\n</head>\r\n<body>\r\n    <div class=\"container\">\r\n        <div style=\"text-align: center;\">\r\n            <img src=\"https://geo.chokdeepalmoil.com/logolong.PNG\" alt=\"โลโก้โชคดี\" width=\"494px\" height=\"115px\">\r\n        </div>\r\n        <div class=\"header\">\r\n            <h1>ยินดีต้อนรับสู่แอปโชคดี</h1>\r\n        </div>\r\n        <div class=\"content\">\r\n            <h2>สวัสดี {{user_name}},</h2>\r\n            <p>ยินดีต้อนรับสู่แอปโชคดี! บัญชีของคุณได้ถูกสร้างเรียบร้อยแล้ว</p>\r\n            <p>เพื่อเริ่มต้นใช้งาน กรุณาตั้งรหัสผ่านของคุณโดยคลิกปุ่มด้านล่าง:</p>\r\n            \r\n            <div style=\"text-align: center;\">\r\n                <a href=\"{{setup_url}}\" class=\"button\">ตั้งรหัสผ่าน</a>\r\n            </div>\r\n            \r\n            <p>หากปุ่มไม่ทำงาน คุณสามารถคัดลอกและวางลิงก์นี้ลงในเบราว์เซอร์ของคุณ:</p>\r\n            <p style=\"word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px; font-family: monospace;\">\r\n                {{setup_url}}\r\n            </p>\r\n            \r\n            <p><strong>หมายเหตุ:</strong> ลิงก์นี้จะหมดอายุใน 24 ชั่วโมงเพื่อความปลอดภัย หากคุณไม่ได้ตั้งรหัสผ่านภายในเวลานี้ คุณจะต้องขอลิงก์ใหม่</p>\r\n        </div>\r\n        <div class=\"footer\">\r\n            <p>อีเมลนี้ส่งจากแอปโชคดี กรุณาอย่าตอบกลับอีเมลนี้</p>\r\n        </div>\r\n    </div>\r\n</body>\r\n</html>', 'ยินดีต้อนรับสู่แอปโชคดี!\r\n\r\nสวัสดี {{user_name}},\r\n\r\nยินดีต้อนรับสู่แอปโชคดี! บัญชีของคุณได้ถูกสร้างเรียบร้อยแล้ว\r\n\r\nเพื่อเริ่มต้นใช้งาน กรุณาตั้งรหัสผ่านของคุณโดยเยี่ยมชมลิงก์นี้:\r\n\r\n{{setup_url}}\r\n\r\nสำคัญ: ลิงก์นี้จะหมดอายุใน 24 ชั่วโมงเพื่อความปลอดภัย หากคุณไม่ได้ตั้งรหัสผ่านภายในเวลานี้ กรุณาติดต่อผู้ดูแลระบบ\r\n\r\nหากคุณไม่ได้คาดหวังอีเมลนี้ กรุณาเพิกเฉยหรือติดต่อฝ่ายสนับสนุน\r\n\r\nอีเมลนี้ส่งจากแอปโชคดี กรุณาอย่าตอบกลับอีเมลนี้', '{\"user_name\": \"ชื่อของผู้ใช้ที่รับอีเมล\", \"setup_url\": \"ลิงก์ URL สำหรับตั้งรหัสผ่าน\"}', 'เทมเพลตอีเมลที่ส่งให้ผู้ใช้ใหม่เพื่อตั้งรหัสผ่าน', 1, NOW(), NOW(), 1, 1, 'th', 1, 0),
('password_reset', 'รีเซ็ตรหัสผ่าน - แอปโชคดี', '<!DOCTYPE html>\r\n<html>\r\n<head>\r\n    <meta charset=\"UTF-8\">\r\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\r\n    <title>รีเซ็ตรหัสผ่าน - แอปโชคดี</title>\r\n    <style>\r\n        body { font-family: \'Segoe UI\', Tahoma, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }\r\n        .container { max-width: 600px; margin: 0 auto; padding: 20px; }\r\n        .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }\r\n        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }\r\n        .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }\r\n        .button:hover { background: #b91c1c; }\r\n        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }\r\n    </style>\r\n</head>\r\n<body>\r\n    <div class=\"container\">\r\n        <div style=\"text-align: center;\">\r\n            <img src=\"https://geo.chokdeepalmoil.com/logolong.PNG\" alt=\"โลโก้โชคดี\" width=\"494px\" height=\"115px\">\r\n        </div>\r\n        <div class=\"header\">\r\n            <h1>รีเซ็ตรหัสผ่าน</h1>\r\n        </div>\r\n        <div class=\"content\">\r\n            <h2>สวัสดี {{user_name}},</h2>\r\n            <p>เราได้รับคำขอให้รีเซ็ตรหัสผ่านสำหรับบัญชีแอปโชคดีของคุณ</p>\r\n            <p>เพื่อรีเซ็ตรหัสผ่าน กรุณาคลิกปุ่มด้านล่าง:</p>\r\n            \r\n            <div style=\"text-align: center;\">\r\n                <a href=\"{{reset_url}}\" class=\"button\">รีเซ็ตรหัสผ่าน</a>\r\n            </div>\r\n            \r\n            <p>หากปุ่มไม่ทำงาน คุณสามารถคัดลอกและวางลิงก์นี้ลงในเบราว์เซอร์ของคุณ:</p>\r\n            <p style=\"word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px; font-family: monospace;\">\r\n                {{reset_url}}\r\n            </p>\r\n            \r\n            <p><strong>หมายเหตุ:</strong> ลิงก์นี้จะหมดอายุใน 24 ชั่วโมงเพื่อความปลอดภัย หากคุณไม่ได้รีเซ็ตรหัสผ่านภายในเวลานี้ คุณจะต้องขอลิงก์รีเซ็ตใหม่</p>\r\n            \r\n            <p>หากคุณไม่ได้ขอรีเซ็ตรหัสผ่านนี้ กรุณาเพิกเฉยหรือติดต่อฝ่ายสนับสนุนหากมีข้อกังวล</p>\r\n        </div>\r\n        <div class=\"footer\">\r\n            <p>อีเมลนี้ส่งจากแอปโชคดี กรุณาอย่าตอบกลับอีเมลนี้</p>\r\n        </div>\r\n    </div>\r\n</body>\r\n</html>', 'รีเซ็ตรหัสผ่าน - แอปโชคดี\r\n\r\nสวัสดี {{user_name}},\r\n\r\nเราได้รับคำขอให้รีเซ็ตรหัสผ่านสำหรับบัญชีแอปโชคดีของคุณ\r\n\r\nเพื่อรีเซ็ตรหัสผ่าน กรุณาเยี่ยมชมลิงก์นี้:\r\n\r\n{{reset_url}}\r\n\r\nสำคัญ: ลิงก์นี้จะหมดอายุใน 24 ชั่วโมงเพื่อความปลอดภัย หากคุณไม่ได้รีเซ็ตรหัสผ่านภายในเวลานี้ คุณจะต้องขอลิงก์รีเซ็ตใหม่\r\n\r\nหากคุณไม่ได้ขอรีเซ็ตรหัสผ่านนี้ กรุณาเพิกเฉยหรือติดต่อฝ่ายสนับสนุนหากมีข้อกังวล\r\n\r\nอีเมลนี้ส่งจากแอปโชคดี กรุณาอย่าตอบกลับอีเมลนี้', '{\"user_name\": \"ชื่อของผู้ใช้ที่รับอีเมล\", \"reset_url\": \"ลิงก์ URL สำหรับรีเซ็ตรหัสผ่าน\"}', 'เทมเพลตอีเมลที่ส่งให้ผู้ใช้ที่ขอรีเซ็ตรหัสผ่าน', 1, NOW(), NOW(), 1, 1, 'th', 2, 0)
ON DUPLICATE KEY UPDATE 
    subject = VALUES(subject),
    html_content = VALUES(html_content),
    text_content = VALUES(text_content),
    variables = VALUES(variables),
    description = VALUES(description),
    updated_at = NOW(),
    updated_by = 1;

-- --------------------------------------------------------
-- 5. Create indexes for better performance
-- --------------------------------------------------------

-- Add indexes for email_templates table
CREATE INDEX IF NOT EXISTS `idx_email_templates_template_key` ON `email_templates` (`template_key`);
CREATE INDEX IF NOT EXISTS `idx_email_templates_language_code` ON `email_templates` (`language_code`);
CREATE INDEX IF NOT EXISTS `idx_email_templates_is_active` ON `email_templates` (`is_active`);

-- Add indexes for notification_logs table
CREATE INDEX IF NOT EXISTS `idx_notification_logs_notification_type` ON `notification_logs` (`notification_type`);
CREATE INDEX IF NOT EXISTS `idx_notification_logs_sent_at` ON `notification_logs` (`sent_at`);
CREATE INDEX IF NOT EXISTS `idx_notification_logs_created_by` ON `notification_logs` (`created_by`);

-- Add index for users language_code
CREATE INDEX IF NOT EXISTS `idx_users_language_code` ON `users` (`language_code`);

-- --------------------------------------------------------
-- 6. Insert migration records
-- --------------------------------------------------------

-- Insert migration records for existing migrations
INSERT INTO `schema_migrations` (`migration`, `batch`) VALUES
('001_create_navigation_menus_table.sql', 1),
('002_update_navigation_menus_dropdown.sql', 1),
('003_create_password_tokens_table.sql', 1),
('004_create_endpoint_permissions.sql', 1),
('005_create_email_template_table.sql', 1),
('006_production_sync_missing_tables.sql', 2)
ON DUPLICATE KEY UPDATE migration = VALUES(migration);

-- --------------------------------------------------------
-- 7. Verification queries (commented out - uncomment to verify)
-- --------------------------------------------------------

-- Verify tables exist
-- SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('email_templates', 'notification_logs', 'schema_migrations');

-- Verify email templates were inserted
-- SELECT COUNT(*) as template_count FROM email_templates;

-- Verify columns were added
-- SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'language_code';
-- SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'lands' AND COLUMN_NAME IN ('plant_year', 'harvest_cycle', 'palm_area', 'area_rai', 'area_ngan', 'area_tarangwa');

-- Commit the transaction
COMMIT;

-- Reset safe mode
SET SQL_SAFE_UPDATES = 0;

-- Success message
SELECT 'Production database update completed successfully!' as status;
