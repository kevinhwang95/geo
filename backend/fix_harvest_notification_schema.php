<?php
/**
 * Fix Harvest Notification Schema
 * 
 * This script adds the missing columns needed for harvest notifications
 * to work properly. It's safe to run multiple times as it checks for
 * existing columns before adding them.
 * 
 * Usage: php fix_harvest_notification_schema.php
 */

require_once 'vendor/autoload.php';
use Dotenv\Dotenv;
use App\Database;

// Load environment variables
try {
    $dotenv = Dotenv::createImmutable(__DIR__);
    $dotenv->load();
} catch (Exception $e) {
    error_log('Dotenv parsing warning: ' . $e->getMessage());
}

echo "=== Fixing Harvest Notification Schema ===\n\n";

try {
    $db = Database::getInstance();
    
    // Function to check if column exists
    function columnExists($db, $table, $column) {
        $sql = "SELECT COUNT(*) as count 
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = :table 
                AND COLUMN_NAME = :column";
        
        $result = $db->fetchOne($sql, [
            'table' => $table,
            'column' => $column
        ]);
        
        return $result['count'] > 0;
    }
    
    // Fix notifications table
    echo "Checking notifications table...\n";
    
    if (!columnExists($db, 'notifications', 'metadata')) {
        echo "  Adding metadata column to notifications...\n";
        $db->query("ALTER TABLE notifications 
                    ADD COLUMN metadata JSON NULL 
                    COMMENT 'Additional metadata for notification'
                    AFTER message");
        echo "  ✓ metadata column added\n";
    } else {
        echo "  ✓ metadata column already exists\n";
    }
    
    if (!columnExists($db, 'notifications', 'is_active')) {
        echo "  Adding is_active column to notifications...\n";
        $db->query("ALTER TABLE notifications 
                    ADD COLUMN is_active tinyint(1) DEFAULT 1
                    COMMENT 'Whether this notification is active'
                    AFTER is_dismissed");
        echo "  ✓ is_active column added\n";
    } else {
        echo "  ✓ is_active column already exists\n";
    }
    
    if (!columnExists($db, 'notifications', 'status')) {
        echo "  Adding status column to notifications...\n";
        $db->query("ALTER TABLE notifications 
                    ADD COLUMN status enum(
                        'pending',
                        'in_progress',
                        'completed',
                        'dismissed'
                    ) DEFAULT 'pending'
                    COMMENT 'Current status of the notification'");
        echo "  ✓ status column added\n";
    } else {
        echo "  ✓ status column already exists\n";
    }
    
    if (!columnExists($db, 'notifications', 'created_by')) {
        echo "  Adding created_by column to notifications...\n";
        $db->query("ALTER TABLE notifications 
                    ADD COLUMN created_by int(11) DEFAULT NULL
                    COMMENT 'User who created the notification'
                    AFTER user_id");
        echo "  ✓ created_by column added\n";
    } else {
        echo "  ✓ created_by column already exists\n";
    }
    
    // Update notification type enum to include 'harvest'
    echo "  Updating notification type enum...\n";
    try {
        $db->query("ALTER TABLE notifications 
                    MODIFY COLUMN type enum(
                        'harvest_due',
                        'harvest_overdue',
                        'maintenance_due',
                        'comment_added',
                        'photo_added',
                        'harvest',
                        'work_assigned',
                        'work_completed',
                        'general'
                    ) NOT NULL DEFAULT 'general'");
        echo "  ✓ notification type enum updated\n";
    } catch (Exception $e) {
        echo "  ⚠ Could not update type enum (this is OK if it already includes 'harvest'): " . $e->getMessage() . "\n";
    }
    
    // Fix farm_works table
    echo "\nChecking farm_works table...\n";
    
    // Check if farm_works table exists
    $tableExists = $db->fetchOne("SELECT COUNT(*) as count 
                                   FROM information_schema.TABLES 
                                   WHERE TABLE_SCHEMA = DATABASE() 
                                   AND TABLE_NAME = 'farm_works'");
    
    if ($tableExists['count'] > 0) {
        if (!columnExists($db, 'farm_works', 'metadata')) {
            echo "  Adding metadata column to farm_works...\n";
            $db->query("ALTER TABLE farm_works 
                        ADD COLUMN metadata JSON NULL 
                        COMMENT 'Additional metadata for farm work'");
            echo "  ✓ metadata column added\n";
        } else {
            echo "  ✓ metadata column already exists\n";
        }
        
        // Add standard indexes for better query performance
        // Note: MariaDB doesn't support functional indexes on JSON expressions
        echo "  Adding indexes for farm_works queries...\n";
        try {
            $db->query("CREATE INDEX IF NOT EXISTS idx_farm_works_land_type ON farm_works(land_id, work_type_id)");
            $db->query("CREATE INDEX IF NOT EXISTS idx_farm_works_status_priority ON farm_works(status, priority_level)");
            $db->query("CREATE INDEX IF NOT EXISTS idx_farm_works_due_date ON farm_works(due_date, status)");
            echo "  ✓ farm_works indexes added\n";
        } catch (Exception $e) {
            echo "  ⚠ Could not add indexes (may already exist): " . $e->getMessage() . "\n";
        }
    } else {
        echo "  ⚠ farm_works table does not exist yet\n";
    }
    
    // Add standard indexes for notifications table
    echo "\nAdding indexes for notifications table...\n";
    try {
        $db->query("CREATE INDEX IF NOT EXISTS idx_notifications_land_type ON notifications(land_id, type)");
        $db->query("CREATE INDEX IF NOT EXISTS idx_notifications_type_priority ON notifications(type, priority)");
        $db->query("CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read)");
        $db->query("CREATE INDEX IF NOT EXISTS idx_notifications_active ON notifications(is_active, created_at)");
        echo "✓ Notification indexes added\n";
    } catch (Exception $e) {
        echo "⚠ Could not add indexes (may already exist): " . $e->getMessage() . "\n";
    }
    
    // Update existing NULL metadata to empty JSON objects
    echo "\nUpdating existing NULL metadata values...\n";
    $db->query("UPDATE notifications SET metadata = JSON_OBJECT() WHERE metadata IS NULL");
    
    if ($tableExists['count'] > 0) {
        $db->query("UPDATE farm_works SET metadata = JSON_OBJECT() WHERE metadata IS NULL");
    }
    echo "✓ NULL metadata values updated\n";
    
    echo "\n=== Schema Fix Completed Successfully ===\n";
    echo "\nYou can now run the harvest notification check again.\n";
    
} catch (Exception $e) {
    echo "\n✗ Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    exit(1);
}
?>

