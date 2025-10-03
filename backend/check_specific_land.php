<?php
require_once 'vendor/autoload.php';
require_once 'src/Database.php';
require_once 'src/Land.php';

try {
    $db = App\Database::getInstance();
    $land = new App\Land($db);
    $lands = $land->getAll();
    
    // Find the "Test Field Updated" land
    $testFieldUpdated = null;
    foreach ($lands as $landData) {
        if ($landData['land_name'] === 'Test Field Updated') {
            $testFieldUpdated = $landData;
            break;
        }
    }
    
    if ($testFieldUpdated) {
        echo "Found 'Test Field Updated' land:" . PHP_EOL;
        echo "ID: " . $testFieldUpdated['id'] . PHP_EOL;
        echo "Land Name: " . $testFieldUpdated['land_name'] . PHP_EOL;
        echo "Land Code: " . $testFieldUpdated['land_code'] . PHP_EOL;
        echo "Geometry JSON:" . PHP_EOL;
        echo $testFieldUpdated['geometry'] . PHP_EOL;
        
        // Parse and analyze the geometry
        $geometry = json_decode($testFieldUpdated['geometry'], true);
        echo PHP_EOL . "Parsed Geometry:" . PHP_EOL;
        echo "Type: " . $geometry['type'] . PHP_EOL;
        if (isset($geometry['geometry'])) {
            echo "Geometry Type: " . $geometry['geometry']['type'] . PHP_EOL;
        }
        echo "Full structure:" . PHP_EOL;
        echo json_encode($geometry, JSON_PRETTY_PRINT) . PHP_EOL;
    } else {
        echo "Could not find 'Test Field Updated' land" . PHP_EOL;
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . PHP_EOL;
}
