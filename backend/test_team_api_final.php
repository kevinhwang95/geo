<?php
require_once 'vendor/autoload.php';
use App\Database;
use App\Team;

try {
    $db = Database::getInstance();
    echo "Database connection successful\n";
    
    $teamModel = new Team();
    
    // Test getting team members
    echo "Testing getMembers for team 7...\n";
    $members = $teamModel->getMembers(7);
    echo "Team members: " . json_encode($members) . "\n";
    
    // Test adding a member
    echo "Adding user 10 to team 7...\n";
    $result = $teamModel->addMember(7, 10, 'member');
    echo "Add member result: " . ($result ? 'Success' : 'Failed') . "\n";
    
    // Check team members after adding
    $members = $teamModel->getMembers(7);
    echo "Team members after adding: " . json_encode($members) . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
