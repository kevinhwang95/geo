<?php

namespace App\Controllers;

use App\Database;
use App\Auth;
use App\WorkNote;

class WorkNoteController
{
    private $db;
    private $workNote;

    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->workNote = new WorkNote();
    }

    /**
     * Get notes for a specific work
     */
    public function getByWorkId($workId)
    {
        try {
            Auth::requireAuth();
            
            $notes = $this->workNote->getByWorkId($workId);
            $includePhotos = isset($_GET['include_photos']) && $_GET['include_photos'] === 'true';
            $formattedNotes = array_map(function($note) use ($includePhotos) {
                return $this->workNote->formatWorkNote($note, $includePhotos);
            }, $notes);

            echo json_encode([
                'success' => true,
                'data' => $formattedNotes
            ]);

        } catch (\Exception $e) {
            error_log("WorkNoteController::getByWorkId error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch work notes']);
        }
    }

    /**
     * Create a new work note
     */
    public function store()
    {
        try {
            $user = Auth::requireAuth();
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid input']);
                return;
            }

            // Validate required fields
            $requiredFields = ['work_id', 'title', 'content'];
            foreach ($requiredFields as $field) {
                if (!isset($input[$field]) || empty($input[$field])) {
                    http_response_code(400);
                    echo json_encode(['error' => "Field '$field' is required"]);
                    return;
                }
            }

            // Set creator as current user
            $input['created_by_user_id'] = $user['user_id'];

            $note = $this->workNote->create($input);
            $formattedNote = $this->workNote->formatWorkNote($note);

            echo json_encode([
                'success' => true,
                'message' => 'Work note created successfully',
                'data' => $formattedNote
            ]);

        } catch (\Exception $e) {
            error_log("WorkNoteController::store error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create work note']);
        }
    }

    /**
     * Update a work note
     */
    public function update($id)
    {
        try {
            $user = Auth::requireAuth();
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid input']);
                return;
            }

            // Check if note exists
            $existingNote = $this->workNote->findById($id);
            if (!$existingNote) {
                http_response_code(404);
                echo json_encode(['error' => 'Work note not found']);
                return;
            }

            $note = $this->workNote->update($id, $input);
            $includePhotos = isset($_GET['include_photos']) && $_GET['include_photos'] === 'true';
            $formattedNote = $this->workNote->formatWorkNote($note, $includePhotos);

            echo json_encode([
                'success' => true,
                'message' => 'Work note updated successfully',
                'data' => $formattedNote
            ]);

        } catch (\Exception $e) {
            error_log("WorkNoteController::update error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update work note']);
        }
    }

    /**
     * Delete a work note
     */
    public function destroy($id)
    {
        try {
            $user = Auth::requireAuth();
            
            $note = $this->workNote->findById($id);
            
            if (!$note) {
                http_response_code(404);
                echo json_encode(['error' => 'Work note not found']);
                return;
            }

            // Only allow creator or admin to delete
            if ($note['created_by_user_id'] != $user['user_id'] && !in_array($user['role'], ['admin', 'system'])) {
                http_response_code(403);
                echo json_encode(['error' => 'Not authorized to delete this note']);
                return;
            }

            $this->workNote->delete($id);

            echo json_encode([
                'success' => true,
                'message' => 'Work note deleted successfully'
            ]);

        } catch (\Exception $e) {
            error_log("WorkNoteController::destroy error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete work note']);
        }
    }

    /**
     * Mark a note as read
     */
    public function markAsRead($id)
    {
        try {
            $user = Auth::requireAuth();
            
            $note = $this->workNote->findById($id);
            
            if (!$note) {
                http_response_code(404);
                echo json_encode(['error' => 'Work note not found']);
                return;
            }

            $this->workNote->markAsRead($id, $user['user_id']);

            echo json_encode([
                'success' => true,
                'message' => 'Note marked as read'
            ]);

        } catch (\Exception $e) {
            error_log("WorkNoteController::markAsRead error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to mark note as read']);
        }
    }

    /**
     * Get readers of a note
     */
    public function getReaders($id)
    {
        try {
            Auth::requireAuth();
            
            $note = $this->workNote->findById($id);
            
            if (!$note) {
                http_response_code(404);
                echo json_encode(['error' => 'Work note not found']);
                return;
            }

            $readers = $this->workNote->getReaders($id);

            echo json_encode([
                'success' => true,
                'data' => $readers
            ]);

        } catch (\Exception $e) {
            error_log("WorkNoteController::getReaders error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch note readers']);
        }
    }

    /**
     * Dismiss a note
     */
    public function dismiss($id)
    {
        try {
            $user = Auth::requireAuth();
            
            $note = $this->workNote->findById($id);
            
            if (!$note) {
                http_response_code(404);
                echo json_encode(['error' => 'Work note not found']);
                return;
            }

            $this->workNote->dismiss($id, $user['user_id']);

            echo json_encode([
                'success' => true,
                'message' => 'Note dismissed'
            ]);

        } catch (\Exception $e) {
            error_log("WorkNoteController::dismiss error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to dismiss note']);
        }
    }

    /**
     * Add photo to work note
     */
    public function addPhoto($id)
    {
        try {
            $user = Auth::requireAuth();
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || !isset($input['photo_id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'photo_id is required']);
                return;
            }

            $note = $this->workNote->findById($id);
            
            if (!$note) {
                http_response_code(404);
                echo json_encode(['error' => 'Work note not found']);
                return;
            }

            $this->workNote->addPhoto($id, $input['photo_id']);

            echo json_encode([
                'success' => true,
                'message' => 'Photo added to work note successfully'
            ]);

        } catch (\Exception $e) {
            error_log("WorkNoteController::addPhoto error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to add photo to work note']);
        }
    }

    /**
     * Remove photo from work note
     */
    public function removePhoto($id)
    {
        try {
            $user = Auth::requireAuth();
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || !isset($input['photo_id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'photo_id is required']);
                return;
            }

            $note = $this->workNote->findById($id);
            
            if (!$note) {
                http_response_code(404);
                echo json_encode(['error' => 'Work note not found']);
                return;
            }

            // Only allow creator or admin to remove photos
            if ($note['created_by_user_id'] != $user['user_id'] && !in_array($user['role'], ['admin', 'system'])) {
                http_response_code(403);
                echo json_encode(['error' => 'Not authorized to remove photos from this note']);
                return;
            }

            $this->workNote->removePhoto($id, $input['photo_id']);

            echo json_encode([
                'success' => true,
                'message' => 'Photo removed from work note successfully'
            ]);

        } catch (\Exception $e) {
            error_log("WorkNoteController::removePhoto error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to remove photo from work note']);
        }
    }

    /**
     * Get photos for a work note
     */
    public function getPhotos($id)
    {
        try {
            Auth::requireAuth();
            
            $note = $this->workNote->findById($id);
            
            if (!$note) {
                http_response_code(404);
                echo json_encode(['error' => 'Work note not found']);
                return;
            }

            $photos = $this->workNote->getPhotos($id);

            echo json_encode([
                'success' => true,
                'data' => $photos
            ]);

        } catch (\Exception $e) {
            error_log("WorkNoteController::getPhotos error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch work note photos']);
        }
    }
}
?>
