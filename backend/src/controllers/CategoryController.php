<?php

namespace App\Controllers;

use App\Auth;
use App\Database;

class CategoryController
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
            SELECT c.*, u.first_name as created_by_first_name, u.last_name as created_by_last_name
            FROM categories c
            JOIN users u ON c.created_by = u.id
            WHERE c.is_active = 1
            ORDER BY c.name
        ";
        $categories = $this->db->fetchAll($sql);

        echo json_encode(['success' => true, 'data' => $categories]);
    }

    public function show($id)
    {
        $user = Auth::requireAuth();
        
        $sql = "
            SELECT c.*, u.first_name as created_by_first_name, u.last_name as created_by_last_name
            FROM categories c
            JOIN users u ON c.created_by = u.id
            WHERE c.id = :id AND c.is_active = 1
        ";
        $category = $this->db->fetchOne($sql, ['id' => $id]);

        if (!$category) {
            http_response_code(404);
            echo json_encode(['error' => 'Category not found']);
            return;
        }

        echo json_encode(['success' => true, 'data' => $category]);
    }

    public function store()
    {
        $user = Auth::requireRole('admin');
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validate required fields
        if (!isset($input['name']) || empty($input['name'])) {
            http_response_code(400);
            echo json_encode(['error' => "Field 'name' is required"]);
            return;
        }

        try {
            $sql = "
                INSERT INTO categories (name, description, color, created_by)
                VALUES (:name, :description, :color, :created_by)
            ";
            $params = [
                'name' => $input['name'],
                'description' => $input['description'] ?? null,
                'color' => $input['color'] ?? '#4285F4',
                'created_by' => $user['user_id']
            ];
            $this->db->query($sql, $params);

            $categoryId = $this->db->lastInsertId();
            
            echo json_encode([
                'success' => true,
                'message' => 'Category created successfully',
                'data' => ['id' => $categoryId]
            ]);

        } catch (\PDOException $e) {
            if ($e->getCode() == 23000) {
                http_response_code(409);
                echo json_encode(['error' => 'Category with this name already exists']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to create category']);
            }
        }
    }

    public function update($id)
    {
        $user = Auth::requireRole('admin');
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Check if category exists
        $checkSql = "SELECT id FROM categories WHERE id = :id AND is_active = 1";
        $existingCategory = $this->db->fetchOne($checkSql, ['id' => $id]);
        if (!$existingCategory) {
            http_response_code(404);
            echo json_encode(['error' => 'Category not found']);
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
            if (isset($input['color'])) {
                $updateFields[] = "color = :color";
                $params['color'] = $input['color'];
            }
            
            if (empty($updateFields)) {
                http_response_code(400);
                echo json_encode(['error' => 'No fields to update']);
                return;
            }
            
            $sql = "UPDATE categories SET " . implode(', ', $updateFields) . " WHERE id = :id";
            $this->db->query($sql, $params);
            
            echo json_encode(['success' => true, 'message' => 'Category updated successfully']);

        } catch (\PDOException $e) {
            if ($e->getCode() == 23000) {
                http_response_code(409);
                echo json_encode(['error' => 'Category with this name already exists']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to update category']);
            }
        }
    }

    public function delete($id)
    {
        $user = Auth::requireRole('admin');
        
        // Check if category is being used by any lands
        $checkSql = "SELECT COUNT(*) as count FROM lands WHERE category_id = :id AND is_active = 1";
        $result = $this->db->fetchOne($checkSql, ['id' => $id]);
        $count = $result['count'] ?? 0;
        
        if ($count > 0) {
            http_response_code(409);
            echo json_encode(['error' => 'Cannot delete category that is being used by lands']);
            return;
        }
        
        // Soft delete
        $sql = "UPDATE categories SET is_active = 0 WHERE id = :id";
        $this->db->query($sql, ['id' => $id]);
        
        echo json_encode(['success' => true, 'message' => 'Category deleted successfully']);
    }
}