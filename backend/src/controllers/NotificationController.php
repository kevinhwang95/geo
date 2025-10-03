<?php

namespace App\Controllers;

use App\Auth;
use App\Database;

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
}
