<?php

namespace App;

class WorkCompletion
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function create($data)
    {
        $sql = "INSERT INTO work_completions (
                    work_id, team_id, worker_count, completion_note, weight_of_product,
                    truck_number, driver_name, completed_by_user_id
                ) VALUES (
                    :work_id, :team_id, :worker_count, :completion_note, :weight_of_product,
                    :truck_number, :driver_name, :completed_by_user_id
                )";

        $params = [
            'work_id' => $data['work_id'],
            'team_id' => $data['team_id'],
            'worker_count' => $data['worker_count'] ?? 1,
            'completion_note' => $data['completion_note'] ?? null,
            'weight_of_product' => $data['weight_of_product'] ?? null,
            'truck_number' => $data['truck_number'] ?? null,
            'driver_name' => $data['driver_name'] ?? null,
            'completed_by_user_id' => $data['completed_by_user_id']
        ];

        $this->db->query($sql, $params);
        return $this->findById($this->db->lastInsertId());
    }

    public function findById($id)
    {
        $sql = "SELECT wc.*, 
                       fw.title as work_title,
                       t.name as team_name,
                       CONCAT(u.first_name, ' ', u.last_name) as completed_by_name
                FROM work_completions wc
                JOIN farm_works fw ON wc.work_id = fw.id
                JOIN teams t ON wc.team_id = t.id
                JOIN users u ON wc.completed_by_user_id = u.id
                WHERE wc.id = :id";
        return $this->db->fetchOne($sql, ['id' => $id]);
    }

    public function getByWorkId($workId)
    {
        $sql = "SELECT wc.*, 
                       t.name as team_name,
                       CONCAT(u.first_name, ' ', u.last_name) as completed_by_name
                FROM work_completions wc
                JOIN teams t ON wc.team_id = t.id
                JOIN users u ON wc.completed_by_user_id = u.id
                WHERE wc.work_id = :work_id
                ORDER BY wc.completed_at DESC";
        
        return $this->db->fetchAll($sql, ['work_id' => $workId]);
    }

    public function addPhoto($completionId, $photoId)
    {
        $sql = "INSERT IGNORE INTO work_completion_photos (completion_id, photo_id) VALUES (:completion_id, :photo_id)";
        $this->db->query($sql, ['completion_id' => $completionId, 'photo_id' => $photoId]);
        return true;
    }

    public function removePhoto($completionId, $photoId)
    {
        $sql = "DELETE FROM work_completion_photos WHERE completion_id = :completion_id AND photo_id = :photo_id";
        $this->db->query($sql, ['completion_id' => $completionId, 'photo_id' => $photoId]);
        return true;
    }

    public function getPhotos($completionId)
    {
        $sql = "SELECT lp.*, wcp.created_at as attached_at
                FROM work_completion_photos wcp
                JOIN land_photos lp ON wcp.photo_id = lp.id
                WHERE wcp.completion_id = :completion_id
                ORDER BY wcp.created_at DESC";
        
        return $this->db->fetchAll($sql, ['completion_id' => $completionId]);
    }

    public function update($id, $data)
    {
        $fields = [];
        $params = ['id' => $id];

        foreach ($data as $key => $value) {
            if ($key === 'worker_count') {
                $fields[] = 'worker_count = :worker_count';
                $params['worker_count'] = $value;
            } elseif ($key === 'completion_note') {
                $fields[] = 'completion_note = :completion_note';
                $params['completion_note'] = $value;
            } elseif ($key === 'weight_of_product') {
                $fields[] = 'weight_of_product = :weight_of_product';
                $params['weight_of_product'] = $value;
            } elseif ($key === 'truck_number') {
                $fields[] = 'truck_number = :truck_number';
                $params['truck_number'] = $value;
            } elseif ($key === 'driver_name') {
                $fields[] = 'driver_name = :driver_name';
                $params['driver_name'] = $value;
            }
        }

        if (empty($fields)) {
            return $this->findById($id);
        }

        $fields[] = 'updated_at = NOW()';
        $sql = "UPDATE work_completions SET " . implode(', ', $fields) . " WHERE id = :id";
        
        $this->db->query($sql, $params);
        return $this->findById($id);
    }

    public function delete($id)
    {
        $sql = "DELETE FROM work_completions WHERE id = :id";
        $this->db->query($sql, ['id' => $id]);
        return true;
    }

    public function formatWorkCompletion($completion, $includePhotos = false)
    {
        $formattedCompletion = [
            'id' => (int) $completion['id'],
            'workId' => (int) $completion['work_id'],
            'workTitle' => $completion['work_title'] ?? null,
            'teamId' => (int) $completion['team_id'],
            'teamName' => $completion['team_name'],
            'workerCount' => (int) $completion['worker_count'],
            'completionNote' => $completion['completion_note'],
            'weightOfProduct' => $completion['weight_of_product'] ? (float) $completion['weight_of_product'] : null,
            'truckNumber' => $completion['truck_number'],
            'driverName' => $completion['driver_name'],
            'completedByUserId' => (int) $completion['completed_by_user_id'],
            'completedByName' => $completion['completed_by_name'],
            'completedAt' => $completion['completed_at'],
            'createdAt' => $completion['created_at'],
            'updatedAt' => $completion['updated_at']
        ];

        // Include photos if requested
        if ($includePhotos) {
            $photos = $this->getPhotos($completion['id']);
            $formattedCompletion['photos'] = $photos;
        }

        return $formattedCompletion;
    }
}
