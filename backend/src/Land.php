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
                    province, district, city, plant_type, category, 
                    plant_year, harvest_cycle, geometry, size, 
                    created_by, created_at, updated_at
                ) VALUES (
                    :land_name, :land_code, :deed_number, :location,
                    :province, :district, :city, :plant_type, :category,
                    :plant_year, :harvest_cycle, :geometry, :size,
                    :created_by, NOW(), NOW()
                )";

        $params = [
            'land_name' => $data['landName'],
            'land_code' => $data['landCode'],
            'deed_number' => $data['deedNumber'],
            'location' => $data['location'],
            'province' => $data['province'],
            'district' => $data['district'],
            'city' => $data['city'],
            'plant_type' => $data['plantType'],
            'category' => $data['category'],
            'plant_year' => $data['plantYear'],
            'harvest_cycle' => $data['harvestCycle'],
            'geometry' => $data['geometry'],
            'size' => $data['size'],
            'created_by' => $data['createdBy'] ?? 1,
        ];

        $this->db->query($sql, $params);
        return $this->findById($this->db->lastInsertId());
    }

    public function findById($id)
    {
        $sql = "SELECT l.*, u.first_name, u.last_name 
                FROM lands l 
                LEFT JOIN users u ON l.created_by = u.id 
                WHERE l.id = :id";
        
        return $this->db->fetchOne($sql, ['id' => $id]);
    }

    public function getAll()
    {
        $sql = "SELECT l.*, u.first_name, u.last_name 
                FROM lands l 
                LEFT JOIN users u ON l.created_by = u.id 
                ORDER BY l.created_at DESC";
        
        return $this->db->fetchAll($sql);
    }

    public function update($id, $data)
    {
        $fields = [];
        $params = ['id' => $id];

        foreach ($data as $key => $value) {
            if ($key === 'landName') {
                $fields[] = 'land_name = :land_name';
                $params['land_name'] = $value;
            } elseif ($key === 'landCode') {
                $fields[] = 'land_code = :land_code';
                $params['land_code'] = $value;
            } elseif ($key === 'deedNumber') {
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
            } elseif ($key === 'plantType') {
                $fields[] = 'plant_type = :plant_type';
                $params['plant_type'] = $value;
            } elseif ($key === 'category') {
                $fields[] = 'category = :category';
                $params['category'] = $value;
            } elseif ($key === 'plantYear') {
                $fields[] = 'plant_year = :plant_year';
                $params['plant_year'] = $value;
            } elseif ($key === 'harvestCycle') {
                $fields[] = 'harvest_cycle = :harvest_cycle';
                $params['harvest_cycle'] = $value;
            } elseif ($key === 'geometry') {
                $fields[] = 'geometry = :geometry';
                $params['geometry'] = $value;
            } elseif ($key === 'size') {
                $fields[] = 'size = :size';
                $params['size'] = $value;
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
            'landName' => $land['land_name'],
            'landCode' => $land['land_code'],
            'deedNumber' => $land['deed_number'],
            'location' => $land['location'],
            'province' => $land['province'],
            'district' => $land['district'],
            'city' => $land['city'],
            'plantType' => $land['plant_type'],
            'category' => $land['category'],
            'plantYear' => (int) $land['plant_year'],
            'harvestCycle' => (int) $land['harvest_cycle'],
            'geometry' => $land['geometry'],
            'size' => (float) $land['size'],
            'createdBy' => (int) $land['created_by'],
            'createdAt' => $land['created_at'],
            'updatedAt' => $land['updated_at'],
        ];
    }
}
