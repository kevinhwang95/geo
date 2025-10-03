<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use App\Database;
use App\Auth;
use App\Controllers\AuthController;
use App\Controllers\OAuthController;
use App\Controllers\LandController;
use App\Controllers\UserController;
use App\Controllers\PlantTypeController;
use App\Controllers\CategoryController;
use App\Controllers\CommentController;
use App\Controllers\PhotoController;
use App\Controllers\NotificationController;
use App\Controllers\EnhancedNotificationController;

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

// Handle static file serving for uploads
$requestUri = $_SERVER['REQUEST_URI'];
if (strpos($requestUri, '/uploads/') === 0) {
    $filePath = __DIR__ . '/../' . ltrim($requestUri, '/');
    
    if (file_exists($filePath) && is_file($filePath)) {
        // Get file info
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $filePath);
        finfo_close($finfo);
        
        // Set appropriate headers
        header('Content-Type: ' . $mimeType);
        header('Content-Length: ' . filesize($filePath));
        header('Cache-Control: public, max-age=31536000'); // Cache for 1 year
        
        // Output file
        readfile($filePath);
        exit;
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'File not found']);
        exit;
    }
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

        case 'oauth':
            $oauthController = new OAuthController();
            switch ($pathParts[1] ?? '') {
                case 'google':
                    if ($pathParts[2] ?? '' === 'callback') {
                        if ($method === 'GET') {
                            // Handle OAuth callback directly here
                            $code = $_GET['code'] ?? null;
                            $state = $_GET['state'] ?? null;
                            $error = $_GET['error'] ?? null;

                            if ($error) {
                                $frontendUrl = $_ENV['CORS_ORIGIN'] ?? 'http://localhost:5173';
                                header("Location: {$frontendUrl}/oauth/callback?error=" . urlencode($error));
                                exit;
                            }

                            if (!$code) {
                                $frontendUrl = $_ENV['CORS_ORIGIN'] ?? 'http://localhost:5173';
                                header("Location: {$frontendUrl}/oauth/callback?error=no_code");
                                exit;
                            }

                            try {
                                $result = Auth::handleGoogleOAuth($code);
                                
                                if (!$result) {
                                    $frontendUrl = $_ENV['CORS_ORIGIN'] ?? 'http://localhost:5173';
                                    header("Location: {$frontendUrl}/oauth/callback?error=auth_failed");
                                    exit;
                                }

                                $tokens = $result['tokens'];
                                $user = $result['user'];

                                $frontendUrl = $_ENV['CORS_ORIGIN'] ?? 'http://localhost:5173';
                                $successData = base64_encode(json_encode([
                                    'success' => true,
                                    'tokens' => $tokens,
                                    'user' => $user
                                ]));
                                
                                header("Location: {$frontendUrl}/oauth/callback?success=" . urlencode($successData));
                                exit;

                            } catch (Exception $e) {
                                // For development: If SSL error, try with mock code
                                if (strpos($e->getMessage(), 'SSL certificate problem') !== false) {
                                    try {
                                        $result = Auth::handleGoogleOAuth('dev_test_code');
                                        
                                        if ($result) {
                                            $tokens = $result['tokens'];
                                            $user = $result['user'];

                                            $frontendUrl = $_ENV['CORS_ORIGIN'] ?? 'http://localhost:5173';
                                            $successData = base64_encode(json_encode([
                                                'success' => true,
                                                'tokens' => $tokens,
                                                'user' => $user
                                            ]));
                                            
                                            header("Location: {$frontendUrl}/oauth/callback?success=" . urlencode($successData));
                                            exit;
                                        }
                                    } catch (Exception $mockError) {
                                        // Fall through to error handling
                                    }
                                }
                                
                                $frontendUrl = $_ENV['CORS_ORIGIN'] ?? 'http://localhost:5173';
                                header("Location: {$frontendUrl}/oauth/callback?error=server_error");
                                exit;
                            }
                        } else {
                            http_response_code(405);
                            echo json_encode(['error' => 'Method not allowed']);
                        }
                    } else {
                        if ($method === 'POST') {
                            $oauthController->googleLogin();
                        } else {
                            http_response_code(405);
                            echo json_encode(['error' => 'Method not allowed']);
                        }
                    }
                    break;
                case 'google-url':
                    if ($method === 'GET') {
                        $oauthController->getGoogleAuthUrl();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'refresh':
                    if ($method === 'POST') {
                        $oauthController->refreshToken();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'logout':
                    if ($method === 'POST') {
                        $oauthController->logout();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                default:
                    http_response_code(404);
                    echo json_encode(['error' => 'OAuth endpoint not found']);
            }
            break;

        case 'plant-types':
            $plantTypeController = new PlantTypeController();
            switch ($method) {
                case 'GET':
                    if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                        $plantTypeController->show($pathParts[1]);
                    } else {
                        $plantTypeController->index();
                    }
                    break;
                case 'POST':
                    $plantTypeController->store();
                    break;
                case 'PUT':
                    if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                        $plantTypeController->update($pathParts[1]);
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'Plant type ID required']);
                    }
                    break;
                case 'DELETE':
                    if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                        $plantTypeController->delete($pathParts[1]);
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'Plant type ID required']);
                    }
                    break;
                default:
                    http_response_code(405);
                    echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'categories':
            $categoryController = new CategoryController();
            switch ($method) {
                case 'GET':
                    if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                        $categoryController->show($pathParts[1]);
                    } else {
                        $categoryController->index();
                    }
                    break;
                case 'POST':
                    $categoryController->store();
                    break;
                case 'PUT':
                    if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                        $categoryController->update($pathParts[1]);
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'Category ID required']);
                    }
                    break;
                case 'DELETE':
                    if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                        $categoryController->delete($pathParts[1]);
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'Category ID required']);
                    }
                    break;
                default:
                    http_response_code(405);
                    echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'comments':
            $commentController = new CommentController();
            switch ($method) {
                case 'GET':
                    if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                        $commentController->show($pathParts[1]);
                    } else {
                        $commentController->index();
                    }
                    break;
                case 'POST':
                    $commentController->store();
                    break;
                case 'PUT':
                    if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                        $commentController->update($pathParts[1]);
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'Comment ID required']);
                    }
                    break;
                case 'DELETE':
                    if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                        $commentController->delete($pathParts[1]);
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'Comment ID required']);
                    }
                    break;
                default:
                    http_response_code(405);
                    echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'photos':
            $photoController = new PhotoController();
            switch ($method) {
                case 'GET':
                    if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                        $photoController->getPhoto($pathParts[1]);
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'Photo ID required']);
                    }
                    break;
                case 'POST':
                    if ($pathParts[1] === 'upload') {
                        $photoController->upload();
                    } else {
                        http_response_code(404);
                        echo json_encode(['error' => 'Photo endpoint not found']);
                    }
                    break;
                case 'DELETE':
                    if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                        $photoController->delete($pathParts[1]);
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'Photo ID required']);
                    }
                    break;
                default:
                    http_response_code(405);
                    echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'notifications':
            $notificationController = new NotificationController();
            switch ($pathParts[1] ?? '') {
                case 'unread-count':
                    if ($method === 'GET') {
                        $notificationController->getUnreadCount();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'mark-read':
                    if ($method === 'POST' && isset($pathParts[2]) && is_numeric($pathParts[2])) {
                        $notificationController->markAsRead($pathParts[2]);
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'Notification ID required']);
                    }
                    break;
                case 'dismiss':
                    if ($method === 'POST' && isset($pathParts[2]) && is_numeric($pathParts[2])) {
                        $notificationController->dismiss($pathParts[2]);
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'Notification ID required']);
                    }
                    break;
                case 'show':
                    if ($method === 'GET' && isset($pathParts[2]) && is_numeric($pathParts[2])) {
                        $notificationController->show($pathParts[2]);
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'Notification ID required']);
                    }
                    break;
                case 'dismiss-all':
                    if ($method === 'POST') {
                        $notificationController->dismissAll();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'create-harvest':
                    if ($method === 'POST') {
                        $notificationController->createHarvestNotifications();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'create-maintenance':
                    if ($method === 'POST') {
                        $enhancedController = new EnhancedNotificationController();
                        $enhancedController->createMaintenanceNotification();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'create-comment':
                    if ($method === 'POST') {
                        $enhancedController = new EnhancedNotificationController();
                        $enhancedController->createCommentNotification();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'create-photo':
                    if ($method === 'POST') {
                        $enhancedController = new EnhancedNotificationController();
                        $enhancedController->createPhotoNotification();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'create-weather-alert':
                    if ($method === 'POST') {
                        $enhancedController = new EnhancedNotificationController();
                        $enhancedController->createWeatherAlert();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'create-system':
                    if ($method === 'POST') {
                        $enhancedController = new EnhancedNotificationController();
                        $enhancedController->createSystemNotification();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'stats':
                    if ($method === 'GET') {
                        $enhancedController = new EnhancedNotificationController();
                        $enhancedController->getStats();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'cleanup':
                    if ($method === 'POST') {
                        $enhancedController = new EnhancedNotificationController();
                        $enhancedController->cleanup();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                default:
                    if ($method === 'GET') {
                        $notificationController->index();
                    } elseif ($method === 'POST') {
                        $notificationController->store();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
            }
            break;

        case 'notifications-enhanced':
            $enhancedController = new EnhancedNotificationController();
            switch ($method) {
                case 'GET':
                    $enhancedController->index();
                    break;
                default:
                    http_response_code(405);
                    echo json_encode(['error' => 'Method not allowed']);
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
