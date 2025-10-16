<?php

namespace App\Controllers;

use App\Database;
use App\Auth;
use App\ErrorLogger;

class WorkNotePhotoController extends BaseController
{
    private $db;

    public function __construct()
    {
        parent::__construct();
        $this->db = Database::getInstance();
    }

    public function upload()
    {
        $user = Auth::requireAuth();
        
        if (!isset($_POST['work_note_id']) || !isset($_FILES['photo'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Work note ID and photo file are required']);
            return;
        }

        $workNoteId = $_POST['work_note_id'];
        
        // Check if work note exists and user has access
        $workNote = $this->db->fetchOne("
            SELECT wn.*, fw.assigned_team_id, fw.creator_user_id
            FROM work_notes wn
            JOIN farm_works fw ON wn.work_id = fw.id
            WHERE wn.id = ?
        ", [$workNoteId]);

        if (!$workNote) {
            http_response_code(404);
            echo json_encode(['error' => 'Work note not found']);
            return;
        }

        // Check if user has permission to add photos to this work note
        $hasPermission = false;
        if ($user['role'] === 'admin') {
            $hasPermission = true;
        } elseif ($workNote['created_by_user_id'] == $user['user_id']) {
            $hasPermission = true;
        } elseif ($workNote['creator_user_id'] == $user['user_id']) {
            $hasPermission = true;
        } else {
            // Check if user is a team member
            $teamMember = $this->db->fetchOne("
                SELECT id FROM team_members 
                WHERE team_id = ? AND user_id = ? AND is_active = 1
            ", [$workNote['assigned_team_id'], $user['user_id']]);
            $hasPermission = $teamMember !== false;
        }

        if (!$hasPermission) {
            http_response_code(403);
            echo json_encode(['error' => 'You do not have permission to add photos to this work note']);
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

        if ($file['size'] > 10 * 1024 * 1024) { // 10MB limit
            http_response_code(400);
            echo json_encode(['error' => 'File too large. Maximum size is 10MB']);
            return;
        }

        try {
            // Create uploads directory if it doesn't exist
            $uploadDir = __DIR__ . '/../../uploads/photos';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }

            // Generate unique filename
            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = uniqid() . '_' . time() . '.' . $extension;
            $filePath = $uploadDir . '/' . $filename;

            // Move uploaded file
            if (!move_uploaded_file($file['tmp_name'], $filePath)) {
                throw new \Exception('Failed to move uploaded file');
            }

            // Extract EXIF data for GPS coordinates
            $exifData = $this->extractExifData($filePath);
            
            // Insert photo record into land_photos table (we reuse this table)
            $this->db->query("
                INSERT INTO land_photos (
                    land_id, user_id, filename, original_filename, 
                    file_path, file_size, mime_type, latitude, longitude, altitude, 
                    photo_timestamp, camera_info, comment_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ", [
                null, // No land_id for work note photos
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
                json_encode($exifData['camera_info']),
                null // No comment_id for work note photos
            ]);

            $photoId = $this->db->lastInsertId();
            
            // Link photo to work note
            $this->db->query("
                INSERT INTO work_note_photos (note_id, photo_id) 
                VALUES (?, ?)
            ", [$workNoteId, $photoId]);

            // Return success response with photo data
            echo json_encode([
                'success' => true,
                'message' => 'Photo uploaded successfully',
                'data' => [
                    'id' => $photoId,
                    'filename' => $filename,
                    'url' => '/uploads/photos/' . $filename,
                    'original_filename' => $file['name'],
                    'file_size' => $file['size'],
                    'mime_type' => $file['type']
                ]
            ]);

        } catch (\Exception $e) {
            $this->logger->logError('Failed to upload work note photo', $e, [
                'user_id' => $user['user_id'],
                'work_note_id' => $workNoteId,
                'filename' => $file['name']
            ]);
            
            http_response_code(500);
            echo json_encode(['error' => 'Failed to upload photo: ' . $e->getMessage()]);
        }
    }

    public function delete($photoId)
    {
        $user = Auth::requireAuth();
        
        // Check if photo exists and user has permission
        $photo = $this->db->fetchOne("
            SELECT lp.*, wnp.note_id, wn.created_by_user_id
            FROM land_photos lp
            JOIN work_note_photos wnp ON lp.id = wnp.photo_id
            JOIN work_notes wn ON wnp.note_id = wn.id
            WHERE lp.id = ? AND lp.is_active = 1
        ", [$photoId]);

        if (!$photo) {
            http_response_code(404);
            echo json_encode(['error' => 'Photo not found']);
            return;
        }

        // Check permissions
        $hasPermission = false;
        if ($user['role'] === 'admin') {
            $hasPermission = true;
        } elseif ($photo['user_id'] == $user['user_id']) {
            $hasPermission = true;
        } elseif ($photo['created_by_user_id'] == $user['user_id']) {
            $hasPermission = true;
        }

        if (!$hasPermission) {
            http_response_code(403);
            echo json_encode(['error' => 'You do not have permission to delete this photo']);
            return;
        }

        try {
            // Soft delete photo
            $this->db->query("UPDATE land_photos SET is_active = 0 WHERE id = ?", [$photoId]);
            
            // Optionally delete physical file
            if (file_exists($photo['file_path'])) {
                unlink($photo['file_path']);
            }
            
            echo json_encode(['success' => true, 'message' => 'Photo deleted successfully']);

        } catch (\Exception $e) {
            $this->logger->logError('Failed to delete work note photo', $e, [
                'user_id' => $user['user_id'],
                'photo_id' => $photoId
            ]);
            
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete photo: ' . $e->getMessage()]);
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

        if (function_exists('exif_read_data') && in_array(strtolower(pathinfo($filePath, PATHINFO_EXTENSION)), ['jpg', 'jpeg'])) {
            $exif = exif_read_data($filePath);
            
            if ($exif) {
                // Extract GPS coordinates
                if (isset($exif['GPS'])) {
                    $lat = $this->getGpsCoordinate($exif['GPS'], 'GPSLatitude', $exif['GPS']['GPSLatitudeRef']);
                    $lon = $this->getGpsCoordinate($exif['GPS'], 'GPSLongitude', $exif['GPS']['GPSLongitudeRef']);
                    
                    if ($lat && $lon) {
                        $exifData['latitude'] = $lat;
                        $exifData['longitude'] = $lon;
                    }
                    
                    if (isset($exif['GPS']['GPSAltitude'])) {
                        $exifData['altitude'] = $exif['GPS']['GPSAltitude'];
                    }
                }
                
                // Extract timestamp
                if (isset($exif['DateTime'])) {
                    $exifData['timestamp'] = date('Y-m-d H:i:s', strtotime($exif['DateTime']));
                }
                
                // Extract camera info
                $cameraInfo = [];
                if (isset($exif['Make'])) $cameraInfo['make'] = $exif['Make'];
                if (isset($exif['Model'])) $cameraInfo['model'] = $exif['Model'];
                if (isset($exif['Software'])) $cameraInfo['software'] = $exif['Software'];
                
                $exifData['camera_info'] = $cameraInfo;
            }
        }

        return $exifData;
    }

    private function getGpsCoordinate($exifCoord, $coord, $hemi)
    {
        $degrees = count($exifCoord[$coord]) > 0 ? $this->gpsToDecimal($exifCoord[$coord][0], $exifCoord[$coord][1], $exifCoord[$coord][2], $hemi) : 0;
        return $degrees;
    }

    private function gpsToDecimal($deg, $min, $sec, $hemi)
    {
        $d = $deg + $min/60 + $sec/3600;
        return ($hemi == 'S' || $hemi == 'W') ? $d *= -1 : $d;
    }
}
