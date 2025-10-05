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
    
    // Test the team members query directly
    $sql = "SELECT u.id, u.first_name, u.last_name, u.email, u.role as user_role,
                   tm.role as team_role, tm.joined_at
            FROM team_members tm
            JOIN users u ON tm.user_id = u.id
            WHERE tm.team_id = :team_id AND tm.is_active = 1
            ORDER BY tm.role DESC, u.first_name ASC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['team_id' => 1]); // Test with team ID 1
    $members = $stmt->fetchAll();
    
    echo "Team members query result:\n";
    echo "Type: " . gettype($members) . "\n";
    echo "Is array: " . (is_array($members) ? 'Yes' : 'No') . "\n";
    echo "Count: " . count($members) . "\n";
    
    if (!empty($members)) {
        echo "First member: " . json_encode($members[0]) . "\n";
    }
    
    // Test what the API would return
    echo "\nAPI response would be:\n";
    echo json_encode($members) . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
