<?php

namespace App\Controllers;

use App\Auth;
use App\Database;

class PhotoController
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

    public function upload()
    {
        $user = Auth::requireAuth();
        
        if (!isset($_POST['land_id']) || !isset($_FILES['photo'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Land ID and photo file are required']);
            return;
        }

        $landId = $_POST['land_id'];
        $commentId = $_POST['comment_id'] ?? null;
        
        // Check if land exists
        $stmt = $this->db->prepare("SELECT id FROM lands WHERE id = ? AND is_active = 1");
        $stmt->execute([$landId]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'Land not found']);
            return;
        }

        $file = $_FILES['photo'];
        
        // Validate file
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($file['type'], $allowedTypes)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed']);
            return;
        }

        // Check file size (max 10MB)
        if ($file['size'] > 10 * 1024 * 1024) {
            http_response_code(400);
            echo json_encode(['error' => 'File size too large. Maximum 10MB allowed']);
            return;
        }

        try {
            // Generate unique filename
            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = uniqid() . '_' . time() . '.' . $extension;
            $filePath = $this->uploadDir . $filename;
            
            // Move uploaded file
            if (!move_uploaded_file($file['tmp_name'], $filePath)) {
                throw new \Exception('Failed to move uploaded file');
            }

            // Extract EXIF data for GPS coordinates
            $exifData = $this->extractExifData($filePath);
            
            // Insert photo record
            $stmt = $this->db->prepare("
                INSERT INTO land_photos (
                    comment_id, land_id, user_id, filename, original_filename, 
                    file_path, file_size, mime_type, latitude, longitude, altitude, 
                    photo_timestamp, camera_info
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $commentId,
                $landId,
                $user['user_id'],
                $filename,
                $file['name'],
                $filePath,
                $file['size'],
                $file['type'],
                $exifData['latitude'],
                $exifData['longitude'],
                $exifData['altitude'],
                $exifData['timestamp'],
                json_encode($exifData['camera_info'])
            ]);

            $photoId = $this->db->lastInsertId();
            
            // Create notification
            $this->createPhotoNotification($landId, $photoId, $user['user_id']);
            
            echo json_encode([
                'success' => true,
                'message' => 'Photo uploaded successfully',
                'data' => [
                    'id' => $photoId,
                    'filename' => $filename,
                    'url' => '/uploads/photos/' . $filename,
                    'location' => $exifData
                ]
            ]);

        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to upload photo: ' . $e->getMessage()]);
        }
    }

    public function getPhoto($id)
    {
        $user = Auth::requireAuth();
        
        $stmt = $this->db->prepare("
            SELECT lp.*, l.land_name, l.land_code, u.first_name, u.last_name
            FROM land_photos lp
            JOIN lands l ON lp.land_id = l.id
            JOIN users u ON lp.user_id = u.id
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
    }

    public function delete($id)
    {
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
            $stmt = $this->db->prepare("UPDATE land_photos SET is_active = 0 WHERE id = ?");
            $stmt->execute([$id]);
            
            // Optionally delete physical file
            if (file_exists($photo['file_path'])) {
                unlink($photo['file_path']);
            }
            
            echo json_encode(['success' => true, 'message' => 'Photo deleted successfully']);

        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete photo']);
        }
    }

    private function extractExifData($filePath)
    {
        $exifData = [
            'latitude' => null,
            'longitude' => null,
            'altitude' => null,
            'timestamp' => null,
            'camera_info' => []
        ];

        if (function_exists('exif_read_data')) {
            $exif = exif_read_data($filePath);
            
            if ($exif) {
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
                    $exifData['timestamp'] = date('Y-m-d H:i:s', strtotime($exif['DateTimeOriginal']));
                }
                
                // Extract camera info
                $exifData['camera_info'] = [
                    'make' => $exif['Make'] ?? null,
                    'model' => $exif['Model'] ?? null,
                    'software' => $exif['Software'] ?? null,
                    'orientation' => $exif['Orientation'] ?? null
                ];
            }
        }

        return $exifData;
    }

    private function getGPSCoordinate($coordinate, $hemisphere)
    {
        for ($i = 0; $i < 3; $i++) {
            $part = explode('/', $coordinate[$i]);
            if (count($part) == 1) {
                $coordinate[$i] = $part[0];
            } else if (count($part) == 2) {
                $coordinate[$i] = floatval($part[0]) / floatval($part[1]);
            } else {
                $coordinate[$i] = 0;
            }
        }
        
        list($degrees, $minutes, $seconds) = $coordinate;
        $result = $degrees + ($minutes / 60) + ($seconds / 3600);
        
        if ($hemisphere == 'S' || $hemisphere == 'W') {
            $result = -$result;
        }
        
        return $result;
    }

    private function createPhotoNotification($landId, $photoId, $userId)
    {
        // Get all users who should be notified
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
                VALUES (?, ?, 'photo_added', 'New Photo Added', 'A new photo has been added to a land you are following')
            ");
            $stmt->execute([$landId, $targetUserId]);
        }
    }
}
