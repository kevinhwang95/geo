<?php

namespace App\Controllers;

use App\Auth;
use App\WorkAssignment;

class WorkAssignmentController
{
    private $workAssignmentModel;

    public function __construct()
    {
        $this->workAssignmentModel = new WorkAssignment();
    }

    public function index()
    {
        Auth::requireAnyRole(['admin', 'contributor']);
        
        $filters = [];
        
        // Add filters from query parameters
        if (isset($_GET['status'])) {
            $filters['status'] = $_GET['status'];
        }
        if (isset($_GET['team_id'])) {
            $filters['team_id'] = $_GET['team_id'];
        }
        if (isset($_GET['assigned_to_user_id'])) {
            $filters['assigned_to_user_id'] = $_GET['assigned_to_user_id'];
        }
        
        $assignments = $this->workAssignmentModel->getAll($filters);
        $formattedAssignments = array_map([$this->workAssignmentModel, 'formatWorkAssignment'], $assignments);
        
        echo json_encode($formattedAssignments);
    }

    public function show($id)
    {
        Auth::requireAnyRole(['admin', 'contributor']);
        
        $assignment = $this->workAssignmentModel->findById($id);
        
        if (!$assignment) {
            http_response_code(404);
            echo json_encode(['error' => 'Work assignment not found']);
            return;
        }

        echo json_encode($this->workAssignmentModel->formatWorkAssignment($assignment));
    }

    public function store()
    {
        Auth::requireAnyRole(['admin', 'contributor']);
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        $requiredFields = ['title'];

        foreach ($requiredFields as $field) {
            if (!isset($input[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Field {$field} is required"]);
                return;
            }
        }

        // Validate that either team_id or assigned_to_user_id is provided, but not both
        if (!isset($input['team_id']) && !isset($input['assigned_to_user_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Either team_id or assigned_to_user_id must be provided']);
            return;
        }

        if (isset($input['team_id']) && isset($input['assigned_to_user_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Cannot assign to both team and individual user']);
            return;
        }

        $input['assigned_by_user_id'] = Auth::requireAuth()['user_id'];
        
        try {
            $assignment = $this->workAssignmentModel->create($input);
            http_response_code(201);
            echo json_encode($this->workAssignmentModel->formatWorkAssignment($assignment));
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create work assignment: ' . $e->getMessage()]);
        }
    }

    public function update($id)
    {
        Auth::requireAnyRole(['admin', 'contributor']);
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        try {
            $assignment = $this->workAssignmentModel->update($id, $input);
            echo json_encode($this->workAssignmentModel->formatWorkAssignment($assignment));
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update work assignment: ' . $e->getMessage()]);
        }
    }

    public function delete($id)
    {
        Auth::requireAnyRole(['admin', 'contributor']);
        
        try {
            $this->workAssignmentModel->delete($id);
            http_response_code(204);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete work assignment: ' . $e->getMessage()]);
        }
    }
}
