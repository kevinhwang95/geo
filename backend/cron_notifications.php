<?php

/**
 * Cron job script for automatic notifications
 * Run this script every day to check for harvest due dates and create notifications
 * 
 * Usage:
 * - Add to crontab: 0 9 * * * /usr/bin/php /path/to/your/project/backend/cron_notifications.php
 * - Or run manually: php cron_notifications.php
 */

require_once __DIR__ . '/vendor/autoload.php';

use App\NotificationService;
use App\Database;

try {
    echo "🔄 Starting notification cron job...\n";
    echo "⏰ " . date('Y-m-d H:i:s') . "\n\n";
    
    $notificationService = new NotificationService();
    
    // 1. Create harvest notifications
    echo "🌾 Checking harvest due dates...\n";
    $harvestNotifications = $notificationService->createHarvestNotifications();
    echo "✅ Created {$harvestNotifications} harvest notifications\n\n";
    
    // 2. Check for weather alerts (example - you can integrate with weather API)
    echo "🌦️ Checking weather conditions...\n";
    // This is a placeholder - you can integrate with weather APIs like OpenWeatherMap
    // $weatherAlerts = checkWeatherConditions();
    echo "✅ Weather check completed\n\n";
    
    // 3. Clean up old notifications (older than 30 days)
    echo "🧹 Cleaning up old notifications...\n";
    $cleanedUp = $notificationService->cleanupOldNotifications(30);
    echo "✅ Cleaned up {$cleanedUp} old notifications\n\n";
    
    // 4. Get notification statistics
    echo "📊 Notification statistics:\n";
    $stats = $notificationService->getNotificationStats();
    foreach ($stats as $stat) {
        echo "   - {$stat['type']}: {$stat['count']} total, {$stat['unread_count']} unread\n";
    }
    
    echo "\n🎉 Notification cron job completed successfully!\n";
    
} catch (Exception $e) {
    echo "❌ Error in notification cron job: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}

/**
 * Example function to check weather conditions
 * You can integrate this with weather APIs
 */
function checkWeatherConditions() {
    // Example implementation with OpenWeatherMap API
    /*
    $apiKey = 'your_openweathermap_api_key';
    $lat = '14.095840581'; // Your default latitude
    $lon = '99.820381926'; // Your default longitude
    
    $url = "http://api.openweathermap.org/data/2.5/weather?lat={$lat}&lon={$lon}&appid={$apiKey}";
    
    $response = file_get_contents($url);
    $weather = json_decode($response, true);
    
    if ($weather && isset($weather['weather'][0]['main'])) {
        $condition = $weather['weather'][0]['main'];
        $severity = 'medium';
        
        // Check for severe weather conditions
        if (in_array($condition, ['Thunderstorm', 'Tornado', 'Hurricane'])) {
            $severity = 'high';
        }
        
        // Create weather alert notification
        $notificationService = new NotificationService();
        $notificationService->createWeatherAlert(null, null, $condition, $severity);
        
        return 1;
    }
    */
    
    return 0;
}
