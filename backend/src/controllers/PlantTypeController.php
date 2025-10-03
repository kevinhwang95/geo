<?php

namespace App\Controllers;

use App\Auth;
use App\Database;

class PlantTypeController
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function index()
    {
        $user = Auth::requireAuth();
        
        $sql = "
            SELECT pt.*, u.first_name as created_by_first_name, u.last_name as created_by_last_name
            FROM plant_types pt
            JOIN users u ON pt.created_by = u.id
            WHERE pt.is_active = 1
            ORDER BY pt.name
        ";
        $plantTypes = $this->db->fetchAll($sql);

        echo json_encode(['success' => true, 'data' => $plantTypes]);
    }

    public function show($id)
    {
        $user = Auth::requireAuth();
        
        $sql = "
            SELECT pt.*, u.first_name as created_by_first_name, u.last_name as created_by_last_name
            FROM plant_types pt
            JOIN users u ON pt.created_by = u.id
            WHERE pt.id = :id AND pt.is_active = 1
        ";
        $plantType = $this->db->fetchOne($sql, ['id' => $id]);

        if (!$plantType) {
            http_response_code(404);
            echo json_encode(['error' => 'Plant type not found']);
            return;
        }

        echo json_encode(['success' => true, 'data' => $plantType]);
    }

    public function store()
    {
        $user = Auth::requireRole('admin');
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validate required fields
        $requiredFields = ['name', 'harvest_cycle_days'];
        foreach ($requiredFields as $field) {
            if (!isset($input[$field]) || empty($input[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Field '{$field}' is required"]);
                return;
            }
        }

        try {
            $sql = "
                INSERT INTO plant_types (name, description, scientific_name, harvest_cycle_days, created_by)
                VALUES (:name, :description, :scientific_name, :harvest_cycle_days, :created_by)
            ";
            $params = [
                'name' => $input['name'],
                'description' => $input['description'] ?? null,
                'scientific_name' => $input['scientific_name'] ?? null,
                'harvest_cycle_days' => $input['harvest_cycle_days'],
                'created_by' => $user['user_id']
            ];
            $this->db->query($sql, $params);

            $plantTypeId = $this->db->lastInsertId();
            
            echo json_encode([
                'success' => true,
                'message' => 'Plant type created successfully',
                'data' => ['id' => $plantTypeId]
            ]);

        } catch (\PDOException $e) {
            if ($e->getCode() == 23000) { // Duplicate entry
                http_response_code(409);
                echo json_encode(['error' => 'Plant type with this name already exists']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to create plant type']);
            }
        }
    }

    public function update($id)
    {
        $user = Auth::requireRole('admin');
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Check if plant type exists
        $checkSql = "SELECT id FROM plant_types WHERE id = :id AND is_active = 1";
        $existingPlantType = $this->db->fetchOne($checkSql, ['id' => $id]);
        if (!$existingPlantType) {
            http_response_code(404);
            echo json_encode(['error' => 'Plant type not found']);
            return;
        }

        try {
            $updateFields = [];
            $params = ['id' => $id];
            
            if (isset($input['name'])) {
                $updateFields[] = "name = :name";
                $params['name'] = $input['name'];
            }
            if (isset($input['description'])) {
                $updateFields[] = "description = :description";
                $params['description'] = $input['description'];
            }
            if (isset($input['scientific_name'])) {
                $updateFields[] = "scientific_name = :scientific_name";
                $params['scientific_name'] = $input['scientific_name'];
            }
            if (isset($input['harvest_cycle_days'])) {
                $updateFields[] = "harvest_cycle_days = :harvest_cycle_days";
                $params['harvest_cycle_days'] = $input['harvest_cycle_days'];
            }
            
            if (empty($updateFields)) {
                http_response_code(400);
                echo json_encode(['error' => 'No fields to update']);
                return;
            }
            
            $sql = "UPDATE plant_types SET " . implode(', ', $updateFields) . " WHERE id = :id";
            $this->db->query($sql, $params);
            
            echo json_encode(['success' => true, 'message' => 'Plant type updated successfully']);

        } catch (\PDOException $e) {
            if ($e->getCode() == 23000) {
                http_response_code(409);
                echo json_encode(['error' => 'Plant type with this name already exists']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to update plant type']);
            }
        }
    }

    public function delete($id)
    {
        $user = Auth::requireRole('admin');
        
        // Check if plant type is being used by any lands
        $checkSql = "SELECT COUNT(*) as count FROM lands WHERE plant_type_id = :id AND is_active = 1";
        $result = $this->db->fetchOne($checkSql, ['id' => $id]);
        $count = $result['count'] ?? 0;
        
        if ($count > 0) {
            http_response_code(409);
            echo json_encode(['error' => 'Cannot delete plant type that is being used by lands']);
            return;
        }
        
        // Soft delete
        $sql = "UPDATE plant_types SET is_active = 0 WHERE id = :id";
        $this->db->query($sql, ['id' => $id]);
        
        echo json_encode(['success' => true, 'message' => 'Plant type deleted successfully']);
    }
}