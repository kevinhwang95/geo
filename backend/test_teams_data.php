<?php
require_once 'vendor/autoload.php';

use Dotenv\Dotenv;
use App\Database;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

try {
    // Test database connection with correct credentials
    $host = 'localhost';
    $dbname = 'land_management';
    $username = 'root';
    $password = '';
    
    $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    
    echo "Database connection successful\n";
    
    // Check if teams table exists and has data
    $result = $pdo->query("SELECT COUNT(*) as count FROM teams");
    $teamCount = $result->fetchColumn();
    echo "Teams count: " . $teamCount . "\n";
    
    if ($teamCount > 0) {
        $result = $pdo->query("SELECT * FROM teams LIMIT 3");
        $teams = $result->fetchAll();
        echo "Sample teams:\n";
        foreach ($teams as $team) {
            echo "- ID: " . $team['id'] . ", Name: " . $team['name'] . "\n";
        }
    }
    
    // Check if team_members table exists
    $result = $pdo->query("SELECT COUNT(*) as count FROM team_members");
    $memberCount = $result->fetchColumn();
    echo "Team members count: " . $memberCount . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
