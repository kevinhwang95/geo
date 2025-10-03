<?php

/**
 * Test script for notification system
 * This script tests various notification endpoints
 */

require_once __DIR__ . '/vendor/autoload.php';

use App\NotificationService;
use App\Database;

echo "🧪 Testing Notification System\n";
echo "=============================\n\n";

try {
    $db = Database::getInstance();
    echo "✅ Database connection successful\n\n";
    
    $notificationService = new NotificationService();
    echo "✅ NotificationService initialized\n\n";
    
    // Test 1: Create harvest notifications
    echo "🌾 Test 1: Creating harvest notifications...\n";
    $harvestCount = $notificationService->createHarvestNotifications();
    echo "✅ Created {$harvestCount} harvest notifications\n\n";
    
    // Test 2: Create maintenance notification
    echo "🔧 Test 2: Creating maintenance notification...\n";
    $maintenanceId = $notificationService->createMaintenanceNotification(
        9, // land_id (Test land)
        1, // user_id (System Administrator)
        'Fertilizer Application',
        '2025-10-15'
    );
    echo "✅ Created maintenance notification with ID: {$maintenanceId}\n\n";
    
    // Test 3: Create comment notification
    echo "💬 Test 3: Creating comment notification...\n";
    $commentId = $notificationService->createCommentNotification(
        10, // land_id (Test Field Updated)
        2, // user_id (John Doe)
        'John Doe',
        'Applied fertilizer today, looking good!'
    );
    echo "✅ Created comment notification with ID: {$commentId}\n\n";
    
    // Test 4: Create photo notification
    echo "📸 Test 4: Creating photo notification...\n";
    $photoId = $notificationService->createPhotoNotification(
        12, // land_id (Test001)
        3, // user_id (Jane Smith)
        'Jane Smith'
    );
    echo "✅ Created photo notification with ID: {$photoId}\n\n";
    
    // Test 5: Create weather alert
    echo "🌦️ Test 5: Creating weather alert...\n";
    $weatherId = $notificationService->createWeatherAlert(
        13, // land_id (Test22)
        4, // user_id (Bob Johnson)
        'Heavy Rain',
        'high'
    );
    echo "✅ Created weather alert with ID: {$weatherId}\n\n";
    
    // Test 6: Get notification statistics
    echo "📊 Test 6: Getting notification statistics...\n";
    $stats = $notificationService->getNotificationStats(1); // user_id = 1
    echo "✅ Notification statistics:\n";
    foreach ($stats as $stat) {
        echo "   - {$stat['type']}: {$stat['count']} total, {$stat['unread_count']} unread\n";
    }
    echo "\n";
    
    // Test 7: Check notifications in database
    echo "🗄️ Test 7: Checking notifications in database...\n";
    $sql = "
        SELECT n.*, l.land_name, l.land_code
        FROM notifications n
        LEFT JOIN lands l ON n.land_id = l.id
        WHERE n.user_id = 1
        ORDER BY n.created_at DESC
        LIMIT 10
    ";
    $notifications = $db->fetchAll($sql);
    echo "✅ Found " . count($notifications) . " notifications for user 1:\n";
    foreach ($notifications as $notification) {
        echo "   - ID: {$notification['id']}, Type: {$notification['type']}, Title: {$notification['title']}\n";
        echo "     Priority: {$notification['priority']}, Read: " . ($notification['is_read'] ? 'Yes' : 'No') . "\n";
        echo "     Land: {$notification['land_name']} ({$notification['land_code']})\n\n";
    }
    
    echo "🎉 All notification tests completed successfully!\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
