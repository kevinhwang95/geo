<?php
// Test the lands API endpoint directly
$url = 'http://localhost:8000/api/lands';

echo "Testing API endpoint: $url" . PHP_EOL;

// Make a cURL request
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "HTTP Status Code: $httpCode" . PHP_EOL;

if ($error) {
    echo "cURL Error: $error" . PHP_EOL;
} else {
    echo "Response:" . PHP_EOL;
    $decoded = json_decode($response, true);
    if ($decoded) {
        echo json_encode($decoded, JSON_PRETTY_PRINT) . PHP_EOL;
    } else {
        echo "Raw response: $response" . PHP_EOL;
    }
}
