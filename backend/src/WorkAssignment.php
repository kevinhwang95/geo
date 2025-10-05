<?php

namespace App;

class WorkAssignment
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function create($data)
    {
        $sql = "INSERT INTO work_assignments (
                    title, description, land_id, team_id, assigned_to_user_id, 
                    assigned_by_user_id, priority, status, due_date, 
                    created_at, updated_at
                ) VALUES (
                    :title, :description, :land_id, :team_id, :assigned_to_user_id,
                    :assigned_by_user_id, :priority, :status, :due_date,
                    NOW(), NOW()
                )";

        $params = [
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'land_id' => $data['land_id'] ?? null,
            'team_id' => $data['team_id'] ?? null,
            'assigned_to_user_id' => $data['assigned_to_user_id'] ?? null,
            'assigned_by_user_id' => $data['assigned_by_user_id'],
            'priority' => $data['priority'] ?? 'medium',
            'status' => $data['status'] ?? 'pending',
            'due_date' => $data['due_date'] ?? null,
        ];

        $this->db->query($sql, $params);
        return $this->findById($this->db->lastInsertId());
    }

    public function findById($id)
    {
        $sql = "SELECT wa.*, 
                       l.land_name, l.land_code,
                       t.name as team_name,
                       au.first_name as assigned_to_first_name, 
                       au.last_name as assigned_to_last_name,
                       ab.first_name as assigned_by_first_name,
                       ab.last_name as assigned_by_last_name
                FROM work_assignments wa 
                LEFT JOIN lands l ON wa.land_id = l.id 
                LEFT JOIN teams t ON wa.team_id = t.id
                LEFT JOIN users au ON wa.assigned_to_user_id = au.id 
                LEFT JOIN users ab ON wa.assigned_by_user_id = ab.id
                WHERE wa.id = :id";
        
        return $this->db->fetchOne($sql, ['id' => $id]);
    }

    public function getAll($filters = [])
    {
        $sql = "SELECT wa.*, 
                       l.land_name, l.land_code,
                       t.name as team_name,
                       au.first_name as assigned_to_first_name, 
                       au.last_name as assigned_to_last_name,
                       ab.first_name as assigned_by_first_name,
                       ab.last_name as assigned_by_last_name
                FROM work_assignments wa 
                LEFT JOIN lands l ON wa.land_id = l.id 
                LEFT JOIN teams t ON wa.team_id = t.id
                LEFT JOIN users au ON wa.assigned_to_user_id = au.id 
                LEFT JOIN users ab ON wa.assigned_by_user_id = ab.id
                WHERE 1=1";
        
        $params = [];

        if (isset($filters['status'])) {
            $sql .= " AND wa.status = :status";
            $params['status'] = $filters['status'];
        }

        if (isset($filters['team_id'])) {
            $sql .= " AND wa.team_id = :team_id";
            $params['team_id'] = $filters['team_id'];
        }

        if (isset($filters['assigned_to_user_id'])) {
            $sql .= " AND wa.assigned_to_user_id = :assigned_to_user_id";
            $params['assigned_to_user_id'] = $filters['assigned_to_user_id'];
        }

        $sql .= " ORDER BY wa.created_at DESC";
        
        return $this->db->fetchAll($sql, $params);
    }

    public function update($id, $data)
    {
        $fields = [];
        $params = ['id' => $id];

        foreach ($data as $key => $value) {
            if ($key === 'title') {
                $fields[] = 'title = :title';
                $params['title'] = $value;
            } elseif ($key === 'description') {
                $fields[] = 'description = :description';
                $params['description'] = $value;
            } elseif ($key === 'land_id') {
                $fields[] = 'land_id = :land_id';
                $params['land_id'] = $value;
            } elseif ($key === 'team_id') {
                $fields[] = 'team_id = :team_id';
                $params['team_id'] = $value;
            } elseif ($key === 'assigned_to_user_id') {
                $fields[] = 'assigned_to_user_id = :assigned_to_user_id';
                $params['assigned_to_user_id'] = $value;
            } elseif ($key === 'priority') {
                $fields[] = 'priority = :priority';
                $params['priority'] = $value;
            } elseif ($key === 'status') {
                $fields[] = 'status = :status';
                $params['status'] = $value;
                if ($value === 'completed') {
                    $fields[] = 'completed_at = NOW()';
                }
            } elseif ($key === 'due_date') {
                $fields[] = 'due_date = :due_date';
                $params['due_date'] = $value;
            }
        }

        if (empty($fields)) {
            return $this->findById($id);
        }

        $fields[] = 'updated_at = NOW()';
        $sql = "UPDATE work_assignments SET " . implode(', ', $fields) . " WHERE id = :id";
        
        $this->db->query($sql, $params);
        return $this->findById($id);
    }

    public function delete($id)
    {
        $sql = "DELETE FROM work_assignments WHERE id = :id";
        $this->db->query($sql, ['id' => $id]);
        return true;
    }

    public function formatWorkAssignment($assignment)
    {
        return [
            'id' => (int) $assignment['id'],
            'title' => $assignment['title'],
            'description' => $assignment['description'],
            'landId' => $assignment['land_id'] ? (int) $assignment['land_id'] : null,
            'landName' => $assignment['land_name'],
            'landCode' => $assignment['land_code'],
            'teamId' => $assignment['team_id'] ? (int) $assignment['team_id'] : null,
            'teamName' => $assignment['team_name'],
            'assignedToUserId' => $assignment['assigned_to_user_id'] ? (int) $assignment['assigned_to_user_id'] : null,
            'assignedToUserName' => $assignment['assigned_to_first_name'] && $assignment['assigned_to_last_name'] 
                ? $assignment['assigned_to_first_name'] . ' ' . $assignment['assigned_to_last_name'] 
                : null,
            'assignedByUserId' => (int) $assignment['assigned_by_user_id'],
            'assignedByUserName' => $assignment['assigned_by_first_name'] . ' ' . $assignment['assigned_by_last_name'],
            'priority' => $assignment['priority'],
            'status' => $assignment['status'],
            'dueDate' => $assignment['due_date'],
            'completedAt' => $assignment['completed_at'],
            'createdAt' => $assignment['created_at'],
            'updatedAt' => $assignment['updated_at'],
        ];
    }
}
