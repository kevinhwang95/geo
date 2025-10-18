<?php

namespace App\Controllers;

use App\Database;
use App\Auth;

class UnifiedPhotoController
{
    private $db;
    private $uploadDir;

    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->uploadDir = $_ENV['UPLOAD_DIR'] ?? __DIR__ . '/../../uploads/photos/';
        
        // Create upload directory if it doesn't exist
        if (!is_dir($this->uploadDir)) {
            mkdir($this->uploadDir, 0755, true);
        }
    }

    /**
     * Upload photo with GPS and metadata support
     */
    public function upload()
    {
        try {
            $user = Auth::requireAuth();
            
            if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
                http_response_code(400);
                echo json_encode(['error' => 'No photo uploaded or upload error']);
                return;
            }

            $file = $_FILES['photo'];
            $uploadData = json_decode($_POST['data'] ?? '{}', true);

            // Validate file type
            $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!in_array($file['type'], $allowedTypes)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed']);
                return;
            }

            // Generate unique filename
            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = uniqid() . '_' . time() . '.' . $extension;
            $filePath = $this->uploadDir . $filename;

            // Move uploaded file
            if (!move_uploaded_file($file['tmp_name'], $filePath)) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to save uploaded file']);
                return;
            }

            // Extract EXIF data for GPS and camera info
            $exifData = $this->extractExifData($filePath);
            
            // Insert photo record into land_photos table
            $stmt = $this->db->prepare("
                INSERT INTO land_photos (
                    comment_id, notification_id, land_id, user_id, filename, original_filename, 
                    file_path, file_size, mime_type, latitude, longitude, altitude, 
                    photo_timestamp, camera_info, is_active, created_at, updated_at
                ) VALUES (
                    :comment_id, :notification_id, :land_id, :user_id, :filename, :original_filename,
                    :file_path, :file_size, :mime_type, :latitude, :longitude, :altitude,
                    :photo_timestamp, :camera_info, 1, NOW(), NOW()
                )
            ");

            $stmt->execute([
                'comment_id' => $uploadData['comment_id'] ?? null,
                'notification_id' => $uploadData['notification_id'] ?? null,
                'land_id' => $uploadData['land_id'] ?? null,
                'user_id' => $user['user_id'],
                'filename' => $filename,
                'original_filename' => $file['name'],
                'file_path' => $filePath,
                'file_size' => $file['size'],
                'mime_type' => $file['type'],
                'latitude' => $exifData['latitude'] ?? null,
                'longitude' => $exifData['longitude'] ?? null,
                'altitude' => $exifData['altitude'] ?? null,
                'photo_timestamp' => $exifData['timestamp'] ?? null,
                'camera_info' => json_encode($exifData['camera_info'] ?? [])
            ]);

            $photoId = $this->db->lastInsertId();

            echo json_encode([
                'success' => true,
                'message' => 'Photo uploaded successfully',
                'data' => [
                    'id' => $photoId,
                    'filename' => $filename,
                    'url' => '/uploads/photos/' . $filename,
                    'location' => $exifData,
                    'land_id' => $uploadData['land_id'] ?? null,
                    'comment_id' => $uploadData['comment_id'] ?? null,
                    'notification_id' => $uploadData['notification_id'] ?? null
                ]
            ]);

        } catch (\Exception $e) {
            error_log("UnifiedPhotoController::upload error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to upload photo']);
        }
    }

    /**
     * Get photo by ID with full metadata
     */
    public function show($id)
    {
        try {
            Auth::requireAuth();
            
            $stmt = $this->db->prepare("
                SELECT 
                    lp.*, 
                    l.land_name, 
                    l.land_code,
                    u.first_name, 
                    u.last_name,
                    lc.content as comment_content,
                    n.title as notification_title,
                    n.message as notification_message
                FROM land_photos lp
                LEFT JOIN lands l ON lp.land_id = l.id
                LEFT JOIN users u ON lp.user_id = u.id
                LEFT JOIN land_comments lc ON lp.comment_id = lc.id
                LEFT JOIN notifications n ON lp.notification_id = n.id
                WHERE lp.id = ? AND lp.is_active = 1
            ");
            
            $stmt->execute([$id]);
            $photo = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            if (!$photo) {
                http_response_code(404);
                echo json_encode(['error' => 'Photo not found']);
                return;
            }

            // Convert file path to URL
            $photo['url'] = '/uploads/photos/' . $photo['filename'];
            $photo['camera_info'] = json_decode($photo['camera_info'], true);

            echo json_encode(['success' => true, 'data' => $photo]);

        } catch (\Exception $e) {
            error_log("UnifiedPhotoController::show error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch photo']);
        }
    }

    /**
     * Delete photo (soft delete)
     */
    public function destroy($id)
    {
        try {
            $user = Auth::requireAuth();
            
            // Check if photo exists and user owns it
            $stmt = $this->db->prepare("SELECT user_id, file_path FROM land_photos WHERE id = ?");
            $stmt->execute([$id]);
            $photo = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            if (!$photo) {
                http_response_code(404);
                echo json_encode(['error' => 'Photo not found']);
                return;
            }
            
            // Only allow users to delete their own photos (or admins)
            if ($photo['user_id'] != $user['user_id'] && $user['role'] !== 'admin') {
                http_response_code(403);
                echo json_encode(['error' => 'You can only delete your own photos']);
                return;
            }

            try {
                // Soft delete photo
                $stmt = $this->db->prepare("UPDATE land_photos SET is_active = 0, updated_at = NOW() WHERE id = ?");
                $stmt->execute([$id]);
                
                // Optionally delete physical file
                if (file_exists($photo['file_path'])) {
                    unlink($photo['file_path']);
                }
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Photo deleted successfully'
                ]);

            } catch (\Exception $e) {
                error_log("Failed to delete photo: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(['error' => 'Failed to delete photo']);
            }

        } catch (\Exception $e) {
            error_log("UnifiedPhotoController::destroy error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete photo']);
        }
    }

    /**
     * Get photos by context (land, comment, notification, work note, work completion)
     */
    public function getByContext()
    {
        try {
            Auth::requireAuth();
            
            $landId = $_GET['land_id'] ?? null;
            $commentId = $_GET['comment_id'] ?? null;
            $notificationId = $_GET['notification_id'] ?? null;
            $workNoteId = $_GET['work_note_id'] ?? null;
            $workCompletionId = $_GET['work_completion_id'] ?? null;

            if (!$landId && !$commentId && !$notificationId && !$workNoteId && !$workCompletionId) {
                http_response_code(400);
                echo json_encode(['error' => 'At least one context parameter is required']);
                return;
            }

            $sql = "
                SELECT 
                    lp.*,
                    l.land_name,
                    l.land_code,
                    CONCAT(u.first_name, ' ', u.last_name) as user_name
                FROM land_photos lp
                LEFT JOIN lands l ON lp.land_id = l.id
                LEFT JOIN users u ON lp.user_id = u.id
                WHERE lp.is_active = 1
            ";
            
            $params = [];
            
            if ($landId) {
                $sql .= " AND lp.land_id = ?";
                $params[] = $landId;
            }
            
            if ($commentId) {
                $sql .= " AND lp.comment_id = ?";
                $params[] = $commentId;
            }
            
            if ($notificationId) {
                $sql .= " AND lp.notification_id = ?";
                $params[] = $notificationId;
            }

            $sql .= " ORDER BY lp.created_at DESC";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $photos = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            // Convert file paths to URLs and decode camera info
            foreach ($photos as &$photo) {
                $photo['url'] = '/uploads/photos/' . $photo['filename'];
                $photo['camera_info'] = json_decode($photo['camera_info'], true);
            }

            echo json_encode([
                'success' => true,
                'data' => $photos,
                'count' => count($photos)
            ]);

        } catch (\Exception $e) {
            error_log("UnifiedPhotoController::getByContext error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch photos']);
        }
    }

    /**
     * Extract EXIF data from image file
     */
    private function extractExifData($filePath)
    {
        $exifData = [
            'latitude' => null,
            'longitude' => null,
            'altitude' => null,
            'timestamp' => null,
            'camera_info' => []
        ];

        if (!function_exists('exif_read_data') || !in_array(strtolower(pathinfo($filePath, PATHINFO_EXTENSION)), ['jpg', 'jpeg'])) {
            return $exifData;
        }

        try {
            $exif = exif_read_data($filePath);
            
            if (!$exif) {
                return $exifData;
            }

            // Extract GPS coordinates
            if (isset($exif['GPSLatitude']) && isset($exif['GPSLongitude'])) {
                $exifData['latitude'] = $this->getGPSCoordinate($exif['GPSLatitude'], $exif['GPSLatitudeRef']);
                $exifData['longitude'] = $this->getGPSCoordinate($exif['GPSLongitude'], $exif['GPSLongitudeRef']);
            }

            // Extract altitude
            if (isset($exif['GPSAltitude'])) {
                $exifData['altitude'] = $exif['GPSAltitude'];
            }

            // Extract timestamp
            if (isset($exif['DateTimeOriginal'])) {
                $exifData['timestamp'] = $exif['DateTimeOriginal'];
            } elseif (isset($exif['DateTime'])) {
                $exifData['timestamp'] = $exif['DateTime'];
            }

            // Extract camera info
            $cameraFields = [
                'Make' => 'make',
                'Model' => 'model',
                'ExposureTime' => 'exposure_time',
                'FNumber' => 'f_number',
                'ISO' => 'iso',
                'FocalLength' => 'focal_length',
                'Flash' => 'flash',
                'WhiteBalance' => 'white_balance'
            ];

            foreach ($cameraFields as $exifField => $outputField) {
                if (isset($exif[$exifField])) {
                    $exifData['camera_info'][$outputField] = $exif[$exifField];
                }
            }

        } catch (\Exception $e) {
            error_log("Failed to extract EXIF data: " . $e->getMessage());
        }

        return $exifData;
    }

    /**
     * Convert GPS coordinate from EXIF format to decimal
     */
    private function getGPSCoordinate($coordinate, $hemisphere)
    {
        if (!is_array($coordinate) || count($coordinate) !== 3) {
            return null;
        }

        $degrees = $coordinate[0];
        $minutes = $coordinate[1];
        $seconds = $coordinate[2];

        $result = $degrees + ($minutes / 60) + ($seconds / 3600);

        if (in_array(strtoupper($hemisphere), ['S', 'W'])) {
            $result = -$result;
        }

        return $result;
    }
}
?>






