<?php

namespace App\Controllers;

use App\Auth;
use App\ErrorLogger;

class ErrorLogController
{
    private $errorLogger;

    public function __construct()
    {
        $this->errorLogger = ErrorLogger::getInstance();
    }

    public function getRecentErrors()
    {
        try {
            // Require admin access
            Auth::requireAnyRole(['admin', 'system']);
            
            $count = isset($_GET['count']) ? (int)$_GET['count'] : 50;
            $count = min($count, 100); // Limit to 100 max
            
            $errors = $this->errorLogger->getRecentErrors($count);
            
            echo json_encode([
                'success' => true,
                'data' => $errors
            ]);
            
        } catch (\Exception $e) {
            $this->errorLogger->logError('Failed to get recent errors', $e);
            http_response_code(500);
            echo json_encode(['error' => 'Failed to retrieve error logs']);
        }
    }

    public function getLogStats()
    {
        try {
            // Require admin access
            Auth::requireAnyRole(['admin', 'system']);
            
            $stats = $this->errorLogger->getLogStats();
            
            echo json_encode([
                'success' => true,
                'data' => $stats
            ]);
            
        } catch (\Exception $e) {
            $this->errorLogger->logError('Failed to get log stats', $e);
            http_response_code(500);
            echo json_encode(['error' => 'Failed to retrieve log statistics']);
        }
    }

    public function clearLogs()
    {
        try {
            // Require admin access
            Auth::requireAnyRole(['admin', 'system']);
            
            $success = $this->errorLogger->clearLogs();
            
            if ($success) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Error logs cleared successfully'
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'error' => 'Failed to clear error logs'
                ]);
            }
            
        } catch (\Exception $e) {
            $this->errorLogger->logError('Failed to clear error logs', $e);
            http_response_code(500);
            echo json_encode(['error' => 'Failed to clear error logs']);
        }
    }
}

