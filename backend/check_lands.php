<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Database;

try {
    $db = Database::getInstance();
    
    echo "🌍 Available Lands:\n";
    echo "==================\n\n";
    
    $lands = $db->fetchAll('SELECT id, land_name, land_code FROM lands WHERE is_active = 1 LIMIT 5');
    
    if (empty($lands)) {
        echo "❌ No lands found in database\n";
        echo "💡 You may need to add sample lands first\n";
    } else {
        foreach ($lands as $land) {
            echo "✅ Land ID: {$land['id']}, Name: {$land['land_name']}, Code: {$land['land_code']}\n";
        }
    }
    
    echo "\n👥 Available Users:\n";
    echo "===================\n\n";
    
    $users = $db->fetchAll('SELECT id, first_name, last_name, role FROM users WHERE is_active = 1 LIMIT 5');
    
    if (empty($users)) {
        echo "❌ No users found in database\n";
    } else {
        foreach ($users as $user) {
            echo "✅ User ID: {$user['id']}, Name: {$user['first_name']} {$user['last_name']}, Role: {$user['role']}\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
