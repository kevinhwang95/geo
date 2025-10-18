<?php

namespace App\Controllers;

use App\Auth;
use App\WorkStatus;

class WorkStatusController
{
    private $workStatus;

    public function __construct()
    {
        $this->workStatus = new WorkStatus();
    }

    /**
     * Get all active work statuses
     */
    public function index()
    {
        try {
            Auth::requireAuth();
            
            $statuses = $this->workStatus->getAll();
            $formattedStatuses = array_map([$this->workStatus, 'formatWorkStatus'], $statuses);
            
            echo json_encode([
                'success' => true,
                'data' => $formattedStatuses
            ]);
        } catch (\Exception $e) {
            error_log("WorkStatusController::index error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to fetch work statuses'
            ]);
        }
    }

    /**
     * Get work status by ID
     */
    public function show($id)
    {
        try {
            Auth::requireAuth();
            
            $status = $this->workStatus->findById($id);
            
            if (!$status) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Work status not found'
                ]);
                return;
            }
            
            echo json_encode([
                'success' => true,
                'data' => $this->workStatus->formatWorkStatus($status)
            ]);
        } catch (\Exception $e) {
            error_log("WorkStatusController::show error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to fetch work status'
            ]);
        }
    }

    /**
     * Create new work status
     */
    public function store()
    {
        try {
            $userData = Auth::requireAnyRole(['admin', 'contributor']);
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Validate input
            $errors = $this->workStatus->validate($input);
            if (!empty($errors)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Validation failed',
                    'details' => $errors
                ]);
                return;
            }
            
            $status = $this->workStatus->create($input);
            
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'data' => $this->workStatus->formatWorkStatus($status)
            ]);
        } catch (\Exception $e) {
            error_log("WorkStatusController::store error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to create work status'
            ]);
        }
    }

    /**
     * Update work status
     */
    public function update($id)
    {
        try {
            $userData = Auth::requireAnyRole(['admin', 'contributor']);
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Validate input
            $errors = $this->workStatus->validate($input, true);
            if (!empty($errors)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Validation failed',
                    'details' => $errors
                ]);
                return;
            }
            
            $status = $this->workStatus->update($id, $input);
            
            if (!$status) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Work status not found'
                ]);
                return;
            }
            
            echo json_encode([
                'success' => true,
                'data' => $this->workStatus->formatWorkStatus($status)
            ]);
        } catch (\Exception $e) {
            error_log("WorkStatusController::update error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to update work status'
            ]);
        }
    }

    /**
     * Delete work status
     */
    public function delete($id)
    {
        try {
            $userData = Auth::requireAnyRole(['admin', 'contributor']);
            
            $status = $this->workStatus->findById($id);
            
            if (!$status) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Work status not found'
                ]);
                return;
            }
            
            $this->workStatus->delete($id);
            
            echo json_encode([
                'success' => true,
                'message' => 'Work status deleted successfully'
            ]);
        } catch (\Exception $e) {
            error_log("WorkStatusController::delete error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to delete work status'
            ]);
        }
    }

    /**
     * Get final statuses
     */
    public function getFinalStatuses()
    {
        try {
            Auth::requireAuth();
            
            $statuses = $this->workStatus->getFinalStatuses();
            $formattedStatuses = array_map([$this->workStatus, 'formatWorkStatus'], $statuses);
            
            echo json_encode([
                'success' => true,
                'data' => $formattedStatuses
            ]);
        } catch (\Exception $e) {
            error_log("WorkStatusController::getFinalStatuses error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to fetch final statuses'
            ]);
        }
    }

    /**
     * Get non-final statuses
     */
    public function getNonFinalStatuses()
    {
        try {
            Auth::requireAuth();
            
            $statuses = $this->workStatus->getNonFinalStatuses();
            $formattedStatuses = array_map([$this->workStatus, 'formatWorkStatus'], $statuses);
            
            echo json_encode([
                'success' => true,
                'data' => $formattedStatuses
            ]);
        } catch (\Exception $e) {
            error_log("WorkStatusController::getNonFinalStatuses error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to fetch non-final statuses'
            ]);
        }
    }

    /**
     * Get status statistics
     */
    public function getStatistics()
    {
        try {
            Auth::requireAuth();
            
            $statistics = $this->workStatus->getStatusStatistics();
            
            echo json_encode([
                'success' => true,
                'data' => $statistics
            ]);
        } catch (\Exception $e) {
            error_log("WorkStatusController::getStatistics error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to fetch status statistics'
            ]);
        }
    }
}






