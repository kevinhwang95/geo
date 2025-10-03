<?php

namespace App;

use App\Database;

class NotificationService
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Create a notification for a specific user
     */
    public function createNotification($landId, $userId, $type, $title, $message, $priority = 'normal')
    {
        $sql = "
            INSERT INTO notifications (land_id, user_id, type, title, message, priority)
            VALUES (:land_id, :user_id, :type, :title, :message, :priority)
        ";
        $params = [
            'land_id' => $landId,
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'priority' => $priority
        ];
        
        $this->db->query($sql, $params);
        return $this->db->lastInsertId();
    }

    /**
     * Create harvest notifications for all users with lands
     */
    public function createHarvestNotifications()
    {
        $sql = "
            SELECT l.id, l.land_name, l.land_code, l.next_harvest_date, l.created_by
            FROM lands l
            WHERE l.is_active = 1 AND l.next_harvest_date IS NOT NULL
        ";
        $lands = $this->db->fetchAll($sql);
        
        $notificationsCreated = 0;
        
        foreach ($lands as $land) {
            $harvestDate = new \DateTime($land['next_harvest_date']);
            $today = new \DateTime();
            $daysUntilHarvest = $today->diff($harvestDate)->days;
            
            // Create notification if harvest is due soon or overdue
            if ($daysUntilHarvest <= 7) {
                $type = $daysUntilHarvest <= 0 ? 'harvest_overdue' : 'harvest_due';
                $title = $daysUntilHarvest <= 0 ? '🚨 Harvest Overdue' : '⚠️ Harvest Due Soon';
                $message = $daysUntilHarvest <= 0 
                    ? "Harvest for {$land['land_name']} ({$land['land_code']}) is overdue by " . abs($daysUntilHarvest) . " days"
                    : "Harvest for {$land['land_name']} ({$land['land_code']}) is due in {$daysUntilHarvest} days";
                
                $priority = $daysUntilHarvest <= 0 ? 'high' : 'medium';
                
                // Check if notification already exists
                $existingSql = "
                    SELECT COUNT(*) FROM notifications 
                    WHERE land_id = :land_id AND type = :type AND is_dismissed = 0
                ";
                $existing = $this->db->fetchOne($existingSql, [
                    'land_id' => $land['id'],
                    'type' => $type
                ]);
                
                if ($existing['COUNT(*)'] == 0) {
                    $this->createNotification(
                        $land['id'],
                        $land['created_by'],
                        $type,
                        $title,
                        $message,
                        $priority
                    );
                    $notificationsCreated++;
                }
            }
        }
        
        return $notificationsCreated;
    }

    /**
     * Create maintenance notifications
     */
    public function createMaintenanceNotification($landId, $userId, $maintenanceType, $dueDate)
    {
        $title = "🔧 Maintenance Required";
        $message = "Maintenance for {$maintenanceType} is due on " . date('M j, Y', strtotime($dueDate));
        
        return $this->createNotification($landId, $userId, 'maintenance_due', $title, $message, 'medium');
    }

    /**
     * Create comment notifications
     */
    public function createCommentNotification($landId, $userId, $commenterName, $commentText)
    {
        $title = "💬 New Comment Added";
        $message = "{$commenterName} added a comment: " . substr($commentText, 0, 100) . "...";
        
        return $this->createNotification($landId, $userId, 'comment_added', $title, $message, 'low');
    }

    /**
     * Create photo notifications
     */
    public function createPhotoNotification($landId, $userId, $uploaderName)
    {
        $title = "📸 New Photo Added";
        $message = "{$uploaderName} uploaded a new photo to this land";
        
        return $this->createNotification($landId, $userId, 'photo_added', $title, $message, 'low');
    }

    /**
     * Create weather alert notifications
     */
    public function createWeatherAlert($landId, $userId, $alertType, $severity)
    {
        $title = "🌦️ Weather Alert";
        $message = "Weather alert: {$alertType} - {$severity} severity";
        
        $priority = $severity === 'high' ? 'high' : 'medium';
        
        return $this->createNotification($landId, $userId, 'weather_alert', $title, $message, $priority);
    }

    /**
     * Create system notifications for all users
     */
    public function createSystemNotification($title, $message, $type = 'system')
    {
        // Get all active users
        $sql = "SELECT id FROM users WHERE is_active = 1";
        $users = $this->db->fetchAll($sql);
        
        $notificationsCreated = 0;
        
        foreach ($users as $user) {
            $this->createNotification(null, $user['id'], $type, $title, $message, 'medium');
            $notificationsCreated++;
        }
        
        return $notificationsCreated;
    }

    /**
     * Create bulk notifications for multiple users
     */
    public function createBulkNotification($userIds, $title, $message, $type = 'bulk')
    {
        $notificationsCreated = 0;
        
        foreach ($userIds as $userId) {
            $this->createNotification(null, $userId, $type, $title, $message, 'medium');
            $notificationsCreated++;
        }
        
        return $notificationsCreated;
    }

    /**
     * Get notification statistics
     */
    public function getNotificationStats($userId = null)
    {
        $sql = "
            SELECT 
                type,
                COUNT(*) as count,
                SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread_count,
                SUM(CASE WHEN is_dismissed = 0 THEN 1 ELSE 0 END) as active_count
            FROM notifications
        ";
        
        $params = [];
        if ($userId) {
            $sql .= " WHERE user_id = :user_id";
            $params['user_id'] = $userId;
        }
        
        $sql .= " GROUP BY type";
        
        return $this->db->fetchAll($sql, $params);
    }

    /**
     * Clean up old notifications (older than 30 days)
     */
    public function cleanupOldNotifications($daysOld = 30)
    {
        $sql = "
            DELETE FROM notifications 
            WHERE created_at < DATE_SUB(NOW(), INTERVAL :days DAY) 
            AND is_dismissed = 1
        ";
        
        $stmt = $this->db->query($sql, ['days' => $daysOld]);
        return $stmt->rowCount();
    }
}
