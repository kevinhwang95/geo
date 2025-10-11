<?php

namespace App\Controllers;

use App\Database;
use App\Auth;

class NotificationController
{
    private $db;
    private $emailService;

    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->emailService = new \App\Services\EmailService();
    }

    /**
     * Get notifications (index method for API)
     */
    public function index()
    {
        try {
            Auth::requireAuth();
            
            // Get query parameters
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
            $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
            $user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;
            
            // Build base query
            $sql = "
                SELECT 
                    n.id,
                    n.land_id,
                    n.user_id,
                    n.type,
                    n.priority,
                    n.title,
                    n.message,
                    n.is_read,
                    n.is_dismissed,
                    n.created_at,
                    n.updated_at,
                    l.land_name,
                    l.land_code,
                    CONCAT(u.first_name, ' ', u.last_name) as user_name
                FROM notifications n
                LEFT JOIN lands l ON n.land_id = l.id
                LEFT JOIN users u ON n.user_id = u.id
                WHERE 1=1
            ";
            
            $params = [];
            
            // Filter by user if specified
            if ($user_id) {
                $sql .= " AND n.user_id = ?";
                $params[] = $user_id;
            }
            
            // Add ordering and pagination
            $sql .= " ORDER BY n.created_at DESC LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;
            
            $notifications = $this->db->fetchAll($sql, $params);
            
            // Get total count for pagination
            $countSql = "
                SELECT COUNT(*) as total 
                FROM notifications n 
                WHERE 1=1
            ";
            $countParams = [];
            
            if ($user_id) {
                $countSql .= " AND n.user_id = ?";
                $countParams[] = $user_id;
            }
            
            $totalResult = $this->db->fetchOne($countSql, $countParams);
            $total = $totalResult['total'];
            
            echo json_encode([
                'success' => true,
                'data' => $notifications,
                'pagination' => [
                    'total' => $total,
                    'limit' => $limit,
                    'offset' => $offset,
                    'has_more' => ($offset + $limit) < $total
                ]
            ]);

        } catch (Exception $e) {
            error_log("NotificationController::index error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch notifications']);
        }
    }

    /**
     * Create a new notification (store method for API)
     */
    public function store()
    {
        try {
            Auth::requireAnyRole(['system', 'admin', 'contributor']);
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid input']);
                return;
            }
            
            // Validate required fields
            $requiredFields = ['land_id', 'user_id', 'type', 'title', 'message'];
            foreach ($requiredFields as $field) {
                if (!isset($input[$field]) || empty($input[$field])) {
                    http_response_code(400);
                    echo json_encode(['error' => "Field '$field' is required"]);
                    return;
                }
            }
            
            // Insert notification
            $sql = "
                INSERT INTO notifications 
                (land_id, user_id, type, priority, title, message, is_read, is_dismissed, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, 0, 0, NOW(), NOW())
            ";
            
            $priority = $input['priority'] ?? 'medium';
            
            $this->db->query($sql, [
                $input['land_id'],
                $input['user_id'],
                $input['type'],
                $priority,
                $input['title'],
                $input['message']
            ]);
            
            $notificationId = $this->db->lastInsertId();
            
            echo json_encode([
                'success' => true,
                'message' => 'Notification created successfully',
                'data' => [
                    'id' => $notificationId,
                    'land_id' => $input['land_id'],
                    'user_id' => $input['user_id'],
                    'type' => $input['type'],
                    'priority' => $priority,
                    'title' => $input['title'],
                    'message' => $input['message']
                ]
            ]);

        } catch (Exception $e) {
            error_log("NotificationController::store error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create notification']);
        }
    }

    /**
     * Get admin users for sending notifications
     */
    public function getAdminUsers()
    {
        try {
            Auth::requireAnyRole(['system', 'admin']);
            
            $sql = "SELECT id, first_name, last_name, email FROM users WHERE role IN ('admin', 'system') AND email IS NOT NULL ORDER BY first_name, last_name";
            $adminUsers = $this->db->fetchAll($sql);

            echo json_encode([
                'success' => true,
                'data' => $adminUsers,
                'count' => count($adminUsers)
            ]);

        } catch (Exception $e) {
            error_log("NotificationController::getAdminUsers error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch admin users']);
        }
    }

    /**
     * Send release notification to all admin users
     */
    public function sendReleaseNotification()
    {
        try {
            Auth::requireAnyRole(['system', 'admin']);
            $user = Auth::requireAuth();

            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid input']);
                return;
            }

            // Validate required fields
            $requiredFields = ['version', 'release_notes', 'release_date', 'release_type'];
            foreach ($requiredFields as $field) {
                if (!isset($input[$field]) || empty($input[$field])) {
                    http_response_code(400);
                    echo json_encode(['error' => "Field '$field' is required"]);
                    return;
                }
            }

            // Get language preference from request (default to English)
            $languageCode = $input['language'] ?? 'en';
            
            // Validate language code
            if (!in_array($languageCode, ['en', 'th'])) {
                $languageCode = 'en'; // Fallback to English
            }

            // Get admin users
            $sql = "SELECT id, first_name, last_name, email FROM users WHERE role IN ('admin', 'system') AND email IS NOT NULL";
            $adminUsers = $this->db->fetchAll($sql);

            if (empty($adminUsers)) {
                http_response_code(404);
                echo json_encode(['error' => 'No admin users found']);
                return;
            }

            $results = [];
            $successCount = 0;
            $failureCount = 0;

            foreach ($adminUsers as $adminUser) {
                try {
                    // Prepare variables for template
                    $variables = [
                        'user_name' => trim($adminUser['first_name'] . ' ' . $adminUser['last_name']),
                        'version' => $input['version'],
                        'release_notes' => $input['release_notes'],
                        'release_date' => $input['release_date'],
                        'release_type' => $input['release_type']
                    ];

                    // Send email using the release notification template with language preference
                    $result = $this->emailService->sendReleaseNotificationEmail(
                        $adminUser['email'],
                        $variables['user_name'],
                        $variables,
                        $languageCode
                    );

                    if ($result['success']) {
                        $successCount++;
                        $results[] = [
                            'email' => $adminUser['email'],
                            'name' => $variables['user_name'],
                            'status' => 'success',
                            'message' => $result['message']
                        ];
                    } else {
                        $failureCount++;
                        $results[] = [
                            'email' => $adminUser['email'],
                            'name' => $variables['user_name'],
                            'status' => 'failed',
                            'message' => $result['message']
                        ];
                    }

                } catch (Exception $e) {
                    $failureCount++;
                    $results[] = [
                        'email' => $adminUser['email'],
                        'name' => trim($adminUser['first_name'] . ' ' . $adminUser['last_name']),
                        'status' => 'failed',
                        'message' => 'Error: ' . $e->getMessage()
                    ];
                    error_log("Failed to send release notification to {$adminUser['email']}: " . $e->getMessage());
                }
            }

            // Log the notification sending activity
            $this->logNotificationActivity($user['user_id'], $input['version'], $successCount, $failureCount);

            echo json_encode([
                'success' => true,
                'message' => "Release notification sent to $successCount admin users",
                'summary' => [
                    'total_recipients' => count($adminUsers),
                    'successful_sends' => $successCount,
                    'failed_sends' => $failureCount,
                    'language_used' => $languageCode
                ],
                'results' => $results
            ]);

        } catch (Exception $e) {
            error_log("NotificationController::sendReleaseNotification error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to send release notifications']);
        }
    }

    /**
     * Log notification activity for audit purposes
     */
    private function logNotificationActivity($userId, $version, $successCount, $failureCount)
    {
        try {
            $sql = "INSERT INTO notification_logs (user_id, notification_type, details, success_count, failure_count, created_at) VALUES (?, ?, ?, ?, ?, NOW())";
            $this->db->query($sql, [
                $userId,
                'release_notification',
                json_encode(['version' => $version]),
                $successCount,
                $failureCount
            ]);
        } catch (Exception $e) {
            error_log("Failed to log notification activity: " . $e->getMessage());
        }
    }

    /**
     * Get unread notification count for the authenticated user
     */
    public function getUnreadCount()
    {
        try {
            $user = Auth::requireAuth();
            
            $sql = "SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = 0";
            $result = $this->db->fetchOne($sql, [$user['user_id']]);
            
            echo json_encode([
                'success' => true,
                'unread_count' => (int)$result['unread_count']
            ]);

        } catch (Exception $e) {
            error_log("NotificationController::getUnreadCount error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to get unread count']);
        }
    }

    /**
     * Mark a specific notification as read
     */
    public function markAsRead($notificationId)
    {
        try {
            $user = Auth::requireAuth();
            
            // Verify the notification belongs to the user
            $sql = "SELECT id FROM notifications WHERE id = ?";
            $notification = $this->db->fetchOne($sql, [$notificationId]);
            
            if (!$notification) {
                http_response_code(404);
                echo json_encode(['error' => 'Notification not found']);
                return;
            }
            
            // Mark as read
            $updateSql = "UPDATE notifications SET is_read = 1, updated_at = NOW() WHERE id = ?";
            $this->db->query($updateSql, [$notificationId]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Notification marked as read'
            ]);

        } catch (Exception $e) {
            error_log("NotificationController::markAsRead error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to mark notification as read']);
        }
    }

    /**
     * Dismiss a specific notification
     */
    public function dismiss($notificationId)
    {
        try {
            $user = Auth::requireAuth();
            
            // Verify the notification belongs to the user
            $sql = "SELECT id FROM notifications WHERE id = ?";
            $notification = $this->db->fetchOne($sql, [$notificationId]);
            
            if (!$notification) {
                http_response_code(404);
                echo json_encode(['error' => 'Notification not found']);
                return;
            }
            
            // Mark as dismissed
            $updateSql = "UPDATE notifications SET is_dismissed = 1, updated_at = NOW() WHERE id = ?";
            $this->db->query($updateSql, [$notificationId]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Notification dismissed'
            ]);

        } catch (Exception $e) {
            error_log("NotificationController::dismiss error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to dismiss notification']);
        }
    }

    /**
     * Dismiss all notifications for the authenticated user
     */
    public function dismissAll()
    {
        try {
            $user = Auth::requireAuth();
            
            // Mark all user's notifications as dismissed
            $sql = "UPDATE notifications SET is_dismissed = 1, updated_at = NOW() WHERE is_dismissed = 0";
            $result = $this->db->query($sql, []);
            
            $affectedRows = $result->rowCount();
            
            echo json_encode([
                'success' => true,
                'message' => "Dismissed $affectedRows notifications",
                'dismissed_count' => $affectedRows
            ]);

        } catch (Exception $e) {
            error_log("NotificationController::dismissAll error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to dismiss all notifications']);
        }
    }

    /**
     * Show a specific notification
     */
    public function show($notificationId)
    {
        try {
            $user = Auth::requireAuth();
            
            $sql = "
                SELECT 
                    n.id,
                    n.land_id,
                    n.user_id,
                    n.type,
                    n.priority,
                    n.title,
                    n.message,
                    n.is_read,
                    n.is_dismissed,
                    n.created_at,
                    n.updated_at,
                    l.land_name,
                    l.land_code,
                    CONCAT(u.first_name, ' ', u.last_name) as user_name
                FROM notifications n
                LEFT JOIN lands l ON n.land_id = l.id
                LEFT JOIN users u ON n.user_id = u.id
                WHERE n.id = ?
            ";
            
            $notification = $this->db->fetchOne($sql, [$notificationId]);
            
            if (!$notification) {
                http_response_code(404);
                echo json_encode(['error' => 'Notification not found']);
                return;
            }
            
            echo json_encode([
                'success' => true,
                'data' => $notification
            ]);

        } catch (Exception $e) {
            error_log("NotificationController::show error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch notification']);
        }
    }

    /**
     * Create harvest notifications for lands with upcoming harvest dates
     */
    public function createHarvestNotifications()
    {
        try {
            Auth::requireAnyRole(['system', 'admin']);
            $user = Auth::requireAuth();
            
            // Find lands that need harvest notifications
            // We'll check lands with next_harvest_date set, previous_harvest_date + cycle, or plant_date + cycle
            $sql = "
                SELECT 
                    l.id, 
                    l.land_name, 
                    l.land_code, 
                    l.plant_date,
                    l.next_harvest_date,
                    l.previous_harvest_date,
                    l.created_by,
                    pt.harvest_cycle_days,
                    pt.name as plant_type_name,
                    CONCAT(u.first_name, ' ', u.last_name) as user_name
                FROM lands l
                JOIN users u ON l.created_by = u.id
                JOIN plant_types pt ON l.plant_type_id = pt.id
                WHERE l.is_active = 1
                AND (
                    l.next_harvest_date IS NOT NULL 
                    OR (l.previous_harvest_date IS NOT NULL AND pt.harvest_cycle_days IS NOT NULL)
                    OR (l.plant_date IS NOT NULL AND pt.harvest_cycle_days IS NOT NULL)
                )
                AND NOT EXISTS (
                    SELECT 1 FROM notifications n 
                    WHERE n.land_id = l.id 
                    AND n.type IN ('harvest_due', 'harvest_overdue') 
                    AND n.created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
                )
            ";
            
            $lands = $this->db->fetchAll($sql);
            
            $notificationsCreated = 0;
            $results = [];
            
            foreach ($lands as $land) {
                try {
                    // Calculate harvest date based on priority:
                    // 1. Use next_harvest_date if manually set
                    // 2. Calculate from previous_harvest_date + harvest_cycle_days
                    // 3. Calculate from plant_date + harvest_cycle_days (for initial harvest)
                    $harvestDate = null;
                    
                    if ($land['next_harvest_date']) {
                        $harvestDate = $land['next_harvest_date'];
                    } elseif ($land['previous_harvest_date'] && $land['harvest_cycle_days']) {
                        // Calculate next harvest from previous harvest + cycle days
                        $previousHarvest = new \DateTime($land['previous_harvest_date']);
                        $harvestDate = $previousHarvest->add(new \DateInterval('P' . $land['harvest_cycle_days'] . 'D'))->format('Y-m-d');
                    } elseif ($land['plant_date'] && $land['harvest_cycle_days']) {
                        // For initial harvest calculation, use plant_date + cycle days
                        $plantDate = new \DateTime($land['plant_date']);
                        $harvestDate = $plantDate->add(new \DateInterval('P' . $land['harvest_cycle_days'] . 'D'))->format('Y-m-d');
                    }
                    
                    if (!$harvestDate) {
                        continue; // Skip if we can't determine harvest date
                    }
                    
                    $harvestDateTime = new \DateTime($harvestDate);
                    $today = new \DateTime();
                    $daysUntilHarvest = $today->diff($harvestDateTime)->days;
                    
                    // Determine if harvest is due (within 7 days) or overdue (past due date)
                    $isOverdue = $harvestDateTime < $today;
                    $isDueSoon = $daysUntilHarvest <= 7 && !$isOverdue;
                    
                    if (!$isOverdue && !$isDueSoon) {
                        continue; // Skip if harvest is not due soon
                    }
                    
                    $notificationType = $isOverdue ? 'harvest_overdue' : 'harvest_due';
                    $priority = $isOverdue ? 'high' : 'medium';
                    
                    $title = $isOverdue ? "Harvest Overdue" : "Harvest Due Soon";
                    $message = $isOverdue 
                        ? "Your land '{$land['land_name']}' ({$land['land_code']}) harvest was due {$daysUntilHarvest} day(s) ago on {$harvestDate}. Please harvest as soon as possible."
                        : "Your land '{$land['land_name']}' ({$land['land_code']}) harvest is due in {$daysUntilHarvest} day(s) on {$harvestDate}.";
                    
                    // Create notification
                    $insertSql = "
                        INSERT INTO notifications 
                        (land_id, user_id, type, priority, title, message, is_read, is_dismissed, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, 0, 0, NOW(), NOW())
                    ";
                    
                    $this->db->query($insertSql, [
                        $land['id'],
                        $land['created_by'],
                        $notificationType,
                        $priority,
                        $title,
                        $message
                    ]);
                    
                    $notificationsCreated++;
                    $results[] = [
                        'land_id' => $land['id'],
                        'land_name' => $land['land_name'],
                        'land_code' => $land['land_code'],
                        'plant_type_name' => $land['plant_type_name'],
                        'harvest_date' => $harvestDate,
                        'days_until_harvest' => $daysUntilHarvest,
                        'notification_type' => $notificationType,
                        'priority' => $priority,
                        'status' => 'created'
                    ];
                    
                } catch (Exception $e) {
                    error_log("Failed to create harvest notification for land {$land['id']}: " . $e->getMessage());
                    $results[] = [
                        'land_id' => $land['id'],
                        'land_name' => $land['land_name'],
                        'land_code' => $land['land_code'],
                        'status' => 'failed',
                        'error' => $e->getMessage()
                    ];
                }
            }
            
            echo json_encode([
                'success' => true,
                'message' => "Created $notificationsCreated harvest notifications",
                'count' => $notificationsCreated,
                'total_lands_checked' => count($lands),
                'results' => $results
            ]);

        } catch (Exception $e) {
            error_log("NotificationController::createHarvestNotifications error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create harvest notifications']);
        }
    }

    /**
     * Get notification history
     */
    public function getNotificationHistory()
    {
        try {
            Auth::requireAnyRole(['system', 'admin']);
            
            $sql = "
                SELECT 
                    nl.id,
                    nl.notification_type,
                    nl.details,
                    nl.success_count,
                    nl.failure_count,
                    nl.created_at,
                    u.first_name,
                    u.last_name,
                    u.email
                FROM notification_logs nl
                LEFT JOIN users u ON nl.user_id = u.id
                ORDER BY nl.created_at DESC
                LIMIT 50
            ";
            
            $history = $this->db->fetchAll($sql);

            // Parse details JSON
            foreach ($history as &$record) {
                if ($record['details']) {
                    $record['details'] = json_decode($record['details'], true);
                }
            }

            echo json_encode([
                'success' => true,
                'data' => $history
            ]);

        } catch (Exception $e) {
            error_log("NotificationController::getNotificationHistory error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch notification history']);
        }
    }
}
?>