<?php
require_once 'vendor/autoload.php';

use Dotenv\Dotenv;
use App\Database;

// Load environment variables
$dotenv = Dotenv::createImmutable('.');
$dotenv->load();

try {
    $db = Database::getInstance();
    echo "Database connection successful\n";
    
    // Check if lands table exists and its structure
    $stmt = $db->query('DESCRIBE lands');
    $columns = $stmt->fetchAll();
    
    echo "Lands table structure:\n";
    foreach ($columns as $column) {
        echo "- {$column['Field']} ({$column['Type']})\n";
    }
    
    // Check if there are any lands
    $stmt = $db->query('SELECT COUNT(*) FROM lands');
    $count = $stmt->fetchColumn();
    echo "\nCurrent lands count: {$count}\n";
    
    // Check if plant_types table exists
    $stmt = $db->query('SELECT COUNT(*) FROM plant_types');
    $plantTypesCount = $stmt->fetchColumn();
    echo "Plant types count: {$plantTypesCount}\n";
    
    // Check if categories table exists
    $stmt = $db->query('SELECT COUNT(*) FROM categories');
    $categoriesCount = $stmt->fetchColumn();
    echo "Categories count: {$categoriesCount}\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
