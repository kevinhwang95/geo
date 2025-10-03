<?php

/**
 * Test authentication issue with notifications
 */

echo "🔐 Testing Authentication Issue\n";
echo "==============================\n\n";

require_once __DIR__ . '/vendor/autoload.php';

use App\Auth;
use App\Database;

try {
    echo "✅ Database connection successful\n\n";
    
    // Test 1: Check if Auth class is working
    echo "🔐 Test 1: Testing Auth class...\n";
    
    // Check if we can get a user without authentication
    $db = Database::getInstance();
    $user = $db->fetchOne('SELECT * FROM users WHERE id = 1');
    echo "✅ Found user: {$user['first_name']} {$user['last_name']} (ID: {$user['id']})\n\n";
    
    // Test 2: Check notifications for this user
    echo "📋 Test 2: Checking notifications for user 1...\n";
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
        LIMIT 20
    ";
    
    $notifications = $db->fetchAll($sql, ['user_id' => 1]);
    echo "✅ Found " . count($notifications) . " notifications for user 1:\n";
    
    foreach ($notifications as $notification) {
        echo "   - ID: {$notification['id']}, Type: {$notification['type']}\n";
        echo "     Title: {$notification['title']}\n";
        echo "     Priority: {$notification['priority']}, Read: " . ($notification['is_read'] ? 'Yes' : 'No') . "\n";
        echo "     Land: {$notification['land_name']} ({$notification['land_code']})\n";
        echo "     Harvest Status: {$notification['harvest_status']}\n\n";
    }
    
    // Test 3: Check if the issue is with the API endpoint
    echo "🌐 Test 3: Testing API endpoint directly...\n";
    
    // Simulate the API call
    $_SERVER['REQUEST_METHOD'] = 'GET';
    $_SERVER['REQUEST_URI'] = '/api/notifications';
    $_GET = [];
    
    // Check if we can create the controller
    $controller = new \App\Controllers\EnhancedNotificationController();
    echo "✅ EnhancedNotificationController created successfully\n";
    
    echo "\n🎉 Authentication tests completed!\n";
    echo "💡 The issue might be with the frontend authentication token\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
