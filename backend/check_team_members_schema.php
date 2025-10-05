<?php
require_once 'vendor/autoload.php';
use App\Database;

try {
    $db = Database::getInstance();
    echo "Database connection successful\n";

    $stmt = $db->query("DESCRIBE team_members");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo "Team members table structure:\n";
    foreach ($columns as $column) {
        echo "- " . $column . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}