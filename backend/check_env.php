<?php
require_once 'vendor/autoload.php';

echo "Environment variables:\n";
echo "JWT_SECRET: " . ($_ENV['JWT_SECRET'] ?? 'NOT SET') . "\n";
echo "JWT_ALGORITHM: " . ($_ENV['JWT_ALGORITHM'] ?? 'NOT SET') . "\n";
echo "DB_HOST: " . ($_ENV['DB_HOST'] ?? 'NOT SET') . "\n";
echo "DB_NAME: " . ($_ENV['DB_NAME'] ?? 'NOT SET') . "\n";

// Check if .env file exists
if (file_exists('.env')) {
    echo ".env file exists\n";
    $envContent = file_get_contents('.env');
    echo "JWT_SECRET in .env: " . (strpos($envContent, 'JWT_SECRET') !== false ? 'YES' : 'NO') . "\n";
} else {
    echo ".env file does not exist\n";
}
