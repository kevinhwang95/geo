<?php

/**
 * Test notifications API endpoint directly
 */

echo "🔍 Testing Notifications API Endpoint\n";
echo "=====================================\n\n";

// Test the EnhancedNotificationController directly
require_once __DIR__ . '/vendor/autoload.php';

use App\Controllers\EnhancedNotificationController;
use App\Auth;
use App\Database;

try {
    echo "✅ Database connection successful\n";
    
    // Test 1: Check if we can create the controller
    echo "🎛️ Test 1: Creating EnhancedNotificationController...\n";
    $controller = new EnhancedNotificationController();
    echo "✅ Controller created successfully\n\n";
    
    // Test 2: Check notifications in database
    echo "🗄️ Test 2: Checking notifications in database...\n";
    $db = Database::getInstance();
    $sql = "
        SELECT n.*, l.land_name, l.land_code
        FROM notifications n
        LEFT JOIN lands l ON n.land_id = l.id
        ORDER BY n.created_at DESC
        LIMIT 10
    ";
    $notifications = $db->fetchAll($sql);
    echo "✅ Found " . count($notifications) . " notifications in database:\n";
    foreach ($notifications as $notification) {
        echo "   - ID: {$notification['id']}, Type: {$notification['type']}, Title: {$notification['title']}\n";
        echo "     User ID: {$notification['user_id']}, Priority: {$notification['priority']}\n";
        echo "     Land: {$notification['land_name']} ({$notification['land_code']})\n\n";
    }
    
    // Test 3: Check users
    echo "👥 Test 3: Checking users...\n";
    $users = $db->fetchAll('SELECT id, first_name, last_name, role FROM users WHERE is_active = 1 LIMIT 5');
    echo "✅ Found " . count($users) . " active users:\n";
    foreach ($users as $user) {
        echo "   - ID: {$user['id']}, Name: {$user['first_name']} {$user['last_name']}, Role: {$user['role']}\n";
    }
    echo "\n";
    
    // Test 4: Check notifications for specific user
    echo "🔍 Test 4: Checking notifications for user ID 1...\n";
    $userNotifications = $db->fetchAll("
        SELECT n.*, l.land_name, l.land_code
        FROM notifications n
        LEFT JOIN lands l ON n.land_id = l.id
        WHERE n.user_id = 1
        ORDER BY n.created_at DESC
    ");
    echo "✅ Found " . count($userNotifications) . " notifications for user 1:\n";
    foreach ($userNotifications as $notification) {
        echo "   - ID: {$notification['id']}, Type: {$notification['type']}, Title: {$notification['title']}\n";
        echo "     Priority: {$notification['priority']}, Read: " . ($notification['is_read'] ? 'Yes' : 'No') . "\n";
    }
    echo "\n";
    
    echo "🎉 Database tests completed successfully!\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
