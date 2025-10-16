<?php

namespace App;

class WorkNote
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function create($data)
    {
        $sql = "INSERT INTO work_notes (
                    work_id, title, content, priority_level, created_by_user_id
                ) VALUES (
                    :work_id, :title, :content, :priority_level, :created_by_user_id
                )";

        $params = [
            'work_id' => $data['work_id'],
            'title' => $data['title'],
            'content' => $data['content'],
            'priority_level' => $data['priority_level'] ?? 'medium',
            'created_by_user_id' => $data['created_by_user_id']
        ];

        $this->db->query($sql, $params);
        return $this->findById($this->db->lastInsertId());
    }

    public function findById($id)
    {
        $sql = "SELECT wn.*, 
                       CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
                       fw.title as work_title
                FROM work_notes wn
                JOIN users u ON wn.created_by_user_id = u.id
                JOIN farm_works fw ON wn.work_id = fw.id
                WHERE wn.id = :id";
        return $this->db->fetchOne($sql, ['id' => $id]);
    }

    public function getByWorkId($workId)
    {
        $sql = "SELECT wn.*, 
                       CONCAT(u.first_name, ' ', u.last_name) as created_by_name
                FROM work_notes wn
                JOIN users u ON wn.created_by_user_id = u.id
                WHERE wn.work_id = :work_id
                ORDER BY wn.created_at DESC";
        
        return $this->db->fetchAll($sql, ['work_id' => $workId]);
    }

    public function update($id, $data)
    {
        $fields = [];
        $params = ['id' => $id];

        foreach ($data as $key => $value) {
            if ($key === 'title') {
                $fields[] = 'title = :title';
                $params['title'] = $value;
            } elseif ($key === 'content') {
                $fields[] = 'content = :content';
                $params['content'] = $value;
            } elseif ($key === 'priority_level') {
                $fields[] = 'priority_level = :priority_level';
                $params['priority_level'] = $value;
            }
        }

        if (empty($fields)) {
            return $this->findById($id);
        }

        $fields[] = 'updated_at = NOW()';
        $sql = "UPDATE work_notes SET " . implode(', ', $fields) . " WHERE id = :id";
        
        $this->db->query($sql, $params);
        return $this->findById($id);
    }

    public function delete($id)
    {
        $sql = "DELETE FROM work_notes WHERE id = :id";
        $this->db->query($sql, ['id' => $id]);
        return true;
    }

    public function markAsRead($noteId, $userId)
    {
        $sql = "INSERT IGNORE INTO work_note_reads (note_id, user_id) VALUES (:note_id, :user_id)";
        $this->db->query($sql, ['note_id' => $noteId, 'user_id' => $userId]);
        return true;
    }

    public function getReaders($noteId)
    {
        $sql = "SELECT wnr.*, 
                       CONCAT(u.first_name, ' ', u.last_name) as user_name
                FROM work_note_reads wnr
                JOIN users u ON wnr.user_id = u.id
                WHERE wnr.note_id = :note_id
                ORDER BY wnr.read_at DESC";
        
        return $this->db->fetchAll($sql, ['note_id' => $noteId]);
    }

    public function dismiss($noteId, $userId)
    {
        // For now, we'll use the markAsRead functionality as dismissal
        // You could add a separate dismissal field if needed
        return $this->markAsRead($noteId, $userId);
    }

    public function addPhoto($noteId, $photoId)
    {
        $sql = "INSERT IGNORE INTO work_note_photos (note_id, photo_id) VALUES (:note_id, :photo_id)";
        $this->db->query($sql, ['note_id' => $noteId, 'photo_id' => $photoId]);
        return true;
    }

    public function removePhoto($noteId, $photoId)
    {
        $sql = "DELETE FROM work_note_photos WHERE note_id = :note_id AND photo_id = :photo_id";
        $this->db->query($sql, ['note_id' => $noteId, 'photo_id' => $photoId]);
        return true;
    }

    public function getPhotos($noteId)
    {
        $sql = "SELECT lp.*, wnp.created_at as attached_at
                FROM work_note_photos wnp
                JOIN land_photos lp ON wnp.photo_id = lp.id
                WHERE wnp.note_id = :note_id AND lp.is_active = 1
                ORDER BY wnp.created_at DESC";
        
        return $this->db->fetchAll($sql, ['note_id' => $noteId]);
    }

    public function formatWorkNote($note, $includePhotos = false)
    {
        $formattedNote = [
            'id' => (int) $note['id'],
            'work_id' => (int) $note['work_id'],
            'workId' => (int) $note['work_id'],
            'workTitle' => $note['work_title'] ?? null,
            'title' => $note['title'],
            'content' => $note['content'],
            'priority_level' => $note['priority_level'],
            'priorityLevel' => $note['priority_level'],
            'created_by_user_id' => (int) $note['created_by_user_id'],
            'createdByUserId' => (int) $note['created_by_user_id'],
            'created_by_name' => $note['created_by_name'],
            'created_by_user_name' => $note['created_by_name'],
            'created_at' => $note['created_at'],
            'createdAt' => $note['created_at'],
            'updated_at' => $note['updated_at'],
            'updatedAt' => $note['updated_at']
        ];

        // Include photos if requested
        if ($includePhotos) {
            $photos = $this->getPhotos($note['id']);
            $formattedNote['photos'] = $photos;
        }

        return $formattedNote;
    }
}
