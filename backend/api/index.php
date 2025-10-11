<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use App\Database;
use App\Auth;
use App\Controllers\AuthController;
use App\Controllers\LandController;
use App\Controllers\UserController;
use App\Controllers\TeamController;
use App\Controllers\PlantTypeController;
use App\Controllers\CategoryController;
use App\Controllers\WorkCategoryController;
use App\Controllers\CommentController;
use App\Controllers\PhotoController;
use App\Controllers\NotificationController;
use App\Controllers\EnhancedNotificationController;
use App\Controllers\NavigationMenuController;
use App\Controllers\PasswordController;
use App\Controllers\EndpointPermissionController;
use App\Controllers\EmailTemplateController;

// Load environment variables
try {
    $dotenv = Dotenv::createImmutable(__DIR__ . '/..');
    $dotenv->load();
} catch (Exception $e) {
    // If .env parsing fails, continue with defaults
    error_log("Dotenv parsing warning: " . $e->getMessage());
}

// Initialize Auth
Auth::init();

// Set CORS headers
$corsOrigin = $_ENV['CORS_ORIGIN'] ?? 'http://localhost:5173';
header("Access-Control-Allow-Origin: {$corsOrigin}");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Max-Age: 86400"); // Cache preflight for 24 hours
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

// Initialize Auth class
Auth::init();

// Parse the request URI
$path = parse_url($requestUri, PHP_URL_PATH);
$path = str_replace('/api', '', $path);
$path = trim($path, '/');

// Helper function to check endpoint permissions
function checkEndpointPermission($endpointKey, $method = null) {
    try {
        Auth::requireEndpointPermission($endpointKey, $method);
        return true;
    } catch (Exception $e) {
        return false;
    }
}

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
                case 'register':
                    if ($method === 'POST') {
                        $authController->register();
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
                case 'setup-password':
                    if ($method === 'POST') {
                        $authController->setupPassword();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'request-password-reset':
                    if ($method === 'POST') {
                        $authController->requestPasswordReset();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'reset-password':
                    if ($method === 'POST') {
                        $authController->resetPassword();
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
                case 'admin-users':
                    if ($method === 'GET') {
                        $notificationController->getAdminUsers();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'history':
                    if ($method === 'GET') {
                        $notificationController->getNotificationHistory();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'release':
                    if ($method === 'POST') {
                        $notificationController->sendReleaseNotification();
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

        case 'farm-works':
            $farmWorkController = new \App\Controllers\FarmWorkController();
            switch ($pathParts[1] ?? '') {
                case 'categories':
                    if ($method === 'GET') {
                        $farmWorkController->getCategories();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'work-types':
                    if ($method === 'GET') {
                        $farmWorkController->getWorkTypes();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'test':
                    if ($method === 'GET') {
                        $farmWorkController->test();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'team-workload':
                    if ($method === 'GET') {
                        $farmWorkController->getTeamWorkloadStatus();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'assign-to-team':
                    if ($method === 'POST' && isset($pathParts[2]) && is_numeric($pathParts[2])) {
                        $farmWorkController->assignToTeam($pathParts[2]);
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'Work ID required']);
                    }
                    break;
                case 'complete':
                    if ($method === 'POST' && isset($pathParts[2]) && is_numeric($pathParts[2])) {
                        $farmWorkController->completeWork($pathParts[2]);
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'Work ID required']);
                    }
                    break;
                case 'create-from-notifications':
                    if ($method === 'POST') {
                        $notificationService = new \App\FarmWorkNotificationService();
                        $result = $notificationService->createFarmWorkFromHarvestNotifications();
                        echo json_encode([
                            'success' => true,
                            'message' => "Created {$result['works_created']} farm works from {$result['total_notifications']} harvest notifications",
                            'data' => $result
                        ]);
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                default:
                    // Handle standard CRUD operations
                    if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                        // /farm-works/{id}
                        switch ($method) {
                            case 'GET':
                                $farmWorkController->show($pathParts[1]);
                                break;
                            case 'PUT':
                                $farmWorkController->update($pathParts[1]);
                                break;
                            case 'DELETE':
                                $farmWorkController->destroy($pathParts[1]);
                                break;
                            default:
                                http_response_code(405);
                                echo json_encode(['error' => 'Method not allowed']);
                        }
                    } else {
                        // /farm-works
                        switch ($method) {
                            case 'GET':
                                $farmWorkController->index();
                                break;
                            case 'POST':
                                $farmWorkController->store();
                                break;
                            default:
                                http_response_code(405);
                                echo json_encode(['error' => 'Method not allowed']);
                        }
                    }
            }
            break;

        case 'work-statuses':
            $workStatusController = new \App\Controllers\WorkStatusController();
            switch ($pathParts[1] ?? '') {
                case 'final':
                    if ($method === 'GET') {
                        $workStatusController->getFinalStatuses();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'non-final':
                    if ($method === 'GET') {
                        $workStatusController->getNonFinalStatuses();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'statistics':
                    if ($method === 'GET') {
                        $workStatusController->getStatistics();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                default:
                    // Handle standard CRUD operations
                    if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                        // /work-statuses/{id}
                        switch ($method) {
                            case 'GET':
                                $workStatusController->show($pathParts[1]);
                                break;
                            case 'PUT':
                                $workStatusController->update($pathParts[1]);
                                break;
                            case 'DELETE':
                                $workStatusController->delete($pathParts[1]);
                                break;
                            default:
                                http_response_code(405);
                                echo json_encode(['error' => 'Method not allowed']);
                        }
                    } else {
                        // /work-statuses
                        switch ($method) {
                            case 'GET':
                                $workStatusController->index();
                                break;
                            case 'POST':
                                $workStatusController->store();
                                break;
                            default:
                                http_response_code(405);
                                echo json_encode(['error' => 'Method not allowed']);
                        }
                    }
            }
            break;

        case 'work-types':
            $workTypeController = new \App\Controllers\WorkTypeController();
            switch ($pathParts[1] ?? '') {
                case 'by-category':
                    if ($method === 'GET' && isset($pathParts[2])) {
                        $workTypeController->getByCategory($pathParts[2]);
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                default:
                    // Handle standard CRUD operations
                    if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                        // /work-types/{id}
                        switch ($method) {
                            case 'GET':
                                $workTypeController->show($pathParts[1]);
                                break;
                            case 'PUT':
                                $workTypeController->update($pathParts[1]);
                                break;
                            case 'DELETE':
                                $workTypeController->destroy($pathParts[1]);
                                break;
                            default:
                                http_response_code(405);
                                echo json_encode(['error' => 'Method not allowed']);
                        }
                    } else {
                        // /work-types
                        switch ($method) {
                            case 'GET':
                                $workTypeController->index();
                                break;
                            case 'POST':
                                $workTypeController->store();
                                break;
                            default:
                                http_response_code(405);
                                echo json_encode(['error' => 'Method not allowed']);
                        }
                    }
            }
            break;

        case 'work-categories':
            $workCategoryController = new \App\Controllers\WorkCategoryController();
            switch ($pathParts[1] ?? '') {
                default:
                    // Handle standard CRUD operations
                    if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                        // /work-categories/{id}
                        switch ($method) {
                            case 'GET':
                                $workCategoryController->show($pathParts[1]);
                                break;
                            case 'PUT':
                                $workCategoryController->update($pathParts[1]);
                                break;
                            case 'DELETE':
                                $workCategoryController->destroy($pathParts[1]);
                                break;
                            default:
                                http_response_code(405);
                                echo json_encode(['error' => 'Method not allowed']);
                        }
                    } else {
                        // /work-categories
                        switch ($method) {
                            case 'GET':
                                $workCategoryController->index();
                                break;
                            case 'POST':
                                $workCategoryController->store();
                                break;
                            default:
                                http_response_code(405);
                                echo json_encode(['error' => 'Method not allowed']);
                        }
                    }
            }
            break;

        case 'photos':
            $unifiedPhotoController = new \App\Controllers\UnifiedPhotoController();
            switch ($pathParts[1] ?? '') {
                case 'upload':
                    if ($method === 'POST') {
                        $unifiedPhotoController->upload();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'context':
                    if ($method === 'GET') {
                        $unifiedPhotoController->getByContext();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                default:
                    // Handle standard CRUD operations
                    if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                        // /photos/{id}
                        switch ($method) {
                            case 'GET':
                                $unifiedPhotoController->show($pathParts[1]);
                                break;
                            case 'DELETE':
                                $unifiedPhotoController->destroy($pathParts[1]);
                                break;
                            default:
                                http_response_code(405);
                                echo json_encode(['error' => 'Method not allowed']);
                        }
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'Photo ID required']);
                    }
            }
            break;

        case 'work-notes':
            $workNoteController = new \App\Controllers\WorkNoteController();
            switch ($pathParts[1] ?? '') {
                case 'add-photo':
                    if ($method === 'POST' && isset($pathParts[2]) && is_numeric($pathParts[2])) {
                        $workNoteController->addPhoto($pathParts[2]);
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'Note ID required']);
                    }
                    break;
                case 'remove-photo':
                    if ($method === 'POST' && isset($pathParts[2]) && is_numeric($pathParts[2])) {
                        $workNoteController->removePhoto($pathParts[2]);
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'Note ID required']);
                    }
                    break;
                case 'photos':
                    if ($method === 'GET' && isset($pathParts[2]) && is_numeric($pathParts[2])) {
                        $workNoteController->getPhotos($pathParts[2]);
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'Note ID required']);
                    }
                    break;
                case 'mark-read':
                    if ($method === 'POST' && isset($pathParts[2]) && is_numeric($pathParts[2])) {
                        $workNoteController->markAsRead($pathParts[2]);
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'Note ID required']);
                    }
                    break;
                case 'dismiss':
                    if ($method === 'POST' && isset($pathParts[2]) && is_numeric($pathParts[2])) {
                        $workNoteController->dismiss($pathParts[2]);
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'Note ID required']);
                    }
                    break;
                case 'readers':
                    if ($method === 'GET' && isset($pathParts[2]) && is_numeric($pathParts[2])) {
                        $workNoteController->getReaders($pathParts[2]);
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'Note ID required']);
                    }
                    break;
                default:
                    // Handle standard CRUD operations
                    if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                        // /work-notes/{id}
                        switch ($method) {
                            case 'PUT':
                                $workNoteController->update($pathParts[1]);
                                break;
                            case 'DELETE':
                                $workNoteController->destroy($pathParts[1]);
                                break;
                            default:
                                http_response_code(405);
                                echo json_encode(['error' => 'Method not allowed']);
                        }
                    } else {
                        // /work-notes
                        switch ($method) {
                            case 'GET':
                                if (isset($_GET['work_id'])) {
                                    $workNoteController->getByWorkId($_GET['work_id']);
                                } else {
                                    http_response_code(400);
                                    echo json_encode(['error' => 'work_id parameter required']);
                                }
                                break;
                            case 'POST':
                                $workNoteController->store();
                                break;
                            default:
                                http_response_code(405);
                                echo json_encode(['error' => 'Method not allowed']);
                        }
                    }
            }
            break;

        case 'teams':
            $teamController = new TeamController();
            switch ($pathParts[1] ?? '') {
                case 'add-member':
                    if ($method === 'POST' && isset($pathParts[2]) && is_numeric($pathParts[2])) {
                        $teamController->addMember($pathParts[2]);
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'Team ID required']);
                    }
                    break;
                case 'remove-member':
                    if ($method === 'POST' && isset($pathParts[2]) && is_numeric($pathParts[2])) {
                        $teamController->removeMember($pathParts[2]);
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'Team ID required']);
                    }
                    break;
                case 'members':
                    if ($method === 'GET' && isset($pathParts[2]) && is_numeric($pathParts[2])) {
                        $teamController->getMembers($pathParts[2]);
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'Team ID required']);
                    }
                    break;
                default:
                    // Handle /teams/{id}/members pattern
                    if (isset($pathParts[1]) && is_numeric($pathParts[1]) && isset($pathParts[2]) && $pathParts[2] === 'members') {
                        if ($method === 'GET') {
                            $teamController->getMembers($pathParts[1]);
                        } elseif ($method === 'POST') {
                            // Handle add-member and remove-member for /teams/{id}/members pattern
                            $input = json_decode(file_get_contents('php://input'), true);
                            if (isset($input['action'])) {
                                if ($input['action'] === 'add' && isset($input['userId'])) {
                                    $teamController->addMember($pathParts[1]);
                                } elseif ($input['action'] === 'remove' && isset($input['userId'])) {
                                    $teamController->removeMember($pathParts[1]);
                                } else {
                                    http_response_code(400);
                                    echo json_encode(['error' => 'Invalid action or missing userId']);
                                }
                            } else {
                                http_response_code(400);
                                echo json_encode(['error' => 'Action required']);
                            }
                        }
                        break;
                    }
                    switch ($method) {
                        case 'GET':
                            if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                                $teamController->show($pathParts[1]);
                            } else {
                                $teamController->index();
                            }
                            break;
                        case 'POST':
                            $teamController->store();
                            break;
                        case 'PUT':
                            if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                                $teamController->update($pathParts[1]);
                            } else {
                                http_response_code(400);
                                echo json_encode(['error' => 'Team ID required']);
                            }
                            break;
                        case 'DELETE':
                            if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                                $teamController->delete($pathParts[1]);
                            } else {
                                http_response_code(400);
                                echo json_encode(['error' => 'Team ID required']);
                            }
                            break;
                        default:
                            http_response_code(405);
                            echo json_encode(['error' => 'Method not allowed']);
                    }
            }
            break;


        case 'navigation-menus':
            $navMenuController = new NavigationMenuController();
            switch ($method) {
                case 'GET':
                    if (isset($pathParts[1]) && $pathParts[1] === 'role') {
                        // Get menus for specific role: /api/navigation-menus/role/{role}
                        $role = $pathParts[2] ?? '';
                        if (empty($role)) {
                            http_response_code(400);
                            echo json_encode(['error' => 'Role parameter required']);
                        } else {
                            $result = $navMenuController->getMenusForRole($role);
                            echo json_encode($result);
                        }
                    } else {
                        // Get all menus (admin only)
                        $result = $navMenuController->getAllMenus();
                        echo json_encode($result);
                    }
                    break;
                case 'POST':
                    $input = json_decode(file_get_contents('php://input'), true);
                    $result = $navMenuController->createMenu($input);
                    echo json_encode($result);
                    break;
                case 'PUT':
                    if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                        $input = json_decode(file_get_contents('php://input'), true);
                        $result = $navMenuController->updateMenu($pathParts[1], $input);
                        echo json_encode($result);
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'Menu ID required']);
                    }
                    break;
                case 'DELETE':
                    if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                        $result = $navMenuController->deleteMenu($pathParts[1]);
                        echo json_encode($result);
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'Menu ID required']);
                    }
                    break;
                default:
                    http_response_code(405);
                    echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'menu-order':
            $navMenuController = new NavigationMenuController();
            if ($method === 'PUT') {
                $input = json_decode(file_get_contents('php://input'), true);
                $result = $navMenuController->updateMenuOrder($input);
                echo json_encode($result);
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'password':
            $passwordController = new PasswordController();
            switch ($pathParts[1] ?? '') {
                case 'setup-email':
                    if ($method === 'POST') {
                        $passwordController->sendPasswordSetupEmail();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'validate-token':
                    if ($method === 'POST') {
                        $passwordController->validatePasswordSetupToken();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'validate-reset-token':
                    if ($method === 'POST') {
                        $passwordController->validatePasswordResetToken();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'setup':
                    if ($method === 'POST') {
                        $passwordController->setupPassword();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'reset-email':
                    if ($method === 'POST') {
                        $passwordController->sendPasswordResetEmail();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                case 'reset':
                    if ($method === 'POST') {
                        $passwordController->resetPassword();
                    } else {
                        http_response_code(405);
                        echo json_encode(['error' => 'Method not allowed']);
                    }
                    break;
                default:
                    http_response_code(404);
                    echo json_encode(['error' => 'Password endpoint not found']);
            }
            break;

        case 'endpoint-permissions':
            $endpointPermissionController = new EndpointPermissionController();
            switch ($method) {
                case 'GET':
                    if (isset($pathParts[1]) && $pathParts[1] === 'role') {
                        // Get permissions for specific role: /api/endpoint-permissions/role/{role}
                        $role = $pathParts[2] ?? '';
                        if (empty($role)) {
                            http_response_code(400);
                            echo json_encode(['error' => 'Role parameter required']);
                        } else {
                            $result = $endpointPermissionController->getRolePermissions($role);
                            echo json_encode($result);
                        }
                    } elseif (isset($pathParts[1]) && $pathParts[1] === 'matrix') {
                        // Get permission matrix: /api/endpoint-permissions/matrix
                        $result = $endpointPermissionController->getPermissionMatrix();
                        echo json_encode($result);
                    } else {
                        // Get all endpoint permissions
                        $result = $endpointPermissionController->index();
                        echo json_encode($result);
                    }
                    break;
                case 'POST':
                    if (isset($pathParts[1]) && $pathParts[1] === 'bulk-update') {
                        // Bulk update permissions
                        $endpointPermissionController->bulkUpdatePermissions();
                    } else {
                        // Update single permission
                        $endpointPermissionController->updatePermission();
                    }
                    break;
                case 'PUT':
                    if (isset($pathParts[1]) && $pathParts[1] === 'reset-defaults') {
                        // Reset to default permissions
                        $endpointPermissionController->resetToDefaults();
                    } else {
                        // Update single permission
                        $endpointPermissionController->updatePermission();
                    }
                    break;
                default:
                    http_response_code(405);
                    echo json_encode(['error' => 'Method not allowed']);
            }
            break;

        case 'email-templates':
            $emailTemplateController = new EmailTemplateController();
            switch ($method) {
                case 'GET':
                    if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                        $emailTemplateController->show($pathParts[1]);
                    } else {
                        $emailTemplateController->index();
                    }
                    break;
                case 'POST':
                    if (isset($pathParts[1]) && $pathParts[1] === 'preview') {
                        $emailTemplateController->preview($pathParts[2] ?? null);
                    } else {
                        $emailTemplateController->store();
                    }
                    break;
                case 'PUT':
                    if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                        $emailTemplateController->update($pathParts[1]);
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'Email template ID required']);
                    }
                    break;
                case 'DELETE':
                    if (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                        $emailTemplateController->delete($pathParts[1]);
                    } else {
                        http_response_code(400);
                        echo json_encode(['error' => 'Email template ID required']);
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
