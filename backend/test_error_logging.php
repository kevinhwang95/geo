<?php

// Simple test script to demonstrate error logging
require_once __DIR__ . '/src/ErrorLogger.php';

use App\ErrorLogger;

echo "Testing Error Logger...\n\n";

// Get the error logger instance
$logger = ErrorLogger::getInstance();

// Debug: Check log directory
$reflection = new ReflectionClass($logger);
$logDirProperty = $reflection->getProperty('logDir');
$logDirProperty->setAccessible(true);
$logDir = $logDirProperty->getValue($logger);

echo "Log directory: $logDir\n";
echo "Log directory exists: " . (is_dir($logDir) ? 'Yes' : 'No') . "\n";
echo "Log directory writable: " . (is_writable($logDir) ? 'Yes' : 'No') . "\n\n";

// Test 1: Simple error
echo "Test 1: Logging a simple error...\n";
try {
    throw new Exception('This is a test error for logging demonstration');
} catch (Exception $e) {
    $logger->logError('Test error from PHP script', $e, [
        'test_type' => 'manual',
        'script' => 'test_error_logging.php'
    ]);
    echo "✓ Simple error logged\n";
}

// Test 2: Database error simulation
echo "\nTest 2: Logging a database error...\n";
try {
    throw new PDOException('Connection failed: Access denied for user \'test_user\'@\'localhost\'');
} catch (Exception $e) {
    $logger->logError('Database connection test failed', $e, [
        'test_type' => 'database',
        'database' => 'test_db',
        'host' => 'localhost'
    ]);
    echo "✓ Database error logged\n";
}

// Test 3: Validation error simulation
echo "\nTest 3: Logging a validation error...\n";
try {
    throw new InvalidArgumentException('Invalid email format provided: test@invalid');
} catch (Exception $e) {
    $logger->logError('Validation test failed', $e, [
        'test_type' => 'validation',
        'field' => 'email',
        'value' => 'test@invalid'
    ]);
    echo "✓ Validation error logged\n";
}

// Test 4: File system error simulation
echo "\nTest 4: Logging a file system error...\n";
try {
    throw new RuntimeException('File not found: /nonexistent/path/file.txt');
} catch (Exception $e) {
    $logger->logError('File system test failed', $e, [
        'test_type' => 'filesystem',
        'attempted_path' => '/nonexistent/path/file.txt'
    ]);
    echo "✓ File system error logged\n";
}

// Test 5: API error simulation
echo "\nTest 5: Logging an API error...\n";
try {
    throw new Exception('Failed to connect to external API: Connection timeout');
} catch (Exception $e) {
    $logger->logError('External API test failed', $e, [
        'test_type' => 'api',
        'api_url' => 'http://nonexistent-api.example.com/data',
        'timeout' => 30
    ]);
    echo "✓ API error logged\n";
}

// Get recent errors
echo "\n" . str_repeat("=", 50) . "\n";
echo "Recent Errors in Log:\n";
echo str_repeat("=", 50) . "\n";

$recentErrors = $logger->getRecentErrors(5);
foreach ($recentErrors as $index => $error) {
    echo "\nError #" . ($index + 1) . ":\n";
    echo "  Timestamp: " . $error['timestamp'] . "\n";
    echo "  Level: " . $error['level'] . "\n";
    echo "  Message: " . $error['message'] . "\n";
    if (isset($error['exception'])) {
        echo "  Exception: " . $error['exception']['class'] . "\n";
        echo "  Exception Message: " . $error['exception']['message'] . "\n";
    }
    if (isset($error['context'])) {
        echo "  Context: " . json_encode($error['context'], JSON_PRETTY_PRINT) . "\n";
    }
    echo str_repeat("-", 40) . "\n";
}

// Get log stats
echo "\nLog Statistics:\n";
$stats = $logger->getLogStats();
echo "  Total Files: " . $stats['file_count'] . "\n";
echo "  Total Size: " . number_format($stats['total_size']) . " bytes\n";
if ($stats['latest_error']) {
    echo "  Latest Error: " . $stats['latest_error']['timestamp'] . "\n";
} else {
    echo "  Latest Error: None\n";
}

echo "\n✓ Error logging test completed successfully!\n";
echo "Check the logs directory for the error.log file.\n";
