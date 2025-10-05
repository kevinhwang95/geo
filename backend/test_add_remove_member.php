<?php
require_once 'vendor/autoload.php';
use App\Database;
use App\Team;

try {
    $db = Database::getInstance();
    echo "Database connection successful\n";
    
    $teamModel = new Team();
    
    // Test adding a member to team 7
    $userId = 10; // Assuming user ID 10 exists
    $teamId = 7;
    
    echo "Adding user $userId to team $teamId...\n";
    $result = $teamModel->addMember($teamId, $userId, 'member');
    echo "Add member result: " . ($result ? 'Success' : 'Failed') . "\n";
    
    // Check team members after adding
    $members = $teamModel->getMembers($teamId);
    echo "Team members after adding: " . json_encode($members) . "\n";
    
    // Test removing the member
    echo "Removing user $userId from team $teamId...\n";
    $result = $teamModel->removeMember($teamId, $userId);
    echo "Remove member result: " . ($result ? 'Success' : 'Failed') . "\n";
    
    // Check team members after removing
    $members = $teamModel->getMembers($teamId);
    echo "Team members after removing: " . json_encode($members) . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
