<?php
require_once 'vendor/autoload.php';
use App\Database;
use App\Team;

try {
    $db = Database::getInstance();
    echo "Database connection successful\n";
    
    $teamModel = new Team();
    $members = $teamModel->getMembers(7);
    echo "Team members for team 7: " . json_encode($members) . "\n";
    
    // Test the team data as well
    $team = $teamModel->findById(7);
    echo "Team 7 data: " . json_encode($teamModel->formatTeam($team)) . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
