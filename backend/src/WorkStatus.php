<?php

namespace App;

class WorkStatus
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Get all active work statuses
     */
    public function getAll()
    {
        $sql = "SELECT * FROM work_statuses 
                WHERE is_active = 1 
                ORDER BY sort_order ASC, name ASC";
        
        return $this->db->fetchAll($sql);
    }

    /**
     * Get work status by ID
     */
    public function findById($id)
    {
        $sql = "SELECT * FROM work_statuses WHERE id = :id";
        return $this->db->fetchOne($sql, ['id' => $id]);
    }

    /**
     * Get work status by name
     */
    public function findByName($name)
    {
        $sql = "SELECT * FROM work_statuses WHERE name = :name";
        return $this->db->fetchOne($sql, ['name' => $name]);
    }

    /**
     * Create a new work status
     */
    public function create($data)
    {
        $sql = "INSERT INTO work_statuses (
                    name, display_name, description, color, icon, 
                    sort_order, is_active, is_final, created_at, updated_at
                ) VALUES (
                    :name, :display_name, :description, :color, :icon,
                    :sort_order, :is_active, :is_final, NOW(), NOW()
                )";

        $params = [
            'name' => $data['name'],
            'display_name' => $data['display_name'],
            'description' => $data['description'] ?? null,
            'color' => $data['color'] ?? '#6b7280',
            'icon' => $data['icon'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active' => $data['is_active'] ?? 1,
            'is_final' => $data['is_final'] ?? 0
        ];

        $this->db->query($sql, $params);
        return $this->findById($this->db->lastInsertId());
    }

    /**
     * Update a work status
     */
    public function update($id, $data)
    {
        $fields = [];
        $params = ['id' => $id];

        foreach ($data as $key => $value) {
            switch ($key) {
                case 'name':
                    $fields[] = 'name = :name';
                    $params['name'] = $value;
                    break;
                case 'display_name':
                    $fields[] = 'display_name = :display_name';
                    $params['display_name'] = $value;
                    break;
                case 'description':
                    $fields[] = 'description = :description';
                    $params['description'] = $value;
                    break;
                case 'color':
                    $fields[] = 'color = :color';
                    $params['color'] = $value;
                    break;
                case 'icon':
                    $fields[] = 'icon = :icon';
                    $params['icon'] = $value;
                    break;
                case 'sort_order':
                    $fields[] = 'sort_order = :sort_order';
                    $params['sort_order'] = (int) $value;
                    break;
                case 'is_active':
                    $fields[] = 'is_active = :is_active';
                    $params['is_active'] = (int) $value;
                    break;
                case 'is_final':
                    $fields[] = 'is_final = :is_final';
                    $params['is_final'] = (int) $value;
                    break;
            }
        }

        if (empty($fields)) {
            return $this->findById($id);
        }

        $fields[] = 'updated_at = NOW()';
        $sql = "UPDATE work_statuses SET " . implode(', ', $fields) . " WHERE id = :id";
        
        $this->db->query($sql, $params);
        return $this->findById($id);
    }

    /**
     * Delete a work status (soft delete by setting is_active = 0)
     */
    public function delete($id)
    {
        // Check if this status is being used by any farm works
        $usageCheck = $this->db->fetchOne(
            "SELECT COUNT(*) as count FROM farm_works WHERE work_status_id = :id",
            ['id' => $id]
        );

        if ($usageCheck['count'] > 0) {
            // Soft delete - just mark as inactive
            $sql = "UPDATE work_statuses SET is_active = 0, updated_at = NOW() WHERE id = :id";
            $this->db->query($sql, ['id' => $id]);
            return true;
        } else {
            // Hard delete if not in use
            $sql = "DELETE FROM work_statuses WHERE id = :id";
            $this->db->query($sql, ['id' => $id]);
            return true;
        }
    }

    /**
     * Get final statuses (completed, canceled, etc.)
     */
    public function getFinalStatuses()
    {
        $sql = "SELECT * FROM work_statuses 
                WHERE is_final = 1 AND is_active = 1 
                ORDER BY sort_order ASC, name ASC";
        
        return $this->db->fetchAll($sql);
    }

    /**
     * Get non-final statuses (pending, in_progress, etc.)
     */
    public function getNonFinalStatuses()
    {
        $sql = "SELECT * FROM work_statuses 
                WHERE is_final = 0 AND is_active = 1 
                ORDER BY sort_order ASC, name ASC";
        
        return $this->db->fetchAll($sql);
    }

    /**
     * Check if a status is final
     */
    public function isFinalStatus($statusId)
    {
        $status = $this->findById($statusId);
        return $status ? (bool) $status['is_final'] : false;
    }

    /**
     * Format work status for API response
     */
    public function formatWorkStatus($status)
    {
        return [
            'id' => (int) $status['id'],
            'name' => $status['name'],
            'displayName' => $status['display_name'],
            'description' => $status['description'],
            'color' => $status['color'],
            'icon' => $status['icon'],
            'sortOrder' => (int) $status['sort_order'],
            'isActive' => (bool) $status['is_active'],
            'isFinal' => (bool) $status['is_final'],
            'createdAt' => $status['created_at'],
            'updatedAt' => $status['updated_at']
        ];
    }

    /**
     * Get status statistics
     */
    public function getStatusStatistics()
    {
        $sql = "SELECT 
                    ws.id,
                    ws.name,
                    ws.display_name,
                    ws.color,
                    ws.icon,
                    COUNT(fw.id) as work_count
                FROM work_statuses ws
                LEFT JOIN farm_works fw ON ws.id = fw.work_status_id
                WHERE ws.is_active = 1
                GROUP BY ws.id, ws.name, ws.display_name, ws.color, ws.icon
                ORDER BY ws.sort_order ASC";
        
        return $this->db->fetchAll($sql);
    }

    /**
     * Validate status data
     */
    public function validate($data, $isUpdate = false)
    {
        $errors = [];

        // Required fields
        if (!$isUpdate && empty($data['name'])) {
            $errors[] = 'Name is required';
        }

        if (!$isUpdate && empty($data['display_name'])) {
            $errors[] = 'Display name is required';
        }

        // Check for duplicate name
        if (!empty($data['name'])) {
            $existing = $this->findByName($data['name']);
            if ($existing && (!$isUpdate || $existing['id'] != ($data['id'] ?? null))) {
                $errors[] = 'Name already exists';
            }
        }

        // Validate color format
        if (!empty($data['color']) && !preg_match('/^#[0-9A-Fa-f]{6}$/', $data['color'])) {
            $errors[] = 'Color must be a valid hex color (e.g., #FF0000)';
        }

        return $errors;
    }
}






