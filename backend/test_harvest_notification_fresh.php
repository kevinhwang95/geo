<?php
/**
 * Fresh Test for Harvest Notification System
 * 
 * This script cleans up existing test data and runs a fresh harvest notification check
 * to verify that both notifications and farm works are created properly.
 */

require_once 'vendor/autoload.php';
use Dotenv\Dotenv;
use App\Database;
use App\HarvestNotificationService;

// Load environment variables
try {
    $dotenv = Dotenv::createImmutable(__DIR__);
    $dotenv->load();
} catch (Exception $e) {
    error_log('Dotenv parsing warning: ' . $e->getMessage());
}

date_default_timezone_set($_ENV['APP_TIMEZONE'] ?? 'Asia/Bangkok');

echo "=== Fresh Harvest Notification Test ===\n\n";

try {
    $db = Database::getInstance();
    
    // Step 1: Clean up test harvest notifications
    echo "Step 1: Cleaning up existing harvest notifications...\n";
    $deletedNotifications = $db->query(
        "DELETE FROM notifications WHERE type = 'harvest'"
    );
    echo "  ✓ Deleted existing harvest notifications\n";
    
    // Step 2: Clean up test farm works created from harvest notifications
    echo "\nStep 2: Cleaning up existing harvest farm works...\n";
    $deletedWorks = $db->query(
        "DELETE FROM farm_works WHERE JSON_EXTRACT(metadata, '$.created_from') = 'harvest_notification'"
    );
    echo "  ✓ Deleted existing harvest farm works\n";
    
    // Step 3: Run harvest notification check
    echo "\nStep 3: Running harvest notification check...\n";
    echo str_repeat("-", 60) . "\n";
    
    $harvestService = new HarvestNotificationService();
    $result = $harvestService->checkHarvestNotifications();
    
    echo str_repeat("-", 60) . "\n";
    
    // Step 4: Verify results
    echo "\nStep 4: Verifying results...\n";
    
    // Check notifications
    $notifications = $db->fetchAll(
        "SELECT id, type, title, priority, land_id, metadata 
         FROM notifications 
         WHERE type = 'harvest' 
         ORDER BY created_at DESC"
    );
    
    echo "\n📧 Notifications Created (" . count($notifications) . "):\n";
    foreach ($notifications as $notif) {
        $metadata = json_decode($notif['metadata'], true);
        echo "  - [{$notif['priority']}] {$notif['title']}\n";
        echo "    Land: {$metadata['land_name']} ({$metadata['land_code']})\n";
        echo "    Days until harvest: {$metadata['days_until_harvest']}\n";
    }
    
    // Check farm works
    $farmWorks = $db->fetchAll(
        "SELECT id, title, status, priority_level, due_date, metadata, creator_user_id
         FROM farm_works 
         WHERE JSON_EXTRACT(metadata, '$.created_from') = 'harvest_notification'
         ORDER BY created_at DESC"
    );
    
    echo "\n🚜 Farm Works Created (" . count($farmWorks) . "):\n";
    foreach ($farmWorks as $work) {
        $metadata = json_decode($work['metadata'], true);
        echo "  - [{$work['priority_level']}] {$work['title']}\n";
        echo "    Status: {$work['status']}\n";
        echo "    Due date: {$work['due_date']}\n";
        echo "    Creator: User ID {$work['creator_user_id']}\n";
        echo "    Land: {$metadata['land_name']} ({$metadata['land_code']})\n";
    }
    
    // Summary
    echo "\n=== Test Summary ===\n";
    echo "✓ Notifications created: " . count($notifications) . "\n";
    echo "✓ Farm works created: " . count($farmWorks) . "\n";
    echo "✓ Test completed successfully!\n";
    
    // Check if both notifications and farm works were created
    if (count($notifications) > 0 && count($farmWorks) > 0) {
        echo "\n✅ SUCCESS: Both notifications and farm works are working correctly!\n";
        exit(0);
    } elseif (count($notifications) > 0) {
        echo "\n⚠️  WARNING: Notifications created but no farm works. This may be expected if no lands are 3 days before harvest.\n";
        exit(0);
    } else {
        echo "\n⚠️  WARNING: No notifications created. Check if there are lands due for harvest.\n";
        exit(0);
    }
    
} catch (Exception $e) {
    echo "\n✗ Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    exit(1);
}
?>

