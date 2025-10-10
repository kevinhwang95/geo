-- Add release notification email templates for English and Thai
-- Migration: 003_add_release_notification_templates.sql

-- Insert English release notification template
INSERT INTO `email_templates` (
    `template_key`, 
    `subject`, 
    `html_content`, 
    `text_content`, 
    `variables`, 
    `description`, 
    `is_active`, 
    `created_by`, 
    `updated_by`, 
    `language_code`, 
    `is_base_template`
) VALUES (
    'release_notification',
    'New Release Available - Chokdee App {{version}}',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Release - Chokdee App</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .version-badge { display: inline-block; background: #059669; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: bold; margin-bottom: 20px; }
        .release-notes { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        .highlight { color: #059669; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Release Available!</h1>
            <div class="version-badge">Version {{version}}</div>
        </div>
        <div class="content">
            <h2>Hello {{user_name}},</h2>
            <p>We are excited to announce the release of <span class="highlight">Chokdee App {{version}}</span>! This update brings several improvements and new features to enhance your experience.</p>
            
            <div class="release-notes">
                <h3 style="margin-top: 0; color: #059669;">What''s New in {{version}}:</h3>
                {{release_notes}}
            </div>
            
            <p><strong>Release Date:</strong> {{release_date}}</p>
            <p><strong>Release Type:</strong> {{release_type}}</p>
            
            <p>We encourage all administrators to review the changes and update your systems accordingly.</p>
        </div>
        <div class="footer">
            <p>This notification was sent to all system administrators.</p>
            <p>© 2025 Chokdee App. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
    'New Release Available - Chokdee App {{version}}

Hello {{user_name}},

We are excited to announce the release of Chokdee App {{version}}! This update brings several improvements and new features to enhance your experience.

What''s New in {{version}}:
{{release_notes}}

Release Date: {{release_date}}
Release Type: {{release_type}}

We encourage all administrators to review the changes and update your systems accordingly.

This notification was sent to all system administrators.

© 2025 Chokdee App. All rights reserved.',
    '["user_name", "version", "release_notes", "release_date", "release_type"]',
    'Email template for release notifications sent to admin users',
    1,
    1,
    1,
    ''en'',
    1
);

-- Insert Thai release notification template
INSERT INTO `email_templates` (
    `template_key`, 
    `subject`, 
    `html_content`, 
    `text_content`, 
    `variables`, 
    `description`, 
    `is_active`, 
    `created_by`, 
    `updated_by`, 
    `language_code`, 
    `base_template_id`, 
    `is_base_template`
) VALUES (
    'release_notification',
    'เวอร์ชันใหม่พร้อมใช้งาน - แอปโชคดี {{version}}',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>เวอร์ชันใหม่ - แอปโชคดี</title>
    <style>
        body { font-family: ''Sarabun'', ''Helvetica Neue'', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .version-badge { display: inline-block; background: #059669; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: bold; margin-bottom: 20px; }
        .release-notes { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        .highlight { color: #059669; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>เวอร์ชันใหม่พร้อมใช้งาน!</h1>
            <div class="version-badge">เวอร์ชัน {{version}}</div>
        </div>
        <div class="content">
            <h2>สวัสดี {{user_name}},</h2>
            <p>เรามีความยินดีที่จะประกาศเปิดตัว <span class="highlight">แอปโชคดี เวอร์ชัน {{version}}</span>! การอัปเดตนี้มาพร้อมกับการปรับปรุงและฟีเจอร์ใหม่ๆ เพื่อเพิ่มประสบการณ์การใช้งานที่ดีขึ้น</p>
            
            <div class="release-notes">
                <h3 style="margin-top: 0; color: #059669;">สิ่งใหม่ใน {{version}}:</h3>
                {{release_notes}}
            </div>
            
            <p><strong>วันที่เปิดตัว:</strong> {{release_date}}</p>
            <p><strong>ประเภทการอัปเดต:</strong> {{release_type}}</p>
            
            <p>เราขอแนะนำให้ผู้ดูแลระบบทุกท่านตรวจสอบการเปลี่ยนแปลงและอัปเดตระบบของท่านให้เหมาะสม</p>
        </div>
        <div class="footer">
            <p>การแจ้งเตือนนี้ถูกส่งไปยังผู้ดูแลระบบทุกท่าน</p>
            <p>© 2025 แอปโชคดี สงวนลิขสิทธิ์</p>
        </div>
    </div>
</body>
</html>',
    'เวอร์ชันใหม่พร้อมใช้งาน - แอปโชคดี {{version}}

สวัสดี {{user_name}},

เรามีความยินดีที่จะประกาศเปิดตัวแอปโชคดี เวอร์ชัน {{version}}! การอัปเดตนี้มาพร้อมกับการปรับปรุงและฟีเจอร์ใหม่ๆ เพื่อเพิ่มประสบการณ์การใช้งานที่ดีขึ้น

สิ่งใหม่ใน {{version}}:
{{release_notes}}

วันที่เปิดตัว: {{release_date}}
ประเภทการอัปเดต: {{release_type}}

เราขอแนะนำให้ผู้ดูแลระบบทุกท่านตรวจสอบการเปลี่ยนแปลงและอัปเดตระบบของท่านให้เหมาะสม

การแจ้งเตือนนี้ถูกส่งไปยังผู้ดูแลระบบทุกท่าน

© 2025 แอปโชคดี สงวนลิขสิทธิ์',
    '["user_name", "version", "release_notes", "release_date", "release_type"]',
    'Email template for release notifications sent to admin users (Thai)',
    1,
    1,
    1,
    ''th'',
    (SELECT id FROM email_templates WHERE template_key = ''release_notification'' AND language_code = ''en'' LIMIT 1),
    0
);

