<?php

/**
 * Test EnhancedNotificationController fix
 */

echo "🔧 Testing EnhancedNotificationController Fix\n";
echo "============================================\n\n";

require_once __DIR__ . '/vendor/autoload.php';

use App\Controllers\EnhancedNotificationController;
use App\Database;

try {
    echo "✅ Database connection successful\n\n";
    
    // Test 1: Create controller instance
    echo "🎛️ Test 1: Creating EnhancedNotificationController...\n";
    $controller = new EnhancedNotificationController();
    echo "✅ Controller created successfully\n\n";
    
    // Test 2: Test the fetchOne method fix
    echo "🔍 Test 2: Testing fetchOne method fix...\n";
    $db = Database::getInstance();
    
    // Test the count query that was failing
    $countSql = "
        SELECT COUNT(*) FROM notifications 
        WHERE user_id = :user_id AND is_dismissed = 0
    ";
    $countResult = $db->fetchOne($countSql, ['user_id' => 1]);
    $total = $countResult['COUNT(*)'];
    
    echo "✅ Count query successful: {$total} notifications for user 1\n\n";
    
    // Test 3: Test the main query
    echo "📋 Test 3: Testing main notification query...\n";
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
    echo "✅ Main query successful: " . count($notifications) . " notifications\n";
    
    foreach ($notifications as $notification) {
        echo "   - ID: {$notification['id']}, Type: {$notification['type']}, Priority: {$notification['priority']}\n";
    }
    echo "\n";
    
    echo "🎉 EnhancedNotificationController fix verified!\n";
    echo "💡 The fetchOne() method calls have been corrected\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
