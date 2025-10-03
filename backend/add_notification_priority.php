<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Database;

try {
    $db = Database::getInstance();
    
    // Add priority column to notifications table
    $sql = "
        ALTER TABLE notifications 
        ADD COLUMN priority ENUM('low', 'medium', 'high') DEFAULT 'medium' AFTER message,
        ADD INDEX idx_notifications_priority (priority)
    ";
    
    $db->query($sql);
    echo "✅ Added priority column to notifications table\n";
    
    // Add new notification types
    $sql = "
        ALTER TABLE notifications 
        MODIFY COLUMN type ENUM(
            'harvest_due', 
            'harvest_overdue', 
            'maintenance_due', 
            'comment_added', 
            'photo_added',
            'weather_alert',
            'system',
            'bulk'
        ) NOT NULL
    ";
    
    $db->query($sql);
    echo "✅ Updated notification types\n";
    
    echo "🎉 Notification system enhanced successfully!\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
