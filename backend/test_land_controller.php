<?php
require_once 'vendor/autoload.php';
use App\Controllers\LandController;
use App\Auth;

try {
    // Mock authentication for testing
    $_SERVER['HTTP_AUTHORIZATION'] = 'Bearer test-token';
    
    // Create a mock user data for testing
    $mockUserData = ['user_id' => 7, 'role' => 'admin'];
    
    // Override the Auth::requireAuth method temporarily for testing
    class MockAuth extends Auth {
        public static function requireAuth() {
            return ['user_id' => 7, 'role' => 'admin'];
        }
    }
    
    // Test the LandController
    $landController = new LandController();
    
    // Capture output
    ob_start();
    $landController->index();
    $output = ob_get_clean();
    
    echo "API Response:\n";
    echo $output . "\n";
    
    // Try to decode JSON
    $data = json_decode($output, true);
    if ($data) {
        echo "Successfully decoded JSON with " . count($data) . " lands\n";
        if (!empty($data)) {
            echo "First land ID: " . $data[0]['id'] . "\n";
        }
    } else {
        echo "Failed to decode JSON\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
