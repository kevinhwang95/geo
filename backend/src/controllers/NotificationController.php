<?php

namespace App\Controllers;

use App\Auth;
use App\Database;
use Exception;

class NotificationController
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function index()
    {
        $user = Auth::requireAuth();
        
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = min(50, max(10, intval($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        
        $stmt = $this->db->query("
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
            JOIN lands l ON n.land_id = l.id
            WHERE n.user_id = ? AND n.is_dismissed = 0
            ORDER BY n.created_at DESC
            LIMIT ? OFFSET ?
        ", [$user['user_id'], $limit, $offset]);
        $notifications = $stmt->fetchAll();
        
        // Get total count
        $stmt = $this->db->query("
            SELECT COUNT(*) FROM notifications 
            WHERE user_id = ? AND is_dismissed = 0
        ", [$user['user_id']]);
        $total = $stmt->fetchColumn();
        
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

    public function markAsRead($id)
    {
        $user = Auth::requireAuth();
        
        $stmt = $this->db->query("
            UPDATE notifications 
            SET is_read = 1 
            WHERE id = ? AND user_id = ?
        ", [$id, $user['user_id']]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Notification not found']);
            return;
        }
        
        echo json_encode(['success' => true, 'message' => 'Notification marked as read']);
    }

    public function dismiss($id)
    {
        $user = Auth::requireAuth();
        
        $stmt = $this->db->query("
            UPDATE notifications 
            SET is_dismissed = 1, dismissed_by = ?, dismissed_at = NOW()
            WHERE id = ? AND user_id = ?
        ", [$user['user_id'], $id, $user['user_id']]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Notification not found']);
            return;
        }
        
        echo json_encode(['success' => true, 'message' => 'Notification dismissed']);
    }

    public function dismissAll()
    {
        $user = Auth::requireAuth();
        
        $stmt = $this->db->query("
            UPDATE notifications 
            SET is_dismissed = 1, dismissed_by = ?, dismissed_at = NOW()
            WHERE user_id = ? AND is_dismissed = 0
        ", [$user['user_id'], $user['user_id']]);
        
        echo json_encode([
            'success' => true, 
            'message' => 'All notifications dismissed',
            'count' => $stmt->rowCount()
        ]);
    }

    public function getUnreadCount()
    {
        $user = Auth::requireAuth();
        
        $stmt = $this->db->query("
            SELECT COUNT(*) FROM notifications 
            WHERE user_id = ? AND is_read = 0 AND is_dismissed = 0
        ", [$user['user_id']]);
        $count = $stmt->fetchColumn();
        
        echo json_encode(['success' => true, 'unread_count' => $count]);
    }

    public function createHarvestNotifications()
    {
        $user = Auth::requireAuth();
        
        // Only admins and contributors can create harvest notifications
        if (!in_array($user['role'], ['admin', 'contributor'])) {
            http_response_code(403);
            echo json_encode(['error' => 'Insufficient permissions']);
            return;
        }
        
        $landId = $_GET['land_id'] ?? null;
        
        $sql = "
            SELECT l.id, l.land_name, l.land_code, l.next_harvest_date, l.created_by
            FROM lands l
            WHERE l.is_active = 1
        ";
        
        $params = [];
        if ($landId) {
            $sql .= " AND l.id = ?";
            $params[] = $landId;
        }
        
        $stmt = $this->db->query($sql, $params);
        $lands = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        $notificationsCreated = 0;
        
        foreach ($lands as $land) {
            $harvestDate = new \DateTime($land['next_harvest_date']);
            $today = new \DateTime();
            $daysUntilHarvest = $today->diff($harvestDate)->days;
            
            // Create notification if harvest is due soon or overdue
            if ($daysUntilHarvest <= 7) {
                $type = $daysUntilHarvest <= 0 ? 'harvest_overdue' : 'harvest_due';
                $title = $daysUntilHarvest <= 0 ? 'Harvest Overdue' : 'Harvest Due Soon';
                $message = $daysUntilHarvest <= 0 
                    ? "Harvest for {$land['land_name']} is overdue by " . abs($daysUntilHarvest) . " days"
                    : "Harvest for {$land['land_name']} is due in {$daysUntilHarvest} days";
                
                // Check if notification already exists
                $stmt = $this->db->query("
                    SELECT COUNT(*) FROM notifications 
                    WHERE land_id = ? AND type = ? AND is_dismissed = 0
                ", [$land['id'], $type]);
                
                if ($stmt->fetchColumn() == 0) {
                    $stmt = $this->db->query("
                        INSERT INTO notifications (land_id, user_id, type, title, message)
                        VALUES (?, ?, ?, ?, ?)
                    ", [$land['id'], $land['created_by'], $type, $title, $message]);
                    $notificationsCreated++;
                }
            }
        }
        
        echo json_encode([
            'success' => true,
            'message' => "Created {$notificationsCreated} harvest notifications"
        ]);
    }

    public function store()
    {
        $user = Auth::requireAuth();
        
        // Get input data
        $landId = $_POST['land_id'] ?? null;
        $title = $_POST['title'] ?? null;
        $message = $_POST['message'] ?? null;
        $type = $_POST['type'] ?? null;
        $priority = $_POST['priority'] ?? 'medium';
        
        // Validate required fields
        if (!$landId || !$title || !$message || !$type) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields: land_id, title, message, type']);
            return;
        }
        
        // Validate land exists and user has access
        $landStmt = $this->db->query("SELECT id FROM lands WHERE id = ?", [$landId]);
        if (!$landStmt->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'Land not found']);
            return;
        }
        
        // Validate notification type
        $validTypes = ['harvest_due', 'harvest_overdue', 'maintenance_due', 'comment_added', 'photo_added'];
        if (!in_array($type, $validTypes)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid notification type']);
            return;
        }
        
        // Validate priority
        $validPriorities = ['low', 'medium', 'high'];
        if (!in_array($priority, $validPriorities)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid priority level']);
            return;
        }
        
        try {
            // Insert notification
            $stmt = $this->db->query("
                INSERT INTO notifications (land_id, user_id, type, title, message, priority, is_read, is_dismissed, created_at)
                VALUES (?, ?, ?, ?, ?, ?, 0, 0, NOW())
            ", [$landId, $user['user_id'], $type, $title, $message, $priority]);
            
            $notificationId = $this->db->lastInsertId();
            
            // Handle photo uploads if any
            $photoIds = [];
            if (isset($_FILES['photos']) && is_array($_FILES['photos']['name'])) {
                // Use absolute path for upload directory (ignore env var to fix path issue)
                $uploadDir = __DIR__ . '/../../uploads/';
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0755, true);
                }
                
                for ($i = 0; $i < count($_FILES['photos']['name']); $i++) {
                    if ($_FILES['photos']['error'][$i] === UPLOAD_ERR_OK) {
                        $fileName = uniqid() . '_' . $_FILES['photos']['name'][$i];
                        $filePath = $uploadDir . $fileName;
                        
                        if (move_uploaded_file($_FILES['photos']['tmp_name'][$i], $filePath)) {
                            // Store relative path for web access
                            $relativePath = 'uploads/' . $fileName;
                            
                            // Insert photo record
                            $photoStmt = $this->db->query("
                                INSERT INTO photos (notification_id, file_path, file_name, file_size, mime_type, uploaded_at)
                                VALUES (?, ?, ?, ?, ?, NOW())
                            ", [
                                $notificationId, 
                                $relativePath, 
                                $_FILES['photos']['name'][$i],
                                $_FILES['photos']['size'][$i],
                                $_FILES['photos']['type'][$i]
                            ]);
                            
                            $photoIds[] = $this->db->lastInsertId();
                        }
                    }
                }
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Notification created successfully',
                'notification_id' => $notificationId,
                'photo_ids' => $photoIds
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create notification: ' . $e->getMessage()]);
        }
    }

    public function show($id)
    {
        $user = Auth::requireAuth();
        
        // Get notification details with photos
        $stmt = $this->db->query("
            SELECT 
                n.*,
                l.land_name,
                l.land_code,
                l.location,
                l.city,
                l.district,
                l.province,
                l.next_harvest_date,
                CASE 
                    WHEN l.next_harvest_date <= CURDATE() THEN 'overdue'
                    WHEN l.next_harvest_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 'due_soon'
                    ELSE 'normal'
                END as harvest_status
            FROM notifications n
            LEFT JOIN lands l ON n.land_id = l.id
            WHERE n.id = ? AND n.user_id = ?
        ", [$id, $user['user_id']]);
        
        $notification = $stmt->fetch();
        
        if (!$notification) {
            http_response_code(404);
            echo json_encode(['error' => 'Notification not found']);
            return;
        }
        
        // Get photos for this notification
        $photoStmt = $this->db->query("
            SELECT id, file_path, file_name, file_size, mime_type, uploaded_at
            FROM photos
            WHERE notification_id = ?
            ORDER BY uploaded_at ASC
        ", [$id]);
        
        $photos = $photoStmt->fetchAll();
        
        echo json_encode([
            'success' => true,
            'data' => [
                'notification' => $notification,
                'photos' => $photos
            ]
        ]);
    }
}
