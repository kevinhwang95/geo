<?php

namespace App;

class Land
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function create($data)
    {
        $sql = "INSERT INTO lands (
                    land_name, land_code, deed_number, location, 
                    province, district, city, plant_type_id, category_id, 
                    plant_date, harvest_cycle_days, tree_count, geometry, size, palm_area,
                    owner_name, notes, created_by, created_at, updated_at
                ) VALUES (
                    :land_name, :land_code, :deed_number, :location,
                    :province, :district, :city, :plant_type_id, :category_id,
                    :plant_date, :harvest_cycle_days, :tree_count, :geometry, :size, :palm_area,
                    :owner_name, :notes, :created_by, NOW(), NOW()
                )";

        // Handle harvest_cycle - extract first number if it's comma-separated
        $harvestCycle = $data['harvest_cycle'];
        if (is_string($harvestCycle) && strpos($harvestCycle, ',') !== false) {
            $parts = explode(',', $harvestCycle);
            $harvestCycle = (int) trim($parts[0]);
        } else {
            $harvestCycle = (int) $harvestCycle;
        }

        $params = [
            'land_name' => $data['land_name'],
            'land_code' => $data['land_code'],
            'deed_number' => $data['land_number'], // Map land_number to deed_number
            'location' => $data['location'],
            'province' => $data['province'],
            'district' => $data['district'],
            'city' => $data['city'],
            'plant_type_id' => (int) $data['planttypeid'],
            'category_id' => (int) $data['categoryid'],
            'plant_date' => $data['plant_date'],
            'harvest_cycle_days' => $harvestCycle,
            'tree_count' => isset($data['tree_count']) ? (int) $data['tree_count'] : null,
            'geometry' => $data['coordinations'],
            'size' => (float) $data['size'],
            'palm_area' => isset($data['palm_area']) && $data['palm_area'] !== '' ? (float) $data['palm_area'] : null,
            'owner_name' => $data['owner'] ?? null,
            'notes' => $data['notes'] ?? null,
            'created_by' => $data['created_by'] ?? 1,
        ];

        $this->db->query($sql, $params);
        return $this->findById($this->db->lastInsertId());
    }

    public function findById($id)
    {
        $sql = "SELECT l.*, u.first_name, u.last_name,
                       pt.name as plant_type_name, 
                       pt.translation_key as plant_type_translation_key,
                       c.name as category_name, 
                       c.translation_key as category_translation_key,
                       c.color as category_color
                FROM lands l 
                LEFT JOIN users u ON l.created_by = u.id 
                LEFT JOIN plant_types pt ON l.plant_type_id = pt.id
                LEFT JOIN categories c ON l.category_id = c.id
                WHERE l.id = :id";
        
        return $this->db->fetchOne($sql, ['id' => $id]);
    }

    public function getAll()
    {
        $sql = "SELECT l.*, u.first_name, u.last_name, 
                       pt.name as plant_type_name, 
                       pt.translation_key as plant_type_translation_key,
                       c.name as category_name, 
                       c.translation_key as category_translation_key,
                       c.color as category_color
                FROM lands l 
                LEFT JOIN users u ON l.created_by = u.id 
                LEFT JOIN plant_types pt ON l.plant_type_id = pt.id
                LEFT JOIN categories c ON l.category_id = c.id
                WHERE l.is_active = 1
                ORDER BY l.created_at DESC";
        
        return $this->db->fetchAll($sql);
    }

    public function update($id, $data)
    {
        $fields = [];
        $params = ['id' => $id];

        foreach ($data as $key => $value) {
            if ($key === 'land_name') {
                $fields[] = 'land_name = :land_name';
                $params['land_name'] = $value;
            } elseif ($key === 'land_code') {
                $fields[] = 'land_code = :land_code';
                $params['land_code'] = $value;
            } elseif ($key === 'land_number') {
                $fields[] = 'deed_number = :deed_number';
                $params['deed_number'] = $value;
            } elseif ($key === 'location') {
                $fields[] = 'location = :location';
                $params['location'] = $value;
            } elseif ($key === 'province') {
                $fields[] = 'province = :province';
                $params['province'] = $value;
            } elseif ($key === 'district') {
                $fields[] = 'district = :district';
                $params['district'] = $value;
            } elseif ($key === 'city') {
                $fields[] = 'city = :city';
                $params['city'] = $value;
            } elseif ($key === 'planttypeid') {
                $fields[] = 'plant_type_id = :plant_type_id';
                $params['plant_type_id'] = (int) $value;
            } elseif ($key === 'categoryid') {
                $fields[] = 'category_id = :category_id';
                $params['category_id'] = (int) $value;
            } elseif ($key === 'plant_date') {
                $fields[] = 'plant_date = :plant_date';
                $params['plant_date'] = $value;
            } elseif ($key === 'harvest_cycle') {
                // Handle harvest_cycle - extract first number if it's comma-separated
                $harvestCycle = $value;
                if (is_string($harvestCycle) && strpos($harvestCycle, ',') !== false) {
                    $parts = explode(',', $harvestCycle);
                    $harvestCycle = (int) trim($parts[0]);
                } else {
                    $harvestCycle = (int) $harvestCycle;
                }
                $fields[] = 'harvest_cycle_days = :harvest_cycle_days';
                $params['harvest_cycle_days'] = $harvestCycle;
            } elseif ($key === 'coordinations') {
                $fields[] = 'geometry = :geometry';
                $params['geometry'] = $value;
            } elseif ($key === 'size') {
                $fields[] = 'size = :size';
                $params['size'] = (float) $value;
            } elseif ($key === 'palm_area') {
                $fields[] = 'palm_area = :palm_area';
                $params['palm_area'] = isset($value) && $value !== '' ? (float) $value : null;
            } elseif ($key === 'tree_count') {
                $fields[] = 'tree_count = :tree_count';
                $params['tree_count'] = isset($value) && $value !== '' ? (int) $value : null;
            } elseif ($key === 'owner') {
                $fields[] = 'owner_name = :owner_name';
                $params['owner_name'] = $value;
            } elseif ($key === 'notes') {
                $fields[] = 'notes = :notes';
                $params['notes'] = $value;
            }
        }

        if (empty($fields)) {
            return $this->findById($id);
        }

        $fields[] = 'updated_at = NOW()';
        $sql = "UPDATE lands SET " . implode(', ', $fields) . " WHERE id = :id";
        
        $this->db->query($sql, $params);
        return $this->findById($id);
    }

    public function delete($id)
    {
        $sql = "DELETE FROM lands WHERE id = :id";
        $this->db->query($sql, ['id' => $id]);
        return true;
    }

    public function formatLand($land)
    {
        return [
            'id' => (int) $land['id'],
            'land_name' => $land['land_name'],
            'land_code' => $land['land_code'],
            'land_number' => $land['deed_number'], // Map deed_number back to land_number for frontend
            'location' => $land['location'],
            'province' => $land['province'],
            'district' => $land['district'],
            'city' => $land['city'],
            'plant_type_id' => (int) $land['plant_type_id'],
            'planttypeid' => (int) $land['plant_type_id'], // Also map to planttypeid for frontend compatibility
            'category_id' => (int) $land['category_id'],
            'categoryid' => (int) $land['category_id'], // Also map to categoryid for frontend compatibility
            'plant_type_name' => $land['plant_type_name'] ?? null,
            'plant_type_translation_key' => $land['plant_type_translation_key'] ?? null,
            'category_name' => $land['category_name'] ?? null,
            'category_translation_key' => $land['category_translation_key'] ?? null,
            'category_color' => $land['category_color'] ?? '#4285F4',
            'plant_date' => $land['plant_date'],
            'harvest_cycle_days' => (int) $land['harvest_cycle_days'],
            'harvest_cycle' => (string) $land['harvest_cycle_days'], // Add harvest_cycle field for frontend
            'next_harvest_date' => $land['next_harvest_date'],
            'coordinations' => $land['geometry'], // Map geometry to coordinations for frontend
            'geometry' => $land['geometry'], // Keep original geometry field too
            'size' => (float) $land['size'],
            'palm_area' => isset($land['palm_area']) ? (float) $land['palm_area'] : null, // Add palm_area field
            'tree_count' => isset($land['tree_count']) ? (int) $land['tree_count'] : null, // Add tree_count field
            'owner_name' => $land['owner_name'],
            'owner' => $land['owner_name'], // Also map to owner for frontend compatibility
            'notes' => $land['notes'],
            'is_active' => (bool) $land['is_active'],
            'created_by' => (int) $land['created_by'],
            'created' => $land['created_at'], // Add created field for frontend compatibility
            'createdby' => $land['first_name'] . ' ' . $land['last_name'], // Add createdby field for frontend compatibility
            'created_at' => $land['created_at'],
            'updated' => $land['updated_at'], // Add updated field for frontend compatibility
            'updatedby' => $land['first_name'] . ' ' . $land['last_name'], // Add updatedby field for frontend compatibility
            'updated_at' => $land['updated_at'],
            'harvest_status' => $this->calculateHarvestStatus($land['next_harvest_date']),
        ];
    }

    private function calculateHarvestStatus($nextHarvestDate)
    {
        if (!$nextHarvestDate) {
            return 'normal';
        }

        $harvestDate = new \DateTime($nextHarvestDate);
        $today = new \DateTime();
        $daysUntilHarvest = $today->diff($harvestDate)->days;

        if ($harvestDate < $today) {
            return 'overdue';
        } elseif ($daysUntilHarvest <= 7) {
            return 'due_soon';
        } else {
            return 'normal';
        }
    }
}
