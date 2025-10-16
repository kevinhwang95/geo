<?php

namespace App\Controllers;

use App\Auth;
use App\ErrorLogger;

class ErrorTestController
{
    private $errorLogger;

    public function __construct()
    {
        $this->errorLogger = ErrorLogger::getInstance();
    }

    public function testDatabaseError()
    {
        try {
            // Require admin access
            Auth::requireAnyRole(['admin', 'system']);
            
            // Simulate database connection error
            throw new \PDOException('Connection failed: Access denied for user \'test_user\'@\'localhost\'');
            
        } catch (\Exception $e) {
            $this->errorLogger->logError('Database connection test failed', $e, [
                'test_type' => 'database',
                'user_action' => 'test_database_error'
            ]);
            
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Database test error generated',
                'message' => 'This was a test error - check error logs'
            ]);
        }
    }

    public function testValidationError()
    {
        try {
            // Require admin access
            Auth::requireAnyRole(['admin', 'system']);
            
            // Simulate validation error
            $data = json_decode(file_get_contents('php://input'), true);
            if (!isset($data['required_field'])) {
                throw new \InvalidArgumentException('Required field "required_field" is missing');
            }
            
            // Simulate another validation error
            throw new \InvalidArgumentException('Invalid email format provided');
            
        } catch (\Exception $e) {
            $this->errorLogger->logError('Validation test failed', $e, [
                'test_type' => 'validation',
                'user_action' => 'test_validation_error',
                'request_data' => json_decode(file_get_contents('php://input'), true)
            ]);
            
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Validation test error generated',
                'message' => 'This was a test error - check error logs'
            ]);
        }
    }

    public function testFileSystemError()
    {
        try {
            // Require admin access
            Auth::requireAnyRole(['admin', 'system']);
            
            // Simulate file system error
            if (!file_exists('/nonexistent/path/file.txt')) {
                throw new \RuntimeException('File not found: /nonexistent/path/file.txt');
            }
            
        } catch (\Exception $e) {
            $this->errorLogger->logError('File system test failed', $e, [
                'test_type' => 'filesystem',
                'user_action' => 'test_filesystem_error',
                'attempted_path' => '/nonexistent/path/file.txt'
            ]);
            
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'File system test error generated',
                'message' => 'This was a test error - check error logs'
            ]);
        }
    }

    public function testApiError()
    {
        try {
            // Require admin access
            Auth::requireAnyRole(['admin', 'system']);
            
            // Simulate API error
            $response = file_get_contents('http://nonexistent-api.example.com/data');
            if ($response === false) {
                throw new \Exception('Failed to connect to external API: Connection timeout');
            }
            
        } catch (\Exception $e) {
            $this->errorLogger->logError('External API test failed', $e, [
                'test_type' => 'api',
                'user_action' => 'test_api_error',
                'api_url' => 'http://nonexistent-api.example.com/data'
            ]);
            
            http_response_code(502);
            echo json_encode([
                'success' => false,
                'error' => 'API test error generated',
                'message' => 'This was a test error - check error logs'
            ]);
        }
    }

    public function testDivisionByZero()
    {
        try {
            // Require admin access
            Auth::requireAnyRole(['admin', 'system']);
            
            // Simulate division by zero error
            $result = 10 / 0;
            
        } catch (\Exception $e) {
            $this->errorLogger->logError('Mathematical operation test failed', $e, [
                'test_type' => 'mathematical',
                'user_action' => 'test_division_by_zero',
                'operation' => '10 / 0'
            ]);
            
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Mathematical test error generated',
                'message' => 'This was a test error - check error logs'
            ]);
        }
    }

    public function testMemoryError()
    {
        try {
            // Require admin access
            Auth::requireAnyRole(['admin', 'system']);
            
            // Simulate memory exhaustion (safely)
            $largeArray = [];
            for ($i = 0; $i < 10000000; $i++) {
                $largeArray[] = str_repeat('x', 1000);
                if (memory_get_usage() > 100 * 1024 * 1024) { // 100MB limit
                    throw new \Exception('Memory limit exceeded during test');
                }
            }
            
        } catch (\Exception $e) {
            $this->errorLogger->logError('Memory usage test failed', $e, [
                'test_type' => 'memory',
                'user_action' => 'test_memory_error',
                'memory_usage' => memory_get_usage(true),
                'memory_limit' => ini_get('memory_limit')
            ]);
            
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Memory test error generated',
                'message' => 'This was a test error - check error logs'
            ]);
        }
    }

    public function testCustomError()
    {
        try {
            // Require admin access
            Auth::requireAnyRole(['admin', 'system']);
            
            // Simulate custom application error
            throw new \Exception('Custom test error: This is a simulated application error for testing error logging functionality');
            
        } catch (\Exception $e) {
            $this->errorLogger->logError('Custom application test failed', $e, [
                'test_type' => 'custom',
                'user_action' => 'test_custom_error',
                'error_category' => 'application_test',
                'severity' => 'medium'
            ]);
            
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Custom test error generated',
                'message' => 'This was a test error - check error logs'
            ]);
        }
    }

    public function testMultipleErrors()
    {
        try {
            // Require admin access
            Auth::requireAnyRole(['admin', 'system']);
            
            // Generate multiple errors in sequence
            $errors = [];
            
            try {
                throw new \InvalidArgumentException('First test error');
            } catch (\Exception $e) {
                $this->errorLogger->logError('Multiple errors test - Error 1', $e, [
                    'test_type' => 'multiple',
                    'error_sequence' => 1
                ]);
                $errors[] = 'Error 1 logged';
            }
            
            try {
                throw new \RuntimeException('Second test error');
            } catch (\Exception $e) {
                $this->errorLogger->logError('Multiple errors test - Error 2', $e, [
                    'test_type' => 'multiple',
                    'error_sequence' => 2
                ]);
                $errors[] = 'Error 2 logged';
            }
            
            try {
                throw new \Exception('Third test error');
            } catch (\Exception $e) {
                $this->errorLogger->logError('Multiple errors test - Error 3', $e, [
                    'test_type' => 'multiple',
                    'error_sequence' => 3
                ]);
                $errors[] = 'Error 3 logged';
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Multiple test errors generated successfully',
                'errors_logged' => $errors
            ]);
            
        } catch (\Exception $e) {
            $this->errorLogger->logError('Multiple errors test setup failed', $e);
            http_response_code(500);
            echo json_encode(['error' => 'Failed to generate multiple test errors']);
        }
    }
}

