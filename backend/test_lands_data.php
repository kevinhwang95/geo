<?php
require_once 'vendor/autoload.php';
require_once 'src/Database.php';
require_once 'src/Land.php';

try {
    $db = App\Database::getInstance();
    $land = new App\Land($db);
    $lands = $land->getAll();
    
    echo "Total lands in database: " . count($lands) . PHP_EOL;
    
    if (count($lands) > 0) {
        echo "First land data:" . PHP_EOL;
        echo json_encode($lands[0], JSON_PRETTY_PRINT) . PHP_EOL;
        
        echo PHP_EOL . "All lands summary:" . PHP_EOL;
        foreach ($lands as $index => $landData) {
            echo ($index + 1) . ". " . $landData['land_name'] . " (" . $landData['land_code'] . ")" . PHP_EOL;
        }
    } else {
        echo "No lands found in database." . PHP_EOL;
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . PHP_EOL;
    echo "Stack trace: " . $e->getTraceAsString() . PHP_EOL;
}
