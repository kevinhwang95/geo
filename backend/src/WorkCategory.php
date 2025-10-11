<?php

namespace App;

class WorkCategory
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function create($data)
    {
        $sql = "INSERT INTO work_categories (name, description, color, icon) 
                VALUES (:name, :description, :color, :icon)";

        $params = [
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'color' => $data['color'] ?? '#3B82F6',
            'icon' => $data['icon'] ?? 'wrench'
        ];

        $this->db->query($sql, $params);
        return $this->findById($this->db->lastInsertId());
    }

    public function findById($id)
    {
        $sql = "SELECT * FROM work_categories WHERE id = :id AND is_active = 1";
        return $this->db->fetchOne($sql, ['id' => $id]);
    }

    public function getAll()
    {
        $sql = "SELECT * FROM work_categories WHERE is_active = 1 ORDER BY name ASC";
        return $this->db->fetchAll($sql);
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
            } elseif ($key === 'color') {
                $fields[] = 'color = :color';
                $params['color'] = $value;
            } elseif ($key === 'icon') {
                $fields[] = 'icon = :icon';
                $params['icon'] = $value;
            }
        }

        if (empty($fields)) {
            return $this->findById($id);
        }

        $fields[] = 'updated_at = NOW()';
        $sql = "UPDATE work_categories SET " . implode(', ', $fields) . " WHERE id = :id";
        
        $this->db->query($sql, $params);
        return $this->findById($id);
    }

    public function delete($id)
    {
        // Soft delete - set is_active to 0
        $sql = "UPDATE work_categories SET is_active = 0, updated_at = NOW() WHERE id = :id";
        $this->db->query($sql, ['id' => $id]);
        return true;
    }

    public function formatWorkCategory($category)
    {
        return [
            'id' => (int) $category['id'],
            'name' => $category['name'],
            'description' => $category['description'],
            'color' => $category['color'],
            'icon' => $category['icon'],
            'createdAt' => $category['created_at'],
            'updatedAt' => $category['updated_at']
        ];
    }
}

