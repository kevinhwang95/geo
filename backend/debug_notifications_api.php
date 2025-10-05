<?php
require_once 'vendor/autoload.php';
use App\Database;

try {
    $db = Database::getInstance();
    echo "Database connection successful\n";

    // Test the notifications API response format
    $stmt = $db->query("SELECT n.*, l.land_name, l.land_code, l.geometry 
                       FROM notifications n 
                       LEFT JOIN lands l ON n.land_id = l.id 
                       WHERE n.priority = 'high' AND n.is_dismissed = 0");
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "High priority notifications found: " . count($notifications) . "\n";
    
    foreach ($notifications as $notification) {
        echo "\nNotification ID: " . $notification['id'] . "\n";
        echo "Title: " . $notification['title'] . "\n";
        echo "Priority: " . $notification['priority'] . "\n";
        echo "Land ID: " . $notification['land_id'] . "\n";
        echo "Land Name: " . $notification['land_name'] . "\n";
        echo "Has Geometry: " . (!empty($notification['geometry']) ? 'Yes' : 'No') . "\n";
        
        if (!empty($notification['geometry'])) {
            $geometry = json_decode($notification['geometry'], true);
            echo "Geometry Type: " . ($geometry['type'] ?? 'Unknown') . "\n";
            if (isset($geometry['coordinates'])) {
                echo "Has Coordinates: Yes\n";
            }
        }
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
