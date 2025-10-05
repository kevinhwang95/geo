<?php
require_once 'vendor/autoload.php';

use Dotenv\Dotenv;
use App\Database;
use App\Land;

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
    
    // Test Land model
    $landModel = new Land();
    $lands = $landModel->getAll();
    echo "Lands retrieved: " . count($lands) . "\n";
    
    if (!empty($lands)) {
        $formattedLand = $landModel->formatLand($lands[0]);
        echo "First formatted land: " . json_encode($formattedLand, JSON_PRETTY_PRINT) . "\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
