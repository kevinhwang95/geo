<?php

namespace App\Controllers;

use App\Auth;
use App\NotificationService;

class EnhancedNotificationController
{
    private $notificationService;

    public function __construct()
    {
        $this->notificationService = new NotificationService();
    }

    /**
     * Get notifications for the authenticated user
     */
    public function index()
    {
        $user = Auth::requireAuth();
        
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = min(50, max(10, intval($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        $type = $_GET['type'] ?? null;
        $priority = $_GET['priority'] ?? null;
        
        $sql = "
            SELECT 
                n.*,
                l.land_name,
                l.land_code,
                l.next_harvest_date,
                CASE 
                    WHEN l.next_harvest_date <= CURDATE() THEN 'overdue'
                    WHEN l.next_harvest_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 'due_soon'
                    ELSE 'normal'
                END as harvest_status
            FROM notifications n
            LEFT JOIN lands l ON n.land_id = l.id
            WHERE n.user_id = :user_id AND n.is_dismissed = 0
        ";
        
        $params = ['user_id' => $user['user_id']];
        
        if ($type) {
            $sql .= " AND n.type = :type";
            $params['type'] = $type;
        }
        
        if ($priority) {
            $sql .= " AND n.priority = :priority";
            $params['priority'] = $priority;
        }
        
        $sql .= " ORDER BY n.priority DESC, n.created_at DESC LIMIT :limit OFFSET :offset";
        $params['limit'] = $limit;
        $params['offset'] = $offset;
        
        $db = \App\Database::getInstance();
        $stmt = $db->query($sql, $params);
        $notifications = $stmt->fetchAll();
        
        // Get total count
        $countSql = "
            SELECT COUNT(*) FROM notifications 
            WHERE user_id = :user_id AND is_dismissed = 0
        ";
        $countParams = ['user_id' => $user['user_id']];
        
        if ($type) {
            $countSql .= " AND type = :type";
            $countParams['type'] = $type;
        }
        
        if ($priority) {
            $countSql .= " AND priority = :priority";
            $countParams['priority'] = $priority;
        }
        
        $countResult = $db->fetchOne($countSql, $countParams);
        $total = $countResult['COUNT(*)'];
        
        echo json_encode([
            'success' => true,
            'data' => $notifications,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);
    }

    /**
     * Create harvest notifications
     */
    public function createHarvestNotifications()
    {
        $user = Auth::requireAuth();
        
        // Only admins and contributors can create harvest notifications
        if (!in_array($user['role'], ['admin', 'contributor'])) {
            http_response_code(403);
            echo json_encode(['error' => 'Insufficient permissions']);
            return;
        }
        
        $notificationsCreated = $this->notificationService->createHarvestNotifications();
        
        echo json_encode([
            'success' => true,
            'message' => "Created {$notificationsCreated} harvest notifications"
        ]);
    }

    /**
     * Create maintenance notification
     */
    public function createMaintenanceNotification()
    {
        $user = Auth::requireAuth();
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        $requiredFields = ['land_id', 'maintenance_type', 'due_date'];
        foreach ($requiredFields as $field) {
            if (!isset($input[$field]) || empty($input[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Field '{$field}' is required"]);
                return;
            }
        }
        
        $notificationId = $this->notificationService->createMaintenanceNotification(
            $input['land_id'],
            $user['user_id'],
            $input['maintenance_type'],
            $input['due_date']
        );
        
        echo json_encode([
            'success' => true,
            'message' => 'Maintenance notification created',
            'notification_id' => $notificationId
        ]);
    }

    /**
     * Create comment notification
     */
    public function createCommentNotification()
    {
        $user = Auth::requireAuth();
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        $requiredFields = ['land_id', 'comment_text'];
        foreach ($requiredFields as $field) {
            if (!isset($input[$field]) || empty($input[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Field '{$field}' is required"]);
                return;
            }
        }
        
        $notificationId = $this->notificationService->createCommentNotification(
            $input['land_id'],
            $input['user_id'] ?? $user['user_id'],
            $user['first_name'] . ' ' . $user['last_name'],
            $input['comment_text']
        );
        
        echo json_encode([
            'success' => true,
            'message' => 'Comment notification created',
            'notification_id' => $notificationId
        ]);
    }

    /**
     * Create photo notification
     */
    public function createPhotoNotification()
    {
        $user = Auth::requireAuth();
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        $requiredFields = ['land_id'];
        foreach ($requiredFields as $field) {
            if (!isset($input[$field]) || empty($input[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Field '{$field}' is required"]);
                return;
            }
        }
        
        $notificationId = $this->notificationService->createPhotoNotification(
            $input['land_id'],
            $input['user_id'] ?? $user['user_id'],
            $user['first_name'] . ' ' . $user['last_name']
        );
        
        echo json_encode([
            'success' => true,
            'message' => 'Photo notification created',
            'notification_id' => $notificationId
        ]);
    }

    /**
     * Create weather alert notification
     */
    public function createWeatherAlert()
    {
        $user = Auth::requireAuth();
        
        // Only admins can create weather alerts
        if ($user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Insufficient permissions']);
            return;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        $requiredFields = ['land_id', 'alert_type', 'severity'];
        foreach ($requiredFields as $field) {
            if (!isset($input[$field]) || empty($input[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Field '{$field}' is required"]);
                return;
            }
        }
        
        $notificationId = $this->notificationService->createWeatherAlert(
            $input['land_id'],
            $input['user_id'] ?? $user['user_id'],
            $input['alert_type'],
            $input['severity']
        );
        
        echo json_encode([
            'success' => true,
            'message' => 'Weather alert created',
            'notification_id' => $notificationId
        ]);
    }

    /**
     * Create system notification for all users
     */
    public function createSystemNotification()
    {
        $user = Auth::requireAuth();
        
        // Only admins can create system notifications
        if ($user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Insufficient permissions']);
            return;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        $requiredFields = ['title', 'message'];
        foreach ($requiredFields as $field) {
            if (!isset($input[$field]) || empty($input[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Field '{$field}' is required"]);
                return;
            }
        }
        
        $notificationsCreated = $this->notificationService->createSystemNotification(
            $input['title'],
            $input['message'],
            $input['type'] ?? 'system'
        );
        
        echo json_encode([
            'success' => true,
            'message' => "System notification sent to {$notificationsCreated} users"
        ]);
    }

    /**
     * Get notification statistics
     */
    public function getStats()
    {
        $user = Auth::requireAuth();
        
        $stats = $this->notificationService->getNotificationStats($user['user_id']);
        
        echo json_encode([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Clean up old notifications
     */
    public function cleanup()
    {
        $user = Auth::requireAuth();
        
        // Only admins can cleanup notifications
        if ($user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Insufficient permissions']);
            return;
        }
        
        $daysOld = intval($_GET['days'] ?? 30);
        $deletedCount = $this->notificationService->cleanupOldNotifications($daysOld);
        
        echo json_encode([
            'success' => true,
            'message' => "Cleaned up {$deletedCount} old notifications"
        ]);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead($id)
    {
        $user = Auth::requireAuth();
        
        $db = \App\Database::getInstance();
        $sql = "
            UPDATE notifications 
            SET is_read = 1 
            WHERE id = :id AND user_id = :user_id
        ";
        
        $stmt = $db->query($sql, ['id' => $id, 'user_id' => $user['user_id']]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Notification not found']);
            return;
        }
        
        echo json_encode(['success' => true, 'message' => 'Notification marked as read']);
    }

    /**
     * Dismiss notification
     */
    public function dismiss($id)
    {
        $user = Auth::requireAuth();
        
        $db = \App\Database::getInstance();
        $sql = "
            UPDATE notifications 
            SET is_dismissed = 1, dismissed_by = :dismissed_by, dismissed_at = NOW()
            WHERE id = :id AND user_id = :user_id
        ";
        
        $stmt = $db->query($sql, [
            'id' => $id,
            'user_id' => $user['user_id'],
            'dismissed_by' => $user['user_id']
        ]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Notification not found']);
            return;
        }
        
        echo json_encode(['success' => true, 'message' => 'Notification dismissed']);
    }

    /**
     * Dismiss all notifications
     */
    public function dismissAll()
    {
        $user = Auth::requireAuth();
        
        $db = \App\Database::getInstance();
        $sql = "
            UPDATE notifications 
            SET is_dismissed = 1, dismissed_by = :dismissed_by, dismissed_at = NOW()
            WHERE user_id = :user_id AND is_dismissed = 0
        ";
        
        $stmt = $db->query($sql, [
            'user_id' => $user['user_id'],
            'dismissed_by' => $user['user_id']
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'All notifications dismissed',
            'count' => $stmt->rowCount()
        ]);
    }

    /**
     * Get unread count
     */
    public function getUnreadCount()
    {
        $user = Auth::requireAuth();
        
        $db = \App\Database::getInstance();
        $sql = "
            SELECT COUNT(*) FROM notifications 
            WHERE user_id = :user_id AND is_read = 0 AND is_dismissed = 0
        ";
        
        $result = $db->fetchOne($sql, ['user_id' => $user['user_id']]);
        $count = $result['COUNT(*)'];
        
        echo json_encode(['success' => true, 'unread_count' => $count]);
    }
}
