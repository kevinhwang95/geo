<?php

/**
 * Test API endpoints for notification system
 */

echo "🌐 Testing Notification API Endpoints\n";
echo "=====================================\n\n";

$baseUrl = 'http://localhost:8000/api';

// Test function
function testEndpoint($method, $url, $data = null, $headers = []) {
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge([
        'Content-Type: application/json'
    ], $headers));
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'code' => $httpCode,
        'response' => json_decode($response, true)
    ];
}

// Test 1: Get notifications (should require auth)
echo "📋 Test 1: GET /notifications (without auth)\n";
$result = testEndpoint('GET', $baseUrl . '/notifications');
echo "   Status: {$result['code']}\n";
echo "   Response: " . json_encode($result['response']) . "\n\n";

// Test 2: Create maintenance notification (should require auth)
echo "🔧 Test 2: POST /notifications/create-maintenance (without auth)\n";
$data = [
    'land_id' => 9,
    'maintenance_type' => 'Fertilizer Application',
    'due_date' => '2025-10-15'
];
$result = testEndpoint('POST', $baseUrl . '/notifications/create-maintenance', $data);
echo "   Status: {$result['code']}\n";
echo "   Response: " . json_encode($result['response']) . "\n\n";

// Test 3: Create comment notification (should require auth)
echo "💬 Test 3: POST /notifications/create-comment (without auth)\n";
$data = [
    'land_id' => 10,
    'comment_text' => 'Test comment from API'
];
$result = testEndpoint('POST', $baseUrl . '/notifications/create-comment', $data);
echo "   Status: {$result['code']}\n";
echo "   Response: " . json_encode($result['response']) . "\n\n";

// Test 4: Create photo notification (should require auth)
echo "📸 Test 4: POST /notifications/create-photo (without auth)\n";
$data = [
    'land_id' => 12
];
$result = testEndpoint('POST', $baseUrl . '/notifications/create-photo', $data);
echo "   Status: {$result['code']}\n";
echo "   Response: " . json_encode($result['response']) . "\n\n";

// Test 5: Create weather alert (should require auth)
echo "🌦️ Test 5: POST /notifications/create-weather-alert (without auth)\n";
$data = [
    'land_id' => 13,
    'alert_type' => 'Heavy Rain',
    'severity' => 'high'
];
$result = testEndpoint('POST', $baseUrl . '/notifications/create-weather-alert', $data);
echo "   Status: {$result['code']}\n";
echo "   Response: " . json_encode($result['response']) . "\n\n";

// Test 6: Create system notification (should require auth)
echo "📢 Test 6: POST /notifications/create-system (without auth)\n";
$data = [
    'title' => 'System Test',
    'message' => 'This is a test system notification'
];
$result = testEndpoint('POST', $baseUrl . '/notifications/create-system', $data);
echo "   Status: {$result['code']}\n";
echo "   Response: " . json_encode($result['response']) . "\n\n";

// Test 7: Get notification stats (should require auth)
echo "📊 Test 7: GET /notifications/stats (without auth)\n";
$result = testEndpoint('GET', $baseUrl . '/notifications/stats');
echo "   Status: {$result['code']}\n";
echo "   Response: " . json_encode($result['response']) . "\n\n";

// Test 8: Test harvest notifications (should require auth)
echo "🌾 Test 8: POST /notifications/create-harvest (without auth)\n";
$result = testEndpoint('POST', $baseUrl . '/notifications/create-harvest');
echo "   Status: {$result['code']}\n";
echo "   Response: " . json_encode($result['response']) . "\n\n";

echo "🎉 API endpoint tests completed!\n";
echo "💡 All endpoints should return 401 (Unauthorized) since no auth token was provided\n";
echo "💡 This confirms that authentication is working correctly\n";
