<?php

/**
 * Harvest Notification Cron Job
 * 
 * This script checks all lands for harvest notifications and creates farm work assignments.
 * 
 * Business Logic:
 * 1. Check lands with previous_harvest_date and harvest_cycle_days
 * 2. Calculate next harvest date based on previous harvest + cycle days
 * 3. Create notifications:
 *    - 3 days before: medium priority notification
 *    - 1 day before: high priority notification  
 *    - Overdue: high priority notification
 * 4. Create farm work assignment when notification is created (3 days before)
 * 5. Ensure one work record per harvest cycle
 * 6. Sync notification and farm work status
 * 
 * Usage:
 * - Run daily via cron: 0 6 * * * php /path/to/check_harvest_notifications.php
 * - Manual execution: php check_harvest_notifications.php
 * 
 * Author: System Administrator
 * Created: 2024-01-XX
 */

require_once 'vendor/autoload.php';
use Dotenv\Dotenv;
use App\HarvestNotificationService;

// Load environment variables
try {
    $dotenv = Dotenv::createImmutable(__DIR__);
    $dotenv->load();
} catch (Exception $e) {
    error_log('Dotenv parsing warning: ' . $e->getMessage());
}

// Set timezone
date_default_timezone_set($_ENV['APP_TIMEZONE'] ?? 'Asia/Bangkok');

// Start execution
$startTime = microtime(true);
echo "=== Harvest Notification Cron Job Started ===\n";
echo "Execution time: " . date('Y-m-d H:i:s') . "\n";
echo "Timezone: " . date_default_timezone_get() . "\n\n";

try {
    // Initialize the harvest notification service
    $harvestService = new HarvestNotificationService();
    
    // Run the harvest notification check
    $result = $harvestService->checkHarvestNotifications();
    
    // Calculate execution time
    $executionTime = round(microtime(true) - $startTime, 2);
    
    // Output results
    echo "\n=== Execution Summary ===\n";
    echo "Success: " . ($result['success'] ? 'Yes' : 'No') . "\n";
    
    if ($result['success']) {
        echo "Lands processed: " . $result['lands_processed'] . "\n";
        echo "Notifications created: " . $result['notifications_created'] . "\n";
        echo "Notifications updated: " . $result['notifications_updated'] . "\n";
        echo "Farm works created: " . $result['farm_works_created'] . "\n";
    } else {
        echo "Error: " . $result['error'] . "\n";
    }
    
    echo "Execution time: {$executionTime} seconds\n";
    echo "Memory usage: " . round(memory_get_peak_usage(true) / 1024 / 1024, 2) . " MB\n";
    
    // Set appropriate exit code
    $exitCode = $result['success'] ? 0 : 1;
    
} catch (Exception $e) {
    $executionTime = round(microtime(true) - $startTime, 2);
    
    echo "\n=== Fatal Error ===\n";
    echo "Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    echo "Execution time: {$executionTime} seconds\n";
    
    // Log the error
    error_log("Harvest notification cron job failed: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    
    $exitCode = 1;
}

echo "\n=== Harvest Notification Cron Job Completed ===\n";
exit($exitCode);





