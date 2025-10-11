<?php

namespace App;

class FarmWork
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function create($data)
    {
        // Get default work status if not provided
        $workStatusId = $data['work_status_id'] ?? $this->getDefaultWorkStatusId();
        
        $sql = "INSERT INTO farm_works (
                    title, description, land_id, work_type_id, priority_level, 
                    status, work_status_id, creator_user_id, assigner_user_id, assigned_team_id, 
                    assigned_date, due_date, started_date, completed_date, metadata
                ) VALUES (
                    :title, :description, :land_id, :work_type_id, :priority_level,
                    :status, :work_status_id, :creator_user_id, :assigner_user_id, :assigned_team_id,
                    :assigned_date, :due_date, :started_date, :completed_date, :metadata
                )";

        $params = [
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'land_id' => $data['land_id'] ?? null,
            'work_type_id' => $data['work_type_id'],
            'priority_level' => $data['priority_level'] ?? 'medium',
            'status' => $data['status'] ?? 'created',
            'work_status_id' => $workStatusId,
            'creator_user_id' => $data['creator_user_id'],
            'assigner_user_id' => $data['assigner_user_id'] ?? null,
            'assigned_team_id' => $data['assigned_team_id'] ?? null,
            'assigned_date' => $data['assigned_date'] ?? null,
            'due_date' => $data['due_date'] ?? null,
            'started_date' => $data['started_date'] ?? null,
            'completed_date' => $data['completed_date'] ?? null,
            'metadata' => isset($data['metadata']) ? (is_array($data['metadata']) ? json_encode($data['metadata']) : $data['metadata']) : '{}'
        ];

        $this->db->query($sql, $params);
        $workId = $this->db->lastInsertId();
        
        // Log the initial status creation
        $this->logStatusChange($workId, $data['creator_user_id'], null, 'created', 'Work created');
        
        return $this->findById($workId);
    }

    public function findById($id)
    {
        $sql = "SELECT * FROM v_farm_works_detailed WHERE id = :id";
        return $this->db->fetchOne($sql, ['id' => $id]);
    }

    public function getAll($filters = [])
    {
        $sql = "SELECT * FROM v_farm_works_detailed WHERE 1=1";
        $params = [];

        if (isset($filters['status'])) {
            $sql .= " AND status = :status";
            $params['status'] = $filters['status'];
        }

        if (isset($filters['priority_level'])) {
            $sql .= " AND priority_level = :priority_level";
            $params['priority_level'] = $filters['priority_level'];
        }

        if (isset($filters['assigned_team_id'])) {
            $sql .= " AND assigned_team_id = :assigned_team_id";
            $params['assigned_team_id'] = $filters['assigned_team_id'];
        }

        if (isset($filters['land_id'])) {
            $sql .= " AND land_id = :land_id";
            $params['land_id'] = $filters['land_id'];
        }

        if (isset($filters['work_type_id'])) {
            $sql .= " AND work_type_id = :work_type_id";
            $params['work_type_id'] = $filters['work_type_id'];
        }

        if (isset($filters['due_status'])) {
            $sql .= " AND due_status = :due_status";
            $params['due_status'] = $filters['due_status'];
        }

        if (isset($filters['creator_user_id'])) {
            $sql .= " AND creator_user_id = :creator_user_id";
            $params['creator_user_id'] = $filters['creator_user_id'];
        }

        $sql .= " ORDER BY 
                    CASE priority_level 
                        WHEN 'critical' THEN 1 
                        WHEN 'high' THEN 2 
                        WHEN 'medium' THEN 3 
                        WHEN 'low' THEN 4 
                    END,
                    due_date IS NULL, due_date ASC,
                    created_at DESC";
        
        return $this->db->fetchAll($sql, $params);
    }

    public function update($id, $data)
    {
        // Get current status before update
        $currentWork = $this->findById($id);
        $previousStatus = $currentWork['status'];

        $fields = [];
        $params = ['id' => $id];

        foreach ($data as $key => $value) {
            if ($key === 'title') {
                $fields[] = 'title = :title';
                $params['title'] = $value;
            } elseif ($key === 'description') {
                $fields[] = 'description = :description';
                $params['description'] = $value;
            } elseif ($key === 'land_id') {
                $fields[] = 'land_id = :land_id';
                $params['land_id'] = $value;
            } elseif ($key === 'work_type_id') {
                $fields[] = 'work_type_id = :work_type_id';
                $params['work_type_id'] = $value;
            } elseif ($key === 'priority_level') {
                $fields[] = 'priority_level = :priority_level';
                $params['priority_level'] = $value;
            } elseif ($key === 'status') {
                $fields[] = 'status = :status';
                $params['status'] = $value;
                
                // Set appropriate dates based on status change
                if ($value === 'assigned' && !$currentWork['assigned_date']) {
                    $fields[] = 'assigned_date = NOW()';
                } elseif ($value === 'in_progress' && !$currentWork['started_date']) {
                    $fields[] = 'started_date = NOW()';
                } elseif ($value === 'completed' && !$currentWork['completed_date']) {
                    $fields[] = 'completed_date = NOW()';
                }
            } elseif ($key === 'work_status_id') {
                $fields[] = 'work_status_id = :work_status_id';
                $params['work_status_id'] = (int) $value;
            } elseif ($key === 'assigner_user_id') {
                $fields[] = 'assigner_user_id = :assigner_user_id';
                $params['assigner_user_id'] = $value;
            } elseif ($key === 'assigned_team_id') {
                $fields[] = 'assigned_team_id = :assigned_team_id';
                $params['assigned_team_id'] = $value;
            } elseif ($key === 'assigned_date') {
                $fields[] = 'assigned_date = :assigned_date';
                $params['assigned_date'] = $value;
            } elseif ($key === 'due_date') {
                $fields[] = 'due_date = :due_date';
                $params['due_date'] = $value;
            } elseif ($key === 'started_date') {
                $fields[] = 'started_date = :started_date';
                $params['started_date'] = $value;
            } elseif ($key === 'completed_date') {
                $fields[] = 'completed_date = :completed_date';
                $params['completed_date'] = $value;
            }
        }

        if (empty($fields)) {
            return $this->findById($id);
        }

        $fields[] = 'updated_at = NOW()';
        $sql = "UPDATE farm_works SET " . implode(', ', $fields) . " WHERE id = :id";
        
        $this->db->query($sql, $params);
        
        // Log status change if status was updated
        if (isset($data['status']) && $data['status'] !== $previousStatus) {
            $changeNote = $data['status_change_note'] ?? "Status changed from {$previousStatus} to {$data['status']}";
            $changedBy = $data['changed_by_user_id'] ?? $currentWork['creator_user_id'];
            $this->logStatusChange($id, $changedBy, $previousStatus, $data['status'], $changeNote);
            
            // Sync with harvest notifications if this is a harvest-related farm work
            $this->syncWithHarvestNotifications($id);
        }
        
        return $this->findById($id);
    }

    public function delete($id)
    {
        $sql = "DELETE FROM farm_works WHERE id = :id";
        $this->db->query($sql, ['id' => $id]);
        return true;
    }

    /**
     * Sync farm work status with related harvest notifications
     */
    private function syncWithHarvestNotifications($farmWorkId)
    {
        try {
            // Check if this farm work was created from a harvest notification
            $farmWork = $this->findById($farmWorkId);
            if (!$farmWork) {
                return false;
            }

            // Check if this is a harvest-related farm work
            $metadata = json_decode($farmWork['metadata'] ?? '{}', true);
            if (!isset($metadata['created_from']) || $metadata['created_from'] !== 'harvest_notification') {
                return false;
            }

            // Use HarvestNotificationService to sync
            $harvestService = new \App\HarvestNotificationService();
            return $harvestService->syncNotificationWithFarmWork($farmWorkId);

        } catch (\Exception $e) {
            error_log("Error syncing farm work {$farmWorkId} with harvest notifications: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get default work status ID (created status)
     */
    private function getDefaultWorkStatusId()
    {
        $status = $this->db->fetchOne(
            "SELECT id FROM work_statuses WHERE name = 'created' AND is_active = 1 LIMIT 1"
        );
        
        return $status ? $status['id'] : 1; // Fallback to ID 1 if not found
    }

    public function logStatusChange($workId, $changedByUserId, $previousStatus, $currentStatus, $changeNote = null)
    {
        $sql = "INSERT INTO work_status_audit (
                    work_id, changed_by_user_id, previous_status, current_status, change_note
                ) VALUES (
                    :work_id, :changed_by_user_id, :previous_status, :current_status, :change_note
                )";

        $params = [
            'work_id' => $workId,
            'changed_by_user_id' => $changedByUserId,
            'previous_status' => $previousStatus,
            'current_status' => $currentStatus,
            'change_note' => $changeNote
        ];

        $this->db->query($sql, $params);
        return $this->db->lastInsertId();
    }

    public function getStatusHistory($workId)
    {
        $sql = "SELECT wsa.*, 
                       CONCAT(u.first_name, ' ', u.last_name) as changed_by_name
                FROM work_status_audit wsa
                JOIN users u ON wsa.changed_by_user_id = u.id
                WHERE wsa.work_id = :work_id
                ORDER BY wsa.changed_at DESC";
        
        return $this->db->fetchAll($sql, ['work_id' => $workId]);
    }

    public function getTeamWorkloadStatus()
    {
        $sql = "SELECT * FROM v_team_workload_status ORDER BY team_name";
        return $this->db->fetchAll($sql);
    }

    public function formatFarmWork($work)
    {
        return [
            'id' => (int) $work['id'],
            'title' => $work['title'],
            'description' => $work['description'],
            'landId' => $work['land_id'] ? (int) $work['land_id'] : null,
            'landName' => $work['land_name'],
            'landCode' => $work['land_code'],
            'workTypeId' => (int) $work['work_type_id'],
            'workTypeName' => $work['work_type_name'],
            'workTypeIcon' => $work['work_type_icon'],
            'categoryId' => (int) $work['category_id'],
            'categoryName' => $work['category_name'],
            'categoryColor' => $work['category_color'],
            'categoryIcon' => $work['category_icon'],
            'priorityLevel' => $work['priority_level'],
            'status' => $work['status'],
            'creatorUserId' => (int) $work['creator_user_id'],
            'creatorName' => $work['creator_name'],
            'assignerUserId' => $work['assigner_user_id'] ? (int) $work['assigner_user_id'] : null,
            'assignerName' => $work['assigner_name'],
            'assignedTeamId' => $work['assigned_team_id'] ? (int) $work['assigned_team_id'] : null,
            'assignedTeamName' => $work['assigned_team_name'],
            'assignedDate' => $work['assigned_date'],
            'dueDate' => $work['due_date'],
            'startedDate' => $work['started_date'],
            'completedDate' => $work['completed_date'],
            'dueStatus' => $work['due_status'],
            'createdAt' => $work['created_at'],
            'updatedAt' => $work['updated_at']
        ];
    }
}
