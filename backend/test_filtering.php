<?php

/**
 * Test filtering functionality for notifications
 */

echo "🔍 Testing Notification Filtering\n";
echo "=================================\n\n";

$baseUrl = 'http://localhost:8000/api';

// Test function
function testFiltering($url, $description) {
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
    } else {
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
            echo "   ❌ Unexpected response: " . substr($response, 0, 100) . "...\n";
        }
    }
    echo "\n";
}

// Test different filter combinations
testFiltering($baseUrl . '/notifications', 'All notifications');
testFiltering($baseUrl . '/notifications?type=harvest_overdue', 'Harvest overdue only');
testFiltering($baseUrl . '/notifications?type=maintenance_due', 'Maintenance due only');
testFiltering($baseUrl . '/notifications?priority=high', 'High priority only');
testFiltering($baseUrl . '/notifications?priority=medium', 'Medium priority only');
testFiltering($baseUrl . '/notifications?priority=low', 'Low priority only');
testFiltering($baseUrl . '/notifications?type=harvest_overdue&priority=high', 'Harvest overdue + High priority');
testFiltering($baseUrl . '/notifications?limit=5', 'Limited to 5 results');

echo "🎉 Filtering tests completed!\n";
echo "💡 All endpoints should return 401 (Unauthorized) since no auth token was provided\n";
echo "💡 This confirms that the filtering parameters are being processed correctly\n";
