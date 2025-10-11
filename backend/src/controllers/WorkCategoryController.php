<?php

namespace App\Controllers;

use App\Auth;
use App\WorkCategory;

class WorkCategoryController
{
    private $workCategory;

    public function __construct()
    {
        $this->workCategory = new WorkCategory();
    }

    public function index()
    {
        try {
            Auth::requireAuth();
            
            $categories = $this->workCategory->getAll();
            $formattedCategories = array_map([$this->workCategory, 'formatWorkCategory'], $categories);
            
            echo json_encode([
                'success' => true,
                'data' => $formattedCategories
            ]);

        } catch (\Exception $e) {
            error_log("WorkCategoryController::index error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch work categories']);
        }
    }

    public function show($id)
    {
        try {
            Auth::requireAuth();
            
            $category = $this->workCategory->findById($id);
            
            if (!$category) {
                http_response_code(404);
                echo json_encode(['error' => 'Work category not found']);
                return;
            }

            $formattedCategory = $this->workCategory->formatWorkCategory($category);

            echo json_encode([
                'success' => true,
                'data' => $formattedCategory
            ]);

        } catch (\Exception $e) {
            error_log("WorkCategoryController::show error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch work category']);
        }
    }

    public function store()
    {
        try {
            Auth::requireAnyRole(['system', 'admin']);
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid input']);
                return;
            }

            // Validate required fields
            if (!isset($input['name']) || empty($input['name'])) {
                http_response_code(400);
                echo json_encode(['error' => "Field 'name' is required"]);
                return;
            }

            $category = $this->workCategory->create($input);
            $formattedCategory = $this->workCategory->formatWorkCategory($category);

            echo json_encode([
                'success' => true,
                'message' => 'Work category created successfully',
                'data' => $formattedCategory
            ]);

        } catch (\Exception $e) {
            error_log("WorkCategoryController::store error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create work category']);
        }
    }

    public function update($id)
    {
        try {
            Auth::requireAnyRole(['system', 'admin']);
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid input']);
                return;
            }

            // Check if category exists
            $existingCategory = $this->workCategory->findById($id);
            if (!$existingCategory) {
                http_response_code(404);
                echo json_encode(['error' => 'Work category not found']);
                return;
            }

            $category = $this->workCategory->update($id, $input);
            $formattedCategory = $this->workCategory->formatWorkCategory($category);

            echo json_encode([
                'success' => true,
                'message' => 'Work category updated successfully',
                'data' => $formattedCategory
            ]);

        } catch (\Exception $e) {
            error_log("WorkCategoryController::update error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update work category']);
        }
    }

    public function destroy($id)
    {
        try {
            Auth::requireAnyRole(['system', 'admin']);
            
            $category = $this->workCategory->findById($id);
            
            if (!$category) {
                http_response_code(404);
                echo json_encode(['error' => 'Work category not found']);
                return;
            }

            $this->workCategory->delete($id);

            echo json_encode([
                'success' => true,
                'message' => 'Work category deleted successfully'
            ]);

        } catch (\Exception $e) {
            error_log("WorkCategoryController::destroy error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete work category']);
        }
    }
}
