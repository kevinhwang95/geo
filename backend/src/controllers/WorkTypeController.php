<?php

namespace App\Controllers;

use App\Auth;
use App\WorkType;

class WorkTypeController
{
    private $workType;

    public function __construct()
    {
        $this->workType = new WorkType();
    }

    /**
     * Get all active work types
     */
    public function index()
    {
        try {
            Auth::requireAuth();
            
            $workTypes = $this->workType->getAll();
            $formattedWorkTypes = array_map([$this->workType, 'formatWorkType'], $workTypes);
            
            echo json_encode([
                'success' => true,
                'data' => $formattedWorkTypes
            ]);
        } catch (\Exception $e) {
            error_log("WorkTypeController::index error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to fetch work types'
            ]);
        }
    }

    /**
     * Get work type by ID
     */
    public function show($id)
    {
        try {
            Auth::requireAuth();
            
            $workType = $this->workType->findById($id);
            
            if (!$workType) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Work type not found'
                ]);
                return;
            }
            
            echo json_encode([
                'success' => true,
                'data' => $this->workType->formatWorkType($workType)
            ]);
        } catch (\Exception $e) {
            error_log("WorkTypeController::show error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to fetch work type'
            ]);
        }
    }

    /**
     * Create new work type
     */
    public function store()
    {
        try {
            $userData = Auth::requireAnyRole(['admin', 'contributor']);
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Validate input
            $errors = $this->workType->validate($input);
            if (!empty($errors)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Validation failed',
                    'details' => $errors
                ]);
                return;
            }
            
            $workType = $this->workType->create($input);
            
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'data' => $this->workType->formatWorkType($workType)
            ]);
        } catch (\Exception $e) {
            error_log("WorkTypeController::store error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to create work type'
            ]);
        }
    }

    /**
     * Update work type
     */
    public function update($id)
    {
        try {
            $userData = Auth::requireAnyRole(['admin', 'contributor']);
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Validate input
            $errors = $this->workType->validate($input, true);
            if (!empty($errors)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Validation failed',
                    'details' => $errors
                ]);
                return;
            }
            
            $workType = $this->workType->update($id, $input);
            
            if (!$workType) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Work type not found'
                ]);
                return;
            }
            
            echo json_encode([
                'success' => true,
                'data' => $this->workType->formatWorkType($workType)
            ]);
        } catch (\Exception $e) {
            error_log("WorkTypeController::update error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to update work type'
            ]);
        }
    }

    /**
     * Delete work type
     */
    public function destroy($id)
    {
        try {
            $userData = Auth::requireAnyRole(['admin', 'contributor']);
            
            $workType = $this->workType->findById($id);
            
            if (!$workType) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Work type not found'
                ]);
                return;
            }
            
            $this->workType->delete($id);
            
            echo json_encode([
                'success' => true,
                'message' => 'Work type deleted successfully'
            ]);
        } catch (\Exception $e) {
            error_log("WorkTypeController::destroy error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to delete work type'
            ]);
        }
    }

    /**
     * Get work types by category
     */
    public function getByCategory($categoryId)
    {
        try {
            Auth::requireAuth();
            
            $workTypes = $this->workType->getByCategoryId($categoryId);
            $formattedWorkTypes = array_map([$this->workType, 'formatWorkType'], $workTypes);
            
            echo json_encode([
                'success' => true,
                'data' => $formattedWorkTypes
            ]);
        } catch (\Exception $e) {
            error_log("WorkTypeController::getByCategory error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to fetch work types by category'
            ]);
        }
    }
}



