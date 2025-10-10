-- Development Enhancements Migration
-- This migration adds features that exist in development but not in production
-- Generated at: 2025-10-10 02:05:00

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- Add missing columns to existing tables
-- --------------------------------------------------------

-- Add translation_key column to categories table
ALTER TABLE `categories` 
ADD COLUMN `translation_key` varchar(100) DEFAULT NULL AFTER `name`;

-- Add translation_key column to plant_types table  
ALTER TABLE `plant_types`
ADD COLUMN `translation_key` varchar(100) DEFAULT NULL AFTER `name`;

-- Add palm_area column to lands table for Thai area calculations
ALTER TABLE `lands` 
ADD COLUMN `palm_area` decimal(15,3) DEFAULT NULL COMMENT 'Area used for palm growing in rai' AFTER `size`;

-- Update lands table size precision to match development
ALTER TABLE `lands` 
MODIFY COLUMN `size` decimal(15,3) NOT NULL COMMENT 'Area in square meters';

-- --------------------------------------------------------
-- Create email_templates table (missing in production)
-- --------------------------------------------------------

CREATE TABLE `email_templates` (
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

-- --------------------------------------------------------
-- Create notification_logs table (missing in production)
-- --------------------------------------------------------

CREATE TABLE `notification_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `notification_type` varchar(50) NOT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `success_count` int(11) DEFAULT 0,
  `failure_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notification_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Create schema_migrations table for migration tracking
-- --------------------------------------------------------

CREATE TABLE `schema_migrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  `executed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `migration` (`migration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Create supported_languages table (missing in production)
-- --------------------------------------------------------

CREATE TABLE `supported_languages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `language_code` varchar(5) NOT NULL,
  `language_name` varchar(100) NOT NULL,
  `native_name` varchar(100) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_rtl` tinyint(1) DEFAULT 0 COMMENT 'Right-to-left language support',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `language_code` (`language_code`),
  KEY `idx_language_code` (`language_code`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Supported languages for the application';

-- --------------------------------------------------------
-- Insert default supported languages
-- --------------------------------------------------------

INSERT INTO `supported_languages` (`language_code`, `language_name`, `native_name`, `is_active`, `is_rtl`) VALUES
('en', 'English', 'English', 1, 0),
('th', 'Thai', 'ไทย', 1, 0);

-- --------------------------------------------------------
-- Insert default email templates
-- --------------------------------------------------------

INSERT INTO `email_templates` (`template_key`, `subject`, `html_content`, `text_content`, `variables`, `description`, `is_active`, `created_by`, `updated_by`, `language_code`, `is_base_template`) VALUES
('password_setup', 'Welcome to Chokdee App - Set Up Your Password', 
'<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Chokdee App</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #7c3aed; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .button:hover { background: #6d28d9; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Chokdee App!</h1>
        </div>
        <div class="content">
            <h2>Hello {{user_name}},</h2>
            <p>Welcome to Chokdee App! Your account has been created and you are ready to get started.</p>
            <p>To complete your registration, please set up your password by clicking the button below:</p>
            
            <div style="text-align: center;">
                <a href="{{setup_url}}" class="button">Set Up My Password</a>
            </div>
            
            <div class="warning">
                <strong>Important:</strong> This link will expire in 24 hours for security reasons. If you do not set up your password within this time, please contact your administrator.
            </div>
            
            <p>If the button does not work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px; font-family: monospace;">
                {{setup_url}}
            </p>
            
            <p>If you did not expect this email, please ignore it or contact support.</p>
        </div>
        <div class="footer">
            <p>This email was sent from Chokdee App. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>', 
'Welcome to Chokdee App!

Hello {{user_name}},

Welcome to Chokdee App! Your account has been created and you are ready to get started.

To complete your registration, please set up your password by visiting this link:

{{setup_url}}

IMPORTANT: This link will expire in 24 hours for security reasons. If you do not set up your password within this time, please contact your administrator.

If you did not expect this email, please ignore it or contact support.

This email was sent from Chokdee App. Please do not reply to this email.', 
'{"user_name": "The name of the user receiving the email", "setup_url": "The password setup URL link"}', 
'Email template sent to new users to set up their password', 1, 1, 1, 'en', 1),

('password_reset', 'Reset Your Password - Chokdee App', 
'<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - Chokdee App</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .button:hover { background: #b91c1c; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Reset Your Password</h1>
        </div>
        <div class="content">
            <h2>Hello {{user_name}},</h2>
            <p>We received a request to reset your password for your Chokdee App account.</p>
            <p>To reset your password, please click the button below:</p>
            
            <div style="text-align: center;">
                <a href="{{reset_url}}" class="button">Reset My Password</a>
            </div>
            
            <div class="warning">
                <strong>Important:</strong> This link will expire in 24 hours for security reasons. If you do not reset your password within this time, you will need to request a new reset link.
            </div>
            
            <p>If the button does not work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px; font-family: monospace;">
                {{reset_url}}
            </p>
            
            <p>If you did not request this password reset, please ignore this email or contact support if you have concerns.</p>
        </div>
        <div class="footer">
            <p>This email was sent from Chokdee App. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>', 
'Reset Your Password - Chokdee App

Hello {{user_name}},

We received a request to reset your password for your Chokdee App account.

To reset your password, please visit this link:

{{reset_url}}

IMPORTANT: This link will expire in 24 hours for security reasons. If you do not reset your password within this time, you will need to request a new reset link.

If you did not request this password reset, please ignore this email or contact support if you have concerns.

This email was sent from Chokdee App. Please do not reply to this email.', 
'{"user_name": "The name of the user receiving the email", "reset_url": "The password reset URL link"}', 
'Email template sent to users who request a password reset', 1, 1, 1, 'en', 1);

-- --------------------------------------------------------
-- Insert Thai email templates
-- --------------------------------------------------------

INSERT INTO `email_templates` (`template_key`, `subject`, `html_content`, `text_content`, `variables`, `description`, `is_active`, `created_by`, `updated_by`, `language_code`, `base_template_id`, `is_base_template`) VALUES
('password_setup', 'ยินดีต้อนรับสู่แอปโชคดี - ตั้งรหัสผ่านของคุณ', 
'<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ยินดีต้อนรับสู่แอปโชคดี</title>
    <style>
        body { font-family: \'Segoe UI\', Tahoma, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #7c3aed; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .button:hover { background: #6d28d9; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div style="text-align: center;">
            <img src="https://geo.chokdeepalmoil.com/logolong.PNG" alt="โลโก้โชคดี" width="494px" height="115px">
        </div>
        <div class="header">
            <h1>ยินดีต้อนรับสู่แอปโชคดี</h1>
        </div>
        <div class="content">
            <h2>สวัสดี {{user_name}},</h2>
            <p>ยินดีต้อนรับสู่แอปโชคดี! บัญชีของคุณได้ถูกสร้างเรียบร้อยแล้ว</p>
            <p>เพื่อเริ่มต้นใช้งาน กรุณาตั้งรหัสผ่านของคุณโดยคลิกปุ่มด้านล่าง:</p>
            
            <div style="text-align: center;">
                <a href="{{setup_url}}" class="button">ตั้งรหัสผ่าน</a>
            </div>
            
            <p>หากปุ่มไม่ทำงาน คุณสามารถคัดลอกและวางลิงก์นี้ลงในเบราว์เซอร์ของคุณ:</p>
            <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px; font-family: monospace;">
                {{setup_url}}
            </p>
            
            <p><strong>หมายเหตุ:</strong> ลิงก์นี้จะหมดอายุใน 24 ชั่วโมงเพื่อความปลอดภัย หากคุณไม่ได้ตั้งรหัสผ่านภายในเวลานี้ คุณจะต้องขอลิงก์ใหม่</p>
        </div>
        <div class="footer">
            <p>อีเมลนี้ส่งจากแอปโชคดี กรุณาอย่าตอบกลับอีเมลนี้</p>
        </div>
    </div>
</body>
</html>', 
'ยินดีต้อนรับสู่แอปโชคดี!

สวัสดี {{user_name}},

ยินดีต้อนรับสู่แอปโชคดี! บัญชีของคุณได้ถูกสร้างเรียบร้อยแล้ว

เพื่อเริ่มต้นใช้งาน กรุณาตั้งรหัสผ่านของคุณโดยเยี่ยมชมลิงก์นี้:

{{setup_url}}

สำคัญ: ลิงก์นี้จะหมดอายุใน 24 ชั่วโมงเพื่อความปลอดภัย หากคุณไม่ได้ตั้งรหัสผ่านภายในเวลานี้ กรุณาติดต่อผู้ดูแลระบบ

หากคุณไม่ได้คาดหวังอีเมลนี้ กรุณาเพิกเฉยหรือติดต่อฝ่ายสนับสนุน

อีเมลนี้ส่งจากแอปโชคดี กรุณาอย่าตอบกลับอีเมลนี้', 
'{"user_name": "ชื่อของผู้ใช้ที่รับอีเมล", "setup_url": "ลิงก์ URL สำหรับตั้งรหัสผ่าน"}', 
'เทมเพลตอีเมลที่ส่งให้ผู้ใช้ใหม่เพื่อตั้งรหัสผ่าน', 1, 1, 1, 'th', 1, 0),

('password_reset', 'รีเซ็ตรหัสผ่าน - แอปโชคดี', 
'<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>รีเซ็ตรหัสผ่าน - แอปโชคดี</title>
    <style>
        body { font-family: \'Segoe UI\', Tahoma, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .button:hover { background: #b91c1c; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div style="text-align: center;">
            <img src="https://geo.chokdeepalmoil.com/logolong.PNG" alt="โลโก้โชคดี" width="494px" height="115px">
        </div>
        <div class="header">
            <h1>รีเซ็ตรหัสผ่าน</h1>
        </div>
        <div class="content">
            <h2>สวัสดี {{user_name}},</h2>
            <p>เราได้รับคำขอให้รีเซ็ตรหัสผ่านสำหรับบัญชีแอปโชคดีของคุณ</p>
            <p>เพื่อรีเซ็ตรหัสผ่าน กรุณาคลิกปุ่มด้านล่าง:</p>
            
            <div style="text-align: center;">
                <a href="{{reset_url}}" class="button">รีเซ็ตรหัสผ่าน</a>
            </div>
            
            <p>หากปุ่มไม่ทำงาน คุณสามารถคัดลอกและวางลิงก์นี้ลงในเบราว์เซอร์ของคุณ:</p>
            <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px; font-family: monospace;">
                {{reset_url}}
            </p>
            
            <p><strong>หมายเหตุ:</strong> ลิงก์นี้จะหมดอายุใน 24 ชั่วโมงเพื่อความปลอดภัย หากคุณไม่ได้รีเซ็ตรหัสผ่านภายในเวลานี้ คุณจะต้องขอลิงก์รีเซ็ตใหม่</p>
            
            <p>หากคุณไม่ได้ขอรีเซ็ตรหัสผ่านนี้ กรุณาเพิกเฉยหรือติดต่อฝ่ายสนับสนุนหากมีข้อกังวล</p>
        </div>
        <div class="footer">
            <p>อีเมลนี้ส่งจากแอปโชคดี กรุณาอย่าตอบกลับอีเมลนี้</p>
        </div>
    </div>
</body>
</html>', 
'รีเซ็ตรหัสผ่าน - แอปโชคดี

สวัสดี {{user_name}},

เราได้รับคำขอให้รีเซ็ตรหัสผ่านสำหรับบัญชีแอปโชคดีของคุณ

เพื่อรีเซ็ตรหัสผ่าน กรุณาเยี่ยมชมลิงก์นี้:

{{reset_url}}

สำคัญ: ลิงก์นี้จะหมดอายุใน 24 ชั่วโมงเพื่อความปลอดภัย หากคุณไม่ได้รีเซ็ตรหัสผ่านภายในเวลานี้ คุณจะต้องขอลิงก์รีเซ็ตใหม่

หากคุณไม่ได้ขอรีเซ็ตรหัสผ่านนี้ กรุณาเพิกเฉยหรือติดต่อฝ่ายสนับสนุนหากมีข้อกังวล

อีเมลนี้ส่งจากแอปโชคดี กรุณาอย่าตอบกลับอีเมลนี้', 
'{"user_name": "ชื่อของผู้ใช้ที่รับอีเมล", "reset_url": "ลิงก์ URL สำหรับรีเซ็ตรหัสผ่าน"}', 
'เทมเพลตอีเมลที่ส่งให้ผู้ใช้ที่ขอรีเซ็ตรหัสผ่าน', 1, 1, 1, 'th', 2, 0);

-- --------------------------------------------------------
-- Record migration execution
-- --------------------------------------------------------

INSERT INTO `schema_migrations` (`migration`, `batch`) VALUES
('001_production_schema_seed.sql', 1),
('002_development_enhancements.sql', 2);

COMMIT;


