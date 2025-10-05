<?php
require_once 'vendor/autoload.php';
use App\Database;
use App\Team;

try {
    $db = Database::getInstance();
    echo "Database connection successful\n";
    
    $teamModel = new Team();
    
    // Test updating team lead
    echo "Testing team update with teamLeadId...\n";
    $updateData = [
        'name' => 'Field Operations Team',
        'description' => 'Handles all field work and land maintenance',
        'teamLeadId' => 10  // Set user 10 as team lead
    ];
    
    echo "Update data: " . json_encode($updateData) . "\n";
    
    $result = $teamModel->update(7, $updateData);
    echo "Update result: " . json_encode($teamModel->formatTeam($result)) . "\n";
    
    // Test updating team lead to null
    echo "\nTesting team update with teamLeadId = null...\n";
    $updateData2 = [
        'teamLeadId' => null
    ];
    
    $result2 = $teamModel->update(7, $updateData2);
    echo "Update result: " . json_encode($teamModel->formatTeam($result2)) . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
