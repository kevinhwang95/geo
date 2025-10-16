<?php

/**
 * Harvest Notification Cron Job Setup Script
 * 
 * This script helps set up the harvest notification cron job
 * and provides instructions for different environments.
 */

echo "=== Harvest Notification Cron Job Setup ===\n";
echo "Setup time: " . date('Y-m-d H:i:s') . "\n\n";

// Get the current directory and script path
$currentDir = __DIR__;
$scriptPath = $currentDir . '/check_harvest_notifications.php';

echo "1. Script Information:\n";
echo "   - Script path: {$scriptPath}\n";
echo "   - Script exists: " . (file_exists($scriptPath) ? "✅ YES" : "❌ NO") . "\n";
echo "   - Script executable: " . (is_executable($scriptPath) ? "✅ YES" : "❌ NO") . "\n\n";

echo "2. PHP Information:\n";
echo "   - PHP version: " . PHP_VERSION . "\n";
echo "   - PHP path: " . PHP_BINARY . "\n\n";

echo "3. Environment Detection:\n";

// Detect operating system
$os = php_uname('s');
echo "   - Operating System: {$os}\n";

// Detect if we're in a web server environment
$isWebServer = isset($_SERVER['SERVER_SOFTWARE']);
echo "   - Web Server Environment: " . ($isWebServer ? "YES" : "NO") . "\n";

// Check if we can detect the web server type
if ($isWebServer) {
    echo "   - Server Software: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Unknown') . "\n";
}

echo "\n";

echo "4. Cron Job Configuration:\n\n";

if (strtoupper(substr($os, 0, 3)) === 'WIN') {
    echo "   Windows Environment Detected:\n\n";
    echo "   Option A - Windows Task Scheduler:\n";
    echo "   1. Open Task Scheduler (taskschd.msc)\n";
    echo "   2. Create Basic Task\n";
    echo "   3. Set trigger: Daily at 6:00 AM\n";
    echo "   4. Action: Start a program\n";
    echo "   5. Program: " . PHP_BINARY . "\n";
    echo "   6. Arguments: {$scriptPath}\n";
    echo "   7. Start in: {$currentDir}\n\n";
    
    echo "   Option B - Manual Execution:\n";
    echo "   - Run manually: php {$scriptPath}\n";
    echo "   - Create a batch file to run daily\n\n";
    
} else {
    echo "   Unix/Linux Environment Detected:\n\n";
    
    echo "   Option A - Crontab (Recommended):\n";
    echo "   1. Open crontab: crontab -e\n";
    echo "   2. Add this line for daily execution at 6:00 AM:\n";
    echo "      0 6 * * * cd {$currentDir} && " . PHP_BINARY . " {$scriptPath} >> /var/log/harvest_notifications.log 2>&1\n\n";
    
    echo "   Option B - System-wide Cron:\n";
    echo "   1. Edit system crontab: sudo crontab -e\n";
    echo "   2. Add this line:\n";
    echo "      0 6 * * * cd {$currentDir} && " . PHP_BINARY . " {$scriptPath} >> /var/log/harvest_notifications.log 2>&1\n\n";
    
    echo "   Option C - Manual Execution:\n";
    echo "   - Run manually: cd {$currentDir} && php {$scriptPath}\n";
    echo "   - Test first: php test_harvest_notifications.php\n\n";
}

echo "5. Cron Schedule Options:\n";
echo "   - Daily at 6:00 AM: 0 6 * * *\n";
echo "   - Every 6 hours: 0 */6 * * *\n";
echo "   - Every 12 hours: 0 */12 * * *\n";
echo "   - Twice daily (6 AM and 6 PM): 0 6,18 * * *\n";
echo "   - Weekdays only at 6 AM: 0 6 * * 1-5\n\n";

echo "6. Logging and Monitoring:\n";
echo "   - Log file: /var/log/harvest_notifications.log (Linux/Mac)\n";
echo "   - Windows: Check Task Scheduler history\n";
echo "   - Monitor script output for errors\n";
echo "   - Check database for created notifications and farm works\n\n";

echo "7. Testing:\n";
echo "   - Run test script: php test_harvest_notifications.php\n";
echo "   - Run harvest check manually: php check_harvest_notifications.php\n";
echo "   - Verify notifications are created in database\n";
echo "   - Verify farm works are created for harvest cycles\n\n";

echo "8. Troubleshooting:\n";
echo "   - Check PHP error logs\n";
echo "   - Verify database connection\n";
echo "   - Ensure all required tables exist\n";
echo "   - Check file permissions\n";
echo "   - Verify environment variables (.env file)\n\n";

echo "9. Database Requirements:\n";
echo "   - lands table with previous_harvest_date, next_harvest_date columns\n";
echo "   - plant_types table with harvest_cycle_days column\n";
echo "   - notifications table for harvest notifications\n";
echo "   - farm_works table for harvest work assignments\n";
echo "   - work_types and work_categories tables\n\n";

echo "10. Business Logic Summary:\n";
echo "    - Checks lands with previous_harvest_date and harvest_cycle_days\n";
echo "    - Calculates next harvest date: previous_harvest_date + harvest_cycle_days\n";
echo "    - Creates notifications:\n";
echo "      * 3 days before: medium priority notification\n";
echo "      * 1 day before: high priority notification\n";
echo "      * Overdue: high priority notification\n";
echo "    - Creates farm work assignment when notification is created (3 days before)\n";
echo "    - Ensures one work record per harvest cycle\n";
echo "    - Syncs notification and farm work status changes\n\n";

echo "=== Setup Instructions Complete ===\n";

// Ask if user wants to run a test
echo "\nWould you like to run a test now? (y/n): ";
$handle = fopen("php://stdin", "r");
$line = fgets($handle);
fclose($handle);

if (trim(strtolower($line)) === 'y' || trim(strtolower($line)) === 'yes') {
    echo "\nRunning harvest notification test...\n";
    
    if (file_exists($currentDir . '/test_harvest_notifications.php')) {
        system("php " . $currentDir . '/test_harvest_notifications.php');
    } else {
        echo "Test script not found. Please run: php test_harvest_notifications.php\n";
    }
}

echo "\n=== Setup Complete ===\n";





