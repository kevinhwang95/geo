<?php

namespace App;

class ErrorLogger
{
    private static $instance = null;
    private $logDir;
    private $maxFileSize = 5 * 1024 * 1024; // 5MB
    private $maxFiles = 10; // Keep 10 rotated files
    private $context = [];

    private function __construct()
    {
        // Get log directory from environment variable or use default
        $logDir = $_ENV['LOG_DIR'] ?? 'logs';
        
        // If relative path, make it relative to the backend directory
        if (!str_starts_with($logDir, '/') && !str_starts_with($logDir, 'C:')) {
            $this->logDir = __DIR__ . '/../../' . $logDir;
        } else {
            $this->logDir = $logDir;
        }
        
        if (!is_dir($this->logDir)) {
            mkdir($this->logDir, 0755, true);
        }
    }

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function setContext(array $context): void
    {
        $this->context = array_merge($this->context, $context);
    }

    public function getLogDir(): string
    {
        return $this->logDir;
    }

    public function logError(string $message, ?\Throwable $exception = null, array $context = []): void
    {
        $logEntry = [
            'timestamp' => date('c'),
            'level' => 'ERROR',
            'message' => $message,
            'request_id' => $_SERVER['HTTP_X_REQUEST_ID'] ?? uniqid(),
            'url' => $_SERVER['REQUEST_URI'] ?? '',
            'method' => $_SERVER['REQUEST_METHOD'] ?? '',
            'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'context' => array_merge($this->context, $context),
        ];

        if ($exception) {
            $logEntry['exception'] = [
                'class' => get_class($exception),
                'message' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
                'trace' => $exception->getTraceAsString()
            ];
        }

        $this->writeToFile('error.log', json_encode($logEntry) . "\n");
    }

    public function getRecentErrors(int $count = 50): array
    {
        $logFile = $this->logDir . '/error.log';
        if (!file_exists($logFile)) {
            return [];
        }

        $lines = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            return [];
        }

        // Get last $count lines
        $recentLines = array_slice($lines, -$count);
        $errors = [];

        foreach ($recentLines as $line) {
            $decoded = json_decode($line, true);
            if ($decoded) {
                $errors[] = $decoded;
            }
        }

        return array_reverse($errors); // Most recent first
    }

    public function clearLogs(): bool
    {
        $logFile = $this->logDir . '/error.log';
        if (file_exists($logFile)) {
            return unlink($logFile);
        }
        return true;
    }

    private function writeToFile(string $filename, string $content): void
    {
        $filePath = $this->logDir . '/' . $filename;
        
        // Check if file needs rotation
        if (file_exists($filePath) && filesize($filePath) > $this->maxFileSize) {
            $this->rotateFile($filePath);
        }

        file_put_contents($filePath, $content, FILE_APPEND | LOCK_EX);
    }

    private function rotateFile(string $filePath): void
    {
        // Rotate existing files
        for ($i = $this->maxFiles - 1; $i >= 1; $i--) {
            $oldFile = $filePath . '.' . $i;
            $newFile = $filePath . '.' . ($i + 1);
            
            if (file_exists($oldFile)) {
                if ($i === $this->maxFiles - 1) {
                    // Delete the oldest file
                    unlink($oldFile);
                } else {
                    rename($oldFile, $newFile);
                }
            }
        }

        // Move current file to .1
        if (file_exists($filePath)) {
            rename($filePath, $filePath . '.1');
        }
    }

    public function getLogStats(): array
    {
        $logFile = $this->logDir . '/error.log';
        $stats = [
            'total_size' => 0,
            'file_count' => 0,
            'latest_error' => null
        ];

        // Count all log files
        $files = glob($this->logDir . '/error.log*');
        $stats['file_count'] = count($files);

        foreach ($files as $file) {
            $stats['total_size'] += filesize($file);
        }

        // Get latest error
        $errors = $this->getRecentErrors(1);
        if (!empty($errors)) {
            $stats['latest_error'] = $errors[0];
        }

        return $stats;
    }
}
