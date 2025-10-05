<?php
require_once 'vendor/autoload.php';
use App\Database;

try {
    $db = Database::getInstance();
    echo "Database connection successful\n";
    
    // Check lands table structure
    $result = $db->query("DESCRIBE lands");
    $columns = $result->fetchAll(PDO::FETCH_ASSOC);
    echo "Lands table structure:\n";
    foreach ($columns as $column) {
        echo "- " . $column['Field'] . " (" . $column['Type'] . ")\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
