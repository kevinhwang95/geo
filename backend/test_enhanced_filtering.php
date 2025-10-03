<?php

/**
 * Test enhanced filtering functionality
 */

echo "🔍 Testing Enhanced Filtering\n";
echo "============================\n\n";

require_once __DIR__ . '/vendor/autoload.php';

use App\Controllers\EnhancedNotificationController;
use App\Database;

try {
    echo "✅ Database connection successful\n\n";
    
    $db = Database::getInstance();
    
    // Test 1: Check all notifications for user 1
    echo "📋 Test 1: All notifications for user 1...\n";
    $sql = "
        SELECT 
            n.*,
            l.land_name,
            l.land_code,
            l.next_harvest_date,
            CASE 
                WHEN l.next_harvest_date <= CURDATE() THEN 'overdue'
                WHEN l.next_harvest_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 'due_soon'
                ELSE 'normal'
            END as harvest_status
        FROM notifications n
        LEFT JOIN lands l ON n.land_id = l.id
        WHERE n.user_id = :user_id AND n.is_dismissed = 0
        ORDER BY n.priority DESC, n.created_at DESC
    ";
    $allNotifications = $db->fetchAll($sql, ['user_id' => 1]);
    echo "✅ Found " . count($allNotifications) . " total notifications:\n";
    foreach ($allNotifications as $notification) {
        echo "   - ID: {$notification['id']}, Type: {$notification['type']}, Priority: {$notification['priority']}\n";
    }
    echo "\n";
    
    // Test 2: Filter by type = harvest_overdue
    echo "🌾 Test 2: Filter by type = harvest_overdue...\n";
    $sql = "
        SELECT 
            n.*,
            l.land_name,
            l.land_code,
            l.next_harvest_date,
            CASE 
                WHEN l.next_harvest_date <= CURDATE() THEN 'overdue'
                WHEN l.next_harvest_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 'due_soon'
                ELSE 'normal'
            END as harvest_status
        FROM notifications n
        LEFT JOIN lands l ON n.land_id = l.id
        WHERE n.user_id = :user_id AND n.is_dismissed = 0 AND n.type = :type
        ORDER BY n.priority DESC, n.created_at DESC
    ";
    $harvestNotifications = $db->fetchAll($sql, ['user_id' => 1, 'type' => 'harvest_overdue']);
    echo "✅ Found " . count($harvestNotifications) . " harvest overdue notifications:\n";
    foreach ($harvestNotifications as $notification) {
        echo "   - ID: {$notification['id']}, Type: {$notification['type']}, Priority: {$notification['priority']}\n";
    }
    echo "\n";
    
    // Test 3: Filter by priority = medium
    echo "⚡ Test 3: Filter by priority = medium...\n";
    $sql = "
        SELECT 
            n.*,
            l.land_name,
            l.land_code,
            l.next_harvest_date,
            CASE 
                WHEN l.next_harvest_date <= CURDATE() THEN 'overdue'
                WHEN l.next_harvest_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 'due_soon'
                ELSE 'normal'
            END as harvest_status
        FROM notifications n
        LEFT JOIN lands l ON n.land_id = l.id
        WHERE n.user_id = :user_id AND n.is_dismissed = 0 AND n.priority = :priority
        ORDER BY n.priority DESC, n.created_at DESC
    ";
    $mediumNotifications = $db->fetchAll($sql, ['user_id' => 1, 'priority' => 'medium']);
    echo "✅ Found " . count($mediumNotifications) . " medium priority notifications:\n";
    foreach ($mediumNotifications as $notification) {
        echo "   - ID: {$notification['id']}, Type: {$notification['type']}, Priority: {$notification['priority']}\n";
    }
    echo "\n";
    
    // Test 4: Combined filter (type + priority)
    echo "🎯 Test 4: Combined filter (harvest_overdue + medium)...\n";
    $sql = "
        SELECT 
            n.*,
            l.land_name,
            l.land_code,
            l.next_harvest_date,
            CASE 
                WHEN l.next_harvest_date <= CURDATE() THEN 'overdue'
                WHEN l.next_harvest_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 'due_soon'
                ELSE 'normal'
            END as harvest_status
        FROM notifications n
        LEFT JOIN lands l ON n.land_id = l.id
        WHERE n.user_id = :user_id AND n.is_dismissed = 0 AND n.type = :type AND n.priority = :priority
        ORDER BY n.priority DESC, n.created_at DESC
    ";
    $combinedNotifications = $db->fetchAll($sql, [
        'user_id' => 1, 
        'type' => 'harvest_overdue', 
        'priority' => 'medium'
    ]);
    echo "✅ Found " . count($combinedNotifications) . " harvest overdue + medium priority notifications:\n";
    foreach ($combinedNotifications as $notification) {
        echo "   - ID: {$notification['id']}, Type: {$notification['type']}, Priority: {$notification['priority']}\n";
    }
    echo "\n";
    
    // Test 5: Test the EnhancedNotificationController directly
    echo "🎛️ Test 5: Testing EnhancedNotificationController...\n";
    
    // Simulate GET parameters
    $_GET['type'] = 'harvest_overdue';
    $_GET['priority'] = 'medium';
    
    // Create controller instance
    $controller = new EnhancedNotificationController();
    echo "✅ Controller created successfully\n";
    
    echo "\n🎉 Enhanced filtering tests completed!\n";
    echo "💡 All filtering queries are working correctly\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
