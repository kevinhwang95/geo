<?php

namespace App\Controllers;

use App\Database;
use App\Auth;
use App\FarmWork;
use App\WorkCategory;
use App\WorkType;
use App\WorkNote;
use App\WorkCompletion;

class FarmWorkController
{
    private $db;
    private $farmWork;
    private $workCategory;
    private $workType;
    private $workNote;
    private $workCompletion;

    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->farmWork = new FarmWork();
        $this->workCategory = new WorkCategory();
        $this->workType = new WorkType();
        $this->workNote = new WorkNote();
        $this->workCompletion = new WorkCompletion();
    }

    /**
     * Get all farm works with optional filtering
     */
    public function index()
    {
        try {
            Auth::requireAuth();
            
            $filters = [];
            
            // Apply filters from query parameters
            if (isset($_GET['status'])) {
                $filters['status'] = $_GET['status'];
            }
            if (isset($_GET['priority_level'])) {
                $filters['priority_level'] = $_GET['priority_level'];
            }
            if (isset($_GET['assigned_team_id'])) {
                $filters['assigned_team_id'] = $_GET['assigned_team_id'];
            }
            if (isset($_GET['land_id'])) {
                $filters['land_id'] = $_GET['land_id'];
            }
            if (isset($_GET['work_type_id'])) {
                $filters['work_type_id'] = $_GET['work_type_id'];
            }
            if (isset($_GET['due_status'])) {
                $filters['due_status'] = $_GET['due_status'];
            }
            if (isset($_GET['creator_user_id'])) {
                $filters['creator_user_id'] = $_GET['creator_user_id'];
            }

            $works = $this->farmWork->getAll($filters);
            $formattedWorks = array_map([$this->farmWork, 'formatFarmWork'], $works);

            echo json_encode([
                'success' => true,
                'data' => $formattedWorks,
                'count' => count($formattedWorks)
            ]);

        } catch (\Exception $e) {
            error_log("FarmWorkController::index error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch farm works']);
        }
    }

    /**
     * Get a specific farm work by ID
     */
    public function show($id)
    {
        try {
            Auth::requireAuth();
            
            $work = $this->farmWork->findById($id);
            
            if (!$work) {
                http_response_code(404);
                echo json_encode(['error' => 'Farm work not found']);
                return;
            }

            $formattedWork = $this->farmWork->formatFarmWork($work);

            // Get status history
            $statusHistory = $this->farmWork->getStatusHistory($id);

            // Get work notes
            $notes = $this->workNote->getByWorkId($id);

            // Get work completions
            $completions = $this->workCompletion->getByWorkId($id);

            $includePhotos = isset($_GET['include_photos']) && $_GET['include_photos'] === 'true';

            echo json_encode([
                'success' => true,
                'data' => $formattedWork,
                'statusHistory' => $statusHistory,
                'notes' => array_map(function($note) use ($includePhotos) {
                    return $this->workNote->formatWorkNote($note, $includePhotos);
                }, $notes),
                'completions' => array_map(function($completion) use ($includePhotos) {
                    return $this->workCompletion->formatWorkCompletion($completion, $includePhotos);
                }, $completions)
            ]);

        } catch (\Exception $e) {
            error_log("FarmWorkController::show error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch farm work']);
        }
    }

    /**
     * Create a new farm work
     */
    public function store()
    {
        try {
            $user = Auth::requireAuth();
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid input']);
                return;
            }

            // Validate required fields
            $requiredFields = ['title', 'work_type_id'];
            foreach ($requiredFields as $field) {
                if (!isset($input[$field]) || empty($input[$field])) {
                    http_response_code(400);
                    echo json_encode(['error' => "Field '$field' is required"]);
                    return;
                }
            }

            // Set creator as current user
            $input['creator_user_id'] = $user['user_id'];

            $work = $this->farmWork->create($input);
            $formattedWork = $this->farmWork->formatFarmWork($work);

            echo json_encode([
                'success' => true,
                'message' => 'Farm work created successfully',
                'data' => $formattedWork
            ]);

        } catch (\Exception $e) {
            error_log("FarmWorkController::store error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create farm work']);
        }
    }

    /**
     * Update a farm work
     */
    public function update($id)
    {
        try {
            $user = Auth::requireAuth();
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid input']);
                return;
            }

            // Check if work exists
            $existingWork = $this->farmWork->findById($id);
            if (!$existingWork) {
                http_response_code(404);
                echo json_encode(['error' => 'Farm work not found']);
                return;
            }

            // Set changed_by_user_id for status change tracking
            $input['changed_by_user_id'] = $user['user_id'];

            $work = $this->farmWork->update($id, $input);
            $formattedWork = $this->farmWork->formatFarmWork($work);

            echo json_encode([
                'success' => true,
                'message' => 'Farm work updated successfully',
                'data' => $formattedWork
            ]);

        } catch (\Exception $e) {
            error_log("FarmWorkController::update error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update farm work']);
        }
    }

    /**
     * Delete a farm work
     */
    public function destroy($id)
    {
        try {
            Auth::requireAnyRole(['system', 'admin']);
            
            $work = $this->farmWork->findById($id);
            
            if (!$work) {
                http_response_code(404);
                echo json_encode(['error' => 'Farm work not found']);
                return;
            }

            $this->farmWork->delete($id);

            echo json_encode([
                'success' => true,
                'message' => 'Farm work deleted successfully'
            ]);

        } catch (\Exception $e) {
            error_log("FarmWorkController::destroy error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete farm work']);
        }
    }



    /**
     * Get team workload status
     */
    public function getTeamWorkloadStatus()
    {
        try {
            Auth::requireAnyRole(['system', 'admin']);
            
            $workloadStatus = $this->farmWork->getTeamWorkloadStatus();

            echo json_encode([
                'success' => true,
                'data' => $workloadStatus
            ]);

        } catch (\Exception $e) {
            error_log("FarmWorkController::getTeamWorkloadStatus error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch team workload status']);
        }
    }

    /**
     * Assign work to team
     */
    public function assignToTeam($id)
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
            if (!isset($input['team_id']) || !isset($input['due_date'])) {
                http_response_code(400);
                echo json_encode(['error' => 'team_id and due_date are required']);
                return;
            }

            $user = Auth::requireAuth();
            
            // Check if work exists
            $existingWork = $this->farmWork->findById($id);
            if (!$existingWork) {
                http_response_code(404);
                echo json_encode(['error' => 'Farm work not found']);
                return;
            }

            $updateData = [
                'assigned_team_id' => $input['team_id'],
                'assigner_user_id' => $user['user_id'],
                'assigned_date' => date('Y-m-d H:i:s'),
                'due_date' => $input['due_date'],
                'status' => 'assigned',
                'changed_by_user_id' => $user['user_id'],
                'status_change_note' => 'Work assigned to team'
            ];

            $work = $this->farmWork->update($id, $updateData);
            $formattedWork = $this->farmWork->formatFarmWork($work);

            echo json_encode([
                'success' => true,
                'message' => 'Work assigned to team successfully',
                'data' => $formattedWork
            ]);

        } catch (\Exception $e) {
            error_log("FarmWorkController::assignToTeam error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to assign work to team']);
        }
    }

    /**
     * Create work completion
     */
    public function completeWork($id)
    {
        try {
            $user = Auth::requireAuth();
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid input']);
                return;
            }

            // Validate required fields
            if (!isset($input['team_id']) || !isset($input['completion_note'])) {
                http_response_code(400);
                echo json_encode(['error' => 'team_id and completion_note are required']);
                return;
            }

            // Validate completion_date if provided
            $completionDate = $input['completion_date'] ?? date('Y-m-d H:i:s');
            if (isset($input['completion_date'])) {
                // Validate date format
                $dateTime = \DateTime::createFromFormat('Y-m-d\TH:i', $input['completion_date']);
                if (!$dateTime) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Invalid completion_date format. Use YYYY-MM-DDTHH:MM']);
                    return;
                }
                $completionDate = $dateTime->format('Y-m-d H:i:s');
            }

            // Check if work exists
            $existingWork = $this->farmWork->findById($id);
            if (!$existingWork) {
                http_response_code(404);
                echo json_encode(['error' => 'Farm work not found']);
                return;
            }

            // Create work completion record
            $completionData = [
                'work_id' => $id,
                'team_id' => $input['team_id'],
                'worker_count' => isset($input['workers']) ? count($input['workers']) : ($input['worker_count'] ?? 1),
                'completion_note' => $input['completion_note'],
                'completion_date' => $completionDate,
                'weight_of_product' => $input['weight_of_product'] ?? null,
                'truck_number' => $input['truck_number'] ?? null,
                'driver_name' => $input['driver_name'] ?? null,
                'completed_by_user_id' => $user['user_id']
            ];

            $completion = $this->workCompletion->create($completionData);

            // Add individual workers if provided
            if (isset($input['workers']) && is_array($input['workers'])) {
                $this->addWorkCompletionWorkers($completion['id'], $input['workers']);
            }

            // Update work status to completed
            $workUpdateData = [
                'status' => 'completed',
                'completed_date' => $completionDate, // Use the provided completion date
                'changed_by_user_id' => $user['user_id'],
                'status_change_note' => 'Work completed'
            ];

            $work = $this->farmWork->update($id, $workUpdateData);
            
            // Check if this is a Palm Oil harvest work and update harvest dates
            // Use the updated work data that includes the new completed_date
            $this->updateHarvestDatesIfPalmOilHarvest($work);

            $formattedWork = $this->farmWork->formatFarmWork($work);
            $formattedCompletion = $this->workCompletion->formatWorkCompletion($completion);

            echo json_encode([
                'success' => true,
                'message' => 'Work completed successfully',
                'data' => $formattedWork,
                'completion' => $formattedCompletion
            ]);

        } catch (\Exception $e) {
            error_log("FarmWorkController::completeWork error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to complete work']);
        }
    }

    /**
     * Get all work categories
     */
    public function getCategories()
    {
        try {
            Auth::requireAuth();
            
            // Check if work_categories table exists
            $tableExists = $this->db->fetchOne("SHOW TABLES LIKE 'work_categories'");
            
            if (!$tableExists) {
                // Return empty array if table doesn't exist
                echo json_encode([
                    'success' => true,
                    'data' => []
                ]);
                return;
            }
            
            $categories = $this->workCategory->getAll();
            $formattedCategories = array_map([$this->workCategory, 'formatWorkCategory'], $categories);
            
            echo json_encode([
                'success' => true,
                'data' => $formattedCategories
            ]);

        } catch (\Exception $e) {
            error_log("FarmWorkController::getCategories error: " . $e->getMessage());
            // Return empty array on error instead of error response
            echo json_encode([
                'success' => true,
                'data' => []
            ]);
        }
    }

    /**
     * Get all work types
     */
    public function getWorkTypes()
    {
        try {
            Auth::requireAuth();
            
            // Check if work_types table exists
            $tableExists = $this->db->fetchOne("SHOW TABLES LIKE 'work_types'");
            
            if (!$tableExists) {
                // Return empty array if table doesn't exist
                echo json_encode([
                    'success' => true,
                    'data' => []
                ]);
                return;
            }
            
            $workTypes = $this->workType->getAll();
            $formattedWorkTypes = array_map([$this->workType, 'formatWorkType'], $workTypes);
            
            echo json_encode([
                'success' => true,
                'data' => $formattedWorkTypes
            ]);

        } catch (\Exception $e) {
            error_log("FarmWorkController::getWorkTypes error: " . $e->getMessage());
            // Return empty array on error instead of error response
            echo json_encode([
                'success' => true,
                'data' => []
            ]);
        }
    }

    /**
     * Update harvest dates if this is a Palm Oil harvest work
     */
    private function updateHarvestDatesIfPalmOilHarvest($work)
    {
        try {
            // Check if this work has a land_id
            if (!$work['land_id']) {
                return; // No land associated, skip harvest date update
            }

            // Get land and plant type information
            $landInfo = $this->getLandWithPlantType($work['land_id']);
            if (!$landInfo) {
                error_log("Land not found for work ID: " . $work['id']);
                return;
            }

            // Check if this is Palm Oil (plant_type_id = 3 or name contains 'palm oil')
            $isPalmOil = false;
            if (isset($landInfo['plant_type_id']) && $landInfo['plant_type_id'] == 3) {
                $isPalmOil = true;
            } elseif (isset($landInfo['plant_type_name']) && 
                     stripos($landInfo['plant_type_name'], 'palm oil') !== false) {
                $isPalmOil = true;
            }

            if (!$isPalmOil) {
                return; // Not Palm Oil, skip harvest date update
            }

            // Check if this is a harvest work type
            $isHarvestWork = false;
            if (isset($work['work_type_name']) && 
                stripos($work['work_type_name'], 'harvest') !== false) {
                $isHarvestWork = true;
            }

            if (!$isHarvestWork) {
                return; // Not a harvest work, skip harvest date update
            }

            // Update harvest dates using the actual completion date
            $harvestCompletionDate = $work['completed_date'] ?? date('Y-m-d H:i:s');
            $nextHarvestDate = $this->calculateNextHarvestDate($harvestCompletionDate, 18); // 18 days from completion

            $this->updateLandHarvestDates($work['land_id'], $harvestCompletionDate, $nextHarvestDate);

            error_log("Updated harvest dates for Palm Oil harvest work ID: " . $work['id'] . 
                     " - Previous harvest: " . $harvestCompletionDate . 
                     " - Next harvest: " . $nextHarvestDate);

        } catch (\Exception $e) {
            error_log("Error updating harvest dates for work ID " . $work['id'] . ": " . $e->getMessage());
        }
    }

    /**
     * Get land information with plant type details
     */
    private function getLandWithPlantType($landId)
    {
        $sql = "SELECT l.*, 
                       pt.id as plant_type_id, 
                       pt.name as plant_type_name,
                       pt.harvest_cycle_days
                FROM lands l 
                LEFT JOIN plant_types pt ON l.plant_type_id = pt.id
                WHERE l.id = :land_id AND l.is_active = 1";
        
        return $this->db->fetchOne($sql, ['land_id' => $landId]);
    }

    /**
     * Calculate next harvest date by adding days to the completion date
     */
    private function calculateNextHarvestDate($completionDate, $daysToAdd)
    {
        $date = new \DateTime($completionDate);
        $date->add(new \DateInterval('P' . $daysToAdd . 'D'));
        return $date->format('Y-m-d H:i:s');
    }

    /**
     * Update land harvest dates
     */
    private function updateLandHarvestDates($landId, $previousHarvestDate, $nextHarvestDate)
    {
        $sql = "UPDATE lands 
                SET previous_harvest_date = :previous_harvest_date,
                    next_harvest_date = :next_harvest_date,
                    updated_at = NOW()
                WHERE id = :land_id";
        
        $params = [
            'land_id' => $landId,
            'previous_harvest_date' => $previousHarvestDate,
            'next_harvest_date' => $nextHarvestDate
        ];

        $this->db->query($sql, $params);
    }

    /**
     * Add individual workers to work completion
     */
    private function addWorkCompletionWorkers($completionId, $workers)
    {
        foreach ($workers as $worker) {
            $sql = "INSERT INTO work_completion_workers (
                        completion_id, user_id
                    ) VALUES (
                        :completion_id, :user_id
                    )";

            $params = [
                'completion_id' => $completionId,
                'user_id' => $worker['userId']
            ];

            $this->db->query($sql, $params);
        }
    }

    /**
     * Test endpoint to check if controller is working
     */
    public function test()
    {
        try {
            echo json_encode([
                'success' => true,
                'message' => 'FarmWorkController is working',
                'timestamp' => date('Y-m-d H:i:s')
            ]);
        } catch (\Exception $e) {
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }
}
?>
