<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use App\Database;
use App\Auth;
use App\Controllers\AuthController;
use App\Controllers\LandController;
use App\Controllers\UserController;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Initialize Auth
Auth::init();

// Set CORS headers
$corsOrigin = $_ENV['CORS_ORIGIN'] ?? 'http://localhost:5173';
header("Access-Control-Allow-Origin: {$corsOrigin}");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Initialize database connection
try {
    Database::getInstance();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

// Parse the request URI
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);
$path = str_replace('/api', '', $path);
$path = trim($path, '/');

// Route the request
$method = $_SERVER['REQUEST_METHOD'];
$pathParts = explode('/', $path);

try {
    switch ($pathParts[0]) {
        case 'auth':
            $authController = new AuthController();
            switch ($pathParts[1] ?? '') {
                case 'login':
                    if ($method === 'POST') {
                        $authController->login();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'logout':
                    if ($method === 'POST') {
                        $authController->logout();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'profile':
                    if ($method === 'GET') {
                        $authController->profile();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'refresh':
                    if ($method === 'POST') {
                        $authController->refresh();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                default:
                    http_response_code(404);
                    echo json_encode(['error' => 'Auth endpoint not found']);
            }
            break;

        case 'lands':
            $landController = new LandController();
            switch ($method) {
                case 'GET':
                    if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                        $landController->show($pathParts[1]);
                    } else {
                        $landController->index();
                    }
                    break;
                case 'POST':
                    $landController->store();
                    break;
                case 'PUT':
                    if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                        $landController->update($pathParts[1]);
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'Land ID required']);
                    }
                    break;
                case 'DELETE':
                    if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                        $landController->delete($pathParts[1]);
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'Land ID required']);
                    }
                    break;
                default:
                    http_response_code(405);
                    echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'users':
            $userController = new UserController();
            switch ($method) {
                case 'GET':
                    if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                        $userController->show($pathParts[1]);
                    } else {
                        $userController->index();
                    }
                    break;
                case 'POST':
                    $userController->store();
                    break;
                case 'PUT':
                    if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                        $userController->update($pathParts[1]);
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'User ID required']);
                    }
                    break;
                case 'DELETE':
                    if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                        $userController->delete($pathParts[1]);
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'User ID required']);
                    }
                    break;
                default:
                    http_response_code(405);
                    echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        default:
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error: ' . $e->getMessage()]);
}
