<?php
require_once 'vendor/autoload.php';
use App\Database;

try {
    $db = Database::getInstance();
    echo "Database connection successful\n";

    // Check if there are any team members
    $stmt = $db->query("SELECT COUNT(*) FROM team_members");
    $count = $stmt->fetchColumn();
    echo "Total team members: " . $count . "\n";

    if ($count > 0) {
        $stmt = $db->query("SELECT * FROM team_members LIMIT 5");
        $members = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "Sample team members: " . json_encode($members) . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
