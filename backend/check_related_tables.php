<?php
require_once 'vendor/autoload.php';
use App\Database;

try {
    $db = Database::getInstance();
    echo "Database connection successful\n";
    
    // Check if plant_types table exists
    $result = $db->query("SHOW TABLES LIKE 'plant_types'");
    $plantTypesExists = $result->rowCount() > 0;
    echo "plant_types table exists: " . ($plantTypesExists ? "Yes" : "No") . "\n";
    
    // Check if categories table exists
    $result = $db->query("SHOW TABLES LIKE 'categories'");
    $categoriesExists = $result->rowCount() > 0;
    echo "categories table exists: " . ($categoriesExists ? "Yes" : "No") . "\n";
    
    if ($plantTypesExists) {
        $result = $db->query("SELECT COUNT(*) as count FROM plant_types");
        $count = $result->fetchColumn();
        echo "plant_types count: " . $count . "\n";
    }
    
    if ($categoriesExists) {
        $result = $db->query("SELECT COUNT(*) as count FROM categories");
        $count = $result->fetchColumn();
        echo "categories count: " . $count . "\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
