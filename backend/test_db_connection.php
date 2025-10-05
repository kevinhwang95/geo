<?php
require_once 'vendor/autoload.php';
use App\Database;

try {
    $db = Database::getInstance();
    echo "Database connection successful\n";
    
    // Test lands query
    $result = $db->query("SELECT COUNT(*) as count FROM lands");
    $count = $result->fetchColumn();
    echo "Lands count: " . $count . "\n";
    
    // Test users query
    $result = $db->query("SELECT COUNT(*) as count FROM users");
    $count = $result->fetchColumn();
    echo "Users count: " . $count . "\n";
    
} catch (Exception $e) {
    echo "Database connection failed: " . $e->getMessage() . "\n";
}
