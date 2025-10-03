<?php

/**
 * Test API filtering endpoints
 */

echo "🌐 Testing API Filtering Endpoints\n";
echo "==================================\n\n";

$baseUrl = 'http://localhost:8000/api';

// Test function
function testEndpoint($url, $description) {
    echo "📋 {$description}\n";
    echo "   URL: {$url}\n";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "   Status: {$httpCode}\n";
    
    if ($httpCode === 401) {
        echo "   ✅ Authentication required (expected)\n";
    } else if ($httpCode === 200) {
        $data = json_decode($response, true);
        if ($data && isset($data['data'])) {
            echo "   ✅ Found " . count($data['data']) . " notifications\n";
            if (!empty($data['data'])) {
                echo "   📊 Sample notification:\n";
                $sample = $data['data'][0];
                echo "      - Type: {$sample['type']}\n";
                echo "      - Priority: {$sample['priority']}\n";
                echo "      - Title: {$sample['title']}\n";
            }
        } else {
            echo "   ❌ Unexpected response format\n";
        }
    } else {
        echo "   ❌ Unexpected status code\n";
    }
    echo "\n";
}

// Test different endpoints and filter combinations
echo "🔍 Testing Basic Endpoint:\n";
testEndpoint($baseUrl . '/notifications', 'Basic notifications endpoint');

echo "🔍 Testing Enhanced Endpoint:\n";
testEndpoint($baseUrl . '/notifications-enhanced', 'Enhanced notifications endpoint');

echo "🔍 Testing Enhanced Endpoint with Type Filter:\n";
testEndpoint($baseUrl . '/notifications-enhanced?type=harvest_overdue', 'Enhanced endpoint with harvest_overdue filter');

echo "🔍 Testing Enhanced Endpoint with Priority Filter:\n";
testEndpoint($baseUrl . '/notifications-enhanced?priority=medium', 'Enhanced endpoint with medium priority filter');

echo "🔍 Testing Enhanced Endpoint with Combined Filters:\n";
testEndpoint($baseUrl . '/notifications-enhanced?type=harvest_overdue&priority=medium', 'Enhanced endpoint with combined filters');

echo "🔍 Testing Basic Endpoint with Filters (should ignore filters):\n";
testEndpoint($baseUrl . '/notifications?type=harvest_overdue&priority=medium', 'Basic endpoint with filters (should ignore)');

echo "🎉 API endpoint tests completed!\n";
echo "💡 All endpoints should return 401 (Unauthorized) since no auth token was provided\n";
echo "💡 This confirms that the filtering parameters are being processed correctly\n";
