<?php
require_once 'vendor/autoload.php';

use Dotenv\Dotenv;
use App\Database;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "Environment variables after loading:\n";
echo "JWT_SECRET: " . ($_ENV['JWT_SECRET'] ?? 'NOT SET') . "\n";
echo "JWT_ALGORITHM: " . ($_ENV['JWT_ALGORITHM'] ?? 'NOT SET') . "\n";
echo "DB_HOST: " . ($_ENV['DB_HOST'] ?? 'NOT SET') . "\n";
echo "DB_NAME: " . ($_ENV['DB_NAME'] ?? 'NOT SET') . "\n";

// Test database connection
try {
    $db = Database::getInstance();
    echo "Database connection successful\n";
} catch (Exception $e) {
    echo "Database connection failed: " . $e->getMessage() . "\n";
}
