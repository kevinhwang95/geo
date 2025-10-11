<?php

namespace App;

class WorkType
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function create($data)
    {
        $sql = "INSERT INTO work_types (name, description, category_id, icon, estimated_duration_hours) 
                VALUES (:name, :description, :category_id, :icon, :estimated_duration_hours)";

        $params = [
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'category_id' => $data['category_id'],
            'icon' => $data['icon'] ?? 'activity',
            'estimated_duration_hours' => $data['estimated_duration_hours'] ?? null
        ];

        $this->db->query($sql, $params);
        return $this->findById($this->db->lastInsertId());
    }

    public function findById($id)
    {
        $sql = "SELECT wt.*, wc.name as category_name, wc.color as category_color, wc.icon as category_icon
                FROM work_types wt
                JOIN work_categories wc ON wt.category_id = wc.id
                WHERE wt.id = :id AND wt.is_active = 1";
        return $this->db->fetchOne($sql, ['id' => $id]);
    }

    public function getAll($filters = [])
    {
        $sql = "SELECT wt.*, wc.name as category_name, wc.color as category_color, wc.icon as category_icon
                FROM work_types wt
                JOIN work_categories wc ON wt.category_id = wc.id
                WHERE wt.is_active = 1";
        
        $params = [];

        if (isset($filters['category_id'])) {
            $sql .= " AND wt.category_id = :category_id";
            $params['category_id'] = $filters['category_id'];
        }

        $sql .= " ORDER BY wc.name ASC, wt.name ASC";
        
        return $this->db->fetchAll($sql, $params);
    }

    public function getByCategory($categoryId)
    {
        $sql = "SELECT wt.*, wc.name as category_name, wc.color as category_color, wc.icon as category_icon
                FROM work_types wt
                JOIN work_categories wc ON wt.category_id = wc.id
                WHERE wt.category_id = :category_id AND wt.is_active = 1
                ORDER BY wt.name ASC";
        
        return $this->db->fetchAll($sql, ['category_id' => $categoryId]);
    }

    public function update($id, $data)
    {
        $fields = [];
        $params = ['id' => $id];

        foreach ($data as $key => $value) {
            if ($key === 'name') {
                $fields[] = 'name = :name';
                $params['name'] = $value;
            } elseif ($key === 'description') {
                $fields[] = 'description = :description';
                $params['description'] = $value;
            } elseif ($key === 'category_id') {
                $fields[] = 'category_id = :category_id';
                $params['category_id'] = $value;
            } elseif ($key === 'icon') {
                $fields[] = 'icon = :icon';
                $params['icon'] = $value;
            } elseif ($key === 'estimated_duration_hours') {
                $fields[] = 'estimated_duration_hours = :estimated_duration_hours';
                $params['estimated_duration_hours'] = $value;
            }
        }

        if (empty($fields)) {
            return $this->findById($id);
        }

        $fields[] = 'updated_at = NOW()';
        $sql = "UPDATE work_types SET " . implode(', ', $fields) . " WHERE id = :id";
        
        $this->db->query($sql, $params);
        return $this->findById($id);
    }

    public function delete($id)
    {
        // Soft delete - set is_active to 0
        $sql = "UPDATE work_types SET is_active = 0, updated_at = NOW() WHERE id = :id";
        $this->db->query($sql, ['id' => $id]);
        return true;
    }

    public function formatWorkType($workType)
    {
        return [
            'id' => (int) $workType['id'],
            'name' => $workType['name'],
            'description' => $workType['description'],
            'categoryId' => (int) $workType['category_id'],
            'categoryName' => $workType['category_name'],
            'categoryColor' => $workType['category_color'],
            'categoryIcon' => $workType['category_icon'],
            'icon' => $workType['icon'],
            'estimatedDurationHours' => $workType['estimated_duration_hours'] ? (float) $workType['estimated_duration_hours'] : null,
            'createdAt' => $workType['created_at'],
            'updatedAt' => $workType['updated_at']
        ];
    }
}

