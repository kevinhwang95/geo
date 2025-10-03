<?php

namespace App\Controllers;

use App\Auth;
use App\Database;

class CommentController
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function index()
    {
        $user = Auth::requireAuth();
        
        $landId = $_GET['land_id'] ?? null;
        
        $sql = "
            SELECT 
                lc.*,
                l.land_name,
                l.land_code,
                u.first_name,
                u.last_name,
                u.email,
                u.avatar_url,
                COUNT(lp.id) as photo_count
            FROM land_comments lc
            JOIN lands l ON lc.land_id = l.id
            JOIN users u ON lc.user_id = u.id
            LEFT JOIN land_photos lp ON lc.id = lp.comment_id AND lp.is_active = 1
        ";
        
        $params = [];
        if ($landId) {
            $sql .= " WHERE lc.land_id = ?";
            $params[] = $landId;
        }
        
        $sql .= " GROUP BY lc.id ORDER BY lc.created_at DESC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $comments = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'data' => $comments]);
    }

    public function show($id)
    {
        $user = Auth::requireAuth();
        
        $stmt = $this->db->prepare("
            SELECT 
                lc.*,
                l.land_name,
                l.land_code,
                u.first_name,
                u.last_name,
                u.email,
                u.avatar_url
            FROM land_comments lc
            JOIN lands l ON lc.land_id = l.id
            JOIN users u ON lc.user_id = u.id
            WHERE lc.id = ?
        ");
        $stmt->execute([$id]);
        $comment = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$comment) {
            http_response_code(404);
            echo json_encode(['error' => 'Comment not found']);
            return;
        }

        // Get photos for this comment
        $stmt = $this->db->prepare("
            SELECT id, filename, original_filename, file_path, latitude, longitude, altitude, photo_timestamp, camera_info
            FROM land_photos 
            WHERE comment_id = ? AND is_active = 1
            ORDER BY created_at ASC
        ");
        $stmt->execute([$id]);
        $photos = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        $comment['photos'] = $photos;

        echo json_encode(['success' => true, 'data' => $comment]);
    }

    public function store()
    {
        $user = Auth::requireAuth();
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validate required fields
        if (!isset($input['land_id']) || !isset($input['comment']) || empty($input['comment'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Land ID and comment are required']);
            return;
        }

        // Check if land exists
        $stmt = $this->db->prepare("SELECT id FROM lands WHERE id = ? AND is_active = 1");
        $stmt->execute([$input['land_id']]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'Land not found']);
            return;
        }

        try {
            $stmt = $this->db->prepare("
                INSERT INTO land_comments (land_id, user_id, comment, comment_type, priority)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $input['land_id'],
                $user['user_id'],
                $input['comment'],
                $input['comment_type'] ?? 'general',
                $input['priority'] ?? 'medium'
            ]);

            $commentId = $this->db->lastInsertId();
            
            // Create notification for land owner/contributors
            $this->createCommentNotification($input['land_id'], $commentId, $user['user_id']);
            
            echo json_encode([
                'success' => true,
                'message' => 'Comment added successfully',
                'data' => ['id' => $commentId]
            ]);

        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to add comment']);
        }
    }

    public function update($id)
    {
        $user = Auth::requireAuth();
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Check if comment exists and user owns it
        $stmt = $this->db->prepare("SELECT user_id FROM land_comments WHERE id = ?");
        $stmt->execute([$id]);
        $comment = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$comment) {
            http_response_code(404);
            echo json_encode(['error' => 'Comment not found']);
            return;
        }
        
        // Only allow users to edit their own comments (or admins)
        if ($comment['user_id'] != $user['user_id'] && $user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'You can only edit your own comments']);
            return;
        }

        try {
            $updateFields = [];
            $values = [];
            
            if (isset($input['comment'])) {
                $updateFields[] = "comment = ?";
                $values[] = $input['comment'];
            }
            if (isset($input['comment_type'])) {
                $updateFields[] = "comment_type = ?";
                $values[] = $input['comment_type'];
            }
            if (isset($input['priority'])) {
                $updateFields[] = "priority = ?";
                $values[] = $input['priority'];
            }
            
            if (empty($updateFields)) {
                http_response_code(400);
                echo json_encode(['error' => 'No fields to update']);
                return;
            }
            
            $values[] = $id;
            
            $stmt = $this->db->prepare("UPDATE land_comments SET " . implode(', ', $updateFields) . " WHERE id = ?");
            $stmt->execute($values);
            
            echo json_encode(['success' => true, 'message' => 'Comment updated successfully']);

        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update comment']);
        }
    }

    public function delete($id)
    {
        $user = Auth::requireAuth();
        
        // Check if comment exists and user owns it
        $stmt = $this->db->prepare("SELECT user_id FROM land_comments WHERE id = ?");
        $stmt->execute([$id]);
        $comment = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$comment) {
            http_response_code(404);
            echo json_encode(['error' => 'Comment not found']);
            return;
        }
        
        // Only allow users to delete their own comments (or admins)
        if ($comment['user_id'] != $user['user_id'] && $user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'You can only delete your own comments']);
            return;
        }

        try {
            // Soft delete comment (and associated photos)
            $stmt = $this->db->prepare("UPDATE land_comments SET is_resolved = 1, resolved_by = ?, resolved_at = NOW() WHERE id = ?");
            $stmt->execute([$user['user_id'], $id]);
            
            echo json_encode(['success' => true, 'message' => 'Comment deleted successfully']);

        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete comment']);
        }
    }

    private function createCommentNotification($landId, $commentId, $userId)
    {
        // Get all users who should be notified (land owner, contributors, admins)
        $stmt = $this->db->prepare("
            SELECT DISTINCT u.id 
            FROM users u
            LEFT JOIN lands l ON l.created_by = u.id
            WHERE (l.id = ? AND l.created_by != ?) OR u.role IN ('admin', 'contributor')
            AND u.is_active = 1
        ");
        $stmt->execute([$landId, $userId]);
        $users = $stmt->fetchAll(\PDO::FETCH_COLUMN);
        
        foreach ($users as $targetUserId) {
            $stmt = $this->db->prepare("
                INSERT INTO notifications (land_id, user_id, type, title, message)
                VALUES (?, ?, 'comment_added', 'New Comment Added', 'A new comment has been added to a land you are following')
            ");
            $stmt->execute([$landId, $targetUserId]);
        }
    }
}
