<?php
require_once 'vendor/autoload.php';

use Dotenv\Dotenv;
use App\Database;

// Load environment variables
$dotenv = Dotenv::createImmutable('.');
$dotenv->load();

try {
    $db = Database::getInstance();
    
    // Check triggers on lands table
    $stmt = $db->query('SHOW TRIGGERS LIKE "lands"');
    $triggers = $stmt->fetchAll();
    
    echo "Triggers on lands table:\n";
    foreach ($triggers as $trigger) {
        echo "- {$trigger['Trigger']} ({$trigger['Event']} {$trigger['Timing']})\n";
    }
    
    // Try to disable triggers temporarily
    echo "\nTrying to disable triggers...\n";
    $db->query('SET @DISABLE_TRIGGERS = 1');
    
    // Try inserting a simple land record
    $sql = "INSERT INTO lands (
                land_name, land_code, deed_number, location, 
                province, district, city, plant_type_id, category_id, 
                plant_date, harvest_cycle_days, geometry, size, 
                created_by, created_at, updated_at
            ) VALUES (
                'Test Field', 'TF001', 'DEED001', 'Test Location',
                'Test Province', 'Test District', 'Test City', 1, 1,
                '2023-01-01', 120, '{\"type\":\"Polygon\",\"coordinates\":[[[100,13],[101,13],[101,14],[100,14],[100,13]]]}', 1000,
                1, NOW(), NOW()
            )";
    
    $db->query($sql);
    echo "Successfully inserted test land!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
