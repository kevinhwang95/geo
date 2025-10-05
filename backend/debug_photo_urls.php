<?php
/**
 * Debug script to check photo URL generation in production
 * This script helps identify where photo URLs are being constructed
 */

require_once __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Set content type
header('Content-Type: application/json');

// Get current request info
$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$currentUrl = $protocol . '://' . $host;

// Check environment variables
$corsOrigin = $_ENV['CORS_ORIGIN'] ?? 'http://localhost:5173';
$uploadDir = $_ENV['UPLOAD_DIR'] ?? __DIR__ . '/uploads/photos/';

// Sample photo data (you can modify this to test with actual photo data)
$samplePhoto = [
    'id' => 1,
    'filename' => '68e0815d44f40_kalen-emsley-Bkci_8qcdvQ-unsplash.jpg',
    'file_path' => '/uploads/photos/68e0815d44f40_kalen-emsley-Bkci_8qcdvQ-unsplash.jpg'
];

// Test different URL constructions
$debugInfo = [
    'current_request' => [
        'protocol' => $protocol,
        'host' => $host,
        'full_url' => $currentUrl,
        'request_uri' => $_SERVER['REQUEST_URI'] ?? '',
        'server_name' => $_SERVER['SERVER_NAME'] ?? '',
    ],
    'environment_variables' => [
        'CORS_ORIGIN' => $corsOrigin,
        'UPLOAD_DIR' => $uploadDir,
    ],
    'sample_photo' => $samplePhoto,
    'url_constructions' => [
        'relative_url' => '/uploads/photos/' . $samplePhoto['filename'],
        'current_domain_url' => $currentUrl . '/uploads/photos/' . $samplePhoto['filename'],
        'wrong_domain_url' => 'https://geo.chokdeepalmoil.com/uploads/photos/' . $samplePhoto['filename'],
        'correct_domain_url' => 'https://geoapi.chokdeepalmoil.com/uploads/photos/' . $samplePhoto['filename'],
    ],
    'file_existence' => [
        'upload_dir_exists' => is_dir($uploadDir),
        'sample_file_exists' => file_exists(__DIR__ . '/uploads/' . $samplePhoto['filename']),
        'sample_file_path' => __DIR__ . '/uploads/' . $samplePhoto['filename'],
    ],
    'recommendations' => [
        'frontend_env_var' => 'VITE_API_BASE_UPLOAD should be set to: https://geoapi.chokdeepalmoil.com',
        'backend_fix' => 'Consider adding BASE_URL environment variable to PhotoController',
        'current_issue' => 'Frontend is using wrong domain (geo.chokdeepalmoil.com) instead of geoapi.chokdeepalmoil.com'
    ]
];

// Log to error log for production debugging
error_log("Photo URL Debug Info: " . json_encode($debugInfo, JSON_PRETTY_PRINT));

echo json_encode($debugInfo, JSON_PRETTY_PRINT);
?>

