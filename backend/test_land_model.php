<?php
require_once 'vendor/autoload.php';
use App\Database;
use App\Land;

try {
    $db = Database::getInstance();
    echo "Database connection successful\n";
    
    // Test Land model directly
    $landModel = new Land();
    $lands = $landModel->getAll();
    echo "Lands retrieved: " . count($lands) . "\n";
    
    if (!empty($lands)) {
        $firstLand = $lands[0];
        echo "First land: " . json_encode($firstLand) . "\n";
        
        $formattedLand = $landModel->formatLand($firstLand);
        echo "Formatted land: " . json_encode($formattedLand) . "\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
