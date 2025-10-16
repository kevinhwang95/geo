<?php

namespace App\Controllers;

use App\Auth;
use App\ErrorLogger;

abstract class BaseController
{
    protected $logger;

    public function __construct()
    {
        // Initialize error logger without requiring authentication
        // Authentication will be handled in individual methods
        $this->logger = ErrorLogger::getInstance();
    }

    protected function handleException(\Exception $e, string $context = ''): void
    {
        $errorLogger = ErrorLogger::getInstance();
        $errorLogger->logError("Exception in {$context}", $e, [
            'exception_class' => get_class($e),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]);
    }
}
